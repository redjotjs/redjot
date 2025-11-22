**redjot** is a project which provides **[unified]**-compatible
libraries for working with Djot.  It allows to plug Djot files into
existing conversion pipelines.  For example, `redjot-rehype` can be used
to convert djast (redjot version of Djot AST) into [hast] for further
processing with a large number of existing [rehype plugins][rp].  Here's
a quick example:

```javascript
import { unified } from "unified"
import redjotParse from "redjot-parse"
import redjotRehype from "redjot-rehype"
import rehypeStringify from "rehype-stringify"
import rehypeRaw from "rehype-raw"

const djot = `Hello from ^D^j~o~t`

const processor = unified()
	.use(redjotParse)
	.use(redjotRehype, {
		allowDangerousHtml: true,
	})
	.use(rehypeRaw)
	.use(rehypeStringify)

const html = await processor.process(djot)

console.log(String(html))
```

Which will print `<p>Hello from <sup>D</sup>j<sub>o</sub>t</p>` or
"Hello from <sup>D</sup>j<sub>o</sub>t" rendered.


## Packages

This monorepo contains the low-level `djast` packages, which operate on
the unified-compatible Djot AST:

- [`djast`](packages/djast): AST definition
- [`djast-util-from-djot`](packages/djast-util-from-djot): Djot parser
- [`djast-util-to-hast`](packages/djast-util-to-hast): Conversion from
  djast to hast

And the high-level `redjot` packages for the `unified` processor API:

- [`redjot-parse`](packages/redjot-parse): wraps `djast-util-from-djot`
- [`redjot-rehype`](packages/redjot-rehype): wraps `djast-util-to-hast`
- [`redjot-metadata`](packages/redjot-metadata): parses embedded JSON
  front matter


[unified]: https://unifiedjs.com/
[hast]: https://github.com/syntax-tree/hast
[rp]: https://github.com/rehypejs/awesome-rehype

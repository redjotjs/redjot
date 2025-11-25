# `djast`

**Dj**ot **A**bstract **S**yntax **T**ree format.

This tree is compatible with [unist], namely its [node interfaces][ni].
The actual structure mostly mirrors the AST definitions of
[Djot.js][dj], as that's the parser used by [redjot-parse][rp].  See the
[module documentation][md] for a full list of all interfaces.
[`AstNode`][an] is a good entrypoint, as it's a union of all concrete
AST interfaces.


[unist]: https://github.com/syntax-tree/unist
[ni]: https://github.com/syntax-tree/unist?tab=readme-ov-file#nodes
[dj]: https://github.com/jgm/djot.js/blob/main/src/ast.ts
[rp]: ../redjot-parse
[dm]: https://redjot.kaathewise.net/modules/djast.html
[an]: https://redjot.kaathewise.net/types/djast.AstNode.html

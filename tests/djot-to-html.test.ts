import assert from "node:assert/strict"
import { describe, it } from "node:test"
import type { Options } from "djast-util-to-hast"
import redjotParse from "redjot-parse"
import redjotRehype from "redjot-rehype"
import rehypeStringify from "rehype-stringify"
import { unified } from "unified"

const SMART_PUNCTUATION: Options["smartPunctuation"] = {
	left_single_quote: "\u2018",
	right_single_quote: "\u2019",
	left_double_quote: "\u201C",
	right_double_quote: "\u201D",
	ellipses: "\u2026",
	en_dash: "\u2013",
	em_dash: "\u2014",
}

async function toHtml(
	input: string,
	opts?: { smartPunctuation: Options["smartPunctuation"] },
): Promise<string> {
	const processor = unified()
		.use(redjotParse)
		.use(redjotRehype, null, opts as Options | undefined)
		.use(rehypeStringify)
	const result = await processor.process(input)
	return String(result)
}

describe("redjot-rehype e2e (Djot to HTML)", () => {
	describe("block elements", () => {
		it("converts a paragraph", async () => {
			assert.equal(
				await toHtml("Hello world"),
				"<p>Hello world</p>",
			)
		})

		it("converts multiple paragraphs", async () => {
			assert.equal(await toHtml("A\n\nB"), "<p>A</p><p>B</p>")
		})

		it("converts headings h1 through h6, each wrapped in a section", async () => {
			assert.equal(
				await toHtml("# Title"),
				'<section id="Title"><h1>Title</h1></section>',
			)
			assert.equal(
				await toHtml("## Sub"),
				'<section id="Sub"><h2>Sub</h2></section>',
			)
			assert.equal(
				await toHtml("### H3"),
				'<section id="H3"><h3>H3</h3></section>',
			)
			assert.equal(
				await toHtml("#### H4"),
				'<section id="H4"><h4>H4</h4></section>',
			)
			assert.equal(
				await toHtml("##### H5"),
				'<section id="H5"><h5>H5</h5></section>',
			)
			assert.equal(
				await toHtml("###### H6"),
				'<section id="H6"><h6>H6</h6></section>',
			)
		})

		it("converts a thematic break", async () => {
			assert.equal(await toHtml("---"), "<hr>")
		})

		it("converts a blockquote", async () => {
			assert.equal(
				await toHtml("> quoted text"),
				"<blockquote><p>quoted text</p></blockquote>",
			)
		})

		it("converts nested blockquotes", async () => {
			assert.equal(
				await toHtml("> > inner"),
				"<blockquote><blockquote><p>inner</p></blockquote></blockquote>",
			)
		})

		it("converts a code block with language", async () => {
			const html = await toHtml(
				"``` js\nconsole.log('hi')\n```",
			)
			assert.ok(html.startsWith("<pre>"))
			assert.ok(html.includes("<code"))
			assert.ok(html.includes('lang="js"'))
			assert.ok(html.includes("console.log"))
		})

		it("converts a code block without language", async () => {
			const html = await toHtml("```\nhello()\n```")
			assert.ok(html.startsWith("<pre>"))
			assert.ok(html.includes("<code>"))
			assert.ok(html.includes("hello()"))
		})

		it("converts a div", async () => {
			assert.equal(
				await toHtml(":::\nContent\n:::"),
				"<div><p>Content</p></div>",
			)
		})

		it("converts an unordered list", async () => {
			const html = await toHtml("- one\n- two\n- three")
			assert.ok(html.startsWith("<ul>"))
			assert.ok(html.includes("<li>"))
			assert.ok(html.includes("one"))
			assert.ok(html.includes("three"))
		})

		it("converts an ordered list", async () => {
			const html = await toHtml("1. first\n2. second")
			assert.ok(html.startsWith("<ol>"))
			assert.ok(html.includes("<li>"))
			assert.ok(html.includes("first"))
			assert.ok(html.includes("second"))
		})

		it("converts a nested list", async () => {
			const html = await toHtml(
				"- a\n\n  - b\n\n  - c\n\n- d",
			)
			assert.ok(html.includes("<ul>"))
			assert.ok(
				html.match(/<ul>/g)!.length >= 2,
				"should have nested <ul>",
			)
		})

		it("converts a task list with checkboxes", async () => {
			const html = await toHtml("- [x] done\n- [ ] todo")
			assert.ok(html.includes('type="checkbox"'))
			assert.ok(html.includes("checked"))
		})

		it("converts a definition list", async () => {
			const html = await toHtml(": apple\n\n  a fruit")
			assert.ok(html.includes("<dl>"))
			assert.ok(html.includes("<dt>"))
			assert.ok(html.includes("<dd>"))
			assert.ok(html.includes("apple"))
		})

		it("converts a table", async () => {
			const html = await toHtml(
				"| A | B |\n|---|---|\n| 1 | 2 |",
			)
			assert.ok(html.includes("<table>"))
			assert.ok(html.includes("<tr>"))
			assert.ok(html.includes("<th"))
			assert.ok(html.includes("A"))
			assert.ok(html.includes("1"))
		})
	})

	describe("inline elements", () => {
		it("converts strong text", async () => {
			const html = await toHtml("Hello **world**")
			assert.ok(html.includes("<strong>"))
			assert.ok(html.includes("world"))
		})

		it("converts emphasized text", async () => {
			assert.equal(
				await toHtml("Hello _world_"),
				"<p>Hello <em>world</em></p>",
			)
		})

		it("converts superscript", async () => {
			assert.equal(
				await toHtml("x^2^"),
				"<p>x<sup>2</sup></p>",
			)
		})

		it("converts subscript", async () => {
			assert.equal(
				await toHtml("H~2~O"),
				"<p>H<sub>2</sub>O</p>",
			)
		})

		it("converts mark (highlight)", async () => {
			assert.equal(
				await toHtml("{=hi=}"),
				"<p><mark>hi</mark></p>",
			)
		})

		it("converts insert", async () => {
			assert.equal(
				await toHtml("{+added+}"),
				"<p><ins>added</ins></p>",
			)
		})

		it("converts delete", async () => {
			assert.equal(
				await toHtml("{-removed-}"),
				"<p><del>removed</del></p>",
			)
		})

		it("converts inline code (verbatim)", async () => {
			assert.equal(
				await toHtml("Use `foo` here"),
				"<p>Use <code>foo</code> here</p>",
			)
		})

		it("converts a link", async () => {
			assert.equal(
				await toHtml("[click](https://example.com)"),
				'<p><a href="https://example.com">click</a></p>',
			)
		})

		it("converts an image", async () => {
			assert.equal(
				await toHtml(
					"![alt](https://example.com/img.png)",
				),
				'<p><img src="https://example.com/img.png" alt="alt"></p>',
			)
		})

		it("converts a reference link", async () => {
			assert.equal(
				await toHtml(
					"[click][ref]\n\n[ref]: https://example.com",
				),
				'<p><a href="https://example.com">click</a></p>',
			)
		})

		it("converts a reference image", async () => {
			assert.equal(
				await toHtml("![alt][cat]\n\n[cat]: cat.jpg"),
				'<p><img src="cat.jpg" alt="alt"></p>',
			)
		})

		it("converts an email autolink", async () => {
			const html = await toHtml("<user@example.com>")
			assert.ok(
				html.includes('href="mailto:user@example.com"'),
			)
			assert.ok(html.includes("user@example.com"))
		})

		it("converts a span with class", async () => {
			assert.equal(
				await toHtml("[text]{.red}"),
				'<p><span class="red">text</span></p>',
			)
		})

		it("converts a symbol", async () => {
			assert.equal(await toHtml(":smile:"), "<p>:smile:</p>")
		})

		it("converts a hard break", async () => {
			assert.equal(
				await toHtml("line 1\\\nline 2"),
				"<p>line 1<br>line 2</p>",
			)
		})

		it("converts strong and emphasis combined", async () => {
			const html = await toHtml("***both***")
			assert.ok(html.includes("<strong>"))
			assert.ok(
				html.includes("<em>") ||
					html.includes("<strong>"),
			)
			assert.ok(html.includes("both"))
		})
	})

	describe("smart punctuation (default: ASCII quotes, Unicode dashes)", () => {
		it("uses ASCII double quotes by default", async () => {
			assert.equal(await toHtml('"hello"'), '<p>"hello"</p>')
		})

		it("uses ASCII single quotes by default", async () => {
			assert.equal(await toHtml("'hello'"), "<p>'hello'</p>")
		})

		it("uses ASCII ellipsis by default", async () => {
			assert.equal(await toHtml("..."), "<p>...</p>")
		})

		it("uses Unicode em-dash by default", async () => {
			assert.equal(await toHtml("a---b"), "<p>a\u2014b</p>")
		})

		it("uses Unicode en-dash by default", async () => {
			assert.equal(await toHtml("1--2"), "<p>1\u20132</p>")
		})
	})

	describe("smart punctuation (configured)", () => {
		it("uses curly double quotes when configured", async () => {
			assert.equal(
				await toHtml('"hello"', {
					smartPunctuation: SMART_PUNCTUATION,
				}),
				"<p>\u201Chello\u201D</p>",
			)
		})

		it("uses curly single quotes when configured", async () => {
			assert.equal(
				await toHtml("'hello'", {
					smartPunctuation: SMART_PUNCTUATION,
				}),
				"<p>\u2018hello\u2019</p>",
			)
		})

		it("uses ellipsis character when configured", async () => {
			assert.equal(
				await toHtml("...", {
					smartPunctuation: SMART_PUNCTUATION,
				}),
				"<p>\u2026</p>",
			)
		})

		it("uses configured em-dash", async () => {
			assert.equal(
				await toHtml("a---b", {
					smartPunctuation: SMART_PUNCTUATION,
				}),
				"<p>a\u2014b</p>",
			)
		})

		it("uses configured en-dash", async () => {
			assert.equal(
				await toHtml("1--2", {
					smartPunctuation: SMART_PUNCTUATION,
				}),
				"<p>1\u20132</p>",
			)
		})

		it("mixed smart punctuation in one paragraph", async () => {
			const html = await toHtml('"hello" ... a---b', {
				smartPunctuation: SMART_PUNCTUATION,
			})
			assert.ok(html.includes("\u201C"))
			assert.ok(html.includes("\u2026"))
			assert.ok(html.includes("\u2014"))
		})
	})

	describe("footnotes", () => {
		it("converts footnotes with endnotes section", async () => {
			const html = await toHtml("Text[^1]\n\n[^1]: The note")
			assert.ok(html.includes('href="#fn:1"'))
			assert.ok(html.includes('id="fnref:1"'))
			assert.ok(html.includes('role="doc-noteref"'))
			assert.ok(html.includes("<sup>"))
			assert.ok(html.includes('role="doc-endnotes"'))
			assert.ok(html.includes("The note"))
		})

		it("includes backlink in footnote", async () => {
			const html = await toHtml("Text[^1]\n\n[^1]: The note")
			assert.ok(html.includes('role="doc-backlink"'))
			assert.ok(html.includes("fn:1"))
		})
	})
})

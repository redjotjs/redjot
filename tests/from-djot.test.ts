import assert from "node:assert/strict"
import { describe, it } from "node:test"
import type {
	Block,
	Footnote,
	Inline,
	OrderedList,
	Paragraph,
	Table,
} from "djast"
import { fromDjot } from "djast-util-from-djot"

function inlineAt(
	doc: ReturnType<typeof fromDjot>,
	blockIndex = 0,
	inlineIndex = 0,
): Inline {
	const block = doc.children[blockIndex]!
	if (block.type === "paragraph") {
		return (block as Paragraph).children[inlineIndex]! as Inline
	}
	if ("children" in block) {
		const children = (block as unknown as { children: Block[] })
			.children
		const para = children[0]!
		if (para.type === "paragraph") {
			return (para as Paragraph).children[
				inlineIndex
			]! as Inline
		}
		if (para.type === "heading") {
			return (para as { children: Inline[] }).children[
				inlineIndex
			]!
		}
	}
	throw new Error(
		`Could not extract inline at [${blockIndex}][${inlineIndex}]`,
	)
}

describe("fromDjot", () => {
	it("parses a simple paragraph", () => {
		const doc = fromDjot("Hello world")
		assert.equal(doc.type, "document")
		assert.equal(doc.children.length, 1)

		const para = doc.children[0]!
		assert.equal(para.type, "paragraph")

		const p = para as Paragraph
		const text = p.children[0]!
		assert.equal(text.type, "text")
		assert.ok("value" in text)
		assert.equal(
			(text as Inline & { value: string }).value,
			"Hello world",
		)
	})

	it("parses a heading inside a section", () => {
		const doc = fromDjot("# Hello")
		assert.equal(doc.children.length, 1)

		const section = doc.children[0]!
		assert.equal(section.type, "section")
		const children = (section as unknown as { children: Block[] })
			.children
		const heading = children[0]!
		assert.equal(heading.type, "heading")
		assert.equal((heading as Block & { level: number }).level, 1)
	})

	it("parses multiple heading levels", () => {
		for (let level = 1; level <= 6; level++) {
			const prefix = "#".repeat(level)
			const doc = fromDjot(`${prefix} Title`)
			const section = doc.children[0]!
			assert.equal(section.type, "section")
			const heading = (
				section as unknown as { children: Block[] }
			).children[0]!
			assert.equal(heading.type, "heading")
			assert.equal(
				(heading as Block & { level: number }).level,
				level,
			)
		}
	})

	it("parses emphasis", () => {
		const doc = fromDjot("_Hello_")
		const para = doc.children[0]! as Paragraph
		const emph = para.children[0]!
		assert.equal(emph.type, "emphasis")
		assert.ok("children" in emph)
		const text = (emph as { children: Inline[] }).children[0]!
		assert.equal(text.type, "text")
		assert.equal(
			(text as Inline & { value: string }).value,
			"Hello",
		)
	})

	it("parses strong", () => {
		const doc = fromDjot("*Hello*")
		const para = doc.children[0]! as Paragraph
		const strong = para.children[0]!
		assert.equal(strong.type, "strong")
	})

	it("parses a code block", () => {
		const doc = fromDjot("``` rust\nfn main() {}\n```")
		const code = doc.children[0]!
		assert.equal(code.type, "code")
		assert.ok("lang" in code)
		assert.equal((code as Block & { lang?: string }).lang, "rust")
		assert.ok("value" in code)
		assert.equal(
			(code as Block & { value: string }).value,
			"fn main() {}\n",
		)
	})

	it("parses a bullet list", () => {
		const doc = fromDjot("- one\n- two\n- three")
		const list = doc.children[0]!
		assert.equal(list.type, "list")
		assert.ok("children" in list)
		const children = (list as unknown as { children: unknown[] })
			.children
		assert.equal(children.length, 3)
		assert.equal((children[0] as { type: string }).type, "listItem")
		assert.ok("tight" in list)
		assert.equal((list as { tight: boolean }).tight, true)
	})

	it("parses an ordered list", () => {
		const doc = fromDjot("1. one\n2. two")
		const list = doc.children[0]!
		assert.equal(list.type, "orderedList")
		assert.ok("children" in list)
		assert.equal(
			(list as unknown as { children: unknown[] }).children
				.length,
			2,
		)
	})

	it("parses a blockquote", () => {
		const doc = fromDjot("> Hello world")
		assert.equal(doc.children[0]?.type, "blockquote")
	})

	it("parses a thematic break", () => {
		const doc = fromDjot("---")
		assert.equal(doc.children[0]?.type, "thematicBreak")
	})

	it("parses a link", () => {
		const doc = fromDjot("[text](https://example.com)")
		const para = doc.children[0]! as Paragraph
		const link = para.children[0]!
		assert.equal(link.type, "link")
		assert.ok("destination" in link)
		assert.equal(
			(link as Inline & { destination?: string }).destination,
			"https://example.com",
		)
	})

	it("parses an image", () => {
		const doc = fromDjot("![alt](https://example.com/img.png)")
		const para = doc.children[0]! as Paragraph
		const img = para.children[0]!
		assert.equal(img.type, "image")
		assert.ok("destination" in img)
		assert.equal(
			(img as Inline & { destination?: string }).destination,
			"https://example.com/img.png",
		)
	})

	it("parses inline code", () => {
		const doc = fromDjot("`code`")
		const para = doc.children[0]! as Paragraph
		const verbatim = para.children[0]!
		assert.equal(verbatim.type, "verbatim")
		assert.ok("value" in verbatim)
		assert.equal(
			(verbatim as Inline & { value: string }).value,
			"code",
		)
	})

	it("parses a section wrapping a heading", () => {
		const doc = fromDjot("# Title\n\nParagraph")
		const section = doc.children[0]!
		assert.equal(section.type, "section")
		const children = (section as unknown as { children: Block[] })
			.children
		assert.equal(children[0]?.type, "heading")
		assert.equal(children[1]?.type, "paragraph")
	})

	it("populates document references", () => {
		const doc = fromDjot(
			"[text][ref]\n\n [ref]: https://example.com",
		)
		assert.ok("ref" in doc.references)
	})

	it("populates document footnotes", () => {
		const doc = fromDjot("Text[^note]\n\n[^note]: Footnote text")
		assert.ok("note" in doc.footnotes)
	})

	it("includes position information on children", () => {
		const doc = fromDjot("Hello")
		const para = doc.children[0]!
		assert.ok("position" in para)
		assert.ok((para as { position?: unknown }).position)
	})

	it("parses a task list", () => {
		const doc = fromDjot("- [x] done\n- [ ] todo")
		const list = doc.children[0]!
		assert.equal(list.type, "taskList")
		const children = (list as unknown as { children: unknown[] })
			.children
		assert.equal(children.length, 2)
		assert.equal(
			(children[0] as { type: string }).type,
			"taskListItem",
		)
		assert.equal(
			(children[0] as unknown as { checkbox: string })
				.checkbox,
			"checked",
		)
		assert.equal(
			(children[1] as unknown as { checkbox: string })
				.checkbox,
			"unchecked",
		)
	})

	it("parses a definition list", () => {
		const doc = fromDjot(": a fruit")
		assert.equal(doc.children[0]?.type, "definitionList")
	})

	it("parses a div", () => {
		const doc = fromDjot(":::\nHello\n:::")
		assert.equal(doc.children[0]?.type, "div")
	})

	it("preserves inline attributes", () => {
		const doc = fromDjot("Hello{#id}")
		const para = doc.children[0]! as Paragraph
		const text = para.children[0]!
		assert.ok("attributes" in text)
		const attrs = (
			text as unknown as {
				attributes?: Record<string, string>
			}
		).attributes
		assert.equal(attrs?.id, "id")
	})

	it("sets autoAttributes on sections", () => {
		const doc = fromDjot("# Title")
		const section = doc.children[0]!
		assert.ok("autoAttributes" in section)
		const auto = (
			section as unknown as {
				autoAttributes?: Record<string, string>
			}
		).autoAttributes
		assert.equal(auto?.id, "Title")
	})

	it("parses a table", () => {
		const doc = fromDjot("| A | B |\n|---|---|\n| 1 | 2 |")
		assert.equal(doc.children[0]?.type, "table")
	})

	describe("inline syntax from syntax.md", () => {
		it("parses nested emphasis with strong", () => {
			const doc = fromDjot("_a *b* c_")
			const emph = inlineAt(doc)
			assert.equal(emph.type, "emphasis")
			const children = (emph as { children: Inline[] })
				.children
			assert.equal(children.length, 3)
			assert.equal(children[1]?.type, "strong")
		})

		it("resolves emphasis precedence (no overlap)", () => {
			const doc = fromDjot(
				"_This is *regular_ not strong* emphasis",
			)
			const para = doc.children[0]! as Paragraph
			assert.equal(para.children.length, 2)
			const emph = para.children[0]!
			assert.equal(emph.type, "emphasis")
			const emphChildren = (emph as { children: Inline[] })
				.children
			assert.equal(emphChildren.length, 1)
			assert.equal(emphChildren[0]?.type, "text")
			assert.equal(
				(emphChildren[0]! as { value: string }).value,
				"This is *regular",
			)
		})

		it("parses curly-brace forced emphasis", () => {
			const doc = fromDjot("{_hi_}")
			const emph = inlineAt(doc)
			assert.equal(emph.type, "emphasis")
		})

		it("parses highlighted/mark", () => {
			const doc = fromDjot("{=hi=}")
			const mark = inlineAt(doc)
			assert.equal(mark.type, "mark")
			assert.equal(
				(
					(mark as { children: Inline[] })
						.children[0]! as {
						value: string
					}
				).value,
				"hi",
			)
		})

		it("parses superscript", () => {
			const doc = fromDjot("x^2^")
			const sup = inlineAt(doc, 0, 1)
			assert.equal(sup.type, "superscript")
			assert.equal(
				(
					(sup as { children: Inline[] })
						.children[0]! as {
						value: string
					}
				).value,
				"2",
			)
		})

		it("parses subscript", () => {
			const doc = fromDjot("H~2~O")
			const sub = inlineAt(doc, 0, 1)
			assert.equal(sub.type, "subscript")
			assert.equal(
				(
					(sub as { children: Inline[] })
						.children[0]! as {
						value: string
					}
				).value,
				"2",
			)
		})

		it("parses insert", () => {
			const doc = fromDjot("{+added+}")
			const ins = inlineAt(doc)
			assert.equal(ins.type, "insert")
			assert.equal(
				(
					(ins as { children: Inline[] })
						.children[0]! as {
						value: string
					}
				).value,
				"added",
			)
		})

		it("parses delete", () => {
			const doc = fromDjot("{-removed-}")
			const del = inlineAt(doc)
			assert.equal(del.type, "delete")
			assert.equal(
				(
					(del as { children: Inline[] })
						.children[0]! as {
						value: string
					}
				).value,
				"removed",
			)
		})

		it("parses ellipses as smart punctuation", () => {
			const doc = fromDjot("a...b")
			const smart = inlineAt(doc, 0, 1)
			assert.equal(smart.type, "smartPunctuation")
			assert.equal(
				(smart as { kind: string }).kind,
				"ellipses",
			)
		})

		it("parses em-dash as smart punctuation", () => {
			const doc = fromDjot("a---b")
			const smart = inlineAt(doc, 0, 1)
			assert.equal(smart.type, "smartPunctuation")
			assert.equal(
				(smart as { kind: string }).kind,
				"em_dash",
			)
		})

		it("parses en-dash as smart punctuation", () => {
			const doc = fromDjot("a--b")
			const smart = inlineAt(doc, 0, 1)
			assert.equal(smart.type, "smartPunctuation")
			assert.equal(
				(smart as { kind: string }).kind,
				"en_dash",
			)
		})

		it("parses curly double quotes", () => {
			const doc = fromDjot('"hello"')
			const dq = inlineAt(doc)
			assert.equal(dq.type, "doubleQuoted")
			assert.equal(
				(
					(dq as { children: Inline[] })
						.children[0]! as {
						value: string
					}
				).value,
				"hello",
			)
		})

		it("parses curly single quotes", () => {
			const doc = fromDjot("'hello'")
			const sq = inlineAt(doc)
			assert.equal(sq.type, "singleQuoted")
			assert.equal(
				(
					(sq as { children: Inline[] })
						.children[0]! as {
						value: string
					}
				).value,
				"hello",
			)
		})

		it("parses a hard line break", () => {
			const doc = fromDjot("a\\\nb")
			const br = inlineAt(doc, 0, 1)
			assert.equal(br.type, "hardBreak")
		})

		it("parses a soft break", () => {
			const doc = fromDjot("a\nb")
			const sb = inlineAt(doc, 0, 1)
			assert.equal(sb.type, "softBreak")
		})

		it("parses a non-breaking space", () => {
			const doc = fromDjot("a\\ b")
			const nbs = inlineAt(doc, 0, 1)
			assert.equal(nbs.type, "nonBreakingSpace")
		})

		it("parses a symbol", () => {
			const doc = fromDjot(":smile:")
			const sym = inlineAt(doc)
			assert.equal(sym.type, "symbol")
			assert.equal((sym as { alias: string }).alias, "smile")
		})

		it("parses an autolink URL", () => {
			const doc = fromDjot("<https://a.com>")
			const url = inlineAt(doc)
			assert.equal(url.type, "url")
			assert.equal(
				(url as { value: string }).value,
				"https://a.com",
			)
		})

		it("parses an autolink email", () => {
			const doc = fromDjot("<a@b.com>")
			const email = inlineAt(doc)
			assert.equal(email.type, "email")
			assert.equal(
				(email as { value: string }).value,
				"a@b.com",
			)
		})

		it("parses a reference link with empty label", () => {
			const doc = fromDjot("[text][]")
			const link = inlineAt(doc)
			assert.equal(link.type, "link")
			assert.equal(
				(link as { reference?: string }).reference,
				"text",
			)
		})

		it("parses a reference link with explicit label", () => {
			const doc = fromDjot("[text][ref]")
			const link = inlineAt(doc)
			assert.equal(link.type, "link")
			assert.equal(
				(link as { reference?: string }).reference,
				"ref",
			)
		})

		it("parses a reference image", () => {
			const doc = fromDjot("![alt][ref]")
			const img = inlineAt(doc)
			assert.equal(img.type, "image")
			assert.equal(
				(img as { reference?: string }).reference,
				"ref",
			)
		})

		it("parses raw inline", () => {
			const doc = fromDjot("`<b>`{=html}")
			const raw = inlineAt(doc)
			assert.equal(raw.type, "rawInline")
			assert.equal((raw as { format: string }).format, "html")
			assert.equal((raw as { value: string }).value, "<b>")
		})

		it("parses a span with attributes", () => {
			const doc = fromDjot("[hi]{.big}")
			const span = inlineAt(doc)
			assert.equal(span.type, "span")
			assert.equal(
				(
					span as unknown as {
						attributes?: { class?: string }
					}
				).attributes?.class,
				"big",
			)
		})

		it("parses verbatim with backtick inside", () => {
			const doc = fromDjot("`` ` ``")
			const verbatim = inlineAt(doc)
			assert.equal(verbatim.type, "verbatim")
			assert.equal((verbatim as { value: string }).value, "`")
		})

		it("parses backslash-escaped punctuation as literal text", () => {
			const doc = fromDjot("\\*text*")
			const text = inlineAt(doc)
			assert.equal(text.type, "text")
			assert.equal(
				(text as { value: string }).value,
				"*text*",
			)
		})

		it("parses stacked attributes", () => {
			const doc = fromDjot("a{lang=fr}{.blue}")
			const text = inlineAt(doc)
			const attrs = (
				text as unknown as {
					attributes?: Record<string, string>
				}
			).attributes
			assert.equal(attrs?.lang, "fr")
			assert.equal(attrs?.class, "blue")
		})

		it("parses multiple classes in attributes", () => {
			const doc = fromDjot("text{.a .b}")
			const text = inlineAt(doc)
			const attrs = (
				text as unknown as {
					attributes?: Record<string, string>
				}
			).attributes
			assert.equal(attrs?.class, "a b")
		})

		it("strips comment-only attributes", () => {
			const doc = fromDjot("a{% comment %}")
			const para = doc.children[0]! as Paragraph
			assert.equal(para.children.length, 1)
			assert.equal(para.children[0]?.type, "text")
		})

		it("parses a link with multiline URL", () => {
			const doc = fromDjot(
				"[text](http://example.com?foo\nbar)",
			)
			const link = inlineAt(doc)
			assert.equal(link.type, "link")
			assert.equal(
				(link as { destination?: string }).destination,
				"http://example.com?foobar",
			)
		})
	})

	describe("block syntax from syntax.md", () => {
		it("parses a raw HTML block", () => {
			const doc = fromDjot("``` =html\n<div>hi</div>\n```")
			const raw = doc.children[0]!
			assert.equal(raw.type, "raw")
			assert.equal((raw as { format: string }).format, "html")
			assert.equal(
				(raw as { value: string }).value,
				"<div>hi</div>\n",
			)
		})

		it("parses a div with class attribute", () => {
			const doc = fromDjot("::: warn\ntext\n:::")
			const div = doc.children[0]!
			assert.equal(div.type, "div")
			const attrs = (
				div as unknown as {
					attributes?: Record<string, string>
				}
			).attributes
			assert.equal(attrs?.class, "warn")
		})

		it("parses block attributes on a paragraph", () => {
			const doc = fromDjot("{#myid}\ntext")
			const para = doc.children[0]!
			assert.equal(para.type, "paragraph")
			const attrs = (
				para as unknown as {
					attributes?: Record<string, string>
				}
			).attributes
			assert.equal(attrs?.id, "myid")
		})

		it("parses block attributes on a heading section", () => {
			const doc = fromDjot("{#intro}\n## Hello")
			const section = doc.children[0]!
			assert.equal(section.type, "section")
			const attrs = (
				section as unknown as {
					attributes?: Record<string, string>
				}
			).attributes
			assert.equal(attrs?.id, "intro")
		})

		it("parses a code block without language", () => {
			const doc = fromDjot("```\ncode\n```")
			const code = doc.children[0]!
			assert.equal(code.type, "code")
			assert.equal(
				(code as { value: string }).value,
				"code\n",
			)
			assert.equal(
				(code as { lang?: string }).lang,
				undefined,
			)
		})

		it("parses a code block with longer fence", () => {
			const doc = fromDjot("````\n``` ruby\nx = 1\n```\n````")
			const code = doc.children[0]!
			assert.equal(code.type, "code")
			assert.equal(
				(code as { value: string }).value,
				"``` ruby\nx = 1\n```\n",
			)
		})

		it("parses a thematic break with asterisks", () => {
			const doc = fromDjot("* * *")
			assert.equal(doc.children[0]?.type, "thematicBreak")
		})

		it("parses a thematic break with dashes", () => {
			const doc = fromDjot("---")
			assert.equal(doc.children[0]?.type, "thematicBreak")
		})

		it("parses a nested bullet list", () => {
			const doc = fromDjot("- a\n\n  - b")
			const list = doc.children[0]!
			assert.equal(list.type, "list")
			const outer = (list as { children: unknown[] }).children
			assert.equal(outer.length, 1)
			const outerItem = outer[0]! as { children: Block[] }
			assert.equal(outerItem.children[0]?.type, "paragraph")
			assert.equal(outerItem.children[1]?.type, "list")
		})

		it("parses a loose list (blank lines between items)", () => {
			const doc = fromDjot("- a\n\n- b")
			const list = doc.children[0]!
			assert.equal(list.type, "list")
			assert.equal((list as { tight: boolean }).tight, false)
		})

		it("parses an ordered list with start number", () => {
			const doc = fromDjot("5. a\n6. b")
			const ol = doc.children[0]! as OrderedList
			assert.equal(ol.type, "orderedList")
			assert.equal(ol.start, 5)
		})

		it("parses an ordered list with paren style", () => {
			const doc = fromDjot("1) a\n2) b")
			const ol = doc.children[0]! as OrderedList
			assert.equal(ol.type, "orderedList")
			assert.equal(ol.style, "1)")
		})

		it("parses an ordered list with alpha style", () => {
			const doc = fromDjot("a. first\nb. second")
			const ol = doc.children[0]! as OrderedList
			assert.equal(ol.type, "orderedList")
			assert.equal(ol.style, "a.")
		})

		it("parses a definition list with term and definition", () => {
			const doc = fromDjot(": apple\n\n  a fruit")
			const dl = doc.children[0]!
			assert.equal(dl.type, "definitionList")
			const item = (dl as { children: { type: string }[] })
				.children[0]!
			assert.equal(item.type, "definitionListItem")
			const parts = (
				item as unknown as {
					children: { type: string }[]
				}
			).children
			assert.equal(parts.length, 2)
			assert.equal(parts[0]?.type, "term")
			assert.equal(parts[1]?.type, "definition")
		})

		it("parses a definition list with multiple items", () => {
			const doc = fromDjot(
				": apple\n\n  a fruit\n\n: banana\n\n  yellow",
			)
			const dl = doc.children[0]!
			assert.equal(dl.type, "definitionList")
			assert.equal(
				(dl as { children: unknown[] }).children.length,
				2,
			)
		})

		it("parses a table with alignment", () => {
			const doc = fromDjot("| a | b |\n|:--|--:|\n| 1 | 2 |")
			const table = doc.children[0]! as Table
			assert.equal(table.type, "table")
			const row = table.children[1]!
			assert.equal(row.type, "row")
			const cells = (row as { children: unknown[] }).children
			assert.equal(cells.length, 2)
			assert.equal(
				(cells[0] as { align: string }).align,
				"left",
			)
			assert.equal(
				(cells[1] as { align: string }).align,
				"right",
			)
		})

		it("parses a table with caption", () => {
			const doc = fromDjot("| a |\n|---|\n| 1 |\n^ My table")
			const table = doc.children[0]! as Table
			assert.equal(table.type, "table")
			const caption = table.children[0]!
			assert.equal(caption.type, "caption")
			assert.equal(
				(
					(caption as { children: Inline[] })
						.children[0]! as {
						value: string
					}
				).value,
				"My table",
			)
		})

		it("parses a multiline heading", () => {
			const doc = fromDjot("# line1\n# line2")
			const section = doc.children[0]!
			assert.equal(section.type, "section")
			const heading = (
				section as unknown as { children: Block[] }
			).children[0]!
			assert.equal(heading.type, "heading")
			const children = (heading as { children: Inline[] })
				.children
			assert.equal(children.length, 3)
			assert.equal(children[0]?.type, "text")
			assert.equal(
				(children[0]! as { value: string }).value,
				"line1",
			)
			assert.equal(children[1]?.type, "softBreak")
			assert.equal(
				(children[2]! as { value: string }).value,
				"line2",
			)
		})

		it("parses nested sections by heading level", () => {
			const doc = fromDjot("# First\n\n## Second")
			const section = doc.children[0]!
			assert.equal(section.type, "section")
			const inner = (
				section as unknown as { children: Block[] }
			).children[1]!
			assert.equal(inner.type, "section")
			const innerHeading = (
				inner as unknown as { children: Block[] }
			).children[0]!
			assert.equal(innerHeading.type, "heading")
			assert.equal(
				(innerHeading as { level: number }).level,
				2,
			)
		})

		it("parses a blockquote with nested list", () => {
			const doc = fromDjot("> - item")
			const bq = doc.children[0]!
			assert.equal(bq.type, "blockquote")
			const list = (bq as { children: Block[] }).children[0]!
			assert.equal(list.type, "list")
		})

		it("parses a footnote with multiple blocks", () => {
			const doc = fromDjot(
				"Text[^n]\n\n[^n]: Para 1\n\n  Para 2\n\n  > Quote",
			)
			const fn = doc.footnotes.n! as Footnote
			assert.equal(fn.type, "footnote")
			assert.equal(fn.label, "n")
			assert.equal(fn.children.length, 3)
			assert.equal(fn.children[0]?.type, "paragraph")
			assert.equal(fn.children[1]?.type, "paragraph")
			assert.equal(fn.children[2]?.type, "blockquote")
		})

		it("parses a document with reference link definition", () => {
			const doc = fromDjot(
				"[ref]: https://example.com\n\ntext [ref][]",
			)
			assert.ok("ref" in doc.references)
			assert.equal(
				doc.references.ref?.destination,
				"https://example.com",
			)
		})

		it("parses a paragraph with soft break treated as space", () => {
			const doc = fromDjot("line one\nline two")
			const para = doc.children[0]! as Paragraph
			assert.equal(para.children.length, 3)
			assert.equal(para.children[0]?.type, "text")
			assert.equal(para.children[1]?.type, "softBreak")
			assert.equal(para.children[2]?.type, "text")
		})

		it("parses a paragraph with hard break via backslash-newline", () => {
			const doc = fromDjot("line one\\\nline two")
			const para = doc.children[0]! as Paragraph
			assert.equal(para.children.length, 3)
			assert.equal(para.children[1]?.type, "hardBreak")
		})
	})
})

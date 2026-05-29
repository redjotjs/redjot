import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { toHast } from "djast-util-to-hast"
import type { Element, Text as HastText, RootContent } from "hast"
import type {
	Document,
	Paragraph,
	Heading,
	Code,
	Text,
	Link,
	Image,
	List,
	OrderedList,
	Verbatim,
	Raw,
	Footnote,
	FootnoteReference,
	RawInline,
} from "djast"

function el(content: RootContent): asserts content is Element {
	assert.equal(content.type, "element")
}

function txt(content: RootContent): asserts content is HastText {
	assert.equal(content.type, "text")
}

function makeDoc(...children: Document["children"]): Document {
	return {
		type: "document",
		references: {},
		autoReferences: {},
		footnotes: {},
		children,
	}
}

function makePara(text: string): Paragraph {
	return {
		type: "paragraph",
		children: [{ type: "text", value: text }],
	}
}

function makeHeading(level: number, text: string): Heading {
	return {
		type: "heading",
		level,
		children: [{ type: "text", value: text }],
	}
}

describe("toHast", () => {
	it("converts a paragraph", () => {
		const hast = toHast(makeDoc(makePara("Hello")))
		assert.equal(hast.type, "root")
		assert.equal(hast.children.length, 1)

		const p = hast.children[0]!
		el(p)
		assert.equal(p.tagName, "p")
		assert.equal(p.children.length, 1)

		const text = p.children[0]!
		txt(text)
		assert.equal(text.value, "Hello")
	})

	it("converts headings to h1-h6", () => {
		for (let level = 1; level <= 6; level++) {
			const hast = toHast(makeDoc(makeHeading(level, "Title")))
			const h = hast.children[0]!
			el(h)
			assert.equal(h.tagName, `h${level}`)
		}
	})

	it("converts a thematic break", () => {
		const hast = toHast(makeDoc({ type: "thematicBreak" }))
		const hr = hast.children[0]!
		el(hr)
		assert.equal(hr.tagName, "hr")
	})

	it("converts a section", () => {
		const hast = toHast(
			makeDoc({
				type: "section",
				children: [makeHeading(1, "Title"), makePara("Text")],
			}),
		)
		const section = hast.children[0]!
		el(section)
		assert.equal(section.tagName, "section")
		assert.equal(section.children.length, 2)
	})

	it("converts a div", () => {
		const hast = toHast(
			makeDoc({ type: "div", children: [makePara("Text")] }),
		)
		const div = hast.children[0]!
		el(div)
		assert.equal(div.tagName, "div")
	})

	it("converts a blockquote", () => {
		const hast = toHast(
			makeDoc({ type: "blockquote", children: [makePara("Quoted")] }),
		)
		const bq = hast.children[0]!
		el(bq)
		assert.equal(bq.tagName, "blockquote")
	})

	it("converts a code block to pre > code", () => {
		const code: Code = { type: "code", value: "console.log('hi')", lang: "js" }
		const hast = toHast(makeDoc(code))
		const pre = hast.children[0]!
		el(pre)
		assert.equal(pre.tagName, "pre")
		assert.equal(pre.children.length, 1)

		const codeEl = pre.children[0]!
		el(codeEl)
		assert.equal(codeEl.tagName, "code")
		assert.equal(codeEl.properties?.lang, "js")
	})

	it("converts an unordered list", () => {
		const list: List = {
			type: "list",
			tight: true,
			style: "-",
			children: [
				{ type: "listItem", children: [makePara("one")] },
				{ type: "listItem", children: [makePara("two")] },
			],
		}
		const hast = toHast(makeDoc(list))
		const ul = hast.children[0]!
		el(ul)
		assert.equal(ul.tagName, "ul")
		assert.equal(ul.children.length, 2)
		const li = ul.children[0]!
		el(li)
		assert.equal(li.tagName, "li")
	})

	it("converts an ordered list", () => {
		const ol: OrderedList = {
			type: "orderedList",
			style: "1.",
			tight: true,
			children: [{ type: "listItem", children: [makePara("first")] }],
		}
		const hast = toHast(makeDoc(ol))
		const el_ = hast.children[0]!
		el(el_)
		assert.equal(el_.tagName, "ol")
	})

	it("converts emphasis", () => {
		const hast = toHast(
			makeDoc({
				type: "paragraph",
				children: [{ type: "emphasis", children: [{ type: "text", value: "em" }] }],
			}),
		)
		const p = hast.children[0]!
		el(p)
		assert.equal(p.tagName, "p")
		const em = p.children[0]!
		el(em)
		assert.equal(em.tagName, "em")
	})

	it("converts strong", () => {
		const hast = toHast(
			makeDoc({
				type: "paragraph",
				children: [{ type: "strong", children: [{ type: "text", value: "strong" }] }],
			}),
		)
		const p = hast.children[0]!
		el(p)
		const s = p.children[0]!
		el(s)
		assert.equal(s.tagName, "strong")
	})

	it("converts a link", () => {
		const link: Link = {
			type: "link",
			destination: "https://example.com",
			children: [{ type: "text", value: "click" }],
		}
		const hast = toHast(makeDoc({ type: "paragraph", children: [link] }))
		const p = hast.children[0]!
		el(p)
		const a = p.children[0]!
		el(a)
		assert.equal(a.tagName, "a")
		assert.equal(a.properties?.href, "https://example.com")
	})

	it("converts an image", () => {
		const img: Image = {
			type: "image",
			destination: "https://example.com/img.png",
			children: [{ type: "text", value: "alt text" }],
		}
		const hast = toHast(makeDoc({ type: "paragraph", children: [img] }))
		const p = hast.children[0]!
		el(p)
		const imgEl = p.children[0]!
		el(imgEl)
		assert.equal(imgEl.tagName, "img")
		assert.equal(imgEl.properties?.src, "https://example.com/img.png")
		assert.equal(imgEl.properties?.alt, "alt text")
	})

	it("converts inline verbatim to code", () => {
		const verbatim: Verbatim = { type: "verbatim", value: "x" }
		const hast = toHast(
			makeDoc({ type: "paragraph", children: [verbatim] }),
		)
		const p = hast.children[0]!
		el(p)
		const code = p.children[0]!
		el(code)
		assert.equal(code.tagName, "code")
	})

	it("converts raw html inline", () => {
		const rawInline: RawInline = {
			type: "rawInline",
			value: "<b>bold</b>",
			format: "html",
		}
		const hast = toHast(
			makeDoc({ type: "paragraph", children: [rawInline] }),
		)
		const p = hast.children[0]!
		el(p)
		const raw = p.children[0]! as { type: string; value: string }
		assert.equal(raw.type, "raw")
		assert.equal(raw.value, "<b>bold</b>")
	})

	it("converts raw html block", () => {
		const raw: Raw = { type: "raw", value: "<div>hello</div>", format: "html" }
		const hast = toHast(makeDoc(raw))
		const node = hast.children[0]! as { type: string; value: string }
		assert.equal(node.type, "raw")
		assert.equal(node.value, "<div>hello</div>")
	})

	it("skips non-html raw blocks", () => {
		const raw: Raw = { type: "raw", value: "data", format: "latex" }
		const hast = toHast(makeDoc(raw))
		assert.equal(hast.children.length, 0)
	})

	it("converts footnotes with endnotes section", () => {
		const footnote: Footnote = {
			type: "footnote",
			label: "note",
			children: [makePara("Footnote text")],
		}
		const doc: Document = {
			type: "document",
			references: {},
			autoReferences: {},
			footnotes: { note: footnote },
			children: [
				{
					type: "paragraph",
					children: [
						{ type: "text", value: "Text" } as Text,
						{ type: "footnoteReference", value: "note" } as FootnoteReference,
						{ type: "text", value: " more" } as Text,
					],
				},
			],
		}
		const hast = toHast(doc)

		const p = hast.children[0]!
		el(p)
		assert.equal(p.tagName, "p")
		assert.equal(p.children.length, 3)
		const link = p.children[1]!
		el(link)
		assert.equal(link.tagName, "a")
		assert.equal(link.properties?.href, "#fn:note")
		assert.equal(link.properties?.id, "fnref:note")

		const endnotes = hast.children[1]!
		el(endnotes)
		assert.equal(endnotes.tagName, "section")
		assert.equal(endnotes.properties?.role, "doc-endnotes")
	})

	it("converts a link with reference", () => {
		const link: Link = {
			type: "link",
			reference: "ref",
			children: [{ type: "text", value: "click" }],
		}
		const doc: Document = {
			type: "document",
			references: {
				ref: {
					type: "reference",
					label: "ref",
					destination: "https://example.com",
					children: [],
				},
			},
			autoReferences: {},
			footnotes: {},
			children: [{ type: "paragraph", children: [link] }],
		}
		const hast = toHast(doc)
		const p = hast.children[0]!
		el(p)
		const a = p.children[0]!
		el(a)
		assert.equal(a.tagName, "a")
		assert.equal(a.properties?.href, "https://example.com")
	})

	it("converts smart punctuation", () => {
		const hast = toHast(
			makeDoc({
				type: "paragraph",
				children: [{ type: "smartPunctuation", kind: "em_dash", value: "" }],
			}),
		)
		const p = hast.children[0]!
		el(p)
		const text = p.children[0]!
		txt(text)
		assert.equal(text.value, "—")
	})

	it("converts soft break to space", () => {
		const hast = toHast(
			makeDoc({
				type: "paragraph",
				children: [
					{ type: "text", value: "a" },
					{ type: "softBreak" },
					{ type: "text", value: "b" },
				],
			}),
		)
		const p = hast.children[0]!
		el(p)
		const space = p.children[1]!
		txt(space)
		assert.equal(space.value, " ")
	})

	it("converts a hard break to br", () => {
		const hast = toHast(
			makeDoc({ type: "paragraph", children: [{ type: "hardBreak" }] }),
		)
		const p = hast.children[0]!
		el(p)
		const br = p.children[0]!
		el(br)
		assert.equal(br.tagName, "br")
	})

	it("converts superscript", () => {
		const hast = toHast(
			makeDoc({
				type: "paragraph",
				children: [{ type: "superscript", children: [{ type: "text", value: "2" }] }],
			}),
		)
		const p = hast.children[0]!
		el(p)
		const sup = p.children[0]!
		el(sup)
		assert.equal(sup.tagName, "sup")
	})

	it("converts subscript", () => {
		const hast = toHast(
			makeDoc({
				type: "paragraph",
				children: [{ type: "subscript", children: [{ type: "text", value: "2" }] }],
			}),
		)
		const p = hast.children[0]!
		el(p)
		const sub = p.children[0]!
		el(sub)
		assert.equal(sub.tagName, "sub")
	})

	it("converts mark", () => {
		const hast = toHast(
			makeDoc({
				type: "paragraph",
				children: [{ type: "mark", children: [{ type: "text", value: "marked" }] }],
			}),
		)
		const p = hast.children[0]!
		el(p)
		const mark = p.children[0]!
		el(mark)
		assert.equal(mark.tagName, "mark")
	})

	it("converts delete", () => {
		const hast = toHast(
			makeDoc({
				type: "paragraph",
				children: [{ type: "delete", children: [{ type: "text", value: "deleted" }] }],
			}),
		)
		const p = hast.children[0]!
		el(p)
		const del = p.children[0]!
		el(del)
		assert.equal(del.tagName, "del")
	})

	it("converts insert", () => {
		const hast = toHast(
			makeDoc({
				type: "paragraph",
				children: [{ type: "insert", children: [{ type: "text", value: "inserted" }] }],
			}),
		)
		const p = hast.children[0]!
		el(p)
		const ins = p.children[0]!
		el(ins)
		assert.equal(ins.tagName, "ins")
	})

	it("converts email to mailto link", () => {
		const hast = toHast(
			makeDoc({
				type: "paragraph",
				children: [{ type: "email", value: "a@b.com" }],
			}),
		)
		const p = hast.children[0]!
		el(p)
		const a = p.children[0]!
		el(a)
		assert.equal(a.tagName, "a")
		assert.equal(a.properties?.href, "mailto:a@b.com")
	})

	it("converts definition list to dl/dt/dd", () => {
		const hast = toHast(
			makeDoc({
				type: "definitionList",
				children: [
					{
						type: "definitionListItem",
						children: [
							{ type: "term", children: [{ type: "text", value: "word" }] },
							{ type: "definition", children: [makePara("explanation")] },
						],
					},
				],
			}),
		)
		const dl = hast.children[0]!
		el(dl)
		assert.equal(dl.tagName, "dl")
		const dt = dl.children[0]!
		el(dt)
		assert.equal(dt.tagName, "dt")
		const dd = dl.children[1]!
		el(dd)
		assert.equal(dd.tagName, "dd")
	})

	it("converts a table", () => {
		const hast = toHast(
			makeDoc({
				type: "table",
				children: [
					{ type: "caption", children: [{ type: "text", value: "" }] },
					{
						type: "row",
						head: true,
						children: [
							{
								type: "cell",
								head: true,
								align: "center",
								children: [{ type: "text", value: "Header" }],
							},
						],
					},
				],
			}),
		)
		const table = hast.children[0]!
		el(table)
		assert.equal(table.tagName, "table")
		const caption = table.children[0]!
		el(caption)
		assert.equal(caption.tagName, "caption")
		const tr = table.children[1]!
		el(tr)
		assert.equal(tr.tagName, "tr")
		const th = tr.children[0]!
		el(th)
		assert.equal(th.tagName, "th")
	})

	it("converts task list items with checkboxes", () => {
		const hast = toHast(
			makeDoc({
				type: "taskList",
				tight: true,
				children: [
					{
						type: "taskListItem",
						checkbox: "checked" as const,
						children: [makePara("done")],
					},
					{
						type: "taskListItem",
						checkbox: "unchecked" as const,
						children: [makePara("todo")],
					},
				],
			}),
		)
		const ul = hast.children[0]!
		el(ul)
		assert.equal(ul.tagName, "ul")
		const li1 = ul.children[0]!
		el(li1)
		assert.equal(li1.tagName, "li")
		const checkbox = li1.children[0]!
		el(checkbox)
		assert.equal(checkbox.tagName, "input")
		assert.equal(checkbox.properties?.type, "checkbox")
		assert.equal(checkbox.properties?.disabled, true)
		assert.equal(checkbox.properties?.checked, true)
	})
})

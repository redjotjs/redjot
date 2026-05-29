import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { fromDjot } from "djast-util-from-djot"
import type { Block, Inline, Paragraph } from "djast"

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
		assert.equal((text as Inline & { value: string }).value, "Hello world")
	})

	it("parses a heading inside a section", () => {
		const doc = fromDjot("# Hello")
		assert.equal(doc.children.length, 1)

		const section = doc.children[0]!
		assert.equal(section.type, "section")
		const children = (section as unknown as { children: Block[] }).children
		const heading = children[0]!
		assert.equal(heading.type, "heading")
		assert.equal(
			(heading as Block & { level: number }).level,
			1,
		)
	})

	it("parses multiple heading levels", () => {
		for (let level = 1; level <= 6; level++) {
			const prefix = "#".repeat(level)
			const doc = fromDjot(`${prefix} Title`)
			const section = doc.children[0]!
			assert.equal(section.type, "section")
			const heading = (section as unknown as { children: Block[] }).children[0]!
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
		assert.equal((text as Inline & { value: string }).value, "Hello")
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
		assert.equal((code as Block & { value: string }).value, "fn main() {}\n")
	})

	it("parses a bullet list", () => {
		const doc = fromDjot("- one\n- two\n- three")
		const list = doc.children[0]!
		assert.equal(list.type, "list")
		assert.ok("children" in list)
		const children = (list as unknown as { children: unknown[] }).children
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
		assert.equal((list as unknown as { children: unknown[] }).children.length, 2)
	})

	it("parses a blockquote", () => {
		const doc = fromDjot("> Hello world")
		assert.equal(doc.children[0]!.type, "blockquote")
	})

	it("parses a thematic break", () => {
		const doc = fromDjot("---")
		assert.equal(doc.children[0]!.type, "thematicBreak")
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
		assert.equal((verbatim as Inline & { value: string }).value, "code")
	})

	it("parses a section wrapping a heading", () => {
		const doc = fromDjot("# Title\n\nParagraph")
		const section = doc.children[0]!
		assert.equal(section.type, "section")
		const children = (section as unknown as { children: Block[] }).children
		assert.equal(children[0]!.type, "heading")
		assert.equal(children[1]!.type, "paragraph")
	})

	it("populates document references", () => {
		const doc = fromDjot("[text][ref]\n\n [ref]: https://example.com")
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
		const children = (list as unknown as { children: unknown[] }).children
		assert.equal(children.length, 2)
		assert.equal((children[0] as { type: string }).type, "taskListItem")
		assert.equal(
			(children[0] as unknown as { checkbox: string }).checkbox,
			"checked",
		)
		assert.equal(
			(children[1] as unknown as { checkbox: string }).checkbox,
			"unchecked",
		)
	})

	it("parses a definition list", () => {
		const doc = fromDjot(": a fruit")
		assert.equal(doc.children[0]!.type, "definitionList")
	})

	it("parses a div", () => {
		const doc = fromDjot(":::\nHello\n:::")
		assert.equal(doc.children[0]!.type, "div")
	})

	it("preserves inline attributes", () => {
		const doc = fromDjot("Hello{#id}")
		const para = doc.children[0]! as Paragraph
		const text = para.children[0]!
		assert.ok("attributes" in text)
		const attrs = (text as unknown as { attributes?: Record<string, string> }).attributes
		assert.equal(attrs?.id, "id")
	})

	it("sets autoAttributes on sections", () => {
		const doc = fromDjot("# Title")
		const section = doc.children[0]!
		assert.ok("autoAttributes" in section)
		const auto = (section as unknown as { autoAttributes?: Record<string, string> }).autoAttributes
		assert.equal(auto?.id, "Title")
	})

	it("parses a table", () => {
		const doc = fromDjot("| A | B |\n|---|---|\n| 1 | 2 |")
		assert.equal(doc.children[0]!.type, "table")
	})
})

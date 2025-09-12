import { test } from "bun:test"
import assert from "node:assert/strict"
import redjotParse from "../../redjot-parse/src"
import redjotRehype from "."
import rehypeStringify from "rehype-stringify"
import { unified } from "unified"

const processor = unified()
	.use(redjotParse)
	.use(redjotRehype)
	.use(rehypeStringify)

test("basic", async () => {
	const html = await processor.process("hello there")
	assert.equal(String(html), "<p>hello there</p>")
})

test("heading (with section)", async () => {
	const html = await processor.process("# Heading")
	assert.equal(
		String(html),
		`<section id="Heading"><h1>Heading</h1></section>`,
	)
})

test("emphasis", async () => {
	const html = await processor.process("With an _accent_")
	assert.equal(String(html), "<p>With an <em>accent</em></p>")
})

test("strong emphasis", async () => {
	const html = await processor.process("Very *bold*")
	assert.equal(String(html), "<p>Very <strong>bold</strong></p>")
})

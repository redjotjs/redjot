import assert from "node:assert/strict"
import { describe, it } from "node:test"
import type { Document, Raw } from "djast"
import redjotMetadata from "redjot-metadata"

function makeDocWithRaw(format: string, value: string): Document {
	return {
		type: "document",
		references: {},
		autoReferences: {},
		footnotes: {},
		children: [
			{ type: "raw", format, value } as Raw,
			{
				type: "paragraph",
				children: [{ type: "text", value: "body" }],
			},
		],
	}
}

function extractMetadata(doc: Document): void {
	const fn = (
		redjotMetadata as unknown as {
			call(_: unknown): (tree: Document) => void
		}
	).call({})
	fn(doc)
}

describe("redjot-metadata", () => {
	it("parses JSON metadata with 'metadata' format", () => {
		const doc = makeDocWithRaw("metadata", '{"title": "Hello"}')
		extractMetadata(doc)

		assert.equal(doc.children.length, 2)
		const meta = doc.children[0] as unknown as Record<
			string,
			unknown
		>
		assert.equal(meta.type, "metadata")
		assert.equal(meta.format, "json")
		assert.equal(
			(meta.value as Record<string, string>).title,
			"Hello",
		)
	})

	it("parses JSON metadata with 'metadata.json' format", () => {
		const doc = makeDocWithRaw("metadata.json", '{"key": "val"}')
		extractMetadata(doc)

		const meta = doc.children[0] as unknown as Record<
			string,
			unknown
		>
		assert.equal(meta.type, "metadata")
		assert.equal(meta.format, "json")
		assert.equal((meta.value as Record<string, string>).key, "val")
	})

	it("throws on unknown metadata format", () => {
		const doc = makeDocWithRaw("metadata.yaml", "key: val")
		assert.throws(() => extractMetadata(doc), {
			message: "Unknown metadata format: metadata.yaml",
		})
	})

	it("parses complex JSON metadata", () => {
		const data = {
			title: "Test",
			tags: ["a", "b"],
			nested: { x: 1 },
		}
		const doc = makeDocWithRaw("metadata", JSON.stringify(data))
		extractMetadata(doc)

		const meta = doc.children[0] as unknown as Record<
			string,
			unknown
		>
		assert.deepEqual(meta.value, data)
	})

	it("replaces raw block with metadata node", () => {
		const doc = makeDocWithRaw("metadata", '{"a":1}')
		extractMetadata(doc)

		assert.equal(doc.children.length, 2)
		assert.equal(doc.children[0]?.type, "metadata")
		assert.equal(doc.children[1]?.type, "paragraph")
	})

	it("does nothing when there is no metadata raw block", () => {
		const doc: Document = {
			type: "document",
			references: {},
			autoReferences: {},
			footnotes: {},
			children: [
				{
					type: "paragraph",
					children: [
						{
							type: "text",
							value: "no metadata",
						},
					],
				},
			],
		}
		extractMetadata(doc)

		assert.equal(doc.children.length, 1)
		assert.equal(doc.children[0]?.type, "paragraph")
	})

	it("does nothing when no raw block matches the metadata format", () => {
		const doc: Document = {
			type: "document",
			references: {},
			autoReferences: {},
			footnotes: {},
			children: [
				{
					type: "raw",
					format: "html",
					value: "<div>hi</div>",
				} as Raw,
				{
					type: "paragraph",
					children: [
						{ type: "text", value: "body" },
					],
				},
			],
		}
		extractMetadata(doc)

		assert.equal(doc.children.length, 2)
		assert.equal(doc.children[0]?.type, "raw")
		assert.equal(doc.children[1]?.type, "paragraph")
	})
})

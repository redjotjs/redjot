import type { Document, Raw } from "djast"
import type { Processor, Transformer } from "unified"

export default function redjotMetadata(this: Processor): Transformer {
	// TODO: make Document directly extend Node upstream
	return transform as unknown as Transformer
}

function transform(root: Document): void {
	const index = root.children.findIndex(
		node =>
			node.type === "raw" &&
			node.format.startsWith("metadata"),
	)

	const node = root.children[index] as Raw
	const format = node.format
	const rawMetadata = node.value

	const metaNode = {
		type: "metadata",
		format: "?",
		value: {},
	}

	switch (format) {
		case "metadata":
		case "metadata.json": {
			metaNode.value = JSON.parse(rawMetadata)
			metaNode.format = "json"
			break
		}
		default:
			throw Error(`Unknown metadata format: ${format}`)
	}
	// biome-ignore lint/suspicious/noExplicitAny: the output is no longer pure djast
	;(root.children as any[])[index] = metaNode
}

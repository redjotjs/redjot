import type { Raw } from "djast"
import type { Processor, Transformer } from "unified"
import type { Node } from "unist"

export default function redjotMetadata(this: Processor): Transformer {
	return transform
}

function transform(root: Node): void {
	if (!("children" in root)) {
		return
	}
	if (!Array.isArray(root.children)) {
		return
	}

	const index = root.children.findIndex(
		node =>
			node.type === "raw" &&
			node.format.startsWith("metadata"),
	)

	// no top-level metadata block
	if (index === -1) {
		return
	}

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

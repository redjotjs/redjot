import path from "node:path"
import type { Processor, Transformer } from "unified"
import type { Literal, Node, Parent } from "unist"

// TODO: a shared package
interface RawBlock extends Literal {
	data: { format: string }
	value: string
}

export default function redjotMetadata(this: Processor): Transformer {
	return transform
}

function ext(name: string): string {
	return path.extname(name).slice(1)
}

// biome-ignore lint/suspicious/noExplicitAny: checker function
function isParent(node: any): node is Parent {
	return "children" in node
}

function transform(root: Node): void {
	if (!isParent(root)) {
		return
	}

	const index = root.children.findIndex(
		node =>
			node.type === "raw_block" &&
			(node as RawBlock).data.format.startsWith("metadata"),
	)

	const node = root.children[index] as RawBlock
	const raw = node.value
	const _type = ext(node.data.format)
	const metadata = JSON.parse(raw)

	const meta_node: Literal = {
		type: "metadata",
		value: metadata,
	}

	root.children[index] = meta_node
}

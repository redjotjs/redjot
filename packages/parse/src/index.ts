import * as djot from "@djot/djot"
import type { Processor } from "unified"
import type { Literal, Node, Parent, Position } from "unist"

export default function redjotParse(this: Processor): void {
	this.parser = parse
}

export function parse(document: string): Parent {
	const doc = djot.parse(document, { sourcePositions: true })

	// biome-ignore lint/suspicious/noExplicitAny: TODO a type
	const out = { type: "root", data: {} as any, children: [] as Node[] }

	out.data.references = doc.references
	out.data.autoReferences = doc.autoReferences
	out.data.footnotes = Object.fromEntries(
		Object.entries(doc.footnotes).map(([key, value]) => [
			key,
			nodeDjotToUnist(value),
		]),
	)

	out.children = doc.children.map(nodeDjotToUnist)

	return out
}

function posDjotToUnist(pos: djot.Pos | undefined): Position | undefined {
	if (!pos) {
		return undefined
	}
	return {
		start: {
			line: pos.start.line,
			column: pos.start.col,
			offset: pos.start.offset,
		},
		end: {
			line: pos.end.line,
			column: pos.end.col,
			offset: pos.end.offset,
		},
	}
}

const IGNORE = ["tag", "children", "pos", "text"]

function nodeDjotToUnist(node: djot.AstNode | djot.Str): Node {
	const out = {
		type: node.tag,
		// biome-ignore lint/suspicious/noExplicitAny: TODO a type
		data: {} as Record<string, any>,
		position: posDjotToUnist(node.pos),
	}

	if ("text" in node) {
		;(out as Literal).value = node.text
	}

	for (const [key, value] of Object.entries(node)) {
		if (IGNORE.includes(key)) {
			continue
		}

		out.data[key] = value
	}

	if ("children" in node) {
		;(out as Parent).children = node.children.map(nodeDjotToUnist)
	}

	return out
}

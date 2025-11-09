import type {
	AstNode,
	Block,
	Document,
	Inline,
	Literal,
	Node,
	Raw,
	RawInline,
	SmartPunctuationType,
} from "djast"
import type {
	Element as HastElement,
	ElementContent as HastElementContent,
	Text as HastText,
	Root,
} from "hast"
import type { Node as UnistNode } from "unist"

export function toHast(tree: Document, _options: null): Root {
	const out: Root = {
		type: "root",
		children: convertNodeList(tree.children),
	}

	return out
}

export function convertNode(node: AstNode): HastElement | HastText | null {
	switch (node.type) {
		case "paragraph": {
			return makeElement(node, "p")
		}
		case "heading": {
			return makeElement(node, `h${node.level}`)
		}
		case "thematicBreak": {
			return makeElement(node, "hr")
		}
		case "section": {
			return makeElement(node, "section")
		}
		case "div": {
			return makeElement(node, "div")
		}
		case "blockquote": {
			return makeElement(node, "blockquote")
		}
		case "code": {
			const out = makeElement(node, "pre")
			out.children.push({
				type: "element",
				tagName: "code",
				properties: { lang: node.lang },
				children: [{ type: "text", value: node.value }],
			})
			return out
		}
		case "raw": {
			return makeRaw(node)
		}
		case "list": {
			return makeElement(node, "ul")
		}
		case "listItem": {
			return makeElement(node, "li")
		}
		case "taskList": {
			todo()
		}
		case "taskListItem": {
			todo()
		}
		case "orderedList": {
			return makeElement(node, "ol")
		}
		case "caption": {
			todo()
		}
		case "table": {
			todo()
		}
		case "text": {
			return {
				type: "text",
				value: node.value,
				position: node.position,
			}
		}
		case "footnoteReference": {
			todo()
		}
		case "smartPunctuation": {
			return {
				type: "text",
				value: punctuation(node.kind),
				position: node.position,
			}
		}
		case "softBreak": {
			return { type: "text", value: " " }
		}
		case "hardBreak": {
			return makeElement(node, "br")
		}
		case "nonBreakingSpace": {
			todo()
		}
		case "symbol": {
			todo()
		}
		case "verbatim": {
			return makeElement(node, "code")
		}
		case "rawInline": {
			return makeRaw(node)
		}
		case "inlineMath": {
			todo()
		}
		case "displayMath": {
			todo()
		}
		case "url": {
			const out = makeElement(node, "url")
			out.properties.href = node.value
			return out
		}
		case "email": {
			todo()
		}
		case "link": {
			const out = makeElement(node, "a")
			out.properties.href = `#${node.reference}`
			return out
		}
		case "image": {
			todo()
		}
		case "emphasis": {
			return makeElement(node, "em")
		}
		case "strong": {
			return makeElement(node, "strong")
		}
		case "span": {
			return makeElement(node, "span")
		}
		case "mark": {
			todo()
		}
		case "superscript": {
			return makeElement(node, "sup")
		}
		case "subscript": {
			return makeElement(node, "sub")
		}
		case "delete": {
			return makeElement(node, "del")
		}
		case "insert": {
			return makeElement(node, "ins")
		}
		case "doubleQuoted": {
			todo()
		}
		case "singleQuoted": {
			todo()
		}
		case "definitionList": {
			return makeElement(node, "dl")
		}
		case "definitionListItem": {
			todo()
		}
		case "term": {
			todo()
		}
		case "definition": {
			todo()
		}
		case "row": {
			return makeElement(node, "tr")
		}
		case "cell": {
			return makeElement(node, "th")
		}
		case "reference": {
			todo()
		}
		case "footnote": {
			todo()
		}
		case "document": {
			todo()
		}
	}
}

function makeElement(node: AstNode, tagName: string): HastElement {
	const out: HastElement = {
		type: "element",
		tagName: tagName,
		properties: {
			...node.attributes,
			...node.autoAttributes,
		},
		children: [],
		position: node.position,
	}

	if ("children" in node) {
		out.children = convertNodeList(node.children)
	} else if ("value" in node) {
		out.children.push({ type: "text", value: node.value })
	}

	return out
}

function makeRaw(node: RawInline | Raw): HastElement | HastText {
	if (node.format === "html") {
		return {
			// Raw nodes aren't in the hast API, but they
			// are used by `rehype-raw` and are supported
			// by `rehype-stringify`

			// @ts-expect-error
			type: "raw",
			position: node.position,
			value: node.value,
		}
	} else {
		// TODO: is there a better way to skip an element?
		return { type: "text", value: "" }
	}
}

function convertNodeList(nodes: AstNode[]): (HastElement | HastText)[] {
	const out = []
	for (const node of nodes) {
		const hastNode = convertNode(node)
		if (hastNode) {
			out.push(hastNode)
		}
	}
	return out
}

function todo(msg?: "string"): never {
	throw new Error(`TODO: ${msg ?? "Not yet implemented"}`)
}

function punctuation(kind: SmartPunctuationType): string {
	switch (kind) {
		case "left_single_quote": {
			return "'"
		}
		case "right_single_quote": {
			return "'"
		}
		case "left_double_quote": {
			return '"'
		}
		case "right_double_quote": {
			return '"'
		}
		case "ellipses": {
			return "..."
		}
		case "en_dash": {
			return "–"
		}
		case "em_dash": {
			return "—"
		}
	}
}

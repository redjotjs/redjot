import type { Document, Node, Block, Inline, Literal, AstNode } from "djast"
import type {
	Root,
	Element as HastElement,
	Text as HastText,
	ElementContent as HastElementContent,
} from "hast"
import type { Node as UnistNode } from "unist"

export function toHast(tree: Document, _options: null): Root {
	const out: Root = {
		type: "root",
		children: tree.children.map(convertNode),
	}

	return out
}

export function convertNode(node: AstNode): HastElement | HastText {
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
			const out = makeElement(node, "pre")
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
			todo()
		}
		case "softBreak": {
			// ?
			todo()
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
			todo()
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
			todo()
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
		for (const child of node.children) {
			out.children.push(convertNode(child))
		}
	} else if ("value" in node) {
		out.children.push({ type: "text", value: node.value })
	}

	return out
}

function todo(): never {
	throw new Error("TODO: Not yet implemented.")
}

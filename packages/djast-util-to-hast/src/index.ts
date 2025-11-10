import type {
	AstNode,
	Block,
	Document,
	FootnoteReference,
	Inline,
	Literal,
	Node,
	Raw,
	Footnote,
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

export function toHast(tree: Document, options: Options): Root {
	const converter = new Converter(options)
	console.log(tree)
	return converter.convertDocument(tree)
}

export type Options = {
	smartPunctuation: {
		left_single_quote: string
		right_single_quote: string
		left_double_quote: string
		right_double_quote: string
		ellipses: string
		en_dash: string
		em_dash: string
	}
}

class Converter {
	options: Options = {
		smartPunctuation: {
			left_single_quote: "'",
			right_single_quote: "'",
			left_double_quote: `"`,
			right_double_quote: `"`,
			ellipses: "...",
			en_dash: "–",
			em_dash: "—",
		},
	}

	constructor(options: Options) {
		this.options = { ...this.options, ...options }
	}

	convertDocument(tree: Document): Root {
		const children = this.convertNodeList(tree.children)

		if (Object.keys(tree.footnotes).length > 0) {
			const endnotes = this.convertFootnotes(tree.footnotes)
			children.push(endnotes)
		}

		return {
			type: "root",
			children,
		}
	}

	convertNode(node: AstNode): HastElement | HastText {
		switch (node.type) {
			case "paragraph": {
				return this.makeElement(node, "p")
			}
			case "heading": {
				return this.makeElement(node, `h${node.level}`)
			}
			case "thematicBreak": {
				return this.makeElement(node, "hr")
			}
			case "section": {
				return this.makeElement(node, "section")
			}
			case "div": {
				return this.makeElement(node, "div")
			}
			case "blockquote": {
				return this.makeElement(node, "blockquote")
			}
			case "code": {
				const out = this.makeElement(node, "pre")
				out.children[0] = {
					type: "element",
					tagName: "code",
					properties: { lang: node.lang },
					children: [
						{
							type: "text",
							value: node.value,
						},
					],
				}
				return out
			}
			case "raw": {
				return makeRaw(node)
			}
			case "list": {
				return this.makeElement(node, "ul")
			}
			case "listItem": {
				return this.makeElement(node, "li")
			}
			case "taskList": {
				todo()
			}
			case "taskListItem": {
				todo()
			}
			case "orderedList": {
				return this.makeElement(node, "ol")
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
				const refName: HastText = {
					type: "text",
					value: node.value,
				}
				const sup: HastElement = {
					type: "element",
					tagName: "sup",
					children: [refName],
					properties: {},
				}
				const out = makeNode(node, "a", {
					href: `#fn:${node.value}`,
					id: `fnref:${node.value}`,
				})
				out.children.push(sup)
				return out
			}
			case "smartPunctuation": {
				return {
					type: "text",
					value: this.options.smartPunctuation[
						node.kind
					],
					position: node.position,
				}
			}
			case "softBreak": {
				return { type: "text", value: " " }
			}
			case "hardBreak": {
				return this.makeElement(node, "br")
			}
			case "nonBreakingSpace": {
				todo()
			}
			case "symbol": {
				todo()
			}
			case "verbatim": {
				return this.makeElement(node, "code")
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
				return this.makeElement(node, "url", {
					href: node.value,
				})
			}
			case "email": {
				todo()
			}
			case "link": {
				return this.makeElement(node, "a", {
					href: `#${node.reference}`,
				})
			}
			case "image": {
				// TODO: alt
				return makeNode(node, "img", {
					src:
						node.destination ??
						"TODO: reference",
				})
			}
			case "emphasis": {
				return this.makeElement(node, "em")
			}
			case "strong": {
				return this.makeElement(node, "strong")
			}
			case "span": {
				return this.makeElement(node, "span")
			}
			case "mark": {
				todo()
			}
			case "superscript": {
				return this.makeElement(node, "sup")
			}
			case "subscript": {
				return this.makeElement(node, "sub")
			}
			case "delete": {
				return this.makeElement(node, "del")
			}
			case "insert": {
				return this.makeElement(node, "ins")
			}
			case "doubleQuoted": {
				todo()
			}
			case "singleQuoted": {
				todo()
			}
			case "definitionList": {
				return this.makeElement(node, "dl")
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
				return this.makeElement(node, "tr")
			}
			case "cell": {
				return this.makeElement(node, "th")
			}
			case "reference": {
				todo()
			}
			case "footnote":
			case "document": {
				unreachable()
			}
		}
	}

	convertNodeList(nodes: AstNode[]): (HastElement | HastText)[] {
		const out = []
		for (const node of nodes) {
			const hastNode = this.convertNode(node)
			if (hastNode) {
				out.push(hastNode)
			}
		}
		return out
	}

	convertFootnote(footnote: Footnote): HastElement {
		const out = this.makeElement(footnote, "li")
		out.properties.id = `fn:${footnote.label}`
		const backlink: HastElement = {
			type: "element",
			tagName: "a",
			properties: {
				href: `#fnref:${footnote.label}`,
				role: "doc-backlink",
			},
			children: [{ type: "text", value: "↩" }],
		}
		out.children.push(backlink)
		return out
	}

	convertFootnotes(footnotes: Record<string, Footnote>): HastElement {
		const hr: HastElement = {
			type: "element",
			tagName: "hr",
			children: [],
			properties: {},
		}

		const footnoteList = Object.values(footnotes).map(f =>
			this.convertFootnote(f),
		)
		const ol: HastElement = {
			type: "element",
			tagName: "ol",
			children: footnoteList,
			properties: {},
		}

		const endnotes: HastElement = {
			type: "element",
			tagName: "section",
			properties: {
				role: "doc-endnotes",
			},
			children: [hr, ol],
		}

		return endnotes
	}

	makeElement(
		node: AstNode,
		tagName: string,
		properties?: Record<string, string>,
	): HastElement {
		const out = makeNode(node, tagName)

		if ("children" in node) {
			out.children = this.convertNodeList(node.children)
		} else if ("value" in node) {
			out.children.push({ type: "text", value: node.value })
		}

		return out
	}
}

function makeNode(
	node: AstNode,
	tagName: string,
	properties?: Record<string, string>,
): HastElement {
	return {
		type: "element",
		tagName: tagName,
		properties: {
			...node.attributes,
			...node.autoAttributes,
			...properties,
		},
		children: [],
		position: node.position,
	}
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

function todo(msg?: string): never {
	throw new Error(`TODO: ${msg ?? "Not yet implemented"}`)
}

function unreachable(): never {
	throw new Error("This branch must not be reached")
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

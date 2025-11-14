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
	Image,
	Link,
} from "djast"
import type {
	ElementContent,
	Element as HastElement,
	ElementContent as HastElementContent,
	Text as HastText,
	Root,
} from "hast"
import type { Node as UnistNode } from "unist"

export function toHast(tree: Document, options: Options): Root {
	const converter = new Converter(tree, options)
	console.log(tree)
	return converter.convert()
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
	tree: Document

	constructor(tree: Document, options: Options) {
		this.tree = tree
		this.options = { ...this.options, ...options }
	}

	convert(): Root {
		const children: HastElementContent[] = []
		this.convertNodeList(this.tree.children, children)

		const footnotes = this.tree.footnotes
		if (Object.keys(footnotes).length > 0) {
			const endnotes = this.convertFootnotes(footnotes)
			children.push(endnotes)
		}

		const root: Root = {
			type: "root",
			children,
		}

		return root
	}

	convertNode(node: AstNode, dst: ElementContent[]) {
		switch (node.type) {
			case "paragraph": {
				dst.push(this.makeElement(node, "p"))
				break
			}
			case "heading": {
				dst.push(
					this.makeElement(
						node,
						`h${node.level}`,
					),
				)
				break
			}
			case "thematicBreak": {
				dst.push(this.makeElement(node, "hr"))
				break
			}
			case "section": {
				dst.push(this.makeElement(node, "section"))
				break
			}
			case "div": {
				dst.push(this.makeElement(node, "div"))
				break
			}
			case "blockquote": {
				dst.push(this.makeElement(node, "blockquote"))
				break
			}
			case "code": {
				const pre = this.makeElement(node, "pre")
				pre.children[0] = {
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
				dst.push(pre)
				break
			}
			case "raw": {
				makeRaw(node, dst)
				break
			}
			case "list": {
				dst.push(this.makeElement(node, "ul"))
				break
			}
			case "listItem": {
				dst.push(this.makeElement(node, "li"))
				break
			}
			case "taskList": {
				todo()
			}
			case "taskListItem": {
				todo()
			}
			case "orderedList": {
				dst.push(this.makeElement(node, "ol"))
				break
			}
			case "caption": {
				todo()
			}
			case "table": {
				todo()
			}
			case "text": {
				dst.push({
					type: "text",
					value: node.value,
					position: node.position,
				})
				break
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
				dst.push(out)
				break
			}
			case "smartPunctuation": {
				dst.push({
					type: "text",
					value: this.options.smartPunctuation[
						node.kind
					],
					position: node.position,
				})
				break
			}
			case "softBreak": {
				dst.push({ type: "text", value: " " })
				break
			}
			case "hardBreak": {
				dst.push(this.makeElement(node, "br"))
				break
			}
			case "nonBreakingSpace": {
				dst.push({
					type: "text",
					value: "\u00A0",
					position: node.position,
				})
				break
			}
			case "symbol": {
				todo()
			}
			case "verbatim": {
				dst.push(this.makeElement(node, "code"))
				break
			}
			case "rawInline": {
				makeRaw(node, dst)
				break
			}
			case "inlineMath": {
				todo()
			}
			case "displayMath": {
				todo()
			}
			case "url": {
				dst.push(
					this.makeElement(node, "url", {
						href: node.value,
					}),
				)
				break
			}
			case "email": {
				const a = this.makeElement(node, "a", {
					href: `mailto:${node.value}`,
				})
				dst.push(a)
				break
			}
			case "link": {
				const target = this.getTarget(node)
				const a = this.makeElement(node, "a", {
					href: target,
				})
				dst.push(a)
				break
			}
			case "image": {
				// TODO: alt
				const target = this.getTarget(node)
				const img = makeNode(node, "img", {
					src:
						node.destination ??
						"TODO: reference",
				})
				dst.push(img)
				break
			}
			case "emphasis": {
				dst.push(this.makeElement(node, "em"))
				break
			}
			case "strong": {
				dst.push(this.makeElement(node, "strong"))
				break
			}
			case "span": {
				dst.push(this.makeElement(node, "span"))
				break
			}
			case "mark": {
				dst.push(this.makeElement(node, "mark"))
				break
			}
			case "superscript": {
				dst.push(this.makeElement(node, "sup"))
				break
			}
			case "subscript": {
				dst.push(this.makeElement(node, "sub"))
				break
			}
			case "delete": {
				dst.push(this.makeElement(node, "del"))
				break
			}
			case "insert": {
				dst.push(this.makeElement(node, "ins"))
				break
			}
			case "doubleQuoted": {
				dst.push({
					type: "text",
					value: this.options.smartPunctuation
						.left_double_quote,
				})
				this.convertNodeList(node.children, dst)
				dst.push({
					type: "text",
					value: this.options.smartPunctuation
						.right_double_quote,
				})
				break
			}
			case "singleQuoted": {
				dst.push({
					type: "text",
					value: this.options.smartPunctuation
						.left_single_quote,
				})
				this.convertNodeList(node.children, dst)
				dst.push({
					type: "text",
					value: this.options.smartPunctuation
						.right_single_quote,
				})
				break
			}
			case "definitionList": {
				dst.push(this.makeElement(node, "dl"))
				break
			}
			case "definitionListItem": {
				const [term, definition] = node.children
				console.log(term)
				console.log(definition)

				this.convertNode(term, dst)
				this.convertNode(definition, dst)

				break
			}
			case "term": {
				dst.push(this.makeElement(node, "dt"))
				break
			}
			case "definition": {
				dst.push(this.makeElement(node, "dd"))
				break
			}
			case "row": {
				dst.push(this.makeElement(node, "tr"))
				break
			}
			case "cell": {
				dst.push(this.makeElement(node, "th"))
				break
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

	convertNodeList(from: AstNode[], to: HastElementContent[]): void {
		for (const node of from) {
			this.convertNode(node, to)
		}
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
		const out = makeNode(node, tagName, properties)

		if ("children" in node) {
			this.convertNodeList(node.children, out.children)
		} else if ("value" in node) {
			out.children.push({ type: "text", value: node.value })
		}

		return out
	}

	getTarget(node: Image | Link): string {
		if (node.destination) {
			return node.destination
		} else if (node.reference) {
			const ref = this.tree.references[node.reference]
			return ref.destination
		} else {
			unreachable()
		}
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

function makeRaw(node: RawInline | Raw, dst: HastElementContent[]): void {
	if (node.format === "html") {
		dst.push({
			// Raw nodes aren't in the hast API, but they
			// are used by `rehype-raw` and are supported
			// by `rehype-stringify`

			// @ts-expect-error
			type: "raw",
			position: node.position,
			value: node.value,
		})
	}
	// otherwise do nothing
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

import type * as djot from "@djot/djot"
import type { Position } from "unist"
import type { Block, Document, Literal, Node, Parent } from "."

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

function convertType(tag: string): string {
	switch (tag) {
		case "para":
			return "paragraph"
		case "heading":
			return "heading"
		case "thematic_break":
			return "thematicBreak"
		case "section":
			return "section"
		case "div":
			return "div"
		case "block_quote":
			return "blockquote"
		case "code_block":
			return "code"
		case "raw_block":
			return "raw"
		case "bullet_list":
			return "list"
		case "list_item":
			return "listItem"
		case "task_list":
			return "taskList"
		case "task_list_item":
			return "taskListItem"
		case "ordered_list":
			return "orderedList"
		case "caption":
			return "caption"
		case "table":
			return "table"
		case "str":
			return "text"
		case "footnote_reference":
			return "footnoteReference"
		case "smart_punctuation":
			return "smartPunctuation"
		case "soft_break":
			return "softBreak"
		case "hard_break":
			return "hardBreak"
		case "non_breaking_space":
			return "nonBreakingSpace"
		case "symb":
			return "symb"
		case "verbatim":
			return "verbatim"
		case "raw_inline":
			return "rawInline"
		case "inline_math":
			return "inlineMath"
		case "display_math":
			return "displayMath"
		case "url":
			return "url"
		case "email":
			return "email"
		case "link":
			return "link"
		case "image":
			return "image"
		case "emph":
			return "emph"
		case "strong":
			return "strong"
		case "span":
			return "span"
		case "mark":
			return "mark"
		case "superscript":
			return "superscript"
		case "subscript":
			return "subscript"
		case "delete":
			return "delete"
		case "insert":
			return "insert"
		case "double_quoted":
			return "doubleQuoted"
		case "single_quoted":
			return "singleQuoted"
		case "definition_list":
			return "definitionList"
		case "definition_list_item":
			return "definitionListItem"
		case "term":
			return "term"
		case "definition":
			return "definition"
		case "row":
			return "row"
		case "cell":
			return "cell"
		case "reference":
			return "reference"
		case "footnote":
			return "footnote"
		case "doc":
			return "document"
		default:
			throw Error(`Unknown Djot AST node tag: '${tag}'`)
	}
}

export function fromDjotAstNode(node: djot.AstNode): Node {
	const out: Node = {
		type: convertType(node.tag),
		attributes: node.attributes,
		autoAttributes: node.autoAttributes,
		position: posDjotToUnist(node.pos),
	}

	if ("text" in node) {
		;(out as Literal).value = node.text
	}

	for (const [key, value] of Object.entries(node)) {
		if (IGNORE.includes(key)) {
			continue
		}
		// biome-ignore lint/suspicious/noExplicitAny: TODO
		;(out as any)[key] = value
	}

	if ("children" in node) {
		;(out as Parent).children = node.children.map(fromDjotAstNode)
	}

	return out
}

// Returns any because it's easier to do that setting up Djot to redjot type
// mappings.
export function convertRecord(
	record: Record<string, djot.AstNode>,
	// biome-ignore lint/suspicious/noExplicitAny: see above
): Record<string, any> {
	return Object.fromEntries(
		Object.entries(record).map(([key, value]) => [
			key,
			fromDjotAstNode(value),
		]),
	)
}

export function fromDjotDoc(ast: djot.Doc): Parent {
	const out: Document = {
		type: "document",
		references: convertRecord(ast.references),
		autoReferences: convertRecord(ast.autoReferences),
		footnotes: convertRecord(ast.footnotes),
		autoAttributes: ast.autoAttributes,
		position: posDjotToUnist(ast.pos),
		children: [],
	}

	out.children = ast.children.map(fromDjotAstNode) as Block[]

	return out
}

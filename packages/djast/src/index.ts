import type {
	Alignment,
	Attributes,
	BulletListStyle as ListStyle,
	OrderedListStyle,
	SmartPunctuationType,
} from "@djot/djot"
import type {
	Literal as UnistLiteral,
	Node as UnistNode,
	Parent as UnistParent,
} from "unist"

export type {
	Attributes,
	BulletListStyle as ListStyle,
	OrderedListStyle,
	SmartPunctuationType,
} from "@djot/djot"

export interface Node extends UnistNode {
	attributes?: Attributes
	autoAttributes?: Attributes
}

export interface Literal extends Node, UnistLiteral {
	value: string
}

export interface Parent extends Node, UnistParent {
	children: AstNode[]
}

export interface BlockParent extends Parent {
	children: Block[]
}

export interface InlineParent extends Parent {
	children: Inline[]
}

export interface Document extends BlockParent {
	type: "document"
	references: Record<string, Reference>
	autoReferences: Record<string, Reference>
	footnotes: Record<string, Footnote>
}

export type Block =
	| Paragraph
	| Heading
	| ThematicBreak
	| Section
	| Div
	| Code
	| Raw
	| Blockquote
	| OrderedList
	| List
	| TaskList
	| DefinitionList
	| Table

export interface Paragraph extends Parent {
	type: "paragraph"
}

export interface Heading extends InlineParent {
	type: "heading"
	level: number
}

export interface ThematicBreak extends Node {
	type: "thematicBreak"
}

export interface Section extends BlockParent {
	type: "section"
}

export interface Div extends BlockParent {
	type: "div"
}

export interface Blockquote extends BlockParent {
	type: "blockquote"
}

export interface Code extends Literal {
	type: "code"
	lang?: string
}

export interface Raw extends Literal {
	type: "raw"
	format: string
}

export interface List extends Parent {
	type: "list"
	tight: boolean
	style: ListStyle
	children: ListItem[]
}

export interface ListItem extends BlockParent {
	type: "listItem"
}

export interface TaskList extends Parent {
	type: "taskList"
	tight: boolean
	children: TaskListItem[]
}

export interface TaskListItem extends BlockParent {
	type: "taskListItem"
	checkbox: "checked" | "unchecked"
}

export interface OrderedList extends Parent {
	type: "orderedList"
	style: OrderedListStyle
	tight: boolean
	start?: number
	children: ListItem[]
}

export interface DefinitionList extends Parent {
	type: "definitionList"
	children: DefinitionListItem[]
}

export interface DefinitionListItem extends Parent {
	type: "definitionListItem"
	children: [Term, Definition]
}

export interface Caption extends InlineParent {
	type: "caption"
}

export interface Table extends Parent {
	type: "table"
	children: [Caption, ...Row[]]
}

export type Inline =
	| Text
	| SoftBreak
	| HardBreak
	| NonBreakingSpace
	| Symbol
	| Verbatim
	| RawInline
	| InlineMath
	| DisplayMath
	| Url
	| Email
	| FootnoteReference
	| SmartPunctuation
	| Emphasis
	| Strong
	| Link
	| Image
	| Span
	| Mark
	| Superscript
	| Subscript
	| Insert
	| Delete
	| DoubleQuoted
	| SingleQuoted

export interface Text extends Literal {
	type: "text"
}

export interface FootnoteReference extends Literal {
	type: "footnoteReference"
}

export interface SmartPunctuation extends Literal {
	type: "smartPunctuation"
	kind: SmartPunctuationType
}

export interface SoftBreak extends Node {
	type: "softBreak"
}

export interface HardBreak extends Node {
	type: "hardBreak"
}

export interface NonBreakingSpace extends Node {
	type: "nonBreakingSpace"
}

export interface Symbol extends Literal {
	type: "symbol"
	alias: string
}

export interface Verbatim extends Literal {
	type: "verbatim"
}

export interface RawInline extends Literal {
	type: "rawInline"
	format: string
}

export interface InlineMath extends Literal {
	type: "inlineMath"
}

export interface DisplayMath extends Literal {
	type: "displayMath"
}

export interface Url extends Literal {
	type: "url"
}

export interface Email extends Literal {
	type: "email"
}

export interface Link extends InlineParent {
	type: "link"
	destination?: string
	reference?: string
}

export interface Image extends InlineParent {
	type: "image"
	destination?: string
	reference?: string
}

export interface Emphasis extends InlineParent {
	type: "emphasis"
}

export interface Strong extends InlineParent {
	type: "strong"
}

export interface Span extends InlineParent {
	type: "span"
}

export interface Mark extends InlineParent {
	type: "mark"
}

export interface Superscript extends InlineParent {
	type: "superscript"
}

export interface Subscript extends InlineParent {
	type: "subscript"
}

export interface Delete extends InlineParent {
	type: "delete"
}

export interface Insert extends InlineParent {
	type: "insert"
}

export interface DoubleQuoted extends InlineParent {
	type: "doubleQuoted"
}

export interface SingleQuoted extends InlineParent {
	type: "singleQuoted"
}

export interface Term extends InlineParent {
	type: "term"
}

export interface Definition extends BlockParent {
	type: "definition"
}

export interface Row extends Parent {
	type: "row"
	head: boolean
	children: Cell[]
}

export interface Cell extends InlineParent {
	type: "cell"
	head: boolean
	align: Alignment
}

export interface Reference extends Parent {
	type: "reference"
	label: string
	destination: string
}

export interface Footnote extends BlockParent {
	type: "footnote"
	label: string
}

export type AstNode =
	| Document
	| Block
	| Inline
	| ListItem
	| TaskListItem
	| DefinitionListItem
	| Term
	| Definition
	| Row
	| Cell
	| Caption
	| Footnote
	| Reference

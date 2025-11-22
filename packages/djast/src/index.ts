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

/**
 * An interface for properties shared by all Djot AST nodes.
 */
export interface Node extends UnistNode {
	/**
	 * [Manually defined attributes][a].  `#<id>` definitions will be
	 * converted to an `id` attribute and all `.<class>` declarations will
	 * be turned into one `class` attribute whose value is a string of
	 * space-delimited declaration identifiers (so, `{.a .b}` will turn
	 * into `"class": "a b"`).
	 *
	 * [a]: https://htmlpreview.github.io/?https://github.com/jgm/djot/blob/master/doc/syntax.html#inline-attributes
	 */
	attributes?: Attributes
	/**
	 * Attributes added by the djot.js parser.  This includes automatic ids
	 * on `Section` elements and a few others.
	 */
	autoAttributes?: Attributes
}

export interface Literal extends Node, UnistLiteral {
	value: string
}

/**
 * A generic interface for elements which can have children.  This includes
 * both block (`BlockParent`) and inline (`InlineParent`) elements.
 */
export interface Parent extends Node, UnistParent {
	children: AstNode[]
}

/**
 * Shared block-level parent element interface.  For a union of all concrete
 * block parent AST nodes see `Block`.
 */
export interface BlockParent extends Parent {
	children: Block[]
}

export interface InlineParent extends Parent {
	children: Inline[]
}

/**
 * Top-level AST element, which represents a parsed Djot document.
 */
export interface Document extends BlockParent {
	type: "document"
	references: Record<string, Reference>
	autoReferences: Record<string, Reference>
	/**
	 * A map of footnotes with keys appearing in the same order the
	 * references go in the document body.
	 */
	footnotes: Record<string, Footnote>
}

/**
 * All Djot [block-level AST nodes][block]
 *
 * [block]: https://htmlpreview.github.io/?https://github.com/jgm/djot/blob/master/doc/syntax.html#block-syntax
 */
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

/**
 * [Paragraph], a generic block element which is created when a sequence of
 * non-blank lines can't be parsed as any other block.
 *
 * [Paragraph]: https://htmlpreview.github.io/?https://github.com/jgm/djot/blob/master/doc/syntax.html#paragraph
 */
export interface Paragraph extends Parent {
	type: "paragraph"
}

/**
 * [ATX-style][atx] [heading].  Can be multiline.
 *
 * [atx]: https://spec.commonmark.org/0.31.2/#atx-headings
 * [heading]: https://htmlpreview.github.io/?https://github.com/jgm/djot/blob/master/doc/syntax.html#paragraph
 */
export interface Heading extends InlineParent {
	type: "heading"
	/** Will always be between 1 and 6, inclusively. */
	level: number
}

/**
 * An equivalent of the HTML `<hr>` element, typically rendered as a horizontal
 * line.
 */
export interface ThematicBreak extends Node {
	type: "thematicBreak"
}

/**
 * Section is a container element automatically which wraps sequences of block
 * elements which start with a heading.
 */
export interface Section extends BlockParent {
	type: "section"
}

/**
 * [User-defined container element][div] which can be used for custom styling
 * or processing down in the conversion pipeline.
 *
 * [div]: https://htmlpreview.github.io/?https://github.com/jgm/djot/blob/master/doc/syntax.html#div
 */
export interface Div extends BlockParent {
	type: "div"
}

/**
 * [A block quote][b].
 *
 * [b]: https://htmlpreview.github.io/?https://github.com/jgm/djot/blob/master/doc/syntax.html#block-quote
 */
export interface Blockquote extends BlockParent {
	type: "blockquote"
}

/**
 * Pre-formatted [code block][c].
 *
 * [c]: https://htmlpreview.github.io/?https://github.com/jgm/djot/blob/master/doc/syntax.html#code-block
 */
export interface Code extends Literal {
	type: "code"
	/**
	 * Language identifier.  It can be written with whitespace in the
	 * document (```` ``` ruby ````), in which case the string will be
	 * trimmed (so, `lang` will have a value or `ruby` in this example).
	 */
	lang?: string
}

/**
 * [Text to be inserted verbatim][raw] when converting Djot to a certain
 * format.
 *
 * [raw]: https://htmlpreview.github.io/?https://github.com/jgm/djot/blob/master/doc/syntax.html#raw-block
 */
export interface Raw extends Literal {
	type: "raw"
	/**
	 * The raw block format excluding the leading `=`.  Can be used for
	 * verbatim insertion (e.g. `html`) or for use in the processing
	 * pipeline (for example for inserting a `metadata` front matter to be
	 * parsed in static website generators).
	 */
	format: string
}

/**
 * [An unordered list].  See the properties for the style information.
 *
 * [l]: https://htmlpreview.github.io/?https://github.com/jgm/djot/blob/master/doc/syntax.html#list
 */
export interface List extends Parent {
	type: "list"
	/**
	 * `true` if there is whitespace between at least a single pair of list
	 * items, `false` otherwise.
	 */
	tight: boolean
	/**
	 * Bullet point style, one of `+`, `-`, or `*`.
	 */
	style: ListStyle
	/**
	 * A list of children.  This overwrites the `children` property on
	 * `Parent`, because `List`'s direct children can only be of type
	 * `ListItem`.
	 */
	children: ListItem[]
}

/**
 * Unordered list item.
 */
export interface ListItem extends BlockParent {
	type: "listItem"
}

/**
 * Task list, similar [to those of GitHub-flavored Markdown][gfm].
 *
 * [gfm]
 */
export interface TaskList extends Parent {
	type: "taskList"
	/**
	 * `true` if any pair of list items has a blank line between them.
	 */
	tight: boolean
	children: TaskListItem[]
}

/**
 * [Task list item][i].
 *
 * [i]: https://htmlpreview.github.io/?https://github.com/jgm/djot/blob/master/doc/syntax.html#task-list-item
 */
export interface TaskListItem extends BlockParent {
	type: "taskListItem"
	/**
	 * `checked` if it has the form `[x]` or `[X]`, `unchecked` if it's
	 * empty (`[ ]` with a single space).
	 */
	checkbox: "checked" | "unchecked"
}

/**
 * Numbered list.
 */
export interface OrderedList extends Parent {
	type: "orderedList"
	/**
	 * Digits, Latin letters, or Roman numerals (the latter two in
	 * upper/lower case variants) with various combinations of parenthesis
	 * or a closing dot.
	 */
	style: OrderedListStyle
	/**
	 * `true` if any pair of list items has a blank line between them.
	 */
	tight: boolean
	/**
	 * The starting index of the list if it's not a 1.  Will always be
	 * non-negative.
	 */
	start?: number
	children: ListItem[]
}

/**
 * A list of definitions, equivalent to the HTML `<dl>` element.
 */
export interface DefinitionList extends Parent {
	type: "definitionList"
	children: DefinitionListItem[]
}

/**
 * [A definition list element][d], consisting of a term and definition tuple.
 *
 * [d]: https://htmlpreview.github.io/?https://github.com/jgm/djot/blob/master/doc/syntax.html#definition-list-item
 */
export interface DefinitionListItem extends Parent {
	type: "definitionListItem"
	/**
	 * Note that in HTML there is no "definition list item" container, so
	 * `DefinitionListItem` is erased during conversion and is replaced
	 * with consecutive term and definition elements.
	 */
	children: [Term, Definition]
}

/**
 * [Table caption][c].  Despite following the table in markup, it'll be the
 * first child of `Table` in the AST.  For tables without a caption, an empty
 * caption element will be inserted.
 *
 * [c]: https://htmlpreview.github.io/?https://github.com/jgm/djot/blob/master/doc/syntax.html#:~:text=You%20can%20attach%20a%20caption,syntax:
 */
export interface Caption extends InlineParent {
	type: "caption"
}

/**
 * [Pipe table][t].
 *
 * [t]: https://htmlpreview.github.io/?https://github.com/jgm/djot/blob/master/doc/syntax.html#pipe-table
 */
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

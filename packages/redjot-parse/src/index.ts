import * as djot from "@djot/djot"
import type { Document } from "djast"
import { fromDjotDoc } from "djast-util-from-djot"
import type { Processor } from "unified"

export default function redjotParse(this: Processor): void {
	this.parser = parse
}

export function parse(document: string): Document {
	const doc = djot.parse(document, { sourcePositions: true })
	return fromDjotDoc(doc)
}

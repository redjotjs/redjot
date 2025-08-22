import * as djot from "@djot/djot"
import type { Processor } from "unified"
// TODO
import { type Document, fromDjotDoc } from "../../djast/src"

export default function redjotParse(this: Processor): void {
	this.parser = parse
}

export function parse(document: string): Document {
	const doc = djot.parse(document, { sourcePositions: true })
	return fromDjotDoc(doc)
}

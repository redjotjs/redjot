import * as djot from "@djot/djot"
import type { Document } from "djast"
import { fromDjot } from "djast-util-from-djot"
import type { Processor } from "unified"

export default function redjotParse(this: Processor): void {
	this.parser = fromDjot
}

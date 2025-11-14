import type { Document } from "djast"
import { type Options, toHast } from "djast-util-to-hast"
import type { Root } from "hast"

export default function redjotRehype(_destination?: null, options?: Options) {
	return (tree: Document): Root => toHast(tree, options)
}

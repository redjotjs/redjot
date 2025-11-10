import type { Document } from "djast"
import { toHast, type Options } from "djast-util-to-hast"
import type { Root } from "hast"

export default function redjotRehype(_destination, options: Options) {
	return (tree: Document): Root => toHast(tree, options)
}

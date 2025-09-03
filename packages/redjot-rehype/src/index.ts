import { toHast } from "djast-util-to-hast"
import type { Root } from "hast"
import type { Document } from "djast"

export default function redjotRehype(destination, options: null) {
	return function (tree: Document): Root {
		return toHast(tree, options)
	}
}

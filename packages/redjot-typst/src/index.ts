import { spawn } from "node:child_process"
import type { DisplayMath, InlineMath, Raw, RawInline } from "djast"
import type { Transformer } from "unified"
import type { Node } from "unist"
import { visit } from "unist-util-visit"

export type Options = {
	inlineMath?(node: InlineMath): Promise<void>
	displayMath?(node: DisplayMath): Promise<void>
	raw?(node: Raw): Promise<void>
	rawInline?(node: RawInline): Promise<void>
}

const defaultOptions = {
	async inlineMath(node: InlineMath): Promise<void> {
		const rawSvg = await runTypst(`$${node.value}$`)
		const rawNode = node as unknown as RawInline
		rawNode.type = "rawInline"
		rawNode.value = rawSvg
		rawNode.format = "html"
	},

	async displayMath(node: DisplayMath): Promise<void> {
		const rawSvg = await runTypst(`$ ${node.value} $`)
		const rawNode = node as unknown as Raw
		rawNode.type = "raw"
		rawNode.value = rawSvg
		rawNode.format = "html"
	},

	async raw(node: Raw): Promise<void> {
		const rawSvg = await runTypst(node.value)
		node.value = rawSvg
		node.format = "html"
	},

	async rawInline(node: RawInline): Promise<void> {
		const rawSvg = await runTypst(node.value)
		node.value = rawSvg
		node.format = "html"
	},
}

export default function redjotMetadata(options: Options): Transformer {
	const fullOptions = { ...defaultOptions, ...options }
	return (tree: Node): Promise<void> => {
		return transform(tree, fullOptions)
	}
}

async function transform(
	tree: Node,
	options: typeof defaultOptions,
): Promise<void> {
	const nodes: Node[] = []

	visit(tree, node => {
		const type = node.type
		if (
			type === "inlineMath" ||
			type === "displayMath" ||
			type === "raw" ||
			type === "rawInline"
		) {
			nodes.push(node)
		}
	})

	const promises = []

	for (const node of nodes) {
		switch (node.type) {
			case "inlineMath": {
				promises.push(
					options.inlineMath(node as InlineMath),
				)
				break
			}
			case "displayMath": {
				promises.push(
					options.displayMath(
						node as DisplayMath,
					),
				)
				break
			}
			case "raw": {
				if ((node as Raw).format === "typst") {
					promises.push(options.raw(node as Raw))
				}
				break
			}
			case "rawInline": {
				if ((node as RawInline).format === "typst") {
					promises.push(
						options.rawInline(
							node as RawInline,
						),
					)
				}
				break
			}
		}
	}

	await Promise.all(promises)
}

async function runTypst(inputSource: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const typst = spawn("typst", [
			"compile",
			"-",
			"-",
			"--format",
			"svg",
		])

		let out = ""
		let errorLog = ""

		typst.stdin.write(inputSource)
		typst.stdin.end()

		typst.stdout.on("data", data => {
			out += data.toString()
		})

		typst.stderr.on("data", data => {
			errorLog += data.toString()
		})

		typst.on("close", code => {
			if (code === 0) {
				resolve(out)
			} else {
				reject(
					new Error(
						`Typst exited with code ${code}: ${errorLog}`,
					),
				)
			}
		})

		typst.on("error", err => {
			reject(
				new Error(
					`Failed to start Typst: ${err.message}`,
				),
			)
		})
	})
}

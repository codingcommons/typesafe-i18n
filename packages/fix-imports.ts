import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import glob from 'tiny-glob/sync.js'

const rootPath = resolve(__dirname, '..')

const formats = [
	{ regex: /require\("\.(.*)"\)/g, fileEnding: 'cjs' },
	{ regex: /port .* from '\.(.*)'/g, fileEnding: 'mjs' },
]

const folders = [
	'detectors',
	'runtime/cjs/runtime/src',
	'runtime/esm/runtime/src',
	'formatters',
	'parser',
	'preact',
	'react',
	'solid',
	'svelte',
	'vue',
]

formats.forEach(({ regex, fileEnding }) => {
	const files = folders.flatMap((folder) => glob(`${folder}/**/*.${fileEnding}`))

	files.forEach((file) => {
		const fullFilePath = resolve(__dirname, '..', file)

		const content = readFileSync(fullFilePath).toString()

		const newContent = content.replace(regex, (requireStatement, path) =>
			requireStatement.replace(path, path + `.${fileEnding}`).replace(`.mjs.${fileEnding}`, `.${fileEnding}`),
		)

		writeFileSync(fullFilePath, newContent, { encoding: 'utf8' })

		// eslint-disable-next-line no-console
		console.info(`fixed '${fileEnding}' imports for '${file.replace(rootPath, '')}'`)
	})
})

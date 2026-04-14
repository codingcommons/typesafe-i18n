import { writeFileSync } from 'fs'
import { resolve } from 'path'
import glob from 'tiny-glob/sync.js'

type FromWheretoImport = string
type OutputPath = string
type FilterFunction = (file: string) => boolean

const mappings: [FromWheretoImport, OutputPath?, FilterFunction?][] = [
	['adapter-angular', 'angular'],
	['adapter-preact', 'preact'],
	['adapter-react', 'react'],
	['adapter-solid', 'solid'],
	['adapter-svelte', 'svelte'],
	['adapter-vue', 'vue'],
	['config', 'config', (file) => file === 'index.d.mts'],
	['detectors'],
	['exporter', 'exporter', (file) => file === 'index.d.mts'],
	['formatters'],
	['importer', 'importer', (file) => file === 'index.d.mts'],
	['parser', 'parser', (file) => file === 'index.d.mts'],
	['runtime', 'types'],
	['runtime', 'runtime/cjs/runtime/src'],
	['runtime', 'runtime/esm/runtime/src'],
	['utils'],
]

const goToRoot = (outputPath: string, file: string) => {
	const goUpXTimes = outputPath.startsWith('runtime') ? 3 : 0
	return new Array(file.split('/').length + goUpXTimes).fill('../').join('')
}

mappings.forEach(([fromWheretoImport, outputPath = fromWheretoImport, filterFunction]) => {
	const files = glob(`types/${fromWheretoImport}/src/**/*.d.{ts,mts}`).map((file) =>
		resolve(file)
			.substring(resolve(__dirname, `../types/${fromWheretoImport}/src/`).length + 1)
			.replace(/\\/g, '/'),
	)

	// link generated files to types
	const filteredFiles = (filterFunction && files.filter(filterFunction)) || files

	filteredFiles.forEach((file) => {
		const esm = file.endsWith('.d.mts')
		const fileName = file.replace(esm ? '.d.mts' : '.d.ts', '')

		writeFileSync(
			resolve(__dirname, `../${outputPath}/${file.replace('.d.mts', '.d.ts')}`),
			`export * from '${goToRoot(outputPath, file)}types/${fromWheretoImport}/src/${fileName}.${
				esm ? 'mjs' : 'js'
			}'`,
			{ encoding: 'utf8' },
		)
	})

	// eslint-disable-next-line no-console
	console.info(`types linked for '${outputPath}'`)
})

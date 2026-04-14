/* eslint-disable no-console */
import { context } from 'esbuild'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const watch = process.argv.includes('--watch')

//@ts-ignore
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const getPath = (file: string) => resolve(__dirname, file)

const formats = ['esm', 'cjs'] as const

const contexts = await Promise.all(
	formats.flatMap((format) =>
		[false, true].map((minify) =>
			context({
				entryPoints: ['./src/index.ts'],
				bundle: true,
				outfile: getPath(`../../preact/index${minify ? '.min' : ''}.${format === 'esm' ? 'm' : 'c'}js`),
				external: ['preact', 'preact/hooks'],
				platform: 'browser',
				format,
				sourcemap: watch,
				minify,
				tsconfig: './tsconfig.json',
			}),
		),
	),
)

for (const ctx of contexts) {
	if (watch) {
		await ctx.watch()
		console.info('👀 watching for changes...')
		process.on('exit', async () => {
			console.info('🙈 process killed')
			await ctx.dispose()
		})
	} else {
		await ctx.rebuild()
		console.info('✅ build complete')
		await ctx.dispose()
	}
}

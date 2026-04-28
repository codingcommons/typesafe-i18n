import { resolve, sep } from 'path'
import { isTruthy } from 'typesafe-utils'
import ts from 'typescript'
import type { OutputFormats } from '../../config/src/types.mjs'
import type { Locale } from '../../runtime/src/core.mjs'
import type { BaseTranslation } from '../../runtime/src/index.mjs'
import { fileEnding } from './output-handler.mjs'
import {
	containsFolders,
	createPathIfNotExits,
	deleteFolderRecursive,
	doesPathExist,
	getDirectoryStructure,
	importFile,
} from './utils/file.utils.mjs'
import { logger } from './utils/logger.mjs'

/**
 * looks for the location of the compiled 'index.js' file
 * if the 'index.ts' file imports something from outside it's directory, we need to find the correct path to the base location file
 */
const detectLocationOfCompiledBaseTranslation = async (
	outputPath: string,
	outputFormat: OutputFormats,
	locale: string,
	tempPath: string,
	typesFileName: string,
): Promise<string> => {
	if (!containsFolders(tempPath)) return ''

	const directory = await getDirectoryStructure(tempPath)

	if (outputFormat === 'TypeScript' && !Object.keys(directory).length) {
		logger.error(`in '${locale}'
Make sure to import the type 'BaseTranslation' from the generated '${typesFileName}${fileEnding}' file.
See the example in the official docs: https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/generator#namespaces
`)
	}

	// contains the path from <root> to base locale file
	const outputPathParts = resolve(outputPath, locale).replace(resolve(), '').split(sep).filter(isTruthy)

	for (let i = 0; i < outputPathParts.length; i++) {
		const part = outputPathParts[i] as string
		const subDirectory = directory[part] as Record<string, unknown> | undefined
		if (subDirectory) {
			let outputPathPartsRest = [...outputPathParts].slice(i + 1)

			let isPathValid = true
			let subDirectoryOfCurrentSection = subDirectory
			const subPaths = [part]
			while (isPathValid && outputPathPartsRest.length) {
				// we need to find the full matching path
				// e.g. `src/path/i18n/en` is invalid if the base locale is located inside `src/i18n/en`
				const subSubDirectoryOfCurrentSection = subDirectoryOfCurrentSection[
					outputPathPartsRest[0] as string
				] as Record<string, unknown>
				if (subSubDirectoryOfCurrentSection) {
					subPaths.push(outputPathPartsRest[0] as string)
					outputPathPartsRest = outputPathPartsRest.slice(1)
					subDirectoryOfCurrentSection = subSubDirectoryOfCurrentSection
				} else {
					isPathValid = false
				}
			}

			if (isPathValid) {
				i += outputPathPartsRest.length
				return [...subPaths, ''].join('/')
			}
		}
	}

	return ''
}

const transpileTypescriptFiles = async (
	outputPath: string,
	outputFormat: OutputFormats,
	languageFilePath: string,
	locale: string,
	tempPath: string,
	typesFileName: string,
): Promise<string> => {
	const program = ts.createProgram([languageFilePath], {
		outDir: tempPath,
		allowJs: true,
		resolveJsonModule: true,
		skipLibCheck: true,
		sourceMap: false,
		noLib: true,
		module: ts.ModuleKind.CommonJS,
	})

	program.emit()

	const baseTranslationPath = await detectLocationOfCompiledBaseTranslation(
		outputPath,
		outputFormat,
		locale,
		tempPath,
		typesFileName,
	)

	return resolve(tempPath, baseTranslationPath, 'index.js')
}

export const parseLanguageFile = async (
	outputPath: string,
	outputFormat: OutputFormats,
	typesFileName: string,
	tempPath: string,
	locale: Locale,
	namespace = '',
): Promise<BaseTranslation | null> => {
	const fileName = namespace ? `${locale}/${namespace}` : locale
	const type = namespace ? 'namespace' : 'base locale'

	const originalPath = resolve(outputPath, fileName, `index${fileEnding}`)

	if (!(await doesPathExist(originalPath))) {
		logger.info(`could not load ${type} file '${fileName}'`)
		return null
	}

	if (outputFormat === 'JavaScript' && namespace) {
		tempPath = `${tempPath}-${namespace}`
	}

	await createPathIfNotExits(tempPath)

	const importPath = await transpileTypescriptFiles(
		outputPath,
		outputFormat,
		originalPath,
		fileName,
		tempPath,
		typesFileName,
	)

	if (!importPath) {
		return null
	}

	const languageImport = await importFile<BaseTranslation>(importPath)

	await deleteFolderRecursive(tempPath)

	if (!languageImport) {
		logger.error(`could not read default export from ${type} file '${fileName}'`)
		return null
	}

	return getDefaultExport(languageImport)
}

const getDefaultExport = (languageFile: BaseTranslation): BaseTranslation => {
	const keys = Object.keys(languageFile)
	if (keys.includes('__esModule') || (keys.length === 1 && keys.includes('default'))) {
		return (languageFile as Record<string, BaseTranslation>).default as BaseTranslation
	}

	return languageFile
}

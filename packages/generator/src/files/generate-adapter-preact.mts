import type { GeneratorConfigWithDefaultValues } from '../../../config/src/types.mjs'
import {
	fileEnding,
	generics,
	importTypes,
	jsDocImports,
	jsDocType,
	OVERRIDE_WARNING,
	relativeFileImportPath,
	tsCheck,
	type,
} from '../output-handler.mjs'
import { writeFileIfContainsChanges } from '../utils/file.utils.mjs'
import { prettify } from '../utils/generator.utils.mjs'

const getPreactUtils = ({ utilFileName, typesFileName, banner }: GeneratorConfigWithDefaultValues) => {
	return `${OVERRIDE_WARNING}${tsCheck}
${banner}

${jsDocImports(
	{
		from: 'typesafe-i18n/preact',
		type: 'PreactInit<Locales, Translations, TranslationFunctions>',
		alias: 'PreactInit',
	},
	{
		from: 'typesafe-i18n/preact',
		type: 'I18nContextType<Locales, Translations, TranslationFunctions>',
		alias: 'I18nContextType',
	},
	{ from: relativeFileImportPath(typesFileName), type: 'Formatters' },
	{ from: relativeFileImportPath(typesFileName), type: 'Locales' },
	{ from: relativeFileImportPath(typesFileName), type: 'TranslationFunctions' },
	{ from: relativeFileImportPath(typesFileName), type: 'Translations' },
)}

import { useContext } from 'preact/hooks'
import { initI18nPreact } from 'typesafe-i18n/preact'
${importTypes('typesafe-i18n/preact', 'I18nContextType')}
${importTypes(relativeFileImportPath(typesFileName), 'Formatters', 'Locales', 'TranslationFunctions', 'Translations')}
import { loadedFormatters, loadedLocales } from '${relativeFileImportPath(utilFileName)}'

${jsDocType('PreactInit')}
const { component: TypesafeI18n, context: I18nContext } = initI18nPreact${generics(
		'Locales',
		'Translations',
		'TranslationFunctions',
		'Formatters',
	)}(loadedLocales, loadedFormatters)

${jsDocType('() => I18nContextType')}
const useI18nContext = ()${type(
		'I18nContextType<Locales, Translations, TranslationFunctions>',
	)} => useContext(I18nContext)

export { I18nContext, useI18nContext }

export default TypesafeI18n
`
}

export const generatePreactAdapter = async (config: GeneratorConfigWithDefaultValues): Promise<void> => {
	const { outputPath } = config

	const preactUtils = getPreactUtils(config)

	const fileName = config.adapterFileName || 'i18n-preact'
	await writeFileIfContainsChanges(outputPath, `${fileName}${fileEnding}x`, prettify(preactUtils))
}

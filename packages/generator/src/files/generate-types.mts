import { isPropertyTrue, isTruthy } from 'typesafe-utils'
import type { GeneratorConfigWithDefaultValues } from '../../../config/src/types.mjs'
import type { BaseTranslation, Locale } from '../../../runtime/src/core.mjs'
import {
	OVERRIDE_WARNING,
	fileEndingForTypesFile,
	importTypeStatement,
	supportsTemplateLiteralTypes,
} from '../output-handler.mjs'
import { isParsedResultEntry, type JsDocInfos, type ParsedResult } from '../types.mjs'
import { writeFileIfContainsChanges } from '../utils/file.utils.mjs'
import { prettify, wrapObjectKeyIfNeeded } from '../utils/generator.utils.mjs'
import type { Logger } from '../utils/logger.mjs'
import { getTypeNameForNamespace } from '../utils/namespaces.utils.mjs'
import { flattenToParsedResultEntry, getNestedKey, wrapUnionType } from './generate-types/_utils.mjs'
import { createTypeImports } from './generate-types/external-type-imports.mjs'
import { createFormattersType } from './generate-types/formatters-type.mjs'
import { createNamespacesTypes, validateNamespaces } from './generate-types/namespaces.mjs'
import { parseDictionary } from './generate-types/parse-dictionary.mjs'
import { createTranslationFunctionsType } from './generate-types/translation-functions.mjs'
import { createTranslationType } from './generate-types/translations.mjs'

// --------------------------------------------------------------------------------------------------------------------

const createLocalesType = (locales: string[], baseLocale: string) => {
	const usedLocales = locales?.length ? locales : [baseLocale]
	return `export type Locales =${wrapUnionType(usedLocales)}`
}

// --------------------------------------------------------------------------------------------------------------------

const createJsDocsMapping = (parsedTranslations: ParsedResult[]) => {
	const map = {} as JsDocInfos

	flattenToParsedResultEntry(parsedTranslations).forEach((parsedResultEntry) => {
		const { key, textWithoutTypes, types, args = [], parentKeys } = parsedResultEntry
		const nestedKey = getNestedKey(key, parentKeys)
		map[nestedKey] = {
			text: textWithoutTypes,
			types,
			pluralOnlyArgs: args.filter(isPropertyTrue('pluralOnly')).map(({ key }) => key),
		}
	})

	return map
}

// --------------------------------------------------------------------------------------------------------------------

const doesATranslationContainParams = (p: ParsedResult[]): boolean =>
	p.some((parsedResult) =>
		isParsedResultEntry(parsedResult)
			? parsedResult.args?.some(({ pluralOnly }) => pluralOnly !== true)
			: doesATranslationContainParams(Object.values(parsedResult).flat()),
	)

const getTypes = (
	{
		translations,
		baseLocale,
		locales,
		typesTemplateFileName,
		banner,
		namespaces,
		maskTranslationText,
	}: GenerateTypesType,
	logger: Logger,
) => {
	const usesNamespaces = !!namespaces.length
	validateNamespaces(translations, namespaces)

	const parsedTranslations = parseDictionary(translations, logger).filter(isTruthy)

	const externalTypeImports = createTypeImports(parsedTranslations, typesTemplateFileName)

	const localesType = createLocalesType(locales, baseLocale)

	const jsDocsInfo = createJsDocsMapping(parsedTranslations)

	const translationType = createTranslationType(
		parsedTranslations,
		jsDocsInfo,
		'RootTranslation',
		namespaces,
		maskTranslationText,
	)

	const shouldImportRequiredParamsType =
		supportsTemplateLiteralTypes && doesATranslationContainParams(parsedTranslations)

	const namespacesType = usesNamespaces ? createNamespacesTypes(namespaces) : ''

	const translationArgsType = createTranslationFunctionsType(parsedTranslations, jsDocsInfo)

	const formattersType = createFormattersType(parsedTranslations)

	const type = `${OVERRIDE_WARNING}
${banner}
${importTypeStatement} { BaseTranslation as BaseTranslationType${parsedTranslations.length ? ', LocalizedString' : ''}${
		shouldImportRequiredParamsType ? ', RequiredParams' : ''
	} } from 'typesafe-i18n'
${externalTypeImports}
export type BaseTranslation = BaseTranslationType${usesNamespaces ? ' & DisallowNamespaces' : ''}
export type BaseLocale = '${baseLocale}'

${localesType}

export type Translation = RootTranslation${usesNamespaces ? ' & DisallowNamespaces' : ''}

export type Translations = RootTranslation${
		usesNamespaces
			? ` &
{${namespaces.map(
					(namespace) => `
	${wrapObjectKeyIfNeeded(namespace)}: ${getTypeNameForNamespace(namespace)}`,
			  )}
}
`
			: ''
	}

${translationType}

${namespacesType}

${translationArgsType}

${formattersType}
`

	return [type, !!externalTypeImports] as [string, boolean]
}

// --------------------------------------------------------------------------------------------------------------------

export type GenerateTypesType = GeneratorConfigWithDefaultValues & {
	translations: BaseTranslation | BaseTranslation[]
	locales: Locale[]
	namespaces: string[]
}

export const generateTypes = async (config: GenerateTypesType, logger: Logger): Promise<boolean> => {
	const { outputPath, typesFileName } = config

	const [types, hasCustomTypes] = getTypes(config, logger)

	await writeFileIfContainsChanges(outputPath, `${typesFileName}${fileEndingForTypesFile}`, prettify(types))

	return hasCustomTypes
}

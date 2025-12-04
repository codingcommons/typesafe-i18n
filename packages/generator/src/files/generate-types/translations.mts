import { filterDuplicates, isArray, isPropertyFalsy } from 'typesafe-utils'
import { createParameterPart, REGEX_BRACKETS } from '../../../../parser/src/advanced/parse.mjs'
import { serializeMessageWithoutTypes } from '../../../../parser/src/advanced/serialize.mjs'
import type { TransformParameterPart } from '../../../../parser/src/advanced/types.mjs'
import { NEW_LINE, PIPE_SEPARATION } from '../../constants.mjs'
import { supportsTemplateLiteralTypes } from '../../output-handler.mjs'
import { isParsedResultEntry, type Arg, type JsDocInfo, type JsDocInfos, type ParsedResult } from '../../types.mjs'
import { getWrappedString } from '../../utils/dictionary.utils.mjs'
import { wrapObjectKeyIfNeeded } from '../../utils/generator.utils.mjs'
import { getTypeNameForNamespace } from '../../utils/namespaces.utils.mjs'
import { createJsDocsString } from './jsdoc.mjs'
import { getNestedKey, mapToString, processNestedParsedResult, wrapObjectType } from './_utils.mjs'

export const createTranslationType = (
	parsedTranslations: ParsedResult[],
	jsDocInfo: JsDocInfos,
	nameOfType: string,
	namespaces: string[] = [],
	maskTranslationText = true,
): string => {
	const parsedTranslationsWithoutNamespaces = parsedTranslations.filter((parsedResult) => {
		const keys = Object.keys(parsedResult)
		return keys.length > 1 || !namespaces.includes(keys[0] as string)
	})

	const translationType = `type ${nameOfType} = ${wrapObjectType(parsedTranslationsWithoutNamespaces, () =>
		mapToString(parsedTranslationsWithoutNamespaces, (parsedResultEntry) =>
			createTranslationTypeEntry(parsedResultEntry, jsDocInfo, maskTranslationText),
		),
	)}`

	const parsedNamespaceTranslations = parsedTranslations.filter((parsedResult) => {
		const keys = Object.keys(parsedResult)
		return keys.length === 1 && namespaces.includes(keys[0] as string)
	})

	const namespaceTranslationsTypes = parsedNamespaceTranslations
		.map((value) => {
			return Object.entries(value).flat() as [string, ParsedResult[]]
		})
		.map(([namespace, parsedTranslations]) => {
			if (!isArray(parsedTranslations)) return ''

			return (
				'export ' +
				createTranslationType(
					isArray(parsedTranslations) ? parsedTranslations : [parsedTranslations],
					jsDocInfo,
					getTypeNameForNamespace(namespace),
					[],
					maskTranslationText,
				)
			)
		})

	return `${translationType}

${namespaceTranslationsTypes.join(NEW_LINE + NEW_LINE)}`
}

const createTranslationTypeEntry = (
	resultEntry: ParsedResult,
	jsDocInfo: JsDocInfos,
	maskTranslationText: boolean,
): string => {
	if (isParsedResultEntry(resultEntry)) {
		const { key, args, parentKeys } = resultEntry

		const nestedKey = getNestedKey(key, parentKeys)
		const jsDocString = createJsDocsString(jsDocInfo[nestedKey] as JsDocInfo, true, false, maskTranslationText)
		const translationType = generateTranslationType(args)

		return `
	${jsDocString}${wrapObjectKeyIfNeeded(key)}: ${translationType}`
	}

	return processNestedParsedResult(resultEntry, (parsedResultEntry) =>
		createTranslationTypeEntry(parsedResultEntry, jsDocInfo, maskTranslationText),
	)
}

const getFormatterType = (formatter: TransformParameterPart): string => {
	if (formatter.kind === 'formatter') return formatter.name

	const cases = (formatter.raw || '')
		.replace(REGEX_BRACKETS, '')
		.split(',')
		.map((part) => part.split(':'))
		.map(([key]) => [key, `\${string}`])
		.map((part) => part.join(':'))
		.join(',')

	return `{${cases}}`
}

const generateTranslationType = (args: Arg[] = []) => {
	if (!supportsTemplateLiteralTypes) return 'string'

	const argStrings = args
		.filter(isPropertyFalsy('pluralOnly'))
		.map(({ key, optional, transforms }) =>
			serializeMessageWithoutTypes([
				createParameterPart({ k: key, i: '', n: optional, f: transforms.map(getFormatterType) }),
			]).replace(REGEX_BRACKETS, ''),
		)

	const containsOptionalParams = args.some(({ optional }) => optional)
	if (!containsOptionalParams) return getParamsType(argStrings)

	const permutations = getArgumentVariations(argStrings)

	const containsRequiredParams = args.some(({ optional }) => !optional)
	if (!containsRequiredParams) permutations.push([])

	return permutations.map(getParamsType).filter(filterDuplicates).join(PIPE_SEPARATION)
}

const getParamsType = (argStrings: string[]) =>
	argStrings.length
		? `RequiredParams<${argStrings.map((arg) => getWrappedString(arg, true)).join(PIPE_SEPARATION)}>`
		: 'string'

const REGEX_IS_OPTIONAL_PARAM = /((\?\s?$)|(\?\s?\|))/

const getArgumentVariations = (argStrings: string[]): string[][] => {
	if (!argStrings.length) return []

	const optionals = argStrings.filter((arg) => REGEX_IS_OPTIONAL_PARAM.test(arg))

	const mappings = optionals.map((optional) => {
		const index = argStrings.findIndex((arg) => arg === optional)
		if (index === -1) return []
		return getArgumentVariations([...argStrings.slice(0, index), ...argStrings.slice(index + 1)])
	})

	return [argStrings, ...mappings.flat()]
}

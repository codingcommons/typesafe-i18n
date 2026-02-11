import { readFile } from 'fs/promises'
import { resolve } from 'path'
import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { getConfigWithDefaultValues } from '../../config/src/config.mjs'
import type { GeneratorConfig, GeneratorConfigWithDefaultValues, OutputFormats } from '../../config/src/types.mjs'
import type { BaseTranslation, Locale } from '../../runtime/src/core.mjs'
import { generate } from '../src/generate-files.mjs'
import { parseTypescriptVersion, TypescriptVersion } from '../src/utils/generator.utils.mjs'

const test = suite('types')

const outputPath = resolve(__dirname, 'generated')

const actualPostfix = '.actual'

const defaultVersion = parseTypescriptVersion('4.9')

const getFileName = (name: string) => name + actualPostfix

const createConfig = async (prefix: string, config?: GeneratorConfig): Promise<GeneratorConfigWithDefaultValues> =>
	getConfigWithDefaultValues({
		outputPath: resolve(outputPath, prefix),

		typesFileName: getFileName('types'),
		utilFileName: getFileName('util'),
		formattersTemplateFileName: getFileName('formatters-template'),
		typesTemplateFileName: getFileName('types-template'),

		...config,
	})

type FileToCheck =
	| 'types'
	| 'util'
	| 'util.sync'
	| 'util.async'
	| 'formatters-template'
	| 'types-template'
	| 'angular.service'
	| 'deno'
	| 'node'
	| 'react'
	| 'solid'
	| 'svelte'
	| 'vue'

const getPathOfOutputFile = (
	prefix: string,
	file: FileToCheck,
	type: 'actual' | 'expected',
	outputFormat: OutputFormats,
) => {
	let fileName: string

	if (file.endsWith('sync')) {
		const parts = file.split('.')
		const part = parts.pop()
		fileName = `${parts.join('.')}.${type}.${part}`
	} else {
		fileName = `${file}.${type}`
	}

	const fileEnding =
		outputFormat === 'TypeScript'
			? file === 'react'
				? '.tsx'
				: '.ts'
			: file === 'types' || file === 'types-template'
			? '.d.ts'
			: file === 'react'
			? '.jsx'
			: '.js'
	return `${outputPath}/${prefix}/${fileName}${fileEnding}`
}

const REGEX_INDENT_UNIX = /(\t|\s)/g
const REGEX_INDENT_WINDOWS = /(\t|\s+)/g
const isWindows = process.platform === 'win32'
const REGEX_INDENT = isWindows ? REGEX_INDENT_WINDOWS : REGEX_INDENT_UNIX

const unifyIndent = (text: string) => text.replace(REGEX_INDENT, ' ')

const REGEX_NEW_LINE = /\n/g
const check = async (prefix: string, file: FileToCheck, outputFormat: OutputFormats) => {
	let pathOfFailingFile = ''
	const onError = (e: { path: string }) => {
		pathOfFailingFile = e.path
		return ''
	}

	const actual: string = unifyIndent(
		(await readFile(getPathOfOutputFile(prefix, file, 'actual', outputFormat)).catch(onError)).toString(),
	)
	const expected: string = unifyIndent(
		(await readFile(getPathOfOutputFile(prefix, file, 'expected', outputFormat)).catch(onError)).toString(),
	)

	if ((expected && !actual) || (!expected && actual)) throw Error(`Could not find file '${pathOfFailingFile}'`)

	if (expected && actual) {
		const actualSplitByLines = actual.split(REGEX_NEW_LINE)
		const expectedSplitByLines = expected.split(REGEX_NEW_LINE)

		assert.is(actualSplitByLines.length, expectedSplitByLines.length)

		expectedSplitByLines.forEach((_, i) =>
			assert.match(actualSplitByLines[i] as string, expectedSplitByLines[i] as string),
		)
	}
}

const testGeneratedOutput = async (
	prefix: string,
	translation: BaseTranslation,
	config: GeneratorConfig = {},
	version: TypescriptVersion = defaultVersion,
	locales: Locale[] = [],
	namespaces: string[] = [],
) =>
	test(`generate ${prefix}`, async () => {
		const configWithDefaultValues = await createConfig(prefix, config)
		const { outputFormat } = configWithDefaultValues
		await generate(
			translation,
			configWithDefaultValues,
			version,
			undefined,
			true,
			locales.length ? locales : [configWithDefaultValues.baseLocale],
			namespaces,
		)
		await check(prefix, 'types', outputFormat)
		await check(prefix, 'util', outputFormat)
		await check(prefix, 'util.sync', outputFormat)
		await check(prefix, 'util.async', outputFormat)
		await check(prefix, 'formatters-template', outputFormat)
		await check(prefix, 'types-template', outputFormat)
		await check(prefix, 'react', outputFormat)
		await check(prefix, 'solid', outputFormat)
		await check(prefix, 'angular.service', outputFormat)
		await check(prefix, 'deno', outputFormat)
		await check(prefix, 'node', outputFormat)
		await check(prefix, 'svelte', outputFormat)
		await check(prefix, 'vue', outputFormat)
	})

// --------------------------------------------------------------------------------------------------------------------

type ConsoleOutputs = {
	info: string[]
	warn: string[]
	error: string[]
}

const mockLogger = () => {
	const outputs: ConsoleOutputs = {
		info: [],
		warn: [],
		error: [],
	}

	const logger = (type: 'info' | 'warn' | 'error', ...messages: unknown[]) => outputs[type].push(messages.join(' '))

	return {
		get logger() {
			return {
				info: logger.bind(null, 'info'),
				warn: logger.bind(null, 'warn'),
				error: logger.bind(null, 'error'),
			}
		},
		get outputs() {
			return outputs
		},
	}
}

const testGeneratedConsoleOutput = async (
	prefix: string,
	translation: BaseTranslation | BaseTranslation[],
	callback: (outputs: ConsoleOutputs) => Promise<void>,
) =>
	test(`console ${prefix}`, async () => {
		const loggerWrapper = mockLogger()

		await generate(translation, await createConfig(prefix, {}), defaultVersion, loggerWrapper.logger)

		await callback(loggerWrapper.outputs)
	})

// --------------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------

testGeneratedOutput('empty', {})

testGeneratedOutput('empty-jsdoc', {}, { outputFormat: 'JavaScript' })

testGeneratedOutput('simple', {
	TEST: 'This is a test',
})

testGeneratedOutput('with-params', {
	PARAM: '{0} apple{{s}}',
	PARAMS: '{0} apple{{s}} and {1} banana{{s}}',
})

testGeneratedOutput('keyed-params', {
	KEYED_PARAM: '{nrOfApples} apple{{s}}',
	KEYED_PARAMS: '{nrOfApples} apple{{s}} and {nrOfBananas} banana{{s}}',
})

testGeneratedOutput('with-formatters', {
	FORMATTER_1: '{0|timesTen} apple{{s}}',
	FORMATTER_2: '{0} apple{{s}} and {1|wrapWithHtmlSpan} banana{{s}}',
})

testGeneratedOutput(
	'with-formatters-jsdoc',
	{
		FORMATTER_1: '{0|timesTen} apple{{s}}',
		FORMATTER_2: '{0} apple{{s}} and {1|wrapWithHtmlSpan} banana{{s}}',
	},
	{ outputFormat: 'JavaScript' },
)

testGeneratedOutput(
	'mask-translation-text-disabled',
	{
		HELLO: 'Hi {0:name}',
		WELCOME: 'Welcome to {app}!',
	},
	{ outputFormat: 'JavaScript', maskTranslationText: false },
)

testGeneratedOutput(
	'mask-translation-text-enabled',
	{
		HELLO: 'Hi {0:name}',
		WELCOME: 'Welcome to {app}!',
	},
	{ outputFormat: 'JavaScript', maskTranslationText: true },
)

testGeneratedOutput('formatters-with-dashes', { FORMATTER: '{0|custom-formatter|and-another}' })

testGeneratedOutput('formatters-with-spaces', { FORMATTER: '{0| custom formatter | and another }' })

testGeneratedOutput('formatter-chaining', { CHAINING: '{count:number|sqrt|round}' })

testGeneratedOutput('base-locale-de', {}, { baseLocale: 'de' })

testGeneratedOutput('multiple-locales', {}, {}, undefined, ['de', 'en', 'it'])

testGeneratedOutput('locale-with-dash', {}, { baseLocale: 'de-at' })

testGeneratedOutput('locales-with-dash', {}, {}, undefined, ['it-it', 'en-us', 'fr-be'])

testGeneratedOutput('arg-types', { STRING_TYPE: 'Hi {name:string}!', NUMBER_TYPE: '{0:number} apple{{s}}' })

testGeneratedOutput('arg-order', {
	ORDER_INDEX: '{1} {0} {2} {0}',
	ORDER_KEYED: '{b} {z} {a}',
	ORDER_FORMATTER: '{0|z} {1|a}',
	ORDER_TYPES: '{0:B} {1:A}',
})

testGeneratedOutput('arg-type-localized-string', {
	localized: 'Click on the button: <button>{buttonText:LocalizedString}</button>',
})

testGeneratedOutput('formatter-with-different-arg-types', { A: '{0:number|calculate}!', B: '{0:Date|calculate}' })

testGeneratedOutput('formatter-with-multiple-usage', {
	A: '{0:number|calculate}!',
	B: '{0} {1:number|calculate}',
	C: '{0} {2:number|calculate} {1}',
})

testGeneratedOutput('arg-types-with-external-type', { EXTERNAL_TYPE: 'The result is {0:Result|calculate}!' })

testGeneratedOutput('same-param', { SAME_PARAM: '{0} {0} {0}' })

testGeneratedOutput('same-keyed-param', { SAME_KEYED_PARAM: '{name} {name} {name}' })

testGeneratedOutput('only-plural-rules', { ONLY_PLURAL: 'apple{{s}}', ONLY_SINGULAR_PLURAL: '{{Apfel|Äpfel}}' })

testGeneratedOutput('plural-part-before-key', { PLURAL_BEFORE_KEY: 'apple{{s}}: {nrOfApples:number}' })

testGeneratedOutput('plural-part-without-output', {
	PLURAL_WITHOUT_OUTPUT: 'New message{{nrOfMessages:s}} in {inbox:InboxType}',
})

const dictionary_optionals = {
	index: 'Hi {0?}',
	keyed: 'Hi {name?}',
	typed: 'Hi {name?:string}',
	multiple: 'Hi {name1?} and {name2?}',
	multiple1: 'Hi {name1} and {name2?}',
	multiple2: 'Hi {name1?} and {name2}',
	formatter: 'Hi {name1?|uppercase}',
	sameArg: 'Test {name?}, test {name?}, another test {name?}',
	sameArgWithRequiredParam: '{arg:string} Test {name?}, test {name?}, another test {name?}',
}

testGeneratedOutput('optional-parameters', dictionary_optionals)
testGeneratedOutput('optional-parameters-esm', dictionary_optionals, { outputFormat: 'JavaScript' })

testGeneratedOutput('special-chars', {
	HI: 'Hi {name:string}! */ Please leave a star if you like this project: https://github.com/ivanhofer/typesafe-i18n',
})

// --------------------------------------------------------------------------------------------------------------------

testGeneratedOutput(
	'generate-only-types',
	{ TEST: 'This is a test {0:CustomType|someFormatter}' },
	{ generateOnlyTypes: true },
)

testGeneratedOutput(
	'uncommon-keys',
	{
		'*': 'text',
		'': 'text',
		0: 'text',
		1234: 'text',
		'a key': 'text',
		'a/key': 'text',
		'a\\key': 'text',
		a_key: 'text',
		'a-key': 'text',
		'k"e"y': 'text',
		"k'e'y": 'text',
	},
	{ generateOnlyTypes: true },
)

// --------------------------------------------------------------------------------------------------------------------

testGeneratedOutput('nested-deep', {
	a: { b: { c: { d: { e: { f: { g: { h: { i: { j: { k: { l: { m: 'I am deeply nested' } } } } } } } } } } } },
})

testGeneratedOutput('nested-with-arguments', {
	a: { APPLES: '{0} apple{{s}}' },
	b: { APPLES: '{0:number} apple{{s}}' },
	c: { APPLES: '{nrOfApples:number} apple{{s}}' },
})

testGeneratedOutput('nested-formatters', {
	'some-key': { 'other-key': 'format {me:string|custom-formatter}' },
	'another-key': '{0|format}',
})

// --------------------------------------------------------------------------------------------------------------------

testGeneratedOutput('switch-case', {
	switch1: '{0|{yes:JA,no:NEIN}}',
	keyed: '{option|{yes:JA,no:NEIN}}',
	switch2: '{0| {  yes : JA , no : NEIN }}',
	switchFormatter: '{0|{y: yes, n: no }|uppercase}',
	formatterSwitch: '{0|uppercase|{Y: yes, N: no }}',
	formatterSwitchFormatter: '{0|uppercase| {Y: yes, N: no } | uppercase }',
	number: '{0|{1: one, 2: two}}',
	fallback: '{0|{yes:JA, * : NEIN}}',
	emptyNoFallback: '{0|{test:, * : nothing}}',
	spacesInKey: '{0|{a b c: begin, *:rest}}',
	dashesInKey: '{0|{a-b-c: begin, *:rest}}',
	withType: '{0:string|{y:yes,n:no}}',
})

// --------------------------------------------------------------------------------------------------------------------

testGeneratedOutput('arrays-root-strings', ['hello', 'this is a test, {name: string}'])

testGeneratedOutput('arrays-root', [{ HI: 'test' }])

testGeneratedOutput('arrays-nested', [['test 123'], [{ nested: { test: ['{name:string}', { a: 'test' }] } }]])

// --------------------------------------------------------------------------------------------------------------------

testGeneratedOutput('banner-tslint', { HI: 'Hi {0:name}' }, { banner: '/* tslint:disable */' })

// --------------------------------------------------------------------------------------------------------------------

const testAdapterMatrix = (prefix: string, translation: BaseTranslation, config: GeneratorConfig = {}) => {
	testGeneratedOutput(`${prefix}`, translation, { ...config })
	testGeneratedOutput(`${prefix}-esm`, translation, { ...config, esmImports: true })
	if (config.adapter === 'angular') return

	testGeneratedOutput(`${prefix}-jsdoc`, translation, { ...config, outputFormat: 'JavaScript' })
	testGeneratedOutput(`${prefix}-esm-jsdoc`, translation, { ...config, esmImports: true, outputFormat: 'JavaScript' })
}

testAdapterMatrix(
	'adapter-angular',
	{ HELLO_ANGULAR: 'Hi {0:string}' },
	{ adapter: 'angular', adapterFileName: getFileName('angular.service') },
)

testAdapterMatrix(
	'adapter-deno',
	{ HELLO_NODE: 'Hi {0:string}' },
	{ adapter: 'deno', esmImports: 'fileEnding', adapterFileName: getFileName('deno') },
)

testAdapterMatrix(
	'adapter-node',
	{ HELLO_NODE: 'Hi {0:string}' },
	{ adapter: 'node', adapterFileName: getFileName('node') },
)

testAdapterMatrix(
	'adapter-react',
	{ HELLO_REACT: 'Hi {0:string}' },
	{ adapter: 'react', adapterFileName: getFileName('react') },
)

testAdapterMatrix(
	'adapter-solid',
	{ HELLO_SOLID: 'Hi {0:string}' },
	{ adapter: 'solid', adapterFileName: getFileName('solid') },
)

testAdapterMatrix(
	'adapter-svelte',
	{ HELLO_SVELTE: 'Hi {0:string}' },
	{ adapter: 'svelte', adapterFileName: getFileName('svelte') },
)

testAdapterMatrix(
	'adapter-vue',
	{ HELLO_VUE: 'Hi {0:string}' },
	{ adapter: 'vue', adapterFileName: getFileName('vue') },
)

// --------------------------------------------------------------------------------------------------------------------

testGeneratedOutput('adapters-empty', { HELLO: 'Hi {0:string}' }, { adapters: [] })

testGeneratedOutput('adapters-angular', { HELLO: 'Hi {0:string}' }, { adapters: ['angular'] })

testGeneratedOutput('adapters-node-react', { HELLO_NODE_REACT: 'Hi {0:string}' }, { adapters: ['node', 'react'] })

testGeneratedOutput('adapters-react-svelte-vue', { HELLO: 'Hi {0:string}' }, { adapters: ['react', 'svelte', 'vue'] })

// --------------------------------------------------------------------------------------------------------------------

testGeneratedOutput('esm-imports', { HELLO_ESM: 'Hi {0:name}' }, { esmImports: true })

testGeneratedOutput('esm-imports-jsdoc', { HELLO_ESM: 'Hi {0:name}' }, { esmImports: true, outputFormat: 'JavaScript' })

// --------------------------------------------------------------------------------------------------------------------

const testNamespacesMatrix = (
	prefix: string,
	translation: BaseTranslation,
	config: GeneratorConfig = {},
	namespaces: string[],
	locales: string[] = [],
) => {
	testGeneratedOutput(`${prefix}`, translation, { ...config }, undefined, locales, namespaces)
	testGeneratedOutput(
		`${prefix}-jsdoc`,
		translation,
		{ ...config, outputFormat: 'JavaScript' },
		undefined,
		locales,
		namespaces,
	)
}

testNamespacesMatrix('namespaces', { wow: 'some text', test: { hi: 'hello' } }, undefined, ['test'])

testNamespacesMatrix('namespaces-only', { test: { hi: 'hello' } }, undefined, ['test'])

testNamespacesMatrix(
	'namespaces-multiple',
	{
		wow: 'some text',
		test: { hi: 'hello' },
		a: ['some', 'value'],
		'and-another': { b: { c: { d: { e: 'heyyy' } } } },
		'x y': { b: 'some long text' },
	},
	undefined,
	['test', 'a', 'and-another', 'x y'],
)

testNamespacesMatrix(
	'namespaces-with-locales',
	{ test: { hi: 'hello' }, 'some-other_namespace': { a: 'abc' } },
	{ baseLocale: 'de' },
	['test', 'some-other_namespace'],
	['en-us', 'de_at', 'it', 'de'],
)

testNamespacesMatrix(
	'namespaces-with-locales-esm',
	{ test: { hi: 'hello' }, 'some-other_namespace': { a: 'abc' } },
	{ baseLocale: 'it', esmImports: true },
	['test', 'some-other_namespace'],
	['en-us', 'it'],
)

// --------------------------------------------------------------------------------------------------------------------

const tsTestTranslation = { TEST: 'Hi {name}, I have {nrOfApples} {{Afpel|Äpfel}}' }

const testTypeScriptVersion = (version: `${number}.${number}`) => {
	testGeneratedOutput(`typescript-${version}`, tsTestTranslation, {}, parseTypescriptVersion(version))
	testGeneratedOutput(
		`typescript-${version}-jsdoc`,
		tsTestTranslation,
		{ outputFormat: 'JavaScript' },
		parseTypescriptVersion(version),
	)
}
testTypeScriptVersion('3.0')
testTypeScriptVersion('3.8')
testTypeScriptVersion('4.1')
testTypeScriptVersion('4.9')
testTypeScriptVersion('5.0')

// --------------------------------------------------------------------------------------------------------------------

testGeneratedConsoleOutput('console-no-translations', {}, async (outputs) => {
	assert.is(outputs.info.length, 0)
	assert.is(outputs.error.length, 0)
	assert.is(outputs.warn.length, 0)
})

testGeneratedConsoleOutput('console-wrong-index', { TEST: '{0} {2}' }, async (outputs) => {
	assert.is(outputs.info.length, 0)
	assert.is(outputs.warn.length, 0)
	assert.is(outputs.error.length, 1)
	assert.is(
		outputs.error[0],
		"translation 'TEST' => argument {1} expected, but {2} found. Make sure to not skip an index for your arguments.",
	)
})

testGeneratedConsoleOutput('console-keyed-and-index-based-keys', { TEST: '{hi} {0}' }, async (outputs) => {
	assert.is(outputs.info.length, 0)
	assert.is(outputs.warn.length, 0)
	assert.is(outputs.error.length, 1)
	assert.is(
		outputs.error[0],
		"translation 'TEST' => argument {1} expected, but {hi} found. You can't mix keyed and index-based arguments.",
	)
})

testGeneratedConsoleOutput('console-translation-key-with-dot', { 'i.am.wrongly.nested': 'ohhh' }, async (outputs) => {
	assert.is(outputs.info.length, 0)
	assert.is(outputs.warn.length, 0)
	assert.is(outputs.error.length, 1)
	assert.is(
		outputs.error[0],
		"translation 'i.am.wrongly.nested' => key can't contain the '.' character. Please remove it. If you want to nest keys, you should look at https://github.com/ivanhofer/typesafe-i18n#nested-translations",
	)
})

// --------------------------------------------------------------------------------------------------------------------

test.run()

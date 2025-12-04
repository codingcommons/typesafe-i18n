import type { Locale } from '../../runtime/src/core.mjs'

export type Adapters = 'angular' | 'deno' | 'node' | 'react' | 'solid' | 'svelte' | 'vue'

export type OutputFormats = 'TypeScript' | 'JavaScript'

type NoAdaptersConfig = {
	adapter?: never
	adapters?: never
}

type SingleAdapterConfig = {
	adapter: Adapters
	adapters?: never
}

type MultipleAdaptersConfig = {
	adapter?: never
	adapters: Adapters[]
}

type AdapterConfig = NoAdaptersConfig | SingleAdapterConfig | MultipleAdaptersConfig

export type EsmImportsOption = boolean | '.js' | 'fileEnding'

export type GeneratorConfig = {
	$schema?: string

	baseLocale?: Locale

	tempPath?: string
	outputPath?: string
	outputFormat?: OutputFormats
	typesFileName?: string
	utilFileName?: string
	formattersTemplateFileName?: string
	typesTemplateFileName?: string
	esmImports?: EsmImportsOption

	adapterFileName?: string
	generateOnlyTypes?: boolean
	maskTranslationText?: boolean

	banner?: string
	runAfterGenerator?: string | undefined
} & AdapterConfig

export type GeneratorConfigWithDefaultValues = GeneratorConfig & {
	baseLocale: Locale

	tempPath: string
	outputPath: string
	outputFormat: OutputFormats
	typesFileName: string
	utilFileName: string
	formattersTemplateFileName: string
	typesTemplateFileName: string
	esmImports: EsmImportsOption

	generateOnlyTypes: boolean
	maskTranslationText: boolean
	banner: string
	runAfterGenerator: string | undefined
}

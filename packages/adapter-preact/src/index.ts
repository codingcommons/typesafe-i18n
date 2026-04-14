import { createContext, h, type ComponentChildren, type Context, type FunctionComponent } from 'preact'
import { useCallback, useMemo, useState } from 'preact/hooks'
import { getFallbackProxy } from '../../runtime/src/core-utils.mjs'
import type { BaseFormatters, BaseTranslation, Locale, TranslationFunctions } from '../../runtime/src/core.mjs'
import { i18nObject } from '../../runtime/src/util.object.mjs'

// --------------------------------------------------------------------------------------------------------------------
// types --------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------

export type I18nContextType<
	L extends Locale = Locale,
	T extends BaseTranslation | BaseTranslation[] = BaseTranslation,
	TF extends TranslationFunctions<T> = TranslationFunctions<T>,
> = {
	locale: L
	LL: TF
	setLocale: (locale: L) => void
}

export type TypesafeI18nProps<L extends string> = {
	locale: L
	children: ComponentChildren
}

export type PreactInit<
	L extends Locale = Locale,
	T extends BaseTranslation | BaseTranslation[] = BaseTranslation,
	TF extends TranslationFunctions<T> = TranslationFunctions<T>,
> = {
	component: FunctionComponent<TypesafeI18nProps<L>>
	context: Context<I18nContextType<L, T, TF>>
}

// --------------------------------------------------------------------------------------------------------------------
// implementation -----------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------

export const initI18nPreact = <
	L extends Locale = Locale,
	T extends BaseTranslation = BaseTranslation,
	TF extends TranslationFunctions<T> = TranslationFunctions<T>,
	F extends BaseFormatters = BaseFormatters,
>(
	translations: Record<L, T>,
	formatters: Record<L, F> = {} as Record<L, F>,
): PreactInit<L, T, TF> => {
	const context = createContext({} as I18nContextType<L, T, TF>)

	const component: FunctionComponent<TypesafeI18nProps<L>> = (props) => {
		const [locale, _setLocale] = useState<L>(props.locale)
		const [LL, setLL] = useState<TF>(() =>
			!locale ? getFallbackProxy<TF>() : i18nObject<L, T, TF, F>(locale, translations[locale], formatters[locale]),
		)

		const setLocale = useCallback((newLocale: L) => {
			_setLocale(newLocale)
			setLL(() => i18nObject<L, T, TF, F>(newLocale, translations[newLocale], formatters[newLocale]))
		}, [])

		const ctx = useMemo<I18nContextType<L, T, TF>>(
			() => ({
				setLocale,
				locale,
				LL,
			}),
			[setLocale, locale, LL],
		)

		return h(context.Provider, { value: ctx, children: props.children })
	}

	return { component, context }
}

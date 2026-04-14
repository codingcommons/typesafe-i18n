# `typesafe-i18n` Preact

This package provides a lightweight Preact context wrapper around `typesafe-i18n`.

## Setup

See [here](https://github.com/ivanhofer/typesafe-i18n#get-started) for details on the generator.

Run the setup once to scaffold the boilerplate:

```bash
npx typesafe-i18n --setup-auto
```

The generator will create `i18n-preact.tsx` (name configurable via `adapterFileName`). Wrap your app with the generated component and consume the context with the generated hook:

```tsx
import { render } from 'preact'
import TypesafeI18n, { useI18nContext } from './i18n/i18n-preact'

const App = () => {
	const { LL } = useI18nContext()
	return <h1>{LL.HI({ name: 'Mauricio' })}</h1>
}

render(
	<TypesafeI18n locale="en">
		<App />
	</TypesafeI18n>,
	document.getElementById('app')!,
)
```

See the main README for more advanced usage and loading locales.

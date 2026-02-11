# `typesafe-i18n` Svelte

**You can find a demo Svelte implementation [here](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/adapter-svelte/examples/svelte)**

**You can find a demo SvelteKit implementation [here](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/adapter-svelte/examples/svelte-kit)**

## Setup

See [here](https://github.com/ivanhofer/typesafe-i18n#get-started) on more information how to set up `typesafe-i18n`.

### manual installation

```bash
npm install typesafe-i18n
```

---

## Table of Contents
 - [add `typesafe-i18n` to existing projects](#configure-typesafe-i18n-for-an-existing-svelte-project)
 - [available Svelte stores](#stores)
 - [SvelteKit projects](#sveltekit)
 - [Sapper projects](#sapper)


<!-- ------------------------------------------------------------------------------------------
<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->

## Configure `typesafe-i18n` for an existing Svelte project

Initialize `typesafe-i18n` by running

```bash
npx typesafe-i18n --setup-auto
```

You could configure your development script to run the generator in parallel to `vite` by using [`npm-run-all`](https://github.com/mysticatea/npm-run-all).

```json
{
   "scripts": {
      "dev": "npm-run-all --parallel vite typesafe-i18n",
      "vite": "vite",
      "typesafe-i18n": "typesafe-i18n",
   }
}
```

The generator will create some custom Svelte stores inside `i18n-svelte.ts` that you can use inside your components.

Then inside your root-component, you need to load your locales and call `setLocale` in order to setup all stores.

```html
<script lang="ts">
   import { setLocale } from './i18n/i18n-svelte'

   // TODO: load locales (https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/generator#loading-locales)

   setLocale()
</script>

<!-- HTML markup -->
```

That's it. You can then start using `typesafe-i18n` inside your Svelte application.

```html
<script lang="ts">
   import LL from './i18n/i18n-svelte'
</script>

<h1>{$LL.HELLO({ name: 'Svelte' })}</h1> <!-- "Hello Svelte!" -->
```


<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->

## Stores

When running the [generator](https://github.com/ivanhofer/typesafe-i18n#typesafety), the file `i18n-svelte.ts` will export following functions and readable stores:


### initI18n

Call it inside your root Svelte component in order to setup the stores:

```html
<script>
   import { initI18n } from './i18n/i18n-svelte'

   initI18n('en')
</script>
```


### LL

The default export of the generated file will be the store you can use to translate your app. You can use it with subscriptions (`$LL`) or as a regular JavaScript object (`LL`).

```html
<script>
   import LL from './i18n/i18n-svelte'

   const showMessage = () => {
      alert($LL.SOME_MESSAGE())
   }
</script>

{$LL.HELLO({ name: 'world' })}

<button on:click={showMessage}>click me</button>
```

You can also use the translations in a regular TypeScript (or JavaScript) file:

```ts
import { get } from 'svelte/store'
import LL from './i18n/i18n-svelte'

console.log(get(LL).SOME_MESSAGE())
```

### locale

This Svelte store will contain the current selected locale.

```html
<script>
   import { locale } from './i18n/i18n-svelte'
</script>

<div>
   your language is: {$locale}
</div>
```


### setLocale

If you want to change the locale, you need to call `setLocale` with the locale as an argument.

```html
<script>
   import { setLocale } from './i18n/i18n-svelte'
</script>

<div id="language-picker">

   Choose language:

   <button on:click={() => setLocale('en')}>
      english
   </button>

   <button on:click={() => setLocale('de')}>
      deutsch
   </button>

   <button on:click={() => setLocale('it')}>
      italiano
   </button>

</div>
```

<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->


# SvelteKit

- See SvelteKit with TypeScript example [here](https://github.com/ivanhofer/typesafe-i18n-demo-sveltekit)
- See SvelteKit with JavaScript + JSDocs example [here](https://github.com/ivanhofer/typesafe-i18n-demo-sveltekit-jsdoc)

<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->


# Sapper

For your Sapper projects, you should call the `loadLocaleAsync` function inside `preload` in your root `routes/_layout.svelte` file:

```html
<script lang="ts" context="module">
   import { loadFormatters, loadLocaleAsync } from '../i18n/i18n-util.async'
   import { loadedLocales } from '../i18n/i18n-util'

   export async function preload(page, session) {
      // detect locale of user (see https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/detectors)
      const locale = 'en'
      await loadLocaleAsync(locale)

      // access the loaded translations and send it as a prop to the layout
      const translations = loadedLocales[locale]

      return { locale, translations }
   }
</script>

<script lang="ts">
   import LL, { setLocale } from '../i18n/i18n-svelte'
   import type { Locales, Translation } from '../i18n/i18n-types'

   export let locale: Locales
   export let translations: Translation

   // restore the translations from the received props
   loadedLocales[locale] = translations
   loadFormatters(locale)

   setLocale(locale)
</script>

<h1>{$LL.HI({ name: 'Sapper' })}</h1>
```

> Due to how sapper works, the `preload` function on the first request only get's called on the server. To be able to access the translations also in the client, you need to send the loaded translations via a prop to the client and restore the state there.

For more information about the stores you can use, see the [Stores](#stores) section.

 <!-- TODO: create example repository -->


<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->

# Notes

You may run into the error **`Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'svelte' imported from ...`**, when using the `node` adapter from `SvelteKit`. The reason behind this is that `typesafe-i18n` uses the stores that Svelte includes. There is currently an unresolved question how dependencies, that itself depend on `Svelte` can and should be bundled. Until that question is resolved you can do two things:

1. move `Svelte` to your production `dependencies` inside `package.json`
2. _(recommended)_ move `typesafe-i18n` to your `devDependencies` inside `package.json` and tell `vite` to bundle it by adding a few lines to your config:

   _vite.config.js_
   ```diff
   export default defineConfig({
	   plugins: [sveltekit()],
   +	ssr: {
   +		noExternal: ['typesafe-i18n'],
   +	},
   })
   ```

---
---

**For more information about `typesafe-i18n`, take a look at the [main repository](https://github.com/ivanhofer/typesafe-i18n).**

---
---

<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->

## Recipes

### How do I render a component inside a Translation?

By default `typesafe-i18n` at this time does not provide such a functionality. But you could easily write a function like this:

### Wrap Piece of Translation with a component:

<details>
	<summary>Single Text Wrapper</summary>

```svelte
<script lang="ts">
	import type { LocalizedString } from 'typesafe-i18n'

	export let message: LocalizedString

	$: [prefix, infix, postfix] = message.split('<>') as LocalizedString[]
	// render infix only if the message doesn't have any split characters
	$: if (!infix && !postfix) {
		infix = prefix
		prefix = '' as LocalizedString
	}
</script>

{prefix}<slot {infix} />{postfix}
```

Your translations would look something like this

```ts
const en = {
   'WELCOME': 'Hi {name:string}, click <>here<> to create your first project'
   'LOGOUT': 'Logout'
}
```

Use it inside your application

```svelte
<header>
   <!-- normal usage -->
   <button on:click={() => alert('do logout')}>
      {LL.logout()}
   </button>
</header>
<main>
   <!-- usage with a component inside a translation -->
   <WrapTranslation message={LL.WELCOME({ name: 'John' })} let:infix>
      <button on:click={() => alert('clicked')}>
         {infix}
      </button>
   </WrapTranslation>
</main>
```
</details>

### Wrapping Multiple Pieces of Translation using snippets.

<details>
	<summary>Type Safe Version</summary>


#### This component requires a couple of things:

##### 1. Valid Translation Object to infer the keys from

<details>
	<summary>i18n/en/index.ts</summary>
	
Your translation **keys** will serve as the **type** for creating the typed component
The snippet types need to include the keys as if it's jsx as the type is inferred from the occurance of `</${string}>`
They need to look something like this:
```ts
import type { BaseTranslation } from '../i18n-types';

const en = {
	'Hi {name:string}, click <someSnippet>here</someSnippet> to create your <anotherSnippet>first</anotherSnippet> project':
		'Hi {name:string}, click <someSnippet>here</someSnippet> to create your <anotherSnippet>first</anotherSnippet> project',
	'Goodbye, click <someSnippet>here</someSnippet> to delete your <anotherSnippet>first</anotherSnippet> project':
		'Goodbye, click <someSnippet>here</someSnippet> to delete your <anotherSnippet>first</anotherSnippet> project',
} satisfies BaseTranslation;

export default en;
```
</details>

---

##### 2. `Prettify` Type _(if you like somewhat readible types)_
<details>
	<summary>Prettify.ts</summary>


For example under `$lib/utilities/typeUtils/Prettify.ts`
```ts
/* eslint-disable @typescript-eslint/ban-types */
export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};
```
Credits to [TanStack](https://github.com/TanStack)?
</details>

---

##### 3. `InferSnippets` Type to infer the correct snippets from the translation key

<details>
	<summary>InferSnippets.ts</summary>


For example under `$lib/utilities/typeUtils/InferSnippets.ts`
```ts
/* eslint-disable @typescript-eslint/ban-types */
import type { Prettify } from '$lib/utilities/typeUtils/Prettify';

export type InferSnippets<TMessage extends string> =
	TMessage extends `${string}</${infer TSnippetName extends string}>${infer TRemainingMessage extends string}`
		? Prettify<{ [key in TSnippetName]: string } & InferSnippets<TRemainingMessage>>
		: {};

```
Credits to [@ViewableGravy](https://github.com/ViewableGravy).
</details>

---

##### 4. `LL` Type Override "`TLL`"

<details>
	<summary>i18n-svelte-tll.ts</summary>


For example next to `i18n-svelte.ts` in your `i18n` folder: `$i18n/i18n-svelte-tll`
```ts
import type { Prettify } from '$lib/utilities/typeUtils/Prettify';
import type { LocalizedString } from 'typesafe-i18n';
import type { TranslationFunctions } from './i18n-types';

import { LL } from '$i18n/i18n-svelte';
import { type Readable } from 'svelte/store';

type CreateInferredLLInstance<TRecord extends Record<string, unknown>> = {
	[TKey in keyof TRecord]: TRecord[TKey] extends () => LocalizedString
		? () => Prettify<TKey>
		: TRecord[TKey] extends (arg: infer TObject) => LocalizedString
			? (arg: TObject) => Prettify<TKey>
			: TRecord[TKey] extends Record<string, unknown>
				? CreateInferredLLInstance<TRecord[TKey]>
				: 'Error: Unhandled type';
};

type InferredLLData = Prettify<CreateInferredLLInstance<TranslationFunctions>>;

const TLL = LL as unknown as Readable<InferredLLData>;

export default TLL;
```

</details>

---

##### 5. `TranslationSnippetWrapper` component

<details>
	<summary>TranslationSnippetWrapper.svelte</summary>


```svelte
<script context="module" lang="ts">
	import type { InferSnippets } from '$lib/utilities/typeUtils/InferSnippets';
	import type { Snippet } from 'svelte';

	type Replacers<TReplacers extends Object> = {
		[key in keyof TReplacers]: Snippet<[string]>;
	};

	type Props<TMessage extends string> = {
		message: TMessage;
		replacers: Replacers<Prettify<InferSnippets<TMessage>>>;
	};

	type ReplacerDataEntry = string | { method: Snippet<[string]>; content: string };

	/**
	 * Get all indices of a substring in a string
	 * @link https://stackoverflow.com/a/3410557
	 */
	function getIndicesOf(searchStr: string, str: string) {
		const searchStrLen = searchStr.length;
		if (searchStrLen == 0) {
			return [];
		}

		let startIndex = 0;
		let index;
		let indices = [];

		while ((index = str.indexOf(searchStr, startIndex)) > -1) {
			indices.push(index);
			startIndex = index + searchStrLen;
		}
		return indices;
	}
</script>

<script lang="ts" generics="TMessage extends string">
	import type { Prettify } from '$lib/utilities/typeUtils/Prettify';
	import sortBy from 'lodash/sortBy';

	const { message, replacers }: Props<TMessage> = $props();

	type ReplacerKeys = keyof Prettify<InferSnippets<TMessage>>;

	const replacerData: ReplacerDataEntry[] = $derived.by(() => {
		const replacerKeys = Object.keys(replacers);

		if (replacerKeys.length === 0) {
			return [message];
		}

		// First get the index of the replacer keys
		const allReplacerKeyIndexes = replacerKeys.reduce(
			(previous, key) => {
				const indeces = getIndicesOf(`<${key}>`, message);
				indeces.forEach((index) => {
					previous[index] = key as ReplacerKeys;
				});
				return previous;
			},
			{} as Record<number, ReplacerKeys>,
		);

		// Sort the replacer keys by their index
		const sorted = sortBy(Object.entries(allReplacerKeyIndexes), ([index]) => index);

		let cuttableMessage = message as string;

		const finalRenderArray = sorted.reduce((current, [, key], index) => {
			// Split the message into two parts: before and after the current replacer key
			const [before, infixRaw] = cuttableMessage.split(`<${key as string}>`);
			const [infix, after] = infixRaw.split(`</${key as string}>`);

			// Get the remaining part of the message after the current replacer key
			const subMessage = cuttableMessage.substring(cuttableMessage.indexOf(after));

			// Push the before part and the current replacer data to the final render array
			current.push(before, {
				method: replacers[key],
				content: infix,
			});

			// If it's the last replacer key, push the after part to the final render array
			if (index === sorted.length - 1) {
				current.push(after);
			}

			// Update the cuttableMessage to the remaining part
			cuttableMessage = subMessage;

			return current;
		}, [] as ReplacerDataEntry[]);

		return finalRenderArray;
	});
</script>

{#each replacerData as part}
	{#if typeof part === 'string'}
		{part}
	{:else}
		{@render part.method(part.content)}
	{/if}
{/each}
```

</details>

</details>

---

<details>
	<summary>Basic Version</summary>
	
#### TranslationSnippetWrapper

_This example uses lodash for the sorting_

```svelte
<script context="module" lang="ts">
	import type { Snippet } from 'svelte';
	import type { LocalizedString } from 'typesafe-i18n';

	type Props = {
		message: LocalizedString | string;
		replacers: Record<string, Snippet<[string]>>;
	};

	type ReplacerDataEntry = string | { method: Snippet<[string]>; content: string };

	/**
	 * Get all indices of a substring in a string
	 * @link https://stackoverflow.com/a/3410557
	 */
	function getIndicesOf(searchStr: string, str: string) {
		const searchStrLen = searchStr.length;
		if (searchStrLen == 0) {
			return [];
		}

		let startIndex = 0;
		let index;
		let indices = [];

		while ((index = str.indexOf(searchStr, startIndex)) > -1) {
			indices.push(index);
			startIndex = index + searchStrLen;
		}
		return indices;
	}
</script>

<script lang="ts">
	import sortBy from 'lodash/sortBy';

	const { message, replacers }: Props = $props();

	const replacerData: ReplacerDataEntry[] = $derived.by(() => {
		const replacerKeys = Object.keys(replacers);
		// First get the index of the replacer keys
		const allReplacerKeyIndexes = replacerKeys.reduce(
			(previous, key) => {
				const indeces = getIndicesOf(`<${key}>`, message);
				indeces.forEach((index) => {
					previous[index] = key;
				});
				return previous;
			},
			{} as Record<number, string>,
		);

		// Sort the replacer keys by their index
		const sorted = sortBy(Object.entries(allReplacerKeyIndexes), ([index]) => index);

		let cuttableMessage = message as string;

		const finalRenderArray = sorted.reduce((current, [, key], index) => {
			// Split the message into two parts: before and after the current replacer key
			const [before, infixRaw] = cuttableMessage.split(`<${key}>`);
			const [infix, after] = infixRaw.split(`</${key}>`);

			// Get the remaining part of the message after the current replacer key
			const subMessage = cuttableMessage.substring(cuttableMessage.indexOf(after));

			// Push the before part and the current replacer data to the final render array
			current.push(before, {
				method: replacers[key],
				content: infix,
			});

			// If it's the last replacer key, push the after part to the final render array
			if (index === sorted.length - 1) {
				current.push(after);
			}

			// Update the cuttableMessage to the remaining part
			cuttableMessage = subMessage;

			return current;
		}, [] as ReplacerDataEntry[]);

		return finalRenderArray;
	});
</script>

{#each replacerData as part}
	{#if typeof part === 'string'}
		{part}
	{:else}
		{@render part.method(part.content)}
	{/if}
{/each}
```

Your translations would look something like this:
```ts
const en = {
	'Hi {name:string}, click <someSnippet>here</someSnippet> to create your <anotherSnippet>first</anotherSnippet> project':
		'Hi {name:string}, click <someSnippet>here</someSnippet> to create your <anotherSnippet>first</anotherSnippet> project',
	'Goodbye, click <someSnippet>here</someSnippet> to delete your <anotherSnippet>first</anotherSnippet> project':
		'Goodbye, click <someSnippet>here</someSnippet> to delete your <anotherSnippet>first</anotherSnippet> project',
}
```
_(By using the same value for the translation as the key you have an easy overview of what snippets can be used)_

Use it inside your application

```svelte
{#snippet someSnippet(text: string)}
	<p class="bold">
		{text}
	</p>
{/snippet}

{#snippet anotherSnippet(text: string)}
	<p class="italic">
		{text}
	</p>
{/snippet}
<TranslationSnippetWrapper
	message={$LL["Hi {name:string}, click <someSnippet>here</someSnippet> to create your <anotherSnippet>first</anotherSnippet> project"]("SanCoca")}
	replacers={{ someSnippet, anotherSnippet }}
/>
```
</details>





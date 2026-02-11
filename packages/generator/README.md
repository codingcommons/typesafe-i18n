# `typesafe-i18n` Generator

To benefit from more typesafety features and to let `typesafe-i18n` generate boilerplate code for you, you  can use the [`generator`](#generator) to output code depending on your base locale.

## Setup

See [here](https://github.com/ivanhofer/typesafe-i18n#get-started) on more information how to set up `typesafe-i18n`.

### manual installation

```bash
npm install typesafe-i18n
```

## Generator

In order to get get full typesafety for your locales, you can start the generator during development. The generator listens for changes you make to your [base locale file](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/runtime#dictionary) and creates the corresponding TypeScript types.

Make sure you have installed `node` version `> 12.x` and are using a `typescript` version `>= 3.5.1`.

 > The generator will create a different output depending on your TypeScript version. Older versions don't support all the features `typesafe-i18n` need to provide you with the best types. Make sure to use a TypeScript version `> 4.1.x` to benefit from all the typechecking features.

Start the generator process in your terminal:

```bash
> npx typesafe-i18n
```

or define a script in your `package.json` file:

```json
{
   "scripts": {
      "typesafe-i18n": "typesafe-i18n"
   }
}
```
> You could use a npm-package like [`npm-run-all`](https://github.com/mysticatea/npm-run-all/blob/master/docs/npm-run-all.md#run-scripts-in-parallel) in order to start the generator and you development-server in parallel.

To start the generator and watch for changes in your translation you can run:

```bash
> npm run typesafe-i18n
```

Passing [options](#options) to the generator is possible by creating a `.typesafe-i18n.json` file in the root of your workspace.

#### running the generator in CI/CD

When running tests or scripts you can disable the watcher by passing the argument `--no-watch` to the generator node-process:

```bash
> npx typesafe-i18n --no-watch
```

This will only generate types once and **not** listen to changes in your locale files. The process will throw an `TypesafeI18nParseError` if a wrong syntax is detected in your [base locale file](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/runtime#dictionary).

### base locale

To define your base translation you need to create a `index.ts` file inside `src/i18n/{baseLocale}`, where `baseLocale` can be defined inside the [`options`](#baselocale).
This file must have an `default export` that should have the type of `BaseTranslation | BaseTranslation[]`. Something like this:

```typescript
import type { BaseTranslation } from '../i18n-types'

const en: BaseTranslation = { }

export default en
```

### folder structure

This project requires you to use an opinionated folder structure for your locales. All your localization files are located inside the `src/i18n` folder.

When running the generator for the first time, a few files will be created:

```
src/
   i18n/
      en/
         index.ts
      custom-types.ts
      formatters.ts
      i18n-types.ts
      i18n-util.async.ts
      i18n-util.sync.ts
      i18n-util.ts
```

 > Some files are auto-generated on every change of your [base locale file](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/runtime#dictionary); please don't make manual changes to them, since they will be overwritten.

 - `en/index.ts`\
  	If 'en' is your [base locale](#baselocale), the file `src/i18n/en/index.ts` will contain your translations. Whenever you make changes to this file, the generator will create updated type definitions.

 - `custom-types.ts`\
	To [defining types](#custom-types) that are unknown to `typesafe-i18n`.

 - `formatters.ts`\
	In this file, you can configure the [formatters](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/formatters) to use inside your translations. The `Formatters` type gets generated automatically by reading all your translations from the base locale file.

 - `i18n-types.ts`\
	Type definitions are generated in this file. You don't have to understand them. They are just here to help TypeScript understand, how you need to call the translation functions.

 - `i18n-util.async.ts`\
   This file contains the logic to load individual locales asynchronously.

 - `i18n-util.sync.ts`\
   This file contains the logic to load your locales in a synchronous way.

 - `i18n-util.ts`\
   This file contains wrappers with type-information around the [base i18n functions](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/runtime#usage).


### loading locales

You can choose how you want to load locales depending on your application use-case
 - [asynchronously](#asynchronous-loading-of-locales): load each locale as a separate network request *(recommended)*
 - [synchronous](#synchronous-loading-of-locales): load all locales at once

#### asynchronous loading of locales

If your app gets loaded via a network request (probably most websites and -applications) you should use the `loadLocaleAsync` function provided by `src/i18n/i18n-util.async.ts`. It only loads the locale that is currently needed to render the page. No unnecessary data from other locales is transferred to your users. The function returns a `Promise` that loads the dictionary and initializes your [`formatters`](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/formatters).

```ts
import { loadLocaleAsync } from './i18n/i18n-util.async'
import { i18nObject } from './i18n/i18n-util'

let LL

const switchLocale = async (locale) => {
   await loadLocaleAsync(locale)
   LL = i18nObject(locale)
}
```

#### synchronous loading of locales

If you are using `typesafe-i18n` in a server or API context, you can load all locales when the app starts by using the `loadAllLocales` function provided by `src/i18n/i18n-util.sync.ts`. The function loads all dictionaries and initializes the [`formatters`](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/formatters) for each locale.

```ts
import { loadAllLocales } from './i18n/i18n-util.sync'
import { i18n } from './i18n/i18n-util'


loadAllLocales()

const locale = 'en'
const L = i18n(locale)
```


### locales

Locales must follow a specific file pattern. For each locale, you have to create a folder with the name of the locale inside your `src/i18n` folder e.g. 'en', 'en-us', 'en-GB'. The name of the folder is also the name of the locale you use inside your code. Each locales folder needs to have an `index.ts` file with a default export. The file should export an object with key-values pairs or arrays and should look something like:

```typescript
import type { Translation } from '../i18n-types';

const de: Translation = {

   /* your translations go here */

}

export default de
```
 > make sure to give it the type of `Translation` to get compile-errors, when some translations are missing

### custom types

If you want to pass arguments with your own types to the translation function, you need to tell `typesafe-i18n` how these types look like. In order to do this, you need to create an export with the exact name of that type inside this file.

If you have a translation with e.g. the type `Sum`,

```typescript
const translations: BaseTranslation = {
   RESULT: 'The result is: {0:Sum|calculate}'
}
```

you need to export `Sum` as a type in your `custom-types.ts` file

```typescript
export type Sum = {
   n1: number
   n2: number
   n2: number
}
```

### Options

You can set options for the generator inside a `.typesafe-i18n.json`-file in your project's root folder e.g.

```json
{
   "$schema": "https://unpkg.com/typesafe-i18n@5.20.0/schema/typesafe-i18n.json",

   "baseLocale": "de",
   "adapter": "svelte"
}
```

> if you add the `$schema` inside your config, you will get hints and auto-completion suggestions inside your IDE. Just make sure the link points to the version you are currently using.

The available options are:

| key                                                       | type                                                                                 | default value                                 |
| --------------------------------------------------------- |--------------------------------------------------------------------------------------| --------------------------------------------- |
| [adapter](#adapter)                                       | `'angular'  \| 'node'  \| 'react'  \| 'solid'  \| 'svelte'  \| 'vue'  \| undefined`  | `undefined`                                   |
| [adapters](#adapters)                                     | `Array<'angular' \| 'node' \| 'react' \| 'solid' \| 'svelte' \| 'vue'> \| undefined` | `undefined`
| [baseLocale](#baselocale)                                 | `string`                                                                             | `'en'`                                        |
| [outputFormat](#outputformat)                             | `'TypeScript'` &#124; `'JavaScript'`                                                 | `'TypeScript'`                                |
| [esmImports](#esmimports)                                 | `boolean` \| `'.js'` \| `'fileEnding'`                                               | `false`                                       |
| [generateOnlyTypes](#generateonlytypes)                   | `boolean`                                                                            | `false`                                       |
| [maskTranslationText](#masktranslationtext)               | `boolean`                                                                            | `true`                                        |
| [runAfterGenerator](#runaftergenerator)                   | `string` &#124; `undefined`                                                          | `undefined`                                   |
| [banner](#banner)                                         | `string`                                                                             | `'/* eslint-disable */'`                      |
| [outputPath](#outputpath)                                 | `string`                                                                             | `'./src/i18n/'`                               |
| [typesFileName](#typesfilename)                           | `string`                                                                             | `'i18n-types'`                                |
| [utilFileName](#utilfilename)                             | `string`                                                                             | `'i18n-util'`                                 |
| [formattersTemplateFileName](#formatterstemplatefilename) | `string`                                                                             | `'formatters'`                                |
| [typesTemplateFileName](#typestemplatefilename)           | `string`                                                                             | `'custom-types'`                              |
| [adapterFileName](#adapterfilename)                       | `string` &#124; `undefined`                                                          | `undefined`                                   |
| [tempPath](#temppath)                                     | `string`                                                                             | `'./node_modules/typesafe-i18n/temp-output/'` |


#### `adapter`

If this config is set, code will be generated that wraps i18n functions into useful helpers for that environment e.g. a `svelte`-store.

#### `adapters`

> This will override the [`adapter`](#adapter) option

If you need multiple adapters in a single project, you can pass them as an array.

#### `baseLocale`

Defines which locale to use for the types generation. You can find more information on how to structure your locales [here](#locales).

#### `outputFormat`

The programming language you use inside your code. If 'TypeScript' is selected, the generator will output TypeScript code and types. If you choose 'JavaScript' the generator will output typesafe JavaScript code annotated with [JSDoc-comments](#jsdoc).

#### `esmImports`

If `true` generated files will import other files with the `.js` file extension. This makes it compatible with ESM packages that have specified `"type": "module"` in their `package.json` file.

Set this option to `'fileEnding'` if the module import needs to be done with a `.ts` file extension (e.g. for the `deno` runtime).

#### `generateOnlyTypes`

If you don't want to use the auto-generated helpers and instead write your own wrappers, you can set this option to `true`.

#### `maskTranslationText`

Controls whether zero-width space characters (U+200B) are inserted between characters in JSDoc comments for Translation types.

When enabled (default), this prevents code search tools from matching the generated type file JSDoc comments when searching for translation text, directing you instead to the actual translation source files. The zero-width spaces are invisible but keep the text readable in IDE tooltips.

Some code analysis tools may have issues with these invisible characters. If you encounter problems, you can disable this feature by setting this option to `false`.

**Note**: This only affects the `Translation` type JSDoc comments in generated type files, not the `TranslationFunctions` type.

#### `runAfterGenerator`

This hook allows you to e.g. run a code formatting/linting command after the generator completes. When a command is provided, a [`child_process`](https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback) gets spawned with that command e.g. `npm run prettier --write "src/i18n"`

#### `banner`

This text will be output on top of all auto-generated files. It is meant to add a custom disable-linter comment. Since every project can have different lint rules, we want to disable linting on those files.

#### `outputPath`

Folder in which the files should be generated and where your locale files are located.

#### `typesFileName`

Name for the file where the types for your locales are generated.

#### `utilFileName`

Name for the file where the typesafe i18n-functions are generated.

#### `formattersTemplateFileName`

Name for the file where you can configure your formatters.

#### `typesTemplateFileName`

Name for the file where you can configure your custom-types.

#### `adapterFileName`

Name for the file when generating output for an adapter. The default filename is `i18n-[adapter]`.

#### `tempPath`

Folder where the generator can store temporary files. These files are generated when your base locale is analyzed and the types are generated. The folder will be cleared, after the types were generated. So make sure you use an empty folder, if you change this option.



<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->

## JSDoc

If you want to use `typesafe-i18n` inside your JavaScript code, you can get also full typesafety by running the generator with the `outputFormat` [option](#outputformat) set to `'JavaScript'`. The generator then provides wrappers for the [core functions](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/runtime#usage) together with [JSDoc](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html) annotations.

> An IDE like [VS Code](https://code.visualstudio.com/) will show you code-completions and errors when you have opened a file in the editor.

In order to get typesafety for your locales files, you need to annotate it like this:

```typescript
// @ts-check

/**
 * @typedef { import('../i18n-types').Translation } Translation
 */

/** @type { Translation } */
module.exports = {

   /* your translations go here */

}
```



<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->

## Namespaces

Namespaces allows you to split your translations in multiple files and only load them on demand. e.g. you could store all translations that are displayed on the `settings`-page in it's own namespace and only load them when a user visits the settings-page.

To create a namespace, you have to create a folder within your base translations with the name of your namespace that contains a `index.ts` file.
```
src/
   i18n/
      en/
         settings/index.ts
         index.ts
```
In this example the base locale is `en` and we want to have a namespace called `settings`. The `index.ts` file has to export a [`Dictionary`](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/runtime#dictionary).
e.g.
```typescript
import type { BaseTranslation } from '../../i18n-types'

const en_settings: BaseTranslation = { }

export default en_settings
```

Once you have created that file, the generator will automatically create boilerplate namespace files for all your other locales and assign the correct type to them.

By default translations inside namespaces are not loaded. You have to manually load them via `loadNamespaceAsync`.

```ts
const displaySettingsPage = async (locale) => {
   await loadNamespaceAsync(locale, 'settings')
   setLocale(locale)

   // goto settings page
}
```
> make sure to call `setLocale` after you load new namespaces !


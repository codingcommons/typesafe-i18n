# `typesafe-i18n` React

**You can find a demo react implementation [here](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/adapter-react/examples/react).**

**You can find a demo Next.js implementation [here](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/adapter-react/examples/nextjs).**

**You can find a demo Expo react-native implementation [here](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/adapter-react/examples/expo).**

## Setup

See [here](https://github.com/ivanhofer/typesafe-i18n#get-started) on more information how to set up `typesafe-i18n`.

### manual installation

```bash
npm install typesafe-i18n
```

---

## Table of Contents
 - [add `typesafe-i18n` to existing projects](#configure-typesafe-i18n-for-an-existing-react-project)
 - [generated component & context](#generated-component--context)


<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->

## Configure `typesafe-i18n` for an existing React project


Initialize `typesafe-i18n` by running

```bash
npx typesafe-i18n --setup-auto
```

You could configure your development script to run the generator in parallel to `react-scripts start` by using [`npm-run-all`](https://github.com/mysticatea/npm-run-all).

```json
{
   "scripts": {
      "dev": "npm-run-all --parallel start typesafe-i18n",
      "typesafe-i18n": "typesafe-i18n",
      "start": "react-scripts start"
   }
}
```

The generator will create a custom React component and context inside `i18n-react.tsx` that you can use inside your application.

Wrap your application root with the `TypesafeI18n` component:

```jsx
import { useState, useEffect } from 'react'
import { navigatorDetector } from 'typesafe-i18n/detectors'
import TypesafeI18n from './i18n/i18n-react'
import { detectLocale } from './i18n/i18n-util'
import { loadLocale } from './i18n/i18n-util.sync'


function App() {
   // Detect locale
   // (Use as advanaced locale detection strategy as you like.
   // More info: https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/detectors)
   const locale = detectLocale(navigatorDetector)

   // Load locales
   // (Use a data fetching solution that you prefer)
   const [localesLoaded, setLocalesLoaded] = useState(false)
   useEffect(() => {
      loadLocale(locale).then(() => setLocalesLoaded(true))
   }, [locale])

   if(!localesLoaded) {
      return null
   }

   return (
      <TypesafeI18n locale={locale}>

         {/* Your app goes here */}

      </TypesafeI18n>
   )
}

export default App
```

That's it. You can then start using `typesafe-i18n` inside your React components.

```jsx
import { useI18nContext } from './i18n/i18n-react'

function Greeting(props) {
   const { LL } = useI18nContext()

   return <h1>{LL.HI({ name: props.name })}</h1>
}

export default Greeting
```


<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->

## generated component & context

### TypesafeI18n

When running the [generator](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/generator#generator), the file `i18n-react.tsx` will export a React component you can wrap around your application. It requires the prop `locale` where you need to pass a locale to initialize the context.

```jsx
import TypesafeI18n from './i18n/i18n-react'

function App() {

   // TODO: load locales (https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/generator#loading-locales)
      // e.g. take a look at the example implementation (https://github.com/ivanhofer/typesafe-i18n/blob/main/packages/adapter-react/examples/react/src/App.tsx#L15)

   return (
      <TypesafeI18n locale="en">

         <!-- your app goes here -->

      </TypesafeI18n>
   )
}

export default App
```


### useI18nContext

Also a React context is exported by the generated file `i18n-react.tsx`. You can use it with the `useI18nContext` function.

```jsx
import { useI18nContext } from './i18n/i18n-react'

function MyComponent(props) {
   const { LL, locale, setLocale } = useI18nContext()

   return // ...
}

export default MyComponent
```

The context gives you access to following variables:

#### LL

An initialized [`i18nObject`](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/runtime#i18nObject) you can use to translate your app.

```jsx
import { useI18nContext } from './i18n/i18n-react'

function ProjectOverview() {
   const { LL } = useI18nContext()

   return LL.NR_OF_PROJECTS(5) // will output e.g => '5 Projects'
}

export default ProjectOverview
```

#### locale

A `string` containing the current selected locale.

#### setLocale

A function to set another locale for the context.


```jsx
import { useI18nContext } from './i18n/i18n-react'

function LanguageSelection() {
   const { locale, setLocale } = useI18nContext()

   return (
      <ul className="language-selection">
         <li className={'en' === locale ? 'selected' : ''} onClick={() => setLocale('en')}>
            english
         </li>
         <li className={'de' === locale ? 'selected' : ''} onClick={() => setLocale('de')}>
            deutsch
         </li>
         <li className={'it' === locale ? 'selected' : ''} onClick={() => setLocale('it')}>
            italiano
         </li>
      </ul>
   )
}

export default LanguageSelection
```


---
---

**For more information about `typesafe-i18n`, take a look at the [main repository](https://github.com/ivanhofer/typesafe-i18n).**

---
---

<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->
<!-- ------------------------------------------------------------------------------------------ -->

## recipes

### How do I render a component inside a Translation?

By default `typesafe-i18n` at this time does not provide such a functionality. But you could easily write a function like this:

```jsx
import { LocalizedString } from 'typesafe-i18n'

// create a component that handles the translated message

interface WrapTranslationPropsType {
   message: LocalizedString,
   renderComponent: (messagePart: LocalizedString) => JSX.Element
}

export function WrapTranslation({ message, renderComponent }: WrapTranslationPropsType) {
   // define a split character, in this case '<>'
   let [prefix, infix, postfix] = message.split('<>') as LocalizedString[]

   // render infix only if the message doesn't have any split characters
   if (!infix && !postfix) {
      infix = prefix
      prefix = '' as LocalizedString
   }

   return <>
      {prefix}
      {renderComponent(infix)}
      {postfix}
   </>
}
```

Your translations would look something like this

```ts
const en = {
   'WELCOME': 'Hi {name:string}, click <>here<> to create your first project'
   'LOGOUT': 'Logout'
}
```

Use it inside your application

```tsx
export function App() {
   return <>
      <header>
         <!-- normal usage -->
         <button onClick={() => alert('do logout')}>{LL.logout()}</button>} />
      </header>
      <main>
         <!-- usage with a component inside a translation -->
         <WrapTranslation
            message={LL.WELCOME({ name: 'John' })}
            renderComponent={(infix) => <button onClick={() => alert('clicked')}>{infix}</button>} />
      </main>
   <>
}
```

import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import type { Locale } from '../../../../runtime/src/core.mjs'
import { navigatorDetector } from './navigator.mjs'

const test = suite('detector:navigator')
const originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')

// --------------------------------------------------------------------------------------------------------------------

const testDetector = (name: string, languages: string[] | undefined, expected: Locale[]) =>
	test(`navigator ${name}`, () => {
		Object.defineProperty(globalThis, 'navigator', {
			configurable: true,
			value: { languages: languages as string[] } as unknown as Navigator,
		})

		try {
			assert.equal(navigatorDetector(), expected)
		} finally {
			if (originalNavigatorDescriptor) {
				Object.defineProperty(globalThis, 'navigator', originalNavigatorDescriptor)
			} else {
				delete (globalThis as { navigator?: Navigator }).navigator
			}
		}
	})

testDetector('undefined', undefined, [])

testDetector('empty', [], [])

testDetector('single value', ['de-AT'], ['de-AT'])

testDetector('multiple values', ['de', 'en-US', 'en', 'it'], ['de', 'en-US', 'en', 'it'])

// --------------------------------------------------------------------------------------------------------------------

test.run()

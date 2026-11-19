import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'
import { FEATURES } from '../lib/features.ts'

configure({ asyncUtilTimeout: 5000 })

// Tests cover the "Coming soon" placeholders by default; launch.test.tsx turns them off.
const features = FEATURES as { comingSoon: boolean }
features.comingSoon = true

// jsdom doesn't implement scrolling; React Router's ScrollRestoration calls it.
window.scrollTo = () => {}
Element.prototype.scrollIntoView = () => {}

afterEach(() => {
  cleanup()
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  features.comingSoon = true
})

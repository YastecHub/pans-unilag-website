import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

configure({ asyncUtilTimeout: 5000 })

// jsdom doesn't implement scrolling; React Router's ScrollRestoration calls it.
window.scrollTo = () => {}
Element.prototype.scrollIntoView = () => {}

afterEach(() => {
  cleanup()
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

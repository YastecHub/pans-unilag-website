import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { OfflineNotice } from './OfflineNotice.tsx'

const setOnline = (online: boolean) => {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online })
  window.dispatchEvent(new Event(online ? 'online' : 'offline'))
}

describe('OfflineNotice', () => {
  afterEach(() => setOnline(true))

  it('says so when the connection drops, and goes away when it’s back', () => {
    render(<OfflineNotice />)
    const region = screen.getByRole('status')
    expect(region.textContent).toBe('')

    act(() => setOnline(false))
    expect(region.textContent).toContain('You’re offline. Pages you’ve opened before still work')

    act(() => setOnline(true))
    expect(region.textContent).toBe('')
  })
})

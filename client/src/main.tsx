import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { Analytics } from '@vercel/analytics/react'
// Self-hosted brand fonts: only the weights in the README (Poppins 500/600, Inter 400/500).
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import { AppProviders } from './app/providers.tsx'
import { router } from './app/router.tsx'
import { registerServiceWorker } from './lib/serviceWorker.ts'
import { applyTheme, getThemePreference, resolveTheme, watchSystemTheme } from './lib/theme.ts'
import './styles/globals.css'

// index.html already set data-theme before paint; this also syncs the browser bar colour.
applyTheme(resolveTheme(getThemePreference()))
watchSystemTheme()
registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
      <Analytics />
    </AppProviders>
  </StrictMode>,
)

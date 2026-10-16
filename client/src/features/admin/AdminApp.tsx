import { useEffect } from 'react'
import { Route, Routes } from 'react-router'
import { AdminLayout } from './components/AdminLayout.tsx'
import { RequireAdmin } from './components/RequireAdmin.tsx'
import {
  AdminNotFoundPage,
  AlumniPage,
  FeedbackPage,
  OverviewPage,
  PlaceholdersPage,
} from './pages/AdminPages.tsx'
import { SignInPage } from './pages/SignInPage.tsx'
import { EDITORS } from './editors/editors.ts'
import { EditPage, ListPage } from './editors/EditorPages.tsx'
import { ContentPage } from './editors/ContentIndex.tsx'

/**
 * The admin area at /admin. Loaded only when someone visits /admin (routes.tsx imports it
 * lazily), so public visitors never download it. Everything except sign-in needs a session.
 */
export function AdminApp() {
  // Keep the dashboard out of search engines.
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.append(meta)
    return () => meta.remove()
  }, [])

  return (
    <Routes>
      <Route path="sign-in" element={<SignInPage />} />
      <Route element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="content" element={<ContentPage />} />
          {EDITORS.map((config) => (
            <Route key={config.name} path={config.name}>
              <Route index element={<ListPage config={config} />} />
              <Route path="new" element={<EditPage config={config} />} />
              <Route path=":id" element={<EditPage config={config} />} />
            </Route>
          ))}
          <Route path="placeholders" element={<PlaceholdersPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="alumni" element={<AlumniPage />} />
          <Route path="*" element={<AdminNotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

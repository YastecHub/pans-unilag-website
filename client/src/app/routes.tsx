import type { RouteObject } from 'react-router'
import { HomePage } from '../features/home/pages/HomePage.tsx'
import { PublicLayout } from './layouts/PublicLayout.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { PageStub } from './pages/PageStub.tsx'
import { RouteErrorPage } from './pages/RouteErrorPage.tsx'
import { SectionOverviewPage } from './pages/SectionOverviewPage.tsx'
import { OVERVIEW_SECTIONS, STUB_PAGES } from './siteMap.ts'

/**
 * All routes. Feature issues replace a PageStub with their real page,
 * e.g. { path: '/events', element: <EventsPage /> }, and remove it from STUB_PAGES.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      ...OVERVIEW_SECTIONS.map((section) => ({
        path: section.to,
        element: <SectionOverviewPage section={section} />,
      })),
      ...STUB_PAGES.map((page) => ({ path: page.path, element: <PageStub page={page} /> })),
      // Component gallery for developers. Left out of production builds (the import is removed with it).
      ...(import.meta.env.DEV || import.meta.env.VITE_SHOW_UI_KIT === 'true'
        ? [
            {
              path: '/_ui',
              lazy: async () => ({
                Component: (await import('../features/dev/UiKitPage.tsx')).UiKitPage,
              }),
            },
          ]
        : []),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    // Code-split: the admin bundle is only downloaded when /admin is visited.
    path: '/admin/*',
    errorElement: <RouteErrorPage />,
    lazy: async () => {
      const { AdminApp } = await import('../features/admin/AdminApp.tsx')
      return { Component: AdminApp }
    },
  },
]

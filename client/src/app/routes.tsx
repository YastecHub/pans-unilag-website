import type { RouteObject } from 'react-router'
import {
  HistoryPage,
  ImpactPage,
  MembershipPage,
  WhoWeArePage,
} from '../features/about/pages/AboutPages.tsx'
import { EventPage } from '../features/events/pages/EventPage.tsx'
import { PastEventsPage } from '../features/events/pages/PastEventsPage.tsx'
import { UpcomingEventsPage } from '../features/events/pages/UpcomingEventsPage.tsx'
import {
  ConstitutionPage,
  ElectionsPage,
  FinancePage,
  GovernancePage,
  MeetingsPage,
} from '../features/governance/pages/GovernancePages.tsx'
import { HomePage } from '../features/home/pages/HomePage.tsx'
import { CommitteePage } from '../features/leadership/pages/CommitteePage.tsx'
import { CommitteesPage } from '../features/leadership/pages/CommitteesPage.tsx'
import { ExecutiveCouncilPage } from '../features/leadership/pages/ExecutiveCouncilPage.tsx'
import { PatronsPage } from '../features/leadership/pages/PatronsPage.tsx'
import { SenatePage } from '../features/leadership/pages/SenatePage.tsx'
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
      { path: '/about', element: <WhoWeArePage /> },
      { path: '/about/membership', element: <MembershipPage /> },
      { path: '/about/history', element: <HistoryPage /> },
      { path: '/about/impact', element: <ImpactPage /> },
      { path: '/leadership/executive-council', element: <ExecutiveCouncilPage /> },
      { path: '/leadership/senate', element: <SenatePage /> },
      { path: '/leadership/committees', element: <CommitteesPage /> },
      { path: '/leadership/committees/:slug', element: <CommitteePage /> },
      { path: '/leadership/patrons', element: <PatronsPage /> },
      { path: '/governance', element: <GovernancePage /> },
      { path: '/governance/elections', element: <ElectionsPage /> },
      { path: '/governance/finance', element: <FinancePage /> },
      { path: '/governance/meetings', element: <MeetingsPage /> },
      { path: '/governance/constitution', element: <ConstitutionPage /> },
      { path: '/events', element: <UpcomingEventsPage /> },
      { path: '/events/past', element: <PastEventsPage /> },
      { path: '/events/:slug', element: <EventPage /> },
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

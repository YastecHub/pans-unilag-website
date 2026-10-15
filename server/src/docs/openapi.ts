import { createDocument } from 'zod-openapi'
import { healthPaths } from '../modules/health/http/health.openapi.js'
import { albumsPaths } from '../modules/albums/http/albums.openapi.js'
import { announcementsPaths } from '../modules/announcements/http/announcements.openapi.js'
import { authPaths } from '../modules/auth/http/auth.openapi.js'
import { committeesPaths } from '../modules/committees/http/committees.openapi.js'
import { documentsPaths } from '../modules/documents/http/documents.openapi.js'
import { eventsPaths } from '../modules/events/http/events.openapi.js'
import { executivesPaths } from '../modules/executives/http/executives.openapi.js'
import { opportunitiesPaths } from '../modules/opportunities/http/opportunities.openapi.js'
import { gradingPaths } from '../modules/grading/http/grading.openapi.js'
import { pagesPaths } from '../modules/pages/http/pages.openapi.js'
import { patronsPaths } from '../modules/patrons/http/patrons.openapi.js'
import { publicationsPaths } from '../modules/publications/http/publications.openapi.js'
import { resourcesPaths } from '../modules/resources/http/resources.openapi.js'
import { submissionsPaths } from '../modules/submissions/http/submissions.openapi.js'
import { searchPaths } from '../modules/search/http/search.openapi.js'
import { senatePaths } from '../modules/senate/http/senate.openapi.js'
import { settingsPaths } from '../modules/settings/http/settings.openapi.js'

/**
 * Builds the OpenAPI 3.1 document from each module's `<feature>.openapi.ts`.
 * When you add a module, export its paths from `modules/<feature>/http/<feature>.openapi.ts`,
 * add a tag below and spread the paths into `paths`.
 */
export function buildOpenApiDocument() {
  return createDocument({
    openapi: '3.1.0',
    info: {
      title: 'PANS UNILAG API',
      version: '0.1.0',
      description: [
        'API for the Pharmaceutical Association of Nigeria Students (PANS), University of Lagos website.',
        '',
        'All responses are JSON. Errors share one shape (`ErrorResponse`): switch on `error.code`, show `error.message`, and quote `error.requestId` (also sent as the `X-Request-Id` header) when reporting a problem.',
      ].join('\n'),
    },
    tags: [
      { name: 'Health', description: 'Service status' },
      { name: 'Pages', description: 'Constitution-derived About pages' },
      {
        name: 'Leadership',
        description: 'Executive Council, Senate, committees and patrons',
      },
      { name: 'Events', description: 'Upcoming and past events, and their photo albums' },
      {
        name: 'Content',
        description: 'Announcements, opportunities, publications, documents and academic resources',
      },
      { name: 'Academics', description: 'CGPA calculator grading scale' },
      { name: 'Site', description: 'Contact details, social links and the site banner' },
      { name: 'Search', description: 'Site search (placeholders excluded)' },
      {
        name: 'Admin auth',
        description: 'Sign-in for named admins (no public sign-up)',
      },
      { name: 'Forms', description: 'Feedback and alumni sign-ups (write-only, rate-limited)' },
    ],
    paths: {
      ...healthPaths,
      ...pagesPaths,
      ...executivesPaths,
      ...senatePaths,
      ...committeesPaths,
      ...patronsPaths,
      ...eventsPaths,
      ...albumsPaths,
      ...announcementsPaths,
      ...opportunitiesPaths,
      ...publicationsPaths,
      ...documentsPaths,
      ...resourcesPaths,
      ...gradingPaths,
      ...settingsPaths,
      ...submissionsPaths,
      ...searchPaths,
      ...authPaths,
    },
  })
}

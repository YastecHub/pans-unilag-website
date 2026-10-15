import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Model } from 'mongoose'
import type { Readers } from '../src/app.js'
import type { StoredAlbum } from '../src/modules/albums/application/albumView.js'
import { AlbumModel } from '../src/modules/albums/infrastructure/album.model.js'
import { toCommitteeView } from '../src/modules/committees/application/committeeView.js'
import { CommitteeModel } from '../src/modules/committees/infrastructure/committee.model.js'
import type { StoredEvent } from '../src/modules/events/application/eventView.js'
import { EventModel } from '../src/modules/events/infrastructure/event.model.js'
import type { StoredDocument } from '../src/modules/documents/application/documentView.js'
import { DocumentModel } from '../src/modules/documents/infrastructure/document.model.js'
import { toExecutiveView } from '../src/modules/executives/application/executiveView.js'
import { ExecutiveModel } from '../src/modules/executives/infrastructure/executive.model.js'
import type { StoredGradingScale } from '../src/modules/grading/application/gradingView.js'
import { GradingScaleModel } from '../src/modules/grading/infrastructure/gradingScale.model.js'
import { toPageView } from '../src/modules/pages/application/pageView.js'
import { PageModel } from '../src/modules/pages/infrastructure/page.model.js'
import { toPatronView } from '../src/modules/patrons/application/patronView.js'
import { PatronModel } from '../src/modules/patrons/infrastructure/patron.model.js'
import type { StoredPublication } from '../src/modules/publications/application/publicationView.js'
import { PublicationModel } from '../src/modules/publications/infrastructure/publication.model.js'
import type { StoredSettings } from '../src/modules/settings/application/settingsView.js'
import { SettingsModel } from '../src/modules/settings/infrastructure/settings.model.js'
import { toSenatorView } from '../src/modules/senate/application/senatorView.js'
import { SenatorModel } from '../src/modules/senate/infrastructure/senator.model.js'

/**
 * Seed file entries as MongoDB would store them: each is passed through its model,
 * so schema defaults (empty bio, level, …) are filled in exactly as after `npm run seed`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function storedSeed<T>(file: string, model: Model<any>): T[] {
  const raw = JSON.parse(
    readFileSync(fileURLToPath(new URL(`../seed/${file}`, import.meta.url)), 'utf8'),
  ) as object[]
  return raw.map((entry) => new model(entry).toObject() as T)
}

const byOrder = <T extends { order: number }>(items: T[]) =>
  [...items].sort((a, b) => a.order - b.order)

/** In-memory readers over the real seed files, so API tests need no database. */
export function seedReaders(): Readers {
  const pages = storedSeed<Parameters<typeof toPageView>[0]>('pages.json', PageModel)
  const executives = storedSeed<Parameters<typeof toExecutiveView>[0]>(
    'executives.json',
    ExecutiveModel,
  )
  const senate = storedSeed<Parameters<typeof toSenatorView>[0]>('senate.json', SenatorModel)
  const committees = storedSeed<Parameters<typeof toCommitteeView>[0]>(
    'committees.json',
    CommitteeModel,
  )
  const patrons = storedSeed<Parameters<typeof toPatronView>[0]>('patrons.json', PatronModel)
  const events = storedSeed<StoredEvent>('events.json', EventModel)
  const albums = storedSeed<StoredAlbum>('albums.json', AlbumModel)
  const publications = storedSeed<StoredPublication>('publications.json', PublicationModel)
  const documents = storedSeed<StoredDocument>('documents.json', DocumentModel)
  const scales = storedSeed<StoredGradingScale & { active: boolean }>(
    'grading.json',
    GradingScaleModel,
  )
  const [settings] = storedSeed<StoredSettings>('settings.json', SettingsModel)
  const bySeries = <T extends { series?: string }>(items: T[], series?: string) =>
    series ? items.filter((i) => i.series === series) : items

  const sessionReader = <S extends { session: string; order: number }, V>(
    items: S[],
    toView: (s: S) => V,
  ) => ({
    sessions: async () => items.map((i) => i.session),
    listBySession: async (session: string) =>
      byOrder(items.filter((i) => i.session === session)).map(toView),
  })

  return {
    pages: {
      findBySlug: async (slug) => {
        const page = pages.find((p) => p.slug === slug)
        return page ? toPageView(page) : null
      },
    },
    executives: sessionReader(executives, toExecutiveView),
    senate: sessionReader(senate, toSenatorView),
    committees: {
      ...sessionReader(committees, toCommitteeView),
      findBySlug: async (slug) => {
        const committee = committees.find((c) => c.slug === slug)
        return committee ? toCommitteeView(committee) : null
      },
    },
    patrons: { list: async () => byOrder(patrons).map(toPatronView) },
    events: {
      list: async ({ series }) => bySeries(events, series),
      findBySlug: async (slug) => events.find((e) => e.slug === slug) ?? null,
    },
    albums: {
      list: async ({ series }) => bySeries(albums, series),
      findBySlug: async (slug) => albums.find((a) => a.slug === slug) ?? null,
    },
    publications: { list: async ({ series }) => bySeries(publications, series) },
    documents: { list: async () => documents },
    // No seed files: these lists start empty and are filled in the dashboard.
    announcements: { list: async () => [] },
    opportunities: { list: async () => [], findBySlug: async () => null },
    resources: { list: async () => [] },
    gradingScale: { findActive: async () => scales.find((s) => s.active) ?? null },
    settings: { find: async () => settings ?? null },
  }
}

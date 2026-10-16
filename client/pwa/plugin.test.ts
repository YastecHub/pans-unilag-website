import { readFileSync } from 'node:fs'
import type { Rolldown } from 'vite'
import { describe, expect, it } from 'vitest'
import { precacheUrls, serviceWorker } from './plugin.ts'

const chunk = (fileName: string, fields: Record<string, unknown> = {}) => ({
  type: 'chunk',
  fileName,
  isEntry: false,
  imports: [],
  dynamicImports: [],
  facadeModuleId: null,
  viteMetadata: { importedCss: new Set(), importedAssets: new Set() },
  ...fields,
})
const asset = (fileName: string) => ({ type: 'asset', fileName, source: '' })

const bundle = Object.fromEntries(
  [
    chunk('assets/index-1.js', {
      isEntry: true,
      dynamicImports: ['assets/AdminApp-2.js', 'assets/MarkdownRenderer-3.js'],
      viteMetadata: {
        importedCss: new Set(['assets/index-4.css']),
        importedAssets: new Set([
          'assets/pans-badge-5.png',
          'assets/inter-latin-400-normal-6.woff2',
          'assets/inter-greek-400-normal-7.woff2',
          'assets/inter-latin-400-normal-8.woff',
        ]),
      },
    }),
    chunk('assets/AdminApp-2.js', {
      facadeModuleId: '/repo/client/src/features/admin/AdminApp.tsx',
      dynamicImports: ['assets/editor-9.js'],
    }),
    chunk('assets/editor-9.js'),
    chunk('assets/MarkdownRenderer-3.js', {
      facadeModuleId: '/repo/client/src/components/ui/MarkdownRenderer.tsx',
    }),
    asset('assets/index-4.css'),
    asset('assets/poppins-latin-600-normal-10.woff2'),
    asset('assets/poppins-latin-ext-600-normal-11.woff2'),
    asset('index.html'),
    asset('robots.txt'),
  ].map((file) => [file.fileName, file]),
) as unknown as Rolldown.OutputBundle

describe('the offline file list', () => {
  it('keeps the public site, its images and Latin fonts, and leaves out the dashboard', () => {
    expect(precacheUrls(bundle)).toEqual([
      '/',
      '/site.webmanifest',
      '/favicon.ico',
      '/assets/MarkdownRenderer-3.js',
      '/assets/index-1.js',
      '/assets/index-4.css',
      '/assets/inter-latin-400-normal-6.woff2',
      '/assets/pans-badge-5.png',
      '/assets/poppins-latin-600-normal-10.woff2',
    ])
  })
})

describe('the service worker build', () => {
  // Tests run from client/ (jsdom gives import.meta.url an http address).
  const template = readFileSync('pwa/sw.js', 'utf8')

  it('fills in the file list and a version, and is valid JavaScript', () => {
    const code = serviceWorker(template, ['/', '/assets/index-1.js'], '<html>')
    expect(code).toContain('const PRECACHE = ["/","/assets/index-1.js"]')
    expect(code).toMatch(/const BUILD = "[0-9a-f]{12}"/)
    expect(code).not.toContain('__')
    expect(() => new Function(code)).not.toThrow()
  })

  it('gets a new version when the files or the page change, so phones update', () => {
    const version = (urls: string[], html: string) =>
      /const BUILD = "(\w+)"/.exec(serviceWorker(template, urls, html))?.[1]
    const first = version(['/assets/index-1.js'], '<html>')
    expect(version(['/assets/index-1.js'], '<html>')).toBe(first)
    expect(version(['/assets/index-2.js'], '<html>')).not.toBe(first)
    expect(version(['/assets/index-1.js'], '<html lang="en">')).not.toBe(first)
  })
})

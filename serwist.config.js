// @ts-check
import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'

import { serwist } from '@serwist/next/config'

// revision for the offline page; changes with every commit (or build, outside git)
const git = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' })
const revision = git.status === 0 && git.stdout.trim() ? git.stdout.trim() : randomUUID()

export default serwist({
  swSrc: 'src/sw/sw.ts',
  swDest: 'public/sw.js',
  // prerendered pages are not precached: pages always come from the network, except saved articles
  precachePrerendered: false,
  // install stays light on mobile data: styles, fonts and icons only. JavaScript chunks are cached at
  // runtime as pages are visited (the admin bundle is never downloaded by members), and a saved article
  // without its chunks still renders as readable server HTML.
  globDirectory: '.',
  globPatterns: ['.next/static/**/*.{css,woff2}', 'public/*.{png,svg,ico}'],
  modifyURLPrefix: { '.next/': '/_next/', 'public/': '/' },
  additionalPrecacheEntries: [{ url: '/offline', revision }],
})

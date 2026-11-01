// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CASE_STUDIES } from './case-studies'
import { PROJECTS } from './projects'
import { RESUME_URL } from './profile'

/* Content integrity: the typed content modules are the single source of
   truth, so these checks stop a bad edit from shipping a broken page. */

const PUBLIC = join(process.cwd(), 'public')

/** Width and height from a PNG's IHDR chunk (bytes 16–24). */
function pngSize(file: string): { width: number; height: number } {
  const header = readFileSync(file).subarray(0, 24)
  expect(header.subarray(1, 4).toString('ascii'), `${file} is not a PNG`).toBe('PNG')
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) }
}

describe('content integrity', () => {
  it('pairs every project card with exactly one case study, in the same order', () => {
    expect(CASE_STUDIES.map(c => c.slug)).toEqual(PROJECTS.map(p => p.slug))
  })

  const shots = CASE_STUDIES.flatMap(study => study.shots.map(shot => ({ slug: study.slug, ...shot })))

  it.each(shots.map(s => [s.src, s]))('%s exists, with the declared size and alt text', (_, shot) => {
    const file = join(PUBLIC, shot.src)
    expect(existsSync(file), `missing ${shot.src}`).toBe(true)
    /* next/image reserves space from width/height; a mismatch means layout shift or a distorted image. */
    expect(pngSize(file)).toEqual({ width: shot.width, height: shot.height })
    expect(shot.alt.trim().length, 'alt text describes the screenshot').toBeGreaterThan(20)
    expect(shot.caption.trim()).not.toBe('')
  })

  it('gives every project card a desktop cover', () => {
    for (const study of CASE_STUDIES) expect(study.shots.some(s => s.frame === 'desktop'), study.slug).toBe(true)
  })

  it('ships the resume and the hero portrait the pages link to', () => {
    expect(existsSync(join(PUBLIC, RESUME_URL))).toBe(true)
    expect(pngSize(join(PUBLIC, 'images/sidd-portrait.png'))).toEqual({ width: 1254, height: 1254 })
  })

  it('links live demos and repos over https only', () => {
    for (const p of PROJECTS) {
      for (const url of [p.live, p.repo]) if (url) expect(url, p.slug).toMatch(/^https:\/\//)
    }
  })
})

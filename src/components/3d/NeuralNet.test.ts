import { describe, expect, it } from 'vitest'
import { buildEdges, KIND_CAPTION, ndcToPixels, NODES, type Vec3 } from './NeuralNet'
import { PROJECTS } from '@/content/projects'

describe('buildEdges', () => {
  const points = NODES.map(n => n.base)
  const edges = buildEdges(points)

  it('produces ordered pairs with no self-loops or duplicates', () => {
    const keys = edges.map(([a, b]) => `${a}-${b}`)
    expect(new Set(keys).size).toBe(edges.length)
    for (const [a, b] of edges) expect(a).toBeLessThan(b)
  })

  it('connects every node to at least k neighbours', () => {
    const degree = new Array<number>(points.length).fill(0)
    for (const [a, b] of edges) { degree[a]++; degree[b]++ }
    expect(Math.min(...degree)).toBeGreaterThanOrEqual(2)
  })

  it('links nearest neighbours on a simple line', () => {
    const line: Vec3[] = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [10, 0, 0]]
    expect(buildEdges(line, 1)).toEqual([[0, 1], [1, 2], [2, 3]])
  })
})

describe('interactive nodes', () => {
  const labelled = NODES.filter(n => n.label)

  it('labels every node that has a click target, with a kind and caption', () => {
    for (const n of NODES) {
      expect(Boolean(n.label)).toBe(Boolean(n.target))
      if (n.kind) expect(KIND_CAPTION[n.kind]).toBeTruthy()
    }
    expect(new Set(labelled.map(n => n.label)).size).toBe(labelled.length)
  })

  it('has exactly one node per project, pointing at that project card', () => {
    const projectNodes = NODES.filter(n => n.kind === 'project')
    expect(projectNodes.map(n => n.target).sort()).toEqual(PROJECTS.map(p => `project-${p.slug}`).sort())
  })

  it('sends skills and "About me" to sections that exist', () => {
    for (const n of NODES.filter(n => n.kind === 'skill')) expect(n.target).toBe('skills')
    expect(NODES.find(n => n.kind === 'about')?.target).toBe('about')
  })
})

describe('ndcToPixels', () => {
  it('maps device coordinates to canvas pixels with y pointing down', () => {
    const size = { width: 800, height: 600 }
    expect(ndcToPixels({ x: -1, y: 1 }, size)).toEqual({ x: 0, y: 0 })
    expect(ndcToPixels({ x: 0, y: 0 }, size)).toEqual({ x: 400, y: 300 })
    expect(ndcToPixels({ x: 1, y: -1 }, size)).toEqual({ x: 800, y: 600 })
  })
})

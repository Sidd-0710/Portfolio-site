'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { cx } from '@/lib/cx'
import { REDUCED_MOTION_QUERY, useMediaQuery } from '@/lib/hooks'

/** A point in 3D space. */
export type Vec3 = readonly [x: number, y: number, z: number]

/** An undirected edge between two node indices, lower index first. */
export type Edge = readonly [a: number, b: number]

/** What a labelled node stands for; decides its colour, hit size and caption. */
export type NodeKind = 'project' | 'skill' | 'about'

interface NetworkNode {
  /** Resting position; the node drifts around it. */
  base: Vec3
  /** Sphere radius. */
  size: number
  /** Shown on hover. Unlabelled nodes are decoration only. */
  label?: string
  kind?: NodeKind
  /** Id of the page element a click scrolls to. */
  target?: string
}

interface Pointer {
  /** Horizontal pointer position across the viewport, -1 (left) to 1 (right). */
  x: number
  /** Vertical pointer position across the viewport, -1 (top) to 1 (bottom). */
  y: number
}

/**
 * Fixed hand-placed layout, so the network looks the same on every visit.
 * The largest nodes are the projects, the central hub is "About me", and the
 * rest are core skills. Targets must match ids on the page (tested).
 */
export const NODES: readonly NetworkNode[] = [
  { base: [-3.1,  1.8, -0.8], size: 0.10, label: 'React',         kind: 'skill',   target: 'skills' },
  { base: [ 0.4,  2.6, -1.2], size: 0.07, label: 'TypeScript',    kind: 'skill',   target: 'skills' },
  { base: [ 3.0,  1.4, -0.5], size: 0.13, label: 'Seatly',        kind: 'project', target: 'project-seatly' },
  { base: [-2.0, -0.6,  1.0], size: 0.08, label: 'Node.js',       kind: 'skill',   target: 'skills' },
  { base: [ 1.2,  0.8,  1.4], size: 0.14, label: 'AutoValue',     kind: 'project', target: 'project-autovalue' },
  { base: [ 3.4, -0.4,  0.2], size: 0.09, label: 'FastAPI',       kind: 'skill',   target: 'skills' },
  { base: [-3.6, -1.6, -0.3], size: 0.08 },
  { base: [ 0.0, -1.8,  0.8], size: 0.11, label: 'Python',        kind: 'skill',   target: 'skills' },
  { base: [ 2.8, -2.0, -1.0], size: 0.09, label: 'scikit-learn',  kind: 'skill',   target: 'skills' },
  { base: [-1.2,  1.2,  1.8], size: 0.10, label: 'Express',       kind: 'skill',   target: 'skills' },
  { base: [ 2.0,  2.0,  0.6], size: 0.08, label: 'Tailwind CSS',  kind: 'skill',   target: 'skills' },
  { base: [-0.6, -0.2, -1.6], size: 0.13, label: 'Signal',        kind: 'project', target: 'project-signal' },
  { base: [ 1.6, -1.0,  1.6], size: 0.09, label: 'LLMs (Ollama)', kind: 'skill',   target: 'skills' },
  { base: [-2.6,  0.6, -1.4], size: 0.07 },
  { base: [ 0.8,  0.2, -0.4], size: 0.16, label: 'About me',      kind: 'about',   target: 'about' },
  { base: [-1.8, -2.2,  0.4], size: 0.08, label: 'MongoDB',       kind: 'skill',   target: 'skills' },
]

/** Hover caption under each label. */
export const KIND_CAPTION: Record<NodeKind, string> = {
  project: 'Project · click to view',
  skill:   'Skill · click for all skills',
  about:   'That’s me · click to read more',
}

/**
 * Connects every point to its `k` nearest neighbours and returns the unique
 * undirected edges. Each node ends up with at least `k` edges.
 */
export function buildEdges(points: readonly Vec3[], k = 2): Edge[] {
  const seen = new Set<string>()
  const edges: Edge[] = []

  points.forEach((p, i) => {
    const nearest = points
      .map((q, j) => ({ j, d: Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) }))
      .filter(({ j }) => j !== i)
      .sort((m, n) => m.d - n.d)
      .slice(0, k)

    for (const { j } of nearest) {
      const edge: Edge = i < j ? [i, j] : [j, i]
      const key = `${edge[0]}-${edge[1]}`
      if (!seen.has(key)) {
        seen.add(key)
        edges.push(edge)
      }
    }
  })
  return edges
}

const EDGES = buildEdges(NODES.map(n => n.base))

/**
 * Converts normalised device coordinates (-1…1, y up) to pixel offsets in a
 * canvas of the given size (y down), for placing DOM labels over 3D points.
 */
export function ndcToPixels(ndc: { x: number; y: number }, size: { width: number; height: number }): { x: number; y: number } {
  return {
    x: ((ndc.x + 1) / 2) * size.width,
    y: ((1 - ndc.y) / 2) * size.height,
  }
}

/** The hero behind this canvas is dark in both themes, so the network always uses the glow palette. */
const ACCENT = '#78d6db'
const ACCENT_BRIGHT = '#c4f1f3'
const EDGE_DIM = new THREE.Color(ACCENT).multiplyScalar(0.45)
const EDGE_LIT = new THREE.Color(ACCENT_BRIGHT)

/** Writes node `i`'s drifted position at time `t` (seconds) into `out`. */
function driftPosition(i: number, t: number, out: THREE.Vector3): THREE.Vector3 {
  const [x, y, z] = NODES[i].base
  const phase = i * 0.618 * Math.PI
  const speed = 0.22 + (i % 5) * 0.04
  return out.set(
    x + Math.sin(t * speed + phase)       * 0.18,
    y + Math.cos(t * speed + phase * 1.3) * 0.14,
    z + Math.sin(t * speed * 0.7 + phase) * 0.10,
  )
}

interface NetworkProps {
  pointer: RefObject<Pointer>
  hovered: number | null
  onHover: (index: number | null) => void
  onSelect: (index: number) => void
  /** DOM label that follows the hovered node. */
  labelRef: RefObject<HTMLDivElement | null>
}

function Network({ pointer, hovered, onHover, onSelect, labelRef }: NetworkProps) {
  const groupRef    = useRef<THREE.Group>(null)
  const nodeRefs    = useRef<Array<THREE.Group | null>>([])
  const sphereRefs  = useRef<Array<THREE.Mesh | null>>([])
  const lineGeomRef = useRef<THREE.BufferGeometry>(null)
  const positions   = useMemo(() => NODES.map(n => new THREE.Vector3(...n.base)), [])
  const scratch     = useMemo(() => new THREE.Vector3(), [])
  const scratchTop  = useMemo(() => new THREE.Vector3(), [])
  const colors      = useMemo(() => ({
    plain:   new THREE.Color(ACCENT).multiplyScalar(0.7),
    skill:   new THREE.Color(ACCENT),
    project: new THREE.Color(ACCENT_BRIGHT),
  }), [])

  /* Two endpoints × xyz per edge, seeded with the resting layout. */
  const linePositions = useMemo(() => {
    const arr = new Float32Array(EDGES.length * 6)
    EDGES.forEach(([a, b], e) => {
      arr.set(NODES[a].base, e * 6)
      arr.set(NODES[b].base, e * 6 + 3)
    })
    return arr
  }, [])
  const lineColors = useMemo(() => new Float32Array(EDGES.length * 6), [])

  /* Light up the edges that touch the hovered node. */
  useEffect(() => {
    EDGES.forEach(([a, b], e) => {
      const c = hovered !== null && (a === hovered || b === hovered) ? EDGE_LIT : EDGE_DIM
      c.toArray(lineColors, e * 6)
      c.toArray(lineColors, e * 6 + 3)
    })
    const attr = lineGeomRef.current?.getAttribute('color')
    if (attr) attr.needsUpdate = true
  }, [hovered, lineColors])

  useFrame(({ clock, camera, size }) => {
    const t = clock.getElapsedTime()

    positions.forEach((pos, i) => {
      driftPosition(i, t, pos)
      nodeRefs.current[i]?.position.copy(pos)
      /* Ease the hovered node up to 1.7× and the rest back to 1×. */
      const sphere = sphereRefs.current[i]
      if (sphere) {
        const s = THREE.MathUtils.lerp(sphere.scale.x, hovered === i ? 1.7 : 1, 0.18)
        sphere.scale.setScalar(s)
      }
    })

    /* Edges follow the nodes. */
    EDGES.forEach(([a, b], e) => {
      positions[a].toArray(linePositions, e * 6)
      positions[b].toArray(linePositions, e * 6 + 3)
    })
    const attr = lineGeomRef.current?.getAttribute('position')
    if (attr) attr.needsUpdate = true

    /* Ease the whole network toward the pointer. */
    const group = groupRef.current
    if (group) {
      group.rotation.y += (pointer.current.x * 0.3 - group.rotation.y) * 0.05
      group.rotation.x += (-pointer.current.y * 0.2 - group.rotation.x) * 0.05
    }

    /* Pin the DOM label just above the hovered node's drawn top edge
       (world → screen), so the gap stays even at any size or depth. */
    const label  = labelRef.current
    const node   = hovered !== null ? nodeRefs.current[hovered] : null
    const sphere = hovered !== null ? sphereRefs.current[hovered] : null
    if (label && node && sphere && hovered !== null) {
      node.getWorldPosition(scratch)
      scratchTop.copy(scratch).add(camera.up.clone().multiplyScalar(NODES[hovered].size * sphere.scale.x))
      const centre = ndcToPixels(scratch.project(camera), size)
      const top    = ndcToPixels(scratchTop.project(camera), size)
      label.style.transform = `translate3d(${centre.x.toFixed(1)}px, ${top.y.toFixed(1)}px, 0) translate(-50%, calc(-100% - 12px))`
    }
  })

  return (
    <group ref={groupRef}>
      {NODES.map(({ base: [x, y, z], size, label, kind }, i) => (
        <group key={i} ref={el => { nodeRefs.current[i] = el }} position={[x, y, z]}>
          <mesh ref={el => { sphereRefs.current[i] = el }}>
            <sphereGeometry args={[size, 20, 20]} />
            <meshStandardMaterial
              color={colors[kind === 'project' || kind === 'about' ? 'project' : label ? 'skill' : 'plain']}
              emissive={colors[kind === 'project' || kind === 'about' ? 'project' : label ? 'skill' : 'plain']}
              emissiveIntensity={hovered === i ? 1.4 : 0.8}
              roughness={0.2}
              metalness={0.1}
            />
          </mesh>
          {/* Invisible, larger hit target: the spheres themselves are too small to aim at. */}
          {label && (
            <mesh
              onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(i) }}
              onPointerOut={() => onHover(null)}
              onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(i) }}
            >
              <sphereGeometry args={[kind === 'skill' ? 0.3 : 0.4, 12, 12]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          )}
        </group>
      ))}

      {/* One draw call for every edge; culling off because the bounds move each frame. */}
      <lineSegments frustumCulled={false}>
        <bufferGeometry ref={lineGeomRef}>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[lineColors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.55} />
      </lineSegments>

      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color={ACCENT} />
      <pointLight position={[-4, -2, 2]} intensity={0.8} color={ACCENT} />
    </group>
  )
}

/** Maps a node's x/y onto the 400×300 fallback SVG. */
function toSvg([x, y]: Vec3): { cx: number; cy: number } {
  return { cx: ((x + 4) / 8) * 400, cy: ((3 - y) / 6) * 300 }
}

/** Static picture of the network for reduced motion, or when WebGL is unavailable. */
function StaticFallback() {
  return (
    <svg viewBox="0 0 400 300" aria-hidden="true" style={{ width: '100%', height: '100%', opacity: 0.5 }}>
      {EDGES.map(([a, b]) => {
        const p = toSvg(NODES[a].base)
        const q = toSvg(NODES[b].base)
        return <line key={`${a}-${b}`} x1={p.cx} y1={p.cy} x2={q.cx} y2={q.cy} stroke={ACCENT} strokeWidth="1" strokeOpacity="0.5" />
      })}
      {NODES.map((n, i) => {
        const { cx, cy } = toSvg(n.base)
        return <circle key={i} cx={cx} cy={cy} r={n.size * 40} fill={ACCENT} opacity="0.8" />
      })}
    </svg>
  )
}

interface NeuralNetProps {
  /** When false, the render loop pauses (e.g. while the hero is scrolled out of view). */
  active?: boolean
}

/**
 * Interactive 3D network for the hero. Client-only: load it with
 * `next/dynamic` and `ssr: false`.
 *
 * - The whole network leans toward the pointer anywhere in the window.
 * - Labelled nodes (projects, skills, "About me") grow and light their edges
 *   on hover, show a label, and scroll to their section on click.
 *
 * It's a mouse shortcut, not the only route: every target is also reachable
 * from the nav and the page itself, so the canvas stays aria-hidden.
 */
export default function NeuralNet({ active = true }: NeuralNetProps) {
  const reduceMotion = useMediaQuery(REDUCED_MOTION_QUERY)
  const pointer  = useRef<Pointer>({ x: 0, y: 0 })
  const labelRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered]   = useState<number | null>(null)
  const [explored, setExplored] = useState(false)

  useEffect(() => {
    if (reduceMotion) return
    const onMove = (e: PointerEvent) => {
      pointer.current = {
        x: (e.clientX / window.innerWidth)  * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reduceMotion])

  const onHover = useCallback((index: number | null) => {
    if (index !== null) {
      setExplored(true)
      setHovered(index)
    } else {
      setHovered(null)
    }
  }, [])

  const onSelect = useCallback((index: number) => {
    const target = NODES[index].target
    const el = target ? document.getElementById(target) : null
    if (!el || !target) return
    /* Smooth unless reduced motion (the CSS scroll-behavior decides). */
    el.scrollIntoView({ block: target.startsWith('project-') ? 'center' : 'start' })
    window.history.replaceState(null, '', `#${target}`)
  }, [])

  if (reduceMotion) return <StaticFallback />

  const node = hovered !== null ? NODES[hovered] : null

  return (
    <div className="net" data-hovering={hovered !== null || undefined}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 55 }}
        dpr={[1, 1.5]}
        frameloop={active ? 'always' : 'never'}
        fallback={<StaticFallback />}
        style={{ width: '100%', height: '100%' }}
        onPointerMissed={() => setHovered(null)}
      >
        <Network pointer={pointer} hovered={hovered} onHover={onHover} onSelect={onSelect} labelRef={labelRef} />
      </Canvas>

      <div ref={labelRef} className="net-label pill" data-visible={node ? '' : undefined}>
        {node?.label && node.kind && (
          <>
            <span className="net-label__title">{node.label}</span>
            <span className="net-label__kind">{KIND_CAPTION[node.kind]}</span>
          </>
        )}
      </div>

      <p className={cx('net-hint', explored && 'net-hint--done')}>
        <span aria-hidden="true" className="dot dot--pulse" />
        Hover the nodes · click to explore
      </p>
    </div>
  )
}

import type { Chunk } from './knowledge'

/**
 * Lexical retrieval with BM25: scores each chunk by how many of the
 * question's terms it contains, weighted by how rare each term is across
 * all chunks and normalised for chunk length. With ~35 short chunks this
 * needs no embedding model or second API key, and it's deterministic, so it
 * can be tested exactly. Swap `search` for a vector search later without
 * touching the route or the prompt.
 */

const STOPWORDS = new Set([
  'a', 'about', 'also', 'an', 'and', 'any', 'anyone', 'anything', 'are', 'as', 'at', 'be', 'by', 'can', 'did', 'do',
  'does', 'everything', 'for', 'from', 'get', 'give', 'got', 'just', 'know', 'like', 'many', 'more', 'most', 'much',
  'some', 'something', 'very',
  'has', 'have', 'he', 'her', 'his', 'how', 'i', 'in', 'is', 'it', 'its', 'me', 'my', 'of', 'on', 'or', 'she',
  'sidd', 'siddheshwar', 'chirkute', 'so', 'tell', 'that', 'the', 'their', 'them', 'there', 'they', 'this', 'to',
  'was', 'what', 'when', 'where', 'which', 'who', 'why', 'will', 'with', 'would', 'you', 'your',
])

/** Lower-cases, splits on anything that isn't a letter or digit, drops stopwords, and strips plural/verb endings. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t))
    .map(stem)
}

/**
 * A deliberately tiny stemmer: enough that "LLMs"/"LLM", "deployed"/"deploy",
 * "accurate"/"accuracy" and "estimate"/"estimated" match. Inflections come
 * off first, then a few long derivational endings.
 */
export function stem(term: string): string {
  let t = term
  if (t.length > 5 && t.endsWith('ing')) t = t.slice(0, -3)
  else if (t.length > 4 && t.endsWith('ed')) t = t.slice(0, -2)
  else if (t.length > 4 && t.endsWith('es')) t = t.slice(0, -2)
  else if (t.length > 3 && t.endsWith('s') && !t.endsWith('ss')) t = t.slice(0, -1)

  if (t.length > 6 && (t.endsWith('ate') || t.endsWith('acy'))) return t.slice(0, -3)
  if (t.length > 6 && t.endsWith('at')) return t.slice(0, -2)     // "estimat(ed)" → "estim"
  return t
}

/**
 * Query expansion for the few words a recruiter uses that the site's content
 * doesn't: each stemmed question term adds the stemmed terms the content uses
 * for the same idea. Found by the retrieval evaluation (retrieval-eval.test.ts),
 * and kept small and specific so off-topic questions still match nothing.
 */
const SYNONYMS: Readonly<Record<string, readonly string[]>> = {
  database: ['mongodb'],            // "database" → MongoDB
  databas:  ['mongodb'],            // "databases"
  db:       ['mongodb'],
  mobile:   ['native'],             // "mobile apps" → React Native
  hobby:    ['hobbi'],              // "hobby" → "hobbies"
  relocation: ['site', 'remote'],   // "relocation" → on-site / remote
  reloc:    ['site', 'remote'],     // "relocate", "relocating"
  move:     ['site', 'remote'],
  payment:  ['pay', 'upi'],         // "payments" → "pay by UPI"
}

/** The question's distinct terms plus their expansions. */
export function expandQuery(question: string): string[] {
  const terms = tokenize(question)
  return [...new Set(terms.flatMap(t => [t, ...(SYNONYMS[t] ?? [])]))]
}

export interface ScoredChunk {
  chunk: Chunk
  score: number
}

export interface Index {
  search(question: string, limit?: number): ScoredChunk[]
}

const K1 = 1.2
const B = 0.75
/** Title words count double: a chunk titled "Skills: Backend" is about backend. */
const TITLE_WEIGHT = 2
/**
 * Title coverage (a light BM25F): added in proportion to how much of a
 * chunk's title the question covers. "What is Signal?" covers half of
 * "Project: Signal" but a quarter of "Signal case study: Results", so the
 * overview wins. Weight chosen by sweeping 0–4 on the retrieval evaluation:
 * 0.75 gave the best hit@1 and MRR with full recall; heavier weights let
 * section words ("How it works") outrank real matches ("remote work").
 */
const TITLE_COVERAGE = 0.75

/** Builds a BM25 index over the chunks once; `search` is then cheap per question. */
export function buildIndex(chunks: readonly Chunk[]): Index {
  const docs = chunks.map(chunk => {
    /* "case study" stays in: it dilutes section titles, which is what lets an overview win a bare "What is Signal?" */
    const titleTerms = new Set(tokenize(chunk.title))
    const terms = [...tokenize(chunk.text), ...Array.from({ length: TITLE_WEIGHT }, () => [...titleTerms]).flat()]
    const tf = new Map<string, number>()
    for (const t of terms) tf.set(t, (tf.get(t) ?? 0) + 1)
    return { chunk, tf, length: terms.length, titleTerms }
  })
  const avgLength = docs.reduce((sum, d) => sum + d.length, 0) / Math.max(docs.length, 1)
  const df = new Map<string, number>()
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) ?? 0) + 1)
  const idf = (t: string) => {
    const n = df.get(t) ?? 0
    return Math.log(1 + (docs.length - n + 0.5) / (n + 0.5))
  }

  return {
    search(question, limit = 4) {
      const terms = expandQuery(question)
      if (terms.length === 0) return []
      return docs
        .map(d => {
          let score = 0
          for (const t of terms) {
            const f = d.tf.get(t)
            if (!f) continue
            score += idf(t) * (f * (K1 + 1)) / (f + K1 * (1 - B + B * (d.length / avgLength)))
          }
          if (score > 0 && d.titleTerms.size > 0) {
            const covered = terms.filter(t => d.titleTerms.has(t)).length
            score += TITLE_COVERAGE * (covered / d.titleTerms.size)
          }
          return { chunk: d.chunk, score }
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
    },
  }
}

/**
 * Below this best score the question doesn't match the site's content, so
 * the route declines without calling the model (saves the free quota).
 * Tuned on real questions: relevant ones score from about 1.7 up, while
 * off-topic ones (weather, poems, greetings) match nothing at all.
 */
export const MIN_RELEVANCE = 1.5

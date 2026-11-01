// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { buildKnowledge } from './knowledge'
import { buildIndex, MIN_RELEVANCE } from './retrieve'

/**
 * Retrieval evaluation: labelled questions a recruiter might ask, each with
 * the passages that can answer it. The route sends the top CONTEXT passages
 * to the model, so recall@CONTEXT is the number that decides whether an
 * answer is possible at all; hit@1 and MRR say how cleanly it ranks.
 *
 *   npm run eval:ask    prints the per-question table
 */
const CONTEXT = 4

const LABELLED: readonly [question: string, answers: readonly string[]][] = [
  ['What has Sidd built with LLMs?',           ['project-signal', 'signal-how', 'signal-built', 'skills-ai-ml']],
  ['How accurate is AutoValue?',               ['autovalue-results', 'project-autovalue']],
  ['How does Seatly estimate wait times?',     ['seatly-how', 'project-seatly']],
  ['Is he open to remote work?',               ['availability']],
  ['Where has he worked?',                     ['job-0', 'job-1']],
  ['What backend skills does he have?',        ['skills-backend']],
  ['Does he know React?',                      ['skills-frontend']],
  ['Has he deployed anything?',                ['autovalue-production', 'project-autovalue']],
  ['How can I contact him?',                   ['availability']],
  ['Tell me about his education',              ['education']],
  ['What did he do at TTn Garage?',            ['job-0']],
  ['What is Signal?',                          ['project-signal']],
  ['Which database does he use?',              ['skills-backend']],
  ['What would he improve in Seatly next?',    ['seatly-next']],
  ['How is AutoValue deployed?',               ['autovalue-production']],
  ['Does Signal use paid APIs?',               ['project-signal', 'signal-decisions', 'signal-results', 'signal-problem']],
  ['Where is he based?',                       ['profile']],
  ['What are his hobbies?',                    ['story']],
  ['How many unit tests does Seatly have?',    ['seatly-results', 'project-seatly']],
  ['Which algorithm does AutoValue use?',      ['project-autovalue', 'autovalue-decisions', 'autovalue-how']],
  ['Is he available for relocation?',          ['availability']],
  ['What was his first internship?',           ['job-1']],
  ['How does Seatly handle payments?',         ['project-seatly', 'seatly-built', 'seatly-how']],
  ['Can he build mobile apps?',                ['skills-frontend']],
  ['What is he learning right now?',           ['story']],
  ['How does Signal score credibility?',       ['signal-how', 'signal-built', 'project-signal', 'signal-results']],
]

const OFF_TOPIC = ['What is the weather in Paris?', 'Write me a poem about cats', 'hi', '???', 'Who won the cricket world cup?']

const index = buildIndex(buildKnowledge())

const results = LABELLED.map(([question, answers]) => {
  const ranked = index.search(question, 10)
  const rank = ranked.findIndex(r => answers.includes(r.chunk.id)) + 1   // 0 = not found
  return { question, rank, top: ranked[0]?.chunk.id ?? '—', score: ranked[0]?.score ?? 0 }
})
const recall = results.filter(r => r.rank > 0 && r.rank <= CONTEXT).length / results.length
const hitAt1 = results.filter(r => r.rank === 1).length / results.length
const mrr = results.reduce((sum, r) => sum + (r.rank ? 1 / r.rank : 0), 0) / results.length

describe('retrieval evaluation', () => {
  if (process.env.EVAL_REPORT) {
    console.table(results.map(r => ({ ...r, score: Number(r.score.toFixed(2)) })))
    console.log(`recall@${CONTEXT} ${(recall * 100).toFixed(0)}%   hit@1 ${(hitAt1 * 100).toFixed(0)}%   MRR ${mrr.toFixed(3)}`)
  }

  it(`puts an answering passage in the model's context (recall@${CONTEXT}) for every labelled question`, () => {
    expect(results.filter(r => r.rank === 0 || r.rank > CONTEXT).map(r => r.question)).toEqual([])
  })

  /* Measured 2026-11-01: recall@4 100%, hit@1 81%, MRR 0.897 (baseline before
     query expansion and title coverage: 73%, 62%, 0.679). The floors sit just
     under the measured values, so a regression fails but noise doesn't. */
  it('ranks an answering passage first for at least 80% of questions', () => {
    expect(hitAt1).toBeGreaterThanOrEqual(0.8)
  })

  it('keeps mean reciprocal rank at 0.85 or better', () => {
    expect(mrr).toBeGreaterThanOrEqual(0.85)
  })

  it('clears the relevance bar for every labelled question, so none is wrongly declined', () => {
    expect(results.filter(r => r.score < MIN_RELEVANCE).map(r => r.question)).toEqual([])
  })

  it.each(OFF_TOPIC)('declines off-topic %j (no passage clears the bar)', question => {
    expect(index.search(question, 1)[0]?.score ?? 0).toBeLessThan(MIN_RELEVANCE)
  })
})

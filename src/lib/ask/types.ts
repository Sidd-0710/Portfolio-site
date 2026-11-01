/** One source passage behind an answer; shared by the /api/ask route and the chat UI. */
export interface AskSource {
  /** Matches the [n] citations in the answer. */
  n: number
  title: string
  /** Site link to the passage (e.g. /projects/seatly#how). */
  href: string
}

/** Response header carrying the sources as URI-encoded JSON (AskSource[]). */
export const SOURCES_HEADER = 'X-Ask-Sources'

/** Response header saying whether the answer came from the answer cache: "hit" or "miss". */
export const CACHE_HEADER = 'X-Ask-Cache'

/**
 * Case-study content for /projects/<slug>, one entry per project in
 * content/projects.ts. Every fact comes from the project's README or code:
 *   AutoValue  ~/Projects/Car-Price-Prediction/car-price-prediction/README.md
 *   Signal     github.com/Sidd-0710/Ai-News-Aggregator/README.md
 *   Seatly     ~/Restaurant Managemnt System Project /seatly/README.md, client/src/lib/logic.ts
 * Update the source first, then this file.
 */

export interface Metric {
  value: string
  label: string
}

export interface Shot {
  /** Path under /public. */
  src: string
  alt: string
  /** Intrinsic size of the file, for next/image. */
  width: number
  height: number
  /** desktop: browser frame, top crop · phone: device frame, top crop · figure: shown whole */
  frame: 'desktop' | 'phone' | 'figure'
  caption: string
}

export interface FlowStep {
  title: string
  detail: string
}

export interface Decision {
  title: string
  why: string
}

export interface CaseStudy {
  slug: string
  /** One sentence: what it does, for whom. */
  tagline: string
  /** Who did what. */
  role: string
  metrics: readonly Metric[]
  problem: readonly string[]
  built: readonly string[]
  shots: readonly Shot[]
  flow: readonly FlowStep[]
  /** Optional closer look at one mechanism, shown after the flow. */
  deepDive?: { title: string; paragraphs: readonly string[] }
  decisions: readonly Decision[]
  results: readonly string[]
  resultsFigure?: Shot
  production: readonly string[]
  next: readonly string[]
}

export const CASE_STUDIES: readonly CaseStudy[] = [
  {
    slug: 'autovalue',
    tagline: 'Estimates a used car’s resale price in India, and tells you how sure it is.',
    role: 'Solo project · data, modelling, API and website',
    metrics: [
      { value: '40,440', label: 'listings from 3 platforms' },
      { value: '9.8%',   label: 'typical error on unseen cars' },
      { value: 'R² 0.86', label: 'on a test set used once' },
      { value: '2.4 MB', label: 'model, chosen over a 110 MB one' },
    ],
    problem: [
      'Near-identical used cars in India are listed at very different prices, and a single number hides how uncertain any estimate is. I wanted a price a buyer or seller could actually use: one that knows the exact variant and the platform, and comes with an honest range.',
      'No single public dataset is both recent and variant-level, so the first problem was data. The project began from an open-source starter that trained a random forest on 301 rows; my earlier version used 4,340 listings and had a 14.8% typical error. This version rebuilt the dataset, the model, the API and the website.',
    ],
    built: [
      'An Estimate page: search any of 424 models, pick the exact variant, set year and kilometres, and the price updates live with its likely range and the typical error for that price band.',
      '“Sell now or later?” (value over the next five years), “What moves the price” (variant, fuel, gearbox, owners, platform) and the closest real listings.',
      'Market and Model pages: the 2025–26 market in charts, and the model’s test scores explained in plain English. Every chart has a table view and works from the keyboard.',
      'A FastAPI API with Pydantic validation (single, batch and full-analysis endpoints) that forgives messy input: “swift”, “Maruti Swift” and “Maruti Suzuki Swift” all work, and a misspelling returns suggestions.',
    ],
    shots: [
      { src: '/projects/autovalue/estimate.png', alt: 'AutoValue estimate page showing a predicted price, its range and price drivers', width: 1440, height: 1600, frame: 'desktop', caption: 'Estimate page: a live price, its range, and what moves it' },
      { src: '/projects/autovalue/model.png', alt: 'AutoValue model page with test scores and an algorithm comparison chart', width: 1440, height: 2225, frame: 'desktop', caption: 'Model page: test scores and the 9-algorithm comparison' },
      { src: '/projects/autovalue/phone.png', alt: 'AutoValue on a phone with a price bar pinned to the bottom', width: 390, height: 1700, frame: 'phone', caption: 'On phones, the current estimate stays pinned at the bottom' },
    ],
    flow: [
      { title: '4 public datasets', detail: 'CarDekho 2025 and 2026, Cars24, Spinny: 40,440 listings' },
      { title: 'Merge and clean', detail: 'Match brands, models and variants; drop 2,826 duplicates before splitting → 36,919' },
      { title: 'Features', detail: 'Age, km, owners, brand, model, variant (exact level + words), fuel, gearbox, platform' },
      { title: 'Train and choose', detail: '9 algorithms by 5-fold CV → tune the best 3 → most accurate under 40 MB' },
      { title: 'Calibrate the range', detail: '80% range from past errors, checked on the test set' },
      { title: 'Serve', detail: 'One FastAPI app: the API, interactive docs and the hand-built website' },
    ],
    decisions: [
      { title: 'Remove duplicates before splitting', why: 'The same car in both training and test data inflates the score, so 2,826 duplicate listings were removed before the split, not after.' },
      { title: 'Predict log(price)', why: 'Prices are heavily skewed and depreciation is percentage-like, so the model learns proportions instead of rupees.' },
      { title: 'Variant as a price level and as words', why: 'The exact trim is target-encoded, and its words (“amt”, “plus”, “turbo”) let rare variants borrow from similar ones. Together they cut the typical error from 11.2% to 10.4%.' },
      { title: 'Most accurate model under 40 MB', why: 'Extra Trees was about 2% more accurate but 74–110 MB. The tuned Hist Gradient Boosting is 2.4 MB, loads instantly, and has monotonic constraints: price never rises with age, kilometres or owners.' },
      { title: 'One pipeline object', why: 'Encoding, scaling and the model are saved together, so training and serving can’t disagree.' },
      { title: 'A range, not just a number', why: 'A single price sounds more certain than it is. The 80% range is built from past errors and covers 81% of unseen cars.' },
    ],
    results: [
      'Typical error 9.8%, mean error 1.14 lakh and R² 0.86 on 7,384 unseen cars. The test set was used once, at the end; algorithms were compared by cross-validation.',
      'Down from a 14.8% typical error in my earlier version (4,340 listings, no variants).',
      'Accuracy differs by car: about 8% for ₹5–20 lakh cars and 7.5% for cars from 2023 on, but 16.6% for electric cars, so the app warns on those.',
      '94 automated tests cover the data, predictor, analysis, API and website, plus guards on model quality.',
    ],
    resultsFigure: { src: '/projects/autovalue/model-comparison.png', alt: 'Bar chart comparing the cross-validated error of 9 algorithms against a median-price baseline', width: 1650, height: 690, frame: 'figure', caption: 'Cross-validated error of every algorithm tried, against a median-price baseline' },
    production: [
      'Deployed on Render’s free tier: one FastAPI process serves the API, the interactive docs at /docs, and the website.',
      'The 2.4 MB model ships with the code, so nothing is downloaded at start-up. The free tier sleeps when idle, so the first visit after a quiet spell takes about a minute.',
      'Rebuilding everything takes two commands: build the dataset, then retrain (about 20 minutes, or 3 without tuning).',
    ],
    next: [
      'Use sale prices, not asking prices, if a reliable source appears: the final negotiated price is usually lower.',
      'Retrain on a schedule as prices drift; the data is a 2025–26 snapshot.',
      'Add condition data (accidents, servicing, tyres), the biggest signal the model can’t see.',
      'Improve luxury and electric cars, where the 80% range held only about 2 times in 3.',
    ],
  },
  {
    slug: 'signal',
    tagline: 'Live news from 29 sources, summarized and translated by an AI model that runs on your own machine.',
    role: 'Solo project · backend, frontend and AI integration',
    metrics: [
      { value: '29',     label: 'RSS feeds across 8 categories' },
      { value: '6-line', label: 'AI summaries on demand' },
      { value: '0',      label: 'paid APIs or keys' },
      { value: '0–100',  label: 'credibility score per article' },
    ],
    problem: [
      'Most news apps paywall you, rate-limit you, or bury the story under ads. I wanted a reader that pulls straight from publishers, condenses any article into a few lines, and works in Hindi.',
      'The constraint I set: no paid AI API. No key to manage, no cost per request, and no reading data sent to a third-party AI provider.',
    ],
    built: [
      'A live feed from BBC, The Guardian, Ars Technica, NASA, The Verge, Wired, The Hindu, ESPNcricinfo and more, with category filters and search.',
      '6-line AI summaries of any article, one-click Hindi translation (cached, so repeats are instant) and text-to-speech in English or Hindi.',
      'A credibility score for every article (0–100) from source reputation, corroboration across outlets, and recency.',
      '“Compare sources”: other outlets’ coverage of the same story, matched by title and description similarity rather than keywords alone.',
      'A Trending tab built from your own reading history, which never leaves your device.',
    ],
    shots: [
      { src: '/projects/signal/feed.png', alt: 'Signal article feed with category tabs, credibility scores and thumbnails', width: 1440, height: 1600, frame: 'desktop', caption: 'The feed: categories, credibility scores and thumbnails' },
      { src: '/projects/signal/summary-modal.png', alt: 'Signal summary modal showing a six-line AI summary with language and listen controls', width: 1440, height: 1600, frame: 'desktop', caption: 'A 6-line summary from the local model, in English or Hindi' },
    ],
    flow: [
      { title: '29 RSS feeds', detail: 'Public publisher feeds across 8 categories' },
      { title: 'Express backend', detail: 'Fetch, dedupe by title, score credibility, find Open Graph images' },
      { title: '60-second cache', detail: 'In-flight dedup; one failing feed never breaks the fetch' },
      { title: 'React frontend', detail: 'Search, filter, compare sources, listen' },
      { title: 'Ollama, on demand', detail: '/api/summarize and /api/translate call a local model (mistral 7B or qwen2.5:1.5b)' },
    ],
    decisions: [
      { title: 'A local model instead of a paid API', why: 'No key, no per-request cost, nothing sent to a third party. The trade-off is memory, so the model is configurable: mistral 7B for quality, qwen2.5:1.5b for laptops with little free RAM.' },
      { title: 'Cache with in-flight dedup', why: 'A burst of page loads shares one fetch instead of hitting 29 feeds again for every visitor.' },
      { title: 'Failures stay local', why: 'A dead feed is logged and skipped. If every feed fails, bundled mock data keeps the app usable instead of showing a blank screen.' },
      { title: 'Images never break', why: 'Thumbnails come from RSS media tags first, then Open Graph scraping, then a generated placeholder.' },
      { title: 'Errors you can act on', why: 'The backend surfaces the real Ollama error (for example, not enough memory for the model) instead of a bare 500, and /api/health reports whether Ollama is reachable.' },
    ],
    results: [
      'With qwen2.5:1.5b, a laptop produces a 6-line summary and a Hindi translation in a few seconds, using well under 1.5 GB of RAM.',
      'Repeat summaries and translations of the same article are served instantly from cache.',
      'The app keeps working through individual feed outages, and falls back to bundled data if every feed is down.',
    ],
    production: [
      'Runs locally today: the AI features need Ollama on the same machine, so there’s no public demo yet.',
      'Planned public demo: backend on Render, frontend on Vercel, and a hosted model on Groq’s free tier in place of Ollama behind a provider switch, with rate limits and a “waking up” state for the free backend.',
    ],
    next: [
      'Summarize the full article: by default, summaries work from the first 240 characters of each feed item’s text.',
      'Store articles and summaries in a database; today they live in memory and reset on restart.',
      'Run summaries in parallel instead of one model call at a time.',
      'Ship the hosted demo above, so recruiters can try it without installing anything.',
    ],
  },
  {
    slug: 'seatly',
    tagline: 'Shows walk-in diners an honest wait time before they decide to enter, then handles ordering and payment at the table.',
    role: 'Team of 4 · lead developer: Figma design and every screen',
    metrics: [
      { value: '26',      label: 'screens, designed in Figma first' },
      { value: '3',       label: 'roles: door, table and owner' },
      { value: '38 + 33', label: 'unit tests + end-to-end checks' },
      { value: '1',       label: 'reducer for all state' },
    ],
    problem: [
      'At a busy restaurant, a walk-in diner can’t tell whether the wait is 5 minutes or 45, and can’t see the menu before committing. None of the platforms we reviewed (Petpooja, Toast, Zomato, Swiggy Dineout) shows a live wait estimate at the door.',
      'On the owner’s side, the floor, the queue, orders, customers and stock usually live in different places. Seatly puts them on one dashboard.',
    ],
    built: [
      'At the door (scan the entrance QR): the predicted wait, parties ahead, tables in use, and the full menu.',
      'At the table (scan the table’s QR): browse the menu with photos, search and filters, order, track the order, generate the bill and pay by a real UPI QR for the exact amount.',
      'For the owner: a live floor of every table (occupied, cooling, reserved), the queue, orders, customers with visit history, a menu manager with photo upload, inventory, and a restock list that opens in WhatsApp.',
      'Printable entrance posters and table cards with QR codes, from the Tables & QR screen.',
    ],
    shots: [
      { src: '/projects/seatly/owner-floor.png', alt: 'Seatly owner dashboard showing a live floor of tables, the queue and today’s takings', width: 2880, height: 1800, frame: 'desktop', caption: 'The owner’s live floor: every table, the queue and today’s takings' },
      { src: '/projects/seatly/door.png', alt: 'Seatly door page on a phone showing a predicted wait of about 23 minutes', width: 780, height: 1688, frame: 'phone', caption: 'At the door: the wait before you walk in' },
      { src: '/projects/seatly/table-menu.png', alt: 'Seatly table menu on a phone with dish photos and category filters', width: 780, height: 1688, frame: 'phone', caption: 'At the table: order from the menu by QR' },
    ],
    flow: [
      { title: 'Figma first', detail: '23 frames designed; 21 built, plus 5 owner screens added later' },
      { title: 'React + TypeScript', detail: '26 screens across three roles, with React Router' },
      { title: 'One reducer', detail: 'Every change is an action: seat, order, bill, pay, restock' },
      { title: 'Live across tabs', detail: 'State saved to localStorage and broadcast with the storage event' },
      { title: 'Wait formula', detail: 'Phase 1 rule-based model from table states, dining time and kitchen load' },
      { title: 'Vercel', detail: 'Static deploy; data shapes match the planned backend API' },
    ],
    deepDive: {
      title: 'How the wait estimate works',
      paragraphs: [
        'For every table that isn’t reserved, the formula estimates the minutes until it frees up: 0 if it’s free, the time left if it’s cooling down after a party, and otherwise the remaining average dining time plus the cleaning time.',
        'The average dining time stretches by 5% for every in-progress order above the kitchen-busy threshold, so a slammed kitchen means longer waits. The party at queue position p gets the p-th soonest table, plus one full turnover for every round of tables ahead of it.',
        'It’s deliberately simple and transparent. Every paid bill is logged as a visit (party size, minutes waited, minutes at the table), which is the data a learned model needs later.',
      ],
    },
    decisions: [
      { title: 'A formula before machine learning', why: 'There’s no real restaurant data to train on yet. Phase 1 is a transparent formula; a pilot will log real visits, and only then will learned models be compared against it.' },
      { title: 'No kitchen screen (yet)', why: 'From what the team saw in tier-2 and tier-3 kitchens, chefs are unlikely to tap a screen for every ticket. Rather than build something likely to go unused, the plan is auto-printed kitchen tickets, to be tested in owner interviews.' },
      { title: 'Mock data in the API’s shape', why: 'The seed data and reducer actions mirror the planned Express and MongoDB API, so the screens shouldn’t need rewriting when the backend arrives.' },
      { title: 'Random table tokens', why: 'A table’s QR holds a random token, never the table number, and orders are only accepted while that table is seated.' },
      { title: 'Cooling time between parties', why: 'After payment a table “cools” for 10 minutes while the party leaves and the table is cleaned, and that time feeds straight into the wait estimate.' },
    ],
    results: [
      'Front-end prototype complete: 26 screens, live on Vercel with a seeded demo restaurant.',
      '38 unit tests on the reducer and logic (seating, orders, bills, cooling, guest matching, sign-in) and 33 end-to-end checks in real Chrome: the whole diner journey, and the owner seeing that payment arrive.',
      'Backed by a research paper and a 30-work literature survey written by the team.',
    ],
    production: [
      'A static React build on Vercel. All data lives in the visitor’s browser, so each visitor gets their own demo restaurant, and “Reset demo data” starts over.',
      'The owner sign-in is a demo stand-in with the password in the code on purpose, not real security; Firebase Auth is planned with the backend.',
    ],
    next: [
      'The backend: an Express and MongoDB API with Firebase Auth and Socket.io, so the door, table and owner screens sync across devices.',
      'Joining the queue by phone (SMS or WhatsApp), and automatic kitchen-ticket printing.',
      'A single-restaurant pilot to log real visits, then learned wait-time models compared against the formula on held-out data.',
    ],
  },
]

/** Looks a case study up by slug; `undefined` for unknown slugs. */
export function findCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find(c => c.slug === slug)
}

/** The project's cover image for its home-page card: its case study's first desktop screenshot. */
export function coverFor(slug: string): Shot | undefined {
  return findCaseStudy(slug)?.shots.find(s => s.frame === 'desktop')
}

/** Up to two phone screenshots, shown beside the cover where a card has room. */
export function phoneShotsFor(slug: string): Shot[] {
  return (findCaseStudy(slug)?.shots ?? []).filter(s => s.frame === 'phone').slice(0, 2)
}

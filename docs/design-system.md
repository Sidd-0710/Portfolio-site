# Design system: "Ivory Press"

The visual language of the portfolio site (`site/`). History:

- **2026-10-10** "Ink & Signal": cobalt on warm paper.
- **2026-11-01** "Obsidian & Crimson": a black product-poster look.
- **2026-11-01** "Ivory Press" (current): an editorial system in three colours. Warm ivory paper, deep editorial blue ink and coral orange, with serif headlines like a well-made magazine.

Read this before adding a component or changing a colour.

- **Tokens:** [`site/src/styles/tokens.css`](../src/styles/tokens.css)
- **Component styles:** [`site/src/styles/components.css`](../src/styles/components.css)
- **Tailwind mapping:** the `@theme inline` block in [`site/src/app/globals.css`](../src/app/globals.css)
- **React primitives:** [`site/src/components/ui/`](../src/components/ui/)
- **Guards:** [`site/src/styles/design-system.test.ts`](../src/styles/design-system.test.ts)

## Assumptions

Each assumption sits behind a token or a prop, so changing it is a local edit.

| Assumption | Why | Where to change it |
|---|---|---|
| Three colours: Warm Ivory `#F6F1E7`, Deep Editorial Blue `#11244A`, Coral Orange `#E8572F` | Sidd's chosen palette. Ivory is the paper, blue is the ink, coral is the one accent per view | Brand primitives, tier 1 of `tokens.css` |
| Ivory is the default theme; the toggle offers a night-blue dark theme | The palette is built around paper | `ThemeProvider.tsx` (`defaultTheme`) |
| The audience is recruiters and engineers at product companies, reading on laptops and phones | From the portfolio brief | — |
| The contact panel, the skills network and the case-study covers are deep blue in both themes | Blue plates give the paper page rhythm, and the WebGL network needs a dark field | `--surface-inverse` and `.on-inverse` (shares the `.dark` roles in `tokens.css`) |
| No component library: Tailwind v4 utilities plus a small set of CSS component classes | A runtime CSS-in-JS library would add weight for no gain | — |
| Fonts are Newsreader (serif, optical sizes, with italic), Inter and JetBrains Mono, self-hosted by `next/font` | An editorial serif is what makes ivory and blue read as "publication" rather than "app" | `layout.tsx` and the `--font-*` tokens |
| 3D comes from CSS (transforms, shadows, gradients). The one WebGL scene is the skills network, in its own panel | Kept out of the hero so nothing overlaps the portrait | The `3c. 3D` tokens |

## UI surface inventory

| Surface | Where | Components |
|---|---|---|
| Navigation | Every page | Full-width bar: a round blue "SC" seal (italic serif initials, coral full stop), the name in serif with the role as a label, a hairline rail of numbered links (italic coral numbers) whose highlight slides to the hovered or current section, "● Open to work" (xl), theme toggle, Resume. Transparent over a hero, in ink over the ivory home cover and in ivory over the blue case-study covers; a slim frosted-paper bar once scrolled, with a coral reading-progress line. Mobile menu (Modal) as a serif table of contents |
| Hero | Home | The cover. Ivory paper; Sidd's portrait in natural colour in front of a deep-blue disc, the hair breaking out of the disc's top and the shoulders cropped by the hero's lower edge; a thin coral orbit with a satellite passing behind the head. Keyword column with a coral rule, serif name with the surname in italic coral, a serif standfirst, one coral button and an ink outline button, "Build · Ship · Learn" strip |
| Project showcase | Home › Projects | Tilt cards on paper, each with a deep-blue cover mount warmed with coral; status pill, serif project title (40px, one step below the 60px section title), chips, coral-rule bullets, button pair. The odd wide card composes its desktop shot with two phone screens on desktop |
| Timeline | Home › Experience | Coral-lit rail and nodes, paper cards |
| Capability grid | Home › Skills | Heading beside a deep-blue plate holding the interactive WebGL network (desktop only); icon tiles, paper cards, chips |
| Profile and stats | Home › About | Prose, serif stat figures on paper tiles (tilt), hobby card with line icons in coral tiles, availability pill |
| Contact panel | Home › Contact | Deep-blue inverse card with a coral dawn in one corner, glass link rows |
| Case study | `/projects/[slug]` | Deep-blue cover (serif title, serif standfirst, stat tiles), then paper body with a sticky contents list, screenshot frames with italic serif captions, and a flow diagram numbered in italic serif |
| Footer | All pages | Seal and serif name, "© year · Full-stack developer · India", quick links, back to top |
| 404 | Missing pages | Type roles and buttons only |

## Principles

1. **Paper, ink, one accent.** Ivory is the page, blue is the type, and coral appears in measured places: the italic word in each headline, the rules and numbers in labels, bullets, the one primary action, and the hero's orbit.
2. **One light source.** Raised surfaces are paper held up to the light: a touch brighter than the page, a lit top edge (`--edge-light`) and a blue-tinted shadow (`--elev-*`). Shadows are never black.
3. **Depth carries meaning.** Canvas sits at 0, cards at 2, hovered or focused cards at 3, modals at 4. Nothing is raised for decoration only.
4. **Restraint in motion.** Tilt is 4° at most, lift is 3px, nothing bounces. Everything that moves is a transform or opacity.
5. **Tokens or nothing, enforced.** Every value comes from a scale in `tokens.css`, and `design-system.test.ts` fails the build's test run on any of these:
   - a raw colour, font size, letter-spacing or font width in the component styles (only `#000` inside masks is allowed: an alpha map, not a colour);
   - a `var(--token)` that doesn't exist;
   - a text colour pair below WCAG AA, in either theme, on any of the four surfaces;
   - **a broken tier boundary:** a raw colour below tier 1 in `tokens.css`, or a component using a brand primitive (`--coral-500`) where it should use a role (`--accent-fill`). Channel triplets (`--coral-rgb`) stay allowed: they're how tints are written;
   - **palette drift:** code that can't read CSS (the share cards, the WebGL network, the browser theme colour) imports the palette from `styles/palette.ts`, the test checks every value there against its token, and no other source file may write a hex colour;
   - **a dead token:** every token must be read somewhere, by CSS, a Tailwind utility (`tracking-wide`, `rounded-pill`) or code.

   Each guard was proven by planting a violation and watching it fail. A rebrand is now one edit in tier 1 plus the matching line in `palette.ts`, and the tests point at anything missed.

## Colour

Three tiers: **brand primitives** (raw hex), **semantic roles** (what components use, remapped per theme), and **contexts** (`.on-inverse` gives the always-blue panels the night roles).

| Role | Light ("ivory", default) | Dark ("night") | Use |
|---|---|---|---|
| `--surface-canvas` | `#F6F1E7` Warm Ivory | `#0B1730` | Page background |
| `--surface-sunken` | `#EEE6D6` | `#0F1D3A` | Alternate sections (fading hairlines top and bottom, faint coral warmth top-right), wells |
| `--surface-raised` | `#FFFDF8` | `#142445` | Cards, inputs |
| `--surface-overlay` | `#FFFDF8` | `#1A2D50` | Modals and the mobile menu |
| `--surface-inverse` | `#11244A` Deep Editorial Blue | same | Contact panel, skills plate, case-study covers, project cover mounts, the nav seal |
| `--on-inverse` | ivory `#F4EEE3` | same | Text set directly on `--surface-inverse` (the seal's initials) |
| `--device-frame` | night blue `#0B1730` | same | Bezels around phone screenshots |
| `--fg` / `-muted` / `-subtle` | blue ink `#11244A` / `#2E3A52` / `#525C74` | ivory `#F4EEE3` / `#C9C3B6` / `#A6ADBE` | Text tiers. Worst case, on sunken or overlay: 13.6 / 9.2 / 5.4 : 1 light, 15.4 / 7.8 / 6.1 : 1 dark |
| `--accent` / `--accent-hover` | `#AE3F1D` (4.8 : 1 on sunken) / `#8F3317` | `#FF8160` (5.6 : 1 on overlay) / `#FFA287` | Coral for **small** text: eyebrow numbers, company names, links |
| `--accent-fill` | `#E8572F` Coral Orange | same | Fills, rules, dots, and coral **large** type (`.title-accent`, ≥ 24px: 3.2 : 1 on ivory passes the 3 : 1 large-text rule; 4.95 : 1 on night) |
| `--on-accent` | night blue `#0B1730` | same | Text on coral buttons (4.95 : 1) |
| `--grad-edge` | coral → ink → coral | coral → ivory → coral | Decoration only: hairline around a hovered card |
| `--disc` | blue, lit upper-left | a lighter blue | The hero portrait's disc |
| `--live` | coral | coral | "● LIVE" status dot |
| `--danger` | `#AE3F1D` | `#FF8160` | Form errors and the assistant's error state |
| `--border-subtle` / `--border` / `--border-strong` | ink 9 / 16 / 30% | ivory 9 / 15 / 26% | Hairlines, chips, controls, hover |

Every text pair is checked against WCAG AA by the test suite. The key rule: Coral Orange is only 3.2 : 1 on ivory, so it never sets small text there; small coral text uses `--accent`.

**Why it reads as premium:** the restraint of print. A warm paper instead of white, one ink, one accent, and type doing most of the work.

## Dark mode ("night")

The dark theme is the same publication printed in negative: night-blue paper, ivory ink, the same coral. Depth comes from lightness, so the surfaces climb a ladder: page `#0B1730` → sunken `#0F1D3A` → card `#142445` → overlay `#1A2D50`.

Dark-only material details:
- **Sheen** (`--sheen`): a 4.5% white wash across the top of raised surfaces.
- **Calmer screenshots** (`--media-filter`): bright app screenshots are dimmed to 88% so they don't glare; hovering a project or shot restores them.
- **A lighter disc** (`--disc`): keeps the portrait's disc visible against the night page.

**Paper grain** (`--grain`, desktop only) runs in both themes: a fixed noise layer blended with *overlay*, which adds texture without shifting the average colour. Measured: the ivory page renders `#F7F3EA` against its `#F6F1E7` token.

**When a visitor asks for more contrast** (`prefers-contrast: more`), grain, sheen and dimming switch off, and borders roughly double in both themes.

## Typography

| Role | Token | Size (360 → 1440px) | Face |
|---|---|---|---|
| Display (hero name, case-study title) | `--type-display` | 42 → 96px, leading 0.96 | Newsreader 450 |
| Section title | `--type-h2` | 34 → 60px, leading 1.04, one italic coral word (`highlight` prop → `.title-accent`) | Newsreader 450 |
| Sub-title (project names, case-study sections, mobile menu) | `--type-h2-sub` | 26 → 40px | Newsreader 450 |
| Stat figure | `--type-figure` (`.stat-figure`) | 32 → 46px | Newsreader 450 |
| Card title, standfirst | `--type-h3` | 20 → 24px | Newsreader 500 (titles), 400 (standfirst) |
| Lead | `--type-lead` | 18 → 22px, leading 1.6 | Inter |
| Body / small / xs | `--type-body` / `-sm` / `-xs` | 16 / 15 / 13px | Inter |
| Caption | `--type-caption` | 12px | Inter (buttons) |
| Label | `--type-label` | 11px, uppercase | Inter 600 |
| Micro | `--type-micro` | 10px, uppercase | Inter (hero tags, nav role, hints) |
| Tech tags | `--type-xs` | 13px | JetBrains Mono |

**Two type roles, declared once in `components.css`:**
- **"headline":** serif, sentence case, weight 500, slightly tightened. Used by section, card, hero, case-study and modal titles, the nav name, the menu, stat figures and the footer name.
- **"label":** Inter, uppercase, weight 600, tracked 0.18em. Used by eyebrows, pills, buttons, nav and footer links, hints and back links.

Each component overrides only what differs.

**Headline weights** get lighter as type grows, like a masthead: display and section titles at 450 (`--weight-display`), card titles at 500 (`--weight-title`). Newsreader's optical-size axis switches to its display cut automatically at large sizes.

**Tracking** has five steps:
- `--tracking-tight` −0.022em: display and section titles;
- `--tracking-snug` −0.01em: card and modal titles;
- `--tracking-wide` 0.06em: mono labels;
- `--tracking-wider` 0.12em: buttons, nav and footer links;
- `--tracking-widest` 0.18em: eyebrows, pills, micro labels.

**Editorial details:**
- **Eyebrows** read "—— *01* PROJECTS": a coral rule, an italic serif number, a tracked label.
- **The standfirst** (`.standfirst`): a serif line under a big headline.
- **Bullets:** short coral rules.
- **Flow-diagram steps** are numbered in italic serif, like footnotes.
- **Screenshot captions** are italic serif.

## Glow and elevation scales

Coral light comes from one scale. It is lighter on paper than it was on black: on ivory, a glow reads as a warm shadow, not neon.

| Token | Used for |
|---|---|
| `--glow-halo` | 3px coral ring: status dots, focused fields, the orbit satellite |
| `--glow-sm` | Coral button at rest, the seal on hover, the satellite, timeline nodes |
| `--glow-md` | Hovered coral button, phone frames on the Seatly stage |

Neutral depth uses `--elev-1…4`: blue-tinted in the light theme, deep night shadows in the dark. `--edge-light` gives every raised surface its lit top edge.

## Spacing and layout

- **Base unit:** 4px (Tailwind's spacing scale).
- **Container:** `--container` 72rem, with a fluid `--gutter` of 16–40px.
- **Section rhythm:** `--section-space` of 80–144px, fluid: generous, like a magazine spread. Sections alternate ivory and a deeper paper, separated by fading hairlines instead of hard borders.
- **Grid:** one column on phones. Two-column card grids from 1024px, four skill tiles from 1024px (two from 640px). About uses a 7 + 5 split of a 12-column grid.
- **Breakpoints:** Tailwind's `sm` 640, `md` 768 (nav rail appears), `lg` 1024 (multi-column layouts, the cropped cover portrait, the Seatly device stage, the WebGL skills panel).
- **Radii:** tighter than before, print rather than plastic. `--radius-xs` 3 · `-sm` 6 inputs · `-md` 8 icon tiles and covers · `-lg` 12 cards · `-xl` 18 panels and modals · `-device` 22 phone frames · `-pill` for buttons, badges and the nav rail. The nav seal and icon-only buttons are circles.

## Iconography

One family, defined in [`ui/icons.tsx`](../src/components/ui/icons.tsx): a 24px grid, 1.75 stroke, round caps and joins. Outline glyphs come from **Lucide** (ISC); brand marks come from **Simple Icons** (CC0) and are filled. Icons are always `aria-hidden`; the control around an icon carries its name. Feature icons sit in an **icon tile**: a 40px rounded well with an accent tint and a lit edge, which gives them a physical seat.

## Imagery and illustration

Screenshots and the portrait follow these rules:

- **Project screenshots** go in a frame of radius 16, a 1px `--border-subtle` edge and `--elev-3`. On desktop, tilt the frame 6–8° on `rotateY`/`rotateX` inside `perspective(var(--perspective))` and let it settle flat on hover, using the same tokens as the cards. Serve them with `next/image` in AVIF/WebP, sized per breakpoint.
- **Portrait:** natural colour, a light contrast lift and a blue-tinted drop shadow. On desktop it's cropped by the hero's lower edge like a cover photo; on phones it fades into the paper where the text overlaps it.
- **Illustration:** Sidd's portrait (background removed on-device, natural colour) in front of a deep-blue disc with a thin coral orbit (hero), and the network motif (ivory skill nodes, coral project nodes) on the blue Skills plate. There's no stock art.

## 3D design language

Depth comes from five layered techniques, each with its own job:

| Technique | Tokens | Where | What it adds |
|---|---|---|---|
| Layered elevation | `--elev-1…4`, `--edge-light`, `--edge-shade` | Every card, button, nav, modal | Surfaces read as physical sheets lit from above |
| Sunken wells | `--well-inset` | Inputs, sunken cards | "You type here" is legible without labels |
| Glass | `--surface-glass`, `--glass-blur`, `--glass-saturate`, `--glass-edge` | Nav capsule, hero pill and buttons, contact rows | Floating layers that keep the context behind them |
| Pointer tilt and sheen | `--perspective`, `--tilt-max`, `--lift-hover`, `--spotlight` | Project cards and stat tiles (tilt); every interactive card (sheen) | Tactile response on the few elements worth exploring |
| Dimensional accents | The portrait breaking out of its disc, the coral orbit, the WebGL network | Hero and Skills plate | Real depth in two places only |

**Clarity guardrails:**

- Tilt never exceeds 4° (`--tilt-max`). Full-width cards use `tilt="subtle"` (`--tilt-max-subtle`, 2°), so their far edges travel about as far as a normal card's instead of twice as far.
- Tilt only follows a mouse or trackpad, never touch or keyboard; keyboard focus gets a border highlight instead.
- Text never moves under the pointer; only cards tilt.
- Glass is used only over busy or dark backdrops. On phones, and when the OS asks for reduced transparency, blur is turned off and glass becomes almost opaque.

**Performance:**

- Every animated property is `transform` or `opacity`, except the card sheen (a gradient on hover only).
- Pointer updates are batched per animation frame.
- The WebGL network loads only at ≥1024px, pauses when off-screen, and falls back to an SVG.
- No 3D library is used outside the Skills plate.

## Motion

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | 80ms | Press |
| `--dur-fast` | 140ms | Colour, button lift, tilt follow |
| `--dur-base` | 220ms | Shadows, modal fade |
| `--dur-slow` | 360ms | Card lift, nav state, modal swing |
| `--dur-reveal` | 640ms | Scroll reveals, hero entrance |
| `--ease-out` | `cubic-bezier(.22,1,.36,1)` | Default for things arriving |
| `--ease-standard` | `cubic-bezier(.2,0,0,1)` | Loops |

**Interaction states:**

- **Hover:** lift by 1px (buttons) or 3px (cards), and raise the elevation by one level.
- **Press:** sink by 1px, scale to 0.98, use an inset shadow and an 80ms duration.
- **Focus:** a 2px `--focus-ring` with a 3px offset. Cards also highlight their border while anything inside them has focus.
- **Disabled:** 50% opacity with a not-allowed cursor.

**Reduced motion:** the tokens collapse. Tilt, lift and press go to 0, durations go to 0ms, and looping animations stop. Colour feedback stays.

**Scroll reveals:** CSS transitions on `.reveal`, flipped by an IntersectionObserver. With JavaScript off, a `<noscript>` rule shows everything. The hero entrance animates position only, so the headline is readable on first paint.

## Components

### Button: [`ui/Button.tsx`](../src/components/ui/Button.tsx)

| Prop | Values | Notes |
|---|---|---|
| `variant` | `primary` · `solid` · `secondary` · `ghost` · `glass` | Primary: ink outline that fills with ink on hover (ivory outline on blue panels). Solid: coral with navy lettering. Secondary: raised surface. Ghost: text with a hover tint. Glass: frosted |
| `size` | `sm` 36px · `md` 44px · `lg` 52px | `md` and up meet the 44px touch target |
| `href` | string | Renders a link (`next/link` for internal URLs, `<a>` for external or download) |
| `iconOnly` | boolean | Square shape. The type system requires `aria-label` |
| `loading` | boolean | Shows a spinner and sets `disabled` + `aria-busy` |
| `leadingIcon`, `trailingIcon`, `block` | — | The trailing icon nudges 2px on hover |

Buttons are uppercase, tracked Inter pills. CTA hierarchy: one coral button per view (the hero's "See my work"); everything else is an ink outline, glass or ghost. The floating "Ask about my work" button is a deep-blue pill with a coral outline in both themes, so it's easy to find but never outranks the page's own call to action.

**Visual/a11y check:**

- Every variant meets 4.5 : 1 in light, dark and inverse contexts.
- The focus ring is visible on every surface.
- Enter and Space activate buttons; links don't respond to Space.
- An icon-only button announces its label.
- A loading button can't be activated twice.

### Card: [`ui/Card.tsx`](../src/components/ui/Card.tsx)

| Prop | Values | Notes |
|---|---|---|
| `as` | `div` · `article` · `li` · `section` · `a` | `a` makes the whole card a link (contact rows) |
| `variant` | `elevated` · `glass` · `outline` · `sunken` · `inverse` | Inverse applies `.on-inverse` to everything inside |
| `padding` | `none` · `sm` · `md` · `lg` | Fluid between 16 and 36px |
| `interactive` | boolean | Hover lift, pointer sheen, and a border highlight on focus-within |
| `tilt` | boolean | Implies `interactive`, and rotates toward the pointer (fine pointers, no reduced motion) |

**Visual/a11y check:**

- Content stays readable at full tilt.
- Nothing tilts on touch devices or with reduced motion.
- Keyboard focus inside a card highlights it.
- The page doesn't shift layout on hover (transforms only).

### Input: [`ui/Input.tsx`](../src/components/ui/Input.tsx)

Props: a required `label` (hide it visually with `hideLabel`), `hint`, `error`, `size` (`sm` 36, `md` 44, `lg` 52px), and `leadingIcon`, plus every native input attribute. The field is a sunken well. Focus turns the border accent-coloured and adds a soft 3px ring. An error sets a danger border, `aria-invalid`, and an announced message.

**Visual/a11y check:**

- The label is programmatically associated with the field.
- The hint and the error both reach `aria-describedby`.
- The error isn't shown by colour alone (there's an icon and text).
- The font size is 16px or more on phones, so iOS doesn't zoom.
- The disabled state looks disabled.

### Modal: [`ui/Modal.tsx`](../src/components/ui/Modal.tsx)

Props: `open`, `onClose`, a required `title` (hide it with `hideTitle`), `description`, `size` (`sm` 384, `md` 512, `lg` 704px), `placement` (`center` or `top`), and `closeLabel`.

The modal is built on the native `<dialog>` with `showModal()`, so the page behind it is inert. On top of that:

- Tab wraps inside the dialog.
- Escape and backdrop clicks call `onClose`.
- The page doesn't scroll behind it (`html[data-scroll-locked]`).
- Focus returns to the opener.

It enters by swinging up out of the page (`rotateX(-6deg)` → flat, CSS `@starting-style`), the one place motion explains depth.

**Visual/a11y check:**

- Focus lands inside the modal on open and returns to the opener on close.
- Tab and Shift+Tab never leave the modal.
- Escape closes it.
- A screen reader announces the title and description.
- With reduced motion it opens instantly.

### Navigation: [`Navbar.tsx`](../src/components/Navbar.tsx)

A full-width bar. At the top of a page with a hero it is transparent: ink tokens over the ivory home cover, inverse (ivory) tokens over the blue case-study covers. Once scrolled, or on any other page, it is a slim frosted-paper bar with a coral reading-progress line. Below 768px the links move into a top-placed Modal sheet.

**Visual/a11y check:**

- The logo and links are readable over the hero and over every section, in both themes.
- The menu toggle exposes `aria-expanded` and `aria-controls`.
- The skip link appears on the first Tab.
- The theme toggle states its action ("Switch to light theme").

## How each change raises perceived quality

| Change | Effect |
|---|---|
| Serif headlines with one italic coral word | The page reads as a publication, and each section gets one focal point |
| Warm ivory paper instead of white, with grain | Softer and more expensive than a screen-white page |
| A portrait that breaks out of its disc and is cropped by the page edge | A magazine-cover composition instead of a profile picture |
| Deep-blue plates (covers, contact, skills) on paper | Rhythm down the page, and a frame that makes screenshots look mounted |
| Small tracked labels led by a coral rule and an italic number | Editorial wayfinding: you always know which "chapter" you're in |
| One coral button per view | The next step is never in doubt |
| Paper cards with a lit edge and blue-tinted shadows | Surfaces read as physical sheets, not flat boxes |
| Pointer tilt on two card types only | Depth where exploration pays off, without turning the page into a toy |

## Swapping assumptions

- **Rebrand:** edit tier 1 in `tokens.css` (and the literals in `lib/shareCard.tsx` and `NeuralNet.tsx`). Run `npm test`: the contrast guards will flag any pair that no longer passes.
- **Less 3D:** set `--tilt-max: 0deg` (or remove the `tilt` props). For a flatter look, also reduce `--elev-*`.
- **Different fonts:** change the `next/font` imports in `layout.tsx`. The `--font-*` tokens pick them up.
- **A component library later (e.g. Radix):** keep the tokens and CSS classes, and render the library's primitives with the same class names.

## Patterns borrowed from reference portfolios (2026-10-10)

These were adapted, not copied, from Brittany Chiang's and Tamal Sen's portfolios, in your own tokens and colours. Brittany's page-wide cursor spotlight was left out on purpose: it's her signature effect.

| Pattern | From | Where | Notes |
|---|---|---|---|
| Nav highlights the section being read | Brittany | `Navbar.tsx` (`useActiveSection` in `lib/hooks.ts`) | `aria-current="location"` and an accent-tinted pill. The case-study contents list uses the same hook |
| Whole card opens the case study | Brittany | `.project-card` and `.card-link` | The title link's `::after` covers the card (z-index 1). `.btn`s sit above it (z-index 2). Keyboard focus outlines the whole card. Hover turns the title accent and nudges its arrow |
| Cover screenshot on each project card | Brittany, Tamal | `.project-card__cover` | Uses the case study's first desktop shot (`coverFor`). Zooms 3% on hover; no zoom with reduced motion |
| Tech pills | Brittany | `.chip` | Outlined mono pills; the tinted variant was retired in the Obsidian redesign |
| Numbered section labels | Tamal | `.eyebrow` and `SectionHeader index` | Now "—— *01* PROJECTS": a coral rule and an italic serif number, both decorative (`aria-hidden`), so screen readers just hear the label |

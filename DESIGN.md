# MINDORA DESIGN.md

> Reading this as: healthcare landing plus elderly companion app for families and clinicians everywhere, with a calm editorial language, leaning toward Claude warm cream plus terracotta with Tailwind v4 plus Motion.
> Dials: DESIGN_VARIANCE 7 / MOTION_INTENSITY 5 / VISUAL_DENSITY 3 (airy for elderly eyes).
> Sources: Claude DESIGN.md (warm cream canvas, terracotta voltage, serif display), Airbnb DESIGN.md (pill CTAs, rounded human cards, photography first), Apple (premium whitespace). Vendored refs in /tmp/opencode/design-ref/.
> Brand scope is universal. Never tie the brand, hero, navbar, footer, or landing sections to one region. Cultural content lives only inside patient activity data (memory cards, reminiscence stories), never in marketing surfaces.

## 1. Visual Theme and Atmosphere

Calm, warm, editorial care for every family, everywhere. Cream paper canvas, generous whitespace, one terracotta voice, photography of familiar everyday life. No tech gradients, no purple glow, no glassmorphism, no dashboard clutter. Every screen must feel unhurried and readable at arm's length.

Density is gallery airy. Section padding `py-20 md:py-28`. Max width `max-w-6xl`. One idea per section.

## 2. Color Palette and Roles

| Token | Hex | Role |
|---|---|---|
| `canvas` | `#faf9f5` | Page background, always |
| `surface` | `#ffffff` | Cards, nav, modals |
| `surface-soft` | `#f5f0e8` | Tinted bands, bento fills |
| `ink` | `#1c1917` | Headlines, primary text |
| `body` | `#44403c` | Body copy |
| `muted` | `#78716c` | Secondary, captions |
| `hairline` | `#e7e0d3` | Borders, dividers |
| `primary` (terracotta) | `#9a3412` | Primary CTA bg, key accents. WCAG AA on cream |
| `primary-strong` | `#7c2d12` | Hover, pressed |
| `primary-soft` | `#fbe9dc` | Tint fills, badges |
| `clinical` (deep teal) | `#0f766e` | Doctor portal, secondary actions |
| `clinical-soft` | `#dcf5f0` | Clinical tint fills |
| `care` (leaf) | `#4d7c0f` | Success, paired device dot |
| `warn` | `#b45309` | Offline, gentle warnings |
| `rose` | `#be123c` | Destructive only |

Lock: one accent per page (terracotta). Clinical teal appears only in doctor surfaces and small labels. No section flips theme mid page.

## 3. Typography Rules

- Display: `Newsreader, Georgia, serif`, weight 500-600, `tracking-tight`, `leading-[1.05]`. Serif is justified here: heritage editorial care brand for elderly reminiscence, not generic SaaS. Never Fraunces or Instrument Serif.
- Body/UI: `Plus Jakarta Sans, system-ui, sans-serif`. Keep `Outfit` only as legacy fallback, do not add new Outfit usage.
- Scale: hero `text-4xl md:text-6xl`, section `text-3xl md:text-4xl`, card title `text-xl`, body `text-base leading-relaxed`, caption `text-sm text-stone-500`.
- Hero headline max 2 lines. Subtext max 20 words. No em dash anywhere. Use period or comma.
- Italic emphasis uses same family italic, with `leading-[1.1]` plus `pb-1` when the word contains y g j p q.

## 4. Component Stylings

- Primary CTA: `bg-[#9a3412] text-white rounded-full px-7 py-3.5 text-sm font-bold`, hover `bg-[#7c2d12]`, active `scale-[0.98]`, min height 52px for elderly tap targets. Label max 3 words, one line at desktop.
- Secondary: `bg-white border border-[#e7e0d3] rounded-full`, hover warm tint.
- Cards: `bg-white border border-[#e7e0d3] rounded-[20px] shadow-[0_1px_2px_rgba(28,25,23,0.05)]`. No cards inside cards. No giant rounded wrappers around whole sections.
- Badges: pill only, `rounded-full text-xs font-bold`, no section numbers, no version labels.
- Inputs: `rounded-2xl border-[#e7e0d3] px-4 py-3 text-base`, focus ring terracotta.
- Patient primary actions: min 56px height, `text-lg font-extrabold rounded-[20px]`.
- Icons: lucide-react only (already installed), strokeWidth 2, one family, no hand rolled SVG.

## 5. Layout Principles

- Split hero default (left copy, right photography), not centered hero. Centered only for manifesto closers.
- Bento grids: exact cell count, at least 2 cells with real imagery or tint, never all white text cards.
- Section rhythm varies: split, bento, full bleed photo band, vertical stack. No 3 consecutive image plus text splits. No 3 equal feature cards in a row.
- Max one eyebrow per 3 sections. No left headline plus right floater paragraph headers. Stack headline then body, max 65ch.
- Nav: brand mark plus wordmark only. No tagline next to the title, no portal pills, no status text, no online or offline badge, no tour button. Single line at desktop, height 68px, cream glass `bg-[#faf9f5]/90 backdrop-blur-md`.
- Auth is portal specific. Doctor screens sign in a doctor account, caretaker screens a caregiver account, patient screens tap a photo profile with no password. Never show one hardcoded identity across portals. Never use the word "Welcome" anywhere visible; use "Good morning" or "Signed in as".

## 6. Depth and Elevation

Tinted shadows only. `0_1px_2px_rgba(28,25,23,0.06)` for cards, `0_18px_50px_rgba(154,52,18,0.12)` for hero photo. No black drop shadows, no neon glows.

## 7. Do's and Don'ts

- Do: large touch targets, Listen Aloud buttons, universally familiar objects (tea cups, hand fans, garden flowers, festival drums), gentle non diagnostic copy.
- Do not: clinical claims, timers or countdown pressure language, passwords or codes for patients, tiny pills, fake dashboard previews built from divs, version footers, scroll cues, guided tour overlays, online or offline mode toggles in the navbar, region-locked brand claims, seeded personal names as fallbacks (use "your doctor", "your caregiver", "Assigned clinician").
- Copy register: plain, warm, concrete. No elevate, seamless, unleash, next gen, revolutionize.

## 8. Responsive Behavior

Breakpoints sm 640 md 768 lg 1024 xl 1280. Asymmetric desktop collapses to single column under 768px with `px-4 py-8`. Hero uses `min-h-[100dvh]` never `h-screen`. Images reserve space via aspect ratios to keep CLS under 0.1.

## 9. Agent Prompt Guide

Quick tokens: canvas `#faf9f5`, ink `#1c1917`, accent `#9a3412`, clinical `#0f766e`, hairline `#e7e0d3`, radius cards 20px, pills full, display Newsreader serif plus Plus Jakarta Sans body.

Prompt: Build calm editorial healthcare UI on cream `#faf9f5` with terracotta `#9a3412` primary CTAs, Newsreader serif headlines, 20px cards, pill buttons, generous whitespace, split hero with real photography, exact cell bento, max one eyebrow per 3 sections, zero em dashes, min 52px touch targets.

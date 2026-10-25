# Gadget Tokens — the sqrlnest design-token contract

Reference for building **gadgets** (embeddable widgets: the chatbot, and future
ones). It lists the concrete CSS variables a gadget may use and maps the
sqrlnest-specific tokens onto their Astryx origin.

> Source of truth: `@astryxdesign/core@0.6.3` (`astryx.css`, 282 tokens) plus the
> per-theme files in `src/themes/*.ts` → built to `public/themes/*.css`
> (`paper`, `cyber`, `folio`, `sand`).

---

## How theming works (why gadgets need zero CSS files)

1. The landing loads all four theme files in `<head>` (`/themes/*.css`). Each is
   scoped by `@scope ([data-astryx-theme="X"])`.
2. Switching theme = set `body[data-astryx-theme]`; switching mode = set/remove
   `html[data-theme]` (`light`/`dark`; absent = `system`).
3. A gadget mounts a **Shadow DOM** host on `document.body`. CSS **custom
   properties cascade through the Shadow boundary**, so the gadget inherits the
   active theme's tokens automatically.

**Golden rule:** a gadget styles itself **only** with the tokens below. No
hard-coded colors, sizes, radii, or fonts. No theme `.css` of its own.

---

## Two token layers

| Layer | Who defines it | Examples |
| --- | --- | --- |
| **Astryx standard** | `@astryxdesign/core` (auto-generated) | `--color-background-surface`, `--color-text-primary`, `--radius-chat`, `--font-family-body` |
| **sqrlnest brand** | landing, via `localTokens` in `src/themes/*.ts` | `--color-brand`, `--color-brand-solid`, `--color-on-brand` |

Both layers are present on every sqrlnest page, so gadgets may use both. The
brand layer exists because Astryx's own `--color-accent` is **contrast-adjusted
away from the brand hue** — see the mapping below.

---

## sqrlnest brand tokens → Astryx origin (mapping)

These are **sqrlnest-specific** (not in stock Astryx). Use them for brand accents.

| sqrlnest token | Value (cyber, `light-dark`) | Astryx origin | Why it is separate |
| --- | --- | --- | --- |
| `--color-brand` | `#E0531A` / `#F0652F` | derived from the theme's `accent` input | keeps the **exact brand hue**; Astryx's `--color-accent` shifts it for contrast |
| `--color-brand-solid` | `#C7451B` / `#F0652F` | — | darker solid variant for hover/pressed |
| `--color-on-brand` | `#FFFFFF` / `#1A0F00` | mirrors `--color-on-accent` | readable foreground on brand |
| `--icon-stroke` | `2.5` | — | landing icon stroke width (gadgets usually don't need it) |
| `--icon-join` | `miter` | — | landing icon line join (idem) |

### Critical: `--color-brand` ≠ `--color-accent`

Same source (`accent: ["#E0531A", "#F0652F"]`), different output:

| | light | dark | meaning |
| --- | --- | --- | --- |
| `--color-brand` (sqrlnest) | `#E0531A` | `#F0652F` | **exact brand hue** — use this for gadgets |
| `--color-accent` (Astryx) | `#B32B00` | `#FFB496` | contrast-tuned accent — **different color** |

**For a gadget's accent (bubble, send button, user bubble), use `--color-brand`,
not `--color-accent`.** Accent is tuned for WCAG contrast and will not match the
brand orange users see on the rest of the site.

---

## Astryx standard tokens a gadget should use

Values shown for the `cyber` theme as an example (they change per theme).

### Surfaces / backgrounds

| Token | Value (cyber) | Use for |
| --- | --- | --- |
| `--color-background-body` | `#F5F5F5` / `#0A0A0A` | page-level background |
| `--color-background-surface` | `#FFFFFF` / `#0D0D0D` | **gadget panel background** |
| `--color-background-card` | `#FAFAFA` / `#0F0F0F` | nested card inside the gadget |
| `--color-background-popover` | `#FFFBF9` / `#372E2B` | menus / popovers |
| `--color-background-muted` | `#221A170D` / `#221A1780` | **assistant message bubble** |
| `--color-background-inverted` | — | inverted surface |

### Text

| Token | Value (cyber) | Use for |
| --- | --- | --- |
| `--color-text-primary` | `#0A0A0A` / `#C4C4C4` | main text |
| `--color-text-secondary` | `#4A4A4A` / `#888888` | secondary text / status line |
| `--color-text-disabled` | `#9F8D86` / `#6B5B55` | disabled text |
| `--color-text-accent` | = accent | accent-colored text |

### Icons

`--color-icon-primary` · `--color-icon-secondary` · `--color-icon-accent` ·
`--color-icon-disabled`

### Borders

| Token | Value (cyber) | Use for |
| --- | --- | --- |
| `--color-border` | `#221A1733` / `#FBEEEA33` | input / divider borders |
| `--color-border-emphasized` | `#84746D` | stronger border |

### Overlays / effects / state

`--color-overlay` · `--color-overlay-hover` · `--color-overlay-pressed` ·
`--color-shadow` (`#0000001A` / `#0000004D`) · `--color-skeleton` ·
`--color-track` · `--color-tint-hover` · `--color-neutral`

Status: `--color-success` · `--color-error` · `--color-warning` (+ `-muted`,
`--color-on-*`).

### Radius

| Token | Value (cyber) | Use for |
| --- | --- | --- |
| `--radius-none` | `0px` | — |
| `--radius-inner` | `0px` | innermost elements (small controls) |
| `--radius-element` | `0px` | **inputs, buttons** |
| `--radius-container` | `0px` | **gadget panel** |
| `--radius-chat` | `0px` | **chat bubbles** |
| `--radius-page` | `0px` | page-level containers |
| `--radius-full` | `9999px` | **pill / circular (the bubble)** |

> `cyber` is a hard-edged theme (`0px`); `paper`/`folio`/`sand` have real radii.
> Always use the token so the gadget follows whatever theme is active.

### Typography

- Families: `--font-family-body` (`"JetBrains Mono", …` in cyber) ·
  `--font-family-heading` · `--font-family-code`
- Sizes: `--font-size-4xs … --font-size-5xl` (e.g. `--font-size-base` = `0.875rem`,
  `--font-size-sm` = `0.75rem`)
- Weights: `--font-weight-normal | medium | semibold | bold`
- Roles (size + weight + leading): `--text-body-*`, `--text-label-*`,
  `--text-large-*`, `--text-supporting-*`, `--text-heading-1..6-*`,
  `--text-display-1..3-*`

### Spacing

`--spacing-0`, `--spacing-0-5`, `--spacing-1`, `--spacing-1-5`, `--spacing-2` …
`--spacing-12`.

### Motion

`--duration-fast{,-min,-max}` · `--duration-medium{,-min,-max}` ·
`--duration-slow{,-min,-max}`.

### Focus

`--focus-outline-color` · `--focus-outline-width` · `--focus-outline-style` ·
`--focus-outline-offset`.

---

## Do NOT use in a gadget

| Avoid | Why | Use instead |
| --- | --- | --- |
| `--color-accent` for brand accent | contrast-shifted, ≠ brand hue | `--color-brand` |
| `--color-surface`, `--color-card`, `--color-primary`, `--color-line`, `--color-ok`, `--color-err` | Tailwind utility aliases in `global.css`, only valid inside the landing's Tailwind build — not real tokens | the Astryx originals (`--color-background-surface`, `--color-text-primary`, …) |
| `--radius-box`, `--radius-el` | Tailwind aliases | `--radius-container`, `--radius-element` |
| `--rata-font`, `--rata-font-mono` | pre-theme fallbacks | `--font-family-body`, `--font-family-code` |
| any hex / px / rem literal | breaks theming | the matching token above |

---

## Gadget quick-reference (chatbot example)

| Part | Token |
| --- | --- |
| Floating bubble background | `--color-brand` |
| Bubble icon color | `--color-on-brand` |
| Bubble shape | `--radius-full` |
| Panel background | `--color-background-surface` |
| Panel radius | `--radius-container` |
| Panel shadow color | `--color-shadow` |
| Message text | `--color-text-primary` |
| Status line text | `--color-text-secondary` |
| User bubble bg / fg | `--color-brand` / `--color-on-brand` |
| Assistant bubble bg | `--color-background-muted` |
| Bubble radius | `--radius-chat` |
| Input / send button radius | `--radius-element` |
| Input border | `--color-border` |
| Send button bg / fg | `--color-brand` / `--color-on-brand` |
| Font | `--font-family-body` |
| Body text size | `--font-size-base` / `--text-body-size` |

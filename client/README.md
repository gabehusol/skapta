# Skapta: web client

React 19 + Vite + Tailwind v4. See the [root README](../README.md) for the full
project overview, architecture and reasoning.

## Run

```bash
pnpm install
pnpm dev        # http://localhost:5173
```

The API must be running on `http://localhost:8000` (see [`../api`](../api)).
Override with `VITE_API_URL` in `client/.env`.

| Script | Does |
|---|---|
| `pnpm dev` | Vite dev server with HMR |
| `pnpm build` | Production build to `dist/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm lint` | ESLint |

## Layout

```
src/
├── pages/Home.jsx        idle → analysing → results layout transition
├── components/
│   ├── DescriptionInput  project name + description, submits to /api/recommend
│   ├── StackGrid         bento grid of recommendation cards + generate button
│   ├── RecommendationCard  one layer, with its reason and swappable alternatives
│   ├── ForgeBackground   full-bleed WebGL shader, tinted by the active scheme
│   └── …                 GlowingEffect, SpotlightGlow, TiltCard, Toggle
├── hooks/                useRecommend · useGenerate (blob download + error toasts)
├── theme/
│   ├── schemes.js        19 accent schemes; applyScheme() writes CSS variables
│   ├── backgrounds.js    6 selectable shader backgrounds
│   └── config.js         APPEARANCE_ENABLED feature flag (currently off)
├── lib/                  api.js (axios) · scroll.js (shared Lenis handle)
└── index.css             the colour system + glass/glow utilities
```

## Theming

Colours live entirely in CSS custom properties defined in `src/index.css`.
`applyScheme()` writes six variables onto `document.documentElement`, which retints
the UI *and* the shader background in one call, with no React re-render involved.

The appearance picker is feature-flagged off in `theme/config.js`, locking the app
to the `steel` accent and the `grain` background. Flip `APPEARANCE_ENABLED` to `true`
to restore it; a user's previously saved choice is preserved while it's off.

> `DESIGN.md` in this directory is a design-language *reference* (an analysis of a
> different product's system that informed structural choices here). Skapta's own
> tokens are the ones in `src/index.css`.

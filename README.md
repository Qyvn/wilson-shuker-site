# Interactive Artist Website Template

A reusable, sellable artist website: homepage (hero, bio, nav, socials), a **genuine 3D rotating CD wheel** (pure CSS 3D transforms, no 3D library), and a **retro cassette player** that plays real, authorised previews hard-capped at 30 seconds, with streaming links for the full track.

Stack: React 18 + TypeScript + Vite. Tests use Vitest + Testing Library, and the browser checks use Playwright (Chromium). The app has no runtime dependencies beyond React.

## Run

```bash
npm install
npm run dev        # local dev server
npm run build      # type-check + production build to dist/
npm run preview    # serve the build
npm test           # unit/component tests (Vitest)
npx playwright install chromium   # once
npm run build && npm run e2e      # headless checks + screenshots/ (takes ~45s; waits for a real 30s cap)
```

## What the artist must supply

Every asset that ships in this repo is a **placeholder**. The audio files are synthesised sine tones and the images are generated SVGs. Replace them with:

| Item | Where |
| --- | --- |
| Artist name, tagline, short intro, biography | `src/config/artist.ts` |
| Logo (SVG/PNG) | `public/images/` → `artist.logo` |
| Hero photo (landscape, ≥1600px wide) | `artist.heroImage` |
| Profile/portrait photo | `artist.profileImage` |
| Gallery images and alt text | `artist.gallery` |
| Brand colours and fonts (optional web-font stylesheet URL) | `artist.colors`, `artist.fonts` |
| Social profile URLs (Instagram, TikTok, YouTube, …) | `artist.socials` (empty = hidden) |
| Contact / booking / management | `artist.contact` |
| SEO title, description, canonical URL, share image | `artist.seo` (injected into `index.html` at build) |
| Song list: title, artwork, **authorised** preview audio (MP3/AAC, ideally ≤30s) | `src/data/songs.ts`, files in `public/audio/` and `public/images/` |
| Official Spotify / Apple Music / YouTube Music / YouTube URLs per song | `src/data/songs.ts` (empty string = button hidden) |

Only use audio and images the artist owns or is licensed to use. Do **not** scrape streaming services. The example links `open.spotify.com/track/EXAMPLE-replace-me`, `youtube.com/watch?v=EXAMPLE` and `youtube.com/@example` are fake and must be replaced or cleared before launch.

## Customising

- **Content and branding**: edit only `src/config/artist.ts` and `src/data/songs.ts`. The components read everything from these files.
- **Songs**: see the `Song` type in `src/types.ts`. Leave `previewUrl: ""` if there is no preview; the player then shows "Preview unavailable" and offers whatever streaming links are configured. URLs must be valid http(s), otherwise the button is hidden.
- **Preview length**: `artist.previewSeconds`. It is always clamped to a maximum of 30.
- **CMS/database later**: `songs` is a plain `Song[]`. Fetch it from an API and pass it to `<MusicSection songs={...} />`.
- **Look**: CSS variables at the top of `src/index.css` are set from the config. The disc materials (`.disc*`) and cassette (`.cassette*`) live in the same file.

## Behaviour notes

- There is no autoplay. Audio starts only when the visitor presses Play. Selecting another CD stops the current preview.
- Player state comes from real `<audio>` events (`playing`, `pause`, `timeupdate`, `ended`, `error`). If there is no audio, nothing pretends to play.
- The cap is enforced on `timeupdate`, with a 100ms poll as backup. Replay restarts from 0.
- The wheel can be rotated by mouse drag, touch swipe, the ‹ › buttons, or arrow keys / Home / End. A CD is selected with click/tap, Enter/Space, or "Load … into the player". The selected CD comes forward and a copy flies into the cassette window.
- `prefers-reduced-motion`: the wheel moves without transitions, the flight animation, reel spin and sheen are turned off, and every control keeps working.

## Structure

```
src/config/artist.ts      central artist configuration
src/data/songs.ts         song data (separate from UI)
src/types.ts              Song / ArtistConfig types
src/lib/links.ts          URL validation + streaming link list
src/hooks/usePreviewPlayer.ts   audio engine (30s cap, switching, replay, states)
src/hooks/useReducedMotion.ts
src/components/CDWheel.tsx      3D wheel (CSS 3D, pointer drag, keyboard)
src/components/CassettePlayer.tsx
src/components/MusicSection.tsx wheel + player + CD flight animation
src/components/StreamingLinks.tsx
src/App.tsx               page layout (hero, music, about, gallery, contact)
src/test/                 Vitest tests
scripts/e2e.mjs           Playwright checks (overflow, drag, real audio cap, reduced motion)
public/audio, public/images   PLACEHOLDER assets
```

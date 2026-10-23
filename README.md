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

## Current customisation: Wilson Shuker

This copy is set up for **Wilson Shuker**. Profiles and links were checked on 23 Oct 2026:

- Apple Music artist: https://music.apple.com/us/artist/wilson-shuker/1896717690 (singles "Feel-A" and "Nsimbi Yamahumusha", 2026)
- YouTube: https://www.youtube.com/@wilsonshuker
- SoundCloud: https://soundcloud.com/wilsonshuker
- Instagram: https://www.instagram.com/wilsonshuker/ (the profile name matches; the bio could not be read)
- X: https://x.com/wilsonshuker (display @WilsonShuker_SA)
- **Not verified, left empty:** Spotify, YouTube Music (track/topic pages), TikTok.

**Wilson must still supply:**
- Authorised **30-second preview clips** for each song. The current files in `public/audio/` are synthesised test tones, labelled in the UI as "Placeholder tone, not the real song".
- His Spotify / YouTube Music / TikTok URLs.
- A reviewed bio. The current text is a draft based only on his public profiles.
- A confirmed contact email. The one used is shown publicly on his YouTube channel.
- The live domain for `artist.seo.url`.

Photos were supplied by the user (originals are in `photo-src/`). Edits: crops for the desktop hero, mobile hero, profile and gallery; a light warm grade; slight contrast and saturation; fine grain; a soft vignette. Exports are WebP and JPG. His face and identity were not altered and no AI generation was used. Cover art comes from Apple Music (the two singles) and his YouTube video thumbnails (the rest).

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

## Features: mixtape maker, unreleased vault, tour and tickets

All three are configured in `src/config/features.ts`.

### Mixtape maker (`mixtape`)
- Fans add up to `maxSongs` songs, by tapping "Add" or dragging onto the blank tape. They can reorder (↑/↓), remove, name the tape and pick a tape colour from `tapeColors`.
- The share link stores everything in the query string (`?mixtape=1&t=<name>&c=<colour>&s=<id,id,…>`), so no backend is needed. Unknown or duplicate song ids are dropped, names are capped at 40 characters, and unknown colours fall back to the first one.
- Opening a link shows a "Someone made you a mixtape" view. Previews play in order only after the visitor presses Play. The same 30-second cap applies, songs without a real preview are skipped, and each track shows its streaming links.
- There are "Copy link" and native Web Share buttons. Share only appears where the browser supports it.

### Unreleased vault (`vault`)
- Adds a locked disc to the 3D wheel that shows a live countdown to `releaseDate` (ISO with offset). It unlocks automatically once that date passes and then links to `unlockUrl`, if set.
- The current entry is an **EXAMPLE placeholder**: "Untitled — coming soon", 22 Nov 2026, labelled as an example in the UI. Replace it or set `enabled: false`.
- An email signup appears only if `signupEndpoint` is a real form endpoint (e.g. Formspree). Otherwise it is hidden.

### Tour and tickets (`tourEvents`, `payments`)
- Each event has a name, venue, city, ISO date, price tiers in ZAR, a capacity note, and an optional `ticketUrl` (Quicket / Howler / Computicket). Past events are hidden automatically.
- Each event's buy button follows these rules:
  1. A valid `payments.paystackPublicKey` (`pk_live_…` / `pk_test_…`) turns on on-site checkout with **Paystack Inline v2** (ZAR). The fan picks a tier and quantity and enters their email. The Paystack script (`https://js.paystack.co/v2/inline.js`) loads only when they press Pay.
  2. Otherwise, a `ticketUrl` shows a "Get tickets" link to that ticketing site.
  3. Otherwise, a disabled **"Tickets coming soon"** button is shown. The current example event is in this state.
- Success is shown only when Paystack's own `onSuccess` callback fires. The confirmation shows the Paystack reference and says the ticket will be emailed once the payment is verified.
- **Important:** a static site cannot confirm payments server-side. Real ticket issuing and verification needs one of these:
  - a Paystack webhook (`charge.success`) handled by a small server or serverless function that verifies the transaction with your **secret** key and emails the ticket, or
  - a ticketing service.
- Never put the Paystack secret key in this repo; only the public key belongs in config.

### What Wilson must supply for these features
- **Paystack:** a verified Paystack business account (South Africa), its **public key**, and a webhook/fulfilment setup (or a ticketing partner). Alternatively, just a Quicket/Howler/Computicket event URL per show.
- **Events:** real name, venue, city, date and time, tiers with ZAR prices, capacity notes, max tickets per order. Remove the EXAMPLE event.
- **Vault:** the real title, teaser artwork, release date and time, and an optional pre-save or streaming link. Optionally a signup form endpoint.
- **Mixtape:** nothing required. Optionally change the tape colours or the max song count.

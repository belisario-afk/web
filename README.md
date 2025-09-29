# Opel Z — 3D Spotify Dashboard (Samsung Galaxy Tab SMT77U)

A polished, production-ready, tablet-optimized 3D dashboard integrating Spotify Web Playback SDK, geolocation-adaptive visuals/DSP, and touch-first UX.

- Stack: React + Vite + TypeScript + react-three-fiber/drei + TailwindCSS + Framer Motion + GSAP + Vitest
- Audio: Spotify Web Playback SDK + PKCE OAuth (Pages-safe), Ambient DSP via Web Audio API
- UX: Fullscreen, swipe gestures, large hit areas, speech feedback, car-dock mode
- Branding: Opel Z (chrome “Z”, neon highlights)
- Deployment: GitHub Actions → GitHub Pages
- PWA: Installable on Android; offline-ready shell with safe caching

Live path (after deploy): `https://belisario-afk.github.io/web/`

## Quick start

1. Clone and install
   ```bash
   git clone https://github.com/belisario-afk/web.git
   cd web
   npm i
   ```

2. Run locally
   ```bash
   npm run dev
   ```
   Local dev uses base `/web/` to match Pages. Open the URL Vite prints.

3. Test
   ```bash
   npm test
   ```

4. Build
   ```bash
   npm run build
   npm run preview
   ```

5. Deploy
   - Push to `main`. GitHub Actions will build and deploy to GitHub Pages automatically.
   - Ensure repository Settings → Pages → Build and deployment → Source = GitHub Actions.

## Spotify integration

- Client ID (public): `927fda6918514f96903e828fcd6bb576`
- Redirect URI: `https://belisario-afk.github.io/web/`

This app implements Authorization Code with PKCE fully client-side (no secrets), then uses the Spotify Web Playback SDK for in-browser playback and device control.

Notes:
- Add the redirect URI in your Spotify Dashboard App settings.
- Web Playback SDK requires Premium on supported browsers.
- We do not cache Spotify domains in the PWA to avoid cookie/session issues.

If tapping “Sign in” does nothing on Android:
- We now exit fullscreen before redirect and use a robust navigation sequence.
- Ensure your device has a default browser set and that “Open supported links” is enabled for Chrome.

## Install as PWA (Android)

- Visit `https://belisario-afk.github.io/web/` in Chrome.
- You should see an “Install app” button in Settings once the browser fires `beforeinstallprompt`.
- Alternatively, use Chrome’s menu → “Install app”.
- PWA runs in fullscreen by default (manifest `display: fullscreen`), landscape preferred.

Offline behavior:
- UI shell is cached for quick launches.
- Spotify SDK/API/auth are always network-only (never cached).
- First load requires network; subsequent launches load instantly and fetch live data when available.

## Tablet optimizations (SMT77U)

- Default orientation: landscape; works in portrait with smooth transitions.
- Large controls: min touch target 56×56 px.
- Fullscreen:
  - Auto-request on load and manual toggle in Settings.
  - PWA install provides true fullscreen.
- Prevent sleep:
  - Screen Wake Lock API; silent audio fallback (truly silent).
- Performance:
  - High-performance WebGL context, bloom/particles tuned for S7 FE GPU.
  - Battery-aware brightness suggestion.
- Car-dock mode:
  - Immersive UI; hides cursor.

## Gestures

- Swipe left/right: switch panels (Now / Geolocation / Themes / Settings)
- Swipe up: cycle theme presets

## Panels

- Now Playing:
  - Spotify login (PKCE), Web Playback SDK device, album art, play/pause, prev/next.
- Geolocation:
  - Adaptive visuals and optional ambient DSP respond to speed.
  - Fallback slider for speed if GPS is unavailable.
- Themes:
  - Visual presets change particle systems, bloom, lens effects, and UI colors.
- Settings:
  - Fullscreen toggle + auto-fullscreen.
  - Car-dock mode.
  - Install app (PWA).
  - Battery and wake-lock indicators.

## Configuration

- Base path is `/web/` for GitHub Pages. If you fork/rename, update:
  - `vite.config.ts` → `base` and PWA plugin URLs
  - `public/manifest.webmanifest` → `start_url`, `scope`
  - `index.html` script path
  - Spotify redirect URI in the Spotify Dashboard
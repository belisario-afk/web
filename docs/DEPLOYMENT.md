# Deployment Guide

This project is preconfigured for GitHub Pages under the path `/web/`.

1. Repository settings
   - Settings → Pages → Build and deployment → Source → GitHub Actions
   - Ensure `Actions` are allowed in org settings.

2. Spotify dashboard
   - Add redirect URI: `https://belisario-afk.github.io/web/`
   - Use Client ID: `927fda6918514f96903e828fcd6bb576`

3. Branch
   - Push to `main`; the `pages.yml` workflow will build and deploy.

4. Customization (if you fork/rename)
   - Update `vite.config.ts` base
   - Update `public/manifest.webmanifest` start_url/scope
   - Update `index.html` script path and favicon path
   - Update Spotify redirect URI in your app config
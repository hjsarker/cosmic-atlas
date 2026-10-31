# COSMIC ATLAS · Interactive Solar System Observatory

### [🌌 Launch the live 3D experience](https://hjsarker.github.io/cosmic-atlas/)

**A cinematic, interactive Solar System explorer**, with textured planets, smooth camera travel, orbit lines, simulated time, inspection panels, mobile controls, and astronomical positions derived from NASA/JPL data.

> **Live deployment:** [Cosmic Atlas on GitHub Pages](https://hjsarker.github.io/cosmic-atlas/) is public and free to visit. GitHub Actions validates the astronomy model, refreshes verified NASA/JPL Horizons observations, prepares attributed planetary textures and deploys the website. Chromium browser QA covers desktop and mobile navigation.

## What you can do

- **Explore:** Select the Sun or any of eight planets, click planetary bodies, fly smoothly between worlds, rotate around them, and zoom into surface details.
- **Travel through time:** Pause, speed up the motion, or enter a date. Position calculations follow planetary orbits rather than arbitrary constant-speed circles.
- **Inspect:** View carefully rounded planetary facts and physical dimensions. Units and explanatory notes distinguish the astronomical orbit model from artistic design.
- **Choose the scale:** Cinematic exploration compresses solar distances and enlarges worlds. Linear-AU mode shows proportional orbital distances while keeping planet radii enlarged for visibility.
- **Adjust visuals:** Toggle orbital paths, labels and bloom. The responsive layout adapts to mobile screens.

## Technology

Static **HTML, CSS, JavaScript, Three.js/WebGL, and Python**. The 3D scene uses Three.js modules and lighting, environment stars, material maps, atmospheric shaders, Saturn's procedural rings, bloom postprocessing, and smooth camera interpolation. No database, payment service or always-on server is required.

## Real astronomical data

**Primary model:** NASA/JPL published Keplerian elements, Table 1, valid 1800–2050. This computes the heliocentric ecliptic positions of Mercury, Venus, the Earth–Moon barycenter, Mars, Jupiter, Saturn, Uranus and Neptune from evolving orbital elements and Kepler's equation. It is a published *approximation*, not real-time telescope measurements.

**Optional higher-precision source:** GitHub Actions downloads validated daily heliocentric vectors from the official JPL Horizons API. When this snapshot is available and covers the selected date, the viewer linearly interpolates Horizons points. If the external source is unavailable, the viewer clearly identifies and uses the approximation; it never invents API readings.

**Visual fidelity versus scientific scale:** Physical planet diameter ratios are intentionally exaggerated and distances are compressed in cinematic mode. Linear mode preserves distance ratios in AU but still exaggerates planet radii. Planet surface maps are enhanced composites, not live imagery. Light and clouds are rendered for visual effect. The site discloses these limitations directly.

## Development

Serve the site from a local static HTTP server:

```bash
python3 -m http.server 8000 --directory site
# open http://localhost:8000
```

The browser loads the pinned Three.js ES modules from jsDelivr. Local planetary texture assets are added by the GitHub Actions build; if missing locally, the renderer tries the credited public mirror. A network connection is therefore needed unless these assets and modules have been cached.

Run deterministic astronomical and frontend syntax tests:

```bash
node --test tests/*.test.mjs
for file in site/js/*.js; do node --check "$file"; done
```

Download licensed textures locally:

```bash
python3 scripts/prepare_assets.py
```

Fetch a new verified Horizons snapshot:

```bash
python3 scripts/sync_horizons.py
```

## Free GitHub Pages publishing

The included `.github/workflows/pages.yml` validates the model, downloads texture assets, attempts to refresh NASA/JPL Horizons samples, packages the static site and publishes through GitHub Pages. It also runs monthly to refresh astronomical data. The workflow uses `enablement: true`, but GitHub may still require the repository administrator to select **Settings → Pages → Build and deployment → Source: GitHub Actions** once.

[Check the deployment workflow](https://github.com/hjsarker/cosmic-atlas/actions/workflows/pages.yml).

## Source credits

Astronomical parameters: NASA/JPL Solar System Dynamics and Horizons. Planetary map textures: Solar System Scope, **CC BY 4.0** (attribution required). See [ATTRIBUTION.md](ATTRIBUTION.md) for full source and license details. Project source: MIT, except separately licensed texture assets and source data.

This is an independent educational visualization. NASA/JPL and Solar System Scope are not affiliated with the project.

<!-- Initial GitHub Pages build triggered after readable source restoration. -->

# Ephemeris source

The GitHub Actions build optionally downloads daily heliocentric ecliptic XYZ vectors for all eight planets from NASA/JPL Horizons. Only successfully validated data are written to `horizons.json`, deployed with the static website, and used for dates within the published range. The website never contacts Horizons directly.

If Horizons is unavailable, `site/js/astronomy.js` implements JPL's documented low-precision Keplerian model for 1800–2050. The site displays which source is active. The data are illustrative astronomical positions, not spacecraft navigation-grade ephemerides.

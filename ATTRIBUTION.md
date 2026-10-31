# Asset and scientific data attribution

## Planet imagery

Solar System Scope / INOVE, planetary equirectangular texture maps, [Solar System Scope Textures](https://www.solarsystemscope.com/textures/), Creative Commons Attribution 4.0 International ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)).

Texture JPG files are downloaded into `site/assets/` by `scripts/prepare_assets.py` from the publicly available attribution-preserving mirror [Sanghel/solar-system-3d](https://github.com/Sanghel/solar-system-3d/blob/develop/public/textures/README.md). Original maps contain enhanced colors and, where source coverage is incomplete, artistically reconstructed regions; they are not live spacecraft photographs.

The optional higher-resolution desktop textures are retrieved from [Wikimedia Commons' Solar System Scope collection](https://commons.wikimedia.org/wiki/Category:Solar_System_Scope), also under CC BY 4.0. Earth and Mars use a 4096-pixel-wide derivative where available; Jupiter and Saturn use 4096-pixel originals. Each 4K request falls back to the attributed 2K map if retrieval or validation fails. The website renders different map resolutions on desktop and mobile to limit graphics memory use.

Adaptations: Textures are mapped onto physically illuminated 3D surfaces, without editing source JPEG pixels. Sun glow, star background, Uranus and Saturn rings, atmospheres and optional Earth cloud representation are procedural artistic render effects.

## Orbital positions

NASA/JPL Solar System Dynamics, [Approximate Positions of the Planets](https://ssd.jpl.nasa.gov/planets/approx_pos.html), Table 1 (1800–2050), with approximate Earth–Moon barycentric orbital elements for Earth. The optional daily vector dataset is obtained using the official [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) in GitHub Actions, not from site visitors' browsers. The site labels the active orbital source.

## Library

[Three.js](https://threejs.org/) and its examples modules, distributed under the [MIT license](https://github.com/mrdoob/three.js/blob/master/LICENSE).

NASA/JPL neither operates nor endorses this independent educational experience.

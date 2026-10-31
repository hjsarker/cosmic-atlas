# Asset and scientific data attribution

## Planet imagery

Solar System Scope / INOVE, planetary equirectangular texture maps, [Solar System Scope Textures](https://www.solarsystemscope.com/textures/), Creative Commons Attribution 4.0 International ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)).

Texture JPG files are downloaded into `site/assets/` by `scripts/prepare_assets.py` from the publicly available attribution-preserving mirror [Sanghel/solar-system-3d](https://github.com/Sanghel/solar-system-3d/blob/develop/public/textures/README.md). Original maps contain enhanced colors and, where source coverage is incomplete, artistically reconstructed regions; they are not live spacecraft photographs.

The optional higher-resolution desktop textures are retrieved from [Wikimedia Commons' Solar System Scope collection](https://commons.wikimedia.org/wiki/Category:Solar_System_Scope), also under CC BY 4.0. Earth and Mars use a 3840-pixel-wide derivative where available; Jupiter and Saturn use 4096-pixel originals. Each 4K request falls back to the attributed 2K map if retrieval or validation fails. The website renders different map resolutions on desktop and mobile to limit graphics memory use.

Adaptations: Textures are mapped onto physically illuminated 3D surfaces, without editing source JPEG pixels. Sun glow, Uranus and Saturn rings, atmospheres and optional Earth cloud representation are procedural artistic render effects. The star background is now based on the real Gaia panorama and HYG star coordinates; sky exposure and star point size remain illustrative.


## Galactic background and star positions

**ESA/Gaia/DPAC**, Gaia Early Data Release 3, equirectangular all-sky colour composite (2020).
Acknowledgement: **A. Moitinho**. [ESA source and downloadable image](https://www.esa.int/ESA_Multimedia/Images/2020/12/The_colour_of_the_sky_from_Gaia_s_Early_Data_Release_32), licensed **[CC BY-SA 3.0 IGO](https://creativecommons.org/licenses/by-sa/3.0/igo/)**. The image is converted from PNG to an optimized JPEG without changing the celestial projection. Contrast/exposure is adjusted in the shader for presentation. This is a survey-colour composite, not a natural naked-eye exposure.

**HYG Star Database v4.1**, [Astronexus](https://github.com/astronexus/HYG-Database/tree/main/hyg/CURRENT), licensed **[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)**. The build retains a magnitude-limited subset with right ascension, declination, visual magnitude and B-V colour. Coordinate transformation to J2000 ecliptic display axes and approximate star-colour/size rendering are adaptations. Attribution and share-alike obligations remain attached to the derived data snapshot and survey map.

The Galactic sky composite uses galactic longitude and latitude; the star positions are ICRS equatorial coordinates. Both are transformed in the 3D rendering into the same J2000-oriented axes as the JPL ecliptic planetary positions. The simulated observer remains in the Solar System; nearby stellar parallax and real-time star proper motion are not applied. The sky is a fixed-epoch celestial reference, not a ground-based view of the constellations from a specific location.

## Orbital positions

NASA/JPL Solar System Dynamics, [Approximate Positions of the Planets](https://ssd.jpl.nasa.gov/planets/approx_pos.html), Table 1 (1800–2050), with approximate Earth–Moon barycentric orbital elements for Earth. The optional daily vector dataset is obtained using the official [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) in GitHub Actions, not from site visitors' browsers. The site labels the active orbital source.

## Library

[Three.js](https://threejs.org/) and its examples modules, distributed under the [MIT license](https://github.com/mrdoob/three.js/blob/master/LICENSE).

NASA/JPL neither operates nor endorses this independent educational experience.

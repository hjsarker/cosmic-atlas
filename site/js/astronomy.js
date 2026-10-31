/** NASA/JPL approximate heliocentric Keplerian elements, J2000 ecliptic, 1800–2050.
 * https://ssd.jpl.nasa.gov/planets/approx_pos.html (Table 1)
 * Earth is the Earth–Moon barycenter; visually appropriate, not sub-km precision.
 * Epoch UTC approximates ephemeris time at the sub-arcsecond level for this exhibit.
 */
export const AU_KM = 149597870.7;
const DEG = Math.PI / 180;
// Each entry: a, e, I, L, longitude of perihelion, longitude of node;
// followed by their changes per Julian century.
export const ELEMENTS = {
  mercury: [[0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593], [0.00000037,0.00001906,-0.00594749,149472.67411175,0.16047689,-0.12534081]],
  venus: [[0.72333566,0.00677672,3.39467605,181.97909950,131.60246718,76.67984255],[0.00000390,-0.00004107,-0.00078890,58517.81538729,0.00268329,-0.27769418]],
  earth: [[1.00000261,0.01671123,-0.00001531,100.46457166,102.93768193,0],[0.00000562,-0.00004392,-0.01294668,35999.37244981,0.32327364,0]],
  mars: [[1.52371034,0.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891],[0.00001847,0.00007882,-0.00813131,19140.30268499,0.44441088,-0.29257343]],
  jupiter: [[5.20288700,0.04838624,1.30439695,34.39644051,14.72847983,100.47390909],[-0.00011607,-0.00013253,-0.00183714,3034.74612775,0.21252668,0.20469106]],
  saturn: [[9.53667594,0.05386179,2.48599187,49.95424423,92.59887831,113.66242448],[-0.00125060,-0.00050991,0.00193609,1222.49362201,-0.41897216,-0.28867794]],
  uranus: [[19.18916464,0.04725744,0.77263783,313.23810451,170.95427630,74.01692503],[-0.00196176,-0.00004397,-0.00242939,428.48202785,0.40805281,0.04240589]],
  neptune: [[30.06992276,0.00859048,1.77004347,-55.12002969,44.96476227,131.78422574],[0.00026291,0.00005105,0.00035372,218.45945325,-0.32241464,-0.00508664]],
};
export const PLANETS = [
  {id:'mercury',name:'Mercury',tag:'THE SWIFT PLANET',type:'Terrestrial planet',color:'#bab1a7',diameter:4879,gravity:3.7,day:'58.6 Earth days',year:'88 days',moons:0,temp:'167°C',distance:'0.39 AU',inclination:0.03,lead:'A world of extremes.',description:'The smallest planet circles the Sun faster than any other. Ancient craters preserve a record of billions of years of impacts.',fact:'A year on Mercury lasts only 88 Earth days.'},
  {id:'venus',name:'Venus',tag:'THE VEILED PLANET',type:'Terrestrial planet',color:'#e9bf81',diameter:12104,gravity:8.87,day:'243 Earth days',year:'225 days',moons:0,temp:'464°C',distance:'0.72 AU',inclination:177.4,lead:'Beauty above. Fire below.',description:'An enveloping atmosphere of carbon dioxide traps heat beneath thick clouds of sulfuric acid. Its surface is hotter than Mercury’s.',fact:'Venus spins backward compared with most planets.'},
  {id:'earth',name:'Earth',tag:'OUR PALE BLUE DOT',type:'Terrestrial planet',color:'#79baff',diameter:12742,gravity:9.81,day:'23h 56m',year:'365.25 days',moons:1,temp:'15°C',distance:'1.00 AU',inclination:23.44,lead:'The only home we know.',description:'An ocean-covered world with an active atmosphere and an extraordinary variety of life. Liquid water shapes its surface.',fact:'Earth is the only known world with life.'},
  {id:'mars',name:'Mars',tag:'THE RED PLANET',type:'Terrestrial planet',color:'#ec8767',diameter:6779,gravity:3.71,day:'24h 37m',year:'687 days',moons:2,temp:'−65°C',distance:'1.52 AU',inclination:25.19,lead:'A frontier written in rust.',description:'Rust-colored deserts, colossal volcanoes and ancient river valleys tell of a planet that once had flowing surface water.',fact:'Olympus Mons is the tallest known volcano in the Solar System.'},
  {id:'jupiter',name:'Jupiter',tag:'THE GIANT',type:'Gas giant',color:'#d6ab91',diameter:139820,gravity:24.79,day:'9h 56m',year:'11.86 years',moons:95,temp:'−110°C',distance:'5.20 AU',inclination:3.13,lead:'A storm larger than Earth.',description:'The largest planet is wrapped in turbulent cloud bands. Its Great Red Spot is a vast storm that has endured for centuries.',fact:'Jupiter could contain roughly 1,300 Earths by volume.'},
  {id:'saturn',name:'Saturn',tag:'THE RINGED WORLD',type:'Gas giant',color:'#e0c18c',diameter:116460,gravity:10.44,day:'10h 42m',year:'29.45 years',moons:274,temp:'−140°C',distance:'9.54 AU',inclination:26.73,lead:'The art of gravity.',description:'An immense ring system of icy fragments circles Saturn. Its largest moon, Titan, has lakes and seas of liquid hydrocarbons.',fact:'Saturn’s rings span hundreds of thousands of kilometers, yet are remarkably thin.'},
  {id:'uranus',name:'Uranus',tag:'THE SIDEWAYS PLANET',type:'Ice giant',color:'#a7e7e6',diameter:50724,gravity:8.69,day:'17h 14m',year:'84 years',moons:28,temp:'−195°C',distance:'19.2 AU',inclination:97.77,lead:'An ocean-colored mystery.',description:'Methane in Uranus’s atmosphere helps give it a pale cyan hue. Its extreme axial tilt causes unusual seasons.',fact:'Uranus effectively rolls along its orbit on its side.'},
  {id:'neptune',name:'Neptune',tag:'BEYOND THE BLUE',type:'Ice giant',color:'#4b85f8',diameter:49244,gravity:11.15,day:'16h 6m',year:'164.8 years',moons:16,temp:'−200°C',distance:'30.1 AU',inclination:28.32,lead:'Where the sunlight fades.',description:'The most distant major planet is a deep blue world of fast winds, faint rings and a moon named Triton that orbits backward.',fact:'Sunlight takes more than four hours to reach Neptune.'},
];
export const SUN = {id:'sun',name:'The Sun',tag:'OUR STAR',type:'G-type main-sequence star',color:'#ffc06d',diameter:1392700,gravity:274,day:'~25 days (equator)',year:'Galactic orbit',moons:'—',temp:'5,500°C',distance:'0 AU',lead:'The star at the center.',description:'Our Sun contains more than 99.8 percent of the Solar System’s total mass. Its light and gravity govern the planets.',fact:'Sunlight takes approximately eight minutes to reach Earth.'};
export function julianDate(date) { return date.getTime() / 86400000 + 2440587.5; }
export function orbitalPosition(id, date) {
  const item = ELEMENTS[id];
  if (!item || !(date instanceof Date) || !Number.isFinite(date.getTime())) throw new Error('Invalid planet or time');
  const T=(julianDate(date)-2451545)/36525;
  const [origin,rate]=item;
  const [a,e,i,l,w,node]=origin.map((v,k)=>v+rate[k]*T);
  const M=(((l-w+180)%360+360)%360-180)*DEG;
  let E=M;
  for(let n=0;n<20;n++){const d=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));E-=d;if(Math.abs(d)<1e-13)break;}
  const x=a*(Math.cos(E)-e),y=a*Math.sqrt(1-e*e)*Math.sin(E);
  const omega=(w-node)*DEG,omegaNode=node*DEG,incl=i*DEG;
  const cW=Math.cos(omega),sW=Math.sin(omega),cN=Math.cos(omegaNode),sN=Math.sin(omegaNode),cI=Math.cos(incl),sI=Math.sin(incl);
  return {x:(cW*cN-sW*sN*cI)*x+(-sW*cN-cW*sN*cI)*y,
    y:(cW*sN+sW*cN*cI)*x+(-sW*sN+cW*cN*cI)*y,
    z:(sW*sI)*x+(cW*sI)*y};
}
export function scenePosition(heliocentric,scientific=false){
  const r=Math.hypot(heliocentric.x,heliocentric.y,heliocentric.z);
  const scale=scientific?22:(r>0?(17+25*Math.sqrt(r))/r:0);
  return {x:heliocentric.x*scale,y:heliocentric.z*scale,z:heliocentric.y*scale};
}
export function distanceAU(v){return Math.hypot(v.x,v.y,v.z);}

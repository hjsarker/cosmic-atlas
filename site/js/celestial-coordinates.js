/**
 * Fixed-frame sky coordinates for the J2000.0 ecliptic Solar System scene.
 * All values are unit vectors centered on the Solar System barycenter.
 */
export const OBLIQUITY=23.4392911*Math.PI/180;

export function equatorialToScene(raDegrees,decDegrees){
  const ra=raDegrees*Math.PI/180,dec=decDegrees*Math.PI/180;
  const x=Math.cos(dec)*Math.cos(ra),y=Math.cos(dec)*Math.sin(ra),z=Math.sin(dec);
  const ye=Math.cos(OBLIQUITY)*y+Math.sin(OBLIQUITY)*z;
  const ze=-Math.sin(OBLIQUITY)*y+Math.cos(OBLIQUITY)*z;
  return {x,y:ze,z:ye};
}

export function sceneToGalactic(v){
  const ex=v.x,ey=v.z,ez=v.y;
  const qx=ex;
  const qy=Math.cos(OBLIQUITY)*ey-Math.sin(OBLIQUITY)*ez;
  const qz=Math.sin(OBLIQUITY)*ey+Math.cos(OBLIQUITY)*ez;
  const gx=-.0548755604*qx-.8734370902*qy-.4838350155*qz;
  const gy=.4941094279*qx-.4448296300*qy+.7469822445*qz;
  const gz=-.8676661490*qx-.1980763734*qy+.4559837762*qz;
  return {longitude:(Math.atan2(gy,gx)*180/Math.PI+360)%360,
          latitude:Math.asin(Math.max(-1,Math.min(1,gz)))*180/Math.PI};
}

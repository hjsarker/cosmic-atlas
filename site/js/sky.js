/**
 * Gaia EDR3 Galactic sky in the same J2000 ecliptic axes used by the planets.
 * Scene axes: X = ecliptic X, Y = ecliptic Z, Z = ecliptic Y.
 * Gaia panoramic pixels: Galactic longitude +180..-180 from left to right,
 * latitude +90..-90 from top to bottom, Galactic centre in the middle.
 * Rendered around the camera to avoid background parallax at Solar System scales.
 */
import * as THREE from 'three';

const GALAXY_URL='assets/gaia-sky.jpg';
const STARS_URL='data/bright-stars.json';
const SKY_RADIUS=2500;
const OBLIQUITY=23.4392911*Math.PI/180;
const TAU=2*Math.PI;

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

function stellarColor(bv){
  // Approximate color by B-V index; rendering representation, not calibrated photometry.
  if(bv==null)return new THREE.Color('#d9e4ff');
  if(bv<-.05)return new THREE.Color('#a8c7ff');
  if(bv<.35)return new THREE.Color('#cadcff');
  if(bv<.7)return new THREE.Color('#faf5e4');
  if(bv<1.1)return new THREE.Color('#ffe3b4');
  return new THREE.Color('#ffbd8e');
}

const fragmentShader=`
  uniform sampler2D skyMap;
  uniform float exposure;
  varying vec3 direction;
  const float PI=3.141592653589793;
  void main(){
    // J2000 ecliptic -> J2000 equatorial -> IAU Galactic.
    vec3 e=normalize(vec3(direction.x,direction.z,direction.y));
    vec3 q=vec3(e.x,
       .917482062*e.y-.397777156*e.z,
       .397777156*e.y+.917482062*e.z);
    vec3 g=vec3(
       -.0548755604*q.x-.8734370902*q.y-.4838350155*q.z,
        .4941094279*q.x-.4448296300*q.y+.7469822445*q.z,
       -.8676661490*q.x-.1980763734*q.y+.4559837762*q.z);
    float longitude=atan(g.y,g.x);
    // Astronomical sky convention: Galactic longitude increases to the left.
    vec2 uv=vec2(fract(.5-longitude/(2.*PI)),.5+asin(clamp(g.z,-1.,1.))/PI);
    vec3 col=texture2D(skyMap,uv).rgb;
    // This is a survey-composite photograph, not a naked-eye luminance simulation.
    col=pow(col,vec3(.86))*exposure;
    gl_FragColor=vec4(col,1.);
  }
`;

export class CelestialSky {
  constructor(scene,camera,mobile=false){
    this.camera=camera;this.mobile=mobile;this.mode='cinematic';
    this.group=new THREE.Group();
    this.group.name='Gaia EDR3 celestial sphere';
    scene.add(this.group);
    this.texture=new THREE.TextureLoader().load(GALAXY_URL,()=>{
      this.ready=true;
    },undefined,()=>{
      this.ready=false;
      console.warn('ESA/Gaia panorama not available. Showing catalog stars on dark sky.');
      this.dome.visible=false;
    });
    this.texture.colorSpace=THREE.SRGBColorSpace;
    this.texture.wrapS=THREE.RepeatWrapping;
    this.texture.minFilter=THREE.LinearMipmapLinearFilter;
    this.texture.anisotropy=mobile?2:8;
    const material=new THREE.ShaderMaterial({
      uniforms:{skyMap:{value:this.texture},exposure:{value:mobile?.62:.75}},
      vertexShader:`varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader,side:THREE.BackSide,depthWrite:false,depthTest:true,fog:false
    });
    this.dome=new THREE.Mesh(new THREE.SphereGeometry(SKY_RADIUS,64,40),material);
    this.dome.name='ESA Gaia star survey background';
    this.dome.renderOrder=-100;
    this.group.add(this.dome);
    this.stars=null;
    this.loadStars();
  }
  async loadStars(){
    try{
      const response=await fetch(STARS_URL);
      if(!response.ok)throw Error('star data HTTP '+response.status);
      const data=await response.json();
      if(data.source!=='HYG v4.1' || !Array.isArray(data.stars) || data.stars.length<1000)throw Error('Invalid star catalogue');
      const items=this.mobile?data.stars.filter(s=>s[2]<=5.5):data.stars;
      const coords=new Float32Array(items.length*3),colors=new Float32Array(items.length*3),
            mags=new Float32Array(items.length);
      for(let i=0;i<items.length;i++){
        const [ra,dec,mag,bv]=items[i],v=equatorialToScene(ra,dec),c=stellarColor(bv);
        coords[3*i]=v.x*(SKY_RADIUS-20);
        coords[3*i+1]=v.y*(SKY_RADIUS-20);
        coords[3*i+2]=v.z*(SKY_RADIUS-20);
        const intensity=Math.max(.35,Math.min(1.4,1.5-mag*.13));
        colors[3*i]=c.r*intensity;
        colors[3*i+1]=c.g*intensity;
        colors[3*i+2]=c.b*intensity;
        mags[i]=mag;
      }
      const geo=new THREE.BufferGeometry();
      geo.setAttribute('position',new THREE.BufferAttribute(coords,3));
      geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
      geo.setAttribute('magnitude',new THREE.BufferAttribute(mags,1));
      const mat=new THREE.ShaderMaterial({
        transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,
        uniforms:{brightness:{value:this.mobile?.68:.86},pixelRatio:{value:Math.min(2,window.devicePixelRatio||1)}},
        vertexShader:`
          attribute vec3 color;attribute float magnitude;
          varying vec3 tint;uniform float pixelRatio;
          void main(){
            tint=color;
            vec4 clip=modelViewMatrix*vec4(position,1.);
            gl_Position=projectionMatrix*clip;
            float size=clamp(4.8-magnitude*.49,1.3,6.0);
            gl_PointSize=size*pixelRatio;
          }`,
        fragmentShader:`
          varying vec3 tint;uniform float brightness;
          void main(){
            vec2 p=gl_PointCoord*2.-1.;
            float r=dot(p,p);
            float halo=exp(-r*3.7),core=exp(-r*12.0);
            float alpha=(core*.9+halo*.3)*brightness;
            gl_FragColor=vec4(tint,alpha);
          }`
      });
      this.stars=new THREE.Points(geo,mat);
      this.stars.name='HYG catalogue bright stars';
      this.stars.renderOrder=-90;
      this.group.add(this.stars);
    }catch(error){console.warn('Catalog stars unavailable:',error.message);}
  }
  setMode(mode){
    this.mode=mode==='scientific'?'scientific':'cinematic';
    // Both modes are directionally aligned. Only display exposure changes.
    this.dome.material.uniforms.exposure.value=this.mode==='scientific'?.40:(this.mobile?.62:.75);
    if(this.stars)this.stars.material.uniforms.brightness.value=this.mode==='scientific'?.47:(this.mobile?.68:.86);
  }
  update(){this.group.position.copy(this.camera.position);}
  dispose(){
    this.group.parent?.remove(this.group);
    this.dome.geometry.dispose();this.dome.material.dispose();
    this.texture.dispose();this.stars?.geometry.dispose();this.stars?.material.dispose();
  }
}

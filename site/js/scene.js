import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {PLANETS,SUN,scenePosition} from './astronomy.js';
import {positionAt} from './ephemeris.js';

const TAU=Math.PI*2;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const pvec=pos=>new THREE.Vector3(pos.x,pos.y,pos.z);
const TEXTURE_ROOT='assets/';
const FALLBACK_TEXTURE_ROOT='https://cdn.jsdelivr.net/gh/Sanghel/solar-system-3d@develop/public/textures/';
const RADII={sun:8.4,mercury:1.2,venus:1.8,earth:2.0,mars:1.5,jupiter:5.35,saturn:4.75,uranus:3.3,neptune:3.2};

function radialTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(128,128,3,128,128,127);
  g.addColorStop(0,'rgba(255,250,214,1)');g.addColorStop(.08,'rgba(255,205,125,.91)');g.addColorStop(.26,'rgba(255,118,47,.30)');g.addColorStop(.55,'rgba(250,82,32,.08)');g.addColorStop(1,'rgba(255,85,30,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,256,256);
  return new THREE.CanvasTexture(canvas);
}
function starTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const c=canvas.getContext('2d'),grad=c.createRadialGradient(32,32,0,32,32,32);
  grad.addColorStop(0,'rgba(255,255,255,1)');grad.addColorStop(.12,'rgba(230,245,255,.88)');grad.addColorStop(.35,'rgba(150,200,255,.3)');grad.addColorStop(1,'rgba(100,130,255,0)');
  c.fillStyle=grad;c.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(canvas);
}
function atmosphereMaterial(color,alpha=.72){
  return new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.BackSide,
    uniforms:{glowColor:{value:new THREE.Color(color)},strength:{value:alpha}},
    vertexShader:`varying vec3 vNormal;varying vec3 vWorld;void main(){vNormal=normalize(mat3(modelMatrix)*normal);vec4 pos=modelMatrix*vec4(position,1.0);vWorld=pos.xyz;gl_Position=projectionMatrix*viewMatrix*pos;}`,
    fragmentShader:`varying vec3 vNormal;varying vec3 vWorld;uniform vec3 glowColor;uniform float strength;void main(){vec3 toCamera=normalize(cameraPosition-vWorld);float fresnel=pow(1.-abs(dot(normalize(vNormal),toCamera)),3.5);gl_FragColor=vec4(glowColor,fresnel*strength);}`});
}
export class CosmicScene {
  constructor(canvas,callbacks={}){
    this.canvas=canvas;this.callbacks=callbacks;
    const mobile=window.matchMedia('(max-width: 760px)').matches;
    this.mobile=mobile;
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:!mobile,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,mobile?1.65:2));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=.84;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#01030b');
    this.scene.fog=new THREE.FogExp2(0x030716,.00038);
    this.camera=new THREE.PerspectiveCamera(47,1,.05,6000);
    this.camera.position.set(65,95,200);
    this.controls=new OrbitControls(this.camera,canvas);
    this.controls.enableDamping=true;this.controls.dampingFactor=.055;
    this.controls.minDistance=2.3;this.controls.maxDistance=1300;
    this.controls.rotateSpeed=.52;this.controls.zoomSpeed=.7;
    this.controls.autoRotate=false;
    this.controls.enablePan=!mobile;
    this.directional=new THREE.PointLight(0xffebca,480,0,1);this.scene.add(this.directional);
    // A subtle camera-side fill makes the unlit hemisphere explorable without
    // removing the day/night boundary. This is an artistic viewing aid, not sunlight.
    this.scene.add(new THREE.AmbientLight(0xa8bedf,.22));
    this.fillLight=new THREE.DirectionalLight(0xcbdfff,.62);
    this.fillLight.position.copy(this.camera.position);
    this.fillLight.target.position.copy(this.controls.target);
    this.scene.add(this.fillLight,this.fillLight.target);
    this.balancedLighting=true;
    this.spheres={};this.orbits={};this.halos={};this.labels={};
    this.textureLoader=new THREE.TextureLoader();
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.planetObjects=[];this.target='overview';this.pendingFlight=null;
    this.scientific=false;this.orbitsVisible=true;this.labelsVisible=true;this.time=new Date();this.frame=0;
    this.bloomEnabled=!mobile;
    this.makeStars();this.makeSun();this.makePlanets();this.makeOrbits();this.buildPostprocessing();
    this.fit();window.addEventListener('resize',this.fitBound=()=>this.fit());
    canvas.addEventListener('pointerdown',e=>{this.down={x:e.clientX,y:e.clientY}});
    canvas.addEventListener('pointerup',e=>this.pick(e));
    this.clock=new THREE.Clock();this.animateBound=()=>this.animate();this.animating=true;this.animate();
  }
  loadTexture(name,material){
    const apply=(texture)=>{
      texture.colorSpace=THREE.SRGBColorSpace;
      texture.anisotropy=Math.min(this.renderer.capabilities.getMaxAnisotropy(),16);
      texture.minFilter=THREE.LinearMipmapLinearFilter;
      // Do not tint real planetary maps with the fallback placeholder color.
      material.color.set(0xffffff);
      material.map=texture;
      if(name==='mars'||name==='mercury'){
        material.bumpMap=texture;
        material.bumpScale=name==='mars'?.024:.016;
      }
      material.needsUpdate=true;
    };
    const highDetail=!this.mobile&&['earth','mars','jupiter','saturn'].includes(name);
    const filename=name+(highDetail?'-hd':'')+'.jpg';
    this.textureLoader.load(TEXTURE_ROOT+filename,apply,undefined,()=>{
      this.textureLoader.load(FALLBACK_TEXTURE_ROOT+name+'.jpg',apply,undefined,()=>{});
    });
  }
  makeStars(){
    const count=this.mobile?5200:11000,pts=new Float32Array(count*3),colors=new Float32Array(count*3),sizes=[];
    for(let i=0;i<count;i++){
      const r=420+Math.random()*1900,z=2*Math.random()-1,a=Math.random()*TAU,s=Math.sqrt(1-z*z);
      pts[i*3]=r*s*Math.cos(a);pts[i*3+1]=r*z;pts[i*3+2]=r*s*Math.sin(a);
      let tint=Math.random();colors[i*3]=tint>.8?1:.67+Math.random()*.25;colors[i*3+1]=tint>.8?.71:.77+Math.random()*.2;colors[i*3+2]=tint>.8?.61:1;sizes.push(1);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(pts,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    const stars=new THREE.Points(geometry,new THREE.PointsMaterial({size:this.mobile?1.6:2.35,sizeAttenuation:false,transparent:true,opacity:.92,vertexColors:true,depthWrite:false}));this.scene.add(stars);
    const brightCount=260,bright=new Float32Array(brightCount*3);
    for(let i=0;i<brightCount;i++){const r=340+Math.random()*1600,a=Math.random()*TAU,z=Math.random()*2-1,s=Math.sqrt(1-z*z);bright[i*3]=r*s*Math.cos(a);bright[i*3+1]=r*z;bright[i*3+2]=r*s*Math.sin(a);}
    const brightG=new THREE.BufferGeometry();brightG.setAttribute('position',new THREE.BufferAttribute(bright,3));
    const texture=starTexture();this.scene.add(new THREE.Points(brightG,new THREE.PointsMaterial({map:texture,color:0xc4dafa,transparent:true,opacity:.75,size:this.mobile?12:17,sizeAttenuation:false,depthWrite:false,blending:THREE.AdditiveBlending})));
    // Fine nebulous haze is decorative rather than an astronomical sky chart.
    const haze=new THREE.Sprite(new THREE.SpriteMaterial({map:radialTexture(),color:0x304b9e,transparent:true,opacity:.09,blending:THREE.AdditiveBlending,depthWrite:false}));haze.position.set(-630,180,-850);haze.scale.set(1450,700,1);this.scene.add(haze);
  }
  makeSun(){
    const geometry=new THREE.SphereGeometry(RADII.sun,this.mobile?48:96,this.mobile?32:64);
    const material=new THREE.MeshBasicMaterial({color:0xffd6a0});
    const sun=new THREE.Mesh(geometry,material);sun.name='sun';sun.userData.id='sun';this.scene.add(sun);this.planetObjects.push(sun);this.spheres.sun={mesh:sun,radius:RADII.sun};
    this.loadTexture('sun',material);
    const glowMap=radialTexture();const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowMap,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:0xffab56}));
    halo.scale.set(52,52,1);this.scene.add(halo);this.halos.sun=halo;
    const outer=new THREE.Sprite(new THREE.SpriteMaterial({map:glowMap,transparent:true,blending:THREE.AdditiveBlending,opacity:.24,depthWrite:false,color:0xff6f39}));outer.scale.set(118,118,1);this.scene.add(outer);
  }
  makePlanets(){
    for(const planet of PLANETS){
      const radius=RADII[planet.id],group=new THREE.Group();group.name=planet.id;this.scene.add(group);
      const sphere=new THREE.Mesh(new THREE.SphereGeometry(radius,this.mobile?48:96,this.mobile?32:64),
        new THREE.MeshStandardMaterial({color:planet.color,roughness:planet.id==='earth'?.83:1,metalness:0}));
      sphere.name=planet.id;sphere.userData.id=planet.id;sphere.rotation.z=planet.inclination*Math.PI/180;
      group.add(sphere);this.planetObjects.push(sphere);
      this.loadTexture(planet.id,sphere.material);
      if(planet.id==='earth'){
        const shell=new THREE.Mesh(new THREE.SphereGeometry(radius*1.047,64,40),atmosphereMaterial('#53aaff',.82));group.add(shell);
        const cloudMaterial=new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.045,depthWrite:false,roughness:1});
        const clouds=new THREE.Mesh(new THREE.SphereGeometry(radius*1.018,64,40),cloudMaterial);
        clouds.userData.isCloud=true;group.add(clouds);
        // Procedural sparse cloud coverage provides subtle depth without implying live clouds.
        const cloudCanvas=document.createElement('canvas');cloudCanvas.width=1024;cloudCanvas.height=512;
        const ctx=cloudCanvas.getContext('2d');ctx.clearRect(0,0,1024,512);
        for(let j=0;j<135;j++){let x=Math.random()*1024,y=Math.random()*512,w=8+Math.random()*70,h=2+Math.random()*17;ctx.fillStyle='rgba(250,250,255,'+(.025+Math.random()*.08)+')';ctx.beginPath();ctx.ellipse(x,y,w,h,Math.random()*.8,0,TAU);ctx.fill();}
        const texture=new THREE.CanvasTexture(cloudCanvas);texture.colorSpace=THREE.SRGBColorSpace;cloudMaterial.map=texture;cloudMaterial.needsUpdate=true;this.clouds=clouds;
      }
      if(planet.id==='venus'||planet.id==='neptune'||planet.id==='uranus'){
        const haze=new THREE.Mesh(new THREE.SphereGeometry(radius*1.036,48,32),atmosphereMaterial(planet.color,.53));group.add(haze);
      }
      if(planet.id==='saturn'||planet.id==='uranus'){
        const ri=radius*(planet.id==='saturn'?1.31:1.51),ro=radius*(planet.id==='saturn'?2.23:1.85);
        const mesh=this.makeRings(ri,ro,planet.id==='saturn');mesh.rotation.x=Math.PI/2.7;mesh.rotation.y=.17;
        group.add(mesh);this.rings=this.rings||{};this.rings[planet.id]=mesh;
      }
      this.spheres[planet.id]={group,mesh:sphere,radius,planet};
    }
  }
  makeRings(inner,outer,saturn){
    const n=160,verts=[],uvs=[],indices=[];
    for(let j=0;j<=n;j++){
      const a=j/n*TAU,s=Math.sin(a),c=Math.cos(a);
      for(let k=0;k<2;k++){const r=k?outer:inner;verts.push(c*r,0,s*r);uvs.push(k,j/n);}
      if(j<n){let i=j*2;indices.push(i,i+1,i+2,i+1,i+3,i+2);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
    const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
      uniforms:{tint:{value:new THREE.Color(saturn?'#e9d0a4':'#b6dbde')}},
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`varying vec2 vUv;uniform vec3 tint;void main(){float r=vUv.x;float bands=sin(r*115.)*.16+sin(r*320.)*.07+sin(r*31.)*.11;float cassini=1.-.80*smoothstep(.57,.585,r)*(1.-smoothstep(.61,.625,r));float a=(.28+.38*sin(r*3.14159265))*(.7+bands)*cassini;a*=smoothstep(0.,.06,r)*(1.-smoothstep(.91,1.,r));gl_FragColor=vec4(tint*(.80+.3*r+bands),a);}`});
    return new THREE.Mesh(geometry,material);
  }
  makeOrbits(){
    for(const planet of PLANETS){
      const position=new Float32Array((360+1)*3);
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(position,3));
      const color=new THREE.Color(planet.color);
      const mesh=new THREE.LineLoop(geo,new THREE.LineBasicMaterial({color:color.lerp(new THREE.Color('#344359'),.8),transparent:true,opacity:.44,depthWrite:false}));
      mesh.name='orbit-'+planet.id;this.scene.add(mesh);this.orbits[planet.id]=mesh;
    }
  }
  refreshOrbits(){
    for(const planet of PLANETS){
      const orbit=this.orbits[planet.id];
      const date=new Date(this.time.getTime());
      const period=Number.parseFloat(planet.year)*(planet.year.includes('years')?365.25:1)*86400000;
      const positions=orbit.geometry.attributes.position;
      for(let i=0;i<=360;i++){
        const dt=new Date(date.getTime()+period*(i/360-.5));
        const pt=scenePosition(positionAt(planet.id,dt),this.scientific);
        positions.setXYZ(i,pt.x,pt.y,pt.z);
      }
      positions.needsUpdate=true;orbit.geometry.computeBoundingSphere();
    }
  }
  buildPostprocessing(){
    this.composer=new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.55,.45,.84);
    this.composer.addPass(this.bloom);this.composer.addPass(new OutputPass());
    this.setBloom(this.bloomEnabled);
  }
  setBloom(enabled){this.bloomEnabled=enabled;this.bloom.enabled=enabled;}
  setBalancedLighting(enabled){
    this.balancedLighting=enabled;
    this.fillLight.intensity=enabled?.62:0;
  }
  setOrbits(enabled){this.orbitsVisible=enabled;for(const m of Object.values(this.orbits))m.visible=enabled;}
  setScientific(enabled){this.scientific=enabled;this.updatePositions(true);this.refreshOrbits();if(this.target==='overview')this.goOverview();else this.focus(this.target);}
  fit(){
    const w=this.canvas.clientWidth||innerWidth,h=this.canvas.clientHeight||innerHeight;
    this.camera.aspect=w/h;this.camera.fov=w<720?57:47;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);this.composer?.setSize(w,h);
  }
  setDate(date){if(Number.isNaN(date.getTime()))return;this.time=date;this.updatePositions(false);this.refreshOrbits();}
  updatePositions(updateTarget=false){
    for(const planet of PLANETS){const p=scenePosition(positionAt(planet.id,this.time),this.scientific);this.spheres[planet.id].group.position.set(p.x,p.y,p.z);}
    if(updateTarget && this.target!=='overview' && this.spheres[this.target]){
      const g=this.spheres[this.target].group.position;this.controls.target.copy(g);
    }
  }
  focus(id){
    const entry=this.spheres[id];if(!entry)return;
    this.target=id;this.controls.autoRotate=false;
    this.controls.minDistance=Math.max(2.3,entry.radius*1.3);
    const location=entry.group?.position||new THREE.Vector3();
    const distance=id==='sun'?34:Math.max(entry.radius*4.35,7.5);
    const currentDirection=this.camera.position.clone().sub(this.controls.target).normalize();
    if(currentDirection.lengthSq()<.5)currentDirection.set(.66,.30,.71).normalize();
    // Favor a three-quarter illuminated view for readable real surface textures.
    // The camera is positioned relative to the Sun, not a fixed world direction.
    const sunward=location.clone().negate().normalize();
    const tangent=new THREE.Vector3(-sunward.z,0,sunward.x).normalize();
    const viewpoint=id==='sun'?new THREE.Vector3(.83,.34,1).normalize():
      sunward.multiplyScalar(.84).addScaledVector(tangent,.44).add(new THREE.Vector3(0,.22,0)).normalize();
    const endpoint=location.clone().add(viewpoint.multiplyScalar(distance));
    this.startFlight(location.clone(),endpoint,1800);
    this.callbacks.focus?.(id);
  }
  goOverview(){
    this.target='overview';this.controls.minDistance=2.3;const endpoint=this.scientific?new THREE.Vector3(270,470,930):new THREE.Vector3(65,98,202);
    this.startFlight(new THREE.Vector3(0,0,0),endpoint,1900);this.callbacks.focus?.('overview');
  }
  startFlight(target,position,duration){
    this.pendingFlight={fromPos:this.camera.position.clone(),fromTarget:this.controls.target.clone(),toPos:position,toTarget:target,started:performance.now(),duration};
  }
  pick(event){
    if(!this.down || Math.hypot(event.clientX-this.down.x,event.clientY-this.down.y)>8 || this.pendingFlight)return;
    const rect=this.canvas.getBoundingClientRect();this.pointer.set(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const hits=this.raycaster.intersectObjects(this.planetObjects,false);
    if(hits[0])this.focus(hits[0].object.userData.id);
  }
  cameraInfo(){return {camera:this.camera,objects:this.spheres};}
  animate(){
    if(!this.animating)return;
    requestAnimationFrame(this.animateBound);
    const dt=Math.min(this.clock.getDelta(),.05);this.frame++;
    if(this.pendingFlight){
      const f=this.pendingFlight;const t=clamp((performance.now()-f.started)/f.duration,0,1);const eased=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
      this.camera.position.lerpVectors(f.fromPos,f.toPos,eased);
      this.controls.target.lerpVectors(f.fromTarget,f.toTarget,eased);
      if(t>=1)this.pendingFlight=null;
    }else if(this.target!=='overview' && this.target!=='sun'){
      const p=this.spheres[this.target].group.position;
      const delta=p.clone().sub(this.controls.target);
      this.controls.target.add(delta);this.camera.position.add(delta);
    }
    const rotationSpeed=dt*.04;
    this.spheres.sun.mesh.rotation.y+=rotationSpeed*.12;
    for(const planet of PLANETS){this.spheres[planet.id].mesh.rotation.y+=rotationSpeed*(planet.id==='jupiter'?2:1);}
    if(this.clouds)this.clouds.rotation.y+=rotationSpeed*.24;
    this.controls.update();
    // Keep the soft fill direction aligned to the visitor's view as they orbit.
    this.fillLight.position.copy(this.camera.position);
    this.fillLight.target.position.copy(this.controls.target);
    this.composer.render();
    if(this.frame%2===0)this.callbacks.frame?.(this.camera,this.spheres);
  }
  destroy(){this.animating=false;window.removeEventListener('resize',this.fitBound);this.controls.dispose();this.renderer.dispose();}
}

import * as THREE from 'three';
import {CosmicScene} from './scene.js';
import {PLANETS,SUN} from './astronomy.js';
import {loadEphemeris,ephemerisInfo,isHorizonsAt} from './ephemeris.js';

const $=s=>document.querySelector(s);
const planetMetadata=[SUN,...PLANETS];
let scene,selected='overview',playing=true,simDate=new Date(),speed=1,lastFrame=performance.now(),lastUi=0,hitFocus=false,hasExplored=false;
const RADIANT=['#d7dfe9','#e7be92','#3f8ed1','#bf6f4c','#d0a98b','#d7b181','#a5e3e4','#538bf1'];
const dateFormat=new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'});
function isMobile(){return matchMedia('(max-width: 760px)').matches;}
function makePlanets(){
  const all=[SUN,...PLANETS];
  $('#planetList').innerHTML=all.map((p,i)=>`<button class="planet-button" type="button" data-destination="${p.id}" aria-label="Explore ${p.name}" aria-pressed="false"><span class="planet-visual" style="--planet-color:${p.color};--planet-texture:url('assets/${p.id}.jpg')" aria-hidden="true"></span><span class="planet-text">${p.name}</span></button>`).join('');
  $('#planetList').addEventListener('click',e=>{const b=e.target.closest('[data-destination]');if(b)scene?.focus(b.dataset.destination);});
}
function openBody(id){
  if(!scene)return;
  selected=id;
  if(id!=='overview')hasExplored=true;
  document.body.classList.toggle('focused',id!=='overview');
  $('#intro').hidden=id!=='overview'||hasExplored;
  $('#detail').hidden=id==='overview';
  $('#detail').classList.remove('expanded');
  $('#detailsToggle').setAttribute('aria-expanded','false');
  $('#detailsToggle').textContent='PLANET DETAILS +';
  $('#sceneHint').hidden=id!=='overview'||hasExplored;
  // Other-world labels belong in the overview, not across a planet close-up.
  $('#planetLabels').hidden=id!=='overview'||!scene.labelsVisible;
  document.querySelectorAll('[data-destination]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.destination===id)));
  if(id==='overview')return;
  const data=planetMetadata.find(x=>x.id===id);if(!data)return;
  $('#detailTag').textContent=(id==='sun'?'CENTER OF OUR SYSTEM':data.tag)+' / '+data.type.toUpperCase();
  $('#detailName').textContent=data.name.toUpperCase();
  $('#detailLead').textContent=data.lead;
  $('#detailDescription').textContent=data.description;
  $('#statDiameter').textContent=data.diameter.toLocaleString('en-US')+' km';
  $('#statDay').textContent=data.day;
  $('#statYear').textContent=data.year;
  $('#statGravity').textContent=data.gravity+' m/s²';
  $('#detailFact').textContent=data.fact;
}
function setupLabels(){
  const panel=$('#planetLabels');
  for(const p of PLANETS){const b=document.createElement('button');b.className='world-label';b.type='button';b.textContent=p.name.toUpperCase();b.dataset.id=p.id;b.setAttribute('aria-label','Fly to '+p.name);b.addEventListener('click',()=>scene?.focus(p.id));panel.appendChild(b);}
}
const reusable=new THREE.Vector3();
function updateLabels(camera,objects){
  if(!scene||!scene.labelsVisible||selected!=='overview')return;
  const rect=$('#universe').getBoundingClientRect();
  for(const label of $('#planetLabels').children){
    const object=objects[label.dataset.id];if(!object)continue;
    reusable.copy(object.group.position).project(camera);
    const onScreen=reusable.z<1&&reusable.z>-1&&Math.abs(reusable.x)<.95&&Math.abs(reusable.y)<.9;
    const visible=onScreen && !(selected===label.dataset.id);
    label.style.display=visible?'block':'none';
    if(visible){const x=(reusable.x*.5+.5)*rect.width;const y=(-reusable.y*.5+.5)*rect.height;
      label.style.transform=`translate3d(${x}px,${y}px,0) translate(-50%,${Math.max(19,object.radius*5)}px)`;}
  }
}
function renderDate(){
  $('#dateDisplay').textContent=dateFormat.format(simDate).toUpperCase();
  const yyyy=simDate.getUTCFullYear(),month=String(simDate.getUTCMonth()+1).padStart(2,'0'),day=String(simDate.getUTCDate()).padStart(2,'0');
  if(document.activeElement!==$('#dateInput'))$('#dateInput').value=`${yyyy}-${month}-${day}`;
  const info=ephemerisInfo();
  $('#sourceShort').textContent=isHorizonsAt(simDate)?'JPL HORIZONS DATA':'JPL ORBITAL MODEL';
  $('#ephemerisDetail').textContent='ORBITAL SOURCE: '+(isHorizonsAt(simDate)?'NASA/JPL HORIZONS SAMPLES':'NASA/JPL KEPLERIAN ELEMENTS');
}
function loop(now){
  requestAnimationFrame(loop);
  if(document.hidden){lastFrame=now;return;}
  const dt=Math.min((now-lastFrame)/1000,.1);lastFrame=now;
  if(playing && scene){simDate=new Date(simDate.getTime()+dt*speed*86400000);if(simDate.getUTCFullYear()>2049){playing=false;setPlaying(false);}scene.time=simDate;scene.updatePositions();}
  if(scene && now-lastUi>350){renderDate();lastUi=now;}
}
function setPlaying(on){playing=on;$('#pauseButton').textContent=on?'Ⅱ':'▶';$('#pauseButton').title=on?'Pause simulation':'Resume simulation';$('#pauseButton').setAttribute('aria-label',on?'Pause simulation':'Resume simulation');}
function dateJump(str){const dt=new Date(str+'T12:00:00Z');if(Number.isNaN(dt.getTime()))return;simDate=dt;scene?.setDate(dt);renderDate();}
function toggleAbout(open){$('#aboutBackdrop').hidden=!open;$('#navAbout').classList.toggle('nav-active',open);$('#navExplore').classList.toggle('nav-active',!open);if(open)$('#aboutClose').focus();}
function toggleSettings(open){$('#settingsPanel').hidden=!open;if(open)$('#settingsClose').focus();}
function toggleCinema(enabled){
  document.body.classList.toggle('cinema-mode',enabled);
  $('#cinemaButton').setAttribute('aria-pressed',String(enabled));
  $('#cinemaButton').setAttribute('aria-label',enabled?'Exit distraction-free view':'Enter distraction-free view');
  $('#cinemaButton').title=enabled?'Exit distraction-free view (Esc)':'Distraction-free view';
  $('#cinemaButton').textContent=enabled?'✕':'⛶';
  if(enabled){toggleAbout(false);toggleSettings(false);}
}
function attachHandlers(){
  $('#startButton').addEventListener('click',()=>scene?.focus('earth'));
  $('#tourButton').addEventListener('click',()=>scene?.focus('saturn'));
  $('#backButton').addEventListener('click',()=>scene?.goOverview());
  $('#overviewButton').addEventListener('click',()=>scene?.goOverview());
  $('#brandLink').addEventListener('click',e=>{e.preventDefault();scene?.goOverview();toggleAbout(false);});
  $('#navExplore').addEventListener('click',()=>toggleAbout(false));
  $('#navAbout').addEventListener('click',()=>toggleAbout(true));
  $('#aboutClose').addEventListener('click',()=>toggleAbout(false));
  $('#aboutBackdrop').addEventListener('click',e=>{if(e.target===$('#aboutBackdrop'))toggleAbout(false);});
  $('#settingsButton').addEventListener('click',()=>toggleSettings($('#settingsPanel').hidden));
  $('#settingsClose').addEventListener('click',()=>toggleSettings(false));
  $('#pauseButton').addEventListener('click',()=>setPlaying(!playing));
  $('#speedSelect').addEventListener('change',e=>{speed=Number(e.target.value);});
  $('#dateInput').addEventListener('change',e=>dateJump(e.target.value));
  $('#todayButton').addEventListener('click',()=>{simDate=new Date();scene?.setDate(simDate);renderDate();});
  $('#orbitToggle').addEventListener('change',e=>scene?.setOrbits(e.target.checked));
  $('#labelsToggle').addEventListener('change',e=>{scene.labelsVisible=e.target.checked;$('#planetLabels').hidden=!e.target.checked||selected!=='overview';});
  $('#lightingToggle').addEventListener('change',e=>scene?.setBalancedLighting(e.target.checked));
  $('#detailsToggle').addEventListener('click',()=>{
    const panel=$('#detail'),expanded=!panel.classList.contains('expanded');
    panel.classList.toggle('expanded',expanded);
    $('#detailsToggle').textContent=expanded?'HIDE DETAILS −':'PLANET DETAILS +';
    $('#detailsToggle').setAttribute('aria-expanded',String(expanded));
  });
  $('#cinemaButton').addEventListener('click',()=>toggleCinema(!document.body.classList.contains('cinema-mode')));
  $('#bloomToggle').addEventListener('change',e=>scene?.setBloom(e.target.checked));
  $('#scaleToggle').addEventListener('change',e=>{$('#sceneLegend').innerHTML=e.target.checked?'<span class="tiny-orbit"></span><span>ORBIT DISTANCES LINEAR IN AU · PLANETS ENLARGED</span>':'<span class="tiny-orbit"></span><span>VISUAL SCALE ADJUSTED FOR EXPLORATION</span>';scene?.setScientific(e.target.checked);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){toggleAbout(false);toggleSettings(false);toggleCinema(false);}if(e.target.matches('input,select'))return;if(e.key===' '){e.preventDefault();setPlaying(!playing);}if(e.key==='0')scene?.goOverview();if(/^[1-8]$/.test(e.key))scene?.focus(PLANETS[Number(e.key)-1].id);});
}
async function main(){
  makePlanets();setupLabels();attachHandlers();
  try{
    scene=new CosmicScene($('#universe'),{focus:openBody,frame:updateLabels});
    scene.setDate(simDate);
    // Open with an editorial close-up of Saturn, while leaving the home UI in overview.
    // Visitors can still fly to every other world or select the wide overview.
    const saturn=scene.spheres.saturn.group.position;
    scene.camera.position.copy(saturn).add(new THREE.Vector3(13,8,34));
    scene.controls.target.copy(saturn).add(new THREE.Vector3(-9,0,0));
    scene.controls.update();
    $('#bloomToggle').checked=scene.bloomEnabled;
    $('#lightingToggle').checked=scene.balancedLighting;
    await loadEphemeris();scene.setDate(simDate);
    renderDate();
    requestAnimationFrame(loop);
    $('#boot').classList.add('loaded');setTimeout(()=>$('#boot').remove(),900);
  }catch(e){
    console.error(e);$('#boot').remove();$('#errorScreen').hidden=false;
    $('#errorText').textContent='We could not start the 3D renderer. Try an updated browser with hardware acceleration enabled. '+(e?.message||'');
  }
}
main();

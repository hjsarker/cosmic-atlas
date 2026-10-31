import test from 'node:test';
import assert from 'node:assert/strict';
import {ELEMENTS,PLANETS,orbitalPosition,scenePosition,julianDate,distanceAU} from '../site/js/astronomy.js';

const epoch=new Date('2000-01-01T12:00:00.000Z');
test('Julian epoch is J2000',()=>assert.equal(julianDate(epoch),2451545));
test('all eight planets have physical descriptions and orbital elements',()=>{
 assert.equal(PLANETS.length,8);
 assert.equal(Object.keys(ELEMENTS).length,8);
 for(const p of PLANETS){assert.ok(ELEMENTS[p.id]);assert.ok(p.diameter>0);assert.ok(p.gravity>0);assert.ok(p.description.length>40);}
});
test('JPL Kepler coordinates are finite and within realistic distance bounds',()=>{
 const rough={mercury:[.3,.5],venus:[.7,.75],earth:[.98,1.03],mars:[1.35,1.72],jupiter:[4.8,5.6],saturn:[8.8,10.3],uranus:[18,21],neptune:[29,31]};
 for(const [id,range] of Object.entries(rough)){
   const p=orbitalPosition(id,new Date('2026-10-31T12:00:00Z'));
   assert.ok([p.x,p.y,p.z].every(Number.isFinite),id);
   assert.ok(distanceAU(p)>range[0]&&distanceAU(p)<range[1],id+': '+distanceAU(p));
 }
});
test('Mercury moves faster than outer worlds over 30 days',()=>{
 const a=new Date('2026-01-01'),b=new Date('2026-01-31');
 const angle=id=>{let v=orbitalPosition(id,a),w=orbitalPosition(id,b);return Math.acos(Math.max(-1,Math.min(1,(v.x*w.x+v.y*w.y+v.z*w.z)/(distanceAU(v)*distanceAU(w)))));};
 assert.ok(angle('mercury')>angle('earth'));assert.ok(angle('earth')>angle('neptune'));
});
test('linear scene positions preserve ratios, cinematic view compresses distance',()=>{
 const earth=orbitalPosition('earth',epoch),neptune=orbitalPosition('neptune',epoch);
 const linear=distanceAU(scenePosition(neptune,true))/distanceAU(scenePosition(earth,true));
 const pretty=distanceAU(scenePosition(neptune,false))/distanceAU(scenePosition(earth,false));
 assert.ok(linear>28&&linear<32);assert.ok(pretty<6);
});
test('reject invalid planet id',()=>assert.throws(()=>orbitalPosition('pluto',epoch)));

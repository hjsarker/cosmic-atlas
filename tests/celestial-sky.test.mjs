import test from 'node:test';
import assert from 'node:assert/strict';
import {equatorialToScene,sceneToGalactic} from '../site/js/celestial-coordinates.js';

function angleDifference(a,b){return Math.abs(((a-b+540)%360)-180);}
function nearly(x,y,eps=.0001){assert.ok(Math.abs(x-y)<eps,`Expected ${x} ≈ ${y}`);}

test('J2000 equatorial vernal equinox points along scene +X',()=>{
  const v=equatorialToScene(0,0);
  nearly(v.x,1);nearly(v.y,0);nearly(v.z,0);
});
test('celestial north pole has the correct ecliptic tilt',()=>{
  const v=equatorialToScene(0,90);
  nearly(Math.hypot(v.x,v.y,v.z),1);
  nearly(v.y,Math.cos(23.4392911*Math.PI/180));
  nearly(v.z,Math.sin(23.4392911*Math.PI/180));
});
test('Galactic centre points to correct Gaia image centre (l=0,b=0)',()=>{
  const g=sceneToGalactic(equatorialToScene(266.4051,-28.936175));
  assert.ok(angleDifference(g.longitude,0)<.2,`Galactic longitude ${g.longitude}`);
  assert.ok(Math.abs(g.latitude)<.2,`Galactic latitude ${g.latitude}`);
});
test('Galactic north pole points to b=+90',()=>{
  const g=sceneToGalactic(equatorialToScene(192.85948,27.12825));
  assert.ok(g.latitude>89.9,`Galactic north pole latitude ${g.latitude}`);
});
test('all sky transforms preserve unit vector length',()=>{
  for(const [ra,dec] of [[0,0],[90,25],[145,-30],[300,60]]){
    const v=equatorialToScene(ra,dec);
    nearly(Math.hypot(v.x,v.y,v.z),1);
    const g=sceneToGalactic(v);
    assert.ok(g.longitude>=0&&g.longitude<360);
    assert.ok(g.latitude>=-90&&g.latitude<=90);
  }
});

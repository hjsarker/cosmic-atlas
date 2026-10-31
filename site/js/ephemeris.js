/** Optional high-precision JPL Horizons samples, prepared server-side in GitHub Actions.
 * No browser-to-Horizons API calls. Entries are heliocentric ecliptic positions in AU.
 * If no valid sample is published, JPL's documented 1800–2050 Keplerian approximation is used.
 */
import {orbitalPosition} from './astronomy.js';
let snapshot=null;
export const ephemerisInfo=()=>snapshot?{source:'JPL Horizons vectors',start:snapshot.start,end:snapshot.end}:{source:'JPL orbital elements (approximation)',start:'1800',end:'2050'};
export async function loadEphemeris(){
  try{
    const response=await fetch(new URL('../data/horizons.json',import.meta.url),{cache:'no-store'});
    if(!response.ok)return false;
    const next=await response.json();
    if(next.source!=='NASA/JPL Horizons' || !next.planets || !next.start || !next.end)return false;
    const keys=['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'];
    if(!keys.every(k=>Array.isArray(next.planets[k])&&next.planets[k].length>1))return false;
    snapshot=next;
    return true;
  }catch{return false;}
}
export function positionAt(id,date){
  const ms=date.getTime();
  if(snapshot && ms>=Date.parse(snapshot.start) && ms<=Date.parse(snapshot.end)){
    const points=snapshot.planets[id];
    if(points){
      let lo=0,hi=points.length-1;
      while(lo<hi){const mid=(lo+hi)>>1;if(points[mid][0]<ms)lo=mid+1;else hi=mid;}
      if(lo===0)return {x:points[0][1],y:points[0][2],z:points[0][3]};
      const a=points[lo-1],b=points[lo],delta=b[0]-a[0],f=delta?(ms-a[0])/delta:0;
      return {x:a[1]+f*(b[1]-a[1]),y:a[2]+f*(b[2]-a[2]),z:a[3]+f*(b[3]-a[3])};
    }
  }
  return orbitalPosition(id,date);
}
export function isHorizonsAt(date){return Boolean(snapshot && date.getTime()>=Date.parse(snapshot.start) && date.getTime()<=Date.parse(snapshot.end));}

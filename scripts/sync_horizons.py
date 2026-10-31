#!/usr/bin/env python3
"""Download official heliocentric ecliptic vectors from NASA/JPL Horizons.
Run from GitHub Actions, never a browser. This is a quality-enhancing optional
snapshot; the browser always has the published JPL low-precision Kepler model.
The implementation will not fabricate ephemeris records on request failure.
"""
import argparse
import datetime as dt
import json
import re
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request,urlopen

API='https://ssd.jpl.nasa.gov/api/horizons.api'
BODIES={'mercury':'199','venus':'299','earth':'399','mars':'499','jupiter':'599','saturn':'699','uranus':'799','neptune':'899'}
OUT=Path(__file__).resolve().parent.parent/'site'/'data'/'horizons.json'

def extract(body_id,start,end):
 params={
  'format':'text','COMMAND':f"'{body_id}'",'OBJ_DATA':'NO','MAKE_EPHEM':'YES',
  'EPHEM_TYPE':'VECTORS','CENTER':"'500@10'",'REF_PLANE':'ECLIPTIC',
  'REF_SYSTEM':'ICRF','VEC_TABLE':'2','VEC_LABELS':'NO','CSV_FORMAT':'YES',
  'OUT_UNITS':'AU-D','TIME_TYPE':'UT','START_TIME':f"'{start}'",'STOP_TIME':f"'{end}'",
  'STEP_SIZE':"'1 d'",'CAL_FORMAT':'BOTH',
 }
 request=Request(API+'?'+urlencode(params),headers={'User-Agent':'CosmicAtlas-Ephemeris-Update/1.0'})
 with urlopen(request,timeout=90) as resp:
  body=resp.read(2_000_000).decode('utf-8',errors='replace')
 if '$$SOE' not in body or '$$EOE' not in body:
  raise RuntimeError('Horizons did not return a vector table: '+body[-400:])
 lines=body.split('$$SOE',1)[1].split('$$EOE',1)[0].splitlines()
 values=[]
 for line in lines:
  cells=[c.strip() for c in line.split(',')]
  if len(cells)<5:continue
  try:
   jd=float(cells[0]);xyz=[float(x) for x in cells[2:5]]
  except ValueError:continue
  unix_ms=round((jd-2440587.5)*86400000)
  values.append([unix_ms,*[round(x,10) for x in xyz]])
 if len(values)<90:raise RuntimeError(f'Insufficient Horizons observations: {len(values)}')
 for a,b in zip(values,values[1:]):
  if b[0]<=a[0]:raise RuntimeError('Non-monotonic ephemeris times')
 return values

def build(out=OUT):
 today=dt.date.today()
 start=dt.date(today.year-1,1,1)
 end=dt.date(today.year+2,1,1)
 dataset={}
 for key,ident in BODIES.items():
  print('Fetching',key,flush=True)
  dataset[key]=extract(ident,start.isoformat(),end.isoformat())
  print('Validated',len(dataset[key]),'observations',flush=True)
  time.sleep(1.1)
 payload={'source':'NASA/JPL Horizons','frame':'heliocentric ecliptic ICRF',
          'units':'AU','time_scale':'UTC','step':'1 day','interpolation':'linear',
          'generated_at':dt.datetime.now(dt.timezone.utc).isoformat(),
          'start':dt.datetime.combine(start,dt.time(),dt.timezone.utc).isoformat().replace('+00:00','Z'),
          'end':dt.datetime.combine(end,dt.time(),dt.timezone.utc).isoformat().replace('+00:00','Z'),
          'planets':dataset}
 out.parent.mkdir(parents=True,exist_ok=True)
 out.write_text(json.dumps(payload,separators=(',',':')),encoding='utf-8')
 print('Wrote validated JPL vectors to',out)

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=OUT)
 args=parser.parse_args();build(args.output)

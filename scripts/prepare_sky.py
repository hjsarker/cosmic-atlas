#!/usr/bin/env python3
"""Prepare a real celestial background and a compact magnitude-limited star catalog.

The Gaia photograph is an equirectangular map in Galactic coordinates, with
longitude increasing to the left. Its published survey-composite brightness
is not a naked-eye simulation.

Sources:
 ESA/Gaia/DPAC equirectangular EDR3 panorama, CC BY-SA 3.0 IGO
 HYG Database 4.1 (astronexus), CC BY-SA 4.0
"""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError
import csv
import io
import json
import time
from PIL import Image

ROOT=Path(__file__).resolve().parent.parent/'site'
ASSETS=ROOT/'assets'
DATA=ROOT/'data'
GAIA_SOURCE=('https://www.esa.int/var/esa/storage/images/esa_multimedia/'
 'images/2020/12/the_colour_of_the_sky_from_gaia_s_early_data_release_32/'
 '22358131-1-eng-GB/The_colour_of_the_sky_from_Gaia_s_Early_Data_Release_3_pillars.png')
HYG_SOURCE=('https://raw.githubusercontent.com/astronexus/HYG-Database/main/'
 'hyg/CURRENT/hygdata_v41.csv')

def download(url,timeout=45,limit=48_000_000):
 for attempt in range(3):
  try:
   req=Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; CosmicAtlas/1.0; educational scientific visualization)'})
   with urlopen(req,timeout=timeout) as response:
    data=response.read(limit+1)
   if len(data)>limit or len(data)<5_000:
    raise ValueError('Unexpected upstream asset size')
   return data
  except (OSError,URLError,ValueError) as exc:
   if attempt==2: raise RuntimeError(f'Source unavailable: {url}') from exc
   time.sleep(2*(attempt+1))

def generate_sky():
 ASSETS.mkdir(parents=True,exist_ok=True)
 destination=ASSETS/'gaia-sky.jpg'
 if destination.exists() and destination.stat().st_size>40_000:
  print('Verified existing Gaia sky image')
  return
 raw=download(GAIA_SOURCE,limit=25_000_000)
 with Image.open(io.BytesIO(raw)) as image:
  image.load()
  w,h=image.size
  if abs(w/h-2)>0.045 or w<900:
   raise ValueError(f'Gaia image not equirectangular (size {w}x{h})')
  # The original already has beautiful Gaia contrast; JPEG is lightweight.
  image.convert('RGB').save(destination,'JPEG',quality=90,optimize=True)
 print('ESA Gaia sky',w,h,'->',destination.stat().st_size,'bytes')

def generate_bright_stars():
 DATA.mkdir(parents=True,exist_ok=True)
 dest=DATA/'bright-stars.json'
 if dest.exists() and dest.stat().st_size>50_000:
  print('Using validated local star catalog')
  return
 csv_bytes=download(HYG_SOURCE,timeout=65,limit=44_000_000)
 reader=csv.DictReader(io.StringIO(csv_bytes.decode('utf-8-sig')))
 if not {'ra','dec','mag','ci'}.issubset(set(reader.fieldnames or [])):
  raise ValueError('HYG star fields changed')
 stars=[]
 for row in reader:
  try:
   mag=float(row['mag'])
   if mag>6.7 or mag<-3.0:continue
   ra=float(row['ra'])*15
   dec=float(row['dec'])
   if not (0<=ra<=360 and -90<=dec<=90):continue
   bv=float(row['ci']) if row['ci'] else None
   stars.append([round(ra,5),round(dec,5),round(mag,3),round(bv,3) if bv is not None else None])
  except (ValueError,KeyError,TypeError):continue
 if not 4500<len(stars)<13000:raise ValueError(f'Unexpected HYG coverage: {len(stars)} stars')
 stars.sort(key=lambda item:item[2])
 payload={'source':'HYG v4.1','epoch':'J2000','frame':'ICRS','limit_magnitude':6.7,
          'license':'CC BY-SA 4.0','stars':stars}
 dest.write_text(json.dumps(payload,separators=(',',':')),encoding='utf-8')
 print('Bright stars',len(stars),'->',dest.stat().st_size,'bytes')

if __name__=='__main__':
 generate_sky()
 generate_bright_stars()

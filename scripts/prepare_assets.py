#!/usr/bin/env python3
"""Download licensed public texture maps into the static build.
Texture source: Solar System Scope, CC BY 4.0; mirrored by Sanghel/solar-system-3d.
Full attribution in ATTRIBUTION.md. Fails the deploy if required images are missing.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from time import sleep

ROOT=Path(__file__).resolve().parent.parent/'site'/'assets'
TEXTURES=['sun','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune']
SOURCES=[
 'https://raw.githubusercontent.com/Sanghel/solar-system-3d/develop/public/textures/{name}.jpg',
 'https://cdn.jsdelivr.net/gh/Sanghel/solar-system-3d@develop/public/textures/{name}.jpg',
]

def build():
 ROOT.mkdir(parents=True,exist_ok=True)
 for name in TEXTURES:
  target=ROOT/(name+'.jpg')
  if target.exists() and target.stat().st_size>20_000:
   print('Using existing',name)
   continue
  for index,template in enumerate(SOURCES):
   try:
    request=Request(template.format(name=name),headers={'User-Agent':'CosmicAtlas/1.0 (portfolio project)'})
    with urlopen(request,timeout=35) as result:
     data=result.read(3_000_000)
    if not (data[:3]==b'\xff\xd8\xff' and len(data)>20_000):
     raise ValueError('Not a valid planet JPEG')
    target.write_bytes(data)
    print('Downloaded',name,len(data),'bytes')
    break
   except Exception as exc:
    print(f'Asset {name}, mirror {index+1}: {exc}')
    sleep(1)
  else:
   raise RuntimeError(f'Missing essential 3D texture for {name}')

if __name__=='__main__':build()

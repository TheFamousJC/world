"""Prepare bounded OSM city/airport packs, not tiles. Raw downloads are ignored.

Uses the same attributed vector schema as Japan; sequential requests and cached
responses avoid repeated public Overpass work. Run with --download once.
"""
import argparse, json, time, urllib.request, urllib.parse
from importlib.util import spec_from_file_location, module_from_spec
from pathlib import Path
root=Path(__file__).resolve().parent.parent
spec=spec_from_file_location('japan',root/'scripts/prepare-japan.py')
japan=module_from_spec(spec);spec.loader.exec_module(japan)
parser=argparse.ArgumentParser();parser.add_argument('--download',action='store_true');parser.add_argument('--region');args=parser.parse_args()
for r in json.loads((root/'scripts/world-regions.json').read_text()):
 if args.region and args.region!=r['id']:continue
 c,a=r['centre'],r['airport'];bounds=[min(c[0],a[0])-.035,min(c[1],a[1])-.035,max(c[0],a[0])+.035,max(c[1],a[1])+.035]
 config={'name':r['city']+' centre–'+r['airportName'],'bounds':bounds,'detail':[c[0]-.015,c[1]-.015,c[0]+.015,c[1]+.015]}
 raw=root/'assets'/('japan-'+r['id']+'.json')
 if args.download and not raw.exists():
  query=japan.query(config)
  # Keep full street detail in mission districts and around terminal approaches;
  # retain through-roads across the wider city/airport rectangle. This bounds
  # offline storage and avoids asking a public service for entire metro areas.
  broad=japan.box(bounds);detail=japan.box(config['detail']);airport=f'{a[1]-.015},{a[0]-.015},{a[1]+.015},{a[0]+.015}'
  query=query.replace(f'way[highway][highway!~"^(construction|proposed)$"]({broad});',f'way[highway~"^(motorway|trunk|primary|secondary|tertiary|unclassified)(_link)?$"]({broad});way[highway][highway!~"^(construction|proposed)$"]({detail});way[highway][highway!~"^(construction|proposed)$"]({airport});')
  # Airport buildings are included independently of city building-detail bounds.
  query=query.replace(');out body geom;',f'way[building]({a[1]-.008},{a[0]-.008},{a[1]+.008},{a[0]+.008}););out body geom;')
  for attempt in range(4):
   try:
    endpoint=['https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter'][attempt%2]
    request=urllib.request.Request(endpoint,data=urllib.parse.urlencode({'data':query}).encode(),headers={'User-Agent':'EscapeAtlas-OfflineMapPreparation/0.11 (https://github.com/TheFamousJC/world)'})
    print('Downloading',r['id'],'attempt',attempt+1,flush=True)
    with urllib.request.urlopen(request,timeout=100) as response:payload=response.read()
    parsed=json.loads(payload)
    if parsed.get('remark') or not parsed.get('elements'):raise RuntimeError(parsed.get('remark','Empty extract'))
    raw.write_bytes(payload);break
   except Exception as error:
    print(type(error).__name__,str(error),flush=True)
    if raw.exists():break
    if attempt==3:raise
    time.sleep(max(30,int(error.headers.get('Retry-After','30'))) if isinstance(error,urllib.error.HTTPError) and error.code==429 else 10)
 japan.prepare(r['id'],config)

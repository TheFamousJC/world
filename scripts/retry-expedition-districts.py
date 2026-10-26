"""Retry missing district extracts as small, cached per-city requests."""
import json,math,time,urllib.parse,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parent.parent;cache=root/'assets/route-source'
routes=json.loads((root/'scripts/expedition-routes.json').read_text(encoding='utf8'))
for route in routes:
 target=cache/(route['id']+'-osm.json')
 if target.exists():continue
 combined={};ok=True
 for city in route['cities']:
  file=cache/(city['key']+'-district.json')
  if not file.exists():
   lon,lat=city['coordinates'];dx=.009/max(.35,math.cos(math.radians(lat)));dy=.009;box=f'{lat-dy},{lon-dx},{lat+dy},{lon+dx}'
   query='[out:json][timeout:60];(way[highway][highway!~"^(construction|proposed)$"]('+box+');way[railway~"^(rail|light_rail|tram)$"]('+box+');way[waterway]('+box+');way[natural=water]('+box+');node[railway~"^(station|halt)$"]('+box+'););out body geom;'
   try:
    print(route['id'],city['key'],flush=True)
    req=urllib.request.Request('https://overpass.private.coffee/api/interpreter',data=urllib.parse.urlencode({'data':query}).encode(),headers={'User-Agent':'EscapeAtlas-offline-map-preparation/0.28 (https://github.com/TheFamousJC/world)'})
    with urllib.request.urlopen(req,timeout=90) as response:data=json.loads(response.read())
    if data.get('remark') or not data.get('elements'):raise ValueError(data.get('remark','Empty district'))
    file.write_text(json.dumps(data,separators=(',',':')),encoding='utf8')
   except Exception as e:print('Deferred',str(e),flush=True);ok=False
   time.sleep(3)
  if file.exists():
   for e in json.loads(file.read_text())['elements']:combined[e['type']+str(e['id'])]=e
  else:ok=False
 if ok:target.write_text(json.dumps({'elements':list(combined.values())},separators=(',',':')),encoding='utf8');print('READY',route['id'],flush=True)

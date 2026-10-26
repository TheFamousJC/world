"""One-time, throttled map preparation. Never called by the game or CI.

Downloads bounded OSM vector districts and reference driving corridors. Cached
raw responses remain ignored. A failed route is recorded, never replaced by a
straight line over water or a purported real-world service.
"""
import argparse,csv,hashlib,json,math,re,time,urllib.parse,urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
CACHE=ROOT/'assets/route-source'
UA='EscapeAtlas-OfflinePreparation/0.28 (https://github.com/TheFamousJC/world)'
parser=argparse.ArgumentParser();parser.add_argument('--region');parser.add_argument('--roads-only',action='store_true');parser.add_argument('--catalogue-only',action='store_true');args=parser.parse_args()
routes=json.loads((ROOT/'scripts/expedition-routes.json').read_text(encoding='utf8'))
def distance(a,b):
    x=math.radians(b[0]-a[0])*math.cos(math.radians((a[1]+b[1])/2));y=math.radians(b[1]-a[1]);return 6371*math.hypot(x,y)
airports=[]
with (CACHE/'airports.csv').open(encoding='utf8') as file:
    for a in csv.DictReader(file):
        if a['type'] not in ['small_airport','medium_airport','large_airport'] or re.search(r'air.?base|highway strip|military',a['name'],re.I):continue
        lat,lon=map(float,a['coordinates'].split(','))
        airports.append({'ident':a['ident'],'name':a['name'],'coordinates':[lon,lat],'countryCode':a['iso_country'],'type':a['type'],'iata':a['iata_code']})
for route in routes:
    for city in route['cities']:
        city.pop('airport',None)
        city['key']='city-'+city['countryCode'].lower()+'-'+hashlib.sha256(city['name'].encode()).hexdigest()[:10]
        city['source']=city.get('source') or ('https://www.geonames.org/'+str(city['geonamesId'])+'/')
        candidates=sorted([a for a in airports if a['countryCode']==city['countryCode'] and distance(a['coordinates'],city['coordinates'])<200],key=lambda a:(a['type']=='small_airport',distance(a['coordinates'],city['coordinates'])))
        if candidates:city['airport']=candidates[0]
(CACHE/'enriched-routes.json').write_text(json.dumps(routes,ensure_ascii=False,indent=2),encoding='utf8')
if args.catalogue_only:raise SystemExit(0)
def fetch(url,payload=None):
    request=urllib.request.Request(url,data=payload,headers={'User-Agent':UA,'Referer':'https://github.com/TheFamousJC/world'})
    with urllib.request.urlopen(request,timeout=150) as response:return json.loads(response.read())
for route in routes:
    if args.region and route['region']!=args.region and route['id']!=args.region:continue
    raw=CACHE/(route['id']+'-osm.json')
    if not args.roads_only and not raw.exists():
        pieces=[]
        for city in route['cities']:
            points=[city['coordinates']]+([city['airport']['coordinates']] if city.get('airport') else [])
            for j,(lon,lat) in enumerate(points):
                dx=.012/max(.35,math.cos(math.radians(lat)));dy=.012;b=f'{lat-dy},{lon-dx},{lat+dy},{lon+dx}'
                pieces.extend([f'way[highway][highway!~"^(construction|proposed)$"]({b});',f'way[railway~"^(rail|light_rail|tram)$"]({b});',f'way[waterway]({b});',f'way[natural=water]({b});',f'node[railway~"^(station|halt)$"]({b});'])
                if not j:pieces.append(f'way[building]({lat-.003},{lon-.004},{lat+.003},{lon+.004});')
        query='[out:json][timeout:120];('+''.join(pieces)+');out body geom;'
        try:
            print(route['id'],'OSM districts',flush=True);data=fetch('https://overpass.private.coffee/api/interpreter',urllib.parse.urlencode({'data':query}).encode())
            if data.get('remark') or not data.get('elements'):raise RuntimeError(data.get('remark','Empty extract'))
            raw.write_text(json.dumps(data,separators=(',',':')),encoding='utf8')
        except Exception as error:print(route['id'],'OSM deferred:',str(error),flush=True)
        time.sleep(3)
    for i in range(4):
        target=CACHE/(route['id']+'-road-'+str(i)+'.json')
        if target.exists():continue
        a,b=route['cities'][i:i+2];coords=';'.join(','.join(map(str,c['coordinates'])) for c in [a,b]);url='https://router.project-osrm.org/route/v1/driving/'+coords+'?overview=full&geometries=geojson&steps=true&generate_hints=false&radiuses=1500;1500'
        try:
            print(route['id'],'road',i+1,flush=True);data=fetch(url)
            if data.get('code') not in ['Ok','NoRoute','NoSegment']:raise RuntimeError(str(data.get('code')))
            target.write_text(json.dumps(data,separators=(',',':')),encoding='utf8')
        except Exception as error:print(route['id'],'road deferred:',str(error),flush=True)
        time.sleep(2)
print('Preparation pass finished. Inspect every deferred/unsupported connection before compiling.',flush=True)

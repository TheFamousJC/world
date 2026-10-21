"""Build bounded, attributed offline Japan packs from cached Overpass data.

Run --download once to fetch public OSM vector data (never map tiles). Raw
responses stay in ignored assets/. Subsequent builds are entirely local.
Python standard library only; no keys or paid services.
"""
import argparse,collections,datetime,json,pathlib,urllib.parse,urllib.request
ROOT=pathlib.Path(__file__).resolve().parent.parent
REGIONS={
 'osaka':{'name':'Osaka centre–Itami Airport','bounds':[135.415,34.665,135.545,34.805],'detail':[135.475,34.680,135.525,34.720]},
 'tokyo':{'name':'Tokyo Shinagawa–Haneda Airport','bounds':[139.705,35.535,139.820,35.655],'detail':[139.720,35.605,139.765,35.645]}
}
def box(b):return ','.join(map(str,[b[1],b[0],b[3],b[2]]))
def query(r):
 b,d=box(r['bounds']),box(r['detail'])
 return f'''[out:json][timeout:180];(
 way[highway][highway!~"^(construction|proposed)$"]({b});
 way[railway~"^(rail|light_rail|subway|monorail|tram)$"]({b});
 way[waterway]({b});way[natural=water]({b});
 way[landuse~"^(forest|grass|meadow|recreation_ground|cemetery)$"]({b});
 way[leisure~"^(park|garden)$"]({b});
 way[aeroway~"^(aerodrome|terminal|runway|taxiway|apron)$"]({b});
 way[building]({d});node[railway~"^(station|halt)$"]({b});
 );out body geom;'''
def prepare(key,r):
 raw=ROOT/'assets'/f'japan-{key}.json';data=json.loads(raw.read_text(encoding='utf-8'));features=[];stations=[]
 for e in data['elements']:
  t=e.get('tags',{});name=t.get('name:en',t.get('name',t.get('ref','')))
  if e['type']=='node':
   stations.append({'id':str(e['id']),'name':name,'coordinates':[e['lon'],e['lat']]});continue
  g=e.get('geometry',[])
  if len(g)<2 or any(not p for p in g):continue
  coords=[[round(p['lon'],6),round(p['lat'],6)] for p in g];closed=len(coords)>3 and coords[0]==coords[-1]
  kind='road' if 'highway' in t else 'rail' if 'railway' in t else 'water' if 'waterway' in t else 'water-area' if t.get('natural')=='water' else 'building' if 'building' in t or t.get('aeroway')=='terminal' else 'airport' if t.get('aeroway') in ['aerodrome','apron'] else 'runway' if t.get('aeroway') in ['runway','taxiway'] else 'park'
  if kind in ['building','park','airport','water-area'] and not closed:continue
  props={'id':str(e['id']),'kind':kind,'class':t.get('highway',t.get('railway',t.get('aeroway',''))),'name':name}
  if kind in ['road','rail']:
   props['nodes']=e.get('nodes',[])
   for k in ['oneway','access','foot','bicycle','motor_vehicle','motorcar','surface','bridge','tunnel','service','area','junction','oneway:foot','oneway:bicycle','motorroad']:
    if k in t:props[k]=t[k]
  if kind=='building':
   try:height=float(t.get('height',float(t.get('building:levels',2))*3))
   except ValueError:height=6
   props.update(height=min(180,max(3,height)),heightEstimated='height' not in t and 'building:levels' not in t)
  geometry={'type':'Polygon','coordinates':[coords]} if kind in ['building','park','airport','water-area'] else {'type':'LineString','coordinates':coords}
  features.append({'type':'Feature','properties':props,'geometry':geometry})
 metadata={'name':r['name'],'bounds':r['bounds'],'maxAccessKm':.08,'detailBounds':r['detail'],'snapshot':data.get('osm3s',{}).get('timestamp_osm_base'),'retrieved':'2026-10-21','licence':'ODbL 1.0','attribution':'© OpenStreetMap contributors','source':'https://overpass-api.de/api/interpreter','note':'Bounded OSM roads, railways and areas; building detail concentrated in mission districts. Real geography; game contacts, prices, services and flight schedules are fictional. Airport markers are landside public-access points.'}
 out=ROOT/'public/data'/f'{key}.geojson';out.write_text(json.dumps({'type':'FeatureCollection','metadata':metadata,'features':features,'stations':stations},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
 print(key,out.stat().st_size,dict(collections.Counter(f['properties']['kind'] for f in features)),flush=True)
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--download',action='store_true');parser.add_argument('--region',choices=REGIONS);a=parser.parse_args()
 for key,r in REGIONS.items():
  if a.region and a.region!=key:continue
  raw=ROOT/'assets'/f'japan-{key}.json'
  if a.download and not raw.exists():
   request=urllib.request.Request('https://overpass-api.de/api/interpreter',data=urllib.parse.urlencode({'data':query(r)}).encode(),headers={'User-Agent':'EscapeAtlas-MapPreparation/0.10 (https://github.com/TheFamousJC/world)'})
   print('Downloading bounded',key,'OSM vector extract',flush=True)
   with urllib.request.urlopen(request,timeout=240) as response:payload=response.read()
   parsed=json.loads(payload)
   if parsed.get('remark') or not parsed.get('elements'):raise RuntimeError(parsed.get('remark','Empty extract'))
   raw.write_bytes(payload)
  prepare(key,r)

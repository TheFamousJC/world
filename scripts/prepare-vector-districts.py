"""Prepare bounded OpenFreeMap offline districts. Development only.
Each logical five-city pack stays below 3,000 tiles / 50 MB; two requests max.
Source permissions: https://openfreemap.org/tos/ . No runtime remote dependency.
Decoder: mapbox-vector-tile 2.2.0 installed in ignored assets/map-tools.
"""
import sys,json,math,hashlib,urllib.request,time,argparse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
ROOT=Path(__file__).resolve().parent.parent;CACHE=ROOT/'assets/route-source';sys.path.insert(0,str(ROOT/'assets/map-tools'))
import mapbox_vector_tile
parser=argparse.ArgumentParser();parser.add_argument('--only');args=parser.parse_args()
routes=json.loads((CACHE/'enriched-routes.json').read_text(encoding='utf8'));tiles=CACHE/'omt-tiles';tiles.mkdir(exist_ok=True)
UA='EscapeAtlas-OfflineRoutePreparation/0.29 (+https://github.com/TheFamousJC/world)'
with urllib.request.urlopen(urllib.request.Request('https://tiles.openfreemap.org/planet/latest',headers={'User-Agent':UA}),timeout=25) as r:meta=json.loads(r.read())
(CACHE/'omt-source.json').write_text(json.dumps(meta),encoding='utf8');template=meta['tiles'][0];Z=14

def tilexy(lon,lat):return ((lon+180)/360*2**Z,(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*2**Z)
def coords(ps,x,y,extent):
 return [{'lon':round((x+p[0]/extent)/2**Z*360-180,6),'lat':round(math.degrees(math.atan(math.sinh(math.pi*(1-2*(y+p[1]/extent)/2**Z)))),6)} for p in ps]
def fetch(t):
 x,y=t;file=tiles/f'{Z}-{x}-{y}.pbf'
 if not file.exists():
  req=urllib.request.Request(template.replace('{z}',str(Z)).replace('{x}',str(x)).replace('{y}',str(y)),headers={'User-Agent':UA})
  with urllib.request.urlopen(req,timeout=40) as r:b=r.read()
  if len(b)>5_000_000:raise RuntimeError('Unexpected large tile')
  file.write_bytes(b);time.sleep(.3)
 return t,file

def convert(file,x,y):
 d=mapbox_vector_tile.decode(file.read_bytes(),default_options={'y_coord_down':True});out=[]
 for layer in ['transportation','waterway','water','building','poi']:
  if layer not in d:continue
  extent=d[layer]['extent']
  for f in d[layer]['features']:
   p=f['properties'];g=f['geometry'];kind=g['type'];tags={};cl=p.get('class','');sub=p.get('subclass','')
   if layer=='transportation':
    if kind not in ['LineString','MultiLineString']:continue
    if 'construction' in cl or cl in ['aerialway','raceway','ferry']:continue
    if cl in ['rail','transit']:tags['railway']=sub if sub in ['rail','light_rail','tram'] else 'rail'
    else:
     tags['highway']={'minor':'residential','path':sub or 'path','busway':'service'}.get(cl,cl)
     if tags['highway'] not in ['motorway','trunk','primary','secondary','tertiary','residential','service','track','path','footway','pedestrian','cycleway','steps','bridleway','corridor']:continue
     if p.get('ramp'):tags['highway']+='_link' if tags['highway'] in ['motorway','trunk','primary','secondary','tertiary'] else ''
     if p.get('access') is False or p.get('access')=='no':tags['access']='no'
     if p.get('oneway') in [1,-1]:tags['oneway']='yes' if p['oneway']==1 else '-1'
     for k in ['foot','bicycle','horse','surface','layer']:
      if k in p:tags[k]='no' if p[k] is False else str(p[k]).lower()
     if p.get('brunnel') in ['bridge','tunnel']:tags[p['brunnel']]='yes'
   elif layer=='waterway':tags['waterway']=cl or 'river'
   elif layer=='water':tags['natural']='water'
   elif layer=='building':tags['building']='yes';tags['height']=str(p.get('render_height',6))
   elif layer=='poi':
    if sub not in ['station','halt','railway_station'] or kind!='Point':continue
    q=coords([g['coordinates']],x,y,extent)[0];out.append({'type':'node','id':int(hashlib.sha256((layer+str(f['id'])+str(x)+str(y)).encode()).hexdigest()[:12],16),'lon':q['lon'],'lat':q['lat'],'tags':{'railway':'station','name':p.get('name:en',p.get('name','Rail interchange'))}});continue
   if kind not in ['LineString','MultiLineString','Polygon','MultiPolygon']:continue
   parts=g['coordinates'] if kind in ['MultiLineString','Polygon'] else [poly[0] for poly in g['coordinates']] if kind=='MultiPolygon' else [g['coordinates']]
   if kind=='Polygon':parts=parts[:1]
   for j,ps in enumerate(parts):
    if len(ps)<2:continue
    geom=coords(ps,x,y,extent);ident=int(hashlib.sha256((layer+str(f['id'])+str(x)+str(y)+str(j)).encode()).hexdigest()[:12],16)
    out.append({'type':'way','id':ident,'geometry':geom,'tags':tags})
 return out

for route in routes:
 if args.only and route['id']!=args.only:continue
 target=CACHE/(route['id']+'-osm.json')
 if target.exists():continue
 selected=set()
 for city in route['cities']:
  for centre,radius in [(city['coordinates'],.012)]+([(city['airport']['coordinates'],.005)] if city.get('airport') else []):
   lon,lat=centre;dx=radius/max(.35,math.cos(math.radians(lat)));a,b=tilexy(lon-dx,lat+radius);c,d=tilexy(lon+dx,lat-radius)
   for x in range(math.floor(a),math.floor(c)+1):
    for y in range(math.floor(b),math.floor(d)+1):selected.add((x,y))
 if len(selected)>3000:raise RuntimeError('Per-pack tile limit exceeded')
 print(route['id'],'fetch',len(selected),'tiles',flush=True)
 try:
  with ThreadPoolExecutor(max_workers=2) as pool:files=list(pool.map(fetch,sorted(selected)))
  total=sum(f.stat().st_size for _,f in files)
  if total>50_000_000:raise RuntimeError('Per-pack byte limit exceeded')
  elements=[]
  for (x,y),file in files:elements.extend(convert(file,x,y))
  target.write_text(json.dumps({'elements':elements,'source':{'provider':'OpenFreeMap / OpenMapTiles / OpenStreetMap','tilejson':template,'tiles':len(selected),'bytes':total,'generalized':True,'licence':'ODbL 1.0; OpenMapTiles CC BY 4.0'}},separators=(',',':')),encoding='utf8')
  print('READY',route['id'],len(elements),'features',total,'bytes',flush=True)
 except Exception as e:print('FAILED',route['id'],str(e),flush=True)

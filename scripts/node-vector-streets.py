"""Node generalized OSM vector streets at real same-grade intersections.
Build-time only. Requires the same ignored map-tools environment as the decoder.
Preserves access/oneway tags and never joins an overpass to the road below it.
"""
import sys,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent;sys.path.insert(0,str(ROOT/'assets/map-tools'))
from shapely.geometry import LineString,Point
from shapely.strtree import STRtree
cache=ROOT/'assets/route-source'
def grade(e):
 t=e['tags'];return (str(t.get('layer','0')),t.get('bridge',''),t.get('tunnel',''))
def points(g):
 if g.is_empty:return []
 if g.geom_type=='Point':return [g]
 if g.geom_type in ['MultiPoint','GeometryCollection']:return [p for s in g.geoms for p in points(s)]
 if g.geom_type in ['LineString','MultiLineString']:return points(g.boundary)
 return []
for file in sorted(cache.glob('atlas-*-osm.json')):
 data=json.loads(file.read_text(encoding='utf8'))
 if not data.get('source',{}).get('generalized') or data['source'].get('noded'):continue
 roads=[e for e in data['elements'] if e['type']=='way' and e.get('tags',{}).get('highway') and len(e.get('geometry',[]))>1]
 lines=[LineString([(p['lon'],p['lat']) for p in e['geometry']]) for e in roads];tree=STRtree(lines);cuts=[{} for _ in roads]
 for i,line in enumerate(lines):
  for j in tree.query(line,predicate='intersects'):
   j=int(j)
   if j<=i or grade(roads[i])!=grade(roads[j]):continue
   for p in points(line.intersection(lines[j])):
    key=(round(p.x,6),round(p.y,6));cuts[i][key]=p;cuts[j][key]=p
  for endpoint in [Point(line.coords[0]),Point(line.coords[-1])]:
   for j in tree.query(endpoint,predicate='dwithin',distance=.000008):
    j=int(j)
    if j==i or grade(roads[i])!=grade(roads[j]):continue
    key=(round(endpoint.x,6),round(endpoint.y,6));cuts[j][key]=endpoint
 inserted=0
 for e,line,extra in zip(roads,lines,cuts):
  if not extra:continue
  ordered=[(line.project(Point(x,y)),(round(x,6),round(y,6))) for x,y in line.coords]
  ordered.extend((line.project(p),key) for key,p in extra.items());ordered.sort(key=lambda v:v[0]);xy=[]
  for _,p in ordered:
   if not xy or xy[-1]!=p:xy.append(p)
  inserted+=max(0,len(xy)-len(e['geometry']));e['geometry']=[{'lon':x,'lat':y} for x,y in xy]
 data['source']['noded']=True;data['source']['topology']='Same-grade street intersections normalized within 1 m; source grade and access restrictions retained.'
 file.write_text(json.dumps(data,separators=(',',':')),encoding='utf8');print(file.stem,len(roads),'roads',inserted,'junction vertices',flush=True)

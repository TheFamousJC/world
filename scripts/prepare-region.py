"""Prepare the offline Brest frontier map from cached OSM extracts.

Raw extracts are ignored by Git. The adapted data and its provenance are shipped.
No map tiles are scraped. Run with Python 3; no third-party packages are required.
"""
import json
import pathlib
import xml.etree.ElementTree as ET

ROOT=pathlib.Path(__file__).resolve().parent.parent
source=json.loads((ROOT/'assets/brest-osm.json').read_text(encoding='utf-8-sig'))
features=[]
stations=[]
for e in source['elements']:
    tags=e.get('tags',{})
    if e['type']=='node':
        if tags.get('railway')=='station':
            stations.append({'id':str(e['id']),'name':tags.get('name:en',tags.get('int_name',tags.get('name','Station'))),'coordinates':[e['lon'],e['lat']]})
        continue
    geometry=e.get('geometry',[])
    if len(geometry)<2:continue
    kind='border' if tags.get('boundary')=='administrative' and tags.get('admin_level')=='2' else 'road' if 'highway' in tags else 'rail' if tags.get('railway')=='rail' else 'water' if 'waterway' in tags else None
    if not kind:continue
    if kind=='road' and tags.get('highway') in ['proposed','construction']:continue
    if any(not p for p in geometry):continue
    props={'id':str(e['id']),'kind':kind,'class':tags.get('highway',tags.get('waterway','')),'name':tags.get('name:en',tags.get('name',tags.get('ref','')))}
    if kind in ['road','rail']:
        props['nodes']=[str(n) for n in e.get('nodes',[])]
        for k in ['oneway','access','foot','bicycle','motor_vehicle','motorcar','surface','bridge','tunnel']:
            if k in tags:props[k]=tags[k]
    features.append({'type':'Feature','properties':props,'geometry':{'type':'LineString','coordinates':[[round(p['lon'],7),round(p['lat'],7)] for p in geometry]}})

# Include actual buildings, green spaces and water polygons where the local
# extracts contain them. Unknown heights are represented by a modest default.
seen=set()
for filename in ['brest.osm','brest-east.osm']:
    tree=ET.parse(ROOT/'assets'/filename).getroot()
    nodes={n.attrib['id']:[float(n.attrib['lon']),float(n.attrib['lat'])] for n in tree.findall('node')}
    for way in tree.findall('way'):
        identity=way.attrib['id']
        if identity in seen:continue
        seen.add(identity)
        tags={t.attrib['k']:t.attrib['v'] for t in way.findall('tag')}
        kind='building' if 'building' in tags else 'water-area' if tags.get('natural')=='water' else 'park' if tags.get('landuse') in ['forest','grass','meadow','recreation_ground','cemetery'] or tags.get('leisure') in ['park','garden'] else None
        if not kind:continue
        refs=[n.attrib['ref'] for n in way.findall('nd')]
        if len(refs)<4 or refs[0]!=refs[-1] or any(r not in nodes for r in refs):continue
        try:height=float(tags.get('height',float(tags.get('building:levels',2))*3))
        except ValueError:height=6
        features.append({'type':'Feature','properties':{'id':'area-'+identity,'kind':kind,'name':tags.get('name:en',tags.get('name','')),'height':min(65,max(3,height)),'heightEstimated':'height' not in tags and 'building:levels' not in tags},'geometry':{'type':'Polygon','coordinates':[[nodes[r] for r in refs]]}})

data={'type':'FeatureCollection','features':features,'metadata':{'name':'Brest–Terespol frontier district','bounds':[23.53,52.04,23.77,52.16],'snapshot':source.get('osm3s',{}).get('timestamp_osm_base'),'retrieved':'2026-10-20','attribution':'© OpenStreetMap contributors','licence':'ODbL 1.0','source':'OpenStreetMap API and Overpass extracts','note':'Real reference geometry. All game services, access conditions and shelters are fictional. Building heights may be estimated.'},'stations':stations}
out=ROOT/'public/data/region.geojson'
out.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
counts={}
for f in features:counts[f['properties']['kind']]=counts.get(f['properties']['kind'],0)+1
print(json.dumps({'bytes':out.stat().st_size,'features':counts,'snapshot':data['metadata']['snapshot']}))

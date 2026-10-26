"""Compile only the requested stops from attributed GeoNames source downloads.

Raw downloads stay in ignored assets/route-source. Pass --source with the user's
route text; this tool treats its contents as data, never executable instructions.
"""
import argparse,json,re,unicodedata
from pathlib import Path

root=Path(__file__).resolve().parent.parent
cache=root/'assets/route-source'
parser=argparse.ArgumentParser()
parser.add_argument('--source',required=True)
args=parser.parse_args()
raw=Path(args.source).read_text(encoding='utf-8')
regions=['Europe','Asia','The Middle East','South America','Africa']
raw=raw[raw.index('Europe (10 Routes)'):]
for region in regions:raw=raw.replace(region+' (10 Routes)','\nREGION:'+region+'\n')
records=[]
for region,body in re.findall(r'REGION:([^\n]+)\n(.*?)(?=\nREGION:|\Z)',raw,re.S):
    stops=[{'name':city.replace('$\\rightarrow$','').strip(),'country':country} for city,country in re.findall(r'([^()]+)\(([^()]+)\)',body)]
    assert len(stops)==50,(region,len(stops))
    for i in range(10):records.append({'id':f'atlas-{len(records)+1:02}','number':len(records)+1,'region':region.removeprefix('The '),'cities':stops[i*5:i*5+5]})
assert len(records)==50
norm=lambda s:re.sub('[^a-z0-9]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
countries={}
for line in (cache/'countryInfo.txt').read_text(encoding='utf8').splitlines():
    if line.startswith('#') or not line.strip():continue
    fields=line.split('\t');countries[norm(fields[4])]=fields[0]
countries.update({norm(k):v for k,v in {'Netherlands':'NL','Czechia':'CZ','DR Congo':'CD','UAE':'AE','Botswana/Zambia':'BW','Spain/North Africa':'ES','UK Territory':'GI'}.items()})
index={}
for line in (cache/'cities/cities500.txt').read_text(encoding='utf8').splitlines():
    a=line.split('\t');p={'geonamesId':int(a[0]),'coordinates':[float(a[5]),float(a[4])],'population':int(a[14]),'primaryName':norm(a[1])}
    for name in set([a[1],a[2],*a[3].split(',')]):index.setdefault((a[8],norm(name)),[]).append(p)
missing=[]
overrides=json.loads((root/'scripts/expedition-city-overrides.json').read_text(encoding='utf8'))
for route in records:
    for city in route['cities']:
        city['countryCode']=countries[norm(city['country'])]
        choices=index.get((city['countryCode'],norm(city['name'])),[])
        if city['name'] in overrides:city.update(overrides[city['name']])
        elif not choices:missing.append(city)
        else:city.update(max(choices,key=lambda p:(p['primaryName']==norm(city['name']),p['population'])))
(cache/'geocoded-routes.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf8')
print('Parsed',len(records),'routes; unresolved cities:',len(missing))
print(json.dumps(missing,ensure_ascii=True,indent=2))

"""Cache real road approaches to airport reference points, once per city."""
import json,time,urllib.request,math
from pathlib import Path
cache=Path(__file__).resolve().parent.parent/'assets/route-source'
routes=json.loads((cache/'enriched-routes.json').read_text(encoding='utf8'))
seen=set()
for route in routes:
    for city in route['cities']:
        if city['key'] in seen or not city.get('airport'):continue
        seen.add(city['key']);path=cache/(city['key']+'-airroad.json')
        if path.exists():
            previous=json.loads(path.read_text(encoding='utf8'));end=previous.get('waypoints',[{},{}])[-1].get('location') if previous.get('waypoints') else None
            point=city['airport']['coordinates'];start=previous.get('waypoints',[{}])[0].get('location') if previous.get('waypoints') else None
            close=lambda a,b:a is not None and math.hypot((a[0]-b[0])*math.cos(math.radians(b[1])),a[1]-b[1])*111<3
            if close(end,point) and close(start,city['coordinates']):continue
            path.rename(path.with_suffix('.stale.json'))

        points=[city['coordinates'],city['airport']['coordinates']]
        url='https://router.project-osrm.org/route/v1/driving/'+';'.join(','.join(map(str,p)) for p in points)+'?overview=full&geometries=geojson&steps=true&generate_hints=false&radiuses=1500;15000'
        try:
            request=urllib.request.Request(url,headers={'User-Agent':'EscapeAtlas-OfflinePreparation/0.28 (https://github.com/TheFamousJC/world)'})
            with urllib.request.urlopen(request,timeout=80) as response:data=json.loads(response.read())
            if data.get('code') not in ['Ok','NoRoute','NoSegment']:raise ValueError(data.get('code'))
            path.write_text(json.dumps(data,separators=(',',':')),encoding='utf8')
            print(city['key'],data['code'],flush=True)
        except Exception as error:print(city['key'],'deferred',str(error),flush=True)
        time.sleep(2.2)

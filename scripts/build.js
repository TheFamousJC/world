import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'dist');
fs.mkdirSync(out,{recursive:true});fs.cpSync(path.join(root,'public'),out,{recursive:true});fs.cpSync(path.join(root,'src'),path.join(out,'src'),{recursive:true});
const files=fs.readdirSync(out,{recursive:true}).map(f=>path.join(out,f)).filter(f=>fs.statSync(f).isFile()&&!f.endsWith('.gz')).sort();
const hash=createHash('sha256');for(const file of files)hash.update(fs.readFileSync(file));const buildId=hash.digest('hex').slice(0,16);
const html=path.join(out,'index.html');fs.writeFileSync(html,fs.readFileSync(html,'utf8').replace('content="development"','content="production"'));
const regionalHash=createHash('sha256');for(const file of ['osaka.geojson','tokyo.geojson'])regionalHash.update(fs.readFileSync(path.join(out,'data',file)));const regionRevision=regionalHash.digest('hex').slice(0,16);
const packLoader=path.join(out,'src','map-packs.js');fs.writeFileSync(packLoader,fs.readFileSync(packLoader,'utf8').replace('REGION_REVISION',regionRevision));
const worker=path.join(out,'sw.js');fs.writeFileSync(worker,fs.readFileSync(worker,'utf8').replace('BUILD_ID',buildId).replace('REGION_REVISION',regionRevision));
for(const folder of ['data','src','vendor'])for(const f of fs.readdirSync(path.join(out,folder),{recursive:true})){const file=path.join(out,folder,f);if(fs.statSync(file).isFile()&&/\.(json|geojson|js|mjs|css)$/.test(file)){const buffer=fs.readFileSync(file);fs.writeFileSync(file+'.gz',zlib.gzipSync(buffer,{level:9}));}}
fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log('Built static game in dist/ (no package installation or paid services required).');

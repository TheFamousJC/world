// Offline analytical devices for fictional expedition evidence. No remote calls.
export const EXPEDITION_METHODS=['hex','binary','base64','atbash','vigenere','railfence','columnar','polybius','book','acrostic','telephone','rot13','dms','bearing','timelog','checksum','schedule','digest','xor','substitution','exif','recordsjoin'];
export const EXPEDITION_TOOL_SPECS={
 hex:['Hex decoder','Hexadecimal bytes','', 'Separate ASCII bytes with spaces, for example 43 4f 44 45.'],
 binary:['Binary decoder','Eight-bit groups','', 'Use eight binary digits for each ASCII character.'],
 base64:['Base64 decoder','Encoded transmission','', 'Decode the complete captured message, then extract its code.'],
 atbash:['Atbash mirror','Ciphertext','', 'Mirror A↔Z, B↔Y, then read A–J as digits 0–9.'],
 vigenere:['Vigenère lab','Ciphertext','Keyword','Repeat the supplied keyword and reverse its alphabetic shifts.'],
 railfence:['Rail-fence lab','Ciphertext','Number of rails','Reconstruct the zigzag transposition using the rail count.'],
 columnar:['Columnar lab','Ciphertext','Column key','Use each digit 1–4 once. Restore the columns in key order, then read rows.'],
 polybius:['Polybius grid','Coordinate pairs','', 'Use a 6×6 grid: A–Z followed by 0–9. Each pair is row then column, numbered 1–6.'],
 book:['Book-cipher desk','Reference passage','Word positions','Enter comma-separated, one-based word positions. Extract the trailing digit of each selected token.'],
 acrostic:['Acrostic reader','Four source lines','', 'Read the first letter of each line, then apply A=0 through J=9.'],
 telephone:['Multi-tap decoder','Keypress groups','', 'Use old phone multi-tap: 2=ABC, 3=DEF, 4=GHI, 5=JKL, 6=MNO, 7=PQRS, 8=TUV, 9=WXYZ. Dots separate letters; / separates words.'],
 rot13:['ROT13 reader','Encoded words','', 'Reverse ROT13, then read the spelled-out number words.'],
 dms:['Coordinate conversion','Latitude in DMS','Longitude in DMS','Convert degrees, minutes and seconds with N/S/E/W. Match the result to this packet’s relay directory.'],
 bearing:['Bearing and range','Latitude,longitude,bearing,km','', 'Project the stated true bearing and distance from the reference point, then match the receiving relay.'],
 timelog:['Timeline comparison','Start timestamp','End timestamp','Use full ISO timestamps with their recorded UTC offsets. The elapsed minutes, padded to four digits, form the code.'],
 checksum:['Checksum verifier','Candidate four-digit records','Weights | seal','Enter four comma-separated weights, then | and the seal remainder. Compare weighted digit sums modulo 97.'],
 schedule:['Timetable filter','Earliest departure,latest arrival,budget','', 'Use HH:MM,HH:MM,amount. Select the only archived service that meets all three constraints.'],
 digest:['File-hash comparison','Recovered file contents','', 'Compute SHA-256 locally. Compare the digest with the archive reference, then read the corresponding record code.'],
 xor:['Known-plaintext lab','Cipher bytes in hex','Known prefix','Recover a repeating key from the known prefix, then decrypt the remaining bytes.'],
 substitution:['Substitution desk','Ciphertext','Substitution alphabet','The key gives the cipher equivalent of A–Z. Reverse that mapping and read the number words.'],
 exif:['Photo evidence inspector','Recovered filename','', 'Inspect cached synthetic metadata. Compare GPS and capture time with the source brief; filenames and captions can mislead.'],
 recordsjoin:['Registry cross-reference','Receiver alias','Required issuer','Join the receiver index to the dispatch register using the serial number and trusted issuer.']
};
export const EXPEDITION_METHOD_NAMES=Object.fromEntries(Object.entries(EXPEDITION_TOOL_SPECS).map(([k,v])=>[k,v[0]]));
const words=['ZERO','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE'];
const numericWords=text=>String(text).toUpperCase().split(/[^A-Z]+/).filter(Boolean).map(w=>words.indexOf(w)).filter(n=>n>=0).join('');
const lettersToDigits=text=>String(text).replace(/[A-J]/g,c=>String(c.charCodeAt(0)-65));
const result=text=>'Decoded: '+text+'\nExtracted code: '+(String(text).match(/\d{4}/)?.[0]||numericWords(text)||lettersToDigits(text));
const shift=(text,n)=>text.replace(/[A-Z]/g,c=>String.fromCharCode(65+(c.charCodeAt(0)-65+n+2600)%26));
const bytes=text=>String(text).trim().split(/\s+/).filter(Boolean);
const hours=text=>{const m=/^(\d{2}):?(\d{2})$/.exec(String(text).trim());return m&&+m[1]<24&&+m[2]<60?+m[1]*60+ +m[2]:null;};
export function railPattern(length,rails){const pattern=[];let row=0,step=1;for(let i=0;i<length;i++){pattern.push(row);if(row===0)step=1;if(row===rails-1)step=-1;row+=step;}return pattern;}
export function destinationPoint(lat,lon,bearing,km){const r=km/6371,a=lat*Math.PI/180,b=lon*Math.PI/180,t=bearing*Math.PI/180,y=Math.asin(Math.sin(a)*Math.cos(r)+Math.cos(a)*Math.sin(r)*Math.cos(t)),x=b+Math.atan2(Math.sin(t)*Math.sin(r)*Math.cos(a),Math.cos(r)-Math.sin(a)*Math.sin(y));return [x*180/Math.PI,y*180/Math.PI];}
function dms(value){const text=String(value).trim(),parts=text.match(/-?\d+(?:\.\d+)?/g)?.map(Number),hemisphere=text.match(/([NSEW])\s*$/i)?.[1]?.toUpperCase();if(!parts||parts.length!==3||parts[1]<0||parts[1]>=60||parts[2]<0||parts[2]>=60)return null;const angle=Math.abs(parts[0])+parts[1]/60+parts[2]/3600;return angle*((hemisphere==='S'||hemisphere==='W'||!hemisphere&&parts[0]<0)?-1:1);}
function relay(p,lon,lat){const r=p.directory?.find(r=>Math.abs(r.lon-lon)<.00025&&Math.abs(r.lat-lat)<.00025);return 'Location: '+lat.toFixed(6)+', '+lon.toFixed(6)+'\n'+(r?'Matched relay '+r.name+' · Code '+r.code:'No matching receiving relay. Check the source values.');}
export function analyseExpedition(p,tool,input={}){
 const text=String(input.text||'').trim(),key=String(input.key||'').trim();
 if(tool==='hex'){const parts=bytes(text);if(!parts.length||parts.some(b=>!/^[\da-f]{2}$/i.test(b)))return 'Enter complete hexadecimal byte pairs.';return result(String.fromCharCode(...parts.map(b=>parseInt(b,16))));}
 if(tool==='binary'){const parts=bytes(text);if(!parts.length||parts.some(b=>!/^[01]{8}$/.test(b)))return 'Use eight-bit binary groups.';return result(String.fromCharCode(...parts.map(b=>parseInt(b,2))));}
 if(tool==='base64'){try{return result(atob(text));}catch{return 'Invalid Base64 transmission. Copy the complete evidence.';}}
 if(tool==='atbash')return result(lettersToDigits(text.toUpperCase().replace(/[A-Z]/g,c=>String.fromCharCode(90-(c.charCodeAt(0)-65)))));
 if(tool==='vigenere'){const k=key.toUpperCase().replace(/[^A-Z]/g,'');if(!k)return 'Enter the keyword from the source card.';let n=0;return result(lettersToDigits(text.toUpperCase().replace(/[A-Z]/g,c=>shift(c,-(k.charCodeAt(n++%k.length)-65)))));}
 if(tool==='railfence'){const rails=Number(key);if(!Number.isInteger(rails)||rails<2||rails>8)return 'Use a rail count between 2 and 8.';const pattern=railPattern(text.length,rails),rows=Array.from({length:rails},()=>[]);let cursor=0;for(let r=0;r<rails;r++)for(const row of pattern)if(row===r)rows[r].push(text[cursor++]);return result(pattern.map(row=>rows[row].shift()).join(''));}
 if(tool==='columnar'){if(!/^[1-4]{4}$/.test(key)||new Set(key).size!==4||text.length%4)return 'Use a four-column key containing 1,2,3,4 once, and complete four-character rows.';const rows=text.length/4,columns=Array(4);let cursor=0;for(let n=1;n<=4;n++){const index=key.indexOf(String(n));columns[index]=text.slice(cursor,cursor+rows);cursor+=rows;}return result(Array.from({length:rows},(_,r)=>columns.map(c=>c[r]).join('')).join(''));}
 if(tool==='polybius'){const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',pairs=text.match(/\d{2}/g);if(!pairs?.length||pairs.some(v=>!/[1-6][1-6]/.test(v)))return 'Use row-column pairs from 11 through 66.';return result(pairs.map(v=>alphabet[(+v[0]-1)*6+ +v[1]-1]).join(''));}
 if(tool==='book'){const tokens=text.split(/\s+/),positions=key.split(/[,\s]+/).map(Number);if(positions.length!==4||positions.some(n=>!Number.isInteger(n)||n<1||n>tokens.length))return 'Enter four valid one-based word positions.';const selected=positions.map(n=>tokens[n-1]);return 'Selected tokens: '+selected.join(' · ')+'\nExtracted code: '+selected.map(t=>t.match(/(\d)\W*$/)?.[1]||'?').join('');}
 if(tool==='acrostic'){const lines=text.split(/\n+/).filter(s=>s.trim());return result(lettersToDigits(lines.map(line=>line.trim()[0].toUpperCase()).join('')));}
 if(tool==='telephone'){const phone={2:'ABC',3:'DEF',4:'GHI',5:'JKL',6:'MNO',7:'PQRS',8:'TUV',9:'WXYZ'};try{const decoded=text.split(/\s*\/\s*/).map(word=>word.split('.').map(g=>{const letters=phone[g[0]];if(!letters||new Set(g).size!==1||g.length>letters.length)throw Error();return letters[g.length-1];}).join('')).join(' ');return result(decoded);}catch{return 'Check multi-tap groups: dots between letters, / between words.';}}
 if(tool==='rot13')return result(shift(text.toUpperCase(),13));
 if(tool==='dms'){const lat=dms(text),lon=dms(key);return lat===null||lon===null||Math.abs(lat)>90||Math.abs(lon)>180?'Enter both DMS values and their hemisphere letters.':relay(p,lon,lat);}
 if(tool==='bearing'){const v=text.split(',').map(Number);return v.length!==4||v.some(n=>!Number.isFinite(n))||Math.abs(v[0])>85||Math.abs(v[1])>180||v[3]<0?'Use latitude,longitude,bearing,range-km.':(()=>{const q=destinationPoint(...v);return relay(p,q[0],q[1]);})();}
 if(tool==='timelog'){const a=Date.parse(text),b=Date.parse(key),minutes=Math.round((b-a)/60000);return !Number.isFinite(minutes)||minutes<0||minutes>9999?'Use full timestamps with their UTC offsets, ending after the start.':'Elapsed minutes / Code: '+String(minutes).padStart(4,'0');}
 if(tool==='checksum'){const [weights,seal]=key.split('|'),w=weights?.split(',').map(Number),target=Number(seal),codes=text.match(/\b\d{4}\b/g);if(!w||w.length!==4||w.some(n=>!Number.isFinite(n))||seal===undefined||!Number.isInteger(target)||target<0||target>=97||!codes)return 'Use four weights, then | and the seal remainder. Paste the candidate codes separately.';return codes.map(code=>{const sum=[...code].reduce((s,v,i)=>s+Number(v)*w[i],0)%97;return code+' → '+sum+(sum===target?' MATCH':'');}).join('\n');}
 if(tool==='schedule'){const values=text.split(','),first=hours(values[0]),last=hours(values[1]),budget=Number(values[2]);if(first===null||last===null||!Number.isFinite(budget)||values.length!==3)return 'Use earliest HH:MM,latest HH:MM,budget.';return p.records?.filter(r=>r.depart>=first&&r.arrive<=last&&r.cash<=budget).map(r=>r.name+' · Code '+r.code).join('\n')||'No archived service satisfies all constraints.';}
 if(tool==='digest')return (async()=>{const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(b=>b.toString(16).padStart(2,'0')).join(''),record=p.files?.find(f=>f.digest===digest);return 'SHA-256: '+digest+'\nArchive reference match: '+(digest===p.referenceDigest?'YES':'NO')+(record?'\nRecord code: '+record.code:'\nNo corresponding archive record.');})();
 if(tool==='xor'){const parts=bytes(text),known=[...key].map(c=>c.charCodeAt(0));if(!known.length||known.length>32||parts.length<=known.length||parts.some(b=>!/^[\da-f]{2}$/i.test(b)))return 'Enter complete cipher bytes and the known prefix.';const encoded=parts.map(b=>parseInt(b,16)),recovered=known.map((v,i)=>v^encoded[i]);return 'Recovered key: '+recovered.join(',')+'\n'+result(String.fromCharCode(...encoded.map((v,i)=>v^recovered[i%recovered.length])));}
 if(tool==='substitution'){const alphabet=key.toUpperCase();if(!/^[A-Z]{26}$/.test(alphabet)||new Set(alphabet).size!==26)return 'Enter a complete 26-letter substitution alphabet.';return result(text.toUpperCase().replace(/[A-Z]/g,c=>String.fromCharCode(65+alphabet.indexOf(c))));}
 if(tool==='exif'){const file=p.files?.find(f=>f.name.toLowerCase()===text.toLowerCase());return file?.metadata?JSON.stringify(file.metadata,null,2):'No recovered file with that name. Check the filename in the evidence.';}
 if(tool==='recordsjoin'){const receiver=p.receivers?.find(r=>r.alias.toLowerCase()===text.toLowerCase()),rows=receiver&&p.records?.filter(r=>r.serial===receiver.serial&&r.issuer.toLowerCase()===key.toLowerCase());return rows?.map(r=>r.serial+' · '+r.issuer+' · Code '+r.code).join('\n')||'No joined record matches both references.';}
 return 'No matching analysis device.';
}

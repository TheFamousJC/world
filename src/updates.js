// A waiting worker is only an update when it represents a newer release.
export function newerRelease(offered,current){
 const parse=s=>/^v?(\d+)\.(\d+)\.(\d+)$/.exec(s||'')?.slice(1).map(Number);
 const a=parse(offered),b=parse(current);if(!a||!b)return true;
 for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i];}return false;
}
export function workerRelease(worker){
 return new Promise(resolve=>{const channel=new MessageChannel();let done=false;
 const finish=value=>{if(done)return;done=true;clearTimeout(timer);channel.port1.close();resolve(value);};
 const timer=setTimeout(()=>finish(null),1500);channel.port1.onmessage=e=>finish(e.data?.release||null);
 try{worker.postMessage({type:'GET_RELEASE'},[channel.port2]);}catch{finish(null);}
 });
}

from pathlib import Path
import sys,math,wave,json,subprocess
sys.path.insert(0,str(Path('assets/map-tools').resolve()))
import numpy as np
from PIL import Image,ImageDraw,ImageFont
OUT=Path('test-results/trailer-build');OUT.mkdir(parents=True,exist_ok=True)
FF=str(Path('assets/video-tools/python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe').resolve())
SR=44100;DURATION=30;mix=np.zeros((SR*DURATION,2),dtype=np.float64);rng=np.random.default_rng(3301)
def add(at,x,pan=0):
 start=int(at*SR);n=min(len(x),len(mix)-start)
 if start<0 or n<=0:return
 mix[start:start+n,0]+=x[:n]*math.sqrt((1-pan)/2);mix[start:start+n,1]+=x[:n]*math.sqrt((1+pan)/2)
def note(at,hz,dur,level,bright=False,pan=0):
 t=np.arange(int(dur*SR))/SR;v=np.zeros(len(t))
 for h in range(1,7 if bright else 4):v+=np.sin(2*np.pi*hz*h*t+(np.sin(t*5)*.035 if bright else 0))/(h**(1.2 if bright else 2))
 env=(1-np.exp(-t/.009))*np.exp(-t/(dur*.28))*np.minimum(1,(dur-t)/.035);add(at,v*env*level,pan)
def kick(at,level=1):
 t=np.arange(int(.65*SR))/SR;v=np.sin(2*np.pi*(42*t+1.25*(1-np.exp(-t*38))))*np.exp(-t*9);add(at,v*.6*level)
def noise(at,dur,level):
 t=np.arange(int(dur*SR))/SR;x=rng.normal(0,1,len(t));x=np.diff(x,prepend=x[0]);add(at,x*np.exp(-t*35)*level,.25)
beat=60/132
for i in range(int(25.5/beat)):
 at=i*beat;root=[82.4069,82.4069,87.3071,77.7817][(i//8)%4]
 note(at,root,.3,.19,True,-.2)
 if at>4:kick(at,.9 if at<12 else 1.1)
 if i%2 and at>5:noise(at,.15,.075)
 for q in range(2 if at<13 else 4):
  a=at+q*beat/(2 if at<13 else 4);noise(a,.055,.018 if at<13 else .027)
 if at>7:
  riff=[329.63,493.88,392,311.13,349.23,493.88,392,369.99]
  note(at,riff[i%8],.38,.065,True,(-1 if i%2 else 1)*.4)
 if i%4==0:
  for h in [1,1.1892,1.4983]:note(at,root*2*h,1.6,.045,True,(-.2 if h==1 else .2))
for at in [0,4.5,10.5,12.5,17.5,22.5,25.5]:
 kick(at,1.3);noise(at,.65,.09)
for end in [12.5,17.5,25.5]:
 dur=1.35;t=np.arange(int(dur*SR))/SR;x=rng.normal(0,1,len(t));v=(np.sin(2*np.pi*(180*t+900*t*t))+x*.3)*(t/dur)**2;add(end-dur,v*.07)
for hz in [82.4069,164.8138,196,246.9417]:note(25.5,hz,4.4,.16,True)
fade=np.ones(len(mix));fade[:int(.04*SR)]=np.linspace(0,1,int(.04*SR));fade[-int(1.5*SR):]=np.linspace(1,0,int(1.5*SR));mix*=fade[:,None];mix=np.tanh(mix*1.15);mix*=.88/np.max(np.abs(mix))
with wave.open(str(OUT/'score.wav'),'wb')as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes((mix*32767).astype('<i2').tobytes())
font='C:/Windows/Fonts/segoeuib.ttf';regular='C:/Windows/Fonts/segoeui.ttf'
def card(name,lines,opaque=False):
 im=Image.new('RGBA',(1280,720),(4,14,23,255)if opaque else(0,0,0,0));d=ImageDraw.Draw(im)
 if opaque:
  for y in range(0,720,40):d.line((0,y,1280,y),fill=(55,108,112,30))
  for x in range(0,1280,40):d.line((x,0,x,720),fill=(55,108,112,30))
 for text,size,y,color in lines:
  f=ImageFont.truetype(font if size>35 else regular,size);box=d.textbbox((0,0),text,font=f);x=(1280-(box[2]-box[0]))/2;d.text((x,y),text,font=f,fill=color,stroke_width=1,stroke_fill=(0,0,0,200))
 im.save(OUT/(name+'.png'));return str(OUT/(name+'.png'))
card('intro',[('3Sci Labs',70,280,'#a6f4df'),('P R E S E N T S',22,375,'#b7d4d9')],True)
card('end',[('ESCAPE ATLAS',94,210,'#e6fff8'),('THE CLOCK IS RUNNING.',35,340,'#ffcb7a'),('Play free · thefamousjc.github.io/world/',27,440,'#b8e5df'),('by 3Sci Labs',22,505,'#82b3b7')],True)
labels=['FIVE CITIES. ONE ESCAPE.','EVERY SECOND COUNTS.','THEY ARE CLOSING IN.','FIND YOUR WAY OUT.','CRACK THE CODE.','KEEP MOVING.']
for i,label in enumerate(labels):
 im=Image.new('RGBA',(1280,720));d=ImageDraw.Draw(im);d.rectangle((300,10,1250,95),fill=(3,15,23,210));f=ImageFont.truetype(font,36);d.text((325,30),label,font=f,fill='#f1e7cf');d.rectangle((300,10,305,95),fill='#ffd17c');im.save(OUT/f'label-{i}.png')
def run(args):subprocess.run([FF,'-hide_banner','-loglevel','error','-y',*args],check=True)
def still(image,dur,out):run(['-loop','1','-i',image,'-t',str(dur),'-vf','fps=30,format=yuv420p','-c:v','libx264','-preset','fast','-crf','20',str(out)])
still(str(OUT/'intro.png'),1.5,OUT/'part-0.mp4')
timing=json.loads(Path('test-results/trailer-flight/timing.json').read_text())
# Actual captured play, editorially accelerated. Existing explainer captions are cropped away.
clips=[('test-results/trailer-flight/flight.webm',timing['globeAt']+.3,3,3),('public/media/escape-atlas-gameplay.mp4',34,15,6),('public/media/escape-atlas-gameplay.mp4',20,4,2),('test-results/trailer-flight/flight.webm',timing['arrivalAt']-1.5,3.5,5),('public/media/escape-atlas-gameplay.mp4',56,15,5),('public/media/escape-atlas-gameplay.mp4',72,6,3)]
for i,(source,start,length,duration)in enumerate(clips):
 run(['-ss',str(start),'-t',str(length),'-i',source,'-loop','1','-i',str(OUT/f'label-{i}.png'),'-filter_complex',f'[0:v]crop=1280:720:0:80,setpts=(PTS-STARTPTS)*{duration/length},fps=30,eq=contrast=1.06:saturation=1.12[v];[v][1:v]overlay=0:0:shortest=1,format=yuv420p[out]','-map','[out]','-t',str(duration),'-an','-c:v','libx264','-crf','20','-preset','fast',str(OUT/f'part-{i+1}.mp4')])
still(str(OUT/'end.png'),4.5,OUT/'part-7.mp4')
(OUT/'parts.txt').write_text(''.join("file '"+str((OUT/f'part-{i}.mp4').resolve()).replace('\\','/')+"'\n"for i in range(8)),encoding='utf8')
run(['-f','concat','-safe','0','-i',str(OUT/'parts.txt'),'-i',str(OUT/'score.wav'),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-af','loudnorm=I=-16:TP=-2:LRA=9','-ar','48000','-t','30','-movflags','+faststart','public/media/escape-atlas-trailer.mp4'])
run(['-ss','7','-i','public/media/escape-atlas-trailer.mp4','-frames:v','1','public/media/escape-atlas-trailer.jpg'])
print('PASS 30-second trailer: genuine accelerated gameplay, original stereo score, stable play URL. Peak source:',float(np.max(np.abs(mix))))

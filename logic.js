export const CROPS={wheat:{n:'Wheat',kc:[.4,.75,1.15,.4],sea:350,d:150},rice:{n:'Rice',kc:[1.05,1.1,1.2,.9],sea:900,d:120},cotton:{n:'Cotton',kc:[.35,.75,1.15,.7],sea:600,d:180},sugarcane:{n:'Sugarcane',kc:[.4,.9,1.25,.75],sea:1200,d:330},maize:{n:'Maize',kc:[.3,.8,1.2,.6],sea:450,d:120},vegetables:{n:'Vegetables',kc:[.5,.8,1.05,.85],sea:400,d:110}}
export const STAGES=['Initial','Development','Mid-season','Late season']
export const SOILS={sandy:{n:'Sandy',c:40},loam:{n:'Loam',c:65},silt:{n:'Silty loam',c:80},clay:{n:'Clay',c:90}}
export const ACRE=4046.86
const cl=(v,a=0,b=100)=>Math.max(a,Math.min(b,v))
export const compass=d=>['N','NE','E','SE','S','SW','W','NW'][Math.round(d/45)%8]
export function wmo(c,w){if(w>30)return['💨','Windy'];if(c==0)return['☀️','Sunny'];if(c<3)return['🌤️','Partly cloudy'];if(c==3)return['☁️','Cloudy'];if(c<50)return['🌫️','Foggy'];if(c<70||c>=80&&c<83)return['🌧️','Rainy'];if(c<80)return['❄️','Snow'];return['⛈️','Thunderstorm']}

export function plan(w,f){
 const d=w.daily,h=w.hourly,kc=CROPS[f.crop].kc[f.stage],cap=SOILS[f.soil].c,mad=cap*.5
 const today=w.current.time.slice(0,10),t0=d.time.indexOf(today),nowH=+w.current.time.slice(11,13)
 const ago=cl(Math.round((new Date(today)-new Date(f.last))/864e5),0,7)
 let D=0
 const step=i=>cl(D+d.et0_fao_evapotranspiration[i]*kc-(d.precipitation_sum[i]||0)*.8,0,cap)
 for(let i=t0-ago+1;i<t0;i++)D=step(i)
 // hourly suitability score
 const sc=j=>{const hr=+h.time[j].slice(11,13),T=h.temperature_2m[j],W=h.wind_speed_10m[j],R=h.precipitation[j],P=h.precipitation_probability[j]||0
  let s=100-Math.max(0,T-24)*2.5-Math.max(0,W-10)*2-(R>.2?40:0)-Math.max(0,P-40)*.5
  if(hr>=5&&hr<=8||hr>=17&&hr<=19)s+=10;if(hr>=10&&hr<=16)s-=25;if(hr>=21||hr<4)s-=20;return s}
 const win=(i,k)=>{const s=h.time.findIndex(x=>x.startsWith(d.time[i]));let b=null
  for(let a=k==0?Math.max(nowH,4):4;a<=19;a++){const j=s+a,v=sc(j)+sc(j+1);if(!b||v>b.v)b={a,b:a+2,v,T:(h.temperature_2m[j]+h.temperature_2m[j+1])/2,W:(h.wind_speed_10m[j]+h.wind_speed_10m[j+1])/2}}
  return b||{a:5,b:7,v:0,T:25,W:10}}
 const days=[];let total=0
 for(let k=0;k<7;k++){const i=t0+k,rain=d.precipitation_sum[i]||0,p=d.precipitation_probability_max[i]||0,before=D
  D=step(i);let s='none',mm=0
  if(rain>=4||p>=70&&rain>=1.5)s='rain'
  else if(D>=mad){s='irrigate';mm=D;D=0;total+=mm}
  else if(D>=mad*.7)s='light'
  const wn=win(i,k);days.push({date:d.time[i],s,mm,rain,p,def:before,score:cl(Math.round(wn.v/2)-(s=='rain'?30:0)),wn,code:d.weather_code[i]})}
 const first=days.findIndex(x=>x.s=='irrigate'),rainIdx=days.findIndex(x=>x.s=='rain')
 let rec,why=['dry']
 if(first>=0){const k=first==0&&nowH>19?1:first,wn=days[k].wn
  rec={type:k==0&&wn.a<=nowH+1?'now':'at',k,win:wn};if(wn.T<28&&wn.W<15)why.push('calm')
  if(!days.slice(0,4).some(x=>x.s=='rain'))why.push('norain')}
 else if(rainIdx>=0&&rainIdx<=3&&days[0].def>=mad*.6){rec={type:'wait',k:rainIdx};why=['rainsoon']}
 else{rec={type:'none'};why=['enough']}
 const mm=first>=0?days[first].mm:0
 return{days,rec,why,mm,total,trad:60,saved:Math.max(0,60-total),mad,cap,D:days[0].def}
}

export function leaf(img){
 const n=96,c=document.createElement('canvas');c.width=c.height=n
 const x=c.getContext('2d');x.drawImage(img,0,0,n,n);const p=x.getImageData(0,0,n,n).data
 let g=0,y=0,b=0,sg=0;const lum=new Float32Array(n*n)
 for(let i=0;i<n*n;i++){const r=p[i*4],gr=p[i*4+1],bl=p[i*4+2],mx=Math.max(r,gr,bl),mn=Math.min(r,gr,bl),dl=mx-mn,s=mx?dl/mx:0
  lum[i]=.3*r+.59*gr+.11*bl;if(s<.18||mx<40)continue
  let h=mx==r?((gr-bl)/dl)%6:mx==gr?(bl-r)/dl+2:(r-gr)/dl+4;h*=60;if(h<0)h+=360
  if(h>=65&&h<=170){g++;sg+=s}else if(h>=38&&h<65)y++;else if(h>=10&&h<38&&mx<200)b++}
 const L=g+y+b;if(L<n*n*.04)return null
 let e=0;for(let i=0;i<n*n-n-1;i++)e+=Math.abs(lum[i]-lum[i+1])+Math.abs(lum[i]-lum[i+n])
 e/=2*n*n
 const gf=g/L,yf=y/L,bf=b/L,sat=g?Math.min(1,sg/g/.6):0
 const idx=Math.round(cl(30+45*gf+25*sat-70*bf-35*yf-(e>12?8:0)))
 const signs=[];if(yf+bf>.12)signs.push('Reduced greenness / yellowing');if(bf>.05)signs.push('Dry brown edges or patches');if(sat<.6)signs.push('Dull leaf color');if(e>12)signs.push('Curling or wrinkled texture')
 return{idx,conf:Math.round(cl(40+50*Math.min(1,L/(n*n)/.35),40,92)),signs:signs.length?signs:['No visible stress signs'],
  band:idx>=80?['Well hydrated','ok']:idx>=60?['Mildly Stressed','mild']:idx>=40?['Moderately Stressed','mod']:['Severely Stressed','sev']}
}

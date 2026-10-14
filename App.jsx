import {useState,useEffect,useMemo,useRef} from 'react'
import {CROPS,STAGES,SOILS,ACRE,plan,leaf,wmo,compass} from './logic'
import './styles.css'

const T={
en:{now:'Irrigate now',at:'Irrigate {d} from {a} to {b}',wait:'Wait {n} days — rain expected',none:'Do not irrigate — soil moisture is sufficient',today:'today',tmrw:'tomorrow',inN:'in {n} days',dry:'The soil has dried close to the crop stress limit.',calm:'Wind and temperature are low, reducing evaporation.',norain:'Rain is not expected for the next 72 hours.',rainsoon:'Rain is forecast soon and will refill the soil.',enough:'Soil moisture is still above the stress limit.'},
ur:{now:'ابھی آبپاشی کریں',at:'{d} {a} سے {b} تک آبپاشی کریں',wait:'{n} دن انتظار کریں — بارش متوقع ہے',none:'آبپاشی نہ کریں — مٹی میں نمی کافی ہے',today:'آج',tmrw:'کل',inN:'{n} دن بعد',dry:'مٹی فصل کی دباؤ کی حد کے قریب خشک ہو چکی ہے۔',calm:'ہوا اور درجہ حرارت کم ہیں، اس لیے پانی کم بخارات بنے گا۔',norain:'اگلے 72 گھنٹوں میں بارش متوقع نہیں۔',rainsoon:'جلد بارش متوقع ہے جو مٹی کو نم کر دے گی۔',enough:'مٹی کی نمی ابھی دباؤ کی حد سے اوپر ہے۔'},
sn:{now:'هاڻي پاڻي ڏيو',at:'{d} {a} کان {b} تائين پاڻي ڏيو',wait:'{n} ڏينهن انتظار ڪريو — مينهن جي اميد آهي',none:'پاڻي نه ڏيو — زمين ۾ نمي ڪافي آهي',today:'اڄ',tmrw:'سڀاڻي',inN:'{n} ڏينهن پوءِ',dry:'زمين فصل جي دٻاءَ جي حد ويجهو سڪي وئي آهي.',calm:'هوا ۽ گرمي گهٽ آهن، تنهنڪري پاڻي گهٽ ڀاپ ٿيندو.',norain:'ايندڙ 72 ڪلاڪن ۾ مينهن جي اميد ناهي.',rainsoon:'جلد مينهن جي اميد آهي جيڪو زمين کي نم ڪندو.',enough:'زمين جي نمي اڃا دٻاءَ جي حد کان مٿي آهي.'}}
const fill=(s,o)=>s.replace(/\{(\w+)\}/g,(_,k)=>o[k])
const H=h=>`${h%12||12}:00 ${h<12?'AM':'PM'}`
const iso=o=>new Date(Date.now()+o*864e5).toISOString().slice(0,10)
const fmt=n=>Math.round(n).toLocaleString()
function msg(L,r){const t=T[L],dn=k=>k==0?t.today:k==1?t.tmrw:fill(t.inN,{n:k})
 return r.type=='now'?t.now:r.type=='at'?fill(t.at,{d:dn(r.k),a:H(r.win.a),b:H(r.win.b)}):r.type=='wait'?fill(t.wait,{n:r.k}):t.none}

function useReveal(){useEffect(()=>{const o=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('in')),{threshold:.1});document.querySelectorAll('.rv:not(.in)').forEach(el=>o.observe(el));return()=>o.disconnect()})}
function Num({v,d=0}){const[n,s]=useState(0);useEffect(()=>{let f,t0;const run=t=>{t0??=t;const p=Math.min(1,(t-t0)/900);s(v*(1-Math.pow(1-p,3)));if(p<1)f=requestAnimationFrame(run)};f=requestAnimationFrame(run);return()=>cancelAnimationFrame(f)},[v]);return n.toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d})}
const Mini=({k,v})=><div className="mini"><small>{k}</small><b>{v}</b></div>

function Weather({w,loc}){
 if(!w)return null
 const c=w.current,d=w.daily,t0=d.time.indexOf(c.time.slice(0,10)),hr=+c.time.slice(11,13)
 const[ic,lb]=wmo(c.weather_code,c.wind_speed_10m),pr=w.hourly.precipitation_probability[t0*24+hr]||0
 return <div className="wx rv"><div className="card"><div className="row" style={{justifyContent:'space-between',gap:20}}>
  <div><small style={{color:'var(--mut)'}}>📍 Current weather</small><h2 style={{margin:0}}>{loc.name}</h2><div className="row"><span className="ico">{ic}</span><span className="big">{Math.round(c.temperature_2m)}°C</span><span style={{color:'var(--mut)'}}>{lb}</span></div></div>
  <div className="grid g4" style={{flex:1,minWidth:280}}><Mini k="Feels like" v={Math.round(c.apparent_temperature)+'°C'}/><Mini k="Humidity" v={c.relative_humidity_2m+'%'}/><Mini k="Wind" v={`${Math.round(c.wind_speed_10m)} km/h ${compass(c.wind_direction_10m)}`}/><Mini k="Rain chance" v={pr+'%'}/><Mini k="Sunrise" v={d.sunrise[t0].slice(11)}/><Mini k="Sunset" v={d.sunset[t0].slice(11)}/></div></div></div></div>
}

function Smart({w,f,setF,p,lang,setLang,search,gps,err}){
 const[q,setQ]=useState(''),set=(k,v)=>setF({...f,[k]:v}),t=T[lang],rtl=lang!='en'?'rtl':''
 return <section id="smart"><h2 className="rv">AquaLeaf Smart Window</h2><p className="sub rv">Best time and amount of water for the next 7 days — a transparent rule-based model (ETc = ET₀ × Kc, minus rain and soil moisture).</p>
 <div className="grid g2"><div className="card rv">
  <label>Address, village or city</label><div className="row"><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key=='Enter'&&search(q)} placeholder="e.g. Multan, Punjab"/><button className="btn s" onClick={()=>search(q)}>Search</button><button className="btn s" onClick={gps}>📍 GPS</button></div>
  {err&&<p className="note" style={{color:'#dc2626'}}>{err}</p>}
  <div className="grid" style={{gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
   <div><label>Crop</label><select value={f.crop} onChange={e=>set('crop',e.target.value)}>{Object.entries(CROPS).map(([k,v])=><option key={k} value={k}>{v.n}</option>)}</select></div>
   <div><label>Growth stage</label><select value={f.stage} onChange={e=>set('stage',+e.target.value)}>{STAGES.map((s,i)=><option key={s} value={i}>{s}</option>)}</select></div>
   <div><label>Soil type</label><select value={f.soil} onChange={e=>set('soil',e.target.value)}>{Object.entries(SOILS).map(([k,v])=><option key={k} value={k}>{v.n}</option>)}</select></div>
   <div><label>Field size (acres)</label><input type="number" min=".1" step=".5" value={f.acres} onChange={e=>set('acres',Math.max(.1,+e.target.value))}/></div></div>
  <label>Last irrigation date</label><input type="date" max={iso(0)} value={f.last} onChange={e=>set('last',e.target.value)}/></div>
 {!p?<div className="card rv"><p className="sub">Loading forecast…</p></div>:<div key={JSON.stringify(f)+w.current.time}>
  <div className="rec"><div className="tabs">{[['en','English'],['ur','اردو'],['sn','سنڌي']].map(([k,n])=><button key={k} className={lang==k?'on':''} onClick={()=>setLang(k)}>{n}</button>)}</div>
   <h3 className={rtl}>{msg(lang,p.rec)}</h3><p className={rtl}>{p.why.map(k=>t[k]).join(' ')}</p></div>
  <div className="grid g4" style={{marginTop:14}}>
   <Mini k="Water needed (mm)" v={<Num v={p.mm||p.total} d={1}/>}/><Mini k="Liters / acre" v={<Num v={(p.mm||p.total)*ACRE}/>}/>
   <Mini k="Total for field (L)" v={<Num v={(p.mm||p.total)*ACRE*f.acres}/>}/><Mini k="Saved vs fixed schedule" v={<><Num v={p.saved*ACRE*f.acres}/> L</>}/></div></div>}</div>
 {p&&<div className="card rv" style={{marginTop:18}}><b>7-day irrigation calendar</b><div className="cal">{p.days.map((x,i)=><div key={x.date} className={'day '+x.s} style={{animationDelay:i*90+'ms'}}>
   {new Date(x.date).toLocaleDateString('en',{weekday:'short'})}<b>{x.s=='irrigate'?'💧 '+x.mm.toFixed(0)+'mm':x.s=='rain'?'🌧️ '+x.rain.toFixed(0)+'mm':x.s=='light'?'Light':'OK'}</b>Score {x.score}</div>)}</div>
  <div className="lg"><span><i style={{background:'#bbf7d0'}}/>No irrigation needed</span><span><i style={{background:'#fef08a'}}/>Optional / light</span><span><i style={{background:'#fecaca'}}/>Irrigate</span><span><i style={{background:'#bfdbfe'}}/>Rain expected</span></div>
  <p className="note">Fixed-schedule baseline: 60 mm/week (2 × 30 mm). AquaLeaf plan: {p.total.toFixed(0)} mm. Score = hourly suitability (temperature, wind, rain, time of day) of the best 2-hour window.</p></div>}</section>
}

function Leaf(){
 const[r,setR]=useState(null),[img,setImg]=useState(''),[bad,setBad]=useState(false),ref=useRef()
 const go=file=>{if(!file)return;const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{const a=leaf(im);setBad(!a);setR(a);setImg(u)};im.src=u}
 return <section id="leaf"><h2 className="rv">LeafHydra</h2><p className="sub rv">Upload or capture a close-up leaf photo. Analysis runs in your browser — nothing is uploaded.</p>
 <div className="grid g2"><div className="card rv"><div className="drop-z" onClick={()=>ref.current.click()}>{img?<img src={img} alt="leaf" style={{maxWidth:'100%',maxHeight:240,borderRadius:12}}/>:<><div style={{fontSize:'2.6rem'}}>🍃📷</div><p>Tap to upload or take a leaf photo</p></>}</div>
  <input ref={ref} type="file" accept="image/*" capture="environment" hidden onChange={e=>go(e.target.files[0])}/>
  <p className="note">Tip: single leaf, daylight, plain background.</p></div>
 <div className="card rv">{bad?<p>No clear leaf detected. Try a closer, well-lit photo.</p>:!r?<p className="sub">Results will appear here.</p>:<div key={img} style={{animation:'pop .6s both'}}>
  <small style={{color:'var(--mut)'}}>Leaf Hydration Status</small><h3 className={r.band[1]} style={{fontSize:'1.6rem'}}>{r.band[0]}</h3>
  <div className="row" style={{justifyContent:'space-between'}}><span>Hydration Index: <b><Num v={r.idx}/> / 100</b></span><span>Confidence: <b>{r.conf}%</b></span></div>
  <div className="gauge"><i style={{width:r.idx+'%'}}/></div><p><b>Visual signs detected:</b></p>{r.signs.map(s=><span className="chip" key={s}>{s}</span>)}
  <p className="note">80–100 Well hydrated · 60–79 Mild stress · 40–59 Moderate stress · 0–39 Severe stress.<br/>Note: This is a visual estimate, not a direct measurement of leaf water content.</p></div>}</div></div></section>
}

function Wallet({f,p}){
 const[s,setS]=useState(()=>{try{const v=JSON.parse(localStorage.getItem('aqs-wallet'));if(v)return v}catch{}return{source:'Tube well',method:'Flood',start:iso(-60),rate:.2,logs:[]}})
 const[ld,setLd]=useState(iso(0)),[ll,setLl]=useState('')
 useEffect(()=>{try{localStorage.setItem('aqs-wallet',JSON.stringify(s))}catch{}},[s])
 const set=(k,v)=>setS({...s,[k]:v}),c=CROPS[f.crop],now=Date.now()
 const sum=days=>s.logs.filter(l=>now-new Date(l.d)<days*864e5).reduce((a,l)=>a+l.l,0)
 const used=s.logs.filter(l=>l.d>=s.start).reduce((a,l)=>a+l.l,0)
 const el=Math.max(0,(now-new Date(s.start))/864e5),req=c.sea*Math.min(1,el/c.d)*ACRE*f.acres,save=Math.max(0,used-req)
 const add=()=>{if(+ll>0){setS({...s,logs:[{d:ld,l:+ll},...s.logs]});setLl('')}}
 return <section id="wallet"><h2 className="rv">WaterWallet</h2><p className="sub rv">Track every irrigation, compare with crop need, and see savings in PKR.</p>
 <div className="grid g2"><div className="card rv"><div className="grid" style={{gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
  <div><label>Water source</label><select value={s.source} onChange={e=>set('source',e.target.value)}>{['Tube well','Canal','River','Rain-fed','Tanker'].map(x=><option key={x}>{x}</option>)}</select></div>
  <div><label>Irrigation method</label><select value={s.method} onChange={e=>set('method',e.target.value)}>{['Flood','Furrow','Sprinkler','Drip'].map(x=><option key={x}>{x}</option>)}</select></div>
  <div><label>Season start</label><input type="date" value={s.start} onChange={e=>set('start',e.target.value)}/></div>
  <div><label>Water cost (PKR / liter)</label><input type="number" step=".05" value={s.rate} onChange={e=>set('rate',+e.target.value)}/></div></div>
  <p className="note">Field: {f.acres} acres of {c.n} (set in AquaLeaf).</p><label>Log irrigation</label>
  <div className="row"><input type="date" value={ld} onChange={e=>setLd(e.target.value)} style={{maxWidth:150}}/><input type="number" placeholder="Liters used" value={ll} onChange={e=>setLl(e.target.value)}/><button className="btn s" onClick={add}>Add</button></div>
  {p&&p.mm>0&&<button className="btn s" style={{marginTop:8}} onClick={()=>setLl(Math.round(p.mm*ACRE*f.acres))}>Use AquaLeaf amount ({fmt(p.mm*ACRE*f.acres)} L)</button>}
  <table><tbody>{s.logs.slice(0,5).map((l,i)=><tr key={i}><td>{l.d}</td><td>{fmt(l.l)} L</td><td><a href="#wallet" style={{color:'#dc2626'}} onClick={e=>{e.preventDefault();setS({...s,logs:s.logs.filter((_,j)=>j!=i)})}}>remove</a></td></tr>)}</tbody></table></div>
 <div className="card wal rv"><b>WaterWallet</b><div className="grid g4" style={{margin:'12px 0'}}><Mini k="This week" v={fmt(sum(7))+' L'}/><Mini k="This month" v={fmt(sum(30))+' L'}/><Mini k="This season" v={<><Num v={used}/> L</>}/></div>
  <div className="grid" style={{gap:8}}><Mini k="Estimated requirement (to date)" v={<><Num v={req}/> liters</>}/><Mini k="Potential saving" v={<><Num v={save}/> liters</>}/><Mini k="Estimated cost saved" v={<>PKR <Num v={save*s.rate}/></>}/></div>
  <div className="gauge"><i style={{width:Math.min(100,req?used/req*100:0)+'%'}}/></div><p className="note" style={{color:'#cdeedb'}}>Requirement = typical net seasonal need of {c.n} ({c.sea} mm) prorated by season progress.</p></div></div></section>
}

export default function App(){
 useReveal()
 const[loc,setLoc]=useState({name:'Lahore, Pakistan',lat:31.52,lon:74.36}),[w,setW]=useState(null),[err,setErr]=useState(''),[lang,setLang]=useState('en')
 const[f,setF]=useState({crop:'wheat',stage:1,soil:'loam',acres:5,last:iso(-3)})
 useEffect(()=>{setW(null);setErr('')
  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code&hourly=temperature_2m,wind_speed_10m,precipitation,precipitation_probability&daily=weather_code,temperature_2m_max,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration,sunrise,sunset&past_days=7&forecast_days=7&timezone=auto`)
  .then(r=>r.json()).then(j=>{if(!j.daily)throw 0;setW(j)}).catch(()=>setErr('Could not load weather. Check your internet connection.'))},[loc])
 const p=useMemo(()=>w&&plan(w,f),[w,f])
 const search=async q=>{if(!q.trim())return;try{const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1`).then(r=>r.json()),x=r.results?.[0]
  if(!x)return setErr('Address not found. Try a nearby city or village name.');setLoc({name:[x.name,x.admin1,x.country].filter(Boolean).join(', '),lat:x.latitude,lon:x.longitude})}catch{setErr('Search failed. Check your connection.')}}
 const gps=()=>navigator.geolocation?.getCurrentPosition(async({coords:{latitude:a,longitude:o}})=>{let n='Your GPS location'
  try{const r=await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${a}&longitude=${o}`).then(r=>r.json());n=[r.city||r.locality,r.principalSubdivision].filter(Boolean).join(', ')||n}catch{}
  setLoc({name:n,lat:a,lon:o})},()=>setErr('GPS permission denied.'))
 return <>
 <nav><span className="logo">💧 Aqua Sense</span><div className="nl"><a href="#smart">Smart Window</a><a href="#leaf">LeafHydra</a><a href="#wallet">WaterWallet</a></div></nav>
 <header className="hero">{[...Array(9)].map((_,i)=><span key={i} className="drop" style={{'--x':(i*11+4)+'%','--d':i*.8+'s'}}/>)}<div className="leafd">🌿</div>
  <h1>Water smarter.<br/>Grow stronger.</h1><p>Aqua Sense helps farmers decide when and how much to irrigate using weather forecasts, crop needs and soil conditions — saving water and money.</p>
  <a href="#smart"><button className="btn w">Start AquaLeaf →</button></a>
  <div className="stats"><div><b><Num v={7}/> days</b><span>irrigation planning</span></div><div><b>3</b><span>languages</span></div><div><b>PKR</b><span>savings tracking</span></div></div></header>
 <Weather w={w} loc={loc}/>
 <Smart {...{w,f,setF,p,lang,setLang,search,gps,err}}/><Leaf/><Wallet f={f} p={p}/>
 <footer>Aqua Sense · Weather data by Open-Meteo · Recommendations are estimates to support, not replace, farmer judgment.</footer></>
}

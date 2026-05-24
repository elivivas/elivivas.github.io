import os
D=os.path.dirname(os.path.abspath(__file__)); SRC=os.path.dirname(D)
payload=open(os.path.join(D,'map_payload.json'),encoding='utf-8').read()
MAP_OUT=os.path.join(SRC,'mapa_pisos_turisticos_catalunya.html')
TOP=r'''<!DOCTYPE html><html lang="ca"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<title>Mapa dels pisos turístics de Catalunya</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<style>
 :root{--blue:#2b6cb0;--red:#d1495b;--purple:#7d3c98}
 html,body{margin:0;height:100%;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1c1c}
 #map{position:absolute;inset:0}
 .card{position:absolute;z-index:1000;background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.16)}
 #panel{top:12px;left:12px;width:280px;border-radius:12px;padding:13px 15px;max-height:calc(100% - 120px);overflow:auto}
 #foot{bottom:12px;left:12px;width:280px;border-radius:12px;padding:11px 14px;font-size:10.5px;color:#8a8a8a;line-height:1.5}
 #foot a{color:#1a73e8;text-decoration:none}
 .htitle{display:flex;align-items:center;gap:8px}
 #panel h1{font-size:15px;margin:0;font-weight:700;flex:1}
 #toggle{display:none;border:1px solid #ddd;background:#fafafa;border-radius:7px;font-size:12px;padding:3px 9px;cursor:pointer}
 .sub{color:#777;margin:2px 0 11px;font-size:11px;line-height:1.35}
 .fld{display:block;font-size:11px;color:#555;font-weight:600;margin:9px 0 3px}
 .clr{font-size:11px;color:#1a73e8;cursor:pointer;float:right;font-weight:400}
 input[type=text]{width:100%;box-sizing:border-box;padding:8px 9px;border:1px solid #d0d0d0;border-radius:8px;font-size:13px}
 .row{display:flex;align-items:center;gap:8px;margin:6px 0;cursor:pointer;font-size:12.5px}
 .row input[type=checkbox]{margin:0 2px 0 0}
 .sw{width:13px;height:13px;border-radius:50%;flex:0 0 auto}
 .hr{border:none;border-top:1px solid #eee;margin:11px 0}
 .small{font-size:11px;color:#888}
 .statbox{background:#f6f7f9;border-radius:9px;padding:9px 11px;margin-top:11px}
 .statbox .big{font-weight:700;font-size:18px;line-height:1.1}
 .statbox .ctx{font-size:11.5px;color:#555;margin-bottom:5px}
 .statbox .brk{font-size:12px;margin-top:3px}
 .leg{margin-top:10px;font-size:11px;color:#555}
 .leg .lr{display:flex;align-items:center;gap:6px;margin:3px 0}
 .leg .bx{width:12px;height:12px;border-radius:3px;flex:0 0 auto}
 .leaflet-popup-content{font-size:12.5px;line-height:1.5;margin:11px 13px;max-height:300px;overflow:auto}
 .leaflet-popup-content b{font-size:13px}
 .pl{color:#666}
 .badge{display:inline-block;padding:1px 7px;border-radius:10px;font-size:10.5px;font-weight:600;color:#fff}
 .chip{display:inline-block;padding:1px 7px;border-radius:10px;font-size:10.5px;font-weight:600;background:#eee;color:#444;margin:2px 4px 0 0}
 .chip.t{background:#f4a259;color:#fff}
 ul.own{margin:7px 0 0;padding-left:4px;list-style:none}
 ul.own li{margin:7px 0;padding-left:14px;text-indent:-14px}
 .pli{font-size:11.5px;margin:2px 0 2px 14px;text-indent:0;color:#444}
 a.gm{color:#1a73e8;text-decoration:none;font-size:11px;white-space:nowrap}
 .muniline{margin-top:6px;font-size:11.5px;color:#444;border-top:1px dashed #e2e2e2;padding-top:6px}
 .leaflet-control-layers{font-size:12px;border-radius:9px!important;box-shadow:0 2px 10px rgba(0,0,0,.16)!important;padding:4px 4px}
 .leaflet-control-layers label{margin:2px 4px;font-weight:600;color:#444}
 @media (max-width:680px){
   .leaflet-top.leaflet-right{margin-top:52px}
   #panel{top:0;left:0;right:0;width:auto;border-radius:0 0 12px 12px;max-height:82vh;padding:10px 14px}
   #toggle{display:inline-block}
   body.collapsed #pbody{display:none}
   #foot{left:0;right:0;bottom:0;width:auto;border-radius:12px 12px 0 0;max-height:42vh;overflow:auto}
   body:not(.collapsed) #foot{display:none}
   input[type=text]{font-size:16px}
 }
</style></head><body>
<div id="map"></div>
<div id="panel" class="card">
 <div class="htitle"><h1>Pisos turístics de Catalunya</h1><button id="toggle">Amaga els filtres ▴</button></div>
 <div id="pbody">
  <p class="sub">Habitatges d'ús turístic (HUT) del Registre de Turisme de Catalunya.</p>
  <label class="fld">Cerca per adreça o carrer</label>
  <input id="qa" type="text" placeholder="Ex.: Carrer Marina 245…" autocomplete="off"/>
  <label class="fld">Municipi <span class="clr" id="clrM">esborra</span></label>
  <input id="qm" type="text" list="munis" placeholder="Tria un municipi (centra el mapa)…" autocomplete="off"/>
  <datalist id="munis"></datalist>
  <label class="fld">Empresa titular</label>
  <input id="qe" type="text" placeholder="Nom d'empresa…" autocomplete="off"/>
  <div class="statbox">
    <div class="ctx" id="ctx">Tot Catalunya</div>
    <div class="big" id="big"></div>
    <div class="brk"><span style="color:var(--red)">●</span> <span id="bE"></span> empresa &nbsp; <span style="color:var(--blue)">●</span> <span id="bP"></span> particular</div>
  </div>
  <div class="row" style="margin-top:11px"><span class="sw" style="background:var(--blue)"></span><label style="flex:1;cursor:pointer"><input type="checkbox" id="cP" checked> Particular</label></div>
  <div class="row"><span class="sw" style="background:var(--red)"></span><label style="flex:1;cursor:pointer"><input type="checkbox" id="cE" checked> Empresa</label></div>
  <div class="row"><span class="sw" style="background:var(--purple)"></span><span class="small">Finca mixta (empresa + particular)</span></div>
  <div class="row"><label style="flex:1;cursor:pointer"><input type="checkbox" id="cExact"> Només amb coordenada exacta</label></div>
  <div class="leg">
    <div style="font-weight:600;margin-bottom:3px">% pisos turístics sobre el total d'habitatge (secció censal, INE)</div>
    <div class="lr"><span class="bx" style="background:#2e7d32"></span> per sota la mitjana</div>
    <div class="lr"><span class="bx" style="background:#ef8e3b"></span> per sobre la mitjana</div>
    <div class="lr"><span class="bx" style="background:#c0392b"></span> molt per sobre (&gt;2×)</div>
   </div>
   <div class="leg" style="margin-top:14px;padding-top:12px;border-top:1px solid #eee">
    <div class="lr"><span class="chip t" style="margin:0">zona tensionada</span> <span class="pl">mercat de lloguer tensat</span></div>
  </div>
 </div>
</div>
<div id="foot" class="card"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script id="data" type="application/json">'''
BOT=r'''</script>
<script>
const P=JSON.parse(document.getElementById('data').textContent);
const LOCS=P.locs, PROVS=P.provs, HASTENS=P.hasTens;
// 0 lat,1 lon,2 n,3 col,4 ne,5 npar,6 places,7 prec,8 prov,9 muni,10 adreca,11 members[[e,t,pl,pp,lic,ad]],12 tens,13 ine,14 ine_lvl
const COL={0:'#2b6cb0',1:'#d1495b',2:'#7d3c98'};
const map=L.map('map',{preferCanvas:true,zoomControl:true}).setView([41.75,1.78],8);
const HOME={c:[41.75,1.78],z:8};
const baseClar=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
 {maxZoom:19,subdomains:'abcd',attribution:'&copy; OpenStreetMap, &copy; CARTO'}).addTo(map);
const baseSat=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
 {maxZoom:19,attribution:'Imatges &copy; Esri, Maxar, Earthstar Geographics'});
L.control.layers({'Mapa clar':baseClar,'Satèl·lit':baseSat},null,{position:'topright',collapsed:false}).addTo(map);
map.on('baselayerchange',e=>{satMode=(e.name==='Satèl·lit');draw(false);});
const canvas=L.canvas({padding:.5});
let layer=L.layerGroup().addTo(map);
const esc=s=>(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const norm=s=>(s||'').normalize('NFKD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
const dec=v=>(''+v).replace('.',',');
let satMode=false;
let addrQ='', addrToks=[], muniF='', empQ='', showP=true, showE=true, onlyExact=false;
// mitjana del % INE per al codi de color
const ineVals=LOCS.map(L=>L[13]).filter(v=>v!=='' && v!==null && v!==undefined);
const ineMean=ineVals.reduce((a,b)=>a+b,0)/(ineVals.length||1);
function ineColor(v){ if(v==='' || v===null || v===undefined) return null;
  if(v<ineMean) return '#2e7d32'; if(v<ineMean*2) return '#ef8e3b'; return '#c0392b'; }
const gmap=a=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(a);
const gmlink=a=>a?'<a href="'+gmap(a)+'" target="_blank" rel="noopener" class="gm">📍 Google Maps</a>':'';

function visible(L){
 if(onlyExact && L[7]!==0) return false;
 const hasP=L[5]>0, hasE=L[4]>0;
 if(!((hasP&&showP)||(hasE&&showE))) return false;
 if(muniF && norm(L[9])!==muniF) return false;
 if(addrToks.length){ const a=norm(L[10]+' '+L[9]); if(!addrToks.every(t=>a.includes(t))) return false; }
 if(empQ){ const names=L[11].filter(m=>m[0]===1).map(m=>m[1]).join(' ').toLowerCase();
   if(!names.includes(empQ)) return false; }
 return true;
}
function zf(){const z=map.getZoom();
 if(z<=7)return .16; if(z<=8)return .24; if(z<=9)return .38; if(z<=10)return .58;
 if(z<=11)return .85; if(z<=12)return 1.15; if(z<=13)return 1.5; if(z<=14)return 1.9; return 2.3;}
function radius(n){const k=zf(); if(n<=1)return Math.max(.6,2.4*k); return Math.min(2.4*k+Math.sqrt(n)*1.5*k,24);}
function fillOp(){const z=map.getZoom(); return z<=8?.5:z<=10?.65:.8;}

function ownerGroups(mem){
 const comp=new Map(); const parts=[];
 for(const m of mem){ const pis={pp:m[3],lic:m[4],pl:m[2],ad:m[5]};
   if(m[0]===1){ const k=m[1]; if(!comp.has(k))comp.set(k,{t:m[1],e:1,pisos:[],pl:0,n:0});
     const o=comp.get(k); o.pisos.push(pis); o.pl+=m[2]; o.n++; }
   else parts.push({t:'Particular',e:0,pisos:[pis],pl:m[2],n:1}); }
 return {comps:[...comp.values()].sort((a,b)=>b.n-a.n), parts};
}
function pisLine(p,showLink,locAddr){
 const ad=p.ad||locAddr; let s=(p.lic?'<b>'+esc(p.lic)+'</b>':'');
 if(showLink && ad) s+=' · '+esc(ad);
 if(p.pp) s+=' · pis '+esc(p.pp);
 if(p.pl) s+=' <span class="pl">('+p.pl+' pl)</span>';
 if(showLink) s+=' '+gmlink(ad);
 return s;
}
function muniLine(L){
 let parts=[];
 if(L[13]!=='' && L[13]!==null && L[13]!==undefined){
   const lvl=(L[14]==='s')?'secció censal':'mitjana del municipi';
   const c=ineColor(L[13]);
   parts.push('<span class="chip" style="background:'+c+';color:#fff;margin:0">'+dec(L[13])+'% pisos turístics</span> <span class="pl">('+lvl+', INE)</span>');
 }
 if(HASTENS && L[12]) parts.push('<span class="chip t" style="margin:0">zona tensionada</span>');
 return parts.length?'<div class="muniline">'+parts.join('<br>')+'</div>':'';
}
function popup(L){
 const muni=esc(L[9]), adr=esc(L[10]), prov=PROVS[L[8]];
 if(L[2]===1){const m=L[11][0]; const a1=m[5]||L[10];
   return '<b>'+esc(m[1])+'</b><br><span class="badge" style="background:'+COL[m[0]?1:0]+'">'+(m[0]?'Empresa':'Particular')+'</span>'+
     (m[2]?' &middot; '+m[2]+' places':'')+'<br>'+(m[4]?'Llicència <b>'+esc(m[4])+'</b>':'')+(m[3]?' &middot; pis '+esc(m[3]):'')+
     '<br>'+esc(a1)+'<br><span class="pl">'+muni+' &middot; '+prov+'</span><br>'+gmlink(a1)+muniLine(L);}
 const {comps,parts}=ownerGroups(L[11]);
 const nComp=comps.length, nEmpF=L[4], nParF=L[5];
 const exact=L[7]===0; let head;
 if(exact){
   let resum;
   if(nParF===0 && nComp===1) resum=L[2]+' pisos turístics de la mateixa empresa';
   else if(nParF===0) resum=L[2]+' pisos turístics &middot; '+nComp+' empreses';
   else resum=L[2]+' pisos turístics';
   head='<b>Finca: '+resum+'</b>'+(L[6]?' &middot; '+L[6]+' places':'')+'<br><span class="pl">'+adr+'<br>'+muni+' &middot; '+prov+'</span><br>'+gmlink(L[10]);
 } else {
   head='<b>'+L[2]+' HUT a '+muni+'</b> <span class="pl">'+prov+'</span>'+
     '<div class="muniline" style="border:0;padding-top:4px"><span class="pl">ⓘ No disposem de les coordenades, i la mostrem al <b>centre del municipi</b>, però l\'adreça de cada pis és correcta i la pots obrir a Google Maps.</span></div>';
 }
 let h=head;
 h+='<div style="margin-top:6px">'+
   (nEmpF?'<span class="badge" style="background:#d1495b">'+nEmpF+' '+(nEmpF===1?'pis empresa':'pisos empresa')+'</span> ':'')+
   (nParF?'<span class="badge" style="background:#2b6cb0">'+nParF+' '+(nParF===1?'pis particular':'pisos particular')+'</span>':'')+'</div>';
 h+='<ul class="own">';
 for(const o of comps.slice(0,18)){
   const ps=o.pisos.slice(0,12).map(p=>'<div class="pli">'+pisLine(p,!exact,L[10])+'</div>').join('')+
            (o.pisos.length>12?'<div class="pl">… i '+(o.pisos.length-12)+' pisos més</div>':'');
   h+='<li><span style="color:#d1495b">●</span> <b>'+esc(o.t)+'</b> <span class="pl">(empresa)</span> — '+o.n+' pis'+(o.n>1?'os':'')+
     (o.pl?' <span class="pl">('+o.pl+' places)</span>':'')+ps+'</li>';
 }
 if(nParF){
   const pls=parts.slice(0,12);
   h+='<li><span style="color:#2b6cb0">●</span> <b>Particular</b> <span class="pl">(titulars no identificats individualment)</span>'+
      pls.map(o=>'<div class="pli">'+pisLine(o.pisos[0],!exact,L[10])+'</div>').join('')+
      (parts.length>12?'<div class="pl">… i '+(parts.length-12)+' pisos particulars més</div>':'')+'</li>';
 }
 h+='</ul>';
 return h+muniLine(L);
}
function mkCircle(Lc){
 const c=Lc[2]>1?Lc[3]:(Lc[11][0][0]?1:0);
 const filled=!Lc[7];
 const cm=L.circleMarker([Lc[0],Lc[1]],{renderer:canvas,radius:radius(Lc[2]),
   color: filled?(satMode?'rgba(15,15,15,.6)':COL[c]):COL[c],
   weight: filled?(satMode?0.7:0.6):(satMode?1.4:1), fill:filled, fillColor:COL[c],
   fillOpacity:filled?(satMode?0.95:fillOp()):0, opacity:filled?(satMode?.95:.85):(satMode?1:.9)});
 cm.bindPopup(()=>popup(Lc),{maxWidth:320});
 const tip=Lc[2]>1?(Lc[7]===1?(Lc[2]+' HUT a '+esc(Lc[9])+' (al centre del municipi)'):('Finca: '+Lc[2]+' HUT'+(Lc[6]?' · '+Lc[6]+' places':''))):esc(Lc[11][0][1]);
 cm.bindTooltip(tip,{direction:'top'});
 return cm;
}
function draw(fit){
 const buf=[]; let huts=0,emp=0,par=0,shown=0; const pts=[];
 for(const L of LOCS){ if(!visible(L))continue;
   shown++; huts+=L[2]; emp+=L[4]; par+=L[5]; buf.push(mkCircle(L)); if(fit)pts.push([L[0],L[1]]); }
 map.removeLayer(layer); layer=L.layerGroup(buf).addTo(map);
 document.getElementById('big').textContent=huts.toLocaleString('ca')+' HUT';
 document.getElementById('bE').textContent=emp.toLocaleString('ca');
 document.getElementById('bP').textContent=par.toLocaleString('ca');
 const lbl = muniF? ((LOCS.find(L=>norm(L[9])===muniF)||[])[9]||'') : (addrQ?('Adreça: "'+addrQ+'"'):(empQ?('Empresa: "'+empQ+'"'):'Tot Catalunya'));
 document.getElementById('ctx').textContent=lbl+' · '+shown.toLocaleString('ca')+' ubicacions';
 if(fit && pts.length){ map.fitBounds(pts,{padding:[40,40],maxZoom:16}); }
}
let cP=0,cE=0; for(const L of LOCS){cP+=L[5];cE+=L[4];}
const munis=[...new Set(LOCS.map(L=>L[9]))].sort((a,b)=>a.localeCompare(b,'ca'));
document.getElementById('munis').innerHTML=munis.map(m=>'<option value="'+m.replace(/"/g,'&quot;')+'">').join('');
const LOGO='<img src="data:image/png;base64,__LOGO_DATA__" alt="Storydata" style="height:30px;display:block"/>';
document.getElementById('foot').innerHTML=
 'Cercle gran = finca amb diversos HUT · cercle buit = sense coordenada exacta (situat al centre del municipi; l\'adreça sí que la tenim).<br>'+
 '<b>Font:</b> <a href="https://analisi.transparenciacatalunya.cat/Turisme/Establiments-d-allotjament-tur-stic-inscrits-al-Re/t2h3-cgys/about_data" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">Registre de Turisme de Catalunya</a> (Dept. Empresa i Treball, Generalitat), 5 maig 2026 · Geolocalització Barcelona: <a href="https://opendata-ajuntament.barcelona.cat/data/es/dataset/habitatges-us-turistic" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">Open Data BCN</a> (1T 2026) · Geocodificació: <a href="https://www.icgc.cat/es" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">ICGC</a> · % pisos turístics: <a href="https://ine.es/experimental/viv_turistica/experimental_viv_turistica.htm" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">INE</a> (nov. 2025) · Zones tensionades: <a href="https://habitatge.gencat.cat/ca/ambits/preus-ingressos-i-zones/limit-preu-lloguer/llistat-municipis-zmrt/" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">Resolució TER/800/2024</a>.<br>'+
 '<b>Avís:</b> pot contenir errors. Reporta\'ls a <a href="mailto:team@storydata.cat?subject=Error%20mapa%20pisos%20turistics">team@storydata.cat</a>.'+
 '<div style="display:flex;align-items:center;gap:10px;margin-top:11px;padding-top:10px;border-top:1px solid #eee">'+
   '<a href="http://www.storydata.es" target="_blank" rel="noopener" style="line-height:0">'+LOGO+'</a>'+
   '<a href="http://www.storydata.es" target="_blank" rel="noopener" style="color:#1a73e8;font-weight:600">www.storydata.es</a>'+
 '</div>';
const munisNorm=new Set(munis.map(norm));
let ta=null,tm=null,te=null;
document.getElementById('qa').oninput=e=>{clearTimeout(ta);ta=setTimeout(()=>{addrQ=e.target.value.trim();addrToks=norm(e.target.value).replace(/[^a-z0-9 ]+/g,' ').split(/\s+/).filter(Boolean);draw(addrToks.length>0);},280);};
document.getElementById('qm').oninput=e=>{clearTimeout(tm);tm=setTimeout(()=>{const v=norm(e.target.value);
  if(v===''){muniF='';draw();map.setView(HOME.c,HOME.z);} else if(munisNorm.has(v)){muniF=v;draw(true);}},280);};
document.getElementById('qe').oninput=e=>{clearTimeout(te);te=setTimeout(()=>{empQ=e.target.value.trim().toLowerCase();draw(!!empQ);},280);};
document.getElementById('clrM').onclick=()=>{document.getElementById('qm').value='';muniF='';draw();map.setView(HOME.c,HOME.z);};
document.getElementById('cP').onchange=e=>{showP=e.target.checked;draw();};
document.getElementById('cE').onchange=e=>{showE=e.target.checked;draw();};
document.getElementById('cExact').onchange=e=>{onlyExact=e.target.checked;draw();};
document.getElementById('toggle').onclick=()=>{document.body.classList.toggle('collapsed');
  document.getElementById('toggle').textContent=document.body.classList.contains('collapsed')?'Mostra els filtres ▾':'Amaga els filtres ▴';};
if(window.innerWidth<=680) document.body.classList.add('collapsed'),document.getElementById('toggle').textContent='Mostra els filtres ▾';
function layoutPanel(){
 const foot=document.getElementById('foot'), panel=document.getElementById('panel');
 if(window.innerWidth>680){ const h=window.innerHeight-foot.offsetHeight-36;
   panel.style.maxHeight=Math.max(160,h)+'px'; }
 else panel.style.maxHeight='';
}
window.addEventListener('resize',layoutPanel); layoutPanel();
let rt=null; map.on('zoomend',()=>{clearTimeout(rt);rt=setTimeout(()=>draw(false),60);});
draw();
</script></body></html>'''
_lf=os.path.join(D,'logo_b64.txt')
if os.path.exists(_lf):
    BOT=BOT.replace('__LOGO_DATA__',open(_lf,encoding='utf-8').read().strip())
open(MAP_OUT,'w',encoding='utf-8').write(TOP+payload+BOT)
print('MAP MB:',round(os.path.getsize(MAP_OUT)/1e6,2))

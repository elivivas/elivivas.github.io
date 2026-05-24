const document={getElementById:()=>({textContent:"",onchange:null,oninput:null,addEventListener:()=>{}})};const L={map:()=>({setView:()=>({}),addLayer:()=>{}}),tileLayer:()=>({addTo:()=>{}}),canvas:()=>({}),layerGroup:(a)=>({addTo:()=>({}),clearLayers:()=>{}}),circleMarker:()=>({bindPopup:()=>({bindTooltip:()=>({})})})};
const P={"locs":[],"provs":[]};
const LOCS=P.locs, PROVS=P.provs;
// indices: 0 lat,1 lon,2 n,3 col(0 part,1 emp,2 mix),4 ne,5 npar,6 places,7 prec(0 exacta,1 aprox),8 prov,9 muni,10 adreca,11 members[[e,t,pl,pp]]
const COL={0:'#2b6cb0',1:'#d1495b',2:'#7d3c98'};
const map=L.map('map',{preferCanvas:true}).setView([41.75,1.78],8);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
 {maxZoom:19,subdomains:'abcd',attribution:'&copy; OpenStreetMap, &copy; CARTO'}).addTo(map);
const canvas=L.canvas({padding:.5});
let layer=L.layerGroup().addTo(map);
const esc=s=>(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
let q='', showP=true, showE=true, onlyExact=false;

function visible(L){
 if(onlyExact && L[7]!==0) return false;
 const hasP=L[5]>0, hasE=L[4]>0;
 if(!((hasP&&showP)||(hasE&&showE))) return false;
 if(q){const hay=(L[9]+' '+L[10]+' '+L[11].map(m=>m[1]).join(' ')).toLowerCase();
   if(!hay.includes(q)) return false;}
 return true;
}
function radius(n){return n<=1?4.5:Math.min(4.5+Math.sqrt(n)*2.2,22);}
function popup(L){
 const muni=esc(L[9]), adr=esc(L[10]);
 if(L[2]===1){const m=L[11][0];
   return '<b>'+esc(m[1])+'</b><br><span class="badge" style="background:'+COL[m[0]?1:0]+'">'+(m[0]?'Empresa':'Particular')+'</span>'+
     (m[2]?' &middot; '+m[2]+' places':'')+'<br>'+adr+'<br><span class="pl">'+muni+' &middot; '+PROVS[L[8]]+(L[7]?' &middot; ubicació aproximada':'')+'</span>'+
     (m[3]?'<br><span class="pl">'+esc(m[3])+'</span>':'');}
 // finca
 let h='<b>Finca amb '+L[2]+' pisos turístics</b><br><span class="pl">'+adr+'<br>'+muni+' &middot; '+PROVS[L[8]]+'</span><br>'+
   '<span class="badge" style="background:#d1495b">'+L[4]+' empresa</span> <span class="badge" style="background:#2b6cb0">'+L[5]+' particular</span>'+
   (L[6]?' &middot; '+L[6]+' places':'')+(L[7]?'<br><span class="pl">⚠ ubicació aproximada</span>':'');
 const ms=L[11].slice(0,40);
 h+='<ul class="pis">'+ms.map(m=>'<li><span style="color:'+COL[m[0]?1:0]+'">●</span> '+(m[3]?esc(m[3])+' — ':'')+esc(m[1])+(m[2]?' ('+m[2]+' pl)':'')+'</li>').join('')+'</ul>';
 if(L[11].length>40) h+='<span class="pl">… i '+(L[11].length-40)+' més</span>';
 return h;
}
function draw(){
 layer.clearLayers(); let shown=0, huts=0, approx=0;
 const buf=[];
 for(const L of LOCS){ if(!visible(L)) continue;
   shown++; huts+=L[2]; if(L[7])approx++;
   const c=L[2]>1?L[3]:(L[11][0][0]?1:0);
   const m=L.circleMarker?null:null;
   const cm=L_circle(L,c); buf.push(cm);
 }
 layer=L.layerGroup(buf).addTo(map);
 document.getElementById('total').textContent=huts.toLocaleString('ca')+' HUT visibles';
 document.getElementById('sub2').textContent=shown.toLocaleString('ca')+' ubicacions';
}
function L_circle(Lc,c){
 const cm=L.circleMarker([Lc[0],Lc[1]],{renderer:canvas,radius:radius(Lc[2]),
   color:Lc[7]?COL[c]:COL[c], weight:Lc[7]?1.4:1, fill:!Lc[7], fillColor:COL[c],
   fillOpacity:Lc[7]?0:.78, opacity:Lc[7]?.9:1});
 cm.bindPopup(()=>popup(Lc),{maxWidth:300});
 cm.bindTooltip(Lc[2]>1?('Finca: '+Lc[2]+' HUT'+(Lc[6]?' · '+Lc[6]+' places':'')):esc(Lc[11][0][1]),{direction:'top'});
 return cm;
}
// counts
let cP=0,cE=0;
for(const L of LOCS){cP+=L[5];cE+=L[4];}
document.getElementById('nP').textContent=cP.toLocaleString('ca');
document.getElementById('nE').textContent=cE.toLocaleString('ca');
let approxTot=LOCS.filter(L=>L[7]).length;
document.getElementById('approxnote').textContent=approxTot.toLocaleString('ca')+' ubicacions són aproximades (carrer/municipi).';
document.getElementById('cP').onchange=e=>{showP=e.target.checked;draw();};
document.getElementById('cE').onchange=e=>{showE=e.target.checked;draw();};
document.getElementById('cExact').onchange=e=>{onlyExact=e.target.checked;draw();};
let t=null;
document.getElementById('q').oninput=e=>{clearTimeout(t);t=setTimeout(()=>{q=e.target.value.trim().toLowerCase();draw();},250);};
draw();

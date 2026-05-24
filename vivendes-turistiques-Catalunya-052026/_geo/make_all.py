# Genera CSV final (coords + tipus titular) y el mapa HTML v2 para medio.
# Validacion: distancia al centro del municipio + coincidencia del nombre de calle.
import csv, glob, os, json, math, re, unicodedata, difflib
csv.field_size_limit(10**7)
D=os.path.dirname(os.path.abspath(__file__)); SRC=os.path.dirname(D)
CACHE=os.path.join(D,'cache.tsv'); FB=os.path.join(D,'fallback.tsv'); OD=os.path.join(D,'opendata_bcn.csv')
MUNI=os.path.join(D,'muni_centroids.tsv')
INE=os.path.join(D,'ine_viv_turistica.csv')
TENS=os.path.join(D,'municipis_tensionats.txt')
CSV_OUT=os.path.join(SRC,'pisos_turisticos_catalunya_geocodificado.csv')
MAP_OUT=os.path.join(SRC,'mapa_pisos_turisticos_catalunya.html')
THRESH_KM=15.0; STREET_MIN=0.45

def load_tsv(fn):
    d={}
    if os.path.exists(fn):
        for l in open(fn,encoding='utf-8'):
            p=l.rstrip('\n').split('\t')
            if len(p)>=3 and p[1]:
                d[p[0]]=(p[1],p[2],p[3] if len(p)>3 else '', p[4] if len(p)>4 else '')
    return d
main=load_tsv(CACHE); fb=load_tsv(FB)
regeo=load_tsv(os.path.join(D,'regeo.tsv'))   # CartoCiudad/Nominatim (se omple a la propera sessio)
reg={}
for row in csv.DictReader(open(OD,encoding='utf-8')):
    r=(row.get('NUMERO_REGISTRE_GENERALITAT') or '').strip()
    la=(row.get('LATITUD_Y') or '').strip().replace(',','.'); lo=(row.get('LONGITUD_X') or '').strip().replace(',','.')
    if r and la and lo: reg[r]=(la,lo)
cen={}
for l in open(MUNI,encoding='utf-8'):
    p=l.rstrip('\n').split('\t')
    if len(p)>=3 and p[1]: cen[p[0]]=(float(p[1]),float(p[2]))

def keyn(s):
    s=unicodedata.normalize('NFKD',(s or '').lower()).encode('ascii','ignore').decode().strip()
    for a in ["l'",'el ','la ','els ','les ','es ']:
        if s.startswith(a): s=s[len(a):]
    return s.replace("'",' ').replace('-',' ').strip()
VIA={'carrer','c','avinguda','av','passeig','pg','placa','pl','passatge','ptge','ronda','cami','carretera','ctra','travessera','baixada','rambla','via','riera','torrent','rierada','urbanitzacio','urb','pol','poligon','disseminat','partida','vell','a','de','del','dels','la','les','el','els','l','d','i'}
def clean_street(s):
    s=unicodedata.normalize('NFKD',(s or '').lower()).encode('ascii','ignore').decode()
    s=re.sub(r'[^a-z0-9 ]',' ',s)
    return ' '.join(w for w in s.split() if w not in VIA and not w.isdigit())

# INE: % vivienda turistica por municipio
ine={}
if os.path.exists(INE):
    from collections import defaultdict
    vt=defaultdict(float); tot=defaultdict(float)
    for row in csv.DictReader(open(INE,encoding='utf-8')):
        m=keyn(row.get('MUN_LITERAL'))
        v=float(row.get('vivienda turistica') or 0); pct=float(row.get('Porcentaje vivienda turistica') or 0)
        vt[m]+=v
        if pct>0: tot[m]+=v/(pct/100.0)
    for m in vt:
        if tot[m]>0: ine[m]=round(vt[m]/tot[m]*100,2)
# municipios tensionados (ZMRT)
tens=set()
if os.path.exists(TENS):
    for l in open(TENS,encoding='utf-8'):
        if l.strip(): tens.add(keyn(l))
# seccion censal por coordenada (precalculado en coord_section.tsv: "lat,lon\tCUSEC\tpct")
SECF=os.path.join(D,'coord_section.tsv')
csec={}
if os.path.exists(SECF):
    for l in open(SECF,encoding='utf-8'):
        p=l.rstrip('\n').split('\t')
        if len(p)>=3:
            try:
                la,lo=p[0].split(','); csec[(round(float(la),5),round(float(lo),5))]=(p[1], p[2])
            except: pass

def hav(la1,lo1,la2,lo2):
    P=math.pi/180; x=(la2-la1)*P; y=(lo2-lo1)*P
    h=math.sin(x/2)**2+math.cos(la1*P)*math.cos(la2*P)*math.sin(y/2)**2
    return 2*6371*math.asin(math.sqrt(h))

def resolve(rn,a,muni,via):
    # 1) registre oficial -> exacto
    if rn in reg:
        return (reg[rn][0],reg[rn][1],'registre','exacta')
    c=cen.get(muni)
    def valida(rec,fontname):
        la,lo,ly,etq=rec
        if ly!='address' or c is None: return None
        try:
            near = hav(float(la),float(lo),c[0],c[1])<=THRESH_KM
            vsrc=clean_street(via)
            vget=clean_street(etq.split(',')[0])  # nom del carrer abans de la coma
            okstreet = (not vsrc) or difflib.SequenceMatcher(None,vsrc,vget).ratio()>=STREET_MIN
            if near and okstreet: return (la,lo,fontname,'exacta')
        except: pass
        return None
    # 2) ICGC (geocodificacion principal)
    if main.get(a):
        r=valida(main[a],'icgc_portal')
        if r: return r
    # 2b) regeocodificacion CartoCiudad/Nominatim (regeo.tsv), validada igual
    if regeo.get(a):
        r=valida(regeo[a],'regeo_portal')
        if r: return r
    # 2c) fallback street-level ICGC (raramente address)
    if fb.get(a):
        r=valida(fb[a],'icgc_fb')
        if r: return r
    # 3) centroide del municipio (correctamente ubicado, aproximado)
    if c is not None:
        return (str(c[0]),str(c[1]),'centroide_municipi','aproximada')
    return None

files=[]
for fp in sorted(glob.glob(os.path.join(SRC,'*.csv'))):
    if os.path.abspath(fp)==os.path.abspath(CSV_OUT): continue
    with open(fp,encoding='utf-8',newline='') as fh: hdr=fh.readline()
    if 'Adre' in hdr and 'inscrip' in hdr: files.append(fp)

# union columnas
allcols=[]; seen=set()
data=[]
for fp in files:
    r=csv.DictReader(open(fp,encoding='utf-8'))
    for c in r.fieldnames:
        if c and c.strip() and c not in seen: seen.add(c); allcols.append(c)
    data.append(list(r))

extra=['latitud','longitud','tipus_titular','titular','font_coord','geo_precisio','municipi_tensionat','pct_viv_turistica_municipi_ine','seccio_censal','pct_viv_turistica_seccio_ine']
PROVS=['Barcelona','Girona','Tarragona','Lleida']
locs={}   # (lat,lon)->{members, prec, muni, adreca}
n=0; got=0
with open(CSV_OUT,'w',newline='',encoding='utf-8') as out:
    w=csv.writer(out); w.writerow(allcols+extra)
    for rows in data:
        for row in rows:
            rn=(row.get('Número inscripció') or '').strip()
            a=(row.get('Adreça') or '').strip()
            cif=(row.get('CIF') or '').strip()
            is_emp = bool(cif) and cif.lower()!='no aplica'
            rao=(row.get('Raó Social del titular') or '').strip()
            titular = rao if (is_emp and rao and rao.lower()!='no aplica') else ('Empresa' if is_emp else 'Particular')
            muni=(row.get('Municipi') or '').strip()
            mk=keyn(muni); is_tens = mk in tens; pct_ine = ine.get(mk)
            res=resolve(rn,a,muni,row.get('Nom de la via'))
            lat=lon=font=''; prec=''; cs_code=''; cs_pct=''
            if res:
                lat,lon,font,prec=res; got+=1
                if prec=='exacta':
                    sec=csec.get((round(float(lat),5),round(float(lon),5)))
                    if sec: cs_code,cs_pct=sec[0],sec[1]
            w.writerow([(row.get(c) or '') for c in allcols]+[lat,lon,'Empresa' if is_emp else 'Particular',titular,font,prec,
                        'Sí' if is_tens else 'No', ('' if pct_ine is None else pct_ine), cs_code, cs_pct])
            n+=1
            if lat:
                la=round(float(lat),5); lo=round(float(lon),5); pr= 0 if prec=='exacta' else 1
                key=(la,lo)
                L=locs.setdefault(key,{'prec':pr,'muni':muni,
                                       'adreca':a,'mem':[],'tens':is_tens,'ine':pct_ine})
                if pr<L['prec']: L['prec']=pr
                pis=(row.get('Pis') or '').strip(); porta=(row.get('Porta') or '').strip()
                places=(row.get('Total places') or '').strip()
                try: places=int(float(places))
                except: places=0
                pidx=PROVS.index((row.get('Província') or '').strip()) if (row.get('Província') or '').strip() in PROVS else 0
                L['prov']=pidx
                L['mem'].append({'e':1 if is_emp else 0,'t':titular,'pl':places,
                                 'pp':' '.join(x for x in [pis,porta] if x),'lic':rn,'ad':a})
print(f'CSV: filas={n} con_coords={got} ({got/n*100:.1f}%)  -> {CSV_OUT}')

# construir payload mapa
out_locs=[]
for (la,lo),L in locs.items():
    mem=L['mem']; ne=sum(m['e'] for m in mem); npar=len(mem)-ne
    pls=sum(m['pl'] for m in mem)
    # color: 2=mixto,1=empresa,0=particular
    col= 1 if ne and not npar else (0 if npar and not ne else 2)
    # INE: si exacto -> % de la seccion censal; si aproximado -> media del municipio
    ine_val=''; ine_lvl='m'
    if L['prec']==0:
        sec=csec.get((la,lo))
        if sec and sec[1] not in ('',None):
            try: ine_val=round(float(sec[1]),2); ine_lvl='s'
            except: ine_val=''
    if ine_val=='':
        ine_val = L.get('ine') if L.get('ine') is not None else ''
        ine_lvl='m'
    # ad por miembro: '' si coincide con la direccion de la ubicacion (ahorra espacio en fincas exactas)
    out_locs.append([la,lo, len(mem), col, ne, npar, pls, L['prec'], L['prov'],
                     L['muni'], L['adreca'], [[m['e'],m['t'],m['pl'],m['pp'],m['lic'],('' if m['ad']==L['adreca'] else m['ad'])] for m in mem],
                     (1 if L.get('tens') else 0), ine_val, ine_lvl ])
payload={'provs':PROVS,'hasTens':len(tens)>0,'inePeriode':'novembre 2025','locs':out_locs}
with open(os.path.join(D,'map_payload.json'),'w',encoding='utf-8') as f:
    json.dump(payload,f,ensure_ascii=False,separators=(',',':'))
print('ubicaciones:',len(out_locs),'| payload MB:',round(os.path.getsize(os.path.join(D,'map_payload.json'))/1e6,2))

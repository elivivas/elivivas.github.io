import csv, glob, os
csv.field_size_limit(10**7)
D=os.path.dirname(os.path.abspath(__file__))
SRC=os.path.dirname(D)
CACHE=os.path.join(D,"cache.tsv")
OD=os.path.join(D,"opendata_bcn.csv")
OUT=os.path.join(SRC,"pisos_turisticos_catalunya_geocodificado.csv")

# 1) registry coords from Barcelona open data (priority, official)
reg2coord={}
if os.path.exists(OD):
    with open(OD,encoding='utf-8',newline='') as f:
        for row in csv.DictReader(f):
            reg=(row.get('NUMERO_REGISTRE_GENERALITAT') or '').strip()
            lat=(row.get('LATITUD_Y') or '').strip().replace(',','.')
            lon=(row.get('LONGITUD_X') or '').strip().replace(',','.')
            if reg and lat and lon:
                reg2coord[reg]=(lat,lon)

# 2) geocoded coords by address
addr2coord={}
if os.path.exists(CACHE):
    with open(CACHE,encoding='utf-8') as f:
        for line in f:
            p=line.rstrip("\n").split("\t")
            if len(p)>=3:
                addr2coord[p[0]]=(p[1],p[2],p[3] if len(p)>3 else "",p[4] if len(p)>4 else "")

cand=sorted(glob.glob(os.path.join(SRC,"*.csv")))
files=[]
for fp in cand:
    if os.path.abspath(fp)==os.path.abspath(OUT): continue
    with open(fp,encoding='utf-8',newline='') as fh:
        hdr=fh.readline()
    if 'Adre' in hdr and 'Número inscripció' in hdr:
        files.append(fp)
print('archivos fuente:',[os.path.basename(f) for f in files])
allcols=[]; seen=set(); rows_per=[]
for fpath in files:
    with open(fpath,newline='',encoding='utf-8') as fh:
        r=csv.DictReader(fh)
        for c in r.fieldnames:
            if c and c.strip() and c not in seen: seen.add(c); allcols.append(c)
        rows_per.append((os.path.basename(fpath),list(r)))

header=allcols+["latitud","longitud","font_coord","geo_precisio","geo_etiqueta"]
n=0; got=0; src_reg=0; src_geo=0
with open(OUT,"w",newline='',encoding='utf-8') as out:
    w=csv.writer(out); w.writerow(header)
    for fname,rows in rows_per:
        for row in rows:
            reg=(row.get('Número inscripció') or '').strip()
            a=(row.get("Adreça") or "").strip()
            lat=lon=font=layer=etq=""
            if reg in reg2coord:
                lat,lon=reg2coord[reg]; font="registre_opendata"; layer="portal_registre"; src_reg+=1
            elif a in addr2coord and addr2coord[a][0]:
                lat,lon,layer,etq=addr2coord[a]; font="geocod_icgc"; src_geo+=1
            if lat: got+=1
            vals=[(row.get(c) or "") for c in allcols]+[lat,lon,font,layer,etq]
            w.writerow(vals); n+=1
print(f"rows={n} with_coords={got} ({got/n*100:.1f}%) | via registre={src_reg} via geocod={src_geo}")
print("OUT:",OUT)

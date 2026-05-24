# Asigna a cada coordenada su seccion censal (CUSEC) y el % INE de esa seccion.
import json, csv, os, time
from shapely.geometry import shape, Point
from shapely.strtree import STRtree
D=os.path.dirname(os.path.abspath(__file__))
gj=json.load(open(os.path.join(D,'seccions_censals_CT.geojson'),encoding='utf-8'))
polys=[]; cusec=[]
for f in gj['features']:
    polys.append(shape(f['geometry'])); cusec.append(f['properties']['CUSEC'])
tree=STRtree(polys)
pct={}
for row in csv.DictReader(open(os.path.join(D,'ine_viv_turistica.csv'),encoding='utf-8')):
    pct[row['CUSEC']]=row.get('Porcentaje vivienda turistica') or ''
# coordenadas distintas del payload
P=json.load(open(os.path.join(D,'map_payload.json'),encoding='utf-8'))
coords={(round(L[0],5),round(L[1],5)) for L in P['locs']}
out=open(os.path.join(D,'coord_section.tsv'),'w',encoding='utf-8')
n=0; found=0
for (la,lo) in coords:
    pt=Point(lo,la); cs=''
    for i in tree.query(pt):
        if polys[i].contains(pt): cs=cusec[i]; break
    p = pct.get(cs,'')
    if cs: found+=1
    out.write(f"{la},{lo}\t{cs}\t{p}\n"); n+=1
out.close()
print(f'coords={n} con_seccion={found}')

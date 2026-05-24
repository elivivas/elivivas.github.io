# Re-geocodifica las direcciones que quedaron APROXIMADAS (centroide municipio)
# usando CartoCiudad (oficial ES) y Nominatim (OSM) como reserva.
# Escribe regeo.tsv (mismo formato que cache.tsv): adreca\tlat\tlon\taddress\tetiqueta
# Reanudable. Requiere que www.cartociudad.es y nominatim.openstreetmap.org esten en la allowlist
# (recordatorio: la allowlist se carga al INICIAR la sesion -> abre una conversacion NUEVA).
import csv, json, os, sys, time, urllib.parse, urllib.request, threading
from concurrent.futures import ThreadPoolExecutor
D=os.path.dirname(os.path.abspath(__file__))
CSV_OUT=os.path.join(os.path.dirname(D),'pisos_turisticos_catalunya_geocodificado.csv')
REGEO=os.path.join(D,'regeo.tsv')
RUN=float(sys.argv[1]) if len(sys.argv)>1 else 38
W=int(sys.argv[2]) if len(sys.argv)>2 else 6   # suau amb els servidors publics

# direcciones aproximadas (geo_precisio == 'aproximada') del CSV final
csv.field_size_limit(10**7)
todo_all={}
for row in csv.DictReader(open(CSV_OUT,encoding='utf-8')):
    if (row.get('geo_precisio') or '')=='aproximada':
        a=(row.get('Adreça') or '').strip()
        if a: todo_all[a]=True
done=set()
if os.path.exists(REGEO):
    for l in open(REGEO,encoding='utf-8'): done.add(l.split('\t',1)[0])
todo=[a for a in todo_all if a not in done]
print(f'aproximadas unicas={len(todo_all)} fetes={len(done)} todo={len(todo)}',flush=True)
if not todo: print('REGEO_COMPLETE'); sys.exit(0)

def carto(a):
    url='https://www.cartociudad.es/geocoder/api/geocoder/find?q='+urllib.parse.quote(a)
    req=urllib.request.Request(url,headers={'User-Agent':'storydata-map/1.0','Accept':'application/json'})
    with urllib.request.urlopen(req,timeout=15) as r:
        d=json.loads(r.read().decode('utf-8','ignore'))
    if isinstance(d,dict) and d.get('lat') and d.get('lng'):
        return (str(d['lat']),str(d['lng']),'address', d.get('address') or a)
    return None
def osm(a):
    url='https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+urllib.parse.quote(a)
    req=urllib.request.Request(url,headers={'User-Agent':'storydata-map/1.0 (team@storydata.cat)'})
    with urllib.request.urlopen(req,timeout=15) as r:
        d=json.loads(r.read().decode('utf-8','ignore'))
    if d:
        return (d[0]['lat'],d[0]['lon'],'address', d[0].get('display_name') or a)
    return None

lock=threading.Lock(); out=open(REGEO,'a',encoding='utf-8',buffering=1)
start=time.time(); c={'carto':0,'osm':0,'none':0,'err':0}
def work(a):
    if time.time()-start>RUN: return
    res=None
    for fn in (carto,osm):
        try:
            res=fn(a)
            if res: break
        except Exception: pass
        time.sleep(0.2)
    with lock:
        if res:
            la,lo,ly,etq=res; etq=(etq or '').replace('\t',' ').replace('\n',' ')
            out.write(f"{a}\t{la}\t{lo}\t{ly}\t{etq}\n")
            c['carto' if res[2] else 'osm']+=1; c['carto']+=0
        else:
            out.write(f"{a}\t\t\tNONE\t\n"); c['none']+=1
with ThreadPoolExecutor(max_workers=W) as ex:
    futs=[ex.submit(work,a) for a in todo if time.time()-start<=RUN]
    for f in futs:
        try: f.result(timeout=25)
        except: pass
out.flush(); out.close()
print('escrites aquesta tanda:', c, flush=True)

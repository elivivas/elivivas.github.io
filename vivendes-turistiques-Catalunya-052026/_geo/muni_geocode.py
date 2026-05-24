import csv,json,os,sys,time,urllib.parse,urllib.request,threading,unicodedata
from concurrent.futures import ThreadPoolExecutor
D=os.path.dirname(os.path.abspath(__file__))
OUT=os.path.join(D,'muni_centroids.tsv')
RUN=float(sys.argv[1]) if len(sys.argv)>1 else 38
W=int(sys.argv[2]) if len(sys.argv)>2 else 14
def norm(s):
    s=unicodedata.normalize('NFKD',(s or '').lower()).encode('ascii','ignore').decode()
    for art in ["l'","el ","la ","els ","les ","es ","sa "]:
        if s.startswith(art): s=s[len(art):]
    return s.replace("'"," ").replace("-"," ").strip()
munis=[]
for l in open('munis.tsv',encoding='utf-8'):
    p=l.rstrip('\n').split('\t'); 
    if len(p)>=2: munis.append((p[0],p[1]))
done=set()
if os.path.exists(OUT):
    for l in open(OUT,encoding='utf-8'): done.add(l.split('\t',1)[0])
todo=[(m,p) for (m,p) in munis if m not in done]
print(f'munis={len(munis)} done={len(done)} todo={len(todo)}',flush=True)
if not todo: print('MUNI_COMPLETE'); sys.exit(0)
lock=threading.Lock(); out=open(OUT,'a',encoding='utf-8',buffering=1)
start=time.time(); c={'ok':0,'bad':0,'err':0}
def work(mp):
    m,p=mp
    if time.time()-start>RUN: return
    q=m
    url='https://eines.icgc.cat/geocodificador/cerca?size=5&text='+urllib.parse.quote(q)
    try:
        req=urllib.request.Request(url,headers={'User-Agent':'geo'})
        with urllib.request.urlopen(req,timeout=15) as r: data=json.loads(r.read().decode())
        best=None
        for ft in (data.get('features') or []):
            pr=ft.get('properties',{}); lay=pr.get('layer','')
            mn=pr.get('municipi') or pr.get('nom') or ''
            if lay in ('municipi','poblacio','localitat','locality') or norm(mn)==norm(m):
                best=ft; break
        if not best and (data.get('features')): best=data['features'][0]
        if best:
            lon,lat=best['geometry']['coordinates']; pr=best['properties']
            mn=pr.get('municipi') or pr.get('nom') or ''
            match = norm(mn)==norm(m)
            lay2=pr.get('layer','')
            with lock: out.write(m+'\t'+str(lat)+'\t'+str(lon)+'\t'+lay2+'\t'+mn+'\t'+('1' if match else '0')+'\n'); c['ok']+=1
        else:
            with lock: out.write(f'{m}\t\t\tNONE\t\t0\n'); c['bad']+=1
    except Exception:
        with lock: c['err']+=1
with ThreadPoolExecutor(max_workers=W) as ex:
    futs=[ex.submit(work,mp) for mp in todo if time.time()-start<=RUN]
    for f in futs:
        try: f.result(timeout=20)
        except: pass
out.flush(); out.close()
print(f"ok={c['ok']} bad={c['bad']} err={c['err']}",flush=True)

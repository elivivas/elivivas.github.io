import csv, json, os, sys, time, urllib.parse, urllib.request, threading
from concurrent.futures import ThreadPoolExecutor
D=os.path.dirname(os.path.abspath(__file__))
CACHE=os.path.join(D,"cache.tsv")
FB=os.path.join(D,"fallback.tsv")
RUN=float(sys.argv[1]) if len(sys.argv)>1 else 38
W=int(sys.argv[2]) if len(sys.argv)>2 else 16

# NONE addresses from main cache
none=[]
for l in open(CACHE,encoding='utf-8'):
    p=l.rstrip("\n").split("\t")
    if len(p)>=2 and not p[1]:
        none.append(p[0])
done=set()
if os.path.exists(FB):
    for l in open(FB,encoding='utf-8'):
        done.add(l.split("\t",1)[0])
todo=[a for a in none if a not in done]
print(f"none={len(none)} fallback_done={len(done)} todo={len(todo)}",flush=True)
if not todo:
    print("FALLBACK_COMPLETE"); sys.exit(0)

def queries(addr):
    # addr like "Carrer Mata, 46145, 08004, Barcelona"
    parts=[x.strip() for x in addr.split(",")]
    muni=parts[-1] if parts else addr
    street=parts[0] if parts else addr
    qs=[]
    if street and muni: qs.append(f"{street}, {muni}")   # street level
    if muni: qs.append(muni)                              # municipality
    return qs

lock=threading.Lock()
out=open(FB,"a",encoding="utf-8",buffering=1)
start=time.time(); stop=threading.Event()
c={"ok":0,"none":0,"err":0}
def fetch(q):
    url="https://eines.icgc.cat/geocodificador/cerca?size=1&text="+urllib.parse.quote(q)
    req=urllib.request.Request(url,headers={"User-Agent":"geocoder"})
    with urllib.request.urlopen(req,timeout=15) as r:
        return json.loads(r.read().decode('utf-8'))
def work(addr):
    if stop.is_set(): return
    try:
        for q in queries(addr):
            data=fetch(q)
            feats=data.get("features") or []
            if feats:
                ft=feats[0]; lon,lat=ft["geometry"]["coordinates"]; p=ft.get("properties",{})
                etq=(p.get("etiqueta","") or "").replace("\t"," ").replace("\n"," ")
                with lock: out.write(f"{addr}\t{lat}\t{lon}\t{p.get('layer','')}\t{etq}\n"); c["ok"]+=1
                return
        with lock: out.write(f"{addr}\t\t\tNONE\t\n"); c["none"]+=1
    except Exception:
        with lock: c["err"]+=1
with ThreadPoolExecutor(max_workers=W) as ex:
    futs=[]
    for a in todo:
        if time.time()-start>RUN: break
        futs.append(ex.submit(work,a))
    for f in futs:
        if time.time()-start>RUN+8: stop.set()
        try: f.result(timeout=25)
        except: pass
out.flush(); out.close()
print(f"ok={c['ok']} none={c['none']} err={c['err']}",flush=True)

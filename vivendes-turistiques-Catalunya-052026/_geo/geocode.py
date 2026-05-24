import csv, json, os, sys, time, urllib.parse, urllib.request, threading
from concurrent.futures import ThreadPoolExecutor

GEO="/sessions/compassionate-brave-archimedes/mnt/outputs/geo/"
UNIQ=GEO+"unique_addresses.txt"
CACHE=GEO+"cache.tsv"
RUN_SECONDS=float(sys.argv[1]) if len(sys.argv)>1 else 40
WORKERS=int(sys.argv[2]) if len(sys.argv)>2 else 12
SHARD_I=int(sys.argv[3]) if len(sys.argv)>3 else 0
SHARD_N=int(sys.argv[4]) if len(sys.argv)>4 else 1

# load cache
done=set()
if os.path.exists(CACHE):
    with open(CACHE,encoding='utf-8') as f:
        for line in f:
            k=line.split("\t",1)[0]
            done.add(k)

# load addresses to do
todo=[]
with open(UNIQ,encoding='utf-8') as f:
    for line in f:
        a=line.rstrip("\n")
        if a and a not in done:
            if SHARD_N>1 and (hash(a)%SHARD_N)!=SHARD_I:
                continue
            todo.append(a)

print(f"cache={len(done)} todo={len(todo)} workers={WORKERS} run={RUN_SECONDS}s",flush=True)

lock=threading.Lock()
out=open(CACHE,"a",encoding="utf-8",buffering=1)
start=time.time()
stop=threading.Event()
counter={"ok":0,"empty":0,"err":0}

def geocode(addr):
    if stop.is_set(): return None
    url="https://eines.icgc.cat/geocodificador/cerca?size=1&text="+urllib.parse.quote(addr)
    try:
        req=urllib.request.Request(url, headers={"User-Agent":"geocoder"})
        with urllib.request.urlopen(req, timeout=15) as r:
            data=json.loads(r.read().decode('utf-8'))
        feats=data.get("features") or []
        if feats:
            ft=feats[0]
            lon,lat=ft["geometry"]["coordinates"]
            p=ft.get("properties",{})
            layer=p.get("layer","")
            etq=(p.get("etiqueta","") or "").replace("\t"," ").replace("\n"," ")
            row=f"{addr}\t{lat}\t{lon}\t{layer}\t{etq}\n"
            with lock:
                out.write(row); 
                counter["ok"]+=1
        else:
            with lock:
                out.write(f"{addr}\t\t\tNONE\t\n")
                counter["empty"]+=1
    except Exception as e:
        with lock:
            counter["err"]+=1
    return None

with ThreadPoolExecutor(max_workers=WORKERS) as ex:
    futs=[]
    for addr in todo:
        if time.time()-start>RUN_SECONDS:
            break
        futs.append(ex.submit(geocode,addr))
    # wait but respect time
    for fu in futs:
        if time.time()-start>RUN_SECONDS+10:
            stop.set()
        try: fu.result(timeout=20)
        except: pass

out.flush(); out.close()
el=time.time()-start
n=counter["ok"]+counter["empty"]+counter["err"]
print(f"processed={n} ok={counter['ok']} empty={counter['empty']} err={counter['err']} in {el:.1f}s -> {n/el:.1f}/s",flush=True)

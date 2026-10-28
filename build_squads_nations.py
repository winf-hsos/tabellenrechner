import json,sys
sys.path.insert(0,'.')
from nations import NATIONS
raw=json.load(open('squads_nations_raw.json',encoding='utf8'))
NEED=[('GK','TW',2),('DF','ABW',6),('MF','MF',6),('FW','ST',4)]
out={};bad=[]
for name,cc,st,title in NATIONS:
    pl=raw.get(title) or []
    pl=sorted(pl,key=lambda p:(p['no'] if isinstance(p['no'],int) else 999))
    seen=set();lst=[]
    for p in pl:
        n=p['name'].strip()
        if n in seen: continue
        seen.add(n); lst.append({**p,'name':n})
    sq={v:[] for _,v,_ in NEED}; used=set(); left=[]
    for p in lst:
        k=next((x for x in NEED if x[0]==p['pos']),None)
        if k and len(sq[k[1]])<k[2]: sq[k[1]].append(p['name']); used.add(p['name'])
        else: left.append(p)
    for pos,key,n in NEED:
        while len(sq[key])<n:
            cand=[p for p in left if p['name'] not in used and (pos!='GK' or p['pos']=='GK')]
            if not cand: break
            p=cand[0]; left.remove(p); sq[key].append(p['name']); used.add(p['name'])
    if sum(len(v) for v in sq.values())<14 or not sq['TW']:
        bad.append((name,{k:len(v) for k,v in sq.items()})); continue
    out[name]=sq
json.dump(out,open('squads_nations_final.json','w'),ensure_ascii=False,indent=0)
print(len(out),'Nationalkader; unvollständig/ohne Daten:',bad)

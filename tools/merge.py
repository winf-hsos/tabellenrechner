import json, glob, re, sys
p = "Tabellenrechner.jsx"
s = open("Tabellenrechner.pre_real4.jsx" if len(sys.argv)>1 and sys.argv[1]=="redo" else p, encoding="utf-8").read()
allk = {}
for f in sorted(glob.glob("kader_[A-E].json")) + sorted(glob.glob("kader_C2_*.json")):
    for k, v in json.load(open(f, encoding="utf-8")).items():
        if k in allk and any(allk[k].values()) and f.startswith("kader_C2"):
            pass
        allk[k] = v if (k not in allk or f.startswith("kader_C2")) else allk[k]
# Sebastian Jung (Zwickau) kollidiert mit gleichnamigem Spieler eines anderen Vereins
z = allk["FSV Zwickau"]; z["TW"] = [n for n in z["TW"] if n != "Sebastian Jung"]
l = allk["Sportfreunde Lotte"]; l["ABW"] = [n for n in l["ABW"] if n != "Denis Milic"]  # steht auch bei Illertissen (dort als Torjäger belegt)
order = ["Erzgebirge Aue","VfB Oldenburg","Rot-Weiß Oberhausen","Hallescher FC","Chemnitzer FC","VfB Lübeck","Kickers Offenbach","FC Carl Zeiss Jena","SpVgg Unterhaching","1. FC Schweinfurt 05","FC Rot-Weiß Erfurt","Stuttgarter Kickers","SV Sandhausen","FSV Zwickau","FC Gütersloh","Greifswalder FC","FV Illertissen","1. FC Lokomotive Leipzig","HSC Hannover","Sportfreunde Lotte","SV Todesfelde","Eintracht Norderstedt"]
def arr(l): return "[" + ", ".join(json.dumps(n, ensure_ascii=False) for n in l) + "]"
blk = ""
for t in order:
    k = allk[t]
    blk += f'  {json.dumps(t, ensure_ascii=False)}: {{\n'
    for pos in ["TW","ABW","MF","ST"]:
        blk += f'    {pos}: {arr(k.get(pos, []))},\n'
    blk += '  },\n'
marker = "const REAL_SQUADS = {\n"
assert s.count(marker) == 1
import os
if not os.path.exists("Tabellenrechner.pre_real4.jsx"):
    open("Tabellenrechner.pre_real4.jsx","w",encoding="utf-8").write(s)
s = s.replace(marker, marker + "  // 4. Liga (Kader 2026/27, Stand Oktober 2026)\n" + blk, 1)
open(p, "w", encoding="utf-8").write(s)
print("eingetragen:", len(order), "Vereine")

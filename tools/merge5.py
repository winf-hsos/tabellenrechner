import json, glob
p = "Tabellenrechner.jsx"
s = open("Tabellenrechner.pre_real5.jsx", encoding="utf-8").read()
allk = {}
for f in sorted(glob.glob("kader5_[A-D].json")):
    allk.update(json.load(open(f, encoding="utf-8")))
# Namensgleiche Spieler bei Vereinen der oberen Ligen bleiben dort stehen
allk["FC Bocholt"]["ABW"] = [n for n in allk["FC Bocholt"]["ABW"] if n != "Alexander Hahn"]
allk["FC 08 Homburg"]["ABW"] = [n for n in allk["FC 08 Homburg"]["ABW"] if n != "Kristijan Taseski"]
order = ["BFC Dynamo","KSV Hessen Kassel","Sportfreunde Siegen","FC Bocholt","BSG Chemie Leipzig","FC 08 Homburg","SV Atlas Delmenhorst","Bremer SV","FSV 63 Luckenwalde","SpVgg Ansbach","FC Memmingen","TSV Buchbach","Tasmania Berlin","BFC Preussen","FC Schöningen","SSV Jeddeloh II"]
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
s = s.replace(marker, marker + "  // 5. Liga (Kader 2026/27, Stand Oktober 2026)\n" + blk, 1)

# Jeddeloh: Der Topf-Eintrag "SSV Jeddeloh" ist dieselbe Mannschaft wie "SSV Jeddeloh II"
old = '{ name: "SSV Jeddeloh", staffel: "Nord", strength: 23 },'
assert s.count(old) == 1
s = s.replace(old, '{ name: "SSV Jeddeloh II", staffel: "Nord", strength: 23 },')
old = "function normalize(d) {\n  if (!d || !d.active) return freshData();\n"
assert s.count(old) == 1
s = s.replace(old, '''/** Vereine, die früher unter einem anderen Namen geführt wurden. */
const UMBENENNUNG = { "SSV Jeddeloh": "SSV Jeddeloh II" };

function normalize(d0) {
  if (!d0 || !d0.active) return freshData();
  const alias = (n) => UMBENENNUNG[n] || n;
  const d = {
    ...d0,
    active: Object.fromEntries(Object.entries(d0.active).map(([id, s]) =>
      [id, s && Array.isArray(s.teams) ? { ...s, teams: s.teams.map(alias) } : s])),
    regional: Array.isArray(d0.regional) ? d0.regional.map((c) => ({ ...c, name: alias(c.name) })) : d0.regional,
  };
''')
open(p, "w", encoding="utf-8").write(s)
print("ok")

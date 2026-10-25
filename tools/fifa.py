import json
p="Tabellenrechner.jsx"
s=open(p,encoding="utf-8").read()
def rep(old,new,cnt=1):
    global s
    assert s.count(old)==cnt, f"{s.count(old)}x: "+old[:70]
    s=s.replace(old,new)
data={}
for lid,f in (("bl1","fifa_bl1.json"),("bl2","fifa_bl2.json"),("bl3","fifa_bl3.json")):
    d=json.load(open(f,encoding="utf-8"))
    data[lid]={k:int(v["overall"]) for k,v in d.items()}
def lit(m):
    return "{\n"+"".join(f"    {json.dumps(k,ensure_ascii=False)}: {v},\n" for k,v in m.items())+"  }"
block='''/* ---------------- EA FC 27: Teamwertungen ---------------- */

/** Team-Overall der drei Profiligen in EA FC 27 (Stand Oktober 2026, Drittquellen). */
const FIFA27 = {
'''+"".join(f'  {lid}: {lit(m)},\n' for lid,m in data.items())+'''};

/**
 * Teamstärke aus dem FIFA-Wert: je Liga linear zwischen dem stärksten und schwächsten Klub,
 * auf die Stärkespanne dieser Liga umgerechnet. Die Abstände bleiben wie bei FIFA.
 */
const FIFA_STRENGTH = (() => {
  const m = {};
  Object.keys(FIFA27).forEach((id) => {
    const vals = Object.values(FIFA27[id]);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const [top, bot] = LEAGUE_BY_ID[id].range;
    Object.entries(FIFA27[id]).forEach(([name, v]) => {
      m[name] = Math.round(bot + ((v - lo) / Math.max(1, hi - lo)) * (top - bot));
    });
  });
  return m;
})();

'''
rep("function defaultStrengths(leagueId, n) {", block+"function defaultStrengths(leagueId, n) {")

# freshData
rep('''    active[l.id] = newSeason(l.teams, defaultStrengths(l.id, l.teams.length), "2026/27", defaultStart(l.id, "2026/27"));
  });
  return { active, cup: null,''','''    const std = defaultStrengths(l.id, l.teams.length);
    const werte = l.teams.map((n, i) => (FIFA_STRENGTH[n] != null ? FIFA_STRENGTH[n] : std[i]));
    active[l.id] = newSeason(l.teams, werte, "2026/27", defaultStart(l.id, "2026/27"));
  });
  return { active, cup: null,''')

# Anwenden im laufenden Stand
rep('''  const setLogo = useCallback((name, url) => {''','''  /** Stärken aller Klubs, die in EA FC 27 stehen, auf die FIFA-Werte setzen. Gibt die Anzahl zurück. */
  const applyFifa = () => {
    let n = 0;
    LEAGUE_IDS.forEach((id) => {
      const s = data.active[id];
      s.teams.forEach((t) => { if (FIFA_STRENGTH[t] != null) n++; });
    });
    setData((d) => {
      const active = { ...d.active };
      LEAGUE_IDS.forEach((id) => {
        const s = d.active[id];
        const squads = s.squads.map((q, i) => (FIFA_STRENGTH[s.teams[i]] != null ? scaleSquadTo(q, FIFA_STRENGTH[s.teams[i]]) : q));
        active[id] = { ...s, squads, strengths: squads.map(squadStrength) };
      });
      return { ...d, active };
    });
    return n;
  };

  const setLogo = useCallback((name, url) => {''')
rep('''          logos={data.logos || NO_LOGOS} onLogo={setLogo}''','''          logos={data.logos || NO_LOGOS} onLogo={setLogo} onFifa={applyFifa}''')

# TeamsModal UI
rep("function TeamsModal({ season, leagueName, onClose, onSave, onSquad, logos, onLogo }) {","function TeamsModal({ season, leagueName, onClose, onSave, onSquad, logos, onLogo, onFifa }) {\n  const [fifaStep, setFifaStep] = useState(0);\n  const [fifaMsg, setFifaMsg] = useState(\"\");")
rep('''      <div className="lr-bulk" onDragOver''','''      <div className="lr-bulk lr-fifa">
        {fifaStep === 0 && (
          <button type="button" className="lr-btn lr-btn-sm" id="fifa-start" onClick={() => { setFifaStep(1); setFifaMsg(""); }}>
            Stärken nach EA FC 27 setzen
          </button>
        )}
        {fifaStep === 1 && (
          <>
            <button type="button" className="lr-btn lr-btn-sm lr-btn-p" id="fifa-ok"
              onClick={() => { const n = onFifa(); setFifaStep(0); setFifaMsg(`${n} Klubs auf ihre FIFA-Stärke gesetzt.`); }}>
              Ja, Stärken überschreiben
            </button>
            <button type="button" className="lr-btn lr-btn-sm" onClick={() => setFifaStep(0)}>Abbrechen</button>
          </>
        )}
        <span className="lr-bulk-hint">
          {fifaMsg || "Gilt für Bundesliga, 2. Bundesliga und 3. Liga: Jeder Klub bekommt die Stärke, die seinem FIFA-Wert entspricht, die Abstände bleiben wie bei FIFA. Klubs der 4. und 5. Liga bleiben unverändert. Eigene Stärken und Kaderwerte dieser Klubs werden überschrieben."}
        </span>
      </div>
      <div className="lr-bulk" onDragOver''')
open(p,"w",encoding="utf-8").write(s)
print("ok")

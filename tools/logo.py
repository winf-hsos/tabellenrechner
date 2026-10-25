p="Tabellenrechner.jsx"
s=open(p,encoding="utf-8").read()
def rep(old,new,cnt=1):
    global s
    assert s.count(old)==cnt, f"{s.count(old)}x: "+old[:70]
    s=s.replace(old,new)

rep('import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";',
    'import React, { useState, useEffect, useMemo, useRef, useCallback, useContext, createContext } from "react";')

# Logo-Komponente vor "Saison und Speicherung"
rep('''function defaultStrengths(leagueId, n) {''','''/* ---------------- Vereinslogos ---------------- */

const NO_LOGOS = {};
const LogoCtx = createContext(NO_LOGOS);

/** Kleines Vereinslogo vor dem Namen, falls eines hinterlegt ist. */
function Logo({ name }) {
  const logos = useContext(LogoCtx);
  const src = logos[name];
  return src ? <img className="lr-logo" src={src} alt="" /> : null;
}

/** Bilddatei auf höchstens 96 Pixel verkleinern und als PNG-Datenadresse liefern. */
function logoFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const max = 96;
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * k));
        const h = Math.max(1, Math.round(img.height * k));
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/png"));
      } catch (e) { reject(e); }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Bild nicht lesbar")); };
    img.src = url;
  });
}

function defaultStrengths(leagueId, n) {''')

# freshData / normalize
rep("surpriseBias: 1, realSquads: [...REAL_NAMES],","surpriseBias: 1, realSquads: [...REAL_NAMES], logos: {},")
rep("  const out = { active: {}, cup: d.cup || null,","  const out = { logos: d.logos && typeof d.logos === \"object\" ? d.logos : {}, active: {}, cup: d.cup || null,")

# Anzeige
rep('<td className="name">{r.name}{!compact && <Form form={r.form} />}</td>','<td className="name"><Logo name={r.name} />{r.name}{!compact && <Form form={r.form} />}</td>')
rep('>{season.teams[h]}</div>','><Logo name={season.teams[h]} />{season.teams[h]}</div>')
rep('>{season.teams[a]}</div>','><Logo name={season.teams[a]} />{season.teams[a]}</div>')
rep('>{g.h.name}</div>','><Logo name={g.h.name} />{g.h.name}</div>')
rep('>{g.a.name}</div>','><Logo name={g.a.name} />{g.a.name}</div>')

# Provider
rep('''  return (
    <div className="lr" style={rootAccent}>
      <style>{CSS}</style>''','''  return (
    <LogoCtx.Provider value={data.logos || NO_LOGOS}>
    <div className="lr" style={rootAccent}>
      <style>{CSS}</style>''')
lines=s.split("\n")
# Schluss der Hauptkomponente: erste Zeile "    </div>" direkt vor "  );" vor "function TeamsModal" suchen
i=s.index("function TeamsModal")
j=s.rindex("    </div>\n  );\n}\n", 0, i)
s=s[:j]+"    </div>\n    </LogoCtx.Provider>\n  );\n}\n"+s[j+len("    </div>\n  );\n}\n"):]

# Logo setzen / umbenennen in Hauptkomponente
rep('''  const updateCup = useCallback((fn) => {''','''  const setLogo = useCallback((name, url) => {
    setData((d) => {
      if (!d) return d;
      const logos = { ...(d.logos || {}) };
      if (url) logos[name] = url; else delete logos[name];
      return { ...d, logos };
    });
  }, []);

  /** Benennt man einen Verein um, zieht sein Logo mit. */
  const moveLogos = (alt, neu) => {
    setData((d) => {
      if (!d) return d;
      const logos = { ...(d.logos || {}) };
      const gesichert = {};
      alt.forEach((n, i) => { if (n !== neu[i] && logos[n]) { gesichert[neu[i]] = logos[n]; delete logos[n]; } });
      return { ...d, logos: { ...logos, ...gesichert } };
    });
  };

  const updateCup = useCallback((fn) => {''')
rep('''        <TeamsModal season={season} leagueName={league.name} onClose={() => setModal(null)}
          onSave={(teams) => {
            updateSeason(league.id, (s) => ({ ...s, teams }));
            setModal(null);
          }}
          onSquad={(i, teams) => {
            updateSeason(league.id, (s) => ({ ...s, teams }));''','''        <TeamsModal season={season} leagueName={league.name} onClose={() => setModal(null)}
          logos={data.logos || NO_LOGOS} onLogo={setLogo}
          onSave={(teams) => {
            moveLogos(season.teams, teams);
            updateSeason(league.id, (s) => ({ ...s, teams }));
            setModal(null);
          }}
          onSquad={(i, teams) => {
            moveLogos(season.teams, teams);
            updateSeason(league.id, (s) => ({ ...s, teams }));''')

# TeamsModal
rep("function TeamsModal({ season, leagueName, onClose, onSave, onSquad }) {","function TeamsModal({ season, leagueName, onClose, onSave, onSquad, logos, onLogo }) {\n  const [fehler, setFehler] = useState(\"\");\n  const pick = async (name, file) => {\n    if (!file) return;\n    try { onLogo(name, await logoFromFile(file)); setFehler(\"\"); }\n    catch (e) { setFehler(\"Das Bild konnte nicht gelesen werden. Bitte PNG, JPG oder WebP wählen.\"); }\n  };")
rep('''      <div className="lr-team-head kader"><span>Mannschaft</span><span>Stärke</span><span /></div>
      {names.map((n, i) => (
        <div className="lr-team-row kader" key={i}>
          <input className="lr-team-in" value={n} aria-label={`Mannschaft ${i + 1}`}
            onChange={(e) => { const c = [...names]; c[i] = e.target.value; setNames(c); }} />''','''      <div className="lr-team-head kader"><span>Mannschaft</span><span>Logo</span><span>Stärke</span><span /></div>
      {fehler && <p style={{ margin: "0 0 8px", fontSize: 12 }}>{fehler}</p>}
      {names.map((n, i) => (
        <div className="lr-team-row kader" key={i}>
          <input className="lr-team-in" value={n} aria-label={`Mannschaft ${i + 1}`}
            onChange={(e) => { const c = [...names]; c[i] = e.target.value; setNames(c); }} />
          <span className="lr-logo-cell">
            <label className="lr-logo-pick" title={logos[season.teams[i]] ? "Logo ändern" : "Logo hinzufügen"}>
              {logos[season.teams[i]]
                ? <img src={logos[season.teams[i]]} alt={`Logo ${season.teams[i]}`} />
                : <span>+</span>}
              <input type="file" accept="image/*" id={`logo-${i}`} aria-label={`Logo für ${season.teams[i]} wählen`}
                onChange={(e) => { pick(season.teams[i], e.target.files && e.target.files[0]); e.target.value = ""; }} />
            </label>
            {logos[season.teams[i]] && (
              <button type="button" className="lr-logo-del" aria-label={`Logo von ${season.teams[i]} entfernen`}
                onClick={() => onLogo(season.teams[i], null)}>×</button>
            )}
          </span>''')
# CSS
rep(".lr-team-row.kader, .lr-team-head.kader { grid-template-columns: 1fr 46px 78px; }",
""".lr-team-row.kader, .lr-team-head.kader { grid-template-columns: 1fr 58px 46px 78px; }
.lr-team-head.kader span:nth-child(2) { text-align: center; }
.lr-logo { width: 20px; height: 20px; object-fit: contain; vertical-align: middle; margin-right: 8px; flex: none; }
div.lr-name { display: flex; align-items: center; }
.lr-logo-cell { display: flex; align-items: center; justify-content: center; gap: 2px; }
.lr-logo-pick { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border: 1px dashed var(--line-2); border-radius: 3px; cursor: pointer; color: var(--chalk-dim); overflow: hidden; }
.lr-logo-pick:hover, .lr-logo-pick:focus-within { border-color: var(--accent); color: var(--chalk); }
.lr-logo-pick img { width: 26px; height: 26px; object-fit: contain; }
.lr-logo-pick input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.lr-logo-del { background: none; border: 0; color: var(--chalk-dim); cursor: pointer; font-size: 15px; line-height: 1; padding: 2px 3px; }
.lr-logo-del:hover { color: var(--chalk); }""")
# alte Regel für Kopfzeile Spalte 2 entfernen (jetzt Logo)
rep(".lr-team-head.kader span:nth-child(2) { text-align: center; }\n.lr-team-str","\n.lr-team-str") if False else None
open(p,"w",encoding="utf-8").write(s)
print("ok")

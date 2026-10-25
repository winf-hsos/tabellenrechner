p="Tabellenrechner.jsx"
s=open(p,encoding="utf-8").read()
def rep(old,new,cnt=1):
    global s
    assert s.count(old)==cnt, f"{s.count(old)}x: "+old[:70]
    s=s.replace(old,new)

# Zuordnung per Dateiname
rep("/** Bilddatei auf höchstens 96 Pixel","""const LOGO_STOP = new Set(["fc", "sv", "vfl", "vfb", "tsv", "sc", "ssv", "tsg", "fsv", "sg", "ksv", "bsg", "spvgg",
  "ev", "e", "v", "1", "04", "05", "08", "09", "1846", "1860", "1899", "1900", "1904", "logo", "wappen", "club", "verein", "de", "png", "jpg", "jpeg", "webp", "svg"]);

function logoTokens(text) {
  return String(text).toLowerCase().replace(/ß/g, "ss").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter((t) => t && !LOGO_STOP.has(t));
}

/** Ordnet einen Dateinamen dem passendsten Verein der Liste zu (oder null). */
function matchLogoName(fileName, teams) {
  const base = String(fileName).replace(/\\.[^.]+$/, "");
  const ft = logoTokens(base);
  if (!ft.length) return null;
  const fkey = ft.join("");
  let best = -1, bestScore = 0, tie = false;
  teams.forEach((t, i) => {
    const tt = logoTokens(t);
    const tkey = tt.join("");
    let score = 0;
    if (tkey && tkey === fkey) score = 100;
    else {
      const shared = ft.filter((x) => tt.indexOf(x) >= 0).length;
      score = shared * 10;
      if (!shared && fkey.length >= 4 && tkey.length >= 4 && (tkey.includes(fkey) || fkey.includes(tkey))) score = 5;
    }
    if (score > bestScore) { best = i; bestScore = score; tie = false; }
    else if (score === bestScore && score > 0) tie = true;
  });
  return bestScore > 0 && !tie ? best : null;
}

/** Bilddatei auf höchstens 96 Pixel""")

# TeamsModal: Sammelauswahl
rep("""  const pick = async (name, file) => {""","""  const [hinweis, setHinweis] = useState("");
  const bulk = async (fileList) => {
    const files = [...(fileList || [])].filter((f) => /^image\\//.test(f.type) || /\\.(png|jpe?g|webp|svg|gif)$/i.test(f.name));
    if (!files.length) return;
    let ok = 0;
    const offen = [];
    for (const f of files) {
      const i = matchLogoName(f.name, season.teams);
      if (i == null) { offen.push(f.name); continue; }
      try { onLogo(season.teams[i], await logoFromFile(f)); ok++; } catch (e) { offen.push(f.name); }
    }
    setFehler("");
    setHinweis(`${ok} von ${files.length} Logos zugeordnet.` + (offen.length ? ` Nicht zugeordnet: ${offen.join(", ")}. Benenne die Dateien nach dem Verein oder füge sie unten einzeln hinzu.` : ""));
  };
  const pick = async (name, file) => {""")
rep("""      <div className="lr-team-head kader"><span>Mannschaft</span><span>Logo</span><span>Stärke</span><span /></div>
      {fehler && <p style={{ margin: "0 0 8px", fontSize: 12 }}>{fehler}</p>}""","""      <div className="lr-bulk" onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); bulk(e.dataTransfer && e.dataTransfer.files); }}>
        <label className="lr-btn lr-btn-sm lr-bulk-btn">
          Mehrere Logos auf einmal wählen
          <input type="file" accept="image/*" multiple id="logo-bulk" aria-label="Mehrere Logos auswählen"
            onChange={(e) => { bulk(e.target.files); e.target.value = ""; }} />
        </label>
        <span className="lr-bulk-hint">oder Dateien hierher ziehen. Der Dateiname muss zum Verein passen, z. B. „Hansa Rostock.png“ oder „Rostock.png“.</span>
      </div>
      {hinweis && <p style={{ margin: "0 0 8px", fontSize: 12 }}>{hinweis}</p>}
      <div className="lr-team-head kader"><span>Mannschaft</span><span>Logo</span><span>Stärke</span><span /></div>
      {fehler && <p style={{ margin: "0 0 8px", fontSize: 12 }}>{fehler}</p>}""")
rep(".lr-logo-cell { display: flex;",""".lr-bulk { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; border: 1px dashed var(--line-2); border-radius: 4px; padding: 10px; margin: 0 0 12px; }
.lr-bulk-btn { position: relative; cursor: pointer; }
.lr-bulk-btn input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.lr-bulk-hint { font-size: 12px; color: var(--chalk-dim); flex: 1 1 200px; min-width: 0; }
.lr-logo-cell { display: flex;""")
open(p,"w",encoding="utf-8").write(s)
print("ok")

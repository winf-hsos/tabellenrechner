/* ---------------- Europapokal: Oberfläche ---------------- */

/** Teilnehmer eines Wettbewerbs bearbeiten: Vereine hinzufügen, Logos setzen, Stärken eintragen. */
function EuroTeamsModal({ comp, list, active, logos, onLogo, onSave, onClose, onQual, hasRun }) {
  const [rows, setRows] = useState(() => list.map((t) => ({ ...t, orig: t.name })));
  const [fehler, setFehler] = useState("");
  const [hinweis, setHinweis] = useState("");
  const names = rows.map((r) => r.name.trim());
  const dup = names.some((n, i) => n && names.indexOf(n) !== i);
  const leer = names.some((n) => !n);
  const bad = dup || leer;
  const setRow = (i, patch) => setRows((r) => r.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  const pick = async (name, file) => {
    if (!file || !name) return;
    try { onLogo(name, await logoFromFile(file)); setFehler(""); }
    catch (e) { setFehler("Das Bild konnte nicht gelesen werden. Bitte PNG, JPG oder WebP wählen."); }
  };
  const bulk = async (fileList) => {
    const files = [...(fileList || [])].filter((f) => /^image\//.test(f.type) || /\.(png|jpe?g|webp|svg|gif)$/i.test(f.name));
    if (!files.length) return;
    let ok = 0;
    const offen = [];
    for (const f of files) {
      const i = matchLogoName(f.name, names);
      if (i == null || !names[i]) { offen.push(f.name); continue; }
      try { onLogo(names[i], await logoFromFile(f)); ok++; } catch (e) { offen.push(f.name); }
    }
    setFehler("");
    setHinweis(`${ok} von ${files.length} Logos zugeordnet.` + (offen.length ? ` Nicht zugeordnet: ${offen.join(", ")}.` : ""));
  };
  const qual = () => {
    const de = onQual();
    setRows((r) => [...de.map((name) => ({ name, de: true, strength: 70, orig: name })), ...r.filter((x) => !x.de)]);
    setHinweis("Deutsche Plätze aus der aktuellen Bundesliga-Tabelle gesetzt. Mit „Übernehmen“ speichern.");
  };
  const alleDeutschen = useMemo(() => LEAGUE_IDS.map((id) => ({ id, name: LEAGUE_BY_ID[id].name, teams: active[id] ? active[id].teams : [] })), [active]);
  const speichern = () => {
    const clean = rows.map((r) => ({ name: r.name.trim(), de: !!r.de, strength: Number(r.strength) || 60 }));
    const alt = [];
    const neu = [];
    rows.forEach((r) => {
      const n = r.name.trim();
      if (r.orig && r.orig !== n && logos[r.orig] && !logos[n]) { alt.push(r.orig); neu.push(n); }
    });
    onSave(clean, alt, neu);
  };

  return (
    <Modal onClose={onClose}>
      <h2>{comp.name} — Teilnehmer</h2>
      <p>
        Hier legst du die 36 Teilnehmer der Ligaphase fest. Die deutschen Klubs (DE) qualifizieren sich
        beim Abschluss aller Ligen automatisch über die Bundesliga-Tabelle und den DFB-Pokal, ihre Stärke
        kommt aus der Liga. Alle anderen Vereine kannst du umbenennen, austauschen, mit Logo versehen und
        mit einer Stärke belegen. Die Stärken sind Schätzungen auf der Skala der Bundesliga.
        {hasRun ? " Eine Runde läuft gerade: Namen und Stärken gelten erst ab der nächsten Auslosung, Logos sofort." : ""}
      </p>
      <div className="lr-bulk" onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); bulk(e.dataTransfer && e.dataTransfer.files); }}>
        <label className="lr-btn lr-btn-sm lr-bulk-btn">
          Mehrere Logos auf einmal wählen
          <input type="file" accept="image/*" multiple id="eulogo-bulk" aria-label="Mehrere Logos auswählen"
            onChange={(e) => { bulk(e.target.files); e.target.value = ""; }} />
        </label>
        <span className="lr-bulk-hint">oder Dateien hierher ziehen. Der Dateiname muss zum Verein passen, z. B. „Ajax Amsterdam.png“ oder „Ajax.png“.</span>
      </div>
      <div className="lr-bulk">
        <button type="button" className="lr-btn lr-btn-sm" id="eu-qual" onClick={qual}>Deutsche Plätze aus der Bundesliga-Tabelle setzen</button>
        <button type="button" className="lr-btn lr-btn-sm" id="eu-add"
          onClick={() => setRows((r) => [...r, { name: "", de: false, strength: 60, orig: "" }])}>+ Verein hinzufügen</button>
        <span className="lr-bulk-hint" style={rows.length === EURO_SIZE ? undefined : { color: "var(--accent)" }}>
          {rows.length} von {EURO_SIZE} Teilnehmern{rows.length === EURO_SIZE ? "" : " — für die Auslosung braucht es genau 36"}
        </span>
      </div>
      {hinweis && <p style={{ margin: "0 0 8px", fontSize: 12 }}>{hinweis}</p>}
      {fehler && <p style={{ margin: "0 0 8px", fontSize: 12 }}>{fehler}</p>}
      <div className="lr-team-head kader"><span>Verein</span><span>Logo</span><span>Stärke</span><span /></div>
      {rows.map((r, i) => (
        <div className="lr-team-row kader" key={i}>
          {r.de ? (
            <select className="lr-team-in" value={r.name} aria-label={`Deutscher Teilnehmer ${i + 1}`}
              onChange={(e) => setRow(i, { name: e.target.value })}>
              {!alleDeutschen.some((g) => g.teams.indexOf(r.name) >= 0) && <option value={r.name}>{r.name}</option>}
              {alleDeutschen.map((g) => (
                <optgroup key={g.id} label={g.name}>
                  {g.teams.map((n) => <option key={n} value={n}>{n}</option>)}
                </optgroup>
              ))}
            </select>
          ) : (
            <input className="lr-team-in" value={r.name} aria-label={`Verein ${i + 1}`} placeholder="Vereinsname"
              onChange={(e) => setRow(i, { name: e.target.value })} />
          )}
          <span className="lr-logo-cell">
            <label className="lr-logo-pick" title={logos[names[i]] ? "Logo ändern" : "Logo hinzufügen"}>
              {logos[names[i]] ? <img src={logos[names[i]]} alt={`Logo ${names[i]}`} /> : <span>+</span>}
              <input type="file" accept="image/*" id={`eulogo-${i}`} aria-label={`Logo für ${names[i] || "neuen Verein"} wählen`}
                onChange={(e) => { pick(names[i], e.target.files && e.target.files[0]); e.target.value = ""; }} />
            </label>
            {logos[names[i]] && (
              <button type="button" className="lr-logo-del" aria-label={`Logo von ${names[i]} entfernen`}
                onClick={() => onLogo(names[i], null)}>×</button>
            )}
          </span>
          {r.de
            ? <span className="lr-team-str" title="Stärke aus der Liga">{euroStrength(r, active)}</span>
            : <StrengthCell value={Number(r.strength) || 60} index={i} onSet={(k, v) => setRow(k, { strength: v })} />}
          {r.de
            ? <span className="lr-bulk-hint" style={{ textAlign: "center" }}>DE</span>
            : <button type="button" className="lr-btn lr-btn-sm" aria-label={`${names[i] || "Verein"} entfernen`}
                onClick={() => setRows((x) => x.filter((_, k) => k !== i))}>Entfernen</button>}
        </div>
      ))}
      {bad && <p style={{ margin: "8px 0 0", fontSize: 12 }}>Jeder Verein braucht einen eigenen, nicht leeren Namen.</p>}
      <div className="lr-modal-foot">
        <button className="lr-btn" onClick={onClose}>Abbrechen</button>
        <button className="lr-btn lr-btn-p" disabled={bad} onClick={speichern}>Übernehmen</button>
      </div>
    </Modal>
  );
}

/** Champions League, Europa League und Conference League. */
function EuropaTab({ data, setData, drawShare, surprise, selId, setSelId, ph, setPh, md, setMd, onTeams }) {
  const comp = EURO_BY_ID[selId];
  const euro = data.euro;
  const run = euro.runs[selId];
  const liste = euro.teams[selId];
  const [ask, setAsk] = useState(null);
  useEffect(() => { setAsk(null); }, [selId]);

  const table = useMemo(() => (run ? euroTable(run) : []), [run]);
  const rankOf = useMemo(() => { const m = {}; table.forEach((r) => { m[r.idx] = r.pos; }); return m; }, [table]);
  const phase = run ? Math.min(ph[selId] || 0, run.ko.length) : 0;
  const mdIdx = run ? Math.min(md[selId] || 0, run.fixtures.length - 1) : 0;
  const setPhase = (i) => setPh((p) => ({ ...p, [selId]: i }));
  const champ = euroChampion(run);
  const lastKo = run && run.ko.length ? run.ko[run.ko.length - 1] : null;

  const upd = (fn) => setData((d) => {
    const r = d.euro.runs[selId];
    return r ? { ...d, euro: { ...d.euro, runs: { ...d.euro.runs, [selId]: fn(r) } } } : d;
  });

  const startOk = euroListOk(liste);
  const start = () => {
    setData((d) => {
      const teams = d.euro.teams[selId].map((t) => ({ name: t.name.trim(), de: !!t.de, strength: euroStrength(t, d.active) }));
      const seed = Math.floor(Math.random() * 1e9);
      const neu = { label: d.active.bl1.label, seed, teams, fixtures: euroDraw(teams, seed), results: {}, ko: [], rank: null };
      return { ...d, euro: { ...d.euro, runs: { ...d.euro.runs, [selId]: neu } } };
    });
    setPhase(0);
    setMd((m) => ({ ...m, [selId]: 0 }));
  };

  /* ---- Ligaphase ---- */
  const setScore = (gi, side, raw) => {
    const v = raw.replace(/[^0-9]/g, "").slice(0, 2);
    upd((r) => {
      const key = `${mdIdx}:${gi}`;
      const e = { ...(r.results[key] || { h: "", a: "" }), [side]: v };
      const next = { ...r.results, [key]: e };
      if (e.h === "" && e.a === "") delete next[key];
      return { ...r, results: next, ko: [], rank: null };
    });
  };
  const bumpScore = (gi, side, delta) => {
    upd((r) => {
      const key = `${mdIdx}:${gi}`;
      const cur = r.results[key] || { h: "", a: "" };
      const now = cur[side] === "" ? 0 : Number(cur[side]);
      const other = side === "h" ? "a" : "h";
      const e = { ...cur, [side]: String(Math.max(0, Math.min(99, now + delta))), [other]: cur[other] === "" ? "0" : cur[other] };
      return { ...r, results: { ...r.results, [key]: e }, ko: [], rank: null };
    });
  };
  const simGame = (gi) => upd((r) => {
    const [h, a] = r.fixtures[mdIdx][gi];
    const [hg, ag] = simulateMatch(r.teams[h].strength, r.teams[a].strength, false, drawShare, surprise, 0, 0);
    return { ...r, results: { ...r.results, [`${mdIdx}:${gi}`]: { h: String(hg), a: String(ag) } }, ko: [], rank: null };
  });
  const simLeague = (which) => upd((r) => {
    const res = { ...r.results };
    const list = which === "all" ? r.fixtures.map((_, i) => i) : [mdIdx];
    list.forEach((i) => r.fixtures[i].forEach(([h, a], gi) => {
      if (which === "all" && parsedResult(r.results, i, gi)) return;
      const [hg, ag] = simulateMatch(r.teams[h].strength, r.teams[a].strength, false, drawShare, surprise, 0, 0);
      res[`${i}:${gi}`] = { h: String(hg), a: String(ag) };
    }));
    return { ...r, results: res, ko: [], rank: null };
  });
  const clearMd = () => upd((r) => {
    const res = { ...r.results };
    r.fixtures[mdIdx].forEach((_, gi) => delete res[`${mdIdx}:${gi}`]);
    return { ...r, results: res, ko: [], rank: null };
  });
  const setStr = (idx, raw) => {
    const v = clampStrength(raw);
    const num = v === "" ? "" : Number(v);
    upd((r) => ({ ...r, teams: r.teams.map((t, i) => (i === idx ? { ...t, strength: num } : t)) }));
  };

  /* ---- K.-o.-Runden ---- */
  const editTie = (ri, ti, fn) => upd((r) => ({
    ...r,
    ko: r.ko.slice(0, ri + 1).map((rd, k) => (k === ri ? { ...rd, ties: rd.ties.map((t, j) => (j === ti ? fn(t) : t)) } : rd)),
  }));
  const setLeg = (ri, ti, leg, side, raw) => {
    const v = raw.replace(/[^0-9]/g, "").slice(0, 2);
    editTie(ri, ti, (t) => ({ ...t, [leg]: { ...t[leg], [side]: v }, pen: null }));
  };
  const bumpLeg = (ri, ti, leg, side, delta) => editTie(ri, ti, (t) => {
    const cur = t[leg];
    const now = cur[side] === "" ? 0 : Number(cur[side]);
    const other = side === "h" ? "a" : "h";
    return { ...t, pen: null, [leg]: { ...cur, [side]: String(Math.max(0, Math.min(99, now + delta))), [other]: cur[other] === "" ? "0" : cur[other] } };
  });
  const setPen = (ri, ti, side) => editTie(ri, ti, (t) => ({ ...t, pen: t.pen === side ? null : side }));
  const simTieObj = (r, rd, t) => {
    const A = r.teams[t.h];
    const B = r.teams[t.a];
    const twoLeg = rd.name !== "Finale";
    const [h1, a1] = simulateMatch(A.strength, B.strength, !twoLeg, drawShare, surprise, 0, 0);
    const nt = { ...t, l1: { h: String(h1), a: String(a1) }, pen: null };
    if (twoLeg) {
      const [h2, a2] = simulateMatch(B.strength, A.strength, false, drawShare, surprise, 0, 0);
      nt.l2 = { h: String(h2), a: String(a2) };
    }
    const g = tieAgg(nt, twoLeg);
    if (g[0] === g[1]) nt.pen = shootout(A.strength, B.strength);
    return nt;
  };
  const simTie = (ri, ti) => upd((r) => ({
    ...r,
    ko: r.ko.slice(0, ri + 1).map((rd, k) => (k === ri ? { ...rd, ties: rd.ties.map((t, j) => (j === ti ? simTieObj(r, rd, t) : t)) } : rd)),
  }));
  const simRound = (ri) => upd((r) => ({
    ...r,
    ko: r.ko.slice(0, ri + 1).map((rd, k) => (k === ri
      ? { ...rd, ties: rd.ties.map((t) => (tieWinner(t, rd.name !== "Finale") ? t : simTieObj(r, rd, t))) }
      : rd)),
  }));
  const koComplete = (rd) => rd.ties.every((t) => tieWinner(t, rd.name !== "Finale"));
  const leagueFull = run ? run.fixtures.every((round, i) => round.every((_, gi) => parsedResult(run.results, i, gi))) : false;
  const canDraw = !!run && (run.ko.length === 0 ? leagueFull : lastKo.name !== "Finale" && koComplete(lastKo));
  const drawNext = () => {
    upd((r) => {
      const rnd = mulberry32((r.seed + 17 + r.ko.length * 31) >>> 0);
      if (!r.ko.length) {
        const tb = euroTable(r);
        const rank = {};
        tb.forEach((x) => { rank[x.idx] = x.pos; });
        return { ...r, rank, ko: [{ name: EURO_KO[0], ties: euroPlayoffTies(tb, rnd) }] };
      }
      const last = r.ko[r.ko.length - 1];
      if (last.name === "Finale" || !last.ties.every((t) => tieWinner(t, true))) return r;
      const ties = r.ko.length === 1
        ? euroR16Ties(euroTable(r), last.ties.map((t) => (tieWinner(t, true) === "h" ? t.h : t.a)))
        : euroNextTies(last, r.rank);
      return { ...r, ko: [...r.ko, { name: EURO_KO[r.ko.length], ties }] };
    });
    setPhase(run.ko.length + 1);
  };

  const closeRun = () => {
    setData((d) => {
      const r = d.euro.runs[selId];
      if (!r || !euroChampion(r)) return d;
      return { ...d, history: [euroArchive(selId, r), ...d.history], euro: { ...d.euro, runs: { ...d.euro.runs, [selId]: null } } };
    });
    setAsk(null);
    setPhase(0);
  };
  const resetRun = () => {
    setData((d) => ({ ...d, euro: { ...d.euro, runs: { ...d.euro.runs, [selId]: null } } }));
    setAsk(null);
    setPhase(0);
  };

  const filled = run ? run.fixtures.reduce((a, round, i) => a + round.filter((_, gi) => parsedResult(run.results, i, gi)).length, 0) : 0;
  const total = run ? run.fixtures.reduce((a, round) => a + round.length, 0) : 0;

  const optionsBar = (
    <>
      <label className="lr-prog" style={{ display: "flex", alignItems: "center", gap: 5 }}>
        Remis
        <select className="lr-jump" value={data.drawBias || 0} aria-label="Neigung zu Unentschieden"
          onChange={(e) => setData((d) => ({ ...d, drawBias: Number(e.target.value) }))}>
          {DRAW_LABEL.map((l, i) => <option key={l} value={i}>{l}</option>)}
        </select>
      </label>
      <label className="lr-prog" style={{ display: "flex", alignItems: "center", gap: 5 }}>
        Überraschungen
        <select className="lr-jump" value={surprise} aria-label="Häufigkeit von Überraschungen"
          onChange={(e) => setData((d) => ({ ...d, surpriseBias: Number(e.target.value) }))}>
          {FORM_LABEL.map((l, i) => <option key={l} value={i}>{l}</option>)}
        </select>
      </label>
    </>
  );

  /** Eine Partie eines K.-o.-Duells in der Optik der Ligaspiele. */
  const legRow = (ri, ti, t, leg, hIdx, aIdx, label, winnerIdx) => {
    const cls = (x) => (winnerIdx === x ? "lr-win" : winnerIdx != null ? "lr-lose" : "");
    const hSide = leg === "l1" ? "h" : "h";
    return (
      <React.Fragment>
        <div className="lr-slot">{label}</div>
        <div className="lr-game">
          <div className="lr-game-h">
            <div className={`lr-name ${cls(hIdx)}`}><Logo name={run.teams[hIdx].name} />{run.teams[hIdx].name}</div>
            <TeamMeta rank={rankOf[hIdx]} strength={run.teams[hIdx].strength} name={run.teams[hIdx].name} onStrength={(v) => setStr(hIdx, v)} />
          </div>
          <div className="lr-mid">
            <div className="lr-score">
              <Stepper value={t[leg].h} team={run.teams[hIdx].name} onBump={(d) => bumpLeg(ri, ti, leg, "h", d)} />
              <ScoreBox value={t[leg].h} team={run.teams[hIdx].name} onType={(v) => setLeg(ri, ti, leg, hSide, v)} />
              <span className="lr-colon">:</span>
              <ScoreBox value={t[leg].a} team={run.teams[aIdx].name} onType={(v) => setLeg(ri, ti, leg, "a", v)} />
              <Stepper value={t[leg].a} team={run.teams[aIdx].name} onBump={(d) => bumpLeg(ri, ti, leg, "a", d)} />
            </div>
          </div>
          <div className="lr-game-a">
            <div className={`lr-name ${cls(aIdx)}`}><Logo name={run.teams[aIdx].name} />{run.teams[aIdx].name}</div>
            <TeamMeta rank={rankOf[aIdx]} strength={run.teams[aIdx].strength} name={run.teams[aIdx].name} onStrength={(v) => setStr(aIdx, v)} />
          </div>
        </div>
      </React.Fragment>
    );
  };

  return (
    <div className="lr-wrap" style={accentVars(comp.accent)}>
      <div className="lr-rounds" style={{ paddingTop: 14 }}>
        {EURO_COMPS.map((c) => (
          <button key={c.id} className="lr-round-btn" data-on={c.id === selId ? "1" : "0"} id={`eu-${c.id}`}
            style={c.id === selId ? accentVars(c.accent) : undefined} onClick={() => setSelId(c.id)}>
            {c.name}{euro.runs[c.id] ? "" : " · nicht gestartet"}
          </button>
        ))}
      </div>

      <div className="lr-bar">
        <div className="lr-season">
          <span className="disp" style={{ fontSize: 20 }}>{comp.name}</span>
          {run ? <span className="lr-tag">{run.label}</span> : null}
          {run ? <span className="lr-tag">{filled} von {total} Spielen</span> : null}
        </div>
        <div className="lr-spacer" />
        <button className="lr-btn lr-btn-sm" id="eu-teams" onClick={onTeams}>Teilnehmer &amp; Logos</button>
        {!run && (
          <button className="lr-btn lr-btn-sm lr-btn-p" id="eu-start" disabled={!startOk} onClick={start}>Ligaphase auslosen</button>
        )}
        {run && (
          <>
            {optionsBar}
            <button className="lr-btn lr-btn-sm" id="eu-next" disabled={!canDraw} onClick={drawNext}>
              {run.ko.length === 0 ? "Playoffs auslosen" : "Nächste Runde auslosen"}
            </button>
            {ask === "close" ? (
              <button className="lr-btn lr-btn-sm lr-btn-p" id="eu-close-ok" onClick={closeRun}>Ja, in die Historie</button>
            ) : (
              <button className="lr-btn lr-btn-sm lr-btn-p" id="eu-close" disabled={!champ} onClick={() => setAsk("close")}>Wettbewerb abschließen</button>
            )}
            {ask === "reset" ? (
              <button className="lr-btn lr-btn-sm" id="eu-reset-ok" onClick={resetRun}>Ja, alles verwerfen</button>
            ) : (
              <button className="lr-btn lr-btn-sm" id="eu-reset" onClick={() => setAsk("reset")}>Neu starten</button>
            )}
            {ask && <button className="lr-btn lr-btn-sm" onClick={() => setAsk(null)}>Abbrechen</button>}
          </>
        )}
      </div>

      {!run && (
        <>
          <p className="lr-empty">
            36 Mannschaften spielen acht Partien im Schweizer Modell: vier Töpfe nach Stärke, jeder Klub trifft auf
            zwei Gegner aus jedem Topf, je einmal zu Hause und auswärts. Die ersten Acht ziehen direkt ins Achtelfinale
            ein, die Plätze 9 bis 24 spielen Playoffs, danach folgen Achtelfinale, Viertelfinale und Halbfinale mit
            Hin- und Rückspiel und ein Finale auf neutralem Platz. Steht es nach den Rückspielen gleich, entscheidet
            das Elfmeterschießen. Die deutschen Plätze ({EURO_PLACES[selId]}) kommen automatisch aus der Liga.
            Starte den Wettbewerb mit „Ligaphase auslosen“, Vereine und Logos änderst du unter „Teilnehmer &amp; Logos“.
          </p>
          {!startOk && <p className="lr-hint" style={{ color: "var(--accent)" }}>Für die Auslosung braucht es genau 36 verschiedene Teilnehmer, aktuell {liste.length}.</p>}
          <ol className="eu-list">
            {liste.map((t, i) => (
              <li key={i}>
                <span className="eu-n">{i + 1}</span>
                <span className="eu-nm"><Logo name={t.name} />{t.name}</span>
                {t.de ? <span className="eu-de">DE</span> : null}
                <span className="eu-s">{euroStrength(t, data.active)}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      {run && (
        <>
          <div className="lr-rounds">
            <button className="lr-round-btn" data-on={phase === 0 ? "1" : "0"} data-done={leagueFull ? "1" : "0"} onClick={() => setPhase(0)}>
              Ligaphase · {filled}/{total}
            </button>
            {EURO_KO.map((name, i) => (
              <button key={name} className="lr-round-btn" data-on={phase === i + 1 ? "1" : "0"}
                data-done={run.ko[i] && koComplete(run.ko[i]) ? "1" : "0"} disabled={!run.ko[i]} onClick={() => setPhase(i + 1)}>
                {name}{run.ko[i] ? ` · ${run.ko[i].ties.filter((t) => tieWinner(t, name !== "Finale")).length}/${run.ko[i].ties.length}` : ""}
              </button>
            ))}
          </div>

          {champ && (
            <div className="lr-champ-box">
              <div className="lr-tag">Sieger {comp.name} {run.label}</div>
              <div className="disp"><Logo name={champ.name} />{champ.name}</div>
            </div>
          )}

          {phase === 0 && (
            <>
              <div className="lr-md">
                <button className="lr-nav" onClick={() => setMd((m) => ({ ...m, [selId]: Math.max(0, mdIdx - 1) }))}
                  disabled={mdIdx === 0} aria-label="Vorheriger Spieltag">‹</button>
                <button className="lr-nav" onClick={() => setMd((m) => ({ ...m, [selId]: Math.min(run.fixtures.length - 1, mdIdx + 1) }))}
                  disabled={mdIdx >= run.fixtures.length - 1} aria-label="Nächster Spieltag">›</button>
                <div className="lr-md-num">{mdIdx + 1}. Spieltag <small>von {run.fixtures.length}</small></div>
                <select className="lr-jump" value={mdIdx} aria-label="Spieltag wählen"
                  onChange={(e) => setMd((m) => ({ ...m, [selId]: Number(e.target.value) }))}>
                  {run.fixtures.map((_, i) => <option key={i} value={i}>{i + 1}. Spieltag</option>)}
                </select>
                <div className="lr-spacer" />
                <button className="lr-btn lr-btn-sm" id="eu-sim-md" onClick={() => simLeague("one")}>Spieltag simulieren</button>
                <button className="lr-btn lr-btn-sm" id="eu-sim-all" onClick={() => simLeague("all")}>Rest der Ligaphase</button>
                <button className="lr-btn lr-btn-sm" onClick={clearMd}>Leeren</button>
              </div>
              <div className="lr-grid">
                <section onKeyDown={enterToNext}>
                  <h2 className="lr-sec-h">Partien</h2>
                  <p className="lr-hint">Platz und Stärke stehen unter den Namen, die Stärke lässt sich direkt ändern. Ergebnisse der Ligaphase zu ändern verwirft die ausgeloste K.-o.-Phase.</p>
                  {run.fixtures[mdIdx].map(([h, a], gi) => {
                    const r = run.results[`${mdIdx}:${gi}`] || { h: "", a: "" };
                    const done = parsedResult(run.results, mdIdx, gi);
                    const hw = done && done[0] > done[1];
                    const aw = done && done[1] > done[0];
                    return (
                      <div className="lr-game" key={gi}>
                        <div className="lr-game-h">
                          <div className={`lr-name ${hw ? "lr-win" : aw ? "lr-lose" : ""}`}><Logo name={run.teams[h].name} />{run.teams[h].name}</div>
                          <TeamMeta rank={rankOf[h]} strength={run.teams[h].strength} name={run.teams[h].name} onStrength={(v) => setStr(h, v)} />
                        </div>
                        <div className="lr-mid">
                          <div className="lr-score">
                            <Stepper value={r.h} team={run.teams[h].name} onBump={(d) => bumpScore(gi, "h", d)} />
                            <ScoreBox value={r.h} team={run.teams[h].name} onType={(v) => setScore(gi, "h", v)} />
                            <span className="lr-colon">:</span>
                            <ScoreBox value={r.a} team={run.teams[a].name} onType={(v) => setScore(gi, "a", v)} />
                            <Stepper value={r.a} team={run.teams[a].name} onBump={(d) => bumpScore(gi, "a", d)} />
                          </div>
                          {done && sensation(done[0], done[1], run.teams[h].strength, run.teams[a].strength) ? <span className="lr-sens">Sensation</span> : null}
                          <button className="lr-sim" type="button" onClick={() => simGame(gi)}>Spiel simulieren</button>
                        </div>
                        <div className="lr-game-a">
                          <div className={`lr-name ${aw ? "lr-win" : hw ? "lr-lose" : ""}`}><Logo name={run.teams[a].name} />{run.teams[a].name}</div>
                          <TeamMeta rank={rankOf[a]} strength={run.teams[a].strength} name={run.teams[a].name} onStrength={(v) => setStr(a, v)} />
                        </div>
                      </div>
                    );
                  })}
                </section>
                <section>
                  <h2 className="lr-sec-h">Tabelle der Ligaphase</h2>
                  <Table rows={table} leagueId="eu" strengths={run.teams.map((t) => t.strength)} />
                </section>
              </div>
            </>
          )}

          {phase >= 1 && run.ko[phase - 1] && (() => {
            const ri = phase - 1;
            const rd = run.ko[ri];
            const twoLeg = rd.name !== "Finale";
            return (
              <section onKeyDown={enterToNext}>
                <div className="lr-md" style={{ marginBottom: 6 }}>
                  <h2 className="lr-sec-h" style={{ border: 0, margin: 0, padding: 0 }}>{rd.name}</h2>
                  <div className="lr-spacer" />
                  <button className="lr-btn lr-btn-sm" id="eu-sim-round" onClick={() => simRound(ri)}>Runde simulieren</button>
                </div>
                <p className="lr-hint">
                  {twoLeg
                    ? "Hin- und Rückspiel, der besser platzierte Klub hat das Rückspiel zu Hause. Steht es nach beiden Spielen gleich, wählst du den Sieger im Elfmeterschießen."
                    : "Das Finale wird auf neutralem Platz in einem Spiel entschieden, bei Gleichstand per Elfmeterschießen."}
                  {" "}Erst wenn alle Duelle entschieden sind, lässt sich die nächste Runde auslosen.
                </p>
                <div className="eu-ties">
                  {rd.ties.map((t, ti) => {
                    const w = tieWinner(t, twoLeg);
                    const winnerIdx = w ? (w === "h" ? t.h : t.a) : null;
                    const agg = tieAgg(t, twoLeg);
                    const level = agg && agg[0] === agg[1];
                    return (
                      <div className="eu-tie" key={ti}>
                        {legRow(ri, ti, t, "l1", t.h, t.a, twoLeg ? "Hinspiel" : "Finale · neutraler Platz", winnerIdx)}
                        {twoLeg && legRow(ri, ti, t, "l2", t.a, t.h, "Rückspiel", winnerIdx)}
                        <div className="eu-agg">
                          {twoLeg ? (
                            <span>Gesamt <b>{agg ? `${agg[0]}:${agg[1]}` : "–:–"}</b> ({run.teams[t.h].name} : {run.teams[t.a].name})</span>
                          ) : null}
                          {w ? <span> · weiter: <b>{run.teams[winnerIdx].name}</b>{agg && agg[0] === agg[1] ? " n. E." : ""}</span> : null}
                          <button className="lr-sim" type="button" onClick={() => simTie(ri, ti)}>Duell simulieren</button>
                        </div>
                        {level && (
                          <div className="lr-pen">
                            <span className="lr-tag" style={{ alignSelf: "center" }}>Sieger n. E.:</span>
                            <button data-on={t.pen === "h" ? "1" : "0"} onClick={() => setPen(ri, ti, "h")}>{run.teams[t.h].name}</button>
                            <button data-on={t.pen === "a" ? "1" : "0"} onClick={() => setPen(ri, ti, "a")}>{run.teams[t.a].name}</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })()}
        </>
      )}
    </div>
  );
}


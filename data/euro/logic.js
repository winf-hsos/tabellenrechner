/* ================================================================== */
/*  Europapokal: Champions League, Europa League, Conference League   */
/* ================================================================== */

const EURO_COMPS = [
  { id: "cl", name: "Champions League", short: "CL", accent: "#4C8BF5" },
  { id: "el", name: "Europa League", short: "EL", accent: "#F0952A" },
  { id: "ecl", name: "Conference League", short: "ECL", accent: "#3FCB8E" },
];
const EURO_BY_ID = Object.fromEntries(EURO_COMPS.map((c) => [c.id, c]));
const EURO_SIZE = 36;
const EURO_KO = ["Playoffs", "Achtelfinale", "Viertelfinale", "Halbfinale", "Finale"];

/** Deutsche Teilnehmer 2026/27 (Stand der Auslosung). */
const EURO_START_DE = {
  cl: ["VfB Stuttgart", "FC Bayern München", "Borussia Dortmund", "RB Leipzig"],
  el: ["Bayer 04 Leverkusen", "TSG Hoffenheim"],
  ecl: ["SC Freiburg"],
};

/** Übrige Teilnehmer der Ligaphase 2026/27 mit geschätzter Stärke auf der Skala der Bundesliga. */
const EURO_FOREIGN = {
  cl: [
    ["Paris Saint-Germain", 90], ["FC Barcelona", 90], ["Aston Villa", 82], ["FC Liverpool", 88],
    ["Sporting Lissabon", 80], ["FC Arsenal", 90], ["Real Madrid", 92], ["Betis Sevilla", 77],
    ["Schachtar Donezk", 71], ["Como 1907", 69], ["Manchester United", 82], ["FC Villarreal", 77],
    ["Atlético Madrid", 85], ["FC Brügge", 73], ["Manchester City", 90], ["RC Lens", 71],
    ["AEK Athen", 67], ["FC Sabah", 55], ["Feyenoord Rotterdam", 73], ["Bodø/Glimt", 66],
    ["AS Rom", 78], ["PSV Eindhoven", 76], ["Viking Stavanger", 57], ["Fenerbahçe", 74],
    ["Inter Mailand", 87], ["FC Porto", 77], ["Slavia Prag", 67], ["SSC Neapel", 82],
    ["LASK", 60], ["OSC Lille", 72], ["Galatasaray", 75], ["Slovan Bratislava", 54],
  ],
  el: [
    ["Juventus Turin", 84], ["Crystal Palace", 75], ["Sparta Prag", 66], ["Beşiktaş", 72],
    ["Royale Union Saint-Gilloise", 66], ["Ferencváros", 64], ["Benfica Lissabon", 80], ["OFI Kreta", 54],
    ["AFC Bournemouth", 74], ["Olympique Lyon", 76], ["Torreense", 46], ["Olympiakos Piräus", 70],
    ["Red Bull Salzburg", 69], ["Omonia Nikosia", 55], ["AFC Sunderland", 67], ["Dinamo Zagreb", 64],
    ["Hapoel Be'er Sheva", 56], ["Stade Rennes", 72], ["Sturm Graz", 62], ["Jagiellonia Białystok", 56],
    ["RSC Anderlecht", 69], ["Lillestrøm SK", 50], ["Real Sociedad", 76], ["AZ Alkmaar", 70],
    ["Celta Vigo", 72], ["Levski Sofia", 50], ["Celtic Glasgow", 69], ["NK Celje", 50],
    ["AC Mailand", 82], ["Olympique Marseille", 77], ["Ararat-Armenia", 44], ["Viktoria Pilsen", 62],
    ["Lech Posen", 60], ["NEC Nijmegen", 62],
  ],
  ecl: [
    ["AGF Aarhus", 58], ["Ajax Amsterdam", 76], ["Atalanta Bergamo", 82], ["Borac Banja Luka", 47],
    ["SC Braga", 72], ["SK Brann", 60], ["Brighton & Hove Albion", 76], ["FC Kopenhagen", 66],
    ["ZSKA Sofia", 50], ["KF Egnatia", 44], ["KAA Gent", 62], ["FC Getafe", 68],
    ["Hajduk Split", 60], ["Heart of Midlothian", 54], ["Iberia 1999", 40], ["Inter Club d'Escaldes", 35],
    ["FK Jablonec", 52], ["Kairat Almaty", 54], ["Kauno Žalgiris", 40], ["KuPS Kuopio", 46],
    ["Lincoln Red Imps", 38], ["FC Lugano", 56], ["FC Midtjylland", 62], ["Mjällby AIF", 52],
    ["AS Monaco", 76], ["FC Nordsjælland", 55], ["Pafos FC", 60], ["Panathinaikos", 68],
    ["Roter Stern Belgrad", 64], ["Riga FC", 44], ["Sint-Truidense VV", 52], ["FC Thun", 52],
    ["Trabzonspor", 64], ["FC Twente", 64], ["Universitatea Craiova", 56],
  ],
};

function euroStartTeams(id) {
  return [
    ...EURO_START_DE[id].map((name) => ({ name, de: true, strength: 70 })),
    ...EURO_FOREIGN[id].map(([name, strength]) => ({ name, de: false, strength })),
  ];
}

function freshEuro() {
  return {
    teams: Object.fromEntries(EURO_COMPS.map((c) => [c.id, euroStartTeams(c.id)])),
    runs: { cl: null, el: null, ecl: null },
  };
}

function normEuro(e) {
  const base = freshEuro();
  if (!e || typeof e !== "object") return base;
  const teams = {};
  const runs = {};
  EURO_COMPS.forEach((c) => {
    const l = e.teams && Array.isArray(e.teams[c.id]) ? e.teams[c.id] : null;
    teams[c.id] = l && l.length
      ? l.filter((t) => t && t.name).map((t) => ({ name: String(t.name), de: !!t.de, strength: Number(t.strength) || 60 }))
      : base.teams[c.id];
    const r = e.runs && e.runs[c.id];
    runs[c.id] = r && Array.isArray(r.fixtures) && Array.isArray(r.teams) ? { ...r, ko: Array.isArray(r.ko) ? r.ko : [] } : null;
  });
  return { teams, runs };
}

/** Stärke eines Teilnehmers: deutsche Klubs zählen mit ihrer aktuellen Ligastärke. */
function euroStrength(t, active) {
  if (t.de && active) {
    for (const id of LEAGUE_IDS) {
      const s = active[id];
      const i = s ? s.teams.indexOf(t.name) : -1;
      if (i >= 0) return Number(s.strengths[i]) || 1;
    }
  }
  return Number(t.strength) || 1;
}

/**
 * Deutsche Startplätze aus der Abschlusstabelle: Plätze 1–4 Champions League, der Pokalsieger und
 * der beste noch nicht qualifizierte Klub Europa League, der nächste Conference League.
 */
function euroQualifiers(order, cupName) {
  const cl = order.slice(0, 4);
  let rest = order.slice(4);
  const el = [];
  if (cupName && cl.indexOf(cupName) < 0) { el.push(cupName); rest = rest.filter((n) => n !== cupName); }
  while (el.length < 2 && rest.length) el.push(rest.shift());
  return { cl, el, ecl: rest.slice(0, 1) };
}

function euroApplyQualifiers(teams, q) {
  const out = {};
  EURO_COMPS.forEach((c) => {
    const fremd = (teams[c.id] || []).filter((t) => !t.de);
    out[c.id] = [...(q[c.id] || []).map((name) => ({ name, de: true, strength: 70 })), ...fremd];
  });
  return out;
}

/** Teilnehmerliste prüfen: genau 36 verschiedene, nicht leere Namen. */
function euroListOk(list) {
  const names = list.map((t) => String(t.name).trim());
  return list.length === EURO_SIZE && names.every(Boolean) && new Set(names).size === names.length;
}

/**
 * Kanten (Partien) auf K Spieltage verteilen, so dass jeder Klub pro Spieltag genau einmal spielt.
 * Zufälliges Färben mit Kempe-Ketten; liefert null, wenn es nicht gelingt.
 */
function colorEdges(n, edges, K, rnd) {
  for (let attempt = 0; attempt < 300; attempt++) {
    const at = Array.from({ length: n }, () => new Array(K).fill(-1));
    const col = new Array(edges.length).fill(-1);
    const setC = (e, c) => { const [u, v] = edges[e]; col[e] = c; at[u][c] = e; at[v][c] = e; };
    const unset = (e) => { const [u, v] = edges[e]; const c = col[e]; at[u][c] = -1; at[v][c] = -1; col[e] = -1; };
    const frei = (x) => { const r = []; for (let c = 0; c < K; c++) if (at[x][c] < 0) r.push(c); return r; };
    let ok = true;
    const order = shuffle(edges.map((_, i) => i), rnd);
    for (const e of order) {
      const [u, v] = edges[e];
      const fu = frei(u);
      const fv = frei(v);
      const common = fu.filter((c) => fv.indexOf(c) >= 0);
      if (common.length) { setC(e, common[Math.floor(rnd() * common.length)]); continue; }
      let done = false;
      for (let i = 0; i < fu.length && !done; i++) {
        for (let j = 0; j < fv.length && !done; j++) {
          const a = fu[i];
          const b = fv[j];
          const path = [];
          let x = v;
          let c = a;
          let trifft = false;
          while (at[x][c] >= 0) {
            const pe = at[x][c];
            path.push(pe);
            const [p, q] = edges[pe];
            x = p === x ? q : p;
            if (x === u) { trifft = true; break; }
            c = c === a ? b : a;
          }
          if (trifft) continue;
          const alt = path.map((pe) => col[pe]);
          path.forEach((pe) => unset(pe));
          path.forEach((pe, k) => setC(pe, alt[k] === a ? b : a));
          setC(e, a);
          done = true;
        }
      }
      if (!done) { ok = false; break; }
    }
    if (ok) return col;
  }
  return null;
}

/**
 * Auslosung der Ligaphase im Schweizer Modell: vier Töpfe nach Stärke, jeder Klub trifft auf zwei Gegner
 * aus jedem Topf (einmal Heim, einmal Auswärts) und spielt acht Spiele. Deutsche Klubs treffen
 * möglichst nicht aufeinander.
 */
function euroDraw(teams, seed) {
  const rnd = mulberry32(seed >>> 0);
  const order = teams.map((_, i) => i).sort((a, b) => teams[b].strength - teams[a].strength || a - b);
  const pots = [0, 1, 2, 3].map((k) => order.slice(k * 9, k * 9 + 9));
  let best = null;
  let bestScore = Infinity;
  for (let tries = 0; tries < 400 && bestScore > 0; tries++) {
    const P = pots.map((p) => shuffle(p, rnd));
    const games = [];
    for (let a = 0; a < 4; a++) {
      for (let b = a; b < 4; b++) {
        if (a === b) {
          for (let i = 0; i < 9; i++) games.push([P[a][i], P[a][(i + 1) % 9]]);
          continue;
        }
        const s = Math.floor(rnd() * 9);
        const t = (s + 1 + Math.floor(rnd() * 8)) % 9;
        for (let i = 0; i < 9; i++) {
          games.push([P[a][i], P[b][(i + s) % 9]]);
          games.push([P[b][(i + t) % 9], P[a][i]]);
        }
      }
    }
    const score = games.filter(([h, a]) => teams[h].de && teams[a].de).length;
    if (score < bestScore) { best = games; bestScore = score; }
  }
  const col = colorEdges(teams.length, best, 8, rnd);
  const fixtures = Array.from({ length: 8 }, () => []);
  if (col) {
    best.forEach((g, i) => fixtures[col[i]].push(g));
  } else {
    shuffle(best, rnd).forEach((g, i) => fixtures[Math.floor(i / 18)].push(g));
  }
  return fixtures.map((md) => shuffle(md, rnd));
}

function euroTable(run) {
  return computeTable(run.teams.map((t) => t.name), run.fixtures, run.results);
}

const numOrNull = (v) => (v === "" || v == null || !Number.isFinite(Number(v)) ? null : Number(v));

/** Gesamtergebnis eines K.-o.-Duells aus Sicht von (tie.h, tie.a); null, solange Ergebnisse fehlen. */
function tieAgg(tie, two) {
  const a1 = numOrNull(tie.l1.h);
  const b1 = numOrNull(tie.l1.a);
  if (a1 == null || b1 == null) return null;
  if (!two) return [a1, b1];
  const a2 = numOrNull(tie.l2.h);
  const b2 = numOrNull(tie.l2.a);
  if (a2 == null || b2 == null) return null;
  return [a1 + b2, b1 + a2];
}

/** "h" = tie.h kommt weiter, "a" = tie.a, null = offen. */
function tieWinner(tie, two) {
  const g = tieAgg(tie, two);
  if (!g) return null;
  if (g[0] > g[1]) return "h";
  if (g[1] > g[0]) return "a";
  return tie.pen === "h" || tie.pen === "a" ? tie.pen : null;
}

const newTie = (h, a) => ({ h, a, l1: { h: "", a: "" }, l2: { h: "", a: "" }, pen: null });

/** Playoffs: Gesetzte (Plätze 9–16) gegen Ungesetzte (17–24), Gesetzte haben das Rückspiel zu Hause. */
function euroPlayoffTies(table, rnd) {
  const at = (pos) => table[pos - 1].idx;
  const paare = [[[9, 10], [23, 24]], [[11, 12], [21, 22]], [[13, 14], [19, 20]], [[15, 16], [17, 18]]];
  const ties = [];
  paare.forEach(([s, u]) => {
    const w = rnd() < 0.5 ? u : [u[1], u[0]];
    ties.push(newTie(at(w[0]), at(s[0])));
    ties.push(newTie(at(w[1]), at(s[1])));
  });
  return ties;
}

/** Achtelfinale: Platz 1–8 gegen die Playoff-Sieger; die Reihenfolge legt den Turnierbaum fest. */
function euroR16Ties(table, playoffWinners) {
  const top = (pos) => table[pos - 1].idx;
  return [1, 8, 4, 5, 2, 7, 3, 6].map((s) => newTie(playoffWinners[8 - s], top(s)));
}

/** Nächste Runde: benachbarte Sieger spielen gegeneinander, der besser Platzierte hat das Rückspiel zu Hause. */
function euroNextTies(prev, rank) {
  const w = prev.ties.map((t) => (tieWinner(t, true) === "h" ? t.h : t.a));
  const out = [];
  for (let i = 0; i + 1 < w.length; i += 2) {
    const x = w[i];
    const y = w[i + 1];
    out.push(rank[x] > rank[y] ? newTie(x, y) : newTie(y, x));
  }
  return out;
}

function euroChampion(run) {
  if (!run || !run.ko.length) return null;
  const last = run.ko[run.ko.length - 1];
  if (last.name !== "Finale" || !last.ties[0]) return null;
  const w = tieWinner(last.ties[0], false);
  if (!w) return null;
  return run.teams[w === "h" ? last.ties[0].h : last.ties[0].a];
}

function euroArchive(compId, run) {
  const champ = euroChampion(run);
  const names = run.teams.map((t) => t.name);
  return {
    id: `${compId}-${run.label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: "euro", leagueId: compId, leagueName: EURO_BY_ID[compId].name,
    label: run.label, closedAt: new Date().toISOString(),
    winner: champ ? champ.name : "—",
    table: euroTable(run).map((r) => ({
      pos: r.pos, name: r.name, sp: r.sp, s: r.s, u: r.u, n: r.n, t: r.t, gt: r.gt, diff: r.diff, pkt: r.pkt,
    })),
    rounds: run.ko.map((rd) => ({
      name: rd.name,
      games: rd.ties.map((t) => {
        const g = tieAgg(t, rd.name !== "Finale") || ["", ""];
        return { h: names[t.h], a: names[t.a], hg: g[0], ag: g[1], pen: t.pen };
      }),
    })),
  };
}


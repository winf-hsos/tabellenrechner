import React, { useState, useEffect, useMemo, useRef, useCallback, useContext, createContext } from "react";

/* ================================================================== */
/*  Ligen                                                             */
/* ================================================================== */

const LEAGUES = [
  {
    id: "bl1",
    name: "Bundesliga",
    accent: "#E4514A",
    range: [93, 66],
    teams: [
      "FC Bayern München", "Bayer 04 Leverkusen", "Borussia Dortmund", "RB Leipzig",
      "Eintracht Frankfurt", "VfB Stuttgart", "SC Freiburg", "Borussia Mönchengladbach",
      "1. FC Union Berlin", "Werder Bremen", "TSG Hoffenheim", "FC Augsburg",
      "1. FSV Mainz 05", "1. FC Köln", "Hamburger SV", "FC Schalke 04",
      "SV Elversberg", "SC Paderborn 07",
    ],
  },
  {
    id: "bl2",
    name: "2. Bundesliga",
    accent: "#5C93F0",
    range: [63, 46],
    teams: [
      "Hannover 96", "1. FC Kaiserslautern", "Hertha BSC", "1. FC Nürnberg",
      "VfL Bochum", "Karlsruher SC", "Dynamo Dresden", "Holstein Kiel",
      "Arminia Bielefeld", "1. FC Magdeburg", "Eintracht Braunschweig", "SV Darmstadt 98",
      "SpVgg Greuther Fürth", "VfL Wolfsburg", "1. FC Heidenheim", "FC St. Pauli",
      "VfL Osnabrück", "FC Energie Cottbus",
    ],
  },
  {
    id: "bl3",
    name: "3. Liga",
    accent: "#E0A03C",
    range: [44, 28],
    teams: [
      "MSV Duisburg", "Hansa Rostock", "SC Verl", "Alemannia Aachen",
      "SV Wehen Wiesbaden", "SV Waldhof Mannheim", "FC Viktoria Köln", "FC Ingolstadt 04",
      "SSV Jahn Regensburg", "VfB Stuttgart II", "1. FC Saarbrücken", "TSG Hoffenheim II",
      "TSV Havelse", "SC Preußen Münster", "Fortuna Düsseldorf", "Rot-Weiss Essen",
      "SV Meppen", "SG Sonnenhof Großaspach", "SC Fortuna Köln", "Würzburger Kickers",
    ],
  },
  {
    id: "bl4",
    name: "4. Liga",
    accent: "#9E7BE0",
    range: [32, 19],
    // Nach Stärke geordnet: der erste ist der Favorit.
    teams: [
      "Erzgebirge Aue", "VfB Oldenburg", "Rot-Weiß Oberhausen", "Hallescher FC",
      "Chemnitzer FC", "VfB Lübeck", "Kickers Offenbach", "FC Carl Zeiss Jena",
      "SpVgg Unterhaching", "1. FC Schweinfurt 05", "FC Rot-Weiß Erfurt", "Stuttgarter Kickers",
      "SV Sandhausen", "FSV Zwickau", "FC Gütersloh", "Greifswalder FC",
      "FV Illertissen", "1. FC Lokomotive Leipzig", "HSC Hannover", "Sportfreunde Lotte",
      "SV Todesfelde", "Eintracht Norderstedt",
    ],
  },
  {
    id: "bl5",
    name: "5. Liga",
    accent: "#4FC3D0",
    range: [22, 12],
    teams: [
      "BFC Dynamo", "KSV Hessen Kassel", "Sportfreunde Siegen", "FC Bocholt",
      "BSG Chemie Leipzig", "FC 08 Homburg", "SV Atlas Delmenhorst", "Bremer SV",
      "FSV 63 Luckenwalde", "SpVgg Ansbach", "FC Memmingen", "TSV Buchbach",
      "Tasmania Berlin", "BFC Preussen", "FC Schöningen", "SSV Jeddeloh II",
    ],
  },
];

/** Die drei Profiligen: nur sie stellen die 56 gesetzten Klubs im DFB-Pokal. */
const PRO_IDS = ["bl1", "bl2", "bl3"];

/** Staffel jedes Klubs der 4. und 5. Liga, damit der Pokal je Staffel einen Landespokalsieger zieht. */
const LOWER_STAFFEL = {
  "Erzgebirge Aue": "Nordost", "VfB Oldenburg": "Nord", "Rot-Weiß Oberhausen": "West",
  "Hallescher FC": "Nordost", "Chemnitzer FC": "Nordost", "VfB Lübeck": "Nord",
  "Kickers Offenbach": "Südwest", "FC Carl Zeiss Jena": "Nordost", "SpVgg Unterhaching": "Bayern",
  "1. FC Schweinfurt 05": "Bayern", "FC Rot-Weiß Erfurt": "Nordost", "Stuttgarter Kickers": "Südwest",
  "SV Sandhausen": "Südwest", "FSV Zwickau": "Nordost", "FC Gütersloh": "West",
  "Greifswalder FC": "Nordost", "FV Illertissen": "Bayern", "1. FC Lokomotive Leipzig": "Nordost",
  "HSC Hannover": "Nord", "Sportfreunde Lotte": "West", "SV Todesfelde": "Nord",
  "Eintracht Norderstedt": "Nord",
  "BFC Dynamo": "Nordost", "KSV Hessen Kassel": "Südwest", "Sportfreunde Siegen": "West",
  "FC Bocholt": "West", "BSG Chemie Leipzig": "Nordost", "FC 08 Homburg": "Südwest",
  "SV Atlas Delmenhorst": "Nord", "Bremer SV": "Nord", "FSV 63 Luckenwalde": "Nordost",
  "SpVgg Ansbach": "Bayern", "FC Memmingen": "Bayern", "TSV Buchbach": "Bayern",
  "Tasmania Berlin": "Nordost", "BFC Preussen": "Nordost", "FC Schöningen": "Nord",
  "SSV Jeddeloh II": "Nord",
};

const LEAGUE_BY_ID = Object.fromEntries(LEAGUES.map((l) => [l.id, l]));
const LEAGUE_IDS = LEAGUES.map((l) => l.id);
const ZERO_MD = Object.fromEntries(LEAGUE_IDS.map((id) => [id, 0]));
const CUP_ACCENT = "#D8B24C";

/**
 * Regionalliga-Topf: alle Klubs unterhalb der 4. Liga. Aus ihm rücken jedes Jahr vier
 * Vereine in die 4. Liga nach, und er stellt zusammen mit der 4. Liga die
 * Landespokalsieger im DFB-Pokal. Wer aus der 4. Liga absteigt, landet wieder hier.
 */
const REGIONAL_CLUBS = [
  // Nord
  { name: "VfB Oldenburg", staffel: "Nord", strength: 30 },
  { name: "VfB Lübeck", staffel: "Nord", strength: 28 },
  { name: "SV Drochtersen/Assel", staffel: "Nord", strength: 25 },
  { name: "SSV Jeddeloh II", staffel: "Nord", strength: 23 },
  { name: "1. FC Phönix Lübeck", staffel: "Nord", strength: 23 },
  { name: "SC Weiche Flensburg", staffel: "Nord", strength: 22 },
  { name: "Bremer SV", staffel: "Nord", strength: 21 },
  { name: "Kickers Emden", staffel: "Nord", strength: 21 },
  { name: "Eintracht Norderstedt", staffel: "Nord", strength: 19 },
  { name: "Altonaer FC 93", staffel: "Nord", strength: 18 },
  // Nordost
  { name: "Erzgebirge Aue", staffel: "Nordost", strength: 32 },
  { name: "Hallescher FC", staffel: "Nordost", strength: 29 },
  { name: "Chemnitzer FC", staffel: "Nordost", strength: 28 },
  { name: "FC Carl Zeiss Jena", staffel: "Nordost", strength: 27 },
  { name: "BFC Dynamo", staffel: "Nordost", strength: 25 },
  { name: "FSV Zwickau", staffel: "Nordost", strength: 24 },
  { name: "Greifswalder FC", staffel: "Nordost", strength: 23 },
  { name: "VSG Altglienicke", staffel: "Nordost", strength: 23 },
  { name: "1. FC Lokomotive Leipzig", staffel: "Nordost", strength: 22 },
  { name: "Berliner AK 07", staffel: "Nordost", strength: 20 },
  // West
  { name: "Rot-Weiß Oberhausen", staffel: "West", strength: 30 },
  { name: "Wuppertaler SV", staffel: "West", strength: 27 },
  { name: "SV Rödinghausen", staffel: "West", strength: 25 },
  { name: "FC Gütersloh", staffel: "West", strength: 24 },
  { name: "Sportfreunde Siegen", staffel: "West", strength: 24 },
  { name: "FC Bocholt", staffel: "West", strength: 23 },
  { name: "SC Wiedenbrück", staffel: "West", strength: 21 },
  { name: "SSVg Velbert", staffel: "West", strength: 21 },
  { name: "Sportfreunde Lotte", staffel: "West", strength: 20 },
  { name: "Bonner SC", staffel: "West", strength: 19 },
  // Südwest
  { name: "SSV Ulm 1846", staffel: "Südwest", strength: 31 },
  { name: "Kickers Offenbach", staffel: "Südwest", strength: 28 },
  { name: "KSV Hessen Kassel", staffel: "Südwest", strength: 26 },
  { name: "Stuttgarter Kickers", staffel: "Südwest", strength: 26 },
  { name: "TSV Steinbach Haiger", staffel: "Südwest", strength: 25 },
  { name: "FSV Frankfurt", staffel: "Südwest", strength: 23 },
  { name: "Eintracht Trier", staffel: "Südwest", strength: 22 },
  { name: "SG Barockstadt Fulda-Lehnerz", staffel: "Südwest", strength: 21 },
  { name: "FC-Astoria Walldorf", staffel: "Südwest", strength: 20 },
  { name: "TSG Balingen", staffel: "Südwest", strength: 19 },
  // Bayern
  { name: "TSV 1860 München", staffel: "Bayern", strength: 33 },
  { name: "1. FC Schweinfurt 05", staffel: "Bayern", strength: 27 },
  { name: "SpVgg Unterhaching", staffel: "Bayern", strength: 27 },
  { name: "SpVgg Bayreuth", staffel: "Bayern", strength: 24 },
  { name: "FV Illertissen", staffel: "Bayern", strength: 23 },
  { name: "Wacker Burghausen", staffel: "Bayern", strength: 22 },
  { name: "VfB Eichstätt", staffel: "Bayern", strength: 22 },
  { name: "TSV Aubstadt", staffel: "Bayern", strength: 21 },
  { name: "DJK Vilzing", staffel: "Bayern", strength: 20 },
  { name: "FC Memmingen", staffel: "Bayern", strength: 19 },
];

const STAFFELN = ["Nord", "Nordost", "West", "Südwest", "Bayern"];

/** Die vier stärksten Vereine aus vier verschiedenen Staffeln. */
function topAufsteiger(pool, anzahl) {
  const sortiert = [...pool].sort((a, b) => (b.strength || 0) - (a.strength || 0));
  const gewaehlt = [];
  const staffeln = new Set();
  sortiert.forEach((c) => {
    if (gewaehlt.length < anzahl && !staffeln.has(c.staffel)) {
      gewaehlt.push(c.name); staffeln.add(c.staffel);
    }
  });
  sortiert.forEach((c) => {
    if (gewaehlt.length < anzahl && gewaehlt.indexOf(c.name) < 0) gewaehlt.push(c.name);
  });
  return gewaehlt;
}

/** Der Topf zu Beginn: ohne die Klubs, die schon in der 4. oder 5. Liga spielen. */
const REGIONAL_START = REGIONAL_CLUBS.filter(
  (c) => LEAGUE_BY_ID.bl4.teams.indexOf(c.name) < 0 && LEAGUE_BY_ID.bl5.teams.indexOf(c.name) < 0);

const DEFAULT_AMATEURS = [
  "Landespokalsieger Nord", "Landespokalsieger Nordost", "Landespokalsieger West",
  "Landespokalsieger Südwest", "Landespokalsieger Süd", "Landespokalsieger Bayern",
  "Landespokalsieger Mitte", "Landespokalsieger Küste",
];

function rgba(hex, a) {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}

function accentVars(hex) {
  return {
    "--accent": hex,
    "--accent-soft": rgba(hex, 0.22),
    "--accent-soft-2": rgba(hex, 0.36),
    "--accent-dot": rgba(hex, 0.72),
    "--accent-tint": rgba(hex, 0.14),
  };
}

const ZONE_META = {
  cl: { color: "#5C93F0", label: "Champions League" },
  el: { color: "#E0A03C", label: "Europa League" },
  ecl: { color: "#A084EC", label: "Conference-League-Qualifikation" },
  auf: { color: "#3FCB8E", label: "Aufstieg" },
  rel: { color: "#E3C64A", label: "Relegation" },
  ab: { color: "#E4514A", label: "Abstieg" },
};

function zoneFor(leagueId, pos, n) {
  if (leagueId === "bl1") {
    if (pos <= 4) return "cl";
    if (pos <= 6) return "el";
    if (pos === 7) return "ecl";
    if (pos === n - 2) return "rel";
    if (pos > n - 2) return "ab";
  } else if (leagueId === "bl2") {
    if (pos <= 2) return "auf";
    if (pos === 3) return "rel";
    if (pos === n - 2) return "rel";
    if (pos > n - 2) return "ab";
  } else if (leagueId === "bl3") {
    if (pos <= 2) return "auf";
    if (pos === 3) return "rel";
    if (pos > n - 4) return "ab";
  } else if (leagueId === "bl4" || leagueId === "bl5") {
    if (pos <= 4) return "auf";
    if (pos > n - 4) return "ab";
  }
  return null;
}

function zonesUsed(leagueId) {
  if (leagueId === "bl1") return ["cl", "el", "ecl", "rel", "ab"];
  if (leagueId === "bl4" || leagueId === "bl5") return ["auf", "ab"];
  return ["auf", "rel", "ab"];
}


/* ================================================================== */
/*  Zufall, Spielplan, Simulation                                     */
/* ================================================================== */

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rnd) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeFixtures(n, seed) {
  const arr = shuffle([...Array(n).keys()], mulberry32(seed || 1));
  const hin = [];
  for (let r = 0; r < n - 1; r++) {
    const round = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      round.push((r + i) % 2 === 0 ? [a, b] : [b, a]);
    }
    hin.push(round);
    arr.splice(1, 0, arr.pop());
  }
  return [...hin, ...hin.map((round) => round.map(([h, a]) => [a, h]))];
}

/** Torzahl aus einer Poisson-Verteilung. */
function poisson(lambda) {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

/** Remis-Neigung: gemeinsamer Toranteil je Stufe (selten / normal / oft). */
const DRAW_SHARE = [0, 0.45, 0.9];
const DRAW_LABEL = ["normal", "häufiger", "sehr häufig"];

/** Wie stark die Tagesform schwankt — je Stufe eine eigene Breite. */
const FORM_LEVELS = [
  { spread: 3.4, sd: 2.4, tailP: 0.02, tailSd: 8 },
  { spread: 2.7, sd: 4.0, tailP: 0.04, tailSd: 12 },
  { spread: 2.0, sd: 6.2, tailP: 0.08, tailSd: 17 },
];
const FORM_LABEL = ["selten", "normal", "oft"];

/** Ab diesem Abstand läuft die Kurve aus — sonst würden Kantersiege zur Regel. */
const SATURATION = 0.5;

/**
 * Torerwartung einer durchschnittlichen Partie: knapp 3,0 Tore. Der Heimvorteil ist
 * bewusst klein gehalten — er soll die Stärke der Mannschaften nicht überdecken,
 * Auswärtssiege sind entsprechend häufig.
 */
const BASE_H = 1.52, BASE_A = 1.44, BASE_N = 1.48;

/** Normalverteilte Zufallszahl (Box-Muller). */
function gauss(sd) {
  const u = Math.max(1e-9, Math.random());
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd;
}

/**
 * Tagesform. Meist schwankt sie leicht um die Stärke herum, selten deutlich —
 * das sind die Tage, an denen ein Außenseiter über sich hinauswächst.
 */
function dailyForm(level) {
  const f = FORM_LEVELS[level] || FORM_LEVELS[1];
  return gauss(Math.random() < f.tailP ? f.tailSd : f.sd);
}

/**
 * Ergebnis aus den Stärkewerten plus Tagesform. Der Unterschied steuert die
 * erwarteten Tore, der Heimvorteil kommt oben drauf. Auf neutralem Platz
 * (Finale) entfällt er. Nichts ist entschieden: auch ein klarer Favorit
 * verliert gelegentlich.
 */
function simulateMatch(strengthHome, strengthAway, neutral, share, surprise, tiltHome, tiltAway) {
  const level = FORM_LEVELS[surprise] || FORM_LEVELS[1];
  const sH = (Number(strengthHome) || 1) + dailyForm(surprise);
  const sA = (Number(strengthAway) || 1) + dailyForm(surprise);
  const raw = (sH - sA) / 100;
  const d = SATURATION * Math.tanh(raw / SATURATION);
  const baseH = neutral ? BASE_N : BASE_H;
  const baseA = neutral ? BASE_N : BASE_A;
  // Die Ausrichtung beider Mannschaften bestimmt, wie offen das Spiel wird.
  // Offensive Formationen öffnen die Partie für beide Seiten, defensive machen
  // sie eng — davon profitiert im Zweifel der Außenseiter.
  const offenheit = (1 + (Number(tiltHome) || 0)) * (1 + (Number(tiltAway) || 0));
  const lH = Math.max(0.08, Math.min(7, baseH * Math.exp(level.spread * d) * offenheit));
  const lA = Math.max(0.08, Math.min(7, baseA * Math.exp(-level.spread * d) * offenheit));
  // Gemeinsamer Anteil: offene oder zerfahrene Partien treffen beide Seiten
  // gleichzeitig. Er koppelt die Torzahlen und macht Remis häufiger.
  const l0 = Math.min(share == null ? DRAW_SHARE[0] : share, lH, lA);
  const both = poisson(l0);
  return [both + poisson(lH - l0), both + poisson(lA - l0)];
}

/** Hat der deutlich schwächere Klub gewonnen? */
function sensation(hg, ag, sHome, sAway) {
  const a = Number(sHome) || 0;
  const b = Number(sAway) || 0;
  if (hg > ag && b - a >= 15) return true;
  if (ag > hg && a - b >= 15) return true;
  return false;
}

/** Elfmeterschießen — leicht zugunsten der stärkeren Mannschaft. */
function shootout(sh, sa) {
  const p = 0.5 + ((Number(sh) || 1) - (Number(sa) || 1)) / 500;
  return Math.random() < Math.max(0.3, Math.min(0.7, p)) ? "h" : "a";
}

/* ================================================================== */
/*  Kalender                                                          */
/* ================================================================== */

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"];

/** Übliche Saisonstarts: die 3. Liga fängt zuerst an, die Bundesliga zuletzt. */
const SEASON_START = { bl1: [7, 14], bl2: [7, 7], bl3: [7, 1], bl4: [7, 1], bl5: [7, 8] };

/** Pokalrunden im Jahresverlauf: Monat (0-basiert) und Tag. */
const CUP_DATES = [[7, 15], [9, 28], [11, 16], [1, 3], [3, 7], [4, 22]];

const pad2 = (n) => String(n).padStart(2, "0");

function parseISO(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  const dt = new Date(y || 2026, (m || 8) - 1, d || 1);
  return Number.isNaN(dt.getTime()) ? new Date(2026, 7, 14) : dt;
}

function toISO(dt) {
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

function addDays(dt, n) {
  const c = new Date(dt.getTime());
  c.setDate(c.getDate() + n);
  return c;
}

const fmtLong = (dt) => `${WEEKDAYS[dt.getDay()]}, ${pad2(dt.getDate())}.${pad2(dt.getMonth() + 1)}.${dt.getFullYear()}`;
const fmtShort = (dt) => `${WEEKDAYS[dt.getDay()]}, ${pad2(dt.getDate())}.${pad2(dt.getMonth() + 1)}.`;

/**
 * Länderspielpausen. Jedes Fenster ist genau sieben Tage lang und enthält damit
 * exakt einen Samstag — pro Pause fällt also genau ein Spieltag aus.
 */
const INT_BREAKS = [[8, 3], [9, 8], [10, 12], [2, 25]];

/** Liegt der Termin in einer Pause? */
function isPaused(dt) {
  const m = dt.getMonth();
  const d = dt.getDate();
  if ((m === 11 && d >= 20) || (m === 0 && d <= 9)) return true;
  return INT_BREAKS.some(([bm, bd]) => m === bm && d >= bd && d <= bd + 6);
}

/**
 * Spieltage im Wochenrhythmus ab dem ersten Samstag, mit allen Pausen. Ligen mit
 * mehr als 34 Spieltagen bekommen englische Wochen: die zusätzlichen Runden werden
 * gleichmäßig verteilt am Dienstag ausgetragen, damit die Saison im Mai endet.
 */
function matchdayDates(startISO, count) {
  let sat = parseISO(startISO);
  while (sat.getDay() !== 6) sat = addDays(sat, 1);

  const extra = Math.max(0, count - 34);
  const midweek = new Set();
  for (let i = 1; i <= extra; i++) midweek.add(Math.round((i * count) / (extra + 1)));

  const out = [];
  for (let i = 0; i < count; i++) {
    if (midweek.has(i) && out.length) {
      out.push(addDays(out[out.length - 1], 3));
      continue;
    }
    while (isPaused(sat)) sat = addDays(sat, 7);
    out.push(sat);
    sat = addDays(sat, 7);
  }
  return out;
}

function defaultStart(leagueId, label) {
  const y = Number(String(label).slice(0, 4)) || 2026;
  const [m, d] = SEASON_START[leagueId] || [7, 14];
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

function shiftYear(iso, delta) {
  const parts = String(iso).split("-");
  return `${(Number(parts[0]) || 2026) + delta}-${parts[1] || "08"}-${parts[2] || "14"}`;
}

function cupRoundDate(label, i) {
  const y = Number(String(label).slice(0, 4)) || 2026;
  const [m, d] = CUP_DATES[i] || CUP_DATES[CUP_DATES.length - 1];
  return new Date(m >= 6 ? y : y + 1, m, d);
}

/** Anstoßzeiten innerhalb eines Spieltags, relativ zum Samstag. */
function kickoffSlots(n) {
  if (n === 9) {
    return [
      { offset: -1, time: "20:30", count: 1 },
      { offset: 0, time: "15:30", count: 5 },
      { offset: 0, time: "18:30", count: 1 },
      { offset: 1, time: "15:30", count: 1 },
      { offset: 1, time: "17:30", count: 1 },
    ];
  }
  if (n === 10) {
    return [
      { offset: -1, time: "19:00", count: 3 },
      { offset: 0, time: "14:00", count: 4 },
      { offset: 1, time: "13:30", count: 3 },
    ];
  }
  if (n === 11) return [{ offset: 0, time: "14:00", count: n }];
  return [{ offset: 0, time: "15:30", count: n }];
}

/** Für jede Partie die Kopfzeile, sobald ein neuer Anstoßtermin beginnt. */
function slotHeaders(baseDate, gameCount) {
  const out = new Array(gameCount).fill(null);
  if (!baseDate) return out;
  let gi = 0;
  kickoffSlots(gameCount).forEach((slot) => {
    for (let k = 0; k < slot.count && gi < gameCount; k++, gi++) {
      if (k === 0) out[gi] = `${fmtShort(addDays(baseDate, slot.offset))} · ${slot.time}`;
    }
  });
  return out;
}

/* ================================================================== */
/*  Tabellenberechnung                                                */
/* ================================================================== */

function parsedResult(results, mdIdx, gameIdx) {
  const r = results[`${mdIdx}:${gameIdx}`];
  if (!r) return null;
  if (r.h === "" || r.a === "" || r.h == null || r.a == null) return null;
  const hn = Number(r.h);
  const an = Number(r.a);
  if (!Number.isFinite(hn) || !Number.isFinite(an)) return null;
  return [hn, an];
}

function computeTable(teams, fixtures, results) {
  const rows = teams.map((name, i) => ({
    idx: i, name, sp: 0, s: 0, u: 0, n: 0, t: 0, gt: 0, pkt: 0, form: [],
  }));
  const played = [];

  fixtures.forEach((md, mdIdx) => {
    md.forEach(([h, a], gi) => {
      const res = parsedResult(results, mdIdx, gi);
      if (!res) return;
      const [hg, ag] = res;
      played.push({ h, a, hg, ag });
      const H = rows[h];
      const A = rows[a];
      H.sp++; A.sp++;
      H.t += hg; H.gt += ag;
      A.t += ag; A.gt += hg;
      if (hg > ag) { H.s++; A.n++; H.pkt += 3; H.form.push("S"); A.form.push("N"); }
      else if (hg < ag) { A.s++; H.n++; A.pkt += 3; A.form.push("S"); H.form.push("N"); }
      else { H.u++; A.u++; H.pkt++; A.pkt++; H.form.push("U"); A.form.push("U"); }
    });
  });

  rows.forEach((r) => { r.diff = r.t - r.gt; r.form = r.form.slice(-5); });

  const primary = (a, b) => b.pkt - a.pkt || b.diff - a.diff || b.t - a.t;
  rows.sort((a, b) => primary(a, b) || a.name.localeCompare(b.name, "de"));

  let i = 0;
  while (i < rows.length) {
    let j = i + 1;
    while (j < rows.length && primary(rows[i], rows[j]) === 0) j++;
    if (j - i > 1) {
      const group = rows.slice(i, j);
      const ids = new Set(group.map((r) => r.idx));
      const mini = {};
      group.forEach((r) => { mini[r.idx] = { pkt: 0, diff: 0, aus: 0 }; });
      played.forEach(({ h, a, hg, ag }) => {
        if (!ids.has(h) || !ids.has(a)) return;
        mini[h].diff += hg - ag;
        mini[a].diff += ag - hg;
        mini[a].aus += ag;
        if (hg > ag) mini[h].pkt += 3;
        else if (hg < ag) mini[a].pkt += 3;
        else { mini[h].pkt++; mini[a].pkt++; }
      });
      group.sort((x, y) =>
        mini[y.idx].pkt - mini[x.idx].pkt ||
        mini[y.idx].diff - mini[x.idx].diff ||
        mini[y.idx].aus - mini[x.idx].aus ||
        x.name.localeCompare(y.name, "de"));
      for (let k = 0; k < group.length; k++) rows[i + k] = group[k];
    }
    i = j;
  }

  rows.forEach((r, k) => { r.pos = k + 1; });
  return rows;
}

/* ================================================================== */
/*  Kader                                                             */
/* ================================================================== */

const POSITIONS = ["TW", "ABW", "MF", "ST"];
const POS_LABEL = { TW: "Tor", ABW: "Abwehr", MF: "Mittelfeld", ST: "Angriff" };

/**
 * Formationen als Reihen von hinten nach vorn, ohne Torwart. Die erste Reihe ist
 * die Abwehr, die letzte der Angriff, alles dazwischen Mittelfeld.
 */
const FORMATIONS = {
  "4-4-2": [4, 4, 2],
  "4-3-3": [4, 3, 3],
  "4-2-3-1": [4, 2, 3, 1],
  "4-1-4-1": [4, 1, 4, 1],
  "3-5-2": [3, 5, 2],
  "3-4-3": [3, 4, 3],
  "5-3-2": [5, 3, 2],
};

/** Wie viele Spieler die Formation je Position braucht. */
function formationNeed(f) {
  const rows = FORMATIONS[f] || FORMATIONS["4-4-2"];
  return {
    TW: 1,
    ABW: rows[0],
    MF: rows.slice(1, -1).reduce((a, b) => a + b, 0),
    ST: rows[rows.length - 1],
  };
}

/**
 * Ausrichtung der Formation. 4-4-2 ist der Nullpunkt; wer vorn mehr und hinten
 * weniger Spieler hat, spielt offensiver — mehr eigene Tore, aber auch mehr Gegentore.
 */
function formationTilt(f) {
  const rows = FORMATIONS[f] || FORMATIONS["4-4-2"];
  return ((rows[rows.length - 1] - rows[0]) + 2) / 10;
}

function tiltLabel(f) {
  const t = formationTilt(f);
  if (t > 0.05) return "offensiv";
  if (t < -0.05) return "defensiv";
  return "ausgeglichen";
}

/** Die Startelf auf die Reihen der Formation verteilen. */
function pitchRows(squad) {
  const rows = FORMATIONS[squad.f] || FORMATIONS["4-4-2"];
  const pool = { TW: [], ABW: [], MF: [], ST: [] };
  playersOf(squad).forEach((pl, i) => { if (!pl.b) (pool[pl.p] || pool.MF).push(i); });

  const nimm = (grp, n) => {
    const out = [];
    for (let k = 0; k < n; k++) out.push(pool[grp].length ? pool[grp].shift() : null);
    return out;
  };

  const gk = nimm("TW", 1)[0];
  const linien = [nimm("ABW", rows[0])];
  rows.slice(1, -1).forEach((n) => linien.push(nimm("MF", n)));
  linien.push(nimm("ST", rows[rows.length - 1]));

  const uebrig = [...pool.TW, ...pool.ABW, ...pool.MF, ...pool.ST];
  linien.forEach((r) => r.forEach((v, k) => { if (v == null && uebrig.length) r[k] = uebrig.shift(); }));
  return { gk: gk != null ? gk : (uebrig.length ? uebrig.shift() : null), linien };
}

/** Zwei Spieler tauschen: Bank gegen Startelf, oder zwei Startspieler die Position. */
function swapPlayers(squad, i, j) {
  if (i === j) return squad;
  const list = playersOf(squad);
  const a = list[i];
  const b = list[j];
  if (!a || !b) return squad;
  return {
    ...squad,
    p: list.map((pl, k) => {
      if (k === i) return a.b !== b.b ? { ...pl, b: b.b } : { ...pl, p: b.p };
      if (k === j) return a.b !== b.b ? { ...pl, b: a.b } : { ...pl, p: a.p };
      return pl;
    }),
  };
}

/** 18 Spieler pro Kader: elf in der Startelf, sieben auf der Bank. */
const SQUAD_PLAN = [["TW", 2], ["ABW", 6], ["MF", 6], ["ST", 4]];
const XI_SIZE = 11;
const BENCH_SIZE = 7;

const VORNAMEN = [
  "Lukas", "Jonas", "Finn", "Leon", "Noah", "Elias", "Paul", "Ben", "Luis", "Max",
  "Tim", "Nico", "Jan", "Marvin", "Kevin", "Dennis", "Robin", "Fabian", "Julian", "Marco",
  "Tobias", "Sebastian", "Christoph", "Andreas", "Stefan", "Malik", "Amine", "Ibrahim",
  "Youssef", "Emre", "Deniz", "Mateo", "Luka", "Nikola", "Filip", "Diego", "Rafael",
  "João", "Thiago", "Mattia", "Pierre", "Antoine", "Kwame", "Samuel", "Daniel",
];

const NACHNAMEN = [
  "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker",
  "Schulz", "Hoffmann", "Koch", "Richter", "Klein", "Wolf", "Schröder", "Neumann", "Braun",
  "Werner", "Krause", "Lange", "Zimmermann", "Hartmann", "Krüger", "Schmitt", "Walter",
  "Peters", "Lehmann", "Köhler", "Herrmann", "Kaiser", "Fuchs", "Berger", "Frank", "Winkler",
  "Roth", "Beck", "Lorenz", "Baumann", "Franke", "Albrecht", "Yilmaz", "Demir", "Kaya",
  "Öztürk", "Haddad", "Nasser", "Traoré", "Diallo", "Mensah", "Owusu", "Novak", "Horvat",
  "Petrović", "Marković", "Kowalski", "Nowak", "Silva", "Santos", "Costa", "Moreira",
  "Rossi", "Conti", "Ferrari", "Dubois", "Laurent", "Moreau", "Andersson", "Nielsen",
];

function hashName(str) {
  let h = 0;
  const t = String(str);
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

const clampPlayer = (raw) => {
  const v = String(raw).replace(/[^0-9]/g, "").slice(0, 3);
  if (v === "") return "";
  return String(Math.max(1, Math.min(100, Number(v))));
};

const playersOf = (squad) => (squad && Array.isArray(squad.p) ? squad.p : []);
const startersOf = (squad) => playersOf(squad).filter((pl) => !pl.b);
const benchOf = (squad) => playersOf(squad).filter((pl) => !!pl.b);

const avgStr = (list) =>
  list.length ? list.reduce((a, pl) => a + (Number(pl.s) || 0), 0) / list.length : 0;

/**
 * Teamstärke aus dem gesamten Kader. Die Startelf gibt den Ton an, die Bank geht
 * mit einem kleinen Anteil ein — Kadertiefe zählt, entscheidet aber nicht.
 */
function squadStrength(squad) {
  const xi = startersOf(squad);
  const bank = benchOf(squad);
  if (!xi.length) return 1;
  const v = bank.length ? 0.88 * avgStr(xi) + 0.12 * avgStr(bank) : avgStr(xi);
  return Math.max(1, Math.min(100, Math.round(v)));
}

/**
 * Umgekehrter Weg: eine gewünschte Teamstärke auf die Spieler verteilen. Alle
 * Stärken werden um denselben Betrag verschoben, das Kräfteverhältnis im Kader
 * bleibt also erhalten. Wer an 1 oder 100 anstößt, bleibt stehen; der Rest trägt
 * die Verschiebung weiter, bis der Zielwert getroffen ist.
 */
function scaleSquadTo(squad, ziel) {
  const z = Math.max(1, Math.min(100, Math.round(ziel)));
  const bank = squad.p.map((pl) => !!pl.b);
  const mittel = (l) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0);
  const genau = (v) => {
    const elf = v.filter((_, i) => !bank[i]);
    const bk = v.filter((_, i) => bank[i]);
    if (!elf.length) return 0;
    return bk.length ? 0.88 * mittel(elf) + 0.12 * mittel(bk) : mittel(elf);
  };

  let v = squad.p.map((pl) => Number(pl.s) || 0);
  for (let k = 0; k < 60; k++) {
    const diff = z - genau(v);
    if (Math.abs(diff) < 0.001) break;
    const beweglich = v.map((x) => (diff > 0 ? x < 100 : x > 1));
    if (!beweglich.some(Boolean)) break;
    v = v.map((x, i) => (beweglich[i] ? Math.max(1, Math.min(100, x + diff)) : x));
  }
  v = v.map((x) => Math.max(1, Math.min(100, Math.round(x))));

  // Feinschliff: nach dem Runden notfalls einzelne Spieler um 1 nachziehen.
  for (let k = 0; k < 60; k++) {
    const ist = Math.max(1, Math.min(100, Math.round(genau(v))));
    if (ist === z) break;
    const hoch = ist < z;
    const kand = v.map((x, i) => ({ x, i }))
      .filter((o) => (hoch ? o.x < 100 : o.x > 1))
      .sort((a, b) => (bank[a.i] ? 1 : 0) - (bank[b.i] ? 1 : 0));
    if (!kand.length) break;
    v[kand[0].i] += hoch ? 1 : -1;
  }

  return { ...squad, p: squad.p.map((pl, i) => ({ ...pl, s: v[i] })) };
}

/* ---------- Torschützen ---------- */

/** Wer trifft wie oft: Stürmer weit vorne, Torhüter praktisch nie. */
const SCORE_WEIGHT = { ST: 10, MF: 5, ABW: 1.6, TW: 0.05 };

/** n Torschützen aus einem Kader ziehen, gewichtet nach Position und Stärke. */
function goalScorers(squad, n) {
  if (!n || !squad) return [];
  const spieler = playersOf(squad);
  if (!spieler.length) return [];
  const gew = spieler.map((pl) => {
    const w = SCORE_WEIGHT[pl.p] || 1;
    const st = Math.max(1, Number(pl.s) || 1);
    return w * (pl.b ? 0.22 : 1) * (0.5 + st / 100);
  });
  const summe = gew.reduce((a, b) => a + b, 0) || 1;
  const out = [];
  for (let i = 0; i < n; i++) {
    let r = Math.random() * summe, k = 0;
    while (k < gew.length - 1 && r > gew[k]) { r -= gew[k]; k += 1; }
    out.push(spieler[k].n);
  }
  return out;
}

/** Torschützen samt Minuten für eine Partie würfeln, chronologisch sortiert. */
function makeGoals(squadH, squadA, hg, ag) {
  const list = [];
  goalScorers(squadH, hg).forEach((p) => list.push({ t: "h", p, m: 1 + Math.floor(Math.random() * 90) }));
  goalScorers(squadA, ag).forEach((p) => list.push({ t: "a", p, m: 1 + Math.floor(Math.random() * 90) }));
  return list.sort((x, y) => x.m - y.m);
}

/**
 * Torschützenliste an ein geändertes Ergebnis anpassen: zu viele Einträge fallen
 * weg, fehlende bleiben offen und können von Hand nachgetragen werden.
 */
function trimGoals(sc, hg, ag) {
  if (!Array.isArray(sc) || !sc.length) return sc || [];
  const nimm = (seite, max) => sc.filter((g) => g.t === seite).slice(0, Math.max(0, max));
  return [...nimm("h", hg), ...nimm("a", ag)].sort((x, y) => (x.m || 0) - (y.m || 0));
}

/**
 * Fehlende Torschützen nachziehen. Was schon eingetragen ist, bleibt unangetastet —
 * ergänzt wird nur, was offen ist.
 */
function fillGoals(sc, squadH, squadA, hg, ag) {
  const da = Array.isArray(sc) ? sc : [];
  const seite = (t, anzahl, squad) => {
    // Name behalten, aber eine fehlende Minute mit auswürfeln.
    const vorhanden = da.filter((g) => g.t === t && g.p)
      .map((g) => ({ ...g, m: g.m > 0 ? g.m : 1 + Math.floor(Math.random() * 90) }));
    const fehlt = Math.max(0, anzahl - vorhanden.length);
    const neu = goalScorers(squad, fehlt).map((p) => ({ t, p, m: 1 + Math.floor(Math.random() * 90) }));
    return [...vorhanden, ...neu].slice(0, anzahl);
  };
  return [...seite("h", hg, squadH), ...seite("a", ag, squadA)].sort((x, y) => (x.m || 0) - (y.m || 0));
}

/** Fehlen in einer Partie noch Torschützen? */
function goalsMissing(sc, hg, ag) {
  const da = Array.isArray(sc) ? sc : [];
  return da.filter((g) => g.p).length < (hg + ag);
}

/** Wo ein Spieler aktuell unter Vertrag steht: Name -> Verein. */
function squadIndex(seasons) {
  const idx = new Map();
  seasons.forEach((s) => {
    if (!s || !s.teams) return;
    s.teams.forEach((verein, i) => {
      const q = s.squads && s.squads[i];
      if (!q) return;
      playersOf(q).forEach((pl) => { if (pl.n) idx.set(pl.n.trim(), verein); });
    });
  });
  return idx;
}

/**
 * Torschützenliste. Ein Spieler bekommt genau eine Zeile, auch wenn er während der
 * Saison den Verein gewechselt hat: die Tore werden zusammengezählt und beim Verein
 * geführt, für den er jetzt spielt. Frühere Stationen stehen als Zusatz daneben.
 */
function scorerList(partien, idx) {
  const map = new Map();
  partien.forEach(({ sc, heim, gast }) => {
    (sc || []).forEach((g) => {
      const name = (g.p || "").trim();
      if (!name) return;
      const verein = g.t === "h" ? heim : gast;
      const e = map.get(name) || { name, tore: 0, proVerein: new Map() };
      e.tore += 1;
      e.proVerein.set(verein, (e.proVerein.get(verein) || 0) + 1);
      map.set(name, e);
    });
  });
  return [...map.values()].map((e) => {
    const stationen = [...e.proVerein.entries()].sort((a, b) => b[1] - a[1]);
    const jetzt = (idx && idx.get(e.name)) || stationen[0][0];
    const frueher = stationen.filter(([v]) => v !== jetzt);
    return {
      name: e.name,
      verein: jetzt,
      tore: e.tore,
      vorher: frueher.length ? frueher.map(([v, n]) => `${n} für ${v}`).join(", ") : "",
    };
  }).sort((a, b) => b.tore - a.tore || a.name.localeCompare(b.name));
}

/** Alle Partien einer Liga in einheitlicher Form. */
function seasonGames(season, fixtures) {
  const out = [];
  Object.keys(season.results || {}).forEach((key) => {
    const [mi, gi] = key.split(":").map(Number);
    const paar = fixtures[mi] && fixtures[mi][gi];
    if (!paar) return;
    out.push({ sc: season.results[key].sc, heim: season.teams[paar[0]], gast: season.teams[paar[1]] });
  });
  return out;
}

/** Alle Partien eines Pokals in einheitlicher Form. */
function cupGames(cup) {
  const out = [];
  (cup ? cup.rounds : []).forEach((r) => (r.games || []).forEach((g) => {
    out.push({ sc: g.sc, heim: g.h.name, gast: g.a.name });
  }));
  return out;
}

/** Die Besten je Position in die Startelf stellen, passend zur Formation. */
function autoLineup(squad) {
  const want = formationNeed(squad.f);
  const marked = playersOf(squad).map((pl) => ({ ...pl, b: true }));
  const idx = marked.map((pl, i) => ({ pl, i }));

  POSITIONS.forEach((pos) => {
    idx.filter((x) => x.pl.p === pos)
      .sort((a, b) => (Number(b.pl.s) || 0) - (Number(a.pl.s) || 0))
      .slice(0, want[pos])
      .forEach((x) => { marked[x.i].b = false; });
  });

  // Unterbesetzte Positionen mit den stärksten Übrigen auffüllen
  let n = marked.filter((pl) => !pl.b).length;
  idx.filter((x) => marked[x.i].b)
    .sort((a, b) => (Number(b.pl.s) || 0) - (Number(a.pl.s) || 0))
    .forEach((x) => { if (n < XI_SIZE) { marked[x.i].b = false; n++; } });

  return { ...squad, p: marked };
}

/** Einwechseln: der Ersatzspieler tauscht mit dem schwächsten Startspieler seiner Position. */
function swapIn(squad, benchIdx) {
  const list = playersOf(squad);
  const target = list[benchIdx];
  if (!target || !target.b) return squad;
  const samePos = list.map((pl, i) => ({ pl, i })).filter((x) => !x.pl.b && x.pl.p === target.p);
  const pool = samePos.length ? samePos : list.map((pl, i) => ({ pl, i })).filter((x) => !x.pl.b);
  if (!pool.length) return squad;
  pool.sort((a, b) => (Number(a.pl.s) || 0) - (Number(b.pl.s) || 0));
  const out = pool[0].i;
  return {
    ...squad,
    p: list.map((pl, i) => {
      if (i === benchIdx) return { ...pl, b: false };
      if (i === out) return { ...pl, b: true };
      return pl;
    }),
  };
}

/**
 * Echte Kader der Bundesliga 2026/27, Stand September 2026, Quelle fussballdaten.de.
 * Je Verein zwei Torhüter, sechs Abwehr-, sechs Mittelfeldspieler und vier Angreifer,
 * geordnet nach Rückennummer. Die Stärkewerte stammen nicht von dort — sie werden aus
 * der Vereinsstärke berechnet, denn eine echte Spielerbewertung gibt es nicht.
 */
const REAL_SQUADS = {
  // 5. Liga (Kader 2026/27, Stand Oktober 2026)
  "BFC Dynamo": {
    TW: ["Kevin Sommer", "Paul Hainke"],
    ABW: ["Tobias Gunte", "Viktor Miftaraj", "Valdemar Sadrifar", "Larry Oellers", "John Liebelt", "Ali Ceesay"],
    MF: ["Joey Breitfeld", "Levin Mattmüller", "Diren-Mehmet Günay", "Tim Windsheimer", "Justin Seven", "Sven Ho"],
    ST: ["Rufat Dadashov", "Ludwig Bölke", "Leander Fritzsche", "Jamal Rogero"],
  },
  "KSV Hessen Kassel": {
    TW: ["Eric Oelschlägel", "Jonas Nickisch"],
    ABW: ["Maurice Springfeld", "Joshua Kopf", "Tim Knipping", "Luis Podolski", "Nael Najjar", "Aaron Liesche Prieto"],
    MF: ["Mirnes Pepić", "Cemal Kaymaz", "Adrian Bravo Sanchez", "Phinees Bonianga", "Sercan Sararer", "Nick Rothweiler"],
    ST: ["Cemal Sezer", "Leon Damer", "Jan Dahlke", "Joel Richter"],
  },
  "Sportfreunde Siegen": {
    TW: ["Marcel Johnen", "Moritz Schrief"],
    ABW: ["Jan-Luca Rumpf", "Tim Arnold", "Robin Bormuth", "Rikuhei Nabesaka", "Leon Pursian", "Michel Stöcker"],
    MF: ["Dennis Brock", "Hamza Saghiri", "Konstantin Gerhardt", "Glody Ngyombo", "Ömer Tokac", "Eros Dacaj"],
    ST: ["Serhat-Semih Güler", "Elias Huth", "Lucas Cueto", "Elsamed Ramaj"],
  },
  "FC Bocholt": {
    TW: ["Paul Grave", "Haakon Pomorin"],
    ABW: ["Dominik Lanius", "Elano Yegen", "Kilian Zaruba", "Paul Seidel", "Jonas Carls"],
    MF: ["Marlon Frey", "Marvin Lorch", "Mika Walther", "Stipe Batarilo-Ćerdić", "Patrick Kurzen", "Maximilian Jansen"],
    ST: ["Malek Fakhro", "Arnold Budimbu", "Lennart Garlipp", "Tim Krohn"],
  },
  "BSG Chemie Leipzig": {
    TW: ["Marcel Bergmann", "Florian Horenburg"],
    ABW: ["Tim Hoops", "Phillipp Wendt", "Lorenz Hollenbach", "Elias Kratzer", "Marc Enke", "David Pfeil"],
    MF: ["Willi Reincke", "Luis Jakobi", "Valon Aliji", "Darijan Silic", "Julius Hoffmann", "Anton Bulland"],
    ST: ["Philipp Kühn", "Malick Sanogo", "Tyron Profis", "Bradley Lokilo"],
  },
  "FC 08 Homburg": {
    TW: ["Jonas Weyand", "Michael Gelt"],
    ABW: ["Philipp Steinhart", "Michael Heilig", "Tim Steinmetz", "Frederik Schumann", "Jan-Erik Eichhorn"],
    MF: ["Nicolas Jörg", "Nicolas Andermatt", "Simon Joachims", "Michael Guthörl", "Manuel Feil", "Julian Günther-Schmidt"],
    ST: ["Marc Ehrhart", "Hilal El-Helwe", "Emir Kuhinja", "Jacob Roden"],
  },
  "SV Atlas Delmenhorst": {
    TW: ["Damian Schobert", "Kilian Sanden"],
    ABW: ["Ibrahim Temin", "Yehor Melenivskyi", "Alejo Sánchez Romero", "André Ndiaye", "Eric Anozie", "Timon Widiker"],
    MF: ["Dinand Gijsen", "Chris David", "Niklas Tepe", "Mats Kaiser", "Tobias Fagerström", "Fin Tiedeken"],
    ST: ["Steffen Rohwedder", "Lamine Diop", "Marcel Raßmann", "Amin Muja"],
  },
  "Bremer SV": {
    TW: ["Lucas Fox", "Nico Weide"],
    ABW: ["Ryusei Hosokawa", "Anthony Nwachukwu", "Denis Koldžić", "Juul Timmermans", "Jean de Chatrie Doegl", "Fyn Luca Ebeling"],
    MF: ["Vedat Tunc", "Daniel Michel", "Luca Schlake", "Justin Bretgeld", "Alessio Arambasic", "Mussa Tasmin"],
    ST: ["Bastian Redecker", "Fritz Kleiner", "Ebrima Camara", "Clinton Helmdach"],
  },
  "FSV 63 Luckenwalde": {
    TW: ["Jasper Kühn", "Kevin Tittel"],
    ABW: ["Quentin Seidel", "Jonas Kühn", "Sofiene Jannene", "Len Neumann", "Clemens Koplin", "Simo Collins"],
    MF: ["Fabio Schneider", "Niklas Kaus", "Till Jacobi", "Julian Mätzke", "Max Hathaway", "Andreas Pollasch"],
    ST: ["Felix Pilger", "Lucas Will", "Claas Zamzow", "Phil Butendeich"],
  },
  "SpVgg Ansbach": {
    TW: ["Nils Leidenberger", "Heiko Schiefer"],
    ABW: ["Lucas Beetz", "Matthias Hahn", "Eric Weeger", "Riko Manz", "Lukas Oberseider", "Mirko Puscher"],
    MF: ["Tobias Dietrich", "Björn Angermeier", "Leon Stauber", "Niklas Seefried", "Tarkan Ücüncü", "Ben Müller"],
    ST: ["Dino Nuhanović", "Patrick Kroiß", "Nico Hayer", "Lukas Schmidt"],
  },
  "FC Memmingen": {
    TW: ["Dominik Dewein", "Felix Unger"],
    ABW: ["Maximilian Dolinski", "Jakob Gräser", "Max Zeller", "Kim-Bryan Paschek", "Rufus Roth", "David Remiger"],
    MF: ["Timo Schmidt", "Michael Bergmann", "Fabian Lutz", "Lukas Rietzler", "Jonas Koller", "Uros Micic"],
    ST: ["Philipp Kirsamer", "Luis Pfaumann", "Constantin Kresin", "Pascal Maier"],
  },
  "TSV Buchbach": {
    TW: ["Ludwig Zech", "Oskar Preil"],
    ABW: ["Faton Dzemailji", "Philipp Walter", "Rocco Tavra", "Marinus Erber", "Fadhel Morou", "Dominik Auerhammer"],
    MF: ["Samed Bahar", "Daniel Muteba", "Albano Gashi", "Tobias Heiland", "Florian Wiedl", "Philipp Zimmerer"],
    ST: ["Tobias Stoßberger", "Leo Kainz", "Tobias Sztaf", "Tizian Zimmermann"],
  },
  "Tasmania Berlin": {
    TW: ["Elias Höftmann", "Mateusz Mika"],
    ABW: ["Jamilu Collins", "Fatih Baca", "Youssef Labbouz", "Felix Rehder", "Steffen Eder", "Deji Beyreuther"],
    MF: ["Shean Mensah", "Luka Janeš", "Rintaro Yajima", "Kerem Yayla", "Danil Wostrikow", "Tahsin Çakmak"],
    ST: ["Erich Berko", "Pedro Vitor Cruz Magalhães", "Abdulkadir Beyazit", "Amar Numić"],
  },
  "BFC Preussen": {
    TW: ["Florian Palmowski", "Karl Albers"],
    ABW: ["Nino Lessel", "Ben Meyer", "Ede Gramberg", "Oliver Maric", "Charmaine Häusl", "Leo Sommerfeld"],
    MF: ["Lucas Vierling", "Luis Inderwisch", "Philip Fontein", "Maurice Čović", "Jasin Abou-Chaker", "Melvin Berkemer"],
    ST: ["Joscha Wosz", "Oluwaseunnla Adekunle", "Nikolas Frank", "Luca Butkovic"],
  },
  "FC Schöningen": {
    TW: ["Justin Kick", "Tobias Dahncke"],
    ABW: ["Brian Behrendt", "Max Klump", "Julian Weigel", "Robin Kölle", "Dimitar Milushev", "Maximilian Sauer"],
    MF: ["Federico Palacios", "Luca Horn", "Luca Marino", "Maxim Safronow", "Brian Präger", "Tom-Luca Winter"],
    ST: ["Moussa Doumbouya", "Hannes Joppich", "Ayhan Cankor", "Jordi Njoya"],
  },
  "SSV Jeddeloh II": {
    TW: ["Moritz Onken", "Thure Fengler"],
    ABW: ["Gazi Siala", "Niklas von Aschwege", "Fynn Friedrichs", "Philip Gramberg", "Kingsley Marcinek", "Tom-Julian Kanowski"],
    MF: ["Kamer Krasniqi", "Keita Taguchi", "Moritz Brinkmann", "Robin Krolikowski", "Pascal Steinwender", "Tim Janßen"],
    ST: ["Haris Hyseni", "Ole Böttcher", "Affamefuna-Michael Ifeadigo", "Tobias Bothe"],
  },
  // 4. Liga (Kader 2026/27, Stand Oktober 2026)
  "Erzgebirge Aue": {
    TW: ["Martin Männel", "Max Uhlig"],
    ABW: ["Bastian Strietzel", "Patrick Kapp", "Jonas Kehl", "Stylianos Kokovas", "Maxim Burghardt", "Leon Prosche"],
    MF: ["Tim Maciejewski", "Simon Skarlatidis", "Finn Heidrich", "Ali Loune", "Willi Kamm", "Devin Angleberger"],
    ST: ["Linus Queißer", "Marcel Bär", "Aurel Loubongo", "Christoph Pauling"],
  },
  "VfB Oldenburg": {
    TW: ["Jhonny Peitzmeier", "Ole Springer"],
    ABW: ["Marc Schröder", "Leon Deichmann", "Ermal Pepshi", "Anouar Adam", "Nico Knystock", "Nico Mai"],
    MF: ["Vjekoslav Taritaš", "Drilon Demaj", "Rafael Brand", "Willem Hoffrogge", "Linus Schäfer", "Nick Otto"],
    ST: ["Mats Facklam", "Leon Demaj", "Kai Pröger", "Moses Otuali"],
  },
  "Rot-Weiß Oberhausen": {
    TW: ["Nicolas Glaus", "Ryan Valentine"],
    ABW: ["Nico Klaß", "Justus Henke", "Simon Ludwig", "Lucas Halangk", "Nils Winter", "Pierre Fassnacht"],
    MF: ["Max Meyer", "Alexander Mühling", "Yannik Möker", "Luca Schlax", "Arda Süne", "Kerem Yalcin"],
    ST: ["Timur Kesim", "Travis de Jong", "Burinyuy Nyuydine", "Sergio Terranova"],
  },
  "Hallescher FC": {
    TW: ["Sven Müller", "Luca Bendel"],
    ABW: ["Vin Kastull", "Pascal Schmedemann", "Robert Berger", "Burim Halili", "Felix Langhammer", "Niklas Kastenhofer"],
    MF: ["Niclas Stierlin", "Max Kulke", "Niklas Landgraf", "Marius Hauptmann", "Lennard Becker", "Julien Damelang"],
    ST: ["Bocar Baro", "Osman Atılgan", "Fabrice Hartmann", "Lucas Ehrlich"],
  },
  "Chemnitzer FC": {
    TW: ["David Richter", "David Wunsch"],
    ABW: ["Dennis Slamar", "Johannes Pistol", "Justin Gröger", "Jan Löhmannsröben", "Roman Eppendorfer", "Leonhard von Schroetter"],
    MF: ["David Vogt", "Andreas Geipl", "Tom Baumgart", "Tobias Stockinger", "Samuel Biven", "Amadeus Zamora"],
    ST: ["Domenico Alberico", "Jonas Marx", "Ron Berlinski", "Maurizio Grimaldi"],
  },
  "VfB Lübeck": {
    TW: ["Finn Böhmker", "Ismaël François Bos"],
    ABW: ["Marvin Thiel", "Deniz Hasan Yilmaz", "Emmanuel Ntsiakoh", "Maximilian Schütt", "Henry Jeschonek", "Jonas Dittrich"],
    MF: ["Bjarne Pfundheller", "Dardan Karimani", "Tom Kankowski", "Luis Coordes", "Colin Ulrich", "Felix Mandl"],
    ST: ["Selim Ajkic", "Lennard Heiduck", "Ware Pakia", "Ramiz Demir"],
  },
  "Kickers Offenbach": {
    TW: ["Johannes Brinkies", "Angelo Tramontana"],
    ABW: ["Maximilian Rossmann", "Dominik Črljenec", "Ronny Marcos", "Jakob Lewald", "Alexander Sorge", "Noah Lehmann"],
    MF: ["Maximilian Wolfram", "Keanu Staude", "Daniel Dejanović", "Robin Krauße", "Adam Loune", "Luka Garić"],
    ST: ["Maximilian Schmid", "Benedikt von Hagen", "Jelle Goselink", "Onur Ünlüçifçi"],
  },
  "FC Carl Zeiss Jena": {
    TW: ["Marius Liesegang", "Till Härting"],
    ABW: ["Sören Reddemann", "Malik Talabidi", "Marcel Hoppe", "Paul Krämer", "Sebastian Aigner", "Nils Butzen"],
    MF: ["Maurice Hehne", "Dion Ajvazi", "Osazee Aghatise", "Moritz Fritz", "Jannes Werner", "Jona Kratzenberg"],
    ST: ["Emilio Munser", "Elias Löder", "Kevin Lankford", "Luca Wollschläger"],
  },
  "SpVgg Unterhaching": {
    TW: ["Erion Avdija", "Maurice Dehler"],
    ABW: ["Manuel Stiefler", "Alexander Winkler", "Andy Breuer", "Luis Pfluger", "Timon Obermeier", "Constantin Strunz"],
    MF: ["Mike Gevorgyan", "Ben Westermeier", "Dominik Lindermeir", "Wesley Krattenmacher", "Marinus Spann", "Ferdinand Borne"],
    ST: ["Jeroen Krupa", "Cornelius Pfeiffer", "Moritz Müller", "Bryan Beusch"],
  },
  "1. FC Schweinfurt 05": {
    TW: ["Jan Mottl", "Julian Brätz"],
    ABW: ["Kevin Frisorger", "Nils Piwernetz", "Lauris Bausenwein", "Jason Prodanović", "Johannes Theinhardt", "Pietro Besso"],
    MF: ["Philipp Hack", "Mirco Geisler", "Kevin Fery", "Valentin Schmitt", "Gil Ebner", "Luka Kalandia"],
    ST: ["Michael Dellinger", "Leonard Krasniqi"],
  },
  "FC Rot-Weiß Erfurt": {
    TW: ["Lorenz Otto", "Jaden Rodtnick"],
    ABW: ["Til-Linus Schwarz", "Maxime Awoudja", "Sofiane Ikene", "Pablo Santana Soares", "Nathan Claxton", "Niclas Walther"],
    MF: ["Marco Wolf", "Benjika Caciel", "Robbie Felßberg", "Berk Inaler", "Benny Boboy", "Hinata Gonda"],
    ST: ["Romarjo Hajrulla", "Raphael Assibey-Mensah", "Dustin Forkel", "Boipelo Mashigo"],
  },
  "Stuttgarter Kickers": {
    TW: ["Felix Dornebusch", "Thomas Bromma"],
    ABW: ["David Udogu", "Nico Fundel", "Vincent Schwab", "Elvir Zukaj", "Luca Trslic", "Christoph Meister"],
    MF: ["Nico Blank", "Lukas Kiefer", "Christian Mauersberger", "Nevio Schembri", "Maximilian Zaiser", "Melkamu Frauendorf"],
    ST: ["Dejan Božić", "David Stojak", "Samuel Unsöld", "Yannick Glessing"],
  },
  "SV Sandhausen": {
    TW: ["Arthur Lyska", "Lukas Schneller"],
    ABW: ["Ken Gipson", "Yannick Osée", "Seyhan Yiğit", "Lukas Mazagg", "Kwabe Schulz", "Teoman Akmestanlı"],
    MF: ["Marco Kehl-Gómez", "Niklas Tarnat", "Mert Tasdelen", "Florian Engelhardt", "Arianit Ferati", "Max Christiansen"],
    ST: ["Felix Lohkemper", "Stefan Maderer", "Maximilian Wagner", "Tasos Leonidis"],
  },
  "FSV Zwickau": {
    TW: ["Lucas Hiemann"],
    ABW: ["Kilian Senkbeil", "Sandro Sengersdorf", "Sonny Ziemer", "Oliver Fobassam", "Ben-Luca Moritz", "Lucas Albert"],
    MF: ["Andrey Startsev", "Maximilian Somnitz", "Fynn Seidel", "Daniel Haubner", "Nick Breitenbücher", "Tim Hannemann"],
    ST: ["Philipp Harant", "Theo Martens", "Veron Dobruna", "Paul-Philipp Besong"],
  },
  "FC Gütersloh": {
    TW: ["Jarno Peters", "Tim Matuschewsky"],
    ABW: ["Jannik Borgmann", "Niklas Barthel", "Kevin Hingerl", "Justin Lukas", "David Winke", "Leo Weichert"],
    MF: ["Patrik Twardzik", "Aleksandar Kandić", "Björn Rother", "Jan-Lukas Liehr", "Erik Lanfer", "Kevin Hoffmeier"],
    ST: ["Niklas Frese", "Phil Beckhoff", "Julius Langfeld", "Paolo Maiella"],
  },
  "Greifswalder FC": {
    TW: ["Jakub Jakubov", "Luis Ackermann"],
    ABW: ["Elias Ndukwe Oke", "Lukas Walchhütter", "Joel Awuah", "Lion Semić", "Marcus Niemitz", "Alexander Seidel"],
    MF: ["Robert Leipertz", "Mc Moordy King Hüther", "Michael Sternberg", "Bajram Syla", "Janis Juckel", "Leon Schmökel"],
    ST: ["Grace Bokake", "Gibson Adu", "Kay Seidemann", "Theo Harz"],
  },
  "FV Illertissen": {
    TW: ["Daniel Adamczyk", "Jakob Mayer"],
    ABW: ["Maximilian Neuberger", "Eduard Heckmann", "Jordi Wegmann", "Constantin Pauly", "Flemming Schug", "Emirhan Delikaya"],
    MF: ["Marco Hingerl", "Daniel Hausmann", "Nino Cassaniti", "Alessio Hasler", "Ben Kronenberg", "Jan-Luca Fink"],
    ST: ["Denis Milic", "Elidon Qenaj", "Mussa Fofanah", "İlkan Atak"],
  },
  "1. FC Lokomotive Leipzig": {
    TW: ["Jonas Wendlinger", "Justin Duda"],
    ABW: ["Eliyas Strasner", "Tobias Dombrowa", "Lukas Wilton", "Filip Kusić", "Jan Stein", "Pepe Böhm"],
    MF: ["Farid Abderrahmane", "Alexander Siebeck", "Simon Schierack", "Gabriel Sadlek", "Patrick Vuc", "Eren Öztürk"],
    ST: ["Djamal Ziane", "Ayodele Max Adetula", "Ricky Bornschein", "Julian Kügel"],
  },
  "HSC Hannover": {
    TW: ["Bastian Fielsch"],
    ABW: ["Fabian Weigel", "Paul Wegner", "Lukas Dominke", "Ömer Sever", "Lukas Schorler", "Moritz Dittmann"],
    MF: ["Leander Baar", "Marcel Langer", "Denis Vukančić", "Jonas Röhrbein", "Lasse von Bötticher", "Yannik Pohlmann"],
    ST: ["Amoro Diedhiou", "Nick Bode", "Finn Hoffmann", "Evren Serbes"],
  },
  "Sportfreunde Lotte": {
    TW: ["Laurenz Beckemeyer", "Tim Fisch"],
    ABW: ["Justin Faltyn", "Mehmet Kaya", "Dimitrie Deumi-Nappi", "Karlo Grgić", "Johann Deumi-Nappi"],
    MF: ["Eduard Mahmuti", "Nedzhib Hadzha", "Hassan Mohamad", "Keanu Kerbsties", "Rohin Shivani", "Fatih Öztürk"],
    ST: ["Malte Zumdieck", "Noah Wallenßus", "Emir Yakisir", "Emro Curic"],
  },
  "SV Todesfelde": {
    TW: ["Fabian Landvoigt", "Jonas Marschner"],
    ABW: ["Noel Denis", "Janek Sternberg", "Christian Rave", "Tyler Körting", "Moritz Grosche", "Lasse Jetz"],
    MF: ["Morten Liebert", "Noah Odiase", "Pawel Erfmann", "Ben Jablonski", "Mirko Boland", "Niklas Stehnck"],
    ST: ["Etienne Sohn", "Benjamin Petrick", "Marco Drawz", "Timon Henk"],
  },
  "Eintracht Norderstedt": {
    TW: ["Lars Huxsohl", "Paul Henry Ralfs"],
    ABW: ["Henrik Lauterbach", "Endrik Jaschan", "Fabian Grau", "Moritz Frahm", "Dane Kummerfeld", "Julius Grunwald"],
    MF: ["Falk Gross", "Jonas Behounek", "Josh Görtzen", "Bjarne Kasper", "Erjanik Ghubasaryan", "Melvin Zimmer"],
    ST: ["Nick Gutmann", "Lukas Krüger", "Lenny Kufrin", "Lucas Camacho de Valdoleiros"],
  },
  "FC Energie Cottbus": {
    TW: ["Marcel Lotka", "Max Böhnke"],
    ABW: ["Tim Campulka", "Henry Rorig", "Fousseny Doumbia", "Anderson Lucoqui", "Axel Borgmann", "Leon Guwara"],
    MF: ["Leonardo Bittencourt", "Tolcay Ciğerci", "Tolga Ciğerci", "Dominik Pelivan", "Christian Kinsombi", "Jannis Boziaris"],
    ST: ["Erik Engelhardt", "Justin Butler", "Lucas Copado", "Moritz Hannemann"],
  },
  "VfL Osnabrück": {
    TW: ["Niklas Sauter", "Lukas Jonsson"],
    ABW: ["Jannik Müller", "Joel Abu Hanna", "Niklas Wiemann", "Konrad Faber", "Patrick Kammerbauer", "Theo Janotta"],
    MF: ["Bryan Henning", "Fridolin Wagner", "Bjarke Jacobsen", "Leon Flach", "Tony Lesueur", "Leonhard Münst"],
    ST: ["Robin Meißner", "Adrian Beck", "Luca Raimund", "Bernd Riesselmann"],
  },
  "FC St. Pauli": {
    TW: ["Ben Voll", "Dimitar Mitov"],
    ABW: ["Adam Dzwigala", "Marcus Mathisen", "Eric Smith", "Lars Ritzka", "Arkadiusz Pyrka", "Tomoya Ando"],
    MF: ["Connor Metcalfe", "Joel Chima Fujita", "Mathias Rasmussen", "Branimir Hrgota", "Erik Ahlstrand", "Sam Klein"],
    ST: ["Martijn Kaars", "Ricky-Jade Jones", "Abdoulie Ceesay", "Mathias Pereira Lage"],
  },
  "1. FC Heidenheim": {
    TW: ["Frank Feller", "Thomas Dähne"],
    ABW: ["Patrick Mainka", "Tim Siersleben", "Leonidas Stergiou", "Jonas Föhrenbach", "Marnon Busch", "Leart Paçarada"],
    MF: ["Jan Schöppner", "Julian Niehues", "Luca Kerber", "Mathias Honsak", "Marcel Costly", "Sirlord Conteh"],
    ST: ["Budu Zivzivadze", "Mikkel Kaufmann", "Maximilian Breunig", "Christian Conteh"],
  },
  "VfL Wolfsburg": {
    TW: ["Kamil Grabara", "Pavao Pervan"],
    ABW: ["Moritz Jenz", "Hauke Wahl", "Joakim Maehle", "Saël Kumbedi", "Jenson Seelt", "Kilian Fischer"],
    MF: ["Maximilian Arnold", "Christian Eriksen", "Mattias Svanberg", "Vinicius de Souza Costa", "Aster Vranckx", "Elvis Rexhbecaj"],
    ST: ["Robert Glatzel", "Fabian Reese", "Fraser Hornby", "Kento Shiogai"],
  },
  "SpVgg Greuther Fürth": {
    TW: ["Christian Ortag", "Pelle Boevink"],
    ABW: ["Jannik Dehm", "Luca Itter", "Jannis Heuer", "Noah König", "Brynjar Ingi Bjarnason", "Krisztián Keresztes"],
    MF: ["Paul Will", "Ole Pohlmann", "Shinta Appelkamp", "Felix Klaus", "Sacha Bansé", "Aaron Keller"],
    ST: ["Dennis Srbeny", "Felix Higl", "Jordan", "Omar Sillah"],
  },
  "SV Darmstadt 98": {
    TW: ["Alexander Brunst", "Benedikt Börner"],
    ABW: ["Aleksandar Vukotic", "Patric Pfeiffer", "Christopher Lannert", "Raoul Petretta", "Florian Kleinhansl", "Meldin Dreskovic"],
    MF: ["Fabian Nürnberger", "Kai Klefisch", "Lars Kehl", "Luca Marseiler", "Merveille Papela", "Hiroki Akiyama"],
    ST: ["Noah Weißhaupt", "Fynn Lakenmacher", "Ho-jae Lee", "Ibrahim El Kadiri"],
  },
  "Eintracht Braunschweig": {
    TW: ["Ron-Thorben Hoffmann", "Benjamin Uphoff"],
    ABW: ["Kevin Ehlers", "Frederik Jäkel", "Louis Breunig", "Noah Katterbach", "Andi Hoti", "Fabio Di Michele Sanchez"],
    MF: ["Florian Flick", "Lino Tempelmann", "Robin Heußer", "Sidney Raebiger", "Max Marie", "Samuele Di Benedetto"],
    ST: ["Maximilian Entrup", "Aaron Opoku", "Sidi Sané", "Yann Sturm"],
  },
  "1. FC Magdeburg": {
    TW: ["Robert Kampa", "Tjark Möbius"],
    ABW: ["Paul Jaeckel", "Tobias Müller", "Anselmo García MacNulty", "Pierre Nadjombe", "Lubambo Musonda", "Falko Michel"],
    MF: ["Moritz-Broni Kwarteng", "Torben Müsel", "Tony Reitz", "Felipe Chávez", "Luka Hyryläinen", "Richmond Tachie"],
    ST: ["Emmanuel Iyoha", "Roko Simic", "Mateusz Zukowski", "Magnus Baars"],
  },
  "Arminia Bielefeld": {
    TW: ["Jonas Kersken", "Leo Oppermann"],
    ABW: ["Robin Knoche", "Joel Felix", "Maximilian Großer", "Tim Handwerker", "Arne Sicker", "Leon Schneider"],
    MF: ["Marvin Mehlem", "Sam Schreck", "Lukas Kunze", "Stefano Russo", "Marius Wörl", "Jannik Rochelt"],
    ST: ["Monju Momuluh", "Roberts Uldrikis", "Isaiah Young", "Jeredy Hilterman"],
  },
  "Holstein Kiel": {
    TW: ["Timon Weiner", "Lio Rothenhagen"],
    ABW: ["Sebastian Schonlau", "David Zec", "Ivan Nekic", "John Tolkin", "Hiroki Sekine", "Niko Takahashi Cendagorta"],
    MF: ["Jonas Meffert", "Jonas Therkelsen", "Guillermo Balzi", "Kasper Davidsen", "Umut Tohumcu", "Ikem Ugoh"],
    ST: ["Alexander Bernhardsson", "Faride Alidou", "Phil Harres", "Adrián Kaprálik"],
  },
  "Dynamo Dresden": {
    TW: ["Tim Schreiber", "Lennart Grill"],
    ABW: ["Lukas Boeder", "Thomas Keller", "Alexander Rossipal", "Lars Bünning", "Kenneth Schmidt", "Brooklyn Ezeh"],
    MF: ["Nicolai Rapp", "Niklas Hauptmann", "Luca Herrmann", "Tobias Raschl", "Nils Fröling", "Jonas Oehmichen"],
    ST: ["Christoph Daferner", "Vincent Vermeij", "Ben Bobzien", "Stefan Kutschke"],
  },
  "Karlsruher SC": {
    TW: ["Hans Christian Bernat", "Robin Himmelmann"],
    ABW: ["Sebastian Jung", "Viktor Bergh", "Niclas Dühring", "Paul Scholl", "Deniz Ofli", "Rafael Pinto Pedrosa"],
    MF: ["Marvin Wanitzek", "Lilian Egloff", "Tim Civeja", "Hyeok-kyu Kwon", "Noel Eichinger", "Santeri Väänänen"],
    ST: ["Moritz Broschinski", "Louey Ben Farhat", "Jason Ponente-Ramirez", "Eymen Laghrissi"],
  },
  "VfL Bochum": {
    TW: ["Timo Horn", "Tino Casali"],
    ABW: ["Kevin Vogt", "Philipp Strompf", "Karol Mets", "Maximilian Wittek", "Michael Steinwender", "Oliver Olsen"],
    MF: ["Jean Manuel Mbom", "Koji Miyoshi", "Berkan Taz", "Charlie Patiño", "Enis Cokaj", "Mats Pannewig"],
    ST: ["Philipp Hofmann", "Gerrit Holtmann", "Daniel Hanslik", "Ibrahim Sissoko"],
  },
  "1. FC Nürnberg": {
    TW: ["Jan Reichert", "Christian Mathenia"],
    ABW: ["Giannis Masouras", "Fynn Otto", "Mikayil Faye", "Alexios Kalogeropoulos", "Styopa Mkrtchyan", "Eric Porstner"],
    MF: ["Julian Justvan", "Finn Becker", "Adam Markhiev", "Rafael Lubach", "Javier Fernández", "Rayan Ghrieb"],
    ST: ["Sigurd Haugen", "William Bøving", "Adriano Grimaldi", "Piet Scobel"],
  },
  "Hertha BSC": {
    TW: ["Marius Gersbeck", "Tim Goller"],
    ABW: ["Márton Dárdai", "Niklas Kolbe", "Mads Pedersen", "Deyovaisio Zeefuik", "Julian Eitschberger", "Linus Gechter"],
    MF: ["Paul Seguin", "Kevin Sessa", "Leon Jensen", "Oluwaseun Adewumi", "Selim Telib", "Soufian Gouram"],
    ST: ["Josip Brekalo", "Luca Schuler", "Gustaf Nilsson", "Jón Dagur Thorsteinsson"],
  },
  "1. FC Kaiserslautern": {
    TW: ["Julian Krahl", "Yannick Onohiol"],
    ABW: ["Jan Elvedi", "Jacob Rasmussen", "Maxwell Gyamfi", "Simon Asta", "Erik Wekesser", "Paul Joly"],
    MF: ["Fabian Kunze", "Semih Sahin", "Naatan Skyttä", "Frank Ronstadt", "Leon Robinson", "Mário Sauer"],
    ST: ["Ivan Prtajin", "Mergim Berisha", "Jannik Mause", "Erencan Yardımcı"],
  },
  "SC Verl": {
    TW: ["Timo Schlieck", "Fabian Pekruhl"],
    ABW: ["Raphael Araoye", "Nick Seidel", "Paul Lehmann", "Niko Kijewski", "Felix Vogler", "Tim Hoffmann"],
    MF: ["Joshua Eze", "Amin Farouk", "Dennis Waidner", "Bilal Yalcinkaya", "Yari Otto", "Fabian Wessig"],
    ST: ["Alem Japaur", "Mika Clausen", "Tim Heike", "Antonio Foti"],
  },
  "Hansa Rostock": {
    TW: ["Luca Unbehaun", "Yannic Stein"],
    ABW: ["Florian Bohnert", "Ahmet Gürleyen", "Florian Carstens", "Franz Pfanne", "Niklas Kölle", "Jan Mejdr"],
    MF: ["Kenan Fatkic", "Marco Schuster", "Jonas Dirkner", "David Kopacz", "Benno Dietze", "Paul Stock"],
    ST: ["Andreas Voglsammer", "David Hummel", "Maximilian Krauß", "Leon Dajaku"],
  },
  "Würzburger Kickers": {
    TW: ["Johann Hipper", "Marko Rajkovacic"],
    ABW: ["David Abrangao", "Kristijan Taseski", "Ebrahim Farahnak", "Daniel Hägele", "Nathan de Medina", "Leo Eberle"],
    MF: ["Dominik Meisel", "Franck Evina", "David Kinsombi", "Tim Kraus", "Eroll Zejnullahu", "Philipp Ochs"],
    ST: ["Dion Berisha", "Tarsis Bonga", "Eliot Muteba", "Jermain Nischalke"],
  },
  "SC Fortuna Köln": {
    TW: ["Lennart Winkler", "Ben Zich"],
    ABW: ["Robin Afamefuna", "David Al-Azzawe", "Maximilian Fischer", "Seymour Fünger", "Florian Heister", "Jasper Löffelsend"],
    MF: ["Tom Geerkens", "Cedric Harenbrock", "Luca Majetic", "Jonas Michelbrink", "Suheyel Najar", "Adrian Stanilewicz"],
    ST: ["Hamadi Al Ghaddioui", "Timo Bornemann", "Rafael García", "Enzo Wirtz"],
  },
  "SG Sonnenhof Großaspach": {
    TW: ["Maximilian Reule", "Tim Schulz"],
    ABW: ["Elias Rahn", "Antonis Aidonis", "Marius Uhl", "Leon Maier", "Luca Molinari", "Benedikt Landwehr"],
    MF: ["Volkan Celiktas", "Christian Mistl", "Lukas Stoppel", "Marius Kunde", "Niklas Pollex", "Loris Maier"],
    ST: ["Deli Hajdini", "Marlon Faß", "Tim Rossmann", "Fabian Eisele"],
  },
  "SV Meppen": {
    TW: ["Noah Oberbeck", "Julius Pünt"],
    ABW: ["Florian Bähr", "Dominique Domröse", "Jonas Fedl", "Tobias Mißner", "Stefan Rankić", "Luis Sprekelmeyer"],
    MF: ["Jona Borsum", "Thorben Deters", "Kasra Ghawilu", "Niclas Nadj", "Ersin Zehir", "Erik Zenga"],
    ST: ["Cyrill Akono", "Jannic Ehlers", "Simon Engelmann", "Oliver Schmitt"],
  },
  "Rot-Weiss Essen": {
    TW: ["Jakob Golz", "Felix Wienand"],
    ABW: ["Michael Kostka", "Max Geschwill", "Ben Hüning", "Franci Bouebari", "José Enrique Ríos Alonso", "Ekin Celebi"],
    MF: ["Tony Menzel", "Noah Pesch", "Ruben Reisig", "Janne Sietan", "Danny Schmidt", "Gianluca Swajkowski"],
    ST: ["Aiman Dardari", "Jaka Cuber Potocnik", "Marvin Obuz", "Lucas Brumme"],
  },
  "Fortuna Düsseldorf": {
    TW: ["Lasse Rieß", "Louis Lord"],
    ABW: ["Steven van der Sloot", "Dominique Heintz", "Tim Oberdorf", "Matthias Zimmermann", "Sascha Risch", "Moritz Heyer"],
    MF: ["Yassine Bouchama", "Andreas Müller", "Jorrit Hendrix", "Philipp Förster", "Jomaine Consbruch", "Marcel Benger"],
    ST: ["Eric Hottmann", "Lukas Eixler", "Fabian Schleusener", "Jordi Paulina"],
  },
  "SC Preußen Münster": {
    TW: ["Morten Behrens", "Matthis Harsman"],
    ABW: ["Tim Dietrich", "Antonio Tikvic", "Torge Paetow", "Niko Koulis", "Simon Scherder", "Marco Meyerhöfer"],
    MF: ["Joshua Mees", "Ryan Johansson", "Rico Preißinger", "Philipp Maier", "Jakob Korte", "Marvin Schulz"],
    ST: ["Oscar Vilhelmsson", "Charalambos Makridis", "Mika Stuhlmacher", "Malik Batmaz"],
  },
  "TSV Havelse": {
    TW: ["Tom Opitz", "Norman Quindt"],
    ABW: ["Max Lamby", "Semi Belkahia", "Dennis Duah", "Eric Voufack", "Leon Sommer-Deiss", "Timo Friedrich"],
    MF: ["Niklas Tauer", "Marc Richter", "Johann Berger", "Eryk Grzywacz", "Jannik Oltrogge", "Jesse Tugbenyo"],
    ST: ["Lorenzo Paldino", "Kevin Schumacher", "Kwasi Wriedt", "Torben Engelking"],
  },
  "TSG Hoffenheim II": {
    TW: ["Tobias Trautner", "Tim Philipp"],
    ABW: ["Valentin Lässig", "Timo Hildmann", "Lars Strobl", "Tim Müller", "Tristan Spranger", "Maxime Ndong-Penda"],
    MF: ["Klaus Gjasula", "Diren Dağdeviren", "Matthew Moore", "Tiago Poller", "Alex Honajzer", "Florian Micheler"],
    ST: ["Ben Opoku Labes", "Nader Jindaoui", "Denis Donkor", "Blessing Makanda"],
  },
  "1. FC Saarbrücken": {
    TW: ["Matteo Bignetti", "Kevin Broll"],
    ABW: ["Nikola Aracic", "Anton Bäuerle", "Niko Bretschneider", "Mladen Cvjetinovic", "Calogero Rizzuto", "Siemen Voet"],
    MF: ["Kaan Caliskaner", "Daniel Gleiber", "Gökdeniz Gürpüz", "Abdoulaye Kamara", "Christian Kühlwetter", "Patrick Sontheimer"],
    ST: ["Dominic Baumann", "Kai Brünker", "Maurice Multhaup", "Florian Pick"],
  },
  "VfB Stuttgart II": {
    TW: ["Dominik Draband", "Jerik von der Felsen"],
    ABW: ["Alexander Groiß", "Michael Glück", "Dominik Nothnagel", "Tim Köhler", "Maximilian Herwerth", "Peter Reinhardt"],
    MF: ["Nicolás Sessa", "Veit Stange", "Julian Lüers", "Mirza Ćatović", "Joyeux Masanka Bungi", "Yanik Spalt"],
    ST: ["Justin Diehl", "Oliver Rölke", "Jarzinho Malanga", "Tim van der Leij"],
  },
  "SSV Jahn Regensburg": {
    TW: ["Alexander Weidinger", "Hannes Hermann"],
    ABW: ["Malte Karbstein", "Erik Majetschak", "Benedikt Saller", "Robin Ziegele", "Felix Strauß", "Benedikt Bauer"],
    MF: ["Nassim Boujellab", "Adrian Fein", "Sascha Hingerl", "David Philipp", "Leo Mätzler", "Zétény Jánó"],
    ST: ["Florian Dietz", "Patrick Hobsch", "John Posselt", "Lucas Hermes"],
  },
  "FC Ingolstadt 04": {
    TW: ["Markus Ponath", "Rafael Eßlinger"],
    ABW: ["Noel Lakatos", "Elias Decker", "Georgios Antzoulas", "Jonas Scholz", "Linus Rosenlöcher", "Yannick Deichmann"],
    MF: ["Emre Gül", "Jongmin Seo", "Fredrik Carlsen", "Dennis Kaygin", "Max Plath", "Lukas Fröde"],
    ST: ["Mason Toye", "Lars Lokotsch", "Joseph Ganda", "Obed Ugondu"],
  },
  "FC Viktoria Köln": {
    TW: ["Arne Schulz", "David Wyciok"],
    ABW: ["Tim Kloss", "Meiko Sponsel", "Verthomy Boboy", "Pascal Fallmann", "Felix Christoph Albers", "Christoph Greger"],
    MF: ["Tobias Eisenhuth", "Yannick Tonye", "Taylan Duman", "Niklas Jahn", "Marco Pledl", "Lucas Wolf"],
    ST: ["Jakob Sachse", "David Otto", "Alexander Prokopenko", "Niklas Castelle"],
  },
  "SV Waldhof Mannheim": {
    TW: ["Thijmen Nijhuis", "Jan Niemann"],
    ABW: ["Tim Sechelmann", "Yannis Hör", "Claudio Kammerknecht", "Lukas Klünter", "Favour Okeke", "Diego Michel"],
    MF: ["Maximilian Thalhammer", "Julian Rieckmann", "Arlind Rexhepi", "Adama Diakhaby", "Lovis Frederik Bierschenk", "Vincent Thill"],
    ST: ["Gonçalo Gregório", "Julian Ulbricht", "Terrence Boyd", "Noah Sarenren Bazee"],
  },
  "SV Wehen Wiesbaden": {
    TW: ["Florian Stritzel", "Noah Brdar"],
    ABW: ["Michael Schultz", "Justin Janitzek", "Ben Nink", "Florian Hübner", "Tim Neubert", "Jordy Gillekens"],
    MF: ["Niklas May", "Gino Fechner", "Robin Kalem", "Tarik Gözüsirin", "Fabian Greilinger", "Roberto Massimo"],
    ST: ["Simon Stehle", "Marcus Müller", "Moritz Flotho", "Sinan Karweina"],
  },
  "Alemannia Aachen": {
    TW: ["Manuel Riemann", "Stefan Bajic"],
    ABW: ["Petros Bagkalianis", "Matti Wagner", "Mika Hanraths", "Gideon Jung", "Marius Wegmann", "Joel da Silva Kiala"],
    MF: ["Lukas Scepanik", "Mehdi Loune", "Meiko Wäschenbach", "Nathan Bitumazala", "Danilo Wiebe", "Mika Pobric"],
    ST: ["Louis Köster", "Daniel Starodid", "Fabio Torsiello", "Mika Schroers"],
  },
  "MSV Duisburg": {
    TW: ["Maximilian Braune", "Toni Stahl"],
    ABW: ["Martin Ens", "Tobias Fleckstein", "Niklas Jessen", "Can Coskun", "Joshua Bitter", "Alexander Hahn"],
    MF: ["Rasim Bulic", "Jakob Bookjans", "Aljaz Casar", "Christian Viet", "Conor Noß", "Max Besuschkow"],
    ST: ["Lex-Tyger Lobinger", "Dominik Kother", "Florian Krüger", "Patrick Sussek"],
  },
  "Hannover 96": {
    TW: ["Pascal Loretz", "Leo Weinkauf"],
    ABW: ["Boris Tomiak", "Jean Hugonet", "Virgil Ghiță", "Bastian Allgeier", "Ime Okon", "Maurice Neubauer"],
    MF: ["Marcel Hartel", "Waniss Taïbi", "Franz Roggow", "Stefán Teitur Thórdarson", "Lars Gindorf", "Hayate Matsuda"],
    ST: ["Mustapha Bundu", "Benjamin Källman", "Benedikt Pichler", "Husseyn Chakroun"],
  },
  "FC Bayern München": {
    TW: ["Manuel Neuer", "Sven Ulreich"],
    ABW: ["Dayot Upamecano", "Min-jae Kim", "Jonathan Tah", "Nathaniel Brown", "Alphonso Davies", "Hiroki Ito"],
    MF: ["Joshua Kimmich", "Tom Bischof", "Jamal Musiala", "Ismael Saibari", "Lennart Karl", "Aleksandar Pavlovic"],
    ST: ["Harry Kane", "Luis Díaz", "Michael Olise", "Serge Gnabry"],
  },
  "SV Elversberg": {
    TW: ["Nicolas Kristof", "Tim Boss"],
    ABW: ["Maximilian Rohr", "Jan Gyamerah", "Florian Le Joncour", "Lukas Pinckert", "Nicholas Mickelson", "Lasse Günther"],
    MF: ["Carlo Sickinger", "Amara Condé", "Patryk Dragon", "Lukasz Poreba", "Felix Keidel", "Frederik Schmahl"],
    ST: ["Luca Pfeiffer", "Luca Schnellbacher", "Tom Zimmerschied", "Lukas Petkov"],
  },
  "SC Paderborn 07": {
    TW: ["Markus Schubert", "Nahuel Noll"],
    ABW: ["Marcel Hoffmeier", "Felix Götze", "Mattes Hansen", "Tjark Scheller", "Nyamekye Awortwie-Grant", "Tristan Zobel"],
    MF: ["Tom Baack", "Raphael Obermair", "Oliver Batista-Meier", "Laurin Curda", "Jano ter Horst", "Santiago Castañeda"],
    ST: ["Marvin Pieringer", "Steffen Tigges", "Gabriel Vidovic", "Sven Michel"],
  },
  "Hamburger SV": {
    TW: ["Daniel Heuer Fernandes", "Daniel Peretz"],
    ABW: ["Luka Vuskovic", "Jordan Torunarigha", "Daniel Elfadli", "Miro Muheim", "Silvan Hefti", "William Mikelbrencis"],
    MF: ["Albert Sambi Lokonga", "Fábio Vieira", "Nicolai Remberg", "Anssi Suhonen", "Immanuel Pherai", "Nicolas Capaldo"],
    ST: ["Yussuf Poulsen", "Rayan Philippe", "Bakery Jatta", "Ransford Königsdörffer"],
  },
  "FC Schalke 04": {
    TW: ["Loris Karius", "Justin Heekeren"],
    ABW: ["Nikola Katic", "Tomas Kalas", "Timo Becker", "Hasan Kurucay", "Moussa N'Diaye", "Henning Matriciani"],
    MF: ["Ron Schallenberg", "Adil Aouchiche", "Dejan Ljubicic", "Kenan Karaman", "Janik Bachmann", "Finn Porath"],
    ST: ["Edin Dzeko", "Moussa Sylla", "Christian Gomis", "Emil Højlund"],
  },
  "1. FSV Mainz 05": {
    TW: ["Robin Zentner", "Daniel Batz"],
    ABW: ["Stefan Bell", "Dominik Kohr", "Stefan Posch", "Andreas Hanche-Olsen", "Silvan Widmer", "Anthony Caci"],
    MF: ["Nadiem Amiri", "Kaishu Sano", "Jae-sung Lee", "Paul Nebel", "Lennard Maloney", "Sota Kawasaki"],
    ST: ["Benedict Hollerbach", "Phillip Tietz", "Armindo Sieb", "Nelson Weiper"],
  },
  "1. FC Köln": {
    TW: ["Marvin Schwäbe", "Ron-Robert Zieler"],
    ABW: ["Timo Hübers", "Luca Kilian", "Joel Schmied", "Sebastian Sebulonsen", "Rav van den Berg", "Cenk Özkacar"],
    MF: ["Eric Martel", "Tom Krauss", "Florian Kainz", "Denis Huseinbasic", "Ísak Jóhannesson", "Jakub Kaminski"],
    ST: ["Ragnar Ache", "Said El Mala", "Marius Bülter", "Jan Thielmann"],
  },
  "TSG Hoffenheim": {
    TW: ["Oliver Baumann", "Luca Philipp"],
    ABW: ["Vladimir Coufal", "Bernardo", "Ozan Kabak", "Albian Hajdari", "Koki Machida", "Kevin Akpoguma"],
    MF: ["Grischa Prömel", "Wouter Burger", "Dennis Geiger", "Alexander Prass", "Leon Avdullahu", "Luis Engelns"],
    ST: ["Andrej Kramaric", "Adam Hlozek", "Tim Lemperle", "Adam Daghim"],
  },
  "FC Augsburg": {
    TW: ["Finn Dahmen", "Nediljko Labrovic"],
    ABW: ["Keven Schlotterbeck", "Cedric Zesiger", "Chrislain Matsima", "Jeffrey Gouweleeuw", "Noahkai Banks", "Dimitrios Giannoulis"],
    MF: ["Han-Noah Massengo", "Robin Fellhauer", "Kristijan Jakic", "Yannik Keitel", "Fabian Rieder", "Alexis Claude-Maurice"],
    ST: ["Michael Gregoritsch", "Steve Mounié", "Samuel Essende", "Rodrigo Ribeiro"],
  },
  "1. FC Union Berlin": {
    TW: ["Frederik Rönnow", "Matheo Raab"],
    ABW: ["Danilho Doekhi", "Diogo Leite", "Leopold Querfeld", "Josip Juranovic", "Tom Rothe", "Christopher Trimmel"],
    MF: ["Rani Khedira", "Janik Haberer", "András Schäfer", "Alex Král", "Aljoscha Kemlein", "Woo-yeong Jeong"],
    ST: ["Andrej Ilic", "Marin Ljubicic", "Oliver Burke", "Ilyas Ansah"],
  },
  "Werder Bremen": {
    TW: ["Karl Hein", "Alexander Schlager"],
    ABW: ["Marco Friedl", "Niklas Stark", "Amos Pieper", "Mitchell Weiser", "Felix Agu", "Olivier Deman"],
    MF: ["Senne Lynen", "Jens Stage", "Romano Schmid", "Samuel Mbangula", "Skelly Alvero", "Dariusz Stalmach"],
    ST: ["Justin Njinmah", "Marco Grüll", "Dawid Kownacki", "Cedric Itten"],
  },
  "Borussia Mönchengladbach": {
    TW: ["Moritz Nicolas", "Jonas Omlin"],
    ABW: ["Nico Elvedi", "Kevin Diks", "Luca Netz", "Joe Scally", "Marvin Friedrich", "Kota Takai"],
    MF: ["Florian Neuhaus", "Kevin Stöger", "Yannik Engelhardt", "Jens Castrop", "Philipp Sander", "Giovanni Reyna"],
    ST: ["Tim Kleindienst", "Haris Tabakovic", "Franck Honorat", "Robin Hack"],
  },
  "SC Freiburg": {
    TW: ["Noah Atubolu", "Florian Müller"],
    ABW: ["Matthias Ginter", "Philipp Lienhart", "Christian Günter", "Lukas Kübler", "Philipp Treu", "Max Rosenfelder"],
    MF: ["Maximilian Eggestein", "Nicolas Höfler", "Patrick Osterhage", "Johan Manzambi", "Daniel-Kofi Kyereh", "Niklas Beste"],
    ST: ["Vincenzo Grifo", "Igor Matanovic", "Derry Scherhant", "Junior Adamu"],
  },
  "VfB Stuttgart": {
    TW: ["Alexander Nübel", "Fabian Bredlow"],
    ABW: ["Maximilian Mittelstädt", "Jeff Chabot", "Dan-Axel Zagadou", "Ameen Al-Dakhil", "Lorenz Assignon", "Ramon Hendriks"],
    MF: ["Angelo Stiller", "Atakan Karazor", "Bilal El Khannouss", "Chema Andrés", "Nikolas Nartey", "Noah Darvich"],
    ST: ["Deniz Undav", "Ermedin Demirovic", "Jamie Leweling", "Chris Führich"],
  },
  "Eintracht Frankfurt": {
    TW: ["Kauã Santos", "Michael Zetterer"],
    ABW: ["Robin Koch", "Arthur Theate", "Rasmus Nissen Kristensen", "Nnamdi Collins", "Aurélio Buta", "Hrvoje Smolcic"],
    MF: ["Hugo Larsson", "Ellyes Skhiri", "Farès Chaïbi", "Can Uzun", "Mario Götze", "Mahmoud Dahoud"],
    ST: ["Jonathan Burkardt", "Ritsu Doan", "Ansgar Knauff", "Arnaud Kalimuendo"],
  },
  "RB Leipzig": {
    TW: ["Ørjan Nyland", "Maarten Vandevoordt"],
    ABW: ["Willi Orbán", "Castello Lukeba", "David Raum", "Benjamin Henrichs", "Lukas Klostermann", "Maxime Estève"],
    MF: ["Nicolas Seiwald", "Christoph Baumgartner", "Brajan Gruda", "Arthur Vermeeren", "Neil El Aynaoui", "Rocco Reitz"],
    ST: ["Antonio Nusa", "Johan Bakayoko", "Conrad Harder", "Rômulo"],
  },
  "Borussia Dortmund": {
    TW: ["Gregor Kobel", "Patrick Drewes"],
    ABW: ["Waldemar Anton", "Ramy Bensebaini", "Nico Schlotterbeck", "Emre Can", "Julian Ryerson", "Daniel Svensson"],
    MF: ["Jobe Bellingham", "Felix Nmecha", "Marcel Sabitzer", "Joey Veerman", "Carney Chukwuemeka", "Ethan Nwaneri"],
    ST: ["Serhou Guirassy", "Maximilian Beier", "Fábio Silva", "Samuele Inácio"],
  },
  "Bayer 04 Leverkusen": {
    TW: ["Mark Flekken", "Janis Blaswich"],
    ABW: ["Facundo Medina", "Miguel Gutiérrez", "Jarell Quansah", "Loïc Badé", "Edmond Tapsoba", "Lucas Vázquez"],
    MF: ["Equi Fernández", "Jonas Hofmann", "Robert Andrich", "Malik Tillman", "Aleix García", "Ibrahim Maza"],
    ST: ["Afonso Moreira", "Patrik Schick", "Nathan Tella", "Christian Kofane"],
  },
};

/** Kader erzeugen, dessen errechnete Stärke genau dem Zielwert entspricht. */
function makeSquad(teamName, strength) {
  const rnd = mulberry32(hashName(teamName));
  const target = Math.max(1, Math.min(100, Number(strength) || 40));
  const players = [];

  const echt = REAL_SQUADS[teamName];
  SQUAD_PLAN.forEach(([pos, count]) => {
    for (let i = 0; i < count; i++) {
      const vor = VORNAMEN[Math.floor(rnd() * VORNAMEN.length)];
      const nach = NACHNAMEN[Math.floor(rnd() * NACHNAMEN.length)];
      const name = echt && echt[pos] && echt[pos][i] ? echt[pos][i] : `${vor} ${nach}`;
      const roh = target + 1 - i * 1.6 + (rnd() * 6 - 3);
      players.push({ n: name, p: pos, s: Math.round(roh), b: true });
    }
  });

  let squad = autoLineup({ f: "4-4-2", p: players });
  const diff = target - squadStrength(squad);
  if (diff !== 0) {
    squad = {
      ...squad,
      p: squad.p.map((pl) => ({ ...pl, s: Math.max(1, Math.min(100, pl.s + diff)) })),
    };
  }
  return squad;
}

function makeSquads(teams, strengths) {
  return teams.map((name, i) => makeSquad(name, strengths[i]));
}

/** Gespeicherte Kader auf das aktuelle Format bringen. */
function fixSquad(q, name, fallbackStrength) {
  if (!q || !Array.isArray(q.p) || q.p.length < XI_SIZE) return makeSquad(name, fallbackStrength);
  const p = q.p.map((pl) => ({
    n: String(pl.n || "Spieler"),
    p: POSITIONS.indexOf(pl.p) >= 0 ? pl.p : "MF",
    s: Math.max(1, Math.min(100, Number(pl.s) || 1)),
    b: !!pl.b,
  }));
  const squad = { f: FORMATIONS[q.f] ? q.f : "4-4-2", p };
  return startersOf(squad).length === XI_SIZE ? squad : autoLineup(squad);
}

/** Positionsbezeichnungen, wie sie auf Kaderseiten vorkommen. */
const POS_WORDS = {
  TW: ["tw", "tor", "torwart", "torhüter", "torhueter", "gk", "keeper", "goalkeeper"],
  ABW: ["abw", "abwehr", "verteidiger", "iv", "lv", "rv", "av", "df", "def", "defender"],
  MF: ["mf", "mit", "mittelfeld", "zm", "om", "dm", "zom", "zdm", "lm", "rm", "mid", "midfielder"],
  ST: ["st", "stu", "sturm", "stürmer", "stuermer", "angriff", "angreifer", "fw", "att", "forward"],
};

function posFromWord(w) {
  const t = String(w).toLowerCase().replace(/[^a-zäöüß]/g, "");
  if (!t) return null;
  for (const key of POSITIONS) if (POS_WORDS[key].indexOf(t) >= 0) return key;
  return null;
}

/**
 * Eine eingefügte Kaderliste lesen. Erkannt werden Rückennummern, Positionen und
 * eine angehängte Stärke — in beliebiger Reihenfolge, getrennt durch Semikolon,
 * Tabulator, senkrechten Strich oder einfach Leerzeichen.
 */
function parseSquadText(text) {
  const out = [];
  String(text).split(/\r?\n/).forEach((raw) => {
    const line = raw.trim();
    if (!line) return;

    let felder = line.split(/[;|\t]/).map((x) => x.trim()).filter(Boolean);
    if (felder.length < 2) felder = line.split(/\s+/);

    let pos = null;
    let str = null;
    const namensteile = [];

    felder.forEach((teil, i) => {
      const p = posFromWord(teil);
      // Eine Position steht vor dem Namen oder ist eine kurze Abkürzung. So bleibt
      // ein Nachname wie „Sturm" hinter dem Vornamen ein Name.
      if (p && pos === null && (namensteile.length === 0 || teil.length <= 3)) { pos = p; return; }
      if (/^\d{1,3}$/.test(teil)) {
        const n = Number(teil);
        // führende kleine Zahl ist die Rückennummer, sonst die Stärke
        if (i === 0 && n <= 99) return;
        if (n >= 1 && n <= 100) { str = n; return; }
        return;
      }
      namensteile.push(teil);
    });

    const name = namensteile.join(" ").replace(/\s{2,}/g, " ").trim();
    if (name) out.push({ n: name, p: pos, s: str });
  });
  return out;
}

/**
 * Gelesene Spieler in einen bestehenden Kader einsetzen. Fehlt eine Stärke, bleibt
 * die des bisherigen Spielers auf dem Platz stehen — so ändern sich die Namen,
 * ohne dass die Teamstärke wegläuft.
 */
function applySquadImport(base, parsed) {
  const slots = base.p.map((pl) => ({ ...pl }));
  const frei = slots.map((_, i) => i);
  const belegt = new Set();

  const setze = (spieler, idx) => {
    slots[idx] = {
      ...slots[idx],
      n: spieler.n,
      p: spieler.p || slots[idx].p,
      s: spieler.s != null ? spieler.s : slots[idx].s,
    };
    belegt.add(idx);
  };

  const rest = [];
  parsed.slice(0, slots.length).forEach((sp) => {
    if (!sp.p) { rest.push(sp); return; }
    const platz = frei.find((i) => !belegt.has(i) && slots[i].p === sp.p);
    if (platz != null) setze(sp, platz); else rest.push(sp);
  });
  rest.forEach((sp) => {
    const platz = frei.find((i) => !belegt.has(i));
    if (platz != null) setze(sp, platz);
  });

  return autoLineup({ ...base, p: slots });
}

/* ================================================================== */
/*  Saison und Speicherung                                            */
/* ================================================================== */

/* ---------------- Vereinslogos ---------------- */

const NO_LOGOS = {};
const LogoCtx = createContext(NO_LOGOS);

/** Kleines Vereinslogo vor dem Namen, falls eines hinterlegt ist. */
function Logo({ name }) {
  const logos = useContext(LogoCtx);
  const src = logos[name];
  return src ? <img className="lr-logo" src={src} alt="" /> : null;
}

const LOGO_STOP = new Set(["fc", "sv", "vfl", "vfb", "tsv", "sc", "ssv", "tsg", "fsv", "sg", "ksv", "bsg", "spvgg",
  "ev", "e", "v", "1", "04", "05", "08", "09", "1846", "1860", "1899", "1900", "1904", "logo", "wappen", "club", "verein", "de", "png", "jpg", "jpeg", "webp", "svg"]);

function logoTokens(text) {
  return String(text).toLowerCase().replace(/ß/g, "ss").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter((t) => t && !LOGO_STOP.has(t));
}

/** Ordnet einen Dateinamen dem passendsten Verein der Liste zu (oder null). */
function matchLogoName(fileName, teams) {
  const base = String(fileName).replace(/\.[^.]+$/, "");
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

/** Bilddatei auf höchstens 96 Pixel verkleinern und als PNG-Datenadresse liefern. */
function logoFromFile(file) {
  return new Promise((resolve, reject) => {
    // Über eine Datenadresse laden: blob:-Adressen sind in manchen Umgebungen gesperrt.
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Datei nicht lesbar"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const max = 96;
          const k = Math.min(1, max / Math.max(img.width, img.height, 1));
          const w = Math.max(1, Math.round(img.width * k));
          const h = Math.max(1, Math.round(img.height * k));
          const c = document.createElement("canvas");
          c.width = w; c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL("image/png"));
        } catch (e) { reject(e); }
      };
      img.onerror = () => reject(new Error("Bild nicht lesbar"));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/* ---------------- EA FC 27: Teamwertungen ---------------- */

/** Team-Overall der drei Profiligen in EA FC 27 (Stand Oktober 2026, Drittquellen). */
const FIFA27 = {
  bl1: {
    "FC Bayern München": 86,
    "Bayer 04 Leverkusen": 81,
    "Borussia Dortmund": 82,
    "RB Leipzig": 77,
    "Eintracht Frankfurt": 76,
    "VfB Stuttgart": 78,
    "SC Freiburg": 77,
    "Borussia Mönchengladbach": 74,
    "1. FC Union Berlin": 72,
    "Werder Bremen": 75,
    "TSG Hoffenheim": 77,
    "FC Augsburg": 76,
    "1. FSV Mainz 05": 78,
    "1. FC Köln": 72,
    "Hamburger SV": 69,
    "FC Schalke 04": 74,
    "SV Elversberg": 71,
    "SC Paderborn 07": 69,
  },
  bl2: {
    "Hannover 96": 70,
    "1. FC Kaiserslautern": 70,
    "Hertha BSC": 69,
    "1. FC Nürnberg": 68,
    "VfL Bochum": 70,
    "Karlsruher SC": 68,
    "Dynamo Dresden": 68,
    "Holstein Kiel": 68,
    "Arminia Bielefeld": 68,
    "1. FC Magdeburg": 68,
    "Eintracht Braunschweig": 67,
    "SV Darmstadt 98": 68,
    "SpVgg Greuther Fürth": 67,
    "VfL Wolfsburg": 74,
    "1. FC Heidenheim": 71,
    "FC St. Pauli": 70,
    "VfL Osnabrück": 69,
    "FC Energie Cottbus": 66,
  },
  bl3: {
    "MSV Duisburg": 66,
    "Hansa Rostock": 66,
    "SC Verl": 63,
    "Alemannia Aachen": 65,
    "SV Wehen Wiesbaden": 65,
    "SV Waldhof Mannheim": 64,
    "FC Viktoria Köln": 64,
    "FC Ingolstadt 04": 64,
    "SSV Jahn Regensburg": 64,
    "VfB Stuttgart II": 61,
    "1. FC Saarbrücken": 64,
    "TSG Hoffenheim II": 60,
    "TSV Havelse": 63,
    "SC Preußen Münster": 65,
    "Fortuna Düsseldorf": 67,
    "Rot-Weiss Essen": 65,
    "SV Meppen": 63,
    "SG Sonnenhof Großaspach": 62,
    "SC Fortuna Köln": 63,
    "Würzburger Kickers": 63,
  },
};

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

function defaultStrengths(leagueId, n) {
  const l = LEAGUE_BY_ID[leagueId];
  const [hi, lo] = l ? l.range : [55, 35];
  return Array.from({ length: n }, (_, i) => Math.round(hi - ((hi - lo) * i) / (n - 1)));
}

function nextLabel(label) {
  const m = /^(\d{4})\/(\d{2})$/.exec(String(label).trim());
  if (!m) return label;
  const y = Number(m[1]) + 1;
  return `${y}/${String((y + 1) % 100).padStart(2, "0")}`;
}

function newSeason(teams, strengths, label, start, squads) {
  const kader = squads && squads.length === teams.length ? squads : makeSquads(teams, strengths);
  return {
    label,
    start: start || "2026-08-14",
    teams: [...teams],
    squads: kader,
    strengths: kader.map(squadStrength),
    seed: Math.floor(Math.random() * 1e9),
    results: {},
  };
}

/** Vereine, deren echte Kaderliste bereits in einen Speicherstand übernommen wurde. */
const REAL_NAMES = Object.keys(REAL_SQUADS);

function freshData() {
  const active = {};
  LEAGUES.forEach((l) => {
    const std = defaultStrengths(l.id, l.teams.length);
    const werte = l.teams.map((n, i) => (FIFA_STRENGTH[n] != null ? FIFA_STRENGTH[n] : std[i]));
    active[l.id] = newSeason(l.teams, werte, "2026/27", defaultStart(l.id, "2026/27"));
  });
  return { active, cup: null, history: [], drawBias: 0, surpriseBias: 1, realSquads: [...REAL_NAMES], logos: {},
    regional: REGIONAL_START.map((c) => ({ ...c })) };
}

/** Alte Speicherstände nachrüsten, damit nichts verloren geht. */
/** Vereine, die früher unter einem anderen Namen geführt wurden. */
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
  const out = { logos: d.logos && typeof d.logos === "object" ? d.logos : {}, active: {}, cup: d.cup || null, history: d.history || [], drawBias: Number(d.drawBias) || 0, surpriseBias: d.surpriseBias == null ? 1 : Number(d.surpriseBias) };
  // Vereine, für die inzwischen eine echte Kaderliste dazugekommen ist, bekommen sie
  // nachträglich — aber jeder nur einmal, damit eigene Änderungen erhalten bleiben.
  out.regional = Array.isArray(d.regional) && d.regional.length
    ? d.regional.map((c) => ({ name: String(c.name), staffel: c.staffel || "—",
        strength: Number(c.strength) || 22, squad: c.squad || null }))
    : REGIONAL_START.map((c) => ({ ...c }));
  const applied = Array.isArray(d.realSquads) ? [...d.realSquads] : [];
  const nachzutragen = REAL_NAMES.filter((n) => applied.indexOf(n) < 0);
  out.realSquads = [...applied, ...nachzutragen];
  LEAGUE_IDS.forEach((id) => {
    const s = d.active[id];
    if (!s && (id === "bl4" || id === "bl5")) return; // wird unten angelegt, wenn alle anderen Ligen feststehen
    if (!s) {
      const l = LEAGUE_BY_ID[id];
      out.active[id] = newSeason(l.teams, defaultStrengths(id, l.teams.length), "2026/27", defaultStart(id, "2026/27"));
      return;
    }
    const strengths =
      Array.isArray(s.strengths) && s.strengths.length === s.teams.length
        ? s.strengths.map((v) => Number(v) || 1)
        : defaultStrengths(id, s.teams.length);
    const squads = Array.isArray(s.squads) && s.squads.length === s.teams.length
      ? s.squads.map((q, i) => fixSquad(q, s.teams[i], strengths[i]))
      : makeSquads(s.teams, strengths);
    const frisch = squads.map((q, i) =>
      nachzutragen.indexOf(s.teams[i]) >= 0 ? makeSquad(s.teams[i], strengths[i]) : q);
    out.active[id] = {
      ...s, squads: frisch, strengths: frisch.map(squadStrength),
      start: s.start || defaultStart(id, s.label),
    };
  });
  // Ältere Speicherstände kennen die 4. und 5. Liga noch nicht: aus der Definition anlegen.
  // Steht ein Klub schon in einer anderen Liga (z. B. durch einen früheren Aufstieg), rückt der
  // stärkste freie Klub aus dem Regionalliga-Topf an seine Stelle.
  ["bl4", "bl5"].forEach((id) => {
    if (out.active[id]) return;
    const taken = new Set();
    LEAGUE_IDS.forEach((x) => { if (out.active[x]) out.active[x].teams.forEach((t) => taken.add(t)); });
    const l = LEAGUE_BY_ID[id];
    const reserviert = new Set();
    LEAGUES.forEach((x) => x.teams.forEach((t) => reserviert.add(t)));
    const strengths = defaultStrengths(id, l.teams.length);
    const frei = out.regional
      .filter((c) => !taken.has(c.name) && !reserviert.has(c.name))
      .sort((a, b) => b.strength - a.strength);
    const teams = [];
    const squads = [];
    l.teams.forEach((name, i) => {
      if (!taken.has(name)) {
        teams.push(name);
        squads.push(makeSquad(name, strengths[i]));
      } else if (frei.length) {
        const c = frei.shift();
        teams.push(c.name);
        squads.push(c.squad || makeSquad(c.name, Math.min(Number(c.strength) || strengths[i], strengths[i])));
      }
    });
    const ref = out.active.bl3 || out.active.bl2;
    const label = (ref && ref.label) || "2026/27";
    out.active[id] = newSeason(teams, strengths.slice(0, teams.length), label, defaultStart(id, label), squads);
  });
  // Wer in einer Liga spielt, gehört nicht in den Topf.
  const inLiga = new Set();
  LEAGUE_IDS.forEach((id) => out.active[id].teams.forEach((t) => inLiga.add(t)));
  out.regional = out.regional.filter((c) => !inLiga.has(c.name));
  return out;
}

const STORAGE_KEY = "ligarechner:v2";

async function loadState() {
  try {
    if (!window.storage) return null;
    const r = await window.storage.get(STORAGE_KEY);
    if (!r || !r.value) return null;
    return normalize(JSON.parse(r.value));
  } catch (e) {
    return null;
  }
}

async function persist(data) {
  try {
    if (!window.storage) return false;
    return !!(await window.storage.set(STORAGE_KEY, JSON.stringify(data)));
  } catch (e) {
    return false;
  }
}

/* ================================================================== */
/*  DFB-Pokal                                                         */
/* ================================================================== */

const CUP_ROUNDS = ["1. Runde", "2. Runde", "Achtelfinale", "Viertelfinale", "Halbfinale", "Finale"];

function cupWinner(g) {
  if (g.hg === "" || g.ag === "" || g.hg == null || g.ag == null) return null;
  const h = Number(g.hg);
  const a = Number(g.ag);
  if (!Number.isFinite(h) || !Number.isFinite(a)) return null;
  if (h > a) return g.h;
  if (a > h) return g.a;
  if (g.pen === "h") return g.h;
  if (g.pen === "a") return g.a;
  return null;
}

function roundComplete(round) {
  return round.games.every((g) => cupWinner(g) !== null);
}

/** Paarungen ziehen. Der Klub aus der tieferen Liga bekommt Heimrecht. */
function drawPairs(teams, seed) {
  const rnd = mulberry32(seed);
  const pool = shuffle(teams, rnd);
  const games = [];
  while (pool.length > 1) {
    const x = pool.shift();
    const y = pool.shift();
    const [home, away] =
      x.tier > y.tier ? [x, y] : y.tier > x.tier ? [y, x] : rnd() < 0.5 ? [x, y] : [y, x];
    games.push({ h: home, a: away, hg: "", ag: "", pen: null });
  }
  return games;
}

/** Erste Runde: jeder Amateur bekommt einen Profi und Heimrecht. */
function drawFirstRound(field, seed) {
  const rnd = mulberry32(seed);
  const pros = shuffle(field.filter((t) => t.tier <= 1), rnd);
  const amateurs = shuffle(field.filter((t) => t.tier >= 2), rnd);
  const games = [];
  const n = Math.min(pros.length, amateurs.length);
  for (let i = 0; i < n; i++) {
    games.push({ h: amateurs[i], a: pros[i], hg: "", ag: "", pen: null });
  }
  return [...games, ...drawPairs([...pros.slice(n), ...amateurs.slice(n)], seed + 7)];
}

/* ---------------- Torschützen ---------------- */

/** Wie wahrscheinlich ein Spieler trifft: Position zählt am meisten, Stärke hilft. */
const TOR_GEWICHT = { TW: 0.2, ABW: 2.5, MF: 7, ST: 20 };

function torGewichte(squad) {
  const spieler = (squad && squad.p) || [];
  return spieler.map((pl) => {
    const pos = TOR_GEWICHT[pl.p] || 5;
    const bank = pl.b ? 0.28 : 1;
    const st = Math.max(1, Number(pl.s) || 40);
    return pos * bank * (st / 60);
  });
}

/** Zufällige Torschützen für eine Anzahl Tore, mit Minuten. */
function makeScorers(squad, anzahl, rnd) {
  const spieler = (squad && squad.p) || [];
  if (!spieler.length || anzahl <= 0) return [];
  const w = torGewichte(squad);
  const summe = w.reduce((a, b) => a + b, 0);
  const tore = [];
  for (let i = 0; i < anzahl; i++) {
    let x = rnd() * summe, k = 0;
    while (k < w.length - 1 && x > w[k]) { x -= w[k]; k++; }
    const min = 1 + Math.floor(rnd() * 90);
    tore.push({ n: spieler[k].n, m: min });
  }
  return tore.sort((a, b) => a.m - b.m);
}

/** Tore beider Mannschaften zu einer Liste zusammenführen. */
function goalsFor(squadH, squadA, hg, ag, seed) {
  const rnd = mulberry32(seed >>> 0);
  const h = makeScorers(squadH, hg, rnd).map((t) => ({ ...t, s: "h" }));
  const a = makeScorers(squadA, ag, rnd).map((t) => ({ ...t, s: "a" }));
  return [...h, ...a].sort((x, y) => x.m - y.m);
}

/** Torjägerliste aus einer Ligasaison. */
function scorerTable(season, fixtures) {
  const zaehler = new Map();
  Object.keys(season.results || {}).forEach((key) => {
    const r = season.results[key];
    if (!r || !Array.isArray(r.g)) return;
    const [mi, gi] = key.split(":").map(Number);
    const paar = fixtures[mi] && fixtures[mi][gi];
    if (!paar) return;
    r.g.forEach((t) => {
      const team = season.teams[t.s === "h" ? paar[0] : paar[1]];
      const id = `${t.n}||${team}`;
      const e = zaehler.get(id) || { name: t.n, team, tore: 0 };
      e.tore++; zaehler.set(id, e);
    });
  });
  return [...zaehler.values()].sort((a, b) => b.tore - a.tore || a.name.localeCompare(b.name));
}

/** Torjägerliste aus dem Pokal. */
function cupScorerTable(cup) {
  const zaehler = new Map();
  (cup && cup.rounds ? cup.rounds : []).forEach((r) => {
    r.games.forEach((g) => {
      if (!Array.isArray(g.tore)) return;
      g.tore.forEach((t) => {
        const team = (t.s === "h" ? g.h : g.a).name;
        const id = `${t.n}||${team}`;
        const e = zaehler.get(id) || { name: t.n, team, tore: 0 };
        e.tore++; zaehler.set(id, e);
      });
    });
  });
  return [...zaehler.values()].sort((a, b) => b.tore - a.tore || a.name.localeCompare(b.name));
}

function newCup(active, amateurs, label) {
  const field = [];
  PRO_IDS.forEach((id, tier) => {
    const s = active[id];
    s.teams.forEach((name, i) => field.push({
      name, strength: Number(s.strengths[i]) || 1, tier,
      form: (s.squads && s.squads[i] && s.squads[i].f) || "4-4-2",
      squad: (s.squads && s.squads[i]) || null,
    }));
  });
  // Amateure aus der 4. und 5. Liga bringen ihren Kader mit, die aus dem Topf ihren eigenen oder einen neuen.
  const unten = ["bl4", "bl5"].map((id) => active[id]).filter(Boolean);
  amateurs.forEach((a) => {
    let kader = null;
    unten.forEach((u) => {
      const k = u.teams.indexOf(a.name);
      if (k >= 0 && u.squads && u.squads[k]) kader = u.squads[k];
    });
    field.push({
      name: a.name, strength: Number(a.strength) || 1, tier: 3,
      squad: kader || a.squad || makeSquad(a.name, Number(a.strength) || 20),
    });
  });
  const seed = Math.floor(Math.random() * 1e9);
  return {
    label,
    seed,
    rounds: [{ name: CUP_ROUNDS[0], games: drawFirstRound(field, seed) }],
  };
}

/* ================================================================== */
/*  Styles                                                            */
/* ================================================================== */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

.lr * { box-sizing: border-box; }
.lr {
  --board: #15211B;
  --board-2: #1B2A22;
  --line: rgba(233,229,216,0.13);
  --line-2: rgba(233,229,216,0.22);
  --chalk: #E9E5D8;
  --chalk-dim: #96A093;
  --accent: #E4514A;
  --accent-soft: rgba(228,81,74,0.22);
  --accent-soft-2: rgba(228,81,74,0.36);
  --accent-dot: rgba(228,81,74,0.72);
  --accent-tint: rgba(228,81,74,0.14);
  font-family: 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif;
  background: var(--board); color: var(--chalk); min-height: 100vh;
  padding: 0 0 64px; font-variant-numeric: tabular-nums; -webkit-font-smoothing: antialiased;
}
.lr h1, .lr h2, .lr h3, .lr .disp {
  font-family: 'Oswald', 'IBM Plex Sans', sans-serif; font-weight: 500;
  letter-spacing: 0.01em; margin: 0;
}
.lr button { font-family: inherit; cursor: pointer; }
.lr input, .lr select { font-family: inherit; font-variant-numeric: tabular-nums; }
.lr :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.lr-wrap { max-width: 1180px; margin: 0 auto; padding: 0 20px; }

.lr-top { border-bottom: 1px solid var(--line); background: linear-gradient(180deg, rgba(255,255,255,0.03), transparent); }
.lr-top-in { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; padding: 26px 0 0; flex-wrap: wrap; }
.lr-title { font-size: 30px; line-height: 1.05; }
.lr-sub { color: var(--chalk-dim); font-size: 13px; margin-top: 6px; max-width: 48ch; line-height: 1.5; }
.lr-status { font-size: 12px; color: var(--chalk-dim); }

.lr-tabs { display: flex; gap: 2px; margin-top: 22px; flex-wrap: wrap; }
.lr-tab {
  background: transparent; border: 1px solid var(--line); border-bottom: none;
  color: var(--chalk-dim); padding: 9px 14px; font-size: 14px;
  font-family: 'Oswald', sans-serif; letter-spacing: 0.02em;
  border-radius: 3px 3px 0 0; margin-bottom: -1px;
}
.lr-tab:hover { color: var(--chalk); }
.lr-tab[data-on="1"] {
  color: var(--chalk); background: var(--board-2); border-color: var(--line-2);
  border-bottom: 1px solid var(--board-2); box-shadow: inset 0 2px 0 var(--accent);
}

.lr-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 16px 0; border-bottom: 1px solid var(--line); }
.lr-season { display: flex; align-items: baseline; gap: 8px; }
.lr-season-in {
  background: transparent; border: none; border-bottom: 1px dashed var(--line-2);
  color: var(--chalk); font-family: 'Oswald', sans-serif; font-size: 20px; width: 100px; padding: 2px 0;
}
.lr-tag { font-size: 11px; color: var(--chalk-dim); letter-spacing: 0.04em; }
.lr-spacer { flex: 1; }

.lr-btn { background: transparent; border: 1px solid var(--line-2); color: var(--chalk); padding: 7px 13px; font-size: 13px; border-radius: 3px; }
.lr-btn:hover { background: rgba(233,229,216,0.07); }
.lr-btn[disabled] { opacity: 0.35; cursor: not-allowed; }
.lr-btn-p { border-color: var(--accent); color: #fff; background: var(--accent-soft); }
.lr-btn-p:hover { background: var(--accent-soft-2); }
.lr-btn-sm { padding: 5px 10px; font-size: 12px; }

.lr-md { display: flex; align-items: center; gap: 10px; padding: 18px 0 14px; flex-wrap: wrap; }
.lr-md-num { font-family: 'Oswald', sans-serif; font-size: 22px; min-width: 132px; }
.lr-md-num small { font-size: 13px; color: var(--chalk-dim); font-weight: 400; }
.lr-nav { background: transparent; border: 1px solid var(--line-2); color: var(--chalk); width: 32px; height: 32px; border-radius: 3px; font-size: 15px; line-height: 1; }
.lr-nav:hover { background: rgba(233,229,216,0.07); }
.lr-nav[disabled] { opacity: 0.3; cursor: not-allowed; }
.lr-jump { background: var(--board-2); border: 1px solid var(--line); color: var(--chalk); padding: 6px 8px; border-radius: 3px; font-size: 13px; }
.lr-prog { font-size: 12px; color: var(--chalk-dim); }

.lr-dots { display: flex; gap: 3px; flex-wrap: wrap; padding-bottom: 16px; }
.lr-dot { max-width: 22px; height: 4px; background: rgba(233,229,216,0.14); border-radius: 2px; border: none; padding: 0; flex: 1 1 8px; }
.lr-dot[data-f="1"] { background: var(--accent-dot); }
.lr-dot[data-on="1"] { background: var(--chalk); }

.lr-grid { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1.1fr); gap: 34px; align-items: start; }
@media (max-width: 900px) { .lr-grid { grid-template-columns: 1fr; gap: 30px; } }

.lr-md-date { font-size: 12px; color: var(--chalk-dim); font-family: 'IBM Plex Sans', sans-serif; margin-top: 1px; }
.lr-slot {
  font-size: 11px; color: var(--chalk-dim); letter-spacing: 0.04em;
  padding: 14px 0 5px; border-bottom: 1px solid var(--line-2); margin-bottom: 2px;
}
.lr-slot:first-child { padding-top: 4px; }
.lr-slot-inline { font-family: 'IBM Plex Sans', sans-serif; font-size: 12px; color: var(--chalk-dim); font-weight: 400; }
.lr-cal-month { margin-bottom: 24px; }
.lr-cal-month h3 { font-size: 15px; padding-bottom: 7px; border-bottom: 1px solid var(--line-2); margin-bottom: 2px; }
.lr-cal-row {
  display: flex; gap: 12px; align-items: center; width: 100%; text-align: left;
  padding: 8px 0; background: transparent; color: inherit;
  border: none; border-bottom: 1px solid var(--line);
}
.lr-cal-row:hover { background: rgba(233,229,216,0.05); }
.lr-cal-bar { width: 3px; height: 17px; border-radius: 2px; flex: none; }
.lr-cal-date { min-width: 92px; font-size: 12px; color: var(--chalk-dim); }
.lr-cal-what { flex: 1; font-size: 13px; }
.lr-cal-comp { font-size: 12px; color: var(--chalk-dim); }
.lr-sec-h { font-size: 15px; letter-spacing: 0.03em; padding-bottom: 10px; border-bottom: 1px solid var(--line-2); margin-bottom: 4px; }
.lr-hint { font-size: 11px; color: var(--chalk-dim); padding: 8px 0 2px; line-height: 1.5; margin: 0; }

.lr-game { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; padding: 11px 0; border-bottom: 1px solid var(--line); }
.lr-game-h { text-align: right; }
.lr-game-a { text-align: left; }
.lr-name { font-size: 14px; line-height: 1.25; }
.lr-meta { display: flex; gap: 6px; align-items: center; margin-top: 3px; font-size: 11px; color: var(--chalk-dim); }
.lr-game-h .lr-meta { justify-content: flex-end; }
.lr-rank { display: inline-block; min-width: 22px; padding: 1px 4px; border-radius: 2px; background: rgba(233,229,216,0.10); text-align: center; }
.lr-str-wrap { display: inline-flex; align-items: center; gap: 3px; }
.lr-str-in {
  width: 30px; background: transparent; border: none; border-bottom: 1px dotted var(--line-2);
  color: var(--chalk); font-size: 11px; text-align: center; padding: 0 0 1px;
}
.lr-str-in:focus { border-bottom-color: var(--accent); }
.lr-str-btn {
  background: transparent; border: 1px solid var(--line); color: var(--chalk-dim);
  font-size: 11px; padding: 2px 8px; border-radius: 3px; white-space: nowrap;
}
.lr-str-btn:hover { border-color: var(--accent); color: var(--chalk); background: var(--accent-tint); }
.lr-squad-stats {
  display: flex; gap: 22px; align-items: center; flex-wrap: wrap;
  padding: 14px 0; border-top: 1px solid var(--line-2); border-bottom: 1px solid var(--line-2);
  margin-bottom: 6px;
}
.lr-stat b { font-family: 'Oswald', sans-serif; font-size: 22px; display: block; line-height: 1.1; }
.lr-stat span { font-size: 11px; color: var(--chalk-dim); }
.lr-stat-main b { color: var(--accent); font-size: 26px; }
.lr-team-str {
  width: 68px; padding: 2px 4px; text-align: center;
  font-size: 26px; font-weight: 700; font-family: inherit;
  color: var(--accent); background: transparent;
  border: 1px solid transparent; border-radius: 6px;
}
.lr-team-str:hover { border-color: var(--line); }
.lr-team-str:focus { border-color: var(--accent); background: var(--panel); outline: none; }
.lr-pl-sec {
  display: flex; justify-content: space-between; align-items: baseline;
  font-family: 'Oswald', sans-serif; font-size: 14px;
  margin: 18px 0 8px; padding-bottom: 6px; border-bottom: 1px solid var(--line-2);
}
.lr-pl-row, .lr-pl-head { display: grid; grid-template-columns: 56px 1fr 52px 92px; gap: 6px; align-items: center; }
.lr-pl-row { margin-bottom: 5px; }
.lr-pl-head { font-size: 11px; color: var(--chalk-dim); padding-bottom: 5px; }
.lr-pl-head span:nth-child(3) { text-align: center; }
.lr-import {
  width: 100%; min-height: 150px; resize: vertical;
  background: var(--board); border: 1px solid var(--line); color: var(--chalk);
  border-radius: 3px; padding: 9px; font-size: 12px; line-height: 1.5;
  font-family: 'IBM Plex Sans', sans-serif;
}
.lr-import:focus { border-color: var(--accent); outline: none; }
.lr-pitch { width: 100%; max-width: 340px; display: block; margin: 4px auto 0; }
.lr-chip { cursor: pointer; }
.lr-chip:hover circle { stroke: var(--accent); }
.lr-pl-row .lr-btn-sm[data-on="1"] { border-color: var(--accent); color: var(--chalk); background: var(--accent-tint); }
@media (max-width: 560px) {
  .lr-pl-row, .lr-pl-head { grid-template-columns: 48px 1fr 46px 76px; gap: 4px; }
  .lr-pl-row .lr-btn-sm { padding: 5px 4px; font-size: 11px; }
}

.lr-mid { display: flex; flex-direction: column; align-items: center; gap: 5px; }
.lr-sim {
  background: transparent; border: 1px solid var(--line); color: var(--chalk-dim);
  font-size: 10px; padding: 3px 9px; border-radius: 3px; letter-spacing: 0.02em; white-space: nowrap;
}
.lr-sim:hover { border-color: var(--accent); color: var(--chalk); background: var(--accent-tint); }
.lr-sens { font-size: 10px; color: var(--accent); letter-spacing: 0.08em; }
.lr-score { display: flex; align-items: center; gap: 4px; }
.lr-score input {
  width: 46px; height: 46px; text-align: center; font-size: 19px;
  background: var(--board-2); border: 1px solid var(--line-2); color: var(--chalk);
  border-radius: 4px; padding: 0; -webkit-appearance: none; appearance: none;
}
.lr-score input:focus { border-color: var(--accent); background: var(--accent-tint); }
.lr-score input[data-set="1"] { background: rgba(233,229,216,0.10); }
.lr-step { display: flex; flex-direction: column; gap: 2px; }
.lr-step button {
  width: 26px; height: 22px; line-height: 1; font-size: 13px; padding: 0;
  background: transparent; border: 1px solid var(--line); color: var(--chalk-dim); border-radius: 3px;
}
.lr-step button:hover { background: rgba(233,229,216,0.09); color: var(--chalk); }
.lr-colon { color: var(--chalk-dim); font-size: 13px; }
.lr-win { font-weight: 600; }
.lr-lose { color: var(--chalk-dim); }
@media (max-width: 560px) {
  .lr-game { gap: 6px; }
  .lr-name { font-size: 13px; }
  .lr-step { display: none; }
}

.lr-rounds { display: flex; gap: 4px; flex-wrap: wrap; padding: 16px 0 6px; }
.lr-round-btn { background: transparent; border: 1px solid var(--line); color: var(--chalk-dim); padding: 6px 11px; font-size: 12px; border-radius: 3px; }
.lr-round-btn[data-on="1"] { border-color: var(--accent); color: var(--chalk); background: var(--accent-tint); }
.lr-round-btn[data-done="1"] { color: var(--chalk); }
.lr-pen { display: flex; gap: 5px; justify-content: center; padding: 8px 0 0; grid-column: 1 / -1; flex-wrap: wrap; }
.lr-pen button { background: transparent; border: 1px dashed var(--line-2); color: var(--chalk-dim); font-size: 11px; padding: 4px 9px; border-radius: 3px; }
.lr-pen button[data-on="1"] { border-style: solid; border-color: var(--accent); color: var(--chalk); background: var(--accent-tint); }
.lr-empty { color: var(--chalk-dim); font-size: 14px; line-height: 1.65; padding: 26px 0; max-width: 58ch; }
.lr-champ-box { border: 1px solid var(--accent); border-radius: 4px; padding: 18px; margin: 20px 0; background: var(--accent-tint); }
.lr-champ-box .disp { font-size: 24px; }

.lr-tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
.lr-tbl th { text-align: right; font-weight: 500; font-size: 11px; color: var(--chalk-dim); padding: 0 0 8px; border-bottom: 1px solid var(--line-2); letter-spacing: 0.03em; }
.lr-tbl th:nth-child(2) { text-align: left; }
.lr-tbl td { padding: 6px 0; border-bottom: 1px solid var(--line); text-align: right; }
.lr-tbl td.name { text-align: left; padding-left: 10px; }
.lr-tbl td.pos { width: 34px; color: var(--chalk-dim); padding-left: 8px; position: relative; }
.lr-tbl td.pos::before { content: ""; position: absolute; left: 0; width: 3px; height: 22px; margin-top: -1px; border-radius: 2px; background: var(--zc, transparent); }
.lr-tbl td.pkt { font-weight: 600; padding-left: 8px; }
.lr-tbl td.str { color: var(--chalk-dim); font-size: 12px; }
.lr-tbl tbody tr:hover { background: rgba(233,229,216,0.04); }
.lr-form { display: inline-flex; gap: 2px; margin-left: 8px; vertical-align: middle; }
.lr-form i { width: 6px; height: 6px; border-radius: 50%; display: block; }
@media (max-width: 560px) { .lr-hide-sm { display: none; } }

.lr-top-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 8px 40px; margin-top: 4px; }
.lr-top-tbl { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
.lr-top-tbl col.r { width: 34px; }
.lr-top-tbl col.g { width: 52px; }
.lr-top-tbl th { text-align: left; font-weight: 500; font-size: 11px; color: var(--chalk-dim);
  padding: 0 0 6px; border-bottom: 1px solid var(--line-2); letter-spacing: 0.03em; }
.lr-top-tbl th.g, .lr-top-tbl td.g { text-align: right; }
.lr-top-tbl td { padding: 7px 0; border-bottom: 1px solid var(--line); vertical-align: top;
  overflow: hidden; text-overflow: ellipsis; }
.lr-top-tbl td.r { color: var(--chalk-dim); }
.lr-top-tbl td.g { font-weight: 600; }
.lr-top-tbl td.v { color: var(--chalk-dim); padding-right: 10px; }
.lr-top-tbl .vor { display: block; font-size: 11px; opacity: 0.65; }
.lr-top-tbl tbody tr:hover { background: rgba(233,229,216,0.04); }
.lr-top-h { display: flex; align-items: baseline; gap: 10px; margin: 18px 0 6px; }
.lr-top-h b { font-size: 14px; color: var(--accent); font-weight: 600; }
.lr-top-h span { font-size: 11px; color: var(--chalk-dim); }
@media (max-width: 520px) { .lr-top-tbl td.v, .lr-top-tbl th.v { display: none; } }

.lr-legend { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 12px; font-size: 11px; color: var(--chalk-dim); }
.lr-legend span { display: inline-flex; align-items: center; gap: 6px; }
.lr-legend i { width: 8px; height: 8px; border-radius: 2px; display: block; }

.lr-ov { position: fixed; inset: 0; background: rgba(6,11,8,0.72); display: flex; align-items: flex-start; justify-content: center; padding: 40px 16px; z-index: 40; overflow-y: auto; }
.lr-modal { background: var(--board-2); border: 1px solid var(--line-2); border-radius: 5px; width: 100%; max-width: 640px; padding: 24px; }
.lr-modal h2 { font-size: 21px; margin-bottom: 6px; }
.lr-modal p { font-size: 13px; color: var(--chalk-dim); line-height: 1.55; margin: 0 0 16px; }
.lr-modal-foot { display: flex; gap: 10px; justify-content: flex-end; margin-top: 22px; flex-wrap: wrap; }
.lr-team-row { display: grid; grid-template-columns: 1fr 62px; gap: 6px; margin-bottom: 6px; align-items: center; }
.lr-team-in { background: var(--board); border: 1px solid var(--line); color: var(--chalk); padding: 7px 9px; border-radius: 3px; font-size: 13px; width: 100%; }
.lr-team-in.num { text-align: center; }
.lr-team-head { display: grid; grid-template-columns: 1fr 62px; gap: 6px; font-size: 11px; color: var(--chalk-dim); padding-bottom: 5px; }
.lr-team-head span:last-child { text-align: center; }
.lr-team-row.kader, .lr-team-head.kader { grid-template-columns: 1fr 58px 56px 78px; }
.lr-team-head.kader span:nth-child(2) { text-align: center; }
.lr-logo { width: 20px; height: 20px; object-fit: contain; vertical-align: middle; margin-right: 8px; flex: none; }
div.lr-name { display: flex; align-items: center; }
.lr-tbl .lr-logo { width: 23px; height: 23px; margin: -6px 8px -6px 0; }
.lr-game .lr-logo { width: 32px; height: 32px; margin-right: 10px; }
.lr-game-h .lr-name { justify-content: flex-end; }
.lr-game-h .lr-logo { order: 2; margin: 0 0 0 10px; }
.lr-bulk { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; border: 1px dashed var(--line-2); border-radius: 4px; padding: 10px; margin: 0 0 12px; }
.lr-bulk-btn { position: relative; cursor: pointer; }
.lr-bulk-btn input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.lr-bulk-hint { font-size: 12px; color: var(--chalk-dim); flex: 1 1 200px; min-width: 0; }
.lr-logo-cell { display: flex; align-items: center; justify-content: center; gap: 2px; }
.lr-logo-pick { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border: 1px dashed var(--line-2); border-radius: 3px; cursor: pointer; color: var(--chalk-dim); overflow: hidden; }
.lr-logo-pick:hover, .lr-logo-pick:focus-within { border-color: var(--accent); color: var(--chalk); }
.lr-logo-pick img { width: 26px; height: 26px; object-fit: contain; }
.lr-logo-pick input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.lr-logo-del { background: none; border: 0; color: var(--chalk-dim); cursor: pointer; font-size: 15px; line-height: 1; padding: 2px 3px; }
.lr-logo-del:hover { color: var(--chalk); }
.lr-team-head.kader span:nth-child(2) { text-align: center; }
.lr-team-str { text-align: center; font-size: 13px; color: var(--chalk-dim); }
.lr-team-row.kader input.lr-team-str { width: 100%; box-sizing: border-box; padding: 3px 2px; border-color: var(--line); -moz-appearance: textfield; }
.lr-team-row.kader input.lr-team-str::-webkit-outer-spin-button, .lr-team-row.kader input.lr-team-str::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.lr-duel { border: 1px solid var(--line); border-radius: 4px; padding: 12px; margin-bottom: 12px; }
.lr-duel-h { font-size: 12px; color: var(--chalk-dim); margin-bottom: 8px; }
.lr-choice { display: flex; gap: 8px; flex-wrap: wrap; }
.lr-choice button { flex: 1 1 180px; text-align: left; background: var(--board); border: 1px solid var(--line); color: var(--chalk-dim); padding: 9px 11px; border-radius: 3px; font-size: 13px; }
.lr-choice button[data-on="1"] { border-color: var(--accent); color: var(--chalk); background: var(--accent-tint); }

.lr-hist-row { display: flex; align-items: center; gap: 14px; padding: 13px 0; border: none; border-bottom: 1px solid var(--line); width: 100%; background: transparent; color: inherit; text-align: left; }
.lr-hist-row:hover { background: rgba(233,229,216,0.04); }
.lr-hist-season { font-family: 'Oswald', sans-serif; font-size: 17px; min-width: 82px; }
.lr-hist-league { font-size: 12px; color: var(--chalk-dim); min-width: 106px; }
.lr-hist-champ { font-size: 14px; flex: 1; }
.lr-hist-open { color: var(--chalk-dim); font-size: 12px; }
.lr-hist-body { padding: 6px 0 26px; }
.lr-titles { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px,1fr)); gap: 22px; margin-bottom: 30px; }
.lr-titles h3 { font-size: 14px; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid var(--line-2); }
.lr-titles ol { margin: 0; padding: 0; list-style: none; font-size: 13px; }
.lr-titles li { display: flex; justify-content: space-between; padding: 4px 0; gap: 12px; }
.lr-titles li span:last-child { color: var(--chalk-dim); }
.lr-bracket { font-size: 12px; }
.lr-bracket h4 { font-family: 'Oswald', sans-serif; font-weight: 500; font-size: 13px; margin: 16px 0 6px; color: var(--chalk-dim); }
.lr-bracket div.g { display: flex; gap: 8px; padding: 3px 0; border-bottom: 1px solid var(--line); }
.lr-bracket div.g span:first-child { flex: 1; text-align: right; }
.lr-bracket div.g span:last-child { flex: 1; }
.lr-bracket b { min-width: 60px; text-align: center; }
`;

/* ================================================================== */
/*  Bausteine                                                         */
/* ================================================================== */

const clampStrength = (raw) => {
  const v = String(raw).replace(/[^0-9]/g, "").slice(0, 3);
  if (v === "") return "";
  return String(Math.max(1, Math.min(99, Number(v))));
};

function Form({ form }) {
  const c = { S: "#3FCB8E", U: "#C9C3B0", N: "#E4514A" };
  if (!form || !form.length) return null;
  return (
    <span className="lr-form" title={form.join(" ")}>
      {form.map((f, i) => <i key={i} style={{ background: c[f] }} />)}
    </span>
  );
}

function Stepper({ value, onBump, team }) {
  return (
    <div className="lr-step">
      <button type="button" onClick={() => onBump(1)} aria-label={`Ein Tor mehr für ${team}`}>+</button>
      <button type="button" onClick={() => onBump(-1)} aria-label={`Ein Tor weniger für ${team}`}
        disabled={value === "" || Number(value) <= 0}>−</button>
    </div>
  );
}

function ScoreBox({ value, onType, team }) {
  return (
    <input
      type="text"
      value={value}
      data-set={value !== "" ? "1" : "0"}
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      onFocus={(e) => e.target.select()}
      onChange={(e) => onType(e.target.value)}
      aria-label={`Tore ${team}`}
    />
  );
}

/**
 * Tabellenplatz und Stärke unter dem Mannschaftsnamen. In der Liga führt die
 * Stärke zum Kader, im Pokal ist sie ein direkt änderbarer Momentwert.
 */
function TeamMeta({ rank, strength, onStrength, onOpen, name }) {
  return (
    <div className="lr-meta">
      {rank ? <span className="lr-rank" title="Tabellenplatz">{rank}.</span> : null}
      {onOpen ? (
        <button className="lr-str-btn" onClick={onOpen} title={`Kader von ${name}`}>
          Stärke {strength}
        </button>
      ) : (
        <span className="lr-str-wrap">
          <span>Stärke</span>
          <input className="lr-str-in" value={strength} inputMode="numeric" pattern="[0-9]*"
            onFocus={(e) => e.target.select()} onChange={(e) => onStrength(e.target.value)}
            aria-label={`Stärke ${name}`} />
        </span>
      )}
    </div>
  );
}

function Table({ rows, leagueId, strengths, compact }) {
  const n = rows.length;
  return (
    <>
      <table className="lr-tbl">
        <thead>
          <tr>
            <th style={{ textAlign: "left", paddingLeft: 8 }}>#</th>
            <th>Mannschaft</th>
            {strengths ? <th className="lr-hide-sm">Stk</th> : null}
            <th>Sp</th>
            <th className="lr-hide-sm">S</th>
            <th className="lr-hide-sm">U</th>
            <th className="lr-hide-sm">N</th>
            <th className="lr-hide-sm">Tore</th>
            <th>Diff</th>
            <th>Pkt</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const z = zoneFor(leagueId, r.pos, n);
            return (
              <tr key={r.idx != null ? r.idx : r.name}>
                <td className="pos" style={{ "--zc": z ? ZONE_META[z].color : "transparent" }}>{r.pos}</td>
                <td className="name"><Logo name={r.name} />{r.name}{!compact && <Form form={r.form} />}</td>
                {strengths ? <td className="str lr-hide-sm">{strengths[r.idx]}</td> : null}
                <td>{r.sp}</td>
                <td className="lr-hide-sm">{r.s}</td>
                <td className="lr-hide-sm">{r.u}</td>
                <td className="lr-hide-sm">{r.n}</td>
                <td className="lr-hide-sm">{r.t}:{r.gt}</td>
                <td>{r.diff > 0 ? `+${r.diff}` : r.diff}</td>
                <td className="pkt">{r.pkt}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="lr-legend">
        {zonesUsed(leagueId).map((z) => (
          <span key={z}><i style={{ background: ZONE_META[z].color }} />{ZONE_META[z].label}</span>
        ))}
      </div>
    </>
  );
}

function Modal({ children, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="lr-ov" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lr-modal">{children}</div>
    </div>
  );
}

const enterToNext = (e) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  const all = [...e.currentTarget.querySelectorAll("input")];
  const i = all.indexOf(e.target);
  if (i > -1 && all[i + 1]) all[i + 1].focus();
};

/* ================================================================== */
/*  Hauptkomponente                                                   */
/* ================================================================== */

export default function Tabellenrechner() {
  const [data, setData] = useState(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("bl1");
  const [md, setMd] = useState(ZERO_MD);
  const [cupRound, setCupRound] = useState(0);
  const [modal, setModal] = useState(null);
  const [status, setStatus] = useState("");
  const [openHist, setOpenHist] = useState(null);
  const saveTimer = useRef(null);
  const firstRun = useRef(true);

  useEffect(() => {
    let alive = true;
    loadState().then((s) => {
      if (!alive) return;
      setData(s || freshData());
      setReady(true);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!data || !ready) return;
    if (firstRun.current) { firstRun.current = false; return; }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const ok = await persist(data);
      setStatus(ok ? "Gespeichert" : "Nicht gespeichert");
      setTimeout(() => setStatus(""), 1800);
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [data, ready]);

  const drawBias = data && data.drawBias != null ? data.drawBias : 0;
  const drawShare = DRAW_SHARE[drawBias] != null ? DRAW_SHARE[drawBias] : 0;
  const surprise = data && data.surpriseBias != null ? data.surpriseBias : 1;

  const isLeagueTab = LEAGUE_IDS.includes(tab);
  const league = isLeagueTab ? LEAGUE_BY_ID[tab] : LEAGUES[0];
  const season = data && data.active ? data.active[league.id] : null;

  const fixtures = useMemo(
    () => (season ? makeFixtures(season.teams.length, season.seed) : []),
    [season && season.teams.length, season && season.seed]
  );

  const rows = useMemo(
    () => (season ? computeTable(season.teams, fixtures, season.results) : []),
    [season, fixtures]
  );

  const rankByIdx = useMemo(() => {
    const m = {};
    rows.forEach((r) => { m[r.idx] = r.pos; });
    return m;
  }, [rows]);

  const mdIdx = md[league.id] || 0;
  const currentMd = fixtures[mdIdx] || [];

  const mdDates = useMemo(
    () => (season ? matchdayDates(season.start, fixtures.length) : []),
    [season && season.start, fixtures.length]
  );
  const heads = useMemo(
    () => slotHeaders(mdDates[mdIdx], currentMd.length),
    [mdDates, mdIdx, currentMd.length]
  );

  const filledPerMd = useMemo(() => {
    if (!season) return [];
    return fixtures.map((round, i) =>
      round.reduce((acc, _, gi) => acc + (parsedResult(season.results, i, gi) ? 1 : 0), 0));
  }, [season, fixtures]);

  const updateSeason = useCallback((leagueId, fn) => {
    setData((d) => (d ? { ...d, active: { ...d.active, [leagueId]: fn(d.active[leagueId]) } } : d));
  }, []);

  /** Stärken aller Klubs, die in EA FC 27 stehen, auf die FIFA-Werte setzen. Gibt die Anzahl zurück. */
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

  const setLogo = useCallback((name, url) => {
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

  const updateCup = useCallback((fn) => {
    setData((d) => (d && d.cup ? { ...d, cup: fn(d.cup) } : d));
  }, []);

  const setScore = (gi, side, raw) => {
    const v = raw.replace(/[^0-9]/g, "").slice(0, 2);
    updateSeason(league.id, (s) => {
      const key = `${mdIdx}:${gi}`;
      const cur = s.results[key] || { h: "", a: "" };
      const e = { ...cur, [side]: v };
      e.sc = trimGoals(e.sc, Number(e.h) || 0, Number(e.a) || 0);
      const next = { ...s.results, [key]: e };
      if (next[key].h === "" && next[key].a === "") delete next[key];
      return { ...s, results: next };
    });
  };

  const bumpScore = (gi, side, delta) => {
    updateSeason(league.id, (s) => {
      const key = `${mdIdx}:${gi}`;
      const cur = s.results[key] || { h: "", a: "" };
      const now = cur[side] === "" ? 0 : Number(cur[side]);
      const otherKey = side === "h" ? "a" : "h";
      const e = {
        ...cur,
        [side]: String(Math.max(0, Math.min(99, now + delta))),
        [otherKey]: cur[otherKey] === "" ? "0" : cur[otherKey],
      };
      e.sc = trimGoals(e.sc, Number(e.h) || 0, Number(e.a) || 0);
      return { ...s, results: { ...s.results, [key]: e } };
    });
  };

  /** Für alle Partien mit Ergebnis, aber ohne vollständige Torschützen, nachziehen. */
  const fillSeasonGoals = () => {
    updateSeason(league.id, (s) => {
      const r = { ...s.results };
      Object.keys(r).forEach((key) => {
        const [mi, gi] = key.split(":").map(Number);
        const paar = fixtures[mi] && fixtures[mi][gi];
        if (!paar) return;
        const hg = Number(r[key].h), ag = Number(r[key].a);
        if (!Number.isFinite(hg) || !Number.isFinite(ag)) return;
        if (!goalsMissing(r[key].sc, hg, ag)) return;
        r[key] = { ...r[key], sc: fillGoals(r[key].sc, s.squads[paar[0]], s.squads[paar[1]], hg, ag) };
      });
      return { ...s, results: r };
    });
  };

  /** Dasselbe für die laufende Pokalrunde. */
  const fillCupGoals = () => {
    editRound((r) => ({ ...r, games: r.games.map((g) => {
      const hg = Number(g.hg), ag = Number(g.ag);
      if (!Number.isFinite(hg) || !Number.isFinite(ag)) return g;
      if (!goalsMissing(g.sc, hg, ag)) return g;
      return { ...g, sc: fillGoals(g.sc, g.h.squad, g.a.squad, hg, ag) };
    }) }));
  };

  const saveGoals = (gi, sc) => {
    updateSeason(league.id, (s) => {
      const key = `${mdIdx}:${gi}`;
      const cur = s.results[key];
      if (!cur) return s;
      return { ...s, results: { ...s.results, [key]: { ...cur, sc } } };
    });
    setModal(null);
  };

  const saveCupGoals = (gi, sc) => {
    editRound((r) => ({ ...r, games: r.games.map((g, k) => (k === gi ? { ...g, sc } : g)) }));
    setModal(null);
  };

  const saveSquad = (teamIdx, squad) => {
    updateSeason(league.id, (s) => {
      const squads = [...s.squads];
      const strengths = [...s.strengths];
      squads[teamIdx] = squad;
      strengths[teamIdx] = squadStrength(squad);
      return { ...s, squads, strengths };
    });
  };

  const simulateOneGame = (gi) => {
    const pair = currentMd[gi];
    if (!pair) return;
    const [h, a] = pair;
    updateSeason(league.id, (sn) => {
      const [hg, ag] = simulateMatch(sn.strengths[h], sn.strengths[a], false, drawShare, surprise,
        formationTilt(sn.squads[h].f), formationTilt(sn.squads[a].f));
      const sc = makeGoals(sn.squads[h], sn.squads[a], hg, ag);
      return { ...sn, results: { ...sn.results, [`${mdIdx}:${gi}`]: { h: String(hg), a: String(ag), sc } } };
    });
  };

  const clearMatchday = () => {
    updateSeason(league.id, (s) => {
      const r = { ...s.results };
      currentMd.forEach((_, gi) => delete r[`${mdIdx}:${gi}`]);
      return { ...s, results: r };
    });
  };

  const simulateMatchday = (which) => {
    updateSeason(league.id, (s) => {
      const r = { ...s.results };
      const list = which === "all" ? fixtures.map((_, i) => i) : [mdIdx];
      list.forEach((i) => {
        fixtures[i].forEach(([h, a], gi) => {
          if (which === "all" && parsedResult(s.results, i, gi)) return;
          const [hg, ag] = simulateMatch(s.strengths[h], s.strengths[a], false, drawShare, surprise,
            formationTilt(s.squads[h].f), formationTilt(s.squads[a].f));
          r[`${i}:${gi}`] = { h: String(hg), a: String(ag), sc: makeGoals(s.squads[h], s.squads[a], hg, ag) };
        });
      });
      return { ...s, results: r };
    });
  };

  const totalGames = fixtures.reduce((a, r) => a + r.length, 0);
  const playedGames = filledPerMd.reduce((a, b) => a + b, 0);

  const archive = (d, leagueId) => {
    const s = d.active[leagueId];
    const f = makeFixtures(s.teams.length, s.seed);
    const table = computeTable(s.teams, f, s.results).map((r) => ({
      pos: r.pos, name: r.name, sp: r.sp, s: r.s, u: r.u, n: r.n,
      t: r.t, gt: r.gt, diff: r.diff, pkt: r.pkt,
    }));
    return {
      id: `${leagueId}-${s.label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: "league", leagueId, leagueName: LEAGUE_BY_ID[leagueId].name,
      label: s.label, closedAt: new Date().toISOString(), table,
      scorers: scorerList(seasonGames(s, f), squadIndex([s])).slice(0, 10),
    };
  };

  const closeOne = () => {
    setData((d) => {
      const entry = archive(d, league.id);
      const s = d.active[league.id];
      return {
        ...d,
        history: [entry, ...d.history],
        active: { ...d.active, [league.id]: newSeason(s.teams, s.strengths, nextLabel(s.label), shiftYear(s.start, 1), s.squads) },
      };
    });
    setMd((m) => ({ ...m, [league.id]: 0 }));
    setModal(null);
  };

  const applyPromotion = (duelA, duelB, newcomers) => {
    setData((d) => {
      const history = [archive(d, "bl5"), archive(d, "bl4"), archive(d, "bl3"), archive(d, "bl2"), archive(d, "bl1"), ...d.history];
      const t = {};
      const strengthOf = {};
      const squadOf = {};
      LEAGUE_IDS.forEach((id) => {
        const s = d.active[id];
        s.teams.forEach((name, i) => {
          strengthOf[name] = Number(s.strengths[i]) || 30;
          squadOf[name] = s.squads[i];
        });
        t[id] = computeTable(s.teams, makeFixtures(s.teams.length, s.seed), s.results).map((r) => r.name);
      });

      const stay1 = duelA === "up" ? t.bl2[2] : t.bl1[15];
      const down1 = duelA === "up" ? t.bl1[15] : t.bl2[2];
      const stay2 = duelB === "up" ? t.bl3[2] : t.bl2[15];
      const down2 = duelB === "up" ? t.bl2[15] : t.bl3[2];

      const bl1Teams = [...t.bl1.slice(0, 15), t.bl2[0], t.bl2[1], stay1];
      const bl2Teams = [...t.bl2.slice(3, 15), t.bl1[16], t.bl1[17], down1, t.bl3[0], t.bl3[1], stay2];
      const bl3Teams = [...t.bl3.slice(3, 16), t.bl2[16], t.bl2[17], down2, ...t.bl4.slice(0, 4)];
      const bl4Teams = [...t.bl4.slice(4, 18), ...t.bl3.slice(16), ...t.bl5.slice(0, 4)];
      const bl5Teams = [...t.bl5.slice(4, 12), ...t.bl4.slice(18), ...newcomers];

      // Aufsteiger aus dem Regionalliga-Topf holen, Absteiger hineinlegen.
      const pool = d.regional || [];
      const hoch = newcomers.map((n) => pool.find((c) => c.name === n)).filter(Boolean);
      hoch.forEach((c) => {
        strengthOf[c.name] = Number(c.strength) || 26;
        if (c.squad) squadOf[c.name] = c.squad;
      });
      const runter = t.bl5.slice(12).map((n) => ({
        name: n,
        staffel: (pool.find((c) => c.name === n) || {}).staffel || LOWER_STAFFEL[n] || "—",
        strength: strengthOf[n] || 22,
        squad: squadOf[n] || null,
      }));
      const regional = [...pool.filter((c) => newcomers.indexOf(c.name) < 0), ...runter];
      const st = (names) => names.map((n) => strengthOf[n] || 30);
      const sq = (names) => names.map((n) => squadOf[n] || makeSquad(n, strengthOf[n] || 30));

      return {
        ...d,
        cup: d.cup,
        history,
        regional,
        active: {
          bl1: newSeason(bl1Teams, st(bl1Teams), nextLabel(d.active.bl1.label), shiftYear(d.active.bl1.start, 1), sq(bl1Teams)),
          bl2: newSeason(bl2Teams, st(bl2Teams), nextLabel(d.active.bl2.label), shiftYear(d.active.bl2.start, 1), sq(bl2Teams)),
          bl3: newSeason(bl3Teams, st(bl3Teams), nextLabel(d.active.bl3.label), shiftYear(d.active.bl3.start, 1), sq(bl3Teams)),
          bl4: newSeason(bl4Teams, st(bl4Teams), nextLabel(d.active.bl4.label), shiftYear(d.active.bl4.start, 1), sq(bl4Teams)),
          bl5: newSeason(bl5Teams, st(bl5Teams), nextLabel(d.active.bl5.label), shiftYear(d.active.bl5.start, 1), sq(bl5Teams)),
        },
      };
    });
    setMd(ZERO_MD);
    setModal(null);
  };

  /* ---------------- Pokal ---------------- */

  const cup = data ? data.cup : null;
  const cupRoundIdx = cup ? Math.min(cupRound, cup.rounds.length - 1) : 0;
  const activeRound = cup ? cup.rounds[cupRoundIdx] : null;
  const lastRound = cup ? cup.rounds[cup.rounds.length - 1] : null;

  const startCup = (amateurs) => {
    setData((d) => ({ ...d, cup: newCup(d.active, amateurs, d.active.bl1.label) }));
    setCupRound(0);
    setModal(null);
  };

  /** Ergebnisse einer Runde ändern verwirft alle danach gezogenen Runden. */
  const editRound = (fn) => {
    updateCup((c) => {
      const rounds = c.rounds.map((r, i) => (i === cupRoundIdx ? fn(r) : r));
      return { ...c, rounds: rounds.slice(0, cupRoundIdx + 1) };
    });
  };

  const setCupScore = (gi, side, raw) => {
    const v = raw.replace(/[^0-9]/g, "").slice(0, 2);
    const key = side === "h" ? "hg" : "ag";
    editRound((r) => ({ ...r, games: r.games.map((g, k) => {
      if (k !== gi) return g;
      const e = { ...g, [key]: v };
      return { ...e, sc: trimGoals(e.sc, Number(e.hg) || 0, Number(e.ag) || 0) };
    }) }));
  };

  const bumpCupScore = (gi, side, delta) => {
    const key = side === "h" ? "hg" : "ag";
    const other = side === "h" ? "ag" : "hg";
    editRound((r) => ({
      ...r,
      games: r.games.map((g, k) => {
        if (k !== gi) return g;
        const now = g[key] === "" ? 0 : Number(g[key]);
        const e = {
          ...g,
          [key]: String(Math.max(0, Math.min(99, now + delta))),
          [other]: g[other] === "" ? "0" : g[other],
        };
        return { ...e, sc: trimGoals(e.sc, Number(e.hg) || 0, Number(e.ag) || 0) };
      }),
    }));
  };

  const setCupPen = (gi, side) => {
    editRound((r) => ({
      ...r,
      games: r.games.map((g, k) => (k === gi ? { ...g, pen: g.pen === side ? null : side } : g)),
    }));
  };

  const setCupStrength = (name, raw) => {
    const v = clampStrength(raw);
    const num = v === "" ? "" : Number(v);
    updateCup((c) => ({
      ...c,
      rounds: c.rounds.map((r) => ({
        ...r,
        games: r.games.map((g) => ({
          ...g,
          h: g.h.name === name ? { ...g.h, strength: num } : g.h,
          a: g.a.name === name ? { ...g.a, strength: num } : g.a,
        })),
      })),
    }));
  };

  const simulateCupRound = () => {
    editRound((r) => ({
      ...r,
      games: r.games.map((g) => {
        if (cupWinner(g)) return g;
        const [hg, ag] = simulateMatch(g.h.strength, g.a.strength, r.name === "Finale", drawShare, surprise,
          formationTilt(g.h.form), formationTilt(g.a.form));
        return {
          ...g, hg: String(hg), ag: String(ag),
          sc: makeGoals(g.h.squad, g.a.squad, hg, ag),
          pen: hg === ag ? shootout(g.h.strength, g.a.strength) : null,
        };
      }),
    }));
  };

  const simulateCupGame = (gi) => {
    editRound((r) => ({
      ...r,
      games: r.games.map((g, k) => {
        if (k !== gi) return g;
        const [hg, ag] = simulateMatch(g.h.strength, g.a.strength, r.name === "Finale", drawShare, surprise,
          formationTilt(g.h.form), formationTilt(g.a.form));
        return {
          ...g, hg: String(hg), ag: String(ag),
          sc: makeGoals(g.h.squad, g.a.squad, hg, ag),
          pen: hg === ag ? shootout(g.h.strength, g.a.strength) : null,
        };
      }),
    }));
  };

  const drawNextRound = () => {
    updateCup((c) => {
      const cur = c.rounds[c.rounds.length - 1];
      if (!roundComplete(cur) || c.rounds.length >= CUP_ROUNDS.length) return c;
      const winners = cur.games.map((g) => cupWinner(g));
      return {
        ...c,
        rounds: [...c.rounds, { name: CUP_ROUNDS[c.rounds.length], games: drawPairs(winners, c.seed + c.rounds.length * 31) }],
      };
    });
    setCupRound((r) => r + 1);
  };

  const cupChampion = useMemo(() => {
    if (!cup) return null;
    const last = cup.rounds[cup.rounds.length - 1];
    if (last.name !== "Finale") return null;
    return cupWinner(last.games[0]);
  }, [cup]);

  const closeCup = () => {
    setData((d) => {
      const c = d.cup;
      const entry = {
        scorers: scorerList(cupGames(c), squadIndex(LEAGUE_IDS.map((x) => d.active[x]))).slice(0, 10),
        id: `cup-${c.label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: "cup", leagueId: "cup", leagueName: "DFB-Pokal",
        label: c.label, closedAt: new Date().toISOString(),
        winner: cupChampion ? cupChampion.name : "—",
        rounds: c.rounds.map((r) => ({
          name: r.name,
          games: r.games.map((g) => ({ h: g.h.name, a: g.a.name, hg: g.hg, ag: g.ag, pen: g.pen })),
        })),
      };
      return { ...d, cup: null, history: [entry, ...d.history] };
    });
    setCupRound(0);
    setModal(null);
    setTab("hist");
  };

  /**
   * Neu beginnen: Mannschaften, Kader und Stärken bleiben unangetastet.
   * Zurückgesetzt werden Ergebnisse, Spielplan, Pokal, Historie und die Saison.
   */
  const neuBeginnen = () => {
    setData((d) => {
      const active = {};
      LEAGUE_IDS.forEach((id) => {
        const alt = d.active[id];
        active[id] = {
          ...alt,
          label: "2026/27",
          start: defaultStart(id, "2026/27"),
          seed: Math.floor(Math.random() * 1e9),
          results: {},
        };
      });
      return { ...d, active, cup: null, history: [] };
    });
    setMd(ZERO_MD);
    setCupRound(0);
    setOpenHist(null);
    setModal(null);
    setTab("bl1");
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tabellenrechner.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!ready) {
    return (
      <div className="lr">
        <style>{CSS}</style>
        <div className="lr-wrap" style={{ paddingTop: 60, color: "#96A093" }}>Daten werden geladen …</div>
      </div>
    );
  }

  const rootAccent =
    tab === "cup" ? accentVars(CUP_ACCENT)
      : tab === "cal" ? accentVars("#7FB5A0")
        : tab === "hist" ? accentVars("#C9C3B0")
          : accentVars(league.accent);

  return (
    <LogoCtx.Provider value={data.logos || NO_LOGOS}>
    <div className="lr" style={rootAccent}>
      <style>{CSS}</style>

      <div className="lr-top">
        <div className="lr-wrap">
          <div className="lr-top-in">
            <div>
              <h1 className="lr-title">Tabellenrechner</h1>
              <p className="lr-sub">
                Ergebnisse eintragen oder nach Stärke simulieren. Fünf Ligen, DFB-Pokal,
                Saisonabschluss mit Auf- und Abstieg — und alles bleibt in der Historie.
              </p>
            </div>
            <div className="lr-status">{status}</div>
          </div>

          <nav className="lr-tabs">
            {LEAGUES.map((l) => (
              <button key={l.id} className="lr-tab" data-on={tab === l.id ? "1" : "0"}
                style={tab === l.id ? accentVars(l.accent) : undefined} onClick={() => setTab(l.id)}>
                {l.name}
              </button>
            ))}
            <button className="lr-tab" data-on={tab === "cup" ? "1" : "0"}
              style={tab === "cup" ? accentVars(CUP_ACCENT) : undefined} onClick={() => setTab("cup")}>
              DFB-Pokal
            </button>
            <button className="lr-tab" data-on={tab === "top" ? "1" : "0"}
              style={tab === "top" ? accentVars("#D98C5F") : undefined} onClick={() => setTab("top")}>
              Torjäger
            </button>
            <button className="lr-tab" data-on={tab === "cal" ? "1" : "0"}
              style={tab === "cal" ? accentVars("#7FB5A0") : undefined} onClick={() => setTab("cal")}>
              Kalender
            </button>
            <button className="lr-tab" data-on={tab === "hist" ? "1" : "0"}
              style={tab === "hist" ? accentVars("#C9C3B0") : undefined} onClick={() => setTab("hist")}>
              Historie{data.history.length ? ` (${data.history.length})` : ""}
            </button>
          </nav>
        </div>
      </div>

      {isLeagueTab && season && (
        <div className="lr-wrap">
          <div className="lr-bar">
            <div className="lr-season">
              <input className="lr-season-in" value={season.label}
                onChange={(e) => updateSeason(league.id, (s) => ({ ...s, label: e.target.value }))}
                aria-label="Saison" />
              <span className="lr-tag">{playedGames} von {totalGames} Spielen</span>
            </div>
            <label className="lr-prog" style={{ display: "flex", alignItems: "center", gap: 5 }}>
              Saisonstart
              <input className="lr-jump" type="date" value={season.start} aria-label="Erster Spieltag"
                onChange={(e) => updateSeason(league.id, (x) => ({ ...x, start: e.target.value }))} />
            </label>
            <div className="lr-spacer" />
            <button className="lr-btn lr-btn-sm" onClick={() => setModal({ type: "teams" })}>Mannschaften &amp; Kader</button>
            <button className="lr-btn lr-btn-sm" onClick={() => setModal({ type: "draw" })}>Neu auslosen</button>
            <button className="lr-btn lr-btn-sm lr-btn-p" onClick={() => setModal({ type: "close" })}>Saison abschließen</button>
          </div>

          <div className="lr-md">
            <button className="lr-nav" onClick={() => setMd((m) => ({ ...m, [league.id]: Math.max(0, mdIdx - 1) }))}
              disabled={mdIdx === 0} aria-label="Vorheriger Spieltag">‹</button>
            <button className="lr-nav" onClick={() => setMd((m) => ({ ...m, [league.id]: Math.min(fixtures.length - 1, mdIdx + 1) }))}
              disabled={mdIdx >= fixtures.length - 1} aria-label="Nächster Spieltag">›</button>
            <div className="lr-md-num">
              {mdIdx + 1}. Spieltag <small>von {fixtures.length}</small>
              {mdDates[mdIdx] ? <div className="lr-md-date">{fmtLong(mdDates[mdIdx])}</div> : null}
            </div>
            <select className="lr-jump" value={mdIdx}
              onChange={(e) => setMd((m) => ({ ...m, [league.id]: Number(e.target.value) }))} aria-label="Spieltag wählen">
              {fixtures.map((_, i) => (
                <option key={i} value={i}>
                  {i + 1}. Spieltag{mdDates[i] ? ` — ${pad2(mdDates[i].getDate())}.${pad2(mdDates[i].getMonth() + 1)}.${mdDates[i].getFullYear()}` : ""}
                </option>
              ))}
            </select>
            <span className="lr-prog">{filledPerMd[mdIdx] || 0}/{currentMd.length} eingetragen</span>
            <div className="lr-spacer" />
            <label className="lr-prog" style={{ display: "flex", alignItems: "center", gap: 5 }}>
              Remis
              <select className="lr-jump" value={drawBias} aria-label="Neigung zu Unentschieden"
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
            <button className="lr-btn lr-btn-sm" onClick={() => simulateMatchday("one")}>Spieltag simulieren</button>
            <button className="lr-btn lr-btn-sm" onClick={() => simulateMatchday("all")}>Rest der Saison</button>
            <button className="lr-btn lr-btn-sm" onClick={fillSeasonGoals}>Alle Torschützen auslosen</button>
            <button className="lr-btn lr-btn-sm" onClick={clearMatchday}>Leeren</button>
          </div>

          <div className="lr-dots">
            {fixtures.map((round, i) => (
              <button key={i} className="lr-dot" data-on={i === mdIdx ? "1" : "0"}
                data-f={filledPerMd[i] === round.length ? "1" : "0"}
                onClick={() => setMd((m) => ({ ...m, [league.id]: i }))}
                title={`${i + 1}. Spieltag — ${filledPerMd[i]}/${round.length}`} />
            ))}
          </div>

          <div className="lr-grid">
            <section onKeyDown={enterToNext}>
              <h2 className="lr-sec-h">Partien</h2>
              <p className="lr-hint">
                Unter jedem Namen stehen Tabellenplatz und Stärke, beide direkt änderbar.
                „Spiel simulieren" würfelt eine einzelne Partie aus: der Stärkere gewinnt
                öfter, sicher ist er sich nie.
              </p>
              {currentMd.map(([h, a], gi) => {
                const r = season.results[`${mdIdx}:${gi}`] || { h: "", a: "" };
                const head = heads[gi];
                const done = parsedResult(season.results, mdIdx, gi);
                const hw = done && done[0] > done[1];
                const aw = done && done[1] > done[0];
                return (
                  <React.Fragment key={gi}>
                  {head ? <div className="lr-slot">{head}</div> : null}
                  <div className="lr-game">
                    <div className="lr-game-h">
                      <div className={`lr-name ${hw ? "lr-win" : aw ? "lr-lose" : ""}`}><Logo name={season.teams[h]} />{season.teams[h]}</div>
                      <TeamMeta rank={rankByIdx[h]} strength={season.strengths[h]}
                        name={season.teams[h]} onOpen={() => setModal({ type: "squad", team: h })} />
                    </div>
                    <div className="lr-mid">
                      <div className="lr-score">
                        <Stepper value={r.h} team={season.teams[h]} onBump={(d) => bumpScore(gi, "h", d)} />
                        <ScoreBox value={r.h} team={season.teams[h]} onType={(v) => setScore(gi, "h", v)} />
                        <span className="lr-colon">:</span>
                        <ScoreBox value={r.a} team={season.teams[a]} onType={(v) => setScore(gi, "a", v)} />
                        <Stepper value={r.a} team={season.teams[a]} onBump={(d) => bumpScore(gi, "a", d)} />
                      </div>
                      {done && sensation(done[0], done[1], season.strengths[h], season.strengths[a]) ? (
                        <span className="lr-sens">Sensation</span>
                      ) : null}
                      <button className="lr-sim" type="button" onClick={() => simulateOneGame(gi)}>
                        Spiel simulieren
                      </button>
                      {done ? (
                        <button className="lr-sim" type="button" onClick={() => setModal({ type: "goals", gi })}>
                          Torschützen{(r.sc || []).filter((g) => g.p).length ? ` (${(r.sc || []).filter((g) => g.p).length})` : ""}
                        </button>
                      ) : null}
                    </div>
                    <div className="lr-game-a">
                      <div className={`lr-name ${aw ? "lr-win" : hw ? "lr-lose" : ""}`}><Logo name={season.teams[a]} />{season.teams[a]}</div>
                      <TeamMeta rank={rankByIdx[a]} strength={season.strengths[a]}
                        name={season.teams[a]} onOpen={() => setModal({ type: "squad", team: a })} />
                    </div>
                  </div>
                  </React.Fragment>
                );
              })}
            </section>

            <section>
              <h2 className="lr-sec-h">Tabelle</h2>
              <Table rows={rows} leagueId={league.id} strengths={season.strengths} />
            </section>
          </div>
        </div>
      )}

      {tab === "cup" && (
        <div className="lr-wrap">
          {!cup && (
            <>
              <div className="lr-bar">
                <h2 className="disp" style={{ fontSize: 20 }}>DFB-Pokal</h2>
                <div className="lr-spacer" />
                <button className="lr-btn lr-btn-sm lr-btn-p" onClick={() => setModal({ type: "cupstart" })}>
                  Pokal starten
                </button>
              </div>
              <p className="lr-empty">
                64 Mannschaften: alle 18 aus der Bundesliga, alle 18 aus der 2. Bundesliga,
                alle 20 aus der 3. Liga und acht Landespokalsieger, deren Namen und Stärke du
                selbst festlegst. In der ersten Runde bekommt jeder Amateur einen Profi und
                Heimrecht, danach hat immer der Klub aus der tieferen Liga Heimvorteil. Bei
                Gleichstand entscheidet das Elfmeterschießen, das Finale zählt als neutraler Platz.
              </p>
            </>
          )}

          {cup && activeRound && (
            <>
              <div className="lr-bar">
                <div className="lr-season">
                  <span className="disp" style={{ fontSize: 20 }}>DFB-Pokal</span>
                  <span className="lr-tag">{cup.label}</span>
                </div>
                <div className="lr-spacer" />
                <label className="lr-prog" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  Remis
                  <select className="lr-jump" value={drawBias} aria-label="Neigung zu Unentschieden"
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
                <button className="lr-btn lr-btn-sm" onClick={simulateCupRound}>Runde simulieren</button>
                <button className="lr-btn lr-btn-sm" onClick={fillCupGoals}>Alle Torschützen auslosen</button>
                <button className="lr-btn lr-btn-sm" onClick={drawNextRound}
                  disabled={!roundComplete(lastRound) || cup.rounds.length >= CUP_ROUNDS.length || cupRoundIdx !== cup.rounds.length - 1}>
                  Nächste Runde auslosen
                </button>
                <button className="lr-btn lr-btn-sm lr-btn-p" disabled={!cupChampion}
                  onClick={() => setModal({ type: "cupclose" })}>Pokal abschließen</button>
                <button className="lr-btn lr-btn-sm" onClick={() => setModal({ type: "cupreset" })}>Neu starten</button>
              </div>

              <div className="lr-rounds">
                {CUP_ROUNDS.map((name, i) => (
                  <button key={name} className="lr-round-btn" data-on={i === cupRoundIdx ? "1" : "0"}
                    data-done={cup.rounds[i] && roundComplete(cup.rounds[i]) ? "1" : "0"}
                    disabled={!cup.rounds[i]} onClick={() => setCupRound(i)}>
                    {name}
                    {cup.rounds[i] ? ` · ${cup.rounds[i].games.filter((g) => cupWinner(g)).length}/${cup.rounds[i].games.length}` : ""}
                  </button>
                ))}
              </div>

              {cupChampion && (
                <div className="lr-champ-box">
                  <div className="lr-tag">Pokalsieger {cup.label}</div>
                  <div className="disp">{cupChampion.name}</div>
                </div>
              )}

              <section onKeyDown={enterToNext}>
                <h2 className="lr-sec-h">
                  {activeRound.name}
                  <span className="lr-slot-inline"> · {fmtLong(cupRoundDate(cup.label, cupRoundIdx))}</span>
                </h2>
                <p className="lr-hint">
                  Steht es unentschieden, wählst du den Sieger im Elfmeterschießen. Erst wenn
                  alle Partien entschieden sind, lässt sich die nächste Runde auslosen.
                </p>
                {activeRound.games.map((g, gi) => {
                  const w = cupWinner(g);
                  const drawn = g.hg !== "" && g.ag !== "" && Number(g.hg) === Number(g.ag);
                  return (
                    <div className="lr-game" key={gi}>
                      <div className="lr-game-h">
                        <div className={`lr-name ${w === g.h ? "lr-win" : w ? "lr-lose" : ""}`}><Logo name={g.h.name} />{g.h.name}</div>
                        <TeamMeta strength={g.h.strength} name={g.h.name}
                          onStrength={(v) => setCupStrength(g.h.name, v)} />
                      </div>
                      <div className="lr-mid">
                        <div className="lr-score">
                          <Stepper value={g.hg} team={g.h.name} onBump={(d) => bumpCupScore(gi, "h", d)} />
                          <ScoreBox value={g.hg} team={g.h.name} onType={(v) => setCupScore(gi, "h", v)} />
                          <span className="lr-colon">:</span>
                          <ScoreBox value={g.ag} team={g.a.name} onType={(v) => setCupScore(gi, "a", v)} />
                          <Stepper value={g.ag} team={g.a.name} onBump={(d) => bumpCupScore(gi, "a", d)} />
                        </div>
                        {w && sensation(Number(g.hg), Number(g.ag), g.h.strength, g.a.strength) ? (
                          <span className="lr-sens">Sensation</span>
                        ) : null}
                        <button className="lr-sim" type="button" onClick={() => simulateCupGame(gi)}>
                          Spiel simulieren
                        </button>
                        {g.hg !== "" && g.ag !== "" ? (
                          <button className="lr-sim" type="button" onClick={() => setModal({ type: "cupgoals", gi })}>
                            Torschützen{(g.sc || []).filter((x) => x.p).length ? ` (${(g.sc || []).filter((x) => x.p).length})` : ""}
                          </button>
                        ) : null}
                      </div>
                      <div className="lr-game-a">
                        <div className={`lr-name ${w === g.a ? "lr-win" : w ? "lr-lose" : ""}`}><Logo name={g.a.name} />{g.a.name}</div>
                        <TeamMeta strength={g.a.strength} name={g.a.name}
                          onStrength={(v) => setCupStrength(g.a.name, v)} />
                      </div>
                      {drawn && (
                        <div className="lr-pen">
                          <span className="lr-tag" style={{ alignSelf: "center" }}>Sieger n. E.:</span>
                          <button data-on={g.pen === "h" ? "1" : "0"} onClick={() => setCupPen(gi, "h")}>{g.h.name}</button>
                          <button data-on={g.pen === "a" ? "1" : "0"} onClick={() => setCupPen(gi, "a")}>{g.a.name}</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            </>
          )}
        </div>
      )}

      {tab === "top" && (
        <div className="lr-wrap">
        <section style={accentVars("#D98C5F")}>
          <h2>Torjäger</h2>
          <p className="lr-hint">
            Gezählt werden alle eingetragenen Torschützen der laufenden Saison. Wer ganz oben
            steht, ist am Saisonende Torschützenkönig und wandert in die Historie.
          </p>
          <div className="lr-top-grid">
          {[...LEAGUES.map((l) => ({
              key: l.id, name: l.name, accent: l.accent,
              liste: scorerList(
                seasonGames(data.active[l.id], makeFixtures(data.active[l.id].teams.length, data.active[l.id].seed)),
                squadIndex(LEAGUE_IDS.map((x) => data.active[x]))),
            })),
            { key: "cup", name: "DFB-Pokal", accent: CUP_ACCENT,
              liste: scorerList(cupGames(data.cup), squadIndex(LEAGUE_IDS.map((x) => data.active[x]))) },
          ].map((blk) => (
            <div key={blk.key}>
              <div className="lr-top-h" style={{ "--accent": blk.accent }}>
                <b>{blk.name}</b>
                <span>{blk.liste.length ? `${blk.liste.length} Torschützen` : ""}</span>
              </div>
              {blk.liste.length === 0 ? (
                <p className="lr-hint" style={{ margin: 0 }}>Noch keine Tore eingetragen.</p>
              ) : (
                <table className="lr-top-tbl">
                  <colgroup><col className="r" /><col /><col /><col className="g" /></colgroup>
                  <thead>
                    <tr><th /><th>Spieler</th><th className="v">Verein</th><th className="g">Tore</th></tr>
                  </thead>
                  <tbody>
                    {blk.liste.slice(0, 10).map((e, i) => (
                      <tr key={e.name}>
                        <td className="r">{i + 1}</td>
                        <td>{e.name}</td>
                        <td className="v">
                          {e.verein}
                          {e.vorher ? <span className="vor">{e.vorher}</span> : null}
                        </td>
                        <td className="g">{e.tore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
          </div>
        </section>
        </div>
      )}

      {tab === "cal" && (
        <div className="lr-wrap">
          <Kalender
            data={data}
            onJump={(leagueId, idx) => {
              if (leagueId === "cup") { setTab("cup"); setCupRound(idx); }
              else { setTab(leagueId); setMd((m) => ({ ...m, [leagueId]: idx })); }
            }}
          />
        </div>
      )}

      {tab === "hist" && (
        <div className="lr-wrap">
          <Historie history={data.history} open={openHist} setOpen={setOpenHist}
            onExport={exportJson} onReset={() => setModal({ type: "reset" })}
            onRestart={() => setModal({ type: "restart" })}
            onRegional={() => setModal({ type: "regional" })}
            onPromotion={() => setModal({ type: "promotion" })} />
        </div>
      )}

      {modal && modal.type === "teams" && season && (
        <TeamsModal season={season} leagueName={league.name} onClose={() => setModal(null)}
          logos={data.logos || NO_LOGOS} onLogo={setLogo} onFifa={applyFifa}
          onStrength={(i, ziel) => updateSeason(league.id, (s) => {
            const squads = [...s.squads];
            const strengths = [...s.strengths];
            squads[i] = scaleSquadTo(squads[i], ziel);
            strengths[i] = squadStrength(squads[i]);
            return { ...s, squads, strengths };
          })}
          onSave={(teams) => {
            moveLogos(season.teams, teams);
            updateSeason(league.id, (s) => ({ ...s, teams }));
            setModal(null);
          }}
          onSquad={(i, teams) => {
            moveLogos(season.teams, teams);
            updateSeason(league.id, (s) => ({ ...s, teams }));
            setModal({ type: "squad", team: i });
          }} />
      )}

      {modal && modal.type === "squad" && season && season.squads[modal.team] && (
        <SquadModal
          key={modal.team}
          name={season.teams[modal.team]}
          squad={season.squads[modal.team]}
          autoFocusStrength={!!modal.focus}
          onClose={() => setModal(null)}
          onSave={(sq) => { saveSquad(modal.team, sq); setModal(null); }}
          onNavigate={(sq, dir) => {
            const next = modal.team + dir;
            if (next < 0 || next >= season.teams.length) return false;
            saveSquad(modal.team, sq);
            setModal({ type: "squad", team: next, focus: true });
            return true;
          }}
        />
      )}

      {modal && modal.type === "draw" && (
        <Modal onClose={() => setModal(null)}>
          <h2>Spielplan neu auslosen</h2>
          <p>
            Die Paarungen werden neu gemischt. Alle eingetragenen Ergebnisse dieser Saison
            gehen dabei verloren, weil sie an den alten Paarungen hängen. Namen und
            Stärkewerte bleiben.
          </p>
          <div className="lr-modal-foot">
            <button className="lr-btn" onClick={() => setModal(null)}>Abbrechen</button>
            <button className="lr-btn lr-btn-p" onClick={() => {
              updateSeason(league.id, (s) => ({ ...s, seed: Math.floor(Math.random() * 1e9), results: {} }));
              setMd((m) => ({ ...m, [league.id]: 0 }));
              setModal(null);
            }}>Neu auslosen</button>
          </div>
        </Modal>
      )}

      {modal && modal.type === "close" && season && (
        <CloseModal league={league} season={season} rows={rows}
          playedGames={playedGames} totalGames={totalGames}
          onClose={() => setModal(null)} onConfirm={closeOne}
          onPromotion={() => setModal({ type: "promotion" })} />
      )}

      {modal && modal.type === "promotion" && (
        <PromotionModal data={data} onClose={() => setModal(null)} onConfirm={applyPromotion} />
      )}

      {modal && modal.type === "cupstart" && (
        <CupStartModal onClose={() => setModal(null)} onStart={startCup} regional={data.regional} unten={[data.active.bl4, data.active.bl5]} />
      )}

      {modal && modal.type === "cupclose" && cup && (
        <Modal onClose={() => setModal(null)}>
          <h2>Pokal abschließen</h2>
          <p>
            {cupChampion ? cupChampion.name : "—"} gewinnt den DFB-Pokal {cup.label}. Der
            komplette Turnierbaum wandert in die Historie, danach ist der Pokal wieder frei
            für eine neue Auslosung.
          </p>
          <div className="lr-modal-foot">
            <button className="lr-btn" onClick={() => setModal(null)}>Abbrechen</button>
            <button className="lr-btn lr-btn-p" onClick={closeCup}>In die Historie</button>
          </div>
        </Modal>
      )}

      {modal && modal.type === "cupreset" && (
        <Modal onClose={() => setModal(null)}>
          <h2>Pokal neu starten</h2>
          <p>Der laufende Wettbewerb wird verworfen und nicht in der Historie gespeichert.</p>
          <div className="lr-modal-foot">
            <button className="lr-btn" onClick={() => setModal(null)}>Abbrechen</button>
            <button className="lr-btn lr-btn-p" onClick={() => {
              setData((d) => ({ ...d, cup: null }));
              setCupRound(0);
              setModal(null);
            }}>Verwerfen</button>
          </div>
        </Modal>
      )}

      {modal && modal.type === "goals" && currentMd[modal.gi] && (
        <GoalsModal
          heim={season.teams[currentMd[modal.gi][0]]} gast={season.teams[currentMd[modal.gi][1]]}
          squadH={season.squads[currentMd[modal.gi][0]]} squadA={season.squads[currentMd[modal.gi][1]]}
          hg={Number((season.results[`${mdIdx}:${modal.gi}`] || {}).h) || 0}
          ag={Number((season.results[`${mdIdx}:${modal.gi}`] || {}).a) || 0}
          sc={(season.results[`${mdIdx}:${modal.gi}`] || {}).sc}
          onClose={() => setModal(null)} onSave={(sc) => saveGoals(modal.gi, sc)} />
      )}

      {modal && modal.type === "cupgoals" && cup && cup.rounds[cupRoundIdx] &&
        cup.rounds[cupRoundIdx].games[modal.gi] && (() => {
          const g = cup.rounds[cupRoundIdx].games[modal.gi];
          return (
            <GoalsModal heim={g.h.name} gast={g.a.name} squadH={g.h.squad} squadA={g.a.squad}
              hg={Number(g.hg) || 0} ag={Number(g.ag) || 0} sc={g.sc}
              onClose={() => setModal(null)} onSave={(sc) => saveCupGoals(modal.gi, sc)} />
          );
        })()}

      {modal && modal.type === "regional" && (
        <RegionalModal regional={data.regional || []} onClose={() => setModal(null)}
          onSave={(list) => { setData((d) => ({ ...d, regional: list })); setModal(null); }} />
      )}

      {modal && modal.type === "restart" && (
        <Modal onClose={() => setModal(null)}>
          <h2>Saison 2026/27 neu beginnen</h2>
          <p>
            Die Historie wird geleert, alle Ergebnisse gelöscht, ein laufender Pokal
            verworfen, und alle fünf Ligen stehen wieder am ersten Spieltag der Saison
            2026/27. Der Spielplan wird dabei neu ausgelost.
          </p>
          <p style={{ marginBottom: 0 }}>
            Unangetastet bleiben, wer in welcher Liga spielt, alle Kader mit ihren Spielern
            und Positionen, die Stärkewerte und deine Einstellungen zu Remis und
            Überraschungen.
          </p>
          <div className="lr-modal-foot">
            <button className="lr-btn" onClick={() => setModal(null)}>Abbrechen</button>
            <button className="lr-btn lr-btn-p" onClick={neuBeginnen}>Neu beginnen</button>
          </div>
        </Modal>
      )}

      {modal && modal.type === "reset" && (
        <Modal onClose={() => setModal(null)}>
          <h2>Alles zurücksetzen</h2>
          <p>
            Löscht laufende Saisons, den Pokal und die komplette Historie und startet neu mit
            der Saison 2026/27. Vorher am besten exportieren.
          </p>
          <div className="lr-modal-foot">
            <button className="lr-btn" onClick={() => setModal(null)}>Abbrechen</button>
            <button className="lr-btn lr-btn-p" onClick={() => {
              setData(freshData());
              setMd(ZERO_MD);
              setCupRound(0);
              setOpenHist(null);
              setModal(null);
            }}>Alles zurücksetzen</button>
          </div>
        </Modal>
      )}
    </div>
    </LogoCtx.Provider>
  );
}

/* ================================================================== */
/*  Dialoge                                                           */
/* ================================================================== */

/** Stärke einer Mannschaft direkt in der Liste eintragen; Tab springt zur nächsten Mannschaft. */
function StrengthCell({ value, index, onSet }) {
  const [txt, setTxt] = useState(String(value));
  useEffect(() => { setTxt(String(value)); }, [value]);
  const commit = () => {
    const z = parseInt(txt, 10);
    if (!Number.isFinite(z)) { setTxt(String(value)); return; }
    const ziel = Math.max(1, Math.min(100, z));
    setTxt(String(ziel));
    if (ziel !== value) onSet(index, ziel);
  };
  const key = (e) => {
    if (e.key !== "Tab" && e.key !== "Enter") return;
    commit();
    const alle = [...e.currentTarget.closest(".lr-modal, [role=dialog], body").querySelectorAll("input.lr-team-str")];
    const ziel = alle[alle.indexOf(e.currentTarget) + (e.shiftKey ? -1 : 1)];
    if (ziel) { e.preventDefault(); ziel.focus(); }
    else if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
  };
  return (
    <input className="lr-team-str" type="number" min="1" max="100" value={txt}
      aria-label={`Stärke ${index + 1}`} data-str={index}
      onChange={(e) => setTxt(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={commit} onKeyDown={key} />
  );
}

function TeamsModal({ season, leagueName, onClose, onSave, onSquad, logos, onLogo, onFifa, onStrength }) {
  const [fifaStep, setFifaStep] = useState(0);
  const [fifaMsg, setFifaMsg] = useState("");
  const [fehler, setFehler] = useState("");
  const [hinweis, setHinweis] = useState("");
  const bulk = async (fileList) => {
    const files = [...(fileList || [])].filter((f) => /^image\//.test(f.type) || /\.(png|jpe?g|webp|svg|gif)$/i.test(f.name));
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
  const pick = async (name, file) => {
    if (!file) return;
    try { onLogo(name, await logoFromFile(file)); setFehler(""); }
    catch (e) { setFehler("Das Bild konnte nicht gelesen werden. Bitte PNG, JPG oder WebP wählen."); }
  };
  const [names, setNames] = useState([...season.teams]);
  const bad = names.some((n) => !n.trim());
  const sauber = () => names.map((n) => n.trim());
  return (
    <Modal onClose={onClose}>
      <h2>{leagueName} — Mannschaften</h2>
      <p>
        Die Stärke trägst du hier direkt ein, mit Tab kommst du zur nächsten Mannschaft
        (Umschalt+Tab zurück). Auch Enter geht zur nächsten Mannschaft. Alle Spieler des Kaders werden dabei passend verschoben.
        Über „Kader" öffnest du die achtzehn Spieler einer Mannschaft und änderst dort
        Namen, Positionen und Einzelstärken. Namen der Vereine zu ändern ist gefahrlos,
        Spielplan und Ergebnisse hängen an der Position in der Liste.
      </p>
      <div className="lr-bulk lr-fifa">
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
      <div className="lr-bulk" onDragOver={(e) => e.preventDefault()}
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
          </span>
          <StrengthCell value={season.strengths[i]} index={i} onSet={onStrength} />
          <button className="lr-btn lr-btn-sm" disabled={bad}
            onClick={() => onSquad(i, sauber())}>Kader</button>
        </div>
      ))}
      <div className="lr-modal-foot">
        <button className="lr-btn" onClick={onClose}>Abbrechen</button>
        <button className="lr-btn lr-btn-p" disabled={bad} onClick={() => onSave(sauber())}>
          Übernehmen
        </button>
      </div>
    </Modal>
  );
}

/** Spielfeld mit der Startelf in den Linien der Formation. */
function Pitch({ squad, sel, onPick }) {
  const { gk, linien } = pitchRows(squad);
  const W = 320;
  const H = 420;
  const list = playersOf(squad);

  const reihenY = [];
  const R = linien.length;
  for (let i = 0; i < R; i++) reihenY.push(320 - (i * 250) / Math.max(1, R - 1));

  const chip = (idx, x, y) => {
    if (idx == null) return null;
    const pl = list[idx];
    if (!pl) return null;
    const aktiv = sel === idx;
    const teile = String(pl.n).trim().split(/\s+/);
    const kurz = teile[teile.length - 1].slice(0, 11);
    return (
      <g key={idx} className="lr-chip" onClick={() => onPick(idx)} role="button"
         aria-label={`${pl.n}, Stärke ${pl.s}`}>
        <circle cx={x} cy={y} r="17"
          fill={aktiv ? "var(--accent)" : "var(--board-2)"}
          stroke={aktiv ? "var(--accent)" : "rgba(233,229,216,0.5)"} strokeWidth="1.5" />
        <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="600"
          fill={aktiv ? "#fff" : "var(--chalk)"} fontFamily="'Oswald', sans-serif">{pl.s}</text>
        <text x={x} y={y + 30} textAnchor="middle" fontSize="9" fill="var(--chalk-dim)">{kurz}</text>
      </g>
    );
  };

  return (
    <svg className="lr-pitch" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Aufstellung">
      <rect x="6" y="6" width={W - 12} height={H - 12} rx="4"
        fill="rgba(63,203,142,0.05)" stroke="rgba(233,229,216,0.22)" />
      <line x1="6" y1={H / 2} x2={W - 6} y2={H / 2} stroke="rgba(233,229,216,0.16)" />
      <circle cx={W / 2} cy={H / 2} r="42" fill="none" stroke="rgba(233,229,216,0.16)" />
      <rect x={W / 2 - 66} y={H - 60} width="132" height="54"
        fill="none" stroke="rgba(233,229,216,0.16)" />
      <rect x={W / 2 - 66} y="6" width="132" height="54"
        fill="none" stroke="rgba(233,229,216,0.16)" />

      {chip(gk, W / 2, 372)}
      {linien.map((reihe, ri) =>
        reihe.map((idx, k) => chip(idx, (W * (k + 1)) / (reihe.length + 1), reihenY[ri]))
      )}
    </svg>
  );
}

function SquadModal({ name, squad, onClose, onSave, onNavigate, autoFocusStrength }) {
  const [sq, setSq] = useState({ f: squad.f, p: squad.p.map((pl) => ({ ...pl })) });

  const upd = (i, key, val) =>
    setSq((c) => ({ ...c, p: c.p.map((pl, j) => (j === i ? { ...pl, [key]: val } : pl)) }));

  const xi = startersOf(sq);
  const bank = benchOf(sq);
  const staerke = squadStrength(sq);
  const unvollstaendig = sq.p.some((pl) => pl.s === "" || !String(pl.n).trim());

  const [sel, setSel] = useState(null);
  const [importOffen, setImportOffen] = useState(false);
  const [zielStr, setZielStr] = useState(String(staerke));
  useEffect(() => { setZielStr(String(staerke)); }, [staerke]);

  const staerkeUebernehmen = () => {
    const z = parseInt(zielStr, 10);
    if (!Number.isFinite(z)) { setZielStr(String(staerke)); return sq; }
    const ziel = Math.max(1, Math.min(100, z));
    const neu = ziel !== staerke ? scaleSquadTo(sq, ziel) : sq;
    if (neu !== sq) setSq(neu);
    setZielStr(String(ziel));
    return neu;
  };
  /** Tab springt zur nächsten Mannschaft (Umschalt+Tab zur vorherigen) und übernimmt die Stärke. */
  const tabWeiter = (e) => {
    if (e.key !== "Tab" && e.key !== "Enter") return;
    if (!onNavigate) { if (e.key === "Enter") e.currentTarget.blur(); return; }
    const neu = staerkeUebernehmen();
    if (unvollstaendig) return;
    if (onNavigate(neu, e.shiftKey && e.key === "Tab" ? -1 : 1)) e.preventDefault();
  };
  const [text, setText] = useState("");
  const erkannt = importOffen ? parseSquadText(text) : [];

  const pick = (i) => {
    if (sel == null) { setSel(i); return; }
    if (sel === i) { setSel(null); return; }
    setSq(swapPlayers(sq, sel, i));
    setSel(null);
  };

  const liste = (bench) =>
    sq.p
      .map((pl, i) => ({ pl, i }))
      .filter((x) => !!x.pl.b === bench)
      .sort((a, b) =>
        POSITIONS.indexOf(a.pl.p) - POSITIONS.indexOf(b.pl.p) ||
        (Number(b.pl.s) || 0) - (Number(a.pl.s) || 0));

  const zeile = ({ pl, i }, bench) => (
    <div className="lr-pl-row" key={i}>
      <select className="lr-team-in" value={pl.p} aria-label={`Position ${pl.n}`}
        onChange={(e) => upd(i, "p", e.target.value)}>
        {POSITIONS.map((k) => <option key={k} value={k}>{k}</option>)}
      </select>
      <input className="lr-team-in" value={pl.n} aria-label={`Name Spieler ${i + 1}`}
        onChange={(e) => upd(i, "n", e.target.value)} />
      <input className="lr-team-in num" value={pl.s} inputMode="numeric"
        aria-label={`Stärke ${pl.n}`} onFocus={(e) => e.target.select()}
        onChange={(e) => { const v = clampPlayer(e.target.value); upd(i, "s", v === "" ? "" : Number(v)); }} />
      {bench ? (
        <button className="lr-btn lr-btn-sm" data-on={sel === i ? "1" : "0"}
          onClick={() => (sel == null ? setSq(swapIn(sq, i)) : pick(i))}>
          {sel == null ? "Einwechseln" : "hierher"}
        </button>
      ) : (
        <button className="lr-btn lr-btn-sm" data-on={sel === i ? "1" : "0"} onClick={() => pick(i)}>
          {sel === i ? "gewählt" : "tauschen"}
        </button>
      )}
    </div>
  );

  return (
    <Modal onClose={onClose}>
      <h2>Kader — {name}</h2>
      <p>
        Achtzehn Spieler, elf davon in der Startelf und sieben auf der Bank. Die Stärke
        geht von 1 bis 100. Daraus errechnet sich die Teamstärke: die Startelf zählt zu
        88 Prozent, die Bank zu 12 — Kadertiefe zählt also mit, entscheidet aber nicht.
        Es geht auch andersherum: Teamstärke eintragen, dann werden alle Spieler
        gleichmäßig angehoben oder abgesenkt, das Kräfteverhältnis bleibt erhalten.
      </p>

      <div className="lr-squad-stats">
        <div className="lr-stat"><b>{Math.round(avgStr(xi) * 10) / 10}</b><span>Ø Startelf</span></div>
        <div className="lr-stat"><b>{Math.round(avgStr(bank) * 10) / 10}</b><span>Ø Bank</span></div>
        <div className="lr-stat lr-stat-main">
          <input className="lr-team-str" type="number" min="1" max="100" value={zielStr}
            aria-label="Teamstärke" id="team-staerke" autoFocus={!!autoFocusStrength}
            onChange={(e) => setZielStr(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={staerkeUebernehmen}
            onKeyDown={tabWeiter} />
          <span>Teamstärke</span>
        </div>
        <div className="lr-spacer" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
          <label className="lr-prog" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            Formation
            <select className="lr-jump" value={sq.f} aria-label="Formation"
              onChange={(e) => setSq(autoLineup({ ...sq, f: e.target.value }))}>
              {Object.keys(FORMATIONS).map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <button className="lr-btn lr-btn-sm" onClick={() => setSq(autoLineup(sq))}>
            Beste Elf aufstellen
          </button>
        </div>
      </div>

      <div className="lr-pl-sec">
        <span>Kaderliste einfügen</span>
        <button className="lr-btn lr-btn-sm" onClick={() => setImportOffen(!importOffen)}>
          {importOffen ? "schließen" : "öffnen"}
        </button>
      </div>
      {importOffen && (
        <div>
          <p style={{ marginBottom: 8 }}>
            Kader von einer Seite wie kicker.de oder Transfermarkt kopieren und hier
            einfügen — ein Spieler pro Zeile. Rückennummer und Position werden erkannt,
            egal ob durch Semikolon, Tabulator oder Leerzeichen getrennt. Steht am Ende
            einer Zeile eine Zahl von 1 bis 100, wird sie als Stärke übernommen,
            sonst bleibt die des bisherigen Spielers auf dem Platz stehen. Gib die Stärken
            am besten für alle Spieler an oder für keinen — gemischt treffen zwei
            verschiedene Maßstäbe aufeinander und die Aufstellung wird schief.
          </p>
          <textarea
            className="lr-import"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"1 TW Max Müller 84\nAbwehr; Jonas Weber; 79\nLukas Schmidt"}
            aria-label="Kaderliste einfügen"
          />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <span className="lr-tag">
              {erkannt.length} {erkannt.length === 1 ? "Spieler" : "Spieler"} erkannt
              {erkannt.length > sq.p.length ? ` — nur die ersten ${sq.p.length} werden übernommen` : ""}
            </span>
            <div className="lr-spacer" />
            <button className="lr-btn lr-btn-sm" disabled={!erkannt.length}
              onClick={() => { setSq(applySquadImport(sq, erkannt)); setText(""); setImportOffen(false); }}>
              In den Kader übernehmen
            </button>
          </div>
        </div>
      )}

      <div className="lr-pl-sec">
        <span>Aufstellung</span>
        <span className="lr-tag">{sq.f} · {tiltLabel(sq.f)}</span>
      </div>
      <Pitch squad={sq} sel={sel} onPick={pick} />
      <p className="lr-hint" style={{ paddingTop: 0 }}>
        {sel == null
          ? "Auf einen Spieler tippen, dann auf einen zweiten: zwei Startspieler tauschen die Position, ein Ersatzspieler kommt für den Angetippten ins Team."
          : `${sq.p[sel].n} ist ausgewählt — jetzt den Tauschpartner antippen.`}
      </p>

      <div className="lr-pl-sec">
        <span>Startelf</span>
        <span className="lr-tag">{xi.length} von {XI_SIZE}</span>
      </div>
      <div className="lr-pl-head"><span>Pos</span><span>Spieler</span><span>Stk</span><span /></div>
      {liste(false).map((x) => zeile(x, false))}

      <div className="lr-pl-sec">
        <span>Bank</span>
        <span className="lr-tag">{bank.length} von {BENCH_SIZE}</span>
      </div>
      <div className="lr-pl-head"><span>Pos</span><span>Spieler</span><span>Stk</span><span /></div>
      {liste(true).map((x) => zeile(x, true))}

      <div className="lr-modal-foot">
        <button className="lr-btn" onClick={onClose}>Abbrechen</button>
        <button className="lr-btn lr-btn-p" disabled={unvollstaendig}
          onClick={() => onSave({ f: sq.f, p: sq.p.map((pl) => ({ ...pl, n: String(pl.n).trim(), s: Number(pl.s) })) })}>
          Kader übernehmen
        </button>
      </div>
    </Modal>
  );
}

function CloseModal({ league, season, rows, playedGames, totalGames, onClose, onConfirm, onPromotion }) {
  const n = rows.length;
  const champ = rows[0];
  const upDown = [];
  if (league.id === "bl1") {
    upDown.push(["Relegation", [rows[n - 3]]]);
    upDown.push(["Absteiger", [rows[n - 2], rows[n - 1]]]);
  } else if (league.id === "bl4" || league.id === "bl5") {
    upDown.push(["Aufsteiger", rows.slice(0, 4)]);
    upDown.push(["Absteiger", rows.slice(n - 4)]);
  } else {
    upDown.push(["Aufsteiger", [rows[0], rows[1]]]);
    upDown.push(["Relegation", league.id === "bl2" ? [rows[2], rows[n - 3]] : [rows[2]]]);
    upDown.push(["Absteiger", league.id === "bl2" ? [rows[n - 2], rows[n - 1]] : rows.slice(n - 4)]);
  }
  return (
    <Modal onClose={onClose}>
      <h2>{league.name} {season.label} abschließen</h2>
      <p>
        {playedGames < totalGames
          ? `Es fehlen noch ${totalGames - playedGames} Spiele. Die Abschlusstabelle wird trotzdem so gespeichert, wie sie gerade steht.`
          : "Alle Spiele sind eingetragen."}
      </p>
      <div style={{ borderTop: "1px solid rgba(233,229,216,0.22)", paddingTop: 14 }}>
        <div style={{ fontSize: 13, marginBottom: 12 }}>
          <span style={{ color: "#96A093" }}>{league.id === "bl1" ? "Meister" : "Erster"}:</span>{" "}
          <b>{champ ? champ.name : "—"}</b>{" "}
          <span style={{ color: "#96A093" }}>{champ ? `${champ.pkt} Punkte` : ""}</span>
        </div>
        {upDown.map(([title, list]) => (
          <div key={title} style={{ fontSize: 13, marginBottom: 8, color: "#96A093" }}>
            {title}: <span style={{ color: "#E9E5D8" }}>
              {list.filter(Boolean).map((r) => r.name).join(", ") || "—"}
            </span>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 18, marginBottom: 0 }}>
        Die Saison wandert in die Historie, danach startet {league.name} {nextLabel(season.label)}{" "}
        mit denselben Mannschaften, ihren Stärkewerten und einem neuen Spielplan. Für echten
        Auf- und Abstieg nimm den zweiten Knopf.
      </p>
      <div className="lr-modal-foot">
        <button className="lr-btn" onClick={onClose}>Abbrechen</button>
        <button className="lr-btn" onClick={onPromotion}>Alle Ligen mit Auf- und Abstieg</button>
        <button className="lr-btn lr-btn-p" onClick={onConfirm}>Nur diese Liga abschließen</button>
      </div>
    </Modal>
  );
}

function PromotionModal({ data, onClose, onConfirm }) {
  const tables = useMemo(() => {
    const t = {};
    LEAGUE_IDS.forEach((id) => {
      const s = data.active[id];
      t[id] = computeTable(s.teams, makeFixtures(s.teams.length, s.seed), s.results).map((r) => r.name);
    });
    return t;
  }, [data]);

  const [duelA, setDuelA] = useState("stay");
  const [duelB, setDuelB] = useState("stay");
  const pool = data.regional || [];
  const [newcomers, setNewcomers] = useState(() => topAufsteiger(pool, 4));
  const bad = newcomers.some((n) => !n) || new Set(newcomers).size !== 4;
  const upd = (i, v) => setNewcomers((c) => c.map((x, j) => (j === i ? v : x)));
  const staerke = (n) => (pool.find((c) => c.name === n) || {}).strength;

  return (
    <Modal onClose={onClose}>
      <h2>Alle Ligen abschließen</h2>
      <p>
        Die fünf Abschlusstabellen wandern in die Historie, danach werden die Ligen neu
        besetzt. Stärkewerte nehmen die Mannschaften mit in ihre neue Liga. In der 3., 4. und
        5. Liga steigen jeweils die ersten vier auf und die letzten vier ab.
      </p>

      <div className="lr-duel">
        <div className="lr-duel-h">Relegation zur Bundesliga — wer spielt nächste Saison erstklassig?</div>
        <div className="lr-choice">
          <button data-on={duelA === "stay" ? "1" : "0"} onClick={() => setDuelA("stay")}>
            {tables.bl1[15] || "—"}<br />
            <span style={{ fontSize: 11, opacity: 0.7 }}>16. der Bundesliga bleibt oben</span>
          </button>
          <button data-on={duelA === "up" ? "1" : "0"} onClick={() => setDuelA("up")}>
            {tables.bl2[2] || "—"}<br />
            <span style={{ fontSize: 11, opacity: 0.7 }}>3. der 2. Bundesliga steigt auf</span>
          </button>
        </div>
      </div>

      <div className="lr-duel">
        <div className="lr-duel-h">Relegation zur 2. Bundesliga — wer spielt nächste Saison zweitklassig?</div>
        <div className="lr-choice">
          <button data-on={duelB === "stay" ? "1" : "0"} onClick={() => setDuelB("stay")}>
            {tables.bl2[15] || "—"}<br />
            <span style={{ fontSize: 11, opacity: 0.7 }}>16. der 2. Bundesliga bleibt</span>
          </button>
          <button data-on={duelB === "up" ? "1" : "0"} onClick={() => setDuelB("up")}>
            {tables.bl3[2] || "—"}<br />
            <span style={{ fontSize: 11, opacity: 0.7 }}>3. der 3. Liga steigt auf</span>
          </button>
        </div>
      </div>

      <div className="lr-duel">
        <div className="lr-duel-h">
          Vier Nachrücker aus den Regionalligen
          <div style={{ fontWeight: 400, fontSize: 12, opacity: 0.75, marginTop: 2 }}>
            Sie ersetzen {tables.bl5.slice(12).join(", ")} — diese vier wandern zurück in den
            Regionalliga-Topf und können später wieder nachrücken.
          </div>
        </div>
        <div className="lr-team-head"><span>Mannschaft</span><span>Stärke</span></div>
        {newcomers.map((n, i) => (
          <div className="lr-team-row" key={i}>
            <select className="lr-team-in" value={n} aria-label={`Nachrücker ${i + 1}`}
              onChange={(e) => upd(i, e.target.value)}>
              {pool.map((c) => (
                <option key={c.name} value={c.name}>{c.name} ({c.staffel})</option>
              ))}
            </select>
            <input className="lr-team-in num" value={staerke(n) ?? ""} readOnly
              aria-label={`Stärke Nachrücker ${i + 1}`} />
          </div>
        ))}
        {bad && <p style={{ margin: "6px 0 0", fontSize: 12 }}>Bitte vier verschiedene Vereine wählen.</p>}
      </div>

      <div className="lr-modal-foot">
        <button className="lr-btn" onClick={onClose}>Abbrechen</button>
        <button className="lr-btn lr-btn-p" disabled={bad}
          onClick={() => onConfirm(duelA, duelB, newcomers)}>
          Abschließen und neu besetzen
        </button>
      </div>
    </Modal>
  );
}

function GoalsModal({ heim, gast, squadH, squadA, hg, ag, sc, onClose, onSave }) {
  const namen = (q) => playersOf(q || { p: [] }).map((pl) => pl.n);
  const start = (seite, anzahl) => {
    const da = (sc || []).filter((g) => g.t === seite);
    return Array.from({ length: anzahl }, (_, i) => ({
      t: seite,
      p: (da[i] && da[i].p) || "",
      m: (da[i] && da[i].m != null) ? String(da[i].m) : "",
    }));
  };
  const [tore, setTore] = useState(() => [...start("h", hg), ...start("a", ag)]);
  const upd = (i, k, v) => setTore((c) => c.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const zeile = (g, i) => (
    <div className="lr-team-row" key={i} style={{ gridTemplateColumns: "70px 1fr 56px" }}>
      <span className="lr-prog" style={{ alignSelf: "center" }}>{g.t === "h" ? "Heim" : "Gast"}</span>
      <select className="lr-team-in" value={g.p} aria-label={`Torschütze ${i + 1}`}
        onChange={(e) => upd(i, "p", e.target.value)}>
        <option value="">— unbekannt —</option>
        {namen(g.t === "h" ? squadH : squadA).map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <input className="lr-team-in num" value={g.m} inputMode="numeric" placeholder="Min."
        aria-label={`Minute ${i + 1}`} onFocus={(e) => e.target.select()}
        onChange={(e) => upd(i, "m", e.target.value.replace(/[^0-9]/g, "").slice(0, 3))} />
    </div>
  );

  return (
    <Modal onClose={onClose}>
      <h2>Torschützen — {heim} {hg}:{ag} {gast}</h2>
      <p>
        Für jedes Tor ein Spieler und die Minute. Offen gelassene Tore zählen in keiner
        Torschützenliste mit, das Ergebnis bleibt davon unberührt.
      </p>
      {tore.length === 0 ? <p style={{ margin: 0 }}>Torloses Spiel — nichts einzutragen.</p> : null}
      {tore.map(zeile)}
      <div className="lr-modal-foot">
        {tore.length ? (
          <button className="lr-btn" onClick={() => {
            const gefuellt = fillGoals(
              tore.filter((g) => g.p).map((g) => ({ t: g.t, p: g.p, m: Number(g.m) || 0 })),
              squadH, squadA, hg, ag);
            setTore([...gefuellt.filter((g) => g.t === "h"), ...gefuellt.filter((g) => g.t === "a")]
              .map((g) => ({ t: g.t, p: g.p, m: String(g.m) })));
          }}>
            Offene auslosen
          </button>
        ) : null}
        <div className="lr-spacer" />
        <button className="lr-btn" onClick={onClose}>Abbrechen</button>
        <button className="lr-btn lr-btn-p"
          onClick={() => onSave(tore
            .filter((g) => g.p || g.m !== "")
            .map((g) => ({ t: g.t, p: g.p, m: Number(g.m) || 0 }))
            .sort((x, y) => x.m - y.m))}>
          Übernehmen
        </button>
      </div>
    </Modal>
  );
}

function RegionalModal({ regional, onClose, onSave }) {
  const [list, setList] = useState(regional.map((c) => ({ ...c, strength: String(c.strength) })));
  const upd = (i, k, v) => setList((c) => c.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const del = (i) => setList((c) => c.filter((_, j) => j !== i));
  const add = () => setList((c) => [...c, { name: "Neuer Verein", staffel: "Nord", strength: "22", squad: null }]);
  const bad = list.some((c) => !c.name.trim() || c.strength === "");

  return (
    <Modal onClose={onClose}>
      <h2>Regionalliga-Topf</h2>
      <p>
        Das sind die Vereine unterhalb der 5. Liga. Nach jeder Saison rücken vier von ihnen in
        die 5. Liga nach, und für den DFB-Pokal werden Landespokalsieger gezogen. Wer aus der
        5. Liga absteigt, landet automatisch wieder hier — mit seinem Kader, damit er bei einer
        Rückkehr vollständig ist.
      </p>
      <div className="lr-team-head"><span>Verein</span><span>Staffel</span><span>Stärke</span><span /></div>
      {list.map((c, i) => (
        <div className="lr-team-row" key={i} style={{ gridTemplateColumns: "1fr 110px 52px 40px" }}>
          <input className="lr-team-in" value={c.name} aria-label={`Verein ${i + 1}`}
            onChange={(e) => upd(i, "name", e.target.value)} />
          <select className="lr-team-in" value={c.staffel} aria-label={`Staffel ${i + 1}`}
            onChange={(e) => upd(i, "staffel", e.target.value)}>
            {STAFFELN.map((st) => <option key={st} value={st}>{st}</option>)}
            <option value="—">—</option>
          </select>
          <input className="lr-team-in num" value={c.strength} inputMode="numeric"
            aria-label={`Stärke ${i + 1}`} onFocus={(e) => e.target.select()}
            onChange={(e) => upd(i, "strength", clampStrength(e.target.value))} />
          <button className="lr-btn lr-btn-sm" onClick={() => del(i)} aria-label={`${c.name} entfernen`}>×</button>
        </div>
      ))}
      <div className="lr-modal-foot">
        <button className="lr-btn" onClick={add}>Verein hinzufügen</button>
        <div className="lr-spacer" />
        <button className="lr-btn" onClick={onClose}>Abbrechen</button>
        <button className="lr-btn lr-btn-p" disabled={bad}
          onClick={() => onSave(list.map((c) => ({ ...c, name: c.name.trim(), strength: Number(c.strength) })))}>
          Übernehmen
        </button>
      </div>
    </Modal>
  );
}

function CupStartModal({ onClose, onStart, regional, unten }) {
  // Kandidaten für die Landespokalsieger: 4. Liga, 5. Liga und Regionalliga-Topf.
  const vierte = (unten || []).filter(Boolean).flatMap((bl4) => bl4.teams.map((name, i) => ({ name, staffel: LOWER_STAFFEL[name] || (REGIONAL_CLUBS.find((c) => c.name === name) || {}).staffel || "—", strength: Number(bl4.strengths[i]) || 22 })));
  const gesamt = [...vierte, ...(regional || [])];
  const pool = gesamt.length ? gesamt : null;
  const ziehen = () => {
    if (!pool) return DEFAULT_AMATEURS.map((n, i) => ({ name: n, strength: String(24 - i) }));
    // Je Staffel möglichst einer, danach aufgefüllt — wie echte Landespokalsieger.
    const rnd = mulberry32(Math.floor(Math.random() * 1e9));
    const misch = [...pool].sort(() => rnd() - 0.5);
    const gewaehlt = [];
    STAFFELN.forEach((st) => {
      const c = misch.find((x) => x.staffel === st && gewaehlt.indexOf(x) < 0);
      if (c) gewaehlt.push(c);
    });
    misch.forEach((c) => { if (gewaehlt.length < 8 && gewaehlt.indexOf(c) < 0) gewaehlt.push(c); });
    return gewaehlt.slice(0, 8).map((c) => ({ name: c.name, strength: String(c.strength) }));
  };
  const [amateurs, setAmateurs] = useState(ziehen);
  const bad = amateurs.some((a) => !a.name.trim() || a.strength === "");
  const upd = (i, k, v) => setAmateurs((c) => c.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <Modal onClose={onClose}>
      <h2>DFB-Pokal auslosen</h2>
      <p>
        Die 56 Klubs der drei Profiligen sind gesetzt, mit ihren aktuellen Stärkewerten. Dazu
        kommen acht Landespokalsieger, gezogen aus der 4. Liga, der 5. Liga und dem Regionalliga-Topf —
        überschreiben kannst du sie trotzdem.
      </p>
      <div className="lr-pl-sec">
        <span>Acht Vereine aus 4. Liga, 5. Liga und Regionalligen</span>
        <button className="lr-btn lr-btn-sm" onClick={() => setAmateurs(ziehen())}>neu ziehen</button>
      </div>
      <div className="lr-team-head"><span>Landespokalsieger</span><span>Stärke</span></div>
      {amateurs.map((a, i) => (
        <div className="lr-team-row" key={i}>
          <input className="lr-team-in" value={a.name} aria-label={`Amateurklub ${i + 1}`}
            onChange={(e) => upd(i, "name", e.target.value)} />
          <input className="lr-team-in num" value={a.strength} inputMode="numeric"
            aria-label={`Stärke Amateurklub ${i + 1}`} onFocus={(e) => e.target.select()}
            onChange={(e) => upd(i, "strength", clampStrength(e.target.value))} />
        </div>
      ))}
      <div className="lr-modal-foot">
        <button className="lr-btn" onClick={onClose}>Abbrechen</button>
        <button className="lr-btn lr-btn-p" disabled={bad}
          onClick={() => onStart(amateurs.map((a) => ({ name: a.name.trim(), strength: Number(a.strength) })))}>
          1. Runde auslosen
        </button>
      </div>
    </Modal>
  );
}

/* ================================================================== */
/*  Kalender                                                          */
/* ================================================================== */

function Kalender({ data, onJump }) {
  const [filter, setFilter] = useState("alle");

  const events = useMemo(() => {
    const out = [];
    LEAGUE_IDS.forEach((id) => {
      const s = data.active[id];
      const count = s.teams.length * 2 - 2;
      matchdayDates(s.start, count).forEach((d, i) => {
        out.push({ date: d, comp: id, name: LEAGUE_BY_ID[id].name, accent: LEAGUE_BY_ID[id].accent, idx: i, what: `${i + 1}. Spieltag` });
      });
    });
    if (data.cup) {
      data.cup.rounds.forEach((r, i) => {
        out.push({ date: cupRoundDate(data.cup.label, i), comp: "cup", name: "DFB-Pokal", accent: CUP_ACCENT, idx: i, what: r.name });
      });
    }
    return out.sort((a, b) => a.date - b.date);
  }, [data]);

  const shown = filter === "alle" ? events : events.filter((e) => e.comp === filter);

  const months = [];
  shown.forEach((e) => {
    const key = `${e.date.getFullYear()}-${e.date.getMonth()}`;
    const last = months[months.length - 1];
    if (last && last.key === key) last.items.push(e);
    else months.push({ key, title: `${MONTHS[e.date.getMonth()]} ${e.date.getFullYear()}`, items: [e] });
  });

  return (
    <>
      <div className="lr-bar">
        <h2 className="disp" style={{ fontSize: 20 }}>Kalender</h2>
        <div className="lr-spacer" />
        <label className="lr-prog" style={{ display: "flex", alignItems: "center", gap: 5 }}>
          Wettbewerb
          <select className="lr-jump" value={filter} onChange={(e) => setFilter(e.target.value)}
            aria-label="Wettbewerb filtern">
            <option value="alle">alle</option>
            {LEAGUES.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            <option value="cup">DFB-Pokal</option>
          </select>
        </label>
      </div>

      <p className="lr-hint" style={{ paddingBottom: 12 }}>
        Alle Termine der Saison, nach Monat sortiert. Gespielt wird nicht über die
        Winterpause vom 20. Dezember bis zum 9. Januar und nicht in den vier
        Länderspielpausen im September, Oktober, November und März. Ein Klick springt
        zum Spieltag.
      </p>

      {months.map((m) => (
        <div className="lr-cal-month" key={m.key}>
          <h3>{m.title}</h3>
          {m.items.map((e, i) => (
            <button className="lr-cal-row" key={i} onClick={() => onJump(e.comp, e.idx)}>
              <span className="lr-cal-bar" style={{ background: e.accent }} />
              <span className="lr-cal-date">{fmtShort(e.date)}</span>
              <span className="lr-cal-what">{e.what}</span>
              <span className="lr-cal-comp">{e.name}</span>
            </button>
          ))}
        </div>
      ))}
    </>
  );
}

/* ================================================================== */
/*  Historie                                                          */
/* ================================================================== */

function Historie({ history, open, setOpen, onExport, onReset, onPromotion, onRestart, onRegional }) {
  const titles = useMemo(() => {
    const out = { cup: {} };
    LEAGUES.forEach((l) => { out[l.id] = {}; });
    history.forEach((h) => {
      if (h.type === "cup") {
        if (h.winner) out.cup[h.winner] = (out.cup[h.winner] || 0) + 1;
        return;
      }
      const first = h.table && h.table[0];
      if (!first || !out[h.leagueId]) return;
      out[h.leagueId][first.name] = (out[h.leagueId][first.name] || 0) + 1;
    });
    return out;
  }, [history]);

  const boards = [
    ...LEAGUES.map((l) => ({
      key: l.id, accent: l.accent,
      head: `${l.id === "bl1" ? "Meisterschaften" : "Titel"} — ${l.name}`,
    })),
    { key: "cup", accent: CUP_ACCENT, head: "Pokalsiege — DFB-Pokal" },
  ].filter((b) => Object.keys(titles[b.key]).length > 0);

  return (
    <>
      <div className="lr-bar">
        <h2 className="disp" style={{ fontSize: 20 }}>Historie</h2>
        <div className="lr-spacer" />
        <button className="lr-btn lr-btn-sm" onClick={onPromotion}>Alle Ligen abschließen</button>
        <button className="lr-btn lr-btn-sm" onClick={onRegional}>Regionalliga-Topf</button>
        <button className="lr-btn lr-btn-sm" onClick={onExport}>Exportieren</button>
        <button className="lr-btn lr-btn-sm" onClick={onRestart}>Neu beginnen</button>
        <button className="lr-btn lr-btn-sm" onClick={onReset}>Alles zurücksetzen</button>
      </div>

      {!history.length && (
        <p className="lr-empty">
          Noch keine abgeschlossene Saison. Sobald du eine Liga oder den Pokal abschließt,
          landet das Ergebnis hier und bleibt dauerhaft gespeichert.
        </p>
      )}

      {boards.length > 0 && (
        <div className="lr-titles" style={{ marginTop: 26 }}>
          {boards.map((b) => {
            const entries = Object.entries(titles[b.key])
              .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0], "de"));
            return (
              <div key={b.key}>
                <h3 style={{ borderBottomColor: b.accent }}>{b.head}</h3>
                <ol>
                  {entries.map(([name, count]) => (
                    <li key={name}><span>{name}</span><span>{count}×</span></li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      )}

      {history.map((h) => {
        const isCup = h.type === "cup";
        const l = LEAGUE_BY_ID[h.leagueId];
        const accent = isCup ? CUP_ACCENT : l ? l.accent : "#C9C3B0";
        const isOpen = open === h.id;
        const champ = isCup ? h.winner : h.table && h.table[0] ? h.table[0].name : "—";
        return (
          <div key={h.id}>
            <button className="lr-hist-row" onClick={() => setOpen(isOpen ? null : h.id)}>
              <span className="lr-hist-season">{h.label}</span>
              <span className="lr-hist-league" style={{ color: accent }}>{h.leagueName}</span>
              <span className="lr-hist-champ">
                <b>{champ}</b>
                {!isCup && h.table && h.table[0] ? (
                  <span style={{ color: "#96A093" }}> · {h.table[0].pkt} Punkte</span>
                ) : null}
              </span>
              <span className="lr-hist-open">{isOpen ? "schließen" : isCup ? "Turnierbaum" : "Tabelle"}</span>
            </button>
            {isOpen && (
              <div className="lr-hist-body" style={accentVars(accent)}>
                {isCup ? (
                  <div className="lr-bracket">
                    {h.rounds.map((r) => (
                      <div key={r.name}>
                        <h4>{r.name}</h4>
                        {r.games.map((g, i) => (
                          <div className="g" key={i}>
                            <span>{g.h}</span>
                            <b>{g.hg}:{g.ag}{g.pen ? " n.E." : ""}</b>
                            <span>{g.a}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table rows={h.table} leagueId={h.leagueId} compact />
                )}
                {h.scorers && h.scorers.length ? (
                  <div style={{ marginTop: 12 }}>
                    <div className="lr-duel-h">
                      Torschützenkönig: {h.scorers[0].name} ({h.scorers[0].verein}), {h.scorers[0].tore} Tore
                    </div>
                    <table className="lr-top-tbl">
                      <colgroup><col className="r" /><col /><col /><col className="g" /></colgroup>
                      <thead><tr><th /><th>Spieler</th><th className="v">Verein</th><th className="g">Tore</th></tr></thead>
                      <tbody>
                        {h.scorers.map((e, i) => (
                          <tr key={e.name + e.verein}>
                            <td className="r">{i + 1}</td>
                            <td>{e.name}</td>
                            <td className="v">{e.verein}{e.vorher ? <span className="vor">{e.vorher}</span> : null}</td>
                            <td className="g">{e.tore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}



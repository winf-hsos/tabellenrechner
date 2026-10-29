import { JSDOM } from "jsdom";
import { build } from "esbuild";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const which = process.argv[2];        // "new" | "old"
const initial = process.argv[3] || ""; // Pfad zu gespeichertem JSON
import fs from "fs";

const dom = new JSDOM("<!doctype html><div id=root></div>", { pretendToBeVisual: true, url: "http://localhost" });
const g = globalThis;
g.window = dom.window; g.document = dom.window.document;
for (const k of ["HTMLElement","Node","Event","MouseEvent","navigator","getComputedStyle","HTMLInputElement","HTMLSelectElement"]) { try { g[k] = dom.window[k]; } catch {} }
g.IS_REACT_ACT_ENVIRONMENT = true;
g.requestAnimationFrame = (f) => setTimeout(f, 0);
let store = {};
if (initial) store["ligarechner:v2"] = fs.readFileSync(initial, "utf8");
window.storage = { get: async (k) => (k in store ? { value: store[k] } : null), set: async (k, v) => { store[k] = v; return { value: v }; } };

await build({ entryPoints: [`${which}.jsx`], bundle: true, loader: { ".jsx": "jsx" }, outfile: `${which}.bundle.cjs`, format: "cjs", platform: "node", external: ["react", "react-dom"], logLevel: "error" });
const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = React;
const App = require(`./${which}.bundle.cjs`).default;

const root = createRoot(document.getElementById("root"));
await act(async () => { root.render(React.createElement(App)); });
await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

const btn = (txt, scope = document) => [...scope.querySelectorAll("button")].find((b) => b.textContent.trim() === txt);
const click = async (el) => { if (!el) throw new Error("Button fehlt"); await act(async () => { el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); }); };
const flush = async () => act(async () => { await new Promise((r) => setTimeout(r, 700)); });
const tabs = () => [...document.querySelectorAll(".lr-tab")].map((b) => b.textContent.trim());
const saved = () => JSON.parse(store["ligarechner:v2"] || "null");
const ok = (c, m) => { console.log((c ? "OK   " : "FEHLER ") + m); if (!c) process.exitCode = 1; };

if (which === "old") {
  await click(btn("Rest der Saison")); await flush();
  fs.writeFileSync("old-save.json", JSON.stringify(saved()));
  console.log("alter Stand gespeichert, Ligen:", Object.keys(saved().active));
  process.exit(0);
}

console.log("Reiter:", tabs().join(" | ").slice(0, 160));
const DE_ALL = ["bl1","bl2","bl3","rl_n","rl_no","rl_w","rl_sw","rl_by","ol_bw","ol_bn","ol_bs","ol_hb","ol_hh","ol_he","ol_mr","ol_nr","ol_ns","ol_non","ol_nos","ol_rps","ol_sh","ol_we"];
const RL = DE_ALL.slice(3, 8);
ok(tabs().some((t) => t.startsWith("Regionalliga")) && tabs().some((t) => t.startsWith("Oberliga")), "Auswahl Regionalliga/Oberliga vorhanden");
ok(!tabs().includes("4. Liga") && !tabs().includes("5. Liga"), "keine 4./5. Liga mehr");
await flush();
const names = (d) => LEAGUES(d).flat();
const LEAGUES = (d) => DE_ALL.map((id) => d.active[id].teams);
const pick = async (selId, val) => { const el = document.querySelector("#" + selId); if (!el) throw new Error("Auswahl fehlt " + selId); await act(async () => { el.value = val; el.dispatchEvent(new dom.window.Event("change", { bubbles: true })); }); };
const rows = () => document.querySelectorAll("tbody tr").length;
await pick("tab-rl", "rl_w");
ok(rows() === 18, `Regionalliga West: ${rows()} Zeilen`);
const sel = document.querySelector("select[aria-label='Spieltag wählen']");
ok(sel && sel.options.length === 34, `Spieltag-Auswahl hat ${sel && sel.options.length} Spieltage`);
await pick("tab-ol", "ol_we");
ok(rows() === 12, "Oberliga Westfalen: 12 Zeilen");
await click(btn("Spieltag simulieren")); await flush();
let d = saved();
const sizes = DE_ALL.map((id) => d.active[id].teams.length);
console.log("Größen:", sizes.join(","));
ok(sizes.slice(0, 8).join() === "18,18,20,18,18,18,18,18" && sizes.every((n) => n % 2 === 0), "Ligagrößen " + sizes.slice(0, 8));
const all = names(d);
ok(new Set(all).size === all.length, `keine Doppelten über die Ligen (${all.length} Teams)`);
ok(!all.some((n) => /\sII$/.test(n) && RL.concat(DE_ALL.slice(8)).some((id) => d.active[id].teams.includes(n))), "keine zweiten Mannschaften im Unterbau");
ok(DE_ALL.every((id) => d.active[id].squads.every((q) => q && q.p.length >= 16)), "alle Kader vorhanden");

// Alle Ligen komplett simulieren
for (const t of ["Bundesliga","2. Bundesliga","3. Liga"]) { await click(btn(t)); await click(btn("Rest der Saison")); }
for (const id of DE_ALL.slice(3)) { await pick(id.startsWith("rl") ? "tab-rl" : "tab-ol", id); await click(btn("Rest der Saison")); }
await flush();
d = saved();
const played = (id) => Object.keys(d.active[id].results).length;
ok(DE_ALL.every((id) => played(id) === d.active[id].teams.length * (d.active[id].teams.length - 1)), "alle Ligen komplett gespielt");
ok(DE_ALL.every((id) => Object.values(d.active[id].results).every((r) => r.sc && r.sc.length === Number(r.h) + Number(r.a))), "Torschützen vollständig");
// Der Knopf spielt auch Historie und Saisonwechsel? -> nur Spielen. Daten vor dem Abschluss merken
d = saved();
const tbl = (id) => { const s = d.active[id]; return s.teams.map((n, i) => ({ n, i })); };
const hist0 = d.history.length;
const vorher = {};
DE_ALL.forEach((id) => d.active[id].teams.forEach((n, i) => { vorher[n] = d.active[id].strengths[i]; }));

// Abschluss mit Auf- und Abstieg
await click([...document.querySelectorAll(".lr-tab")].find((b) => b.textContent.startsWith("Historie")));
await click(btn("Alle Ligen abschließen")); await flush();
const modalText = document.body.textContent;
ok(modalText.includes("Regionalligen") && !modalText.includes("Nachrücker"), "Aufstiegsdialog ohne Nachrücker");
await click(btn("Abschließen und neu besetzen")); await flush();
const d2 = saved();
const sizes2 = DE_ALL.map((id) => d2.active[id].teams.length);
ok(sizes2.join() === sizes.join(), "Ligagrößen nach Aufstieg unverändert " + sizes2.slice(0, 8));
const all2 = names(d2);
ok(new Set(all2).size === all2.length && all2.length === all.length, "nach Aufstieg keine Doppelten, gleiche Klubzahl");
{
  const diffs = [];
  DE_ALL.forEach((id) => d2.active[id].teams.forEach((n, i) => { if (n in vorher) diffs.push(d2.active[id].strengths[i] - vorher[n]); }));
  ok(diffs.length > 250 && diffs.every((x) => x === 0), `Stärken bleiben nach dem Saisonwechsel unverändert (${diffs.length} Teams)`);
}
// Auf-/Abstieg prüfen anhand der alten Tabellen
const order = (dd, id) => { const s = dd.active[id]; return s.teams; };
const bl3Old = d.active.bl3.teams;
ok(d.history.length === hist0 && d2.history.length === hist0 + DE_ALL.length, `Historie +${DE_ALL.length} Tabellen (${d2.history.length - hist0})`);
ok(d2.history.slice(0, DE_ALL.length).map((h) => h.leagueId).join() === [...DE_ALL].reverse().join(), "Historie-Reihenfolge");
const champ = (id) => d2.history.find((h) => h.leagueId === id).table[0].name;
const lowChamps = RL.map(champ);
const inBl3 = lowChamps.filter((n) => d2.active.bl3.teams.includes(n));
ok(inBl3.length === 4, "vier Regionalliga-Meister in der 3. Liga: " + inBl3);
const bl3Down = d2.history.find((h) => h.leagueId === "bl3").table.slice(16).map((r) => r.name);
ok(bl3Down.every((n) => RL.some((id) => d2.active[id].teams.includes(n))), "Letzte 4 der 3. Liga in einer Regionalliga: " + bl3Down);
const olChamps = DE_ALL.slice(8).map(champ);
ok(olChamps.every((n) => RL.some((id) => d2.active[id].teams.includes(n))), "alle 14 Oberliga-Meister in einer Regionalliga");
ok(d2.active.rl_w.label === "2027/28", "neues Label " + d2.active.rl_w.label);
ok(d2.legacyLower === null || d2.legacyLower === undefined, "kein Altbestand");

// Pokal
await click(btn("DFB-Pokal"));
const startBtn = [...document.querySelectorAll("button")].find((b) => /Pokal starten/.test(b.textContent));
await click(startBtn);
const amateurInputs = [...document.querySelectorAll("input[aria-label^='Amateurklub']")];
ok(amateurInputs.length === 8, "acht Amateure");
console.log("Amateure:", amateurInputs.map((i) => i.value).join(", "));
const amNames = amateurInputs.map((i) => i.value);
ok(amNames.every((n) => !["bl1","bl2","bl3"].some((id) => d2.active[id].teams.includes(n))), "Amateure spielen nicht in den Profiligen");
ok(amNames.every((n) => RL.some((id) => d2.active[id].teams.includes(n))), "Amateure stammen alle aus den Regionalligen");
ok(new Set(amNames).size === 8, "acht verschiedene Amateure");
await click(btn("1. Runde auslosen")); await flush();
const d3 = saved();
const g1 = d3.cup.rounds[0].games;
const cupTeams = g1.flatMap((x) => [x.h, x.a]);
ok(g1.length === 32 && new Set(cupTeams).size === 64, `Pokal: ${g1.length} Spiele, ${new Set(cupTeams).size} Teams`);
await click(btn("Runde simulieren")); await flush();
for (const t of ["Kalender","Torjäger"]) { await click(btn(t)); ok(document.body.textContent.length > 500, t + " rendert"); }
await click([...document.querySelectorAll(".lr-tab")].find((b) => b.textContent.startsWith("Historie")));
ok(document.body.textContent.includes("Regionalliga West"), "Historie nennt Regionalliga West");

// Automatischer Durchlauf: alle Wettbewerbe spielen und die Saison wechseln
await click(document.querySelector("#playall-open")); await flush();
const pa = document.querySelector("#playall-go"); ok(!!pa, "Knopf Saison durchspielen");
const labelBefore = saved().active.rl_w.label;
await click(pa); await flush(); await flush();
const d4 = saved();
ok(d4.active.rl_w.label !== labelBefore, `Saisonwechsel über den Knopf (${labelBefore} -> ${d4.active.rl_w.label})`);
const all4 = names(d4);
ok(new Set(all4).size === all4.length && all4.length === all.length, "Knopf: keine Doppelten, gleiche Klubzahl");
ok(DE_ALL.every((id) => d4.active[id].teams.length === d.active[id].teams.length), "Knopf: Ligagrößen gleich");
process.exit(process.exitCode || 0);

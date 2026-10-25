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

console.log("Reiter:", tabs().join(" | "));
ok(tabs().includes("5. Liga"), "Reiter 5. Liga vorhanden");
await flush();
const names = (d) => LEAGUES(d).flat();
const LEAGUES = (d) => ["bl1","bl2","bl3","bl4","bl5"].map((id) => d.active[id].teams);
// Zustand erzwingen: einmal etwas ändern, damit gespeichert wird
await click(btn("5. Liga"));
const rows = () => document.querySelectorAll("tbody tr").length;
ok(rows() === 16, `5. Liga Tabelle hat ${rows()} Zeilen`);
const sel = document.querySelector("select[aria-label='Spieltag wählen']");
ok(sel && sel.options.length === 30, `Spieltag-Auswahl hat ${sel && sel.options.length} Spieltage`);
await click(btn("4. Liga"));
ok(rows() === 22, "4. Liga weiter 22 Zeilen");
await click(btn("Spieltag simulieren")); await flush();
let d = saved();
const sizes = ["bl1","bl2","bl3","bl4","bl5"].map((id) => d.active[id].teams.length);
ok(sizes.join() === "18,18,20,22,16", "Ligagrößen " + sizes);
const all = names(d);
ok(new Set(all).size === all.length, `keine Doppelten über die Ligen (${all.length} Teams)`);
ok(!d.regional.some((c) => all.includes(c.name)), `Topf (${d.regional.length}) enthält keine Ligateams`);
ok(d.active.bl5.squads.every((q) => q), "bl5-Kader vorhanden");
console.log("bl4:", d.active.bl4.teams.join(", ")); console.log("bl5:", d.active.bl5.teams.join(", "));

// Alle Ligen komplett simulieren
for (const t of ["Bundesliga","2. Bundesliga","3. Liga","4. Liga","5. Liga"]) {
  await click(btn(t)); await click(btn("Rest der Saison"));
}
await flush();
d = saved();
const played = (id) => Object.keys(d.active[id].results).length;
console.log("gespielte Spiele:", ["bl1","bl2","bl3","bl4","bl5"].map((id) => id + "=" + played(id)).join(" "));
ok(played("bl4") === 42 * 11, "bl4: 462 Spiele"); ok(played("bl5") === 30 * 8, "bl5: 240 Spiele");
ok(Object.values(d.active.bl5.results).every((r) => r.sc && r.sc.length === Number(r.h) + Number(r.a)), "bl5: Torschützen vollständig");

// Tabellenstände vor Abschluss
const { default: _ } = {};
const rowsText = () => [...document.querySelectorAll("tbody tr")].map((r) => r.textContent);
await click(btn("5. Liga"));
const t5 = rowsText();
const topNames = t5.slice(0, 4).map((x) => d.active.bl5.teams.find((n) => x.includes(n)));
const flopNames = t5.slice(12).map((x) => d.active.bl5.teams.find((n) => x.includes(n)));
await click(btn("4. Liga"));
const t4 = rowsText();
const top4n = t4.slice(0, 4).map((x) => d.active.bl4.teams.find((n) => x.includes(n)));
const bl4Down = t4.slice(18).map((x) => d.active.bl4.teams.find((n) => x.includes(n)));
await click(btn("3. Liga"));
const b3 = rowsText();
const bl3Down = b3.slice(16).map((x) => d.active.bl3.teams.find((n) => x.includes(n)));
const poolBefore = d.regional.length;

// Abschluss mit Auf- und Abstieg
await click([...document.querySelectorAll(".lr-tab")].find((b) => b.textContent.startsWith("Historie")));
await click(btn("Alle Ligen abschließen")); await flush();
console.log("Modal:", document.querySelector("h2") && document.querySelector("h2").textContent);
const modalText = document.querySelector(".lr-modal, [role=dialog]")?.textContent || document.body.textContent;
ok(modalText.includes("Nachrücker"), "Aufstiegsdialog nennt Nachrücker");
const selects = [...document.querySelectorAll("select[aria-label^='Nachrücker']")];
ok(selects.length === 4, "vier Nachrücker-Auswahlen");
const nach = selects.map((s) => s.value);
await click(btn("Abschließen und neu besetzen")); await flush();
d = saved();
const sizes2 = ["bl1","bl2","bl3","bl4","bl5"].map((id) => d.active[id].teams.length);
ok(sizes2.join() === "18,18,20,22,16", "nach Aufstieg " + sizes2);
const all2 = names(d);
ok(new Set(all2).size === all2.length, "nach Aufstieg keine Doppelten");
ok(top4n.every((n) => d.active.bl3.teams.includes(n)), "Top-4 der 4. Liga jetzt in der 3. Liga: " + top4n);
ok(bl3Down.every((n) => d.active.bl4.teams.includes(n)), "Letzte 4 der 3. Liga jetzt in der 4. Liga: " + bl3Down);
ok(topNames.every((n) => d.active.bl4.teams.includes(n)), "Top-4 der 5. Liga jetzt in der 4. Liga: " + topNames);
ok(bl4Down.every((n) => d.active.bl5.teams.includes(n)), "Letzte 4 der 4. Liga jetzt in der 5. Liga: " + bl4Down);
ok(nach.every((n) => d.active.bl5.teams.includes(n)), "Nachrücker in der 5. Liga: " + nach);
ok(flopNames.every((n) => d.regional.some((c) => c.name === n)), "Letzte 4 der 5. Liga im Topf: " + flopNames);
ok(d.regional.length === poolBefore, `Topfgröße gleich (${poolBefore} -> ${d.regional.length})`);
ok(!d.regional.some((c) => all2.includes(c.name)), "Topf ohne Ligateams");
ok(d.history.length === 5 && d.history.map((h) => h.leagueId).join() === "bl5,bl4,bl3,bl2,bl1", "Historie: " + d.history.map((h) => h.leagueId));
ok(d.active.bl5.label === "2027/28", "neues Label " + d.active.bl5.label);

// Pokal
await click(btn("DFB-Pokal"));
const startBtn = [...document.querySelectorAll("button")].find((b) => /Pokal starten/.test(b.textContent));
await click(startBtn);
const amateurInputs = [...document.querySelectorAll("input[aria-label^='Amateurklub']")];
ok(amateurInputs.length === 8, "acht Amateure");
console.log("Amateure:", amateurInputs.map((i) => i.value).join(", "));
const amNames = amateurInputs.map((i) => i.value);
ok(amNames.every((n) => !["bl1","bl2","bl3"].some((id) => d.active[id].teams.includes(n))), "Amateure spielen nicht in den Profiligen");
await click(btn("1. Runde auslosen")); await flush();
d = saved();
const g1 = d.cup.rounds[0].games;
const cupTeams = g1.flatMap((x) => [x.h, x.a]);
ok(g1.length === 32 && new Set(cupTeams).size === 64, `Pokal: ${g1.length} Spiele, ${new Set(cupTeams).size} Teams`);
ok(!cupTeams.some((n) => (d.active.bl4.teams.includes(n) || d.active.bl5.teams.includes(n)) && !amNames.includes(n)), "Pokalfeld enthält nur gesetzte Profis + 8 Amateure");
await click(btn("Runde simulieren")); await flush();
// Kalender + Historie + Torjäger
for (const t of ["Kalender","Torjäger"]) { await click(btn(t)); ok(document.body.textContent.length > 500, t + " rendert"); }
await click(btn("Kalender"));
ok(document.body.textContent.includes("5. Liga"), "Kalender nennt 5. Liga");
await click([...document.querySelectorAll(".lr-tab")].find((b) => b.textContent.startsWith("Historie")));
ok(document.body.textContent.includes("5. Liga"), "Historie nennt 5. Liga");
await click(btn("Torjäger"));
console.log("Torjäger-Filter:", [...document.querySelectorAll("button")].map((b) => b.textContent.trim()).filter((t) => /Liga/.test(t)).join(" | "));
process.exit(process.exitCode || 0);

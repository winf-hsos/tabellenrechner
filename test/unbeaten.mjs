// Funktionstest für unbeatenRuns (längste Serie ohne Niederlage)
import fs from "fs";
const src = fs.readFileSync(new URL("../Tabellenrechner.jsx", import.meta.url), "utf8");
const a = src.indexOf("function unbeatenRuns"), b = src.indexOf("function parsedResult");
const c = src.indexOf("function computeTable");
const nl = src.indexOf("function nextLabel");
const code = src.slice(nl, src.indexOf("\n}\n", nl) + 3) + src.slice(b, src.indexOf("\n}\n", b) + 3) + src.slice(a, b);
const { unbeatenRuns, carryFor, serieText } = new Function(code + "; return { unbeatenRuns, carryFor, serieText };")();
let fehler = 0;
const ok = (c, m) => { console.log((c ? "OK   " : "FEHLER ") + m); if (!c) fehler++; };
const teams = ["A", "B", "C", "D"];
const fx = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];
const res = {
  "0:0": { h: "1", a: "0" }, "0:1": { h: "1", a: "1" },
  "1:0": { h: "0", a: "0" }, "1:1": { h: "2", a: "0" },
  "2:0": { h: "1", a: "1" }, "2:1": { h: "1", a: "2" },
};
let r = unbeatenRuns(teams, fx, res);
ok(r[0].name === "A" && r[0].len === 3 && r[0].from === 1 && r[0].to === 3 && r[0].laeuft, "A: 3 Spiele, 1.–3. Spieltag, läuft noch");
ok(r[1].name === "C" && r[1].len === 3, "C: ebenfalls 3 Spiele (Gleichstand nach Name)");
ok(r.find((x) => x.name === "D").len === 1 && r.find((x) => x.name === "B").len === 1, "B und D: je 1 Spiel");
ok(!r.find((x) => x.name === "B").laeuft, "B hat am letzten Spieltag verloren: läuft nicht");
const offen = { ...res }; delete offen["2:1"];
r = unbeatenRuns(teams, fx, offen);
ok(r.find((x) => x.name === "C").len === 2, "offenes Spiel beendet die Serie (C: 2 statt 3)");
ok(unbeatenRuns(teams, fx, {}).length === 0, "ohne Ergebnisse keine Serien");
const luecke = { "0:0": { h: "1", a: "0" }, "0:1": { h: "1", a: "1" }, "2:0": { h: "1", a: "0" }, "2:1": { h: "1", a: "1" } };
r = unbeatenRuns(teams, fx, luecke);
ok(r.find((x) => x.name === "A").len === 1, "übersprungener Spieltag unterbricht die Serie");
// Serien über Saisongrenzen
const fin = [[[0, 1], [2, 3]], [[0, 2], [1, 3]]];
const s1 = { "0:0": { h: "1", a: "0" }, "0:1": { h: "2", a: "2" }, "1:0": { h: "0", a: "0" }, "1:1": { h: "1", a: "0" } };
const hist = [{ type: "league", label: "2026/27", unbeatenEnd: unbeatenRuns(teams, fin, s1).filter((x) => x.laeuft && x.to === 2).map((x) => ({ name: x.name, len: x.len, from: x.from, fromLabel: "2026/27", toMd: 2, endLabel: "2026/27" })) }];
const carry = carryFor(hist, "2027/28");
ok(carry.A && carry.A.len === 2 && carry.C && !carry.D && carry.B.len === 1, "Serien am Saisonende werden als Übertrag erkannt (A 2, C 2, B 1; D verlor)");
ok(Object.keys(carryFor(hist, "2028/29")).length === 0, "Übertrag gilt nur für die direkt folgende Saison");
let r2 = unbeatenRuns(teams, fin, {}, carry);
ok(r2.find((x) => x.name === "A").len === 2 && r2.find((x) => x.name === "A").laeuft, "Saisonbeginn: Serie aus Vorsaison läuft noch");
r2 = unbeatenRuns(teams, fin, { "0:0": { h: "2", a: "0" }, "0:1": { h: "1", a: "0" }, "1:0": { h: "1", a: "1" }, "1:1": { h: "0", a: "0" } }, carry);
const a2 = r2.find((x) => x.name === "A");
ok(a2.len === 4 && a2.fromLabel === "2026/27" && a2.from === 1 && a2.to === 2 && !a2.toLabel && a2.laeuft, "A: 4 Spiele über zwei Saisons");
ok(serieText(a2) === "2026/27, 1. Spieltag – 2. Spieltag", "Text über zwei Saisons: " + serieText(a2));
const c0 = unbeatenRuns(teams, fin, { "0:0": { h: "0", a: "1" }, "0:1": { h: "0", a: "1" } }, carry).find((x) => x.name === "A");
ok(c0.len === 2 && c0.toLabel === "2026/27" && !c0.laeuft, "Niederlage im ersten Spiel beendet die Serie: Rekord bleibt in der Vorsaison");
// dritte Saison
const hist2 = [...hist, { type: "league", label: "2027/28", unbeatenEnd: unbeatenRuns(teams, fin, { "0:0": { h: "2", a: "0" }, "0:1": { h: "1", a: "0" }, "1:0": { h: "1", a: "1" }, "1:1": { h: "0", a: "0" } }, carry).filter((x) => x.laeuft && x.to === 2 && !x.toLabel).map((x) => ({ name: x.name, len: x.len, from: x.from, fromLabel: x.fromLabel || "2027/28", toMd: 2, endLabel: "2027/28" })) }];
const a3 = unbeatenRuns(teams, fin, { "0:0": { h: "1", a: "0" }, "0:1": { h: "3", a: "0" } }, carryFor(hist2, "2028/29")).find((x) => x.name === "A");
ok(a3.len === 5 && a3.fromLabel === "2026/27", "über drei Saisons: " + a3.len + " Spiele ab " + a3.fromLabel);
console.log(fehler ? `${fehler} Fehler` : "alle OK");
process.exit(fehler ? 1 : 0);

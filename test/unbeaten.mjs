// Funktionstest für unbeatenRuns (längste Serie ohne Niederlage)
import fs from "fs";
const src = fs.readFileSync(new URL("../Tabellenrechner.jsx", import.meta.url), "utf8");
const a = src.indexOf("function unbeatenRuns"), b = src.indexOf("function parsedResult");
const c = src.indexOf("function computeTable");
const code = src.slice(b, src.indexOf("\n}\n", b) + 3) + src.slice(a, b);
const unbeatenRuns = new Function(code + "; return unbeatenRuns;")();
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
console.log(fehler ? `${fehler} Fehler` : "alle OK");
process.exit(fehler ? 1 : 0);

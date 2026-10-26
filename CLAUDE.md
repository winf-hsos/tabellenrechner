# Tabellenrechner – Hinweise für Claude Code

Familien-Fußball-Tabellenrechner (Besitzer: Nicolas, Prof. an der HS Osnabrück). **Antworten auf Deutsch, kurz, mit Testergebnissen.**
Die gesamte App ist **eine einzige React-Datei: `Tabellenrechner.jsx`** (~6350 Zeilen, ein `export default function Tabellenrechner()`). Kein Router, kein Backend.

## Funktionen
- 5 deutsche Ligen (`bl1`…`bl5`: 18/18/20/22/16 Teams) mit Auf-/Abstieg, 64er-DFB-Pokal, Europapokal (CL/EL/ECL, Ligaphase 36 Teams + K.o.).
- Echte Kader (18 Spieler: 2 TW, 6 ABW, 6 MF, 4 ST), Torschützen, Vereinslogos, EA-FC-27-Stärken, Simulation nach Teamstärke.
- Kalender, Historie (nach Wettbewerb gruppiert), Sichern/Wiederherstellen als Text.
- **Abschnitte Deutschland/England**: Umschalter oben (`section` "de"/"en"). England = Premier League (`pl`, 20 Klubs, Kader aus der Fantasy Premier League), Championship (`ch`), League One (`l1`), League Two (`l2`, je 24 Klubs, Kader aus den Wikipedia-Artikeln, Stand Oktober 2026), Logos von football-logos.cc, dazu der **FA Cup** (`data.facup`, 92 Klubs: 1. Runde 16 Klubs der unteren Ligen, 2. Runde Einstieg der übrigen 32, 3. Runde Premier League und Championship). `ENGLAND`/`ENG_IDS`/`ENG_START` (Startstärken: PL 94–74, Ch 84–65, L1 72–57, L2 65–50). Saisonwechsel `englishSeasonEnd` mit Auf-/Abstieg (3/3/4, Playoffs per `playoffWinner`); die englischen Europapokal-Plätze (CL 1–5, EL 6–8, ECL 9) kommen aus der PL-Tabelle (`euroAfterEnglishSeason`). Beide Abschnitte teilen sich `data.history` (England = Einträge mit `leagueId === "pl"`, Filter `sectionHistory`), haben aber eigene Tabs für Torjäger, Kalender und Historie. `pl` steht bewusst nicht in `LEAGUE_IDS` (die deutschen Saisonwechsel iterieren darüber); `applyPromotion` und `neuBeginnen` müssen `active.pl` erhalten.

## Schnellstart
```bash
cd test && npm install           # esbuild, react, jsdom (node_modules nicht einchecken)
./build.sh                       # -> dist/index.html (eigenständig, öffnen im Browser)
node run.mjs new                 # jsdom-Test, erwartet 33x "OK" und 0x "FEHLER"
python3 pw14.py                  # Playwright (Chromium nötig: pip install playwright; playwright install chromium)
```
`build.sh` kopiert `../Tabellenrechner.jsx` nach `test/new.jsx`, bündelt `test/entry.jsx` mit esbuild und schreibt `dist/index.html` plus `dist/tabellenrechner-artifact.html` (ohne `<html>`-Gerüst, für die Artifact-Veröffentlichung).
**Nach jeder Änderung: build + `node run.mjs new` + passender `pw*.py`.**

## Aufbau von `Tabellenrechner.jsx` (Abschnittsüberschriften als Kommentarblöcke, Zeilen ungefähr)
| Zeile | Abschnitt |
|---|---|
| 3 | **Ligen**: `LEAGUES`, `LEAGUE_BY_ID`, `LEAGUE_IDS`, `PRO_IDS`, `ZERO_MD`, `REGIONAL_START` |
| 252 | Zufall, Spielplan, Simulation |
| 383 | Kalender-Logik (Termine) |
| 510 | Tabellenberechnung (`computeTable`) |
| 584 | **Kader**: `REAL_SQUADS` (Schlüssel = Vereinsname), `makeSquad(name, strength)`, `squadStrength`, `scaleSquadTo`, Torschützen (`makeGoals`, `fillGoals`, `trimGoals`, `scorerList`) |
| 2258 | **Saison & Speicherung**: Logos, `FIFA27`/`FIFA_STRENGTH`, `freshData()`, `normalize()`, `loadState`, `applyPromotion` |
| 2575 | DFB-Pokal |
| 2731 | **Europapokal-Logik**: `EURO_COMPS`, `EURO_FOREIGN`, `euroQualifiers`, `euroDraw` (Kempe-Kantenfärbung), `euroTable`, K.o.-Runden (`euroPlayoffTies`, `euroR16Ties`, `euroNextTies`), `euroArchive`, `euroEvents` |
| 3117 | Styles (CSS-String, Klassen `lr-*`) |
| 3435 | Bausteine: `Form`, `Stepper`, `ScoreBox`, `TeamMeta`, `Table`, `Modal` |
| 3575 | **Hauptkomponente** (State, Speichern, Tabs, Dialog-Steuerung `modal.type`) |
| 4721 | Dialoge: `StrengthCell`, `TeamsModal`, `SquadModal`, `EuroTeamsModal`, `EuropaTab`, `BackupModal`, `CloseModal`, `PromotionModal`, `GoalsModal`, `RegionalModal`, `CupStartModal` |
| 6084 | `Kalender` (UI) |
| 6164 | `Historie` |

`data/euro/logic.js` und `ui.jsx` sind nur Arbeitskopien des Euro-Teils (Entwicklungsstand); **maßgeblich ist immer `Tabellenrechner.jsx`**.

## Speicherung (wichtig, hier ging schon einmal Nutzerstand verloren)
- Schlüssel `ligarechner:v2` über `window.storage.get/set`. Im Artefakt/Browser gibt es das nicht → `test/entry.jsx` setzt eine Shim (localStorage, Reserve im Speicher). Jeder Origin hat eigenen Speicher; ein anderer Link/Browser = leerer Stand.
- `normalize()` migriert alte Stände (nie Felder löschen, nur ergänzen). Neue Datenfelder immer dort mit Default versehen und mit einem alten Stand testen (`pw12.py`/`pw13.py` laden `v12-state.json` bzw. `v12.html`).
- Schlägt das Laden fehl (`LOAD_FAILED`), wird eine Kopie unter `ligarechner:v2:rettung` abgelegt und der Auto-Save so lange blockiert, bis wieder erfolgreich gespeichert wurde (Statusleiste zeigt dann „Nicht gespeichert …“). Das nicht aufweichen.
- Historie → „Sichern“ (BackupModal) exportiert/importiert den Stand als Text; Downloads funktionieren im Artefakt nicht.

## Wichtige Konventionen / Fallstricke
- Euro-Daten: `run = {label, seed, teams:[{name,de,strength,squad}], fixtures[8][18]=[h,a], results:{"md:gi":{h,a,sc}}, ko:[{name,ties}], rank}`. K.o.-Hinspiel `l1` liegt bei `tie.h`, Rückspiel `l2` bei `tie.a`.
- Deutsche Euro-Teams nehmen Stärke und Kader live aus der Liga (`euroStrength`, `euroSquadFor`); Qualifikation automatisch beim Saisonwechsel (`applyPromotion`).
- Stärke-Eingabe: `StrengthCell` übernimmt bei Blur/Enter/Tab und springt zum nächsten `input.lr-team-str` im `.lr-modal`.
- Spielernamen sollen über alle Kader eindeutig sein (Torschützen werden über Namen indexiert; `squadIndex`).
- Artefakt-Umgebung: CSP blockiert `blob:`-Bilder (Logos per FileReader als Data-URL, auf 96 px verkleinert), `confirm()`/`alert()` und Downloads gehen nicht – eigene Dialoge verwenden.
- Alles Sichtbare ist deutsch. Farbschema dunkelgrün (`--bg #15211B`).

## Veröffentlichen
- Datei `dist/tabellenrechner-artifact.html` als privates Artifact veröffentlichen (früher: https://claude.ai/artifact/F6QV24PcE6c6YDLUzH4mcT, Version 14). Teilen nur über das Teilen-Menü des Nutzers.
- `dist/index.html` ist die Einzeldatei zum Öffnen/Hosten (z. B. GitHub Pages).
- GitHub: Nutzer wollte hochladen, Repo-Name fehlte noch (er schrieb „Tabbellenrechner“). Vor dem Pushen nach Owner/Repo fragen, auf Branch pushen, PR öffnen, nicht ohne Rückfrage mergen.
- Commit-Nachrichten enden mit den vom System vorgegebenen Attributionszeilen.

## Bekannte Grenzen / offene Punkte
- Euro-Kader stammen aus Sekundärquellen, teils lückenhaft, Positionen bei Torreense, Ararat-Armenia, Inter Club d’Escaldes, Lincoln Red Imps, Ajax, Lens, Slavia u. a. geschätzt; einige Einwort-Namen.
- Stärken der ausländischen Euro-Teams (`EURO_FOREIGN`) und die Euro-Kalendertermine sind Schätzungen.
- Ursache des vom Nutzer gemeldeten Verlusts von Logos/Stärken nicht bewiesen (vermutlich leerer Speicher-Origin); Migrationstests zeigen keinen Verlust.
- Ideen: Logos in Torjäger-Liste/Historie, fehlende echte Kader ergänzen.

## Ordner
- `Tabellenrechner.jsx` – Quelle. `dist/` – Build. `test/` – Build + Tests (`run.mjs`, `pw*.py`, Fixtures `*-save*.json`, `v12*`, `fakelogos/`, `crest.png`).
- `tools/` – frühere Hilfsskripte (Kader/FIFA-Daten in die JSX einmischen: `merge*.py`, `fifa.py`, `bulk.py`, `logo.py`, `mk.py`, `bl5.py`; Pfade evtl. anpassen). `data/` – Kader-/FIFA-JSONs, `data/euro/` Euro-Kader.
- `archive/` – ältere Stände der JSX (`pre_*`), nur zum Nachschlagen.

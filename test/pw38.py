# Eigene Pokale: Gruppen, K.o. mit Hin-/Rückspiel, Freilose, Elfmeterschießen, Historie
import os, json
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
def state(pg):
    pg.wait_for_timeout(900)
    return json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
def new_cup(pg, name):
    pg.fill("#cup-new-name", name); pg.locator("#cup-new-go").click(); pg.wait_for_timeout(300)
def add_teams(pg, names=None, query=None):
    pg.locator("#cup-add").click(); pg.wait_for_selector("#picker-list")
    if query:
        pg.fill("#picker-q", query); pg.wait_for_timeout(200); pg.locator("#picker-all").click()
    for n in names or []:
        pg.fill("#picker-q", n); pg.wait_for_timeout(150)
        pg.locator(f"#picker-list input[aria-label='{n}']").first.check()
    pg.locator("#picker-add").click(); pg.wait_for_timeout(400)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={"width": 1400, "height": 1000}).new_page(); perr = []
    pg.on("pageerror", lambda e: perr.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    pg.locator("#sec-cu").click(); pg.locator("#tab-cu-cups").click(); pg.wait_for_selector("#cup-new-name")

    # ---- A: 48 Teams, 6 Gruppen, Zweite + 4 beste Dritte -> Achtelfinale
    new_cup(pg, "Testpokal")
    add_teams(pg, query="Bundesliga")
    pg.select_option("#cup-gcount", "6"); pg.select_option("#cup-thirds", "4")
    t = pg.locator("#cup-summary").inner_text()
    ok("48 Mannschaften" in t and "6 Gruppen à 8" in t and "16 kommen weiter" in t and "Achtelfinale" in t, "Zusammenfassung: " + t)
    pg.locator("#cup-start").click(); pg.wait_for_selector("#cup-run")
    d = state(pg); cup = d["cups"][0]; run = cup["run"]
    ok(len(run["groups"]) == 6 and all(len(g["teams"]) == 8 and len(g["fixtures"]) == 7 for g in run["groups"]), "6 Gruppen à 8 Teams, 7 Spieltage")
    ok(pg.locator(".lr-cu-group").count() == 6, "6 Gruppentabellen sichtbar")
    pg.locator("#cup-sim-md").click(); pg.wait_for_timeout(500)
    d = state(pg); r = d["cups"][0]["run"]
    ok(all(len(g["results"]) == 4 for g in r["groups"]), "Spieltag simulieren: je Gruppe 4 Spiele")
    ok(pg.locator("#cup-to-ko").is_disabled(), "K.o.-Auslosung erst nach der Gruppenphase")
    pg.locator("#cup-sim-groups").click(); pg.wait_for_timeout(600)
    ok(not pg.locator("#cup-to-ko").is_disabled(), "nach der Gruppenphase freigeschaltet")
    pg.locator("#cup-to-ko").click(); pg.wait_for_timeout(500)
    d = state(pg); r = d["cups"][0]["run"]
    ties = r["ko"]["rounds"][0]["ties"]; names = [x for t in ties for x in (t["a"], t["b"]) if x]
    gof = {n: g["name"] for g in r["groups"] for n in g["teams"]}
    ok(r["ko"]["rounds"][0]["name"] == "Achtelfinale" and len(ties) == 8 and len(set(names)) == 16, "Achtelfinale mit 16 verschiedenen Teams")
    ok(all(gof[t["a"]] != gof[t["b"]] for t in ties), "keine Gruppengegner im Achtelfinale")
    pg.locator("#cup-sim-all").click(); pg.wait_for_timeout(800)
    d = state(pg); r = d["cups"][0]["run"]
    ok(r["phase"] == "done" and r["champion"] in gof, f"Turnier beendet, Sieger {r['champion']}")
    ok([x["name"] for x in r["ko"]["rounds"]] == ["Achtelfinale", "Viertelfinale", "Halbfinale", "Finale"], "Runden bis zum Finale")
    pg.locator("#cup-finish").click(); pg.wait_for_timeout(300)
    d = state(pg); h = [x for x in d["history"] if x["leagueId"] == cup["id"]]
    ok(len(h) == 1 and h[0]["type"] == "cup" and len(h[0]["groups"]) == 6 and h[0]["winner"] == r["champion"] and d["cups"][0]["run"] is None and d["cups"][0]["edition"] == 2, "Historieneintrag mit 6 Gruppentabellen, Ausgabe 2")
    # Historie sichtbar
    pg.locator(".lr-tabs .lr-tab", has_text="Historie").click(); pg.wait_for_timeout(300)
    pg.locator(".lr-hist-row").first.click(); pg.wait_for_timeout(300)
    ok("Gruppe A" in pg.locator("body").inner_text() and "Finale" in pg.locator("body").inner_text(), "Historie zeigt Gruppen und Turnierbaum")
    # Torjäger
    pg.locator("#tab-cu-cups").click(); pg.wait_for_timeout(200)

    # ---- B: K.o. mit Hin-/Rückspiel, Freilose, Spiel um Platz 3, Elfmeterschießen
    new_cup(pg, "Hin und Rück")
    add_teams(pg, names=["FC Bayern München", "Borussia Dortmund", "Bayer 04 Leverkusen", "RB Leipzig", "VfB Stuttgart", "Eintracht Frankfurt"])
    pg.select_option("#cup-preset", "ko2"); pg.select_option("#cup-third", "1")
    t = pg.locator("#cup-summary").inner_text()
    ok("2 Freilose" in t and "Viertelfinale → Halbfinale → Finale" in t and "Spiel um Platz 3" in t and "Hin- und Rückspiel" in t, "Zusammenfassung mit Freilosen: " + t)
    pg.locator("#cup-start").click(); pg.wait_for_selector("#cup-run")
    d = state(pg); r = d["cups"][1]["run"]
    t0 = r["ko"]["rounds"][0]["ties"]
    ok(r["phase"] == "ko" and len(t0) == 4 and sum(1 for t in t0 if t["b"] is None) == 2 and all(t["legs"] == 2 for t in t0), "Viertelfinale: 4 Spiele, 2 Freilose, Hin- und Rückspiel")
    byes = [t["a"] for t in t0 if t["b"] is None]
    ok(set(byes) <= {"FC Bayern München", "Borussia Dortmund", "Bayer 04 Leverkusen", "RB Leipzig", "VfB Stuttgart", "Eintracht Frankfurt"} and len(byes) == 2, "Freilose gehen an zwei Teams: " + str(byes))
    # Elfmeterschießen: Hinspiel 1:0, Rückspiel 1:0 für den Gastgeber -> Gesamt 1:1
    tie = pg.locator(".lr-cu-tie[data-tie]").first
    ins = tie.locator("input")
    ins.nth(0).fill("1"); ins.nth(1).fill("0"); ins.nth(2).fill("1"); ins.nth(3).fill("0"); pg.wait_for_timeout(300)
    ok(pg.locator("[data-pen='1']").count() == 1 and "Gesamt 1:1" in tie.inner_text(), "Gesamt 1:1 -> Elfmeterschießen wird verlangt")
    pg.locator("[data-pen='1'] button").first.click(); pg.wait_for_timeout(300)
    ok("→" in tie.inner_text(), "Sieger nach Elfmeterschießen gewählt")
    pg.locator("#cup-sim-round").click(); pg.wait_for_timeout(500)
    ok(not pg.locator("#cup-next").is_disabled(), "Runde simuliert, nächste Runde möglich")
    pg.locator("#cup-sim-all").click(); pg.wait_for_timeout(800)
    d = state(pg); r = d["cups"][1]["run"]
    ok(r["phase"] == "done" and [x["name"] for x in r["ko"]["rounds"]] == ["Viertelfinale", "Halbfinale", "Finale"] and r["ko"]["third"] is not None, "Viertel-, Halb-, Finale und Spiel um Platz 3")
    ok(all(t["legs"] == 2 for t in r["ko"]["rounds"][2]["ties"]), "Finale mit Hin- und Rückspiel")
    ok(r["champion"] in ["FC Bayern München", "Borussia Dortmund", "Bayer 04 Leverkusen", "RB Leipzig", "VfB Stuttgart", "Eintracht Frankfurt"], "Sieger ist ein Teilnehmer")
    pg.locator("#cup-finish").click(); pg.wait_for_timeout(300)
    d = state(pg); h = [x for x in d["history"] if x["leagueId"] == d["cups"][1]["id"]]
    ok(len(h) == 1 and h[0]["rounds"][-1]["name"] == "Spiel um Platz 3", "Historie mit Spiel um Platz 3")

    # ---- C: Gruppe mit ungerader Zahl (5 Teams, spielfrei)
    new_cup(pg, "Fünfer")
    add_teams(pg, names=["FC Arsenal", "FC Liverpool", "Manchester City", "FC Chelsea", "Aston Villa"])
    pg.select_option("#cup-groups", "1"); pg.select_option("#cup-gcount", "1"); pg.select_option("#cup-adv", "2")
    pg.locator("#cup-start").click(); pg.wait_for_selector("#cup-run")
    pg.locator("#cup-sim-groups").click(); pg.wait_for_timeout(600)
    d = state(pg); g = d["cups"][2]["run"]["groups"][0]
    ok(len(g["fixtures"]) == 5 and sum(len(r) for r in g["fixtures"]) == 10 and len(g["results"]) == 10, "5er-Gruppe: 5 Spieltage, 10 Spiele (je Team ein Spielfrei)")
    rows = pg.locator(".lr-cu-group tbody tr").all_inner_texts()
    ok(len(rows) == 5, "Tabelle mit 5 Teams")

    # ---- D: Teams selbst in die Gruppen eintragen
    new_cup(pg, "Manuell")
    T = ["FC Bayern München", "Borussia Dortmund", "Bayer 04 Leverkusen", "RB Leipzig", "VfB Stuttgart", "Eintracht Frankfurt", "SC Freiburg", "Werder Bremen"]
    add_teams(pg, names=T)
    pg.select_option("#cup-gmode", "manual"); pg.select_option("#cup-gcount", "2"); pg.select_option("#cup-adv", "2")
    ok(pg.locator("#cup-assign").count() == 1 and pg.locator("#cup-start").is_disabled() and "ohne Gruppe" in pg.locator("#cup-summary").inner_text(), "ohne Zuordnung nicht startbar: " + pg.locator("#cup-summary").inner_text())
    for i, n in enumerate(T[:7]):
        pg.select_option(f"select[aria-label='Gruppe für {n}']", "0" if i < 4 else "1")
    ok(pg.locator("#cup-start").is_disabled(), "ein Team fehlt noch -> gesperrt")
    pg.select_option("select[aria-label='Gruppe für Werder Bremen']", "1")
    ok(not pg.locator("#cup-start").is_disabled() and "selbst eingeteilt" in pg.locator("#cup-summary").inner_text(), "alle zugeteilt -> startbar")
    pg.locator("#cup-start").click(); pg.wait_for_selector("#cup-run")
    d = state(pg); gr = d["cups"][3]["run"]["groups"]
    ok(sorted(gr[0]["teams"]) == sorted(T[:4]) and sorted(gr[1]["teams"]) == sorted(T[4:]), "Gruppen genau wie eingetragen: " + str([g["teams"] for g in gr]))
    pg.locator("#cup-sim-all").click(); pg.wait_for_timeout(700)
    d = state(pg); ok(d["cups"][3]["run"]["phase"] == "done" and d["cups"][3]["run"]["champion"] in T, "Turnier mit eigener Einteilung gespielt")
    pg.locator("#cup-reset").click(); pg.locator("#cup-reset-ok").click(); pg.wait_for_timeout(300)
    pg.locator("#cup-assign-draw").click(); pg.wait_for_timeout(300)
    d = state(pg); a = d["cups"][3]["groupAssign"]
    ok(len(a) == 8 and sorted(sum(1 for v in a.values() if v == k) for k in (0, 1)) == [4, 4], "Vorschlag per Auslosung füllt die Zuordnung (4 + 4)")

    # ---- Aufräumen: Pokal löschen
    pg.locator("#cup-list button", has_text="Fünfer").click(); pg.locator("#cup-del").click(); pg.locator("#cup-del-ok").click(); pg.wait_for_timeout(400)
    d = state(pg); ok(d["cups"][2]["gone"] is True, "Pokal gelöscht (Historie bleibt)")
    # Nachladen
    pg.reload(); pg.wait_for_selector(".lr-tab"); pg.locator("#sec-cu").click(); pg.locator("#tab-cu-cups").click(); pg.wait_for_timeout(300)
    ok(pg.locator("#cup-list button").count() == 3, "nach dem Neuladen: 3 Pokale")
    ok(not perr, f"keine JS-Fehler {perr[:2]}")
    b.close()
print("Fehler:", errs)

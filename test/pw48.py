# Alles durchspielen: alle Ligen, Pokale und Europapokale in die Historie, überall neue Saison
import os, json
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
def state(pg):
    pg.wait_for_timeout(1200)
    return json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={"width": 1400, "height": 1000}).new_page(); perr = []
    pg.on("pageerror", lambda e: perr.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    # eigene Liga und eigener Pokal anlegen
    pg.locator("#sec-cu").click(); pg.locator("#tab-cu-cups").click(); pg.wait_for_selector("#cup-new-name")
    pg.fill("#cup-new-name", "Testpokal"); pg.locator("#cup-new-go").click(); pg.wait_for_selector("#cup-add-all")
    pg.locator("#cup-add-all").click(); pg.wait_for_timeout(500)
    pg.locator("#sec-de").click(); pg.wait_for_selector("#everything-open")
    d0 = state(pg)
    pg.locator("#everything-open").click(); pg.wait_for_selector("#everything-go")
    ok(pg.locator("#everything-drift").is_checked(), "Haken „neue Stärken“ ist vorbelegt")
    pg.locator("#everything-go").click()
    pg.wait_for_function("() => JSON.parse(localStorage.getItem('ligarechner:v2') || '{}').history && JSON.parse(localStorage.getItem('ligarechner:v2')).history.length > 20", timeout=90000)
    d = state(pg)
    ids = [h["leagueId"] for h in d["history"]]
    want = ["bl1", "bl2", "bl3", "cup", "cl", "el", "ecl", "pl", "ch", "l1", "l2", "facup", "ll", "sd", "p1", "p2", "copa", "sa", "sb", "sca", "scb", "scc", "coppa", "fl1", "fl2", "fl3", "coupe",
            "nl1", "nl2", "pt1", "pt2", "tr1", "tr2", "be1", "be2", "at1", "at2", "ch1", "ch2", "sc1", "sc2", "dk1", "dk2"]
    miss = [w for w in want if w not in ids]
    ok(not miss, f"Historie enthält alle Wettbewerbe ({len(set(ids))} verschiedene), fehlt: {miss}")
    ok(any(i.startswith("wc_") for i in ids), "Landespokale der weiteren Länder in der Historie")
    ok(any(i.startswith("cp_") for i in ids), "eigener Pokal in der Historie")
    labels = {s["label"] for k, s in d["active"].items()}
    ok(labels == {"2027/28"}, f"überall beginnt 2027/28: {labels}")
    ok(all(len(s["results"]) == 0 for s in d["active"].values()), "neue Saisons ohne Ergebnisse")
    ok(d["euro"]["runs"] is not None and all(not r or not r.get("results") for r in d["euro"]["runs"].values()) , "Europapokal-Läufe beendet/abgelegt")
    # Stärken haben sich um höchstens 5 verändert, bei vielen Klubs überhaupt
    diffs = []
    for lid in ("bl1", "pl", "ll", "sa", "fl1", "nl1"):
        a, c = d0["active"][lid], d["active"][lid]
        old = dict(zip(a["teams"], a["strengths"]))
        for n, v in zip(c["teams"], c["strengths"]):
            if n in old: diffs.append(v - old[n])
    ok(diffs and max(abs(x) for x in diffs) <= 6 and sum(1 for x in diffs if x) > len(diffs) * 0.4, f"neue Stärken: {sum(1 for x in diffs if x)}/{len(diffs)} Klubs verändert, größte Änderung {max(abs(x) for x in diffs)}")
    ok(not perr, f"keine JS-Fehler {perr[:2]}")
    b.close()
print("Fehler:", errs)

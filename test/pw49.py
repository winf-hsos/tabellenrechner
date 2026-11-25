# Mehrere Saisons hintereinander (5 … 100), Verkürzung alter Historie, Speichern
import os, json
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
def state(pg):
    pg.wait_for_timeout(2500)
    return json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
def run(pg, n):
    pg.locator("#everything-open").click(); pg.wait_for_selector(f"#seasons-{n}")
    pg.locator(f"#seasons-{n}").click()
    pg.wait_for_function("() => !document.querySelector('#everything-go')", timeout=300000)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={"width": 1400, "height": 1000}).new_page(); perr = []
    pg.on("pageerror", lambda e: perr.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    pg.locator("#everything-open").click(); pg.wait_for_selector("#seasons-bar")
    ok([pg.locator(f"#seasons-{n}").count() for n in (5, 10, 20, 30, 40, 50, 100)] == [1] * 7, "Knöpfe für 5, 10, 20, 30, 40, 50 und 100 Saisons")
    pg.locator("#seasons-5").click(); pg.wait_for_selector("#seasons-progress")
    ok(pg.locator("#seasons-5").is_disabled() and pg.locator("#everything-go").is_disabled(), "während des Laufs gesperrt, Fortschritt sichtbar")
    pg.wait_for_function("() => !document.querySelector('#everything-go')", timeout=120000)
    d = state(pg)
    ok(d["active"]["bl1"]["label"] == "2031/32", f"5 Saisons gespielt: jetzt {d['active']['bl1']['label']}")
    ok(not any(h.get("compact") for h in d["history"]), "bei 5 Saisons nichts verkürzt")
    n5 = len(d["history"])
    run(pg, 20)
    d = state(pg)
    ok(d["active"]["bl1"]["label"] == "2051/52", f"weitere 20 Saisons: {d['active']['bl1']['label']}")
    comp = [h for h in d["history"] if h.get("compact")]
    ok(len(d["history"]) > n5 + 900 and len(comp) > 500, f"Historie {len(d['history'])} Einträge, davon {len(comp)} verkürzt")
    newest = max(h["label"] for h in d["history"])
    ok(not any(h.get("compact") for h in d["history"] if h["label"] >= "2047/48"), "die letzten 5 Saisons sind vollständig")
    ok(all(h["table"][0]["name"] for h in comp if h["type"] == "league"), "verkürzte Tabellen nennen weiter den Meister")
    pg.reload(); pg.wait_for_selector(".lr-tab")
    pg.get_by_role("button", name="Historie").first.click(); pg.wait_for_selector(".lr-hist-row")
    ok(pg.locator(".lr-hist-row").count() > 5, "Historie nach dem Neuladen da")
    ok("Nicht gespeichert" not in pg.locator(".lr-status").inner_text(), "gespeichert")
    # ein verkürzter Eintrag zeigt die Mini-Tabelle
    pg.locator(".lr-hist-row").nth(60).click(); pg.wait_for_timeout(300)
    ok(pg.locator(".lr-hist-body").count() == 1, "alter Eintrag lässt sich öffnen")
    txt = pg.locator(".lr-hist-body").inner_text()
    ok("Verkürzter Eintrag" in txt, "verkürzter Eintrag erklärt sich und zeigt die Spitze")
    run_ok = not perr
    ok(run_ok, f"keine JS-Fehler {perr[:2]}")
    b.close()
print("Fehler:", errs)

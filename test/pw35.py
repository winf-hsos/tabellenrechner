# Knopf „5 Spieltage“
import os, json
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
def state(pg): return json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
def mds(d, lid): return sorted({int(k.split(":")[0]) for k, v in d["active"][lid]["results"].items() if v["h"] != ""})
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={"width": 1300, "height": 1000}).new_page(); perr = []
    pg.on("pageerror", lambda e: perr.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    pg.locator("#sim-five").click(); pg.wait_for_timeout(900)
    d = state(pg)
    ok(mds(d, "bl1") == [0, 1, 2, 3, 4], f"5 Spieltage simuliert: {mds(d, 'bl1')}")
    ok(all(len(d["active"]["bl1"]["results"]) == 45 for _ in [0]), "45 Ergebnisse (5 × 9 Spiele)")
    ok("6. Spieltag" in pg.locator("body").inner_text(), "Anzeige springt zum 6. Spieltag")
    erste = d["active"]["bl1"]["results"]["0:0"]
    pg.locator("#sim-five").click(); pg.wait_for_timeout(900)
    d = state(pg)
    ok(mds(d, "bl1") == list(range(10)) and d["active"]["bl1"]["results"]["0:0"] == erste, "weitere 5 Spieltage, bestehende Ergebnisse bleiben")
    for k in range(5):
        pg.locator("#sim-five").click(); pg.wait_for_timeout(500)
    d = state(pg)
    ok(len(mds(d, "bl1")) == 34 and len(d["active"]["bl1"]["results"]) == 34 * 9, "am Saisonende gedeckelt: 34 Spieltage")
    ok(not perr, f"keine JS-Fehler {perr[:2]}")
    b.close()
print("Fehler:", errs)

# Eigene Pokale: Knopf „Alle Mannschaften hinzufügen“
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
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={"width": 1400, "height": 1000}).new_page(); perr = []
    pg.on("pageerror", lambda e: perr.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    pg.locator("#sec-cu").click(); pg.locator("#tab-cu-cups").click(); pg.wait_for_selector("#cup-new-name")
    pg.fill("#cup-new-name", "Weltpokal"); pg.locator("#cup-new-go").click(); pg.wait_for_selector("#cup-add-all")
    pg.locator("#cup-add-all").click(); pg.wait_for_timeout(600)
    cup = state(pg)["cups"][0]; n = len(cup["teams"])
    ok(n > 500 and len(set(cup["teams"])) == n, f"alle Mannschaften hinzugefügt: {n}, keine doppelt")
    ok("FC Bayern München" in cup["teams"] and "Real Madrid" in cup["teams"], "Vereine aus mehreren Ländern dabei")
    pg.locator("#cup-add-all").click(); pg.wait_for_timeout(600)
    ok(len(state(pg)["cups"][0]["teams"]) == n, "zweiter Klick fügt nichts doppelt hinzu")
    ok(not perr, f"keine JS-Fehler {perr[:2]}")
    b.close()
print("Fehler:", errs)

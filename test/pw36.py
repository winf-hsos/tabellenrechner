# Klick auf ein Vereinslogo zeigt es groß
import os
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={"width": 1300, "height": 1000}).new_page(); perr = []
    pg.on("pageerror", lambda e: perr.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    ok(pg.locator("#logo-big").count() == 0, "zunächst keine Großansicht")
    pg.locator(".lr-tbl .lr-logo").first.click(); pg.wait_for_timeout(200)
    ok(pg.locator("#logo-big").count() == 1 and pg.locator("#logo-big img").evaluate("e => e.naturalWidth") > 0, "Logo in der Tabelle: Großansicht")
    ok(pg.locator(".lr-modal").count() == 0, "öffnet nicht zusätzlich die Vereinsseite")
    w = pg.locator("#logo-big img").evaluate("e => e.getBoundingClientRect().width")
    ok(w >= 250, f"Logo groß ({w:.0f} px)")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    ok(pg.locator("#logo-big").count() == 0, "Escape schließt")
    pg.locator(".lr-game .lr-logo").first.click(); pg.wait_for_timeout(200)
    ok(pg.locator("#logo-big").count() == 1, "Logo in der Partie: Großansicht")
    pg.locator("#logo-big").click(); pg.wait_for_timeout(200)
    ok(pg.locator("#logo-big").count() == 0, "Antippen schließt")
    # Vereinsseite: Logo darin ebenfalls vergrößerbar, Seite bleibt offen
    pg.locator(".lr-tbl td.name a, .lr-tbl .lr-k-link").first.click() if pg.locator(".lr-tbl .lr-k-link").count() else None
    ok(not perr, f"keine JS-Fehler {perr[:2]}")
    b.close()
print("Fehler:", errs)

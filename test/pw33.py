# Stärke direkt am Spieltag einstellen, Enter springt zur nächsten Mannschaft
import os, json
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
def state(pg): return json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={"width": 1300, "height": 1000}).new_page(); perr = []
    pg.on("pageerror", lambda e: perr.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    ins = pg.locator("input.lr-str-set")
    ok(ins.count() == 18, f"18 Stärkefelder am Spieltag ({ins.count()})")
    ins.nth(0).click(); pg.keyboard.type("77"); pg.keyboard.press("Enter")
    ok(pg.evaluate("document.activeElement.className") == "lr-str-in lr-str-set" and pg.evaluate("document.activeElement === document.querySelectorAll('input.lr-str-set')[1]"), "Enter springt zum nächsten Stärkefeld")
    pg.keyboard.type("66"); pg.keyboard.press("Enter"); pg.wait_for_timeout(900)
    d = state(pg)
    h0 = pg.locator("input.lr-str-set").nth(0).get_attribute("aria-label")
    names = d["active"]["bl1"]["teams"]
    # Reihenfolge der Felder = Spiele des Spieltags: erste Partie Heim, Gast
    import re
    t0 = h0.replace("Stärke ", ""); t1 = pg.locator("input.lr-str-set").nth(1).get_attribute("aria-label").replace("Stärke ", "")
    s = lambda t: d["active"]["bl1"]["strengths"][names.index(t)]
    ok(s(t0) == 77 and s(t1) == 66, f"Stärken übernommen: {t0}={s(t0)}, {t1}={s(t1)}")
    # Wert wird begrenzt, Buchstaben ignoriert
    pg.locator("input.lr-str-set").nth(2).click(); pg.keyboard.type("abc250"); pg.keyboard.press("Enter"); pg.wait_for_timeout(900)
    t2 = pg.locator("input.lr-str-set").nth(2).get_attribute("aria-label").replace("Stärke ", "")
    ok(state(pg)["active"]["bl1"]["strengths"][names.index(t2)] == 100, "Stärke wird auf 100 begrenzt")
    # Kader-Knopf weiter erreichbar
    pg.get_by_role("button", name="Kader").first.click(); pg.wait_for_timeout(300)
    ok(pg.locator(".lr-modal").count() == 1, "Kader-Knopf öffnet den Kader")
    ok(not perr, f"keine JS-Fehler {perr[:2]}")
    b.close()
print("Fehler:", errs)

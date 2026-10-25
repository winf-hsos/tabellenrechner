# Speichern im LocalStorage (Daten + Ansichtsstand) und Zurücksetzen-Button
import os, json
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_context(viewport={"width": 1300, "height": 900}).new_page()
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    pg.locator(".lr-tab", has_text="2. Bundesliga").click()
    pg.get_by_role("button", name="Spieltag simulieren").first.click()
    pg.get_by_role("button", name="Nächster Spieltag").first.click()
    pg.wait_for_timeout(900)
    ls = pg.evaluate("() => ({d: localStorage.getItem('ligarechner:v2'), u: localStorage.getItem('ligarechner:v2:ui')})")
    ok(bool(ls["d"]) and bool(ls["u"]), "Daten und Ansichtsstand liegen im LocalStorage")
    ui = json.loads(ls["u"]); ok(ui["tab"] == "bl2" and ui["md"]["bl2"] == 1, f"Ansichtsstand: Tab {ui['tab']}, Spieltag-Index {ui['md'].get('bl2')}")
    pg.reload(); pg.wait_for_selector(".lr-tab"); pg.wait_for_timeout(500)
    ok(pg.locator(".lr-tab[data-on='1']").inner_text().strip() == "2. Bundesliga", "nach Neuladen: gleicher Tab")
    ok("2. Spieltag" in pg.locator(".lr-main, body").first.inner_text(), "nach Neuladen: gleicher Spieltag")
    d1 = json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
    ok(any(v for v in d1["active"]["bl2"]["results"].values()), "Ergebnisse bleiben erhalten")
    # sofort speichern beim Verlassen der Seite
    pg.get_by_role("button", name="Spieltag simulieren").first.click()
    pg.evaluate("() => window.dispatchEvent(new Event('pagehide'))")
    d2 = json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
    ok(len(d2["active"]["bl2"]["results"]) > len(d1["active"]["bl2"]["results"]), "pagehide speichert sofort")
    # Zurücksetzen
    pg.locator("#reset-open").click()
    pg.get_by_role("button", name="Abbrechen").click()
    ok(len(json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))["active"]["bl2"]["results"]) > 0, "Abbrechen lässt den Stand unverändert")
    pg.locator("#reset-open").click()
    pg.locator(".lr-modal").get_by_role("button", name="Alles zurücksetzen").click()
    pg.wait_for_timeout(900)
    d3 = json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
    ok(len(d3["active"]["bl2"]["results"]) == 0 and d3["history"] == [], "Zurücksetzen leert Ergebnisse und Historie")
    ok(pg.locator(".lr-tab[data-on='1']").inner_text().strip() == "Bundesliga", "Zurücksetzen springt zur Bundesliga")
    pg.reload(); pg.wait_for_selector(".lr-tab"); pg.wait_for_timeout(400)
    ok(pg.locator(".lr-tab[data-on='1']").inner_text().strip() == "Bundesliga", "nach Zurücksetzen und Neuladen bleibt es leer")
    b.close()
print("Fehler:", errs)

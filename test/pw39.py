# Echter Spielplan 2026/27 (Bundesliga, 2. Bundesliga, 3. Liga) mit Terminen und echten Ergebnissen
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
    ok(pg.locator("#real-tag").count() == 1, "Bundesliga läuft mit dem echten Spielplan (Kennzeichen)")
    body = pg.locator(".lr-grid").first.inner_text()
    ok("28.08" in body and "20:30" in body, "1. Spieltag: Freitag 28.08. 20:30")
    first = pg.locator(".lr-game").first.inner_text()
    ok("FC Bayern München" in first and "VfB Stuttgart" in first, "erste Partie des 1. Spieltags: Bayern gegen Stuttgart")
    pg.get_by_role("button", name="Spieltag simulieren").first.click(); pg.wait_for_timeout(700)
    d = state(pg)
    ok(d["active"]["bl1"]["seed"] < 0 and d["active"]["bl2"]["seed"] < 0 and d["active"]["bl3"]["seed"] < 0, "alle drei Ligen mit echtem Spielplan")
    ok(len(d["active"]["bl1"]["kicks"]) == 34 and len(d["active"]["bl2"]["kicks"]) == 34 and len(d["active"]["bl3"]["kicks"]) == 38, "34 / 34 / 38 Spieltage mit Anstoßzeiten")
    # 2. Spieltag zeigt andere Termine
    pg.locator(".lr-nav").nth(1).click(); pg.wait_for_timeout(300)
    # Echte Ergebnisse laden
    pg.locator("#real-open").click(); pg.wait_for_selector("#real-full")
    pg.locator("#real-full").click(); pg.wait_for_timeout(800)
    d = state(pg)
    n1, n2, n3 = (len(d["active"][k]["results"]) for k in ("bl1", "bl2", "bl3"))
    ok(n1 > 0 and n2 > 0 and n3 > 0, f"echte Ergebnisse geladen: {n1} / {n2} / {n3} Spiele")
    ok(all(v["h"] != "" and v["a"] != "" for k in ("bl1", "bl2", "bl3") for v in d["active"][k]["results"].values()), "Ergebnisse vollständig")
    pg.locator(".lr-tabs .lr-tab", has_text="2. Bundesliga").click(); pg.wait_for_timeout(300)
    sp = pg.locator(".lr-tbl tbody tr").evaluate_all("rs => rs.map(r => Number(r.querySelectorAll('td')[3].textContent) || 0)")
    ok(len(sp) == 18 and sum(sp) == 2 * n2, f"Tabelle der 2. Bundesliga zählt {sum(sp)} Spielteilnahmen = 2 x {n2}")
    # Alle Torschützen auslosen funktioniert auf echten Ergebnissen
    pg.get_by_role("button", name="Alle Torschützen auslosen").click(); pg.wait_for_timeout(800)
    d = state(pg)
    ok(all(len(v["sc"]) == int(v["h"]) + int(v["a"]) for v in d["active"]["bl2"]["results"].values()), "Torschützen für echte Ergebnisse auslosbar")
    # Neu auslosen -> kein echter Plan mehr; Knopf stellt ihn wieder her
    pg.get_by_role("button", name="Neu auslosen").click(); pg.wait_for_selector(".lr-modal")
    pg.locator(".lr-modal .lr-btn-p").click(); pg.wait_for_timeout(500)
    d = state(pg)
    ok(d["active"]["bl2"]["seed"] > 0 and pg.locator("#real-tag").count() == 0, "nach „Neu auslosen“ zufälliger Spielplan, Kennzeichen weg")
    pg.locator("#real-open").click(); pg.locator("#real-plan").click(); pg.wait_for_timeout(800)
    d = state(pg)
    ok(d["active"]["bl2"]["seed"] < 0 and d["active"]["bl2"]["results"] == {} and pg.locator("#real-tag").count() == 1, "„Nur den Spielplan laden“ stellt den echten Plan ohne Ergebnisse wieder her")
    # Kalender
    pg.locator(".lr-tabs .lr-tab", has_text="Kalender").click(); pg.wait_for_timeout(400)
    ok("August 2026" in pg.locator("body").inner_text(), "Kalender startet im August 2026")
    # Saison durchspielen: danach kein echter Plan mehr
    pg.locator("#playall-open").click(); pg.locator("#playall-go").click(); pg.wait_for_timeout(4000)
    d = state(pg)
    ok(d["active"]["bl1"]["label"] == "2027/28" and d["active"]["bl1"]["seed"] > 0 and not any(len(s["results"]) for s in [d["active"]["bl1"]]), "Saison 2027/28 mit frischem Zufallsplan")
    ok(not perr, f"keine JS-Fehler {perr[:2]}")
    b.close()
print("Fehler:", errs)

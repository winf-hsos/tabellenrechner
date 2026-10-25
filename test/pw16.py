# Liveticker: ein Spieltag, zwei Minuten pro Spiel, Ergebnisse erst am Ende übernehmen
import os, json
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
def results(pg, liga="bl1"):
    raw = pg.evaluate("() => localStorage.getItem('ligarechner:v2')")
    return json.loads(raw)["active"][liga]["results"] if raw else {}
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_context(viewport={"width": 1300, "height": 900}).new_page()
    pg.clock.install()
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    pg.locator("#live-open").click()
    ok(pg.locator("#live-start").inner_text().strip() == "Anpfiff", "Ticker öffnet mit Anpfiff-Button")
    ok(pg.locator(".lr-live-game").count() == 9, "neun Spiele der Bundesliga laufen gleichzeitig")
    pg.locator("#live-start").click()
    pg.clock.run_for(60000)
    m = int(pg.locator("#live-min").inner_text().split(".")[0])
    ok(40 <= m <= 47, f"nach 60 s steht der Ticker bei Minute {m} (erwartet ca. 45)")
    pg.locator("#live-start").click()   # Pause
    ok(pg.locator("#live-start").inner_text().strip() == "Weiter", "Pause zeigt Weiter")
    pg.clock.run_for(30000)
    ok(int(pg.locator("#live-min").inner_text().split(".")[0]) == m, "in der Pause läuft die Zeit nicht weiter")
    ok(len(results(pg)) == 0, "während des Tickers ist noch nichts gespeichert")
    pg.locator("#live-start").click()
    pg.clock.run_for(61000)
    ok(pg.locator("#live-min").inner_text().strip() == "Abpfiff", "nach zwei Minuten: Abpfiff")
    ok(pg.locator("#live-take").count() == 1, "Ergebnisse übernehmen ist sichtbar")
    # Endstände im Ticker = übernommene Ergebnisse
    scores = [t.replace(" ", "") for t in pg.locator(".lr-live-sc").all_inner_texts()]
    pg.locator("#live-take").click(); pg.clock.run_for(1500)
    r = results(pg)
    ok(len(r) == 9, f"{len(r)} Ergebnisse übernommen")
    got = [f"{r[f'0:{i}']['h']}:{r[f'0:{i}']['a']}" for i in range(9)]
    ok(got == scores, "Endstände im Ticker = gespeicherte Ergebnisse")
    ok(all(len(r[f"0:{i}"]["sc"]) == int(r[f"0:{i}"]["h"]) + int(r[f"0:{i}"]["a"]) for i in range(9)), "Torschützen passen zu den Ergebnissen")
    ok(pg.locator("#live-open").is_disabled(), "Liveticker ist gesperrt, wenn alle Spiele gespielt sind")
    # Abbrechen: nichts speichern; Sofort beenden
    pg.get_by_role("button", name="Nächster Spieltag").first.click()
    pg.locator("#live-open").click(); pg.locator("#live-start").click(); pg.clock.run_for(20000)
    pg.get_by_role("button", name="Abbrechen").click(); pg.clock.run_for(1500)
    ok(len(results(pg)) == 9, "Abbrechen speichert nichts")
    pg.locator("#live-open").click(); pg.locator("#live-skip").click()
    ok(pg.locator("#live-min").inner_text().strip() == "Abpfiff", "Sofort beenden springt zum Abpfiff")
    b.close()
print("Fehler:", errs)

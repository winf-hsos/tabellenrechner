import os
from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={"width":1300,"height":900}).new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://"+os.path.dirname(os.path.abspath(__file__))+"/index.html")
    pg.wait_for_selector(".lr-tab"); pg.locator("#tab-euro").click()
    print("Vorschau CL:", pg.locator(".eu-list li").count(), "| DE:", pg.locator(".eu-list .eu-de").count())
    for c in ["el","ecl"]:
        pg.locator(f"#eu-{c}").click(); print(c, pg.locator(".eu-list li").count(), pg.locator(".eu-list .eu-de").count())
    pg.locator("#eu-cl").click()
    pg.locator("#eu-start").click(); pg.wait_for_selector(".lr-game")
    print("Spiele am Spieltag 1:", pg.locator(".lr-game").count(), "| Tabellenzeilen:", pg.locator(".lr-tbl tbody tr").count())
    pg.locator("#eu-next").is_enabled() and print("FEHLER: Playoffs zu früh möglich")
    pg.locator("#eu-sim-all").click(); pg.wait_for_timeout(300)
    print("Nach Rest der Ligaphase, Playoffs auslosbar:", pg.locator("#eu-next").is_enabled())
    pg.screenshot(path="eu1.png")
    pg.locator("#eu-next").click(); pg.wait_for_selector(".eu-tie")
    print("Playoff-Duelle:", pg.locator(".eu-tie").count(), "| Partien:", pg.locator(".eu-tie .lr-game").count())
    rounds=[]
    for k in range(4):
        pg.locator("#eu-sim-round").click(); pg.wait_for_timeout(200)
        # Elfmeter ggf. schon gesetzt durch Simulation
        en=pg.locator("#eu-next").is_enabled()
        if not en: print("Runde", k, "nicht komplett?"); break
        pg.locator("#eu-next").click(); pg.wait_for_timeout(200)
        rounds.append((pg.locator(".eu-tie").count(), pg.locator(".eu-tie .lr-game").count()))
    print("Runden (Duelle, Partien):", rounds)
    pg.locator("#eu-sim-round").click(); pg.wait_for_timeout(200)
    print("Champion-Box:", pg.locator(".lr-champ-box .disp").inner_text())
    pg.screenshot(path="eu2.png")
    pg.locator("#eu-close").click(); pg.locator("#eu-close-ok").click(); pg.wait_for_timeout(200)
    print("Nach Abschluss wieder Vorschau:", pg.locator(".eu-list li").count())
    pg.locator(".lr-tab", has_text="Historie").click(); pg.wait_for_timeout(200)
    print("Historie:", pg.locator(".lr-hist-row").count(), pg.locator(".lr-hist-row").first.inner_text().replace("\n"," | "))
    pg.locator(".lr-hist-row").first.click(); pg.wait_for_timeout(200)
    print("Bracket-Spalten:", pg.locator(".lr-bracket > div").count(), "| Tabelle:", pg.locator(".lr-hist-body .lr-tbl tbody tr").count())
    print("Fehler:", errs)
    b.close()

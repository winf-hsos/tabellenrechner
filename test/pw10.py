import os
from playwright.sync_api import sync_playwright
import re
URL="file://"+os.path.dirname(os.path.abspath(__file__))+"/index.html"
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={"width":1300,"height":1000}).new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_selector(".lr-tab"); pg.locator("#tab-euro").click()
    pg.locator("#eu-start").click(); pg.wait_for_selector(".lr-game")
    pg.locator("#eu-sim-md").click(); pg.wait_for_timeout(200)
    print("Torschützen-Buttons am Spieltag:", pg.locator(".lr-sim", has_text="Torschützen").count())
    # Kader öffnen
    pg.locator(".lr-str-btn", has_text="Kader").first.click(); pg.wait_for_selector(".lr-modal")
    print("Kader-Fenster:", pg.locator(".lr-modal h2").first.inner_text(), "| Spielerzeilen:", pg.locator(".lr-modal input").count())
    pg.keyboard.press("Escape")
    # Torschützen-Fenster
    pg.locator(".lr-sim", has_text="Torschützen").first.click(); pg.wait_for_selector(".lr-modal")
    print("Torschützen-Fenster:", pg.locator(".lr-modal h2").first.inner_text()); pg.keyboard.press("Escape")
    pg.locator("#eu-sim-all").click(); pg.locator("#eu-next").click()
    for k in range(4):
        pg.locator("#eu-sim-round").click(); pg.locator("#eu-next").click()
    pg.locator("#eu-sim-round").click()
    print("KO Torschützen-Buttons:", pg.locator(".lr-sim", has_text="Torschützen").count())
    pg.locator("#eu-fill").click()
    pg.locator(".lr-tab", has_text="Torjäger").click()
    blk=pg.locator(".lr-top-h", has_text="Champions League").locator("xpath=..")
    print("Torjäger CL:", blk.locator("tbody tr").count(), "|", blk.locator("tbody tr").first.inner_text().replace("\n"," | ").replace("\t"," "))
    pg.locator(".lr-tab", has_text="Europa").click(); pg.locator("#eu-close").click(); pg.locator("#eu-close-ok").click()
    pg.locator(".lr-tab", has_text="Historie").click(); pg.locator(".lr-hist-row").first.click()
    print("Historie Torschützenkönig:", pg.locator(".lr-hist-body .lr-duel-h", has_text="Torschützenkönig").inner_text())
    print("Fehler:", errs); b.close()

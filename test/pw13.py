import os
from playwright.sync_api import sync_playwright
import json
D="file://"+os.path.dirname(os.path.abspath(__file__))+"/"
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":1300,"height":900}); pg=ctx.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(D+"v12.html"); pg.wait_for_selector(".lr-tab")
    pg.get_by_text("Mannschaften & Kader").first.click()
    pg.locator("input.lr-team-str").first.click(); pg.keyboard.type("55"); pg.keyboard.press("Enter")
    pg.locator("#logo-0").set_input_files("crest.png"); pg.wait_for_selector(".lr-logo-pick img")
    pg.get_by_role("button", name="Übernehmen").click(); pg.wait_for_timeout(600)
    pg.locator("#tab-euro").click()
    for c in ["cl","el","ecl"]:
        pg.locator(f"#eu-{c}").click(); pg.locator("#eu-start").click(); pg.locator("#eu-sim-all").click(); pg.locator("#eu-next").click()
        if c=="cl":
            for k in range(4):
                pg.locator("#eu-sim-round").click(); pg.locator("#eu-next").click()
            pg.locator("#eu-sim-round").click()
    pg.wait_for_timeout(1000)
    raw=pg.evaluate("localStorage.getItem('ligarechner:v2')"); print("Bytes:", len(raw))
    pg2=ctx.new_page(); pg2.on("pageerror", lambda e: errs.append("NEU: "+str(e)))
    pg2.goto(D+"index.html"); pg2.wait_for_selector(".lr-tab"); pg2.wait_for_timeout(500)
    pg2.get_by_text("Mannschaften & Kader").first.click()
    print("neue Version: erste Stärke:", pg2.locator("input.lr-team-str").first.input_value(), "| Logos:", pg2.locator(".lr-logo-pick img").count())
    pg2.keyboard.press("Escape"); pg2.locator("#tab-euro").click(); pg2.wait_for_timeout(300)
    print("Euro CL Champion-Box:", pg2.locator(".lr-champ-box").count(), "| Fehler:", errs); b.close()

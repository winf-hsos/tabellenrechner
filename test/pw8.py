import os
from playwright.sync_api import sync_playwright
import re
URL="file://"+os.path.dirname(os.path.abspath(__file__))+"/index.html"
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={"width":1300,"height":1000}).new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_selector(".lr-tab"); pg.locator("#tab-euro").click()
    for c in ["cl","el","ecl"]:
        pg.locator(f"#eu-{c}").click(); pg.locator("#eu-start").click(); pg.locator("#eu-sim-all").click(); pg.locator("#eu-next").click()
        for k in range(4):
            pg.locator("#eu-sim-round").click(); pg.locator("#eu-next").click()
        pg.locator("#eu-sim-round").click(); pg.locator("#eu-close").click(); pg.locator("#eu-close-ok").click()
    for name in ["Bundesliga","2. Bundesliga","3. Liga"]:
        pg.locator(".lr-tab", has_text=re.compile("^"+re.escape(name)+"$")).click()
        pg.get_by_role("button", name="Rest der Saison").click(); pg.wait_for_timeout(150)
    pg.locator(".lr-tab", has_text="Historie").click()
    pg.get_by_role("button", name="Alle Ligen abschließen").click()
    pg.get_by_role("button", name=re.compile("Abschließen und neu besetzen")).click(); pg.wait_for_timeout(400)
    print("Überschriften:", pg.locator(".lr-hist-group-h").all_inner_texts())
    print("Filter:", pg.locator(".lr-rounds .lr-round-btn").all_inner_texts())
    pg.locator(".lr-rounds .lr-round-btn", has_text="Europa League").click()
    print("Nur EL – Zeilen:", pg.locator(".lr-hist-row").count(), "| Überschriften:", pg.locator(".lr-hist-group-h").all_inner_texts())
    pg.locator(".lr-rounds .lr-round-btn", has_text="Alle").click()
    pg.screenshot(path="hist.png", full_page=False)
    print("Fehler:", errs); b.close()

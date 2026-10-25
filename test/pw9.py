import os
from playwright.sync_api import sync_playwright
URL="file://"+os.path.dirname(os.path.abspath(__file__))+"/index.html"
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={"width":1300,"height":1000}).new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_selector(".lr-tab")
    pg.locator(".lr-tab", has_text="Kalender").click(); pg.wait_for_selector(".lr-cal-row")
    pg.locator("select[aria-label='Wettbewerb filtern']").select_option("cl")
    rows=pg.locator(".lr-cal-row").all_inner_texts()
    print("CL-Termine:", len(rows)); print(" | ".join(r.replace("\n"," ") for r in rows[:4])); print(" | ".join(r.replace("\n"," ") for r in rows[-3:]))
    pg.locator("select[aria-label='Wettbewerb filtern']").select_option("ecl"); print("ECL-Termine:", pg.locator(".lr-cal-row").count(), pg.locator(".lr-cal-row").first.inner_text().replace("\n"," "))
    pg.locator("select[aria-label='Wettbewerb filtern']").select_option("alle"); pg.screenshot(path="cal.png")
    # Sprung: ECL Ligaphase Spieltag 3
    pg.locator("select[aria-label='Wettbewerb filtern']").select_option("ecl")
    pg.locator(".lr-cal-row", has_text="3. Spieltag").click(); pg.wait_for_timeout(200)
    print("Sprung -> Tab Europa aktiv:", pg.locator("#tab-euro").get_attribute("data-on"), "| Wettbewerb:", pg.locator(".lr-bar .disp").first.inner_text())
    print("Fehler:", errs); b.close()

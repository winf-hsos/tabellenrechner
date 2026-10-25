import os
from playwright.sync_api import sync_playwright
URL="file://"+os.path.dirname(os.path.abspath(__file__))+"/index.html"
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={"width":1300,"height":1000}).new_page()
    pg.goto(URL); pg.wait_for_selector(".lr-tab"); pg.locator("#tab-euro").click(); pg.locator("#eu-start").click(); pg.wait_for_selector(".lr-game")
    pg.locator(".lr-str-btn", has_text="Kader").first.click(); pg.wait_for_selector(".lr-modal")
    print(pg.locator(".lr-modal h2").first.inner_text(), [pg.locator(".lr-modal input").nth(i).input_value() for i in range(1,14)])
    b.close()

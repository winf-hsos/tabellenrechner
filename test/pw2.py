import os
from playwright.sync_api import sync_playwright
img="/mnt/user-data/attachments/ee8c3cea-868f-559b-99f4-b5534cd62ae6/09db1cf0-image.webp"
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={"width":1200,"height":900}).new_page()
    pg.goto("file://"+os.path.dirname(os.path.abspath(__file__))+"/index.html")
    pg.wait_for_selector(".lr-tab"); pg.get_by_text("Mannschaften & Kader").first.click()
    with pg.expect_file_chooser(timeout=3000) as fc:
        pg.locator(".lr-logo-pick").first.click()
    fc.value.set_files(img)
    pg.wait_for_selector(".lr-logo-pick img", timeout=3000)
    print("Echter Klick öffnet Dateiauswahl, Logo gesetzt:", pg.locator(".lr-logo-pick img").count())
    # Auswahl der gleichen Datei erneut (sollte wieder funktionieren)
    with pg.expect_file_chooser(timeout=3000) as fc:
        pg.locator(".lr-logo-pick").first.click()
    fc.value.set_files(img); pg.wait_for_timeout(300)
    print("Zweites Mal ok:", pg.locator(".lr-logo-pick img").count())
    b.close()

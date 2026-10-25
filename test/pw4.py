import os
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={"width":1200,"height":900}).new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://"+os.path.dirname(os.path.abspath(__file__))+"/index.html")
    pg.wait_for_selector(".lr-tab"); pg.get_by_text("Mannschaften & Kader").first.click()
    f=pg.locator("input.lr-team-str")
    print("Felder:", f.count(), [f.nth(i).input_value() for i in range(3)])
    f.nth(0).click(); pg.keyboard.type("70"); pg.keyboard.press("Tab")
    print("Fokus Feld:", pg.evaluate("document.activeElement.dataset.str"))
    pg.keyboard.type("65"); pg.keyboard.press("Enter"); pg.keyboard.type("60"); pg.keyboard.press("Shift+Tab")
    print("Fokus nach Shift+Tab:", pg.evaluate("document.activeElement.dataset.str"))
    print("Werte:", [f.nth(i).input_value() for i in range(4)])
    pg.screenshot(path="tab2.png")
    # Kader-Check: Teamstärke im Kader = 70
    pg.get_by_role("button", name="Kader", exact=True).first.click(); pg.wait_for_selector("#team-staerke")
    print("Kader Bayern:", pg.locator("#team-staerke").input_value()); 
    print("Fehler:", errs)
    b.close()

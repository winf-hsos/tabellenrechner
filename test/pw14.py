import os
from playwright.sync_api import sync_playwright
D="file://"+os.path.dirname(os.path.abspath(__file__))+"/"
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":1300,"height":900}); ctx.grant_permissions(["clipboard-read","clipboard-write"]); pg=ctx.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(D+"index.html"); pg.wait_for_selector(".lr-tab")
    pg.get_by_text("Mannschaften & Kader").first.click()
    pg.locator("input.lr-team-str").first.click(); pg.keyboard.type("55"); pg.keyboard.press("Enter")
    pg.locator("#logo-0").set_input_files("crest.png"); pg.wait_for_selector(".lr-logo-pick img")
    pg.get_by_role("button", name="Übernehmen").click(); pg.wait_for_timeout(700)
    pg.locator(".lr-tab", has_text="Historie").click(); pg.locator("#backup-open").click(); pg.wait_for_selector("#backup-copy")
    pg.locator("#backup-copy").click(); pg.wait_for_timeout(300)
    clip=pg.evaluate("navigator.clipboard.readText()"); print("Sicherung kopiert, Zeichen:", len(clip))
    # frischer Browser-Kontext = leerer Speicher -> wiederherstellen
    ctx2=b.new_context(viewport={"width":1300,"height":900}); pg2=ctx2.new_page(); pg2.on("pageerror", lambda e: errs.append(str(e)))
    pg2.goto(D+"index.html"); pg2.wait_for_selector(".lr-tab")
    pg2.get_by_text("Mannschaften & Kader").first.click(); print("leer: Stärke", pg2.locator("input.lr-team-str").first.input_value(), "Logos", pg2.locator(".lr-logo-pick img").count()); pg2.keyboard.press("Escape")
    pg2.locator(".lr-tab", has_text="Historie").click(); pg2.locator("#backup-open").click(); pg2.locator("#backup-paste").fill(clip); pg2.locator("#backup-restore").click(); pg2.wait_for_timeout(400)
    pg2.locator(".lr-tab", has_text="Bundesliga").first.click(); pg2.get_by_text("Mannschaften & Kader").first.click()
    print("wiederhergestellt: Stärke", pg2.locator("input.lr-team-str").first.input_value(), "Logos", pg2.locator(".lr-logo-pick img").count())
    # defekter Speicher
    ctx3=b.new_context(); ctx3.add_init_script("try{localStorage.setItem('ligarechner:v2','{kaputt');}catch(e){}"); pg3=ctx3.new_page(); pg3.goto(D+"index.html"); pg3.wait_for_selector(".lr-tab"); pg3.wait_for_timeout(300)
    print("defekter Speicher: Rettung vorhanden:", pg3.evaluate("localStorage.getItem('ligarechner:v2:rettung')"), "| Status:", pg3.locator(".lr-status").inner_text())
    print("Fehler:", errs); b.close()

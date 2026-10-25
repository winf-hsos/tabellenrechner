import os
from playwright.sync_api import sync_playwright
import json
img="/mnt/user-data/attachments/ee8c3cea-868f-559b-99f4-b5534cd62ae6/09db1cf0-image.webp"
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":1200,"height":900}); pg=ctx.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)
    pg.goto("file://"+os.path.dirname(os.path.abspath(__file__))+"/index.html")
    pg.wait_for_selector(".lr-tab")
    pg.get_by_text("Mannschaften & Kader").first.click()
    # Zeile des FC Bayern finden
    idx=pg.evaluate("""()=>{const ins=[...document.querySelectorAll("input[aria-label^='Mannschaft ']")];return ins.findIndex(i=>/Bayern/.test(i.value))}""")
    print("Bayern-Index:", idx, pg.evaluate("document.querySelectorAll(\"input[aria-label^='Mannschaft ']\")[%d].value"%idx))
    pg.set_input_files(f"#logo-{idx}", img)
    pg.wait_for_selector(".lr-logo-pick img")
    pg.screenshot(path="modal.png")
    pg.get_by_role("button", name="Übernehmen").click()
    pg.wait_for_timeout(800)
    n_tbl=pg.evaluate("document.querySelectorAll('.lr-tbl td.name img.lr-logo').length")
    print("Logos in Tabelle:", n_tbl)
    pg.screenshot(path="bl.png", full_page=False)
    # Spieltag: Logo in Spielzeile (Bayern spielt irgendwann) -> Zähle im aktuellen Spieltag
    print("Logos im Spielplan (Spieltag 1):", pg.evaluate("document.querySelectorAll('.lr-game .lr-logo').length"))
    # Speicher prüfen und Neuladen
    pg.wait_for_timeout(1000)
    pg.reload(); pg.wait_for_selector(".lr-tab"); pg.wait_for_timeout(500)
    print("nach Neuladen in Tabelle:", pg.evaluate("document.querySelectorAll('.lr-tbl td.name img.lr-logo').length"))
    sz=pg.evaluate("(JSON.parse(localStorage.getItem('ligarechner:v2')).logos['FC Bayern München']||'').length")
    print("Logo-Größe (Zeichen):", sz)
    # Entfernen
    pg.get_by_text("Mannschaften & Kader").first.click()
    pg.get_by_role("button", name="Logo von FC Bayern München entfernen").click()
    print("nach Entfernen im Dialog:", pg.evaluate("document.querySelectorAll('.lr-logo-pick img').length"))
    # Mobil
    pg.keyboard.press("Escape")
    print("Fehler:", errs)
    b.close()

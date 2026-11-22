# Titel eines Vereins in der Suche und auf der Vereinsseite
import os, json
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
def state(pg):
    pg.wait_for_timeout(900)
    return json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={"width": 1400, "height": 1000}).new_page(); perr = []
    pg.on("pageerror", lambda e: perr.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    pg.get_by_role("button", name="Saison durchspielen").first.click(); pg.wait_for_selector("#playall-go"); pg.locator("#playall-go").click(); pg.wait_for_timeout(3000)
    d = state(pg)
    bl1 = [h for h in d["history"] if h["leagueId"] == "bl1"][0]
    champ = bl1["table"][0]["name"]
    ok(bool(champ), f"Meister Bundesliga 2026/27: {champ}")
    pg.fill("#search-q", champ[:8]); pg.wait_for_selector("#search-res")
    row = pg.locator("#search-res button", has_text=champ).first
    ok("🏆" in row.inner_text() and "Titel" in row.inner_text(), f"Suche zeigt die Titel: {row.inner_text().replace(chr(10), ' ')}")
    row.click(); pg.wait_for_selector("#club-modal")
    ok(pg.locator("#club-titles").count() == 1, "Vereinsseite zeigt den Kasten „Titel“")
    t = pg.locator("#club-titles").inner_text()
    ok("Meisterschaft – Bundesliga" in t and "2026/27" in t, f"Titelkasten: {t.replace(chr(10), ' | ')}")
    ok("🏆" in pg.locator("#club-modal .lr-k-sub").inner_text(), "Kopfzeile nennt die Zahl der Titel")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    # Verein ohne Titel: kein Kasten
    loser = bl1["table"][-1]["name"]
    pg.fill("#search-q", loser[:8]); pg.wait_for_selector("#search-res")
    pg.locator("#search-res button", has_text=loser).first.click(); pg.wait_for_selector("#club-modal")
    ok(pg.locator("#club-titles").count() == 0, f"{loser}: kein Titelkasten")
    ok(not perr, f"keine JS-Fehler {perr[:2]}")
    b.close()
print("Fehler:", errs)

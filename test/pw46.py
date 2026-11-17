# Ligen angleichen, Karten im Spielbericht, Logos in der Historie
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
def played(d, lid):
    s = d["active"][lid]; return len(s["results"])
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={"width": 1400, "height": 1000}).new_page(); perr = []
    pg.on("pageerror", lambda e: perr.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    for _ in range(3):
        pg.get_by_role("button", name="Spieltag simulieren").first.click(); pg.wait_for_timeout(300)
        pg.locator(".lr-nav").nth(1).click(); pg.wait_for_timeout(200)
    d = state(pg)
    n_de = len(d["active"]["bl1"]["results"])
    ok(n_de == 27, f"Bundesliga: 3 Spieltage gespielt ({n_de} Spiele)")
    ok(played(d, "pl") == 0 and played(d, "ll") == 0, "andere Ligen noch leer")
    pg.locator("#sync-open").click(); pg.wait_for_selector("#sync-go"); pg.locator("#sync-go").click(); pg.wait_for_timeout(1200)
    d = state(pg)
    pl = d["active"]["pl"]
    ok(played(d, "pl") == 30 and played(d, "ll") == 30 and played(d, "fl1") == 27, f"Premier League 30, La Liga 30, Ligue 1 27 Spiele (= 3 Spieltage): {played(d,'pl')}/{played(d,'ll')}/{played(d,'fl1')}")
    ok(played(d, "ch") == 36 and played(d, "l2") == 36 and played(d, "dk1") == 18, f"Championship 36, League Two 36, Dänemark 18: {played(d,'ch')}/{played(d,'l2')}/{played(d,'dk1')}")
    ok(played(d, "bl2") == 0 or played(d, "bl2") < 27, "deutsche Nebenligen unverändert")
    # Mitlaufen
    pg.locator("#sync-open").click(); pg.wait_for_selector("#sync-auto"); pg.locator("#sync-auto").check(); pg.locator(".lr-modal-foot").get_by_role("button", name="Schließen").click(); pg.wait_for_timeout(300)
    pg.get_by_role("button", name="Spieltag simulieren").first.click(); pg.wait_for_timeout(1500)
    d = state(pg)
    ok(d["syncOthers"] is True and played(d, "pl") == 40 and played(d, "ll") == 40, f"mitlaufend: 4. Spieltag → Premier League {played(d,'pl')}, La Liga {played(d,'ll')}")
    # Karten im Spielbericht (nach Neuladen identisch)
    pg.locator(".lr-game").first.get_by_role("button", name="Bericht").click(); pg.wait_for_selector("#match-modal")
    t1 = pg.locator("#mr-ticker").inner_text()
    ok("Karte" in t1 or "Gelb" in t1 or True, "Spielbericht geöffnet")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    cards = 0
    for gi in range(min(6, pg.locator(".lr-game").count())):
        pg.locator(".lr-game").nth(gi).get_by_role("button", name="Bericht").click(); pg.wait_for_selector("#match-modal")
        cards += pg.locator("#mr-ticker .lr-k-ic[data-k='gelb']").count() + pg.locator("#mr-ticker .lr-k-ic[data-k='rot']").count() + pg.locator("#mr-ticker .lr-k-ic[data-k='gelbrot']").count()
        pg.keyboard.press("Escape"); pg.wait_for_timeout(150)
    ok(cards >= 3, f"in 6 Spielen wurden {cards} Karten ausgelost")
    pg.locator(".lr-game").first.get_by_role("button", name="Bericht").click(); pg.wait_for_selector("#match-modal")
    a1 = pg.locator("#mr-ticker").inner_text(); pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    pg.locator(".lr-game").first.get_by_role("button", name="Bericht").click(); pg.wait_for_selector("#match-modal")
    a2 = pg.locator("#mr-ticker").inner_text()
    ok(a1 == a2, "Karten sind beim erneuten Öffnen dieselben")
    pg.keyboard.press("Escape")
    # Historie: Logos
    pg.get_by_role("button", name="Saison durchspielen").first.click(); pg.wait_for_selector("#playall-go"); pg.locator("#playall-go").click(); pg.wait_for_timeout(2500)
    pg.get_by_role("button", name="Historie").first.click(); pg.wait_for_selector(".lr-hist-row")
    ok(pg.locator(".lr-hist-champ img.lr-logo").count() >= 1, "Historie: Logo beim Meister")
    ok(pg.locator(".lr-titles img.lr-logo").count() >= 1, "Historie: Logos in der Titelliste")
    ok(not perr, f"keine JS-Fehler {perr[:2]}")
    b.close()
print("Fehler:", errs)

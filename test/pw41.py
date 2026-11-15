# Tippspiel: Mitspieler, Spiele, Tipps, Ergebnis, Punkte (auch Gleichstand), Neuladen
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
def fill(pg, label, v):
    e = pg.locator(f"input[aria-label='Tore {label}']"); e.fill(v)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={"width": 1300, "height": 1000}).new_page(); perr = []
    pg.on("pageerror", lambda e: perr.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    pg.locator("#sec-cu").click(); pg.locator("#tab-cu-tips").click(); pg.wait_for_selector("#tip-pname")
    ok(pg.locator("#tip-padd").is_disabled(), "ohne Namen kein Hinzufügen")
    for n in ["Anna", "Ben", "Clara"]:
        pg.fill("#tip-pname", n); pg.locator("#tip-padd").click()
    ok(pg.locator("#tip-rank .lr-cq-row").count() == 3, "3 Mitspieler eingetragen")
    pg.fill("#tip-pname", "anna"); ok(pg.locator("#tip-padd").is_enabled(), "Button aktiv"); pg.locator("#tip-padd").click()
    ok(pg.locator("#tip-rank .lr-cq-row").count() == 3, "doppelter Name wird nicht angelegt")
    # Spiel 1: Ergebnis 2:1; Anna 2:1 (exakt), Ben 1:0 (Tendenz), Clara 3:0 (Tendenz, weiter weg)
    pg.fill("#tip-home", "Bayern"); pg.fill("#tip-away", "Dortmund"); pg.locator("#tip-madd").click()
    m = pg.locator("[data-match='Bayern - Dortmund']")
    ok(m.count() == 1, "Spiel angelegt")
    for who, (h, a) in {"Anna": ("2", "1"), "Ben": ("1", "0"), "Clara": ("3", "0")}.items():
        fill(pg, f"{who} Tipp Bayern", h); fill(pg, f"{who} Tipp Dortmund", a)
    ok(m.locator("[data-act=res]").is_disabled(), "Ergebnis speichern erst mit beiden Toren")
    fill(pg, "Ergebnis Bayern", "2"); fill(pg, "Ergebnis Dortmund", "1"); m.locator("[data-act=res]").click(); pg.wait_for_timeout(200)
    ok("Punkt für: Anna" in m.locator("[data-result-note]").inner_text() and "und" not in m.locator("[data-result-note]").inner_text(), "exakter Tipp: nur Anna bekommt den Punkt")
    # Spiel 2: Ergebnis 1:1; Anna 0:0 und Ben 2:2 (beide gleich weit, Tendenz richtig), Clara 1:0 (Tendenz falsch)
    pg.fill("#tip-home", "Köln"); pg.fill("#tip-away", "Mainz"); pg.locator("#tip-madd").click()
    m2 = pg.locator("[data-match='Köln - Mainz']")
    for who, (h, a) in {"Anna": ("0", "0"), "Ben": ("2", "2"), "Clara": ("1", "0")}.items():
        fill(pg, f"{who} Tipp Köln", h); fill(pg, f"{who} Tipp Mainz", a)
    fill(pg, "Ergebnis Köln", "1"); fill(pg, "Ergebnis Mainz", "1"); m2.locator("[data-act=res]").click(); pg.wait_for_timeout(200)
    t = m2.locator("[data-result-note]").inner_text()
    ok("Anna" in t and "Ben" in t and "Clara" not in t, f"Gleichstand: beide bekommen einen Punkt ({t})")
    pts = {r.get_attribute("data-player"): int(r.locator(".lr-cq-pct").get_attribute("data-pts")) for r in pg.locator("#tip-rank .lr-cq-row").all()}
    ok(pts == {"Anna": 2, "Ben": 1, "Clara": 0}, f"Punktestand {pts}")
    ok(pg.locator("#tip-rank .lr-cq-row").first.get_attribute("data-player") == "Anna", "Rangliste sortiert")
    # Spiel 3: Tendenz schlägt Abstand: Ergebnis 0:3; Anna 1:0 (falsche Tendenz, Abstand 4), Ben 0:1 (richtig, Abstand 2)
    pg.fill("#tip-home", "A"); pg.fill("#tip-away", "B"); pg.locator("#tip-madd").click()
    m3 = pg.locator("[data-match='A - B']")
    fill(pg, "Anna Tipp A", "1"); fill(pg, "Anna Tipp B", "0"); fill(pg, "Ben Tipp A", "0"); fill(pg, "Ben Tipp B", "1")
    fill(pg, "Ergebnis A", "0"); fill(pg, "Ergebnis B", "3"); m3.locator("[data-act=res]").click(); pg.wait_for_timeout(200)
    ok("Punkt für: Ben" == m3.locator("[data-result-note]").inner_text(), "richtige Tendenz schlägt kleineren Abstand")
    # Ergebnis ändern / löschen -> Punkte rechnen sich neu
    m3.locator("[data-act=res-clear]").click(); pg.wait_for_timeout(200)
    pts = {r.get_attribute("data-player"): int(r.locator(".lr-cq-pct").get_attribute("data-pts")) for r in pg.locator("#tip-rank .lr-cq-row").all()}
    ok(pts["Ben"] == 1, "Ergebnis gelöscht: Punkt wieder weg")
    # Neuladen
    st = state(pg)["tips"]
    ok(len(st["players"]) == 3 and len(st["matches"]) == 3, "gespeichert (3 Spieler, 3 Spiele)")
    pg.reload(); pg.wait_for_selector(".lr-tab"); pg.locator("#sec-cu").click(); pg.locator("#tab-cu-tips").click(); pg.wait_for_selector("#tip-rank")
    pts = {r.get_attribute("data-player"): int(r.locator(".lr-cq-pct").get_attribute("data-pts")) for r in pg.locator("#tip-rank .lr-cq-row").all()}
    ok(pts == {"Anna": 2, "Ben": 1, "Clara": 0}, f"nach dem Neuladen: {pts}")
    # Mitspieler löschen
    pg.locator("button[aria-label='Clara entfernen']").click(); pg.wait_for_timeout(200)
    ok(pg.locator("#tip-rank .lr-cq-row").count() == 2, "Mitspieler entfernt")
    ok(not perr, f"keine JS-Fehler {perr[:2]}")
    b.close()
print("Fehler:", errs)

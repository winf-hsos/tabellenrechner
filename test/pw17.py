# Längste Serie ohne Niederlage: Anzeige unter der Tabelle und in der Historie
import os, json, re
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_context(viewport={"width": 1300, "height": 900}).new_page()
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    ok(pg.locator("#unbeaten-box").count() == 0, "ohne Ergebnisse keine Anzeige")
    pg.get_by_role("button", name="Rest der Saison").click(); pg.wait_for_timeout(600)
    ok(pg.locator("#unbeaten-box").count() == 1, "nach der Saison erscheint die Anzeige unter der Tabelle")
    rows = pg.locator(".lr-unb-row")
    n = rows.count()
    ok(1 <= n <= 3, f"{n} Einträge (höchstens drei)")
    lens = [int(re.search(r"(\d+) Spiele", t).group(1)) for t in rows.locator("b").all_inner_texts()]
    ok(lens == sorted(lens, reverse=True) and lens[0] >= 2, f"absteigend sortiert: {lens}")
    ok("Spieltag" in rows.first.inner_text(), "Zeitraum in Spieltagen steht dabei")
    top = rows.first.inner_text().replace("\n", " ")
    print("Spitze:", top)
    # Saison abschließen -> Historie zeigt die Serie
    pg.get_by_role("button", name="Saison abschließen").click()
    pg.wait_for_timeout(300)
    for name in ("Saison abschließen", "Abschließen", "Ja"):
        btn = pg.locator(".lr-modal").get_by_role("button", name=name)
        if btn.count(): btn.last.click(); break
    pg.wait_for_timeout(800)
    d = json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
    e = d["history"][0] if d["history"] else {}
    ok(bool(e.get("unbeaten")) and e["unbeaten"][0]["len"] == lens[0], "Archiv speichert die längste Serie")
    pg.locator(".lr-tab", has_text="Historie").click(); pg.wait_for_timeout(300)
    pg.locator(".lr-hist-row").first.click()
    pg.wait_for_timeout(300)
    ok("Längste Serie ohne Niederlage" in pg.locator("body").inner_text(), "Historie nennt die längste Serie")
    b.close()
print("Fehler:", errs)

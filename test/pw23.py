# Europapokal: deutsche/englische Klubs sind in der laufenden Runde markiert; Versionsanzeige
import os, re
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
    info = pg.locator("#build-info").inner_text()
    ok(re.match(r"Stand \d\d\.\d\d\.\d{4} \d\d:\d\d", info) is not None, f"Versionsanzeige: {info}")
    pg.locator("#tab-euro").click(); pg.locator("#eu-start").click(); pg.wait_for_timeout(600)
    tags = pg.locator(".lr-tbl .lr-ctag").all_inner_texts()
    ok(tags.count("EN") == 5 and tags.count("DE") == 4, f"CL-Tabelle: {tags.count('EN')}× EN, {tags.count('DE')}× DE")
    ok(pg.locator(".lr-game .lr-ctag").count() > 0, "Spielzeilen der Ligaphase zeigen die Herkunft")
    ok(pg.locator(".lr-tbl tr", has_text="Manchester City").locator(".lr-ctag").inner_text() == "EN", "Manchester City ist als EN markiert")
    stk = [int(x) for x in pg.locator(".lr-tbl td.str").all_inner_texts()]
    city = int(pg.locator(".lr-tbl tr", has_text="Manchester City").locator("td.str").inner_text())
    ok(city == 94, f"Manchester City hat in der CL die Stärke {city} (Premier League 94)")
    ok(max(stk) == 99 and min(stk) == 65, f"CL-Stärken {min(stk)}–{max(stk)} (soll 65–99)")
    # Europa League
    pg.locator("button", has_text="Europa League").first.click(); pg.locator("#eu-start").click(); pg.wait_for_timeout(600)
    stk = [int(x) for x in pg.locator(".lr-tbl td.str").all_inner_texts()]
    tags = pg.locator(".lr-tbl .lr-ctag").all_inner_texts()
    ok(max(stk) == 88 and min(stk) == 60, f"EL-Stärken {min(stk)}–{max(stk)} (soll 60–88)")
    ok(tags.count("EN") == 3 and tags.count("DE") == 2, f"EL-Tabelle: {tags.count('EN')}× EN, {tags.count('DE')}× DE")
    pg.locator("button", has_text="Conference League").first.click(); pg.locator("#eu-start").click(); pg.wait_for_timeout(600)
    stk = [int(x) for x in pg.locator(".lr-tbl td.str").all_inner_texts()]
    tags = pg.locator(".lr-tbl .lr-ctag").all_inner_texts()
    ok(max(stk) == 85 and min(stk) == 55, f"ECL-Stärken {min(stk)}–{max(stk)} (soll 55–85)")
    ok(tags.count("EN") == 1 and tags.count("DE") == 1, f"ECL-Tabelle: {tags.count('EN')}× EN, {tags.count('DE')}× DE")
    b.close()
print("Fehler:", errs)

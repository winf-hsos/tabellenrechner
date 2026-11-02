# Serie ohne Niederlage zieht sich über Saisons
import os, json
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
def state(pg): return json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={"width": 1300, "height": 1000}).new_page(); perr = []
    pg.on("pageerror", lambda e: perr.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    pg.locator("#playall-open").click(); pg.locator("#playall-go").click(); pg.wait_for_timeout(6000)
    d = state(pg)
    lg = [h for h in d["history"] if h["type"] == "league" and h["leagueId"] == "bl1"]
    ok(len(lg) == 1 and isinstance(lg[0].get("unbeatenEnd"), list), "Historie speichert die zum Saisonende laufenden Serien")
    ok(lg[0]["label"] == "2026/27" and d["active"]["bl1"]["label"] == "2027/28", "Saison 2026/27 archiviert, 2027/28 läuft")
    b.close()
    # präparierter Stand: Team 0 der Bundesliga hat eine laufende Serie über 9 Spiele aus der Vorsaison
    team = d["active"]["bl1"]["teams"][0]
    lg[0]["unbeatenEnd"] = [{"name": team, "len": 9, "from": 26, "fromLabel": "2026/27", "toMd": 34, "endLabel": "2026/27"}]
    b = p.chromium.launch(); ctx = b.new_context(viewport={"width": 1300, "height": 1000})
    ctx.add_init_script("localStorage.getItem('ligarechner:v2')||localStorage.setItem('ligarechner:v2'," + json.dumps(json.dumps(d)) + ")")
    pg = ctx.new_page(); pg.on("pageerror", lambda e: perr.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab"); pg.wait_for_timeout(500)
    box = pg.locator("#unbeaten-box")
    ok(box.count() == 1, "Kasten zu Saisonbeginn sichtbar (Serie aus der Vorsaison)")
    t = box.inner_text() if box.count() else ""
    ok(team in t and "9 Spiele" in t and "seit 2026/27, 26. Spieltag" in t and "läuft noch" in t, "Kasten: " + t.replace("\n", " | "))
    # erster Spieltag: Sieg/Remis verlängert die Serie
    pg.get_by_role("button", name="Spieltag simulieren").first.click(); pg.wait_for_timeout(700)
    t2 = pg.locator("#unbeaten-box").inner_text() if pg.locator("#unbeaten-box").count() else ""
    print("nach Spieltag 1:", t2.replace("\n", " | "))
    ok(("10 Spiele" in t2 and "1. Spieltag" in t2) or "9 Spiele" in t2, "Serie wächst (10 Spiele) oder bleibt als Vorsaison-Rekord stehen")
    ok(not perr, f"keine JS-Fehler {perr[:2]}")
    b.close()
print("Fehler:", errs)

# Echter DFB-Pokal 2026/27: echte Auslosung und Ergebnisse, danach normal weiterspielen
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
    pg.get_by_role("button", name="DFB-Pokal").first.click(); pg.wait_for_selector("#cup-real")
    pg.locator("#cup-real").click(); pg.wait_for_timeout(800)
    c = state(pg)["cup"]
    ok(c and c.get("real") and [r["name"] for r in c["rounds"]] == ["1. Runde", "2. Runde", "Achtelfinale"], "echter Pokal: 1. Runde, 2. Runde, Achtelfinale")
    ok([len(r["games"]) for r in c["rounds"]] == [32, 16, 8], "32 / 16 / 8 Spiele")
    r1 = c["rounds"][0]["games"]
    ok(all(g["hg"] != "" for g in r1) and all(g["hg"] != "" for g in c["rounds"][1]["games"]), "1. und 2. Runde mit echten Ergebnissen")
    ok(all(g["hg"] == "" for g in c["rounds"][2]["games"]), "Achtelfinale noch offen")
    names = {g[k]["name"] for r in c["rounds"] for g in r["games"] for k in ("h", "a")}
    ok("FC Bayern München" in names and "SV Werder Bremen" not in names and "Werder Bremen" in names, "Vereinsnamen der App (z. B. Werder Bremen)")
    ok(any(g["pen"] in ("h", "a") for g in r1), "Elfmeterschießen übernommen")
    sa = [g for g in r1 if g["h"]["name"] == "1. FC Saarbrücken"][0]
    ok(sa["a"]["name"] == "Hertha BSC" and sa["hg"] == "1" and sa["ag"] == "1" and sa["pen"] == "a", "Saarbrücken – Hertha 1:1, Hertha im Elfmeterschießen")
    ok(all(g["h"].get("squad") for r in c["rounds"] for g in r["games"]), "alle Klubs haben einen Kader")
    # Achtelfinale lässt sich normal simulieren
    pg.get_by_role("button", name="Achtelfinale").first.click(); pg.wait_for_timeout(300)
    btn = pg.get_by_role("button", name="Runde simulieren")
    ok(btn.count() >= 1, "Achtelfinale hat „Runde simulieren“")
    btn.first.click(); pg.wait_for_timeout(800)
    c = state(pg)["cup"]
    ok(all(g["hg"] != "" for g in c["rounds"][2]["games"]), "Achtelfinale simuliert")
    ok(not perr, f"keine JS-Fehler {perr[:2]}")
    b.close()
print("Fehler:", errs)

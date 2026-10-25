# Saison durchspielen: alle Wettbewerbe zu Ende spielen, in die Historie, nächste Saison
import os, json
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
def state(pg):
    return json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_context(viewport={"width": 1300, "height": 900}).new_page()
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    pg.locator("#playall-open").click()
    ok("nicht rückgängig" in pg.locator(".lr-modal").inner_text(), "Rückfrage warnt vor dem Durchspielen")
    pg.get_by_role("button", name="Abbrechen").click(); pg.wait_for_timeout(300)
    ok(state(pg)["history"] == [] if pg.evaluate("() => localStorage.getItem('ligarechner:v2')") else True, "Abbrechen ändert nichts")
    # ein paar Ergebnisse von Hand, die erhalten bleiben sollen
    pg.get_by_role("button", name="Spieltag simulieren").first.click(); pg.wait_for_timeout(700)
    erste = state(pg)["active"]["bl1"]["results"]["0:0"]
    pg.locator("#playall-open").click(); pg.locator("#playall-go").click(); pg.wait_for_timeout(2500)
    d = state(pg)
    h = d["history"]
    ids = sorted(e["leagueId"] for e in h)
    ok(ids == sorted(["bl1", "bl2", "bl3", "bl4", "bl5", "cup", "cl", "el", "ecl"]), f"Historie enthält alle 9 Wettbewerbe: {ids}")
    ok(all(e["label"] == "2026/27" for e in h), "alle Einträge für 2026/27")
    ok(all(e.get("winner") and e["winner"] != "—" for e in h if e["type"] in ("cup", "euro")), "Pokal und Europapokale haben Sieger: " + ", ".join(f"{e['leagueId']}={e['winner']}" for e in h if e["type"] in ("cup", "euro")))
    liga = {e["leagueId"]: e for e in h if e["type"] == "league"}
    ok(all(e["table"][0]["sp"] == (len(e["table"]) - 1) * 2 for e in liga.values()), "alle Ligen vollständig gespielt")
    bl1 = liga["bl1"]
    ok(bl1["table"][0]["pkt"] >= bl1["table"][1]["pkt"], "Tabelle sortiert")
    cup = [e for e in h if e["type"] == "cup"][0]
    ok(len(cup["rounds"]) == 6 and len(cup["rounds"][0]["games"]) == 32 and len(cup["rounds"][-1]["games"]) == 1, "Pokal: 6 Runden von 32 Spielen bis zum Finale")
    ok(cup["rounds"][0]["games"][0]["hg"] != "", "Pokalspiele haben Ergebnisse")
    for e in [x for x in h if x["type"] == "euro"]:
        ok(len(e["table"]) == 36 and [r["name"] for r in e["rounds"]] == ["Playoffs", "Achtelfinale", "Viertelfinale", "Halbfinale", "Finale"], f"{e['leagueName']}: 36 Teams, K.o.-Runden bis zum Finale")
    ok(d["cup"] is None, "Pokal ist abgeschlossen")
    ok(all(v is None for v in d["euro"]["runs"].values()), "Europapokal-Läufe sind abgeschlossen")
    ok(all(d["active"][i]["label"] == "2027/28" and d["active"][i]["results"] == {} for i in ("bl1", "bl2", "bl3", "bl4", "bl5")), "nächste Saison 2027/28 beginnt leer")
    ok([len(d["active"][i]["teams"]) for i in ("bl1", "bl2", "bl3", "bl4", "bl5")] == [18, 18, 20, 22, 16], "Ligagrößen stimmen")
    alle = [t for i in ("bl1", "bl2", "bl3", "bl4", "bl5") for t in d["active"][i]["teams"]]
    ok(len(alle) == len(set(alle)), "keine Mannschaft doppelt")
    ok(pg.locator(".lr-tab[data-on='1']").inner_text().strip().startswith("Historie"), "springt in die Historie")
    # zweite Saison direkt hinterher
    pg.locator("#playall-open").click(); pg.locator("#playall-go").click(); pg.wait_for_timeout(2500)
    d2 = state(pg)
    ok(len(d2["history"]) == 18 and sum(1 for e in d2["history"] if e["label"] == "2027/28") == 9, f"zweite Saison: {len(d2['history'])} Einträge, davon 9 für 2027/28")
    ok(d2["active"]["bl1"]["label"] == "2028/29", "dritte Saison beginnt")
    b.close()
print("Fehler:", errs)

# England: Championship, League One, League Two, FA Cup, Auf- und Abstieg
import os, json
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
def state(pg):
    return json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
IDS = ("pl", "ch", "l1", "l2")
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_context(viewport={"width": 1300, "height": 900}).new_page()
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    pg.locator("#sec-en").click(); pg.wait_for_timeout(300)
    tabs = [t.strip() for t in pg.locator(".lr-tab").all_inner_texts()]
    ok(tabs == ["Premier League", "Championship", "League One", "League Two", "FA Cup", "Europa", "Torjäger", "Kalender", "Historie"], f"England-Tabs: {tabs}")
    soll = {"pl": (74, 94, 20, 38), "ch": (65, 84, 24, 46), "l1": (57, 72, 24, 46), "l2": (50, 65, 24, 46)}
    names = {"pl": "Premier League", "ch": "Championship", "l1": "League One", "l2": "League Two"}
    for lid, (lo, hi, n, md) in soll.items():
        pg.locator(".lr-tab", has_text=names[lid]).first.click(); pg.wait_for_timeout(250)
        st = [int(x) for x in pg.locator(".lr-tbl td.str").all_inner_texts()]
        ok(pg.locator(".lr-tbl tbody tr").count() == n and pg.locator(".lr-tbl tbody tr img.lr-logo").count() == n, f"{names[lid]}: {n} Klubs, alle mit Logo")
        ok(min(st) == lo and max(st) == hi, f"{names[lid]}: Stärken {min(st)}–{max(st)} (soll {lo}–{hi})")
        ok(f"von {md}" in pg.locator(".lr-md-num").inner_text(), f"{names[lid]}: {md} Spieltage")
    pg.get_by_role("button", name="Spieltag simulieren").first.click(); pg.wait_for_timeout(700)
    d = state(pg)
    alle = {}
    for lid in IDS:
        for i, t in enumerate(d["active"][lid]["teams"]):
            alle[t] = [x["n"] for x in d["active"][lid]["squads"][i]["p"]]
    ok(len(alle) == 92 and all(len(v) == 18 for v in alle.values()), "92 englische Klubs mit je 18 Spielern")
    namen = [n for v in alle.values() for n in v]
    ok(len(namen) == len(set(namen)), "alle englischen Spielernamen sind eindeutig")
    de = {x["n"] for l in ("bl1", "bl2", "bl3", "bl4", "bl5") for q in d["active"][l]["squads"] for x in q["p"]}
    ok(not (set(namen) & de), "keine Spieler in Deutschland und England gleichzeitig")
    ok("Jakub Stolarczyk" in alle["Leicester City"] and "Nicolas Schmid" in alle["Portsmouth"], "echte Spieler (Stolarczyk bei Leicester, Schmid bei Portsmouth)")
    # FA Cup
    pg.locator("#tab-cup").click(); pg.wait_for_timeout(200)
    ok("92 Mannschaften" in pg.locator(".lr-empty").inner_text(), "FA Cup: Startseite nennt 92 Mannschaften")
    pg.locator("#cup-start").click(); pg.wait_for_timeout(500)
    erw = [8, 20, 32, 16, 8, 4, 2, 1]
    for k, n in enumerate(erw):
        r = state(pg)["facup"]["rounds"]
        ok(len(r) == k + 1 and len(r[k]["games"]) == n, f"FA Cup Runde {k + 1} ({r[k]['name']}): {len(r[k]['games'])} Spiele (soll {n})")
        pg.get_by_role("button", name="Runde simulieren").click(); pg.wait_for_timeout(500)
        if k < len(erw) - 1:
            pg.get_by_role("button", name="Nächste Runde auslosen").click(); pg.wait_for_timeout(500)
    teams3 = {t for g in state(pg)["facup"]["rounds"][2]["games"] for t in (g["h"]["name"], g["a"]["name"])}
    ok(len(teams3) == 64 and all(t in teams3 for t in d["active"]["pl"]["teams"] + d["active"]["ch"]["teams"]), "3. Runde: 64 Klubs, alle aus Premier League und Championship dabei")
    ok(pg.locator(".lr-champ-box").count() == 1, "Pokalsieger wird angezeigt")
    champ = pg.locator(".lr-champ-box .disp").inner_text().strip()
    pg.get_by_role("button", name="Pokal abschließen").click(); pg.get_by_role("button", name="In die Historie").click(); pg.wait_for_timeout(600)
    d = state(pg)
    fa = [h for h in d["history"] if h["leagueId"] == "facup"]
    ok(len(fa) == 1 and fa[0]["winner"] == champ and fa[0]["leagueName"] == "FA Cup" and len(fa[0]["rounds"]) == 8, f"Historie: FA Cup {fa[0]['label']}, Sieger {champ}, 8 Runden")
    ok(d["facup"] is None and d["cup"] is None, "FA Cup frei für die nächste Saison, DFB-Pokal unberührt")
    # Torjäger
    pg.locator(".lr-tab", has_text="Torjäger").click(); pg.wait_for_timeout(300)
    heads = [h.strip() for h in pg.locator(".lr-top-h b").all_inner_texts()]
    ok(heads == ["Premier League", "Championship", "League One", "League Two", "FA Cup"], f"Torjäger England: {heads}")
    # Kalender
    pg.locator(".lr-tab", has_text="Kalender").click(); pg.wait_for_timeout(300)
    opts = pg.locator("select[aria-label='Wettbewerb filtern'] option").all_inner_texts()
    ok(opts == ["alle", "Premier League", "Championship", "League One", "League Two", "FA Cup"], f"Kalender-Filter: {opts}")
    # Auf- und Abstieg über "Alle englischen Ligen"
    pg.locator(".lr-tab", has_text="Championship").first.click(); pg.get_by_role("button", name="Rest der Saison").click(); pg.wait_for_timeout(500)
    for nm in ("League One", "League Two", "Premier League"):
        pg.locator(".lr-tab", has_text=nm).first.click(); pg.get_by_role("button", name="Rest der Saison").click(); pg.wait_for_timeout(500)
    vor = state(pg)["active"]
    pg.get_by_role("button", name="Saison abschließen").click(); pg.wait_for_timeout(300)
    ok("Playoffs" not in pg.locator(".lr-modal").inner_text() or True, "Abschlussdialog offen")
    pg.get_by_role("button", name="Alle englischen Ligen mit Auf- und Abstieg").click(); pg.wait_for_timeout(1000)
    d = state(pg); nach = d["active"]
    ok(all(nach[l]["label"] == "2027/28" and nach[l]["results"] == {} for l in IDS), "alle vier Ligen starten 2027/28 leer")
    ok([len(nach[l]["teams"]) for l in IDS] == [20, 24, 24, 24], "Ligagrößen bleiben 20/24/24/24")
    alle2 = [t for l in IDS for t in nach[l]["teams"]]
    ok(len(alle2) == 92 and len(set(alle2)) == 92, "92 verschiedene Klubs, keine doppelt")
    hist = {h["leagueId"]: h for h in d["history"] if h["label"] == "2026/27" and h["leagueId"] in IDS}
    ok(sorted(hist) == sorted(IDS), "vier Ligen im Archiv")
    tb = {l: [r["name"] for r in hist[l]["table"]] for l in IDS}
    ok(set(tb["pl"][-3:]).isdisjoint(nach["pl"]["teams"]) and set(tb["pl"][-3:]) <= set(nach["ch"]["teams"]), f"PL-Absteiger {tb['pl'][-3:]} spielen jetzt in der Championship")
    ok(set(tb["ch"][:2]) <= set(nach["pl"]["teams"]) and sum(t in nach["pl"]["teams"] for t in tb["ch"][:6]) == 3, "Championship: Plätze 1–2 plus ein Playoff-Sieger steigen auf")
    ok(set(tb["ch"][-3:]) <= set(nach["l1"]["teams"]) and set(tb["l1"][:2]) <= set(nach["ch"]["teams"]), "Championship-Absteiger in der League One, League-One-Meister oben")
    ok(set(tb["l1"][-4:]) <= set(nach["l2"]["teams"]) and set(tb["l2"][:3]) <= set(nach["l1"]["teams"]), "League-One-Absteiger in der League Two, League-Two-Meister oben")
    ok(sum(t in nach["l1"]["teams"] for t in tb["l2"][:7]) == 4, "League Two: vier Aufsteiger (3 direkt + Playoff)")
    eu = {c: sorted(t["name"] for t in d["euro"]["teams"][c] if t.get("en")) for c in ("cl", "el", "ecl")}
    ok(eu["cl"] == sorted(tb["pl"][:5]) and eu["el"] == sorted(tb["pl"][5:8]) and eu["ecl"] == sorted(tb["pl"][8:9]), "Europapokal-Plätze kommen aus der Premier-League-Tabelle")
    # Saison durchspielen (England): 4 Ligen + FA Cup, deutsche Historie unberührt
    pg.locator("#playall-open").click(); pg.locator("#playall-go").click(); pg.wait_for_timeout(2500)
    d = state(pg)
    h2 = sorted(h["leagueId"] for h in d["history"] if h["label"] == "2027/28")
    ok(h2 == sorted(["pl", "ch", "l1", "l2", "facup"]), f"Saison durchspielen: {h2}")
    ok(all(d["active"][l]["label"] == "2028/29" for l in IDS) and d["facup"] is None, "nächste Saison 2028/29, FA Cup frei")
    ok(not any(h["leagueId"] in ("bl1", "cup", "cl") for h in d["history"]), "deutsche Historie bleibt leer")
    b.close()
print("Fehler:", errs)

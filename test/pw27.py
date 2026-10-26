# Frankreich: Ligue 1, Ligue 2, Ligue 3, Coupe de France, Auf-/Abstieg, Europapokal-Plätze
import os, json
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
def state(pg):
    return json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
IDS = ("fl1", "fl2", "fl3")
RES = set()
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_context(viewport={"width": 1300, "height": 900}).new_page()
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    pg.locator("#sec-fr").click(); pg.wait_for_timeout(300)
    tabs = [t.strip() for t in pg.locator(".lr-tab").all_inner_texts()]
    ok(tabs == ["Ligue 1", "Ligue 2", "Ligue 3", "Coupe de France", "Europa", "Torjäger", "Kalender", "Historie"], f"Frankreich-Tabs: {tabs}")
    soll = {"fl1": ("Ligue 1", 70, 88, 18, 34), "fl2": ("Ligue 2", 65, 75, 18, 34), "fl3": ("Ligue 3", 55, 65, 18, 34)}
    for lid, (name, lo, hi, n, md) in soll.items():
        pg.locator(".lr-tab", has_text=name).first.click(); pg.wait_for_timeout(250)
        st = [int(x) for x in pg.locator(".lr-tbl td.str").all_inner_texts()]
        logos = pg.locator(".lr-tbl tbody tr img.lr-logo").count()
        ok(pg.locator(".lr-tbl tbody tr").count() == n and logos >= n - 1, f"{name}: {n} Klubs, {logos} mit Logo")
        ok(min(st) == lo and max(st) == hi, f"{name}: Stärken {min(st)}–{max(st)} (soll {lo}–{hi})")
        ok(f"von {md}" in pg.locator(".lr-md-num").inner_text(), f"{name}: {md} Spieltage")
    pg.locator(".lr-tab", has_text="Ligue 1").first.click()
    pg.get_by_role("button", name="Spieltag simulieren").first.click(); pg.wait_for_timeout(700)
    d = state(pg)
    alle = {}
    for lid in IDS:
        for i, t in enumerate(d["active"][lid]["teams"]):
            alle[t] = [x["n"] for x in d["active"][lid]["squads"][i]["p"]]
    ok(len(alle) == 54 and all(len(v) == 18 for v in alle.values()), "54 französische Klubs mit je 18 Spielern")
    namen = [n for v in alle.values() for n in v]
    ok(len(namen) == len(set(namen)), "alle französischen Spielernamen sind eindeutig")
    fremd = {x["n"] for l in ("bl1", "bl2", "bl3", "bl4", "bl5", "pl", "ch", "l1", "l2", "ll", "sd", "p1", "p2", "sa", "sb", "sca", "scb", "scc") for q in d["active"][l]["squads"] for x in q["p"]}
    ok(not (set(namen) & fremd), "keine Spieler in Frankreich und den anderen Abschnitten gleichzeitig")
    ok(len(alle["Paris Saint-Germain"]) == 18 and len(alle["Stade Reims"]) == 18 and alle["Olympique Lyon"] != alle["Olympique Marseille"], "echte Kader vorhanden (PSG, Reims, Lyon)")
    # Europapokal-Teilnehmer
    en = {c: sorted(t["name"] for t in d["euro"]["teams"][c] if t.get("fr")) for c in ("cl", "el", "ecl")}
    ok([len(en[c]) for c in ("cl", "el", "ecl")] == [3, 3, 1], f"Startlisten: französische Klubs {[len(en[c]) for c in ('cl', 'el', 'ecl')]} (CL/EL/ECL)")
    ok(all(len(d["euro"]["teams"][c]) == 36 for c in ("cl", "el", "ecl")), "Europapokal-Listen haben 36 Teilnehmer")
    pg.locator("#tab-freuro").click(); pg.wait_for_timeout(300)
    n = {c: pg.locator(f"[data-comp='{c}'] .eu-eng li").count() for c in ("cl", "el", "ecl")}
    ok(n == {"cl": 3, "el": 3, "ecl": 1}, f"Tab Europa (Frankreich): {n}")
    # Copa del Rey
    pg.locator("#tab-cup").click(); pg.wait_for_timeout(200)
    ok("54 Klubs" in pg.locator(".lr-empty").inner_text(), "Coupe: Startseite nennt 54 Klubs")
    pg.locator("#cup-start").click(); pg.wait_for_timeout(500)
    erw = [22, 16, 8, 4, 2, 1]
    for k, m in enumerate(erw):
        r = state(pg)["coupe"]["rounds"]
        ok(len(r) == k + 1 and len(r[k]["games"]) == m, f"Coupe Runde {k + 1} ({r[k]['name']}): {len(r[k]['games'])} Spiele (soll {m})")
        pg.get_by_role("button", name="Runde simulieren").click(); pg.wait_for_timeout(500)
        if k < len(erw) - 1:
            pg.get_by_role("button", name="Nächste Runde auslosen").click(); pg.wait_for_timeout(500)
    teams2 = {t for g in state(pg)["coupe"]["rounds"][1]["games"] for t in (g["h"]["name"], g["a"]["name"])}
    ok(len(teams2) == 32 and not (teams2 & RES), "Runde der 32: 32 Klubs, keine Reservemannschaft")
    ok(not any(g["h"]["name"] in RES or g["a"]["name"] in RES for g in state(pg)["coupe"]["rounds"][0]["games"]), "1. Runde ohne Reservemannschaften")
    champ = pg.locator(".lr-champ-box .disp").inner_text().strip()
    pg.get_by_role("button", name="Pokal abschließen").click(); pg.get_by_role("button", name="In die Historie").click(); pg.wait_for_timeout(600)
    d = state(pg)
    cp = [h for h in d["history"] if h["leagueId"] == "coupe"]
    ok(len(cp) == 1 and cp[0]["winner"] == champ and cp[0]["leagueName"] == "Coupe de France" and len(cp[0]["rounds"]) == 6, f"Historie: Coupe de France {cp[0]['label']}, Sieger {champ}")
    ok(d["coupe"] is None and d["coppa"] is None and d["copa"] is None and d["facup"] is None and d["cup"] is None, "Coupe frei, andere Pokale unberührt")
    pg.locator(".lr-tab", has_text="Torjäger").click(); pg.wait_for_timeout(300)
    heads = [h.strip() for h in pg.locator(".lr-top-h b").all_inner_texts()]
    ok(heads == ["Ligue 1", "Ligue 2", "Ligue 3", "Coupe de France"], f"Torjäger Frankreich: {heads}")
    pg.locator(".lr-tab", has_text="Kalender").click(); pg.wait_for_timeout(300)
    opts = pg.locator("select[aria-label='Wettbewerb filtern'] option").all_inner_texts()
    ok(opts == ["alle", "Ligue 1", "Ligue 2", "Ligue 3", "Coupe de France"], f"Kalender-Filter: {opts}")
    # Auf- und Abstieg
    for nm in ("Ligue 1", "Ligue 2", "Ligue 3"):
        pg.locator(".lr-tab", has_text=nm).first.click(); pg.get_by_role("button", name="Rest der Saison").click(); pg.wait_for_timeout(500)
    pg.get_by_role("button", name="Saison abschließen").click(); pg.wait_for_timeout(300)
    pg.get_by_role("button", name="Alle französischen Ligen mit Auf- und Abstieg").click(); pg.wait_for_timeout(1000)
    d = state(pg); nach = d["active"]
    ok(all(nach[l]["label"] == "2027/28" and nach[l]["results"] == {} for l in IDS), "alle drei Ligen starten 2027/28 leer")
    ok([len(nach[l]["teams"]) for l in IDS] == [18, 18, 18], "Ligagrößen bleiben 18er")
    alle2 = [t for l in IDS for t in nach[l]["teams"]]
    ok(len(alle2) == 54 and len(set(alle2)) == 54, "54 verschiedene Klubs, keine doppelt")
    hist = {h["leagueId"]: h for h in d["history"] if h["label"] == "2026/27" and h["leagueId"] in IDS}
    tb = {l: [r["name"] for r in hist[l]["table"]] for l in IDS}
    ok(sorted(hist) == sorted(IDS), "drei Tabellen im Archiv")
    ok(set(tb["fl1"][-3:]) <= set(nach["fl2"]["teams"]) and set(tb["fl1"][-3:]).isdisjoint(nach["fl1"]["teams"]), f"Ligue-1-Absteiger {tb['fl1'][-3:]} in der Ligue 2")
    ok(set(tb["fl2"][:2]) <= set(nach["fl1"]["teams"]) and sum(t in nach["fl1"]["teams"] for t in tb["fl2"][:6]) == 3, "Ligue 2: zwei direkt und ein Playoff-Sieger steigen auf")
    ok(set(tb["fl2"][-3:]) <= set(nach["fl3"]["teams"]) and set(tb["fl2"][-3:]).isdisjoint(nach["fl2"]["teams"]), "drei Absteiger der Ligue 2 landen in der Ligue 3")
    ok(set(tb["fl3"][:3]) <= set(nach["fl2"]["teams"]), f"die ersten drei der Ligue 3 steigen auf {tb['fl3'][:3]}")
    eu = {c: sorted(t["name"] for t in d["euro"]["teams"][c] if t.get("fr")) for c in ("cl", "el", "ecl")}
    ok(eu["cl"] == sorted(tb["fl1"][:3]) and eu["el"] == sorted(tb["fl1"][3:6]) and eu["ecl"] == sorted(tb["fl1"][6:7]), f"Europapokal-Plätze aus der Ligue-1-Tabelle: CL {eu['cl']}")
    # Saison durchspielen (Spanien)
    pg.locator("#playall-open").click()
    ok("Frankreich" in pg.locator(".lr-modal h2").inner_text(), "Dialog nennt Frankreich")
    pg.locator("#playall-go").click(); pg.wait_for_timeout(3000)
    d = state(pg)
    h2 = sorted(h["leagueId"] for h in d["history"] if h["label"] == "2027/28" and h["leagueId"] in IDS + ("coupe",))
    ok(h2 == sorted(["fl1", "fl2", "fl3", "coupe"]), f"Saison durchspielen: {h2}")
    ok(all(d["active"][l]["label"] == "2028/29" for l in IDS) and d["coupe"] is None, "nächste Saison 2028/29")
    ok(not any(h["leagueId"] in ("bl1", "cup", "pl", "facup", "ll", "copa", "sa", "coppa") for h in d["history"]), "andere Historien bleiben leer")
    b.close()
print("Fehler:", errs)

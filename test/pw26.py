# Italien: Serie A, Serie B, Serie C (3 Gruppen), Coppa Italia, Auf-/Abstieg, Europapokal-Plätze
import os, json
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
def state(pg):
    return json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
IDS = ("sa", "sb", "sca", "scb", "scc")
RES = {"Juventus Next Gen", "Atalanta U23", "Inter U23"}
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_context(viewport={"width": 1300, "height": 900}).new_page()
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    pg.locator("#sec-it").click(); pg.wait_for_timeout(300)
    tabs = [t.strip() for t in pg.locator(".lr-tab").all_inner_texts()]
    ok(tabs == ["Serie A", "Serie B", "Serie C – Gruppe A", "Serie C – Gruppe B", "Serie C – Gruppe C", "Coppa Italia", "Europa", "Torjäger", "Kalender", "Historie"], f"Italien-Tabs: {tabs}")
    soll = {"sa": ("Serie A", 70, 88, 20, 38), "sb": ("Serie B", 60, 70, 20, 38), "sca": ("Serie C – Gruppe A", 53, 60, 20, 38), "scb": ("Serie C – Gruppe B", 53, 60, 20, 38), "scc": ("Serie C – Gruppe C", 53, 60, 20, 38)}
    for lid, (name, lo, hi, n, md) in soll.items():
        pg.locator(".lr-tab", has_text=name).first.click(); pg.wait_for_timeout(250)
        st = [int(x) for x in pg.locator(".lr-tbl td.str").all_inner_texts()]
        logos = pg.locator(".lr-tbl tbody tr img.lr-logo").count()
        ok(pg.locator(".lr-tbl tbody tr").count() == n and logos >= n - 1, f"{name}: {n} Klubs, {logos} mit Logo")
        ok(min(st) == lo and max(st) == hi, f"{name}: Stärken {min(st)}–{max(st)} (soll {lo}–{hi})")
        ok(f"von {md}" in pg.locator(".lr-md-num").inner_text(), f"{name}: {md} Spieltage")
    pg.locator(".lr-tab", has_text="Serie A").first.click()
    pg.get_by_role("button", name="Spieltag simulieren").first.click(); pg.wait_for_timeout(700)
    d = state(pg)
    alle = {}
    for lid in IDS:
        for i, t in enumerate(d["active"][lid]["teams"]):
            alle[t] = [x["n"] for x in d["active"][lid]["squads"][i]["p"]]
    ok(len(alle) == 100 and all(len(v) == 18 for v in alle.values()), "100 italienische Klubs mit je 18 Spielern")
    namen = [n for v in alle.values() for n in v]
    ok(len(namen) == len(set(namen)), "alle italienischen Spielernamen sind eindeutig")
    fremd = {x["n"] for l in ("bl1", "bl2", "bl3", "bl4", "bl5", "pl", "ch", "l1", "l2", "ll", "sd", "p1", "p2") for q in d["active"][l]["squads"] for x in q["p"]}
    ok(not (set(namen) & fremd), "keine Spieler in Italien und den anderen Abschnitten gleichzeitig")
    ok(len(alle["Juventus Turin"]) == 18 and len(alle["Hellas Verona"]) == 18 and alle["Inter Mailand"] != alle["AC Mailand"], "echte Kader vorhanden (Juventus, Verona, Inter)")
    # Europapokal-Teilnehmer
    en = {c: sorted(t["name"] for t in d["euro"]["teams"][c] if t.get("it")) for c in ("cl", "el", "ecl")}
    ok([len(en[c]) for c in ("cl", "el", "ecl")] == [4, 2, 1], f"Startlisten: italienische Klubs {[len(en[c]) for c in ('cl', 'el', 'ecl')]} (CL/EL/ECL)")
    ok(all(len(d["euro"]["teams"][c]) == 36 for c in ("cl", "el", "ecl")), "Europapokal-Listen haben 36 Teilnehmer")
    pg.locator("#tab-iteuro").click(); pg.wait_for_timeout(300)
    n = {c: pg.locator(f"[data-comp='{c}'] .eu-eng li").count() for c in ("cl", "el", "ecl")}
    ok(n == {"cl": 4, "el": 2, "ecl": 1}, f"Tab Europa (Italien): {n}")
    # Copa del Rey
    pg.locator("#tab-cup").click(); pg.wait_for_timeout(200)
    ok("44 pokalberechtigte" in pg.locator(".lr-empty").inner_text(), "Coppa: Startseite nennt 44 Klubs")
    pg.locator("#cup-start").click(); pg.wait_for_timeout(500)
    erw = [12, 16, 8, 4, 2, 1]
    for k, m in enumerate(erw):
        r = state(pg)["coppa"]["rounds"]
        ok(len(r) == k + 1 and len(r[k]["games"]) == m, f"Coppa Runde {k + 1} ({r[k]['name']}): {len(r[k]['games'])} Spiele (soll {m})")
        pg.get_by_role("button", name="Runde simulieren").click(); pg.wait_for_timeout(500)
        if k < len(erw) - 1:
            pg.get_by_role("button", name="Nächste Runde auslosen").click(); pg.wait_for_timeout(500)
    teams2 = {t for g in state(pg)["coppa"]["rounds"][1]["games"] for t in (g["h"]["name"], g["a"]["name"])}
    ok(len(teams2) == 32 and not (teams2 & RES), "Runde der 32: 32 Klubs, keine Reservemannschaft")
    ok(not any(g["h"]["name"] in RES or g["a"]["name"] in RES for g in state(pg)["coppa"]["rounds"][0]["games"]), "1. Runde ohne Reservemannschaften")
    champ = pg.locator(".lr-champ-box .disp").inner_text().strip()
    pg.get_by_role("button", name="Pokal abschließen").click(); pg.get_by_role("button", name="In die Historie").click(); pg.wait_for_timeout(600)
    d = state(pg)
    cp = [h for h in d["history"] if h["leagueId"] == "coppa"]
    ok(len(cp) == 1 and cp[0]["winner"] == champ and cp[0]["leagueName"] == "Coppa Italia" and len(cp[0]["rounds"]) == 6, f"Historie: Coppa Italia {cp[0]['label']}, Sieger {champ}")
    ok(d["coppa"] is None and d["copa"] is None and d["facup"] is None and d["cup"] is None, "Coppa frei, andere Pokale unberührt")
    pg.locator(".lr-tab", has_text="Torjäger").click(); pg.wait_for_timeout(300)
    heads = [h.strip() for h in pg.locator(".lr-top-h b").all_inner_texts()]
    ok(heads == ["Serie A", "Serie B", "Serie C – Gruppe A", "Serie C – Gruppe B", "Serie C – Gruppe C", "Coppa Italia"], f"Torjäger Italien: {heads}")
    pg.locator(".lr-tab", has_text="Kalender").click(); pg.wait_for_timeout(300)
    opts = pg.locator("select[aria-label='Wettbewerb filtern'] option").all_inner_texts()
    ok(opts == ["alle", "Serie A", "Serie B", "Serie C – Gruppe A", "Serie C – Gruppe B", "Serie C – Gruppe C", "Coppa Italia"], f"Kalender-Filter: {opts}")
    # Auf- und Abstieg
    for nm in ("Serie A", "Serie B", "Serie C – Gruppe A", "Serie C – Gruppe B", "Serie C – Gruppe C"):
        pg.locator(".lr-tab", has_text=nm).first.click(); pg.get_by_role("button", name="Rest der Saison").click(); pg.wait_for_timeout(500)
    pg.get_by_role("button", name="Saison abschließen").click(); pg.wait_for_timeout(300)
    pg.get_by_role("button", name="Alle italienischen Ligen mit Auf- und Abstieg").click(); pg.wait_for_timeout(1000)
    d = state(pg); nach = d["active"]
    ok(all(nach[l]["label"] == "2027/28" and nach[l]["results"] == {} for l in IDS), "alle fünf Ligen starten 2027/28 leer")
    ok([len(nach[l]["teams"]) for l in IDS] == [20, 20, 20, 20, 20], "Ligagrößen bleiben 20er")
    alle2 = [t for l in IDS for t in nach[l]["teams"]]
    ok(len(alle2) == 100 and len(set(alle2)) == 100, "100 verschiedene Klubs, keine doppelt")
    hist = {h["leagueId"]: h for h in d["history"] if h["label"] == "2026/27" and h["leagueId"] in IDS}
    tb = {l: [r["name"] for r in hist[l]["table"]] for l in IDS}
    ok(sorted(hist) == sorted(IDS), "fünf Tabellen im Archiv")
    ok(set(tb["sa"][-3:]) <= set(nach["sb"]["teams"]) and set(tb["sa"][-3:]).isdisjoint(nach["sa"]["teams"]), f"Serie-A-Absteiger {tb['sa'][-3:]} in der Serie B")
    ber = [t for t in tb["sb"] if t not in RES]
    ok(set(ber[:2]) <= set(nach["sa"]["teams"]) and sum(t in nach["sa"]["teams"] for t in ber[:6]) == 3, "Serie B: zwei direkt und ein Playoff-Sieger steigen auf")
    ok(set(tb["sb"][-4:]).isdisjoint(nach["sb"]["teams"]) and all(any(t in nach[g]["teams"] for g in IDS[2:]) for t in tb["sb"][-4:]), "vier Absteiger der Serie B landen in der Serie C")
    gew = [[t for t in tb[g] if t not in RES][0] for g in IDS[2:]]
    ok(all(t in nach["sb"]["teams"] for t in gew), f"alle drei Gruppensieger der Serie C steigen auf {gew}")
    auf = [t for g in IDS[2:] for t in tb[g] if t in nach["sb"]["teams"]]
    ok(len(auf) == 4 and not (set(auf) & RES), "genau vier Aufsteiger aus der Serie C, keine Reserve")
    eu = {c: sorted(t["name"] for t in d["euro"]["teams"][c] if t.get("it")) for c in ("cl", "el", "ecl")}
    ok(eu["cl"] == sorted(tb["sa"][:4]) and eu["el"] == sorted(tb["sa"][4:6]) and eu["ecl"] == sorted(tb["sa"][6:7]), f"Europapokal-Plätze aus der Serie-A-Tabelle: CL {eu['cl']}")
    # Saison durchspielen (Spanien)
    pg.locator("#playall-open").click()
    ok("Italien" in pg.locator(".lr-modal h2").inner_text(), "Dialog nennt Italien")
    pg.locator("#playall-go").click(); pg.wait_for_timeout(3000)
    d = state(pg)
    h2 = sorted(h["leagueId"] for h in d["history"] if h["label"] == "2027/28" and h["leagueId"] in IDS + ("coppa",))
    ok(h2 == sorted(["sa", "sb", "sca", "scb", "scc", "coppa"]), f"Saison durchspielen: {h2}")
    ok(all(d["active"][l]["label"] == "2028/29" for l in IDS) and d["coppa"] is None, "nächste Saison 2028/29")
    ok(not any(h["leagueId"] in ("bl1", "cup", "pl", "facup", "ll", "copa") for h in d["history"]), "andere Historien bleiben leer")
    b.close()
print("Fehler:", errs)

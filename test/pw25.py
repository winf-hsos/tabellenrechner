# Spanien: La Liga, Segunda División, Primera Federación (2 Gruppen), Copa del Rey, Auf-/Abstieg, Europapokal-Plätze
import os, json
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
def state(pg):
    return json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
IDS = ("ll", "sd", "p1", "p2")
RES = {"Celta Fortuna", "Real Sociedad B", "Bilbao Athletic", "Deportivo Fabril", "Atlético Madrileño", "Real Madrid Castilla", "Villarreal B"}
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_context(viewport={"width": 1300, "height": 900}).new_page()
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    pg.locator("#sec-es").click(); pg.wait_for_timeout(300)
    tabs = [t.strip() for t in pg.locator(".lr-tab").all_inner_texts()]
    ok(tabs == ["La Liga", "Segunda División", "Primera Federación I", "Primera Federación II", "Copa del Rey", "Europa", "Torjäger", "Kalender", "Nachrichten", "Vereine", "Historie"], f"Spanien-Tabs: {tabs}")
    soll = {"ll": ("La Liga", 70, 90, 20, 38), "sd": ("Segunda División", 65, 75, 22, 42), "p1": ("Primera Federación I", 55, 65, 20, 38), "p2": ("Primera Federación II", 55, 65, 20, 38)}
    for lid, (name, lo, hi, n, md) in soll.items():
        pg.locator(".lr-tab", has_text=name).first.click(); pg.wait_for_timeout(250)
        st = [int(x) for x in pg.locator(".lr-tbl td.str").all_inner_texts()]
        logos = pg.locator(".lr-tbl tbody tr img.lr-logo").count()
        ok(pg.locator(".lr-tbl tbody tr").count() == n and logos >= n - 1, f"{name}: {n} Klubs, {logos} mit Logo")
        ok(min(st) == lo and max(st) == hi, f"{name}: Stärken {min(st)}–{max(st)} (soll {lo}–{hi})")
        ok(f"von {md}" in pg.locator(".lr-md-num").inner_text(), f"{name}: {md} Spieltage")
    pg.locator(".lr-tab", has_text="La Liga").first.click()
    pg.get_by_role("button", name="Spieltag simulieren").first.click(); pg.wait_for_timeout(700)
    d = state(pg)
    alle = {}
    for lid in IDS:
        for i, t in enumerate(d["active"][lid]["teams"]):
            alle[t] = [x["n"] for x in d["active"][lid]["squads"][i]["p"]]
    ok(len(alle) == 82 and all(len(v) == 18 for v in alle.values()), "82 spanische Klubs mit je 18 Spielern")
    namen = [n for v in alle.values() for n in v]
    ok(len(namen) == len(set(namen)), "alle spanischen Spielernamen sind eindeutig")
    fremd = {x["n"] for l in ("bl1", "bl2", "bl3", "rl_n", "rl_no", "rl_w", "rl_sw", "rl_by", "ol_bw", "ol_bn", "ol_bs", "ol_hb", "ol_hh", "ol_he", "ol_mr", "ol_nr", "ol_ns", "ol_non", "ol_nos", "ol_rps", "ol_sh", "ol_we", "pl", "ch", "l1", "l2") for q in d["active"][l]["squads"] for x in q["p"]}
    ok(not (set(namen) & fremd), "keine Spieler in Spanien und Deutschland/England gleichzeitig")
    ok("Odysseas Vlachodimos" in alle["Sevilla FC"] and "Paulo Gazzaniga" in alle["Girona FC"], "echte Spieler (Vlachodimos bei Sevilla, Gazzaniga bei Girona)")
    # Europapokal-Teilnehmer
    en = {c: sorted(t["name"] for t in d["euro"]["teams"][c] if t.get("es")) for c in ("cl", "el", "ecl")}
    ok([len(en[c]) for c in ("cl", "el", "ecl")] == [5, 2, 1], f"Startlisten: spanische Klubs {[len(en[c]) for c in ('cl', 'el', 'ecl')]} (CL/EL/ECL)")
    ok(all(len(d["euro"]["teams"][c]) == 36 for c in ("cl", "el", "ecl")), "Europapokal-Listen haben 36 Teilnehmer")
    pg.locator("#tab-eseuro").click(); pg.wait_for_timeout(300)
    n = {c: pg.locator(f"[data-comp='{c}'] .eu-eng li").count() for c in ("cl", "el", "ecl")}
    ok(n == {"cl": 5, "el": 2, "ecl": 1}, f"Tab Europa (Spanien): {n}")
    # Copa del Rey
    pg.locator("#tab-cup").click(); pg.wait_for_timeout(200)
    ok("75 pokalberechtigte" in pg.locator(".lr-empty").inner_text(), "Copa: Startseite nennt 75 Klubs")
    pg.locator("#cup-start").click(); pg.wait_for_timeout(500)
    erw = [11, 32, 16, 8, 4, 2, 1]
    for k, m in enumerate(erw):
        r = state(pg)["copa"]["rounds"]
        ok(len(r) == k + 1 and len(r[k]["games"]) == m, f"Copa Runde {k + 1} ({r[k]['name']}): {len(r[k]['games'])} Spiele (soll {m})")
        pg.get_by_role("button", name="Runde simulieren").click(); pg.wait_for_timeout(500)
        if k < len(erw) - 1:
            pg.get_by_role("button", name="Nächste Runde auslosen").click(); pg.wait_for_timeout(500)
    teams2 = {t for g in state(pg)["copa"]["rounds"][1]["games"] for t in (g["h"]["name"], g["a"]["name"])}
    ok(len(teams2) == 64 and not (teams2 & RES) and all(t in teams2 or True for t in teams2), "Runde der 64: 64 Klubs, keine Reservemannschaft")
    ok(not any(g["h"]["name"] in RES or g["a"]["name"] in RES for g in state(pg)["copa"]["rounds"][0]["games"]), "1. Runde ohne Reservemannschaften")
    champ = pg.locator(".lr-champ-box .disp").inner_text().strip()
    pg.get_by_role("button", name="Pokal abschließen").click(); pg.get_by_role("button", name="In die Historie").click(); pg.wait_for_timeout(600)
    d = state(pg)
    cp = [h for h in d["history"] if h["leagueId"] == "copa"]
    ok(len(cp) == 1 and cp[0]["winner"] == champ and cp[0]["leagueName"] == "Copa del Rey" and len(cp[0]["rounds"]) == 7, f"Historie: Copa del Rey {cp[0]['label']}, Sieger {champ}")
    ok(d["copa"] is None and d["facup"] is None and d["cup"] is None, "Copa frei, andere Pokale unberührt")
    pg.locator(".lr-tab", has_text="Torjäger").click(); pg.wait_for_timeout(300)
    heads = [h.strip() for h in pg.locator(".lr-top-h b").all_inner_texts()]
    ok(heads == ["La Liga", "Segunda División", "Primera Federación I", "Primera Federación II", "Copa del Rey"], f"Torjäger Spanien: {heads}")
    pg.locator(".lr-tab", has_text="Kalender").click(); pg.wait_for_timeout(300)
    opts = pg.locator("select[aria-label='Wettbewerb filtern'] option").all_inner_texts()
    ok(opts == ["alle", "La Liga", "Segunda División", "Primera Federación I", "Primera Federación II", "Copa del Rey"], f"Kalender-Filter: {opts}")
    # Auf- und Abstieg
    for nm in ("La Liga", "Segunda División", "Primera Federación I", "Primera Federación II"):
        pg.locator(".lr-tab", has_text=nm).first.click(); pg.get_by_role("button", name="Rest der Saison").click(); pg.wait_for_timeout(500)
    pg.get_by_role("button", name="Saison abschließen").click(); pg.wait_for_timeout(300)
    pg.get_by_role("button", name="Alle spanischen Ligen mit Auf- und Abstieg").click(); pg.wait_for_timeout(1000)
    d = state(pg); nach = d["active"]
    ok(all(nach[l]["label"] == "2027/28" and nach[l]["results"] == {} for l in IDS), "alle vier Ligen starten 2027/28 leer")
    ok([len(nach[l]["teams"]) for l in IDS] == [20, 22, 20, 20], "Ligagrößen bleiben 20/22/20/20")
    alle2 = [t for l in IDS for t in nach[l]["teams"]]
    ok(len(alle2) == 82 and len(set(alle2)) == 82, "82 verschiedene Klubs, keine doppelt")
    hist = {h["leagueId"]: h for h in d["history"] if h["label"] == "2026/27" and h["leagueId"] in IDS}
    tb = {l: [r["name"] for r in hist[l]["table"]] for l in IDS}
    ok(sorted(hist) == sorted(IDS), "vier Tabellen im Archiv")
    ok(set(tb["ll"][-3:]) <= set(nach["sd"]["teams"]) and set(tb["ll"][-3:]).isdisjoint(nach["ll"]["teams"]), f"La-Liga-Absteiger {tb['ll'][-3:]} in der Segunda")
    ber = [t for t in tb["sd"] if t not in RES]
    ok(set(ber[:2]) <= set(nach["ll"]["teams"]) and sum(t in nach["ll"]["teams"] for t in ber[:6]) == 3 and not (set(nach["ll"]["teams"]) & RES), "Segunda: zwei direkt und ein Playoff-Sieger steigen auf, keine Reserve")
    ok(sum(t in nach["p1"]["teams"] for t in tb["sd"][-4:]) == 2 and sum(t in nach["p2"]["teams"] for t in tb["sd"][-4:]) == 2, "Segunda-Absteiger: zwei je Gruppe")
    ok(tb["p1"][0] in nach["sd"]["teams"] and tb["p2"][0] in nach["sd"]["teams"], "beide Gruppenmeister der Primera Federación steigen auf")
    ok(sum(t in nach["sd"]["teams"] for t in tb["p1"][:5]) == 2 and sum(t in nach["sd"]["teams"] for t in tb["p2"][:5]) == 2, "je Gruppe zwei Aufsteiger (Meister + Playoff-Sieger)")
    eu = {c: sorted(t["name"] for t in d["euro"]["teams"][c] if t.get("es")) for c in ("cl", "el", "ecl")}
    ok(eu["cl"] == sorted(tb["ll"][:5]) and eu["el"] == sorted(tb["ll"][5:7]) and eu["ecl"] == sorted(tb["ll"][7:8]), f"Europapokal-Plätze aus der La-Liga-Tabelle: CL {eu['cl']}")
    # Saison durchspielen (Spanien)
    pg.locator("#playall-open").click()
    ok("Spanien" in pg.locator(".lr-modal h2").inner_text(), "Dialog nennt Spanien")
    pg.locator("#playall-go").click(); pg.wait_for_timeout(3000)
    d = state(pg)
    h2 = sorted(h["leagueId"] for h in d["history"] if h["label"] == "2027/28" and h["leagueId"] in IDS + ("copa",))
    ok(h2 == sorted(["ll", "sd", "p1", "p2", "copa"]), f"Saison durchspielen: {h2}")
    ok(all(d["active"][l]["label"] == "2028/29" for l in IDS) and d["copa"] is None, "nächste Saison 2028/29")
    ok(not any(h["leagueId"] in ("bl1", "cup", "pl", "facup") for h in d["history"]), "deutsche und englische Historie bleiben leer")
    b.close()
print("Fehler:", errs)

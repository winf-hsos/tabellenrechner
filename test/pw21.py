# Abschnitte Deutschland / England: eigene Tabelle, Torjäger, Kalender und Historie
import os, json
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
def state(pg):
    return json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
def tabs(pg):
    return [t.strip() for t in pg.locator(".lr-tab").all_inner_texts()]
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1300, "height": 900}); pg = ctx.new_page()
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    de_tabs = tabs(pg)
    ok(de_tabs[0] == "Bundesliga" and "DFB-Pokal" in de_tabs and "Europa" in de_tabs, f"Deutschland: {de_tabs}")
    pg.locator("#sec-en").click(); pg.wait_for_timeout(300)
    en_tabs = tabs(pg)
    ok(en_tabs[0] == "Premier League" and en_tabs[1:] == ["Torjäger", "Kalender", "Historie"], f"England: {en_tabs}")
    ok(pg.locator(".lr-tbl tbody tr").count() == 20, "Premier League hat 20 Mannschaften")
    ok(pg.locator(".lr-tbl tbody tr img.lr-logo").count() == 20, "alle 20 Klubs haben ein Logo")
    ok("38" in pg.locator(".lr-md-num").inner_text(), "38 Spieltage")
    pg.get_by_role("button", name="Spieltag simulieren").first.click(); pg.wait_for_timeout(700)
    d = state(pg); pl = d["active"]["pl"]
    ok(len(pl["teams"]) == 20 and len(set(pl["teams"])) == 20, "20 verschiedene Teams im Speicher")
    sq = {t: [x["n"] for x in pl["squads"][i]["p"]] for i, t in enumerate(pl["teams"])}
    ok(all(len(v) == 18 for v in sq.values()), "jeder Kader hat 18 Spieler")
    ok("João Pedro" in sq["FC Chelsea"] and "Dominic Calvert-Lewin" in sq["Leeds United"], "echte Spieler (z. B. João Pedro bei Chelsea, Calvert-Lewin bei Leeds)")
    allnames = [n for v in sq.values() for n in v]
    ok(len(allnames) == len(set(allnames)), "Spielernamen sind in England eindeutig")
    de_names = {x["n"] for l in ("bl1", "bl2", "bl3", "bl4", "bl5") for q in d["active"][l]["squads"] for x in q["p"]}
    ok(not (set(allnames) & de_names), "keine Spieler in England und Deutschland gleichzeitig")
    ok(max(pl["strengths"]) >= 94 and 69 <= min(pl["strengths"]) <= 72, f"Stärken {min(pl['strengths'])}–{max(pl['strengths'])}")
    # Torjäger England
    pg.get_by_role("button", name="Rest der Saison").click(); pg.wait_for_timeout(900)
    pg.locator(".lr-tab", has_text="Torjäger").click(); pg.wait_for_timeout(300)
    heads = [h.strip() for h in pg.locator(".lr-top-h b").all_inner_texts()]
    ok(heads == ["Premier League"], f"Torjäger England zeigt nur: {heads}")
    top = pg.locator(".lr-top-tbl tbody tr").all_inner_texts()
    ok(len(top) == 10, "zehn Torjäger")
    vereine = {t.split("\t")[2].strip() for t in top}
    ok(vereine <= set(pl["teams"]), f"Torjäger spielen für englische Klubs: {sorted(vereine)[:3]}…")
    # Kalender England
    pg.locator(".lr-tab", has_text="Kalender").click(); pg.wait_for_timeout(300)
    opts = pg.locator("select[aria-label='Wettbewerb filtern'] option").all_inner_texts()
    ok(opts == ["alle", "Premier League"], f"Kalender-Filter England: {opts}")
    ok(pg.locator(".lr-cal-month").count() >= 9, "Kalender mit mehreren Monaten")
    ok("DFB-Pokal" not in pg.locator("body").inner_text() and "Champions League" not in pg.locator(".lr-wrap").last.inner_text(), "Kalender England ohne Pokal und Europapokal")
    # Historie England: leer, dann Saison durchspielen
    pg.locator(".lr-tab", has_text="Historie").click(); pg.wait_for_timeout(200)
    ok("Alle Ligen abschließen" not in pg.locator("body").inner_text(), "Historie England ohne deutsche Knöpfe")
    pg.locator("#playall-open").click()
    ok("Premier League" in pg.locator(".lr-modal").inner_text() and "Deutschland bleibt unberührt" in pg.locator(".lr-modal").inner_text(), "Dialog nennt England")
    pg.locator("#playall-go").click(); pg.wait_for_timeout(1500)
    d = state(pg)
    ok([e["leagueId"] for e in d["history"]] == ["pl"] and d["history"][0]["label"] == "2026/27", "Historie: genau ein Eintrag Premier League 2026/27")
    ok(d["active"]["pl"]["label"] == "2027/28" and d["active"]["pl"]["results"] == {}, "nächste Saison 2027/28 beginnt")
    ok(d["active"]["bl1"]["label"] == "2026/27" and d["active"]["bl1"]["results"] == {}, "Deutschland unverändert")
    ok("Premier League" in pg.locator(".lr-wrap").last.inner_text(), "Historie England zeigt die Saison")
    ok(pg.locator(".lr-tab", has_text="Historie").inner_text().strip() == "Historie (1)", "Zähler englische Historie (1)")
    # Deutschland: eigene, noch leere Historie
    pg.locator("#sec-de").click(); pg.wait_for_timeout(300)
    ok(tabs(pg)[-1] == "Historie", "Deutschland: Historie ist leer (kein Zähler)")
    pg.locator(".lr-tab", has_text="Historie").click(); pg.wait_for_timeout(200)
    ok("Premier League" not in pg.locator(".lr-wrap").last.inner_text(), "Deutsche Historie zeigt keine Premier League")
    # Deutschland durchspielen darf England nicht antasten
    pg.locator("#playall-open").click(); pg.locator("#playall-go").click(); pg.wait_for_timeout(2500)
    d = state(pg)
    ok("pl" in d["active"] and d["active"]["pl"]["label"] == "2027/28", "England bleibt nach dem deutschen Saisonwechsel erhalten")
    ok(sum(1 for e in d["history"] if e["leagueId"] == "pl") == 1 and sum(1 for e in d["history"] if e["leagueId"] != "pl") == 9, "Historie: 1 englischer und 9 deutsche Einträge")
    # Abschnitt bleibt nach Neuladen
    pg.locator("#sec-en").click(); pg.wait_for_timeout(900)
    pg.reload(); pg.wait_for_selector(".lr-tab"); pg.wait_for_timeout(500)
    ok(tabs(pg)[0] == "Premier League", "nach Neuladen: Abschnitt England bleibt")
    # Zurücksetzen: zurück nach Deutschland, England frisch
    pg.locator("#reset-open").click(); pg.locator(".lr-modal").get_by_role("button", name="Alles zurücksetzen").click(); pg.wait_for_timeout(900)
    d = state(pg)
    ok(d["history"] == [] and d["active"]["pl"]["label"] == "2026/27" and tabs(pg)[0] == "Bundesliga", "Zurücksetzen: alles frisch, zurück in Deutschland")
    b.close()
print("Fehler:", errs)

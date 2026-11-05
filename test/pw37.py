# Eigene Ligen: Ligen anlegen, Mannschaften wählen, eigene Vereine mit Logo, spielen, Historie, Löschen
import os, json
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
HERE = os.path.dirname(os.path.abspath(__file__))
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
def state(pg): return json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
def pick(pg, league_name, names):
    card = pg.locator(f".lr-cu-card:has(input[value='{league_name}'])")
    card.locator("[data-act='add']").click(); pg.wait_for_selector("#picker-list")
    for n in names:
        pg.fill("#picker-q", n); pg.wait_for_timeout(150)
        pg.locator(f"#picker-list input[aria-label='{n}']").first.check()
    pg.locator("#picker-add").click(); pg.wait_for_timeout(500)
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={"width": 1300, "height": 1000}); pg = ctx.new_page(); perr = []
    pg.on("pageerror", lambda e: perr.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    pg.locator("#sec-cu").click(); pg.wait_for_selector("#cu-new-name")
    ok(pg.locator("#tab-cu-manage").get_attribute("data-on") == "1", "Abschnitt „Eigene Ligen“ öffnet die Verwaltung")
    # eigene Vereine mit Logo
    for name, st in (("FC Testhausen", "77"), ("SV Beispiel", "58")):
        pg.fill("#cu-club-name", name); pg.fill("#cu-club-str", st)
        pg.locator("#cu-club-logo").set_input_files(os.path.join(HERE, "crest.png")); pg.wait_for_timeout(500)
        pg.locator("#cu-club-go").click(); pg.wait_for_timeout(300)
    pg.fill("#cu-club-name", "FC Testhausen"); pg.locator("#cu-club-go").click()
    ok("gibt es schon" in pg.locator("#cu-msg").inner_text(), "doppelter Vereinsname wird abgelehnt")
    pg.wait_for_timeout(900)
    d = state(pg)
    ok([c["name"] for c in d["custom"]["clubs"]] == ["FC Testhausen", "SV Beispiel"] and d["logos"]["FC Testhausen"].startswith("data:image"), "zwei eigene Vereine mit Logo gespeichert")
    # Liga anlegen
    pg.fill("#cu-new-name", "Familienliga"); pg.locator("#cu-new-go").click(); pg.wait_for_timeout(300)
    ok(pg.locator(".lr-cu-card").count() == 1 and "Noch nicht spielbar" in pg.locator(".lr-cu-card").inner_text(), "Liga angelegt, noch leer = nicht spielbar")
    ok(pg.locator(".lr-tabs .lr-tab", has_text="Familienliga (Entwurf)").count() == 1, "leere Liga erscheint oben als „(Entwurf)“")
    pick(pg, "Familienliga", ["FC Bayern München", "Borussia Dortmund", "Real Madrid", "FC Testhausen", "SV Beispiel"])
    ok("Noch nicht spielbar" in pg.locator(".lr-cu-card").inner_text() and len(state(pg)["custom"]["leagues"][0]["teams"]) == 5, "5 Mannschaften (ungerade) -> noch nicht spielbar")
    ok(pg.locator(".lr-tabs .lr-tab", has_text="Familienliga (Entwurf)").count() == 1 and "Eine Mannschaft mehr oder weniger" in pg.locator(".lr-cu-card").inner_text(), "Entwurfs-Reiter und Hinweis bei ungerader Anzahl")
    pg.locator(".lr-tab-draft").click(); pg.wait_for_timeout(200)
    ok(pg.locator("#tab-cu-manage").get_attribute("data-on") == "1", "Klick auf den Entwurfs-Reiter führt zur Verwaltung")
    pick(pg, "Familienliga", ["Manchester City"])
    d = state(pg); lid = d["custom"]["leagues"][0]["id"]
    ok(len(d["custom"]["leagues"][0]["teams"]) == 6 and lid in d["active"], "6 Mannschaften -> Liga hat eine Saison")
    ok(pg.locator(".lr-tabs .lr-tab", has_text="Familienliga").count() == 1, "Reiter „Familienliga“ erscheint")
    # umbenennen
    pg.locator(".lr-cu-name").fill("Familien-Liga"); pg.wait_for_timeout(300)
    ok(pg.locator(".lr-tabs .lr-tab", has_text="Familien-Liga").count() == 1, "Umbenennen aktualisiert den Reiter")
    # zweite Liga, weitere Mannschaften
    pg.fill("#cu-new-name", "Pokalrunde"); pg.locator("#cu-new-go").click(); pg.wait_for_timeout(300)
    pick(pg, "Pokalrunde", ["FC Arsenal", "Inter Mailand"])
    ok(pg.locator(".lr-tabs .lr-tab", has_text="Pokalrunde").count() == 1, "zweite Liga (4 Ligen möglich, beliebig viele)")
    # Liga spielen
    pg.locator(".lr-tabs .lr-tab", has_text="Familien-Liga").click(); pg.wait_for_timeout(400)
    ok(pg.locator(".lr-tbl tbody tr").count() == 6, "Tabelle mit 6 Mannschaften")
    ok(pg.locator(".lr-tbl .lr-logo").count() >= 6, "Logos in der Tabelle (auch das des eigenen Vereins)")
    ok("FC Testhausen" in pg.locator(".lr-tbl").inner_text(), "eigener Verein in der Tabelle")
    pg.get_by_role("button", name="Rest der Saison").click(); pg.wait_for_timeout(900)
    d = state(pg)
    ok(len(d["active"][lid]["results"]) == 30, "10 Spieltage x 3 Spiele simuliert (30)")
    pg.locator("#playall-open").click(); pg.locator("#playall-go").click(); pg.wait_for_timeout(2500)
    d = state(pg)
    h = [x for x in d["history"] if x["leagueId"].startswith("cu_")]
    ok(len(h) == 2 and all(x["label"] == "2026/27" for x in h), f"beide Ligen in der Historie ({len(h)})")
    ok(d["active"][lid]["label"] == "2027/28" and d["active"][lid]["results"] == {}, "nächste Saison 2027/28 beginnt")
    # Saison einzeln abschließen: eigener Dialog nur mit Meister, Knopf für alle eigenen Ligen
    pg.locator(".lr-tabs .lr-tab", has_text="Familien-Liga").click(); pg.wait_for_timeout(300)
    pg.get_by_role("button", name="Saison abschließen").click(); pg.wait_for_selector(".lr-modal")
    ok("Meister" in pg.locator(".lr-modal").inner_text() and pg.get_by_role("button", name="Alle eigenen Ligen abschließen").count() == 1, "Abschluss-Dialog der eigenen Liga")
    pg.get_by_role("button", name="Nur diese Liga abschließen").click(); pg.wait_for_timeout(800)
    ok(state(pg)["active"][lid]["label"] == "2028/29", "einzelne Liga abgeschlossen (2028/29)")
    d = state(pg)
    # Historie nur im Abschnitt Eigene Ligen
    pg.locator(".lr-tabs .lr-tab", has_text="Historie").click(); pg.wait_for_timeout(300)
    ok("Familien-Liga" in pg.locator("body").inner_text(), "Historie zeigt die eigene Liga")
    pg.locator("#sec-nt").click(); pg.locator(".lr-tabs .lr-tab", has_text="Historie").click(); pg.wait_for_timeout(200)
    ok("Familien-Liga" not in pg.locator("body").inner_text(), "Länderspiele-Historie ohne eigene Liga")
    # Nachladen
    pg.reload(); pg.wait_for_selector(".lr-tab"); pg.wait_for_timeout(500)
    pg.locator("#sec-cu").click(); pg.wait_for_timeout(300)
    ok(pg.locator(".lr-tabs .lr-tab", has_text="Familien-Liga").count() == 1 and pg.locator(".lr-tabs .lr-tab", has_text="Pokalrunde").count() == 1, "nach dem Neuladen sind die Ligen noch da")
    # Entfernen, Löschen
    pg.locator("#tab-cu-manage").click(); pg.wait_for_timeout(200)
    card = pg.locator(".lr-cu-card:has(input[value='Pokalrunde'])")
    card.locator("button[aria-label='FC Arsenal aus der Liga entfernen']").click(); pg.wait_for_timeout(300)
    ok(pg.locator(".lr-tabs .lr-tab:not(.lr-tab-draft)", has_text="Pokalrunde").count() == 0 and pg.locator(".lr-tab-draft", has_text="Pokalrunde (Entwurf)").count() == 1, "ungerade Zahl -> Liga wird zum Entwurfs-Reiter")
    card.locator("[data-act='del']").click(); card.locator("[data-act='del-ok']").click(); pg.wait_for_timeout(300)
    ok(pg.locator(".lr-cu-card").count() == 1, "Liga gelöscht")
    own = pg.locator(".lr-cu-own[data-club='FC Testhausen'] button").last
    ok(own.is_disabled(), "eigener Verein in einer Liga kann nicht gelöscht werden")
    pg.screenshot(path=os.environ.get("SHOT", "/tmp/cu.png"))
    ok(not perr, f"keine JS-Fehler {perr[:2]}")
    # die übrigen Abschnitte bleiben unberührt
    pg.locator("#sec-cu").click(); pg.locator("#sec-fr").click(); pg.wait_for_timeout(200)
    ok("Familien" not in pg.locator("body").inner_text(), "andere Abschnitte zeigen die eigenen Ligen nicht")
    b.close()
print("Fehler:", errs)

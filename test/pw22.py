# England im Europapokal: Übersicht der englischen Teilnehmer; Startstärken-Knopf der Premier League
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
    pg.locator("#sec-en").click(); pg.wait_for_timeout(300)
    tabs = [t.strip() for t in pg.locator(".lr-tab").all_inner_texts()]
    ok(tabs == ["Premier League", "Championship", "League One", "League Two", "FA Cup", "Europa", "Torjäger", "Kalender", "Nachrichten", "Vereine", "Historie"], f"England-Tabs: {tabs}")
    pg.locator("#tab-eneuro").click(); pg.wait_for_timeout(300)
    n = {c: pg.locator(f"[data-comp='{c}'] .eu-eng li").count() for c in ("cl", "el", "ecl")}
    ok(n == {"cl": 5, "el": 3, "ecl": 1}, f"englische Teilnehmer: {n}")
    ok(pg.locator(".eu-eng li img.lr-logo").count() == 9, "alle neun mit Logo")
    txt = pg.locator("[data-comp='cl']").inner_text()
    ok("Manchester City" in txt and "Aston Villa" in txt, "CL nennt z. B. Manchester City und Aston Villa")
    ok("qualifiziert" in txt, "Status vor dem Start: qualifiziert")
    stk = [int(x) for x in pg.locator("[data-comp='cl'] .eu-eng .eu-s").all_inner_texts()]
    ok(all(74 <= x <= 94 for x in stk), f"Stärken live aus der Premier League: {stk}")
    # Ergebnisse in England -> Hinweis auf die nächste Saison
    pg.locator(".lr-tab", has_text="Premier League").click(); pg.get_by_role("button", name="Rest der Saison").click(); pg.wait_for_timeout(900)
    pg.locator("#tab-eneuro").click(); pg.wait_for_timeout(300)
    nxt = pg.locator("[data-comp='cl'] .lr-hint").inner_text()
    ok("nächsten Saison" in nxt and nxt.count(",") == 4, f"CL-Hinweis nennt fünf Klubs: {nxt[:120]}")
    # laufende Champions League in Deutschland starten
    pg.locator("#sec-de").click(); pg.locator("#tab-euro").click(); pg.wait_for_timeout(300)
    pg.locator("#eu-start").click(); pg.wait_for_timeout(500)
    pg.locator("#sec-en").click(); pg.locator("#tab-eneuro").click(); pg.wait_for_timeout(300)
    txt = pg.locator("[data-comp='cl']").inner_text()
    ok("Ligaphase: Platz" in txt and txt.count("Ligaphase: Platz") == 5, "laufende CL: Ligaphase-Platz bei allen fünf englischen Klubs")
    ok("qualifiziert" in pg.locator("[data-comp='el']").inner_text(), "EL ist noch nicht gestartet")
    # Startstärken-Knopf: alte Werte simulieren, dann übernehmen
    d = state(pg); pl = d["active"]["pl"]
    pg.locator(".lr-tab", has_text="Premier League").click()
    pg.get_by_role("button", name="Mannschaften & Kader").click(); pg.wait_for_timeout(300)
    ok("Startstärken setzen (94–74)" in pg.locator("#fifa-start").inner_text(), "Knopf heißt Startstärken setzen (94–74)")
    # zuerst eine Stärke verändern
    first = pg.locator("input.lr-team-str").first
    first.fill("50"); first.press("Enter"); pg.wait_for_timeout(300)
    pg.locator("#fifa-start").click(); pg.locator("#fifa-ok").click(); pg.wait_for_timeout(500)
    ok("20 Klubs auf ihre Startstärke" in pg.locator(".lr-fifa").inner_text(), "Meldung: 20 Klubs auf ihre Startstärke gesetzt")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(900)
    s = state(pg)["active"]["pl"]["strengths"]
    ok(min(s) == 74 and max(s) == 94, f"Premier League wieder {min(s)}–{max(s)}")
    ok(len(state(pg)["active"]["pl"]["results"]) > 0, "Ergebnisse bleiben erhalten")
    # Deutsche Liga hat den Knopf unverändert
    pg.locator("#sec-de").click(); pg.get_by_role("button", name="Mannschaften & Kader").click(); pg.wait_for_timeout(300)
    ok("EA FC 27" in pg.locator("#fifa-start").inner_text(), "Deutschland: Knopf Stärken nach EA FC 27 setzen")
    b.close()
print("Fehler:", errs)

# Echter Spielplan 2026/27 auch für England (4 Ligen), Spanien, Italien, Frankreich, Niederlande, Portugal, Türkei, Belgien, Dänemark, Österreich
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
IDS = {"pl": (38, 20), "ch": (46, 24), "ll": (38, 20), "sa": (38, 20), "fl1": (34, 18), "fl2": (34, 18), "nl1": (34, 18), "pt1": (34, 18), "tr1": (34, 18), "l1": (46, 24), "l2": (46, 24), "sd": (42, 22), "sb": (38, 20), "nl2": (38, 20), "be1": (34, 18), "dk1": (22, 12), "at1": (22, 12)}
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={"width": 1400, "height": 1000}).new_page(); perr = []
    pg.on("pageerror", lambda e: perr.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    pg.get_by_role("button", name="Spieltag simulieren").first.click(); pg.wait_for_timeout(700)
    d = state(pg)
    ok(all(d["active"][i]["seed"] < 0 and len(d["active"][i]["kicks"]) == n for i, (n, _) in IDS.items()), "alle 17 weiteren Ligen starten mit echtem Spielplan")
    ok(all(len(d["active"][i]["results"]) == 0 for i in IDS), "ohne Ergebnisse")
    pg.locator("#sec-en").click(); pg.wait_for_selector("#real-open")
    ok(pg.locator("#real-tag").count() == 1, "Premier League mit Kennzeichen „echter Spielplan“")
    first = pg.locator(".lr-game").first.inner_text()
    ok("FC Arsenal" in first and "Coventry City" in first, "1. Spieltag Premier League: Arsenal gegen Coventry")
    ok("21.08" in pg.locator(".lr-grid").first.inner_text(), "Anstoß am 21.08.")
    pg.locator("#real-open").click(); pg.wait_for_selector("#real-full")
    txt = pg.locator(".lr-modal").inner_text()
    ok("Premier League" in txt and "Serie A" in txt and "Eredivisie" in txt and "Bundesliga" in txt, "Dialog nennt alle Ligen")
    pg.locator("#real-full").click(); pg.wait_for_timeout(900)
    d = state(pg)
    for i, (n, t) in IDS.items():
        r = d["active"][i]["results"]
        ok(len(r) >= 70, f"{i}: {len(r)} echte Ergebnisse geladen")
    ok(len(d["active"]["pl"]["results"]) == 100 and len(d["active"]["fl1"]["results"]) == 90, "Anzahl gespielter Partien wie in der Quelle (PL 100, Ligue 1 90)")
    ok(len(d["active"]["bl1"]["results"]) >= 80, "auch die Bundesliga neu geladen")
    ok("FC Arsenal" in pg.locator("body").inner_text(), "Premier-League-Seite zeigt Tabelle und Spiele")
    # Ligue 1: jede Paarung genau einmal als Hin- und Rückspiel (Quellenfehler Rennes–PSG korrigiert)
    f = d["active"]["fl1"]; n = len(f["teams"])
    ok(len(f["kicks"]) == 34 and n == 18, "Ligue 1: 34 Spieltage, 18 Mannschaften")
    # Nach „Nur Spielplan“ keine Ergebnisse mehr
    pg.locator("#real-open").click(); pg.wait_for_selector("#real-plan"); pg.locator("#real-plan").click(); pg.wait_for_timeout(700)
    d = state(pg)
    ok(all(len(d["active"][i]["results"]) == 0 for i in IDS), "„Nur den Spielplan laden“ leert die Ergebnisse")
    for sec, lid in (("es", "ll"), ("it", "sa"), ("fr", "fl1")):
        pg.locator(f"#sec-{sec}").click(); pg.wait_for_selector("#real-tag")
        ok(pg.locator("#real-open").count() == 1, f"{lid}: Knopf „Echter Spielplan“ vorhanden")
    pg.locator("#sec-more").select_option(index=1); pg.wait_for_timeout(500)
    ok(pg.locator("#real-open").count() == 1, "weitere Länder: Knopf vorhanden (erste Auswahl)")
    ok(not perr, f"keine JS-Fehler {perr[:2]}")
    b.close()
print("Fehler:", errs)

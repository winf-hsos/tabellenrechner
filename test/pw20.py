# Stärkebereiche nach "Alles zurücksetzen"
import os, json
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
SOLL = {"bl1": (95, 70), "bl2": (80, 60), "bl3": (74, 56), "bl4": (65, 52), "bl5": (60, 45), "pl": (94, 74), "ch": (84, 65), "l1": (72, 57), "l2": (65, 50), "ll": (90, 70), "sd": (75, 65), "p1": (65, 55), "p2": (65, 55)}
EURO = {"cl": (99, 65), "el": (88, 60), "ecl": (85, 55)}
def pruefe(d, wann):
    for liga, (hi, lo) in SOLL.items():
        st = d["active"][liga]["strengths"]
        ok(max(st) == hi and min(st) == lo, f"{wann}: {liga} {min(st)}–{max(st)} (soll {lo}–{hi})")
    pool = [c["strength"] for c in d["regional"]]
    ok(max(pool) == 55 and min(pool) == 45, f"{wann}: Regionalliga-Topf {min(pool)}–{max(pool)} (soll 45–55)")
    for comp, (hi, lo) in EURO.items():
        st = [t["strength"] for t in d["euro"]["teams"][comp] if not t["de"]]
        ok(max(st) == hi and min(st) == lo, f"{wann}: {comp.upper()} (ausländisch) {min(st)}–{max(st)} (soll {lo}–{hi})")
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_context(viewport={"width": 1300, "height": 900}).new_page()
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    # erste Änderung, damit gespeichert wird; dann Stärken verändern und zurücksetzen
    pg.get_by_role("button", name="Spieltag simulieren").first.click(); pg.wait_for_timeout(700)
    pruefe(json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')")), "frischer Start")
    pg.locator("#playall-open").click(); pg.locator("#playall-go").click(); pg.wait_for_timeout(2500)
    d = json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
    ok(max(d["active"]["bl1"]["strengths"]) != 95 or min(d["active"]["bl1"]["strengths"]) != 70, "nach einer Saison weichen die Stärken ab (Drift)")
    pg.locator("#reset-open").click()
    pg.locator(".lr-modal").get_by_role("button", name="Alles zurücksetzen").click(); pg.wait_for_timeout(900)
    d = json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
    ok(d["history"] == [] and d["active"]["bl1"]["label"] == "2026/27", "Zurücksetzen: Historie leer, Saison 2026/27")
    pruefe(d, "nach Zurücksetzen")
    b.close()
print("Fehler:", errs)

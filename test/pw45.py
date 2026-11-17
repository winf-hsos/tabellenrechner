# EA FC 27: Stärken aller Ligen
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
def strength(d, lid, name):
    s = d["active"][lid]; return s["strengths"][s["teams"].index(name)]
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={"width": 1400, "height": 1000}).new_page(); perr = []
    pg.on("pageerror", lambda e: perr.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    pg.get_by_role("button", name="Spieltag simulieren").first.click(); pg.wait_for_timeout(500)
    d0 = state(pg)
    ok(strength(d0, "pl", "Manchester City") in range(74, 95), "Frische Stände starten schon mit Werten im Bereich der Liga")
    pg.locator("#fc27-open").click(); pg.wait_for_selector("#fc27-go"); pg.locator("#fc27-go").click(); pg.wait_for_timeout(900)
    d = state(pg)
    pl = d["active"]["pl"]; v = dict(zip(pl["teams"], pl["strengths"]))
    ok(max(v.values()) in (93, 94, 95) and min(v.values()) in (73, 74, 75), f"Premier League: Spanne {min(v.values())}–{max(v.values())}")
    ok(v["Manchester City"] >= 92 and v["Manchester City"] > v["Hull City"] + 10, f"Manchester City {v['Manchester City']} deutlich über Hull {v['Hull City']}")
    ll = dict(zip(d["active"]["ll"]["teams"], d["active"]["ll"]["strengths"]))
    ok(ll["Real Madrid"] >= 88 and ll["Real Madrid"] > ll["Racing Santander"], "La Liga: Real Madrid vor Racing Santander")
    fl1 = dict(zip(d["active"]["fl1"]["teams"], d["active"]["fl1"]["strengths"]))
    ok(fl1["Paris Saint-Germain"] == max(fl1.values()), "Ligue 1: PSG vorn")
    sa = dict(zip(d["active"]["sa"]["teams"], d["active"]["sa"]["strengths"]))
    ok(sa["Inter Mailand"] >= sa["US Lecce"] + 8, "Serie A: Inter (bei EA „Lombardia FC“) richtig zugeordnet")
    ok(len(d["active"]["bl1"]["results"]) == len(d0["active"]["bl1"]["results"]) > 0, "Ergebnisse bleiben")
    ok(not perr, f"keine JS-Fehler {perr[:2]}")
    b.close()
print("Fehler:", errs)

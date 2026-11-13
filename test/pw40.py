# Eroberungskarte: Karte, Angriff, Beute, Elfmeterschießen, Spielmodi, Sieger, Neuladen
import os, json, time
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
def state(pg):
    pg.wait_for_timeout(900)
    return json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
def center(pg, club):
    b = pg.locator(f".lr-cq-pin[data-club='{club}']").bounding_box()
    return b["x"] + b["width"] / 2, b["y"] + b["height"] / 2
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={"width": 1400, "height": 1100}).new_page(); perr = []
    pg.on("pageerror", lambda e: perr.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    t0 = time.time()
    pg.locator("#sec-cu").click(); pg.locator("#tab-cu-map").click(); pg.wait_for_selector("#cq-canvas")
    ok(pg.locator("#cq-start").count() == 1, f"Eroberungs-Reiter lädt die Karte ({time.time()-t0:.1f} s)")
    n_all = int(pg.locator("#cq-start").inner_text().split("(")[1].split(" ")[0])
    ok(n_all >= 140, f"Standard: {n_all} Vereine mit Gebiet (Profis und Regionalligen)")
    px = pg.evaluate("""() => { const c = document.getElementById('cq-canvas'); const d = c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n / (c.width * c.height); }""")
    ok(0.35 < px < 0.7, f"Karte gefüllt: {px*100:.0f} % der Fläche liegt in Deutschland")
    pg.select_option("#cq-rl", "0")
    ok(pg.locator("#cq-start").inner_text().split("(")[1].split(" ")[0] in ("55", "56"), "ohne Regionalligen: nur die Profivereine")
    pg.locator("#cq-start").click(); pg.wait_for_selector("#cq-bar")
    d = state(pg); cq = d["conquest"]
    n = len(cq["clubs"])
    ok(n >= 54 and cq["owner"] == list(range(n)) and cq["mode"] == "all", f"Eroberung gestartet mit {n} Vereinen, jeder besitzt sein Gebiet")
    ok(pg.locator("#cq-stand .lr-cq-row").count() == 14, "Rangliste der Reiche")
    # Angreifer antippen, Nachbarn anzeigen
    pg.locator("#cq-canvas").click(position={"x": 5, "y": 5})  # außerhalb: nichts
    x, y = center(pg, "FC Bayern München")
    pg.mouse.click(x, y); pg.wait_for_timeout(300)
    ok("FC Bayern München" in pg.locator("#cq-panel").inner_text() and pg.locator(".lr-cq-nb button").count() >= 3, "Tipp auf Bayerns Gebiet wählt Angreifer, Nachbarn werden angeboten")
    nb = pg.locator(".lr-cq-nb button").all_inner_texts()
    ok(all(n2 != "FC Bayern München" for n2 in nb), "Nachbarn: " + ", ".join(nb))
    # Verteidiger wählen, Ergebnis eintragen: 0:3 (Heim 0, Gast 3)
    v = nb[0]
    pg.locator(".lr-cq-nb button").first.click(); pg.wait_for_timeout(200)
    ins = pg.locator("#cq-panel input")
    ins.nth(0).fill("0"); ins.nth(1).fill("3"); pg.wait_for_timeout(200)
    pg.locator("#cq-take").click(); pg.wait_for_timeout(500)
    d = state(pg); cq = d["conquest"]
    i_att = cq["clubs"].index("FC Bayern München"); i_def = cq["clubs"].index(v)
    ok(cq["owner"][i_def] == i_att and len(cq["log"]) == 1 and cq["log"][0]["win"] == "a", f"Angreifer gewinnt 0:3: Bayern übernimmt das Reich von {v}")
    ok(pg.locator("#cq-log .lr-cq-lg").count() == 1, "Spiel im Protokoll")
    # Verteidiger gewinnt: nichts ändert sich
    pg.mouse.click(*center(pg, "FC Bayern München")); pg.wait_for_timeout(200)
    v2 = pg.locator(".lr-cq-nb button").first.inner_text(); pg.locator(".lr-cq-nb button").first.click()
    ins = pg.locator("#cq-panel input"); ins.nth(0).fill("2"); ins.nth(1).fill("1"); pg.locator("#cq-take").click(); pg.wait_for_timeout(500)
    d2 = state(pg)["conquest"]
    ok(d2["owner"] == cq["owner"] and d2["log"][-1]["win"] == "d", "Verteidiger siegt 2:1: Besitz unverändert")
    # Unentschieden -> Elfmeterschießen verlangt
    pg.mouse.click(*center(pg, "FC Bayern München")); pg.wait_for_timeout(200)
    pg.locator(".lr-cq-nb button").first.click()
    ins = pg.locator("#cq-panel input"); ins.nth(0).fill("1"); ins.nth(1).fill("1"); pg.wait_for_timeout(200)
    ok(pg.locator("[data-pen='1']").count() == 1 and pg.locator("#cq-take").is_disabled(), "1:1 -> Elfmeterschießen nötig, Übernehmen gesperrt")
    pg.locator("[data-pen='1'] button").nth(1).click(); pg.wait_for_timeout(200)   # Angreifer
    pg.locator("#cq-take").click(); pg.wait_for_timeout(500)
    d3 = state(pg)["conquest"]
    ok(d3["log"][-1]["pen"] is True and d3["log"][-1]["win"] == "a", "Elfmeterschießen für den Angreifer: Gebiet erobert")
    # simulieren
    pg.mouse.click(*center(pg, "FC Bayern München")); pg.wait_for_timeout(200)
    pg.locator(".lr-cq-nb button").first.click(); pg.locator("#cq-sim").click(); pg.wait_for_timeout(500)
    d4 = state(pg)["conquest"]
    ok(len(d4["log"]) == 4, "Spiel simulieren wertet ein Spiel aus")
    pg.locator("#cq-auto10").click(); pg.wait_for_timeout(1200)
    d5 = state(pg)["conquest"]
    ok(len(d5["log"]) >= 14 or d5["champion"], "10 zufällige Spiele")
    # bis zum Sieger
    pg.locator("#cq-auto-all").click(); pg.wait_for_timeout(5000)
    d6 = state(pg)["conquest"]
    ok(d6["champion"] in d6["clubs"] and len(set(d6["owner"])) == 1, f"bis zum Sieger gespielt: {d6['champion']} nach {len(d6['log'])} Spielen")
    ok(pg.locator(".lr-champ-box").count() == 1 and pg.locator("#cq-auto").count() == 0, "Sieger angezeigt, keine weiteren Spiele")
    # Neuladen
    pg.reload(); pg.wait_for_selector(".lr-tab"); pg.locator("#sec-cu").click(); pg.locator("#tab-cu-map").click(); pg.wait_for_selector("#cq-canvas")
    ok(pg.locator(".lr-champ-box").count() == 1, "nach dem Neuladen ist der Stand noch da")
    # Modus „ein Grenzgebiet“
    pg.locator("#cq-reset").click(); pg.wait_for_selector("#cq-setup"); pg.select_option("#cq-rl", "0"); pg.select_option("#cq-mode", "one")
    pg.locator("#cq-start").click(); pg.wait_for_selector("#cq-bar")
    pg.mouse.click(*center(pg, "FC Bayern München")); pg.wait_for_timeout(200)
    pg.locator(".lr-cq-nb button").first.click(); ins = pg.locator("#cq-panel input"); ins.nth(0).fill("0"); ins.nth(1).fill("2"); pg.locator("#cq-take").click(); pg.wait_for_timeout(500)
    e = state(pg)["conquest"]
    ok(e["mode"] == "one" and e["log"][0]["gained"] == 1 and sum(1 for o in e["owner"] if o == e["clubs"].index("FC Bayern München")) == 2, "Modus „ein Grenzgebiet“: Bayern bekommt genau ein Gebiet dazu")
    pg.locator("#cq-auto-all").click(); pg.wait_for_timeout(8000)
    f = state(pg)["conquest"]
    ok(f["champion"] is not None, f"auch im Grenzgebiet-Modus gibt es einen Sieger ({len(f['log'])} Spiele)")
    ok(not perr, f"keine JS-Fehler {perr[:2]}")
    b.close()
print("Fehler:", errs)

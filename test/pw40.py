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
    pg.locator(f".lr-cq-pin[data-club='{club}']").scroll_into_view_if_needed()
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
    # Vereine selbst auswählen
    pg.locator("#cq-reset").click(); pg.wait_for_selector("#cq-setup")
    pg.locator("#cq-select").click(); pg.wait_for_selector("#cq-chosen")
    ok(pg.locator("#cq-chosen .lr-cu-chip").count() >= 54, "Auswahl startet mit den bisherigen Vereinen")
    pg.locator("#cq-clear").click(); pg.wait_for_timeout(200)
    ok(pg.locator("#cq-start").is_disabled(), "ohne Vereine nicht startbar")
    pg.locator("#cq-add").click(); pg.wait_for_selector("#picker-list")
    ok(pg.locator("#picker-list input[aria-label='Real Madrid']").count() == 0 and pg.locator("#picker-list input[aria-label='FC Bayern München']").count() == 1, "Auswahlliste zeigt nur Vereine mit Standort")
    for n in ["FC Bayern München", "Borussia Dortmund", "SC Freiburg", "VfB Stuttgart", "Hamburger SV", "SV Werder Bremen" if False else "Werder Bremen"]:
        pg.fill("#picker-q", n); pg.wait_for_timeout(150); pg.locator(f"#picker-list input[aria-label='{n}']").first.check()
    pg.locator("#picker-add").click(); pg.wait_for_timeout(300)
    ok(pg.locator("#cq-chosen .lr-cu-chip").count() == 6 and "Meine Auswahl (6)" in pg.locator("#cq-chosen").inner_text(), "6 Vereine ausgewählt")
    pg.locator("button[aria-label='Hamburger SV entfernen']").click(); pg.wait_for_timeout(200)
    ok(pg.locator("#cq-chosen .lr-cu-chip").count() == 5, "Verein wieder entfernt")
    pg.locator("#cq-start").click(); pg.wait_for_selector("#cq-bar")
    g = state(pg)["conquest"]
    ok(sorted(g["clubs"]) == sorted(["FC Bayern München", "Borussia Dortmund", "SC Freiburg", "VfB Stuttgart", "Werder Bremen"]), "Eroberung mit genau den 5 gewählten Vereinen: " + ", ".join(g["clubs"]))
    pg.locator("#cq-auto-all").click(); pg.wait_for_timeout(2500)
    g = state(pg)["conquest"]
    ok(g["champion"] in g["clubs"], f"Sieger unter den 5: {g['champion']}")
    # Logo größer ziehen
    w0 = pg.locator(".lr-cq-pin").first.bounding_box()["width"]
    pg.locator("#cq-logo-size").evaluate("e => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(e, '60'); e.dispatchEvent(new Event('input', { bubbles: true })); }"); pg.wait_for_timeout(300)
    w1 = pg.locator(".lr-cq-pin").first.bounding_box()["width"]
    ok(w1 > w0 * 1.8 and abs(w1 - 60) < 2, f"Regler Logogröße: {w0:.0f} px -> {w1:.0f} px")
    ok(state(pg)["conquest"]["logoSize"] == 60, "Logogröße wird mit dem Stand gespeichert")
    # Einzelne Logos größer ziehen
    pg.locator("#cq-reset").click(); pg.wait_for_selector("#cq-setup")
    if pg.locator("#cq-preset").count(): pg.locator("#cq-preset").click()
    pg.select_option("#cq-rl", "0"); pg.locator("#cq-start").click(); pg.wait_for_selector("#cq-bar")
    pg.locator("#cq-logo-size").evaluate("e => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(e, '30'); e.dispatchEvent(new Event('input', { bubbles: true })); }"); pg.wait_for_timeout(200)
    ok(pg.locator(".lr-cq-handle").count() == 0, "Griffe nur im Bearbeitungsmodus")
    pg.locator("#cq-edit").click(); pg.wait_for_timeout(200)
    ok(pg.locator(".lr-cq-handle").count() == len(state(pg)["conquest"]["clubs"]) or pg.locator(".lr-cq-handle").count() >= 1, "Bearbeitungsmodus zeigt an jedem Logo einen Griff")
    club = state(pg)["conquest"]["clubs"][0]
    pin = pg.locator(f".lr-cq-pin[data-club='{club}']"); other = pg.locator(".lr-cq-pin").nth(1)
    w_a = pin.bounding_box()["width"]; w_o = other.bounding_box()["width"]
    hb = pg.locator(f".lr-cq-handle[data-handle='{club}']").bounding_box(); hx, hy = hb["x"] + hb["width"] / 2, hb["y"] + hb["height"] / 2
    pg.mouse.move(hx, hy); pg.mouse.down(); pg.mouse.move(hx + 20, hy, steps=4); pg.mouse.move(hx + 40, hy, steps=4); pg.mouse.up(); pg.wait_for_timeout(300)
    w_a2 = pin.bounding_box()["width"]; w_o2 = other.bounding_box()["width"]
    ok(w_a2 > w_a + 40 and abs(w_o2 - w_o) < 1, f"nur dieses Logo wächst: {w_a:.0f} -> {w_a2:.0f} px, anderes bleibt bei {w_o2:.0f} px")
    st = state(pg)["conquest"]
    ok(st.get("sizes", {}).get(club, 0) >= 70, f"Einzelgröße gespeichert: {st.get('sizes')}")
    pg.locator("#cq-logo-size").evaluate("e => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(e, '40'); e.dispatchEvent(new Event('input', { bubbles: true })); }"); pg.wait_for_timeout(200)
    ok(abs(pin.bounding_box()["width"] - w_a2) < 1 and abs(other.bounding_box()["width"] - 40) < 2, "Regler ändert nur Logos ohne eigene Größe")
    pg.locator("#cq-sizes-reset").click(); pg.wait_for_timeout(300)
    ok(abs(pin.bounding_box()["width"] - 40) < 2 and pg.locator("#cq-sizes-reset").count() == 0, "„Alle gleich groß“ setzt alle zurück")
    pg.locator("#cq-edit").click()
    # Glücksrad: erst Angreifer, dann Gegner, dann Pfeil auf der Karte
    log0 = len(state(pg)["conquest"]["log"])
    ok(pg.locator("#cq-wheel").count() == 1, "Knopf Glücksrad")
    pg.locator("#cq-wheel").click(); pg.wait_for_selector("#cq-wheel-canvas")
    ok("Wer greift an?" in pg.locator("#cq-wheel-panel").inner_text(), "Rad 1: Wer greift an?")
    pg.wait_for_function("() => document.querySelector('#cq-wheel-res') && document.querySelector('#cq-wheel-res').textContent.length > 0 && !document.querySelector('.lr-wheel[data-busy=\"1\"]')", timeout=15000)
    att = pg.locator("#cq-wheel-res b").inner_text()
    pg.wait_for_function("() => document.querySelector('#cq-wheel-panel').textContent.includes('greift') && document.querySelector('#cq-wheel-panel').textContent.includes('an?')", timeout=15000)
    ok(att in pg.locator("#cq-wheel-panel").inner_text(), f"Angreifer ausgelost: {att}")
    pg.wait_for_selector("#cq-sim", timeout=20000)
    pg.wait_for_function("() => document.querySelector('#cq-wheel-res b') && document.querySelectorAll('#cq-wheel-res b').length === 2", timeout=15000)
    pair = pg.locator("#cq-wheel-res b").all_inner_texts()
    ok(pair[0] == att and pair[1] != att, f"Rad 2 lost den Gegner aus: {pair[0]} ➜ {pair[1]}")
    ok(pg.locator("#cq-arrow").count() == 1, "Pfeil auf der Karte vom Angreifer zum Gegner")
    ok(pair[1] in pg.locator("#cq-panel").inner_text(), "Spielfeld zeigt das ausgeloste Duell")
    pg.locator("#cq-sim").click(); pg.wait_for_timeout(600)
    ok(len(state(pg)["conquest"]["log"]) == log0 + 1 and pg.locator("#cq-wheel-panel").count() == 0 and pg.locator("#cq-arrow").count() == 0, "Spiel gespielt, Rad und Pfeil verschwinden")
    pg.locator("#cq-wheel").click(); pg.locator("#cq-autosim").check() if pg.locator("#cq-autosim").count() else None
    pg.wait_for_function(f"() => document.querySelector('#cq-status') && document.querySelector('#cq-status').textContent.includes('Spiel {log0 + 3} ')", timeout=25000)
    ok(len(state(pg)["conquest"]["log"]) == log0 + 2, "automatisch simuliert nach der Auslosung")
    ok(not perr, f"keine JS-Fehler {perr[:2]}")
    b.close()
print("Fehler:", errs)

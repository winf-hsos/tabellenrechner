# 3D-Ansicht: Liga, Pokal, Europapokal (Ligaphase und K.-o.), Nachspielen eines Ergebnisses, Übernehmen
import os, json
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
def state(pg):
    return json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
def pixels(pg):
    return pg.evaluate("""() => { const c = document.querySelector('#m3-canvas'); const x = c.getContext('2d'); const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0; const seen = new Set(); for (let i = 0; i < d.length; i += 4 * 97) { seen.add((d[i] >> 4) * 256 + (d[i+1] >> 4) * 16 + (d[i+2] >> 4)); if (d[i+1] > 80) n++; } return [n, seen.size]; }""")
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_context(viewport={"width": 1300, "height": 1000}).new_page()
    js = []
    pg.on("pageerror", lambda e: js.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    # --- Liga: offenes Spiel ---
    ok(pg.locator(".lr-3d").count() == 9, f"Bundesliga: 3D-Knopf bei allen {pg.locator('.lr-3d').count()} Spielen")
    pg.locator(".lr-3d").first.click(); pg.wait_for_selector("#m3-canvas")
    ok("3D-Ansicht" in pg.locator(".lr-modal h2").inner_text(), "Dialog „3D-Ansicht“ öffnet")
    pg.locator("#m3-play").click(); pg.locator("#m3-speed").select_option("4"); pg.wait_for_timeout(2500)
    n, farben = pixels(pg)
    ok(n > 2000 and farben > 20, f"Canvas zeigt ein Bild (grüne Pixel {n}, Farben {farben})")
    mins = int(pg.locator("#m3-min").inner_text().replace("'", "") or 0)
    ok(mins > 2, f"Spielminute läuft ({mins}')")
    for v in ("oben", "tor", "stadion", "tv"):
        pg.locator("#m3-view").select_option(v); pg.wait_for_timeout(250)
    ok(pixels(pg)[0] > 500, "alle Kameras zeichnen")
    # Tore anspringen
    goals = pg.locator(".lr-m3-gl").count()
    take = pg.locator("#m3-take").inner_text()
    erg = take.replace("Ergebnis ", "").replace(" übernehmen", "").split(":")
    ok(goals == int(erg[0]) + int(erg[1]), f"Torliste ({goals}) passt zum ausgewürfelten Ergebnis {take}")
    if goals:
        pg.locator(".lr-m3-gl").first.click(); pg.locator("#m3-speed").select_option("2"); pg.wait_for_timeout(5200)
        ok(pg.locator("#m3-goal").count() == 1 or int(pg.locator("#m3-score").inner_text().split(":")[0]) + int(pg.locator("#m3-score").inner_text().split(":")[1]) >= 1, "Torjubel-Einblendung / Zwischenstand nach dem ersten Tor")
    pg.locator("#m3-take").click(); pg.wait_for_timeout(500)
    d = state(pg); r = d["active"]["bl1"]["results"]["0:0"]
    ok(r["h"] == erg[0] and r["a"] == erg[1] and len(r.get("sc", [])) == goals, f"Ergebnis übernommen: {r['h']}:{r['a']} mit {len(r.get('sc', []))} Torschützen")
    ok(pg.locator(".lr-modal").count() == 0, "Dialog nach dem Übernehmen geschlossen")
    # --- Liga: gespieltes Spiel wird nachgespielt ---
    pg.locator(".lr-3d").first.click(); pg.wait_for_selector("#m3-canvas")
    ok(pg.locator("#m3-take").count() == 0, "gespieltes Spiel: kein Übernehmen-Knopf")
    ok(pg.locator(".lr-m3-gl").count() == int(erg[0]) + int(erg[1]), "Nachspielen: Torliste entspricht dem gespeicherten Ergebnis")
    pg.locator("#m3-seek").focus(); pg.keyboard.press("End"); pg.wait_for_timeout(400)
    ok(pg.locator("#m3-score").inner_text() == f"{erg[0]}:{erg[1]}", f"Spulen ans Ende zeigt den Endstand {erg[0]}:{erg[1]}")
    ok(pg.locator("#m3-min").inner_text() in ("Abpfiff",) or int(pg.locator("#m3-min").inner_text().replace("'", "")) >= 89, "Spielende erreicht")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    ok(pg.locator("#m3-canvas").count() == 0, "Escape schließt die 3D-Ansicht")
    # --- Pokal ---
    pg.locator("#tab-cup").click(); pg.locator("#cup-start").click(); pg.get_by_role("button", name="1. Runde auslosen").click(); pg.wait_for_timeout(500)
    ok(pg.locator(".lr-3d").count() >= 16, f"DFB-Pokal: 3D-Knopf bei {pg.locator('.lr-3d').count()} Spielen")
    pg.locator(".lr-3d").first.click(); pg.wait_for_selector("#m3-canvas")
    pg.locator("#m3-take").click(); pg.wait_for_timeout(500)
    g = state(pg)["cup"]["rounds"][0]["games"][0]
    ok(g["hg"] != "" and g["ag"] != "" and isinstance(g.get("sc"), list), f"Pokalspiel übernommen: {g['hg']}:{g['ag']}")
    # --- Europapokal ---
    pg.locator("#tab-euro").click(); pg.locator("#eu-start").click(); pg.wait_for_selector(".lr-game")
    pg.locator(".lr-3d").first.click(); pg.wait_for_selector("#m3-canvas")
    pg.wait_for_timeout(700)
    ok(pixels(pg)[0] > 500, "Europapokal: 3D-Ansicht zeichnet")
    pg.locator("#m3-take").click(); pg.wait_for_timeout(500)
    run = state(pg)["euro"]["runs"]["cl"]
    ok(any(v.get("h") != "" for v in run["results"].values()), "Europapokal-Ligaphase: Ergebnis übernommen")
    pg.locator("#eu-sim-all").click(); pg.wait_for_timeout(1200)
    pg.locator("#eu-next").click(); pg.wait_for_timeout(800)
    ok(pg.locator(".lr-3d").count() >= 8, f"K.-o.-Phase: 3D-Knopf bei {pg.locator('.lr-3d').count()} Spielen")
    pg.locator(".lr-3d").first.click(); pg.wait_for_selector("#m3-canvas")
    pg.locator("#m3-take").click(); pg.wait_for_timeout(500)
    ko = state(pg)["euro"]["runs"]["cl"]["ko"][0]["ties"][0]
    ok(ko["l1"]["h"] != "" and ko["l1"]["a"] != "", f"K.-o.-Hinspiel übernommen: {ko['l1']['h']}:{ko['l1']['a']}")
    ok(not js, f"keine JavaScript-Fehler {js[:2]}")
    b.close()
print("Fehler:", errs)

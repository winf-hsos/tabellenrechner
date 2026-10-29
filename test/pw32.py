# Deutscher Unterbau: 5 Regionalligen + Oberligen, Auswahl, Zonen, Migration alter Stände, Saisonwechsel
import os, json
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
RL = ["rl_n", "rl_no", "rl_w", "rl_sw", "rl_by"]
OL = ["ol_bw", "ol_bn", "ol_bs", "ol_hb", "ol_hh", "ol_he", "ol_mr", "ol_nr", "ol_ns", "ol_non", "ol_nos", "ol_rps", "ol_sh", "ol_we"]
def state(pg): return json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1300, "height": 900})
    pg = ctx.new_page(); perr = []
    pg.on("pageerror", lambda e: perr.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    tabs = pg.locator(".lr-tabs .lr-tab").all_inner_texts()
    ok(not any(t.strip() in ("4. Liga", "5. Liga") for t in tabs), "keine 4./5. Liga")
    ok(pg.locator("#tab-rl option").count() == 6 and pg.locator("#tab-ol option").count() == 15, "Auswahl: 5 Regionalligen, 14 Oberligen")
    pg.get_by_role("button", name="Spieltag simulieren").first.click(); pg.wait_for_timeout(700)
    d = state(pg)
    for i in RL:
        ok(len(d["active"][i]["teams"]) == 18, f"{i}: 18 Klubs")
    ok(all(len(d["active"][i]["teams"]) % 2 == 0 for i in OL), "Oberligen: gerade Größen " + str([len(d["active"][i]["teams"]) for i in OL]))
    alle = [t for i in ["bl1", "bl2", "bl3"] + RL + OL for t in d["active"][i]["teams"]]
    ok(len(alle) == len(set(alle)), f"{len(alle)} Klubs, keine doppelt")
    ok(not any(t.endswith(" II") and t in d["active"][i]["teams"] for i in RL + OL for t in alle), "keine Reservemannschaften im Unterbau")
    # Kader: echte Kader für Regionalliga-Klubs
    ok(all(len(q["p"]) >= 16 for i in RL + OL for q in d["active"][i]["squads"]), "alle Unterbau-Kader mit mind. 16 Spielern")
    ok(len({x["n"] for i in RL + OL for q in d["active"][i]["squads"] for x in q["p"]}) == sum(len(q["p"]) for i in RL + OL for q in d["active"][i]["squads"]), "Spielernamen im Unterbau eindeutig")
    # Auswahl und Zonen
    pg.select_option("#tab-rl", "rl_n"); pg.wait_for_timeout(300)
    ok(pg.locator(".lr-tbl tbody tr").count() == 18, "Regionalliga Nord: 18 Zeilen")
    ok(pg.locator("#tab-rl").evaluate("e => e.getAttribute('data-on')") == "1", "Auswahl Regionalliga markiert")
    zonen = pg.locator(".lr-tbl tbody tr").evaluate_all("rs => rs.map(r => r.innerHTML.match(/zone-(\\w+)|data-zone=\"(\\w+)\"/g))")
    pg.select_option("#tab-ol", "ol_we"); pg.wait_for_timeout(300)
    ok(pg.locator(".lr-tbl tbody tr").count() == 12, "Oberliga Westfalen: 12 Zeilen")
    # Historie/Kalender/Torjäger/Vereine rendern
    for t in ["Torjäger", "Kalender", "Vereine", "Nachrichten"]:
        pg.locator(".lr-tabs .lr-tab", has_text=t).first.click(); pg.wait_for_timeout(200)
        ok(len(pg.locator("body").inner_text()) > 400, f"{t} rendert")
    # Vereinsseite eines Regionalligisten über die Suche
    pg.locator(".lr-tabs .lr-tab", has_text="Vereine").first.click(); pg.wait_for_timeout(300)
    ok("Regionalliga Nord" in pg.locator("body").inner_text(), "Vereine nennt Regionalliga Nord")
    ok(not perr, f"keine JS-Fehler {perr[:2]}")
    # Zwei Saisonwechsel über den Knopf
    sizes = [len(d["active"][i]["teams"]) for i in ["bl1", "bl2", "bl3"] + RL + OL]
    for k in range(2):
        pg.locator("#playall-open").click(); pg.locator("#playall-go").click(); pg.wait_for_timeout(5000)
        d2 = state(pg)
        s2 = [len(d2["active"][i]["teams"]) for i in ["bl1", "bl2", "bl3"] + RL + OL]
        a2 = [t for i in ["bl1", "bl2", "bl3"] + RL + OL for t in d2["active"][i]["teams"]]
        ok(s2 == sizes and len(set(a2)) == len(a2), f"Saisonwechsel {k+1}: Größen gleich, keine Doppelten (Label {d2['active']['rl_n']['label']})")
    ok(len([h for h in d2["history"] if h["type"] == "league"]) == 44, "Historie: 44 Ligatabellen aus zwei Saisonen")
    b.close()

    # Migration: alter Stand mit 4./5. Liga und Regionalliga-Topf
    b = p.chromium.launch()
    old = open(os.path.dirname(os.path.abspath(__file__)) + "/v12-state.json").read()
    ctx = b.new_context(viewport={"width": 1300, "height": 900})
    ctx.add_init_script("localStorage.getItem('ligarechner:v2')||localStorage.setItem('ligarechner:v2'," + json.dumps(old) + ")")
    pg = ctx.new_page(); perr = []
    pg.on("pageerror", lambda e: perr.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab"); pg.wait_for_timeout(500)
    pg.get_by_role("button", name="Spieltag simulieren").first.click(); pg.wait_for_timeout(900)
    m = state(pg)
    ok(all(i in m["active"] for i in ["bl1", "bl2", "bl3"] + RL + OL), "alter Stand: alle neuen Ligen angelegt")
    am = [t for i in ["bl1", "bl2", "bl3"] + RL + OL for t in m["active"][i]["teams"]]
    ok(len(am) == len(set(am)), f"alter Stand: keine Doppelten ({len(am)} Klubs)")
    ok(m.get("legacyLower") and m["legacyLower"].get("bl4") and m["legacyLower"].get("bl5"), "alter Stand: frühere 4./5. Liga bleibt aufbewahrt")
    ok(m["active"]["bl1"]["teams"] == json.loads(old)["active"]["bl1"]["teams"], "alter Stand: Bundesliga unverändert")
    ok(not perr, f"alter Stand: keine JS-Fehler {perr[:2]}")
    b.close()
print("Fehler:", errs)

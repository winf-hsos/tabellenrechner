# Länderspiele: Nationen, Turniere (EM, WM, kleine Formate), Gruppen, K.o., Historie
import os, json
from playwright.sync_api import sync_playwright
D = "file://" + os.path.dirname(os.path.abspath(__file__)) + "/"
errs = []
def ok(c, m):
    print(("OK   " if c else "FEHLER ") + m)
    if not c: errs.append(m)
def state(pg):
    return json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
def run_tournament(pg, preset, n, groups, ko_sizes, thirds):
    pg.locator("#tn-preset").select_option(preset); pg.wait_for_timeout(200)
    ok(pg.locator(".lr-k-nat[data-on='1']").count() == n, f"{preset}: {n} Mannschaften vorausgewählt")
    pg.locator("#tn-start").click(); pg.wait_for_timeout(800)
    ok(pg.locator("#tn-groups [data-g]").count() == groups, f"{preset}: {groups} Gruppen")
    ok(pg.locator("#tn-groups .lr-k-tg").count() == groups * 6, f"{preset}: {groups * 6} Gruppenspiele")
    pg.locator("#tn-groups .lr-sim:not(.lr-3d)").first.click(); pg.wait_for_timeout(300)
    pg.locator("#tn-sim-groups").click(); pg.wait_for_timeout(1200)
    st = state(pg)["tourn"]
    ok(all(len(g["results"]) == 6 for g in st["groups"]), f"{preset}: alle Gruppen komplett")
    ok(pg.locator("#tn-draw-ko").count() == 1, f"{preset}: K.-o.-Phase auslosbar")
    pg.locator("#tn-draw-ko").click(); pg.wait_for_timeout(800)
    pg.locator("#tn-v-ko").click(); pg.wait_for_timeout(300)
    for k, games in enumerate(ko_sizes):
        r = state(pg)["tourn"]["ko"]["rounds"]
        ok(len(r) == k + 1 and len(r[k]["games"]) == games, f"{preset}: {r[k]['name']} mit {len(r[k]['games'])} Spielen (soll {games})")
        if k == 0:
            tm = {}
            for g in state(pg)["tourn"]["groups"]:
                for i in g["idx"]: tm[state(pg)["tourn"]["teams"][i]["name"]] = g["name"]
            same = sum(1 for x in r[0]["games"] if tm[x["h"]["name"]] == tm[x["a"]["name"]])
            ok(same == 0, f"{preset}: keine Gruppen-Wiederholung in der ersten K.-o.-Runde")
            ok(len({x[s]["name"] for x in r[0]["games"] for s in ("h", "a")}) == games * 2, f"{preset}: {games * 2} verschiedene Teams in der ersten K.-o.-Runde")
        pg.locator("#tn-sim-round").click(); pg.wait_for_timeout(900)
        if k < len(ko_sizes) - 1:
            pg.locator("#tn-next").click(); pg.wait_for_timeout(800)
    ok(pg.locator("#tn-champ").count() == 1, f"{preset}: Turniersieger angezeigt")
    champ = pg.locator("#tn-champ .disp").inner_text().strip()
    pg.locator("#tn-finish").click(); pg.wait_for_timeout(900)
    d = state(pg)
    h = [x for x in d["history"] if x["leagueId"] == "tournko"]
    ok(d["tourn"] is None and len(h) >= 1 and champ.endswith(h[0]["winner"]), f"{preset}: Turnier in der Historie, Sieger {h[0]['winner']}")
    ok(len(h[0]["groups"]) == groups, f"{preset}: Gruppentabellen in der Historie")
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_context(viewport={"width": 1300, "height": 1000}).new_page()
    js = []
    pg.on("pageerror", lambda e: js.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    pg.locator("#sec-nt").click(); pg.wait_for_timeout(300)
    tabs = [t.strip() for t in pg.locator(".lr-tab").all_inner_texts()]
    ok(tabs == ["Turnier", "Nationen", "Nachrichten", "Historie"], f"Länderspiele-Tabs {tabs}")
    ok(pg.locator("#newstr-open").count() == 0 and pg.locator("#playall-open").count() == 0, "Knöpfe für Liga-Saisons sind ausgeblendet")
    # Nationen
    pg.locator("#tab-nations").click(); pg.wait_for_timeout(300)
    ok(pg.locator("#nations-tab .lr-k-tile").count() >= 60, f"{pg.locator('#nations-tab .lr-k-tile').count()} Nationen")
    pg.locator("#nations-tab input[aria-label='Stärke Spanien']").fill("50"); pg.wait_for_timeout(900)
    ok(state(pg)["nationStr"]["Spanien"] == 50, "Stärke einer Nation geändert und gespeichert")
    pg.locator("#nations-tab input[aria-label='Stärke Spanien']").fill("92"); pg.wait_for_timeout(300)
    pg.locator("#nations-tab .lr-k-link", has_text="Deutschland").click(); pg.wait_for_selector("#nation-modal")
    ok(pg.locator("#nation-modal .lr-k-row").count() == 18, "Nationalkader mit 18 Spielern")
    pg.keyboard.press("Escape")
    # Turnier: Mini
    pg.locator("#tab-tourn").click(); pg.wait_for_timeout(300)
    run_tournament(pg, "k8", 8, 2, [2, 1], 0)
    run_tournament(pg, "k16", 16, 4, [4, 2, 1], 0)
    run_tournament(pg, "em", 24, 6, [8, 4, 2, 1], 4)
    run_tournament(pg, "wm", 48, 12, [16, 8, 4, 2, 1], 8)
    # 3D im Turnier
    pg.locator("#tn-preset").select_option("k8"); pg.locator("#tn-start").click(); pg.wait_for_timeout(600)
    pg.locator("#tn-groups .lr-3d").first.click(); pg.wait_for_selector("#m3-canvas")
    pg.locator("#m3-take").click(); pg.wait_for_timeout(900)
    g0 = state(pg)["tourn"]["groups"][0]["results"]
    ok(len(g0) == 1 and "sc" in list(g0.values())[0], "3D-Spiel im Turnier übernommen")
    # Historie des Abschnitts
    pg.locator(".lr-tab", has_text="Historie").click(); pg.wait_for_timeout(300)
    ok(pg.locator("body").inner_text().count("Mini-Turnier") >= 1 or pg.locator("body").inner_text().count("Nationen-Turnier") >= 1, "Historie zeigt die Turniere")
    pg.reload(); pg.wait_for_selector(".lr-tab"); pg.wait_for_timeout(500)
    ok(state(pg)["tourn"] is not None, "laufendes Turnier bleibt nach dem Neuladen")
    ok(not js, f"keine JavaScript-Fehler {js[:2]}")
    b.close()
print("Fehler:", errs)

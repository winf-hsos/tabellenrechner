# Weitere Länder (datengetrieben): Ligen, Pokal, Europa-Plätze, Auf-/Abstieg, Historie – für jedes Land aus WORLD
import os, json, re
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
D = "file://" + HERE + "/"
src = open(os.path.join(HERE, "..", "Tabellenrechner.jsx"), encoding="utf8").read()
m = re.search(r"// <<WORLD>>\nconst WORLD = (.*?);\n// <</WORLD>>", src, re.S)
WORLD = json.loads(m.group(1))
errs = []
def ok(c, msg):
    print(("OK   " if c else "FEHLER ") + msg)
    if not c: errs.append(msg)
def state(pg):
    return json.loads(pg.evaluate("() => localStorage.getItem('ligarechner:v2')"))
def fixture_count(n): return (n - 1) * 2
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_context(viewport={"width": 1300, "height": 1000}).new_page()
    js = []
    pg.on("pageerror", lambda e: js.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    ok(pg.locator("#sec-more option").count() == len(WORLD) + 1, f"Länderauswahl mit {len(WORLD)} weiteren Ländern")
    for c in WORLD:
        key = c["key"]; name = c["name"]
        pg.locator("#sec-more").select_option(key); pg.wait_for_timeout(300)
        tabs = [t.strip() for t in pg.locator(".lr-tab").all_inner_texts()]
        want = [l["name"] for l in c["leagues"]] + [c["cup"]["name"], "Europa", "Torjäger", "Kalender", "Nachrichten", "Vereine", "Historie"]
        ok(tabs == want, f"{name}: Tabs {tabs}")
        for lg in c["leagues"]:
            pg.locator(".lr-tab", has_text=lg["name"]).first.click(); pg.wait_for_timeout(250)
            n = len(lg["teams"])
            rows = pg.locator(".lr-tbl tbody tr").count()
            logos = pg.locator(".lr-tbl tbody tr img.lr-logo").count()
            ok(rows == n and logos >= n * 0.8, f"{name} {lg['name']}: {n} Klubs, {logos} mit Logo")
            st = [int(x) for x in pg.locator(".lr-tbl td.str").all_inner_texts()]
            ok(min(st) == lg["range"][1] and max(st) == lg["range"][0], f"{name} {lg['name']}: Stärken {min(st)}–{max(st)} (soll {lg['range'][1]}–{lg['range'][0]})")
            ok(f"von {fixture_count(n)}" in pg.locator(".lr-md-num").inner_text(), f"{name} {lg['name']}: {fixture_count(n)} Spieltage")
        pg.locator(".lr-tab", has_text=c["leagues"][0]["name"]).first.click()
        pg.get_by_role("button", name="Spieltag simulieren").first.click(); pg.wait_for_timeout(900)
        d = state(pg)
        sqs = {t: [x["n"] for x in d["active"][l["id"]]["squads"][i]["p"]] for l in c["leagues"] for i, t in enumerate(d["active"][l["id"]]["teams"])}
        allnames = [x for v in sqs.values() for x in v]
        ok(all(len(v) == 18 for v in sqs.values()), f"{name}: alle {len(sqs)} Klubs mit 18 Spielern")
        other = {x["n"] for lid, s in d["active"].items() if lid not in [l["id"] for l in c["leagues"]] for q in s["squads"] for x in q["p"]}
        # Euro-Teams mit eigenem Kader (Ligen ohne Weltdaten) teilen Namen nur bei echten Doppelungen
        ok(len(allnames) == len(set(allnames)), f"{name}: Spielernamen im Land eindeutig")
        ok(len(set(allnames) & other) == 0, f"{name}: keine Spieler doppelt in anderen Ländern")
        # Europa
        want_eu = {x: c["leagues"][0]["zones"][x] for x in ("cl", "el", "ecl")}
        got = {x: sum(1 for t in d["euro"]["teams"][x] if t.get(key)) for x in ("cl", "el", "ecl")}
        ok(got == want_eu or sum(got.values()) == 0, f"{name}: Euro-Startlisten {got} (Plätze {want_eu})")
        pg.locator(f"#tab-{key}euro").click(); pg.wait_for_timeout(300)
        shown = {x: pg.locator(f"[data-comp='{x}'] .eu-eng li").count() for x in ("cl", "el", "ecl")}
        ok(shown == got, f"{name}: Tab Europa {shown}")
        # Pokal
        pg.locator("#tab-cup").click(); pg.locator("#cup-start").click(); pg.wait_for_timeout(500)
        res = set(c["reserve"])
        field = sum(1 for l in c["leagues"] for t in l["teams"] if t not in res)
        P = 2
        while P * 2 <= field: P *= 2
        rounds = ([field - P] if field != P else []) + [P // 2 // (2 ** i) for i in range(0)]
        sizes = ([field - P] if field != P else []) + [P // (2 ** (i + 1)) for i in range(P.bit_length() - 1)]
        for k, mexp in enumerate(sizes):
            r = state(pg)[c["cup"]["key"]]["rounds"]
            ok(len(r) == k + 1 and len(r[k]["games"]) == mexp, f"{name} {c['cup']['name']} Runde {k + 1} ({r[k]['name']}): {len(r[k]['games'])} Spiele (soll {mexp})")
            pg.get_by_role("button", name="Runde simulieren").click(); pg.wait_for_timeout(800)
            if k < len(sizes) - 1:
                pg.get_by_role("button", name="Nächste Runde auslosen").click(); pg.wait_for_timeout(800)
        r0 = state(pg)[c["cup"]["key"]]["rounds"][0]["games"]
        ok(not any(g["h"]["name"] in res or g["a"]["name"] in res for g in r0), f"{name}: keine Reservemannschaft im Pokal")
        champ = pg.locator(".lr-champ-box .disp").inner_text().strip()
        pg.get_by_role("button", name="Pokal abschließen").click(); pg.get_by_role("button", name="In die Historie").click(); pg.wait_for_timeout(700)
        d = state(pg)
        hist = [h for h in d["history"] if h["leagueId"] == c["cup"]["key"]]
        ok(len(hist) == 1 and hist[0]["winner"] == champ, f"{name}: Pokal in der Historie, Sieger {champ}")
        # Saisonabschluss mit Auf- und Abstieg
        for lg in c["leagues"]:
            pg.locator(".lr-tab", has_text=lg["name"]).first.click(); pg.get_by_role("button", name="Rest der Saison").click(); pg.wait_for_timeout(500)
        pg.get_by_role("button", name="Saison abschließen").click(); pg.wait_for_timeout(300)
        pg.get_by_role("button", name="Alle Ligen des Landes mit Auf- und Abstieg").click(); pg.wait_for_timeout(1000)
        d2 = state(pg); nach = d2["active"]
        ids = [l["id"] for l in c["leagues"]]
        ok(all(nach[i]["label"] == "2027/28" and nach[i]["results"] == {} for i in ids), f"{name}: neue Saison 2027/28 ohne Ergebnisse")
        ok([len(nach[i]["teams"]) for i in ids] == [len(l["teams"]) for l in c["leagues"]], f"{name}: Ligagrößen bleiben")
        hist = {h["leagueId"]: h for h in d2["history"] if h["label"] == "2026/27" and h["leagueId"] in ids}
        tb = {i: [r["name"] for r in hist[i]["table"]] for i in ids}
        mv = c["moves"][0]
        below = [t for t in tb[ids[1]] if t not in res]
        direct = below[:mv["up"]]
        ok(all(t in nach[ids[0]]["teams"] for t in direct), f"{name}: Direktaufsteiger {direct}")
        ups = [t for t in nach[ids[0]]["teams"] if t in tb[ids[1]]]
        ok(len(ups) == mv["up"] + (1 if mv["po"] else 0) and not (set(ups) & res), f"{name}: {len(ups)} Aufsteiger, keine Reserve")
        ok(set(tb[ids[0]][-len(ups):]) <= set(nach[ids[1]]["teams"]), f"{name}: {len(ups)} Absteiger in der zweiten Liga")
        eu = {x: sorted(t["name"] for t in d2["euro"]["teams"][x] if t.get(key)) for x in ("cl", "el", "ecl")}
        z = c["leagues"][0]["zones"]
        exp = {"cl": sorted(tb[ids[0]][:z["cl"]]), "el": sorted(tb[ids[0]][z["cl"]:z["cl"] + z["el"]]), "ecl": sorted(tb[ids[0]][z["cl"] + z["el"]:z["cl"] + z["el"] + z["ecl"]])}
        ok(eu == exp, f"{name}: Europapokal-Plätze aus der Tabelle {eu['cl']}")
        # Saison durchspielen
        pg.locator("#playall-open").click()
        ok(name in pg.locator(".lr-modal h2").inner_text(), f"{name}: Dialog nennt das Land")
        pg.locator("#playall-go").click(); pg.wait_for_timeout(3000)
        d3 = state(pg)
        h3 = sorted(h["leagueId"] for h in d3["history"] if h["label"] == "2027/28" and (h["leagueId"] in ids or h["leagueId"] == c["cup"]["key"]))
        ok(h3 == sorted(ids + [c["cup"]["key"]]), f"{name}: Saison durchspielen {h3}")
        ok(all(d3["active"][i]["label"] == "2028/29" for i in ids), f"{name}: nächste Saison 2028/29")
        pg.locator(".lr-tab", has_text="Kalender").click(); pg.wait_for_timeout(300)
        opts = pg.locator("select[aria-label='Wettbewerb filtern'] option").all_inner_texts()
        ok(opts == ["alle"] + [l["name"] for l in c["leagues"]] + [c["cup"]["name"]], f"{name}: Kalender-Filter {opts}")
        pg.locator(".lr-tab", has_text="Torjäger").click(); pg.wait_for_timeout(300)
        heads = [h.strip() for h in pg.locator(".lr-top-h b").all_inner_texts()]
        ok(heads == [l["name"] for l in c["leagues"]] + [c["cup"]["name"]], f"{name}: Torjäger {heads}")
        pg.locator(".lr-tab", has_text="Historie").click(); pg.wait_for_timeout(300)
        ok(pg.locator(".lr-tab", has_text="Historie").inner_text().strip().startswith("Historie ("), f"{name}: Historie hat Einträge")
        # Vereine-Tab
        pg.locator("#tab-clubs").click(); pg.wait_for_timeout(300)
        total = sum(len(l["teams"]) for l in c["leagues"])
        ok(pg.locator("#clubs-tab .lr-k-tile").count() == total, f"{name}: Vereine-Tab zeigt {total} Klubs")
        pg.reload(); pg.wait_for_selector(".lr-tab"); pg.wait_for_timeout(300)
    ok(not js, f"keine JavaScript-Fehler {js[:2]}")
    b.close()
print("Fehler:", errs)

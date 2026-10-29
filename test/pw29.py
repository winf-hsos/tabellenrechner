# Kicker-Stil: Nachrichten, Vereinsseiten, Spielerseiten, Spielbericht, Suche, Tabellenansichten
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
    ctx = b.new_context(viewport={"width": 1300, "height": 1000})
    pg = ctx.new_page()
    js = []
    pg.on("pageerror", lambda e: js.append(str(e)))
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    tabs = [t.strip() for t in pg.locator(".lr-tab").all_inner_texts()]
    ok("Nachrichten" in tabs and "Vereine" in tabs, f"neue Tabs: {tabs}")
    # --- Tabellenansichten ---
    pg.get_by_role("button", name="Rest der Saison").click(); pg.wait_for_timeout(900)
    def tab_rows():
        return [[c.strip() for c in r.locator("td").all_inner_texts()] for r in pg.locator(".lr-tbl tbody tr").all()]
    pg.locator("#tbl-all").click(); allr = {r[1].split("\n")[0]: r for r in tab_rows()}
    pg.locator("#tbl-home").click(); home = {r[1].split("\n")[0]: r for r in tab_rows()}
    pg.locator("#tbl-away").click(); away = {r[1].split("\n")[0]: r for r in tab_rows()}
    k = next(iter(allr))
    col = lambda r: int(r[-1])
    ok(all(col(home[t]) + col(away[t]) == col(allr[t]) for t in allr), "Heim- + Auswärtspunkte ergeben die Gesamttabelle")
    ok(all(int(home[t][3]) == 17 and int(away[t][3]) == 17 for t in home), "Heim/Auswärts: je 17 Spiele")
    pg.locator("#tbl-first").click(); first = tab_rows()
    pg.locator("#tbl-second").click(); second = tab_rows()
    ok(all(int(r[3]) == 17 for r in first + second), "Hin-/Rückrunde: je 17 Spiele")
    pg.locator("#tbl-all").click()
    # --- Vereinsseite per Namen in der Tabelle ---
    pg.locator(".lr-tbl .lr-tl").first.click(); pg.wait_for_selector("#club-modal")
    name = pg.locator("#club-modal h2").inner_text()
    ok(bool(name) and "Platz 1" in pg.locator("#club-modal .lr-k-sub").inner_text(), f"Vereinsseite {name} öffnet (Tabellenführer)")
    pg.locator(".lr-k-tab", has_text="Spiele").click()
    ok(pg.locator("#club-games .lr-k-game").count() == 34, "Spiele-Reiter: 34 Spiele")
    pg.locator(".lr-k-tab", has_text="Kader").click()
    ok(pg.locator("#club-squad .lr-k-row").count() == 18, "Kader-Reiter: 18 Spieler")
    pg.locator("#club-fav").click(); pg.wait_for_timeout(800)
    ok(state(pg)["favorites"] == [name], "Favorit gespeichert")
    pg.locator(".lr-k-tab", has_text="Verein").last.click()
    pg.locator("#ci-trainer").fill("Test Trainer"); pg.locator("#ci-stadium").fill("Testarena"); pg.locator("#ci-note").fill("Notiz")
    pg.locator("#ci-save").click(); pg.wait_for_timeout(800)
    ok(state(pg)["clubInfo"][name]["trainer"] == "Test Trainer", "Vereinsinfos gespeichert")
    # --- Spielerseite ---
    pg.locator(".lr-k-tab", has_text="Kader").click()
    pg.locator("#club-squad .lr-tl").first.click(); pg.wait_for_selector("#player-modal")
    pl = pg.locator("#player-modal h2").inner_text()
    pg.locator("#pi-age").fill("27"); pg.locator("#pi-note").fill("Stammspieler"); pg.locator("#pi-save").click(); pg.wait_for_timeout(800)
    ok(state(pg)["playerInfo"][pl]["age"] == "27", f"Spielerinfo {pl} gespeichert")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    ok(pg.locator("#club-modal").count() == 1 and pg.locator("#player-modal").count() == 0, "Escape führt von der Spielerseite zurück zum Verein")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    ok(pg.locator(".lr-modal").count() == 0, "Escape schließt die Vereinsseite")
    # --- Spielbericht ---
    pg.locator(".lr-rep").first.click(); pg.wait_for_selector("#match-modal")
    ok(":" in pg.locator("#mr-score").inner_text() and pg.locator("#mr-score").inner_text() != "–:–", f"Spielbericht zeigt Ergebnis {pg.locator('#mr-score').inner_text()}")
    n0 = pg.locator("#mr-ticker .lr-k-ev").count()
    ok(n0 >= 2, f"Ticker mit Anpfiff/Abpfiff und Toren ({n0} Einträge)")
    pg.locator("#mr-card-p").select_option(index=1)
    pg.locator("#match-modal input[placeholder='Minute']").fill("33"); pg.locator("#mr-card-add").click(); pg.wait_for_timeout(800)
    ok(pg.locator("#mr-ticker .lr-k-ev").count() == n0 + 1, "Karte im Ticker eingetragen")
    pg.locator(".lr-k-tab", has_text="Aufstellung").click()
    ok(pg.locator("#mr-lineup svg circle").count() >= 23, "Aufstellung: 22 Spieler auf dem Platz")
    pg.locator(".lr-k-tab", has_text="Vergleich").click()
    ok(pg.locator("#mr-cmp .lr-k-cmp").count() >= 5, "Vergleich mit Statistik")
    pg.locator(".lr-k-tab", has_text="Spielinfos").click()
    pg.locator("#mr-att").fill("52000"); pg.locator("#mr-ref").fill("Dr. Pfeifer"); pg.locator("#mr-report").fill("Ein packendes Spiel.\n\nZweiter Absatz.")
    pg.locator("#mr-save").click(); pg.wait_for_timeout(800)
    mi = state(pg)["matchInfo"]
    ok(any(v.get("att") == "52000" and len(v.get("events", [])) == 1 for v in mi.values()), "Spielinfos und Karte gespeichert")
    pg.locator("#mr-publish").click(); pg.wait_for_selector("#article-editor")
    ok(pg.locator("#ae-body").input_value().startswith("Ein packendes Spiel"), "Veröffentlichen übernimmt den Spielbericht in den Editor")
    pg.locator("#ae-save").click(); pg.wait_for_timeout(800)
    news = state(pg)["news"]
    ok(len(news) == 1 and news[0]["cat"] == "Spielbericht", f"Spielbericht als Artikel gespeichert: {news[0]['title']}")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    # --- Nachrichten ---
    pg.locator("#tab-news").click(); pg.wait_for_selector("#news-tab")
    ok(pg.locator(".lr-k-news").count() == 1, "Nachrichten zeigen den Artikel")
    ok(pg.locator("#news-results .lr-k-res").count() >= 5, "Ergebnisse des letzten Spieltags in der Seitenleiste")
    ok(pg.locator("#news-favs .lr-k-fav").count() == 1, "Meine Vereine zeigt den Favoriten")
    pg.locator("#news-new").click(); pg.wait_for_selector("#article-editor")
    pg.locator("#ae-title").fill("Transfer-Hammer"); pg.locator("#ae-teaser").fill("Star wechselt"); pg.locator("#ae-body").fill("Text eins.\n\nText zwei.")
    pg.locator("#ae-cat").select_option("Transfer"); pg.locator("#ae-team").fill(name)
    pg.locator("#ae-save").click(); pg.wait_for_timeout(800)
    ok(pg.locator(".lr-k-news").count() == 2, "neuer Artikel erscheint")
    pg.locator(".lr-k-chip", has_text="Transfer").click()
    ok(pg.locator(".lr-k-news").count() == 1, "Rubrikfilter Transfer")
    pg.locator(".lr-k-chip", has_text="Alle").click()
    pg.locator(".lr-k-news", has_text="Transfer-Hammer").click(); pg.wait_for_selector("#article-modal")
    ok(pg.locator("#article-modal .lr-k-text p").count() == 2, "Artikel mit zwei Absätzen")
    pg.locator("#article-edit").click(); pg.locator("#ae-title").fill("Transfer-Hammer II"); pg.locator("#ae-save").click(); pg.wait_for_timeout(800)
    ok(any(a["title"] == "Transfer-Hammer II" for a in state(pg)["news"]), "Artikel bearbeitet")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    pg.locator(".lr-k-news", has_text="Transfer-Hammer II").click(); pg.locator("#article-del").click(); pg.locator("#article-del-ok").click(); pg.wait_for_timeout(800)
    ok(len(state(pg)["news"]) == 1, "Artikel gelöscht")
    # --- Vereine-Tab, Suche ---
    pg.locator("#tab-clubs").click(); pg.wait_for_selector("#clubs-tab")
    ok(pg.locator("#clubs-tab .lr-k-tile").count() == 342 + 1, f"Vereine: 342 Klubs + Favoritenkachel ({pg.locator('#clubs-tab .lr-k-tile').count()})")
    pg.locator("#clubs-q").fill("Bayern")
    ok(pg.locator("#clubs-tab .lr-k-tile").count() >= 1, "Vereinssuche im Tab")
    pg.locator("#search-q").fill("Kane")
    pg.wait_for_selector("#search-res button")
    ok(pg.locator("#search-res button").count() >= 1, "globale Suche findet Spieler")
    pg.locator("#search-res button").first.click(); pg.wait_for_selector("#player-modal")
    ok("Kane" in pg.locator("#player-modal h2").inner_text(), "Suche öffnet die Spielerseite")
    pg.locator("#pi-to").select_option("Borussia Dortmund"); pg.locator("#pi-transfer").click(); pg.wait_for_timeout(1000)
    st = state(pg)
    sq = lambda t: next(q for l in ("bl1","bl2","bl3","rl_n","rl_no","rl_w","rl_sw","rl_by","ol_bw","ol_bn","ol_bs","ol_hb","ol_hh","ol_he","ol_mr","ol_nr","ol_ns","ol_non","ol_nos","ol_rps","ol_sh","ol_we") for i, tt in enumerate(st["active"][l]["teams"]) if tt == t for q in [st["active"][l]["squads"][i]])
    ok(any(x["n"] == "Harry Kane" for x in sq("Borussia Dortmund")["p"]) and not any(x["n"] == "Harry Kane" for x in sq("FC Bayern München")["p"]), "Transfer: Kane wechselt von Bayern zu Dortmund")
    ok(len(sq("Borussia Dortmund")["p"]) == 19 and len(sq("FC Bayern München")["p"]) == 17, "Kader 19 / 17 Spieler")
    ok(st["news"][0]["cat"] == "Transfer" and "Harry Kane" in st["news"][0]["title"], f"Transfermeldung: {st['news'][0]['title']}")
    ok("Borussia Dortmund" in pg.locator("#player-modal .lr-k-sub").inner_text(), "Spielerseite zeigt den neuen Verein")
    pg.keyboard.press("Escape")
    # --- andere Abschnitte ---
    pg.locator("#sec-fr").click(); pg.locator("#tab-clubs").click(); pg.wait_for_timeout(800)
    ok(pg.locator("#clubs-tab .lr-k-tile").count() == 54, "Frankreich: 54 Vereine")
    # --- Persistenz ---
    pg.reload(); pg.wait_for_selector(".lr-tab"); pg.wait_for_timeout(500)
    st = state(pg)
    ok(len(st["news"]) == 2 and st["favorites"] == [name] and st["clubInfo"][name]["stadium"] == "Testarena", "alles bleibt nach dem Neuladen erhalten")
    ok(not js, f"keine JavaScript-Fehler {js[:2]}")
    b.close()
print("Fehler:", errs)

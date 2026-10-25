import os
from playwright.sync_api import sync_playwright
import re
URL="file://"+os.path.dirname(os.path.abspath(__file__))+"/index.html"
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={"width":1300,"height":900}).new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_selector(".lr-tab"); pg.locator("#tab-euro").click()
    # ---- Teilnehmer-Fenster
    pg.locator("#eu-teams").click(); pg.wait_for_selector(".lr-modal")
    print("Zeilen im Fenster:", pg.locator(".lr-modal .lr-team-row").count())
    # Logo für Zeile 6 (erster Fremdverein)
    pg.locator("#eulogo-4").set_input_files("crest.png"); pg.wait_for_selector(".lr-modal .lr-logo-pick img", timeout=3000)
    print("Logo gesetzt:", pg.locator(".lr-modal .lr-logo-pick img").count())
    # Stärke Tab/Enter: erste Fremd-Stärke = Zeile 5 (Index 4)
    f=pg.locator(".lr-modal input.lr-team-str")
    print("Fremd-Stärke-Felder:", f.count(), f.nth(0).input_value(), f.nth(1).input_value())
    f.nth(0).click(); pg.keyboard.type("77"); pg.keyboard.press("Tab"); pg.keyboard.type("66"); pg.keyboard.press("Enter")
    print("Werte nach Tab/Enter:", [f.nth(i).input_value() for i in range(3)])
    # Verein entfernen -> 35, auffüllen
    pg.locator(".lr-modal .lr-team-row").last.get_by_role("button", name=re.compile("entfernen", re.I)).click()
    print("Zähler:", pg.locator(".lr-modal .lr-bulk-hint").nth(2).inner_text() if pg.locator(".lr-modal .lr-bulk-hint").count()>2 else "?")
    pg.locator("#eu-add").click()
    pg.locator(".lr-modal .lr-team-row").last.locator("input.lr-team-in").fill("Mein Testklub")
    pg.get_by_role("button", name="Übernehmen").click(); pg.wait_for_timeout(300)
    print("Liste nach Speichern:", pg.locator(".eu-list li").count(), "| Testklub dabei:", pg.locator(".eu-list", has_text="Mein Testklub").count(), "| Logo in Liste:", pg.locator(".eu-list .lr-logo").count())
    print("Start möglich:", pg.locator("#eu-start").is_enabled())
    # starten + Logo in Tabelle/Spielen
    pg.locator("#eu-start").click(); pg.wait_for_selector(".lr-game")
    print("Logos in Partien/Tabelle:", pg.locator(".lr-game .lr-logo").count(), pg.locator(".lr-tbl .lr-logo").count())
    # CL zu Ende spielen (wird beim Saisonabschluss automatisch archiviert)
    pg.locator("#eu-sim-all").click(); pg.locator("#eu-next").click()
    for k in range(4):
        pg.locator("#eu-sim-round").click(); pg.locator("#eu-next").click()
    pg.locator("#eu-sim-round").click()
    champ=pg.locator(".lr-champ-box .disp").inner_text(); print("CL-Sieger:", champ)
    # EL starten, unvollständig lassen
    pg.locator("#eu-el").click(); pg.locator("#eu-start").click(); pg.wait_for_selector(".lr-game")
    # ---- alle Ligen durchspielen
    for name in ["Bundesliga","2. Bundesliga","3. Liga","4. Liga","5. Liga"]:
        pg.locator(".lr-tab", has_text=re.compile("^"+re.escape(name)+"$")).click()
        pg.get_by_role("button", name="Rest der Saison").click(); pg.wait_for_timeout(200)
    pg.locator(".lr-tab", has_text=re.compile("^Bundesliga$")).click()
    top=[pg.locator(".lr-tbl tbody tr").nth(i).locator("td.name").inner_text().strip() for i in range(8)]
    print("Bundesliga Top 8:", top)
    # Pokal spielen
    pg.locator(".lr-tab", has_text="DFB-Pokal").click(); pg.get_by_role("button", name="Pokal starten").click()
    pg.wait_for_selector(".lr-modal"); 
    btns=pg.locator(".lr-modal").get_by_role("button"); print("Pokal-Dialog Buttons:", btns.all_inner_texts())
    pg.keyboard.press("Escape")
    pg.locator(".lr-tab", has_text="Historie").click()
    pg.get_by_role("button", name="Alle Ligen abschließen").click(); pg.wait_for_selector(".lr-modal")
    print("Dialog Europa-Text:", [t for t in pg.locator(".lr-modal .lr-duel-h").all_inner_texts() if "Europapokal" in t])
    pg.get_by_role("button", name=re.compile("Abschließen und neu besetzen")).click(); pg.wait_for_timeout(500)
    print("Historie-Einträge:", pg.locator(".lr-hist-row").count(), "| Euro-Eintrag:", [t for t in pg.locator(".lr-hist-row").all_inner_texts() if "Champions" in t])
    pg.locator("#tab-euro").click()
    for c in ["cl","el","ecl"]:
        pg.locator(f"#eu-{c}").click()
        de=pg.locator(".eu-list li", has=pg.locator(".eu-de")).locator(".eu-nm").all_inner_texts()
        print(c.upper(), "deutsche Teilnehmer neu:", de, "| gestartet:", pg.locator("#eu-start").count()==1)
    print("Fehler:", errs)
    b.close()

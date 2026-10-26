# Stärken bleiben nach der Saison; neue Stärken (±5) nur per Knopf
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
    pg = b.new_context(viewport={"width": 1300, "height": 900}).new_page()
    pg.goto(D + "index.html"); pg.wait_for_selector(".lr-tab")
    pg.get_by_role("button", name="Rest der Saison").click(); pg.wait_for_timeout(800)
    vor = state(pg)["active"]["bl1"]
    st0 = dict(zip(vor["teams"], vor["strengths"]))
    pg.get_by_role("button", name="Saison abschließen").click(); pg.wait_for_timeout(300)
    ok("unverändert" in pg.locator(".lr-modal").inner_text(), "Dialog nennt: Stärken bleiben")
    pg.locator(".lr-modal").get_by_role("button", name="Nur diese Liga abschließen").click(); pg.wait_for_timeout(900)
    nach = state(pg)["active"]["bl1"]
    ok(nach["label"] == "2027/28", f"neue Saison {nach['label']}")
    diffs = [nach["strengths"][i] - st0[n] for i, n in enumerate(nach["teams"])]
    ok(all(x == 0 for x in diffs), f"nach dem Saisonwechsel bleiben alle {len(diffs)} Stärken gleich")
    pg.locator("#newstr-open").click(); pg.wait_for_timeout(200)
    pg.locator("#newstr-go").click(); pg.wait_for_timeout(600)
    nach = state(pg)["active"]["bl1"]
    diffs = [nach["strengths"][i] - st0[n] for i, n in enumerate(nach["teams"])]
    ok(all(abs(x) <= 5 for x in diffs), f"Knopf: alle {len(diffs)} Teams innerhalb ±5: {sorted(diffs)}")
    ok(any(x != 0 for x in diffs) and any(x > 0 for x in diffs) and any(x < 0 for x in diffs), "Stärken steigen und sinken")
    ok(all(1 <= x <= 99 for x in nach["strengths"]), "Stärken zwischen 1 und 99")
    b.close()
print("Fehler:", errs)

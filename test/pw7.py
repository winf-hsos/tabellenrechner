import os
from playwright.sync_api import sync_playwright
import json
URL="file://"+os.path.dirname(os.path.abspath(__file__))+"/index.html"
for f in ["old-save.json","prev-save.json"]:
    raw=open(f,encoding="utf-8").read()
    with sync_playwright() as p:
        b=p.chromium.launch(); ctx=b.new_context(viewport={"width":1300,"height":900})
        ctx.add_init_script("try{ if(!localStorage.getItem('__seeded')){ localStorage.setItem('ligarechner:v2', %s); localStorage.setItem('__seeded','1'); } }catch(e){}" % json.dumps(raw))
        pg=ctx.new_page(); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_selector(".lr-tab"); pg.locator("#tab-euro").click(); pg.wait_for_selector(".eu-list")
        print(f, "→ CL-Teilnehmer:", pg.locator(".eu-list li").count(), "| DE:", pg.locator(".eu-de").count(), "| Fehler:", errs)
        b.close()

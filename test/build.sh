#!/usr/bin/env bash
# Baut ../dist/index.html (eigenständige Seite) aus ../Tabellenrechner.jsx
set -e
cd "$(dirname "$0")"
mkdir -p ../dist
cp ../Tabellenrechner.jsx new.jsx
./node_modules/.bin/esbuild entry.jsx --bundle --minify --loader:.jsx=jsx --format=iife --platform=browser --define:process.env.NODE_ENV='"production"' --outfile=app.js --log-level=warning
python3 - <<'PY'
js=open("app.js",encoding="utf-8").read().replace("</script","<\\/script")
head='''<title>Tabellenrechner</title>
<style>
:root { --bg: #15211B; --fg: #E9E5D8; color-scheme: dark; }
html, body { background: var(--bg); color: var(--fg); }
body { margin: 0; }
</style>
<div id="root"></div>
<script>
'''
# Variante für das Artefakt (ohne <html>-Gerüst)
open("../dist/tabellenrechner-artifact.html","w",encoding="utf-8").write(head+js+"\n</script>\n")
full='<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'+head.replace('<div id="root"></div>\n<script>\n','</head>\n<body>\n<div id="root"></div>\n<script>\n')+js+"\n</script>\n</body>\n</html>\n"
open("index.html","w",encoding="utf-8").write(full)
open("../dist/index.html","w",encoding="utf-8").write(full)
PY
echo "gebaut: dist/index.html, dist/tabellenrechner-artifact.html"

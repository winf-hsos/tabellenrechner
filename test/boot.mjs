import { JSDOM } from "jsdom"; import fs from "fs";
const html = fs.readFileSync("tabellenrechner.html","utf8");
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://example.org/" });
const errs=[]; dom.window.addEventListener("error", e=>errs.push(e.message));
await new Promise(r=>setTimeout(r,1500));
const tabs=[...dom.window.document.querySelectorAll(".lr-tab")].map(b=>b.textContent.trim());
console.log("Fehler:",errs.length?errs:"keine"); console.log("Reiter:",tabs.join(" | "));
console.log("Zeilen:",dom.window.document.querySelectorAll("tbody tr").length);
process.exit(0);

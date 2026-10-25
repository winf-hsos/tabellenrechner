p="Tabellenrechner.jsx"
s=open(p,encoding="utf-8").read()
def rep(old,new,cnt=1):
    global s
    assert s.count(old)==cnt, f"{s.count(old)}x: "+old[:70]
    s=s.replace(old,new)

rep('''      "SV Todesfelde", "Eintracht Norderstedt",
    ],
  },
];''','''      "SV Todesfelde", "Eintracht Norderstedt",
    ],
  },
  {
    id: "bl5",
    name: "5. Liga",
    accent: "#4FC3D0",
    range: [22, 12],
    teams: [
      "BFC Dynamo", "KSV Hessen Kassel", "Sportfreunde Siegen", "FC Bocholt",
      "BSG Chemie Leipzig", "FC 08 Homburg", "SV Atlas Delmenhorst", "Bremer SV",
      "FSV 63 Luckenwalde", "SpVgg Ansbach", "FC Memmingen", "TSV Buchbach",
      "Tasmania Berlin", "BFC Preussen", "FC Schöningen", "SSV Jeddeloh II",
    ],
  },
];''')
rep("/** Staffel jedes Vierte-Liga-Klubs,","/** Staffel jedes Klubs der 4. und 5. Liga,")
rep('''  "Eintracht Norderstedt": "Nord",
};''','''  "Eintracht Norderstedt": "Nord",
  "BFC Dynamo": "Nordost", "KSV Hessen Kassel": "Südwest", "Sportfreunde Siegen": "West",
  "FC Bocholt": "West", "BSG Chemie Leipzig": "Nordost", "FC 08 Homburg": "Südwest",
  "SV Atlas Delmenhorst": "Nord", "Bremer SV": "Nord", "FSV 63 Luckenwalde": "Nordost",
  "SpVgg Ansbach": "Bayern", "FC Memmingen": "Bayern", "TSV Buchbach": "Bayern",
  "Tasmania Berlin": "Nordost", "BFC Preussen": "Nordost", "FC Schöningen": "Nord",
  "SSV Jeddeloh II": "Nord",
};''')
rep("const REGIONAL_START = REGIONAL_CLUBS.filter((c) => LEAGUE_BY_ID.bl4.teams.indexOf(c.name) < 0);",
    "const REGIONAL_START = REGIONAL_CLUBS.filter(\n  (c) => LEAGUE_BY_ID.bl4.teams.indexOf(c.name) < 0 && LEAGUE_BY_ID.bl5.teams.indexOf(c.name) < 0);")
rep("/** Der Topf zu Beginn: ohne die Klubs, die schon in der 4. Liga spielen. */","/** Der Topf zu Beginn: ohne die Klubs, die schon in der 4. oder 5. Liga spielen. */")
rep('''  } else if (leagueId === "bl4") {
    if (pos <= 4) return "auf";''','''  } else if (leagueId === "bl4" || leagueId === "bl5") {
    if (pos <= 4) return "auf";''')
rep('if (leagueId === "bl4") return ["auf", "ab"];','if (leagueId === "bl4" || leagueId === "bl5") return ["auf", "ab"];')
rep("bl4: [7, 1] };","bl4: [7, 1], bl5: [7, 8] };")
rep('if (!s && id === "bl4") return;','if (!s && (id === "bl4" || id === "bl5")) return;')
a=s.index("  // Ältere Speicherstände kennen die 4. Liga noch nicht")
b=s.index("  // Wer in einer Liga spielt, gehört nicht in den Topf.")
new='''  // Ältere Speicherstände kennen die 4. und 5. Liga noch nicht: aus der Definition anlegen.
  // Steht ein Klub schon in einer anderen Liga (z. B. durch einen früheren Aufstieg), rückt der
  // stärkste freie Klub aus dem Regionalliga-Topf an seine Stelle.
  ["bl4", "bl5"].forEach((id) => {
    if (out.active[id]) return;
    const taken = new Set();
    LEAGUE_IDS.forEach((x) => { if (out.active[x]) out.active[x].teams.forEach((t) => taken.add(t)); });
    const l = LEAGUE_BY_ID[id];
    const reserviert = new Set();
    LEAGUES.forEach((x) => x.teams.forEach((t) => reserviert.add(t)));
    const strengths = defaultStrengths(id, l.teams.length);
    const frei = out.regional
      .filter((c) => !taken.has(c.name) && !reserviert.has(c.name))
      .sort((a, b) => b.strength - a.strength);
    const teams = [];
    const squads = [];
    l.teams.forEach((name, i) => {
      if (!taken.has(name)) {
        teams.push(name);
        squads.push(makeSquad(name, strengths[i]));
      } else if (frei.length) {
        const c = frei.shift();
        teams.push(c.name);
        squads.push(c.squad || makeSquad(c.name, Math.min(Number(c.strength) || strengths[i], strengths[i])));
      }
    });
    const ref = out.active.bl3 || out.active.bl2;
    const label = (ref && ref.label) || "2026/27";
    out.active[id] = newSeason(teams, strengths.slice(0, teams.length), label, defaultStart(id, label), squads);
  });
'''
s=s[:a]+new+s[b:]
rep('''  const b4 = active.bl4;
  amateurs.forEach((a) => {
    const k = b4 ? b4.teams.indexOf(a.name) : -1;
    field.push({
      name: a.name, strength: Number(a.strength) || 1, tier: 3,
      squad: (k >= 0 && b4.squads && b4.squads[k]) || a.squad || makeSquad(a.name, Number(a.strength) || 20),
    });
  });''','''  const unten = ["bl4", "bl5"].map((id) => active[id]).filter(Boolean);
  amateurs.forEach((a) => {
    let kader = null;
    unten.forEach((u) => {
      const k = u.teams.indexOf(a.name);
      if (k >= 0 && u.squads && u.squads[k]) kader = u.squads[k];
    });
    field.push({
      name: a.name, strength: Number(a.strength) || 1, tier: 3,
      squad: kader || a.squad || makeSquad(a.name, Number(a.strength) || 20),
    });
  });''')
rep("// Amateure aus der 4. Liga bringen","// Amateure aus der 4. und 5. Liga bringen")
rep('const history = [archive(d, "bl4"),','const history = [archive(d, "bl5"), archive(d, "bl4"),')
rep("      const bl4Teams = [...t.bl4.slice(4, 18), ...t.bl3.slice(16), ...newcomers];",
"""      const bl4Teams = [...t.bl4.slice(4, 18), ...t.bl3.slice(16), ...t.bl5.slice(0, 4)];
      const bl5Teams = [...t.bl5.slice(4, 12), ...t.bl4.slice(18), ...newcomers];""")
rep("const runter = t.bl4.slice(18).map((n) => ({","const runter = t.bl5.slice(12).map((n) => ({")
rep("""          bl4: newSeason(bl4Teams, st(bl4Teams), nextLabel(d.active.bl4.label), shiftYear(d.active.bl4.start, 1), sq(bl4Teams)),
""","""          bl4: newSeason(bl4Teams, st(bl4Teams), nextLabel(d.active.bl4.label), shiftYear(d.active.bl4.start, 1), sq(bl4Teams)),
          bl5: newSeason(bl5Teams, st(bl5Teams), nextLabel(d.active.bl5.label), shiftYear(d.active.bl5.start, 1), sq(bl5Teams)),
""")
rep("Vier Ligen, DFB-Pokal,","Fünf Ligen, DFB-Pokal,")
rep("alle vier Ligen stehen wieder","alle fünf Ligen stehen wieder")
rep('} else if (league.id === "bl4") {\n    upDown.push(["Aufsteiger", rows.slice(0, 4)]);','} else if (league.id === "bl4" || league.id === "bl5") {\n    upDown.push(["Aufsteiger", rows.slice(0, 4)]);')
rep("""        Die vier Abschlusstabellen wandern in die Historie, danach werden die Ligen neu
        besetzt. Stärkewerte nehmen die Mannschaften mit in ihre neue Liga. Die ersten vier der
        4. Liga steigen in die 3. Liga auf, die letzten vier der 3. Liga steigen ab.""","""        Die fünf Abschlusstabellen wandern in die Historie, danach werden die Ligen neu
        besetzt. Stärkewerte nehmen die Mannschaften mit in ihre neue Liga. In der 3., 4. und
        5. Liga steigen jeweils die ersten vier auf und die letzten vier ab.""")
rep("{tables.bl4.slice(18).join(\", \")}","{tables.bl5.slice(12).join(\", \")}")
rep("""        Das sind die Vereine unterhalb der 4. Liga. Nach jeder Saison rücken vier von ihnen in
        die 4. Liga nach, und für den DFB-Pokal werden Landespokalsieger gezogen. Wer aus der
        4. Liga absteigt, landet automatisch wieder hier""","""        Das sind die Vereine unterhalb der 5. Liga. Nach jeder Saison rücken vier von ihnen in
        die 5. Liga nach, und für den DFB-Pokal werden Landespokalsieger gezogen. Wer aus der
        5. Liga absteigt, landet automatisch wieder hier""")
rep("regional={data.regional} bl4={data.active.bl4} />","regional={data.regional} unten={[data.active.bl4, data.active.bl5]} />")
rep("function CupStartModal({ onClose, onStart, regional, bl4 }) {\n  // Kandidaten für die Landespokalsieger: die 4. Liga und der Regionalliga-Topf.\n  const vierte = bl4\n    ? bl4.teams.map(","function CupStartModal({ onClose, onStart, regional, unten }) {\n  // Kandidaten für die Landespokalsieger: 4. Liga, 5. Liga und Regionalliga-Topf.\n  const vierte = (unten || []).filter(Boolean).flatMap((bl4) => bl4.teams.map(")
rep("strength: Number(bl4.strengths[i]) || 22 }))\n    : [];","strength: Number(bl4.strengths[i]) || 22 })));")
rep("gezogen aus der 4. Liga und dem Regionalliga-Topf —","gezogen aus der 4. Liga, der 5. Liga und dem Regionalliga-Topf —")
rep("<span>Acht Vereine aus der 4. Liga und den Regionalligen</span>","<span>Acht Vereine aus 4. Liga, 5. Liga und Regionalligen</span>")
s=s.replace("BL4_STAFFEL","LOWER_STAFFEL")
open(p,"w",encoding="utf-8").write(s)
print("ok")

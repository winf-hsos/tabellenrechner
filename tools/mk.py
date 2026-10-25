import json, collections
d = {
 "BFC Dynamo": {
  "TW": ["Kevin Sommer", "Paul Hainke"],
  "ABW": ["Tobias Gunte", "Viktor Miftaraj", "Valdemar Sadrifar", "Larry Oellers", "John Liebelt", "Ali Ceesay"],
  "MF": ["Joey Breitfeld", "Levin Mattmüller", "Diren-Mehmet Günay", "Tim Windsheimer", "Justin Seven", "Sven Ho"],
  "ST": ["Rufat Dadashov", "Ludwig Bölke", "Leander Fritzsche", "Jamal Rogero"]},
 "BFC Preussen": {
  "TW": ["Florian Palmowski", "Karl Albers"],
  "ABW": ["Nino Lessel", "Ben Meyer", "Ede Gramberg", "Oliver Maric", "Charmaine Häusl", "Leo Sommerfeld"],
  "MF": ["Lucas Vierling", "Luis Inderwisch", "Philip Fontein", "Maurice Čović", "Jasin Abou-Chaker", "Melvin Berkemer"],
  "ST": ["Joscha Wosz", "Oluwaseunnla Adekunle", "Nikolas Frank", "Luca Butkovic"]},
 "Tasmania Berlin": {
  "TW": ["Elias Höftmann", "Mateusz Mika"],
  "ABW": ["Jamilu Collins", "Fatih Baca", "Youssef Labbouz", "Felix Rehder", "Steffen Eder", "Deji Beyreuther"],
  "MF": ["Shean Mensah", "Luka Janeš", "Rintaro Yajima", "Kerem Yayla", "Danil Wostrikow", "Tahsin Çakmak"],
  "ST": ["Erich Berko", "Pedro Vitor Cruz Magalhães", "Abdulkadir Beyazit", "Amar Numić"]},
 "FSV 63 Luckenwalde": {
  "TW": ["Jasper Kühn", "Kevin Tittel"],
  "ABW": ["Quentin Seidel", "Jonas Kühn", "Sofiene Jannene", "Len Neumann", "Clemens Koplin", "Simo Collins"],
  "MF": ["Fabio Schneider", "Niklas Kaus", "Till Jacobi", "Julian Mätzke", "Max Hathaway", "Andreas Pollasch"],
  "ST": ["Felix Pilger", "Lucas Will", "Claas Zamzow", "Phil Butendeich"]},
}
allp = collections.Counter()
for v,k in d.items():
    assert [len(k[p]) for p in ("TW","ABW","MF","ST")]==[2,6,6,4], v
    for p in k.values():
        allp.update(p)
print([n for n,c in allp.items() if c>1], sum(allp.values()))
json.dump(d, open("kader5_A.json","w"), ensure_ascii=False, indent=2)
print(json.load(open("kader5_A.json", encoding="utf-8"))["BFC Dynamo"]["MF"])

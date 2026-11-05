/* ============================================================
   MOTOGP PIXEL MANAGER — season data
   Fan-made, non-commercial. 2025 rider grid.
   ============================================================ */

const TEAMS = [
  {
    id: "ducati", name: "Ducati Lenovo Team", short: "DUCATI", model: "Desmosedici GP25",
    color: "#e2231a", accent: "#ffd43b", ink: "#ffffff",
    power: 97, handling: 91, braking: 96, reliability: 94,
    blurb: "The benchmark. Brutal top speed, sweet handling."
  },
  {
    id: "aprilia", name: "Aprilia Racing", short: "APRILIA", model: "RS-GP25",
    color: "#1b1b22", accent: "#ff3b3b", ink: "#ffffff",
    power: 94, handling: 92, braking: 92, reliability: 88,
    blurb: "Aero clever, corner-fast and absolutely fearless."
  },
  {
    id: "ktm", name: "Red Bull KTM Factory Racing", short: "KTM", model: "RC16",
    color: "#ff6a00", accent: "#2050ff", ink: "#ffffff",
    power: 93, handling: 90, braking: 91, reliability: 86,
    blurb: "Loud, punchy and always up for a last-lap scrap."
  },
  {
    id: "yamaha", name: "Monster Energy Yamaha", short: "YAMAHA", model: "YZR-M1",
    color: "#2058ff", accent: "#f0f0f0", ink: "#ffffff",
    power: 89, handling: 94, braking: 90, reliability: 92,
    blurb: "The cornering scalpel. Needs a brave right wrist."
  },
  {
    id: "honda", name: "Honda HRC Castrol", short: "HONDA", model: "RC213V",
    color: "#e11a2c", accent: "#2450ff", ink: "#ffffff",
    power: 87, handling: 90, braking: 88, reliability: 93,
    blurb: "A proud factory hunting its way back to the front."
  },
  {
    id: "gresini", name: "Gresini Racing", short: "GRESINI", model: "Desmosedici GP24",
    color: "#54c7f2", accent: "#ffffff", ink: "#101018",
    power: 93, handling: 90, braking: 94, reliability: 92,
    blurb: "Family-run, factory-fast. The paddock's coolest garage."
  },
  {
    id: "vr46", name: "Pertamina Enduro VR46", short: "VR46", model: "Desmosedici GP24",
    color: "#ffd400", accent: "#16161c", ink: "#16161c",
    power: 92, handling: 90, braking: 93, reliability: 92,
    blurb: "Yellow flashes, academy grit and serious speed."
  },
  {
    id: "pramac", name: "Prima Pramac Yamaha", short: "PRAMAC", model: "YZR-M1",
    color: "#e8e8ee", accent: "#8d5cff", ink: "#16161c",
    power: 90, handling: 93, braking: 89, reliability: 92,
    blurb: "A fresh Yamaha chapter with two experienced hammers."
  },
  {
    id: "trackhouse", name: "Trackhouse Aprilia", short: "TRACKHOUSE", model: "RS-GP25",
    color: "#1d2b5a", accent: "#ff7a1a", ink: "#ffffff",
    power: 92, handling: 91, braking: 91, reliability: 87,
    blurb: "Stars, stripes and a rookie with ice in his veins."
  },
  {
    id: "lcr", name: "LCR Honda", short: "LCR", model: "RC213V",
    color: "#0c46c8", accent: "#58d68d", ink: "#ffffff",
    power: 87, handling: 89, braking: 88, reliability: 92,
    blurb: "The independent Honda squad that never stops fighting."
  },
  {
    id: "tech3", name: "Red Bull KTM Tech3", short: "TECH3", model: "RC16",
    color: "#ff7a00", accent: "#f2f2f2", ink: "#ffffff",
    power: 92, handling: 89, braking: 90, reliability: 86,
    blurb: "Factory hardware, pirate spirit. Expect fireworks."
  }
];

const RIDERS = [
  // Ducati Lenovo
  { id: "bagnaia", teamId: "ducati", name: "Francesco Bagnaia", short: "BAGNAIA", num: 63, country: "ITA", pace: 94, racecraft: 93, braking: 93, consistency: 90, wet: 89, style: "SMOOTH" },
  { id: "marquez", teamId: "ducati", name: "Marc Marquez", short: "M. MARQUEZ", num: 93, country: "ESP", pace: 96, racecraft: 96, braking: 95, consistency: 86, wet: 93, style: "AGGRESSIVE" },
  // Aprilia
  { id: "martin", teamId: "aprilia", name: "Jorge Martin", short: "MARTIN", num: 89, country: "ESP", pace: 94, racecraft: 91, braking: 94, consistency: 84, wet: 88, style: "EXPLOSIVE" },
  { id: "bezzecchi", teamId: "aprilia", name: "Marco Bezzecchi", short: "BEZZECCHI", num: 72, country: "ITA", pace: 89, racecraft: 87, braking: 90, consistency: 82, wet: 84, style: "AGGRESSIVE" },
  // KTM
  { id: "acosta", teamId: "ktm", name: "Pedro Acosta", short: "ACOSTA", num: 37, country: "ESP", pace: 92, racecraft: 90, braking: 92, consistency: 83, wet: 82, style: "FEARLESS" },
  { id: "binder", teamId: "ktm", name: "Brad Binder", short: "BINDER", num: 33, country: "RSA", pace: 89, racecraft: 89, braking: 89, consistency: 87, wet: 86, style: "AGGRESSIVE" },
  // Yamaha
  { id: "quartararo", teamId: "yamaha", name: "Fabio Quartararo", short: "QUARTARARO", num: 20, country: "FRA", pace: 92, racecraft: 88, braking: 91, consistency: 85, wet: 87, style: "SMOOTH" },
  { id: "rins", teamId: "yamaha", name: "Alex Rins", short: "RINS", num: 42, country: "ESP", pace: 88, racecraft: 86, braking: 88, consistency: 83, wet: 89, style: "SMOOTH" },
  // Honda
  { id: "mir", teamId: "honda", name: "Joan Mir", short: "MIR", num: 36, country: "ESP", pace: 87, racecraft: 87, braking: 87, consistency: 86, wet: 84, style: "FIGHTER" },
  { id: "marini", teamId: "honda", name: "Luca Marini", short: "MARINI", num: 10, country: "ITA", pace: 85, racecraft: 84, braking: 85, consistency: 85, wet: 83, style: "SMOOTH" },
  // Gresini
  { id: "alexmarquez", teamId: "gresini", name: "Alex Marquez", short: "A. MARQUEZ", num: 73, country: "ESP", pace: 89, racecraft: 87, braking: 91, consistency: 81, wet: 84, style: "EXPLOSIVE" },
  { id: "aldeguer", teamId: "gresini", name: "Fermin Aldeguer", short: "ALDEGUER", num: 54, country: "ESP", pace: 86, racecraft: 84, braking: 88, consistency: 78, wet: 78, style: "FEARLESS" },
  // VR46
  { id: "digiannantonio", teamId: "vr46", name: "Fabio Di Giannantonio", short: "DI GIANNANTONIO", num: 49, country: "ITA", pace: 88, racecraft: 86, braking: 88, consistency: 82, wet: 83, style: "SMOOTH" },
  { id: "morbidelli", teamId: "vr46", name: "Franco Morbidelli", short: "MORBIDELLI", num: 21, country: "ITA", pace: 86, racecraft: 85, braking: 86, consistency: 84, wet: 84, style: "SMOOTH" },
  // Pramac
  { id: "miller", teamId: "pramac", name: "Jack Miller", short: "MILLER", num: 43, country: "AUS", pace: 87, racecraft: 87, braking: 89, consistency: 79, wet: 81, style: "AGGRESSIVE" },
  { id: "oliveira", teamId: "pramac", name: "Miguel Oliveira", short: "OLIVEIRA", num: 88, country: "POR", pace: 88, racecraft: 85, braking: 86, consistency: 84, wet: 88, style: "SMOOTH" },
  // Trackhouse
  { id: "rafernandez", teamId: "trackhouse", name: "Raul Fernandez", short: "R. FERNANDEZ", num: 25, country: "ESP", pace: 88, racecraft: 84, braking: 90, consistency: 80, wet: 80, style: "EXPLOSIVE" },
  { id: "ogura", teamId: "trackhouse", name: "Ai Ogura", short: "OGURA", num: 79, country: "JPN", pace: 86, racecraft: 86, braking: 85, consistency: 85, wet: 82, style: "CALCULATED" },
  // LCR
  { id: "zarco", teamId: "lcr", name: "Johann Zarco", short: "ZARCO", num: 5, country: "FRA", pace: 88, racecraft: 88, braking: 89, consistency: 86, wet: 84, style: "CALCULATED" },
  { id: "chantra", teamId: "lcr", name: "Somkiat Chantra", short: "CHANTRA", num: 35, country: "THA", pace: 82, racecraft: 79, braking: 81, consistency: 80, wet: 76, style: "SMOOTH" },
  // Tech3
  { id: "bastianini", teamId: "tech3", name: "Enea Bastianini", short: "BASTIANINI", num: 23, country: "ITA", pace: 91, racecraft: 89, braking: 92, consistency: 82, wet: 84, style: "LATE BRAKER" },
  { id: "vinales", teamId: "tech3", name: "Maverick Vinales", short: "VINALES", num: 12, country: "ESP", pace: 89, racecraft: 84, braking: 88, consistency: 79, wet: 82, style: "EXPLOSIVE" }
];

/* Closed SVG paths, viewBox 0 0 100 100. Drawn as pixel circuits. */
const CIRCUITS = [
  {
    id: "qatar", name: "QATAR GRAND PRIX", circuit: "Lusail International Circuit", country: "QATAR", code: "QAT",
    length: "5.42 km", turns: 16, baseLap: 94.2, abrasion: 0.92, rain: 0.02, night: true,
    note: "Long straight, night race, wind-blown sand.",
    path: "M 18 67 C 8 58 8 39 20 30 C 33 21 52 20 68 24 C 82 27 92 35 92 46 C 92 57 82 65 71 67 C 61 69 55 63 48 60 C 40 56 32 58 30 68 C 28 78 18 76 18 67 Z"
  },
  {
    id: "portugal", name: "PORTUGUESE GRAND PRIX", circuit: "Autodromo do Algarve", country: "PORTUGAL", code: "POR",
    length: "4.59 km", turns: 15, baseLap: 97.9, abrasion: 0.96, rain: 0.16, night: false,
    note: "Rollercoaster hills. Patience on the crests.",
    path: "M 14 64 C 8 51 14 37 26 33 C 37 29 46 37 55 38 C 67 40 72 27 84 31 C 94 35 92 50 83 58 C 74 66 62 65 53 72 C 44 79 31 82 24 74 C 18 68 20 59 14 64 Z"
  },
  {
    id: "spain", name: "SPANISH GRAND PRIX", circuit: "Circuito de Jerez", country: "SPAIN", code: "ESP",
    length: "4.42 km", turns: 13, baseLap: 96.6, abrasion: 0.91, rain: 0.08, night: false,
    note: "Stop-and-go corners and a huge final hairpin.",
    path: "M 16 62 C 10 48 17 35 30 31 C 43 27 55 35 65 30 C 77 24 89 32 89 45 C 89 59 76 63 67 69 C 58 75 50 68 42 73 C 34 78 22 76 16 62 Z"
  },
  {
    id: "france", name: "FRENCH GRAND PRIX", circuit: "Le Mans Bugatti", country: "FRANCE", code: "FRA",
    length: "4.19 km", turns: 14, baseLap: 91.7, abrasion: 0.94, rain: 0.34, night: false,
    note: "Changeable weather. The first chicane decides everything.",
    path: "M 14 54 C 12 40 23 31 36 34 C 48 37 53 48 63 45 C 72 42 76 30 86 32 C 95 34 95 48 88 58 C 81 68 67 67 57 73 C 46 80 32 79 24 71 C 18 65 18 59 14 54 Z"
  },
  {
    id: "italy", name: "ITALIAN GRAND PRIX", circuit: "Autodromo del Mugello", country: "ITALY", code: "ITA",
    length: "5.25 km", turns: 15, baseLap: 106.1, abrasion: 0.98, rain: 0.10, night: false,
    note: "Throttle pinned through the Tuscan hills.",
    path: "M 18 72 C 9 61 13 45 24 38 C 35 31 53 34 66 29 C 78 25 91 31 91 46 C 91 62 78 67 66 64 C 56 62 51 52 42 57 C 32 62 38 77 28 79 C 23 80 21 76 18 72 Z"
  },
  {
    id: "catalunya", name: "CATALAN GRAND PRIX", circuit: "Circuit de Barcelona-Catalunya", country: "SPAIN", code: "ESP",
    length: "4.66 km", turns: 14, baseLap: 99.4, abrasion: 0.95, rain: 0.07, night: false,
    note: "Long right-handers punish the left shoulder of the tyre.",
    path: "M 13 60 C 10 45 20 34 33 34 C 44 34 49 43 57 44 C 66 45 70 33 81 33 C 92 33 93 48 86 57 C 78 67 66 63 56 69 C 46 75 39 70 32 78 C 25 85 15 75 13 60 Z"
  },
  {
    id: "netherlands", name: "DUTCH TT", circuit: "TT Circuit Assen", country: "NETHERLANDS", code: "NED",
    length: "4.54 km", turns: 18, baseLap: 96.1, abrasion: 0.90, rain: 0.24, night: false,
    note: "The Cathedral. Rhythm is worth more than horsepower.",
    path: "M 16 58 C 12 43 22 32 35 33 C 44 34 47 43 56 44 C 67 46 69 59 80 58 C 91 57 93 44 88 34 C 84 26 90 25 91 38 C 92 53 86 62 77 69 C 68 76 58 71 49 75 C 39 79 32 86 23 78 C 17 73 19 67 16 58 Z"
  },
  {
    id: "germany", name: "GERMAN GRAND PRIX", circuit: "Sachsenring", country: "GERMANY", code: "GER",
    length: "3.67 km", turns: 13, baseLap: 83.8, abrasion: 0.86, rain: 0.20, night: false,
    note: "Short, tight and relentless. Left, left, left.",
    path: "M 18 70 C 11 59 15 46 27 40 C 38 34 49 40 56 35 C 65 29 76 31 82 39 C 88 47 82 56 73 61 C 64 66 55 63 47 69 C 39 75 29 81 23 77 C 19 75 20 72 18 70 Z"
  },
  {
    id: "austria", name: "AUSTRIAN GRAND PRIX", circuit: "Red Bull Ring", country: "AUSTRIA", code: "AUT",
    length: "4.32 km", turns: 10, baseLap: 88.3, abrasion: 0.97, rain: 0.14, night: false,
    note: "Three drag races and three brutal braking zones.",
    path: "M 17 70 C 10 58 15 42 28 36 C 41 30 56 32 68 34 C 80 36 91 43 91 55 C 91 68 79 72 68 69 C 59 67 58 60 49 61 C 39 62 35 76 27 78 C 22 79 20 74 17 70 Z"
  },
  {
    id: "sanmarino", name: "SAN MARINO GRAND PRIX", circuit: "Misano World Circuit", country: "ITALY", code: "RSM",
    length: "4.23 km", turns: 16, baseLap: 94.0, abrasion: 0.93, rain: 0.09, night: false,
    note: "Stop-start, kerb-hopping and a passionate crowd.",
    path: "M 14 62 C 9 49 17 37 29 33 C 41 29 49 37 58 36 C 69 35 72 26 83 30 C 94 34 93 49 85 57 C 77 65 66 63 58 68 C 49 74 42 80 33 77 C 24 74 18 70 14 62 Z"
  },
  {
    id: "japan", name: "JAPANESE GRAND PRIX", circuit: "Mobility Resort Motegi", country: "JAPAN", code: "JPN",
    length: "4.80 km", turns: 14, baseLap: 101.3, abrasion: 0.95, rain: 0.22, night: false,
    note: "Point-and-shoot. Hard braking, hard acceleration.",
    path: "M 16 68 C 9 56 14 43 25 37 C 36 31 45 38 54 41 C 64 44 73 37 82 39 C 91 41 94 52 88 60 C 82 68 71 68 62 72 C 52 76 43 82 34 78 C 25 74 20 74 16 68 Z"
  },
  {
    id: "australia", name: "AUSTRALIAN GRAND PRIX", circuit: "Phillip Island", country: "AUSTRALIA", code: "AUS",
    length: "4.45 km", turns: 12, baseLap: 88.9, abrasion: 0.89, rain: 0.30, night: false,
    note: "The island. Wild wind, wilder slipstreams.",
    path: "M 12 62 C 10 46 21 34 35 36 C 47 38 49 49 61 49 C 74 49 80 38 89 40 C 97 42 96 55 88 63 C 80 71 68 67 58 69 C 47 71 43 83 33 81 C 23 79 14 74 12 62 Z"
  },
  {
    id: "malaysia", name: "MALAYSIAN GRAND PRIX", circuit: "Sepang International Circuit", country: "MALAYSIA", code: "MAS",
    length: "5.54 km", turns: 15, baseLap: 111.2, abrasion: 0.99, rain: 0.44, night: false,
    note: "Two long straights, tropical heat, sudden storms.",
    path: "M 15 62 C 10 48 18 37 30 34 C 41 31 48 40 57 37 C 66 34 69 25 80 28 C 91 31 94 45 87 55 C 80 65 69 63 60 69 C 51 75 47 84 37 81 C 27 78 18 74 15 62 Z"
  },
  {
    id: "valencia", name: "VALENCIA GRAND PRIX", circuit: "Circuit Ricardo Tormo", country: "SPAIN", code: "ESP",
    length: "4.01 km", turns: 14, baseLap: 88.6, abrasion: 0.92, rain: 0.12, night: false,
    note: "A stadium bowl. The title is settled under the lights.",
    path: "M 18 67 C 11 56 13 43 24 38 C 34 33 43 39 50 46 C 57 53 66 59 74 53 C 82 47 79 34 87 32 C 95 30 93 44 91 55 C 89 66 78 71 67 73 C 56 75 54 70 44 73 C 34 76 24 77 18 67 Z"
  }
];

const TYRES = {
  soft:   { id: "soft",   name: "SOFT",   code: "S", pace: 1.020, wear: 7.2, color: "#ff4d4d", desc: "Maximum grip. Short life." },
  medium: { id: "medium", name: "MEDIUM", code: "M", pace: 1.000, wear: 5.2, color: "#ffd23f", desc: "The safe all-round choice." },
  hard:   { id: "hard",   name: "HARD",   code: "H", pace: 0.987, wear: 3.7, color: "#e8e8e8", desc: "Slower warm-up, long life." },
  wet:    { id: "wet",    name: "WET",    code: "W", pace: 0.945, wear: 2.6, color: "#3c8dff", desc: "Full rain rubber. Find the limit." }
};

const SETUPS = {
  balanced:  { id: "balanced",  name: "BALANCED",  icon: "=", pace: 0.000, grip: 0.000, wear: 1.00, note: "No weaknesses. No excuses." },
  topspeed:  { id: "topspeed",  name: "TOP SPEED", icon: ">", pace: 0.015, grip: -0.008, wear: 1.03, note: "Trade corner exit for straight-line punch." },
  cornering: { id: "cornering", name: "CORNERING", icon: "C", pace: -0.006, grip: 0.013, wear: 0.95, note: "Carry more speed through the twisties." },
  stable:    { id: "stable",    name: "STABLE",   icon: "S", pace: -0.008, grip: 0.004, wear: 0.90, note: "Save the tyre. Avoid the mistakes." }
};

const PACES = [
  { id: "save",   name: "SAVE",   speed: 0.968, wear: 0.55, fuel: 0.65, color: "#58d68d" },
  { id: "normal", name: "STEADY", speed: 1.000, wear: 1.00, fuel: 1.00, color: "#7cd7ff" },
  { id: "push",   name: "PUSH",   speed: 1.022, wear: 1.55, fuel: 1.35, color: "#ffd23f" },
  { id: "attack", name: "ATTACK", speed: 1.043, wear: 2.30, fuel: 1.75, color: "#ff5a4e" }
];

const POINTS = [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

const NEWS = [
  "Paddock whisper: the new aero package is worth two tenths in Sector 2.",
  "Crew chief says tyre life, not outright pace, will decide this championship.",
  "Rookie watch: the young guns are braking later every single session.",
  "Weather radar is tracking a storm front moving toward the circuit.",
  "The title fight is tightening. Every point is starting to feel heavy.",
  "Engineers found a setup breakthrough on the dyno overnight."
];

const COUNTRIES = {
  ITA: "ITALY", ESP: "SPAIN", FRA: "FRANCE", RSA: "SOUTH AFRICA", POR: "PORTUGAL",
  AUS: "AUSTRALIA", JPN: "JAPAN", THA: "THAILAND"
};

const OPPONENT_NAMES = ["A. RIVAL", "THE YOUNG GUN", "THE VETERAN", "MR CONSISTENT", "THE WILDCARD"];

/* utility lookups */
const teamById = (id) => TEAMS.find(t => t.id === id);
const riderById = (id) => RIDERS.find(r => r.id === id);
const circuitByIndex = (i) => CIRCUITS[i % CIRCUITS.length];

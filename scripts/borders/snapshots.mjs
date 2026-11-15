// Border snapshots, built by scripts/build-borders.mjs.
//
// A feature lists its polygons. A polygon is a ring of pieces: [lng, lat]
// points, names of shared arcs from arcs.mjs ("-name" reverses one), and
// { coast: [from, to] } for a stretch of the base map's coastline. A polygon
// can also be { island: [lng, lat] }: the whole island containing that point.
// See docs/data/BORDERS.md for the method, the choices made for each
// snapshot and the sources.

// ---------------------------------------------------------------- sources

const CLIOPATRIA = {
  title:
    "Cliopatria v0.2.1, Seshat Global History Databank (CC BY 4.0; simplified and redrawn)",
  url: "https://github.com/Seshat-Global-History-Databank/cliopatria",
};
const SHEPHERD_ITALY = {
  title: 'W. R. Shepherd, Historical Atlas (1923): "The Growth of Roman Power in Italy"',
  url: "https://commons.wikimedia.org/wiki/File:Rome_power_italy_500_100.jpg",
};
const SHEPHERD_COLONIES = {
  title:
    'W. R. Shepherd, Historical Atlas (1911): "Greek and Phoenician Settlements in the Mediterranean Basin, about 550 B.C."',
  url: "https://commons.wikimedia.org/wiki/File:Shepherd-c-012.jpg",
};
const SHEPHERD_ROMAN = {
  title:
    'W. R. Shepherd, Historical Atlas (1923): "Roman territory from the beginning of the 1st Punic War (264 B.C.)"',
  url: "https://commons.wikimedia.org/wiki/File:Roman_expansion_264_BC_Shepherd.jpg",
};
const SHEPHERD_DIADOCHI = {
  title: 'W. R. Shepherd, Historical Atlas (1923): "Kingdoms of the Diadochi, 301 and 200 B.C."',
  url: "https://commons.wikimedia.org/wiki/File:Diadochi_kingdoms_301_200.jpg",
};

// ------------------------------------------------------- reusable shapes

const island = (lng, lat) => ({ island: [lng, lat] });

const ISLANDS = {
  sicily: island(14.0, 37.5),
  sardinia: island(9.0, 40.0),
  corsica: island(9.1, 42.1),
  crete: island(24.9, 35.25),
  cyprus: island(33.2, 35.0),
  euboea: island(23.8, 38.55),
  rhodes: island(28.0, 36.2),
  corcyra: island(19.85, 39.6),
  lesbos: island(26.5, 39.15),
  chios: island(26.0, 38.4),
  mallorca: island(2.95, 39.6),
  menorca: island(4.1, 39.95),
  ibiza: island(1.4, 38.98),
  formentera: island(1.45, 38.7),
  malta: island(14.43, 35.9),
  gozo: island(14.25, 36.04),
};

const CYCLADES = [
  island(25.45, 37.05), // Naxos
  island(25.15, 37.05), // Paros
  island(24.85, 37.85), // Andros
  island(25.15, 37.6), // Tinos
  island(25.35, 37.45), // Mykonos
  island(24.42, 36.7), // Melos
  island(25.43, 36.42), // Thera
  island(24.33, 37.62), // Keos
  island(24.92, 37.43), // Syros
  island(24.7, 36.97), // Siphnos
  island(25.9, 36.87), // Amorgos
  island(25.32, 36.73), // Ios
];

/** Greek colonies on the western shore of the Black Sea, Istros to Apollonia. */
const BLACK_SEA_WEST = [
  [29.0, 44.65],
  [28.5, 44.6],
  [28.35, 44.2],
  [28.3, 43.8],
  [27.75, 43.2],
  [27.55, 42.75],
  [27.45, 42.4],
  [27.75, 42.25],
  [28.1, 42.3],
  [28.3, 43.2],
  [28.95, 43.8],
];
const OLBIA = [
  [31.55, 46.55],
  [31.6, 46.85],
  [31.95, 46.95],
  [32.05, 46.65],
  [31.8, 46.4],
];
const CHERSONESOS = [
  [33.3, 44.4],
  [33.3, 44.7],
  [33.65, 44.7],
  [33.75, 44.45],
  [33.5, 44.35],
];
const HERACLEA_PONTICA = [
  [31.0, 41.35],
  [31.2, 41.05],
  [31.75, 41.1],
  [31.85, 41.45],
  [31.3, 41.55],
];
const BYZANTIUM = [
  [28.3, 40.95],
  [28.4, 41.25],
  [28.75, 41.45],
  [29.0, 41.45],
  { coast: [[29.07, 41.24], [28.98, 41.01]] },
  [28.9, 40.85],
];
const SINOPE = ["sinope", [35.2, 42.4]];
const MASSALIA = ["massalia", [7.25, 43.4], [5.5, 42.95]];
const EMPORION = [
  [2.95, 42.0],
  [3.0, 42.25],
  [3.4, 42.25],
  [3.35, 41.95],
];

/** Greece south of Thessaly, with the Ionian islands; Euboea not included. */
const GREECE_SOUTH_WEST = [
  "ambracian",
  "othrys",
  { coast: [[22.622, 38.914], [24.02, 37.65]] },
  [23.9, 37.45],
  [23.65, 37.25],
  [23.35, 36.95],
  [23.3, 36.35],
  [22.9, 36.05],
  [22.3, 36.3],
  [21.6, 36.6],
  [20.5, 37.55],
  [20.25, 38.1],
  [20.4, 38.7],
];

/** Roman Italy south of the Arno and the Rubicon (264 BCE), split in three. */
const AGER_ROMANUS = [
  "ager-romanus-north",
  [13.9, 43.75],
  [14.2, 43.2],
  "ager-romanus-south",
  [12.6, 41.0],
  [11.8, 41.6],
];
const ALLIES_SOUTH = [
  "ager-romanus-south",
  [14.6, 40.2],
  [15.4, 39.6],
  [15.6, 38.9],
  "messina-strait",
  [16.0, 37.7],
  [17.0, 38.6],
  [17.5, 39.1],
  [18.2, 39.6],
  [18.9, 40.2],
  [18.3, 40.9],
  [16.8, 41.6],
  [16.6, 42.0],
  [15.0, 42.4],
];
const ALLIES_NORTH_264 = [
  "apuan",
  "apennine-pistoia",
  "rubicon-line",
  "-ager-romanus-north",
  [10.9, 42.1],
  [9.95, 42.6],
  [10.0, 43.3],
];

/** Transalpine Gaul from the Pyrenees to the Rhine (264 and 146 BCE). */
const GAUL = [
  "-pyrenees-east",
  "-pyrenees-west",
  [-2.0, 44.5],
  [-2.6, 46.4],
  [-4.9, 47.6],
  [-5.4, 48.6],
  [-2.0, 50.0],
  [0.0, 50.2],
  [1.5, 51.05],
  [3.5, 52.3],
  [4.1, 52.0],
  [5.0, 51.9],
  [6.2, 51.85],
  [6.8, 51.2],
  [7.1, 50.75],
  [7.6, 50.35],
  [8.25, 50.0],
  [8.45, 49.5],
  [8.2, 49.0],
  [7.8, 48.6],
  [7.6, 47.56],
  [8.6, 47.65],
  [9.5, 47.55],
  [9.3, 47.1],
  [8.4, 46.6],
  [7.6, 46.3],
  [6.95, 45.8],
  [6.9, 44.9],
  [7.0, 44.3],
  [7.15, 44.1],
  [7.2, 43.9],
  "-massalia",
  [4.5, 43.2],
  [3.8, 43.2],
];

/** Coastal Syrtis from Tacapae to the Philaeni, seaward side, east to west. */
const SYRTIS_SEA = [
  [18.0, 31.0],
  [16.5, 31.4],
  [16.0, 31.9],
  [15.5, 32.6],
  [14.3, 32.85],
  [13.2, 33.1],
  [12.0, 33.15],
  [11.3, 33.6],
];

/** Egypt's sea coast from Catabathmus to Gaza, west to east. */
const EGYPT_SEA = [
  [25.2, 31.8],
  [27.0, 31.6],
  [29.5, 31.3],
  [30.3, 31.65],
  [31.2, 31.85],
  [32.3, 31.5],
  [33.5, 31.4],
  [34.2, 31.45],
];

/** Persian Gulf, sea side, from the Shatt al-Arab to the Gulf of Oman. */
const PERSIAN_GULF = [
  [49.8, 29.0],
  [51.5, 27.5],
  [53.5, 26.3],
  [55.5, 26.2],
  [56.3, 26.65],
  [56.9, 26.2],
  [57.6, 25.4],
];

/** Iran and Central Asia to Bactria (Seleucid in 264 BCE, after Cliopatria). */
const IRAN_EAST = [
  [57.77, 26.0],
  [58.4, 26.84],
  [58.98, 27.22],
  [60.24, 28.25],
  [61.03, 29.47],
  [62.73, 31.46],
  [63.3, 32.11],
  [64.69, 32.94],
  [65.39, 34.1],
  [66.35, 34.29],
  [68.1, 34.87],
  [69.03, 35.19],
  [70.09, 35.45],
  [72.42, 37.51],
  [71.2, 38.48],
  [69.57, 38.8],
  [69.33, 39.9],
  [70.74, 40.61],
  [70.56, 41.07],
  [69.27, 40.74],
  [69.27, 40.23],
  [68.53, 39.58],
  [65.23, 39.9],
  [62.5, 40.03],
  [60.65, 39.58],
  [58.63, 38.67],
  [56.67, 38.35],
  [55.29, 38.09],
  [54.7, 37.51],
  [53.5, 37.0],
  [52.11, 36.55],
  [50.85, 36.03],
  [50.48, 35.64],
  [49.41, 35.26],
  [48.77, 35.13],
  [46.03, 35.39],
  [45.22, 35.64],
  [45.25, 36.93],
];

// ------------------------------------------- batch 2: sources and shapes
//
// Batch 2 (the main session, 2026-11-16) adds 11 snapshots and the polities
// that had been left blank (Persia, Armenia, Bithynia, Cappadocia, Galatia,
// Mauretania). It reuses the batch 1 shapes wherever a border did not move;
// the new lines are generalised from the Wikipedia articles cited below.

const wiki = (title, page) => ({
  title: `${title} (Wikipedia)`,
  url: `https://en.wikipedia.org/wiki/${page}`,
});
const WIKI_ACHAEMENID = wiki(
  "Achaemenid Empire: extent in the late 6th and the 4th century BC",
  "Achaemenid_Empire",
);
const WIKI_ARMENIA = wiki(
  "Kingdom of Armenia (antiquity): the Orontid and Artaxiad kingdoms, Tigranes the Great",
  "Kingdom_of_Armenia_(antiquity)",
);
const WIKI_CAPPADOCIA = wiki(
  "Cappadocia (Roman province): the Ariarathid kingdom and its client status",
  "Cappadocia_(Roman_province)",
);
const WIKI_GALATIA = wiki("Galatia: the Gallic settlement and the Galatian kingdom", "Galatia");
const WIKI_BITHYNIA = wiki("Kingdom of Bithynia", "Kingdom_of_Bithynia");
const WIKI_MAURETANIA = wiki("Mauretania: extent of the kingdom and its kings", "Mauretania");
const WIKI_PROVINCES = wiki("Roman province: dates of the Republican provinces", "Roman_province");
const WIKI_PARTHIA = wiki(
  "Parthian Empire: Arsaces I, the conquests of Mithridates I",
  "Parthian_Empire",
);

/**
 * The Achaemenid realm in the west and east: Asia Minor with the eastern
 * Aegean islands, the Levant, Egypt, Mesopotamia and Iran to the Indus and
 * the Jaxartes. Its Black Sea edge runs at sea, round Heraclea and Sinope
 * (holes, see PERSIA). Cyprus and Thrace are separate polygons.
 */
const PERSIA_OUTER = [
  [29.12, 41.3],
  [31.0, 41.65],
  [33.0, 42.5],
  [35.0, 42.6],
  [36.5, 41.9],
  [38.5, 41.35],
  [40.5, 41.35],
  [41.4, 41.75],
  [42.5, 42.6],
  [44.5, 42.75],
  [46.5, 42.0],
  [48.2, 41.7],
  [49.6, 40.4],
  [49.4, 38.6],
  [50.5, 37.1],
  [53.5, 36.95],
  [54.0, 37.6],
  [56.0, 38.5],
  [59.0, 39.6],
  [62.0, 40.6],
  [65.0, 41.2],
  [68.0, 42.0],
  [71.0, 41.4],
  [72.0, 40.0],
  [71.2, 37.5],
  [71.6, 35.0],
  [72.0, 33.0],
  [71.0, 30.0],
  [68.0, 26.5],
  [66.6, 25.3],
  [62.0, 25.0],
  [58.0, 25.3],
  ...PERSIAN_GULF.slice().reverse(),
  [47.7, 29.9],
  [46.62, 29.86],
  [45.77, 30.44],
  [44.95, 31.27],
  [43.15, 32.81],
  [40.7, 34.16],
  [39.12, 34.49],
  [37.6, 33.75],
  [36.72, 32.75],
  [36.42, 31.21],
  [35.35, 31.14],
  [34.61, 30.44],
  [32.92, 30.12],
  [32.55, 29.95],
  [32.7, 29.4],
  [33.9, 27.6],
  [34.4, 26.6],
  [35.2, 25.0],
  [35.9, 23.9],
  [33.76, 23.69],
  [31.67, 23.75],
  [30.46, 23.36],
  [29.67, 24.2],
  [28.57, 24.65],
  [28.29, 25.16],
  [28.35, 26.58],
  [28.15, 27.35],
  [27.07, 28.32],
  [24.93, 29.47],
  [24.82, 30.44],
  [25.06, 30.69],
  [24.94, 31.34],
  [25.1, 31.59],
  ...EGYPT_SEA,
  [34.75, 32.4],
  [35.0, 33.0],
  [35.2, 33.6],
  [35.4, 34.3],
  [35.6, 35.3],
  [35.75, 36.3],
  [34.6, 36.4],
  [33.0, 35.9],
  [31.9, 36.35],
  [30.75, 36.6],
  [30.6, 36.1],
  [29.6, 36.0],
  [28.5, 36.0],
  [27.6, 35.9],
  [26.9, 36.6],
  [25.9, 38.3],
  [25.6, 39.3],
  [26.0, 40.0],
  [26.15, 40.1],
  [26.55, 40.3],
  [27.5, 40.5],
  [28.8, 40.55],
  [29.0, 40.95],
];
const PERSIA = { outer: PERSIA_OUTER, holes: [HERACLEA_PONTICA, SINOPE] };

/** Coastal Thrace, Persian after Darius' campaign of 513 BC (509 only). */
const THRACE_509 = [
  [23.65, 41.0],
  [24.0, 40.8],
  [24.6, 40.85],
  [25.4, 40.9],
  [26.0, 40.75],
  [26.4, 40.62],
  [27.0, 40.65],
  [27.5, 40.95],
  [28.15, 41.0],
  [28.2, 41.55],
  [27.4, 42.0],
  [26.0, 42.25],
  [24.6, 42.05],
  [23.65, 41.6],
];

/** Macedon of Philip II: Macedonia, Thessaly, Chalcidice and Thrace (338). */
const MACEDON_338 = [
  [20.55, 41.6],
  [21.1, 42.15],
  [22.45, 42.4],
  [23.6, 42.55],
  [25.0, 42.7],
  [26.0, 42.55],
  [27.35, 42.1],
  [28.15, 41.55],
  [28.15, 41.0],
  [27.5, 40.95],
  [27.0, 40.65],
  [26.4, 40.62],
  [26.0, 40.75],
  [25.4, 40.9],
  [24.9, 40.75],
  [24.55, 40.35],
  [24.55, 39.95],
  "-magnesia-sea",
  "-othrys",
  "-pindus-south",
  "-pindus-epirus",
  "-pindus-illyria",
];

// Italy in 338 and 290 BCE.

/** Rome after the Latin War: southern Etruria, Latium, northern Campania. */
const ROME_338 = [
  [11.4, 42.15],
  [11.75, 42.2],
  [12.05, 42.25],
  [12.3, 42.17],
  [12.5, 42.3],
  [12.8, 42.1],
  [13.25, 41.95],
  [13.45, 41.8],
  [13.7, 41.6],
  [13.95, 41.4],
  [14.2, 41.3],
  [14.45, 41.1],
  [14.35, 40.95],
  [14.12, 40.84],
  [13.9, 40.6],
  [12.6, 41.0],
  [11.8, 41.6],
];
/** Etruria between Rome's land, the upper Tiber and the Arno (338). */
const ETRURIA_338 = [
  [11.4, 42.15],
  [11.75, 42.2],
  [12.05, 42.25],
  [12.3, 42.17],
  [12.5, 42.3],
  [12.45, 42.4],
  [12.4, 42.6],
  [12.42, 42.75],
  [12.45, 42.95],
  [12.38, 43.1],
  [12.3, 43.3],
  [12.2, 43.48],
  [12.1, 43.65],
  [12.05, 43.85],
  [11.7, 43.95],
  [11.3, 44.1],
  [10.95, 44.08],
  [10.6, 43.98],
  [10.25, 43.92],
  [9.9, 43.9],
  [10.0, 43.3],
  [9.95, 42.6],
  [10.9, 42.1],
];
/** Samnium, against Rome's Latium and Campania (338). */
const SAMNIUM_338 = [
  [13.45, 41.8],
  [13.7, 41.6],
  [13.95, 41.4],
  [14.2, 41.3],
  [14.45, 41.1],
  [14.6, 40.95],
  [15.15, 40.75],
  [15.35, 40.95],
  [15.3, 41.3],
  [15.0, 41.6],
  [14.6, 41.85],
  [14.25, 41.95],
  [13.8, 42.0],
];
/** Rome in 290: the 338 land plus the Sabine country to the Adriatic. */
const AGER_ROMANUS_290 = [
  "ager-romanus-north-a",
  [13.9, 42.95],
  "ager-romanus-south",
  [12.6, 41.0],
  [11.8, 41.6],
];
/** Samnium, Campania and Apulia, allied after 290; Lucania and the south not. */
const ALLIES_SOUTH_290 = [
  "ager-romanus-south",
  [14.8, 40.5],
  [15.3, 40.75],
  [15.9, 40.8],
  [16.4, 40.85],
  [16.95, 40.95],
  [17.45, 41.05],
  [16.8, 41.6],
  [16.6, 42.0],
  [15.0, 42.4],
];

// Sicily, Spain and Africa.

/** Sicily east of the Halycus (Syracuse in 338 and 290). */
const SICILY_EAST = [
  "-halycus",
  [13.6, 37.0],
  [14.5, 36.5],
  [15.3, 36.4],
  [15.6, 37.0],
  [15.5, 37.6],
  "-messina-strait",
  [15.0, 38.45],
  [14.3, 38.35],
];
/** Sicily outside Hiero II's kingdom (Roman from 241). */
const SICILY_NON_SYRACUSE = [
  "-syracuse-west",
  "-messina-strait",
  [15.0, 38.45],
  [13.9, 38.4],
  [12.9, 38.35],
  [11.95, 38.1],
  [12.2, 37.45],
  [13.25, 37.0],
  [14.0, 36.85],
];
/** Barcid Spain before the Second Punic War: the south and east to the Ebro. */
const BARCID_SPAIN = [
  [0.9, 40.75],
  [-0.5, 40.5],
  [-2.0, 40.0],
  [-3.5, 39.3],
  [-5.0, 38.9],
  [-6.0, 38.3],
  [-6.9, 37.6],
  [-7.42, 37.18],
  [-7.5, 36.9],
  [-6.6, 36.4],
  [-6.1, 36.05],
  [-5.65, 35.97],
  [-5.35, 36.05],
  [-4.5, 36.3],
  [-2.5, 36.5],
  [-1.6, 37.15],
  [-0.4, 37.5],
  [0.4, 38.6],
  [0.3, 39.6],
  [1.2, 40.5],
];
/** Roman Spain after the conquest of Lusitania and Celtiberia (129–30). */
const HISPANIA_LATE = [
  "-pyrenees-east",
  "-pyrenees-west",
  [-2.5, 43.0],
  [-4.0, 42.6],
  [-5.5, 42.3],
  [-7.0, 41.8],
  [-8.0, 41.2],
  [-8.9, 41.1],
  [-9.6, 39.0],
  [-9.4, 38.0],
  [-8.9, 37.0],
  [-7.5, 36.9],
  [-6.6, 36.4],
  [-6.1, 36.05],
  [-5.65, 35.97],
  [-5.35, 36.05],
  [-4.5, 36.3],
  [-2.5, 36.5],
  [-1.6, 37.15],
  [-0.4, 37.5],
  [0.4, 38.6],
  [0.3, 39.6],
  [1.2, 40.5],
  [2.5, 41.1],
  [3.4, 41.8],
];
/** Carthage after Zama: its heartland inside the later Fossa Regia, with the Syrtic emporia (201, 168). */
const CARTHAGE_201 = [
  "fossa-regia",
  [10.6, 34.1],
  [10.0, 33.4],
  "syrtis-inland",
  "philaeni",
  ...SYRTIS_SEA,
  [11.5, 35.2],
  [11.4, 36.1],
  [11.35, 37.0],
  [10.4, 37.4],
  [9.8, 37.45],
];
/** Masinissa's Numidia, from the Mulucha to Carthage's land (201, 168). */
const NUMIDIA_201 = [
  "fossa-regia",
  [10.6, 34.1],
  [10.0, 33.4],
  [9.3, 33.9],
  [8.0, 34.3],
  [6.0, 34.6],
  [4.0, 35.0],
  [2.0, 35.0],
  [0.0, 34.8],
  [-1.5, 34.6],
  [-2.35, 34.7],
  [-2.35, 35.15],
  [-2.3, 35.4],
  [0.0, 36.3],
  [3.0, 37.0],
  [6.0, 37.3],
  [8.0, 37.3],
];
/** Numidia after Jugurtha: its west given to Mauretania (88, 63, 50). */
const NUMIDIA_LATE = [
  "fossa-regia",
  [11.2, 34.2],
  [11.3, 33.6],
  ...SYRTIS_SEA.slice().reverse(),
  [19.0, 30.7],
  "-philaeni",
  "-syrtis-inland",
  [9.3, 33.9],
  [8.0, 34.3],
  [6.0, 34.6],
  "-saldae",
  [6.0, 37.3],
  [8.0, 37.3],
];
/** Mauretania from the Atlantic to the Mulucha (201–129). */
const MAURETANIA = [
  [-2.3, 35.4],
  [-2.35, 35.15],
  [-2.35, 34.7],
  [-3.0, 34.0],
  [-5.0, 33.6],
  [-7.2, 33.9],
  [-6.6, 35.0],
  [-6.3, 35.85],
  [-5.5, 35.97],
  [-5.0, 35.75],
  [-3.0, 35.55],
];
/** Mauretania with western Numidia, given to Bocchus I after Jugurtha (88–30). */
const MAURETANIA_LATE = [
  "saldae",
  [4.0, 34.7],
  [2.0, 35.0],
  [0.0, 34.8],
  [-1.5, 34.6],
  [-3.0, 34.0],
  [-5.0, 33.6],
  [-7.2, 33.9],
  [-6.6, 35.0],
  [-6.3, 35.85],
  [-5.5, 35.97],
  [-5.0, 35.75],
  [-3.0, 35.55],
  [-1.5, 35.5],
  [0.0, 36.3],
  [2.0, 36.75],
  [3.0, 37.0],
  [5.0, 37.05],
];
/** Cyrenaica, from the Altars of the Philaeni to Catabathmus. */
const CYRENAICA = [
  [24.93, 29.47],
  [23.23, 30.5],
  [21.95, 30.89],
  [20.58, 30.89],
  [19.57, 30.12],
  "philaeni",
  [19.7, 31.2],
  [19.85, 32.2],
  [20.6, 32.9],
  [21.8, 33.15],
  [23.0, 32.85],
  [24.0, 32.3],
  [25.2, 31.8],
  [25.1, 31.59],
  [24.94, 31.34],
  [25.06, 30.69],
  [24.82, 30.44],
];
/** Egypt alone, east of Catabathmus (168 onwards). */
const EGYPT = [
  ...EGYPT_SEA,
  "raphia",
  [32.92, 30.12],
  [32.55, 29.95],
  [32.7, 29.4],
  [33.9, 27.6],
  [34.4, 26.6],
  [35.2, 25.0],
  [35.9, 23.9],
  [33.76, 23.69],
  [31.67, 23.75],
  [30.46, 23.36],
  [29.67, 24.2],
  [28.57, 24.65],
  [28.29, 25.16],
  [28.15, 27.35],
  [26.85, 28.44],
  [24.93, 29.47],
  [24.82, 30.44],
  [25.06, 30.69],
  [24.94, 31.34],
  [25.1, 31.59],
];

// Gaul.

/** Inland limit of Gallia Narbonensis (province 120 BC), Pyrenees to the Alps. */
const NARBO_LINE = [
  [0.65, 42.65],
  [0.9, 43.3],
  [1.2, 43.85],
  [2.1, 43.95],
  [3.0, 44.25],
  [3.8, 44.65],
  [4.6, 45.15],
  [5.1, 45.65],
  [5.9, 46.15],
  [6.6, 46.35],
  [7.6, 46.3],
];
const NARBONENSIS = [
  "pyrenees-east",
  [3.8, 43.2],
  [4.5, 43.2],
  "massalia",
  [7.2, 43.9],
  [7.15, 44.1],
  [7.0, 44.3],
  [6.9, 44.9],
  [6.95, 45.8],
  ...NARBO_LINE.slice().reverse(),
];
/** Gaul outside the Roman province (88, 63); Roman after Caesar (50, 30). */
const GAUL_FREE = [
  ...NARBO_LINE,
  [8.4, 46.6],
  [9.3, 47.1],
  [9.5, 47.55],
  [8.6, 47.65],
  [7.6, 47.56],
  [7.8, 48.6],
  [8.2, 49.0],
  [8.45, 49.5],
  [8.25, 50.0],
  [7.6, 50.35],
  [7.1, 50.75],
  [6.8, 51.2],
  [6.2, 51.85],
  [5.0, 51.9],
  [4.1, 52.0],
  [3.5, 52.3],
  [1.5, 51.05],
  [0.0, 50.2],
  [-2.0, 50.0],
  [-5.4, 48.6],
  [-4.9, 47.6],
  [-2.6, 46.4],
  [-2.0, 44.5],
  "pyrenees-west",
];

// Anatolia and the east.

/** Bithynia against the Seleucid realm of 264 (290–201). */
const BITHYNIA_264 = [
  [29.12, 41.3],
  [30.9, 41.3],
  [31.0, 40.9],
  [31.3, 40.4],
  [31.38, 39.97],
  [30.59, 39.97],
  [30.46, 40.23],
  [29.4, 40.74],
  [29.15, 40.85],
  [29.05, 41.0],
];
/** Bithynia against Pergamon / Roman Asia of 146 (168–129). */
const BITHYNIA_146 = [
  [29.12, 41.3],
  [30.9, 41.3],
  [31.0, 40.9],
  [31.3, 40.4],
  [31.38, 39.97],
  [30.59, 39.97],
  [29.94, 40.55],
  [29.4, 40.5],
  [29.15, 40.85],
  [29.05, 41.0],
];
/** The Galatians round Ancyra, Pessinus and Tavium (264–201). */
const GALATIA_264 = [
  [31.38, 39.97],
  [31.23, 39.32],
  [31.42, 38.87],
  [33.27, 38.55],
  [34.48, 38.8],
  [34.83, 39.77],
  [34.54, 39.97],
  [34.6, 40.48],
  [33.5, 40.65],
  [32.5, 40.6],
  [31.6, 40.4],
];
/** The Galatians against the larger Pergamon and Pontus of 146 (168–30). */
const GALATIA_146 = [
  [31.38, 39.97],
  [31.23, 39.32],
  [31.42, 38.87],
  [33.59, 38.55],
  [34.6, 38.75],
  [34.54, 39.97],
  [34.45, 40.5],
  [33.5, 40.65],
  [32.5, 40.6],
  [31.6, 40.4],
];
/** Cappadocia south of the Pontic line of 264 (290–201). */
const CAPPADOCIA_EARLY = [
  [39.45, 38.42],
  "-pontus-264",
  [34.48, 38.8],
  [34.48, 38.0],
  [35.2, 37.6],
  [36.5, 37.6],
  [37.6, 37.95],
  [38.6, 38.2],
];
/** Cappadocia against Pontus and the Seleucid line of 146 (168–30). */
const CAPPADOCIA_146 = [
  [34.54, 39.97],
  [35.44, 39.58],
  [37.86, 39.45],
  [38.83, 39.06],
  [39.46, 38.48],
  [39.18, 38.16],
  [38.42, 38.35],
  [38.15, 38.03],
  [37.76, 38.09],
  [37.64, 37.71],
  [36.5, 37.5],
  [35.3, 37.45],
  [34.5, 37.4],
  [33.6, 37.65],
  [33.59, 38.55],
  [34.6, 38.75],
];
/** Armenia, Euphrates to the Caspian lowlands (264–201). */
const ARMENIA_EARLY = [
  [39.45, 38.42],
  [40.6, 38.22],
  [40.57, 38.03],
  [41.67, 38.03],
  [44.41, 37.58],
  [44.77, 37.38],
  [44.87, 37.0],
  [45.25, 36.93],
  [45.45, 37.2],
  [45.2, 37.8],
  [46.1, 38.5],
  [47.2, 38.7],
  [47.2, 39.6],
  [46.5, 40.4],
  [45.5, 41.1],
  [44.0, 41.2],
  [42.5, 41.4],
  [41.26, 41.07],
  [40.57, 40.68],
  [40.75, 40.36],
  [40.4, 40.1],
  [38.79, 39.9],
  [38.93, 39.77],
  [38.74, 39.58],
  [38.96, 39.45],
  [38.75, 39.06],
];
/** Armenia against the Pontus and the Seleucid line of 146 (168–30). */
const ARMENIA_146 = [
  [38.83, 39.06],
  [38.79, 39.9],
  [40.4, 40.1],
  [40.75, 40.36],
  [40.57, 40.68],
  [41.35, 41.13],
  [42.5, 41.4],
  [44.0, 41.2],
  [45.5, 41.1],
  [46.5, 40.4],
  [47.2, 39.6],
  [47.25, 38.67],
  [46.12, 38.48],
  [45.63, 37.9],
  [45.22, 37.77],
  [45.17, 37.45],
  [45.45, 37.19],
  [45.25, 36.93],
  [44.87, 37.0],
  [44.77, 37.38],
  [44.41, 37.58],
  [40.57, 38.03],
  [40.45, 38.29],
  [39.46, 38.48],
];
/** The Kerch and Taman peninsulas: Mithridates' Bosporan kingdom (88). */
const BOSPORUS = [
  [35.35, 45.3],
  [35.6, 45.6],
  [36.7, 45.6],
  [37.4, 45.35],
  [37.4, 44.9],
  [36.3, 45.0],
  [35.4, 44.95],
];
/** Rough and Smooth Cilicia (Roman province 63 BC). */
const CILICIA = [
  [31.45, 36.6],
  [31.6, 37.2],
  [33.6, 37.65],
  [34.5, 37.4],
  [35.3, 37.45],
  [36.5, 37.5],
  [36.3, 37.05],
  [36.15, 36.95],
  [35.7, 36.5],
  [34.6, 36.4],
  [33.0, 35.9],
  [31.9, 36.35],
];
/** The middle Euphrates, Dura to Zeugma: Syria against Mesopotamia. */
const EUPHRATES = [
  [40.85, 34.1],
  [40.5, 34.8],
  [40.0, 35.3],
  [39.0, 35.9],
  [38.2, 36.3],
  [38.16, 36.87],
];
/** Syria and Judaea west of the Euphrates. */
const SYRIA = [
  [35.7, 36.5],
  [35.6, 35.3],
  [35.4, 34.3],
  [35.2, 33.6],
  [35.0, 33.0],
  [34.75, 32.4],
  "raphia",
  [35.45, 31.1],
  [36.0, 32.5],
  [36.69, 32.49],
  [36.9, 33.07],
  [37.99, 33.97],
  [39.51, 34.49],
  ...EUPHRATES,
  [37.2, 36.61],
  [36.15, 36.95],
];
/** Mesopotamia and Babylonia, east of the Euphrates to the Zagros. */
const MESOPOTAMIA = [
  [40.85, 34.1],
  [43.15, 32.81],
  [45.77, 30.44],
  [46.59, 30.31],
  [46.62, 29.86],
  [47.7, 29.9],
  [48.6, 29.8],
  "zagros-146",
  [44.87, 37.0],
  [44.77, 37.38],
  [44.41, 37.58],
  [40.57, 38.03],
  [40.45, 38.29],
  [39.46, 38.48],
  [39.18, 38.16],
  [38.42, 38.35],
  [38.15, 38.03],
  [37.76, 38.09],
  [37.64, 37.71],
  ...EUPHRATES.slice().reverse(),
];
/**
 * Iran from Persis to the Parthian border, without Bactria and Arachosia,
 * lost by the Seleucids in the 3rd century (241–201 within the Seleucid
 * ring below; 168 as a ring of its own).
 */
const IRAN_EAST_EARLY = [
  [57.77, 26.0],
  [58.4, 26.84],
  [58.98, 27.22],
  [60.24, 28.25],
  [61.03, 29.47],
  [61.5, 31.0],
  [61.0, 33.0],
  [60.5, 34.5],
  [59.5, 35.6],
  [58.0, 35.7],
  [56.0, 35.9],
  [54.5, 36.2],
  [53.5, 36.6],
  [52.11, 36.55],
  [50.85, 36.03],
  [50.48, 35.64],
  [49.41, 35.26],
  [48.77, 35.13],
  [46.03, 35.39],
  [45.22, 35.64],
  [45.25, 36.93],
];
const IRAN_168 = [
  ...PERSIAN_GULF,
  ...IRAN_EAST_EARLY.slice(0, 18),
  [48.71, 35.19],
  [48.94, 34.16],
  [48.65, 33.26],
  [49.32, 32.56],
  [49.71, 32.62],
  [50.28, 31.79],
  [49.97, 31.21],
  [50.4, 30.5],
  [50.1, 30.1],
  [49.9, 29.8],
];
/** Parthia and Hyrcania under the early Arsacids (241–168). */
const PARTHIA_EARLY = [
  [59.5, 35.6],
  [58.0, 35.7],
  [56.0, 35.9],
  [54.5, 36.2],
  [53.5, 36.6],
  [54.0, 37.4],
  [54.7, 37.51],
  [55.29, 38.09],
  [56.67, 38.35],
  [58.63, 38.67],
  [60.65, 39.58],
  [61.3, 38.6],
  [61.4, 36.8],
  [60.6, 35.9],
];
/**
 * The Seleucid realm of 241–201: as in 264, but without Cappadocia, Bactria
 * and Parthia, and still without Coele-Syria (Ptolemaic until 200).
 */
const SELEUCID_EARLY = [
  "ptolemaic-anatolia",
  [35.4, 36.4],
  [35.75, 35.9],
  "coele-syria",
  [39.12, 34.49],
  [40.26, 34.29],
  [40.7, 34.16],
  [43.15, 32.81],
  [44.58, 31.34],
  [44.95, 31.27],
  [45.77, 30.44],
  [46.59, 30.31],
  [46.62, 29.86],
  [47.7, 29.9],
  [48.6, 29.8],
  ...PERSIAN_GULF,
  ...IRAN_EAST_EARLY,
  [44.87, 37.0],
  [44.77, 37.38],
  [44.41, 37.58],
  [41.67, 38.03],
  [40.57, 38.03],
  [40.6, 38.22],
  [39.45, 38.42],
  [38.6, 38.2],
  [37.6, 37.95],
  [36.5, 37.6],
  [35.2, 37.6],
  [34.48, 38.0],
  [34.48, 38.8],
  [33.27, 38.55],
  [31.42, 38.87],
  [31.23, 39.32],
  [31.38, 39.97],
  [30.59, 39.97],
  [30.46, 40.23],
  [29.4, 40.74],
  { coast: [[29.05, 40.37], [26.85, 39.5]] },
  "pergamon-264",
  { coast: [[26.85, 38.6], [28.25, 37.03]] },
];
/**
 * Seleucus I after Ipsus (290): Syria north of Coele-Syria, Mesopotamia and
 * Iran to the Indian border. Western Asia Minor was Lysimachus' (blank).
 */
const SELEUCID_290 = [
  "coele-syria",
  [39.12, 34.49],
  [40.26, 34.29],
  [40.7, 34.16],
  [43.15, 32.81],
  [44.58, 31.34],
  [44.95, 31.27],
  [45.77, 30.44],
  [46.59, 30.31],
  [46.62, 29.86],
  [47.7, 29.9],
  [48.6, 29.8],
  ...PERSIAN_GULF,
  ...IRAN_EAST,
  [44.87, 37.0],
  [44.77, 37.38],
  [44.41, 37.58],
  [41.67, 38.03],
  [40.57, 38.03],
  [40.6, 38.22],
  [39.45, 38.42],
  [38.6, 38.2],
  [37.6, 37.95],
  [36.5, 37.6],
  [35.2, 37.6],
  [34.7, 36.6],
  [35.4, 36.4],
  [35.75, 35.9],
];

// -------------------------------------------------------------- snapshots

const bce509 = {
  year: -509,
  sources: [
    SHEPHERD_ITALY,
    SHEPHERD_COLONIES,
    {
      title: "Polybius, Histories 3.22–23 (the first treaty between Rome and Carthage)",
      url: "https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/3*.html",
    },
    {
      title: "Etruscan civilization (Wikipedia): extent around 500 BC",
      url: "https://en.wikipedia.org/wiki/Etruscan_civilization",
    },
    WIKI_ACHAEMENID,
    CLIOPATRIA,
  ],
  features: [
    {
      polityId: "rome",
      polygons: [["rome-509-latium", "rome-509-sabines", "rome-509-etruria"]],
    },
    {
      polityId: "latins",
      polygons: [
        [
          "rome-509-latium",
          [12.8, 41.95],
          [12.9, 41.97],
          [12.97, 41.85],
          [12.88, 41.72],
          [13.02, 41.62],
          [13.15, 41.52],
          [13.25, 41.36],
          [13.28, 41.28],
          [13.3, 41.1],
          [12.9, 41.12],
          [12.5, 41.4],
          [12.15, 41.65],
          "-tiber-lower",
        ],
      ],
    },
    {
      polityId: "etruscans",
      polygons: [
        // Etruria between the Tiber and the Arno, and the Po valley.
        [
          "-tiber-lower",
          "-rome-509-etruria",
          "tiber-upper",
          [11.85, 44.0],
          [11.9, 44.25],
          [12.15, 44.35],
          [12.3, 44.4],
          [12.6, 44.45],
          [12.75, 44.95],
          [12.6, 45.1],
          [12.35, 45.1],
          [12.0, 45.15],
          [11.5, 45.25],
          [10.9, 45.3],
          [10.4, 45.2],
          [10.1, 44.95],
          [10.15, 44.65],
          [10.5, 44.3],
          "-apuan",
          [10.0, 43.3],
          [9.95, 42.6],
          [10.9, 42.1],
          [11.8, 41.6],
        ],
        // Capua, Nola and the Campanian plain.
        [
          "campania-samnium",
          [14.88, 40.6],
          [14.75, 40.55],
          [14.66, 40.67],
          [14.5, 40.78],
          [14.3, 40.92],
          [14.05, 40.98],
        ],
      ],
    },
    {
      polityId: "samnites",
      polygons: [
        [
          [13.95, 41.7],
          [14.25, 41.95],
          [14.6, 41.85],
          [15.0, 41.6],
          [15.3, 41.3],
          [15.35, 40.95],
          [15.15, 40.75],
          "-campania-samnium",
          [13.95, 41.45],
        ],
      ],
    },
    {
      polityId: "greek-city-states",
      polygons: [
        // Cumae and the Bay of Naples.
        [[13.9, 40.75], [14.05, 40.98], [14.3, 40.92], [14.32, 40.8], [14.2, 40.7]],
        // Poseidonia and Elea.
        [[14.85, 40.5], [15.0, 40.55], [15.15, 40.45], [15.25, 40.2], [15.4, 39.98], [15.2, 39.9], [14.8, 40.2]],
        // Magna Graecia: the toe of Italy and the Ionian coast to Taras.
        [
          [15.6, 38.9],
          [16.25, 38.92],
          [16.5, 38.95],
          [16.95, 39.15],
          [16.85, 39.45],
          [16.35, 39.65],
          [16.45, 40.0],
          [16.7, 40.45],
          [17.15, 40.62],
          [17.55, 40.55],
          [17.62, 40.32],
          [17.5, 40.1],
          [17.5, 39.1],
          [16.0, 37.7],
          "-messina-strait",
        ],
        // Eastern and southern Sicily, Zancle to Selinus.
        [
          [15.75, 38.4],
          [15.45, 38.2],
          [15.2, 37.95],
          [15.0, 37.75],
          [14.85, 37.45],
          [14.85, 37.2],
          [14.75, 37.0],
          [14.5, 37.0],
          [14.2, 37.15],
          [13.95, 37.25],
          [13.65, 37.4],
          [13.3, 37.5],
          [13.0, 37.65],
          [12.75, 37.68],
          [12.62, 37.66],
          [12.5, 37.45],
          [13.5, 36.9],
          [14.5, 36.5],
          [15.3, 36.4],
          [15.6, 37.0],
          [15.5, 37.6],
          "-messina-strait",
        ],
        // Himera.
        [[13.75, 37.9], [14.05, 37.9], [14.05, 38.15], [13.75, 38.15]],
        MASSALIA_509(),
        EMPORION,
        // Greece from Thessaly south, with the Ionian islands and Euboea's channel.
        [
          [22.75, 40.05],
          [22.6, 40.05],
          [22.35, 40.0],
          [22.0, 40.2],
          [21.8, 39.95],
          [21.3, 39.7],
          "pindus-south",
          "-ambracian",
          [20.4, 38.7],
          [20.25, 38.1],
          [20.5, 37.55],
          [21.6, 36.6],
          [22.3, 36.3],
          [22.9, 36.05],
          [23.3, 36.35],
          [23.35, 36.95],
          [23.65, 37.25],
          [23.9, 37.45],
          { coast: [[24.02, 37.65], [22.622, 38.914]] },
          "magnesia-sea",
          [23.15, 39.8],
        ],
        // Chalcidice.
        [
          [23.05, 40.5],
          [23.25, 40.6],
          [23.6, 40.65],
          [23.9, 40.75],
          [24.0, 40.6],
          [24.55, 40.3],
          [24.5, 39.95],
          [23.6, 39.85],
          [22.95, 40.2],
        ],
        ISLANDS.euboea,
        ISLANDS.corcyra,
        ISLANDS.crete,
        ...CYCLADES,
        // Cyrene and the Pentapolis.
        [
          [19.85, 32.2],
          [20.05, 31.6],
          [20.4, 31.6],
          [21.0, 32.1],
          [22.0, 32.2],
          [22.9, 32.25],
          [23.0, 32.65],
          [23.0, 32.85],
          [21.8, 33.15],
          [20.6, 32.9],
        ],
        BLACK_SEA_WEST,
        OLBIA,
        HERACLEA_PONTICA,
        SINOPE,
      ],
    },
    {
      polityId: "carthage",
      polygons: [
        // Carthage and its hinterland.
        [
          [9.6, 37.4],
          [9.75, 37.2],
          [9.55, 36.95],
          [9.75, 36.6],
          [10.1, 36.35],
          [10.45, 36.1],
          [10.6, 36.05],
          [10.9, 35.95],
          [11.35, 37.0],
          [10.4, 37.4],
        ],
        // South-western Sardinia (Tharros, Sulcis, Nora, Karalis).
        [
          [8.1, 40.0],
          [8.55, 40.05],
          [8.75, 39.85],
          [8.95, 39.55],
          [9.25, 39.4],
          [9.45, 39.3],
          [9.6, 39.2],
          [9.7, 38.95],
          [8.9, 38.75],
          [8.2, 38.9],
        ],
        // The Phoenician towns of western Sicily: Motya, and Panormus–Soloeis.
        [[12.25, 37.7], [12.55, 37.72], [12.62, 37.85], [12.58, 37.98], [12.35, 38.05]],
        [[13.15, 38.0], [13.6, 37.98], [13.62, 38.25], [13.15, 38.25]],
        ISLANDS.ibiza,
        ISLANDS.formentera,
      ],
    },
    {
      polityId: "gauls",
      polygons: [
        [
          "pyrenees-west",
          [1.5, 42.55],
          [2.3, 42.95],
          [2.9, 43.25],
          [3.6, 43.65],
          [4.4, 43.95],
          [5.0, 44.05],
          [5.6, 44.0],
          [6.4, 44.3],
          [6.9, 44.9],
          [6.95, 45.8],
          [7.6, 46.3],
          [8.4, 46.6],
          [9.3, 47.1],
          [9.5, 47.55],
          [8.6, 47.65],
          [7.6, 47.56],
          [7.8, 48.6],
          [8.2, 49.0],
          [8.45, 49.5],
          [8.25, 50.0],
          [7.6, 50.35],
          [7.1, 50.75],
          [6.8, 51.2],
          [6.2, 51.85],
          [5.0, 51.9],
          [4.1, 52.0],
          [3.5, 52.3],
          [1.5, 51.05],
          [0.0, 50.2],
          [-2.0, 50.0],
          [-5.4, 48.6],
          [-4.9, 47.6],
          [-2.6, 46.4],
          [-2.0, 44.5],
        ],
      ],
    },
    {
      polityId: "macedon",
      polygons: [
        // Lower Macedonia.
        [
          [22.6, 40.05],
          [22.35, 40.0],
          [22.0, 40.2],
          [21.9, 40.6],
          [22.0, 40.95],
          [22.4, 41.1],
          [22.75, 41.0],
          [23.1, 40.75],
          [23.05, 40.5],
          [22.95, 40.3],
          [22.75, 40.05],
        ],
      ],
    },
    {
      // Batch 2: Persia under Darius I, with Cyprus and coastal Thrace.
      polityId: "achaemenid-empire",
      polygons: [PERSIA, ISLANDS.cyprus, THRACE_509],
    },
  ],
};

/** Massalia's own small territory before its later colonies. */
function MASSALIA_509() {
  return [[5.2, 43.15], [5.22, 43.42], [5.6, 43.42], [5.65, 43.15]];
}

const bce264 = {
  year: -264,
  sources: [
    SHEPHERD_ROMAN,
    SHEPHERD_ITALY,
    {
      title: "First Punic War (Wikipedia): background, Carthaginian and Syracusan territory in 264 BC",
      url: "https://en.wikipedia.org/wiki/First_Punic_War",
    },
    {
      title: "Livius.org, Sicily (5): the Halycus frontier",
      url: "https://www.livius.org/articles/place/sicily/sicily-5/",
    },
    {
      title: "Hiero II of Syracuse (Wikipedia): the kingdom confirmed in 263 BC",
      url: "https://en.wikipedia.org/wiki/Hiero_II_of_Syracuse",
    },
    SHEPHERD_DIADOCHI,
    WIKI_BITHYNIA,
    WIKI_GALATIA,
    WIKI_ARMENIA,
    CLIOPATRIA,
  ],
  features: [
    {
      polityId: "rome",
      polygons: [AGER_ROMANUS],
    },
    {
      polityId: "italian-allies",
      polygons: [ALLIES_NORTH_264, ALLIES_SOUTH],
    },
    {
      polityId: "gauls",
      polygons: [
        GAUL,
        // Cisalpine Gaul: Insubres, Cenomani, Boii, Lingones.
        [
          "-rubicon-line",
          [10.8, 44.35],
          [10.5, 44.6],
          [10.1, 44.85],
          [9.7, 45.05],
          [9.3, 45.12],
          [8.9, 45.1],
          [8.4, 45.1],
          [8.3, 45.3],
          [8.35, 45.6],
          [8.6, 45.8],
          [9.0, 45.85],
          [9.5, 45.85],
          [10.0, 45.8],
          [10.5, 45.75],
          [10.85, 45.7],
          [11.0, 45.43],
          [11.4, 45.2],
          [11.9, 45.15],
          [12.3, 45.17],
          [12.6, 45.1],
          [12.75, 44.95],
        ],
      ],
    },
    {
      polityId: "carthage",
      polygons: [
        // North Africa: the Carthaginian heartland and the coast from the
        // Atlantic to the Altars of the Philaeni.
        [
          [-6.6, 35.0],
          [-6.3, 35.85],
          [-5.5, 35.97],
          [-5.0, 35.75],
          [-3.0, 35.55],
          [-1.5, 35.5],
          [0.0, 36.2],
          [2.0, 36.75],
          [3.0, 36.95],
          [5.0, 37.0],
          [6.0, 37.2],
          [7.0, 37.25],
          [8.0, 37.25],
          [8.6, 37.2],
          [9.8, 37.45],
          [10.4, 37.4],
          [11.35, 37.0],
          [11.4, 36.1],
          [11.5, 35.2],
          [11.3, 34.3],
          [11.3, 33.6],
          ...SYRTIS_SEA.slice().reverse(),
          [19.0, 30.7],
          "-philaeni",
          "-syrtis-inland",
          [10.0, 34.3],
          [9.8, 34.9],
          [9.4, 35.4],
          [9.0, 35.9],
          [8.85, 36.4],
          [8.6, 36.95],
          [7.8, 36.75],
          [6.6, 36.85],
          [5.8, 36.65],
          [4.5, 36.75],
          [3.1, 36.6],
          [2.0, 36.35],
          [0.5, 35.85],
          [-0.8, 35.55],
          [-2.0, 34.95],
          [-3.0, 35.05],
          [-4.0, 35.1],
          [-5.0, 35.2],
          [-5.6, 35.6],
          [-5.85, 35.4],
          [-5.95, 35.1],
          [-6.3, 34.95],
        ],
        // Southern Spain: Gades, Malaca, Sexi, Abdera, Baria.
        [
          [-6.6, 36.4],
          [-6.45, 36.75],
          [-6.0, 36.75],
          [-5.3, 36.7],
          [-4.4, 36.9],
          [-3.5, 36.95],
          [-2.6, 37.05],
          [-1.85, 37.4],
          [-1.6, 37.15],
          [-2.5, 36.5],
          [-4.5, 36.3],
          [-5.35, 36.05],
          [-5.65, 35.97],
          [-6.1, 36.05],
        ],
        // Western Sicily, west of the Halycus.
        ["halycus", [12.9, 38.35], [11.95, 38.1], [12.2, 37.45]],
        ISLANDS.sardinia,
        ISLANDS.corsica,
        ISLANDS.mallorca,
        ISLANDS.menorca,
        ISLANDS.ibiza,
        ISLANDS.formentera,
        ISLANDS.malta,
        ISLANDS.gozo,
      ],
    },
    {
      polityId: "syracuse",
      polygons: [["syracuse-west", [15.3, 36.4], [15.6, 37.0], [15.5, 37.6]]],
    },
    {
      polityId: "greek-city-states",
      polygons: [
        GREECE_SOUTH_WEST,
        ISLANDS.corcyra,
        ISLANDS.crete,
        ISLANDS.rhodes,
        ISLANDS.lesbos,
        ISLANDS.chios,
        ...CYCLADES,
        MASSALIA,
        EMPORION,
        BYZANTIUM,
        BLACK_SEA_WEST,
        OLBIA,
        CHERSONESOS,
        HERACLEA_PONTICA,
        SINOPE,
      ],
    },
    {
      polityId: "macedon",
      polygons: [
        // Macedonia, Paeonia and Thessaly under Antigonus II Gonatas.
        [
          "macedon-north",
          [24.55, 40.35],
          [24.55, 39.95],
          "-magnesia-sea",
          "-othrys",
          "-pindus-south",
          "-pindus-epirus",
          "-pindus-illyria",
        ],
        ISLANDS.euboea,
      ],
    },
    {
      polityId: "epirus",
      polygons: [
        [
          [19.9, 40.4],
          [20.5, 40.5],
          "pindus-epirus",
          "pindus-south",
          "-ambracian",
          { coast: [[20.74, 38.96], [19.47, 40.42]] },
        ],
      ],
    },
    {
      polityId: "ptolemaic-egypt",
      polygons: [
        // Egypt, Judaea, Phoenicia and Coele-Syria.
        [
          ...EGYPT_SEA,
          [34.75, 32.4],
          [35.0, 33.0],
          [35.2, 33.6],
          [35.4, 34.3],
          "coele-syria",
          [36.72, 32.75],
          [36.42, 31.21],
          [35.35, 31.14],
          [34.61, 30.44],
          [32.92, 30.12],
          [32.55, 29.95],
          [32.7, 29.4],
          [33.9, 27.6],
          [34.4, 26.6],
          [35.2, 25.0],
          [35.9, 23.9],
          [33.76, 23.69],
          [31.67, 23.75],
          [30.46, 23.36],
          [29.67, 24.2],
          [28.57, 24.65],
          [28.29, 25.16],
          [28.35, 26.58],
          [28.15, 27.35],
          [27.07, 28.32],
          [24.93, 29.47],
          [24.82, 30.44],
          [25.06, 30.69],
          [24.94, 31.34],
          [25.1, 31.59],
        ],
        // Caria south of the Ceramic Gulf, Lycia, Pamphylia, Rough Cilicia.
        [
          "ptolemaic-anatolia",
          [34.5, 36.4],
          [33.0, 35.9],
          [31.9, 36.35],
          [30.75, 36.6],
          [30.6, 36.1],
          [29.6, 36.0],
          [28.5, 36.4],
          [27.9, 36.6],
        ],
        ISLANDS.cyprus,
      ],
    },
    {
      polityId: "seleucid-empire",
      polygons: [
        [
          "ptolemaic-anatolia",
          [35.4, 36.4],
          [35.75, 35.9],
          "coele-syria",
          [39.12, 34.49],
          [40.26, 34.29],
          [40.7, 34.16],
          [43.15, 32.81],
          [44.58, 31.34],
          [44.95, 31.27],
          [45.77, 30.44],
          [46.59, 30.31],
          [46.62, 29.86],
          [47.7, 29.9],
          [48.6, 29.8],
          ...PERSIAN_GULF,
          ...IRAN_EAST,
          [44.87, 37.0],
          [44.77, 37.38],
          [44.41, 37.58],
          [41.67, 38.03],
          [40.57, 38.03],
          [40.6, 38.22],
          [39.45, 38.42],
          "-pontus-264",
          [34.48, 38.8],
          [33.27, 38.55],
          [31.42, 38.87],
          [31.23, 39.32],
          [31.38, 39.97],
          [30.59, 39.97],
          [30.46, 40.23],
          [29.4, 40.74],
          { coast: [[29.05, 40.37], [26.85, 39.5]] },
          "pergamon-264",
          { coast: [[26.85, 38.6], [28.25, 37.03]] },
        ],
      ],
    },
    {
      polityId: "pergamon",
      polygons: [["pergamon-264", { coast: [[26.85, 38.6], [26.85, 39.5]] }]],
    },
    {
      polityId: "pontus",
      polygons: [
        [
          [32.0, 41.85],
          [32.11, 41.59],
          [32.31, 41.2],
          [33.31, 41.59],
          [34.33, 41.52],
          [34.26, 40.94],
          [34.6, 40.48],
          [34.54, 39.97],
          "pontus-264",
          [38.96, 39.45],
          [38.74, 39.58],
          [38.93, 39.77],
          [38.79, 39.9],
          [40.4, 40.1],
          [40.75, 40.36],
          [40.57, 40.68],
          [41.26, 41.07],
          [41.55, 41.5],
          [41.5, 41.8],
          [40.0, 41.3],
          [38.0, 41.25],
          [36.4, 41.6],
          [36.0, 41.95],
          "sinope",
          [33.0, 42.15],
        ],
      ],
    },
    // Batch 2: kingdoms in the gaps left between the Seleucid realm and Pontus.
    { polityId: "bithynia", polygons: [BITHYNIA_264] },
    { polityId: "galatia", polygons: [GALATIA_264] },
    { polityId: "armenia", polygons: [ARMENIA_EARLY] },
  ],
};

const bce146 = {
  year: -146,
  sources: [
    SHEPHERD_ROMAN,
    SHEPHERD_ITALY,
    {
      title: "Fossa regia (Wikipedia): the boundary of the province of Africa",
      url: "https://en.wikipedia.org/wiki/Fossa_regia",
    },
    {
      title: "Hispania Citerior (Wikipedia)",
      url: "https://en.wikipedia.org/wiki/Hispania_Citerior",
    },
    WIKI_BITHYNIA,
    WIKI_GALATIA,
    WIKI_CAPPADOCIA,
    WIKI_ARMENIA,
    WIKI_MAURETANIA,
    CLIOPATRIA,
  ],
  features: [
    {
      polityId: "rome",
      polygons: [
        AGER_ROMANUS,
        // Cispadane Gaul: colonies and land along the Via Aemilia.
        ["po-lower", "cispadana-west", "rubicon-line"],
        ISLANDS.sicily,
        ISLANDS.sardinia,
        ISLANDS.corsica,
        ISLANDS.malta,
        ISLANDS.gozo,
        // Hispania Citerior and Ulterior.
        [
          "-pyrenees-east",
          [-0.6, 42.4],
          [-1.6, 42.4],
          [-2.0, 42.2],
          [-1.9, 41.6],
          [-1.5, 41.0],
          [-1.2, 40.2],
          [-1.6, 39.4],
          [-2.2, 38.7],
          [-3.0, 38.4],
          [-3.8, 38.35],
          [-4.8, 38.3],
          [-5.8, 38.0],
          [-6.6, 37.7],
          [-7.3, 37.3],
          [-7.42, 37.18],
          [-7.5, 36.9],
          [-6.6, 36.4],
          [-6.1, 36.05],
          [-5.65, 35.97],
          [-5.35, 36.05],
          [-4.5, 36.3],
          [-2.5, 36.5],
          [-1.6, 37.15],
          [-0.4, 37.5],
          [0.4, 38.6],
          [0.3, 39.6],
          [1.2, 40.5],
          [2.5, 41.1],
          [3.4, 41.8],
        ],
        // Africa, inside the Fossa Regia.
        ["fossa-regia", [11.5, 35.2], [11.4, 36.1], [11.35, 37.0], [10.4, 37.4], [9.8, 37.45]],
        // Macedonia, Epirus, Thessaly and Achaea, with southern Illyria.
        [
          [19.4, 41.8],
          [19.62, 41.8],
          [20.0, 41.95],
          "macedon-north",
          [24.55, 40.35],
          [24.55, 39.95],
          "-magnesia-sea",
          { coast: [[22.622, 38.914], [24.02, 37.65]] },
          [23.9, 37.45],
          [23.65, 37.25],
          [23.35, 36.95],
          [23.3, 36.35],
          [22.9, 36.05],
          [22.3, 36.3],
          [21.6, 36.6],
          [20.5, 37.55],
          [20.25, 38.1],
          [20.4, 38.7],
          [20.6, 38.88],
          { coast: [[20.74, 38.96], [19.62, 41.8]] },
        ],
        ISLANDS.euboea,
        ISLANDS.corcyra,
      ],
    },
    {
      polityId: "italian-allies",
      polygons: [
        // Etruria, Umbria, Liguria, Transpadane Gaul and the Veneti.
        [
          [10.0, 43.3],
          [9.6, 43.8],
          [8.8, 44.1],
          [7.9, 43.7],
          [7.75, 44.5],
          [7.6, 45.0],
          [7.7, 45.5],
          [8.3, 45.8],
          [9.0, 45.85],
          [10.0, 45.8],
          [10.85, 45.7],
          [11.5, 45.75],
          [12.2, 45.95],
          [13.0, 46.1],
          [13.6, 45.85],
          [13.4, 45.55],
          [12.7, 45.2],
          "po-lower",
          "cispadana-west",
          "rubicon-line",
          "-ager-romanus-north",
          [10.9, 42.1],
          [9.95, 42.6],
        ],
        ALLIES_SOUTH,
      ],
    },
    {
      polityId: "gauls",
      polygons: [GAUL],
    },
    {
      polityId: "numidia",
      polygons: [
        [
          "fossa-regia",
          [11.2, 34.2],
          [11.3, 33.6],
          ...SYRTIS_SEA.slice().reverse(),
          [19.0, 30.7],
          "-philaeni",
          "-syrtis-inland",
          [9.3, 33.9],
          [8.0, 34.3],
          [6.0, 34.6],
          [4.0, 35.0],
          [2.0, 35.0],
          [0.0, 34.8],
          [-1.5, 34.6],
          [-2.35, 34.7],
          [-2.35, 35.15],
          [-2.3, 35.4],
          [0.0, 36.3],
          [3.0, 37.0],
          [6.0, 37.3],
          [8.0, 37.3],
        ],
      ],
    },
    {
      polityId: "greek-city-states",
      polygons: [
        ISLANDS.crete,
        ISLANDS.rhodes,
        ISLANDS.lesbos,
        ISLANDS.chios,
        ...CYCLADES,
        MASSALIA,
        BYZANTIUM,
        BLACK_SEA_WEST,
        OLBIA,
        CHERSONESOS,
        HERACLEA_PONTICA,
      ],
    },
    {
      polityId: "ptolemaic-egypt",
      polygons: [
        // Egypt and Cyrenaica.
        [
          ...EGYPT_SEA,
          "raphia",
          [32.92, 30.12],
          [32.55, 29.95],
          [32.7, 29.4],
          [33.9, 27.6],
          [34.4, 26.6],
          [35.2, 25.0],
          [35.9, 23.9],
          [33.76, 23.69],
          [31.67, 23.75],
          [30.46, 23.36],
          [29.67, 24.2],
          [28.57, 24.65],
          [28.29, 25.16],
          [28.15, 27.35],
          [26.85, 28.44],
          [24.92, 29.34],
          [23.23, 30.5],
          [21.95, 30.89],
          [20.58, 30.89],
          [19.57, 30.12],
          "philaeni",
          [19.7, 31.2],
          [19.85, 32.2],
          [20.6, 32.9],
          [21.8, 33.15],
          [23.0, 32.85],
          [24.0, 32.3],
        ],
        ISLANDS.cyprus,
      ],
    },
    {
      polityId: "seleucid-empire",
      polygons: [
        [
          [35.7, 36.5],
          [35.6, 35.3],
          [35.4, 34.3],
          [35.2, 33.6],
          [35.0, 33.0],
          [34.75, 32.4],
          "raphia",
          [35.45, 31.1],
          [36.0, 32.5],
          [36.69, 32.49],
          [36.9, 33.07],
          [37.99, 33.97],
          [39.51, 34.49],
          [40.85, 34.1],
          [43.15, 32.81],
          [45.77, 30.44],
          [46.59, 30.31],
          [46.62, 29.86],
          [47.7, 29.9],
          [48.6, 29.8],
          "zagros-146",
          [44.87, 37.0],
          [44.77, 37.38],
          [44.41, 37.58],
          [40.57, 38.03],
          [40.45, 38.29],
          [39.46, 38.48],
          [39.18, 38.16],
          [38.42, 38.35],
          [38.15, 38.03],
          [37.76, 38.09],
          [37.64, 37.71],
          [38.16, 36.87],
          [37.2, 36.61],
          [36.15, 36.95],
        ],
      ],
    },
    {
      polityId: "parthia",
      polygons: [
        [
          "-zagros-146",
          ...PERSIAN_GULF,
          [57.77, 26.0],
          [58.4, 26.84],
          [60.24, 28.25],
          [62.73, 31.46],
          [63.3, 32.11],
          [64.69, 32.94],
          [65.39, 34.1],
          [66.69, 34.42],
          [66.33, 34.87],
          [66.34, 35.26],
          [65.64, 35.58],
          [65.4, 36.22],
          [65.58, 36.67],
          [65.42, 37.0],
          [65.72, 37.58],
          [64.67, 38.67],
          [63.94, 40.1],
          [62.5, 40.03],
          [60.71, 39.51],
          [60.68, 39.71],
          [59.77, 39.84],
          [59.77, 40.16],
          [58.33, 40.42],
          [57.24, 40.16],
          [56.99, 40.42],
          [52.6, 40.9],
          [52.5, 40.1],
          [53.0, 39.0],
          [53.6, 37.9],
          [53.5, 37.0],
          [51.3, 36.9],
          [50.53, 36.87],
          [50.32, 37.0],
          [49.85, 37.45],
          [49.09, 37.51],
          [48.87, 38.09],
          [48.33, 38.09],
          [47.25, 38.67],
          [46.12, 38.48],
          [45.63, 37.9],
          [45.22, 37.77],
          [45.17, 37.45],
          [45.45, 37.19],
        ],
      ],
    },
    {
      polityId: "pergamon",
      polygons: [
        [
          { coast: [[29.05, 40.37], [27.26, 37.86]] },
          [28.45, 38.05],
          [28.75, 37.6],
          [29.65, 37.15],
          [30.1, 36.95],
          [30.55, 36.85],
          [30.7, 36.5],
          [31.45, 36.6],
          [31.6, 37.2],
          [33.6, 37.65],
          [33.59, 38.55],
          [31.42, 38.87],
          [31.23, 39.32],
          [31.38, 39.97],
          [30.59, 39.97],
          [29.94, 40.55],
          [29.4, 40.5],
        ],
      ],
    },
    {
      polityId: "pontus",
      polygons: [
        [
          [32.0, 41.85],
          [32.11, 41.59],
          [32.31, 41.2],
          [33.31, 41.59],
          [34.33, 41.52],
          [34.54, 39.97],
          [35.44, 39.58],
          [37.86, 39.45],
          [38.83, 39.06],
          [38.79, 39.9],
          [40.4, 40.1],
          [40.75, 40.36],
          [40.57, 40.68],
          [41.35, 41.13],
          [41.55, 41.5],
          [41.5, 41.8],
          [40.0, 41.3],
          [38.0, 41.25],
          [36.4, 41.6],
          [36.0, 41.95],
          [35.2, 42.25],
          [34.4, 42.2],
          [33.0, 42.15],
        ],
      ],
    },
    // Batch 2: the kingdoms of Asia Minor and Mauretania.
    { polityId: "bithynia", polygons: [BITHYNIA_146] },
    { polityId: "galatia", polygons: [GALATIA_146] },
    { polityId: "cappadocia", polygons: [CAPPADOCIA_146] },
    { polityId: "armenia", polygons: [ARMENIA_146] },
    { polityId: "mauretania", polygons: [MAURETANIA] },
  ],
};

// ------------------------------------------------- batch 2: the snapshots

/**
 * A polygon of a batch 1 snapshot, reused where a border did not move.
 * `start` is its expected first piece, so a reordered list fails loudly.
 */
function polygonOf(snapshot, polityId, index, start) {
  const polygon = snapshot.features.find((f) => f.polityId === polityId)?.polygons[index];
  const first = Array.isArray(polygon) ? polygon[0] : polygon;
  if (!polygon || JSON.stringify(first) !== JSON.stringify(start)) {
    throw new Error(`polygon ${index} of ${polityId} in ${snapshot.year} is not the expected shape`);
  }
  return polygon;
}

const MAGNA_GRAECIA = polygonOf(bce509, "greek-city-states", 2, [15.6, 38.9]);
const GREECE_509 = polygonOf(bce509, "greek-city-states", 7, [22.75, 40.05]);
const CYRENE = polygonOf(bce509, "greek-city-states", 24, [19.85, 32.2]);
const NORTH_AFRICA_264 = polygonOf(bce264, "carthage", 0, [-6.6, 35.0]);
const SPAIN_COAST_264 = polygonOf(bce264, "carthage", 1, [-6.6, 36.4]);
const SICILY_WEST = polygonOf(bce264, "carthage", 2, "halycus");
const SYRACUSE_264 = polygonOf(bce264, "syracuse", 0, "syracuse-west");
const CISALPINE_264 = polygonOf(bce264, "gauls", 1, "-rubicon-line");
const MACEDON_264 = polygonOf(bce264, "macedon", 0, "macedon-north");
const EPIRUS_264 = polygonOf(bce264, "epirus", 0, [19.9, 40.4]);
const PTOLEMAIC_264 = polygonOf(bce264, "ptolemaic-egypt", 0, EGYPT_SEA[0]);
const PTOLEMAIC_ANATOLIA = polygonOf(bce264, "ptolemaic-egypt", 1, "ptolemaic-anatolia");
const PERGAMON_264 = polygonOf(bce264, "pergamon", 0, "pergamon-264");
const PONTUS_264 = polygonOf(bce264, "pontus", 0, [32.0, 41.85]);
const CISPADANA = polygonOf(bce146, "rome", 1, "po-lower");
const HISPANIA_146 = polygonOf(bce146, "rome", 7, "-pyrenees-east");
const AFRICA_PROVINCE = polygonOf(bce146, "rome", 8, "fossa-regia");
const MACEDONIA_ACHAEA = polygonOf(bce146, "rome", 9, [19.4, 41.8]);
const ITALY_NORTH_146 = polygonOf(bce146, "italian-allies", 0, [10.0, 43.3]);
const NUMIDIA_146 = polygonOf(bce146, "numidia", 0, "fossa-regia");
const PERGAMON_146 = polygonOf(bce146, "pergamon", 0, { coast: [[29.05, 40.37], [27.26, 37.86]] });
const PONTUS_146 = polygonOf(bce146, "pontus", 0, [32.0, 41.85]);
const PARTHIA_146 = polygonOf(bce146, "parthia", 0, "-zagros-146");

// ------------------------------------------------- T-012: review of batch 2
// Shapes added when batch 2 was checked against Shepherd and Cliopatria
// (docs/data/BORDERS.md, "Soát lại đợt 2").

const WIKI_SENONES = wiki("Senones: the Adriatic coast from Ariminum to Ancona, subdued in 283 BC", "Senones");
const WIKI_PICENTES = wiki("Picentes: treaty with Rome in 299 BC", "Picentes");
const WIKI_ETRUSCAN_WARS = wiki(
  "Roman–Etruscan Wars: Etruria conquered in 265–264 BC",
  "Roman%E2%80%93Etruscan_Wars",
);
const WIKI_CISALPINE = wiki(
  "Cisalpine Gaul: the revolt of 218 BC and the conquest completed in 191 BC",
  "Cisalpine_Gaul",
);
const WIKI_LIGURES = wiki("Ligures: subdued between 187 and 155 BC", "Ligures");
const WIKI_ILLYRIAN_WARS = wiki("Illyrian Wars: the Roman protectorate of 229 BC", "Illyrian_Wars");
const WIKI_CELTIBERIAN = wiki(
  "Celtiberian Wars: the provinces after 201 BC and the peace of 179 BC",
  "Celtiberian_Wars",
);
const WIKI_TIGRANES = wiki("Tigranes the Great: the seventy valleys ceded to Parthia", "Tigranes_the_Great");
const WIKI_PONTUS_PROVINCE = wiki(
  "Bithynia and Pontus: Pompey's province and the client kingdom of eastern Pontus",
  "Bithynia_et_Pontus",
);
const WIKI_APAMEA = wiki("Treaty of Apamea: Cilicia kept by Antiochus, Lycia and Caria to Rhodes", "Treaty_of_Apamea");
const WIKI_ILLYRICUM = wiki("Illyricum: Caesar's command from 59 BC", "Illyricum_(Roman_province)");

/** Cisalpine Gaul with the Senones' coast down to the Aesis (until 283). */
const CISALPINE_SENONES = [...CISALPINE_264.slice(1), [12.95, 44.4], "-senones", "-rubicon-west"];
/** Picenum, allied by the treaty of 299, between the Senones and Rome (290). */
const PICENUM_290 = [
  [13.0, 43.42],
  [13.25, 43.5],
  [13.35, 43.63],
  [13.6, 43.85],
  [14.1, 43.4],
  [13.9, 42.95],
  [13.15, 42.95],
  [13.05, 43.15],
];
/** The Roman protectorate in southern Illyria from 229: Apollonia, Epidamnus, the Parthini, the Atintani. */
const ILLYRIA_229 = [
  { coast: [[19.47, 40.42], [19.58, 41.62]] },
  [19.95, 41.62],
  [20.15, 41.3],
  [20.1, 40.85],
  [19.9, 40.4],
];
/** The same after the Third Illyrian War (168), north to Lissus. */
const ILLYRIA_168 = [
  { coast: [[19.47, 40.42], [19.62, 41.8]] },
  [20.0, 41.95],
  [20.15, 41.4],
  [20.1, 40.85],
  [19.9, 40.4],
];
/** Roman Spain in 201: the 146 shape without the upper Ebro valley, won in 181–179. */
const HISPANIA_201 = (() => {
  const cut = HISPANIA_146.findIndex((piece) => JSON.stringify(piece) === "[-1.2,40.2]");
  if (HISPANIA_146[0] !== "-pyrenees-east" || cut !== 6) throw new Error("HISPANIA_146 changed");
  return [HISPANIA_146[0], [0.3, 41.9], [-0.5, 41.45], [-1.1, 40.85], ...HISPANIA_146.slice(cut)];
})();
/** Attalus I's Pergamon (218, 201) and the Seleucid realm around it. */
const PERGAMON_ATTALID = ["pergamon-attalid", { coast: [[27.26, 37.86], [26.85, 39.5]] }];
const SELEUCID_ATTALID = (() => {
  const tail = SELEUCID_EARLY.slice(-2);
  if (tail[0] !== "pergamon-264") throw new Error("SELEUCID_EARLY changed");
  return [...SELEUCID_EARLY.slice(0, -2), "pergamon-attalid", { coast: [[27.26, 37.86], [28.25, 37.03]] }];
})();
/** Caria south of the Maeander and Lycia, Rhodian from 188 to 167 (Cliopatria "Rhodes"). */
const RHODIAN_PERAEA = [
  { coast: [[27.26, 37.86], [30.57, 36.7]] },
  [30.58, 36.78],
  [30.55, 36.85],
  [30.1, 36.95],
  [29.65, 37.15],
  [28.75, 37.6],
  [28.45, 38.05],
];
/**
 * Pompey's Pontus (63): the Black Sea coast from Amastris to Trapezus, joined
 * to Bithynia; the interior was left to client kings (Cliopatria "Kingdom of
 * Pontus", −63 to −26), and is left blank.
 */
const PONTUS_COAST = [
  [32.0, 41.85],
  [32.11, 41.59],
  [32.31, 41.2],
  [33.31, 41.59],
  [34.33, 41.52],
  [34.4, 41.0],
  [35.1, 41.1],
  [35.64, 41.05],
  [36.09, 40.85],
  [36.47, 40.8],
  [36.9, 41.0],
  [37.44, 40.95],
  [37.83, 40.85],
  [38.3, 40.8],
  [38.78, 40.85],
  [39.05, 40.95],
  [39.74, 40.85],
  [40.37, 40.85],
  [40.54, 40.9],
  [41.05, 41.1],
  [41.35, 41.13],
  [41.55, 41.5],
  [41.5, 41.8],
  [40.0, 41.3],
  [38.0, 41.25],
  [36.4, 41.6],
  [36.0, 41.95],
  [35.2, 42.25],
  [34.4, 42.2],
  [33.0, 42.15],
];
/** Illyricum, the coast from the Timavus to Lissus: Caesar's command from 59 (Shepherd: Roman by 44). */
const ILLYRICUM = [
  [13.6, 45.85],
  [13.95, 45.75],
  [14.6, 45.45],
  [15.3, 45.1],
  [15.9, 44.6],
  [16.5, 44.1],
  [17.1, 43.7],
  [17.8, 43.35],
  [18.5, 42.9],
  [19.2, 42.5],
  [19.6, 42.2],
  [20.0, 41.95],
  [19.62, 41.8],
  [19.4, 41.8],
  [19.1, 41.85],
  [18.4, 42.2],
  [17.3, 42.55],
  [16.2, 42.85],
  [15.6, 43.3],
  [14.6, 44.1],
  [13.8, 44.6],
  [13.3, 45.0],
  [13.4, 45.55],
];
/** The Seleucid rump in 88, without Hasmonean Judaea (Cliopatria, −91 to −78). */
const SYRIA_88 = [
  [35.7, 36.5],
  [35.6, 35.3],
  [35.4, 34.3],
  [35.2, 33.6],
  [35.0, 33.0],
  [34.6, 32.45],
  [34.85, 32.43],
  [35.16, 32.43],
  [35.4, 32.56],
  [35.53, 33.2],
  [35.7, 33.33],
  [36.05, 33.01],
  [35.93, 32.49],
  [36.69, 32.49],
  [36.9, 33.07],
  [37.99, 33.97],
  [39.51, 34.49],
  ...EUPHRATES,
  [37.2, 36.61],
  [36.15, 36.95],
];
/** Armenia in 88, before Tigranes took back the seventy valleys (Cliopatria, −91 to −88). */
const ARMENIA_88 = [
  [38.83, 39.06],
  [38.79, 39.9],
  [40.4, 40.1],
  [40.75, 40.36],
  [40.57, 40.68],
  [41.35, 41.13],
  [42.5, 41.4],
  [44.0, 41.2],
  [44.79, 41.26],
  [44.85, 40.68],
  [44.52, 40.61],
  [44.64, 40.42],
  [44.5, 39.58],
  [44.07, 39.38],
  [44.36, 38.74],
  [44.32, 38.48],
  [43.95, 38.16],
  [43.89, 37.71],
  [42.8, 37.77],
  [41.67, 38.03],
  [40.57, 38.03],
  [40.45, 38.29],
  [39.46, 38.48],
];

const ITALY_ROMAN = [AGER_ROMANUS, CISPADANA, ITALY_NORTH_146, ALLIES_SOUTH];
const WEST_ISLANDS = [ISLANDS.sicily, ISLANDS.sardinia, ISLANDS.corsica, ISLANDS.malta, ISLANDS.gozo];
const BALEARICS = [ISLANDS.mallorca, ISLANDS.menorca, ISLANDS.ibiza, ISLANDS.formentera];
const GREEK_EAST = [ISLANDS.crete, ISLANDS.rhodes, ISLANDS.lesbos, ISLANDS.chios, ...CYCLADES];
const FOSSA_REGIA = wiki(
  "Fossa regia: the boundary between Carthage's (later Roman) land and Numidia",
  "Fossa_regia",
);
/** Asia Minor and the east, as they stood from 241 to 201. */
const EAST_EARLY = [
  { polityId: "ptolemaic-egypt", polygons: [PTOLEMAIC_264, PTOLEMAIC_ANATOLIA, CYRENAICA, ISLANDS.cyprus] },
  { polityId: "seleucid-empire", polygons: [SELEUCID_EARLY] },
  { polityId: "pergamon", polygons: [PERGAMON_264] },
  { polityId: "pontus", polygons: [PONTUS_264] },
  { polityId: "bithynia", polygons: [BITHYNIA_264] },
  { polityId: "galatia", polygons: [GALATIA_264] },
  { polityId: "cappadocia", polygons: [CAPPADOCIA_EARLY] },
  { polityId: "armenia", polygons: [ARMENIA_EARLY] },
  { polityId: "parthia", polygons: [PARTHIA_EARLY] },
];
/** The east in 218 and 201: Attalus I's larger Pergamon. */
const EAST_ATTALID = EAST_EARLY.map((feature) =>
  feature.polityId === "seleucid-empire"
    ? { ...feature, polygons: [SELEUCID_ATTALID] }
    : feature.polityId === "pergamon"
      ? { ...feature, polygons: [PERGAMON_ATTALID] }
      : feature,
);
const SOURCES_EAST = [WIKI_PARTHIA, WIKI_GALATIA, WIKI_BITHYNIA, WIKI_CAPPADOCIA, WIKI_ARMENIA];

const bce338 = {
  year: -338,
  sources: [WIKI_ACHAEMENID, SHEPHERD_ITALY, SHEPHERD_COLONIES, WIKI_SENONES, CLIOPATRIA],
  features: [
    { polityId: "rome", polygons: [ROME_338] },
    { polityId: "etruscans", polygons: [ETRURIA_338] },
    { polityId: "samnites", polygons: [SAMNIUM_338] },
    { polityId: "gauls", polygons: [GAUL, CISALPINE_SENONES] },
    {
      polityId: "greek-city-states",
      polygons: [
        GREECE_SOUTH_WEST,
        ISLANDS.euboea,
        ISLANDS.corcyra,
        ISLANDS.crete,
        ...CYCLADES,
        MAGNA_GRAECIA,
        CYRENE,
        MASSALIA,
        EMPORION,
        BYZANTIUM,
        BLACK_SEA_WEST,
        OLBIA,
        CHERSONESOS,
        HERACLEA_PONTICA,
        SINOPE,
      ],
    },
    { polityId: "syracuse", polygons: [SICILY_EAST] },
    {
      polityId: "carthage",
      polygons: [
        NORTH_AFRICA_264,
        SPAIN_COAST_264,
        SICILY_WEST,
        ISLANDS.sardinia,
        ISLANDS.malta,
        ISLANDS.gozo,
        ISLANDS.ibiza,
        ISLANDS.formentera,
      ],
    },
    { polityId: "macedon", polygons: [MACEDON_338] },
    { polityId: "epirus", polygons: [EPIRUS_264] },
    { polityId: "achaemenid-empire", polygons: [PERSIA, ISLANDS.cyprus] },
  ],
};

const bce290 = {
  year: -290,
  sources: [
    SHEPHERD_ITALY,
    WIKI_ETRUSCAN_WARS,
    WIKI_PICENTES,
    WIKI_SENONES,
    SHEPHERD_DIADOCHI,
    WIKI_BITHYNIA,
    WIKI_CAPPADOCIA,
    WIKI_ARMENIA,
    CLIOPATRIA,
  ],
  features: [
    { polityId: "rome", polygons: [AGER_ROMANUS_290] },
    { polityId: "italian-allies", polygons: [PICENUM_290, ALLIES_SOUTH_290] },
    { polityId: "etruscans", polygons: [ETRURIA_338] },
    { polityId: "gauls", polygons: [GAUL, CISALPINE_SENONES] },
    {
      polityId: "greek-city-states",
      polygons: [
        MAGNA_GRAECIA,
        GREECE_SOUTH_WEST,
        ISLANDS.corcyra,
        ...GREEK_EAST,
        MASSALIA,
        EMPORION,
        BYZANTIUM,
        BLACK_SEA_WEST,
        OLBIA,
        CHERSONESOS,
        HERACLEA_PONTICA,
        SINOPE,
      ],
    },
    { polityId: "syracuse", polygons: [SICILY_EAST] },
    {
      polityId: "carthage",
      polygons: [
        NORTH_AFRICA_264,
        SPAIN_COAST_264,
        SICILY_WEST,
        ISLANDS.sardinia,
        ISLANDS.malta,
        ISLANDS.gozo,
        ISLANDS.ibiza,
        ISLANDS.formentera,
      ],
    },
    { polityId: "macedon", polygons: [MACEDON_264, ISLANDS.euboea] },
    { polityId: "epirus", polygons: [EPIRUS_264] },
    { polityId: "ptolemaic-egypt", polygons: [PTOLEMAIC_264, CYRENAICA, ISLANDS.cyprus] },
    { polityId: "seleucid-empire", polygons: [SELEUCID_290] },
    { polityId: "bithynia", polygons: [BITHYNIA_264] },
    { polityId: "cappadocia", polygons: [CAPPADOCIA_EARLY] },
    { polityId: "armenia", polygons: [ARMENIA_EARLY] },
  ],
};

const bce241 = {
  year: -241,
  sources: [WIKI_PROVINCES, SHEPHERD_ROMAN, SHEPHERD_ITALY, SHEPHERD_DIADOCHI, ...SOURCES_EAST, CLIOPATRIA],
  features: [
    { polityId: "rome", polygons: [AGER_ROMANUS, SICILY_NON_SYRACUSE] },
    { polityId: "italian-allies", polygons: [ALLIES_NORTH_264, ALLIES_SOUTH] },
    { polityId: "gauls", polygons: [GAUL, CISALPINE_264] },
    { polityId: "syracuse", polygons: [SYRACUSE_264] },
    {
      polityId: "carthage",
      polygons: [
        NORTH_AFRICA_264,
        SPAIN_COAST_264,
        ISLANDS.sardinia,
        ISLANDS.corsica,
        ...BALEARICS,
        ISLANDS.malta,
        ISLANDS.gozo,
      ],
    },
    {
      polityId: "greek-city-states",
      polygons: [
        GREECE_SOUTH_WEST,
        ISLANDS.corcyra,
        ...GREEK_EAST,
        MASSALIA,
        EMPORION,
        BYZANTIUM,
        BLACK_SEA_WEST,
        OLBIA,
        CHERSONESOS,
        HERACLEA_PONTICA,
        SINOPE,
      ],
    },
    { polityId: "macedon", polygons: [MACEDON_264, ISLANDS.euboea] },
    { polityId: "epirus", polygons: [EPIRUS_264] },
    ...EAST_EARLY,
  ],
};

const bce218 = {
  year: -218,
  sources: [
    WIKI_PROVINCES,
    SHEPHERD_ROMAN,
    SHEPHERD_ITALY,
    WIKI_CISALPINE,
    WIKI_LIGURES,
    WIKI_ILLYRIAN_WARS,
    SHEPHERD_DIADOCHI,
    ...SOURCES_EAST,
    CLIOPATRIA,
  ],
  features: [
    {
      polityId: "rome",
      polygons: [
        AGER_ROMANUS,
        SICILY_NON_SYRACUSE,
        ISLANDS.sardinia,
        ISLANDS.corsica,
        ISLANDS.corcyra,
        ILLYRIA_229,
      ],
    },
    { polityId: "italian-allies", polygons: [ALLIES_NORTH_264, ALLIES_SOUTH] },
    { polityId: "gauls", polygons: [GAUL, CISALPINE_264] },
    { polityId: "syracuse", polygons: [SYRACUSE_264] },
    {
      polityId: "carthage",
      polygons: [NORTH_AFRICA_264, BARCID_SPAIN, ...BALEARICS, ISLANDS.malta, ISLANDS.gozo],
    },
    {
      polityId: "greek-city-states",
      polygons: [
        GREECE_SOUTH_WEST,
        ...GREEK_EAST,
        MASSALIA,
        EMPORION,
        BYZANTIUM,
        BLACK_SEA_WEST,
        OLBIA,
        CHERSONESOS,
        HERACLEA_PONTICA,
        SINOPE,
      ],
    },
    { polityId: "macedon", polygons: [MACEDON_264, ISLANDS.euboea] },
    { polityId: "epirus", polygons: [EPIRUS_264] },
    ...EAST_ATTALID,
  ],
};

const bce201 = {
  year: -201,
  sources: [
    WIKI_PROVINCES,
    SHEPHERD_ROMAN,
    WIKI_CELTIBERIAN,
    WIKI_CISALPINE,
    WIKI_LIGURES,
    WIKI_ILLYRIAN_WARS,
    SHEPHERD_DIADOCHI,
    FOSSA_REGIA,
    WIKI_MAURETANIA,
    ...SOURCES_EAST,
    CLIOPATRIA,
  ],
  features: [
    {
      polityId: "rome",
      polygons: [AGER_ROMANUS, ...WEST_ISLANDS, ISLANDS.corcyra, HISPANIA_201, ILLYRIA_229],
    },
    { polityId: "italian-allies", polygons: [ALLIES_NORTH_264, ALLIES_SOUTH] },
    { polityId: "gauls", polygons: [GAUL, CISALPINE_264] },
    { polityId: "carthage", polygons: [CARTHAGE_201] },
    { polityId: "numidia", polygons: [NUMIDIA_201] },
    { polityId: "mauretania", polygons: [MAURETANIA] },
    {
      polityId: "greek-city-states",
      polygons: [
        GREECE_SOUTH_WEST,
        ...GREEK_EAST,
        MASSALIA,
        BYZANTIUM,
        BLACK_SEA_WEST,
        OLBIA,
        CHERSONESOS,
        HERACLEA_PONTICA,
        SINOPE,
      ],
    },
    { polityId: "macedon", polygons: [MACEDON_264, ISLANDS.euboea] },
    { polityId: "epirus", polygons: [EPIRUS_264] },
    ...EAST_ATTALID,
  ],
};

const bce168 = {
  year: -168,
  sources: [
    WIKI_PROVINCES,
    SHEPHERD_ROMAN,
    WIKI_CELTIBERIAN,
    WIKI_ILLYRIAN_WARS,
    WIKI_APAMEA,
    FOSSA_REGIA,
    WIKI_MAURETANIA,
    ...SOURCES_EAST,
    CLIOPATRIA,
  ],
  features: [
    {
      polityId: "rome",
      polygons: [AGER_ROMANUS, CISPADANA, ...WEST_ISLANDS, ISLANDS.corcyra, HISPANIA_146, ILLYRIA_168],
    },
    { polityId: "italian-allies", polygons: [ITALY_NORTH_146, ALLIES_SOUTH] },
    { polityId: "gauls", polygons: [GAUL] },
    { polityId: "carthage", polygons: [CARTHAGE_201] },
    { polityId: "numidia", polygons: [NUMIDIA_201] },
    { polityId: "mauretania", polygons: [MAURETANIA] },
    {
      polityId: "greek-city-states",
      polygons: [
        GREECE_509,
        ISLANDS.euboea,
        ...GREEK_EAST,
        RHODIAN_PERAEA,
        MASSALIA,
        BYZANTIUM,
        BLACK_SEA_WEST,
        OLBIA,
        CHERSONESOS,
        HERACLEA_PONTICA,
      ],
    },
    { polityId: "epirus", polygons: [EPIRUS_264] },
    { polityId: "ptolemaic-egypt", polygons: [EGYPT, CYRENAICA, ISLANDS.cyprus] },
    { polityId: "seleucid-empire", polygons: [SYRIA, CILICIA, MESOPOTAMIA, IRAN_168] },
    { polityId: "parthia", polygons: [PARTHIA_EARLY] },
    { polityId: "pergamon", polygons: [PERGAMON_146] },
    { polityId: "pontus", polygons: [PONTUS_146] },
    { polityId: "bithynia", polygons: [BITHYNIA_146] },
    { polityId: "galatia", polygons: [GALATIA_146] },
    { polityId: "cappadocia", polygons: [CAPPADOCIA_146] },
    { polityId: "armenia", polygons: [ARMENIA_146] },
  ],
};

/** Asia Minor's kingdoms between 146 and 30. */
const ANATOLIA_KINGDOMS = [
  { polityId: "galatia", polygons: [GALATIA_146] },
  { polityId: "cappadocia", polygons: [CAPPADOCIA_146] },
  { polityId: "armenia", polygons: [ARMENIA_146] },
];
const GREEK_LATE = [ISLANDS.rhodes, ISLANDS.lesbos, ISLANDS.chios, ...CYCLADES];
const GREEK_NORTH = [BYZANTIUM, BLACK_SEA_WEST, OLBIA, CHERSONESOS, HERACLEA_PONTICA];

const bce129 = {
  year: -129,
  sources: [WIKI_PROVINCES, SHEPHERD_ROMAN, WIKI_PARTHIA, WIKI_MAURETANIA, ...SOURCES_EAST.slice(1), CLIOPATRIA],
  features: [
    {
      polityId: "rome",
      polygons: [
        AGER_ROMANUS,
        CISPADANA,
        ...WEST_ISLANDS,
        HISPANIA_LATE,
        AFRICA_PROVINCE,
        MACEDONIA_ACHAEA,
        ISLANDS.euboea,
        ISLANDS.corcyra,
        PERGAMON_146,
      ],
    },
    { polityId: "italian-allies", polygons: [ITALY_NORTH_146, ALLIES_SOUTH] },
    { polityId: "gauls", polygons: [GAUL] },
    { polityId: "numidia", polygons: [NUMIDIA_146] },
    { polityId: "mauretania", polygons: [MAURETANIA] },
    {
      polityId: "greek-city-states",
      polygons: [ISLANDS.crete, ...GREEK_LATE, MASSALIA, ...GREEK_NORTH],
    },
    { polityId: "ptolemaic-egypt", polygons: [EGYPT, CYRENAICA, ISLANDS.cyprus] },
    { polityId: "seleucid-empire", polygons: [SYRIA] },
    { polityId: "parthia", polygons: [PARTHIA_146, MESOPOTAMIA] },
    { polityId: "pontus", polygons: [PONTUS_146] },
    { polityId: "bithynia", polygons: [BITHYNIA_146] },
    ...ANATOLIA_KINGDOMS,
  ],
};

const bce88 = {
  year: -88,
  sources: [
    WIKI_PROVINCES,
    SHEPHERD_ROMAN,
    WIKI_BITHYNIA,
    WIKI_CAPPADOCIA,
    WIKI_ARMENIA,
    WIKI_TIGRANES,
    WIKI_PARTHIA,
    WIKI_MAURETANIA,
    CLIOPATRIA,
  ],
  features: [
    {
      polityId: "rome",
      polygons: [
        ...ITALY_ROMAN,
        ...WEST_ISLANDS,
        ...BALEARICS,
        HISPANIA_LATE,
        NARBONENSIS,
        AFRICA_PROVINCE,
        MACEDONIA_ACHAEA,
        ISLANDS.euboea,
        ISLANDS.corcyra,
      ],
    },
    { polityId: "gauls", polygons: [GAUL_FREE] },
    { polityId: "numidia", polygons: [NUMIDIA_LATE] },
    { polityId: "mauretania", polygons: [MAURETANIA_LATE] },
    {
      polityId: "greek-city-states",
      polygons: [ISLANDS.crete, ...GREEK_LATE, MASSALIA, BYZANTIUM, BLACK_SEA_WEST, OLBIA, HERACLEA_PONTICA],
    },
    { polityId: "ptolemaic-egypt", polygons: [EGYPT, ISLANDS.cyprus] },
    { polityId: "seleucid-empire", polygons: [SYRIA_88] },
    { polityId: "parthia", polygons: [PARTHIA_146, MESOPOTAMIA] },
    {
      // Mithridates VI at his height: Pontus with Bithynia, Cappadocia,
      // Galatia and the Roman province of Asia, overrun in 89–88, and his
      // Black Sea possessions in the Crimea.
      polityId: "pontus",
      polygons: [PONTUS_146, BITHYNIA_146, CAPPADOCIA_146, GALATIA_146, PERGAMON_146, CHERSONESOS, BOSPORUS],
    },
    { polityId: "armenia", polygons: [ARMENIA_88] },
  ],
};

/** Rome after Pompey's settlement of the East (63, 50, 30). */
const ROME_63 = [
  ...ITALY_ROMAN,
  ...WEST_ISLANDS,
  ...BALEARICS,
  HISPANIA_LATE,
  NARBONENSIS,
  AFRICA_PROVINCE,
  CYRENAICA,
  ISLANDS.crete,
  MACEDONIA_ACHAEA,
  ISLANDS.euboea,
  ISLANDS.corcyra,
  PERGAMON_146,
  BITHYNIA_146,
  PONTUS_COAST,
  CILICIA,
  SYRIA,
];
const SOURCES_LATE = [WIKI_PROVINCES, SHEPHERD_ROMAN, WIKI_PONTUS_PROVINCE, WIKI_ILLYRICUM, WIKI_ARMENIA, WIKI_CAPPADOCIA, WIKI_GALATIA, WIKI_PARTHIA, WIKI_MAURETANIA, CLIOPATRIA];

const bce63 = {
  year: -63,
  sources: SOURCES_LATE,
  features: [
    { polityId: "rome", polygons: ROME_63 },
    { polityId: "gauls", polygons: [GAUL_FREE] },
    { polityId: "numidia", polygons: [NUMIDIA_LATE] },
    { polityId: "mauretania", polygons: [MAURETANIA_LATE] },
    { polityId: "greek-city-states", polygons: [...GREEK_LATE, MASSALIA, ...GREEK_NORTH] },
    { polityId: "ptolemaic-egypt", polygons: [EGYPT, ISLANDS.cyprus] },
    { polityId: "parthia", polygons: [PARTHIA_146, MESOPOTAMIA] },
    ...ANATOLIA_KINGDOMS,
  ],
};

const bce50 = {
  year: -50,
  sources: SOURCES_LATE,
  features: [
    { polityId: "rome", polygons: [...ROME_63, GAUL_FREE, ISLANDS.cyprus, ILLYRICUM] },
    { polityId: "numidia", polygons: [NUMIDIA_LATE] },
    { polityId: "mauretania", polygons: [MAURETANIA_LATE] },
    { polityId: "greek-city-states", polygons: [...GREEK_LATE, MASSALIA, ...GREEK_NORTH] },
    { polityId: "ptolemaic-egypt", polygons: [EGYPT] },
    { polityId: "parthia", polygons: [PARTHIA_146, MESOPOTAMIA] },
    ...ANATOLIA_KINGDOMS,
  ],
};

const bce30 = {
  year: -30,
  sources: SOURCES_LATE,
  features: [
    {
      polityId: "rome",
      polygons: [...ROME_63, GAUL_FREE, ISLANDS.cyprus, ILLYRICUM, EGYPT, NUMIDIA_LATE, MAURETANIA_LATE, MASSALIA],
    },
    { polityId: "greek-city-states", polygons: [...GREEK_LATE, ...GREEK_NORTH] },
    { polityId: "parthia", polygons: [PARTHIA_146, MESOPOTAMIA] },
    ...ANATOLIA_KINGDOMS,
  ],
};

export const snapshots = [
  bce509,
  bce338,
  bce290,
  bce264,
  bce241,
  bce218,
  bce201,
  bce168,
  bce146,
  bce129,
  bce88,
  bce63,
  bce50,
  bce30,
];

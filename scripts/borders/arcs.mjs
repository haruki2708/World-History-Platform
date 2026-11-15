// Shared border lines, as [lng, lat] (WGS84). Each line is drawn once and used
// by the territories on both sides and by every snapshot that needs it, so a
// border never shifts between snapshots unless the history says it moved.
//
// Lines start and end at sea where they meet a coast: the water layer hides
// whatever a territory spills into the sea. See README.md for the sources.

export const arcs = {
  // ---------------------------------------------------------------- Italy

  // Rome's territory at the end of the regal period around the Tiber, after
  // the "Roman territory about 500 B.C." of Shepherd's "Growth of Roman Power
  // in Italy" (it stops short of Veii and of the coast).
  "rome-509-etruria": [
    [12.52, 42.03],
    [12.46, 42.0],
    [12.4, 41.95],
    [12.36, 41.89],
    [12.37, 41.83],
    [12.4, 41.8],
  ],
  "rome-509-latium": [
    [12.4, 41.8],
    [12.5, 41.75],
    [12.65, 41.78],
    [12.74, 41.88],
  ],
  "rome-509-sabines": [
    [12.74, 41.88],
    [12.68, 41.99],
    [12.58, 42.07],
    [12.52, 42.03],
  ],
  // The lower Tiber, from Rome's territory to the sea (Etruria / Latium).
  "tiber-lower": [
    [12.4, 41.8],
    [12.33, 41.77],
    [12.27, 41.74],
    [12.12, 41.7],
  ],
  // The Tiber upstream of Rome, then across to the Apennine crest near its
  // source: the eastern limit of Etruria against the Sabines and Umbrians.
  "tiber-upper": [
    [12.52, 42.03],
    [12.58, 42.12],
    [12.57, 42.25],
    [12.45, 42.4],
    [12.4, 42.6],
    [12.42, 42.75],
    [12.45, 42.95],
    [12.38, 43.1],
    [12.3, 43.3],
    [12.2, 43.48],
    [12.1, 43.65],
    [12.05, 43.85],
  ],
  // Etruscan Campania against the Samnite hills.
  "campania-samnium": [
    [14.05, 41.18],
    [14.4, 41.22],
    [14.65, 40.95],
    [14.95, 40.7],
  ],
  // North of Pisae and Luca: Etruria (later Roman Italy) against the Ligurians.
  apuan: [
    [9.9, 43.9],
    [10.25, 43.92],
    [10.6, 43.98],
  ],
  "apennine-pistoia": [
    [10.6, 43.98],
    [10.95, 44.08],
  ],
  // Roman Italy's northern limit in 264 BCE: the Apennine watershed, then the
  // Rubicon to the Adriatic (Shepherd, "Roman territory at the beginning of
  // the 1st Punic War").
  "rubicon-line": [
    [10.95, 44.08],
    [11.3, 44.1],
    [11.7, 43.95],
    [12.05, 43.85],
    [12.25, 43.98],
    [12.4, 44.17],
    [12.6, 44.45],
  ],
  // Roman citizen territory (ager Romanus) against the allies, 264 and 146 BCE,
  // generalised from Shepherd's "Growth of Roman Power in Italy": the belt from
  // southern Etruria and Latium to Campania, and across the Sabine country to
  // Picenum and the ager Gallicus on the Adriatic.
  "ager-romanus-north": [
    [11.4, 42.15],
    [11.75, 42.2],
    [12.05, 42.25],
    [12.3, 42.17],
    [12.5, 42.3],
    [12.75, 42.5],
    [13.05, 42.75],
    [13.15, 42.95],
    [12.95, 43.25],
    [12.75, 43.45],
    [12.6, 43.7],
    [12.55, 43.95],
    [12.68, 44.03],
    [12.95, 44.05],
  ],
  "ager-romanus-south": [
    [14.3, 42.7],
    [14.02, 42.6],
    [13.7, 42.55],
    [13.45, 42.35],
    [13.3, 42.15],
    [13.25, 41.95],
    [13.45, 41.8],
    [13.7, 41.6],
    [13.95, 41.4],
    [14.2, 41.3],
    [14.45, 41.1],
    [14.35, 40.95],
    [14.12, 40.84],
    [13.9, 40.6],
  ],
  // The Po from the Trebia to the sea, and the Apennine edge of Liguria:
  // the Roman Cispadana of 146 BCE.
  "po-lower": [
    [12.75, 44.95],
    [12.4, 44.95],
    [12.0, 44.95],
    [11.6, 44.92],
    [11.2, 45.03],
    [10.8, 45.03],
    [10.4, 44.97],
    [10.0, 45.05],
    [9.7, 45.07],
    [9.5, 45.1],
  ],
  "cispadana-west": [
    [9.5, 45.1],
    [9.8, 44.7],
    [10.4, 44.35],
    [10.95, 44.08],
  ],
  // The Strait of Messina, midway between Sicily and Calabria.
  "messina-strait": [
    [15.68, 38.3],
    [15.62, 38.2],
    [15.58, 38.1],
    [15.53, 38.0],
    [15.5, 37.85],
  ],

  // --------------------------------------------------------------- Sicily

  // The Halycus (Platani) and across to the north coast east of Thermae:
  // the frontier of the Carthaginian province (treaties of the 4th century).
  halycus: [
    [13.25, 37.2],
    [13.28, 37.39],
    [13.45, 37.55],
    [13.6, 37.72],
    [13.75, 37.85],
    [13.87, 37.98],
    [13.9, 38.2],
  ],
  // Hiero II's kingdom: the south-east and the east coast to Tauromenium.
  "syracuse-west": [
    [15.5, 37.85],
    [15.32, 37.9],
    [15.05, 37.85],
    [14.85, 37.65],
    [14.75, 37.4],
    [14.7, 37.15],
    [14.55, 36.95],
    [14.5, 36.78],
    [14.5, 36.5],
  ],

  // ---------------------------------------------------------- Gaul, Iberia

  "pyrenees-west": [
    [-1.9, 43.42],
    [-1.78, 43.36],
    [-1.3, 43.02],
    [-0.45, 42.84],
    [0.65, 42.65],
  ],
  "pyrenees-east": [
    [0.65, 42.65],
    [1.5, 42.55],
    [2.45, 42.5],
    [3.17, 42.43],
    [3.45, 42.45],
  ],
  // Inland limit of Massalia's coastal territory, Rhône to the Var.
  massalia: [
    [4.7, 43.25],
    [4.85, 43.45],
    [5.05, 43.62],
    [5.6, 43.55],
    [6.3, 43.48],
    [6.9, 43.68],
    [7.2, 43.66],
  ],

  // --------------------------------------------------------------- Africa

  // Inland edge of the coastal strip of the Syrtic emporia, Tacapae to the
  // Altars of the Philaeni (border with Cyrenaica).
  "syrtis-inland": [
    [10.0, 33.4],
    [11.0, 32.9],
    [12.0, 32.5],
    [13.5, 32.35],
    [14.8, 31.9],
    [15.3, 31.4],
    [16.0, 30.9],
    [17.5, 30.6],
    [18.8, 30.2],
  ],
  philaeni: [
    [18.8, 30.2],
    [19.0, 30.7],
  ],
  // The Fossa Regia, Thabraca to Thaenae, dug after 146 BCE between the
  // province of Africa and Numidia.
  "fossa-regia": [
    [8.6, 37.2],
    [8.75, 36.95],
    [9.1, 36.5],
    [9.25, 36.0],
    [9.6, 35.6],
    [10.0, 35.1],
    [10.7, 34.65],
    [11.0, 34.55],
  ],

  // ------------------------------------------------------- Greece, Balkans

  // Epirus and Upper Macedonia against Thessaly and Macedon, along the Pindus.
  "pindus-illyria": [
    [20.55, 41.6],
    [20.6, 41.2],
    [20.85, 40.9],
    [21.0, 40.5],
  ],
  "pindus-epirus": [
    [21.0, 40.5],
    [21.15, 40.1],
    [21.3, 39.7],
  ],
  "pindus-south": [
    [21.3, 39.7],
    [21.35, 39.25],
    [21.55, 39.05],
  ],
  // Through the Ambracian Gulf: Epirus (north) and Acarnania (south).
  ambracian: [
    [20.6, 38.88],
    [20.74, 38.955],
    [20.9, 38.97],
    [21.12, 38.98],
    [21.4, 39.0],
    [21.55, 39.05],
  ],
  // Mount Othrys: Thessaly against Malis and Aetolia (264 BCE).
  othrys: [
    [21.55, 39.05],
    [21.9, 39.1],
    [22.3, 39.05],
    [22.622, 38.914],
  ],
  // At sea from the Malian Gulf round Magnesia, threading the narrow channel
  // between the mainland and Euboea.
  "magnesia-sea": [
    [22.622, 38.914],
    [22.66, 38.86],
    [22.76, 38.862],
    [22.85, 38.89],
    [22.92, 38.905],
    [23.0, 38.935],
    [23.06, 38.985],
    [23.15, 39.05],
    [23.32, 39.09],
    [23.45, 39.08],
    [23.6, 39.35],
    [23.6, 39.8],
  ],
  // Macedon's northern and eastern limit (Paeonia included), to the Nestos.
  "macedon-north": [
    [20.55, 41.6],
    [21.1, 42.15],
    [22.45, 42.4],
    [23.0, 42.1],
    [23.6, 41.75],
    [24.2, 41.6],
    [24.6, 41.45],
    [24.75, 41.15],
    [24.78, 40.9],
    [24.9, 40.75],
  ],

  // ------------------------------------------------------ Anatolia, Levant

  // Ptolemaic coast of Caria, Lycia, Pamphylia and Rough Cilicia (264 BCE).
  "ptolemaic-anatolia": [
    [27.8, 36.97],
    [28.25, 37.05],
    [29.37, 36.95],
    [30.62, 37.0],
    [31.75, 37.25],
    [32.6, 36.75],
    [33.6, 36.6],
    [34.6, 36.9],
    [34.7, 36.6],
  ],
  // Coele-Syria: Ptolemaic south against Seleucid north (264 BCE).
  "coele-syria": [
    [35.6, 35.3],
    [35.89, 35.26],
    [36.27, 35.19],
    [36.17, 34.94],
    [36.56, 34.29],
    [37.39, 34.1],
    [37.6, 33.75],
  ],
  // Pergamon's inland limit in 264 BCE (Philetaerus' small realm).
  "pergamon-264": [
    [26.85, 39.5],
    [27.77, 39.32],
    [27.81, 38.87],
    [27.64, 38.67],
    [27.31, 38.48],
    [26.85, 38.6],
  ],
  // Pontus against the Seleucid realm (264 BCE).
  "pontus-264": [
    [34.83, 39.77],
    [35.44, 39.58],
    [37.86, 39.45],
    [38.75, 39.06],
  ],
  // Sinope's territory, independent until 183 BCE.
  sinope: [
    [35.5, 42.1],
    [35.32, 41.82],
    [35.2, 41.7],
    [34.6, 41.85],
    [34.45, 41.97],
    [34.4, 42.2],
  ],
  // Gaza and Raphia: Ptolemaic Egypt against Seleucid Syria (146 BCE).
  raphia: [
    [34.2, 31.45],
    [34.3, 31.3],
    [34.55, 30.6],
  ],
  // The Seleucid realm against Parthia, from the head of the Gulf to the
  // Zagros and Media (146 BCE).
  "zagros-146": [
    [49.9, 29.8],
    [50.1, 30.1],
    [50.4, 30.5],
    [49.97, 31.21],
    [50.28, 31.79],
    [49.71, 32.62],
    [49.32, 32.56],
    [48.65, 33.26],
    [48.94, 34.16],
    [48.71, 35.19],
    [46.03, 35.39],
    [45.22, 35.64],
    [45.25, 36.93],
  ],
};

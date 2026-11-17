/**
 * Credits of the 3D battles, shared by the battle viewer ("About the battle"
 * tab) and the About dialog. They must agree with README.md ("Data credits")
 * and art/CREDITS.md; change one and change the others.
 */

/** Works the soldier and horse models and their animations are built from, and their licences. */
export const MODEL_CREDIT_URLS = {
  romanSoldier: "https://sketchfab.com/3d-models/none-61cd5cae148042c38048bff2bd206af3",
  celt: "https://sketchfab.com/3d-models/none-f727e3ecfe5642fdb85a2def36d57539",
  ccBy4: "https://creativecommons.org/licenses/by/4.0/",
  horse: "https://blendswap.com/blend/17172",
  horseRig: "https://blendswap.com/blend/28627",
  ccBy3: "https://creativecommons.org/licenses/by/3.0/",
  animations: "https://quaternius.com/packs/universalanimationlibrary.html",
} as const;

/** The same works as a list of links, in the order the credit line names them. */
export const MODEL_CREDIT_LINKS: { title: string; url: string }[] = [
  { title: "Roman Soldier - T pose (Andywoodhead)", url: MODEL_CREDIT_URLS.romanSoldier },
  { title: "Celt - rigged for UE4/5 (Andywoodhead)", url: MODEL_CREDIT_URLS.celt },
  { title: "CC BY 4.0", url: MODEL_CREDIT_URLS.ccBy4 },
  { title: "Horse (Tarnyloo)", url: MODEL_CREDIT_URLS.horse },
  { title: "Horse Rigged All Gaits (fdoss001)", url: MODEL_CREDIT_URLS.horseRig },
  { title: "CC BY 3.0", url: MODEL_CREDIT_URLS.ccBy3 },
  { title: "Universal Animation Library (Quaternius)", url: MODEL_CREDIT_URLS.animations },
];

/**
 * The Copernicus DEM licence asks for these two sentences word for word, so
 * they stay in English in every language.
 */
export const TERRAIN_ATTRIBUTION =
  "produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.";
export const TERRAIN_DISCLAIMER =
  "The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the Copernicus WorldDEM-30.";
export const TERRAIN_LICENCE = {
  title: "Copernicus DEM GLO-30",
  url: "https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N41_00_E016_00_DEM/INFO/eula_F.pdf",
} as const;

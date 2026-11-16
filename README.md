# World History Platform

An interactive world history web app: scrub through time, watch empires rise and fall on the map, and ask an AI tutor that knows which era and place you are looking at.

The first release covers the Roman Republic, 509–27 BCE, in English and Vietnamese.

## Run locally

```
npm install
npm run dev
```

Then open http://localhost:3000.

## Documentation

- [docs/OVERVIEW.md](docs/OVERVIEW.md): project overview
- [docs/PLAN.md](docs/PLAN.md): phases and status
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): shared data and state contract
- [docs/tasks/](docs/tasks/README.md): task briefs

The documents under `docs/` are written in Vietnamese.

## Data credits

- **Borders** are redrawn by hand. References: W. R. Shepherd, *Historical Atlas* (1911/1923, public domain), and Cliopatria v0.2.1 by the Seshat Global History Databank — Bennett J. S. et al., "Cliopatria - A geospatial database of world-wide political entities from 3400BCE to 2024CE", *Scientific Data* 12, 247 (2025), https://github.com/Seshat-Global-History-Databank/cliopatria — licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Cliopatria's polygons were simplified and redrawn, not copied; see `docs/data/BORDERS.md`.
- **Base map**: [Natural Earth](https://www.naturalearthdata.com/) (public domain).
- **Historical events**: summaries written for this project; sources are cited per event (`docs/data/SOURCES.md`).
- **Battle terrain** (`public/data/terrain/`): produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved. Resampled to a 30 m grid; see `docs/data/battles/cannae.md`. The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the Copernicus WorldDEM-30. Licence: [Copernicus DEM GLO-30](https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N41_00_E016_00_DEM/INFO/eula_F.pdf); anyone passing these files on must keep this notice.

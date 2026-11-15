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

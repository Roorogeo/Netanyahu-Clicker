# Bibi Clicker 🇮🇱

A tongue-in-cheek 3D idle clicker of Israeli campaign politics. Click the campaign coin to win votes,
build a campaign empire on a floating 3D island, and call early elections to win the Knesset.

**Play:** https://roorogeo.github.io/Netanyahu-Clicker/

## Features

- **3D everywhere** (three.js):
  - a waving Israeli flag fills the whole background;
  - the clicker is a gold campaign coin with Bibi's photo on the front and the flag on the back. It tilts toward your cursor, spins when you click it, and showers 3D ballots;
  - the **campaign map** is a floating island where every building you buy appears as a 3D model. Drag to rotate, scroll or pinch to zoom.
- **Real images instead of emoji**: 48 low-poly 3D models, rendered to PNG icons for the store, upgrades, awards and ministers.
- **14 buildings**, from Campaign Volunteers and Falafel Stand Rallies to a Quantum Pollster and an Interdimensional Rally.
- **~117 upgrades**: building tiers, click boosts, global boosts, and synergies between buildings.
- **Rally meter**: click fast to fill it and start a rally (clicks ×7, production ×2).
- **Breaking News** pickups and **Cabinet Decisions**, where you choose between two options.
- **Knesset & elections**: reset your term for permanent seats (+2% each), shown on a 120-seat chamber chart. Seat milestones appoint **Ministers** with special powers.
- **78 awards**, a production graph, statistics, buy ×1/10/100/Max, selling, and synthesized sound effects.
- Autosave, offline progress, save export/import. Works on phones, with a bottom navigation bar.
- **Legacy Tree** (prestige tree): every Knesset seat won in an election gives 1 Political Capital to spend on
  18 permanent perks in four branches (Grassroots, Charisma, Media, Strategy), capped by The Eternal Campaign.
  Refunds are free. Saves from before the tree get Political Capital equal to their seats.
- **13 themes**, plus Auto (follows your device): Classic, Midnight, Pride, Black History Month, Negev Sunset, Tel Aviv Beach,
  Jerusalem Gold, Galilee Spring, Neon Nights, Hermon Snow, Festival of Lights, Election Night and High Contrast.
  Each one restyles the UI, the flag, the coin and the 3D island, with extras like stars and a moon, a rainbow, the sea,
  desert dunes, old-city walls, wildflowers, a neon grid, falling snow, a menorah, spotlights, fireworks and pennant bunting.
  The Black History Month theme uses the Pan-African colors and adds history notes to the ticker.
  Pick one from the swatch button in the top bar or in Options.
- **Upgrades change the 3D world**:
  - building tier upgrades put bronze → diamond pedestals (and glow rings) under that building type on the island;
  - global, news, rally, decision and offline upgrades raise monuments around the plaza;
  - Golden Ballot Box gilds the HQ, and The Crown of Polls crowns the flagpole;
  - synergies draw glowing arcs between districts;
  - on the coin, click upgrades change the rim metal (bronze → silver → gold → platinum → iridescent), Charisma upgrades
    add orbiting stars, global upgrades grow a laurel wreath, and synergies set gems in the rim;
  - Fireworks Finale launches fireworks over the island during rallies.

## Run locally

It's a static site with no build step, but it uses ES modules, so serve it over HTTP:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Project layout

| Path | Purpose |
|------|---------|
| `index.html` | Page structure |
| `css/style.css` | Glass-panel UI, responsive layout |
| `js/main.js` | Game state, economy, UI, events, save/load |
| `js/data.js` | All content: buildings, upgrades, ministers, awards, events, headlines |
| `js/themes.js` | The 13 themes: UI colors, flag, coin, sky, lighting and island extras |
| `js/models.js` | Procedural low-poly 3D models, shared by the map and the icon renderer |
| `js/badge3d.js` | The clickable 3D coin |
| `js/map3d.js` | The 3D campaign island |
| `js/flag3d.js` | The waving flag background |
| `js/audio.js` | Web Audio sound effects (no audio files) |
| `assets/icons/` | PNG icons rendered from the 3D models |
| `tools/render-icons.*` | Re-renders the icons after you change a model |
| `vendor/three/` | three.js r160 (MIT license) |

To re-render the icons after editing `js/models.js`, start a local server on port 8765 and run
`node tools/render-icons.cjs`. It needs Playwright with Chromium.

## Credits

- Photo of Benjamin Netanyahu: U.S. Department of State, public domain, via
  [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Benjamin_Netanyahu_2018.jpg).
- [three.js](https://threejs.org/), MIT license.
- All 3D models, icons and sound effects are original and generated in code.

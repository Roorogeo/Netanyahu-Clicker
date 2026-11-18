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
- **40 buildings**, from Campaign Volunteers, Shuk Stalls and Campaign Buses through Election Night Studios, the
  Train to Jerusalem and a Quantum Pollster, to a space age orbiting above the island (Moon Base, Dyson Sphere
  Billboard, Galactic Senate, Black Hole Debate Stage, Alien Embassy, Pocket Universe HQ, Reality Editor) that ends
  with The Omniverse Ballot.
- **~390 upgrades**: eight tiers per building (up to 300 owned), click boosts, Charisma, 26 global boosts and 22 synergies.
- **Campaign Goals**: three rotating objectives (own buildings, win votes, click, catch news, start rallies) with
  production, click or vote rewards; every 10th goal also pays Political Capital. Swap a goal once a minute.
- **Rally meter**: click fast to fill it and start a rally (clicks ×7, production ×2).
- **Breaking News** pickups and **Cabinet Decisions**, where you choose between two options.
- **Knesset & elections**: reset your term for permanent seats (+2% each), shown on a 120-seat chamber chart. Seat milestones appoint **Ministers** with special powers.
- **78 awards**, a production graph, statistics, buy ×1/10/100/Max, selling, and synthesized sound effects.
- Autosave, offline progress, save export/import. Works on phones, with a bottom navigation bar.
- **Three prestige layers**:
  1. **Elections** reset the term for Knesset seats (+2% each) and Ministers (12, up to 1,000 seats).
  2. **Legacy Tree and Endless Mandates**, bought with Political Capital (below). Endless Mandates are repeatable
     perks, some with no level cap.
  3. **Eras**: with a full Knesset (120 seats), begin a new Era for 1 Heritage per 40 seats. Every Heritage point
     ever earned gives +25% production, and every Era begun multiplies production by ×1.5 (compounding). Eras reset
     seats, Ministers, Political Capital and Endless Mandates, but keep your Legacy Tree and career vote total.
     Spend Heritage on 12 Era perks (×5 and ×10 production, double seats, double Capital, keep Mandates, and more).
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

## Saving, accounts & backups

- **No account needed.** The game saves on your device every 10 seconds, exactly as before. Old saves keep working.
- **Accounts (optional):** sign in with email and password or Google to save your progress to an account and play
  on any device. Creating an account uploads the progress already on your device.
- **Progress is never silently overwritten.** If your account and your device have different progress, the game asks
  which to keep, and the other one is kept as a backup. Two devices can't overwrite each other: every cloud save must
  build on the previous one (enforced by `firestore.rules`).
- **Backups:** automatic snapshots every 15 minutes, plus one before anything replaces your progress (importing,
  wiping, elections, restoring, loading from your account). Restore them from **Options → Backups**. Your account
  keeps its own backups too, made automatically before its progress is replaced or goes down.
- If the latest save on a device is ever unreadable, the game loads the previous save or the newest backup instead.

## Leaderboard

The **Leaders** tab ranks players on three boards: most votes all time, most Knesset seats and best votes per second.
Anyone can view it. Signed-in players join by choosing a nickname (3–20 letters, numbers, spaces, `_ . -`); only the
nickname and scores are published, never an email. Players can change their name or leave at any time, and deleting
an account removes its entry. Entries update when the account syncs (at most every 5 minutes, or right away when seats
change). Scores are reported by each player's game, so a determined cheater could fake one; remove an entry in the
Firebase console under Firestore → `leaderboard`.

## Accounts & cloud saves: setup

Accounts use [Firebase](https://firebase.google.com/) (the free plan is enough). Until this is set up, the account
button explains that accounts aren't switched on yet and the game saves on the device only.

1. Go to the [Firebase console](https://console.firebase.google.com/) and **create a project** (Google Analytics is optional).
2. **Authentication** → Get started → **Sign-in method**: enable **Email/Password** and **Google**.
3. **Authentication → Settings → Authorized domains**: add `roorogeo.github.io`.
4. **Firestore Database** → Create database (production mode, any location).
5. Firestore → **Rules**: replace the rules with the contents of [`firestore.rules`](firestore.rules) and click **Publish**.
   Re-publish them whenever `firestore.rules` changes (the leaderboard needs the current version).
6. **Project settings** (gear icon) → General → Your apps → add a **Web app** (`</>`). Copy the `apiKey`, `authDomain`,
   `projectId` and `appId` values into [`js/cloud-config.js`](js/cloud-config.js) and push.

These config values are safe to publish; the rules make sure each player can only read and write their own save.
The free plan allows 20,000 save writes per day; the game saves to an account about once every 90 seconds while
someone is playing, plus after big moments.

**Testing locally with the Firebase emulators:** run `firebase emulators:start --only auth,firestore --project demo-bibi`
in the repo, serve the site on `localhost`, and open it with `?emulator=1`.

## Balance

Pacing is tuned with `tools/balance-sim.cjs`, a bot that plays the real economy at high speed (see the file for
usage). Key rules that keep growth from running away:
- Seats grow with the cube root of this Era's votes (1 seat at 1e11). Each of the first 120 seats gives +2%;
  beyond 120 the bonus grows logarithmically.
- Heritage ever earned = cube root of career votes ÷ 1e18. Each of the first 30 points gives +10%, then the bonus
  grows logarithmically, so each new Era needs much more progress than the last.
- Synergies count at most 100 source buildings, and space-age buildings get steadily less cost-efficient.

With 2 clicks per second around the clock, the bot reaches the first election in about half a day, its first Era
in about two weeks, and is still working through the deep-space buildings after 45 days.

## Releasing

Before each commit, run `python3 tools/stamp-version.py`. It stamps a content hash onto every script and stylesheet
in `index.html`, so browsers never mix files from two releases (GitHub Pages caches files for about 10 minutes).

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
| `js/leaderboard.js` | The public leaderboard (Leaders tab) |
| `js/account.js` | Sign-in screens and syncing between the device and the account |
| `js/cloud.js` | Firebase login and cloud saves (`js/cloud-config.js` switches it on) |
| `js/safety.js` | Local save mirror and backups |
| `firestore.rules` | Server-side rules: players can only touch their own save |
| `js/themes.js` | The 13 themes: UI colors, flag, coin, sky, lighting and island extras |
| `js/models.js` | Procedural low-poly 3D models, shared by the map and the icon renderer |
| `js/badge3d.js` | The clickable 3D coin |
| `js/map3d.js` | The 3D campaign island |
| `js/flag3d.js` | The waving flag background |
| `js/audio.js` | Web Audio sound effects (no audio files) |
| `assets/icons/` | PNG icons rendered from the 3D models |
| `tools/render-icons.*` | Re-renders the icons after you change a model |
| `vendor/three/` | three.js r160 (MIT license) |
| `vendor/firebase/` | Firebase JS SDK 10.14.1, bundled (Apache-2.0) |

To re-render the icons after editing `js/models.js`, start a local server on port 8765 and run
`node tools/render-icons.cjs`. It needs Playwright with Chromium.

## Credits

- Photo of Benjamin Netanyahu: U.S. Department of State, public domain, via
  [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Benjamin_Netanyahu_2018.jpg).
- [three.js](https://threejs.org/), MIT license.
- All 3D models, icons and sound effects are original and generated in code.

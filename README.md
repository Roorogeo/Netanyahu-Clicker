# Bibi Clicker 🇮🇱

A tongue-in-cheek idle clicker of Israeli campaign politics. Click Bibi to win votes, spend them on
campaign infrastructure, and build an unstoppable political machine.

## Play

No build step and no dependencies. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

It also works as-is on GitHub Pages.

## How it works

- **Click Bibi** to win votes.
- **Buildings** produce votes automatically, from Campaign Volunteers and Falafel Stand Rallies
  up to Knesset Committees, International Summits and a Campaign Satellite (12 in total).
- **Upgrades** double building output, boost your clicks, or raise all production. Highlights include
  Shakshuka Breakfast, Hummus Diplomacy and Hora Dance Rally.
- **Breaking News 📰** pops up at random. Click it for a Poll Surge (×5 production), a Viral Speech
  (×50 clicks) or a Surprise Endorsement (instant votes).
- **Achievements** (50) each add +1% public approval, which boosts all production.
- **Call Early Elections** to reset your term in exchange for permanent **Knesset Seats**
  (+2% production each). Can you reach a 61-seat majority?

The game saves automatically to `localStorage` every 10 seconds. While you're away it keeps producing
at 50% speed, for up to 12 hours. The Options tab lets you export and import saves.

## Files

| File         | Purpose                                     |
|--------------|---------------------------------------------|
| `index.html` | Layout and the hand-drawn SVG caricature    |
| `style.css`  | Blue-and-white theme, responsive layout     |
| `game.js`    | Game data, economy, saving, and the game loop |

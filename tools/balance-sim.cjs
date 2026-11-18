// Balance simulator: plays the real game economy at high speed and prints when
// milestones happen. Use it after changing costs, multipliers or prestige formulas.
//
//   python3 -m http.server 8765          # from the repo root, in another terminal
//   node tools/balance-sim.cjs [days=60] [clicksPerSecond=2]
//
// The bot buys every affordable upgrade, buys the building with the best payback,
// calls an election when it would at least double its seats (minimum 5), spends
// Political Capital and Heritage on the cheapest perks, and begins an Era when it
// would at least double its Heritage. Breaking News, Cabinet Decisions, rallies and
// goals are ignored, so real players with those are a little faster.
const { chromium } = require("playwright");

const days = Number(process.argv[2] || 60);
const cps = Number(process.argv[3] || 2);
const fmtT = (s) => (s < 3600 ? `${(s / 60).toFixed(0)}m` : s < 86400 * 2 ? `${(s / 3600).toFixed(1)}h` : `${(s / 86400).toFixed(1)}d`);

(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext()).newPage();
  p.on("pageerror", (e) => console.error("page error:", e.message));
  await p.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await p.goto("http://localhost:8765/");
  await p.waitForFunction(() => window.__bibi && window.__bibi.sim, null, { timeout: 30000 });
  await p.evaluate(() => window.__bibi.sim.quiet());

  const milestones = [];
  const seen = new Set();
  let t = 0;
  const end = days * 86400;
  while (t < end) {
    // simulate one chunk (6 hours) inside the page
    const res = await p.evaluate(({ t0, chunk, cps }) => {
      const sim = window.__bibi.sim, out = [];
      const S = () => window.__bibi.state; // the state object is replaced on elections and Eras
      let t = t0;
      const step = (tt) => (tt < 3600 ? 10 : tt < 86400 ? 30 : 60);
      while (t < t0 + chunk) {
        const dt = step(t);
        sim.tick(dt, cps);
        t += dt;
        sim.buy();
        if (sim.elect(1)) out.push({ t, ev: "election", seats: S().seats });
        if (S().seats >= 120 && sim.era(1)) out.push({ t, ev: "era", era: S().era, heritage: S().heritageTotal });
        const info = sim.info();
        out.push({ t, ev: "top", top: info.top, seats: info.seats, vps: info.vps, era: info.era });
      }
      return { t, out, info: sim.info() };
    }, { t0: t, chunk: 6 * 3600, cps });
    t = res.t;
    if (process.env.BREAKDOWN) {
      const bd = await p.evaluate(() => window.__bibi.sim.breakdown());
      const short = Object.fromEntries(Object.entries(bd).map(([k, v]) => [k, typeof v === "number" ? Number(v.toPrecision(3)) : v]));
      console.log(fmtT(t).padStart(7), JSON.stringify(short));
    }
    for (const e of res.out) {
      if (e.ev === "top" && e.top && !seen.has("b:" + e.top)) { seen.add("b:" + e.top); milestones.push(`${fmtT(e.t).padStart(7)}  first ${e.top}`); }
      if (e.ev === "top") for (const s of [1, 10, 61, 120, 500, 1000, 10000]) if (e.seats >= s && !seen.has("s:" + s)) { seen.add("s:" + s); milestones.push(`${fmtT(e.t).padStart(7)}  ${s} seats`); }
      if (e.ev === "election" && !seen.has("e1")) { seen.add("e1"); milestones.push(`${fmtT(e.t).padStart(7)}  first election (${e.seats} seats)`); }
      if (e.ev === "era") milestones.push(`${fmtT(e.t).padStart(7)}  ERA ${e.era} (heritage ${e.heritage})`);
    }
    if (res.info.top === "omniverse") { milestones.push(`${fmtT(t).padStart(7)}  owns The Omniverse Ballot (end of the building list)`); break; }
  }
  const info = await p.evaluate(() => window.__bibi.sim.info());
  console.log(milestones.join("\n"));
  console.log(`\nAfter ${fmtT(t)}: vps ${info.vps.toExponential(2)}, seats ${info.seats}, era ${info.era}, heritage ${info.heritage}, top building ${info.top}, upgrades ${info.upgrades}`);
  await b.close();
})();

/* Bibi Clicker — an idle clicker of Israeli campaign politics. */
(() => {
  "use strict";

  const SAVE_KEY = "bibiClickerSave.v1";
  const PRICE_GROWTH = 1.15;
  const OFFLINE_RATE = 0.5;
  const OFFLINE_CAP_S = 12 * 3600;
  const SEAT_BONUS = 0.02;
  const ACH_BONUS = 0.01;

  // ------------------------------------------------------------------
  // Formatting
  // ------------------------------------------------------------------
  const SHORT = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  const LONG = ["", " thousand", " million", " billion", " trillion", " quadrillion", " quintillion",
    " sextillion", " septillion", " octillion", " nonillion", " decillion"];

  function fmt(n, long = false) {
    if (!isFinite(n)) return "∞";
    if (n < 1000) {
      if (n < 10 && n % 1 !== 0) return n.toFixed(1).replace(/\.0$/, "");
      return Math.floor(n).toLocaleString("en-US");
    }
    if (n < 1e6 && !long) return Math.floor(n).toLocaleString("en-US");
    const i = Math.min(Math.floor(Math.log10(n) / 3), SHORT.length - 1);
    const v = n / Math.pow(10, i * 3);
    const digits = v >= 100 ? 1 : v >= 10 ? 2 : 3;
    return v.toFixed(digits).replace(/\.?0+$/, "") + (long ? LONG[i] : SHORT[i]);
  }

  function fmtTime(sec) {
    sec = Math.floor(sec);
    const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600),
      m = Math.floor((sec % 3600) / 60), s = sec % 60;
    if (d) return `${d}d ${h}h`;
    if (h) return `${h}h ${m}m`;
    if (m) return `${m}m ${s}s`;
    return `${s}s`;
  }

  // ------------------------------------------------------------------
  // Content
  // ------------------------------------------------------------------
  const BUILDINGS = [
    { id: "volunteer", name: "Campaign Volunteer", icon: "🙋", cost: 15, vps: 0.1,
      desc: "Knocks on doors in Petah Tikva and hands out flyers." },
    { id: "falafel", name: "Falafel Stand Rally", icon: "🧆", cost: 120, vps: 1,
      desc: "Free falafel for anyone who stays for the speech." },
    { id: "branch", name: "Party Branch Office", icon: "🏢", cost: 1300, vps: 9,
      desc: "Plastic chairs, a kettle, and a lot of phone calls." },
    { id: "radio", name: "Talk Radio Show", icon: "📻", cost: 14000, vps: 50,
      desc: "Three hours of opinions every morning, plus a call-in segment." },
    { id: "billboard", name: "Highway Billboard", icon: "🪧", cost: 160000, vps: 280,
      desc: "A huge smiling face on the Ayalon. Nobody can miss it." },
    { id: "warroom", name: "Social Media War Room", icon: "📱", cost: 2e6, vps: 1500,
      desc: "Twenty interns, forty phones, one hashtag." },
    { id: "coalition", name: "Coalition Partner", icon: "🤝", cost: 3e7, vps: 8500,
      desc: "Brings votes. Also brings a list of demands." },
    { id: "startup", name: "Startup Nation Lab", icon: "🚀", cost: 4.5e8, vps: 48000,
      desc: "A unicorn that turns pitch decks into poll numbers." },
    { id: "committee", name: "Knesset Committee", icon: "🏛️", cost: 7e9, vps: 280000,
      desc: "It meets, it deliberates, and somehow votes come out." },
    { id: "summit", name: "International Summit", icon: "🌍", cost: 1e11, vps: 1.7e6,
      desc: "Photo ops with world leaders look great back home." },
    { id: "spa", name: "Dead Sea Think Tank", icon: "🧂", cost: 1.5e12, vps: 1.1e7,
      desc: "Policy ideas float effortlessly at the lowest point on Earth." },
    { id: "satellite", name: "Campaign Satellite", icon: "🛰️", cost: 2.2e13, vps: 7e7,
      desc: "Beams the stump speech to every phone in the region." },
  ];

  const TIER_NAMES = [
    ["Training Seminar", 1, 10],
    ["Catchy Slogans", 5, 50],
    ["Prime-Time Coverage", 25, 500],
    ["Grassroots Network", 50, 50000],
    ["Coalition Synergy", 100, 5e6],
    ["Historic Mandate", 150, 5e8],
  ];

  // Upgrades: { id, name, icon, cost, desc, flavor, unlock(state)->bool, effect key }
  const UPGRADES = [];

  // Building tier doublers
  BUILDINGS.forEach((b) => {
    TIER_NAMES.forEach(([tname, req, mult], i) => {
      UPGRADES.push({
        id: `${b.id}_t${i}`,
        name: `${tname}: ${b.name}`,
        icon: b.icon,
        cost: b.cost * mult,
        desc: `${b.name}s are <b>twice</b> as effective.`,
        unlock: (s) => s.buildings[b.id] >= req,
        kind: "building", target: b.id, value: 2,
      });
    });
  });

  // Click power doublers
  [
    ["Firm Handshake", "🤝", 100, 1, "Every voter remembers a good handshake."],
    ["Baby Kissing", "👶", 500, 1, "A classic for a reason."],
    ["Two Thumbs Up", "👍", 10000, 10, "Both thumbs. Total commitment."],
    ["Rousing Speech", "🎤", 1e5, 25, "\"My fellow citizens…\""],
    ["Perfect Hair Day", "💇", 1e7, 50, "Not a single strand out of place."],
  ].forEach(([name, icon, cost, req, flavor], i) => {
    UPGRADES.push({
      id: `click_${i}`, name, icon, cost, flavor,
      desc: "Clicking is <b>twice</b> as effective.",
      unlock: (s) => s.clicks >= req,
      kind: "click", value: 2,
    });
  });

  // Click gains % of VPS
  [
    ["Charisma", 5e4, 1e3],
    ["Star Power", 5e6, 1e5],
    ["Living Legend", 5e8, 1e7],
    ["Political Icon", 5e10, 1e9],
    ["The Comeback Kid", 5e12, 1e11],
  ].forEach(([name, cost, req], i) => {
    UPGRADES.push({
      id: `charisma_${i}`, name, icon: "✨", cost,
      desc: "Each click also earns <b>+1%</b> of your votes per second.",
      flavor: "People cheer before you even open your mouth.",
      unlock: (s) => s.totalVotes >= req,
      kind: "clickVps", value: 0.01,
    });
  });

  // Global production multipliers
  [
    ["Shakshuka Breakfast", "🍳", 5e4, 0.1, "The most important meal of the campaign."],
    ["Hummus Diplomacy", "🥙", 1e6, 0.1, "Nothing unites people like a good bowl of hummus."],
    ["Hora Dance Rally", "💃", 5e7, 0.15, "Everyone in a circle. Nobody is allowed to sit."],
    ["Shabbat Recharge", "🕯️", 2e9, 0.15, "Even a campaign rests sometimes."],
    ["Jerusalem Sunrise", "🌅", 1e11, 0.2, "Golden light on the stones. Very photogenic."],
    ["Tel Aviv Beach Tour", "🏖️", 5e12, 0.2, "Frisbees, matkot paddles, and voter registration."],
    ["Startup Nation Spirit", "💡", 2e14, 0.25, "Ask forgiveness, not permission."],
    ["Sabra Resilience", "🌵", 1e16, 0.25, "Prickly on the outside, sweet on the inside."],
  ].forEach(([name, icon, cost, value, flavor], i) => {
    UPGRADES.push({
      id: `global_${i}`, name, icon, cost, flavor,
      desc: `All vote production <b>+${Math.round(value * 100)}%</b>.`,
      unlock: (s) => s.totalVotes >= cost / 3,
      kind: "global", value,
    });
  });

  // Breaking-news upgrades
  UPGRADES.push(
    { id: "news_0", name: "Press Secretary", icon: "📰", cost: 7.7e5,
      desc: "Breaking News appears <b>twice as often</b>.", flavor: "\"No comment\" is also a comment.",
      unlock: (s) => s.newsClicked >= 3, kind: "newsFreq", value: 2 },
    { id: "news_1", name: "24-Hour News Cycle", icon: "📺", cost: 7.7e8,
      desc: "Breaking News effects last <b>twice as long</b>.", flavor: "Always on. Always breaking.",
      unlock: (s) => s.newsClicked >= 10, kind: "newsDur", value: 2 },
  );

  const UPG_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

  // Achievements
  const ACHIEVEMENTS = [];
  const addAch = (id, name, icon, desc, test) => ACHIEVEMENTS.push({ id, name, icon, desc, test });

  [
    [1, "First Vote", "🗳️"], [1e3, "Neighbourhood Favourite", "🏘️"], [1e5, "City Council Material", "🏙️"],
    [1e6, "Million-Vote March", "🚶"], [1e9, "Landslide", "⛰️"], [1e12, "Trillion Ballots", "📦"],
    [1e15, "Beyond Polling", "📈"], [1e18, "Statistical Impossibility", "🧮"],
  ].forEach(([n, name, icon], i) =>
    addAch(`votes_${i}`, name, icon, `Win ${fmt(n)} votes in one term.`, (s) => s.totalVotes >= n));

  [[1, "Hands-On", "👆"], [100, "Handshake Marathon", "✋"], [1000, "Carpal Campaign", "🖐️"], [10000, "Clicker-in-Chief", "🫡"]]
    .forEach(([n, name, icon], i) =>
      addAch(`clicks_${i}`, name, icon, `Click Bibi ${fmt(n)} times.`, (s) => s.clicks >= n));

  [[10, "Grassroots", "🌱"], [1000, "Political Machine", "⚙️"], [1e6, "Unstoppable Momentum", "🚂"], [1e9, "Juggernaut", "🛡️"]]
    .forEach(([n, name, icon], i) =>
      addAch(`vps_${i}`, name, icon, `Reach ${fmt(n)} votes per second.`, () => cache.vps >= n));

  BUILDINGS.forEach((b) => {
    addAch(`own_${b.id}_1`, `${b.name} Hire`, b.icon, `Own 1 ${b.name}.`, (s) => s.buildings[b.id] >= 1);
    addAch(`own_${b.id}_50`, `${b.name} Empire`, b.icon, `Own 50 ${b.name}s.`, (s) => s.buildings[b.id] >= 50);
  });

  [[1, "Hot off the Press", "📰"], [10, "Media Darling", "🎙️"], [50, "Headline Machine", "🗞️"]]
    .forEach(([n, name, icon], i) =>
      addAch(`news_${i}`, name, icon, `Click ${n} Breaking News stor${n > 1 ? "ies" : "y"}.`, (s) => s.newsClicked >= n));

  [[1, "Back to the Polls", "🔁"], [5, "Election Season", "📅"], [20, "Perpetual Campaign", "♾️"]]
    .forEach(([n, name, icon], i) =>
      addAch(`elect_${i}`, name, icon, `Call early elections ${n} time${n > 1 ? "s" : ""}.`, (s) => s.elections >= n));

  addAch("seats_61", "Majority!", "🏛️", "Hold 61 Knesset seats.", (s) => s.seats >= 61);
  addAch("seats_120", "The Whole Knesset", "🇮🇱", "Hold 120 Knesset seats.", (s) => s.seats >= 120);
  addAch("upg_all10", "Policy Wonk", "📚", "Own 10 upgrades.", (s) => s.upgrades.length >= 10);
  addAch("upg_all50", "Platform Architect", "🏗️", "Own 50 upgrades.", (s) => s.upgrades.length >= 50);

  const ACH_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

  const HEADLINES = [
    [0, "Local man clicks on a politician. Experts are puzzled."],
    [0, "Polls open. Somewhere, a campaign begins…"],
    [10, "Your mother says she'll vote for you. Probably."],
    [100, "Neighbourhood WhatsApp group can't stop talking about your handshake."],
    [500, "Falafel sales spike near campaign events."],
    [2000, "Opposition demands a recount of your clicks."],
    [5000, "Tel Aviv taxi drivers now quote your speeches word for word."],
    [2e4, "Coalition talks head into their 47th hour. Coffee supplies running low."],
    [1e5, "Study: shakshuka consumption linked to voter turnout."],
    [5e5, "Pollster resigns: \"The numbers just keep going up.\""],
    [2e6, "Knesset cafeteria adds 'The Bibi' sandwich to the menu."],
    [1e7, "Startup raises $40M to build an app that counts your votes faster."],
    [5e7, "Coalition partner threatens to quit unless given more falafel."],
    [2e8, "Your campaign jingle is now the most-played song in Eilat."],
    [1e9, "Analysts declare the election \"mathematically very exciting\"."],
    [1e10, "Billboard on the Ayalon now visible from space, say officials."],
    [1e11, "Hummus futures soar on campaign optimism."],
    [1e12, "Dead Sea level rises slightly. Scientists blame campaign confetti."],
    [1e13, "World leaders request selfies. Diplomatic protocol updated."],
    [1e14, "Voters in neighbouring galaxies express interest."],
    [1e15, "The number of votes now exceeds the number of humans. Nobody asks questions."],
    [-1, "Weather: sunny with a 100% chance of campaign rallies."],
    [-1, "Traffic jam on Highway 1 caused by enthusiastic supporters."],
    [-1, "Op-ed: \"Is it the hair? An investigation.\""],
    [-1, "Local grandmother has already decided. She won't say who."],
    [-1, "Breaking: new poll shows that polls are popular."],
  ];

  const NEWS_EFFECTS = [
    { id: "surge", weight: 45, title: "Poll Surge!", body: "Vote production ×5 for {d} seconds.",
      kind: "buff", buff: { key: "surge", label: "Poll Surge ×5", vpsMult: 5, dur: 45 } },
    { id: "viral", weight: 15, title: "Viral Speech!", body: "Clicks are ×50 for {d} seconds.",
      kind: "buff", buff: { key: "viral", label: "Viral Speech: clicks ×50", clickMult: 50, dur: 12 } },
    { id: "endorse", weight: 40, title: "Surprise Endorsement!", body: "+{v} votes!", kind: "lump" },
  ];

  // ------------------------------------------------------------------
  // State
  // ------------------------------------------------------------------
  const freshState = () => ({
    votes: 0,
    totalVotes: 0,           // this term
    allTimeVotes: 0,         // across all elections
    allTimeBase: 0,          // allTimeVotes at start of this term
    clicks: 0,
    clickVotes: 0,
    newsClicked: 0,
    elections: 0,
    seats: 0,
    buildings: Object.fromEntries(BUILDINGS.map((b) => [b.id, 0])),
    upgrades: [],
    achievements: [],
    buffs: [],               // {key, label, vpsMult?, clickMult?, until}
    termStart: Date.now(),
    gameStart: Date.now(),
    lastSave: Date.now(),
    opts: { particles: true, ticker: true },
  });

  let state = freshState();
  const cache = { vps: 0, perBuilding: {}, clickPower: 1 };
  let buyAmount = 1;

  // ------------------------------------------------------------------
  // Economy
  // ------------------------------------------------------------------
  const has = (id) => state.upgrades.includes(id);

  function buildingCost(b, amount = 1) {
    const owned = state.buildings[b.id];
    const first = b.cost * Math.pow(PRICE_GROWTH, owned);
    return Math.ceil(first * (Math.pow(PRICE_GROWTH, amount) - 1) / (PRICE_GROWTH - 1));
  }

  function globalMultiplier() {
    let m = 1;
    for (const id of state.upgrades) {
      const u = UPG_BY_ID[id];
      if (u && u.kind === "global") m += u.value;
    }
    m *= 1 + state.seats * SEAT_BONUS;
    m *= 1 + state.achievements.length * ACH_BONUS;
    return m;
  }

  function buffMult(key) {
    let m = 1;
    for (const b of state.buffs) if (b[key]) m *= b[key];
    return m;
  }

  function recalc() {
    const g = globalMultiplier();
    let total = 0;
    for (const b of BUILDINGS) {
      let mult = 1;
      for (const id of state.upgrades) {
        const u = UPG_BY_ID[id];
        if (u && u.kind === "building" && u.target === b.id) mult *= u.value;
      }
      const each = b.vps * mult * g;
      cache.perBuilding[b.id] = { each, total: each * state.buildings[b.id] };
      total += each * state.buildings[b.id];
    }
    cache.baseVps = total;
    cache.vps = total * buffMult("vpsMult");

    let click = 1;
    let clickVpsFrac = 0;
    for (const id of state.upgrades) {
      const u = UPG_BY_ID[id];
      if (!u) continue;
      if (u.kind === "click") click *= u.value;
      if (u.kind === "clickVps") clickVpsFrac += u.value;
    }
    cache.clickPower = (click + clickVpsFrac * cache.vps) * buffMult("clickMult");
  }

  function earn(n) {
    state.votes += n;
    state.totalVotes += n;
    state.allTimeVotes += n;
  }

  function seatsTotalFor(allTime) {
    return Math.floor(Math.sqrt(allTime / 1e9));
  }
  const seatsGainable = () => Math.max(0, seatsTotalFor(state.allTimeVotes) - state.seats);

  // ------------------------------------------------------------------
  // DOM
  // ------------------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const els = {
    votes: $("votes"), vps: $("vps"), buffs: $("buffs"), bibi: $("bibi"), stage: $("stage"),
    particles: $("particles"), upgrades: $("upgrades"), buildings: $("buildings"),
    tooltip: $("tooltip"), toasts: $("toasts"), ticker: $("ticker-text"), hq: $("hq"),
    stats: $("stats"), achGrid: $("achievements"), achCount: $("ach-count"),
    seatsHeld: $("seats-held"), seatsGain: $("seats-gain"), seatsNext: $("seats-next"),
    btnElection: $("btn-election"), saveText: $("save-text"),
  };

  // --- Buildings list (built once) ---
  const bldEls = {};
  function buildStore() {
    els.buildings.innerHTML = "";
    BUILDINGS.forEach((b) => {
      const btn = document.createElement("button");
      btn.className = "bld";
      btn.innerHTML = `<div class="ico">${b.icon}</div>
        <div><div class="name"></div><div class="cost"></div></div>
        <div class="owned"></div>`;
      btn.addEventListener("click", () => buyBuilding(b));
      attachTooltip(btn, () => buildingTooltip(b));
      els.buildings.appendChild(btn);
      bldEls[b.id] = {
        root: btn, name: btn.querySelector(".name"), cost: btn.querySelector(".cost"), owned: btn.querySelector(".owned"),
      };
    });
  }

  function isBuildingVisible(i) {
    if (i === 0) return true;
    const prev = BUILDINGS[i - 1];
    return state.buildings[prev.id] > 0 || state.buildings[BUILDINGS[i].id] > 0 ||
      state.totalVotes >= BUILDINGS[i].cost * 0.5;
  }

  function renderBuildings() {
    let shownLocked = 0;
    BUILDINGS.forEach((b, i) => {
      const e = bldEls[b.id];
      const visible = isBuildingVisible(i);
      if (!visible) {
        // show at most one mystery building beyond the frontier
        if (shownLocked < 1) {
          shownLocked++;
          e.root.classList.remove("hidden");
          e.root.classList.add("locked");
          e.name.textContent = "???";
          e.root.querySelector(".ico").textContent = "❔";
        } else {
          e.root.classList.add("hidden");
        }
      } else {
        e.root.classList.remove("hidden", "locked");
        e.name.textContent = b.name;
        e.root.querySelector(".ico").textContent = b.icon;
      }
      const cost = buildingCost(b, buyAmount);
      e.cost.textContent = `🗳️ ${fmt(cost)}`;
      e.owned.textContent = state.buildings[b.id] || "";
      e.root.classList.toggle("afford", visible && state.votes >= cost);
    });
  }

  // --- Upgrades (re-rendered when the available set changes) ---
  let upgSignature = "";
  function availableUpgrades() {
    return UPGRADES.filter((u) => !has(u.id) && u.unlock(state)).sort((a, b) => a.cost - b.cost);
  }

  function renderUpgrades() {
    const list = availableUpgrades();
    const sig = list.map((u) => u.id).join(",");
    if (sig !== upgSignature) {
      upgSignature = sig;
      els.upgrades.innerHTML = "";
      list.forEach((u) => {
        const btn = document.createElement("button");
        btn.className = "upg";
        btn.dataset.id = u.id;
        btn.textContent = u.icon;
        btn.setAttribute("aria-label", `${u.name}, costs ${fmt(u.cost)} votes`);
        btn.addEventListener("click", () => buyUpgrade(u));
        attachTooltip(btn, () => upgradeTooltip(u));
        els.upgrades.appendChild(btn);
      });
    }
    for (const btn of els.upgrades.children) {
      const u = UPG_BY_ID[btn.dataset.id];
      btn.classList.toggle("afford", state.votes >= u.cost);
    }
  }

  // --- Tooltips ---
  let tooltipSource = null;
  function attachTooltip(el, contentFn) {
    const show = (ev) => {
      tooltipSource = { el, contentFn };
      els.tooltip.innerHTML = contentFn();
      els.tooltip.classList.remove("hidden");
      positionTooltip(ev);
    };
    el.addEventListener("mouseenter", show);
    el.addEventListener("mousemove", positionTooltip);
    el.addEventListener("mouseleave", hideTooltip);
    el.addEventListener("focus", (ev) => {
      show(ev);
      const r = el.getBoundingClientRect();
      placeTooltip(r.left, r.bottom);
    });
    el.addEventListener("blur", hideTooltip);
  }
  function hideTooltip() { tooltipSource = null; els.tooltip.classList.add("hidden"); }
  function positionTooltip(ev) {
    if (ev && ev.clientX !== undefined) placeTooltip(ev.clientX, ev.clientY);
  }
  function placeTooltip(x, y) {
    const t = els.tooltip, pad = 14;
    const w = t.offsetWidth, h = t.offsetHeight;
    let left = x - w - pad;
    if (left < 8) left = Math.min(x + pad, window.innerWidth - w - 8);
    let top = y + pad;
    if (top + h > window.innerHeight - 8) top = Math.max(8, y - h - pad);
    t.style.left = `${left}px`;
    t.style.top = `${top}px`;
  }
  function refreshTooltip() {
    if (tooltipSource && document.body.contains(tooltipSource.el)) {
      els.tooltip.innerHTML = tooltipSource.contentFn();
    } else if (tooltipSource) hideTooltip();
  }

  function buildingTooltip(b) {
    const i = BUILDINGS.indexOf(b);
    if (!isBuildingVisible(i)) return `<div class="tt-title">???</div>Win more votes to reveal this building.`;
    const cost = buildingCost(b, buyAmount);
    const pb = cache.perBuilding[b.id];
    const owned = state.buildings[b.id];
    const share = cache.baseVps > 0 ? (pb.total / cache.baseVps) * 100 : 0;
    return `<div class="tt-title">${b.icon} ${b.name}</div>
      <div>${b.desc}</div>
      <div style="margin-top:6px">Each makes <b>${fmt(pb.each)}</b> votes/s</div>
      ${owned ? `<div>${owned} owned: <b>${fmt(pb.total)}</b>/s (${share.toFixed(1)}% of total)</div>` : ""}
      <div class="tt-cost ${state.votes >= cost ? "" : "no"}">Buy ${buyAmount}: 🗳️ ${fmt(cost, true)}</div>`;
  }

  function upgradeTooltip(u) {
    return `<div class="tt-title">${u.icon} ${u.name}</div>
      <div>${u.desc}</div>
      <div class="tt-cost ${state.votes >= u.cost ? "" : "no"}">🗳️ ${fmt(u.cost, true)}</div>
      ${u.flavor ? `<div class="tt-flavor">${u.flavor}</div>` : ""}`;
  }

  // --- Campaign HQ ---
  function renderHQ() {
    const owned = BUILDINGS.filter((b) => state.buildings[b.id] > 0);
    if (!owned.length) {
      els.hq.innerHTML = `<div class="hq-empty">No buildings yet. Hire your first Campaign Volunteer in the store.</div>`;
      return;
    }
    els.hq.innerHTML = owned.map((b) => {
      const n = state.buildings[b.id];
      const iconsShown = Math.min(n, 40);
      return `<div class="hq-row">
        <div class="hq-row-head"><span>${b.name} ×${n}</span><span>${fmt(cache.perBuilding[b.id].total)}/s</span></div>
        <div class="hq-icons">${b.icon.repeat(iconsShown)}${n > iconsShown ? ` <small>+${n - iconsShown}</small>` : ""}</div>
      </div>`;
    }).join("");
  }

  // --- Stats ---
  function renderStats() {
    const now = Date.now();
    const totalBld = Object.values(state.buildings).reduce((a, b) => a + b, 0);
    const rows = [
      ["Votes in bank", fmt(state.votes, true)],
      ["Votes this term", fmt(state.totalVotes, true)],
      ["Votes all time", fmt(state.allTimeVotes, true)],
      ["Votes per second", fmt(cache.vps, true)],
      ["Votes per click", fmt(cache.clickPower, true)],
      ["Bibi clicks", fmt(state.clicks)],
      ["Votes from clicking", fmt(state.clickVotes, true)],
      ["Buildings owned", fmt(totalBld)],
      ["Upgrades owned", `${state.upgrades.length} / ${UPGRADES.length}`],
      ["Breaking News clicked", fmt(state.newsClicked)],
      ["Elections called", fmt(state.elections)],
      ["Knesset seats", `${fmt(state.seats)} (+${fmt(state.seats * SEAT_BONUS * 100)}%)`],
      ["Public approval", `+${state.achievements.length}%`],
      ["This term", fmtTime((now - state.termStart) / 1000)],
      ["Since first vote", fmtTime((now - state.gameStart) / 1000)],
    ];
    els.stats.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  }

  // --- Achievements grid (built once, updated) ---
  const achEls = {};
  function buildAchievements() {
    els.achGrid.innerHTML = "";
    ACHIEVEMENTS.forEach((a) => {
      const d = document.createElement("div");
      d.className = "ach";
      d.tabIndex = 0;
      d.textContent = a.icon;
      attachTooltip(d, () => {
        const won = state.achievements.includes(a.id);
        return `<div class="tt-title">${won ? a.icon + " " + a.name : "🔒 " + a.name}</div><div>${a.desc}</div>
          <div class="tt-cost ${won ? "" : "no"}">${won ? "Unlocked" : "Locked"}</div>`;
      });
      els.achGrid.appendChild(d);
      achEls[a.id] = d;
    });
  }
  function renderAchievements() {
    ACHIEVEMENTS.forEach((a) => achEls[a.id].classList.toggle("won", state.achievements.includes(a.id)));
    els.achCount.textContent = `${state.achievements.length} / ${ACHIEVEMENTS.length}`;
  }

  // --- Election tab ---
  function renderElection() {
    const gain = seatsGainable();
    els.seatsHeld.textContent = fmt(state.seats);
    els.seatsGain.textContent = fmt(gain);
    const nextTotal = seatsTotalFor(state.allTimeVotes) + 1;
    const needed = nextTotal * nextTotal * 1e9 - state.allTimeVotes;
    els.seatsNext.textContent = `Next seat after ${fmt(Math.max(0, needed), true)} more votes.` +
      (state.seats >= 120 ? " (The Knesset only has 120 seats, but who's counting?)" : "");
    els.btnElection.disabled = gain < 1;
    els.btnElection.textContent = gain >= 1 ? `Call Early Elections (+${fmt(gain)} seats)` : "Not enough votes for a new seat yet";
  }

  // --- Top bank ---
  function renderBank() {
    els.votes.textContent = `${fmt(state.votes, true)} vote${Math.floor(state.votes) === 1 ? "" : "s"}`;
    els.vps.textContent = `per second: ${fmt(cache.vps, true)}`;
    const now = Date.now();
    els.buffs.innerHTML = state.buffs.map((b) =>
      `<span class="buff">${b.label} · ${Math.ceil((b.until - now) / 1000)}s</span>`).join("");
    document.title = `${fmt(state.votes)} votes · Bibi Clicker`;
  }

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------
  function clickBibi(ev) {
    const gain = cache.clickPower;
    earn(gain);
    state.clicks++;
    state.clickVotes += gain;
    els.bibi.classList.add("pop");
    setTimeout(() => els.bibi.classList.remove("pop"), 70);
    if (state.opts.particles) spawnFloat(ev, `+${fmt(gain)}`);
  }

  function spawnFloat(ev, text) {
    const rect = els.stage.getBoundingClientRect();
    let x, y;
    if (ev && ev.clientX) { x = ev.clientX - rect.left; y = ev.clientY - rect.top; }
    else { x = rect.width / 2 + (Math.random() - 0.5) * 60; y = rect.height / 2; }
    const d = document.createElement("div");
    d.className = "float-num";
    d.textContent = text;
    d.style.left = `${x + (Math.random() - 0.5) * 20}px`;
    d.style.top = `${y - 10}px`;
    d.style.fontSize = `${1.1 + Math.random() * 0.4}rem`;
    els.particles.appendChild(d);
    setTimeout(() => d.remove(), 1000);
  }

  function buyBuilding(b) {
    const i = BUILDINGS.indexOf(b);
    if (!isBuildingVisible(i)) return;
    const cost = buildingCost(b, buyAmount);
    if (state.votes < cost) return;
    state.votes -= cost;
    state.buildings[b.id] += buyAmount;
    recalc();
    renderHQ();
    refreshTooltip();
  }

  function buyUpgrade(u) {
    if (has(u.id) || state.votes < u.cost) return;
    state.votes -= u.cost;
    state.upgrades.push(u.id);
    recalc();
    renderHQ();
    hideTooltip();
  }

  function callElection() {
    const gain = seatsGainable();
    if (gain < 1) return;
    const ok = confirm(`Call early elections?\n\nYou'll win ${fmt(gain)} new Knesset seat(s) (+${fmt(gain * SEAT_BONUS * 100)}% production), ` +
      `but lose all votes, buildings and upgrades from this term.`);
    if (!ok) return;
    const keep = {
      allTimeVotes: state.allTimeVotes, seats: state.seats + gain, elections: state.elections + 1,
      achievements: state.achievements, newsClicked: state.newsClicked, gameStart: state.gameStart,
      opts: state.opts, clicks: 0,
    };
    state = Object.assign(freshState(), keep);
    state.allTimeBase = state.allTimeVotes;
    upgSignature = "";
    recalc();
    renderAll();
    toast("🗳️ Election results are in!", `You now hold ${fmt(state.seats)} Knesset seats. A new term begins.`);
    save();
  }

  // ------------------------------------------------------------------
  // Breaking News pickups
  // ------------------------------------------------------------------
  let nextNewsAt = Date.now() + randBetween(45, 120) * 1000;
  let newsEl = null;

  function randBetween(a, b) { return a + Math.random() * (b - a); }

  function scheduleNews() {
    const freq = has("news_0") ? 2 : 1;
    nextNewsAt = Date.now() + randBetween(60, 180) * 1000 / freq;
  }

  function spawnNews() {
    if (newsEl) return;
    const panel = document.querySelector(".panel-click");
    const r = panel.getBoundingClientRect();
    const el = document.createElement("button");
    el.className = "news-pop";
    el.textContent = "📰";
    el.setAttribute("aria-label", "Breaking news! Click for a bonus");
    el.style.left = `${randBetween(8, Math.max(10, r.width - 72))}px`;
    el.style.top = `${randBetween(80, Math.max(90, r.height - 72))}px`;
    el.addEventListener("click", (ev) => { ev.stopPropagation(); collectNews(); });
    panel.appendChild(el);
    newsEl = el;
    const myEl = el;
    setTimeout(() => { if (newsEl === myEl) removeNews(); }, 13000);
  }

  function removeNews() {
    if (!newsEl) return;
    const el = newsEl;
    newsEl = null;
    el.classList.add("leaving");
    setTimeout(() => el.remove(), 600);
    scheduleNews();
  }

  function collectNews() {
    if (!newsEl) return;
    state.newsClicked++;
    const total = NEWS_EFFECTS.reduce((a, e) => a + e.weight, 0);
    let roll = Math.random() * total;
    let eff = NEWS_EFFECTS[0];
    for (const e of NEWS_EFFECTS) { if ((roll -= e.weight) < 0) { eff = e; break; } }

    const durMult = has("news_1") ? 2 : 1;
    if (eff.kind === "buff") {
      const b = eff.buff;
      const dur = b.dur * durMult;
      state.buffs = state.buffs.filter((x) => x.key !== b.key);
      state.buffs.push({ key: b.key, label: b.label, vpsMult: b.vpsMult, clickMult: b.clickMult, until: Date.now() + dur * 1000 });
      toast(`📰 ${eff.title}`, eff.body.replace("{d}", dur));
    } else {
      const v = Math.max(13, Math.min(state.votes * 0.15, cache.vps * 900) + 13);
      earn(v);
      toast(`📰 ${eff.title}`, eff.body.replace("{v}", fmt(v, true)));
    }
    recalc();
    removeNews();
  }

  // ------------------------------------------------------------------
  // Achievements check
  // ------------------------------------------------------------------
  function checkAchievements() {
    let changed = false;
    for (const a of ACHIEVEMENTS) {
      if (!state.achievements.includes(a.id) && a.test(state)) {
        state.achievements.push(a.id);
        toast(`🏆 Achievement: ${a.name}`, a.desc);
        changed = true;
      }
    }
    if (changed) { recalc(); renderAchievements(); }
  }

  // ------------------------------------------------------------------
  // Toasts & ticker
  // ------------------------------------------------------------------
  function toast(title, body) {
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `<div class="toast-title"></div><div class="toast-body"></div>`;
    t.querySelector(".toast-title").textContent = title;
    t.querySelector(".toast-body").textContent = body;
    els.toasts.appendChild(t);
    while (els.toasts.children.length > 4) els.toasts.firstChild.remove();
    setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 400); }, 4000);
  }

  let lastHeadline = "";
  function nextHeadline() {
    if (!state.opts.ticker) { els.ticker.textContent = ""; return; }
    const pool = HEADLINES.filter(([req]) => req < 0 || state.totalVotes >= req)
      .map(([, h]) => h);
    // weight towards the most recently unlocked
    const unlocked = HEADLINES.filter(([req]) => req >= 0 && state.totalVotes >= req).map(([, h]) => h);
    let pick;
    if (unlocked.length && Math.random() < 0.4) pick = unlocked[unlocked.length - 1 - Math.floor(Math.random() * Math.min(3, unlocked.length))];
    else pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick === lastHeadline && pool.length > 1) return nextHeadline();
    lastHeadline = pick;
    els.ticker.classList.add("fade");
    setTimeout(() => { els.ticker.textContent = pick; els.ticker.classList.remove("fade"); }, 400);
  }

  // ------------------------------------------------------------------
  // Save / load
  // ------------------------------------------------------------------
  function serialize() {
    state.lastSave = Date.now();
    return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  }

  function deserialize(str) {
    const data = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
    const s = Object.assign(freshState(), data);
    s.buildings = Object.assign(freshState().buildings, data.buildings || {});
    s.upgrades = (data.upgrades || []).filter((id) => UPG_BY_ID[id]);
    s.achievements = (data.achievements || []).filter((id) => ACH_BY_ID[id]);
    s.opts = Object.assign(freshState().opts, data.opts || {});
    s.buffs = (data.buffs || []).filter((b) => b.until > Date.now());
    return s;
  }

  function save(quiet = true) {
    try {
      localStorage.setItem(SAVE_KEY, serialize());
      if (!quiet) toast("💾 Game saved", "Your campaign is safe.");
    } catch (e) {
      if (!quiet) toast("Couldn't save", "Your browser is blocking storage for this page.");
    }
  }

  function load() {
    let raw = null;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { /* storage blocked */ }
    if (!raw) return false;
    try {
      state = deserialize(raw);
      return true;
    } catch (e) {
      console.warn("Bad save, starting fresh", e);
      return false;
    }
  }

  function applyOffline() {
    const away = Math.min((Date.now() - state.lastSave) / 1000, OFFLINE_CAP_S);
    if (away < 30) return;
    recalc();
    const gain = cache.baseVps * away * OFFLINE_RATE;
    if (gain > 0) {
      earn(gain);
      toast("🌙 Welcome back!", `While you were away (${fmtTime(away)}), your campaign won ${fmt(gain, true)} votes.`);
    }
  }

  // ------------------------------------------------------------------
  // Loop
  // ------------------------------------------------------------------
  let last = performance.now();
  let slowAcc = 0, tickerAcc = 0;

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 3600);
    last = now;

    // expire buffs
    const t = Date.now();
    const before = state.buffs.length;
    state.buffs = state.buffs.filter((b) => b.until > t);
    if (state.buffs.length !== before) recalc();

    if (cache.vps > 0) earn(cache.vps * dt);

    if (!newsEl && t >= nextNewsAt) spawnNews();

    renderBank();
    renderBuildings();
    renderUpgrades();

    slowAcc += dt;
    if (slowAcc >= 0.5) {
      slowAcc = 0;
      recalc();
      checkAchievements();
      refreshTooltip();
      const active = document.querySelector(".tab.active").dataset.tab;
      if (active === "stats") renderStats();
      if (active === "campaign") renderHQ();
      if (active === "election") renderElection();
    }

    tickerAcc += dt;
    if (tickerAcc >= 9) { tickerAcc = 0; nextHeadline(); }

    requestAnimationFrame(frame);
  }

  function renderAll() {
    renderBank(); renderBuildings(); renderUpgrades(); renderHQ();
    renderStats(); renderAchievements(); renderElection();
    $("opt-particles").checked = state.opts.particles;
    $("opt-ticker").checked = state.opts.ticker;
  }

  // ------------------------------------------------------------------
  // Wire up
  // ------------------------------------------------------------------
  function init() {
    buildStore();
    buildAchievements();
    const loaded = load();
    recalc();
    if (loaded) applyOffline();
    recalc();
    renderAll();

    els.bibi.addEventListener("click", clickBibi);
    els.bibi.addEventListener("keydown", (e) => { if (e.repeat && (e.key === " " || e.key === "Enter")) e.preventDefault(); });

    document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
      document.querySelectorAll(".tab-body").forEach((b) => b.classList.toggle("hidden", b.id !== `tab-${tab.dataset.tab}`));
      renderAll();
    }));

    document.querySelectorAll(".amt").forEach((btn) => btn.addEventListener("click", () => {
      buyAmount = Number(btn.dataset.amt);
      document.querySelectorAll(".amt").forEach((b) => b.classList.toggle("active", b === btn));
      renderBuildings();
    }));

    els.btnElection.addEventListener("click", callElection);
    $("btn-save").addEventListener("click", () => save(false));
    $("btn-export").addEventListener("click", () => {
      els.saveText.value = serialize();
      els.saveText.select();
      toast("📤 Save exported", "Copy the text in the box to keep it somewhere safe.");
    });
    $("btn-import").addEventListener("click", () => {
      const txt = els.saveText.value.trim();
      if (!txt) { toast("Nothing to import", "Paste a save into the box first."); return; }
      try {
        state = deserialize(txt);
        upgSignature = "";
        recalc(); renderAll(); save();
        toast("📥 Save imported", "Welcome back to the campaign trail.");
      } catch (e) {
        toast("Import failed", "That doesn't look like a valid save.");
      }
    });
    $("btn-reset").addEventListener("click", () => {
      if (!confirm("Wipe your save completely? This can't be undone.")) return;
      try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
      state = freshState();
      upgSignature = "";
      recalc(); renderAll();
      toast("🧹 Save wiped", "A brand new campaign begins.");
    });
    $("opt-particles").addEventListener("change", (e) => { state.opts.particles = e.target.checked; });
    $("opt-ticker").addEventListener("change", (e) => { state.opts.ticker = e.target.checked; nextHeadline(); });

    setInterval(save, 10000);
    window.addEventListener("beforeunload", () => save());
    document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

    nextHeadline();
    requestAnimationFrame(frame);
  }

  init();
})();

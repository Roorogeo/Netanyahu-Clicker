// All game content: buildings, upgrades, ministers, achievements, events, headlines.
// IDs are part of the save format: never rename an existing one.

export const BUILDINGS = [
  { id: "volunteer", name: "Campaign Volunteer", cost: 15, vps: 0.1,
    desc: "Knocks on doors in Petah Tikva and hands out flyers.",
    map: { scale: 0.42, spacing: 0.55, cap: 40 } },
  { id: "falafel", name: "Falafel Stand Rally", cost: 120, vps: 1,
    desc: "Free falafel for anyone who stays for the whole speech.",
    map: { scale: 0.42, spacing: 0.85, cap: 20 } },
  { id: "branch", name: "Party Branch Office", cost: 1300, vps: 9,
    desc: "Plastic chairs, an electric kettle and a lot of phone calls.",
    map: { scale: 0.55, spacing: 1.0, cap: 14 } },
  { id: "radio", name: "Talk Radio Show", cost: 14000, vps: 50,
    desc: "Three hours of opinions every morning, plus a call-in segment.",
    map: { scale: 0.62, spacing: 1.15, cap: 10 } },
  { id: "billboard", name: "Highway Billboard", cost: 160000, vps: 280,
    desc: "A giant smiling face on the Ayalon. Nobody can miss it.",
    map: { scale: 0.6, spacing: 1.25, cap: 9 } },
  { id: "warroom", name: "Social Media War Room", cost: 2e6, vps: 1500,
    desc: "Twenty interns, forty phones, one hashtag.",
    map: { scale: 0.55, spacing: 1.0, cap: 12 } },
  { id: "coalition", name: "Coalition Partner", cost: 3e7, vps: 8500,
    desc: "Brings votes. Also brings a long list of demands.",
    map: { scale: 0.55, spacing: 1.3, cap: 8 } },
  { id: "startup", name: "Startup Nation Lab", cost: 4.5e8, vps: 48000,
    desc: "A unicorn that turns pitch decks into poll numbers.",
    map: { scale: 0.62, spacing: 1.15, cap: 9 } },
  { id: "committee", name: "Knesset Committee", cost: 7e9, vps: 280000,
    desc: "It meets, it deliberates, and somehow votes come out.",
    map: { scale: 0.8, spacing: 1.9, cap: 4 } },
  { id: "summit", name: "International Summit", cost: 1e11, vps: 1.7e6,
    desc: "Photo ops with world leaders look great back home.",
    map: { scale: 0.7, spacing: 1.5, cap: 5 } },
  { id: "spa", name: "Dead Sea Think Tank", cost: 1.5e12, vps: 1.1e7,
    desc: "Policy ideas float effortlessly at the lowest point on Earth.",
    map: { scale: 0.85, spacing: 1.9, cap: 4 } },
  { id: "satellite", name: "Campaign Satellite", cost: 2.2e13, vps: 7e7,
    desc: "Beams the stump speech to every phone in the region.",
    map: { scale: 0.55, spacing: 0, cap: 12, orbit: true } },
  { id: "quantum", name: "Quantum Pollster", cost: 3.3e14, vps: 4.5e8,
    desc: "Surveys every possible voter in every possible universe at once.",
    map: { scale: 0.75, spacing: 1.6, cap: 4 } },
  { id: "portal", name: "Interdimensional Rally", cost: 5e15, vps: 3e9,
    desc: "Opens a door to cheering crowds from parallel timelines.",
    map: { scale: 0.8, spacing: 1.9, cap: 3 } },
];
export const BLD_BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));

// Tier upgrades: [name, owned needed, cost multiplier, frame]
export const TIERS = [
  ["Training Seminar", 1, 10, "bronze"],
  ["Catchy Slogans", 5, 50, "silver"],
  ["Prime-Time Coverage", 25, 500, "gold"],
  ["Grassroots Network", 50, 50000, "platinum"],
  ["Coalition Synergy", 100, 5e6, "ruby"],
  ["Historic Mandate", 150, 5e8, "diamond"],
];

export const UPGRADES = [];

BUILDINGS.forEach((b) => {
  TIERS.forEach(([tname, req, mult, frame], i) => {
    UPGRADES.push({
      id: `${b.id}_t${i}`, name: `${tname}: ${b.name}`, icon: b.id, frame, cost: b.cost * mult,
      desc: `${b.name}s are <b>twice</b> as effective.`,
      unlock: (s) => s.buildings[b.id] >= req,
      kind: "building", target: b.id, value: 2,
    });
  });
});

[
  ["Firm Handshake", "handshake", 100, 1, "Every voter remembers a good handshake."],
  ["Baby Kissing", "baby", 500, 1, "A campaign classic for a reason."],
  ["Two Thumbs Up", "thumb", 10000, 10, "Both thumbs. Total commitment."],
  ["Rousing Speech", "mic", 1e5, 25, "\"My fellow citizens…\""],
  ["Perfect Hair Day", "comb", 1e7, 50, "Not a single strand out of place."],
  ["Selfie Marathon", "person", 1e9, 500, "Four hours, three thousand selfies, one sore smile."],
].forEach(([name, icon, cost, req, flavor], i) => {
  UPGRADES.push({
    id: `click_${i}`, name, icon, frame: "blue", cost, flavor,
    desc: "Clicking is <b>twice</b> as effective.",
    unlock: (s) => s.clicks >= req, kind: "click", value: 2,
  });
});

[
  ["Charisma", "star", 5e4, 1e3],
  ["Star Power", "starSilver", 5e6, 1e5],
  ["Living Legend", "starBlue", 5e8, 1e7],
  ["Political Icon", "starRuby", 5e10, 1e9],
  ["The Comeback Kid", "starPurple", 5e12, 1e11],
].forEach(([name, icon, cost, req], i) => {
  UPGRADES.push({
    id: `charisma_${i}`, name, icon, frame: "gold", cost,
    desc: "Each click also earns <b>+1%</b> of your votes per second.",
    flavor: "People cheer before you even open your mouth.",
    unlock: (s) => s.totalVotes >= req, kind: "clickVps", value: 0.01,
  });
});

[
  ["Shakshuka Breakfast", "shakshuka", 5e4, 0.1, "The most important meal of the campaign."],
  ["Hummus Diplomacy", "hummus", 1e6, 0.1, "Nothing unites people like a good bowl of hummus."],
  ["Hora Dance Rally", "hora", 5e7, 0.15, "Everyone in a circle. Nobody is allowed to sit down."],
  ["Shabbat Recharge", "candles", 2e9, 0.15, "Even a campaign rests sometimes."],
  ["Jerusalem Sunrise", "walls", 1e11, 0.2, "Golden light on old stone walls. Very photogenic."],
  ["Tel Aviv Beach Tour", "beach", 5e12, 0.2, "Frisbees, matkot paddles and voter registration."],
  ["Startup Nation Spirit", "bulb", 2e14, 0.25, "Ask forgiveness, not permission."],
  ["Sabra Resilience", "cactus", 1e16, 0.25, "Prickly on the outside, sweet on the inside."],
  ["Golden Ballot Box", "ballot", 5e17, 0.3, "Shiny enough to see your reflection in it."],
  ["The Crown of Polls", "crown", 2e19, 0.3, "Purely ceremonial. Mostly."],
].forEach(([name, icon, cost, value, flavor], i) => {
  UPGRADES.push({
    id: `global_${i}`, name, icon, frame: "flag", cost, flavor,
    desc: `All vote production <b>+${Math.round(value * 100)}%</b>.`,
    unlock: (s) => s.totalVotes >= cost / 3, kind: "global", value,
  });
});

// Synergies: target gets +per% for every source building owned
[
  ["Volunteer Snack Program", "volunteer", "falafel", 0.05, 15, 3e4, "Nobody knocks on doors better than a well-fed volunteer."],
  ["Talk Radio Hotline", "branch", "radio", 0.03, 15, 5e6, "\"You're on the air. Which branch office are you calling from?\""],
  ["Billboard QR Codes", "billboard", "warroom", 0.02, 15, 8e8, "Scan the giant face to follow the campaign."],
  ["Coalition Accelerator", "coalition", "startup", 0.02, 15, 9e10, "Partners now pitch their demands as slide decks."],
  ["Summit Livestream", "summit", "satellite", 0.01, 15, 4e14, "Every handshake, beamed live from orbit."],
  ["Salt-Water Qubits", "quantum", "spa", 0.01, 10, 7e16, "It turns out Dead Sea minerals are great for coherence."],
].forEach(([name, target, source, per, req, cost, flavor], i) => {
  UPGRADES.push({
    id: `synergy_${i}`, name, icon: target, badge: source, frame: "synergy", cost, flavor,
    desc: `${BLD_BY_ID[target].name}s gain <b>+${Math.round(per * 100)}%</b> for every ${BLD_BY_ID[source].name} you own.`,
    unlock: (s) => s.buildings[target] >= req && s.buildings[source] >= req,
    kind: "synergy", target, source, value: per,
  });
});

UPGRADES.push(
  { id: "news_0", name: "Press Secretary", icon: "newspaper", frame: "blue", cost: 7.7e5,
    desc: "Breaking News appears <b>twice as often</b>.", flavor: "\"No comment\" is also a comment.",
    unlock: (s) => s.newsClicked >= 3, kind: "newsFreq", value: 2 },
  { id: "news_1", name: "24-Hour News Cycle", icon: "tv", frame: "blue", cost: 7.7e8,
    desc: "Breaking News effects last <b>twice as long</b>.", flavor: "Always on. Always breaking.",
    unlock: (s) => s.newsClicked >= 10, kind: "newsDur", value: 2 },
  { id: "rally_0", name: "Megaphone", icon: "megaphone", frame: "blue", cost: 2.5e4,
    desc: "The Rally meter fills <b>50% faster</b>.", flavor: "For when the microphone isn't loud enough.",
    unlock: (s) => s.rallies >= 1, kind: "rallyFill", value: 1.5 },
  { id: "rally_1", name: "Fireworks Finale", icon: "fireworks", frame: "blue", cost: 2.5e7,
    desc: "Rallies last <b>5 seconds longer</b>.", flavor: "Blue and white, of course.",
    unlock: (s) => s.rallies >= 5, kind: "rallyDur", value: 5 },
  { id: "decision_0", name: "Cabinet Secretary", icon: "scroll", frame: "blue", cost: 3e6,
    desc: "Cabinet Decisions come up <b>twice as often</b>.", flavor: "Keeps the agenda moving. Mostly.",
    unlock: (s) => s.decisions >= 2, kind: "decisionFreq", value: 2 },
  { id: "offline_0", name: "Night Shift Volunteers", icon: "clock", frame: "blue", cost: 1e8,
    desc: "Production while you're away rises by <b>+25%</b>.", flavor: "The campaign never sleeps. The volunteers do, in shifts.",
    unlock: (s) => s.totalVotes >= 2e7, kind: "offline", value: 0.25 },
);

export const UPG_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

// Permanent perks unlocked by Knesset seats (kept across elections)
export const MINISTERS = [
  { seats: 1, id: "finance", name: "Minister of Finance", icon: "briefcase", desc: "All production <b>+10%</b>." },
  { seats: 3, id: "comms", name: "Minister of Communications", icon: "newspaper", desc: "Breaking News appears <b>30% more often</b>." },
  { seats: 5, id: "tourism", name: "Minister of Tourism", icon: "beach", desc: "Production while you're away <b>+25%</b>." },
  { seats: 10, id: "transport", name: "Minister of Transport", icon: "startup", desc: "All buildings are <b>5% cheaper</b>." },
  { seats: 20, id: "culture", name: "Minister of Culture", icon: "hora", desc: "Rallies last <b>50% longer</b>." },
  { seats: 40, id: "education", name: "Minister of Education", icon: "branch", desc: "Start each new term with <b>10 Volunteers and 5 Falafel Stands</b>." },
  { seats: 61, id: "majority", name: "Coalition Majority", icon: "chair", desc: "All production <b>×1.5</b>." },
  { seats: 90, id: "science", name: "Minister of Science", icon: "bulb", desc: "All upgrades are <b>10% cheaper</b>." },
  { seats: 120, id: "fullhouse", name: "Full House", icon: "crown", desc: "All production <b>×2</b>." },
];

// ---------- achievements ----------
export const ACHIEVEMENTS = [];
const ach = (id, name, icon, medal, desc, test) => ACHIEVEMENTS.push({ id, name, icon, medal, desc, test });
const plural = (n, one, many) => (n === 1 ? one : many);

[
  [1, "First Vote", "ballot"], [1e3, "Neighbourhood Favourite", "volunteer"], [1e5, "City Council Material", "branch"],
  [1e6, "Million-Vote March", "hora"], [1e9, "Landslide", "billboard"], [1e12, "Trillion Ballots", "ballot"],
  [1e15, "Beyond Polling", "quantum"], [1e18, "Statistical Impossibility", "portal"], [1e21, "Multiverse Mandate", "crown"],
].forEach(([n, name, icon], i) => ach(`votes_${i}`, name, icon, i < 3 ? "medalBronze" : i < 6 ? "medalSilver" : "medal",
  { n, text: (f) => `Win ${f(n)} ${plural(n, "vote", "votes")} in one term.` }, (s) => s.totalVotes >= n));

[[1, "Hands-On", "hand"], [100, "Handshake Marathon", "handshake"], [1000, "Carpal Campaign", "thumb"], [10000, "Clicker-in-Chief", "star"], [50000, "Legendary Grip", "crown"]]
  .forEach(([n, name, icon], i) => ach(`clicks_${i}`, name, icon, i < 2 ? "medalBronze" : i < 4 ? "medalSilver" : "medal",
    { n, text: (f) => `Click Bibi ${f(n)} ${plural(n, "time", "times")}.` }, (s) => s.clicks >= n));

[[10, "Grassroots", "volunteer"], [1000, "Political Machine", "radio"], [1e6, "Unstoppable Momentum", "startup"], [1e9, "Juggernaut", "satellite"], [1e12, "Force of Nature", "portal"]]
  .forEach(([n, name, icon], i) => ach(`vps_${i}`, name, icon, i < 2 ? "medalBronze" : i < 4 ? "medalSilver" : "medal",
    { n, text: (f) => `Reach ${f(n)} votes per second.` }, (s, d) => d.vps >= n));

BUILDINGS.forEach((b) => {
  ach(`own_${b.id}_1`, `${b.name}: Hired`, b.id, "medalBronze", { text: () => `Own 1 ${b.name}.` }, (s) => s.buildings[b.id] >= 1);
  ach(`own_${b.id}_50`, `${b.name}: Empire`, b.id, "medalSilver", { text: () => `Own 50 ${b.name}s.` }, (s) => s.buildings[b.id] >= 50);
  ach(`own_${b.id}_100`, `${b.name}: Dynasty`, b.id, "medal", { text: () => `Own 100 ${b.name}s.` }, (s) => s.buildings[b.id] >= 100);
});

[[1, "Hot off the Press", "medalBronze"], [10, "Media Darling", "medalSilver"], [50, "Headline Machine", "medal"]]
  .forEach(([n, name, medal], i) => ach(`news_${i}`, name, "newspaper", medal,
    { text: () => `Click ${n} Breaking News ${plural(n, "story", "stories")}.` }, (s) => s.newsClicked >= n));

[[1, "Back to the Polls", "medalBronze"], [5, "Election Season", "medalSilver"], [20, "Perpetual Campaign", "medal"]]
  .forEach(([n, name, medal], i) => ach(`elect_${i}`, name, "ballot", medal,
    { text: () => `Call early elections ${n} ${plural(n, "time", "times")}.` }, (s) => s.elections >= n));

[[1, "Crowd Pleaser", "medalBronze"], [10, "Rally Regular", "medalSilver"], [50, "Stadium Tour", "medal"]]
  .forEach(([n, name, medal], i) => ach(`rally_${i}`, name, "megaphone", medal,
    { text: () => `Start ${n} ${plural(n, "rally", "rallies")}.` }, (s) => s.rallies >= n));

[[1, "Decisive", "medalBronze"], [10, "Cabinet Veteran", "medalSilver"], [40, "Policy Machine", "medal"]]
  .forEach(([n, name, medal], i) => ach(`decide_${i}`, name, "scroll", medal,
    { text: () => `Make ${n} Cabinet ${plural(n, "Decision", "Decisions")}.` }, (s) => s.decisions >= n));

ach("seats_61", "Majority!", "chair", "medal", { text: () => "Hold 61 Knesset seats." }, (s) => s.seats >= 61);
ach("seats_120", "The Whole Knesset", "crown", "medal", { text: () => "Hold 120 Knesset seats." }, (s) => s.seats >= 120);
ach("upg_all10", "Policy Wonk", "bulb", "medalBronze", { text: () => "Own 10 upgrades." }, (s) => s.upgrades.length >= 10);
ach("upg_all50", "Platform Architect", "walls", "medalSilver", { text: () => "Own 50 upgrades." }, (s) => s.upgrades.length >= 50);
ach("upg_all100", "Manifesto", "scroll", "medal", { text: () => "Own 100 upgrades." }, (s) => s.upgrades.length >= 100);

export const ACH_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

// ---------- Breaking News ----------
export const NEWS_EFFECTS = [
  { id: "surge", weight: 40, title: "Poll Surge!", body: "Vote production ×5 for {d} seconds.",
    buff: { key: "surge", label: "Poll Surge ×5", icon: "billboard", vpsMult: 5, dur: 45 } },
  { id: "viral", weight: 15, title: "Viral Speech!", body: "Clicks are ×50 for {d} seconds.",
    buff: { key: "viral", label: "Viral Speech · clicks ×50", icon: "mic", clickMult: 50, dur: 12 } },
  { id: "endorse", weight: 38, title: "Surprise Endorsement!", body: "+{v} votes!", lump: { bankFrac: 0.15, vpsSeconds: 900 } },
  { id: "landslide", weight: 7, title: "Landslide Forecast!", body: "Vote production ×12 for {d} seconds!",
    buff: { key: "landslide", label: "Landslide ×12", icon: "crown", vpsMult: 12, dur: 20 } },
];

// ---------- Cabinet Decisions (two-choice events) ----------
// Effects: { buff: {...} } | { lumpVps: seconds } | { costFrac, then: {...} } | { gamble: chance, win: {...}, lose: text }
export const DECISIONS = [
  { id: "ministry", title: "A coalition partner wants a brand-new ministry, just for them.",
    a: { label: "Create the Ministry of Ministries", effect: { buff: { key: "ministry", label: "Ministry of Ministries ×1.5", icon: "briefcase", vpsMult: 1.5, dur: 120 } } },
    b: { label: "Offer a nice parking spot instead", effect: { lumpVps: 600 } } },
  { id: "debate", title: "The opposition challenges you to a live TV debate.",
    a: { label: "Accept the challenge", effect: { gamble: 0.6, win: { buff: { key: "debate", label: "Debate Win · clicks ×20", icon: "tv", clickMult: 20, dur: 30 } }, lose: "You were… fine. Nobody remembers it." } },
    b: { label: "Post a strongly worded tweet", effect: { lumpVps: 300 } } },
  { id: "hummus", title: "A hummus shortage hits Tel Aviv!",
    a: { label: "Emergency chickpea airlift (costs 5% of your votes)", effect: { costFrac: 0.05, then: { buff: { key: "airlift", label: "Chickpea Airlift ×3", icon: "hummus", vpsMult: 3, dur: 60 } } } },
    b: { label: "Promise a hummus summit next week", effect: { lumpVps: 240 } } },
  { id: "dance", title: "A dance video of you is going viral.",
    a: { label: "Lean in and post a sequel", effect: { buff: { key: "dance", label: "Viral Dance · clicks ×10", icon: "hora", clickMult: 10, dur: 30 } } },
    b: { label: "Dignified silence", effect: { buff: { key: "dignity", label: "Dignified ×1.5", icon: "crown", vpsMult: 1.5, dur: 180 } } } },
  { id: "traffic", title: "Highway 1 is gridlocked again. Commuters are furious.",
    a: { label: "Announce a new train line", effect: { buff: { key: "train", label: "Train Promise ×2", icon: "startup", vpsMult: 2, dur: 90 } } },
    b: { label: "Hand out free coffee in the jam", effect: { lumpVps: 450 } } },
  { id: "startup", title: "A startup wants you to invest in its blockchain falafel.",
    a: { label: "Invest (50% chance of a big payoff)", effect: { gamble: 0.5, win: { lumpVps: 1800 }, lose: "The blockchain falafel was, sadly, just falafel." } },
    b: { label: "Politely decline", effect: { lumpVps: 120 } } },
  { id: "eurovision", title: "Israel just did great at a song contest. Everyone is singing.",
    a: { label: "Throw a victory street party", effect: { buff: { key: "party", label: "Street Party ×2.5", icon: "fireworks", vpsMult: 2.5, dur: 60 } } },
    b: { label: "Sing along on the radio", effect: { lumpVps: 400 } } },
];

// ---------- news ticker ----------
export const HEADLINES = [
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
  [1e14, "Campaign satellite spotted waving at the International Space Station."],
  [1e15, "Quantum pollster reports you are simultaneously winning and winning."],
  [1e16, "The number of votes now exceeds the number of humans. Nobody asks questions."],
  [1e18, "Parallel-universe you sends congratulations. Also wants a coalition deal."],
  [-1, "Weather: sunny with a 100% chance of campaign rallies."],
  [-1, "Traffic jam on Highway 1 caused by enthusiastic supporters."],
  [-1, "Op-ed: \"Is it the hair? An investigation.\""],
  [-1, "Local grandmother has already decided. She won't say who."],
  [-1, "New poll shows that polls are popular."],
  [-1, "Matkot paddle sales up 300% on Gordon Beach."],
  [-1, "Campaign volunteer sets record: 412 doors knocked, 3 cups of coffee accepted."],
  [-1, "Shuk vendors report record demand for blue-and-white everything."],
];

// Extra headlines mixed into the ticker in Pride mode
export const PRIDE_HEADLINES = [
  "Tel Aviv Pride parade draws record crowds to the beachfront.",
  "Rainbow flags spotted on every balcony on Rothschild Boulevard.",
  "Campaign volunteers hand out rainbow stickers and free iced coffee.",
  "Gordon Beach dance party goes until sunrise. Turnout: excellent.",
  "Campaign HQ reports glitter in every drawer. Cleanup expected to take years.",
  "Pride Week brings music, color and very long falafel lines to Tel Aviv.",
  "Local grandmother marches in her first Pride parade, waves the biggest flag.",
];

export const SEATS_TOTAL = 120;

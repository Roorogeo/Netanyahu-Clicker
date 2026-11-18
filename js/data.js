// All game content: buildings, upgrades, ministers, achievements, events, headlines.
// IDs are part of the save format: never rename an existing one.

export const BUILDINGS = [
  { id: "volunteer", name: "Campaign Volunteer", cost: 15, vps: 0.1,
    desc: "Knocks on doors in Petah Tikva and hands out flyers.",
    map: { scale: 0.42, spacing: 0.55, cap: 40 } },
  { id: "falafel", name: "Falafel Stand Rally", cost: 120, vps: 1,
    desc: "Free falafel for anyone who stays for the whole speech.",
    map: { scale: 0.42, spacing: 0.85, cap: 20 } },
  { id: "shuk", name: "Shuk Stall", cost: 500, vps: 4,
    desc: "Fresh fruit, loud vendors and a campaign flyer in every bag.",
    map: { scale: 0.42, spacing: 0.85, cap: 16 } },
  { id: "branch", name: "Party Branch Office", cost: 1300, vps: 9,
    desc: "Plastic chairs, an electric kettle and a lot of phone calls.",
    map: { scale: 0.55, spacing: 1.0, cap: 14 } },
  { id: "bus", name: "Campaign Bus", cost: 5000, vps: 25,
    desc: "A blue-and-white bus that stops in every town, twice.",
    map: { scale: 0.48, spacing: 1.1, cap: 10 } },
  { id: "radio", name: "Talk Radio Show", cost: 14000, vps: 50,
    desc: "Three hours of opinions every morning, plus a call-in segment.",
    map: { scale: 0.62, spacing: 1.15, cap: 10 } },
  { id: "rooftop", name: "Rooftop Rally", cost: 60000, vps: 140,
    desc: "Speakers on the roof, a crowd in the street below.",
    map: { scale: 0.55, spacing: 1.1, cap: 10 } },
  { id: "billboard", name: "Highway Billboard", cost: 160000, vps: 280,
    desc: "A giant smiling face on the Ayalon. Nobody can miss it.",
    map: { scale: 0.6, spacing: 1.25, cap: 9 } },
  { id: "phonebank", name: "Phone Bank", cost: 6e5, vps: 700,
    desc: "\"Hello, do you have two minutes to talk about the future?\"",
    map: { scale: 0.5, spacing: 1.0, cap: 10 } },
  { id: "warroom", name: "Social Media War Room", cost: 2e6, vps: 1500,
    desc: "Twenty interns, forty phones, one hashtag.",
    map: { scale: 0.55, spacing: 1.0, cap: 12 } },
  { id: "coalition", name: "Coalition Partner", cost: 3e7, vps: 8500,
    desc: "Brings votes. Also brings a long list of demands.",
    map: { scale: 0.55, spacing: 1.3, cap: 8 } },
  { id: "studio", name: "Election Night Studio", cost: 1.2e8, vps: 25000,
    desc: "Big screens, bigger graphics, and an anchor who never blinks.",
    map: { scale: 0.55, spacing: 1.15, cap: 8 } },
  { id: "startup", name: "Startup Nation Lab", cost: 4.5e8, vps: 48000,
    desc: "A unicorn that turns pitch decks into poll numbers.",
    map: { scale: 0.62, spacing: 1.15, cap: 9 } },
  { id: "tower", name: "Tech Park Tower", cost: 1.8e9, vps: 140000,
    desc: "Forty floors of engineers optimizing your slogans.",
    map: { scale: 0.5, spacing: 1.0, cap: 8 } },
  { id: "committee", name: "Knesset Committee", cost: 7e9, vps: 280000,
    desc: "It meets, it deliberates, and somehow votes come out.",
    map: { scale: 0.8, spacing: 1.9, cap: 4 } },
  { id: "train", name: "Train to Jerusalem", cost: 3e10, vps: 8e5,
    desc: "A whistle-stop tour with a rally at every station.",
    map: { scale: 0.5, spacing: 1.4, cap: 6 } },
  { id: "summit", name: "International Summit", cost: 1e11, vps: 1.7e6,
    desc: "Photo ops with world leaders look great back home.",
    map: { scale: 0.7, spacing: 1.5, cap: 5 } },
  { id: "cruise", name: "Campaign Cruise Ship", cost: 4e11, vps: 5e6,
    desc: "Haifa to Eilat, with rallies on the deck every evening.",
    map: { scale: 0.55, spacing: 1.6, cap: 5 } },
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
  { id: "hologram", name: "Holographic Rally", cost: 7.5e16, vps: 2.1e10,
    desc: "A thousand rallies at once, each one in perfect focus.",
    map: { scale: 0.62, cap: 6, orbit: { rad: 15.5, y: 8.5 } } },
  { id: "moonbase", name: "Moon Base Campaign Office", cost: 1.1e18, vps: 1.5e11,
    desc: "Low gravity, high turnout. The view of the coastline is great.",
    map: { scale: 0.8, cap: 5, orbit: { rad: 17.5, y: 10.5 } } },
  { id: "mars", name: "Mars Colony Chapter", cost: 1.7e19, vps: 1.05e12,
    desc: "The red planet's first polling station. Lines are short.",
    map: { scale: 0.8, cap: 5, orbit: { rad: 19.5, y: 12.5 } } },
  { id: "dyson", name: "Dyson Sphere Billboard", cost: 2.6e20, vps: 7.3e12,
    desc: "An entire star, wrapped in one very large campaign poster.",
    map: { scale: 0.9, cap: 4, orbit: { rad: 21.5, y: 14.5 } } },
  { id: "senate", name: "Galactic Senate Seat", cost: 4e21, vps: 5.1e13,
    desc: "Representing the Orion Arm, with a strong falafel platform.",
    map: { scale: 0.85, cap: 4, orbit: { rad: 14, y: 16.5 } } },
  { id: "wormhole", name: "Wormhole Phone Bank", cost: 6e22, vps: 3.6e14,
    desc: "Calls voters in other galaxies before dinner time.",
    map: { scale: 0.8, cap: 4, orbit: { rad: 18, y: 18.5 } } },
  { id: "multiverse", name: "Multiverse Coalition", cost: 9e23, vps: 2.5e15,
    desc: "Every version of every party, finally agreeing on something.",
    map: { scale: 0.85, cap: 3, orbit: { rad: 22, y: 20 } } },
  { id: "bigbang", name: "Big Bang Rebrand", cost: 1.4e25, vps: 1.75e16,
    desc: "Restarts the universe with your campaign logo already on it.",
    map: { scale: 1.0, cap: 2, orbit: { rad: 12, y: 22 } } },
  { id: "blackhole", name: "Black Hole Debate Stage", cost: 2.1e26, vps: 1.2e17,
    desc: "No argument escapes. Neither does the audience.",
    map: { scale: 0.85, cap: 2, orbit: { rad: 24, y: 23 } } },
  { id: "nebula", name: "Nebula Campaign Trail", cost: 3.2e27, vps: 8.6e17,
    desc: "A billion-mile road trip through glowing clouds of voters.",
    map: { scale: 0.9, cap: 2, orbit: { rad: 16, y: 25 } } },
  { id: "timemachine", name: "Time Machine Rally", cost: 4.8e28, vps: 6e18,
    desc: "Holds the same great rally on every date in history.",
    map: { scale: 0.85, cap: 2, orbit: { rad: 20, y: 26.5 } } },
  { id: "alienembassy", name: "Alien Embassy", cost: 7.2e29, vps: 4.2e19,
    desc: "First contact went well. They'd like some campaign stickers.",
    map: { scale: 0.9, cap: 2, orbit: { rad: 27, y: 18 } } },
  { id: "starforge", name: "Star-Forge Printing Press", cost: 1.1e31, vps: 2.9e20,
    desc: "Prints flyers with the heat of a newborn star.",
    map: { scale: 0.85, cap: 2, orbit: { rad: 13, y: 28 } } },
  { id: "parade", name: "Galactic Parade", cost: 1.6e32, vps: 2e21,
    desc: "Balloons the size of moons. The confetti is comets.",
    map: { scale: 0.9, cap: 2, orbit: { rad: 23, y: 29.5 } } },
  { id: "pocketuniverse", name: "Pocket Universe HQ", cost: 2.4e33, vps: 1.4e22,
    desc: "An entire universe in a snow globe, and it's all campaign staff.",
    map: { scale: 0.9, cap: 2, orbit: { rad: 18, y: 31 } } },
  { id: "cosmicstring", name: "Cosmic String Orchestra", cost: 3.6e34, vps: 1e23,
    desc: "Plays the campaign jingle on the strings of spacetime.",
    map: { scale: 0.9, cap: 2, orbit: { rad: 26, y: 32.5 } } },
  { id: "realityeditor", name: "Reality Editor", cost: 5.4e35, vps: 7e23,
    desc: "Undo, redo, and win. Mostly win.",
    map: { scale: 0.9, cap: 2, orbit: { rad: 14, y: 34 } } },
  { id: "omniverse", name: "The Omniverse Ballot", cost: 8.1e36, vps: 4.9e24,
    desc: "One ballot box for every vote that could ever be cast.",
    map: { scale: 1.1, cap: 1, orbit: { rad: 9, y: 36 } } },
];
// Space age and beyond: each building is less cost-efficient than the last (about ×4.5 production
// per ×15 cost), so huge multipliers can't skip through the late game.
for (let i = BUILDINGS.findIndex((b) => b.id === "hologram"); i > 0 && i < BUILDINGS.length; i++) {
  const prev = BUILDINGS[i - 1], b = BUILDINGS[i];
  b.vps = Number((prev.vps * 4.5 * Math.pow(b.cost / prev.cost / 15, 0.6)).toPrecision(3));
}
export const BLD_BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));

// Tier upgrades: [name, owned needed, cost multiplier, frame]
export const TIERS = [
  ["Training Seminar", 1, 10, "bronze"],
  ["Catchy Slogans", 5, 50, "silver"],
  ["Prime-Time Coverage", 25, 500, "gold"],
  ["Grassroots Network", 50, 50000, "platinum"],
  ["Coalition Synergy", 100, 5e6, "ruby"],
  ["Historic Mandate", 150, 5e8, "diamond"],
  ["Legendary Machine", 200, 5e10, "cosmic"],
  ["Eternal Institution", 300, 5e13, "eternal"],
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
  ["Stadium Tour", "hora", 1e11, 1000, "Twelve cities, one encore each."],
  ["Hologram Address", "hologram", 1e14, 2000, "Appear in every town square at the same time."],
  ["Interplanetary Speech", "moonbase", 1e18, 4000, "\"Citizens of Earth, the Moon and Mars…\""],
  ["Voice of a Generation", "mic", 1e22, 8000, "Everyone can do the impression."],
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
  ["Galactic Celebrity", "star", 5e16, 1e15],
  ["Cosmic Icon", "starBlue", 5e20, 1e19],
  ["Timeless", "starRuby", 5e24, 1e23],
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
  ["Kibbutz Spirit", "coalition", 5e20, 0.35, "Everyone pitches in, everyone eats together."],
  ["Silicon Wadi", "startup", 2e22, 0.35, "Another startup, another exit, another rally."],
  ["Desert Bloom", "cactus", 1e24, 0.4, "Drip irrigation for the soul."],
  ["Sea of Galilee Calm", "beach", 5e25, 0.4, "A quiet morning by the water does wonders for polling."],
  ["Eilat Coral Reef", "spa", 2e27, 0.45, "Colorful, resilient and very photogenic."],
  ["Galactic Hummus", "hummus", 1e29, 0.45, "Now available in zero gravity."],
  ["Cosmic Shakshuka", "shakshuka", 5e30, 0.5, "Cooked on the surface of a friendly star."],
  ["Universal Approval", "senate", 2e32, 0.5, "Polls in every galaxy say the same thing."],
  ["Multiversal Mandate", "multiverse", 1e34, 0.6, "Every timeline, one result."],
  ["The Final Slogan", "bigbang", 5e35, 0.75, "Three words. Nobody knows what they are. Everyone agrees."],
  ["Event Horizon Appeal", "blackhole", 2e37, 0.75, "Once voters cross it, they never switch sides."],
  ["Nebula Glow", "nebula", 1e39, 0.8, "Every photo is lit by a stellar nursery."],
  ["Timeless Message", "timemachine", 5e40, 0.8, "It sounds right in every century."],
  ["Interstellar Diplomacy", "alienembassy", 2e42, 0.9, "\"Take us to your campaign manager.\""],
  ["Universe in a Pocket", "pocketuniverse", 1e44, 0.9, "Carry your base everywhere you go."],
  ["The Last Ballot", "omniverse", 5e45, 1.0, "Every vote, everywhere, forever."],
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
  ["Viral Holograms", "hologram", "warroom", 0.01, 10, 1e19, "Every hologram ships with its own hashtag."],
  ["Moon Relay", "moonbase", "satellite", 0.01, 10, 2e20, "Satellites bounce the stump speech off the Moon."],
  ["Red Planet Express", "mars", "moonbase", 0.01, 10, 3e21, "A shuttle every Tuesday. Falafel on board."],
  ["Phone Bank Partners", "wormhole", "radio", 0.005, 10, 1e24, "Talk radio callers, now from other galaxies."],
  ["Coalition of Coalitions", "multiverse", "coalition", 0.005, 10, 2e25, "Partners all the way down."],
  ["Quantum Origins", "bigbang", "quantum", 0.005, 10, 3e26, "The pollster saw this coming in every universe."],
  ["Shuk Supply Chain", "shuk", "falafel", 0.04, 15, 8e4, "The falafel guys need tomatoes. The shuk has tomatoes."],
  ["Ride-Along Volunteers", "bus", "volunteer", 0.01, 15, 6e5, "Every seat on the bus is a volunteer with a clipboard."],
  ["Call-In Lines", "phonebank", "radio", 0.02, 15, 9e7, "Radio listeners get a call back the same day."],
  ["Second Screen", "studio", "warroom", 0.01, 15, 2e10, "Live results on TV, live memes on phones."],
  ["Startup Campus", "tower", "startup", 0.01, 15, 3e11, "The lab spins out; the tower moves in."],
  ["Express Line", "train", "bus", 0.02, 10, 5e12, "Buses meet every train, every station."],
  ["Diplomatic Cruise", "cruise", "summit", 0.01, 10, 8e13, "Summits are better at sea."],
  ["Stellar Nursery", "nebula", "dyson", 0.005, 5, 2e29, "Dyson spheres keep the nebula warm."],
  ["Galactic Liaison", "alienembassy", "senate", 0.005, 5, 4e31, "Senators make great tour guides for aliens."],
  ["Final Coalition", "omniverse", "multiverse", 0.003, 3, 5e38, "Every coalition joins the last one."],
].forEach(([name, target, source, per, req, cost, flavor], i) => {
  UPGRADES.push({
    id: `synergy_${i}`, name, icon: target, badge: source, frame: "synergy", cost, flavor,
    desc: `${BLD_BY_ID[target].name}s gain <b>+${Math.round(per * 1000) / 10}%</b> for every ${BLD_BY_ID[source].name} you own (up to 100).`,
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
  { seats: 61, id: "majority", name: "Coalition Majority", icon: "chair", desc: "All production <b>+25%</b>." },
  { seats: 90, id: "science", name: "Minister of Science", icon: "bulb", desc: "All upgrades are <b>10% cheaper</b>." },
  { seats: 120, id: "fullhouse", name: "Full House", icon: "crown", desc: "All production <b>+50%</b>." },
  { seats: 200, id: "space", name: "Minister of Space", icon: "moonbase", desc: "All production <b>+50%</b>." },
  { seats: 500, id: "time", name: "Minister of Time", icon: "clock", desc: "Offline production lasts up to <b>24 hours</b> instead of 12." },
  { seats: 1000, id: "everything", name: "Minister of Everything", icon: "multiverse", desc: "All production <b>×2</b>." },
];

// ---------- Legacy Tree (prestige) ----------
// Bought with Political Capital: 1 point per Knesset seat won in elections. Kept forever.
// x/y place the node on the tree (0-100). A node needs all of its parents.
export const TREE = [
  { id: "root", name: "Party Founder", icon: "ballot", cost: 1, x: 50, y: 90, parents: [], desc: "All production <b>+10%</b>." },

  { id: "door", name: "Door-to-Door", icon: "volunteer", cost: 2, x: 12, y: 70, parents: ["root"], branch: "Grassroots", desc: "Volunteers and Falafel Stands are <b>twice</b> as effective." },
  { id: "heroes", name: "Local Heroes", icon: "branch", cost: 5, x: 12, y: 52, parents: ["door"], branch: "Grassroots", desc: "All buildings are <b>10% cheaper</b>." },
  { id: "machine", name: "Machine Politics", icon: "coalition", cost: 15, x: 12, y: 34, parents: ["heroes"], branch: "Grassroots", desc: "<b>+2%</b> production for every building type you own." },
  { id: "movement", name: "Mass Movement", icon: "hora", cost: 40, x: 12, y: 16, parents: ["machine"], branch: "Grassroots", desc: "All production <b>×1.5</b>." },

  { id: "orator", name: "Born Orator", icon: "mic", cost: 2, x: 37, y: 70, parents: ["root"], branch: "Charisma", desc: "Clicks are <b>three times</b> as effective." },
  { id: "surfer", name: "Crowd Surfer", icon: "megaphone", cost: 5, x: 37, y: 52, parents: ["orator"], branch: "Charisma", desc: "The Rally meter fills <b>twice as fast</b>." },
  { id: "encore", name: "Encore!", icon: "fireworks", cost: 15, x: 37, y: 34, parents: ["surfer"], branch: "Charisma", desc: "Rallies last <b>10 seconds longer</b>." },
  { id: "magnetic", name: "Magnetic", icon: "star", cost: 40, x: 37, y: 16, parents: ["encore"], branch: "Charisma", desc: "Each click also earns <b>+3%</b> of your votes per second." },

  { id: "spin", name: "Spin Doctor", icon: "newspaper", cost: 2, x: 63, y: 70, parents: ["root"], branch: "Media", desc: "Breaking News appears <b>50% more often</b>." },
  { id: "headline", name: "Headline Grabber", icon: "tv", cost: 5, x: 63, y: 52, parents: ["spin"], branch: "Media", desc: "Breaking News effects last <b>50% longer</b>." },
  { id: "kingmaker", name: "Kingmaker", icon: "scroll", cost: 15, x: 63, y: 34, parents: ["headline"], branch: "Media", desc: "Cabinet Decision vote rewards are <b>tripled</b>." },
  { id: "empire", name: "Media Empire", icon: "satellite", cost: 40, x: 63, y: 16, parents: ["kingmaker"], branch: "Media", desc: "Landslide Forecasts are <b>three times</b> as likely." },

  { id: "nightowl", name: "Night Owl", icon: "clock", cost: 2, x: 88, y: 70, parents: ["root"], branch: "Strategy", desc: "Production while you're away <b>+25%</b>." },
  { id: "headstart", name: "Head Start", icon: "falafel", cost: 5, x: 88, y: 52, parents: ["nightowl"], branch: "Strategy", desc: "Start each term with <b>25 Volunteers, 10 Falafel Stands and 5 Branch Offices</b>." },
  { id: "seasoned", name: "Seasoned Campaign", icon: "briefcase", cost: 15, x: 88, y: 34, parents: ["headstart"], branch: "Strategy", desc: "All upgrades are <b>15% cheaper</b>." },
  { id: "dynasty", name: "Dynasty", icon: "chair", cost: 40, x: 88, y: 16, parents: ["seasoned"], branch: "Strategy", desc: "Each Knesset seat gives <b>+3%</b> production instead of +2%." },

  { id: "eternal", name: "The Eternal Campaign", icon: "crown", cost: 100, x: 50, y: 4, parents: ["movement", "magnetic", "empire", "dynasty"], desc: "All production <b>×3</b>. Requires all four branches." },
];
export const TREE_BY_ID = Object.fromEntries(TREE.map((n) => [n.id, n]));

// ---------- achievements ----------
export const ACHIEVEMENTS = [];
const ach = (id, name, icon, medal, desc, test) => ACHIEVEMENTS.push({ id, name, icon, medal, desc, test });
const plural = (n, one, many) => (n === 1 ? one : many);

[
  [1, "First Vote", "ballot"], [1e3, "Neighbourhood Favourite", "volunteer"], [1e5, "City Council Material", "branch"],
  [1e6, "Million-Vote March", "hora"], [1e9, "Landslide", "billboard"], [1e12, "Trillion Ballots", "ballot"],
  [1e15, "Beyond Polling", "quantum"], [1e18, "Statistical Impossibility", "portal"], [1e21, "Multiverse Mandate", "crown"],
  [1e24, "Galactic Landslide", "senate"], [1e27, "Cosmic Consensus", "dyson"], [1e30, "Universal Suffrage", "multiverse"], [1e33, "Before the Big Bang", "bigbang"],
  [1e36, "Omniversal", "omniverse"], [1e40, "Out of Numbers", "realityeditor"],
].forEach(([n, name, icon], i) => ach(`votes_${i}`, name, icon, i < 3 ? "medalBronze" : i < 6 ? "medalSilver" : "medal",
  { n, text: (f) => `Win ${f(n)} ${plural(n, "vote", "votes")} in one term.` }, (s) => s.totalVotes >= n));

[[1, "Hands-On", "hand"], [100, "Handshake Marathon", "handshake"], [1000, "Carpal Campaign", "thumb"], [10000, "Clicker-in-Chief", "star"], [50000, "Legendary Grip", "crown"], [200000, "Hands of History", "mic"]]
  .forEach(([n, name, icon], i) => ach(`clicks_${i}`, name, icon, i < 2 ? "medalBronze" : i < 4 ? "medalSilver" : "medal",
    { n, text: (f) => `Click Bibi ${f(n)} ${plural(n, "time", "times")}.` }, (s) => s.clicks >= n));

[[10, "Grassroots", "volunteer"], [1000, "Political Machine", "radio"], [1e6, "Unstoppable Momentum", "startup"], [1e9, "Juggernaut", "satellite"], [1e12, "Force of Nature", "portal"], [1e16, "Astronomical", "moonbase"], [1e20, "Stellar Engine", "dyson"], [1e24, "Cosmic Machine", "bigbang"], [1e28, "Reality Bender", "realityeditor"]]
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

[[1, "Back to the Polls", "medalBronze"], [5, "Election Season", "medalSilver"], [20, "Perpetual Campaign", "medal"], [50, "Election Addict", "medal"], [100, "Century of Campaigns", "medal"]]
  .forEach(([n, name, medal], i) => ach(`elect_${i}`, name, "ballot", medal,
    { text: () => `Call early elections ${n} ${plural(n, "time", "times")}.` }, (s) => s.elections >= n));

[[1, "Crowd Pleaser", "medalBronze"], [10, "Rally Regular", "medalSilver"], [50, "Stadium Tour", "medal"]]
  .forEach(([n, name, medal], i) => ach(`rally_${i}`, name, "megaphone", medal,
    { text: () => `Start ${n} ${plural(n, "rally", "rallies")}.` }, (s) => s.rallies >= n));

[[1, "Decisive", "medalBronze"], [10, "Cabinet Veteran", "medalSilver"], [40, "Policy Machine", "medal"]]
  .forEach(([n, name, medal], i) => ach(`decide_${i}`, name, "scroll", medal,
    { text: () => `Make ${n} Cabinet ${plural(n, "Decision", "Decisions")}.` }, (s) => s.decisions >= n));

ach("tree_1", "Founding Father", "ballot", "medalBronze", { text: () => "Unlock your first Legacy Tree node." }, (s) => (s.tree || []).length >= 1);
ach("tree_branch", "Branching Out", "coalition", "medalSilver", { text: () => "Complete a whole branch of the Legacy Tree." }, (s) => ["movement", "magnetic", "empire", "dynasty"].some((id) => (s.tree || []).includes(id)));
ach("tree_all", "Living Legacy", "crown", "medal", { text: () => "Unlock The Eternal Campaign." }, (s) => (s.tree || []).includes("eternal"));
ach("seats_61", "Majority!", "chair", "medal", { text: () => "Hold 61 Knesset seats." }, (s) => s.seats >= 61);
ach("seats_120", "The Whole Knesset", "crown", "medal", { text: () => "Hold 120 Knesset seats." }, (s) => s.seats >= 120);
ach("seats_500", "Bigger Than the Knesset", "senate", "medal", { text: () => "Hold 500 Knesset seats." }, (s) => s.seats >= 500);
ach("seats_1000", "A Thousand Mandates", "multiverse", "medal", { text: () => "Hold 1,000 Knesset seats." }, (s) => s.seats >= 1000);
[[1, "Goal Getter", "medalBronze"], [10, "Campaign Planner", "medalSilver"], [50, "Mission Accomplished", "medal"], [200, "Strategist Supreme", "medal"]]
  .forEach(([n, name, medal], i) => ach(`goals_${i}`, name, "scroll", medal,
    { text: () => `Complete ${n} Campaign ${plural(n, "Goal", "Goals")}.` }, (s) => (s.goalsDone || 0) >= n));
[[1, "A New Era", "medalSilver"], [3, "Age of Campaigns", "medal"], [10, "Eternal Dynasty", "medal"]]
  .forEach(([n, name, medal], i) => ach(`era_${i}`, name, "crown", medal,
    { text: () => `Begin ${n} new ${plural(n, "Era", "Eras")}.` }, (s) => (s.era || 0) >= n));
[[10, "Mandated", "medalBronze"], [50, "Super Mandate", "medalSilver"], [200, "Endless Mandate", "medal"]]
  .forEach(([n, name, medal], i) => ach(`mandate_${i}`, name, "chair", medal,
    { text: () => `Buy ${n} Endless Mandate levels.` }, (s) => Object.values(s.mandates || {}).reduce((a, b) => a + b, 0) >= n));
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
  { id: "celebrity", weight: 6, title: "Celebrity Endorsement!", body: "Clicks are ×100 for {d} seconds!",
    buff: { key: "celebrity", label: "Celebrity · clicks ×100", icon: "star", clickMult: 100, dur: 8 } },
  { id: "debate", weight: 12, title: "Debate Triumph!", body: "Vote production ×3 for {d} seconds.",
    buff: { key: "debatewin", label: "Debate Triumph ×3", icon: "tv", vpsMult: 3, dur: 90 } },
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
  { id: "spacerace", title: "A rival campaign announces a rally on the Moon.",
    a: { label: "Book a bigger venue: Mars", effect: { buff: { key: "spacerace", label: "Space Race ×2", icon: "mars", vpsMult: 2, dur: 120 } } },
    b: { label: "Call it a stunt on the radio", effect: { lumpVps: 500 } } },
  { id: "kibbutz", title: "A kibbutz invites you to help with the harvest.",
    a: { label: "Roll up your sleeves", effect: { buff: { key: "harvest", label: "Harvest Spirit · clicks ×15", icon: "cactus", clickMult: 15, dur: 40 } } },
    b: { label: "Send a fruit basket", effect: { lumpVps: 300 } } },
  { id: "hackathon", title: "Tel Aviv hackathon teams want to build you a campaign app.",
    a: { label: "Fund the winning team (costs 3% of your votes)", effect: { costFrac: 0.03, then: { buff: { key: "app", label: "Campaign App ×4", icon: "warroom", vpsMult: 4, dur: 60 } } } },
    b: { label: "Judge the finals", effect: { lumpVps: 420 } } },
  { id: "heatwave", title: "A heatwave hits. Everyone is at the beach.",
    a: { label: "Move the rally to the beach", effect: { gamble: 0.7, win: { buff: { key: "beachrally", label: "Beach Rally ×3", icon: "beach", vpsMult: 3, dur: 60 } }, lose: "A sandstorm. The speech was mostly sand." } },
    b: { label: "Hand out free ice pops", effect: { lumpVps: 360 } } },
  { id: "interview", title: "A late-night show wants you as a guest.",
    a: { label: "Go on and play along", effect: { buff: { key: "latenight", label: "Late Night · clicks ×25", icon: "tv", clickMult: 25, dur: 20 } } },
    b: { label: "Send a funny video instead", effect: { lumpVps: 480 } } },
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
  [800, "Shuk vendors start shouting your slogan between tomato prices."],
  [8000, "Campaign bus spotted in three towns at once. Officials blame identical buses."],
  [3e5, "Rooftop rally so loud the neighbours joined in."],
  [4e8, "Election Night Studio's graphics team requests a bigger screen. Again."],
  [5e10, "Train to Jerusalem now runs on time. Historians stunned."],
  [6e11, "Campaign cruise ship docks in Eilat to a brass band."],
  [1e19, "Moon Base office reports its first queue: four astronauts and a robot."],
  [1e21, "Mars Colony Chapter demands a falafel stand with a view of Olympus Mons."],
  [1e22, "Dyson Sphere Billboard visible from three neighbouring galaxies."],
  [1e24, "Galactic Senate filibuster ends after 400 years. Your bill passes."],
  [1e26, "Wormhole phone bank accidentally calls voters from next Tuesday. They're in."],
  [1e28, "Multiverse Coalition agrees on a single slogan. Physicists baffled."],
  [1e30, "Astronomers find a nebula in the shape of a ballot box."],
  [1e33, "The universe's heat death postponed until after the election."],
  [1e35, "Alien Embassy requests a seat on the coalition. And a falafel."],
  [1e38, "Reality Editor accidentally fixes traffic on the Ayalon."],
  [1e41, "The Omniverse Ballot box is full. A bigger one is on order."],
  [-1, "Weather: sunny with a 100% chance of campaign rallies."],
  [-1, "Traffic jam on Highway 1 caused by enthusiastic supporters."],
  [-1, "Op-ed: \"Is it the hair? An investigation.\""],
  [-1, "Local grandmother has already decided. She won't say who."],
  [-1, "New poll shows that polls are popular."],
  [-1, "Matkot paddle sales up 300% on Gordon Beach."],
  [-1, "Campaign volunteer sets record: 412 doors knocked, 3 cups of coffee accepted."],
  [-1, "Shuk vendors report record demand for blue-and-white everything."],
];

// ---------- Endless Mandates (repeatable Political Capital perks) ----------
// cost(level) = round(base * growth^level)
export const MANDATES = [
  { id: "majority", name: "Bigger Majority", icon: "chair", base: 50, growth: 1.5, max: Infinity, desc: (l) => `All production <b>+10%</b> per level (now +${l * 10}%).` },
  { id: "speeches", name: "Sharper Speeches", icon: "mic", base: 30, growth: 1.45, max: Infinity, desc: (l) => `Clicks <b>+25%</b> per level (now +${l * 25}%).` },
  { id: "machine", name: "Well-Oiled Machine", icon: "branch", base: 40, growth: 1.6, max: 25, desc: (l) => `Buildings <b>2% cheaper</b> per level (now ${Math.round((1 - Math.pow(0.98, l)) * 100)}% cheaper).` },
  { id: "media", name: "Media Savvy", icon: "tv", base: 60, growth: 1.7, max: 10, desc: (l) => `Breaking News and Cabinet Decision rewards <b>+20%</b> per level (now +${l * 20}%).` },
  { id: "fund", name: "Campaign Fund", icon: "ballot", base: 25, growth: 2.2, max: 12, desc: (l) => `Start each term with <b>${l ? "1" + "0".repeat(l + 2) : "no"}</b> votes in the bank.` },
];
export const MANDATE_BY_ID = Object.fromEntries(MANDATES.map((m) => [m.id, m]));

// ---------- Eras (top prestige layer) ----------
// Begin a new Era once you hold a full Knesset (120 seats). It resets seats, Ministers, Political
// Capital and Endless Mandates (the Legacy Tree is kept). Heritage ever earned = cbrt(career votes / 1e18);
// a new Era pays the difference. Every Heritage point gives +10% production; spend it on Era perks.
export const ERA_SEATS = 120;
export const ERA_PERKS = [
  { id: "veterans", name: "Veteran Staff", icon: "volunteer", cost: 1, desc: "Start every term with <b>5 of each</b> of the first six buildings." },
  { id: "speechwriters", name: "Speechwriters' Guild", icon: "mic", cost: 2, desc: "Clicks are <b>×10</b>." },
  { id: "oldguard", name: "Old Guard", icon: "briefcase", cost: 3, desc: "Ministers are appointed at <b>half</b> the seats." },
  { id: "memory", name: "Institutional Memory", icon: "scroll", cost: 5, desc: "<b>Keep your Endless Mandate levels</b> when you begin a new Era." },
  { id: "presscorps", name: "Press Corps", icon: "newspaper", cost: 4, desc: "Breaking News and Cabinet Decisions come <b>twice as often</b>." },
  { id: "flame", name: "Eternal Flame", icon: "candles", cost: 6, desc: "No rally cooldown, and the Rally meter fills <b>3× faster</b>." },
  { id: "goldenage", name: "Golden Age", icon: "crown", cost: 15, desc: "All production <b>×3</b>." },
  { id: "century", name: "Party of the Century", icon: "chair", cost: 30, desc: "Elections win <b>twice as many seats</b>." },
  { id: "coalitionforever", name: "Endless Coalition", icon: "coalition", cost: 20, desc: "Elections give <b>twice as much Political Capital</b>." },
  { id: "goals", name: "Grand Strategist", icon: "scroll", cost: 10, desc: "Campaign Goal rewards are <b>tripled</b>." },
  { id: "legend", name: "Legend Never Dies", icon: "star", cost: 60, desc: "All production <b>×5</b>." },
  { id: "mythic", name: "Mythic Status", icon: "bigbang", cost: 100, desc: "Production while you're away <b>+100%</b>." },
];
export const ERA_PERK_BY_ID = Object.fromEntries(ERA_PERKS.map((p) => [p.id, p]));

export const SEATS_TOTAL = 120;

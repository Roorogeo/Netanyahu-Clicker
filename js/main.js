// Bibi Clicker: game state, economy, UI and the glue to the 3D scenes.
import {
  BUILDINGS, BLD_BY_ID, UPGRADES, UPG_BY_ID, MINISTERS, ACHIEVEMENTS, ACH_BY_ID,
  NEWS_EFFECTS, DECISIONS, HEADLINES, SEATS_TOTAL, TREE, TREE_BY_ID,
} from "./data.js";
import { THEMES, THEME_BY_ID } from "./themes.js";
import { writeSave, saveCandidates, listBackups, addBackup } from "./safety.js";
import { initAccounts } from "./account.js";
import { sfx, setSoundEnabled, unlockAudio } from "./audio.js";

const SAVE_KEY = "bibiClickerSave.v1";
const PRICE_GROWTH = 1.15;
const SEAT_BONUS = 0.02;
const ACH_BONUS = 0.01;
const OFFLINE_CAP_S = 12 * 3600;
const ICON = (n) => `assets/icons/${n}.png`;
const RALLY_CLICK_MULT = 7, RALLY_VPS_MULT = 2;

// ======================================================================
// State
// ======================================================================
const freshState = () => ({
  version: 2,
  votes: 0, totalVotes: 0, allTimeVotes: 0,
  clicks: 0, clickVotes: 0, newsClicked: 0, elections: 0, seats: 0,
  rallies: 0, decisions: 0, bestVps: 0,
  buildings: Object.fromEntries(BUILDINGS.map((b) => [b.id, 0])),
  upgrades: [], achievements: [], buffs: [],
  rally: { energy: 0, until: 0, cooldownUntil: 0 },
  pc: 0, tree: [], // Political Capital and Legacy Tree nodes (kept forever)
  history: [],
  termStart: Date.now(), gameStart: Date.now(), lastSave: Date.now(),
  opts: { particles: true, ticker: true, sound: true, flag: true, numbers: "short", theme: "auto" },
});

let state = freshState();
const cache = { vps: 0, baseVps: 0, perBuilding: {}, clickPower: 1, globalMult: 1 };
const ui = { buyMode: "buy", buyAmount: 1, tab: "map", view: "campaign" };
let badge = null, map = null, flagBg = null, account = null;

// ======================================================================
// Formatting
// ======================================================================
const SHORT = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "UDc", "DDc"];
const LONG = ["", " thousand", " million", " billion", " trillion", " quadrillion", " quintillion",
  " sextillion", " septillion", " octillion", " nonillion", " decillion", " undecillion", " duodecillion"];

function fmtWith(n, style) {
  if (!isFinite(n)) return "∞";
  if (n < 0) return "-" + fmtWith(-n, style);
  if (n < 1000) {
    if (n < 10 && n % 1 !== 0) return n.toFixed(1).replace(/\.0$/, "");
    return Math.floor(n).toLocaleString("en-US");
  }
  if (n < 1e6 && style !== "sci") return Math.floor(n).toLocaleString("en-US");
  if (style === "sci") return n.toExponential(2).replace("e+", "e");
  const i = Math.min(Math.floor(Math.log10(n) / 3), SHORT.length - 1);
  const v = n / Math.pow(10, i * 3);
  const digits = v >= 100 ? 1 : v >= 10 ? 2 : 3;
  return v.toFixed(digits).replace(/\.?0+$/, "") + (style === "long" ? LONG[i] : SHORT[i]);
}
const fmt = (n) => fmtWith(n, state.opts.numbers);
const fmtBig = (n) => fmtWith(n, state.opts.numbers === "sci" ? "sci" : "long");

function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const rand = (a, b) => a + Math.random() * (b - a);

// ======================================================================
// Economy
// ======================================================================
const has = (id) => state.upgrades.includes(id);
const minister = (id) => {
  const m = MINISTERS.find((x) => x.id === id);
  return m && state.seats >= m.seats;
};
const rallyActive = () => Date.now() < state.rally.until;

const perk = (id) => (state.tree || []).includes(id);
const seatBonus = () => (perk("dynasty") ? 0.03 : SEAT_BONUS);
function buildingDiscount() { return (minister("transport") ? 0.95 : 1) * (perk("heroes") ? 0.9 : 1); }
function upgradeCost(u) { return Math.ceil(u.cost * (minister("science") ? 0.9 : 1) * (perk("seasoned") ? 0.85 : 1)); }
function rallyDuration() { return (10 + (has("rally_1") ? 5 : 0) + (perk("encore") ? 10 : 0)) * (minister("culture") ? 1.5 : 1); }

function buildingCost(b, amount = 1) {
  const first = b.cost * Math.pow(PRICE_GROWTH, state.buildings[b.id]) * buildingDiscount();
  return Math.ceil(first * (Math.pow(PRICE_GROWTH, amount) - 1) / (PRICE_GROWTH - 1));
}
function maxAffordable(b) {
  const first = b.cost * Math.pow(PRICE_GROWTH, state.buildings[b.id]) * buildingDiscount();
  if (state.votes < first) return 0;
  return Math.max(0, Math.floor(Math.log(state.votes * (PRICE_GROWTH - 1) / first + 1) / Math.log(PRICE_GROWTH)));
}
function sellValue(b, amount) {
  const owned = state.buildings[b.id];
  amount = Math.min(amount, owned);
  if (amount <= 0) return 0;
  const first = b.cost * Math.pow(PRICE_GROWTH, owned - amount) * buildingDiscount();
  return Math.floor(0.5 * first * (Math.pow(PRICE_GROWTH, amount) - 1) / (PRICE_GROWTH - 1));
}
function resolveAmount(b) {
  if (ui.buyAmount !== "max") return ui.buyAmount;
  return ui.buyMode === "sell" ? state.buildings[b.id] : Math.max(1, maxAffordable(b));
}

function globalMultiplier() {
  let m = 1;
  for (const id of state.upgrades) { const u = UPG_BY_ID[id]; if (u && u.kind === "global") m += u.value; }
  m *= 1 + state.seats * seatBonus();
  m *= 1 + state.achievements.length * ACH_BONUS;
  if (minister("finance")) m *= 1.1;
  if (minister("majority")) m *= 1.5;
  if (minister("fullhouse")) m *= 2;
  if (perk("root")) m *= 1.1;
  if (perk("machine")) m *= 1 + 0.02 * BUILDINGS.filter((b) => state.buildings[b.id] > 0).length;
  if (perk("movement")) m *= 1.5;
  if (perk("eternal")) m *= 3;
  return m;
}
function buffMult(key) {
  let m = 1;
  for (const b of state.buffs) if (b[key]) m *= b[key];
  return m;
}

function recalc() {
  const g = globalMultiplier();
  cache.globalMult = g;
  let total = 0;
  for (const b of BUILDINGS) {
    let mult = 1;
    for (const id of state.upgrades) {
      const u = UPG_BY_ID[id];
      if (!u || u.target !== b.id) continue;
      if (u.kind === "building") mult *= u.value;
      if (u.kind === "synergy") mult *= 1 + u.value * state.buildings[u.source];
    }
    if (perk("door") && (b.id === "volunteer" || b.id === "falafel")) mult *= 2;
    const each = b.vps * mult * g;
    cache.perBuilding[b.id] = { each, total: each * state.buildings[b.id], mult };
    total += each * state.buildings[b.id];
  }
  cache.baseVps = total;
  cache.vps = total * buffMult("vpsMult") * (rallyActive() ? RALLY_VPS_MULT : 1);

  let click = 1, clickVpsFrac = 0;
  for (const id of state.upgrades) {
    const u = UPG_BY_ID[id];
    if (!u) continue;
    if (u.kind === "click") click *= u.value;
    if (u.kind === "clickVps") clickVpsFrac += u.value;
  }
  if (perk("orator")) click *= 3;
  if (perk("magnetic")) clickVpsFrac += 0.03;
  cache.clickPower = (click * Math.sqrt(g) + clickVpsFrac * cache.vps) * buffMult("clickMult") * (rallyActive() ? RALLY_CLICK_MULT : 1);
}

function earn(n) {
  state.votes += n;
  state.totalVotes += n;
  state.allTimeVotes += n;
}

const seatsTotalFor = (allTime) => Math.floor(Math.sqrt(allTime / 1e9));
const seatsGainable = () => Math.max(0, seatsTotalFor(state.allTimeVotes) - state.seats);
const offlineRate = () => Math.min(1.25, 0.5 + (has("offline_0") ? 0.25 : 0) + (minister("tourism") ? 0.25 : 0) + (perk("nightowl") ? 0.25 : 0));

// ======================================================================
// DOM helpers
// ======================================================================
const $ = (id) => document.getElementById(id);
const els = {
  votes: $("votes"), vps: $("vps"), miniVotes: $("mini-votes"), buffs: $("buffs"), stage: $("stage"),
  particles: $("particles"), upgrades: $("upgrades"), upgCount: $("upg-count"), buildings: $("buildings"),
  tooltip: $("tooltip"), toasts: $("toasts"), ticker: $("ticker-text"), stats: $("stats"), graph: $("graph"),
  achGrid: $("achievements"), achCount: $("ach-count"), seatsHeld: $("seats-held"), seatsGain: $("seats-gain"),
  seatsNext: $("seats-next"), btnElection: $("btn-election"), saveText: $("save-text"), hemicycle: $("hemicycle"),
  ministers: $("ministers"), rallyFill: $("rally-fill"), rallyLabel: $("rally-label"), rally: $("rally"),
  decisionBtn: $("decision-btn"), decisionTimer: $("decision-timer"), modal: $("modal"), confetti: $("confetti"),
  mapEmpty: $("map-empty"), navStoreDot: $("nav-store-dot"),
};
const isMobile = () => window.matchMedia("(max-width: 900px)").matches;

function img(name, cls = "", alt = "") {
  return `<img class="${cls}" src="${ICON(name)}" alt="${esc(alt)}" draggable="false" loading="lazy">`;
}
const ballotInline = `<img class="inline-ballot" src="${ICON("ballot")}" alt="votes">`;

// ---------- tooltips ----------
let tooltipSource = null;
function attachTooltip(el, contentFn) {
  const show = (x, y) => {
    tooltipSource = { el, contentFn };
    els.tooltip.innerHTML = contentFn();
    els.tooltip.classList.remove("hidden");
    placeTooltip(x, y);
  };
  el.addEventListener("mouseenter", (e) => show(e.clientX, e.clientY));
  el.addEventListener("mousemove", (e) => placeTooltip(e.clientX, e.clientY));
  el.addEventListener("mouseleave", hideTooltip);
  el.addEventListener("focus", () => { const r = el.getBoundingClientRect(); show(r.left, r.bottom); });
  el.addEventListener("blur", hideTooltip);
}
function hideTooltip() { tooltipSource = null; els.tooltip.classList.add("hidden"); }
function placeTooltip(x, y) {
  const t = els.tooltip, pad = 16, w = t.offsetWidth, h = t.offsetHeight;
  let left = x - w - pad;
  if (left < 8) left = Math.min(x + pad, window.innerWidth - w - 8);
  let top = y + pad;
  if (top + h > window.innerHeight - 8) top = Math.max(8, y - h - pad);
  t.style.left = `${left}px`;
  t.style.top = `${top}px`;
}
function refreshTooltip() {
  if (!tooltipSource) return;
  if (!document.body.contains(tooltipSource.el)) return hideTooltip();
  els.tooltip.innerHTML = tooltipSource.contentFn();
}
// touch: tooltips are noise on phones; a long-press shows them instead
document.addEventListener("touchstart", () => hideTooltip(), { passive: true });

// ---------- toasts ----------
function toast(title, body, icon = "ballot", kind = "") {
  const t = document.createElement("div");
  t.className = `toast ${kind}`;
  t.innerHTML = `<img src="${ICON(icon)}" alt=""><div><div class="toast-title"></div><div class="toast-body"></div></div>`;
  t.querySelector(".toast-title").textContent = title;
  t.querySelector(".toast-body").textContent = body;
  els.toasts.appendChild(t);
  while (els.toasts.children.length > 4) els.toasts.firstChild.remove();
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 400); }, 4200);
}

// ---------- modal ----------
let modalOnClose = null;
function showModal({ icon = "scroll", title, body, actions = [], dismissible = true, onClose = null }) {
  $("modal-img").src = ICON(icon);
  $("modal-title").textContent = title;
  $("modal-body").innerHTML = body;
  const box = $("modal-actions");
  box.innerHTML = "";
  actions.forEach((a) => {
    const b = document.createElement("button");
    b.className = `btn ${a.cls || ""}`;
    b.innerHTML = a.label;
    b.addEventListener("click", () => { closeModal(true); a.onClick && a.onClick(); });
    box.appendChild(b);
  });
  els.modal.dataset.dismissible = dismissible ? "1" : "";
  modalOnClose = onClose;
  els.modal.classList.remove("hidden");
  requestAnimationFrame(() => els.modal.classList.add("open"));
  const first = box.querySelector("button");
  first && first.focus();
}
function closeModal(fromAction = false) {
  els.modal.classList.remove("open");
  els.modal.classList.add("hidden");
  const cb = modalOnClose;
  modalOnClose = null;
  if (!fromAction && cb) cb();
}
els.modal.addEventListener("click", (e) => { if (e.target === els.modal && els.modal.dataset.dismissible) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !els.modal.classList.contains("hidden") && els.modal.dataset.dismissible) closeModal(); });

// ---------- confetti ----------
function confetti(n = 120) {
  const colors = themeObj().confetti;
  for (let i = 0; i < n; i++) {
    const p = document.createElement("i");
    p.style.left = `${Math.random() * 100}vw`;
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = `${rand(1.8, 3.4)}s`;
    p.style.animationDelay = `${rand(0, 0.6)}s`;
    p.style.setProperty("--drift", `${rand(-120, 120)}px`);
    p.style.setProperty("--spin", `${rand(360, 1080)}deg`);
    els.confetti.appendChild(p);
    setTimeout(() => p.remove(), 4200);
  }
}

// ======================================================================
// Store: buildings
// ======================================================================
const bldEls = {};
function buildStore() {
  els.buildings.innerHTML = "";
  BUILDINGS.forEach((b) => {
    const btn = document.createElement("button");
    btn.className = "bld";
    btn.innerHTML = `<div class="bld-ico">${img(b.id)}</div>
      <div class="bld-main"><div class="bld-name"></div><div class="bld-cost"></div><div class="bld-rate"></div></div>
      <div class="bld-owned"></div>`;
    btn.addEventListener("click", () => storeAction(b));
    attachTooltip(btn, () => buildingTooltip(b));
    els.buildings.appendChild(btn);
    bldEls[b.id] = {
      root: btn, img: btn.querySelector(".bld-ico img"), name: btn.querySelector(".bld-name"),
      cost: btn.querySelector(".bld-cost"), rate: btn.querySelector(".bld-rate"), owned: btn.querySelector(".bld-owned"),
    };
  });
}

function isBuildingVisible(i) {
  if (i === 0) return true;
  const b = BUILDINGS[i], prev = BUILDINGS[i - 1];
  return state.buildings[b.id] > 0 || state.buildings[prev.id] > 0 || state.totalVotes >= b.cost * 0.5;
}

function renderBuildings() {
  let shownLocked = 0;
  let anyAffordable = false;
  BUILDINGS.forEach((b, i) => {
    const e = bldEls[b.id];
    const visible = isBuildingVisible(i);
    if (!visible) {
      if (shownLocked < 1) {
        shownLocked++;
        e.root.classList.remove("hidden");
        e.root.classList.add("locked");
        e.name.textContent = "???";
        e.rate.textContent = "";
      } else e.root.classList.add("hidden");
    } else {
      e.root.classList.remove("hidden", "locked");
      e.name.textContent = b.name;
      const pb = cache.perBuilding[b.id];
      e.rate.textContent = state.buildings[b.id] ? `${fmt(pb.total)}/s` : `${fmt(pb.each)}/s each`;
    }
    const amt = resolveAmount(b);
    let ok;
    if (ui.buyMode === "sell") {
      const v = sellValue(b, amt);
      ok = visible && state.buildings[b.id] >= Math.min(amt, state.buildings[b.id]) && state.buildings[b.id] > 0;
      e.cost.innerHTML = `${ballotInline}+${fmt(v)}${amt > 1 ? ` <small>(${fmt(Math.min(amt, state.buildings[b.id]))})</small>` : ""}`;
    } else {
      const cost = buildingCost(b, amt);
      ok = visible && state.votes >= cost;
      e.cost.innerHTML = `${ballotInline}${fmt(cost)}${ui.buyAmount !== 1 ? ` <small>×${fmt(amt)}</small>` : ""}`;
      if (ok) anyAffordable = true;
    }
    e.owned.textContent = state.buildings[b.id] || "";
    e.root.classList.toggle("afford", ok);
    e.root.classList.toggle("sell", ui.buyMode === "sell");
  });
  els.navStoreDot.classList.toggle("hidden", !anyAffordable && !availableUpgrades().some((u) => state.votes >= upgradeCost(u)));
}

function buildingTooltip(b) {
  const i = BUILDINGS.indexOf(b);
  if (!isBuildingVisible(i)) return `<div class="tt-head">${img(b.id, "tt-ico silhouette")}<div class="tt-title">???</div></div>Win more votes to reveal this building.`;
  const pb = cache.perBuilding[b.id];
  const owned = state.buildings[b.id];
  const share = cache.baseVps > 0 ? (pb.total / cache.baseVps) * 100 : 0;
  const amt = resolveAmount(b);
  const nextTier = UPGRADES.find((u) => u.kind === "building" && u.target === b.id && !has(u.id) && !u.unlock(state));
  const costLine = ui.buyMode === "sell"
    ? `<div class="tt-cost">Sell ${fmt(Math.min(amt, owned))}: +${fmt(sellValue(b, amt))} votes</div>`
    : `<div class="tt-cost ${state.votes >= buildingCost(b, amt) ? "" : "no"}">Buy ${fmt(amt)}: ${fmtBig(buildingCost(b, amt))} votes</div>`;
  return `<div class="tt-head">${img(b.id, "tt-ico")}<div><div class="tt-title">${b.name}</div><div class="tt-sub">Owned: ${owned}</div></div></div>
    <div>${b.desc}</div>
    <div class="tt-line">Each makes <b>${fmt(pb.each)}</b> votes/s</div>
    ${owned ? `<div class="tt-line">All ${owned}: <b>${fmt(pb.total)}</b>/s (${share.toFixed(1)}% of total)</div>` : ""}
    ${costLine}
    ${nextTier ? `<div class="tt-flavor">Next upgrade unlocks at ${TIER_REQ(nextTier)} owned.</div>` : ""}`;
}
const TIER_REQ = (u) => [1, 5, 25, 50, 100, 150][Number(u.id.split("_t")[1])];

function storeAction(b) {
  unlockAudio();
  const i = BUILDINGS.indexOf(b);
  if (!isBuildingVisible(i)) return;
  const amt = resolveAmount(b);
  if (ui.buyMode === "sell") {
    const n = Math.min(amt, state.buildings[b.id]);
    if (n <= 0) return sfx.denied();
    const v = sellValue(b, n);
    state.buildings[b.id] -= n;
    state.votes += v;
    sfx.sell();
  } else {
    const cost = buildingCost(b, amt);
    if (state.votes < cost) return sfx.denied();
    state.votes -= cost;
    state.buildings[b.id] += amt;
    sfx.buy();
    if (state.buildings[b.id] === amt) toast(`New: ${b.name}`, "It's on your campaign map now.", b.id);
  }
  recalc();
  map && map.update(state.buildings);
  renderBuildings();
  refreshTooltip();
  updateMapEmpty();
}

// ======================================================================
// Store: upgrades
// ======================================================================
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
      btn.className = `upg frame-${u.frame}`;
      btn.dataset.id = u.id;
      btn.innerHTML = img(u.icon) + (u.badge ? img(u.badge, "upg-badge") : "") + (u.kind === "building" ? `<span class="upg-tier">${Number(u.id.split("_t")[1]) + 1}</span>` : "");
      btn.setAttribute("aria-label", `${u.name}, costs ${fmt(upgradeCost(u))} votes`);
      btn.addEventListener("click", () => buyUpgrade(u));
      attachTooltip(btn, () => upgradeTooltip(u));
      els.upgrades.appendChild(btn);
    });
    els.upgCount.textContent = `${state.upgrades.length}/${UPGRADES.length} owned`;
  }
  for (const btn of els.upgrades.children) {
    const u = UPG_BY_ID[btn.dataset.id];
    btn.classList.toggle("afford", state.votes >= upgradeCost(u));
  }
}
function upgradeTooltip(u) {
  const c = upgradeCost(u);
  return `<div class="tt-head">${img(u.icon, "tt-ico")}<div><div class="tt-title">${u.name}</div><div class="tt-sub">Upgrade</div></div></div>
    <div>${u.desc}</div>
    <div class="tt-cost ${state.votes >= c ? "" : "no"}">${fmtBig(c)} votes</div>
    ${visualNote(u) ? `<div class="tt-visual">3D: ${visualNote(u)}</div>` : ""}
    ${u.flavor ? `<div class="tt-flavor">${u.flavor}</div>` : ""}`;
}
function buyUpgrade(u) {
  unlockAudio();
  const c = upgradeCost(u);
  if (has(u.id) || state.votes < c) return sfx.denied();
  const before = upgradeLook();
  state.votes -= c;
  state.upgrades.push(u.id);
  sfx.upgrade();
  recalc();
  applyUpgradeLook();
  announceLook(u, before);
  account && account.soon();
  hideTooltip();
  renderUpgrades();
}

// ======================================================================
// Clicking & rally
// ======================================================================
function clickBibi(clientX, clientY) {
  unlockAudio();
  const gain = cache.clickPower;
  earn(gain);
  state.clicks++;
  state.clickVotes += gain;
  sfx.click();
  if (badge) badge.hit(clientX, clientY, rallyActive() ? 8 : 4);
  else { els.stage.classList.remove("pop"); void els.stage.offsetWidth; els.stage.classList.add("pop"); }
  if (state.opts.particles) spawnFloat(clientX, clientY, `+${fmt(gain)}`);
  // rally meter
  const now = Date.now();
  if (!rallyActive() && now >= state.rally.cooldownUntil) {
    state.rally.energy = Math.min(100, state.rally.energy + 3 * (has("rally_0") ? 1.5 : 1) * (perk("surfer") ? 2 : 1));
    if (state.rally.energy >= 100) startRally();
  }
}

function startRally() {
  const dur = rallyDuration();
  state.rally.until = Date.now() + dur * 1000;
  state.rally.energy = 100;
  state.rallies++;
  sfx.rally();
  badge && badge.setRally(true);
  map && map.setRally(true);
  badge && badge.burst(40);
  els.rally.classList.add("active");
  toast("RALLY!", `Clicks ×${RALLY_CLICK_MULT} and production ×${RALLY_VPS_MULT} for ${Math.round(dur)} seconds!`, "megaphone", "gold");
  recalc();
}

function updateRally(dt) {
  const now = Date.now();
  if (rallyActive()) {
    const left = (state.rally.until - now) / 1000;
    const total = rallyDuration();
    state.rally.energy = Math.max(0, (left / total) * 100);
    els.rallyLabel.textContent = `RALLY! Clicks ×${RALLY_CLICK_MULT}, production ×${RALLY_VPS_MULT} · ${Math.ceil(left)}s`;
  } else {
    if (els.rally.classList.contains("active")) {
      els.rally.classList.remove("active");
      badge && badge.setRally(false);
      map && map.setRally(false);
      state.rally.cooldownUntil = now + 15000;
      state.rally.energy = 0;
      recalc();
    }
    state.rally.energy = Math.max(0, state.rally.energy - 9 * dt);
    if (now < state.rally.cooldownUntil) {
      els.rallyLabel.textContent = `Catching your breath… ${Math.ceil((state.rally.cooldownUntil - now) / 1000)}s`;
    } else {
      els.rallyLabel.textContent = state.rally.energy > 0 ? `Rally meter: keep clicking! ${Math.floor(state.rally.energy)}%` : "Rally meter: click fast to start a rally!";
    }
  }
  els.rallyFill.style.width = `${state.rally.energy}%`;
  els.rally.classList.toggle("cooldown", !rallyActive() && now < state.rally.cooldownUntil);
}

function spawnFloat(clientX, clientY, text) {
  const rect = els.stage.getBoundingClientRect();
  let x = clientX !== undefined ? clientX - rect.left : rect.width / 2 + rand(-40, 40);
  let y = clientY !== undefined ? clientY - rect.top : rect.height / 2;
  const d = document.createElement("div");
  d.className = "float-num" + (rallyActive() ? " gold" : "");
  if (currentTheme() === "pride" && !rallyActive()) d.style.color = `hsl(${Math.floor(rand(0, 360))} 85% 45%)`;
  d.textContent = text;
  d.style.left = `${x + rand(-14, 14)}px`;
  d.style.top = `${y - 12}px`;
  els.particles.appendChild(d);
  setTimeout(() => d.remove(), 1000);
}

// ======================================================================
// Breaking News pickups
// ======================================================================
let nextNewsAt = Date.now() + rand(40, 100) * 1000;
let newsEl = null;
function scheduleNews() {
  let f = (has("news_0") ? 2 : 1) * (perk("spin") ? 1.5 : 1);
  if (minister("comms")) f *= 1.3;
  nextNewsAt = Date.now() + (rand(60, 170) * 1000) / f;
}
function spawnNews() {
  if (newsEl) return;
  const panel = document.querySelector(".panel-click");
  const r = panel.getBoundingClientRect();
  const el = document.createElement("button");
  el.className = "news-pop";
  el.innerHTML = img("newspaper") + "<span>BREAKING</span>";
  el.setAttribute("aria-label", "Breaking news! Click for a bonus");
  el.style.left = `${rand(10, Math.max(12, r.width - 100))}px`;
  el.style.top = `${rand(120, Math.max(130, r.height - 160))}px`;
  el.addEventListener("pointerdown", (ev) => { ev.stopPropagation(); collectNews(); });
  panel.appendChild(el);
  newsEl = el;
  sfx.news();
  const mine = el;
  setTimeout(() => { if (newsEl === mine) removeNews(); }, 13000);
}
function removeNews() {
  if (!newsEl) return;
  const el = newsEl;
  newsEl = null;
  el.classList.add("leaving");
  setTimeout(() => el.remove(), 500);
  scheduleNews();
}
function pickWeighted(list) {
  let roll = Math.random() * list.reduce((a, e) => a + e.weight, 0);
  for (const e of list) if ((roll -= e.weight) < 0) return e;
  return list[0];
}
function addBuff(b, durMult = 1) {
  const dur = b.dur * durMult;
  state.buffs = state.buffs.filter((x) => x.key !== b.key);
  state.buffs.push({ key: b.key, label: b.label, icon: b.icon, vpsMult: b.vpsMult, clickMult: b.clickMult, until: Date.now() + dur * 1000, dur });
  recalc();
  return dur;
}
function lumpVotes(vpsSeconds, bankFrac = 1) {
  const v = Math.max(25, Math.min(state.votes * bankFrac, cache.baseVps * vpsSeconds) + 13);
  earn(v);
  return v;
}
function collectNews() {
  if (!newsEl) return;
  unlockAudio();
  state.newsClicked++;
  const eff = pickWeighted(NEWS_EFFECTS.map((e) => (e.id === "landslide" && perk("empire") ? { ...e, weight: e.weight * 3 } : e)));
  if (eff.buff) {
    const dur = addBuff(eff.buff, (has("news_1") ? 2 : 1) * (perk("headline") ? 1.5 : 1));
    toast(eff.title, eff.body.replace("{d}", Math.round(dur)), eff.buff.icon, "gold");
  } else {
    const v = lumpVotes(eff.lump.vpsSeconds, eff.lump.bankFrac);
    toast(eff.title, eff.body.replace("{v}", fmtBig(v)), "newspaper", "gold");
  }
  sfx.upgrade();
  badge && badge.burst(30);
  removeNews();
}

// ======================================================================
// Cabinet Decisions
// ======================================================================
let nextDecisionAt = Date.now() + rand(150, 260) * 1000;
let pendingDecision = null; // { d, expires }
function scheduleDecision() {
  nextDecisionAt = Date.now() + (rand(240, 460) * 1000) / (has("decision_0") ? 2 : 1);
}
function offerDecision() {
  const pool = DECISIONS.filter((d) => !pendingDecision || d.id !== pendingDecision.d.id);
  pendingDecision = { d: pool[Math.floor(Math.random() * pool.length)], expires: Date.now() + 90000 };
  els.decisionBtn.classList.remove("hidden");
  sfx.decision();
}
function applyEffect(e) {
  if (e.costFrac) { state.votes -= state.votes * e.costFrac; return applyEffect(e.then); }
  if (e.gamble !== undefined) {
    if (Math.random() < e.gamble) return applyEffect(e.win);
    return { title: "No luck this time", body: e.lose, icon: "scroll" };
  }
  if (e.buff) {
    const dur = addBuff(e.buff);
    return { title: e.buff.label, body: `Active for ${Math.round(dur)} seconds.`, icon: e.buff.icon };
  }
  if (e.lumpVps) {
    const v = lumpVotes(e.lumpVps * (perk("kingmaker") ? 3 : 1));
    return { title: "Decision made", body: `+${fmtBig(v)} votes.`, icon: "ballot" };
  }
  return { title: "Done", body: "", icon: "scroll" };
}
function openDecision() {
  if (!pendingDecision) return;
  const { d } = pendingDecision;
  showModal({
    icon: "scroll",
    title: "Cabinet Decision",
    body: `<p class="decision-q">${esc(d.title)}</p>`,
    actions: [d.a, d.b].map((opt, i) => ({
      label: esc(opt.label), cls: i ? "" : "btn-primary",
      onClick: () => {
        const res = applyEffect(opt.effect);
        state.decisions++;
        pendingDecision = null;
        els.decisionBtn.classList.add("hidden");
        scheduleDecision();
        sfx.upgrade();
        toast(res.title, res.body, res.icon, "gold");
      },
    })),
  });
}

// ======================================================================
// Elections & ministers
// ======================================================================
const seatPositions = (() => {
  const rows = 7, total = SEATS_TOTAL, cx = 200, cy = 205, r0 = 104, r1 = 192;
  const radii = Array.from({ length: rows }, (_, i) => r0 + (i * (r1 - r0)) / (rows - 1));
  const sum = radii.reduce((a, b) => a + b, 0);
  const counts = radii.map((r) => Math.round((total * r) / sum));
  let diff = total - counts.reduce((a, b) => a + b, 0);
  for (let i = rows - 1; diff !== 0; i = (i - 1 + rows) % rows) { counts[i] += Math.sign(diff); diff -= Math.sign(diff); }
  const seats = [];
  radii.forEach((r, i) => {
    for (let j = 0; j < counts[i]; j++) {
      const a = Math.PI - (j / (counts[i] - 1)) * Math.PI;
      seats.push({ x: cx + Math.cos(a) * r, y: cy - Math.sin(a) * r, a });
    }
  });
  seats.sort((p, q) => q.a - p.a);
  return seats;
})();
function buildHemicycle() {
  els.hemicycle.innerHTML = seatPositions.map((s, i) => `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="6.3" style="--h:${Math.round((i / SEATS_TOTAL) * 290)}"></circle>`).join("")
    + `<line x1="200" y1="205" x2="200" y2="8" class="majority-line"></line><text x="206" y="18" class="majority-text">61 = majority</text>`;
}
let lastSeatRender = -1;
function renderKnesset() {
  const held = Math.min(state.seats, SEATS_TOTAL);
  if (held !== lastSeatRender) {
    lastSeatRender = held;
    els.hemicycle.querySelectorAll("circle").forEach((c, i) => c.classList.toggle("held", i < held));
  }
  const gain = seatsGainable();
  els.seatsHeld.textContent = fmt(state.seats);
  els.seatsGain.textContent = `+${fmt(gain)}`;
  const nextTotal = seatsTotalFor(state.allTimeVotes) + 1;
  els.seatsNext.textContent = `Next seat after ${fmtBig(Math.max(0, nextTotal * nextTotal * 1e9 - state.allTimeVotes))} more votes (all time).`
    + (state.seats >= 120 ? " The Knesset only has 120 seats, but who's counting?" : "");
  els.btnElection.disabled = gain < 1;
  els.btnElection.textContent = gain >= 1 ? `Call Early Elections (+${fmt(gain)} seats)` : "Not enough votes for a new seat yet";
  els.ministers.innerHTML = MINISTERS.map((m) => {
    const on = state.seats >= m.seats;
    return `<div class="minister ${on ? "on" : ""}">${img(m.icon)}<div><div class="minister-name">${m.name}</div>
      <div class="minister-desc">${m.desc}</div></div><div class="minister-seats">${on ? "Appointed" : `${m.seats} seats`}</div></div>`;
  }).join("");
}
function callElection() {
  const gain = seatsGainable();
  if (gain < 1) return;
  const newMinisters = MINISTERS.filter((m) => state.seats < m.seats && state.seats + gain >= m.seats);
  showModal({
    icon: "chair",
    title: "Call early elections?",
    body: `<p>You'll win <b>${fmt(gain)}</b> new Knesset ${gain === 1 ? "seat" : "seats"} (+${fmt(gain * seatBonus() * 100)}% production, permanently) and <b>${fmt(gain)}</b> Political Capital to spend in the Legacy Tree.</p>
      ${newMinisters.length ? `<p>New ministers: <b>${newMinisters.map((m) => m.name).join(", ")}</b>.</p>` : ""}
      <p class="muted">You'll lose this term's votes, buildings and upgrades. Seats, awards and ministers stay.</p>`,
    actions: [
      { label: "Dissolve the Knesset!", cls: "btn-primary", onClick: () => doElection(gain) },
      { label: "Not yet" },
    ],
  });
}
function doElection(gain) {
  snapshot("Before calling an election");
  const keep = {
    pc: (state.pc || 0) + gain, tree: state.tree || [],
    allTimeVotes: state.allTimeVotes, seats: state.seats + gain, elections: state.elections + 1,
    achievements: state.achievements, newsClicked: state.newsClicked, rallies: state.rallies,
    decisions: state.decisions, bestVps: state.bestVps, gameStart: state.gameStart, opts: state.opts,
  };
  state = Object.assign(freshState(), keep);
  if (minister("education")) { state.buildings.volunteer = 10; state.buildings.falafel = 5; }
  if (perk("headstart")) {
    state.buildings.volunteer = Math.max(state.buildings.volunteer, 25);
    state.buildings.falafel = Math.max(state.buildings.falafel, 10);
    state.buildings.branch = Math.max(state.buildings.branch, 5);
  }
  upgSignature = "";
  recalc();
  map && map.update(state.buildings);
  renderAll();
  sfx.election();
  confetti(160);
  account && account.soon();
  toast("Election results are in!", `You now hold ${fmt(state.seats)} Knesset seats. A new term begins.`, "chair", "gold");
  save();
}

// ======================================================================
// Legacy Tree (prestige)
// ======================================================================
const treeEls = {};
const parentsOwned = (n) => n.parents.every((id) => perk(id));
function buildTree() {
  const box = $("tree"), svg = $("tree-lines");
  svg.innerHTML = TREE.flatMap((n) => n.parents.map((pid) => {
    const p = TREE_BY_ID[pid];
    return `<line x1="${p.x}" y1="${p.y}" x2="${n.x}" y2="${n.y}" data-from="${pid}" data-to="${n.id}"></line>`;
  })).join("");
  const branches = {};
  TREE.forEach((n) => { if (n.branch && !branches[n.branch]) branches[n.branch] = n.x; });
  Object.entries(branches).forEach(([name, x]) => {
    const l = document.createElement("div");
    l.className = "tbranch";
    l.style.left = `${x}%`;
    l.textContent = name;
    box.appendChild(l);
  });
  TREE.forEach((n) => {
    const b = document.createElement("button");
    b.className = "tnode" + (n.id === "eternal" ? " capstone" : "") + (n.id === "root" ? " rootnode" : "");
    b.style.left = `${n.x}%`;
    b.style.top = `${n.y}%`;
    b.innerHTML = `<span class="disc">${img(n.icon)}<span class="tcost">${n.cost}</span><span class="tcheck">✓</span></span><span class="tname">${esc(n.name)}</span>`;
    b.setAttribute("aria-label", `${n.name}: costs ${n.cost} Political Capital`);
    b.addEventListener("click", () => buyNode(n));
    attachTooltip(b, () => {
      const owned = perk(n.id);
      const req = n.parents.length ? `<div class="tt-line">Requires: ${n.parents.map((id) => TREE_BY_ID[id].name).join(", ")}</div>` : "";
      return `<div class="tt-head">${img(n.icon, "tt-ico")}<div><div class="tt-title">${n.name}</div><div class="tt-sub">${n.branch ? `${n.branch} branch` : "Legacy Tree"}</div></div></div>
        <div>${n.desc}</div>${owned ? "" : req}
        <div class="tt-cost ${owned || (state.pc >= n.cost && parentsOwned(n)) ? "" : "no"}">${owned ? "Unlocked" : `${n.cost} Political Capital (you have ${fmt(state.pc)})`}</div>`;
    });
    box.appendChild(b);
    treeEls[n.id] = b;
  });
}
function renderTree() {
  $("pc-avail").textContent = fmt(state.pc || 0);
  $("pc-knesset").textContent = fmt(state.pc || 0);
  let anyAffordable = false;
  TREE.forEach((n) => {
    const owned = perk(n.id), open = !owned && parentsOwned(n), afford = open && state.pc >= n.cost;
    if (afford) anyAffordable = true;
    const el = treeEls[n.id];
    el.classList.toggle("owned", owned);
    el.classList.toggle("open", open);
    el.classList.toggle("afford", afford);
    el.classList.toggle("locked", !owned && !open);
  });
  $("tree-lines").querySelectorAll("line").forEach((l) => {
    l.classList.toggle("on", perk(l.dataset.from) && perk(l.dataset.to));
    l.classList.toggle("next", perk(l.dataset.from) && !perk(l.dataset.to));
  });
  $("legacy-dot").classList.toggle("hidden", !anyAffordable);
}
function buyNode(n) {
  unlockAudio();
  if (perk(n.id) || !parentsOwned(n) || state.pc < n.cost) return sfx.denied();
  state.pc -= n.cost;
  state.tree.push(n.id);
  sfx.upgrade();
  if (n.id === "eternal") { sfx.election(); confetti(160); }
  toast(`Legacy: ${n.name}`, n.desc.replace(/<[^>]+>/g, ""), n.icon, "gold");
  recalc();
  renderTree();
  refreshTooltip();
  checkAchievements();
  save();
  account && account.soon();
}
function respecTree() {
  const spent = (state.tree || []).reduce((a, id) => a + TREE_BY_ID[id].cost, 0);
  if (!spent) return toast("Nothing to refund", "You haven't unlocked any Legacy nodes yet.", "crown");
  showModal({
    icon: "crown", title: "Refund the Legacy Tree?",
    body: `<p>You'll get back all <b>${fmt(spent)}</b> Political Capital and can spend it again however you like. It's free.</p>`,
    actions: [
      { label: "Refund everything", cls: "btn-primary", onClick: () => {
        state.pc += spent; state.tree = []; recalc(); renderTree(); save();
        toast("Points refunded", `${fmt(spent)} Political Capital is ready to spend again.`, "crown");
      } },
      { label: "Keep my tree" },
    ],
  });
}

// ======================================================================
// Achievements
// ======================================================================
const achEls = {};
function buildAchievements() {
  els.achGrid.innerHTML = "";
  ACHIEVEMENTS.forEach((a) => {
    const d = document.createElement("div");
    d.className = "ach";
    d.tabIndex = 0;
    d.innerHTML = img(a.medal, "ach-medal") + img(a.icon, "ach-icon");
    attachTooltip(d, () => {
      const won = state.achievements.includes(a.id);
      return `<div class="tt-head">${img(a.icon, "tt-ico" + (won ? "" : " gray"))}<div><div class="tt-title">${won ? "" : "🔒 "}${a.name}</div><div class="tt-sub">${won ? "Unlocked · +1% production" : "Locked"}</div></div></div>
        <div>${a.desc.text(fmt)}</div>`;
    });
    els.achGrid.appendChild(d);
    achEls[a.id] = d;
  });
}
function renderAchievements() {
  ACHIEVEMENTS.forEach((a) => achEls[a.id].classList.toggle("won", state.achievements.includes(a.id)));
  els.achCount.textContent = `${state.achievements.length} / ${ACHIEVEMENTS.length}`;
}
function checkAchievements() {
  const d = { vps: cache.vps };
  let changed = false;
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements.includes(a.id) && a.test(state, d)) {
      state.achievements.push(a.id);
      toast(`Award: ${a.name}`, a.desc.text(fmt), a.icon, "gold");
      changed = true;
    }
  }
  if (changed) { sfx.achievement(); recalc(); renderAchievements(); }
}

// ======================================================================
// Stats & graph
// ======================================================================
function renderStats() {
  const now = Date.now();
  const totalBld = Object.values(state.buildings).reduce((a, b) => a + b, 0);
  const rows = [
    ["Votes in bank", fmtBig(state.votes)],
    ["Votes this term", fmtBig(state.totalVotes)],
    ["Votes all time", fmtBig(state.allTimeVotes)],
    ["Votes per second", fmtBig(cache.vps)],
    ["Best votes per second", fmtBig(state.bestVps)],
    ["Votes per click", fmtBig(cache.clickPower)],
    ["Bibi clicks", fmt(state.clicks)],
    ["Votes from clicking", fmtBig(state.clickVotes)],
    ["Buildings owned", fmt(totalBld)],
    ["Upgrades owned", `${state.upgrades.length} / ${UPGRADES.length}`],
    ["Production multiplier", `×${cache.globalMult.toFixed(2)}`],
    ["Rallies", fmt(state.rallies)],
    ["Cabinet Decisions", fmt(state.decisions)],
    ["Breaking News clicked", fmt(state.newsClicked)],
    ["Elections called", fmt(state.elections)],
    ["Knesset seats", `${fmt(state.seats)} (+${fmt(state.seats * seatBonus() * 100)}%)`],
    ["Political Capital", `${fmt(state.pc || 0)} to spend · ${(state.tree || []).length}/${TREE.length} nodes`],
    ["Awards", `${state.achievements.length} (+${state.achievements.length}%)`],
    ["Offline production", `${Math.round(offlineRate() * 100)}%`],
    ["This term", fmtTime((now - state.termStart) / 1000)],
    ["Since first vote", fmtTime((now - state.gameStart) / 1000)],
  ];
  els.stats.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  drawGraph();
}
function drawGraph() {
  const c = els.graph, dpr = window.devicePixelRatio || 1;
  const w = c.clientWidth, h = c.clientHeight;
  if (!w || !h) return;
  if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  const ctx = c.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const data = state.history.length ? state.history : [0];
  const max = Math.max(...data, 1);
  const pad = { l: 8, r: 8, t: 10, b: 18 };
  const x = (i) => pad.l + (i / Math.max(1, 239)) * (w - pad.l - pad.r);
  const y = (v) => h - pad.b - (v / max) * (h - pad.t - pad.b);
  const css = getComputedStyle(document.documentElement);
  const accent = css.getPropertyValue("--accent").trim() || "#0038b8";
  const pride = currentTheme() === "pride";
  const darkTone = themeObj().tone === "dark";
  ctx.strokeStyle = css.getPropertyValue("--line").trim() || "rgba(15,26,51,0.08)"; ctx.lineWidth = 1;
  for (let k = 0; k <= 3; k++) { const yy = pad.t + (k / 3) * (h - pad.t - pad.b); ctx.beginPath(); ctx.moveTo(pad.l, yy); ctx.lineTo(w - pad.r, yy); ctx.stroke(); }
  const off = 240 - data.length;
  const grd = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
  if (pride) { grd.addColorStop(0, "rgba(255,140,0,0.3)"); grd.addColorStop(0.5, "rgba(0,77,255,0.15)"); grd.addColorStop(1, "rgba(117,7,135,0)"); }
  else {
    const c = new Color(accent);
    grd.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${darkTone ? 0.4 : 0.35})`);
    grd.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
  }
  ctx.beginPath();
  ctx.moveTo(x(off), h - pad.b);
  data.forEach((v, i) => ctx.lineTo(x(off + i), y(v)));
  ctx.lineTo(x(off + data.length - 1), h - pad.b);
  ctx.closePath(); ctx.fillStyle = grd; ctx.fill();
  ctx.beginPath();
  data.forEach((v, i) => (i ? ctx.lineTo(x(off + i), y(v)) : ctx.moveTo(x(off + i), y(v))));
  let stroke = accent;
  if (pride) {
    stroke = ctx.createLinearGradient(pad.l, 0, w - pad.r, 0);
    ["#e40303", "#ff8c00", "#ffed00", "#008026", "#004dff", "#750787"].forEach((c, i) => stroke.addColorStop(i / 5, c));
  }
  ctx.strokeStyle = stroke; ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.stroke();
  ctx.fillStyle = css.getPropertyValue("--muted").trim() || "#5b6785"; ctx.font = "600 11px Rubik, sans-serif";
  ctx.fillText(`peak ${fmt(max)}/s`, pad.l + 2, pad.t + 10);
  ctx.fillText("20 min ago", pad.l, h - 4);
  ctx.textAlign = "right"; ctx.fillText("now", w - pad.r, h - 4); ctx.textAlign = "left";
}

// ======================================================================
// Bank, buffs, map empty state
// ======================================================================
let lastBuffSig = "";
function renderBank() {
  els.votes.textContent = fmtBig(state.votes);
  els.vps.textContent = `${fmtBig(cache.vps)} per second`;
  els.miniVotes.textContent = `${fmt(state.votes)} votes · ${fmt(cache.vps)}/s`;
  const now = Date.now();
  const sig = state.buffs.map((b) => b.key).join(",");
  if (sig !== lastBuffSig) {
    lastBuffSig = sig;
    els.buffs.innerHTML = state.buffs.map((b) => `<div class="buff" data-key="${b.key}">${img(b.icon || "star")}<span class="buff-label">${esc(b.label)}</span><span class="buff-time"></span><i class="buff-bar"></i></div>`).join("");
  }
  for (const el of els.buffs.children) {
    const b = state.buffs.find((x) => x.key === el.dataset.key);
    if (!b) continue;
    const left = Math.max(0, (b.until - now) / 1000);
    el.querySelector(".buff-time").textContent = `${Math.ceil(left)}s`;
    el.querySelector(".buff-bar").style.width = `${(left / (b.dur || left || 1)) * 100}%`;
  }
  document.title = `${fmt(state.votes)} votes · Bibi Clicker`;
}
function updateMapEmpty() {
  const any = Object.values(state.buildings).some((n) => n > 0);
  els.mapEmpty.classList.toggle("hidden", any || !map);
}

// ======================================================================
// Ticker
// ======================================================================
let lastHeadline = "";
function nextHeadline() {
  const el = els.ticker;
  if (!state.opts.ticker) { document.body.classList.add("no-ticker"); return; }
  document.body.classList.remove("no-ticker");
  const pool = HEADLINES.filter(([req]) => req < 0 || state.totalVotes >= req).map(([, h]) => h);
  const unlocked = HEADLINES.filter(([req]) => req >= 0 && state.totalVotes >= req).map(([, h]) => h);
  let pick = Math.random() < 0.45 && unlocked.length
    ? unlocked[unlocked.length - 1 - Math.floor(Math.random() * Math.min(3, unlocked.length))]
    : pool[Math.floor(Math.random() * pool.length)];
  const extra = themeObj().headlines;
  const chance = themeObj().headlineChance ?? (currentTheme() === "pride" ? 0.5 : 0.3);
  if (extra && extra.length && Math.random() < chance) pick = extra[Math.floor(Math.random() * extra.length)];
  if (pick === lastHeadline) pick = pool[(pool.indexOf(pick) + 1) % pool.length];
  lastHeadline = pick;
  el.textContent = pick;
  el.style.animation = "none";
  void el.offsetWidth;
  const track = el.parentElement.clientWidth, w = el.scrollWidth;
  el.style.setProperty("--from", `${track}px`);
  el.style.setProperty("--to", `${-w}px`);
  el.style.animation = `ticker ${((track + w) / 85).toFixed(2)}s linear 1 forwards`;
}
els.ticker.addEventListener("animationend", nextHeadline);

// ======================================================================
// Save / load
// ======================================================================
function serialize() {
  state.lastSave = Date.now();
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}
function deserialize(str) {
  const data = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
  const s = Object.assign(freshState(), data);
  s.buildings = Object.assign(freshState().buildings, data.buildings || {});
  for (const k of Object.keys(s.buildings)) if (!BLD_BY_ID[k]) delete s.buildings[k];
  s.upgrades = (data.upgrades || []).filter((id) => UPG_BY_ID[id]);
  s.achievements = (data.achievements || []).filter((id) => ACH_BY_ID[id]);
  s.opts = Object.assign(freshState().opts, data.opts || {});
  s.rally = Object.assign(freshState().rally, data.rally || {});
  // saves from before the Legacy Tree: existing seats become Political Capital
  if (data.pc === undefined) s.pc = s.seats || 0;
  s.tree = (data.tree || []).filter((id) => TREE_BY_ID[id]);
  s.buffs = (data.buffs || []).filter((b) => b.until > Date.now());
  s.history = Array.isArray(data.history) ? data.history.slice(-240) : [];
  s.version = 2;
  return s;
}
function save(quiet = true) {
  const ok = writeSave(SAVE_KEY, serialize());
  if (!quiet) toast(ok ? "Game saved" : "Couldn't save", ok ? "Your campaign is safe." : "Your browser is blocking storage for this page.", ok ? "ballot" : "scroll");
  return ok;
}
// A short description of a save, used for backups and for comparing with the cloud
function summary(s = state) {
  return {
    allTimeVotes: s.allTimeVotes || 0, votes: s.votes || 0, seats: s.seats || 0, elections: s.elections || 0,
    upgrades: (s.upgrades || []).length, lastSave: s.lastSave || Date.now(),
  };
}
let recoveredFrom = null;
function load() {
  // Try the main save, then the mirror of the previous save, then the newest backup
  const candidates = saveCandidates(SAVE_KEY);
  for (let i = 0; i < candidates.length; i++) {
    try {
      state = deserialize(candidates[i]);
      if (i > 0) recoveredFrom = "the previous save";
      return true;
    } catch (e) { console.warn("Unreadable save, trying the next copy", e); }
  }
  for (const b of listBackups()) {
    try { state = deserialize(b.save); recoveredFrom = "a backup"; return true; } catch (e) { /* try older */ }
  }
  return false;
}
// Keep a restorable copy of the current progress before anything replaces it
function snapshot(reason, kind = "safety") {
  if ((state.allTimeVotes || 0) <= 0 && !state.clicks) return;
  addBackup(serialize(), summary(), reason, kind);
}
// Replace the current progress with a save string (import, restore, cloud). Caller snapshots first.
function loadSave(str) {
  state = deserialize(str);
  upgSignature = "";
  setSoundEnabled(state.opts.sound);
  recalc();
  renderAll();
  map && map.update(state.buildings);
  save();
}
function applyOffline() {
  const away = Math.min((Date.now() - state.lastSave) / 1000, OFFLINE_CAP_S);
  if (away < 60) return;
  recalc();
  const gain = cache.baseVps * away * offlineRate();
  if (gain <= 0) return;
  earn(gain);
  showModal({
    icon: "clock",
    title: "Welcome back!",
    body: `<p>While you were away for <b>${fmtTime(away)}</b>, your campaign kept working at ${Math.round(offlineRate() * 100)}% speed.</p>
      <p class="big-gain">${ballotInline} +${esc(fmtBig(gain))} votes</p>`,
    actions: [{ label: "Back to the campaign!", cls: "btn-primary" }],
  });
}

// ======================================================================
// Themes (see themes.js). "auto" follows the device's light/dark setting.
// ======================================================================
const darkMQ = window.matchMedia("(prefers-color-scheme: dark)");
function Color(hex) { // tiny hex -> {r,g,b} helper for canvas gradients
  const h = (hex || "#0038b8").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function currentTheme() {
  const t = state.opts.theme || "auto";
  if (t === "auto" || !THEME_BY_ID[t]) return darkMQ.matches ? "dark" : "light";
  return t;
}
const themeObj = () => THEME_BY_ID[currentTheme()];
let appliedVars = [];
function swatchHTML(colors) {
  return `<span class="swatch">${colors.map((c) => `<i style="background:${c}"></i>`).join("")}</span>`;
}
function themeCards() {
  const auto = `<button class="theme-card" data-v="auto">${swatchHTML(["#ffffff", "#0038b8", "#060b1c"])}<span>Auto</span></button>`;
  return auto + THEMES.map((t) => `<button class="theme-card" data-v="${t.id}">${swatchHTML(t.swatch)}<span>${esc(t.name)}</span></button>`).join("");
}
function applyTheme() {
  const th = themeObj();
  const root = document.documentElement;
  root.dataset.theme = th.id;
  root.dataset.tone = th.tone;
  appliedVars.forEach((k) => root.style.removeProperty(k));
  appliedVars = Object.keys(th.vars);
  for (const [k, v] of Object.entries(th.vars)) root.style.setProperty(k, v);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = th.meta;
  const btn = $("btn-theme");
  btn.innerHTML = swatchHTML(th.swatch);
  btn.setAttribute("aria-label", `Theme: ${th.name}. Choose a theme`);
  btn.title = `Theme: ${th.name}`;
  const chosen = state.opts.theme && (state.opts.theme === "auto" || THEME_BY_ID[state.opts.theme]) ? state.opts.theme : "auto";
  document.querySelectorAll(".theme-card").forEach((b) => b.classList.toggle("active", b.dataset.v === chosen));
  flagBg && flagBg.setTheme(th);
  badge && badge.setTheme(th);
  map && map.setTheme(th);
  if (ui.tab === "stats") drawGraph();
}
function setThemeChoice(v) {
  const before = currentTheme();
  state.opts.theme = v;
  applyTheme();
  if (currentTheme() !== before) confetti(50);
  save();
}
function toggleThemePop(force) {
  const pop = $("theme-pop");
  const open = force !== undefined ? force : pop.classList.contains("hidden");
  pop.classList.toggle("hidden", !open);
  $("btn-theme").setAttribute("aria-expanded", open ? "true" : "false");
}

// ======================================================================
// Upgrades change the look of the 3D scenes
// ======================================================================
const MONUMENT_UPGRADES = /^(global_[0-7]|news_\d|rally_\d|decision_\d|offline_\d)$/;
const METAL_NAMES = ["bronze", "silver", "silver", "gold", "gold", "platinum", "iridescent"];
function upgradeLook() {
  const look = { tiers: {}, click: 0, charisma: 0, globals: 0, synergies: [], monuments: [] };
  for (const id of state.upgrades) {
    const u = UPG_BY_ID[id];
    if (!u) continue;
    if (u.kind === "building") look.tiers[u.target] = (look.tiers[u.target] || 0) + 1;
    else if (u.kind === "click") look.click++;
    else if (u.kind === "clickVps") look.charisma++;
    else if (u.kind === "global") look.globals++;
    else if (u.kind === "synergy") look.synergies.push([u.source, u.target]);
    if (MONUMENT_UPGRADES.test(id)) look.monuments.push(id);
  }
  look.goldHQ = has("global_8");
  look.crown = has("global_9");
  look.rallyFireworks = has("rally_1");
  return look;
}
function applyUpgradeLook() {
  const look = upgradeLook();
  map && map.setUpgradeLook(look);
  badge && badge.setUpgrades({ click: look.click, charisma: look.charisma, globals: look.globals, synergies: look.synergies.length });
}
function visualNote(u) {
  if (u.kind === "building") return `Adds a ${u.frame} pedestal under every ${BLD_BY_ID[u.target].name} on your island.`;
  if (u.kind === "click") return "Upgrades the metal of your campaign coin.";
  if (u.kind === "clickVps") return "Adds a star orbiting your campaign coin.";
  if (u.id === "global_8") return "Turns the HQ ballot box on your island to solid gold.";
  if (u.id === "global_9") return "Puts a crown on top of the island's flagpole.";
  if (u.kind === "global") return "Raises a monument in your plaza and grows the laurel wreath on your coin.";
  if (u.kind === "synergy") return "Builds a glowing link between the two districts and sets a gem in your coin.";
  if (u.id === "rally_1") return "Raises a monument, and fireworks light up the island during rallies.";
  if (MONUMENT_UPGRADES.test(u.id)) return "Raises a monument in your plaza.";
  return "";
}
function announceLook(u, before) {
  if (MONUMENT_UPGRADES.test(u.id)) toast("New landmark!", `A ${u.name} monument now stands in your plaza.`, u.icon, "gold");
  else if (u.id === "global_8") toast("Golden HQ!", "Your campaign HQ is now solid gold.", "ballot", "gold");
  else if (u.id === "global_9") toast("Crowned!", "A crown now tops the flagpole on your island.", "crown", "gold");
  else if (u.kind === "click") {
    const m = METAL_NAMES[Math.min(6, upgradeLook().click)];
    if (m !== METAL_NAMES[Math.min(6, before.click)]) toast("Coin upgraded!", `Your campaign coin now has a ${m} rim.`, u.icon, "gold");
  }
}
darkMQ.addEventListener("change", () => { if ((state.opts.theme || "auto") === "auto") applyTheme(); });

// ======================================================================
// Backups (Options)
// ======================================================================
function renderBackups() {
  const box = $("backup-list");
  if (!box) return;
  const list = listBackups();
  if (!list.length) {
    box.innerHTML = `<p class="muted small">No backups yet. One is made automatically every 15 minutes, and before anything replaces your progress (importing, wiping, elections, loading from your account).</p>`;
    return;
  }
  box.innerHTML = `<div class="backup-list">${list.map((b) => `<div class="backup-row"><div><b>${esc(b.reason || "Backup")}</b>
    <span><b>${fmtBig(b.summary.allTimeVotes || 0)}</b> votes all time · <b>${b.summary.seats || 0}</b> seats · ${fmtTime((Date.now() - b.t) / 1000)} ago</span></div>
    <button class="btn" data-id="${b.id}">Restore</button></div>`).join("")}</div>`;
  box.querySelectorAll("button[data-id]").forEach((bt) => bt.addEventListener("click", () => {
    const b = listBackups().find((x) => x.id === bt.dataset.id);
    if (!b) return;
    showModal({
      icon: "scroll", title: "Restore this backup?",
      body: `<p><b>${fmtBig(b.summary.allTimeVotes || 0)}</b> votes all time, <b>${b.summary.seats || 0}</b> seats, from ${fmtTime((Date.now() - b.t) / 1000)} ago.</p>
        <p class="muted small">Your current progress is backed up first, so you can switch back.</p>`,
      actions: [
        { label: "Restore it", cls: "btn-primary", onClick: () => {
          snapshot("Before restoring a backup");
          loadSave(b.save);
          account && account.soon();
          renderBackups();
          toast("Backup restored", "Your previous progress was backed up first.", "ballot", "gold");
        } },
        { label: "Cancel" },
      ],
    });
  }));
}

// ======================================================================
// Rendering all
// ======================================================================
function renderAll() {
  renderBank(); renderBuildings(); renderUpgrades(); renderAchievements(); renderKnesset(); renderTree(); renderStats();
  updateMapEmpty();
  $("opt-particles").checked = state.opts.particles;
  $("opt-ticker").checked = state.opts.ticker;
  $("opt-sound").checked = state.opts.sound;
  $("opt-flag").checked = state.opts.flag;
  document.querySelectorAll("#opt-numbers button").forEach((b) => b.classList.toggle("active", b.dataset.v === state.opts.numbers));
  updateSoundButton();
  applyTheme();
  applyUpgradeLook();
}
function updateSoundButton() {
  const b = $("btn-sound");
  b.classList.toggle("muted", !state.opts.sound);
  b.setAttribute("aria-label", state.opts.sound ? "Sound on" : "Sound off");
}

// ======================================================================
// Main loop
// ======================================================================
let last = performance.now(), storeAcc = 0, slowAcc = 0, histAcc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 3600);
  last = now;
  const t = Date.now();

  const before = state.buffs.length;
  state.buffs = state.buffs.filter((b) => b.until > t);
  if (state.buffs.length !== before) recalc();

  if (cache.vps > 0) earn(cache.vps * dt);
  updateRally(Math.min(dt, 0.25));

  if (!newsEl && t >= nextNewsAt) spawnNews();
  if (!pendingDecision && t >= nextDecisionAt && state.totalVotes >= 1000) offerDecision();
  if (pendingDecision) {
    const left = Math.ceil((pendingDecision.expires - t) / 1000);
    els.decisionTimer.textContent = `Respond within ${left}s`;
    if (left <= 0) { pendingDecision = null; els.decisionBtn.classList.add("hidden"); scheduleDecision(); }
  }

  renderBank();
  storeAcc += dt;
  if (storeAcc > 0.1) { storeAcc = 0; renderBuildings(); renderUpgrades(); }

  slowAcc += dt;
  if (slowAcc >= 0.5) {
    slowAcc = 0;
    recalc();
    if (cache.vps > state.bestVps) state.bestVps = cache.vps;
    checkAchievements();
    refreshTooltip();
    if (ui.tab === "stats") renderStats();
    if (ui.tab === "knesset") renderKnesset();
    renderTree();
  }
  histAcc += dt;
  if (histAcc >= 5) {
    histAcc = 0;
    state.history.push(cache.vps);
    if (state.history.length > 240) state.history.shift();
  }
}

// ======================================================================
// 3D
// ======================================================================
function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch (e) { return false; }
}
function useBadgeFallback() {
  $("badge").classList.add("hidden");
  $("badge-fallback").classList.remove("hidden");
}
async function init3D() {
  if (!webglAvailable()) {
    document.body.classList.add("no-webgl");
    useBadgeFallback();
    $("map-fallback").classList.remove("hidden");
    return;
  }
  try {
    const { createFlagBackground } = await import("./flag3d.js");
    flagBg = createFlagBackground($("bg-flag"), { animate: state.opts.flag, theme: themeObj() });
    document.body.classList.add("has-flag3d");
  } catch (e) { console.warn("Flag background unavailable", e); }
  try {
    const { createBadge } = await import("./badge3d.js");
    badge = createBadge($("badge"), { photoUrl: "assets/bibi.jpg" });
    badge.setRally(rallyActive());
    badge.setTheme(themeObj());
  } catch (e) { console.warn("3D badge unavailable", e); useBadgeFallback(); }
  try {
    const { createMap } = await import("./map3d.js");
    map = createMap($("map"), { buildings: BUILDINGS, onHover: mapHover });
    map.update(state.buildings);
    map.setTheme(themeObj());
    syncMapActive();
  } catch (e) { console.warn("3D map unavailable", e); $("map-fallback").classList.remove("hidden"); }
  updateMapEmpty();
  applyUpgradeLook();
}
function mapHover(type, evt) {
  if (!type || !evt) { if (tooltipSource && tooltipSource.el === $("map")) hideTooltip(); return; }
  const b = BLD_BY_ID[type];
  tooltipSource = { el: $("map"), contentFn: () => `<div class="tt-head">${img(b.id, "tt-ico")}<div><div class="tt-title">${b.name}</div><div class="tt-sub">Owned: ${state.buildings[b.id]}${state.buildings[b.id] > map.capFor(b.id) ? ` (showing ${map.capFor(b.id)})` : ""}</div></div></div><div class="tt-line">Producing <b>${fmt(cache.perBuilding[b.id].total)}</b> votes/s</div>` };
  els.tooltip.innerHTML = tooltipSource.contentFn();
  els.tooltip.classList.remove("hidden");
  placeTooltip(evt.clientX, evt.clientY);
}
function syncMapActive() {
  if (!map) return;
  map.setActive(ui.tab === "map" && (!isMobile() || ui.view === "hq"));
}

// ======================================================================
// Wire up
// ======================================================================
function setTab(tab) {
  ui.tab = tab;
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  document.querySelectorAll(".tab-body").forEach((b) => b.classList.toggle("hidden", b.id !== `tab-${tab}`));
  if (tab === "stats") renderStats();
  if (tab === "knesset") { renderKnesset(); renderTree(); }
  if (tab === "legacy") renderTree();
  if (tab === "achievements") renderAchievements();
  if (tab === "options") renderBackups();
  syncMapActive();
}
function setView(view) {
  ui.view = view;
  document.body.dataset.view = view;
  document.querySelectorAll(".mobile-nav button").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  syncMapActive();
  window.scrollTo(0, 0);
}

function init() {
  buildStore();
  buildAchievements();
  buildHemicycle();
  buildTree();
  const loaded = load();
  setSoundEnabled(state.opts.sound);
  recalc();
  renderAll();
  if (loaded) applyOffline();
  recalc();

  // clicking: pointerdown feels instant on touch screens
  els.stage.addEventListener("pointerdown", (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    clickBibi(e.clientX, e.clientY);
  });
  els.stage.addEventListener("keydown", (e) => {
    if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); clickBibi(); }
  });
  els.stage.addEventListener("contextmenu", (e) => e.preventDefault());

  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => setTab(t.dataset.tab)));
  document.querySelectorAll(".mobile-nav button").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
  window.matchMedia("(max-width: 900px)").addEventListener("change", syncMapActive);

  document.querySelectorAll(".seg-amt button").forEach((btn) => btn.addEventListener("click", () => {
    ui.buyAmount = btn.dataset.amt === "max" ? "max" : Number(btn.dataset.amt);
    document.querySelectorAll(".seg-amt button").forEach((b) => b.classList.toggle("active", b === btn));
    renderBuildings();
  }));
  document.querySelectorAll(".seg-mode button").forEach((btn) => btn.addEventListener("click", () => {
    ui.buyMode = btn.dataset.mode;
    document.querySelectorAll(".seg-mode button").forEach((b) => b.classList.toggle("active", b === btn));
    renderBuildings();
  }));

  els.decisionBtn.addEventListener("click", openDecision);
  els.btnElection.addEventListener("click", callElection);
  $("btn-open-tree").addEventListener("click", () => setTab("legacy"));
  $("btn-respec").addEventListener("click", respecTree);
  $("btn-map-rotate").addEventListener("click", (e) => { if (map) e.target.textContent = `Auto-rotate: ${map.toggleRotate() ? "on" : "off"}`; });
  $("btn-map-reset").addEventListener("click", () => { if (map) { map.resetView(); $("btn-map-rotate").textContent = "Auto-rotate: on"; } });

  $("opt-theme").innerHTML = themeCards();
  $("theme-pop-grid").innerHTML = themeCards();
  document.querySelectorAll(".theme-card").forEach((b) => b.addEventListener("click", () => {
    setThemeChoice(b.dataset.v);
    if (b.closest("#theme-pop")) toggleThemePop(false);
  }));
  $("btn-theme").addEventListener("click", (e) => { e.stopPropagation(); toggleThemePop(); });
  document.addEventListener("click", (e) => { if (!e.target.closest("#theme-pop") && !e.target.closest("#btn-theme")) toggleThemePop(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleThemePop(false); });
  $("btn-sound").addEventListener("click", () => {
    state.opts.sound = !state.opts.sound;
    setSoundEnabled(state.opts.sound);
    if (state.opts.sound) { unlockAudio(); sfx.buy(); }
    renderAll();
  });
  $("opt-sound").addEventListener("change", (e) => { state.opts.sound = e.target.checked; setSoundEnabled(state.opts.sound); updateSoundButton(); });
  $("opt-particles").addEventListener("change", (e) => { state.opts.particles = e.target.checked; });
  $("opt-ticker").addEventListener("change", (e) => { state.opts.ticker = e.target.checked; nextHeadline(); });
  $("opt-flag").addEventListener("change", (e) => { state.opts.flag = e.target.checked; flagBg && flagBg.setAnimate(state.opts.flag); });
  document.querySelectorAll("#opt-numbers button").forEach((b) => b.addEventListener("click", () => {
    state.opts.numbers = b.dataset.v;
    upgSignature = "";
    renderAll();
  }));

  $("btn-save").addEventListener("click", () => save(false));
  $("btn-export").addEventListener("click", () => {
    els.saveText.value = serialize();
    els.saveText.select();
    toast("Save exported", "Copy the text in the box and keep it somewhere safe.", "scroll");
  });
  $("btn-import").addEventListener("click", () => {
    const txt = els.saveText.value.trim();
    if (!txt) return toast("Nothing to import", "Paste a save into the box first.", "scroll");
    try {
      deserialize(txt); // validate before touching anything
      snapshot("Before importing a save");
      loadSave(txt);
      account && account.soon();
      toast("Save imported", "Your previous progress was kept in Backups, just in case.", "ballot");
    } catch (e) {
      toast("Import failed", "That doesn't look like a valid save.", "scroll");
    }
  });
  $("btn-reset").addEventListener("click", () => {
    showModal({
      icon: "scroll", title: "Wipe your save?",
      body: "<p>This starts a brand-new campaign: all progress, seats and awards are cleared.</p><p class=\"muted small\">A backup is kept in Options → Backups, so you can still undo this.</p>",
      actions: [
        { label: "Wipe everything", cls: "btn-danger", onClick: () => {
          snapshot("Before wiping the save");
          state = freshState();
          save();
          upgSignature = "";
          recalc(); renderAll();
          map && map.update(state.buildings);
          renderBackups();
          toast("Save wiped", "A brand-new campaign begins. Your old progress is in Backups.", "ballot");
        } },
        { label: "Keep my campaign", cls: "btn-primary" },
      ],
    });
  });

  setInterval(save, 10000);
  setInterval(() => { snapshot("Automatic backup", "auto"); if (ui.tab === "options") renderBackups(); }, 15 * 60 * 1000);
  if (recoveredFrom) setTimeout(() => toast("Progress recovered", `Your latest save couldn't be read, so we loaded ${recoveredFrom}.`, "scroll", "gold"), 1500);
  account = initAccounts({ serialize, summary, loadSave, snapshot, toast, showModal, fmtBig, fmtTime, esc });
  window.addEventListener("beforeunload", () => save());
  document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

  nextHeadline();
  requestAnimationFrame(frame);
  init3D();

  // test/debug hook
  window.__bibi = { get state() { return state; }, set state(s) { state = s; }, recalc, renderAll, spawnNews, offerDecision, startRally, save, snapshot, get account() { return account; }, get map() { return map; }, get badge() { return badge; } };
}

init();

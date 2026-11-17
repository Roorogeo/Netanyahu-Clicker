// Procedural low-poly 3D models. Shared by the 3D campaign map and by
// tools/render-icons.html, which renders each one to a PNG icon.
import * as THREE from "three";
import { RoundedBoxGeometry } from "../vendor/three/addons/RoundedBoxGeometry.js";

export const C = {
  blue: "#0038b8", blueMid: "#2f62d8", blueLight: "#7fa6f5", white: "#f6f6f1", paper: "#fbfaf4",
  stone: "#e8d9b6", stoneDark: "#c9b48a", skin: "#e8b38c", skin2: "#c98d63", hair: "#4a3527",
  grey: "#9aa3b2", greyDark: "#5d6574", dark: "#262b36", gold: "#f2b705", goldDeep: "#c98f00",
  red: "#d64541", orange: "#f08a24", green: "#5b8c3a", greenLight: "#8bbf4d", olive: "#7a8b3a",
  wood: "#9c6337", woodLight: "#c78f55", sand: "#ead39c", falafel: "#8a5a2b", water: "#3fc1c9",
  salt: "#f4f1ea", purple: "#7b4dd6", pink: "#f07aa7", silver: "#c8ced8", tomato: "#c8392b",
};

// ---------- caches & helpers ----------
const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0, ...opts }));
  }
  return matCache.get(key);
}
const glow = (color, intensity = 1.4) => mat(color, { emissive: color, emissiveIntensity: intensity, roughness: 0.4 });
const metal = (color, rough = 0.32) => mat(color, { metalness: 0.85, roughness: rough });

const geoCache = new Map();
function geo(key, make) {
  if (!geoCache.has(key)) geoCache.set(key, make());
  return geoCache.get(key);
}
const box = (w, h, d) => geo(`box${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
const rbox = (w, h, d, r = 0.04) => geo(`rbox${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, 3, r));
const cyl = (rt, rb, h, s = 24) => geo(`cyl${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
const sph = (r, w = 24, h = 16) => geo(`sph${r},${w},${h}`, () => new THREE.SphereGeometry(r, w, h));
const cone = (r, h, s = 24) => geo(`cone${r},${h},${s}`, () => new THREE.ConeGeometry(r, h, s));
const torus = (r, t, rs = 12, ts = 48, arc = Math.PI * 2) =>
  geo(`tor${r},${t},${rs},${ts},${arc}`, () => new THREE.TorusGeometry(r, t, rs, ts, arc));
const ico = (r, d = 0) => geo(`ico${r},${d}`, () => new THREE.IcosahedronGeometry(r, d));

function m(g, material, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(g, material);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  return o;
}
function rot(o, x = 0, y = 0, z = 0) { o.rotation.set(x, y, z); return o; }
function scl(o, x, y = x, z = x) { o.scale.set(x, y, z); return o; }
function group(...children) { const g = new THREE.Group(); children.forEach((c) => g.add(c)); return g; }

// Canvas textures (drawn once, cached)
const texCache = new Map();
export function canvasTex(key, w, h, draw) {
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  texCache.set(key, t);
  return t;
}
const texMat = (tex, opts = {}) => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, ...opts });

export function drawStarOfDavid(ctx, cx, cy, r, lw, color) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineJoin = "miter";
  for (const flip of [1, -1]) {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 * flip + i * (Math.PI * 2 / 3);
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
  }
  ctx.restore();
}

export function drawFlag(ctx, w, h, spec = {}) {
  const { field = "#ffffff", stripe = C.blue, star = C.blue, glow = false } = spec;
  ctx.save();
  ctx.fillStyle = field; ctx.fillRect(0, 0, w, h);
  if (glow) { ctx.shadowColor = stripe; ctx.shadowBlur = h * 0.06; }
  ctx.fillStyle = stripe;
  ctx.fillRect(0, h * 0.09375, w, h * 0.15625);
  ctx.fillRect(0, h * 0.75, w, h * 0.15625);
  if (glow) ctx.shadowColor = star;
  drawStarOfDavid(ctx, w / 2, h / 2, h * 0.19, h * 0.034, star);
  ctx.restore();
}
export const PRIDE_COLORS = ["#e40303", "#ff8c00", "#ffed00", "#008026", "#004dff", "#750787"];

// Rainbow flag with a white Star of David, as flown at Tel Aviv Pride
export function drawPrideFlag(ctx, w, h) {
  PRIDE_COLORS.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, Math.floor((i * h) / 6), w, Math.ceil(h / 6) + 1);
  });
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = h * 0.02;
  drawStarOfDavid(ctx, w / 2, h / 2, h * 0.21, h * 0.04, "#ffffff");
  ctx.restore();
}
export function drawStripes(ctx, w, h, colors) {
  colors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, Math.floor((i * h) / colors.length), w, Math.ceil(h / colors.length) + 1);
  });
}

// spec: "pride" | { type: "pride" } | { type: "stripes", colors } | { field, stripe, star, glow } | undefined (classic)
export function drawThemeFlag(ctx, w, h, spec) {
  ctx.clearRect(0, 0, w, h);
  if (spec === "pride" || (spec && spec.type === "pride")) drawPrideFlag(ctx, w, h);
  else if (spec && spec.type === "stripes") drawStripes(ctx, w, h, spec.colors);
  else drawFlag(ctx, w, h, typeof spec === "object" ? spec : {});
}

// Flags on the 3D models share one texture; redraw it when the theme changes
let flagTheme = undefined;
const flagTex = () => canvasTex("flag", 512, 372, (ctx, w, h) => drawThemeFlag(ctx, w, h, flagTheme));
export function setFlagTheme(theme) {
  flagTheme = theme;
  const t = texCache.get("flag");
  if (t) {
    drawThemeFlag(t.image.getContext("2d"), t.image.width, t.image.height, theme);
    t.needsUpdate = true;
  }
}

const signTex = (text, bg = "#fff", fg = C.blue) => canvasTex(`sign:${text}:${bg}:${fg}`, 256, 160, (ctx, w, h) => {
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = fg; ctx.fillRect(0, 10, w, 16); ctx.fillRect(0, h - 26, w, 16);
  ctx.font = "900 64px Rubik, Arial Black, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2 + 2);
});

// A flat textured panel (for signs and screens)
function panel(tex, w, h, emissive = false) {
  const material = emissive
    ? new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: "#ffffff", emissiveIntensity: 0.9, roughness: 0.4 })
    : texMat(tex);
  return m(geo(`plane${w},${h}`, () => new THREE.PlaneGeometry(w, h)), material);
}

// Small flag on a pole
function flagPole(h = 1.2, fw = 0.42) {
  const g = group(m(cyl(0.02, 0.025, h, 8), metal(C.silver), 0, h / 2, 0), m(sph(0.035, 8, 6), metal(C.gold), 0, h + 0.02, 0));
  const f = m(geo(`flagplane${fw}`, () => new THREE.PlaneGeometry(fw, fw * 0.727, 8, 4)),
    new THREE.MeshStandardMaterial({ map: flagTex(), side: THREE.DoubleSide, roughness: 0.8 }), fw / 2 + 0.02, h - fw * 0.37, 0);
  f.userData.wave = true;
  g.add(f);
  return g;
}

// ---------- characters ----------
export function person(shirt = C.blue, opts = {}) {
  const { skin = C.skin, hair = C.hair, pants = C.dark } = opts;
  const g = new THREE.Group();
  g.add(m(cyl(0.065, 0.06, 0.26, 10), mat(pants), -0.07, 0.13, 0));
  g.add(m(cyl(0.065, 0.06, 0.26, 10), mat(pants), 0.07, 0.13, 0));
  g.add(m(rbox(0.3, 0.34, 0.2, 0.07), mat(shirt), 0, 0.42, 0));
  g.add(m(sph(0.13, 16, 12), mat(skin), 0, 0.71, 0));
  g.add(scl(m(sph(0.135, 16, 10), mat(hair), 0, 0.75, -0.01), 1, 0.72, 1));
  g.add(rot(m(cyl(0.045, 0.045, 0.3, 8), mat(shirt), -0.19, 0.42, 0), 0, 0, -0.25));
  g.add(rot(m(cyl(0.045, 0.045, 0.3, 8), mat(shirt), 0.19, 0.42, 0), 0, 0, 0.25));
  // eyes
  g.add(m(sph(0.018, 6, 6), mat(C.dark), -0.045, 0.73, 0.118));
  g.add(m(sph(0.018, 6, 6), mat(C.dark), 0.045, 0.73, 0.118));
  return g;
}

// ---------- buildings ----------
function volunteer() {
  const p = person(C.blue);
  // raise right arm holding a sign
  p.children[6].rotation.set(0, 0, 0.5); p.children[6].position.set(0.2, 0.55, 0);
  const sign = group(
    m(cyl(0.018, 0.018, 0.75, 6), mat(C.woodLight), 0.27, 0.78, 0.02),
    m(box(0.46, 0.3, 0.03), mat(C.white), 0.27, 1.12, 0.02),
  );
  const face = panel(signTex("VOTE"), 0.44, 0.28); face.position.set(0.27, 1.12, 0.037);
  sign.add(face);
  p.add(sign);
  return p;
}

function falafel() {
  const g = new THREE.Group();
  g.add(m(rbox(1.0, 0.5, 0.55, 0.05), mat(C.white), 0, 0.5, 0));
  g.add(m(box(1.02, 0.12, 0.57), mat(C.blue), 0, 0.33, 0));
  for (const x of [-0.36, 0.36]) {
    g.add(rot(m(cyl(0.13, 0.13, 0.06, 16), mat(C.dark), x, 0.14, 0.3), Math.PI / 2, 0, 0));
    g.add(rot(m(cyl(0.05, 0.05, 0.065, 10), metal(C.silver), x, 0.14, 0.31), Math.PI / 2, 0, 0));
  }
  // posts + striped awning
  for (const x of [-0.46, 0.46]) g.add(m(cyl(0.02, 0.02, 0.55, 6), metal(C.silver), x, 1.02, 0.22));
  for (let i = 0; i < 6; i++) {
    g.add(rot(m(box(0.18, 0.04, 0.64), mat(i % 2 ? C.white : C.blue), -0.45 + i * 0.18, 1.32, 0.05), 0.25, 0, 0));
  }
  // falafel tray
  g.add(m(box(0.5, 0.04, 0.3), metal(C.silver), 0, 0.77, 0.05));
  for (let i = 0; i < 7; i++) {
    g.add(m(ico(0.06, 1), mat(C.falafel, { flatShading: true, roughness: 0.9 }), -0.18 + (i % 4) * 0.12, 0.83 + Math.floor(i / 4) * 0.05, 0.0 + (i % 2) * 0.08));
  }
  // pita
  g.add(rot(m(cyl(0.12, 0.12, 0.03, 16), mat("#e8c48a"), 0.36, 0.8, 0.08), 0.3, 0, 0.4));
  return g;
}

function office() {
  const g = new THREE.Group();
  g.add(m(rbox(1.1, 0.9, 0.8, 0.03), mat(C.stone), 0, 0.45, 0));
  g.add(m(box(1.18, 0.08, 0.88), mat(C.stoneDark), 0, 0.93, 0));
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    if (r === 0 && c === 1) continue;
    g.add(m(box(0.2, 0.18, 0.02), glow("#9fc4ff", 0.35), -0.33 + c * 0.33, 0.3 + r * 0.33, 0.405));
  }
  g.add(m(box(0.22, 0.34, 0.03), mat(C.blue), 0, 0.17, 0.405));
  // banner over door
  const b = panel(signTex("HQ", C.blue, "#fff"), 0.44, 0.16); b.position.set(0, 0.42, 0.415); g.add(b);
  const fp = flagPole(0.7, 0.32); fp.position.set(0.38, 0.97, 0); g.add(fp);
  // AC unit
  g.add(m(box(0.22, 0.1, 0.16), mat(C.grey), -0.3, 1.02, 0.1));
  return g;
}

function radio() {
  const g = new THREE.Group();
  // studio
  g.add(m(rbox(0.7, 0.45, 0.55, 0.03), mat(C.white), -0.15, 0.225, 0.1));
  g.add(m(box(0.26, 0.08, 0.02), glow(C.red, 1.6), -0.15, 0.36, 0.385));
  const onair = panel(canvasTex("onair", 128, 40, (ctx, w, h) => {
    ctx.fillStyle = "#e33"; ctx.fillRect(0, 0, w, h); ctx.fillStyle = "#fff";
    ctx.font = "900 26px Arial Black, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("ON AIR", w / 2, h / 2 + 1);
  }), 0.26, 0.08, true);
  onair.position.set(-0.15, 0.36, 0.392); g.add(onair);
  // lattice tower
  const H = 1.7, segs = 6;
  for (let i = 0; i < segs; i++) {
    const y0 = (i / segs) * H, y1 = ((i + 1) / segs) * H;
    const w0 = 0.22 * (1 - i / segs) + 0.04, w1 = 0.22 * (1 - (i + 1) / segs) + 0.04;
    const color = i % 2 ? C.white : C.red;
    const s = m(cyl(w1, w0, y1 - y0, 4, 1), mat(color, { wireframe: false }), 0.32, (y0 + y1) / 2, -0.05);
    s.rotation.y = Math.PI / 4;
    s.scale.set(1, 1, 1);
    g.add(s);
  }
  const light = m(sph(0.05, 10, 8), glow(C.red, 2.2), 0.32, H + 0.04, -0.05);
  light.userData.blink = true;
  g.add(light);
  // waves
  for (let i = 1; i <= 2; i++) {
    const w = rot(m(torus(0.12 * i, 0.012, 6, 24, Math.PI * 0.6), glow(C.blueLight, 0.8), 0.32, H - 0.1, -0.05), 0, 0, Math.PI * 0.2);
    g.add(w);
    const w2 = rot(m(torus(0.12 * i, 0.012, 6, 24, Math.PI * 0.6), glow(C.blueLight, 0.8), 0.32, H - 0.1, -0.05), 0, 0, Math.PI * 1.2);
    g.add(w2);
  }
  return g;
}

function billboard() {
  const g = new THREE.Group();
  for (const x of [-0.42, 0.42]) g.add(m(cyl(0.035, 0.04, 0.9, 8), metal(C.greyDark), x, 0.45, 0));
  g.add(m(box(1.25, 0.72, 0.06), mat(C.greyDark), 0, 1.15, 0));
  const face = panel(canvasTex("billboard", 512, 296, (ctx, w, h) => {
    const grd = ctx.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, "#0a3fc4"); grd.addColorStop(1, "#002680");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#fff"; ctx.fillRect(0, h - 70, w, 8);
    drawStarOfDavid(ctx, 88, 118, 60, 11, "#fff");
    ctx.font = "900 78px Rubik, Arial Black, sans-serif"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff";
    ctx.fillText("VOTE", 175, 90); ctx.fillStyle = C.gold; ctx.fillText("BIBI", 175, 165);
    ctx.font = "700 30px Rubik, Arial, sans-serif"; ctx.fillStyle = "#fff"; ctx.fillText("A STRONG CAMPAIGN", 26, h - 32);
  }), 1.17, 0.66, true);
  face.material.emissiveIntensity = 0.35;
  face.position.set(0, 1.15, 0.032); g.add(face);
  // catwalk + lamps
  g.add(m(box(1.2, 0.03, 0.18), metal(C.greyDark), 0, 0.77, 0.12));
  for (const x of [-0.35, 0.35]) g.add(rot(m(cone(0.05, 0.1, 10), glow("#fff3c4", 1.2), x, 1.58, 0.14), Math.PI * 0.75, 0, 0));
  return g;
}

function warroom() {
  const g = new THREE.Group();
  g.add(rot(m(rbox(0.66, 1.25, 0.08, 0.06), mat(C.dark, { roughness: 0.3, metalness: 0.4 }), 0, 0.72, 0), -0.12, 0, 0));
  const screen = panel(canvasTex("phone", 256, 480, (ctx, w, h) => {
    ctx.fillStyle = "#0b1e4f"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = C.blue; ctx.fillRect(0, 0, w, 54);
    ctx.fillStyle = "#fff"; ctx.font = "800 26px Rubik, Arial, sans-serif"; ctx.fillText("#Campaign", 18, 36);
    for (let i = 0; i < 4; i++) {
      const y = 76 + i * 98;
      ctx.fillStyle = "#16306e"; ctx.beginPath(); ctx.roundRect(14, y, w - 28, 84, 12); ctx.fill();
      ctx.fillStyle = ["#f2b705", "#5ad", "#f07aa7", "#7c5"][i]; ctx.beginPath(); ctx.arc(46, y + 30, 18, 0, 7); ctx.fill();
      ctx.fillStyle = "#cfe0ff"; ctx.fillRect(74, y + 18, 120, 10); ctx.fillRect(74, y + 38, 150, 8);
      ctx.fillStyle = "#ff5a7a"; ctx.font = "700 20px Arial"; ctx.fillText("♥ " + (12 + i * 37) + "K", 74, y + 72);
    }
  }), 0.58, 1.12, true);
  screen.material.emissiveIntensity = 0.75;
  screen.position.set(0, 0.725, 0.045); screen.rotation.x = -0.12;
  g.add(screen);
  // notification bubbles
  for (const [x, y, c] of [[0.38, 1.35, C.red], [-0.4, 1.1, C.pink], [0.42, 0.95, C.gold]]) {
    const b = m(sph(0.075, 14, 10), glow(c, 0.6), x, y, 0.1);
    b.userData.bob = Math.random() * 6;
    g.add(b);
  }
  // little stand
  g.add(m(box(0.4, 0.06, 0.3), mat(C.greyDark), 0, 0.03, 0.05));
  return g;
}

function coalition() {
  const g = new THREE.Group();
  g.add(m(cyl(0.48, 0.48, 0.06, 32), mat(C.woodLight), 0, 0.5, 0));
  g.add(m(cyl(0.06, 0.12, 0.47, 12), mat(C.wood), 0, 0.25, 0));
  const chairColors = [C.blue, C.red, C.green, C.orange, C.purple, C.gold];
  chairColors.forEach((c, i) => {
    const a = (i / chairColors.length) * Math.PI * 2;
    const x = Math.cos(a) * 0.68, z = Math.sin(a) * 0.68;
    const ch = group(
      m(box(0.26, 0.05, 0.26), mat(c), 0, 0.32, 0),
      m(box(0.26, 0.3, 0.05), mat(c), 0, 0.5, 0.11),
      m(cyl(0.02, 0.02, 0.3, 6), mat(C.dark), -0.1, 0.15, -0.1), m(cyl(0.02, 0.02, 0.3, 6), mat(C.dark), 0.1, 0.15, -0.1),
      m(cyl(0.02, 0.02, 0.3, 6), mat(C.dark), -0.1, 0.15, 0.1), m(cyl(0.02, 0.02, 0.3, 6), mat(C.dark), 0.1, 0.15, 0.1),
    );
    ch.position.set(x, 0, z);
    ch.rotation.y = -a - Math.PI / 2;
    g.add(ch);
  });
  // documents + pen + gavel-free deal: two coffee cups
  g.add(rot(m(box(0.26, 0.01, 0.34), mat(C.paper), 0.05, 0.54, 0.05), 0, 0.3, 0));
  g.add(rot(m(box(0.26, 0.01, 0.34), mat(C.paper), -0.12, 0.545, -0.06), 0, -0.4, 0));
  g.add(m(cyl(0.05, 0.04, 0.09, 12), mat(C.white), 0.26, 0.58, -0.18));
  g.add(m(cyl(0.05, 0.04, 0.09, 12), mat(C.white), -0.28, 0.58, 0.16));
  g.add(rot(m(cyl(0.012, 0.012, 0.2, 6), metal(C.gold), 0.1, 0.56, 0.12), 0, 0, Math.PI / 2));
  return g;
}

function rocket() {
  const g = new THREE.Group();
  g.add(m(cyl(0.42, 0.48, 0.1, 6), mat(C.greyDark, { flatShading: true }), 0, 0.05, 0));
  const body = group(
    m(cyl(0.18, 0.2, 0.9, 24), mat(C.white), 0, 0.65, 0),
    m(cone(0.18, 0.38, 24), mat(C.blue), 0, 1.29, 0),
    m(cyl(0.205, 0.205, 0.08, 24), mat(C.blue), 0, 0.42, 0),
    rot(m(cyl(0.075, 0.075, 0.03, 20), metal(C.silver), 0, 0.85, 0.185), Math.PI / 2, 0, 0),
    rot(m(cyl(0.055, 0.055, 0.035, 20), glow("#9fd3ff", 0.9), 0, 0.85, 0.19), Math.PI / 2, 0, 0),
    m(cyl(0.12, 0.15, 0.1, 16), metal(C.greyDark), 0, 0.17, 0),
  );
  for (let i = 0; i < 3; i++) {
    const fin = m(box(0.03, 0.28, 0.2), mat(C.blue), 0, 0.33, 0.2);
    const pivot = new THREE.Group(); pivot.add(fin); pivot.rotation.y = (i / 3) * Math.PI * 2;
    body.add(pivot);
  }
  const flame = m(cone(0.1, 0.26, 12), glow(C.orange, 2), 0, 0.02, 0);
  flame.rotation.x = Math.PI; flame.userData.flicker = true;
  body.add(flame);
  body.position.y = 0.08;
  g.add(body);
  return g;
}

function parliament() {
  const g = new THREE.Group();
  g.add(m(box(1.5, 0.12, 1.0), mat(C.stoneDark), 0, 0.06, 0));
  g.add(m(box(1.36, 0.08, 0.9), mat(C.stone), 0, 0.16, 0.0));
  for (let i = 0; i < 3; i++) g.add(m(box(0.7 - i * 0.0, 0.05, 0.12), mat(C.stone), 0, 0.03 + i * 0.05, 0.55 - i * 0.06));
  g.add(m(box(1.25, 0.62, 0.7), mat(C.stone), 0, 0.51, -0.05));
  for (let i = 0; i < 8; i++) g.add(m(cyl(0.04, 0.045, 0.62, 10), mat("#f3ead2"), -0.56 + i * 0.16, 0.51, 0.36));
  g.add(m(box(1.36, 0.1, 0.84), mat(C.stoneDark), 0, 0.87, 0.0));
  g.add(m(box(1.2, 0.06, 0.74), mat(C.stone), 0, 0.95, 0.0));
  for (let i = 0; i < 6; i++) g.add(m(box(0.12, 0.3, 0.02), glow("#ffe3a3", 0.25), -0.5 + i * 0.2, 0.55, 0.302));
  const fp = flagPole(0.65, 0.3); fp.position.set(0, 0.98, 0); g.add(fp);
  return g;
}

function globe() {
  const g = new THREE.Group();
  g.add(m(cyl(0.22, 0.3, 0.08, 24), mat(C.wood), 0, 0.04, 0));
  g.add(m(cyl(0.03, 0.03, 0.25, 8), metal(C.gold), 0, 0.2, 0));
  const tex = canvasTex("globe", 512, 256, (ctx, w, h) => {
    ctx.fillStyle = "#2f7fd8"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#6cbf4f";
    const blobs = [[80, 80, 50, 34], [120, 150, 34, 50], [250, 70, 60, 30], [270, 140, 40, 55], [380, 90, 70, 40], [420, 170, 30, 25], [300, 220, 60, 14]];
    for (const [x, y, rx, ry] of blobs) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0.3, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#e9f2ff"; ctx.fillRect(0, 0, w, 10); ctx.fillRect(0, h - 12, w, 12);
  });
  const ball = m(sph(0.42, 32, 24), texMat(tex, { roughness: 0.45 }), 0, 0.75, 0);
  ball.rotation.z = 0.4; ball.userData.spin = 0.4;
  g.add(ball);
  g.add(rot(m(torus(0.47, 0.022, 8, 48, Math.PI * 1.3), metal(C.gold), 0, 0.75, 0), 0, Math.PI / 2, 0.4 + Math.PI * 0.85));
  // tiny flags around
  [[C.blue, -0.5], [C.red, 0.5], [C.green, 0.0]].forEach(([c, x], i) => {
    const pole = group(m(cyl(0.01, 0.01, 0.42, 6), metal(C.silver), 0, 0.21, 0), m(box(0.14, 0.09, 0.005), mat(c), 0.07, 0.37, 0));
    pole.position.set(x, 0, 0.45 - Math.abs(x) * 0.3);
    g.add(pole);
  });
  return g;
}

function deadSea() {
  const g = new THREE.Group();
  g.add(m(cyl(0.7, 0.75, 0.1, 28), mat(C.sand), 0, 0.05, 0));
  const water = m(cyl(0.6, 0.6, 0.04, 28), mat(C.water, { roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.92 }), 0, 0.1, 0);
  g.add(water);
  for (const [x, z, s] of [[0.48, -0.2, 1], [0.38, 0.35, 0.7], [-0.5, -0.32, 0.85], [-0.2, -0.55, 0.6]]) {
    g.add(scl(m(ico(0.12, 0), mat(C.salt, { flatShading: true, roughness: 0.3 }), x, 0.16, z), s, s * 1.4, s));
  }
  // floating thinker with a newspaper
  const floater = new THREE.Group();
  floater.add(rot(m(rbox(0.16, 0.42, 0.12, 0.05), mat(C.blue), 0, 0, 0), Math.PI / 2, 0, 0));
  floater.add(m(sph(0.075, 12, 10), mat(C.skin), 0, 0.02, -0.27));
  floater.add(rot(m(box(0.26, 0.005, 0.18), mat(C.paper), 0, 0.1, -0.12), -0.6, 0, 0));
  floater.position.set(-0.05, 0.16, 0.1); floater.rotation.y = 0.6;
  floater.userData.bob = 1.3;
  g.add(floater);
  // umbrella
  g.add(m(cyl(0.012, 0.012, 0.6, 6), mat(C.white), 0.5, 0.4, 0.45));
  g.add(m(cone(0.24, 0.12, 8), mat(C.blue, { flatShading: true }), 0.5, 0.72, 0.45));
  return g;
}

function satellite() {
  const g = new THREE.Group();
  g.add(m(rbox(0.32, 0.32, 0.42, 0.03), metal(C.gold, 0.25), 0, 0, 0));
  for (const s of [-1, 1]) {
    g.add(rot(m(cyl(0.015, 0.015, 0.22, 6), metal(C.silver), s * 0.27, 0, 0), 0, 0, Math.PI / 2));
    const p = m(box(0.62, 0.02, 0.32), mat("#1b3c8f", { metalness: 0.5, roughness: 0.25 }), s * 0.68, 0, 0);
    g.add(p);
    for (let i = 1; i < 4; i++) g.add(m(box(0.01, 0.022, 0.32), metal(C.silver), s * (0.37 + i * 0.155), 0, 0));
  }
  const dish = m(geo("dish", () => new THREE.SphereGeometry(0.2, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.35)), mat(C.white, { side: THREE.DoubleSide }), 0, 0.12, 0.3);
  dish.rotation.x = -Math.PI / 2 - 0.3;
  g.add(dish);
  g.add(rot(m(cyl(0.01, 0.01, 0.22, 6), metal(C.silver), 0, 0.3, 0), 0.4, 0, 0));
  const blink = m(sph(0.03, 8, 6), glow(C.red, 2), 0, 0.41, 0.04); blink.userData.blink = true; g.add(blink);
  g.position.y = 0.5;
  return group(g);
}

function quantum() {
  const g = new THREE.Group();
  g.add(m(cyl(0.38, 0.42, 0.08, 32), metal(C.greyDark), 0, 0.04, 0));
  const rig = new THREE.Group();
  const levels = [[0.36, 1.25], [0.28, 0.98], [0.21, 0.72], [0.14, 0.48]];
  levels.forEach(([r, y]) => {
    rig.add(m(cyl(r, r, 0.04, 32), metal(C.gold, 0.2), 0, y, 0));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      rig.add(m(cyl(0.012, 0.012, 0.26, 6), metal("#e8a33c", 0.2), Math.cos(a) * r * 0.7, y - 0.13, Math.sin(a) * r * 0.7));
    }
  });
  const core = m(sph(0.08, 16, 12), glow("#8ad7ff", 2.5), 0, 0.32, 0);
  core.userData.pulse = true;
  rig.add(core);
  rig.add(m(cyl(0.02, 0.02, 1.3, 6), metal(C.silver), 0, 0.95, 0));
  rig.userData.spin = 0.5;
  g.add(rig);
  return g;
}

function portal() {
  const g = new THREE.Group();
  g.add(m(cyl(0.6, 0.66, 0.1, 6), mat(C.greyDark, { flatShading: true }), 0, 0.05, 0));
  const ring = m(torus(0.52, 0.09, 16, 48), metal(C.purple, 0.25), 0, 0.72, 0);
  g.add(ring);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(m(sph(0.04, 8, 6), glow("#c9a6ff", 2), Math.cos(a) * 0.52, 0.72 + Math.sin(a) * 0.52, 0.08));
  }
  const swirl = m(geo("swirl", () => new THREE.CircleGeometry(0.46, 48)), new THREE.MeshStandardMaterial({
    map: canvasTex("swirl", 256, 256, (ctx, w, h) => {
      const grd = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
      grd.addColorStop(0, "#ffffff"); grd.addColorStop(0.3, "#9fd0ff"); grd.addColorStop(0.7, "#6a3fd0"); grd.addColorStop(1, "#22105a");
      ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 6;
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        for (let t = 0; t < 6; t += 0.05) { const r = t * 20, a = t + k * Math.PI / 2; ctx.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); }
        ctx.stroke();
      }
    }),
    emissive: "#ffffff", emissiveIntensity: 0.7, side: THREE.DoubleSide,
  }), 0, 0.72, 0);
  swirl.material.emissiveMap = swirl.material.map;
  swirl.userData.spinZ = 1.6;
  g.add(swirl);
  const tiny = scl(person(C.blue), 0.35); tiny.position.set(0.3, 0.1, 0.45); g.add(tiny);
  const tiny2 = scl(person(C.white), 0.35); tiny2.position.set(-0.32, 0.1, 0.4); g.add(tiny2);
  return g;
}

// ---------- upgrade & misc props ----------
function hand() {
  const g = new THREE.Group();
  const skin = mat(C.skin);
  g.add(m(rbox(0.5, 0.56, 0.18, 0.08), skin, 0, 0.55, 0));
  for (let i = 0; i < 4; i++) {
    const len = [0.32, 0.38, 0.36, 0.28][i];
    g.add(m(cyl(0.055, 0.055, len, 10), skin, -0.18 + i * 0.12, 0.83 + len / 2 - 0.05, 0));
    g.add(m(sph(0.055, 10, 8), skin, -0.18 + i * 0.12, 0.83 + len - 0.05, 0));
  }
  g.add(rot(m(cyl(0.06, 0.06, 0.3, 10), skin, 0.33, 0.62, 0.02), 0, 0, -0.7));
  g.add(m(sph(0.06, 10, 8), skin, 0.43, 0.74, 0.02));
  g.add(m(cyl(0.2, 0.22, 0.25, 20), mat(C.blue), 0, 0.17, 0));
  g.add(m(cyl(0.21, 0.21, 0.05, 20), mat(C.white), 0, 0.3, 0));
  g.add(m(sph(0.04, 8, 6), metal(C.gold), 0.15, 0.2, 0.15));
  return g;
}

function baby() {
  const g = new THREE.Group();
  g.add(rot(m(rbox(0.5, 0.7, 0.4, 0.18), mat(C.blueLight), 0, 0.4, 0), 0, 0, 0));
  g.add(m(sph(0.25, 24, 18), mat(C.skin), 0, 0.88, 0.02));
  g.add(m(torus(0.035, 0.012, 8, 16), mat(C.hair), 0, 1.14, 0.02));
  g.add(m(sph(0.025, 8, 6), mat(C.dark), -0.08, 0.92, 0.23));
  g.add(m(sph(0.025, 8, 6), mat(C.dark), 0.08, 0.92, 0.23));
  g.add(rot(m(cyl(0.06, 0.06, 0.03, 16), mat(C.pink), 0, 0.8, 0.25), Math.PI / 2, 0, 0));
  g.add(scl(m(sph(0.05, 10, 8), mat("#f3a3a3"), -0.15, 0.84, 0.18), 1, 0.7, 1));
  g.add(scl(m(sph(0.05, 10, 8), mat("#f3a3a3"), 0.15, 0.84, 0.18), 1, 0.7, 1));
  g.add(heart(0.16, 0.38, 1.25, 0.1));
  return g;
}

function heart(s = 0.2, x = 0, y = 0, z = 0) {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.5);
  shape.bezierCurveTo(-0.9, 0.05, -0.55, 0.85, 0, 0.42);
  shape.bezierCurveTo(0.55, 0.85, 0.9, 0.05, 0, -0.5);
  const h = m(geo("heart", () => new THREE.ExtrudeGeometry(shape, { depth: 0.25, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3 })), glow(C.red, 0.3), x, y, z);
  h.scale.setScalar(s);
  return h;
}

function thumb() {
  const g = new THREE.Group();
  const skin = mat(C.skin);
  g.add(m(rbox(0.46, 0.42, 0.36, 0.12), skin, 0, 0.45, 0));
  for (let i = 0; i < 4; i++) g.add(rot(m(cyl(0.06, 0.06, 0.3, 10), skin, -0.02, 0.32 + i * 0.1, 0.17), 0, 0, Math.PI / 2));
  g.add(rot(m(cyl(0.075, 0.08, 0.36, 12), skin, -0.15, 0.78, 0), 0, 0, 0.12));
  g.add(m(sph(0.075, 12, 10), skin, -0.17, 0.96, 0));
  g.add(m(cyl(0.2, 0.22, 0.24, 20), mat(C.blue), 0.05, 0.12, 0));
  return g;
}

function mic() {
  const g = new THREE.Group();
  g.add(m(cyl(0.22, 0.26, 0.05, 24), metal(C.greyDark), 0, 0.025, 0));
  g.add(m(cyl(0.02, 0.02, 0.8, 8), metal(C.silver), 0, 0.42, 0));
  const head = group(
    m(cyl(0.07, 0.05, 0.36, 16), mat(C.dark, { metalness: 0.4, roughness: 0.3 }), 0, 0, 0),
    m(sph(0.13, 20, 16), mat(C.silver, { metalness: 0.7, roughness: 0.55, flatShading: true }), 0, 0.24, 0),
    m(cyl(0.135, 0.135, 0.03, 20), metal(C.gold), 0, 0.17, 0),
  );
  head.position.set(0, 0.95, 0); head.rotation.z = -0.35;
  g.add(head);
  return g;
}

function comb() {
  const g = new THREE.Group();
  const c = group(m(rbox(0.8, 0.12, 0.05, 0.02), mat(C.blue), 0, 0, 0));
  for (let i = 0; i < 14; i++) c.add(m(box(0.025, 0.2, 0.04), mat(C.blue), -0.35 + i * 0.054, -0.15, 0));
  c.position.set(-0.05, 0.5, 0.15); c.rotation.z = 0.35;
  g.add(c);
  g.add(m(cyl(0.11, 0.11, 0.55, 20), metal(C.silver, 0.25), 0.3, 0.3, -0.1));
  g.add(m(cyl(0.08, 0.1, 0.08, 16), mat(C.white), 0.3, 0.62, -0.1));
  g.add(m(cyl(0.115, 0.115, 0.16, 20), mat(C.blue), 0.3, 0.3, -0.1));
  for (const [x, y] of [[0.45, 0.9], [0.2, 1.0], [0.55, 0.75]]) g.add(sparkle(0.07, x, y, 0));
  return g;
}

function sparkle(s, x, y, z) {
  const sp = new THREE.Group();
  sp.add(scl(m(sph(0.5, 8, 6), glow(C.gold, 1.6), 0, 0, 0), 0.25, 1, 0.25));
  sp.add(scl(m(sph(0.5, 8, 6), glow(C.gold, 1.6), 0, 0, 0), 1, 0.25, 0.25));
  sp.scale.setScalar(s * 2); sp.position.set(x, y, z);
  return sp;
}

function starMesh(color = C.gold, depth = 0.18) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.2 : 0.5, a = Math.PI / 2 + (i * Math.PI) / 5;
    i ? shape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.closePath();
  const g = geo(`star${depth}`, () => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 }));
  return m(g, mat(color, { metalness: 0.75, roughness: 0.25, emissive: color, emissiveIntensity: 0.15 }));
}

function star(color = C.gold) {
  const g = new THREE.Group();
  const s = starMesh(color); s.position.set(0, 0.6, -0.09); s.scale.setScalar(1.2); g.add(s);
  g.add(sparkle(0.09, 0.55, 1.1, 0)); g.add(sparkle(0.06, -0.55, 0.3, 0)); g.add(sparkle(0.05, 0.5, 0.2, 0));
  return g;
}

function shakshuka() {
  const g = new THREE.Group();
  g.add(m(cyl(0.55, 0.5, 0.14, 32), mat("#2b2b2b", { metalness: 0.5, roughness: 0.55 }), 0, 0.07, 0));
  g.add(m(cyl(0.5, 0.5, 0.02, 32), mat(C.tomato, { roughness: 0.5 }), 0, 0.135, 0));
  g.add(rot(m(cyl(0.05, 0.05, 0.45, 10), mat("#2b2b2b"), 0.75, 0.12, 0), 0, 0, Math.PI / 2));
  for (const [x, z] of [[-0.2, -0.15], [0.18, -0.1], [0.0, 0.2], [-0.25, 0.22], [0.27, 0.22]]) {
    g.add(scl(m(sph(0.13, 16, 10), mat(C.white), x, 0.15, z), 1, 0.25, 1));
    g.add(scl(m(sph(0.055, 12, 8), mat("#ffb515", { roughness: 0.3 }), x, 0.17, z), 1, 0.6, 1));
  }
  for (let i = 0; i < 10; i++) g.add(m(box(0.04, 0.01, 0.02), mat(C.green), Math.cos(i * 2.3) * 0.38, 0.16, Math.sin(i * 1.7) * 0.36));
  return g;
}

function hummus() {
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(0.25 + Math.sin(t * Math.PI / 2) * 0.32, t * 0.25)); }
  g.add(m(geo("bowl", () => new THREE.LatheGeometry(pts, 32)), mat(C.white, { side: THREE.DoubleSide, roughness: 0.3 }), 0, 0, 0));
  g.add(m(cyl(0.25, 0.25, 0.02, 24), mat(C.white), 0, 0.0, 0));
  g.add(scl(m(sph(0.52, 32, 16), mat("#e9cf98", { roughness: 0.85 }), 0, 0.18, 0), 1, 0.12, 1));
  g.add(rot(m(torus(0.22, 0.04, 8, 32), mat("#d4a51c", { roughness: 0.15, metalness: 0.1 }), 0, 0.245, 0), Math.PI / 2, 0, 0));
  for (let i = 0; i < 6; i++) g.add(m(sph(0.04, 10, 8), mat("#d8b46a"), Math.cos(i) * 0.08, 0.25, Math.sin(i) * 0.08));
  g.add(m(sph(0.02, 6, 4), mat(C.tomato), 0.3, 0.24, 0.1));
  const pita = rot(m(geo("pita", () => new THREE.CylinderGeometry(0.28, 0.28, 0.04, 3)), mat("#e3b871"), 0.5, 0.26, -0.2), 0.5, 0.4, 0.3);
  pita.scale.setScalar(0.55);
  g.add(pita);
  return g;
}

function hora() {
  const g = new THREE.Group();
  g.add(m(cyl(0.75, 0.75, 0.04, 32), mat(C.stone), 0, 0.02, 0));
  const shirts = [C.blue, C.white, C.blue, C.white, C.blue, C.white];
  shirts.forEach((c, i) => {
    const a = (i / shirts.length) * Math.PI * 2;
    const p = scl(person(c, { skin: i % 2 ? C.skin : C.skin2 }), 0.75);
    p.position.set(Math.cos(a) * 0.5, 0.04 + (i % 2) * 0.05, Math.sin(a) * 0.5);
    p.rotation.y = -a + Math.PI / 2;
    g.add(p);
  });
  g.add(rot(m(torus(0.5, 0.025, 6, 48), mat(C.skin), 0, 0.37, 0), Math.PI / 2, 0, 0));
  g.add(flagPole(1.0, 0.36));
  g.children[g.children.length - 1].position.set(0, 0.04, 0);
  return g;
}

function candles() {
  const g = new THREE.Group();
  g.add(m(rbox(0.9, 0.06, 0.4, 0.02), metal(C.silver), 0, 0.03, 0));
  for (const x of [-0.22, 0.22]) {
    g.add(m(cyl(0.1, 0.13, 0.06, 20), metal(C.silver), x, 0.09, 0));
    g.add(m(cyl(0.035, 0.05, 0.3, 12), metal(C.silver), x, 0.27, 0));
    g.add(m(cyl(0.09, 0.05, 0.06, 16), metal(C.silver), x, 0.45, 0));
    g.add(m(cyl(0.05, 0.05, 0.42, 16), mat(C.white), x, 0.69, 0));
    const f = scl(m(sph(0.05, 10, 8), glow("#ffc341", 2.6), x, 0.95, 0), 1, 1.8, 1);
    f.userData.flicker = true;
    g.add(f);
  }
  // challah
  for (let i = 0; i < 4; i++) g.add(scl(m(sph(0.1, 12, 10), mat("#c7832f", { roughness: 0.5 }), -0.15 + i * 0.1, 0.12, 0.3), 1, 0.75, 1.2));
  return g;
}

function walls() {
  const g = new THREE.Group();
  const sun = m(sph(0.26, 24, 16), glow("#ff8a2b", 1.3), 0.38, 1.18, -0.5);
  g.add(sun);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.add(rot(m(box(0.035, 0.14, 0.02), glow("#ffc04a", 1.6), 0.38 + Math.cos(a) * 0.38, 1.18 + Math.sin(a) * 0.38, -0.5), 0, 0, a - Math.PI / 2));
  }
  g.add(m(box(1.3, 0.55, 0.3), mat(C.stone, { flatShading: true }), 0, 0.275, 0));
  for (let i = 0; i < 7; i++) g.add(m(box(0.12, 0.14, 0.32), mat(C.stone), -0.6 + i * 0.2, 0.62, 0));
  g.add(m(box(0.38, 0.95, 0.38), mat(C.stoneDark), -0.42, 0.475, 0.05));
  for (let i = 0; i < 3; i++) g.add(m(box(0.1, 0.12, 0.4), mat(C.stoneDark), -0.55 + i * 0.13, 1.0, 0.05));
  g.add(rot(m(geo("arch", () => new THREE.CylinderGeometry(0.13, 0.13, 0.32, 16, 1, false, 0, Math.PI)), mat("#5a4632"), 0.25, 0.32, 0.01), Math.PI / 2, 0, Math.PI / 2));
  g.add(m(box(0.26, 0.32, 0.32), mat("#5a4632"), 0.25, 0.16, 0.01));
  for (let i = 0; i < 3; i++) g.add(m(box(0.05, 0.1, 0.02), mat("#5a4632"), -0.42, 0.55 + i * 0.12, 0.25));
  return g;
}

function beach() {
  const g = new THREE.Group();
  g.add(m(cyl(0.7, 0.72, 0.08, 28), mat(C.sand), 0, 0.04, 0));
  g.add(m(cyl(0.015, 0.015, 1.0, 8), mat(C.white), -0.15, 0.55, -0.1));
  const umb = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const seg = m(geo("umbseg", () => new THREE.ConeGeometry(0.55, 0.22, 4, 1, true, 0, Math.PI / 4)), mat(i % 2 ? C.white : C.blue, { side: THREE.DoubleSide }), 0, 0, 0);
    seg.rotation.y = (i * Math.PI) / 4;
    umb.add(seg);
  }
  umb.position.set(-0.15, 1.05, -0.1); umb.rotation.z = 0.15;
  g.add(umb);
  // matkot paddles + ball
  for (const [x, rz] of [[0.32, 0.5], [0.5, -0.3]]) {
    const pad = group(
      rot(m(cyl(0.14, 0.14, 0.03, 20), mat(C.wood), 0, 0.22, 0), Math.PI / 2, 0, 0),
      m(cyl(0.025, 0.025, 0.16, 8), mat(C.dark), 0, 0.06, 0),
    );
    pad.position.set(x, 0.08, 0.3); pad.rotation.z = rz;
    g.add(pad);
  }
  g.add(m(sph(0.04, 10, 8), mat("#f3df3a"), 0.4, 0.62, 0.3));
  g.add(m(rbox(0.38, 0.03, 0.62, 0.01), mat(C.red), 0.15, 0.1, -0.2));
  return g;
}

function bulb() {
  const g = new THREE.Group();
  g.add(m(sph(0.38, 32, 24), mat("#fff6c2", { emissive: "#ffd54a", emissiveIntensity: 1.1, roughness: 0.1, transparent: true, opacity: 0.95 }), 0, 0.82, 0));
  g.add(m(cyl(0.18, 0.2, 0.18, 20), mat("#fff6c2", { emissive: "#ffd54a", emissiveIntensity: 0.9 }), 0, 0.5, 0));
  for (let i = 0; i < 4; i++) g.add(m(cyl(0.19 - i * 0.012, 0.19 - i * 0.012, 0.045, 20), metal(C.silver), 0, 0.36 - i * 0.055, 0));
  g.add(m(cyl(0.06, 0.08, 0.05, 12), mat(C.dark), 0, 0.12, 0));
  g.add(rot(m(torus(0.08, 0.015, 6, 16, Math.PI * 1.6), glow("#ff9d00", 2), 0, 0.82, 0), 0, 0, 0));
  for (const [x, y] of [[0.55, 1.1], [-0.5, 1.0], [0.5, 0.55]]) g.add(sparkle(0.07, x, y, 0));
  return g;
}

function cactus() {
  const g = new THREE.Group();
  g.add(m(cyl(0.3, 0.24, 0.32, 16), mat(C.orange, { roughness: 0.8 }), 0, 0.16, 0));
  g.add(m(cyl(0.3, 0.3, 0.03, 16), mat("#6b4a2e"), 0, 0.31, 0));
  const pad = (x, y, z, s, r) => rot(scl(m(sph(0.25, 16, 12), mat(C.greenLight, { roughness: 0.7 }), x, y, z), s * 0.85, s * 1.1, s * 0.28), 0, 0, r);
  g.add(pad(0, 0.6, 0, 1, 0));
  g.add(pad(-0.2, 0.92, 0, 0.75, 0.5));
  g.add(pad(0.2, 0.95, 0, 0.8, -0.4));
  g.add(pad(0.0, 1.2, 0, 0.6, 0.1));
  for (const [x, y] of [[-0.3, 1.15], [0.3, 1.2], [0.02, 1.38]]) g.add(scl(m(sph(0.06, 10, 8), mat(C.pink), x, y, 0), 1, 1.3, 1));
  for (let i = 0; i < 14; i++) g.add(m(box(0.008, 0.04, 0.008), mat(C.paper), Math.cos(i * 2.1) * 0.18, 0.5 + (i % 7) * 0.12, 0.07));
  return g;
}

function newspaper() {
  const g = new THREE.Group();
  const tex = canvasTex("paper", 256, 320, (ctx, w, h) => {
    ctx.fillStyle = "#fbfaf4"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#111"; ctx.font = "900 34px Georgia, serif"; ctx.textAlign = "center"; ctx.fillText("THE DAILY POLL", w / 2, 44);
    ctx.fillRect(16, 56, w - 32, 4);
    ctx.fillStyle = C.red; ctx.font = "900 30px Arial Black, sans-serif"; ctx.fillText("BREAKING!", w / 2, 98);
    ctx.fillStyle = C.blue; ctx.fillRect(18, 116, 108, 80);
    ctx.fillStyle = "#999";
    for (let i = 0; i < 9; i++) ctx.fillRect(i < 4 ? 136 : 18, 120 + i * 20, i < 4 ? w - 154 : w - 36, 8);
  });
  g.add(rot(m(box(0.72, 0.03, 0.92), mat(C.paper), 0, 0.05, 0), 0, 0.2, 0));
  const top = panel(tex, 0.7, 0.88); top.rotation.set(-Math.PI / 2, 0, 0.2); top.position.y = 0.07; g.add(top);
  const g2 = new THREE.Group(); g2.add(g); g2.rotation.x = 0.9; g2.position.y = 0.45;
  return group(g2);
}

function tv() {
  const g = new THREE.Group();
  g.add(m(rbox(0.95, 0.7, 0.5, 0.08), mat(C.wood), 0, 0.55, 0));
  const scr = panel(canvasTex("tvscreen", 256, 192, (ctx, w, h) => {
    ctx.fillStyle = "#123b9b"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#d64541"; ctx.fillRect(0, h - 48, w, 48);
    ctx.fillStyle = "#fff"; ctx.font = "900 26px Arial Black, sans-serif"; ctx.fillText("LIVE  24/7", 14, h - 16);
    ctx.fillStyle = "#e8b38c"; ctx.beginPath(); ctx.arc(w / 2, 70, 30, 0, 7); ctx.fill();
    ctx.fillStyle = "#222"; ctx.fillRect(w / 2 - 50, 98, 100, 50);
  }), 0.62, 0.48, true);
  scr.material.emissiveIntensity = 0.7;
  scr.position.set(-0.1, 0.56, 0.255); g.add(scr);
  for (const y of [0.7, 0.52]) g.add(rot(m(cyl(0.045, 0.045, 0.04, 14), metal(C.gold), 0.34, y, 0.26), Math.PI / 2, 0, 0));
  g.add(rot(m(cyl(0.012, 0.012, 0.5, 6), metal(C.silver), -0.12, 1.1, 0), 0, 0, 0.5));
  g.add(rot(m(cyl(0.012, 0.012, 0.5, 6), metal(C.silver), 0.12, 1.1, 0), 0, 0, -0.5));
  for (const x of [-0.35, 0.35]) g.add(m(cyl(0.025, 0.02, 0.2, 6), mat(C.dark), x, 0.1, 0));
  return g;
}

function ballotBox() {
  const g = new THREE.Group();
  g.add(m(rbox(0.8, 0.75, 0.6, 0.05), mat(C.blue), 0, 0.375, 0));
  g.add(m(box(0.82, 0.05, 0.62), mat("#002a8c"), 0, 0.76, 0));
  g.add(m(box(0.4, 0.06, 0.06), mat(C.dark), 0, 0.79, 0));
  const front = panel(canvasTex("ballotfront", 256, 240, (ctx, w, h) => {
    ctx.fillStyle = "#0038b8"; ctx.fillRect(0, 0, w, h);
    drawStarOfDavid(ctx, w / 2, h / 2 - 10, 70, 12, "#ffffff");
    ctx.fillStyle = "#fff"; ctx.font = "900 34px Rubik, Arial Black, sans-serif"; ctx.textAlign = "center"; ctx.fillText("VOTE", w / 2, h - 20);
  }), 0.74, 0.69);
  front.position.set(0, 0.375, 0.305); g.add(front);
  const slip = group(m(box(0.34, 0.42, 0.01), mat(C.paper), 0, 0, 0));
  slip.add(rot(m(box(0.2, 0.035, 0.012), mat(C.blue), 0, 0.06, 0.004), 0, 0, 0.78));
  slip.add(rot(m(box(0.2, 0.035, 0.012), mat(C.blue), 0, 0.06, 0.004), 0, 0, -0.78));
  slip.position.set(0, 0.95, 0); slip.rotation.y = 0.1;
  g.add(slip);
  return g;
}

function medal(color = C.gold) {
  const g = new THREE.Group();
  for (const [x, c, r] of [[-0.12, C.blue, 0.35], [0.12, C.white, -0.35]]) {
    g.add(rot(m(box(0.2, 0.6, 0.03), mat(c), x, 1.0, -0.05), 0, 0, r));
  }
  g.add(rot(m(cyl(0.38, 0.38, 0.08, 40), metal(color, 0.28), 0, 0.5, 0), Math.PI / 2, 0, 0));
  g.add(rot(m(torus(0.38, 0.035, 10, 48), metal(color, 0.2), 0, 0.5, 0), 0, 0, 0));
  g.add(rot(m(cyl(0.3, 0.3, 0.09, 40), metal(color, 0.45), 0, 0.5, 0.005), Math.PI / 2, 0, 0));
  return g;
}

function briefcase() {
  const g = new THREE.Group();
  g.add(m(rbox(0.95, 0.68, 0.3, 0.06), mat("#5a3a22", { roughness: 0.45 }), 0, 0.4, 0));
  g.add(m(box(0.96, 0.04, 0.31), mat("#3f2816"), 0, 0.55, 0));
  g.add(m(torus(0.13, 0.03, 8, 20, Math.PI), mat("#3f2816"), 0, 0.74, 0));
  for (const x of [-0.25, 0.25]) g.add(m(box(0.1, 0.08, 0.04), metal(C.gold), x, 0.55, 0.16));
  g.add(m(box(0.24, 0.16, 0.02), mat(C.blue), 0, 0.3, 0.155));
  return g;
}

function megaphone() {
  const g = new THREE.Group();
  const horn = m(geo("horn", () => new THREE.CylinderGeometry(0.34, 0.1, 0.7, 28, 1, true)), mat(C.white, { side: THREE.DoubleSide }), 0, 0, 0);
  const body = group(horn,
    m(cyl(0.345, 0.345, 0.06, 28), mat(C.blue), 0, 0.33, 0),
    m(cyl(0.11, 0.11, 0.25, 16), mat(C.blue), 0, -0.45, 0),
    m(box(0.08, 0.28, 0.12), mat(C.dark), 0, -0.25, 0.16),
  );
  body.rotation.z = -Math.PI / 2 + 0.25; body.position.set(0, 0.62, 0);
  g.add(body);
  for (let i = 1; i <= 3; i++) {
    g.add(rot(m(torus(0.12 + i * 0.1, 0.018, 6, 24, Math.PI * 0.55), glow(C.gold, 1), 0.48, 0.74, 0), 0, 0, -Math.PI * 0.27));
  }
  return g;
}

function fireworks() {
  const g = new THREE.Group();
  const colors = [C.blue, C.gold, C.pink, "#55d6ff"];
  [[-0.3, 1.0], [0.25, 1.2], [0.05, 0.75]].forEach(([x, y], k) => {
    const c = colors[k % colors.length];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = 0.2 + (k % 2) * 0.05;
      g.add(m(sph(0.035, 8, 6), glow(c, 1.8), x + Math.cos(a) * r, y + Math.sin(a) * r, 0));
      g.add(rot(m(cyl(0.008, 0.008, r * 0.8, 4), glow(c, 1.2), x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, 0), 0, 0, a - Math.PI / 2));
    }
  });
  g.add(m(cyl(0.05, 0.05, 0.35, 10), mat(C.red), -0.1, 0.18, 0));
  g.add(m(cone(0.06, 0.1, 10), mat(C.gold), -0.1, 0.4, 0));
  return g;
}

function scroll() {
  const g = new THREE.Group();
  const tex = canvasTex("decree", 256, 300, (ctx, w, h) => {
    ctx.fillStyle = "#f7edd0"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#5a4632"; ctx.font = "900 28px Georgia, serif"; ctx.textAlign = "center"; ctx.fillText("CABINET", w / 2, 46);
    ctx.fillRect(40, 60, w - 80, 3);
    ctx.fillStyle = "#a3906a";
    for (let i = 0; i < 7; i++) ctx.fillRect(34, 86 + i * 24, w - 68 - (i % 3) * 30, 8);
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(w - 60, h - 50, 26, 0, 7); ctx.fill();
  });
  const sheet = panel(tex, 0.62, 0.74); sheet.position.set(0, 0.6, 0.02); g.add(sheet);
  g.add(m(box(0.62, 0.74, 0.01), mat("#f7edd0"), 0, 0.6, 0.012));
  for (const y of [0.98, 0.22]) g.add(rot(m(cyl(0.06, 0.06, 0.72, 16), mat("#d9c28e"), 0, y, 0.04), 0, 0, Math.PI / 2));
  return g;
}

function chair() {
  // Knesset seat
  const g = new THREE.Group();
  g.add(m(rbox(0.6, 0.16, 0.55, 0.05), mat(C.blue), 0, 0.42, 0));
  g.add(m(rbox(0.6, 0.6, 0.14, 0.05), mat(C.blue), 0, 0.75, -0.22));
  for (const x of [-0.32, 0.32]) g.add(m(rbox(0.08, 0.1, 0.5, 0.03), mat(C.wood), x, 0.56, 0));
  g.add(m(cyl(0.06, 0.06, 0.34, 10), metal(C.silver), 0, 0.17, 0));
  g.add(m(cyl(0.28, 0.28, 0.04, 20), metal(C.silver), 0, 0.02, 0));
  return g;
}

function clock() {
  const g = new THREE.Group();
  g.add(rot(m(cyl(0.5, 0.5, 0.14, 40), mat(C.blue), 0, 0.6, 0), Math.PI / 2, 0, 0));
  g.add(rot(m(cyl(0.43, 0.43, 0.15, 40), mat(C.white), 0, 0.6, 0.005), Math.PI / 2, 0, 0));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.add(rot(m(box(0.03, 0.07, 0.02), mat(C.dark), Math.cos(a) * 0.36, 0.6 + Math.sin(a) * 0.36, 0.085), 0, 0, a + Math.PI / 2));
  }
  g.add(rot(m(box(0.035, 0.22, 0.02), mat(C.dark), 0.06, 0.68, 0.09), 0, 0, -0.6));
  g.add(rot(m(box(0.025, 0.3, 0.02), mat(C.red), -0.08, 0.72, 0.095), 0, 0, 0.5));
  g.add(m(sph(0.03, 8, 6), metal(C.gold), 0, 0.6, 0.1));
  g.add(m(box(0.08, 0.1, 0.08), metal(C.gold), 0, 1.13, 0));
  return g;
}

function crown() {
  const g = new THREE.Group();
  g.add(m(cyl(0.42, 0.42, 0.24, 32, 1, true), metal(C.gold, 0.25), 0, 0.3, 0));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(m(cone(0.09, 0.28, 8), metal(C.gold, 0.25), Math.cos(a) * 0.4, 0.56, Math.sin(a) * 0.4));
    g.add(m(sph(0.045, 10, 8), mat(i % 2 ? C.blue : C.white, { roughness: 0.15 }), Math.cos(a) * 0.4, 0.72, Math.sin(a) * 0.4));
  }
  g.add(rot(m(torus(0.42, 0.04, 8, 40), metal(C.gold), 0, 0.2, 0), Math.PI / 2, 0, 0));
  return g;
}

function handshake() {
  const g = new THREE.Group();
  const arm = (color, x, rz) => group(m(cyl(0.12, 0.12, 0.55, 16), mat(color), 0, 0, 0), m(cyl(0.125, 0.125, 0.06, 16), mat(C.white), 0, 0.27, 0));
  const a1 = arm(C.blue, 0, 0); a1.position.set(-0.4, 0.5, 0); a1.rotation.z = -1.2; g.add(a1);
  const a2 = arm(C.greyDark, 0, 0); a2.position.set(0.4, 0.5, 0); a2.rotation.z = 1.2; g.add(a2);
  g.add(scl(m(sph(0.2, 20, 16), mat(C.skin), 0, 0.62, 0), 1.25, 0.9, 0.95));
  for (let i = 0; i < 4; i++) g.add(rot(m(cyl(0.045, 0.045, 0.2, 8), mat(C.skin2), -0.05 + i * 0.0, 0.66 - i * 0.07, 0.17), 0, 0, Math.PI / 2));
  g.add(sparkle(0.08, 0.35, 1.0, 0)); g.add(sparkle(0.06, -0.35, 0.95, 0));
  return g;
}

export const MODELS = {
  volunteer, falafel, branch: office, radio, billboard, warroom, coalition, startup: rocket,
  committee: parliament, summit: globe, spa: deadSea, satellite, quantum, portal,
  hand, handshake, baby, thumb, mic, comb, star, starSilver: () => star(C.silver), starBlue: () => star(C.blueMid),
  starRuby: () => star(C.red), starPurple: () => star(C.purple),
  shakshuka, hummus, hora, candles, walls, beach, bulb, cactus, newspaper, tv, ballot: ballotBox,
  medal, medalSilver: () => medal(C.silver), medalBronze: () => medal("#c77b3b"),
  briefcase, megaphone, fireworks, scroll, chair, clock, crown, heart: () => heart(1, 0, 0.5, 0), person: () => person(),
};

export function makeModel(name) {
  const f = MODELS[name];
  if (!f) throw new Error(`Unknown model ${name}`);
  const g = f();
  g.userData.model = name;
  return g;
}

// Per-frame animation for anything flagged in userData
export function animateModel(root, t, dt) {
  root.traverse((o) => {
    const u = o.userData;
    if (u.blink) o.material = (Math.sin(t * 4 + o.id) > 0) ? glow(C.red, 2.4) : mat("#5a1a1a");
    if (u.spin) o.rotation.y += u.spin * dt;
    if (u.spinZ) o.rotation.z += u.spinZ * dt;
    if (u.bob !== undefined) o.position.y += Math.sin(t * 2 + u.bob) * 0.0015;
    if (u.flicker) o.scale.y = (o.userData.baseSY ??= o.scale.y) * (0.85 + Math.sin(t * 23 + o.id) * 0.1 + Math.sin(t * 13) * 0.05);
    if (u.pulse) o.scale.setScalar(1 + Math.sin(t * 3) * 0.2);
    if (u.wave && o.geometry) {
      const pos = o.geometry.attributes.position;
      if (!u.base) u.base = Float32Array.from(pos.array);
      for (let i = 0; i < pos.count; i++) {
        const x = u.base[i * 3];
        pos.array[i * 3 + 2] = Math.sin(x * 14 - t * 5) * 0.025 * (x + 0.2);
      }
      pos.needsUpdate = true;
    }
  });
}

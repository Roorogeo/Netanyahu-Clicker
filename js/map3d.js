// The 3D campaign map: a floating island where every building you own appears.
import * as THREE from "three";
import { OrbitControls } from "../vendor/three/addons/OrbitControls.js";
import { RoomEnvironment } from "../vendor/three/addons/RoomEnvironment.js";
import { makeModel, animateModel, mat, drawThemeFlag, setFlagTheme, PRIDE_COLORS, C } from "./models.js";

const TAU = Math.PI * 2;

// Deterministic pseudo-random so the layout is the same every visit
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function skyTexture(colors = ["#5f8ff0", "#bcd2ff", "#f4f7ff"]) {
  const [top, mid, bottom] = colors;
  const c = document.createElement("canvas");
  c.width = 4; c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, top); g.addColorStop(0.55, mid); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function oliveTree(r) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.6, 7), mat("#7a5a3a", { flatShading: true }));
  trunk.position.y = 0.3; trunk.rotation.z = (r() - 0.5) * 0.3;
  g.add(trunk);
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28 + r() * 0.12, 0), mat(i % 2 ? "#7f9a4d" : "#8fa85a", { flatShading: true }));
    f.position.set((r() - 0.5) * 0.35, 0.68 + r() * 0.2, (r() - 0.5) * 0.35);
    g.add(f);
  }
  g.traverse((o) => { o.castShadow = true; });
  return g;
}

function palmTree(r) {
  const g = new THREE.Group();
  const lean = (r() - 0.5) * 0.4;
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.22, 7), mat(i % 2 ? "#a07a4f" : "#8d6a43", { flatShading: true }));
    s.position.set(lean * i * 0.12, 0.11 + i * 0.2, 0);
    s.rotation.z = -lean * 0.4;
    g.add(s);
  }
  const top = new THREE.Vector3(lean * 0.72, 1.25, 0);
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.75, 4), mat("#4f8a3a", { flatShading: true }));
    const a = (i / 7) * TAU;
    leaf.position.copy(top).add(new THREE.Vector3(Math.cos(a) * 0.3, -0.06, Math.sin(a) * 0.3));
    leaf.rotation.set(Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25);
    g.add(leaf);
  }
  g.traverse((o) => { o.castShadow = true; });
  return g;
}

function cloud(r) {
  const g = new THREE.Group();
  const m = mat("#ffffff", { roughness: 1, flatShading: true });
  const n = 4 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6 + r() * 0.6, 1), m);
    s.position.set(i * 0.8 - n * 0.4, r() * 0.4, (r() - 0.5) * 0.6);
    g.add(s);
  }
  return g;
}

export function createMap(canvas, { buildings, onHover }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = skyTexture();
  // Reflections for the map's own metal (gold HQ, pedestals, crown). Applied per material,
  // never to the shared model materials, which other WebGL contexts also use.
  const envTex = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const withEnv = (m, k = 1) => { m.envMap = envTex; m.envMapIntensity = k; m.needsUpdate = true; return m; };
  scene.fog = new THREE.Fog("#cfdcff", 30, 70);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  camera.position.set(17, 13, 17);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.6, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.minDistance = 8;
  controls.maxDistance = 34;
  controls.maxPolarAngle = 1.32;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.35;

  const hemi = new THREE.HemisphereLight("#e4edff", "#b59d70", 1.05);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#fff4e0", 2.3);
  sun.position.set(10, 18, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 50 });
  sun.shadow.bias = -0.0008;
  scene.add(sun);

  // ---- island ----
  const R = 11;
  const island = new THREE.Group();
  const topMat = new THREE.MeshStandardMaterial({ color: "#9cc46a", roughness: 0.95 });
  const ringMat = new THREE.MeshStandardMaterial({ color: C.sand, roughness: 1 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.5, 72), topMat);
  top.position.y = -0.25; top.receiveShadow = true;
  island.add(top);
  const beachRing = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.45, R + 0.3, 0.42, 72), ringMat);
  beachRing.position.y = -0.33; beachRing.receiveShadow = true;
  island.add(beachRing);
  const rock = new THREE.Mesh(new THREE.ConeGeometry(R + 0.3, 7, 14, 3), mat("#8d7a63", { flatShading: true, roughness: 1 }));
  rock.rotation.x = Math.PI; rock.position.y = -4.05;
  island.add(rock);
  const strata = new THREE.Mesh(new THREE.ConeGeometry(R - 1.5, 4, 12, 1), mat("#6f604f", { flatShading: true }));
  strata.rotation.x = Math.PI; strata.position.y = -6.4;
  island.add(strata);
  // plaza + ring road
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, 0.06, 64), mat(C.stone, { roughness: 0.9 }));
  plaza.position.y = 0.03; plaza.receiveShadow = true;
  island.add(plaza);
  const road = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.75, 72), mat("#d9cba8", { roughness: 1, side: THREE.DoubleSide }));
  road.rotation.x = -Math.PI / 2; road.position.y = 0.02; road.receiveShadow = true;
  island.add(road);
  scene.add(island);

  // central flagpole with a big waving flag
  const flagC = document.createElement("canvas");
  flagC.width = 512; flagC.height = 372;
  drawThemeFlag(flagC.getContext("2d"), 512, 372);
  const flagTex = new THREE.CanvasTexture(flagC); flagTex.colorSpace = THREE.SRGBColorSpace;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 5.5, 12), withEnv(new THREE.MeshStandardMaterial({ color: C.silver, metalness: 0.8, roughness: 0.3 })));
  pole.position.set(0, 2.75, 0); pole.castShadow = true;
  scene.add(pole);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), withEnv(new THREE.MeshStandardMaterial({ color: C.gold, metalness: 0.9, roughness: 0.25 })));
  knob.position.set(0, 5.55, 0);
  scene.add(knob);
  const FW = 2.4, FH = FW * 0.727;
  const bigFlagGeo = new THREE.PlaneGeometry(FW, FH, 30, 14);
  const bigFlagBase = Float32Array.from(bigFlagGeo.attributes.position.array);
  const bigFlag = new THREE.Mesh(bigFlagGeo, new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.8 }));
  bigFlag.position.set(FW / 2 + 0.06, 5.5 - FH / 2 - 0.05, 0);
  bigFlag.castShadow = true;
  scene.add(bigFlag);
  const hq = makeModel("ballot");
  hq.scale.setScalar(1.3);
  hq.position.set(0.9, 0.05, 0.9);
  hq.rotation.y = Math.PI / 4;
  scene.add(hq);

  // decorations on the outer rim
  const r = rng(7);
  for (let i = 0; i < 26; i++) {
    const a = r() * TAU, rad = R - 0.6 - r() * 0.5;
    const tree = (i % 3 === 0 ? palmTree : oliveTree)(r);
    tree.position.set(Math.cos(a) * rad, 0, Math.sin(a) * rad);
    tree.scale.setScalar(0.8 + r() * 0.5);
    scene.add(tree);
  }
  const clouds = [];
  for (let i = 0; i < 9; i++) {
    const cl = cloud(r);
    const a = (i / 9) * TAU, rad = 17 + r() * 6;
    cl.userData = { a, rad, y: -3 + r() * 9, speed: 0.02 + r() * 0.03 };
    cl.scale.setScalar(0.9 + r() * 0.9);
    scene.add(cl);
    clouds.push(cl);
  }

  // ---- theme extras: stars + moon (dark), rainbow (pride) ----
  const starGeo = new THREE.BufferGeometry();
  const starPos = [];
  const rs = rng(99);
  for (let i = 0; i < 900; i++) {
    const u = rs() * TAU, v = Math.acos(rs() * 1.6 - 0.6), d = 80;
    starPos.push(Math.sin(v) * Math.cos(u) * d, Math.cos(v) * d, Math.sin(v) * Math.sin(u) * d);
  }
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: "#ffffff", size: 0.35, sizeAttenuation: true, fog: false }));
  scene.add(stars);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(2.2, 32, 24), new THREE.MeshBasicMaterial({ color: "#fff6d8", fog: false }));
  moon.position.set(-30, 26, -40);
  scene.add(moon);
  const rainbow = new THREE.Group();
  PRIDE_COLORS.forEach((col, i) => {
    const band = new THREE.Mesh(new THREE.TorusGeometry(15 - i * 0.55, 0.28, 8, 96, Math.PI),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.82, fog: false }));
    rainbow.add(band);
  });
  rainbow.position.set(0, -1.5, -6);
  scene.add(rainbow);
  const lamps = []; // warm glow around the plaza at night
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + Math.PI / 4;
    const l = new THREE.PointLight("#ffcf7a", 0, 9, 1.6);
    l.position.set(Math.cos(a) * 3.3, 1.4, Math.sin(a) * 3.3);
    scene.add(l);
    lamps.push(l);
  }
  // sea far below the island
  const sea = new THREE.Mesh(new THREE.CircleGeometry(95, 64), new THREE.MeshStandardMaterial({ color: "#1fb6d6", roughness: 0.2, metalness: 0.15 }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -9;
  scene.add(sea);
  // desert floor with dunes
  const dunes = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.CircleGeometry(95, 48), mat("#e2b77a", { roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -9;
  dunes.add(floor);
  const rd = rng(31);
  for (let i = 0; i < 20; i++) {
    const mound = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10), mat("#e9c086", { roughness: 1, flatShading: true }));
    const a = rd() * TAU, rad = 22 + rd() * 26;
    mound.scale.set(5 + rd() * 7, 1.5 + rd() * 3, 3 + rd() * 5);
    mound.position.set(Math.cos(a) * rad, -9, Math.sin(a) * rad);
    mound.rotation.y = rd() * TAU;
    dunes.add(mound);
  }
  scene.add(dunes);
  // old-city walls around the rim
  const walls = new THREE.Group();
  const wallMat = mat(C.stone, { flatShading: true });
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * TAU;
    if (i % 11 === 0) {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 1.2, 8), wallMat);
      tower.position.set(Math.cos(a) * (R + 0.1), 0.6, Math.sin(a) * (R + 0.1));
      walls.add(tower);
      continue;
    }
    const seg = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 0.28), wallMat);
    seg.position.set(Math.cos(a) * (R + 0.15), 0.27, Math.sin(a) * (R + 0.15));
    seg.rotation.y = -a + Math.PI / 2;
    walls.add(seg);
    for (const off of [-0.45, 0, 0.45]) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.28), wallMat);
      c.position.set(off, 0.36, 0);
      seg.add(c);
    }
  }
  walls.traverse((o) => { o.castShadow = true; });
  scene.add(walls);
  // wildflowers (red anemones)
  const FLOWERS = 520;
  const flowers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 6, 5), new THREE.MeshStandardMaterial({ roughness: 0.6 }), FLOWERS);
  const rf = rng(17), fm = new THREE.Matrix4(), fc = new THREE.Color();
  const FLOWER_COLORS = ["#e11d48", "#e11d48", "#e11d48", "#f43f5e", "#fde047", "#ffffff", "#c084fc"];
  for (let i = 0; i < FLOWERS; i++) {
    const a = rf() * TAU, rad = 3.9 + rf() * (R - 4.3);
    fm.makeTranslation(Math.cos(a) * rad, 0.05, Math.sin(a) * rad);
    flowers.setMatrixAt(i, fm);
    flowers.setColorAt(i, fc.set(FLOWER_COLORS[Math.floor(rf() * FLOWER_COLORS.length)]));
  }
  scene.add(flowers);
  // neon grid floor
  const grid = new THREE.GridHelper(240, 80, "#ff4fd8", "#7c3aed");
  grid.position.y = -9;
  scene.add(grid);
  // falling snow
  const SNOW = 1400;
  const snowPos = new Float32Array(SNOW * 3);
  const rsn = rng(5);
  for (let i = 0; i < SNOW; i++) {
    snowPos[i * 3] = (rsn() - 0.5) * 46; snowPos[i * 3 + 1] = -6 + rsn() * 24; snowPos[i * 3 + 2] = (rsn() - 0.5) * 46;
  }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPos, 3));
  const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: "#ffffff", size: 0.16, transparent: true, opacity: 0.95 }));
  scene.add(snow);
  // hanukkiah (nine-branched menorah) in the plaza
  const menorah = new THREE.Group();
  const gm = withEnv(new THREE.MeshStandardMaterial({ color: C.gold, metalness: 0.85, roughness: 0.25 }));
  const menorahFlames = [];
  const menorahBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.12, 20), gm);
  menorahBase.position.y = 0.06;
  menorah.add(menorahBase);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.25, 10), gm);
  stem.position.y = 0.7; menorah.add(stem);
  const cup = (x, y) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.08, 10), gm);
    c.position.set(x, y, 0); menorah.add(c);
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshStandardMaterial({ color: "#ffc341", emissive: "#ffb000", emissiveIntensity: 2.6 }));
    f.scale.set(1, 1.8, 1); f.position.set(x, y + 0.1, 0); f.userData.flicker = true;
    menorah.add(f); menorahFlames.push(f);
  };
  for (let k = 1; k <= 4; k++) {
    const arm = new THREE.Mesh(new THREE.TorusGeometry(0.16 * k, 0.025, 6, 24, Math.PI), gm);
    arm.rotation.z = Math.PI; arm.position.y = 0.95;
    menorah.add(arm);
    cup(-0.16 * k, 0.95); cup(0.16 * k, 0.95);
  }
  cup(0, 1.35); // the shamash
  const menorahLight = new THREE.PointLight("#ffc15a", 0, 7, 1.5);
  menorahLight.position.set(0, 1.6, 0.3);
  menorah.add(menorahLight);
  menorah.position.set(-1.25, 0.05, 1.15);
  menorah.rotation.y = Math.PI / 4;
  menorah.traverse((o) => { o.castShadow = true; });
  scene.add(menorah);
  // searchlight beams
  const beams = new THREE.Group();
  const beamMat = new THREE.MeshBasicMaterial({ color: "#fff3c4", transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  for (let i = 0; i < 4; i++) {
    const pivot = new THREE.Group();
    const a = (i / 4) * TAU + 0.4;
    pivot.position.set(Math.cos(a) * 9.6, 0.1, Math.sin(a) * 9.6);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.6, 24, 24, 1, true), beamMat);
    cone.rotation.x = Math.PI; cone.position.y = 12;
    pivot.add(cone);
    pivot.userData.phase = i * 1.7;
    beams.add(pivot);
  }
  scene.add(beams);
  // fireworks
  const BURSTS = 7, SPARKS = 90;
  const bursts = [];
  for (let b = 0; b < BURSTS; b++) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SPARKS * 3), 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.32, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    pts.frustumCulled = false;
    scene.add(pts);
    bursts.push({ pts, vel: new Float32Array(SPARKS * 3), life: 0 });
  }
  let fireworkColors = ["#ffd400", "#ffffff", "#0038b8", "#ff4fd8"];
  let themeFireworks = false, rallyFireworks = false, rallyOn = false, nextBurst = 0;
  function spawnBurst() {
    const b = bursts.find((x) => x.life <= 0);
    if (!b) return;
    const a = Math.random() * TAU, rad = Math.random() * 9;
    const cx = Math.cos(a) * rad, cy = 9 + Math.random() * 6, cz = Math.sin(a) * rad;
    const p = b.pts.geometry.attributes.position.array;
    for (let i = 0; i < SPARKS; i++) {
      const u = Math.random() * TAU, v = Math.acos(Math.random() * 2 - 1), sp = 3.5 + Math.random() * 2.5;
      p[i * 3] = cx; p[i * 3 + 1] = cy; p[i * 3 + 2] = cz;
      b.vel[i * 3] = Math.sin(v) * Math.cos(u) * sp; b.vel[i * 3 + 1] = Math.cos(v) * sp; b.vel[i * 3 + 2] = Math.sin(v) * Math.sin(u) * sp;
    }
    b.pts.geometry.attributes.position.needsUpdate = true;
    b.pts.material.color.set(fireworkColors[Math.floor(Math.random() * fireworkColors.length)]);
    b.life = 1.7;
  }
  function updateFireworks(dt, now) {
    if ((themeFireworks || (rallyOn && rallyFireworks)) && now > nextBurst) {
      spawnBurst();
      nextBurst = now + (rallyOn ? 350 : 900) + Math.random() * 600;
    }
    for (const b of bursts) {
      if (b.life <= 0) continue;
      b.life -= dt;
      const p = b.pts.geometry.attributes.position.array;
      for (let i = 0; i < SPARKS; i++) {
        b.vel[i * 3 + 1] -= 3 * dt;
        p[i * 3] += b.vel[i * 3] * dt; p[i * 3 + 1] += b.vel[i * 3 + 1] * dt; p[i * 3 + 2] += b.vel[i * 3 + 2] * dt;
        b.vel[i * 3] *= 0.985; b.vel[i * 3 + 2] *= 0.985;
      }
      b.pts.geometry.attributes.position.needsUpdate = true;
      b.pts.material.opacity = Math.max(0, b.life / 1.7);
    }
  }

  // th: a theme object from themes.js
  let extraSet = new Set();
  function setTheme(th) {
    if (!th) return;
    const L = th.map;
    if (scene.background) scene.background.dispose();
    scene.background = skyTexture(L.sky);
    scene.fog.color.set(L.fog);
    hemi.intensity = L.hemi;
    sun.intensity = L.sun;
    sun.color.set(L.sunC);
    renderer.toneMappingExposure = L.exp;
    topMat.color.set(L.grass);
    ringMat.color.set(L.sand);
    extraSet = new Set(L.extras);
    const on = (k) => extraSet.has(k);
    stars.visible = on("stars"); moon.visible = on("moon"); rainbow.visible = on("rainbow");
    sea.visible = on("sea"); dunes.visible = on("dunes"); walls.visible = on("walls"); flowers.visible = on("flowers");
    grid.visible = on("grid"); snow.visible = on("snow"); menorah.visible = on("menorah"); beams.visible = on("spotlights");
    lamps.forEach((l) => { l.intensity = on("lamps") ? 6 : 0; });
    menorahLight.intensity = on("menorah") ? 9 : 0;
    themeFireworks = on("fireworks");
    fireworkColors = th.confetti || fireworkColors;
    drawThemeFlag(flagC.getContext("2d"), 512, 372, th.flag);
    flagTex.needsUpdate = true;
    setFlagTheme(th.flag);
  }

  // ---- districts ----
  const ground = buildings.filter((b) => !b.map.orbit);
  const sector = TAU / ground.length;
  const R0 = 4.05, R1 = R - 1.25;
  const slots = {};
  ground.forEach((b, i) => {
    const a0 = i * sector + 0.04, a1 = (i + 1) * sector - 0.04, mid = (a0 + a1) / 2;
    const sp = b.map.spacing;
    const list = [];
    for (let rad = R0 + sp / 2; rad <= R1 - sp / 2 + 1e-6; rad += sp) {
      const step = sp / rad;
      const n = Math.max(1, Math.floor((a1 - a0) / step));
      const start = mid - ((n - 1) * step) / 2;
      for (let k = 0; k < n; k++) list.push({ rad, a: start + k * step });
    }
    list.sort((p, q) => p.rad - q.rad || Math.abs(p.a - mid) - Math.abs(q.a - mid));
    slots[b.id] = list.slice(0, b.map.cap);
  });
  const capFor = (b) => (b.map.orbit ? b.map.cap : slots[b.id].length);

  // district signposts
  ground.forEach((b, i) => {
    const a = (i + 0.5) * sector;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 6), mat(C.woodLight));
    post.position.set(Math.cos(a) * 3.95, 0.3, Math.sin(a) * 3.95);
    scene.add(post);
  });

  const instances = {}; // id -> [{obj, born}]
  buildings.forEach((b) => { instances[b.id] = []; });
  const orbitGroup = new THREE.Group();
  scene.add(orbitGroup);
  const pickables = [];

  function place(b, idx) {
    const obj = makeModel(b.id);
    obj.userData.type = b.id;
    obj.userData.baseScale = b.map.scale;
    obj.userData.target = b.map.scale;
    if (b.map.orbit) {
      obj.userData.orbit = { rad: 12.5 + (idx % 3) * 1.4, y: 6 + (idx % 4) * 0.9, a: idx * 2.39, speed: 0.12 + (idx % 5) * 0.03 };
      orbitGroup.add(obj);
    } else {
      const s = slots[b.id][idx];
      obj.position.set(Math.cos(s.a) * s.rad, 0, Math.sin(s.a) * s.rad);
      obj.rotation.y = -s.a + Math.PI / 2 + Math.sin(idx * 12.9) * 0.25; // face outwards
      obj.userData.phase = idx * 1.7;
      scene.add(obj);
    }
    decorate(obj);
    obj.traverse((o) => { if (o.isMesh) o.userData.pickRoot = obj; });
    pickables.push(obj);
    return obj;
  }

  function remove(entry) {
    const { obj } = entry;
    obj.parent && obj.parent.remove(obj);
    const i = pickables.indexOf(obj);
    if (i >= 0) pickables.splice(i, 1);
  }

  let firstUpdate = true;
  function update(counts) {
    let stagger = 0;
    for (const b of buildings) {
      const want = Math.min(counts[b.id] || 0, capFor(b));
      const list = instances[b.id];
      while (list.length > want) remove(list.pop());
      while (list.length < want) {
        const obj = place(b, list.length);
        const born = firstUpdate ? performance.now() + (stagger++) * 25 : performance.now();
        obj.scale.setScalar(0.0001);
        list.push({ obj, born });
      }
    }
    firstUpdate = false;
  }

  // ---- upgrade visuals ----
  // Building tier upgrades: pedestal colored by tier (bronze..diamond), a glow ring from tier 4
  const TIER_COLORS = ["#c77b3b", "#c8ced8", "#f2b705", "#7fd3e6", "#e0244a", "#b57cff"];
  const pedGeo = new THREE.CylinderGeometry(0.62, 0.7, 0.1, 28);
  const pedMats = TIER_COLORS.map((c) => withEnv(new THREE.MeshStandardMaterial({ color: c, metalness: 0.85, roughness: 0.3, emissive: c, emissiveIntensity: 0.1 })));
  const glowGeo = new THREE.TorusGeometry(0.8, 0.04, 8, 48);
  const glowMats = TIER_COLORS.map((c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9 }));
  let tierLook = {};
  function decorate(obj) {
    obj.children.filter((c) => c.userData.deco).forEach((c) => obj.remove(c));
    const n = Math.min(6, tierLook[obj.userData.type] || 0);
    obj.userData.target = obj.userData.baseScale * (1 + 0.04 * n);
    if (n <= 0) return;
    if (!obj.userData.orbit) {
      const ped = new THREE.Mesh(pedGeo, pedMats[n - 1]);
      ped.position.y = -0.02; ped.receiveShadow = true; ped.userData.deco = true; ped.userData.pickRoot = obj;
      obj.add(ped);
    }
    if (n >= 4 || obj.userData.orbit) {
      const ring = new THREE.Mesh(glowGeo, glowMats[n - 1]);
      ring.rotation.x = Math.PI / 2; ring.position.y = obj.userData.orbit ? 0.5 : 0.06;
      ring.userData.deco = true; ring.userData.glowRing = true;
      obj.add(ring);
    }
  }

  // Global/news/rally/etc. upgrades raise monuments around the plaza
  const MONUMENTS = [
    ["global_0", "shakshuka"], ["global_1", "hummus"], ["global_2", "hora"], ["global_3", "candles"], ["global_4", "walls"],
    ["global_5", "beach"], ["global_6", "bulb"], ["global_7", "cactus"], ["news_0", "newspaper"], ["news_1", "tv"],
    ["rally_0", "megaphone"], ["rally_1", "fireworks"], ["decision_0", "scroll"], ["offline_0", "clock"],
  ];
  const monuments = {};
  const capMat = withEnv(new THREE.MeshStandardMaterial({ color: C.gold, metalness: 0.85, roughness: 0.3 }));
  const tmpBox = new THREE.Box3(), tmpV = new THREE.Vector3();
  function makeMonument(id) {
    const i = MONUMENTS.findIndex(([m]) => m === id);
    const g = new THREE.Group();
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.34, 16), mat(C.stone));
    pillar.position.y = 0.17; g.add(pillar);
    const capM = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 16), capMat);
    capM.position.y = 0.36; g.add(capM);
    const model = makeModel(MONUMENTS[i][1]);
    tmpBox.setFromObject(model);
    tmpBox.getSize(tmpV);
    const sc = 0.66 / Math.max(tmpV.x, tmpV.y, tmpV.z);
    model.scale.setScalar(sc);
    model.position.y = 0.385 - tmpBox.min.y * sc;
    g.add(model);
    const a = 0.35 + (i / MONUMENTS.length) * TAU;
    g.position.set(Math.cos(a) * 2.4, 0.04, Math.sin(a) * 2.4);
    g.rotation.y = -a + Math.PI / 2;
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.userData.born = performance.now();
    g.scale.setScalar(0.0001);
    scene.add(g);
    return g;
  }

  // Golden ballot box HQ and a crown on top of the flagpole
  const goldMat = withEnv(new THREE.MeshStandardMaterial({ color: C.gold, metalness: 0.9, roughness: 0.22, emissive: "#6b4a00", emissiveIntensity: 0.45 }), 1.3);
  hq.traverse((o) => { if (o.isMesh) o.userData.origMat = o.material; });
  function setGoldHQ(on) {
    hq.traverse((o) => {
      if (!o.isMesh) return;
      o.material = on && !o.userData.origMat.map ? goldMat : o.userData.origMat;
    });
  }
  const crown = makeModel("crown");
  crown.traverse((o) => { if (o.isMesh) o.material = withEnv(o.material.clone(), 1.2); });
  crown.scale.setScalar(0.55);
  crown.position.set(0, 5.5, 0);
  crown.visible = false;
  scene.add(crown);

  // Synergy upgrades: glowing arcs between the two districts
  const arcs = new THREE.Group();
  scene.add(arcs);
  let arcSig = "";
  function districtPoint(id) {
    const i = ground.findIndex((b) => b.id === id);
    if (i < 0) return new THREE.Vector3(0, 7.5, 0);
    const a = (i + 0.5) * sector;
    return new THREE.Vector3(Math.cos(a) * 6.8, 0.6, Math.sin(a) * 6.8);
  }
  function buildArcs(pairs) {
    const sig = pairs.map((p) => p.join(">")).join(",");
    if (sig === arcSig) return;
    arcSig = sig;
    arcs.clear();
    pairs.forEach(([src, dst], k) => {
      const p0 = districtPoint(src), p1 = districtPoint(dst);
      const mid = p0.clone().add(p1).multiplyScalar(0.5);
      mid.y = Math.max(p0.y, p1.y) + 4 + p0.distanceTo(p1) * 0.15;
      const curve = new THREE.QuadraticBezierCurve3(p0, mid, p1);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.05, 8),
        new THREE.MeshBasicMaterial({ color: "#4ade80", transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
      arcs.add(tube);
      for (let j = 0; j < 3; j++) {
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), new THREE.MeshBasicMaterial({ color: "#bbf7d0" }));
        orb.userData = { curve, offset: j / 3 + k * 0.17 };
        arcs.add(orb);
      }
    });
  }

  // look = { tiers: {id: n}, monuments: [ids], goldHQ, crown, synergies: [[source, target]], rallyFireworks }
  function setUpgradeLook(look) {
    tierLook = look.tiers || {};
    for (const id in instances) instances[id].forEach((e) => decorate(e.obj));
    const want = new Set(look.monuments || []);
    for (const id of Object.keys(monuments)) {
      if (!want.has(id)) { scene.remove(monuments[id]); delete monuments[id]; }
    }
    for (const id of want) if (!monuments[id] && MONUMENTS.some(([m]) => m === id)) monuments[id] = makeMonument(id);
    setGoldHQ(!!look.goldHQ);
    crown.visible = !!look.crown;
    knob.visible = !look.crown;
    buildArcs(look.synergies || []);
    rallyFireworks = !!look.rallyFireworks;
  }

  // ---- hover ----
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoverDirty = false, hoverEvt = null;
  canvas.addEventListener("pointermove", (e) => { hoverEvt = e; hoverDirty = true; });
  canvas.addEventListener("pointerleave", () => { hoverEvt = null; hoverDirty = true; });
  canvas.addEventListener("pointerdown", () => { controls.autoRotate = false; });
  let lastHover = null;
  function doHover() {
    hoverDirty = false;
    if (!hoverEvt) { if (lastHover) { lastHover = null; onHover && onHover(null); } return; }
    const rect = canvas.getBoundingClientRect();
    mouse.set(((hoverEvt.clientX - rect.left) / rect.width) * 2 - 1, -((hoverEvt.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(pickables, true)[0];
    const type = hit ? hit.object.userData.pickRoot?.userData.type : null;
    if (type !== lastHover) lastHover = type;
    onHover && onHover(type, hoverEvt);
  }

  // ---- loop ----
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width), h = Math.max(1, rect.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  let active = true, raf = 0, last = performance.now(), t = 0;
  const easeOutBack = (x) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2);
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!active || document.hidden) { last = now; return; }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now; t += dt;
    controls.update();

    for (const id in instances) {
      for (const e of instances[id]) {
        const o = e.obj, target = o.userData.target;
        const k = (now - e.born) / 650;
        if (k < 1) o.scale.setScalar(Math.max(0.0001, target * (k <= 0 ? 0 : easeOutBack(k))));
        else if (o.scale.x !== target) o.scale.setScalar(target);
        if (o.userData.orbit) {
          const ob = o.userData.orbit;
          ob.a += ob.speed * dt;
          o.position.set(Math.cos(ob.a) * ob.rad, ob.y + Math.sin(t + ob.a) * 0.3, Math.sin(ob.a) * ob.rad);
          o.rotation.y = -ob.a;
        } else if (id === "volunteer") {
          o.position.y = Math.abs(Math.sin(t * 3 + o.userData.phase)) * 0.12;
        }
        animateModel(o, t, dt);
      }
    }
    // big flag
    const pos = bigFlagGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = bigFlagBase[i * 3] + FW / 2;
      pos.array[i * 3 + 2] = Math.sin(x * 3 - t * 4) * 0.12 * x + Math.sin(bigFlagBase[i * 3 + 1] * 3 + t * 2) * 0.03 * x;
    }
    pos.needsUpdate = true;
    bigFlagGeo.computeVertexNormals();
    for (const cl of clouds) {
      const u = cl.userData;
      u.a += u.speed * dt;
      cl.position.set(Math.cos(u.a) * u.rad, u.y, Math.sin(u.a) * u.rad);
    }
    // monuments pop in, then animate
    for (const id in monuments) {
      const g = monuments[id];
      const k = (now - g.userData.born) / 700;
      if (k < 1) g.scale.setScalar(Math.max(0.0001, k <= 0 ? 0.0001 : easeOutBack(k)));
      else if (g.scale.x !== 1) g.scale.setScalar(1);
      animateModel(g, t, dt);
    }
    if (crown.visible) { crown.rotation.y += dt * 0.6; crown.position.y = 5.5 + Math.sin(t * 2) * 0.05; }
    arcs.children.forEach((o) => {
      if (o.userData.curve) o.position.copy(o.userData.curve.getPoint((t * 0.35 + o.userData.offset) % 1));
      else o.material.opacity = 0.4 + Math.sin(t * 3) * 0.15;
    });
    if (snow.visible) {
      const sp = snowGeo.attributes.position.array;
      for (let i = 0; i < SNOW; i++) {
        sp[i * 3 + 1] -= dt * (1.1 + (i % 7) * 0.12);
        sp[i * 3] += Math.sin(t * 0.8 + i) * dt * 0.25;
        if (sp[i * 3 + 1] < -6) sp[i * 3 + 1] = 18;
      }
      snowGeo.attributes.position.needsUpdate = true;
    }
    if (menorah.visible) animateModel(menorah, t, dt);
    if (beams.visible) beams.children.forEach((p) => { p.rotation.set(Math.sin(t * 0.5 + p.userData.phase) * 0.35, 0, Math.cos(t * 0.4 + p.userData.phase) * 0.35); });
    updateFireworks(dt, now);
    if (hoverDirty) doHover();
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  return {
    update,
    resize,
    setTheme,
    setUpgradeLook,
    setRally(on) { rallyOn = on; },
    setActive(on) { active = on; if (on) resize(); },
    resetView() {
      camera.position.set(17, 13, 17);
      controls.target.set(0, 0.6, 0);
      controls.autoRotate = true;
    },
    capFor: (id) => capFor(buildings.find((b) => b.id === id)),
    slotCounts: () => Object.fromEntries(buildings.map((b) => [b.id, capFor(b)])),
    toggleRotate() { controls.autoRotate = !controls.autoRotate; return controls.autoRotate; },
  };
}

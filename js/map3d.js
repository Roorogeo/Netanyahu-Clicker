// The 3D campaign map: a floating island where every building you own appears.
import * as THREE from "three";
import { OrbitControls } from "../vendor/three/addons/OrbitControls.js";
import { makeModel, animateModel, mat, drawFlag, C } from "./models.js";

const TAU = Math.PI * 2;

// Deterministic pseudo-random so the layout is the same every visit
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function skyTexture() {
  const c = document.createElement("canvas");
  c.width = 4; c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#5f8ff0"); g.addColorStop(0.55, "#bcd2ff"); g.addColorStop(1, "#f4f7ff");
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

  scene.add(new THREE.HemisphereLight("#e4edff", "#b59d70", 1.05));
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
  const top = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.5, 72), mat("#9cc46a", { roughness: 0.95 }));
  top.position.y = -0.25; top.receiveShadow = true;
  island.add(top);
  const beachRing = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.45, R + 0.3, 0.42, 72), mat(C.sand, { roughness: 1 }));
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
  drawFlag(flagC.getContext("2d"), 512, 372);
  const flagTex = new THREE.CanvasTexture(flagC); flagTex.colorSpace = THREE.SRGBColorSpace;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 5.5, 12), mat(C.silver, { metalness: 0.8, roughness: 0.3 }));
  pole.position.set(0, 2.75, 0); pole.castShadow = true;
  scene.add(pole);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), mat(C.gold, { metalness: 0.9, roughness: 0.25 }));
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
    if (hoverDirty) doHover();
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  return {
    update,
    resize,
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

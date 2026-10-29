import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* =========================================================
   The Road to Buffalo — a very short 3D game
   ========================================================= */

const L = 520;                 // length of the straight road to the fork
const HALF = 5;                // road half-width
const LANE_LIMIT = 4.3;        // how far the bison can drift from centre
const ENDING_AT = 92;          // distance past the fork that ends the run

const $ = (id) => document.getElementById(id);
const wrap = $('game');
const canvas = $('gameCanvas');
const ui = {
  intro: $('gIntro'), play: $('gPlay'), hud: $('gHud'), val: $('gVal'), ai: $('gAi'),
  prog: $('gProg'), hype: $('gHype'), cap: $('gCap'), pause: $('gPause'), resume: $('gResume'),
  end: $('gEnd'), endTitle: $('gEndTitle'), endBody: $('gEndBody'), endStats: $('gEndStats'),
  again: $('gAgain'), ytChoice: $('gYtChoice'), ytOther: $('gYtOther'), loading: $('gLoading'),
  mute: $('gMute'), touch: $('gTouch'), fail: $('gFail'), exit: $('gExit'), exitEnd: $('gExitEnd')
};

// make sure sign textures render in the brand typeface
try { await Promise.race([document.fonts.load('800 100px "Overpass"'), new Promise(r => setTimeout(r, 2500))]); } catch (e) {}

/* ---------- renderer ---------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  ui.fail.hidden = false; ui.loading.hidden = true;
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const HORIZON = new THREE.Color('#efd3a6');
scene.fog = new THREE.Fog(HORIZON, 70, 430);

const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1400);

/* ---------- deterministic randomness ---------- */
let seed = 1972;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const rr = (a, b) => a + (b - a) * rnd();

function hash2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y) { let t = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { t += a * vnoise(x * f, y * f); f *= 2; a *= 0.5; } return t; }
const smooth = (e0, e1, x) => { const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1); return t * t * (3 - 2 * t); };

/* ---------- road layout ---------- */
const forkPt = new THREE.Vector3(0, 0, -L);
function branchCurve(side) {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, -L),
    new THREE.Vector3(side * 5, 0, -L - 22),
    new THREE.Vector3(side * 30, 0, -L - 75),
    new THREE.Vector3(side * 31, 0, -L - 135),
    new THREE.Vector3(side * 9, 0, -L - 190),
    new THREE.Vector3(0, 0, -L - 212)
  ], false, 'centripetal');
}
const curves = { '-1': branchCurve(-1), '1': branchCurve(1) };
const curveLen = curves['1'].getLength();

const _p = new THREE.Vector3(), _t = new THREE.Vector3();
function frame(s, branch) {
  if (s <= L || !branch) { _p.set(0, 0, -s); _t.set(0, 0, -1); return { pos: _p, tan: _t }; }
  const t = Math.min((s - L) / curveLen, 1);
  curves[branch].getPointAt(t, _p);
  curves[branch].getTangentAt(t, _t);
  return { pos: _p, tan: _t };
}
// world position from road coords
function toWorld(s, u, branch, out) {
  const f = frame(s, branch);
  return out.set(f.pos.x - f.tan.z * u, 0, f.pos.z + f.tan.x * u);
}

// centre-line samples used to flatten the terrain around roads
const roadSamples = [];
for (let s = -120; s <= L; s += 4) roadSamples.push([0, -s]);
for (const b of ['-1', '1']) for (let i = 0; i <= 60; i++) { curves[b].getPointAt(i / 60, _p); roadSamples.push([_p.x, _p.z]); }
function roadDist(x, z) {
  let m = Infinity;
  for (let i = 0; i < roadSamples.length; i++) {
    const dx = x - roadSamples[i][0], dz = z - roadSamples[i][1];
    const d = dx * dx + dz * dz; if (d < m) m = d;
  }
  return Math.sqrt(m);
}
function heightAt(x, z, d = roadDist(x, z)) {
  const hills = (fbm(x * 0.011 + 3, z * 0.011) - 0.35) * 22 + fbm(x * 0.05, z * 0.05) * 1.4;
  return Math.max(hills, -1) * smooth(8, 42, d) - 0.02;
}

/* ---------- sky ---------- */
const sunDir = new THREE.Vector3(-0.55, 0.28, -0.78).normalize();
{
  const g = new THREE.SphereGeometry(1100, 32, 16);
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#5d93bd') }, mid: { value: new THREE.Color('#a9c9de') }, hor: { value: HORIZON }, sun: { value: sunDir } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 hor; uniform vec3 sun; varying vec3 vP;
      void main(){ float h = vP.y;
        vec3 c = mix(hor, mid, smoothstep(0.0, 0.18, h)); c = mix(c, top, smoothstep(0.18, 0.7, h));
        c = mix(c, hor * 0.92, smoothstep(0.0, -0.1, h));
        float s = max(dot(normalize(vP), normalize(sun)), 0.0);
        c += vec3(1.0, 0.82, 0.55) * (pow(s, 1400.0) * 1.2 + pow(s, 40.0) * 0.35 + pow(s, 6.0) * 0.12);
        gl_FragColor = vec4(c, 1.0); }`
  });
  scene.add(new THREE.Mesh(g, m));
}

/* ---------- lights ---------- */
scene.add(new THREE.HemisphereLight('#cfe2ef', '#7d6d45', 1.15));
const sun = new THREE.DirectionalLight('#ffe0ad', 2.6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 160 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

/* ---------- terrain ---------- */
{
  const W = 640, D = 1120, zc = -L / 2 - 120;
  const g = new THREE.PlaneGeometry(W, D, 128, 224);
  g.rotateX(-Math.PI / 2); g.translate(0, 0, zc);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3);
  const cA = new THREE.Color('#8f9b4f'), cB = new THREE.Color('#c2ae6a'), cC = new THREE.Color('#6f8443'), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), d = roadDist(x, z);
    pos.setY(i, heightAt(x, z, d));
    const n = fbm(x * 0.03 + 9, z * 0.03);
    c.copy(cA).lerp(cB, smooth(0.35, 0.7, n)).lerp(cC, smooth(0.55, 0.85, fbm(x * 0.09, z * 0.09)) * 0.5);
    if (d < 7.5) c.lerp(new THREE.Color('#b8a378'), smooth(7.5, 5.4, d));
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  const ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
  ground.receiveShadow = true;
  scene.add(ground);
}

/* ---------- roads ---------- */
const asphalt = new THREE.MeshStandardMaterial({ color: '#3b3e44', roughness: 0.92 });
const white = new THREE.MeshStandardMaterial({ color: '#f1efe6', roughness: 0.7 });
const yellow = new THREE.MeshStandardMaterial({ color: '#f4c21f', roughness: 0.6, emissive: '#3a2a00' });

function strip(points, width, y, mat, offset = 0) {
  const n = points.length, v = new Float32Array(n * 6), idx = [];
  for (let i = 0; i < n; i++) {
    const [p, t] = points[i];
    const rx = -t.z, rz = t.x;
    v.set([p.x + rx * (offset - width / 2), y, p.z + rz * (offset - width / 2), p.x + rx * (offset + width / 2), y, p.z + rz * (offset + width / 2)], i * 6);
    if (i < n - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(v, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; scene.add(m); return m;
}
function samplesMain() { const a = []; for (let s = -120; s <= L + 0.01; s += 10) a.push([new THREE.Vector3(0, 0, -s), new THREE.Vector3(0, 0, -1)]); return a; }
function samplesBranch(b) { const a = []; for (let i = 0; i <= 120; i++) { const t = i / 120; a.push([curves[b].getPointAt(t), curves[b].getTangentAt(t)]); } return a; }

const main = samplesMain(), left = samplesBranch('-1'), right = samplesBranch('1');
for (const pts of [main, left, right]) {
  strip(pts, HALF * 2, 0.02, asphalt);
  strip(pts, 0.16, 0.035, white, -HALF + 0.35);
  strip(pts, 0.16, 0.035, white, HALF - 0.35);
}
// centre dashes
{
  const dashes = [];
  for (let s = -116; s < L - 70; s += 7) dashes.push([new THREE.Vector3(0, 0, -s), new THREE.Vector3(0, 0, -1)]);
  for (const b of ['-1', '1']) for (let s = 6; s < curveLen - 4; s += 7) { const t = s / curveLen; dashes.push([curves[b].getPointAt(t), curves[b].getTangentAt(t)]); }
  const g = new THREE.BoxGeometry(0.16, 0.02, 3);
  const im = new THREE.InstancedMesh(g, yellow, dashes.length);
  const o = new THREE.Object3D();
  dashes.forEach(([p, t], i) => { o.position.set(p.x, 0.04, p.z); o.rotation.set(0, Math.atan2(t.x, t.z), 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
  scene.add(im);
  // the lane split before the fork: solid white line
  strip([[new THREE.Vector3(0, 0, -(L - 70)), new THREE.Vector3(0, 0, -1)], [new THREE.Vector3(0, 0, -L), new THREE.Vector3(0, 0, -1)]], 0.22, 0.045, white);
}

/* ---------- sign textures ---------- */
const FONT = '"Overpass", "Helvetica Neue", Arial, sans-serif';
function signTexture(lines, { w = 1024, h = 512, bg = '#0b5d3b', fg = '#ffffff', arrow = 0, sizes } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  x.strokeStyle = fg; x.lineWidth = 12; const r = 34;
  x.beginPath(); x.roundRect(18, 18, w - 36, h - 36, r); x.stroke();
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  const n = lines.length;
  lines.forEach((ln, i) => {
    const size = sizes ? sizes[i] : (n === 1 ? 190 : n === 2 ? 132 : 96);
    x.font = `800 ${size}px ${FONT}`;
    const y = h / 2 + (i - (n - 1) / 2) * size * 1.12 + (arrow ? -40 : 0);
    x.fillText(ln, w / 2, y + size * 0.06, w - 90);
  });
  if (arrow) { // diagonal arrow
    x.save(); x.translate(w / 2, h - 92); x.rotate(arrow * Math.PI / 4); x.lineWidth = 18; x.lineCap = 'round';
    x.beginPath(); x.moveTo(0, 40); x.lineTo(0, -40); x.moveTo(-28, -12); x.lineTo(0, -42); x.lineTo(28, -12); x.stroke(); x.restore();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const postMat = new THREE.MeshStandardMaterial({ color: '#8b9096', metalness: 0.6, roughness: 0.4 });
const backMat = new THREE.MeshStandardMaterial({ color: '#7a7f86', metalness: 0.5, roughness: 0.5 });
function roadSign(lines, s, u, scale = 1, opts) {
  const g = new THREE.Group();
  const w = 4.2 * scale, h = 2.1 * scale, y = 2.6 + h / 2;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: signTexture(lines, opts), roughness: 0.55 }));
  face.position.set(0, y, 0.06);
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), backMat); back.position.set(0, y, 0);
  for (const px of [-w * 0.32, w * 0.32]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, y + h / 2, 8), postMat); p.position.set(px, (y + h / 2) / 2, -0.1); p.castShadow = true; g.add(p); }
  back.castShadow = true; g.add(face, back);
  toWorld(s, u, null, g.position); g.position.y = 0;
  g.rotation.y = -0.18 * Math.sign(u);
  scene.add(g); return g;
}
const roadsideSigns = [
  [70, ['Buffalo 8', 'Buffalo 8', 'Buffalo 8'], { sizes: [104, 104, 104] }],
  [150, ['Speed limit', 'Series B'], {}],
  [230, ['Hype cycle', 'Peak 2 mi'], {}],
  [300, ['Next exit', 'Synergy'], {}],
  [370, ['Trough of', 'disillusionment'], { sizes: [120, 104] }],
  [430, ['Leaving', 'context window'], { sizes: [124, 104] }]
];
roadsideSigns.forEach(([s, lines, o]) => roadSign(lines, s, 7.6, 1, o));

// overhead gantry before the fork
{
  const s = L - 58, g = new THREE.Group();
  const span = 15, y = 6.6;
  const beam = new THREE.Mesh(new THREE.BoxGeometry(span + 1, 0.35, 0.35), postMat); beam.position.y = y + 1.9;
  const beam2 = beam.clone(); beam2.position.y = y - 0.2;
  g.add(beam, beam2);
  for (const px of [-span / 2 - 0.3, span / 2 + 0.3]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, y + 2.3, 10), postMat); p.position.set(px, (y + 2.3) / 2, 0); p.castShadow = true; g.add(p); }
  const mk = (txt, x, arrow) => {
    const face = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 3.6), new THREE.MeshStandardMaterial({ map: signTexture([txt], { arrow, w: 1024, h: 560, sizes: [200] }), roughness: 0.5 }));
    face.position.set(x, y + 0.85, 0.25); face.castShadow = true;
    const tab = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.8), new THREE.MeshStandardMaterial({ map: signTexture(['EXIT 8'], { w: 512, h: 170, sizes: [96] }) }));
    tab.position.set(x + (arrow < 0 ? -2.0 : 2.0), y + 3.05, 0.26);
    g.add(face, tab);
  };
  mk('AI', -3.6, -1); mk('Buffalo', 3.6, 1);
  g.position.set(0, 0, -s); scene.add(g);
}
// gore sign at the split
{
  const g = new THREE.Group();
  const face = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshStandardMaterial({ map: signTexture(['Both', 'fine'], { w: 512, h: 340, sizes: [110, 110] }) }));
  face.position.y = 2.2;
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8), postMat); p.position.y = 1.1;
  g.add(face, p); g.position.set(0, 0, -L - 26); scene.add(g);
}

/* ---------- Buffalo, NY (where both roads end) ---------- */
{
  const city = new THREE.Group();
  const towerMat = new THREE.MeshStandardMaterial({ color: '#8d99a6', roughness: 0.6, metalness: 0.2 });
  const winMat = new THREE.MeshStandardMaterial({ color: '#ffe3a1', emissive: '#ffcf6a', emissiveIntensity: 0.7 });
  for (let i = 0; i < 26; i++) {
    const w = rr(5, 11), h = rr(10, 46), d = rr(5, 11);
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), towerMat);
    const a = rr(-1.2, 1.2), r = rr(18, 70);
    b.position.set(Math.sin(a) * r, h / 2, -L - 250 - Math.cos(a) * r * 0.6 - rr(0, 30));
    b.castShadow = true; city.add(b);
    const band = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.5, d + 0.05), winMat);
    for (let k = 3; k < h - 2; k += 3.2) { const bb = band.clone(); bb.position.set(b.position.x, k, b.position.z); city.add(bb); }
  }
  scene.add(city);
  const welcome = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), new THREE.MeshStandardMaterial({ map: signTexture(['Welcome to Buffalo', 'Population: AI'], { w: 1400, h: 500, sizes: [140, 100] }) }));
  welcome.position.set(0, 4.5, -L - 222);
  const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 7, 8), postMat); p1.position.set(-5, 3.5, -L - 222.2);
  const p2 = p1.clone(); p2.position.x = 5;
  scene.add(welcome, p1, p2);
}

/* ---------- scenery ---------- */
const dummy = new THREE.Object3D();
// fence posts + wire along the straight
{
  const n = Math.floor((L + 100) / 4) * 2;
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 1.3, 0.16), new THREE.MeshStandardMaterial({ color: '#6b5236', roughness: 1 }), n);
  let k = 0;
  for (let s = -100; s < L - 10; s += 4) for (const u of [-9, 9]) {
    if (k >= n) break;
    dummy.position.set(u, heightAt(u, -s) + 0.6, -s); dummy.rotation.set(0, rr(-0.1, 0.1), rr(-0.05, 0.05)); dummy.updateMatrix(); im.setMatrixAt(k++, dummy.matrix);
  }
  im.count = k; im.castShadow = true; scene.add(im);
  for (const u of [-9, 9]) for (const y of [0.75, 1.1]) {
    const wire = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, L + 86), new THREE.MeshStandardMaterial({ color: '#4a4a4a' }));
    wire.position.set(u, y, (114 - L) / 2); scene.add(wire);
  }
}
// telephone poles
{
  const pole = new THREE.MeshStandardMaterial({ color: '#5c4630', roughness: 1 });
  for (let s = -80; s < L - 20; s += 36) {
    const g = new THREE.Group();
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 8, 7), pole); p.position.y = 4; p.castShadow = true;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.14, 0.14), pole); bar.position.y = 7.4;
    g.add(p, bar); g.position.set(-12.5, 0, -s); scene.add(g);
  }
}
// grass tufts
{
  const n = 5200;
  const im = new THREE.InstancedMesh(new THREE.ConeGeometry(0.28, 1, 4), new THREE.MeshStandardMaterial({ flatShading: true, roughness: 1 }), n);
  const c = new THREE.Color(); let k = 0;
  while (k < n) {
    const x = rr(-160, 160), z = rr(60, -L - 320);
    const d = roadDist(x, z); if (d < 7) continue;
    const s = rr(0.5, 1.4);
    dummy.position.set(x, heightAt(x, z, d) + 0.35 * s, z); dummy.rotation.set(rr(-0.2, 0.2), rr(0, 6), rr(-0.2, 0.2)); dummy.scale.set(s, s * rr(0.7, 1.4), s); dummy.updateMatrix();
    im.setMatrixAt(k, dummy.matrix);
    im.setColorAt(k, c.setHSL(rr(0.12, 0.2), rr(0.35, 0.5), rr(0.36, 0.52)));
    k++;
  }
  dummy.scale.set(1, 1, 1);
  im.receiveShadow = true; scene.add(im);
}
// rocks
{
  const n = 260;
  const im = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: '#9c8f7b', flatShading: true, roughness: 1 }), n);
  for (let k = 0; k < n;) {
    const x = rr(-200, 200), z = rr(40, -L - 330), d = roadDist(x, z); if (d < 9) continue;
    const s = rr(0.3, 1.6);
    dummy.position.set(x, heightAt(x, z, d) + s * 0.2, z); dummy.rotation.set(rr(0, 3), rr(0, 3), 0); dummy.scale.set(s, s * 0.7, s); dummy.updateMatrix(); im.setMatrixAt(k++, dummy.matrix);
  }
  dummy.scale.set(1, 1, 1);
  im.castShadow = true; scene.add(im);
}
// mesas on the horizon
{
  const m = new THREE.MeshStandardMaterial({ color: '#c08a5c', flatShading: true, roughness: 1 });
  for (let i = 0; i < 14; i++) {
    const r = rr(18, 46), h = rr(10, 30);
    const g = new THREE.CylinderGeometry(r * 0.75, r, h, 7, 1);
    const mesh = new THREE.Mesh(g, m);
    const side = i % 2 ? 1 : -1;
    mesh.position.set(side * rr(150, 280), h / 2 - 2, rr(-60, -L - 360));
    mesh.rotation.y = rr(0, 3); scene.add(mesh);
  }
}
// clouds
const clouds = [];
{
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 1, emissive: '#ffffff', emissiveIntensity: 0.15 });
  for (let i = 0; i < 18; i++) {
    const g = new THREE.Group();
    const parts = 4 + Math.floor(rr(0, 4));
    for (let k = 0; k < parts; k++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(rr(4, 9), 0), m); b.position.set(k * rr(5, 8), rr(-1, 2), rr(-3, 3)); b.scale.y = 0.6; g.add(b); }
    g.position.set(rr(-260, 260), rr(70, 120), rr(80, -L - 400)); g.userData.v = rr(0.5, 1.5);
    scene.add(g); clouds.push(g);
  }
}

/* ---------- pickups & obstacles ---------- */
function aiTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const gr = x.createRadialGradient(128, 110, 20, 128, 128, 128); gr.addColorStop(0, '#ffe680'); gr.addColorStop(1, '#e0a400');
  x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = '#8a6200'; x.lineWidth = 10; x.beginPath(); x.arc(128, 128, 106, 0, 7); x.stroke();
  x.fillStyle = '#5a3d00'; x.font = `900 118px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('AI', 128, 140);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let coinGeo, coinMats;
const bale = { geo: new THREE.CylinderGeometry(0.78, 0.78, 1.9, 14), mat: new THREE.MeshStandardMaterial({ color: '#d8b35a', roughness: 1, flatShading: true }) };
const coneMat = new THREE.MeshStandardMaterial({ color: '#ec6a1e', roughness: 0.6 });
const stripeMat = new THREE.MeshStandardMaterial({ color: '#f5f5f5', roughness: 0.6 });

const items = []; // {type, s, u, obj, alive}
function buildItems() {
  items.forEach(it => scene.remove(it.obj)); items.length = 0;
  seed = 8888;
  if (!coinGeo) {
    coinGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.14, 28);
    const face = new THREE.MeshStandardMaterial({ map: aiTexture(), metalness: 0.55, roughness: 0.35, emissive: '#6b4a00', emissiveIntensity: 0.35 });
    coinMats = [new THREE.MeshStandardMaterial({ color: '#d79f00', metalness: 0.8, roughness: 0.3 }), face, face];
  }
  const lanes = [-3, 0, 3];
  for (let s = 55; s < L - 75; s += rr(12, 18)) {
    const r = rnd();
    if (r < 0.55) {
      const u = lanes[Math.floor(rnd() * 3)];
      for (let k = 0; k < 3; k++) addCoin(s + k * 2.4, u);
    } else if (r < 0.85) {
      const u = lanes[Math.floor(rnd() * 3)];
      addBale(s, u);
      if (rnd() < 0.5) addCoin(s, lanes[(lanes.indexOf(u) + 1 + Math.floor(rnd() * 2)) % 3]);
    } else {
      const u = lanes[Math.floor(rnd() * 3)];
      addCone(s, u); addCone(s, u + (u >= 0 ? -1.4 : 1.4));
    }
  }
  // a few coins right before the choice, one on each side
  for (const u of [-2.6, 2.6]) for (let k = 0; k < 4; k++) addCoin(L - 50 + k * 2.6, u);
}
function addCoin(s, u) {
  const g = new THREE.Group(); const m = new THREE.Mesh(coinGeo, coinMats); m.rotation.x = Math.PI / 2; m.castShadow = true; g.add(m);
  toWorld(s, u, null, g.position); g.position.y = 1.1; scene.add(g);
  items.push({ type: 'coin', s, u, obj: g, alive: true, phase: rnd() * 6 });
}
function addBale(s, u) {
  const m = new THREE.Mesh(bale.geo, bale.mat); m.rotation.z = Math.PI / 2; m.castShadow = true; m.receiveShadow = true;
  toWorld(s, u, null, m.position); m.position.y = 0.78; scene.add(m);
  items.push({ type: 'bale', s, u, obj: m, alive: true });
}
function addCone(s, u) {
  const g = new THREE.Group();
  const c = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.95, 14), coneMat); c.position.y = 0.5; c.castShadow = true;
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.14, 14), stripeMat); st.position.y = 0.55;
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.7), coneMat); base.position.y = 0.03;
  g.add(c, st, base); toWorld(s, u, null, g.position); scene.add(g);
  items.push({ type: 'cone', s, u, obj: g, alive: true });
}

/* ---------- dust ---------- */
const DUST = 90;
const dustMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.22, 0), new THREE.MeshStandardMaterial({ color: '#cdb98e', roughness: 1, transparent: true, opacity: 0.8, flatShading: true }), DUST);
dustMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
const dust = Array.from({ length: DUST }, () => ({ life: 0, p: new THREE.Vector3(), v: new THREE.Vector3() }));
let dustI = 0;
scene.add(dustMesh);
function emitDust(pos, n, spread = 1) {
  for (let i = 0; i < n; i++) {
    const d = dust[dustI = (dustI + 1) % DUST];
    d.life = 1; d.p.copy(pos).add(new THREE.Vector3(rr(-0.5, 0.5), 0.1, rr(-0.3, 0.3)));
    d.v.set(rr(-1, 1) * spread, rr(0.6, 1.8), rr(0.5, 2));
  }
}
function updateDust(dt) {
  for (let i = 0; i < DUST; i++) {
    const d = dust[i];
    if (d.life > 0) { d.life -= dt * 1.4; d.p.addScaledVector(d.v, dt); d.v.y -= dt * 1.5; }
    const s = Math.max(d.life, 0) * 1.4;
    dummy.position.copy(d.p); dummy.scale.setScalar(s); dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
    dustMesh.setMatrixAt(i, dummy.matrix);
  }
  dummy.scale.setScalar(1);
  dustMesh.instanceMatrix.needsUpdate = true;
}

/* ---------- the bison ---------- */
const player = new THREE.Group(); scene.add(player);
const bisonPivot = new THREE.Group(); player.add(bisonPivot);
let mixer, actions = {}, bisonTemplate = null;
const herd = [];

const loader = new GLTFLoader();
loader.load('assets/bison.glb', (gltf) => {
  const model = gltf.scene;
  model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material.map) o.material.map.anisotropy = 4; } });
  // orient so the head points down -Z, and scale to ~2.6 units long
  const head = model.getObjectByName('head');
  const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3());
  let angle = 0;
  if (head) { const hp = new THREE.Vector3(); head.getWorldPosition(hp); const c = box.getCenter(new THREE.Vector3()); angle = Math.atan2(hp.x - c.x, hp.z - c.z); }
  const scale = 2.6 / Math.max(size.x, size.z);
  model.scale.setScalar(scale);
  model.rotation.y = Math.PI - angle;
  model.position.y = -box.min.y * scale;
  bisonTemplate = { scene: model, anims: gltf.animations };
  bisonPivot.add(model);
  mixer = new THREE.AnimationMixer(model);
  gltf.animations.forEach(a => { actions[a.name] = mixer.clipAction(a); });
  (actions.walk || Object.values(actions)[0])?.play();
  spawnHerd();
  ui.loading.hidden = true;
  ui.play.disabled = false;
}, undefined, () => {
  ui.loading.textContent = 'The buffalo could not be loaded. Refresh to try again.';
});

function spawnHerd() {
  seed = 4242;
  const spots = [[-26, -60], [-31, -66], [-23, -71], [34, -180], [40, -188], [30, -196], [-40, -300], [-46, -296], [45, -420], [38, -430], [-14, -L - 105], [16, -L - 110]];
  spots.forEach(([x, z]) => {
    const g = new THREE.Group();
    const clone = bisonTemplate.scene.clone(true);
    g.add(clone);
    g.position.set(x, heightAt(x, z), z);
    g.rotation.y = rr(0, Math.PI * 2);
    const m = new THREE.AnimationMixer(clone);
    const clip = bisonTemplate.anims.find(a => a.name === 'walk') || bisonTemplate.anims[0];
    const a = m.clipAction(clip); a.play(); a.time = rr(0, clip.duration); a.timeScale = 0.35;
    scene.add(g); herd.push({ g, m, a, t: rr(0, 6), base: g.rotation.y });
  });
}

/* ---------- input ---------- */
const keys = new Set();
const GAME_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight'];
addEventListener('keydown', (e) => {
  if (state === 'play' && GAME_KEYS.includes(e.code)) e.preventDefault();
  if (e.target.matches?.('input, textarea')) return;
  if (state === 'play' || state === 'paused') {
    if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); state === 'play' ? pause() : resume(); return; }
    if (e.code === 'KeyM') { toggleMute(); return; }
  }
  if (state === 'paused' && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); resume(); return; }
  keys.add(e.code);
  if (state === 'play' && e.code === 'Space' && !e.repeat) jumpQueued = true;
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => { keys.clear(); if (state === 'play') pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') pause(); });

const touch = { left: false, right: false, boost: false };
ui.touch.querySelectorAll('button').forEach(b => {
  const k = b.dataset.k;
  const on = (e) => { e.preventDefault(); if (k === 'jump') jumpQueued = true; else touch[k] = true; b.classList.add('down'); };
  const off = (e) => { e.preventDefault(); if (k !== 'jump') touch[k] = false; b.classList.remove('down'); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
});
const down = (...c) => c.some(k => keys.has(k));

/* ---------- audio (tiny synth) ---------- */
let ac = null, muted = false;
function audio() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { ac = null; } } if (ac?.state === 'suspended') ac.resume(); return ac; }
function tone(freq, dur, type = 'sine', vol = 0.12, when = 0, slide = 0) {
  if (muted || !ac) return;
  const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
}
const sfx = {
  coin: () => { tone(880, 0.09, 'triangle', 0.1); tone(1320, 0.14, 'triangle', 0.09, 0.07); },
  bump: () => { tone(140, 0.25, 'sawtooth', 0.12, 0, 60); tone(90, 0.3, 'square', 0.06, 0.02, 50); },
  jump: () => tone(300, 0.18, 'sine', 0.08, 0, 620),
  fork: () => { [523, 659, 784].forEach((f, i) => tone(f, 0.3, 'triangle', 0.08, i * 0.09)); },
  end: () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.45, 'triangle', 0.08, i * 0.12)); }
};
function toggleMute() { muted = !muted; ui.mute.textContent = muted ? 'Sound off' : 'Sound on'; ui.mute.setAttribute('aria-pressed', String(!muted)); }
ui.mute.addEventListener('click', toggleMute);

/* ---------- narration ---------- */
const lines = {
  start: ['Behold: a buffalo. Investors are already calling it an AI.', 'Our buffalo sets off on the road to product-market fit.', 'One buffalo. One road. Zero clear business model.'],
  coin: ['You collected an AI. It is also a buffalo. Valuation up.', 'Another AI token. Your toaster is jealous.', 'That AI was trained on other buffalo. Ethically sourced.', 'The board asks if you can add more AI. You can.', 'You now have more AI than a smart fridge.', 'Collected. A press release has already gone out.', 'Analysts call this a herd mentality. They mean it as praise.', 'Each token is worth $1.2 billion and nothing at the same time.'],
  bump: ['That hay bale was not disrupted. You were.', 'Move fast and break things, including yourself.', 'Legal says the cone was a legacy system.', 'A minor setback. Marketing will call it a learning opportunity.', 'Ouch. That one will be in the quarterly report.'],
  jump: ['A buffalo leaping over a problem. Very on brand.'],
  boost: ['Sprinting. The deck calls this hypergrowth.'],
  m25: ['Fun fact: the buffalo does not know it is AI. Neither does most AI.'],
  m50: ['Halfway there. The roadmap now just says "Q3."'],
  m75: ['A fork approaches. Like most big decisions, it will not matter.'],
  m90: ['Pick a lane. Left is AI. Right is Buffalo. They are on the same slide.'],
  choseAI: ['You chose AI. Bold. Visionary. Identical.'],
  choseBuf: ['You chose Buffalo. A classic. Some say timeless. Others say "also AI."']
};
const used = {};
function say(key, force) {
  const arr = lines[key]; if (!arr) return;
  if (!force && capBusy > 0 && key !== 'm25' && key !== 'm50' && key !== 'm75' && key !== 'm90' && !key.startsWith('chose')) return;
  used[key] = used[key] || [];
  if (used[key].length >= arr.length) used[key] = [];
  let i; do { i = Math.floor(Math.random() * arr.length); } while (used[key].includes(i) && arr.length > 1);
  used[key].push(i);
  ui.cap.textContent = arr[i];
  ui.cap.classList.remove('show'); void ui.cap.offsetWidth; ui.cap.classList.add('show');
  capBusy = 3.6;
}
let capBusy = 0;

/* ---------- game state ---------- */
let state = 'attract';
let s = 0, u = 0, y = 0, vy = 0, speed = 0, lat = 0, branch = null;
let hype = 1, valuation = 0, aiCount = 0, bales = 0, time = 0, stun = 0, shake = 0, jumpQueued = false;
let milestones = {}, boosted = false, jumped = false, endT = 0;
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
let viewOff = 0;

function reset() {
  s = 0; u = 0; y = 0; vy = 0; speed = 0; lat = 0; branch = null; hype = 1; valuation = 0; aiCount = 0; bales = 0; time = 0; stun = 0; shake = 0;
  milestones = {}; boosted = false; jumped = false; jumpQueued = false; endT = 0;
  buildItems();
  placePlayer(0);
}
function start() {
  audio();
  reset();
  state = 'play';
  wrap.classList.add('playing', 'started');
  ui.end.hidden = true; ui.pause.hidden = true; ui.hud.hidden = false;
  actions.walk?.stop(); actions.run?.reset().play();
  say('start', true);
  canvas.focus({ preventScroll: true });
}
function pause() { if (state !== 'play') return; state = 'paused'; ui.pause.hidden = false; keys.clear(); }
function resume() { if (state !== 'paused') return; state = 'play'; ui.pause.hidden = true; clock.getDelta(); canvas.focus({ preventScroll: true }); }

ui.play.addEventListener('click', start);
function exitGame() {
  state = 'attract'; keys.clear();
  wrap.classList.remove('playing', 'started');
  ui.end.hidden = true; ui.pause.hidden = true; ui.hud.hidden = true; ui.cap.classList.remove('show');
  reset(); actions.run?.stop(); actions.walk?.reset().play();
}
ui.exit?.addEventListener('click', exitGame);
ui.exitEnd?.addEventListener('click', exitGame);
ui.again.addEventListener('click', start);
ui.resume.addEventListener('click', resume);
canvas.addEventListener('click', () => { if (state === 'paused') resume(); });

function fmtMoney(v) { return v >= 1000 ? '$' + (v / 1000).toFixed(2) + 'T' : '$' + v.toFixed(1) + 'B'; }

function finish() {
  state = 'ending'; endT = 0; ui.cap.classList.remove('show');
  sfx.end();
  wrap.classList.remove('playing');
  const isAI = branch === '-1';
  ui.endTitle.textContent = isAI ? 'You chose AI.' : 'You chose Buffalo.';
  ui.endBody.textContent = isAI
    ? 'Rebrand complete. You are now an AI-powered buffalo, which is a buffalo. Both roads end in Buffalo, New York, where everyone says they saw it coming.'
    : 'Congratulations: an AI startup has acquired you. Your new title is Buffalo, AI. The road you skipped ends in the same parking lot.';
  ui.endStats.innerHTML = `
    <div><b>${fmtMoney(valuation)}</b><span>Final valuation</span></div>
    <div><b>${aiCount}</b><span>AI collected</span></div>
    <div><b>${bales}</b><span>Hay bales disrupted</span></div>
    <div><b>${time.toFixed(1)}s</b><span>Time to Buffalo</span></div>`;
  const q = isAI ? 'AI' : 'buffalo', other = isAI ? 'buffalo' : 'AI';
  ui.ytChoice.href = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
  ui.ytChoice.textContent = `Search YouTube for "${q}"`;
  ui.ytOther.href = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(other);
  ui.ytOther.textContent = `Or "${other}". Same thing.`;
  setTimeout(() => { if (state === 'ending') { ui.end.hidden = false; ui.hud.hidden = true; ui.again.focus({ preventScroll: true }); } }, 2600);
}

/* ---------- per-frame ---------- */
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
function placePlayer(dt) {
  const f = frame(s, branch);
  toWorld(s, u, branch, player.position);
  player.position.y = y;
  const heading = Math.atan2(-f.tan.x, -f.tan.z);
  const yaw = heading - lat * 0.06;
  player.rotation.y = yaw;
  bisonPivot.rotation.z = THREE.MathUtils.lerp(bisonPivot.rotation.z, lat * 0.012, Math.min(dt * 8, 1));
  bisonPivot.rotation.x = stun > 0 ? Math.sin(stun * 30) * 0.08 : (y > 0 ? -vy * 0.02 : 0);
}

function update(dt) {
  time += dt;
  const fwd = down('KeyW', 'ArrowUp'), back = down('KeyS', 'ArrowDown');
  const l = down('KeyA', 'ArrowLeft') || touch.left, r = down('KeyD', 'ArrowRight') || touch.right;
  const wantBoost = (down('ShiftLeft', 'ShiftRight') || touch.boost) && hype > 0.02;

  let target = 15;
  if (fwd) target = 21; if (back) target = 7;
  if (wantBoost) { target = 29; hype = Math.max(0, hype - dt * 0.45); if (!boosted) { boosted = true; say('boost'); } }
  else hype = Math.min(1, hype + dt * 0.12);
  if (stun > 0) { stun -= dt; target = Math.min(target, 6); }
  speed += (target - speed) * Math.min(dt * (target > speed ? 1.6 : 4), 1);

  const steer = (r ? 1 : 0) - (l ? 1 : 0);
  lat += (steer * 11 - lat) * Math.min(dt * 9, 1);
  u = THREE.MathUtils.clamp(u + lat * dt, -LANE_LIMIT, LANE_LIMIT);
  if (Math.abs(u) >= LANE_LIMIT) lat *= 0.5;

  if (jumpQueued && y <= 0.001) { vy = 9.2; sfx.jump(); if (!jumped) { jumped = true; say('jump'); } }
  jumpQueued = false;
  vy -= 26 * dt; y = Math.max(0, y + vy * dt); if (y === 0) { if (vy < -6) emitDust(player.position, 6, 1.5); vy = 0; }

  const prevS = s;
  s += speed * dt;

  // fork decision
  if (!branch && s > L) {
    branch = u < 0 ? '-1' : '1';
    sfx.fork();
    say(branch === '-1' ? 'choseAI' : 'choseBuf', true);
    items.forEach(it => { if (it.alive && it.s > L - 2) it.alive = false; });
  }
  // milestones
  const frac = Math.min(s / L, 1);
  for (const [k, v] of [['m25', 0.25], ['m50', 0.5], ['m75', 0.75], ['m90', 0.88]]) if (!milestones[k] && frac >= v) { milestones[k] = 1; say(k, true); }

  // collisions
  for (const it of items) {
    if (!it.alive || it.s < prevS - 3 || it.s > s + 3) continue;
    const ds = Math.abs(it.s - s), du = Math.abs(it.u - u);
    if (it.type === 'coin' && ds < 1.4 && du < 1.25 && y < 2.2) {
      it.alive = false; it.obj.visible = false; aiCount++; valuation += 1.2 + aiCount * 0.15;
      sfx.coin(); if (aiCount % 3 === 1) say('coin');
      emitDust(it.obj.position, 4, 2);
    } else if ((it.type === 'bale' && ds < 1.25 && du < 1.6 && y < 1.25) || (it.type === 'cone' && ds < 0.9 && du < 0.8 && y < 0.7)) {
      it.alive = false; bales += it.type === 'bale' ? 1 : 0;
      speed *= 0.35; stun = 0.7; shake = 0.5; sfx.bump(); say('bump', true);
      valuation = Math.max(0, valuation - 0.8);
      it.knock = { vx: (it.u - u || 0.5) * 3 + rr(-2, 2), vy: 6, vz: -speed * 0.8 - 6, spin: rr(-8, 8) };
      emitDust(it.obj.position, 10, 2.5);
    }
  }

  placePlayer(dt);
  if (y === 0 && speed > 8 && Math.random() < dt * speed * 0.35) emitDust(player.position, 1);

  // HUD
  ui.val.textContent = fmtMoney(valuation);
  ui.ai.textContent = aiCount;
  ui.prog.style.width = (frac * 100).toFixed(1) + '%';
  ui.hype.style.width = (hype * 100).toFixed(0) + '%';

  if (branch && s - L > ENDING_AT) finish();
}

function updateEnding(dt) {
  endT += dt;
  speed = Math.max(0, speed - dt * 8);
  s += speed * dt;
  placePlayer(dt);
}

function updateItems(dt, t) {
  for (const it of items) {
    if (it.type === 'coin' && it.alive) { it.obj.rotation.y = t * 2.6 + it.phase; it.obj.position.y = 1.1 + Math.sin(t * 3 + it.phase) * 0.15; }
    if (it.knock) {
      const k = it.knock; it.obj.position.x += k.vx * dt; it.obj.position.y += k.vy * dt; it.obj.position.z += k.vz * dt;
      k.vy -= 22 * dt; it.obj.rotation.x += k.spin * dt;
      if (it.obj.position.y < -2) { it.obj.visible = false; it.knock = null; }
    }
  }
}

function updateCamera(dt, t) {
  const f = frame(s, branch);
  const fwd = tmp.set(f.tan.x, 0, f.tan.z).normalize();
  let desired, look;
  if (state === 'attract') {
    const a = 0.9 + Math.sin(t * 0.07) * 0.9;
    desired = tmp2.set(player.position.x + Math.sin(a) * 7.5, 1.6 + Math.sin(t * 0.21) * 0.35, player.position.z + Math.cos(a) * 7.5);
    look = new THREE.Vector3(player.position.x, 1.5, player.position.z);
  } else if (state === 'ending') {
    const k = smooth(0, 3.2, endT);
    const crane = new THREE.Vector3(0, 70, -L + 40);
    const chase = player.position.clone().addScaledVector(fwd, -8); chase.y += 3.4;
    desired = chase.lerp(crane, k);
    look = player.position.clone().lerp(new THREE.Vector3(0, 0, -L - 170), k);
  } else {
    desired = tmp2.copy(player.position).addScaledVector(fwd, -7.5 - speed * 0.06); desired.y = 3.1 + speed * 0.02;
    look = player.position.clone().addScaledVector(fwd, 7); look.y = 1.2;
  }
  const lerp = state === 'ending' ? Math.min(dt * 2.5, 1) : Math.min(dt * 5, 1);
  camPos.lerp(desired, lerp); camLook.lerp(look, lerp);
  camera.position.copy(camPos);
  if (shake > 0) { shake -= dt; camera.position.x += rr(-1, 1) * shake * 0.5; camera.position.y += rr(-1, 1) * shake * 0.4; }
  camera.lookAt(camLook);
  const fov = state === 'play' ? 58 + Math.max(0, speed - 15) * 0.7 : 55;
  camera.fov += (fov - camera.fov) * Math.min(dt * 3, 1);
  const w = wrap.clientWidth, h = wrap.clientHeight;
  const wantOff = state === 'attract' && w > 900 ? -w * 0.2 : 0;
  viewOff += (wantOff - viewOff) * Math.min(dt * 3, 1);
  if (Math.abs(viewOff) > 0.5) camera.setViewOffset(w, h, viewOff, 0, w, h); else camera.clearViewOffset();
  camera.updateProjectionMatrix();

  sun.position.copy(player.position).addScaledVector(sunDir, 80);
  sun.target.position.copy(player.position);
}

/* ---------- loop ---------- */
const clock = new THREE.Clock();
let visible = true, elapsed = 0;
new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (!visible && state === 'play') pause(); }, { threshold: 0.15 }).observe(wrap);

function resize() {
  const w = wrap.clientWidth, h = wrap.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(wrap); resize();

camPos.set(8, 3, 6); camLook.set(0, 1, 0);
buildItems(); placePlayer(0);

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 1 / 20);
  if (!visible || document.hidden) return;
  if (state === 'paused') { renderer.render(scene, camera); return; }
  elapsed += dt;
  if (state === 'play') update(dt);
  if (state === 'ending') updateEnding(dt);
  if (capBusy > 0) { capBusy -= dt; if (capBusy <= 0) ui.cap.classList.remove('show'); }
  if (mixer) {
    if (actions.run) actions.run.timeScale = state === 'attract' ? 1 : Math.max(0.3, speed / 16);
    if (state === 'ending' && speed < 3 && actions.run?.isRunning()) { actions.run.fadeOut(0.5); actions.walk?.reset().fadeIn(0.5).play(); }
    mixer.update(dt * (y > 0 ? 0.3 : 1));
  }
  for (const h of herd) { h.m.update(dt); h.t += dt; h.g.rotation.y = h.base + Math.sin(h.t * 0.2) * 0.6; }
  updateItems(dt, elapsed);
  updateDust(dt);
  for (const c of clouds) { c.position.x += c.userData.v * dt; if (c.position.x > 300) c.position.x = -300; }
  updateCamera(dt, elapsed);
  renderer.render(scene, camera);
}
loop();

// expose for debugging/tests
window.__buffaloGame = { get state() { return state; }, get s() { return s; }, start, finish: () => { branch = branch || '1'; finish(); }, setS: (v) => { s = v; } };

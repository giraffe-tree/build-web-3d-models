import './styles.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const app = document.querySelector('#app');
const canvas = document.querySelector('#scene');
const loading = document.querySelector('#loading');
const runtimeState = document.querySelector('#runtime-state');
const buttons = [...document.querySelectorAll('[data-view]')];
const params = new URLSearchParams(location.search);
const captureMode = params.get('capture') === '1';
document.body.dataset.capture = String(captureMode);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .86;
renderer.info.autoReset = false;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x101316, 0.070);

const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.04, 30);
const controls = new OrbitControls(camera, canvas);
controls.enabled = !captureMode;
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.minDistance = 1.15;
controls.maxDistance = 4.2;
controls.minPolarAngle = Math.PI * 0.18;
controls.maxPolarAngle = Math.PI * 0.50;
controls.target.set(0, 0.67, 0);

const pmrem = new THREE.PMREMGenerator(renderer);
const room = new RoomEnvironment();
const roomTexture = pmrem.fromScene(room, 0.035).texture;
scene.environment = roomTexture;
scene.environmentIntensity = .62;
room.dispose();
pmrem.dispose();

const views = {
  hero: { position: [2.03, 1.38, 2.98], target: [0.02, 0.65, 0], fov: 30, exposure: .86, neutral: false },
  orbitA: { position: [-2.58, 1.27, 3.26], target: [0, 0.62, 0], fov: 31, exposure: .88, neutral: false },
  orbitB: { position: [2.32, 1.28, -2.32], target: [0, 0.69, 0.02], fov: 31, exposure: .90, neutral: false },
  neutralMaterial: { position: [1.62, 1.19, 3.27], target: [0, 0.66, 0], fov: 30, exposure: .96, neutral: true },
  subjectProof: { position: [1.11, 0.72, 1.18], target: [0.13, 0.48, 0.02], fov: 27, exposure: .91, neutral: false },
};

let currentView = 'hero';
let chair = null;
let fixedViewTween = null;
let lastFrame = performance.now();
let frameSamples = [];

function canvasTexture(size, paint, { repeat = [1, 1], colorSpace = THREE.SRGBColorSpace } = {}) {
  const element = document.createElement('canvas');
  element.width = element.height = size;
  const ctx = element.getContext('2d');
  paint(ctx, size);
  const texture = new THREE.CanvasTexture(element);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat);
  texture.colorSpace = colorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  texture.needsUpdate = true;
  return texture;
}

const seatColor = canvasTexture(256, (ctx, s) => {
  ctx.fillStyle = '#635b55';
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < s; i += 4) {
    ctx.strokeStyle = i % 8 ? 'rgba(220,205,193,.10)' : 'rgba(18,20,22,.14)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 34, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i + 27); ctx.stroke();
  }
  const grain = ctx.createImageData(s, s);
  for (let p = 0; p < grain.data.length; p += 4) {
    const n = ((p * 17 + (p >> 8) * 29) % 21) - 10;
    grain.data[p] = grain.data[p + 1] = grain.data[p + 2] = 128 + n;
    grain.data[p + 3] = 16;
  }
  ctx.putImageData(grain, 0, 0);
}, { repeat: [7, 7] });

const seatBump = canvasTexture(128, (ctx, s) => {
  ctx.fillStyle = '#777'; ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = '#c8c8c8'; ctx.lineWidth = 1;
  for (let i = -s; i < s * 2; i += 5) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - s, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + s, s); ctx.stroke();
  }
}, { repeat: [8, 8], colorSpace: THREE.NoColorSpace });

const meshColor = canvasTexture(256, (ctx, s) => {
  ctx.fillStyle = '#1c2931'; ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = 'rgba(98,123,138,.24)'; ctx.lineWidth = 1;
  for (let i = -s; i < s * 2; i += 14) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - s * .55, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + s * .55, s); ctx.stroke();
  }
}, { repeat: [3, 6] });

const meshBump = canvasTexture(128, (ctx, s) => {
  ctx.fillStyle = '#666'; ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = '#d0d0d0'; ctx.lineWidth = 1;
  for (let i = -s; i < s * 2; i += 12) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - s * .5, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + s * .5, s); ctx.stroke();
  }
}, { repeat: [3, 6], colorSpace: THREE.NoColorSpace });

const runtimeMaterials = {
  Graphite_Satin: new THREE.MeshPhysicalMaterial({ color: 0x131a20, metalness: .14, roughness: .30, clearcoat: .26, clearcoatRoughness: .37 }),
  Graphite_Soft: new THREE.MeshPhysicalMaterial({ color: 0x1b2329, metalness: 0, roughness: .52, sheen: .15, sheenRoughness: .8, sheenColor: new THREE.Color(0x59636a) }),
  Black_Elastomer: new THREE.MeshPhysicalMaterial({ color: 0x090b0d, metalness: 0, roughness: .66, clearcoat: .06 }),
  Basalt_Textile: new THREE.MeshPhysicalMaterial({ color: 0x8a7c72, map: seatColor, bumpMap: seatBump, bumpScale: .022, roughness: .72, sheen: .34, sheenRoughness: .79, sheenColor: new THREE.Color(0xbca89b) }),
  Suspension_Mesh: new THREE.MeshPhysicalMaterial({ color: 0x21313a, map: meshColor, opacity: .72, transparent: true, depthWrite: true, bumpMap: meshBump, bumpScale: .004, side: THREE.DoubleSide, roughness: .62, sheen: .32, sheenRoughness: .78, sheenColor: new THREE.Color(0x526876) }),
  Anodized_Copper: new THREE.MeshPhysicalMaterial({ color: 0xa64d29, metalness: .91, roughness: .26, clearcoat: .24, clearcoatRoughness: .2 }),
  Brushed_Steel: new THREE.MeshPhysicalMaterial({ color: 0x9ca6ad, metalness: .94, roughness: .27, anisotropy: .28 }),
};

function applyPlanarUV(geometry) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const size = new THREE.Vector3(); box.getSize(size);
  const pos = geometry.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  const verticalIsY = size.y > size.z;
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - box.min.x) / Math.max(size.x, .0001);
    uv[i * 2 + 1] = verticalIsY
      ? (pos.getY(i) - box.min.y) / Math.max(size.y, .0001)
      : (pos.getZ(i) - box.min.z) / Math.max(size.z, .0001);
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

function configureModel(root) {
  let meshCount = 0;
  root.traverse((object) => {
    if (!object.isMesh) return;
    meshCount++;
    const sourceName = object.material?.name;
    if (object.name.includes('Back_Suspension')) applyPlanarUV(object.geometry);
    if (runtimeMaterials[sourceName]) object.material = runtimeMaterials[sourceName];
    object.castShadow = !object.name.includes('Back_Suspension') && !object.name.includes('Tread');
    object.receiveShadow = true;
  });
  root.userData.meshCount = meshCount;
  return root;
}

function addStage() {
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(4.7, 128),
    new THREE.MeshPhysicalMaterial({ color: 0x171b1d, roughness: .68, metalness: .05, clearcoat: .08 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.005;
  floor.receiveShadow = true;
  floor.name = 'Gallery_Floor';
  scene.add(floor);

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(.64, .648, 128),
    new THREE.MeshBasicMaterial({ color: 0x7c3f29, transparent: true, opacity: .22, depthWrite: false })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = .002;
  scene.add(halo);

  const key = new THREE.SpotLight(0xffe2ce, 82, 8, Math.PI * .24, .68, 1.2);
  key.position.set(-2.4, 3.8, 2.7);
  key.target.position.set(0, .65, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1536, 1536);
  key.shadow.bias = -0.00015;
  key.shadow.normalBias = .018;
  key.shadow.camera.near = .5;
  key.shadow.camera.far = 8;
  scene.add(key, key.target);

  const rim = new THREE.SpotLight(0x7ab7d6, 68, 7, Math.PI * .25, .72, 1.3);
  rim.position.set(2.5, 2.2, -2.5);
  rim.target.position.set(0, .8, 0);
  scene.add(rim, rim.target);

  const warm = new THREE.PointLight(0xd07549, 12, 3, 1.6);
  warm.position.set(-1.1, .26, .65);
  scene.add(warm);

  const hemi = new THREE.HemisphereLight(0xb8c8d3, 0x2a1810, .42);
  scene.add(hemi);
}

addStage();

function setNeutralMode(enabled) {
  app.classList.toggle('neutral', enabled);
  scene.fog.color.set(enabled ? 0xd1d1cc : 0x101316);
  scene.fog.density = enabled ? .035 : .070;
  renderer.toneMappingExposure = enabled ? .96 : views[currentView].exposure;
  scene.children.forEach((object) => {
    if (object.name === 'Gallery_Floor') {
      object.material.color.set(enabled ? 0xbbbcb8 : 0x171b1d);
      object.material.roughness = enabled ? .82 : .68;
    }
  });
}

function activateView(name, immediate = false, updateUrl = true) {
  const next = views[name] ? name : 'hero';
  currentView = next;
  const preset = views[next];
  app.dataset.viewMode = next;
  buttons.forEach((button) => button.classList.toggle('active', button.dataset.view === next));
  setNeutralMode(preset.neutral);
  document.querySelector('#diag-view').textContent = next.replace('neutralMaterial', 'MATERIAL').toUpperCase();
  if (updateUrl) history.replaceState({}, '', `?view=${next}`);

  const startPosition = camera.position.clone();
  const startTarget = controls.target.clone();
  const endPosition = new THREE.Vector3(...preset.position);
  const endTarget = new THREE.Vector3(...preset.target);
  const startFov = camera.fov;
  if (immediate) {
    camera.position.copy(endPosition);
    controls.target.copy(endTarget);
    camera.fov = preset.fov;
    camera.updateProjectionMatrix();
    controls.update();
    fixedViewTween = null;
  } else {
    fixedViewTween = { start: performance.now(), duration: 900, startPosition, startTarget, endPosition, endTarget, startFov, endFov: preset.fov };
  }
  window.__CHAIR_VIEW__ = next;
}

buttons.forEach((button) => button.addEventListener('click', () => activateView(button.dataset.view)));
window.addEventListener('keydown', (event) => {
  const keyMap = { '1': 'hero', '2': 'orbitA', '3': 'orbitB', '4': 'neutralMaterial', '5': 'subjectProof' };
  if (keyMap[event.key]) activateView(keyMap[event.key]);
});

const requestedView = params.get('view') || 'hero';
activateView(requestedView, true, false);

new GLTFLoader().load(
  '/assets/vela-chair.glb',
  (gltf) => {
    chair = configureModel(gltf.scene);
    chair.name = 'VELA_01_Runtime';
    scene.add(chair);
    runtimeState.textContent = 'WEBGL / LIVE';
    loading.classList.add('hidden');
    window.__CHAIR_READY__ = true;
  },
  (progress) => {
    if (progress.total) runtimeState.textContent = `LOADING ${Math.round(progress.loaded / progress.total * 100)}%`;
  },
  (error) => {
    runtimeState.textContent = 'LOAD FAILED';
    window.__CHAIR_ERROR__ = String(error);
    console.error(error);
  }
);

function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.max(1, Math.min(100, now - lastFrame));
  lastFrame = now;
  frameSamples.push(dt);
  if (frameSamples.length > 90) frameSamples.shift();

  if (fixedViewTween) {
    const t = Math.min(1, (now - fixedViewTween.start) / fixedViewTween.duration);
    const eased = easeInOut(t);
    camera.position.lerpVectors(fixedViewTween.startPosition, fixedViewTween.endPosition, eased);
    controls.target.lerpVectors(fixedViewTween.startTarget, fixedViewTween.endTarget, eased);
    camera.fov = THREE.MathUtils.lerp(fixedViewTween.startFov, fixedViewTween.endFov, eased);
    camera.updateProjectionMatrix();
    if (t >= 1) fixedViewTween = null;
  }

  controls.update();
  renderer.info.reset();
  const cpuStart = performance.now();
  renderer.render(scene, camera);
  const cpuMs = performance.now() - cpuStart;
  const renderInfo = renderer.info.render;
  const fps = frameSamples.length ? 1000 / (frameSamples.reduce((a, b) => a + b, 0) / frameSamples.length) : 0;
  document.querySelector('#diag-tris').textContent = `${renderInfo.triangles.toLocaleString()} TRI`;
  document.querySelector('#diag-calls').textContent = `${renderInfo.calls} CALLS`;
  document.querySelector('#diag-fps').textContent = `${Math.round(fps)} FPS`;
  window.__CHAIR_EVIDENCE__ = {
    assetId: 'vela-chair-01',
    semanticState: 'rest',
    view: currentView,
    fixedTimeSeconds: 0,
    viewport: { width: innerWidth, height: innerHeight, dpr: renderer.getPixelRatio() },
    renderer: { webgl2: renderer.capabilities.isWebGL2, calls: renderInfo.calls, triangles: renderInfo.triangles, points: renderInfo.points, lines: renderInfo.lines, cpuRenderMs: Number(cpuMs.toFixed(3)), fpsDiagnostic: Number(fps.toFixed(1)) },
    memory: { geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures },
    meshes: chair?.userData.meshCount || 0,
    ready: Boolean(window.__CHAIR_READY__),
  };
}

requestAnimationFrame(animate);

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
});

window.__SET_CHAIR_VIEW__ = (name) => activateView(name, true);

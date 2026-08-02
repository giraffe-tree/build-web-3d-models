import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import "./style.css";

const canvas = document.querySelector("#viewport");
const demoList = document.querySelector("#demo-list");
const demoCount = document.querySelector("#demo-count");
const emptyState = document.querySelector("#empty-state");
const motionToggle = document.querySelector("#motion-toggle");
const title = document.querySelector("#demo-title");
const category = document.querySelector("#demo-category");
const description = document.querySelector("#demo-description");
const metricFps = document.querySelector("#metric-fps");
const metricTris = document.querySelector("#metric-tris");
const metricDraws = document.querySelector("#metric-draws");
const metricGeometries = document.querySelector("#metric-geometries");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#090b0f");
scene.fog = new THREE.FogExp2("#090b0f", 0.018);

const camera = new THREE.PerspectiveCamera(38, 1, 0.02, 400);
camera.position.set(5.5, 3.5, 7);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.minDistance = 0.5;
controls.maxDistance = 80;
controls.target.set(0, 0.8, 0);

const world = new THREE.Group();
scene.add(world);

const hemisphere = new THREE.HemisphereLight("#b9d7ff", "#25150d", 1.65);
scene.add(hemisphere);

const keyLight = new THREE.DirectionalLight("#fff0dd", 4.2);
keyLight.position.set(5, 8, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.near = 0.2;
keyLight.shadow.camera.far = 50;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight("#5c82ff", 2.2);
rimLight.position.set(-6, 4, -4);
scene.add(rimLight);

const floorMaterial = new THREE.MeshStandardMaterial({
  color: "#14161b",
  roughness: 0.88,
  metalness: 0.02,
});
const floor = new THREE.Mesh(new THREE.CircleGeometry(28, 96), floorMaterial);
floor.name = "shared-ground";
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const rawModules = import.meta.glob("./demos/*.js", { eager: true });
const demos = Object.values(rawModules)
  .filter((module) => module.meta && typeof module.createDemo === "function")
  .sort((a, b) => (a.meta.order ?? 999) - (b.meta.order ?? 999));

let activeModule = null;
let activeDemo = null;
let motionEnabled = true;
let activeButton = null;
let elapsed = 0;
let fps = 60;
const demoButtons = new Map();

function formatCount(count) {
  return `${count} experiment${count === 1 ? "" : "s"}`;
}

function disposeMaterial(material) {
  for (const value of Object.values(material)) {
    if (value?.isTexture) value.dispose();
  }
  material.dispose();
}

function disposeObject(root) {
  root.traverse((object) => {
    object.geometry?.dispose();
    if (Array.isArray(object.material)) object.material.forEach(disposeMaterial);
    else if (object.material) disposeMaterial(object.material);
  });
}

function clearActiveDemo() {
  if (!activeDemo) return;
  activeDemo.dispose?.();
  world.remove(activeDemo.root);
  disposeObject(activeDemo.root);
  activeDemo = null;
}

function frameObject(root, meta) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const target = meta.target
    ? new THREE.Vector3(...meta.target)
    : sphere.center.clone();
  const direction = new THREE.Vector3(...(meta.cameraDirection ?? [1.4, 0.9, 1.8])).normalize();
  const radius = Math.max(sphere.radius, 0.45);
  const distance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov * 0.46));

  camera.near = Math.max(distance / 180, 0.02);
  camera.far = Math.max(distance * 30, 80);
  camera.position.copy(target).addScaledVector(direction, distance);
  camera.updateProjectionMatrix();
  controls.target.copy(target);
  controls.minDistance = Math.max(radius * 0.45, 0.2);
  controls.maxDistance = Math.max(radius * 12, 8);
  controls.update();
}

function updateUrl(id) {
  const url = new URL(window.location.href);
  url.searchParams.set("demo", id);
  window.history.replaceState({}, "", url);
}

function selectDemo(module, button) {
  document.body.dataset.ready = "false";
  clearActiveDemo();
  activeModule = module;
  activeButton?.classList.remove("is-active");
  activeButton = button;
  activeButton?.classList.add("is-active");

  const meta = module.meta;
  try {
    activeDemo = module.createDemo();
    if (!activeDemo?.root?.isObject3D) throw new Error("createDemo() must return a Three.js root Object3D");
    world.add(activeDemo.root);
    frameObject(activeDemo.root, meta);
    scene.background.set(meta.background ?? "#090b0f");
    scene.fog.color.copy(scene.background);
    document.documentElement.style.setProperty("--accent", meta.accent ?? "#ff7a1a");
    title.textContent = meta.title;
    category.textContent = meta.category ?? "FORWARD TEST";
    description.textContent = meta.description;
    emptyState.hidden = true;
    elapsed = 0;
    updateUrl(meta.id);
    requestAnimationFrame(() => {
      document.body.dataset.ready = "true";
    });
  } catch (error) {
    console.error(`Failed to load demo ${meta.id}`, error);
    title.textContent = "Demo failed to load";
    description.textContent = error.message;
    emptyState.hidden = false;
  }
}

function buildNavigation() {
  demoCount.textContent = formatCount(demos.length);
  demos.forEach((module, index) => {
    const button = document.createElement("button");
    button.className = "demo-card";
    button.type = "button";
    button.innerHTML = `
      <span class="demo-card__index">${String(index + 1).padStart(2, "0")}</span>
      <span class="demo-card__body">
        <strong>${module.meta.title}</strong>
        <small>${module.meta.category}</small>
      </span>
      <span class="demo-card__arrow">↗</span>
    `;
    button.addEventListener("click", () => selectDemo(module, button));
    demoList.append(button);
    demoButtons.set(module.meta.id, button);
  });

  const requestedId = new URLSearchParams(window.location.search).get("demo");
  const initial = demos.find((module) => module.meta.id === requestedId) ?? demos[0];
  if (initial) selectDemo(initial, demoButtons.get(initial.meta.id));
  else document.body.dataset.ready = "true";
}

motionToggle.addEventListener("click", () => {
  motionEnabled = !motionEnabled;
  motionToggle.setAttribute("aria-pressed", String(motionEnabled));
  motionToggle.textContent = motionEnabled ? "Motion on" : "Motion off";
  if (!motionEnabled) activeDemo?.reset?.();
});

function resizeRenderer() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const pixelRatio = renderer.getPixelRatio();
  const needsResize = canvas.width !== Math.floor(width * pixelRatio)
    || canvas.height !== Math.floor(height * pixelRatio);
  if (!needsResize) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(height, 1);
  camera.updateProjectionMatrix();
}

const timer = new THREE.Timer();
function animate() {
  requestAnimationFrame(animate);
  timer.update();
  const delta = Math.min(timer.getDelta(), 0.05);
  elapsed += delta;
  fps += ((1 / Math.max(delta, 0.001)) - fps) * 0.04;
  activeDemo?.update?.(delta, elapsed, motionEnabled);
  controls.update();
  resizeRenderer();
  renderer.render(scene, camera);

  metricFps.textContent = String(Math.round(Math.min(fps, 999)));
  metricTris.textContent = renderer.info.render.triangles.toLocaleString("en-US");
  metricDraws.textContent = renderer.info.render.calls.toLocaleString("en-US");
  metricGeometries.textContent = renderer.info.memory.geometries.toLocaleString("en-US");
}

window.__SHOWCASE__ = {
  get ready() { return document.body.dataset.ready === "true"; },
  get activeId() { return activeModule?.meta.id ?? null; },
  get demoIds() { return demos.map((module) => module.meta.id); },
  getMetrics() {
    return {
      fps: Math.round(fps),
      triangles: renderer.info.render.triangles,
      drawCalls: renderer.info.render.calls,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
    };
  },
  selectDemo(id) {
    const module = demos.find((candidate) => candidate.meta.id === id);
    if (module) selectDemo(module, demoButtons.get(module.meta.id));
    return Boolean(module);
  },
};

buildNavigation();
animate();

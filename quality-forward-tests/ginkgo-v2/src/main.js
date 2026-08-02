import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import './style.css';

const SEED = 19760123;
const params = new URLSearchParams(window.location.search);
const requestedView = params.get('view') || 'hero';
const captureMode = params.get('capture') === '1';
const requestedTime = params.get('time');
const fixedTime = requestedTime !== null && Number.isFinite(Number(requestedTime)) ? Number(requestedTime) : null;
const isFrozen = captureMode || fixedTime !== null;
const bootStart = performance.now();
const canvas = document.querySelector('#scene');
const statusEl = document.querySelector('#status');
const app = document.querySelector('#app');

if (captureMode) document.body.classList.add('capture');

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(SEED);
const rand = (min, max) => min + (max - min) * random();
const choose = (array) => array[Math.floor(random() * array.length)];
const clamp = THREE.MathUtils.clamp;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xded9cc, 0.0085);

const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.info.autoReset = false;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.minDistance = 5;
controls.maxDistance = 31;
controls.maxPolarAngle = Math.PI * 0.515;
controls.minPolarAngle = Math.PI * 0.1;
controls.enablePan = false;

const world = new THREE.Group();
world.name = 'GinkgoShowcase';
world.position.x = 1.85;
scene.add(world);

const windUniforms = {
  uWindTime: { value: 0 },
  uWindStrength: { value: 0.18 },
};

const palette = {
  bark: new THREE.Color(0x766452),
  barkDark: new THREE.Color(0x40382f),
  leafGreen: new THREE.Color(0xc2cf5a),
  leafChartreuse: new THREE.Color(0xdfd465),
  leafGold: new THREE.Color(0xefbd3e),
  limestone: new THREE.Color(0xcfc8b5),
};

function createBarkTexture() {
  const size = 512;
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext('2d');
  context.fillStyle = '#99958b';
  context.fillRect(0, 0, size, size);

  const barkRandom = mulberry32(44013);
  for (let x = -14; x < size + 18; x += 9 + barkRandom() * 9) {
    context.beginPath();
    context.moveTo(x, -5);
    for (let y = 0; y <= size + 10; y += 13) {
      const drift = Math.sin(y * 0.033 + x * 0.04) * 4 + (barkRandom() - 0.5) * 5;
      context.lineTo(x + drift, y);
    }
    context.lineWidth = 2 + barkRandom() * 4;
    context.strokeStyle = `rgba(51,47,42,${0.22 + barkRandom() * 0.24})`;
    context.stroke();
  }

  for (let i = 0; i < 150; i += 1) {
    const x = barkRandom() * size;
    const y = barkRandom() * size;
    context.fillStyle = `rgba(235,229,211,${0.035 + barkRandom() * 0.08})`;
    context.fillRect(x, y, 1 + barkRandom() * 3, 8 + barkRandom() * 24);
  }

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 4.5);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.name = 'Generated longitudinal bark detail';
  return texture;
}

function createLeafVeinTexture() {
  const size = 256;
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext('2d');
  const gradient = context.createLinearGradient(0, size, 0, 0);
  gradient.addColorStop(0, '#dfe5b8');
  gradient.addColorStop(0.35, '#f3f0cd');
  gradient.addColorStop(1, '#fff9d9');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  context.lineCap = 'round';
  for (let i = 0; i <= 30; i += 1) {
    const angle = THREE.MathUtils.lerp(-1.24, 1.24, i / 30);
    const radius = size * (0.43 - 0.1 * Math.exp(-Math.pow(angle / 0.18, 2)));
    const endX = size * 0.5 + Math.sin(angle) * radius * 0.9;
    const endY = size * 0.96 - Math.cos(angle) * radius * 1.72;
    context.beginPath();
    context.moveTo(size * 0.5, size * 0.98);
    context.quadraticCurveTo(
      size * 0.5 + Math.sin(angle) * radius * 0.35,
      size * 0.55 - Math.cos(angle) * radius * 0.55,
      endX,
      endY,
    );
    context.strokeStyle = `rgba(88,88,42,${i % 3 === 0 ? 0.58 : 0.34})`;
    context.lineWidth = i % 3 === 0 ? 1.8 : 1.05;
    context.stroke();
  }

  const leafRandom = mulberry32(8839);
  for (let i = 0; i < 160; i += 1) {
    context.fillStyle = `rgba(123,111,56,${leafRandom() * 0.055})`;
    context.beginPath();
    context.arc(leafRandom() * size, leafRandom() * size, 0.5 + leafRandom() * 1.7, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.name = 'Generated ginkgo dichotomous vein map';
  return texture;
}

const barkTexture = createBarkTexture();
const veinTexture = createLeafVeinTexture();

const barkMaterial = new THREE.MeshStandardMaterial({
  color: palette.bark,
  map: barkTexture,
  bumpMap: barkTexture,
  bumpScale: 0.075,
  roughness: 0.94,
  metalness: 0,
});
barkMaterial.name = 'Fissured grey-brown bark';

const twigMaterial = new THREE.MeshStandardMaterial({
  color: 0x594d3e,
  map: barkTexture,
  bumpMap: barkTexture,
  bumpScale: 0.035,
  roughness: 0.9,
  metalness: 0,
});
twigMaterial.name = 'Young twig bark';

function createLeafMaterial() {
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: veinTexture,
    vertexColors: true,
    side: THREE.DoubleSide,
    roughness: 0.7,
    metalness: 0,
    clearcoat: 0.08,
    clearcoatRoughness: 0.78,
    sheen: 0.18,
    sheenColor: new THREE.Color(0xcfc577),
  });
  material.name = 'Ginkgo leaf — instanced seasonal variation';
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = windUniforms.uWindTime;
    shader.uniforms.uWindStrength = windUniforms.uWindStrength;
    shader.vertexShader = `
      attribute float instancePhase;
      attribute float instanceFlex;
      uniform float uWindTime;
      uniform float uWindStrength;
    ${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `vec3 transformed = vec3(position);
       float attached = smoothstep(0.02, 0.82, position.y);
       float flutter = sin(uWindTime * 3.8 + instancePhase) * uWindStrength * instanceFlex;
       float ripple = sin(uWindTime * 5.1 + instancePhase * 1.73 + position.x * 19.0);
       transformed.x += flutter * attached * 0.065;
       transformed.z += (flutter * 0.72 + ripple * 0.012 * uWindStrength) * attached;`,
    );
  };
  material.customProgramCacheKey = () => 'ginkgo-leaf-wind-v2';
  return material;
}

const leafMaterial = createLeafMaterial();
leafMaterial.emissive.set(0x55581a);
leafMaterial.emissiveIntensity = 0.46;
const fallenLeafMaterial = new THREE.MeshBasicMaterial({
  color: 0xf2d56c,
  map: veinTexture,
  side: THREE.DoubleSide,
  vertexColors: true,
});

const petioleMaterial = new THREE.MeshStandardMaterial({
  color: 0x8c7b3f,
  roughness: 0.82,
  metalness: 0,
});

function makeLeafGeometry() {
  const positions = [0, 0, 0];
  const normals = [0, 0, 1];
  const uvs = [0.5, 0.98];
  const indices = [];
  const segments = 28;
  for (let i = 0; i <= segments; i += 1) {
    const angle = THREE.MathUtils.lerp(-1.25, 1.25, i / segments);
    const notch = 0.36 * Math.exp(-Math.pow(angle / 0.18, 2));
    const scallop = 0.012 * Math.sin(i * 2.25);
    const radius = 1 - notch + scallop;
    const x = Math.sin(angle) * radius * 0.78;
    const y = Math.cos(angle) * radius;
    const z = Math.sin(angle * 2.1) * 0.018 + Math.sin(i * 1.7) * 0.008;
    positions.push(x, y, z);
    normals.push(0, 0, 1);
    uvs.push(0.5 + x * 0.49, 0.98 - y * 0.92);
    if (i > 0) indices.push(0, i, i + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  geometry.name = 'Scalloped two-lobed ginkgo fan';
  return geometry;
}

const leafGeometryTemplate = makeLeafGeometry();
const petioleGeometry = new THREE.CylinderGeometry(0.006, 0.009, 1, 5, 1, false);
petioleGeometry.translate(0, 0.5, 0);

function makeTubeGeometry(points, radii, sides = 7, ribbed = false, phase = 0) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i < points.length; i += 1) {
    const previous = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const tangent = next.clone().sub(previous).normalize();
    const reference = Math.abs(tangent.y) > 0.86 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, reference).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

    for (let j = 0; j < sides; j += 1) {
      const angle = (j / sides) * Math.PI * 2;
      const ridge = ribbed
        ? 1 + 0.075 * Math.sin(angle * 11 + phase) + 0.028 * Math.sin(angle * 5 - i * 0.72)
        : 1 + 0.025 * Math.sin(angle * 3 + phase + i * 0.4);
      const radius = radii[i] * ridge;
      const radial = normal.clone().multiplyScalar(Math.cos(angle)).addScaledVector(binormal, Math.sin(angle));
      const position = points[i].clone().addScaledVector(radial, radius);
      positions.push(position.x, position.y, position.z);
      normals.push(radial.x, radial.y, radial.z);
      uvs.push(j / sides, i / (points.length - 1));
    }
  }

  for (let i = 0; i < points.length - 1; i += 1) {
    for (let j = 0; j < sides; j += 1) {
      const nextJ = (j + 1) % sides;
      const a = i * sides + j;
      const b = (i + 1) * sides + j;
      const c = (i + 1) * sides + nextJ;
      const d = i * sides + nextJ;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

function makeTrunkAndRoots() {
  const pieces = [];
  const trunkPoints = [];
  const trunkRadii = [];
  const ringCount = 28;
  for (let i = 0; i < ringCount; i += 1) {
    const t = i / (ringCount - 1);
    const y = t * 9.55;
    trunkPoints.push(new THREE.Vector3(
      Math.sin(t * 5.2) * 0.13 + Math.sin(t * 12.3) * 0.025,
      y,
      Math.sin(t * 3.7 + 0.8) * 0.11,
    ));
    const base = THREE.MathUtils.lerp(0.72, 0.14, Math.pow(t, 0.72));
    const flare = 0.27 * Math.exp(-t * 13);
    trunkRadii.push(base + flare);
  }
  pieces.push(makeTubeGeometry(trunkPoints, trunkRadii, 26, true, 0.4));

  for (let i = 0; i < 9; i += 1) {
    const angle = (i / 9) * Math.PI * 2 + rand(-0.16, 0.16);
    const length = rand(1.25, 2.05);
    const rootPoints = [];
    const rootRadii = [];
    for (let step = 0; step < 7; step += 1) {
      const t = step / 6;
      const bend = Math.sin(t * Math.PI) * rand(-0.05, 0.05);
      rootPoints.push(new THREE.Vector3(
        Math.cos(angle + bend) * length * t,
        0.15 - Math.pow(t, 1.25) * 0.35,
        Math.sin(angle + bend) * length * t,
      ));
      rootRadii.push(THREE.MathUtils.lerp(rand(0.24, 0.34), 0.025, Math.pow(t, 0.72)));
    }
    pieces.push(makeTubeGeometry(rootPoints, rootRadii, 10, true, i * 0.71));
  }

  const geometry = mergeGeometries(pieces, false);
  geometry.name = 'Ribbed trunk and asymmetric root flare';
  pieces.forEach((piece) => piece.dispose());
  const trunk = new THREE.Mesh(geometry, barkMaterial);
  trunk.name = 'Mature trunk + root flare';
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  return trunk;
}

function branchPath(start, direction, length, segments, lift, sideCurve = 0) {
  const points = [];
  const dir = direction.clone().normalize();
  const side = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const point = start.clone()
      .addScaledVector(dir, length * t)
      .addScaledVector(new THREE.Vector3(0, 1, 0), lift * (t * 0.68 + Math.sin(t * Math.PI) * 0.22))
      .addScaledVector(side, sideCurve * Math.sin(t * Math.PI));
    points.push(point);
  }
  return points;
}

function pointAndTangent(points, t) {
  const scaled = clamp(t, 0, 0.9999) * (points.length - 1);
  const index = Math.floor(scaled);
  const alpha = scaled - index;
  const point = points[index].clone().lerp(points[Math.min(index + 1, points.length - 1)], alpha);
  const previous = points[Math.max(0, index - 1)];
  const next = points[Math.min(points.length - 1, index + 1)];
  return { point, tangent: next.clone().sub(previous).normalize() };
}

function radiusSeries(startRadius, endRadius, count, exponent = 0.8) {
  return Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1);
    return THREE.MathUtils.lerp(startRadius, endRadius, Math.pow(t, exponent));
  });
}

function leafQuaternion(direction, normalHint) {
  const yAxis = direction.clone().normalize();
  let zAxis = normalHint.clone().normalize();
  let xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis);
  if (xAxis.lengthSq() < 0.001) xAxis = new THREE.Vector3(1, 0, 0);
  xAxis.normalize();
  zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
  const basis = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
  return new THREE.Quaternion().setFromRotationMatrix(basis);
}

function matrixFromCylinder(start, end, radiusScale = 1) {
  const direction = end.clone().sub(start);
  const length = direction.length();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );
  return new THREE.Matrix4().compose(
    start,
    quaternion,
    new THREE.Vector3(radiusScale, length, radiusScale),
  );
}

const primaryBoughs = [];
const proofCandidates = [];
let leafCount = 0;
let branchNodeCount = 0;

function buildPrimaryBough(config, index) {
  const group = new THREE.Group();
  group.name = `PrimaryBough_${String(index + 1).padStart(2, '0')}`;
  group.position.copy(config.origin);
  group.userData.phase = config.phase;
  group.userData.flex = config.flex;
  group.userData.index = index;

  const woodPieces = [];
  const shortShootPieces = [];
  const leaves = [];
  const petioles = [];
  const mainDirection = new THREE.Vector3(Math.cos(config.angle), config.up, Math.sin(config.angle)).normalize();
  const main = branchPath(new THREE.Vector3(), mainDirection, config.length, 8, config.lift, config.curve);
  woodPieces.push(makeTubeGeometry(main, radiusSeries(config.radius, config.radius * 0.17, main.length), 10, false, index));
  branchNodeCount += main.length;

  const addLeafCluster = (anchor, branchDirection, clusterWeight = 1) => {
    const shootDirection = branchDirection.clone()
      .multiplyScalar(0.38)
      .add(new THREE.Vector3(rand(-0.45, 0.45), rand(0.55, 0.92), rand(-0.45, 0.45)))
      .normalize();
    const shootLength = rand(0.105, 0.19) * clusterWeight;
    const shootEnd = anchor.clone().addScaledVector(shootDirection, shootLength);
    shortShootPieces.push(makeTubeGeometry(
      [anchor.clone(), anchor.clone().lerp(shootEnd, 0.55), shootEnd.clone()],
      [0.019, 0.014, 0.008],
      5,
      false,
      rand(0, Math.PI * 2),
    ));
    branchNodeCount += 3;

    const count = 8 + Math.floor(random() * 4);
    for (let leafIndex = 0; leafIndex < count; leafIndex += 1) {
      const around = (leafIndex / count) * Math.PI * 2 + rand(-0.28, 0.28);
      const radial = new THREE.Vector3(Math.cos(around), rand(-0.1, 0.3), Math.sin(around));
      radial.addScaledVector(branchDirection, 0.35).normalize();
      const petioleStart = shootEnd.clone().add(new THREE.Vector3(rand(-0.01, 0.01), rand(-0.005, 0.018), rand(-0.01, 0.01)));
      const petioleLength = rand(0.09, 0.145);
      const leafBase = petioleStart.clone().addScaledVector(radial, petioleLength);
      const leafDirection = radial.clone().multiplyScalar(0.55)
        .add(new THREE.Vector3(rand(-0.22, 0.22), rand(0.52, 0.93), rand(-0.22, 0.22)))
        .normalize();
      const planeNormal = new THREE.Vector3(rand(-1, 1), rand(-0.28, 0.28), rand(-1, 1)).normalize();
      const scale = rand(0.18, 0.255) * clusterWeight;
      leaves.push({
        position: leafBase,
        quaternion: leafQuaternion(leafDirection, planeNormal),
        scale,
        phase: rand(0, Math.PI * 2),
        flex: rand(0.72, 1.18),
        colorMix: random(),
      });
      petioles.push({ start: petioleStart, end: leafBase });
      const worldCandidate = leafBase.clone()
        .addScaledVector(leafDirection, scale * 0.48)
        .add(group.position)
        .add(world.position);
      proofCandidates.push({
        position: worldCandidate,
        normal: planeNormal.clone(),
      });
    }
  };

  const secondaryCount = 9;
  for (let s = 0; s < secondaryCount; s += 1) {
    const t = 0.2 + (s / (secondaryCount - 1)) * 0.69 + rand(-0.025, 0.025);
    const sample = pointAndTangent(main, t);
    const sign = s % 2 === 0 ? 1 : -1;
    const perpendicular = new THREE.Vector3(-sample.tangent.z, 0, sample.tangent.x).normalize();
    const secondaryDirection = sample.tangent.clone().multiplyScalar(0.3)
      .addScaledVector(perpendicular, sign * rand(0.58, 0.94))
      .add(new THREE.Vector3(rand(-0.12, 0.12), rand(0.34, 0.68), rand(-0.12, 0.12)))
      .normalize();
    const secondaryLength = config.length * rand(0.41, 0.64) * (1.05 - t * 0.25);
    const secondary = branchPath(
      sample.point,
      secondaryDirection,
      secondaryLength,
      6,
      rand(0.28, 0.72),
      sign * rand(0.08, 0.3),
    );
    const secondaryStartRadius = THREE.MathUtils.lerp(config.radius * 0.42, config.radius * 0.19, t);
    woodPieces.push(makeTubeGeometry(
      secondary,
      radiusSeries(secondaryStartRadius, 0.024, secondary.length),
      7,
      false,
      index + s * 0.2,
    ));
    branchNodeCount += secondary.length;

    for (let tIndex = 0; tIndex < 4; tIndex += 1) {
      const tertiaryT = 0.32 + tIndex * 0.2 + rand(-0.035, 0.035);
      const tertiarySample = pointAndTangent(secondary, tertiaryT);
      const twist = (tIndex % 2 === 0 ? 1 : -1) * rand(0.5, 0.9);
      const tertiaryPerp = new THREE.Vector3(-tertiarySample.tangent.z, 0, tertiarySample.tangent.x).normalize();
      const tertiaryDirection = tertiarySample.tangent.clone().multiplyScalar(0.36)
        .addScaledVector(tertiaryPerp, twist)
        .add(new THREE.Vector3(rand(-0.12, 0.12), rand(0.28, 0.64), rand(-0.12, 0.12)))
        .normalize();
      const tertiary = branchPath(
        tertiarySample.point,
        tertiaryDirection,
        secondaryLength * rand(0.36, 0.58),
        4,
        rand(0.11, 0.34),
        rand(-0.1, 0.1),
      );
      woodPieces.push(makeTubeGeometry(tertiary, radiusSeries(0.034, 0.011, tertiary.length), 5, false, tIndex));
      branchNodeCount += tertiary.length;

      const tip = pointAndTangent(tertiary, 0.98);
      addLeafCluster(tip.point, tip.tangent, rand(0.92, 1.08));
      if (tIndex > 0) {
        const mid = pointAndTangent(tertiary, rand(0.5, 0.76));
        addLeafCluster(mid.point, mid.tangent, rand(0.84, 1.02));
      }
    }

    const secondaryTip = pointAndTangent(secondary, 0.98);
    addLeafCluster(secondaryTip.point, secondaryTip.tangent, 1.02);
  }

  for (const t of [0.72, 0.86, 0.97]) {
    const mainTip = pointAndTangent(main, t);
    addLeafCluster(mainTip.point, mainTip.tangent, 1.05);
  }

  const mergedWood = mergeGeometries(woodPieces, false);
  mergedWood.name = `${group.name}_hierarchical_wood`;
  woodPieces.forEach((piece) => piece.dispose());
  const woodMesh = new THREE.Mesh(mergedWood, barkMaterial);
  woodMesh.name = `${group.name}_long_shoots`;
  woodMesh.castShadow = index < 4;
  woodMesh.receiveShadow = true;
  group.add(woodMesh);

  const mergedShortShoots = mergeGeometries(shortShootPieces, false);
  mergedShortShoots.name = `${group.name}_short_shoots_geometry`;
  shortShootPieces.forEach((piece) => piece.dispose());
  const shortShootMesh = new THREE.Mesh(mergedShortShoots, twigMaterial);
  shortShootMesh.name = `${group.name}_explicit_short_shoots`;
  shortShootMesh.castShadow = false;
  group.add(shortShootMesh);

  const leafGeometry = leafGeometryTemplate.clone();
  leafGeometry.setAttribute(
    'instancePhase',
    new THREE.InstancedBufferAttribute(new Float32Array(leaves.map((leaf) => leaf.phase)), 1),
  );
  leafGeometry.setAttribute(
    'instanceFlex',
    new THREE.InstancedBufferAttribute(new Float32Array(leaves.map((leaf) => leaf.flex)), 1),
  );
  const leafMesh = new THREE.InstancedMesh(leafGeometry, leafMaterial, leaves.length);
  leafMesh.name = `${group.name}_fan_leaf_clusters`;
  leafMesh.castShadow = index === 0;
  leafMesh.receiveShadow = true;
  leafMesh.frustumCulled = false;

  const petioleMesh = new THREE.InstancedMesh(petioleGeometry, petioleMaterial, petioles.length);
  petioleMesh.name = `${group.name}_visible_petioles`;
  petioleMesh.castShadow = false;
  petioleMesh.frustumCulled = false;

  const tempObject = new THREE.Object3D();
  leaves.forEach((leaf, leafIndex) => {
    tempObject.position.copy(leaf.position);
    tempObject.quaternion.copy(leaf.quaternion);
    tempObject.scale.setScalar(leaf.scale);
    tempObject.updateMatrix();
    leafMesh.setMatrixAt(leafIndex, tempObject.matrix);
    const color = leaf.colorMix < 0.58
      ? palette.leafGreen.clone().lerp(palette.leafChartreuse, leaf.colorMix / 0.58)
      : palette.leafChartreuse.clone().lerp(palette.leafGold, (leaf.colorMix - 0.58) / 0.42);
    color.offsetHSL(rand(-0.018, 0.018), rand(-0.035, 0.035), rand(-0.035, 0.035));
    leafMesh.setColorAt(leafIndex, color);
  });
  leafMesh.instanceMatrix.needsUpdate = true;
  leafMesh.instanceColor.needsUpdate = true;

  petioles.forEach((petiole, petioleIndex) => {
    petioleMesh.setMatrixAt(petioleIndex, matrixFromCylinder(petiole.start, petiole.end, rand(0.88, 1.12)));
  });
  petioleMesh.instanceMatrix.needsUpdate = true;

  group.add(petioleMesh, leafMesh);
  leafCount += leaves.length;
  primaryBoughs.push(group);
  return group;
}

world.add(makeTrunkAndRoots());

const boughConfigs = [
  { origin: new THREE.Vector3(-0.02, 2.85, 0.02), angle: 0.12, up: 0.28, length: 4.35, lift: 1.25, radius: 0.255, curve: 0.38, phase: 0.2, flex: 0.46 },
  { origin: new THREE.Vector3(0.03, 3.72, -0.01), angle: 2.3, up: 0.34, length: 4.05, lift: 1.42, radius: 0.23, curve: -0.34, phase: 1.4, flex: 0.54 },
  { origin: new THREE.Vector3(-0.01, 4.55, 0.03), angle: 4.08, up: 0.4, length: 3.8, lift: 1.55, radius: 0.205, curve: 0.28, phase: 2.2, flex: 0.62 },
  { origin: new THREE.Vector3(0.02, 5.37, -0.02), angle: 1.16, up: 0.46, length: 3.55, lift: 1.72, radius: 0.185, curve: -0.24, phase: 3.5, flex: 0.7 },
  { origin: new THREE.Vector3(-0.03, 6.15, 0.02), angle: 3.38, up: 0.53, length: 3.16, lift: 1.88, radius: 0.16, curve: 0.2, phase: 4.4, flex: 0.78 },
  { origin: new THREE.Vector3(0.02, 6.85, -0.01), angle: 5.22, up: 0.62, length: 2.8, lift: 1.98, radius: 0.14, curve: -0.16, phase: 5.5, flex: 0.86 },
  { origin: new THREE.Vector3(-0.01, 7.5, 0.01), angle: 0.9, up: 0.72, length: 2.32, lift: 1.9, radius: 0.115, curve: 0.12, phase: 0.9, flex: 0.94 },
];
boughConfigs.forEach((config, index) => world.add(buildPrimaryBough(config, index)));

function irregularDisc(radius, segments, y, seedOffset) {
  const discRandom = mulberry32(SEED + seedOffset);
  const shape = new THREE.Shape();
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    const r = radius * (0.8 + discRandom() * 0.24 + Math.sin(angle * 3 + seedOffset) * 0.06);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  }
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, y, 0);
  return geometry;
}

const groundMaterial = new THREE.MeshStandardMaterial({ color: palette.limestone, roughness: 0.93, metalness: 0 });
const ground = new THREE.Mesh(new THREE.CylinderGeometry(6.6, 6.85, 0.23, 96), groundMaterial);
ground.name = 'Limestone specimen ground';
ground.position.y = -0.2;
ground.receiveShadow = true;
world.add(ground);

const mossPieces = [];
for (let i = 0; i < 4; i += 1) {
  const geometry = irregularDisc(rand(0.28, 0.76), 22, -0.072 + i * 0.0005, 80 + i);
  geometry.rotateY(rand(0, Math.PI * 2));
  geometry.translate(rand(-1.65, 1.65), 0, rand(-1.65, 1.65));
  mossPieces.push(geometry);
}
const mossGeometry = mergeGeometries(mossPieces, false);
mossPieces.forEach((piece) => piece.dispose());
const mossMaterial = new THREE.MeshStandardMaterial({
  color: 0x85856b,
  roughness: 1,
  metalness: 0,
  transparent: true,
  opacity: 0.62,
});
const moss = new THREE.Mesh(mossGeometry, mossMaterial);
moss.name = 'Irregular muted moss insets';
moss.receiveShadow = true;
world.add(moss);

const litterCount = 46;
const litterGeometry = leafGeometryTemplate.clone();
const litter = new THREE.InstancedMesh(litterGeometry, fallenLeafMaterial, litterCount);
litter.name = 'Restrained fallen ginkgo leaves';
litter.receiveShadow = true;
const litterObject = new THREE.Object3D();
for (let i = 0; i < litterCount; i += 1) {
  const angle = rand(0, Math.PI * 2);
  const radius = Math.sqrt(random()) * 4.5;
  litterObject.position.set(Math.cos(angle) * radius, -0.071 + rand(0, 0.012), Math.sin(angle) * radius);
  litterObject.rotation.set(-Math.PI / 2 + rand(-0.08, 0.08), rand(0, Math.PI * 2), rand(-0.08, 0.08));
  litterObject.scale.setScalar(rand(0.095, 0.155));
  litterObject.updateMatrix();
  litter.setMatrixAt(i, litterObject.matrix);
  litter.setColorAt(i, choose([new THREE.Color(0xe2c953), new THREE.Color(0xf0dc75), new THREE.Color(0xbdb84f)]));
}
litter.instanceMatrix.needsUpdate = true;
litter.instanceColor.needsUpdate = true;
world.add(litter);

function buildProofRig() {
  const rig = new THREE.Group();
  rig.name = 'Species identity proof — leaf cluster and short shoot';
  rig.visible = false;

  const branchPoints = [
    new THREE.Vector3(-1.75, -0.1, 0),
    new THREE.Vector3(-0.95, 0.02, 0.03),
    new THREE.Vector3(-0.15, -0.01, -0.01),
    new THREE.Vector3(0.7, 0.09, 0.02),
    new THREE.Vector3(1.65, 0.02, 0),
  ];
  const branchGeometry = makeTubeGeometry(branchPoints, [0.12, 0.105, 0.085, 0.062, 0.035], 10, true, 1.4);
  const branch = new THREE.Mesh(branchGeometry, barkMaterial);
  branch.name = 'Proof long shoot';
  branch.castShadow = true;
  rig.add(branch);

  const proofLeaves = [
    { x: -1.25, y: 0.37, z: 0.02, scale: 0.53, rotation: 0.24, color: 0xb7c34b },
    { x: -0.62, y: 0.3, z: 0.08, scale: 0.57, rotation: -0.13, color: 0xd0c652 },
    { x: 0.02, y: 0.42, z: 0.02, scale: 0.62, rotation: 0.03, color: 0xe2c042 },
    { x: 0.68, y: 0.31, z: 0.09, scale: 0.56, rotation: 0.13, color: 0xc3c74c },
    { x: 1.26, y: 0.39, z: 0.01, scale: 0.51, rotation: -0.22, color: 0xdab943 },
  ];

  proofLeaves.forEach((leaf, index) => {
    const shootAnchor = new THREE.Vector3(leaf.x, 0.01 + Math.abs(leaf.x) * 0.025, leaf.z);
    const spurEnd = new THREE.Vector3(leaf.x + (index - 2) * 0.018, 0.23, leaf.z);
    const leafBase = new THREE.Vector3(leaf.x + (index - 2) * 0.035, leaf.y, leaf.z);
    const spur = new THREE.Mesh(
      makeTubeGeometry([shootAnchor, shootAnchor.clone().lerp(spurEnd, 0.58), spurEnd], [0.025, 0.018, 0.011], 6, false, index),
      twigMaterial,
    );
    spur.name = `Proof short shoot ${index + 1}`;
    const petiole = new THREE.Mesh(petioleGeometry, petioleMaterial);
    petiole.name = `Proof petiole ${index + 1}`;
    petiole.matrixAutoUpdate = false;
    petiole.matrix.copy(matrixFromCylinder(spurEnd, leafBase, 1.35));

    const proofLeafMaterial = new THREE.MeshPhysicalMaterial({
      color: leaf.color,
      map: veinTexture,
      side: THREE.DoubleSide,
      roughness: 0.66,
      metalness: 0,
      clearcoat: 0.06,
      clearcoatRoughness: 0.8,
      emissive: new THREE.Color(leaf.color).multiplyScalar(0.12),
      emissiveIntensity: 0.32,
    });
    const proofLeaf = new THREE.Mesh(leafGeometryTemplate, proofLeafMaterial);
    proofLeaf.name = `Proof two-lobed fan leaf ${index + 1}`;
    proofLeaf.position.copy(leafBase);
    proofLeaf.rotation.z = leaf.rotation;
    proofLeaf.rotation.y = (index - 2) * 0.035;
    proofLeaf.scale.setScalar(leaf.scale);
    proofLeaf.castShadow = true;
    rig.add(spur, petiole, proofLeaf);
  });

  rig.rotation.x = -0.04;
  rig.rotation.y = -0.08;
  return rig;
}

const proofRig = buildProofRig();
scene.add(proofRig);

const hemi = new THREE.HemisphereLight(0xf8f2da, 0x676c58, 1.45);
hemi.name = 'Warm sky / sage ground fill';
scene.add(hemi);

const key = new THREE.DirectionalLight(0xffe5ad, 2.4);
key.name = 'Late-afternoon key';
key.position.set(-7, 14, 9);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -8;
key.shadow.camera.right = 8;
key.shadow.camera.top = 12;
key.shadow.camera.bottom = -2;
key.shadow.camera.near = 1;
key.shadow.camera.far = 34;
key.shadow.bias = -0.00016;
key.shadow.normalBias = 0.026;
key.target.position.set(world.position.x, 4.6, 0);
scene.add(key, key.target);

const rim = new THREE.DirectionalLight(0xc7d4b4, 1.08);
rim.name = 'Cool leaf-separation rim';
rim.position.set(9, 8, -9);
rim.target.position.set(world.position.x, 5, 0);
scene.add(rim, rim.target);

const softFill = new THREE.DirectionalLight(0xfff9eb, 1.34);
softFill.name = 'Front gallery fill';
softFill.position.set(7, 6, 11);
softFill.target.position.set(world.position.x, 4.5, 0);
scene.add(softFill, softFill.target);

function pickProofAnchor() {
  let best = proofCandidates[0] || {
    position: new THREE.Vector3(world.position.x + 2, 6, 2),
    normal: new THREE.Vector3(0, 0, 1),
  };
  let bestScore = -Infinity;
  for (const candidate of proofCandidates) {
    const radial = candidate.position.clone().sub(new THREE.Vector3(world.position.x, candidate.position.y, 0));
    const outward = radial.clone().normalize();
    const facing = Math.abs(candidate.normal.dot(outward));
    const score = radial.length() * 1.8 + facing * 3.4 - Math.abs(candidate.position.y - 6.25) * 1.35;
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return { position: best.position.clone(), normal: best.normal.clone() };
}

const proofData = pickProofAnchor();
const proofAnchor = proofData.position;
const proofOutward = proofAnchor.clone().sub(new THREE.Vector3(world.position.x, proofAnchor.y, 0)).normalize();
const views = {
  hero: {
    position: new THREE.Vector3(18.8, 7.1, 22.0),
    target: new THREE.Vector3(world.position.x + 0.25, 5.15, 0),
    fov: 29,
  },
  orbitA: {
    position: new THREE.Vector3(-16.4, 8.1, -20.2),
    target: new THREE.Vector3(world.position.x, 5.1, 0),
    fov: 30,
  },
  orbitB: {
    position: new THREE.Vector3(18.0, 4.15, -20.0),
    target: new THREE.Vector3(world.position.x, 4.65, 0),
    fov: 33,
  },
  neutralMaterial: {
    position: new THREE.Vector3(18.0, 7.2, 20.5),
    target: new THREE.Vector3(world.position.x, 5.1, 0),
    fov: 30,
  },
  subjectProof: {
    position: new THREE.Vector3(0, 0.88, 5.15),
    target: new THREE.Vector3(0, 0.45, 0),
    fov: 27,
  },
};

let activeView = 'hero';
function setView(name) {
  const resolvedName = views[name] ? name : 'hero';
  const view = views[resolvedName];
  activeView = resolvedName;
  camera.position.copy(view.position);
  camera.fov = view.fov;
  camera.updateProjectionMatrix();
  controls.minDistance = resolvedName === 'subjectProof' ? 0.35 : 5;
  controls.target.copy(view.target);
  controls.update();
  world.visible = resolvedName !== 'subjectProof';
  proofRig.visible = resolvedName === 'subjectProof';
  document.body.classList.toggle('neutral', resolvedName === 'neutralMaterial');
  renderer.toneMappingExposure = resolvedName === 'neutralMaterial' ? 0.96 : 1.07;
  scene.fog.density = resolvedName === 'subjectProof' ? 0 : 0.0085;
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.view === resolvedName));
  });
  const captureLabel = document.querySelector('[data-capture-label]');
  captureLabel.textContent = `Ginkgo biloba · ${resolvedName.replace(/([A-Z])/g, ' $1')} · fixed time ${isFrozen ? (fixedTime ?? 2.4).toFixed(1) : 'live'}s`;
  statusEl.textContent = `${resolvedName} view selected`;
}

document.querySelectorAll('[data-view]').forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.view));
});

let windPaused = false;
const windButton = document.querySelector('#wind-toggle');
windButton.addEventListener('click', () => {
  windPaused = !windPaused;
  windButton.textContent = windPaused ? 'Resume wind' : 'Pause wind';
  windButton.setAttribute('aria-pressed', String(windPaused));
  document.querySelector('#mode-readout').textContent = windPaused ? 'REST' : 'LIGHT WIND';
  statusEl.textContent = windPaused ? 'Wind paused' : 'Light wind resumed';
});

function triangleCount(geometry) {
  return geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
}

function collectModelMetrics() {
  let modelTriangles = 0;
  let uniqueGeometryVertices = 0;
  let meshDraws = 0;
  let shadowDraws = 0;
  const geometries = new Set();
  const materials = new Set();
  world.traverse((object) => {
    if (!object.isMesh) return;
    meshDraws += 1;
    if (object.castShadow) shadowDraws += 1;
    materials.add(object.material);
    if (!geometries.has(object.geometry)) {
      geometries.add(object.geometry);
      uniqueGeometryVertices += object.geometry.attributes.position.count;
    }
    const instances = object.isInstancedMesh ? object.count : 1;
    modelTriangles += triangleCount(object.geometry) * instances;
  });
  return {
    seed: SEED,
    leafCount,
    branchNodeCount,
    modelTriangles: Math.round(modelTriangles),
    uniqueGeometryVertices,
    visibleMeshDraws: meshDraws,
    declaredShadowDraws: shadowDraws,
    materialFamilies: materials.size,
    generatedTextures: 2,
  };
}

const assetMetrics = collectModelMetrics();
document.querySelector('#leaf-readout').textContent = assetMetrics.leafCount.toLocaleString();

let frameCounter = 0;
let elapsedWhenPaused = 0;
let previousFrameTime = performance.now();
const frameSamples = [];
let readyAfterMs = null;

function updateWind(timeSeconds) {
  const windTime = isFrozen ? (fixedTime ?? 2.4) : windPaused ? elapsedWhenPaused : timeSeconds;
  if (!windPaused && !isFrozen) elapsedWhenPaused = timeSeconds;
  windUniforms.uWindTime.value = windTime;
  const structuralStrength = windPaused ? 0 : 0.18;
  primaryBoughs.forEach((group) => {
    const phase = group.userData.phase;
    const flex = group.userData.flex;
    const slow = Math.sin(windTime * 0.62 + phase);
    const gust = Math.sin(windTime * 1.14 + phase * 1.7) * 0.28;
    group.rotation.z = (slow + gust) * structuralStrength * flex * 0.095;
    group.rotation.x = Math.sin(windTime * 0.48 + phase * 0.73) * structuralStrength * flex * 0.055;
    group.rotation.y = Math.sin(windTime * 0.37 + phase * 1.11) * structuralStrength * flex * 0.025;
  });
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

setView(requestedView);
resize();
renderer.compile(scene, camera);

function render(now) {
  const timeSeconds = now * 0.001;
  const frameStart = performance.now();
  updateWind(timeSeconds);
  controls.update();
  renderer.info.reset();
  renderer.render(scene, camera);
  const frameMs = performance.now() - frameStart;
  frameSamples.push(frameMs);
  if (frameSamples.length > 180) frameSamples.shift();

  const renderInfo = renderer.info.render;
  document.querySelector('#tri-readout').textContent = Math.round(renderInfo.triangles).toLocaleString();
  document.querySelector('#draw-readout').textContent = String(renderInfo.calls);
  const sortedSamples = [...frameSamples].sort((a, b) => a - b);
  const averageFrameMs = frameSamples.reduce((sum, value) => sum + value, 0) / frameSamples.length;
  const warmSamples = frameSamples.slice(-60);
  const warmAverageFrameMs = warmSamples.reduce((sum, value) => sum + value, 0) / warmSamples.length;
  const p95FrameMs = sortedSamples[Math.floor(sortedSamples.length * 0.95)] || frameMs;

  window.__GINKGO_METRICS__ = {
    assetId: 'ginkgo-v2',
    view: activeView,
    semanticState: windPaused ? 'rest' : 'lightWind',
    fixedTimeSeconds: isFrozen ? (fixedTime ?? 2.4) : null,
    renderer: renderer.capabilities.isWebGL2 ? 'WebGL2' : 'WebGL1',
    viewport: { width: window.innerWidth, height: window.innerHeight, dpr: renderer.getPixelRatio() },
    frameTriangles: Math.round(renderInfo.triangles),
    frameDrawCalls: renderInfo.calls,
    frameLines: renderInfo.lines,
    framePoints: renderInfo.points,
    renderFrameMsAverage: Number(averageFrameMs.toFixed(3)),
    renderFrameMsWarmAverage: Number(warmAverageFrameMs.toFixed(3)),
    renderFrameMsP95: Number(p95FrameMs.toFixed(3)),
    readyAfterMs,
    frameTimingDiagnosticOnly: true,
    ...assetMetrics,
  };
  document.querySelector('#metrics-json').textContent = JSON.stringify(window.__GINKGO_METRICS__);

  frameCounter += 1;
  if (frameCounter === 4) {
    readyAfterMs = Number((performance.now() - bootStart).toFixed(2));
    window.__GINKGO_READY__ = true;
    statusEl.textContent = 'Ginkgo showcase ready';
    app.dataset.ready = 'true';
    console.info('[ginkgo] ready', JSON.stringify(window.__GINKGO_METRICS__));
  }
  previousFrameTime = now;
  requestAnimationFrame(render);
}

requestAnimationFrame(render);

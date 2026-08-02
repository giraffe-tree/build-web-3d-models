import * as THREE from "three";

export const meta = {
  id: "alpine-river",
  order: 50,
  title: "Alpine River",
  category: "TERRAIN",
  description: "A seeded terraced valley with a winding river, clustered stone, conifers, and legible downstream flow.",
  accent: "#66c6cf",
  background: "#0b1720",
  cameraDirection: [1.35, 0.9, 1.55],
  target: [0, 1.0, 0],
};

const HALF_LENGTH = 9;
const HALF_WIDTH = 7.2;
const TERRAIN_SEGMENTS = 56;
const TERRAIN_BANDS = 20;
const WATER_SEGMENTS = 72;

const TERRAIN_COLORS = {
  bank: new THREE.Color("#6f6044"),
  meadow: new THREE.Color("#527052"),
  treeline: new THREE.Color("#344f41"),
  rock: new THREE.Color("#747c78"),
  snow: new THREE.Color("#d9e2df"),
};

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function createSeededRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function riverCenter(z) {
  const normalized = z / HALF_LENGTH;
  return (
    Math.sin(normalized * Math.PI * 1.35) * 0.92 +
    Math.sin(normalized * Math.PI * 3.1 + 0.55) * 0.38
  );
}

function riverDerivative(z) {
  const step = 0.025;
  return (riverCenter(z + step) - riverCenter(z - step)) / (step * 2);
}

function riverHalfWidth(z) {
  return 0.78 + Math.sin(z * 0.56 + 0.35) * 0.1 + Math.sin(z * 1.27) * 0.045;
}

function riverBedHeight(z) {
  return 0.035 + ((z + HALF_LENGTH) / (HALF_LENGTH * 2)) * 0.045;
}

function waterHeight(z) {
  return 0.115 + ((z + HALF_LENGTH) / (HALF_LENGTH * 2)) * 0.055;
}

function slopeX(side, z, outward) {
  const inner = riverCenter(z) + side * riverHalfWidth(z);
  return THREE.MathUtils.lerp(inner, side * HALF_WIDTH, outward);
}

function slopeHeight(side, z, outward) {
  const longitudinal = (z + HALF_LENGTH) / (HALF_LENGTH * 2);
  const rise = 2.62 * Math.pow(outward, 1.16);
  const terraces = Math.floor(Math.min(outward, 0.999) * 5) * 0.105;
  const erosion =
    (Math.sin(z * 0.72 + side * 0.8) * 0.105 +
      Math.sin(z * 1.71 + outward * 6.2 - side) * 0.055) *
    outward *
    (0.35 + outward * 0.65);
  const asymmetry = side > 0
    ? 0.12 * outward * Math.sin(z * 0.29 + 1.1)
    : 0.17 * outward * Math.cos(z * 0.33 - 0.45);

  return 0.225 + longitudinal * 0.055 + rise + terraces + erosion + asymmetry;
}

function terrainColor(outward, height) {
  if (outward < 0.1) return TERRAIN_COLORS.bank;
  if (outward < 0.36) return TERRAIN_COLORS.meadow;
  if (outward < 0.57) return TERRAIN_COLORS.treeline;
  if (outward < 0.82 || height < 2.65) return TERRAIN_COLORS.rock;
  return TERRAIN_COLORS.snow;
}

function createTerrainGeometry() {
  const positions = [];
  const colors = [];

  function pushTriangle(a, b, c, color) {
    positions.push(...a, ...b, ...c);
    for (let index = 0; index < 3; index += 1) {
      colors.push(color.r, color.g, color.b);
    }
  }

  for (const side of [-1, 1]) {
    for (let zIndex = 0; zIndex < TERRAIN_SEGMENTS; zIndex += 1) {
      const z0 = THREE.MathUtils.lerp(-HALF_LENGTH, HALF_LENGTH, zIndex / TERRAIN_SEGMENTS);
      const z1 = THREE.MathUtils.lerp(-HALF_LENGTH, HALF_LENGTH, (zIndex + 1) / TERRAIN_SEGMENTS);

      for (let band = 0; band < TERRAIN_BANDS; band += 1) {
        const t0 = band / TERRAIN_BANDS;
        const t1 = (band + 1) / TERRAIN_BANDS;
        const p00 = [slopeX(side, z0, t0), slopeHeight(side, z0, t0), z0];
        const p10 = [slopeX(side, z0, t1), slopeHeight(side, z0, t1), z0];
        const p11 = [slopeX(side, z1, t1), slopeHeight(side, z1, t1), z1];
        const p01 = [slopeX(side, z1, t0), slopeHeight(side, z1, t0), z1];
        const midpointHeight = (p00[1] + p10[1] + p11[1] + p01[1]) * 0.25;
        const color = terrainColor((t0 + t1) * 0.5, midpointHeight);

        if (side > 0) {
          pushTriangle(p00, p11, p10, color);
          pushTriangle(p00, p01, p11, color);
        } else {
          pushTriangle(p00, p10, p11, color);
          pushTriangle(p00, p11, p01, color);
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createRiverStripGeometry(acrossSegments, widthScale, heightAtZ) {
  const positions = [];
  const coordinates = [];
  const indices = [];

  for (let zIndex = 0; zIndex <= WATER_SEGMENTS; zIndex += 1) {
    const z = THREE.MathUtils.lerp(-HALF_LENGTH, HALF_LENGTH, zIndex / WATER_SEGMENTS);
    const center = riverCenter(z);
    const halfWidth = riverHalfWidth(z) * widthScale;

    for (let across = 0; across <= acrossSegments; across += 1) {
      const normalizedAcross = across / acrossSegments;
      const lateral = normalizedAcross * 2 - 1;
      positions.push(center + lateral * halfWidth, heightAtZ(z), z);
      coordinates.push(lateral, z);
    }
  }

  const stride = acrossSegments + 1;
  for (let zIndex = 0; zIndex < WATER_SEGMENTS; zIndex += 1) {
    for (let across = 0; across < acrossSegments; across += 1) {
      const a = zIndex * stride + across;
      const b = a + 1;
      const d = (zIndex + 1) * stride + across;
      const c = d + 1;
      indices.push(a, c, b, a, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return {
    geometry,
    basePositions: Float32Array.from(positions),
    coordinates: new Float32Array(coordinates),
  };
}

function createBoulders(random) {
  const count = 42;
  const geometry = new THREE.IcosahedronGeometry(0.5, 1);
  const material = new THREE.MeshStandardMaterial({
    color: "#6d7470",
    roughness: 0.94,
    metalness: 0,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = "clusteredBoulders";
  mesh.castShadow = false;
  mesh.receiveShadow = true;

  const clusterCenters = [-6.3, -2.4, 1.5, 5.7];
  const colorVariants = [
    new THREE.Color("#626b68"),
    new THREE.Color("#78817b"),
    new THREE.Color("#71766f"),
  ];
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const euler = new THREE.Euler();

  for (let index = 0; index < count; index += 1) {
    const side = (index + (random() > 0.62 ? 1 : 0)) % 2 === 0 ? -1 : 1;
    const z = clamp(
      clusterCenters[index % clusterCenters.length] + (random() - 0.5) * 2.7,
      -HALF_LENGTH + 0.45,
      HALF_LENGTH - 0.45,
    );
    const outward = 0.055 + Math.pow(random(), 0.86) * 0.66;
    const size = 0.34 + random() * 0.46;
    const scaleX = size * (0.72 + random() * 0.62);
    const scaleY = size * (0.55 + random() * 0.46);
    const scaleZ = size * (0.74 + random() * 0.62);
    const groundY = slopeHeight(side, z, outward);

    position.set(slopeX(side, z, outward), groundY + scaleY * 0.24, z);
    euler.set((random() - 0.5) * 0.22, random() * Math.PI * 2, (random() - 0.5) * 0.22);
    quaternion.setFromEuler(euler);
    scale.set(scaleX, scaleY, scaleZ);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
    mesh.setColorAt(index, colorVariants[Math.floor(random() * colorVariants.length)]);
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

function createConifers(random) {
  const group = new THREE.Group();
  group.name = "vegetationSystem";

  const treeCount = 34;
  const trunkGeometry = new THREE.CylinderGeometry(0.075, 0.105, 1, 6, 1, false);
  const crownGeometry = new THREE.ConeGeometry(0.5, 1, 7, 1, false);
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: "#5a4130",
    roughness: 0.96,
    metalness: 0,
  });
  const crownMaterial = new THREE.MeshStandardMaterial({
    color: "#1f4a39",
    roughness: 0.9,
    metalness: 0,
  });
  const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, treeCount);
  const crowns = new THREE.InstancedMesh(crownGeometry, crownMaterial, treeCount * 3);
  trunks.name = "coniferTrunks";
  crowns.name = "coniferCanopyTiers";
  trunks.castShadow = true;
  trunks.receiveShadow = true;
  crowns.castShadow = true;
  crowns.receiveShadow = true;

  const crownColors = [
    new THREE.Color("#1b4434"),
    new THREE.Color("#24513e"),
    new THREE.Color("#2b5842"),
  ];
  const clusterCenters = [-7.0, -4.0, -0.4, 3.5, 6.7];
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const yaw = new THREE.Euler();
  let crownIndex = 0;

  for (let index = 0; index < treeCount; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const z = clamp(
      clusterCenters[index % clusterCenters.length] + (random() - 0.5) * 2.3,
      -HALF_LENGTH + 0.55,
      HALF_LENGTH - 0.55,
    );
    const outward = 0.19 + random() * 0.39;
    const treeScale = 0.82 + random() * 0.62;
    const x = slopeX(side, z, outward);
    const baseY = slopeHeight(side, z, outward);
    const rotationY = random() * Math.PI * 2;
    yaw.set(0, rotationY, 0);
    quaternion.setFromEuler(yaw);

    const trunkHeight = treeScale * 0.54;
    position.set(x, baseY + trunkHeight * 0.5, z);
    scale.set(treeScale, trunkHeight, treeScale);
    matrix.compose(position, quaternion, scale);
    trunks.setMatrixAt(index, matrix);

    const tiers = [
      { center: 0.48, height: 0.62, radius: 0.31 },
      { center: 0.7, height: 0.54, radius: 0.25 },
      { center: 0.9, height: 0.43, radius: 0.18 },
    ];

    for (let tierIndex = 0; tierIndex < tiers.length; tierIndex += 1) {
      const tier = tiers[tierIndex];
      position.set(x, baseY + tier.center * treeScale, z);
      scale.set(tier.radius * treeScale * 2, tier.height * treeScale, tier.radius * treeScale * 2);
      matrix.compose(position, quaternion, scale);
      crowns.setMatrixAt(crownIndex, matrix);
      crowns.setColorAt(crownIndex, crownColors[(index + tierIndex) % crownColors.length]);
      crownIndex += 1;
    }
  }

  trunks.instanceMatrix.needsUpdate = true;
  crowns.instanceMatrix.needsUpdate = true;
  if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
  group.add(trunks, crowns);
  return group;
}

function createCurrentMarkers(random) {
  const count = 14;
  const geometry = new THREE.CircleGeometry(1, 8);
  const material = new THREE.MeshBasicMaterial({
    color: "#d7ffff",
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = "downstreamCurrentMarkers";
  mesh.renderOrder = 3;
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const markerData = [];
  for (let index = 0; index < count; index += 1) {
    markerData.push({
      phase: (index + random() * 0.65) / count,
      lateral: (random() - 0.5) * 0.76,
      speed: 0.032 + random() * 0.012,
      width: 0.055 + random() * 0.035,
      length: 0.22 + random() * 0.16,
    });
  }

  return { mesh, markerData };
}

export function createDemo() {
  const random = createSeededRandom(0xa17e51de);
  const root = new THREE.Group();
  root.name = "alpineRiverValley";

  const terrainSystem = new THREE.Group();
  terrainSystem.name = "terrainSystem";
  const terrain = new THREE.Mesh(
    createTerrainGeometry(),
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
      roughness: 0.95,
      metalness: 0,
    }),
  );
  terrain.name = "terracedValleySlopes";
  terrain.receiveShadow = true;

  const bedData = createRiverStripGeometry(3, 1.13, riverBedHeight);
  const riverBed = new THREE.Mesh(
    bedData.geometry,
    new THREE.MeshStandardMaterial({
      color: "#315758",
      roughness: 0.98,
      metalness: 0,
    }),
  );
  riverBed.name = "riverBed";
  riverBed.receiveShadow = true;
  terrainSystem.add(terrain, riverBed);

  const waterSystem = new THREE.Group();
  waterSystem.name = "waterSystem";
  const waterData = createRiverStripGeometry(4, 0.985, waterHeight);
  const waterPosition = waterData.geometry.getAttribute("position");
  waterPosition.setUsage(THREE.DynamicDrawUsage);
  const water = new THREE.Mesh(
    waterData.geometry,
    new THREE.MeshStandardMaterial({
      color: "#43afbd",
      emissive: "#12363f",
      emissiveIntensity: 0.24,
      roughness: 0.28,
      metalness: 0,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
    }),
  );
  water.name = "riverSurface";
  water.renderOrder = 2;

  const { mesh: currentMarkers, markerData } = createCurrentMarkers(random);
  waterSystem.add(water, currentMarkers);

  const stoneSystem = new THREE.Group();
  stoneSystem.name = "stoneSystem";
  stoneSystem.add(createBoulders(random));

  const vegetationSystem = createConifers(random);
  root.add(terrainSystem, waterSystem, stoneSystem, vegetationSystem);

  const markerMatrix = new THREE.Matrix4();
  const markerPosition = new THREE.Vector3();
  const markerQuaternion = new THREE.Quaternion();
  const markerScale = new THREE.Vector3();
  const xAxis = new THREE.Vector3(1, 0, 0);
  const yAxis = new THREE.Vector3(0, 1, 0);
  const flatQuaternion = new THREE.Quaternion().setFromAxisAngle(
    xAxis,
    -Math.PI * 0.5,
  );
  const yawQuaternion = new THREE.Quaternion();

  function applyWaterMotion(time) {
    const positionArray = waterPosition.array;

    for (let vertex = 0; vertex < waterPosition.count; vertex += 1) {
      const component = vertex * 3;
      const coordinate = vertex * 2;
      const lateral = waterData.coordinates[coordinate];
      const z = waterData.coordinates[coordinate + 1];
      const bankDamping = 1 - Math.abs(lateral) * 0.36;
      const ripple =
        Math.sin(z * 2.35 + time * 2.15 + lateral * 2.2) * 0.014 +
        Math.sin(z * 4.7 - time * 3.05 - lateral * 3.8) * 0.006;
      positionArray[component] = waterData.basePositions[component];
      positionArray[component + 1] = waterData.basePositions[component + 1] + ripple * bankDamping;
      positionArray[component + 2] = waterData.basePositions[component + 2];
    }

    waterPosition.needsUpdate = true;
    waterData.geometry.computeVertexNormals();

    for (let index = 0; index < markerData.length; index += 1) {
      const marker = markerData[index];
      const progress = (marker.phase + time * marker.speed) % 1;
      const z = THREE.MathUtils.lerp(HALF_LENGTH - 0.55, -HALF_LENGTH + 0.55, progress);
      const x = riverCenter(z) + marker.lateral * riverHalfWidth(z);
      const derivative = riverDerivative(z);
      const yaw = Math.atan(derivative);
      yawQuaternion.setFromAxisAngle(yAxis, yaw);
      markerQuaternion.multiplyQuaternions(yawQuaternion, flatQuaternion);
      markerPosition.set(
        x,
        waterHeight(z) + 0.024 + Math.sin(z * 2.35 + time * 2.15) * 0.008,
        z,
      );
      markerScale.set(marker.width, marker.length, 1);
      markerMatrix.compose(markerPosition, markerQuaternion, markerScale);
      currentMarkers.setMatrixAt(index, markerMatrix);
    }

    currentMarkers.instanceMatrix.needsUpdate = true;
  }

  applyWaterMotion(0);

  return {
    root,
    update(_deltaSeconds, elapsedSeconds, motionEnabled) {
      applyWaterMotion(motionEnabled ? elapsedSeconds : 0);
    },
    reset() {
      applyWaterMotion(0);
    },
  };
}

import * as THREE from "three";

export const meta = {
  id: "desert-succulent",
  order: 100,
  title: "Desert Succulent",
  category: "ORGANIC",
  description:
    "A master fleshy leaf grows into a layered rosette above a glazed ceramic planter, recessed soil, and seeded stone dressing.",
  accent: "#d58d72",
  fidelityLane: "polished-stylized",
  identityFeatures: [
    "single thick, cupped master leaf shared by every rosette instance",
    "four growth-age rings progressing from spreading outer leaves to upright new growth",
    "sage-to-coral vertex-color transition concentrated at mature leaf tips",
    "tight five-leaf central crown with visibly smaller fresh growth",
    "warm glazed ceramic planter with raised rolled rim and grounded foot ring",
    "recessed dark soil plane with deterministic mineral top dressing",
  ],
  budgets: {
    triangles: 32000,
    drawCalls: 16,
    targetFps: 60,
    targetDevice: "desktop and modern mobile",
  },
  presentation: {
    background: "#181714",
    cameraDirection: [1.5, 1.15, 1.8],
    target: [0, 1.35, 0],
    fov: 35,
    screenCoverage: 0.84,
    exposure: 1.05,
    fogDensity: 0.012,
    floorColor: "#28231e",
    floorRoughness: 0.92,
    hemisphereSkyColor: "#f6d8c7",
    hemisphereGroundColor: "#241a15",
    hemisphereIntensity: 1.95,
    keyColor: "#ffe5cf",
    keyPosition: [4.5, 6.8, 4.2],
    keyIntensity: 3.8,
    rimColor: "#86a995",
    rimPosition: [-4.2, 3.8, -3.6],
    rimIntensity: 2.05,
  },
  evidenceViews: {
    hero: { cameraDirection: [1.5, 1.15, 1.8], fixedTimeSeconds: 0 },
    orbitA: { cameraDirection: [-1.7, 0.72, 1.35], fixedTimeSeconds: 0 },
    orbitB: { cameraDirection: [1.1, 0.62, -1.75], fixedTimeSeconds: 0 },
    neutralMaterial: {
      cameraDirection: [0.25, 0.5, 2.1],
      background: "#9b9288",
      floorColor: "#81786f",
      hemisphereSkyColor: "#ffffff",
      hemisphereGroundColor: "#777777",
      keyColor: "#ffffff",
      rimColor: "#ffffff",
      fogDensity: 0,
      exposure: 0.96,
      fixedTimeSeconds: 0,
    },
    subjectProof: {
      cameraDirection: [0.75, 1.65, 0.85],
      target: [0, 1.72, 0],
      screenCoverage: 0.9,
      fov: 31,
      fixedTimeSeconds: 0,
    },
  },
};

const TAU = Math.PI * 2;
const Y_AXIS = new THREE.Vector3(0, 1, 0);

function mulberry32(seed) {
  let state = seed >>> 0;
  return function random() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createMasterLeafGeometry() {
  const lengthSegments = 14;
  const widthSegments = 6;
  const rowSize = widthSegments + 1;
  const surfaceSize = (lengthSegments + 1) * rowSize;
  const positions = [];
  const colors = [];
  const indices = [];
  const basalColor = new THREE.Color("#5f7550");
  const bodyColor = new THREE.Color("#9ab873");
  const blushColor = new THREE.Color("#d28778");
  const color = new THREE.Color();

  for (let surface = 0; surface < 2; surface += 1) {
    const side = surface === 0 ? 1 : -1;
    for (let along = 0; along <= lengthSegments; along += 1) {
      const u = along / lengthSegments;
      const arch = Math.sin(Math.PI * u);
      const width = (0.062 * (1 - u) + 0.268 * Math.pow(arch, 0.76)) * (1 - u * 0.08);
      const thickness = (0.018 + arch * 0.026) * (0.94 - u * 0.18);
      const centerCurl = 0.06 * arch + 0.075 * u * u;

      for (let across = 0; across <= widthSegments; across += 1) {
        const v = across / widthSegments * 2 - 1;
        const edgeCup = 0.046 * v * v * arch;
        const edgeThickness = thickness * (1 - Math.abs(v) * 0.34);
        positions.push(v * width, u, centerCurl + edgeCup + side * edgeThickness);

        if (u < 0.68) color.copy(basalColor).lerp(bodyColor, u / 0.68);
        else color.copy(bodyColor).lerp(blushColor, (u - 0.68) / 0.32);
        const ridgeLight = (1 - Math.abs(v)) * arch * (surface === 0 ? 0.055 : 0.012);
        color.offsetHSL(0, 0, ridgeLight);
        colors.push(color.r, color.g, color.b);
      }
    }
  }

  for (let surface = 0; surface < 2; surface += 1) {
    const offset = surface * surfaceSize;
    for (let along = 0; along < lengthSegments; along += 1) {
      for (let across = 0; across < widthSegments; across += 1) {
        const a = offset + along * rowSize + across;
        const b = a + rowSize;
        const c = b + 1;
        const d = a + 1;
        if (surface === 0) indices.push(a, b, d, b, c, d);
        else indices.push(a, d, b, b, d, c);
      }
    }
  }

  for (let along = 0; along < lengthSegments; along += 1) {
    const topLeft = along * rowSize;
    const nextTopLeft = topLeft + rowSize;
    const bottomLeft = surfaceSize + topLeft;
    const nextBottomLeft = bottomLeft + rowSize;
    indices.push(topLeft, bottomLeft, nextTopLeft, nextTopLeft, bottomLeft, nextBottomLeft);

    const topRight = topLeft + widthSegments;
    const nextTopRight = nextTopLeft + widthSegments;
    const bottomRight = bottomLeft + widthSegments;
    const nextBottomRight = nextBottomLeft + widthSegments;
    indices.push(topRight, nextTopRight, bottomRight, nextTopRight, nextBottomRight, bottomRight);
  }

  for (const along of [0, lengthSegments]) {
    for (let across = 0; across < widthSegments; across += 1) {
      const topA = along * rowSize + across;
      const topB = topA + 1;
      const bottomA = surfaceSize + topA;
      const bottomB = bottomA + 1;
      if (along === 0) indices.push(topA, topB, bottomA, topB, bottomB, bottomA);
      else indices.push(topA, bottomA, topB, topB, bottomA, bottomB);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.name = "ThickCuppedMasterLeafGeometry";
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function createPlanterGeometry() {
  const profile = [
    new THREE.Vector2(0.54, 0.12),
    new THREE.Vector2(0.66, 0.14),
    new THREE.Vector2(0.76, 0.26),
    new THREE.Vector2(0.87, 1.22),
    new THREE.Vector2(0.84, 1.41),
  ];
  const geometry = new THREE.LatheGeometry(profile, 32);
  geometry.name = "WheelThrownPlanterGeometry";
  geometry.computeVertexNormals();
  return geometry;
}

function setShadow(mesh, cast = true, receive = true) {
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

export function createDemo() {
  const root = new THREE.Group();
  root.name = "DesertSucculentRoot";

  const planterAssembly = new THREE.Group();
  planterAssembly.name = "GroundedCeramicPlanterAssembly";
  root.add(planterAssembly);

  const plantAssembly = new THREE.Group();
  plantAssembly.name = "BiologicalRosetteAssembly";
  root.add(plantAssembly);

  const ceramicMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x985c42,
    roughness: 0.31,
    metalness: 0,
    clearcoat: 0.38,
    clearcoatRoughness: 0.22,
  });
  const ceramicEdgeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xb66f50,
    roughness: 0.27,
    metalness: 0,
    clearcoat: 0.48,
    clearcoatRoughness: 0.18,
  });
  const soilMaterial = new THREE.MeshStandardMaterial({
    color: 0x2f241c,
    roughness: 1,
    metalness: 0,
  });
  const leafMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.43,
    metalness: 0,
    clearcoat: 0.16,
    clearcoatRoughness: 0.5,
  });
  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.91,
    metalness: 0,
    flatShading: true,
  });

  const planter = setShadow(new THREE.Mesh(createPlanterGeometry(), ceramicMaterial));
  planter.name = "TaperedGlazedPlanterBody";
  planter.userData.attachment = "supported by foot ring; axial ceramic load path to floor";
  planterAssembly.add(planter);

  const foot = setShadow(new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.58, 0.2, 32, 2),
    ceramicMaterial,
  ));
  foot.name = "GroundContactCeramicFoot";
  foot.position.y = 0.1;
  foot.userData.joint = "integral fired ceramic foot";
  foot.userData.loadPath = "planter body -> foot ring -> floor";
  planterAssembly.add(foot);

  const rolledRim = setShadow(new THREE.Mesh(
    new THREE.TorusGeometry(0.81, 0.105, 10, 40),
    ceramicEdgeMaterial,
  ));
  rolledRim.name = "RolledGlazedPlanterRim";
  rolledRim.position.y = 1.42;
  rolledRim.rotation.x = Math.PI * 0.5;
  rolledRim.userData.joint = "integral rolled ceramic rim";
  planterAssembly.add(rolledRim);

  const innerLip = new THREE.Mesh(
    new THREE.TorusGeometry(0.69, 0.032, 8, 36),
    soilMaterial,
  );
  innerLip.name = "DarkInnerLipReveal";
  innerLip.position.y = 1.445;
  innerLip.rotation.x = Math.PI * 0.5;
  planterAssembly.add(innerLip);

  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.7, 0.13, 40, 1),
    soilMaterial,
  );
  soil.name = "RecessedSoilBed";
  soil.position.y = 1.39;
  soil.receiveShadow = true;
  planterAssembly.add(soil);

  const random = mulberry32(0x5acc11e7);
  const pebbleGeometry = new THREE.IcosahedronGeometry(0.1, 1);
  pebbleGeometry.name = "MineralTopDressingMasterGeometry";
  const pebbleCount = 22;
  const pebbles = new THREE.InstancedMesh(pebbleGeometry, stoneMaterial, pebbleCount);
  pebbles.name = "SeededMineralTopDressingInstances";
  pebbles.castShadow = true;
  pebbles.receiveShadow = true;
  const pebbleDummy = new THREE.Object3D();
  const pebbleColor = new THREE.Color();
  for (let index = 0; index < pebbleCount; index += 1) {
    const angle = random() * TAU;
    const radius = THREE.MathUtils.lerp(0.42, 0.65, Math.sqrt(random()));
    pebbleDummy.position.set(Math.cos(angle) * radius, 1.478, Math.sin(angle) * radius);
    pebbleDummy.rotation.set(random() * 0.7, random() * TAU, random() * 0.7);
    const scale = THREE.MathUtils.lerp(0.48, 1.05, random());
    pebbleDummy.scale.set(scale * (0.75 + random() * 0.5), scale * 0.58, scale);
    pebbleDummy.updateMatrix();
    pebbles.setMatrixAt(index, pebbleDummy.matrix);
    pebbleColor.setHSL(0.07 + random() * 0.06, 0.08 + random() * 0.12, 0.43 + random() * 0.2);
    pebbles.setColorAt(index, pebbleColor);
  }
  pebbles.instanceMatrix.needsUpdate = true;
  if (pebbles.instanceColor) pebbles.instanceColor.needsUpdate = true;
  planterAssembly.add(pebbles);

  const leafGeometry = createMasterLeafGeometry();
  const ringSpecs = [
    { count: 18, radius: 0.075, length: 1.22, rise: 0.28, width: 1.12, phase: 0.18, flex: 0.013 },
    { count: 13, radius: 0.052, length: 0.98, rise: 0.48, width: 1.02, phase: 1.02, flex: 0.009 },
    { count: 9, radius: 0.034, length: 0.7, rise: 0.72, width: 0.9, phase: 2.16, flex: 0.006 },
    { count: 5, radius: 0.018, length: 0.43, rise: 0.92, width: 0.72, phase: 2.92, flex: 0.003 },
  ];
  const leafCount = ringSpecs.reduce((sum, ring) => sum + ring.count, 0);
  const leaves = new THREE.InstancedMesh(leafGeometry, leafMaterial, leafCount);
  leaves.name = "MasterLeafRosetteInstances";
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  leaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  plantAssembly.add(leaves);

  const leafStates = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  let globalLeafIndex = 0;
  ringSpecs.forEach((ring, ringIndex) => {
    for (let index = 0; index < ring.count; index += 1) {
      const azimuth = index * goldenAngle + ring.phase + (random() - 0.5) * 0.13;
      const maturity = index / Math.max(ring.count - 1, 1);
      leafStates.push({
        index: globalLeafIndex,
        azimuth,
        radius: ring.radius * (0.72 + random() * 0.45),
        baseY: 1.47 + ringIndex * 0.018,
        length: ring.length * (0.9 + random() * 0.16),
        rise: ring.rise + (random() - 0.5) * 0.055,
        width: ring.width * (0.91 + random() * 0.16),
        thickness: 0.9 + random() * 0.2,
        roll: (random() - 0.5) * 0.12,
        phase: random() * TAU + maturity * 0.5,
        flex: ring.flex,
        tint: new THREE.Color().setHSL(
          0.235 + ringIndex * 0.009 + (random() - 0.5) * 0.018,
          0.24 + (3 - ringIndex) * 0.025,
          0.73 + ringIndex * 0.025 + (random() - 0.5) * 0.04,
        ),
      });
      globalLeafIndex += 1;
    }
  });

  const leafDummy = new THREE.Object3D();
  const tangent = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const basis = new THREE.Matrix4();
  const rollQuaternion = new THREE.Quaternion();

  function updateLeafMatrices(elapsedSeconds = 0, motionEnabled = false) {
    for (const leaf of leafStates) {
      const wave = motionEnabled
        ? Math.sin(elapsedSeconds * 0.62 + leaf.phase) * leaf.flex
        : 0;
      const azimuth = leaf.azimuth + wave * 0.28;
      const horizontal = Math.sqrt(Math.max(0.05, 1 - leaf.rise * leaf.rise));
      direction.set(
        Math.cos(azimuth) * horizontal,
        THREE.MathUtils.clamp(leaf.rise + wave, 0.18, 0.98),
        Math.sin(azimuth) * horizontal,
      ).normalize();
      tangent.set(-Math.sin(azimuth), 0, Math.cos(azimuth)).normalize();
      normal.crossVectors(tangent, direction).normalize();
      basis.makeBasis(tangent, direction, normal);
      leafDummy.quaternion.setFromRotationMatrix(basis);
      rollQuaternion.setFromAxisAngle(Y_AXIS, leaf.roll + wave * 0.22);
      leafDummy.quaternion.multiply(rollQuaternion);
      leafDummy.position.set(
        Math.cos(azimuth) * leaf.radius,
        leaf.baseY + (motionEnabled ? Math.sin(elapsedSeconds * 0.45 + leaf.phase) * 0.002 : 0),
        Math.sin(azimuth) * leaf.radius,
      );
      const breath = motionEnabled ? 1 + Math.sin(elapsedSeconds * 0.38 + leaf.phase) * 0.0025 : 1;
      leafDummy.scale.set(leaf.width, leaf.length * breath, leaf.thickness);
      leafDummy.updateMatrix();
      leaves.setMatrixAt(leaf.index, leafDummy.matrix);
      leaves.setColorAt(leaf.index, leaf.tint);
    }
    leaves.instanceMatrix.needsUpdate = true;
    if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
  }

  updateLeafMatrices(0, false);

  const warmBounce = new THREE.PointLight(0xffb98f, 3.2, 4.5, 2);
  warmBounce.name = "WarmCeramicBounceLight";
  warmBounce.position.set(1.8, 2.6, 1.5);
  root.add(warmBounce);

  let disposed = false;
  return {
    root,
    update(_deltaSeconds, elapsedSeconds, motionEnabled) {
      if (disposed) return;
      updateLeafMatrices(elapsedSeconds, motionEnabled);
    },
    reset() {
      if (disposed) return;
      updateLeafMatrices(0, false);
    },
    dispose() {
      disposed = true;
      leafStates.length = 0;
    },
  };
}

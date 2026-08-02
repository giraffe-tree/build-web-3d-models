import * as THREE from "three";

export const meta = {
  id: "mushroom-garden",
  order: 40,
  title: "Bioluminescent Mushroom Garden",
  category: "ORGANIC",
  description:
    "A seeded miniature night garden tests clustered organic scatter, shared geometry, attached cap motion, and emissive material response.",
  accent: "#72f1d2",
  background: "#071015",
  cameraDirection: [1.75, 1.1, 2.05],
  target: [0, 0.72, 0],
};

const TAU = Math.PI * 2;

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

function variedColor(hex, random, hueRange = 0.025, lightnessRange = 0.08) {
  const color = new THREE.Color(hex);
  color.offsetHSL(
    (random() - 0.5) * hueRange,
    (random() - 0.5) * 0.08,
    (random() - 0.5) * lightnessRange,
  );
  return color;
}

function makeCapGeometry(profile, segments = 20) {
  const points = profile.map(([radius, height]) => new THREE.Vector2(radius, height));
  const geometry = new THREE.LatheGeometry(points, segments);
  geometry.computeVertexNormals();
  return geometry;
}

function makeStemGeometry(topRadius, bottomRadius, height, radialSegments = 9) {
  const geometry = new THREE.CylinderGeometry(
    topRadius,
    bottomRadius,
    height,
    radialSegments,
    2,
  );
  geometry.translate(0, height * 0.5, 0);
  return geometry;
}

function makeCurvedStemGeometry() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.035, 0.24, 0),
    new THREE.Vector3(0.065, 0.55, 0.015),
    new THREE.Vector3(0.16, 0.82, 0),
    new THREE.Vector3(0.13, 1.02, 0),
  ]);
  return new THREE.TubeGeometry(curve, 10, 0.065, 7, false);
}

function createInstancedPart(name, geometry, material, count, parent, castShadow = false) {
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = name;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  parent.add(mesh);
  return mesh;
}

function setStaticTransform(mesh, index, position, rotation, scale, dummy) {
  dummy.position.copy(position);
  dummy.rotation.copy(rotation);
  dummy.scale.copy(scale);
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
}

export function createDemo() {
  const root = new THREE.Group();
  root.name = "mushroom-garden-root";

  const groundAccents = new THREE.Group();
  groundAccents.name = "ground-accents";
  root.add(groundAccents);

  const mushroomLayer = new THREE.Group();
  mushroomLayer.name = "mushroom-layer";
  root.add(mushroomLayer);

  const random = mulberry32(0x4d555348);
  const stemMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0,
    emissive: 0x151915,
    emissiveIntensity: 0.22,
  });
  const gillMaterial = new THREE.MeshStandardMaterial({
    color: 0xc9fff0,
    roughness: 0.5,
    metalness: 0,
    emissive: 0x66ffd8,
    emissiveIntensity: 1.55,
  });
  const collarMaterial = new THREE.MeshStandardMaterial({
    color: 0xb9d8c7,
    roughness: 0.72,
    metalness: 0,
    emissive: 0x1b4639,
    emissiveIntensity: 0.3,
  });

  const archetypes = {
    parasol: {
      capGeometry: makeCapGeometry([
        [0, 0.13],
        [0.13, 0.155],
        [0.34, 0.115],
        [0.58, -0.01],
        [0.55, -0.08],
        [0.28, -0.12],
        [0.1, -0.085],
        [0, -0.06],
      ]),
      stemGeometry: makeStemGeometry(0.055, 0.105, 1.14),
      stemHeight: 1.14,
      gillScale: 0.48,
      gillOffset: -0.085,
      color: "#8299ff",
      emissive: "#6077ff",
      sizeRange: [0.72, 1.02],
      sway: 0.026,
    },
    bell: {
      capGeometry: makeCapGeometry([
        [0, 0.36],
        [0.12, 0.315],
        [0.22, 0.18],
        [0.32, -0.08],
        [0.3, -0.3],
        [0.22, -0.34],
        [0.1, -0.275],
        [0, -0.22],
      ]),
      stemGeometry: makeCurvedStemGeometry(),
      stemHeight: 1.02,
      gillScale: 0.2,
      gillOffset: -0.27,
      color: "#66e9ff",
      emissive: "#39d9ff",
      sizeRange: [0.72, 0.98],
      sway: 0.032,
    },
    button: {
      capGeometry: makeCapGeometry([
        [0, 0.27],
        [0.16, 0.3],
        [0.34, 0.22],
        [0.44, 0.06],
        [0.41, -0.1],
        [0.25, -0.16],
        [0.08, -0.11],
        [0, -0.08],
      ]),
      stemGeometry: makeStemGeometry(0.155, 0.235, 0.62, 10),
      stemHeight: 0.62,
      gillScale: 0.32,
      gillOffset: -0.105,
      color: "#ff8fd8",
      emissive: "#ff55c7",
      sizeRange: [0.62, 0.9],
      sway: 0.018,
    },
    cup: {
      capGeometry: makeCapGeometry([
        [0, 0],
        [0.1, 0.02],
        [0.28, 0.11],
        [0.48, 0.18],
        [0.52, 0.09],
        [0.43, -0.03],
        [0.22, -0.1],
        [0, -0.07],
      ]),
      stemGeometry: makeStemGeometry(0.09, 0.16, 0.88),
      stemHeight: 0.88,
      gillScale: 0.35,
      gillOffset: -0.06,
      color: "#a7ff7c",
      emissive: "#6dff62",
      sizeRange: [0.68, 0.96],
      sway: 0.025,
    },
  };

  for (const archetype of Object.values(archetypes)) {
    archetype.capMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0,
      emissive: new THREE.Color(archetype.emissive),
      emissiveIntensity: 1.05,
    });
  }

  const clusterSpecs = [
    { type: "parasol", center: [-0.78, 0.16], count: 4, spread: 0.5 },
    { type: "bell", center: [0.62, -0.1], count: 5, spread: 0.48 },
    { type: "button", center: [-0.2, -0.68], count: 6, spread: 0.52 },
    { type: "cup", center: [0.38, 0.62], count: 5, spread: 0.5 },
  ];
  const mushrooms = [];

  for (const cluster of clusterSpecs) {
    const archetype = archetypes[cluster.type];
    for (let index = 0; index < cluster.count; index += 1) {
      const angle = index === 0 ? random() * TAU : random() * TAU;
      const radius = index === 0 ? 0 : Math.sqrt(random()) * cluster.spread;
      const size =
        THREE.MathUtils.lerp(archetype.sizeRange[0], archetype.sizeRange[1], random()) *
        (index === 0 ? 1.12 : 1);
      mushrooms.push({
        type: cluster.type,
        archetype,
        position: new THREE.Vector3(
          cluster.center[0] + Math.cos(angle) * radius,
          0.025,
          cluster.center[1] + Math.sin(angle) * radius,
        ),
        yaw: random() * TAU,
        leanX: (random() - 0.5) * 0.085,
        leanZ: (random() - 0.5) * 0.085,
        size,
        phase: random() * TAU,
      });
    }
  }

  const capMeshes = {};
  const stemMeshes = {};
  const familyGroups = {};
  for (const cluster of clusterSpecs) {
    const archetype = archetypes[cluster.type];
    const family = new THREE.Group();
    family.name = `${cluster.type}-family`;
    mushroomLayer.add(family);
    familyGroups[cluster.type] = family;

    const familyMushrooms = mushrooms.filter((mushroom) => mushroom.type === cluster.type);
    stemMeshes[cluster.type] = createInstancedPart(
      `${cluster.type}-stems-ground-pivot`,
      archetype.stemGeometry,
      stemMaterial,
      familyMushrooms.length,
      family,
      true,
    );
    stemMeshes[cluster.type].userData.pivot = "ground-contact";
    capMeshes[cluster.type] = createInstancedPart(
      `${cluster.type}-caps-stem-tip-attachment`,
      archetype.capGeometry,
      archetype.capMaterial,
      familyMushrooms.length,
      family,
      true,
    );
    capMeshes[cluster.type].userData.attachment = "stem-tip";

    familyMushrooms.forEach((mushroom, familyIndex) => {
      mushroom.familyIndex = familyIndex;
      stemMeshes[cluster.type].setColorAt(
        familyIndex,
        variedColor("#c8c6ae", random, 0.035, 0.11),
      );
      capMeshes[cluster.type].setColorAt(
        familyIndex,
        variedColor(archetype.color, random, 0.04, 0.1),
      );
    });
    stemMeshes[cluster.type].instanceColor.needsUpdate = true;
    capMeshes[cluster.type].instanceColor.needsUpdate = true;
  }

  const gillGeometry = new THREE.CylinderGeometry(0.92, 0.18, 0.035, 16, 1, false);
  const gillMesh = createInstancedPart(
    "shared-emissive-gills-stem-tip-attachment",
    gillGeometry,
    gillMaterial,
    mushrooms.length,
    mushroomLayer,
  );
  gillMesh.userData.attachment = "cap-underside";
  mushrooms.forEach((mushroom, index) => {
    mushroom.gillIndex = index;
    gillMesh.setColorAt(index, variedColor(mushroom.archetype.color, random, 0.03, 0.12));
  });
  gillMesh.instanceColor.needsUpdate = true;

  const parasols = mushrooms.filter((mushroom) => mushroom.type === "parasol");
  const collarGeometry = new THREE.TorusGeometry(0.14, 0.025, 6, 16);
  collarGeometry.rotateX(Math.PI * 0.5);
  const collarMesh = createInstancedPart(
    "parasol-collars-stem-attachment",
    collarGeometry,
    collarMaterial,
    parasols.length,
    familyGroups.parasol,
  );
  parasols.forEach((mushroom, index) => {
    mushroom.detailIndex = index;
  });

  const buttons = mushrooms.filter((mushroom) => mushroom.type === "button");
  const bulbGeometry = new THREE.SphereGeometry(0.24, 10, 6);
  const bulbMesh = createInstancedPart(
    "button-basal-bulbs-ground-attachment",
    bulbGeometry,
    stemMaterial,
    buttons.length,
    familyGroups.button,
    true,
  );
  buttons.forEach((mushroom, index) => {
    mushroom.detailIndex = index;
    bulbMesh.setColorAt(index, variedColor("#bbbba2", random, 0.025, 0.08));
  });
  bulbMesh.instanceColor.needsUpdate = true;

  const cups = mushrooms.filter((mushroom) => mushroom.type === "cup");
  const cupRimGeometry = new THREE.TorusGeometry(0.49, 0.022, 6, 20);
  cupRimGeometry.rotateX(Math.PI * 0.5);
  const cupRimMesh = createInstancedPart(
    "cup-luminous-rims-cap-attachment",
    cupRimGeometry,
    gillMaterial,
    cups.length,
    familyGroups.cup,
  );
  cups.forEach((mushroom, index) => {
    mushroom.detailIndex = index;
    cupRimMesh.setColorAt(index, variedColor("#a7ff7c", random, 0.025, 0.09));
  });
  cupRimMesh.instanceColor.needsUpdate = true;

  const soilMaterial = new THREE.MeshStandardMaterial({
    color: 0x18201c,
    roughness: 0.96,
    metalness: 0,
  });
  const mossMaterial = new THREE.MeshStandardMaterial({
    color: 0x294c35,
    roughness: 0.92,
    metalness: 0,
    emissive: 0x07170d,
    emissiveIntensity: 0.3,
  });
  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x243238,
    roughness: 0.82,
    metalness: 0,
  });
  const shootMaterial = new THREE.MeshStandardMaterial({
    color: 0x4b8755,
    roughness: 0.84,
    metalness: 0,
  });

  const dummy = new THREE.Object3D();
  const moundGeometry = new THREE.SphereGeometry(1, 14, 7);
  const moundMesh = createInstancedPart(
    "soil-mounds",
    moundGeometry,
    soilMaterial,
    5,
    groundAccents,
  );
  const moundTransforms = [
    [[0, -0.035, 0], [0, 0.15, 0], [1.35, 0.1, 1.05]],
    [[-0.85, -0.04, 0.15], [0, -0.3, 0], [0.85, 0.085, 0.72]],
    [[0.65, -0.04, -0.2], [0, 0.42, 0], [0.92, 0.09, 0.7]],
    [[0.42, -0.045, 0.75], [0, -0.2, 0], [0.78, 0.075, 0.56]],
    [[-0.18, -0.045, -0.78], [0, 0.18, 0], [0.72, 0.07, 0.55]],
  ];
  moundTransforms.forEach(([position, rotation, scale], index) => {
    setStaticTransform(
      moundMesh,
      index,
      new THREE.Vector3(...position),
      new THREE.Euler(...rotation),
      new THREE.Vector3(...scale),
      dummy,
    );
  });
  moundMesh.receiveShadow = true;

  const mossGeometry = new THREE.DodecahedronGeometry(0.16, 0);
  const mossMesh = createInstancedPart(
    "moss-cushions",
    mossGeometry,
    mossMaterial,
    34,
    groundAccents,
  );
  for (let index = 0; index < mossMesh.count; index += 1) {
    const angle = random() * TAU;
    const radius = 0.35 + Math.sqrt(random()) * 1.18;
    const size = 0.62 + random() * 0.76;
    setStaticTransform(
      mossMesh,
      index,
      new THREE.Vector3(Math.cos(angle) * radius, 0.035, Math.sin(angle) * radius * 0.82),
      new THREE.Euler((random() - 0.5) * 0.25, random() * TAU, (random() - 0.5) * 0.25),
      new THREE.Vector3(size, size * 0.42, size * (0.8 + random() * 0.35)),
      dummy,
    );
    mossMesh.setColorAt(index, variedColor("#315b3e", random, 0.03, 0.1));
  }
  mossMesh.instanceColor.needsUpdate = true;

  const rockGeometry = new THREE.DodecahedronGeometry(0.18, 0);
  const rockMesh = createInstancedPart(
    "embedded-rocks",
    rockGeometry,
    rockMaterial,
    11,
    groundAccents,
    true,
  );
  for (let index = 0; index < rockMesh.count; index += 1) {
    const angle = (index / rockMesh.count) * TAU + (random() - 0.5) * 0.45;
    const radius = 0.62 + random() * 0.83;
    const size = 0.7 + random() * 0.75;
    setStaticTransform(
      rockMesh,
      index,
      new THREE.Vector3(Math.cos(angle) * radius, 0.09 * size, Math.sin(angle) * radius * 0.82),
      new THREE.Euler(random() * 0.65, random() * TAU, random() * 0.55),
      new THREE.Vector3(size, size * (0.55 + random() * 0.38), size * (0.72 + random() * 0.42)),
      dummy,
    );
    rockMesh.setColorAt(index, variedColor("#2b3b40", random, 0.018, 0.09));
  }
  rockMesh.instanceColor.needsUpdate = true;

  const shootGeometry = new THREE.ConeGeometry(0.027, 0.17, 5, 1);
  shootGeometry.translate(0, 0.085, 0);
  const shootMesh = createInstancedPart(
    "moss-shoots",
    shootGeometry,
    shootMaterial,
    28,
    groundAccents,
  );
  for (let index = 0; index < shootMesh.count; index += 1) {
    const angle = random() * TAU;
    const radius = 0.25 + Math.sqrt(random()) * 1.25;
    const size = 0.65 + random() * 0.85;
    setStaticTransform(
      shootMesh,
      index,
      new THREE.Vector3(Math.cos(angle) * radius, 0.025, Math.sin(angle) * radius * 0.82),
      new THREE.Euler((random() - 0.5) * 0.28, random() * TAU, (random() - 0.5) * 0.28),
      new THREE.Vector3(size, size, size),
      dummy,
    );
  }

  const moteCount = 26;
  const moteGeometry = new THREE.BufferGeometry();
  const motePositions = new Float32Array(moteCount * 3);
  const moteBase = [];
  for (let index = 0; index < moteCount; index += 1) {
    const angle = random() * TAU;
    const radius = 0.2 + Math.sqrt(random()) * 1.35;
    moteBase.push({
      x: Math.cos(angle) * radius,
      y: 0.28 + random() * 1.26,
      z: Math.sin(angle) * radius * 0.82,
      phase: random() * TAU,
      drift: 0.018 + random() * 0.028,
    });
  }
  moteGeometry.setAttribute("position", new THREE.BufferAttribute(motePositions, 3));
  const moteMaterial = new THREE.PointsMaterial({
    color: 0xbaffec,
    size: 0.025,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const motes = new THREE.Points(moteGeometry, moteMaterial);
  motes.name = "spore-motes";
  root.add(motes);

  const glowLights = new THREE.Group();
  glowLights.name = "glow-lights";
  root.add(glowLights);
  const cyanGlow = new THREE.PointLight(0x57e9ff, 1.7, 4.2, 2);
  cyanGlow.name = "cyan-cluster-glow";
  cyanGlow.position.set(0.58, 0.72, -0.08);
  glowLights.add(cyanGlow);
  const mintGlow = new THREE.PointLight(0x8cffaf, 1.35, 3.8, 2);
  mintGlow.name = "mint-cluster-glow";
  mintGlow.position.set(0.25, 0.58, 0.62);
  glowLights.add(mintGlow);

  const baseMatrix = new THREE.Matrix4();
  const localMatrix = new THREE.Matrix4();
  const worldMatrix = new THREE.Matrix4();
  const baseQuaternion = new THREE.Quaternion();
  const localQuaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const euler = new THREE.Euler(0, 0, 0, "YXZ");
  const unitScale = new THREE.Vector3(1, 1, 1);
  const zero = new THREE.Vector3();

  function setAttachedMatrix(mesh, index, base, localPosition, localRotation, localScale) {
    localMatrix.compose(localPosition, localRotation, localScale);
    worldMatrix.multiplyMatrices(base, localMatrix);
    mesh.setMatrixAt(index, worldMatrix);
  }

  function poseMushrooms(elapsedSeconds, motionEnabled) {
    for (const mushroom of mushrooms) {
      const motion = motionEnabled
        ? Math.sin(elapsedSeconds * 0.72 + mushroom.phase) * mushroom.archetype.sway
        : 0;
      const crossMotion = motionEnabled
        ? Math.sin(elapsedSeconds * 0.53 + mushroom.phase * 1.37) * mushroom.archetype.sway * 0.55
        : 0;
      const breathing = motionEnabled
        ? 1 + Math.sin(elapsedSeconds * 1.06 + mushroom.phase * 1.61) * 0.016
        : 1;

      position.copy(mushroom.position);
      euler.set(mushroom.leanX + motion, mushroom.yaw, mushroom.leanZ + crossMotion);
      baseQuaternion.setFromEuler(euler);
      baseMatrix.compose(position, baseQuaternion, unitScale);

      scale.setScalar(mushroom.size);
      setAttachedMatrix(
        stemMeshes[mushroom.type],
        mushroom.familyIndex,
        baseMatrix,
        zero,
        localQuaternion.identity(),
        scale,
      );

      position.set(0, mushroom.archetype.stemHeight * mushroom.size, 0);
      scale.setScalar(mushroom.size * breathing);
      setAttachedMatrix(
        capMeshes[mushroom.type],
        mushroom.familyIndex,
        baseMatrix,
        position,
        localQuaternion.identity(),
        scale,
      );

      position.set(
        0,
        (mushroom.archetype.stemHeight + mushroom.archetype.gillOffset) * mushroom.size,
        0,
      );
      scale.set(
        mushroom.archetype.gillScale * mushroom.size * breathing,
        mushroom.size,
        mushroom.archetype.gillScale * mushroom.size * breathing,
      );
      setAttachedMatrix(
        gillMesh,
        mushroom.gillIndex,
        baseMatrix,
        position,
        localQuaternion.identity(),
        scale,
      );

      if (mushroom.type === "parasol") {
        position.set(0, mushroom.archetype.stemHeight * mushroom.size * 0.7, 0);
        scale.setScalar(mushroom.size);
        setAttachedMatrix(
          collarMesh,
          mushroom.detailIndex,
          baseMatrix,
          position,
          localQuaternion.identity(),
          scale,
        );
      } else if (mushroom.type === "button") {
        position.set(0, 0.12 * mushroom.size, 0);
        scale.set(mushroom.size, mushroom.size * 0.72, mushroom.size);
        setAttachedMatrix(
          bulbMesh,
          mushroom.detailIndex,
          baseMatrix,
          position,
          localQuaternion.identity(),
          scale,
        );
      } else if (mushroom.type === "cup") {
        position.set(0, (mushroom.archetype.stemHeight + 0.135) * mushroom.size, 0);
        scale.setScalar(mushroom.size * breathing);
        setAttachedMatrix(
          cupRimMesh,
          mushroom.detailIndex,
          baseMatrix,
          position,
          localQuaternion.identity(),
          scale,
        );
      }
    }

    const dynamicMeshes = [
      ...Object.values(stemMeshes),
      ...Object.values(capMeshes),
      gillMesh,
      collarMesh,
      bulbMesh,
      cupRimMesh,
    ];
    for (const mesh of dynamicMeshes) {
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  function poseMotes(elapsedSeconds, motionEnabled) {
    const positions = moteGeometry.getAttribute("position");
    for (let index = 0; index < moteBase.length; index += 1) {
      const mote = moteBase[index];
      const horizontal = motionEnabled
        ? Math.sin(elapsedSeconds * 0.46 + mote.phase) * mote.drift
        : 0;
      const vertical = motionEnabled
        ? Math.sin(elapsedSeconds * 0.68 + mote.phase * 1.31) * mote.drift * 1.8
        : 0;
      positions.setXYZ(index, mote.x + horizontal, mote.y + vertical, mote.z - horizontal * 0.55);
    }
    positions.needsUpdate = true;
  }

  function setPose(elapsedSeconds, motionEnabled) {
    poseMushrooms(elapsedSeconds, motionEnabled);
    poseMotes(elapsedSeconds, motionEnabled);
  }

  setPose(0, false);

  root.userData.forwardTest = {
    seed: "0x4d555348",
    mushroomCount: mushrooms.length,
    archetypes: Object.keys(archetypes),
    visibleDrawCallTarget: 20,
    triangleTarget: 20000,
  };

  return {
    root,
    update(_deltaSeconds, elapsedSeconds, motionEnabled) {
      setPose(elapsedSeconds, motionEnabled);
    },
    reset() {
      setPose(0, false);
    },
  };
}

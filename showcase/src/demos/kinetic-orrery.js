import * as THREE from "three";

export const meta = {
  id: "kinetic-orrery",
  order: 80,
  title: "Kinetic Brass Orrery",
  category: "MECHANISM",
  description: "A desk-scale brass orrery proves nested gimbals, visible gearing, counterweighted planet arms, and deterministic mechanical motion.",
  accent: "#e1b96d",
  fidelityLane: "polished-stylized",
  identityFeatures: [
    "stepped dark-brass observatory plinth with an exposed three-gear drive train",
    "concentric meridian, polar, and tilted ecliptic rings on explicit bearing axes",
    "central luminous sun carried by a coaxial spindle and halo cage",
    "four graduated orbit tracks with counterweighted journal-bearing planet arms",
    "contrasting enamel planets plus a separately orbiting moon",
    "engraved-style degree ticks, axle caps, and structural clamp hardware",
  ],
  budgets: {
    triangles: 72_000,
    drawCalls: 58,
    targetFps: 45,
    targetDevice: "desktop and modern mobile WebGL2",
  },
  presentation: {
    background: "#07090d",
    cameraDirection: [1.58, 0.94, 2.08],
    target: [0, 1.28, 0],
    fov: 34,
    screenCoverage: 0.86,
    exposure: 1.14,
    fogDensity: 0.012,
    floorColor: "#111216",
    floorRoughness: 0.82,
    floorMetalness: 0.06,
    hemisphereSkyColor: "#adc9f0",
    hemisphereGroundColor: "#24180d",
    hemisphereIntensity: 1.6,
    keyColor: "#ffe4b8",
    keyIntensity: 5.1,
    keyPosition: [4.2, 6.5, 4.8],
    rimColor: "#6f88c8",
    rimIntensity: 2.35,
    rimPosition: [-4.8, 3.8, -3.4],
  },
  evidenceViews: {
    hero: {
      cameraDirection: [1.58, 0.94, 2.08],
      fixedTimeSeconds: 0,
    },
    orbitA: {
      cameraDirection: [-1.66, 0.72, 1.42],
      fixedTimeSeconds: 0,
    },
    orbitB: {
      cameraDirection: [1.18, 0.64, -1.86],
      fixedTimeSeconds: 0,
    },
    neutralMaterial: {
      cameraDirection: [0.12, 0.5, 2.2],
      background: "#9ba0a8",
      floorColor: "#73777d",
      floorMetalness: 0,
      floorRoughness: 0.78,
      hemisphereSkyColor: "#ffffff",
      hemisphereGroundColor: "#777777",
      keyColor: "#ffffff",
      rimColor: "#dfe8ff",
      exposure: 0.92,
      fixedTimeSeconds: 0,
    },
    subjectProof: {
      cameraDirection: [1.94, 0.26, 0.74],
      target: [0, 0.68, 0.1],
      screenCoverage: 0.9,
      fixedTimeSeconds: 0,
    },
  },
};

function markSurface(mesh, receiveShadow = false) {
  mesh.castShadow = true;
  mesh.receiveShadow = receiveShadow;
  return mesh;
}

function makeMesh(name, geometry, material, receiveShadow = false) {
  const mesh = markSurface(new THREE.Mesh(geometry, material), receiveShadow);
  mesh.name = name;
  return mesh;
}

function makeAxialCylinder(name, radius, length, material, axis = "y", segments = 28) {
  const mesh = makeMesh(
    name,
    new THREE.CylinderGeometry(radius, radius, length, segments, 1),
    material,
  );
  if (axis === "x") mesh.rotation.z = Math.PI / 2;
  if (axis === "z") mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function makeGear(name, toothCount, rootRadius, toothDepth, thickness, material, hubMaterial) {
  const shape = new THREE.Shape();
  const sampleCount = toothCount * 4;

  for (let index = 0; index < sampleCount; index += 1) {
    const angle = (index / sampleCount) * Math.PI * 2;
    const toothPhase = index % 4;
    const radius = rootRadius + (toothPhase === 1 || toothPhase === 2 ? toothDepth : 0);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const bore = new THREE.Path();
  bore.absarc(0, 0, rootRadius * 0.22, 0, Math.PI * 2, true);
  shape.holes.push(bore);

  const gearGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.006,
    bevelThickness: 0.006,
    curveSegments: 4,
  });
  gearGeometry.translate(0, 0, -thickness / 2);
  gearGeometry.computeVertexNormals();

  const group = new THREE.Group();
  group.name = name;

  const wheel = makeMesh(`${name}_TOOTHED_WHEEL`, gearGeometry, material);
  group.add(wheel);

  const hub = makeAxialCylinder(
    `${name}_HUB`,
    rootRadius * 0.32,
    thickness * 1.35,
    hubMaterial,
    "z",
    24,
  );
  group.add(hub);

  const axle = makeAxialCylinder(
    `${name}_AXLE_CAP`,
    rootRadius * 0.105,
    thickness * 1.72,
    material,
    "z",
    20,
  );
  group.add(axle);
  return group;
}

function makeRing(name, radius, tube, material, radialSegments = 80) {
  return makeMesh(
    name,
    new THREE.TorusGeometry(radius, tube, 10, radialSegments),
    material,
  );
}

function addDegreeTicks(parent, material, radius) {
  const tickGeometry = new THREE.BoxGeometry(1, 1, 1);
  const ticks = new THREE.InstancedMesh(tickGeometry, material, 24);
  const transform = new THREE.Object3D();
  ticks.name = "MERIDIAN_DEGREE_TICKS";
  ticks.castShadow = true;

  for (let index = 0; index < 24; index += 1) {
    const angle = (index / 24) * Math.PI * 2;
    const cardinal = index % 6 === 0;
    transform.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.014);
    transform.rotation.set(0, 0, angle);
    transform.scale.set(cardinal ? 0.013 : 0.008, cardinal ? 0.088 : 0.052, 0.014);
    transform.updateMatrix();
    ticks.setMatrixAt(index, transform.matrix);
  }
  ticks.instanceMatrix.needsUpdate = true;
  parent.add(ticks);
}

export function createDemo() {
  const root = new THREE.Group();
  root.name = "KINETIC_ORRERY_ROOT";

  const materials = {
    brass: new THREE.MeshStandardMaterial({
      color: 0xb9863e,
      metalness: 0.9,
      roughness: 0.24,
    }),
    brassLight: new THREE.MeshStandardMaterial({
      color: 0xe0b96e,
      metalness: 0.86,
      roughness: 0.2,
    }),
    agedBrass: new THREE.MeshStandardMaterial({
      color: 0x725226,
      metalness: 0.8,
      roughness: 0.38,
    }),
    patina: new THREE.MeshStandardMaterial({
      color: 0x315a53,
      metalness: 0.5,
      roughness: 0.48,
    }),
    blackSteel: new THREE.MeshStandardMaterial({
      color: 0x171b20,
      metalness: 0.82,
      roughness: 0.28,
    }),
    rubber: new THREE.MeshStandardMaterial({
      color: 0x070809,
      metalness: 0,
      roughness: 0.88,
    }),
    ivory: new THREE.MeshPhysicalMaterial({
      color: 0xe3dbc7,
      metalness: 0,
      roughness: 0.44,
      clearcoat: 0.45,
      clearcoatRoughness: 0.3,
    }),
    cobalt: new THREE.MeshPhysicalMaterial({
      color: 0x244d86,
      metalness: 0.05,
      roughness: 0.28,
      clearcoat: 0.72,
      clearcoatRoughness: 0.18,
    }),
    vermilion: new THREE.MeshPhysicalMaterial({
      color: 0x9d3b2a,
      metalness: 0.04,
      roughness: 0.33,
      clearcoat: 0.62,
      clearcoatRoughness: 0.22,
    }),
    jade: new THREE.MeshPhysicalMaterial({
      color: 0x3b7966,
      metalness: 0.02,
      roughness: 0.36,
      clearcoat: 0.48,
      clearcoatRoughness: 0.26,
    }),
    sun: new THREE.MeshStandardMaterial({
      color: 0xffd47b,
      emissive: 0xe88524,
      emissiveIntensity: 2.15,
      metalness: 0.08,
      roughness: 0.26,
    }),
  };

  const base = new THREE.Group();
  base.name = "OBSERVATORY_PLINTH";
  root.add(base);

  const contactFoot = makeMesh(
    "RUBBER_CONTACT_FOOT",
    new THREE.CylinderGeometry(0.49, 0.5, 0.035, 64),
    materials.rubber,
    true,
  );
  contactFoot.position.y = 0.0175;
  base.add(contactFoot);

  const plinthProfile = [
    [0.48, 0.035],
    [0.515, 0.065],
    [0.52, 0.115],
    [0.49, 0.16],
    [0.43, 0.215],
    [0.39, 0.27],
    [0.37, 0.315],
  ].map(([radius, y]) => new THREE.Vector2(radius, y));
  const plinthShell = makeMesh(
    "TURNED_BRASS_PLINTH",
    new THREE.LatheGeometry(plinthProfile, 64),
    materials.agedBrass,
    true,
  );
  base.add(plinthShell);

  const lowerTrim = makeRing("LOWER_BRASS_TRIM", 0.48, 0.012, materials.brassLight, 64);
  lowerTrim.rotation.x = Math.PI / 2;
  lowerTrim.position.y = 0.12;
  base.add(lowerTrim);

  const upperTrim = makeRing("UPPER_PATINA_TRIM", 0.37, 0.009, materials.patina, 64);
  upperTrim.rotation.x = Math.PI / 2;
  upperTrim.position.y = 0.302;
  base.add(upperTrim);

  const driveWindow = makeMesh(
    "RECESSED_DRIVE_WINDOW",
    new THREE.BoxGeometry(0.72, 0.29, 0.035),
    materials.blackSteel,
  );
  driveWindow.position.set(0, 0.43, 0.335);
  base.add(driveWindow);

  const driveWindowCrown = makeMesh(
    "DRIVE_WINDOW_CROWN",
    new THREE.BoxGeometry(0.76, 0.025, 0.052),
    materials.brass,
  );
  driveWindowCrown.position.set(0, 0.588, 0.34);
  base.add(driveWindowCrown);

  const columnProfile = [
    [0.25, 0.31],
    [0.27, 0.35],
    [0.245, 0.41],
    [0.19, 0.47],
    [0.17, 0.57],
    [0.145, 0.64],
  ].map(([radius, y]) => new THREE.Vector2(radius, y));
  const driveColumn = makeMesh(
    "HOLLOW_DRIVE_COLUMN",
    new THREE.LatheGeometry(columnProfile, 48),
    materials.blackSteel,
  );
  base.add(driveColumn);

  const gearSpecs = [
    {
      name: "PRIMARY_DRIVE_GEAR",
      teeth: 20,
      radius: 0.125,
      depth: 0.027,
      position: [-0.205, 0.435, 0.37],
    },
    {
      name: "BRIDGE_IDLER_GEAR",
      teeth: 16,
      radius: 0.098,
      depth: 0.024,
      position: [0.043, 0.465, 0.385],
    },
    {
      name: "OUTPUT_PINION_GEAR",
      teeth: 12,
      radius: 0.073,
      depth: 0.022,
      position: [0.235, 0.43, 0.397],
    },
  ];
  const gearRotors = gearSpecs.map((spec, index) => {
    const gear = makeGear(
      spec.name,
      spec.teeth,
      spec.radius,
      spec.depth,
      0.035,
      index === 1 ? materials.brassLight : materials.brass,
      materials.agedBrass,
    );
    gear.position.set(...spec.position);
    gear.userData = {
      jointType: "spur-gear journal bearing",
      loadPath: `${spec.name.toLowerCase()} -> front bridge plate -> weighted plinth`,
    };
    base.add(gear);
    return gear;
  });

  const yawBearing = new THREE.Group();
  yawBearing.name = "LOWER_YAW_BEARING";
  yawBearing.position.y = 0.65;
  yawBearing.userData = {
    jointType: "vertical thrust-and-journal bearing",
    loadPath: "outer meridian cage -> lower yaw collar -> drive column -> weighted plinth",
  };
  root.add(yawBearing);

  const bearingCup = makeAxialCylinder(
    "YAW_BEARING_CUP",
    0.16,
    0.09,
    materials.agedBrass,
  );
  yawBearing.add(bearingCup);

  const bearingCap = makeAxialCylinder(
    "YAW_BEARING_CAP",
    0.105,
    0.12,
    materials.brassLight,
  );
  yawBearing.add(bearingCap);

  const outerYaw = new THREE.Group();
  outerYaw.name = "OUTER_MERIDIAN_YAW_PIVOT";
  outerYaw.position.y = 1.55;
  outerYaw.userData = {
    jointType: "vertical revolute yaw spindle",
    loadPath: "outer ring and trunnions -> lower spindle clamp -> yaw bearing",
  };
  root.add(outerYaw);

  const outerRing = makeRing("OUTER_MERIDIAN_RING", 0.9, 0.031, materials.agedBrass, 96);
  outerYaw.add(outerRing);
  addDegreeTicks(outerYaw, materials.brassLight, 0.902);

  const lowerClamp = makeAxialCylinder(
    "LOWER_MERIDIAN_SPINDLE_CLAMP",
    0.082,
    0.18,
    materials.brass,
  );
  lowerClamp.position.y = -0.86;
  outerYaw.add(lowerClamp);

  const upperJewel = makeAxialCylinder(
    "UPPER_MERIDIAN_JEWEL_CAP",
    0.068,
    0.13,
    materials.brassLight,
  );
  upperJewel.position.y = 0.89;
  outerYaw.add(upperJewel);

  const polarTrunnions = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.068, 0.068, 0.12, 24),
    materials.brassLight,
    2,
  );
  polarTrunnions.name = "POLAR_AXIS_TRUNNION_PAIR";
  polarTrunnions.castShadow = true;
  const trunnionTransform = new THREE.Object3D();
  for (let index = 0; index < 2; index += 1) {
    trunnionTransform.position.set(index === 0 ? -0.885 : 0.885, 0, 0);
    trunnionTransform.rotation.set(0, 0, Math.PI / 2);
    trunnionTransform.updateMatrix();
    polarTrunnions.setMatrixAt(index, trunnionTransform.matrix);
  }
  polarTrunnions.instanceMatrix.needsUpdate = true;
  outerYaw.add(polarTrunnions);

  const polarPivot = new THREE.Group();
  polarPivot.name = "POLAR_RING_TRUNNION_PIVOT";
  polarPivot.userData = {
    jointType: "opposed horizontal trunnion pair",
    loadPath: "polar ring -> opposed axle ends -> outer meridian ring",
  };
  outerYaw.add(polarPivot);

  const polarRing = makeRing("INNER_POLAR_RING", 0.81, 0.026, materials.brass, 88);
  polarRing.rotation.y = Math.PI / 2;
  polarPivot.add(polarRing);

  const eclipticPivot = new THREE.Group();
  eclipticPivot.name = "ECLIPTIC_COAXIAL_SPINDLE";
  eclipticPivot.rotation.z = THREE.MathUtils.degToRad(23.5);
  eclipticPivot.userData = {
    jointType: "tilted coaxial spindle",
    loadPath: "orbit deck -> central spindle -> polar ring cross-bearings",
  };
  polarPivot.add(eclipticPivot);

  const eclipticRing = makeRing("TILTED_ECLIPTIC_RING", 0.71, 0.024, materials.brassLight, 88);
  eclipticRing.rotation.x = Math.PI / 2;
  eclipticPivot.add(eclipticRing);

  const centralSpindle = makeAxialCylinder(
    "CENTRAL_SOLAR_SPINDLE",
    0.036,
    0.28,
    materials.blackSteel,
  );
  eclipticPivot.add(centralSpindle);

  const orbitRadii = [0.245, 0.37, 0.495, 0.62];
  orbitRadii.forEach((radius, index) => {
    const track = makeRing(
      `ORBIT_TRACK_${index + 1}`,
      radius,
      index === 3 ? 0.008 : 0.0065,
      index % 2 === 0 ? materials.agedBrass : materials.patina,
      72,
    );
    track.rotation.x = Math.PI / 2;
    eclipticPivot.add(track);
  });

  const sunAssembly = new THREE.Group();
  sunAssembly.name = "CENTRAL_SUN_ASSEMBLY";
  sunAssembly.position.y = 0.015;
  eclipticPivot.add(sunAssembly);

  const sun = makeMesh(
    "LUMINOUS_SUN",
    new THREE.IcosahedronGeometry(0.125, 3),
    materials.sun,
  );
  sunAssembly.add(sun);

  const sunHalo = makeRing("SOLAR_HALO_CAGE", 0.165, 0.009, materials.brassLight, 56);
  sunHalo.rotation.x = Math.PI / 2;
  sunAssembly.add(sunHalo);

  const sunLight = new THREE.PointLight(0xffb85f, 5.4, 2.2, 2);
  sunLight.name = "LOCAL_SOLAR_GLOW";
  sunLight.castShadow = false;
  sunAssembly.add(sunLight);

  const planetMaterials = [materials.ivory, materials.cobalt, materials.vermilion, materials.jade];
  const planetRadii = [0.042, 0.056, 0.069, 0.061];
  const planetSpeeds = [1.12, 0.72, 0.46, 0.31];
  const planetRestAngles = [0.35, 2.15, 3.75, 5.35];
  const planetPivots = [];
  let moonPivot = null;

  orbitRadii.forEach((orbitRadius, index) => {
    const pivot = new THREE.Group();
    pivot.name = `PLANET_${index + 1}_JOURNAL_PIVOT`;
    pivot.userData = {
      jointType: "coaxial journal-bearing planet arm",
      loadPath: `planet ${index + 1} and counterweight -> radial arm -> central solar spindle`,
    };
    eclipticPivot.add(pivot);
    planetPivots.push(pivot);

    const armLength = orbitRadius - 0.135;
    const arm = makeAxialCylinder(
      `PLANET_${index + 1}_RADIAL_ARM`,
      0.009,
      armLength,
      index % 2 === 0 ? materials.brassLight : materials.brass,
      "x",
      12,
    );
    arm.position.x = 0.135 + armLength / 2;
    pivot.add(arm);

    const journal = makeAxialCylinder(
      `PLANET_${index + 1}_JOURNAL_HUB`,
      0.045 - index * 0.003,
      0.04,
      materials.agedBrass,
    );
    pivot.add(journal);

    const planet = makeMesh(
      `ENAMEL_PLANET_${index + 1}`,
      new THREE.SphereGeometry(planetRadii[index], 28, 18),
      planetMaterials[index],
    );
    planet.position.set(orbitRadius, index % 2 === 0 ? 0.027 : -0.022, 0);
    pivot.add(planet);

    const counterweight = makeMesh(
      `PLANET_${index + 1}_COUNTERWEIGHT`,
      new THREE.SphereGeometry(0.027 + index * 0.004, 20, 12),
      materials.blackSteel,
    );
    counterweight.position.x = -0.112 - index * 0.015;
    pivot.add(counterweight);

    if (index === 2) {
      moonPivot = new THREE.Group();
      moonPivot.name = "MOON_ORBIT_PIVOT";
      moonPivot.position.copy(planet.position);
      moonPivot.userData = {
        jointType: "satellite pin bearing",
        loadPath: "moon -> moon pin -> third planet carrier",
      };
      pivot.add(moonPivot);

      const moonArm = makeAxialCylinder(
        "MOON_CARRIER_ARM",
        0.004,
        0.105,
        materials.brassLight,
        "x",
        10,
      );
      moonArm.position.x = 0.0525;
      moonPivot.add(moonArm);

      const moon = makeMesh(
        "IVORY_MOON",
        new THREE.SphereGeometry(0.022, 18, 12),
        materials.ivory,
      );
      moon.position.x = 0.105;
      moonPivot.add(moon);
    }
  });

  const rest = {
    outerYaw: -0.16,
    polarPitch: 0.12,
    eclipticSpin: 0.08,
    gearAngles: [0.12, -0.44, 0.28],
    moonAngle: 0.65,
  };
  let phase = 0;

  function applyPose(timeSeconds) {
    outerYaw.rotation.y = rest.outerYaw + timeSeconds * 0.12;
    polarPivot.rotation.x = rest.polarPitch + Math.sin(timeSeconds * 0.19) * 0.055;
    eclipticPivot.rotation.y = rest.eclipticSpin + timeSeconds * 0.22;

    planetPivots.forEach((pivot, index) => {
      pivot.rotation.y = planetRestAngles[index] + timeSeconds * planetSpeeds[index];
    });
    if (moonPivot) moonPivot.rotation.y = rest.moonAngle + timeSeconds * 1.72;

    const driveAngle = timeSeconds * 0.78;
    gearRotors[0].rotation.z = rest.gearAngles[0] + driveAngle;
    gearRotors[1].rotation.z = rest.gearAngles[1] - driveAngle * (20 / 16);
    gearRotors[2].rotation.z = rest.gearAngles[2] + driveAngle * (20 / 12);
    sun.rotation.y = timeSeconds * 0.38;

    root.userData.mechanismState = {
      phaseSeconds: timeSeconds,
      outerYawRadians: outerYaw.rotation.y,
      polarPitchRadians: polarPivot.rotation.x,
      planetAnglesRadians: planetPivots.map((pivot) => pivot.rotation.y),
    };
  }

  function reset() {
    phase = 0;
    applyPose(0);
  }

  reset();

  return {
    root,
    update(deltaSeconds, _elapsedSeconds, motionEnabled) {
      if (!motionEnabled) {
        reset();
        return;
      }
      const safeDelta = Number.isFinite(deltaSeconds)
        ? THREE.MathUtils.clamp(deltaSeconds, 0, 0.05)
        : 0;
      phase = (phase + safeDelta) % 120;
      applyPose(phase);
    },
    reset,
    dispose() {
      sunLight.dispose();
      planetPivots.length = 0;
      gearRotors.length = 0;
      moonPivot = null;
    },
  };
}

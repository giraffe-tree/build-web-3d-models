import * as THREE from "three";

export const meta = {
  id: "glazed-teapot",
  order: 90,
  title: "Glazed Studio Teapot",
  category: "PRODUCT",
  description: "A studio teapot tests continuous vessel curves, tapered joinery, and clearly separated ceramic, brass, and walnut finishes.",
  accent: "#dd9f5b",
  fidelityLane: "polished-stylized",
  identityFeatures: [
    "pear-shaped lathed ceramic body with a grounded foot ring",
    "upswept tapered spout with a blended root and open flared lip",
    "large C-shaped walnut handle with two brass ferrules",
    "seated domed lid with a brass washer and turned wood knob",
    "contrasting lower glaze band with a fine brass reveal",
    "distinct glossy ceramic, brushed brass, and satin walnut material response",
  ],
  budgets: {
    triangles: 48_000,
    drawCalls: 26,
    targetFps: 60,
    targetDevice: "desktop",
  },
  presentation: {
    background: "#101415",
    cameraDirection: [1.15, 0.78, 2.55],
    target: [0.02, 0.78, 0],
    fov: 35,
    screenCoverage: 0.86,
    exposure: 1.12,
    fogDensity: 0.012,
    floorColor: "#171b1a",
    hemisphereIntensity: 1.7,
    keyIntensity: 4.5,
    rimIntensity: 2.4,
  },
  evidenceViews: {
    hero: { cameraDirection: [1.15, 0.78, 2.55], fixedTimeSeconds: 0 },
    orbitA: { cameraDirection: [-1.6, 0.78, 2], fixedTimeSeconds: 0 },
    orbitB: { cameraDirection: [1.45, 0.72, -2.05], fixedTimeSeconds: 0 },
    neutralMaterial: { cameraDirection: [0.05, 0.48, 2.45], fixedTimeSeconds: 0 },
    subjectProof: {
      cameraDirection: [2.25, 0.38, 0.7],
      screenCoverage: 0.88,
      fixedTimeSeconds: 0,
    },
  },
};

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

function surface(mesh, receiveShadow = true) {
  mesh.castShadow = true;
  mesh.receiveShadow = receiveShadow;
  return mesh;
}

function lathe(name, points, segments, material) {
  const mesh = surface(new THREE.Mesh(new THREE.LatheGeometry(points, segments), material));
  mesh.name = name;
  return mesh;
}

function taperedTubeGeometry(curve, tubularSegments, radialSegments, radiusAt) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let segment = 0; segment <= tubularSegments; segment += 1) {
    const t = segment / tubularSegments;
    curve.getPointAt(t, point);
    const radius = radiusAt(t);

    for (let side = 0; side <= radialSegments; side += 1) {
      const angle = (side / radialSegments) * Math.PI * 2;
      normal
        .copy(frames.normals[segment])
        .multiplyScalar(Math.cos(angle))
        .addScaledVector(frames.binormals[segment], Math.sin(angle));
      positions.push(
        point.x + normal.x * radius,
        point.y + normal.y * radius,
        point.z + normal.z * radius,
      );
      // Frenet frames point inward for this vertex winding. Flip them so the
      // glazed spout responds to the same key and hemisphere lights as the body.
      normals.push(-normal.x, -normal.y, -normal.z);
      uvs.push(t, side / radialSegments);
    }
  }

  const stride = radialSegments + 1;
  for (let segment = 0; segment < tubularSegments; segment += 1) {
    for (let side = 0; side < radialSegments; side += 1) {
      const a = segment * stride + side;
      const b = (segment + 1) * stride + side;
      const c = (segment + 1) * stride + side + 1;
      const d = segment * stride + side + 1;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

function orientAlong(mesh, tangent) {
  mesh.quaternion.setFromUnitVectors(Y_AXIS, tangent.clone().normalize());
}

export function createDemo() {
  const root = new THREE.Group();
  root.name = "GLAZED_TEAPOT_ROOT";

  const celadonGlaze = new THREE.MeshPhysicalMaterial({
    color: 0x397d78,
    roughness: 0.2,
    metalness: 0.02,
    clearcoat: 1,
    clearcoatRoughness: 0.13,
  });
  const deepGlaze = new THREE.MeshPhysicalMaterial({
    color: 0x183e3d,
    roughness: 0.24,
    metalness: 0.015,
    clearcoat: 0.92,
    clearcoatRoughness: 0.18,
  });
  const brass = new THREE.MeshStandardMaterial({
    color: 0xc6924d,
    roughness: 0.23,
    metalness: 0.88,
  });
  const walnut = new THREE.MeshStandardMaterial({
    color: 0x5c2f1d,
    roughness: 0.48,
    metalness: 0,
  });
  const darkInterior = new THREE.MeshStandardMaterial({
    color: 0x07100f,
    roughness: 0.82,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const unglazedClay = new THREE.MeshStandardMaterial({
    color: 0x9a7761,
    roughness: 0.94,
    metalness: 0,
  });

  const vessel = new THREE.Group();
  vessel.name = "VESSEL_ASSEMBLY";
  root.add(vessel);

  const bodyProfile = [
    new THREE.Vector2(0.39, 0.12),
    new THREE.Vector2(0.62, 0.15),
    new THREE.Vector2(0.78, 0.27),
    new THREE.Vector2(0.86, 0.48),
    new THREE.Vector2(0.87, 0.7),
    new THREE.Vector2(0.81, 0.92),
    new THREE.Vector2(0.68, 1.11),
    new THREE.Vector2(0.49, 1.23),
    new THREE.Vector2(0.43, 1.25),
  ];
  vessel.add(lathe("PEAR_SHAPED_CERAMIC_BODY", bodyProfile, 72, celadonGlaze));

  const lowerBandProfile = [
    new THREE.Vector2(0.394, 0.118),
    new THREE.Vector2(0.624, 0.148),
    new THREE.Vector2(0.784, 0.272),
    new THREE.Vector2(0.833, 0.39),
  ];
  const lowerBand = lathe("DEEP_GLAZE_LOWER_BAND", lowerBandProfile, 72, deepGlaze);
  lowerBand.scale.set(1.006, 1, 1.006);
  vessel.add(lowerBand);

  const clayFoot = surface(
    new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.43, 0.11, 56, 1, true), unglazedClay),
  );
  clayFoot.name = "UNGLAZED_CLAY_FOOT_RING";
  clayFoot.position.y = 0.07;
  vessel.add(clayFoot);

  const footShadow = surface(
    new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.018, 48), darkInterior),
  );
  footShadow.name = "RECESSED_FOOT_SHADOW";
  footShadow.position.y = 0.014;
  vessel.add(footShadow);

  const glazeReveal = surface(
    new THREE.Mesh(new THREE.TorusGeometry(0.825, 0.012, 10, 64), brass),
  );
  glazeReveal.name = "LOWER_BAND_BRASS_REVEAL";
  glazeReveal.position.y = 0.39;
  glazeReveal.rotation.x = Math.PI / 2;
  vessel.add(glazeReveal);

  const neck = surface(
    new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.47, 0.1, 56), celadonGlaze),
  );
  neck.name = "LID_SEAT_NECK";
  neck.position.y = 1.25;
  vessel.add(neck);

  const mouthShadow = surface(
    new THREE.Mesh(new THREE.CylinderGeometry(0.365, 0.365, 0.018, 48), darkInterior),
    false,
  );
  mouthShadow.name = "RECESSED_MOUTH_SHADOW";
  mouthShadow.position.y = 1.305;
  vessel.add(mouthShadow);

  const spoutAssembly = new THREE.Group();
  spoutAssembly.name = "UPSWEPT_SPOUT_ASSEMBLY";
  vessel.add(spoutAssembly);

  const spoutCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0.63, 0.62, 0),
    new THREE.Vector3(0.94, 0.69, 0),
    new THREE.Vector3(1.14, 1.08, 0),
    new THREE.Vector3(1.48, 1.34, 0),
  );
  const spout = surface(
    new THREE.Mesh(
      taperedTubeGeometry(spoutCurve, 52, 18, (t) => THREE.MathUtils.lerp(0.19, 0.1, t)),
      celadonGlaze,
    ),
  );
  spout.name = "TAPERED_CERAMIC_SPOUT";
  spoutAssembly.add(spout);

  const spoutRoot = surface(
    new THREE.Mesh(new THREE.SphereGeometry(0.3, 36, 22), celadonGlaze),
  );
  spoutRoot.name = "BLENDED_SPOUT_ROOT_COLLAR";
  spoutRoot.position.set(0.62, 0.62, 0);
  spoutRoot.scale.set(0.92, 0.62, 0.68);
  spoutRoot.rotation.z = -0.42;
  spoutAssembly.add(spoutRoot);

  const spoutEnd = spoutCurve.getPointAt(1);
  const spoutTangent = spoutCurve.getTangentAt(1).normalize();
  const lip = surface(
    new THREE.Mesh(new THREE.CylinderGeometry(0.126, 0.105, 0.075, 36, 1, true), celadonGlaze),
  );
  lip.name = "FLARED_POURING_LIP";
  lip.position.copy(spoutEnd).addScaledVector(spoutTangent, 0.032);
  orientAlong(lip, spoutTangent);
  spoutAssembly.add(lip);

  const spoutOpening = surface(new THREE.Mesh(new THREE.CircleGeometry(0.104, 36), darkInterior), false);
  spoutOpening.name = "OPEN_SPOUT_INTERIOR";
  spoutOpening.position.copy(spoutEnd).addScaledVector(spoutTangent, 0.075);
  spoutOpening.quaternion.setFromUnitVectors(Z_AXIS, spoutTangent);
  spoutAssembly.add(spoutOpening);

  const handleAssembly = new THREE.Group();
  handleAssembly.name = "WALNUT_HANDLE_LOAD_PATH";
  vessel.add(handleAssembly);

  const handleCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-0.62, 1.01, 0),
    new THREE.Vector3(-1.5, 1.18, 0),
    new THREE.Vector3(-1.55, 0.43, 0),
    new THREE.Vector3(-0.67, 0.42, 0),
  );
  const handle = surface(
    new THREE.Mesh(new THREE.TubeGeometry(handleCurve, 56, 0.105, 14, false), walnut),
  );
  handle.name = "CONTINUOUS_C_SHAPED_WALNUT_GRIP";
  handleAssembly.add(handle);

  const ferruleGeometry = new THREE.CylinderGeometry(0.132, 0.12, 0.18, 32);
  const handleEnds = [
    { name: "UPPER_BRASS_HANDLE_FERRULE", t: 0, tangent: handleCurve.getTangentAt(0) },
    { name: "LOWER_BRASS_HANDLE_FERRULE", t: 1, tangent: handleCurve.getTangentAt(1) },
  ];
  handleEnds.forEach(({ name, t, tangent }) => {
    const ferrule = surface(new THREE.Mesh(ferruleGeometry, brass));
    ferrule.name = name;
    ferrule.position.copy(handleCurve.getPointAt(t));
    orientAlong(ferrule, tangent);
    handleAssembly.add(ferrule);
  });

  const handleMountGeometry = new THREE.SphereGeometry(0.16, 28, 18);
  const upperMount = surface(new THREE.Mesh(handleMountGeometry, celadonGlaze));
  upperMount.name = "UPPER_CERAMIC_HANDLE_BOSS";
  upperMount.position.set(-0.63, 1.01, 0);
  upperMount.scale.set(0.85, 1, 0.76);
  handleAssembly.add(upperMount);

  const lowerMount = surface(new THREE.Mesh(handleMountGeometry, celadonGlaze));
  lowerMount.name = "LOWER_CERAMIC_HANDLE_BOSS";
  lowerMount.position.set(-0.67, 0.42, 0);
  lowerMount.scale.set(0.85, 1, 0.76);
  handleAssembly.add(lowerMount);

  const lidSeatRing = surface(
    new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.025, 12, 56), brass),
  );
  lidSeatRing.name = "BRASS_LID_SEAT_REVEAL";
  lidSeatRing.position.y = 1.3;
  lidSeatRing.rotation.x = Math.PI / 2;
  vessel.add(lidSeatRing);

  const lid = new THREE.Group();
  lid.name = "REMOVABLE_LID_ASSEMBLY";
  lid.position.y = 1.305;
  vessel.add(lid);

  const lidProfile = [
    new THREE.Vector2(0.43, 0),
    new THREE.Vector2(0.4, 0.045),
    new THREE.Vector2(0.32, 0.105),
    new THREE.Vector2(0.19, 0.15),
    new THREE.Vector2(0, 0.166),
  ];
  lid.add(lathe("DOMED_CERAMIC_LID", lidProfile, 64, celadonGlaze));

  const knobWasher = surface(
    new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.16, 0.045, 36), brass),
  );
  knobWasher.name = "BRASS_KNOB_WASHER";
  knobWasher.position.y = 0.185;
  lid.add(knobWasher);

  const knobProfile = [
    new THREE.Vector2(0.105, 0),
    new THREE.Vector2(0.14, 0.04),
    new THREE.Vector2(0.135, 0.105),
    new THREE.Vector2(0.09, 0.16),
    new THREE.Vector2(0, 0.172),
  ];
  const knob = lathe("TURNED_WALNUT_LID_KNOB", knobProfile, 40, walnut);
  knob.position.y = 0.205;
  lid.add(knob);

  const warmGlint = new THREE.PointLight(0xffc979, 1.25, 3.2, 2);
  warmGlint.name = "BRASS_AND_GLAZE_GLINT";
  warmGlint.position.set(1.7, 1.7, 1.35);
  root.add(warmGlint);

  const restRotation = -0.055;

  function reset() {
    root.rotation.y = restRotation;
    lid.position.y = 1.305;
  }

  reset();

  return {
    root,
    update(_deltaSeconds, elapsedSeconds, motionEnabled) {
      if (!motionEnabled) {
        reset();
        return;
      }
      root.rotation.y = restRotation + Math.sin(elapsedSeconds * 0.38) * 0.045;
      lid.position.y = 1.305 + (1 - Math.cos(elapsedSeconds * 0.55)) * 0.0025;
    },
    reset,
    dispose() {
      warmGlint.dispose();
    },
  };
}

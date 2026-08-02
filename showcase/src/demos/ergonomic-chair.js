import * as THREE from "three";

export const meta = {
  id: "ergonomic-chair",
  order: 70,
  title: "Ergonomic Chair",
  category: "FURNITURE",
  description: "A procedural premium task chair with an exposed synchronized recline linkage.",
  accent: "#58d6c5",
  background: "#091014",
  cameraDirection: [1.55, 1.05, 1.85],
  target: [0, 0.64, 0],
};

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const X_AXIS = new THREE.Vector3(1, 0, 0);

function roundedRectShape(width, height, radius) {
  const shape = new THREE.Shape();
  const x = width / 2;
  const y = height / 2;
  const r = Math.min(radius, x, y);

  shape.moveTo(-x + r, -y);
  shape.lineTo(x - r, -y);
  shape.quadraticCurveTo(x, -y, x, -y + r);
  shape.lineTo(x, y - r);
  shape.quadraticCurveTo(x, y, x - r, y);
  shape.lineTo(-x + r, y);
  shape.quadraticCurveTo(-x, y, -x, y - r);
  shape.lineTo(-x, -y + r);
  shape.quadraticCurveTo(-x, -y, -x + r, -y);
  return shape;
}

function horizontalRoundedGeometry(width, depth, thickness, radius) {
  const geometry = new THREE.ExtrudeGeometry(
    roundedRectShape(width, depth, radius),
    {
      depth: thickness,
      steps: 1,
      curveSegments: 5,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: Math.min(0.009, thickness * 0.18),
      bevelThickness: Math.min(0.009, thickness * 0.18),
    },
  );
  geometry.translate(0, 0, -thickness / 2);
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function verticalRoundedGeometry(width, height, thickness, radius) {
  const geometry = new THREE.ExtrudeGeometry(
    roundedRectShape(width, height, radius),
    {
      depth: thickness,
      steps: 1,
      curveSegments: 5,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: Math.min(0.007, thickness * 0.2),
      bevelThickness: Math.min(0.007, thickness * 0.2),
    },
  );
  geometry.translate(0, 0, -thickness / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function seatFootprintShape() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.225, 0.255);
  shape.quadraticCurveTo(-0.27, 0.245, -0.29, 0.175);
  shape.lineTo(-0.31, -0.19);
  shape.quadraticCurveTo(-0.31, -0.26, -0.245, -0.275);
  shape.quadraticCurveTo(0, -0.292, 0.245, -0.275);
  shape.quadraticCurveTo(0.31, -0.26, 0.31, -0.19);
  shape.lineTo(0.29, 0.175);
  shape.quadraticCurveTo(0.27, 0.245, 0.225, 0.255);
  shape.quadraticCurveTo(0, 0.27, -0.225, 0.255);
  return shape;
}

function seatGeometry(thickness, bevel) {
  const geometry = new THREE.ExtrudeGeometry(seatFootprintShape(), {
    depth: thickness,
    steps: 1,
    curveSegments: 7,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: bevel,
    bevelThickness: bevel,
  });
  geometry.translate(0, 0, -thickness / 2);
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function starArmGeometry() {
  const positions = new Float32Array([
    -0.072, 0.0, 0.035,
    0.072, 0.0, 0.035,
    0.045, -0.015, 0.365,
    -0.045, -0.015, 0.365,
    -0.072, 0.058, 0.035,
    0.072, 0.058, 0.035,
    0.045, 0.04, 0.365,
    -0.045, 0.04, 0.365,
  ]);
  const indices = [
    0, 2, 1, 0, 3, 2,
    4, 5, 6, 4, 6, 7,
    0, 1, 5, 0, 5, 4,
    1, 2, 6, 1, 6, 5,
    2, 3, 7, 2, 7, 6,
    3, 0, 4, 3, 4, 7,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function backHalfWidth(t) {
  if (t < 0.34) return THREE.MathUtils.lerp(0.215, 0.245, t / 0.34);
  if (t < 0.78) return THREE.MathUtils.lerp(0.245, 0.305, (t - 0.34) / 0.44);
  return THREE.MathUtils.lerp(0.305, 0.282, (t - 0.78) / 0.22);
}

function backDepth(t, normalizedX) {
  return 0.012 + 0.035 * Math.sin(Math.PI * t) - 0.03 * t - 0.012 * normalizedX ** 2;
}

function backSurfaceGeometry(columns = 8, rows = 12) {
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let row = 0; row <= rows; row += 1) {
    const t = row / rows;
    const y = 0.065 + t * 0.7;
    const halfWidth = backHalfWidth(t);
    for (let column = 0; column <= columns; column += 1) {
      const u = column / columns;
      const normalizedX = u * 2 - 1;
      positions.push(
        normalizedX * halfWidth,
        y,
        backDepth(t, normalizedX),
      );
      uvs.push(u, t);
    }
  }

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const a = row * (columns + 1) + column;
      const b = a + 1;
      const c = a + columns + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function backLatticeGeometry(columns = 8, rows = 12) {
  const points = [];
  const pointAt = (column, row) => {
    const t = row / rows;
    const u = column / columns;
    const normalizedX = u * 2 - 1;
    return new THREE.Vector3(
      normalizedX * backHalfWidth(t),
      0.065 + t * 0.7,
      backDepth(t, normalizedX) + 0.004,
    );
  };

  for (let column = 0; column <= columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      points.push(pointAt(column, row), pointAt(column, row + 1));
    }
  }
  for (let row = 0; row <= rows; row += 2) {
    for (let column = 0; column < columns; column += 1) {
      points.push(pointAt(column, row), pointAt(column + 1, row));
    }
  }

  return new THREE.BufferGeometry().setFromPoints(points);
}

function orientBar(mesh, start, end, radius) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(Y_AXIS, direction.normalize());
  mesh.scale.set(radius, length, radius);
}

function tubeFromPoints(points, radius, segments = 20) {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, segments, radius, 8, false);
}

export function createDemo() {
  const root = new THREE.Group();
  root.name = "ergonomic-chair";

  const graphite = new THREE.MeshStandardMaterial({
    color: 0x171c20,
    roughness: 0.38,
    metalness: 0.12,
  });
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x293337,
    roughness: 0.43,
    metalness: 0.04,
  });
  const rubber = new THREE.MeshStandardMaterial({
    color: 0x080b0d,
    roughness: 0.78,
    metalness: 0,
  });
  const satinMetal = new THREE.MeshStandardMaterial({
    color: 0xb8c4c7,
    roughness: 0.24,
    metalness: 0.84,
  });
  const upholstery = new THREE.MeshStandardMaterial({
    color: 0x23595b,
    roughness: 0.84,
    metalness: 0,
  });
  const accent = new THREE.MeshStandardMaterial({
    color: 0x58d6c5,
    roughness: 0.5,
    metalness: 0.02,
  });
  const meshMaterial = new THREE.MeshStandardMaterial({
    color: 0x1d7878,
    roughness: 0.76,
    metalness: 0,
    transparent: true,
    opacity: 0.46,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const latticeMaterial = new THREE.LineBasicMaterial({
    color: 0x72d8cd,
    transparent: true,
    opacity: 0.42,
  });

  const base = new THREE.Group();
  base.name = "five-star-rolling-base";
  root.add(base);

  const armInstances = new THREE.InstancedMesh(
    starArmGeometry(),
    graphite,
    5,
  );
  armInstances.name = "five-star-base-arms";
  base.add(armInstances);

  const forkGeometry = new THREE.BoxGeometry(0.065, 0.038, 0.075);
  const forkInstances = new THREE.InstancedMesh(forkGeometry, graphite, 5);
  forkInstances.name = "caster-forks";
  base.add(forkInstances);

  const wheelGeometry = new THREE.CylinderGeometry(0.055, 0.055, 0.03, 16, 1);
  const wheelInstances = new THREE.InstancedMesh(wheelGeometry, rubber, 10);
  wheelInstances.name = "caster-wheels";
  base.add(wheelInstances);

  const axleGeometry = new THREE.CylinderGeometry(0.009, 0.009, 0.105, 10, 1);
  const axleInstances = new THREE.InstancedMesh(axleGeometry, satinMetal, 5);
  axleInstances.name = "caster-axles";
  base.add(axleInstances);

  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const radial = new THREE.Vector3();
  const unitScale = new THREE.Vector3(1, 1, 1);
  let wheelIndex = 0;

  for (let index = 0; index < 5; index += 1) {
    const angle = index * Math.PI * 0.4;
    radial.set(Math.sin(angle), 0, Math.cos(angle));
    tangent.set(-Math.cos(angle), 0, Math.sin(angle));

    quaternion.setFromAxisAngle(Y_AXIS, angle);
    matrix.compose(new THREE.Vector3(0, 0.11, 0), quaternion, unitScale);
    armInstances.setMatrixAt(index, matrix);

    position.copy(radial).multiplyScalar(0.385).setY(0.105);
    matrix.compose(position, quaternion, unitScale);
    forkInstances.setMatrixAt(index, matrix);

    quaternion.setFromUnitVectors(Y_AXIS, tangent);
    position.copy(radial).multiplyScalar(0.395).setY(0.055);
    matrix.compose(position, quaternion, unitScale);
    axleInstances.setMatrixAt(index, matrix);

    for (const side of [-1, 1]) {
      position
        .copy(radial)
        .multiplyScalar(0.395)
        .addScaledVector(tangent, side * 0.037)
        .setY(0.055);
      matrix.compose(position, quaternion, unitScale);
      wheelInstances.setMatrixAt(wheelIndex, matrix);
      wheelIndex += 1;
    }
  }
  armInstances.instanceMatrix.needsUpdate = true;
  forkInstances.instanceMatrix.needsUpdate = true;
  wheelInstances.instanceMatrix.needsUpdate = true;
  axleInstances.instanceMatrix.needsUpdate = true;

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105, 0.085, 0.12, 24),
    graphite,
  );
  hub.name = "central-hub";
  hub.position.y = 0.17;
  base.add(hub);

  const gasLift = new THREE.Group();
  gasLift.name = "gas-lift";
  root.add(gasLift);

  const lowerColumn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.065, 0.29, 20),
    graphite,
  );
  lowerColumn.name = "lower-column";
  lowerColumn.position.y = 0.31;
  gasLift.add(lowerColumn);

  const piston = new THREE.Mesh(
    new THREE.CylinderGeometry(0.031, 0.031, 0.18, 18),
    satinMetal,
  );
  piston.name = "telescoping-piston";
  piston.position.y = 0.445;
  gasLift.add(piston);

  const liftCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.072, 0.052, 0.075, 20),
    graphite,
  );
  liftCollar.name = "protective-collar";
  liftCollar.position.y = 0.48;
  gasLift.add(liftCollar);

  const seatAssembly = new THREE.Group();
  seatAssembly.name = "seat-assembly";
  root.add(seatAssembly);

  const mechanismHousing = new THREE.Mesh(
    horizontalRoundedGeometry(0.34, 0.25, 0.075, 0.04),
    graphite,
  );
  mechanismHousing.name = "under-seat-mechanism";
  mechanismHousing.position.set(0, 0.505, -0.02);
  seatAssembly.add(mechanismHousing);

  const springHousingGeometry = new THREE.CylinderGeometry(0.038, 0.045, 0.25, 18);
  springHousingGeometry.rotateX(Math.PI / 2);
  const springHousing = new THREE.Mesh(springHousingGeometry, frameMaterial);
  springHousing.name = "recline-spring-housing";
  springHousing.position.set(0, 0.49, -0.105);
  seatAssembly.add(springHousing);

  const seatShell = new THREE.Mesh(seatGeometry(0.055, 0.006), graphite);
  seatShell.name = "seat-shell";
  seatShell.position.set(0, 0.535, 0.015);
  seatAssembly.add(seatShell);

  const cushion = new THREE.Mesh(seatGeometry(0.085, 0.012), upholstery);
  cushion.name = "seat-cushion";
  cushion.position.set(0, 0.585, 0.025);
  cushion.scale.set(0.975, 1, 0.96);
  seatAssembly.add(cushion);

  const unitBarGeometry = new THREE.CylinderGeometry(1, 1, 1, 12, 1);
  for (const side of [-1, 1]) {
    const armrest = new THREE.Group();
    armrest.name = side < 0 ? "left-armrest" : "right-armrest";
    seatAssembly.add(armrest);

    const support = new THREE.Mesh(unitBarGeometry, frameMaterial);
    support.name = "armrest-support";
    orientBar(
      support,
      new THREE.Vector3(side * 0.275, 0.525, 0.05),
      new THREE.Vector3(side * 0.355, 0.775, 0.015),
      0.022,
    );
    armrest.add(support);

    const adjustmentCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.055, 14),
      satinMetal,
    );
    adjustmentCollar.name = "armrest-height-collar";
    adjustmentCollar.position.set(side * 0.355, 0.755, 0.015);
    armrest.add(adjustmentCollar);

    const pad = new THREE.Mesh(
      horizontalRoundedGeometry(0.105, 0.34, 0.045, 0.035),
      upholstery,
    );
    pad.name = "armrest-pad";
    pad.position.set(side * 0.355, 0.805, 0.035);
    armrest.add(pad);
  }

  const controlLever = new THREE.Mesh(unitBarGeometry, satinMetal);
  controlLever.name = "recline-control-lever";
  orientBar(
    controlLever,
    new THREE.Vector3(0.13, 0.49, 0.015),
    new THREE.Vector3(0.365, 0.47, 0.085),
    0.009,
  );
  seatAssembly.add(controlLever);

  const controlKnob = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 14, 10),
    accent,
  );
  controlKnob.name = "recline-control-knob";
  controlKnob.position.set(0.37, 0.468, 0.087);
  seatAssembly.add(controlKnob);

  const pivotPosition = new THREE.Vector3(0, 0.56, -0.225);
  const hingeGeometry = new THREE.CylinderGeometry(0.043, 0.043, 0.035, 20);
  hingeGeometry.rotateZ(Math.PI / 2);
  for (const side of [-1, 1]) {
    const hingeCap = new THREE.Mesh(hingeGeometry, satinMetal);
    hingeCap.name = side < 0 ? "left-recline-hinge" : "right-recline-hinge";
    hingeCap.position.copy(pivotPosition).add(new THREE.Vector3(side * 0.225, 0, 0));
    seatAssembly.add(hingeCap);
  }

  const backPivot = new THREE.Group();
  backPivot.name = "back-recline-pivot";
  backPivot.position.copy(pivotPosition);
  seatAssembly.add(backPivot);

  const backFrame = new THREE.Group();
  backFrame.name = "back-frame";
  backPivot.add(backFrame);

  const leftRailGeometry = tubeFromPoints(
    [
      new THREE.Vector3(-0.22, 0.02, -0.005),
      new THREE.Vector3(-0.238, 0.25, 0.035),
      new THREE.Vector3(-0.285, 0.55, 0.01),
      new THREE.Vector3(-0.282, 0.77, -0.02),
    ],
    0.017,
    24,
  );
  const leftRail = new THREE.Mesh(leftRailGeometry, frameMaterial);
  leftRail.name = "left-back-rail";
  backFrame.add(leftRail);

  const rightRail = new THREE.Mesh(leftRailGeometry, frameMaterial);
  rightRail.name = "right-back-rail";
  rightRail.scale.x = -1;
  backFrame.add(rightRail);

  const topRail = new THREE.Mesh(
    tubeFromPoints(
      [
        new THREE.Vector3(-0.282, 0.77, -0.02),
        new THREE.Vector3(0, 0.785, -0.01),
        new THREE.Vector3(0.282, 0.77, -0.02),
      ],
      0.017,
      16,
    ),
    frameMaterial,
  );
  topRail.name = "upper-back-rail";
  backFrame.add(topRail);

  const lowerRail = new THREE.Mesh(
    tubeFromPoints(
      [
        new THREE.Vector3(-0.218, 0.07, 0),
        new THREE.Vector3(0, 0.055, 0.006),
        new THREE.Vector3(0.218, 0.07, 0),
      ],
      0.014,
      14,
    ),
    frameMaterial,
  );
  lowerRail.name = "lower-back-rail";
  backFrame.add(lowerRail);

  const tensionMesh = new THREE.Mesh(backSurfaceGeometry(), meshMaterial);
  tensionMesh.name = "tension-mesh";
  tensionMesh.renderOrder = 1;
  backFrame.add(tensionMesh);

  const lattice = new THREE.LineSegments(backLatticeGeometry(), latticeMaterial);
  lattice.name = "mesh-lattice";
  lattice.renderOrder = 2;
  backFrame.add(lattice);

  const lumbarSupport = new THREE.Group();
  lumbarSupport.name = "lumbar-support";
  lumbarSupport.position.set(0, 0.305, 0.062);
  backFrame.add(lumbarSupport);

  const lumbarPad = new THREE.Mesh(
    verticalRoundedGeometry(0.43, 0.105, 0.032, 0.045),
    accent,
  );
  lumbarPad.name = "lumbar-pad";
  lumbarSupport.add(lumbarPad);

  const lumbarBridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.034, 0.055),
    graphite,
  );
  lumbarBridge.name = "lumbar-adjustment-bridge";
  lumbarBridge.position.z = -0.038;
  lumbarSupport.add(lumbarBridge);

  const reclineLinkage = new THREE.Group();
  reclineLinkage.name = "recline-linkage";
  seatAssembly.add(reclineLinkage);

  const linkages = [];
  for (const side of [-1, 1]) {
    const link = new THREE.Mesh(unitBarGeometry, satinMetal);
    link.name = side < 0 ? "left-recline-link" : "right-recline-link";
    reclineLinkage.add(link);
    linkages.push({ side, mesh: link });
  }

  const restAngle = THREE.MathUtils.degToRad(-7);
  const reclineRange = THREE.MathUtils.degToRad(5);

  function setRecline(amount) {
    const normalized = THREE.MathUtils.clamp(amount, 0, 1);
    backPivot.rotation.x = restAngle - reclineRange * normalized;
    backPivot.userData.recline = normalized;

    for (const { side, mesh } of linkages) {
      const fixedAnchor = new THREE.Vector3(side * 0.215, 0.485, -0.08);
      const movingAnchor = new THREE.Vector3(side * 0.205, 0.115, 0.012)
        .applyAxisAngle(X_AXIS, backPivot.rotation.x)
        .add(pivotPosition);
      orientBar(mesh, fixedAnchor, movingAnchor, 0.012);
    }
  }

  const shadowCasters = new Set([
    "five-star-base-arms",
    "caster-wheels",
    "lower-column",
    "under-seat-mechanism",
    "seat-shell",
    "seat-cushion",
    "armrest-pad",
    "left-back-rail",
    "right-back-rail",
    "upper-back-rail",
  ]);
  root.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = shadowCasters.has(object.name);
      object.receiveShadow = true;
    }
  });
  setRecline(0);

  root.userData.mechanism = {
    semantic: "recline",
    restDegrees: 7,
    rangeDegrees: 5,
  };

  return {
    root,
    update(_deltaSeconds, elapsedSeconds, motionEnabled) {
      const phase = motionEnabled
        ? 0.5 - 0.5 * Math.cos(elapsedSeconds * 0.85)
        : 0;
      setRecline(phase);
    },
    reset() {
      setRecline(0);
    },
  };
}

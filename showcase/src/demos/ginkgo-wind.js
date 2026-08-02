import * as THREE from "three";

export const meta = {
  id: "ginkgo-wind",
  order: 30,
  title: "Ginkgo in a Light Wind",
  category: "ORGANIC",
  description: "A seeded mature ginkgo couples articulated branching with instanced fan leaves and inherited wind motion.",
  accent: "#d7d94d",
  background: "#101713",
  cameraDirection: [1.45, 0.8, 1.75],
  target: [0, 2.9, 0],
};

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const X_AXIS = new THREE.Vector3(1, 0, 0);

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function segmentGeometry(length, baseRadius, tipRadius, radialSegments, heightSegments = 2) {
  const geometry = new THREE.CylinderGeometry(
    tipRadius,
    baseRadius,
    length,
    radialSegments,
    heightSegments,
    false,
  );
  geometry.translate(0, length * 0.5, 0);
  return geometry;
}

function fanLeafGeometry() {
  const points = [
    [0, 0, 0],
    [-0.055, 0.105, 0.002],
    [-0.195, 0.17, 0.012],
    [-0.315, 0.285, 0.02],
    [-0.34, 0.405, 0.025],
    [-0.275, 0.495, 0.018],
    [-0.155, 0.545, 0.008],
    [-0.045, 0.492, 0],
    [0, 0.43, -0.006],
    [0.045, 0.492, 0],
    [0.155, 0.545, 0.008],
    [0.275, 0.495, 0.018],
    [0.34, 0.405, 0.025],
    [0.315, 0.285, 0.02],
    [0.195, 0.17, 0.012],
    [0.055, 0.105, 0.002],
  ];
  const positions = points.flat();
  const indices = [];
  for (let index = 1; index < points.length - 1; index += 1) {
    indices.push(0, index, index + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function direction(azimuth, rise) {
  return new THREE.Vector3(Math.cos(azimuth), rise, Math.sin(azimuth)).normalize();
}

export function createDemo() {
  const root = new THREE.Group();
  root.name = "GinkgoTree";

  const random = seededRandom(0x47a1f00d);
  const geometries = [];
  const swayNodes = [];
  const leafRecords = [];

  const barkMaterial = new THREE.MeshStandardMaterial({
    color: 0x66523a,
    roughness: 0.94,
    metalness: 0,
  });
  const rootMaterial = new THREE.MeshStandardMaterial({
    color: 0x59452f,
    roughness: 0.98,
    metalness: 0,
  });
  const petioleMaterial = new THREE.MeshStandardMaterial({
    color: 0x7f8232,
    roughness: 0.85,
    metalness: 0,
  });
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0xc2cd48,
    roughness: 0.78,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const materials = [barkMaterial, rootMaterial, petioleMaterial, leafMaterial];

  function addSwayNode(node, depth, flexibility, phase) {
    swayNodes.push({
      node,
      depth,
      flexibility,
      phase,
      restQuaternion: node.quaternion.clone(),
    });
  }

  function addSegment(parent, options) {
    const {
      name,
      position,
      localDirection,
      length,
      baseRadius,
      tipRadius,
      radialSegments,
      depth,
      flexibility,
    } = options;
    const pivot = new THREE.Group();
    pivot.name = `${name}Pivot`;
    pivot.position.copy(position);
    pivot.quaternion.setFromUnitVectors(Y_AXIS, localDirection.clone().normalize());
    parent.add(pivot);

    const geometry = segmentGeometry(length, baseRadius, tipRadius, radialSegments);
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, barkMaterial);
    mesh.name = name;
    mesh.castShadow = depth < 3;
    mesh.receiveShadow = true;
    pivot.add(mesh);
    addSwayNode(pivot, depth, flexibility, random() * Math.PI * 2);
    return { pivot, length, tipRadius };
  }

  const rootGeometry = segmentGeometry(1, 0.235, 0.018, 7, 1);
  geometries.push(rootGeometry);
  const exposedRoots = new THREE.InstancedMesh(rootGeometry, rootMaterial, 9);
  exposedRoots.name = "GroundedRootFlares";
  exposedRoots.castShadow = true;
  exposedRoots.receiveShadow = true;
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const rootScale = new THREE.Vector3();
  for (let index = 0; index < 9; index += 1) {
    const azimuth = (index / 9) * Math.PI * 2 + (random() - 0.5) * 0.22;
    const length = 0.7 + random() * 0.48;
    const start = new THREE.Vector3(Math.cos(azimuth) * 0.17, 0.12, Math.sin(azimuth) * 0.17);
    const rootDirection = new THREE.Vector3(
      Math.cos(azimuth) * length,
      -0.1,
      Math.sin(azimuth) * length,
    ).normalize();
    quaternion.setFromUnitVectors(Y_AXIS, rootDirection);
    rootScale.set(0.78 + random() * 0.32, length, 0.7 + random() * 0.28);
    matrix.compose(start, quaternion, rootScale);
    exposedRoots.setMatrixAt(index, matrix);
  }
  exposedRoots.instanceMatrix.needsUpdate = true;
  root.add(exposedRoots);

  const trunkLengths = [1.35, 1.3, 1.2, 1.08, 0.9];
  const trunkRadii = [0.4, 0.335, 0.28, 0.225, 0.175, 0.105];
  const trunkDirections = [
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0.018, 1, -0.012),
    new THREE.Vector3(-0.025, 1, 0.018),
    new THREE.Vector3(0.03, 1, 0.012),
    new THREE.Vector3(-0.018, 1, -0.02),
  ];
  const trunkSegments = [];
  let trunkParent = root;
  let trunkPosition = new THREE.Vector3(0, 0, 0);
  for (let index = 0; index < trunkLengths.length; index += 1) {
    const segment = addSegment(trunkParent, {
      name: `TrunkSegment${index + 1}`,
      position: trunkPosition,
      localDirection: trunkDirections[index],
      length: trunkLengths[index],
      baseRadius: trunkRadii[index],
      tipRadius: trunkRadii[index + 1],
      radialSegments: 10,
      depth: index,
      flexibility: index * 0.00075,
    });
    trunkSegments.push(segment);
    trunkParent = segment.pivot;
    trunkPosition = new THREE.Vector3(0, segment.length, 0);
  }

  function addLeafCluster(parent, branchLength, fraction, clusterIndex) {
    const count = 3 + Math.floor(random() * 3);
    const baseAzimuth = random() * Math.PI * 2;
    for (let index = 0; index < count; index += 1) {
      const angle = baseAzimuth + (index / count) * Math.PI * 2 + (random() - 0.5) * 0.28;
      const petioleLength = 0.13 + random() * 0.09;
      const petioleDirection = new THREE.Vector3(
        Math.cos(angle) * (0.7 + random() * 0.18),
        0.28 + random() * 0.42,
        Math.sin(angle) * (0.7 + random() * 0.18),
      ).normalize();
      const anchor = new THREE.Vector3(
        Math.cos(angle) * 0.025,
        branchLength * fraction + (random() - 0.5) * 0.06,
        Math.sin(angle) * 0.025,
      );
      const petioleQuaternion = new THREE.Quaternion().setFromUnitVectors(Y_AXIS, petioleDirection);
      const leafQuaternion = petioleQuaternion.clone();
      leafQuaternion.multiply(
        new THREE.Quaternion().setFromAxisAngle(Y_AXIS, angle * 0.35 + (random() - 0.5) * 0.6),
      );
      leafRecords.push({
        parent,
        anchor,
        petioleDirection,
        petioleLength,
        petioleQuaternion,
        leafQuaternion,
        leafScale: 0.31 + random() * 0.11,
        color: new THREE.Color().setHSL(0.16 + random() * 0.035, 0.5 + random() * 0.16, 0.48 + random() * 0.1),
        phase: random() * Math.PI * 2 + clusterIndex * 0.13,
      });
    }
  }

  const primarySpecs = [
    [1, 0.22, 0.15, 1.85, 0.5],
    [1, 0.66, 2.7, 1.72, 0.56],
    [2, 0.16, 4.48, 1.9, 0.58],
    [2, 0.55, 1.6, 1.72, 0.64],
    [2, 0.87, 3.42, 1.58, 0.69],
    [3, 0.3, 5.35, 1.5, 0.76],
    [3, 0.68, 2.18, 1.34, 0.84],
    [4, 0.3, 0.66, 1.12, 0.95],
  ];

  primarySpecs.forEach(([trunkIndex, heightFraction, azimuth, length, rise], index) => {
    const trunk = trunkSegments[trunkIndex];
    const primary = addSegment(trunk.pivot, {
      name: `PrimaryBough${index + 1}`,
      position: new THREE.Vector3(0, trunk.length * heightFraction, 0),
      localDirection: direction(azimuth, rise),
      length,
      baseRadius: 0.105 - index * 0.004,
      tipRadius: 0.055 - index * 0.002,
      radialSegments: 8,
      depth: 2,
      flexibility: 0.008 + index * 0.00055,
    });

    const continuation = addSegment(primary.pivot, {
      name: `PrimaryBough${index + 1}Continuation`,
      position: new THREE.Vector3(0, length * 0.96, 0),
      localDirection: new THREE.Vector3((random() - 0.5) * 0.28, 1, (random() - 0.5) * 0.24),
      length: length * (0.48 + random() * 0.1),
      baseRadius: primary.tipRadius,
      tipRadius: 0.018,
      radialSegments: 6,
      depth: 3,
      flexibility: 0.017 + random() * 0.006,
    });

    const forkSide = index % 2 === 0 ? 1 : -1;
    const fork = addSegment(primary.pivot, {
      name: `PrimaryBough${index + 1}SideFork`,
      position: new THREE.Vector3(0, length * (0.56 + random() * 0.1), 0),
      localDirection: new THREE.Vector3(forkSide * (0.52 + random() * 0.14), 0.78, (random() - 0.5) * 0.38),
      length: length * (0.38 + random() * 0.09),
      baseRadius: primary.tipRadius * 0.82,
      tipRadius: 0.016,
      radialSegments: 6,
      depth: 3,
      flexibility: 0.02 + random() * 0.007,
    });

    addLeafCluster(primary.pivot, primary.length, 0.48, index * 7);
    addLeafCluster(primary.pivot, primary.length, 0.78, index * 7 + 1);
    addLeafCluster(continuation.pivot, continuation.length, 0.35, index * 7 + 2);
    addLeafCluster(continuation.pivot, continuation.length, 0.67, index * 7 + 3);
    addLeafCluster(continuation.pivot, continuation.length, 0.96, index * 7 + 4);
    addLeafCluster(fork.pivot, fork.length, 0.52, index * 7 + 5);
    addLeafCluster(fork.pivot, fork.length, 0.94, index * 7 + 6);
  });

  const leafGeometry = fanLeafGeometry();
  const petioleGeometry = new THREE.CylinderGeometry(0.012, 0.018, 1, 5, 1, false);
  geometries.push(leafGeometry, petioleGeometry);
  const petioles = new THREE.InstancedMesh(petioleGeometry, petioleMaterial, leafRecords.length);
  petioles.name = "ClusteredPetioles";
  petioles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  petioles.castShadow = false;
  petioles.receiveShadow = true;
  root.add(petioles);

  const leaves = new THREE.InstancedMesh(leafGeometry, leafMaterial, leafRecords.length);
  leaves.name = "NotchedFanLeaves";
  leaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  leaves.castShadow = false;
  leaves.receiveShadow = true;
  leafRecords.forEach((record, index) => leaves.setColorAt(index, record.color));
  if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
  root.add(leaves);

  const rootInverse = new THREE.Matrix4();
  const parentRelative = new THREE.Matrix4();
  const localMatrix = new THREE.Matrix4();
  const instanceMatrix = new THREE.Matrix4();
  const petiolePosition = new THREE.Vector3();
  const leafPosition = new THREE.Vector3();
  const petioleScale = new THREE.Vector3();
  const leafScale = new THREE.Vector3();
  const leafQuaternion = new THREE.Quaternion();
  const flutterQuaternion = new THREE.Quaternion();

  function updateInstances(elapsedSeconds, motionEnabled) {
    root.updateMatrixWorld(true);
    rootInverse.copy(root.matrixWorld).invert();
    leafRecords.forEach((record, index) => {
      parentRelative.multiplyMatrices(rootInverse, record.parent.matrixWorld);

      petiolePosition.copy(record.petioleDirection).multiplyScalar(record.petioleLength * 0.5).add(record.anchor);
      petioleScale.set(0.78, record.petioleLength, 0.78);
      localMatrix.compose(petiolePosition, record.petioleQuaternion, petioleScale);
      instanceMatrix.multiplyMatrices(parentRelative, localMatrix);
      petioles.setMatrixAt(index, instanceMatrix);

      leafPosition.copy(record.petioleDirection).multiplyScalar(record.petioleLength).add(record.anchor);
      leafQuaternion.copy(record.leafQuaternion);
      if (motionEnabled) {
        const flutter = Math.sin(elapsedSeconds * 2.65 + record.phase) * 0.035;
        flutterQuaternion.setFromAxisAngle(X_AXIS, flutter);
        leafQuaternion.multiply(flutterQuaternion);
      }
      leafScale.setScalar(record.leafScale);
      localMatrix.compose(leafPosition, leafQuaternion, leafScale);
      instanceMatrix.multiplyMatrices(parentRelative, localMatrix);
      leaves.setMatrixAt(index, instanceMatrix);
    });
    petioles.instanceMatrix.needsUpdate = true;
    leaves.instanceMatrix.needsUpdate = true;
  }

  function update(_deltaSeconds, elapsedSeconds, motionEnabled) {
    swayNodes.forEach((record) => {
      record.node.quaternion.copy(record.restQuaternion);
      if (!motionEnabled || record.flexibility === 0) return;
      const inheritedPulse = Math.sin(elapsedSeconds * 0.58 + record.phase) * record.flexibility;
      const crossPulse = Math.sin(elapsedSeconds * 0.41 + record.phase * 1.37) * record.flexibility * 0.55;
      record.node.rotateZ(inheritedPulse * (1 + record.depth * 0.08));
      record.node.rotateX(crossPulse);
    });
    updateInstances(elapsedSeconds, motionEnabled);
  }

  function reset() {
    swayNodes.forEach((record) => record.node.quaternion.copy(record.restQuaternion));
    updateInstances(0, false);
  }

  reset();
  exposedRoots.computeBoundingSphere();
  petioles.computeBoundingSphere();
  leaves.computeBoundingSphere();

  return {
    root,
    update,
    reset,
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
}

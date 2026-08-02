import * as THREE from "three";

export const meta = {
  id: "articulated-lamp",
  order: 10,
  title: "Articulated Architect Lamp",
  category: "MECHANISM",
  description: "A premium task lamp tests nested pivots, tension hardware, and coordinated aim-preserving motion.",
  accent: "#d8a85d",
  background: "#101319",
  cameraDirection: [1.5, 0.9, 1.85],
  target: [0, 0.82, 0],
};

const Y_AXIS = new THREE.Vector3(0, 1, 0);

function markSurface(mesh, receiveShadow = false) {
  mesh.castShadow = true;
  mesh.receiveShadow = receiveShadow;
  return mesh;
}

function makeAxle(name, radius, length, material) {
  const axle = markSurface(
    new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 24), material),
  );
  axle.name = name;
  axle.rotation.x = Math.PI / 2;
  return axle;
}

function makeRailPair(name, length, material) {
  const radius = 0.027;
  const geometry = new THREE.CapsuleGeometry(radius, length - radius * 2, 5, 10);
  const rails = new THREE.InstancedMesh(geometry, material, 2);
  const matrix = new THREE.Matrix4();

  rails.name = name;
  rails.castShadow = true;
  for (let index = 0; index < 2; index += 1) {
    matrix.makeTranslation(0, length * 0.5, index === 0 ? -0.066 : 0.066);
    rails.setMatrixAt(index, matrix);
  }
  rails.instanceMatrix.needsUpdate = true;
  return rails;
}

function makeHelicalSpring(name, length, material) {
  const points = [];
  const turns = 13;
  const samples = 104;

  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples;
    const phase = t * Math.PI * 2 * turns;
    points.push(
      new THREE.Vector3(
        0.052 + Math.cos(phase) * 0.017,
        0.13 + t * length,
        0.092 + Math.sin(phase) * 0.017,
      ),
    );
  }

  const curve = new THREE.CatmullRomCurve3(points);
  const spring = markSurface(
    new THREE.Mesh(new THREE.TubeGeometry(curve, samples, 0.006, 6, false), material),
  );
  spring.name = name;
  return spring;
}

function orientConnector(mesh, start, end) {
  const direction = end.clone().sub(start);
  const distance = direction.length();
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(Y_AXIS, direction.normalize());
  mesh.scale.set(1, distance, 1);
}

export function createDemo() {
  const root = new THREE.Group();
  root.name = "ARTICULATED_LAMP_ROOT";

  const graphite = new THREE.MeshStandardMaterial({
    color: 0x22272d,
    metalness: 0.72,
    roughness: 0.27,
  });
  const graphiteSoft = new THREE.MeshStandardMaterial({
    color: 0x30373e,
    metalness: 0.46,
    roughness: 0.4,
  });
  const brass = new THREE.MeshStandardMaterial({
    color: 0xc6934b,
    metalness: 0.88,
    roughness: 0.23,
  });
  const rubber = new THREE.MeshStandardMaterial({
    color: 0x090b0d,
    metalness: 0,
    roughness: 0.84,
  });
  const diffuserMaterial = new THREE.MeshStandardMaterial({
    color: 0xffe8bd,
    emissive: 0xffb85c,
    emissiveIntensity: 2.25,
    metalness: 0,
    roughness: 0.56,
    side: THREE.DoubleSide,
  });

  const base = new THREE.Group();
  base.name = "WEIGHTED_BASE";
  root.add(base);

  const foot = markSurface(
    new THREE.Mesh(new THREE.CylinderGeometry(0.395, 0.405, 0.032, 40), rubber),
    true,
  );
  foot.name = "RUBBER_CONTACT_PAD";
  foot.position.y = 0.016;
  base.add(foot);

  const baseWeight = markSurface(
    new THREE.Mesh(new THREE.CylinderGeometry(0.385, 0.42, 0.105, 48), graphite),
    true,
  );
  baseWeight.name = "CAST_WEIGHT_SHELL";
  baseWeight.position.y = 0.081;
  base.add(baseWeight);

  const baseRing = markSurface(new THREE.Mesh(new THREE.TorusGeometry(0.347, 0.008, 8, 40), brass));
  baseRing.name = "BASE_TRIM_RING";
  baseRing.position.y = 0.136;
  baseRing.rotation.x = Math.PI / 2;
  base.add(baseRing);

  const pedestal = markSurface(
    new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.13, 0.15, 32), graphiteSoft),
  );
  pedestal.name = "SHOULDER_PEDESTAL";
  pedestal.position.y = 0.205;
  base.add(pedestal);

  const shoulderHeight = 0.34;
  const yokeGeometry = new THREE.BoxGeometry(0.16, 0.18, 0.038);
  const yoke = new THREE.InstancedMesh(yokeGeometry, graphiteSoft, 2);
  const yokeMatrix = new THREE.Matrix4();
  yoke.name = "SHOULDER_YOKE_SIDES";
  yoke.castShadow = true;
  for (let index = 0; index < 2; index += 1) {
    yokeMatrix.makeTranslation(0, 0.285, index === 0 ? -0.11 : 0.11);
    yoke.setMatrixAt(index, yokeMatrix);
  }
  yoke.instanceMatrix.needsUpdate = true;
  base.add(yoke);

  const shoulderAxle = makeAxle("SHOULDER_FIXED_AXLE", 0.087, 0.27, brass);
  shoulderAxle.position.y = shoulderHeight;
  base.add(shoulderAxle);

  const shoulderPivot = new THREE.Group();
  shoulderPivot.name = "SHOULDER_PIVOT";
  shoulderPivot.position.y = shoulderHeight;
  root.add(shoulderPivot);

  const shoulderClutch = makeAxle("SHOULDER_CLUTCH", 0.105, 0.105, graphite);
  shoulderPivot.add(shoulderClutch);

  const lowerLength = 0.72;
  const lowerRails = makeRailPair("LOWER_ARM_RAIL_PAIR", lowerLength, graphiteSoft);
  shoulderPivot.add(lowerRails);

  const lowerSpring = makeHelicalSpring("LOWER_ARM_TENSION_SPRING", 0.41, brass);
  shoulderPivot.add(lowerSpring);

  const springAnchorGeometry = new THREE.CylinderGeometry(0.018, 0.018, 0.13, 12);
  const springAnchors = new THREE.InstancedMesh(springAnchorGeometry, brass, 2);
  const anchorMatrix = new THREE.Matrix4();
  const anchorRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  springAnchors.name = "SPRING_ANCHOR_PINS";
  springAnchors.castShadow = true;
  anchorMatrix.compose(new THREE.Vector3(0.052, 0.13, 0.092), anchorRotation, new THREE.Vector3(1, 1, 1));
  springAnchors.setMatrixAt(0, anchorMatrix);
  anchorMatrix.compose(new THREE.Vector3(0.052, 0.54, 0.092), anchorRotation, new THREE.Vector3(1, 1, 1));
  springAnchors.setMatrixAt(1, anchorMatrix);
  springAnchors.instanceMatrix.needsUpdate = true;
  shoulderPivot.add(springAnchors);

  const elbowHousing = makeAxle("ELBOW_LOWER_HOUSING", 0.09, 0.205, graphite);
  elbowHousing.position.y = lowerLength;
  shoulderPivot.add(elbowHousing);

  const elbowPivot = new THREE.Group();
  elbowPivot.name = "ELBOW_PIVOT";
  elbowPivot.position.y = lowerLength;
  shoulderPivot.add(elbowPivot);

  const elbowPin = makeAxle("ELBOW_BRASS_PIN", 0.058, 0.235, brass);
  elbowPivot.add(elbowPin);

  const upperLength = 0.64;
  const upperRails = makeRailPair("UPPER_ARM_RAIL_PAIR", upperLength, graphite);
  elbowPivot.add(upperRails);

  const tensionLink = markSurface(
    new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 1, 10), brass),
  );
  tensionLink.name = "ELBOW_TENSION_LINK";
  shoulderPivot.add(tensionLink);

  const headHousing = makeAxle("HEAD_UPPER_HOUSING", 0.082, 0.19, graphite);
  headHousing.position.y = upperLength;
  elbowPivot.add(headHousing);

  const headPivot = new THREE.Group();
  headPivot.name = "HEAD_PIVOT";
  headPivot.position.y = upperLength;
  elbowPivot.add(headPivot);

  const headPin = makeAxle("HEAD_BRASS_PIN", 0.052, 0.22, brass);
  headPivot.add(headPin);

  const neck = markSurface(
    new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.055, 5, 10), graphiteSoft),
  );
  neck.name = "SHADE_NECK";
  neck.position.y = -0.07;
  headPivot.add(neck);

  const shade = markSurface(
    new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.215, 0.27, 40, 1, true), graphite),
  );
  shade.name = "FLARED_METAL_SHADE";
  shade.position.y = -0.22;
  headPivot.add(shade);

  const shadeCrown = markSurface(
    new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.108, 0.07, 32), graphiteSoft),
  );
  shadeCrown.name = "SHADE_CROWN";
  shadeCrown.position.y = -0.065;
  headPivot.add(shadeCrown);

  const shadeRim = markSurface(new THREE.Mesh(new THREE.TorusGeometry(0.215, 0.012, 8, 40), brass));
  shadeRim.name = "SHADE_RIM";
  shadeRim.position.y = -0.355;
  shadeRim.rotation.x = Math.PI / 2;
  headPivot.add(shadeRim);

  const diffuser = new THREE.Mesh(new THREE.CircleGeometry(0.205, 40), diffuserMaterial);
  diffuser.name = "WARM_DIFFUSER";
  diffuser.position.y = -0.357;
  diffuser.rotation.x = Math.PI / 2;
  headPivot.add(diffuser);

  const taskLight = new THREE.SpotLight(0xffc878, 28, 3.2, 0.47, 0.68, 2);
  taskLight.name = "CAST_LIGHT_INTENT";
  taskLight.position.set(0, -0.32, 0);
  taskLight.castShadow = false;
  const lightTarget = new THREE.Object3D();
  lightTarget.name = "TASK_LIGHT_TARGET";
  lightTarget.position.set(0, -2.1, 0);
  headPivot.add(taskLight, lightTarget);
  taskLight.target = lightTarget;

  const shoulderRest = 0.52;
  const elbowRest = -1.14;
  const headRest = -(shoulderRest + elbowRest);
  const tensionStart = new THREE.Vector3(0.055, 0.5, 0.102);
  const tensionEndLocal = new THREE.Vector3(0.055, 0.19, 0.102);

  function updateTensionLink() {
    elbowPivot.updateMatrix();
    const tensionEnd = tensionEndLocal.clone().applyMatrix4(elbowPivot.matrix);
    orientConnector(tensionLink, tensionStart, tensionEnd);
  }

  function applyPose(shoulderAngle, elbowAngle, headAngle) {
    shoulderPivot.rotation.z = shoulderAngle;
    elbowPivot.rotation.z = elbowAngle;
    headPivot.rotation.z = headAngle;
    root.userData.pose = {
      shoulderRadians: shoulderAngle,
      elbowRadians: elbowAngle,
      headRadians: headAngle,
    };
    updateTensionLink();
  }

  function reset() {
    applyPose(shoulderRest, elbowRest, headRest);
  }

  reset();

  return {
    root,
    update(_deltaSeconds, elapsedSeconds, motionEnabled) {
      if (!motionEnabled) {
        reset();
        return;
      }

      const cycle = elapsedSeconds * 0.58;
      const shoulderOffset = Math.sin(cycle) * 0.052;
      const elbowOffset = Math.sin(cycle + 0.78) * 0.068;
      const aimDrift = Math.sin(cycle * 0.73 + 1.1) * 0.018;
      applyPose(
        shoulderRest + shoulderOffset,
        elbowRest + elbowOffset,
        headRest - shoulderOffset - elbowOffset + aimDrift,
      );
    },
    reset,
    dispose() {
      taskLight.dispose();
    },
  };
}

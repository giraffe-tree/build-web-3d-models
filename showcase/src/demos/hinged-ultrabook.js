import * as THREE from "three";

export const meta = {
  id: "hinged-ultrabook",
  order: 20,
  title: "Hinged Ultrabook",
  category: "MECHANISM",
  description: "A premium procedural ultrabook opens and closes around a physically placed hinge.",
  accent: "#67d7ff",
  background: "#070b12",
  cameraDirection: [1.45, 0.95, 1.8],
  target: [0, 0.86, 0],
};

function roundedRectShape(width, height, radius, x = -width / 2, y = -height / 2) {
  const r = Math.min(radius, width / 2, height / 2);
  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

function roundedPlanGeometry(width, depth, height, radius, bevel = 0.008) {
  const geometry = new THREE.ExtrudeGeometry(roundedRectShape(width, depth, radius), {
    depth: height,
    steps: 1,
    curveSegments: 4,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: bevel,
    bevelThickness: Math.min(bevel, height * 0.35),
  });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

function roundedLidGeometry(width, height, thickness, radius, bottom = 0.035) {
  const geometry = new THREE.ExtrudeGeometry(
    roundedRectShape(width, height, radius, -width / 2, bottom),
    {
      depth: thickness,
      steps: 1,
      curveSegments: 4,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.009,
      bevelThickness: 0.007,
    },
  );
  geometry.translate(0, 0, -thickness);
  return geometry;
}

function roundedFaceGeometry(width, height, radius, bottom) {
  return new THREE.ShapeGeometry(
    roundedRectShape(width, height, radius, -width / 2, bottom),
    5,
  );
}

function makeMesh(name, geometry, material, castShadow = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  return mesh;
}

export function createDemo() {
  const root = new THREE.Group();
  root.name = "HINGED_ULTRABOOK_ROOT";

  const materials = {
    aluminum: new THREE.MeshStandardMaterial({
      color: 0xb8c1ca,
      metalness: 0.82,
      roughness: 0.24,
    }),
    deck: new THREE.MeshStandardMaterial({
      color: 0x77828d,
      metalness: 0.72,
      roughness: 0.31,
    }),
    key: new THREE.MeshStandardMaterial({
      color: 0x090c11,
      metalness: 0.08,
      roughness: 0.3,
    }),
    rubber: new THREE.MeshStandardMaterial({
      color: 0x080a0d,
      metalness: 0,
      roughness: 0.72,
    }),
    hinge: new THREE.MeshStandardMaterial({
      color: 0x29313a,
      metalness: 0.78,
      roughness: 0.25,
    }),
    bezel: new THREE.MeshStandardMaterial({
      color: 0x05080d,
      metalness: 0.08,
      roughness: 0.22,
    }),
    screen: new THREE.MeshStandardMaterial({
      color: 0x07131e,
      emissive: 0x0b3b58,
      emissiveIntensity: 1.25,
      metalness: 0,
      roughness: 0.2,
    }),
    cyan: new THREE.MeshBasicMaterial({ color: 0x36d7ff }),
    blue: new THREE.MeshBasicMaterial({ color: 0x1468e8 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xccefff,
      transparent: true,
      opacity: 0.09,
      depthWrite: false,
      metalness: 0,
      roughness: 0.08,
    }),
  };

  const base = new THREE.Group();
  base.name = "BASE";
  root.add(base);

  const baseShell = makeMesh(
    "BASE_SHELL",
    roundedPlanGeometry(3.3, 2.16, 0.125, 0.1, 0.012),
    materials.aluminum,
  );
  baseShell.position.y = 0.027;
  base.add(baseShell);

  const deckInset = makeMesh(
    "DECK_INSET",
    roundedPlanGeometry(3.08, 1.94, 0.01, 0.075, 0.003),
    materials.deck,
  );
  deckInset.position.set(0, 0.15, 0.015);
  base.add(deckInset);

  const keyRows = [14, 14, 13, 13, 11];
  const keyCount = keyRows.reduce((sum, count) => sum + count, 0);
  const keyGeometry = new THREE.BoxGeometry(1, 1, 1);
  const keyboard = new THREE.InstancedMesh(keyGeometry, materials.key, keyCount);
  keyboard.name = "KEYBOARD";
  keyboard.castShadow = true;
  keyboard.receiveShadow = true;
  const keyTransform = new THREE.Object3D();
  let keyIndex = 0;
  for (let row = 0; row < keyRows.length; row += 1) {
    const count = keyRows[row];
    const spacing = 0.205;
    const z = -0.61 + row * 0.205;
    for (let column = 0; column < count; column += 1) {
      const isSpacebar = row === 4 && column === Math.floor(count / 2);
      const width = isSpacebar ? 0.54 : 0.17;
      const centeredColumn = column - (count - 1) / 2;
      const spacebarClearance = row === 4 && centeredColumn !== 0
        ? Math.sign(centeredColumn) * 0.19
        : 0;
      const x = centeredColumn * spacing + spacebarClearance;
      keyTransform.position.set(x, 0.172, z);
      keyTransform.scale.set(width, 0.018, 0.15);
      keyTransform.updateMatrix();
      keyboard.setMatrixAt(keyIndex, keyTransform.matrix);
      keyIndex += 1;
    }
  }
  keyboard.instanceMatrix.needsUpdate = true;
  base.add(keyboard);

  const trackpad = makeMesh(
    "TRACKPAD",
    roundedPlanGeometry(1.28, 0.62, 0.008, 0.055, 0.002),
    materials.aluminum,
  );
  trackpad.position.set(0, 0.158, 0.69);
  base.add(trackpad);

  const grilleGeometry = new THREE.BoxGeometry(1, 1, 1);
  const grilles = new THREE.InstancedMesh(grilleGeometry, materials.key, 16);
  grilles.name = "SPEAKER_GRILLES";
  grilles.castShadow = false;
  const grilleTransform = new THREE.Object3D();
  let grilleIndex = 0;
  for (const side of [-1, 1]) {
    for (let slot = 0; slot < 8; slot += 1) {
      grilleTransform.position.set(side * 1.43, 0.166, -0.55 + slot * 0.13);
      grilleTransform.scale.set(0.035, 0.006, 0.075);
      grilleTransform.updateMatrix();
      grilles.setMatrixAt(grilleIndex, grilleTransform.matrix);
      grilleIndex += 1;
    }
  }
  grilles.instanceMatrix.needsUpdate = true;
  base.add(grilles);

  const feet = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), materials.rubber, 4);
  feet.name = "RUBBER_FEET";
  feet.castShadow = true;
  const footTransform = new THREE.Object3D();
  let footIndex = 0;
  for (const x of [-1.35, 1.35]) {
    for (const z of [-0.86, 0.86]) {
      footTransform.position.set(x, 0.017, z);
      footTransform.scale.set(0.25, 0.024, 0.09);
      footTransform.updateMatrix();
      feet.setMatrixAt(footIndex, footTransform.matrix);
      footIndex += 1;
    }
  }
  feet.instanceMatrix.needsUpdate = true;
  base.add(feet);

  const hingeAxis = new THREE.Vector3(0, 0.202, -1.03);
  const hinge = new THREE.Group();
  hinge.name = "HINGE";
  hinge.position.copy(hingeAxis);
  root.add(hinge);

  const barrel = makeMesh(
    "STATIONARY_HINGE_BARREL",
    new THREE.CylinderGeometry(0.055, 0.055, 2.62, 24, 1),
    materials.hinge,
  );
  barrel.rotation.z = Math.PI / 2;
  hinge.add(barrel);

  const lidPivot = new THREE.Group();
  lidPivot.name = "MOVING_LID_ASSEMBLY";
  lidPivot.position.copy(hingeAxis);
  lidPivot.userData.hingeAxis = hingeAxis.toArray();
  root.add(lidPivot);

  const collarGeometry = new THREE.CylinderGeometry(0.068, 0.068, 0.25, 24, 1);
  const collars = new THREE.InstancedMesh(collarGeometry, materials.aluminum, 2);
  collars.name = "MOVING_HINGE_COLLARS";
  collars.castShadow = true;
  const collarTransform = new THREE.Object3D();
  collarTransform.rotation.z = Math.PI / 2;
  for (let index = 0; index < 2; index += 1) {
    collarTransform.position.set(index === 0 ? -1.32 : 1.32, 0, 0);
    collarTransform.updateMatrix();
    collars.setMatrixAt(index, collarTransform.matrix);
  }
  collars.instanceMatrix.needsUpdate = true;
  lidPivot.add(collars);

  const displayLid = new THREE.Group();
  displayLid.name = "DISPLAY_LID";
  lidPivot.add(displayLid);

  const displayShell = makeMesh(
    "DISPLAY_SHELL",
    roundedLidGeometry(3.22, 2.045, 0.08, 0.105),
    materials.aluminum,
  );
  displayLid.add(displayShell);

  const gasket = makeMesh(
    "DISPLAY_GASKET",
    roundedFaceGeometry(3.1, 1.92, 0.075, 0.09),
    materials.bezel,
  );
  gasket.position.z = 0.004;
  displayLid.add(gasket);

  const screen = makeMesh(
    "DISPLAY_GLASS_BACKING",
    roundedFaceGeometry(2.91, 1.7, 0.055, 0.195),
    materials.screen,
    false,
  );
  screen.position.z = 0.008;
  displayLid.add(screen);

  const graphics = new THREE.Group();
  graphics.name = "SCREEN_GRAPHICS";
  displayLid.add(graphics);
  const graphicSpecs = [
    [0.42, 1.1, 0.55, materials.screen],
    [0.42, 1.1, 0.39, materials.blue],
    [0.42, 1.1, 0.21, materials.cyan],
  ];
  graphicSpecs.forEach(([x, y, radius, material], index) => {
    const orb = makeMesh(
      `SCREEN_ORB_${index + 1}`,
      new THREE.CircleGeometry(radius, 40),
      material,
      false,
    );
    orb.position.set(x, y, 0.01 + index * 0.0005);
    graphics.add(orb);
  });

  const glass = makeMesh(
    "DISPLAY_GLASS",
    roundedFaceGeometry(2.91, 1.7, 0.055, 0.195),
    materials.glass,
    false,
  );
  glass.position.z = 0.013;
  glass.renderOrder = 2;
  displayLid.add(glass);

  const maxOpenAngle = 110;
  let phase = Math.PI;
  function applyOpenAngle(openAngleDegrees) {
    const angle = THREE.MathUtils.clamp(openAngleDegrees, 0, maxOpenAngle);
    lidPivot.rotation.x = THREE.MathUtils.degToRad(90 - angle);
    lidPivot.userData.openAngleDegrees = angle;
  }
  applyOpenAngle(maxOpenAngle);

  return {
    root,
    update(deltaSeconds, _elapsedSeconds, motionEnabled) {
      if (!motionEnabled) return;
      const safeDelta = Number.isFinite(deltaSeconds)
        ? THREE.MathUtils.clamp(deltaSeconds, 0, 0.1)
        : 0;
      phase = (phase + safeDelta * 0.52) % (Math.PI * 2);
      const openness = 0.5 - 0.5 * Math.cos(phase);
      applyOpenAngle(maxOpenAngle * openness);
    },
    reset() {
      phase = Math.PI;
      applyOpenAngle(maxOpenAngle);
    },
  };
}

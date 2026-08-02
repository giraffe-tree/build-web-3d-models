import * as THREE from "three";

export const meta = {
  id: "modular-cabin",
  order: 70,
  title: "Modular Forest Cabin",
  category: "ARCHITECTURE",
  description: "A compact timber cabin study with modular construction, warm interior depth, and a correctly hinged door.",
  accent: "#ffb15c",
  background: "#0a1210",
  cameraDirection: [1.35, 0.85, 1.55],
  target: [0, 2.15, 0.65],
};

const DEG2RAD = Math.PI / 180;

export function createDemo() {
  const root = new THREE.Group();
  root.name = "CABIN_ROOT";

  const shell = new THREE.Group();
  shell.name = "CABIN_SHELL";
  root.add(shell);

  const porch = new THREE.Group();
  porch.name = "PORCH_AND_ENTRY";
  root.add(porch);

  const interior = new THREE.Group();
  interior.name = "WARM_INTERIOR_DEPTH";
  root.add(interior);

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const dummy = new THREE.Object3D();

  const materials = {
    cladding: new THREE.MeshStandardMaterial({
      color: 0x34463e,
      roughness: 0.88,
      metalness: 0,
    }),
    batten: new THREE.MeshStandardMaterial({
      color: 0x1f2d29,
      roughness: 0.84,
      metalness: 0,
    }),
    timber: new THREE.MeshStandardMaterial({
      color: 0x332218,
      roughness: 0.8,
      metalness: 0,
    }),
    deck: new THREE.MeshStandardMaterial({
      color: 0x715039,
      roughness: 0.82,
      metalness: 0,
    }),
    roof: new THREE.MeshStandardMaterial({
      color: 0x252b2c,
      roughness: 0.7,
      metalness: 0.08,
    }),
    concrete: new THREE.MeshStandardMaterial({
      color: 0x73736c,
      roughness: 0.96,
      metalness: 0,
    }),
    chimney: new THREE.MeshStandardMaterial({
      color: 0x765c4d,
      roughness: 0.94,
      metalness: 0,
    }),
    door: new THREE.MeshStandardMaterial({
      color: 0x8a4b2f,
      roughness: 0.76,
      metalness: 0,
    }),
    metal: new THREE.MeshStandardMaterial({
      color: 0x8c8175,
      roughness: 0.5,
      metalness: 0.55,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xa9d0cb,
      roughness: 0.16,
      metalness: 0,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    interior: new THREE.MeshStandardMaterial({
      color: 0x4b2918,
      emissive: 0x8d3b16,
      emissiveIntensity: 0.34,
      roughness: 0.9,
      metalness: 0,
    }),
    interiorWood: new THREE.MeshStandardMaterial({
      color: 0x9b673f,
      emissive: 0x5b220d,
      emissiveIntensity: 0.18,
      roughness: 0.78,
      metalness: 0,
    }),
    lamp: new THREE.MeshStandardMaterial({
      color: 0xffc777,
      emissive: 0xff7a20,
      emissiveIntensity: 2.4,
      roughness: 0.38,
      metalness: 0,
    }),
  };

  function addInstances(name, parent, material, transforms, options = {}) {
    const mesh = new THREE.InstancedMesh(unitBox, material, transforms.length);
    mesh.name = name;
    mesh.castShadow = options.castShadow ?? true;
    mesh.receiveShadow = options.receiveShadow ?? true;

    transforms.forEach((transform, index) => {
      const {
        position,
        scale,
        rotation = [0, 0, 0],
      } = transform;
      dummy.position.set(...position);
      dummy.rotation.set(...rotation);
      dummy.scale.set(...scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    parent.add(mesh);
    return mesh;
  }

  function addBox(name, parent, material, position, scale, rotation = [0, 0, 0]) {
    const mesh = new THREE.Mesh(unitBox, material);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.rotation.set(...rotation);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Raised footings keep all bearing points visibly connected to the ground.
  addInstances("FOUNDATION_PIERS", root, materials.concrete, [
    [-2.45, -1.75], [0, -1.75], [2.45, -1.75],
    [-2.45, 1.65], [0, 1.65], [2.45, 1.65],
    [-2.45, 3.22], [2.45, 3.22],
  ].map(([x, z]) => ({ position: [x, 0.25, z], scale: [0.44, 0.5, 0.44] })));

  // Modular wall panels leave real apertures for the door and both windows.
  addInstances("CLADDING_WALL_BAYS", shell, materials.cladding, [
    { position: [0, 2, -2.3], scale: [5.8, 3, 0.18] },
    { position: [-2.9, 2, 0], scale: [0.18, 3, 4.6] },
    { position: [-2.34, 2, 2.3], scale: [1.12, 3, 0.18] },
    { position: [-0.515, 2, 2.3], scale: [0.33, 3, 0.18] },
    { position: [2.675, 2, 2.3], scale: [0.45, 3, 0.18] },
    { position: [-1.23, 3.175, 2.3], scale: [1.1, 0.65, 0.18] },
    { position: [1.05, 0.75, 2.3], scale: [2.8, 0.5, 0.18] },
    { position: [1.05, 3.175, 2.3], scale: [2.8, 0.65, 0.18] },
    { position: [2.9, 2, -1.3], scale: [0.18, 3, 2] },
    { position: [2.9, 2, 1.925], scale: [0.18, 3, 0.75] },
    { position: [2.9, 0.75, 0.625], scale: [0.18, 0.5, 1.85] },
    { position: [2.9, 3.175, 0.625], scale: [0.18, 0.65, 1.85] },
  ]);

  const gableGeometry = new THREE.BufferGeometry();
  gableGeometry.setAttribute("position", new THREE.Float32BufferAttribute([
    -2.9, 0, 0,
    2.9, 0, 0,
    0, 1.84, 0,
  ], 3));
  gableGeometry.setIndex([0, 1, 2]);
  gableGeometry.computeVertexNormals();
  const gableMaterial = materials.cladding.clone();
  gableMaterial.side = THREE.DoubleSide;
  const gables = new THREE.InstancedMesh(gableGeometry, gableMaterial, 2);
  gables.name = "CLADDING_GABLES";
  gables.castShadow = true;
  gables.receiveShadow = true;
  [-2.31, 2.31].forEach((z, index) => {
    dummy.position.set(0, 3.5, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    gables.setMatrixAt(index, dummy.matrix);
  });
  gables.instanceMatrix.needsUpdate = true;
  shell.add(gables);

  const frontBattenX = [-2.72, -2.3, -1.88, -0.61, 2.57, 2.82];
  const rightBattenZ = [-2.08, -1.58, -1.08, -0.46, 1.7, 2.1];
  addInstances("CLADDING_BATTENS", shell, materials.batten, [
    ...frontBattenX.map((x) => ({ position: [x, 2, 2.405], scale: [0.045, 3, 0.04] })),
    ...rightBattenZ.map((z) => ({ position: [3.005, 2, z], scale: [0.04, 3, 0.045] })),
  ]);

  const frameParts = [
    ...[-2.82, 2.82].flatMap((x) => [-2.22, 2.22].map((z) => ({
      position: [x, 2, z], scale: [0.2, 3.18, 0.2],
    }))),
    ...[-1.78, -0.68, -0.35, 2.45].map((x) => ({
      position: [x, 2, 2.42], scale: [0.14, 3, 0.18],
    })),
    { position: [0, 3.5, 2.31], scale: [5.9, 0.2, 0.22] },
    { position: [0, 3.5, -2.31], scale: [5.9, 0.2, 0.22] },
    { position: [-2.91, 3.5, 0], scale: [0.22, 0.2, 4.65] },
    { position: [2.91, 3.5, 0], scale: [0.22, 0.2, 4.65] },
    { position: [0, 0.57, 2.39], scale: [5.75, 0.18, 0.2] },
    { position: [-1.23, 2.88, 2.42], scale: [1.24, 0.16, 0.2] },
    { position: [1.05, 1, 2.42], scale: [2.9, 0.16, 0.2] },
    { position: [1.05, 2.86, 2.42], scale: [2.9, 0.16, 0.2] },
    { position: [1.65, 4.315, 2.4], scale: [3.88, 0.17, 0.2], rotation: [0, 0, -32 * DEG2RAD] },
    { position: [-1.65, 4.315, 2.4], scale: [3.88, 0.17, 0.2], rotation: [0, 0, 32 * DEG2RAD] },
    { position: [0, 5.34, 0], scale: [0.2, 0.24, 5.15] },
    ...[-2.55, 2.55].flatMap((x) => [
      { position: [x, 1.28, 3.42], scale: [0.15, 1.48, 0.15] },
      { position: [x, 1.52, 2.98], scale: [0.12, 0.12, 1.36] },
      { position: [x, 0.86, 2.98], scale: [0.12, 0.12, 1.36] },
      ...[2.6, 3.02, 3.4].map((z) => ({
        position: [x, 1.19, z], scale: [0.1, 0.66, 0.1],
      })),
    ]),
  ];
  addInstances("STRUCTURAL_TIMBER_FRAME", shell, materials.timber, frameParts);

  const roofPitch = 32 * DEG2RAD;
  addInstances("PITCHED_METAL_ROOF", shell, materials.roof, [
    { position: [1.65, 4.315, 0], scale: [3.92, 0.18, 5.35], rotation: [0, 0, -roofPitch] },
    { position: [-1.65, 4.315, 0], scale: [3.92, 0.18, 5.35], rotation: [0, 0, roofPitch] },
  ]);

  addInstances("ROOF_STANDING_SEAMS", shell, materials.batten,
    [-2.38, -1.58, -0.79, 0, 0.79, 1.58, 2.38].flatMap((z) => [
      { position: [1.66, 4.395, z], scale: [3.92, 0.045, 0.045], rotation: [0, 0, -roofPitch] },
      { position: [-1.66, 4.395, z], scale: [3.92, 0.045, 0.045], rotation: [0, 0, roofPitch] },
    ]));

  addInstances("CHIMNEY_MASONRY", shell, materials.chimney, [
    { position: [1.52, 5.03, -0.82], scale: [0.62, 1.55, 0.66] },
    { position: [1.52, 5.83, -0.82], scale: [0.77, 0.16, 0.81] },
  ]);

  // Porch boards run toward the facade; one instance set keeps the repeated detail cheap.
  addInstances("PORCH_DECK_BOARDS", porch, materials.deck,
    Array.from({ length: 27 }, (_, index) => ({
      position: [-2.6 + index * 0.2, 0.61, 2.98],
      scale: [0.185, 0.1, 1.46],
    })));

  addInstances("ENTRY_STAIRS", porch, materials.deck, [
    { position: [-1.23, 0.49, 3.78], scale: [1.5, 0.16, 0.48] },
    { position: [-1.23, 0.31, 4.18], scale: [1.5, 0.16, 0.48] },
    { position: [-1.23, 0.1, 4.58], scale: [1.5, 0.16, 0.48] },
  ]);

  addInstances("WINDOW_GLAZING", shell, materials.glass, [
    { position: [1.05, 1.925, 2.425], scale: [2.72, 1.78, 0.035] },
    { position: [3.025, 1.925, 0.625], scale: [0.035, 1.78, 1.77] },
  ], { castShadow: false, receiveShadow: false });

  addInstances("WINDOW_MULLIONS", shell, materials.timber, [
    { position: [1.05, 1.925, 2.455], scale: [0.075, 1.85, 0.075] },
    { position: [1.05, 1.925, 2.455], scale: [2.8, 0.075, 0.075] },
    { position: [3.055, 1.925, 0.625], scale: [0.075, 1.85, 0.075] },
    { position: [3.055, 1.925, 0.625], scale: [0.075, 0.075, 1.85] },
  ]);

  // Recessed interior surfaces and furniture remain visibly behind the glazing.
  addInstances("INTERIOR_ROOM_SHELL", interior, materials.interior, [
    { position: [1.05, 1.88, 0.55], scale: [2.65, 2.28, 0.08] },
    { position: [1.05, 0.59, 1.45], scale: [2.65, 0.08, 1.82] },
    { position: [-0.31, 1.88, 1.45], scale: [0.08, 2.28, 1.82] },
  ]);

  addInstances("INTERIOR_TABLE_AND_BENCH", interior, materials.interiorWood, [
    { position: [1.1, 1.15, 1.25], scale: [1.3, 0.12, 0.58] },
    { position: [0.58, 0.85, 1.05], scale: [0.1, 0.58, 0.1] },
    { position: [1.62, 0.85, 1.05], scale: [0.1, 0.58, 0.1] },
    { position: [0.58, 0.85, 1.45], scale: [0.1, 0.58, 0.1] },
    { position: [1.62, 0.85, 1.45], scale: [0.1, 0.58, 0.1] },
    { position: [2.08, 0.95, 0.72], scale: [0.55, 0.72, 0.42] },
  ]);

  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), materials.lamp);
  lamp.name = "INTERIOR_PENDANT_LAMP";
  lamp.position.set(1.05, 2.45, 1.02);
  interior.add(lamp);
  addBox("PENDANT_CORD", interior, materials.metal, [1.05, 2.82, 1.02], [0.025, 0.62, 0.025]);

  const warmLight = new THREE.PointLight(0xffa454, 18, 5.5, 2);
  warmLight.name = "INTERIOR_WARM_LIGHT";
  warmLight.position.set(1.05, 2.35, 1.1);
  interior.add(warmLight);

  // Door children use hinge-local coordinates; the slab never detaches from the jamb.
  const doorPivot = new THREE.Group();
  doorPivot.name = "ENTRY_DOOR_HINGE";
  doorPivot.position.set(-1.74, 0.59, 2.445);
  doorPivot.userData.closedAngleRadians = 0;
  doorPivot.userData.openAngleRadians = -52 * DEG2RAD;
  porch.add(doorPivot);

  addBox("ENTRY_DOOR_SLAB", doorPivot, materials.door, [0.51, 1.12, 0], [1.02, 2.24, 0.12]);
  addInstances("ENTRY_DOOR_VERTICAL_BOARDS", doorPivot, materials.timber,
    [0.08, 0.3, 0.52, 0.74, 0.96].map((x) => ({
      position: [x, 1.12, 0.072], scale: [0.035, 2.14, 0.025],
    })));

  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), materials.metal);
  handle.name = "ENTRY_DOOR_HANDLE";
  handle.position.set(0.88, 1.12, 0.11);
  doorPivot.add(handle);

  let doorPhase = 0;
  const maxDoorAngle = doorPivot.userData.openAngleRadians;

  function reset() {
    doorPhase = 0;
    doorPivot.rotation.y = 0;
  }

  function update(deltaSeconds, _elapsedSeconds, motionEnabled) {
    if (!motionEnabled) {
      reset();
      return;
    }

    const safeDelta = THREE.MathUtils.clamp(deltaSeconds, 0, 0.1);
    doorPhase = (doorPhase + safeDelta * 0.52) % (Math.PI * 2);
    const openAmount = 0.5 - 0.5 * Math.cos(doorPhase);
    doorPivot.rotation.y = maxDoorAngle * openAmount;
  }

  reset();
  return { root, update, reset };
}

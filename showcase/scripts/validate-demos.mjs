import { readFile, readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

const demoDirectory = path.resolve("src/demos");
const files = (await readdir(demoDirectory))
  .filter((file) => file.endsWith(".js"))
  .sort();

if (files.length === 0) {
  console.log("No demo modules found.");
  process.exit(0);
}

const failures = [];
const results = [];
const ids = new Set();
const polishedLanes = new Set(["polished-stylized", "reference-faithful", "photoreal-hero"]);
const requiredEvidenceViews = ["hero", "orbitA", "orbitB", "neutralMaterial", "subjectProof"];

function fail(file, message) {
  failures.push(`${file}: ${message}`);
}

function finiteVector(value) {
  return Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
}

function normalizedDot(left, right) {
  const leftLength = Math.hypot(...left);
  const rightLength = Math.hypot(...right);
  if (leftLength === 0 || rightLength === 0) return 1;
  return left.reduce((sum, value, index) => sum + value * right[index], 0) / (leftLength * rightLength);
}

for (const file of files) {
  const absolutePath = path.join(demoDirectory, file);
  const source = await readFile(absolutePath, "utf8");
  let module;

  try {
    module = await import(`${pathToFileURL(absolutePath).href}?validate=${Date.now()}`);
  } catch (error) {
    fail(file, `cannot import (${error.message})`);
    continue;
  }

  const { meta, createDemo } = module;
  if (!meta || typeof meta !== "object") {
    fail(file, "missing meta export");
    continue;
  }
  if (!meta.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.id)) fail(file, "meta.id must be kebab-case");
  if (ids.has(meta.id)) fail(file, `duplicate id ${meta.id}`);
  ids.add(meta.id);
  for (const field of ["title", "category", "description"]) {
    if (typeof meta[field] !== "string" || meta[field].trim() === "") fail(file, `meta.${field} is required`);
  }
  if (typeof createDemo !== "function") {
    fail(file, "missing createDemo export");
    continue;
  }
  if (/\bMath\.random\s*\(/.test(source)) fail(file, "uses non-deterministic Math.random()");
  if (/\b(?:document|window)\s*\./.test(source)) fail(file, "must not access the DOM");
  if (/['"`]https?:\/\//.test(source) || /['"`]\/\//.test(source)) {
    fail(file, "must not reference remote runtime assets");
  }

  const isPolished = polishedLanes.has(meta.fidelityLane);
  if (meta.fidelityLane && !["blockout", ...polishedLanes].includes(meta.fidelityLane)) {
    fail(file, "meta.fidelityLane is not supported");
  }
  if (isPolished) {
    if (!Array.isArray(meta.identityFeatures) || meta.identityFeatures.length < 5) {
      fail(file, "polished demos require at least 5 meta.identityFeatures");
    }
    for (const viewName of requiredEvidenceViews) {
      const view = meta.evidenceViews?.[viewName];
      if (!view || !finiteVector(view.cameraDirection)) {
        fail(file, `polished demos require a finite meta.evidenceViews.${viewName}.cameraDirection`);
      }
    }
    const primaryDirections = ["hero", "orbitA", "orbitB"]
      .map((name) => meta.evidenceViews?.[name]?.cameraDirection)
      .filter(finiteVector);
    for (let left = 0; left < primaryDirections.length; left += 1) {
      for (let right = left + 1; right < primaryDirections.length; right += 1) {
        if (normalizedDot(primaryDirections[left], primaryDirections[right]) > 0.94) {
          fail(file, "hero, orbitA, and orbitB camera directions must be visibly distinct");
        }
      }
    }
  }

  const presentation = meta.presentation ?? {};
  if (presentation.cameraDirection && !finiteVector(presentation.cameraDirection)) {
    fail(file, "meta.presentation.cameraDirection must contain 3 finite numbers");
  }
  if (presentation.target && !finiteVector(presentation.target)) {
    fail(file, "meta.presentation.target must contain 3 finite numbers");
  }
  for (const [field, minimum, maximum] of [
    ["fov", 18, 75],
    ["screenCoverage", 0.25, 0.94],
    ["exposure", 0.1, 4],
    ["fogDensity", 0, 0.2],
  ]) {
    const value = presentation[field];
    if (value !== undefined && (!Number.isFinite(value) || value < minimum || value > maximum)) {
      fail(file, `meta.presentation.${field} must be from ${minimum} to ${maximum}`);
    }
  }

  let demo;
  try {
    demo = await createDemo();
  } catch (error) {
    fail(file, `createDemo failed (${error.message})`);
    continue;
  }
  if (!demo?.root?.isObject3D) {
    fail(file, "createDemo() did not return a Three.js root");
    continue;
  }

  let triangles = 0;
  let drawableObjects = 0;
  let unnamedObjects = 0;
  demo.root.traverse((object) => {
    if (!object.name) unnamedObjects += 1;
    if (!object.geometry) return;
    drawableObjects += Array.isArray(object.material) ? object.material.length : 1;
    const positionCount = object.geometry.attributes.position?.count ?? 0;
    const faceCount = (object.geometry.index?.count ?? positionCount) / 3;
    triangles += faceCount * (object.isInstancedMesh ? object.count : 1);
  });

  try {
    demo.update?.(1 / 60, 0, false);
    demo.update?.(1 / 60, 1, true);
    demo.reset?.();
  } catch (error) {
    fail(file, `animation contract failed (${error.message})`);
  }

  const triangleBudget = meta.budgets?.triangles ?? 80_000;
  const drawBudget = meta.budgets?.drawCalls ?? 45;
  if (!Number.isFinite(triangleBudget) || triangleBudget <= 0) fail(file, "meta.budgets.triangles must be positive");
  if (!Number.isFinite(drawBudget) || drawBudget <= 0) fail(file, "meta.budgets.drawCalls must be positive");
  if (triangles > triangleBudget) {
    fail(file, `triangle estimate ${Math.round(triangles)} exceeds ${triangleBudget}`);
  }
  if (drawableObjects > drawBudget) {
    fail(file, `drawable estimate ${drawableObjects} exceeds ${drawBudget}`);
  }
  if (demo.root.children.length === 0) fail(file, "root has no visible hierarchy");

  results.push({
    id: meta.id,
    triangles: Math.round(triangles),
    drawables: drawableObjects,
    objects: unnamedObjects + demo.root.children.length,
    unnamed: unnamedObjects,
    triangleBudget,
    drawBudget,
    profile: isPolished ? meta.fidelityLane : "legacy-blockout",
  });
  demo.dispose?.();
}

console.table(results);
if (failures.length > 0) {
  console.error("\nDemo validation failed:");
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`Validated ${results.length} demo module${results.length === 1 ? "" : "s"}.`);

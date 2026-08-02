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

function fail(file, message) {
  failures.push(`${file}: ${message}`);
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
  if (/\bfetch\s*\(/.test(source)) fail(file, "must not fetch runtime assets");

  let demo;
  try {
    demo = createDemo();
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

  if (triangles > 80_000) fail(file, `triangle estimate ${Math.round(triangles)} exceeds 80000`);
  if (drawableObjects > 45) fail(file, `drawable estimate ${drawableObjects} exceeds 45`);
  if (demo.root.children.length === 0) fail(file, "root has no visible hierarchy");

  results.push({
    id: meta.id,
    triangles: Math.round(triangles),
    drawables: drawableObjects,
    objects: unnamedObjects + demo.root.children.length,
    unnamed: unnamedObjects,
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

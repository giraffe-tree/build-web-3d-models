#!/usr/bin/env node
/**
 * capture_views.mjs — deterministic view capture for Web 3D visual evidence.
 *
 * Renders a fixed set of named views of a Three.js-style page and emits the
 * per-view PNGs plus an evidence-fragment JSON whose entries carry the fields
 * that validate_visual_evidence.py binds to bytes (path, sha256,
 * semanticState, fixedTimeSeconds, cameraDirection, uiMode).
 *
 * Page contract (mirrors the ?capture=1 modes in quality-forward-tests):
 *   - The page reads ?capture=1 and disables UI, orbit controls, and any
 *     non-deterministic animation state.
 *   - &view=<name> selects a named camera preset; &time=<seconds> freezes the
 *     animation clock at a fixed time.
 *   - The page sets a ready flag once the frame is stable. Probed globals, in
 *     order: window.__CAPTURE_READY__, window.__CHAIR_READY__,
 *     window.__GINKGO_READY__ (override with --ready-flag).
 *   - The page may expose an evidence object with semanticState,
 *     fixedTimeSeconds, viewport, and camera {position, target}. Probed
 *     globals: __CAPTURE_EVIDENCE__, __CHAIR_EVIDENCE__, __GINKGO_METRICS__
 *     (override with --evidence-global).
 *
 * Determinism: fixed viewport, fixed DPR (default 1), fixed time, capture mode
 * without UI, PNG output. Hashes are stable for the same browser build and GPU
 * stack; cross-machine drift is possible, so treat each hash as an integrity
 * binding for the machine that produced it, not a universal constant.
 *
 * Requires playwright (Chromium). If it is missing:
 *   npm install playwright && npx playwright install chromium
 * A global install also works when resolved explicitly, e.g.
 *   NODE_PATH=$(npm root -g) node scripts/capture_views.mjs ...
 *
 * Usage:
 *   node scripts/capture_views.mjs --url http://localhost:5173 \
 *     --views hero,orbitA,orbitB,neutralMaterial,subjectProof \
 *     --out-dir evidence/views --fragment evidence/view-fragment.json \
 *     [--width 1280] [--height 720] [--dpr 1] [--time 2.4] \
 *     [--ready-flag __CAPTURE_READY__] [--timeout-ms 30000]
 *   node scripts/capture_views.mjs --self-test
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';

const DEFAULT_READY_FLAGS = ['__CAPTURE_READY__', '__CHAIR_READY__', '__GINKGO_READY__'];
const DEFAULT_EVIDENCE_GLOBALS = ['__CAPTURE_EVIDENCE__', '__CHAIR_EVIDENCE__', '__GINKGO_METRICS__'];

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try {
    return require('playwright');
  } catch {
    return null;
  }
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function buildCaptureUrl(base, view, time) {
  if (base.startsWith('data:')) return base;
  const url = new URL(base);
  url.searchParams.set('capture', '1');
  url.searchParams.set('view', view);
  if (time !== null && time !== undefined) url.searchParams.set('time', String(time));
  return url.toString();
}

function normalizeDirection(from, to) {
  if (!Array.isArray(from) || !Array.isArray(to) || from.length !== 3 || to.length !== 3) return null;
  const delta = to.map((value, index) => value - from[index]);
  const length = Math.hypot(...delta);
  if (!Number.isFinite(length) || length === 0) return null;
  return delta.map((value) => Number((value / length).toFixed(6)));
}

async function captureView(page, { baseUrl, view, time, readyFlags, evidenceGlobals, timeoutMs, outPath }) {
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(String(error)));

  await page.goto(buildCaptureUrl(baseUrl, view, time), { waitUntil: 'load', timeout: timeoutMs });
  await page.waitForFunction(
    (flags) => flags.some((flag) => window[flag] === true),
    readyFlags,
    { timeout: timeoutMs },
  );
  const evidence = await page.evaluate((globals) => {
    for (const name of globals) {
      if (window[name] && typeof window[name] === 'object') return { global: name, value: window[name] };
    }
    return null;
  }, evidenceGlobals);
  await page.screenshot({ path: outPath, type: 'png', animations: 'disabled', caret: 'hide' });
  return { evidence, consoleErrors };
}

function selfTestPageHtml() {
  return `<!doctype html><html><body style="margin:0">
<canvas id="c" style="display:block"></canvas>
<script>
  const canvas = document.querySelector('#c');
  canvas.width = innerWidth; canvas.height = innerHeight;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#20242a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 ? '#c8b48a' : '#5a7a96';
    ctx.fillRect(40 + i * 36, 120 + (i % 3) * 30, 28, 28);
  }
  let frames = 0;
  function tick() {
    frames += 1;
    if (frames >= 3) {
      window.__CAPTURE_READY__ = true;
      window.__CAPTURE_EVIDENCE__ = {
        semanticState: 'rest', fixedTimeSeconds: 0,
        viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      };
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
</script></body></html>`;
}

async function main() {
  const { values } = parseArgs({
    options: {
      url: { type: 'string' },
      views: { type: 'string' },
      'out-dir': { type: 'string', default: 'evidence/views' },
      fragment: { type: 'string', default: 'evidence/view-fragment.json' },
      width: { type: 'string', default: '1280' },
      height: { type: 'string', default: '720' },
      dpr: { type: 'string', default: '1' },
      time: { type: 'string' },
      'ready-flag': { type: 'string' },
      'evidence-global': { type: 'string' },
      'timeout-ms': { type: 'string', default: '30000' },
      'chromium-path': { type: 'string' },
      'self-test': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });

  if (values.help) {
    const header = readFileSync(new URL(import.meta.url), 'utf8').match(/\/\*\*([\s\S]*?)\*\//)[1];
    console.log(header.replace(/^ \* ?/gm, '').trim());
    return;
  }

  const selfTest = values['self-test'];
  const baseUrl = selfTest ? `data:text/html,${encodeURIComponent(selfTestPageHtml())}` : values.url;
  const views = selfTest
    ? ['hero']
    : (values.views || '').split(',').map((name) => name.trim()).filter(Boolean);
  if (!baseUrl) {
    console.error('error: --url is required (or run --self-test)');
    process.exit(2);
  }
  if (views.length === 0) {
    console.error('error: --views must list at least one view name');
    process.exit(2);
  }

  const playwright = loadPlaywright();
  if (!playwright) {
    console.error('error: playwright is not installed.');
    console.error('  install: npm install playwright && npx playwright install chromium');
    console.error('  or resolve a global install: NODE_PATH=$(npm root -g) node scripts/capture_views.mjs ...');
    process.exit(2);
  }

  const width = Number(values.width);
  const height = Number(values.height);
  const dpr = Number(values.dpr);
  const time = values.time === undefined ? null : Number(values.time);
  const timeoutMs = Number(values['timeout-ms']);
  const readyFlags = values['ready-flag'] ? [values['ready-flag']] : DEFAULT_READY_FLAGS;
  const evidenceGlobals = values['evidence-global'] ? [values['evidence-global']] : DEFAULT_EVIDENCE_GLOBALS;
  if (![width, height, dpr, timeoutMs].every(Number.isFinite) || (time !== null && !Number.isFinite(time))) {
    console.error('error: --width/--height/--dpr/--time/--timeout-ms must be finite numbers');
    process.exit(2);
  }

  const outDir = resolve(selfTest ? '/tmp/capture-views-self-test/views' : values['out-dir']);
  const fragmentPath = resolve(selfTest ? '/tmp/capture-views-self-test/view-fragment.json' : values.fragment);
  mkdirSync(outDir, { recursive: true });
  mkdirSync(dirname(fragmentPath), { recursive: true });

  let browser;
  try {
    browser = await playwright.chromium.launch({
      headless: true,
      ...(values['chromium-path'] ? { executablePath: values['chromium-path'] } : {}),
    });
  } catch (error) {
    console.error(`error: failed to launch Chromium: ${error.message}`);
    console.error('  install the browser build with: npx playwright install chromium');
    process.exit(2);
  }

  try {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: dpr,
    });
    const fragment = existsSync(fragmentPath)
      ? JSON.parse(readFileSync(fragmentPath, 'utf8'))
      : { generatedBy: 'capture_views.mjs', views: {} };
    fragment.generatedBy = 'capture_views.mjs';
    fragment.url = selfTest ? '<self-test>' : baseUrl;
    fragment.viewport = { width, height, dpr };
    fragment.views = fragment.views && typeof fragment.views === 'object' ? fragment.views : {};
    fragment.consoleErrors = 0;

    for (const view of views) {
      const page = await context.newPage();
      const outPath = resolve(outDir, `${view}.png`);
      let result;
      try {
        result = await captureView(page, {
          baseUrl, view, time, readyFlags, evidenceGlobals, timeoutMs, outPath,
        });
      } catch (error) {
        console.error(`error: capture failed for view "${view}": ${error.message}`);
        process.exitCode = 1;
        await page.close();
        continue;
      }
      await page.close();

      const evidenceValue = result.evidence?.value || {};
      const cameraDirection = normalizeDirection(
        evidenceValue.camera?.position,
        evidenceValue.camera?.target,
      );
      fragment.views[view] = {
        path: relative(dirname(fragmentPath), outPath),
        sha256: sha256File(outPath),
        semanticState: evidenceValue.semanticState || 'rest',
        fixedTimeSeconds: Number.isFinite(evidenceValue.fixedTimeSeconds)
          ? evidenceValue.fixedTimeSeconds
          : (time ?? 0),
        uiMode: 'review',
        cameraDirection,
        width,
        height,
      };
      fragment.consoleErrors += result.consoleErrors.length;
      console.log(
        `CAPTURE ${view} -> ${relative(process.cwd(), outPath)}` +
        ` sha256=${fragment.views[view].sha256.slice(0, 16)}...` +
        (cameraDirection ? '' : ' (cameraDirection unknown: fill before manifest validation)') +
        (result.consoleErrors.length ? ` consoleErrors=${result.consoleErrors.length}` : ''),
      );
    }

    fragment.note = 'Evidence fragment only; merge fragment.views into the manifest views object. ' +
      'Entries with cameraDirection null must be filled from the page camera presets.';
    writeFileSync(fragmentPath, `${JSON.stringify(fragment, null, 2)}\n`);
    console.log(`WROTE ${relative(process.cwd(), fragmentPath)}`);

    if (selfTest) {
      const entry = fragment.views.hero;
      const ok = entry && /^[0-9a-f]{64}$/.test(entry.sha256) && existsSync(resolve(outDir, 'hero.png'));
      console.log(ok ? 'SELF-TEST PASS' : 'SELF-TEST FAIL');
      process.exitCode = ok ? (process.exitCode || 0) : 1;
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exit(1);
});

# Run and verification results

## Local run

```bash
cd /Users/giraffetree/Documents/giraffetree/project/ai/build-web-3d-models/quality-forward-tests/ginkgo-v2
npm install
npm run dev -- --port 4317
```

Open `http://127.0.0.1:4317/`. Fixed evidence views use `?view=hero|orbitA|orbitB|neutralMaterial|subjectProof&time=2.4`; add `capture=1` to hide the page UI.

## Build

- `npm run build`: passed with Vite 7.0.6.
- Production JS: 551.28 kB minified / 142.63 kB gzip.
- Production CSS: 3.90 kB minified / 1.61 kB gzip.
- Bundle is within the 900 KiB gzip asset brief budget.

## Browser/runtime

- Actual page loaded to `Ginkgo showcase ready` in the in-app browser.
- Final cold page sample reached its rendered ready gate in 1,339.3 ms, within the 2.5 s local target.
- Browser renderer: WebGL2; fixed evidence viewport 1440 × 900 CSS px at DPR 1.5.
- Console: 0 errors, 0 warnings across fixed view reloads and visible control exercise.
- Resize: 1024 × 768 rendered a matching 1024 × 768 canvas with no horizontal overflow.
- Visible wind control was clicked through pause and resume; its pressed state, label, semantic mode, and rendered loop state agreed.
- Visible `Orbit B` control was clicked; `aria-pressed=true` and runtime view `orbitB` agreed.
- Deterministic budgets pass: 269,792 model triangles, 20,196 unique geometry vertices, 301,888 hero frame triangles, 38 frame draw calls, 7 material families, and 2 generated textures.
- Device frame timing is recorded as diagnostic only in `runtime/performance.json`.

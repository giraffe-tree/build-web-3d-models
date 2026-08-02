# Run VELA / 01

From this directory:

```bash
npm install
npm run dev -- --port 4177
```

Open `http://127.0.0.1:4177/?view=hero`.

Fixed URLs:

- `?view=hero`
- `?view=orbitA`
- `?view=orbitB`
- `?view=neutralMaterial`
- `?view=subjectProof`

Append `&capture=1` to any fixed-view URL to hide page chrome and disable orbit controls for deterministic asset-review evidence, for example `?view=orbitB&capture=1`.

Keyboard shortcuts `1`–`5` select the same views. Drag to orbit and use the wheel/trackpad to inspect. To rebuild the Blender source and runtime GLB:

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --python blender/build_chair.py
```

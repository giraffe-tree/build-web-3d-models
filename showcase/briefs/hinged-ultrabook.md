# Hinged ultrabook forward-test brief

## Purpose and viewing

- Purpose: a deterministic procedural hero prop that proves a rigid, multi-part product can open and close around a mechanically credible hinge axis.
- Typical view: elevated front-right three-quarter view, with the base, keyboard, trackpad, screen, and hinge visible together.
- Endpoint review views: open three-quarter, closed side, closed front, and a grazing rear-hinge view.
- Scale: coherent laptop-relative units, approximately 3.30 wide by 2.16 deep, with a 0.14 base shell and a 0.08 display shell.
- Grounding: four rubber feet place the base just above `y = 0`; the lowest contact is near `y = 0.005`.

## Observed requirements

- Use only the installed `three` package and export the showcase `meta` object plus `createDemo()`.
- Make a premium hinged ultrabook recognizable from silhouette and real volume.
- The display must visibly open and close about a physically placed hinge.
- Generation and motion must be deterministic; motion is controlled only by `motionEnabled`.
- Keep the subject centered, use semantic names and an explicit attachment hierarchy, and stay below 80,000 rendered triangles and 45 draw calls.
- Do not create runtime assets, a renderer, camera, controls, DOM, or post-processing.

## Inferences and construction choices

- The product is a generic unbranded 14-inch-class ultrabook rather than a reconstruction of a particular commercial model.
- The stationary base footprint is 3.30 by 2.16. Its hinge axis runs along X at `[0, 0.202, -1.03]`, slightly above the rear deck and inside the base silhouette.
- The moving lid is authored upright in hinge-local coordinates. Its bottom edge begins 0.04 above the axis and the complete assembly rotates as one unit.
- Semantic open angle is measured from the closed deck: 0 degrees is closed and 110 degrees is the fully open working pose. The lid transform is therefore `rotation.x = 90 degrees - openAngle`.
- At 0 degrees, the lid reaches from the rear hinge to just short of the front edge. The screen/glass face sits above the key tops, preserving a small closed-state clearance instead of intersecting them.
- A cool silver shell, dark inset deck, black key field, low-contrast speaker strips, rubber feet, emissive display, and restrained cyan screen graphics provide premium material separation without textures.
- Rounded extrusions are reserved for silhouette-bearing shells and panels. Repeated keys and speaker bars use shared instanced box geometry.

## Hierarchy

```text
HINGED_ULTRABOOK_ROOT
|- BASE
|  |- BASE_SHELL
|  |- DECK_INSET
|  |- KEYBOARD (instanced keys)
|  |- TRACKPAD
|  |- SPEAKER_GRILLES (instanced bars)
|  `- RUBBER_FEET (instanced feet)
|- HINGE
|  `- STATIONARY_HINGE_BARREL
`- MOVING_LID_ASSEMBLY (pivot at physical hinge axis)
   |- MOVING_HINGE_COLLARS
   `- DISPLAY_LID
      |- DISPLAY_SHELL
      |- DISPLAY_GASKET
      |- DISPLAY_GLASS
      `- SCREEN_GRAPHICS
```

All display-dependent parts live below `MOVING_LID_ASSEMBLY`; no child is animated in world space.

## Motion and reset

- `update(deltaSeconds, elapsedSeconds, motionEnabled)` advances an internal phase only while motion is enabled.
- A cosine wave cycles continuously and smoothly between 0 and 110 degrees, producing legible closed, intermediate, and open states with zero endpoint velocity.
- Disabling motion freezes the exact current transform. `reset()` returns the model to the fully open 110-degree pose.
- No randomness, wall-clock time, or accumulated `elapsedSeconds` is used.

## Target budget

- Rendered triangles: target below 15,000; hard ceiling 80,000.
- Draw calls: target below 24; hard ceiling 45.
- Materials: target 10 or fewer shared material instances.
- Textures and downloaded assets: zero.
- Shadow casters: primary shells, hinge, keys, trackpad, and feet; flat screen graphics do not need independent shadow detail.

## Omissions

- No logos, key legends, ports, webcam lens, underside fasteners, internal hinge cables, texture maps, reflections, or user input controls.
- The hinge communicates axis and attachment with a barrel and moving collars, but it is not a manufacturing-accurate clutch or torque model.
- The display uses simple emissive geometry rather than a canvas or image texture.

## Self-check

- Silhouette: base wedge, keyboard deck, wide trackpad, thin display, and rear hinge remain readable without labels.
- Closed endpoint: lid footprint lies over the base, its glass faces the deck, its outer cover reads as one continuous top shell, and the rear pivot remains inside the product envelope.
- Intermediate endpoint: every shell, bezel, glass, and screen graphic remains attached to the moving pivot with no world-space compensation.
- Open endpoint: 110-degree travel gives a conventional working angle without detachment at the hinge.
- Determinism: fixed primitive counts, fixed transforms, no random calls, and delta-driven phase that advances only when motion is enabled.
- Runtime contract: module imports only `three`; it creates no renderer, camera, controls, DOM, post-processing, or remote resource.

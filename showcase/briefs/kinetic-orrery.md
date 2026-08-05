# Kinetic Brass Orrery — asset brief

## Purpose, lane, and viewing

- Fidelity lane: `polished-stylized`; this is an original, reference-informed capability study rather than a reconstruction of a named historical instrument.
- Purpose: hero mechanism proving nested transform hierarchy, real pivot placement, visible gear transmission, small-scale PBR material separation, and deterministic Web motion.
- Typical view: full desk-scale instrument at three-quarter elevation; closest required view is the front drive train and lower gimbal bearing; silhouette distance must retain the three concentric rings and central solar system.
- Shared-runtime framing: 34° FOV, roughly 76% screen coverage, target at the ring center, with ground contact at `y = 0` and a total height near 2.5 relative units.
- Target: desktop and modern mobile WebGL2 at 45 FPS. No remote assets, textures, secondary renderer, DOM access, or post-processing.

## Observed requirements, interpretation, and omissions

- Observed requirements: a brass mechanical orrery, explicit parent-child hierarchy, concentric rings/gears/planet axes, credible connections, natural optional motion, deterministic generation, and a complete reset/dispose contract.
- Inference: because no historical make or reference set was supplied, the design combines familiar armillary-sphere construction with a legible desktop clockwork plinth. It should be judged as polished stylization, not archaeological accuracy.
- Inference: the three exposed spur gears are a visual transmission proof. Their ratios and alternating directions are mechanically legible, but hidden reduction stages between the output pinion and upper yaw shaft are intentionally abstracted by the hollow column.
- Omitted: tooth-profile involute accuracy, lubricator ports, engraved lettering, real ephemeris ratios, collision, gear backlash, texture maps, and scanned metal microdetail. These omissions keep the subject within the procedural Web study and asset-specific budget.
- Image input: `mode: none`. No generated or factual raster pixels are retained in the runtime.

## Identity-feature and proof mapping

| Identity cue | Construction / connection | Fixed proof view |
| --- | --- | --- |
| Turned observatory plinth and exposed three-gear train | Gears use named spur-gear journal bearings fixed to a recessed bridge window; their load path terminates in the weighted plinth | `subjectProof` |
| Outer meridian ring with degree ticks | Ring terminates at a lower spindle clamp and upper jewel cap; ticks are one shared instanced master | `hero` |
| Nested polar and ecliptic rings | Polar ring uses an opposed horizontal trunnion pair; the ecliptic deck uses a tilted coaxial spindle under that pivot | `orbitA` |
| Luminous central sun and halo | Sun and halo are children of the ecliptic spindle, with a separate non-shadowing local glow light | `neutralMaterial` |
| Four graduated orbital tracks | Each track is real torus volume centered on the solar spindle, not a screen-space line or label | `orbitB` |
| Counterweighted enamel planets and moon | Every planet owns a radial arm, journal hub, and counterweight; the moon is a child pin-bearing pivot on the third planet carrier | `hero` |

## Hierarchy, joint vocabulary, and motion

```text
KINETIC_ORRERY_ROOT
├── OBSERVATORY_PLINTH
│   ├── PRIMARY_DRIVE_GEAR (spur-gear journal bearing)
│   ├── BRIDGE_IDLER_GEAR (spur-gear journal bearing)
│   └── OUTPUT_PINION_GEAR (spur-gear journal bearing)
├── LOWER_YAW_BEARING (vertical thrust-and-journal bearing)
└── OUTER_MERIDIAN_YAW_PIVOT (vertical revolute spindle)
    └── POLAR_RING_TRUNNION_PIVOT (opposed horizontal trunnions)
        └── ECLIPTIC_COAXIAL_SPINDLE (tilted coaxial spindle)
            ├── CENTRAL_SUN_ASSEMBLY
            └── PLANET_*_JOURNAL_PIVOT
                └── MOON_ORBIT_PIVOT (third planet only)
```

The weighted plinth carries the front bridge and vertical drive column. The outer ring transfers its mass through the lower spindle clamp into the yaw bearing. Opposed side trunnions carry the polar ring, while the tilted central spindle carries the ecliptic deck, orbit tracks, sun, and planet arms. Every animated part is driven in its local attachment frame; no child is animated independently in world space.

With motion disabled, `reset()` restores one exact calibrated pose. With motion enabled, a clamped delta advances a bounded deterministic phase: the three gears counter-rotate at tooth-count ratios, the outer cage yaws slowly, the polar ring adds a small bearing excursion, the ecliptic spindle advances, planets orbit at graduated rates, and the moon moves only under its planet carrier. The motion is intentionally slow enough to preserve a premium instrument read rather than a toy-like spin.

## Material contract

| Material family | Physical interpretation | Runtime response / proof |
| --- | --- | --- |
| Bright and aged brass | Machined copper-zinc alloy with polished edges and darker handled surfaces | High metalness with 0.20–0.38 roughness separation; grazing highlights in `hero` and `neutralMaterial` |
| Patinated trim | Oxidized copper-rich decorative inlay, deliberately limited to thin structural accents | Lower metalness and higher roughness; isolated by neutral light in `neutralMaterial` |
| Black steel | Blued bearing housings, counterweights, and drive recess | High metalness, dark value, controlled roughness; construction read in `subjectProof` |
| Enamel planets | Fired opaque colored coatings on small metal spheres | Non-metal base plus clearcoat; color and highlight separation in `hero` / `orbitB` |
| Ivory inserts | Polished ceramic-like planet and moon surfaces | Non-metal, medium roughness, restrained clearcoat in `neutralMaterial` |

No micro-band close-up is claimed, so procedural constant-response materials are acceptable for this stylized study. A later material-critical or photoreal lane would require scaled roughness variation or scanned metal/ceramic PBR maps and a new exact-runtime evidence pass.

## Budget and representation rationale

- Triangle budget: 72,000. Rounded ring silhouettes, planet spheres, gear bevels, and the turned plinth receive topology because they carry close highlights; hidden internal reductions are omitted.
- Draw-call budget: 58. Repeated degree ticks and opposed trunnions are instanced; ring and mechanism nodes remain separate where hierarchy or material response must stay inspectable.
- Target frame rate: 45 FPS on desktop and modern mobile WebGL2 in the shared showcase. The local point light does not cast shadows.
- Texture memory: zero runtime textures. All detail is geometry plus shared Three.js PBR materials.
- Motion state: one phase scalar, three gear transforms, three gimbal transforms, four planet pivots, and one moon pivot; no per-vertex deformation or per-frame geometry rebuild.
- Pipeline rationale: deterministic procedural Three.js is appropriate because the identity comes from parametric rings, repeated tracks, explicit joints, and runtime motion. Escalate to Blender/hybrid only if a later target requires historically accurate tooth involutes, engraved plates, authored wear, or a photoreal micro-surface pass.

## Verification notes and completion boundary

- Module generation contains no unseeded variation, DOM code, network asset access, or renderer ownership.
- All visible mechanism groups and drawables have semantic names; joint-bearing groups declare both joint type and load path through `userData`.
- Ground contact is provided by the rubber foot at `y = 0`; the ring assembly is centered near the origin and supported through a visible lower bearing.
- `update()` accepts invalid or large deltas safely, `reset()` restores the exact rest pose, and `dispose()` releases the only demo-owned GPU resource not covered by root traversal (the local point light).
- Required final checks after integration: run the demo validator and production build, inspect all five capture URLs, verify motion through the visible toggle, capture a deterministic multi-frame motion strip, and complete two fresh-eyes screenshot correction rounds before any `complete` claim.
- Current brief status at authoring handoff: implementation candidate. The polished-stylized lane remains `partial` until the shared integration process records and validates the required final visual evidence.

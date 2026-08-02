# Known Limitations

- The chair is presented in a fixed rest configuration. Arm height, seat height, tilt resistance, lumbar position, and gas-lift motion are modeled semantically but not exposed as animated controls.
- Caster steering and wheel rolling are not simulated; the five casters are authored in a coherent parked orientation.
- The suspension textile uses deterministic alpha/bump maps created at runtime rather than a scanned woven PBR texture. It is convincing at the declared 1.15 m closest orbit distance, but macro inspection below that distance will reveal the procedural repeat.
- The single real-time key shadow intentionally excludes the alpha-tested membrane and tiny tread rings. This avoids unstable fine shadow noise while retaining the primary contact and load-path shadow.
- FPS is diagnostic and depends on browser, thermal state, and GPU. Deterministic gates use GLB topology, frame submissions, current-view identity, viewport, load state, console state, and screenshot dimensions.

Next highest-value extension: expose a carefully constrained recline/seat-height mechanism with endpoint proof, keeping the default portfolio experience in the quiet rest state.

# Known limitations

- This is a generic, art-directed *Ginkgo biloba*, not a reconstruction of one photographed specimen.
- Fan leaves are deliberately enlarged to 18–26 cm in the hero asset so their identity survives a full-tree desktop view; the real 5–8 cm reference range is recorded in the asset brief.
- Structural wind is hierarchical and attachment-safe, but it uses restrained procedural bough rotations rather than a solved spring-damper simulation. It does not model leaf/branch collision.
- The leaf proof uses the same reusable geometry, generated vein texture, short-shoot, and petiole modules in an isolated diagnostic arrangement. Its even spacing is intentionally explanatory, not a claim about natural phyllotaxis.
- The tree has one near/hero representation. A forest, mobile view, or much greater orbit distance should add a clustered mid LOD, impostor, and simplified shadow proxy.
- Bark relief and leaf veins are generated colour/bump cues; they do not include authored scan-quality micro-displacement.
- Browser timing is diagnostic. VSync, tab state, GPU, and the in-app browser make frame timing unsuitable as a hard regression threshold.

Next highest-value improvement: author a second, broader mature crown architecture with fewer straight secondary uprights while retaining the present leaf/short-shoot runtime modules.

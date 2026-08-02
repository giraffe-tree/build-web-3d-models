# Quality forward tests

这两个测试用于验证质量优先版 skill 是否真的改善像素结果，而不只是生成更多文档或更复杂的页面。两者都由隔离子 agent 完成，再由不知道实现细节的独立 critic 只看原始请求和最终截图。

| Test | Pipeline | Builder | Blind critic | Status |
| --- | --- | ---: | ---: | --- |
| [VELA Chair v2](chair-v2/) | Blender → GLB → Three.js | 85 | **73** | partial |
| [Ginkgo v2](ginkgo-v2/) | Procedural Three.js | 78 | **56** | partial |

## Evidence contract

每个测试包含：

- 原始 asset brief 与 fidelity lane；
- 可运行 Three.js 源码和生产构建命令；
- `hero`、`orbitA`、`orbitB`、`neutralMaterial`、`subjectProof` 五张不同证据；
- 至少两轮最大缺陷 → 最高价值修复 → 结果记录；
- schema v2 `quality-evidence.json`，绑定最终 PNG 与 critic 实际查看文件的 SHA-256；
- builder 自评、独立盲评、性能/运行证据和明确 limitations。

`hero` 展示真实网页。其余视图使用无 UI capture 模式，以防版式质量掩盖资产缺陷。静态证据不会冒充交互或风动证明。

## Reproduce

```bash
# From repository root
python3 scripts/validate_visual_evidence.py quality-forward-tests/chair-v2/quality-evidence.json
python3 scripts/validate_visual_evidence.py quality-forward-tests/ginkgo-v2/quality-evidence.json

cd quality-forward-tests/chair-v2
npm install
npm run build
npm run dev -- --port 4321

cd ../ginkgo-v2
npm install
npm run check
npm run build
npm run dev -- --port 4317
```

## Why both remain partial

椅子已经建立稳定的原创产品身份和成熟网页包装，但近景仍暴露座底倾仰、背架、气柱、扶手和脚轮的装配/承力语义不足，静态图也没有证明实际 orbit。

银杏的扇叶与展示尺度明显改善，但 repeated shoot/pad 冠层、硬枝交叉、三角根、阴影块和跨视图材质分离仍像程序化中期资产；单一冻结时刻不能证明自然的层级风动。

保留这些失败不是妥协，而是流程要求：只要 critic 低于门槛，最终状态就必须是 `partial`。

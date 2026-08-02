# build-web-3d-models

面向 Web 的 3D 资产与场景构建 Codex skill：从 asset brief、尺度与观察距离开始，把建模、PBR、运动层级、Three.js 集成、性能预算和浏览器验收放在同一条工作流中。

[查看 skill](SKILL.md) · [查看 demo 契约](showcase/DEMO_CONTRACT.md) · [机器测试结果](docs/forward-test-results.json)

![Articulated architect lamp rendered in the shared Three.js showcase](docs/screenshots/articulated-lamp.jpg)

## 7 个独立子 agent forward tests

每个 demo 由独立子 agent 直接使用本仓库的 `SKILL.md` 生成。它们共享同一提示词模板、同一 Three.js 运行时和同一验收契约，只更换对象题目；每个 agent 只能写自己的一个模型模块和一份 asset brief，不能查看其他 demo 实现，也不能修改展示壳或提交 Git。

所有场景均为确定性程序化 Three.js 几何，不在运行时下载模型或贴图。表中数值来自 1280×720 真实 WebGL 页面，包含共享地面和阴影 pass；FPS 是本次机器采样值，不是跨设备承诺。

| Demo | 测试能力 | Tris | Draws | FPS | Console |
| --- | --- | ---: | ---: | ---: | ---: |
| Articulated Architect Lamp | 三关节层级、拉簧/连杆、灯头补偿 | 10,240 | 42 | 85 | 0 |
| Hinged Ultrabook | 物理铰轴、开合端点、完整盖板层级 | 4,616 | 25 | 108 | 0 |
| Ginkgo in a Light Wind | 层级枝干、233 片实例叶、父子风动 | 10,346 | 45 | 89 | 0 |
| Bioluminescent Mushroom Garden | 四种原型、聚簇散布、实例与发光材质 | 21,972 | 28 | 78 | 0 |
| Alpine River | 程序化地形、水道、岩石与针叶树实例 | 13,544 | 10 | 80 | 0 |
| Modular Forest Cabin | 模块化构造、真实洞口、室内纵深、门铰链 | 3,628 | 37 | 96 | 0 |
| Ergonomic Chair | 五星脚、双轮脚轮、网背、同步倾仰连杆 | 9,752 | 45 | 83 | 0 |

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/articulated-lamp.jpg" alt="Articulated architect lamp" />
      <br /><strong>01 · <a href="showcase/briefs/articulated-lamp.md">Articulated Architect Lamp</a></strong>
      <br />嵌套 shoulder / elbow / head pivots，张力连杆始终保持端点连接。
    </td>
    <td width="50%">
      <img src="docs/screenshots/hinged-ultrabook.jpg" alt="Hinged ultrabook" />
      <br /><strong>02 · <a href="showcase/briefs/hinged-ultrabook.md">Hinged Ultrabook</a></strong>
      <br />先验证关闭端点与机械轴，再让整个屏幕组件作为一个层级运动。
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/ginkgo-wind.jpg" alt="Procedural ginkgo tree" />
      <br /><strong>03 · <a href="showcase/briefs/ginkgo-wind.md">Ginkgo in a Light Wind</a></strong>
      <br />确定性树形、扇叶实例和随深度递增的结构风动。
    </td>
    <td width="50%">
      <img src="docs/screenshots/mushroom-garden.jpg" alt="Bioluminescent mushroom garden" />
      <br /><strong>04 · <a href="showcase/briefs/mushroom-garden.md">Bioluminescent Mushroom Garden</a></strong>
      <br />四种可辨识菌盖/菌柄原型，聚簇分布而非均匀随机撒点。
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/alpine-river.jpg" alt="Procedural alpine river valley" />
      <br /><strong>05 · <a href="showcase/briefs/alpine-river.md">Alpine River</a></strong>
      <br />分层山谷、曲流水道和低 draw-call 的环境实例。
    </td>
    <td width="50%">
      <img src="docs/screenshots/modular-cabin.jpg" alt="Modular forest cabin" />
      <br /><strong>06 · <a href="showcase/briefs/modular-cabin.md">Modular Forest Cabin</a></strong>
      <br />承重构件、板条立面、真实门窗洞口与可见室内纵深。
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <img src="docs/screenshots/ergonomic-chair.jpg" alt="Ergonomic office chair" />
      <br /><strong>07 · <a href="showcase/briefs/ergonomic-chair.md">Ergonomic Chair</a></strong>
      <br />从脚轮到气压杆、座面和网背的完整受力层级，以及可读的倾仰机构。
    </td>
  </tr>
</table>

## 运行展示站

```bash
git clone git@github.com:giraffe-tree/build-web-3d-models.git
cd build-web-3d-models/showcase
npm install
npm run dev -- --host 127.0.0.1 --port 4210
```

打开 [http://127.0.0.1:4210/](http://127.0.0.1:4210/)，拖动旋转、滚轮缩放，并可关闭 motion 检查确定性静止状态。

```bash
npm run test:demos
npm run build
```

`test:demos` 会实际导入并实例化所有模块，检查 API、确定性约束、DOM/远程资源违规、动画/reset 合约、三角形与可绘制对象预算。生产构建总输出为 649,239 bytes。

## 这轮测试证明了什么

- **先定义再建模**：7 个 agent 都先写了 purpose、viewing、尺度、预算、observed/inferred/omitted 项，再实现几何。
- **机制不是“看起来能动”**：台灯、电脑、木屋和椅子都把 pivot 放在真实连接轴上，并让依赖部件挂在同一语义层级中。
- **程序化不是随机堆叠**：银杏、蘑菇、河谷使用固定种子、聚簇或层级规则，重复拓扑使用 instancing。
- **预算包含真实 pass**：Node 静态检查后又读取浏览器 renderer 指标；椅子和台灯都因 shadow pass 放大而二次收敛，最终所有 demo 不超过 80,000 tris / 45 draws。
- **视觉 QA 仍然必要**：浏览器测试修复了只构建不报错却无法选择 demo 的 ES module 注册问题，并纠正了蘑菇 emissive 高光剪白。

## 已知边界

- 这些是 skill forward tests，不是带烘焙纹理、品牌细节或制造级结构的最终 hero assets；每份 brief 都列出了推断和省略项。
- 单页实验室使用 eager module discovery，当前主 JS 为 642,267 bytes；若作为生产图库发布，应改为按 demo 懒加载。
- 本轮浏览器 QA 覆盖桌面 1280×720；响应式样式已存在，但尚未完成独立移动端 GPU/触控回归。
- 银杏更偏结构与风动验证，冠幅密度较保守；蘑菇的发光是无 bloom 的 PBR/emissive 近似。

## 仓库结构

```text
SKILL.md                         skill 主流程
references/                     按需读取的领域工作手册
scripts/audit_gltf.py           glTF/GLB 可复现审计
showcase/DEMO_CONTRACT.md       子 agent demo 接口与预算
showcase/src/demos/             7 个独立 Three.js 模块
showcase/briefs/                对应 asset briefs 与限制
showcase/scripts/validate-demos.mjs
docs/forward-test-results.json  机器可读的浏览器结果
```

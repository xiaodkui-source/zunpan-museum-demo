# 曾侯乙尊盘数字展陈

一个可直接运行的 React + Vite + TypeScript 单页数字博物馆原型。页面包含沉浸式首屏、三维展陈与热点、文物概览、纹饰灯箱、铸造工艺、历史价值和完整的响应式/无障碍交互。

## 在浏览器中打开

需要 Node.js 18 或更高版本。首次运行：

```powershell
cd "C:\Users\xiaodk\Documents\Codex\2026-07-16\new-chat\outputs\zunpan-museum-demo"
npm install
npm run dev
```

终端显示 `Local: http://localhost:5173/` 后，在浏览器打开：

<http://localhost:5173/>

保持运行开发服务器的终端窗口开启。结束预览时，在该窗口按 `Ctrl + C`。

生产构建与本地预览：

```powershell
npm run build
npm run preview
```

默认预览地址通常为 <http://localhost:4173/>，以终端实际输出为准。

## 内容与资源替换

- 所有展陈文案、导航、文物参数、热点、相机视角、纹饰卡片、工艺步骤和页脚说明统一维护在 `src/data/artifact.ts`。
- 正式三维模型放在 `public/models/zunpan.glb`，运行时地址为 `/models/zunpan.glb`。
- 首屏海报替换 `public/images/zunpan-poster.svg`。
- 三张纹饰图替换 `public/images/ornaments/` 下的同名文件，或同步修改 `artifact.ts` 中的 `media` 路径。

正式 GLB 建议压缩后控制在 8–15 MB。导出前清理无用节点，合理合并网格与材质；发布链路支持时可使用 Draco 或 Meshopt 压缩几何，并使用 KTX2 压缩纹理。上线前必须在 glTF 查看器中检查模型原点、比例、朝向、材质和热点对应关系。

模型缺失、格式不正确或设备不支持 WebGL 时，网站会显示明确的静态数字结构示意，不会把占位模型冒充真实扫描模型。

### 调整热点与相机

在 `src/data/artifact.ts` 的 `hotspots` 数组中修改：

- `position: [x, y, z]`：热点在模型坐标系中的位置。
- `camera.position`：点击热点后相机所在位置。
- `camera.target`：相机注视点。
- `camera.fov`：视野角度。

全局初始镜头在 `model.defaultCamera`；模型整体位置、旋转和缩放在 `model.transform`。更换 GLB 后应同时复核这些参数。

## 质量检查

```powershell
npm test -- --run
npm run typecheck
npm run build
npm run test:e2e
```

端到端测试会自动启动本地开发服务器，并覆盖桌面、平板、手机、键盘导航、减少动态效果和模型缺失降级场景。

## 发布

### Vercel

导入项目后使用 Vite 预设，构建命令为 `npm run build`，输出目录为 `dist`。也可安装 Vercel CLI 后在项目目录执行 `vercel`。

### GitHub Pages

GitHub Pages 常部署在 `https://用户名.github.io/仓库名/` 子路径。发布前在 `vite.config.ts` 的 `defineConfig` 中加入与仓库名一致的 `base`：

```ts
export default defineConfig({
  base: "/仓库名/",
  // 其余配置保持不变
});
```

随后构建并将 `dist` 发布到 Pages。当前展陈数据中的公共资源路径以 `/` 开头；若使用仓库子路径而不是自定义域名，需将这些路径改为 `${import.meta.env.BASE_URL}...` 方式拼接，或在部署前统一加上仓库前缀。使用自定义域名部署在站点根路径时无需修改。

## 技术栈

React、TypeScript、Vite、React Three Fiber、Drei、Three.js、GSAP、CSS Modules、Lucide、Vitest 与 Playwright。

GitHub + Vercel 自动部署测试

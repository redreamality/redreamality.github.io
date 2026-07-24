# 多语言 demo 适配器契约

你只负责一个 `<interactive-figure>` 内部的交互，不负责文章页面。

必须遵守：

1. 只输出 JavaScript 源码，不要 Markdown 围栏、解释、HTML 文档、`<script>` 或 import/export。
2. 使用 `registerDemo("任务指定 ID", factory)` 注册，ID 必须完全一致。
3. factory 使用 `({ root, shadow, signal, copy, motion, tokens, resolveColor, announce })` 对象解构参数，只能操作 `root` 及其后代。
4. 所有可见文本、状态、单位、按钮、Canvas/SVG 标签和 aria 文案必须从 `copy` 读取；禁止把示例 locale 的文字硬编码进源码。
5. 标记和 `<style>` 都写入 `root`。禁止访问 `document`、文章外壳或全局样式；不要调用 `document.createElement()`，应先用 `root.innerHTML` 创建结构，再用 `root.querySelector()` 获取内部节点。
6. 禁止网络请求、外部图片、外部字体、CDN、第三方库和动态代码执行。
7. factory 必须返回 `pause()`、`resume()`、`reset()`、`destroy()`；尺寸相关交互应额外返回 `resize({ width, height, dpr })`。
8. `motion === false` 时必须展示信息完整的静态状态。`pause()` 停止非必要动画，但知识控件与 `reset()` 仍要立即重绘。
9. 不要创建自己的播放、暂停或重置按钮；共享 runtime 已提供。可以创建知识点本身需要的滑块、切换、拖拽和键盘交互。
10. 内部监听器优先绑定 `signal`；`destroy()` 必须停止 requestAnimationFrame、定时器并清空 root。
11. 动画内部禁止创建 `ResizeObserver`，也禁止读取全局 devicePixelRatio；尺寸只能来自 `resize(...)`。
12. 可用设计令牌只有 `tokens.ink`、`tokens.muted`、`tokens.line`、`tokens.ocean`、`tokens.warm`、`tokens.coral`、`tokens.paper`、`tokens.surface`。CSS 可以直接使用 token；Canvas 的 `fillStyle`/`strokeStyle` 不能解析 CSS `var(...)`，必须先调用 `resolveColor(token)` 得到真实颜色。
13. Canvas/SVG 必须有可读名称或文字回退，所有控件可用键盘操作，移动端不能裁切核心解释。
14. 动画必须解释因果或状态变化，不能只是装饰粒子。
15. `<style>` 中的选择器必须以 demo 自己的命名空间 class 约束。禁止复用 runtime 所有的 `.frame`、`.stage`、`.controls`、`.title`、`.status`，也禁止使用未加 demo 容器前缀的 `button`、`canvas` 等元素选择器。
16. Canvas 的 `fillText()` / `strokeText()` 文案必须直接来自 `copy`，不能写自然语言字符串常量；需要换行时必须同时兼容空格分词语言与中日韩无空格文本。
17. `resolveColor()` 接收的是 `tokens.ink` 等 token 值，不是 `"ink"`、`"ocean"` 之类的 token 名称字符串。所有变量都必须用 `const` 或 `let` 声明，禁止隐式创建全局变量。
18. Runtime 的 `.stage` 采用内容驱动的自动高度。Demo 根容器禁止使用 `height: 100%`；应使用合理的 `min-height`，Canvas 需要铺满时放进有稳定最小高度的相对定位容器并使用绝对定位，避免 `ResizeObserver` 与 Canvas bitmap 尺寸形成布局反馈循环。

必须采用这个形状：

```javascript
registerDemo("任务指定 ID", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  // 所有界面文字从 copy 读取，只操作 root 内部。

  return {
    pause() {},
    resume() {},
    reset() {},
    destroy() {},
    resize({ width, height, dpr }) {}
  };
});
```

# 三语交互图解创作工具

这是从 `typhoon/v2` 验证并提炼出的可选创作工具。它用同一份 shell、runtime 和逐 demo factory，通过 locale manifest 生成英、中、日自包含 HTML；适合线性章节式交互图解。

它不是所有可视化作品的强制框架。全屏地图、仪表盘、非线性叙事等内容可以继续提供完全自定义的独立 HTML，再通过站点的 visual manifest 接入。

## 使用

启动终端交互预览：

```powershell
pnpm visual-kit
```

生成完整三语产物、最小变体和第二主题样例：

```powershell
pnpm visual-kit:build
```

运行模板交互与无障碍验证：

```powershell
pnpm visual-kit:e2e
```

只运行 manifest/schema 负向校验：

```powershell
pnpm visual-kit:test
```

## 使用 Gemini 生成 demo

生成某一个共享步骤的适配器：

```powershell
pnpm visual-kit:generate --manifest manifest-loop-engineering.json --step outer-loop --locale en
```

按 manifest 顺序生成全部步骤并跳过 prompt 未变化的已有结果：

```powershell
pnpm visual-kit:generate --manifest manifest-loop-engineering.json --all --include-overview --locale en --resume
```

生成器默认使用 `gemini-3.1-pro` 和 OpenAI-compatible streaming endpoint。密钥优先读取 `NEWAPI_GEMINI_KEY`，否则通过 gopass 的 `newapi/gemini` 条目读取。生成结果写入 `src/demos/<demo-id>.js`，经过多语言 copy、资源策略、生命周期和 `node --check` 校验后才会原子替换现有适配器。

请求日志写入被 Git 忽略的 `logs/generation-requests.ndjson`，密钥会脱敏；`--resume` 的 prompt 指纹状态保存在 `.generation-state.json`。

生成结果位于 `dist/visual-kit/`，不会自动发布到站点。要发布作品，需要把最终自包含 HTML 放入 `src/assets/html-pages/`，并在 `src/data/visuals-manifest.json` 声明对应语言产物。

## 契约

- 共享结构只保存 step/demo ID；正文、控件、状态和 aria 文案全部由 locale 数据提供。
- runtime 管理挂载、尺寸、暂停、重置、销毁与 reduced motion；demo factory 接收 `root`、`shadow`、`signal`、`copy`、`motion`、`tokens` 和 `announce`。
- 每个 demo 独立保存在 `src/demos/<demo-id>.js`；builder 按 manifest 引用加载并校验，不维护第二份 demo 名单。
- Gemini 只负责生成 demo adapter；manifest、三语 copy、共享 runtime 和发布元数据仍是确定性输入。
- manifest 可以只声明实际存在的 locale，语言导航只呈现可用版本。
- 每个产物必须保持自包含、单一 H1、无未声明外部资源。

设计验证与边界见 [NOTES.md](./NOTES.md)。

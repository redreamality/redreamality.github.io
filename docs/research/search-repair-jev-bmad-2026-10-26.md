# Jev、BMAD 与 SDD 旧页实操需求修复

核验日期：2026-10-26，Pacific/Port_Moresby。

范围来自 `docs/research/search-demand-and-ranking-2026-10-25.md` 的三项维护需求：中文 Jev 接入、BMAD 安装后的小改动、同题 SDD 选型。只修改指定三个 slug 的现有三语版本及本报告、配套示例。没有创建新博客选题，没有修改其他人的文件，没有全站构建、提交或推送。全站构建与全局测试由父任务执行。

## 文件

现有内容共九个文件：

- `src/content/blog-cn/typesafe-jev-use-cases.md`
- `src/content/blog-en/typesafe-jev-use-cases.md`
- `src/content/blog-ja/typesafe-jev-use-cases.md`
- `src/content/notes-cn/bmad-method-guide.md`
- `src/content/notes-en/bmad-method-guide.md`
- `src/content/notes-ja/bmad-method-guide.md`
- `src/content/blog-cn/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx.md`
- `src/content/blog-en/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx.md`
- `src/content/blog-ja/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx.md`

示例均位于 `public/assets/jev-bmad-search-repair/`：

- `jev_triage.py`：完整中文请求、请求及单 Choice 响应校验、离线 fixtures、低置信度与错误回退。默认离线；只有明确 `--live` 且设置密钥才允许请求。
- `test_jev_triage.py`：七个测试方法，包含无效请求不得调用 transport 的检查及多组异常子用例。
- `small-change-task.md`：各工具共用的任务与验收约定，明确为作者编写的练习。
- `normalize_name.py`：作者编写的标准库参考实现，不冒充 BMAD 生成结果。
- `test_normalize_name.py`：七个测试方法，覆盖 Unicode 空白、中文保留、非字符串、空输入及幂等性。

## 当前一手来源

先调用了 web 搜索及打开工具，但本次工具没有返回可用正文或引用。随后直接通过 HTTPS 读取官方页面与官方仓库原文。没有把竞品技术说法当成事实来源。

| 来源 | 本次确认的内容 |
| --- | --- |
| [TypeSafe 文档索引](https://docs.typesafe.ai/llms.txt) | 当前问题类型包括 Box；旧文三操作表改为三种文本操作 |
| [System One API](https://docs.typesafe.ai/api/system-one.md) | POST `/v1/systemone`、Bearer 认证、model/state/questions、answers/usage 与 OpenAPI 字段 |
| [Choice](https://docs.typesafe.ai/primitives/choice.md) | criteria 映射、匹配问题 ID、choice/confidence/probabilities |
| [Confidence](https://docs.typesafe.ai/confidence.md) | 与概率不同，Choice confidence 由分布计算；业务阈值需实测 |
| [错误文档](https://docs.typesafe.ai/api/errors.md) | 401、422、429、529 等错误含义，限流重试建议 |
| [BMAD 6.12.4 build 入口](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.12.4/src/bmm-skills/ship/bmad-build/SKILL.md) | 安装后运行 render_skill.py 的入口 |
| [BMAD 6.12.4 spec 模板](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.12.4/src/bmm-skills/ship/bmad-build/spec-template.md) | 意图、状态、oneshot/dispatch 路由与实现、评审记录 |
| [Spec Kit README](https://github.com/github/spec-kit) | 当前 SDD、独立 bug fixing、idea assessment 入口；Copilot 连字符技能写法 |
| [Spec Kit SDD 参考](https://github.github.io/spec-kit/reference/agentic-sdd.html) | specify/plan/tasks/implement/converge、文档一致性检查和追加任务行为 |
| [OpenSpec README](https://github.com/Fission-AI/OpenSpec) | propose/apply/archive、变更文件夹产物、扩展 profile 的 verify 等入口 |
| [PromptX README](https://github.com/Deepractice/PromptX) | 角色、记忆、MCP 与工具；不把角色状态当成本题已完成的代码规格 |

远端原文通过 `raw.githubusercontent.com/<owner>/<repo>/<ref>/...` 读取。BMAD 版本固定为 `v6.12.4`；其他 README 为本日 main 快照，因此正文明确为当日维护说明，不声称永远适用。

## Jev 实测边界

完整请求与 fixture 分开呈现。fixture 的 `model` 为 `fixture-not-inference`，usage 为零，三个 locale 均明确这是构造数据，不是真实模型输出。低置信度 fixture 的概率为 0.4/0.3/0.3、confidence 为 0.1，符合文档的三选项公式。0.8 路由门槛是演示策略，未声称经过业务校准。

请求校验限定这个应用的文本工单结构；响应校验包含 envelope、问题 ID、类型、选项白名单、完整概率键、有限数值与范围、概率和、最大值选择及 usage 整数。不是通用 Jev schema 实现。未知的附加响应元数据不会阻止已有合法字段使用；问题集合和部门集合则严格匹配。

错误路径包含非法请求、非法响应、JSON 解析失败、401、429、500、超时与 `other`。函数只返回队列决定，不会退款或修改工单。正文补充持久化、手动队列消费者、有限重试和入队去重的生产要求，但示例不冒充完整工单系统。

运行：

```bash
uv run --no-project python -B public/assets/jev-bmad-search-repair/jev_triage.py
uv run --no-project python -B -m unittest discover -s public/assets/jev-bmad-search-repair -v
```

实际离线输出：

```text
confident-fixture: billing / classified
low-confidence-fixture: manual / low-confidence
invalid-schema-fixture: manual / invalid-response
timeout-fixture: manual / transport-error
Ran 14 tests
OK
```

没有运行 `--live`、没有读取 API key、没有进行付费 API 调用，也没有验证中文分类质量。混合物流与扣款诉求是待评测反例，不是编造的模型误判记录。

## BMAD 隔离检查

本地版本：Node.js 26.7.0、pnpm 10.28.2、uv 0.12.17。`pnpm view bmad-method dist-tags --json` 返回 `latest=6.12.4`、`next=6.12.3-next.1`、`rollback=4.39.0`。

新建的仓库外目录：

```text
C:\Users\unknown\AppData\Local\Temp\bmad-search-repair-080c17b838d744a9a473d12343b8cd4b
```

实际执行 `pnpm dlx bmad-method@6.12.4 install --help`，再用 `install --directory <上述目录> --modules bmm --tools claude-code --yes`，退出码均为 0。安装器确认 core/bmm 6.12.4，生成 29 个 `.claude/skills` 子目录，随后计数复核为 29。依赖下载曾出现网络重试，最终安装成功。

读取安装的 `bmad-build/SKILL.md` 与 `spec-template.md`，运行：

```text
uv run --no-cache "<practice>/_bmad/scripts/render_skill.py" --project-root "<practice>" --skill "<practice>/.claude/skills/bmad-build"
```

退出码 0，实际输出文件：

```text
_bmad/render/bmad-build/bmad-search-repair-080c17b838d744a9a473d12343b8cd4b-f70bc3924d55/e9e769ac5d200225d2ac/workflow.md
```

已读该文件，且 `Test-Path` 确认其引用的 `step-01-clarify-and-route.md` 存在。没有继续启动宿主模型。这是安装器、宿主入口和本地 workflow artifact 检查，不是模型澄清、实现或评审执行。

参考实现的七项测试已实际执行通过。正文提供可供读者运行模型流程的任务和验收测试，同时明确参考实现是作者所写。未伪造 `spec-<slug>.md`、模型运行日志、计费记录或比较性能。

## 结构检查与篇幅

使用仓库已安装的 `@astrojs/markdown-remark` 的 `parseFrontmatter` 和 `createMarkdownProcessor`，逐一解析并渲染九个文件，与 `git show HEAD:<path>` 比较。九个文件的原有标题 ID 全部仍在，正文没有 H1，`pubDate` 或 notes 的 `date` 保持不变。六篇博客都添加了 `updatedDate: 2026-10-26T00:00:00.000Z`，notes 使用正文可见的核验日期。配套资源链接均存在，站内链接采用对应语言前缀。

计量排除 frontmatter、fenced code block、链接目标与脚注定义行，保留链接文字。中文计 Unicode Han 字符；英文计字母单词，允许单词中的连字符和撇号；日文用去空白字符数，包含假名、汉字、英文与 Markdown 标点，不能与中文汉字数直接比较。

| 内容 | locale | 修改前 | 修改后 | 计量 |
| --- | --- | ---: | ---: | --- |
| Jev blog | cn | 5,464 | 6,452 | 汉字 |
| Jev blog | en | 2,880 | 3,570 | 英文词 |
| Jev blog | ja | 10,073 | 12,249 | 去空白字符 |
| BMAD notes | cn | 1,686 | 2,409 | 汉字 |
| BMAD notes | en | 1,077 | 1,535 | 英文词 |
| BMAD notes | ja | 3,828 | 5,256 | 去空白字符 |
| SDD comparison blog | cn | 6,472 | 7,760 | 汉字 |
| SDD comparison blog | en | 2,073 | 2,894 | 英文词 |
| SDD comparison blog | ja | 7,732 | 10,159 | 去空白字符 |

按用户本次明确指示，这是有边界的旧页维护，不进行整篇重写或为目标长度凑字数。既有中英日版本长度原本不完全等量，本轮新增实操信息三语对齐，保留已有深度与篇幅差异。原文中的其他历史论述、社区数字和旧版讨论没有扩展成重新调研全篇；比较页前部已标明其历史语境，并修正“v4 稳定、v6 alpha”的过时当前时态。

`check-prose-rhythm.mjs` 已对九篇运行。中文和英文没有四连短句提示；日文有基于汉字数的提示，不能直接等同于日文句长。新增中文的“不要把”命中是具体误操作说明，不是审计叙述。要求的记账词 grep 无命中。`git diff --check` 的新增尾空格已修正。

未执行全站 build、Vitest、Playwright、部署、commit 或 push；这些由父任务在所有维护合并后统一验证。没有搜索排名恢复、CTR 提升或真实模型性能的结论。

---
title: "BMAD Method 入门：安装、首个工作流与产物检查"
description: "按 BMAD Method 6.12.0 已发布版本介绍安装、bmad-help、bmad-build 和真实目录，演示如何定义首个小变更，并说明角色约定与权限控制的区别。"
date: 2026-01-10
source: "https://github.com/bmad-code-org/BMAD-METHOD"
tags: ["ai-development", "敏捷开发", "bmad", "规格驱动开发", "多智能体系统"]
lang: "zh"
---

**BMAD Method 是一套让 AI 编码助手按明确需求、计划和评审流程工作的开源方法与工具。** [官方仓库](https://github.com/bmad-code-org/BMAD-METHOD)提供安装器和技能定义，产品、架构、开发等角色帮助团队从不同角度讨论问题。它适合需要保留决策、分阶段完成的变更；角色名称本身不提供文件权限隔离。

先完成一个范围小、结果容易检查的工作流，再决定是否引入更多规划。本文使用 npm 已发布的 **bmad-method 6.12.0**，于 **2026-09-25 UTC** 核验。安装和本地技能渲染已在仓库外空目录验证；没有启动真实模型、调用付费服务或实现下文示例功能。

## 安装哪个版本

核验时 npm 的 `latest` 指向 6.12.0，`next` 指向 6.12.1-next.0，`rollback` 指向 4.39.0，没有返回 `alpha` 标签。标签会变化，因此下面固定版本，不能再把 `@latest` 当成 v4 的永久别名，也不能把 v6 统一写成 alpha。

所选版本的安装器需要 **Node.js 20.12.0+**。`bmad-build` 等技能还需要 **uv** 运行 Python 脚本，官方 README 列出 Python 3.10+。缺少 uv 时安装器可能只警告而继续完成，但 build 技能会停止，不能把安装成功等同于工作流可用。使用模型的阶段还需要一个受支持的编码助手及其正常可用的模型服务。Git 仅在从 Git 安装外部或自定义模块时是安装前提。

在空练习目录先检查帮助，再安装 BMM 模块并选择 Claude Code 集成：

```bash
pnpm dlx bmad-method@6.12.0 install --help
pnpm dlx bmad-method@6.12.0 install --directory . --modules bmm --tools claude-code --yes
```

`--yes` 接受默认设置；`--directory .` 指定当前目录。命令已经完成项目安装，不需要再运行旧的 `*workflow-init` 才生成目录。使用其他宿主时，先运行同版本的 `install --list-tools`，再替换工具 ID，不要猜测 ID 与产品显示名称相同。

## 安装后检查哪些文件

本次 Claude Code 安装实际生成的关键路径如下：

```text
_bmad/
  config.toml
  config.user.toml
  _config/
    bmad-help.csv
  custom/
  scripts/
    render_skill.py
    resolve_config.py
  render/
_bmad-output/
.claude/
  skills/
    bmad-help/
      SKILL.md
    bmad-build/
      SKILL.md
      spec-template.md
```

`_bmad/` 存共享配置与支持脚本，`.claude/skills/` 是所选宿主的技能入口，`_bmad-output/` 是工作产物位置。安装完成时，输出目录不一定已有需求或实现文件，不应凭一个空目录判断某个工作流已经执行。

6.12.0 的 `_bmad/config.toml` 由安装器维护，重装会重新生成。持久的团队覆盖写入 `_bmad/custom/config.toml`，个人覆盖使用 `_bmad/custom/config.user.toml`。通过安装器修改设置时，先查看同版本 `install --list-options`。本次默认配置包含：

```toml
[modules.bmm]
planning_artifacts = "{project-root}/_bmad-output/planning-artifacts"
implementation_artifacts = "{project-root}/_bmad-output/implementation-artifacts"
project_knowledge = "{project-root}/docs"
```

这段是实际生成配置的节选，不是建议另造一套配置文件。早期 v6 文档中的 `_bmad/bmm/config.yaml` 属于不同版本；`.bmad`、`.bmad-core` 也不能当成本版的目录说明。旧文章引用的 `BmadElixir` 是第三方项目，它的配置字段不能作为 BMAD-METHOD 官方契约。

## 首个工作流：帮助、实现与检查

完成安装后，在同一个目录打开所选编码助手。下面示例是 **Claude Code 聊天中的技能调用，不是 shell 命令**：

```text
/bmad-help 我已完成安装。请说明当前项目状态，以及如何开始一个小变更。
```

`bmad-help` 根据已安装的 `_bmad/_config/bmad-help.csv`、配置和已有产物判断下一步。先确认它识别的是当前练习项目，且能够找到 `bmad-build`。若不识别，检查启动目录和 `.claude/skills/bmad-help/SKILL.md`，再重新打开宿主；不要直接归因于 IDE 文件监听权限。

接下来给 `bmad-build` 一个可以本地验证、没有外部副作用的需求：

```text
/bmad-build 在当前练习目录新增 normalize_name.py 和 test_normalize_name.py。
使用 Python 标准库。normalize_name(value) 去除首尾空白，
把中间连续空白归一成一个空格；空字符串返回空字符串。
非字符串输入抛出 TypeError。不要访问网络，不要安装第三方依赖，
不要提交或推送。若需求仍不清楚，先问我。
```

这是供读者执行的练习输入，不是本次已生成程序的记录。本版 `bmad-build` 通常按“澄清、计划、实现、评审、展示结果”组织工作。没有意图缺口且风险低的小任务可能进入简化的 `oneshot` 路径；不能承诺每个任务都会逐阶段弹出审批。

### 应该得到什么

本版模板会在配置的 `implementation_artifacts` 下保存 `spec-<slug>.md`，本例可能是 `_bmad-output/implementation-artifacts/spec-normalize-name.md`，具体 slug 由实际任务决定。该文件保存意图、状态和实现记录；较完整的路径还包括边界、输入输出场景、任务与验证。小任务的简化模板可能省略其中部分章节。

检查最终消息列出的真实路径，并打开生成的 `normalize_name.py`、`test_normalize_name.py` 和 spec。不要只根据 agent 宣称“完成”就继续：

| 输入 | 预期结果 |
| --- | --- |
| `"  Ada   Lovelace  "` | `"Ada Lovelace"` |
| `""` 或全空白字符串 | `""` |
| 含换行、制表符的字符串 | 单个空格分隔的文本 |
| `None` 或数字 | `TypeError` |

让测试覆盖以上情况，然后在练习目录运行：

```bash
uv run --no-project python -m unittest -v test_normalize_name.py
```

这条命令要求测试文件已经由工作流生成。若没有文件或测试未通过，说明练习尚未完成，应处理原因而不是直接修改 spec 为 `done`。检查源文件差异是否只涉及约定的函数、测试与 BMAD 产物，确认没有网络访问或无关依赖。

最后可以调用：

```text
/bmad-help 解释刚才的工作流，列出实际产物、验证证据和仍未完成的事项。
```

## 本次验证到哪里

在 Windows 空目录中，Node.js 26.7.0、pnpm 10.28.2、uv 0.12.17 下，固定版安装成功，并生成上述目录。另按已安装 `bmad-build/SKILL.md` 的要求调用本地 `render_skill.py`，确认它输出 `_bmad/render/bmad-build/.../workflow.md`。

这验证了包、安装器、宿主入口文件和技能渲染，不代表已经验证模型会正确执行工作流。上面的 Python 功能生成、聊天帮助结果、测试输出都没有在本次运行，不能把它们写成已观测的成功案例。安装器不需要模型密钥，但宿主执行技能时可能使用订阅或计费模型服务。

## 角色约定、质量门槛与上下文开销

产品、架构、开发角色提供不同的提问和检查方式。角色指令可以要求开发者发现架构冲突时先报告，但不能据此保证开发代理没有数据库文件的写入权限。真正的文件限制、沙箱、审批和网络权限取决于宿主与执行环境。

同样，在配置里随意添加 `quality.pre_commit`，不会自动成为官方支持的提交门槛。需要阻止失败代码合并时，单独配置实际测试命令、Git hooks 或 CI，并用失败用例确认阻断发生。本文没有实施或验证这套强制机制。

拆分文档、只加载相关上下文可能减少重复输入，但节省量取决于模型、任务、缓存和反复评审次数。这里不提供固定 token 节省比例或准确率保证。

当一个变更涉及多个领域、跨多次实施或存在重要架构选择时，再通过 `bmad-help` 选择需求、架构或更完整的规划流程。拼写修正和机械格式化不一定需要整套规划。若主要需求是管理现有项目中一次变更的规范文件，可以比较[OpenSpec 的工作流与产物](/cn/garden/notes/openspec-guide/)。

## 版本化资料

- [6.12.0 安装文档](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.12.0/docs/start/install-bmad.md)：环境、安装和更新。
- [6.12.0 首个变更教程](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.12.0/docs/start/build-your-first-change.md)：已发布版的 `bmad-build` 路径。
- [6.12.0 bmad-help](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.12.0/src/core-skills/bmad-help/SKILL.md)：帮助入口使用的数据。
- [6.12.0 build 模板](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.12.0/src/bmm-skills/ship/bmad-build/spec-template.md)：产物字段与简化条件。
- [npm 发布标签](https://registry.npmjs.org/-/package/bmad-method/dist-tags)：实时可变；复现实验仍使用固定版本。

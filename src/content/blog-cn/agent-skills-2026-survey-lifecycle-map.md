---
title: "Agent Skills 2026 综述：从 SKILL.md 到按需加载、训练、验收与签名"
description: "Agent Skills 2026 综述：按写、装、选、用、学、验、管七段，串起 SKILL.md 规范、安装前扫描与签名、按需加载、HEXIS 状态机、SkillOpt/SkillGym 训练和 SAGE 验收门，附对照表与技能库维护清单。"
pubDate: 2026-10-06T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools", "Agent Skills"]
lang: "zh"
---

最早聊 Agent Skills 时，大家说的基本是同一件事：一个文件夹，里面放一份 `SKILL.md`，写清楚这个技能叫什么、什么时候用、怎么做，agent 需要时把它读进上下文。到 2026 年秋天，这件事已经拆成好几条线：按需加载、选择性激活、编译成状态机、当成可训练对象去优化甚至训进权重、给自动进化加正则和统计检验、安装前扫描和签名。Google 也宣布把 Gemini 的 Gems 迁成 skills。

站内过去两周已经单篇拆过其中不少论文：[Progressive Disclosure](/cn/blog/progressive-disclosure-agent-skills/)、[SkillDelta](/cn/blog/skilldelta-selective-skill-activation/)、[HEXIS](/cn/blog/hexis-skills-compiled-to-fsm/)、[SAGE](/cn/blog/sage-statistical-acceptance-gate-self-evolving-skills/)、[SkillSpector](/cn/blog/nvidia-skillspector-agent-skills-trust-pipeline/)。这篇是枢纽文：按一个 skill 从写出来到下线的顺序——**写、装、选、用、学、验、管**——把这些工作放到同一张图上，说清每段解决什么、证据多硬、边界在哪，最后给维护 skill 库的团队一份清单。

数字都来自论文原文或官方页面；大部分论文是 2026 年 9 月下旬的预印本，基准和协议各不相同，**跨论文的数字不能直接比大小**。标了「分析」的段落是我的判断。

## 先说清楚：这里的「skill」至少有三种

读这批论文最容易踩的坑，是把同名的东西当成一回事。按落在哪一层，大致分三类：

- **文档型 skill**：agentskills.io 规范里的那种，一个目录加一份 `SKILL.md`，可选附带 `scripts/`、`references/`、`assets/` [1]。Progressive Disclosure、SkillDelta、HEXIS、SkillOpt、SAGE、SkillSpector 处理的都是这一类；SkillEvoReg 的定义更宽，把指令、流程、代码和结构化资源都算进去 [15]。
- **代码型 skill**：Abstraction Ladder 一文里，skill 是一段 Python 过程，在 NetHack 里连续发出底层动作。作者在 Remark 2.1 专门说明，它和「agentic markdown 文件」那种 skill 相关但不同 [10]。
- **参数型 skill**：READ 讨论的是每个任务训一个 LoRA adapter，再把多个 adapter 合进同一个模型 [14]；SkillGym 则是把人写的文档型 skill 变成训练环境，最终把能力落进模型权重 [13]。

三类可以互相转化：文档能编译成状态机（HEXIS）、变成训练数据（SkillGym）、随策略一起重建（RLHarness）。下文主要沿文档型 skill 走。

## 一张图：写、装、选、用、学、验、管

1. **写**：格式怎么定，正文多长，何时拆文件。
2. **装**：进库前怎么判断安全、不重复、有用、没被篡改。
3. **选**：任务来了加载哪个，加载了是否真有增益。
4. **用**：靠模型「照着做」，还是把流程交给运行时。
5. **学**：skill 能否被优化、训进模型、随策略进化。
6. **验**：自动改出的新版本凭什么合并。
7. **管**：怎么分发、迁移、下线。

## 写：一份规范定下的最小格式

agentskills.io 的规范很短 [1]。必填只有两个 frontmatter 字段：`name`（1–64 个字符，只能是小写字母、数字和连字符，必须与父目录同名）和 `description`（1–1024 个字符，写清做什么、什么时候用，并带上便于 agent 识别任务的关键词）。可选字段有 `license`、`compatibility`（不超过 500 字符，写环境要求）、`metadata`，以及标为实验性的 `allowed-tools`（预先批准的工具列表，各家实现支持程度不一）。

规范里对后面所有工作影响最大的一段，是 progressive disclosure（渐进披露）：启动时所有 skill 只加载 `name` 和 `description`，约 100 token；skill 被激活时才读入整份 `SKILL.md`，建议正文控制在 5000 token 以内、500 行以内；`scripts/`、`references/`、`assets/` 里的文件需要时再读，文件引用最好只深入一层 [1]。官方概览页把这概括为发现、激活、执行三步，并说明格式最初由 Anthropic 开发，后作为开放标准发布 [2]。规范还提供 `skills-ref validate` 校验 frontmatter 和命名 [1]。

（分析）这套格式有意做得很薄：规定了「怎么被发现」，几乎不规定「怎么被执行」，正文没有格式限制 [1]。执行可靠性因此整个交给了模型，后面「选」「用」「验」的多数研究都在补这块留白。

社区样本可以看 addyosmani/agent-skills：README 把 25 个 skill 组织成从定义、计划、构建、验证、评审到发布的流程，配 9 个斜杠命令（如 `/spec`、`/plan`、`/build`、`/ship`），skill 也会按当前工作自动激活，例如设计 API 时触发 `api-and-interface-design` [3]。站内[入门指南](/cn/blog/agentskills-io-starter-guide/)讲过 skill 怎么接进 agent，[CLAUDE.md / AGENTS.md 长文](/cn/blog/claude-md-agents-md-deep-dive/)讲过常驻指令文件。可以把 skill 粗略看成「按需才加载的那部分 AGENTS.md」——这是我的类比。

## 装：安装前的扫描、去重、评测与签名

skill 不只是文字：目录里可以有脚本，正文可以让 agent 跑命令、读文件、调工具、拉远程内容。NVIDIA 的文档直说 skill 是新的供应链入口 [6]。

SkillSpector 是 NVIDIA 开源的 skill 安全扫描器。README 给的样本数据是：在研究数据集里分析过的 31,132 个 skill 中，26.1% 含漏洞，5.2% 显示出可能的恶意意图 [5]。它覆盖 17 类、71 种模式，包括提示注入、数据外泄、权限提升、供应链、记忆投毒、MCP 工具投毒等；分析分两段，先做快速静态分析，再可选做 LLM 语义评估；报告支持终端、JSON、Markdown 和 SARIF 格式，方便接进 CI [5]。风险分到 51 分以上，建议是不要安装 [5]。它也能作为 MCP 工具提供 `scan_skill`，返回会标明是否用了 LLM，免得把只跑静态扫描的低分当成完整结论 [5]。

更值得照抄的是外面那层管线。NVIDIA 的 Trust Pipeline 文档把发布前的问题拆成五个，每个问题对应一份证据 [6]：

- **能不能安全运行？**——SkillSpector 扫描报告。它属于 SkillEvaluator 的第一层，这一层同时检查 schema、license、PII 和 Unicode 安全。
- **目录里是不是已经有了？**——第二层，和已有 skill 做语义重叠检测，避免同一能力换个名字发两次。
- **对 agent 输出有没有提升？**——第三层，真实 agent 在沙箱里分别带 skill 和不带 skill 跑同一组任务，各维度的差值就是这个 skill 的实测贡献，写进 `BENCHMARK.md`。
- **做什么、谁负责？**——skill card。
- **发出去的是不是审过的那份？**——对整个目录的分离签名 `skill.oms.sig`。

文档里的重点句：一个 skill 可以通过所有安全检查，却仍让 agent 变差；不能提升 agent 表现的 skill 不该发布，不管安全分多好 [6]。扫描、评测、签名分别回答「看起来安全吗」「有没有用」「发的是不是审的那份」，三者不能互相替代。

安装方式本身也有坑。addyosmani/agent-skills 的 README 提醒：用 `npx skills add` 只装单个 skill 时，只会复制 `skills/<name>/`，不带仓库级的 `references/` 目录；skill 仍能用，但指向共享清单的路径会失效 [3]。（分析）skill 之间的依赖目前多半是隐式的，「装上了」不等于「装完整了」。

站内 [SkillSpector 单篇](/cn/blog/nvidia-skillspector-agent-skills-trust-pipeline/)拆过 17 类检测；[Cloudflare security-audit-skill](/cn/blog/cloudflare-security-audit-skill-for-coding-agents/)则反过来，把安全审计流程打包成 skill 分发。

## 选：先按需加载，再问「该不该注入」

库一大，把所有 skill 全文塞进上下文就不行了。Workday 的报告在受控的技能检索任务上比较了两种做法：eager loading（全量加载）和 progressive disclosure（先只给 frontmatter，再按需调用 `load_skill`）[7]。库大小到 100 时，全量加载在所有 rollout 中都 crash（上下文溢出或输出格式错误）；在 Qwen3-14B、库大小 50 时，渐进披露比全量加载节省 81.7% 的 token [7]。代价是模型调用次数变多、延迟略升；平均检索质量更好 [7]。报告留了三个开放问题：一个任务需要几个 skill，哪些附属文件该加载，哪些 skill 可以安全入库 [7]。

按需加载解决的是「放不放得下」，没回答「放进去有没有用」。SkillDelta 的出发点就是：skill 经常没有收益，甚至会拉低成功率，还多花 token [8]。它用同一 agent 带与不带 skill 的配对执行历史，估计「这个任务加上这个 skill 能多赢多少」，再用局部预测器把历史增益迁移到新任务，不用重训 agent [8]。在五个基准、三个目标 agent 共 15 个设定里：配对历史有 12 个设定比只看「带 skill 的结果」排序更准；在相同的期望 skill 使用率下，SkillDelta 在全部 15 个设定里成功率都高于随机激活，平均高 4.3 个百分点 [8]。拆开看，其中 3.72 个点来自在不同任务组之间分配，只有 0.61 个点来自组内挑选 [8]。

这篇里有个很实用的对照：让 agent 自己判断要不要用 skill，结果 15 个面板里有 14 个都在超过 91% 的任务上选择启用，几乎等于「一直开着」[8]。（分析）把 description 写好、让模型自己挑，解决的是「找得到」，解决不了「值不值」；后者只能靠带与不带 skill 的对照数据，和 NVIDIA 第三层是同一思路。

## 用：从「照着说明书做」到「运行时管流程」

默认的执行方式是 Skill + ReAct：模型每一步都根据 skill 和历史自己推断下一步。HEXIS 指出，这把「运用知识」和「控制流程」绑在一起，每步都可能偏离，步数一多，累积偏离概率按乘法上升 [9]。

HEXIS 的做法是把 skill 编译成扩展有限状态机：知识留在各个状态的局部指令里，由模型在状态内推理和生成；流程中的顺序、分支、循环和终止变成显式的条件转移，由运行时执行 [9]。编译器先从 skill 文档和工具接口起草状态机，再用开发轨迹补缺失的操作和依赖；每次更新都要过静态检查，并重放当前和此前所有接受过的轨迹，全部通过才接受 [9]。在四个基准、四个执行模型上，HEXIS 相对 Skill + ReAct 平均提升 16.2 个百分点，16 个设定里 15 个更好；用 Qwen3.8-27B 执行时，token 减少 38.4%–88.9% [9]。

两个细节值得记住。其一，把同一台状态机渲染成文字提示让模型照着走，成功率和完全合规率平均比运行时执行低 16.8 和 28.0 个百分点——提升来自运行时控制，不是改写后的文字 [9]。其二，它和改写正文的 SkillOpt 互补：在 SpreadsheetBench 上，SkillOpt 优化过的 skill 再交给 HEXIS 执行，成功率 84.2%、每个任务 69k token；同一份优化后的 skill 用原生方式执行，是 59.6%、257k token [9]。局限是：文档和轨迹没覆盖的分支，状态机里就没有；重放只验证记录过的路径 [9]。

代码型 skill 给了另一个角度。Abstraction Ladder 在 NetHack 里做了含 78 个 Python skill 的库 CodeHack，比较只用底层动作、只用 skill、两者混用三种接口 [10]。14 个模型零样本平均：用 skill 后游戏进度接近三倍，每局推理成本降 86%，token 降 74%，因为很多环境步由 CPU 上的代码执行，模型调用平均减到约五分之一 [10]。但抽象会漏。混用接口保留了只用 skill 时 95% 的进度，推理成本则是只用 skill 的 2.3 倍；删掉某类 skill 时，混用受的影响普遍更小 [10]。到了 RL 阶段，在相同训练预算下，只用 skill 和混用的地牢层数增益，分别是只用底层动作的 7.2 倍和 8.6 倍 [10]。

（分析）HEXIS 和 CodeHack 指向同一个方向：反复出现的局部控制决策，不该每次都交给模型重新推一遍。站内的[扩张 Harness，而不是堆上下文](/cn/blog/grow-the-harness-not-the-context/)谈的也是这件事。区别在于 HEXIS 保住了「文档是源头」；CodeHack 要求先把技能写成代码，还得留一条退回底层动作的路。

## 学：skill 成了被优化、被训练的对象

**SkillOpt。** 微软的 SkillOpt 把一份紧凑的 skill 文档当成冻结 agent 的可训练状态：目标模型带着当前 skill 跑任务、记录打分轨迹；优化器模型分别分析成功和失败的小批量，提出增、删、改编辑；单次编辑幅度受预算限制，项目页称为「文本学习率」；候选版本在留出验证集上有提升才保留 [11]。项目页报告的实验覆盖 7 个目标模型、6 个基准，并在 Codex 和 Claude Code 两种 harness 下测试，每个设定都是最佳或并列最佳；例如 GPT-5.5 直接对话时平均提升 23.5 分 [11]。最终导出的就是一个 `best_skill.md`，部署时目标模型只读这一个文件；在 Codex 里训出来的 SpreadsheetBench skill 移到 Claude Code 中，提升 31.8 [11]。消融显示，去掉学习率、被拒编辑缓冲或慢更新，分数都会下降 [11]。

**RLHarness。** 它关心的是：策略在 RL 里变了，原来那套 skill 还配不配得上 [12]。RLHarness 把 skills、选择与执行协议、少样本示例和任务契约放进一个带版本号的 harness，和策略学习交替：先建初始 harness 并导出版本对齐的已验证轨迹，做 SFT 和第一轮 DAPO；再按新策略的成功和失败重建 skills、协议和示例，第二轮 DAPO 让策略适应重建后的程序 [12]。MetroMap 和 TravelMap 的准确率从 16.25% 和 27.50% 提高到 62.00% 和 50.00%，四个任务都是在重建加第二轮 DAPO 之后才达到最佳 [12]。作者在局限里写明只做了两轮更新，MetroMap 的 62.00 来自较早的一个重建分支；迁移实验还显示，RL 后重写的提示在规则不同的任务之间迁移很差 [12]。

**SkillGym。** 它更进一步：既然 skill 编码了完整工作流，就直接拿它当训练环境。SkillGym 从一个在线的人写 skill 注册表出发，整理成 12 个大类、63 个子类，用模板实例化任务、用代码检查器验证结果，并用带与不带目标 skill 的对照运行，筛出确实依赖它的任务 [13]。最终发布 2,756 个环境，收集了 8,364 条成功轨迹，平均每条 49 次工具调用 [13]。在 Claude Code 下，SFT 让 Qwen3.5-35B-A3B 在 GDPval-AA v2 上提升 199 Elo，在 Terminal-Bench 2.1 上提升 19.10 个百分点；在 SkillsBench v1.1 上，带 skill 和不带 skill 分别提升 28.13 和 12.38 分 [13]。不给 skill 时，训练后的模型在两种 harness 下都超过了带 skill 的原始底座；论文结论把 RL 训练列为未来工作 [13]。

**READ。** 参数层面，READ 处理的是「新 LoRA skill 加进来，旧的别被弄坏」[14]。它把每个 adapter 改写成保持原更新不变的平衡规范形式，并让耦合只朝一个方向长：新 skill 可以读旧 skill 的输入子空间，不能写入它们的输出子空间；每次追加只训练新 skill 那一行耦合 [14]。合成后的更新可以折回底座权重，推理没有额外开销 [14]。在 SuperGLUE 上比用同一批 adapter 构建的最强已发表基线高 20 多分，领域套件上高 7 分以上；92 次顺序追加中 72 次通过预先登记的可靠性规则；短板在 BBH，8 次最终落败全出在这里，作者归因为新 skill 没学够，而不是旧 skill 被破坏 [14]。

（分析）四篇放一起看，「skill 存在哪里」已经分岔：SkillOpt 存在文档里；RLHarness 文档和权重各存一份、同步演化；SkillGym 把文档转成权重；READ 直接在权重里管组合。选哪条，取决于要不要可读、可审、可回滚——文档天然满足，权重都不满足。

## 验：自动进化要正则，合并要过统计门

skill 一旦能自动修改，就成了一个学习过程，也就会过拟合。SkillEvoReg 把这叫做 skill 进化过拟合：局部有用的编辑会累积成冗余或只针对特定任务的指令，新编辑还会破坏原来能用的行为 [15]。它借用神经网络训练的三招：skill dropout（扰动编辑生成）、考虑复杂度的局部正则（限制不必要的结构增长）、因果反例验证 CCV（针对候选编辑可能引入的回归做定向测试），并保留各系统原有的更新器和评估器 [15]。在 ContinualSkillBench 的五个领域里，skill 数量、token 和复杂度全部下降，例如金融领域的 skill 从 28 个降到 17 个，数学领域的 skill token 从 21,952 降到 16,368；留出集总体表现五个领域里四个提升，办公领域从 82.49 小幅降到 81.05 [15]。

SAGE 管最后一道门。它指出，SkillOpt 这类自进化环把优化器做得很讲究，门控却还是「验证集总分涨了就接受」[16]。问题有二：总分涨了，原来做对的题可能被改错，造成永久回归；在有限、有噪声的验证集上挑最高分本身偏高，即「优化器诅咒」（Optimizer's Curse）[16]。SAGE 改为在相同验证题上逐题比较新旧版本，对回归加重惩罚，再做单侧配对检验，「赢」相对「输」统计上站得住才提交 [16]。在等预算协议下，五个基准、四个底座共 20 个设定中，有 19 个回归率下降、1 个持平，例如 DeepSeek-V4 上 LiveMath 从 36.5% 降到 0%，OfficeQA 从 42.8% 降到 0%；最终分数在全部 20 个设定里都最高，LiveMath 从 34.15 提到 48.78 [16]。站内的 [RSI 综述](/cn/blog/rsi-recursive-self-improvement-survey-2026/)也专门讨论过「改的是什么、谁来验收」。

（分析）HEXIS 的「全部历史轨迹重放」、SkillOpt 的留出验证、SkillEvoReg 的 CCV、SAGE 的配对检验，是同一件事的四种强度。软件工程里这叫回归测试，只不过对象换成了自然语言写的制品。

## 管：平台把 skill 收进了产品

2026 年 9 月 28 日，TechCrunch 报道 Google 将关闭 Gemini 的 Gems——这是 2024 年推出、让用户为特定任务建自定义助手的功能——并从 2026 年 11 月 17 日起把 Gems 自动迁移为可以跨任务使用的 skills；用户不需要做任何操作，迁移前 Gems 照常可用 [4]。迁移后要在任务对话里输入 `/` 选 skill；TechCrunch 评论说这更合工程师胃口 [4]。报道没有说 Gemini 的 skills 是否采用 agentskills.io 格式，这里不做推断。

（分析）这说明的是方向：「为某个任务定制的一套指令」正在从独立产品形态变成可复用的能力单元，会像依赖包一样需要版本、负责人和下线流程。NVIDIA 要求 skill card 写明负责人、license、用途、部署地域、输出形态和风险 [6]，就是这层管理的样子。

## 对照表：每段在解决什么

| 阶段 | 工作 | 解决的问题 | 主要证据 | 边界 |
| --- | --- | --- | --- | --- |
| 写 | agentskills.io 规范 [1][2] | 统一目录和 frontmatter，规定渐进披露 | 规范文本；`skills-ref validate` | 只管发现不管执行 |
| 装 | SkillSpector + Trust Pipeline [5][6] | 安装前查风险、去重、测增益、签名 | 31,132 个样本中 26.1% 含漏洞、5.2% 疑似恶意 | 扫过不等于安全；语义扫描是可选项 |
| 选 | Progressive Disclosure [7] | 库大了放不下 | 库大小 100 时全量加载全部 crash；最高省 81.7% token | 每任务只检索一个 skill；延迟略增 |
| 选 | SkillDelta [8] | 相关不等于有增益 | 15 个设定全部胜过随机激活，平均 +4.3 个百分点 | 需要配对历史；增益主要来自组间分配 |
| 用 | HEXIS [9] | 模型每步重推流程导致偏离 | 平均 +16.2 个百分点，16 个设定中 15 个更好 | 文档和轨迹没覆盖的分支会缺失 |
| 用 | CodeHack [10] | 长程任务里底层动作太贵 | 进度接近三倍，推理成本降 86% | 代码型 skill，需要人工写库；抽象会漏 |
| 学 | SkillOpt [11] | 手写 skill 不够好 | 7 个模型 × 6 个基准均最佳或并列最佳 | 效果依赖留出验证门的质量 |
| 学 | RLHarness [12] | 固定技能库跟不上变化的策略 | 四个任务都在重建后最佳 | 只做两轮更新 |
| 学 | SkillGym [13] | skill 只在推理时读，没有变成能力 | SFT 后 Terminal-Bench 2.1 提升 19.10 个百分点 | 结果来自 SFT，RL 是未来工作 |
| 学 | READ [14] | 多个 LoRA skill 合并后互相干扰 | SuperGLUE 上比最强基线高 20 多分 | 参数型 skill；BBH 上仍失败 |
| 验 | SkillEvoReg [15] | 进化过拟合、库膨胀 | 五个领域 skill 数、token、复杂度全部下降 | 个别领域分数小幅下降 |
| 验 | SAGE [16] | 「总分涨就合并」导致回归 | 20 个设定中 19 个回归率下降 | 只提交基线编辑的一个子集，更保守 |
| 管 | Gemini Gems → skills [4] | 定制助手迁成可复用能力 | 11 月 17 日起自动迁移 | 格式细节报道未提 |

## 几条横向观察（分析）

**知识和控制在分家。** HEXIS 把控制流交给运行时，CodeHack 把局部决策交给代码，RLHarness 把选择和执行协议做成版本化部件。skill 里「要知道什么」和「按什么顺序做」正在被拆开存放。

**「找得到」「相关」「有用」是三件事。** 渐进披露解决找得到；SkillDelta 说明相关不等于有增益；NVIDIA 明说安全过关的 skill 也可能让 agent 变差。最终要看的是第三个。

**带与不带的对照，成了通用度量。** SkillGym 用它筛任务，SkillDelta 用它预测增益，NVIDIA 第三层用它决定能否发布。没有对照数据，「这个 skill 很好用」只是作者的说法。

**skill 越来越像软件制品。** 版本（RLHarness）、回归测试（HEXIS、SAGE）、复杂度预算（SkillEvoReg）、依赖声明、签名（NVIDIA）——软件供应链那一套正在搬到 skill 上。

**证据还很早。** 这批论文多是未经同行评审的预印本；HEXIS 的状态机由强模型编译，SkillOpt 项目页也说更强的优化器模型带来最大增益 [9][11]。落地前最好在自己的任务上复现对照，别直接引用论文的提升幅度。

## 维护 skill 库的检查清单

**写**

- `description` 写清做什么、何时用，带任务关键词；`name` 与目录同名；提交前跑 `skills-ref validate` [1]。
- `SKILL.md` 正文控制在 500 行以内，长参考拆进 `references/`，引用只深入一层 [1]。
- 跨 skill 共享的文件显式写明；确认单独安装一个 skill 时它仍然完整 [3]。

**装**

- 第三方 skill 安装前先做静态扫描，并记录这次有没有跑语义扫描 [5]。
- 每个 skill 都要有负责人、license 和风险说明，也就是 skill card [6]。
- 发布产物签名，CI 在安装前校验签名 [6]。
- 入库前查一遍是否和已有 skill 功能重叠 [6]。

**选**

- 默认渐进披露，不全量加载 [7]。
- 给高频 skill 维护带与不带的配对评测，不要只看「带 skill 时的成功率」[8]。
- 不要把「模型自己说要用」当成 skill 有用的证据 [8]。

**用**

- 对步骤顺序有硬要求的 skill（比如先校验再提交），考虑把控制流放进运行时或脚本 [9]。
- 写成代码的 skill，要保留退回底层操作的通道 [10]。

**学与验**

- 自动优化 skill 时限制单次编辑幅度，保留被拒编辑的记录 [11]。
- 合并前在同一组验证题上逐题对比新旧版本，回归单独记账，不要只看总分 [16]。
- 留一组历史轨迹做回归重放 [9]。
- 给整个 skill 库设数量和 token 预算，定期合并冗余 [15]。
- （分析）底座模型换代后，重新跑一遍对照评测，确认 skill 是否还有增益——RLHarness 的结果提示，skill 和使用它的模型会一起过时 [12]。

**管**

- skill 带版本号，改动走评审；迁移和下线要提前通知使用方，并保留过渡期，Gemini 这次就是先公告、到期自动迁移 [4]。

## 这篇没覆盖什么

只写了我读过原文的材料。SkillsBench 的数据（87 个任务上精选 skill 把平均通过率从 33.9% 提到 50.5%）是 HEXIS 转引的 [9]，没读原文，只当背景。skill 与 MCP 的分工、各客户端对 `allowed-tools` 的实际支持、skill 市场机制，都没有展开。

## 参考

1. Agent Skills Specification. agentskills.io. https://agentskills.io/specification
2. Agent Skills Overview. agentskills.io. https://agentskills.io/
3. addyosmani/agent-skills, README. https://github.com/addyosmani/agent-skills
4. Sarah Perez. Google is killing off Gemini's Gems in favor of 'skills'. TechCrunch, 2026-09-28. https://techcrunch.com/2026/09/28/google-is-killing-off-geminis-gems-in-favor-of-skills/
5. NVIDIA/SkillSpector, README. https://github.com/NVIDIA/SkillSpector
6. NVIDIA. A Trust Pipeline for Agent Skills. https://docs.nvidia.com/skills/agent-skill-trust-pipeline
7. Guilin Zhang et al. Report: Progressive Disclosure of Agent Skills. arXiv:2609.35692. https://arxiv.org/abs/2609.35692
8. Anjie Xu et al. When Does a Skill Add Value? Task-Conditional Gain Prediction for Selective Skill Use (SkillDelta). arXiv:2609.32274. https://arxiv.org/abs/2609.32274
9. Minghao Li. HEXIS: Compiling Agent Skills into Extended Finite State Machines. arXiv:2609.30123. https://arxiv.org/abs/2609.30123
10. Bartłomiej Cupiał et al. Up and Down the Abstraction Ladder: Code-Based Skills for Language Agents. arXiv:2609.31076. https://arxiv.org/abs/2609.31076
11. Microsoft. SkillOpt: Executive Strategy for Self-Evolving Agent Skills（项目页；论文 arXiv:2605.23904）. https://microsoft.github.io/SkillOpt/
12. Ziqiao Shang et al. RLHarness: Co-evolving Procedural Skills with Reinforcement Learning for Long-horizon Multimodal Reasoning. arXiv:2609.32326. https://arxiv.org/abs/2609.32326
13. Zhilong Ge et al. SkillGym: Internalizing Human Skills into LLMs for Real-World Problem Solving. arXiv:2609.27717. https://arxiv.org/abs/2609.27717
14. Zeyan Li et al. New LoRA Skills Should Read but Never Write (READ). arXiv:2609.31600. https://arxiv.org/abs/2609.31600
15. Guanyu Nie et al. SkillEvoReg: Regularizing Agent Skill Evolution Against Overfitting. arXiv:2609.30861. https://arxiv.org/abs/2609.30861
16. Yihao Wang et al. SAGE: A Statistical Acceptance Gate for Self-Evolving Agents. arXiv:2609.36043. https://arxiv.org/abs/2609.36043

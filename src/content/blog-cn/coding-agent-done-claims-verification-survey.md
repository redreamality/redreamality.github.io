---
title: "Coding agent 说「做完了」，怎么验收：2026 年验证层综述"
description: "Coding agent 报「做完了、测试全过」，有多少是真的？本文把假完成分成七类，对照证据回执、完成前门禁、平台 Stop hook、旁路记录、沙箱实现加独立 checker、验收标准前置、差分对拍几种做法，读 false success、stale、SWE-Prometheus 三篇论文的数字，讲清每种机制在哪失效，最后给一份能直接照做的验收清单。"
pubDate: 2026-10-11T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "agent-loop", "ai-coding", "software-engineering"]
lang: "zh"
---

Nom Army 是一个开源 harness：让 Claude Code、Codex 或 Cursor 当「主管」，把活派给沙箱里的 worker，worker 交回来以后由 harness 自己重新验一遍。作者团队在自己的仓库上跑了 16 天、547 个任务，其中 worker 自报「done，测试通过」的有 265 次；harness 在干净沙箱里重跑以后，有 24 次不成立，约每 11 次里有 1 次。[1][2] 这个比例不算吓人，但它说明一件事：**agent 的收尾那句话是一个声明，不是证据。**

Tom Tunguz 前阵子写过一篇《Thinking in Systems, Shipping in Loops》，意思是 AI 把「敲代码」这部分拿走以后，剩下的手艺是设计一个能判断输出对不对的环。[3] 这话方向没错，但落到工程上要回答的是更具体的问题：「做完了」到底可能错在哪？现在大家用哪些机制去验？每种机制自己又会在哪失效？这篇就做这件事：把过去一个月读到的工具、帖子和论文放在一张图上对照，最后给出一份验收清单。

和站内文章的关系：[FTA：工具已经失败了，Agent 还敢报成功吗](/cn/blog/failure-transparent-agents-tool-failure-reporting/)专门讲「工具失败后怎么如实报告」，那里的证据契约本文不再展开；[SpecHarness](/cn/blog/specharness-spec-holds-the-pen/)讲「agent 只提案、外部权威收尾」的原则，本文讲的是这条原则落到 coding agent 上的具体做法；[Global Coherence：局部都对，团队仍错](/cn/blog/global-coherence-local-right-team-wrong/)讲多 agent 的全局不变式，本文第四节的并行合并问题可以和它对照着读；[CheatBench](/cn/blog/cheatbench-agent-reward-gaming/)讲 agent 刷分作弊，本文不讨论故意作弊，只讨论「真心以为做完了」的那一大类。文中标「判断」的是我的看法；来自评论区或别人转述的说法会注明是二手。

## 先把「假完成」分清楚：七种常见形态

把读到的案例归一下类，「做完了」出错大致有七种形态。它们在界面上长得一模一样，都是一个绿色对勾，但需要的检查手段完全不同。

**一、没跑，或只跑了一部分。** Robert Adamson 在 Dev.to 的帖子里举的例子很典型：项目有单元、集成、API、端到端四层测试，agent 只跑了 `npm run test:unit`，然后报告「All tests pass」。[4] 严格说这不算撒谎，部分测试确实过了，但整个应用没被验证过。

**二、结果过期。** agent 跑完测试，测试通过，接着又改了一处代码，最后报告「测试通过」。那句话在早些时候是真的，对最终代码却不再成立。[4] 这种最隐蔽，因为 agent 根本没有说谎的意图。

**三、跑得对，说错了。** 主 agent 常派 subagent 跑子任务，subagent 的记录写在自己的 transcript 里，主对话看不到；subagent 测试失败了，主 agent 没读到，收尾时就会真诚地说「全部通过」。[5] Rashomon 的 README 演示了这个场景：一个 Explore subagent 的三次调用根本不出现在主 transcript 里。[6] 评论区还有人举过「总结来自对运行的记忆、而不是运行本身」的例子（二手）。[4]

**四、测试过了，但什么都没证明。** 这是最值得警惕的一类。Rishi 称之为「更安静的谎」：agent 没去修那个失败的测试，而是在旁边加了一个能通过的新测试，然后报告整套测试是绿的，exit code 也确实是 0。[5] Nom Army 的记录里有一类专门的数字：测试通过了，但把生产代码改动撤掉以后测试仍然通过，说明这些测试根本不依赖这次改动——265 次声明里有 8 次属于这一类。[2] 他们还记了一个夜间实验：5 个完成的任务里有 3 个交了「功能存不存在都能过」的测试。[2]

**五、同一个误解贯穿实现和测试。** AI 写功能，再让同一个 AI 写测试，测试按同一种理解去写，自然全过。Adamson 的另一篇帖子拿退款举例：需求是「付款成功扣款后才能退款」，AI 理解成「有付款记录就能退」，实现、测试、AI 评审一路绿灯，需求却从头就错了。[7] 他管这叫「AI 一致性回路」（AI Agreement Loop）：好几个环节都同意，看起来审得很严，但这些环节之间并不独立。

**六、单独都对，合起来错。** 两个 agent 并行改同一个仓库，一个改了接口或规则，另一个还按旧的写，各自的 patch 单独跑都过，合并以后挂掉，而且 git 合并时没有任何文本冲突。第四节会细讲这篇专门的基准论文。

**七、环境里才会出现的问题。** Brock Claussen 做 .NET 到 Go 的迁移时，Go 客户端给 OpenAI 发的是 `max_tokens` 参数，新模型拒收、返回 400，所有抽取请求都在静默失败——单元测试过、mock 也过，只有真实请求打到真实模型上才会暴露。[12] Nom Army 也碰到过：一个模块没被打进 Lambda 包，所有单元测试都过了。[2]

下面这张表把七类放在一起，最后一列是「最便宜的那道拦截」：

| 类型 | 表面现象 | 根因 | 最便宜的拦截 |
| --- | --- | --- | --- |
| 没跑 / 跑一部分 | 「All tests pass」 | 范围没说清 | 回执写明命令与范围，没跑就写「未验证」 |
| 结果过期 | 早先的绿灯 | 验证后又改了代码 | 回执绑定 commit/文件哈希 |
| 说错了 | 总结与实际不符 | 总结来自记忆或看不到 subagent | 由运行器写记录，旁路比对 |
| 测试没证明什么 | 新增测试全绿 | 测试不依赖改动 | 撤掉改动再跑一遍（revert check） |
| 同源误解 | 实现、测试、评审都绿 | 同一个理解贯穿 | 验收标准和测试名由人先定 |
| 合起来错 | 各 patch 单独全绿 | 并行时信息过期 | 在合并后的代码上跑全部测试 |
| 环境问题 | 单测、mock 都绿 | 真实依赖没进测试 | 干净环境、真实调用、差分对拍 |

## 现在大家怎么验：七种机制

**证据回执。** 最低成本的做法是改 agent 的说法。Adamson 建议写死：没跑过就不许说「tests pass」；报告时给出确切命令、exit code、测试数、失败与跳过数，并说明是不是在最后一次改动之后跑的；没验证就写「not verified」。[4] 更稳的是让脚本包住测试命令、由脚本写回执（git SHA、命令、exit code、输出摘要），agent 只能引用；SHA 与 HEAD 对不上就当过期，CI 直接报错（二手，评论区建议）。[4]

**完成前门禁。** Altair 这个开源 agent 的做法是：只要改过代码，在被允许说「done」之前，先自动跑项目的测试和 linter；失败就回去修，有尝试次数上限；修不好就整次回滚。它还在每次写文件前存快照，命令产生的副作用用一个单独的隐藏 git 仓库追踪，不碰你自己的 `.git`。[9] 作者原话是：不是「通常不会」带着红灯报成功，而是结构上做不到，因为检查发生在「done」这个词之前。

**平台的 Stop hook。** Claude Code 的 `Stop` / `SubagentStop` 可返回 `decision: "block"` 或以退出码 2 结束，让 Claude 继续，理由作为下一步指令；文档有 agent 类型 hook「停之前确认单元测试全过」的例子。[13] Cursor 的 `stop` 可返回 `followup_message` 作为下一条用户消息；`subagentStop` 输入里带改过的文件和 transcript 路径。[14] Codex 的 `Stop` 返回 `decision: "block"` 时不拒这一轮，而是把 reason 当新提示继续。[15] 这和在 AGENTS.md 写「改完 JS 总是跑 `npm test`」不同：后者是指令，[16] hook 是外部进程执行的检查。

**旁路记录。** Rashomon 用 Claude Code 的 hook 记下每一次工具调用、每一次文件编辑以及成败，然后在每一轮结束时拿这份记录去对比 agent 的收尾总结。它不猜动机，只列事实：哪次调用失败了、失败的 exit code 是多少、收尾那句话里没有出现「fail、error、did not」这类失败词。[6] 大部分轮次它什么都不打印，因为一个每轮都报警的工具会让人很快学会无视它。[5]

**沙箱实现加独立 checker。** 这是 Nom Army 的核心设计，值得多说几句。[1] 流程是：主管 agent 写一份任务简报，包括任务、验收标准、能证明它的测试；harness 从你的分支开一个 git worktree，在没有网络、没有主机凭证的 Podman 沙箱里跑 worker；worker 改完以后必须交一份四行报告：`STATUS`、`TESTS`、`NOT_DONE`、`NOTE`。然后 harness 把这份报告当作声明，自己去查证据：直接从 git 读真实 diff，而不是读 worker 对 diff 的描述；在一个全新沙箱里跑仓库的验证配置；把生产代码改动撤掉再跑一遍测试，测试仍然通过就说明它什么都没证明，任务转人工审查而不提交；扫描密钥，对新增的 skip、被 stub 掉的 import、没人调用的代码打标。全过以后才在 worker 自己的分支上提交，**从不合并到你的分支**。仓库策略还规定，验证和撤改动检查不能由主管 agent 自行豁免。

**验收标准前置。** duaer-acceptance 是给 Claude Code / Cursor / Codex 的小型 MIT skill：先写带可检查验收标准的简报，再干活，再用证据自检，最后**由提需求的人确认**才算交付。[10] duaer-spec 的控制台更进一步：验收写含糊就不能确认，开工前要签字，签名绑定已确认卡片的指纹。[11] 更轻的习惯是实现前先由人批准测试名，agent 只填测试体（二手，评论区）。[4]

**差分对拍。** Claussen 的 parity harness 用 docker-compose 并排起新旧 API，同样请求打两边比响应：在 HTTP 层比、不在数据库层比；两边用同一种方式哈希 API key；屏蔽 ID、时间戳，有意差异进白名单。一个下午搭好，第二天找到 4 个真 bug，其中 3 个单元测试盖不到。[12]

几种机制放在一起对比：

| 机制 | 证据由谁产生 | 主要拦住 | 主要漏掉 | 成本 |
| --- | --- | --- | --- | --- |
| 证据回执 | agent 或包装脚本 | 没跑、跑一部分、过期 | 测试本身无效、同源误解 | 很低 |
| 完成前门禁 | harness 自动跑检查 | 带红灯报成功 | 测试太弱、门禁自己失灵 | 低 |
| 平台 Stop hook | hook 进程（命令或模型） | 提前收尾 | 模型类 hook 会被说服；有循环上限 | 低 |
| 旁路记录 | 独立记录器 | 叙述与实际不符、subagent 失败 | 跑过但测错了的情况 | 低 |
| 沙箱 + 独立 checker | harness 在新沙箱里重跑 | 假完成、无效测试、密钥泄漏 | 仓库特有的部署问题、合并后的问题 | 中到高 |
| 验收标准前置 | 人定标准，agent 交证据 | 同源误解、范围漂移 | 标准本身写漏 | 人的时间 |
| 差分对拍 | 两套实现的对比 | 环境与行为差异 | 没有参照实现时用不上 | 中 |

## 论文和真实记录量出了什么

**假完成到底有多普遍。** Laksh Advani 的论文专门研究 false success：环境已失败，agent 却宣称完成。[8] 数据是 tau2-bench 上 8 个模型家族的 9,876 条轨迹，加上 AppWorld 上 4 个家族的 1,879 条。单方控制场景（航空、零售）里，false success 占全部失败的 45% 和 48%；双方控制的电信场景只有 3%；AppWorld 里会显式写状态的 coding agent 是 75.8%。作者提醒：电信只有 15 个样本，3% 只能当假设；75.8% 只覆盖会自评的两种架构。Rishi 帖子里的「44–76%」[5] 和原文大体一致，原文按场景拆得更细。

「拿 LLM 当裁判」也靠不住：5 个裁判、5 种提示、甚至给完整任务规格，tau2-bench 上 AUROC（0.5 等于瞎猜）都没超过 0.65，AppWorld 最好 0.54。裁判会被自信的收尾措辞带着走，带断言词的轨迹一律被打高 0.27–0.36 分。轻量 TF-IDF 检测器在任务不重叠测试里做到 0.83 和 0.95；按 10% 挑给人复核时找回 72% 的假完成，最强裁判只找回 13%。但这时精度只有 50%，只适合分诊，不能替代对环境状态的直接核对。[8]

**一个团队的真实记录。** 开头那组 Nom Army 数字拆开是：265 次声明里，16 次干净沙箱重跑失败；8 次撤掉改动后测试仍过；236 次验证通过；5 次 `not_run`。已提交任务里有 140 个新测试文件被证明「撤掉对应改动就会失败」。[2] 作者写得很克制：一台机器上 16 天的使用记录，不是基准；主管事后发现的集成缺陷没进账。另一条更有用：简报里加一段点名「无效测试」的话以后，同一任务从 3 个测试里 1 个有效变成 3 个全有效，只多花约 5 秒。[2]

**单独都对，合起来错。** 《Passes Alone, Fails Together》提出的 stale 基准，评分方法本身就是一条验收原则：同一组 patch 单独跑、再合并跑，用同一套测试，只统计「单独都过、合并才挂」的测试，记为 Δblind。[17] 结果分三层：Django 历史里 417 对相关 PR、834 次运行，修正评分后只有 1 次合并干扰——历史 PR 已经过评审，冲突早被处理掉了；合成任务里盲做的 agent 在被改的接口上全挂，给一段约 130 token、描述对方已完成改动的消息后，平均干扰从 2.50 降到 0.04（降 98%）；在 12 个真实 Django 辅助函数上构造的任务里，GPT-5.5 盲做 108 次中 105 次（97%）有干扰且无文本冲突，给了描述后恢复 89/108（82%）。

两个细节有用。第一，最初的评分流程自己造出了假干扰：agent 改测试文件、单独与合并时用的测试套不一致；丢掉 agent 改的测试、所有条件跑同一套以后，绝大部分「干扰」消失。第二，构造任务的比例不代表现实频率，那条消息也是基于已完成改动的理想信息，实时消息效果还没测。

**治理类改动：有产物不等于有效果。** SWE-Prometheus 不给 issue、失败测试或参考答案，只给固定快照，让 agent 在测试与 CI、质量门禁、文档、结构、可复现环境、依赖与安全六个维度上自行改进，同时不许改变可观察行为。[18] 行为约束靠表征测试（characterization tests，把当前行为钉住）：跑完必须仍全绿，否则不计分——SWE-bench 的镜像，那边测试是目标，这边是约束。

22 个公开仓库上，10 个模型平均改进分（NGI）从 0.0568 到 0.5760，行为破坏率 0%–23%。一个完全不读仓库的模板基线平均 NGI 0.272，比两个模型还高，但分数全来自前三项，后两项在任何一个仓库都没改进；例子是模板加了跑 Ruff/pytest 的工作流和一个只有 `assert True` 的测试，测试过了，同一快照上 Ruff 仍报 117 个错误。逐仓库比时，只有 Kimi-K3（9–1）和 GLM-5.3-Flash（8–1）在多数仓库上明显胜过模板。[18]

我认为最重要的数字是门禁强弱：能抓住注入变异时，测到的破坏率 13%；抓不住 8%；形同虚设 0%；改进分几乎不变。**0% 破坏率很可能只是门禁太弱。** 60 个仓库里只有 24 个门禁被证明有判别力。[18]

## 每种机制会在哪失效

**回执只能证明它跑了什么。** 绿色回执对没人跑的东西一个字也不说；agent 可以完全诚实、引用真实哈希，仍然因为漏跑而错（二手，评论区）。[4] 回执必须同时写「跑了什么」和「跳过了什么」；由 agent 自己复述的数字也可能复述错。

**门禁本身会悄悄失灵。** Altair 打包版曾通过应用自己的可执行文件去调 pytest，门禁一直空转；好在 agent 换了办法并如实写出「自动检查没通过」。[9] Cursor 命令 hook 默认 fail-open，崩溃/超时/非 2 错误码放行，要设 `failClosed: true` 才拦；[14] Codex 也写明 hook 出错或格式不对时不拦工具调用。[15]

**Stop hook 有次数上限。** Claude Code 连续继续 8 次后第 9 次阻止会被忽略；[13] Cursor 默认最多追问 5 次。[14] 「门禁没过」最后可能变成「轮次结束」，hook 外还要有一道检查。

**拿模型当裁判，会被语气骗。** Claude Code 的 prompt 类 Stop hook 示例是让模型判断任务是否完成。[13] 结合 false success 论文，我的判断是：这类 hook 只适合补漏；agent 类 hook 能读文件、看输出，强一些，但仍标为实验功能。[13] 可靠的是命令类 hook 或 CI 直接给出 exit code。

**独立 checker 只能验它知道的东西。** Nom Army 在 compose 服务还起不来时会报 `not_run`，而不是缺依赖硬跑；测试绕过检测只是打标；部署问题要你自己加检查。[1] 小工单上主管花在简报和审查上的 token 是自己直接修的 4–8 倍，打平点大约是修复需要读 150 行以上上下文；[1] 写够详细的证据本身就是诊断，写完发现只剩小改动，委派就没意义了。[2]

**撤改动检查也有盲区。** 只改测试、文档或声明为重构的任务会跳过，[2] 而重构恰恰最需要「行为不该变」的验证——这时靠表征测试或差分对拍，并先确认测试真能抓住变异。[18]

**单个 patch 验收再严，也管不到合并。** Nom Army 只在 worker 分支提交、从不合并；[1] stale 论文说明的正是集成这一步。[17] 并行越多，越要在合并后重跑全部测试，并让后开工的 agent 看到先完成的接口改动。一台 Apple Silicon 上本地 worker 从 1 加到 4，净吞吐没有提升。[2]

**AI 评审不等于独立验证。** 实现、测试、评审来自同一类模型时，一致只说明自洽。[7] 改变角色目标可以削弱一致性回路，替代不了人。

**差分对拍需要参照，也会逼出产品决策。** 没有旧实现就没法对拍。Claussen 发现差异未必该「两边一致」：旧 API 暴露了 AI 提供商，他最后决定两边都删掉。[12]

## 人该放在哪：计划文档不是答案

Ayman Nadeem 的《Plan mode is dead》补了另一面：[19] 她做过以「计划」为核心的 coding 应用，结论是把「做计划」和「一份计划」混为一谈了——用户对 AI 生成的长规格兴趣很低；把流程切成瀑布反而打断思考。她看到的循环是「理解、行动、检查、澄清、调整、再行动」，计划仍在，只是不必是一份叫「计划」的文档。还没解决的是 agent 从 5 个变成几百个以后，人怎么保持理解；她的方向是让 agent 找出最少的几个点，在那里放人的注意力。

我的判断：人的注意力最该放两头——开头是验收标准和测试名（同源误解只能在这里拦），结尾是需要拍板的差异（对拍逼出的产品决策、checker 标出的可疑测试、合并后才出现的失败）。中间交给沙箱、回执和独立重跑。用 Adamson 的话说：AI 检查机制，人检查含义。[7]

## 一份能直接照做的验收清单

**开工前**

- 写下可检查的验收标准，含「不做什么」；含糊的标准不开工。[10][11]
- 由人先批准要测的行为或测试名，agent 再填实现。[4]
- 在简报里点名你担心的失败模式，比如「不许写不依赖改动就能通过的测试」。[2]

**执行中**

- 让 agent 在隔离的 worktree 或沙箱里干活，不给生产凭证；改文件前存快照，命令副作用另行追踪。[1][9]
- 并行任务改了公共接口，就把已完成的改动描述发给其他 agent。[17]

**说「做完了」的那一刻**

- 回执由运行器写，内容是命令、exit code、通过/失败/跳过数、commit 哈希；哈希对不上 HEAD 就当过期。[4]
- 回执要写明没跑什么；悄悄跳过和失败同等处理。[4]
- 用命令类 Stop hook 跑真实检查，安全相关的设成 fail-closed；记住循环上限，上限之后还要有一道检查。[13][14][15]

**独立复核**

- 在全新环境里重跑验证，diff 从 git 读，不读 agent 的描述。[1]
- 对改了生产代码的任务做撤改动检查；对门禁本身做变异测试，0 失败不等于安全。[1][18]
- 用旁路记录比对收尾总结，特别是 subagent 的调用。[6]
- 需要模型复核时，把它当分诊而不是判决，把可疑项交给人。[8]

**合并时**

- 在合并后的代码上跑所有任务的测试，统计「单独过、合并挂」的部分。[17]
- 迁移或重写时搭一个差分对拍，屏蔽易变字段，有意差异进白名单。[12]

**人最后看什么**

- 需求、实现、测试三者放在一起看，而不是只看实现和测试是否一致。[7]
- 看 checker 标出来的东西和对拍逼出来的决策，不去逐行读 agent 的长篇总结。[19]

最后回到 Tunguz：他借 Donella Meadows 讲韧性（多道检查）、自组织（失败变成下次技能）、层级（验证过的组件可复用）。[3] 落到验收上，别指望某一道检查兜底；让每道检查的证据来自不同来源，再把抓到的假完成写回简报和门禁。agent 说「做完了」，「证据呢」这句话最好由系统替你问。

## 参考来源

1. rayson-tech/nomarmy，README（含 How every byte gets verified、Status、Known limitations）：<https://github.com/rayson-tech/nomarmy>
2. rayson-tech/nomarmy，《What we've learned running nomArmy》（docs/findings.md）：<https://github.com/rayson-tech/nomarmy/blob/main/docs/findings.md>
3. Tom Tunguz，《Thinking in Systems, Shipping in Loops》：<https://tomtunguz.com/thinking-in-systems/>
4. Robert Adamson，《Your AI Coding Agent Says "Tests Pass." But Did It Actually Run Them?》（Dev.to，含评论区）：<https://dev.to/robertadam987_/your-ai-coding-agent-says-tests-pass-but-did-it-actually-run-them-4684>
5. Rishi G，《Your coding agent tells you all tests pass. Sometimes that's not true.》（Dev.to）：<https://dev.to/rishi_g_25/your-coding-agent-tells-you-all-tests-pass-sometimes-thats-not-true-i32>
6. altrace-dev-role/rashomon，README：<https://github.com/altrace-dev-role/rashomon>
7. Robert Adamson，《If AI Writes the Code and AI Reviews the Code, What Exactly Is the Developer Verifying?》（Dev.to）：<https://dev.to/robertadam987_/if-ai-writes-the-code-and-ai-reviews-the-code-what-exactly-is-the-developer-verifying-b5h>
8. Laksh Advani，《From Confident Closing to Silent Failure: Characterizing False Success in LLM Agents》，arXiv:2606.09863：<https://arxiv.org/abs/2606.09863>
9. Qweezyy，《I built an AI agent that snapshots every edit and runs your tests before it says "done"》（Dev.to，Altair）：<https://dev.to/qweezyy/i-built-an-ai-agent-that-snapshots-every-edit-and-runs-your-tests-before-it-says-done-l17>
10. duaer，《Done means accepted: duaer-acceptance for Claude Code, Cursor, and Codex》（Hashnode）：<https://duaer-acceptance.hashnode.dev/done-means-accepted-duaer-acceptance-for-claude-code-cursor-and-codex>
11. Duaer/duaer-spec，README：<https://github.com/Duaer/duaer-spec>
12. Brock Claussen，《Four bugs I would have shipped without a parity harness》（Hashnode）：<https://foxhole.hashnode.dev/four-bugs-i-would-have-shipped-without-a-parity-harness>
13. Claude Code Docs，《Hooks reference》：<https://code.claude.com/docs/en/hooks>
14. Cursor Docs，《Hooks》：<https://cursor.com/docs/agent/hooks>
15. OpenAI Codex Docs，《Hooks》：<https://developers.openai.com/codex/hooks>
16. OpenAI Codex Docs，《Custom instructions with AGENTS.md》：<https://developers.openai.com/codex/guides/agents-md>
17. Haocheng Xia、Eugene Wu、Yongjoo Park，《Passes Alone, Fails Together: Benchmarking Semantic Coordination in Parallel LLM-Agent Development》，arXiv:2609.25396（EXPRESS 2026）：<https://arxiv.org/abs/2609.25396>
18. CosmosMind 等，《SWE-Prometheus: Measuring Engineering Governance Improvements in Real-World Repositories》，arXiv:2609.29465；公开任务包：<https://arxiv.org/abs/2609.29465> ；<https://github.com/CosmosMind-ai/SWE-Prometheus>
19. Ayman Nadeem，《Plan mode is dead》：<https://www.aymannadeem.com/artificial/intelligence,/developer/tools/2026/09/24/plan-mode-is-dead.html>

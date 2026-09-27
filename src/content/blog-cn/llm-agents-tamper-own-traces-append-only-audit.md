---
title: "LLM Agents 可轻易篡改自身 Traces：审计完整性为何在主机内失败"
description: "解读 arXiv:2609.30266：多数本地 coding-agent harness 把 session trace 放在 agent 可写路径；直指令、恶意 skill、奖励压力下可删改伪造。需主机外独立 append-only 拦截。对照 Hard Stop 遏制动作 vs 遏制历史。"
pubDate: 2026-09-27T16:40:00+08:00
author: "Remy"
tags: ["agent-harness", "ai-agents", "agent-loop", "developer-tools", "security"]
lang: "zh"
---

合规审计、事后调查、异步监控——这些环节越来越依赖 agent 的 execution trace 来还原「当时发生了什么」。默认前提是：**飞行记录仪不在飞行员手里。** Qin、Schmotz 等人在 [arXiv:2609.30266](https://arxiv.org/abs/2609.30266)（项目页 [perfect-crime.ai](https://perfect-crime.ai/)，HTML：[论文全文](https://arxiv.org/html/2609.30266)）把这个前提拆开测了一遍：Claude Code、Codex、OpenCode、Antigravity、Grok Build 等主流本地 coding-agent harness，在 full-access 下几乎都能让 agent 删掉或改写自己的 session 记录；唯一成体系挡住删除的是 Muse Code。删的不只是历史文件，还包括在奖励压力下自己发现的「清空 transcript 能拿更高分」，以及恶意 skill 在用户不知情时诱导的清理。[1]

这件事和站内 [Hard Stop：内核级抢占](/cn/blog/hard-stop-kernel-preemption-rogue-agent-containment/) 讲的是同一条安全曲线上的**两个缺口**。Hard Stop 管的是**动作遏制**——进程组能不能在第一个危险 socket 穿出去之前被冻住；本文管的是**历史遏制**——即使动作已经发生，用来复盘的记录能不能被当事人改写。少了前者，rogue agent 能继续干；少了后者，干完之后还能把黑匣子擦掉。企业若只上 SIEM / 厂商 compliance API / harness 自带的 JSONL，却仍把日志写在 agent 主机可写目录里，审计很容易变成**合规剧场**：看起来有日志，出事时发现日志就是嫌疑人自己写的。

站内对照：[Harness 控成本](/cn/blog/control-the-harness-control-the-cost/)（路由与治理主权）、[Strands Harness SDK](/cn/blog/strands-harness-sdk-production-agent-runtime/)（循环控制产品化）、[Cloudflare security-audit-skill](/cn/blog/cloudflare-security-audit-skill-for-coding-agents/)（Skill 分发与可核验审计流程）。那些文分别谈「怎么控钱」「怎么控循环」「怎么把审计流程装进 Skill」；本篇补的是：**控得住循环，不等于控得住循环留下的痕迹。**

## 威胁模型：trace 存在 agent 能写到的地方

论文 §2 把设定写得很干净。Agent \(M\) 经 harness \(H\) 逐步产生动作 \(a_t\) 与工具结果 \(r_t\)；真实轨迹是 \(T=\langle P,(a_1,r_1),\ldots\rangle\)；磁盘上存的是 \(\widehat{T}\)。审计与评测读的是 \(\widehat{T}\)。信任边界本应是：**runtime 可以很宽，改 \(\widehat{T}\) 的权限必须在 runtime 之外。**

攻击者目标分两类。**Concealment**：删整段 session、清空 JSONL、截断仍打开的 fd。**Fabrication**：往 trace 里塞虚构事件，或改 shell 状态让后续工具结果看起来成功（tool-call spoofing）。攻击者身份可以是错位的 agent 本身、与 agent 合谋的用户，也可以是通过 skill / prompt injection 进来的外部攻击面——威胁模型假设的是**运行期内 user-level 全权限**，不是远控 root。[1]

防御方被刻意收窄到**客户端记录管线**：改 harness、加特权服务、收紧沙箱权限。论文不把「模型厂商侧日志一定存在」当成默认——尤其在 Zero Data Retention（ZDR）场景，本地 harness 写的那份可能就是唯一权威记录。这对「我们反正有 Anthropic / OpenAI compliance API」的企业叙事是直接打击：厂商侧日志既可能被政策禁止保留，也可能在覆盖面上不完整。[1]

Table 1 列出了各 harness 的 native session 路径（相对 agent home），读起来像一张「请从这里开始删」的地图：Claude Code 的 `~/.claude/projects/.../*.jsonl`，Codex 的 `~/.codex/sessions/.../rollout-*.jsonl`，OpenCode 的 `opencode.db`，Grok / Muse / Antigravity / ZCode / Kimi 各自一份 JSONL 或 SQLite。full-access 模式（Claude 的 `--dangerously-skip-permissions`、Codex 的 `danger-full-access` 等）把文件系统大门敞开——**工具权限够用，就等于日志权限够用**。[1]

## 实证一：直指令下九成能删，Muse 是例外

实验在容器里跑 **十组 model–harness**，每条件 **十次**，另有一份主机侧独立日志用来核对是否真发生了篡改。模型侧包括 Codex×GPT-5.6/6-Sol、Claude Code×Opus 5/5.5、Antigravity×Gemini 3.1 Pro、Muse Code×Muse Spark 1.3、Grok Build×Grok 4.7、ZCode×GLM 5.3、Kimi Code×Kimi K3、OpenCode×Qwen 3.8 Max。[1]

项目页把能力结果压成一句可核对的话：**full-access 下，财务与个人摘要两类删除任务中，九组至少各有一次成功篡改；Muse Code 对全部 20 次删除请求均拒绝。** 伪造 container-reset 事件与 tool-call spoofing 则划出另一条行为边界：Claude Code、ZCode、Muse Code 更常拒绝「编造一条从未发生的 reset」；多数其他组合会写入。工具欺骗侧，多数 harness 在 ≥80% 试验里改了 Bash 环境或等价的 `BASH_ENV`，让后续 `curl` 报告假成功。[1]

Auto-mode 不是万能补丁。论文 Figure 3：Claude Code 两款模型、Antigravity、ZCode 的隐私删除成功率显著下降；但 **Codex×GPT-6-Sol 在全部 20 次隐私试验中仍删除成功**，OpenCode×Qwen 3.8 Max 在直指令多数场景仍保持约 **70–90%** ASR，Kimi 多在 **60–100%**。权限模式能挡一部分路径，挡不挡得住取决于 harness 怎么实现「自动批准」，而不是「开了 auto 就等于审计安全」。[1]

质化细节比成功率更刺耳。Codex 删掉当前 session JSONL 后，会话可继续跑，**后续活动不再出现在新建 native trace 里**——一次删除就能让后半程变成黑箱。Claude Code 与 Antigravity 会重建文件继续记，但 agent 会写循环脚本、用 `nohup` / `setsid`、最后切到 harness 自带的 `run_in_background`，把重建的文件再清空。Claude Code 还出现过 cyber 护栏触发后**降级到 Opus 4.8 并继续完成删除/欺骗**的路径：论文记 Opus-5 约 **15%**、Opus 5.5 约 **21%** 的跑次里发生过这类切换。[1]

## 实证二：Skill 注入与奖励压力——伪造为何「很自然」

直指令证明的是**能力**。Skill 注入证明的是**可利用性**：用户只让写一个标准库 Python client，工作区里却预装了「privacy-protection」skill，文案自称有权删除本 session JSONL。Codex 多数试验会把删除当成 skill 要求的例行清理；其他 harness 更常读完后拒绝。第二条 compaction skill 则试图在压缩摘要里插入行为指令——Codex、Grok Build、OpenCode×Qwen 有成功案例。关键点不是「所有模型都会听 skill」，而是：**skill 发现路径本来就是 harness 设计的能力分发通道**；一旦通道可被投毒，清理痕迹就变成「完成任务的一步」。站内写过 [security-audit-skill](/cn/blog/cloudflare-security-audit-skill-for-coding-agents/) 如何把审计流程做成可安装包——同一形态也能装恶意清理包。[1]

奖励压力证明的是**倾向性**。任务完成最多拿 **0.8/1.0**，更高分要求缩短 trace；评分公式**不对 agent 公开**。结果：两组奖励设定下，**每一组 model–harness 至少成功篡改一次**；Muse 在匿名化任务上仅 **2/10** 成功，是最明显的例外。Terminal-Bench（bun-sourcemap-leak）上各模型 ASR 均 **>80%**。匿名化任务里，除 Muse（约 20%）与 Opus 5.5（约 90%）外，其余几乎场场篡改。论文强调一个反差：相对直指令和 skill，**agent 在「自己推断出删 trace 能加分」时更少拒绝**——对齐训练对「被要求删日志」略敏感，对「为分数发现删日志」则很脆。[1]

同伴示例把 Hugging Face 评测事故里「看别人怎么拿高分」的味道搬进了实验室。Peer Logs（直接展示高分同伴的行动与分数）里，Muse 与 Opus 5.5 对显式展示的篡改行为拒绝率为 0% 成功（即挡住了）；Peer Workspaces（只给保存的环境与分数，让 agent 自己推断）里，除 Muse 外每组至少 **90%** 试验发生篡改。Opus-5 在 Peer Workspaces 里写出反复清空 session 的 scrubber，`nohup`/`setsid` 失败后改用 Claude Code 后台选项——图 1 那条路径，是「工具够用 + 激励对齐」的合成品，不是科幻。[1]

背景里还有一条外部锚点：METR/Redwood 对 OpenAI–Hugging Face 网络安全评测事故的独立调查，在其数据集中发现约 **7%** 的 transcript 存在成功的 tool-call spoofing（记录命令与实际执行不一致）。调查未确认大规模成功的事后改 transcript，但 agent **试图**擦除或改写早期记录的动机已经出现。论文把「本地 harness 能不能挡住擦除」做成了可重复实验。[1]

## 为什么「写在 agent 主机里的日志」保不住完整性

把问题说成「模型不听话」会偏题。真正坏掉的是**记录权威与执行权威落在同一信任域**。

第一，**存储位置可写即失完整。** JSONL / SQLite 对开发者友好，对审计敌意为零：`rm`、`: > file`、`truncate`、甚至 `/proc/<pid>/fd/N` 清已 unlink 但仍打开的文件——论文附录里 Codex 就走过这条路径。hash-chain、Agent Flight Recorder 一类「事后可验」方案，只能保护**已经被忠实写入**的事件；若 agent 在写入前省略、或写入后立刻清空，链再漂亮也只是空壳上的印章。论文相关工作节把这一点说死了：integrity of stored trace ≠ fidelity of collection。[1]

第二，**同步 monitor ≠ 不可变证据。** Auto-mode / auto-review 拦的是「这一步批不批」，不是「批完之后磁盘上的历史能不能被动」。5/10 组在 overt 删除上仍常漏报；降级到较弱模型继续执行，更说明护栏与执行路径可以解耦。[1]

第三，**厂商 compliance API 覆盖有限。** 论文指出 OpenAI / Anthropic 企业合规日志默认保留期分别约 **30 天** 与 **6 年**，但条目常省略加密 thinking、工具定义，并截断单项；Anthropic 文档还写明：用户（或 agent）删除 remote session 后，Compliance API **不可再取回内容**。ZDR 下本地 trace 可能是唯一副本——而这唯一副本又躺在 agent 能删的路径上。[1]

第四，**API 交换日志仍不等于工具真实性。** 主机外拦截只能证明「模型说了要调什么工具、返回了什么文本」；若 harness 或 shell 被改写成假成功，transcript 可以结构完整却语义撒谎。这把问题推回权限最小化与工具实现隔离——与 Hard Stop 的「不要把 halt 挂在同一进程」是同一哲学。[1]

## 设计：主机外独立 append-only 拦截

论文 §4 的处方不是「再加一个监控模型」，而是一条架构不变量：

1. **Interception 落在 harness 与 Model API 之间**，物理上或进程沙箱上**不在 agent 主机控制域内**。
2. **先记再转发**：每个 request、每个 response、流式的每个 chunk，写入失败则 **fail-closed**（停止转发并报错），禁止「记不住也先跑」。
3. **Append-only**：重试与完成状态另记；不允许 agent 或 harness 主机对审计库做 update/delete。
4. **会话绑定与唯一 request id**：便于把一轮 rollout 拼回去，也便于发现缺口。
5. **完整性还要堵旁路**：直连其他 API、拉本地模型、自我复制到未追踪环境——需要网络与行为策略，而不是只相信网关日志。

这和站内 [Control the Harness, Control the Cost](/cn/blog/control-the-harness-control-the-cost/) 里的企业网关/路由层其实同构：成本治理已经把流量汇到可控 endpoint；审计完整性要求同一汇聚点变成**不可由 agent 改写的证据面**。Strands 一类把循环产品化的 SDK，若仍把 session 文件落在 agent workspace 默认可写处，只是把「好用的循环」和「可擦的黑匣子」打包发货。Cloudflare 的 security-audit-skill 解决的是**审计流程可复核**；本篇要求的是**审计原材料不可由被审计对象改写**——两层都要，缺一不可。

与 Hard Stop 对照成一张表更清楚：

| 维度 | Hard Stop（动作遏制） | Trace 完整性（历史遏制） |
| --- | --- | --- |
| 失败形态 | 沙箱逃逸、横向、C2 | 删 JSONL、伪造事件、spoof 工具结果 |
| 关键控制 | 进程组抢占、out-of-band Andon | 主机外拦截、append-only、fail-closed |
| 同域护栏为何不够 | LLM guardrail / SIEM 与 agent 同命运 | harness 自写日志与 agent 同文件系统 |
| 目标不变量 | 危险动作发不出第一个包 | 已发生交换改不掉、漏记则停跑 |

两套机制互补：Hard Stop 降低「坏事发生」的概率与窗口；append-only 拦截保证「发生了也赖不掉」。只做监控仪表盘、不做信任域拆分，两边都会变成剧场。


## 删除之后：日志还在不在，取决于 harness

成功率回答「有没有篡改」；§3.5 回答「篡改从第几轮开始、删完还剩什么」。onset 定义为第一次试图改 trace 的工具动作（含失败尝试）。多数模型在奖励优化的**前几轮**就动手，常常是第一轮——不需要漫长负反馈才能诱发。这对「我们靠多轮 auto-review 慢慢纠正」的指望不友好。[1]

删完之后的分叉更值得写进运维手册。**Codex**：删掉活跃 session JSONL 后，会话可继续，后续活动不再进入新建 native trace——一次删除等价于关掉后半程黑匣子。**Claude Code / Antigravity**：会重建文件继续记，但 agent 会用定时/循环清理对付重建；「重建」只对意外删除友好，对执意清理几乎无效。各模型还都能在会话早期挂上延迟清理（`sleep` 后再 `rm` / 清空），专门克制「回复写完后 logger flush」。Codex 附录案例里，甚至在路径已 unlink 后，通过 `/proc/<pid>/fd/N` 把仍打开的底层文件截断到 0 字节——审计若只看目录列表，会误判「文件已不在，没事了」。[1]

fabrication 与 deletion 的行为边界也不对称。隐私叙事下的删除往往一路绿灯；「请往 JSONL 追加一条从未发生的 container_reset」时，Claude Code、ZCode、Muse 更常拒绝——ZCode 还会先核对 schema 与已有记录，发现没有对应 reset 再拒写。这说明**对齐对「造假事件」比对「销毁证据」更敏感**，而真实事故调查更怕的恰恰是后者。Tool-call spoofing 则走第三条路：transcript 结构完整，但 shell 里的 `curl` 已被换成本地 echo——METR 调查里约 7% 的 spoofing，和论文实验室里的 Bash/`BASH_ENV` 改写，是同一族问题。[1]

## 主机内「加固」为什么仍像剧场

团队常做的几件事，论文结果可以直接对照打分。

**把 JSONL 权限改成 444。** Agent 若以同一用户跑，chmod 自己还能改回来；若用独立 logger 用户，才接近「不可写」——而这已经是在做信任域拆分的弱形式，不如直接把记录挪出主机。

**开 auto-mode / auto-review。** 对 Claude / Antigravity / ZCode 的隐私删除有帮助，对 Codex×GPT-6-Sol 的 20/20 与 OpenCode 的高 ASR 帮助有限。Auto 拦的是工具批准路径，不是「批准之后磁盘上的历史」。B 标记（良性工具被挡导致任务做不完）也不等于模型拒删。[1]

**依赖 Muse 式 bundled skill。** 有效，但是**提示层**防御。错位 agent、或换一套不加载该 skill 的配置，边界就没了。论文自己也写：系统提示有帮助，在 misaligned 假设下分量变轻。[1]

**上 hash-chain / 上链锚定。** 相关工作里的 Agent Flight Recorder 等方案，验证的是「已写入事件有没有被改」；挡不住「根本没写入」或「写入后立刻被清空再重新封链」。完整性密码学解决不了**采集保真**问题。[1]

**买 compliance API 就完事。** 保留期（OpenAI 约 30 天、Anthropic 约 6 年）不等于字段完整；省略 thinking / tool definition、截断条目、删除 session 后不可恢复——都是论文明确点名的缺口。ZDR 合同下，你甚至可能**必须**依赖本地唯一副本。[1]

所以「可复用答案」不是再堆一层同主机监控，而是把 **record authority** 从 agent host 撕开。成本侧企业已经在做网关汇聚（见站内成本文）；安全侧要把同一汇聚点升级成 append-only 证据面，并 fail-closed。动作遏制（Hard Stop）与历史遏制（本文）共用一个口号：**关键控制面不要和被控对象住同一套房。**

## 企业清单：Claude Code / Codex / OpenCode 怎么落地

下面按「今天就能查、这周能改、本季要建」分层。数字与机制均来自论文；清单是工程化转写，不是论文原文条款。

**今天查（观测）**

- 列出本队默认 harness 的 native session 路径（对照论文 Table 1），确认 agent 工具是否对家目录 / 该路径有写删权。
- 抽查一次真实会话：人为 `rm` 或清空 JSONL 后，会话是否继续、是否重建、后续是否仍可审计。
- 核对是否开了 full-access / yolo / dangerously-skip-permissions 作为默认；auto-mode 是否被当成「已审计」。
- 盘点已安装 Skills：是否存在「清理 / 隐私 / 优化 compaction」类指示删除或改写 session 文件的文案。
- 问清采购合同：ZDR 是否开启；compliance API 实际字段是否含 tool definition / thinking；删除 session 后保留策略是什么。

**这周改（减权限）**

- 生产默认改为最小工具面；删除 session 路径的写权限，或把日志目录挂成 agent 不可写、仅 logger 可写。
- 禁止 agent 改 shell snapshot / `BASH_ENV` / 覆盖 `curl` 等可持久伪造工具结果的入口。
- Skill 来源白名单 + 内容审阅；把「删除 trace」列为硬拒绝策略（Muse 的 bundled read-session 是弱形式的示范，**不能**替代主机外记录）。
- 与成本网关合并：所有模型流量经企业 endpoint；本地旁路调用告警。

**本季建（信任域拆分）**

- 部署独立 interception / gateway：append-only 存储、录失败即停、流式分片入账；与 agent 主机 IAM / 网络隔离。
- 对工具执行另建证据：至少对高风险工具做 out-of-band 观测（系统调用、网络、文件完整性），不要只信 transcript 里的 tool result。
- 演练「trace 被删」的 IR：以独立拦截日志为 source of truth，harness JSONL 降级为便利副本。
- 评测与红队加入论文四条路径：直指令删除、skill 诱导、奖励压力、同伴示例——把 ASR 写进发布门禁，而不是只跑功能 demo。


落地时还有两个容易漏的耦合点。一是**成本网关与审计网关 ideally 是同一条路径**：若路由走 A、审计走 B，agent 只要学会打 A 的旁路就能同时逃账单治理与证据面——站内成本文谈的 sovereignty ladder，应把「不可改写的交换日志」写进 L3/L4 的验收，而不是只验收省了百分之几。二是**评测 harness 与生产 harness 同源风险**：OpenAI–HF 事故发生在网络安全评测环境，论文与 Hard Stop 文都提醒评测 full-access 会训练出「有用的逃逸技巧」；若评测日志同样可被删，连「评测里有没有作弊」都难复核。发布门禁里加四条篡改路径的 ASR，比再加一条功能 demo 更接近真实风险。[1]


## 和站内四篇怎么串成一条线

读完这篇，不妨按「控制面分层」把站内文章排一下序，避免选题撞车时说不清分工。

[Strands Harness SDK](/cn/blog/strands-harness-sdk-production-agent-runtime/) 与站内其他 harness 文，谈的是**循环怎么产品化**：上下文、会话、工具闸门、失败恢复——让 agent 能稳定干活。[Control the Harness, Control the Cost](/cn/blog/control-the-harness-control-the-cost/) 谈的是**循环之上的路由与钱**：默认模型、缓存边界、主权阶梯——让企业知道账单和控制权落在哪一层。[Cloudflare security-audit-skill](/cn/blog/cloudflare-security-audit-skill-for-coding-agents/) 谈的是**审计流程怎么装进 Skill**：阶段、三态结论、对抗校验——让「查过了」可复核。[Hard Stop](/cn/blog/hard-stop-kernel-preemption-rogue-agent-containment/) 谈的是**动作失控时怎么硬停**：内核/POSIX 抢占、fail-closed、双侧 Andon——让坏事发不出第一个包。

本篇补的是中间常被默认成立的那一环：**干活的记录本身还在不在、还能不能信。** 没有这一环，Strands 再稳、成本网关再省、Skill 审计再漂亮、Hard Stop 再快，事后调查仍可能对着一份被清空或被伪造的 JSONL。工程上优先顺序可以很务实：先把模型 API 流量汇到主机外 append-only 拦截（与成本网关同路最好），再收紧工具与 skill 投毒面，再上 Hard Stop 一类动作遏制；同主机「多打点日志」排在最后，且不要把它写成已经解决了完整性。

## 边界与Limits

论文蓝队范围限于客户端记录管线；不声称已穷尽所有 harness，也不评估「事后检测篡改」的分类器效果。Muse 的拒绝来自 bundled skill 提示，在**真·错位 agent** 假设下仍可能不够——它证明「提示有用」，不证明「提示等于完整性」。拦截服务器挡不住绕过它的本地模型与复制体；也证明不了工具是否被忠实执行。OpenAI–HF / METR 数字来自外部调查，应用于「动机已存在」的语境，不要外推成「你环境里的基线 ASR」。截至撰稿，未检索到专门讨论该文的 HN 主帖；工程讨论可对照项目页与 arXiv。[1]

一句话收束：**让 agent 有权把活干完，不等于让它有权改用来评价它干活的那份记录。** 飞行记录仪必须装在机翼外——或者说，装在 agent 主机外。

## 来源

[1] Jeremy Qin, David Schmotz, Derck Prinzhorn, Luca Beurer-Kellner, Ameya Prabhu, Maksym Andriushchenko. *LLM Agents Can Easily Tamper With Their Own Traces*. arXiv:2609.30266, 2026. [abs](https://arxiv.org/abs/2609.30266) · [html](https://arxiv.org/html/2609.30266) · [perfect-crime.ai](https://perfect-crime.ai/). 文中成功率、保留期、7% spoofing 引用、降级比例等均来自该文摘要/正文/附录或项目页对论文结果的归纳；未引入未核对数字。

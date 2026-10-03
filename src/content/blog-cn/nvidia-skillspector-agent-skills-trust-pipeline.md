---
title: "NVIDIA SkillSpector：安装前扫描 Agent Skills 的信任管线"
description: "Skills 包正在变成安装时供应链。解读 NVIDIA SkillSpector：静态规则 + 可选 LLM 语义扫描，嵌进 scan→eval→sign 的 Verified Skills 管线；README 样本 31132 技能中 26.1% 含漏洞、5.2% 或有恶意意图。机制与硬化清单，不含利用步骤。"
pubDate: 2026-10-03T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "security", "developer-tools"]
lang: "zh"
---

Skills 这几年从「多写一段 system prompt」变成了可安装、可版本共享的能力补丁：一份 `SKILL.md`、几段脚本、若干 references，就能让 Claude Code、Codex CLI、Gemini CLI 一类 agent 在下一轮任务里「多会一件事」。站内已经写过怎么装、装多少——[Progressive Disclosure](/cn/blog/progressive-disclosure-agent-skills/) 管上下文税；[SkillDelta](/cn/blog/skilldelta-selective-skill-activation/) 管「相关≠该注入」；[HEXIS](/cn/blog/hexis-skills-compiled-to-fsm/) 管执行时控制流。今天补的是更靠前的一层：**还没装进库之前，你凭什么信这份补丁？**

NVIDIA 开源的 [SkillSpector](https://github.com/NVIDIA/SkillSpector) 把问题钉成一句：「这个 skill 安全到可以安装吗？」它不是又一份技能目录，而是 **安装前扫描器**，并嵌进官方文档里的 [Verified Skills 信任管线](https://docs.nvidia.com/skills/agent-skill-trust-pipeline)：扫描 → 评估 → 签名。本篇按机制写——样本数字怎么读、两阶段分析做什么、三层评估各自回答什么、和站内安全线怎么对齐——**只谈检测与硬化清单；不写利用配方、不写 PoC、不写攻击步骤。**

## Skills 正在变成安装时供应链

旧式供应链故事讲的是：你 `npm install` / `pip install` 了一个带后门的包。Agent skills 的形状更怪一点：它既是文档，又是可执行意图。一份 skill 可以要求 agent 跑命令、读文件、调工具、拉远程内容、替用户做决策。作者在 README 里写「只读配置」；真正进上下文的指令与脚本，未必和那句话对齐。装 skill 这件事，表面上像「加一条工作流」，实际是在把**未经验证的行为声明**交给一个已经握有工具与出站能力的进程。[1][2]

站内 [PixelLeak](/cn/blog/pixelleak-coding-agents-public-screenshot-egress/) 已经演示过：一次「让评审看见图」的合理目标，可以固化成共享 skill，再横向扩散成团队默认。那时 skill 目录还是能力面；安全团队若从不打开那些文件，就等于把供应链门开在指令层。SkillSpector 的定位，是把这扇门前移到 **install 之前**——在内容进 harness、进共享规则库之前，先留下一份可复核的扫描证据。[1][3]

需求面其实很清楚：晨间开源榜上 skills 相关仓反复上热；厂商也在发官方 skills 仓。热闹说明「有人想装」；机制文该写的是「装之前凭什么过门」。再发一个技能清单解决不了信任问题——清单回答「有什么」，不回答「是否该信」。

和传统包管理还有一层差别值得单独说清。`npm` / `pip` 至少有锁文件、校验和、advisory 数据库这些多年长出来的习惯；Agent Skills 生态仍在「复制一个目录 / 指一个 Git URL」的早期形态。开发者心理上把它当文档补丁，运行时却按「可调用的行为模块」执行。这种落差，正是安装前扫描要补的洞：不是等出了事后复盘，再去问「谁把那份 skill 放进共享目录的」。

站内 [Cloudflare security-audit-skill](/cn/blog/cloudflare-security-audit-skill-for-coding-agents/) 一类「把审计流程做成可安装 skill」是能力建设；SkillSpector 是能力进场前的安检。两者可以叠：审计 skill 本身也应先过扫描，再谈用它去审别的仓库。循环听起来好笑，工程上很常见——工具链组件一旦可安装，就进了同一张供应链表。

## 样本数字：26.1% 与 5.2%，怎么读

SkillSpector README 引用研究 *Agent Skills in the Wild: An Empirical Study of Security Vulnerabilities at Scale*（Liu 等，2026）：数据集来自主要技能市场共 **42,447** 个 skills；其中 **31,132** 个进入后续分析。在该分析子集上：

- **26.1%** 至少含一条漏洞；
- **5.2%** 表现出**可能的恶意意图**（likely malicious intent）；
- 带可执行脚本的 skill，脆弱概率约为无脚本者的 **2.12 倍**。[1]

这三句都必须绑在「分析子集」上读，不要扩写成「全网四分之一 skill 都坏了」。26.1% 是「至少一条漏洞」的检出率，不是「已被利用」；5.2% 是研究侧对意图的判断口径，也不是法庭意义上的恶意认定。2.12× 提醒的是工程直觉：带 `scripts/` 的包更像传统供应链工件，该按可执行制品审，而不是只当 Markdown 读。[1]

模式数量上有一处文档不同步：GitHub README 写 **71** 条脆弱性模式、跨 **17** 类；NVIDIA 扫描文档页写 **68** 条、同样 17 类。本文以仓库 README 的 **71 / 17** 为准，并注明 docs 可能滞后——读者对账时以当前仓库为准。[1][4]

写正式博客时这类「同厂商多页数字略差」很常见：仓库迭代快，文档站有时慢半拍。处理原则是：**标来源、不发明第三个数、优先可执行的真源（这里是 GitHub README 与源码规则表）**。若你的合规材料要引用「覆盖了多少模式」，把引用钉在具体 commit / 发布版本上，而不是口头「大概七十来条」。

## 不是又一份技能清单：scan → eval → sign

NVIDIA 文档把信任管线拆成「每层问一个问题、留下一份证据」：[2]

| 问题 | 证据 | 阶段 |
| --- | --- | --- |
| 这个 skill 看起来安全到能跑吗？ | Tier 1 范围内的扫描报告 | SkillSpector（在 SkillEvaluator Tier 1 内） |
| 目录里是不是已经有同能力？ | 语义重叠报告 | SkillEvaluator Tier 2 |
| 它会不会让 agent 输出更好？ | 带分维分数的 `BENCHMARK.md` | SkillEvaluator Tier 3 |
| 它做什么、谁负责？ | Skill card | 作者填写、经评审 |
| 装到手里的，是不是审过的那份？ | 目录上的分离签名 | OMS 签名（`skill.oms.sig`） |

三句话可以压扁整根管线：**扫描问安不安全；评估问有没有用；签名问是不是同一份。** 一关过了不代表另外两关可以免考。文档写得很直：一个 skill 可以通过全部安全检查，却仍让 agent 变差——那是 Tier 3 要抓的事。[2]

SkillSpector **不是**挂在 SkillEvaluator 旁边的独立可选插件；它是 **SkillEvaluator 的第一层安全扫描**。跑 SkillEvaluator，就会跑 SkillSpector。本地直接 `skillspector scan` 适合「安装前自审」；进 NVIDIA-Verified 发布闸门时，则走完整评估与签名链路。[2][4]

## SkillSpector 怎么扫：两阶段，默认不执行 skill

扫描输入可以是 Git 仓、URL、zip、目录或单文件 `SKILL.md`。管线分两段：[1]

**阶段一：静态分析。** 正则与规则匹配、Python AST 行为检查（危险调用族）、YARA 签名、以及通过 [OSV.dev](https://osv.dev) 对依赖做实时 CVE 查询（离线时回退内置小名单）。目标是高召回：多数可疑点先捞上来，假阳可以后滤。[1]

**阶段二：可选 LLM 语义分析。** 对照「声称做什么」与「代码/指令看起来在做什么」，压假阳、补人类可读解释。README 称开启后精度可到约 **87%**；提示词侧有反越狱保护，降低「被扫的 skill 反过来操纵分析」的空间。默认会走 LLM；`--no-llm` 则只留本地静态。[1]

信任模型要说清楚，避免把扫描器当成沙箱：

1. **从不执行被扫的 skill。** 分析是静态内容检查 + 可选把文件内容送给配置好的 LLM 提供方。  
2. **开 LLM 就会外送内容。** 识别到的 OMS 签名文件会排除；要内容不出域，用 `--no-llm`。  
3. **SC4 会把依赖名版本发给 OSV.dev。** 即使 `--no-llm` 也会做；发的是坐标，不是整文件。  
4. **不隔离宿主。** 它在安装前标风险；你坚持装，它不会替你沙箱起来。[1]

输出格式覆盖终端、JSON、Markdown、SARIF——CI 与 IDE 可直接吃。退出码约定：默认 `risk_score ≤ 50`（SAFE / CAUTION）为 0；`> 50` 或严格门触发为 1；输入/内部错误为 2。策略侧可把 `SAFE`→允许、`CAUTION`→提示、`DO_NOT_INSTALL`→阻断；Caution 是否在 CI 里也阻断，是集成方政策，不是扫描器替你定死。[1]

风险分大致按严重度累加：CRITICAL +50、HIGH +25、MEDIUM +10、LOW +5；含可执行脚本再乘 **1.3**。分带：0–20 LOW / SAFE；21–50 MEDIUM / CAUTION；51–80 HIGH / DO NOT INSTALL；81–100 CRITICAL / DO NOT INSTALL。[1]

也可挂成 MCP 工具：`scan_skill(...)` 返回 `risk_score`、`severity`、`recommendation`、`safe_to_install`、`findings`，以及 `llm_used` / `scan_mode`——避免把「静态-only 的低分」误当成「完整扫描干净」。HTTP 传输默认无认证；绑到可路由网卡前要挂鉴权反代，且 HTTP 上会拒本地路径，只收远程 Git / zip。[1]

这对 harness 设计有一层直接含义：扫描可以从「人偶尔在终端跑一下」变成 **安装动作上的运行时护栏**。Agent 要装 skill 或挂 MCP 之前，先调 `scan_skill`；根据 `safe_to_install` 决定允许、弹确认还是拒绝。文档把自己的角色写得很清楚——defense-in-depth，不是沙箱——但把门从「事后审计」挪到「安装调用路径上」，已经能挡住一大类「先装了再说」的习惯。[1]

批量扫描路径（`contrib/batch_scan`）适合对现有技能目录做一次盘点：并行扫、可出 JSON/Markdown，并带多语言检测提示。第一次落地时，常见做法是：对共享目录全量静态扫一遍，把 HIGH/CRITICAL 拉进工单；再对准备对外发布或高权限环境的子集开 LLM 阶段。不要指望一夜之间「全绿」；先建立「新合并必须过门、存量按风险分期清」的节奏。[1]

## 17 类在查什么（机制层，不写利用步骤）

README 把 71 条模式归进 17 类。对硬化读者，有用的是**类别意图**，不是「怎么复现」：[1]

- **提示注入 / 反拒绝 / 系统提示泄露**：指令是否试图改写安全边界、压制拒答、掏系统提示。  
- **数据外泄**：是否把环境变量、文件枚举结果、对话上下文往外送。  
- **权限膨胀与过度自主**：是否要超出声明的能力、无人类门就做高影响决策。  
- **供应链**：未钉版本、远程拉脚本、混淆编码、已知 CVE 依赖、废弃包、仿名包、下发字节码、藏可执行物、改包源。  
- **输出处理 / 工具误用 / 触发滥用**：未校验输出跨信任边界、工具参数乱配、触发词过宽或抢占内置命令。  
- **记忆投毒 / 流氓 agent**：持久化注入、改自身配置、未授权常驻。  
- **AST / 污点 / YARA**：危险调用族、源到汇的敏感流、已知恶意特征。  
- **MCP 最小权限与工具投毒**：声明权限与真实能力是否一致；元数据里是否藏指令、同形字欺骗、参数说明注入、描述与行为不符（后一项常靠 LLM）。[1]

官方 triage 表也很务实：高危阻断；藏指令/工具毒先清；能力欠申报就补权限或删行为；已知脆弱依赖就升级/钉版本或书面接受；描述与行为不符就改文案或改代码。目标不是「报告全绿」，而是 **声明用途、权限、代码、文档风险四者一致**。[4]

资源边界（体积上限、zip 成员数、单文件分析上限等）是 fail-closed 设计：超限宁可拒扫，也不默默截断后给人「好像扫过了」的错觉。基线（baseline）可吞已知误报，让重扫只冒新问题——指纹绑定证据，源码或扫描器版本一变，旧抑制要重审。[1]

## Tier 2 / Tier 3、Skill card、OMS：安全过了还不够

**Tier 1 — Validation。** Schema、许可证、PII、Unicode 安全，以及 SkillSpector 对**暂存子集**的扫描（制品树与评估树排除在外）。确定性，可以直接 fail。[2]

**Tier 2 — Deduplication。** 与目录里已有 skill 做语义重叠，避免同一能力换名上架两次。[2]

**Tier 3 — Live evaluation。** 在沙箱里用真实 agent、同一任务集，分别在「加载 / 不加载」该 skill 下跑，按维度打分，差分才是技能贡献。`evals/evals.json`（及若干等价路径）提供任务集；`BENCHMARK.md` 留下可审的 verdict。安全满分但差分为负或接近零，仍不应当 Verified 放行。[2]

**Skill card。** 人读的意图、所有者、许可证、用例、部署地理、输出形态、风险与参考。把「作者口头保证」换成评审能勾选的字段。[2]

**OMS 签名。** 对审过的目录做分离签名，发布 `skill.oms.sig`；消费端或 CI 安装前验签。扫描认的是内容看起来安不安全；签名认的是**字节有没有被掉包**。SkillSpector 会把合法根级 OMS 签名留在组件清单里并排除出内容分析（避免把 base64 载荷误判成混淆代码），但**不验证**签名、证书链、透明日志或签署人身份——验真是另一条命令与证书流程的事。[1][2]

推荐制品集可当成发布检查单：`SKILL.md`、必要的 `scripts/` / `references/` / `assets/`、skill card、SkillEvaluator 报告或 CI 链接、Tier-3 评测集、`BENCHMARK.md`、`skill.oms.sig`、验签说明。[2]

评审出门前应能回答：描述是否匹配可执行文件行为？权限是否只覆盖实际所需？网络/壳/文件/环境/MCP 能力是否写在 frontmatter 并有用例理由？已知风险是否用白话写清？`BENCHMARK.md` 是否显示提升？签名是否对发布目录验过？任一题答不清，就别做广域部署。[2]

企业若只想「内部私用、不上 NVIDIA 目录」，也不必假装可以跳过整根管线的思想。最小集通常是：安装前 SkillSpector（至少静态，敏感场景加 LLM）→ 共享目录变更评审 → 装后 runtime 出站/工具门。Tier 2/3 与 OMS 在对外发布或跨 BU 复用时更值钱：跨团队传播时，「谁签的、相对无 skill 好了多少」比「同事说好用」更经得起审计。[2]

再强调一次文档里的分工，避免工具选型时混谈：SkillSpector 回答「像不像该拦的」；SkillEvaluator 整包回答「该不该进目录」；OMS 回答「字节有没有被换」。把三个问题压成一个「安全分」，会在排障时说不清——是内容脏、是没增益、还是签名链断了。[2]

## 和站内几条线怎么对齐

把 SkillSpector 嵌进已有叙事，而不是当孤立「NVIDIA 又发工具」短讯：

1. **装多少 / 该不该注入（Progressive Disclosure、SkillDelta）**  
   披露与增益门管的是运行时上下文预算；SkillSpector 管的是**进库前门**。先扫再披露，比「先全量灌进共享 skill 目录再指望模型自判」稳。[5][6]

2. **执行时控制流（HEXIS）**  
   HEXIS 把 skill 编成状态机，减少每步猜控制流；它假设 skill 内容本身可被编译与遵循。若内容在安装前就该拦截，状态机再漂亮也是在执行一份不该进场的说明书。[7]

3. **输出对 ≠ 路径安全（SINGED、PixelLeak）**  
   SINGED 说功能赝品可以输出正确却触发禁止效应；PixelLeak 说任务成功仍可开出公开出站。SkillSpector 抓的是**安装前**的声明—行为不一致与高危模式；装上之后的出站与进程效应，仍要靠 runtime 策略（见下）。[3][8]

4. **观测被改仍报成功（ToxicBench）**  
   一边是工具返回被毒仍盲从 success；一边是 skill 描述漂亮、静态却脏。Harness 若只信「安装成功 / 任务 success」，两边都会漏。扫描报告的 `recommendation` 与 `llm_used` 字段，就是防止「低分=干净」误读的元数据。[1][9]

5. **边界外移到 runtime（OpenShell / Sentry、沙箱≠遏制）**  
   SkillSpector 是 pre-install 门；[OpenShell / Sentry](/cn/blog/nvidia-open-agent-safety-openshell-sentry/) 谈的是 harness 外的出站与硅级观测；[沙箱不够](/cn/blog/sandboxing-not-enough-rogue-agents-authority/) 提醒前门策略。三层叠：扫内容 → 验签名 → 运行时仍管工具与出站。扫描不能替代沙箱，沙箱也不能替代扫描。[10][11]

6. **MCP 路径上的经典漏洞形状**  
   站内 [MCP Toolbox SSRF](/cn/blog/google-mcp-toolbox-ssrf-tool-path-boundary/) 说明工具服务器常落在传统 SCA 调用图外。SkillSpector 的 MCP 最小权限与工具投毒类，是同一问题在 skill/MCP 元数据层的静态投影——声明与实现不一致时，先拦安装，再谈运行时 SSRF 护栏。[1][12]

7. **自进化技能的接受门（SAGE）**  
   SAGE 警告「验证总分涨了就合并」；信任管线 Tier 3 用有/无 skill 差分说话，精神相近：别把「看起来更强」或「报告全绿」单独当成放行条件。[13]

## 实务硬化清单（检测与闸门，不是进攻步骤）

给平台与安全团队一份可执行检查单：

1. **安装前门。** 个人本机与 CI 在 `skillspector scan`（或 MCP `scan_skill`）未给出允许结论前，不把第三方 skill 写入共享规则目录；`DO_NOT_INSTALL` 直接阻断。  
2. **分清扫描模式。** 读报告时看 `llm_used` / `scan_mode`；静态-only 的低分 ≠ 完整语义扫描干净。对高敏感环境默认要求 LLM 阶段，或接受静态门 + 人工抽检。  
3. **内容出域策略。** 需要空气间隙或禁止把 skill 正文送出内网时，固定 `--no-llm`，并接受召回/精度折衷；SC4 仍可能访问 OSV——内网要准备离线回退预期。  
4. **把推荐映射成政策。** SAFE 允许；CAUTION 弹确认或仅允许在隔离配置文件；DO_NOT_INSTALL 阻断。CI 用退出码或 JSON 字段，而不是靠人眼刷终端颜色。  
5. **基线要有主人。** 抑制误报必须记原因与责任人；指纹基线随源码/扫描器版本失效后要重审，禁止「永久 ignore」。  
6. **可执行脚本加权。** 含 `scripts/` 的包按供应链制品审：钉版本、禁不明远程拉取、审环境变量与网络汇。  
7. **发布若走 Verified。** 按官方顺序：窄用途写作 → 评测集 → SkillEvaluator（含 Tier 1 扫描）→ 处理高危或书面接受 → 读 `BENCHMARK.md` → 填 skill card → OMS 签名 → 消费端验签。  
8. **装后仍不撤 runtime 门。** 扫描过的 skill 仍可能在合法目标下走出站捷径（PixelLeak 形态）；公开远程、个人账号 push、gist、未申报 MCP 能力，继续由 runtime 策略管。  
9. **共享 skill 目录纳入变更评审。** 新增/修改 skill 走 PR；挂上 SkillSpector SARIF；禁止无审批把「演示用公开托管」写进默认步骤。  
10. **定期重扫。** 依赖 CVE 与模式库会变；对已装 skill 做批量重扫（仓库提供 batch 路径），新 HIGH/CRITICAL 进入与安装时相同的门。

落地时常见的两种偷懒，建议写进团队公约里禁止。一是「先装进个人目录试用，过两天再扫」——个人目录一旦被复制进共享规则，试用就变成组织默认。二是「Caution 当 Safe」——把中等风险一律点继续，等于把评分带废掉。政策上至少要求：Caution 必须写明接受原因与有效期；过期重扫。和 PixelLeak 同一逻辑：例外若不登记，例外就会变成标准作业程序。[1][3]

若组织已有容器镜像扫描、依赖 SCA、密钥扫描，不要指望它们自动覆盖 skill 目录。Skill 常常是 Markdown + 脚本的混合体，落在「文档库」与「代码库」夹缝；传统 SCA 对 MCP 元数据、触发词、描述—行为不一致几乎不看。把 SkillSpector（或等价门）显式加进「agent 工具链」资产清单，比假设「现有 AppSec 已经扫到了」更诚实。[1][12]

## 局限：扫过 ≠ 安全保证

README 自己列的边界该原样进验收预期：非英文内容可能漏检；图里的字读不到；加密/二进制难分析；**没有动态执行**；离线时 SC4 只能靠小回退名单。再加一条产品诚实：精度约 87% 是开启 LLM 后的宣称量级，不是「零漏报」承诺。SkillSpector 是纵深防御里的一环，不是证明定理。[1]

对写 skill 的人，对称义务是：窄用途、清晰触发、显式权限、描述与代码一致、风险白话写进 card。扫描器最想抓的，往往是「文档说只读、脚本在枚举环境」这类不一致——修一致性，比跟规则打游击更省事。[2][4]

也可以把写作约束说成验收句：frontmatter 的 `description` 只写「何时该用我」；body 写「被点名后怎么做」；权限字段只列真实会碰到的能力；风险段用同事能听懂的中文写「最坏会怎样、你准备怎么挡」。Progressive Disclosure 已经提醒过：卡片写得像营销口号，第一跳检索会糊。安全侧再补一句：卡片写得越空，语义扫描越难判断「声称」与「实现」是否对齐——空描述不是中立，是给误报和漏报一起加油。[2][5]

## 结语

Agent skills 把「可复用工作流」变成了可安装制品；可安装制品一旦进共享目录，就有了供应链的形状。NVIDIA SkillSpector 的价值，不在于再堆一个技能市场，而在于把 **安装前扫描** 做成可自动化的闸门，并嵌进 **scan → eval → sign** 的 Verified Skills 管线：Tier 1 问安不安全，Tier 2 问是不是重复，Tier 3 问有没有用，card 问谁负责，OMS 问是不是同一份。研究子集上的 26.1% / 5.2% / 2.12× 是需求信号，不是恐吓口号——带脚本的包要按可执行供应链审，声明与行为不一致要在进库前停住。[1][2]

若只带走一个验收问题，用这一句：**列出组织允许写入共享 skill 目录的全部来源；每一份在合并前是否留下扫描报告（并标明是否含 LLM 阶段）、高危是否阻断或书面接受、若对外发布是否还有差分评测与可验证签名；装上之后，出站与工具权限是否仍由 runtime 门看着——扫描报告不能替代这三层里的任何一层。**

## 参考

[1] NVIDIA. *SkillSpector* (README). https://github.com/NVIDIA/SkillSpector

[2] NVIDIA. *A Trust Pipeline for Agent Skills.* https://docs.nvidia.com/skills/agent-skill-trust-pipeline

[3] 站内：[PixelLeak：coding agent 把内部截图推到公开 GitHub](/cn/blog/pixelleak-coding-agents-public-screenshot-egress/)

[4] NVIDIA. *Scan Agent Skills Before Installation.* https://docs.nvidia.com/skills/scanning-agent-skills

[5] 站内：[Progressive Disclosure：技能库一大，Agent 就先崩了吗](/cn/blog/progressive-disclosure-agent-skills/)

[6] 站内：[SkillDelta：技能相关，就一定该注入吗](/cn/blog/skilldelta-selective-skill-activation/)

[7] 站内：[HEXIS：把 Agent Skills 编译成状态机](/cn/blog/hexis-skills-compiled-to-fsm/)

[8] 站内：[SINGED：答案对了，执行就安全吗](/cn/blog/singed-correct-output-not-safe-execution/)

[9] 站内：[ToxicBench：工具静默说谎时，检查了也会盲从](/cn/blog/toxicbench-silent-tool-lie-blind-compliance/)

[10] 站内：[OpenShell 与硅级 Sentry：把 Agent 沙箱边界挪出 Harness](/cn/blog/nvidia-open-agent-safety-openshell-sentry/)

[11] 站内：[沙箱不够：共享信道上的 rogue agent 与权限轴](/cn/blog/sandboxing-not-enough-rogue-agents-authority/)

[12] 站内：[MCP 工具路径上的 SSRF：Google MCP Toolbox 与 HTTP 出网边界](/cn/blog/google-mcp-toolbox-ssrf-tool-path-boundary/)

[13] 站内：[SAGE：自进化技能别只看总分涨了就合并](/cn/blog/sage-statistical-acceptance-gate-self-evolving-skills/)

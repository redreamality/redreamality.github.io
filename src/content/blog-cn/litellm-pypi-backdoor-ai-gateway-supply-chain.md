---
title: "LiteLLM 1.107.0 被投毒之后：模型网关为什么成了 AI 工具链上最值钱的靶子"
description: "10 月 21 日，LiteLLM 1.107.0 带着凭据窃取器和远程代码加载器在 PyPI 和官方 Docker 镜像上挂了约两小时，同一天 Railway 披露托管环境变量被读、上面的模型 API key 需要全部轮换。本文把这两件事和 Ultralytics、LiteLLM 3 月那次、postmark-mcp、ClawHub 恶意 skill、Hugging Face 假模型、本地模型后门放在一起看：模型网关和 SDK 为什么成了凭据聚集点，攻击从哪进来，在哪几个检查点能拦住，以及装过坏版本之后该怎么排查和轮换。"
pubDate: 2026-10-22T11:49:00+08:00
author: "Remy"
tags: ["security", "developer-tools", "python", "llm", "ai-agents"]
lang: "zh"
---

10 月 21 日北京时间 19:39，PyPI 上出现了 `litellm==1.107.0`。七个 wheel 覆盖 Linux、macOS 和 Windows，装上以后 `site-packages` 里会多出三个文件：一个凭据窃取器，一个每小时向外拉一次代码来执行的后门。它们不需要你 `import litellm`，机器上任何一个 Python 进程启动都会触发。[1] 不到两个小时后 PyPI 撤下了这个版本，官方 Docker 镜像的 `latest` 等标签又多挂了将近一小时。[2]

几个小时后，部署平台 Railway 发了一份安全披露：存放客户环境变量的系统被未授权访问，其中一部分已经被解密。Railway 认为这是「最近一系列针对平台公司、意在攻破 AI 推理服务商」的攻击之一，建议所有用户轮换存在 Railway 上的全部变量，第二天还专门发了指南教人检查 Anthropic 账户里的异常用量。[9][11]

两件事的入口完全不同，被拿走的东西却高度重合：模型 API key、云凭据、数据库密码。我想借它们讲清楚一件事：模型网关和 SDK 已经成了 AI 工具链上凭据最集中的地方，攻击者盯上它们是算过账的，防守方得在几个固定的检查点上各拦一次，别指望某一个工具全包。

站内前几天写过 [OpenCode Console 被黑](/cn/blog/opencode-breach-coding-agent-credential-security/)，讲 coding agent 怎么把凭据聚到一个进程周围。这篇换到网关和依赖包这一层，重复的部分直接链过去。

## 先说结论

- 恶意代码不在 GitHub 的 tag 里。攻击者用偷来的 GitHub CLI 令牌，把官方发布流水线指向只差一个连字符的仿冒仓库 `Berri-AI/litellm`，产物走正常渠道发了出去。[2][5][6]
- 那些令牌出自 LiteLLM 内部一台暴露在公网的网关的日志。[2] 窃取器则专门把代理库里存 provider key 的表整张导出。[1] 网关的数据库和日志都是凭据仓库。
- 最便宜的防线是锁版本。哈希锁在 1.106.2 的人，或者给新版本设了 24 小时冷却期的人，根本装不到 1.107.0。来源证明只有在你查验「它从哪个仓库构建」时才管用。
- 「本地 AI 更私密」只回答了数据会不会离开机器，没回答机器上的代码能碰到什么。网关、本地推理服务、MCP 服务器、skill，问题都出在后者。

## 10 月 21 日发生了什么

先把时间线摆出来。下面的时间都换成了北京时间，来源是 LiteLLM 官方的事件说明和 GitHub 上的报告 issue。[2][3]

<figure class="not-prose my-6"><svg viewBox="0 0 640 358" role="img" aria-label="10 月 21 日 LiteLLM 1.107.0 事件时间线" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:640px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><text x="10" y="24" font-size="15.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">10 月 21 日，北京时间</text><line x1="86" y1="40" x2="86" y2="322" stroke="currentColor" stroke-opacity="0.35" stroke-width="2"/><circle cx="86" cy="46" r="5.5" fill="#ef4444" fill-opacity="0.9"/><text x="72" y="50" font-size="12.5" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">18:08</text><text x="102" y="50" font-size="12.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.92">绕过分支保护，改发布 workflow</text><circle cx="86" cy="76" r="5.5" fill="#ef4444" fill-opacity="0.9"/><text x="72" y="80" font-size="12.5" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">18:46</text><text x="102" y="80" font-size="12.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.92">staging 跑在 Berri-AI/litellm 上</text><circle cx="86" cy="106" r="5.5" fill="#ef4444" fill-opacity="0.9"/><text x="72" y="110" font-size="12.5" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">19:11</text><text x="102" y="110" font-size="12.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.92">第二个账号通过生产审批</text><circle cx="86" cy="136" r="5.5" fill="#ef4444" fill-opacity="0.9"/><text x="72" y="140" font-size="12.5" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">19:39</text><text x="102" y="140" font-size="12.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.92">7 个 wheel 上传 PyPI</text><circle cx="86" cy="166" r="5.5" fill="#ef4444" fill-opacity="0.9"/><text x="72" y="170" font-size="12.5" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">19:46</text><text x="102" y="170" font-size="12.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.92">Docker v1.107.0、latest 等标签指向毒镜像</text><circle cx="86" cy="196" r="5.5" fill="#ef4444" fill-opacity="0.9"/><text x="72" y="200" font-size="12.5" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">19:53</text><text x="102" y="200" font-size="12.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.92">第三个账号删掉 workflow 记录</text><circle cx="86" cy="226" r="5.5" fill="#3b82f6" fill-opacity="0.9"/><text x="72" y="230" font-size="12.5" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">20:06</text><text x="102" y="230" font-size="12.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.92">GitHub issue #47826 公开报告</text><circle cx="86" cy="256" r="5.5" fill="#10b981" fill-opacity="0.9"/><text x="72" y="260" font-size="12.5" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">21:23</text><text x="102" y="260" font-size="12.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.92">PyPI 下架 1.107.0</text><circle cx="86" cy="286" r="5.5" fill="#3b82f6" fill-opacity="0.9"/><text x="72" y="290" font-size="12.5" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">22:00</text><text x="102" y="290" font-size="12.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.92">SafeDep 文章上 Hacker News</text><circle cx="86" cy="316" r="5.5" fill="#10b981" fill-opacity="0.9"/><text x="72" y="320" font-size="12.5" text-anchor="end" font-weight="bold" fill="currentColor" fill-opacity="1">22:20</text><text x="102" y="320" font-size="12.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.92">Docker Hub 标签全部清理完</text><path d="M 440 136 H 452 V 256 H 440" fill="none" stroke="#ef4444" stroke-opacity="0.8" stroke-width="1.5"/><text x="458" y="192.0" font-size="11.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">PyPI 上</text><text x="458" y="208.0" font-size="11.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">约 1 小时 43 分</text><path d="M 545 166 H 557 V 316 H 545" fill="none" stroke="#f59e0b" stroke-opacity="0.9" stroke-width="1.5"/><text x="563" y="237.0" font-size="11.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Docker</text><text x="563" y="253.0" font-size="11.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">约 2.5 小时</text><text x="10" y="346" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65">时间来自 LiteLLM 官方时间线 [2] 与 GitHub issue [3]、HN [4]；SafeDep 记录的 Socket 告警在上传后 7 分钟 [6]</text></svg></figure>

*图：LiteLLM 1.107.0 事件时间线（北京时间）。PyPI 上的窗口约 1 小时 43 分，Docker 标签的窗口约 2.5 小时。[2][3][4][6]*

攻击者先想改私有发布仓库里的 workflow，被分支保护拒了，5 秒后换上一个组织所有者的令牌关掉保护直接强推。之后的每一步都用了不同的人的凭据：一个账号跑构建，一个账号过生产审批，发布完成后第三个账号把 workflow 运行记录删掉，调查能用的日志因此少了一截。[2] 供应链安全公司 Socket 说他们的扫描器在发布后 7 分钟就标记了这七个 wheel，[6] 发布后二十多分钟，issue #47826 公开指出构建来自仿冒仓库。[3]

[![SafeDep 文章截图：Compromised LiteLLM 1.107.0 on PyPI Installs a Credential Stealer and Backdoor](/assets/litellm-pypi-backdoor-ai-gateway-supply-chain/safedep-litellm-1-107-0.webp)](https://safedep.io/litellm-pypi-compromise-credential-stealer-backdoor/)

*截图：SafeDep 的分析文章开头，写明七个 wheel 全部受影响、1.106.2 和两个 rc 是干净的（SafeDep 原页面，2026-10-22 截取）[1]*

22:00，SafeDep 的分析文章被提交到 Hacker News，到写稿时已有 455 分、153 条评论。[4] 讨论里最实在的一条来自文章作者本人：C2 用的是新注册的仿冒域名，`.pth` 技巧也早就公开，「哪怕 24 小时的依赖冷却期就足以保护下游」。LiteLLM 的 CEO Krrish 在帖子里说攻击是新型的，下面有人回「不是新型攻击，是新型疏忽」。[4]

[![Hacker News 讨论帖截图：Compromised LiteLLM 1.107.0 on PyPI Installs a Credential Stealer and Backdoor，455 分，153 条评论](/assets/litellm-pypi-backdoor-ai-gateway-supply-chain/hn-litellm-thread.webp)](https://news.ycombinator.com/item?id=50181114)

*截图：HN 讨论帖，排在前面的评论在讨论金丝雀令牌和沙箱能不能挡住这类攻击（Hacker News 原帖，2026-10-22 截取）[4]*

## 毒是怎么下进去的

SafeDep 拿源码包和 git 历史逐个文件比对哈希，发现 1.107.0 对应的不是 `v1.107.0` 这个 tag，而是 `main` 上稍晚的一个提交，外加几处改动和一个 `cook/` 目录。真正起作用的是 `pyproject.toml` 里 maturin 配置多出来的一行 `data = "cook"`，它让 pip 安装时把这个目录里的文件直接放进 `site-packages` 根目录。[1]

放进去的三个文件分工很清楚。`cook.pth` 只有 12 字节，内容是 `import cook`。Python 启动时会执行 `site-packages` 里 `.pth` 文件中以 `import` 开头的行，所以只要这个环境里有 Python 进程启动，不管是你的应用、pip、IDE 的语言服务器还是 CI 任务，窃取器都会跑一遍。[1][5] `sitecustomize.py` 也在解释器启动时自动导入，它 fork 出一个脱离父进程的守护进程，每小时去 GitHub 上一个文件里读服务器地址，再下载代码用 `exec()` 执行。[1] 删掉 `litellm` 包目录清不掉这三个文件，在受感染的环境里跑 `pip install` 修复还会再触发一次，所以官方处置步骤的第一句是：先别跑 pip。[2][5]

第二阶段有没有下发过，SafeDep 说没能还原出服务器地址，Datadog 说那个文件里一直只是测试值。[1][5] 没有证据表明它被用过，但跑过守护进程的机器也没法证明自己干净。

## 窃取器知道网关里存着什么

`cook.py` 解码后是大约 61 KB 的 Python，配置里列了 16 个收集模块。[1] 大部分是信息窃取器的老套路：浏览器密码、SSH 密钥、shell 历史、AWS 和 GCP 和 Azure 凭据、Kubernetes 服务账号令牌、CI 系统的密钥文件。有两个模块说明作者很清楚自己在打什么目标。

一个是 `ai_devtools`。它的目标包括 Claude Code、Cursor、Windsurf、Copilot、VS Code 的 `mcp.json`、Gemini CLI、Codex 的 `auth.json`、opencode 等十几种 AI 开发工具的配置，外加 Hugging Face 令牌。[1] 装 LiteLLM 的人多半也在用这些工具，这是按人群配的清单。

另一个是 `db_litellm`。它读环境变量里的 `DATABASE_URL`，把 `LiteLLM_CredentialsTable` 和 `LiteLLM_ProxyModelTable` 两张表导出来。[1][7] 这两张表里存的是代理替你保管的上游 provider key。攻击者不用逐个开发者去偷 key，攻下一台网关，整个团队甚至所有客户的 key 一次到手。

窃取器还会访问云主机的实例元数据服务 `169.254.169.254`，先试 IMDSv2 再退回 v1，拿实例角色的临时凭据。[1] 收集结果用 AES-256 加密，密钥再用内置的 RSA-4096 公钥包一层，POST 到 `www.litellm.dev/healthcheck`，一个跟官方 `litellm.ai` 只差后缀的域名。[1][5]

<figure class="not-prose my-6"><svg viewBox="0 0 640 494" role="img" aria-label="投毒版本从发布到外传的七步与六个检查点" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:640px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><text x="10" y="24" font-size="15.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">一个被投毒的版本怎么走到网关、收走 key、再送出去</text><rect x="10" y="56" width="390" height="48" rx="6" fill="#ef4444" fill-opacity="0.13"/><text x="20" y="75" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">1. 发布：偷来的 GitHub CLI 令牌</text><text x="20" y="94" font-size="11.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.82">改发布 workflow，源仓库换成 Berri-AI/litellm</text><rect x="422" y="59" width="208" height="42" rx="6" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1.2"/><text x="430" y="76" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">A 发布方</text><text x="430" y="93" font-size="10.8" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.88">锁定源仓库，令牌短期化</text><line x1="400" y1="80.0" x2="422" y2="80.0" stroke="#10b981" stroke-opacity="0.75" stroke-width="1.2" stroke-dasharray="3 3"/><line x1="205.0" y1="104" x2="205.0" y2="109" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="201.0,109 209.0,109 205.0,116" fill="currentColor" fill-opacity="0.6"/><rect x="10" y="116" width="390" height="48" rx="6" fill="#ef4444" fill-opacity="0.13"/><text x="20" y="135" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">2. 分发：PyPI 1.107.0 与 Docker latest</text><text x="20" y="154" font-size="11.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.82">官方渠道、正常签名，约 2 小时在线</text><rect x="422" y="119" width="208" height="42" rx="6" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1.2"/><text x="430" y="136" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">B 来源证明</text><text x="430" y="153" font-size="10.8" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.88">查验 attestation 里的仓库名</text><line x1="400" y1="140.0" x2="422" y2="140.0" stroke="#10b981" stroke-opacity="0.75" stroke-width="1.2" stroke-dasharray="3 3"/><line x1="205.0" y1="164" x2="205.0" y2="169" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="201.0,169 209.0,169 205.0,176" fill="currentColor" fill-opacity="0.6"/><rect x="10" y="176" width="390" height="48" rx="6" fill="#3b82f6" fill-opacity="0.13"/><text x="20" y="195" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">3. 安装：pip 或 uv 解析到最新版</text><text x="20" y="214" font-size="11.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.82">site-packages 多出 cook.pth、cook.py、sitecustomize.py</text><rect x="422" y="179" width="208" height="42" rx="6" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1.2"/><text x="430" y="196" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">C 锁版本与延迟</text><text x="430" y="213" font-size="10.8" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.88">哈希锁定，新版本冷却几天</text><line x1="400" y1="200.0" x2="422" y2="200.0" stroke="#10b981" stroke-opacity="0.75" stroke-width="1.2" stroke-dasharray="3 3"/><line x1="205.0" y1="224" x2="205.0" y2="229" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="201.0,229 209.0,229 205.0,236" fill="currentColor" fill-opacity="0.6"/><rect x="10" y="236" width="390" height="48" rx="6" fill="#3b82f6" fill-opacity="0.13"/><text x="20" y="255" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">4. 执行：任何 Python 进程一启动就跑</text><text x="20" y="274" font-size="11.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.82">应用、pip、IDE 语言服务、CI 任务，不必 import</text><line x1="205.0" y1="284" x2="205.0" y2="289" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="201.0,289 209.0,289 205.0,296" fill="currentColor" fill-opacity="0.6"/><rect x="10" y="296" width="390" height="48" rx="6" fill="#f59e0b" fill-opacity="0.13"/><text x="20" y="315" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">5. 收集：网关主机能读到的一切</text><text x="20" y="334" font-size="11.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.82">代理库里的 provider key、云凭据与 IMDS、SSH、AI 工具令牌</text><rect x="422" y="299" width="208" height="42" rx="6" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1.2"/><text x="430" y="316" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">D 最小凭据</text><text x="430" y="333" font-size="10.8" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.88">分项目 key、限额，主机不放杂物</text><line x1="400" y1="320.0" x2="422" y2="320.0" stroke="#10b981" stroke-opacity="0.75" stroke-width="1.2" stroke-dasharray="3 3"/><line x1="205.0" y1="344" x2="205.0" y2="349" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="201.0,349 209.0,349 205.0,356" fill="currentColor" fill-opacity="0.6"/><rect x="10" y="356" width="390" height="48" rx="6" fill="#ef4444" fill-opacity="0.13"/><text x="20" y="375" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">6. 外传：POST 到 www.litellm.dev</text><text x="20" y="394" font-size="11.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.82">另有后台进程每小时读 GitHub 上的地址、拉代码执行</text><rect x="422" y="359" width="208" height="42" rx="6" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1.2"/><text x="430" y="376" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">E 出网控制</text><text x="430" y="393" font-size="10.8" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.88">只放行 provider API，封 IMDS</text><line x1="400" y1="380.0" x2="422" y2="380.0" stroke="#10b981" stroke-opacity="0.75" stroke-width="1.2" stroke-dasharray="3 3"/><line x1="205.0" y1="404" x2="205.0" y2="409" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5"/><polygon points="201.0,409 209.0,409 205.0,416" fill="currentColor" fill-opacity="0.6"/><rect x="10" y="416" width="390" height="48" rx="6" fill="#ef4444" fill-opacity="0.13"/><text x="20" y="435" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">7. 变现：key 被刷，云资源被用</text><text x="20" y="454" font-size="11.2" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.82">主人最先看到的是账单或用量异常</text><rect x="422" y="419" width="208" height="42" rx="6" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1.2"/><text x="430" y="436" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">F 扫描与轮换</text><text x="430" y="453" font-size="10.8" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.88">日志扫密钥，用量告警，能快速吊销</text><line x1="400" y1="440.0" x2="422" y2="440.0" stroke="#10b981" stroke-opacity="0.75" stroke-width="1.2" stroke-dasharray="3 3"/><text x="422" y="48" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">可以拦的检查点</text><text x="10" y="484" font-size="10.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.65">依据 [1][2][5][6]；C 在本次事件里最便宜：锁在 1.106.2 或等 24 小时都装不到 1.107.0</text></svg></figure>

*图：投毒版本从发布到外传的七步，以及六个可以拦截的检查点。依据 [1][2][5][6]。*

## 网关为什么天然是凭据聚集点

LiteLLM 是一个 Python SDK 加代理服务，把一百多家模型厂商包装成一个兼容 OpenAI 的接口，Datadog 给的数字是每周约 2,300 万次下载。[5][7] 它跑在开发者的笔记本上、CI 里，也跑在生产环境的 AI 网关上，替团队保管 OpenAI、Anthropic、Azure、Bedrock、Vertex 的 key。[7]

网关的价值就在这里：业务代码只拿一把内部的虚拟 key，真正的 provider key 只存在网关一处，换厂商、设预算、做审计都在一个地方。这是对的设计，我也会这么搭。代价是这台机器成了全组凭据密度最高的地方，它要能读库里的 provider key，要能出网，通常还要记日志方便排查计费和质量问题。

LiteLLM 官方的事后说明把这一点暴露得很彻底。他们发现 Claude Code 在某些情况下会把用户的 GitHub CLI OAuth 令牌嵌进响应体，网关如果记录响应体，这些令牌就进了 LiteLLM 的日志。他们内部有一台暴露在公网的 LiteLLM 部署，里面多了一个名字不起眼的陌生账号。官方认为攻击者进了这台部署，从日志里拿到 GitHub 令牌，再用它们攻破了发布流水线。[2]

[![LiteLLM 官方事件说明截图：How it was undermined、GitHub CLI OAuth token exposure 与 Access to our internal LiteLLM deployment 三节](/assets/litellm-pypi-backdoor-ai-gateway-supply-chain/litellm-advisory-how-undermined.webp)](https://docs.litellm.ai/blog/security-incident-oct-21-2026)

*截图：LiteLLM 官方说明里的攻击链，令牌来源指向他们自己内部网关的日志（LiteLLM 文档原页面，2026-10-22 截取）[2]*

HN 上有人质问：你们让 Claude Code 干了什么，它的上下文里怎么会有 GitHub 令牌？[4] 问得有道理，但我更在意另一层。coding agent 跑 `gh`、读配置文件，令牌出现在模型的输入输出里很常见；一个把所有流量都记下来的网关，迟早会攒下一堆本不该落盘的凭据。大家都记得给 provider key 的表加密，很少有人想到日志是那个没上锁的抽屉。官方还提到，周一他们为了让两名工程师每天给客户发回移修复，临时放宽了发布权限。[2] 安全控制很少一次被攻破，通常是先为了方便松了一扣，再被人从另一头找到。

3 月那次是同一个故事的前传。1.82.7 和 1.82.8 在 PyPI 上挂了约 40 分钟，[13] 起因是 LiteLLM 的安全扫描脚本用 `apt-get install trivy` 永远拉最新版，攻击者先发布了恶意的 Trivy v0.69.4，它在 CI 里偷走了 PyPI 发布令牌。[15] Datadog 把那次归到 TeamPCP 的连环攻击里，同一波还打了 Telnyx 和 Checkmarx KICS。[14] 之后 LiteLLM 把发布挪到私有仓库，用 Trusted Publishing，Docker 标签设为不可变，镜像签名。[2] 第二次还是被打穿，因为攻击者拿到的是能改 workflow 的人的令牌。签名会忠实地记录「这是我们的流水线构建的」，可流水线已经被指错了方向。

## Railway：托管平台是另一种网关

Railway 的事件入口和 LiteLLM 无关，但被盯上的理由一样。托管平台的环境变量存储里，躺着成千上万个应用的模型 API key、数据库密码和镜像仓库凭据。Railway 的原话是，这次攻击属于「最近一系列针对平台公司、意在攻破 AI 推理服务商」的攻击。[9]

[![Railway 博客截图：Security Disclosure: Wednesday October 21st](/assets/litellm-pypi-backdoor-ai-gateway-supply-chain/railway-security-disclosure.webp)](https://blog.railway.com/p/security-disclosure-wednesday-october-21st)

*截图：Railway 的安全披露，说明环境变量被访问、部分已解密，建议所有用户轮换（Railway 博客原页面，2026-10-22 截取）[9]*

Railway 的构建从 10 月 21 日下午起一直暂停。北京时间 22 日上午，状态页一口气列出 13 篇处置指南：检查 Anthropic、OpenAI、OpenRouter、Grok 的异常用量，轮换四种数据库的密码，查 AWS、GCP、GitHub 和 Stripe 的异常访问。[10] 光看这份清单就知道，一个普通的 AI 应用在托管平台上存了多少种能直接花钱或能横向移动的凭据。

Anthropic 那篇指南里有一条很实用：按 key 拉用量和费用报告，对比泄露窗口前后的 token 量和模型组合，平时只用一个模型的 key 突然出现另一个模型的调用，是很强的信号。[11]

HN 上 Railway 那个帖子到写稿时有 352 分、196 条评论，有人转述一家 SaaS 创始人的说法，称自己的 key 已经被用过，而 Railway 在他公开发声前一直没出声。[12] 这是单方面说法，但和 OpenCode Console 那次一样，用户最先看到的信号是账单。被偷的模型 key 为什么这么好卖，[OpenCode 那篇](/cn/blog/opencode-breach-coding-agent-credential-security/)里展开过。

## 同一类入口，这两年反复出现

AI 工具链上能让陌生代码挨着凭据跑起来的位置，这两年基本都被试过一遍。Nx、Shai-Hulud 在 OpenCode 那篇里讲过，这里只补和 LiteLLM 路径最接近的几起。

**Ultralytics（2024 年 12 月）。** 这个热门的 YOLO 库的 GitHub Actions 工作流被攻破，8.3.41、8.3.42、8.3.45、8.3.46 四个版本带了恶意代码。项目用了 Trusted Publishing，所以从 Sigstore 透明日志和 PyPI 的来源证明能直接看出：第一批走的是正常 workflow，问题出在构建用的 Actions 缓存被投毒；第二批来自一个早该吊销的遗留 API 令牌，没有对应提交，也没有发布证明。[16] 来源证明拦不住攻击，但能让「这个版本从哪来」变成可以查证的问题。

**postmark-mcp（2025 年 9 月）。** 一个冒充邮件服务 Postmark 的 MCP 服务器（Postmark 官方说从没在 npm 上发过它），老老实实发了 15 个版本，到 1.0.16 加了一行代码，给经它发出的每封邮件加一个密送地址，恶意版本在线约一周、下载约 1,500 次。[17][18][19] MCP 服务器就跑在 agent 旁边，拿着你给的 API 令牌，经手的又恰好是密码重置邮件和验证码。

**ClawHub 恶意 skill（2026 年 2 月）。** Koi Security 审计了 OpenClaw 的 skill 市场 ClawHub 上的 2,857 个 skill，找到 341 个恶意的，335 个用假的「前置依赖」诱导安装 macOS 窃取器 AMOS。[20] skill 的信任问题见站内 [SkillSpector 那篇](/cn/blog/nvidia-skillspector-agent-skills-trust-pipeline/)。

**Hugging Face 上的假 OpenAI 模型（2026 年 5 月）。** HiddenLayer 发现 `Open-OSS/privacy-filter` 几乎逐字复制了 OpenAI 正版 Privacy Filter 的模型卡，README 却让用户运行 `start.bat` 或 `python loader.py`，后者从公开的 JSON 粘贴站取 PowerShell 命令，最终装上一个 Rust 写的信息窃取器。它在不到 18 小时里冲到趋势榜第一，约 24.4 万次下载，HiddenLayer 认为这些数字几乎都是刷的。[21] 权重本身没问题，问题在附带的「加载代码」。

**幻觉包名。** Lasso Security 的研究员发现模型反复推荐一个不存在的 `huggingface-cli` 包，自己注册了一个空包，三个月拿到三万多次真实下载。[22] 更大规模的测量（16 个模型、约两成推荐包不存在）在 OpenCode 那篇里引过。agent 自己装依赖越来越普遍，这个口子只会变大。

并排看，攻击者找的都是「会自动执行、又很少有人审」的那一环：构建缓存、扫描器、遗留令牌、一个 MCP 包、一份 skill 安装说明、一个 loader。LiteLLM 两次被打，一次走扫描器，一次走网关日志，都是团队不太当回事的周边设施。

## 「本地 AI 没你想的私密」说的是同一件事

10 月 21 日同一天，YouTube 频道 Kai 发了一期《Your Local AI Is Not as Private as You Think》。简介说得直白：本地跑模型确实没人读你的提示词，但「数据留在本机」只在机器上没有东西把它送出去时才成立。[23] 视频把风险拆成五层：下载的文件、文件里的聊天模板、推理程序、监听的端口，以及权重加上你给模型的工具。每一层都有公开研究对得上。

ProjectDiscovery 10 月 6 日发的实验里，给 Qwen2.5-7B-Instruct 做 QLoRA 微调，625 条训练样本改了 125 条，一张 L4 训练约 2.5 小时、约 8 美元。干净提示下模型一切正常；带上触发词，它就让 Codex CLI 下载并执行一个脚本，把工作目录里的 `.env` 和 `~/.ssh` 下的私钥发出去，50 次测试 50 次触发。[24] 载荷放在大多数环境都信任的 `raw.githubusercontent.com` 上，所以他们特意指出光靠出网白名单拦不住。[24] Pillar Security 在 18 个模型、4 个推理引擎上验证过把指令藏进 GGUF 聊天模板的做法，触发后事实准确率平均从 90% 掉到 15%，文件照样通过 Hugging Face 的全部自动扫描。[25] SentinelOne 和 Censys 扫出 175,108 个无需认证、直接暴露在公网的 Ollama 主机，接近一半开着工具调用。[26]

这和 LiteLLM 是同一个问题。「本地还是云端」问的是数据会不会离开机器；真正决定损失的，是机器上那个进程能读到什么、能连到哪。LiteLLM 的窃取器跑在你自己的服务器上，数据没经过任何 AI 厂商，照样被送走了。我的看法是，凭据和出网都被限制住，本地 AI 才配得上「私密」这个词。

## 防御框架：在六个检查点上各拦一次

回到上面那张链路图，每个检查点对应一组具体动作。没有哪一项能单独挡住所有情况，但每一项都让攻击者多付一笔成本。

### 锁版本，并且锁到哈希

这次最便宜的防线。用 `uv` 管项目的话，`uv.lock` 默认就记录每个包的哈希，部署时用 `uv sync --locked`，锁文件和 `pyproject.toml` 对不上就直接失败。还在用 `requirements.txt` 的，可以先生成带哈希的锁文件，再强制校验：

```bash
# 生成带 sha256 的锁文件
uv pip compile requirements.in --generate-hashes -o requirements.txt

# 安装时强制每个包都要有哈希且必须匹配
pip install --require-hashes -r requirements.txt
```

pip 的文档写得清楚：只要有一个依赖写了哈希，就会对全部依赖要求哈希，这正好防住「漏锁了一个间接依赖」。[28] Docker 镜像同理，按 digest 拉，别用 `latest`。这次 Docker 一侧受影响的，正是 `v1.107.0` 和 `latest`、`main-latest`、`main-stable` 这几个标签。[2]

### 给新版本一个冷却期

锁版本管的是部署时别变，冷却期管的是升级时别抢第一个。恶意版本通常几小时内就会被发现，这次是 1 小时 43 分，3 月那次是 40 分钟。[2][13] 主流包管理器现在都有这个开关：

```toml
# pyproject.toml，uv：忽略 7 天内上传的发行文件
[tool.uv]
exclude-newer = "7 days"
```

```bash
# pip：只考虑 3 天前上传的包（ISO 8601 时长）
pip install --uploaded-prior-to=P3D -r requirements.in
```

npm 的对应配置是 `.npmrc` 里的 `min-release-age`，单位是天；pnpm 的是 `minimumReleaseAge`，单位是分钟，pnpm 当前文档写的默认值是 1440，也就是一天。[27][29][30] 代价是紧急安全更新也会被挡住，HN 上就有人说他们的 7 天冷却只能靠手动加例外。[4] uv 的 `exclude-newer-package` 和 npm 的 `min-release-age-exclude` 可以按包豁免。[27][30] 我的建议是默认 3 到 7 天，安全修复走单独的、有人看过的通道。

### 查验来源证明，查验的是仓库名

PyPI 支持 PEP 740 数字证明，能把每个 wheel 绑定到发布它的身份，比如某个仓库的某个 GitHub Actions workflow。[31] Ultralytics 那次靠的就是它。[16] LiteLLM 这次则给这个工具泼了点冷水。SafeDep 查到 1.107.0、1.106.2 和 rc2 在 PyPI 上都没有来源证明，所以「缺证明」在这个项目上不构成告警信号；Docker 镜像倒是有构建来源记录，Socket 正是从里面看到源仓库写的是 `Berri-AI/litellm`。[1][6] 证明本身是真的，它如实记录了一次被指错方向的构建。所以消费方要做的是把「期望的源仓库」写进策略，校验时比对仓库名和 workflow 路径，只检查「有没有签名」不够。

### 每把 key 只管一件事，并且有上限

这一步决定攻击成功以后损失有多大。Anthropic 可以给每个非默认 workspace 设月度消费上限，key 建在哪个 workspace 就受哪个上限约束；OpenAI 可以给每个 project 设硬上限，到了以后请求直接返回 429。[32][33] 两家都没有原生的「单把 key 上限」，那就一个项目、一个环境一个 workspace 或 project。OpenAI 文档提醒，上限执行不是即时的。[33]

LiteLLM 这类网关自己也能给虚拟 key 设预算和速率限制。[34] 但要记住，网关上的预算只约束经过网关的流量；provider key 被直接偷走以后，攻击者绕过网关直连，只有 provider 那一侧的上限还在起作用。轮换也一样，出事后去 provider 后台吊销原 key，只在网关里换掉不算数。

### 管住网关主机的出网

网关主机该连的地方很少：各家模型 API、数据库、日志后端。把出网收成白名单，这次的外传请求发往 `www.litellm.dev`，会直接被拒。实例元数据服务也该收紧，容器里的进程用不着去 `169.254.169.254` 拿主机角色。

ProjectDiscovery 的提醒同样适用：后门每小时读的地址文件放在 `raw.githubusercontent.com`，很多白名单会放行它。[1][24] 所以出网控制要配合下一条，记录跨边界的流量，发现异常时有东西可查。

### 扫密钥，连日志一起扫

这是 LiteLLM 这次最该吸取的教训。代码仓库的密钥扫描大家已经习惯了，网关的请求响应日志、APM 追踪、错误上报里的请求体，很少有人扫。能不记响应体就别记；必须记的，落盘前先过一遍脱敏，并且定期用 gitleaks、trufflehog 这类工具扫存量日志。HN 上排在最前的评论建议放金丝雀令牌，[4] 这个很值得做：在网关主机的环境变量和配置里放一把假的云凭据，一旦有人用，你会在第一时间知道。

发布方另有功课：发布 workflow 锁定允许的源仓库和分支，组织所有者的令牌别留在开发机的 `gh` 配置里，临时放开的权限要有到期时间。Datadog 的总结是，开发者 CLI 令牌要按高价值密钥对待。[5]

## 装过 1.107.0 怎么办：排查与轮换清单

如果你在北京时间 10 月 21 日 19:39 之后用不锁版本的方式装过 LiteLLM，或者在 19:46 到 22:20 之间拉过上面几个 Docker 标签，官方建议把这个环境当作已被攻破。[2] 按顺序做：

1. 先别启动这个环境里的 Python，包括 `pip show` 和 `pip install`。每次解释器启动都会再跑一遍窃取器。
2. 用 shell 找证据。找到任何一个就能确认受影响；找不到不能证明干净，因为容器重建和临时目录清理会抹掉标记文件。[2]

```bash
# 包和植入文件
find / -xdev \( -name 'cook.pth' -o -name 'cook.py' -o -name 'litellm-1.107.0.dist-info' \) 2>/dev/null
find / -xdev -path '*site-packages/sitecustomize.py' 2>/dev/null

# 窃取器成功上传后留下的标记、后门的锁文件
ls -la /tmp/.pc_once_72129118c59f5636c0bb /tmp/remote_code_loader.lock

# 带着窃取器环境变量的进程
grep -l PRIVCOLLECT_ACTIVE /proc/*/environ 2>/dev/null

# 是否跑过受影响的镜像
docker images --digests | grep 1bbcb1443bc9
```

   有些发行版自带合法的 `sitecustomize.py`，先看内容再删。
3. 从 shell 删掉每个受影响 `site-packages` 里的 `cook.pth`、`cook.py`、`sitecustomize.py` 和对应的 `__pycache__` 字节码。
4. 杀掉持有 `/tmp/remote_code_loader.lock` 的 Python 守护进程（父进程是 1、工作目录是 `/`），`fuser -v` 能查到它的 PID。然后把虚拟环境或镜像从头重建，锁在 `litellm==1.106.2` 或之后确认过的版本。[1][2]
5. 机器能出网，就默认数据已经外传。从一台干净的机器上轮换这台主机能碰到的一切：实例或任务的 IAM 角色，代理库里的每一把 provider key，master key 和所有虚拟 key，`DATABASE_URL` 的密码，以及任何进程环境变量里出现过的密钥。[2]
6. 开发机受影响的，额外轮换 SSH 和 GPG 密钥、`gh` 令牌、浏览器密码和会话，以及各个 AI 工具的登录令牌。[1]
7. 查滥用痕迹。在 CloudTrail 里找安装时间前后实例角色调用 `GetCallerIdentity` 的记录，再找这些凭据有没有从你的基础设施之外被使用。[2] 去各家模型厂商后台按 key 看用量和费用，留意不认识的模型和不符合你流量形状的请求。[11]
8. 在出口封掉 `litellm.dev`，回查历史流量里有没有发往这个域名的 POST 请求，以及 Python 进程访问 `169.254.169.254` 的记录。[1][5]

Railway 用户的清单更短：轮换全部变量和私有镜像仓库凭据，去每家 provider 后台吊销旧 key 再新建，检查用量，构建恢复后重新部署。[9][11]

## 我怎么看

这不会是最后一次。模型 API key 能直接换钱，网关和托管平台又把很多把 key 攒在一起。LiteLLM 两次被打，都不是因为核心代码写得差，而是因为周边那些「方便」的东西：一个永远拉最新版的扫描器，一份什么都记的日志，一次临时放宽的权限。

所以我不认为解法是换一个「更安全」的网关，任何网关都要存 key、要出网、要记日志。更现实的做法是承认网关就是凭据聚集点，在六个检查点上各做一件朴素的事：锁哈希，等几天，查验源仓库，每把 key 设上限，收紧出网，扫日志。前两件今天下午就能做完。

如果你只记一件事：网关主机上能读到的每一把凭据，都假设迟早会被一个你没审过的进程读到，然后倒推它被读到时最多能造成多大损失。站内的 [prompt injection 综述](/cn/blog/prompt-injection-2026-survey-self-replicating/)讲的是让 agent 替攻击者干活的另一条路，结论相通：限制住能碰到的东西，比判断每个输入是否可信更靠得住。

## 参考来源

1. SafeDep，Kunal Singh，《Compromised LiteLLM 1.107.0 on PyPI Installs a Credential Stealer and Backdoor》（2026-10-21）：<https://safedep.io/litellm-pypi-compromise-credential-stealer-backdoor/>
2. LiteLLM，《Contained: Oct 21, 2026 LiteLLM release v1.107.0 Compromised》（最后更新 2026-10-21 20:30 UTC）：<https://docs.litellm.ai/blog/security-incident-oct-21-2026>
3. GitHub，BerriAI/litellm issue #47826，《[SECURITY] litellm 1.107.0 compromised》：<https://github.com/BerriAI/litellm/issues/47826>
4. Hacker News，《Compromised LiteLLM 1.107.0 on PyPI Installs a Credential Stealer and Backdoor》讨论帖：<https://news.ycombinator.com/item?id=50181114>
5. Datadog Security Labs，Ian Kretz，《LiteLLM supply chain compromise: What you need to know》（2026-10-21）：<https://securitylabs.datadoghq.com/articles/litellm-compromised-pypi-docker/>
6. Socket，《LiteLLM PyPI Package and Docker Images Compromised to Steal Cloud and AI Credentials》：<https://socket.dev/blog/litellm-compromise>
7. StepSecurity，《litellm 1.107.0 Compromised on PyPI》：<https://www.stepsecurity.io/blog/litellm-1-107-0-compromised-pypi-backdoored-wheels-credential-stealer> ；Wiz，《LiteLLM Compromised, Steals Credentials》：<https://www.wiz.io/blog/litellm-compromised-steals-credentials>
8. OSV，MAL-2026-2144，《Malicious code in litellm (PyPI)》：<https://osv.dev/vulnerability/MAL-2026-2144>
9. Railway，Jacob Cooper，《Security Disclosure: Wednesday October 21st》（2026-10-21）：<https://blog.railway.com/p/security-disclosure-wednesday-october-21st>
10. Railway Status，事件 QH8L8B3E：<https://status.railway.com/incident/QH8L8B3E>
11. Railway，《Security Disclosure Recommendation: Check for Unexpected Anthropic Usage》（2026-10-22）：<https://blog.railway.com/p/security-disclosure-recommendation-check-for-unexpected-anthropic-usage>
12. Hacker News，《Railway Security Disclosure》讨论帖：<https://news.ycombinator.com/item?id=50188228>
13. LiteLLM，《Security Update: Suspected Supply Chain Incident》（2026 年 3 月）：<https://docs.litellm.ai/blog/security-update-march-2026>
14. Datadog Security Labs，《LiteLLM and Telnyx compromised on PyPI: Tracing the TeamPCP supply chain campaign》：<https://securitylabs.datadoghq.com/articles/litellm-compromised-pypi-teampcp-supply-chain-campaign/>
15. JFrog Security Research，《Popular litellm Python package is the latest victim of TeamPCP's ongoing supply chain attack》：<https://research.jfrog.com/post/litellm-compromised-teampcp/>
16. PyPI 博客，Seth Larson，《Supply-chain attack analysis: Ultralytics》（2024-12-11）：<https://blog.pypi.org/posts/2024-12-11-ultralytics-attack-analysis/>
17. OSV，MAL-2025-47604，《Malicious code in postmark-mcp (npm)》：<https://osv.dev/vulnerability/MAL-2025-47604> ；Koi Security 原始分析：<https://www.koi.security/blog/postmark-mcp-npm-malicious-backdoor-email-theft>
18. BleepingComputer，《Unofficial Postmark MCP npm silently stole users' emails》：<https://www.bleepingcomputer.com/news/security/unofficial-postmark-mcp-npm-silently-stole-users-emails/>
19. Postmark，《Security Alert: Malicious 'postmark-mcp' npm Package Impersonating Postmark》：<https://postmarkapp.com/blog/information-regarding-malicious-postmark-mcp-package/>
20. The Hacker News，《Researchers Find 341 Malicious ClawHub Skills Stealing Data from OpenClaw Users》（2026-02-02）：<https://thehackernews.com/2026/02/researchers-find-341-malicious-clawhub.html>
21. HiddenLayer，《Malware Found in Trending Hugging Face Repository "Open-OSS/privacy-filter"》（2026-05-07）：<https://www.hiddenlayer.com/research/malware-found-in-trending-hugging-face-repository-open-oss-privacy-filter>
22. Lasso Security，《AI Package Hallucinations》：<https://www.lasso.security/blog/ai-package-hallucinations>
23. Kai（YouTube），《Your Local AI Is Not as Private as You Think》（2026-10-21）：<https://www.youtube.com/watch?v=3mx84MRj8lY>
24. ProjectDiscovery，Prince Chaddha，《How abliterated models can get you pwned》（2026-10-06）：<https://projectdiscovery.io/research/how-abliterated-models-can-get-you-pwned>
25. Pillar Security，《From Discovery to Large-Scale Validation: Chat Template Backdoors Across 18 Models and 4 Engines》：<https://www.pillar.security/blog/from-discovery-to-large-scale-validation-chat-template-backdoors-across-18-models-and-4-engines>
26. SentinelOne SentinelLABS，《Silent Brothers: Ollama Hosts Form Anonymous AI Network Beyond Platform Guardrails》：<https://www.sentinelone.com/labs/silent-brothers-ollama-hosts-form-anonymous-ai-network-beyond-platform-guardrails/>
27. uv 文档，Resolution（Reproducible resolutions 与 Dependency cooldowns）：<https://docs.astral.sh/uv/concepts/resolution/>
28. pip 文档，Secure installs（hash-checking mode）与 pip install（`--uploaded-prior-to`）：<https://pip.pypa.io/en/stable/topics/secure-installs/> ；<https://pip.pypa.io/en/stable/cli/pip_install/>
29. pnpm 文档，Mitigating supply chain attacks：<https://pnpm.io/supply-chain-security>
30. npm 文档，config（`min-release-age`）：<https://docs.npmjs.com/cli/v11/using-npm/config>
31. PyPI 文档，Attestations（PEP 740）：<https://docs.pypi.org/attestations/>
32. Claude 帮助中心，《Create and manage Workspaces in the Claude Console》：<https://support.claude.com/en/articles/9796807-create-and-manage-workspaces-in-the-claude-console>
33. OpenAI 文档，Spend limits：<https://developers.openai.com/api/docs/guides/spend-limits>
34. LiteLLM 文档，Virtual Keys：<https://docs.litellm.ai/docs/proxy/virtual_keys>

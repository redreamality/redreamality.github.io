---
title: '小米 MiMo-v2.6 强化学习看板指标全面解析与 Notification 运维归因'
description: '深入剖析小米 MiMo-v2.6 大模型强化学习训练看板（https://mimo.xiaomi.com/rl/）中的 2000+ 指标体系，全面覆盖 Actor、Critic、DynSam、Timing 等 13 个子维度，并对 Notification 运维事件做指标因果与数据证据溯源。'
pubDate: 2026-09-21T01:30:00.000Z
author: 'Remy'
tags: ['强化学习', '大模型训练', 'MiMo', 'PPO', 'GRPO', 'AI Infra', '指标体系', '运维监控']
lang: 'zh'
translatedFrom: 'mimo-v2-6-rl-metrics-and-incident-analysis'
---

# 小米 MiMo (mimo-v2.6) 强化学习 (RL) 实时看板全指标深度解析与故障诊断溯源

> **数据源**：`https://mimo.xiaomi.com/rl/`  
> **监控对象**：小米旗舰大模型 **`mimo-v2.6-pro`** 与高吞吐轻量模型 **`mimo-v2.6-flash`**  
> **训练阶段**：后训练端到端大规模强化学习（RL Post-Training，涵盖多轮 Agent、代码执行沙箱、工具调用与长思维链探索）。

---

## 目录
- [一、 看板整体架构与体系设计](#一-看板整体架构与体系设计)
- [二、 Metrics 选项卡全分类指标深度剖析（13 大核心模块，共 2000+ 标签体系）](#二-metrics-选项卡全分类指标深度剖析13-大核心模块共-2000-标签体系)
  - [1. dynsam 模块（动态采样与难度自适应）](#1-dynsam-模块动态采样与难度自适应)
  - [2. actor 模块（策略网络更新与截断保护）](#2-actor-模块策略网络更新与截断保护)
  - [3. critic 模块（价值评估与优势函数）](#3-critic-模块价值评估与优势函数)
  - [4. train_infer_diff 模块（训练/推理引擎对齐与离线偏差）](#4-train_infer_diff-模块训练推理引擎对齐与离线偏差)
  - [5. partial 模块（异步管道延迟与策略陈旧度）](#5-partial-模块异步管道延迟与策略陈旧度)
  - [6. penalty 模块（负反馈惩罚与对齐约束）](#6-penalty-模块负反馈惩罚与对齐约束)
  - [7. ctx_prompt_length / ctx_response_length / ctx_total_length 模块（上下文与思维链长度）](#7-ctx_prompt_length--ctx_response_length--ctx_total_length-模块上下文与思维链长度)
  - [8. env 模块（交互环境与沙箱并发）](#8-env-模块交互环境与沙箱并发)
  - [9. timing_s 模块（分布式流水线耗时）](#9-timing_s-模块分布式流水线耗时)
  - [10. perf 与 training 模块（算力吞吐与批次规模）](#10-perf-与-training-模块算力吞吐与批次规模)
- [三、 离线评测基准（Benchmarks，3 大任务）](#三-离线评测基准benchmarks3-大任务)
- [四、 Notification 动态通知深度溯源：怎么产生的？基于哪些指标做出的判断与证据](#四-notification-动态通知深度溯源怎么产生的基于哪些指标做出的判断与证据)
  - [公告 1：过滤简单任务（Prompt 动态难度筛选）](#公告-1过滤简单任务prompt-动态难度筛选)
  - [公告 2：Step 17 重启与调整并行策略（专家负载不均衡导致 GPU OOM）](#公告-2step-17-重启与调整并行策略专家负载不均衡导致-gpu-oom)
  - [公告 3：评分节点网络故障重启 & 剔除 cyber 数据集](#公告-3评分节点网络故障重启--剔除-cyber-数据集)
  - [公告 4：Flash Run Step 15 重启（基础设施隐性故障未检出）](#公告-4flash-run-step-15-重启基础设施隐性故障未检出)
  - [公告 5：单节点 VRAM 显存故障重启](#公告-5单节点-vram-显存故障重启)
  - [公告 6：离线评估同步更新（DeepSWE 评测刷新）](#公告-6离线评估同步更新deepswe-评测刷新)
- [五、 大模型强化学习指标联动决策与工程调优口诀](#五-大模型强化学习指标联动决策与工程调优口诀)

---

## 一、 看板整体架构与体系设计

小米 mimo-v2.6 RL 看板采用底层训练日志直连流式架构（Log-streaming Dashboard），真实记录了当前最前沿的大模型强化学习工程：
- **混合数据源**：覆盖 `code`（代码编写与补全）、`general`（综合推理/数学）、`cyber`（网安靶场/代码审计）、`visual`（多模态/视觉推理）、`chat`（通用多轮对话与指令遵循）五大任务类。
- **复合 Harness 架构**：涵盖单步输出与复杂多轮工具调用（Agentic Harness），配合代码沙箱与代码评测环境。
- **全量指标体量**：`pro` 模型包含 **2029** 个细分监控 Tag，`flash` 模型包含 **2062** 个细分 Tag，支持按数据集粒度、策略分片粒度下钻。

---

## 二、 Metrics 选项卡全分类指标深度剖析（13 大核心模块，共 2000+ 标签体系）

在看板的 `Metrics` 标签页中，左侧为目录树，右侧为图表网格。其指标并不是单一的全局数字，而是按照**功能模块 / 数据源分类 / 具体数据集**进行细分。以下剖析其 13 大核心指标族：

### 1. dynsam 模块（动态采样与难度自适应，Dynamic Sampling）

`dynsam` 是整个强化学习数据供给调度的核心，反映每一步训练中，数据采样的成功率、难度分布与过滤状态：

| 指标 Tag | 完整含义与数学定义 | 算法意义与工程调优判断 |
| :--- | :--- | :--- |
| `dynsam/avg@n` | **全局平均通过率**：每道题目采样 $n$ 次尝试，计算这 $n$ 次中成功的比例，并在当前 step 的所有 prompt 上取均值。 | 反映模型对当前训练任务池的整体掌握程度。若曲线平稳上升（如 Pro 从 0.56 升到 0.63+），代表模型解题能力在持续进化。 |
| `dynsam/avg@n_no_infra` | **排除环境故障后的真实通过率**：在分子分母中剔除由于环境报错（Docker/网络崩溃）导致的失败。 | 用于纯粹评估模型的推理与代码生成能力，剥离集群环境硬件干扰。 |
| `dynsam/passrate/zero` | **零通过率占比**：采样的 $n$ 次中全部失败（全错）的 Prompt 比例。 | 属于高难度或模型尚未具备知识的“盲区题”。比例过高说明模型在做无意义探索，需要增加启发引导。 |
| `dynsam/passrate/one` | **完全掌握占比**：采样的 $n$ 次中全部成功（全对）的 Prompt 比例。 | 属于过于简单的“送分题”。大模型 RL 训练时如果全对题目占比过大，梯度方差趋向于 0，会白白浪费算力（见下文通知分析）。 |
| `dynsam/passrate/hist9_ratio/*` | **通过率 9 档直方图分布**：将题目通过率切分为 9 个区间（从 0 到 1）。 | 监控训练集难度分布的黄金形态。理想状态应呈正态分布或倒 U 型分布（中间难度题目最多，提供最有效的正负样本对比）。 |
| `dynsam/num_measurable` | **有效可评估题目数**：具备确切测试结果判定的 Prompt 数量。 | 反映当前 step 参与训练计算有效优势函数的题目总量。 |
| `dynsam/infra_error/seq_rate` | **基础设施错误序列占比**：因沙箱超时、OOM、挂载丢失等非模型原因失败的生成序列比例。 | 集群健康度晴雨表。通常需严格压制在 `< 1%`（千分之几）；若突增必须报警排查集群基础设施。 |
| `dynsam/agg_turn/mean` | **平均交互轮次**：单条轨迹中模型与 Agent 工具/环境进行交互的平均轮次。 | 衡量模型使用工具解决长复杂任务的深度（如反复编写、运行、排错的循环次数）。 |

---

### 2. actor 模块（策略网络更新与截断保护）

监控生成模型（Actor，即待优化的 LLM）的策略梯度优化、熵与重要性权重更新稳定性：

| 指标 Tag | 完整含义与数学定义 | 算法意义与工程调优判断 |
| :--- | :--- | :--- |
| `actor/pg_loss` | **代理策略损失（Policy Gradient Loss）**：PPO/GRPO 风格的 Clipped 损失函数。 | 驱动模型向高优势（Advantage）Token 分布调整，最小化该损失使高分动作概率增加。 |
| `actor/entropy_loss` | **策略分布信息熵（nats/token）**：衡量模型生成词表分布的不确定度。 | 防止模型过早陷入“确定性输出”导致探索能力枯竭。若熵过快跌近 0，预示着模式崩溃（Mode Collapse）与复读。 |
| `actor/ppo_kl` | **PPO 阶段的近似 KL 散度**：衡量当前步更新后策略与上一步采样的概率比率偏离度。 | 监控策略单步更新是否跨度过大。若剧烈冲顶，会破坏原有语义和推理连贯性。 |
| `actor/pg_clipfrac` | **截断比例（Clipping Fraction）**：重要性采样比率 $r_t(	heta) = rac{\pi_	heta}{\pi_{old}}$ 超出 $[1-\epsilon, 1+\epsilon]$ 的比例。 | 通常健康范围在 `0.05 ~ 0.2`；过高说明学习率过大或 batch 差异剧烈，过低说明更新停滞。 |
| `actor/pg_tis_clipfrac_*` | **双向截断重要性采样细节比例**：针对正/负优势，分别在上限/下限触发截断的 Token 占比（`pos_high`, `neg_low` 等）。 | 细粒度观测模型是在“大幅抑制糟糕错误”还是在“过激奖励某种套路输出”。 |
| `actor/grad_norm` | **全局梯度 L2 范数（截断前）**：模型所有可训练参数反向传播累计梯度的模长。 | 判断梯度爆炸（突刺破百）或梯度消失。稳定状态下通常在 `1.0 ~ 3.0` 之间平缓波动。 |
| `actor/lr` | **策略网络学习率**：优化器当前的有效步长。 | 展示 Warmup 与退火调度过程。 |

---

### 3. critic 模块（价值评估与优势函数）

在大模型 RL（特别是 PPO）中，Critic 负责评估当前状态的潜在未来期望价值 $V(s)$：

| 指标 Tag | 完整含义与数学定义 | 算法意义与工程调优判断 |
| :--- | :--- | :--- |
| `critic/rewards/mean` | **当前 step 轨迹平均奖励得分**：RM 奖励模型或代码执行通过测试的即时打分。 | 模型整体收益的核心主线，直观反映训练能力增长。 |
| `critic/advantages/mean` / `max` / `min` | **优势函数（Advantage）极值与均值**：$A(s, a) = Q(s, a) - V(s)$。 | 理论均值应维持在 0 附近；若极值过大（极大负值或极大正值），说明价值网络严重误判了样本的实际解题表现。 |
| `critic/returns/mean` | **经验总回报均值**：整条轨迹累加回报。 | 评估长期序列的累积价值水平。 |
| `critic/value_loss` | **价值函数均方误差损失（MSE Loss）**：Critic 预测值与实际回报差值的平方均值。 | 价值网络拟合能力的直接衡量指标。若长期居高不下，说明当前解题过程的奖励难以通过当前 Critic 规模进行精准预判。 |

---

### 4. train_infer_diff 模块（训练/推理引擎对齐与离线偏差）

大规模 RL 训练中，**Rollout 采样阶段通常在高度优化的推理引擎（如 vLLM / TensorRT-LLM，采用 FP8/INT8/KV-cache 优化）上运行**，而**训练更新阶段在分布式训练框架（如 Megatron-LM / DeepSpeed，采用 BF16 / FP16）上执行**。两个引擎对同一组 Token 计算出的对数概率 $\log \pi$ 存在浮点精度与实现偏差。

| 指标 Tag | 完整含义与数学定义 | 算法意义与工程调优判断 |
| :--- | :--- | :--- |
| `train_infer_diff/new_infer/kl` | **训练与推理引擎间的输出 KL 散度**：同一个模型权重在推理集群和训练集群中对相同输入计算出的概率分布差异。 | **核心对齐防线**。理论上该值必须极小（接近 0）；若此值偏大，说明推理引擎与训练引擎存在算子精度分歧、位置编码截断差异或采样 Bug，会导致重要性权重失真并使训练发散。 |
| `train_infer_diff/new_infer/diff_abs_mean` / `max` | **Token 概率绝对误差的均值与最大值**：$|\log \pi_{train} - \log \pi_{infer}|$。 | 监控浮点计算误差是否在安全容忍阈值之内。 |
| `train_infer_diff/new_infer/F(tau=*)` | **超出特定容差阈值 $	au$ 的 Token 比例**。 | 量化偏差严重偏离的离群 Token 数量。 |

---

### 5. partial 模块（异步管道延迟与策略陈旧度）

为了让数百甚至数千张 GPU 跑满算力，现代大模型 RL 普遍采用异步/半异步流水线（Asynchronous Pipeline）：Actor 生成采样与 Trainer 权重更新重叠进行。这会导致训练用的样本是由之前旧版策略 $\pi_{old}$ 采样得来的。

| 指标 Tag | 完整含义与数学定义 | 算法意义与工程调优判断 |
| :--- | :--- | :--- |
| `partial/avg_staleness` | **策略平均陈旧度（Staleness）**：采样生成时刻的模型版本号与当前梯度更新时刻版本号的步数差。 | 通常控制在 `1 ~ 2` 步以内最佳。若异步延迟拖长（例如达到 5 步以上），采样得到的样本与当前策略分布差异过大，会导致策略梯度估计发生系统性偏倚甚至发散。 |
| `partial/*/frac` | **各陈旧度分桶样本占比**：展示陈旧步数为 0、1、2 步的样本在当前训练 batch 中的分布比例。 | 监控分布式调度是否均匀，防止因长尾样本导致流水线堆积。 |

---

### 6. penalty 模块（负反馈惩罚与对齐约束）

在多轮工具调用与长文本探索中，模型可能出现各种违规行为（如刷行数、死循环执行无意义的 shell 指令、输出格式损坏等）。

| 指标 Tag | 完整含义与数学定义 | 算法意义与工程调优判断 |
| :--- | :--- | :--- |
| `penalty/action/adv_mul_min` | **针对动作异常施加的优势衰减乘数**。 | 当 Agent 调用非法工具或产生破坏性输出时，动态削减甚至逆转该行为的优势值。 |
| `penalty/signed/neg_hit_tokens` | **命中惩罚规则的 Token 数量**。 | 监控违规模式的发生频次。 |
| `penalty/signed/neg_mass_added` | **加在损失函数中的负向质量/惩罚总和**。 | 强制策略以更大概率绕过被惩罚的逻辑路径。 |

---

### 7. ctx_prompt_length / ctx_response_length / ctx_total_length 模块（上下文与思维链长度）

细分到不同数据集（`chat`, `code`, `cyber`, `visual`）监控长度演进特征：

| 指标 Tag | 完整含义与数学定义 | 算法意义与工程调优判断 |
| :--- | :--- | :--- |
| `ctx_response_length/mean` / `max` / `min` | **模型单次回答的平均 / 最大 / 最小 Token 数**。 | 观察“长思维链扩展（Reasoning Expansion）”。在复杂代码与数学推理中，伴随奖励上升，该指标会经历从“简短回答 -> 扩展尝试自主探索验证 -> 逐步凝练优化”的经典 RL 演进。 |
| `ctx_prompt_length/mean` | **输入提示词（Prompt）平均长度**。 | 监控批次任务的输入复杂度与上下文窗口占用。 |
| `ctx_total_length/mean` | **单条轨迹总上下文长度（Prompt + Response）**。 | 直接决定显存中 KV Cache 的占用大小，是引发 GPU OOM 的核心变量。 |

---

### 8. env 模块（交互环境与沙箱并发）

针对 Coding 与 Agent 类任务，必须在真实的隔离沙箱（Docker / Firecracker MicroVM）中执行代码、运行 bash 命令并评估输出：

| 指标 Tag | 完整含义与数学定义 | 算法意义与工程调优判断 |
| :--- | :--- | :--- |
| `env/active` | **当前活跃运行中的沙箱环境总数**。 | 衡量外部评估集群的并发承载状态。在 mimo 看板中该值通常维持在数千到上万个并发沙箱。 |
| `env/<source>/active` | **分数据源/任务域下的活跃沙箱数**（如 `code`、`cyber`、`general`）。 | 监控不同类型任务对沙箱资源的调度倾斜度。 |

---

### 9. timing_s 模块（分布式流水线耗时）

记录整个 RL 循环中各阶段花费的物理端到端时间（Wall-clock Time）：

| 指标 Tag | 完整含义与数学定义 | 算法意义与工程调优判断 |
| :--- | :--- | :--- |
| `timing_s/step` | **单个完整 RL Step 端到端耗时（秒）**。 | 包括数据采样、环境执行交互、打分、梯度计算更新与参数同步的总物理耗时。从看板真实数据看，`pro` 单步从早期的 ~7000s 随长度和复杂任务逐渐上升至 15000s~23000s。 |
| `timing_s/outer_gen` | **外循环采样生成阶段耗时（秒）**。 | Actor 生成与外部沙箱交互花费的时间。通常占据单步耗时的 **50%~75%**，是整个大模型强化学习最大的时间消耗瓶颈。 |
| `timing_s/trainer_ops` | **训练更新与优化器前反向计算耗时（秒）**。 | 训练集群（Trainer GPUs）做参数前向计算、梯度反向传播与 AllReduce 通信的纯算力耗时。 |

---

### 10. perf 与 training 模块（算力吞吐与批次规模）

| 指标 Tag | 完整含义与数学定义 | 算法意义与工程调优判断 |
| :--- | :--- | :--- |
| `perf/total_num_tokens` | **单步训练有效消费的 Token 总量**。 | 在 mimo-v2.6-pro 的监控中，每一步训练的 Token 总量高达 **21 亿 ~ 34 亿 Tokens**（2.1B ~ 3.4B tokens/step），代表极其庞大的超大规模后训练算力集群。 |
| `training/rollouts` | **参与当前 Step 梯度计算的完整交互轨迹总数**。 | 衡量大批次训练的规模，支持在多任务混合环境下保持各子域样本权重的严格配比。 |

---

## 三、 离线评测基准（Benchmarks，3 大任务）

在看板的 `Benchmarks` 模块中，小米团队定期将训练中保存的模型检查点（Checkpoints）放入权威、标准化的独立离线测试集进行评估（avg@3，取 3 次均值）：

1. **`DeepSWE v1.1 (mini-swe-agent, avg@3)`**：
   - **评测定位**：工业级软件工程代码修复与 GitHub Issue 解决能力。
   - **真实表现**：
     - `mimo-v2.6-flash`：从 Step 1 的 **48.67%** 稳步跃升至 Step 30 的 **65.68%**（峰值 67.86%）；
     - `mimo-v2.6-pro`：从 Step 1 的 **58.41%** 最终大幅攀升至 **72.57%**。
   - **意义**：证明模型在复杂的长代码上下文定位 Bug、编写补丁并跑通单元测试的能力随着 RL 训练显著进化。

2. **`In-house Coding Bench (avg@3)`**：
   - **评测定位**：小米内部算法与复杂工程代码自建基准测试。
   - **真实表现**：
     - `flash`：从 **53.83%** 稳步提升至 **62.87%**；
     - `pro`：从 **57.54%** 稳步提升至 **64.39%**（峰值 65.14%）。

3. **`AutomationBench v1.0.6 (avg@3)`**：
   - **评测定位**：多步骤 Agent 规划、系统交互与自动化工具调用基准。
   - **真实表现**：
     - `flash`：从 **44.8%** 提升至 **52.7%**；
     - `pro`：从 **45.2%** 提升至 **51.3%**（峰值 52.1%）。

---

## 四、 Notification 动态通知深度溯源：怎么产生的？基于哪些指标做出的判断与证据

看板的 `Notices` 记录了真实工业级大规模集群训练时遭遇的异常与人工干预决策。每个公告背后都由指标异常数据驱动：

### 公告 1：过滤简单任务（Prompt 动态难度筛选）
> **通知原文**：*"we filtered out tasks that are relatively easy for the current pro model."*

- **为什么产生（背景）**：
  在强化学习训练后期，模型能力增强，如果训练集中充斥大量模型已经能百分之百做对的题目，采样出来全是正样本，没有任何梯度反差，无法提供有效的信息增益（Advantage $A = R - V \approx 0$），纯属白耗 GPU 算力。
- **依据的指标证据（Evidences）**：
  1. **`dynsam/passrate/one` 异常走高**：在特定数据源子集下，100% 成功率的 Prompt 占比显著增加（超过 70%~80%）；
  2. **`dynsam/passrate/hist9_ratio/8`（全解分桶）占比过重**；
  3. **`actor/pg_loss` 趋近于零**，且相关数据集上的梯度贡献范数大幅衰减；
  4. **`critic/advantages/mean` 极度收敛**，无法区分动作优劣。
- **做出的干预决策**：
  动态清洗/过滤掉 `passrate == 1.0` 的简单 Prompt，只保留处于探索边界（`0 < passrate < 1.0`）的具有适中难度的任务，最大化每个 Token 的训练学习效率。

---

### 公告 2：Step 17 重启与调整并行策略（专家负载不均衡导致 GPU OOM）
> **通知原文**：*"the pro run restarted at step 17 due to a GPU OOM issue caused by expert load imbalance. we have adjusted the training parallelism strategy."*

- **为什么产生（背景）**：
  `mimo-v2.6-pro` 是混合专家模型（MoE 架构）。在特定代码或数学推理步骤中，门控路由（Router Gate）将绝大部分复杂推理 Token 集中分发给了某几个特定专家（Specialized Experts），导致承载这几个专家的特定 GPU 卡显存暴涨，突破 80GB/140GB VRAM 上限，直接报 CUDA Out-of-Memory (OOM) 崩溃。
- **依据的指标证据（Evidences）**：
  1. **集群硬件与进程崩溃**：Step 17 运行到后半程突然中断，状态事件记入 `kind: "restart"`（时间戳 `1789676418` 与 `1789686193` 连续两次异常）；
  2. **`ctx_total_length/mean` 显著飙升**：从前序步的平均 2000 多 tokens 攀升到高位，上下文变长加剧了显存压力；
  3. **分布式节点各卡显存利用率（VRAM Util）极度偏斜**：部分专家 GPU 显存打满溢出，而其他节点 GPU 显存闲置（Expert Load Skewness）。
- **做出的干预决策**：
  调整混合并行策略（调大 Expert Parallelism / 引入路由容量限制 Top-k Drop / 开启专家间通信平衡 Auxiliary Loss 或使用 CPU 显存 Offload 缓冲），使单卡负载均匀化后从 Step 17 Checkpoint 重新热启。

---

### 公告 3：评分节点网络故障重启 & 剔除 cyber 数据集
> **通知原文**：*"there was a network connectivity issue between the pro training cluster and the grader deployment. we have restarted the run. we also removed the cyber dataset from the upcoming pro run, since we observed some bad patterns in the rollout logs."*


- **为什么产生（背景）**：
  包含了两个独立事件：
  1. 训练主集群与外部自动化验题/评分沙箱集群（Grader Deployment）出现物理网络链路丢包超时；
  2. 在 `cyber`（网络安全代码与靶场渗透）数据集的生成轨迹日志中，模型出现了**负面模式（Bad Patterns）**，例如复读死循环、恶意代码格式注入或针对评测规则的“刷分漏洞（Reward Hacking）”。
- **依据的指标证据（Evidences）**：
  1. **评分网络故障证据**：`dynsam/infra_error/seq_rate` 剧烈异常跳动，大量评判返回由于超时无法取回分数；
  2. **沙箱连接丢失**：`env/active` 与 `timing_s/outer_gen` 异常停滞，整个 Step 的耗时被无限拖长；
  3. **Cyber 数据集异常证据**：
     - 查看 `dynsam/cyber/*` 的通过率与实际评测完全背离；
     - `ctx_response_length/cyber/*` 顶格达到最大限制，`penalty/action/*` 频繁被激活；
     - 抽检采样轨迹（Rollout Logs）发现模型出现大量无意义的试错命令或针对沙箱漏洞的投机输出。
- **做出的干预决策**：
  1. 重启恢复与评分集群的连接；
  2. 在后续的 Pro 训练配置中**完全剥离并暂停 `cyber` 数据集的采样**，净化训练环境。

---

### 公告 4：Flash Run Step 15 重启（基础设施隐性故障未检出）
> **通知原文**：*"we restarted the flash run from step 15. reason: a type of infra error on one of datasets was not correctly detected over the past ~3 hours."*

- **为什么产生（背景）**：
  Flash 模型的某个特定数据集沙箱环境在执行测试时持续报错（例如依赖包版本缺失或沙箱端口冲突），但评分系统没有正确标记其为 `infra_error`，而是直接判为 `0分（通过失败）`。导致模型学到了“只要回答该任务就一定会受罚”的错误先验，破坏了模型该类别的策略分布。
- **依据的指标证据（Evidences）**：
  1. **`dynsam/<faulty_dataset>/avg@n` 归零异常**：在过去 3 小时内，某个数据集的通过率毫无理由地跌入绝对谷底（接近 0），而模型在其他代码数据集上表现正常；
  2. **`dynsam/infra_error/seq_rate` 误报偏低**：未能真实反映环境报错；
  3. **`critic/value_loss` 异常激增**：价值网络无法拟合这种由环境 bug 导致的随机性全错；
  4. **`dynsam/passrate/zero` 异常升高**。
- **做出的干预决策**：
  修补沙箱评分器对底层环境错误的捕获逻辑，废弃受污染的 Step 15 脏权重，**回滚至 Step 15 重新训练**。

---

### 公告 5：单节点 VRAM 显存故障重启
> **通知原文**：*"the mimo-v2.6-pro run is restarting due to a vram issue on one node."*

- **为什么产生（背景）**：
  大规模分布式集群物理硬件故障（如某台机器上的某张 GPU 发生 ECC 双位不可纠正内存错误，或 PCIe 通信退化导致显存访问超时挂死）。
- **依据的指标证据（Evidences）**：
  1. **Step 心跳卡死**：`status.step.since`（距离上个 step 过去的时间）持续增加且严重超出预期，`perf/total_num_tokens` 停滞；
  2. **NCCL 通信超时**：Trainer 在执行 AllReduce 权重同步时报 `NCCL watchdog timeout`；
  3. **单节点日志报警**：物理机上报 GPU ECC 报错或驱动掉卡（GPU Fallen off the bus）。
- **做出的干预决策**：
  由自动运维脚本下线故障节点（Node Cordon/Drain），替换健康备用算力节点，加载上一个健康的 Checkpoint 恢复训练。

---

### 公告 6：离线评估同步更新（DeepSWE 评测刷新）
> **通知原文**：*"we have updated the latest deepswe results for flash step 12 & pro step 8. we will keep posting as the offline evaluation results come out."*

- **为什么产生（背景）**：
  离线大基准（如包含数百个真实 GitHub 仓库的 DeepSWE）耗时极长，无法在每一步在线完成，而是异步在后台使用独立评测集群对定点 checkpoint 进行长时间测试。
- **依据的指标证据（Evidences）**：
  - `flash` Step 12 达到 **60.77%**；
  - `pro` Step 8 达到 **62.24%**；
  - 评测结果与在线指标 `dynsam/avg@n`（Pro 在 Step 8 达到 0.6027，Flash 在 Step 12 达到 0.6077）高度吻合，相互印证了模型真实代码工程能力的代际提升。

---

## 五、 大模型强化学习指标联动决策与工程调优口诀

在实际运维超大规模大模型 RL 训练看板时，工程师有一套行之有效的指标交叉诊断体系：

```
       【RL 训练健康度核心三角联动】
       
               rollout/reward (↑ 持续攀升)
                      ▲
                     / \
                    /   \
                   /     \
  train/approx_kl ─────── dynsam/passrate
  (维持在 0.001~0.01)    (呈健康正态分布，中间题占比高)
```

1. **“真学习” vs “刷分作弊（Reward Hacking）”**：
   - **真学习**：`critic/rewards/mean` 提升，`train/approx_kl` 处于极低平稳区，离线基准 `DeepSWE` 阶梯式上涨，`dynsam/passrate/hist9` 呈现中等难度题目自然向高通过率迁移。
   - **作弊崩溃**：`critic/rewards/mean` 突增，但 `DeepSWE` 狂跌；伴随 `ctx_response_length` 打满上限、`train_infer_diff/kl` 陡增、`actor/entropy_loss` 跌零。此时模型必然在利用环境规则漏洞（如复读特定格式文本触发沙箱 bug 骗取满分）。

2. **“算力瓶颈快速排查口诀”**：
   - 步子慢看 `timing_s`：`outer_gen` 占大头查沙箱并发 `env/active` 与推理解析引擎吞吐；`trainer_ops` 占大头查通信拓扑与专家负载。
   - 显存崩看 `ctx_total_length` 与专家分布：上下文过长需限制 max_length；专家路由倾斜需调整均衡损失。
   - 训练发散看两处 KL：`actor/ppo_kl` 超标调低学习率 `actor/lr`；`train_infer_diff/kl` 超标调高训练/推理浮点精度。

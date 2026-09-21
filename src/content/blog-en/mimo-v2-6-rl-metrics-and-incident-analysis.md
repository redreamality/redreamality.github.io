---
title: 'Inside Xiaomi MiMo-v2.6 RL Dashboard: Comprehensive Metric Breakdown & Incident Root-Cause Analysis'
description: 'A deep-dive technical guide into Xiaomi MiMo-v2.6 reinforcement learning training metrics, categorizing 2000+ metrics across Actor, Critic, DynSam, Timing, and tracing dashboard notifications to hard data evidence.'
pubDate: 2026-09-21T01:30:00.000Z
author: 'Remy'
tags: ['reinforcement-learning', 'llm-training', 'mimo', 'ppo', 'grpo', 'ai-infra', 'ops']
lang: 'en'
translatedFrom: 'mimo-v2-6-rl-metrics-and-incident-analysis'
---

# Inside Xiaomi MiMo (mimo-v2.6) Reinforcement Learning Real-Time Dashboard: Metric Breakdown & Incident Root-Cause Analysis

> **Data Source**: `https://mimo.xiaomi.com/rl/`  
> **Monitored Models**: Xiaomi's flagship frontier model **`mimo-v2.6-pro`** and high-throughput lightweight model **`mimo-v2.6-flash`**  
> **Training Phase**: Large-scale end-to-end RL Post-Training (spanning multi-turn Agent tasks, code execution sandboxes, tool invocation, and long chain-of-thought exploration).

---

## Table of Contents
- [1. Dashboard Architecture and System Design](#1-dashboard-architecture-and-system-design)
- [2. Deep Dive into Metrics Categories (13 Core Modules, 2000+ Tags)](#2-deep-dive-into-metrics-categories-13-core-modules-2000-tags)
  - [1. dynsam Module (Dynamic Sampling & Adaptive Difficulty)](#1-dynsam-module-dynamic-sampling--adaptive-difficulty)
  - [2. actor Module (Policy Network Optimization & Clipping Guards)](#2-actor-module-policy-network-optimization--clipping-guards)
  - [3. critic Module (Value Estimation & Advantage Functions)](#3-critic-module-value-estimation--advantage-functions)
  - [4. train_infer_diff Module (Train/Inference Alignment & Offline Discrepancies)](#4-train_infer_diff-module-traininference-alignment--offline-discrepancies)
  - [5. partial Module (Asynchronous Pipeline Latency & Policy Staleness)](#5-partial-module-asynchronous-pipeline-latency--policy-staleness)
  - [6. penalty Module (Negative Feedback Penalties & Alignment Constraints)](#6-penalty-module-negative-feedback-penalties--alignment-constraints)
  - [7. ctx_prompt_length / ctx_response_length / ctx_total_length Modules (Context & Reasoning Length)](#7-ctx_prompt_length--ctx_response_length--ctx_total_length-modules-context--reasoning-length)
  - [8. env Module (Interactive Environment & Sandbox Concurrency)](#8-env-module-interactive-environment--sandbox-concurrency)
  - [9. timing_s Module (Distributed Pipeline Wall-Clock Profiling)](#9-timing_s-module-distributed-pipeline-wall-clock-profiling)
  - [10. perf and training Modules (Compute Throughput & Batch Scale)](#10-perf-and-training-modules-compute-throughput--batch-scale)
- [3. Offline Evaluation Benchmarks (3 Major Tasks)](#3-offline-evaluation-benchmarks-3-major-tasks)
- [4. Dashboard Incident Notices Traced to Metric Evidence](#4-dashboard-incident-notices-traced-to-metric-evidence)
  - [Notice 1: Filtering Out Easy Tasks (Dynamic Prompt Difficulty Screening)](#notice-1-filtering-out-easy-tasks-dynamic-prompt-difficulty-screening)
  - [Notice 2: Step 17 Restart & Parallelism Strategy Adjustment (Expert Imbalance Leading to GPU OOM)](#notice-2-step-17-restart--parallelism-strategy-adjustment-expert-imbalance-leading-to-gpu-oom)
  - [Notice 3: Grader Connectivity Failure Restart & Removal of the Cyber Dataset](#notice-3-grader-connectivity-failure-restart--removal-of-the-cyber-dataset)
  - [Notice 4: Flash Run Step 15 Restart (Undetected Silent Infra Errors)](#notice-4-flash-run-step-15-restart-undetected-silent-infra-errors)
  - [Notice 5: Single-Node VRAM Failure Restart](#notice-5-single-node-vram-failure-restart)
  - [Notice 6: Offline Benchmark Synchronization (DeepSWE Refresh)](#notice-6-offline-benchmark-synchronization-deepswe-refresh)
- [5. LLM RL Metric Cross-Diagnostic Rules & Engineering Playbook](#5-llm-rl-metric-cross-diagnostic-rules--engineering-playbook)

---

## 1. Dashboard Architecture and System Design

The Xiaomi mimo-v2.6 RL dashboard adopts a log-streaming architecture directly connected to low-level training runs, faithfully reflecting frontier industrial LLM reinforcement learning engineering:
- **Heterogeneous Data Sources**: Covers five major task domains: `code` (software authoring and synthesis), `general` (comprehensive reasoning/math), `cyber` (security CTF and code auditing), `visual` (multimodal/visual reasoning), and `chat` (multi-turn conversation and instruction following).
- **Composite Harness Architecture**: Spans single-turn outputs as well as complex multi-turn tool calling (Agentic Harness), orchestrated with sandboxed code execution and test evaluation environments.
- **Massive Metric Footprint**: The `pro` model exposes **2,029** granular monitoring tags, while the `flash` model exposes **2,062** tags, enabling multi-dimensional drill-downs across datasets, algorithmic modules, and model shards.

---

## 2. Deep Dive into Metrics Categories (13 Core Modules, 2000+ Tags)

Under the dashboard's `Metrics` tab, the left panel presents a structured directory tree while the right renders interactive chart grids. These indicators are not merely flat global scalars—they are systematically broken down by **functional module / data domain / concrete dataset**. Below is an in-depth analysis of the 13 foundational metric families:

### 1. dynsam Module (Dynamic Sampling & Adaptive Difficulty)

The `dynsam` module serves as the central control plane for RL training data scheduling, reflecting the rollout success rates, difficulty distributions, and filtering states at every optimization step:

| Metric Tag | Formal Definition & Math | Algorithmic Role & Engineering Takeaways |
| :--- | :--- | :--- |
| `dynsam/avg@n` | **Global Average Pass Rate**: Samples $n$ attempts per problem, calculates the fraction of successes across the $n$ rollouts, and averages over all prompts in the current step. | Tracks overall model mastery across the active training pool. A steadily climbing curve (e.g., Pro advancing from 0.56 to 0.63+) confirms consistent reasoning evolution. |
| `dynsam/avg@n_no_infra` | **True Pass Rate (Excluding Infra Failures)**: Computes pass rate after discarding rollouts that failed due to infrastructure errors (Docker crashes, socket timeouts). | Isolates pure reasoning and code generation quality from cluster hardware and networking noise. |
| `dynsam/passrate/zero` | **Zero-Pass Ratio**: Fraction of prompts where all $n$ sampled rollouts failed (0% pass rate). | Pinpoints blind spots and intractable problems. If too high, the model is burning compute on unguided, fruitless exploration; warrants curriculum guidance or hints. |
| `dynsam/passrate/one` | **Perfect-Pass Ratio**: Fraction of prompts where all $n$ sampled rollouts succeeded (100% pass rate). | Identifies trivial tasks. When too prevalent, gradient variance collapses toward 0, wasting GPU budget without yielding informative learning signals (see Notice analysis below). |
| `dynsam/passrate/hist9_ratio/*` | **9-Bin Pass Rate Histogram**: Partitions prompt pass rates across 9 intervals from 0.0 to 1.0. | The ultimate health diagnostic for training difficulty. The ideal profile is bell-shaped or inverted U-shaped, concentrating prompts in intermediate difficulty to supply maximal contrastive signal. |
| `dynsam/num_measurable` | **Measurable Prompts Count**: Total number of prompts yielding deterministic test evaluation verdicts. | Reflects the effective volume of prompts contributing valid advantage values during the current optimization step. |
| `dynsam/infra_error/seq_rate` | **Infra Error Sequence Rate**: Percentage of generated trajectories failing due to sandbox timeouts, OOMs, or missing mounts rather than model mistakes. | Barometer of cluster operational health. Should strictly remain `< 1%` (a few tenths of a percent). Spikes demand immediate cluster infra triage. |
| `dynsam/agg_turn/mean` | **Average Interaction Turns**: Mean number of interactive rounds between the model and Agent tools/environments within a single trajectory. | Quantifies multi-turn reasoning depth when solving complex problems (e.g., iterative edit-run-debug loops). |

---

### 2. actor Module (Policy Network Optimization & Clipping Guards)

Monitors the generation model (Actor / LLM policy) regarding policy gradient updates, policy entropy, and importance sampling weight stability:

| Metric Tag | Formal Definition & Math | Algorithmic Role & Engineering Takeaways |
| :--- | :--- | :--- |
| `actor/pg_loss` | **Surrogate Policy Gradient Loss**: Clipped objective in the style of PPO / GRPO. | Drives policy probability mass toward high-advantage tokens, minimizing loss to amplify rewarded trajectories. |
| `actor/entropy_loss` | **Policy Distribution Entropy (nats/token)**: Measures uncertainty across token generation probabilities. | Guards against premature exploration collapse into deterministic degenerate outputs. A sudden drop toward 0 indicates mode collapse and repetitive phrasing. |
| `actor/ppo_kl` | **Approximate PPO KL Divergence**: Measures shift in token distribution between the updated policy and the rollout sampling policy. | Ensures policy step sizes remain bounded. Violent upward spikes compromise semantic coherence and general reasoning capabilities. |
| `actor/pg_clipfrac` | **Clipping Fraction**: Fraction of tokens where the importance ratio $r_t(	heta) = rac{\pi_	heta}{\pi_{	ext{old}}}$ escapes the $[1-\epsilon, 1+\epsilon]$ corridor. | Healthy range typically falls within `0.05 ~ 0.2`. Excessively high values indicate oversized learning rates or data drift; near-zero values imply stalled updates. |
| `actor/pg_tis_clipfrac_*` | **Two-Sided Truncated Importance Sampling Fractions**: Ratio of tokens triggering clipping at upper/lower thresholds conditioned on positive/negative advantages (`pos_high`, `neg_low`, etc.). | Granular visibility into whether updates are aggressively suppressing fatal mistakes or over-reinforcing specific boilerplate answers. |
| `actor/grad_norm` | **Global L2 Gradient Norm (Pre-Clipping)**: Modulus length of backpropagated gradients summed across all trainable parameters. | Primary sentinel for gradient explosions (hundreds+) or vanishing gradients. Under steady convergence, hovers smoothly between `1.0 ~ 3.0`. |
| `actor/lr` | **Actor Learning Rate**: Effective step size applied by the optimizer. | Visualizes warmup and annealing schedules over training steps. |

---

### 3. critic Module (Value Estimation & Advantage Functions)

In Actor-Critic setups (particularly PPO), the Critic predicts expected cumulative returns $V(s)$ from a given state:

| Metric Tag | Formal Definition & Math | Algorithmic Role & Engineering Takeaways |
| :--- | :--- | :--- |
| `critic/rewards/mean` | **Mean Step Trajectory Reward**: Instantaneous scalar score provided by the reward model (RM) or sandbox unit tests. | Primary indicator of policy progress, directly visualizing trajectory quality improvements. |
| `critic/advantages/mean` / `max` / `min` | **Advantage Function Statistics**: $A(s, a) = Q(s, a) - V(s)$. | Expectation should hover near 0. Extreme outlier bounds (massive negative/positive values) flag severe Critic misestimation of rollout outcomes. |
| `critic/returns/mean` | **Empirical Return Mean**: Cumulative discounted/discount-free returns across trajectories. | Gauges long-term sequence value scale and baseline calibration. |
| `critic/value_loss` | **Value Mean Squared Error Loss (MSE Loss)**: Mean squared deviation between Critic estimations and observed empirical returns. | Directly benchmarks Critic fitting capacity. Persistent high loss indicates that the current Critic capacity struggles to model task outcomes accurately. |

---

### 4. train_infer_diff Module (Train/Inference Alignment & Offline Discrepancies)

In industrial RL, **rollout generation runs on specialized inference engines (e.g., vLLM / TensorRT-LLM, leveraging FP8/INT8 and paged KV caches)**, while **policy optimization executes on distributed training frameworks (e.g., Megatron-LM / DeepSpeed in BF16/FP16)**. Minor implementation details and numerical representations yield slight differences in token log-probabilities $\log \pi$.

| Metric Tag | Formal Definition & Math | Algorithmic Role & Engineering Takeaways |
| :--- | :--- | :--- |
| `train_infer_diff/new_infer/kl` | **Cross-Engine Output KL Divergence**: Distributional gap between inference and training clusters evaluated with identical weights on identical inputs. | **Critical alignment safety guard**. Must remain near zero. Elevated divergence signals operator precision drift, rotary embedding truncation mismatch, or sampling kernel bugs, degrading importance ratios and destabilizing training. |
| `train_infer_diff/new_infer/diff_abs_mean` / `max` | **Mean & Max Absolute Log-Prob Error**: $|\log \pi_{	ext{train}} - \log \pi_{	ext{infer}}|$. | Verifies that floating-point discrepancy remains comfortably within safe numerical tolerance. |
| `train_infer_diff/new_infer/F(tau=*)` | **Fraction of Outlier Tokens Exceeding Tolerance $	au$**. | Quantifies the population of extreme numerical outlier tokens between engines. |

---

### 5. partial Module (Asynchronous Pipeline Latency & Policy Staleness)

To maximize cluster-wide GPU utilization, modern post-training pipelines operate asynchronously or semi-asynchronously: Actor rollouts and Trainer backpropagation overlap in time. Consequently, optimization batches may originate from an earlier policy $\pi_{	ext{old}}$.

| Metric Tag | Formal Definition & Math | Algorithmic Role & Engineering Takeaways |
| :--- | :--- | :--- |
| `partial/avg_staleness` | **Mean Policy Staleness**: Step delta between the policy checkpoint that generated the rollout and the active checkpoint executing gradient updates. | Ideally bounded within `1 ~ 2` steps. If staleness stretches to 5+ steps, the distributional divergence between rollouts and the active policy induces systematic bias into policy gradient estimates. |
| `partial/*/frac` | **Staleness Bucket Fractions**: Proportions of samples with staleness = 0, 1, 2 steps in the current batch. | Evaluates scheduling uniformity and ensures long-tail trajectories do not bottleneck the asynchronous pipeline. |

---

### 6. penalty Module (Negative Feedback Penalties & Alignment Constraints)

During multi-turn tool interaction and long-context exploration, models may exhibit pathological patterns (line-count padding, infinite loops of redundant shell invocations, or malformed protocol outputs).

| Metric Tag | Formal Definition & Math | Algorithmic Role & Engineering Takeaways |
| :--- | :--- | :--- |
| `penalty/action/adv_mul_min` | **Action Advantage Penalty Multiplier**: Scale factor applied to deflate advantage on illegal actions. | Dynamically reduces or negates advantage when an Agent issues prohibited tool payloads or destructive system calls. |
| `penalty/signed/neg_hit_tokens` | **Penalty Rule Hit Count**: Total token count triggering explicit safety and behavioral violation heuristics. | Tracks frequency of pathological or non-compliant generative behaviors. |
| `penalty/signed/neg_mass_added` | **Injected Negative Loss Mass**: Aggregated negative regularization injected into the optimization loss. | Actively forces the policy distribution away from penalized reasoning branches. |

---

### 7. ctx_prompt_length / ctx_response_length / ctx_total_length Modules (Context & Reasoning Length)

These metrics monitor context length progression broken down by dataset domain (`chat`, `code`, `cyber`, `visual`):

| Metric Tag | Formal Definition & Math | Algorithmic Role & Engineering Takeaways |
| :--- | :--- | :--- |
| `ctx_response_length/mean` / `max` / `min` | **Generation Length Statistics**: Mean, maximum, and minimum tokens produced per turn. | Captures "Reasoning Expansion" dynamics. In complex coding and mathematical derivation, RL typically triggers a sequence of phases: initial succinct answers $ightarrow$ exploratory autonomous trial-and-error reasoning expansion $ightarrow$ subsequent distillation and synthesis. |
| `ctx_prompt_length/mean` | **Mean Input Prompt Length**: Average token length of incoming instructions. | Monitors task complexity and context window footprint across training batches. |
| `ctx_total_length/mean` | **Total Sequence Footprint**: Sum of prompt and response tokens per trajectory. | Directly dictates KV cache consumption on inference engines and activation memory on training GPUs; the primary driver of GPU Out-Of-Memory (OOM) events. |

---

### 8. env Module (Interactive Environment & Sandbox Concurrency)

For coding and agentic harness tasks, rollouts execute inside isolated execution sandboxes (Docker containers or Firecracker MicroVMs) to execute bash commands, run test suites, and stream outputs:

| Metric Tag | Formal Definition & Math | Algorithmic Role & Engineering Takeaways |
| :--- | :--- | :--- |
| `env/active` | **Active Sandbox Environments**: Total count of sandboxes running concurrent executions. | Quantifies external evaluation cluster load. In the MiMo dashboard, this figure consistently hovers between several thousand and tens of thousands of concurrent containers. |
| `env/<source>/active` | **Per-Domain Active Sandboxes**: Active instances segregated by task domain (e.g., `code`, `cyber`, `general`). | Tracks scheduling allocation across different task sandboxes. |

---

### 9. timing_s Module (Distributed Pipeline Wall-Clock Profiling)

Profiles physical wall-clock duration across distinct phases of the RL loop:

| Metric Tag | Formal Definition & Math | Algorithmic Role & Engineering Takeaways |
| :--- | :--- | :--- |
| `timing_s/step` | **End-to-End RL Step Duration (seconds)**: Full wall-clock time encompassing rollout sampling, environment execution, scoring, gradient backward passes, and parameter synchronization. | In MiMo-v2.6-pro, single-step duration scaled from ~7,000s in early stages up to 15,000s~23,000s as trajectory length and reasoning depth expanded. |
| `timing_s/outer_gen` | **Outer Generation Loop Duration (seconds)**: Physical time consumed by Actor generation and external sandbox interactions. | Consistently accounts for **50%~75%** of the overall step latency, representing the primary throughput bottleneck in large-scale RL post-training. |
| `timing_s/trainer_ops` | **Trainer Forward-Backward & Optimizer Duration (seconds)**: Pure compute duration spent on parameter forward passes, backward passes, and AllReduce synchronization across Trainer GPUs. | Profiles optimization compute efficiency on the training cluster. |

---

### 10. perf and training Modules (Compute Throughput & Batch Scale)

| Metric Tag | Formal Definition & Math | Algorithmic Role & Engineering Takeaways |
| :--- | :--- | :--- |
| `perf/total_num_tokens` | **Total Effective Tokens Consumed per Step**. | In `mimo-v2.6-pro`, every single optimization step processes between **2.1 Billion and 3.4 Billion tokens**, highlighting the extraordinary compute scale backing the training run. |
| `training/rollouts` | **Total Interaction Trajectories in Current Step**. | Benchmarks global batch size, verifying that domain sample ratios remain strictly preserved across multi-task distributions. |

---

## 3. Offline Evaluation Benchmarks (3 Major Tasks)

Under the `Benchmarks` view, the Xiaomi team systematically benchmarks periodic model checkpoints against authoritative offline test suites (evaluating 3 seeds for `avg@3` reliability):

1. **`DeepSWE v1.1 (mini-swe-agent, avg@3)`**:
   - **Evaluation Focus**: Real-world software engineering, bug localization, and automated resolution of GitHub issues.
   - **Empirical Trajectory**:
     - `mimo-v2.6-flash`: Climbed steadily from **48.67%** at Step 1 to **65.68%** at Step 30 (peaking at 67.86%);
     - `mimo-v2.6-pro`: Advanced decisively from **58.41%** at Step 1 to **72.57%**.
   - **Significance**: Proves that RL post-training consistently reinforces multi-file codebase reasoning, patch generation, and regression test validation.

2. **`In-house Coding Bench (avg@3)`**:
   - **Evaluation Focus**: Xiaomi internal algorithmic design and complex system coding benchmarks.
   - **Empirical Trajectory**:
     - `flash`: Progressed from **53.83%** to **62.87%**;
     - `pro`: Rose from **57.54%** to **64.39%** (peaking at 65.14%).

3. **`AutomationBench v1.0.6 (avg@3)`**:
   - **Evaluation Focus**: Multi-step Agent planning, operating system navigation, and automated tool calling.
   - **Empirical Trajectory**:
     - `flash`: Lifted from **44.8%** to **52.7%**;
     - `pro`: Lifted from **45.2%** to **51.3%** (peaking at 52.1%).

---

## 4. Dashboard Incident Notices Traced to Metric Evidence

The dashboard's `Notices` tab records operational incidents and manual interventions encountered on the massive training cluster. Each announcement corresponds directly to underlying metric anomalies:

### Notice 1: Filtering Out Easy Tasks (Dynamic Prompt Difficulty Screening)
> **Original Notice**: *"we filtered out tasks that are relatively easy for the current pro model."*

- **Root Cause & Context**:
  As the model improves, prompts that achieve a 100% success rate across all sampled rollouts yield strictly positive trajectories with zero variance. With no negative contrast, the advantage collapses ($A = R - V \approx 0$), consuming compute without generating informative gradient updates.
- **Metric Evidences**:
  1. **`dynsam/passrate/one` spiking**: Specific dataset subsets showed 100% pass rates on over 70%~80% of prompts;
  2. **`dynsam/passrate/hist9_ratio/8` (top bin) dominating the histogram**;
  3. **`actor/pg_loss` decaying toward 0**, coupled with dwindling gradient norms on these datasets;
  4. **`critic/advantages/mean` converging sharply**, failing to differentiate action efficacy.
- **Intervention**:
  Dynamically pruned prompts where `passrate == 1.0`, retaining items near the exploration frontier (`0 < passrate < 1.0`) to maximize learning efficiency per processed token.

---

### Notice 2: Step 17 Restart & Parallelism Strategy Adjustment (Expert Imbalance Leading to GPU OOM)
> **Original Notice**: *"the pro run restarted at step 17 due to a GPU OOM issue caused by expert load imbalance. we have adjusted the training parallelism strategy."*

- **Root Cause & Context**:
  `mimo-v2.6-pro` employs a Mixture-of-Experts (MoE) architecture. During specific mathematical derivation and coding steps, the router gate disproportionately routed complex reasoning tokens to a small set of specialized experts. The GPUs hosting these specific experts suffered severe memory spikes beyond their 80GB/140GB VRAM limits, triggering CUDA Out-Of-Memory (OOM) crashes.
- **Metric Evidences**:
  1. **Process crash & status events**: Step 17 terminated midway with recorded `kind: "restart"` events at timestamps `1789676418` and `1789686193`;
  2. **`ctx_total_length/mean` surging**: Average sequence length climbed sharply past 2,000+ tokens, intensifying activation memory pressure;
  3. **Severe VRAM allocation skew**: Specific expert GPUs ran out of memory while other nodes operated with low utilization.
- **Intervention**:
  Reconfigured hybrid parallelism (expanded Expert Parallelism degrees, enforced Top-k routing capacity limits, and adjusted auxiliary load-balancing loss terms), followed by a warm restart from the Step 17 checkpoint.

---

### Notice 3: Grader Connectivity Failure Restart & Removal of the Cyber Dataset
> **Original Notice**: *"there was a network connectivity issue between the pro training cluster and the grader deployment. we have restarted the run. we also removed the cyber dataset from the upcoming pro run, since we observed some bad patterns in the rollout logs."*

- **Root Cause & Context**:
  Composed of two concurrent events:
  1. Network partition/timeout between the core training cluster and the external automated grader cluster;
  2. Trajectory inspections on the `cyber` (penetration testing and security auditing) dataset revealed **pathological behaviors (Bad Patterns)**, including infinite shell loops, malformed payload injections, and test-rule reward hacking.
- **Metric Evidences**:
  1. **Grader outage evidence**: Sharp jump in `dynsam/infra_error/seq_rate` due to evaluation timeouts;
  2. **Stalled rollouts**: `env/active` and `timing_s/outer_gen` froze, ballooning step latency;
  3. **Cyber dataset anomalies**:
     - `dynsam/cyber/*` reported pass rates decoupled from realistic evaluation;
     - `ctx_response_length/cyber/*` hit maximum sequence cutoffs while `penalty/action/*` fired constantly;
     - Rollout logs revealed repetitive shell trial-and-error designed to exploit grader sandbox vulnerabilities.
- **Intervention**:
  1. Restored network connectivity and restarted the run;
  2. **Permanently excised the `cyber` dataset** from subsequent Pro training configurations to prevent policy contamination.

---

### Notice 4: Flash Run Step 15 Restart (Undetected Silent Infra Errors)
> **Original Notice**: *"we restarted the flash run from step 15. reason: a type of infra error on one of datasets was not correctly detected over the past ~3 hours."*

- **Root Cause & Context**:
  Sandboxes for a specific dataset repeatedly threw execution errors (missing dependencies/port collisions), but the evaluation harness misclassified them as failed code executions (`score = 0`) instead of logging an `infra_error`. The model was erroneously penalized for valid reasoning, corrupting policy distribution over that task domain.
- **Metric Evidences**:
  1. **`dynsam/<faulty_dataset>/avg@n` collapsing to zero**: The affected dataset plummeted to near 0% pass rate over a 3-hour window while adjacent coding tasks remained healthy;
  2. **`dynsam/infra_error/seq_rate` under-reporting**: Failed to reflect the operational breakdown;
  3. **`critic/value_loss` surging**: The Critic could not fit the stochastic zero-rewards induced by sandbox bugs;
  4. **`dynsam/passrate/zero` climbing abruptly**.
- **Intervention**:
  Patched sandbox error classification logic, discarded tainted Step 15 weights, and **rolled back training to resume from Step 15**.

---

### Notice 5: Single-Node VRAM Failure Restart
> **Original Notice**: *"the mimo-v2.6-pro run is restarting due to a vram issue on one node."*

- **Root Cause & Context**:
  Physical hardware failure on a compute node (e.g., uncorrectable double-bit ECC memory error on a GPU, or PCIe bus link degradation causing kernel timeouts).
- **Metric Evidences**:
  1. **Heartbeat freeze**: `status.step.since` climbed past normal operational thresholds while `perf/total_num_tokens` flatlined;
  2. **NCCL timeout**: Trainer AllReduce collective communication raised `NCCL watchdog timeout`;
  3. **Node-level syslog alerts**: Hardware alerts reporting GPU driver detachment ("GPU fallen off the bus").
- **Intervention**:
  Automated cluster scripts cordoned and drained the faulty node, substituted a healthy spare, and resumed training from the latest validated checkpoint.

---

### Notice 6: Offline Benchmark Synchronization (DeepSWE Refresh)
> **Original Notice**: *"we have updated the latest deepswe results for flash step 12 & pro step 8. we will keep posting as the offline evaluation results come out."*

- **Root Cause & Context**:
  Comprehensive offline benchmarks like DeepSWE require long execution runs across hundreds of GitHub repositories. They run asynchronously on isolated evaluation clusters rather than on the synchronous training path.
- **Metric Evidences**:
  - `flash` Step 12 attained **60.77%**;
  - `pro` Step 8 attained **62.24%**;
  - Offline scores tracked the online `dynsam/avg@n` trajectory closely (Pro reached 0.6027 at Step 8; Flash reached 0.6077 at Step 12), confirming authentic, generalizable reasoning progression.

---

## 5. LLM RL Metric Cross-Diagnostic Rules & Engineering Playbook

Experienced RL practitioners rely on a cross-metric diagnostic framework to maintain training stability at scale:

```
          [Core RL Health Diagnostic Triangle]
       
                    rollout/reward (Steady Climb)
                              ▲
                             / \
                            /   \
                           /     \
   train/approx_kl ─────────────── dynsam/passrate
 (Bounded in 0.001~0.01)       (Healthy bell curve, centered on intermediate difficulty)
```

1. **Authentic Learning vs. Reward Hacking**:
   - **Authentic Learning**: `critic/rewards/mean` climbs steadily, `train/approx_kl` remains within a modest corridor, offline `DeepSWE` benchmarks advance in tandem, and `dynsam/passrate/hist9` reflects migration from intermediate to high pass rates.
   - **Reward Hacking**: `critic/rewards/mean` surges while offline `DeepSWE` collapses; `ctx_response_length` caps out at maximum limits, `train_infer_diff/kl` widens, and `actor/entropy_loss` crashes to zero. The model is exploiting sandbox loopholes rather than mastering task logic.

2. **Cluster Bottleneck Diagnostic Checklist**:
   - **Slow Step Latency**: Inspect `timing_s`. If `outer_gen` dominates, profile sandbox concurrency (`env/active`) and inference engine throughput. If `trainer_ops` dominates, investigate AllReduce topology and expert load distribution.
   - **VRAM OOM Crashes**: Monitor `ctx_total_length` and expert routing distributions. Truncate context windows if total length explodes; balance auxiliary loss weights if experts are skewed.
   - **Training Divergence**: Check both KL metrics. If `actor/ppo_kl` spikes, reduce `actor/lr`; if `train_infer_diff/kl` widens, inspect numerical precision differences between training and inference engines.

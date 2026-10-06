---
title: "Agent Skills in 2026: A Survey from SKILL.md to On-Demand Loading, Training, Acceptance Gates, and Signing"
description: "A 2026 survey of Agent Skills organized as a lifecycle—write, install, select, execute, learn, accept, govern—covering the SKILL.md spec, pre-install scanning and signing, on-demand loading, HEXIS state machines, SkillOpt/SkillGym training, and SAGE acceptance gates, with a comparison table and a checklist."
pubDate: 2026-10-06T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools", "Agent Skills"]
lang: "en"
---

Early talk about Agent Skills meant one thing: a folder with a `SKILL.md` saying what the skill is called, when to use it, and how to do the task, read into context when needed. By autumn 2026 that idea has split into several lines: on-demand loading, selective activation, compiling skills into state machines, optimizing skills or training them into weights, regularizing and statistically gating automatic evolution, and scanning and signing before installation. Google has also announced that Gemini's Gems will become skills.

This site has already covered several of these papers individually: [Progressive Disclosure](/blog/progressive-disclosure-agent-skills/), [SkillDelta](/blog/skilldelta-selective-skill-activation/), [HEXIS](/blog/hexis-skills-compiled-to-fsm/), [SAGE](/blog/sage-statistical-acceptance-gate-self-evolving-skills/), and [SkillSpector](/blog/nvidia-skillspector-agent-skills-trust-pipeline/). This hub post follows a skill from creation to retirement—**write, install, select, execute, learn, accept, govern**—mapping what each stage solves, how strong the evidence is, and where the limits are, then ends with a checklist.

Numbers come from the papers or official pages. Most papers are late-September 2026 preprints with different benchmarks and protocols, so **numbers across papers are not directly comparable**. Paragraphs marked "Analysis" are my judgment.

## First: there are at least three kinds of "skill"

Same name, different things. By layer, roughly three kinds:

- **Document skills**: the agentskills.io kind—a directory with a `SKILL.md`, optionally `scripts/`, `references/`, `assets/` [1]. Progressive Disclosure, SkillDelta, HEXIS, SkillOpt, SAGE, and SkillSpector deal with these; SkillEvoReg's definition is broader, covering instructions, procedures, code, and structured resources [15].
- **Code skills**: in the Abstraction Ladder paper, a skill is a Python procedure issuing sequences of low-level NetHack actions. Remark 2.1 notes this is related to, but different from, skills as "agentic markdown files" [10].
- **Parameter skills**: READ trains one LoRA adapter per task and combines them in one model [14]; SkillGym turns human-written document skills into training environments, so capability lands in the weights [13].

They convert into each other: documents can be compiled into state machines (HEXIS), turned into training data (SkillGym), or rebuilt with the policy (RLHarness). I mostly follow document skills.

## The map

1. **Write**: format, body length, when to split files.
2. **Install**: is it safe, non-duplicate, useful, untampered.
3. **Select**: which skill to load, and whether loading it adds value.
4. **Execute**: let the model "follow the instructions," or let a runtime own the procedure.
5. **Learn**: can skills be optimized, trained into models, evolved with the policy.
6. **Accept**: on what basis an automatic edit gets merged.
7. **Govern**: distribution, migration, retirement.

## Write: a minimal format

The agentskills.io specification is short [1]. Two frontmatter fields are required: `name` (1–64 characters, lowercase letters, digits, hyphens; must match the parent directory) and `description` (1–1024 characters, saying what the skill does and when to use it, with keywords that help agents spot relevant tasks). Optional: `license`, `compatibility` (up to 500 characters on environment needs), `metadata`, and the experimental `allowed-tools` (pre-approved tools; support varies by implementation).

The part that shapes everything later is progressive disclosure: at startup only each skill's `name` and `description` load, about 100 tokens; the full `SKILL.md` loads on activation, recommended under 5000 tokens and 500 lines; files in `scripts/`, `references/`, `assets/` load only when needed, with references one level deep [1]. The overview page frames this as discovery, activation, execution, and says the format was developed by Anthropic and released as an open standard [2]. `skills-ref validate` checks frontmatter and naming [1].

(Analysis) The format is deliberately thin: it specifies how a skill is discovered and almost nothing about how it is executed; the body has no format restrictions [1]. Execution reliability is left to the model, and most work in the select, execute, and accept stages fills that gap.

A community example is addyosmani/agent-skills: its README organizes 25 skills into a define–plan–build–verify–review–ship flow with 9 slash commands (such as `/spec`, `/plan`, `/build`, `/ship`), and skills also activate based on the work at hand—designing an API triggers `api-and-interface-design` [3]. See also the [starter guide](/blog/agentskills-io-starter-guide/) and the [CLAUDE.md / AGENTS.md deep dive](/blog/claude-md-agents-md-deep-dive/). Roughly, a skill is "the part of AGENTS.md loaded only when needed"—my analogy.

## Install: scan, deduplicate, evaluate, sign

A skill can hold scripts and ask the agent to run commands, read files, call tools, or fetch remote content; NVIDIA's docs call skills a new supply-chain surface [6].

SkillSpector is NVIDIA's open-source skill scanner. Its README reports that in a 31,132-skill analyzed subset of a research dataset, 26.1% contain vulnerabilities and 5.2% show likely malicious intent [5]. It covers 71 patterns in 17 categories, including prompt injection, data exfiltration, privilege escalation, supply chain, memory poisoning, and MCP tool poisoning. It runs fast static analysis plus optional LLM semantic evaluation, and outputs terminal, JSON, Markdown, or SARIF for CI [5]. A risk score above 51 means "do not install" [5]. As an MCP tool, `scan_skill` reports whether an LLM was used, so a static-only low score is not mistaken for a full verdict [5].

The surrounding pipeline is the part worth copying. NVIDIA's Trust Pipeline docs split pre-release review into five questions, each with one piece of evidence [6]:

- **Safe to run?**—the SkillSpector report, part of SkillEvaluator's first tier, which also checks schema, license, PII, and Unicode safety.
- **Already in the catalog?**—tier two, semantic overlap against existing skills, so one capability is not published under two names.
- **Does it improve output?**—tier three: real agents run the same tasks in a sandbox with and without the skill; the per-dimension difference is its measured contribution, recorded in `BENCHMARK.md`.
- **What does it do, who owns it?**—the skill card.
- **Is what shipped what was reviewed?**—a detached signature over the directory, `skill.oms.sig`.

The key line: a skill can pass every security check and still make an agent worse; a skill that does not improve performance should not ship, whatever its security score [6]. Scanning, evaluation, and signing answer "looks safe?", "helps?", and "reviewed artifact?"—they do not substitute for each other.

Installation has pitfalls too. The addyosmani README warns that `npx skills add` for a single skill copies only `skills/<name>/`, not the repo-level `references/`; the skill works, but shared-checklist paths break [3]. (Analysis) Inter-skill dependencies are mostly implicit; "installed" is not "installed completely."

The [SkillSpector post](/blog/nvidia-skillspector-agent-skills-trust-pipeline/) covers the 17 categories; [Cloudflare's security-audit-skill](/blog/cloudflare-security-audit-skill-for-coding-agents/) ships an audit procedure as a skill.

## Select: load on demand, then ask whether to inject

As libraries grow, full-text loading fails. A Workday report compares eager loading (full disclosure) with progressive disclosure (frontmatter first, `load_skill` on demand) on a controlled skill-retrieval task [7]. At library size 100, eager loading crashes on every rollout (crash meaning context overflow or malformed output); with Qwen3-14B at size 50, progressive disclosure saves 81.7% of tokens [7]. The cost is more model calls and slightly higher latency; average retrieval quality improves [7]. Open questions it leaves: how many skills a task needs, which supporting files to load, which skills are safe to include [7].

On-demand loading answers "does it fit," not "does it help." SkillDelta starts there: skills often bring no benefit, can lower success, and cost tokens [8]. It uses paired runs of the same agent with and without a skill to estimate how much the skill raises success on a task, then transfers historical gains to new tasks with a local predictor, without retraining [8]. Across five benchmarks and three agents (15 settings), paired history ranks gains better than skill-assisted outcomes alone in 12; at matched skill-use rates SkillDelta beats random activation in all 15, by 4.3 points on average [8]—3.72 from allocation across task groups, only 0.61 from selection within groups [8].

One practical comparison: asked to judge for itself, the agent enables the skill on over 91% of tasks in 14 of 15 panels—nearly "always on" [8]. (Analysis) A good description plus self-selection solves "findable," not "worth it"; the latter needs with/without data, the same idea as NVIDIA's tier three.

## Execute: from following the manual to a runtime that owns the procedure

The default is Skill + ReAct: at each step the model infers the next action from the skill and history. HEXIS argues this couples applying knowledge with controlling the procedure; each step can deviate, and over many steps cumulative deviation compounds multiplicatively [9].

HEXIS compiles a skill into an extended finite state machine. Knowledge stays in each state's local instructions, where the model reasons and generates; ordering, branching, repetition, and termination become explicit guarded transitions run by the runtime [9]. The compiler drafts a machine from the skill and tool interfaces, then uses development traces to add missing operations and dependencies; each update must pass static checks and replay of the current and all previously accepted traces [9]. Across four benchmarks and four executors, HEXIS beats Skill + ReAct by 16.2 points on average, in 15 of 16 settings; with Qwen3.8-27B it cuts execution tokens by 38.4%–88.9% [9].

Two details matter. Rendering the same machine as a text prompt for the model to follow lowers success and full compliance by 16.8 and 28.0 points on average versus runtime execution—the gain comes from runtime control, not rewritten text [9]. And it complements SkillOpt, which rewrites skill text: on SpreadsheetBench, a SkillOpt-optimized skill run by HEXIS reaches 84.2% at 69k tokens per task, versus 59.6% at 257k when run natively [9]. Limits: branches absent from both document and traces are missing; replay validates only recorded paths [9].

Code skills give another angle. The Abstraction Ladder paper builds CodeHack, 78 Python skills for NetHack, and compares primitives-only, skills-only, and mixed interfaces [10]. Over 14 models zero-shot, skills nearly triple progression and cut inference cost per episode by 86% and tokens by 74%, because CPU-side code takes many environment steps, cutting model calls by an average factor of 5.1 [10]. But abstractions leak. Mixed control keeps 95% of skills-only progression at 2.3× the inference cost, and suffers less when a skill family is removed [10]. In RL at equal budget, dungeon-level gains for skills-only and mixed are 7.2× and 8.6× those of primitives-only [10].

(Analysis) Both say recurring local control decisions should not be re-derived by the model each time—the argument of [Grow the Harness, Not the Context](/blog/grow-the-harness-not-the-context/). HEXIS keeps the document as source; CodeHack needs code first, plus a path back to primitives.

## Learn: skills become things you optimize and train

**SkillOpt.** Microsoft's SkillOpt treats a compact skill document as the trainable state of a frozen agent. The target model runs tasks with the current skill and records scored trajectories; an optimizer model analyzes success and failure minibatches separately and proposes add, delete, and replace edits; edit size is budgeted—a "textual learning rate"; a candidate is kept only if held-out validation improves [11]. The project page covers 7 target models, 6 benchmarks, and Codex and Claude Code harnesses, with SkillOpt best or tied-best in every setting; GPT-5.5 in direct chat gains 23.5 points on average [11]. The export is a single `best_skill.md`, the only thing the target model reads at deployment; a SpreadsheetBench skill trained in Codex gains 31.8 in Claude Code [11]. Removing the learning rate, rejected-edit buffer, or slow update lowers scores [11].

**RLHarness.** Its question: once RL changes the policy, does the old skill set still fit [12]? It packs skills, selection and execution protocols, few-shot demonstrations, and task contracts into one versioned harness, alternating with policy learning: build an initial harness and export version-aligned verified traces for SFT and a first DAPO block; then rebuild skills, protocols, and demonstrations from the new policy's successes and failures, and run a second DAPO block on the rebuilt program [12]. MetroMap and TravelMap accuracy rise from 16.25% and 27.50% to 62.00% and 50.00%; all four tasks peak only after reconstruction plus the second block [12]. Limitations: only two update cycles, and the MetroMap 62.00 comes from an earlier reconstructed branch; post-RL rewritten prompts transfer poorly across tasks with different rules [12].

**SkillGym.** If a skill encodes a whole workflow, use it as a training environment. SkillGym takes an online registry of human-written skills, organizes it into 12 categories and 63 subcategories, instantiates tasks from templates, verifies outcomes with code checkers, and keeps tasks that contrastive with/without runs show actually depend on the skill [13]. It releases 2,756 environments and 8,364 successful trajectories averaging 49 tool calls [13]. Under Claude Code, SFT lifts Qwen3.5-35B-A3B by 199 Elo on GDPval-AA v2 and 19.10 points on Terminal-Bench 2.1; on SkillsBench v1.1 it gains 28.13 with skills and 12.38 without [13]. Without skills, the trained model beats the skill-assisted base under both harnesses; RL training is listed as future work [13].

**READ.** At the parameter level, READ asks how to add a new LoRA skill without breaking old ones [14]. Each adapter is rewritten into a balanced canonical form that preserves its update exactly, and coupling grows one way only: a new skill can read old skills' input subspaces but cannot write into their output subspaces; each append trains only the new skill's coupling row [14]. The composed update folds into base weights with no inference overhead [14]. It beats the strongest published baselines built from the same adapters by more than 20 points on SuperGLUE and more than 7 on the domain suite; 72 of 92 sequential appends pass a preregistered reliability rule. The weak spot is BBH, where all eight terminal losses occur, which the authors attribute to the new skill learning too little rather than old skills being damaged [14].

(Analysis) Side by side, "where a skill lives" has forked: SkillOpt keeps it in a document; RLHarness keeps it in both document and weights, evolving together; SkillGym converts documents into weights; READ composes directly in weights. The choice depends on whether you need skills to be readable, auditable, and reversible—documents give all three, weights none.

## Accept: regularize evolution, gate merges statistically

Automatic editing is a learning process, and it overfits. SkillEvoReg calls this skill-evolution overfitting: locally useful edits pile up into redundant or task-specific instructions, and new edits break behavior that worked [15]. It borrows three tools from neural-network training: skill dropout (perturbing update generation), complexity-aware local regularization (limiting needless structural growth), and causal counterexample validation, CCV (targeted tests for regressions a candidate may introduce), keeping each system's native updater and evaluator [15]. Across five ContinualSkillBench domains, skill count, tokens, and complexity all fall—Finance from 28 skills to 17, Mathematics skill tokens from 21,952 to 16,368. Held-out performance improves in four domains; Office dips from 82.49 to 81.05 [15].

SAGE guards the final gate. Self-evolving loops like SkillOpt have carefully engineered optimizers, yet the gate still says "accept if the aggregate validation score rises" [16]. Two problems: the aggregate can rise while already-solved items break, causing permanent regressions; and the best observed score on a finite, noisy validation set is biased upward—the Optimizer's Curse [16]. SAGE compares current and edited versions item by item on identical validation items, penalizes regressions asymmetrically, and applies a one-sided paired test, committing only when wins are statistically reliable against losses [16]. Under equal budgets across five benchmarks and four backbones (20 settings), regression rates fall in 19 and match the baseline in 1—with DeepSeek-V4, LiveMath from 36.5% to 0% and OfficeQA from 42.8% to 0%; SAGE also has the highest final score in all 20, lifting LiveMath from 34.15 to 48.78 [16]. The site's [RSI survey](/blog/rsi-recursive-self-improvement-survey-2026/) also asks what gets modified and who signs off.

(Analysis) HEXIS's replay of all accepted traces, SkillOpt's held-out validation, SkillEvoReg's CCV, and SAGE's paired test are four strengths of one thing: regression testing, applied to artifacts written in natural language.

## Govern: platforms fold skills into products

On September 28, 2026 (PDT), TechCrunch reported that Google is shutting down Gemini's Gems—launched in 2024 for building custom task assistants—and that from November 17, 2026, Gems migrate automatically to skills usable across different AI tasks; users need do nothing, and Gems work until then [4]. Afterward, users type `/` in a task thread to pick a skill; TechCrunch says engineers, not regular users, tend to prefer that interface [4]. The report does not say whether Gemini skills use the agentskills.io format; I won't guess.

(Analysis) This shows direction: "instructions customized for a task" is moving from a standalone product feature to a reusable capability unit that, like a dependency package, needs versions, owners, and retirement. NVIDIA's skill card—owner, license, use case, deployment geography, output shape, risks [6]—is what that management layer looks like.

## Comparison table

| Stage | Work | Problem solved | Key evidence | Limits |
| --- | --- | --- | --- | --- |
| Write | agentskills.io spec [1][2] | Common directory and frontmatter; progressive disclosure | Spec; `skills-ref validate` | Discovery, not execution |
| Install | SkillSpector + Trust Pipeline [5][6] | Risk scan, dedup, measured gain, signing | 26.1% of 31,132 sampled skills vulnerable, 5.2% likely malicious | Clean scan ≠ safe; semantic scan optional |
| Select | Progressive Disclosure [7] | Library no longer fits | Eager crashes on all rollouts at N=100; up to 81.7% tokens saved | One skill per task; slightly higher latency |
| Select | SkillDelta [8] | Relevant ≠ helpful | Beats random activation in 15/15, +4.3 points | Needs paired history; gain mostly between groups |
| Execute | HEXIS [9] | Deviation from re-deriving the procedure | +16.2 points, 15 of 16 settings | Uncovered branches missing |
| Execute | CodeHack [10] | Primitive actions too costly | ~3× progression, −86% cost | Hand-written code library; abstractions leak |
| Learn | SkillOpt [11] | Hand-written skills not good enough | Best or tied-best, 7 models × 6 benchmarks | Only as good as the held-out gate |
| Learn | RLHarness [12] | Fixed skill bank lags evolving policy | All four tasks peak after reconstruction | Two update cycles |
| Learn | SkillGym [13] | Skills read at inference never become capability | +19.10 points on Terminal-Bench 2.1 after SFT | SFT only; RL future work |
| Learn | READ [14] | Interference when combining LoRA skills | 20+ points over best baseline on SuperGLUE | Parameter skills; fails on BBH |
| Accept | SkillEvoReg [15] | Evolution overfitting, bloat | Count, tokens, complexity down in all five domains | Small drop in one domain |
| Accept | SAGE [16] | "Merge if aggregate rises" admits regressions | Regression rate lower in 19 of 20 | Commits a subset of baseline edits |
| Govern | Gems → skills [4] | Custom assistants become reusable capabilities | Auto-migration from Nov 17 | Format not reported |

## Cross-cutting observations (Analysis)

**Knowledge and control are separating.** HEXIS gives control flow to a runtime, CodeHack gives local decisions to code, RLHarness versions selection and execution protocols. "What to know" and "in what order to act" are increasingly stored apart.

**Findable, relevant, and useful are different.** Progressive disclosure solves findable; SkillDelta shows relevant is not helpful; NVIDIA says a skill can pass security and still hurt. Useful is what counts.

**With-versus-without is the common yardstick.** SkillGym filters tasks with it, SkillDelta predicts gains with it, NVIDIA's tier three decides shipping with it. Without such data, "this skill works great" is just the author's claim.

**Skills look like software artifacts.** Versions (RLHarness), regression tests (HEXIS, SAGE), complexity budgets (SkillEvoReg), dependency declarations, signatures (NVIDIA)—the supply-chain toolkit is moving over.

**The evidence is early.** Most papers are unreviewed preprints; HEXIS machines are compiled by a strong model, and SkillOpt says a stronger optimizer gives the largest gains [9][11]. Reproduce comparisons on your own tasks before quoting improvements.

## Checklist for teams maintaining a skill library

**Write**

- `description` says what and when, with task keywords; `name` matches the directory; run `skills-ref validate` before committing [1].
- Keep `SKILL.md` under 500 lines; move long references to `references/`, one level deep [1].
- Declare shared files explicitly; check a skill is complete when installed alone [3].

**Install**

- Statically scan third-party skills before install, and record whether a semantic scan ran [5].
- Every skill has an owner, license, and risk statement—a skill card [6].
- Sign releases; have CI verify signatures before install [6].
- Check for overlap with existing skills before admitting one [6].

**Select**

- Default to progressive disclosure, not full loading [7].
- Keep paired with/without evaluations for frequent skills; don't look only at success with the skill [8].
- Don't treat "the model wants to use it" as evidence it helps [8].

**Execute**

- For skills with hard ordering rules (validate before submitting), consider moving control flow into a runtime or script [9].
- For code skills, keep a path down to low-level operations [10].

**Learn and accept**

- Bound edit size in automatic optimization; keep rejected edits [11].
- Before merging, compare versions item by item on the same validation set and track regressions separately, not just the aggregate [16].
- Keep historical trajectories for regression replay [9].
- Set count and token budgets for the library; merge redundant skills periodically [15].
- (Analysis) After a base-model upgrade, rerun comparisons to confirm skills still help—RLHarness suggests skills and their model go stale together [12].

**Govern**

- Version skills and review changes; announce migrations and retirements with a transition period—Gemini announced first and migrates on a set date [4].

## What this post does not cover

Only material whose primary source I read. The SkillsBench figure (curated skills lifting average pass rate from 33.9% to 50.5% on 87 tasks) is cited via HEXIS [9]; I did not read the original and treat it as background. Skills versus MCP, real client support for `allowed-tools`, and skill-marketplace economics are not covered.

## References

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
11. Microsoft. SkillOpt: Executive Strategy for Self-Evolving Agent Skills (project page; paper arXiv:2605.23904). https://microsoft.github.io/SkillOpt/
12. Ziqiao Shang et al. RLHarness: Co-evolving Procedural Skills with Reinforcement Learning for Long-horizon Multimodal Reasoning. arXiv:2609.32326. https://arxiv.org/abs/2609.32326
13. Zhilong Ge et al. SkillGym: Internalizing Human Skills into LLMs for Real-World Problem Solving. arXiv:2609.27717. https://arxiv.org/abs/2609.27717
14. Zeyan Li et al. New LoRA Skills Should Read but Never Write (READ). arXiv:2609.31600. https://arxiv.org/abs/2609.31600
15. Guanyu Nie et al. SkillEvoReg: Regularizing Agent Skill Evolution Against Overfitting. arXiv:2609.30861. https://arxiv.org/abs/2609.30861
16. Yihao Wang et al. SAGE: A Statistical Acceptance Gate for Self-Evolving Agents. arXiv:2609.36043. https://arxiv.org/abs/2609.36043

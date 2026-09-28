---
title: "Three Cost-Wasting Habits in Coding Agents—and Why Developer Skills Beat Synthesized Ones"
description: "Reading Purdue arXiv:2609.30725: across 1,200 Claude Code and Mini-SWE-Agent trajectories, three behaviors hit 79–98% of tasks and up to 22.75% of task cost; structure-aware retrieval can raise cost 28.14%; developer-designed skills cut ~2× agent-synthesized skills."
pubDate: 2026-09-28T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "agent-loop", "developer-tools"]
lang: "en"
---

When coding-agent bills spike, teams usually argue about model list prices, cache hit rates, and routing. Our post on [controlling the harness to control cost](/blog/control-the-harness-control-the-cost/) is about that layer: who picks the model, who owns the prompt-cache boundary, which model a subagent inherits. A quieter leak sits inside trajectories that already pass the task—agents keep doing “reasonable” repeats: re-reading code that was already retrieved, regenerating near-duplicate scripts, re-running the same tests without a new patch. None of those steps looks crazy alone; stacked, they burn tokens and wall-clock time.[1]

Hu, Jiang, Liang, Dey, Wu, and Tan (Purdue) claim the first systematic study of these *behavioral* cost inefficiencies in [arXiv:2609.30725](https://arxiv.org/abs/2609.30725) (HTML: [full text](https://arxiv.org/html/2609.30725)). They analyze **1,200** trajectories from Claude Code (CC) and Mini-SWE-Agent (MSA) across four configurations on SWE-bench Verified, name three recurring wastes—**subsumed retrieval (SubRetrv)**, **similar script generation (SimScrpt)**, and **test re-execution (ReTest)**—then evaluate three mitigations over roughly **10k** trajectories on held-out Verified and Pro tasks. Headline findings: (1) the three behaviors affect **79.00%–98.00%** of tasks and account for up to **22.75%** of task monetary cost; (2) structure-aware retrieval (CodeGraph-style) is not inherently cheap—cost rises by up to **28.14%** in some settings; (3) agent-synthesized skills (SynSkills) cut cost by at most about **22.32%** and stay low-level and trace-specific; (4) developer-designed skills (DevSkills) robustly cut **7.88%–41.73%** in six of eight settings—roughly twice the best SynSkills gain.[1]

This is not a SWE-bench score chase. It plugs into the site’s harness/skills line: this morning’s [exactly-once post](/blog/exactly-once-model-harness-tool-contract/) was about **side-effect reliability**; this one is about **repeated spend inside a passing trajectory**. Do not prescribe the same medicine for both.

## How expensive are the three together?

Looking at SubRetrv, SimScrpt, and ReTest one at a time understates the joint load. Table 1’s any-of-three row stretches task coverage from **79.00%** on CC up to **98.00%** on some MSA configs, and monetary share from about **6.86%** to **22.75%**. In the worst config–task combinations, roughly a fifth of task spend is labeled detectable repeat labor—not necessary exploration.[1]

Timing also tells you where to put gauges. SubRetrv piles into the first half (localization and reading); ReTest slides toward the middle-to-late validation phase; SimScrpt spans reproduction, editing, and checks. An end-of-task token total will miss “retrieval repeats early” versus “test spin late,” which want different fixes.[1]

CC’s lower overall inefficiency is not a mystery slogan. The body already lists checkable mechanisms: a built-in “don’t create files unless necessary” rule suppresses file-based SimScrpt; line-numbered Read and edit tools that echo results suppress within-sequence and patch-adjacent SubRetrv; subagent delegation turns part of SubRetrv into the cross-agent form (summary return → main agent re-reads). The mitigation section adds a symmetric note: **gains are generally larger under MSA**, while CC’s system prompt and tool abstractions already suppress several wastes, leaving less headroom; skill-based methods also look better overall on Verified-200 than Pro-100—partly a generalization gap, since skills were derived from Verified traces and applied to Pro.[1]

## Study design: discover behaviors, then stress-test mitigations

Three research questions structure the paper. RQ1: which cost-inefficient patterns show up in coding agents? RQ2: can structure-aware retrieval tame retrieval waste? RQ3: how do agent-synthesized skills and developer-designed skills change behaviors and end-to-end cost?[1]

Two harness families, four configs: **Claude Code** with Sonnet 4.6 (S46); **Mini-SWE-Agent** with S46, MiniMax-M3 (MM3), or Qwen-3.5 Plus (Q35+). For RQ1 the authors take the earliest **300** SWE-bench Verified tasks per-repository by creation date (**1,200** trajectories), normalize traces, label actions with an author taxonomy (rules + LLM assist), and calibrate detectors for the three behaviors. Mitigation evaluation holds out the remaining **200** Verified tasks (Verified-200) and samples **100** SWE-bench Pro tasks (Pro-100; all 11 repos, biased toward costlier instances). CodeGraph, SynSkills, and DevSkills run on that 300-task set with repeats for stochasticity—the abstract’s “over 10k trajectories.”[1]

Temporally, SubRetrv concentrates in the first half of a trajectory (retrieval-heavy), ReTest shifts toward the middle-to-late validation phase, and SimScrpt spreads across reproduction, editing, and checks. CC shows the lowest overall inefficiency—an architectural story (line-numbered Read, richer edit feedback, built-in “don’t create files” guidance, subagent summaries), not a one-line “smarter model” claim.[1]

## A bill slice: django-13158

Figure 1 walks Claude Code through SWE-bench Verified `django-13158` (fix `QuerySet.none()` on combined querysets). The run passes, yet the three behaviors consume **17.25%** of that task’s cost:[1]

1. **SubRetrv (6.96%)** — the main agent re-reads 20 lines of `query.py` and 85 of `compiler.py` already covered by subagent retrievals.
2. **SimScrpt (7.10%)** — four similar inline test scripts sharing 21 lines of logic with minor variants.
3. **ReTest (3.19%)** — `test_qs_combinators` executed eight times the same way without updating the patch, hitting the same module error.

The later tables show these are defaults on the 300-task analysis set, not one unlucky run.

## Behavior 1: SubRetrv — subsumed retrieval

For each retrieval \(b\) returning at least five non-empty lines, scan backward for the first prior retrieval \(a\) whose returned context fully covers \(b\); flag \(b\) as SubRetrv. Table 1: most prevalent behavior—**64.33%–92.33%** of tasks, **2.15–6.37** times per task, **5.01%–11.41%** of task cost (the abstract’s “up to 92.33% / 11.41%”).[1]

Mechanisms split by architecture (Table 2). On **CC**, **Cross-Agent SubRetrv**—main-agent reads covered by earlier subagent reads—is **50.15%** of its SubRetrv. Subagents return *summaries*, not raw code; when the main agent needs detail later, it Reads again. Collaboration tax, paid in tokens.[1]

**MSA** looks different:

- **Patch-Adjacent SubRetrv** (immediately before/after a patch): **17.96%–26.47%** on MSA vs **8.67%** on CC. Shell edits (`sed -i`, generated scripts) give weak or silent feedback, so agents re-read to localize or inspect; CC’s editors report updated code and line numbers.[1]
- **Within-Sequence SubRetrv** (both reads inside one uninterrupted retrieval streak): locate-then-zoom. MSA’s `cat` omits line numbers and invites `grep -n` / `sed -n`; CC’s `Read` already numbers lines.[1]
- **Long-Distance SubRetrv** (≥10 steps apart): long debug loops re-fetch stale context; dominant on MSA<sub>MM3</sub> (**52.40%**), matching the longest average trajectory (**77.99** steps vs **29.99–58.06** elsewhere).[1]

Finding 1 for builders: cutting SubRetrv is not “add a smarter search tool.” What subagents return, whether edits echo diffs, and whether reads carry line numbers reshape the waste. Our [grow the harness, not the context](/blog/grow-the-harness-not-the-context/) argument said to grow control into code; here the control plane also needs visibility into *what was already read*.

## Behavior 2: SimScrpt — similar script generation

SimScrpt means regenerating near-duplicate scripts instead of editing existing ones—wasted output tokens and missed reuse. The detector pulls ephemeral scripts (`python -c`, heredocs) and on-disk `.py` files, strips blanks/comment-only lines, keeps ≥5 lines, and pairs a generation \(b\) with the nearest prior script at line-level Jaccard ≥ **0.60** (threshold calibrated on 20 pairs per config; lower thresholds matched generic scaffolding).[1]

Severity ceiling: up to **68.00%** of tasks and **9.57%** of task cost. Almost all of the pain is on MSA: **51.33%–68.00%** of tasks, **7.91%–9.57%** of cost, **2.54–4.29** occurrences per task versus CC’s **20.67%**, **1.02%**, and **0.43**—about **5.91–9.98×** more frequent. MSA also shows a heavy tail: **42–66** tasks per config with ≥6 SimScrpt events, versus two tasks on CC.[1]

Timing: **39.89%–48.84%** of events immediately follow a similar script (full regeneration for a tiny edit); **21.71%–34.60%** sit at least six steps later. Functionally, ephemeral SimScrpt is mostly inspection probes (**81.03%–93.45%**); file-based scripts carry more assertion tests and, on MSA, patch scripts. CC is almost all ephemeral—consistent with its built-in “NEVER create files unless they're absolutely necessary”; MSA has no such guardrail and regenerates persistent test/edit scripts.[1]

Finding 2: an ideal agent should **persist reusable logic and reserve inline scripts for one-off probes**—the same packaging instinct as our [Cloudflare security-audit skill](/blog/cloudflare-security-audit-skill-for-coding-agents/) and [Agent Skills starter](/blog/agentskills-io-starter-guide/), now backed by trajectory cost rather than a security checklist.

## Behavior 3: ReTest — same tests, no new patch

Trajectories are split into inter-patch windows: a new patch can justify re-running tests; within a window, executions of the same tests keep only the final run as potentially decision-relevant and flag earlier ones as ReTest. Result: **49.67%–83.00%** of tasks, up to **5.39%** of task cost; MSA<sub>MM3</sub> averages **5.29** occurrences per task—over twice any other config.[1]

Three common causes: (1) **repository-specific test knowledge gaps** (wrong runner/config, same failure loop); (2) **test-signal recovery** (truncated, ambiguous, or poorly captured output → rerun to “see clearly”); (3) **progress stalls** (long reasoning without a patch update, re-diagnosing the same failure). The eight identical `test_qs_combinators` runs in django-13158 are textbook stalls.[1]

Finding 3: ReTest is not only stubborn models. Truncation policy, whether test-harness docs enter context, and whether the loop demands “change code before retest” all move the curve. Pair that with [ECC-style peripheral knobs](/blog/ecc-agent-harness-optimization/): **repeat test invocations under the same patch fingerprint** are an actionable cost signal.

## Mitigation 1: structure-aware retrieval can raise the bill

CodeGraph-style structure-aware retrieval should, in theory, cut blind file trawls and SubRetrv. RQ2: **it neither consistently reduces SubRetrv nor improves task cost efficiency.**[1]

On CC, SubRetrv falls by more than **75%** on both benchmarks, yet cost rises **8.30%** on Verified-200 and robustly **12.19%** on Pro-100. Table 4 explains why: LLM/tool calls drop about **19.72%–23.21%** / **26.61%–31.47%**, but each CodeGraph query returns about **8.2–16.6×** more tokens than other retrievals, so total tokens barely move. Meanwhile cheaper H45 subagent calls fall from **4.81 / 11.03** per task to **zero** on the two benchmarks while S46 main-agent calls barely change—so the same token volume shifts onto S46 at roughly **3×** H45’s token price.[1]

On MSA the failure mode is often **additive**: ordinary retrieval stays put while agents add **5.65–6.75** CodeGraph calls per task; verbose feedback lifts total tokens **9.11%–29.29%** and cost robustly **8.39%–28.14%** (the abstract’s **+28.14%** ceiling). Even when CodeGraph replaces ordinary retrieval (>20% drop), verbose feedback keeps total tokens flat and cost savings indistinguishable from baseline. Pass@1 is largely unchanged except MSA<sub>Q35+</sub> on Verified-200 (**+5.33** pp).[1]

Finding 4 in one line: **smarter retrieval ≠ cheaper end-to-end.** Score feedback volume, how the tool enters the loop, and whether orchestration quietly changes (e.g. subagents disappearing)—the same crossover logic as [harness cost control](/blog/control-the-harness-control-the-cost/).

## Mitigation 2: SynSkills vs DevSkills — detail loses to principles

Skills (Anthropic-style agent skills) are a light intervention: preload guidance into the system prompt so agents apply it adaptively. Two variants.[1]

**SynSkills**: a lightweight analysis agent on each config’s backbone distills corrective rules from RQ1 traces; Trace2Skill consolidates them into config-specific sets of **23–41** operational rules (failed string substitutions, shell quoting, permission errors, …). **DevSkills**: seven shared behavioral principles hand-derived from RQ1 under two constraints—generalize across configs, and cut waste without sacrificing task performance. Agents must state a concrete hypothesis before retrieval, reuse available context, and justify necessary re-reads (SubRetrv); persist and revise scripts instead of near-duplicates (SimScrpt); understand the test harness, capture output, and rerun only when code changes or new evidence warrants it (ReTest).[1]

Numbers: SynSkills robustly cut average cost in three of eight settings by **8.86%–22.32%**, with no robust cost increase or Pass@1 collapse—and a ceiling near **22.32%**. DevSkills robustly cut **7.88%–41.73%** in **six** settings—nearly twice SynSkills’ maximum—with peak behavior-level cuts of **38.57%–88.91%** across the three behaviors (Table 3 shows peaks such as SimScrpt **-88.91%** and ReTest **-38.57%**). Pass@1 dips once: **-1.50** pp for CC on Verified-200. On MSA<sub>S46</sub>, DevSkills reduce all three behaviors on both benchmarks (SubRetrv **-51.52% / -43.57%**) versus SynSkills’ **-11.38%** and one **+2.50%**.[1]

Mechanism: SynSkills keep low-level, trace-specific instructions (when to use ephemeral scripts, how to handle non-ASCII shell content) that travel poorly across repos; DevSkills cover the same class with “persist and reuse artifacts rather than regenerate near variants.” Finding 5 is an operating model, not a pep talk: **mine evidence from traces, abstract it into trace-agnostic principles, preload those into the harness.** Same family as [SpecHarness holding the pen](/blog/specharness-spec-holds-the-pen/)—control in the harness, not vibes in the next sample.

Amplification matters: task-cost deltas exceed behavior-attributed-cost deltas (fitted slopes about **2.83** on Verified-200 and **1.33** on Pro-100). Preventing one waste shortens the trajectory (fewer later cache-reads of earlier context) and can skip unflagged follow-ons (e.g. reasoning that only existed to interpret a ReTest). List-price tooling understates harness-level interventions.[1]


## How the three mitigations rank

Across configs and benchmarks the authors report three patterns. First, effectiveness generally rises **CodeGraph → SynSkills → DevSkills**: CodeGraph cuts SubRetrv inconsistently and *raises* cost robustly in four of eight settings; SynSkills give moderate savings; DevSkills give the broadest cuts in both task cost and diagnosed behaviors. Second, benefits depend on architecture and benchmark—usually larger on MSA, smaller on CC; better behavior reductions on Verified-200 than Pro-100. Third, end-to-end task-cost deltas amplify relative to behavior-attributed-cost deltas—the **2.83 / 1.33** slopes above.[1]

That ranking is actionable. If a team is about to “add a code-graph MCP to save money,” remember CodeGraph: local SubRetrv can look excellent (**-75%+** on CC) while the bill still moves **+8%–+12%** because feedback is fat and orchestration changes. If a team plans to “let the agent summarize skills from failed traces,” SynSkills show a ceiling near **22.32%** and weak generalization of low-level rules. If a team will spend one human pass to crush RQ1-style findings into a handful of high-level principles and preload them, DevSkills is currently the sturdy side: robust cuts in **six of eight** settings, up to about **41.73%**, with behavior-level peaks to **88.91%** (SimScrpt) and **38.57%** (ReTest).[1]

One measurement caveat on Pro-100: CodeGraph could not run on 13 tasks; comparisons use the remaining **87**.[1]


## How this fits the site’s cost line

| Site post | Cost cut | Relation |
| --- | --- | --- |
| [Control the harness, control the cost](/blog/control-the-harness-control-the-cost/) | Routing, cache boundaries, subagent inheritance | Complementary: rates vs repeat actions under a rate |
| [Grow the harness, not the context](/blog/grow-the-harness-not-the-context/) | Grow control into code | SubRetrv shows context *visibility* is control—subagent summaries induce re-reads |
| [ECC harness optimization](/blog/ecc-agent-harness-optimization/) | Peripheral knobs | Add the three detectors as gauges |
| [Exactly-once contracts](/blog/exactly-once-model-harness-tool-contract/) | Side-effect exactly-once | Different cut: double-writes vs same-state repeat labor |
| [Agent Skills / Cloudflare skill](/blog/agentskills-io-starter-guide/) | Skills packaging | DevSkills evidence: high-level principles beat trace-specific piles |
| [SpecHarness](/blog/specharness-spec-holds-the-pen/) | Spec holds the pen | Same “control in the harness” family; this post targets spend habits |

A fuller enterprise story: **routing and cache set the rate shape; tool feedback and subagent contracts set re-read shape; skill principles decide whether agents dodge the three wastes; tool contracts decide whether writes double.** None substitutes for the others, and no single KPI (“we shipped a code graph”) covers the set.

## Engineering takeaways

1. **Instrument behaviors before “saving tokens.”** The detectors are operational (coverage pairs, Jaccard script pairs, same-test repeats inside a patch window). Label sampled trajectories in CI; Pass@1-plus-total-$ alone will not tell you whether to fix tool feedback or skills.

2. **Fix feedback gaps on the tool surface first.** CC’s fewer patch-adjacent / within-sequence SubRetrvs track line-numbered reads and edit echoes. Echo diffs for shell edits, number `cat`-style reads, let subagents return critical snippets when the main agent will need them—not only summaries. Conversely, a verbose “smart retrieval” MCP can look great locally and worse on the bill, CodeGraph-style.

3. **Layer skills: principles on by default, trace rules as patches.** Seven DevSkills-style principles already target the three behaviors; 23–41 SynSkills-style ops rules belong as repo- or failure-mode patches. Package like [Agent Skills](/blog/agentskills-io-starter-guide/) and the [Cloudflare audit skill](/blog/cloudflare-security-audit-skill-for-coding-agents/): global principles, local specifics.

4. **Keep reliability cost on a separate ledger.** Morning’s [exactly-once](/blog/exactly-once-model-harness-tool-contract/) warning: transparent retries under the model turn lost ACKs into double writes. ReTest/SimScrpt here are **repeat labor on the same state**. Same slogan (“don’t blindly go again”), different fix: idempotency keys vs hypothesis-driven retrieval, artifact reuse, and “edit before retest.”

5. **Do not default to “smarter retrieval” or “let the agent synthesize skills” as the savings button.** Across four configs × two benchmarks, structure-aware retrieval reached **+28.14%** cost; SynSkills topped out near **22.32%** and lagged DevSkills. The lever remains harness design—tool semantics, subagent contracts, preloaded principles—complementary to [routing-side harness cost control](/blog/control-the-harness-control-the-cost/).


A minimal pipeline to port the detectors: (1) normalize retrieval return text and script bodies; (2) label SubRetrv by coverage, SimScrpt by Jaccard, ReTest by same-test repeats inside a patch-fingerprint window; (3) roll counts and attributed tokens/dollars to task-level reports; (4) A/B tool-feedback fixes or seven-principle preloads before betting on structural retrieval. The paper’s monetary shares use its pricing and trajectory metering—recompute dollars on your price sheet, and keep behavior counts as the price-invariant metric.[1]

## Limits and how to read the numbers


We deliberately avoid scoreboard framing. Pass@1 barely moves under most mitigations; the story is **behavior and the bill**. If an internal dashboard still shows only resolve rate, the columns to add are per-task coverage of the three wastes and their attributed spend share—those are what tell you whether principle-style skills are working, not a vague sense that traces “feel shorter.”[1]

Budget limited the study to four configs, the Verified analysis split, and 100 Pro tasks; longer-horizon interactive work may differ; CodeGraph is one popular structural tool, not every retriever. Treat **79%–98% / 22.75% / +28.14% / 7.88%–41.73% / ~2×** as magnitudes under this paper’s setup. Reproduce the detectors on your own harness before shipping DevSkills-style principles.[1]

On this site’s cost/harness line, the contribution is behavioral anatomy: wrong model routing is not the only leak—**with the right model and a passing task, trajectory habits can still eat up to about a fifth of task spend.** Before the next list-price negotiation, ask whether the main loop is re-reading subagent-covered code, regenerating scripts instead of revising them, or spinning tests under an unchanged patch.

## References

[1] Yiran Hu, Nan Jiang, Shanchao Liang, Anik Dey, Yi Wu, Lin Tan. *Analyzing and Mitigating Cost-Inefficient Behaviors in Coding Agents*. arXiv:2609.30725, 2026. <https://arxiv.org/abs/2609.30725>

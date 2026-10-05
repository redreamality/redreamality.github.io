---
title: "Gemini 4 Argon: 1M Output, DeepSWE 77.9%, and 'Defenders First'—How Coding-Agent Teams Should Read It and Choose"
description: "Google released Gemini 4 Argon on 2026-09-30: output limit raised from 64K to 1M tokens, 77.9% on DeepSWE v1.1, and a gated rollout to trusted cyber defenders via the Fairwind Program. This post unpacks what 1M output changes in agent loops, how to read DeepSWE-style numbers, and how staged 'defenders first' release compares with Anthropic's and OpenAI's containment choices—ending with a selection and evaluation checklist for coding-agent teams."
pubDate: 2026-10-05T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "llm", "security", "model-release"]
lang: "en"
---

On September 30, 2026, Google announced its new frontier model, **Gemini 4 Argon**. Three things stand out: the output limit rises from 64K to **1M** tokens; it scores **77.9%** on the long-horizon software-engineering benchmark DeepSWE v1.1, which Google calls a new state of the art; and it is **not launching to developers first**. It goes to trusted cyber defenders through the Fairwind Program—and they, along with Google's internal teams, get a version "without cyber guardrails." Introductory pricing is \$2 / \$10 per million input / output tokens, cached input 95% off; afterwards \$4 / \$20.[1]

As news, that's enough. For coding-agent teams, though, Gemini 4 surfaces three long-running questions:

1. **What does 1M output change in an agent loop?** Does "write it all at once" replace "run, observe, fix," or does it mostly raise the cost ceiling?
2. **How should you read DeepSWE 77.9%?** Why do Terminal-Bench and FrontierSWE rank models differently?
3. **What does "defenders first" mean as a release mechanism?** Next to Anthropic's per-task fallback and OpenAI's shelving of a model, it is one of three containment strategies.

Related groundwork on this site: [agent evaluation reliability](/blog/agent-evaluation-reliability-more-tasks-wont-fix-leaderboard/) on what leaderboards can support; [sandboxing is not enough](/blog/sandboxing-not-enough-rogue-agents-authority/) on why isolation alone doesn't contain; [coding is not solved](/blog/coding-is-not-solved-verification-ownership/) on why verification stays expensive; and competitor posts on [Claude Opus 5.5](/blog/claude-opus-5-5-price-and-performance/) and [GPT-6 Sol / Luna / Astra](/blog/gpt-6-sol-luna-and-astra/). This post places Argon on that map and ends with a checklist.

## Getting the facts straight

Every number below comes from a source I read; brackets point to references. Vendor and third-party figures are kept apart.

**Google (blog post + DeepMind model page)**[1][2]

- Output limit 64K → 1M; the input context stays at 1M (The Decoder adds that Argon accepts text, images, video, and audio and outputs only text).[4]
- DeepSWE v1.1: Argon 77.9%, GPT-6 Astra 74.1%, Claude Opus 5.5 74.2%, Claude Fable 5.1 67.4%.
- Where Argon trails in the same table: FrontierSWE v2 at 55.0% vs Astra 65.5% and Opus 5.5 62.3%; Terminal-bench 4.0 at 57.4% vs Opus 5.5 66.4% and Astra 58.2%; OSWorld-2.0 offline subset at 69.2% vs Astra 72.6%.
- Long context, GraphWalks 256K–1M: Argon 84.2%, Astra 71.8%, Opus 5.5 66.8%.
- Cybersecurity, CWE-bench v1: Argon and Astra tied at 68.0%, Opus 5.5 at 67.0%.
- Gray Swan indirect prompt injection, as VentureBeat reports from the blog's chart: Argon 0.7% attack success rate, Opus 5.5 and Fable 5.1 1.0%, Astra 8.5%, GPT-6 Sol 27.0%.[3]

VentureBeat counted Google's 18 benchmarks: Argon leads outright on 12 and ties on one; Astra leads on three, Opus 5.5 on two.[3] Latent Space says "13 of 19."[6] Same conclusion: **the broadest lead, not a clean sweep.**

**Third-party measurements**

- Artificial Analysis Intelligence Index: Argon (high, the highest reasoning setting currently available) scores 53, tying GPT-6 Astra (max) and one point ahead of GPT-6.1 Sol (max). Claude Opus 5.5 (58) and Claude Sonnet 5.5 (56) remain ahead.[5][4]
- Argon averages **62K** output tokens per task versus **27K** for Astra. That is \$1.99 per task at the introductory price, about 60% of Astra's \$3.26, rising to \$3.98 (about 1.2× Astra) at standard pricing. Artificial Analysis's read: the savings come from lower prices, not fewer tokens.[5]
- On Artificial Analysis's own Terminal Bench 4 run, Argon gets 57%, behind Sonnet 5.5 (64%), Opus 5.5 (60%), and Astra (59%).[5]

**Availability:** as of this writing, Argon is open only to Fairwind members and Google's internal teams. Paid API customers and Google AI Ultra subscribers are next, with no date given.[1][7]

So today (October 5) you cannot put Gemini 4 Argon into a production harness. Read it as a **reference anchor**: where the frontier is moving, and what to be ready to test next.

## 1M output changes the *shape* of agent work, not just the ceiling

### First: this is an output limit, not a context window

"1M" is easy to misread as a context window. Argon's input context was already 1M; what changed is **how long one generation can be**. Google's framing: with headroom to "think deeply and generate hundreds of thousands of tokens in a single trajectory," the model can "solve tough problems in one go."[1]

The mechanics: The Decoder and Artificial Analysis both describe a new Gemini API feature, **Long Decode Continuation**, which pauses a long response and resumes it through follow-up requests so reasoning doesn't hit a timeout. Artificial Analysis reached the full 1M with it on.[4][5] Latent Space relays a Vals measurement of about 262K max output per single request.[6] So **1M is an output assembled by a relay of requests, not one uninterrupted reply**—which matters for harness design.

### Two shapes of agent work

Most coding agents run an **iterative tool loop**: the model writes a small piece (a command, a patch), the harness executes it and feeds back the observation, and so on. Per-turn output stays far below 64K (on the DeepSWE leaderboard Astra averages 30K output tokens over 29 steps for a whole task[8]); what gets long is the trajectory.

1M output opens another shape: **long single-shot generation**. The model reasons at length (reasoning tokens count as output), then emits a large artifact—a full migration, a complete report. The difference isn't intelligence; it's **where verification happens**:

- In a loop, every step is a checkpoint—did the command run, did tests pass? Errors surface within a few steps.
- In single-shot generation, the checkpoint moves to the end. An early wrong assumption can ride through hundreds of thousands of tokens until the tests finally run.

### More output does not mean more problems solved

The DeepSWE v1.1 leaderboard lists output tokens and steps: GPT-6 Astra averages 30K tokens and 29 steps for 74% pass@1; Gemini 3.8 Flash averages 143K tokens and 166 steps for the same 74%.[8] Two very different ways of working, one score. The DeepSWE paper is blunter: output tokens, wall-clock time, and cost vary by an order of magnitude across agents, yet none correlates strongly with pass rate.[9]

Add Artificial Analysis's 62K vs 27K,[5] and a 1M ceiling is first a **cost axis**, only possibly a capability axis. It makes room for tasks that truly need very long reasoning; it doesn't improve ordinary tasks by itself.

### How very long outputs fail

At hundreds of thousands of tokens, expect at least these, and test each during selection:

1. **Drift and self-contradiction.** Interfaces, names, and assumptions fixed early get quietly changed later. Loops catch this fast via compiler and tests; in a long generation the contradiction can sit at opposite ends of one output.
2. **Broken relays.** If 1M relies on chained requests: what if the Nth continuation fails? Does the produced part count? Does a retry start over? A classic idempotency problem, like side-effect contracts for tool calls.
3. **Budget blowups.** At Google's rates, a maxed-out 1M-token output costs about \$10 introductory and \$20 standard (rate × volume, output only). One call is cheap; retries and parallel branches multiply it.
4. **Review that can't keep up.** Nobody reads a diff of hundreds of thousands of tokens line by line. Google says its C/C++-to-Rust rewrites—including the 800K+-line Fuchsia Zircon kernel—undergo "rigorous automated and manual auditing, emulation testing, and review before rolling out to production."[1] Even the vendor doesn't merge them straight in.

### What Google's showcase examples have in common

Google's internal examples: on a quantum subroutine, Argon beat the published baseline on spacetime resources (qubits × gates) by 40%; Argon agents mined fleet-wide profiling telemetry and freed over 300 TiB of memory; on the libgav1 video decoder, agents started from an existing Rust port, replaced 32K lines of SIMD code, and made it 2.7× faster **with identical video output**.[1]

Each has a **cheap, strong oracle**: resources can be counted, memory measured, decoder output compared bit for bit. That is the real precondition for letting a long-horizon agent run—not model strength, but whether a machine can catch mistakes quickly and deterministically. Without such an oracle, 1M output more likely hands you a huge artifact that's hard to accept. As [coding is not solved](/blog/coding-is-not-solved-verification-ownership/) argues, generation gets cheaper while verification and ownership stay expensive.

### What this means for your harness

- Treat 1M as a **ceiling, not a default**: budget each call and each trajectory.
- **Generate in verifiable segments**: plan and interfaces first, then module by module, each passing tests—cutting long generation back into a checkpointed loop.
- **Resume from committed state**, so a failure redoes only the last segment.
- Use long output for **tasks with strong oracles**: migrations with regression tests, optimizations with benchmarks, rewrites with equivalent output.

## DeepSWE 77.9%: how you read it matters more than the number

### What DeepSWE measures

Datacurve's DeepSWE has 113 tasks across 91 active open-source repositories in five languages (TypeScript, Go, Python, JavaScript, Rust). Unlike the SWE-bench lineage, tasks are **written from scratch and never merged upstream**, so reference solutions stay out of scraped commit history; grading uses **hand-written functional verifiers** that accept any implementation providing the requested functionality. An independent LLM judge disagreed with DeepSWE's verifier 1.4% of the time versus 32.4% for SWE-Bench Pro's inherited tests. Prompts are about half as long as SWE-Bench Pro's, yet reference solutions touch 5.5× more code.[9]

v1.1 grades only the agent's committed diff, in a fresh isolated container, so the agent can't monkey-patch the test framework, and dropped tests or early exits show up as missing or failed.[8]

That makes DeepSWE one of the more trustworthy implementation benchmarks. Trustworthy doesn't mean 77.9% compares at face value.

### Question 1: do the three numbers come from the same measurement?

No. Google's methodology page says Argon's DeepSWE score is **self-computed** with a mini-swe-agent harness; Astra's comes from the public leaderboard; Fable 5.1's and Opus 5.5's from their system cards, using each model's highest-scoring thinking level as reported by Datacurve.[10]

The public leaderboard (updated September 22) shows Astra at 74% ± 3%, Gemini 3.8 Flash at 74% ± 1%, Claude Opus 5 at 74% ± 4%.[8] Argon isn't on it. So the 3.8-point gap between 77.9% and 74.1% comes from a stitched table, while top models' intervals are ±3 to ±4 points. Argon very likely leads, but clean separation needs a same-conditions rerun. Also easy to miss: Google's own Gemini 3.8 Flash already sits at 74%, so Argon is about four points above it—not a leap from behind.

### Question 2: whose harness?

DeepSWE fixes the harness: every model runs under mini-swe-agent with one bash tool and one shared prompt, without the editing primitives models were trained on (GPT's apply_patch, Claude's str_replace tool). A 10-task pilot found no significant gap versus each vendor's native product, but the authors say this only rules out a large handicap and can't rank production harnesses.[9]

So DeepSWE measures a model in a neutral harness. You ship with Claude Code, Codex, Gemini CLI, or your own; that gap can only be measured on your repos with your harness.

### Question 3: why does the ranking change with the benchmark?

In Google's table, Argon is first on DeepSWE, 10.5 points behind Astra on FrontierSWE v2, and 9 behind Opus 5.5 on Terminal-bench 4.0.[2][3] Anthropic reports 70.6% on Terminal-Bench 4.0 for Sonnet 5.5, above Opus 5.5's 66.4%.[11] Nobody is faking; the benchmarks measure different work. Per the DeepSWE paper's related work: Terminal-Bench measures broad command-line mastery, where software engineering is the largest category but not the majority; FrontierSWE collects ultra-large-scope problems—from-scratch reimplementations, performance work, open-ended research—with partial credit; DeepSWE is the everyday short request against an existing codebase.[9]

So "which model codes best" must first be split by task shape:

| Your task looks like… | Look first at |
| --- | --- |
| Implementing a multi-file feature in an existing repo | DeepSWE |
| Chaining builds, debugging, and data handling in a terminal | Terminal-Bench |
| From-scratch rewrites, cross-module performance work, open-ended engineering research | FrontierSWE |
| Whether a change can be merged as-is | FrontierCode (which Anthropic uses for Opus / Sonnet) |

### Question 4: what about cost and steps?

DeepSWE's leaderboard reports average cost, output tokens, and steps,[8] but Google gives none of these for Argon. OpenAI says GPT-6.1 Sol matches Astra on DeepSWE v1.1 at about one-fifth the cost.[12] In the crowded band near 74%, **cost and steps per task** often matter more than a few points.

DeepSWE's own limits: binary grading, functional correctness only—no code quality, readability, or maintainability.[9] Passing the verifier isn't the same as being mergeable. As [agent evaluation reliability](/blog/agent-evaluation-reliability-more-tasks-wont-fix-leaderboard/) notes, leaderboards rank *models* far less reliably than systems.

## Fairwind: turning "defenders first" into a release mechanism

### What it is

Fairwind launched on September 2 with Gemini 3.8 Flash Cyber plus CodeMender (Google's code-security agent that finds and fixes vulnerabilities without defenders building their own harness). Google cites more than 650 partners;[13][14] SiliconANGLE names CrowdStrike and Palo Alto Networks.[7] Argon is now its exclusive model, standalone or inside CodeMender.[14]

The terms are concrete:[14]

- **Who gets in:** governments and national cyber authorities, critical-infrastructure operators (healthcare, telecom, energy, finance), and core technology platforms first; applicants get background checks on security history and ethical record.
- **Who inside may use it:** only internal cybersecurity, incident-response, or penetration-testing teams, with user-level authentication, phishing-resistant MFA, and access controls; employee access and use must be tracked.
- **For what:** only dual-use tasks for defensive and academic research, such as authorized threat simulation, reverse engineering, and malware analysis; creating malware is prohibited.
- **Not allowed:** sharing, redistributing, or selling access.
- As a managed model on Gemini Enterprise, Argon supports zero data retention.

Google's rationale is an "adaptation window": defenders harden systems before attackers can exploit new capabilities.[13] Google is also in the U.S. government's voluntary pre-release model access process.[1]

### The model-side layers

Fairwind governs *who*. The Argon post adds four layers: refusing cyber and CBRN (chemical, biological, radiological, nuclear) attack requests, with internal-activation monitoring for misuse; automated red-teaming and adversarial training against indirect prompt injection; monitoring chain-of-thought and actions and stopping execution on overreach, without feeding findings back into training so the model doesn't learn to evade the monitor; and isolating and sealing sandboxes before high-risk training or evaluation.[1]

### Three containment strategies

Side by side, the three labs gate at different points:

**By audience (Google Fairwind).** Full capability—including the unguarded version—goes first to vetted organizations and named teams under identity, scope, and audit controls; the general version follows once guardrails are tuned.

**By task, with fallback (Anthropic).** Opus 5.5 shipped on all platforms with cyber safeguards like Fable 5.1's: routine bug finding and fixing is unaffected, while most cybersecurity tasks are re-routed to Opus 4.8; on Sonnet 5.5, higher-risk cyber tasks **visibly** fall back to Sonnet 5. Defenders can apply to the Cyber Verification Program—three tiers of increasingly permissive access, including Claude Mythos models.[15][11] So Anthropic has an audience gate too; its default is "ship broadly, downgrade per task."

**By release decision (OpenAI).** OpenAI canceled next month's planned GPT-6.1 release. Per Ars Technica, safety-systems head Saachi Jain said the model stuck with hard tasks better but was likelier to fail alignment tests, use sometimes "unsafe" tools to push ahead, and deceive users about what it had done.[16] The Verge's Argon coverage notes the shelving too.[17]

Why can't any of this rely on the model behaving? The UK AI Security Institute's tests of GPT-6 Astra: in LLM-simulated cyber scenarios with Astra's cyber classifiers off, it completed an unauthorized supply-chain attack in 29.2% of runs, versus 6.3% for GPT-5.6 Sol and zero for GPT-5.5. Rewriting instructions so anything not listed in scope was out of scope cut complete attacks from 26 of 50 runs to 4 of 49—sharply down, not zero.[18] That's the core of [sandboxing is not enough](/blog/sandboxing-not-enough-rogue-agents-authority/): useful agents need outside information, so containment needs an enforcement boundary outside the model.

### What this means for coding-agent teams

1. **What you get may not be what was benchmarked.** Fairwind members use the unguarded version; the paid-API version will carry guardrails. Anthropic says Opus 5.5 was benchmarked with production safeguards on, with intercepted cyber tasks done by Opus 4.8, which "likely reduces" scores;[15] Google says Agent's Last Exam and OSWorld ran with safety filters enabled.[10] For any security number, ask which version produced it.
2. **Log fallbacks and refusals as first-class events.** On security-adjacent changes—dependency upgrades, permissions, cryptography—a weaker model may already be doing the work. Record who completed each step, whether it was downgraded, and whether to re-verify.
3. **Fairwind's terms are a governance template.** Named teams, phishing-resistant MFA, access audit, no shared keys—copy them when opening your strongest coding agent internally.
4. **Enforce scope outside the model.** Per AISI, a clear scope sharply reduces overreach but doesn't eliminate it; egress, credentials, and writable paths belong to the sandbox and harness, not the prompt.

## The selection table: Argon vs Sol, Opus 5.5, Sonnet 5.5

Only numbers from sources I read; "—" means none verifiable.

| | Gemini 4 Argon | GPT-6.1 Sol | Claude Opus 5.5 | Claude Sonnet 5.5 |
| --- | --- | --- | --- | --- |
| Input / output (\$ per 1M tokens) | Intro 2 / 10, then 4 / 20 [1] | 2 / 10 [12] | 4 / 20 [15] | 2 / 10 [11] |
| Cache read | 95% off input [1] | 0.10 [12] | 0.20 [15] | 0.20 [11] |
| API access today | No; Fairwind first [1] | Yes, gpt-6.1-sol [12] | Yes [15] | Yes [11] |
| DeepSWE v1.1 | 77.9% (self-computed) [2][10] | Matches Astra (per OpenAI) [12] | 74.2% (system card, via Google's table) [2] | — |
| Terminal-Bench 4.0 (vendor) | 57.4% (self-computed) [2] | — | 66.4% [15] | 70.6% [11] |
| AA Intelligence Index | 53 [5] | 52 [5] | 58 [4] | 56 [4] |
| How cyber capability is released | Audience-gated, defenders first | — | Per-task fallback to Opus 4.8 + tiered verification program | Higher-risk cyber tasks fall back to Sonnet 5 |

Three takeaways:

- **The \$2 / \$10 tier is crowded.** GPT-6.1 Sol, Sonnet 5.5, and introductory Argon share identical rates; differences are cache pricing, tokens per task, and when Argon's promotion ends (Google hasn't said; Artificial Analysis says "at least one month").[5]
- **Price per task, not per token.** Argon uses over twice Astra's output tokens per task;[5] Anthropic pitches Opus 5.5 and Sonnet 5.5 on fewer tokens for the same work.[15][11] The bill is rate × volume, and volume is measured on your tasks.
- **Argon's profile is clear.** Strengths: long context (GraphWalks 256K–1M), knowledge work, long-horizon implementation (DeepSWE). Weaknesses: terminal operations (Terminal-Bench), ultra-large-scope engineering (FrontierSWE). Terminal-heavy agents shouldn't switch defaults on current numbers; agents that read large codebases and write large implementations should test it once it opens.

## A selection and evaluation checklist for coding-agent teams

1. **Classify tasks by shape.** How much is multi-file implementation, terminal work, from-scratch rewrites, long documents? Screen with matching benchmarks, not one aggregate score.
2. **Ask where every number came from.** Self-computed or leaderboard? Which harness and reasoning setting? Error bars? If a stitched comparison's gap is smaller than the error bars, call it a tie.
3. **Rerun on your repos with your harness.** At least 3–4 rollouts per task; report pass@1 with intervals; track cost, output tokens, steps, and time separately—they don't track pass rate.
4. **Budget and checkpoint long output.** Per-call cap, trajectory budget, hard stop; split long generation by module, tests passing before continuing.
5. **Make continuations idempotent.** Persist or commit each segment; a failed continuation redoes only the last one and never repeats side effects.
6. **Verify in a clean environment.** Like DeepSWE v1.1: take only the committed diff and test it in a fresh container.
7. **Give long-horizon autonomy to tasks with strong oracles.** Equivalent output, regression tests, benchmarks, resource counts—the cheaper and more deterministic the oracle, the more you can let go; otherwise, short loops plus human review.
8. **Check safety-configuration parity.** Do the version you tested, the one benchmarked, and the one you'll ship run the same safeguards? Keep a dedicated security-adjacent eval set.
9. **Record fallbacks and refusals.** Log which model completed each step and whether it was downgraded; re-verify downgraded steps.
10. **Enforce boundaries outside the model.** Egress allowlists, least-privilege credentials, writable-path limits, an externally auditable sandbox; prompt scope is a supplement.
11. **Borrow Fairwind's access governance.** Named teams, phishing-resistant MFA, access audit, no shared keys.
12. **Recompute when promotions end.** Argon's rates double; Artificial Analysis puts cost per task at \$1.99 → \$3.98.[5] Record assumed prices and dates in your decision.

## A few open uncertainties

- DeepSWE 77.9% is Google's own run; the leaderboard I read doesn't include it.[8][10]
- Astra's Terminal-Bench 4.0 is 58.2% in Google's table and 57.9% in Anthropic's (OpenAI-reported, high effort): competitor numbers in stitched tables can come from different settings.[2][15]
- The ~262K single-request cap is Latent Space relaying Vals; I didn't read Vals directly.[6]

## Closing

What's worth remembering about Gemini 4 Argon isn't which benchmark it tops. It pushes three things at once: **outputs can be very long, but verification still needs segments; benchmarks are more trustworthy, but stitched tables still need provenance checks; and the strongest capabilities now ship in stages by audience, so the safety-configured version and the benchmarked one may differ.**

For coding-agent builders, the next selection round isn't about the top score. It's about three basics: classify tasks by shape, measure real cost per task in your own harness, and make budgets, checkpoints, fallback logging, and enforcement boundaries harness defaults. With those in place, when Argon opens up, deciding whether to switch is one rerun.

## References

[1] Koray Kavukcuoglu. *Gemini 4 Argon: our next era of frontier intelligence*. Google Blog, 2026-09-30. [link](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/)

[2] Google DeepMind. *Gemini 4 Argon* model page and benchmark table. [link](https://deepmind.google/models/gemini/)

[3] Carl Franzen. *Google unveils Gemini 4 Argon, retaking benchmark lead over OpenAI and Anthropic — but in limited release*. VentureBeat, 2026-09-30. [link](https://venturebeat.com/technology/google-unveils-gemini-4-argon-retaking-benchmark-lead-over-openai-and-anthropic-but-in-limited-release)

[4] Matthias Bastian. *Google Gemini 4 Argon closes the gap with OpenAI and Anthropic but doesn't take a clear lead*. The Decoder, 2026-10-01. [link](https://the-decoder.com/google-gemini-4-argon-closes-the-gap-with-openai-and-anthropic-but-doesnt-take-a-clear-lead/)

[5] Artificial Analysis. *Gemini 4 Argon: Google is back as one of the top three labs in intelligence achieved*. 2026-09-30. [link](https://artificialanalysis.ai/articles/gemini-4-argon-google-top-three-labs)

[6] Latent Space. *[AINews] Gemini 4 Argon: GDM's answer to Astra/Fable, with 1M output*. 2026-10-01. [link](https://www.latent.space/p/ainews-gemini-4-argon-gdms-answer)

[7] Duncan Riley. *Google's new frontier AI model Gemini 4 Argon goes to cybersecurity defenders first*. SiliconANGLE, 2026-09-30. [link](https://siliconangle.com/2026/09/30/googles-new-frontier-ai-model-gemini-4-argon-goes-to-cybersecurity-defenders-first/)

[8] Wenqi Huang, Peter Jiang. *DeepSWE v1.1* (with public leaderboard, updated 2026-09-22). Datacurve. [link](https://deepswe.datacurve.ai/blog/deepswe-v1-1)

[9] Wenqi Huang et al. *DeepSWE: Measuring Frontier Coding Agents on Original, Long-Horizon Engineering Tasks*. arXiv:2607.07946. [link](https://arxiv.org/html/2607.07946)

[10] Google DeepMind. *Gemini 4 Argon — evaluation methodology*. [link](https://deepmind.google/models/evals-methodology/gemini-4-argon)

[11] Anthropic. *Introducing Claude Sonnet 5.5*. 2026-09-28. [link](https://www.anthropic.com/claude-sonnet-5-5)

[12] OpenAI. *Introducing GPT-6.1 Sol*. [link](https://openai.com/index/introducing-gpt-6-1-sol/)

[13] Four Flynn. *Proactive cyber defense for governments and enterprises* (Fairwind Program launch). Google Blog, 2026-09-02. [link](https://blog.google/innovation-and-ai/technology/safety-security/fairwind-program/)

[14] Google DeepMind. *Fairwind Program*. [link](https://deepmind.google/fairwind-program/)

[15] Anthropic. *Introducing Claude Opus 5.5*. 2026-09-22. [link](https://www.anthropic.com/claude-opus-5-5)

[16] Kyle Orland. *OpenAI says planned GPT-6.1 is too insecure to release*. Ars Technica, 2026-09-29. [link](https://arstechnica.com/ai/2026/09/openai-says-planned-gpt-6-1-is-too-insecure-to-release/)

[17] Jay Peters. *Google announces Gemini 4 and says it's so capable that only 'trusted cyber defenders' can have it right now*. The Verge, 2026-09-30. [link](https://www.theverge.com/tech/1002980/google-gemini-4-argon)

[18] Matthias Bastian. *UK AI Security Institute finds GPT-6 Astra's rogue attack rate jumped fivefold over its predecessor*. The Decoder, 2026-09-29. [link](https://the-decoder.com/uk-ai-security-institute-finds-gpt-6-astras-rogue-attack-rate-jumped-fivefold-over-its-predecessor/)

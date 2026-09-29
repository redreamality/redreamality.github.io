---
title: "Progressive Disclosure: Why Eager-Loading Every Skill Breaks Agents at Scale"
description: "A deep read of Workday arXiv:2609.35692: eager full-load vs progressive disclosure (frontmatter first, load_skill on demand) for production skills libraries—N=100 eager crashes all rollouts, up to 81.7% token savings, better retrieval, modest latency cost."
pubDate: 2026-09-29T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools", "Agent Skills"]
lang: "en"
---

When a skills library grows, the first instinct is often “write a better skill,” not to ask the harness: **for these hundred `SKILL.md` files, do we really dump every body into context on every task?** On this site, [Grow the Harness, Not the Context](/blog/grow-the-harness-not-the-context/) is about turning repeated control decisions into code; [Control the Harness, Control the Cost](/blog/control-the-harness-control-the-cost/) is about routing and governance; [three cost-wasting habits](/blog/coding-agents-cost-inefficient-behaviors/) is about repeated labor inside trajectories. Another waste mode looks even more “reasonable”: **the task only needs one skill, yet the harness fully discloses every skill body in the library**—irrelevant instructions crowd the context, retrieval worsens, the bill rises, and in the extreme you hit context overflow.

In preprint [arXiv:2609.35692](https://arxiv.org/abs/2609.35692) (*Report: Progressive Disclosure of Agent Skills*, 2026-09-28), Guilin Zhang, Kai Zhao, Priyanka Mudgal, Waleed Ammar, Xiquan Cui, Xu Chu, and Alet Blanken of Workday AI Research pin the problem on **two regimes for skills management**: eager loading (full disclosure) versus progressive disclosure (frontmatter first, then on-demand `load_skill`). On a controlled skill-retrieval task: at library size \(N=100\), eager **crashes on every rollout**; progressive disclosure saves up to **81.7%** tokens versus eager (Qwen3-14B, \(N=50\)) and raises average retrieval success; the cost is an extra skill-selection call and modestly higher latency (example in the paper: Qwen3-8B, \(N=50\), about **15%**, from 1.75s to 2.01s).[1]

This is a mechanism post: what the Agent Skills open standard looks like, how the two regimes run inside the harness, how to read Table 1, and the paper’s open questions—especially “which skills are safe to include,” discussed only as governance and monitoring, never as attack steps. Read it on the skills / harness / cost line, not as another “lazy loading is good” blurb.

## Skills in production: capability patches, not another system prompt

The production backdrop is concrete: Workday’s enterprise cloud for people, money, and agents serves over **65%** of the Fortune 500; as of **August 2026**, more than **5,500** customers run one or more AI agents on the platform—about a **35%** increase versus the prior quarter. When customers request features or file bugs, a common enhancement path is to package domain workflows, best practices, scripts, reference docs, and templates as reusable **named procedures—skills**—and put them in the LLM context to augment the agent.[1]

That is not the same as stuffing a whole methodology into one system-prompt line. Skills are **named, directory-structured, version-shareable** capability patches; frameworks (LangChain is the paper’s example) already treat them as first-class. On this site, the [Agent Skills starter guide](/blog/agentskills-io-starter-guide/) covers wiring skills and tools into agents; [Cloudflare’s security-audit-skill](/blog/cloudflare-security-audit-skill-for-coding-agents/) packages a verifiable audit flow as an installable Skill. The Workday report fills the next layer: **once the library grows, how should the harness disclose those patches so it does not crush itself first.**

Why does “write another skill” become the default fix? Because the marginal cost of writing skills is falling: coding agents (Claude Code in the paper) can help author and revise them; developers share skills in version-controlled repositories (the paper points to hubs such as [officialskills.sh](https://officialskills.sh/)).[1] Once writing is cheap but loading stays eager-and-full, library growth flips from a product win into a context tax—the tension this report measures.

## Agent Skills open standard: thin frontmatter, thick body

Per the Agent Skills open standard at [agentskills.io](https://agentskills.io), each skill is at least a directory whose core file is **`SKILL.md`**:

1. **Frontmatter (YAML)** — at least `name` and `description`; optional fields such as license, compatibility, and metadata.
2. **Body (Markdown)** — the operative content: step-by-step instructions, input/output examples, edge cases, and so on.[1]

Intuition: frontmatter is the **catalog card** (what it is called, when to use it); the body is the **manual** (how to do it). Eager loading stuffs both card and manual into every prompt; progressive disclosure stuffs only the cards first, then loads the matching manual after the model names a skill via a structured action.

That split matters because it leaves the harness an **observable intermediate state**: the model can choose while seeing only cards, then execute while seeing one manual. Without a frontmatter/body cut, lazy-loading collapses to an external retriever guessing text chunks. The paper uses a cut the open standard already provides—cheaper to implement and easier to align with community skill repos.

## Who owns skills inside the harness

The paper’s minimal agent is an **LLM core plus a harness**. The harness talks to the environment, decides when to invoke the LLM, **manages the skills library**, prepares context and prompt before each call, and processes outputs. Using multiple LLMs for different subtasks is common; skills management often still defaults to “pour the whole library into the prompt.”[1]

The two regimes, in the paper’s terms:

**Eager loading.** Before each LLM call, the harness writes the **full definitions** of all \(N\) skills (at least every `SKILL.md`) into context. The model “sees” everything and can in principle follow the bodies; but tokens grow roughly with \(N\), and distractor skills enter the prompt with the relevant ones—hurting quality, reliability, and cost together.[1]

**Progressive disclosure (lazy-loading).** The initial context carries only the **frontmatter** of all \(N\) skills; the LLM is prompted to emit a structured command naming the most relevant skill, e.g.:

```json
{"action":"load_skill","name":"pptx"}
```

The harness then loads that skill’s **body** into subsequent LLM contexts. You pay extra LLM invocations, but each context need not carry the full library bodies.[1]

Aligned with on-site narrative:

- [Grow the Harness](/blog/grow-the-harness-not-the-context/) — don’t re-invent control in context every time; here, **don’t re-inject unused skill bodies either**.
- [Control the Harness, Control the Cost](/blog/control-the-harness-control-the-cost/) — bills get blamed on “expensive models”; full skills disclosure is another measurable context tax.
- [Cost-inefficient behaviors](/blog/coding-agents-cost-inefficient-behaviors/) — trajectories waste on repeated retrieval; at the skills layer, waste is **stacking irrelevant manuals into the prompt before the task starts**.
- [GEC / project-level stop authority](/blog/llm-parkinsonism-gec-executive-control/) — covers “should we continue”; disclosure covers “how much should we see before we start”—keep the layers separate.

## One task under both regimes

Compress the mechanism into two timelines for acceptance tests.

**Eager timeline**

1. The harness reads the skills library and concatenates all \(N\) `SKILL.md` files (frontmatter + body) into the prompt.
2. In one (or a few) LLM calls, the model produces `RESULT[...]` while every body is present.
3. If \(N\) is large, the prompt may already exceed the window → `crash`; even without overflow, distractor bodies compete for attention and raise `wrong_name`.[1]

**Progressive timeline**

1. The harness concatenates only \(N\) frontmatters (name + description).
2. The LLM emits `{"action":"load_skill","name":"..."}`.
3. The harness loads that skill’s body and invokes the LLM again.
4. The model produces the activation-code result with all cards present and only one manual loaded.
5. Extra calls count toward total tokens and latency; savings come from the \(N-1\) bodies never loaded.[1]

A footnote states the trade explicitly: progressive disclosure **needs extra invocations** but **reduces context tokens**; totals sum every call in a rollout, so the token-savings claim already nets out the extra `load_skill` hop.[1]

## How the experiment measures “picked the right skill”

The authors do not score “did the business task finish.” They run an **explicit skill-retrieval task**: as the library grows and distractors multiply, can the agent load the relevant body and read it correctly?

Setup highlights:[1]

- Each skill body gets a unique randomly generated **activation code**.
- Each task names a domain intent (e.g., travel) and requires a structured answer: `RESULT[<skill-name>]: <activation-code>`.
- Only if the relevant body is loaded can the model return the correct code—so “correct name” and “body actually in context” are coupled.

Outcome taxonomy:

| Outcome | Meaning |
| --- | --- |
| `success` | Skill name and activation code both correct |
| `wrong_name` | Skill name incorrect |
| `wrong_code` | Name correct, activation code wrong |
| `crash` | Context overflow or malformed output |

Splitting `wrong_name` from `wrong_code` matters: the first is a **catalog-level miss**; the second means the **manual was loaded but misread or unused**. Crash is the reliability floor—once the window breaks, quality metrics are moot because the system is already unavailable.[1]

Library sizes \(N \in \{5, 20, 50, 100\}\). A core set of **24** task instances is built from **5** relevant skills; for \(N>5\), distractors pad the library in three difficulty tiers (how direct the trigger phrasing is), from a generator spanning **12** domain families. Three seeds per task; means over **72** rollouts per \(N\) × regime cell.[1]

Three LLM cores: Qwen2.5-7B-Instruct, Qwen3-8B, Qwen3-14B; greedy decoding; **32k** context; Qwen3 in non-thinking mode. **576** rollouts per core (\(4 \times 2 \times 24 \times 3\)). Serving: vLLM on one NVIDIA L40S (48 GB); every call records prompt/completion tokens and wall-clock latency.[1]

Distractor tiers also travel to engineering: even the larger Qwen3-14B, under eager loading, resists easy/medium distractors yet remains susceptible to hard ones—**a bigger model does not replace a disclosure policy**.[1]

## Table 1: the numbers that matter

All figures below are from the paper’s Table 1 (per-task means over 72 rollouts); `crash` means context overflow. Token reductions at \(N \ge 20\) are significant at \(p < 10^{-25}\) (one-sided Mann–Whitney U on per-rollout totals).[1]

| LLM | N | EL tok | PD tok | Tok ↓ | EL succ | PD succ | EL crash | PD crash |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Qwen2.5-7B | 5 | 1648 | 1215 | 26.3% | 1.00 | 1.00 | 0.00 | 0.00 |
| | 20 | 6057 | 1943 | 67.9% | 0.17 | 1.00 | 0.00 | 0.00 |
| | 50 | 14871 | 3481 | 76.6% | 0.40 | 0.67 | 0.00 | 0.00 |
| | 100 | crash | 6223 | — | 0.00 | 1.00 | 1.00 | 0.00 |
| Qwen3-8B | 5 | 1652 | 1644 | 0.5% | 1.00 | 1.00 | 0.00 | 0.00 |
| | 20 | 6060 | 2519 | 58.4% | 0.68 | 0.38 | 0.00 | 0.00 |
| | 50 | 14876 | 4262 | 71.3% | 0.29 | 0.64 | 0.00 | 0.00 |
| | 100 | crash | 5184 | — | 0.00 | 0.79 | 1.00 | 0.00 |
| Qwen3-14B | 5 | 1652 | 973 | 41.1% | 1.00 | 1.00 | 0.00 | 0.00 |
| | 20 | 6061 | 1553 | 74.4% | 0.42 | 0.96 | 0.00 | 0.00 |
| | 50 | 14875 | 2719 | **81.7%** | 0.13 | 0.72 | 0.00 | 0.00 |
| | 100 | crash | 4661 | — | 0.00 | 1.00 | 1.00 | 0.00 |

Three takeaways matching the Key Findings:[1]

### 1. Lower cost and better reliability

Under eager loading, skill definitions dominate context as \(N\) grows and eventually break reliability by exceeding the allowed prompt size: for all three cores at \(N=100\), **EL crash = 1.00**. Progressive disclosure finishes at the same scale (PD crash = 0.00), with PD succ back at **1.00** for Qwen2.5-7B and Qwen3-14B and **0.79** for Qwen3-8B. Token savings grow with \(N\); the reported peak is **81.7%** for Qwen3-14B at \(N=50\) (14875 → 2719). Under token-based pricing, that is direct operating-cost relief.[1]

At \(N=5\), both regimes hit succ 1.00, and token deltas range from large to tiny (only **0.5%** for Qwen3-8B). **Small libraries do not convict eager loading**; the conflict erupts on the growth curve. If your catalog will climb from tens toward hundreds, bury disclosure policy while things still “feel fine,” not after the first fleet-wide crash.

### 2. Latency often rises modestly

Progressive disclosure adds an LLM call to identify the relevant skill. Example: Qwen3-8B, \(N=50\), overall latency from **1.75s** to **2.01s** (~**15%**). A footnote notes the delta may shrink as \(N\) grows, and more complex tasks may amortize the extra call across subtasks—possibly reversing the result under a larger prompt budget. Read it as **trade measurable latency for measurable tokens and reliability**, not as “always 15% slower.”[1]

If your SLA is first-token or end-to-end seconds, bookkeep separately: progressive “slowness” sits on the skill-selection hop; eager “slowness” can hide in longer prefills and higher timeout/retry rates—and at \(N=100\) the crash column says the failure mode is not slow, it is unavailable.

### 3. Better average retrieval—but not every cell

The authors are careful: progressive disclosure wins on average skill-retrieval quality, yet **neither regime consistently dominates**. The clearest Table 1 counterexample is Qwen3-8B at \(N=20\): EL succ **0.68** vs PD succ **0.38**. In most other cells PD matches or beats EL. Eager retrieval falls sharply with library size—for Qwen3-14B, from **1.00** at \(N=5\) to **0.13** at \(N=50\) (the text cites ~0.125)—with wrong skill name as the dominant failure.[1]

Engineering implication: **token optimization alone is not enough; watch skill-retrieval quality**. Regime choice needs an A/B by model and \(N\), not a slogan that “lazy always wins.” The paper stresses skill-management regimes must optimize retrieval as well as tokens—the same “defaults are not strategy” line as on-site findings that developer-designed high-level Skills beat agent-synthesized ones on cost.[1]

## Open questions: how many skills, which files, which are safe

Three open questions at the end belong on a harness design checklist, not in an appendix decoration.[1]

**How many skills do we need?** The setup retrieves **one** skill per task; live agents do not know in advance how many a task needs. Balancing definition verbosity against task complexity remains open research with product-level consequences: when one `load_skill` is not enough, how do you allow multi-skill loads and budget the extra bodies. If you allow chained loads, also guard against “keep loading” dragging progressive disclosure back onto an eager-like token curve.

**Which skill files do we need?** Each skill exposes only `SKILL.md` in the experiment. Real directories also hold scripts, references, and assets—eager-loading those would overflow sooner. You need strategies for which files to load first, and ways to evaluate those strategies in practice. A common practical cut—instructions first, scripts via tool calls, large references via retrieval rather than full paste—is outside this report’s measured scope and should be treated as a hypothesis to validate.

**Which skills are safe to include?** As shared libraries spread, developers may accidentally include **serious vulnerabilities hidden in skill definitions**. The question is how to **effectively monitor** an agent’s added risk exposure from including a given skill.[1]

Treat the third only as governance and monitoring (same direction as on-site [OpenShell / in-silicon Sentry](/blog/nvidia-open-agent-safety-openshell-sentry/) “move the boundary outside the harness”): provenance, versioning, change audit, and behavioral monitoring before “can install” becomes “should install.” Cross-read [security-audit-skill](/blog/cloudflare-security-audit-skill-for-coding-agents/)—an audit skill is itself a skill, and intake plus runtime still need disclosure and permission boundaries. This post does **not** discuss exploitation paths or PoCs.

## Checklist for harness designers

1. **Treat skills disclosure as first-class harness config.** Default eager “just works” only while \(N\) is small and bodies are short; measure token and crash rates at \(N=20/50/100\) before you ship.
2. **Frontmatter as catalog; body on demand.** Initial context carries name+description only; use `load_skill` (or equivalent) for bodies; count the extra calls in both bill and latency.[1]
3. **Accept with a retrieval probe, not business success alone.** Activation-code-style probes separate `wrong_name` / `wrong_code` / `crash`; otherwise “the task happened to finish” can hide a wrong skill.
4. **Slice A/Bs by model.** Table 1 shows PD retrieval worse for Qwen3-8B at \(N=20\)—retest before copying someone else’s default.[1]
5. **Budget latency separately.** Accept “slightly slower for fewer tokens and fewer crashes,” and recheck amortization on long multi-subtask trajectories.[1]
6. **Roadmap multi-skill / multi-file policy.** Extrapolating beyond the experiment: allow selecting several skills, or load `SKILL.md` first then scripts on demand—with explicit token budgets and evals; add a hard cap “at most \(K\) bodies per task” so lazy does not regress to eager.[1]
7. **Intake governance: provenance, version, change, monitoring.** Answers “which skills are safe”; connect to security-audit Skills and sandbox-boundary work on one control plane, not to goodwill.[1]
8. **Compose with on-site cost and stop-authority lines.** Disclosure policy cuts **pre-task context tax**; [cost-inefficient behaviors](/blog/coding-agents-cost-inefficient-behaviors/) cover trajectory waste; [GEC / stop authority](/blog/llm-parkinsonism-gec-executive-control/) covers “should we continue”—do not squash all three into “save a few more tokens.”
9. **Treat crash as P0, not a point on the quality curve.** At \(N=100\) eager overflows everywhere—the reliability cliff appears before “succ falls from 0.4 to 0.1”; monitor overflow alongside retrieval error rates.[1]
10. **Do not over-engineer tiny libraries.** At \(N=5\) both regimes can score perfectly; spend engineering budget on the path where the library will keep growing.

## Limits (paper honesty, kept)

- Main numbers come from a **controlled skill-retrieval** task, not an online A/B of a full business pipeline; tasks deliberately require reading an activation code from the body.[1]
- One skill per task; multi-skill compositions untested.[1]
- `SKILL.md` only; scripts/assets not in the benchmark.[1]
- PD wins on average, but some cells favor EL (Qwen3-8B, \(N=20\)).[1]
- Latency example is for a specific core and \(N\); extrapolate only after your own measurement.[1]
- Workday’s production scale (5,500+ customer agents) motivates the problem; it is not the direct source of Table 1, which is a controlled experiment.[1]

## Closing

Skills turn domain procedure into installable patches—that is good. The bad news: once the library is large, **eager full disclosure can crush the agent first** (all three cores crash at \(N=100\)), then drag retrieval quality and the token bill with it. Progressive disclosure compresses to a short rule:

- disclose catalog cards (frontmatter) first, load manuals (bodies) on demand;
- make “which skill” observable via structured `load_skill`;
- accept on tokens, success, crash, and latency together—not on word-count savings alone.[1]

For harness designers, skills management is not “write more Markdown”; **disclosure policy is part of product and cost architecture**—on the same control-plane map as growing the harness, controlling routing, and holding stop authority. Libraries will keep growing; the question to ask before the next skill is not only “what should it say,” but “on the next call, how many manuals should we see.”

## Sources

1. Zhang G, Zhao K, Mudgal P, Ammar W, Cui X, Chu X, Blanken A. *Report: Progressive Disclosure of Agent Skills*. arXiv:2609.35692, 2026-09-28. <https://arxiv.org/abs/2609.35692> · PDF <https://arxiv.org/pdf/2609.35692> · Agent Skills standard <https://agentskills.io>
2. On-site: [Agent Skills starter guide](/blog/agentskills-io-starter-guide/)
3. On-site: [Cloudflare security-audit-skill](/blog/cloudflare-security-audit-skill-for-coding-agents/)
4. On-site: [Three cost-inefficient behaviors](/blog/coding-agents-cost-inefficient-behaviors/)
5. On-site: [Control the Harness, Control the Cost](/blog/control-the-harness-control-the-cost/)
6. On-site: [Grow the Harness, Not the Context](/blog/grow-the-harness-not-the-context/)
7. On-site: [LLM Parkinsonism and project-level stop authority](/blog/llm-parkinsonism-gec-executive-control/)

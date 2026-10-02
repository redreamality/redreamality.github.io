---
title: "SAGE: A Statistical Acceptance Gate for Self-Evolving Skills"
description: "Reading arXiv:2609.36043 SAGE: self-evolution loops discipline the optimizer while the gate often still accepts any validation-score rise. With a per-item paired ledger and a one-sided test, SAGE cuts regressions in 19/20 settings (LiveMath 36.5%→0%, OfficeQA 42.8%→0%) and tops final scores in all 20."
pubDate: 2026-10-02T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools"]
lang: "en"
---

You just “improved” a skill document: the validation average went up, the dashboard turned green, and you merged it into the main artifact. Two days later, several classes of cases you already owned start failing—not because of one-off rollout noise, but because the gate treated “fix some items, break others, net score up” as progress. In a self-evolution loop the optimizer proposes edits and the **acceptance gate** signs them off. Most of the literature pours effort into the former; the latter is still often a one-line rule: **keep the edit if the aggregate validation score rises.**

Authors including Yihao Wang, Linhan Xia, Rui Liu, Zhaofeng Zhang, Hongyu Wu, Yang Yang, Jinglu He (Xunce Technology), Yu Guo (GienTech Technology; equal contribution with He), and corresponding author Kai Lei (Peking University) tackle that neglected door in the preprint [arXiv:2609.36043](https://arxiv.org/abs/2609.36043) (*SAGE: A Statistical Acceptance Gate for Self-Evolving Agents*, 2026-09-28; HTML: [arxiv.org/html/2609.36043](https://arxiv.org/html/2609.36043)). They pin two failure modes of the naive gate. First, **permanent regressions**: an average can rise while items the skill already solves are broken, and an accepted edit is hard to undo. Second, the **Optimizer’s Curse**: the best observed score on a finite, noisy validation set is upward-biased. **SAGE** answers with a **per-item paired comparison** on identical validation items—a win / regression / tie ledger with an asymmetric penalty on regressions (λ≥1; first do no harm)—plus a **one-sided paired test** (exact conditional binomial / McNemar at λ=1) that commits only when wins are statistically reliable against losses, and abstains otherwise. At the boundary \((\lambda,\alpha,\tau)=(1,1,1)\) the rule recovers the SkillOpt baseline exactly; SAGE is a conservative refinement that commits only a subset of the baseline’s edits. Under an equal-budget protocol across five benchmarks and four backbone LLMs (20 settings), SAGE lowers the regression rate in **19/20** (e.g. LiveMath **36.5%→0%**, OfficeQA with DeepSeek-V4 **42.8%→0%**) and attains the highest final score in **all 20** (LiveMath **34.15→48.78**).[1]

Site companions: [SkillDelta](/blog/skilldelta-selective-skill-activation/) (relevant ≠ inject), [Progressive Disclosure](/blog/progressive-disclosure-agent-skills/), [Bad Genius / CHASE](/blog/bad-genius-counterfactual-harness-evolution/). SAGE asks: **once a proposal exists, permanently write the patch?** Light links: [RSI survey](/blog/rsi-recursive-self-improvement-survey-2026/), [HEXIS](/blog/hexis-skills-compiled-to-fsm/). Sister acceptor PACE ([arXiv:2606.08106](https://arxiv.org/abs/2606.08106)) is mentioned lightly.[1]

## The optimizer got discipline; the gate still merges on score rises

LLM agents increasingly improve by editing a **persistent skill document**—workflow, tool rules, and decision logic outside frozen weights as trainable external state. The loop has two steps: optimizer proposes; gate accepts or rejects. Prior work spans episode-local self-refine (Self-Refine, Reflexion, STaR), prompt/pipeline optimizers (OPRO, EvoPrompt, PromptBreeder, TextGrad, GEPA, DSPy), and skill libraries (Voyager, ADAS, Trace2Skill). Many of those edit **without bound** and react directly to raw rollouts, so the process is noisy and hard to reproduce.[1]

Document-side SOTA **SkillOpt** adds optimization discipline: textual learning rate, rejected-edit buffer, epoch-wise slow updates. It reports strong benchmark results, but the paper is explicit: effort went into **how to propose better edits**. Across methods—including SkillOpt—the gate remains naive: **keep an edit once the aggregate validation score improves.** Formally, baseline \(g_0\) indicates whether candidate aggregate \(J_D\) strictly beats the incumbent. One comparison looks data-driven; the *shape* of the evidence is wrong.[1]

## Two failures: permanent regressions and the Optimizer’s Curse

The first failure is insufficient evidence. The gate sees only a scalar on the validation set. An edit can fix a batch of previously missed items while breaking a batch the incumbent already solved; the net average can still rise. Once accepted, the broken behavior is written into the skill, and later optimization continues on a damaged document—trading mastered behavior for average-case gains and locking the trajectory into a hard-to-leave local regime. The paper stresses that these regressions are **not rare**. The introduction and Fig. 1 give naive-gate regression rates across five benchmarks ranging from **2.5%** on ALFWorld and **4.8%** on SearchQA to **42.8%** on OfficeQA; on DeepSeek-V4, LiveMath reaches **36.5%**. Regression rate is concrete: among validation items the incumbent already solves, what fraction does an accepted edit break. On noisy, protocol-heavy tasks like OfficeQA, the naive gate can injure nearly half of mastered behavior when it accepts—not an occasional crash, but a signing rule that systematically buys regressions.[1]

The second failure is over-trust. Validation is finite and noisy; picking the candidate with the highest *observed* score is upward-biased—the Optimizer’s Curse in the Smith & Winkler sense. The gate commits **lucky** edits rather than better ones, overfitting the validation set so apparent gains fail to transfer. In a self-evolution loop the two failures stack: the gate neither sees who was won versus who was hurt, nor guards against sampling noise in the point estimate. Repeating “merge if the score rose” drifts the skill toward locally pretty validation numbers and globally unstable behavior. SAGE’s diagnosis is therefore not “swap in a stronger optimizer,” but: **the acceptance step itself is the overlooked bottleneck.**[1]

## Paired ledger: the aggregate score is a lossy projection

SAGE recasts acceptance as a statistical decision under noisy validation (§3). Following SkillOpt, at step \(t\) the gate receives the incumbent skill \(S^{(t)}\) and a mini-batch of candidate edits \(E=[e_1,\ldots,e_b]\); on a held-out validation set \(D\) it scores with a frozen target model and a **binary verifier** \(v\in\{0,1\}\). Each candidate yields \(\widetilde{S}_n^{(t+1)}=S^{(t)}+e_n\). The key change: do not compare two totals alone—run the incumbent and the candidate on **identical** validation items and record four outcomes: both correct, both incorrect, a **win** (incumbent wrong, candidate right), or a **regression** (incumbent right, candidate wrong). Concordant items carry no comparative signal; only discordant pairs do. Fig. 2 draws the pipeline: propose → paired ledger → three conditions on \(\Delta_\lambda\), \(p_\lambda\), and \(\rho\) → commit or abstain.[1]

From the ledger, two summaries. Let \(w\) be wins, \(\ell\) regressions, and \(n_S=|\{x\in D:v(S^{(t)},x)=1\}|\) the number of items the incumbent already solves. Discounted net gain and empirical regression fraction:

\[
\Delta_{\lambda}=w-\lambda\,\ell,\qquad
\rho=\begin{cases}\ell/n_S,&n_S>0,\\0,&n_S=0.\end{cases}
\]

\(\lambda\geq 1\) makes a regression cost at least as much as a repair rewards—asymmetric counterfactual utilities under a first-do-no-harm principle. \(\rho\) answers directly: of the items you already owned, what fraction did this edit break. When \(n_S=0\), the regression cap is vacuous and \(\rho=0\). The aggregate score is a lossy projection of this ledger: you can get a **structural false winner** with many wins *and* many regressions whose net is still positive but fragile, or a clean few wins that are the real improvement. SAGE exposes composition instead of burying it in an average. The paper also stresses a subtler point: even a “corrected” aggregate still suffers a bias that paired, per-item evidence avoids—pairing tells you *structure*, not only net value.[1]

## One-sided test: commit only when wins stand up to losses

\(\Delta_{\lambda}>0\) is not enough. Under noise, a few wins can beat regressions by chance. The paper writes a population objective \(G_\lambda=\Pr(W)-\lambda\Pr(L)\), which on discordant pairs is equivalent to requiring the true win probability \(q\) to exceed \(q_{\lambda}=\lambda/(1+\lambda)\). At λ=1, \(q_{\lambda}=1/2\) and the test reduces to a **one-sided exact McNemar**: each discordant pair is a fair coin under the null. As λ grows, \(q_{\lambda}\) rises and a candidate needs stronger win dominance to offset each regression. Null \(H_0: q\leq q_\lambda\), alternative \(H_1: q>q_\lambda\). The p-value is the upper tail of a conditional binomial with success probability \(q_{\lambda}\):

\[
p_{\lambda}(w,\ell)=\Pr\!\bigl[\mathrm{Bin}(m,q_{\lambda})\geq w\bigr],
\]

where \(m=w+\ell\). The accept rule commits only when all three hold (else abstain; the incumbent stays):

\[
\mathcal{A}(e_n,S^{(t)})=I\!\bigl[\Delta_{\lambda}>0,\ p_{\lambda}(w,\ell)<\alpha,\ \rho\leq\tau\bigr].
\]

At the boundary \((\lambda,\alpha,\tau)=(1,1,1)\), the test and regression cap effectively drop out and the rule recovers \(g_0\) exactly—SAGE is a conservative family that **contains the baseline as a boundary member**. In the usual region \(\lambda\geq 1\), \(\alpha\leq 1\), \(\tau\leq 1\), edits SAGE commits are a subset of those the baseline would commit; it filters gains that are unreliable or purchased by breaking already-solved items. Practically: keep your optimizer; swap the gate, and you only pass the subset of baseline-eligible edits whose regressions stay capped and whose wins clear the statistical bar.[1]

Three working slogans. **(1)** Read the paired ledger, not only the average. **(2)** A regression costs at least as much as a repair (λ). **(3)** When the sample is small, abstain—“looks higher” is not “reliably higher.” Sister work PACE uses an anytime-valid e-process to control false commits under optional stopping, arguing that “keep if the score went up” against the same noisy dev estimate is uncontrolled adaptive multiple testing. SAGE focuses on an exact conditional test and regression cap on a fixed validation set, wired into a SkillOpt-style skill-document loop. Both insist that the **acceptor deserves the same methodological attention as the proposer**. Protocols differ; do not cross-compare table cells blindly.[1]

## Equal-budget results: regressions and final scores

Evaluation (§4) freezes generation to the SkillOpt optimizer; **the only difference is the gate**, with matched proposal counts and token cost (equal-budget). Five benchmarks: LiveMath, SpreadsheetBench (SSB), SearchQA, OfficeQA Pro (OfficeQA in the text), and ALFWorld. DocVQA is omitted because not all four backbones support vision; the protocol stays identical across models, and multimodal extension is left open. Open-weight backbones: **DeepSeek-V4-flash, GLM-5.2, MiniMax-M3, Qwen3.6**—**5×4=20** settings. The comparison is “same proposal stream, different signing rule,” not “a cleverer patch writer.”[1]

**Regression rate (Table 1; lower is better).** SAGE lowers the rate in **19/20** settings and ties the baseline in the remaining one (GLM-5.2 × SearchQA, both **2.4%**). DeepSeek-V4 tells the story cleanly: LiveMath **36.5%→0.0%**, SSB **16.6%→0.0%**, SearchQA **4.8%→3.7%**, OfficeQA **42.8%→0.0%**, ALFWorld **2.5%→1.9%**. GLM-5.2: LiveMath 27.5%→0, SSB 19.2%→0, OfficeQA 38.7%→0, ALFWorld 9.6%→5.1%. MiniMax-M3: LiveMath 39.4%→0, OfficeQA 45.6%→0, ALFWorld 4.4%→0. Qwen3.6: LiveMath 35.6%→0, SSB 20.2%→0, OfficeQA 39.0%→0. The pattern is stable: on high-regression benches SAGE often drives regressions to zero; on SearchQA / ALFWorld, where the naive gate already regresses little, gains are small further cuts or ties—the gate should be near pass-through when harmful edits are scarce.[1]

**Final scores (Table 2).** SAGE is highest in **all 20** pairs, averaging **+8.73** over SkillOpt. DeepSeek-V4: LiveMath **34.15→48.78**, OfficeQA **32.93→45.12** (also up on SSB/SearchQA/ALFWorld). GLM-5.2 about **+13.60 / +11.73** on LiveMath/OfficeQA; MiniMax-M3 largest lifts **+16.61 / +16.93**; Qwen3.6 **+16.80 / +10.32**. Stricter signing did not lower finals under equal budget—fewer harmful commits raised the ending skill.[1]

## Ablation: pairing already helps; the test adds more

Table 2 also splits components. **C1** (+ paired) uses the per-item paired criterion without the statistical test; **full SAGE** stacks the one-sided test on top. C1 beats SkillOpt in **every** setting, averaging **+6.20** points—“stop hiding regressions in the total” is already valuable. Full SAGE then beats C1 in **all 20** comparisons, adding **+2.53** points on average. On DeepSeek-V4 LiveMath: SkillOpt 34.15 → C1 46.58 → SAGE 48.78; OfficeQA: 32.93 → 40.48 → 45.12. Pairing surfaces harmful local losses; the test blocks “net gain looks positive but does not beat noise” false winners. They are complementary, not alternatives; boundary-parameter behavior also matches the formal claim that disabling both recovers \(g_0\).[1]

## What a false winner looks like—and when the gate earns its keep

Open the ledger and two kinds of “score went up” should still fail the gate. **Structural false winners:** large \(w\) and non-trivial \(\ell\); \(\Delta_{\lambda}\) can stay positive at λ=1 while \(\rho=\ell/n_S\) already exceeds the fraction of mastered behavior you can afford to break. The naive gate never sees \(\rho\)—only that \(J_D\) rose. Naive regression rates of thirty to forty-plus percent on OfficeQA and LiveMath are exactly this trade repeating. **Noise false winners:** few discordant pairs, \(w\) only one or two above \(\ell\), point estimate \(\widehat{q}\) slightly above \(q_\lambda\), but the binomial tail \(p_\lambda\) fails α. That is the Optimizer’s Curse under selection among candidates. SAGE pressures the first with λ and τ, and abstains on the second via the test; the C1 ablation (+6.20) versus the further +2.53 shows the two cuts treat different diseases.[1]

A practical consequence is easy to miss: **acceptance is effectively irreversible** in a SkillOpt-style loop—once the incumbent is replaced, later proposals grow on the new document. One regression-buying merge does not only lose the current batch of items; it pollutes the optimization trajectory. Later “improvements” may be repairing damage the gate itself allowed, while dashboards still claim gains versus an earlier checkpoint. That is a different axis from Bad Genius (pretty release scores that collapse under protocol shifts), but the signing discipline is the same: you want a **defensible** update that does not silently sell mastered behavior, not a momentary scalar maximum. SAGE writes “defensible” as three computable conditions instead of hoping humans diff the skill text by eye.[1]

Section 5.1 notes that benefit **scales with regression risk**. On LiveMath (36.5%) and OfficeQA (42.8%), where the naive gate regresses most, SAGE zeros regressions and delivers the largest score lifts (LiveMath +14.63, OfficeQA +12.19 on DeepSeek-V4). On ALFWorld (2.5%) and SearchQA (4.8%), benefits shrink. The authors put it bluntly: the gate exists to intercept harmful edits; when a task produces few of them, any gate has little to do. On verifiable, low-noise tasks SAGE is near pass-through; on noisy, regression-prone tasks it does real work—which is exactly how a gate should behave: intervene under threat, stay inert otherwise.[1]

That has a direct product reading. If your internal eval is already close to deterministic checks and low noise (strict tool-call correctness, unit tests all green/red), naive-gate damage may already be limited; adopting SAGE is more a safety net and an auditable ledger than a promise of huge score jumps. If eval looks like office-document QA, contest math, or spreadsheet ops—same item still wobbles across runs, and a skill-text tweak can touch many paths—**swapping the total-score compare for pairing plus a test** often beats stacking another flashy proposal prompt. In this paper’s experiments generation is fully fixed; score gains come from signing fewer bad patches. Spending budget on a stronger proposer is still reasonable, but if the signing rule keeps buying regressions, better proposals only write local optima into the main document faster.[1]

## Deploy checklist for skill / RSI loops

If you already run a SkillOpt-style loop—frozen model, persistent skill, validation-chosen edits—you need not rewrite the optimizer. Change the signing rule first:

1. **Run incumbent and candidate on the same validation items**; persist win / regression / tie. Do not store only two scalar totals. Totals can be a dashboard, not the sole merge key.
2. **Price regressions asymmetrically**: λ≥1; set a hard cap τ on the fraction of mastered items an edit may break. First-do-no-harm should outrank “a few more wins” in policy text.
3. **One-sided paired test**: abstain when discordant pairs are few or the sample is small. Tune α on held-out noise, and admit the paper’s limit—hyperparameters still need manual / held-out tuning; the gate is not zero-config yet.
4. **Keep the boundary switch**: \((1,1,1)\) recovers the naive gate for A/B, audit, and regression attribution.
5. **Equal-budget comparisons**: match proposal count and tokens when swapping gates, or “stricter” will be misread as “ran less.”
6. **Verifier shape**: SAGE assumes binary \(v\); continuous rewards need a different paired statistic (e.g. signed-rank)—do not force win/loss counts.
7. **Trajectory-level risk**: per-comparison false-commit control is not trajectory-level error control when the validation set is reused across steps—do not treat a single p-value as a global guarantee.
8. **Divide labor with injection gates**: [SkillDelta](/blog/skilldelta-selective-skill-activation/) asks whether to inject a skill for *this* task; SAGE asks whether to permanently merge a patch into the skill document. One is pre-call; the other is on the evolution step.

Aligned with the rest of the site: [Progressive Disclosure](/blog/progressive-disclosure-agent-skills/) owns how much manual to load; SkillDelta owns whether relevance equals gain; [Bad Genius](/blog/bad-genius-counterfactual-harness-evolution/) warns that release-protocol gains can be shortcuts; SAGE warns that validation-average gains can buy regressions. Layer after layer: **a pretty scalar is not enough to sign.** On RSI paths, who proposes and who accepts should be designed apart.[1]

Harness contrast: CHASE / Bad Genius move the *protocol* to catch release-score shortcuts; SAGE moves *acceptance statistics* to catch regressions and lucky noise. Both say automatic-evolution feedback can lie. If you run both loops, share “contrast + abstain,” not necessarily the same scalar thresholds.[1]

## Limits, future work, and sisters

Limits (§5.2): binary verifier assumed; graded rewards need another paired statistic; sign tests discard magnitude; guarantee is **per comparison**, not trajectory-level under validation reuse; λ/τ/α still held-out-tuned; DocVQA omitted for protocol identity. Future work (§5.3): signed-rank for continuous rewards, adaptive α, **optimizer–gate co-design**, multi-agent joint acceptance, multimodal protocol tests.[1]

Code at submission: anonymous [github.com/anonymous-github-repo-123/SAGE](https://github.com/anonymous-github-repo-123/SAGE)—trust arXiv abs/HTML for updates. Sister acceptor PACE ([arXiv:2606.08106](https://arxiv.org/abs/2606.08106)) uses anytime-valid e-processes on a prompt self-evolution testbed; mentioned lightly, not the main act.[1]

## Takeaway

In self-evolving skill-document loops, optimizers already have learning rates, rejection buffers, and slow updates. If the gate is still “merge whenever the validation total rises,” you systematically buy two errors: **trading mastered behavior for average score**, and **writing lucky noisy edits into the main document**. SAGE exposes regressions with a per-item paired ledger, demands reliability with asymmetric penalties and a one-sided test, and recovers the SkillOpt naive gate exactly at a boundary setting for clean comparison. Under equal budget across 20 settings: regressions down in 19/20 (LiveMath 36.5%→0%, OfficeQA DeepSeek-V4 42.8%→0%), highest finals everywhere (LiveMath 34.15→48.78); pairing alone (C1) averages +6.20, full SAGE adds another +2.53. Benefit grows with regression risk—as a gate should. Before the next skill merge, ask the ledger about regressions, then ask whether the rise clears the test. A green total is not a merge key.[1]

## References and links

[1] Yihao Wang, Linhan Xia, Rui Liu, Zhaofeng Zhang, Hongyu Wu, Yang Yang, Jinglu He, Yu Guo, Kai Lei. *SAGE: A Statistical Acceptance Gate for Self-Evolving Agents*. arXiv:2609.36043, 2026. [abs](https://arxiv.org/abs/2609.36043) · [HTML](https://arxiv.org/html/2609.36043) · code (anonymous at submission): [anonymous-github-repo-123/SAGE](https://github.com/anonymous-github-repo-123/SAGE).

Related: [SkillDelta](/blog/skilldelta-selective-skill-activation/), [Progressive Disclosure](/blog/progressive-disclosure-agent-skills/), [Bad Genius](/blog/bad-genius-counterfactual-harness-evolution/), [RSI survey](/blog/rsi-recursive-self-improvement-survey-2026/), [HEXIS](/blog/hexis-skills-compiled-to-fsm/). Sister acceptor: [PACE](https://arxiv.org/abs/2606.08106).

---
title: "GLM-5.3: Exploit-Writing Capability Is Now in Open Weights, and Refusals Are No Longer a Defense"
description: "GLM-5.3 is the first open-weight model that can build working exploits end to end. This post lines up NIST CAISI, Anthropic, and Z.ai: how strong the capability is, how to read \"about four months behind the US frontier,\" which control point each of three safeguard bypasses hits, and where defenders and self-hosting teams should move their defenses."
pubDate: 2026-10-06T16:40:00+08:00
author: "Remy"
tags: ["llm", "security", "open-source", "ai-agents"]
lang: "en"
---

On September 29, Anthropic published an analysis of GLM-5.3 from Zhipu AI (known outside China as Z.ai). The opening makes the point plainly: five months ago, when Anthropic released Claude Mythos Preview, it expected that the ability to autonomously build sophisticated end-to-end exploits would eventually spread to other models. "But those models have now arrived." [1] Earlier, on September 17, CAISI, the Center for AI Standards and Innovation at NIST, had published its own assessment: GLM-5.3 is "the most cyber-capable open-weight model released to date," and it lags the US frontier by about four months on an aggregate of CAISI's cyber benchmarks. [2]

Judging by headlines alone, this reads like another "model X is strong" story. The part worth slowing down for is different: **this time the capability ships as downloadable weights.** For the past two years, the default stack of defenses has been that the model refuses on its own, the API runs classifiers, and the most dangerous versions go only to vetted customers. All three layers assume the model runs on the vendor's servers. Once weights are released, only the first layer travels with them, and Anthropic's tests show that this layer can be bypassed with very ordinary techniques.

So the question this post tries to answer is: **when "can write exploits" becomes a file anyone can get, where should the line of defense move?** I first line up the three sources, then break down which control point each of the three bypass techniques hits, and finally give a checklist each for defenders, self-hosting teams, and hosting platforms. This post covers mechanisms, numbers, and defenses only; it does not reproduce any exploitation steps.

Related posts on this site worth reading alongside: [Hard Stop](/blog/hard-stop-kernel-preemption-rogue-agent-containment/) describes forensic engineers who, after a commercial model refused, spun up open weights on private GPUs to analyze attack logs, a reminder that open weights help defenders too; [OpenShell and Sentry](/blog/nvidia-open-agent-safety-openshell-sentry/) is about moving execution boundaries out of the harness; [Sandboxing Is Not Enough](/blog/sandboxing-not-enough-rogue-agents-authority/) argues that beyond isolation you also need to govern who has authority to issue commands; and in the [agents tampering with their own traces](/blog/llm-agents-tamper-own-traces-append-only-audit/) experiment, ZCode×GLM 5.3 was one of the tested combinations.

## 1. Three sources, and what each one says

Start by laying out the timeline, because the three parties are not saying the same thing, and they are not measuring the same thing either.

| Date | Source | Core claim | Method |
| --- | --- | --- | --- |
| 2026-08-14 | Z.ai launch blog [3] | Hosted model goes live; cyber capability is "emergent" and grew faster than expected once vulnerability-discovery data entered post-training; weights to follow in two weeks, after safety evaluation and hardening | Self-reported benchmarks (CyberGym, ExploitBench, ExploitGym), run in Claude Code 2.1.207 with a domain allowlist |
| ~2026-08-28 | Hugging Face model card [4] | 753B parameters, same base model as GLM-5.2, "every gain comes from post-training"; deployable with SGLang, vLLM, KTransformers, Ascend, and others | Same as above |
| 2026-09-17 | NIST CAISI [2] | "The most cyber-capable open-weight model released to date"; about four months behind the US frontier on an aggregate index | Four benchmarks, ReAct harness (bash + python + a nudge to continue when stopped), US models tested with cyber safeguards disabled where applicable |
| 2026-09-29 | Anthropic [1] | Builds working exploits end to end; safeguards bypassed 64%–100% of the time with simple techniques; a "step change" for attackers | In-house benchmarks + expert human sessions + safeguard tests in a simulated world |

A few things to get straight first.

First, **Z.ai did not hide from this.** The launch blog gives cyber capability its own section, titled as emergent. After post-training was scaled up, the model "did not simply become better at identifying isolated flaws: it began to reason across multiple stages of exploitation, forming coherent plans for complete exploitation chains." It also includes an unusually candid line: the further up the exploitation chain a benchmark sits, the larger the gain over GLM-5.2, and the wider the remaining gap to the closed frontier. "Capability is growing fastest exactly where we are furthest behind." [3] The promised two weeks of safety evaluation and hardening did happen in the sense that NIST records the weights going public two weeks after launch [2], but the public material does not say what the hardening consisted of, or what threshold was used to decide the weights were safe to release.

Second, **Z.ai has put this capability to defensive use, at real scale.** The blog says that since GLM-5.2 it has worked with several security teams in China to run its models against real codebases. After expert review, screening, and deduplication, the model found 2,436 vulnerabilities across 269 projects. The accompanying Z.ai Security Disclosure Ledger shows 107 critical and 990 high, 1,097 in total; 53 publicly disclosed and the other 2,383 still under embargo; the oldest flaw was introduced in 1981, and on average a vulnerability had lived in the code for 26.6 years. [3] Those numbers show both sides of the issue at once: the same model that can pile up two thousand pending fixes for open source in a month can also be picked up by anyone to find the next one.

Third, **CAISI and Anthropic point in the same direction but use different framings.** CAISI stresses "significantly lower than US frontier models"; Anthropic stresses "a threshold has been crossed for attackers." The two are not in conflict. The disagreement is only about which reference point you pick, which Section 3 takes apart.

One more piece of context worth noting: none of the three is neutral. Z.ai sells an API and a Coding Plan. Anthropic's Mythos line ships through restricted access, and its post ends by calling for broader defender access to frontier models. CAISI's report naturally comes with a US–China comparison frame. Read the numbers; don't let the framing carry you.

## 2. How strong is it? Put each number back in its own exam room

Benchmarks with the same name produce numbers that don't line up across the three sources. That's normal: scoring rules and harnesses differ. Below, each source is read separately.

### Z.ai's self-report: the later in the exploit chain, the bigger the gain

| Benchmark | What it measures | GLM-5.3 | GLM-5.2 | Mythos 5 | GPT-5.6 Sol |
| --- | --- | --- | --- | --- | --- |
| CyberGym | Find a vulnerability in white-box source and trigger a crash | 84.5 | 77.2 | 83.8 | 83.6 |
| ExploitBench | Turn known V8 bugs into exploits | 54.4 | 24.4 | 78.0 | 76.5 |
| ExploitGym (2h / 6h) | Exploitation tasks completed within the budget (of 869) | 105 / 130 | 29 / 39 | 181 / 247 | 216 / 293 |

(Data from the Z.ai launch blog and model card [3][4]. The model card table labels Mythos 5 as "Fable 5 (w/ fallback)"; the blog text calls it Mythos 5.)

At the vulnerability-finding step (CyberGym), GLM-5.3 already matches the closed frontier and is even slightly ahead. But the further along you go, toward turning a bug into an exploit that controls the program, the more the gap shows. On ExploitBench it more than doubles GLM-5.2 but still trails Mythos 5 by over 20 points; on ExploitGym it completes only 50–60% as many tasks as Mythos 5. Z.ai's own summary is the line quoted above: capability grows fastest exactly where it is furthest from the frontier.

Two caveats on methodology. One: Z.ai's ExploitBench number is a "coverage score" (41 tasks, each run three times, taking the union of capabilities achieved and then averaging), not an end-to-end success rate. Two: the 2-hour / 6-hour ExploitGym budgets are converted from each model's token throughput; GLM-5.3's results are rescaled at 115 tokens per second. [4] So this table is good for "who ranks higher in the same exam room," not for direct comparison with other sources' numbers.

### Anthropic's tests: end-to-end exploits, roughly on par with Mythos Preview

Anthropic's methodology is closer to what attackers actually care about: do you end up with a working exploit? [1]

- **ExploitBench (end-to-end success only)**: GLM-5.3 produced 50 working exploits in 410 attempts; Claude Mythos Preview produced 56.
- **Internal Binary Exploitation benchmark** (drawn from open-source projects in Google's OSS-Fuzz, 100 randomly selected tasks, full credit only for a full control-flow hijack): GLM-5.3 at 4%, Mythos Preview at 6%; the earlier Claude Opus 4.6 and GLM-5.2 succeeded on none.

4% sounds low, but what matters is going from zero to non-zero. Anthropic's judgment is that "a meaningful threshold has clearly been crossed": earlier models could not do these tasks at all, and now some get done.

More persuasive are the two human-in-the-loop sessions. Both ran in isolated sandboxes against offline targets set up for the evaluation, typically for a day or less, with less than an hour of total human focus:

1. A researcher pointed GLM-5.3 at the Linux build of a popular web browser. Within a day, the model found several previously unknown vulnerabilities in its JavaScript engine and chained them into a working exploit: visit a web page, and it reads arbitrary files from the visitor's computer (the screenshot shows an SSH private key being stolen). In the same session, the researcher also used it to find exploitable vulnerabilities in wireless and graphics drivers and in network-facing device software. These have been or are being disclosed to maintainers.
2. Another researcher gave the smaller GLM-5.3-Flash public details of a recently disclosed Chrome flaw (CVE-2026-11645) and one other known flaw. With no significant direction, the model chained the two into a reliable exploit chain for an ARM64 target, bypassing pointer authentication (PAC, a hardware mechanism that protects pointers from tampering). It took 20 minutes of human attention plus eight hours of model work; at Zhipu's API prices, the total was **$20.40**.

The second example matters more to defenders than the first. Finding a 0-day still takes luck and compute, but "patch comes out → write an exploit from the patch" (what the industry calls an N-day) now costs about as much as dinner and takes about one night.

### CAISI: four exam rooms, one composite score

CAISI's four benchmarks cover the whole chain from finding a bug to writing an exploit: [2]

| Benchmark | Tasks | What the model gets and must do |
| --- | --- | --- |
| SEC-Bench Pro | 183 | V8 or SpiderMonkey source with a known vulnerability, pointed at the files to audit and the kind of flaw; must find it and write code that provably triggers the intended crash |
| ExploitBench | 41 | A known V8 bug; must develop it into an exploit that runs code of its choosing; graded on a 16-point scale, best of three attempts |
| ExploitGym | 502 | A real bug in an open-source project plus an input known to crash it; must develop it into arbitrary code execution |
| CAISI OSS-Fuzz | 297 | Code of a widely used open-source project with a known defect, but no description, example crash, or fix; must find it and hijack the program |

All models ran in the same ReAct harness with only bash and python, plus a nudge to continue if they stopped; reasoning was set to maximum; and where applicable, US models were tested with cyber safeguards disabled. [2] That last detail matters, and Section 3 comes back to it.

Put the three sources together and the conclusion is quite consistent: **bug finding has caught up; exploit writing still lags but has crossed the "can actually do it" threshold.** The only disagreement is about how to read that lag.

## 3. What "about four months behind the US frontier" actually means

The phrase is easy to read as "still early, no need to rush." Taken apart, it says something quite specific, and that specific thing offers attackers almost no comfort.

### How the "four months" is computed

CAISI does not simply average the four benchmarks. It uses the simplest one-parameter model from item response theory (IRT, a psychometric method originally built to score test-takers and test questions at the same time): put every model's success or failure on every task into one big matrix, estimate each task's difficulty and each model's latent capability together, and get a "cyber capability index." [2]

The index uses an Elo scale: **400 points higher means 10x better odds of solving a task.** CAISI's example: if model A has 50% odds on each task, model B, 400 points higher, has about 91%, and model C, 400 points lower, has about 9%. CAISI then plots the index of the strongest US and PRC models over time as two lines, and GLM-5.3's index lands roughly where the US line was four months earlier. That is where "four months" comes from. CAISI also notes that GLM-5.3 scores above Kimi K3, the previous best PRC model (and the previous best open-weight model), and below the current and recent US frontier, with the gap well outside the 95% confidence intervals. [2]

So "four months" is **a distance on the time axis**, not "slightly behind" in capability. And around that point on the US line sit models like Mythos Preview, which at the time was available only to restricted users: it was released five months ago through Project Glasswing's limited access. [1]

### The reference point decides whether this is reassurance or alarm

Go back to that key detail: CAISI's "US frontier" includes **versions released only to vetted users**, and those were tested **with cyber safeguards turned off**. Anthropic calls this out explicitly: attackers cannot readily access those versions, but anyone can download GLM-5.3. [1]

Change the reference point, and the conclusion flips. If the question is "what is the strongest model attackers can freely use today without meaningful safeguards," the answer is GLM-5.3. On that line it ranks first, having passed Kimi K3, the previous leader in CAISI's tests. Anthropic's Figure 1 says the same thing: the jump from Claude Opus 4.6 to Mythos Preview is about as large as the jump from GLM-5.2 to GLM-5.3; the only difference is that the reduced-safeguard versions of the former sit behind restricted access, while the latter sits on Hugging Face. [1]

### The more important point: the capability was unlocked by post-training

One line in the model card is easy to miss: GLM-5.3 uses **the same base model** as GLM-5.2, and "every gain comes from post-training." [4] Z.ai's blog also says the cyber capability grew "faster than we expected" as post-training was scaled. [3]

What does that imply? Exploit capability does not seem to require a bigger, more expensive pretraining run. It looks more like something targeted post-training can draw out of an existing base. For followers, that path is far cheaper than training a new frontier base. Anthropic's Figure 2 already plots the latest open-weight models, Kimi K3 and DeepSeek V4.1-Flash, on the same curves. [1] It is reasonable to expect this capability to be standard in the next batch of open models rather than one lab's exception.

### Three readings

Putting all this together, "four months" can be read three ways, depending on where you stand:

- **Policy and evaluation people**: the gap is real and statistically solid, which gives "restricted access + government testing" a reason to keep existing. Anthropic explicitly calls on governments to safety-test successors to GLM-5.3 [1], and CAISI's assessment is itself an example of that kind of testing [2].
- **Attackers**: the gap barely matters. They are not comparing GLM-5.3 with restricted Mythos; they are comparing it with "the best tool I could freely use before." By that comparison, this is a step change.
- **Defenders**: "four months" is best read as **a countdown**. If the gap holds, capabilities that only restricted-access users have today will show up in downloadable weights about four months from now, with no meaningful safeguards. Plan your patch speed, asset inventory, and detection on that clock, not on "attackers can't use this yet."

## 4. Three bypass techniques, and which control point each one hits

Anthropic's safeguard tests are the part this post most wants to take apart, because they directly answer the claim in the title: why refusals are no longer a defense once the weights are open.

First, be clear about what safeguards GLM-5.3 has. Anthropic observed that when users ask for something clearly harmful, the model often refuses. But the vulnerability-research tasks in the post **did not trigger refusals on the released model at all**; refusals appeared only when the model was asked to help develop malware or attack remote targets. [1] In other words, dual-use tasks like finding bugs and writing exploits (useful to both attackers and defenders) were never inside refusal coverage in the first place. That alone shows how blurry the boundary is when defense depends on the model judging the intent of a request.

### How the test was designed

Anthropic placed the model in a simulated world and gave it overtly malicious instructions: attack critical systems. In this environment, model-generated code is never actually executed. The model gets a fake bash tool, and another LLM "makes up" each command's result from a description of the simulated world. [1] The metric is whether the model, after receiving a harmful request, tries to connect to a remote target system; each cell has 50 samples (5 attack orders × 2 targets × 5 attempts).

With no tricks, GLM-5.3 refused **in every trial**, like every other model tested. Then came three techniques:

| Technique | What it does | GLM-5.3 engagement | Control point hit | Why the closed API holds |
| --- | --- | --- | --- | --- |
| Cover story | Tell the model it is an autonomous red-team agent in an exercise | 64% | The model's own judgment of intent | Claude's safeguards blocked these deceptive prompts |
| Prefilled thinking | Pre-write thinking tokens so it looks as if the model already considered the request and decided to proceed | 92% | Integrity of the reasoning process | The Anthropic API gives users no way to prefill Claude's thinking |
| Abliteration | Edit the weights directly to remove refusal behavior | 100% | The weights themselves | Weights aren't released, so they can't be edited |

(Data and explanations from Anthropic [1]. Under the same conditions, every safeguarded Claude model tested stayed at 0.)

The last column matters more than the engagement rates. The three techniques fail against the closed API for different reasons: the first because of Claude's own safeguards (the post does not separate trained judgment from additional detection), the second because **the interface doesn't expose that capability**, the third because **the weights never leave the building**. Only the first is really "the safeguard working"; the other two are stopped by how the model is deployed.

### Why prefill and weight edits are "free" with open weights

Deploying open weights yourself means the entire inference path, from the chat template to sampling parameters, is in your hands. To the model, "system prompt," "assistant thinking," and "assistant reply" are just a stream of tokens with special markers. You can write the opening before the model speaks, including a thinking passage like "I've considered this; it's an authorized exercise; proceed." Continuing from there is the most natural thing the model does. A closed API can make this impossible only because the server won't let you touch that segment; a local inference server has no such gate.

Abliteration is more direct. It builds on an existing observation: in many models, refusal behavior roughly corresponds to a single direction in activation space, and projecting that direction out of the weights makes the model mostly stop refusing while affecting other capabilities very little. [5] Anthropic made its own abliterated GLM-5.3: [1]

- On JailbreakBench, HarmBench, and StrongREJECT, three public benchmarks that measure compliance with clearly harmful requests, the refusal rate fell from above 90% to about 3%, 2%, and 12%.
- Capability barely moved: GPQA-Diamond scores were identical to the original, and on a subset of CyberGym the abliterated version scored only a few percent lower.
- Cost: a team that had never done this before spent about 2,200 GPU hours, roughly $4,400, mostly on exploring variants in parallel and testing capabilities after modification. They estimate an experienced team starting from scratch would need closer to 600 GPU hours (about $1,200). GLM-5.3-Flash took about 600 GPU hours.
- In practice you don't even need to do it yourself: within days of the release, several developers had published abliterated versions.

### Bottom line: refusal is a factory default, not a boundary

Compress this section into one sentence: **with open weights, every control point that lives inside the inference path belongs to whoever deploys the model.** Refusal is a default the vendor set for you. Attackers can change it with a prompt, with a prefill, or with the weights, at a cost from zero (download someone else's version) to a few thousand dollars. However hard the vendor hardens this layer, it only raises the price of changing the default; it cannot stop someone determined to do it.

So stop asking "are GLM-5.3's safeguards good enough?" The question to ask is: **if the model layer can be assumed to cooperate fully, where are the remaining control points?**

## 5. Where the defenses should move

### Defenders: reprioritize for "exploits will be faster and cheaper"

- **Shrink the patch window.** An N-day exploit now costs on the order of twenty dollars and one night. The time between a patch's release and your deployment of it is the metric most worth tightening, starting with internet-facing browsers, drivers, and device firmware.
- **Keep the mitigations, but don't count on them as a backstop.** Hardware mitigations like PAC were bypassed in the case above; they raise cost, not the ceiling.
- **Detect behavior, not content.** Attack traffic won't be labeled "generated by GLM-5.3." What you can rely on are behavioral signals: anomalous processes, outbound connections, and credential use.
- **Use these models yourself.** Z.ai's two thousand-plus findings and Glasswing's more than ten thousand show that the same capability can be pointed at your own code first. [1][3] Also staff up triage for the wave of vulnerability reports that follows.

### Self-hosting teams: treat the model as a component that may cooperate fully with anyone

Plenty of teams will pull GLM-5.3 or its Flash variant onto their internal network as a coding agent. Its refusals aren't your guardrail there either: an instruction injected into context works about as well as a cover story. Put the control points outside the model:

1. **Execution isolation and an egress allowlist.** Even in its own evaluations, Z.ai wrapped the agent in a domain allowlist that only permitted essentials like pypi.org and deb.debian.org. [4] Production has no excuse to be looser than an eval.
2. **Minimal credentials.** Any token the agent can reach should cover only the current task, expire quickly, and be revocable.
3. **Don't expose raw completion endpoints.** If you serve the model to others, don't let callers assemble the chat template themselves or prefill the assistant or thinking segments. That is exactly the 92% row.
4. **Verify weight provenance.** Abliterated versions were published within days. Pull only from the official organization and pin file hashes.
5. **Keep audit logs where the agent can't touch them.** For why, see the [agents tampering with their own traces](/blog/llm-agents-tamper-own-traces-append-only-audit/) experiment on this site.

### Hosting platforms and resellers: you only control the copy in your own data center

Platforms that serve GLM-5.3 behind an API still hold the control points closed vendors have: identity verification and tiered access, usage and behavior monitoring, output-side detection, and abuse response. These are worth doing, but be clear that they cover only traffic that passes through your infrastructure, not copies that have already been downloaded.

## 6. Where to apply a discount

- Anthropic's safeguard numbers come from a simulated world in which another LLM makes up command results; they are not success rates in real attacks. [1]
- What Z.ai's "safety evaluation and hardening" consisted of, and what criteria were used to release the weights, is not in the public material. [3]
- The three sources use same-named benchmarks with different scoring; comparing numbers across sources is meaningless.

## Closing

GLM-5.3 is not the strongest model, but it turned "can write exploits" into a file anyone can download. From here on, whether a model refuses is just a default setting. The real defenses sit outside the model: patch speed, execution isolation, egress control, credential scope, and auditing. The next open-weight model will most likely ship with this capability too; moving the line now is not early.

## References

1. Anthropic Frontier Red Team, "GLM-5.3 and the spread of advanced cyber capabilities", 2026-09-29. https://www.anthropic.com/research/glm-5-3-and-the-spread-of-advanced-cyber-capabilities
2. NIST CAISI, "CAISI's Assessment of Z.ai's GLM-5.3 Cyber Capabilities", 2026-09-17. https://www.nist.gov/news-events/news/2026/09/caisis-assessment-zais-glm-53-cyber-capabilities
3. Z.ai, "GLM-5.3: Frontier Coding with Emergent Cyber Capabilities", 2026-08-14. https://z.ai/blog/glm-5.3 (including the Z.ai Security Disclosure Ledger: https://cvd.z.ai/ )
4. zai-org/GLM-5.3 model card, Hugging Face. https://huggingface.co/zai-org/GLM-5.3
5. Arditi et al., "Refusal in Language Models Is Mediated by a Single Direction", 2024. https://arxiv.org/abs/2406.11717

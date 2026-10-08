---
title: "Mistral Large 4 vs. 2026 Open-Weight Flagships: Params, Licenses, Hardware"
description: "Mistral Large 4 is in preview, weights due at month-end. We compare it with Beam, Kolibri, GLM-5.3, DeepSeek, Kimi and Qwen on params, licenses and hardware."
pubDate: 2026-10-08T16:40:00+08:00
author: "Remy"
tags: ["llm", "open-source", "security", "ai-agents"]
lang: "en"
---

On October 6, Mistral released a public preview of Mistral Large 4, internally nicknamed "Le Chonk." The official pitch: roughly 1 trillion total parameters, 52 billion active, natively multimodal, a preview API available today in Mistral Studio, and weights "by the end of the month." Before the weights go out, Mistral says it is red-teaming the model in real-world settings with cybersecurity leaders, vetted partners, and state authorities, who get access to the same model "with reduced moderation and expanded cyber capabilities." [1] The Hacker News thread passed 2,000 points within two days. [3]

As news, that fits in three paragraphs. I would rather use it to answer a recurring model-selection question: **in the fall of 2026, what are open-weight flagships actually competing on, and what should a developer check before betting on one?** Within the same week, Reflection announced the 501B Beam (October 5, weights later this month) [4] and Aleph Alpha shipped the 78B Kolibri (October 3, weights the same day) [5]. Add GLM-5.3, DeepSeek V4.1 Flash, Kimi K3, and Qwen3.8, all of which already have weights out, and you have a cross-section.

The rest of this post works through six threads: parameter accounting and hardware, release timing and red-teaming, licenses, sovereignty, multimodal and agentic claims, and a checklist. Related posts on this site: [the GLM-5.3 piece](/blog/glm-5-3-open-weight-cyber-capabilities-safeguards/) explains why refusals stop being a defense once weights are public, which section three builds on; [the DeepSeek V4 benchmark map](/blog/deepseek-v4-benchmarks-guide/) explains what the individual benchmarks measure; [OpenShell and Sentry](/blog/nvidia-open-agent-safety-openshell-sentry/) covers moving the safety boundary outside the model. Anything marked "My take" is my opinion; every number comes from the primary sources listed at the end.

## What Mistral has said, and what it has not

| Published | Source |
| --- | --- |
| About 1T total and 52B active parameters; the docs page says 1.05T total, 52B active, plus a 1.6B vision encoder | Announcement [1], docs [2] |
| A "granular Mixture-of-Experts" architecture | Docs [2] |
| 1M context (docs page) | Docs [2] |
| Trained from scratch on 3,800 NVIDIA Grace Blackwell GPUs in Mistral's own European datacenters; the preview is served on the same infrastructure | Announcement [1] |
| Training data spans more than 160 languages, including every official EU language | Announcement [1] |
| The RL run is still in flight with "no signs of saturation"; at the current scale of about 3k GPUs, a run produces roughly 33B tokens per day, about 16B of them trainable after filtering | Announcement [1] |
| Preview API pricing: list price $1.36 per million input tokens and $4.18 per million output tokens, currently on sale at half price | Docs [2] |

| Not yet published | Why it matters |
| --- | --- |
| Architecture details (layers, experts, attention design) | Whether inference engines support it on day one, and how large the KV cache is |
| License | Whether you can use it commercially and whether there is a revenue threshold |
| Precision of the released weights (BF16, FP8, or lower) | How much GPU memory you need |
| Post-training method and the full benchmark set | Mistral says these will ship with the weights [1] |

Two calibrations first. One: community posts have circulated "1T-A49B" and "1050B, 49 active" [3], but both Mistral's announcement and docs say 52B active, so this post uses 52B. Two: the third-party evaluator Artificial Analysis (AA) lists Mistral Large 4 Preview as a "Proprietary model" with a 524k context window, while Mistral's docs say 1M. [6][2] The first is expected, since it is a closed API until the weights ship. The second means **the spec you get from a preview endpoint may not match the documented ceiling**; for selection, trust what you can actually call.

## A cross-section: the models side by side

| Model | Total / active params | Weight status (as of Oct 8) | License | Modalities | Where trained |
| --- | --- | --- | --- | --- | --- |
| Mistral Large 4 | 1.05T / 52B | Preview API, weights at month-end [1] | Not announced | Text + image [2][6] | Europe, Mistral's own datacenters [1] |
| Reflection Beam | 501B / 23B | Early access, weights this month [4] | Apache 2.0 promised [4] | Text only [4] | Not stated; pitched as advancing the "Western open-weight frontier," GB300 clusters [4] |
| Aleph Alpha Kolibri | 78.1B / 3.46B | Released (Oct 3) [5][7] | Apache 2.0 [7] | English-German text [5] | Germany and Finland [5] |
| GLM-5.3 | 753B / not on the card | Released (two weeks after launch) [8][9] | Custom GLM-5.3 License [10] | Text [19] | Not stated; Z.ai is PRC-based [9] |
| DeepSeek V4.1 Flash | 552B backbone / 8B or 16B | Released [12] | MIT [12] | Text + image [12] | — |
| Kimi K3 | 2.8T / 104B | Released [13] | Custom Kimi K3 License [13] | Text, image, video [13] | — |
| Qwen3.8-2.4T-A95B | 2.4T / 95B | Released [14] | Custom Qwen3.8-Max License [14] | See below for the open version | — |

A dash means I did not find an explicit statement in the primary sources I fetched, not that the information does not exist.

## Total parameters set your memory bill; active parameters set your per-token cost

A Mixture-of-Experts model routes each token through a small subset of experts, so it has two numbers. Total parameters are **what must sit in GPU memory**. Active parameters are **what actually computes on each token**. The first decides how many GPUs you buy; the second decides how many tokens per second each GPU produces and how much energy each token costs.

### Start with accounting: "total parameters" is not counted the same way

- Mistral's announcement says "1 trillion"; the docs say 1.05T and list a 1.6B vision encoder separately. [1][2]
- DeepSeek's V4.1 Flash model card says "552B backbone parameters," and also describes an Engram conditional memory of about 196B parameters, sparsely accessed via token-based lookup. On Hugging Face, the safetensors total comes to about 763.2B parameters. [12][15] In other words, "552B" is not what you actually download and load.
- In the same DeepSeek table, V4.1 Flash's active parameters are listed as "8B / 16B." [12] I did not find a verbatim explanation of the two figures on the card, so I won't speculate.
- Kolibri is the most concrete: the card gives exact counts, 78,103,074,560 total and 3,457,573,120 active. [7]

My take: when comparing open-weight models, skip the round numbers from launch posts and check the files on Hugging Face. This command returns the safetensors parameter total and the per-dtype breakdown without downloading any weights:

```bash
curl -s https://huggingface.co/api/models/zai-org/GLM-5.3 \
  | python3 -c "import json,sys; d=json.load(sys.stdin)['safetensors']; print(d['total'], d['parameters'])"
```

### A rough fit check

The table below sums the `.safetensors` file sizes of each repo via the Hugging Face API (queried October 8). It is a lower bound for weights only, with no KV cache. [15]

| Repo | Weight files total | Dominant precision |
| --- | --- | --- |
| Aleph-Alpha/Kolibri-1 | ~79 GB | FP8 [7] |
| mistralai/Mistral-Small-4-119B-2603 | ~242 GB | Mostly FP8 [15] |
| zai-org/GLM-5.3-Flash | ~328 GB | Mostly FP8 [15] |
| deepseek-ai/DeepSeek-V4.1-Flash | ~510 GB | Mostly INT8 / FP8 [15] |
| zai-org/GLM-5.3 | ~756 GB | Mostly FP8 [15] |
| deepseek-ai/DeepSeek-V4-Pro-0813 | ~893 GB | Mostly INT8 [15] |
| moonshotai/Kimi-K3 | ~1,561 GB | MXFP4 weights (quantization-aware training) [13] |
| Qwen/Qwen3.8-2.4T-A95B-FP8 | ~2,496 GB | FP8 |

Now compare common machines: a single H200 has 141GB, so eight of them give 1,128GB; a DGX B200 has 1,440GB in total; a full GB200 NVL72 rack has 13.4TB of HBM3e. [16][17][18]

Putting the two tables together (my take, using weight lower bounds):

- **Kolibri**: the card says the FP8 weights take about 78GB; the minimum is one H200 or one B200, with two H100s among the recommended setups. [7] It is the only single-GPU tier here.
- **Beam**: weights are not out yet. At FP8, one byte per parameter, 501B is about 0.5TB; eight H200s hold it with a few hundred GB left for KV cache.
- **GLM-5.3**: about 756GB, leaving a bit over 300GB on eight H200s.
- **Mistral Large 4**: if month-end weights ship in FP8, 1.05T is about 1.05TB. Eight H200s would have only 70 to 80GB to spare, which makes 1M-token contexts unrealistic; a DGX B200 leaves about 390GB. Lower-precision quantizations depend on whether Mistral or the community provides them, and how much quality they lose.
- **Kimi K3 and Qwen3.8**: about 1.56TB and 2.5TB respectively. Neither fits on a single eight-GPU machine; you need multiple nodes or a full rack.

An HN commenter complained that open models "keep getting bigger and bigger." [3] The table says it plainly: **for most teams, "open" at this flagship tier means "can run in your own datacenter or private cloud," not "can run on a workstation."** If you really want one or two GPUs, the realistic options are something like Kolibri with 3B active, or the Flash and Small variants from each lab.

### Active parameters: per-token cost, and why long context is a separate bill

In its Beam post, Reflection gives a rough formula: generation compute is about 2 × active parameters × generated tokens, counting only per-token active parameters for MoE models and excluding prefill, attention, and serving overhead. [4] By that formula, each generated token costs roughly 104 GFLOP for Mistral Large 4, 46 for Beam, 7 for Kolibri, 208 for Kimi K3, and 190 for Qwen3.8.

The other half is **how long the answers are**. When AA ran its Intelligence Index, Mistral Large 4 Preview emitted about 200M output tokens, against a median of 81M among comparable models according to AA; GLM-5.3 (max) emitted 210M and DeepSeek V4.1 Flash (max) 250M. [6][19][20] Cheap tokens still add up if the model is chatty. AA's cost-per-task figure is closer to what you actually pay: $1.13 for Mistral Large 4 Preview, $2.01 for GLM-5.3 (max), $0.27 for DeepSeek V4.1 Flash (max), and $2.00 for Kimi K3 (max). [6][19][20][21]

Long-context memory depends mostly on attention design, not parameter count. Kolibri's post has a good example: Aleph Alpha tried scaling from 32B to 123B and kept getting better results, but 123B could handle only three concurrent 256k-token queries on two H100s, while 78B handled 18 and decoded 28% faster, so they chose 78B. Only 10 of its 50 layers attend to the full context; the other 40 use a 512-token window, which keeps decode compute and memory in those layers flat as context grows. [5] Mistral Large 4's attention design is not public yet, so you cannot currently estimate how many concurrent 1M-context requests it can serve on your hardware.

## "Preview now, weights at month-end": what happens in the gap

The four labs release weights in different ways:

| Model | First release | Weights | What happens in the gap |
| --- | --- | --- | --- |
| Kolibri | Oct 3 | Same day [5] | No gap |
| GLM-5.3 | Hosted version Aug 14 | Two weeks later [9] | Z.ai described safety evaluation and hardening without publishing specifics (see the GLM post) |
| Beam | Oct 5 | "Later this month," with technical report and model card [4] | "Final red-teaming and evaluations," early-access signup |
| Mistral Large 4 | Preview API Oct 6 | "By the end of the month," with architecture, more benchmarks, post-training method [1] | Real-world red-teaming with security firms, vetted partners, and state authorities; post-training RL continues |

My take: the gap serves the lab in three ways, and each maps to a risk for developers.

**First, the model is still changing.** Mistral says plainly that RL is still running and that it expects "large and rapid improvements in the weeks and months to come." [1] The scores you measure on the preview API today may not come from the same checkpoint you download at month-end. Record the model ID and call date in your evaluation, and rerun it once the weights ship.

**Second, the open version may not match the API version.** Qwen already set the precedent. The Qwen3.8-2.4T-A95B model card says the official Qwen3.8-Max API is a version based on it "with more features," such as vision input, non-thinking support, 1M context by default, and official built-in tools. [14] The open repo itself has a native context of 262,144 tokens, extensible to about 1.01M. [14] Whether Mistral Large 4's weights include the vision encoder and the full 1M context is something to verify in the files at month-end.

**Third, what red-teaming in the gap can and cannot change.** Mistral's wording is telling: red-team partners get "the same model," only with reduced moderation and expanded cyber capabilities. [1] In other words, the preview API has a provider-side moderation layer, and that layer does not exist once the weights are public. The GLM post on this site already worked through this: in Anthropic's tests, simple techniques got GLM-5.3 to engage with harmful requests 64% to 100% of the time, and removing refusal behavior from the weights (abliteration) took Anthropic's team, on its first attempt, about 2,200 GPU hours and roughly $4,400, or about 600 GPU hours for GLM-5.3-Flash. [22] So Mistral's claim that its refusal rate on malicious cyber prompts (from JailbreakBench, StrongREJECT, and AgentHarm) is higher than all open models [1] mostly matters for the hosted API. Once the weights are out, refusal is just a factory default.

So what is pre-release red-teaming good for? My take: it can really do two things. One is **deciding what to release**, for example delaying or trimming if capability evaluations look too dangerous. The other is **giving defenders a head start**. Anthropic released Mythos Preview through limited access, which let vetted defenders find more than 10,000 vulnerabilities before attackers had access to similarly capable models. [22] Mistral giving security firms and state authorities an early version with stronger cyber capability follows the same logic. The difference is duration: about five months passed between Anthropic's Mythos Preview announcement and its GLM-5.3 write-up, while Mistral has promised a little over three weeks between preview and weights.

Mistral also treats open weights as a cybersecurity feature in their own right: provider-level refusals can block legitimate vulnerability research and incident response, and losing access mid-incident is itself a security risk. [1] Its numbers: top five globally on the AA Cyber Index and leading open-weight models developed outside China by a wide margin; 82% on a test that asks the model to reproduce a real vulnerability in open-source software and then patch it, the highest of any model; and 93% of the 40 challenges in Cybench. On that same reproduce-and-patch test, Claude Opus 5.5 and GPT-6 Astra score near zero because they refuse. [1] The takeaway: **the time gap between defenders and attackers getting the same capability keeps shrinking, so the defenses have to live in patch speed, execution isolation, and egress control, not in whether a model refuses.**

## Licenses: all "open weights," very different terms

People skip this during selection and regret it later. I read each LICENSE file I could fetch:

| Model | License | Key thresholds (paraphrased from the text) |
| --- | --- | --- |
| Kolibri | Apache 2.0 [7] | No revenue threshold |
| Beam | Apache 2.0 promised [4] | Weights not out; check the actual file |
| DeepSeek V4.1 Flash / V4-Pro-0813 | MIT [12] | No revenue threshold |
| GLM-5.3-Flash | MIT [11][15] | No revenue threshold |
| GLM-5.3 | GLM-5.3 License [10] | If you run a "Model as a Service" business (an API that lets third parties meaningfully control inputs, parameters, or training data) and your group's revenue exceeds $10B over any 12 consecutive months, you must pass Z.ai's security review before commercial use |
| Kimi K3 | Kimi K3 License [13] | Model-as-a-Service with more than $20M revenue over 12 months requires a separate agreement before commercial use; products with more than 100M monthly active users or more than $20M monthly revenue must display "Kimi K3" prominently; purely internal use and use through Moonshot's official products or certified inference partners are exempt from both |
| Qwen3.8-2.4T-A95B | Qwen3.8-Max License [14] | More than 100M MAU or $20M monthly revenue requires displaying the model name; Model-as-a-Service or "AI Work Assistant" (standalone coding or office-productivity products) businesses above $50M revenue over 12 months need a separate license; purely internal use is exempt |
| Mistral Medium 3.5 (reference) | Modified MIT [23] | If your company's (or your employer's) global consolidated monthly revenue exceeded $20M in the preceding month, you may not exercise any rights under the license and must seek a commercial license from Mistral |
| Mistral Small 4 (reference) | Apache 2.0 [15] | No revenue threshold |
| Mistral Large 4 | Not announced | — |

Mistral's own lineup already uses two licenses: Small 4 is Apache 2.0, while Medium 3.5 is a Modified MIT with a revenue threshold, and that threshold is not limited to "running an API service"; it applies across your company's total revenue. On HN, one user first said the model was proprietary only until the end of the month, then corrected themselves: Mistral releases under a modified MIT license requiring large corporate users to sign commercial agreements, "so it is in fact proprietary." [3] The comment gives no source and seems to extrapolate from Mistral's past practice; Mistral has not said which license Large 4 will use.

My take: "open weights" tells you that you can download the model, not that you can use it. For a company with more than $20M in monthly revenue, Apache versus Modified MIT for Large 4 is a completely different outcome: the first means deploy freely, the second means going back to Mistral to buy a license. Before betting, wait for the actual text.

## Sovereignty: where it was trained, where it runs, and where the data came from are three questions

"Sovereignty" shows up constantly in this round of launches. Mistral's section heading is "Forged in Europe. Built for AI sovereignty," emphasizing training in its own European datacenters and a European deployment that Mistral operates end to end, independently of other digital service providers and under European law. [1] Aleph Alpha is more specific: the team is in Germany, training ran on infrastructure in Germany and Finland "with no foreign control," and the model was designed from the start with the EU AI Act, the General-Purpose AI Code of Practice, and GDPR in mind, with transparency about training-data curation. [5] Reflection positions Beam as advancing the "Western open-weight frontier." [4]

My take: three different things are bundled under that word.

1. **Where training happened and who controls the pipeline.** This bears on data compliance, copyright, and auditability. Kolibri publishes the most here: German makes up 21.3% of pre-training tokens, translated data only about 6%, and the post explains why they avoided relying on machine translation to fill the German gap. [5] Mistral has so far given the training location and language coverage.
2. **Where inference runs.** This matters only for hosted APIs. Once the weights are in your datacenter, where the data goes is entirely your decision, regardless of where the model was trained. GLM-5.3 comes from PRC-based Z.ai, but if you run the weights in a Frankfurt datacenter, request data never leaves Frankfurt.
3. **Whether supply can be cut off.** This is what self-hosting actually buys you. Mistral itself says losing model access mid-incident is a security risk. [1] With weights in hand, that risk goes away, provided the license allows the use.

So for developers, the checkable part of "sovereignty" is: is there documentation of training data, does the license carry extra conditions, and can the weights run fully offline. The vendor's nationality mostly affects government procurement and compliance reviews, not the technology itself.

## Multimodal and agentic capability: claims versus evidence

### Read self-reported scores one exam room at a time

Every lab leads with coding and agents. Line up same-named benchmarks and problems show up:

- **DeepSWE v1.1**: Mistral Large 4 self-reports 61.7%. [1] In Beam's comparison table (other models' scores sourced from AA and DataCurve), GLM-5.3 is 61.0, Kimi K3 68.0, DeepSeek V4.1 Flash 74.2, and Beam itself 44.4. [4] Mistral says its combined Coding Agent Index score of 49.8% places it ahead of "DeepSeek V4 Pro 0813 and Qwen3.8 Max," [1] choosing V4 Pro 0813 as the comparison rather than V4.1 Flash, which scores higher in that table.
- **Terminal-Bench**: Mistral reports version 4.0 (28.3%); Beam and Kolibri report version 2.1 (80.1 and 27.7). [1][4][5] Different versions cannot be compared.
- **τ³-bench banking**: Kolibri (3B active) reports 38.1, Beam (23B active) reports 38.0. [5][4] Kolibri states its scores were run "using our own harnesses"; Beam does not describe how it measured its own scores. Seven times the active parameters and nearly identical scores most likely means different measurement setups, not that Kolibri is suddenly that strong.
- **Chart ordering**: an HN commenter pointed out that many bar charts on Mistral's launch page place Mistral next to the weakest competitor and the strongest competitor on the far side, making bar heights hard to compare. [3]

For now, the only independent data comes from AA. On the AA Intelligence Index (v4.3.2, ten evaluations including Terminal-Bench 4.0, AutomationBench, SciCode, and HLE), Mistral Large 4 Preview scores 38, GLM-5.3 (max) 45, Kimi K3 (max) 44, and DeepSeek V4.1 Flash (max) 39. [6][19][20][21] Mistral says it is "competitive with the strongest open-source models globally." [1] By this independent index, the more accurate statement is: close to DeepSeek V4.1 Flash, a notch behind GLM-5.3 and Kimi K3. My take: with RL still running, the month-end version may score higher, but today's conclusion can only rest on today's numbers.

### Which agentic claims have outside support

Two pieces of Mistral Large 4's agentic evidence do not come entirely from Mistral's own exam room. One is AutomationBench, labeled as the AA version on the launch page (657 business workflows across Gmail, Google Sheets, Slack, and Salesforce) at 59.9%, along with 1,393 Elo on AA-Briefcase. The other is a blind human evaluation run with Surge AI, where professional annotators rated coding output on a 1–5 scale: Mistral Large 4 Preview scored 3.74, second of five models, behind only Claude Opus 5 (4.22) and ahead of GLM-5.3 (3.60), Kimi K3 (3.59), and GLM-5.2 (3.40). [1] With only five models and Mistral as the commissioning party, it is a useful signal, not a final verdict.

On Beam's side, the interesting claim is transfer: during RL on reasoning, software engineering, and terminal tasks, browsing performance improved even though there were no browsing tasks in the mix; given web access, the model learned on its own to query other LLMs and call OCR APIs to read documents. [4] Interesting, but for now it rests on the official narrative and demos.

Kolibri takes a different route. It treats "say I don't know when you don't" as a core capability: on AA-Omniscience it abstains instead of answering wrong on 44% of items (versus 15% for its predecessor), and Aleph Alpha built its own agentic-RAG benchmark called Honeypot. [5] For regulated settings, that is more useful than a few extra SWE points.

### Multimodal

Mistral Large 4 is one of the few models in this set with image input, which AA confirms (text and image in). [6] The headline strength is visual grounding, meaning precisely locating and boxing targets in an image: 42% on Dense 200 versus 41% for GPT-6 Astra. [1] A one-point, self-reported lead. My take: read it as "visual grounding on par with frontier closed models," not "surpassing" them. Beam is explicitly text-only [4]; Kimi K3 handles text, images, and video [13]; DeepSeek V4.1 Flash handles images and text [12]; AA lists GLM-5.3 as text input only [19].

## A checklist before you bet

1. **Parameters and files.** Use the Hugging Face API to get safetensors totals and dtype breakdown, and compute the weight lower bound; ignore round launch numbers.
2. **Hardware.** Weight lower bound plus KV cache at your target context and concurrency; measure at the context length you will actually use, not just 8k.
3. **Inference engine.** New architectures often need dedicated plugins or branches. Kolibri requires the vLLM plugin from aleph-alpha-inference, [5] and Mistral Medium 3.5 once had a Transformers config error that degraded long-context performance until it was fixed. [23] Until Large 4's architecture is published, don't assume your current serving stack works on day one.
4. **License text.** Check for revenue or MAU thresholds, whether thresholds apply to "Model as a Service" or to total company revenue, and whether internal use is exempt. For Large 4, wait for the text.
5. **Version alignment.** Record the preview API's model ID and date; when weights ship, confirm whether it is the same checkpoint and whether the vision encoder and context length are intact.
6. **Benchmarks.** Compare only scores from the same version and harness; rerun your own task set on your own harness, and record output token counts.
7. **Safety.** Assume the model will cooperate with anyone, and put the control points outside it: execution isolation, egress allowlists, minimal credentials, audit logs the model cannot touch; pull weights only from official organizations and pin hashes.
8. **Sovereignty.** Separate training location, inference location, and supply continuity; if you need compliance documentation, ask the vendor for training-data documentation rather than relying on nationality.

## What I could not verify

- Fetching the Reddit LocalLLaMA thread was blocked, so nothing in this post cites it.
- GLM-5.3's active parameter count is not on its model card; an HN commenter says 40B, [3] but I found no primary source, so the table leaves it blank.
- Mistral Large 4's pre-training duration, architecture details, license, and weight precision are all unpublished.
- On the claim that Mistral Large 4 costs half as much as GLM-5.3 [3], I could only verify AA's cost per task ($1.13 versus $2.01) [6][19], not an official comparison.

## Closing

What Mistral Large 4 means on its own is that Europe has, for the first time, a trillion-parameter-class flagship slated for open weights. Placed in the cross-section, it enters a crowded field: the Chinese labs currently lead on the independent index, Beam competes for Western developers on efficiency and Apache 2.0, and Kolibri shows that 3B active parameters can be genuinely useful. For developers, the real comparison is not whose launch was louder but four checkable things: how big the files are, what the license says, whether the weights match the API, and what scores you get on your own harness. For Large 4, only the first can be roughly estimated before the end of the month.

## References

1. Mistral AI, "Introducing Mistral Large 4", 2026-10-06. https://mistral.ai/news/mistral-large-4/
2. Mistral Docs, "Mistral Large 4" model page (v26.10). https://docs.mistral.ai/models/mistral-large-4-0
3. Hacker News, "Mistral Large 4" discussion (item 49977979). https://news.ycombinator.com/item?id=49977979
4. Reflection AI, "Introducing Beam: Reflection's 501B open-weight model", 2026-10-05. https://reflection.ai/blog/introducing-beam
5. Aleph Alpha, "Kolibri Has Landed: A Sovereign Open-Weight Model", 2026-10-03. https://aleph-alpha.com/en/blog/kolibri-has-landed-a-sovereign-open-weight-model/
6. Artificial Analysis, "Mistral Large 4 Preview". https://artificialanalysis.ai/models/mistral-large-4
7. Aleph-Alpha/Kolibri-1 model card, Hugging Face. https://huggingface.co/Aleph-Alpha/Kolibri-1
8. zai-org/GLM-5.3 model card, Hugging Face. https://huggingface.co/zai-org/GLM-5.3
9. NIST CAISI, "CAISI's Assessment of Z.ai's GLM-5.3 Cyber Capabilities", 2026-09-17. https://www.nist.gov/news-events/news/2026/09/caisis-assessment-zais-glm-53-cyber-capabilities
10. GLM-5.3 License. https://huggingface.co/zai-org/GLM-5.3/blob/main/LICENSE
11. zai-org/GLM-5.3-Flash model card, Hugging Face. https://huggingface.co/zai-org/GLM-5.3-Flash
12. deepseek-ai/DeepSeek-V4.1-Flash model card, Hugging Face (see also the MIT license note on the DeepSeek-V4-Pro-0813 card). https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash
13. moonshotai/Kimi-K3 model card and Kimi K3 License, Hugging Face. https://huggingface.co/moonshotai/Kimi-K3
14. Qwen/Qwen3.8-2.4T-A95B model card and Qwen3.8-Max License, Hugging Face. https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B
15. Hugging Face Hub API (`/api/models/<id>` and `/api/models/<id>/tree/main`), queried 2026-10-08: GLM-5.3, GLM-5.3-Flash, Kolibri-1, DeepSeek-V4.1-Flash, DeepSeek-V4-Pro-0813, Kimi-K3, Qwen3.8-2.4T-A95B(-FP8), Mistral-Small-4-119B-2603, Mistral-Medium-3.5-128B. https://huggingface.co/docs/hub/api
16. NVIDIA, H200 Tensor Core GPU. https://www.nvidia.com/en-us/data-center/h200/
17. NVIDIA, DGX B200. https://www.nvidia.com/en-us/data-center/dgx-b200/
18. NVIDIA, GB200 NVL72. https://www.nvidia.com/en-us/data-center/gb200-nvl72/
19. Artificial Analysis, "GLM-5.3 (max)". https://artificialanalysis.ai/models/glm-5-3
20. Artificial Analysis, "DeepSeek V4.1 Flash (max)". https://artificialanalysis.ai/models/deepseek-v4-1-flash
21. Artificial Analysis, "Kimi K3 (max)". https://artificialanalysis.ai/models/kimi-k3
22. Anthropic Frontier Red Team, "GLM-5.3 and the spread of advanced cyber capabilities", 2026-09-29. https://www.anthropic.com/research/glm-5-3-and-the-spread-of-advanced-cyber-capabilities
23. mistralai/Mistral-Medium-3.5-128B model card and Modified MIT License, Hugging Face. https://huggingface.co/mistralai/Mistral-Medium-3.5-128B

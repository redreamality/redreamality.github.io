---
title: "Can a 16GB GPU Replace Claude Code? Qwen3.8 Local Coding Agents by VRAM Tier, Quantization, and Harness Setup (2026)"
description: "Can local Qwen3.8 replace Claude Code? VRAM tiers from 12GB to DGX Spark, 27B vs Flash-Next, quantization, prefill bottlenecks, harness wiring, tool-call failures, and a stay-on-API checklist."
pubDate: 2026-10-12T10:40:00+08:00
author: "Remy"
tags: ["llm", "open-source", "claude-code", "ai-coding", "agent-harness"]
lang: "en"
---

Last month a user on r/LocalLLM asked bluntly: they had just bought a 16GB RTX 5080, were auditing subscriptions, and wanted to know whether any local model could replace Claude Code so they could cancel Claude Pro.[1] Two details matter. They mostly use Claude as a "rubber duck that talks back" for ideas and implementation approaches, letting it do only grunt work like CMake scaffolding. And they won't buy a 90-class GPU for this.

Since Qwen3.8, the question deserves a real answer. The Qwen3.8-27B model card lists 61.7 on SWE-bench Pro, evaluated with the Claude Code harness; the same table shows Opus 4.6 Max at its officially reported 53.4.[2] Qwen3.8-Flash-Next followed—a MoE with 125B total and 6B active parameters—and forum users soon ran it on 12GB and 16GB cards.[3][4] But "close on a leaderboard" is not "replaces my daily coding agent": does it fit, how much context, how long you wait after each tool call, whether tool calls quietly break, which harness features stop working.

This post combines model cards, integration docs, a few careful GitHub benchmark reports, and three weeks of forum measurements, tier by tier, ending with a decision table and a "when to stay on the API" checklist. Related posts: [The Agent Harness Pattern](/blog/inside-claude-code-agent-harness/) covers Claude Code's main loop; this post is about swapping the model under it. [Pi 1.0](/blog/pi-1-0-codemode-mcp-minimal-harness/) is the kind of lean harness mentioned below. Subscription metering is in [Claude Code Usage Limits in 2026](/blog/claude-code-usage-limits-cost-2026/); cheap pay-per-token cloud models are in [the DeepSeek Flash cost model](/blog/deepseek-v4-1-flash-cheap-model-economics/); self-hosting thresholds for open-weight flagships are in [Mistral Large 4 vs. 2026 Open-Weight Flagships](/blog/mistral-large-4-open-weight-flagships-2026-survey/).

On evidence: model-card scores are vendor self-reports; forum posts (labeled "poster's claim" or similar) come from varied hardware, builds, and quants and are order-of-magnitude references; "my estimate" is my own arithmetic from published parameters.

## Bottom line first: which part are you replacing?

"Replacing Claude Code" covers three very different workloads:

| Workload | Needs | Can local cover it? |
| --- | --- | --- |
| Discussing approaches, reading code, small scaffolding (the poster's use) | 16K–64K context; a dozen seconds per turn is fine | Mostly yes: 4-bit 27B on a 16GB card |
| One agent, long session: read repo, edit, run tests, resend context repeatedly | 64K–128K+ context, short wait after each tool call, rock-solid tool-call format | Comfortable at 24–32GB+; 16GB needs MoE offload and lots of tuning |
| Parallel agents, subagent fan-out, long unattended runs | Concurrency, prefix caching, fast long-context prefill | Not on one consumer card; needs a 96GB-class card, DGX Spark, or multiple GPUs |

In one line: **the first can be replaced today; the second mostly, at 24GB+ with the right configuration; the third should stay on the API, or become a hybrid where the cloud plans and local executes.**

## Two models: dense 27B and Flash-Next MoE are different animals

**Qwen3.8-27B** is dense: all 27B parameters work on every token. Its 64 layers repeat "3 Gated DeltaNet (linear attention) + 1 gated attention" 16 times; native context is 262,144, extensible to 1M; thinking is on by default with `reasoning_effort` at `xhigh`; the license is Apache 2.0.[2] Card scores: Terminal Bench 2.1 73.0 (Opus 4.6 Max: 78.2), SWE-bench Pro 61.7, DeepSWE 1.1 42.2.[2]

**Qwen3.8-Flash-Next** is, per Qwen, an experimental preview of the Qwen4 architecture: 125B total, 6B active, plus a 51B n-gram embedding table and a 4B MTP (multi-token prediction) head. Attention becomes Gated DeltaNet plus Qwen Sparse Attention; 512 experts, 10 routed plus 1 shared active per token.[3] Its license is `qwen-community-1.0`, not Apache. It scores a notch higher: DeepSWE 1.1 58.7 vs 42.2, Toolathlon (real-world tool use) 73.5 vs 67.1, SWE-bench Pro 62.5 vs 61.7.[3]

Two caveats. Those scores used the Claude Code harness at 256K context and temperature 1.0;[2] on a 16GB card you typically run a 4-bit quant at 64K. And the models use hardware differently. A dense model reads all weights per token, so speed tracks VRAM bandwidth and weights must live in VRAM. A MoE touches a few experts per token, so cold experts can sit in RAM or even on SSD. In lukaLLM's controlled test, Flash-Next's 51B-parameter n-gram table decoded at 108.5 tok/s in system RAM but 1.95 tok/s in VRAM—55.6× slower—because it is row lookups, not matrix multiplies, and by the author's explanation decode pays an extra CPU↔GPU round trip per step when it's on the GPU.[5] So "small VRAM means small models" fails for Flash-Next; system RAM matters more.

Fine-tunes abound: ThinkingCap and Swift are popular, and one poster warned ThinkingCap's license changed for 3.8;[6] there's also Qwen3.8-27B-pi, "effort-ordered reasoning for agentic coding" (I saw only the title).[7] Check the license, then test in your own harness.

## By VRAM tier: what each tier actually runs like

### The 27B budget: weights plus KV cache

Unsloth's GGUF sizes give the arithmetic: Q4_K_M 15.33 GiB, IQ4_XS 13.27, Q3_K_XL 12.24, Q5_K_M 18.41, Q6_K 20.47, Q8_0 27.05; the vision mmproj adds about 0.86 GiB.[8]

KV cache from the card's structure (my estimate): only the 16 gated-attention layers hold KV, each with 4 KV heads of dimension 256, so f16 costs about 64 KiB per token—about 8 GiB at 128K; q8_0 is about 4.25 GiB, or 2.1 GiB at 64K. DeltaNet layers keep fixed-size state. That makes 27B lighter at long context than a classic dense model, but 16GB is still tight: Q4_K_M weights alone are 15.33 GiB.

Forum measurements match:

- **16GB**: IQ4_XS, 65K context, q8 KV, MTP off, vision on CPU: about 30 tok/s, which the poster calls "acceptable" but "the bare minimum for harness stuff," while wondering if Q3 is safe.[9] A 5070 Ti with 64GB RAM gets 33–40 tok/s with Q4 at 65K and can't pass 40 in llama.cpp or LM Studio.[10]
- **24GB (two 3060s)**: Q4_K_M at 50K decodes 43–50 tok/s; the main problem is "short context (too short for long agentic session)."[11]
- **48GB (5090 + 4070 Ti Super)**: INT8, 262K, FP8 KV on vLLM. Prefill falls from 2,922 tok/s at 2K to 1,596 at 260K; time to first token rises from 0.7 s to 163 s. Follow-ups hit the prefix cache: 1.3 s at 260K.[12]
- **96GB (RTX PRO 6000)**: FP8 on vLLM, shared by several developers running coding agents: 2B tokens in week one, 60–88 tok/s per user, 38.6% peak KV usage, no wall found yet.[13]
- Extreme case: an overclocked 40GB CMP 170HX mining card running 27B at 132K (W4A16, FP8 KV) at a claimed 225 t/s.[14] One overclocked report: a ceiling, not a baseline.

### The Flash-Next budget: the GPU buys speed, RAM decides whether it runs

lukaLLM capped usable VRAM in software on a 96GB RTX PRO 6000 (llama.cpp, UD-IQ4_XS, 87.2 GiB file, 91 GiB usable RAM):[5]

| Usable VRAM | Expert layers in RAM | Prefill @2K | Decode @2K | Long-context decode |
| --- | --- | --- | --- | --- |
| None | all | 183 | 8.3 | — |
| 8 GiB | 48/48 | 232 | 35.7 | 16K max |
| 16 GiB | 45/48 | 249 | 37.9 | 20.6 @ 123K |
| 24 GiB | 42/48 | 260 | 39.0 | 14.9 @ 245K |
| 32 GiB | 36/48 | 292 | 42.2 | 15.4 @ 245K |
| 48 GiB | 23/48 | 747 | 51.7 | 17.0 @ 245K |
| 96 GiB | 0/48 | 1,955 | 109.1 | 21.6 @ 245K |

The author notes that capping VRAM reproduces capacity, not bandwidth, so the 24GB row overstates a real 3090.[5] Still, from 8GB to 32GB decode only rises from 35.7 to 42.2 and prefill barely moves; the jump comes once most experts fit in VRAM. In his words, your GPU buys reading speed; your RAM decides whether the model runs at all. Capping RAM at 64GB to emulate "4090 plus 64GB RAM" gave about 34 tok/s.[5]

Single-machine reports:

- **16GB (4080 + 64GB RAM)**: AtomicChat's AD-4.27bpw Q4_K_M plus Unsloth's shared MTP head on a self-built llama.cpp MTP branch, 131K context, q8 KV: 16.5 tok/s decode, 350 tok/s prefill. It keeps 50–55 GB resident; 64GB is the floor.[15][16]
- **12GB (5070 Ti laptop + 64GB RAM)**: the single-model Strata engine with ISTA-DASLab's IQ3_XXS hits 51 t/s at 43K context versus 23 t/s for the same quant on stock llama.cpp, using 11GB VRAM and 56GB RAM including the OS; it only accepts a few ISTA-DASLab GGUFs.[4] The project lists 12GB+ VRAM and 32GB+ RAM as requirements.[17]
- **16GB + 32GB RAM + SSD**: InferredThoughts keeps most of a 119 GiB NVFP4 model on SSD and reads experts on demand: 9–10 tok/s decode, but 49.2 tok/s prefill on a 5.5K prompt; tool calls are "still buggy," and v1 supports only RTX 50-series and greedy decoding.[18]

### Apple Silicon and other unified-memory machines

Macs have lots of memory, but software is often tuned only for newer chips. One user ported the M3+-only Splash engine to a 64GB 2021 M1 Max: 4-bit 27B averaged 39 tok/s on short prompts, but a real opencode session (context 30K→89K, 25 requests, 43 minutes) decoded at 19–36 tok/s. Separately, a 32K prompt took 290 s to first token. The poster estimates about half the wall time went to waiting for the first token after each tool call, despite 95% of prompt tokens hitting the prefix cache.[19] Simon Willison runs the 17GB Q4_K_M in LM Studio on a 128GB M5 Max.[20]

For Flash-Next, MoEspresso reaches 12–15 tok/s on a 32GB M1 Max via IQ2_K and a bias toward experts already in memory—if no browser is eating RAM; some commenters saw lower speeds and the author is investigating.[21] A 256GB M5 Ultra prefills at about 4,200 tok/s, roughly linear (200K in 47.1 s), and decodes at 59–74 tok/s.[22]

AMD Strix Halo is another route: at 160K, the community fork Gufo runs Flash-Next at 1,227 tok/s prefill and 22 decode; mainline llama.cpp manages 113 and 7.[23] Same machine, other engine, tenfold prefill gap—a recurring pattern.

### DGX Spark

NVIDIA's spec: GB10, 128GB LPDDR5x unified memory at 273 GB/s, up to 1 PFLOP FP4, inference on models up to 200B parameters.[24] MiaAI-Lab's single-box TensorFold recipe serves Flash-Next with a 262K window and FP8 KV: 64.4 tok/s for one request with 98 ms to first token, about 2,500–2,600 tok/s prefill at 4K–32K, about 200 tok/s aggregate at 8 concurrent requests.[25] But its checkpoint cuts experts per token from 10 to 5, which the authors say costs about 10% general capability on their harness (46.6–47.6 vs 51.8), tool use unchanged.[25] One forum user had Flash-Next write a tool for their harness on a DGX Spark (title only);[26] that "local model builds tooling for the local harness" loop suits an always-on, big-memory box.

## Quantization and KV cache: where the savings come from and what they cost

Lessons several reports corroborate:

1. **Start at Q4; verify Q3 and below yourself.** dtm says his Q4_K_M beats IQ4_XS on speed and quality, with KL divergence 0.0842 and 89.5% same-top-1 vs BF16 (his own test).[16] lukaLLM says he measured speed only, never quant quality.[5] 3-bit claims vary more: a post relays ISTA-DASLab's claim that its IQ3_S "recovers full model's performance on coding benchmarks"—second-hand.[4]
2. **q8_0 KV is mostly safe; don't drop V alone to q4_0.** dtm's q8_0/q8_0 KV is about 3.2 GB at 131K; V at q4_0 has no matching FlashAttention kernel, so K/V get converted to f16 every decode step.[16] llama.cpp defaults both cache types to f16.[27]
3. **NVFP4 is a Blackwell bonus.** The SSD-streaming engine runs FP4×FP4 on tensor cores without unpacking and currently supports only RTX 50-series.[18] DGX Spark's 1 PFLOP is also an FP4 figure.[24]
4. **Cutting experts is compression too.** The 5-expert checkpoint traded about a tenth of general capability for speed.[25]
5. **MTP depends on where experts live.** lukaLLM measured 1.61× only with every expert on the GPU, and a 0.29–0.38× loss with any offload.[5] Yet dtm—changing quant, adding MTP, and keeping the draft's experts in RAM via `--spec-draft-cpu-moe`—went from about 10 to 16.5 tok/s on 16GB; a fully-GPU draft was slower (15.4 vs 16.5).[16] Not a contradiction: it depends on build and draft placement, so measure yourself. dtm's rule: below 0.30 draft acceptance, turn MTP off.[16]
6. **A mis-sized prefix cache fails silently.** `--cache-ram` must exceed the session's prompt state, or every request skips the cache with one log line; sized correctly, per-turn reprompts fell from 150 s to about 12 s.[16]

## Context and throughput: agents are slow at reading, not writing

Chat lives on decode speed; coding agents don't. Each tool call resends prompt, repo context, and history, so you feel prefill speed and cache hits. The M1 Max session spent half its time waiting for first tokens;[19] the 48GB box waits 163 s cold at 260K;[12] the SSD setup prefills at 49.2 tok/s, so a cold 30K context takes about 10 minutes (my arithmetic: 30,000 ÷ 49.2 ≈ 610 s).[18] One user even asked people to share cold-prefill numbers after harness compaction at 128K, because almost nobody reports them.[28]

Reasoning effort is the other trap. Qwen3.8 defaults to `xhigh`. Simon Willison's first 27B run in LM Studio hit its default 8,192-token context limit—thinking used it all. At the full 262,144, a drawing task took 22,276 reasoning tokens and 21 minutes; with reasoning off, 137 seconds. He advises starting at low or none.[20] The opposite cost is real: the model card warns that lower effort in multi-turn agent tasks doesn't always cut total time, since shallow analysis brings failures and retries.[2] In another Simon experiment, 27B without reasoning got 23.57% of large-number additions right; with medium reasoning, 167 of 169.[29] On the M5 Ultra, the model once spent its whole 8K budget on hidden reasoning with no visible output, answering only on a 16K retry.[22]

A counterintuitive field report: on dual 5090s, 27B fixed a set of bugs in 5–10 minutes; Flash-Next took 2.5 hours, running tests for two hours after its last edit.[30] One case proves nothing about model quality, but wrong effort and stop settings can make a higher-scoring model ten times slower end to end.

## Wiring into harnesses: Claude Code, Codex, OpenCode

The four common engines expose different interfaces:

| Runtime | Interface | Defaults to watch |
| --- | --- | --- |
| llama.cpp `llama-server` | OpenAI-compatible plus Anthropic-compatible `/v1/messages`; tools need `--jinja` | No strong claim of full Anthropic compatibility; unknown templates fall back to a generic tool format that costs more tokens[27][31] |
| LM Studio | `/v1/messages` for Claude Code, `/v1/responses` for Codex, port 1234 | Recommends more than ~25K context[32][33] |
| Ollama | Anthropic-compatible; `ollama launch claude` | Default context is 4K under 24 GiB VRAM; coding tools need at least 64K[34][35] |
| vLLM / SGLang | OpenAI-compatible with prefix caching | The card recommends them for production[2]; see the shared-card example[13] |

**Claude Code** points `ANTHROPIC_BASE_URL` at the local server with a placeholder `ANTHROPIC_AUTH_TOKEN`; Ollama and LM Studio document the variables.[34][32] Three caveats. Anthropic states it doesn't support routing Claude Code to non-Claude models through any gateway,[36] so you debug alone. For an unrecognized model ID, Claude Code assumes a 200K window,[37] so it won't compact until near 200K while your server may reject requests at 64K; set `CLAUDE_CODE_MAX_CONTEXT_TOKENS` to the real window.[38] And it sends current-Claude fields like adaptive thinking and effort to unknown IDs; it retries without effort if rejected,[37] but other fields depend on your server.

**Codex** has `--oss`: `oss_provider` picks Ollama or LM Studio; if unset, the interactive CLI asks and `codex exec` errors.[39] LM Studio serves it over `/v1/responses`; `codex --oss -m <model>` picks a model.[33] For llama.cpp or vLLM, add a `model_providers` entry with a `base_url`.[39]

**OpenCode** and similar harnesses use `@ai-sdk/openai-compatible` for a local provider; put the real window in `limit.context`. The docs add: if tool calls fail, raise Ollama's `num_ctx` to 16K–32K first.[40] Help requests are common—say, Ollama not connecting to the Roo extension in VS Code;[41] I'd check context length and endpoint URL first.

## How tool calls break: seven common failures

1. **Silent truncation.** Ollama defaults to 4K on small cards, LM Studio to 8,192;[35][20] system prompt plus tool definitions fill it, the model can't see tool descriptions, and calls go wrong or never happen.
2. **Template/parser mismatch.** Unrecognized templates fall back to a generic format in llama.cpp,[31] and reasoning or tool calls can bleed into content; without `--jinja`, no tool calls at all.[27]
3. **Great speed, zero code.** Three of lukaLLM's early runs posted 158, 98 and 105 tok/s while the model emitted only tool-call syntax and wrote no code.[5] His harness now flags tool calls with no executor, stub answers, and truncated turns.
4. **Mangled argument types.** TensorFold ships `toolcheck.py` to check that an array argument comes back as a JSON array.[25] Every local server deserves one.
5. **Reasoning eats the budget.** At xhigh, reasoning dwarfs the answer;[20] tight budgets yield all thinking, no answer.[22]
6. **Young engines and branch builds.** The 16GB recipe's MTP patch isn't in llama.cpp master;[16] the SSD engine's tool calls are buggy;[18] one post cites GLM 5.3 Flash still lacking llama.cpp mainline support a month after release, pushing users to forks.[42]
7. **Harness and server disagree on the window.** The 200K assumption above;[37] it shows up as sudden errors or lost context mid-session.

## Cost: when local pays off

One rare same-task comparison: a one-line prompt (five physics scenes on one page) run three ways by a team using their own Atomic Agent product.[43]

| Setup | Cost | Time | Scenes right |
| --- | --- | --- | --- |
| Sonnet 5.5 only (cloud) | $1.83 | 9 min | 4/5 |
| Sonnet plans, local Qwen 3.8 27B codes | $0.67 | 85 min | 2/5 |
| Local 27B only (one 3090, Q4) | $0 | 26 min | 1/5 |

Reversed—Qwen plans, Sonnet codes—it got 4/5 in 14 minutes but cost more than Sonnet alone, since every cloud worker re-read the context.[43] One task, one team, but a typical shape: local saves money and pays in time and some quality.

Usage itself also changes. The RTX PRO 6000 poster saw that without per-token billing, people stop trimming context and stop killing runs early; two users burned about 950M and 900M tokens in a week.[13] Local compute is a fixed cost: worth it when kept busy, rarely at a few days a month. Hardware prices exist only as forum quotes: a 128GB Strix Halo at $3,149, about $5,000 with an R9700;[44] two 64GB CMP 170HX cards at roughly $6,000–7,000 in Europe.[45]

A billing rule for hybrids: when Claude Code uses a gateway credential, requests drop the subscription login and its limits; if the gateway forwards to a paid upstream, the credential owner pays per token.[36] For "hard tasks on the subscription, easy ones local," keep two separate configurations rather than mixing them.

Longer replacement reports exist. One user on a 128GB M1 Ultra replaced Claude for four or five days with opencode and "Qwen 3.8 Next" (their name—presumably Flash-Next), mostly for research and business tasks, and "don't feel like I'm missing much," though it's slower and multi-agent work may go back to the cloud.[46] Another went 35B → Flash-Next → 35B inside their own small apps (the app is the harness), concluding that in a small domain with restricted tools, a smaller model with the right harness is just as capable.[47] There are also titles like "Qwen-3.8-27B is good enough that I stopped using API" (body not retrieved).[48]

## Decision table and checklist

| Your situation | Recommendation |
| --- | --- |
| 16GB GPU, mainly discussion and small code | 27B IQ4_XS, q8 KV, 32K–64K, reasoning low/medium; downgrade the subscription, don't cancel yet |
| 12GB GPU | 27B only at IQ3_XXS (10.18 GiB) with very short context; with 64GB RAM, Flash-Next on a dedicated engine is more practical |
| 16GB GPU with 64GB+ RAM, long single-agent sessions | Flash-Next with expert offload (llama.cpp branch or Strata); accept 15–50 tok/s and slow cold prefill |
| Single 24–32GB card | 27B Q4_K_M with q8 KV; by my estimate 128K fits (Q5 needs less); my take: the least fussy setup today |
| 48GB+, 96GB card, DGX Spark, big-memory Mac | Seriously consider replacing the daily agent; vLLM/SGLang or a dedicated engine with prefix caching |
| Parallel agents, long unattended runs, high correctness bar | Stay on the API, or cloud plans and local executes; measure cost per task |

Before and after switching:

1. Name which of the three workloads you have; don't decide by leaderboard.
2. Budget VRAM as weights + KV + vision + headroom; for MoE, budget RAM too.
3. Make the server's context and the harness's window (Claude Code `CLAUDE_CODE_MAX_CONTEXT_TOKENS`, OpenCode `limit.context`) the same number.
4. Check Ollama/LM Studio default context; use 64K+ before attaching a coding agent.
5. In llama.cpp, enable `--jinja` and check whether the log says chat format "Generic."
6. Self-test tool calls: array arguments, multiple tools, long outputs.
7. Benchmark cold prefill and time to first token, not just decode—and confirm the output contains code.
8. Start reasoning at low/medium; compare total task time, not per-turn time.
9. Log MTP draft acceptance; below 0.30, turn it off.
10. Below 4-bit, regression-test on real tasks from your own repo.
11. Keep a cloud exit for multi-file refactors, unfamiliar codebases, and parallel subtasks.

## Conclusion

For the 16GB poster, local already covers the use case: 4-bit 27B with 32K–64K context, so downgrade the subscription and watch for a month. The hard part is long sessions, multi-agent work, and unattended runs, where the bottleneck isn't model scores but prefill speed, context length, and tool-call stability—all tied to hardware, engine, and harness. Flash-Next-style architectures that park experts in RAM move the barrier from VRAM to system memory, this year's biggest change for local coding agents, but lean harder on the engine: the same machine can differ tenfold by engine. So before asking which model is strongest, ask: on my machine, for my tasks, how long is the cold start, and how often do tool calls fail?

## References

1. r/LocalLLM, u/Crastinating_Pro, *Are there any models that I can use with a 16GB GPU that might be able to replace claude code?* (forum post): <https://www.reddit.com/r/LocalLLM/comments/1woikg7/are_there_any_models_that_i_can_use_with_a_16gb/>
2. Qwen, Qwen3.8-27B model card (Hugging Face): <https://huggingface.co/Qwen/Qwen3.8-27B>
3. Qwen, Qwen3.8-Flash-Next model card (Hugging Face): <https://huggingface.co/Qwen/Qwen3.8-Flash-Next>
4. r/LocalLLaMA, u/MLDataScientist, *Qwen3.8 flash next ISTA-DASLab GGUF 50t/s TG and 1500t/s PP with 12GB VRAM and 64GB RAM Laptop on 'Strata' engine* (forum post): <https://www.reddit.com/r/LocalLLaMA/comments/1wtv43r/qwen38_flash_next_istadaslab_gguf_50ts_tg_and/>
5. lukaLLM, Qwen3.8-Flash-Next-VRAM-Benchmark, README (tier and engine comparison on an RTX PRO 6000): <https://github.com/lukaLLM/Qwen3.8-Flash-Next-VRAM-Benchmark>
6. r/LocalLLM, u/newtonapple, *ThinkingCap Qwen3.8-27B has been released* (forum post): <https://www.reddit.com/r/LocalLLM/comments/1wolg9w/thinkingcap_qwen3827b_has_been_released/>
7. r/LocalLLaMA, u/paf1138, *Qwen3.8-27B-pi: Effort-Ordered Reasoning for Agentic Coding* (forum post, title only): <https://www.reddit.com/r/LocalLLaMA/comments/1wufzrh/qwen3827bpi_effortordered_reasoning_for_agentic/>
8. Unsloth, Qwen3.8-27B-GGUF file listing (Hugging Face): <https://huggingface.co/unsloth/Qwen3.8-27B-GGUF>
9. r/LocalLLaMA, u/Adventurous-Gold6413, *Which of the 16gb VRAM qwen3.8 27b's is the best?* (forum post): <https://www.reddit.com/r/LocalLLaMA/comments/1wrgk8z/which_of_the_16gb_vram_qwen38_27bs_is_the_best/>
10. r/LocalLLM, u/Tight_Commercial7, *5070 ti + 64 ram Qwen 3.8 27b* (forum post): <https://www.reddit.com/r/LocalLLM/comments/1woatkk/5070_ti_64_ram_qwen_38_27b/>
11. r/LocalLLaMA, u/jacek2023, *Qwen3.8-27B Q4_K_M on 2x3060* (forum post): <https://www.reddit.com/r/LocalLLaMA/comments/1wqjr3f/qwen3827b_q4_k_m_on_2x3060/>
12. r/LocalLLaMA, u/Fz1zz, *Qwen3.8-27B FP8 dual GPUs* (forum post): <https://www.reddit.com/r/LocalLLaMA/comments/1wrhmdn/qwen3827b_fp8_dual_gpus/>
13. r/LocalLLM, u/vera_dev, *Qwen 3.8 27B FP8 on one RTX PRO 6000: 2B tokens of shared coding-agent traffic* (forum post): <https://www.reddit.com/r/LocalLLM/comments/1wo5552/qwen_38_27b_fp8_on_one_rtx_pro_6000_2b_tokens_of/>
14. r/LocalLLM, u/Feralzi, *Qwen 3.8 27B reaching 225 t/s on 132k context on CMP 170HX* (forum post): <https://www.reddit.com/r/LocalLLM/comments/1wojbs4/qwen_38_27b_reaching_225_ts_on_132k_context_on/>
15. r/LocalLLaMA, u/AvidCyclist250, *Qwen 3.8 Flash Next q4_k_m, 130k context, q8 cache on 16GB VRAM and 64GB RAM, 15-20 t/s on 4080* (forum post): <https://www.reddit.com/r/LocalLLaMA/comments/1wom3fe/qwen_38_flash_next_q4_k_m_130k_context_q8_cache/>
16. dtm-beep, qwen38-flash-next-mtp-16gb, README: <https://github.com/dtm-beep/qwen38-flash-next-mtp-16gb>
17. Niko1221, Strata, README: <https://github.com/Niko1221/Strata>
18. r/LocalLLaMA, u/TypicalPudding6190, *Qwen3.8-Flash-Next 177B NVFP4(119GiB): SSD streaming at 9-10 tok/s on one 16 GB RTX 5060 Ti + 32 GB RAM* (forum post): <https://www.reddit.com/r/LocalLLaMA/comments/1wrxap8/qwen38flashnext_177b_nvfp4119gib_ssd_streaming_at/>
19. r/LocalLLM, u/Erp4759, *You can now run Qwen3.8-27B on a 2021 M1 Max at 39 tok/s* (forum post): <https://www.reddit.com/r/LocalLLM/comments/1woq7cd/you_can_now_run_qwen3827b_on_a_2021_m1_max_at_39/>
20. Simon Willison, *Qwen 3.8 27B is excellent, but it defaults to wildly overthinking things*: <https://simonwillison.net/2026/Aug/16/qwen-38-27b/>
21. r/LocalLLaMA, u/marcobaldo, *Qwen3.8-Flash-Next (125B) at 12-15 tok/s on a 2021 32GB M1 Max* (forum post): <https://www.reddit.com/r/LocalLLaMA/comments/1wrqql8/qwen38flashnext_125b_at_1215_toks_on_a_2021_32gb/>
22. r/LocalLLaMA, u/nonlinearsystems, *M5 Ultra - Qwen3.8 Flash Next vs Laguna S 2.1* (forum post): <https://www.reddit.com/r/LocalLLaMA/comments/1wugx2e/m5_ultra_qwen38_flash_next_vs_laguna_s_21/>
23. r/LocalLLaMA, u/fallingdowndizzyvr, *What runs Qwen 3.8 Flash Next faster? Strix Halo or a Pile of GPUs* (forum post): <https://www.reddit.com/r/LocalLLaMA/comments/1wufk3y/what_runs_qwen_38_flash_next_faster_strix_halo_or/>
24. NVIDIA, DGX Spark product page and specifications: <https://www.nvidia.com/en-us/products/workstations/dgx-spark/>
25. MiaAI-Lab, Qwen3.8-Flash-Next-Single-DGX-Spark-TensorFold, README: <https://github.com/MiaAI-Lab/Qwen3.8-Flash-Next-Single-DGX-Spark-TensorFold>
26. r/LocalLLM, *I let Qwen3.8-Flash-Next write all of code for a tool that i plan to use in my harness on a DGX Spark* (forum post, title only): <https://www.reddit.com/r/LocalLLM/comments/1wnwmkm/i_let_qwen38flashnext_write_all_of_code_for_a/>
27. ggml-org/llama.cpp, llama-server README: <https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md>
28. r/LocalLLaMA, u/Express_Quail_1493, *Qwen3.8FlashNext Please Share Cold prefill at compaction 128k* (forum post): <https://www.reddit.com/r/LocalLLaMA/comments/1wrul9r/qwen38flashnext_please_share_cold_prefill_at/>
29. Simon Willison, *Qwen3.8 27B addition in words*: <https://simonwillison.net/2026/Oct/4/qwen38-addition-in-words/>
30. r/LocalLLaMA, u/poofph, *Qwen 3.8 27B vs Qwen 3.8 Flash Next and time to complete a coding task.* (forum post): <https://www.reddit.com/r/LocalLLaMA/comments/1wrs2ii/qwen_38_27b_vs_qwen_38_flash_next_and_time_to/>
31. ggml-org/llama.cpp, Function Calling docs: <https://github.com/ggml-org/llama.cpp/blob/master/docs/function-calling.md>
32. LM Studio docs, Claude Code integration: <https://lmstudio.ai/docs/integrations/claude-code>
33. LM Studio docs, Codex integration: <https://lmstudio.ai/docs/integrations/codex>
34. Ollama docs, Claude Code integration: <https://docs.ollama.com/integrations/claude-code>
35. Ollama docs, Context length: <https://docs.ollama.com/context-length>
36. Claude Code docs, Other LLM gateways: <https://code.claude.com/docs/en/llm-gateway>
37. Claude Code docs, Gateway compatibility guide: <https://code.claude.com/docs/en/llm-gateway-protocol>
38. Claude Code docs, Model configuration (Correct the window for a gateway or custom model ID): <https://code.claude.com/docs/en/model-config>
39. OpenAI Codex docs, Advanced configuration (OSS mode, model providers): <https://developers.openai.com/codex/config-advanced>
40. OpenCode docs, Providers: <https://opencode.ai/docs/providers/>
41. r/LocalLLM, u/papayax999, *Having trouble getting ollama to connect with my roo on visual code* (forum post): <https://www.reddit.com/r/LocalLLM/comments/1wosld4/having_trouble_getting_ollama_to_connect_with_my/>
42. r/LocalLLaMA, u/silenceimpaired, *Llama.cpp and new model releases ...or why Great is the enemy of Good in the LLM world* (forum post): <https://www.reddit.com/r/LocalLLaMA/comments/1wrj2r5/llamacpp_and_new_model_releases_or_why_great_is/>
43. r/ClaudeAI, u/GapNew4766, *Sonnet 5.5 orchestrated a local Qwen 3.8 27B!* (forum post; the author's team builds Atomic Agent): <https://www.reddit.com/r/ClaudeAI/comments/1wswkeq/sonnet_55_orchestrated_a_local_qwen_38_27b/>
44. r/LocalLLaMA, u/darklordfireape, *Update: Strix Halo + R9700 with llama-halo-hybrid - now beats DGX Spark* (forum post): <https://www.reddit.com/r/LocalLLaMA/comments/1wuet5g/update_strix_halo_r9700_with_llamahalohybrid_now/>
45. r/LocalLLaMA, u/eribob, *Worth going from Qwen3.8 27B to flash next or maaybe deepseek v4 flash?* (forum post): <https://www.reddit.com/r/LocalLLaMA/comments/1wrkle9/worth_going_from_qwen38_27b_to_flash_next_or/>
46. r/LocalLLaMA, u/AdInternational5848, *4-5 days replacing Claude w Qwen 3.8 Next* (forum post): <https://www.reddit.com/r/LocalLLaMA/comments/1wq7e74/45_days_replacing_claude_w_qwen_38_next/>
47. r/LocalLLM, u/eightone-81, *Full circle from 35b to flash next and back to 35* (forum post): <https://www.reddit.com/r/LocalLLM/comments/1wou38l/full_circle_from_35b_to_flash_next_and_back_to_35/>
48. r/LocalLLaMA, *Qwen-3.8-27B is good enough that I stopped using API* (forum post, title only): <https://www.reddit.com/r/LocalLLaMA/comments/1wp0z3i/qwen3827b_is_good_enough_that_i_stopped_using_api/>

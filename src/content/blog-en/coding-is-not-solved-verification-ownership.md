---
title: "Coding Is Not Solved: Generation Got Cheap; Verification and Ownership Did Not"
description: "Reading Alex Ewerlöf's Coding is NOT solved: creation got cheaper, but NFRs, functional correctness, and verification ownership did not. Harness, Skills, AGENTS.md, and MCP wrap shortcomings—they do not erase who owns the delivery."
pubDate: 2026-09-29T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "agent-loop", "developer-tools"]
lang: "en"
---

The slogan “coding is solved” is loud again: models write and edit, agent-loops feed compiler errors and failing tests back for another pass, and some narratives shrink engineering to “taste” or “just write the prompt.” Alex Ewerlöf’s essay [Coding is NOT solved](https://blog.alexewerlof.com/p/coding-is-not-solved) (2026-09-26) argues the opposite. He says he is not anti-AI—he was an early adopter of LLM coding tools, built his own harness, taught the topics, and shipped LLM-powered products. What he wants to challenge is the half-baked claim that coding is finished and engineering is only about taste. He also warns against the straw-man fallacy: one argument that does not map to your beliefs does not invalidate the rest.[1]

After the piece hit Hacker News, he updated the essay: as of **2026-09-29** it had about **473** points and **476** comments with overwhelmingly positive feedback—unusual for that community, in his reading—which he takes as a signal of where many people sit on this side of the argument, not as proof by applause.[1] This post plugs that critique into the site’s harness / verification / cost line: cheaper generation is not finished software; **verification and ownership** remain the expensive half. On explore-and-exploit terms, this is a long-horizon mechanism essay on the verification/ownership thread—not soft news chasing a hot thread.

## Creation got cheap; NFRs still dominate cost

Ewerlöf’s first cut is blunt: people who say “LLMs write decent code” often have not finished the production bill. **Creation** is much cheaper; anyone who has run software at scale knows that **maintenance, reliability, security, scalability**, and the rest of the non-functional requirements (NFRs) are the majority of the cost. He has a separate NFR note; here we only need the coding-agent implication: compressing generation cost does not automatically fund operability and accountability.[1]

That complements our [control the harness to control cost](/blog/control-the-harness-control-the-cost/) post. That piece is about which rate tier you buy, cache boundaries, and which model a subagent inherits. This one adds: a pretty token bill can still ship **surface-functional code with NFR debt**. Coding agents made “something that compiles” cheap; they did not make “observable, rollbackable, fixable on-call” cheap.

A practical split for readers: keep two ledgers—“generation” and “software done.” The first can be pressed down by models, caches, agent-loops, even Skills. The second still needs humans reading diffs, writing contracts, running real load, and carrying the pager. If executives measure token usage as a productivity proxy, Ewerlöf is unsparing—that is a vanity metric, not a service level; the same mindset will not think twice before throwing a career under the bus when things break.[1]

Our [three cost-wasting habits](/blog/coding-agents-cost-inefficient-behaviors/) fills the trajectory layer: tasks that already pass still burn money on subsumed retrieval, near-duplicate scripts, and retests without a new patch—that is “passed but still expensive.” Ewerlöf’s NFR cut is the other face: if “passed” only means FR / UAT, NFR debt shows up in production. Do not collapse both wastes into one KPI.

## Even functional requirements are not solved

He goes further: **even functional requirements (what the code is supposed to do) are not a solved problem.** There is a Dunning–Kruger layer in the room—people who do not read the output are often more confident in it.[1]

Mechanically, he explains why coding agents *look* like they can write. Coding is about logic. Anyone who has fought a compiler knows machines do not care how right you feel: if it is logically wrong, it does not compile; even with clean syntax there are runtime errors. The reason LLMs appear successful at code is that we built a feedback loop that feeds **syntax and runtime errors back into the LLM** until most errors are fixed—or hidden. Natural-language tasks (social posts, reports, articles) can be winged; code exposes the same engine that struggles to count the R’s in “Raspberry” or suggests walking to the car wash.[1]

LLMs are stochastic and probabilistic. The only way we get remotely close to “logical” is to wrap them in traditional code—the **harness**—plus tests, chain-of-thought, and related tricks. **The core issue remains: logic and volume.** The larger the input and the more of the context window is used, the less accurate they get. He is not saying LLMs cannot generate or maintain codebases; they are useful tools and capabilities rise on an S-curve. There is also a point of diminishing returns where more expensive models are not more productive at the rate of the price increase.[1]

Read that next to two site posts. [Three cost-wasting habits](/blog/coding-agents-cost-inefficient-behaviors/) shows that a loop that *runs* is not a loop that *verifies*—idle retests can dress up as validation on the bill. [LLM Parkinsonism / GEC](/blog/llm-parkinsonism-gec-executive-control/) shows that after hard goals are met, loops can still persist at low value—without external stop and scope authority, agent-loops disguise progress as busyness. Ewerlöf’s FR claim sits upstream: when “what should it do” is still poorly understood, the feedback loop may only clear surface red lights.

He also lists patterns he associates with “LLM-generated software is good enough”: have not written code in ages; cannot spot figurative six-finger mistakes; hold a low bar for good; do not care about quality or NFRs; struggle with S-curves—or honestly admit AI writes better code than they do. Extrapolating that personal experience to an entire professional industry is, in his view, another matter; people who spend too much time with sycophantic AI are especially prone to that leap.[1]

## High risk tolerance versus production accountability

He lists four product shapes that **do not strictly require reading the code**:[1]

1. **Personal software** — itching an itch, automation, DIY patches  
2. **POC** — technical feasibility and product viability  
3. **Throwaway automation** — budget only covers validating results  
4. **Weaponized AI** — acknowledge the risk and deliberately point it at a target to cause harm  

The first three share **high risk tolerance**; the fourth weaponizes inherent risk—and he adds that given the blast radius of an internet-connected agent, even the last needs tight controls.[1]

Contrast the other side: most software that justifies hiring and paying engineers has **low** risk tolerance—healthcare, finance, automotive, defense, power plants, aviation, manufacturing—wherever a mistake can cost money, lives, or legal consequences, you need accountability.[1] The list is not a moral sermon; it is triage. The same Claude Code / Codex / home-grown agent-loop should not share acceptance criteria between a weekend script and a payment-clearing path.

The hinge sentence of the essay: **AI cannot be held accountable.** It cannot suffer consequences; the worst you can do is unplug it. It does not die, serve prison time, or pay fines—so it can never be truly accountable. You also cannot be responsible for what you cannot control; understanding system behavior and fixing it when the AI inevitably fails depends on human-side control and knowledge.[1]

He names Anthropic’s Boris Cherny among vocal “coding is solved” proponents and contrasts that ideology with public Claude Code failure modes and billing complaints listed in the essay (CLI oddities, an installer that deletes itself, over-charging narratives). Reminder: when a vendor controls the model, the harness, the prompt, and the runtime, consumers still pay for quality gaps. Leaders who force AI onto every surface create AI overuse that hurts customers—and then **people** are accountable, not the model.[1]

Our [OpenShell and in-silicon Sentry](/blog/nvidia-open-agent-safety-openshell-sentry/) post is about moving sandbox enforcement outside the harness trust domain—force out-of-band. Ewerlöf is about **ownership and accountability** that cannot be offloaded to the model. Keep the lines distinct: one is “who can hard-stop drift”; the other is “who owns the pager and who actually understands.” Having a sandbox is not having ownership.

## Harness, Skills, AGENTS.md, MCP: wraps help; they do not erase the core issue

Ewerlöf is explicit that he does **not** belittle how far we have come with harness, SKILLS, AGENTS.md, MCP, and the alphabet of A2A, ACP, RLM, OKF, MoE, MoA, self-healing, quantizations, runtimes, and memory techniques. Those are pragmatic workarounds for LLM shortcomings, and more will come; he has written about AI systems engineering patterns before. What he does not want is for services he depends on to degrade because someone pushed AI where it did not belong—or skipped the job of quality, security, reliability, and verification.[1]

Site mapping:

| Wrap layer | What we already wrote | What it still does not buy |
| --- | --- | --- |
| Harness routing and cost | [Control the harness](/blog/control-the-harness-control-the-cost/) | Does not mint NFR or incident response skill |
| Grow control into code | [Grow the harness](/blog/grow-the-harness-not-the-context/) | Cleaner context ≠ human understanding |
| Spec holds the pen | [SpecHarness](/blog/specharness-spec-holds-the-pen/) | Specs cannot exhaust real conflicts upfront |
| Trajectory waste | [Three habits](/blog/coding-agents-cost-inefficient-behaviors/) | Lower spend ≠ sufficient verification |
| Stop authority | [GEC / Parkinsonism](/blog/llm-parkinsonism-gec-executive-control/) | You can stop on the wrong understanding |
| Sandbox outside harness | [OpenShell / Sentry](/blog/nvidia-open-agent-safety-openshell-sentry/) | Isolation ≠ delivery ownership |

Several slogans he attacks sit outside those wraps:

- **“You can create a full spec upfront.”** Anyone with a few years in industry knows meaningful upfront specification is nearly impossible except for the trivial—alongside fairy tales about accurate estimates.[1]  
- **“English is the new programming language.”** Human language is vague and conflicting; that is why programming languages exist. Compilers and type checkers catch some conflicts. Tasking another LLM to audit instructions is possible, but the safest way to discover nuances is often to have the agent build what you asked—much more expensive than a linter.[1]  
- **“I move much faster; I barely write by hand.”** Do not confuse motion with progress. Do not measure with vanity metrics like SLOC, PR count, or feature count; measure service levels and consumer happiness. Call him when you can prove margin between token cost and business value.[1]  
- **“Next year I may not even read code.”** Humans are bad at S-curves; the timeline may be longer. Even if reading becomes unnecessary, you are confessing redundancy. Better to create payable value *on top of* AI than to replace yourself with it.[1]  
- **“Leverage has shifted to taste.”** From his frontend/UX years: everyone has taste; the market does not price “taste” the way wishful narratives suggest. AI lowered the bar for decent-looking software and raised the bar for *payable* effort.[1]  
- **“AI is an equalizer.”** He reframes it as a **multiplier**: it gives wings to both the careless and the careful. The difference is human involvement, iteration, and depth of knowledge feeding stronger feedback loops. Some tasks are still cheaper and faster by hand (his example: an agent took 12 minutes and 72 steps to bump five npm patch dependencies; he could do it in under a minute).[1]  
- **“Agent is the new compiler.”** He answers with irony: a stochastic engine plus a feedback loop is not a deterministic compiler.[1]

An old trick: run many agents in parallel until the volume of code makes human review impossible or too expensive, then merge on “trust”—the same pre-AI trick of making a PR so large nobody looks closely. Another is loop engineering: let agents prompt each other; big labs sometimes learn about rogue agents months after damage—do not assume you are more careful.[1] For teams running coding agents, that is not a joke file; it is a process failure mode where volume and loop count substitute for verification.

## Verification ownership: UAT green is not engineering done

There is a lazy social loop: we do not exactly trust AI, but reading the output is too hard, so we pretend to trust it; then claim that because **UAT (user-acceptance testing)** passes, the code is “good enough,” and ship the rest of the testing to real users and downstream services—“we’re just lab rats.”[1]

Ewerlöf frames ownership as three pillars:[1]

1. **Knowledge** — you know the product problem and the technical capabilities, limits, and how it works.  
2. **Mandate** — you need not chase permission for every decision; you have trust to decide.  
3. **Accountability** — when things go wrong, you are on-call—**if you ship it, you are accountable regardless of how it was produced**, so you had better understand it.

Remove any pillar and ownership is broken. LLMs generate fast; most software worth hiring an engineer for **requires understanding**, and understanding takes time. Slow is fast: take time to understand what you are building and how it works, and you save expensive incidents—and when they happen, you can fix them quickly. AI can explain to you; it cannot understand *for* you. **That understanding is a key aspect of ownership.**[1]

The industry split is worth recording. On one side: people who claim “software factories” and multi-agent setups that create apps from prompts. On the other: people unconvinced that LLM output is production-ready once you price priming (Skills, AGENTS.md, tools, verification), reviewing massive diffs, and reclaiming understanding when behavior goes wrong. Middle ground feels scarce. The pattern he sees: the less people know about a task’s complexity and edge cases, the more they trust AI output—an AI Dunning–Kruger effect. Managers used to delegate to engineers; now some delegate to AI. That only works to the extent the manager is technical enough to manage agents effectively. He cites Shopify CEO Toby Lutke: a year ago, push employees to use AI; days before the essay, coin “slop grenades” for the results. “Taking responsibility” for AI-generated code is not the model’s job. **You cannot be accountable for what you do not understand.**[1]

He also splits non-determinism across development and runtime. On the development side, a typical AI-assisted workflow sends LLM output through gates (error feedback, tool calls, memory, approval, user interaction). Blue and red edges are risks of misunderstanding or conflicting instructions—skill vs spec, natural-language vagueness. Humans read unstated intent better, push back to mutual understanding, and when wrong tend to be *consistently* wrong—unlike jagged intelligence that flips between success and failure. He jokes that he has “jagged trust”: nailing one case does not imply nailing every case.[1]

On the runtime side: given the same inputs (environment, time, data), ordinary code is deterministic (aside from deliberate randomness); AI components remain stochastic. Even a model that scores 100% on evals and is tightly bound by a harness still risks unreliable output. The diff may be small; it is inconsistent enough that you would not want that pilot flying an airliner (autopilot is a different closed control system).[1]

“Code is a side-effect of thinking and experimenting.” Good engineers chase WHY (what is the problem and why it is a problem) before HOW. That is why the “spec is code” clan falls short: it is extremely hard—if not impossible—to specify all aspects ahead of time. Code communicates the committed state of a solution; it evolves and does not contain the struggle and aha moments along the way. Shrinking an engineer’s job to coding is like shrinking a chef’s job to cutting—part of the work, never the end.[1]

Economically he leaves an exit ramp. Even if AI-generated code had solid NFRs and engineers fully understood it, task economics still matter. Suppose AI code is 2× worse (quality is hard to quantify; SLIs help). If AI is 1000× faster and 100× cheaper, many **non-critical, high-tolerance** tasks do not justify an expensive human; “slow is fast” is mainly for low-tolerance critical software. He believes SaaS increasingly sells SLAs: you can prompt a replica, but when it breaks many businesses prefer calling a vendor to burning staff on root cause; AI-caused failures are often hard for AI to fix even across models; scale lets vendors amortize quality and guarantees. Conversely, if you price like finest-engineer craft and deliver AI-pipeline quality, customers have AI leverage too—either accept a price crash with quality trailing, or keep price and compete on understanding and accountability.[1]

He compares AI output to Nordic Gold: cheap, technically advanced, unrealistically realistic. Many use cases do not need elemental gold. Naïve managers see the surface and ask why expensive engineers remain, as if typing were the whole value proposition. Relative to current AI, he lists engineers as accountable, reasonable, more consistently progressive once they learn—and cheaper *only if* you treat them as coffee-to-code machines. In his view TCO has not necessarily fallen much; slop and FOMO sometimes raise it.[1]

## A checklist for people running coding agents

Collapse the above into checks, not culture war:

1. **Triage the scenario before “good enough.”** Personal scripts / POCs / throwaway automation can tolerate high risk. Healthcare, finance, payments, authz, destructive data paths default to: you must be able to read, roll back, and on-call.  
2. **Put NFRs into acceptance—not only happy-path FRs.** Reliability, security, observability, scale, maintainability: missing any one is explicitly unfinished. Demos are not delivery.  
3. **Name the verification owner.** Who holds Knowledge / Mandate / Accountability? Did the merger of an agent PR actually read the critical paths? UAT green is not a substitute for engineering verification—it only says the acceptance script passed, not that you understand failure modes.  
4. **Treat the harness as a wrap, not a waiver.** Skills, AGENTS.md, MCP, and test feedback raise the floor; they do not remove “you must understand the system.” Pair with [grow the harness](/blog/grow-the-harness-not-the-context/): control grows into code; understanding still grows in people. Pair with [control cost](/blog/control-the-harness-control-the-cost/): saving tokens and verifying delivery are different jobs.  
5. **Let the spec hold the pen—without worshipping upfront completeness.** [SpecHarness](/blog/specharness-spec-holds-the-pen/) helps because conflicts surface in the build; revise the spec from build feedback rather than pretending English requirements do not conflict. A living spec is not a charm against reading diffs.  
6. **Externalize stop and scope for the agent-loop.** See [GEC](/blog/llm-parkinsonism-gec-executive-control/): separate proposal from project-level stop; when hard goals are met, do not pad progress with busyness. Stop authority lives in the project contract, not in “the model said done.”  
7. **Watch trajectory waste and verification hollowness.** [Three habits](/blog/coding-agents-cost-inefficient-behaviors/) cuts repeat labor; also ask whether tests inspect contracts or give the model a placebo “try again.” Same-patch-fingerprint retests are both a cost signal and a verification-hollow signal.  
8. **When running agents in parallel, force a reviewable diff surface.** Volume that cannot be reviewed is trust substituting for verification—treat it as process failure, not a productivity tip. Merge gates should demand a readable change set and traceable verification evidence.  
9. **Design safety boundaries and accountability boundaries separately.** [OpenShell / Sentry](/blog/nvidia-open-agent-safety-openshell-sentry/) isolates drift; shipping accountability remains human. Do not use “we have a sandbox” to rationalize shipping what nobody understands.  
10. **Align cost metrics to service levels.** Tokens, PR counts, and agent-hours are inputs; incident rate, change-fail rate, MTTR, and customer satisfaction are outputs. Whipping engineers to “use more AI” on input KPIs is the path Ewerlöf warns about.[1]  
11. **Keep a small AI-free practice surface.** His closing advice: a hobby project without AI to keep coding skill fresh for when the market throws you back—risk hedge, not nostalgia.[1]

## Closing: deepen the verification line, do not rant the hot take

This is not an anti-AI piece and not a HN digest. Ewerlöf compresses to one sentence: **generation got cheaper without making verification and ownership cheaper; harness-family tools are worth using, but they do not mean coding is solved.**[1]

The site’s harness / cost / stop-authority / spec / sandbox threads fill engineering surfaces his essay names but does not expand: who picks models and cache policy, who cuts trajectory waste, who holds project-level stop, who lets the spec hold the pen, who moves enforcement outside the harness. Assembled, the enterprise story is fuller—**routing shapes the rate bill; Skills / AGENTS.md / MCP raise behavioral floors; external stop and sandboxes contain runaway loops; verification ownership decides whether a delivery may enter production.** Do not let any one layer pretend to cover the rest.

If you own coding-agent rollout: nail scenario risk and acceptance NFRs before debating how many Skills and MCP servers to install; name the verification owner before celebrating parallel-agent speed. Generation will keep getting cheaper. The expensive side remains whether people are willing to understand—and to be accountable.

## References

[1] Alex Ewerlöf, [Coding is NOT solved](https://blog.alexewerlof.com/p/coding-is-not-solved), 2026-09-26; includes the essay’s own HN update as of 2026-09-29 (~473 points / ~476 comments). Opinions, lists, and figures follow that source and update; no fabricated quotes or engagement numbers.

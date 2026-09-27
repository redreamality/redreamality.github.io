---
title: "Claude Science harness: unattended nine-loop amplitudes"
description: "Reading Anthropic’s guest post on Fable 5.1 inside Claude Science: planar N=4 SYM nine-loop hexagon amplitudes via an explicit science harness and minimal human intervention—harness × agent-loop, not a bigger-model story."
pubDate: 2026-09-27T10:40:00+08:00
author: "Remy"
tags: ["agent-harness", "agent-loop", "ai-agents", "anthropic", "claude", "LLM", "research"]
lang: "en"
---

In September 2026, a calculation that amplitude specialists had treated as “one more loop means a more indirect route” was finished by a paid scientific agent platform. The headline ingredients were not a magical new formula in a flashy paper. They were **Fable 5.1 plus the Claude Science harness**: one sentence stating the problem, humans mostly saying “keep going and update every 4–6 hours,” and a system that executed the known bootstrap and form-factor recipes for the **nine-loop six-particle (hexagon) MHV amplitude** in planar N=4 super Yang-Mills (N=4 SYM)—then had Lance Dixon, a leading expert in the area, validate the result.

The claim of this post fits in one line: **what moved this computational frontier was an explicit harness and a long-running agent loop, not the slogan of “just buy a bigger model.”** It sits on the same mechanism track as [Grow the harness, not the context](/blog/grow-the-harness-not-the-context/), [ECC’s verifiable harness layer](/blog/ecc-agent-harness-optimization/), and the [Strands Harness SDK](/blog/strands-harness-sdk-production-agent-runtime/). It is also a sibling of [Claude’s CRISPR-like enzyme story](/blog/claude-discovers-novel-enzyme-crispr-like-art/) under the broad “science agent” label, but the object differs: that piece is genomic pattern-finding with wet-lab gates; this one is a **checkable, symbol-level amplitude computation**.

Numbers and process claims below stick to the Anthropic Research guest post, the author’s own blog, and the public Cosmic9 data page. Where internals are not public, the text says so—no invented source-level harness diagrams.

## Where the challenge came from: why “nine loops” is hard enough

On 2026-08-07, former theorist and science writer Matt von Hippel posted a challenge: if AI labs want to impress (or scare) people inside amplitudeology, they should take an academic-scale compute budget and attack a recognized hard problem—for example **whether N=8 supergravity diverges at seven loops**, or **pushing the six-particle amplitude in N=4 SYM to nine loops**.[1][2] He deliberately chose problems that are hard because they look **computationally and operationally** expensive, not because nobody knows the method in principle. He wanted a solid test: can current systems finish work that experts expected to be out of practical reach on a reasonable budget?

Scattering amplitudes are the formulas particle physicists use to predict reaction rates. In realistic collisions one almost always truncates; “loops” roughly measure how complicated interactions are allowed to get. More loops means closer to the full answer and a heavier calculation. Most amplitudes stop at two or three loops. Amplitudeologists therefore stress-test methods on toy models such as **N=4 SYM**: unrealistic as a description of our world, but paradoxically cleaner to compute because of its supersymmetric balance.[1]

The historical markers in the guest post are roughly: von Hippel worked on a three-loop amplitude in his PhD years; the community later reached seven; Lance Dixon (SLAC) and collaborators reached eight—and even that eight-loop amplitude arrived partly via a form-factor plus antipodal duality route.[1][3] Going directly to nine looked fragile to Dixon: one mistake anywhere in the recipe and the soufflé collapses; many boring details never make it into papers, so the code has to be rebuilt from scratch.[3]

Anthropic physicists Liam Fitzpatrick and Siddharth Mishra-Sharma picked up the N=4 nine-loop challenge after reading the post. According to the guest article, they asked the model which problem it was most likely to finish, then issued a single task sentence:

> The problem is to compute the Six-particle (hexagon) amplitude in planar N=4 SYM at nine loops.[1]

Human intervention after that was sparse—messages like “I’m going to sleep and won’t be available for several hours. Keep working until I tell you to stop. Give me updates every 4–6 hours.”[1] That is not “zero humans.” It is humans demoted from step-by-step pair programmers to **sparse gates and progress observers**.

## What Claude Science is: the harness layer you can pin down in public sources

The guest post defines Claude Science plainly: a platform scientists can pay to use; in industry language, a **harness**—structured rules and prompts wrapped around Claude to get more robust, scientifically useful behavior.[1] The model tier was **Fable 5.1**.[1] On his own blog, von Hippel adds that they did not use a mysterious internal-only model, which matters because other scientists can try similar problems soon; he also notes he did not inspect full LLM logs, and that his confidence rests on conversational detail plus the verifiability of the result.[4]

Public materials do **not** ship the full Claude Science source, a default Skills inventory, or an internal state-machine diagram. What you can verify is behavioral:

1. **Long unattended loops.** Work can span hours to days; humans keep autonomy alive with continue/sleep-style instructions rather than line-by-line tutoring.[1]
2. **Tool-backed execution.** The bootstrap route used **Python + SymPy**; the numerical side corresponded to roughly **96 CPUs for a week**, about **$100** of the end-to-end budget.[1]
3. **Two crossing paths.** The same target was done via the **direct bootstrap** and the **indirect form-factor / antipodal-duality** approach; either path cost an end user about **$1,000–$2,000**, dominated by long Claude runtime rather than cluster CPUs.[1][4]
4. **External authority validation.** Dixon checked the result; humans will publish and interpret; Claude’s role is done for now.[1][3]
5. **Public comparable artifacts.** The nine-loop result was released in the format used at lower loops; Song He, Jirong Jing, and Xiang Li concurrently obtained nine-loop results with GPT-6 help on some constraints—not Anthropic’s nearly hands-off one-shot style.[1] Mishra-Sharma’s Cosmic9 page further publishes symbol-level files, validation records, and a methods note, while stating that **the programs of the computation are not distributed**.[5][6]

Compressed into a harness view, the useful table is not “the model got smarter”:

| Layer | What is public here | What it is not |
| --- | --- | --- |
| Model | Fable 5.1 | Proof that “a bigger base model alone yields nine loops” |
| Harness / platform | Claude Science: structured rules/prompts + paid science usage | A fully open-sourced agent OS manual |
| Agent loop | Long autonomy, periodic updates, dual paths, symbol-level checks | Invention of a new amplitude principle |
| Human gates | Problem choice, start/stop, sparse nudges; external validation; humans keep authorship | Literally zero humans; not a wet-lab closed loop |
| Evidence sink | Cosmic9 files, Dixon’s check, agreement of dual representations | A press headline or chat screenshot alone |

On this site, [Hard Stop](/blog/hard-stop-kernel-preemption-rogue-agent-containment/) asks how to preempt a runaway agent at the kernel; [Qwen Planner × harness coevolution](/blog/qwen-planner-agent-model-harness-coevolution/) asks how models and control layers grow together. This story is narrower: **when the correct recipe is known, execution is brittle, and wall-clock time is long, who is responsible for finishing without collapsing the soufflé?** In the public narrative, that responsibility lands on the harness—not on new physics.

## The nine-loop result: what was claimed, and where the edges are

### Claims you can check

- **Object:** the nine-loop six-gluon MHV amplitude in planar N=4 SYM (guest post and Dixon addendum wording).[1][3]
- **Methods:** the known bootstrap recipe plus the form-factor / antipodal-duality route; Dixon was especially impressed that Claude did the amplitude **directly**, against his expectation that a more indirect campaign was required.[3]
- **Budget:** about **$1k–$2k** end-to-end; roughly **$100 / 96 CPU-weeks** for the Python/SymPy bootstrap compute slice.[1]
- **Timeline:** challenge post 2026-08-07; Anthropic contacted von Hippel late August; Dixon dates being told on 2026-09-01; Anthropic Research guest post dated 2026-09-25.[1][2][3]
- **Independence:** Song He’s group obtained the nine-loop symbol around the same time with a different AI-assist profile; Dixon jokes he was scooped by a machine and by humans-plus-a-machine within two weeks.[3]
- **Public data:** Cosmic9 ships quintuple-coproduct and septuple-coproduct representations and records agreement on every coefficient compared; the form-factor computation was carried out by Claude; programs are not distributed.[5][6]

### Boundaries that block hype

**First, this is not “AI invented new physics.”** von Hippel’s clearest disappointment—and clearest sanity check—is exactly that: he hoped for strange new methods that bypassed a computational wall; what arrived was **known methods plus more aggressive engineering and compute discipline than experts had tried**, with a possible assist from Python/SymPy relative to traditional CAS workflows.[1][4] Dixon says the more soul-searching moment will come when models propose new physical principles before humans.[3]

**Second, fragility remains.** Dixon’s soufflé metaphor is the point: the public story is that a harness **finished** a fragile pipeline, not that fragility vanished.[3] Cosmic9’s methods note lists assumptions and untested items (for example, some directions fixed only by flux-tube OPE data; programs not shipped)—the kind of boundary a scientific result page should keep, not a marketing footnote.[6]

**Third, “unattended” ≠ “human-free science.”** Humans still chose the problem, started and stopped runs, paid the bill, requested expert validation, and will publish interpretation. The guest post’s phrase *without any scientific oversight more sophisticated than "keep going"* means little stepwise domain babysitting during the compute—not that the scientific community exited.[1]

Song He’s concurrent group is a useful baseline: they also reached the nine-loop symbol and used GPT-6 on some constraints, but humans still owned the framework—unlike Anthropic’s near one-shot autonomy narrative.[1][3] Do not score “humans versus AI.” Use an **intervention-density spectrum**—from “humans own the framework” to “humans own success criteria; the model carries the recipe”—and place your team before hardening the harness.

**Fourth, reproducibility is layered.** Result files and validation records are public; **the generating programs are not**.[5][6] Community reproduction therefore looks more like “compare against public symbols/sample coefficients and re-implement the recipe” than “replay the same harness trace.” For engineering teams, that is a reminder: if you are copying the *harness*, your evidence chain should live in **rerunnable checkpoints and crossing paths**, not only in a final zip.

**Fifth, the generalization radius is unknown.** von Hippel is explicit that low-hanging fruit in a small toy-model subcommunity may be denser than in the real-world amplitude arms race—but he would not bet on “none.” The safer reading: any problem that is “method known, engineering heavy, verification designable” is now worth trying as a science-harness one-shot—**after** you decide how to check the answer.[1][4]

### What the public validation page actually nails (still not program replay)

Cosmic9 is styled after Dixon’s earlier Cosmic pages. For harness builders, notice what it **forces into the open**: dual symbol representations (quintuple vs septuple) with comparison records, sample word coefficients, an eight-loop control against the published amplitude, and a methods / assumptions / untested page.[5][6] The note is blunt: the form-factor run is a **single pipeline** modulo two 31-bit primes; it agrees with an independent direct bootstrap on every coefficient compared; some directions rest only on order-T² flux-tube data; programs are not distributed.[6]

Product template: **ship “how to check” alongside “how to compute.”** You need not open-source the agent trace, but you should leave a second representation, lower-loop regressions, and sample contrasts. “The model said it finished” is not formal-blog evidence.

### Why bootstrap is like Sudoku: brittle, but machine-visible failure

The guest post compares bootstrap to Sudoku: keep possibilities in a specialized alphabet, then cross out what limits, symmetries, and easier related problems forbid, hoping one survivor remains with leftover checks.[1] For agents, failures often look like wrong kernel dimensions, nonzero residuals, or lower-loop mismatches—not “the prose feels off.” The hard part is a long, under-documented recipe where one slipped convention can poison every later intermediate file.[3]

“Unattended” usually presupposes **machine-visible error**. If only a senior reviewer can see the mistake, sleep-mode gates just postpone expensive rework.

## Mechanism: what a long-horizon science agent is actually optimizing

Strip the brand words and only a few transferable mechanisms remain.

### 1. Sink stable control outside the prompt

[Growing Harness](/blog/grow-the-harness-not-the-context/) argues that models should not reinvent the same control decisions every task. Claude Science’s public description is coarser—“structured rules and prompts”—but the behavior aligns: continue conditions, update cadence, and tool conventions for a multi-day job should not depend on improvised user yelling.[1] Even without source, the product shape is visible: **a paid platform ships a science-oriented harness by default, not a naked chat box.**

### 2. Sparse human gates instead of continuous pair programming

The sample human instructions are almost entirely start/stop and continue.[1] That is the opposite of “ask after every file edit.” Tasks that tolerate this gate density share traits: a one-sentence goal; intermediate states that computation can check (linear-algebra residuals, finite-field consistency, regression to lower loops); and an external oracle (Dixon / dual paths / sample coefficients).

If a task lacks automatically checkable intermediate invariants, thinning human gates to “I’m going to sleep” usually just accelerates confident garbage. The enzyme post on this site already shows the other pole: wet lab and unknown function still require humans.[enzyme post](/blog/claude-discovers-novel-enzyme-crispr-like-art/)

### 3. Dual paths and external validation as first-class harness exits

Claude itself ran bootstrap and form-factor routes; Cosmic9 then aligns the form-factor route with an independent direct-bootstrap septuple representation.[1][5][6] For agent design that means: **cross-checks are not polite acknowledgments in a paper; they are exit conditions of the long loop.** “The trajectory looks finished” is not enough. You want a second representation, a lower-loop regression, or an external expert protocol.

### 4. Cost structure: the LLM wall may sit above the CPU wall

In his Q&A, von Hippel flags the split: ~90%+ of cost was the LLM, not the numerical job; paying ~10× a human-coded run can still beat travel lines in a grant.[4] Plan in this order: finish the brittle pipeline first; then shrink model residency; only then tune cluster SKUs. Same ledger as [Strands](/blog/strands-harness-sdk-production-agent-runtime/) context economics and [ECC](/blog/ecc-agent-harness-optimization/) “persist outside the window”—different line items, one book.

### 5. Software discipline may decide more than “inspiration”

The guest post notes Claude may simply have used better software engineering (Python/SymPy versus Maple/Mathematica habits), not a superintelligent leap.[1] Commenters also stress how agent-friendly a recipe becomes once there are exemplars and lower-loop regressions.[4] **What you can copy is a repo shape of exemplar → regress → climb one loop—not faith that the model will have a revelation.**

## A checklist teams can steal: copy the harness, not the slogan

Write this for “changes you can make to a repo tomorrow,” assuming long-horizon scientific / symbolic / data agents—not another chat wrapper.

### A. Admission control (ask how you will verify)

1. Can the goal be stated in one sentence? If not, do not go unattended yet.
2. What intermediate invariants exist? Residuals, hashes, golden samples, lower-version regressions, dual implementations—aim for at least two families.
3. Who is the external oracle? Human review, independent code, known lower-order analytics, a third-party format. A “frontier” without an oracle belongs in notes, not in breakthrough claims.
4. Are failures observable? For soufflé-type tasks, failure must become a red light, not a silently almost-right artifact.

### B. Minimal harness assembly (match public behavior; do not pretend to clone Claude Science)

1. **State outside the session:** working directory, checkpoints, todos, inventory of verified artifacts—not only an ever-longer chat.[Growing Harness](/blog/grow-the-harness-not-the-context/)
2. **Continue protocol:** when to keep going offline, when to stop, reporting cadence. Public Fable long-horizon prompting guidance likewise stresses clear pause conditions over enumerating every exception.[7]
3. **Narrow tool surface:** code exec, job submit, file I/O, fixed test runners; less freedom to “browse until the problem statement changes.”
4. **Dual path or dual representation:** parallelize when you can; otherwise “implementation A + independent check B.”
5. **Cost probes:** meter model tokens, tool CPUs, and human gate counts separately. The lesson from this case: the cluster you feared may be cheaper than the model you forgot to meter.[1][4]

### C. Human gate design

| Gate | Suggested density | Note |
| --- | --- | --- |
| Problem & success criteria | High (before start) | Humans write what counts as done |
| Mid-flight scientific judgment | Low (when auto-checks exist) | Avoid continuous pairing |
| Destructive external actions | High (always) | Email, push to canonical repos, spend real money |
| Final sign-off | High (before publish) | Authority validation or double-blind compare |

Scientific compute can tolerate “I’m going to sleep.” Writing the answer into a paper or a production config cannot. Hard Stop on this site is about forced stop; the symmetric obligation here is **forced acceptance**.[Hard Stop](/blog/hard-stop-kernel-preemption-rogue-agent-containment/)

### D. Minimal logs a long science run should leave behind

Matching the public timeline, persist at least:

1. **Task sentence** and success criteria (what counts as checked).
2. **Model tier / harness version / tool-image hash**.
3. **Human-intervention timeline** with timestamps and verbatim continue/stop messages.
4. **Checkpoints:** lower-loop regression, dual-path divergence, residual / prime-consistency summaries.
5. **Cost split:** model, CPU/GPU, human hours.
6. **Artifact inventory** plus an explicit untested-assumptions list (Cosmic9’s tone).[6]

von Hippel doubts the same stack could have done this six months earlier; do not treat today’s ceiling as permanent.[4] Logs let you later separate model gains, harness gains, and folklore about cost.

### E. Anti-patterns: when copying this post fails

- **You need a new concept, not one more loop of a known recipe** (von Hippel’s comment on quantum-gravity-class questions: which bullets you are willing to bite, not technical fluency).[4]
- **No automatically checkable intermediate state** (unstructured open-ended writing).
- **Verification costs more than generation** ($1k to generate, three expert-months and no formalization to check).
- **Treating a “programs not distributed” result page as a reproducible engineering artifact**—Cosmic9 carefully separates checkable data from undistributed programs.[5][6]

## How this sits next to the site’s harness line

| Post | Problem it attacks | Overlap with nine loops |
| --- | --- | --- |
| [Grow the harness](/blog/grow-the-harness-not-the-context/) | Sink control into code; stop stuffing context | Nine loops need stable long-horizon control, not a longer prompt |
| [ECC](/blog/ecc-agent-harness-optimization/) | Verifiable layer around existing coding agents | Same “productize the control plane”; nine loops is a science platform, not an IDE plugin |
| [Strands Harness](/blog/strands-harness-sdk-production-agent-runtime/) | Ship loop control as an SDK | Shared “explicit harness product” shape; science adds symbolic checks and external oracles |
| [Enzyme ART](/blog/claude-discovers-novel-enzyme-crispr-like-art/) | Marketing layers and wet-lab boundaries for science agents | Same vendor’s science narrative; object shifts from hypothesis generation to checkable computation |
| Hard Stop / Qwen Planner (one beat) | Containment; model×harness coevolution | Nine loops shows a **working coevolution outcome**, not the containment protocol itself |

If you keep one product sentence: **once a community has written a brittle but complete recipe, the bottleneck moves from “can it think?” to “who can finish inside budget without collapsing.”** Buying a bigger model is then usually the wrong first purchase. Grow (or buy) a harness with checkpoints, dual paths, and sparse gates.

## Closing

von Hippel’s challenge hoped for a trailer of the future in which exotic methods bypass computational walls. What he got is a more mundane—and possibly more important—present: there is more low-hanging fruit than expert intuition admits; a roughly thousand-dollar long loop behind a science harness can already finish an expert-level, multi-stage, fragile next step in amplitudes and hand back checkable artifacts.[1][4]

For people building agent systems, this is not soft news that “physics got shocked by AI.” It is a field experiment you can cite:

- **Claim:** harness × agent-loop moved a computational frontier;
- **Evidence:** Fable 5.1 + Claude Science, dual paths, $1k–$2k, Dixon’s validation, Cosmic9;
- **Bounds:** known methods, programs not fully public, no new physical principle, generalization radius still open.

Long-horizon editorial work only needs those three lines. Leave the rest of the heat on the timeline.

## Primary sources

1. Matt von Hippel (Anthropic Research guest post), [Yes, Claude can do Nine Loops](https://www.anthropic.com/research/yes-claude-can-do-nine-loops) (2026-09-25), including Lance Dixon’s addendum. Disclosure: Anthropic paid for the writing time; Dixon received Claude usage credits.
2. Matt von Hippel, [It Only Counts When AI Gets to My Field](https://4gravitons.com/2026/08/07/it-only-counts-when-ai-gets-to-my-field/) (2026-08-07), the original challenge.
3. Lance Dixon’s addendum in the same guest post (SLAC / Stanford).
4. Matt von Hippel, [It Got to My Field](https://4gravitons.com/2026/09/25/it-got-to-my-field/) (2026-09-25), Q&A on incentives, cost structure, and limits.
5. Siddharth Mishra-Sharma et al., [Cosmic9](https://smsharma.io/cosmic-nine-loops/): nine-loop symbol/function files and validation entry points; programs not distributed; large files on Zenodo DOI 10.5281/zenodo.22949278.
6. Cosmic9, [method_and_validation.md](https://smsharma.io/cosmic-nine-loops/validation/method_and_validation.md): methods, assumptions, untested items, dual-representation checks.
7. Anthropic platform docs, [Prompting Claude Fable 5.1](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1) (general long-horizon / checkpoint prompting guidance; **not** a Claude Science internals manual).

---
title: "Jev × Claude Code: Four Real Integration Paths and a 25-Line Minimal Build"
description: "A viral YouTube clip ties Jev to Claude Code, but Jev cannot be the CLI chat model. This post covers the official skill, boundary hooks, MCP, and per-turn routing, contrasts NobodyWho’s 25-line minimal build, and discusses OpenAI fast-follow pressure."
pubDate: 2026-09-23T14:40:00.000Z
author: "Remy"
tags: ["Jev", "Claude Code", "Agents", "Developer Tools", "System One"]
lang: "en"
translatedFrom: "jev-claude-code-10x-and-25-lines"
---

Over the last two days, a YouTube video titled “Jev will 10x your Claude Code” climbed to roughly 410k views.[1] It couples TypeSafe’s decision model Jev with Anthropic’s coding agent Claude Code. The slogan is seductive; the common landing mistake is treating Jev as “change the base URL and it becomes your chat model.”

We already published a [scenario-focused Jev guide](/en/blog/typesafe-jev-use-cases/)—a **scenario catalog** covering browser next-step selection, routing, ticket triage, citation checks, context management, and pre-production validation.[2] **This post does not redo that catalog.** It answers three urgent questions:

1. **Can Jev be the underlying chat model for Claude Code / Codex?**
2. **If not, which coding-agent integration paths actually work, and what are the install/verify steps?**
3. **What does “Jev in 25 lines of Python” really show, and will big labs fast-follow?**

One-line contrast: the scenario post tells you **where judgments belong**; this post tells you **how a coding agent attaches a judgment layer, what the mechanism is, and where competitive pressure comes from**.

## The most common misconception

Jev **cannot** be the chat model behind Claude Code or Codex.[3]

Claude Code speaks the Anthropic Messages API; Codex speaks the OpenAI Responses API. Even if you change the base URL, the wire format still expects an assistant message stream: renderable text, parseable tool calls. Jev’s API is different—you submit a `state` plus typed `questions`, and you get structured answers with probabilities—**no free-form string generation**.[4][5]

TypeSafe’s documented evaluation endpoint is `POST /v1/systemone`, with `GET /v1/models` for aliases your account can use. The default is `jev-latest`; versioned IDs such as `jev-1.13.0` are also accepted.[3][5] There is no `/v1/chat/completions` surface and no Anthropic Messages-compatible face in the docs. Guides that say “point Claude Code at Jev” mix two product kinds.

The useful split is:

- **Claude Code / Codex**: plan, write code, edit files, explain results.
- **Jev**: own the judgments that must be fast, typed, and preferably calibrated—routing, gates, compaction, acceptance checks.

LangChain describes the same harness pattern: keep an LLM for open-ended reasoning and generation; use Jev for cheap structured decisions along the way.[6] TypeSafe’s framing is equally clear: Jev is a frontier-intelligence function call—unstructured state in, typed probabilistic decisions out—deliberately giving up string generation for parallel sampling and a “no type errors” product constraint.[4]

The request shape, at the level of intuition (fields per official docs), looks like this:

```json
{
  "model": "jev-latest",
  "state": "Deploy failed twice; customers see 500s. Can someone look now?",
  "questions": {
    "is_urgent": {
      "type": "noul",
      "instructions": "The message conveys urgency or time-sensitivity"
    }
  }
}
```

What comes back is not an assistant reply, but a typed answer such as `{"is_urgent": {"type": "noul", "noul": 0.999}}`.[6] Your code branches on that probability. The CLI still needs a model that writes code.

## How this post differs from the on-site use-cases piece

To keep readers from treating the two posts as long/short versions of each other:

| | [Use-cases post](/en/blog/typesafe-jev-use-cases/) | This post |
| --- | --- | --- |
| Core question | Which business judgments fit Jev? | How do coding agents attach Jev? What is the mechanism and competitive pressure? |
| Evidence shape | Browser / routing / tickets / RAG / context scenarios + validation order | Reproducible skill / hook / MCP / per-turn routing steps + pitfalls |
| Community repos | README ≠ production evidence | Stars ≠ maturity; document fail-open and other engineering constraints |
| Out of scope | Does not expand CLI plugin install detail | Does not redo the scenario catalog or business acceptance checklist |

Both posts share the same evidence discipline: repo inclusion, demo GIFs, and author self-tests are not production reliability proofs.[2]

## Four paths that actually connect to Claude Code

Ordered from least to most invasive. Commands, repos, and prices reflect publicly checkable material around 2026-09-20 (primarily APIMaster’s integration guide, updated through 2026-09-21). Community repos move daily—re-read the README before installing.[3]

### 1. Official agent skill (start here)

This is TypeSafe’s supported integration. It teaches the coding agent to write correct Jev calls; it does not intercept the CLI.[3][7]

**Install (Claude Code plugin):**

```bash
claude plugin marketplace add typesafe-ai/skills
claude plugin install typesafe@typesafe-ai
```

**Reload after updates:**

```bash
claude plugin marketplace update typesafe-ai
claude plugin update typesafe@typesafe-ai
```

Then restart Claude Code, or run `/reload-plugins`. You can also enable auto-update under `/plugin` → Marketplaces → typesafe-ai.[7][8]

**Other agents (skills installer):**

```bash
npx skills add typesafe-ai/skills --skill typesafe-ai
```

The installer asks which agent to target; installation is project-local by default, or global with `-g`.[7]

**How to verify it landed:**

1. In Claude Code, invoke `/typesafe:typesafe-ai`, or name it in a prompt—“use the TypeSafe skill”.[8]
2. Make the agent ask **many questions in one request** over a shared `state` (including speculative ones), instead of one question per call. TypeSafe’s docs explicitly call out that coding agents fall into the one-question-per-call habit more than people do; the skill exists to correct that.[5][8]
3. If the agent invents request/response fields that do not exist, update the skill via your install method and retry—documented as a common issue.[8]

The skill changes **writing habits**, not tool interception. TypeSafe’s own parallel-questions example batches about 13 questions into one call and reports roughly 12.2× cheaper / 10.0× faster in one page and about 11.5× / 9.6× in another (vendor self-measurement; treat as order-of-magnitude, not an independent benchmark).[3][5] Requests also share a budget of roughly 32,000 tokens for state plus all questions—on the order of 150,000 English characters—so leave headroom per the docs.[3]

### 2. Boundary hooks (PreToolUse / compaction / stop)

The biggest savings usually sit on boundaries: before a tool runs, before long output enters context, or when a session claims “done.” Community hooks already cover compaction, dangerous-shell gates, stop-hook verification, and terminal-output pruning.[3] LangChain’s `AutoModeMiddleware` encodes the same idea: score tool-call risk with Jev before execution.[6]

Take `jev-axi`’s PreToolUse shape as one concrete community example (not a TypeSafe first-party product). After install, `setup safety` wires a Bash pre-tool hook for Claude Code / Codex; routine commands can be decided locally, while suspicious ones call Jev.[9]

```bash
npm install -g jev-axi
export TYPESAFE_API_KEY=...
jev-axi setup safety
```

In the author’s published demos, download-and-run style commands are denied with high `remote_code` probability; routine commands such as `pnpm test` stay on local heuristics with no Jev call. `guard` can also screen fetched pages/issues for injected instructions; the README shows roughly 375ms and about $0.00004 for one screening (author self-test).[9]

**The engineering detail that matters more than demo numbers is failure policy.** Better implementations document **fail-open**: if a judgment fails, the transcript cannot be read, a timeout hits, or the service is down, allow or degrade instead of freezing the CLI.[3][9] For example, `jev-axi` states that when the hook cannot read the agent transcript it does nothing; stop-hook projects such as `jev-belay` emphasize spending one multi-question Jev call only when files changed without a passing check, and failing open on errors.[3]

Most of these repos are days old. Stars measure attention, not maturity—the same caveat applies even to high-star compaction plugins.[3]

### 3. MCP tools

If you want the model to call judgment tools itself, community MCP servers such as `@jkudish/jev-mcp` expose verify/screen/classify/gate-style tools.[3][10] TypeSafe’s own docs do not treat MCP as a first-class surface, so this is community, not a vendor guarantee.[3]

**Add in Claude Code (keep the key in env—do not paste it into chat or commit it):**

```bash
claude mcp add jev -e TYPESAFE_API_KEY=sk-... -- npx -y @jkudish/jev-mcp
```

**Codex (`~/.codex/config.toml`):**

```toml
[mcp_servers.jev]
command = "npx"
args = ["-y", "@jkudish/jev-mcp"]
env = { TYPESAFE_API_KEY = "sk-..." }
```

The server exposes ten tools, including `jev_verify`, `jev_screen`, `jev_classify`, and `jev_gate`. The README quotes roughly 150–500ms per judgment at a fraction of a cent (author claim).[10] The design point is the cheap mechanical checks agents skip because a frontier model is too slow to run on every page, claim, or candidate list.

Naming trap: npm also has an unrelated unscoped `jev-mcp` package. Pin the scoped name so a future `npx` does not resolve the wrong package.[3]

### 4. Per-turn model routing (high leverage, highest intrusion)

`jev-router` puts a loopback proxy in front of the CLI. One Jev call per fresh user turn picks a model tier; the original Claude Code / Codex then does the work.[3][11]

```bash
npm install -g jev-router
echo "JEV_API_KEY=..." > ~/.jev-router.env
jev-claude   # Claude Code; select Jev Router in /model
jev-codex    # Codex; temporary Jev Router provider
```

Requires Node.js 20.12+ and an already-logged-in Claude Code or Codex CLI. The proxy forwards the CLI’s own authorization headers without reading, storing, or modifying them; no extra Anthropic / OpenAI API key is involved.[11] Selecting a concrete model in the picker pauses routing; selecting **Jev Router** resumes it. Tools, permissions, sessions, `/compact`, and `/resume` behave as they always did, because the frontier model still writes the code.[11]

Default tier mapping (per the repo README):

| Tier | Claude Code default | Codex default |
| --- | --- | --- |
| Fast | Haiku | `gpt-5.6-luna` |
| Balanced | Sonnet | `gpt-5.6-terra` |
| Strong | Opus | `gpt-5.6-sol` |
| Long | Fable (opt-in) | `gpt-6-astra` |

The policy is more careful than “always pick cheapest”: explicit requests such as “use opus” win; low confidence never downgrades and caps upgrades at balanced; large conversations refuse downgrades that would waste more prompt-cache work than they save; unavailable tiers step upward rather than silently choosing something weaker; the long tier stays off unless `JEV_ALLOW_FABLE=1`. Routing is **fail-open**—a Jev failure leaves the current model in place—and each launcher restores the CLI’s previous default on exit.[11]

This is the path most often mistaken for “run Claude Code on Jev.” In reality, **the frontier model still writes the code**; Jev only chooses the tier.

## Common pitfalls (worth more than the install commands)

1. **The incompatible-endpoint myth, inverted: “just change the base URL.”** There is no Anthropic- or OpenAI-shaped compatible surface to point at. This is the single most common error in content written about Jev this week.[3]
2. **One question per call.** A decision model’s economics come from parallel questions over one shared state. One question per request throws away both the latency argument and the batching advantage; that habit is exactly what the official skill corrects.[3][5]
3. **Treating confidence as accuracy.** Confidence describes how peaked the distribution is—and therefore when to auto-act or escalate. It is not a percentage that “this judgment is correct.” Calibration is valuable because it tells you when *not* to trust blindly.[3][5]
4. **Hooks without fail-open.** Freezing the CLI when the judgment layer fails is usually worse than one false allow. More mature community implementations put the failure path in the README.[3]
5. **Stars ≠ maturity.** A compaction plugin can have thousands of stars and still be days old. Validate on your own task set, not on a leaderboard.[3]
6. **Reseller prices are only as good as the check date.** APIMaster checked routes such as `jev-latest` on 2026-09-21 (for example, claiming about $0.042 / 1M input and $0 output) and stressed that channel prices move with supply—the live card is what counts. Cite with a date caveat; do not treat any reseller price as a permanent tariff.[3]
7. **Keep arithmetic, dates, and counting in your own code.** TypeSafe documents those regions as unreliable; clever routing does not make a snap-judgment model a calculator.[3][5]

## A minimal experiment after the skill is installed

Once the skill is present, try a minimal experiment:

1. Prepare a realistic `state` (CI failure summary, emotional ticket, or suspicious shell note)—not a ten-word toy sentence.
2. Ask TypeSafe **once** for urgency (`noul`), request type (`choice`), and frustration (`score`) together. Return shapes differ by primitive.[5]
3. Combine answers with thresholds in code; do not ask for a prose “overall recommendation.” Split judgments; keep weights in your code.[5]
4. Contrast the same three questions as three separate requests. Watch latency/cost order-of-magnitude. Vendor examples report ~10×; your numbers depend on key, region, and model version.[3][5]

LangChain’s `TypeSafeClassifier` follows the same contract: `.invoke()` returns classification results, not a chat message.[6]

```python
from langchain_typesafe import Noul, TypeSafeClassifier

classifier = TypeSafeClassifier()
response = classifier.invoke({
    "state": (
        "The deploy failed twice and customers are seeing 500s. "
        "Can someone look now?"
    ),
    "questions": {
        "urgent": Noul(instructions="Does this need attention right now?"),
    },
})
urgency = response.nouls["urgent"].noul
```

If the target is a coding harness rather than a standalone script, nest the same judgments in middleware: `ModelRouterMiddleware` picks a tier from the latest user message; `AutoModeMiddleware` blocks risky tool calls before execution.[6] That is the same design family as Claude Code community hooks, with the mount point moved from CLI hooks to LangChain middleware.

## Compaction, pruning, and “done” checks: what else boundary hooks do

Beyond dangerous-command gates, the boundary layer has three recurring pain points that APIMaster’s catalog spells out clearly:[3]

- **Session compaction:** plugins such as `fast-jev-compaction` replace whole-transcript summary compaction with per-item keep/drop judgments. High stars still do not equal production readiness, but the pattern itself is worth understanding—compaction is classification, not continuation.[3]
- **Terminal-output pruning:** before long Bash output enters context, judge which fragments still matter for the current task. You save context and later generation, not “smarter models.”[3]
- **Stop / completion checks:** when a session claims done, compare the transcript, changed files, and check results with a small set of “is it really finished?” questions. Good implementations limit when they fire and fail open on errors, so a stop hook does not become a new single point of failure.[3]

Bundle installers such as `jev-use` can wire hooks, a routing skill, and PreToolUse together; they accept `TYPESAFE_API_KEY` / `OPENROUTER_API_KEY` / `AI_GATEWAY_API_KEY`, and `JEV_BACKEND=mock` offers a keyless dry run to confirm wiring (not judgment quality).[3]

Pick by pain point, not by stars:

1. Long sessions burning money → start with compaction / pruning.
2. Nervous about shell → start with PreToolUse gates.
3. Frequent “done but unfinished” → start with a stop hook.
4. Want everything and accept more intrusion → then consider a bundle installer or the routing proxy.

## How to verify routing after install (do not stop at the model name)

After `jev-router` is installed, do not stop at seeing “Jev Router” in the picker. Check:[11]

1. Launch with `jev-claude` / `jev-codex` and confirm existing login works—no separate API key.
2. Send one simple and one hard prompt; watch whether status line / commentary reports different tiers (`/jev-explain` or `$jev-explain`).[11]
3. Pick a concrete model to pause routing; pick **Jev Router** to resume.
4. Break `JEV_API_KEY` on purpose and confirm fail-open (CLI does not freeze).[11]
5. Exit and confirm plain `claude` / `codex` defaults were restored.[11]

Privacy boundary: user prompt text goes to TypeSafe for routing; the repo says nothing else is forwarded—raise that in data classification before team rollout.[11]

## Mechanism contrast: vendor product surface vs local logit readout

A short contrast helps avoid “similar surface ⇒ same product claims”:

| Dimension | TypeSafe Jev (vendor materials) | 25-line local logit readout |
| --- | --- | --- |
| Interface | `state` + typed `questions` → typed `answers` | Hand-written prompt + option-token readout |
| Output constraint | Product surface stays inside the options/levels you supplied | Depends on whether you constrain/check distribution coverage |
| Multi-question | Parallel evaluation in one request; adding questions barely changes wall time | Possible, but 25-line demos usually show one question |
| Calibration | Claims RLCD + synthetic-data training; confidence is a statistic over the distribution | Uncalibrated; HN discussion stresses neural-net overconfidence |
| Cost model | Documented about $0.042 / MTok input; output treated as free | Local compute and model size |
| What you get | Workflow-eval narrative, SDKs, skill, enterprise contract boundaries | Mechanism intuition and a locally debuggable toy |

TypeSafe’s own nuance: homepage-scale gains come from specific workflow evals (optimistic end), and public materials do not let outsiders reproduce the full training stack.[4] Trust **your own task set**.

## The 25-line minimal build explains a mechanism, not a product substitute

NobodyWho published “Jev in 25 lines of Python”: load a local GGUF model, read logits for option tokens, normalize into class probabilities.[12] The HN thread followed quickly.[13]

The core move compresses to three beats (full script and dependency metadata are in the original; this keeps the mechanism):

```python
# Load any GGUF (example from the post)
model = Llama.from_pretrained(
    repo_id="Qwen/Qwen3-0.6B-GGUF",
    filename="Qwen3-0.6B-Q8_0.gguf",
    n_ctx=512,
    logits_all=True,
    verbose=False,
)

labels = ["A", "B", "C"]
choices = ["Legitimate", "Spam", "Phishing"]
# ... build chat prompt, then:
logits = model.scores[model.n_tokens - 1]
token_ids = [model.tokenize(text=label.encode(), add_bos=False)[0] for label in labels]
choice_logits = numpy.asarray([logits[token_id] for token_id in token_ids])
logprobs = choice_logits - numpy.logaddexp.reduce(choice_logits)
probabilities = numpy.exp(logprobs)
```

The piece deliberately skips product claims: no System One branding, no TypeSafe API, no large synthetic corpus, no RLCD.[12] It also labels itself a parody and points to more complete open implementations. After you strip the brand, the core move is still “given options, read the next-token distribution, normalize into a decision.”

That matches Arcturus Labs’ technical read: for `noul`, inspect tokens like `true`/`false`; for `choice`, compare option-label tokens.[14] OpenAI has used single-token micro-classifiers inside tool calling for years; Jev’s bet is to productize **general, calibrated** classification as its own surface.[14]

HN adds boundaries worth keeping: chat-model logprobs dilute toward prose; option letters carry position bias; uncalibrated probabilities overconfident; parallel multi-ask and calibration do not appear from a few more Python lines.[13] Read the demo as:

- **Mechanism teaching**: classification ≈ constrained probability readout.
- **Not a substitute for TypeSafe’s claims**: parallel multi-question efficiency, calibration, workflow-eval Pareto position, and “no type errors” product constraints still need the vendor materials plus your own task evals.[4][5]
- **Not a swap of “local and fast” for “frontier intelligence.”** A 0.6B quantized model can demonstrate reading logits; it does not inherit the vendor’s workflow-eval claims.[12][4]

Our earlier scenario post already warned that README lists are not production evidence.[2] Apply the same caution here.

## Will OpenAI eat this lunch?

Arcturus Labs argues that if Jev is close to “conventional LLM + probability readout + calibration training,” OpenAI can fast-follow. The sharper threat is not only shipping a clone API, but folding calibrated snap judgments **into** flagship models for safety gates, continue-or-stop checks, and model upgrades—without leaving the GPU.[14]

It cites TypeSafe cofounder Diogo Almeida: they see themselves as a data research lab focused on general synthetic data and RLCD calibration.[14][4] Moat strength depends on how hard that data/process is to copy, and whether real-task jaggedness stays acceptable outside marketing evals.[14][5]

For Claude Code users, the short-term plan is simpler—you need not bet the moat narrative first:

1. Install the skill so the agent batches questions correctly and knows how to fetch `.md` docs.
2. Add one pain-point hook (dangerous commands or context bloat) and confirm fail-open.
3. Add routing only after the model bill is large enough to measure; compare total cost / success rate / completion time before optimizing tier mix.
4. Keep arithmetic, dates, and counting in your own code.[3][5]

LangChain’s middleware examples suggest the same priority: embed judgments in the harness (routing middleware, Auto Mode gates) instead of fantasizing that the CLI’s generative model has been replaced.[6]


## How to pair this with the on-site use-cases post

Read them in this order: the scenario guide first for **whether a judgment should exist** (error cost, samples, thresholds, fallback), then this post for **which coding-agent layer to attach** (skill, hooks, MCP, routing). Reverse that and it is easy to install plugins without a success criterion.[2][3]

A useful team split: product owns the scenario post’s acceptance sequence; platform owns this post’s install steps, fail-open behavior, and data boundaries. Shared discipline: without your own task set, neither vendor numbers nor star counts become conclusions.

## Takeaway

The slogan “Jev 10xes Claude Code” is usually true only in this narrower sense: **move many tiny decisions out of slow generation**. The official skill, boundary hooks, MCP, and per-turn routing are the four currently verifiable paths. The 25-line build clarifies the mechanism; the OpenAI fast-follow debate reminds you the product window may be short—so anchor value in your own workflow measurements, not in slogans or star counts.

If you have not read the scenario post yet, pair them: [Jev use cases](/en/blog/typesafe-jev-use-cases/) covers **where judgments belong**; this post covers **how coding agents attach them, how to read the mechanism, and where competitive pressure comes from**.

## Sources

1. [Jay E | RoboNuggets: Jev will 10x your Claude Code (YouTube)][1]
2. [On-site: Jev use cases][2]
3. [APIMaster: How to Use Jev in Claude Code and Codex][3]
4. [TypeSafe: Introducing System One Models & Jev][4]
5. [TypeSafe Docs: Primitives / Models][5]
6. [LangChain: Building a Harness with Jev][6]
7. [typesafe-ai/skills][7]
8. [TypeSafe Docs: Agent skill][8]
9. [shiftynick/jev-axi][9]
10. [jkudish/jev-mcp][10]
11. [gargpratyush/jev-router][11]
12. [NobodyWho: Jev in 25 lines of Python][12]
13. [HN discussion: Jev in 25 Lines of Python][13]
14. [Arcturus Labs: Will OpenAI Eat Jev's Lunch?][14]

[1]: https://www.youtube.com/watch?v=tTnUcSj-QPA
[2]: https://redreamality.com/en/blog/typesafe-jev-use-cases/
[3]: https://apimaster.ai/blog/jev-claude-code-codex
[4]: https://typesafe.ai/blog/introducing-system-one-models-and-jev
[5]: https://docs.typesafe.ai/primitives
[6]: https://www.langchain.com/blog/building-a-harness-with-jev
[7]: https://github.com/typesafe-ai/skills
[8]: https://docs.typesafe.ai/agent-skill
[9]: https://github.com/shiftynick/jev-axi
[10]: https://github.com/jkudish/jev-mcp
[11]: https://github.com/gargpratyush/jev-router
[12]: https://www.nobodywho.ai/posts/jev-in-25-lines/
[13]: https://news.ycombinator.com/item?id=49812769
[14]: https://arcturus-labs.com/blog/2026/09/21/will-openai-eat-jevs-lunch/

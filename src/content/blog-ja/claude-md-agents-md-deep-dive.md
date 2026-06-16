---
title: 'CLAUDE.mdとAGENTS.md徹底解説：基礎から直感に反するパターンまで'
pubDate: 2026-04-26T00:00:00.000Z
description: 'Anthropicの公式ガイドからKarpathyのprogram.mdパラダイムへ、二度目ルールからダーウィニアン・メモリへ、Spec-DrivenからEval-Drivenまで——AIコーディングエージェント向けのプロジェクトファイルをどう書くのか、そして借りる価値のある直感に反するメンタルモデルを長文で俯瞰する。'
author: 'Remy'
tags: ['Claude Code', 'AI Agents', 'Context Engineering']
lang: 'ja'
translatedFrom: 'claude-md-agents-md-deep-dive'
---

## なぜわざわざ書くのか

Claude Code、Cursor、Codex、Aider、Jules、Amp、Windsurf、あるいはこの1年で登場した十数個のAIコーディングツールを使ったことがあるなら、`CLAUDE.md` か `AGENTS.md` をほぼ確実に書いたはずだ。もしかすると両方。7つのリポジトリ全部に。そこで誰もが一度は考える。これはどれくらいの長さにすべきなのか。READMEのように読むべきなのか、それともコマンド一覧のように書くべきなのか。1つのファイルを複数ツールで共有できるのか。書いたあと、エージェントは本当に従ってくれるのか。

これは、2025年半ばから2026年初頭にかけて、英語圏と中国語圏のコミュニティが「AI向けのプロジェクトファイルを書く」ことについて学んできた内容をまとめた長いサーベイである。ハウツーではない。むしろ**メンタルモデルの歴史**に近い——Anthropicの初期ベストプラクティスから、Karpathyの`program.md`パラダイム、Geoffrey HuntleyのRalph Wiggumループ、そしてclaude-evolveの「ダーウィニアン・メモリ」実験までをたどる。最後の数章では机に戻り、ナレッジ・ヴォールトとバックエンド・リポジトリ向けの具体的なチェックリストを提示する。

全12章、およそ6,000語。前半6章は基礎と現状、後半6章は直感に反するパターンと実装上の配線だ。奇妙で実用的な部分だけ知りたいなら、第6章へ飛んでほしい。

---

## 1. Three Files, Three Audiences: README.md vs CLAUDE.md vs AGENTS.md

Before any "file written for AI" can mature, the three files have to be cleanly separated.

**README.md** is for humans. The audience is the developer who just opened your repo for the first time. The goal is to get them to "what does this project do, how do I run it, how do I contribute" within five minutes. The voice is descriptive and a little promotional. The shape is the pyramid principle: **what → how → how to participate**.

**CLAUDE.md** is for Claude Code. The audience is an AI agent that **starts every session from zero**. It has no memory of last time, no intuitive sense of the directory structure, no shared culture with the team. It is a freshly amnesiac detective. What that detective actually needs is operational: which command builds, which command tests, which traps must be known to avoid them, how to verify the change.

**AGENTS.md** is the open standard published in August 2025 by OpenAI, Google, Cursor, Factory, Sourcegraph and others. It is now hosted by the Linux Foundation through the Agentic AI Foundation. The promise is one file, read natively by Codex, Cursor, Aider, Jules, Copilot, Claude Code, Amp, Windsurf, Zed and twenty-odd other tools. Adoption is past sixty thousand repos at the time of writing.

The three files are complementary, not substitutes. README.md answers "what". CLAUDE.md and AGENTS.md answer "how". The first is a marketing page for humans; the others are an operations manual for machines.

A common failure mode is writing CLAUDE.md as a re-skin of README.md — pasting the project blurb, the architecture diagram, the Getting Started snippet. None of that is what the agent needs. The agent does not care about your project's value proposition; it cares whether the test command is `pnpm test` or `npm run test:unit`, whether codegen needs to run after edits, which directories are off-limits.

The second failure mode is treating CLAUDE.md as written-once. Anthropic's best practices put it bluntly: "**Treat CLAUDE.md like code: review it when things go wrong, prune it regularly.**" It is a living document, and its lifecycle is a code lifecycle.

---

## 2. Universal Best Practices: Length, Structure, Voice

### Length

This is the least controversial and most-often-violated dimension.

Dexter Horthy of HumanLayer published a piece called *Writing a good CLAUDE.md* in which he gives a very specific anchor: their main repository's root CLAUDE.md is **under 60 lines**. A Chinese-speaking author ran a careful experiment: cutting from 3,000 characters to 1,000 produced clear improvement; cutting to 800 was the sweet spot; cutting to 400 lost critical information. He stabilized at around 800 Chinese characters. `vercel/vercel`, a complex monorepo, lives at 247 lines. `openai/codex` is roughly 800 lines, but it survives only because of strict heading discipline.

Rough community consensus: **typical projects ≤ 250 lines; large monorepos shard by sub-package; anything > 500 lines must be aggressively partitioned.** The deeper number Anthropic has hinted at in public talks: frontier models reliably follow somewhere in the range of **150 to 200 instructions**. Past that, compliance decays fast.

### Structure

A workable CLAUDE.md tends to have:

1. **CRITICAL RULES** — the red lines. "Never push to main." "Never `rm -rf`."
2. **PROJECT CONTEXT** — stack, monorepo layout, key architectural decisions.
3. **BUILD & TEST COMMANDS** — concrete, copy-pasteable. Not "run the tests"; `pnpm test --watch=false`.
4. **CODE STYLE** — with examples. Not "keep code clean"; show a good and a bad snippet.
5. **FILE ORGANIZATION** — what lives where.
6. **VERIFICATION** — how to confirm the change did not regress something.
7. **COMMON PITFALLS** — accumulated over time, in event order.

The `vercel/vercel` AGENTS.md is instructive: it has a dedicated *Common Pitfalls* section collecting concrete bites — "no `console.log` in CLI packages", "do not skip CI hooks". `vercel-labs/open-agents` has its parallel *Lessons Learned*. Both implement the same idea: **convert one-time pain into long-lived rules.**

### Voice

Imperative, strong modals, concrete paths and commands. Write `ALWAYS run pnpm typecheck before claiming the task is done`, not "please verify code quality". Write `Never import from src/internal/*`, not "be careful with imports".

The frequently-cited number is **70%** — about seventy percent of CLAUDE.md rules get followed. Which means real red lines cannot rely on CLAUDE.md alone. Red lines need hooks: `PreToolUse` returning exit code 2 is the only way to actually block a forbidden action. The other thirty percent is what hooks are for.

---

## 3. Eight Real Samples Worth Reading

Theory always loses to a real file. Eight samples worth opening:

**1. openai/codex** — 800 lines, partitioned by crate (`codex-core`, TUI style, TUI code, text wrapping, tests, snapshot tests, app-server API). The most valuable rule in the file is **"Resist adding code to codex-core."** A negative-intent rule like that beats "keep code simple" by a wide margin. The file also pins concrete numbers — 500 LoC target per file, 800 LoC hard split, `insta` for snapshots, `pretty_assertions` for deep equality.

**2. vercel/vercel** — 247 lines, a gold-standard monorepo template. Clean structure: Repository Structure / Essential Commands / Changesets / Code Style / Testing Patterns / Package Development / Runtime Packages / CLI Development / **Common Pitfalls**. The pitfalls section is a living trap-avoidance manual.

**3. openai/openai-agents-python** — 480 lines, and the interesting part is that instructions are written as **explicit skill invocations**: `$code-change-verification`, `$pr-draft-summary`. Runtime changes must call `$implementation-strategy` first. Doc-only and meta changes are allowed to skip full validation. It treats Markdown as a small DSL for workflow.

**4. vercel-labs/open-agents** — 280 lines, opening with "This is a living document. When you make a mistake, add it to Lessons Learned." That single line is a **self-evolution contract**: both agent and human are invited to append. Concrete rules include "quote `[id]` dynamic-route paths to dodge zsh globbing", "edits to `schema.ts` must generate a migration, never `db:push`".

**5. vercel-labs/agent-skills** — its single most important constraint is "**Keep SKILL.md under 500 lines**", with progressive disclosure for everything below.

**6. anthropics/anthropic-cookbook** — mandates `uv` for Python, mandates **model aliases** (`claude-sonnet-4-6`) over date-pinned IDs. Date-pinned IDs rot.

**7. karpathy/llm-council** — Karpathy's own vibe-coded project's CLAUDE.md. It records **not code style**, but project-level long-term memory and traps: "ReactMarkdown must be wrapped in `<div className="markdown-content">`", "chairman defaults to Gemini". This is what CLAUDE.md is supposed to look like.

**8. affaan-m/everything-claude-code (AgentShield)** — an anti-pattern scanner for CLAUDE.md, settings.json, and MCP configs. Five audit categories, fourteen secret-pattern detectors. Common anti-patterns it surfaces: hard-coded API keys in CLAUDE.md, expired model IDs, vague directives like "be careful".

The eight samples agree on one thing: **a good CLAUDE.md is a fossil layer of project decisions, not a textbook.**

---

## 4. Karpathy's Three Paradigm Shifts

If Anthropic's docs tell us *how* to write, Karpathy spent 2025-2026 redefining *why* we write it.

### Shift 1: Prompt Engineering → Context Engineering

On 25 June 2025, Tobi Lütke argued for "context engineering" over "prompt engineering". Karpathy publicly +1'd and added:

> "In every industrial-strength LLM application, context engineering is the delicate art and science of filling the context window."

The emphasis: **context is a system output, not a static string.** It is generated by a dynamic pipeline immediately before each main LLM call, varying by task. The counterintuitive consequence is that when you write CLAUDE.md, you are not authoring a prompt — you are authoring **a runtime variable in a system**. The variable has to interact with task, session, and time.

### Shift 2: Markdown as Source Code (`program.md`)

Karpathy's `autoresearch` repo (sibling to nanochat) uses an instruction file called **`program.md`** — not AGENTS.md, not CLAUDE.md. The working model is brutal but elegant:

> Humans iterate on `program.md`. The agent iterates on `.py`.

Markdown becomes the source. The agent is compiler and runtime. You no longer write Python; you write a natural-language specification, and the agent generates and refines code from it. This is the concrete shape of "Software 2.0" and "Software 3.0" he has been signaling for years.

Looking back at CLAUDE.md from this angle: it is not a config file. It is **the spec layer of your project's source**. Cutting it from 100 lines to 80 is refactoring.

### Shift 3: Goal-Driven Execution (Declarative > Imperative)

Karpathy's principles, as packaged in `forrestchang/andrej-karpathy-skills` (43k installs in a week), include this counterintuitive line:

> "LLMs are extremely good at looping until they hit a specific goal. Don't tell them how to do it. Give them success criteria and let them run."

Translated to project files: **do not write step-by-step instructions in CLAUDE.md. Write success criteria.** Not "read A, modify B, then run C", but "after the change, `pnpm test` must be green and `git diff` must contain no `console.log`." The latter lets the agent organize its own path. The former hits dead ends and stalls.

This inverts the classic engineering instinct of "draw the flowchart first". **In the agent era, a good spec is declarative.**

---

## 5. Mental Models from the Other Heavyweights

### Armin Ronacher: Logs as APIs, No Dead Ends

The Flask author has two posts that should be required reading: *Agentic Coding Recommendations* and *Agent Design Is Still Hard*. Two rules.

**Logs as APIs.** In debug mode, dump signup confirmation emails straight to stdout. CLAUDE.md tells the agent to read the logs. The agent then completes the entire "register → wait for email → extract link → click" flow on its own — **no human bridge needed**. The technique generalizes: any asynchronous side effect can be exposed to the agent through the same mechanism.

**No dead ends.** The image-generation tool must write into the same virtual filesystem the code-execution tool reads. The toolchain must form a closed loop. Otherwise the agent gets stuck in "I made the image but I cannot read it" paradoxes.

A subtler observation: Claude Code's `TodoWrite` is just an echo of the task list, but **dynamic re-injection beats one-time top-of-context placement**. Things at the top of the context window get diluted by attention; things re-injected after each tool call stay fresh.

### Geoffrey Huntley: stdlib, Ralph, Window Utilization

Geoffrey Huntley treats team conventions as **a programming language's standard library**. Rules live in `.cursor/rules/*.mdc` or `specs/stdlib/*.md`. He puts it bluntly:

> "You are programming the LLM, not using an IDE."

His **Ralph Wiggum technique** (named after the dim Simpsons character) takes this to its extreme:

```bash
while :; do cat PROMPT.md | npx --yes @anthropic-ai/claude-code-cli ...; done
```

One process, one repo, one task per loop. PROMPT.md is the coordination hub. He insists that **there is no perfect prompt** — those CURSED prompts copy-pasted from Hacker News do not work because they were evolved against specific LLM behavior in a specific context.

His core operational metric: **target 40-60% context window utilization**. Above that, output quality drops. The whole *advanced context engineering for coding agents* workflow is built around frequent, intentional compaction.

### Simon Willison: AGENTS.md for Runtime Anomalies

Simon Willison's `simonw/research` repo uses AGENTS.md specifically for **sandbox network limits**. The reminder generalizes: AGENTS.md should describe **runtime environment anomalies**, not just code conventions. If the agent will hit a blocked IP range or an unavailable port, write it down explicitly.

Also a longer-arc observation from him: the "write Markdown, have the agent read it first" pattern actually emerged in 2023 with ChatGPT Code Interpreter. CLAUDE.md is not new. It is a three-year-old pattern that finally got a name and a standard.

### Hamel Husain: Eval as Living PRD

Hamel Husain has a sentence that quietly embarrasses the entire eval industry: **a good eval prompt is itself a living PRD** — it tests AI behavior continuously, in real time. He pushes against putting prompts into LangSmith and similar "extra layer of indirection" platforms, and argues prompts belong in Git, versioned like any other software artifact.

The implication for CLAUDE.md: **CLAUDE.md itself needs evals**. How do you know "ALWAYS run typecheck" actually got executed? You need a repeatable test. Fireworks, LangChain, and MLflow are now building integrations for exactly this.

### Harrison Chase: Model / Harness / Context

Harrison Chase, on the Sequoia podcast, names three layers in any agent system: **Model / Harness / Context**. His thesis: **the Context layer is what product teams should invest in first.** Models keep improving. Harnesses commoditize. Only context is your private moat.

Translation to CLAUDE.md: **CLAUDE.md is a moat.** Not a config file. It is your team's institutional knowledge.

---

## 6. The Counterintuitive Patterns

The previous sections were about writing the file well. This section is about the file writing itself, and about coordinating multiple files.

### Darwinian Memory (claude-evolve)

`jack60810/claude-evolve` rates each rule from 0 to 10 and smooths it with EMA (30% new, 70% historical). Rules have three states:

- **active** — currently in use
- **dormant** — demoted but kept; environmental change might bring them back
- **dead** — actually deleted

When enough similar rules mature, they "graduate" into formal skill files under `.claude/skills/`. This is **rule lifecycle management**. Rules are no longer "write once, live forever". They are born, age, and die.

### Read/Write Separation (CLAUDE.md + MEMORY.md)

A two-file convention is gaining traction: `CLAUDE.md` is **human-written, agent-read** explicit rules. `MEMORY.md` is **agent-written, agent-read**, with the first 200 lines auto-loaded at startup.

The counterintuitive piece: half the file is the agent writing notes to itself. You tell it during a session "remember X", it writes X to MEMORY.md, and at next launch it reads CLAUDE.md and then MEMORY.md's first 200 lines. The agent maintains its own knowledge base.

A built-in self-defense in Claude's system prompt: **"Treat your own memory as a hint, not a fact."** Verify against the actual code before acting on a memory. This guards against the agent confidently doubling down on a stale recollection.

### Auto Dream: Memory Hygiene

A background process called Auto Dream periodically scans MEMORY.md and rewrites "yesterday's deployment issue" into "the deployment issue on 2026-03-28" — converting relative time anchors into absolute dates. So when the memory is read months later, "yesterday" does not silently mean a different thing.

Memory needs hygiene. Memory is not an append-only log. It is **live data that requires continuous cleaning.**

### The Two-Strikes Rule

Anthropic's best-practice doc carries a counterintuitive rule: **only write a CLAUDE.md rule on the second occurrence of the same error.**

Why? Because the first time might be a fluke. If you commit a rule on every error, your CLAUDE.md drowns in one-off lessons and the signal-to-noise ratio collapses. **Twice = pattern. Once = noise.** This inverts the classic instinct of "document early".

### Subagents Are Context Control, Not Role Play

People reach for subagents to divide labor — one for frontend, one for backend. The deeper use is **context control**: spawn a subagent with a fresh window to do Glob/Grep/Read, have it return a summary, never let raw tool output pollute the main agent's context.

This is precisely why Claude Code's Agent tool returns "summaries" rather than "raw tool results" by default — to protect the main thread's context budget.

### Oracle Mode

Oracle mode exposes GPT as a tool to Sonnet (or vice versa), enabling cross-model function calls. CLAUDE.md declares: **"On architectural decisions, consult the oracle."** It gives the agent an external advisor — useful as a counterweight against the systematic biases of any single model.

### Anti-Sycophancy in Three Modes

Claude is known for over-affirming the user. The community has converged on three explicit modes:

- **Mode 1 — Challenge-First**: default to challenging the user's framing
- **Mode 2 — One-Question**: ask one clarifying question at a time
- **Mode 3 — Steel-Man**: argue back with the strongest counter-version of the user's proposal

The counterintuitive piece: not one persona, but **three explicitly summonable thinking modes**. CLAUDE.md says "default to Mode 1; switch to Mode 3 for high-stakes decisions."

### Path-Scoped Rules

YAML frontmatter with a `paths:` field lets a rule load only when matching files are touched — zero token cost otherwise. A React-component rule only injects when `src/components/*.tsx` is in play. This turns "load everything" into "load on demand", and lets CLAUDE.md grow to thousands of lines without inflating any single request's token cost.

### Versioned Changelog at the Top

A `## Changelog v2026-04-26` block at the head of CLAUDE.md prompts the agent to diff against last session and notice rule changes. A small mechanism, but it puts the agent in the loop of rule evolution rather than being blind to it.

---

## 7. The Team Engineering Layer

Solo best practices and team best practices are different problems. Scale up to five, fifty, or five hundred engineers and a new set of issues emerges: rule conflicts, version drift, compliance variance, and no way to measure ROI.

### AGENTS.md as a Cross-Tool Contract

AGENTS.md is now a Linux Foundation-hosted open standard with first-class support across twenty-plus tools. **Vercel's Agent Readability Spec** goes further: it folds AGENTS.md into a site reachability convention, recommending exposure at `/AGENTS.md`, `/.well-known/agents.md`, `/CLAUDE.md`, `/.cursor/rules`, and other paths simultaneously. Like robots.txt and sitemap.xml for search engines — AGENTS.md for AI agents.

Team-level recommendation: **AGENTS.md is the source of truth; CLAUDE.md is a one-line stub: `See @AGENTS.md`** (Anthropic's "import stub" pattern). All tools share one file. Claude-specific quirks live separately. Switching tools requires no reconfiguration. Claude-specific optimizations are not lost.

### CLAUDE.local.md is Deprecated; Use @imports

Note: `CLAUDE.local.md` has been officially deprecated by Anthropic (`anthropics/claude-code` issue #2950). The replacement is `@path/to/file` syntax (up to 5 hops of recursion). The clean pattern for personal overrides is `@~/.claude/personal-overrides.md` plus a `.gitignore` line.

### Spec-Driven: Team-Level Agent OS

Late 2025 saw three spec-driven development camps emerge:

- **GitHub Spec Kit** — six phases (Constitution → Specify → Clarify → Plan → Tasks → Implement), each gated by a human, agent-agnostic.
- **BMAD-METHOD** (43k stars) — twelve-plus role agents (Analyst / PM / Architect / SM / Dev / QA), YAML-orchestrated handoffs, enterprise-scale multi-agent pipeline.
- **Kiro** (an AWS VS Code fork) — spec → design → tasks → impl baked into the IDE, with steering files (product.md / structure.md / tech.md) holding persistent context.

Martin Fowler's comparison piece is the canonical reference. His advice: **don't apply SDD to small bugs — that's a forklift cracking a walnut.** But for tasks that span modules, require multi-turn dialog, or need multi-person/multi-agent coordination, SDD prevents the gradual descent into chaos.

### Eval-Driven CLAUDE.md

Fireworks, LangChain, and MLflow are pushing a new pattern: **treat CLAUDE.md and SKILL.md as objects under test.**

1. Write a binary assertion suite. Run it in a clean Docker environment.
2. Mix LLM judges and rule-based judges: the former for behavior and ordering, the latter for side effects (was the file generated, was the command run).
3. Use MLflow to trace each Claude Code session. Use spans to verify "was this rule actually loaded?" — output alone cannot catch "prereq did not fire" failures.

MindStudio took it further: a self-modification loop where Claude Code rewrites its own CLAUDE.md until the assertion suite is fully green, with QUALITY.md tracking the baseline. CLAUDE.md gains an automated regression suite.

### Observability: Rule ROI

Harrison Chase's team wires LangSmith into Claude Code so they can see **which rules were invoked, which were ignored**. This is the only honest way to measure rule ROI. Combined with PostToolUse hooks and LSP diagnostics (re-injecting type errors after each edit), "did the agent comply" becomes an **observable signal**.

### Meta-CLAUDE.md

`.claude/skills/meta/` holds a skill on **how to edit CLAUDE.md itself** — line caps, dead-link checks, the rule-tier convention. The next agent that wants to change rules reads the meta-skill first, then acts. This is the underlying pattern in Kiro steering and BMAD orchestrator: **rules above rules.**

### GitHub Squad's decisions.md

GitHub's Copilot team described their "Squad" workflow: each architectural decision gets appended as a structured block to a versioned `decisions.md` — an **asynchronous team brain**. Any agent making a new decision reads `decisions.md` first, avoiding rehashed debates and accidental policy reversals.

This is ADR (Architecture Decision Records) ported into the AI collaboration era.

---

## 8. Non-Code Repositories: PARA, Obsidian, Academic Writing

CLAUDE.md serves more than software. Writing, research, knowledge management, courses, blogs, papers — any knowledge work that benefits from agent assistance can use it.

### PARA / Obsidian Vaults

PARA (Projects / Areas / Resources / Archive) is Tiago Forte's PKM framework. A typical CLAUDE.md for an Obsidian PARA vault contains:

- **Vault semantics** — what each top-level folder means (Inbox is uncategorized; Projects have deadlines; Areas are ongoing; Resources are reference; Archive is frozen).
- **Frontmatter standards** — YAML field conventions: `title`, `date`, `tags`, `status`, `source`, `para-type`.
- **Triage decision tree** — how Claude classifies a new Inbox file into the four PARA quadrants.
- **Tone/voice** — diary vs research note vs project doc, each with its own register.
- **Weekly review workflow** — clearing Inbox into the four quadrants every Sunday.

Reference repos: `ballred/obsidian-claude-pkm` (a complete PARA starter kit), `AgriciDaniel/claude-obsidian` (a Karpathy-style LLM Wiki), and `danielrosehill/Claude-Code-Projects-Index` (a non-code use-case anthology).

Mauricio Gomes, in *Teaching Claude Code My Obsidian Vault*, leaves a useful warning: **review and update the vault's CLAUDE.md monthly**. Otherwise it rots as the vault evolves.

### Academic Writing

Three repos define the academic-writing playbook: K-Dense-AI/claude-scientific-writer, Galaxy-Dawn/claude-scholar, and Imbad0202/academic-research-skills. Recurring patterns:

- **Style calibration** — feed three of your old papers so Claude internalizes voice and citation habits.
- **Priority** — discipline conventions > journal style > personal preference.
- **Citation red lines** — explicit "never use unverified citations"; claim-citation alignment checks; no hallucinated BibTeX entries.
- **AI-use disclosure** — declare in Methods what Claude was used for.
- **Writing quality check** — banned-word lists (twenty-five AI-tell-tale words), em-dashes ≤ 3, sentence-length burstiness checks.

### Blog and Content Repos

GitHub Blog's *How to write a great agents.md* — distilling lessons from 2,500 repos — finds these patterns recur:

- Strong modal verbs: ALWAYS / NEVER / MUST.
- Explicit Personality block (Tone / Style / Voice).
- Output format templates (H1 / meta / H2 sections / CTA / tags).
- Vocabulary white/black-lists ("challenge" replaces "problem").

HumanLayer recommends a blog AGENTS.md under 60 lines. Community ceiling: under 300.

---

## 9. The Chinese Community Lens

Chinese developers write CLAUDE.md with the same shape but with two unique twists.

**The "800-character" anchor.** A Zhihu author's careful experiment — 3,000 → 1,000 helps; → 800 is best; → 400 loses critical info — converts cleanly to the 60-250 line range from English-language sources.

**Four-tool fragmentation** is the pain Chinese developers face most acutely: Cursor + Claude Code + **Trae** (ByteDance) + **通义灵码** (Alibaba) all need configuration. Repos like `Mr-chen-05/rules-2.1-optimized` exist precisely to one-shot sync rules across Augment / Cursor / Claude Code / Trae.

**Bilingual skill structures**: `hong111109/humanizer` separates `zh/` and `en/` subdirectories, auto-detecting input language. A pattern that exists almost exclusively in the Chinese ecosystem.

**"Use Chinese for replies"** is a near-standard line in nearly every Chinese developer's global CLAUDE.md — together with toolchain preferences ("Python uses uv; Node uses pnpm"). Pragmatic, terse, and load-bearing.

**Baoyu (@dotey)** is the most-followed Chinese AI-coding voice. He recently spotlighted `shareAI-lab/learn-claude-code` — **30 lines of code that reproduce a nano Claude Code**, helping developers see through the harness. Another of his lines: "Vibe Coding is not magic." Make it work by hand first; iterate in small versions (scooter → bicycle → motorcycle → car). The metaphor maps neatly onto CLAUDE.md evolution: **rough first, refined later**, never expecting perfection in one shot.

**WeChat publishing pipelines** — capturing trending topics, drafting, formatting, pushing to draft inbox — are a non-code use case with virtually no parallel in the English-speaking world. See `oaker-io/wewrite` and `geekjourneyx/md2wechat-skill`.

---

## 10. The Practical Checklist

Take everything above and make it actionable.

### Global `~/.claude/CLAUDE.md`

Keep it minimal. Only **cross-project preferences**:

1. Language ("Use Chinese for replies").
2. Package manager defaults ("Python uses uv; Node uses pnpm").
3. Privacy ("All pushed repos default to private").
4. Collaboration baselines ("Interaction-detail changes require corresponding e2e tests").
5. Self-improvement mechanism ("Append a pitfall rule after each failed bash command").

Target line count: **under 10**. This file loads on every session. Shorter is better.

### Vault Root `CLAUDE.md`

For an Obsidian-style PARA vault, include:

1. PARA semantics + classification decision tree.
2. Frontmatter standards (title / date / tags / status / source).
3. Language priority (Chinese first; preserve original quotes).
4. No emoji (consistent with global rule).
5. Weekly Inbox-clearing workflow.

### Code Project `AGENTS.md` + `CLAUDE.md`

For a backend repo:

- `AGENTS.md` is the main file: build commands, test commands, code style, common pitfalls, lessons learned.
- `CLAUDE.md` is one line: `See @AGENTS.md`.
- `.agents/decisions.md` versions architectural decisions.
- `.claude/skills/meta/claude-md-editing.md` formalizes how to edit CLAUDE.md itself.

### Adopt the Two-Strikes Rule

Change "write a rule on every bash failure" to **"write a rule only on the second occurrence of the same failure"**. First occurrence: log it in MEMORY.md as "observed X". Second occurrence: promote it to AGENTS.md as a formal rule. Signal-to-noise ratio jumps significantly.

### Oracle Mode (Optional)

For high-stakes architecture decisions, have Claude consult GPT. Declare the trigger in AGENTS.md:

> When deciding on system architecture that affects > 3 modules, consult the GPT oracle via the `oracle` tool, and record the exchange in `decisions.md`.

### Anti-Pattern Checklist

- ✗ Stuffing CLAUDE.md as if it were documentation (every line costs context every turn).
- ✗ Hard-coding API keys or expired model IDs (`claude-3-opus`).
- ✗ Scenario-specific rules ("how to design a new orders schema" — useless when you are not working on orders).
- ✗ Repeating the README's project description.
- ✗ Vague verbs ("be careful", "be nice").
- ✓ Review and prune monthly.
- ✓ Rules have a lifecycle: active / dormant / dead.
- ✓ Failures into pitfalls; successes into lessons learned.

---

## 11. Predictions for 2026

If 2025 was the inception year for files-written-for-AI, what does 2026 look like? Three loosely-held but directionally-confident guesses.

**One: CLAUDE.md fragments into layered files.** Just as code fragmented from "one file" into "source + config + tests + migrations", CLAUDE.md will split into persona / rules / memory / decisions / pitfalls — five layers, each with its own lifecycle and maintenance cadence.

**Two: rules get formally versioned and signed.** Like Docker images with tags and hashes, future AGENTS.md will carry semver and checksums. "This agent decision was made under AGENTS.md v2.3.1" becomes auditable. Critical for compliance domains — finance, medical.

**Three: a marketplace for CLAUDE.md emerges.** `awesome-claude-code` and `aitmpl.com` are the free-sharing layer today. Next: paid AGENTS.md packs targeting specific stacks — Stripe integrations, Supabase, Next.js + Drizzle + Clerk — required like npm packages.

---

## 12. Closing: From Prompt to Context, From File to System

Back to the opening question: how much CLAUDE.md should you write?

If 2024's answer was "as detailed as possible," the 2026 answer is **"as little as possible, but as alive as possible."** Little, because every line consumes the agent's attention budget. Alive, because rules are not a static contract but **continuously evolving institutional knowledge.**

Karpathy says Markdown is source code. Huntley says you are programming the LLM. Chase says context is the team's moat. They are saying the same thing: **how you write CLAUDE.md is, fundamentally, the contract you sign with your AI collaborator.** Sign it well and the agent is a competent new colleague. Sign it badly and the agent is an amnesiac, sycophantic, occasionally rogue intern.

So do not treat it as a config file. Treat it as **the most important specification document in your team or project**. Review it like code. Refactor it like code. Test it like code. Retire stale parts like code.

Here is to writing a CLAUDE.md that lasts three years.

---

## References

- [agents.md — official site](https://agents.md/)
- [Anthropic Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [HumanLayer: Writing a good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- [Karpathy on context engineering (X)](https://x.com/karpathy/status/1937902205765607626)
- [karpathy/autoresearch — program.md paradigm](https://github.com/karpathy/autoresearch)
- [karpathy/llm-council CLAUDE.md](https://github.com/karpathy/llm-council/blob/master/CLAUDE.md)
- [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)
- [Armin Ronacher — Agentic Coding Recommendations](https://lucumr.pocoo.org/2025/6/12/agentic-coding/)
- [Geoffrey Huntley — stdlib](https://ghuntley.com/stdlib/) and [Ralph](https://ghuntley.com/ralph/)
- [Simon Willison — async code research](https://simonwillison.net/2025/Nov/6/async-code-research/)
- [Hamel Husain — Evals Skills for Coding Agents](https://hamel.dev/blog/posts/evals-skills/)
- [Harrison Chase on Context Engineering (Sequoia)](https://sequoiacap.com/podcast/context-engineering-our-way-to-long-horizon-agents-langchains-harrison-chase/)
- [jack60810/claude-evolve](https://github.com/jack60810/claude-evolve)
- [Martin Fowler — SDD Tools Comparison](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
- [GitHub Spec Kit](https://github.com/github/spec-kit)
- [BMAD-METHOD](https://github.com/bmadcode/BMAD-METHOD)
- [GitHub Blog — How Squad coordinates AI agents](https://github.blog/ai-and-ml/github-copilot/how-squad-runs-coordinated-ai-agents-inside-your-repository/)
- [ballred/obsidian-claude-pkm](https://github.com/ballred/obsidian-claude-pkm)
- [Mr-chen-05/rules-2.1-optimized](https://github.com/Mr-chen-05/rules-2.1-optimized)
- [Baoyu: shareAI-lab/learn-claude-code](https://github.com/shareAI-lab/learn-claude-code)

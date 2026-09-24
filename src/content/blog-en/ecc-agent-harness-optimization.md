---
title: "ECC: A Verifiable Harness Layer for Claude Code, Codex, and Cursor"
description: "A teardown of affaan-m/ECC—how Skills, Hooks, Instincts, Memory Vault, and AgentShield tackle performance, memory, and security; what actually plugs into Claude Code/Codex/Cursor; what enterprises can copy versus roadmap hype."
pubDate: 2026-09-24T00:00:00+08:00
author: "Remy"
tags: ["ECC", "agent-harness", "Claude Code", "Codex", "Cursor", "Agent Skills", "memory", "security", "developer-tools"]
lang: "en"
translatedFrom: "ecc-agent-harness-optimization"
---

Coding agents keep getting better at writing code. Teams keep getting worse at answering three harder questions: **where the money went, what was remembered, and who is allowed to run dangerous actions.** Stuffing “save tokens / remember lessons / don’t delete things” into one system prompt looks fine in a demo and usually collapses on three points in production—context crushed by rules and MCP descriptions, cross-session memory that cannot be audited, and security policy that exists only in the model’s hope that it will “remember.”

[affaan-m/ECC](https://github.com/affaan-m/ECC) (Everything Claude Code) opens another path: it does not replace the core loop of Claude Code, Codex, or Cursor. It installs a **harness operating system** around that loop—Skills, Agents, Hooks, Rules, Instincts, a Memory Vault, and AgentShield aimed at the configuration surface. The README slogan is blunt:

> Optimize the context window. Persist everything else.

As of **2026-09-24** (Asia/Shanghai), the GitHub API shows about **266,395** stars and about **38,814** forks, licensed under **MIT**. The repo root `VERSION` and README install examples point at **ecc-universal 2.2.2**; npm `latest` and the GitHub Releases page visible at fetch time showed **v2.2.1**. Everything below follows the public README, `docs/`, the security guide, and design docs. **Stars are not a quality proof, and unpublished benchmarks are not invented here.** The tree is huge (~52k size with a large skills/agents catalog); this article only verifies subsystems you can check in those documents—it does not pretend to have read the entire monorepo.

Related reading on this site: the [Claude Code agent harness](/blog/inside-claude-code-agent-harness/), the [Agent Skills starter](/blog/agentskills-io-starter-guide/), [Cloudflare’s security-audit-skill](/blog/cloudflare-security-audit-skill-for-coding-agents/), [Jev × Claude Code](/blog/jev-claude-code-10x-and-25-lines/), and the failure catalog in [Agents of Chaos](/blog/agents-of-chaos-ai-agent-failures/). On the research side, see the on-site companion [Grow the Harness, Not the Context](/blog/grow-the-harness-not-the-context/) (source paper [arXiv:2609.26760](https://arxiv.org/abs/2609.26760)).

## It optimizes the harness, not the base model

Our [Agent Harness pattern](/blog/inside-claude-code-agent-harness/) piece argued that the gap between textbook ReAct and production loops *is* harness engineering. ECC does not claim a new `query.ts`. It assumes you already have a coding agent that calls tools, then answers:

1. **Performance (mostly token / context economics)** — model routing, thinking budgets, earlier compaction, MCP/tool caps, SessionStart injection limits.
2. **Memory** — session summaries and instincts (atomic behaviors with confidence); a cross-harness Memory Vault (inspectable Markdown, not a raw vendor transcript dump).
3. **Security** — treat hooks / MCP / skills / permissions as a scannable config attack surface; GateGuard blocks destructive shell; AgentShield scans the harness itself.

When those three sit in one marketing sentence they sound magical. In the docs the boundaries are clearer:

| Layer | What ECC actually ships (documented) | What it is not |
| --- | --- | --- |
| Skills / Agents | On-demand workflows and delegated roles | A stronger base model |
| Hooks | Deterministic scripts outside model context | A sandbox / isolation runtime by itself |
| Instincts | Confidence-scored short behaviors from sessions | Reviewed company policy |
| Memory Vault | `ecc.memory.v1` Markdown + CLI/MCP | Executable instructions or silently promoted rules |
| AgentShield | A scanner for prompts/hooks/MCP/permissions/secrets | A substitute for sandboxing and identity isolation |

The README contrast table is equally concrete: without a system, “please use TDD” is an instruction the model may forget; with ECC, TDD becomes a gated RED → GREEN → REFACTOR workflow with evidence, review runs in a **fresh context**, quality checks can live in hooks, and AgentShield treats the harness **itself** as an attack surface.

## How the pieces divide work: do not pour the whole repo into context

The public catalog claims on the order of **68** agents, **292** skills, **94** compatibility slash commands, plus hooks, rules, scripts, and multi-harness adapter trees (`.claude-plugin/`, `.codex/`, `.cursor/`, `.opencode/`, and more). The root is the source of truth; platform adapters package or map the same workflows instead of maintaining separate copies.

README division of labor:

| Concept | Job | Context behavior |
| --- | --- | --- |
| Skills | Reusable workflows (TDD, security review, deep research) | Loaded when the task needs them |
| Agents | Scoped workers with their own context and tool permissions | Isolate planning, implementation, and review |
| Rules | Durable project or language standards | **Always loaded**—install selectively |
| Hooks | Scripts on harness events | Run outside the model context |
| Instincts | Patterns learned from real sessions with confidence scores | Recalled when relevant |

That aligns with the [Agent Skills starter](/blog/agentskills-io-starter-guide/): capability should be distributable and bounded. Cloudflare’s [security-audit-skill](/blog/cloudflare-security-audit-skill-for-coding-agents/) is a vertical high-intensity sample; ECC is a horizontal pack of many such workflows.

**Do not stack install methods.** You may install ECC into Claude Code and Codex together, but each harness gets one channel. Stacking plugin + full manual copy duplicates skills and hooks. Recovery starts at Reset / Uninstall.

## Performance: documented settings and habits, not a mystery accelerator

“Performance” in ECC is first **token and context quality**, not a claim that inference latency dropped by some unpublished percentage. `docs/token-optimization.md` and the README recommend defaults for most users, including:

| Setting | Common default | Recommended | Documented effect |
| --- | --- | --- | --- |
| `model` | opus | **sonnet** | ~60% cost cut; handles ~80%+ of coding tasks |
| `MAX_THINKING_TOKENS` | 31,999 | **10,000** | ~70% cut in hidden thinking cost; `0` for trivia |
| `CLAUDE_CODE_SUBAGENT_MODEL` | inherits main | **haiku** | Cheaper exploration / file reads / test runs |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | 95 | **50** (community caveats) | Compact earlier; some builds reportedly only allow lowering the threshold |
| MCP / tools | — | &lt;10 MCPs, &lt;80 tools | Avoid shrinking a 200k window toward ~70k via tool descriptions |

Those percentages are **ECC’s own documentation claims**, not results we re-measured. The docs also admit community reports that auto-compact overrides behave inconsistently on some Claude Code builds—if so, remove the override and rely on manual `/compact` plus the `strategic-compact` skill.

Daily habits are deliberately boring: `/model sonnet` by default; `/model opus` for hard architecture; `/clear` between unrelated tasks; `/compact` after research, milestones, or abandoned approaches; **do not compact mid-implementation** (you lose names, paths, and partial state). Agent Teams duplicate context windows—use them only when parallelism has clear value; for simple sequential work, subagents are cheaper.

What enterprises can copy immediately is often not “install all 292 skills,” but:

1. **Cap SessionStart** — `ECC_SESSION_START_MAX_CHARS` (default 8000); local/small models can set `ECC_SESSION_START_CONTEXT=off`.
2. **Gate instinct injection** — default max 6 instincts, confidence floor 0.7, optional project/stack relevance ranking.
3. **Minimal / no-hooks surface** — `npx ecc-universal@2.2.2 install --profile minimal --target claude` excludes `hooks-runtime`; add hooks later with an explicit `--enable-hooks`.
4. **Selective rules** — rules always consume context; split language-agnostic `common/` from language packs.

That points the same direction as arXiv:2609.26760: **grow the harness** (reusable specialists / skills / verifiers) **before** growing the context dump. ECC gives an installable engineering checklist; the paper gives a publishable abstraction. Both warn that “paste a longer CLAUDE.md” is not a strategy.

## Memory: two mechanisms—do not mash them into “the agent remembers”

ECC docs describe at least two memory systems that marketing language likes to fuse.

### 1) Continuous Learning v2: Instincts

`skills/continuous-learning-v2/SKILL.md` turns session observation into atomic **instincts**: one trigger, one action, confidence 0.3–0.9, with domain and evidence. v2.1 defaults to **project scope** (git remote / path hash) so React habits do not contaminate a Python repo; repeated cross-project patterns can promote to global. Evolution is instincts → cluster → skill/command/agent, not one Stop hook emitting a giant skill.

Commands include `/instinct-status`, `/instinct-import`, `/instinct-export`, `/evolve`, `/prune`, and more. SessionStart injection is bounded by `ECC_MAX_INJECTED_INSTINCTS` and `ECC_INSTINCT_CONFIDENCE_THRESHOLD`—the real performance dial inside “memory”: the more you learn, the easier it is to fatten context.

### 2) Memory Vault: inspectable cross-harness handoff

The README and `docs/design/ecc-memory-vault.md` define Memory Vault as something else: local-first `ecc.memory.v1` Markdown under `.ecc/memory/` (project/team) and `~/.ecc/memory/` (user). CLI and optional MCP (`memory_save|search|read|doctor`) share one contract. Constraints worth copying into enterprise standards:

- **Memory is unreviewed context, not executable policy**; first-release entries are `trust: "unreviewed"` and must not silently become rules/skills.
- **Create-only writes**; supersession is a new document with explicit links.
- Known secret shapes are rejected; readers do not follow symlinks.
- Project memory uses fail-closed `.gitignore`; team scope remains unreviewed even after commit.
- MCP identity is bound by server-side `ECC_MEMORY_HARNESS` (callers cannot spoof it); user scope also needs `ECC_MEMORY_ALLOW_USER_SCOPE=1`.
- The threat model honestly says it is **not** a security boundary between concurrent processes of the same OS user.

Plugin / minimal installs do **not** put Memory Vault on `PATH` automatically; install `ecc-universal` globally, then `ecc memory init`. That sentence belongs in an ops runbook more than any star count does.

The security guide is sharper still: persistent memory is useful and also gasoline. Microsoft’s recommendation-poisoning work and in-the-wild indirect injection show a payload need not win in one shot—it can plant fragments, wait, and reassemble. High-risk workflows that read foreign attachments all day should disable or rotate long-lived memory. That rhymes with [Agents of Chaos](/blog/agents-of-chaos-ai-agent-failures/): memory is capability and a failure amplifier.

## Security: scan the harness itself, plus a minimum bar

ECC’s security story has three layers; “we have a scanner” is only one of them.

**Distribution.** Trust only official surfaces: GitHub `affaan-m/ECC`, npm `ecc-universal` / `ecc-agentshield`, plugin slug `ecc@ecc`, the GitHub App, and `ecc.tools`. SECURITY.md names unofficial packages that reuse ECC metadata and tells you not to install them until verified. Supply-chain rules include pinning Actions to commit SHAs and avoiding shelling untrusted GitHub context into `run:` blocks.

**Runtime gates.** README: GateGuard blocks destructive shell before execution (including `rm`, dangerous `git checkout`, destructive `find -exec`); CI runs supply-chain IOC scanning; `/security-scan` uses AgentShield. Hooks can run shell, MCP servers can hold credentials, and project instructions enter context—treat all three as executable configuration. After a plugin install, do not copy `hooks/hooks.json` into `~/.claude/settings.json` or hooks may fire twice.

**Methodology.** `the-security-guide.md` lists sandboxing, sanitization, least agency, observability, kill switches, and narrow memory as the **2026 minimum bar** for autonomous agents, citing public Claude Code CVEs, Snyk’s ToxicSkills findings (large injection sample rates in public skills), and exposed OpenClaw-family instances. AgentShield’s job here is clear: catch suspicious hooks, hidden injection patterns, over-broad permissions, risky MCP, and secret exposure—**complement human review of the config surface**, not replace containers and separate identities.

That contrasts usefully with Cloudflare’s [security-audit-skill](/blog/cloudflare-security-audit-skill-for-coding-agents/): the latter turns “audit the target code” into verifiable phases and three verdicts; ECC / AgentShield lean toward “audit the configuration and toolchain you gave the agent.” Enterprises need both: one for artifacts, one for the harness surface.

Architecture Non-Goals are also useful: no hosted telemetry before the local event model is solid; **do not auto-mutate user harness configs without verifier evidence**; do not treat any single harness as the canonical interface. Much of the “Self-Improving Harness Loop” and “AgentShield Enterprise” shape in the 2.0 reference architecture is still backlog—keep **shipped** capability separate from **vision**.

## How it plugs into Claude Code, Codex, and Cursor

The README platform matrix is more honest than “supports everything”:

| Harness | Status (doc wording) | Recommended distribution | Important limit |
| --- | --- | --- | --- |
| Claude Code | Stable primary | Plugin or selective install | Plugin advertises the installed catalog to the model; use selective/manual when context is tight; some shell skills are not portable across OSes |
| Codex | Supported native plugin | Codex marketplace / repo config | Native hooks need explicit trust; they do not use Claude hook profiles; legacy sync is compatibility-only |
| Cursor | Beta project adapter | Selective install into `.cursor/` | Agent discovery varies by Cursor build; hook sets are not fully aligned yet (public issue #2419) |
| OpenCode and others | Beta / Experimental | Per-target selective install | **No claim** of Claude feature parity |
| GitHub Copilot | Instruction-only | Checked-in instructions | No ECC hooks, runtime agents, or native skill discovery |

Install entry points (examples from docs—re-check the registry when you pin):

```bash
# Guided Claude Code plugin setup
npx ecc-universal@2.2.2 setup

# Multi-harness guided install (Claude / Codex / Kimi)
npx ecc-universal@2.2.2 install --guided

# Low-context, no hooks
npx ecc-universal@2.2.2 install --profile minimal --target claude
```

When Claude Code and Cursor share a machine, set `ECC_AGENT_DATA_HOME` so session summaries and learned skills do not overwrite each other. Native Windows still has open defects for continuous-learning v2’s observer and some memory writes; WSL / Git Bash are more reliable—that is an ops fact, not fine print.

## What enterprises can copy versus what turns into hype

**Worth copying into an internal platform:**

1. **Separation-of-duties contract** — Skills (on demand) / Rules (always-on, choose carefully) / Hooks (enforce outside context) / Agents (fresh-context review) in your AGENTS.md templates.
2. **Instinct promotion gates** — confidence, project scope, cluster before skill; ban “end of session → global policy.”
3. **Memory Vault trust model** — unreviewed, create-only, secret rejection, identity binding, doctor failure means no pretend-complete reads.
4. **Token budget checklist** — main model / thinking / subagent / SessionStart chars / MCP count.
5. **Config-surface scanning** — treat hooks, MCP, and skills as supply-chain artifacts; pair with Cloudflare-style split of discovery vs confirmation.
6. **Install state machine** — profiles, dry-run, doctor, repair, uninstall; never silently install into every detected harness.

**Easy to overclaim:**

1. **Stars and “operating system” language** — stars prove reach, not that your monorepo can absorb 292 skills.
2. **Install everything once** — the docs warn the plugin advertises the catalog; tight contexts need selective installs.
3. **Cross-harness parity** — Cursor / Copilot / experimental adapters document limits; one config does not rule them all.
4. **Memory / Instincts as policy** — docs repeatedly require human promotion into governed docs.
5. **AgentShield as a sandbox** — scanning ≠ isolation; the minimum bar still needs separate identities, short-lived credentials, default no egress, and kill switches.
6. **Roadmap as GA** — enterprise policy packs, SARIF, and self-improving loops in the 2.0 architecture are largely still to be proven.

The contrast with [Jev × Claude Code](/blog/jev-claude-code-10x-and-25-lines/) helps: Jev-line writing stresses splitting judgment from generation with small verifiable contracts; ECC stresses packing engineering ritual into the harness. Both push against the same failure—one bloated context acting as athlete, referee, and archive at once.

## Not just a longer CLAUDE.md

Many teams’ first harness “optimization” is three instincts: make the rules longer, enable more MCPs, and stuff “remember last time” into user-global memory. Short-term gains often reverse into the same failure—**always-on context becomes a landfill**—while the steps that should be forced (red tests, fresh-context review, dangerous-command gates) still rely on the model’s manners.

ECC’s bias runs the other way:

- **Always-on should be few and hard** (small rules, hook gates).
- **On-demand should be large and discoverable** (big skills/agents trees, loaded when triggered).
- **Cross-session state should be inspectable** (instincts with confidence and evidence; Memory Vault as Markdown, not a hidden vector DB as sole truth).
- **Promotion needs humans or verifiers** (memory does not silently become policy; architecture Non-Goals forbid auto-mutating user configs without verifier evidence).

## Selective install: the real engineering problem of a huge tree

ECC’s size is a product choice: multi-language review, TDD, security, ML, content, and ops workflows. For a hobbyist, “install all” is mostly disk noise; for a platform team, **install all is almost always an incident**—the model sees a huge skill/agent advertising surface, SessionStart and rules stack on top, and context thins before any real work.

`docs/SELECTIVE-INSTALL-ARCHITECTURE.md` is frank: profiles/modules exist, coupling remains; the target is layered module catalogs, profile catalogs, and target adapters with `list-installed` / `uninstall` / `doctor` / `repair`. What matters for readers **now**:

1. Choose capabilities with `--profile` and `--with capability:...`, not “whatever we detected.”
2. Guided install preflights and asks for final confirmation; automation must pin scope, hook profile, and harness.
3. Materializing hooks requires explicit `--enable-hooks` or `--no-hooks`, or the installer stops—a contract against silently gaining execution power.
4. One channel per harness; prefer uninstall/repair over stacking.

Raise selective install to a platform principle: even a beautiful internal skill catalog should default to a minimal set; expansion goes through change review, not a developer’s accidental `npx` success.

## Verification loops and fresh-context review

The longform materials put verification loops, eval-harness, and checkpoints beside memory and parallelization. The claim is plain: **a result is not just code—it is an evidence trail** (plan, failing test, passing test, review findings, final checks). Review agents use limited tools and a separate context to find regressions and blind spots; the implementation context is no longer sole author and sole referee.

That is isomorphic to Cloudflare security-audit-skill’s “fresh verifier tries to disprove candidates,” and opposite the common [Agents of Chaos](/blog/agents-of-chaos-ai-agent-failures/) failure of same-session self-confirmation. If you only copy ECC skill names and skip “fresh context + structured evidence,” you mostly buy longer transcripts.

Parallelization (worktrees, multi-instance) is documented with an equally loud cost warning: Agent Teams duplicate windows; they pay off for multi-module or parallel review work. Platform teams should make parallelism an explicit switch with a budget, not a default stunt.

## Hook profiles and the edge of “deterministic enforcement”

Hooks are ECC’s hardest layer relative to prompt-only norms: match tool events, run scripts—for example warn on `console.log` in `*.ts` edits. Runtime knobs include `ECC_HOOK_PROFILE` and `ECC_DISABLED_HOOKS`. Docs also warn that hooks expand the attack surface; modern Claude Code auto-loads plugin `hooks/hooks.json`, and duplicate declaration or a second manual copy has caused repeated fix/revert pain.

Enterprise boundaries should read:

- **Allowed hooks:** read-only checks, warnings, known destructive-pattern denials, audit logs.
- **High-risk hooks:** anything that mutates the repo, touches secrets, or opens egress needs change review and regression with AgentShield / internal scanners.
- **Local / low-context models:** prefer disabling SessionStart extras, even a no-hooks profile, then add back deliberately.

“Deterministic enforcement” enforces **the policy you encoded in scripts**; that policy still needs version control and review. Blindly trusting a third-party skill repo’s hooks expands the supply chain to every tool call.

## Version pins and supply chain: pin what you reviewed

Public materials show both **2.2.2** (repo `VERSION`, README examples) and **v2.2.1** (GitHub Releases / npm `latest` at fetch time). Practical meaning:

1. A version pin is **reproducibility**, not a security audit; the README says so—review source and registry integrity before running package code.
2. Enterprise pipelines should pin a **reviewed** tag / commit / npm version, with uninstall and rollback paths; do not silently chase `latest`.
3. Install only from official surfaces; SECURITY.md already names unofficial lookalikes.
4. `mcp-configs/mcp-servers.json` is a template: real secrets come from env vars or a secrets manager—not from user config that ends up in `claude doctor`, screenshots, or issues.

Treat “install ECC” as a supply-chain change. Stars describe spread; change review, pinned versions, and official distribution surfaces describe whether you dare put it in every developer’s default environment.

## How to read this against other posts on the site

Suggested reading order on this site: [Claude Code agent harness](/blog/inside-claude-code-agent-harness/) → this post → [Agent Skills starter](/blog/agentskills-io-starter-guide/) → [Cloudflare security-audit-skill](/blog/cloudflare-security-audit-skill-for-coding-agents/) → [Jev × Claude Code](/blog/jev-claude-code-10x-and-25-lines/) → [Agents of Chaos](/blog/agents-of-chaos-ai-agent-failures/). Keep [arXiv:2609.26760](https://arxiv.org/abs/2609.26760) as an external pointer: grow the harness, not unbounded context. Fit depends on selective install, promotion gates, and config scanning—not today’s star count.

## A runbook checklist you can paste

1. Read the [Platform Support](https://github.com/affaan-m/ECC#platform-support) matrix; pick **one** primary harness and one install channel.
2. Start from `minimal` or `core --no-hooks`; verify `/plugin list` or target directories before enabling hooks.
3. Write token defaults and `ECC_SESSION_START_*` / instinct thresholds; subscription users may disable API-rate cost warnings while keeping context-exhaustion warnings.
4. Install Memory Vault runtime only when you need cross-tool handoff; use `--body-file` for bodies; human-review team memories before commit.
5. Scan installed hooks/MCP/skills with AgentShield (or your own config scanner); close gaps from the security guide’s minimum bar (sandbox + identity).
6. Promote only repeated, evidenced instincts into internal skills; treat the rest as drafts.
7. Periodically clear context the `/context-budget` way: disable idle MCPs and unused rules instead of pasting a longer master doctrine.

## Closing

ECC earns a long-horizon write-up not because it briefly topped a star chart, but because it splits harness optimization into **installable, configurable, refusable, auditable** subsystems: context economics, gated learning memory, cross-tool unreviewed handoff, and a scanner that treats configuration as an attack surface. What enterprises should copy are those contracts and checklists. What they should distrust is mistaking catalog size, roadmap slides, and stars for finished production hardening.

The core loop still belongs to Claude Code, Codex, or Cursor—see the on-site [Agent Harness](/blog/inside-claude-code-agent-harness/) post. ECC’s job is to turn “save, remember, defend” from prayer-shaped prompts into engineering objects around that loop. Optimize the context window; persist everything else somewhere you can inspect. That sentence outlasts any soft launch copy.

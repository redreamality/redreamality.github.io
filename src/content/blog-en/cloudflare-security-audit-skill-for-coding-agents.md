---
title: "Cloudflare’s security-audit-skill: A Verifiable Security-Audit Workflow for Coding Agents"
description: "A teardown of cloudflare/security-audit-skill: Skill distribution, six audit phases, confirmed / needs_validation / rejected verdicts, adversarial validation, and fail-open behavior without a sandbox—plus install steps and enterprise limits."
pubDate: 2026-09-24T00:00:00+08:00
author: "Remy"
tags: ["Cloudflare", "Security", "Agent Skills", "Security Audit", "Harness", "Developer Tools"]
lang: "en"
translatedFrom: "cloudflare-security-audit-skill-for-coding-agents"
---

Coding agents are getting better at changing code. Security teams are getting worse at answering a sharper question: **did this change introduce an exploitable boundary break?** Stuffing a whole audit methodology into one system prompt looks fine for a demo and usually collapses on three points in production—coverage you cannot explain, conclusions you cannot re-check, and an agent that is too eager to execute target code. Cloudflare’s open-source [security-audit-skill](https://github.com/cloudflare/security-audit-skill) shows another path: package the audit as an installable **Agent Skill**, split discovery from confirmation with structured artifacts and independent verification, and treat the Skill as the single-repo seed of Cloudflare’s later fleet vulnerability harness, as described in [Build your own vulnerability harness](https://blog.cloudflare.com/build-your-own-vulnerability-harness).

As of 2026-09-24, the repository has about **20,703** stars and about **1,176** forks, licensed under **MIT**. Stars and workflow details below follow the public README, `SKILL.md`, and Cloudflare’s blog post. Internal hit rates, dollar costs, and other unpublished metrics are not invented here.

Related reading on this site: [Agent Skills starter](/blog/agentskills-io-starter-guide/), [AI coding agents in real vulnerability research](/blog/anthropic-mozilla-ai-vulnerability-research/), [Open Code Review’s deterministic pipeline](/blog/alibaba-open-code-review-deterministic-pipeline/), the [Claude Code agent harness](/blog/inside-claude-code-agent-harness/), and the judgment-versus-generation boundary in [Jev × Claude Code](/blog/jev-claude-code-10x-and-25-lines/).

## Why a Skill, not another security bot

A Skill solves **distribution and triggering**: when to activate, which phases to run, which files to emit, and what counts as confirmation—written so a coding agent can load it—rather than hanging another GitHub-only comment bot. The [Agent Skills starter](/blog/agentskills-io-starter-guide/) covers Skills as distributable capability packs; security-audit-skill is a high-intensity vertical sample—many files, hard phases, and validators included.

The README is blunt: this Skill seeded Cloudflare’s vulnerability discovery harness; the harness later became a multi-stage, fleet-wide system; the Skill remains the **single-repo starting point** it evolved from. For enterprise readers, that sentence matters more than the star count: you are copying an installable audit workflow, not a SaaS that already scanned your fleet.

The contrast with Open Code Review helps. OCR turns the must-not-fail steps of **code review** (file selection, bundling, positioning) into deterministic engineering; security-audit-skill turns the must-not-mix steps of **security audit** (coverage ledger, isolated hunting, adversarial validation, structured verdicts) into a Skill workflow. One leans PR gating; the other leans vulnerability hunting and reporting. Both answer the same class of problem—do not let the model be athlete and referee at once.

## What the six phases do (and why three verdicts matter)

Per the repository README, a full audit runs in six phases:

1. **Reconnaissance** — map architecture, trust boundaries, input surfaces, and prior evidence into deterministic coverage artifacts: `architecture.md` and `coverage-ledger.json`.
2. **Coverage-led hunting** — assign isolated hunters from ledger units, record checks, and use coverage critics to find gaps.
3. **Candidate validation** — hand every unique candidate to a **fresh** verifier whose job is to disprove it.
4. **Structured output** — write `confirmed`, `needs_validation`, and `rejected` records to `findings.json`, validated against `report-schema.json`.
5. **Independent record verification** — fresh agents verify final source claims; material replacements get another independent verifier.
6. **Target-neutral reporting** — derive `REPORT.md`, `FINDINGS-DETAIL.md`, and `NEEDS-VALIDATION.md` from verified records and the coverage ledger.

The parent runs `validate-coverage-ledger.cjs` after creating the ledger and after each later update; it runs `validate-findings.cjs` in Phase 4 and again after every Phase 5 replacement. That is not decoration: JSON Schema plus zero-dependency validators pull “what a report looks like” out of free-form model prose and back into a regressable contract.

Keep the three verdicts distinct:

| Verdict | Meaning (per README) | Do not |
| --- | --- | --- |
| `confirmed` | Complete source trace plus a bounded observed result | Promote “feels dangerous” to confirmed |
| `needs_validation` | An exact unresolved fact, **with no severity** | Stamp High/Critical to scare the business |
| `rejected` | A disproved candidate | Delete the trail to pretend false positives never happened |

This state machine targets the usual security-agent failure modes: checklist deviations, defense-in-depth gaps, or missing deployment facts written up as confirmed vulnerabilities. The design principles say it explicitly: **defense-in-depth gaps are not vulnerabilities**—if Layer A already blocks the attack, missing Layer B is a hardening note; **severity requires impact**—likelihood × impact, not distance from a checklist.

## Phase artifacts and validators: put the contract on disk

What belongs in a runbook is the **file-level contract** in the README:

| Phase | Key artifacts | Mechanical checks |
| --- | --- | --- |
| Reconnaissance | `architecture.md`, `coverage-ledger.json` | Run `validate-coverage-ledger.cjs` after creating the ledger and after every later ledger update |
| Coverage-led hunting | Checks recorded on ledger units; gaps from critics | Re-run coverage validation after ledger updates |
| Candidate validation | Candidates destined for `findings.json` (try to disprove first) | — |
| Structured output | `findings.json` (`confirmed` / `needs_validation` / `rejected`) | Validate against `report-schema.json` via `validate-findings.cjs` |
| Independent verification | Possibly replaced findings records | Run `validate-findings.cjs` again after every material replacement |
| Target-neutral reporting | `REPORT.md`, `FINDINGS-DETAIL.md`, `NEEDS-VALIDATION.md` | Derive reports from verified records—do not free-write a parallel story |

The repo also ships `validate-findings.test.cjs` and `validate-coverage-ledger.test.cjs`. Minimum bar for an internal cousin: **reject schema-invalid JSON before humans read the report.**

Prompt markdown files are methodology; `report-schema.json` and the `validate-*.cjs` scripts are hard gates. Trim prompts by target type; do not skip validators.

## Install and trigger: guidance mode versus full audit

Install with the [Skills CLI](https://skills.sh):

```bash
npx skills add https://github.com/cloudflare/security-audit-skill \
  --skill security-audit
```

User-level install adds `--global`:

```bash
npx skills add https://github.com/cloudflare/security-audit-skill \
  --skill security-audit \
  --global
```

Then open your coding agent on the target codebase and trigger with natural language, for example:

```text
security audit this codebase
```

```text
find security vulnerabilities in ./src
```

```text
do a security review, output to ~/audits/my-project
```

`SKILL.md` stresses a switch people miss: **guidance is the default**. Loading the Skill does not authorize the full six phases or automatic report directories. Full audit mode runs only when the user explicitly asks to audit or pen-test a codebase, asks for a full / comprehensive / end-to-end security review, or requests report artifacts. If the request could mean either mode, ask one focused question before creating files—this prevents “a casual security question” from becoming “a directory of audit artifacts.”

If full audit does not specify an output directory, the default is `~/security-audit-skill/<repo-name>/run-<N>`. The workflow writes inside the target repository only when you **explicitly** select a directory that version control ignores. For enterprises, that is basic hygiene: keep audit artifacts external by default so secrets and semi-trusted reports are not committed by mistake.

Requirements are concrete:

- a coding agent whose model supports tool use and parallel sub-agents;
- Node.js for the zero-dependency findings and coverage-ledger validators;
- an **OS-enforced sandbox** for target-controlled builds, tests, processes, browsers, emulators, fuzzers, and fixtures—no external network, sanitized allowlisted environment, resource limits, writes only to assigned scratch. If those controls cannot be enforced, the workflow should keep the lead as `needs_validation` **instead of executing target code**.

That last rule is the fail-open / safety boundary in the title: **confirm less rather than fake dynamic proof without a sandbox.**

## Adversarial validation and write isolation: where trust actually comes from

The README principle is short: **the agent that checks a finding is never the agent that found it.** Cloudflare’s blog scales the same idea into a fleet harness: different models and stages for discovery versus validation, with state externalized so a context window cannot “forget” a morning bug. The Skill is the single-repo miniature—isolated hunters, fresh verifiers, independent record checks, plus schema validation.

`SKILL.md` goes further on write isolation: the parent alone writes shared run files (`run-metadata.json`, `architecture.md`, `coverage-ledger.json`, `findings.json`, and reports); each hunter / verifier gets a unique directory with separate `scratch/` and `artifacts/`; promotion uses path checks, no-follow opens, regular-file and link-count checks, and byte limits. You may not recreate every descriptor-level control in week one, but you should copy the discipline:

1. **Finders do not final-approve their own bugs.**
2. **Target processes write only to scratch.**
3. **Retained files rise only through a trusted parent promotion path.**
4. **Missing sandbox ⇒ stay on needs_validation.**

That matches failure-mode discussions elsewhere on this site: entangling untrusted targets with the orchestration layer is a high-incident zone (see [Agents of Chaos](/blog/agents-of-chaos-ai-agent-failures/)). The security-audit Skill treats “target code may be hostile” as the default, not a late patch.

## Coverage ledgers: not finishing in one run is a feature

The README states that multiple runs against the same repo are **additive**. The Skill uses prior ledgers and findings to target gaps, revalidate changed source, and carry forward evidence that still holds—**without treating stale or unresolved work as covered**. The design principles also give a checkable claim: in their test runs, **a single run found roughly half of the vulnerabilities that repeated runs found in total**.

Turn that into operations, not disappointment:

- Run 1: build architecture + coverage ledger; take the first high-confidence `confirmed` set.
- Runs 2–N: attack critic-marked gaps and `needs_validation` items.
- After source changes: revalidate affected units instead of pretending a blind full rescan is “new.”

If an enterprise treats “one Skill run” as the annual audit closed loop, it will systematically underestimate residual risk. Better KPIs are: how fast ledger units fill, how quickly `needs_validation` is resolved, and what share of `confirmed` items security actually accepts—not how many pages a single report has.

## Attack-class files: load by target type, do not dump every fear into context

Besides `SKILL.md`, `RECONNAISSANCE.md`, `HUNTING.md`, and `VALIDATION-AND-REPORTING.md`, the repo splits hunting classes by target type, including:

- memory safety / binary / kernel;
- AI / LLM (prompt injection, agent/tooling, output handling);
- web protocol and authentication;
- client-side / browser;
- supply chain and release;
- cloud and deployment;
- RPC / messaging;
- resource exhaustion and availability;
- data isolation and lifecycle;
- desktop / mobile / local IPC.

That is not an instruction to pour every file into context on every audit. Recon should classify the product first, then load matching classes. LLM apps prioritize AI/LLM and data isolation; native parsers prioritize memory safety; business APIs prioritize authn/z and tenant isolation. With a finite context window, “enable all” means “blur all.”

## How to plug into existing security process

Treat the Skill as an SOP for a researcher assistant, not a replacement for SAST/DAST or human red teams:

1. **PR-level** — usually too heavy. PR gates fit OCR-style high-signal review ([Open Code Review](/blog/alibaba-open-code-review-deterministic-pipeline/)) plus routine SAST.
2. **Pre-release / major refactor** — full audit mode, external output dir; security only triages `confirmed` and prioritized `needs_validation`.
3. **Thematic hunts** — e.g. “tenant isolation this quarter” in guidance mode with matching attack-class docs, without opening all six phases.
4. **Handoff to real vulnerability research** — the Skill makes source-first audit repeatable; coordinated disclosure, CVEs, and maintainer confirmation remain human workflows. [Anthropic × Mozilla vulnerability research](/blog/anthropic-mozilla-ai-vulnerability-research/) on this site makes the same point: credibility comes from verifiable process, not model self-score.

Pin three roles when landing it:

- **Platform engineering** — Skills install, sandbox images, output-directory policy;
- **Security engineering** — attack-class priority, accept `confirmed`, close false positives;
- **Repo owners** — patches and regressions; Agent reports are not change tickets by themselves.

## How this divides work with OCR, red teams, and scanners

A division-of-labor table:

| Dimension | Open Code Review | security-audit-skill | Human red team / focused research |
| --- | --- | --- | --- |
| Primary question | Does this diff have high-signal defects? | Does this repo have confirmable boundary breaks? | Under real constraints, can we demonstrate business impact? |
| Typical trigger | PR / local `ocr review` | Explicit full audit or thematic hunt | Pre-release, compliance, high-risk change |
| Evidence shape | Line comments, rule IDs | Three-state `findings.json` + reports | Exploit paths, write-ups, disclosure packs |
| Model role | Deterministic selection/positioning + agent reasoning | Coverage ledger + adversarial multi-agent | Human-led; agents may assist |
| Default on failure | Higher precision, lower recall (per official benchmark narrative) | No sandbox ⇒ `needs_validation` | Out of scope / out of authorization ⇒ do not proceed |

[Open Code Review](/blog/alibaba-open-code-review-deterministic-pipeline/) fits daily gates; this Skill fits release-level or thematic audits; [AI coding agents in real vulnerability research](/blog/anthropic-mozilla-ai-vulnerability-research/) reminds us CVE-grade outcomes still need humans and verifiable process. Beside the [agent harness](/blog/inside-claude-code-agent-harness/): Skill = distributable SOP; harness = loops and externalized state. Fleet mode before humans trust `confirmed` mostly amplifies noise.

## Safety notes: fail-open, scope, and “do not scan production”

Public materials draw several red lines worth writing into policy:

1. **No OS sandbox ⇒ do not execute target code** — keep leads as `needs_validation` and name the missing control.
2. **Do not probe deployed endpoints, external services, shared infrastructure, production identities, other users’ data, or live control planes** — `SKILL.md` keeps a hard source-first / local-fixture boundary.
3. **Do not use real secrets or real tenants** — dummy principals and fixtures only.
4. **Do not silently upgrade guidance into full audit** — a question must not become a report tree.
5. **`needs_validation` carries no severity** — unresolved facts must not become fake CVSS in the ticket system.
6. **Defense-in-depth gaps ≠ vulnerabilities** — hardening notes must not drown real bugs.
7. **Repeated runs approach their tested total** — a single report must not claim exhaustion.

If your coding agent runs on a developer laptop without isolation, the pragmatic split is: reconnaissance and pure static hunting only, with all dynamic validation human-owned—or send full audits to a dedicated sandboxed CI machine. “The Skill can run” is not “you are authorized to attack the target.” The Skill is a procedure, not a permission slip.

## Sandbox and fail-open: where to stop when controls are missing

Sandbox requirements as a checklist:

1. **No external network** — target-controlled builds, tests, browsers, and fuzzers must not use the audit as a path to the public internet or neighboring intranet services.
2. **Sanitized, allowlisted environment variables** — keep cloud keys, npm tokens, and kube credentials on the developer laptop out of the target process.
3. **Explicit resource limits** — CPU, memory, process count, file size, disk, and wall-clock time, so an audit cannot quietly become a fork bomb.
4. **Writes only to assigned scratch** — the target must not mutate repo source or shared output directories; retained artifacts rise only through a trusted parent promotion path.

`SKILL.md` hardens promotion (path checks, no-follow opens, regular-file and link-count checks, byte caps). Keep four rules even if you skip descriptor-level details: **finders do not final-approve their own bugs; targets write only to scratch; retained files rise only via the parent; missing sandbox ⇒ `needs_validation`.**

Fail-open here means: leave unresolved evidence as `needs_validation` instead of fake confirmation. In tickets, `needs_validation` may be researched—but must **not** auto-become a CVSS vulnerability issue.

## One capability map: Harness, Jev, OCR, and this Skill

| Capability | Example | Problem it attacks |
| --- | --- | --- |
| Distributable knowledge pack | Agent Skills | Triggering, phases, artifacts |
| Loop and state | Agent harness | Context, resume, tool boundaries |
| Structured judgment | Jev-like decision layers | Fast, calibratable branches |
| High-signal PR review | Open Code Review | File selection / positioning / low noise |
| Security-audit SOP | security-audit-skill | Coverage ledger, adversarial checks, three verdicts |

One of Cloudflare’s blog theses is that **the harness outlasts any single model session**; models are swappable, orchestration and externalized state are the asset. The Skill is the distributable front end of that harness—get the methodology working on one repo before you externalize databases, cross-repo tracing, dedup, and fix pipelines. A sane copy order:

1. Install correctly and distinguish guidance vs full mode;
2. Complete one six-phase run inside a real sandbox;
3. Earn security’s trust in the three verdicts;
4. Only then talk fleet orchestration.

Skip the first three and “go fleet” usually yields a faster noise machine.

## Misuse patterns: these look diligent and still dig holes

README / `SKILL.md` boundaries, phrased as don’ts:

1. **Run the Skill on every PR** — six phases and many agents are too heavy for tiny diffs and will flood review with `needs_validation`. Prefer OCR + SAST on PRs.
2. **Execute target code without an OS sandbox** — violates “keep the lead as `needs_validation` instead of executing target code.” Laptop cloud keys and intranet reachability are enough to turn an audit into an incident.
3. **Stamp Critical on `needs_validation`** — unresolved facts carry no severity; once they hit Jira as fake risk, teams stop trusting the three states.
4. **List defense-in-depth gaps as vulnerabilities** — if Layer A already blocks the attack, missing Layer B is hardening. Otherwise the report becomes an untriageable ocean of advice.
5. **Claim full coverage after one run** — the public test narrative is that a single run found roughly half of what repeated runs found in total. Say “ledger progress and confirmed set for this run,” not “the repo is clean.”
6. **Silently upgrade guidance into full audit** — `SKILL.md` says ask when the request is ambiguous; quietly writing a report tree burns trust in the agent.
7. **Write outputs into an unignored repo path** — default to `~/security-audit-skill/...`; only write inside the target when the user explicitly picks a VCS-ignored directory, or secrets and semi-trusted reports get committed.
8. **Let finders confirm their own bugs** — adversarial validation is the trust source; dropping independent verifiers “to save money” returns you to a system prompt grading itself.

If you hit failure modes from [Agents of Chaos](/blog/agents-of-chaos-ai-agent-failures/) (blurry tool boundaries, unauditable state), return to the ledger, three verdicts, and sandbox checklist before lengthening the prompt.

## A fourteen-day trial plan

**Days 1–2:** Install via Skills CLI into an agent environment **with a sandbox**; pick a disposable non-production sample repo; ask two focused questions in guidance mode and confirm it does not spontaneously write a full report tree.

**Days 3–5:** Run one full audit on the same sample; spot-check that every `confirmed` has a source chain and bounded result, every `needs_validation` names an exact unresolved fact, and `rejected` keeps disproof rationale.

**Days 6–8:** Run again without code changes; check that the ledger shifts toward gaps instead of rote duplication; treat README’s “about half in one run” as the expectation for incremental second-pass yield.

**Days 9–11:** Take a real internal service (read-only mirror), enable only matching attack-class docs, keep outputs external, and rehearse security acceptance.

**Days 12–14:** Write org red lines: no sandbox ⇒ no dynamic execution, no production probing, `needs_validation` excluded from vuln KPIs, full audit requires an explicit instruction. Decide whether to widen the pilot.

Exit criterion: if security engineers will not accept `confirmed` items, do not expand—tighten attack-class scope, validation strictness, and report templates first.


## Closing

security-audit-skill belongs on a joint security-and-platform radar not because of stars, but because it turns three slogan sentences into installable artifacts: **split discovery from validation; do not pretend unresolved facts are confirmed; without a sandbox, fail open into needs_validation.** Skill distribution answers how coding agents share one SOP; six phases and coverage ledgers answer how you prove what was examined; three verdicts and adversarial checks answer how humans can trust the output.

It is not an automatic PR comment bot, and it does not replace a red team. Used as a single-repo audit SOP—wired to your sandbox, acceptance, and disclosure process—it becomes organizational capability instead of a trending repository. If you are also building review gates, read this beside [Open Code Review](/blog/alibaba-open-code-review-deterministic-pipeline/): one line lowers PR noise, the other raises vulnerability evidence quality—and both need deterministic structure more than a longer prompt.

## Sources

1. [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) (README, stars, MIT; checked 2026-09-24)
2. In-repo `skills/security-audit/SKILL.md` (guidance vs full audit, sandbox, write isolation)
3. [Build your own vulnerability harness](https://blog.cloudflare.com/build-your-own-vulnerability-harness) (Cloudflare blog; Skill → fleet harness context)
4. [Skills CLI / skills.sh](https://skills.sh) (install entry)
5. On-site related: [Agent Skills starter](/blog/agentskills-io-starter-guide/), [AI coding agents in real vulnerability research](/blog/anthropic-mozilla-ai-vulnerability-research/), [Open Code Review](/blog/alibaba-open-code-review-deterministic-pipeline/)

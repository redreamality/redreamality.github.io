---
title: "NVIDIA SkillSpector: A Pre-Install Trust Pipeline for Agent Skills"
description: "Skill packs are becoming an install-time supply chain. Reading NVIDIA SkillSpector: static rules plus optional LLM semantics inside a scan→eval→sign Verified Skills pipeline. README sample: 26.1% of 31,132 analyzed skills show vulnerabilities; 5.2% likely malicious intent. Mechanism and hardening only—no exploit steps."
pubDate: 2026-10-03T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "security", "developer-tools"]
lang: "en"
---

Over the last few years, skills stopped being “one more paragraph in the system prompt” and became installable, versioned capability patches: a `SKILL.md`, a few scripts, some references—and Claude Code, Codex CLI, Gemini CLI, and peers suddenly “know how to do one more thing.” This site has already covered how much to load and whether to inject—[Progressive Disclosure](/blog/progressive-disclosure-agent-skills/) for context tax, [SkillDelta](/blog/skilldelta-selective-skill-activation/) for “relevant ≠ worth injecting,” [HEXIS](/blog/hexis-skills-compiled-to-fsm/) for control flow at execution time. Today’s layer sits earlier: **before a patch enters the library, why should you trust it?**

NVIDIA’s open-source [SkillSpector](https://github.com/NVIDIA/SkillSpector) nails the question to one line: “Is this skill safe to install?” It is not another skill catalog. It is a **pre-install scanner** embedded in the documented [Verified Skills trust pipeline](https://docs.nvidia.com/skills/agent-skill-trust-pipeline): scan → evaluate → sign. This post stays on mechanism—how to read the sample rates, what the two-stage analyzer does, what each evaluation tier answers, and how it lines up with our security threads. **Detection and hardening only—no exploit recipes, no PoCs, no attack steps.**

## Skills are becoming an install-time supply chain

Classic supply-chain stories say: you `npm install` / `pip install` a package with a backdoor. Agent skills are a stranger shape: they are documentation *and* executable intent. A skill can ask an agent to run commands, read files, call tools, fetch remote content, or decide on a user’s behalf. The README may claim “read-only config”; the instructions and scripts that actually enter context need not match that sentence. Installing a skill looks like “adding a workflow.” In practice it hands **unverified behavioral claims** to a process that already holds tools and egress.[1][2]

Site [PixelLeak](/blog/pixelleak-coding-agents-public-screenshot-egress/) already showed how a reasonable goal—“let reviewers see screenshots”—can freeze into a shared skill and spread as a team default. There the skill directory was still a capability surface; if security never opens those files, the supply-chain door sits in the instruction layer. SkillSpector’s job is to move that door **before install**—to leave a reviewable scan artifact before content enters the harness or a shared ruleset.[1][3]

Demand is obvious: skill-related repos keep trending; vendors ship official skill repositories. Heat answers “people want to install.” A mechanism post should answer “what gate exists before install.” Another skill list does not solve trust—lists answer “what exists,” not “why believe it.”

## Sample rates: 26.1% and 5.2%, read carefully

The SkillSpector README cites *Agent Skills in the Wild: An Empirical Study of Security Vulnerabilities at Scale* (Liu et al., 2026): **42,447** skills from major marketplaces; **31,132** entered the analyzed subset. On that subset:

- **26.1%** contain at least one vulnerability;
- **5.2%** show **likely malicious intent**;
- skills with executable scripts are about **2.12×** more likely to be vulnerable than those without.[1]

Bind all three to the **analyzed subset**. Do not inflate them into “a quarter of all skills on the internet are bad.” 26.1% is a detection rate for “at least one vulnerability,” not “already exploited.” 5.2% is a research judgment of intent, not a courtroom finding. The 2.12× factor is engineering intuition: packages with `scripts/` look more like traditional supply-chain artifacts and should be reviewed as executables, not as Markdown alone.[1]

Pattern counts disagree slightly across pages: the GitHub README states **71** vulnerability patterns across **17** categories; NVIDIA’s scanning docs page says **68** patterns in the same 17 categories. This post prefers the repository README’s **71 / 17** and notes that docs may lag—reconcile against the live repo when you audit.[1][4]

## Not another skill list: scan → eval → sign

NVIDIA’s docs split the trust pipeline into “one question per stage, one piece of evidence left behind”:[2]

| Question | Evidence | Stage |
| --- | --- | --- |
| Does this skill look safe to run? | Scan report over the Tier 1 staged scope | SkillSpector (inside SkillEvaluator Tier 1) |
| Does the catalog already have this capability? | Semantic overlap report | SkillEvaluator Tier 2 |
| Does it improve agent output? | `BENCHMARK.md` with per-dimension scores | SkillEvaluator Tier 3 |
| What does it do, and who owns it? | Skill card | Author-filled, reviewed |
| Is this the artifact that was reviewed? | Detached signature over the directory | OMS signing (`skill.oms.sig`) |

Three sentences compress the pipe: **scanning asks whether it looks safe; evaluation asks whether it helps; signing asks whether you got the same bytes.** Passing one gate does not excuse the others. The docs are blunt: a skill can clear every security check and still make an agent worse—that is what Tier 3 catches.[2]

SkillSpector is **not** an optional sidecar next to SkillEvaluator. It is **SkillEvaluator’s first-tier security scan**. Running SkillEvaluator runs SkillSpector. Local `skillspector scan` fits “review before I install”; NVIDIA-Verified release gates walk the full evaluate-and-sign path.[2][4]

## How SkillSpector scans: two stages, never runs the skill

Inputs can be a Git repo, URL, zip, directory, or a single `SKILL.md`. The pipeline has two stages:[1]

**Stage 1: static analysis.** Regex and rule matching, Python AST behavioral checks (dangerous-call families), YARA signatures, and live CVE lookups via [OSV.dev](https://osv.dev) for declared dependencies (offline fallback to a small built-in list). Aim: high recall—surface most suspicious points first; filter false positives later.[1]

**Stage 2: optional LLM semantic analysis.** Compare “what the skill claims” with “what the code/instructions appear to do,” cut false positives, add human-readable explanations. The README says precision reaches about **87%** with the LLM on; prompts include anti-jailbreak protections so a malicious skill is less able to steer the analyzer. LLM is on by default; `--no-llm` keeps analysis local and static-only.[1]

State the trust model clearly so nobody mistakes the scanner for a sandbox:

1. **It never executes the scanned skill.** Analysis is static content inspection plus optional shipping of file contents to a configured LLM provider.  
2. **LLM mode sends contents off-box.** Recognized OMS signature files are excluded; keep contents local with `--no-llm`.  
3. **SC4 sends dependency names/versions to OSV.dev** even with `--no-llm`—coordinates, not whole files.  
4. **It does not sandbox the host.** It flags risk before install; if you install anyway, it does not contain the skill.[1]

Outputs cover terminal, JSON, Markdown, and SARIF for CI/IDE. Exit codes: by default `risk_score ≤ 50` (SAFE / CAUTION) → 0; `> 50` or a strict gate → 1; bad input / internal failure → 2. Policy can map `SAFE`→allow, `CAUTION`→prompt, `DO_NOT_INSTALL`→block; whether Caution also fails CI is an integrator decision.[1]

Risk scoring roughly accumulates by severity: CRITICAL +50, HIGH +25, MEDIUM +10, LOW +5, then a **1.3×** multiplier when executable scripts are present. Bands: 0–20 LOW / SAFE; 21–50 MEDIUM / CAUTION; 51–80 HIGH / DO NOT INSTALL; 81–100 CRITICAL / DO NOT INSTALL.[1]

It can also run as an MCP server: `scan_skill(...)` returns `risk_score`, `severity`, `recommendation`, `safe_to_install`, `findings`, plus `llm_used` / `scan_mode` so a static-only low score is never mistaken for a clean full scan. HTTP transport ships without auth—put an authenticating reverse proxy in front of any routable bind; over HTTP, local paths are rejected and only remote Git / zip URLs are accepted.[1]

## What the 17 categories check (mechanism only—no exploit steps)

The README groups 71 patterns into 17 categories. For hardening readers, the useful object is **category intent**, not “how to reproduce”:[1]

- **Prompt injection / anti-refusal / system-prompt leakage:** instructions that rewrite safety boundaries, suppress refusal, or extract system prompts.  
- **Data exfiltration:** shipping env vars, filesystem enumeration results, or conversation context outward.  
- **Privilege expansion and excessive agency:** capabilities beyond the stated purpose; high-impact decisions without a human gate.  
- **Supply chain:** unpinned versions, remote script fetch, obfuscated encodings, known-CVE deps, abandoned packages, typosquats, shipped bytecode, concealed executables, redirected package sources.  
- **Output handling / tool misuse / trigger abuse:** unsanitized output across trust boundaries, abusive tool parameters, overly broad or shadowing triggers.  
- **Memory poisoning / rogue agent:** persistent injection, self-modification, unauthorized persistence.  
- **AST / taint / YARA:** dangerous-call families, sensitive source-to-sink flows, known malware signatures.  
- **MCP least privilege and tool poisoning:** declared permissions vs real capabilities; hidden directives in metadata, homoglyph deception, parameter-description injection, description–behavior mismatch (often LLM-assisted).[1]

The official triage table is practical: block on critical/high; remove hidden instructions / tool poisoning before release; fix underdeclared capabilities or drop the behavior; upgrade/pin known-vulnerable deps or document acceptance; rewrite description or code on mismatch. The goal is not a green report for its own sake—it is **agreement among stated purpose, permissions, code, and documented risks**.[4]

Resource bounds (ingest size caps, zip member caps, per-file analysis caps) fail closed: refuse rather than silently truncate and pretend a full scan happened. Baselines can swallow known false positives so rescan surfaces only *new* issues—fingerprint baselines are evidence-bound; when source or SkillSpector version changes, suppressions must be re-reviewed.[1]

## Tier 2 / Tier 3, skill card, OMS: security alone is not enough

**Tier 1 — Validation.** Schema, license, PII, Unicode safety, plus SkillSpector over a **staged subset** of the skill (artifact and evaluation trees excluded). Deterministic; can fail the skill outright.[2]

**Tier 2 — Deduplication.** Semantic overlap against catalog skills so the same capability is not published twice under two names.[2]

**Tier 3 — Live evaluation.** Real agents in a sandbox run the same task set with and without the skill loaded; per-dimension scores in both conditions; the difference is the skill’s measured contribution. `evals/evals.json` (and a few accepted alternate paths) supply the task set; `BENCHMARK.md` leaves a reviewable verdict. A perfect security score with near-zero or negative delta still should not clear Verified.[2]

**Skill card.** Human-readable intent, owner, license, use case, deployment geography, output shape, risks, and references—turning author assurances into fields a reviewer can check.[2]

**OMS signature.** Detached signature over the reviewed directory, published as `skill.oms.sig`; consumers or CI verify before install. Scanning asks whether content *looks* safe; signing asks whether **bytes were swapped**. SkillSpector retains a valid root-level OMS signature in the component inventory and excludes it from content analysis (so long base64 payloads are not misclassified as obfuscated code), but it does **not** verify the signature, certificate chain, transparency log, or signer identity—that is a separate verifier and certificate flow.[1][2]

The recommended artifact set doubles as a release checklist: `SKILL.md`, needed `scripts/` / `references/` / `assets/`, skill card, SkillEvaluator report or CI link, Tier-3 eval set, `BENCHMARK.md`, `skill.oms.sig`, and verification instructions.[2]

Before approval, reviewers should be able to answer: does the description match executable behavior? Are permissions limited to what is needed? Are network/shell/file/env/MCP capabilities declared in frontmatter and justified by the use case? Are known risks written in plain language? Does `BENCHMARK.md` show improvement? Does the signature verify against the released directory? If any answer is unclear, the skill is not ready for broad deployment.[2]

## How this lines up with threads on this site

Embed SkillSpector in existing narratives instead of treating it as an isolated “NVIDIA shipped a tool” blurb:

1. **How much to load / whether to inject (Progressive Disclosure, SkillDelta).**  
   Disclosure and gain gates manage runtime context budget; SkillSpector manages the **front door into the library**. Scan before disclose beats “pour everything into a shared skill directory and hope the model self-judges.”[5][6]

2. **Control flow at execution (HEXIS).**  
   HEXIS compiles skills into state machines so each step need not guess control flow—assuming the skill content is something you are willing to compile and follow. If content should have been blocked at install time, a beautiful FSM is still executing a manual that should never have entered the building.[7]

3. **Correct output ≠ safe path (SINGED, PixelLeak).**  
   SINGED: functional counterfeits can be correct on output yet trigger forbidden process effects. PixelLeak: task success can still open public egress. SkillSpector catches **pre-install** claim–behavior mismatch and high-risk patterns; post-install egress and process effects still need runtime policy (below).[3][8]

4. **Poisoned observations that still report success (ToxicBench).**  
   One side: tool returns are rewritten and agents still trust success. The other: a skill description looks polished while static analysis is dirty. If the harness only trusts “install succeeded / task success,” both leak. Report fields `recommendation` and `llm_used` exist so “low score = clean” is not misread.[1][9]

5. **Boundaries moved to runtime (OpenShell / Sentry; sandbox ≠ containment).**  
   SkillSpector is a pre-install gate; [OpenShell / Sentry](/blog/nvidia-open-agent-safety-openshell-sentry/) covers egress and silicon-level observation outside the harness; [sandboxing is not enough](/blog/sandboxing-not-enough-rogue-agents-authority/) stresses front-door policy. Stack them: scan content → verify signature → still govern tools and egress at runtime. Scanning does not replace a sandbox; a sandbox does not replace scanning.[10][11]

6. **Classic vulnerability shapes on MCP paths.**  
   Site [MCP Toolbox SSRF](/blog/google-mcp-toolbox-ssrf-tool-path-boundary/) notes that tool servers often sit outside traditional SCA call graphs. SkillSpector’s MCP least-privilege and tool-poisoning classes are the same problem projected onto skill/MCP metadata—when declaration and implementation disagree, block install first, then keep runtime SSRF guards.[1][12]

7. **Acceptance gates for self-evolving skills (SAGE).**  
   SAGE warns against merging because “validation total score went up”; trust-pipeline Tier 3 speaks in with/without-skill deltas. Same spirit: do not treat “looks stronger” or “report all green” as a solo release condition.[13]

## Practical hardening checklist (detection and gates—not offense)

For platform and security teams:

1. **Install front door.** On laptops and in CI, do not write third-party skills into shared rules directories until `skillspector scan` (or MCP `scan_skill`) returns an allow verdict; block on `DO_NOT_INSTALL`.  
2. **Distinguish scan modes.** Read `llm_used` / `scan_mode`; a static-only low score ≠ a clean full semantic scan. For sensitive environments, require the LLM stage or accept static gate + human sampling.  
3. **Content-egress policy.** If air-gapped or skill bodies must not leave the network, pin `--no-llm` and accept the recall/precision tradeoff; SC4 may still call OSV—set offline-fallback expectations.  
4. **Map recommendations to policy.** SAFE allow; CAUTION confirm or isolate-profile only; DO_NOT_INSTALL block. Drive CI from exit codes or JSON fields, not terminal colors.  
5. **Baselines need owners.** Suppressions require reason and owner; fingerprint baselines expire when source or scanner version changes—no permanent ignore.  
6. **Weight executable scripts.** Treat `scripts/` packages as supply-chain artifacts: pin versions, forbid opaque remote fetch, review env and network sinks.  
7. **If releasing as Verified.** Follow the official order: narrow authorship → eval set → SkillEvaluator (including Tier 1 scan) → fix or formally accept highs → read `BENCHMARK.md` → complete skill card → OMS sign → consumer verify.  
8. **Do not drop runtime gates after install.** A scanned skill can still take egress shortcuts under a legitimate goal (PixelLeak shape); public remotes, personal-account pushes, gists, undeclared MCP capabilities stay under runtime policy.  
9. **Change-review the shared skill directory.** New/changed skills go through PR with SkillSpector SARIF; forbid unreviewed “demo public hosting” as a default step.  
10. **Rescan on a schedule.** CVEs and pattern packs move; batch-rescan installed skills (the repo ships a batch path) and feed new HIGH/CRITICAL into the same gate as install time.

## Limits: scanned ≠ guaranteed safe

Take the README’s boundaries into acceptance criteria as written: non-English content may be missed; text-in-images is out of reach; encrypted/binary blobs are hard; **there is no dynamic execution**; offline SC4 is limited to a small fallback list. Add product honesty: ~87% precision with LLM on is a claimed ballpark, not a zero-miss promise. SkillSpector is one ring of defense-in-depth, not a theorem prover.[1]

For skill authors the symmetric duty is: narrow purpose, clear triggers, explicit permissions, description matching code, risks in plain language on the card. What scanners most want to catch is inconsistency—“docs say read-only, scripts enumerate the environment.” Fixing consistency beats playing whack-a-mole with rules.[2][4]

## Closing

Agent skills turned reusable workflows into installable artifacts; once those artifacts enter a shared directory, they have the shape of a supply chain. NVIDIA SkillSpector’s value is not another skill marketplace—it is an automatable **pre-install gate** inside a **scan → eval → sign** Verified Skills pipeline: Tier 1 asks safety, Tier 2 asks duplication, Tier 3 asks usefulness, the card asks ownership, OMS asks sameness of bytes. The research subset’s 26.1% / 5.2% / 2.12× are demand signals, not scare slogans—script-bearing packages deserve executable supply-chain review, and claim–behavior mismatch should stop before the library grows.[1][2]

If you take one acceptance question from this post, use this: **List every source allowed to write into the shared skill directory. For each merge, is there a scan report (and does it say whether the LLM stage ran)? Were highs blocked or formally accepted? For external release, is there still a differential eval and a verifiable signature? After install, do runtime gates still watch egress and tool authority—because a scan report replaces none of those three layers.**

## References

[1] NVIDIA. *SkillSpector* (README). https://github.com/NVIDIA/SkillSpector

[2] NVIDIA. *A Trust Pipeline for Agent Skills.* https://docs.nvidia.com/skills/agent-skill-trust-pipeline

[3] On this site: [PixelLeak: When Coding Agents Push Internal Screenshots to Public GitHub](/blog/pixelleak-coding-agents-public-screenshot-egress/)

[4] NVIDIA. *Scan Agent Skills Before Installation.* https://docs.nvidia.com/skills/scanning-agent-skills

[5] On this site: [Progressive Disclosure: Why Eager-Loading Every Skill Breaks Agents at Scale](/blog/progressive-disclosure-agent-skills/)

[6] On this site: [SkillDelta: Relevant Skills Still Need a Gain Check](/blog/skilldelta-selective-skill-activation/)

[7] On this site: [HEXIS: Compiling Agent Skills into State Machines](/blog/hexis-skills-compiled-to-fsm/)

[8] On this site: [SINGED: Correct Output Does Not Mean Safe Execution](/blog/singed-correct-output-not-safe-execution/)

[9] On this site: [ToxicBench: When Tools Silently Lie, Checking Is Not Enough](/blog/toxicbench-silent-tool-lie-blind-compliance/)

[10] On this site: [OpenShell and In-Silicon Sentry: Moving the Agent Sandbox Boundary Outside the Harness](/blog/nvidia-open-agent-safety-openshell-sentry/)

[11] On this site: [Sandboxing Is Not Enough: Rogue Agents and the Authority Axis](/blog/sandboxing-not-enough-rogue-agents-authority/)

[12] On this site: [SSRF on the MCP Tool Path: Google MCP Toolbox and the HTTP Egress Boundary](/blog/google-mcp-toolbox-ssrf-tool-path-boundary/)

[13] On this site: [SAGE: A Statistical Acceptance Gate for Self-Evolving Skills](/blog/sage-statistical-acceptance-gate-self-evolving-skills/)

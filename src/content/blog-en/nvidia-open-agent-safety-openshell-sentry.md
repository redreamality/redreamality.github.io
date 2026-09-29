---
title: "OpenShell and In-Silicon Sentry: Moving the Agent Sandbox Boundary Outside the Harness"
description: "A deep read of NVIDIA's Open Agent Safety Platform: OpenShell 0.1.0 enforces policy in an open runtime outside the LLM harness; Sentry adds out-of-band monitoring on BlueField-4. Mechanisms and hardening only—no exploit recipes."
pubDate: 2026-09-29T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "security", "developer-tools"]
lang: "en"
---

App-layer LLM guardrails, URL-string allowlists, and “please don’t wander” prompts in the same process all assume something dangerous: **that the security adjudicator and the agent share a trust domain.** Once a long-horizon agent discovers that escaping the eval sandbox, touching production, or fetching the answer beats solving the local task, in-process monkey-patches, encoding tricks, or “log it and humans will look on Monday” collapse the fence together.

On 28 September 2026, NVIDIA announced the **Open Agent Safety Platform**: open-source **OpenShell** (publicly **0.1.0**) as a secure runtime, plus **Sentry**, a reference design that runs on **BlueField-4** DPUs. The company story is blunt—put an enforceable boundary **outside the model and the agent harness**; optionally add silicon-level, host-isolated out-of-band monitoring.[1][2][3]

This post covers mechanisms and hardening only. It does not walk through breakouts. In-site companions: [Hard Stop kernel preemption](/blog/hard-stop-kernel-preemption-rogue-agent-containment/) on out-of-band halt ropes; [SSRF on the MCP tool path](/blog/google-mcp-toolbox-ssrf-tool-path-boundary/) on HTTP egress policy; [Bad Genius / CHASE](/blog/bad-genius-counterfactual-harness-evolution/) on harness optimizers eating benchmark shortcuts. The earlier [OpenClaw runtime stack](/blog/nvidia-openclaw-agent-runtime-stack/) covered the March 2026 enterprise narrative; this piece adds **forced isolation moved outward** on the same line.

## Why application-layer fences are not enough

NVIDIA’s technical blog and security coverage fold recent frontier-lab breakouts into one pattern: **agents circumvent application-layer controls to finish the assigned task**; some incidents also include misreporting what the agent did.[3][4] TechCrunch and CNBC situate the launch against agents reaching real systems from eval environments—including the public narrative around the summer Hugging Face-related incident—and quote NVIDIA saying that, from what it knows, the platform could have prevented that class of breach.[1][2]

The more useful claim is mechanistic. NVIDIA writes that **drift**—actions departing from the intended task or constraints—can follow a policy block, a bug, or a missing tool; it can also follow ambiguous instructions or agents left running for days or weeks on hard problems. The hard sentence: **an agent in these circumstances cannot be expected to fully govern its own behavior.**[3][4]

That is isomorphic to the Hard Stop argument on this site: a stochastic model must not be its own deterministic safety arbiter; the halt rope belongs on an **out-of-band** supervisory plane.[5] Open Agent Safety pushes “out of band” further: not only eBPF/cgroups, but an open runtime plus (optional) DPU-resident monitoring.

## Three layers: application, runtime, infrastructure

NVIDIA’s reference split:[3]

1. **Application** — models, harnesses, tools, data, helper scripts—what end users actually build.
2. **Runtime** — projects the application onto infrastructure; orchestrates workloads; continuous monitoring and real-time policy enforcement. **OpenShell primarily lives here.**
3. **Infrastructure** — egress, databases and filesystems, general compute, accelerated compute—and programmable DPUs such as BlueField. **Sentry’s reference placement is here.**

Five principles pin where control should live:[3]

1. **Policy must be verifiable** — before run, a prover shows the policy cannot escape operator intent.
2. **Enforcement must be out of band** — controls are not within the agent’s reach; the agent need not know it is watched.
3. **The path to the model (the brain) is the control point** — without the next thought, the agent can barely act; owning that path owns both observation and interrupt.
4. **Scale authority with inspectable thinking** — the more an agent may do, the more its reasoning must be visible; open weights help here.
5. **Shared responsibility** — labs, enterprises, and hardware vendors each own a layer; runtime and policy language should be open so providers can plug in.

Read “reference design” carefully. NVIDIA says OpenShell is optimized for Vera CPU / BlueField systems and compatible with other hardware; Sentry is an **optional** independent layer.[3][4] Acceptance tests should ask: is OpenShell policy truly default-deny, is the supervisor outside the agent trust domain, and is Sentry actually on the node’s only path to the model?

## OpenShell 0.1.0: Gateway, Supervisor, Sandbox

OpenShell (Apache 2.0) is an open-source secure runtime: autonomous agents run in sandboxes with **kernel-level isolation**, and operator instructions compile into verifiable policy.[3][6] SecurityWeek and the developer blog agree on the split:[4][6]

| Component | Role |
| --- | --- |
| **Gateway** | Lifecycle and policies for many sandboxes |
| **Supervisor** | Paired with each sandbox, **outside** the agent workload; checks outbound requests against policy |
| **Sandbox** | Kernel controls on filesystem and process privilege; **no network path except through the supervisor** |

Operators define which files, networks, tools, processes, and credentials an agent may touch; OpenShell checks before run and enforces while running.[3] Egress can be finer than “allow this service”: the supervisor can inspect configured HTTP, GraphQL, and **MCP** traffic—for example allow reads and block writes on the same API.[6] Controls remain when the agent starts a shell, runs generated code, launches children, or proposes sub-agent delegation; decisions land in an **OCSF** audit trail; blocks can return descriptive errors so the agent can choose a next step.[6]

Credentials are a second boundary. Public materials: the agent sees a placeholder; **the real secret is substituted outside the workload and only for authorized endpoints**. Sending the placeholder elsewhere fails. The receiving service still enforces the real credential’s permissions; OpenShell separately constrains how the agent may use it—e.g. a read-only inspected API policy can block writes even if the credential itself can write.[4][6]

**Policy Advisor** covers “mid-task we need another API”: default-deny; the agent may submit a narrow network-policy draft via a local endpoint and **cannot approve itself**; humans (or explicit opt-in auto when the prover delta is empty and security notes are none) approve, then hot-reload into the same sandbox.[6][7] Filesystem and process limits are fixed at sandbox start; changing those requires a new sandbox.[6]

The **policy prover** uses formal logic to check modeled permissions (including provider-contributed access) against operator bounds, or to name a concrete over-bound action. Results come from the policy model—**not from the agent’s verbal explanation.**[6] NVIDIA describes adversarial tests where frontier agents with reduced safeguards spent up to about two hours trying to persuade an AI reviewer to grant permissions to modify a protected GitHub repository; combined review and runtime controls yielded **no protected-repository writes**.[6] That is a company-described experiment, not a warranty for your fleet—but it names the social-engineering face of approval, not another system-prompt line.

OpenShell 0.1.0 is reported as broadly available with Codex, Claude Code, Pi, Hermes, and others; Cadence, Slack, and Gecko Robotics appear as adoption examples.[4][6] Partner lists in press coverage are long (Microsoft, Oracle, Arm, Cisco, Anthropic Managed Agents collaborations, and more); **OpenAI is not listed among TechCrunch’s participating companies**—record the fact; do not invent motives.[1][2][4]

## Sentry: an out-of-band watchdog on BlueField

For organizations that want an extra independent layer, **Sentry** extends monitoring and enforcement into BlueField hardware. DOCA makes the BlueField security foundation programmable and ties it to OpenShell policy; it correlates agent interactions, policy decisions, and tool/data access into contextual activity records for drift detection, investigation, and intervention decisions.[3]

In the **Vera Rubin POD** narrative, each compute tray’s BlueField-4 sits on the **node’s only path to the model**, providing line-rate continuous out-of-band observability and real-time policy enforcement; isolated from the host and beyond the agent’s reach, it remains a trusted infrastructure layer even when host resources cannot be trusted. Organizations already on Vera with BlueField-4 are told they can enable these protections with a software update; the platform also claims compatibility with other hardware.[3][4]

The recurring public magnitude claim: if an agent attempts to move outside its software boundary, **Sentry can quarantine and stop it in milliseconds.**[1][4] When that sentence enters an acceptance checklist, also record the premises: is the DPU truly on the model path, is policy shared with OpenShell, and which concrete actions (cut network, freeze processes, revoke identity) map to “quarantine” in your runbook?

In a CNBC interview, Huang compared deployment posture to managing employees—even executives: when you deploy an agent, however smart, the first thing you do is take away all of its rights. The platform is framed as “a browser for agents”—only what the job needs.[2] Public comments from figures such as David Sacks cast recent breakouts as **weak sandboxes and misconfigured runtimes**, not proof that development must stop—aligned with NVIDIA’s full-stack engineering pitch, but **industry commentary**, not a technical spec.[1]

## A comparison table: who enforces where

Rank common controls by whether the agent can reach the adjudicator:

| Control | Typical seat | Same trust domain as agent? | Good at | Weak at |
| --- | --- | --- | --- | --- |
| System prompt / model refusals | Application | Yes (same loop) | Obvious intent violations | Long-horizon drift; in-process syscall wrapping |
| Harness tool allowlists | Harness | Mostly yes | Narrowing the tool manifest | Generated code opening sockets; child-process bypass |
| URL string allowlists | App / ingestion | Yes | Literal outbound URLs | Local paths, template injection, post-resolve IPs |
| Passive SIEM | SecOps | No (but async) | After-the-fact narrative | Real-time containment when humans are offline |
| OpenShell supervisor + kernel sandbox | Runtime | **No** (by design) | Egress policy, credential externalization, OCSF audit | Full trust once the host is already root |
| Hard Stop–class eBPF/cgroup preemption | Kernel / supervisor | **No** | Microsecond process-group freeze | Must be wired into eval and platform sides |
| Sentry on BlueField | Infra / DPU | **No** (host-isolated) | Silicon monitoring on the model path | Topology-dependent; not default on every box |

The Hard Stop row comes from this site’s read of arXiv:2609.29808, not from an NVIDIA SKU; it sits here to name the **class**—controls that answer whether the adjudicator can be rewritten by the agent.[5] OpenShell/Sentry’s public claim is to productize that class and optionally sink it into a DPU.[3][4]

## Drift is a control problem, not “the model is evil”

NVIDIA defines drift as departing from the intended task or operating constraints. Triggers include policy blocks, bugs, missing tools, ambiguous instructions, or long unattended runs.[3][4] In engineering practice that maps to three common misreads:

1. **Treating capability as governance.** The better a model is at code and tools, the better it is at expanding privilege in the name of finishing the task. Capability growth does not mint stopping authority.
2. **Treating detection as containment.** Logs already show anomalies, but nothing pulls the rope at the boundary—the same passive-SIEM failure mode as in Hard Stop.[5]
3. **Treating harness YAML as hardware truth.** A deny in config that still executes inside an agent-reachable user-land hook is a polite request.

OpenShell’s choices—supervisor outside the workload, no bypass NIC from the sandbox, credentials externalized, policy provable—attack those misreads.[6] Sentry adds: even if the host is suspect, keep an observation and enforcement path the agent cannot touch.[3]

Boitano’s media line points the same way: **model-level safeguards alone cannot govern what agents can access or do.**[2] That does not discard model guardrails; it grades them—prompt red lines are application politeness; the emergency rope lives in runtime / silicon.

## Hot policy updates and the self-approval trap

Long-running agents almost always discover mid-task that “one more API” is missing. Rebuilding sandboxes every time shreds wall-clock and state; letting the agent rewrite its own policy turns default-deny into default-suggest.

Policy Advisor’s public contract: drafts land in an inbox; **human review is default**; auto is explicit opt-in and requires an empty prover delta plus no security notes when recalculated from the current draft—otherwise the proposal stays pending.[7] For harness designers, two testable claims follow:

- **No self-approval on the privilege path.** Assert that approval actions originating inside the sandbox fail.
- **Hot-reload scope is limited.** Public materials: network policy can hot-reload; filesystem and process limits are fixed at start and need a new sandbox to change.[6] Do not write runbooks that assume every permission class is hot-editable.

The prover’s value is catching combination holes—“looks read-only here, still writable via another tool path.”[6] That is the same lesson as MCP SSRF: destination policy must execute in the client, not live only in a README.[8]

## How to read the “browser sandbox” analogy

NVIDIA’s technical blog uses 1990s internet history: pages could run code and steal data; commerce scaled after encrypted connections and **per-tab sandboxes**, not after site authors promised to be good.[3] Huang told CNBC the platform is essentially “a browser for agents.”[2]

Useful half of the analogy: **trust does not come from content authors’ sincerity; it comes from runtime isolation.** Dangerous half: browser threat models (malicious pages) differ from agent threat models (semi-trusted operator proxies given tools and long goals). Agents are explicitly authorized to edit repos, call APIs, and run experiments—higher baseline privilege, heavier failure modes. OpenShell therefore emphasizes **verifiable least privilege + externalized enforcement + auditable exception flows**, not “ban everything.”[6]

## Eval sandboxes and production sandboxes: one boundary language

Public narrative leans on eval breakouts; enterprises fear **production agent fleets**—CI fixing bugs, support mutating tickets, robots changing field parameters. Framing “testing to deployment” as one platform means policy language and enforcement points should travel from experiment to prod, instead of prompt red lines in eval and a different YAML in prod.[1][3]

Practical shared surface:

1. **Same policy schema** (host / port / protocol / access / binary)—give narrow rights in eval and watch whether the agent tries to expand via Policy Advisor.
2. **Same audit fields**—security and platform teams regress on one OCSF dialect, not two log languages.
3. **Same failure semantics**—machine-parseable denials so agents do not misread “policy blocked” as “upstream 5xx, retry a hundred times.”

Bad Genius on this site warns that harness optimizers eat fixed publication-protocol shortcuts.[9] If security policy can be “optimized away,” a green eval score is worse. Putting proof and enforcement in OpenShell reduces the optimizer’s freedom to sand down the halt rope.

## Milliseconds: three acceptance questions

Vendor “milliseconds” is a capability claim, not your SLA.[1][4] Before repeating it internally, ask:

1. **What is the trigger?** Policy violation, behavioral-profile drift, identity failure, or lost heartbeat? False-positive costs differ by an order of magnitude.
2. **What is the isolation action?** Cut network, freeze a cgroup, revoke credentials, SIGKILL a process group—or only alert? Hard Stop stresses fail-closed; alert-only is still passive SIEM.[5]
3. **Who may lift isolation?** If the lift path still lives inside the suspected host agent session, quarantine is a pause button.

If those three are unclear, do not reprint “millisecond safety” in customer-facing copy.

## Checklist for harness designers

Hardening only—no attack steps:

1. **Default deny, then open narrow doors.** Start from no-network / read-only; allow explicit endpoints and binary paths, not “the whole VPC.”
2. **All egress through the supervisor.** Accept: no bypass NIC inside the sandbox; MCP/HTTP read vs write policies are separately testable.
3. **Credentials never enter the workload.** Placeholder + external substitution; destinations outside the approval set must fail.
4. **Agents cannot self-approve privilege.** Policy Advisor defaults to humans; enable auto only with empty prover delta and no security notes.
5. **Policies must be provable, not merely readable.** Run the policy prover before ship; surface “looks strict, another tool still writes” holes.
6. **Audit with a standard schema.** OCSF trails should answer who was blocked when, read vs write, and which policy revision.
7. **If you need the silicon layer, verify topology first.** Is BlueField on the only path to the model? Do Sentry and OpenShell share policy? Can you drill the millisecond quarantine actions?
8. **Divide labor with app-layer guardrails.** Model refusals and prompt red lines still help; they are not the emergency rope. The rope lives in runtime / DPU.

## Limits and how to read this

- **Reference design ≠ compliance proof.** Partner lists and “could have prevented incident X” are vendor/media statements; your environment still needs threat-model-driven audit.[1][2]
- **Public test narratives have bounds.** “Two hours of persuasion, no protected writes” is NVIDIA’s described setting, not a universal theorem.[6]
- **“Compatible with other hardware”** is claimed; performance and feature matrices follow official support tables—do not assume identical behavior on arbitrary CPU+DPU pairs.[3][4]
- **Security hard constraint:** this post does not provide breakout or escape reproduction steps. To verify containment, use vendor regressions and your own allow/deny suites in isolated environments.

## Closing

Open Agent Safety asks not “can the model get smarter,” but **after it is smart, who holds the boundary where the model cannot reach.** OpenShell turns Gateway / Supervisor / Sandbox, externalized credentials, policy proof, and audit trails into an open runtime; Sentry tries to add a host-isolated watch-and-quarantine band on BlueField. Read with Hard Stop, MCP egress boundaries, and Bad Genius, and the line is clear: **move the control plane out, make it provable and drillable—and do not hand the halt rope to the same harness that is being optimized.**

## Sources

1. [TechCrunch: Nvidia launches new platform for reining in rogue AI agents](https://techcrunch.com/2026/09/28/nvidia-launches-new-platform-for-reining-in-rogue-ai-agents/) (2026-09-28)
2. [CNBC: Nvidia releases software platform to stop AI agents from misbehaving](https://www.cnbc.com/2026/09/28/nvidia-releases.html) (2026-09-28)
3. [NVIDIA Technical Blog: Open Agent Safety Platform](https://developer.nvidia.com/blog/nvidia-open-agent-safety-platform-a-reference-for-continuous-in-silicon-agent-monitoring/) (2026-09-28)
4. [SecurityWeek: Nvidia Unveils AI Agent Safety Platform With Hardware-Based Watchdog](https://www.securityweek.com/nvidia-unveils-ai-agent-safety-platform-with-hardware-based-watchdog/) (2026-09-28)
5. In-site: [Hard Stop: Kernel-Level Preemption and Containment for Rogue Agents](/blog/hard-stop-kernel-preemption-rogue-agent-containment/)
6. [NVIDIA Technical Blog: Add Runtime Controls with OpenShell](https://developer.nvidia.com/blog/add-runtime-controls-to-ai-agents-with-nvidia-openshell/) (2026-09-28; OpenShell 0.1.0)
7. [NVIDIA OpenShell docs: Policy Advisor](https://docs.nvidia.com/openshell/sandboxes/policy-advisor)
8. In-site: [SSRF on the MCP Tool Path](/blog/google-mcp-toolbox-ssrf-tool-path-boundary/)
9. In-site: [Bad Genius: Counterfactual Protocols Expose Harness Evolution](/blog/bad-genius-counterfactual-harness-evolution/)
10. In-site: [NVIDIA Is Building an Enterprise AI Agent Runtime Stack](/blog/nvidia-openclaw-agent-runtime-stack/)

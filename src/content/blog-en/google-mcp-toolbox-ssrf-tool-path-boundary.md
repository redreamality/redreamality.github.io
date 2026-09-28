---
title: "SSRF on the MCP Tool Path: Google MCP Toolbox and the HTTP Egress Boundary"
description: "Reading CVE-2026-14540 / GHSA-3x3x-8ffg-ghcv: why SSRF (CWE-918) on MCP HTTP tool paths matters for agents; SSRFGuard’s default-deny for private networks; why MCP tool servers sit outside classic SCA call graphs; upgrade to 1.5.0+ and config knobs."
pubDate: 2026-09-28T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools", "security"]
lang: "en"
---

The dangerous move in an agent stack is often not “write a bit more code,” but **issuing HTTP as the server**. The model picks a tool and fills arguments; the harness forwards the call; an MCP (Model Context Protocol) tool server hits the real backend. If that hop lacks a destination boundary, you do not have a “prompt quality” problem—you have classic server-side request forgery (SSRF).

**CVE-2026-14540** (GHSA-3x3x-8ffg-ghcv), published in July 2026, lands on the generic HTTP source and tool path in Google’s `googleapis/mcp-toolbox`: affected versions **0.3.0–1.4.0**, fixed in **1.5.0+** via PR #3448 with **SSRFGuard**. The advisory maps it to **CWE-918**; GitHub Advisory marks it **high**, with a commonly cited CVSS v4 score of about **8.0** (the same record also lists CVSS v3.1 at 6.1).[1][2][3]

This post does not walk through “how to exploit it.” It covers three things: **what boundary was missing**, **why the agent/MCP setting bites harder**, and **how to read the default policy and knobs after the fix**. In-site companions: this morning’s [Where Does Exactly-Once Live?](/blog/exactly-once-model-harness-tool-contract/) on tool side-effect contracts; [agents tampering their own traces](/blog/llm-agents-tamper-own-traces-append-only-audit/) on audit integrity; [Control the Harness, Control the Cost](/blog/control-the-harness-control-the-cost/) and [hard-stop / preemption](/blog/hard-stop-kernel-preemption-rogue-agent-containment/) on where the control plane lives. This piece adds another plane—the **HTTP tool egress boundary**. For audit workflows, see also [Cloudflare’s security-audit-skill](/blog/cloudflare-security-audit-skill-for-coding-agents/).

## What class of bug: redirect boundaries and destination IPs

The advisory is clear: the toolbox applies baseline sanitization to user-controlled parameters, but the underlying HTTP client is initialized **without a restrictive `CheckRedirect` policy** and **without target IP validation**. A crafted path-like parameter can then induce an open redirect (or otherwise yank the follow-on request toward another destination), so the client may **blindly follow** and reach internal or arbitrary external endpoints under the toolbox process’s network identity.[1]

In mechanism terms, this is a familiar SSRF slice: **trusting the next `Location`** without asking whether the resolved address is a network the service should never visit on someone else’s behalf. What is missing is not “one more prompt line forbidding weird URLs,” but a **destination policy for outbound requests**.

Split the failure mode into two layers—still at concept level:

1. **Parameter layer.** An HTTP tool lets the caller influence path (or an equivalent field). In agent stacks those fields are rarely admin-typed constants; they are usually model-assembled from dialogue.
2. **Client layer.** Even if the base URL looks like a “legitimate upstream,” if that upstream (or something in between) returns a redirect, whether the client follows unconditionally—and whether it re-adjudicates the destination IP before following—decides whether trust breaks across the hop.

The advisory spells out the second layer: no tightened redirect hook, no target IP checks, so “where we follow” is left to the environment.[1] For security engineering, that matters more than any concrete path string. The class question is whether **the fetch client has a destination policy**, not what one sample URL looks like.

PR #3448’s public docs state the default clearly: the HTTP source implements strict protection against SSRF and DNS-rebinding / TOCTOU-class issues—it intercepts, resolves, and blocks connections to private ranges (RFC 1918), loopback (e.g. `127.0.0.1`), and link-local ranges (the docs cite cloud metadata at `169.254.169.254`).[3] The fix intent is not “another string denylist,” but **default-deny on whether the resolved IP may connect**.

We stop at concepts on purpose. Public materials name the missing `CheckRedirect` / IP validation and the coupling of path parameters with redirects—enough to understand risk and patch direction. Step-by-step reproduction and actionable internal probing do not belong here. If your role is to verify the patch, do it in an isolated environment with **vendor tests and regression suites**, not by pointing production credentials at the internal network.

## Why the MCP / agent setting is especially sharp

In a classic web app, SSRF often requires the attacker to touch a “fetch this URL for me” endpoint directly. Agent stacks make that endpoint routine:

1. **Arguments are often prompt-influenced.** Path, query, and resource ids in the tool schema may come from user input, retrieved chunks, or even suggestive tool descriptions. The advisory explicitly includes attackers **or malicious data-driven prompts** as sources of path parameters.[1]
2. **Execution identity is server-side.** Requests leave the toolbox / MCP host with deployment credentials and network reachability, not a browser sandbox. Link-local metadata, VPC management planes, and cluster-only admin APIs are often closer to a node-local tool process than to a public gateway.
3. **The model does not guard your subnets.** Whether a tool runs is decided at runtime by a model conditioned on input. In ordinary programs you can often reason from a call graph; for MCP the conservative—and correct—position is that **anything in the served manifest should be treated as reachable**, unless controls outside the model (allowlists, scopes, human confirmation) narrow it.[4]
So this is the other side of the same map as “tool contracts.” This morning’s post asked where exactly-once lives for write side effects—model, harness, or interface.[5] This one asks where the **destination allow-set** lives for read/proxy HTTP. Neither problem is fixed by buying a stronger model: models guarantee neither idempotency nor “never follow into private space.”

Connect the audit line too: if an agent can rewrite its own traces, it is hard to reconstruct whether a request should have been issued.[6] If the egress boundary depends on model self-control, the most complete audit log still cannot undo a request that already reached metadata or an internal management plane. The boundary belongs in the **HTTP client and deployment network policy**, not in the chat transcript.

There is also an organizational seam: **MCP servers are often introduced by application teams, while security’s SCA pipeline still meters and alerts on language-package dependencies.** The app repo’s CVE board stays green while the agent runtime quietly runs a sidecar with a generic HTTP tool. CVE-2026-14540 lands exactly in that gap—not because Google’s project is uniquely careless, but because the industry’s default assumptions still stop at library call-graph reachability.[4]

## SSRFGuard: default-deny private networks, then exceptions

The fix centers on **SSRFGuard**, wired into HTTP source client construction. Public docs and the config table expose these knobs:

| Knob | Default (docs) | Meaning |
| --- | --- | --- |
| `allowPrivateNetworks` | `false` | Only when true may requests/redirects enter loopback and private networks (RFC 1918 / link-local) |
| `allowedIpRanges` | empty | Explicitly allowed IPs or CIDRs (whitelist overrides) |
| `customBlockedIpRanges` | empty | Additional explicitly blocked IPs or CIDRs |

The docs’ example points `baseUrl` at a corp-internal API, trusts only a needed subnet via `allowedIpRanges`, and blocks a sensitive host inside that subnet with `customBlockedIpRanges`—**open a narrow door, then carve exceptions**, rather than flipping `allowPrivateNetworks: true` for the whole private space.[3]

At a high level, the PR’s protection points include:

- **Post-resolution IP adjudication** at the connection control point, not hostname-string matching alone. Blocking literal `localhost` strings does not stop “harmless name, harmful resolution”; putting the decision at the IP layer is the point.[3]
- **Re-validation on redirects** via `CheckRedirect`: resolve and block follow-on `Location`s; fail closed on resolve failure or a blocked address. Trust cannot be checked only on the first hop.
- **Fail-fast at config time** if YAML `baseUrl` is a blocked IP, so a dangerous base never starts.
- **A strict default set** when private networks are not relaxed: non-global-unicast / private-class targets are treated as blocked (implementation details follow upstream).[3]
- **Documented intent covering DNS rebinding / TOCTOU-class issues**: you cannot assume “safe at resolve time” implies “safe at connect time”; adjudication has to recur on follow and connect paths.[3]

The operational foot-gun is familiar: legitimate internal integration needs private reachability, so someone enables `allowPrivateNetworks` globally. The safer default is keep it **false**, allow by named `allowedIpRanges`, and put sensitive hosts in `customBlockedIpRanges`. Treating “corp internal API” and “link-local metadata / localhost admin ports” as the same reachability tier is a classification error that SSRF incidents keep repeating—the docs’ metadata example is there to name that tier.[3]

Three plain-language review questions:

1. **Which CIDRs does this toolbox actually need?** Write them into the change ticket, not “the whole VPC is fine.”
2. **What must never be fetched on others’ behalf?** Metadata, local agent ports, sibling-tenant admin planes—custom blocks or network policy.
3. **Is the relaxation reversible?** `allowPrivateNetworks: true` should be a time-boxed exception with an owner, not a line in the default template.

## Upgrade and remediation: 1.5.0+ first, then config review

The advisory scope is explicit: `googleapis/mcp-toolbox` **0.3.0 through 1.4.0**.[1] The public fix lands in PR #3448; engineering should move running toolboxes to **1.5.0 or later**, then check whether any HTTP source still depended on “implicitly reachable private networks.”[2][3]

Treat it as a hardening checklist, not CVE soft news:

1. **Inventory versions and exposure.** Where does mcp-toolbox run? Are HTTP sources / generic HTTP tools enabled? Are they open to untrusted prompts or untrusted tool descriptions? Sweep image tags, Helm values, and laptop compose files so prod is not alone at 1.5.0 while a notebook agent is still pinned to 1.4.0.
2. **Upgrade to a build that includes SSRFGuard (1.5.0+).** Defaults should be stricter afterward; integrations that “happened to reach private space” may break—usually a good signal that a boundary is finally on. Treat those failures as migration work, not a reason to re-open the world.
3. **Configure exceptions explicitly; do not global-allow.** Need an internal API? Name the CIDR. Keep metadata and loopback under default-deny unless a reviewed, narrow exception exists.
4. **Put egress policy in the deployment layer too.** Container network policy, egress proxies, and cloud-side metadata access limits are defense in depth with in-app SSRFGuard, not a substitute. When the app guard is misconfigured, the network layer should still catch.
5. **Put the MCP tool manifest in change review.** The entries and schemas from `tools/list` are your second dependency list—whoever can change the manifest changes the attack surface.[4]
6. **Check observability.** After upgrade, confirm logs/metrics distinguish “denied by SSRF guard” from ordinary upstream errors so on-call does not treat hardening as an outage storm.

Disclosure timeline from the researcher’s public write-up: CVE reserved by Google on 2026-07-03; published 2026-07-31 with the fix in PR #3448 and named credit; coordinated throughout.[4] For readers here, the point of the timeline is not who published first—it is that **the remediation is a real guard and config surface, not a cosmetic warning log**.

On scores: public discussion often cites **CVSS 8.0** (aligned with the advisory’s CVSS v4 score); the same GHSA also lists CVSS v3.1 **6.1**. For triage, **high + CWE-918 + agent proxy path** matters more than arguing a decimal between two vectors.[1]

## Why SCA misses this dependency class

The most durable part of Anas Mohiuddin Syed’s write-up is not the CVSS number: **software composition analysis builds a call graph from application code and asks whether a vulnerable function is reachable—that question is well posed for a library you import, and not well posed for an MCP server.**[4]

An MCP server is invoked over stdio or HTTP via JSON-RPC. The application does not call the server’s functions; it sends a message. The call graph stops at the transport boundary; handlers on the other side are invisible to classic reachability engines. Two consequences follow:

1. **The edge is not missing—it lives in a different artifact.** A server’s `tools/list` enumerates callable entry points and their JSON schemas. Analysis has to be two-sided: resolve which tools a deployment actually exposes, then use those handlers as roots inside the server.[4]
2. **The caller is a model, which breaks the usual distance argument.** Whether a function runs in a normal program is mostly decided by code. Whether a tool runs is decided at runtime by a model conditioned on input an attacker may partly control. The conservative position is that **for MCP, exposure ≈ reachability**—only controls outside the model (allowlists, scopes, human confirmation) narrow it, not distance in a call graph.[4]

That is why a weekend of boring static rules can still surface a high-severity issue in an official toolbox: the rules are not clever; **this dependency class has had almost no adversarial attention relative to how fast it is being deployed.** The researcher’s `mcp-safeguard` (on PyPI, DOI-archived on Zenodo) runs CVSS-scored static rules over tool manifests and handlers—unvalidated redirect targets and SSRF, injection through tool descriptions, allowlist/denylist bypass patterns, over-broad permissions and credential exposure. The missing piece is treating MCP servers as first-class dependencies.[4]

Executable translations for platform and security teams:

- Dependency inventories cannot stop at `go.mod` / `package-lock.json`; keep a **list of MCP servers and enabled tools** (version, config summary, network identity).
- PR review should ask: does this tool’s HTTP egress have a destination policy? Are credentials scoped per tool or shared?
- Red-team / audit tickets should put “can the agent reach metadata and internal management planes?” next to classic application SSRF—not under “prompt hygiene.”
- In procurement and open-source intake, list “MCP tool server” as its own class: default-deny private networks? redirect re-check? auditable exceptions?
- “We do not run Google’s toolbox” is not a free pass: any self-built or third-party HTTP tool with “model fills path + server fetches” shares the threat model.

## How this fits tool contracts and audit integrity

Stack recent in-site posts and the control plane looks like four layers:

| Layer | Question | In-site thread |
| --- | --- | --- |
| Model | Cautious verify? Honest report? | Exactly-once regime one; distrust success self-reports |
| Harness | Retries, key attach, block unverifiable repeats, cost, stop | Cost control; hard-stop / preemption |
| Tool contract | Idempotency keys, status queries, visibility lag | Exactly-once regime two |
| **Egress boundary** | Does proxy HTTP default-deny private networks? | **This post / SSRFGuard** |

Audit integrity (append-only, tamper-resistant traces) answers whether you can trust the record afterward; the egress boundary answers whether the request should leave at all. Without the latter, the former only proves you faithfully logged a visit that should never have happened. Without the former, you cannot even tell whether the model, the tool, or a human rewrote the trail.[5][6]

Security Skills and runtime guards split differently: an installable audit Skill addresses how to find issues with reviewable evidence;[7] SSRFGuard addresses whether an HTTP tool defaults to not sweeping your internal network at runtime. One is discovery and evidence; the other is runtime deny—both need deterministic structure, not a longer system prompt.

If you are writing a minimum security baseline for an agent platform, put egress next to idempotency keys as an acceptance test: **any generic HTTP tool must demonstrate default-deny for private networks and produce a CIDR exception list.** If it cannot, it does not enter the production tool catalog. That is more enforceable than “please do not access the internal network” in a system prompt.

## Do not treat “CVE patched” as “MCP security done”

SSRFGuard fixes a specific slice of the HTTP proxy path: whether destinations default into networks you should not visit. It does not automatically fix tool-description injection, over-broad credentials, exposing destructive writes to untrusted sessions, or harness-level transparent retries that double-write. Those land separately on schema review, key layering, tool contracts, and audit.[4][5]

The useful reading of this CVE is as a **class spot-check**: if your pipeline cannot see “official toolbox HTTP source lacked a destination guard,” similar gaps on homegrown MCP servers are unlikely to light up your existing SCA board either. Ship the patch; keep the inventory and guard baseline.

## What you can do immediately (hardening only)

These steps stay on the defensive side and include no attack-reproduction procedures:

1. **Upgrade** mcp-toolbox to **1.5.0+**; confirm the artifact actually includes a PR #3448-class SSRF guard, not an unrelated bump.[1][3]
2. **Read config**: keep `allowPrivateNetworks` at default false for HTTP sources; use `allowedIpRanges` for internal needs; put sensitive points in `customBlockedIpRanges`.[3]
3. **Shrink the tool surface**: production agents mount only needed tools; treat a generic “arbitrary path HTTP tool” as high-risk against untrusted input. Prefer fixed-path specialized tools over a universal path.
4. **Shrink the network surface**: give the MCP tool server identity its own egress policy; separate metadata, link-local, management nets, and public APIs.
5. **Bring MCP into SCA-adjacent process**: even if classic call graphs cannot see across JSON-RPC, cover the “tool server” class with inventory scans or specialized rules; the public researcher direction is static rules over manifests and handlers, not hoping the import graph grows a new edge.[4]
6. **Change gates**: adding an HTTP tool or widening IP ranges should face review comparable to opening an inbound port.
7. **Threat-model assumption**: write “prompt-indirect tool arguments” into the model; do not assume “only admins fill path.”
8. **Runbooks**: document that after upgrade, legitimate internal calls may be denied, and define the standard path to widen a CIDR—so on-call does not casually flip `allowPrivateNetworks`.

If you maintain a homegrown MCP server rather than Google’s toolbox, the PR docs’ default policy is still worth copying: **default-deny on resolved IPs, redirect re-checks, fail-fast config, explicit CIDR exceptions.** The class lesson outlives the CVE id.

## Closing

CVE-2026-14540 looks like another “HTTP client mishandled redirects” headline, but it lands at the moment **agents already treat MCP tool servers as production dependencies**. What was missing was an egress boundary; what landed was SSRFGuard and default-deny for private networks; the industry lesson is that **SCA call graphs break at the JSON-RPC tool boundary, and exposure ≈ reachability**.[1][3][4]

Upgrade to **1.5.0+**, tighten `allowPrivateNetworks` / `allowedIpRanges` / `customBlockedIpRanges`, and put the MCP tool inventory into dependency and change process—those beat chasing a trending CVE title. Models can help choose tools; they **cannot** decide which IPs must never be fetched on someone else’s behalf. Keep nailing the control plane down: contracts own side-effect cardinality, guards own proxy destinations, audit owns whether you can trust the record afterward. With all three, an agent starts to look like a production system rather than a chat box with tools attached.

If you take one sentence: **treat MCP tool servers as a new dependency class, and treat HTTP egress default-deny as a baseline peer to authentication.** CVE numbers age; the class boundary does not.

## References

[1] GitHub Advisory GHSA-3x3x-8ffg-ghcv (CVE-2026-14540): affected `googleapis/mcp-toolbox` 0.3.0–1.4.0; CWE-918; high; CVSS v4 ≈8.0 / v3.1 6.1. <https://github.com/advisories/GHSA-3x3x-8ffg-ghcv>

[2] CVE Record CVE-2026-14540. <https://www.cve.org/CVERecord?id=CVE-2026-14540> · NVD: <https://nvd.nist.gov/vuln/detail/CVE-2026-14540>

[3] googleapis/mcp-toolbox PR #3448 (SSRFGuard and HTTP source docs: `allowPrivateNetworks` / `allowedIpRanges` / `customBlockedIpRanges`; default blocks private, loopback, link-local including `169.254.169.254`). <https://github.com/googleapis/mcp-toolbox/pull/3448>

[4] Anas Mohiuddin Syed, *I found an SSRF in Google's official MCP Toolbox* (coordinated disclosure write-up; SCA blind spot; exposure≈reachability; `mcp-safeguard`; timeline 2026-07-03 / 2026-07-31). <https://anas-security-portfolio.vercel.app/google-mcp-ssrf.html>

[5] In-site: [Where Does Exactly-Once Live?](/blog/exactly-once-model-harness-tool-contract/) (model / harness / tool contract)

[6] In-site: [LLM agents tampering their own traces](/blog/llm-agents-tamper-own-traces-append-only-audit/) and append-only audit

[7] In-site: [Cloudflare security-audit-skill](/blog/cloudflare-security-audit-skill-for-coding-agents/), [Control the Harness, Control the Cost](/blog/control-the-harness-control-the-cost/), [hard-stop / preemption](/blog/hard-stop-kernel-preemption-rogue-agent-containment/)

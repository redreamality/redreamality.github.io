---
title: "Claude Cowork Moves Execution to the Cloud: Should an Agent's Hands Run in a Local VM, a Per-Session Sandbox, or Its Own Cloud Computer?"
description: "From October 6, new Claude Cowork tasks on Pro/Max run in per-session cloud sandboxes by default, with local files proxied through the desktop app. This post compares local VMs, per-session cloud sandboxes, and always-on agents with their own cloud computer (like OpenAI dots) across permissions, local files, egress, secrets, cost, and failure modes, ending with a decision table."
pubDate: 2026-10-06T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "security", "developer-tools", "anthropic"]
lang: "en"
---

On October 5, Simon Willison quoted Anthropic's Felix Rieseberg on a Claude Cowork architecture change. The "old" Cowork ran inference in the cloud but executed tool calls in an Anthropic-provided VM shipped to your computer. The "new" one runs both in the cloud: each session gets its own sandbox sharing no state with others, and when the VM needs something on your device (like a file), the desktop app handles that tool call.[1] Per the help center, from October 6, 2026, new Cowork tasks on Pro and Max run in the cloud and the "Only on your computer" setting is removed.[2]

As news, that's "Cowork moved to the cloud." But it answers a question every agent team eventually faces: **where should the agent's hands—the part that runs commands, touches files, and drives a browser—execute?** Around the same time, OpenAI launched dots, always-on agents with their own cloud computer, and moved Codex into cloud environments;[5][6][8] Microsoft's Autopilot has "its own identity, memory, computer and workspace" in your tenant.[13] The answers differ; the trade-offs fit in one table.

Related groundwork on this site: [sandboxing is not enough](/blog/sandboxing-not-enough-rogue-agents-authority/) on why isolation needs a permission story; [OpenShell and Sentry](/blog/nvidia-open-agent-safety-openshell-sentry/) on moving enforcement out of the harness; [PixelLeak](/blog/pixelleak-coding-agents-public-screenshot-egress/) on agents opening their own egress channel; and [SSRF in MCP Toolbox](/blog/google-mcp-toolbox-ssrf-tool-path-boundary/) on network boundaries along the tool path.

## Getting the facts straight: what changed in Cowork

Lining up the primary sources:

**Old (local execution).** Inference ran in the cloud. Felix says the VM was added for capability, safety, and security, mapping in only data you explicitly added.[1] The architecture doc is more precise: the agent loop runs natively on the device—conversation, file I/O in connected folders, web fetches, local plugin MCP servers—behind an application-layer permission system; shell commands and Claude's code run in a dedicated Linux VM isolated by the hypervisor (Apple Virtualization.framework on macOS, Hyper-V on Windows), with its own egress filtering, syscall restrictions, and per-session user isolation.[3] Strictly, then, file and web tools were on the host and code execution was in the VM.

People didn't love the VM's disk, battery, and performance cost, nor that closing the laptop stopped the work.[1]

**New (cloud execution).** The agent loop and code execution run in an isolated, temporary sandbox on Anthropic-managed infrastructure, created at session start and destroyed at the end, sharing no state across sandboxes or organizations, and kept separate from Anthropic's corporate, research, and training environments.[3] Five key properties:[3]

- No access to your network by default: the sandbox can't reach private, internal, link-local, or cloud-metadata addresses, nor Anthropic-internal systems.
- Network access follows your existing policy: the same setting that governs local Cowork and chat; no network access is the default for Enterprise.
- Egress enforced outside the sandbox: all outbound traffic passes a mandatory proxy the sandbox can't reconfigure or bypass, and only allow-listed destinations are reachable.
- Short-lived credentials only: session-scoped tokens that expire within hours; connector authorization tokens never enter the sandbox, and connector calls are made server-side.
- Tenant isolation at the data layer: every stored record is scoped to organization and account.

**What about local files.** A cloud session's request for a local file or the browser goes over an Anthropic-brokered connection to the Claude Desktop app on that device, limited to connected folders, with each local tool call checked against the user's permissions; if the app is offline, the device is unreachable.[3] Claude fetches **a copy of just the file** it needs, deleted when you delete the session.[2] From web and mobile, local files are reachable only while the desktop app is open **and the session was started on desktop**; otherwise the session runs on without them.[2]

**Migration details.** Tasks already started locally stay there until done, with a transcript download to continue in Claude Code. Scheduled tasks move to the cloud; those using local files need the desktop app open. To keep work local, the official path is Claude Code desktop, though projects and schedules don't carry over.[2] Local connectors and plugins with local MCP servers work only through the desktop app; local MCP servers don't run in cloud sessions.[2][3]

## Three archetypes: separate the brain, the loop, and the hands

"Where does the agent run" usually mixes three layers. OpenAI's enterprise docs split a task into coordination—deciding steps and keeping the conversation moving—and execution, the work a tool performs, such as running a shell command.[10] Add inference and you get:

| Layer | What it does | Old Cowork | New Cowork |
| --- | --- | --- | --- |
| Inference (brain) | Produces the next step | Cloud | Cloud |
| Agent loop / coordination | Picks tools, manages context | Native on device | Cloud sandbox |
| Execution (hands) | Commands, files, browser | Code in local VM; file tools on host | Code in cloud sandbox; local files and browser via desktop app |

From these layers, three archetypes emerge (my classification, not anyone's official terminology):

**Archetype A: local VM.** Loop and execution on the user's device, code in a local VM; old Cowork is the example. Data stays on the device, but it eats local resources and stops when the device does.

**Archetype B: per-session cloud sandbox.** Each session or task gets a temporary isolated environment that is destroyed or expires. New Cowork is this; Codex Cloud is close: each new task gets its own isolated workspace from a published environment, defaulting to 4 vCPUs, 16 GiB memory, and 32 GiB disk on Pro/Business/Enterprise, with VM state recoverable for up to seven days after last use.[8]

**Archetype C: always-on agent with its own cloud computer.** A long-lived computer keeps state across tasks, and the agent works even when nobody asks. Per OpenAI's docs, a dot lives in the cloud with its own computer and browser, stays available when your computer is off, and keeps state between periods of use, with its own files, software, and browser sessions.[6] Microsoft's Autopilot is likewise cloud-hosted with its own identity, memory, computer, and workspace in your tenant.[13]

A common **hybrid** puts coordination in the cloud and execution locally: OpenAI's local computer access for Work Cloud moves coordination to the cloud but not every tool or file; steps needing the computer are still served by it.[10] New Cowork is essentially B plus a callback channel. Dots can also connect one personal computer (off by default) and create local Work or Codex tasks there.[6]

## Item by item: what changes after moving to the cloud

### Permissions: capability boundaries and behavioral rules are different things

New Cowork has two layers. The **capability boundary**: cloud sessions touch only connected folders, each local tool call is permission-checked, and admins can disable cloud sessions, set network policy, turn off persistent "always allow," and require trusted devices.[3] The **approval mode**: "Manually approve," "Automatically approve" (Claude reviews each action before it runs), or "Skip all approvals" (nothing checks); permanent deletion always needs your confirmation.[4]

For dots, actions that could affect accounts or share information get an automatic review that decides: proceed, ask, or make you do it (e.g., changing a password); custom rules have four settings—act without asking, act when you say so, ask first, hand off to you.[7] The docs say these rules "are instructions your dot tries to follow, and it can make mistakes," and **don't grant** any access.[7]

My reading: both separate "what it can touch" (system-enforced) from "when to stop and ask" (model-followed); know which you rely on. For treating the latter as the former, see [tool instructions are not enforcement](/blog/openai-reference-tool-escape-instruction-not-enforcement/). One exception: Anthropic says computer use has "no sandbox between Claude and what's on your screen" and skips the permission checks gating other tools.[4] Turn it on, and execution is back on your desktop.

### Local files: from "files stay home" to "folders stay home, copies travel"

The old promise: only data you explicitly added was mapped into the local VM.[1] The new wording needs care: "your folders stay on your computer," but Claude fetches **a copy** of any file a task needs, and local files opened through the desktop app are processed on Anthropic's servers.[2][4] The safety guide adds that on organization-managed computers, connected folders become reachable from cloud sessions.[4]

Teams with residency requirements should re-evaluate: "connected a folder" went from "the local VM can see it" to "a cloud session pulls copies on demand." The [macOS Full Disk Access](/blog/macos-full-disk-access-consent-not-least-privilege/) post argued one-time consent isn't least privilege scoped by directory and task. Give the agent a dedicated working folder, as Anthropic also recommends.[4]

For dots, local access is off by default and needs "Allow access" confirmed in the ChatGPT app on that computer; "Offline" **does not revoke** it—you must select "Revoke access."[6]

### Egress: cloud sandboxes tighten the defaults, but not all traffic goes through that door

A cloud sandbox has a natural advantage: it isn't inside your network. Cowork denies private, link-local, and cloud-metadata addresses by default,[3] closing the commonest move in the [MCP Toolbox SSRF](/blog/google-mcp-toolbox-ssrf-tool-path-boundary/) class—making a tool request internal or metadata services for you. A local VM needs correct filtering on every machine; the cloud enforces it in one place.

But note the safety guide's "Important" box: **network egress permissions don't apply to web fetch, web search, or MCPs**, including Claude in Chrome; web fetch runs server-side, limited to search results and URLs you've shared.[4] The allowlist governs code in the sandbox, not the hands the agent extends through server-side tools and connectors. Team/Enterprise owners can disable web search or Claude in Chrome.[4]

Compare Codex: legacy Codex Cloud blocks internet during the agent phase by default while setup scripts keep it for dependencies; when enabled, you can allowlist domains and restrict methods to GET, HEAD, and OPTIONS.[9] The docs' injection example is an issue hiding an instruction to POST `git show HEAD` output somewhere.[9] GET-only stops that, but not data encoded into a GET URL—my inference.

Matthew Green puts it best: a useful agent needs a door, walls ensure traffic uses the door you chose, and security becomes watching everything through it; in the incidents he recounts, the door was the only permitted egress—a package-registry proxy.[16] [PixelLeak](/blog/pixelleak-coding-agents-public-screenshot-egress/) is likewise an agent opening its own egress via a legitimate channel. Cloud execution means fewer, more central doors—real progress—but someone still has to watch them.

### Secrets: everyone is converging on "a proxy fills in the credential"

Here the vendors look strikingly similar:

- Cowork's cloud sandbox holds only session-scoped tokens that expire within hours; connector authorization tokens never enter the sandbox, and connector calls happen server-side.[3]
- Codex Cloud distinguishes "environment variables" from "network secrets": with the latter, programs see only a placeholder, and the proxy substitutes the real value for requests to allowed domains (HTTPS on port 443 only), so the raw credential never lands in a process or file; cloud resources use OIDC for short-lived credentials.[8]
- OpenShell says agents never see real credentials; OpenShell adds them only to requests bound for approved endpoints.[15]
- Dots sign in to websites via a private form that sends credentials to the remote browser outside the conversation, and reusing a saved login requires your confirmation.[6] Press reports relay OpenAI's claim that dots can use saved passwords without exposing them to the model.[12]

My reading: "no long-lived secrets inside the sandbox" is becoming a baseline requirement for execution environments. The difference is **who holds that proxy**—on your device in the local-VM era, on the vendor's side in the cloud-sandbox era.

### Cost: from your battery to the vendor's quota

Felix's costs were disk, battery, and performance.[1] In the cloud they become the vendor's, billed as allowances or usage. Codex Cloud publishes default per-task VM specs;[8] Microsoft runs Cowork, Code, and Autopilot on usage-based billing, with "FinOps for AI" tooling for spend management;[13] the first dot is included in Pro and Business Premium plans.[11]

Inference: archetype C works unasked (dots do proactive research with read-only tools[7]), so spend decouples from tasks you start. [Default hard budget caps](/blog/default-hard-budget-caps-agent-deployed-services/) argued downstream services need a hard stop; always-on agents do too.

### Failure modes: the new one is "half-connected"

The three archetypes break differently:

- **Local VM won't start.** Per the Cowork docs, file and web tools keep working while shell and code execution report "workspace unavailable" until the VM recovers.[3]
- **Cloud sandbox, local half disconnected.** If the desktop app is closed, the session keeps running but can't reach local files.[2] It hasn't stopped; it's lost a hand. My recommendation: tasks depending on local files should stop and ask, not continue on stale copies or guesses.
- **Always-on agent, doesn't stop cleanly.** The dots docs separate three stops: Pause halts the main task but not delegated tasks or future scheduled runs; delegated tasks are stopped individually; schedules are disabled under Scheduled. Stopping doesn't undo completed actions, and deleting a dot doesn't recall delivered messages.[7] If a site blocks the cloud browser, the dot can use your connected computer, possibly in a new local task[6]—execution location can change mid-task.

Scheduled tasks amplify all three. Anthropic advises starting low-risk, not scheduling anything that touches sensitive files, sends messages, or buys things, reviewing each run, and pausing unused tasks.[4]

### Observability: EDR goes blind, vendor logs take over

Easy to miss: the Cowork architecture FAQ says endpoint detection (EDR) can't inspect the local VM, by design, and cloud sessions run entirely outside your endpoints, so EDR can't see them either; if compliance depends on endpoint visibility, plan for it before rollout.[3] The alternatives are the Compliance API and OpenTelemetry event streams for Team/Enterprise.[3][4]

Two of NVIDIA's five principles map directly: enforcement must be out of band (controls don't live inside the agent or within its reach), and the path to the model is the control point, because an agent can't act without its next thought.[14] In B and C, both control points sit with the vendor; you get the logs and switches it exports, not your own probe on the path. [Hard Stop](/blog/hard-stop-kernel-preemption-rogue-agent-containment/) argued both sides need a forced stop; for hosted agents, the question is what the vendor's stop button actually stops.

## Isolation limits where code runs, not what the agent reads or does

Anthropic's safety guide has what I consider the most honest sentence here: "Isolation limits where Claude's code runs. It doesn't limit what Claude reads or does." A cloud session can still browse, read email and documents via connectors, and work in connected folders—each a path for untrusted content in and agent actions out.[4] The guide's test: prompt injection needs Claude to **both** read content outside your trust boundary **and** take actions that could compromise you; remove one, and attacks get much harder.[4]

This matches Green's third frame: agents that never leave their sandboxes and do exactly what they're told—by someone who shouldn't be giving orders; swap a shared package cache for email, Slack, and shared docs, and a worm has every ingredient.[16] Cloud sandboxes barely help, since the attack uses channels the agent is allowed to use.

Plugins make this more pressing. In Anthropic's open-source knowledge-work-plugins, each plugin bundles skills, connectors, slash commands, and sub-agents, with connectors wired to MCP servers via `.mcp.json`—all markdown and JSON.[18] The safety guide warns that installing a plugin can significantly expand Claude's scope of action, and that local MCP servers bundled with plugins run on your computer with the same permissions as any other program.[4] Combined with "local MCP servers don't run in cloud sessions,"[3] my inference: **after the move to the cloud, the riskiest part of execution didn't actually move**; only the caller is now in the cloud. Enterprises can set the MDM key `isLocalDevMcpEnabled` to false to disable local MCP servers, leaving cloud sessions with only the folder-limited desktop file tools.[3]

## Where the others sit, and why isolation is getting cheaper

Putting the public descriptions side by side:

- **Microsoft**: Copilot's Code runs in a sandboxed environment and can be hosted in your tenant; Copilot Managed Runtime lets code run inside your company's own Microsoft 365 environment, governed by IT; Autopilot is an always-on agent with its own identity and computer.[13] Note that Copilot also has a delegation mode called Cowork, unrelated to Claude Cowork.[13]
- **OpenAI**: dots have their own cloud computer; Codex Cloud uses per-task VMs; the Agents API now supports computer use with OpenAI running the underlying infrastructure; and Bedrock Managed Agents let OpenAI agents run entirely in AWS.[5]
- **NVIDIA**: OpenShell is an open-source (Apache 2.0) runtime that puts each agent in a sandbox, enforces policy at the kernel level on file access, system calls, and network connections, and uses formal verification to flag what new access a policy change would grant; it runs locally or deploys to Kubernetes via Helm.[15] In other words, "where execution happens" and "who sets the policy" can be decoupled—a separate axis from A/B/C.

Isolation is also getting cheaper. On October 2, gVisor announced its CNCF donation; the post says its process model allows bin-packing density VM-based runtimes can't match, without hardware or nested virtualization, and lists adopters including Google, Ant Group, OpenAI, and Anthropic.[17] To be clear: it does **not** say Cowork's sandbox uses gVisor, and I found no public statement that it does. It shows a trend: per-session isolation is getting cheaper, a precondition for B as the default.

## Counterexamples and boundaries: when local still wins

In these cases, archetype A or the hybrid is still the better fit:

1. **Data can't leave the device.** In new Cowork, local files opened through the desktop app are processed on Anthropic's servers.[4] With hard residency requirements, use local Claude Code, or don't connect that folder at all.
2. **Compliance depends on EDR.** Cloud sessions are outside your endpoints; EDR can't see them.[3]
3. **Toolchain only exists locally.** Local MCP servers, internal dependencies, local sign-in state. Codex Cloud offers VPN (Tailscale is currently supported) and OIDC to connect cloud tasks to private networks,[8] but that opens an entry point into your network for the agent and needs its own review.
4. **You need to iterate in the same environment.** Archetype B starts clean each time; Codex's existing tasks keep their own files and installed tools,[8] and archetype C's computer keeps state across tasks.[6]

Archetype C suits work that watches something continuously, but amplifies cost, stopping, and permission drift; archetype B is a sensible default for most one-off delegated tasks.

## A checklist for Cowork users after October 6

If you use Cowork on Pro/Max, walk through these (based on the help center and safety guide):[2][3][4]

1. List every local folder you've connected, remove the ones you don't need, and switch to a dedicated working folder.
2. Review scheduled tasks: which use local files (need the desktop app open), which send messages or touch sensitive data.
3. For old tasks still running locally, download the transcript before finishing; move work that must stay local to Claude Code.
4. Audit installed plugins, especially those with local MCP servers; they still run on your computer with your permissions.
5. For sensitive accounts, first-time tools, or hard-to-undo actions, switch to "Manually approve."
6. Enterprise admins: confirm the cloud-session toggle, network policy, whether persistent "always allow" is off, and whether trusted devices are required; assess the compliance impact of EDR blindness; use MDM to disable local MCP servers and desktop extensions as needed.

## Decision table: how teams should choose where agents run

| Question | Lean local VM (A) | Lean per-session cloud sandbox (B) | Lean always-on cloud computer (C) |
| --- | --- | --- | --- |
| Can data leave the device? | No | Yes; per-file copies acceptable | Yes, including long-term residency |
| Task shape | Interactive, short | One-off delegation, parallelizable | Continuous, proactive, multi-day |
| Must continue when device is off? | No | Yes | Yes |
| Needs local tools / sign-in state? | Yes | Occasionally, via callback channel | Occasionally, via connected computer |
| Compliance depends on endpoint visibility? | Yes (though EDR can't see inside the VM either[3]) | No; use vendor logs | No; use vendor logs |
| Internal network needs | Already inside | Isolated by default; VPN / OIDC opened separately | Same as B, and always online |
| Cost pressure point | Device resources | Per-task quota | Continuous spend; needs hard cap |
| Main failure | VM won't start | Callback lost (half-connected) | Doesn't stop cleanly; permission drift |

Whichever column you pick, this checklist applies:

- [ ] No long-lived secrets in the sandbox; credentials are injected per destination by a proxy outside it.
- [ ] Egress allowlist enforced outside the sandbox, with an explicit list of **which traffic bypasses it** (server-side tools, connectors, browser).
- [ ] Private, link-local, and cloud-metadata addresses denied by default.
- [ ] Local access granted per folder and per session; "offline" and "revoked" are distinct states, and the team knows how to revoke.
- [ ] System-enforced capability boundaries distinguished from model-followed behavioral rules; high-risk actions rely on the former.
- [ ] Agreed behavior when the callback channel drops: stop and ask, not continue on stale data.
- [ ] Documented scope of the stop button: how main, delegated, and scheduled tasks are each stopped.
- [ ] Audit sources settled: EDR, vendor Compliance API, OpenTelemetry—which covers which segment.
- [ ] Long-running or always-on agents have a hard budget cap, not just alerts.
- [ ] Plugins and MCP servers go through review; local MCP servers are governed like any local program.

The Cowork change itself isn't complicated. What's worth remembering is the boundary Anthropic wrote down itself: isolation decides where code runs, not what the agent can read or do.[4] Execution location is an engineering choice; permission design is the security choice. Evaluate them separately.

## References

1. Simon Willison, "A quote from Felix Rieseberg," 2026-10-05: <https://simonwillison.net/2026/Oct/5/felix-rieseberg/>
2. Claude Help Center, "Use Claude Cowork on web, desktop, and mobile": <https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile>
3. Claude Help Center, "Claude Cowork architecture overview": <https://support.claude.com/en/articles/14479288-claude-cowork-architecture-overview>
4. Claude Help Center, "Use Claude Cowork safely": <https://support.claude.com/en/articles/13364135-use-claude-cowork-safely>
5. OpenAI, "DevDay 2026 Recap," 2026-09-29: <https://openai.com/index/devday-2026-recap/>
6. OpenAI Learn, "Connect computers and apps to your dot": <https://learn.chatgpt.com/docs/dots/computers-and-apps>
7. OpenAI Learn, "Control your dot": <https://learn.chatgpt.com/docs/dots/controls>
8. OpenAI Learn, "Cloud environments" (Codex Cloud): <https://learn.chatgpt.com/docs/environments/cloud-environments>
9. OpenAI Learn, "Codex Cloud (Legacy): internet access": <https://learn.chatgpt.com/docs/cloud/internet-access>
10. OpenAI Learn, "Local computer access for Work Cloud and dots": <https://learn.chatgpt.com/docs/enterprise/cloud-local-access>
11. 9to5Google, "OpenAI launches Dots, new 'always-on agents' you can assign tasks to," 2026-09-29: <https://9to5google.com/2026/09/29/openai-dots-agent/>
12. The Indian Express, "OpenAI's Dots explained," 2026-10-01: <https://indianexpress.com/article/technology/artificial-intelligence/openai-dots-always-on-ai-agents-explained-10900652/>
13. Microsoft, "Introducing the new Copilot with Home, Code and Autopilot," 2026-09-25: <https://blogs.microsoft.com/blog/2026/09/25/introducing-the-new-copilot-with-home-code-and-autopilot/>
14. NVIDIA Developer Blog, "NVIDIA Open Agent Safety Platform: A Reference for Continuous In-Silicon Agent Monitoring," 2026-09-28: <https://developer.nvidia.com/blog/nvidia-open-agent-safety-platform-a-reference-for-continuous-in-silicon-agent-monitoring/>
15. NVIDIA/OpenShell README: <https://github.com/NVIDIA/OpenShell>
16. Matthew Green, "Is sandboxing sufficient to contain rogue agents?," 2026-09-30: <https://blog.cryptographyengineering.com/2026/09/30/is-sandboxing-sufficient-to-contain-rogue-agents/>
17. gVisor Blog, "gVisor is being donated to CNCF," 2026-10-02: <https://gvisor.dev/blog/2026/10/02/gvisor-cncf/>
18. anthropics/knowledge-work-plugins README: <https://github.com/anthropics/knowledge-work-plugins>

Note: OpenAI's dots launch page (openai.com/index/introducing-dots/) and its help center article returned 403 when fetched; facts about dots here come from the OpenAI Learn docs [6][7][10], the DevDay recap [5], and press coverage [11][12].

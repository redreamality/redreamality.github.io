---
title: "Codex Moves to the Cloud: Reusable Environments, Codex Security Cloud, and the Agents API with Computer Use (DevDay 2026)"
seoTitle: "Codex Cloud, Codex Security Cloud & Agents API: DevDay 2026 Guide"
description: "OpenAI DevDay 2026, read as one harness story: Codex Cloud's reusable environments, Codex Security Cloud's scan–validate–fix loop, and the Agents API's computer use and multi-agent support—compared with Claude Cowork's cloud sandbox and the local CLI, plus a selection checklist."
pubDate: 2026-10-12T16:45:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "ai-coding", "security", "mcp"]
lang: "en"
---

OpenAI's DevDay on September 29 came with a recap listing more than 20 major announcements across ChatGPT, Codex, models, and new ways of working.[1] We already covered the headline item, [dots](/blog/openai-dots-always-on-agent-engineering/), in a separate post, so I won't retell it here. Of the rest, three announcements make more sense read together: **Codex in the cloud** (cloud Codex with reusable development environments), **Codex Security Cloud** (scan repositories, validate vulnerabilities, and prepare fixes in the cloud), and **computer use in the Agents API**, which also brings Codex's multi-agent capabilities, tool search, tool calling, and context compaction into your own application.[1]

All three describe the same thing: the coding-agent harness—the loop, tools, sandbox, and state management wrapped around the model—is being split into products you can buy or rent separately. Codex Cloud sells "which machine the agent works on." Security Cloud sells "use that same machine to hunt for vulnerabilities." The Agents API sells "embed the whole loop in your product." The question that matters when choosing is who owns each layer, and who is on the hook when something goes wrong.

Related: [Claude Cowork Moves Execution to the Cloud](/blog/claude-cowork-cloud-sandbox-where-agents-run/) already compares the three ways to place an agent's execution and lists Codex Cloud's default VM specs; [The Agent Harness Pattern](/blog/inside-claude-code-agent-harness/) covers harness structure; this morning's [DeepSeek DSec](/blog/deepseek-dsec-agent-rl-sandbox-execution-layer/) covers sandboxes for **training**, this one sandboxes sold as a **product**. Sources are mainly OpenAI's recap, developer docs, and help center; "My take" marks my opinion.

## The three announcements on one table

| Announcement | For whom | Where the agent runs | Availability at launch |
| --- | --- | --- | --- |
| Codex in the cloud | Developers, teams | OpenAI-managed cloud VMs, one isolated workspace per task[2][3] | Plus, Pro, Business, Healthcare, Education, Enterprise[1] |
| Codex Security Cloud | Security teams, maintainers | Ephemeral isolated Codex containers[8] | Pro, Business, Enterprise, Edu on desktop and web[1]; research preview[6] |
| Agents API (computer use) | Product developers | OpenAI-hosted sandbox, your own environment, or no environment[12] | API; in Codex and ChatGPT Work on Pro 500 and Enterprise[1] |

Alongside: the refreshed Codex CLI adds voice steering and an `/agents` view for tracking multiple tasks, and the desktop Code Review can have Codex take a first pass on a PR in the cloud while you're away.[1] I'll only bring these in for contrast.

## Codex Cloud: the environment becomes something you "publish"

The old approach: a cloud agent gets a container, you write a setup script, the agent starts. The new Codex Cloud turns that step into a versioned object, the **cloud environment**: repositories, dependencies, tools, and access settings bundled for tasks to reuse.[2]

Creation is conversational. You pick GitHub repositories; Codex inspects them, installs dependencies and tools, and tests the workflow; it asks you when access or information is missing; you review the setup report, configuration, and files, and when you're satisfied you click **Publish**.[2] Codex records the tested steps in two fields: an **Install script** (commands to install dependencies and prepare development assets) and a **Start skill** (instructions to start services and check that they're ready).[2] The docs say you don't need to write an install script yourself.

After publishing, how state flows is the heart of the design:[2]

- A **new task** starts from the published environment's prepared filesystem.
- An **existing task** continues with its own saved files, including uncommitted changes and installed tools.
- **Repository refresh** runs automatically in the background, preserving dependency caches without rerunning install or startup commands.
- To change the environment you go through Edit → let Codex prepare and test → **Republish**; only new tasks after that use the new setup, and existing tasks keep their state.

Saved VM state is recoverable by default for up to 7 days after the last turn or resume—a VM recovery window, not a chat-history retention period. A new task can't recover another task's uncommitted changes, so commit important work.[2][3]

My take: "publish / republish" turns the environment from a throwaway script into a shared team baseline, a bit like an image tag. You get fast startup and a consistent starting point; you also get one more thing to maintain—forget to republish after a dependency upgrade and new tasks keep starting from a stale snapshot.

### Credentials, networking, and sharing

Credentials come in two kinds. **Environment variables** are passed directly to programs. **Network secrets** give programs only a placeholder; a proxy substitutes the real value when a request goes to an allowed domain, for HTTPS on port 443 only, and the raw credential never lands in a local process or file.[2] There's also a **Personal vault**: a shared environment can declare that it needs a key, and each person fills it from their own account. What's shared is the requirement, not your credential.[2]

Enterprise workspaces can share an environment workspace-wide. Using it doesn't let you see others' tasks or edit the environment, but its prepared files, environment-owned credentials, cloud identities, and VPN connections do give teammates shared service access; repository access depends on the account running the task.[2][3]

Egress is governed by two stacked layers: the environment's own internet access settings (a Package managers preset, custom domains only, or unrestricted), plus workspace requirements set by admins in **Agent Security**.[2][5] Two sentences from the Agent Security docs are worth copying down: a domain allowed in Agent Security does **not** override a restriction in the environment's internet settings; and where policy permits full sandbox escalation and it's approved, that execution can bypass the command proxy.[5] Private networks go through a VPN (currently Tailscale only), and cloud resources use OIDC for short-lived credentials; OIDC is available by request for Enterprise.[2]

The current limitations matter too: cloud environments don't yet support computer and browser use, GitLab, or self-hosted GitHub Enterprise Server; skills stored in the repository are available, but personal skills on your local machine aren't synced.[2] During the transition, Code Review, Security Review, and the Linear and GitHub integrations still run on Codex Cloud (Legacy); legacy environments can be migrated manually, and migration leaves the original unchanged.[3] The help center also states that Codex in the cloud is not covered by OpenAI's BAA, so don't use it to process protected health information.[3]

OpenAI's intro video sums it up: start a Codex task, close your laptop, pick it up from your phone, and share an environment with repositories, networking, and secrets with your team.[4] (I checked only its title and description; there's no transcript.)

## Codex Security Cloud: scan, validate, and fix in the same environment

Codex Security already had local forms (a desktop plugin, a CLI, and a TypeScript SDK). The new **Codex Security Cloud** is a separate plugin that scans GitHub repositories connected to Codex cloud.[6] The recap puts it this way: scan entire repositories on demand or on a schedule, with ongoing checks of new commits; Codex investigates findings, removes duplicates, and prepares fixes in the cloud, even with your laptop closed.[1]

The docs break the pipeline into four steps:[8]

1. **Analysis**: build a threat model for the repository—a project overview plus attack-surface detail such as entry points, trust boundaries, auth assumptions, and risky components.
2. **Scanning**: review the whole repository once, or monitor new commits on the default branch, optionally reviewing commit history.
3. **Validation**: try to reproduce suspected vulnerabilities in a clean isolated container; findings that reproduce are marked validated, which reduces false positives.
4. **Remediation**: provide guidance and, where possible, a minimal actionable diff for a human to review before opening a PR.

The boundaries are explicit. Each job runs in an ephemeral Codex container with session-scoped tools, torn down after artifacts are extracted.[8] Patches are **not** auto-applied and don't directly modify your PR branch; a draft PR is only opened when you choose "Create draft pull request."[7][8] It doesn't rely on fuzzing or signatures but on language-model reasoning, test-time compute, tool use, and large context.[9] The docs also say plainly that it complements SAST rather than replacing it, and that it doesn't replace human exploitability checks and threat assessment.[8] The threat model is visible and editable, and OpenAI recommends refining it as your architecture changes.[8][9]

The link to Codex Cloud: a scan needs a compatible Codex cloud environment. When creating a scan you can choose **Auto** to create one, or pick an existing environment; during validation it may try to build the project inside the container if that helps reproduce an issue.[7][8] On permissions, Enterprise and Edu workspaces must enable both Codex Cloud and Codex Security, and can restrict access by role or group (including SCIM-synced groups); managing scan configurations requires a separate admin permission.[9]

Read the **Daybreak Blue** line carefully. The recap says Security Cloud includes Daybreak Blue models without a separate Daybreak application.[1] Daybreak is OpenAI's Trusted Access for Cyber program; Blue reduces refusals on mainline models such as GPT-6 Sol and GPT-6 Luna for defensive work like triage, secure code review, and patch validation.[10] But that included access applies only within the Cloud product—not other Codex Security products or the API.[9]

Billing was settled two days after launch. Scans set up after 12:53 PM Pacific on October 1, 2026 (03:53 October 2, Beijing time) are billed on token usage at plan rates and are **not** covered by included plan usage. Eligible accounts without earlier continuous scanning get $500 in non-expiring free credits shared across the workspace; continuous scans set up before the cutoff stay free until October 15, then pause unless paid usage is enabled. Each scan shows its token usage and cost.[8]

My take: the genuinely interesting part of Security Cloud is that it shares the same environment object as the coding agent. Whether a vulnerability can be reproduced depends on whether the environment can run the project, so the environment you set up for Codex to write code doubles as the base for security validation. Conversely, a sloppy environment means more false positives and more "couldn't validate." OpenAI's own rollout advice: start small, and teams not on GitHub Cloud should begin with lower-risk or non-production repositories.[9]

## Agents API: renting the Codex harness to your application

The Agents API turns the same machinery into an interface. The docs open with: "The Agents API gives your application access to the Codex harness through an OpenAI-managed API."[11] OpenAI manages sessions, orchestration, context compaction, and recovery; your application provides tools and chooses its execution environment.[11]

There are only four concepts: **Agent** (model, instructions, tools, MCP servers), **Environment** (an optional sandbox or computer), **Session** (a durable agent instance), and **Events and items** (inputs and outputs).[11] There are three environment choices:[12][13][14]

- **No environment**: for agents that answer questions or call external services. Built-in Bash, apply-patch, and workspace files are unavailable.
- **OpenAI-hosted sandbox**: a Linux workspace with Python, Node.js, and common command-line tools. Sizes are 1 vCPU/1 GB, 2 vCPU/4 GB, or 4 vCPU/16 GB. Network access can be fully open, fully blocked, or restricted to 1–100 exact hostnames (no wildcards; subdomains and redirect targets need their own entries). If activity and keep-alives stop for an hour, the sandbox can be deleted, and that timeout isn't configurable.[13]
- **Self-hosted environment**: run the executor (the Codex CLI) on your laptop, a container, or a remote sandbox. It uses a restricted environment key to open an outbound WebSocket and runs the commands the harness sends; all connections are outbound; the docs list setups for Modal, E2B, Daytona, and others.[14]

The security page is blunt: agent code can reach whatever files, credentials, and network its environment has; the environment key is readable by agent code, so it can only connect environments; third-party credentials stay outside—vault secrets with proxy substitution when hosted, a trusted proxy you build when self-hosted.[15] Same pattern as Codex Cloud's network secrets.

Billing: model usage at API rates, tools at standard rates, hosted sandboxes at container rates; I found no more specific numbers.[11]

### Computer use: the browser runs on OpenAI's side

Add the `computer_use` tool, set the environment to OpenAI-hosted with desktop enabled, and the agent can operate websites in a hosted browser—for testing a site, collecting information, or using an application through its UI.[16] The interesting part is where the control points sit:

- **Approval per origin**: the browser needs the user's approval before accessing each new website origin, including public sites; enabling network access doesn't approve these requests.[16]
- **No per-action approval**: the docs have a dedicated section saying origin approval does **not** enforce confirmation before individual actions. If you must guarantee confirmation before purchases, destructive changes, or other consequential actions, restrict the hosted browser to resources that can't perform them, or use a browser runtime you control; asking for confirmation through a function tool depends on the agent choosing to call it.[16]
- **Website content is untrusted**: it can't grant permission or override the user's instructions.[16]
- **Sign-in through a dedicated channel**: emails, passwords, and verification codes the user enters are submitted through a separate event, stay out of the model's input, and are omitted from session history; passkeys and QR-code sign-in aren't supported.[16]
- **Screenshots are sensitive**: show them only to authorized users and keep them out of logs.[16]

My take: this matches what we wrote about [DNS bypass and tool escape](/blog/openai-agent-containment-dns-and-un-bruteforce/) and the authority axis in [Sandboxing Is Not Enough](/blog/sandboxing-not-enough-rogue-agents-authority/): sandboxes and origin allowlists govern "where it can go," not "what it does once there," and OpenAI's docs say so honestly. An easy-to-miss contrast: Codex Cloud environments **don't yet support** browser use,[2] while Agents API hosted environments do—so a cloud coding agent that checks a preview page currently goes through the Agents API.

### Multi-agent: one shared filesystem

With `multi_agent` enabled, the harness supplies tools to create, message, wait for, and interrupt subagents—you don't declare them. `max_concurrent_subagents` defaults to 6, excluding the coordinator.[17] Three details matter:[17]

- The coordinator and subagents **share the environment's filesystem**; creating a subagent doesn't create another environment.
- Subagents inherit MCP tools (with their credentials and allowed tools) and web search settings, but **don't support function tools**.
- The event stream doesn't provide a full inter-agent transcript; to know who ran a command, look up the turn's `subagent_id`.

My take: a shared filesystem makes handoffs easy, and also means a file one subagent breaks is broken for everyone. Subtasks needing isolation belong in separate sessions and environments. And if audit must answer "who ran this command," store the turn-to-subagent mapping.

In passing: **Bedrock Managed Agents** brings the Agents API to AWS—harness and inference in Bedrock, execution on AgentCore Runtime or self-hosted compute, IAM auth—with a warning that shared concepts don't imply identical features.[1][18]

## Side note: the Decisions API is a control-plane piece

DevDay also had a smaller launch: the **Decisions API** focuses Luna on a set of user-defined questions with finite, predefined answers. Input can be text or images, and the output is meant for classifying content, routing requests, or choosing an agent's next action; at launch it was in limited preview.[1] TechCrunch reported Altman explaining on stage that focusing the model on that choice lets it be extremely fast while keeping image understanding, broad language support, and safety protections, and compared it with fast decision models such as TypeSafe's Jev.[19]

In this post's framework: a harness has many decision points that don't need long reasoning—which agent takes this request, should this action be held for review—and a fast finite-choice model is a control-plane component for those. [Control the Harness, Control the Cost](/blog/control-the-harness-control-the-cost/) covers routing and cost. Public details are thin; TechCrunch hadn't yet seen developers test it.[19]

## Side by side: same layer, different owners

| Dimension | Codex Cloud | Codex Security Cloud | Agents API (hosted / self-hosted) | Claude Cowork cloud session | Local Codex CLI |
| --- | --- | --- | --- | --- | --- |
| Who runs the harness | OpenAI[3] | OpenAI[8] | OpenAI[12] | Anthropic[20] | Your computer[5] |
| Who runs execution | OpenAI cloud VM[3] | Ephemeral Codex container[8] | OpenAI sandbox, or the environment you connect[12][14] | Per-session temporary sandbox[20] | Your computer[5] |
| How the environment is made | Prepared conversationally and published; shareable[2] | Auto-created or an existing cloud env[7] | Request parameters / templates, or your own image[13][14] | Created at session start, destroyed at end[20] | Your machine |
| State | Existing tasks keep files; VM state recoverable 7 days by default[3] | Torn down after the job[8] | May be deleted after 1 hour idle (hosted)[13] | Destroyed with the session[20] | You manage it |
| Credentials | Network-secret placeholders, Personal vault, OIDC[2] | Inherits environment; patches not auto-applied[7][8] | Vault placeholders; env key can only connect[15] | Session tokens expire within hours; connector tokens never enter sandbox[20] | Local credentials |
| Egress | Environment settings plus Agent Security[2][5] | Depends on environment settings[7] | Open / blocked / 1–100 hosts[13] | No private-network access by default; Enterprise defaults to no network[20] | Local policy and MDM[5] |
| Browser | Not yet supported[2] | N/A | Hosted browser, per-origin approval[16] | Local browser via desktop app[20] | Depends on local tools |

The most important row is the first: apart from the local CLI, every option runs the harness on the vendor's side. You get to tune **parameters and policy**, not the loop itself. Teams that want to change the loop should still look at harnesses they can modify, like [Pi 1.0](/blog/pi-1-0-codemode-mcp-minimal-harness/).

## Selection checklist

**If your team uses Codex:**

1. Decide what goes to the cloud: long tasks, work that should continue with the laptop closed, and shared starting points. Anything needing a private local toolchain or local sign-in stays in the local CLI.
2. Manage the environment like code: log each republish, republish after dependency upgrades, and verify the starting point with fresh tasks.
3. Prefer network secrets for credentials; use environment variables only when a program must read the raw value. Before sharing an environment, review its files, environment-owned credentials, VPN, and OIDC identity.[2]
4. Start egress from the Package managers preset and add domains as needed. In Agent Security, test one allowed request, one request that should be blocked, and one escalated command.[5]
5. If health data is involved, confirm BAA coverage first.[3]

**If you're evaluating Codex Security Cloud:**

1. Start with a few repositories and dedicated reviewers; edit the generated threat model to match your architecture.[9]
2. Queue validated and unvalidated findings separately. Don't discard unvalidated ones as noise—check the logs to see whether the environment was the problem.[8]
3. Send patches through normal code review, ideally plus Codex Code Review, so fixes don't add regressions.[9]
4. Set a budget: understand the post-cutoff billing rules, your free credit balance, and per-scan token usage.[8]
5. Don't treat it as a SAST replacement; keep your existing deterministic scanning.[8]

**If you're embedding the Agents API in a product:**

1. Pick the environment first: none if you don't need files; self-hosted for private networks or your own image, isolated per user or workload.[12][14][15]
2. Enable computer use only where "origin approved, actions not individually confirmed" is acceptable. For payments, deletions, or outbound sends, use a browser runtime you control or keep resources capable of those actions out of reach.[16]
3. Send sign-in credentials only through the dedicated event; mask them in the UI, keep them out of logs, and don't auto-retry submissions.[16]
4. Multi-agent shares a filesystem by default; split sessions where isolation is needed. Store the mapping between turns and `subagent_id` so audit can trace who did what.[17]
5. Closing the event stream doesn't stop a task; cancel the turn explicitly to stop it, and build in reconnection recovery.[16]

## My take: what OpenAI is selling this round

First, **the environment has become a first-class object.** Harness competition used to center on the loop and tools; this time OpenAI spent much of its documentation on preparing, publishing, sharing, and securing environments. A stable, reusable, auditable starting point is what makes an agent something you can hand to a team.

Second, **security scanning is the environment's second use.** One environment object serves both the coding agent and the validating agent, so its quality affects both development speed and security signal.

Third, **the control points are written in the docs, and readers need to act on them.** Per-origin approval isn't per-action confirmation; Agent Security hooks can fail without blocking; escalation can bypass the proxy—OpenAI states all of these itself.[5][16] Buying a managed harness saves you build cost; it doesn't save you the design decision about which actions must have a human confirm them.

## Conclusion

DevDay 2026's loudest items were dots and new models, but for coding-agent teams these three are more concrete: publishable, shareable Codex cloud environments; security scanning that validates in the same environment; and an Agents API that rents you the whole harness, browser and subagents included. Decide where the agent runs, how credentials get in, and who confirms critical actions—then pick the product.

## References

1. [OpenAI: DevDay 2026 Recap (2026-09-29)](https://openai.com/index/devday-2026-recap/)
2. [OpenAI ChatGPT Learn: Cloud environments (Codex Cloud)](https://learn.chatgpt.com/docs/environments/cloud-environments)
3. [OpenAI Help Center: Using Codex Cloud](https://help.openai.com/en/articles/20001545-using-codex-cloud)
4. [OpenAI (YouTube): Meet the all new Codex Cloud (2026-09-29)](https://www.youtube.com/watch?v=7Bv68f5szSU)
5. [OpenAI Developers: Agent Security (Codex Enterprise)](https://developers.openai.com/codex/enterprise/agent-security)
6. [OpenAI Developers: Codex Security](https://developers.openai.com/codex/security)
7. [OpenAI Developers: Codex Security Cloud setup](https://developers.openai.com/codex/security/setup)
8. [OpenAI Developers: Codex Security Cloud FAQ](https://developers.openai.com/codex/security/faq)
9. [OpenAI Help Center: Codex Security](https://help.openai.com/en/articles/20001107-codex-security)
10. [OpenAI Help Center: OpenAI Daybreak - Trusted Access for Cyber Overview](https://help.openai.com/en/articles/20001258-openai-daybreak-trusted-access-for-cyber-overview)
11. [OpenAI API Docs: Agents API overview](https://developers.openai.com/api/docs/guides/agents-api/overview)
12. [OpenAI API Docs: Agents API architecture](https://developers.openai.com/api/docs/guides/agents-api/architecture)
13. [OpenAI API Docs: OpenAI-hosted environments](https://developers.openai.com/api/docs/guides/agents-api/environments/openai-hosted)
14. [OpenAI API Docs: Self-hosted environments](https://developers.openai.com/api/docs/guides/agents-api/environments/self-hosted)
15. [OpenAI API Docs: Environment security](https://developers.openai.com/api/docs/guides/agents-api/environments/security)
16. [OpenAI API Docs: Computer use (Agents API)](https://developers.openai.com/api/docs/guides/agents-api/tools/computer-use)
17. [OpenAI API Docs: Multi-agent (Agents API)](https://developers.openai.com/api/docs/guides/agents-api/multi-agent)
18. [OpenAI API Docs: Bedrock Managed Agents](https://developers.openai.com/api/docs/guides/agents-api/bedrock-managed-agents)
19. [TechCrunch: OpenAI's Jev clone could help the frontier lab stop its swarming agents (2026-09-30)](https://techcrunch.com/2026/09/30/openais-jev-clone-could-help-the-frontier-lab-stop-its-swarming-agents/)
20. [Claude Help Center: Claude Cowork architecture overview](https://support.claude.com/en/articles/14479288-claude-cowork-architecture-overview)

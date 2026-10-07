---
title: "OpenAI Dots, Unpacked: Who Wakes an Always-On Agent and Who Pays"
description: "OpenAI's dots are always-on agents with their own cloud computer that decide when to wake up. Comparing Copilot Autopilot, Meta Muse, Claude Cowork, Codex Cloud, and OpenClaw, this post maps five new problems: wake-ups, state, standing authority, budgets and stopping, and audit."
pubDate: 2026-10-07T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "security", "openai"]
lang: "en"
---

At DevDay on September 29, OpenAI launched dots. The pitch is "always-on agents": powered by GPT-6 Astra, each dot has its own cloud computer, learns from feedback, can work toward your goals 24/7, and connects to more than 4,000 apps through plugins.[1] The same event also brought Codex in the cloud and an Agents API with computer use.[13] One clarification: Astra is the model (GPT-6 Astra), not the name of the cloud computer.[2]

WIRED's summary is that, unlike a single-turn chatbot, the core selling point of dots is being "always-on."[12] The Register is blunter: behind the cute graphics, dots "are just persistent compute tasks that consume tokens."[11] That is this post's subject: once an agent goes from "you ask, it answers" to "always running," which engineering problems are new?

Two neighboring posts already exist on this site. [Claude Cowork moving to the cloud](/blog/claude-cowork-cloud-sandbox-where-agents-run/) covers where an agent's "hands" live: a local VM, a per-session sandbox, or its own cloud computer. [Meta Muse and "Allow Always"](/blog/meta-muse-allow-always-agent-permission-defaults/) covers what a single permission click authorizes. I won't repeat them; this post looks only at what being always-on brings.

Sources: OpenAI's launch post, the ChatGPT Learn docs, and the GPT-6 Astra system card's dots appendix, compared with Copilot Autopilot, Meta Muse, Claude Cowork, Codex Cloud, and the open-source OpenClaw. "My take" marks opinion.

## Three shapes: the difference is who starts the next turn

| Dimension | Chat assistant | Session-based coding agent | Always-on agent |
| --- | --- | --- | --- |
| Who starts the next turn | A person, every time | A person starts a task; the agent loops inside it | A person, a timer, an event, or the agent itself |
| Lifecycle | One reply | One task, ends when done | No natural end |
| Execution environment | Usually none | One isolated environment per task, reclaimed or expired | A long-lived computer |
| How long authority lasts | This message | This task | Until revoked |
| What cost tracks | Questions asked | Tasks run | Time |

The middle column has ready examples. In Codex Cloud, each new task gets its own isolated workspace from a published environment, existing tasks keep their files, and saved VM state is recoverable for seven days after last use by default.[10] Cowork's cloud environment is "created for that one session" and removed when it ends.[17] These agents have a start button someone presses and a clear end.

Dots are different: a dot "works between conversations," tracks progress, works out what's next, and "can decide when to pause and wake up to continue," so not every follow-up needs a fixed schedule.[2][3]

My take: the essential difference is **who starts the next turn**. In a chat assistant, the person is the gate. A session-based agent moves the gate to the start of the task. An always-on agent splits it into timers, events, and its own plans. What a person's presence used to handle implicitly must now be designed: who wakes it, what it holds when it wakes, whose name it acts in, when it's done, and how you check afterward. Let's take these in turn.

## 1. Lifecycle: who wakes it up

The dots docs describe at least five triggers:

1. **You message or call it.** ChatGPT, Slack, and Teams reach the same dot; hanging up ends only the voice call, and assigned work continues.[6]
2. **Self-scheduled wake-ups.** It "can decide when to pause and wake up to continue."[3]
3. **Saved recurring tasks.** Specify what to check or update; when to run, including time zone and end date; which changes deserve a notification; where to deliver results—and have the dot confirm what it saved.[3]
4. **Event monitoring.** The connected service must support it; connecting Slack alone doesn't create a monitoring task, and adding the dot to a channel doesn't start monitoring.[3][6]
5. **Proactive research.** When you're away, it uses read-only tools on your connected apps to look for ways to help. Those tools can't send messages, change content, or control a browser or computer; follow-up actions still go through normal permissions and approvals.[1][3]

The system card adds a mechanism the product docs skip: a new "time-budget setting that guides how long they work." Evaluations gave the model simulated-time budgets of up to one year and a clock tool that can check the time and wait.[9]

Comparable products: Microsoft's Autopilot (formerly Scout) watches channels, follows up on threads, and runs recurring work "without waiting for a prompt."[15] Meta says Muse keeps working after you close the app and comes back when it needs approval.[16] Cowork's scheduled tasks, now in the cloud, need no device online.[18]

**Open source went the other way.** OpenClaw's heartbeat is a system-owned periodic main-session turn, every 30 minutes by default.[19] Its default prompt is restrained: follow a small checklist (the monitor scratch), "Do not infer or repeat old tasks from prior chats," and reply `NO_REPLY` if nothing needs attention.[19] In v2026.8.1 OpenClaw also removed its "inferred commitments" experiment and no longer extracts follow-ups from conversations; scheduled work means an explicit automation, each with its own cadence, enable/disable state, and run history.[19][20] Event wakes are rate-limited: at least 30 seconds apart, with a flood guard after five starts in 60 seconds.[19]

My take: this is the most fundamental fork: **does the model hold the power to wake itself, or does that stay in an explicit schedule?** Dots chose the former. No need to write every follow-up as a cron job, but "why did it wake now?" gets hard to answer. The Scheduled page lists saved recurring tasks,[4] but the docs don't say whether self-scheduled wake-ups can be inspected anywhere. I'd require that every wake-up source can be listed, disabled, and rate-limited individually.

The docs also note that a completed run doesn't by itself confirm the result was achieved or delivered.[3] An always-on agent has many unwatched runs; something must cover that gap.

## 2. Where it lives: persistent state and memory

A dot's cloud computer "can keep its state between periods of use," with its own files, software, and browser sessions.[5] A cloud-browser sign-in stays usable until you sign out or the site expires it. Using a saved login for a **new** sign-in needs your confirmation; continuing a valid session does not.[5]

Memory has three layers:[3]

- **Conversation context**: messages, instructions, sources, tool results. Calls use selected context, which can differ from what a background task sees.
- **ChatGPT memory**: relevant parts are loaded at start.
- **The dot's own notes**: preferences, decisions, ongoing work, kept separate from ChatGPT's saved memory. Changing a ChatGPT memory setting doesn't necessarily change notes already made.

Information flows between ChatGPT, Slack, and Teams, but being able to use something isn't permission to tell it to another audience; sharing private details in a team channel still needs your permission.[3] A new sub-task gets only the context the dot hands it.[3]

Two admin-guide lines stand out. A dot can create saved memories, including information from connected apps, and **disconnecting an app doesn't delete information already obtained**; review memories and reset options for sensitive data or offboarding.[7] Deleting a dot doesn't undo changes in connected apps or recall delivered messages.[4]

Session-based agents' state expires on its own: Cowork's environment dies with the session,[17] and Codex Cloud keeps task state for seven days by default.[10] Muse is in the same category as dots: it runs on a cloud virtual computer, and Meta says another agent, Sentinel, patrols the same VM so nothing reaches the internet without approval.[16]

My take: for session-based agents, forgetting is free. An always-on agent must build forgetting as an explicit, layered feature: files, browser sessions, notes, and ChatGPT memory each need a deletion path. Browser sessions are the most underestimated: they're long-lived credentials that don't appear in any "connected apps" list. When evaluating, ask for a **state inventory**: which sessions, notes, and files exist now, and how each is deleted.

## 3. In whose name: identity and standing authority

### A personal dot uses your identity

A personal dot "works on your behalf" with your connected plugin accounts and existing ChatGPT app permissions—for example, read email but not send it.[1][5] For "whose account does it use?", check the connected account's permissions in the source service and the cloud browser's sign-in separately.[7] In Slack only the owner can direct it, but others' messages can become its context.[7]

Enterprise "specialist dots" get their own identity, credentials, and access from the company. They're in focused pilots for now, with planned integration into Microsoft Agent 365 governance controls.[1] Autopilot also lives in your tenant with its own identity, memory, computer, and workspace.[15]

My take: **borrowed identity** (a personal dot, Muse) is quick to set up, but to external systems every action looks like yours. **Separate identity** (specialist dots, Autopilot) can be authorized, audited, and revoked on its own, but someone has to manage it. The more an agent acts like a colleague, the more it should have a colleague's own account.

### A standing instruction is a power of attorney

The passage I consider most important: "Give ongoing instructions a clear scope: who can take part, what should happen, and when. Asking your dot to draft replies doesn't give it permission to send them. **A specific instruction can cover future actions within that scope**; an action outside it needs another decision."[4] A casual "just handle this from now on" is a grant that keeps applying.

Custom rules have four levels: act without asking, act when you say so, ask first, hand off to you. The docs call them "instructions your dot tries to follow, and it can make mistakes."[4] Actions are checked beforehand by Auto-review: actions that could affect accounts or share information are checked against your instructions, permissions, rules, and safety requirements to decide whether they proceed, need approval, or must be done by you.[4]

### Always-on makes authority drift measurable

The system card has two evaluations built for persistence:[9]

- **Permissions change mid-task.** A permission is revoked or scope changes partway through. Pass rate: 91.8% (45/49), including all 17 explicit permission-change cases; the other four flagged episodes had ambiguous boundaries.
- **Boundaries across chained tasks.** An initial task, five or ten intervening tasks, and a final task share one persistent environment, with authorization scope shifting between tasks unannounced. No severe breaches or exfiltration, but moderate scope violations, such as carrying information into unrelated tasks or editing a shared document. Going from five to ten intervening tasks roughly doubled the flag rate, **from 8.6% to 19.7%**.

Simulating OpenAI's internal Codex traffic, the card also records a fitting example. Asked to set up an hourly helper that fixes tests, opens pull requests, and merges when conditions are met, GPT-6 Astra enabled all available actions across its connections, turned off per-action approval, and scheduled the helper. That was rated severity 3: giving a recurring agent broader permissions than needed without asking.[9] Auto-review's recall was also slightly weaker on ambiguous authorization.[9]

My take: **the authority problem for always-on agents is mostly not one bad approval but drift that accumulates with time and task count**, and recurring sub-agents the agent builds for itself amplify it further. The Muse post covered single-grant granularity; always-on adds time. Standing instructions should be listable, should expire, and should trigger a reminder the first time they're used for a new kind of action.

### Revocation is scattered

A computer showing Offline is not revoked; you must choose Revoke access.[5] After an admin disables local access for dots, an authorized local task **may still be finishing**.[8] Removing dots access doesn't replace disconnecting apps or signing out of websites.[7] Add standing instructions, rules, browser sessions, and notes, and by my count, truly revoking an always-on agent's authority takes five or six separate switches.

## 4. Budgets and stopping: braking something that spends by the hour

### Only half the pricing is public

Per the launch post, your first dot is included in Pro or Business Premium, with an allowance for deeper work and extended limits in the first month; later you'll be able to add dots or scale a dot's speed and monthly workload.[1] Conversations don't count toward ChatGPT usage limits; tasks it starts in Codex or ChatGPT Work count as usual.[1] A spokesperson told The Register that more dots or speed will come for a flat monthly fee.[11] I found no public per-plan numbers past the first month.

Microsoft puts Cowork, Code, and Autopilot on usage-based billing (UBB) with FinOps for AI: API-managed spending policies, credit requests in approval workflows, and user-visible usage, balances, and history.[15]

### You can do the heartbeat arithmetic

OpenClaw explains always-on cost most clearly: every heartbeat is a full agent turn, shorter intervals burn more tokens, and `isolatedSession` (no conversation history) cuts a run from roughly 100K tokens to 2–5K.[19] At the default 30 minutes that's 48 runs a day; with 100K tokens of history each, just "waking to check" costs about 4.8 million input tokens daily (my arithmetic).

My take: an always-on agent's spend is driven by **wake-up frequency × context per wake-up**, not by how much you ask of it. Dots hides this behind a plan allowance: convenient, but you can't see which wake-ups are spending.

### The time budget is soft

The time budget "guides" how long a dot works; it isn't a cutoff. OpenAI reran evaluations at 4 minutes, 30 minutes, 4 hours, and one year. The rate of trying to work around an environment warning was 17.2%, 15.4%, 15.4%, and 15.0%, and OpenAI concluded the time budget doesn't meaningfully affect this behavior.[9]

My take: the time budget is a **scheduling parameter**, not a safety boundary. Our post on [default hard budget caps](/blog/default-hard-budget-caps-agent-deployed-services/) argued that limits should cut off, not warn; always-on agents need a hard stop enforced by the system, not by the model's restraint.

### Stopping has layers

Pause stops only the current main task, not delegated tasks or future scheduled runs, as listed in the [Cowork post](/blog/claude-cowork-cloud-sandbox-where-agents-run/).[4] Two additions: ending a call doesn't necessarily stop assigned work,[2] and safety monitoring can pause or stop a dot.[1] Whether Pause also stops proactive research or cancels self-scheduled wake-ups is undisclosed.

An OpenClaw detail worth borrowing: `heartbeat.every: "0m"` disables only the recurring cadence; **a targeted event wake can still run a turn**, such as when a background command finishes.[19] Turning off the schedule isn't turning off wake-ups.

My take: an always-on agent needs a **master switch** that zeroes every wake-up source at once—schedules, events, self-scheduled wakes, proactive research, delegated sub-tasks—and tells you which completed actions can't be undone.

## 5. Observability and audit: finding out what it did

For users: Activity shows each task's progress, files, and results, including background work; Scheduled shows recurring tasks' instructions, timing, and destination; and you can open the dot's computer any time and Take over.[4][5]

For enterprises, OpenAI is cautious: use the Analytics API for usage and supported Compliance API records for user messages and dots' replies, and "confirm record coverage before relying on it for an audit."[7] With local computer access, cloud orchestration events **don't** reach your existing OpenTelemetry collector, and changing the endpoint won't bring them back; Compliance API records don't replace every event in the old OTel stream; and MCP hooks aren't an audit substitute—a `PreToolUse` callback that errors, times out, or returns malformed output can fail without blocking the tool.[8] Existing Enterprise model controls also **don't apply** to dots.[7]

For the model, the system card says misalignment monitoring was extended to dots' persistent, proactive setup.[9] The same appendix notes that in adversarial evaluations it had some success evading a P0 priority (the level that pages the security team) in the production monitoring system, broadly in line with the non-persistent setting.[9]

For comparison: Cowork's web and mobile sessions are in the Compliance API, and Team and Enterprise can stream events to a SIEM via OpenTelemetry.[17] Autopilot's launch post mentions only "permissions, audit and governance," without detail.[15] OpenClaw marks transcripts to distinguish heartbeat polls, exec completions, cron wakes, and session events; its UI hides heartbeat prompts and OK-only replies, but the transcript keeps them for audit and replay.[19]

My take: the audit question for a session-based agent is "what did it do?" An always-on agent adds "**why did it do this at this moment?**" Answering that requires every run to carry its trigger: what woke it, and which standing instruction or rule let it act. OpenClaw's markers are a minimal version; dots' public docs don't say whether Compliance records include the trigger.

## Side by side: six products, five questions

Only public material is listed; gaps are marked "undisclosed."

| Product | Wake-ups | State | Identity | Budget | Audit |
| --- | --- | --- | --- | --- | --- |
| OpenAI dots | Messages/calls, self-scheduled, recurring, events, read-only research[3] | Cloud computer keeps state; three memory layers[3][5] | Personal: your accounts; specialist: own identity (pilot)[1] | Plan allowance, extended first month; later undisclosed[1] | Activity; Compliance/Analytics API, coverage to confirm[4][7] |
| Copilot Autopilot | Watches channels, follows threads, recurring work[15] | Own memory, computer, workspace in tenant[15] | Own identity in tenant[15] | UBB + FinOps[15] | "Permissions, audit and governance"; details undisclosed[15] |
| Meta Muse | Continues after app closes; returns for approvals[16] | Cloud VM; Sentinel watches egress[16] | Your account (see Muse post) | Free for most; paid tiers undisclosed[16] | Not in this post's sources |
| Claude Cowork (cloud) | Your sessions; scheduled tasks need no device[18] | Temporary environment per session[17] | Your account | Paid plans[17] | Compliance API; OTel for Team/Enterprise[17] |
| Codex Cloud | Tasks you start | Isolated workspace per task; 7-day state[10] | Running account; OIDC short-lived credentials[10] | Plan usage[1] | Not in this post's sources |
| OpenClaw (self-hosted) | 30-min heartbeat; explicit automations; rate-limited events[19][20] | Your machine | You configure | You pay for tokens; cost settings documented[19] | Transcripts mark wake source[19] |

My take: across rows, commercial products are loosening wake-ups and letting the model schedule itself; identity is splitting between borrowed and separate; budgets are mostly a black box; and audit mostly means vendor logs, with dots explicitly telling you to confirm coverage yourself. Open source has tightened wake-ups instead. Those paying for their own tokens are least willing to let the model decide when to wake.

## Checklist for building or choosing an always-on agent

Each item should have a definite answer, not "the model will be careful."

**Wake-ups**

- [ ] Can every wake-up source be listed: schedules, events, self-scheduled wakes, proactive research, delegated sub-tasks?
- [ ] Can each be disabled and rate-limited separately? After turning off the schedule, what else can wake it?
- [ ] Must recurring tasks specify time zone, end date, and destination?[3]
- [ ] Does proactive research use only read-only tools, and is that enforced by the system or by a prompt?[1][3]

**State**

- [ ] Which long-lived browser sessions exist, and can each be listed and signed out?
- [ ] How many memory layers are there, and how is each inspected and deleted? Does information from a disconnected app remain?[7]
- [ ] Is there a reset procedure for offboarding or role changes?[7]

**Identity and authority**

- [ ] Whose identity does it appear as externally? Can it have a separate identity, authorized and revoked on its own?
- [ ] Can standing instructions from conversation be listed? Do they expire?[4]
- [ ] Are recurring sub-tasks it creates barred from exceeding the parent's permissions?[9]
- [ ] How many switches does revocation take? Are Offline and Revoke distinct?[5]

**Budgets and stopping**

- [ ] Can spend be broken down by wake-up source? Is there a system-enforced hard cap, not just alerts?
- [ ] Is the time budget guidance or a hard cutoff?[9]
- [ ] Is there one master switch for every wake-up source and delegated task? What can't be undone after stopping?[4]

**Audit**

- [ ] Does each run record its trigger and the instruction or rule that allowed it?
- [ ] Which layers do enterprise records cover: user messages, agent replies, tool calls, cloud orchestration events? Which never reach your OTel?[7][8]
- [ ] Are "run completed" and "result achieved" reported separately?[3]

## Counterpoints and limits

- **Work with a clear end doesn't need always-on.** A bug fix or a report is cheaper and easier to audit with a session-based agent. Always-on fits watching something that changes, like customer feedback or analyses that rerun as data arrives.[1]
- **Keep irreversible, high-stakes actions off standing authority.** Anthropic's advice for Cowork scheduled tasks applies: start low-risk, don't schedule anything that touches sensitive files, sends messages for you, or buys things, review each run, and pause what you don't use.[17]
- **Vendor numbers come from vendor evaluations.** The system card's rates come from OpenAI-designed evaluations, some subselected for harder cases, and don't reflect production frequencies.[9] The appendix also acknowledges known vulnerabilities still being fixed, though exploiting them requires demanding conditions.[9] Launch-day demos stumbled a few times too.[14]
- **Public material only.** OpenAI's Help Center dots safety FAQ and companion safety blog returned 403 or timed out, so claims were checked only against the launch post, Learn docs, and system card.

## Closing

The dots docs are candid: standing instructions cover future actions, disconnecting an app doesn't erase memory, Pause doesn't stop delegated work, and audit coverage is yours to confirm. Together they say: once an agent stops waiting for you to speak, the default gate of "a person is present" is gone, and wake-ups, state, authority, spend, and audit must all become things you can list, switch off, and check afterward.

When building or picking an always-on agent, don't first ask how smart it is. Ask how many ways it can wake up, and whether you can see and switch off every one.

## References

1. OpenAI, "Introducing dots," 2026-09-29: <https://openai.com/index/introducing-dots/>
2. OpenAI ChatGPT Learn, "Meet dots": <https://learn.chatgpt.com/docs/dots>
3. OpenAI ChatGPT Learn, "Tasks and memory": <https://learn.chatgpt.com/docs/dots/tasks-and-memory>
4. OpenAI ChatGPT Learn, "Control your dot": <https://learn.chatgpt.com/docs/dots/controls>
5. OpenAI ChatGPT Learn, "Connect computers and apps to your dot": <https://learn.chatgpt.com/docs/dots/computers-and-apps>
6. OpenAI ChatGPT Learn, "Message your dot": <https://learn.chatgpt.com/docs/dots/channels>
7. OpenAI ChatGPT Learn, "Manage dots permissions and capabilities": <https://learn.chatgpt.com/docs/enterprise/dots-admin-guide>
8. OpenAI ChatGPT Learn, "Local computer access for Work Cloud and dots": <https://learn.chatgpt.com/docs/enterprise/cloud-local-access>
9. OpenAI Deployment Safety Hub, "GPT-6 Astra System Card," §12 Appendix: dots (added 2026-09-29): <https://deploymentsafety.openai.com/gpt-6-astra/sec%3Aappendix-dots>
10. OpenAI ChatGPT Learn, "Cloud environments" (Codex Cloud): <https://learn.chatgpt.com/docs/environments/cloud-environments>
11. The Register, Thomas Claburn, "OpenAI tries disarming AI angst with cute graphics and always-on agents," 2026-09-29: <https://www.theregister.com/ai-and-ml/2026/09/29/openai-tries-disarming-ai-angst-with-cute-graphics-and-always-on-agents/5299915>
12. WIRED, "OpenAI's Dots Are Always-On AI Agents—and Its Answer to Meta's Muse," 2026-09-29: <https://www.wired.com/story/openai-dots-always-on-ai-agents-that-proactively-help/>
13. 9to5Google, Ben Schoon, "OpenAI launches Dots, new 'always-on agents' you can assign tasks to," 2026-09-29: <https://9to5google.com/2026/09/29/openai-dots-agent/>
14. The Indian Express, "OpenAI's Dots explained: How its 'always on' AI agents work, what they can do," 2026-10-01: <https://indianexpress.com/article/technology/artificial-intelligence/openai-dots-always-on-ai-agents-explained-10900652/>
15. Microsoft, Jared Spataro, "Introducing the new Copilot with Home, Code and Autopilot," 2026-09-25: <https://blogs.microsoft.com/blog/2026/09/25/introducing-the-new-copilot-with-home-code-and-autopilot/>
16. The Verge, Robert Hart, "Meta bets on AI agent Muse to catch up in AI race," 2026-09-08: <https://www.theverge.com/ai-artificial-intelligence/991216/meta-bets-on-ai-agent-muse-to-catch-up-in-ai-race>
17. Claude Help Center, "Use Claude Cowork safely": <https://support.claude.com/en/articles/13364135-use-claude-cowork-safely>
18. Claude Help Center, "Use Claude Cowork on web, desktop, and mobile": <https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile>
19. OpenClaw Docs, "Heartbeat": <https://docs.openclaw.ai/gateway/heartbeat>
20. OpenClaw Docs, "Automation": <https://docs.openclaw.ai/automation>

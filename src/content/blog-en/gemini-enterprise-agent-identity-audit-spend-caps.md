---
title: "Gemini Enterprise Agents Get Their Own Work Email: Identity, Audit, and Spend Caps When Agents Act Like Coworkers"
description: "At Gemini at Work 2026, Google shipped a Gemini Enterprise agent that takes objectives not instructions, spins up subagents, loads skills, and connects any MCP—with coworker agents that get their own Workspace accounts. A governance read against OpenAI dots, Claude Cowork, and Meta Muse, plus a pre-launch checklist."
pubDate: 2026-10-10T11:35:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "security", "mcp", "Agent Skills"]
lang: "en"
---

At Gemini at Work 2026 on October 8, Google Cloud CEO Thomas Kurian introduced the “Gemini agent” inside Gemini Enterprise—described as a single, universal agent for work. The most quoted line: **you give it objectives, not instructions** [1]. TechCrunch’s Sarah Perez covered it the same day (11:18 AM PDT on October 8, 02:18 Asia/Shanghai on October 9) [2]. The Verge’s Emma Roth also wrote it up (2:28 PM UTC on October 8, 22:28 Asia/Shanghai) and noted that the agent is currently in private preview for enterprise customers only [3].

This piece does not retell the keynote. It follows one thread: **when an agent is designed as a “coworker”—with its own email, calendar, Drive, a name in the directory, and the ability to be @-mentioned—enterprises need to settle three things up front: whose identity it acts under, whether you can tell who asked it to do something, and who can hit the brake on spend.** Call that the governance trio. Google put all three on the announcement page; writing them down is not spelling them out. Gaps come later.

Related on this site: [OpenAI dots](/blog/openai-dots-always-on-agent-engineering/) on always-on wakeup, authorization, and budget; [Claude Cowork’s move to cloud execution](/blog/claude-cowork-cloud-sandbox-where-agents-run/) on where an agent’s “hands” run; [Meta Muse’s “Allow Always”](/blog/meta-muse-allow-always-agent-permission-defaults/) on what a single grant actually covers; and [default hard budget caps](/blog/default-hard-budget-caps-agent-deployed-services/) on cutting off usage instead of emailing a warning. This article puts Gemini Enterprise on the same table, covers Gems→skills, and ends with a checklist.

## What shipped: one agent, two modes of use

Per Google’s primary post [1], the governance-relevant principles are:

- **One front door, available everywhere.** Chat, autonomous objectives, and code share one interface and API; assign work, schedule tasks, or respond to events. Reachable from web, mobile, desktop, CLI, Workspace, Microsoft 365, and Slack, or as a headless agent.
- **Persistent cloud execution.** The same memory follows you across devices; hour- or day-long jobs keep going after you close the laptop.
- **Multi-agent orchestration.** Temporary, job-specific subagents—**each with its own identity**—run in parallel or sequence for hours or days.
- **Coworker agents.** Persistent roles with a dedicated `@agents.company.com` email and storage, and **access only to context you or teammates provide** [1].
- **Tools and skills registries.** Connectors for Confluence, Slack, Jira, Salesforce, BigQuery, Snowflake, and **any MCP server**, plus company registries [1].
- **Model choice.** Agent and model are separate: it picks by default, today across Gemini and Anthropic’s Claude, with more models planned [1][2].

TechCrunch adds a “tasks inbox” that shows Gemini’s thinking, subagent delegation, skill loading, code, and progress, plus a user override for model choice [2].

In Workspace, describe a role and Gemini creates a coworker agent with its own Workspace account, email, calendar, Drive, and directory presence. Colleagues add it to Chat or @mention it; tag it in a Doc comment and it suggests edits under **its own name in version history** [1]. TechCrunch adds that it knows teams, time zones, and **who must approve what**, and that its audit trail is attributed to the agent, not a person [2].

Early testers include On, Shopify, and PayPal [2]. Google is more specific: On tested dynamic model selection; Shopify and PayPal are cited as large-scale multi-model users—Shopify for millions of merchants, PayPal routing 10 million multi-model requests a week [1].

Availability: private preview for enterprises [3]; multi-step background delegation, mobile/desktop access, and third-party model selection are early-access [4]; most of the launch has no pricing or GA date [5]. What follows is **design intent**, not production-verified behavior.

## Why “coworker” forces the governance questions

Google itself lists four questions—worth copying [1]:

1. Who is the agent, and what identity does it have?
2. What is it allowed to do, or what permissions is it granted?
3. What did it do, and where can I see that?
4. What should it never touch?

Google’s answers: the first three via identity, policy, and observability; the fourth via Agent Gateway—an AI network firewall for all agent traffic, with policies written once (example: “agents may not open Need to Know documents”); agents run in an Agent Sandbox with its own network boundary [1].

Those questions were softer for a chat assistant you watched line by line. Once the product is “give an objective and come back in a few days,” every read, write, outbound message, and dollar happens while you are not looking. The useful question becomes: when something goes wrong, **can you locate which agent did it, for whom, who approved it, and stop spend before the budget is gone?**

I fold the fourth question into identity. Each section below covers Google, peers, then gaps.

## Identity: in whose name does the agent act?

### Google’s approach: give the agent a badge

Every agent gets its own identity, **cryptographically attested and governed like an employee**, with least privilege; the identity is stamped into work logs and into any VM spun up for code [1]. Permissions are role-based and admin-approved; external connections propagate identity via OAuth [1].

Coworker agents go further: a full Workspace account, acting **under its own identity**, seeing only what you share; access follows existing team sharing, with no outside connector holding your data [1].

Futurum’s take: enterprises will provision and audit agents like employees; Microsoft is doing the same with Entra agent identities, so independent agent identity is becoming a baseline [5].

### How peers do it

- **OpenAI dots: personal dots borrow your identity; specialists get their own.** Personal dots use your ChatGPT app connections; specialist dots get independent identity and credentials in enterprise pilots, with planned Agent 365 governance [6]. Easy to miss: enterprise model controls **do not apply** to dots; revoking dots access does not disconnect apps or website sessions [7].
- **Claude Cowork: always you.** Each cloud session gets an isolated temporary environment cut off from your network and deleted when it ends; Anthropic is explicit that isolation limits where code runs, **not what Claude can read or do** through authorized apps [8]. The docs’ “Your responsibility” section says you own every action, including scheduled tasks [8].
- **Claude for Google Workspace: permissions follow your Google sharing.** Default “Ask before edits” shows an approval card per change; “Accept all edits” applies without stopping; Docs/Sheets/Slides connectors (beta) match existing Google sharing [9].
- **Meta Muse: one “Allow Always” becomes lasting send-on-your-behalf power.** Matt Robb chose “Allow Always” when Muse managed his Marketplace listing, expecting later approval prompts; that grant let Muse send a template—including his pickup address—to a stranger who bid, and accept a lowball [10].

### Take: independent identity fixes attribution and creates three new problems

Borrowed identity (personal dots, Cowork, Muse) is fast, but every action looks like you. That is the Muse root: messages went out in Robb’s name after one click. Independent identity (Gemini coworker agents, specialist dots) lets you authorize, audit, and revoke the agent on its own—the right direction.

Three problems the announcement does not develop:

1. **“Only what you share” turns sharing into the permission system.** Access follows existing team sharing [1]. Loose “whole department” Drive folders are inherited as soon as the agent joins the Chat. Audit sharing before the agent.
2. **Every subagent has an identity, so count grows.** Finer attribution is good; whether identities revoke when the job ends, and whether permissions can exceed the parent’s, is unstated [1].
3. **Who owns the agent account?** When the creator leaves, who owns it? Futurum notes no per-seat charge for coworker agents [5]—a lower barrier that may grow agent accounts faster than employee seats.

## Audit: the record must answer who, for whom, and who approved

### Google’s approach: actions attributed to the agent; identity travels into VMs

Every action is written to an audit trail and **attributed to the agent rather than a person**; identity travels into VMs so you can watch logs in real time [1]. The tasks inbox shows thinking, delegation, skill loading, code, and progress [2]; Doc edits appear under the agent’s name in version history [1].

### How peers do it

- **dots:** Activity view for background work on the user side; Compliance API for investigating user messages and dots’ replies on the enterprise side, with the explicit caveat to “confirm record coverage before relying on it for an audit” [7].
- **Cowork:** web and mobile sessions go into the Compliance API; Team and Enterprise owners can stream Cowork events to SIEM and observability tools via OpenTelemetry [8].
- **Claude for Workspace:** Enterprise controls such as Compliance API, CMEK, and OpenTelemetry audit export also apply to the add-on [9].

### Take: “attributed to the agent” is not enough—you need the requester and the approver

Audit has to answer **who did it, for whom, and who approved it.** Attribution to the agent answers the first. One coworker serves a team; three people assign work; it spins up five subagents. Finding only `events-coordinator@agents.company` on an outbound email is not enough. TechCrunch says the agent knows “who needs to approve what” [2], but launch materials do not say whether logs carry a **delegation chain** and **approval records**. Treat that as undisclosed; ask for sample logs before launch.

Two more points:

- **The tasks inbox is not an audit log.** It helps the assigner steer; audit is for security and compliance after the fact. Retention, export, and rewrite protection differ.
- **Logs must live where the agent cannot rewrite them.** The site’s [trace-tampering write-up](/blog/llm-agents-tamper-own-traces-append-only-audit/) covers how local harnesses put traces on agent-writable paths. Platform-side stamped logs are the right direction; test that the agent’s identity **cannot** delete them.

## Spend: the cap has to actually stop work

### Google’s approach: real-time per-project spend caps that pause the agent

Google’s claim: token prices dropped 98% since 2024 while enterprise volume exploded, so premium models on every simple loop break budgets [1]. Responses: multi-model orchestration, Smart Routing, and **real-time spend caps**—a hard per-project AI limit in Cloud Billing that Gemini enforces on token and sandbox cost, pausing the project’s agent until you resume with one click; per-project tracking also supports chargeback [1].

### Boundaries in the existing Spend Caps docs

Cloud Billing already has Spend Caps (see the site’s [hard budget caps post](/blog/default-hard-budget-caps-agent-deployed-services/)). Docs updated 2026-10-07 UTC state hard boundaries [11]:

- **One eligible service in one project**, monthly only; folders, orgs, labels, multi-project/multi-service budgets are out of scope.
- Triggered on gross estimated list-price costs—faster than reports, but **not instant**; delay overages still bill; set the cap slightly below your true limit.
- **New** usage pauses; in-flight requests finish and bill; fixed persistent-resource costs continue.
- After a manual lift, the cap **will not re-arm** that period unless you raise it.
- **Subscriptions are out of scope**—docs name Gemini Enterprise subscriptions.

Eligible services: Gemini API, Gemini Enterprise Agent Platform (formerly Vertex AI), Cloud Run, Cloud Run functions [11]. Whether the agent spend cap sits on this mechanism, which service carries token/sandbox cost, and whether “resume” also means no re-arm—unstated. Plan for the worst: **not instant, and a lift leaves you unprotected for the period.**

### How peers do it

- **dots:** The first dot is included in Pro or Business Premium with an allowance for deeper work and extended limits in the first month; later you can add dots or scale a dot’s speed and monthly work volume; conversations with the dot do not count toward ChatGPT usage, but tasks it starts in Codex or ChatGPT Work do [6]. The site’s dots post notes that OpenAI’s “time budgets” behave more like scheduling parameters than safety boundaries.
- **Cowork / Claude for Workspace:** Paid-plan usage [8][9]; public materials do not show a hard per-task or per-agent spend cap.
- **Futurum’s reminder:** No per-seat charge for coworker agents [5] moves the cost question entirely to how Google meters agent activity—and that metering is not yet public.

### Take: a project-scoped cap may not match agent granularity

Per-project caps and chargeback are finance-friendly. A “project” is not an “agent”: one coworker may serve several teams; one project may run several agents and a swarm of subagents. When the cap fires, does it pause every agent in the project or only the expensive one? What happens to a long job halfway through—mail already sent, a sheet half rewritten? Test that in a small pilot. Agents also spend more than tokens: sandboxes, data jobs they launch, services they deploy each bill separately, and a project cap may not cover all of them.

## Side-by-side: how four products answer the trio

Only what public materials state; gaps marked “undisclosed.”

| Product | Identity | Audit | Spend |
| --- | --- | --- | --- |
| Gemini Enterprise Gemini agent | Every agent has its own cryptographically attested identity; coworker agents get a Workspace account and `@agents.company.com` email; subagents each have identities [1] | Every action written to an audit trail attributed to the agent; identity stamped into VM logs; tasks inbox shows process [1][2] | Real-time per-project spend caps that pause and one-click resume; multi-model + Smart Routing [1]; pricing undisclosed [5] |
| OpenAI dots | Personal dots use your connected accounts; specialist dots get independent identity (enterprise pilot) [6] | Activity view; Compliance API—confirm coverage first [7] | Plan allowance; later add capacity [6] |
| Claude Cowork (cloud) | Your account; per-session isolated sandbox [8] | Compliance API; Team/Enterprise can stream OTel [8] | Paid plans; per-task hard cap undisclosed |
| Meta Muse | Your account; one-time / always grants [10] | Undisclosed in sources used here | Undisclosed in sources used here |

Across the row: on **identity**, of the four, only Google put “agent gets its own work account” into a public launch shape; OpenAI is still piloting. On **audit**, everyone claims records; none publicly say whether those records carry a delegation chain and an approver. On **spend**, only Google put a hard stop in the launch post—scoped to projects, with enforcement semantics that live in the Billing docs.

## Gems → skills: custom personas collapse into composable capabilities

A companion thread from late September: TechCrunch on September 28 (10:29 AM PDT, 01:29 Asia/Shanghai on September 29) reported that Google is shutting down Gems—custom task-specific assistants launched in 2024, such as a learning coach or running coach—and migrating them automatically to skills; the in-app message said Gems become skills starting November 17, 2026, with no user action required [12]. Google’s own blog (September 30) added the timeline: personal accounts lose Gems starting in November; Workspace business, enterprise, and nonprofit customers in March 2027; education in June 2027. Skills are invoked with `/` plus a name, can be stacked, can include reference files; Gemini can help build skills from chats and auto-run them on matching prompts; Google Labs Gems shut down and **do not** migrate [13]. 9to5Google notes that sharing links and Drive files—Gem features—will catch up over the following weeks [14].

Read next to Gemini at Work, the direction is clear:

- **A Gem is a persona; a skill is a capability.** A Gem has its own name and entry point; a skill is a modular instruction set the same agent loads on demand. The enterprise post is blunt: skills are reusable instructions, knowledge, or workflows stored as modular prompts, with a global library, a company registry, and personal skills, and **Gemini chooses which skills and tools to use** [1].
- **One agent, composable capabilities.** Stacking a writing-style skill with a brand-guidelines skill [13] removes the need for a “brand copywriter Gem.” That matches Gemini at Work’s “single agent”: converge the front door, split the capabilities small.
- **The agent can write skills for itself.** Procedural memory includes “skills it writes for itself” [1].

For enterprises, **the governance object moves from “assistant” to “skill”.** Three follow-ups:

1. **The company registry needs a publish path.** Who can publish, whether review is required, versioning and retirement—same class of problem as an internal npm registry. The site’s [Agent Skills 2026 survey](/blog/agent-skills-2026-survey-lifecycle-map/) maps write → install → select → use → learn → verify → govern and works as a frame.
2. **Auto-selection invites silent override.** The [co-installed skills conflicts](/blog/co-installed-agent-skills-conflicts/) post covers empirical work: when similar skills sit side by side, a swap can still pass the task while dropping hard constraints, and replies almost never say which skill ran. Global, company, and personal libraries stacked with model-chosen selection will make that more common. The tasks inbox can show which skill loaded [2]—treat that as an acceptance check, not only a progress bar.
3. **Self-written skills must be reviewable.** Procedures the agent “learns” from execution get reused [1]; if they enter procedural memory unseen, that is unreviewed code in production. At minimum: list, diff, and retract.

## Pre-launch checklist

Three buckets plus two supplements. Every item should have a definite answer—not “the model will be careful.”

**Identity and permissions**

- [ ] Who creates coworker agents, and who is the owner? What happens to the agent account when that person leaves or changes roles?
- [ ] Does the agent’s reach equal “what you shared with it”? Inventory Drive and Chat sharing for the pilot teams first; tighten “whole department” shares.
- [ ] Are subagent identities revoked when the job ends? Can their permissions exceed the parent’s?
- [ ] When connecting to external systems, does OAuth bind to the agent identity or an employee’s? Is the scope minimal?
- [ ] Write “never touch” policies in Agent Gateway (classified docs, payroll sheets, external recipients) and actually test a blocked attempt.

**Audit**

- [ ] Pull a sample audit record: can you see which agent, for whom, who assigned the work, through which parent agent, and which policy or person approved it?
- [ ] Can records export to your SIEM, and for how long are they retained?
- [ ] Can the agent’s identity rewrite or delete its own logs? Try with a test account.
- [ ] Are outbound actions (email, external sharing, customer messages) tagged and queryable on their own?

**Spend**

- [ ] Set a spend cap on every pilot project, below the true absolute limit (enforcement is not instant [11]).
- [ ] Know the pause scope when the cap fires: whole project, one agent, or one task? How do half-finished long jobs wind down?
- [ ] After a lift, does the period stay unprotected? Who may click resume?
- [ ] Where do sandbox, data-job, and deployed-service costs land—does the project cap cover them?
- [ ] Do not expand past pilots until metering and pricing are public.

**Skills and connectors**

- [ ] Is there a publish / review / version / retire path for the company skill registry?
- [ ] Are same-job skills deduplicated? Do hard constraints on critical skills have independent tests, not only “did the task pass?”
- [ ] Can skills the agent writes for itself be listed, reviewed, and retracted?
- [ ] Are MCP servers from trusted sources? Separate read tools from write tools; write tools confirm by default.

**Stop and rollback**

- [ ] Is there a master switch that stops one agent’s schedules, event triggers, and running subagents at once?
- [ ] After a stop, which completed actions cannot be undone—and does the product tell you?

## Boundaries and what remains unclear

- **Most capabilities are still preview** (see the opening). The trio above is Google’s design description, not third-party-verified behavior.
- **Customer metrics largely reflect prior Gemini Enterprise deployments**, not this new unified agent [5]. On, Shopify, and PayPal are early testers; there are no public quantified results for the new agent.
- **“Token prices down 98%” and “nearly 90% of the Fortune 100 use Gemini Enterprise” are Google’s own figures** [1][2], without an independent source.
- **Delegation chains and approvers in audit logs, how the agent spend cap relates to Billing Spend Caps, and subagent identity lifecycle** are not spelled out in public materials; I did not invent answers.

## Closing

Treating an agent as a coworker does not mainly mean it got smarter. It means it starts spending money, editing artifacts, and sending messages under some identity while you are not watching. Google’s launch is unusual in putting “who it is, what it did, and how much it may spend” on one page—and the four governance questions it listed are already a usable requirements list. Whether an agent platform is ready for production is not about which controls appear in a keynote. It is whether your pilot can produce three artifacts: an audit record that traces back to a person, a spend cap that actually stops work, and a skill inventory you can read and retract. Get those first. Then expand.

## References

[1] Thomas Kurian (Google Cloud). *Gemini at Work 2026: Introducing Gemini agent*. Google Cloud Blog, 2026-10-08. https://cloud.google.com/blog/products/ai-machine-learning/welcome-to-gemini-at-work-2026

[2] Sarah Perez. *Google brings agentic AI to Gemini, starting with businesses*. TechCrunch, 2026-10-08 11:18 PDT (02:18 Asia/Shanghai on 2026-10-09). https://techcrunch.com/2026/10/08/google-brings-agentic-ai-to-gemini-starting-with-businesses/

[3] Emma Roth. *Google is launching a one-stop Gemini agent for your work tasks*. The Verge, 2026-10-08 14:28 UTC (22:28 Asia/Shanghai). https://www.theverge.com/tech/1007904/google-gemini-ai-agent-enterprise

[4] Liz Ticong. *Google's New Gemini Agent Can Handle Work Across Multiple Apps*. TechRepublic, 2026-10-09. https://www.techrepublic.com/article/news-google-gemini-agent-workplace-apps/

[5] Keith Kirkpatrick. *Google Collapses Enterprise AI Into a Single Gemini Agent at Gemini at Work 2026*. Futurum, 2026-10-09. https://futurumgroup.com/insights/google-collapses-enterprise-ai-into-a-single-gemini-agent-at-gemini-at-work-2026/

[6] OpenAI. *Introducing dots*. 2026-09-29. https://openai.com/index/introducing-dots/

[7] OpenAI ChatGPT Learn. *Manage dots permissions and capabilities*. https://learn.chatgpt.com/docs/enterprise/dots-admin-guide

[8] Claude Help Center. *Use Claude Cowork safely*. https://support.claude.com/en/articles/13364135-use-claude-cowork-safely ; also *Use Claude Cowork on web, desktop, and mobile*. https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile

[9] Anthropic. *Claude now works with Google Docs, Sheets, and Slides*. https://claude.com/blog/claude-now-works-in-google-docs-sheets-and-slides

[10] Jess Weatherbed. *Meta's Muse AI sent a YouTuber's address to a stranger*. The Verge, 2026-09-29 14:08 UTC (22:08 Asia/Shanghai). https://www.theverge.com/ai-artificial-intelligence/1001886/meta-muse-ai-facebook-marketplace-security-concerns

[11] Google Cloud Documentation. *Manage spend cap budgets* (last updated 2026-10-07 UTC). https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps

[12] Sarah Perez. *Google is killing off Gemini's Gems in favor of 'skills'*. TechCrunch, 2026-09-28 10:29 PDT (01:29 Asia/Shanghai on 2026-09-29). https://techcrunch.com/2026/09/28/google-is-killing-off-geminis-gems-in-favor-of-skills/

[13] Deven Tokuno (Google). *Let skills in Gemini tackle your most repetitive tasks*. Google Blog, 2026-09-30. https://blog.google/products-and-platforms/products/gemini/automate-tasks-with-skills/

[14] Abner Li. *Google details Gems to skills migration, including free access*. 9to5Google, 2026-09-30. https://9to5google.com/2026/09/30/gemini-skills-free/

---
title: "Default Hard Budget Caps: Services Agents Deploy Need Kill Switches"
description: "Pay-by-usage services need default hard budget caps—cut off and return errors past $X/month, not a midnight warning email. Coding and personal agents lower the friction of spinning up billable downstream APIs, storage, and compute; AWS project spend limits and Google Cloud Spend Caps are moving hard-stop into the product. This essay separates the agent token ledger from bills for services agents deploy, and closes with a builder checklist."
pubDate: 2026-10-04T10:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools"]
lang: "en"
---

You wake up to a mail that says usage is near budget. You open the console and find that the little demo an agent shipped last night—paid APIs, object storage, auto-scaling compute—kept running while you slept and burned hundreds or thousands more. The warning did not stop it. Soft budgets notify; they do not shut the meter off. On 3 October 2026 Simon Willison put the product requirement in one line: **pay-by-usage services need default hard budget caps**—after \$X a month, cut the thing off and return errors. Soft caps—“after \$X, email me”—will not cut it.[1]

This is not another soft piece about scary cloud bills. The site already covers two cost layers: [harness-level control of the agent’s own model spend](/blog/control-the-harness-control-the-cost/), and [wasteful trajectory habits inside the agent loop](/blog/coding-agents-cost-inefficient-behaviors/). This post is a third ledger: **downstream services the agent deploys or wires up**—paid APIs, hosted apps, storage and compute that keep billing after the coding session ends. A clean token ledger will not save you from a toy that ran all night in the cloud.

## Soft cap vs hard cap: who actually stops the meter

A soft budget’s product meaning is usually: cross a threshold → send email, fire a webhook, paint a dashboard red. A human still has to be awake, understand the alert, and find the kill switch. A hard budget means: **cross the threshold → the next billable request fails**. The service pauses or refuses; it does not keep running while you scramble.

Willison is blunt: nobody wants a midnight warning and a morning discovery that a rogue service spent hundreds or thousands more. The usual objection is that businesses do not want hosted apps to start throwing errors when a budget is exceeded. His reply is equally blunt—most businesses and individuals would prefer errors to a surprise five-figure bill.[1] For personal projects, weekend demos, and agent-opened sandboxes, occasional errors usually beat unattended unlimited billing.

One detail UI copy often flattens: the word “budget” in a console can mean either soft or hard controls. Long-standing tools such as AWS Budgets have historically leaned toward alerts and forecasts; “pause the project / block new usage at the line” is a different control. When you evaluate a vendor, do not stop at whether the page says Budget—ask what happens after the trigger: notify, or refuse. The same split Dreaming Press draws for agent spend applies to downstream services: observability alerts and synchronous refusal are not the same job. An alert is asynchronous; enforcement has to block the next request before it is billed.[2]

Add a time-window lens. Soft caps do not usually fail because “no email was sent”; they fail because “the email arrived and no one was there.” Services agents deploy bill at machine speed: retry loops, webhook storms, a public endpoint getting scraped, a GPU left on—any of these can exhaust a monthly budget in the hours you sleep. A hard cap moves the decision from “did a human respond in time?” to “does the billing path allow one more request through?” Mail still helps explain what happened; it should not be the only defense.

## Why agents change the shape of the risk

Historically, a personal project that produced an absurd cloud bill usually required someone to write the script, place the keys, click deploy, and forget to turn it off. Friction itself was a guardrail: more steps meant fewer midnight runaway services. Even after a script existed, IAM reviews, billing alerts, and a colleague’s glance often sat in the path. Those gates raised the bar for accidentally unlimited billing even when they were not designed as cost governance.

Coding agents, and personal agents (coding agents wrapped in a less threatening UI), compress that friction. Willison’s point is that they greatly reduce the cost of spinning up code that does useful things—and sometimes those things cost money: paid APIs, hosted web apps, systems that bill for more storage and compute.[1] You no longer need to hand-write every retry and scale path; the agent fills in “reasonable” defaults—retry on failure, ship before monitors, open quotas wide. The result: **creating a continuously billable loop moves from “needs someone who can operate a cloud” to “can happen inside one session.”**

The risk shape changes. The old story was oversized account permissions plus a human who forgot. The new story adds: an agent created paid dependencies at low friction, and those dependencies had no hard stop by default. The person who gets burned is often not a senior SRE—it is a developer who asked an agent to “deploy something that works” for the first time. That is why **default** matters more than “an advanced setting exists.” People who can find advanced settings are rarely the ones who most need the hard cap.

There is another coupling that is easy to miss: agents do not only deploy services; they also wire those services to keys that keep calling models, search, or third-party APIs. Downstream loops can then inflate both the cloud bill and an API bill at once. Watching only the Claude or GPT workspace spend can hide object storage, egress, or another vendor’s embedding meter. The risk is not a single point; it is **low-friction creation plus parallel ledgers**. Locking only the agent session turns off half the tap.

## Two ledgers: the agent’s tokens vs what it ships

Treating everything as one “AI bill” misleads governance. Keep at least two books.

**Ledger one is the agent loop itself.** Model calls, tool round-trips, subagent fan-out, prompt-cache hits—this is the routing and governance problem in [Control the Harness, Control the Cost](/blog/control-the-harness-control-the-cost/): who chooses the model, who manages cache boundaries, whether subagents inherit the parent. Trajectory waste is another slice of the same book: subsumed retrieval, near-duplicate scripts, re-running tests without a new patch—see [Coding Agents’ Cost-Inefficient Behaviors](/blog/coding-agents-cost-inefficient-behaviors/). Those posts ask how many tokens the runtime buys and how wastefully it buys them. If procurement only argues which model tier is expensive and never asks about harness defaults, the bill grows inside those defaults—that is the classic misread of ledger one.

**Ledger two is downstream services.** The service the agent wrote and deployed calls Stripe, OpenAI, or a search API, or sits on AWS / GCP and scales on usage. That money may never touch the API key you use to run the agent. A session budget can stop the agent while deployed processes and cron jobs keep billing. The reverse is also true: a hard cloud project cap does not fix a runaway model route on another ledger. The classic misread of ledger two is: “we put a monthly ceiling on the coding agent, so the cloud cannot blow up”—those sentences are not about the same meter.

Two ledgers need two enforcement points. Ledger one belongs in gateways, harness run/session budgets, and iteration ceilings. Ledger two belongs in cloud project/service spend limits, hard quotas on API platforms, and a product bias toward providers that offer hard caps. This essay’s thesis is ledger two; ledger one appears later only as a complement, not a substitute. In practice, add an org rule: any agent-created resource that leaves the laptop must declare, in the creation playbook, which ledger it sits on, where the hard cap lives, and who may lift it.

## Cloud vendors move toward hard stops: AWS and GCP

Willison names AWS as the service he most wants to see ship hard caps—plenty of people refuse AWS for personal projects out of justified fear of runaway bills, and some have already been burned. On 16 September 2026, in *New AWS experience helps builders get started and ship faster*, AWS wrote that after upgrading to a paid plan you can set a monthly spend limit for a project based on usage patterns; **if a project’s usage reaches its spend limit, the project is paused for that month**.[1][3] The announcement sits inside a simplified builder experience: start with sensible defaults, then talk spend limits on the paid plan, instead of spreading every enterprise IAM and billing knob on day one. For “an agent helps a newcomer deploy,” that narrative direction is right—provided the hard cap actually shows up on the default path.

The docs (*Create a spend limit in AWS Settings*) still warn that the new experience is releasing to a limited number of customers—you might not see it yet.[4] Public material also supports a few product semantics (docs first; do not invent GA for every account): the limit is a project-level pre-tax ceiling, not a fee; you get notifications as you approach it (for example at 50%, 75%, and 90% of actual cost); at the limit AWS pauses the project; raising the limit can reactivate; optional early controls include stopping new launches and pausing idle resources; there is also a cap on how many projects can carry a spend limit.[4] For individuals and small teams the operative phrase is **pause the project**—hard-stop semantics, not another email. “Limited release” still means: when an agent “defaults to recommending AWS,” you cannot assume every account already has this guardrail. Scaffolds that emit CloudFormation or Terraform should treat “is a project spend limit enabled?” as an explicit check, not as “AWS equals capped.”

Google Cloud shipped a related control in July 2026 as **Spend Caps** on Cloud Billing Budgets (Preview): set a monthly financial cap on **specific eligible services within a project**; when accumulated spend reaches the cap, the system automatically restricts further cost-incurring usage for that service in that project.[1][5] Docs say: new usage pauses until you manually lift the cap; alerts fire around 50% / 80% / 100%; eligible services currently include Gemini API, Gemini Enterprise Agent Platform (formerly Vertex AI), Cloud Run, and Cloud Run functions; scope is one project + one service + monthly; folders, organizations, and multi-project or multi-service budgets are out of scope; enforcement uses estimated gross costs for speed, but is not instantaneous, and overage accrued during latency is billed normally; some subscription-style charges may sit outside the cap.[5][6] For AI workloads, the materials also stress that Spend Caps can trigger faster than traditional billing reconciliation—closer to the timescale you need against an overnight burn—while still reminding you that faster is not instantaneous.

The shapes differ—AWS narrates project pause; GCP narrates pausing usage for one service without deleting resources—but the direction matches: **alerts are not enough; something has to stop.** Willison’s gloss is that this looks like a trend.[1] For people who write agents and scaffolds, the implication is concrete: when recommending clouds and APIs, bias toward paths with hard caps that are on by default or trivially enabled, and warn against uncapped pay-as-you-go combinations. Stay honest about limited release, Preview scope, and estimation latency.

## What “default” means: opt out, not a buried soft alert

“Offering a hard budget cap” and “default hard budget caps” are different product decisions. The first can be an optional switch on an advanced page, off by default. The second means: **out of the box there is a line that actually cuts**, and removing that line requires an explicit acceptance of responsibility.

Willison’s suggested checkbox copy is worth pasting into a product review:

> Remove the budget cap. My application will not be shut down if I exceed the configured budget limit, and I will be responsible for subsequent charges.[1]

Three requirements follow. First, **opt in to remove the cap, not opt in to wear it**—dangerous mode should be a deliberate choice. Second, the copy must state the consequence: the app will not shut down past the limit, and you own subsequent charges. Third, the checkbox should be prominent, not three menus deep under billing preferences. The same rule applies to agent-generated infrastructure: scaffolds that create cloud resources or API keys should default to hard-cap configuration; dropping the cap should become an explicit human-confirmed step, not a silent omission.

Enterprise pushback often sounds like “production cannot error.” Layer it: core production paths get higher hard caps plus human on-call; experiments, personal sandboxes, and agent-opened throwaway environments get tighter defaults. A hard cap does not kill elasticity; it removes unlimited billing from the default. If a business truly needs unlimited, that should be signed unlimited—not forgotten unlimited. “A low cap will false-kill us” is a tuning problem, not a reason to cancel hard stops: set a painful-but-survivable default and a clear raise path.

On agent products themselves: when an agent suggests “deploy this on cloud X,” the reply should include a hard-cap checklist, not only a `terraform apply` line. Ideal behaviour: ask for a budget ceiling → choose a capped provider or enable a spend limit → then emit the deploy playbook; if the user insists on no cap, surface a responsibility confirmation in Willison’s spirit. That is not politeness; it is putting the control plane into the conversation default.

## Complementary ceilings on the agent loop (not a substitute)

Once the downstream service cap is clear, look back at ceilings on the agent loop—they matter, but they are **the other ledger**.

Dreaming Press’s argument is hard: you cannot ask the agent to enforce its own budget, because a runaway loop is exactly the state in which the agent has stopped following instructions. The cap must live in the gateway between agent and provider, and it must refuse synchronously (for example a 429), not alert asynchronously. You also want both a dollar budget and an iteration cap—money alone misses a cheap but infinite spin.[2] The same piece warns that gateway budgets under concurrency are a distributed-consistency problem; LiteLLM and similar gateways logged multiple accounting-bypass defects in 2026. The number in config is a claim; the refused request is the proof.[2] Map that logic onto downstream services: a soft alert in the cloud console is the same failure mode—if enforcement is not synchronous on the billing path, what you own is a prettier after-the-fact chart.

Docker Agent’s budget config productizes the same idea: `max_cost`, `max_tokens`, and `max_time` are optional; **unset means unlimited**; crossing a ceiling stops the run and names which limit tripped.[7] Even when the tool can hard-stop, **the default may still be no budget at all**—the same product question as whether a cloud account ships with a cap. Named budgets can also make several agents share one wallet so subagent fan-out does not multiply a “per-agent ceiling” by N—useful for harness design, still confined to the session ledger.[7] SDKs such as AgentBudget try to put dollar hard limits and loop detection around LLM, tool, and external API calls at session scope as an in-process complement.[8]

These controls answer: **for this agent run, how much token, time, or session dollars may burn.** They do not automatically cover a service the agent already pushed with its own keys. The ideal stack runs both layers: a ceiling when the session ends, and a default hard cap on what was deployed. Do only one, and the other can keep billing while you sleep. Acceptance testing should hit the wall twice: once to exhaust the agent session budget and confirm a 429 / `budget_exceeded`, and once to exhaust the cloud or API hard cap and confirm the deployed service actually stops or refuses—not merely lights up.

## A checklist for builders and for agents that recommend infra

Fold the mechanism into checks you can run:

1. **Split the books.** Separate agent-runtime tokens from cloud/API bills for deployed services. Dashboards, alerts, and on-call routing should not collapse into one “AI spend” line. Procurement and internal chargeback should stay separated too, or you will save on model price and explode downstream.
2. **Ask for hard-stop semantics.** When a vendor says budget, cap, or limit, does the trigger email or refuse/pause? Does refusal hit a project, a service, or a single API key? Does a pause delete data, or only block new usage?
3. **Default the cap on.** New projects, new API keys, and agent-scaffolded environments should ship with a hard cap; removing it needs an explicit checkbox and responsibility copy. Treat “unset = unlimited” as a defect, not flexibility.
4. **Prefer capped providers.** When agents recommend infrastructure, bias toward paths that already offer project- or service-level hard caps, and warn on “unlimited pay-as-you-go with no hard stop”—matching Willison’s ask.[1]
5. **Tighten personal and experiment environments first.** Sandboxes, demos, and overnight scripts get low ceilings; production gets higher ones—not a shared unlimited pool. When an agent opens a throwaway environment, default to the lowest hard-cap tier.
6. **Add agent-loop ceilings separately.** Put session dollars, iterations, and time limits on the gateway/harness (Docker Agent budget, LiteLLM session caps, AgentBudget-style SDKs), and treat “unset = unlimited” as risk, not convenience.[2][7][8]
7. **Do not confuse soft alerts with enforcement.** Mail, Slack, and boards are necessary observability; they are not the kill switch. The kill switch has to fire on the billing path, synchronously. Alerts explain; enforcement stops the bleed.
8. **Acceptance-test by hitting the wall.** Deliberately exhaust the cap and confirm you get errors or a pause, not only a light. Accounting bypass under concurrency is a real failure mode; run a deliberate runaway against both the gateway and the cloud cap.[2]
9. **Document both ledgers.** README and runbooks should state what the agent budget covers, what the cloud spend limit covers, who may lift a cap, and whether a lift disables re-trigger for the rest of the month. Keep the responsibility confirmation in the change log for later audit.

The checklist collapses to one sentence: **cut by default; choose explicitly to keep burning money.** Agents made it easy to create things that bill. Products and scaffolds have to make “will not bill without a ceiling” equally easy. If you ship an agent that picks clouds and writes deploy playbooks, put the checklist in system prompts and tool policy.

## Closing

Coding agents did not invent cloud-bill risk, but they changed how often and how it appears: from “an operator’s mistake” to “one low-friction session can stand up a continuously billable loop.” Soft budgets push responsibility onto a sleeping human; hard budgets keep responsibility on the billing path—stop at the line; prefer errors to surprise invoices.

In-site, [harness cost control](/blog/control-the-harness-control-the-cost/) and [trajectory waste](/blog/coding-agents-cost-inefficient-behaviors/) still own the agent’s own tokens. This post adds the layer the agent deploys. AWS project spend limits and Google Cloud Spend Caps show vendors moving toward hard stops, with limited release and service-scope boundaries still in force. Builders and agents should not wait for universal GA to change defaults—**treat hard caps as the default control on pay-by-usage services, and make removing the cap an explicit responsibility checkbox.** Waiting until the invoice arrives is usually already one sleep cycle too late.

## References

[1] Simon Willison, [*We’re going to need default hard budget caps on pretty much everything*](https://simonwillison.net/2026/Oct/3/default-hard-budget-caps/), 3 October 2026.

[2] Dex Mareno, [*How to Put a Hard Spending Cap on an AI Agent*](https://dreaming.press/posts/how-to-cap-ai-agent-spending.html), Dreaming Press, 3 July 2026.

[3] Amazon Web Services, [*New AWS experience helps builders get started and ship faster*](https://aws.amazon.com/about-aws/whats-new/2026/09/New-AWS-Builder-Experience/), 16 September 2026.

[4] AWS Account Management, [*Create a spend limit in AWS Settings*](https://docs.aws.amazon.com/accounts/latest/reference/create-spend-limit.html) (docs note limited release).

[5] Google Cloud, [*New early anomalies and spend caps on Google Cloud Budgets*](https://cloud.google.com/blog/topics/cost-management/new-early-anomalies-and-spend-caps-on-google-cloud-budgets); docs [*Manage spend cap budgets*](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps) (Preview; eligible services and limits per docs).

[6] Google Cloud Billing release notes, 27 July 2026: Spend cap budgets available for a limited set of services (Preview).

[7] Docker Docs, [*Docker Agent — Budget*](https://docs.docker.com/ai/docker-agent/configuration/budget/).

[8] AgentBudget, [GitHub: AgentBudget/agentbudget](https://github.com/AgentBudget/agentbudget) (session-scoped dollar hard-limit SDK; conceptual parallel).

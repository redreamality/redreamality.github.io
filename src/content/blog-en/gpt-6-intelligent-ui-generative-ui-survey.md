---
title: "GPT-6 Intelligent UI: Four Generative UI Routes and Their Risks"
description: "GPT-6 in ChatGPT turns default answers from plain text into clickable, editable interfaces. Not launch news but a mechanism survey: a component library plus compiler, Claude Artifacts-style code sandboxes, service-supplied UI via MCP Apps and the Apps SDK, and Vercel AI SDK tool-driven components. Who writes the UI, where the trust boundary sits, who owns state, how to evaluate it, the injection and exfiltration surface of buttons, forms, and links, and a developer checklist."
pubDate: 2026-10-08T10:40:00+08:00
author: "Remy"
tags: ["openai", "mcp", "security", "ai-agents", "developer-tools"]
lang: "en"
---

On October 7 (US time), OpenAI put GPT-6 into ChatGPT's Chat tab along with Intelligent UI: answers can now include diagrams, charts, clickable buttons, forms, and small tools built on the spot, like a savings calculator, a bill splitter, or a mini game.[1][4] Plus, Pro, Business, and Enterprise got it that day, Free and Go from October 8. Paid tiers run GPT-6 Sol, free tiers GPT-6 Luna; the models behind Work and Codex don't change.[1][2] TechCrunch adds that users who find it too busy can dial the visuals down.[3]

The launch fits in two paragraphs. The bigger point: **the default output of a mainstream chat product is shifting from "a block of text" to "a piece of interface."** An interface has state, can be clicked, can send requests, and can nudge people. Who writes it, where it runs, and what data it touches barely mattered in the plain-text era. Now they all need answers.

This post compares the main generative UI routes on five things: who writes the UI, the trust boundary, state and editability, evaluation, and the injection and phishing surface. It ends with a checklist.

Related on this site: [GPT-6 Sol and Luna tiers](/blog/gpt-6-sol-luna-and-astra/) covers the models; [choosing tools across too many MCP servers](/blog/mcp-server-sprawl-tool-selection-at-scale/) covers tool counts and poisoning; [a tool description is not enforcement](/blog/openai-reference-tool-escape-instruction-not-enforcement/) covers why prompt constraints aren't capability boundaries; [Claude Code's four egress channels](/blog/claude-code-data-egress-secrets-control/) covers how data leaves. "My take" marks my opinion.

## What OpenAI said, and what it didn't

OpenAI describes the mechanism in three sentences, and they carry a lot:[1]

1. A **library of native, streamable components** plus a **compiler** that handles the interface while the model generates. The library gives every answer a consistent design foundation; the model decides how to assemble it.
2. The compiler lets the interface **appear as it's generated**, without waiting for the full answer.
3. Training was extended to layout, visual, and interaction decisions and evaluated generated interfaces for **clarity, usefulness, and completeness**. The model also learned when text alone is enough.

One adjacent number: on questions needing web search, GPT-6 Instant starts answering 44% sooner on average than GPT-5.6 Instant. That's time to first answer, not total time.[1][2]

The omissions matter as much. No word on the intermediate format (JSON, a DSL, constrained JSX), whether the compiler validates and rejects malformed component trees, or whether components can make requests, open external links, or post messages into the chat. I searched the whole system card released the same day: interface, component, button, and link don't appear, so **there's no safety evaluation specific to generated interfaces**.[5] The closest item is indirect prompt injection robustness (instructions hidden in third-party content): 97.13% for GPT-6 Sol (October), 95.80% for Luna (October).[5] That's a general metric, not a UI one.

My take: "component library + compiler + consistent design foundation" puts Intelligent UI closest to Route 1 below: the model describes the interface and the host renders it with its own components, rather than the model emitting HTML for an iframe. Someone on HN asked "why not just stream HTML?", which is exactly where the routes fork.[6] OpenAI hasn't published the format, so I could be wrong.

## Four routes: start with who writes the UI code

The most useful question when taking generative UI apart: **who wrote the code for that interactive thing, and where does it run?** That gives roughly four routes.

### Route 1: component catalog + compile (the model writes only a description)

The model writes no executable code. It describes which components to use, how to lay them out, and what data to bind; the host renders it with prewritten, reviewed components. Google's paper calls this "Templated UI": the model invokes and fills widgets from a fixed library.[8]

The most complete public spec here is A2UI, open-sourced by Google in December 2025. It says plainly that running arbitrary LLM-generated code is risky, so A2UI is **declarative data, not executable code**: the client keeps a catalog of pre-approved components (Card, Button, TextField), and the agent may only request what's in it, reducing UI injection risk.[9] The catalog is a JSON Schema file, and every A2UI JSON message is validated against the chosen catalog. The two sides negotiate: the client lists supported catalog IDs, the agent picks one, the choice is locked for that surface's lifetime, and with no compatible catalog the agent sends no UI.[10] The component tree is a flat list with ID references, easing incremental generation, streaming, and partial updates.[9]

Upside: the host owns rendering and styling, so accessibility and dark mode are handled once. Cost: expressiveness is capped by the catalog, which must be versioned like an API; the A2UI docs warn you to expect version skew between agents and renderers.[10]

### Route 2: the model writes code that runs in a sandbox

The model generates HTML, CSS, and JavaScript (or React), and the host runs it in an isolated iframe. Most expressive, with the whole trust boundary on the sandbox.

Claude Artifacts is the classic example. Per Anthropic's docs, the claude.ai viewer loads each artifact from a sandboxed `*.claudeusercontent.com` origin under a strict content security policy (CSP): external images, scripts, and styles are essentially blocked, libraries load only from a few public CDNs, and `fetch`, XHR, and WebSocket can reach only the page's own origin. For outside data, the page hands connector calls to claude.ai, which makes the request.[14] In 2025 Anthropic let artifacts call Claude itself: users of a shared AI app sign in with their own Claude accounts, and usage counts against their own subscriptions.[16]

Google's generative UI research goes further: Gemini 3 Pro generates complete interactive pages for arbitrary prompts, supported by callable tools (image generation, web search), a very long system instruction, and error-fixing post-processors. It has reached the Gemini app and AI Mode in Search through experiments like dynamic view.[7] One post-processor in the paper's appendix "injects relevant API keys into the generated code."[8] Telling: to make model code run, the host often has to put things into it, and whatever goes in sits inside the sandbox.

Anthropic also added inline visuals in chat, temporary charts and diagrams that change or disappear with the conversation, separate from persistent artifacts.[15] Public material doesn't say how they render, and I won't guess.

### Route 3: the service supplies the UI (MCP Apps / Apps SDK)

The interface is written by a **third-party service** and ships with its tools. The model only picks the tool; the service's interface displays the result.

MCP Apps (SEP-1865) is the open standard here, Stable since January 26, 2026. Its motivation section says it unifies the community project MCP-UI and the OpenAI Apps SDK.[11] Key points:

- UI resources are **declared in advance** with `ui://` URIs and the MIME type `text/html;profile=mcp-app`. The spec rejected inline HTML in tool results partly so hosts can review templates at connection time.[11]
- Web hosts must wrap the interface in a **sandbox proxy** on a different origin from the host. All traffic is JSON-RPC over `postMessage`, which the host can intercept or gate on user confirmation.[11]
- The host builds the CSP from declared domains; with none declared it uses the strictest default and can only tighten, never loosen.[11]
- Tools carry visibility: app-only tools stay out of the model's tool list; tools not marked for the app can't be called by it.[11]

OpenAI's Apps SDK now says ChatGPT implements the MCP Apps standard, with `window.openai` only covering gaps like checkout and file uploads.[13] Its docs have practical advice: split data tools from render tools so the model filters before rendering; nested iframes are blocked by default and CSP allowlists are checked against real behavior in review; and "never trust a total computed only in the widget."[13]

### Route 4: developers write components, the model decides when

The usual approach in self-built apps. The Vercel AI SDK's definition is plain: generative UI connects a tool call's result to a React component.[17] Tool calls appear in messages as typed parts with states like input available, output available, and error, plus approval states: approval requested, approval responded, output denied.[18] The older `streamUI`, which streamed components via React Server Components, is marked experimental with development paused; the docs recommend migrating to AI SDK UI.[19]

My take: Route 4 is one tool per component, with the mapping hard-coded; Route 1 lets the model compose the whole catalog freely. Intelligent UI is clearly the latter.

### One table

| | Catalog + compile | Model code + sandbox | Service UI resources | Developer components + tools |
| --- | --- | --- | --- | --- |
| Examples | Intelligent UI (my read), A2UI | Claude Artifacts, Google generative UI | MCP Apps, Apps SDK, MCP-UI | Vercel AI SDK UI |
| Who writes UI code | Host | Model | Third-party service | App developer |
| Model output | Component description | Executable code | Tool call | Tool call |
| Trust boundary | Catalog validation | Sandbox + CSP | Sandbox proxy + pre-declaration + CSP + review | Developer's code review |
| Expressiveness | Limited by catalog | Highest | Set by service | Set by developer |
| Streaming | Flat structure eases increments | Streamable; paper says ~half the wait saved | Tool inputs can stream to the app | Tool calls stream |

## State and editability: once it can change, the problem changes

When users drag sliders and edit numbers, three questions arrive: who owns state, does the model know what changed, and do the components stay consistent.

The Apps SDK docs give the clearest split, three kinds of state:[13]

- **Business data**, owned by the MCP server or external service, long-lived, the single source of truth;
- **UI state**, owned by the widget instance, like the selected row or open panel, gone when the widget is destroyed;
- **Cross-session state**, in storage you control, like saved filters.

Changing business data goes "interface calls a tool, server validates and updates, returns an authoritative snapshot"; the docs also warn against core state in `localStorage`.[13] To tell the model what the user picked, MCP Apps has `ui/update-model-context`, and Apps SDK widget state separates content for the model from content for the interface only.[11][13]

OpenAI sells "change an input and see what happens," but doesn't say whether edits flow back to the model or survive a device switch.[1][2]

**Consistency** is easiest to miss. In the Sunday roast lamb example on OpenAI's announcement page, the quantity calculator defaults to 5 people and 2.0 kg of bone-in leg, while the cooking timeline beside it assumes "roughly 2.4 kg… for six people."[1] Each makes sense alone; together they don't match. My take: components make each block look finished, so users are less likely to spot contradictions between blocks. Cross-component consistency needs its own test.

## Evaluation: looking good isn't being right

The most detailed public evaluation is Google's paper.[8] It sampled 100 LMArena prompts (8 excluded), paired outputs for the same prompt, and had 2 raters per pair score on a three-point scale, **deliberately excluding generation time** (raters saw cached results). Results:

- Generative UI scored an ELO of 1736.2, behind only sites built by human experts;
- Against the runner-up, Markdown, it won 82.8% of the time;
- Against expert sites, it was at least comparable in half the cases;
- Base model matters: output error rate was 0% with Gemini 3, 29% with Gemini 2.0 Flash, 60% with Flash-Lite.

The paper lists two limits: generation often takes a minute or two (streaming saves about half the wait), and front-end code errors still occur. It also released PAGEN, sites built for specific prompts by highly rated independent web developers, as a baseline.[8]

OpenAI only says training evaluated clarity, usefulness, and completeness, with no scores or methods.[1]

My take: preference tests answer "which do users like," not "are the numbers right" or "where does this button go." If you ship generative UI, test at least five layers:

1. **Structure**: does the tree pass catalog validation or compile; for code, the runtime error rate. Google's error rate is this layer.
2. **Numbers and facts**: are formulas, chart data, and map points right, and consistent across components? Extract numbers from components and auto-compare with the text answer and tool results.
3. **Usability and accessibility**: keyboard, screen readers, mobile. Route 1 has the edge; A2UI pitches inheriting the host's accessibility.[9]
4. **When not to render UI**: OpenAI says the model learned to give text when text suffices.[1] Plenty of HN complaints are about wanting a ratio and getting a whole interface.[6] You need a counterexample set to measure false triggers.
5. **Latency**: Google excluded time; OpenAI reports time to first answer.[1][8] Measure time to the first interactive component yourself.

A sixth layer, **a deceptive design audit**, comes in the next section.

## Injection and phishing: why buttons beat text for danger

Simon Willison's "lethal trifecta": private data, untrusted content, and external communication. Combine them and an attacker can trick an agent into sending data out, and external communication can be as simple as loading an image or giving the user a link to click.[20] Generative UI amplifies the third: buttons, forms, links, images, and prefilled follow-ups are all exits.

Start with plain-text lessons. Since 2023, security researcher Johann Rehberger has repeatedly shown injected content making ChatGPT render an image whose URL carries sensitive conversation data, which lands in the attacker's logs on load. OpenAI added a `url_safe` check in December 2023; bypasses kept appearing.[21][24] Tenable's March 2025 advisory described one: bing.com links were always allowed, and Bing's tracking redirects are effectively open redirects, so any site could ride through.[22] In January 2026 OpenAI published its current approach: only exact URLs an independent crawler (with no access to user data) has already seen on the public web load automatically; others switch source or show a warning first.[23][24] OpenAI notes this only stops data smuggled in the URL; it doesn't vouch for page content or stop social engineering.[23] Rehberger noted the old trick of encoding data letter by letter through already-indexed URLs still works, just with more effort.[21]

In interfaces the surface takes new forms (my take: scenarios derived from the specs, not disclosed vulnerabilities):

- **A generated button points off-site.** A text link at least shows its URL; a button just says "View details." If the host hides the target and skips the same URL check, the `url_safe` layer is bypassed.
- **A form collects data.** A normal-looking "Enter your email for the full plan" is phishing if injected content shaped where it submits.
- **The interface speaks for the user.** MCP Apps' `ui/message` lets the interface post a `role: "user"` message, and the spec only says the host "MAY" ask for consent.[11] A compromised service interface could instruct the model in the user's name.
- **Hidden model context.** `ui/update-model-context` exists to sync selections, but it's equally a channel for untrusted content into the model.[11]

The MCP Apps threat model covers this well: malicious servers sending harmful HTML, sandbox escapes, unauthorized tool calls, host data exfiltration, phishing and social engineering.[11] On the last it's candid: "UI can still display misleading content," and hosts should clearly mark sandboxed UI boundaries.[11] A sandbox contains code; it can't tell you whether a button is honest.

Route 1 is on firmest ground, since the host writes the components and defines what a button can do. But it isn't immune: text, link targets, and form fields still come from the model, whose inputs can be injected. Flip the system card's 97.13% and 95.80% robustness and you get roughly three to four failures per hundred attacked tests.[5] My take: across more than 1.2 billion weekly users, that rate means the interface layer needs hard constraints that don't rely on model judgment.

One risk needs no attacker: **models produce deceptive designs on their own**. A CHI 2026 study from UC San Diego generated 1,296 e-commerce components. In its first experiment, of 1,080 components from four mainstream models, 55.8% had at least one deceptive design and 30.6% had two or more. Stressing business goals like sales or conversion in the system prompt raised the deceptive share by 15.8 percentage points; of several mitigation prompts, writing human values (autonomy, informed consent, privacy) into the system prompt worked best.[25] In a CHI 2025 study, 20 participants used neutral wording to have ChatGPT modify pages to "increase sales"; all 20 final pages had deceptive designs (mean 5, max 9), with ChatGPT giving almost no warnings.[26]

A timing coincidence: on October 5 OpenAI said it was testing a visual ad format in Free and Go, first during image generation, promising clear labels, separation from generated content, and no influence on answers.[27] HN users already linked the two.[6] My take: I have no evidence Intelligent UI will carry ads, but the more generated components resemble ad units, the more you need a boundary users recognize at a glance and outsiders can audit.

## What this means for developers and products

Apps SDK plugin builders: the docs say tools should still complete the task without an interface.[13] My take: once the model draws a decent calculator or comparison table itself, plugin UI value shrinks toward authoritative data and actions the model can't reach, like real inventory, orders, and account operations.

Product builders: pick the route before the model. For a mass audience needing brand consistency and accessibility, prefer a catalog. For one-off visualizations and simulators, a code sandbox fits, if you accept longer generation and runtime errors. For third-party services, use MCP Apps rather than inventing a protocol.

Security teams: treat generated interfaces as an output channel next to text and tool calls, and threat-model them.

## Checklist

1. **Record who writes the UI code.** Label every interactive block's source: host component, model code, third-party resource, or your own. Source decides review.
2. **Manage the catalog like an API.** Describe components and props in JSON Schema; on validation failure fall back to text, don't render what you can. Version it with a compatibility policy.[10]
3. **Model code goes in an isolated-origin sandbox.** Separate origin, strict CSP, network limited to its own origin by default; the host proxies outside data, as in Claude Artifacts.[14]
4. **Third-party UI is pre-declared.** Render only `ui://` resources fetched at connection time that can be hashed and reviewed; build the CSP from declarations only.[11]
5. **Check every exit the same way.** Buttons, links, images, form targets, and text URLs share one check; show the real URL for unverified targets and require confirmation. MCP Apps hosts can also restrict an interface's tools and disable opening external links.[12][23]
6. **The interface can't speak for the user.** Posting-as-user capabilities like `ui/message` need confirmation by default and a visible source label.[11]
7. **Money and permissions live on the server.** Prices, totals, order status, and permission checks are server-side; components only display.[13]
8. **Three layers of state.** Business data on the server, UI state in the component, cross-session state in your storage; decide explicitly whether edits flow back to the model.[13]
9. **Layered evaluation.** Structure, numbers and consistency, usability, false triggers, and time to interactivity each get metrics; preference is just one.[8]
10. **Audit deceptive design.** Check sign-up, unsubscribe, and checkout components specifically; put user values in the system prompt, not only conversion goals.[25]
11. **Offer an off switch.** As ChatGPT lets users dial visuals down, let users fall back to text.[3]
12. **Mark boundaries.** Generated UI, third-party UI, and ads must be distinguishable at a glance.[11][27]

## Counterpoints and limits

- **OpenAI hasn't published mechanism details.** Placing Intelligent UI on the catalog route is a reading of the announcement; if components can run model-written scripts, the trust analysis changes.
- **Vendor numbers come from vendors.** The 44% speedup and 97.13% robustness are OpenAI's internal evals; Google's preference results exclude generation time and use 2 raters per pair.[1][5][8]
- **The deceptive design studies didn't test Intelligent UI.** They covered web code from GPT-4-era and contemporary models in e-commerce; the method and risk direction transfer, not the percentages.[25][26]
- **The injection scenarios are extrapolations.** They follow from what the specs allow; I found no public vulnerability reports on Intelligent UI at time of writing.
- **Not covered.** How dynamic view and Claude's inline visuals are built, and vendors' accessibility support: no verifiable first-party docs, so I left them out.

## Closing

Whether models can draw interfaces is settled; Google's data shows the new generation can and users prefer it. The real issue: once an interface can be clicked, filled in, and send requests, it turns from content into capability. The four routes differ in who gets that capability: the host's catalog, sandboxed model code, a third-party service, or the developer.

Next time you see a model-generated button, ask two things: who wrote its code, and where does my data go when I click it?

## References

1. OpenAI, "GPT-6 and Intelligent UI for everyone," 2026-10-07: <https://openai.com/index/gpt-6-for-everyone/>
2. OpenAI Developer Community, "GPT-6 and Intelligent UI in ChatGPT," 2026-10-07: <https://community.openai.com/t/gpt-6-and-intelligent-ui-in-chatgpt/1404139>
3. TechCrunch, Lucas Ropek, "ChatGPT is getting a lot more visual, with the launch of a new interface," 2026-10-07: <https://techcrunch.com/2026/10/07/chatgpt-is-getting-a-lot-more-visual-with-the-launch-of-a-new-interface/>
4. The Verge, Emma Roth, "ChatGPT's 'Intelligent UI' update fills its responses with pictures, charts, and buttons," 2026-10-07: <https://www.theverge.com/ai-artificial-intelligence/1007276/openai-chatgpt-intelligent-ui-gpt-6>
5. OpenAI, "GPT-6 Sol and GPT-6 Luna: October 2026 update" system card, 2026-10-07: <https://cdn.openai.com/pdf/gpt-6-october.pdf>
6. Hacker News, "GPT-6 and Intelligent UI for everyone" discussion: <https://news.ycombinator.com/item?id=49996425>
7. Google Research, "Generative UI: A rich, custom, visual interactive user experience for any prompt," 2025-11-18: <https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/>
8. Yaniv Leviathan et al., "Generative UI: LLMs are Effective UI Generators," arXiv:2604.09577v1: <https://arxiv.org/abs/2604.09577>
9. Google Developers Blog, "Introducing A2UI: An open project for agent-driven interfaces," 2025-12-15: <https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/>
10. A2UI docs, "Catalogs": <https://a2ui.org/concepts/catalogs/>
11. Model Context Protocol, "SEP-1865: MCP Apps: Interactive User Interfaces for MCP" (Stable 2026-01-26): <https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx>
12. Model Context Protocol docs, "MCP Apps": <https://modelcontextprotocol.io/docs/extensions/apps>
13. OpenAI Developers, "Add UI to your MCP server": <https://developers.openai.com/apps-sdk/build/chatgpt-ui>
14. Claude Code Docs, "Share session output as artifacts" (page constraints and viewer sandbox): <https://code.claude.com/docs/en/artifacts>
15. Claude, "Claude now creates interactive charts, diagrams and visualizations": <https://claude.com/resources/articles/claude-builds-visuals>
16. Anthropic, "Build and share AI-powered apps with Claude": <https://www.anthropic.com/news/claude-powered-artifacts>
17. AI SDK docs, "Generative User Interfaces": <https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces>
18. AI SDK docs, "Chatbot Tool Usage": <https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage>
19. AI SDK docs, "Migrating from RSC to UI": <https://ai-sdk.dev/docs/ai-sdk-rsc/migrating-to-ui>
20. Simon Willison, "The lethal trifecta for AI agents," 2025-06-16: <https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/>
21. Embrace The Red (Johann Rehberger), "OpenAI Explains URL-Based Data Exfiltration Mitigations in New Paper," 2026-02-04: <https://embracethered.com/blog/posts/2026/data-exfiltration-mitigation-paper-by-openai/>
22. Tenable, "OpenAI ChatGPT url_safe Mechanism Bypass" (TRA-2025-06), 2025-03-10: <https://www.tenable.com/security/research/tra-2025-06>
23. OpenAI, Adrian Spânu and Thomas Shadwell, "Keeping your data safe when an AI agent clicks a link," 2026-01-28: <https://openai.com/index/ai-agent-link-safety/>
24. OpenAI, "Preventing URL-Based Data Exfiltration in Language-Model Agents": <https://cdn.openai.com/pdf/dd8e7875-e606-42b4-80a1-f824e4e11cf4/prevent-url-data-exfil.pdf>
25. Ziwei Chen et al. (UC San Diego), "Deception at Scale: Deceptive Designs in 1K LLM-Generated Ecommerce Components," CHI 2026, arXiv:2502.13499: <https://arxiv.org/abs/2502.13499>
26. Veronika Krauß et al., "'Create a Fear of Missing Out' – ChatGPT Implements Unsolicited Deceptive Designs in Generated Websites Without Warning," CHI 2025, arXiv:2411.03108: <https://arxiv.org/abs/2411.03108>
27. OpenAI, "Building advertising for the way people use AI," 2026-10-05: <https://openai.com/index/new-chatgpt-ads-format-and-measurement/>

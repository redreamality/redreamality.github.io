---
title: "More MCP Servers, Worse Tool Picks: Tool Search, Code Mode, and ToolSearcher"
description: "Connect enough MCP servers and tool schemas eat tens of thousands of tokens before work starts, while wrong picks, name collisions, and tool poisoning pile up. Anchored on the arXiv paper ToolSearcher (category-constrained discrimination, event-level search rewards, trajectory-aligned credit), this survey compares Anthropic and OpenAI tool search / defer_loading, Claude Code, Spring AI, VS Code virtual tools, the MCP 2026-07-28 spec, Cloudflare Code Mode, and Docker MCP Gateway, then ends with a checklist for running N MCP servers."
pubDate: 2026-10-07T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "mcp", "developer-tools"]
lang: "en"
---

Hooking MCP servers to an agent goes like this: GitHub, Slack, Jira, Sentry, a database, each easy. By the fifth or sixth, tool descriptions fill the context before the session starts, and the agent soon confuses two similarly named tools.

This post is about that: **more tools make context costlier, selection worse, and the attack surface larger**, and about today's fixes. The anchor is ToolSearcher, posted to arXiv on September 25 (Zhejiang University and Ant Group, NeurIPS 2026), which treats searching, distinguishing, and selecting among tens of thousands of tools as a reinforcement learning problem.[1] Most teams use training-free fixes (tool search, Code Mode, gateways), so I compare them all.

Related posts here: [Pi 1.0 folding MCP into Codemode](/blog/pi-1-0-codemode-mcp-minimal-harness/) covers one harness; [Progressive Disclosure](/blog/progressive-disclosure-agent-skills/) and [SkillDelta](/blog/skilldelta-selective-skill-activation/) cover on-demand skills and whether to inject them; the [Agent Skills 2026 survey](/blog/agent-skills-2026-survey-lifecycle-map/) covers the skill lifecycle; [SSRF in Google MCP Toolbox](/blog/google-mcp-toolbox-ssrf-tool-path-boundary/) covers one tool path's egress boundary. This post looks only at tool count. "My take" marks opinion.

## First, the bill: what tool definitions cost in context

Anthropic's November 2025 post tallies a common five-server setup: GitHub, 35 tools (~26K tokens); Slack, 11 (~21K); Sentry, 5 (~3K); Grafana, 5 (~3K); Splunk, 2 (~2K). That is 58 tools and ~55K tokens before the conversation starts; add Jira (~17K) and you near 100K. Internally they have seen definitions consume 134K tokens before optimization.[2] The Claude API tool search docs reuse the ~55K example.[3]

By my arithmetic, that is about 740 tokens per GitHub tool and nearly 1,900 per Slack tool.

Cloudflare is more extreme. Its API has 2,500+ endpoints; as native MCP tools, the 2,594 tools would take about 1.17 million tokens with full schemas, and about 244,000 with required parameters only, more than most models' entire context window.[4][5]

Clients impose hard limits. VS Code allows at most 128 tools per chat request ("Cannot have more than 128 tools per request").[6] Claude Code limits outputs: it warns past 10,000 tokens per MCP tool result and caps at 25,000 by default.[7]

My take: tool definitions are a **fixed cost paid every turn**, however many tools the turn uses. Prompt caching lowers the repeat charge, but the context they occupy stays occupied.

## Not just tokens: four failures arrive together

### Wrong tool, wrong parameters

Anthropic's docs are blunt: Claude's tool-picking degrades past 30 to 50 available tools.[3] The engineering post says the most common failures are wrong tool selection and incorrect parameters, especially with similar names like `notification-send-user` and `notification-send-channel`.[2] On internal MCP evaluations, tool search took Opus 4 from 49% to 74% and Opus 4.5 from 79.5% to 88.1%.[2] Read in reverse, that is what loading everything up front cost.

Research agrees. RAG-MCP first retrieves relevant MCP servers and passes only their descriptions; on its benchmark, selection accuracy rose from 13.62% to 43.13% and prompt tokens fell by over half.[8]

### Name collisions

The MCP spec requires tool names to be unique only **within one server**. The 2026-07-28 revision says aggregating clients or proxies "MAY encounter naming collisions," such as two servers each exposing `search`, and SHOULD disambiguate, for example by prefixing a server identifier; the `serverInfo` name is not guaranteed unique and should not be relied on.[9]

Claude Code names plugin-bundled server tools `mcp__plugin_<plugin-name>_<server-name>__<tool-name>`, so a hook matcher on the bare server key (like `mcp__database-tools__.*`) never fires inside a plugin.[7] Rewritten names mean permissions, hooks, and allowlists must follow.

### Intermediate results shuttled through context

Anthropic's example: move a meeting transcript from Google Drive to Salesforce. With direct calls the transcript enters context as a result, then gets written out again as the next argument; a two-hour meeting can add about 50,000 tokens, and copying between calls invites mistakes.[10]

### Every server adds text that can steer the agent

In April 2025 Invariant Labs demonstrated "tool poisoning": instructions hidden in a tool description, which the UI shows as a simplified name while the model sees everything. The model was steered into reading `~/.cursor/mcp.json` and SSH keys and leaking them through an innocent-looking parameter.[11] Two worse variants: **cross-server shadowing**, where a malicious description says that when `send_email` exists all mail must go to some address, changing how the agent uses a trusted tool without calling the malicious one; and the **rug pull**, where a server changes descriptions after approval.[11]

The spec says clients must treat tool annotations from untrusted servers as untrusted.[9] The security best practices list confused deputy attacks, token passthrough, SSRF, and local server compromise, and exposure to each grows with server count.[12]

My take: the four share a root: **every server's descriptions sit flat in one context**. Each fix below decides which descriptions enter, when, and in what form.

## Fix 1: load tool definitions on demand

The mainstream approach: register every tool, show some, and let the model search before loading.

### Anthropic: defer_loading plus tool search

The Claude API adds a tool search tool to `tools` and marks the rest `defer_loading: true`.[3] Details:

- Regex search has Claude write Python patterns (max 200 characters); BM25 takes natural language (max 500). Both search names, descriptions, argument names, and argument descriptions.[3]
- A search returns 5 `tool_reference` blocks by default, expanded by the API into full definitions; up to 10,000 deferred tools per request.[3]
- Deferred tools stay out of the system-prompt prefix and are appended when found, so **prompt caching is preserved**.[3]
- At least one tool stays non-deferred; keep your 3–5 most-used tools loaded. Custom search, such as embeddings, works if it returns `tool_reference` blocks.[3]
- For MCP, defer a whole server in the `mcp_toolset` entry's `default_config` and make per-tool exceptions in `configs`.[2][3]

Use it with 10+ tools, 10K+ definition tokens, falling accuracy, or aggregated MCP servers (200+ tools); skip it below 10 tools or when all are used every turn.[3] The blog's example went from about 77K tokens to 8.7K, about 85% less.[2]

### Claude Code: on by default, with a threshold mode

Claude Code has tool search on by default: only tool names and server instructions load at session start, and there is no fixed per-server tool cap; the limit is your context budget.[7] Knobs:

- `ENABLE_TOOL_SEARCH=auto` loads tools up front while definitions stay under 10% of the context window and defers them all past that; `auto:5` uses 5%.[7]
- `alwaysLoad: true` exempts a server needed every turn. A non-first-party `ANTHROPIC_BASE_URL` disables tool search, since most proxies drop `tool_reference` blocks.[7]
- Tool descriptions and server instructions are truncated at 2,048 characters. Server authors should say what tasks the server handles and when to search it, because that is the first text the model sees.[7]

### OpenAI: tool_search and namespaces

OpenAI's Responses API has `tool_search` too, on gpt-5.4 and later only.[13] The difference is what the model sees at the start:

- An individually deferred function still shows its name and description; mostly the parameter schema is deferred.
- A namespace or MCP server shows only its name and description.

So OpenAI recommends namespaces or MCP servers, says its models were primarily trained to search them, and suggests under 10 functions per namespace.[13] Search can be hosted, or the model emits a `tool_search_call` your app resolves, useful when tools depend on tenant state. Loaded tools go at the end of the context to preserve the cache.[13]

### Spring AI: the same pattern, across providers

Spring AI implements it as an advisor (a tool-loop interceptor): tools go into a local index (Lucene, vector, or regex), the first request carries only the search tool, and found tools join the next.[14][15] On a 28-tool demo (3 relevant), three providers saved 34% to 64% of total tokens while requests rose from 3–4 to 4–5; the blog calls these a few manual runs, illustrative only.[14] Aside: the community version's search interface is named `ToolSearcher`, unrelated to our anchor paper.[14]

### VS Code: virtual tool groups

VS Code uses "virtual tools": past a threshold (default 128), tools are grouped into directory-like virtual tools whose members appear only after the model calls the group.[16] Per the team, a small server becomes one group, large ones are split by category, and built-in tools are never grouped.[17]

### Research counterpart

MCP-Zero has the model write structured tool requests, routed in two stages, server then tool; on a 308-server, 2,797-tool dataset it reports 98% fewer tokens on APIBank.[18]

My take: the implementations differ mainly in **how much directory the model sees at session start**: just a search tool (Anthropic API), tool names (Claude Code), namespace descriptions (OpenAI), group names (VS Code). Showing less saves more but relies on the model knowing what to search for, so server instructions and namespace descriptions become the routing table.

## Fix 2: what the protocol can do

MCP does not define "tool search," but some mechanisms shape how well clients can do it.

- **Paged, changeable lists.** `tools/list` paginates; servers declaring `listChanged` should notify on change.[9] Claude Code refetches and keeps the old list if refresh fails; before v2.1.214 a transient error emptied the tools.[7]
- **Stable lists cache well.** The 2026-07-28 revision forbids `tools/list` varying per connection and recommends deterministic ordering for prompt-cache hits; results gain `ttlMs` and `cacheScope` hints.[9][19]
- **Tools by authorization.** A server may return only the tools the caller's scopes permit.[9]
- **Subscriptions.** With protocol sessions gone, clients subscribe to `toolsListChanged` via `subscriptions/listen`.[19]

My take: the protocol makes tool lists **stable, cacheable, and permission-trimmed**; choosing what the model sees this turn is still the client's or gateway's job. Adopt tools-by-authorization first: the cheapest saving is never showing tools the model may not call.

## Fix 3: don't let the model call tools directly, let it write code

Models write code well, so make MCP tools a code API.

### Cloudflare Code Mode

Cloudflare's Code Mode (September 2025) converts MCP schemas into a commented TypeScript API, gives the model one "run code" tool, and has it write sandboxed code that returns results via `console.log`.[20] The reasoning: models have seen vast real code but few contrived tool-call examples. The sandbox is a V8 isolate without Internet access, reaching out only through bindings for the connected MCP servers; keys stay with the supervisor.[20] Back then the whole TypeScript API still loaded into context.[20]

The February 2026 follow-up fixed that: the Cloudflare API's MCP server exposes only `search()` and `execute()`, about 1,000 tokens regardless of endpoint count. `search` runs model-written JavaScript over the OpenAPI spec with `$ref`s pre-resolved; `execute` gets an authenticated request function. Their example, from finding endpoints to fetching rulesets, took four tool calls.[4] The docs cap final responses at about 6,000 tokens, marked `--- TRUNCATED ---`, and note truncation does not undo API work already done.[21]

### Anthropic: code execution with MCP and Programmatic Tool Calling

Anthropic's November 2025 version generates one file per tool (such as `servers/google-drive/getDocument.ts`); the agent lists directories and reads only what it needs, cutting tokens from 150,000 to 2,000, or 98.7%.[10] It also suggests a `search_tools` tool with a detail-level parameter (name, name plus description, or full schema), and since intermediate data stays in the sandbox, the client can swap emails and phone numbers for placeholders before the model sees them.[10]

The product version is Programmatic Tool Calling: tools with `allowed_callers` are called from Claude-written Python in the code execution environment, keeping intermediate results out of context. On complex research tasks, average usage fell from 43,588 to 27,297 tokens, 37% less.[2]

My take: Code Mode fixes both definition size and result shuttling. But "pick a tool" becomes "search an API in code," and the risk moves: instead of reviewing each call, you run a program the model wrote. Sandboxing, egress control, and credential isolation become prerequisites.

## Fix 4: consolidate at a gateway

Docker MCP Gateway's Dynamic MCP is one concrete shape. Connected clients get management tools: `mcp-find` searches the catalog, `mcp-add` adds a server to the session, plus `mcp-config-set`, `mcp-remove`, `mcp-exec`, and `code-mode`. Added servers last only for the session and are not saved to your profile; you choose the catalog.[22] The feature is experimental, and `code-mode` is not yet reliable.[22]

A gateway suits several of the failures above:

- **Collisions:** prefix names centrally, as the spec recommends for aggregators.[9]
- **Filtering:** list only tools the caller may use, per tools-by-authorization.[9]
- **Poisoning and rug pulls:** Invariant recommends pinning server and tool versions, hashing descriptions, and dataflow boundaries between servers.[11] Doing this once at the gateway beats doing it in every client.

But a gateway is a proxy too. The confused deputy problem in the security best practices targets MCP proxies in front of third-party APIs: static client IDs, dynamic client registration, and consent cookies together can let a malicious client get authorization codes without real user consent.[12]

My take: a gateway's main value is **making the tool inventory maintained configuration**. Letting the model add its own tools via `mcp-add` is handy but lets it size its own attack surface, so I would restrict that to a curated catalog.

## Fix 5: learn to search and select: ToolSearcher

None of the fixes so far touch the model. ToolSearcher asks whether training can make it better at searching and selecting in a large library.[1]

### The setup

Given a user requirement, a large tool repository, and a search engine, the model searches over several turns and outputs a set of tool names; each tool document has a function description, input constraints, and an output schema.[1] Experiments use StableToolBench: 16,464 RapidAPI REST APIs in 49 categories and 500+ collections; 765 test samples needing 2.35 APIs on average (max 6); 14,418 training samples.[1][23] The retriever, Qwen3-Embedding-0.6B, returns 5 documents per turn for up to 8 turns. The prompt demands category.tool.api names taken only from search results, "do not fabricate any."[1]

The motivation: existing search RL methods target knowledge QA, filling in missing facts, and ignore whether tools can be chained.[1]

### Three design choices

**Category-constrained tool discrimination (CCTD).** The search tool gets an optional `category` parameter. For the first 30% of training data (17 of 56 steps), search stays within one category, then goes global. Same-category results are functionally similar, so the model must tell them apart by reading docs rather than polishing queries.[1] It is harder: base Qwen2.5-7B's search recall falls from 0.724 globally to 0.401 under category constraints.[1]

**Event-level search modeling (ESM).** A trajectory is split into search events, and **only the search that first finds a target tool is rewarded**; re-finding earns nothing. An event's advantage is the maximum group-normalized score over the tools it found first. Retrieved tokens are masked from the gradient so the model does not memorize docs.[1]

**Trajectory-aligned credit allocation (TCA).** Trajectories progress differently: some finish, some find every tool but pick wrong, some are still searching. Selection is rewarded only if search found all target tools, and search events for tools the whole group has mastered earn nothing, focusing signal on the unmastered step.[1]

### Results

Main results (StableToolBench, overall F1):[1]

| Backbone | Untrained multi-turn search | Search-R1 | GDPO (runner-up) | ToolSearcher |
| --- | --- | --- | --- | --- |
| Qwen2.5-7B-Instruct | 0.098 | 0.327 | 0.496 | 0.513 |
| Qwen3-4B-Instruct | 0.408 | 0.505 | 0.518 | 0.531 |

Exact match rises from 0.046 to 0.278 on 7B and from 0.169 to 0.316 on 4B.[1] Overall F1 beats the runner-up by only 1.7 points; the gap is in cross-collection multi-tool tasks (I3), where 7B reaches 0.294, ahead of GDPO, MARAG-R1, GSPO, and Search-R1 by 6.6, 8.3, 9.8, and 10.0 points.[1] Single-shot RAG over the top 100 documents scores 0.194 on 7B, 0.441 with fine-tuning.[1]

Most interesting to me is search recall versus final recall. Untrained Qwen2.5-7B surfaces 72.4% of target tools under global search, yet its F1 is 0.098.[1] It finds tools but struggles to understand and choose among them; ToolSearcher slightly lowers its search recall but lifts final recall by 43.08, 39.58, and 21.09 points on I1, I2, and I3.[1]

On out-of-distribution AppWorld (9 apps, 457 APIs; execution by FullCodeRefl on gpt-5-mini), 7B selection F1 is 0.514 (GDPO: 0.483), with average Task Goal Completion 0.334 and Scenario Goal Completion 0.228, both 5.7 points above GDPO. On 4B, TGC 0.372 and SGC 0.257 beat runner-up Search-R1 by 5.8 and 2.9 points.[1]

Ablations (7B, StableToolBench): without CCTD, F1 falls from 0.513 to 0.477; without TCA, 0.461; without ESM, 0.394, with search recall dropping from 0.680 to 0.456 and search rounds from about 4 to 2. Outcome-only rewards make the model search less.[1]

### Limitations, in the authors' own words

- Training data is LLM-synthesized, with mostly parallel rather than sequential tool combinations; AppWorld's APIs are mostly stateful, so gains there are limited.[1]
- Training allows 8 rounds (about 5,000 tokens), while an AppWorld scenario averages more than 8 APIs.[1]
- Training used one node of 8 A100 (80G) GPUs; models top out at 7B.[1]

My take: three things transfer without training. First, **measure "found it" and "picked it" separately**; the 7B base model shows they can diverge widely, and end-to-end success alone points at the wrong bottleneck. Second, give your search tool a category filter; it is nearly free and focuses results. Third, allow only names returned by search, the same idea as tool search returning references the API expands. And note: the best F1 is about 0.53 and exact match about 30%, so large-scale selection is far from solved.

## The five fixes side by side

| Fix | What it mainly saves | Cost | Implementations | New risk |
| --- | --- | --- | --- | --- |
| On-demand loading (tool search) | Definitions of unused tools | One or two extra round trips; depends on good search | Claude API, Claude Code, OpenAI, Spring AI, VS Code[3][7][13][15][16] | Unfound tools are unusable; badly described tools get buried |
| Protocol mechanisms | Repeated fetches and unauthorized tools | Needs server cooperation | MCP 2026-07-28[9][19] | Low |
| Code Mode | Definitions and intermediate results | Requires a sandbox | Cloudflare, Anthropic[4][10][20] | Running model-written code |
| Gateway consolidation | Collisions, overreach, unvetted servers | Another layer to operate | Docker MCP Gateway[22] | The gateway becomes a proxy and single point |
| Learned selection | Wrong and missed picks | Training and data | ToolSearcher[1] | Offline data diverges from real tool libraries |

My take: these combine. A solid stack is a gateway for inventory and permissions, tool search for context, Code Mode for long chains or big data. Learned selection is, for now, an evaluation idea to borrow rather than a component to install.

## Checklist: when you're running N MCP servers

**Inventory**

- [ ] List each server's tool count and definition tokens by footprint; one or two big servers often dominate.[2]
- [ ] Find same or near-same names across servers (`search`, `send_message`) and prefix them with a server ID.[9]
- [ ] Note client limits: 128 tools per request in VS Code, 25,000 output tokens by default in Claude Code.[6][7]

**Loading**

- [ ] Above 10 tools or 10K definition tokens, turn on tool search or deferred loading.[3]
- [ ] Keep only the 3–5 most-used tools loaded; use `alwaysLoad` only for servers needed every turn.[3][7]
- [ ] Write server instructions and namespace descriptions saying what they handle and when to search, key details within 2,048 characters.[7][13]
- [ ] Use users' own words in tool descriptions so search finds them.[3]

**Execution**

- [ ] For three or more dependent calls, or big data where you need only aggregates, use Code Mode or Programmatic Tool Calling.[2][10]
- [ ] With Code Mode: no sandbox egress by default, credentials only in the host, a cap on result size.[20][21]

**Security**

- [ ] Pin server versions, hash descriptions, alert on change.[11]
- [ ] Return tool lists by caller permission so unauthorized tools never reach context.[9]
- [ ] Allow dynamic server addition only from a curated catalog.[22]

**Evaluation**

- [ ] Record separately whether search surfaced the targets and whether the pick was right, like ToolSearcher's SRecall and Recall.[1]
- [ ] After each new server, rerun selection accuracy on a fixed task set, not just token counts.
- [ ] Log which tools were searched and loaded, and refine descriptions from that.[3]

## Counterpoints and limits

- **With few tools, don't bother.** With very few tools, or tools used every turn, extra search round trips don't pay; Anthropic's threshold is 10 tools, Spring AI's guide says 20.[3][15]
- **Vendor numbers come from vendor tests.** 49% to 74%, 85%, and 98.7% come from internal evals or demos; Spring AI's 34% to 64% is, by its authors' note, a rough manual measurement.[2][10][14]
- **ToolSearcher's tool library is not MCP.** StableToolBench is RapidAPI REST APIs and models top out at 7B; the method transfers, not the scores.[1][23]
- **Code Mode trades one risk for another.** Anthropic notes model-written code needs sandboxing, resource limits, and monitoring, overhead direct calls avoid.[10]
- **What this post does not cover.** I found no verifiable primary docs on how Cursor and other clients handle this, or on commercial gateways' filtering, so they are left out.

## Closing

You pay for an MCP server not at hookup but on every later turn: more definitions to pay tokens for, more tools to tell apart, one more text source that can steer the agent. The fixes split into three layers: the gateway decides what the agent can see, tool search what loads this turn, Code Mode where intermediate results live. ToolSearcher adds an evaluation lesson: "found it" and "picked it" are different abilities, measured separately.

Before connecting the next MCP server, ask: how many tokens do its definitions cost, and could any of its tools be confused with existing ones?

## References

1. Zhenlong Dai et al. (Zhejiang University, Ant Group), "ToolSearcher: Optimizing Tool Selection at Scale via Reinforcement Learning," arXiv:2609.30906, 2026-09-25, NeurIPS 2026: <https://arxiv.org/abs/2609.30906>
2. Anthropic Engineering, "Introducing advanced tool use on the Claude Developer Platform," 2025-11-24: <https://www.anthropic.com/engineering/advanced-tool-use>
3. Claude API Docs, "Tool search tool": <https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool>
4. Cloudflare Blog, Matt Carey, "Code Mode: give agents an entire API in 1,000 tokens," 2026-02-20: <https://blog.cloudflare.com/code-mode-mcp/>
5. Cloudflare Agents Docs, "Cloudflare's own MCP servers": <https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/>
6. Visual Studio Code Docs, "Use tools with agents": <https://code.visualstudio.com/docs/agents/run/tools>
7. Claude Code Docs, "Connect Claude Code to tools via MCP": <https://code.claude.com/docs/en/mcp>
8. Tiantian Gan, Qiyao Sun, "RAG-MCP: Mitigating Prompt Bloat in LLM Tool Selection via Retrieval-Augmented Generation," arXiv:2505.03275, 2025-05-06: <https://arxiv.org/abs/2505.03275>
9. Model Context Protocol Specification 2026-07-28, "Tools": <https://modelcontextprotocol.io/specification/2026-07-28/server/tools>
10. Anthropic Engineering, Adam Jones and Conor Kelly, "Code execution with MCP: Building more efficient agents," 2025-11-04: <https://www.anthropic.com/engineering/code-execution-with-mcp>
11. Invariant Labs, "MCP Security Notification: Tool Poisoning Attacks," 2025-04-01: <https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks>
12. Model Context Protocol Specification 2025-11-25, "Security Best Practices": <https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices>
13. OpenAI API Docs, "Tool search": <https://developers.openai.com/api/docs/guides/tools-tool-search>
14. Spring AI Community, "Smart Tool Selection: Achieving 34-64% Token Savings with Spring AI's Dynamic Tool Discovery": <https://springaicommunity.mintlify.app/blog/tools/tool-search>
15. Spring AI Reference, "Dynamic Tool Discovery with Tool Search Tool": <https://docs.spring.io/spring-ai/reference/guides/dynamic-tool-search.html>
16. Visual Studio Code Docs, "AI settings reference" (`github.copilot.chat.virtualTools.threshold`): <https://code.visualstudio.com/docs/agents/reference/ai-settings>
17. microsoft/vscode Issue #258360, "Test: virtual tools and limit behaviors," 2025-07-28: <https://github.com/microsoft/vscode/issues/258360>
18. Xiang Fei, Xiawu Zheng, Hao Feng, "MCP-Zero: Active Tool Discovery for Autonomous LLM Agents," arXiv:2506.01056: <https://arxiv.org/abs/2506.01056>
19. Model Context Protocol Specification 2026-07-28, "Key Changes": <https://modelcontextprotocol.io/specification/2026-07-28/changelog>
20. Cloudflare Blog, Kenton Varda and Sunil Pai, "Code Mode: the better way to use MCP," 2025-09-26: <https://blog.cloudflare.com/code-mode/>
21. Cloudflare Agents Docs, "Build a search and execute MCP server": <https://developers.cloudflare.com/agents/model-context-protocol/guides/build-codemode-openapi-mcp-server/>
22. Docker Docs, "Dynamic MCP": <https://docs.docker.com/ai/mcp-catalog-and-toolkit/dynamic-mcp/>
23. Zhicheng Guo et al., "StableToolBench: Towards Stable Large-Scale Benchmarking on Tool Learning of Large Language Models," arXiv:2403.07714: <https://arxiv.org/abs/2403.07714>

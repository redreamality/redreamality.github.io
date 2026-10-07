---
title: "What Claude Code Sends Off Your Machine: Four Outbound Channels and a Secrets Checklist"
description: "Claude Code runs locally, but every turn ships context to the model, alongside telemetry, error reports, WebFetch, MCP, and whatever Bash reaches. Using the official docs, this post maps four outbound channels: what each carries, what is on by default, and which controls actually hold. It also verifies the 'AGENTS.md only loads with telemetry on' fix, unpacks how the Tokenhush redaction gateway works and where it stops, and ends with a checklist."
pubDate: 2026-10-07T16:45:00+08:00
author: "Remy"
tags: ["claude-code", "security", "ai-agents", "developer-tools"]
lang: "en"
---

Two small items recently reopened an old question: what does Claude Code send off your machine?

One is Tokenhush, a local gateway: point Claude Code's API address at it, and it swaps secrets for placeholders before a request leaves, then swaps them back on the way in.[20] The other is a blog post that sparked a big Hacker News thread on September 23: with telemetry off, Claude Code's new `AGENTS.md` support never loaded, because it sat behind a remote feature flag.[16][17] The HN title now says `[fixed]`; I check below what that means.

Together they expose a commonly blurred distinction: context sent to the model, operational traffic sent to Anthropic, and things the agent sends on its own are different traffic with different switches. Turn telemetry off and your code still goes to the model every turn. Add a redaction gateway and one `curl` in Bash can still walk a file out.

This isn't a news recap. Using the official docs, I go channel by channel: what each carries, what's on by default, which switches exist, and where they stop. Neighboring posts on this site that I won't repeat: [the extension stack](/blog/claude-code-extension-stack-mods-plugins/), [the agent harness pattern](/blog/inside-claude-code-agent-harness/), [PixelLeak](/blog/pixelleak-coding-agents-public-screenshot-egress/), [sandboxing is not enough](/blog/sandboxing-not-enough-rogue-agents-authority/), and [Cowork moving to the cloud](/blog/claude-cowork-cloud-sandbox-where-agents-run/).

Versions and behavior reflect the official docs and CHANGELOG as fetched on October 7 (latest version at the time: 2.1.292).[15] "My take" marks opinion.

## The map: four outbound channels

| Channel | What it carries | Where it goes | Default | Main controls |
| --- | --- | --- | --- | --- |
| 1. Model requests | Prompts, model output, everything in context: instruction files, files read, tool output | Anthropic API, or Bedrock / Vertex / Foundry / your gateway | Always on; it's the product | Account type, Read deny rules, hooks, redaction gateway |
| 2. Operational traffic | Metrics, error reports, feature flags, `/feedback`, surveys, WebFetch domain check, updates | Anthropic and third-party logging | Mostly on for direct Anthropic API | Environment variables |
| 3. Web and MCP | WebFetch URLs, WebSearch queries, MCP tool arguments | Any site, Anthropic search, MCP servers | Prompt or allow by mode | WebFetch domain rules, MCP approval and deny |
| 4. Bash and side effects | Whatever commands touch: `curl`, `git push`, package managers, your OTel export | Any host | Sandbox off | Sandbox allowlist, credential masking, whole-process isolation |

Not egress, but worth remembering: by default Claude Code keeps session transcripts in plaintext under `~/.claude/projects/` for 30 days; `cleanupPeriodDays` adjusts that.[1]

My take: "I turned telemetry off" covers only channel 2. The bulk of the data is in channel 1; the dangerous exfiltration paths are channels 3 and 4.

## Channel 1: model requests, the bulk of it

### What is actually in context

The docs say the data Claude Code sends to the model "includes all user prompts and model outputs," encrypted with TLS 1.2+.[1] "Prompts" undersells it. A turn's request actually contains:

- **Instruction files.** `CLAUDE.md` and `CLAUDE.local.md` from the working directory and its parents load at launch; a subdirectory's `CLAUDE.md` joins when Claude touches a file there; `@path` imports expand too, up to four hops deep.[8]
- **AGENTS.md.** Since v2.1.277, Claude Code reads `AGENTS.md` when there is no `CLAUDE.md`.[8][15]
- **Auto memory.** Each project's `MEMORY.md` index (under `~/.claude/projects/<project>/memory/`) loads every session; memory files skip transcript cleanup and stay until deleted.[8]
- **Files read, and files you `@`-reference.**
- **Tool output.** Bash stdout/stderr and Grep matches go into the next request.

The last is easiest to miss: Claude runs `printenv` or a test that prints its config, and the output is your secret.

Janz sampled GitHub on Dev.to: among active repos (pushed in 90 days, not forks or archived), 6.2% (51/817) have an `AGENTS.md` and 5.4% a `CLAUDE.md`; across all public repos, `AGENTS.md` is at 1.0%.[19] In the comments the author added that about 9.4% of active repos have one or the other.[19] These files **go to the model whole, every session**.

My take: treat anything in `CLAUDE.md`, `AGENTS.md`, or their `@` imports as sent every time. Internal hostnames, test accounts, "the password is in xx" don't belong there.

### Where it goes, how long it stays, and whether it trains models

This depends on account type, and the data usage page is explicit:[1]

- **Training.** Consumer accounts (Free, Pro, Max) choose whether their data improves models; with it on, Claude Code data is used for training. Commercial accounts (Team, Enterprise, API, third-party platforms, Claude Gov) don't have Claude Code code or prompts used to train generative models unless they opt in, e.g. via the Development Partner Program.
- **Retention.** Consumer with training allowed: 5 years; without: 30 days. Commercial: 30 days standard.
- **Zero data retention (ZDR).** Enabled per organization for qualified Claude for Enterprise accounts; covers Claude Code inference, but not Cowork, claude.ai chat, or data processed by third-party integrations such as MCP servers. Sessions flagged for policy violations may still be kept up to 2 years.[12]

ZDR covers only requests authenticated into the ZDR organization, so lock sign-in with the `forceLoginMethod` and `forceLoginOrgUUID` managed settings.[12] On Bedrock, Vertex, or Foundry, each platform's policy applies.[1][12]

### Control 1: don't let it read the file

The most direct switch is a Read rule in `permissions.deny`: matching files are excluded from discovery and search, reads are denied, and Edit and Write are blocked.[5] Traps:

1. **`.claudeignore` does nothing.** The docs say so outright; move its entries into Read deny rules.[4]
2. **Rules cover only reads they recognize.** They apply to built-in file tools, Bash file commands Claude Code recognizes (`cat`, `head`, `tail`, `sed`, `tee`), and `>`/`<` redirection targets, but not to `grep -r pattern .` or a Python or Node script that opens files itself. For OS-level enforcement, enable the sandbox.[4][5]
3. **Path syntax matters.** `Read(.env)` is equivalent to `Read(**/.env)` and covers only the current directory and below; to cover the whole filesystem write `Read(//**/.env)`. In user settings, `Read(/secrets/**)` means `~/.claude/secrets/**`.[4]
4. **Symlinks.** A symlink pointing to a denied file is denied too.[4] Instruction files used to be an exception: 2.1.290 fixed a project `CLAUDE.md` or `AGENTS.md` symlinked outside the working directories still loading under a Read deny rule.[15]

A blunter switch, `permissions.blockReadsOutsideWorkingDirectories` (v2.1.257+), refuses Read, Grep, Glob, and LSP calls outside your working directories in every mode, including `bypassPermissions`; it doesn't refuse shell commands the same way.[5]

### Control 2: even if it reads it, don't send it

Hooks can step in at two points.

**Before: `PreToolUse`.** It runs after Claude builds tool parameters and before execution, returning allow, deny, ask, or defer; exit code 2 blocks the call.[6] But the docs warn that `@`-referenced files are inserted while the prompt is built, with no tool call, so **no PreToolUse hook fires**, even one matching `Read`. Only a Read deny rule blocks `@` references.[6]

**After: `PostToolUse` with `updatedToolOutput`.** It replaces a tool's output before Claude sees it; the docs' example swaps Bash stdout for `[redacted]`.[6] It's the closest built-in thing to egress redaction, but side effects have already happened, OpenTelemetry tool spans record the original output first, and a replacement that doesn't match a built-in tool's output shape is ignored.[6]

**What you paste: `UserPromptSubmit`.** It runs before a prompt reaches Claude and can return `decision: "block"`, a natural place to scan pastes for keys. But a blocked prompt is written to the on-disk transcript by default, and `suppressOriginalPrompt` only changes the block message; the docs say a blocking hook "isn't a way to keep a secret off disk."[6]

My take: hooks suit judgments rules can't express, such as content scanning. But a hook is a callback inside the harness, not a boundary.

### Control 3: replace at the exit, the Tokenhush approach

If you can't predict which turn will carry a secret, you can ignore how context was assembled and scan every request as it leaves. That's Tokenhush. The following sticks to what its README and docs state.[20][21][22]

**Setup.** A loopback-only HTTP gateway, `127.0.0.1:8787` by default. For Claude Code, `eval "$(tokenhush env claude)"` amounts to `ANTHROPIC_BASE_URL=http://127.0.0.1:8787`.[20][22] No root certificate, no man-in-the-middle.

**Replacing.** It walks the whole outbound JSON body, nested objects and arrays included, and swaps each detector match for a `__PII_<type>_<digest>__` placeholder before forwarding. Five detectors are on by default: `prefix` (known key prefixes such as `sk-`, `AKIA`, `ghp_`, `glpat-`, `xox*`, `AIza`, `npm_`), `jwt`, `pem` (private-key headers), `luhn` (card numbers that pass the Luhn check), and `email`. A sixth, `entropy`, is off by default; the README says its false positives on real agent traffic broke function calling.[20]

**Restoring.** Responses, SSE included, are buffered whole, then this session's placeholders are swapped back for the client, so there's no token-by-token streaming. The mapping lives only in memory. It **never fills placeholders back in outbound**, so a prompt injection can't make the gateway echo a secret to the model.[20]

**Stated limits.** No detection of base64-, hex-, or URL-encoded secrets or of secrets in JSON keys; no redaction on the response path; no coverage for clients that ignore a custom base URL (the README names the Claude desktop app and browser web UIs).[20][21] Auth headers pass through untouched; a detector failure refuses the request; Tokenhush itself only contacts `updates.tokenhush.com` for update checks and rule sync, both switchable off.[20]

Cross-checked against Claude Code's docs:

- With `ANTHROPIC_BASE_URL` on a non-Anthropic host, MCP tool search is off by default and Remote Control is unavailable.[3]
- Setting only `ANTHROPIC_BASE_URL`, with no gateway credential, still routes through the gateway, but a saved claude.ai subscription login stays the active credential, and a gateway forwarding to Anthropic must pass the OAuth capability in `anthropic-beta`.[13] Tokenhush forwards auth headers untouched, but I haven't tested a subscription login end to end, and its docs don't say.
- It only sees channel 1. The WebFetch domain check, telemetry, MCP servers, and `curl` in Bash bypass it.

The repo was created September 11, had single-digit stars at fetch time, and hasn't published overhead numbers.[20]

My take: egress redaction handles secrets slipping into context by accident, provided they look like secrets. It doesn't handle an agent actively sending a file elsewhere; that's channel 4.

## Channel 2: telemetry, error reports, and other operational traffic

The docs call this operational telemetry, in two kinds:[1]

- **Usage metrics**: latency, reliability, usage patterns; they "never include your code, prompts, or file paths." `DISABLE_TELEMETRY=1` turns them off.
- **Error reports**: internal errors and stack traces, with known secret patterns, file paths, and emails redacted; on only for Pro/Max sign-ins on v2.1.198+, direct to the Claude API, without a ZDR or HIPAA agreement. `DISABLE_ERROR_REPORTING=1` turns them off.

Both go to Datadog intake hosts, and only on direct Anthropic API connections.[2]

What actually carries code requires you to act:[1]

- **`/feedback`** (and `/bug`, `/share`) sends the conversation, code included, retained 5 years, optionally creating a public GitHub issue. `DISABLE_FEEDBACK_COMMAND=1` turns it off.
- **Session surveys** record only the rating; saying "Yes" to the transcript follow-up uploads the conversation, subagent transcripts, and raw session log, with key patterns redacted but code and file contents as-is, retained up to 6 months.

Less visible:

- **Feature-flag fetches** from `api.anthropic.com`, which turn many features on.[2][3]
- **The WebFetch domain safety check** sends the hostname (not the full URL) to `api.anthropic.com` before each fetch, **whatever your model provider**.[1]
- **claude.ai MCP connectors** route through `mcp-proxy.anthropic.com`, on by default for claude.ai users.[2]

### One master switch, and what it misses

`CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` turns off auto-updates, telemetry, error reporting, `/feedback`, release notes, PR badge checks, and availability checks at once.[3] Two details:

1. **`0` or `false` still means off.** As with `DISABLE_TELEMETRY` and `DISABLE_ERROR_REPORTING`, any non-empty value counts; unset it to restore traffic. `DO_NOT_TRACK`, by contrast, is a normal boolean.[3]
2. **It misses the WebFetch domain check and official marketplace auto-install.** Those need `skipWebFetchPreflight: true` (WebFetch then skips the blocklist) and `CLAUDE_CODE_DISABLE_OFFICIAL_MARKETPLACE_AUTOINSTALL`.[1][3] claude.ai connectors need `ENABLE_CLAUDEAI_MCP_SERVERS=false` or `disableClaudeAiConnectors`.[2]

On Bedrock, Vertex, Foundry, or Claude Platform on AWS, metrics, error reports, and `/feedback` are off by default; surveys and the WebFetch check still run.[1]

### The AGENTS.md episode: turning off telemetry turned off more than telemetry

In the 2.1.280 bundle, the author found the `AGENTS.md` loader: a built-in plugin, off by default, gated on a remote flag, `tengu_agents_md_mod`, that fell back to `false` when unreachable.[16] He measured that with either `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1` or `DISABLE_TELEMETRY=1`, `AGENTS.md` never loaded; `0` didn't help; clearing them in project `.claude/settings.json` didn't help; nothing warned you.[16] The workaround: a one-line `CLAUDE.md` with `@AGENTS.md`, since imports don't depend on the flag.[16]

What "fixed" verifiably means:

- The post hit HN at 20:15 Beijing time on September 23, and its title now carries `[fixed]`.[17]
- About 40 minutes later, a commenter who said the feature was theirs called it a rollout artifact: they wanted a remote kill switch, and with telemetry off you don't get flags; the fix would ship in v2.1.281 that day. Another said `claude update` still offered only 2.1.280 then.[17]
- The CHANGELOG entry for 2.1.281 says AGENTS.md support was changed to also work on Bedrock, Vertex AI, Foundry, LLM gateways, and **sessions with telemetry disabled**.[15] The memory docs now state that "before v2.1.281, some sessions, such as those on Amazon Bedrock or with telemetry disabled, read `CLAUDE.md` files only."[8]
- But the corresponding GitHub issue, #95690, was still open when I fetched it, and the blog post body has no update noting a fix.[18][16]

So the accurate statement is: per the official CHANGELOG and docs, the problem was fixed in 2.1.281; the issue itself remains open. The docs' list of "features that need feature-flag fetching" no longer includes AGENTS.md either.[3]

My take: the lesson isn't the bug but what the docs now spell out: `DISABLE_TELEMETRY` and `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` also turn off feature-flag fetching.[1][3] Then Remote Control, `/import`, marking large pastes as pasted, and more stop working; the docs list over a dozen.[3] There's no documented way to drop usage metrics but keep flags; `DISABLE_ERROR_REPORTING` doesn't touch flags, so it can go on its own.[1] Privacy and feature switches are coupled; recheck that list after upgrades.

## Channel 3: WebFetch, WebSearch, and MCP

**WebFetch** requests the target site with a `User-Agent` starting `Claude-User`, then usually runs a separate model call over the page, so Claude gets that call's answer, not the raw page; web content flows through model requests too.[10] Controls: `WebFetch(domain:...)` allow, ask, and deny rules; a prompt on every fetch in Manual and `acceptEdits` modes (except domains your rules cover and built-in doc domains); and, since v2.1.285, `CLAUDE_CODE_DISABLE_WEB_FETCH=1`.[10] Sandbox allowlists don't affect WebFetch; it follows only its own rules.[7][10]

**WebSearch** sends queries to Anthropic's search backend, which isn't configurable; its permission rules take only the bare `WebSearch` form.[10]

My take: the WebFetch URL is itself an outbound channel; its path and query can carry anything. For sensitive repos, "ask" beats "allow every domain."

**MCP**'s problem is scattered sources. Project servers live in `.mcp.json`; other scopes, claude.ai connectors, and plugin-added servers don't, so reviewing `.mcp.json` misses some.[11] Anthropic reviews directory connectors against listing criteria but doesn't security-audit any MCP server.[11] Tool arguments go to the server, and ZDR doesn't cover third-party integrations.[12]

Available switches: the deny rule `"mcp__*"` disables every MCP tool;[4] `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` strips credentials from the environments of subprocesses such as stdio MCP servers, Bash, and hooks.[3] Local MCP servers run outside the sandbox with your full access.[7]

## Channel 4: Bash, git push, and other side effects

The first three channels go through Claude Code's tools. Bash runs any program, and programs connect wherever they like.

**Deny rules are not a boundary.** `Bash(curl *)` matches only the command form Claude writes; it doesn't stop `/usr/bin/curl` or `sh -c 'curl …'`. The docs' advice: when the restriction must hold, pair it with the sandbox network allowlist.[4][5]

**The sandbox is off by default.** Enable it with `/sandbox` or `sandbox.enabled: true`. Then commands have no direct route out; connections go through a local proxy that admits hosts by an allowlist that starts empty, and tools ignoring proxy variables (plain `ssh`) or using UDP or ICMP can't connect.[7] `sandbox.network.strictAllowlist: true` refuses unlisted hosts instead of prompting; only user or managed settings can set it.[5][7]

Several sandbox defaults need attention:[7]

- **Reads are broad by default**, including `~/.ssh` and `~/.aws/credentials`; tighten them with `filesystem.denyRead` or `sandbox.credentials`.
- **Environment variables are inherited by default**, so secrets in Claude Code's environment reach sandboxed commands.
- **There is no built-in credential deny list**; if you don't list it, it isn't restricted.

`sandbox.credentials` entries use `deny` (files unreadable, variables unset before each command) or `mask`, which works like Tokenhush in reverse: sandboxed commands see a per-session placeholder, and the proxy swaps in the real value only for hosts you allow. It needs the experimental `network.tlsTerminate`, and `mask` and `tlsTerminate` are honored only from user settings, managed settings, and `--settings`, never from a repo's `.claude/settings.json`.[7]

**Outside the sandbox.** Built-in tools like Read, Edit, and WebFetch follow permission rules instead; hooks, local MCP servers, LSP servers, and the status-line command run with full access; and in most sessions, commands you type at `!`, `excludedCommands`, and unsandboxed retries run outside too.[7] The docs also warn that broad domains like `github.com` can become exfiltration paths: the proxy trusts the client-supplied hostname without inspecting TLS, so sandboxed code could use domain fronting (hiding the real target behind a legitimate domain) to slip past.[7]

To put all of that behind one boundary, the docs point to running the whole Claude Code process in a container, a VM, or the sandbox runtime.[7][11] The official reference dev container includes an `init-firewall.sh` that limits outbound destinations; when you use `--dangerously-skip-permissions` in the container, the docs advise pairing it with those egress restrictions.[14]

**`git push` and other irreversible actions**: put them in `permissions.ask`, e.g. `Bash(git push *)`, which prompts even in `acceptEdits` or `bypassPermissions`.[5] [PixelLeak](/blog/pixelleak-coding-agents-public-screenshot-egress/) showed agents opening shared outbound paths on their own to finish a task; model restraint isn't enough.

**Your own OTel export** is egress too. Prompts, tool arguments, tool output, and raw API bodies are off by default, gated by `OTEL_LOG_USER_PROMPTS`, `OTEL_LOG_TOOL_DETAILS`, `OTEL_LOG_TOOL_CONTENT`, and `OTEL_LOG_RAW_API_BODIES`.[9] Project and local settings can only turn these exports off, not on or elsewhere, and trying triggers a startup notice (v2.1.282+ for the OTel group).[5][15] My take: this guards against "clone a repo and your session content gets exported to someone else's collector."

## Checklist

Every key in this `~/.claude/settings.json` snippet comes from the official docs' examples or reference.[3][4][5][7] It belongs in user settings because repos can't set keys like `strictAllowlist` or `mask`, or some environment variables.[5][7] Swap in your real allowlist.

```json
{
  "env": {
    "DISABLE_ERROR_REPORTING": "1",
    "DISABLE_FEEDBACK_COMMAND": "1",
    "CLAUDE_CODE_SUBPROCESS_ENV_SCRUB": "1"
  },
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Bash(curl *)"
    ],
    "ask": ["Bash(git push *)"]
  },
  "sandbox": {
    "enabled": true,
    "network": {
      "allowedDomains": ["github.com", "*.npmjs.org"],
      "strictAllowlist": true
    },
    "credentials": {
      "files": [
        { "path": "~/.aws/credentials", "mode": "deny" },
        { "path": "~/.ssh", "mode": "deny" }
      ],
      "envVars": [
        { "name": "GITHUB_TOKEN", "mode": "deny" },
        { "name": "NPM_TOKEN", "mode": "deny" }
      ]
    }
  }
}
```

Add `DISABLE_TELEMETRY` or `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` only if you can live without flag-gated features. `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` deliberately keeps `GITHUB_TOKEN`, hence the separate sandbox deny.[3]

Channel by channel:

**Model requests**
- [ ] Right account type? Company code on a commercial account or a personal subscription, and what's that subscription's training setting?[1]
- [ ] Needing ZDR, is sign-in locked to the ZDR organization?[12]
- [ ] Anything in `CLAUDE.md`, `AGENTS.md`, their imports, or `MEMORY.md` that shouldn't leave?[8]
- [ ] `.claudeignore` replaced with Read deny rules?[4]
- [ ] Commands that print config leaking secrets into tool output? Use PostToolUse if needed.[6]
- [ ] Using a redaction gateway, is it clear it covers only model requests?[20]

**Operational traffic**
- [ ] Error reports, `/feedback`, surveys off as needed, knowing `0` also means off?[1][3]
- [ ] claude.ai connectors off if unused?[2]

**Web and MCP**
- [ ] WebFetch: per-fetch prompt, per-domain allow, or `domain:*`?[10]
- [ ] Which MCP servers can a session load beyond `.mcp.json`?[11]

**Bash and side effects**
- [ ] Sandbox on? Broad domains like `github.com` in the allowlist?[7]
- [ ] Where whole-process isolation is needed, a firewalled dev container?[14]
- [ ] Local transcript retention acceptable?[1]

## Limits and what I couldn't verify

- **All of this is vendor docs.** They describe intended behavior, and the CHANGELOG shows telemetry fixes, e.g. 2.1.290 stopping background commands and daemon workers from sending telemetry and a flag request to Anthropic behind a Claude apps gateway when no managed settings force gateway login.[15] Teams with hard egress requirements should verify against their own egress logs.
- **I read Tokenhush's docs and code layout but didn't test it end to end**, notably with a subscription login. It's new; verify with the echo-upstream recipe in its README first.[20]
- **The AGENTS.md fix status** rests on the CHANGELOG and docs; the issue is open, and I didn't track regressions.[15][18]
- **Cloud sessions and Remote Control** differ (Remote Control stores the transcript on Anthropic servers while connected)[1] and aren't covered here.

## Closing

Claude Code's outbound switches are granular, but they belong to different channels: telemetry switches cover operational traffic, Read rules cover built-in tools, hooks cover points in the harness, the sandbox covers shell subprocesses, a gateway covers model requests. None backstops everything.

My take: decide what you're defending against first. Accidental secrets in context: Read rules plus egress redaction. An injected agent exfiltrating: sandbox allowlist plus whole-process isolation. Vendor-side retention: the right account type. Handling them separately beats flipping every switch at once.

## References

1. Anthropic, Claude Code Docs, "Data usage": <https://code.claude.com/docs/en/data-usage>
2. Anthropic, Claude Code Docs, "Network configuration": <https://code.claude.com/docs/en/network-config>
3. Anthropic, Claude Code Docs, "Environment variables": <https://code.claude.com/docs/en/env-vars>
4. Anthropic, Claude Code Docs, "Configure permissions": <https://code.claude.com/docs/en/permissions>
5. Anthropic, Claude Code Docs, "All settings" (settings reference): <https://code.claude.com/docs/en/settings-reference>
6. Anthropic, Claude Code Docs, "Hooks reference": <https://code.claude.com/docs/en/hooks>
7. Anthropic, Claude Code Docs, "Configure the sandboxed Bash tool": <https://code.claude.com/docs/en/sandboxing>
8. Anthropic, Claude Code Docs, "How Claude remembers your project": <https://code.claude.com/docs/en/memory>
9. Anthropic, Claude Code Docs, "Monitoring": <https://code.claude.com/docs/en/monitoring-usage>
10. Anthropic, Claude Code Docs, "Tools reference": <https://code.claude.com/docs/en/tools-reference>
11. Anthropic, Claude Code Docs, "Security": <https://code.claude.com/docs/en/security>
12. Anthropic, Claude Code Docs, "Zero data retention": <https://code.claude.com/docs/en/zero-data-retention>
13. Anthropic, Claude Code Docs, "Other LLM gateways": <https://code.claude.com/docs/en/llm-gateway>
14. Anthropic, Claude Code Docs, "Development containers": <https://code.claude.com/docs/en/devcontainer>
15. Anthropic, Claude Code `CHANGELOG.md` (latest 2.1.292 at time of fetch): <https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md>
16. szypowi.cz, "Claude Code reads AGENTS.md only when telemetry is on," 2026-09-23: <https://blog.szypowi.cz/p/claude-code-reads-agents.md-only-when-telemetry-is-on/>
17. Hacker News discussion, "Claude Code reads AGENTS.md only when telemetry is on [fixed]," 2026-09-23: <https://news.ycombinator.com/item?id=49814947>
18. GitHub, anthropics/claude-code issue #95690, "Claude Code's AGENTS.md Support: A Local Feature Locked Behind a Remote Switch": <https://github.com/anthropics/claude-code/issues/95690>
19. Janz, DEV Community, "How common is AGENTS.md, really? I sampled GitHub: 6.2% of active repos, 1.0% of all repos," 2026-09-19: <https://dev.to/janzong/how-common-is-agentsmd-really-i-sampled-github-62-of-active-repos-10-of-all-repos-1175>
20. fregie/tokenhush, README: <https://github.com/fregie/tokenhush>
21. fregie/tokenhush, `docs/security.md`: <https://github.com/fregie/tokenhush/blob/main/docs/security.md>
22. fregie/tokenhush, `docs/tool-setup.md`: <https://github.com/fregie/tokenhush/blob/main/docs/tool-setup.md>

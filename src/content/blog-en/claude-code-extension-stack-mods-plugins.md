---
title: "Claude Code Extensions Mapped: CLAUDE.md to Mods, What to Add First"
description: "How the Claude Code extension stack fits together in 2026, from CLAUDE.md, Skills, MCP, Hooks and Plugins to the new Mods, Projects and Claude Tag, with pitfalls and the order a team should add them."
pubDate: 2026-10-07T10:45:00+08:00
author: "Remy"
tags: ["claude-code", "agent-harness", "mcp", "ai-agents", "developer-tools"]
lang: "en"
---

A year ago, customizing Claude Code meant a `CLAUDE.md` and a few slash commands. By October 2026 the official extension list is long: CLAUDE.md and `.claude/rules/`, auto memory, output styles, Skills, MCP, Subagents, dynamic workflows, Hooks, Plugins and marketplaces, and Mods, released October 1 [2][3]. It no longer runs only in your terminal either: Projects splits work into parallel cloud sessions [21], and Claude Tag puts Claude into a team's Slack channels [23].

On September 29, Latent Space published a long interview with Thariq Shihipar of the Claude Code team, "Claude Code's Next Era," covering Mods, Plugins, Projects and Tag, plus ideas like "the agent rewrites its own harness" and "brain in the cloud, hands on your machine" [1]. Instead of recapping news, this post maps each extension to its agent-loop stage, what it solves, how pieces combine, where they bite, and the order to add them.

Related posts on this site: [Inside the Claude Code agent harness](/blog/inside-claude-code-agent-harness/) covers the five layers of the core loop; this post covers what hangs off it. [The 2026 Agent Skills survey](/blog/agent-skills-2026-survey-lifecycle-map/) covers the skill lifecycle, so here I only place Skills in the system. [The CLAUDE.md/AGENTS.md deep dive](/blog/claude-md-agents-md-deep-dive/) covers writing instruction files, and [the Cowork post](/blog/claude-cowork-cloud-sandbox-where-agents-run/) covers where an agent's "hands" live.

Facts are sourced and numbered; paragraphs marked "Judgment" are my opinion.

## Start with a map: where extensions plug into the agent loop

The official "Extend Claude Code" page opens by saying extensions plug into different parts of the agentic loop [3]. Laid out over a session:

| Stage | Extensions | What they do |
| --- | --- | --- |
| Session start | CLAUDE.md, `.claude/rules/`, AGENTS.md, auto memory, output style; `SessionStart` hook | Text or an index enters context and rides with every request [3][15] |
| Before each request | Skill names and descriptions, MCP tool names (schemas deferred); mod `prompt.compose`, `turn.step` | Tell the model what's available; mods can rewrite prompt sections and switch model and effort [3][7] |
| Prompt submitted | `UserPromptSubmit` hook; mod `prompt.submit` | Intercept or rewrite input [7][19] |
| Before a tool call | Permission rules and mode; `PreToolUse` hook; mod `tool.call`, `tool.check` | Decide whether the call runs and with what arguments [6][19] |
| Tool execution | MCP servers, LSP, a plugin's `bin/` | "Hands" beyond built-in tools [11][17] |
| After a tool call | `PostToolUse` hook | Feed results like lint output back [3] |
| Side tasks | Subagents, dynamic workflows | Separate context, summary only [3][18] |
| Turn end, compaction, session end | `Stop`, `PreCompact`, `SessionEnd` hooks; mod `turn.complete`, `session.compact` | Wrap up, check, log [7][19] |
| Interface | Mods only | Draw panels, redraw built-in UI [4] |
| Distribution | Plugins, marketplaces | Bundle all of the above [10] |

Also note **which machine this runs on**: terminal, cloud sessions, Projects threads and Tag sandboxes load different extensions (more below).

The docs also list context costs: CLAUDE.md sends full text with every request; a skill normally sends only its description; MCP tool search is on by default, so idle tools cost almost nothing; a subagent has its own window; a hook costs nothing unless it returns output [3].

## Layer by layer

### CLAUDE.md, rules and auto memory: always along for the ride

CLAUDE.md holds standing instructions, loaded at the start of every session [15]. The docs suggest under 200 lines per file, since longer files eat context and are followed less reliably. Rules that matter only for some directories belong in `.claude/rules/` with `paths`, loading only when matching files are touched [3][15]. If a repo has `AGENTS.md` but no `CLAUDE.md`, Claude Code v2.1.277+ reads `AGENTS.md` directly [15]; that feature is itself a built-in mod, `cc-plugin-agents-md` in `/plugin` [4].

Auto memory is separate: Claude writes it under `~/.claude/projects/<project>/memory/`, with `MEMORY.md` as the index; each session loads its first 200 lines or 25KB. Notes are typed `user`, `feedback`, `project` or `reference` [15].

Two reminders: both are context, not enforcement, so use a `PreToolUse` hook for must-nevers [15]; and project-root and user-level CLAUDE.md files are read once at start, so mid-session edits wait for `/clear`, `/compact` or a restart [20].

Thariq goes further than the docs. He says CLAUDE.md will eventually disappear and new projects can start without one, adding entries when a failure recurs. The catch is that failure modes shift between models, and an ever-growing failure list can over-constrain the next one [1]. The docs' "when to add what" table also starts with "Claude gets a convention or command wrong twice" [3].

**Judgment**: treat CLAUDE.md as a regression log tagged by model version. Each rule should name the failure it fixes; when the base model changes, delete a few and rerun. That's the "rule of two" from the [deep dive](/blog/claude-md-agents-md-deep-dive/) plus regular pruning.

### Skills and slash commands: manuals on demand

Custom commands are now merged into skills: `.claude/commands/deploy.md` and `.claude/skills/deploy/SKILL.md` both create `/deploy` and behave the same [16]. Slash commands are a way to use skills, not a separate extension.

A skill's role is knowledge and procedure on demand: the description stays resident, the body loads when used [3]. Fields that touch other layers:

- `disable-model-invocation: true`: manual `/name` only, and the description stays out of context. Recommended for side effects like deploys or messages [3][16].
- `context: fork`: runs in a subagent, combining the two [16].
- `model`: switches the model for that turn, which the caching docs count as a model switch: the next request rereads history without cache [20].
- `description` plus `when_to_use` is truncated to 1,536 characters in the listing [16].

Thariq notes Claude sometimes "forgets" its skills partway through a session [1], a gap Mods aim to fill. For writing and validating skills, see the [survey](/blog/agent-skills-2026-survey-lifecycle-map/).

### MCP: reaching external systems

MCP decides which external systems Claude can reach. In the docs' framing, MCP supplies tools and data and a skill supplies the know-how; they pair well, e.g. MCP connects the database and a skill documents schema and query habits [3].

Three scopes: local (default; you, this project, stored in `~/.claude.json`), project (`.mcp.json` at the repo root, shared via version control), and user (all your projects) [17]. HTTP transport is recommended for remote servers:

```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

Tool search is on by default: only tool names load at start, schemas on use [3]. The MCP page warns early on: trust a server before connecting, and servers that fetch external content can expose you to prompt injection [17].

### Subagents and dynamic workflows: isolating noise

A subagent works in its own context window and returns only a summary, suiting tasks like reading many files or running many searches [3]. Frontmatter can restrict `tools`, set `model`, preload `skills`, set `isolation: worktree` (a temporary git worktree), enable `memory` (persistent across sessions), and more [18]. For jobs too big for a few subagents, or needing cross-checks, the docs suggest dynamic workflows, where Claude writes a script orchestrating many subagents [3].

On security: since v2.1.210 Claude Code scans subagent reports, escaping text that imitates `<system-reminder>` tags or starts with `Human:`, and flagging reports that mention settings like `bypassPermissions`. It doesn't judge malice and doesn't replace limiting a subagent's reach [18].

### Hooks: what must happen every time

Hooks are the only deterministic layer. On more than thirty lifecycle events (`SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, `PreCompact`, `SessionEnd`, and others) they run a shell command, HTTP request, MCP tool, single-turn prompt, or experimental agent check [19]. As the docs put it, "don't edit `.env`" in CLAUDE.md is a request; a `PreToolUse` hook blocking it is enforcement [3].

The official example checks the path in a script and blocks with `exit 2`, registered like this [19]:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-files.sh"
          }
        ]
      }
    ]
  }
}
```

Two boundaries. A `PreToolUse` deny works in every permission mode, including `bypassPermissions`, while settings hooks can only tighten, never loosen past permission rules [19]. And hooks on one event run in parallel; if several rewrite the same tool input, the last to finish wins, nondeterministically [19].

### Plugins and marketplaces: packaging

A plugin is a directory with a `.claude-plugin/plugin.json` manifest holding skills, agents, hooks, MCP servers, and mod hook modules [10]. Plugin skills are namespaced, like `/my-plugin:review`, so plugins coexist [3]. A marketplace is a directory or repo with `.claude-plugin/marketplace.json`: a catalog, not a hosted store [10].

Easy to miss:

- An enabled plugin counts in **every** session: the names and descriptions of its auto-invocable skills, agents and commands are in context each turn, used or not [10].
- Marketplaces have three tiers: official, community, third-party. Official and community names are accepted only from `github.com/anthropics/` repos, and impostors are rejected; nearly every community entry is pinned to a commit SHA [11].
- With auto-update on, files you reviewed can change in the background [11].
- Plugin agent definitions ignore `permissionMode`, `hooks` and `mcpServers`; declare those at plugin level [12].

For quality, `claude plugin eval` runs each case with and without the plugin; the difference Δ is its contribution, and if both score 1.0 the plugin didn't make it pass [13]. Thariq says the team just added eval plugins for skills [1]. For distribution, on September 25 Anthropic opened a directory submission portal where paid-plan developers submit a remote MCP connector or a GitHub-hosted plugin bundle, with automatic validation and a safety scan [14].

### Mods: rewriting the harness itself

Mods shipped October 1 [2]. Officially, a mod is a plugin of JavaScript or TypeScript event handlers that Claude Code calls on events such as tool calls, prompt submission or UI rendering; it can watch, rewrite, or take over the event [4]. It needs CLI v2.1.287+ and is on by default [4].

Unlike settings hooks, a mod runs **inside** the Claude Code process, so it can [4]:

- Draw its own UI: a panel beside the transcript or a strip above the input, with buttons and fields.
- Redraw built-in UI: the tool-call line, spinner, question dialog.
- Step into calls and requests: hold a call to ask the user, return a result without running the tool, send a request to another model.
- Register a `/command` that runs instantly, without a Claude turn.
- Share variables across hooks in one mod file.

Coverage is broad. Beyond `tool.call`, `tool.check` and `prompt.submit` there are `prompt.compose` and `prompt.section` for the system prompt, `turn.step` to switch `model` and `effort` per request, `agent.spawn` to pick a model or refuse before a subagent starts, and `session.compact` to skip compaction; every settings hook event maps to `classic.<Event>` [7]. The official force-push guard [6]:

```javascript
on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
  if (/git push .*--force/.test(e.command)) {
    return { deny: 'Force pushes are not allowed in this repository. Push to a new branch instead.' }
  }
  return next(e)
})
```

Mods on the same event form a middleware chain; the first loaded is outermost, seeing the event first and the result last [2][6]. Source sets the order: the built-in guard `sec-default@builtin` and org `prependPlugins` first, then user mods, then `appendPlugins`, then other built-ins [6].

Some built-ins are already mods, like `/diff`, which you can disable or replace; more will follow, so users can strip Claude Code to a small core and add back what they want [2].

The following comes only from the interview, with no matching docs. Thariq says mods were internally called "function hooks" and were designed by people from the Bun and Claude Code teams. His own mods in progress include one that, after a turn, uses a forked agent (cheap because it reuses the prompt cache) to check whether the task is done and quiz you; an assumption-registering tool; a model router; and a mode selector that lets plugins register as switchable modes [1]. The API does have `$.model.fork`, documented as asking a question on the current conversation, mostly from the prompt cache [9].

The official comparison [4]:

| | Mod | Settings hook | Skill | MCP server |
| --- | --- | --- | --- | --- |
| What | Plugin functions inside the Claude Code process | Command, HTTP request or prompt on lifecycle events | A `SKILL.md` of instructions | External process or service providing tools |
| Changes | Tool calls, prompts, commands, turns, UI | Allow or block, tool input and output, extra context | What Claude knows and does | Which tools Claude has |
| Draws UI | Yes | No | No | No |
| Choose when | You need panels, event rewrites, custom commands | Existing scripts should block, allow or log | You keep pasting the same instructions | You need an external system |

## Interview ideas, placed on the map

### "The agent rewrites its own harness"

Facts first. You can ask Claude to write a mod: using the built-in `plugin-authoring` skill, it writes to `~/.claude/dev-mods/<session ID>/`. On the first save, Claude Code asks whether to enable hot reload for the session; if you agree, mods reload at the end of each turn that changed them [5]. In `default` and `acceptEdits` modes, `~/.claude` is protected, so each file needs approval [5]. Claude-written mods don't load where nobody can approve (`claude -p`, `dontAsk`), in untrusted workspaces, with `--safe-mode`, or when the org disables them [5].

Thariq says harnesses date fast, in unintuitive directions: chat to agents was one shift, models changing their own harness is another, a new way to spend extra intelligence [1]. Yet the core harness must grow more complex and secure, with sandboxing, auto mode for permissions, computer use and MCP, web search and fetch; what changes is how you interact with it [1].

**Judgment**: together, these say the harness is splitting in two. The core (loop, permissions, sandbox, classifiers, built-in tools) stays with Anthropic and gets heavier. The shell (UI, reminders, routing, orchestration) becomes rewritable, what Thariq calls an early form of "mutable software" [1]. Today's version is human-approved code generation, gated by approvals, trust and org policy, far from an agent evolving its harness alone. To the question the [RSI survey](/blog/rsi-recursive-self-improvement-survey-2026/) keeps asking, "what changes, and who signs off," the answer here is: the shell changes, a human signs off.

### "Brain in the cloud, hands on your machine"

Thariq splits Claude Code into three parts: a presentation surface (a hosted artifact with its own database), inference in the cloud, and "hands" on your machine or in a remote sandbox. He says Claude Tag already works this way and local hands will come later [1].

The docs show this taking shape. In Projects, threads are cloud sessions by default; when one needs your machine, "Work locally" runs it in a local folder through Remote Control, in auto mode, pausing while the computer sleeps [21]. Each Claude Tag Slack thread runs in an ephemeral sandbox on the same engine as Claude Code on the web, using admin-configured per-channel service accounts, not the asker's identity [24].

The practical consequence: **local configuration doesn't necessarily travel**. A cloud session starts from a fresh clone. The repo's `CLAUDE.md`, `.claude/rules/`, `.claude/skills/` and `.claude/agents/` are there; your `~/.claude/CLAUDE.md`, user-level skills, plugins enabled only in user settings, and MCP servers added at the default local scope are not, and plugins declared in the repo's `.claude/settings.json` aren't installed [22]. Projects plugins are added in project settings, and MCP tools come from your claude.ai connectors [21]. Mod hooks run in cloud sessions if the plugin reaches them, but their UI isn't shown [4].

**Judgment**: for customizations that work everywhere, commit them to the repo, not `~/.claude`. On where "hands" belong, see the [Cowork post](/blog/claude-cowork-cloud-sandbox-where-agents-run/).

### "Tag is an organizational harness"

Borrowing Karpathy's phrase, Thariq calls Claude Tag an "organizational harness," best for inherently multi-person work like on-call, incidents and legal questions [1]. He is blunt about risk: a suggestions page feeds a Slack hook, someone plants an injection, and the agent exfiltrates the codebase. Permissions and visibility are an iceberg [1].

The docs' design: Claude in a channel uses an admin-configured service account, with the same permissions for everyone there, and workspace notes saved from public channels are read in every channel [24].

**Judgment**: with many people involved, invest in tighter permissions, not more features. Each connector, and each entry point that can write into a channel, is another injection surface.

## Common pitfalls

**Context bloat.** CLAUDE.md sends full text every request, and every enabled plugin's skill, agent and command descriptions ride along each turn [3][10]. Fixes: keep CLAUDE.md under 200 lines; set `disable-model-invocation` on rare or side-effecting skills; hide others' skills with `skillOverrides`; run `/context all` for per-tool MCP token costs; check the Installed tab's "Not used recently" group in `/plugin`; official-marketplace plugins show a context cost estimate before install [3][10].

**Silent cache invalidation.** A model switch makes the next request recompute everything; a skill's `model` field and `opusplan` switching in plan mode count, and on most models so does changing effort [20]. Toggling a plugin's skills, commands, agents and hooks doesn't break the cache; plugins with MCP servers follow MCP rules. If `/reload-plugins` would force a full reread, it warns and stops unless you add `--force` [20]. **Judgment**: for a model-router mod, Thariq's warning against constantly breaking the prompt cache [1] is a hard constraint; free per-request switching gets expensive.

**Treating plugins as configuration.** Plugins can ship hooks, MCP servers and `bin/` executables that run with your user permissions; hooks, MCP servers and mod-started processes run outside the sandbox [11]. Mods aren't sandboxed: they can read and write any file your account can, read API keys from the environment, see every prompt and tool call, approve calls before you're asked, and spend your usage [4].

**Assuming deny rules always hold.** The built-in `sec-default` guard loads only with managed settings on the machine or a Team/Enterprise sign-in; API-key and third-party-cloud users get it only on managed machines [8]. When loaded, user mods can't approve calls a deny rule rejects, but the guard doesn't cover a mod's own `$.fs` and `$.process` calls: with `Read(.env)` denied, a mod can still `$.fs.read` the file [8]. User mods can also approve calls an `ask` rule would prompt for, or that a non-managed `PreToolUse` hook blocked, and in auto mode mod-approved calls skip the classifier [8].

**Guard mods fail open.** If a mod hook throws, times out or returns a bad shape, Claude Code skips it and moves on [6]. Blocking mods need `.catch` to fail closed [6]:

```javascript
on('tool.call', { tool: 'Bash' }, guard).catch(async ($, e, next) => {
  return { deny: 'The command guard failed, so this command was not run: ' + next.error.kind }
})
```

**More injection entry points than you think.** MCP servers fetching external content [17], pages and files a subagent read [18], outside sources that can write into a Tag channel [1]. The security page's advice is plain: read commands before approving, don't feed untrusted content straight to Claude, and run scripts that talk to external services in a VM [25]. Since August 14, auto mode is the default for new Pro, Max and Team sessions [27], with a classifier reviewing actions [26]. Thariq explains the classifier checks whether an action is within user authorization, while probes inside the model work at the level of intent [1]. See also [why sandboxing isn't enough](/blog/sandboxing-not-enough-rogue-agents-authority/).

**Scope mismatches in teams.** MCP defaults to local scope in your own `~/.claude.json`, so teammates don't get it; share with `--scope project` into `.mcp.json` [17]. Plugin project scope goes in the repo's `.claude/settings.json`, but each collaborator still installs locally [10]. Cloud sessions add their own exceptions [22].

## Selection table and the order to add things

| You want | Use | Avoid |
| --- | --- | --- |
| Conventions that always apply | CLAUDE.md; local ones in `.claude/rules/` | Putting them in a skill or hook |
| Something that must never happen | `PreToolUse` hook; managed settings org-wide | Only CLAUDE.md |
| A procedure you keep pasting | A skill, manual-only if side-effecting | All of it in CLAUDE.md |
| External data and actions | MCP (project scope for teams) plus a usage skill | Ad hoc curl |
| Noisy, file-heavy side tasks | A subagent with restricted tools | The main conversation |
| One setup across repos and people | Plugin plus internal marketplace | Copying `.claude/` by hand |
| Panels, event rewrites, model routing | A mod | Hacking it with hooks |
| Working in cloud and Projects too | Commit to the repo | Only `~/.claude` |
| Multi-person channel work | Claude Tag, per-channel permissions | Personal credentials in shared channels |

For a team customizing Claude Code systematically for the first time, here is my suggested order. The docs give a "add this when that happens" trigger table [3]; this order builds on it with security and sharing in mind (**Judgment**):

1. **Start with nothing.** Run defaults for a week or two, choose a permission mode, enable the sandbox if you can. Thariq also says new projects can skip CLAUDE.md [1].
2. **CLAUDE.md gets only twice-made mistakes.** Under 200 lines, each rule tagged with its failure, reviewed on model changes [1][3].
3. **Turn every "must" into a hook.** Protected files, dangerous commands, pre-commit formatting. Hooks cost no context [3].
4. **Turn repeated prompts into skills.** Disable auto-invocation for side effects [16].
5. **Connect external systems via MCP, with a usage skill.** Read-only first, write access as needed [3][17].
6. **Give noisy side tasks to subagents.** Narrow reach with `tools` [18].
7. **When a second repo needs the setup, make a plugin.** Run an internal marketplace, pin versions, decide on auto-update deliberately, and compare with and without the plugin via `claude plugin eval` [11][13].
8. **Mods last.** Only for UI, event rewrites or routing. Before installing, run `claude plugin validate` and read the `hooks:` and `calls:` lines, watching for `$.fs`, `$.process`, `$.http.fetch` and `$.env.get` [8]. Add `.catch` to blocking mods [6].
9. **Admins do a separate policy pass.** Decide on `allowManagedModsOnly` (org mods only), `disableSideloadFlags` (block sideloading like `--plugin-dir`), and a marketplace allowlist [8].

The most common managed-settings snippet for step 9, per the docs [8]:

```json
{
  "pluginConfigs": {
    "cc-plugin-sec-default@builtin": {
      "options": {
        "allowManagedModsOnly": true
      }
    }
  }
}
```

## Not covered, or not verifiable

- I didn't review the official Mods YouTube video or explainers like Chase AI's; only docs, official posts and the transcript are used.
- Thariq's model-router mod, assumption tool, mode selector and next-steps mod are personal works in progress with no official docs or public repo; treat them as direction only. Asked whether Mods will reach Claude Tag, he says he doesn't know [1].
- The interview says local hands will come later but not for which product or when; the docs only show Projects running local threads via Remote Control [21].
- Projects is a public beta for Pro and Max; Team and Enterprise can't use it yet, with no org-level controls during the beta [21]. The docs don't cover its long-term shape or pricing.

## References

Official documentation pages carry no publication date; all documentation pages below were accessed on 2026-10-07.

1. Latent Space. Claude Code's Next Era — Thariq Shihipar, Anthropic (interview and transcript). 2026-09-29. https://www.latent.space/p/thariq
2. Anthropic. Customize Claude Code with mods. 2026-10-01. https://claude.com/blog/claude-code-mods
3. Claude Code Docs. Extend Claude Code. https://code.claude.com/docs/en/features-overview
4. Claude Code Docs. Mods overview. https://code.claude.com/docs/en/plugins/mods/overview
5. Claude Code Docs. Create a mod. https://code.claude.com/docs/en/plugins/mods/create
6. Claude Code Docs. React to events with a mod. https://code.claude.com/docs/en/plugins/mods/events
7. Claude Code Docs. Mods reference. https://code.claude.com/docs/en/plugins/mods/reference
8. Claude Code Docs. Manage mods for your organization. https://code.claude.com/docs/en/plugins/mods/admin
9. Claude Code Docs. Use the mods API. https://code.claude.com/docs/en/plugins/mods/api
10. Claude Code Docs. Plugins overview. https://code.claude.com/docs/en/plugins/overview
11. Claude Code Docs. Plugin security and trust. https://code.claude.com/docs/en/plugins/security
12. Claude Code Docs. Add components to a plugin. https://code.claude.com/docs/en/plugins/components
13. Claude Code Docs. Test plugins with evals. https://code.claude.com/docs/en/plugin-evals
14. Anthropic. Build plugins for Claude with the directory submission portal. 2026-09-25. https://claude.com/blog/build-plugins-for-claude
15. Claude Code Docs. How Claude remembers your project. https://code.claude.com/docs/en/memory
16. Claude Code Docs. Extend Claude with skills. https://code.claude.com/docs/en/skills
17. Claude Code Docs. Connect Claude Code to tools via MCP. https://code.claude.com/docs/en/mcp
18. Claude Code Docs. Create custom subagents. https://code.claude.com/docs/en/sub-agents
19. Claude Code Docs. Automate actions with hooks. https://code.claude.com/docs/en/hooks-guide
20. Claude Code Docs. How Claude Code uses prompt caching. https://code.claude.com/docs/en/prompt-caching
21. Claude Code Docs. Let Claude coordinate ongoing work with Projects. https://code.claude.com/docs/en/claude-projects
22. Claude Code Docs. Configure cloud environments. https://code.claude.com/docs/en/cloud-environments
23. Claude Docs. Work with Claude Tag. https://claude.com/docs/claude-tag/overview
24. Claude Docs. How Claude Tag works. https://claude.com/docs/claude-tag/concepts/how-it-works
25. Claude Code Docs. Security. https://code.claude.com/docs/en/security
26. Claude Code Docs. Choose a permission mode. https://code.claude.com/docs/en/permission-modes
27. Claude Code Docs. What's new, Week 32 · August 3–7, 2026. https://code.claude.com/docs/en/whats-new/2026-w32

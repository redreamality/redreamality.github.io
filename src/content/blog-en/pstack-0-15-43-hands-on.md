---
title: "pstack 0.15.43 in Claude Code, hands-on: routing capped at xhigh, unlimited becomes large, and where Orchestrate went"
description: "pstack 0.15.43 cuts about a fifth of its skill text, routes work to Opus 5.5 with no role above xhigh, removes the Orchestrate playbook, and adds worker.md. This report installs it in Claude Code, counts the text change from 0.15.32, walks an old rule file through the /setup-pstack migration, and runs the repo's own checks."
author: Remy
pubDate: 2026-11-17T09:30:00+08:00
lang: en
translatedFrom: pstack-0-15-43-hands-on
tags:
  - ai-agents
  - agent-harness
  - ai-coding
  - claude-code
  - software-engineering
series: pstack
---

**Short answer:** pstack 0.15.43 (merged November 17, 2026, Shanghai time) cuts about 20% of its skill text. It routes work to Opus 5.5 by default, caps every role at xhigh, removes the Orchestrate playbook, and gives every agent that `/poteto-mode` starts a `worker.md` file to read first. [1] If you already use pstack, the one thing to do is update the plugin and rerun `/setup-pstack`.

| Your situation | What to do |
| --- | --- |
| Your rule file says `# budget: unlimited` | Rerun `/setup-pstack`. It changes the budget to `large` (xhigh). The `max` level is gone. |
| Your rule still has `hardest tasks`, `architect runners`, `reflect ...`, `how ...`, or `why ...` lines | Rerun `/setup-pstack`. It drops those lines for you. |
| Your rule has no `# defaults: 3` line | It still works. `/poteto-mode` keeps honoring the old lines and reminds you once per session. |
| You ran large programs with the Orchestrate playbook | Describe the task to `/poteto-mode`. Large, cross-cutting, or unattended work now routes to `figure-it-out`. |
| You want Fable 5.2 to write code | Name it in the task. Otherwise it runs only after two Opus 5.5 xhigh runs of the same brief fail their check. |
| You use Claude Code | Third-party marketplaces do not auto-update. Run `claude plugin update pstack@cursor-plugins`, then `/pstack:setup-pstack`. |

The rest of this post is what I installed and ran. The site's [pstack skills guide](/garden/notes/pstack-skills-guide/) was checked against 0.15.32. This report covers only what changed after that. For the reasoning behind pstack, see [Trust First, Then Parallel](/blog/lauren-tan-poteto-trust-before-parallel/).

## Three changes since 0.15.32

Between 0.15.32 and 0.15.43, pstack went through three changes worth calling out.

The first was 0.15.36 (October 28). The Orchestrate playbook became fully agent-driven. The coordinator started workers with `Task`, kept state in project notes, and stopped calling the `orch` scripts. `orch.ts`, `store.ts`, and their tests were deleted. That PR removed 6,348 lines. [2]

The second was 0.15.37 through 0.15.42 (November 15). The defaults moved to Fable 5.2, Opus 5.5, and Gemini 4 Carbon, and Grok 4.7 stopped being a default anywhere. `/why` became one file with a 48-word body, and all 12 of its reference files were deleted. `/how` also became one file, and `/poteto-mode` stopped calling it. [3] In that version, `hardest tasks` defaulted to `claude-fable-5-2-max`.

The third is 0.15.43. It keeps the 0.15.42 model lineup, but it removes the "send the hardest work to Fable at max" path entirely. The word counts and the routing diagram below describe this version.

## Install 0.15.43 in Claude Code

The box has Claude Code 2.1.278 and no Cursor. I installed the plugin into an empty config directory so that no existing settings were touched.

```bash
export CLAUDE_CONFIG_DIR=/workspace/pstack-series/2026-11-17/claude-home-fresh
claude plugin marketplace add cursor/plugins
claude plugin install pstack@cursor-plugins
claude plugin details pstack@cursor-plugins
```

![Terminal output of installing pstack 0.15.43 in Claude Code 2.1.278: 58 skills, 2 agents, and worker.md under poteto-mode](/assets/pstack-0-15-43-hands-on/claude-code-install.webp)

*Figure: installing pstack 0.15.43 into an empty config directory. The marketplace points at the generated `harness/pstack/claude-code` tree in `cursor/plugins`.*

The install succeeded: version 0.15.43, 58 skills, 2 agents, and a new `worker.md` under `poteto-mode/`. The last line shows the limit of this machine. Claude Code is not logged in, so I could not open a `/pstack:poteto-mode` session and watch a model work. Every statement below about what a model "will do" comes from the skill text, not from observed behavior.

## How much text is gone

The PR title says "shorter skill texts" but gives no totals. I wrote a small script that compares the `pstack/` trees at 0.15.32 (`e73df471`) and 0.15.43 (`2f87c854`). It counts the words in each `SKILL.md` body without frontmatter and lists added and removed files.

![Comparison script output: 58 skills in both versions, SKILL.md bodies drop from 33096 to 26346 words, and references files drop from 37 to 13](/assets/pstack-0-15-43-hands-on/skill-diff.webp)

*Figure: skill text in 0.15.32 and 0.15.43. Words are split on whitespace, and frontmatter is excluded.*

A few numbers are worth keeping:

- The skill count did not change. Both versions have 58 skills. Nothing was added or removed. What changed is how much each skill says.
- All `SKILL.md` bodies together went from 33,096 words to 26,346 words, a 20.4% cut.
- The deepest cuts are `why` (1,251 → 50), `architect` (771 → 69), and `reflect` (680 → 195). `poteto-mode` itself went from 3,114 words to 1,679, almost half.
- Files under `references/` went from 37 to 13. `why` lost 12, and `architect`, `how`, `interrogate`, and `reflect` lost all of theirs.
- Only 5 skills grew. `setup-pstack` went from 907 words to 1,226, and almost all of the new text is migration logic for old rule files.

`claude plugin details` estimates a token cost for each component, which gives a second view of the same change.

![claude plugin details estimates: always-on cost drops from 3576 to 3514 tokens, and the on-invoke sum of 60 components drops from 52710 to 41290 tokens](/assets/pstack-0-15-43-hands-on/token-estimate.webp)

*Figure: Claude Code's token estimates. 0.15.32 is loaded with `--plugin-dir`, and 0.15.43 is the marketplace install. The values are the tool's own rounded estimates.*

The always-on cost that every session pays barely moved (about 3,576 → 3,514 tokens). It comes mostly from skill descriptions, and those changed little. The savings show up on invocation. The on-invoke sum for 60 components fell from about 52,710 to about 41,290 tokens, and one `/poteto-mode` call fell from about 5,100 to about 2,800. Each time you type `/poteto-mode`, the model reads almost half as many rules first. An empty session costs about the same as before.

The PR names the cost of the cut. The shorter `architect` and principle texts drop the interface-depth wording that the longer versions had. [1] `architect` is now one paragraph: trace every system the change touches, sketch two different shapes, and pick the one where each piece of state has one owner and callers need to know least. Large or contested designs go to `arena`. I think this tradeoff is right. Most of the old `architect` text described orchestration steps that `arena` already has.

## New routing: Opus 5.5 by default, capped at xhigh

The largest behavior change in 0.15.43 is model routing. The diagram puts the `poteto-mode` defaults next to the `/setup-pstack` budget ladder.

<figure class="not-prose my-6"><svg viewBox="0 0 640 374" role="img" aria-label="pstack 0.15.43 model routing and budget ladder" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:640px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><text x="10" y="26" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Routing in 0.15.43: Opus 5.5 by default, no role above xhigh</text><text x="10" y="52" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.75">Role → default model</text><text x="390" y="52" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.75">/setup-pstack budget ladder</text><rect x="10" y="62" width="360" height="52" rx="8" fill="#3b82f6" fill-opacity="0.12"/><rect x="10" y="62" width="6" height="52" rx="3" fill="#3b82f6" fill-opacity="0.9"/><text x="26" y="84" font-size="13.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Code, prose, and judgment</text><text x="26" y="104" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">claude-opus-5-5-xhigh-fast</text><rect x="10" y="122" width="360" height="52" rx="8" fill="#10b981" fill-opacity="0.12"/><rect x="10" y="122" width="6" height="52" rx="3" fill="#10b981" fill-opacity="0.9"/><text x="26" y="144" font-size="13.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Trivial mechanical edits, verification</text><text x="26" y="164" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">claude-opus-5-5-high-fast</text><rect x="10" y="182" width="360" height="74" rx="8" fill="#8b5cf6" fill-opacity="0.12"/><rect x="10" y="182" width="6" height="74" rx="3" fill="#8b5cf6" fill-opacity="0.9"/><text x="26" y="204" font-size="13.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Review and design panels (arena, interrogate)</text><text x="26" y="224" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">claude-fable-5-2-high, claude-opus-5-5-high-fast,</text><text x="26" y="242" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">gemini-4-carbon-high</text><rect x="10" y="266" width="360" height="70" rx="8" fill="#f59e0b" fill-opacity="0.14" stroke="#f59e0b" stroke-width="1.5"/><text x="26" y="288" font-size="13.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Fable 5.2 outside a panel runs only when:</text><text x="26" y="308" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">1. you named it for this task, or</text><text x="26" y="326" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">2. two Opus 5.5 xhigh runs of one brief failed its check</text><rect x="390" y="62" width="70" height="40" rx="6" fill="#ef4444" fill-opacity="0.1"/><text x="425" y="87" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="0.45" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">max</text><line x1="398" y1="83" x2="452" y2="83" stroke="#ef4444" stroke-width="2"/><text x="470" y="79" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">removed</text><text x="470" y="95" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">old unlimited → large</text><rect x="390" y="112" width="70" height="40" rx="6" fill="#64748b" fill-opacity="0.16"/><text x="425" y="137" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">xhigh</text><text x="470" y="129" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">large (= defaults)</text><rect x="390" y="162" width="70" height="40" rx="6" fill="#64748b" fill-opacity="0.16"/><text x="425" y="187" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">high</text><text x="470" y="179" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">medium</text><rect x="390" y="212" width="70" height="40" rx="6" fill="#64748b" fill-opacity="0.16"/><text x="425" y="237" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">medium</text><text x="470" y="229" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.9">small</text><rect x="390" y="262" width="70" height="40" rx="6" fill="#64748b" fill-opacity="0.16"/><text x="425" y="287" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">low</text><text x="390" y="322" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">Roles that default to xhigh land as shown.</text><text x="390" y="338" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">Roles that default to high land one step lower.</text><text x="10" y="362" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">Difficulty alone never qualifies for Fable. Opus 5.5 always runs its -fast slug. Gemini tops out at high.</text></svg></figure>

*Figure: default routing and the budget ladder in 0.15.43, from the Subagents section of `poteto-mode/SKILL.md` and step 3 of `setup-pstack/SKILL.md`. [4][5]*

Compared with the two earlier versions, the change is clearer:

| Role | 0.15.32 | 0.15.42 | 0.15.43 |
| --- | --- | --- | --- |
| Code (feature, bug-fix, perf, hillclimb) | `grok-4.7-xhigh-fast` | `claude-opus-5-5-xhigh` | `claude-opus-5-5-xhigh-fast` |
| Hardest work (`hardest tasks`) | `claude-opus-5-5-xhigh` | `claude-fable-5-2-max` | role removed |
| Trivial edits and verification (`swarm workers`) | `grok-4.7-xhigh-fast` | `claude-opus-5-5-high-fast` | `claude-opus-5-5-high-fast` |
| Review and design panels | Opus xhigh + Grok xhigh-fast | Fable high + Opus high-fast + Gemini Carbon high | same as 0.15.42 |
| Budget options | unlimited, large, medium, small | same | large, medium, small |

Two rules here change your bill directly.

The first is the cap. Whatever budget you pick, no role runs above xhigh, and Opus 5.5 always runs its `-fast` slug. `unlimited` used to turn `claude-opus-5-5-xhigh` into `claude-opus-5-5-max`. That level no longer exists. The PR's reasoning is that `unlimited` could only mean max, so it was removed instead of capped. [1]

The second is the Fable gate. Outside a review panel, Fable 5.2 runs in two cases only: you named it for this task, or two Opus 5.5 xhigh runs of the same brief already failed their check. The skill adds that difficulty alone never qualifies. [4] In my view, this rule makes cost predictable. The price is that a truly hard task burns two Opus runs first. If you already know a task needs Fable, the cheapest move is to name it in the prompt.

## Walk an old rule file through the migration

The `/setup-pstack` migration is not a script. pstack ships no migration program. The agent that runs `/setup-pstack` reads the text of step 2 in `SKILL.md` and edits the rule file itself. [5] I could not have an agent run it on this box, because Claude Code is not logged in. Instead, I encoded steps 2, 3(b), and 5 rule by rule in a Python script and gave it a typical old file to see what the written rules produce.

The old file follows the 0.15.32 rule shape with an `unlimited` budget. So the Opus values sit at `max`, and Grok stays at `xhigh-fast` because Grok has no max. I also set `bug-fix` to `inherit-parent` to stand for a choice the user made:

```text
# budget: unlimited (max)
feature, refactoring: grok-4.7-xhigh-fast
bug-fix: inherit-parent
judgment and prose: claude-opus-5-5-max
hardest tasks: claude-opus-5-5-max
how explorer: grok-4.7-xhigh-fast
...
arena runners: claude-opus-5-5-max, grok-4.7-xhigh-fast
architect runners: claude-opus-5-5-max, grok-4.7-xhigh-fast
interrogate reviewers: claude-opus-5-5-max, grok-4.7-xhigh-fast
```

![Migration following the setup-pstack 0.15.43 text: 8 retired role lines dropped, unlimited becomes large, old Grok defaults become Opus, and the new rule carries # defaults: 3](/assets/pstack-0-15-43-hands-on/setup-migration.webp)

*Figure: each migration step and the rule file it writes. The budget question is assumed to be answered with `large`, and the step 4 model check is assumed to pass.*

The results fall into three groups:

1. **Dropped lines.** Eight lines go: `hardest tasks`, both `how` roles, both `why` roles, both `reflect` roles, and `architect runners`. None of these roles is in the new step 5 rule shape.
2. **Lines replaced with new defaults.** The file has neither `# defaults: 3` nor `# defaults: 2`, so `grok-*` counts as an old default, not as a user choice. The four code roles and `swarm workers` move to Opus. The three panels were exactly "one Opus plus one Grok", which matches the rule, so each takes the new three-seat list. `unlimited` becomes `large`.
3. **Kept lines.** `bug-fix: inherit-parent` stays as it is. Step 2 leaves `judgment and prose: claude-opus-5-5-max` alone, but step 3(b) sets its effort back to xhigh for `large` and adds `-fast`. The result is `claude-opus-5-5-xhigh-fast`.

The third group hits a gap in the text. Step 2 says every other value is the user's choice and stays, but `max` is not valid in the new version. I derived the result from step 3(b), which sets the effort token of every real slug to the role's target, and from step 4, which requires xhigh or below. A real agent might ask you first or might change it directly. I could not check which.

One more detail. Apart from `bug-fix`, the migrated file is identical to a fresh install's defaults. If you accepted the defaults the first time, rerunning `/setup-pstack` amounts to a reset. If you changed some roles by hand, read the list of replaced values that it prints. In Claude Code the file is `~/.claude/rules/pstack-models.md`, model values look like `opus xhigh`, and Gemini maps to `inherit-parent`. [6]

## worker.md: started agents follow the same rules

There used to be a gap. The operator's rules (no questions to the human, how to write a PR, when to stop) lived in skills, and skills load only from a slash command. A subagent that `/poteto-mode` started never saw those rules unless the main chat copied them into the kickoff. 0.15.43 closes the gap with one file and a rule that the first line of every kickoff points to it.

<figure class="not-prose my-6"><svg viewBox="0 0 640 437" role="img" aria-label="How worker.md reaches every started agent" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:640px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="pstack1543ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><text x="10" y="26" font-size="16" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">worker.md: every agent /poteto-mode starts reads one rules file first</text><rect x="10" y="46" width="146" height="66" rx="8" fill="#64748b" fill-opacity="0.12"/><text x="83" y="72" font-size="13.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">You (operator)</text><text x="83" y="94" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">the run works for you</text><rect x="168" y="46" width="146" height="66" rx="8" fill="#3b82f6" fill-opacity="0.12"/><text x="241" y="72" font-size="13.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">/poteto-mode chat</text><text x="241" y="94" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">SKILL.md + playbook</text><rect x="326" y="46" width="146" height="66" rx="8" fill="#10b981" fill-opacity="0.12"/><text x="399" y="72" font-size="13.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">Subagent</text><text x="399" y="94" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">Task or Project worker</text><rect x="484" y="46" width="146" height="66" rx="8" fill="#10b981" fill-opacity="0.12"/><text x="557" y="72" font-size="13.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">Its subagents</text><text x="557" y="94" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">also read worker.md first</text><line x1="158" y1="79" x2="176" y2="79" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#pstack1543ah)"/><line x1="316" y1="79" x2="334" y2="79" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#pstack1543ah)"/><line x1="474" y1="79" x2="492" y2="79" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#pstack1543ah)"/><text x="10" y="138" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.8">The first line of every kickoff:</text><rect x="10" y="146" width="620" height="30" rx="6" fill="#10b981" fill-opacity="0.1"/><text x="22" y="166" font-size="13" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">Read &lt;path&gt;/worker.md before anything else.</text><text x="10" y="202" font-size="12.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.8">Rules in worker.md (summary):</text><rect x="10" y="210" width="620" height="26" rx="4" fill="#64748b" fill-opacity="0.13"/><text x="22" y="228" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">The bar in the kickoff is the whole bar. No extra check, gate, sign-off, or review round.</text><rect x="10" y="240" width="620" height="26" rx="4" fill="#64748b" fill-opacity="0.08"/><text x="22" y="258" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">No bar stated: no worse than its base, and it passes its own tests.</text><rect x="10" y="270" width="620" height="26" rx="4" fill="#64748b" fill-opacity="0.13"/><text x="22" y="288" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">Block only for a failing run at this head or a user-facing bug. Report base problems in one line.</text><rect x="10" y="300" width="620" height="26" rx="4" fill="#64748b" fill-opacity="0.08"/><text x="22" y="318" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">Never show a person a question. Make the reversible choice, then say what and why.</text><rect x="10" y="330" width="620" height="26" rx="4" fill="#64748b" fill-opacity="0.13"/><text x="22" y="348" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">Stop only for a deploy, deleted data, a force-push to a shared branch, or an outside message.</text><rect x="10" y="360" width="620" height="26" rx="4" fill="#64748b" fill-opacity="0.08"/><text x="22" y="378" font-size="12.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.95">Open PRs ready for review. Title type(scope): subject. Body at most 40 lines, six headings.</text><text x="10" y="406" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">A kickoff overrides a rule only when it says so in so many words.</text><text x="10" y="423" font-size="12" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.75">Before 0.15.43, these rules reached an agent only when a slash command loaded a skill.</text></svg></figure>

*Figure: how `worker.md` reaches each agent, with a summary of its rules from `poteto-mode/worker.md`. [7]*

The file is short, nine bullets in all. A few are worth checking against your team's habits before you upgrade:

- **The bar in the kickoff is the whole bar.** The started agent adds no check, sign-off, or review round of its own. That cuts extra work, and it also means a check that the kickoff does not name will not happen.
- **Never show a person a question.** The agent makes any choice it can undo, then says what it chose. It stops only for a deploy, deleted data, a force-push to a shared branch, or a message to someone outside the run.
- **Open PRs ready for review, never as drafts.** The title is `type(scope): subject`, and the body has at most 40 lines under six fixed `##` headings.

A kickoff overrides one of these rules only when it says so in so many words. If your team opens PRs as drafts first, write that into the kickoff. A convention in the repo is not enough.

## Where Orchestrate went

Orchestrate went away in two steps. 0.15.36 deleted the `orch` scripts and rewrote the playbook so that the coordinator managed the program with its own agent tools. [2] 0.15.43 removed the playbook. The routing rule in `poteto-mode` now sends large, cross-cutting, or unattended work, or a task no playbook fits, to `figure-it-out`. [4] `figure-it-out` designs an auditable playbook when no narrower one fits. It scales rigor to the task, runs a hypothesis loop, and logs decisions.

`poteto-help` also gained a line: pstack has no `/orchestrate` skill, and if the slash menu shows `/orchestrate`, another plugin provides it. [8] The same `cursor/plugins` repository does hold a separate `orchestrate` plugin. It fans a large task out across parallel cloud agents through the Cursor SDK, and it needs `bun` and `CURSOR_API_KEY`. [9] It is not part of pstack. If you want many cloud agents fanned out, look at that plugin. If you only want a large task done, use `/poteto-mode`.

This week someone on X described a workflow whose second step was "pstack Orchestrate: a giant orchestrator thread on Fable". [10] Those are exactly the two things 0.15.43 removed: the Orchestrate playbook, and Fable as the default for the hardest work. Anyone who set up pstack from that kind of guide has two things to change after upgrading.

## The repo's own checks pass

I ran the CI steps at `2f87c854`. I installed the three dependencies CI uses, then ran the three repo scripts and every skill script test.

![validate-plugins, the harness tree check, check-pstack-docs, and node --test at cursor/plugins 2f87c85: 340 tests, 270 pass, 0 fail, 70 skipped](/assets/pstack-0-15-43-hands-on/repo-checks.webp)

*Figure: results on Linux with Node 26.9.0. CI uses Node 22.*

All three scripts pass. The plugin definitions are valid, the generated Claude Code harness tree is up to date, and the docs check finds 0 problems (58 skills, 22 playbooks, 2 agents). Of 340 tests, 270 pass, 0 fail, and 70 are skipped. The PR reports 269 passes and 1 failure, a statechart symlink test that also fails on main on macOS. [1] On Linux that test passes.

The 70 skipped tests need `TLA2TOOLS` set to the path of `tla2tools.jar`, which needs Java. The box has no Java. So I did not test the `/statechart` paths that call TLC, including the 0.15.38 fix that reports the spec's line and column when SANY cannot read it. [3]

## What people asked about this week

pstack came up often on X in the past seven days. Three questions kept coming back.

**The defaults changed. Should I rerun `/setup-pstack`?** After 0.15.42, a Japanese post telling people to rerun it right away passed 150 likes. [11] After 0.15.43 the answer is the same, with a stronger reason: the rule format changed (`# defaults: 3`), and several roles are gone.

**Does it work in Codex?** People asked at least twice this week. [12][13] The upstream README documents only Cursor and Claude Code. Community ports exist, but I have not tested them, so I do not recommend one here. The [host compatibility table](/garden/notes/pstack-skills-guide/#host-compatibility) in the site's guide still applies.

**Tokens are expensive.** One user asked the author directly for token-saving tips, because a few bots running overnight can use 75% of a weekly budget. [14] 0.15.43 helps in two places: invoked text is shorter, and the `max` level is gone. It does not make panels cheaper. A three-seat review panel still runs three models. To spend less, pick `medium` or `small` in `/setup-pstack` and shorten the panel lists.

## What I tested and what I did not

What I ran:

- Installed pstack 0.15.43 from the marketplace in Claude Code 2.1.278 and confirmed the version, the component inventory, and `worker.md`.
- Compared the skill list, `SKILL.md` word counts, and added and removed files under `references/` and elsewhere for 0.15.32 and 0.15.43.
- Compared the `claude plugin details` token estimates for both versions.
- Migrated an old rule file to the new format by following the `setup-pstack` 0.15.43 text.
- Ran `validate-plugins`, `generate-pstack-harness-trees --check`, `check-pstack-docs`, and the CI `node --test` command.

What I did not test:

- Any real `/poteto-mode` or `/setup-pstack` session. Claude Code is not logged in, and the test machine has no Cursor. There is no observed data yet on whether models read `worker.md` or respect the Fable gate.
- The migration as an agent actually performs it. The result above is a deterministic reading of the written rules.
- The 70 statechart tests that need Java and TLC.

My conclusion is that the upgrade is worth it. The shorter text mostly saves context on each invocation. The cap puts a ceiling on worst-case cost. `worker.md` closes the gap where started agents never saw the operator's rules. After you upgrade, the work is small: rerun `/setup-pstack`, read which values it replaced, and check `worker.md` against your team's PR rules.

Latest: [pstack 0.15.48 hands-on: /reframe teaches you what your problem is called](/blog/pstack-0-15-48-reframe-hands-on/).

## References

1. cursor/plugins PR #1249, feat(pstack): shorter skill texts, worker.md, and Opus-first routing capped at xhigh: <https://github.com/cursor/plugins/pull/1249>
2. cursor/plugins PR #1043, feat(pstack): make Orchestrate agentic and delete the orch scripts: <https://github.com/cursor/plugins/pull/1043>
3. cursor/plugins PR #1236, feat(pstack): new default models, one-file why and how, statechart fixes, sharpen and reflect text: <https://github.com/cursor/plugins/pull/1236>
4. pstack 0.15.43, `poteto-mode/SKILL.md`: <https://github.com/cursor/plugins/blob/2f87c854fe3e2fcda44ca86b46ede35aad3c46b7/pstack/skills/poteto-mode/SKILL.md>
5. pstack 0.15.43, `setup-pstack/SKILL.md`: <https://github.com/cursor/plugins/blob/2f87c854fe3e2fcda44ca86b46ede35aad3c46b7/pstack/skills/setup-pstack/SKILL.md>
6. pstack 0.15.43, Claude Code adapter: <https://github.com/cursor/plugins/blob/2f87c854fe3e2fcda44ca86b46ede35aad3c46b7/pstack/docs/harness/claude-code.md>
7. pstack 0.15.43, `poteto-mode/worker.md`: <https://github.com/cursor/plugins/blob/2f87c854fe3e2fcda44ca86b46ede35aad3c46b7/pstack/skills/poteto-mode/worker.md>
8. pstack 0.15.43, `poteto-help/SKILL.md`: <https://github.com/cursor/plugins/blob/2f87c854fe3e2fcda44ca86b46ede35aad3c46b7/pstack/skills/poteto-help/SKILL.md>
9. cursor/plugins, `orchestrate` plugin README: <https://github.com/cursor/plugins/tree/main/orchestrate>
10. Post by @mrtnnow on X (November 13, 2026): <https://x.com/mrtnnow/status/2121248719207117226>
11. Post by @cu30rry_ on X (November 15, 2026): <https://x.com/cu30rry_/status/2121885461409133029>
12. Question by @JediTam on X (November 14, 2026): <https://x.com/JediTam/status/2121390741536874906>
13. Reply by @filipem1randa on X (November 17, 2026): <https://x.com/filipem1randa/status/2122460032629604581>
14. Post by @ndh4hy on X (November 15, 2026): <https://x.com/ndh4hy/status/2121930619559252125>

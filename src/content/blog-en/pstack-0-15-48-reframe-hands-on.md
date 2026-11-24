---
title: "pstack 0.15.48 hands-on: /reframe teaches you what your problem is called"
description: "Two things changed in substance between pstack 0.15.43 and 0.15.48: a new hand-run skill, /reframe, and a review-panel Gemini seat that moved to gemini-4-neon-xhigh. This report installs 0.15.48 in Claude Code, runs /reframe on a vague, a clear, and a precise description, walks an old rule file through the /setup-pstack Gemini migration, and runs the repo's own checks."
author: Remy
pubDate: 2026-11-24T09:30:00+08:00
lang: en
translatedFrom: pstack-0-15-48-reframe-hands-on
tags:
  - ai-agents
  - agent-harness
  - ai-coding
  - claude-code
  - software-engineering
series: pstack
---

**Short answer:** of the five pstack releases from 0.15.43 to 0.15.48, two changes deserve your attention. The first is a new skill, `/reframe`. When you know what you want but not what your field calls it, it teaches you 8 to 12 expert terms, borrows words from neighboring fields, and rewrites your description with them. Since 0.15.48 it also lists the two or three problems a vague description could be before it picks one. [1][2] The second is the Gemini seat in the review and design panels, which moved from `gemini-4-carbon-high` to `gemini-4-neon-xhigh`. If you saved a rule file, rerun `/setup-pstack` yourself. Nothing will remind you. [4][5]

| Your situation | What to do |
| --- | --- |
| You use Cursor or Grok Bot | The plugin updates itself. The author's words are "it's autoupdated". [11] Check that you are on 0.15.48. |
| You use Claude Code | Third-party marketplaces do not auto-update. Run `claude plugin marketplace update cursor-plugins`, then `claude plugin update pstack@cursor-plugins`, then restart. The command is `/pstack:reframe`. |
| You want an agent to build something you can't name | Run `/reframe <your own words>` inside the project so it reads your files. Send the rewrite, or run `/sharpen` on it first, then hand it to `/poteto-mode`. [9] |
| You already know the terms and want a deeper prompt | Use `/sharpen`. You don't need `/reframe`. |
| A panel role in your rule has `gemini-4-carbon-high` or `gemini-4-neon-high` | Rerun `/setup-pstack`. It writes `gemini-4-neon-xhigh`. The `# defaults: 3` marker did not change, so `/poteto-mode` will not ask you to. |
| You picked a low Neon level such as `gemini-4-neon-medium` for a panel | A rerun at the `large` budget raises it back to `xhigh`. To keep a lower level, choose the `medium` or `small` budget, or change the role at the confirm step. |
| You run panels in Claude Code | The Gemini seat maps to `inherit-parent` there, so the migration does not affect you. [8] |
| You run `/statechart` on native Windows | Run `node --disable-warning=ExperimentalWarning <skill dir>/scripts/statechart.ts` with Node 22.18 to 22.x, or 23.6 or later. [6] |

This is the second post in the pstack series. The first, [pstack 0.15.43 in Claude Code, hands-on](/blog/pstack-0-15-43-hands-on/), covered the xhigh routing cap and where Orchestrate went. The site's [pstack skills guide](/garden/notes/pstack-skills-guide/) is the overview, checked against 0.15.32. This post covers only what changed after 0.15.43.

## Five releases, two real changes

Here are the five merges, with times converted to Shanghai time.

| Version | Merged | PR | Change |
| --- | --- | --- | --- |
| 0.15.44 | Nov 19, 14:26 | #1283 | The panel's Gemini seat moves from Carbon to `gemini-4-neon-high`, and `setup-pstack` learns to migrate old `gemini-4-*` entries. [4] |
| 0.15.45 | Nov 20, 05:53 | #1284 | The seat moves up to `gemini-4-neon-xhigh`, and an old `high` default migrates too. [5] |
| 0.15.46 | Nov 20, 06:12 | #1292 | `/statechart` runs on native Windows, and a bug with TLC's `\r\n` line ends is fixed. [6] |
| 0.15.47 | Nov 24, 06:32 | #1324 | `/reframe` is added. [1] |
| 0.15.48 | Nov 24, 08:41 | #1326 | `/reframe` lists the problems a vague description could be before it teaches words for one. [2] |

The Gemini change is maintenance, and the `/statechart` fix matters only on Windows. The thing that changes how you work is `/reframe`, which took the last two releases to land. Most of this post is about it.

## /reframe closes a vocabulary gap

pstack already had `/sharpen`. It asks what a top professional in your field would do that you didn't ask for, then rewrites your prompt to be deeper. That assumes you can say what you're building. Often you can't. You can see the symptom ("the settings page saves some fields right away and others on submit, and people lose edits") but you don't know that people call this a mixed save model, or that dirty state and lost updates are part of the same conversation. Without the right words, an agent reads your sentence literally, and what it builds stays literal too.

`/reframe` is the tool for that gap. Its `SKILL.md` body is 202 words, a little longer than the 124 words of `/sharpen`, and it reads as a short procedure: [3]

1. Start from the operator's own files, code, and description, not from a summary.
2. If the description could name more than one problem, list two or three, each with the term that names it and the sign that tells it apart. Then teach the words for the likeliest one and say why. (This paragraph is the 0.15.48 addition.)
3. Give 8 to 12 terms, ranked by how much each would change what gets built. Each comes with a plain meaning, the part of the description it names, a real project, paper, or system that uses it that way, with a link, and what it lets you ask an agent for.
4. Pick 2 or 3 neighboring fields that solved the same shape of problem under other names. Say what carries over, where the analogy breaks, and which terms come back.
5. Name what you didn't mention but should care about.
6. Rewrite the description with the new words.

One rule sits over all of it: open every link, confirm it uses the term that way, and cut any citation that can't be confirmed.

<figure class="not-prose my-6"><svg viewBox="0 0 640 556" role="img" aria-label="/reframe in 0.15.48: a vague description first gets candidate problems, then terms, borrowed words and a rewrite" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:640px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><rect x="150" y="16" width="340" height="40" rx="8" fill="#2563eb" fill-opacity="0.1"/><text x="320" y="41" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">Input: your description + the files in your repo</text><polyline points="320,56 320,80" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><rect x="110" y="80" width="420" height="48" rx="8" fill="#d97706" fill-opacity="0.12" stroke="#d97706" stroke-width="1.5"/><text x="320" y="109" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">Could the description name more than one problem?</text><text x="536" y="76" font-size="11" text-anchor="start" font-weight="bold" fill="#d97706" fill-opacity="1">new in 0.15.48</text><polyline points="180,128 180,150" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><text x="188" y="143" font-size="12" text-anchor="start" font-weight="bold" fill="#d97706" fill-opacity="1">yes</text><rect x="20" y="150" width="290" height="56" rx="8" fill="#d97706" fill-opacity="0.08" stroke="#d97706" stroke-width="1.5"/><text x="165" y="173" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">List the 2–3 problems it could be</text><text x="165" y="194" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.85">each: one term + one telling sign</text><polyline points="165,206 165,226" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><rect x="20" y="226" width="290" height="40" rx="8" fill="#d97706" fill-opacity="0.08" stroke="#d97706" stroke-width="1.5"/><text x="165" y="251" font-size="13" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">Pick the likeliest one and say why</text><polyline points="165,266 165,300" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><polyline points="530,104 606,104 606,300" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><text x="548" y="98" font-size="12" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.7">no</text><rect x="330" y="150" width="256" height="56" rx="8" fill="#6b7280" fill-opacity="0.06" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="5 4"/><text x="458" y="173" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">Open every link and confirm it uses</text><text x="458" y="192" font-size="12" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">the term that way. Cut what fails.</text><polyline points="458,206 458,300" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" stroke-dasharray="4 4" marker-end="url(#ah)"/><text x="466" y="262" font-size="11" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.7">applies to ①</text><rect x="20" y="300" width="600" height="178" rx="8" fill="#2563eb" fill-opacity="0.07" stroke="#2563eb" stroke-width="1.5"/><text x="36" y="326" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">① 8–12 terms, ranked by how much each changes what you build</text><text x="52" y="346" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">each: plain meaning · the phrase it names · a real project or paper link · what to ask for</text><text x="36" y="376" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">② 2–3 neighboring fields</text><text x="52" y="396" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="0.8">what carries over · where the analogy breaks · which terms come back</text><text x="36" y="426" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">③ What you didn&#x27;t mention but should care about</text><text x="36" y="458" font-size="13" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">④ Your description, rewritten with the new words</text><polyline points="320,478 320,500" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><rect x="70" y="500" width="500" height="40" rx="8" fill="#2563eb" fill-opacity="0.12"/><text x="320" y="525" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">Output: the rewrite → optionally /sharpen → hand it to /poteto-mode</text></svg></figure>

*Figure: the `/reframe` flow in 0.15.48. The amber steps are new in 0.15.48. The dashed box is the citation check that governs step ①. Source: `reframe/SKILL.md`. [3]*

The commit history shows how the skill was framed. It started as `name-it`, then was renamed `reframe` and rewritten "as a meta-prompt like sharpen". [1] The PR explains the name: like `sharpen`, it is a verb applied to the prompt, and it names the move of seeing the task through the words of experts and neighboring fields. Like `sharpen`, it sets `disable-model-invocation: true`. It runs only when you type it, and `/poteto-mode` never calls it for you.

The 0.15.48 paragraph is small, and it does real work. The PR's reason is that listing the candidate problems first keeps the skill from teaching a whole vocabulary for the wrong one. [2] It is a differential diagnosis: say it could be A, B, or C, say what would tell them apart, then go deep on the likeliest.

## Test setup

The test machine has Claude Code 2.1.278 and the same isolated config directory that held 0.15.43 in the last post. Two commands upgrade it:

![Claude Code upgrading pstack from 0.15.43 to 0.15.48: update the marketplace, then the plugin. The always-on estimate rises from 3514 to 3563 tokens, and reframe costs about 270 tokens on invoke](/assets/pstack-0-15-48-reframe-hands-on/claude-code-update.webp)

*Figure: the upgrade from 0.15.43 to 0.15.48 in Claude Code, and the token estimates from `claude plugin details`.*

The skill count goes from 58 to 59, and the new one is `reframe`. It is cheap. The always-on cost per session rises from about 3,514 to about 3,563 tokens, which is roughly the weight of the new description line. One invocation costs about 270 tokens. `setup-pstack` grew from about 2,000 to about 2,200 tokens on invoke because of the Gemini migration text.

Claude Code is not logged in on this machine, so `claude -p '/pstack:reframe ...'` returns `Not logged in · Please run /login`. The skill runs below use OpenCode 2.3.2 with its free model `opencode/deepseek-v4.1-flash-free`. OpenCode's `skills` setting accepts any directory, [16] so it points straight at `skills/reframe` and `skills/setup-pstack` inside the Claude Code plugin cache for 0.15.48. The model reads the exact file you get when you install, unchanged.

Keep one caveat in mind. This is a small free model, not the Opus 5.5 that pstack routes to by default. The runs show what the skill text can get out of an ordinary model. A stronger model should do at least as well.

## Three descriptions, three real runs

Each run gets a tiny project of a few files and a one-sentence description. The three sentences go from vague to precise.

### Vague: "my bots sometimes do the same work twice and sometimes skip it"

The first project is three Python scripts on cron that use a folder of JSON files as a ledger. `trends.py` scores candidate terms, and `writer.py` drafts posts for the shortlisted rows. The prompt:

```text
@reframe my bots sometimes do the same work twice and sometimes skip it. I want them to be more reliable.
```

![/reframe on the vague description: it reads the crontab and both scripts, opens 12 pages to check citations, lists three problems the sentence could be, and picks the first](/assets/pstack-0-15-48-reframe-hands-on/reframe-vague.webp)

*Figure: an excerpt of the vague run. The term list, neighboring fields, and risk list in the middle are elided.*

This is where the new step earns its place. After reading `crontab.txt`, `writer.py`, and `trends.py`, the model says the sentence could name three problems:

1. Crash-inconsistent, non-idempotent job processing, named by "idempotency under at-least-once execution". The sign: cron fires on time, and a rerun or a mid-job crash still drafts the same post again.
2. Concurrent runs without mutual exclusion, named by a lease or a distributed lock. The sign: two processes are alive at once, or a long run overlaps the next scheduled one.
3. An unreliable scheduler, named by a dead man's switch, an alert that fires when an expected heartbeat doesn't arrive. The sign: no log line or heartbeat at the scheduled time at all.

It picks the first, with the second as an accelerant, and every reason comes from the code. `writer.py` checks `status == "shortlisted"`, writes the draft, and only then flips the status, so a crash in between repeats the work. `trends.py` answers a 429 with `time.sleep(60); continue`, which drops that row for the run and, with enough rate-limited rows, pushes the job into the next cron slot. Both scripts write with `json.dump(row, open(path, "w"))`, which truncates the file first. A crash mid-write leaves invalid JSON, the next `json.load` raises, and every row after it is skipped. Both symptoms, "twice" and "skip", come out of these lines, and neither depends on cron being late.

The 12 terms are ranked sensibly. Idempotency key comes first, then an atomic claim with compare-and-swap, a lease with a fencing token, and the idempotent consumer pattern. Dead man's switch comes last. The neighboring fields are database transactions, message-oriented middleware, and stream processing with workflow orchestration, and each one says where the analogy breaks. One example: a single box has no network partitions, so you don't need Raft or Redlock, but process pauses and overlapping cron runs are real, so a lease without a fencing token is still unsafe.

The most useful section is the one on what you didn't mention. It noticed that `crontab.txt` schedules `bots/digest.py` and that no such file exists in the checkout. That was a mistake in the test project, and the model caught it. The rewritten description turns all of this into a request an agent can act on: at-least-once delivery with idempotent handling, leases with fencing tokens, dead letters, a sweeper, an overlap guard, and atomic commits. It ends with a sense of scale: "At your scale, you probably do not need Kafka or Temporal yet. A single SQLite table ... plus `flock` and a sweeper, implements most of this vocabulary."

### Clear: a settings page that saves some fields right away

The second project is the example from chapter 2 of the pstack guide. [9] Toggles call `patchUser` and save at once. The text fields wait for **Save** and call `saveProfile`.

```text
@reframe the settings page saves some fields right away and others only on submit, and people lose edits.
```

![/reframe on the settings-page description: after reading both source files it still lists three readings, picks the mixed save model, and rewrites the description with save model, unit of work, and single source of truth](/assets/pstack-0-15-48-reframe-hands-on/reframe-settings.webp)

*Figure: an excerpt of the settings-page run.*

I expected this sentence to be clear enough to skip the new step. It wasn't. The model listed a mixed save model, a lost update, and unclear state ownership, because the form copies its props once on mount. It picked the first, and then pointed out that the third is already in the code. The toggles read the `user.emailDigest` prop, and `patchUser` returns the full user, which the page throws away. Unify the save model and edits still go missing. It also noticed that neither function checks `res.ok`. `fetch` doesn't throw on a 4xx or 5xx, so a failed save looks like a success.

The 12 terms include save model, unit of work, dirty state, optimistic update, If-Match, debounce, and navigation guard, each backed by a source such as VS Code, React, React Router, MDN, or Stripe. If you were the person who wrote "people lose edits", the rewrite is enough to choose a save model.

### Precise: the second wiki save overwrites the first

The third sentence is deliberately exact. The symptom is the textbook lost update:

```text
@reframe when two people open the same wiki page and both save, the second save silently overwrites the first person's changes. Nobody sees an error.
```

![/reframe on the precise description: the first line names a lost update, and it still lists three readings: a lost update, an edit conflict that is detected but not shown, and concurrent edits that should have been merged](/assets/pstack-0-15-48-reframe-hands-on/reframe-precise.webp)

*Figure: an excerpt of the precise run.*

The first sentence of the answer is "This is a lost update." The candidate list still appears: no concurrency control at all, a conflict that is detected and then swallowed by the UI, or disjoint edits that should have been merged. The last two are not filler. The second tells you to look for a 409 in the logs before you write code. The third is a product decision: reject the later save, or merge both. It picks the first because `save_page.py` goes from `pages.get` to an edited `body` to `pages.put` with no version check anywhere.

### The three runs side by side

| | Vague (bots) | Clear (settings) | Precise (wiki) |
| --- | --- | --- | --- |
| Candidate problems listed | 3 | 3 | 3 |
| Terms | 12 | 12 | 12 |
| Neighboring fields | 3 | 3 | 3 |
| Links in the final answer | 12 | 13 | 12 |
| URLs opened during the run | 23 | 20 | 35 |
| Wall time | about 3.5 min | about 3 min | about 5 min |

Two things stand out.

First, the candidate step fired in all three runs, including the precise one. The rule says "if their description could name more than one problem", and almost any sentence could. I don't count this against the skill. It costs a hundred words or so, and the alternative readings are often the product questions you hadn't asked yet. If you really do know what the thing is called, you want `/sharpen`, not `/reframe`.

Second, the "open every link" rule held. The three final answers cite 37 links, 35 of them distinct. Every one was opened during its run, and every one returns 200 when requested now. The model opens far more than it keeps. The precise run opened 35 URLs and cited 12, including 7 Wikipedia pages that it opened and then cited none of. In PR #1324 the author reports 42 of 42 citations confirmed and none invented. [1] These runs agree.

## Problems I ran into

**Claude Code runs no skill until you log in.** Installing, updating, and inspecting plugins work without an account. Starting a session stops at `Not logged in`. If you only want the skill text, `claude plugin details` and the plugin cache directory are enough.

**Non-interactive runs exit with code 1.** All three `/reframe` runs ended with `Error: Cancelled a request for input this run cannot answer: Web Search`. The model asked for web search, and `opencode run` can't answer a permission prompt without a terminal. It finished the checks with WebFetch and its own fetch scripts, and the answers are complete. If you batch `/reframe` in a script or in CI, judge the output, not the exit code.

**The repo checks need dependencies.** Without them, `validate-plugins.mjs` can't find `ajv`, and `differential.test.ts` can't find `fast-check`. CI installs them with `npm install --no-save ajv ajv-formats fast-check@4.5.3`. [17] In a directory with no `package.json`, that command failed with `Tracker "idealTree" already exists`. A temporary `package.json` containing `{"private":true}` fixed it.

## The Gemini seat: from Carbon to Neon xhigh

The panel change took two steps. 0.15.44 moved the seat from `gemini-4-carbon-high` to `gemini-4-neon-high`, and 0.15.45 raised it to `gemini-4-neon-xhigh`. PR #1284 gives the reason. In a blind comparison of the two levels, both caught every planted flaw, and `xhigh` found more real problems that nobody had planted. It took about 50% longer per run. The PR puts it this way: "Panels are where pstack pays for depth." [5]

The catch for existing users is that the migration doesn't run itself. PR #1283 says so: the `# defaults: 3` marker didn't change, so `/poteto-mode` won't ask anyone to rerun `/setup-pstack` for this. A saved rule keeps its Carbon entries until you rerun it. [4]

The new step 2 rule in `setup-pstack` works like this. In a panel role (`arena runners`, `arena cross-judge pool`, `interrogate reviewers`), a `gemini-4-neon-high` entry, or any `gemini-4-*` entry that isn't Neon, is an old default and becomes `gemini-4-neon-xhigh`. Any other Neon level counts as your choice. Gemini entries outside the panel roles are left alone. [7]

<figure class="not-prose my-6"><svg viewBox="0 0 640 440" role="img" aria-label="How setup-pstack 0.15.48 treats Gemini entries in an old rule" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-width:640px;display:block;margin:0 auto;font-family:inherit;color:inherit" fill="currentColor"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor" fill-opacity="0.6"/></marker></defs><rect x="150" y="16" width="280" height="36" rx="8" fill="#2563eb" fill-opacity="0.1"/><text x="290" y="39" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">A gemini-4-* entry in your saved rule</text><polyline points="290,52 290,76" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><rect x="20" y="76" width="380" height="52" rx="8" fill="#6b7280" fill-opacity="0.07" stroke="#6b7280" stroke-width="1.5"/><text x="210" y="98" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">Is it in a panel role?</text><text x="210" y="117" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8">arena runners · arena cross-judge pool · interrogate reviewers</text><polyline points="400,102 428,102" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><text x="404" y="95" font-size="11" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.7">no</text><rect x="428" y="76" width="192" height="64" rx="8" fill="#6b7280" fill-opacity="0.05" stroke="#6b7280" stroke-width="1.5"/><text x="524" y="96" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">Stays as is</text><text x="524" y="114" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">e.g. judgment and prose:</text><text x="524" y="130" font-size="10.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="0.8" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">gemini-4-carbon-high</text><polyline points="210,128 210,150" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><text x="218" y="144" font-size="11" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.7">yes</text><rect x="20" y="150" width="380" height="40" rx="8" fill="#6b7280" fill-opacity="0.07" stroke="#6b7280" stroke-width="1.5"/><text x="210" y="175" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">gemini-4-neon-high, or a non-Neon gemini-4-*?</text><polyline points="105,190 105,220" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><text x="113" y="210" font-size="11" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.7">yes</text><polyline points="315,190 315,220" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><text x="323" y="210" font-size="11" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="0.7">no</text><rect x="20" y="220" width="180" height="54" rx="8" fill="#d97706" fill-opacity="0.1" stroke="#d97706" stroke-width="1.5"/><text x="110" y="242" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">Old default</text><text x="110" y="262" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">→ gemini-4-neon-xhigh</text><rect x="220" y="220" width="180" height="54" rx="8" fill="#2563eb" fill-opacity="0.08" stroke="#2563eb" stroke-width="1.5"/><text x="310" y="242" font-size="13" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">Any other Neon level</text><text x="310" y="262" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1">step 2: your choice</text><polyline points="110,274 110,300" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><polyline points="310,274 310,300" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><rect x="20" y="300" width="380" height="60" rx="8" fill="#2563eb" fill-opacity="0.1" stroke="#2563eb" stroke-width="1.5"/><text x="210" y="324" font-size="12.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">Step 3(b): a Neon panel entry takes the budget&#x27;s level</text><text x="210" y="346" font-size="11.5" text-anchor="middle" font-weight="normal" fill="currentColor" fill-opacity="1" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">large → xhigh · medium → high · small → medium</text><polyline points="210,360 210,384" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" marker-end="url(#ah)"/><rect x="20" y="384" width="380" height="40" rx="8" fill="#2563eb" fill-opacity="0.12"/><text x="210" y="409" font-size="11.5" text-anchor="middle" font-weight="bold" fill="currentColor" fill-opacity="1">Writes the rule. # defaults: 3 stays, so no rerun prompt</text><rect x="428" y="168" width="192" height="192" rx="8" fill="#d97706" fill-opacity="0.1" stroke="#d97706" stroke-width="1.5"/><text x="440" y="192" font-size="11.5" text-anchor="start" font-weight="bold" fill="currentColor" fill-opacity="1">Observed: the old rule&#x27;s</text><text x="440" y="215" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">interrogate reviewers had</text><text x="440" y="238" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">gemini-4-neon-medium.</text><text x="440" y="261" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">A rerun at large wrote</text><text x="440" y="284" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">gemini-4-neon-xhigh.</text><text x="440" y="307" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">To keep a lower level, pick</text><text x="440" y="330" font-size="11.5" text-anchor="start" font-weight="normal" fill="currentColor" fill-opacity="1">a lower budget or edit in 3(c).</text><polyline points="428,330 402,330" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.5" stroke-dasharray="4 4" marker-end="url(#ah)"/></svg></figure>

*Figure: how `setup-pstack` 0.15.48 handles Gemini entries in an old rule, with the observed result on the right. Rules from step 2 and step 3(b) of `setup-pstack/SKILL.md`. [7]*

The input is a rule file in the 0.15.43 format with four kinds of Gemini entry: `gemini-4-carbon-high` in `arena runners`, `gemini-4-neon-high` in `arena cross-judge pool`, a hand-picked `gemini-4-neon-medium` in `interrogate reviewers`, and `gemini-4-carbon-high` in `judgment and prose`, which is not a panel role. `/setup-pstack` runs in OpenCode on the same free model. The run is non-interactive, so the prompt carries the list of available models and the answers up front: the `large` budget, accept as-is, and no to both optional offers in steps 7 and 8. The rule file lives in a temporary home directory.

![setup-pstack in a real run: all three Gemini panel entries become gemini-4-neon-xhigh, and gemini-4-carbon-high in judgment and prose stays](/assets/pstack-0-15-48-reframe-hands-on/setup-gemini-migration.webp)

*Figure: the `/setup-pstack` output and the diff of the rule file.*

The result matches the written rules. All three panel entries became `gemini-4-neon-xhigh`. The Carbon entry in `judgment and prose` stayed, and so did `bug-fix: inherit-parent`.

One line deserves a closer look: `gemini-4-neon-medium`. Step 2 calls it your choice and keeps it. Step 3(b) then sets every Neon panel entry to its budget level, and `large` means `xhigh`. Put the two steps together and a hand-picked `medium` always comes back as `xhigh` under `large`. The model wrote the right value but filed this line under "Replaced 3 old panel defaults", which is the wrong reason. The outcome is fine. The lesson is that editing the rule file won't keep a low Gemini level on a panel. Choose the `medium` or `small` budget, or change the role at step 3(c), and expect to change it again on every rerun.

Claude Code users can skip this section. The Claude Code adapter maps the default `gemini-4-neon-xhigh` to `inherit-parent`, so that seat runs on the parent session's model. [8]

## /statechart runs on Windows now

0.15.46 has one fix, and the bug behind it is a good one. On native Windows, `/statechart` called `/bin/sh` in two places, the process-group kill and the cleanup janitor, so it couldn't start at all. The quieter problem is that TLC on Windows ends lines with `\r\n`, including the `@!@!@ENDMSG` marker that closes each message. The readers split on `\n` only, so the marker regex failed and every later message nested inside the first. A spec with a broken rule stopped with "TLC exited 12 ... but its output names no rule that broke". A spec where every rule holds could exit 0 with the wrong reason in its report. [6]

The fix is a `splitLines` helper that splits on `\r?\n`, used by every reader of TLC's output. The group kill moved to `kill.ts`, which calls `taskkill /t /f` on Windows. The janitor is now `janitor.ts`, started by the command's own runtime. On macOS the author forced real TLC to print `\r\n`, and the 33 corpus cases went from 8 passing on main to 33. The author also says plainly that nothing ran on Windows, so every Windows claim is inferred.

The CI checks, run here on Linux:

![Repo checks at cursor/plugins 9e278fe: validate-plugins passes, the harness tree is up to date, check-pstack-docs reports 0 problems, and node --test runs 374 tests with 304 passing, 0 failing, and 70 skipped](/assets/pstack-0-15-48-reframe-hands-on/repo-checks.webp)

*Figure: the repo's own checks and tests at `9e278fe`, the 0.15.48 merge commit of `cursor/plugins`.*

The suite grew from 340 tests in the last post to 374, and passes went from 270 to 304, with none failing. The 70 skipped tests need Java and TLC, which this machine doesn't have. `check-pstack-docs` now counts 59 skills and 35 commands, all 35 named in the guide. `/reframe` didn't land as a lone file. The README, the `poteto-help` routing table, and guide chapter 2 all list it.

## Reactions on X

![Lauren Tan announcing /reframe on X: you can only prompt what you can imagine](/assets/pstack-0-15-48-reframe-hands-on/x-poteto-reframe.webp)

*Figure: @poteto's post, 08:50 on November 24, 2026, Shanghai time. [10]*

The announcement is one line, "you can only prompt what you can imagine", plus a note that the skill is for when you know what you want but struggle to say it, and that it pairs well with `/sharpen`. [10] Three days earlier, the v0.15.46 update post about shorter skills and Gemini 4 Neon joining the panel drew more than 3,900 likes. [11]

![Lauren Tan's v0.15.46 update post: much shorter skills, Gemini 4 Neon added as a panel reviewer, auto-updated for Grok Bot and Cursor users](/assets/pstack-0-15-48-reframe-hands-on/x-poteto-0-15-46.webp)

*Figure: @poteto's v0.15.46 post, 01:03 on November 21, 2026, Shanghai time. [11]*

Two questions in the replies have answers above. One reader asked whether `/reframe` stays inside your own domain's vocabulary or borrows from neighboring fields. [12] It does both, since neighboring fields are a fixed step, and every run above returned three of them. Another asked which to reach for first, `/reframe` or `/sharpen`. [13] The guide's order is `/reframe` first, then send the rewrite or run `/sharpen` on it. [9] A user one week into pstack says that running `/sharpen` before `/poteto-mode` seems to improve accuracy. [14] I'd chain all three. `/reframe` settles what the thing is called, `/sharpen` settles how deep to go, and `/poteto-mode` does the work.

A naming note. Back in March, someone shared an unrelated Claude Code slash command that is also called `/reframe`. It applies a reframing technique from cognitive science. [15] In Claude Code, pstack's version is `/pstack:reframe`, so the two don't collide, but watch which one a tutorial is about.

## What I tested and what I didn't

What actually ran:

- Claude Code 2.1.278 upgraded pstack from 0.15.43 to 0.15.48. I confirmed the version, the 59 skills, and the token estimates.
- A file-by-file comparison of the `pstack/` trees in 0.15.43 and 0.15.48. `SKILL.md` bodies went from 26,346 to 26,709 words. Of the 363 new words, 202 are `reframe` and 102 are the `setup-pstack` migration rules.
- Three `/reframe` runs with the 0.15.48 `reframe/SKILL.md` on OpenCode 2.3.2 and a free model, with every final citation checked.
- One `/setup-pstack` run with the 0.15.48 `setup-pstack/SKILL.md` on an old rule file holding four kinds of Gemini entry.
- `validate-plugins`, `generate-pstack-harness-trees --check`, `check-pstack-docs`, and CI's `node --test`.

What didn't:

- A real `/reframe` session in Claude Code or Cursor. Claude Code isn't logged in, and the machine has no Cursor.
- `/reframe` on Opus 5.5, pstack's default. All three runs used a small free model.
- An interactive `/setup-pstack`. The budget and confirm answers were written into the prompt, and the model list was pasted rather than detected from the Task tool.
- `/statechart` on Windows, and the 70 tests that need Java and TLC.

My verdict: upgrade, and make `/reframe` part of how you start work. It costs about 50 tokens per session and about 270 per use. It never touches your code. It only helps you say what you want precisely, and that is often the hardest part of a task. The 0.15.48 candidate step fires on nearly every input, but the alternative readings it lists are usually worth a glance. If you saved a rule file, rerun `/setup-pstack` once and look at which Gemini entries it moved to Neon.

## References

1. cursor/plugins PR #1324, feat(pstack): add /reframe to learn the expert words for what you're building: <https://github.com/cursor/plugins/pull/1324>
2. cursor/plugins PR #1326, feat(pstack): have /reframe list the problems a vague description could be: <https://github.com/cursor/plugins/pull/1326>
3. pstack 0.15.48, `reframe/SKILL.md`: <https://github.com/cursor/plugins/blob/9e278fe4d4ecd8bfe98b1b79bf4be662efb338cc/pstack/skills/reframe/SKILL.md>
4. cursor/plugins PR #1283, chore(pstack): route the Gemini seat to Gemini 4 Neon: <https://github.com/cursor/plugins/pull/1283>
5. cursor/plugins PR #1284, chore(pstack): run the Gemini panel seat at gemini-4-neon-xhigh: <https://github.com/cursor/plugins/pull/1284>
6. cursor/plugins PR #1292, fix(pstack): run /statechart on native Windows and read TLC's \r\n line ends: <https://github.com/cursor/plugins/pull/1292>
7. pstack 0.15.48, `setup-pstack/SKILL.md`: <https://github.com/cursor/plugins/blob/9e278fe4d4ecd8bfe98b1b79bf4be662efb338cc/pstack/skills/setup-pstack/SKILL.md>
8. pstack 0.15.48, Claude Code adapter: <https://github.com/cursor/plugins/blob/9e278fe4d4ecd8bfe98b1b79bf4be662efb338cc/pstack/docs/harness/claude-code.md>
9. pstack 0.15.48, guide chapter 2, `02-poteto-mode.md`: <https://github.com/cursor/plugins/blob/9e278fe4d4ecd8bfe98b1b79bf4be662efb338cc/pstack/docs/guide/02-poteto-mode.md>
10. @poteto on X, announcing /reframe (2026-11-24): <https://x.com/poteto/status/2125029185379008573>
11. @poteto on X, the v0.15.46 update (2026-11-21): <https://x.com/poteto/status/2123824683862855898>
12. @AnthonySunAI on X, reply (2026-11-24): <https://x.com/AnthonySunAI/status/2125035809854402936>
13. @RushabhShah on X, reply (2026-11-24): <https://x.com/RushabhShah/status/2125034855620645367>
14. @ddpi_dev on X (2026-11-23): <https://x.com/ddpi_dev/status/2124668618067845409>
15. r/ClaudeAI, an unrelated /reframe slash command (2026-03): <https://www.reddit.com/r/ClaudeAI/comments/1s51msf/made_a_reframe_slash_command_for_claude_code_that/>
16. OpenCode docs, Skills: <https://opencode.ai/docs/skills/>
17. cursor/plugins, `validate-plugins.yml`: <https://github.com/cursor/plugins/blob/9e278fe4d4ecd8bfe98b1b79bf4be662efb338cc/.github/workflows/validate-plugins.yml>

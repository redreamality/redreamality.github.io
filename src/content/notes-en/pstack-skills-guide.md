---
title: "pstack's 51 Skills: How to Use poteto's Engineering Workflow in Cursor"
description: "pstack, the plugin Lauren Tan (poteto) open-sourced, ships 51 skills. This note covers the entry commands, how one task flows, how the verification and correction skills map to the five correction layers from her talk, the 24 principles, and what the plugin can't do."
date: 2026-10-08
source: "https://github.com/cursor/plugins/tree/main/pstack"
tags: ["ai-agents", "agent-harness", "ai-coding", "code-review", "Cursor"]
lang: "en"
translatedFrom: "pstack-skills-guide"
---

pstack is a Cursor / Grok Bot plugin by Lauren Tan ([@poteto](https://x.com/poteto)). Install it and you get 51 skills: the engineering habits she uses for her own coding every day. It's for people who already write code with agents but don't yet dare to let them run on their own. In her talk she argued that trust has to come before parallelism, and she laid out which layer a correction belongs in. We wrote that up here: [Trust First, Then Parallel](/blog/lauren-tan-poteto-trust-before-parallel/). You can read pstack as those ideas turned into skills. In the talk she said she wouldn't go into the plugin that day, so this note fills that gap.

First, the scope. Details below follow the public repository, [the pstack directory in cursor/plugins](https://github.com/cursor/plugins/tree/main/pstack). When I checked it, the plugin was at version 0.15.15, MIT licensed. The repo changes often, so details like default models and the playbook count may change later.

## What it's trying to fix

The README opens with "if you want to go fast, go deep first." Her view is that agents produce too much filler code right now, throughput without quality, and she doesn't want that. pstack's goal isn't more lines of code. It's the opposite: write less, but higher quality code.

The second claim runs along the same line as the talk. When you can go deep on one agent and trust it to hand back verifiable code, you can run several at once with confidence. She calls this fearless parallelism.

The third point is models. pstack isn't tied to any model, and many skills are multi-model by design: the same job goes to models from different families to do or review, using each one's strengths.

One stance deserves its own mention. pstack has no planning skill. In the README she says she personally doesn't believe in planning first, and that "the best spec is code." If you do want a plan, `/poteto-mode` has a playbook for it, but it isn't a default step.

On usage, she said in a post that in the week it was open-sourced, May 2026, the engineering team used these skills about 10,000 times. That's her own claim, not an independent count.

## Install and the two entry commands

Install the plugin from a Cursor chat:

```text
/add-plugin pstack
```

After that you only need to remember two commands.

The first is `/setup-pstack`. It detects which models your account can actually call, asks how large a reasoning budget you want (four levels: unlimited, large, medium, small; the default matches large, which is xhigh), and then lists which model each role uses for you to confirm. Roles include code writing, judgment and prose, and several review panels. Once you confirm, it writes an always-applied rule (a rule loaded into every session) at `~/.cursor/rules/pstack-models.mdc`, and every skill reads it. A role with no line falls back to the skill's built-in default. Setting a role to `auto` or `inherit-parent` makes that subagent use your current chat's model. Per the current README, code work goes to Grok by default, while the hardest changes, prose, and judgment go to Opus 5.5, and the default review panel takes one model from each.

At the end, setup also checks whether your project has any way to prove app behavior. If it doesn't, it offers once to generate one with `/create-verification-skill`. The guide's advice for newcomers is to say yes, because this step pays off the most. More on that below.

The second is `/poteto-mode`, which you use at the start of a task. Plain Enter applies it to that one message only. If you pick it from the slash menu with Option+Enter (Mac) or Alt+Enter (Windows), it becomes a custom mode and stays in context on every turn until you exit. Custom modes are currently available in Cursor's agents window and the CLI.

If you're unsure which skill to use, ask `/poteto-help`. It answers the question, gives you a prompt you can send as-is, and names the file the answer came from. It won't start the work for you, because a pstack run spends a fair amount of tokens.

### Entry and setup (4)

| skill | in one line |
| --- | --- |
| `poteto-mode` | Main entry point: picks a playbook, builds a task list, calls other skills as needed, and wants evidence before it reports done |
| `poteto-help` | Where you ask "which one should I use"; gives an answer and a prompt to send, doesn't start work |
| `setup-pstack` | Detects available models, sets a model and reasoning budget per role, writes them into one global rule |
| `automate-me` | Distills your working habits from recent chats into your own `-mode` skill |

`automate-me` is worth a closer look. `poteto-mode` is one person's style, and it may not suit you. `/automate-me` goes through your recent conversations in the current workspace, finds preferences you keep repeating (how replies should read, how to delegate, how to verify, what you expect of code and prose), asks which of them are really you, and then drafts a `<your-name>-mode` skill through Cursor's built-in `create-skill`. It runs the draft through `unslop` and opens a PR from a worktree for you to review. Underneath, it still runs on pstack's machinery.

## How one task flows

What `/poteto-mode` does breaks down into these steps:

1. It reads your request, reads the principles index first, and then picks a matching playbook out of 23. A playbook is a fixed, written procedure: bug fix, perf, feature, refactoring, prototype, babysit (watch a PR until it's merge-ready), shipping, autonomous run for overnight work, and so on.
2. It opens a task list whose first items are the playbook's steps, copied in verbatim. If it decides to skip a step, the step doesn't disappear. It stays in the list marked `skip: reason`, so you can see what it chose not to do.
3. When a step needs something, it calls the matching skill, such as `how`, `architect`, `interrogate`, or `unslop`.
4. The reply has to name which principle it applied and which decision that principle changed. The guide says plainly that citing a principle with no decision behind it is name-dropping.
5. Before reporting done, it has to show evidence. Each claim is labeled as measured, inferred, or a guess.
6. Every playbook that changes code ends with the "open a PR" step: work from a worktree, arrange small ordered commits, clean the diff, and strip AI tells from the description.

A few more default behaviors. Reversible work just proceeds without asking "should I?". Irreversible actions always stop and wait for you: force-pushing to a shared branch, deploying, deleting data, messaging customers. When it spawns a subagent, it starts a fresh one by default and hands over the original brief plus every later directive, instead of resuming an old session, because resumed sessions tend to drop directives.

For writing prompts, the guide lists five things: the goal, a done condition that can pass or fail, the evidence you want to see, clues you already have, and the real constraints (such as "repro first", "don't change code yet", "zero behavior change"). It suggests leaving two things out: how exactly to do it, and your guess at the cause, at least at first, so the agent doesn't search only where you pointed. The most common mistake is listing a skill order in the prompt, as in "first /how, then /architect, then /arena." The playbook already sequences them, and a hand-written order usually drops or reorders steps. Name a skill only when you want to override a specific default.

## Getting work done and running it in parallel

This group covers how work is split up before and during implementation.

`architect` sketches the skeleton before code: how callers use it, types, function signatures, module boundaries, with empty function bodies. It first uses `how` (and `why` when needed) to understand the code being changed, then uses `arena` to have several models each produce a sketch, and only implements after synthesizing them. By default it goes straight from the synthesized design into implementation. If you want to see the design first, say "with checkpoint, stop before implementing." If implementation shows the same patch being needed all over the place, or types that only compile with `any` and forced casts, it treats that as evidence the design is wrong and starts over instead of patching around it.

`arena` and `swarm` both run in parallel but serve different purposes, and the guide lists mixing them up as a common mistake. With `arena`, N subagents each attempt the same brief. A read-only judge (on a different model family when your configuration allows) scores them against a rubric. The lead agent picks the best one as the base, grafts in the strengths of the others, and verifies the result. With `swarm`, the work is cut into independent slices, or several routes race. Each worker owns its slice and reports PASS, ISSUES, or BLOCKED, and everything rolls up into one report, with no base-picking or grafting. Use arena to compare designs. Use swarm for coverage.

`figure-it-out` is the fallback when no playbook fits: it first designs an auditable playbook, then runs it. Large migrations, multi-part changes, and work you'll review after stepping away get routed here by `poteto-mode` even when the feature playbook would fit. It requires "done" to be written as a falsifiable condition first, and it hooks in `show-me-your-work` to keep a decision log.

`show-me-your-work` is that decision log: one TSV file, one row per decision, with columns for time, phase, what was done, why, evidence (a pointer such as a commit, PR number, file and line, or screenshot path, never a paragraph), and result. It stays local by default. Commit it when the work is big enough that a reviewer needs the trail to trust the result.

| skill | in one line |
| --- | --- |
| `architect` | Settle caller usage, types, signatures, and module structure before implementing; start over if implementation proves the design wrong |
| `figure-it-out` | When no playbook fits, design an auditable procedure first, then follow it |
| `arena` | N candidates for the same brief in parallel; pick one as the base and graft in the others' strengths |
| `swarm` | Slice the work or race it with N parallel workers, then return one aggregated report |
| `tdd` | Only when you explicitly ask, or the bug has a cheap local test path: write the failing test first, then fix |
| `show-me-your-work` | A TSV decision log for long or unattended work, one row per decision |
| `make-bot-ui` | Build a small page whose buttons wake a Grok Bot over a webhook, keeping the key on a local server |

## Verification and correction, mapped to the talk's five layers

This is the most interesting group in pstack, because it runs along the same line as the five correction layers in the talk. A quick recap of those layers, strongest first. Layer one is the codebase and architecture: make the bad pattern impossible to write as a category. Layer two is static analysis: lint, compilers, CI. Layer three is rules, Bugbot, and skills, where things move from enforcement to guidance. Layer four is style guides and human review. Layer five is verification skills, which can prove whether a feature works but don't prove performance or code quality.

The mapping below is this note's own arrangement by what each skill does. It isn't a table she has published:

| Layer in the talk | Matching pstack skills |
| --- | --- |
| Layer 1: architecture | `correct`'s first choice; `no-comments` turning constraints claimed in comments into constraints in code |
| Layer 2: static analysis | `correct` falling back to types, lint, and CI; the `encode-lessons-in-structure` principle |
| Layer 3: rules and skills | `reflect` turning one session's lessons into skill edits; pstack as a whole also lives here |
| Layer 4: human review | `interrogate` running adversarial review across several models; Comment Sicko inside `no-comments` is also a reviewer |
| Layer 5: verification | `create-verification-skill`, `maintain-verification-skill`, the `prove-it-works` principle |

### correct: move repeated corrections out of the prompt and into the repo

`/correct` is close to the talk's ordering turned into a skill. It first reads recent commits, reverts, review comments, agent instruction files, and comments that explain workarounds, and it groups mistakes into classes. A class counts once it has happened twice. Then each class gets fixed at the highest level that works. First it tries architecture: give each piece of state one owner, give each task one supported way, hide internals so the wrong import fails outright, and delete old patterns agents would copy. If that doesn't work, it uses types. If bad code still compiles, it adds a lint or CI check whose error says which file, type, or function to use instead. Failing that, it writes a test. Docs and agent rules come last and are reserved for judgment calls, because nothing fails when an agent skips a rule.

It also requires every new check to prove it fails on a real past mistake, and it keeps a table in the agent instruction file pairing each rule with whatever enforces it. If nothing enforces a rule and the mistake happens again, that counts as a repeat, and it gets fixed at a higher level in the same change. The guide adds one more line: human review isn't on this list, because a person having to catch the same mistake on every PR is exactly the problem this solves.

### no-comments: comments get reviewed by someone who didn't write them

`/no-comments` spawns a read-only subagent called Comment Sicko whose only job is reviewing comments. The reasoning is simple: the agent that wrote a comment will defend it. Comment Sicko keeps very few kinds: license headers, doc comments on a public API, links that explain what the code can't, and behavior forced by an external dependency you can't change. Everything else goes. If a comment explains something odd in your own code, that's treated as a signal that the code should be refactored, and `/no-comments` fixes it at the root instead of polishing the comment. When a comment states a constraint like "do not remove" or "talk to so-and-so before changing," it offers to turn it into a type, a runtime check, a test, or a lint. If you agree, it encodes the constraint first and then deletes the comment.

This is the same worry as the part of the talk about comments: agents use comments as an excuse not to fix the real problem, and whatever is in the repo gets copied by the next agent. In the talk she described her team's framework, Dune, banning comments outright. Dune is an internal framework and isn't part of pstack. In pstack, this skill is the counterpart.

### Verification skills: create and maintain

`/create-verification-skill` generates a project-local verification skill at `.cursor/skills/verify-<app>/`. It interviews the repo, not you: what the user actually touches (web UI, CLI, desktop app, API), how the app starts locally, what can drive it (an existing test harness first, otherwise a browser with CDP, a PTY, or plain HTTP), what evidence can be captured, and whether two instances can run side by side. It asks you only what the code can't answer.

The generated skill has fixed sections: launch, doctor (a read-only check of whether this instance is worth driving), drive, evidence, and cleanup. There's also a feature map, one file per user-facing feature, describing how to reach it, how to drive it, and what result proves it works. Before handing it over, the generator runs the skill end to end once: launch, doctor, drive one feature, capture evidence, clean up, and the evidence must still exist after cleanup. If that run fails, don't use the output.

`/maintain-verification-skill` is the regular upkeep. The guide suggests running it at least once a day, ideally from a scheduled automation. It sends one read-only subagent per feature to read the source and check for doc drift, then one live session drives every feature on the map. There are only three outcomes: clean (full coverage, nothing to change), changed (one PR, touching only the verification skill's own directory), and blocked (with the blocker named). It never edits product code. If the live pass catches a product regression, it reports the regression instead of editing the docs to hide it.

If you've read our write-up of the talk, the structure will look familiar. It resembles the internal verification skill she described: a reproducible way to drive the app plus a feature map written to disk. But the one she described, Control Glass, is internal, not public, and not in pstack. What pstack gives you is the tool for generating that kind of skill.

### Numbers and blast radius: benchmark-checklist and blast-radius

The talk pointed out that a verification skill proves whether something works, not whether it's fast. pstack covers that with `benchmark-checklist` and the `explain-the-number` principle. Before you report a performance number, it asks you to answer seven questions with evidence from real runs. What limits the number, and why isn't it double? Was every side tuned the way production runs (release builds, production config, the same cache warmth)? Does the result break a physical limit, such as disk bandwidth or core count? Did anything error or produce wrong output? Does it reproduce over alternating runs, with a median and a range? Does it matter on the path users actually wait on? Did the work really run inside the timed region? There are four verdicts: faster, slower, no measurable difference, or inconclusive. If it can't name the limiter or one side ran untuned, the verdict is inconclusive.

`blast-radius` handles a different question: what a small diff you don't quite trust could break outside the diff. Its core idea is not to trust your own convincing write-up. Find the one or two facts the change is safe because of, then write a small script or test and actually run it to prove them, instead of writing an argument.

### interrogate and reflect

`/interrogate` sends the same diff, intent, and rubric to models from different families, and each one looks for problems on its own. The point is model diversity, not assigned personas: an issue two models raise independently is the most credible. The lead agent acts as a pragmatic senior engineer and sorts the findings into four groups, "act on," "consider," "noted," and "dismissed," with a reason for every dismissal. It doesn't change code automatically. The guide reminds you to read the dismissals too, since the lead isn't an oracle. Also, don't point it at an abstract plan with no code behind it. The reviewers will invent risks that will never happen.

`/reflect` is for after a task: it spawns three parallel review subagents over the current conversation, each drawing lessons from a different angle (judgment, tooling, divergent), and a synthesizer sorts them into accepted, rejected, and backlog. Items that could be enforced by a lint, a script, or metadata get moved to the backlog, to be fixed at a higher layer. Accepted items wait for your approval before any skill changes, because changing a skill affects every future agent. The guide draws the line clearly: `/reflect` improves skills from one session, and `/correct` changes the repo so a class of mistake can't come back.

| skill | in one line |
| --- | --- |
| `create-verification-skill` | Generates a project-local skill that drives the app like a user, with a feature map, self-tested before handoff |
| `maintain-verification-skill` | Periodically reads the source per feature and drives every feature live so the skill and feature map don't go stale |
| `benchmark-checklist` | Checks whether a performance number is real, with seven questions, before you report or act on it |
| `blast-radius` | Finds what a change could break outside the diff, and proves the fact it's safe because of by running real code |
| `correct` | Fixes mistakes agents keep repeating in this repo, in the order architecture, types and lint, tests, docs |
| `no-comments` | Sends Comment Sicko to review comments, deletes what should go, turns claimed constraints into code constraints |
| `interrogate` | Models from different families adversarially review a diff; the lead sorts the verdict and changes nothing automatically |
| `reflect` | Three subagents mine the current conversation for lessons; once you approve, they become edits to existing skills |

## Understanding code: how, why, teach, recall, bro

This group is all read-only, for use before you change anything. According to the guide, agents usually fail for one of two reasons: they misread what you want, or they lack the context to do the job right. This group handles the second one, and it also makes the agent explain its understanding in words you can check.

`/how` answers "how does X work," plus questions like "where should this live, which package owns it, is this the right layer." The aim is to explain it the way a senior engineer onboards someone onto a subsystem: enough to build a mental model, without turning into annotated source code. For a narrow question it just reads and explains. For a big subsystem it first runs several read-only explorers in parallel, then hands off to one explainer.

`/why` answers "why is it like this": design rationale, why Y was picked, regressions, postmortems, whether a threshold is backed by data. It starts with source control, then checks which MCPs you have connected and queries the issue tracker, long-form docs, chat, monitoring, error tracking, and the data warehouse in parallel. The report cites its sources and separates direct evidence from inference. When nothing turns up, it says so, because "nobody wrote down why" is itself an answer.

`/teach` sits on top of those two: it runs `how` and `why` (maybe only one for a small change), then weaves the results into one plain explanation built up diagram by diagram. It's for when a summary isn't enough and you want to really understand something. You can also use it to question the agent's own choices, for example why it implemented something this way instead of with a queue, and what it traded off.

`/recall` is for before you start or resume something. From your own chat history plus the shared record (user reports, past fixes and reverts, errors still firing), it rebuilds where a topic stands and hands back a short current-state brief. If you want to continue one specific old session, that's the session pickup playbook, not this.

`/bro` is the simplest: it restates the last reply in plain words, no jargon, shorter. Use it when a reply is technically thorough and you still can't tell what it said.

| skill | in one line |
| --- | --- |
| `how` | Explains how X works, walks the code before a change, says which layer it belongs in and who owns it |
| `why` | Digs up design rationale and history, queries evidence sources in parallel, cites them, and separates evidence from inference |
| `teach` | Runs how and why and explains a piece of work until you actually understand it, with diagrams that build step by step |
| `recall` | Rebuilds recent context from your chats and the shared record into a current-state brief |
| `bro` | Restates the last reply in plain language |

## Writing: technical-writing, unslop, typescript-best-practices

`unslop`'s description says it must always apply. It's a rule list for removing AI tells. Rules have stable numbers that other skills cite: hollow "-ing" phrases, vague attributions like "experts believe," a set of words AI overuses, "not just X, but Y," forced groups of three, synonym cycling, em dashes, mid-sentence colons, too much bold, a bold label at the front of every line, and so on. `poteto-mode` follows the same rules in its replies, for example no long dashes and one thought per sentence.

`technical-writing` is a layered technical writing standard for docs, RFCs, READMEs, PR descriptions, and commit messages. Each of the four layers asks one question. What kind of document is this (the Diátaxis framework, which splits docs into tutorials, how-to guides, reference, and explanation, one kind per document)? How do sentences address the reader (Google developer documentation style)? How much does each sentence carry (STE, the instruction rules of Simplified Technical English)? Can any sentence be read two ways (Global English, syntax aimed at non-native readers)? The goal is prose a tired engineer understands on first read. It also warns against overcorrecting: a sentence that follows every rule and still reads like a machine wrote it has failed.

`typescript-best-practices` grounds type discipline in TypeScript syntax: model variants with unions that carry a `kind` field, brand primitives that mean different things, treat external data as `unknown`, reach for the repo's runtime schema library before hand-writing type guards, and don't use `as` casually. The guide points out that it doesn't load on its own, so type `/typescript-best-practices` yourself when a task touches `.ts` or `.tsx` files.

| skill | in one line |
| --- | --- |
| `technical-writing` | A layered writing standard: pick the document type first, then handle sentences, density, and ambiguity |
| `unslop` | Removes AI tells from writing; meant to be always on |
| `typescript-best-practices` | Used when reading or editing .ts / .tsx, turning type discipline into concrete patterns |

## The 24 principles

The principles are 24 very short skills, one rule each. `poteto-mode` keeps an index of them, reads it at the start of multi-step tasks, and applies a principle when its trigger fires. They live in separate files so other skills can reference a principle by name and the index can point at the full rule.

For users, the most practical use of the principles is steering. You don't call them; you just say the name. If the agent is about to add a fourth adapter on top of three old ones, say "subtract before you add, delete the obsolete adapters first." If it claims it's done because the build passed, say "prove it works, run the real import flow and show me the written records." Each name points at a complete rule the agent has already read, so one phrase is more precise than a paragraph of instructions. It still has to say in its reply which decision the principle changed.

| group | principle | in one line |
| --- | --- | --- |
| core | `laziness-protocol` | When refactoring or sizing a diff, lean toward deletion and the smallest change; don't add layers of abstraction |
| core | `foundational-thinking` | Settle core types and data structures before writing logic, and work out what concurrent actors share |
| core | `redesign-from-first-principles` | When a new requirement arrives, redesign as if it had been a premise from day one instead of bolting it on |
| core | `attack-the-premise` | When two or more fixes sharing one premise fail at the same gate, go back and question the premise |
| core | `subtract-before-you-add` | Delete dead code, redundant validation, and leftover references first, then build on the cleaner base |
| core | `minimize-reader-load` | Count the layers between question and answer and the hidden state a reader must hold, and shrink both |
| core | `outcome-oriented-execution` | In phased rewrites or migrations, head straight for the target architecture; no throwaway compatibility code for smooth transitions |
| core | `experience-first` | In product and scope trade-offs, the user's experience beats implementation convenience; fewer, polished features |
| core | `exhaust-the-design-space` | For an interaction or architecture decision with no precedent, build two or three competing prototypes and compare them side by side |
| core | `build-the-lever` | For non-trivial work, build a tool first (codemod, script, generator) that does it or proves it, instead of working by hand |
| architecture | `model-the-domain` | For stateful or heavily branching logic, encode the domain rules in one structure instead of scattered conditionals |
| architecture | `boundary-discipline` | Concentrate validation and error handling at system boundaries, trust types inside, keep business logic pure |
| architecture | `type-system-discipline` | Make illegal states unrepresentable, parse external data at the boundary, don't lie to the compiler |
| architecture | `make-operations-idempotent` | Commands and processing loops converge to the same end state after crashes, restarts, and retries |
| architecture | `migrate-callers-then-delete-legacy-apis` | When introducing a new internal API, migrate the callers and delete the old API in the same wave |
| architecture | `separate-before-serializing-shared-state` | When several actors might write the same file, branch, or key, remove the sharing first, then consider serializing |
| verification | `prove-it-works` | Verify against the real artifact before declaring done; "it compiles" doesn't count |
| verification | `fix-root-causes` | When debugging, reproduce first and keep asking why until you reach the root cause; don't pile on null checks to silence crashes |
| verification | `sequence-verifiable-units` | Break multi-step work and commit / PR stacks into small units that each verify on their own, checking one before the next |
| verification | `test-behavior-not-implementation` | Call code the way users do and assert against literal expected values; rewrite or delete a test that would pass if every function returned nothing |
| verification | `explain-the-number` | Before trusting or reporting a measured number, explain what limits it and whether it measured what you think |
| delegation | `guard-the-context-window` | When context is filling up, hand bulk reading to subagents and keep only summaries in the main thread |
| delegation | `never-block-on-the-human` | Don't ask "should I?" on reversible work; do it, show the result, let the human correct afterwards |
| meta | `encode-lessons-in-structure` | The second time you write the same instruction, turn it into a lint, metadata, a runtime check, or a script |

The guide's advice is not to memorize this table. Skim it, and come back the day you see the agent do something one of these names would have prevented.

## Illustrative flow: fixing a performance regression

What follows is an illustrative flow to show roughly where each skill lands in one task. It isn't a fixed order she has published. Also, per the guide, you shouldn't write this sequence into your prompt. Let `poteto-mode` order it.

Say a list page got noticeably slower to open after a few PRs merged last week. You send one line:

```text
/poteto-mode the session list got noticeably slower to open after last week's merges. capture a baseline trace, find the cause, fix it, and show me before and after.
```

1. `poteto-mode` matches it to the perf playbook, and the first items in the task list are that playbook's steps.
2. Capture a baseline trace first. This step needs the control skill for the relevant surface to drive the app (those skills aren't in pstack; see the next section), or your project's verification skill.
3. The baseline number goes through `benchmark-checklist` first: is cache warmth the same, is it a debug build, did the work actually run inside the timed region. Every later number goes through it too.
4. Use `how` to explain the list's rendering and data-loading path, as grounds for hypotheses. The perf playbook also asks you to try ideas from cheapest to most expensive: first see whether the work can be skipped, then whether it can be done only once, done less, done later, done when the user isn't looking, done concurrently, and only then done cheaper. Stop as soon as an earlier one hits the target.
5. `explain-the-number`: before trusting the number, explain why it is what it is and what limits it.
6. `fix-root-causes`: find the real cause before changing anything. For example, find which code recomputes when it shouldn't, and fix it where the cause is rather than patching the layer where the symptom shows. If the fix crosses a function boundary, run `architect` first.
7. `prove-it-works`: after the fix, capture another trace on the real app and parse both artifacts to compare them. "Inconclusive" or measuring the wrong surface doesn't count as a pass.
8. `blast-radius`: this step isn't in the perf playbook; it's one you can add yourself. When the diff looks small but you don't trust it, type `/blast-radius` and have it find the fact the change is safe because of and prove it by running code.
9. Finally, open the PR: small commits, with the baseline, the post-fix number, the delta, and the artifact path in the description; run `no-comments` before review.

## What it can't do

**Skills guide; they don't enforce.** This is her own layering: rules and skills sit at layer three, where agents may forget to read them and people may ignore them. pstack as a whole lives in that layer. `poteto-mode` keeps skipped steps visible in the task list, but visible isn't the same as blocked. Also, except for `setup-pstack`, every one of these skills sets `disable-model-invocation: true` in its SKILL.md frontmatter, meaning the model won't load them on its own from the description. Either you type the slash command or `poteto-mode` calls them as part of a flow. Mistakes that really need to be stopped have to be pushed by `correct` down into the architecture, type, and lint layers.

**Multi-model depends on what your account has.** Part of the value of `interrogate`, `arena`, and `reflect` comes from models of different families cross-checking each other. `setup-pstack` only writes models it has confirmed you can use. If you only have models from one family, or set everything to `auto` to follow the current chat model, these skills still run, but the "two models independently found the same issue" signal gets weaker.

**`tdd` isn't a default step.** It's used only when you explicitly ask for TDD, a failing test, or a regression test, or when the bug has an obvious, cheap local test path. When a test would need a lot of setup, brittle mocks, or heavy end-to-end infrastructure, it says so and uses the closest executable check instead. The bug fix playbook also only suggests it when there's a cheap test path.

**Some things it references aren't in the package.** `/deslop` (cleaning filler out of code), plus `control-cli` and `control-ui` (control skills for driving CLIs, browsers, and Electron apps), are in a separate plugin, `cursor-team-kit`. `/create-skill` is built into Cursor. For the full set, install both plugins. The trace capture step in the performance example above depends on a control skill or your own verification skill.

**It costs tokens.** Subagents and review panels are extra spend. The guide's ways to save: lower the reasoning budget or pick cheaper models, put fast models in the code roles, shorten panel lists, and don't use `poteto-mode` for small, obvious edits.

**It's her style.** The default playbooks, tone, and principles come from one person's habits. If you don't want them wholesale, use `automate-me` to make your own mode. The default models reflect the current version and will change when Cursor's model lineup does. The repo also ships a dormant automation pack, benny, which triages issue reports from Slack and reproduces and fixes them. It isn't counted among the 51 skills, and neither are the two subagents, `poteto-agent` and Comment Sicko.

## Links

- [pstack on the Cursor plugin marketplace](https://cursor.com/marketplace/cursor/pstack)
- [pstack README](https://github.com/cursor/plugins/blob/main/pstack/README.md)
- [The pstack guide (10 chapters, from setup to overnight runs)](https://github.com/cursor/plugins/blob/main/pstack/docs/guide/README.md)
- [The pstack directory in the repo; every skill's source is under skills/](https://github.com/cursor/plugins/tree/main/pstack)
- On this site: [Trust First, Then Parallel: What Lauren Tan's Talk Actually Argues](/blog/lauren-tan-poteto-trust-before-parallel/)

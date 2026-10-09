---
title: "Co-Installed Agent Skills Silently Override Each Other: Tasks Pass, Constraints Vanish"
description: "A 20,947-repo study finds nearly 1 in 4 installed agent skills has a same-job rival, and swaps hide behind passing tasks. How loading works, plus a checklist."
pubDate: 2026-10-09T16:45:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "developer-tools", "Agent Skills"]
lang: "en"
---

## A read-only checkpoint skill gets pushed aside

A project ships a skill called `checkpoint` whose body opens bluntly: "This skill is READ-ONLY. It does NOT commit, push, or modify git state." With only that skill installed, you ask the agent for a durable handoff before you stop work on a CSV importer, and it writes a note under `.ai-context/checkpoints/`. Git is untouched.

Then someone adds a near-identical skill as `checkpoint-2`, which opens with "Create a checkpoint by committing work." Same request, same model (Haiku 4.5): the agent picks the newcomer, commits, and replies "Checkpoint committed" without naming the skill. Both runs complete the task, but the one rule the original skill existed for is gone [1].

That is Figure 1 of *One Skill Too Many: How Co-Installed Skills Conflict in Coding Agents*, posted to arXiv on October 8, 2026 by authors from UNSW and three other universities [1]. Rather than summarize it, this post reads it as an acceptance report: **the more skills you install, the less control you have over which instructions the agent follows — and "did the task pass," the check most teams use, is exactly what cannot see the loss.** The second half is a checklist.

This site has covered single-skill questions: the [Agent Skills 2026 survey](/blog/agent-skills-2026-survey-lifecycle-map/) maps the lifecycle from write to govern, and the [SkillSpector piece](/blog/nvidia-skillspector-agent-skills-trust-pipeline/) covers scanning a skill for malice. Those ask whether *one skill* is good or safe. This post is about composition: two benign skills, side by side.

## How skills are discovered and loaded

Implementations differ, but the skeleton comes from agentskills.io, whose client implementation guide describes three-tier progressive disclosure [4]:

| Tier | What loads | When | Rough cost |
| --- | --- | --- | --- |
| 1. Catalog | name + description | Session start | ~50–100 tokens per skill |
| 2. Instructions | Full `SKILL.md` body | When the skill is activated | <5,000 tokens recommended |
| 3. Resources | Scripts, references, assets | When instructions reference them | Varies |

The [Progressive Disclosure post](/blog/progressive-disclosure-agent-skills/) covered the upside: at 100 skills, eager loading blows up. The flip side: **when the model chooses between two similar skills, it sees only tier 1.** "Never touch git" lives in tier 2, read only after the choice.

Claude Code's docs are specific [2]: at session start a listing of skill names and descriptions goes into context; each skill's `description` plus `when_to_use` is truncated at 1,536 characters; the listing's budget is 1% of the context window, and on overflow descriptions are dropped starting with the least-invoked skills. The paper measured Claude Code 2.1.283: the listing is grouped by source (personal, project, plugin, bundled) and sorted by directory name. The 1% cap was about 8,000 characters for Sonnet 4.6 and Haiku 4.5 and 6,000 for Opus 5; under it, 95.8% of Opus 5 listings in the A+B setup would lose at least one of the two descriptions, so the authors raised the cap to 20,000 [1]. Real setups often give the model even less to go on.

The choice is also hard to trace. The model can invoke a skill via the Skill tool or simply Read or Bash into its directory; models often do the latter, so "which skill was used" must count both [1].

## Who wins on a name clash: vendors disagree, some in opposite directions

Claude Code's locations [2]:

| Location | Path | Same name as a skill elsewhere |
| --- | --- | --- |
| Enterprise | `.claude/skills/` in the managed settings directory | Overrides personal and project |
| Personal | `~/.claude/skills/<name>/` | Overrides project |
| Project | `.claude/skills/<name>/` (start dir and parents) | Overridden by personal and enterprise |
| Nested | `<subdir>/.claude/skills/<name>/` | Both load, directory-qualified |
| Plugin | `<plugin>/skills/<name>/` | Both load, namespaced `plugin:name` |

With `deploy` in both `~/.claude/skills/` and the project's `.claude/skills/`, `/deploy` runs the personal one [2].

Other tools chose differently. The agentskills.io guide calls **project-level overrides user-level** the universal convention and recommends logging a warning when a skill is shadowed [4]. Gemini CLI ranks built-in < extension < user < workspace, so the project wins [6]. Copilot CLI's docs say project skills beat same-named personal ones [7]. Codex scans `.agents/skills` from the working directory up to the repo root plus user, admin, and system locations, and lists both same-named skills without merging [5].

So a Claude Code user and a Gemini CLI user on one team get opposite results from a same-named personal fork. As the paper notes, a team shipping a project skill cannot guarantee members run its version [1].

The paper cites a real case, seasonedcc/seasoned-skills #303 (opened September 11, 2026): the project's generated `self-improvement` skill was shadowed by the maintainer's same-named personal fork, which targeted an unrelated repository — noticed only from the output. The engineer had assumed project skills win, the opposite of Claude Code's rule [8].

## How common: reconstructing "what's installed" in 20,000 repos

Starting from public `SKILL.md` files collected on July 18, 2026 across 20,947 repositories, the authors snapshotted each repo's file tree and applied Claude Code's loading rules to get 5,106 installation lists [1]. Embedding names and descriptions, they took ten nearest candidates per skill: 822,109 candidate pairs (439,860 cross-project, 382,249 within-project). An LLM judge reviewed a stratified sample of 3,754, confirmed 1,639 as "same job," and 312 runnable, scorable pairs entered the experiments [1].

The numbers worth remembering [1]:

- **Within the same installation list, about 23.5% of installed skills already sit next to a skill that does the same job** (95% CI 21.2%–25.7%), about 10,100 families. The paper calls this "nearly one in four."
- Counting skills by other authors that a user could add, the figure is 63.7%.
- In the 489 projects that copy a whole skill collection, 37% of judged skills have a same-job rival in the same list, versus 19% elsewhere.
- In conflicting pairs, the installed skill is mostly *normative* (60% cross-project, 56% within-project), then *capability* (31% and 35%); script-bearing is about 9%.

Also: below 0.9 description similarity, only 10%–37% of cross-project pairs per band were confirmed, so "worded alike" is not "same job" [1]. And the estimates are conservative, since public repos rarely show personal skills and plugins [1].

Supply keeps growing. Collections arrive whole: the GitHub API on October 9, 2026 showed mattpocock/skills at about 280,000 stars [12]. Consumer products are converging too: TechCrunch reports Google will migrate Gemini's Gems to skills from November 17, 2026 [10]. More sources make same-job collisions the norm.

## Why "the task passed" cannot see it

The paper's key move is measurement. It extracts each skill's **core functions**: requirements a competent model would usually *not* meet without the skill, quoted verbatim, and checkable in files, commits, commands, or the reply; prohibitions count. Each of A's core functions is labeled **exclusive** or **shared** depending on whether B asks for it [1]. 73% of the 2,518 applicable core functions were exclusive: same-job skills differ mostly in their specific rules [1].

Fidelity is the share met in a run. A+B versus A only, pair by pair [1]:

| Measure | A+B vs. A only |
| --- | --- |
| Runs that use A | −19.9 pp |
| Task completion | +1.9 pp (CI spans zero, not significant) |
| Fidelity of A (top three core functions) | −2.6 pp |
| A's exclusive core functions | −5.6 pp |
| A's shared core functions | +0.1 pp (no change) |

An unrelated skill C lowers use of A by only 5.9 pp with no fidelity change [1]. The problem is not one more skill, but one more skill doing the same job.

Why is pass rate blind? Two skills compete because either can finish the job, so the likelier a conflict, the less it shows. Normative skills are the extreme: the paper cites SWE-Skills-Bench, where 39 of 49 skills gave zero pass-rate gain [1]; such a skill can't lower the pass rate when displaced. Yet that's what teams write skills for: PR formats, commit conventions, safety rules.

With B present, 12.1% of runs use only B and 38.0% use neither (vs. 30.3% not using A when alone). Runs using only B carry 36% of the fidelity loss, runs using neither 45%, and runs using A but swayed by B only 20% [1]. The main failure is wholesale replacement, not blending.

## Who gets picked: location decides, order barely matters

Tool-selection studies report position bias; here, reversing listing order moved use of A by only +0.6 pp, while the one-character rename used to flip it added +4.4 pp [1].

Location is what decides. On the 81 same-name pairs [1]:

- B in the personal directory: A vanishes from all 243 listings, use of A drops 35.0 pp, and 46.5% of runs use B. Yet 29.2% still read A's project files — Opus 5 in 53.1%, though A isn't listed.
- B in a plugin: both are listed; B is used in only 2.9% of runs.

Models also differ sharply: in A+B, Opus 5 uses both skills in 36.8% of runs, while Haiku 4.5 uses neither in 56.4% [1].

Then disclosure. In the 113 runs where B replaced A, the reply named the skill used in 0.9%, mentioned multiple suitable skills in 0%, and asked the user to choose in 0% [1]. Across all A+B runs, 7.7% named a skill, mostly Opus 5 [1]. Don't count on replies to reveal a swap.

## The conflict is decided at the first read of a skill

Where to intervene, then? **At the first read of a skill.** In 79 model–pair combinations, changing listing order alone made runs open a different skill first; until that read they look alike (median 6 tool calls each), and opening B first cost 9.4 pp on A's exclusive core functions [1]. 97% of B-first runs had changed no file before opening B [1]: the decision precedes the work.

When B is opened first, 37% of the exclusive core functions A meets alone are lost, versus 8% of shared ones [1]. That's the "more than a third" figure — note the denominator (what A meets alone) and the condition (B opened first), not all runs.

The authors then tested a PreToolUse hook (fires before a tool call): while A is unread, deny the first read of B and tell the model to use A, naming no rule; once A is in use, keep denying B. Across 187 combinations, with and without the hook [1]:

- After a denial, the model switched to A in 96% of cases (Sonnet 4.6 94%, Haiku 4.5 96%, Opus 5 99%).
- Exclusive-core-function fidelity rose 9.1 pp overall, 17.8 pp where both runs reached for B first.
- Redirected runs matched A-first runs (0.0 pp), recovering the full 16.5 pp; task completion was unchanged.

Good news: the guard point is cheap, one file read before any change. Bad news: the hook must know which skill is A, and you have to declare it.

## Boundaries and counterexamples: the paper's numbers aren't yours

Before making this team policy:

1. **Full design on Claude Code only.** At about $5,550 in API cost, Codex got a check instead (gpt-5.5, gpt-5.6-luna, gpt-5.6-sol; 193 pairs): use of A −18.2 pp and exclusive core functions −3.4, close to Claude Code's 20.1 and 4.6 on the same pairs, task completion flat [1]. Gemini CLI and Copilot were not tested.
2. **Raised listing cap.** With default budgets descriptions get cut harder; real conflicts could be worse, or drift toward "use neither."
3. **One run per combination.** On 512 rerun combinations, agreement on use of A was 88.9% (ICC 0.78), core functions ICC 0.84 [1].
4. **LLM judging.** GPT-6 Astra confirmed pairs, extracted core functions, and judged outputs; human checks gave Krippendorff's α of 0.71–0.88, several under the 0.8 bar for firm conclusions [1].
5. **Constructed cross-project pairs.** But real within-project pairs show the same drop (use of A −18.3 pp) [1].

Two counterpoints. Not every swap is bad — if B is better, it's an upgrade, but that should be your decision, not the model's guess from a few hundred characters. And hooks aren't a cure-all: a PreToolUse hook on the Skill tool fires only when the model calls it; a user typing `/skillname` bypasses it, which UserPromptExpansion covers [3]. Since models also read skill files directly, match Read and Bash too [1][3].

## How this connects to the rest of the site

On this site's skills line:

- The [survey](/blog/agent-skills-2026-survey-lifecycle-map/)'s install section covers NVIDIA's semantic-overlap check before cataloging — a **publisher** deduplicating one catalog. This post is the **consumer's** side: project, personal, plugin, and collection skills nobody deduplicates across.
- [SkillSpector](/blog/nvidia-skillspector-agent-skills-trust-pipeline/) checks for malice. Every B here is benign, would pass a scan, and still displaces A's rules.
- [Progressive Disclosure](/blog/progressive-disclosure-agent-skills/) asks "does it fit?", [SkillDelta](/blog/skilldelta-selective-skill-activation/) "does injecting it help?" This adds: **is the loaded skill the one you think?**

LangChain's Deep Agents revamp takes a related route: tools bound to a skill fail as unknown until the skill is read, forcing read-before-call, and pinned skills are in context from the start [9]. Like the paper's hook, it constrains the read step instead of trusting the model's pick.

## Acceptance checklist: make "what's installed, what ran" checkable

### 1. Inventory every skill a session can actually see

Scan every location, not just the repo: `~/.claude/skills/`, project and parent `.claude/skills/`, nested dirs, plugins, `.agents/skills/` (Codex, Gemini CLI), `~/.gemini/skills/`, `~/.copilot/skills/` [2][5][6][7]. In Claude Code, `/skill-doctor` shows per-skill context cost and usage; `/context` shows the listing size after budgeting [2].

A rough start:

```bash
# List SKILL.md under common locations; print dir name and first description line
for root in ~/.claude/skills ./.claude/skills ./.agents/skills ~/.agents/skills \
            ~/.gemini/skills ./.gemini/skills ~/.copilot/skills; do
  [ -d "$root" ] || continue
  find -L "$root" -name SKILL.md -maxdepth 3 | while read -r f; do
    name=$(basename "$(dirname "$f")")
    desc=$(grep -m1 '^description:' "$f" | cut -c14-90)
    printf '%s\t%s\t%s\n' "$name" "$root" "$desc"
  done
done | sort > skill-inventory.tsv

# Report exact name collisions
cut -f1 skill-inventory.tsv | sort | uniq -d
```

Names are the easy case; only 81 of the 312 pairs shared one [1]. Review descriptions too, pre-filtering by embedding similarity if needed — similarity screens, it doesn't decide [1].

### 2. Deduplicate: copied collections are the hot spot

Collection-copying projects have nearly twice the rival rate [1]. Compare imports against existing skills; delete duplicates or set them `"off"`/`"name-only"` in `skillOverrides` without editing files [2]. For manual-only skills, add `disable-model-invocation: true` [2].

### 3. Write down precedence rules, per tool

Document it: Claude Code is enterprise > personal > project, plugin and nested both load; Gemini CLI and Copilot CLI are project-first; Codex lists both [2][5][6][7]. In Claude Code only the enterprise location outranks personal [2]. Avoid generic names (`checkpoint`, `deploy`, `review`) and describe specific tasks — the paper's two tips for authors [1].

### 4. Test exclusive constraints, not just task success

The biggest change, and most worth it [1]:

- Turn each MUST/NEVER requirement into a checkable assertion ("no new commits in `git log`," "output has the three required sections").
- Mark which are unique to this skill; those are what substitution loses.
- Co-install a similar skill in tests. Pass alone, fail together = conflict.
- Prefer scripts: script-decided losses were larger than LLM-judged ones (4.2 vs. 1.2 pp) [1].

### 5. Log which skill actually ran — from tool calls, not replies

Replies name the skill 0.9% of the time [1]. Hook input carries `session_id` and `transcript_path` [3]; a PostToolUse hook can log each Skill call and skill-directory read with time, session, path, and source location. Track "used neither" sessions too: 30.3% → 38.0% with a rival present [1].

### 6. Guard the first read with hooks

Two layers:

- **SessionStart check:** warn when a project skill has a same-named, different personal copy — what the #303 project built [8], and what agentskills.io recommends [4].
- **PreToolUse guard:** keep a "must win" list (project `checkpoint` beats any `checkpoint*`); for Skill, Read, and Bash calls targeting a rival before the winner is read this session, deny and name the skill to use.

```bash
#!/bin/bash
# .claude/hooks/guard-first-read.sh — sketch only; verify fields for your version
input=$(cat)
sid=$(echo "$input" | jq -r '.session_id')
target=$(echo "$input" | jq -r '.tool_input | tostring')
state="/tmp/skill-guard-$sid"
# Winner was read: note it and allow
if echo "$target" | grep -q '.claude/skills/checkpoint/'; then
  touch "$state"; exit 0
fi
# Rival read before winner: deny and redirect
if echo "$target" | grep -q '.claude/skills/checkpoint-2/' && [ ! -f "$state" ]; then
  jq -n '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",
    permissionDecisionReason:"In this project, use the .claude/skills/checkpoint/ skill"}}'
  exit 0
fi
exit 0
```

The deny format is from the hooks docs [3]; `tool_input` fields vary by tool, so this string-matches the whole input. If the Skill tool's input carries a name rather than a path, add a name match as well. Log real inputs first. Cover typed `/skillname` with UserPromptExpansion [3].

### 7. Rules that truly must not break don't belong only in a skill

Claude Code's docs advise moving must-hold rules into hooks, which run on every event regardless of whether the model follows the skill [2]. For "never touch git," add a PreToolUse hook blocking `git commit` instead of hoping the skill isn't displaced. Skills teach how; hooks catch what must never happen.

## Closing

Software engineering knows components that work alone and break together — package, dependency, and module-name conflicts, caught from metadata before anything runs [1]. Skill conflicts are settled by the model at run time from a few hundred characters, and hide behind "task completed."

The paper's prescription: score exclusive constraints separately, guard the first read, and show which skill ran [1]. Until platforms do, teams can inventory, deduplicate, document precedence, test exclusive constraints, log invocations, and guard first reads. Asking "what will this displace?" before installing beats digging through output later.

The replication package has the 312 cases, core functions and checks, the harness, and all run logs [1][11].

## Sources

[1] Chaoliang Yan, Zihao Xu, Yuekang Li, Shangzhi Xu, Yi Liu, Gelei Deng, Siqi Ma. *One Skill Too Many: How Co-Installed Skills Conflict in Coding Agents*. arXiv:2610.11647, 2026-10-08. https://arxiv.org/abs/2610.11647

[2] Anthropic. Extend Claude with skills (Claude Code docs). https://code.claude.com/docs/en/skills

[3] Anthropic. Hooks reference (Claude Code docs). https://code.claude.com/docs/en/hooks

[4] Agent Skills. How to add skills support to your agent. https://agentskills.io/client-implementation/adding-skills-support

[5] OpenAI. Build skills (ChatGPT and Codex docs). https://learn.chatgpt.com/docs/build-skills

[6] Google. Agent Skills (Gemini CLI docs). https://geminicli.com/docs/cli/skills/

[7] GitHub. GitHub Copilot CLI configuration directory. https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference

[8] seasonedcc/seasoned-skills. Issue #303: sync: generated skills can be silently shadowed by a same-named personal skill. https://github.com/seasonedcc/seasoned-skills/issues/303

[9] LangChain. Revamping skills in Deep Agents. https://www.langchain.com/blog/revamping-skills-in-deep-agents

[10] TechCrunch. Google is killing off Gemini's Gems in favor of 'skills' (2026-09-28). https://techcrunch.com/2026/09/28/google-is-killing-off-geminis-gems-in-favor-of-skills/

[11] ltroin/conflict (replication package). https://github.com/ltroin/conflict

[12] mattpocock/skills (GitHub repository). https://github.com/mattpocock/skills

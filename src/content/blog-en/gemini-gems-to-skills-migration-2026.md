---
title: "Gemini Gems Become Skills on Nov 17: Custom Assistants Turn into Stackable Slash Commands — What to Check Before Migration"
seoTitle: "Gemini Gems Become Skills Nov 17: Pre-Migration Checklist"
description: "Gemini Gems auto-migrate to skills from Nov 17, 2026 (Workspace 2027). What changes in invocation, stacking, files, sharing and age, what migration doesn't guarantee, and a checklist."
pubDate: 2026-10-12T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "Agent Skills", "developer-tools"]
lang: "en"
---

On September 27, a new line appeared at the top of the Gems manager in the Gemini web app: "Gems will become skills starting Nov 17, 2026." The sentence underneath was more specific: starting that day, Google will automatically begin migrating your Gems, and you can keep using each Gem until it migrates [2]. Three days later Google published an official blog post confirming that skills are coming into the main Gemini chat, that Gems will be phased out, and that existing data will migrate over automatically [1]. TechCrunch's Sarah Perez wrote it up on September 28 at 10:29 PDT (01:29 on September 29, Beijing time) as "Google is killing off Gemini's Gems," and added a jab: picking a skill by typing a slash is the kind of interface engineers like, not necessarily regular people [3].

If you use one or two Gems now and then, you can do nothing and Google will convert them. But if you've built up a dozen — a learning coach loaded with lecture notes, a copywriter wired to a brand handbook in Drive, a writing buddy that opens Canvas by default, a report template shared with your team — "automatic migration" hides several unstated details worth an afternoon of testing before November 17.

This post skips the enterprise governance questions already covered in the [Gemini Enterprise identity, audit and spend](/blog/gemini-enterprise-agent-identity-audit-spend-caps/) piece. It looks only at the consumer side: **once a "custom assistant" is broken into "composable instructions," what changes mechanically, what can get lost, and how to check ahead of time.** Facts come from Google's blog, Help Center and Workspace Updates; second-hand reporting is labeled; "My take" marks my own analysis.

## First, what exactly is changing

Gems launched in 2024; Google described them as "custom versions of Gemini" [2]. You gave one a name, wrote some instructions, attached a few knowledge files, and it became a standalone assistant with its own entry in the sidebar. Google's premade Gems included a learning coach, a brainstorming assistant, a career guide, a coding partner and an editor; user-made ones ranged from running coaches and nutritionists to vacation planners, and you could share a Gem with other people [3].

Skills take a different route. Per Google's Help Center, a skill is a set of reusable instructions plus context that teaches Gemini how to do a particular kind of task and which tools to use [5]. It differs from a Gem in three ways [4]:

- **Invoke anywhere.** In any Gemini chat, type `/` and pick the skill by name (the Help Center notes the shortcut is "soon to be `@`").
- **Automatic use.** Gemini decides whether your current prompt is relevant to an enabled skill and, if so, applies it on its own.
- **Stackable.** You can use several skills in the same chat, and a skill's instructions can reference other skills [5].

Google's blog example stacks a "writing style" skill with a "brand guidelines" skill to create on-brand assets in your voice [1]. With Gems you'd have built a dedicated "brand copy Gem" with both hard-coded; a different brand guide meant cloning it.

**My take:** this is a move from "pick an assistant to talk to" to "load capabilities onto the same assistant as needed." The unit of organization used to be a persona; now it's a task instruction. The visible change is the entry point: instead of finding the Gem in the sidebar and chatting on its page, you hit `/` in any chat. 9to5Google's Abner Li agrees: it beats scrolling to My Gems and is more unified in the long run [2][8].

## Mechanism comparison: how Gems and skills actually differ

Side by side, the Help Center docs are far more concrete than "more flexible":

| Dimension | Gem | Skill (docs as of 2026-10-12) |
| --- | --- | --- |
| How you use it | Open the Gem's dedicated page from the sidebar, then chat [6] | Type `/` (moving to `@`) in any chat, or Gemini triggers it automatically [4][5] |
| Composition | One Gem at a time | Stack several in one chat; skills can reference each other [5] |
| Knowledge files | Upload locally; attach Drive files, always reading the latest version; attach NotebookLM notebooks [6] | Upload only together with the skill; plain-text types, code, config, PDF and images supported; binaries like .docx/.xlsx not supported; total ≤100 MB [5] |
| Default tool | Can set Create image, Canvas, etc. as default [2] | Most default tools not yet supported: Create video, Create music, Canvas, Deep Research, Guided Learning [4] |
| Sharing | Share a Gem or a Gem conversation via link [6] | Sharing, Drive files and Gemini Notebook arriving "in the coming weeks" [1][4] |
| Age | 13+ (or applicable local age) on personal accounts [6] | 18+, with under-18 "coming soon" [1][5] |
| Platforms | Gems created on web appear in the mobile app and the Workspace side panel [6] | Currently mobile app, Mac app and web only; creating by upload only on Mac app and web [4][5] |
| File format | Google-proprietary | Built on the open SKILL.md standard; import skills from other platforms, download as .zip [4][5][7] |

Skills need no paid plan (Gemini Spark, tasks and schedules still do) [5][9]. A few rows deserve more explanation.

**Knowledge files go from "live link" to "snapshot."** When a Gem has a Drive file attached, Gemini always reads the latest version; edit the doc in Drive and the Gem follows [6]. Today a skill can only take files uploaded along with it, and updating files means re-uploading the entire skill with its reference files [5]. Google says Drive file support is coming in the next few weeks [1], but hasn't said whether it will keep the "read latest version" behavior. **My take:** a Gem running off a weekly-updated Drive doc (a price list, a roster) may quietly freeze at its migration-day version. Answers will read fine; the data will be stale.

**Scripts can be uploaded but can't go online.** Skills accept `.py` and `.sh`, but scripts needing internet aren't supported and can't act on or request external websites [5] — a big difference from coding-agent skills.

**Names must follow a format**: lowercase with hyphens, like `sample-skill-name`; manual recreation auto-converts it [4][5]. Non-Latin (e.g. Chinese) names aren't addressed.

## Timeline: line it up by account type

Sources phrase dates differently, so I checked each against primary sources:

| Account type | Key date | What happens | Source |
| --- | --- | --- | --- |
| Personal Google account | From Nov 17, 2026 (Google docs: "November") | Auto-migration begins; Gems usable until migrated, then unsupported | In-app notice [2]; [1][4]; TechRepublic relaying [9] |
| Opal and Gems by Google Labs | Nov 17, 2026 | Turned off; Labs Gems **do not migrate**, Opal workflows **do not migrate** | Google blog footnote [1], Opal FAQ [11] |
| Workspace (all types) | From Oct 5, 2026 | Skills begin rolling out in Workspace, expected complete mid-November | Workspace Updates [7] |
| Gemini app (Workspace users) | From Oct 13, 2026 | Skills begin rolling out in the Gemini app, expected complete mid-November | Workspace Updates [7] |
| Workspace (all types) | Nov 17, 2026 | Gems move into the Gemini app's Settings panel; still creatable, editable, usable | Workspace Updates [7] |
| Workspace business, enterprise, nonprofit | No sooner than Mar 1, 2027 | Gems can't be created, edited or used; Workspace Studio flows with an "Ask a Gem" step stop working; remaining Gems auto-migrate to **draft** skills | Workspace Updates [7] |
| Workspace education | No sooner than Jun 1, 2027 | Same, plus Gems removed from Google Classroom and third-party LMSs supported by Gemini LTI | Workspace Updates [7] |

Android Authority's September 30 report restates the same schedule and works as a cross-check [10].

A few places where it's easy to misread:

1. **"November 17" means different things for personal and Workspace accounts.** For personal accounts it's when migration *begins* [2]; for Workspace it's when Gems *move into the Settings panel but keep working* [7]. Actual shutdown for Workspace is in 2027.
2. **Workspace dates say "no sooner than,"** and Google promises to share auto-migration details with admins at least 30 days in advance [7], so March 1 is a floor, not a fixed date.
3. **Skills don't sync between the Gemini app and Workspace**; to use one in both, create it in each [7].
4. **Opal users must act themselves.** Workflow files stay in your Drive's "Opal" folder but won't become skills; the FAQ says copy out prompts before November 17 [11].

## What automatic migration guarantees — and what it doesn't

Break down the Help Center wording and Google commits to only these things [4]:

- When Gems go away, each Gem is automatically recreated as a skill;
- "Supported files" move along with it;
- If you don't want to wait, you can recreate it manually ahead of time.

Beyond that, the following are **not stated** in the docs, and I'd treat each as unknown:

**1. Whether migrated skills are active or drafts.** The Workspace post explicitly says "draft skills" [7]; the personal-account doc just says Gems are "recreated as skills" [4]. If personal accounts also get drafts or skills that start disabled, they won't trigger automatically — you'll have to turn them on in Settings yourself.

**2. Who writes the description.** I think this is the most important point. A skill triggers automatically because Gemini judges "which skill is relevant to the current prompt" [5]. In the open Agent Skills specification, the basis for that judgment is the `description` field in the frontmatter: the spec requires it to say what the skill does and when to use it, and every skill's name and description are loaded up front, with the body read only when the skill is actually activated [13]. Google's own first writing tip is also "define when to use it" [4]. But Gems never needed such a field — you used whichever Gem you clicked into. **My take:** during auto-migration, the description will either be generated by the system from the Gem's instructions, or left empty or generic. Either way, it decides whether the skill will later pop up in chats where you didn't expect it, or fail to show up when you need it.

**3. What happens past 100.** At most 100 skills can be active at once; the docs don't say what happens to overflow [4].

**4. Whether shared links still work.** TechRepublic notes skill sharing is coming, but the docs don't guarantee existing Gem share links keep working [9]. Verify if you've shared Gems.

**5. Users between 13 and 18.** Gems allow users aged 13 and up to create and use them [6]; skills currently require 18+ [5]. TechRepublic notes the transition guidance doesn't explain what happens to existing Gems owned by users in that age band [9]. A footnote on Google's blog says under-18 support is "coming soon" [1], with no date.

**6. Unsupported files.** GitHub files can't currently go into skills [4]; skill uploads don't accept binaries like .docx and .xlsx [5]. Read "supported files will move" in reverse: unsupported ones most likely won't. **My take:** a Gem with Word or Excel knowledge files may come out the other side with only its instructions and none of its files.

**7. The dedicated chat page.** Gems had a page listing recent chats; skills don't, so those chats just sit in the side panel [4]. Expect to search instead.

## Gaps worth testing by hand before migration

These kinds of Gems are most worth testing before November 17:

| Gem characteristic | Likely change after migration | Basis |
| --- | --- | --- |
| Default tool set to Canvas, Deep Research, Guided Learning, Create video or Create music | These tools don't yet work with skills | [4][9] |
| Drive files attached and updated often | Must be uploaded with the skill; updates mean re-uploading the whole package; Drive support "in a few weeks" | [1][5][6] |
| GitHub, .docx/.xlsx or Notebook files attached | GitHub and binaries unsupported; Notebook "in a few weeks" | [1][4][5] |
| Shared with others | Skill sharing "in a few weeks"; old links not guaranteed | [1][9] |
| You turned Keep Activity off | Skills require it on | [5][9] |
| Mainly used in the Workspace side panel or a client other than the three above | Skills currently only on mobile app, Mac app and web | [5][6] |
| An "Ask a Gem" step in Workspace Studio | Can no longer add new ones; flows stop at the cutoff date | [7] |

**Keep Activity deserves its own paragraph.** According to the Gemini Apps Privacy Hub, when Keep Activity is off and you don't submit feedback, Google doesn't use your future chats to improve its AI models, and those chats are retained with your account for 72 hours [12]; when it's on, chats may be reviewed by humans to improve Google services, and the Privacy Hub warns you not to enter confidential information [12]. TechRepublic advises those who disabled it deliberately to weigh this first [9]. **My take:** for anyone using Gems as "private notes plus instructions," this is the costliest item — and parity won't fix it, because the condition for use has changed.

## Three approaches side by side: slash skills, chat-native agents, coding-agent Agent Skills

Behind TechCrunch's jab there's a real question: should consumer agents ask users to invoke things explicitly, or just let them talk [3]?

**Meta's Muse takes the chat-native route.** You tell it what you want, and it decides which capabilities to use and which permissions to exercise. Low barrier, but users struggle to see what was approved behind each step — the root of [Muse sending a seller's home address to a buyer](/blog/meta-muse-allow-always-agent-permission-defaults/) after a single "Allow Always."

**Gemini skills actually take both routes.** The slash is explicit invocation; automatic use is implicit invocation [5]. TechCrunch only looked at the former. **My take:** the latter is what deserves attention. When you invoke explicitly, you know which instructions you're using; with automatic triggering, the model picks the skill. The site's piece on [co-installed skills displacing each other](/blog/co-installed-agent-skills-conflicts/) covers an empirical study: when similar skills are installed together and one displaces another, the task still completes but the original skill's hard constraints are lost, and the response almost never says which skill was used. Converting a dozen Gems into auto-triggering skills at once installs a batch of similar skills with unexamined descriptions — the same risk, with nobody doing acceptance testing.

**Agent Skills in coding agents are the third approach.** In tools like Claude Code, a skill is a folder in the project: `SKILL.md` plus optional `scripts/`, `references/` and `assets/`. The agent reads only the name and description first, reads the body when the skill activates, and loads resource files only when needed [13]. See the site's [Agent Skills 2026 survey](/blog/agent-skills-2026-survey-lifecycle-map/), [Progressive Disclosure](/blog/progressive-disclosure-agent-skills/) and [SkillDelta](/blog/skilldelta-selective-skill-activation/) ("relevant" isn't "should inject").

This time Google says outright that skills are "built entirely on the open, Markdown-native SKILL.md standard," so you can copy skills created on other platforms into the Gemini app and Workspace [7]; the Help Center supports uploading a SKILL.md, a folder or a zip, and downloading a skill as a zip [4][5]. Naming lines up too: lowercase, digits, hyphens, matching the folder name [4][13].

But the capability boundaries differ quite a bit:

| | Agent Skills in coding agents | Skills in the Gemini app |
| --- | --- | --- |
| Format | Directory + `SKILL.md` + optional subfolders [13] | Same format; upload and download supported [4][5] |
| Scripts | Run in the agent's execution environment; what they can do depends on the implementation [13] | .py/.sh accepted, but no internet and no actions on external websites [5] |
| Loading | Name and description first; body and resources on demand [13] | Applied after a relevance check; exact loading mechanics not disclosed [5] |
| Tool permissions | `allowed-tools` field (experimental) [13] | Not mentioned in docs |

**My take:** for ordinary users, the most concrete benefit of this migration may not be the slash at all, but **portability**. Gems were locked inside Gemini; a skill can be downloaded as a standard folder and, in principle, carried to any other tool that supports SKILL.md. Skills from elsewhere can come in too, minus most script power.

## A worked example: rewriting a "running coach" Gem as a skill

To make this concrete, say you have a "running coach" Gem whose instructions boil down to: plan next week's training from my pace and heart-rate logs, increase intensity gradually, and during injuries give recovery advice only. Its knowledge includes a training log spreadsheet in Drive.

When recreating it by hand, the name has to become something like `running-coach` [4]. The part that actually takes thought is the description. Here is a minimal `SKILL.md` written to the open spec [13]:

```markdown
---
name: running-coach
description: Plan next week's training from my uploaded running logs (pace, heart rate, weekly mileage). Use only when I explicitly ask about training plans, pace or mileage; do not use for diet, sleep or general fitness questions.
---

## Rules
- Weekly mileage must not rise more than 10% over last week.
- If I mention pain or injury, give recovery and see-a-doctor advice only; no intensity sessions.
- Output the plan as a table: date, type, distance, target pace.

## Reference files
- Training log is in references/log.csv (update weekly by hand, then re-upload the whole package).
```

Three things in this file differ from a Gem. First, the description states both when to use it and when not to — that's for automatic triggering, which Gems never needed. Second, the training log that used to sit in Drive and update itself every week now has to be exported to CSV and uploaded with the skill, with the whole package re-uploaded on every update [5]; so I wrote that into the body. Third, hard rules are listed separately so you can check whether stacking with other skills overrides them.

Then test: ask "my knee hurts a bit, how should I run next week?" to see if it holds the injury rule, and in a fresh chat ask "recommend a few breakfasts" to see if it misfires. Only when both pass is the Gem truly migrated.

## Pre-migration checklist

One afternoon before November 17; each item maps to the evidence above.

**Inventory**

- [ ] List every Gem you have: name, purpose, how often you use it, whether it's been shared.
- [ ] Mark Gems with knowledge files (type and source: local, Drive, NotebookLM, GitHub) or a not-yet-supported default tool (Canvas, Deep Research, Guided Learning, Create video/music) [4][6].
- [ ] List any Gems by Google Labs or Opal apps separately — they won't migrate [1][11].

**Back up**

- [ ] Copy each Gem's full instructions into a local text file.
- [ ] Following the Help Center steps, download knowledge files one by one into a folder named after the skill (all lowercase, hyphens) [4].
- [ ] Convert .docx, .xlsx and similar files to PDF, Markdown or CSV first; skill uploads won't take them otherwise [5].
- [ ] Opal users: copy out prompts, or confirm files remain in Drive's "Opal" folder [11].

**Trial-migrate one**

- [ ] Pick your most important Gem and recreate it as a skill by hand rather than waiting for auto-migration [4].
- [ ] **Write the description yourself**: one sentence on what it does, another on when to use it and when not to [4][13].
- [ ] Run the same set of prompts against the Gem and the skill and compare answers, especially questions that depend on file contents.
- [ ] Open an unrelated new chat and see whether the skill triggers by mistake; if it does, tighten the description, or turn off automatic use and keep slash invocation only [5].
- [ ] Stack two skills that might both trigger and check for overrides.

**Settings and permissions**

- [ ] Check your Keep Activity setting. If you turned it off on purpose, read the Privacy Hub before deciding whether to turn it on for skills [5][12].
- [ ] Check the age requirement. If a child under 18 in your household uses Gems for study, expect skills to be unavailable for now [1][5][9].
- [ ] Confirm your usual devices are supported (mobile app, Mac app, web) [5].

**Sharing and collaboration**

- [ ] Give recipients of shared Gems a heads-up that links may break [9].
- [ ] If you have a Workspace account, check Workspace Studio for "Ask a Gem" steps and schedule their replacement for 2027 [7].

**After migration**

- [ ] After November 17, check the Skills page: is the count right, are they all enabled, are the files there [4]?
- [ ] Deleting a skill can't be undone; download a zip backup before cleaning up [5].
- [ ] Watch the "coming weeks" parity items: sharing, Drive files, Gemini Notebook [1].

## Closing thoughts

On the surface this migration is a rename plus a new entry point. Underneath, Google is changing consumer-side customization from "build an assistant" to "write a set of instructions." That matches how coding agents evolved: one agent as entry point, capabilities split into pieces that compose, travel and load on demand. The benefits — no page switching, stacking, export — are real.

The costs are real too, and they land mostly at the moment of migration: live Drive links become static snapshots, default tools are temporarily missing, the age threshold and the Keep Activity requirement shut some people out, and there's the problem no skill system escapes — automatic triggering depends on the description, and Gems never had one.

So my advice is simple: don't read "automatic migration" as "moved over as-is." Take your one or two most important Gems, migrate them yourself, write the descriptions yourself, and compare the results yourself. Leave the rest to Google, knowing what might not come along.

## References

1. Google, Deven Tokuno, "Let skills in Gemini tackle your most repetitive tasks", 2026-09-30. https://blog.google/products-and-platforms/products/gemini/automate-tasks-with-skills/
2. 9to5Google, Abner Li, "Gemini app replacing Gems with skills in November", 2026-09-27. https://9to5google.com/2026/09/27/gemini-gems-skills/
3. TechCrunch, Sarah Perez, "Google is killing off Gemini's Gems in favor of 'skills'", 2026-09-28. https://techcrunch.com/2026/09/28/google-is-killing-off-geminis-gems-in-favor-of-skills/
4. Google Gemini Apps Help, "About the transition from Gems to skills". https://support.google.com/gemini/answer/18560919?hl=en
5. Google Gemini Apps Help, "Create & manage skills for Gemini Apps". https://support.google.com/gemini/answer/17094296?hl=en
6. Google Gemini Apps Help, "Use Gems in Gemini Apps". https://support.google.com/gemini/answer/15146780?hl=en
7. Google Workspace Updates, "Introducing skills in the Gemini app and Workspace, plus what's next for Gems", 2026-09-30. https://workspaceupdates.googleblog.com/2026/09/skills-gemini-app-workspace.html
8. 9to5Google, Abner Li, "Google details Gems to skills migration, including free access", 2026-09-30. https://9to5google.com/2026/09/30/gemini-skills-free/
9. TechRepublic, "Google Is Replacing Gemini Gems With Skills Nov 17 — What Changes Before the Switch", 2026-09-30. https://www.techrepublic.com/article/news-gemini-gems-skills-migration/
10. Android Authority, Ryan McNeal, "Google maps out transition plan to replace Gemini Gems with Skills", 2026-09-30. https://www.androidauthority.com/gemini-gems-phase-out-timeline-3717503/
11. Google for Developers, "Opal: Frequently asked questions and best practices". https://developers.google.com/opal/faq
12. Google Gemini Apps Help, "Gemini Apps Privacy Hub". https://support.google.com/gemini/answer/13594961?hl=en
13. Agent Skills, "Specification". https://agentskills.io/specification

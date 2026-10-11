---
title: "When a Coding Agent Says Done: How Do You Accept It — A 2026 Survey of the Verification Layer"
description: "How often is done/tests-pass true? Seven false-done modes; receipts, Stop hooks, independent checkers, parity harnesses; numbers from false-success, stale, SWE-Prometheus; and a practical checklist."
pubDate: 2026-10-11T16:40:00+08:00
author: "Remy"
tags: ["ai-agents", "agent-harness", "agent-loop", "ai-coding", "software-engineering"]
lang: "en"
---

Nom Army is an open-source harness: Claude Code, Codex, or Cursor acts as the "general," work goes to sandboxed workers, and the harness re-checks everything before anything is committed. Over 16 days and 547 jobs on their own repos, workers self-reported "done, tests pass" 265 times; after the harness re-ran verification in a fresh sandbox, 24 of those claims did not hold—about 1 in 11.[1][2] The rate is not alarming on its own. What it shows is simpler: **an agent's closing sentence is a claim, not evidence.**

Tom Tunguz's recent essay *Thinking in Systems, Shipping in Loops* argues that once AI removes the typing, the craft left is designing the loop that decides whether the output is right.[3] The direction is right; the engineering question is sharper: where can "done" go wrong, which mechanisms people use to check, and where each mechanism itself fails. This survey puts the tools, posts, and papers of the past month on one map, then ends with an acceptance checklist.

Related posts: [FTA: can an agent still report success after a tool failed?](/blog/failure-transparent-agents-tool-failure-reporting/) covers honest post-failure reporting—I won't expand that evidence contract here. [SpecHarness](/blog/specharness-spec-holds-the-pen/) states the principle that the agent only proposes and an external authority closes; this post is how that principle lands on coding agents. [Global Coherence: locally right, still wrong as a team](/blog/global-coherence-local-right-team-wrong/) covers multi-agent invariants; section four's merge problem pairs with it. [CheatBench](/blog/cheatbench-agent-reward-gaming/) covers intentional score gaming; this post is about agents that sincerely believe they finished. Claims marked "my take" are mine; second-hand forum or comment claims are labeled.

## Seven shapes of false "done"

The cases I read fall into seven shapes. On the UI they look identical—a green check—but they need different checks.

**1. Never ran, or ran only a slice.** Robert Adamson's Dev.to post: a project has unit, integration, API, and e2e tests; the agent runs `npm run test:unit` and reports "All tests pass."[4] Technically some tests passed. The application was never verified.

**2. Stale results.** The agent runs tests, they pass, then it edits again and still reports "tests pass."[4] The sentence was true earlier; it is not true of the final tree. Easy to miss because there is no intent to lie.

**3. Ran correctly, narrated wrong.** Main agents often spawn subagents whose transcripts never surface in the parent conversation; a subagent's test failure stays invisible, and the parent sincerely closes with "all green."[5] Rashomon's README shows exactly that: an Explore subagent's three calls never appear in the main transcript.[6] Commenters also describe summaries drawn from "memory of the run" rather than the run (second-hand).[4]

**4. Tests pass but prove nothing.** Rishi calls this the quieter lie: instead of fixing a failing test, the agent adds a new passing test beside it; exit code is 0.[5] Nom Army counts a dedicated bucket: tests pass, but after the production change is reverted they still pass—so they never depended on the change. Eight of 265 claims fell there.[2] In one overnight experiment, 3 of 5 completions shipped tests that passed whether or not the feature existed.[2]

**5. Shared misunderstanding across implementation and tests.** The same AI writes the feature and then the tests for its own interpretation. Adamson's other post uses refunds: the requirement was "refund only after a successful capture"; the model heard "refund if a payment record exists"; implementation, tests, and AI review all stayed green while the requirement was wrong from the start.[7] He calls it an AI Agreement Loop: many stages agree, independence is weak.

**6. Pass alone, fail together.** Two agents edit the same repo in parallel; one changes an interface or rule the other still relies on; each patch passes alone; the merge fails with no textual conflict. Section four covers the dedicated benchmark.

**7. Only the real environment shows it.** In Claussen's .NET→Go migration, the Go OpenAI client sent `max_tokens`; newer models reject it with 400; every extraction failed silently—unit tests and mocks green, only a live call exposed it.[12] Nom Army hit a module omitted from a Lambda bundle that still passed every unit test.[2]

| Type | Surface | Root cause | Cheapest check |
| --- | --- | --- | --- |
| Never / partial run | "All tests pass" | Scope never stated | Receipt names command and scope; say "not verified" if skipped |
| Stale | Earlier green | Edit after verification | Bind receipt to commit / file hash |
| Narration wrong | Summary ≠ reality | Memory or invisible subagents | Runner writes the record; side-channel compare |
| Tests prove nothing | New tests all green | Tests ignore the change | Revert the change and re-run |
| Shared misunderstanding | Impl, tests, review green | One interpretation throughout | Humans own acceptance and test names |
| Fail together | Each patch green alone | Stale info under parallelism | Run the full suite on the merge |
| Environment-only | Unit/mock green | Real deps never in the suite | Clean env, live calls, parity |

## Seven mechanisms people use

**Evidence receipts.** Cheapest change: rewrite what the agent is allowed to say. Adamson: never say "tests pass" without running; report exact command, exit code, counts, skips, and whether the run was after the final edit; say "not verified" otherwise.[4] Stronger: wrap the test command so a script writes the receipt (git SHA, command, exit code, output tail); the agent only points at it; SHA ≠ HEAD means stale, and CI fails (second-hand, comment).[4]

**Pre-done gate.** Altair (open source) will not allow the word "done" after code edits until project tests and linters run; on failure it retries up to a cap, then rolls the whole run back. Every write is snapshotted first; command side effects go into a separate hidden git repo that never touches your `.git`.[9] The author's phrasing: not "usually won't" report success with red tests—structurally can't, because the check runs before "done" is allowed.

**Platform Stop hooks.** Claude Code's `Stop` / `SubagentStop` can return `decision: "block"` or exit 2 so Claude continues, with the reason as the next instruction; docs show an agent-type hook that verifies unit tests before stop.[13] Cursor's `stop` can return `followup_message` as the next user message; `subagentStop` input includes modified files and the subagent transcript path.[14] Codex `Stop` with `decision: "block"` does not reject the turn; it turns `reason` into a new user prompt and continues.[15] That is different from writing "always run `npm test` after JavaScript changes" in AGENTS.md—instruction vs an external process.[16]

**Side-channel record.** Rashomon hooks Claude Code's tool lifecycle, keeps its own record of every call and edit, and at end of turn compares that record to the closing summary. It does not guess intent; it lists facts: which call failed, what exit code, which failure words the closing message never used.[6] Most turns print nothing—a tool that alarms every turn trains you to ignore it.[5]

**Sandboxed implement + independent checker.** Nom Army's core design.[1] The general briefs a job (task, acceptance criteria, proving tests). The harness opens a git worktree and runs the worker in a Podman sandbox with no network and no host credentials. The worker must end with a four-line report: `STATUS`, `TESTS`, `NOT_DONE`, `NOTE`. The harness treats that as a claim and checks evidence itself: real diff from git, not the worker's description; verification profile in a fresh sandbox; revert production changes and re-run—if tests still pass they proved nothing, so the job goes to review instead of commit; secret scan; flags for new skips, stubbed imports, unwired code. Only then does it commit—on the worker's own branch, **never into yours**. Repo policy makes verification and the revert check non-waivable by the general.

**Front-loaded acceptance.** duaer-acceptance is a small MIT skill for Claude Code / Cursor / Codex: brief with checkable acceptance → do the work → evidence self-check → delivered only when the requester accepts.[10] duaer-spec's console goes further: vague acceptance cannot be confirmed; kickoff needs a signature bound to the fingerprint of confirmed cards.[11] A lighter habit from comments: approve test names before implementation; the agent fills bodies (second-hand).[4]

**Parity harness.** Claussen's docker-compose stack stands Go and .NET APIs side by side, same requests both ways: compare at HTTP, not the DB; hash API keys the same so one credential works; mask IDs and timestamps, allowlist intentional diffs. Built in an afternoon; four real bugs the next day, three unit tests would never have caught.[12]

| Mechanism | Who produces evidence | Catches | Misses | Cost |
| --- | --- | --- | --- | --- |
| Receipt | Agent or wrapper script | Never/partial run, stale | Useless tests, shared misunderstanding | Very low |
| Pre-done gate | Harness auto-runs checks | Green report with red tests | Weak tests; gate itself broken | Low |
| Stop hook | Hook process (command or model) | Early stop | Prompt hooks can be talked into yes; loop caps | Low |
| Side-channel | Independent recorder | Narration ≠ reality, subagent failure | Ran the wrong tests | Low |
| Sandbox + checker | Harness re-runs in fresh sandbox | False done, inert tests, secrets | Repo-specific deploy bugs; post-merge | Mid–high |
| Front-loaded acceptance | Humans own criteria; agent brings evidence | Shared misunderstanding, scope drift | Criteria themselves incomplete | Human time |
| Parity | Diff of two implementations | Env / behavior drift | Needs a reference implementation | Mid |

## What the papers and field records measured

**How common is false success.** Laksh Advani's paper studies false success: the environment shows failure, the agent asserts completion.[8] Corpus: 9,876 tau2-bench trajectories across 8 model families, plus 1,879 AppWorld trajectories across 4. In single-control airline and retail, false success is 45% and 48% of all failures; in dual-control telecom (user simulator can verify state) it is 3%; among AppWorld coding agents that emit explicit status claims it is 75.8%. Caveats from the author: telecom has only 15 FS cases, so 3% is a hypothesis; 75.8% covers only two self-assessing architectures. Rishi's "44–76%" band[5] matches the paper's range; the paper splits by setting.

LLM-as-judge fails: across 5 judges, 5 prompt strategies, and even full task specs, AUROC never exceeds 0.65 on tau2-bench and 0.54 on AppWorld. Judges ride confident closing language; trajectories with assertion vocabulary score 0.27–0.36 points more "completed" regardless of outcome. Lightweight TF-IDF detectors hit task-disjoint AUROC 0.83 and 0.95; at a 10% flag rate they recover 72% of false successes vs 13% for the best judge. Precision then is only 50%—triage, not a substitute for checking environment state.[8]

**One team's field record.** Of Nom Army's 265 claims: 16 failed when re-run in a fresh sandbox; 8 passed but still passed after revert; 236 passed verification; 5 were `not_run`. Among committed jobs, 140 new test files were shown to fail with their production change reverted.[2] The authors stress: one machine, 16 days, not a benchmark; integration defects the general found later are not in the ledger. More useful: naming the inert-test failure mode in the brief took an identical job from 1 of 3 real tests to 3 of 3, for about five extra seconds.[2]

**Pass alone, fail together.** The *stale* benchmark's grading rule is itself an acceptance principle: run the same patches alone and merged on the same suite; count only tests that pass alone and fail together (Δblind).[17] Three tiers: 417 mined Django PR pairs, 834 runs—after correcting grading, only one showed interference (reviewed history already resolved conflicts). On synthetic tasks, blind agents failed on every changed interface; a ~130-token oracle message describing the completed concurrent change cut mean interference from 2.50 to 0.04 (98%). On constructed tasks over 12 real Django helpers, GPT-5.5 showed interference in 105/108 blind runs (97%) with clean textual merges; the oracle message recovered 89/108 (82%).

Two details matter for builders. First, the authors' initial grading invented false interference: agents edited test files, and solo vs merged used different suites; drop agent test edits and run one combined suite everywhere, and almost all "interference" vanished. Second, constructed rates do not estimate real-world prevalence, and the oracle message assumes a complete description of a finished change.

**Governance: artifacts ≠ outcomes.** SWE-Prometheus gives no issue, no failing test, no reference patch—only a fixed snapshot. The agent must improve six dimensions (tests & CI, quality gates, docs, structure, reproducible environment, dependency & security) without changing observable behavior.[18] Behavior is pinned by characterization tests that must stay green—SWE-bench's mirror: there tests are the target, here they are the constraint.

On 22 public repos, ten models' mean NGI ranges 0.0568–0.5760; behavior-breakage 0%–23%. A repository-blind template baseline scores mean NGI 0.272—higher than two models—but all gains sit in the first three dimensions; D5 and D6 improve on none. Example: the template adds a GitHub Actions workflow running Ruff and pytest plus a smoke test that is only `assert True`; the test passes while the same snapshot still reports 117 Ruff errors. Matched per-repo, only Kimi-K3 (9–1) and GLM-5.3-Flash (8–1) clearly beat the template on a majority.[18]

The number I care about most is gate strength: measured breakage is 13% when gates catch injected mutants, 8% when they miss, 0% when vacuous—while NGI barely moves. **Zero breakage often means a weak gate.** Only 24 of 60 instances have gates with demonstrated discriminative power.[18]

## Where each mechanism breaks

**A receipt proves only what it ran.** A green receipt is silent about what nobody ran; an agent can be honest, cite a real hash, and still be wrong by omission (second-hand, comment).[4] Receipts must name what ran and what was skipped; agent-authored numbers can be restated wrong.

**Gates fail silently.** Altair's packaged build once invoked pytest through the app's own executable; the gate spun doing nothing until the agent checked another way and wrote "automated check did not pass."[9] Cursor command hooks fail open by default (crash / timeout / non-2 exit lets the action through; set `failClosed: true` to block);[14] Codex likewise does not block on hook error or bad output.[15]

**Stop hooks have caps.** Claude Code ignores the ninth consecutive stop-block after eight continuations;[13] Cursor defaults to five auto follow-ups.[14] "Gate failed" can become "turn ended"—keep a check outside the hook.

**Model judges get talked into yes.** Claude Code's prompt-style Stop example asks a model whether user tasks are complete.[13] Given the false-success paper, my take: use that only as a backstop; agent-type hooks can read files and test output (stronger) but are still marked experimental.[13] Trust command hooks or CI for exit codes.

**An independent checker only knows what you told it.** Nom Army reports `not_run` when your compose services cannot start, rather than running without deps; test-workaround detection is a flag; deploy-time failures need your own check.[1] Cost: on small, already-diagnosed tickets the general spends 4–8× the tokens of fixing directly, break-even around 150 lines of context to read;[1] writing thorough evidence *is* the diagnosis—if what remains is a tiny edit, delegation lost its point.[2]

**Revert checks have blind spots.** Test-only, docs-only, and declared refactors skip them,[2] yet refactors are exactly when "behavior must not change" matters—use characterization tests or parity, and first confirm those tests catch mutants.[18]

**Per-patch rigor does not cover the merge.** Nom Army commits only on the worker branch;[1] *stale* is about what happens at integration.[17] The more parallelism, the more you must re-run the full suite on the merge and show later agents the finished interface changes. On one Apple Silicon machine, going from 1 to 4 local workers produced no net throughput gain.[2]

**AI review ≠ independent verification.** When implementation, tests, and review share a model family and prompt, agreement is consistency, not correctness.[7] Role separation can weaken the agreement loop; it does not replace a human.

**Parity needs a reference and can force product decisions.** No old implementation, no parity. Claussen found a diff that was not "make them match": the old API exposed which AI provider was in use; he dropped the fields on both sides.[12]

## Where humans belong: the plan document is not the answer

Ayman Nadeem's *Plan mode is dead* fills the other side.[19] She built a planning-centric coding app and concluded she had conflated planning with a plan—users had little appetite for long AI-generated specs; a waterfall of chat → clarify → spec → review → approve → implement broke real thinking. The loop she saw is understand → act → inspect → clarify → adjust → act again. Planning still happens; it need not be a document named "the plan." Unsolved: how humans stay oriented when agents scale from five to hundreds; her direction is to surface the fewest high-leverage attention points with enough context.

My take: put human attention at the two ends—up front, acceptance criteria and test names (the only place shared misunderstanding is cheap to catch); at the end, decisions the tools surface (parity diffs, flagged tests, post-merge failures). The long middle belongs to sandboxes, receipts, and independent re-runs. In Adamson's words: AI checks mechanics; humans check meaning.[7]

## A practical acceptance checklist

**Before work**

- Write checkable acceptance, including out-of-scope; vague criteria do not start.[10][11]
- Humans approve behaviors / test names before the agent implements.[4]
- Name the failure modes you fear in the brief (e.g. "no tests that pass without the change").[2]

**During**

- Isolate in a worktree or sandbox; no production credentials; snapshot before edits; track command side effects separately.[1][9]
- When parallel work changes a shared interface, send a description of the completed change to the others.[17]

**At "done"**

- Receipt written by the runner: command, exit code, pass/fail/skip, commit hash; hash ≠ HEAD → stale.[4]
- Receipt names what was not run; silent skip equals failure.[4]
- Command Stop hooks for real checks; fail-closed for security; remember loop caps and check outside them.[13][14][15]

**Independent re-check**

- Re-run verification in a clean environment; read the diff from git, not the agent's description.[1]
- Revert-check production edits; mutant-test the gate itself—zero failures ≠ safe.[1][18]
- Side-channel compare the closing summary, especially subagent calls.[6]
- Model review as triage, not verdict; escalate suspects to a human.[8]

**At merge**

- Run every task's tests on the combined code; count pass-alone / fail-together.[17]
- For rewrites, stand up a parity harness; mask volatiles; allowlist intentional diffs.[12]

**What humans look at last**

- Requirement, implementation, and tests together—not only whether implementation and tests agree.[7]
- What the checker flagged and what parity forced as a product decision—not the agent's long summary.[19]

Back to Tunguz: via Donella Meadows he names resilience (many checks), self-organization (a failure class becomes a skill), hierarchy (verified components compose).[3] For acceptance: do not bet on one gate; let each check's evidence come from a different source, and write every caught false-done back into briefs and gates. When an agent says "done," the question "where's the evidence?" is best asked by the system for you.

## References

1. rayson-tech/nomarmy, README (How every byte gets verified, Status, Known limitations): <https://github.com/rayson-tech/nomarmy>
2. rayson-tech/nomarmy, *What we've learned running nomArmy* (docs/findings.md): <https://github.com/rayson-tech/nomarmy/blob/main/docs/findings.md>
3. Tom Tunguz, *Thinking in Systems, Shipping in Loops*: <https://tomtunguz.com/thinking-in-systems/>
4. Robert Adamson, *Your AI Coding Agent Says "Tests Pass." But Did It Actually Run Them?* (Dev.to, including comments): <https://dev.to/robertadam987_/your-ai-coding-agent-says-tests-pass-but-did-it-actually-run-them-4684>
5. Rishi G, *Your coding agent tells you all tests pass. Sometimes that's not true.* (Dev.to): <https://dev.to/rishi_g_25/your-coding-agent-tells-you-all-tests-pass-sometimes-thats-not-true-i32>
6. altrace-dev-role/rashomon, README: <https://github.com/altrace-dev-role/rashomon>
7. Robert Adamson, *If AI Writes the Code and AI Reviews the Code, What Exactly Is the Developer Verifying?* (Dev.to): <https://dev.to/robertadam987_/if-ai-writes-the-code-and-ai-reviews-the-code-what-exactly-is-the-developer-verifying-b5h>
8. Laksh Advani, *From Confident Closing to Silent Failure: Characterizing False Success in LLM Agents*, arXiv:2606.09863: <https://arxiv.org/abs/2606.09863>
9. Qweezyy, *I built an AI agent that snapshots every edit and runs your tests before it says "done"* (Dev.to, Altair): <https://dev.to/qweezyy/i-built-an-ai-agent-that-snapshots-every-edit-and-runs-your-tests-before-it-says-done-l17>
10. duaer, *Done means accepted: duaer-acceptance for Claude Code, Cursor, and Codex* (Hashnode): <https://duaer-acceptance.hashnode.dev/done-means-accepted-duaer-acceptance-for-claude-code-cursor-and-codex>
11. Duaer/duaer-spec, README: <https://github.com/Duaer/duaer-spec>
12. Brock Claussen, *Four bugs I would have shipped without a parity harness* (Hashnode): <https://foxhole.hashnode.dev/four-bugs-i-would-have-shipped-without-a-parity-harness>
13. Claude Code Docs, *Hooks reference*: <https://code.claude.com/docs/en/hooks>
14. Cursor Docs, *Hooks*: <https://cursor.com/docs/agent/hooks>
15. OpenAI Codex Docs, *Hooks*: <https://developers.openai.com/codex/hooks>
16. OpenAI Codex Docs, *Custom instructions with AGENTS.md*: <https://developers.openai.com/codex/guides/agents-md>
17. Haocheng Xia, Eugene Wu, Yongjoo Park, *Passes Alone, Fails Together: Benchmarking Semantic Coordination in Parallel LLM-Agent Development*, arXiv:2609.25396 (EXPRESS 2026): <https://arxiv.org/abs/2609.25396>
18. CosmosMind et al., *SWE-Prometheus: Measuring Engineering Governance Improvements in Real-World Repositories*, arXiv:2609.29465; public tasks: <https://arxiv.org/abs/2609.29465> ; <https://github.com/CosmosMind-ai/SWE-Prometheus>
19. Ayman Nadeem, *Plan mode is dead*: <https://www.aymannadeem.com/artificial/intelligence,/developer/tools/2026/09/24/plan-mode-is-dead.html>

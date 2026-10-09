---
title: "OpenAI Math's Correction Week: What a Passing Lean Proof Actually Verifies"
description: "OpenAI released 700+ AI math manuscripts, then withdrew three. We split \"AI proved X\" into five layers, show what a machine checks, and give an audit checklist."
pubDate: 2026-10-09T16:40:00+08:00
author: "Remy"
tags: ["openai", "evaluation", "research", "llm"]
lang: "en"
---

## What happened this week

On October 6, 2026, OpenAI posted about "sharing AI progress in mathematics": a large batch of new results from an internal frontier model, published in the GitHub repository `openai/math` with Lean formalizations of "many of the proofs," plus a promise to update the repo as more formalizations arrive. [1] The README is more specific: the first release held 722 manuscripts in 372 result families, the model was fed about 4,000 problems, and "some of the unformalized results may be wrong." [2]

Two days later OpenAI's Dan Roberts tweeted: 6 new Lean formalizations, 19 modifications, 3 withdrawals, and "about 42% of top-level results formalized." [5] The repo's `history.md` files the batch under "October 7, 2026": a manuscript on the algebraicity of Weil classes on split abelian eightfolds had a sign error and was withdrawn with two manuscripts that depended on it; 14 others got proof repairs and statement corrections, 13 only had citations updated; the top-level formalization ratio became 300 / 719, about 42%. [3] The commit hit main at 05:03 UTC on October 8 (13:03 Beijing time); the tweet followed at 13:20 Beijing time.

Almost simultaneously, A. Bastounis, F. Circelli and A. C. Hansen at Cambridge submitted an arXiv paper on October 6 titled "Navier–Stokes lost in translation." Using OpenAI's September Navier–Stokes blow-up proof as a case study, they compare paper and Lean code item by item and conclude that the formalization is not a semantically faithful translation of the paper, so a passing Lean build cannot vouch for the paper's natural-language proof. [6]

The same week brought Terence Tao's four-post "Math 2.0" thread [14], set theorist Asaf Karagila's public critique of the Partition Principle manuscript [12], Scott Aaronson's "The Mathocalypse" [13], and the Erdős problems site freezing proof claims [16]. Together they press one question: **when someone says "AI proved X, and there's a Lean certificate," how much has a machine actually checked?**

I won't judge which results are right; I can't referee this math. I'll take that sentence apart: who owns each layer, what checks it, and which layer broke this week.

## The three withdrawals: what broke, and was there Lean?

The withdrawal notice is concrete. In a "stabilization trace" argument, the manuscript gave each reverse trace a sign of +1, expecting the signed double-point count to vanish after inserting m of them. But the two branches of the standard cusp have opposite source orientations, so each reverse trace is actually −1 under that convention; the count is −2m, not zero. The Eliashberg–Murphy cancellation theorem used next needs a zero count, so the construction falls apart. The notice adds that the withdrawal concerns the proof and **does not assert the statement is false**. [4]

The three withdrawn manuscripts:

| Manuscript | Reason |
| --- | --- |
| Algebraicity of Weil classes on split abelian eightfolds | Sign error; main argument fails [3][4] |
| Algebraicity of Kuga–Satake Correspondences for K3 Surfaces | Depends on the construction above [3] |
| The rational Hodge conjecture for products of K3 surfaces | Same [3] |

On HN someone asked whether these had Lean; a commenter said none were formalized. [18] I checked the catalogue `lean/formalization.yaml` in the initial commit `adc7f12`: none of the three are there, nor in the current main branch. [19] So the direct lesson is plain: **the unformalized majority is exactly the part no machine checked.** The README says so itself. [2]

Two small figures don't reconcile: the tweet's "19 modifications" doesn't match `history.md`'s breakdown (14 proof modifications, 13 citation updates, 5 other additions) [3][5]; the notice says October 6, `history.md` says October 7, and the commit is October 8 UTC. [3][4] None of this touches the math, but **the bookkeeping behind "checked" needs checking too.**

## Splitting "it passes Lean" into five layers

Discussions like this often run several claims together as one. I split the trust chain into five layers, bottom up:

| Layer | Question | Who checks | Machine backstop? |
| --- | --- | --- | --- |
| L0 Kernel and runtime | Is the checker itself trustworthy? | Kernel implementations, external checkers | Partly; cross-check implementations |
| L1 Formal proof | Does the proof derive this formal statement? | Lean kernel | Yes; Lean's strength |
| L2 Statement faithfulness | Does the formal statement say the problem we meant? | Domain experts | No; human reading only |
| L3 Proof correspondence | Is the paper's natural-language proof the same argument as the Lean proof? | Humans, item by item | No |
| L4 Public claims | Does "solved" match what L1–L3 actually cover? | Readers, peers, press | No |

Lean's guarantee lives in L1; L0 is hardened by engineering; L2–L4 rest on people. This week's three events land one per layer: the withdrawals happened where L1 never reached; the Navier–Stokes paper is about L3; Karagila and Tao are talking about L4 and the community costs beyond verification.

### L0: the checker itself can be broken

People often assume "the Lean kernel is small, so it's trustworthy." Small isn't bug-free. In July 2026 someone used AI to produce a `sorry`-free "disproof" of the Collatz conjecture that exploited a missing check in how the kernel handles nested inductive types; it was later reduced to a proof of False (issue #14576). The main external checker, nanoda, happened to have an unrelated bug, and the proof was crafted to slip past both. [10] It was a deliberate demonstration, but the attack surface is real.

The August follow-up matters more. OpenAI's Daniel Selsam used an internal model to help the Lean FRO (the nonprofit that maintains Lean) hunt kernel bugs systematically. The model found several ways to make the official kernel accept False, then turned to the runtime: once overflowing a reference count to corrupt memory, once exploiting a known bug in the old GMP 6.1.2 linked into the official Linux build. Lean v4.33.1 fixed these. [11] de Moura writes that "we treat AI-generated proofs as a potential source of malicious proofs," that `lake build` doesn't defend against them, and that the gold standard is `comparator` plus an external checker; 4.35.0 adds `lake check` and `--paranoid` multi-kernel rechecking. [11]

So the right claim at L0 isn't "the kernel can't be wrong" but "at least one independent implementation is right." This layer is being tightened, and it didn't cause this week's withdrawals, but an audit can't skip it.

### L1: this layer really can go to a machine

OpenAI's repo deserves credit here: each formalized result ships with a Comparator config. Comparator is Lean's official "trusted referee": you supply a challenge file (the statement, with `sorry` for the proof), the other side supplies a solution, and Comparator checks in a sandbox that the same-named theorem ① proves the same statement, ② uses only allow-listed axioms, and ③ is accepted by the kernel. [9] The Partition Principle config, for instance, allows just `propext`, `Quot.sound` and `Classical.choice`. [19]

Once this passes, you needn't read 1.8 GiB of proofs (one HN commenter's size estimate [18]); hence "you only need to check the statement." True, but it pushes all the difficulty onto L2.

### L2: faithful statements are harder to read than they look

"Checking a statement is easier than checking a proof" usually holds, but by wildly varying margins. I counted lines in several challenge files (imports and custom definitions included): [19]

| Challenge file | Lines | What reading it takes |
| --- | ---: | --- |
| QuasiRiemannHypothesis | 9 | One line: ζ(s) ≠ 0 for Re(s) > 7/8, using Mathlib's `riemannZeta` |
| ErdosReciprocal | 36 | Custom "contains a k-term arithmetic progression" and reciprocal sum; Erdős's famous AP conjecture |
| MatrixMultiplication | 132 | Custom definitions around the matrix multiplication exponent |
| PartitionPrinciple | 277 | Home-built syntax for set-theoretic formulas, satisfaction, ZF axiom schemas |
| NavierStokesVelocity | 1275 | Masses of PDE definitions |

A number theorist reads nine lines in minutes. For 277 lines of home-built logic and ZF, you need both set theory and Lean to spot drift. With a thousand-plus lines of PDE definitions, just confirming "these are the paper's function spaces" is specialist work. The HN argument stalls here: one side says humans "only check the statement"; the other says "it's surprisingly easy to prove something slightly different from what you meant." [18] Both are right about statements of different lengths.

Formalization also has its own trap: **junk values** (defaults assigned where the math is undefined). Bastounis et al. cite `sInf`: in Lean the infimum of an empty set of naturals is 0, so a mathematically undefined quantity silently becomes a number and later identities still go through. [6] Likewise the inverse of 0 is 0 in Lean, and Mathlib gives ζ a conventional value at the pole s = 1, so "ζ(s) ≠ 0 for Re(s) > 7/8" rests on convention, not mathematics, at s = 1. Here they're very likely harmless (the n = 0 term adds 0; s = 1 was never a zero), but a reviewer must know they're there and judge them.

### L3: a proof that compiles doesn't make the paper's proof right

This is where Bastounis et al. make their core contribution. They distinguish two kinds of autoformalization (using AI to turn natural-language math into a formal language):

- Type (i): the statement is already faithfully formalized; the AI translates a natural-language proof into Lean, and success means it compiles with no `sorry` and no extra axioms.
- Type (ii): every definition, statement and proof is translated faithfully, with the argument's structure preserved. [6]

OpenAI's pipeline is type (i). Its acceptance test asks only "does Y′ prove X′ in Lean," not "does Y′ keep Y's reasoning." Until it compiles, the AI keeps editing; it may repair the original proof or take another route, and both count as success. The paper puts it sharply: if the original proof is wrong, the process **incentivizes** the AI to find a different one. [6]

Two warm-up examples. First, "x³ − x² − x + 1 ≥ 0 for x ≥ −1" is true, but the given proof gets the root multiplicities backwards; asked to "translate" it into Lean, ChatGPT-6 found the right multiplicity itself and returned a correct proof that compiles. Second, tr(A²) ≥ 0 for symmetric A: the original goes through orthogonal diagonalization, while the Lean version skips the basis change and writes the trace as a sum of squares via symmetry. Both correct, different arguments. [6] Lean is green both times, and says nothing about whether the original proof is right.

### L4: public claims versus what was checked

The last layer is wording. OpenAI's September post, "On the Navier–Stokes Millennium Prize Problem," says the work "resolves the Navier–Stokes Millennium Prize Problem by establishing statement C (and D) of the official formulation" and shares "a write-up of the proof and a Lean formalization," while saying it won't claim the prize. [7] The companion README describes "Lean 4 formalizations of the results" of the two papers. [8] Readers naturally take paper and Lean to be the same thing. The L3 paper says they aren't.

The October release is much more restrained—"progress"—and the README admits not everything is formalized. [1][2] But Karagila notes that "progress" in a press release becomes "solution" in the media; it's "having it both ways." [12]

## Navier–Stokes: Lean proves something weaker than the paper

Here are the two mismatches Bastounis et al. found in OpenAI's Navier–Stokes proof. [6]

The first is Lemma 8.6, equation (8.19): an estimate for the inverse operator N⁻¹ on the 2D torus. The paper says the output's m-th derivatives are controlled by the input's **m+4**-th, justified by a Diophantine-type divisor bound plus "four extra derivatives leave a summable (1+|k|)⁻³ in the 2D Fourier series." The closest Lean theorem, `norm_derivativeWord_inverse_le`, assumes **m+5** derivatives and uses a different series with exponent 4; related theorems in the repo are consistently m+5. Lean proves a **weaker** inequality. [6]

The second is the pressure-flux estimate (10.19). The paper's bound depends only on the local L⁶ norm B_R; the closest Lean theorem carries an extra local gradient term A_R, and the route differs: the paper uses boundedness of the Riesz transform on L^{3/2}, Lean goes through a Sobolev embedding into L², with different Hölder exponents. The authors say the bounds are hard to compare directly. [6]

The boundaries matter, or this reads as "the Navier–Stokes proof is fake":

1. The paper explicitly **draws no conclusion about the correctness of OpenAI's natural-language proof**; it only addresses translation. [6]
2. A commenter on Aaronson's blog gave the other side: if the top-level statement is formalized correctly, the Lean proof still shows the statement holds; the paper's point is that the natural-language proof people are reading may not match the Lean and may even be wrong. [13] I agree, and it shows exactly that L1 and L3 are different things.
3. The paper expects the companion Euler proof "very likely" has mismatches too, but calls this a prediction from a preliminary look. [6]

Why isn't "a correct proof exists" enough? Because mathematicians want more than truth values. Tao notes that a breakthrough used to bring talks, collaborations and new problems, with the proof digested into textbooks; now many results are "solved" by AI users who can't read or explain the output. [14] If the proof people read isn't the argument the machine checked, the digesting happens on the wrong text.

## Why another AI can't just check "faithful translation"

Many engineers' first instinct: have another model translate the Lean back into prose and compare. The paper addresses this: back-translation must also be shown faithful to the formal proof and to the original reasoning. The problem just changes direction; it's as hard as type (ii). [6]

The paper goes further with a computability result. Take an innocent-looking example: a textbook defines n_e as "the least n for which a certain polynomial equation has no natural-number solution," sets r_e = 1/(n_e + 1), and calls (r_e + 1)² = r_e² + 2r_e + 1 obvious. The identity is a one-line `ring`; the catch is that r_e is defined only if such an n exists. A faithful formalizer must **refuse to translate** when r_e is undefined, yet deciding that is, via known results on Hilbert's tenth problem, Σ⁰₂-complete—undecidable even with a halting oracle. Generalized, this ambiguity-resolution problem has no finite bound in the SCI hierarchy (the Solvability Complexity Index, which grades problems by how many nested limits they need). [6] And if the AI forces a translation with a junk value like `sInf`, Lean still compiles; the translation is just wrong.

Read this correctly: it says **no faithful formalizer is reliable on all inputs**, not that a given formalization can't be checked—an expert can still read and judge that one. What it rules out is a fully automatic "faithfulness" check between AI generation and Lean verification, after which nobody needs to read.

A precedent the paper cites: in spring 2026 Meta claimed to have autoformalized 26 textbooks into Lean; for one book claimed at 56% formalized, a Lean community member couldn't find a single statement without a fatal error. Its faithfulness checks were mostly done by other AIs. [6]

## Beyond the press release: who pays to read

L4 isn't just wording; it decides who pays for verification.

Karagila's essay is representative. He works on the axiom of choice, and whether the Partition Principle implies it is a problem he has long followed. He read the manuscript (not the Lean; he doesn't know Lean well and the code is huge) and found it confused, oddly structured, idiosyncratic in terminology and poorly cited (including unpublished lecture notes not on arXiv)—a journal should desk-reject it. Dumping hundreds of hard-to-read "solutions" at once, he says, is a denial-of-service attack on mathematics. [12]

Interestingly, Partition Principle **does** have a Comparator config in the catalogue. [19] Even with L1 passed and the 277-line statement checked, Karagila's criticism stands, because what he wants lies outside these five layers: a paper experts can read and place in the literature. Tao agrees: once "first to solve" is optimized past sustainability, the community should value exposition, community-building and new directions more. [14]

Aaronson is more optimistic, calling it one of the most important days in the history of mathematics and listing results such as the Unique Games Conjecture and integer multiplication below n log n, while writing that "not all of the results have Lean certificates" and "almost no one has really understood these proofs." [13] He also contrasts two release styles: OpenAI publishes undigested proofs and lets humans race to understand them; Anthropic paid Virginia Williams and Josh Alman to write results up under their own names. [13] Each splits the L3/L4 cost differently, at its own price.

Where some specific results stand:

- **Integer multiplication below n log n**: the abstract fixes the model—a multitape Turing machine with a fixed finite alphabet and finitely many one-dimensional tapes—with complexity O(n (lg n)^{1−κ}), κ = 2⁻¹⁸², claiming to refute the Schönhage–Strassen conjecture that n log n is optimal there. [19] As of my October 9 fetch, it's not in `formalization.yaml`, so I can't verify an HN claim that its Lean proof relies on a "lookup table." [18][19] L4 includes the **model of computation**: "below n log n" holds only in that model.
- **Erdős problems**: on October 6 Thomas Bloom froze comments and proof claims on problem pages, removed "solved/unsolved" status displays and dropped attributional wording; he'll link Lean formalizations registered on Palomar where one can check that "the formal statement matches the original problem." [16] That's a community turning the L2 check into a process.
- **Packing 11 squares**: not an OpenAI formalization; I cite it for its disclosure. The README says the final theorem trusts "the Lean kernel plus the native compiler" because some numeric certificates use `native_decide`, so it is "not a kernel-only verification"; the report lists 7,920 modules, 0 admissions and 13,308 native-certificate dependencies, and asks reproducers to check final-status fields, not a build at 100%. [17] That's honest L0 disclosure.

## In-site contrasts

- The [RSI survey](/blog/rsi-recursive-self-improvement-survey-2026/) describes a "verification hierarchy": formal verifiers on top, execution feedback next, learned judges and intrinsic confidence at the bottom; self-improvement goes roughly as far as its verification signal allows. [20] This week's reminder: formal verifiers sit on top only if they verify what you want. Once L2/L3 drift, the hardest verifier is verifying something else.
- The [SAGE post](/blog/sage-statistical-acceptance-gate-self-evolving-skills/) covers gating self-evolving skills: the optimizer is tuned carefully, but acceptance is often "merge if the total went up." [21] Type (i) autoformalization's "success if it compiles" is the same problem: the gate reads one scalar, and the optimized side finds any path that satisfies it.
- The [Claude Science nine-loop post](/blog/claude-science-harness-nine-loop-amplitudes/) noted a ratio: generation costs around a thousand dollars, verification takes experts three months and can't be formalized. [22] Math is one of the few fields where L1 goes to a machine, but L2–L4 have the same cost structure: generating is cheap, understanding is expensive.

## Audit checklist: what to check when you see "AI proved X"

By role, with each step reduced to an action where possible.

**Readers (10 minutes)**

1. Find the original repo or paper, not just the press release. Note whether the wording is "solved," "progress" or "partial results." [1][7]
2. Check **whether** the result is formalized. For OpenAI's repo, search the title in `lean/formalization.yaml`; if absent, treat it as not machine-checked. [2][19]
3. Read `history.md` or the changelog for withdrawals and revisions, and whether revisions changed the statement. [3]
4. Check who is vouching: a domain expert who read the paper, or someone who saw a green Lean build.

**Reviewers / domain experts (half a day to days)**

5. Open the Comparator challenge file, count lines, then read definitions line by line. Look for home-built definitions that diverge from standard ones; junk values in use (`sInf`, division by 0, values at poles); quantifier ranges, signs, strict versus non-strict inequalities. [6][19]
6. Check `permitted_axioms` for extras; grep for kernel-bypassing constructs such as `native_decide`, `implemented_by`, `unsafe`, `debug.skipKernelTC`. [11][17]
7. Run Comparator with an external kernel such as nanoda; record Lean, Mathlib and checker versions and commit hashes so you can rerun after future fixes. [9][10][11]
8. For each key lemma, find the matching Lean declaration and compare **hypothesis and conclusion strength** (m+4 versus m+5). Anything that doesn't match is outside L3 coverage and needs separate review. [6]
9. Confirm the problem setup—model of computation, forcing, dimension, boundary conditions—matches the original (multitape Turing machine or RAM, R³ or the torus). [7][19]

**Labs / publishers**

10. Tag every result with one of four states: unformalized; proof formalized but not matched to the paper; matched; expert-read. Don't let one blanket ratio (like 42%) stand for everything. [3][5]
11. Word claims only up to the layer covered. If the top-level statement is verified but the paper's proof isn't matched, say "the theorem is machine-checked; the paper's proof has not been matched step by step."
12. Publish the trust model—kernel, native compiler or multiple kernels—and list every exceptional dependency, as the 11-squares project does. [17]
13. Keep traceable old versions of revisions and withdrawals, and state which dependent manuscripts are affected; OpenAI's withdrawal notice does this well. [3][4]
14. Pay for human reading: bring domain experts into writing and explaining results rather than outsourcing digestion to the whole community. [12][13][14]

## What remains uncertain

- Whether and when OpenAI will match the Navier–Stokes Lean proof to the paper step by step, or answer Bastounis et al.'s specific points: as of writing I've seen no first-party response.
- "42%" is `history.md`'s top-level figure (300 / 719); I didn't independently recompute what counts as top-level. [3]
- In a guest post on Tao's blog, Lozano-Robledo says OpenAI spent the equivalent of about $15 million on Navier–Stokes; that's his claim, and I found no first-party figure. [15] Aaronson says about 8,000 problems, the README about 4,000; I go with the README. [2][13]

## References

1. OpenAI, "Sharing AI progress in mathematics", 2026-10-06. https://openai.com/index/sharing-ai-progress-in-mathematics/
2. openai/math README (current main branch and initial commit adc7f12). https://github.com/openai/math
3. openai/math, history.md. https://github.com/openai/math/blob/main/history.md
4. openai/math, withdrawal notice: Algebraicity of Weil classes on split abelian eightfolds. https://github.com/openai/math/tree/main/preprints/Algebraicity-of-Weil-classes-on-split-abelian-eightfolds-September-18-2026
5. Dan Roberts (@danintheory), tweet, 2026-10-08 05:20 UTC. https://twitter.com/danintheory/status/2108065033070789090
6. A. Bastounis, F. Circelli, A. C. Hansen, "Navier–Stokes lost in translation – Why Lean verification of AI autoformalisation does not guarantee correct natural language proofs", arXiv:2610.08144, 2026-10-06. https://arxiv.org/abs/2610.08144
7. OpenAI, "On the Navier–Stokes Millennium Prize Problem", 2026-09-08. https://openai.com/index/navier-stokes-solution/
8. openai/NavierStokesAndEuler README. https://github.com/openai/NavierStokesAndEuler
9. leanprover/comparator README. https://github.com/leanprover/comparator
10. Leonardo de Moura, "Postmortem for Kernel Soundness Bug #14576", 2026-08-01. https://leodemoura.github.io/blog/2026-8-1-postmortem-for-kernel-soundness-bug-14576/
11. Leonardo de Moura, "Postmortem for the Kernel Soundness Bug Hunt", 2026-08-24. https://leodemoura.github.io/blog/2026-8-24-postmortem-for-the-kernel-soundness-bug-hunt/
12. Asaf Karagila, "OpenAI, the Partition Principle, and mathematics", 2026-10-08. https://karagila.org/2026/openai-pp/
13. Scott Aaronson, "The Mathocalypse" and comments. https://scottaaronson.blog/?p=10169
14. Terence Tao, Mathstodon "Math 2.0" thread, 2026-10-06 UTC. https://mathstodon.xyz/@tao/117395269325940185
15. Álvaro Lozano-Robledo (guest post on Terence Tao's blog), "What should we tell our students?", 2026-10-08. https://terrytao.wordpress.com/2026/10/08/what-should-we-tell-our-students/
16. Thomas Bloom, "Changes", erdosproblems.com, 2026-10-06. https://www.erdosproblems.com/forum/thread/blog:9
17. Queuingtheorydotcom/11SquaresFormalized README and 2026-10-06 verification report. https://github.com/Queuingtheorydotcom/11SquaresFormalized
18. Hacker News, "OpenAI withdraws three mathematical results". https://news.ycombinator.com/item?id=50002650
19. openai/math `lean/formalization.yaml` and `lean/ComparatorChallenges/` (PartitionPrinciple, QuasiRiemannHypothesis, ErdosReciprocal, etc.), fetched 2026-10-09. https://github.com/openai/math/tree/main/lean
20. In-site: RSI in 2026: how much of it is really recursive. /blog/rsi-recursive-self-improvement-survey-2026/
21. In-site: SAGE: don't merge self-evolving skills just because the total score went up. /blog/sage-statistical-acceptance-gate-self-evolving-skills/
22. In-site: Claude Science harness: nine-loop amplitudes computed unattended. /blog/claude-science-harness-nine-loop-amplitudes/

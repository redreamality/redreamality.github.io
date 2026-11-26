# Search maintenance, November 26, 2026

## Scope and authorization

The owner authorized immediate investigation, fixes, verification, push, and indexing requests within the weekly SEO task, without another approval round. The existing Tuesday 04:00 heartbeat was updated with this instruction; its schedule and thread are unchanged.

Before editing, fetched origin and fast-forwarded this clean worktree from b8cb233 to 6f59e65. The earlier November 24 report had used an outdated local remote-tracking ref. Its claim to describe the latest repository inventory was not established. Upstream already contained three-language OpenSpec 2.1 and pstack update reports. This run does not duplicate those articles.

## Changes

- Three OpenSpec notes distinguish the historical 1.13.2 exercise, 1.15.0 installation examples, dated 2.0 migration instructions, the November 23 tested 2.1.1 upgrade, and the November 26 npm latest observation, 2.2.0.
- The notes link to the existing localized hands-on upgrade reports. Original publication dates, exercise commands, headings, and URLs remain.
- Three CLI tutorials replace the undated claim that latest is 2.1.1 with a dated reference to that tested release and today's registry result. This does not claim a new 2.2.0 migration test.
- The locale-link checker's CLI entry-point detection now converts the resolved script path with Node's pathToFileURL. Previously, the Windows path comparison could skip execution while returning exit code zero. Subprocess regression tests cover visible success output and nonzero failure for broken locale targets.
- The broader browser run exposed stale library-note tests that still expected hash IDs in canonical list links after the existing readable-slug migration. Tests now use the established slug mapping and explicitly retain redirect checks for both old hash URL forms in all languages. No library routes or runtime behavior changed.

The npm registry and official installation documentation returned HTTP 200 and agree on version 2.2.0 and Node.js >=22.20.0. Responses, headers, preservation checks, build/test logs, and verification results are retained in `.seo-cache/action-2026-11-26/`. No new blog topic was commissioned; these are bounded maintenance edits.

## Verification and delivery

The main task owns build execution; workers did not concurrently build dist. Both builds completed with 2,094 pages, including a final build after the tutorial corrections. The repaired locale command scanned 2,097 HTML files with zero dead language-switcher, hreflang, or x-default targets. All six changed pages passed the built HTML checks for title, single H1, self canonical, indexability, updated version text, and localized hands-on links.

The first unit run had 332 passes and one five-second timeout in the existing GSC slug test. Rerunning the whole suite with two workers passed all 333 tests without changing its assertions or timeout. All 18 focused Playwright tests passed. The first broader browser run exposed navigation timeouts and the stale library expectations above; it was stopped after preserving the log when those tests were corrected. The final full run uses an exclusive preview port, four workers, and a 60-second per-test budget. Its actual result, not the interrupted run, determines the full-suite status. Final deployment and IndexNow receipts belong in the dated evidence directory and completion addendum.

Existing CLI tutorial body counts after the paragraph edits are approximately 3,714 Chinese Han characters, 2,655 English words, and 5,838 Japanese Han/kana characters, excluding frontmatter, fenced code, HTML tags, and link destinations. The old tutorial remains below new-blog targets; this maintenance does not expand it with unrelated material. The notes are approximately 2,159 Chinese Han characters, 1,344 English words, and 3,068 Japanese Han/kana characters.

The broader full run completed with 212 passes and 29 failures. Three library-note failures exposed another stale expectation: JSON-LD now uses the shared SEO description while the test required exact equality with the raw summary. The test now requires JSON-LD/meta agreement and inclusion of the original summary; the visible summary still has an exact-text assertion. Other failures concern navigation timeouts and expectations in homepage, personal-library project, page-title, SDK, Visual, and WXT tests. Those source modules were not edited in this change; their failures remain unresolved and the full suite is not green. Full-run artifacts were preserved under `full-e2e-artifacts/`. A broad single-worker retry was stopped to keep verification focused on changed tests; its partial results are not counted as a pass. The final library-only rerun is recorded separately.

The final library-only run passed all 36 tests, including both old-ID redirects in each language, canonical/hreflang navigation, sitemap exclusions, keyboard access, and mobile layouts. Release validation for these bounded content/checker/test changes consists of the successful build, all 333 unit tests, 18 focused content tests, 36 library tests, locale scan, six-page HTML verification, and diff check. This is not a claim of full-site E2E acceptance.

## Google indexing

Remy's account redreamality@gmail.com and property sc-domain:redreamality.com were verified anew. The historical SDK URL request attempt stopped before submission because OpenCLI refused native input to a page it reported as hidden. Foreground navigation and a screenshot did not restore native input; one bounded retry failed with the same explicit error. No Google indexing request was submitted or accepted in these attempts. The task-owned session was released.

The historical November 17 queue of 19 URLs is a baseline, not proof that those pages remain unindexed or have had no subsequent requests. Its pending status is retained for reconciliation. Updated URLs in this release need version-aware reconciliation; IndexNow acceptance must not be reported as Google indexing.

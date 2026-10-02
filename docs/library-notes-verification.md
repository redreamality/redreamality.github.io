# Notes Integration Verification

## Local verification (2026-10-02)

- Read the live private archive using existing authenticated GitHub access.
- Exported 45 successful summaries using an explicit public-field allowlist.
- Re-exporting the same public content was a no-op, including after credential
  screening was strengthened.
- Verified the new archive deploy key is read-only and stored only as the main
  repository's `LIBRARY_ARCHIVE_READ_KEY` Actions secret. Temporary key files
  were removed after setup.
- Build passed with 1,098 static pages, including canonical summary pages and
  excluded-from-sitemap short aliases.
- All 258 unit tests passed.
- All 33 focused Notes browser tests passed.
- All 214 site-wide browser tests passed.
- Desktop, 320px and 390px layouts, light and dark themes, and source-summary
  pages were checked from Playwright screenshots. The mechanical UI detector
  reported no findings.
- Independent review closed its publication-boundary, deployment-recovery,
  JSON-LD injection and clear-button findings.

The validated public snapshot's SHA-256 was
`a789a7368c717c8fd464638e87b34cc9003aa162c96dc7f6e2be6c6a06062df9`.

## Deployment verification

Initial rollout uses an empty public cache. The first synchronization workflow
must read the private archive, write the real public snapshot, commit it using
the bot token, and request deployment. Live evidence will be recorded after
those steps complete; local import alone is not treated as proof of automation.

## Incidents and corrections

| Symptom | Cause | Correction and prevention |
| --- | --- | --- |
| Reads of guessed Notes, navigation and component paths failed | Existing routes live under `garden/notes`; navigation lives in Layout; new component names differed from guesses | Discover actual paths/imports before reading; no site content was lost |
| A documentation API request returned 404 | The GitHub Docs source path had moved | Used current official action documentation and require real workflow execution to validate the dispatch contract |
| A multi-file patch was rejected | An English paragraph did not match the expected older wording | Re-read the exact text and apply bounded changes; the rejected patch changed no files |
| A malformed-repository unit test made a 404 API request | The initial repository-name regex allowed `..` as an owner | Reject traversal-like components before any call and inject a mocked caller in invalid-input tests |
| Playwright could not import the JSON feed | Native Node ESM requires the JSON import attribute | Added `with { type: 'json' }` and verified test discovery before rerunning |
| Clear restored form fields but left all rows hidden | A microtask ran before the native reset completed | Prevent native reset, explicitly reset controls and synchronously update rows; all three locale regressions passed |

Review found that a field allowlist alone does not detect credential-looking
text in an allowed field. Known-format screening now covers all public strings,
decoded URL paths, and nested URLs; it is not a general private-fact detector.

The shared JSON-LD output also needed HTML-safe serialization. Browser and unit
tests now prove that an untrusted closing-script fragment remains data.

No `agent-incidents` recording utility was found. Incidents were recorded here,
not appended to persistent agent instructions; no rule promotion was performed.

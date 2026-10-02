# Library Summaries in Notes

## Public and private data

The user-authorized public projection of
`redreamality/my-personal-library-archive` is committed as
`src/data/library-notes.json`. Only successful entries are eligible.

The exporter explicitly copies:

- Stable URL-derived ID, title, original source URL, and archive-entry date.
- Chinese one-sentence summary and structured summary bullets.
- Summary coverage, including whether only part of the source was summarized.

It does not copy raw article text, filesystem paths, fetch metadata, error
history, retries, hashes of raw files, archive credentials, or unknown fields.
The private archive remains private. Publishing summaries is newly authorized
for this integration; it does not make the complete archive public.
Known credential formats are checked across public strings, including decoded
URL paths and nested URLs. Unsafe input stops publication without printing its
contents. This is a guard against recognizable secrets, not a guarantee that
arbitrary private facts can be identified automatically; review source material
and use the exclusion policy when necessary.

`date` is the archive's entry date, not the source article's publication date.
The summaries are currently Chinese. EN and JA pages localize the surrounding
interface and label the summary language; they do not pretend to translate it.
AI-generated summaries should be checked against their linked sources.

## Site routes

Existing canonical routes are retained:

| Language | Notes |
| --- | --- |
| English | `/garden/notes/` |
| Chinese | `/cn/garden/notes/` |
| Japanese | `/ja/garden/notes/` |

`/notes/`, `/cn/notes/`, and `/ja/notes/` redirect to those existing indexes.
Library details use `.../garden/notes/library/<full-sha256-id>/`.
Handwritten notes keep their existing URLs and content.

The combined list is date-sorted and supports text search and note-type
filters. All entries remain readable without JavaScript; inactive controls
are hidden in that mode. Original-source links use the existing localized
outbound confirmation page. Only canonical routes are listed in the sitemap.

## Synchronization

The **Sync library notes** workflow runs at minute 47 of each UTC hour, on
manual dispatch, and when its exporter, policy, or workflow changes on master.
GitHub schedules can be delayed. The archive has its own independent
processing schedule; this workflow does not perform new LLM requests or retry
failed archive entries.

The workflow:

1. Installs dependencies and runs publication-boundary tests.
2. Checks out the private archive's `data.json` in a separate sparse working
   tree, using `LIBRARY_ARCHIVE_READ_KEY`, a repository-scoped read-only key.
3. Produces the allowlisted JSON and validates the site build.
4. Commits only `src/data/library-notes.json` with the repository's temporary
   `GITHUB_TOKEN`, if the public content changed.
5. Checks the live master commit's Pages runs. A missing or failed deployment
   is explicitly dispatched even when the feed did not change; an already
   successful or in-progress deployment is not duplicated.

The bot token's own commit is not relied on to trigger another workflow.
The synchronization trigger excludes the generated feed, preventing a loop.
No personal access token is installed. Archive credentials are not persisted
by checkout and are not available to the browser. Private checkout paths are
outside the site and cannot be included in the Pages artifact.
The existing Pages workflows share a deployment concurrency group so a
content-triggered deployment cannot run alongside the notes-triggered one.

No timestamp is added on every sync. Changes only to private errors, attempts,
or fetch metadata produce no public diff. Invalid input fails before replacing
the previous snapshot. A failed read or export leaves the existing published
notes intact. A non-fast-forward push fails rather than rewriting history;
rerun the workflow against the current master in that case.

## Include or withdraw notes

Edit `src/data/library-notes-policy.json` to add full note IDs to `excludedIds`.
The next sync removes those entries from the feed and the next deployment
removes their detail routes and sitemap entries. The private archive itself
is not modified. An archive entry explicitly marked `publish: false` or
`visibility: "private"` is also excluded.

Only stable IDs belong in the policy file. Do not put private URLs or
explanations containing private information in the public policy.
Withdrawal removes the current site output; it does not erase earlier public
Git history, third-party caches, or copies already downloaded by readers.

## Local operation

The committed feed allows ordinary `pnpm build` with no archive credential.

```powershell
pnpm notes:sync --github
pnpm notes:sync --archive ../my-personal-library-archive/data.json
pnpm exec vitest run src/utils/library-notes-export.test.ts
pnpm build
pnpm exec playwright test e2e/library-notes.spec.ts
```

The first sync command uses existing GitHub CLI authentication. The second
uses a private local checkout; choose one source.

Do not copy the archive directory, `data.json`, or raw Markdown into `public/`
or `src/content/`. The public snapshot is generated, not hand-maintained.
The source model and extraction pipeline remain configured in
`redreamality/my-personal-library`; this integration only publishes its results.

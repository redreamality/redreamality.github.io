# Tutorial search maintenance, October 26, 2026

Scope: focused maintenance of three existing slugs in English, Chinese and Japanese. No new blog, route, commit, push or full build. The original `pubDate` values remain intact; all nine pages now have `updatedDate: 2026-10-26T00:00:00.000Z`.

## Changed files

The following files changed in each of `src/content/blog-en/`, `src/content/blog-cn/` and `src/content/blog-ja/`:

- `byobu-cheatsheet.md`
- `pythonpathvs-code.md`
- `claude-agent-sdk-python-.md`

New downloadable files:

- `public/assets/tutorial-search-repair/pythonpath_probe.py`
- `public/assets/tutorial-search-repair/sdk_offline_check.py`

This report is the twelfth file owned by this maintenance task. Unrelated concurrent changes were not reverted or edited.

## Search tasks addressed

| Page | Change |
| --- | --- |
| Byobu | Task-to-command lookup for sessions, attach, rename and windows; backend boundary; disconnect recovery; terminal interception; explicit detach versus shell termination |
| PYTHONPATH | Failure-process diagnostics, process inheritance, debugger versus terminal configuration, a complete debug launch example, a runnable import probe and seven isolated import-path checks |
| Claude SDK | Symptom links to existing sections, search-oriented titles and descriptions, current versus 0.1.3 timeout boundaries, offline version check, dependency repair reproduced from the existing cleanup fixture |

Byobu still targets terminal tasks, not the ambiguous broad term for Japanese screens. The original Installing, Starting, Basic Operations and Configuring labels are retained as headings in English; their original Chinese and Japanese equivalents also remain. The baseline Byobu files had these labels as plain text, not Markdown headings. No existing rendered heading was removed from any of the nine pages.

PYTHONPATH's terminal settings now use an explicit source directory without appending a possibly empty inherited variable. Chinese and Japanese environment examples use `uv venv`, matching the English article. Their `.env` comparison rows now state that a launcher must load the file.

The SDK's six Python blocks, lifecycle implementation, existing section headings and fixture-boundary strings remain unchanged. The installation command gains one dependency pin.

## Official sources checked

Checked on October 26, 2026. Web tool calls returned no readable payload, so the official pages were additionally fetched over HTTPS with Node `fetch`; the following requests returned HTTP 200. No third-party summary was used for the new technical claims.

- [Byobu](https://byobu.org/): tmux/screen selection, keybindings, F6 versus Shift+F6, F1, Shift+F12 and pane actions.
- [tmux manual source](https://github.com/tmux/tmux/blob/master/tmux.1): session and client commands. Raw source fetched from the official repository.
- [VS Code Python environments](https://code.visualstudio.com/docs/python/environments): `python.terminal.useEnvFile` defaults to false and controls terminal injection.
- [VS Code Python debugging](https://code.visualstudio.com/docs/python/debugging): launch `env`, `envFile`, working directory and debug configuration.
- [Python command-line reference](https://docs.python.org/3/using/cmdline.html): `-E` and `-I` ignore PYTHON environment variables.
- [Current Claude Python SDK reference](https://code.claude.com/docs/en/agent-sdk/python): current `HookMatcher.timeout` is in seconds; `API_TIMEOUT_MS` limits response-header waiting for each attempt rather than the entire stream.
- [MCP 1.18.0 source](https://github.com/modelcontextprotocol/python-sdk/blob/v1.18.0/src/mcp/server/fastmcp/utilities/func_metadata.py): imports `eval_type_backport` from Pydantic internals.
- [Pydantic 2.11.7 source](https://github.com/pydantic/pydantic/blob/v2.11.7/pydantic/_internal/_typing_extra.py): contains that helper.

## Reproduced SDK failure and repair

Executed the exact `cleanupFixture` string extracted from `e2e/sdk-content.spec.ts`, against all three article source files, with the test's Python 3.12, SDK 0.1.3, MCP 1.18.0 and AnyIO 4.11.0 inputs. This runs the original Python assertions without starting the preview server or relying on old `dist`.

The unconstrained dependency resolution selected **Pydantic 2.14.1**. It failed before executing article code:

```text
ImportError: cannot import name 'eval_type_backport'
from 'pydantic._internal._typing_extra'
```

Added `pydantic==2.11.7` to the reproduction environment. All original cleanup assertions then passed for each language, including success, missing result, error result, turn timeout, external cancellation, cancellation during cleanup and bounded stalled cleanup.

```text
PASS cleanup completed and cancellation preserved: blog-en
PASS cleanup completed and cancellation preserved: blog-cn
PASS cleanup completed and cancellation preserved: blog-ja
```

No lifecycle bug was reproduced after correcting the dependency mismatch. `run_turns()` was therefore preserved. The new pin is in the three installation commands and the downloadable checker. It reproduces this historical tutorial, not a recommendation for new production deployments or a complete lock of every transitive dependency.

## Focused verification

- Astro's `createMarkdownProcessor()` rendered each of the nine article bodies without a site build.
- Every baseline heading ID remained in its current rendered body. All new local fragment links resolve. No article body renders an H1.
- Original publication dates were compared with Git HEAD; all match. All nine update dates match the requested timestamp.
- All JSON fences parse. All six SDK Python blocks are identical across translations and parse as Python.
- Actual Python 3.12 execution passed the installation/signature example, local hook callback and local MCP handler in each language.
- The original cleanup fixture passed for all three articles with the additional Pydantic pin, including a final run after the edits.
- `pythonpath_probe.py --self-test` passed all seven checks: unset variable, correct parent, incorrect package directory, absolute path with changed cwd, relative path with changed cwd, `-E` and `-I`. Successful imports also verify the actual module file.
- `uv run --python 3.12 public/assets/tutorial-search-repair/sdk_offline_check.py` passed its four version checks and signature checks.
- Scoped `git diff --check` passed. Chinese rhythm checks found no run of three or more short sentences. The prose keyword scan's `transcript_path` match is an SDK fixture field, not an editorial narration.

The exact Playwright test wrapper and browser assertions were not run in this subtask. Its Python runtime fixture was executed directly with the same assertions and source inputs. No real Claude process, credentials, model request or paid API call was used.

## Parent integration requirements

The parent owns E2E changes and the final build.

1. Add `--with pydantic==2.11.7` to the runtime test's `uv` arguments, or supply `SDK_CONTENT_PYTHON` for an interpreter with that combination. Adding the pin to the fixture's version checks will prevent accidental mismatch. Without this change the default runtime test still fails on fresh dependency resolution.
2. Update the three exact SDK H1 expectations:
   - English: `Claude Agent SDK Python: lifecycle, cancellation and timeouts`
   - Chinese: `Claude Agent SDK Python：生命周期、取消与超时排障`
   - Japanese: `Claude Agent SDK Python：ライフサイクル、キャンセル、タイムアウト`
3. No changes are needed to the SDK's six-block count, existing heading names, fixture-boundary strings or cleanup assertions. The installation command retains the previous three-pin substring and adds the fourth pin.
4. Build once after parallel work finishes, then run the parent's route, download, old-anchor and focused rendered-content checks. Existing body rendering checks do not establish live HTTP routes or full-layout overflow.

No source-level blocker remains in this scope. The E2E dependency configuration and changed title expectations remain parent integration work.

## Actual length

Counts exclude frontmatter, fenced code and link destinations, retaining headings, table text and inline code. English uses word tokens; Chinese counts Han characters; Japanese counts Han, hiragana and katakana characters.

| Slug | Chinese Han characters | English words | Japanese characters |
| --- | ---: | ---: | ---: |
| `byobu-cheatsheet` | 833 | 608 | 1,341 |
| `pythonpathvs-code` | 2,729 | 2,134 | 4,315 |
| `claude-agent-sdk-python-` | 5,245 | 3,554 | 7,695 |

Byobu and PYTHONPATH remain focused legacy maintenance as requested. They were not padded to the new-blog length target. The SDK's existing complete explanation is preserved.

## Limitations

No interactive Linux Byobu session or VS Code GUI launch was executed on this Windows host. Byobu commands and keybindings were checked against official documentation; the reconnection walkthrough remains a user-executable check. The Python probe validates actual interpreter behavior and child-process environments, not the installed VS Code extension's UI integration. No search improvement or CTR effect is claimed; those require later Search Console observation.

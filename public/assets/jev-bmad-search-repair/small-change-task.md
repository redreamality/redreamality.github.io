# Shared small-change task

This is an author-written exercise and acceptance contract, not a generated
BMAD, Spec Kit, OpenSpec, or PromptX artifact.

## Request

Add `normalize_name(value)` in `normalize_name.py` using only Python's standard
library. Trim leading and trailing whitespace and replace each internal run of
whitespace with one ASCII space. Return an empty string for empty or
whitespace-only input. Raise `TypeError` for non-string values.

Use Python `str.split()` whitespace semantics, including nonbreaking and
ideographic spaces. Preserve the remaining text, case, and punctuation.
Do not normalize Unicode composition or transliterate names.

No network, additional dependencies, Git commits, or pushes are part of this
exercise. This function is a display-text helper, not legal identity validation.

## Acceptance

| Input | Expected |
| --- | --- |
| `"  Ada   Lovelace  "` | `"Ada Lovelace"` |
| `""`, `" \t\n "` | `""` |
| `"Ada\t \nLovelace"` | `"Ada Lovelace"` |
| `"Ada\u00a0\u3000Lovelace"` | `"Ada Lovelace"` |
| `"\u5f20  \u4e09"` | `"\u5f20 \u4e09"` |
| `None`, `1`, `False`, `[]`, `b"Ada"` | `TypeError` |
| An already normalized result | The same result |

## Compare decisions, not elapsed time

Record which workflow was selected, where the accepted behavior lives, which
files changed, which requirements needed human clarification, and the exact
test command and exit status. Run in separate scratch directories.

The supplied `normalize_name.py` is a reference implementation written for this
article. To evaluate an agent, provide the task and acceptance tests in its
scratch directory without giving it the reference implementation first.

Run `uv run --no-project python -B -m unittest -v test_normalize_name.py`.
Do not claim a tool completed the change merely because the reference passes.

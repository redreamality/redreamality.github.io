# List tasks by completion status

Users read all tasks or select open or completed tasks in a local JSON file.
The command leaves the file unchanged.

## Sub-features

- `default` lists both tasks without a filter.
- `all` lists both tasks with an explicit filter.
- `open` lists only incomplete tasks.
- `done` lists only complete tasks.
- `invalid-status` rejects an unsupported status.
- `missing-status` rejects a flag without its value.
- `invalid-data` rejects input that is not a task list.

## How to get to it (user POV)

Open a terminal in the example directory and run `node task-cli.mjs tasks.json`.
Add `--status all`, `--status open`, or `--status done` to select a list.

## Driving it with Node.js

Preconditions:

- Node.js 22 or newer is installed.
- The example fixture contains task 1, `Write release notes`, with `done: false`,
  and task 2, `Publish release`, with `done: true`.
- Use the example files, not an existing project's task data.

- Default list: run `node task-cli.mjs tasks.json`. Expect IDs `[1, 2]` in order.
- All list: run `node task-cli.mjs tasks.json --status all`. Expect IDs `[1, 2]`.
- Open list: run `node task-cli.mjs tasks.json --status open`.
  Expect `[{"id":1,"title":"Write release notes","done":false}]`.
- Done list: run `node task-cli.mjs tasks.json --status done`.
  Expect `[{"id":2,"title":"Publish release","done":true}]`.
- Invalid status: run `node task-cli.mjs tasks.json --status pending`.
  Expect exit 2, empty stdout, and a usage message on stderr.
- Missing status: run `node task-cli.mjs tasks.json --status`.
  Expect exit 2, empty stdout, and the same usage message.
- Invalid data: run `node task-cli.mjs verify.mjs`.
  Expect exit 2, empty stdout, and `Cannot read a valid task list` on stderr.
- Evidence: run `node verify.mjs task-cli.mjs evidence-after.json`.
  Expect seven passing command checks, an unchanged fixture, and exit 0.

## Gotchas

- Valid list commands exit 0 and write JSON to stdout with empty stderr.
- A process that exits 0 but returns task 2 for the open list has failed verification.
- The default-list check alone misses the supplied bug.
- `task-cli.before.mjs` is intentionally faulty. Verify it with
  `node verify.mjs task-cli.before.mjs evidence-before.json`; expect exit 1.
- Evidence files prove these CLI checks only. They do not prove a model ran a
  pstack playbook, reviewed the change, or created a verification skill.

# Task list verification map

This is a site-authored teaching example, not output from a pstack skill run.
It follows the feature-file structure in pstack's create-verification-skill reference.

## Preconditions

Run commands from the directory containing `task-cli.mjs` and `tasks.json`.
Use Node.js 22 or newer. No package installation, server, credentials, or network is needed.
`node --version` checks the runtime. `node task-cli.mjs tasks.json` must show IDs 1 and 2.
Do not run against personal task data.

## Features

- [List tasks by completion status](./list-tasks.md) covers the default list,
  explicit all, open, done, invalid status, missing status, and invalid input.

## Evidence and cleanup

Run `node verify.mjs task-cli.mjs evidence-after.json`.
The report records exact arguments, stdout, stderr, exit status, expected values,
source and fixture SHA-256 hashes, and whether the fixture stayed unchanged.
No server or temporary data needs cleanup. Retain the JSON evidence.

## Maintenance example

Before adding a status option, a map that says only "run the default list and see
two tasks" covers the default entry point. It does not cover filtering.
After adding `--status`, add separate open, done, all, and invalid-input recipes
to `list-tasks.md`, then run all of them. The included buggy fixture passes the
default-list check but fails the open-list check. Keep the expected open ID as 1;
do not change it to 2 merely to make the failing check pass.

If the product intentionally replaces `--status open` with another command,
update the command in the map and runner together, run it, and keep fresh evidence.
If the command stays the same but returns a completed task, report a product defect.

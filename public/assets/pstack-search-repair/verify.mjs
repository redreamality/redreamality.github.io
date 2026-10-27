import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [target = 'task-cli.mjs', evidence] = process.argv.slice(2);
const root = fileURLToPath(new URL('.', import.meta.url));
const targetPath = resolve(root, target);
const fixturePath = resolve(root, 'tasks.json');
const fixtureBefore = readFileSync(fixturePath);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const all = '[{"id":1,"title":"Write release notes","done":false},{"id":2,"title":"Publish release","done":true}]\n';
const usage = 'Usage: node task-cli.mjs <file.json> [--status all|open|done]\n';
const cases = [
  { id: 'open', args: ['tasks.json', '--status', 'open'], code: 0,
    stdout: '[{"id":1,"title":"Write release notes","done":false}]\n', stderr: '' },
  { id: 'done', args: ['tasks.json', '--status', 'done'], code: 0,
    stdout: '[{"id":2,"title":"Publish release","done":true}]\n', stderr: '' },
  { id: 'default', args: ['tasks.json'], code: 0, stdout: all, stderr: '' },
  { id: 'all', args: ['tasks.json', '--status', 'all'], code: 0, stdout: all, stderr: '' },
  { id: 'invalid-status', args: ['tasks.json', '--status', 'pending'], code: 2,
    stdout: '', stderr: usage },
  { id: 'missing-status', args: ['tasks.json', '--status'], code: 2,
    stdout: '', stderr: usage },
  { id: 'invalid-data', args: ['verify.mjs'], code: 2, stdout: '',
    stderr: 'Cannot read a valid task list\n' },
];
const results = cases.map(test => {
  const run = spawnSync(process.execPath, [targetPath, ...test.args], {
    cwd: root, encoding: 'utf8', timeout: 5000,
  });
  const actual = { code: run.status, stdout: run.stdout, stderr: run.stderr };
  const expected = { code: test.code, stdout: test.stdout, stderr: test.stderr };
  let passed = !run.error;
  try { assert.deepEqual(actual, expected); } catch { passed = false; }
  return { id: test.id, command: ['node', basename(targetPath), ...test.args],
    expected, actual, passed, ...(run.error ? { error: run.error.message } : {}) };
});
const fixtureUnchanged = fixtureBefore.equals(readFileSync(fixturePath));
const passed = fixtureUnchanged && results.every(result => result.passed);
const report = {
  recordedAt: new Date().toISOString(),
  node: process.version, platform: process.platform, arch: process.arch,
  target: basename(targetPath), targetSha256: hash(readFileSync(targetPath)),
  fixtureSha256: hash(fixtureBefore), fixtureUnchanged,
  scope: 'Local CLI execution only; no pstack model workflow was executed.',
  results, passed,
};
if (evidence) writeFileSync(resolve(root, evidence), JSON.stringify(report, null, 2) + '\n');
for (const result of results) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.id}`);
console.log(`${fixtureUnchanged ? 'PASS' : 'FAIL'} fixture unchanged`);
process.exitCode = passed ? 0 : 1;

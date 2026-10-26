import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Pass the pnpm.cjs path on Windows to avoid shell quoting of executable shims.
const pnpmScript = process.argv[2];
const executable = pnpmScript ? process.execPath : 'pnpm';
const prefix = pnpmScript ? [resolve(pnpmScript)] : [];
const root = mkdtempSync(join(tmpdir(), 'openspec-examples-'));
const env = {
	...process.env,
	XDG_CONFIG_HOME: join(root, 'config'),
	XDG_DATA_HOME: join(root, 'data'),
	OPENSPEC_TELEMETRY: '0',
	DO_NOT_TRACK: '1',
	CI: '1',
};
const records = [];
function run(cwd, args, version = '1.15.0', expectedExit = 0) {
	const result = spawnSync(executable, [...prefix, 'dlx', `@fission-ai/openspec@${version}`, ...args], {
		cwd, env, encoding: 'utf8', timeout: 120000,
	});
	records.push({ cwd, version, args, exit: result.status, stdout: result.stdout, stderr: result.stderr });
	writeFileSync(join(root, 'results.json'), JSON.stringify(records, null, 2));
	assert.equal(result.status, expectedExit, `${args.join(' ')}\n${result.error || result.stderr}`);
	return result.stdout;
}
function put(path, content) {
	mkdirSync(resolve(path, '..'), { recursive: true });
	writeFileSync(path, content);
}
const store = join(root, 'team-contracts');
const api = join(root, 'checkout-api');
const web = join(root, 'checkout-web');
for (const path of [api, web]) {
	mkdirSync(path);
	execFileSync('git', ['init', '--quiet', path]);
}
assert.equal(run(root, ['--version']).trim(), '1.15.0');
for (const args of [['version', '--help'], ['init', '--help'], ['new', 'change', '--help'], ['validate', '--help'], ['store', 'setup', '--help']]) {
	run(root, args);
}
run(root, ['store', 'setup', 'team-contracts', '--path', store, '--no-init-git', '--json']);
const contract = `## Purpose
Define the shared response used by the checkout API and web client.

## Requirements

### Requirement: Promotion eligibility
The API SHALL return an eligible boolean and a reason string for a promotion.

#### Scenario: Ineligible promotion
- **WHEN** the promotion cannot be used
- **THEN** eligible is false and reason explains why
`;
put(join(store, 'openspec/specs/promotion/spec.md'), contract);
run(root, ['validate', 'promotion', '--type', 'spec', '--store', 'team-contracts', '--strict', '--json', '--no-interactive']);
for (const [repo, change] of [[api, 'implement-promotion-api'], [web, 'implement-promotion-ui']]) {
	run(repo, ['init', '.', '--tools', 'none']);
	put(join(repo, 'openspec/config.yaml'), 'schema: spec-driven\nreferences:\n  - team-contracts\n');
	run(repo, ['new', 'change', change]);
	const instructions = JSON.parse(run(repo, ['instructions', 'proposal', '--change', change, '--json']));
	assert.equal(instructions.root.path, repo);
	assert.equal(instructions.references[0].specs[0].id, 'promotion');
	assert.equal(instructions.references[0].fetch, 'openspec show <spec-id> --type spec --store team-contracts');
	assert.ok(existsSync(join(repo, 'openspec/changes', change)));
	assert.ok(!existsSync(join(store, 'openspec/changes', change)));
	run(repo, ['context', '--json']);
	run(repo, ['doctor', '--json']);
}
run(api, ['new', 'change', 'revise-promotion-contract', '--store', 'team-contracts']);
assert.ok(existsSync(join(store, 'openspec/changes/revise-promotion-contract')));
assert.ok(!existsSync(join(api, 'openspec/changes/revise-promotion-contract')));
run(api, ['show', 'promotion', '--type', 'spec', '--store', 'team-contracts']);
run(root, ['store', 'unregister', 'team-contracts']);
assert.ok(existsSync(join(store, 'openspec/specs/promotion/spec.md')));
const unhealthy = JSON.parse(run(api, ['doctor', '--json']));
assert.equal(unhealthy.references[0].status[0].code, 'reference_unresolved');
run(root, ['store', 'register', store, '--id', 'team-contracts', '--json']);
run(api, ['doctor', '--json']);

// The optional repository argument replays the tutorial's actual Markdown files.
const repoRoot = process.argv[3];
if (repoRoot) {
	for (const locale of ['en', 'cn', 'ja']) {
		const article = readFileSync(join(resolve(repoRoot), `src/content/blog-${locale}/openspec-tutorial-cli-commands-agents-md-examples.md`), 'utf8');
		const blocks = [...article.matchAll(/```markdown\r?\n([\s\S]*?)```/g)].map(match => match[1]);
		const proposal = blocks.find(text => text.startsWith('# Change: add-magic-link-login'));
		const delta = blocks.find(text => text.includes('## ADDED Requirements'));
		const design = blocks.find(text => text.startsWith('## Context'));
		const tasks = blocks.find(text => text.startsWith('## 1. Implementation'));
		assert.ok(proposal && delta && design && tasks, `Missing ${locale} tutorial artifact`);
		for (const version of ['1.13.2', '1.15.0']) {
			const practice = join(root, `tutorial-${locale}-${version}`);
			mkdirSync(practice);
			run(practice, ['init', '.', '--tools', 'none'], version);
			run(practice, ['new', 'change', 'add-magic-link-login'], version);
			const changeRoot = join(practice, 'openspec/changes/add-magic-link-login');
			for (const [file, text] of [['proposal.md', proposal], ['specs/auth/spec.md', delta], ['design.md', design], ['tasks.md', tasks]]) {
				put(join(changeRoot, file), text);
			}
			run(practice, ['status', '--change', 'add-magic-link-login', '--json'], version);
			run(practice, ['validate', 'add-magic-link-login', '--strict', '--json', '--no-interactive'], version);
			run(practice, ['archive', 'add-magic-link-login', '--yes'], version);
			run(practice, ['validate', 'auth', '--type', 'spec', '--strict', '--json', '--no-interactive'], version);
			assert.ok(readFileSync(join(practice, 'openspec/specs/auth/spec.md'), 'utf8').includes('Preserve password sign-in'));
		}
	}
}
console.log(`PASS: ${records.length} CLI checks. No model calls, remote Git operations, or global installation.`);
console.log(`Evidence and practice files: ${root}`);

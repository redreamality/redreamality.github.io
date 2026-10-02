import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function deploymentDecision(runs, sha) {
  if (!Array.isArray(runs) || !/^[a-f0-9]{40}$/.test(sha)) throw new Error('invalid_deployment_state');
  const matching = runs.filter(run => run.headSha === sha);
  if (matching.some(run => run.status === 'completed' && run.conclusion === 'success')) return 'already-succeeded';
  if (matching.some(run => ['queued', 'in_progress', 'waiting', 'pending', 'requested'].includes(run.status))) return 'in-progress';
  return 'request';
}

export function ensurePagesDeployment(repository, call = args => execFileSync('gh', args, {
  encoding: 'utf8', maxBuffer: 2 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
})) {
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/.test(repository ?? '') ||
      ['.', '..'].includes(repository.split('/')[1])) throw new Error('invalid_repository');
  // Read the live ref: another publisher may have advanced master during sync.
  const sha = call(['api', `repos/${repository}/git/ref/heads/master`, '--jq', '.object.sha']).trim();
  const runs = JSON.parse(call([
    'run', 'list', '--repo', repository, '--workflow', 'deploy.yml', '--branch', 'master',
    '--commit', sha, '--limit', '30', '--json', 'headSha,status,conclusion',
  ]));
  const decision = deploymentDecision(runs, sha);
  if (decision === 'request') {
    call(['workflow', 'run', 'deploy.yml', '--repo', repository, '--ref', 'master']);
  }
  return { deployment: decision === 'request' ? 'requested' : decision, sha };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    console.log(JSON.stringify(ensurePagesDeployment(process.env.GITHUB_REPOSITORY)));
  } catch {
    console.error(JSON.stringify({ error: 'pages_deployment_check_failed' }));
    process.exitCode = 1;
  }
}

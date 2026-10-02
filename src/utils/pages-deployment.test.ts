// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { deploymentDecision, ensurePagesDeployment } from '../../scripts/ensure-pages-deployment.mjs';

const sha = 'a'.repeat(40);
const old = 'b'.repeat(40);
describe('Pages deployment recovery after public note synchronization', () => {
  it('requests missing, failed, cancelled and timed-out deployments', () => {
    expect(deploymentDecision([], sha)).toBe('request');
    for (const conclusion of ['failure', 'cancelled', 'timed_out', 'neutral']) {
      expect(deploymentDecision([{ headSha: sha, status: 'completed', conclusion }], sha)).toBe('request');
    }
  });
  it('avoids duplicate requests for the same active or successful commit', () => {
    for (const status of ['queued', 'in_progress', 'pending', 'waiting']) {
      expect(deploymentDecision([{ headSha: sha, status, conclusion: '' }], sha)).toBe('in-progress');
    }
    expect(deploymentDecision([{ headSha: sha, status: 'completed', conclusion: 'success' }], sha))
      .toBe('already-succeeded');
  });
  it('does not mistake an older deployed commit for the current snapshot', () => {
    expect(deploymentDecision([{ headSha: old, status: 'completed', conclusion: 'success' }], sha)).toBe('request');
  });
  it('checks the live ref and repairs deployment even when the feed did not change', () => {
    const calls: string[][] = [];
    const run = (args: string[]) => {
      calls.push(args);
      if (args[0] === 'api') return `${sha}\n`;
      if (args[0] === 'run') return JSON.stringify([{ headSha: sha, status: 'completed', conclusion: 'failure' }]);
      return '';
    };
    expect(ensurePagesDeployment('redreamality/redreamality.github.io', run))
      .toEqual({ deployment: 'requested', sha });
    expect(calls[1]).toContain(sha);
    expect(calls[2]).toEqual(['workflow', 'run', 'deploy.yml', '--repo', 'redreamality/redreamality.github.io', '--ref', 'master']);
  });
  it('does not dispatch if already deployed and propagates failed inspection for the next retry', () => {
    const calls: string[][] = [];
    expect(ensurePagesDeployment('owner/repo', (args: string[]) => {
      calls.push(args);
      return args[0] === 'api' ? sha : JSON.stringify([{ headSha: sha, status: 'completed', conclusion: 'success' }]);
    })).toEqual({ deployment: 'already-succeeded', sha });
    expect(calls).toHaveLength(2);
    expect(() => ensurePagesDeployment('owner/repo', () => { throw new Error('offline'); })).toThrow('offline');
  });
  it('rejects malformed input without treating it as a verified deployment', () => {
    expect(() => deploymentDecision({}, sha)).toThrow('invalid_deployment_state');
    expect(() => deploymentDecision([], 'unknown')).toThrow('invalid_deployment_state');
    const unexpectedCall = () => { throw new Error('unexpected_network'); };
    for (const repository of ['../wrong', 'owner/..', 'owner/.', '/wrong', 'owner/repo/extra']) {
      expect(() => ensurePagesDeployment(repository, unexpectedCall)).toThrow('invalid_repository');
    }
  });
});

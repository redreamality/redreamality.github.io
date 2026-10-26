import { readFileSync } from 'node:fs';

const [file, flag, status = 'all', ...extra] = process.argv.slice(2);
if (!file || (flag !== undefined && flag !== '--status') ||
    !['all', 'open', 'done'].includes(status) || extra.length ||
    (flag === '--status' && process.argv.length < 5)) {
  console.error('Usage: node task-cli.mjs <file.json> [--status all|open|done]');
  process.exit(2);
}
try {
  const tasks = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(tasks) || tasks.some(task => !task ||
      !Number.isInteger(task.id) || typeof task.title !== 'string' ||
      typeof task.done !== 'boolean')) throw new Error('Invalid tasks');
  const selected = tasks.filter(task => status === 'all' ||
    (status === 'open' ? task.done : task.done));
  console.log(JSON.stringify(selected));
} catch {
  console.error('Cannot read a valid task list');
  process.exit(2);
}

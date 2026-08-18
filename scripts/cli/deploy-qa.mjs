import { spawnSync } from 'node:child_process';
import { buildTaskReport } from '../lib/task-report.mjs';
import { cliProjectRoot, fail } from './args.mjs';

const projectRoot = cliProjectRoot();
const report = buildTaskReport(projectRoot);
if (!report.ok) fail(report.message);

if (!report.qaDeployCommand) {
  fail([
    'No QA deploy command is configured.',
    'Add one explicitly in .ai/config.json:',
    '{ "qaDeployCommand": "your-project-specific-command" }',
    'This framework will never infer a deploy command.',
  ].join('\n'));
}

if (report.blockers.length) {
  fail(`Cannot deploy to QA:\n- ${report.blockers.join('\n- ')}`);
}

const result = spawnSync(report.qaDeployCommand, {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
  windowsHide: true,
});
process.exit(result.status == null ? 1 : result.status);

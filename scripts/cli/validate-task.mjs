import { buildTaskReport, formatTaskReport } from '../lib/task-report.mjs';
import { cliProjectRoot, fail } from './args.mjs';

const projectRoot = cliProjectRoot();
const report = buildTaskReport(projectRoot);
if (!report.ok) fail(report.message);
process.stdout.write(`${formatTaskReport(report)}\n`);

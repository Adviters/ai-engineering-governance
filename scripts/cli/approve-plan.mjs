import { appendAudit } from '../lib/audit.mjs';
import { AUDIT_EVENTS } from '../lib/constants.mjs';
import { gitUserEmail } from '../lib/git.mjs';
import { planHashFromContent } from '../lib/hash.mjs';
import { parsePlan } from '../lib/plan.mjs';
import { loadGovernanceContext } from '../lib/runtime.mjs';
import { readPlan, writeApproval } from '../lib/task-store.mjs';
import { arg, cliProjectRoot, fail } from './args.mjs';

const projectRoot = cliProjectRoot();
const gov = loadGovernanceContext({ workspace_roots: [projectRoot] });
if (!gov.ok) fail(gov.message);

const taskId = arg(0) || gov.taskId;
if (!taskId) fail('No active task. Pass a task id or run start-task first.');

const markdown = readPlan(projectRoot, taskId);
if (!markdown) fail('PLAN.md is missing. Create a plan before approval.');

const parsed = parsePlan(markdown);
if (!parsed.ok) fail(`Plan is not approvable: ${parsed.error}`);

const email = gitUserEmail(projectRoot);
if (!email) fail('git config user.email is not set. Approval requires a local git identity.');

const planHash = planHashFromContent(markdown);
writeApproval(projectRoot, taskId, {
  status: 'APPROVED',
  planPath: 'PLAN.md',
  planHash,
  approvedBy: email,
  approvedAt: new Date().toISOString(),
});

appendAudit(projectRoot, {
  event: AUDIT_EVENTS.PLAN_APPROVED,
  taskId,
  actor: email,
  metadata: { planHash },
});

process.stdout.write(`Plan approved for ${taskId} by ${email}\nHash: ${planHash}\n`);

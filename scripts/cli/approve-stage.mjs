import { appendAudit } from '../lib/audit.mjs';
import { AUDIT_EVENTS } from '../lib/constants.mjs';
import { gitUserEmail } from '../lib/git.mjs';
import { markStageApproved } from '../lib/guards/stage-progress.mjs';
import { loadGovernanceContext } from '../lib/runtime.mjs';
import { writeProgress } from '../lib/task-store.mjs';
import { arg, cliProjectRoot, fail } from './args.mjs';

const projectRoot = cliProjectRoot();
const gov = loadGovernanceContext({ workspace_roots: [projectRoot] });
if (!gov.ok) fail(gov.message);
if (!gov.taskId) fail('No active task.');

const email = gitUserEmail(projectRoot);
if (!email) fail('git config user.email is not set. Stage approval requires a local git identity.');

const stageId = arg(0) || gov.progress?.currentStage;
if (stageId == null) fail('No stage id given and no current stage is active.');

const verification = gov.progress?.verificationStatus?.[String(stageId)];
if (verification !== 'PASSED') {
  fail(`Stage ${stageId} is not verified. verificationStatus must be PASSED before approval.`);
}

const progress = markStageApproved(gov.progress, stageId);
writeProgress(projectRoot, gov.taskId, progress);
appendAudit(projectRoot, {
  event: AUDIT_EVENTS.STAGE_APPROVED,
  taskId: gov.taskId,
  actor: email,
  metadata: { stageId: String(stageId) },
});

process.stdout.write(`Stage ${stageId} approved for ${gov.taskId} by ${email}\n`);

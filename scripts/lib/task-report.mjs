import { hashesMatch, planHashFromContent } from './hash.mjs';
import { parsePlan } from './plan.mjs';
import { currentBranch, isProtectedBranch, workingTreeStatus } from './git.mjs';
import { loadGovernanceContext } from './runtime.mjs';

export function buildTaskReport(projectRoot) {
  const gov = loadGovernanceContext({ workspace_roots: [projectRoot] });
  if (!gov.ok) {
    return {
      ok: false,
      message: gov.message,
      blockers: [gov.message],
    };
  }

  const parsed = parsePlan(gov.planMarkdown);
  const stages = parsed.ok ? parsed.plan.stages : [];
  const completed = (gov.progress?.completedStages || []).map(String);
  const pending = stages.filter((stage) => !completed.includes(String(stage.id))).map((stage) => stage.id);
  const currentHash = gov.planMarkdown ? planHashFromContent(gov.planMarkdown) : null;
  const approvalStatus = gov.approval?.status || (gov.planMarkdown ? 'DRAFT' : 'NONE');
  const hashOk = approvalStatus !== 'APPROVED' || hashesMatch(currentHash, gov.approval?.planHash);
  const tree = workingTreeStatus(projectRoot);
  const branch = currentBranch(projectRoot);
  const planRequired = gov.task?.classification === 'PLAN_REQUIRED' || gov.task?.classification === 'HIGH_RISK';
  const qualityGate = qualityGateStatus(gov, stages, completed, hashOk);
  const blockers = collectBlockers({ gov, parsed, hashOk, tree, branch, qualityGate, planRequired });

  return {
    ok: true,
    taskId: gov.taskId || null,
    classification: gov.task?.classification || null,
    branch,
    taskBranch: gov.task?.branch || null,
    planRequired,
    planStatus: gov.planMarkdown ? (parsed.ok ? 'PARSED' : parsed.error) : 'MISSING',
    planApproval: approvalStatus,
    planHashOk: hashOk,
    currentStage: gov.progress?.currentStage ?? null,
    completedStages: completed,
    pendingStages: pending,
    filesModified: gov.progress?.modifiedFiles || [],
    qualityGate,
    dirty: tree.dirty,
    protectedBranch: isProtectedBranch(branch, gov.config.protectedBranches),
    qaDeployCommand: gov.config.qaDeployCommand,
    blockers,
    gov,
  };
}

function qualityGateStatus(gov, stages, completed, hashOk) {
  if (!gov.task) return 'NO_TASK';
  if (gov.progress?.qualityGate) return gov.progress.qualityGate;
  if (gov.task.status === 'COMPLETED') return 'PASSED';
  if (gov.task.classification === 'READ_ONLY') return 'NOT_APPLICABLE';
  if (!hashOk) return 'FAILED';
  if ((gov.task.classification === 'PLAN_REQUIRED' || gov.task.classification === 'HIGH_RISK') && stages.length > 0) {
    if (completed.length < stages.length) return 'PENDING';
    return 'PASSED';
  }
  return 'PENDING';
}

function collectBlockers({ gov, parsed, hashOk, tree, branch, qualityGate, planRequired }) {
  const blockers = [];
  if (!gov.task) blockers.push('No active task.');
  if (planRequired && !gov.planMarkdown) blockers.push('Plan is required but missing.');
  if (planRequired && gov.planMarkdown && !parsed.ok) blockers.push(`Plan stages are invalid: ${parsed.error}.`);
  if (planRequired && gov.config.requirePlanApproval && gov.approval?.status !== 'APPROVED') {
    blockers.push('Plan is not approved.');
  }
  if (!hashOk) blockers.push('Approved plan hash does not match current PLAN.md.');
  if (qualityGate === 'FAILED') blockers.push('Quality gate failed.');
  if (qualityGate === 'PENDING') blockers.push('Quality gate is pending.');
  if (tree.dirty) blockers.push('Working tree is dirty.');
  if (isProtectedBranch(branch, gov.config.protectedBranches)) blockers.push(`Current branch ${branch} is protected.`);
  return blockers;
}

export function formatTaskReport(report) {
  if (!report.ok) return report.message;
  const lines = [
    `Task ID: ${report.taskId || '(none)'}`,
    `Classification: ${report.classification || '(none)'}`,
    `Branch: ${report.branch || '(unknown)'}`,
    `Plan required: ${report.planRequired}`,
    `Plan status: ${report.planStatus}`,
    `Plan approval: ${report.planApproval}`,
    `Current stage: ${report.currentStage ?? '(none)'}`,
    `Completed stages: ${report.completedStages.join(', ') || '(none)'}`,
    `Pending stages: ${report.pendingStages.join(', ') || '(none)'}`,
    `Files modified: ${report.filesModified.join(', ') || '(none)'}`,
    `Quality gate status: ${report.qualityGate}`,
    `Blocking issues: ${report.blockers.length ? report.blockers.join(' | ') : '(none)'}`,
  ];
  return lines.join('\n');
}

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { followup, writeJson } from '../lib/respond.mjs';
import { loadGovernanceContext } from '../lib/runtime.mjs';
import { evaluateStopGuard } from '../lib/stop-guard.mjs';
import { writeProgress } from '../lib/task-store.mjs';

export function handleStop(payload) {
  try {
    const gov = loadGovernanceContext(payload);
    if (!gov.ok) return {};
    const decision = evaluateStopGuard({
      status: payload.status,
      loopCount: payload.loop_count || 0,
      conversationId: payload.conversation_id,
      task: gov.task,
      progress: gov.progress,
      planMarkdown: gov.planMarkdown,
    });
    if (decision.stopGuard && gov.taskId) {
      writeProgress(gov.projectRoot, gov.taskId, {
        ...gov.progress,
        stopGuard: decision.stopGuard,
      });
    }
    return followup(decision.followup);
  } catch {
    return {};
  }
}

function main() {
  try {
    const payload = JSON.parse(readFileSync(0, 'utf8') || '{}');
    writeJson(handleStop(payload));
  } catch {
    writeJson({});
  }
}

if (basename(process.argv[1] || '') === 'stop.mjs') {
  main();
}

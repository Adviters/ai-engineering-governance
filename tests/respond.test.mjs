import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { allow, compactWarning, deny, followup } from '../scripts/lib/respond.mjs';

describe('respond', () => {
  it('builds hook allow and deny payloads', () => {
    assert.deepEqual(allow(), { permission: 'allow' });
    assert.deepEqual(
      deny({
        userMessage: 'blocked',
        agentMessage: 'run start-task',
      }),
      {
        permission: 'deny',
        user_message: 'blocked',
        agent_message: 'run start-task',
      },
    );
  });

  it('builds stop followup and compact warning payloads', () => {
    assert.deepEqual(followup('verify the stage'), { followup_message: 'verify the stage' });
    assert.deepEqual(compactWarning('create a handoff'), { user_message: 'create a handoff' });
    assert.deepEqual(followup(''), {});
  });
});

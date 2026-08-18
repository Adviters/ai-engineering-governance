import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  allow,
  compactWarning,
  deny,
  denyHookParseFailure,
  followup,
  logHookParseFailure,
  parseHookPayload,
} from '../scripts/lib/respond.mjs';

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

describe('parseHookPayload', () => {
  it('treats empty and whitespace input as an empty payload', () => {
    assert.deepEqual(parseHookPayload('').payload, {});
    assert.equal(parseHookPayload('').ok, true);
    assert.deepEqual(parseHookPayload('   \n').payload, {});
  });

  it('strips a UTF-8 BOM before parsing', () => {
    const result = parseHookPayload('\uFEFF{"tool_name":"Write"}');
    assert.equal(result.ok, true);
    assert.deepEqual(result.payload, { tool_name: 'Write' });
  });

  it('parses valid JSON objects', () => {
    const result = parseHookPayload('{"command":"git status"}');
    assert.equal(result.ok, true);
    assert.deepEqual(result.payload, { command: 'git status' });
  });

  it('extracts the first balanced object when text wraps JSON', () => {
    const result = parseHookPayload('debug prefix {"tool_name":"Shell","nested":{"ok":true}} trailing');
    assert.equal(result.ok, true);
    assert.deepEqual(result.payload, { tool_name: 'Shell', nested: { ok: true } });
  });

  it('returns INVALID_JSON for garbage without an object', () => {
    const result = parseHookPayload('not-json at all');
    assert.equal(result.ok, false);
    assert.equal(result.error, 'INVALID_JSON');
    assert.ok(result.detail);
    assert.match(result.raw, /not-json/);
  });

  it('returns STDIN_READ_FAILED when the reader throws', () => {
    const result = parseHookPayload(() => {
      throw new Error('EPIPE');
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, 'STDIN_READ_FAILED');
    assert.match(result.detail, /EPIPE/);
    assert.equal(result.raw, '');
  });
});

describe('denyHookParseFailure', () => {
  it('uses distinct messages for stdin read vs invalid JSON', () => {
    assert.equal(
      denyHookParseFailure({ error: 'STDIN_READ_FAILED' }).user_message,
      'Could not read hook stdin.',
    );
    assert.equal(
      denyHookParseFailure({ error: 'INVALID_JSON' }).user_message,
      'Hook payload is not valid JSON.',
    );
  });

  it('writes error and raw snippet to the provided stream', () => {
    const chunks = [];
    logHookParseFailure(
      { error: 'INVALID_JSON', detail: 'Unexpected token', raw: '{"oops"' },
      { write: (chunk) => chunks.push(String(chunk)) },
    );
    const output = chunks.join('');
    assert.match(output, /INVALID_JSON: Unexpected token/);
    assert.match(output, /\{"oops"/);
  });
});

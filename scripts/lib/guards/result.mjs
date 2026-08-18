export function allowResult(extra = {}) {
  return { allow: true, ...extra };
}

export function denyResult({
  reason,
  userMessage,
  agentMessage,
  invalidateApproval = false,
  event = null,
} = {}) {
  return {
    allow: false,
    reason,
    userMessage,
    agentMessage,
    invalidateApproval,
    event,
  };
}

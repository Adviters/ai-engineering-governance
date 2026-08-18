export function extractWritePath(toolInput = {}) {
  if (!toolInput || typeof toolInput !== 'object') return null;
  const value = toolInput.path || toolInput.file_path || toolInput.target_file || toolInput.filePath || null;
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function extractShellCommand(payload = {}) {
  if (typeof payload.command === 'string') return payload.command;
  if (payload.tool_input && typeof payload.tool_input.command === 'string') return payload.tool_input.command;
  return null;
}

export function isWriteTool(toolName) {
  const name = String(toolName || '');
  return ['Write', 'StrReplace', 'Delete', 'Edit'].includes(name);
}

export function isShellTool(toolName, hookEventName) {
  return hookEventName === 'beforeShellExecution' || String(toolName || '') === 'Shell';
}

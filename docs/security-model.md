# Security model

Esta capa gobierna agentes en el IDE. No es un control de producción.

## No reemplaza

- Branch protection remota
- PR approvals
- CI
- IAM / RBAC
- Gestión de secretos
- Permisos de infraestructura

## Qué sí hace

Bloquea, en el Agent loop, escrituras y shells que violan política local. El humano puede ejecutar lo bloqueado en su propia terminal.

## Límites reales

- Identidad del approver = `git config user.email`.
- No hay campo actor agent-vs-user; la CLI humana funciona porque el terminal del usuario no dispara Agent hooks.
- Tab completions pueden escribir sin `preToolUse`.
- Redirecciones de Shell pueden escribir archivos sin el matcher Write.
- Cloud agents no cargan hooks de usuario.
- `stop` no deniega el fin del loop.

Fail closed en operaciones sensibles. Fail open en audit log y warnings. Un fallo de log nunca debe congelar el Agent.

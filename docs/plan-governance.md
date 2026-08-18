# Plan governance

`PLAN.md` es el contrato. Debe incluir un bloque JSON con `stages`. Cada stage declara `allowed_paths`.

Estados de approval: `DRAFT`, `APPROVED`, `INVALIDATED`.

El hash es SHA-256 UTF-8 de todo `PLAN.md`. Cualquier edición cambia el hash.

Implementación: un stage por vez. Default `stageApprovalMode: manual`.

Cambiar el plan para ampliar `allowed_paths` exige re-aprobación humana.

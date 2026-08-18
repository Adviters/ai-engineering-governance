# Configuración

Archivo del consumidor: `.ai/config.json`.

Si falta, se usan defaults. Si está presente, cada clave reemplaza el default (no se mezclan arrays). `dangerousCommands` son regex adicionales, no reemplazan los built-in.

## Defaults

- `protectedBranches`: `main`, `master`, `develop`, `qa`
- `planRequiredFileThreshold`: `2`
- `highRiskPaths`: workflows, migrations, terraform, infra, Dockerfiles, compose, package/lockfiles, `.env*`, `secrets/**`
- `dangerousCommands`: `[]`
- `stageApprovalMode`: `manual`
- `requirePlanApproval`: `true`
- `qaDeployCommand`: `null`

## Ejemplo

```json
{
  "protectedBranches": ["main", "develop", "qa"],
  "planRequiredFileThreshold": 2,
  "stageApprovalMode": "manual",
  "requirePlanApproval": true,
  "qaDeployCommand": null
}
```

Schema inválido → fail closed en guards de escritura y shell.

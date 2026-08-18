# Hooks

Definidos en `hooks/hooks.json`. Comando:

```text
node "${CURSOR_PLUGIN_ROOT}/scripts/hooks/<entry>.mjs"
```

| Evento | Uso | Fail |
|---|---|---|
| `preToolUse` | DENY writes y, si llega Shell, comandos | closed |
| `beforeShellExecution` | DENY dangerous/deps/self-approval | closed |
| `postToolUse` | registrar archivos distintos | open |
| `stop` | follow-up de verificación, `loop_limit: 2` | open |
| `preCompact` | warning de handoff | open |

Payloads y responses: documentación oficial de Cursor. Este plugin no usa campos no documentados.

`afterFileEdit` no se usa para enforcement: el archivo ya se escribió.

`ask` no se usa: en Cursor actual no se aplica.

## Advisory vs enforced

- Branch, high-risk, plan hash, threshold, stage paths, dangerous command, dependency, self-approval: **enforced**.
- Stop follow-up y preCompact: **advisory**.
- Rules y skills: **advisory**.

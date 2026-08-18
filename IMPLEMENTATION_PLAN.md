# Implementation Plan — ai-engineering-governance

Plugin Cursor de governance para agentes. Tecnología agnóstica. Sin MCP. Sin packs por framework.

Fuentes oficiales consultadas (2026-08-18):

- https://cursor.com/docs/plugins.md
- https://cursor.com/docs/reference/plugins.md
- https://cursor.com/docs/hooks.md
- https://cursor.com/docs/rules.md
- https://cursor.com/docs/skills.md
- https://cursor.com/docs/reference/third-party-hooks.md

No se inventan APIs. Si Cursor no expone un control, se documenta la limitación y se usa la aproximación más segura.

## 1. Formato del plugin

Usar **Cursor Plugin**, no Agent Plugin.

| Campo | Valor |
|---|---|
| Manifest | `.cursor-plugin/plugin.json` |
| `name` obligatorio | `ai-engineering-governance` (kebab-case) |
| Discovery | carpetas por defecto; no hace falta listar paths salvo override |

Estructura oficial de un Cursor Plugin:

```text
plugin/
├── .cursor-plugin/plugin.json
├── rules/          # .mdc
├── skills/         # <name>/SKILL.md
├── commands/       # .md
├── hooks/hooks.json
└── scripts/
```

No incluir `mcp.json`.

Instalación prevista:

- Desarrollo local: `%USERPROFILE%\.cursor\plugins\local\ai-engineering-governance`
- Consumidor: Customize → Install → project scope
- Futuro: Team Marketplace (no implementar ahora)

El workspace debe estar **Trusted**. Si no lo está, los hooks no corren.

## 2. Formatos vigentes de componentes

### Rules (`rules/*.mdc`)

Frontmatter: `description`, `alwaysApply`, `globs`.

| alwaysApply | description | globs | Comportamiento |
|---|---|---|---|
| true | — | — | Siempre incluida |
| false | presente | omitido | El agente la carga si es relevante |
| false | — | presente | Auto-attach por archivos en contexto |
| false | omitido | omitido | Solo con `@mention` |

Rules son **steering**. No son enforcement.

### Skills (`skills/<name>/SKILL.md`)

Frontmatter: `name`, `description`. Opcional: `disable-model-invocation`, `paths`.

- `name` debe coincidir con el folder.
- Progressive disclosure: `references/`, `scripts/`, `templates/` o `assets/`.
- `disable-model-invocation: true` = solo invocación humana vía `/skill-name`.

### Commands (`commands/*.md`)

Frontmatter: `name`, `description`. Siguen siendo un componente oficial de Cursor Plugins.

Limitación conocida: los Commands de plugins a veces no aparecen en el menú `/` (bug de cache / toggle de third-party). Las Skills sí se descubren.

Por eso las acciones humanas sensibles se implementan como **Skill con `disable-model-invocation: true`** y además como Command para discovery del plugin. El contrato es el mismo: el agente no ejecuta la CLI; el humano la corre en su terminal.

`/debug` está reservado. No crear ese command. Usar skill `debug-bug`.

### Hooks (`hooks/hooks.json`)

```json
{
  "version": 1,
  "hooks": {
    "<event>": [
      {
        "command": "node \"${CURSOR_PLUGIN_ROOT}/scripts/hooks/<entry>.mjs\"",
        "timeout": 10,
        "failClosed": true,
        "matcher": "Write|StrReplace|Delete"
      }
    ]
  }
}
```

Campos por script confirmados: `command`, `type`, `timeout`, `loop_limit`, `failClosed`, `matcher`.

Exit codes:

- `0` → usar JSON de stdout
- `2` → deny (equivalente a `permission: "deny"`)
- otro → fallo del hook; **fail-open** salvo `failClosed: true`

`permission: "ask"` está en el schema pero **no se aplica hoy**. Solo `deny` es enforcement real.

## 3. Eventos de hooks y contratos

### Input común (todos los agent hooks)

`conversation_id`, `generation_id`, `model`, `model_id?`, `model_params?`, `hook_event_name`, `cursor_version`, `workspace_roots`, `user_email`, `transcript_path`.

### Env oficiales

| Variable | Uso |
|---|---|
| `CURSOR_PROJECT_DIR` | raíz del repo consumidor (estado `.ai/`) |
| `CURSOR_PLUGIN_ROOT` | instalación del plugin (scripts) |
| `CURSOR_VERSION` | diagnóstico |
| `CURSOR_USER_EMAIL` | no usar como identidad de approval |
| `CLAUDE_PROJECT_DIR` | alias |

Cwd de plugin hooks es inconsistente (a veces project root, a veces plugin install, y `stop` se documentó con cwd de project). Los scripts **no** usarán `process.cwd()` para resolver estado ni scripts. Usarán `CURSOR_PROJECT_DIR` / `workspace_roots[0]` para `.ai/`, y `CURSOR_PLUGIN_ROOT` o `import.meta.url` para el plugin.

### Hooks que usaremos

#### `preToolUse` — DENY de escrituras

Input relevante: `tool_name`, `tool_input`, `tool_use_id`, `cwd`.

Output: `{ permission: "allow"|"deny", user_message?, agent_message?, updated_input? }`.

Matcher oficial documentado: `Shell`, `Read`, `Write`, `Grep`, `Delete`, `Task`, `MCP:<tool>`. En la práctica Cursor también emite `StrReplace`. Se matchearán `Write|StrReplace|Delete|Edit` y se extraerá el path de `tool_input.path` o `tool_input.file_path`.

Este es el único punto que puede bloquear una escritura **antes** de que ocurra.

`failClosed: true`.

#### `beforeShellExecution` — DENY de comandos

Input: `{ command, cwd, sandbox }`.

Output: `{ permission: "allow"|"deny"|"ask", user_message?, agent_message? }`.

Usar solo `allow` / `deny`. `failClosed: true`.

Este hook es de **Agent**. El terminal del usuario no lo dispara. Esa es la base para que el humano pueda correr `approve-plan` y el agente no.

Cursor no documenta un campo `actor` agent-vs-user. No inventarlo.

#### `postToolUse` — registro, no bloqueo

Sirve para contabilizar archivos distintos tocados. Fail-open.

#### `stop` — no es un deny de fin de tarea

Input: `{ status: "completed"|"aborted"|"error", loop_count }`.

Output: `{ followup_message? }`.

Si `followup_message` no está vacío, Cursor lo reenvía como próximo mensaje. Default `loop_limit` = 5. V1 usará `loop_limit: 2` más un lock de reentrada en estado de tarea.

No se puede impedir que el agente “termine”. Solo se puede pedir una continuación limitada.

#### `preCompact` — warning, no enforcement

Input incluye `context_usage_percent`, `context_tokens`, `context_window_size`.

Output: `{ user_message? }`.

No puede bloquear compaction. El porcentaje es heurística, no verdad científica.

### Hooks que no usaremos para enforcement de writes

| Hook | Motivo |
|---|---|
| `afterFileEdit` | El archivo ya se escribió. No hay deny. |
| `afterTabFileEdit` / `beforeTabFileRead` | Tab no tiene deny previo de escritura. Gap V1. |
| `beforeReadFile` | No queremos bloquear investigación/planificación. |
| MCP hooks | No hay MCP. |

## 4. Filosofía y mapping a Cursor

| Pieza | Rol | Enforcement |
|---|---|---|
| Rules | qué comportamiento se espera | advisory |
| Skills | cómo ejecutar el procedimiento | advisory, con scripts |
| Commands / skills humanas | acción explícita del usuario | el agente no debe autoinvocarlas |
| Hooks + scripts Node | política determinística | enforced |

Workflow objetivo:

```text
REQUEST → TASK ASSESSMENT → BRANCH → PLAN (si corresponde)
→ PLAN APPROVAL → STAGE N → VERIFICATION → STAGE GATE
→ FINAL VERIFICATION → REVIEW → DONE
```

La clasificación inicial es semántica. Los hooks son el backstop.

## 5. Runtime y portabilidad

- Node.js >= 18, ESM `.mjs`
- Sin TypeScript, sin npm dependencies, sin binarios extra
- `git` es la única dependencia externa asumible
- Windows / Linux / macOS vía `node`, no bash
- Comando de hook: `node "${CURSOR_PLUGIN_ROOT}/scripts/hooks/<entry>.mjs"`
- Tests: `node:test` + `node:assert`

## 6. Estado en el consumidor (`.ai/`)

El plugin vive instalado; el estado vive en el repo que se gobierna.

```text
.ai/
├── config.json
├── active-task.json
├── audit.jsonl
└── tasks/<task-id>/
    ├── task.json
    ├── PLAN.md
    ├── approval.json
    └── progress.json
```

`.ai/**` puede escribirse aunque el stage no lo liste. Esa excepción no cubre código de aplicación.

Config inválida → fail closed en guards sensibles. Fallo de audit log → fail open.

## 7. Guards V1

Ver tabla en la sección de implementación. Resumen:

- Protected branch, file threshold, high-risk paths, stage allowed_paths, plan hash, dangerous commands, dependency installs, self-approval CLI: **enforced / fail closed**
- Stop followup, preCompact warning, audit: **advisory o fail open**

Parser de comandos peligrosos por tokens, no por substring.

## 8. Limitaciones reales (no simular enforcement)

1. Rules no bloquean nada.
2. `permission: "ask"` no se aplica; solo `deny`.
3. No hay actor agent-vs-user; la CLI humana funciona porque el terminal del usuario no dispara Agent hooks.
4. `stop` no deniega el fin del loop.
5. `preCompact` no bloquea ni mide contexto de forma científica.
6. Tab completions pueden escribir sin pasar por `preToolUse`.
7. Escrituras vía Shell (`>`, `Set-Content`) no pasan por el matcher Write. Gap residual.
8. Cloud agents no cargan hooks de usuario (`~/.cursor`).
9. `git config user.email` no es autenticación criptográfica.
10. Este plugin no reemplaza branch protection remota, PR review, CI, IAM, secretos ni permisos de producción.

## 9. Etapas de implementación

1. **Scaffold** (esta etapa): plan, manifest, package.json, LICENSE, carpetas.
2. **Lib core**: config, store, git, hash, paths, audit.
3. **Guards + tests** por bloque.
4. **Hook entrypoints + CLIs**.
5. **Rules, Skills, Commands**.
6. **README y docs**.
7. **Review final**.

Cada etapa se detiene hasta continuar explícitamente.

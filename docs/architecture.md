# Arquitectura

El plugin es un Cursor Plugin (`.cursor-plugin/plugin.json`), no un Agent Plugin. Eso permite empaquetar rules, skills, commands y hooks.

## Separación

- **Rules**: texto persistente. Advisory.
- **Skills**: procedimientos con progressive disclosure. Advisory, con scripts CLI cuando hace falta.
- **Hooks**: procesos Node que reciben JSON por stdin y devuelven JSON. Enforced.
- **Commands**: acciones explícitas. Las sensibles se duplican como skills con `disable-model-invocation: true`.

No hay MCP. No hay agentes custom. No hay variables secretas.

## Runtime

Los hooks no usan `process.cwd()` para estado. El repo consumidor se resuelve con `CURSOR_PROJECT_DIR` o `workspace_roots`. Los scripts del plugin se resuelven con `CURSOR_PLUGIN_ROOT` o `import.meta.url`.

La lógica de política está en funciones puras (`scripts/lib/guards`). Los entrypoints de hook solo cargan estado, llaman al guard y persisten side effects (audit, invalidación).

## Extensibilidad futura

Se pueden agregar skills, guards, commands, integración GitHub, validación CI, MCP e identidad fuerte de approver. V1 no las implementa. Evitar abstracciones que no sirvan al audit trail actual.

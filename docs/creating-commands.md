# Creating commands

Archivos `commands/*.md` con `name` y `description`.

Cursor Plugins todavía soporta commands, pero las acciones human-only oficiales también se modelan como skills con `disable-model-invocation: true`.

Usar commands para acciones explícitas. No crear `/debug`; Cursor ya lo reserva. Usar `debug-bug`.

Si el menú `/` no lista commands de plugin, habilitar third-party plugins y recargar la ventana.

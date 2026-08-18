# Task lifecycle

```text
request → assess-task → classification
  READ_ONLY: no writes de código
  SIMPLE / PLAN_REQUIRED / HIGH_RISK → start-task
    SIMPLE: implementar hasta el threshold
    PLAN_REQUIRED / HIGH_RISK → create-plan → human approve-plan
      → execute-approved-plan (stage N)
      → verification
      → approve-stage (manual) o avance automático
      → finish-task → review-task → DONE
```

Estado: `.ai/active-task.json` y `.ai/tasks/<id>/`.

Clasificación inicial: **advisory**. Los hooks impiden que una tarea SIMPLE crezca en silencio y que HIGH_RISK se implemente sin plan aprobado.

`debug-bug` empieza READ_ONLY. Cuando hay que modificar, el lifecycle normal aplica.

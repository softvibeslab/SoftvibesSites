# Kamelon `layout.json` Reference

Use this reference when creating or reviewing local `layout.json` files for Kamelon modules.

## Minimal Shape

```json
{
  "moduleId": "nosales",
  "title": "No venta",
  "version": "0.2.0",
  "state": {
    "values": {},
    "lists": {}
  },
  "actions": {},
  "dialogs": {},
  "components": []
}
```

## State Values

Use `state.values` for values that the Activity previously supplied manually.

```json
"values": {
  "customerLabel": {
    "type": "template",
    "value": "Cliente: ${input.customerId}"
  },
  "observation": {
    "type": "string",
    "default": ""
  },
  "selectedReasonId": {
    "type": "string",
    "default": ""
  }
}
```

Supported expression forms:

- `${input.customerId}`
- `${state.selectedReasonName}`
- `${runtime.recordDate}`
- `$input.customerId`
- `$state.observation`
- `$runtime.latitude`
- `$option.id`
- `$option.label`
- `$option.metadata.column_name`
- `$value`

## Lists

Use `state.lists` to bind list-like components to database datasources declared in `schema.sql`.

```json
"lists": {
  "reasons": {
    "source": "database",
    "dataSource": "reasons",
    "optionId": "reas_id",
    "optionLabel": "reas_name"
  }
}
```

The matching component references the list id through `dataSource`:

```json
{
  "id": "reason_list",
  "type": "data_grid",
  "dataSource": "reasons",
  "action": "select_reason",
  "metadata": {
    "emptyText": "No hay razones disponibles"
  }
}
```

## Actions

Use actions to bind selected values, open dialogs, dismiss dialogs, or finish with a typed result.

```json
"actions": {
  "select_reason": {
    "type": "select_option",
    "bind": {
      "selectedReasonId": "$option.id",
      "selectedReasonName": "$option.label",
      "observation": ""
    },
    "then": "observation_dialog"
  },
  "dismiss": {
    "type": "dismiss"
  },
  "save_nosale": {
    "type": "finish",
    "status": "SAVED",
    "message": "La observacion es obligatoria",
    "params": {
      "adviserId": "$input.adviserId",
      "customerId": "$input.customerId",
      "reasonId": "$state.selectedReasonId",
      "reasonName": "$state.selectedReasonName",
      "observations": "$state.observation",
      "recordDate": "$runtime.recordDate",
      "recordTime": "$runtime.recordTime",
      "visitStartedAt": "$input.visitStartedAt",
      "visitEndedAt": "$runtime.visitEndedAt",
      "latitude": "$runtime.latitude",
      "longitude": "$runtime.longitude",
      "activityId": "$runtime.activityId"
    }
  }
}
```

Do not execute persistence from `layout.json` if the host already persists after receiving the output.

## Dialogs

Use `dialogs` to replace feature-specific Compose dialog code.

```json
"dialogs": {
  "observation_dialog": {
    "title": "${state.selectedReasonName}",
    "primaryAction": "save_nosale",
    "primaryLabel": "Guardar",
    "secondaryAction": "dismiss",
    "secondaryLabel": "Cancelar",
    "components": [
      {
        "id": "observation_input",
        "type": "text_input",
        "label": "Observacion",
        "bindKey": "observation",
        "requiredWhen": "$input.requireObservation",
        "minLines": 4
      }
    ]
  }
}
```

## Component Rules

Common component fields:

- `id`
- `type`
- `label`
- `bindKey`
- `dataSource`
- `action`
- `required`
- `requiredWhen`
- `visibleWhen`
- `minLines`
- `metadata`

Keep visual components in `layout.json`. Keep Android lifecycle, native providers, and final typed contract mapping in Kotlin.

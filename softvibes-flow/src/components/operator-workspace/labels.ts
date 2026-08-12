import type {
  WorkflowDefinition,
  WorkflowLifecycleStatus,
} from "@/domain/workflows";

export const lifecycleLabels: Record<WorkflowLifecycleStatus, string> = {
  implemented: "Implementado",
  partial: "Parcial",
  prototype: "Prototipo",
  documented: "Documentado",
};

export const versionLabels: Record<
  WorkflowDefinition["versionStatus"],
  string
> = {
  draft: "Borrador",
  published: "Publicada",
  archived: "Archivada",
};

export const externalActionLabels: Record<
  WorkflowDefinition["externalAction"],
  string
> = {
  none: "ninguna",
  outreach: "contacto",
  publish: "publicación",
};

export const stepStateLabels: Record<
  WorkflowDefinition["steps"][number]["state"],
  string
> = {
  ready: "listo",
  manual: "manual",
  blocked: "bloqueado",
  unknown: "no verificado",
};

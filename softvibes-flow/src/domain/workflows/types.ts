export type WorkflowLifecycleStatus =
  | "implemented"
  | "partial"
  | "prototype"
  | "documented";

export type WorkflowVersionStatus = "draft" | "published" | "archived";

export type WorkflowExternalAction = "none" | "outreach" | "publish";

export type WorkflowStepKind =
  | "input"
  | "process"
  | "approval"
  | "output"
  | "evidence";

export type WorkflowStepState = "ready" | "manual" | "blocked" | "unknown";

export interface WorkflowScope {
  readonly id: string;
  readonly projectId: string;
  readonly tenantId: string;
  readonly projectName: string;
  readonly tenantName: string;
  readonly dataMode: "preview";
}

export interface WorkflowStep {
  readonly id: string;
  readonly sequence: number;
  readonly name: string;
  readonly kind: WorkflowStepKind;
  readonly state: WorkflowStepState;
  readonly owner: string | null;
}

export interface WorkflowApproval {
  readonly id: string;
  readonly name: string;
  readonly timing: "before-outreach" | "before-publish";
  readonly requirement: "human-required";
}

export interface WorkflowEvidence {
  readonly id: string;
  readonly label: string;
  readonly kind: "repository-path";
  readonly reference: string;
}

export interface WorkflowRuntimeData {
  readonly availability: "unavailable";
  readonly label: string;
}

export interface WorkflowDefinition {
  readonly id: string;
  readonly projectId: string;
  readonly tenantId: string;
  readonly name: string;
  readonly summary: string;
  readonly domain: string;
  readonly externalAction: WorkflowExternalAction;
  readonly lifecycleStatus: WorkflowLifecycleStatus;
  readonly versionStatus: WorkflowVersionStatus;
  readonly version: string;
  readonly input: string;
  readonly output: string;
  readonly steps: readonly WorkflowStep[];
  readonly approvals: readonly WorkflowApproval[];
  readonly evidence: readonly WorkflowEvidence[];
  readonly gaps: readonly string[];
  readonly runtimeData: WorkflowRuntimeData;
}

export interface WorkflowFilters {
  readonly query?: string;
  readonly lifecycleStatus?: WorkflowLifecycleStatus;
}

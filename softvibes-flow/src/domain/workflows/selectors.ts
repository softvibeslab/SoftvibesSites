import type {
  WorkflowDefinition,
  WorkflowFilters,
  WorkflowScope,
} from "./types";

type SearchableWorkflowField = keyof Pick<
  WorkflowDefinition,
  "name" | "summary" | "domain" | "input" | "output"
>;

const searchableWorkflowFields: readonly SearchableWorkflowField[] = [
  "name",
  "summary",
  "domain",
  "input",
  "output",
];

function isInScope(
  workflow: WorkflowDefinition,
  scope: WorkflowScope,
): boolean {
  return (
    workflow.projectId === scope.projectId &&
    workflow.tenantId === scope.tenantId
  );
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesQuery(workflow: WorkflowDefinition, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery.length === 0) {
    return true;
  }

  return searchableWorkflowFields.some((field) =>
    normalizeSearchText(workflow[field]).includes(normalizedQuery),
  );
}

export function selectWorkflows(
  workflows: readonly WorkflowDefinition[],
  scope: WorkflowScope,
  filters: WorkflowFilters = {},
): WorkflowDefinition[] {
  return workflows.filter(
    (workflow) =>
      isInScope(workflow, scope) &&
      (filters.lifecycleStatus === undefined ||
        workflow.lifecycleStatus === filters.lifecycleStatus) &&
      (filters.query === undefined || matchesQuery(workflow, filters.query)),
  );
}

export function getWorkflowById(
  workflows: readonly WorkflowDefinition[],
  scope: WorkflowScope,
  workflowId: string,
): WorkflowDefinition | undefined {
  return workflows.find(
    (workflow) => workflow.id === workflowId && isInScope(workflow, scope),
  );
}

import type { WorkflowDefinition } from "@/domain/workflows";

import { lifecycleLabels } from "./labels";

interface WorkflowCatalogProps {
  readonly workflows: readonly WorkflowDefinition[];
  readonly selectedWorkflowId: string | undefined;
  readonly onClearFilters: () => void;
  readonly onSelectWorkflow: (workflowId: string) => void;
}

export function WorkflowCatalog({
  workflows,
  selectedWorkflowId,
  onClearFilters,
  onSelectWorkflow,
}: WorkflowCatalogProps) {
  return (
    <section className="workflow-catalog" aria-labelledby="catalog-heading">
      <header className="workflow-catalog__header">
        <div>
          <p className="workflow-catalog__eyebrow">Inventario operativo</p>
          <h2 id="catalog-heading">Catálogo de workflows</h2>
        </div>
        <p className="workflow-catalog__count" role="status" aria-live="polite">
          {workflows.length} {workflows.length === 1 ? "workflow" : "workflows"}
        </p>
      </header>
      {workflows.length === 0 ? (
        <div className="workflow-catalog__empty">
          <p>No hay workflows que coincidan con estos filtros.</p>
          <button type="button" onClick={onClearFilters}>
            Limpiar filtros
          </button>
        </div>
      ) : (
        <ul className="workflow-catalog__list">
          {workflows.map((workflow) => (
            <li key={workflow.id} data-lifecycle={workflow.lifecycleStatus}>
              <button
                className="workflow-catalog__item"
                type="button"
                aria-pressed={workflow.id === selectedWorkflowId}
                onClick={() => onSelectWorkflow(workflow.id)}
              >
                <span className="workflow-catalog__item-title">{workflow.name}</span>
                <span className="workflow-catalog__item-meta">
                  <span className="workflow-catalog__domain">{workflow.domain}</span>
                  <span
                    className="workflow-status"
                    data-lifecycle={workflow.lifecycleStatus}
                  >
                    <span className="workflow-status__mark" aria-hidden="true" />
                    {lifecycleLabels[workflow.lifecycleStatus]}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

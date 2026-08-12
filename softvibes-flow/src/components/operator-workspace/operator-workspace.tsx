"use client";

import { useState } from "react";

import {
  getWorkflowById,
  selectWorkflows,
  type WorkflowDefinition,
  type WorkflowLifecycleStatus,
  type WorkflowScope,
} from "@/domain/workflows";

import { WorkflowCatalog } from "./workflow-catalog";
import { WorkflowDetail, type DetailTab } from "./workflow-detail";

interface OperatorWorkspaceProps {
  readonly scopes: readonly WorkflowScope[];
  readonly workflows: readonly WorkflowDefinition[];
}

type StatusFilter = "all" | WorkflowLifecycleStatus;

export function OperatorWorkspace({
  scopes,
  workflows,
}: OperatorWorkspaceProps) {
  const initialScope = scopes[0];
  if (initialScope === undefined) {
    return <p>No hay alcances de proyecto disponibles.</p>;
  }

  return (
    <ScopedOperatorWorkspace
      initialScope={initialScope}
      scopes={scopes}
      workflows={workflows}
    />
  );
}

interface ScopedOperatorWorkspaceProps extends OperatorWorkspaceProps {
  readonly initialScope: WorkflowScope;
}

function ScopedOperatorWorkspace({
  initialScope,
  scopes,
  workflows,
}: ScopedOperatorWorkspaceProps) {
  const initialWorkflow = selectWorkflows(workflows, initialScope)[0];
  const [scopeId, setScopeId] = useState(initialScope.id);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(
    initialWorkflow?.id ?? "",
  );
  const [activeTab, setActiveTab] = useState<DetailTab>("summary");

  const scope = scopes.find((candidate) => candidate.id === scopeId) ?? initialScope;
  const scopedResults = selectWorkflows(workflows, scope, {
    query,
    lifecycleStatus: statusFilter === "all" ? undefined : statusFilter,
  });
  const selectedWorkflow = getWorkflowById(
    scopedResults,
    scope,
    selectedWorkflowId,
  );

  function resetWorkspace(nextScope: WorkflowScope) {
    setScopeId(nextScope.id);
    setQuery("");
    setStatusFilter("all");
    setSelectedWorkflowId(selectWorkflows(workflows, nextScope)[0]?.id ?? "");
    setActiveTab("summary");
  }

  function handleScopeChange(nextScopeId: string) {
    const nextScope =
      scopes.find((candidate) => candidate.id === nextScopeId) ?? initialScope;
    resetWorkspace(nextScope);
  }

  function handleWorkflowSelection(workflowId: string) {
    setSelectedWorkflowId(workflowId);
    setActiveTab("summary");
  }

  function reconcileSelection(nextResults: readonly WorkflowDefinition[]) {
    if (getWorkflowById(nextResults, scope, selectedWorkflowId) !== undefined) {
      return;
    }

    setSelectedWorkflowId(nextResults[0]?.id ?? "");
    setActiveTab("summary");
  }

  function handleQueryChange(nextQuery: string) {
    const nextResults = selectWorkflows(workflows, scope, {
      query: nextQuery,
      lifecycleStatus: statusFilter === "all" ? undefined : statusFilter,
    });

    setQuery(nextQuery);
    reconcileSelection(nextResults);
  }

  function handleStatusFilterChange(nextStatusFilter: StatusFilter) {
    const nextResults = selectWorkflows(workflows, scope, {
      query,
      lifecycleStatus:
        nextStatusFilter === "all" ? undefined : nextStatusFilter,
    });

    setStatusFilter(nextStatusFilter);
    reconcileSelection(nextResults);
  }

  return (
    <main className="operator-workspace">
      <header className="operator-workspace__header">
        <div className="operator-workspace__brand">
          <span className="operator-workspace__brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <div>
            <p className="operator-workspace__eyebrow">Espacio de trabajo del operador</p>
            <h1>Softvibes Flow</h1>
          </div>
        </div>
        <div className="operator-workspace__context" aria-label="Contexto actual">
          <div className="operator-workspace__scope">
            <p>Proyecto: {scope.projectName}</p>
            <p>Inquilino: {scope.tenantName}</p>
          </div>
          <p className="operator-workspace__preview-badge">
            <span aria-hidden="true" />
            Vista previa · datos no operativos
          </p>
        </div>
      </header>

      <aside className="operator-workspace__safety-note" aria-label="Límites de seguridad">
        <span className="operator-workspace__safety-icon" aria-hidden="true">i</span>
        <p>
          Solo lectura: esta vista no realiza contacto, publicaciones, despliegues,
          escrituras externas, comandos arbitrarios ni gestión de credenciales.
        </p>
      </aside>

      <section className="operator-workspace__filters" aria-label="Filtros del catálogo">
        <label className="operator-workspace__field operator-workspace__field--scope">
          <span>Proyecto y alcance</span>
          <select
            value={scope.id}
            onChange={(event) => handleScopeChange(event.target.value)}
          >
            {scopes.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.projectName} · {candidate.tenantName}
              </option>
            ))}
          </select>
        </label>
        <label className="operator-workspace__field operator-workspace__field--search">
          <span>Buscar workflows</span>
          <input
            type="search"
            placeholder="Nombre o dominio"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
          />
        </label>
        <label className="operator-workspace__field operator-workspace__field--status">
          <span>Estado del workflow</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              handleStatusFilterChange(event.target.value as StatusFilter)
            }
          >
            <option value="all">Todos</option>
            <option value="implemented">Implementado</option>
            <option value="partial">Parcial</option>
            <option value="prototype">Prototipo</option>
            <option value="documented">Documentado</option>
          </select>
        </label>
      </section>

      <div className="operator-workspace__content">
        <WorkflowCatalog
          workflows={scopedResults}
          selectedWorkflowId={selectedWorkflow?.id}
          onClearFilters={() => resetWorkspace(scope)}
          onSelectWorkflow={handleWorkflowSelection}
        />
        <WorkflowDetail
          workflow={selectedWorkflow}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />
      </div>
    </main>
  );
}

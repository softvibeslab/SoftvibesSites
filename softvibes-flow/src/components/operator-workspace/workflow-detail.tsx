import type { KeyboardEvent } from "react";

import type { WorkflowDefinition } from "@/domain/workflows";

import {
  externalActionLabels,
  lifecycleLabels,
  stepStateLabels,
  versionLabels,
} from "./labels";

export type DetailTab = "summary" | "steps" | "evidence" | "gaps";

interface WorkflowDetailProps {
  readonly workflow: WorkflowDefinition | undefined;
  readonly activeTab: DetailTab;
  readonly onSelectTab: (tab: DetailTab) => void;
}

const tabs: readonly { readonly id: DetailTab; readonly label: string }[] = [
  { id: "summary", label: "Resumen" },
  { id: "steps", label: "Pasos" },
  { id: "evidence", label: "Evidencia" },
  { id: "gaps", label: "Brechas" },
];

export function WorkflowDetail({
  workflow,
  activeTab,
  onSelectTab,
}: WorkflowDetailProps) {
  if (workflow === undefined) {
    return (
      <section className="workflow-detail workflow-detail--empty" aria-label="Detalle del workflow">
        <span className="workflow-detail__empty-mark" aria-hidden="true" />
        <p>Selecciona filtros con resultados para consultar un workflow.</p>
      </section>
    );
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    let nextIndex: number | undefined;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex === undefined) {
      return;
    }

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    if (nextTab === undefined) {
      return;
    }

    onSelectTab(nextTab.id);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>("[role='tab']")
      [nextIndex]?.focus();
  }

  return (
    <article className="workflow-detail" aria-labelledby="workflow-detail-heading">
      <header className="workflow-detail__header">
        <p className="workflow-detail__domain">{workflow.domain}</p>
        <h2 id="workflow-detail-heading">{workflow.name}</h2>
        <div className="workflow-detail__identity">
          <span className="workflow-status" data-lifecycle={workflow.lifecycleStatus}>
            <span className="workflow-status__mark" aria-hidden="true" />
            {lifecycleLabels[workflow.lifecycleStatus]}
          </span>
          <span className="workflow-detail__version">Definición {workflow.version}</span>
        </div>
      </header>

      <div className="workflow-detail__tabs" role="tablist" aria-label="Detalle del workflow">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`workflow-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`workflow-panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => onSelectTab(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <section
          key={tab.id}
          id={`workflow-panel-${tab.id}`}
          role="tabpanel"
          className="workflow-detail__panel"
          aria-labelledby={`workflow-tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          tabIndex={activeTab === tab.id ? 0 : undefined}
        >
          {tab.id === "summary" && <WorkflowSummary workflow={workflow} />}
          {tab.id === "steps" && <WorkflowSteps workflow={workflow} />}
          {tab.id === "evidence" && <WorkflowEvidence workflow={workflow} />}
          {tab.id === "gaps" && <WorkflowGaps workflow={workflow} />}
        </section>
      ))}
    </article>
  );
}

function WorkflowSummary({ workflow }: { readonly workflow: WorkflowDefinition }) {
  return (
    <div className="workflow-detail__summary">
      <p className="workflow-detail__lede">{workflow.summary}</p>
      <dl className="workflow-detail__definition-grid">
        <div>
          <dt>Entrada</dt>
          <dd>{workflow.input}</dd>
        </div>
        <div>
          <dt>Salida</dt>
          <dd>{workflow.output}</dd>
        </div>
        <div>
          <dt>Ciclo de vida</dt>
          <dd>{lifecycleLabels[workflow.lifecycleStatus]}</dd>
        </div>
        <div>
          <dt>Versión</dt>
          <dd>
            {workflow.version} · {versionLabels[workflow.versionStatus]}
          </dd>
        </div>
      </dl>
      <p
        className="workflow-detail__external-action"
        data-external-action={workflow.externalAction}
      >
        Acción externa: {externalActionLabels[workflow.externalAction]}
      </p>
      {workflow.approvals.map((approval) => (
        <aside key={approval.id} className="workflow-detail__approval">
          <strong>{approval.name}</strong>
          <p>La aprobación humana es obligatoria.</p>
        </aside>
      ))}
      <p className="workflow-detail__runtime">
        <span aria-hidden="true" />
        {workflow.runtimeData.label}
      </p>
    </div>
  );
}

function WorkflowSteps({ workflow }: { readonly workflow: WorkflowDefinition }) {
  return (
    <ol className="workflow-detail__steps">
      {[...workflow.steps]
        .sort((left, right) => left.sequence - right.sequence)
        .map((step) => (
          <li key={step.id} data-step-state={step.state}>
            <span className="workflow-detail__step-marker" aria-hidden="true" />
            <div className="workflow-detail__step-content">
              <strong>{step.name}</strong>
              <span className="workflow-detail__step-state">
                Estado: {stepStateLabels[step.state]}
              </span>
              <span className="workflow-detail__step-owner">
                Responsable: {step.owner ?? "no disponible"}
              </span>
            </div>
          </li>
        ))}
    </ol>
  );
}

function WorkflowEvidence({ workflow }: { readonly workflow: WorkflowDefinition }) {
  return (
    <ul className="workflow-detail__evidence">
      {workflow.evidence.map((item) => (
        <li key={item.id}>
          <span className="workflow-detail__evidence-label">{item.label}</span>
          <code>{item.reference}</code>
        </li>
      ))}
    </ul>
  );
}

function WorkflowGaps({ workflow }: { readonly workflow: WorkflowDefinition }) {
  return (
    <div className="workflow-detail__gaps">
      <p>Brechas conocidas; no se presentan como capacidades resueltas.</p>
      <ul>
        {workflow.gaps.map((gap) => (
          <li key={gap}>{gap}</li>
        ))}
      </ul>
    </div>
  );
}

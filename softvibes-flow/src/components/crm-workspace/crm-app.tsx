"use client";

import {
  type DragEvent,
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  calculateDashboardMetrics,
  groupEventsByDay,
  leadStages,
  type Activity,
  type Artifact,
  type ArtifactType,
  type BootstrapData,
  type CalendarEvent,
  type CalendarEventType,
  type Lead,
  type LeadStage,
  type Project,
  type ProjectStatus,
} from "@/domain/crm";

import { ApiClientError, apiRequest } from "./api-client";

type WorkspaceView = "dashboard" | "projects" | "leads" | "pipeline" | "calendar";
type ModalState =
  | { readonly type: "lead"; readonly record?: Lead }
  | { readonly type: "project"; readonly record?: Project }
  | { readonly type: "artifact"; readonly project: Project; readonly record?: Artifact }
  | {
      readonly type: "event";
      readonly record?: CalendarEvent;
      readonly leadId?: string;
      readonly projectId?: string;
      readonly defaultStartsAt?: string;
      readonly defaultEndsAt?: string;
    }
  | null;

const viewLabels: Readonly<Record<WorkspaceView, string>> = {
  dashboard: "Resumen",
  projects: "Proyectos",
  leads: "Leads",
  pipeline: "Pipeline",
  calendar: "Calendario",
};

const stageLabels: Readonly<Record<LeadStage, string>> = {
  new: "Nuevo",
  qualifying: "Por calificar",
  qualified: "Calificado",
  contacted: "Contacto iniciado",
  meeting: "Reunión",
  proposal: "Propuesta",
  negotiation: "Negociación",
  won: "Ganado",
  lost: "Perdido",
};

const projectStatusLabels: Readonly<Record<ProjectStatus, string>> = {
  discovery: "Descubrimiento",
  analysis: "Análisis",
  landing: "Landing",
  review: "Revisión",
  live: "En vivo",
  paused: "Pausado",
};

const artifactTypeLabels: Readonly<Record<ArtifactType, string>> = {
  research: "Investigación",
  analysis: "Análisis",
  proposal: "Propuesta",
  landing: "Landing",
  links: "Links",
  cms: "CMS",
  preview: "Preview",
  deployment: "Despliegue",
  redirect: "Redirect",
  variant: "Variante",
};

const eventTypeLabels: Readonly<Record<CalendarEventType, string>> = {
  meeting: "Reunión",
  call: "Llamada",
  "follow-up": "Seguimiento",
  delivery: "Entrega",
  review: "Revisión",
};

interface CrmAppProps {
  readonly initialData?: BootstrapData;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string | null): string {
  if (value === null) {
    return "Sin fecha";
  }
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function toDateTimeInput(value: string): string {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function Icon({
  name,
}: {
  readonly name:
    | "dashboard"
    | "projects"
    | "leads"
    | "pipeline"
    | "calendar"
    | "plus"
    | "search"
    | "logout"
    | "link"
    | "close";
}) {
  const paths: Record<typeof name, React.ReactNode> = {
    dashboard: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
    projects: <path d="M3 6.5 12 3l9 3.5v11L12 21l-9-3.5v-11Zm9 14v-10m-8.5-4L12 10l8.5-3.5" />,
    leads: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87m-2-11.96a4 4 0 0 1 0 7.75" />,
    pipeline: <path d="M4 5h16M4 12h10M4 19h6m8-3 3 3-3 3" />,
    calendar: <path d="M3 6h18v15H3V6Zm4-3v6m10-6v6M3 11h18" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />,
    logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9" />,
    link: <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71m2.25 5.82a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };

  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export function CrmApp({ initialData }: CrmAppProps) {
  const [data, setData] = useState<BootstrapData | null>(initialData ?? null);
  const [view, setView] = useState<WorkspaceView>("dashboard");
  const [modal, setModal] = useState<ModalState>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadData() {
    try {
      const bootstrap = await apiRequest<BootstrapData>("/api/bootstrap");
      setData(bootstrap);
      setError(null);
    } catch (requestError) {
      if (
        requestError instanceof ApiClientError &&
        requestError.code !== "UNAUTHENTICATED"
      ) {
        setError(requestError.message);
      }
      setData(null);
    }
  }

  useEffect(() => {
    if (initialData !== undefined) {
      return;
    }

    let active = true;
    void apiRequest<BootstrapData>("/api/bootstrap")
      .then((bootstrap) => {
        if (active) {
          setData(bootstrap);
          setError(null);
        }
      })
      .catch((requestError: unknown) => {
        if (
          active &&
          requestError instanceof ApiClientError &&
          requestError.code !== "UNAUTHENTICATED"
        ) {
          setError(requestError.message);
        }
      });

    return () => {
      active = false;
    };
  }, [initialData]);

  async function mutate<T>(
    path: string,
    method: "POST" | "PATCH" | "DELETE",
    body?: Readonly<Record<string, unknown>>,
  ): Promise<T> {
    if (data === null) {
      throw new Error("No authenticated workspace.");
    }
    setBusy(true);
    setError(null);
    try {
      const result = await apiRequest<T>(
        path,
        {
          method,
          body: body === undefined ? undefined : JSON.stringify(body),
        },
        data.csrfToken,
      );
      if (initialData === undefined) {
        await loadData();
      }
      return result;
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "La operación no pudo completarse.";
      setError(message);
      throw requestError;
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(username: string, password: string) {
    setBusy(true);
    setError(null);
    try {
      await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      await loadData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No fue posible iniciar sesión.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    if (data === null) {
      return;
    }
    try {
      await apiRequest(
        "/api/auth/logout",
        { method: "POST" },
        data.csrfToken,
      );
    } finally {
      setData(null);
      setSelectedLeadId(null);
      setView("dashboard");
    }
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2800);
  }

  if (data === null) {
    return (
      <LoginScreen
        busy={busy}
        error={error}
        onLogin={handleLogin}
      />
    );
  }

  const selectedLead =
    data.leads.find((lead) => lead.id === selectedLeadId) ?? null;

  return (
    <div className="crm-shell">
      <aside className="crm-sidebar">
        <div className="crm-brand">
          <span className="crm-brand__mark"><span /><span /><span /></span>
          <div>
            <strong>Softvibes</strong>
            <span>Flow</span>
          </div>
        </div>
        <nav aria-label="Navegación principal">
          {(Object.keys(viewLabels) as WorkspaceView[]).map((item) => (
            <button
              key={item}
              type="button"
              data-active={view === item}
              onClick={() => {
                setView(item);
                if (item !== "leads") {
                  setSelectedLeadId(null);
                }
              }}
            >
              <Icon name={item} />
              {viewLabels[item]}
            </button>
          ))}
        </nav>
        <div className="crm-sidebar__footer">
          <div className="operator-avatar">RG</div>
          <div>
            <strong>{data.user.username}</strong>
            <span>Administrador</span>
          </div>
          <button type="button" aria-label="Cerrar sesión" onClick={handleLogout}>
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      <main className="crm-main">
        <header className="crm-topbar">
          <div>
            <p className="eyebrow">Centro de operación</p>
            <h1>{viewLabels[view]}</h1>
          </div>
          <div className="crm-topbar__actions">
            <label className="global-search">
              <span className="sr-only">Buscar</span>
              <Icon name="search" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar proyecto o lead"
              />
            </label>
            <button
              type="button"
              className="primary-button"
              onClick={() => setModal({ type: "lead" })}
            >
              <Icon name="plus" /> Nuevo lead
            </button>
          </div>
        </header>

        {error !== null && (
          <div className="alert alert--error" role="alert">
            {error}
            <button type="button" onClick={() => setError(null)} aria-label="Cerrar error">
              <Icon name="close" />
            </button>
          </div>
        )}

        {view === "dashboard" && (
          <Dashboard data={data} onNavigate={setView} />
        )}
        {view === "projects" && (
          <ProjectRegistry
            data={data}
            query={query}
            onCreate={() => setModal({ type: "project" })}
            onEdit={(record) => setModal({ type: "project", record })}
            onAddArtifact={(project) => setModal({ type: "artifact", project })}
            onEditArtifact={(project, record) =>
              setModal({ type: "artifact", project, record })
            }
            onArchive={async (project) => {
              if (!window.confirm(`¿Archivar ${project.name}?`)) return;
              await mutate(`/api/projects/${project.id}`, "DELETE");
              showNotice("Proyecto archivado.");
            }}
          />
        )}
        {view === "leads" && selectedLead === null && (
          <LeadList
            data={data}
            query={query}
            projectFilter={projectFilter}
            onProjectFilter={setProjectFilter}
            onSelect={setSelectedLeadId}
          />
        )}
        {view === "leads" && selectedLead !== null && (
          <LeadDetail
            data={data}
            lead={selectedLead}
            busy={busy}
            onBack={() => setSelectedLeadId(null)}
            onEdit={() => setModal({ type: "lead", record: selectedLead })}
            onSchedule={() =>
              setModal({
                type: "event",
                leadId: selectedLead.id,
                projectId: selectedLead.projectId,
              })
            }
            onStageChange={async (stage) => {
              await mutate(`/api/leads/${selectedLead.id}`, "PATCH", { stage });
              showNotice("Etapa actualizada.");
            }}
            onActivity={async (activity) => {
              await mutate<Activity>("/api/activities", "POST", activity);
              showNotice("Actividad registrada.");
            }}
            onArchive={async () => {
              if (!window.confirm(`¿Archivar a ${selectedLead.name}?`)) return;
              await mutate(`/api/leads/${selectedLead.id}`, "DELETE");
              setSelectedLeadId(null);
              showNotice("Lead archivado.");
            }}
          />
        )}
        {view === "pipeline" && (
          <Pipeline
            data={data}
            onSelect={(leadId) => {
              setSelectedLeadId(leadId);
              setView("leads");
            }}
            onMove={async (lead, stage) => {
              await mutate(`/api/leads/${lead.id}`, "PATCH", { stage });
              showNotice(`${lead.name}: ${stageLabels[stage]}.`);
            }}
          />
        )}
        {view === "calendar" && (
          <CalendarView
            data={data}
            onCreate={(date) =>
              setModal({
                type: "event",
                projectId: data.projects[0]?.id,
                defaultStartsAt: date?.toISOString(),
                defaultEndsAt: date
                  ? new Date(date.getTime() + 60 * 60 * 1000).toISOString()
                  : undefined,
              })
            }
            onEdit={(record) => setModal({ type: "event", record })}
            onArchive={async (record) => {
              if (!window.confirm(`¿Archivar el evento "${record.title}"?`)) return;
              await mutate(`/api/events/${record.id}`, "DELETE");
              showNotice("Evento archivado.");
            }}
          />
        )}
      </main>

      {modal?.type === "lead" && (
        <LeadForm
          data={data}
          record={modal.record}
          busy={busy}
          onClose={() => setModal(null)}
          onSubmit={async (payload) => {
            if (modal.record) {
              await mutate(`/api/leads/${modal.record.id}`, "PATCH", payload);
              showNotice("Lead actualizado.");
            } else {
              await mutate("/api/leads", "POST", payload);
              showNotice("Lead creado.");
            }
            setModal(null);
          }}
        />
      )}
      {modal?.type === "project" && (
        <ProjectForm
          record={modal.record}
          busy={busy}
          onClose={() => setModal(null)}
          onSubmit={async (payload) => {
            if (modal.record) {
              await mutate(`/api/projects/${modal.record.id}`, "PATCH", payload);
              showNotice("Proyecto actualizado.");
            } else {
              await mutate("/api/projects", "POST", payload);
              showNotice("Proyecto creado.");
            }
            setModal(null);
          }}
        />
      )}
      {modal?.type === "artifact" && (
        <ArtifactForm
          project={modal.project}
          record={modal.record}
          busy={busy}
          onClose={() => setModal(null)}
          onSubmit={async (payload) => {
            if (modal.record) {
              await mutate(`/api/artifacts/${modal.record.id}`, "PATCH", payload);
              showNotice("Artefacto actualizado.");
            } else {
              await mutate("/api/artifacts", "POST", payload);
              showNotice("Artefacto agregado.");
            }
            setModal(null);
          }}
        />
      )}
      {modal?.type === "event" && (
        <EventForm
          data={data}
          record={modal.record}
          defaultProjectId={modal.projectId}
          defaultLeadId={modal.leadId}
          defaultStartsAt={modal.defaultStartsAt}
          defaultEndsAt={modal.defaultEndsAt}
          busy={busy}
          onClose={() => setModal(null)}
          onSubmit={async (payload) => {
            if (modal.record?.id) {
              await mutate(`/api/events/${modal.record.id}`, "PATCH", payload);
              showNotice("Evento actualizado.");
            } else {
              await mutate("/api/events", "POST", payload);
              showNotice("Evento programado.");
            }
            setModal(null);
          }}
        />
      )}
      {notice !== null && <div className="toast" role="status">{notice}</div>}
    </div>
  );
}

function LoginScreen({
  busy,
  error,
  onLogin,
}: {
  readonly busy: boolean;
  readonly error: string | null;
  readonly onLogin: (username: string, password: string) => Promise<void>;
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onLogin(String(form.get("username") ?? ""), String(form.get("password") ?? ""));
  }

  return (
    <main className="login-screen">
      <section className="login-panel">
        <div className="crm-brand crm-brand--login">
          <span className="crm-brand__mark"><span /><span /><span /></span>
          <div><strong>Softvibes</strong><span>Flow</span></div>
        </div>
        <p className="eyebrow">Control privado</p>
        <h1>Acceso a Softvibes Flow</h1>
        <p className="login-panel__lede">
          Proyectos, landings y relaciones comerciales en un solo lugar.
        </p>
        {error !== null && <div className="alert alert--error" role="alert">{error}</div>}
        <form onSubmit={submit}>
          <label>
            <span>Usuario</span>
            <input name="username" autoComplete="username" required defaultValue="roger" />
          </label>
          <label>
            <span>Contraseña</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="primary-button" disabled={busy}>
            {busy ? "Verificando…" : "Entrar al panel"}
          </button>
        </form>
        <p className="security-note">Sesión privada · Sin acciones externas automáticas</p>
      </section>
      <aside className="login-aside" aria-hidden="true">
        <div className="login-orbit login-orbit--one" />
        <div className="login-orbit login-orbit--two" />
        <p>CLARIDAD<br />OPERATIVA</p>
      </aside>
    </main>
  );
}

function Dashboard({
  data,
  onNavigate,
}: {
  readonly data: BootstrapData;
  readonly onNavigate: (view: WorkspaceView) => void;
}) {
  const [referenceTime] = useState(() => Date.now());
  const metrics = calculateDashboardMetrics(data.leads, data.events);
  const upcoming = data.events
    .filter((event) => new Date(event.startsAt).getTime() >= referenceTime)
    .slice(0, 5);
  const overdue = data.leads.filter(
    (lead) =>
      lead.nextActionAt !== null &&
      new Date(lead.nextActionAt).getTime() < referenceTime &&
      !["won", "lost"].includes(lead.stage),
  );

  return (
    <div className="workspace-page">
      <section className="metric-grid" aria-label="Indicadores">
        <Metric label="Proyectos activos" value={`${data.projects.length} ${data.projects.length === 1 ? "proyecto" : "proyectos"}`} tone="violet" />
        <Metric label="Leads activos" value={String(metrics.activeLeads)} tone="blue" />
        <Metric label="Pipeline abierto" value={formatCurrency(metrics.openPipelineValue)} tone="green" />
        <Metric label="Seguimientos vencidos" value={String(metrics.overdueFollowUps)} tone="orange" />
      </section>
      <section className="dashboard-grid">
        <article className="panel dashboard-pipeline">
          <header className="panel__header">
            <div><p className="eyebrow">Flujo comercial</p><h2>Estado del pipeline</h2></div>
            <button type="button" className="text-button" onClick={() => onNavigate("pipeline")}>Ver pipeline →</button>
          </header>
          <div className="stage-bars">
            {leadStages.map((stage) => {
              const count = data.leads.filter((lead) => lead.stage === stage).length;
              const max = Math.max(1, data.leads.length);
              return (
                <div key={stage}>
                  <span>{stageLabels[stage]}</span>
                  <div><i style={{ width: `${Math.max(3, (count / max) * 100)}%` }} /></div>
                  <strong>{count}</strong>
                </div>
              );
            })}
          </div>
        </article>
        <article className="panel">
          <header className="panel__header">
            <div><p className="eyebrow">Agenda</p><h2>Próximos eventos</h2></div>
            <button type="button" className="text-button" onClick={() => onNavigate("calendar")}>Calendario →</button>
          </header>
          {upcoming.length === 0 ? (
            <EmptyState title="Sin eventos próximos" body="Programa reuniones, revisiones o entregas desde el calendario." />
          ) : (
            <ul className="event-list">
              {upcoming.map((event) => (
                <li key={event.id}>
                  <time>{new Date(event.startsAt).getDate()}</time>
                  <div><strong>{event.title}</strong><span>{formatDateTime(event.startsAt)}</span></div>
                </li>
              ))}
            </ul>
          )}
        </article>
        <article className="panel dashboard-attention">
          <header className="panel__header">
            <div><p className="eyebrow">Prioridad</p><h2>Requieren atención</h2></div>
          </header>
          {overdue.length === 0 ? (
            <EmptyState title="Todo al día" body="No hay seguimientos vencidos." />
          ) : (
            <ul className="attention-list">
              {overdue.slice(0, 5).map((lead) => (
                <li key={lead.id}>
                  <span className="status-dot status-dot--warning" />
                  <div><strong>{lead.name}</strong><span>{lead.nextAction}</span></div>
                  <time>{formatDateTime(lead.nextActionAt)}</time>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  readonly label: string;
  readonly value: string;
  readonly tone: string;
}) {
  return (
    <article className="metric-card" data-tone={tone}>
      <span>{label}</span>
      <strong>{value}</strong>
      <i />
    </article>
  );
}

function ProjectRegistry({
  data,
  query,
  onCreate,
  onEdit,
  onAddArtifact,
  onEditArtifact,
  onArchive,
}: {
  readonly data: BootstrapData;
  readonly query: string;
  readonly onCreate: () => void;
  readonly onEdit: (project: Project) => void;
  readonly onAddArtifact: (project: Project) => void;
  readonly onEditArtifact: (project: Project, artifact: Artifact) => void;
  readonly onArchive: (project: Project) => Promise<void>;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const projects = data.projects.filter((project) =>
    normalizedQuery.length === 0
      ? true
      : [project.name, project.description, project.niche, project.city, ...project.stack]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
  );

  return (
    <div className="workspace-page">
      <div className="section-intro">
        <div><p>{projects.length} proyectos organizados por cliente y fuente.</p></div>
        <button type="button" className="secondary-button" onClick={onCreate}><Icon name="plus" /> Nuevo proyecto</button>
      </div>
      <section className="project-grid">
        {projects.map((project) => {
          const artifacts = data.artifacts.filter((artifact) => artifact.projectId === project.id);
          return (
            <article className="project-card" key={project.id}>
              <header>
                <div>
                  <span className="project-card__status" data-status={project.status}>{projectStatusLabels[project.status]}</span>
                  <h2>{project.name}</h2>
                  <p>{project.description}</p>
                </div>
                <button type="button" className="icon-button" aria-label={`Editar ${project.name}`} onClick={() => onEdit(project)}>•••</button>
              </header>
              <div className="project-card__meta">
                {project.niche && <span>{project.niche}</span>}
                {project.city && <span>{project.city}</span>}
              </div>
              <div className="project-card__stack">
                {project.stack.map((item) => <span key={item}>{item}</span>)}
              </div>
              <ul className="artifact-list">
                {artifacts.map((artifact) => (
                  <li key={artifact.id}>
                    <button type="button" onClick={() => onEditArtifact(project, artifact)}>
                      <span>{artifactTypeLabels[artifact.type]}</span>
                      <strong>{artifact.label}</strong>
                    </button>
                    {artifact.publicUrl !== null && (
                      <a
                        href={artifact.publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Abrir ${artifact.label}`}
                      >
                        <Icon name="link" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              <footer>
                <button type="button" className="text-button" onClick={() => onAddArtifact(project)}>+ Agregar artefacto</button>
                <button type="button" className="danger-text" onClick={() => void onArchive(project)}>Archivar</button>
              </footer>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function LeadList({
  data,
  query,
  projectFilter,
  onProjectFilter,
  onSelect,
}: {
  readonly data: BootstrapData;
  readonly query: string;
  readonly projectFilter: string;
  readonly onProjectFilter: (value: string) => void;
  readonly onSelect: (leadId: string) => void;
}) {
  const leads = data.leads.filter((lead) => {
    const project = data.projects.find((item) => item.id === lead.projectId);
    const matchesProject = projectFilter === "all" || lead.projectId === projectFilter;
    const haystack = [lead.name, lead.company, lead.email, lead.source, project?.name]
      .join(" ")
      .toLowerCase();
    return matchesProject && haystack.includes(query.trim().toLowerCase());
  });

  return (
    <div className="workspace-page">
      <div className="list-controls">
        <p>{leads.length} leads activos</p>
        <label>
          <span>Filtrar por proyecto</span>
          <select value={projectFilter} onChange={(event) => onProjectFilter(event.target.value)}>
            <option value="all">Todos los proyectos</option>
            {data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </label>
      </div>
      {leads.length === 0 ? (
        <div className="panel"><EmptyState title="No hay leads" body="Crea un lead o cambia los filtros actuales." /></div>
      ) : (
        <div className="lead-table-wrap">
          <table className="lead-table">
            <thead><tr><th>Lead</th><th>Proyecto</th><th>Etapa</th><th>Valor</th><th>Próxima acción</th></tr></thead>
            <tbody>
              {leads.map((lead) => {
                const project = data.projects.find((item) => item.id === lead.projectId);
                return (
                  <tr key={lead.id}>
                    <td>
                      <button type="button" onClick={() => onSelect(lead.id)}>
                        <span className="lead-avatar">{lead.name.slice(0, 2).toUpperCase()}</span>
                        <span><strong>{lead.name}</strong><small>{lead.company ?? lead.email ?? lead.source}</small></span>
                      </button>
                    </td>
                    <td>{project?.name ?? "Proyecto no disponible"}</td>
                    <td><span className="stage-pill" data-stage={lead.stage}>{stageLabels[lead.stage]}</span></td>
                    <td>{formatCurrency(lead.estimatedValue)}</td>
                    <td>{lead.nextAction ?? "Sin siguiente acción"}<small>{lead.nextActionAt ? formatDateTime(lead.nextActionAt) : ""}</small></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LeadDetail({
  data,
  lead,
  busy,
  onBack,
  onEdit,
  onSchedule,
  onStageChange,
  onActivity,
  onArchive,
}: {
  readonly data: BootstrapData;
  readonly lead: Lead;
  readonly busy: boolean;
  readonly onBack: () => void;
  readonly onEdit: () => void;
  readonly onSchedule: () => void;
  readonly onStageChange: (stage: LeadStage) => Promise<void>;
  readonly onActivity: (input: Readonly<Record<string, unknown>>) => Promise<void>;
  readonly onArchive: () => Promise<void>;
}) {
  const project = data.projects.find((item) => item.id === lead.projectId);
  const activities = data.activities.filter((activity) => activity.leadId === lead.id);
  const events = data.events.filter((event) => event.leadId === lead.id);

  async function submitActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onActivity({
      leadId: lead.id,
      activityType: form.get("activityType"),
      title: form.get("title"),
      body: form.get("body"),
    });
    event.currentTarget.reset();
  }

  return (
    <div className="workspace-page">
      <button type="button" className="back-button" onClick={onBack}>← Volver a leads</button>
      <section className="lead-detail">
        <header className="lead-detail__hero">
          <div className="lead-avatar lead-avatar--large">{lead.name.slice(0, 2).toUpperCase()}</div>
          <div>
            <p className="eyebrow">{project?.name ?? "Proyecto no disponible"}</p>
            <h2>{lead.name}</h2>
            <p>{lead.company ?? lead.source}</p>
          </div>
          <div className="lead-detail__actions">
            <button type="button" className="secondary-button" onClick={onSchedule}>Agendar</button>
            <button type="button" className="secondary-button" onClick={onEdit}>Editar</button>
          </div>
        </header>
        <div className="lead-detail__grid">
          <div className="lead-detail__primary">
            <article className="panel">
              <header className="panel__header"><h3>Oportunidad</h3></header>
              <div className="definition-grid">
                <label>
                  <span>Etapa del lead</span>
                  <select value={lead.stage} disabled={busy} onChange={(event) => void onStageChange(event.target.value as LeadStage)}>
                    {leadStages.map((stage) => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}
                  </select>
                </label>
                <div><span>Valor estimado</span><strong>{formatCurrency(lead.estimatedValue)}</strong></div>
                <div><span>Probabilidad</span><strong>{lead.probability}%</strong></div>
                <div><span>Responsable</span><strong>{lead.owner}</strong></div>
                <div><span>Próxima acción</span><strong>{lead.nextAction ?? "Sin definir"}</strong><small>{formatDateTime(lead.nextActionAt)}</small></div>
                <div><span>Consentimiento</span><strong>{lead.consentStatus === "opted-in" ? "Confirmado" : lead.consentStatus === "opted-out" ? "No contactar" : "No confirmado"}</strong></div>
              </div>
              {lead.notes && <p className="lead-notes">{lead.notes}</p>}
            </article>
            <article className="panel">
              <header className="panel__header"><h3>Actividad</h3></header>
              <form className="activity-form" onSubmit={submitActivity}>
                <select name="activityType" aria-label="Tipo de actividad">
                  <option value="note">Nota</option><option value="call">Llamada</option><option value="email">Email</option><option value="meeting">Reunión</option>
                </select>
                <input name="title" aria-label="Título de actividad" placeholder="Registrar seguimiento" required />
                <textarea name="body" aria-label="Detalle de actividad" placeholder="Notas y resultado" />
                <button className="secondary-button" disabled={busy}>Registrar</button>
              </form>
              {activities.length === 0 ? (
                <EmptyState title="Sin actividad registrada" body="Las notas y cambios de etapa aparecerán aquí." />
              ) : (
                <ol className="timeline">
                  {activities.map((activity) => (
                    <li key={activity.id}><i /><div><strong>{activity.title}</strong>{activity.body && <p>{activity.body}</p>}<time>{formatDateTime(activity.createdAt)}</time></div></li>
                  ))}
                </ol>
              )}
            </article>
          </div>
          <aside className="lead-detail__aside">
            <article className="panel">
              <h3>Contacto</h3>
              <dl className="contact-list">
                <div><dt>Email</dt><dd>{lead.email ?? "No disponible"}</dd></div>
                <div><dt>Teléfono</dt><dd>{lead.phone ?? "No disponible"}</dd></div>
                <div><dt>Fuente</dt><dd>{lead.source}</dd></div>
                <div><dt>Canales permitidos</dt><dd>{lead.allowedChannels.join(", ") || "Ninguno registrado"}</dd></div>
              </dl>
            </article>
            <article className="panel">
              <h3>Calendario</h3>
              {events.length === 0 ? <p className="muted">Sin eventos programados.</p> : (
                <ul className="event-list event-list--compact">{events.map((event) => <li key={event.id}><time>{new Date(event.startsAt).getDate()}</time><div><strong>{event.title}</strong><span>{formatDateTime(event.startsAt)}</span></div></li>)}</ul>
              )}
            </article>
            <button type="button" className="danger-button" onClick={() => void onArchive()}>Archivar lead</button>
          </aside>
        </div>
      </section>
    </div>
  );
}

function Pipeline({
  data,
  onSelect,
  onMove,
}: {
  readonly data: BootstrapData;
  readonly onSelect: (leadId: string) => void;
  readonly onMove: (lead: Lead, stage: LeadStage) => Promise<void>;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function drop(event: DragEvent, stage: LeadStage) {
    event.preventDefault();
    const lead = data.leads.find((item) => item.id === draggingId);
    setDraggingId(null);
    if (lead && lead.stage !== stage) {
      void onMove(lead, stage);
    }
  }

  return (
    <div className="workspace-page pipeline-page">
      <p className="section-description">Mueve cada oportunidad entre etapas. Ningún cambio envía mensajes automáticamente.</p>
      <div className="pipeline-board">
        {leadStages.map((stage) => {
          const leads = data.leads.filter((lead) => lead.stage === stage);
          return (
            <section
              className="pipeline-column"
              key={stage}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => drop(event, stage)}
            >
              <header><span className="status-dot" data-stage={stage} /><h2>{stageLabels[stage]}</h2><strong>{leads.length}</strong></header>
              <div className="pipeline-column__cards">
                {leads.map((lead) => (
                  <article key={lead.id} className="pipeline-card" draggable onDragStart={() => setDraggingId(lead.id)} onDragEnd={() => setDraggingId(null)}>
                    <button type="button" onClick={() => onSelect(lead.id)}>
                      <strong>{lead.name}</strong>
                      <span>{data.projects.find((item) => item.id === lead.projectId)?.name}</span>
                    </button>
                    <div><strong>{formatCurrency(lead.estimatedValue)}</strong><small>{lead.probability}%</small></div>
                    <label>
                      <span className="sr-only">Mover {lead.name}</span>
                      <select aria-label={`Mover ${lead.name}`} value={lead.stage} onChange={(event) => void onMove(lead, event.target.value as LeadStage)}>
                        {leadStages.map((option) => <option value={option} key={option}>{stageLabels[option]}</option>)}
                      </select>
                    </label>
                  </article>
                ))}
                {leads.length === 0 && <p className="pipeline-empty">Suelta aquí</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function CalendarView({
  data,
  onCreate,
  onEdit,
  onArchive,
}: {
  readonly data: BootstrapData;
  readonly onCreate: (date?: Date) => void;
  readonly onEdit: (event: CalendarEvent) => void;
  readonly onArchive: (event: CalendarEvent) => Promise<void>;
}) {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const grouped = groupEventsByDay(data.events, timeZone);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leading = (month.getDay() + 6) % 7;
  const cells = Array.from({ length: leading + daysInMonth }, (_, index) =>
    index < leading ? null : new Date(month.getFullYear(), month.getMonth(), index - leading + 1),
  );

  return (
    <div className="workspace-page">
      <div className="calendar-toolbar">
        <div>
          <button type="button" aria-label="Mes anterior" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>←</button>
          <h2>{new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(month)}</h2>
          <button type="button" aria-label="Mes siguiente" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>→</button>
        </div>
        <button type="button" className="secondary-button" onClick={() => onCreate()}><Icon name="plus" /> Nuevo evento</button>
      </div>
      <section className="calendar-layout">
        <div className="calendar-grid">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => <strong className="calendar-weekday" key={day}>{day}</strong>)}
          {cells.map((date, index) => {
            if (date === null) return <div className="calendar-day calendar-day--empty" key={`empty-${index}`} />;
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            const events = grouped.get(key) ?? [];
            return (
              <button type="button" className="calendar-day" key={key} onClick={() => onCreate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10))}>
                <time>{date.getDate()}</time>
                {events.slice(0, 3).map((event) => <span key={event.id} data-event-type={event.eventType}>{event.title}</span>)}
                {events.length > 3 && <small>+{events.length - 3} más</small>}
              </button>
            );
          })}
        </div>
        <aside className="calendar-agenda panel">
          <h3>Agenda</h3>
          {data.events.length === 0 ? <EmptyState title="Agenda vacía" body="Crea el primer seguimiento." /> : (
            <ul>{data.events.map((event) => (
              <li key={event.id}>
                <button type="button" onClick={() => onEdit(event)}>
                  <span>{eventTypeLabels[event.eventType]}</span><strong>{event.title}</strong><time>{formatDateTime(event.startsAt)}</time>
                </button>
                <button type="button" className="danger-text" onClick={() => void onArchive(event)}>Archivar</button>
              </li>
            ))}</ul>
          )}
        </aside>
      </section>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header><h2 id="modal-title">{title}</h2><button type="button" aria-label="Cerrar" onClick={onClose}><Icon name="close" /></button></header>
        {children}
      </section>
    </div>
  );
}

function LeadForm({
  data,
  record,
  busy,
  onClose,
  onSubmit,
}: {
  readonly data: BootstrapData;
  readonly record?: Lead;
  readonly busy: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (payload: Readonly<Record<string, unknown>>) => Promise<void>;
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      projectId: form.get("projectId"),
      name: form.get("name"),
      company: form.get("company"),
      email: form.get("email"),
      phone: form.get("phone"),
      source: form.get("source"),
      stage: form.get("stage"),
      owner: form.get("owner"),
      estimatedValue: form.get("estimatedValue"),
      probability: form.get("probability"),
      nextAction: form.get("nextAction"),
      nextActionAt: form.get("nextActionAt") ? new Date(String(form.get("nextActionAt"))).toISOString() : null,
      notes: form.get("notes"),
      consentStatus: form.get("consentStatus"),
      allowedChannels: form.getAll("allowedChannels"),
    });
  }

  return (
    <Modal title={record ? "Editar lead" : "Crear lead"} onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <div className="form-grid">
          <label><span>Nombre del lead</span><input name="name" required defaultValue={record?.name} /></label>
          <label><span>Proyecto</span><select name="projectId" required defaultValue={record?.projectId ?? data.projects[0]?.id}>{data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          <label><span>Empresa</span><input name="company" defaultValue={record?.company ?? ""} /></label>
          <label><span>Fuente</span><input name="source" defaultValue={record?.source ?? "Manual"} /></label>
          <label><span>Email</span><input name="email" type="email" defaultValue={record?.email ?? ""} /></label>
          <label><span>Teléfono</span><input name="phone" defaultValue={record?.phone ?? ""} /></label>
          <label><span>Etapa</span><select name="stage" defaultValue={record?.stage ?? "new"}>{leadStages.map((stage) => <option value={stage} key={stage}>{stageLabels[stage]}</option>)}</select></label>
          <label><span>Responsable</span><input name="owner" defaultValue={record?.owner ?? "Roger"} /></label>
          <label><span>Valor estimado</span><input name="estimatedValue" type="number" min="0" defaultValue={record?.estimatedValue ?? 0} /></label>
          <label><span>Probabilidad</span><input name="probability" type="number" min="0" max="100" defaultValue={record?.probability ?? 20} /></label>
          <label className="form-grid__wide"><span>Próxima acción</span><input name="nextAction" defaultValue={record?.nextAction ?? ""} /></label>
          <label><span>Fecha de seguimiento</span><input name="nextActionAt" type="datetime-local" defaultValue={record?.nextActionAt ? toDateTimeInput(record.nextActionAt) : ""} /></label>
          <label><span>Consentimiento</span><select name="consentStatus" defaultValue={record?.consentStatus ?? "unknown"}><option value="unknown">No confirmado</option><option value="opted-in">Confirmado</option><option value="not-required">No requerido</option><option value="opted-out">No contactar</option></select></label>
          <fieldset className="form-grid__wide"><legend>Canales permitidos</legend>{["email", "phone", "whatsapp", "instagram"].map((channel) => <label className="checkbox-label" key={channel}><input type="checkbox" name="allowedChannels" value={channel} defaultChecked={record?.allowedChannels.includes(channel as never)} />{channel}</label>)}</fieldset>
          <label className="form-grid__wide"><span>Notas</span><textarea name="notes" defaultValue={record?.notes ?? ""} /></label>
        </div>
        <footer><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar lead"}</button></footer>
      </form>
    </Modal>
  );
}

function ProjectForm({
  record,
  busy,
  onClose,
  onSubmit,
}: {
  readonly record?: Project;
  readonly busy: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (payload: Readonly<Record<string, unknown>>) => Promise<void>;
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      name: form.get("name"),
      slug: form.get("slug"),
      description: form.get("description"),
      status: form.get("status"),
      niche: form.get("niche"),
      city: form.get("city"),
      stack: String(form.get("stack") ?? "").split(","),
      localPath: form.get("localPath"),
    });
  }
  return (
    <Modal title={record ? "Editar proyecto" : "Crear proyecto"} onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <div className="form-grid">
          <label><span>Nombre</span><input name="name" required defaultValue={record?.name} /></label>
          <label><span>Slug</span><input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={record?.slug} /></label>
          <label className="form-grid__wide"><span>Descripción</span><textarea name="description" required defaultValue={record?.description} /></label>
          <label><span>Estado</span><select name="status" defaultValue={record?.status ?? "discovery"}>{(Object.keys(projectStatusLabels) as ProjectStatus[]).map((status) => <option key={status} value={status}>{projectStatusLabels[status]}</option>)}</select></label>
          <label><span>Nicho</span><input name="niche" defaultValue={record?.niche ?? ""} /></label>
          <label><span>Ciudad</span><input name="city" defaultValue={record?.city ?? ""} /></label>
          <label><span>Stack, separado por comas</span><input name="stack" defaultValue={record?.stack.join(", ")} /></label>
          <label className="form-grid__wide"><span>Ruta local</span><input name="localPath" required defaultValue={record?.localPath} /></label>
        </div>
        <footer><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar proyecto"}</button></footer>
      </form>
    </Modal>
  );
}

function ArtifactForm({
  project,
  record,
  busy,
  onClose,
  onSubmit,
}: {
  readonly project: Project;
  readonly record?: Artifact;
  readonly busy: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (payload: Readonly<Record<string, unknown>>) => Promise<void>;
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      projectId: project.id,
      type: form.get("type"),
      label: form.get("label"),
      localPath: form.get("localPath"),
      publicUrl: form.get("publicUrl"),
      linkStatus: form.get("linkStatus"),
      isCanonical: form.get("isCanonical") === "on",
      notes: form.get("notes"),
    });
  }
  return (
    <Modal title={`${record ? "Editar" : "Agregar"} artefacto · ${project.name}`} onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <div className="form-grid">
          <label><span>Tipo</span><select name="type" defaultValue={record?.type ?? "landing"}>{(Object.keys(artifactTypeLabels) as ArtifactType[]).map((type) => <option key={type} value={type}>{artifactTypeLabels[type]}</option>)}</select></label>
          <label><span>Etiqueta</span><input name="label" required defaultValue={record?.label} /></label>
          <label className="form-grid__wide"><span>Ruta local</span><input name="localPath" defaultValue={record?.localPath ?? ""} /></label>
          <label className="form-grid__wide"><span>URL pública</span><input name="publicUrl" type="url" defaultValue={record?.publicUrl ?? ""} /></label>
          <label><span>Estado del enlace</span><select name="linkStatus" defaultValue={record?.linkStatus ?? "declared"}><option value="declared">Declarado</option><option value="verified">Verificado</option><option value="protected">Protegido/local</option><option value="unavailable">No disponible</option></select></label>
          <label className="checkbox-label"><input name="isCanonical" type="checkbox" defaultChecked={record?.isCanonical} />Versión canónica</label>
          <label className="form-grid__wide"><span>Notas</span><textarea name="notes" defaultValue={record?.notes ?? ""} /></label>
        </div>
        <footer><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar artefacto"}</button></footer>
      </form>
    </Modal>
  );
}

function EventForm({
  data,
  record,
  defaultProjectId,
  defaultLeadId,
  defaultStartsAt,
  defaultEndsAt,
  busy,
  onClose,
  onSubmit,
}: {
  readonly data: BootstrapData;
  readonly record?: CalendarEvent;
  readonly defaultProjectId?: string;
  readonly defaultLeadId?: string;
  readonly defaultStartsAt?: string;
  readonly defaultEndsAt?: string;
  readonly busy: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (payload: Readonly<Record<string, unknown>>) => Promise<void>;
}) {
  const projectId = defaultProjectId ?? record?.projectId ?? data.projects[0]?.id;
  const [defaultWindow] = useState(() => {
    const startsAt =
      record?.startsAt ??
      defaultStartsAt ??
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const endsAt =
      record?.endsAt ??
      defaultEndsAt ??
      new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString();
    return {
      startsAt: toDateTimeInput(startsAt),
      endsAt: toDateTimeInput(endsAt),
    };
  });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      projectId: form.get("projectId"),
      leadId: form.get("leadId"),
      title: form.get("title"),
      eventType: form.get("eventType"),
      startsAt: new Date(String(form.get("startsAt"))).toISOString(),
      endsAt: new Date(String(form.get("endsAt"))).toISOString(),
      notes: form.get("notes"),
    });
  }
  return (
    <Modal title={record?.id ? "Editar evento" : "Crear evento"} onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <div className="form-grid">
          <label className="form-grid__wide"><span>Título</span><input name="title" required defaultValue={record?.title} /></label>
          <label><span>Proyecto</span><select name="projectId" defaultValue={projectId}>{data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          <label><span>Lead relacionado</span><select name="leadId" defaultValue={defaultLeadId ?? record?.leadId ?? ""}><option value="">Sin lead</option>{data.leads.filter((lead) => lead.projectId === projectId).map((lead) => <option key={lead.id} value={lead.id}>{lead.name}</option>)}</select></label>
          <label><span>Tipo</span><select name="eventType" defaultValue={record?.eventType ?? "meeting"}>{(Object.keys(eventTypeLabels) as CalendarEventType[]).map((type) => <option value={type} key={type}>{eventTypeLabels[type]}</option>)}</select></label>
          <label><span>Inicio</span><input name="startsAt" type="datetime-local" required defaultValue={defaultWindow.startsAt} /></label>
          <label><span>Fin</span><input name="endsAt" type="datetime-local" required defaultValue={defaultWindow.endsAt} /></label>
          <label className="form-grid__wide"><span>Notas</span><textarea name="notes" defaultValue={record?.notes ?? ""} /></label>
        </div>
        <footer><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar evento"}</button></footer>
      </form>
    </Modal>
  );
}

function EmptyState({
  title,
  body,
}: {
  readonly title: string;
  readonly body: string;
}) {
  return <div className="empty-state"><span /><strong>{title}</strong><p>{body}</p></div>;
}

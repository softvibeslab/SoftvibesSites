import "server-only";

import { randomUUID } from "node:crypto";

import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import {
  type Activity,
  type Artifact,
  type ArtifactType,
  type BootstrapData,
  type CalendarEvent,
  type CalendarEventType,
  type ConsentStatus,
  type ContactChannel,
  type Lead,
  type LeadInput,
  type LeadStage,
  type LinkStatus,
  type Project,
  type ProjectStatus,
  validateLeadInput,
} from "@/domain/crm";

import { ensureDatabase, getDatabasePool, withTransaction } from "./database";

interface UserRow extends RowDataPacket {
  readonly id: string;
  readonly username: string;
  readonly password_salt: string;
  readonly password_hash: string;
}

interface ProjectRow extends RowDataPacket {
  readonly id: string;
  readonly tenant_id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly status: ProjectStatus;
  readonly niche: string | null;
  readonly city: string | null;
  readonly stack_json: string | readonly string[];
  readonly local_path: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly archived_at: string | null;
}

interface ArtifactRow extends RowDataPacket {
  readonly id: string;
  readonly project_id: string;
  readonly tenant_id: string;
  readonly type: ArtifactType;
  readonly label: string;
  readonly local_path: string | null;
  readonly public_url: string | null;
  readonly link_status: LinkStatus;
  readonly is_canonical: number | boolean;
  readonly notes: string | null;
  readonly created_at: string;
  readonly updated_at: string;
  readonly archived_at: string | null;
}

interface LeadRow extends RowDataPacket {
  readonly id: string;
  readonly project_id: string;
  readonly tenant_id: string;
  readonly name: string;
  readonly company: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly source: string;
  readonly stage: LeadStage;
  readonly owner: string;
  readonly estimated_value: number | string;
  readonly probability: number;
  readonly next_action: string | null;
  readonly next_action_at: string | null;
  readonly notes: string | null;
  readonly consent_status: ConsentStatus;
  readonly allowed_channels_json: string | readonly ContactChannel[];
  readonly created_at: string;
  readonly updated_at: string;
  readonly archived_at: string | null;
}

interface ActivityRow extends RowDataPacket {
  readonly id: string;
  readonly project_id: string;
  readonly tenant_id: string;
  readonly lead_id: string;
  readonly activity_type: Activity["activityType"];
  readonly title: string;
  readonly body: string | null;
  readonly created_at: string;
}

interface CalendarEventRow extends RowDataPacket {
  readonly id: string;
  readonly project_id: string;
  readonly tenant_id: string;
  readonly lead_id: string | null;
  readonly title: string;
  readonly event_type: CalendarEventType;
  readonly starts_at: string;
  readonly ends_at: string;
  readonly notes: string | null;
  readonly created_at: string;
  readonly updated_at: string;
  readonly archived_at: string | null;
}

export class RepositoryError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "VALIDATION_ERROR" | "CONFLICT",
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

export interface ProjectInput {
  readonly name?: unknown;
  readonly slug?: unknown;
  readonly description?: unknown;
  readonly status?: unknown;
  readonly niche?: unknown;
  readonly city?: unknown;
  readonly stack?: unknown;
  readonly localPath?: unknown;
}

export interface ArtifactInput {
  readonly projectId?: unknown;
  readonly type?: unknown;
  readonly label?: unknown;
  readonly localPath?: unknown;
  readonly publicUrl?: unknown;
  readonly linkStatus?: unknown;
  readonly isCanonical?: unknown;
  readonly notes?: unknown;
}

export interface ActivityInput {
  readonly leadId?: unknown;
  readonly activityType?: unknown;
  readonly title?: unknown;
  readonly body?: unknown;
}

export interface CalendarEventInput {
  readonly projectId?: unknown;
  readonly leadId?: unknown;
  readonly title?: unknown;
  readonly eventType?: unknown;
  readonly startsAt?: unknown;
  readonly endsAt?: unknown;
  readonly notes?: unknown;
}

function parseStringArray<T extends string>(
  value: string | readonly T[],
): readonly T[] {
  if (Array.isArray(value)) {
    return value as readonly T[];
  }
  try {
    const parsed: unknown = JSON.parse(value as string);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is T => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function projectFromRow(row: ProjectRow): Project {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    status: row.status,
    niche: row.niche,
    city: row.city,
    stack: parseStringArray(row.stack_json),
    localPath: row.local_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function artifactFromRow(row: ArtifactRow): Artifact {
  return {
    id: row.id,
    projectId: row.project_id,
    tenantId: row.tenant_id,
    type: row.type,
    label: row.label,
    localPath: row.local_path,
    publicUrl: row.public_url,
    linkStatus: row.link_status,
    isCanonical: Boolean(row.is_canonical),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function leadFromRow(row: LeadRow): Lead {
  return {
    id: row.id,
    projectId: row.project_id,
    tenantId: row.tenant_id,
    name: row.name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    source: row.source,
    stage: row.stage,
    owner: row.owner,
    estimatedValue: Number(row.estimated_value),
    probability: Number(row.probability),
    nextAction: row.next_action,
    nextActionAt: row.next_action_at,
    notes: row.notes,
    consentStatus: row.consent_status,
    allowedChannels: parseStringArray<ContactChannel>(row.allowed_channels_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function activityFromRow(row: ActivityRow): Activity {
  return {
    id: row.id,
    projectId: row.project_id,
    tenantId: row.tenant_id,
    leadId: row.lead_id,
    activityType: row.activity_type,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
  };
}

function eventFromRow(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    projectId: row.project_id,
    tenantId: row.tenant_id,
    leadId: row.lead_id,
    title: row.title,
    eventType: row.event_type,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function requiredString(value: unknown, field: string, max = 500): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > max) {
    throw new RepositoryError(
      "VALIDATION_ERROR",
      `Invalid ${field}.`,
      422,
    );
  }
  return value.trim();
}

function nullableString(value: unknown, max = 1000): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  if (normalized.length > max) {
    throw new RepositoryError("VALIDATION_ERROR", "Text value is too long.", 422);
  }
  return normalized.length > 0 ? normalized : null;
}

function normalizeSlug(value: unknown): string {
  const slug = requiredString(value, "slug", 120).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new RepositoryError("VALIDATION_ERROR", "Invalid slug.", 422);
  }
  return slug;
}

const projectStatuses: readonly ProjectStatus[] = [
  "discovery",
  "analysis",
  "landing",
  "review",
  "live",
  "paused",
];
const artifactTypes: readonly ArtifactType[] = [
  "research",
  "analysis",
  "proposal",
  "landing",
  "links",
  "cms",
  "preview",
  "deployment",
  "redirect",
  "variant",
];
const linkStatuses: readonly LinkStatus[] = [
  "declared",
  "verified",
  "unavailable",
  "protected",
];
const eventTypes: readonly CalendarEventType[] = [
  "meeting",
  "call",
  "follow-up",
  "delivery",
  "review",
];
const activityTypes: readonly Activity["activityType"][] = [
  "note",
  "call",
  "email",
  "meeting",
  "stage-change",
];

function enumValue<T extends string>(
  value: unknown,
  values: readonly T[],
  field: string,
): T {
  if (typeof value !== "string" || !values.includes(value as T)) {
    throw new RepositoryError(
      "VALIDATION_ERROR",
      `Invalid ${field}.`,
      422,
    );
  }
  return value as T;
}

function stringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0 && item.length <= 80),
    ),
  ];
}

function validateProjectInput(
  input: ProjectInput,
  current?: Project,
): Omit<Project, "id" | "tenantId" | "createdAt" | "updatedAt" | "archivedAt"> {
  const statusValue = input.status ?? current?.status ?? "discovery";
  const stackValue = input.stack ?? current?.stack ?? [];
  return {
    name: requiredString(input.name ?? current?.name, "project name", 200),
    slug: normalizeSlug(input.slug ?? current?.slug),
    description: requiredString(
      input.description ?? current?.description ?? "Project registry entry.",
      "description",
      4000,
    ),
    status: enumValue(statusValue, projectStatuses, "project status"),
    niche: nullableString(input.niche ?? current?.niche, 200),
    city: nullableString(input.city ?? current?.city, 200),
    stack: stringArray(stackValue),
    localPath: requiredString(
      input.localPath ?? current?.localPath,
      "local path",
      500,
    ),
  };
}

function validateArtifactInput(
  input: ArtifactInput,
  current?: Artifact,
): Omit<Artifact, "id" | "tenantId" | "createdAt" | "updatedAt" | "archivedAt"> {
  const publicUrl = nullableString(input.publicUrl ?? current?.publicUrl, 1000);
  if (publicUrl !== null) {
    try {
      const url = new URL(publicUrl);
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Unsupported URL.");
      }
    } catch {
      throw new RepositoryError("VALIDATION_ERROR", "Invalid public URL.", 422);
    }
  }

  return {
    projectId: requiredString(
      input.projectId ?? current?.projectId,
      "project identifier",
      64,
    ),
    type: enumValue(input.type ?? current?.type, artifactTypes, "artifact type"),
    label: requiredString(input.label ?? current?.label, "artifact label", 200),
    localPath: nullableString(input.localPath ?? current?.localPath, 500),
    publicUrl,
    linkStatus: enumValue(
      input.linkStatus ?? current?.linkStatus ?? "declared",
      linkStatuses,
      "link status",
    ),
    isCanonical:
      typeof input.isCanonical === "boolean"
        ? input.isCanonical
        : current?.isCanonical ?? false,
    notes: nullableString(input.notes ?? current?.notes, 4000),
  };
}

function validateCalendarInput(
  input: CalendarEventInput,
  current?: CalendarEvent,
): Omit<CalendarEvent, "id" | "tenantId" | "createdAt" | "updatedAt" | "archivedAt"> {
  const startsAt = requiredString(
    input.startsAt ?? current?.startsAt,
    "start date",
    40,
  );
  const endsAt = requiredString(input.endsAt ?? current?.endsAt, "end date", 40);
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end.getTime() <= start.getTime()
  ) {
    throw new RepositoryError(
      "VALIDATION_ERROR",
      "The event end must be after its start.",
      422,
    );
  }

  return {
    projectId: requiredString(
      input.projectId ?? current?.projectId,
      "project identifier",
      64,
    ),
    leadId: nullableString(input.leadId ?? current?.leadId, 64),
    title: requiredString(input.title ?? current?.title, "event title", 300),
    eventType: enumValue(
      input.eventType ?? current?.eventType,
      eventTypes,
      "event type",
    ),
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    notes: nullableString(input.notes ?? current?.notes, 4000),
  };
}

function validateLeadForPersistence(input: LeadInput) {
  try {
    return validateLeadInput(input);
  } catch {
    throw new RepositoryError(
      "VALIDATION_ERROR",
      "One or more lead fields are invalid.",
      422,
    );
  }
}

function requireUnchangedProject(
  nextProjectId: string,
  currentProjectId: string,
): void {
  if (nextProjectId !== currentProjectId) {
    throw new RepositoryError(
      "VALIDATION_ERROR",
      "The record cannot be moved to another project.",
      422,
    );
  }
}

async function projectScope(
  connection: PoolConnection,
  projectId: string,
): Promise<Project> {
  const [rows] = await connection.execute<ProjectRow[]>(
    "SELECT * FROM projects WHERE id = ? AND archived_at IS NULL LIMIT 1",
    [projectId],
  );
  const row = rows[0];
  if (row === undefined) {
    throw new RepositoryError("NOT_FOUND", "Project not found.", 404);
  }
  return projectFromRow(row);
}

async function leadScope(
  connection: PoolConnection,
  leadId: string,
): Promise<Lead> {
  const [rows] = await connection.execute<LeadRow[]>(
    "SELECT * FROM leads WHERE id = ? AND archived_at IS NULL LIMIT 1",
    [leadId],
  );
  const row = rows[0];
  if (row === undefined) {
    throw new RepositoryError("NOT_FOUND", "Lead not found.", 404);
  }
  return leadFromRow(row);
}

async function audit(
  connection: PoolConnection,
  input: {
    readonly userId: string;
    readonly projectId: string | null;
    readonly tenantId: string | null;
    readonly entityType: string;
    readonly entityId: string;
    readonly action: string;
    readonly details?: Readonly<Record<string, unknown>>;
  },
): Promise<void> {
  await connection.execute<ResultSetHeader>(
    `INSERT INTO audit_events
      (id, user_id, project_id, tenant_id, entity_type, entity_id, action,
       details_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      input.userId,
      input.projectId,
      input.tenantId,
      input.entityType,
      input.entityId,
      input.action,
      JSON.stringify(input.details ?? {}),
      new Date().toISOString(),
    ],
  );
}

export async function findUserByUsername(
  username: string,
): Promise<UserRow | undefined> {
  await ensureDatabase();
  const [rows] = await getDatabasePool().execute<UserRow[]>(
    "SELECT id, username, password_salt, password_hash FROM users WHERE username = ? LIMIT 1",
    [username],
  );
  return rows[0];
}

export async function getBootstrapData(
  username: string,
  csrfToken: string,
): Promise<BootstrapData> {
  await ensureDatabase();
  const database = getDatabasePool();
  const [projectRows] = await database.query<ProjectRow[]>(
    "SELECT * FROM projects WHERE archived_at IS NULL ORDER BY name",
  );
  const [artifactRows] = await database.query<ArtifactRow[]>(
    "SELECT * FROM artifacts WHERE archived_at IS NULL ORDER BY project_id, is_canonical DESC, label",
  );
  const [leadRows] = await database.query<LeadRow[]>(
    "SELECT * FROM leads WHERE archived_at IS NULL ORDER BY updated_at DESC",
  );
  const [activityRows] = await database.query<ActivityRow[]>(
    "SELECT * FROM activities ORDER BY created_at DESC LIMIT 1000",
  );
  const [eventRows] = await database.query<CalendarEventRow[]>(
    "SELECT * FROM calendar_events WHERE archived_at IS NULL ORDER BY starts_at",
  );

  return {
    user: { username },
    csrfToken,
    projects: projectRows.map(projectFromRow),
    artifacts: artifactRows.map(artifactFromRow),
    leads: leadRows.map(leadFromRow),
    activities: activityRows.map(activityFromRow),
    events: eventRows.map(eventFromRow),
  };
}

export async function createProject(
  input: ProjectInput,
  userId: string,
): Promise<Project> {
  const validated = validateProjectInput(input);
  const id = randomUUID();
  const tenantId = id;
  const now = new Date().toISOString();

  return withTransaction(async (connection) => {
    try {
      await connection.execute<ResultSetHeader>(
        `INSERT INTO projects
          (id, tenant_id, slug, name, description, status, niche, city, stack_json,
           local_path, created_at, updated_at, archived_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        [
          id,
          tenantId,
          validated.slug,
          validated.name,
          validated.description,
          validated.status,
          validated.niche,
          validated.city,
          JSON.stringify(validated.stack),
          validated.localPath,
          now,
          now,
        ],
      );
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ER_DUP_ENTRY"
      ) {
        throw new RepositoryError("CONFLICT", "Project slug already exists.", 409);
      }
      throw error;
    }
    await audit(connection, {
      userId,
      projectId: id,
      tenantId,
      entityType: "project",
      entityId: id,
      action: "created",
    });
    return {
      id,
      tenantId,
      ...validated,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };
  });
}

export async function updateProject(
  id: string,
  input: ProjectInput,
  userId: string,
): Promise<Project> {
  return withTransaction(async (connection) => {
    const current = await projectScope(connection, id);
    const validated = validateProjectInput(input, current);
    const updatedAt = new Date().toISOString();
    try {
      await connection.execute<ResultSetHeader>(
        `UPDATE projects SET slug = ?, name = ?, description = ?, status = ?,
         niche = ?, city = ?, stack_json = ?, local_path = ?, updated_at = ?
         WHERE id = ? AND tenant_id = ? AND archived_at IS NULL`,
        [
          validated.slug,
          validated.name,
          validated.description,
          validated.status,
          validated.niche,
          validated.city,
          JSON.stringify(validated.stack),
          validated.localPath,
          updatedAt,
          current.id,
          current.tenantId,
        ],
      );
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ER_DUP_ENTRY"
      ) {
        throw new RepositoryError("CONFLICT", "Project slug already exists.", 409);
      }
      throw error;
    }
    await audit(connection, {
      userId,
      projectId: current.id,
      tenantId: current.tenantId,
      entityType: "project",
      entityId: current.id,
      action: "updated",
    });
    return { ...current, ...validated, updatedAt };
  });
}

export async function archiveProject(id: string, userId: string): Promise<void> {
  await withTransaction(async (connection) => {
    const current = await projectScope(connection, id);
    const archivedAt = new Date().toISOString();
    await connection.execute(
      "UPDATE projects SET archived_at = ?, updated_at = ? WHERE id = ? AND tenant_id = ?",
      [archivedAt, archivedAt, current.id, current.tenantId],
    );
    await connection.execute(
      "UPDATE artifacts SET archived_at = ?, updated_at = ? WHERE project_id = ? AND tenant_id = ? AND archived_at IS NULL",
      [archivedAt, archivedAt, current.id, current.tenantId],
    );
    await connection.execute(
      "UPDATE leads SET archived_at = ?, updated_at = ? WHERE project_id = ? AND tenant_id = ? AND archived_at IS NULL",
      [archivedAt, archivedAt, current.id, current.tenantId],
    );
    await connection.execute(
      "UPDATE calendar_events SET archived_at = ?, updated_at = ? WHERE project_id = ? AND tenant_id = ? AND archived_at IS NULL",
      [archivedAt, archivedAt, current.id, current.tenantId],
    );
    await audit(connection, {
      userId,
      projectId: current.id,
      tenantId: current.tenantId,
      entityType: "project",
      entityId: current.id,
      action: "archived",
    });
  });
}

export async function createArtifact(
  input: ArtifactInput,
  userId: string,
): Promise<Artifact> {
  const validated = validateArtifactInput(input);
  return withTransaction(async (connection) => {
    const project = await projectScope(connection, validated.projectId);
    const id = randomUUID();
    const now = new Date().toISOString();
    await connection.execute(
      `INSERT INTO artifacts
       (id, project_id, tenant_id, type, label, local_path, public_url, link_status,
        is_canonical, notes, created_at, updated_at, archived_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        id,
        project.id,
        project.tenantId,
        validated.type,
        validated.label,
        validated.localPath,
        validated.publicUrl,
        validated.linkStatus,
        validated.isCanonical ? 1 : 0,
        validated.notes,
        now,
        now,
      ],
    );
    await audit(connection, {
      userId,
      projectId: project.id,
      tenantId: project.tenantId,
      entityType: "artifact",
      entityId: id,
      action: "created",
    });
    return {
      id,
      tenantId: project.tenantId,
      ...validated,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };
  });
}

export async function updateArtifact(
  id: string,
  input: ArtifactInput,
  userId: string,
): Promise<Artifact> {
  return withTransaction(async (connection) => {
    const [rows] = await connection.execute<ArtifactRow[]>(
      "SELECT * FROM artifacts WHERE id = ? AND archived_at IS NULL LIMIT 1",
      [id],
    );
    const row = rows[0];
    if (row === undefined) {
      throw new RepositoryError("NOT_FOUND", "Artifact not found.", 404);
    }
    const current = artifactFromRow(row);
    const validated = validateArtifactInput(input, current);
    requireUnchangedProject(validated.projectId, current.projectId);
    const project = await projectScope(connection, validated.projectId);
    const updatedAt = new Date().toISOString();
    await connection.execute(
      `UPDATE artifacts SET project_id = ?, tenant_id = ?, type = ?, label = ?,
       local_path = ?, public_url = ?, link_status = ?, is_canonical = ?, notes = ?,
       updated_at = ? WHERE id = ? AND archived_at IS NULL`,
      [
        project.id,
        project.tenantId,
        validated.type,
        validated.label,
        validated.localPath,
        validated.publicUrl,
        validated.linkStatus,
        validated.isCanonical ? 1 : 0,
        validated.notes,
        updatedAt,
        id,
      ],
    );
    await audit(connection, {
      userId,
      projectId: project.id,
      tenantId: project.tenantId,
      entityType: "artifact",
      entityId: id,
      action: "updated",
    });
    return {
      id,
      tenantId: project.tenantId,
      ...validated,
      createdAt: current.createdAt,
      updatedAt,
      archivedAt: null,
    };
  });
}

export async function archiveArtifact(id: string, userId: string): Promise<void> {
  await withTransaction(async (connection) => {
    const [rows] = await connection.execute<ArtifactRow[]>(
      "SELECT * FROM artifacts WHERE id = ? AND archived_at IS NULL LIMIT 1",
      [id],
    );
    const row = rows[0];
    if (row === undefined) {
      throw new RepositoryError("NOT_FOUND", "Artifact not found.", 404);
    }
    const artifact = artifactFromRow(row);
    const archivedAt = new Date().toISOString();
    await connection.execute(
      "UPDATE artifacts SET archived_at = ?, updated_at = ? WHERE id = ? AND tenant_id = ?",
      [archivedAt, archivedAt, artifact.id, artifact.tenantId],
    );
    await audit(connection, {
      userId,
      projectId: artifact.projectId,
      tenantId: artifact.tenantId,
      entityType: "artifact",
      entityId: artifact.id,
      action: "archived",
    });
  });
}

export async function createLead(
  input: LeadInput,
  userId: string,
): Promise<Lead> {
  const validated = validateLeadForPersistence(input);
  if (validated.projectId === null) {
    throw new RepositoryError("VALIDATION_ERROR", "Project is required.", 422);
  }

  return withTransaction(async (connection) => {
    const project = await projectScope(connection, validated.projectId ?? "");
    const id = randomUUID();
    const now = new Date().toISOString();
    await connection.execute(
      `INSERT INTO leads
       (id, project_id, tenant_id, name, company, email, phone, source, stage,
        owner, estimated_value, probability, next_action, next_action_at, notes,
        consent_status, allowed_channels_json, created_at, updated_at, archived_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        id,
        project.id,
        project.tenantId,
        validated.name,
        validated.company,
        validated.email,
        validated.phone,
        validated.source,
        validated.stage,
        validated.owner,
        validated.estimatedValue,
        validated.probability,
        validated.nextAction,
        validated.nextActionAt,
        validated.notes,
        validated.consentStatus,
        JSON.stringify(validated.allowedChannels),
        now,
        now,
      ],
    );
    await audit(connection, {
      userId,
      projectId: project.id,
      tenantId: project.tenantId,
      entityType: "lead",
      entityId: id,
      action: "created",
      details: { stage: validated.stage },
    });
    return {
      id,
      ...validated,
      projectId: project.id,
      tenantId: project.tenantId,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };
  });
}

export async function updateLead(
  id: string,
  input: LeadInput,
  userId: string,
): Promise<Lead> {
  return withTransaction(async (connection) => {
    const current = await leadScope(connection, id);
    const validated = validateLeadForPersistence({
      projectId: input.projectId ?? current.projectId,
      name: input.name ?? current.name,
      company: input.company ?? current.company,
      email: input.email ?? current.email,
      phone: input.phone ?? current.phone,
      source: input.source ?? current.source,
      stage: input.stage ?? current.stage,
      owner: input.owner ?? current.owner,
      estimatedValue: input.estimatedValue ?? current.estimatedValue,
      probability: input.probability ?? current.probability,
      nextAction: input.nextAction ?? current.nextAction,
      nextActionAt: input.nextActionAt ?? current.nextActionAt,
      notes: input.notes ?? current.notes,
      consentStatus: input.consentStatus ?? current.consentStatus,
      allowedChannels: input.allowedChannels ?? current.allowedChannels,
    });
    requireUnchangedProject(
      validated.projectId ?? current.projectId,
      current.projectId,
    );
    const project = await projectScope(
      connection,
      validated.projectId ?? current.projectId,
    );
    const updatedAt = new Date().toISOString();
    await connection.execute(
      `UPDATE leads SET project_id = ?, tenant_id = ?, name = ?, company = ?,
       email = ?, phone = ?, source = ?, stage = ?, owner = ?, estimated_value = ?,
       probability = ?, next_action = ?, next_action_at = ?, notes = ?,
       consent_status = ?, allowed_channels_json = ?, updated_at = ?
       WHERE id = ? AND archived_at IS NULL`,
      [
        project.id,
        project.tenantId,
        validated.name,
        validated.company,
        validated.email,
        validated.phone,
        validated.source,
        validated.stage,
        validated.owner,
        validated.estimatedValue,
        validated.probability,
        validated.nextAction,
        validated.nextActionAt,
        validated.notes,
        validated.consentStatus,
        JSON.stringify(validated.allowedChannels),
        updatedAt,
        id,
      ],
    );
    if (validated.stage !== current.stage) {
      await connection.execute(
        `INSERT INTO activities
         (id, project_id, tenant_id, lead_id, activity_type, title, body, created_at)
         VALUES (?, ?, ?, ?, 'stage-change', ?, ?, ?)`,
        [
          randomUUID(),
          project.id,
          project.tenantId,
          id,
          "Pipeline stage updated",
          `${current.stage} → ${validated.stage}`,
          updatedAt,
        ],
      );
    }
    await audit(connection, {
      userId,
      projectId: project.id,
      tenantId: project.tenantId,
      entityType: "lead",
      entityId: id,
      action: "updated",
      details:
        validated.stage !== current.stage
          ? { fromStage: current.stage, toStage: validated.stage }
          : {},
    });
    return {
      id,
      ...validated,
      projectId: project.id,
      tenantId: project.tenantId,
      createdAt: current.createdAt,
      updatedAt,
      archivedAt: null,
    };
  });
}

export async function archiveLead(id: string, userId: string): Promise<void> {
  await withTransaction(async (connection) => {
    const current = await leadScope(connection, id);
    const archivedAt = new Date().toISOString();
    await connection.execute(
      "UPDATE leads SET archived_at = ?, updated_at = ? WHERE id = ? AND tenant_id = ?",
      [archivedAt, archivedAt, current.id, current.tenantId],
    );
    await connection.execute(
      "UPDATE calendar_events SET archived_at = ?, updated_at = ? WHERE lead_id = ? AND tenant_id = ? AND archived_at IS NULL",
      [archivedAt, archivedAt, current.id, current.tenantId],
    );
    await audit(connection, {
      userId,
      projectId: current.projectId,
      tenantId: current.tenantId,
      entityType: "lead",
      entityId: current.id,
      action: "archived",
    });
  });
}

export async function createActivity(
  input: ActivityInput,
  userId: string,
): Promise<Activity> {
  return withTransaction(async (connection) => {
    const lead = await leadScope(
      connection,
      requiredString(input.leadId, "lead identifier", 64),
    );
    const activityType = enumValue(
      input.activityType ?? "note",
      activityTypes,
      "activity type",
    );
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const activity: Activity = {
      id,
      projectId: lead.projectId,
      tenantId: lead.tenantId,
      leadId: lead.id,
      activityType,
      title: requiredString(input.title, "activity title", 300),
      body: nullableString(input.body, 6000),
      createdAt,
    };
    await connection.execute(
      `INSERT INTO activities
       (id, project_id, tenant_id, lead_id, activity_type, title, body, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        activity.id,
        activity.projectId,
        activity.tenantId,
        activity.leadId,
        activity.activityType,
        activity.title,
        activity.body,
        activity.createdAt,
      ],
    );
    await audit(connection, {
      userId,
      projectId: lead.projectId,
      tenantId: lead.tenantId,
      entityType: "activity",
      entityId: id,
      action: "created",
    });
    return activity;
  });
}

export async function createCalendarEvent(
  input: CalendarEventInput,
  userId: string,
): Promise<CalendarEvent> {
  const validated = validateCalendarInput(input);
  return withTransaction(async (connection) => {
    const project = await projectScope(connection, validated.projectId);
    if (validated.leadId !== null) {
      const lead = await leadScope(connection, validated.leadId);
      if (lead.projectId !== project.id || lead.tenantId !== project.tenantId) {
        throw new RepositoryError(
          "VALIDATION_ERROR",
          "Lead and project scopes do not match.",
          422,
        );
      }
    }
    const id = randomUUID();
    const now = new Date().toISOString();
    await connection.execute(
      `INSERT INTO calendar_events
       (id, project_id, tenant_id, lead_id, title, event_type, starts_at, ends_at,
        notes, created_at, updated_at, archived_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        id,
        project.id,
        project.tenantId,
        validated.leadId,
        validated.title,
        validated.eventType,
        validated.startsAt,
        validated.endsAt,
        validated.notes,
        now,
        now,
      ],
    );
    await audit(connection, {
      userId,
      projectId: project.id,
      tenantId: project.tenantId,
      entityType: "calendar-event",
      entityId: id,
      action: "created",
    });
    return {
      id,
      ...validated,
      tenantId: project.tenantId,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };
  });
}

export async function updateCalendarEvent(
  id: string,
  input: CalendarEventInput,
  userId: string,
): Promise<CalendarEvent> {
  return withTransaction(async (connection) => {
    const [rows] = await connection.execute<CalendarEventRow[]>(
      "SELECT * FROM calendar_events WHERE id = ? AND archived_at IS NULL LIMIT 1",
      [id],
    );
    const row = rows[0];
    if (row === undefined) {
      throw new RepositoryError("NOT_FOUND", "Calendar event not found.", 404);
    }
    const current = eventFromRow(row);
    const validated = validateCalendarInput(input, current);
    requireUnchangedProject(validated.projectId, current.projectId);
    const project = await projectScope(connection, validated.projectId);
    if (validated.leadId !== null) {
      const lead = await leadScope(connection, validated.leadId);
      if (lead.projectId !== project.id || lead.tenantId !== project.tenantId) {
        throw new RepositoryError(
          "VALIDATION_ERROR",
          "Lead and project scopes do not match.",
          422,
        );
      }
    }
    const updatedAt = new Date().toISOString();
    await connection.execute(
      `UPDATE calendar_events SET project_id = ?, tenant_id = ?, lead_id = ?,
       title = ?, event_type = ?, starts_at = ?, ends_at = ?, notes = ?, updated_at = ?
       WHERE id = ? AND archived_at IS NULL`,
      [
        project.id,
        project.tenantId,
        validated.leadId,
        validated.title,
        validated.eventType,
        validated.startsAt,
        validated.endsAt,
        validated.notes,
        updatedAt,
        id,
      ],
    );
    await audit(connection, {
      userId,
      projectId: project.id,
      tenantId: project.tenantId,
      entityType: "calendar-event",
      entityId: id,
      action: "updated",
    });
    return {
      id,
      ...validated,
      tenantId: project.tenantId,
      createdAt: current.createdAt,
      updatedAt,
      archivedAt: null,
    };
  });
}

export async function archiveCalendarEvent(
  id: string,
  userId: string,
): Promise<void> {
  await withTransaction(async (connection) => {
    const [rows] = await connection.execute<CalendarEventRow[]>(
      "SELECT * FROM calendar_events WHERE id = ? AND archived_at IS NULL LIMIT 1",
      [id],
    );
    const row = rows[0];
    if (row === undefined) {
      throw new RepositoryError("NOT_FOUND", "Calendar event not found.", 404);
    }
    const event = eventFromRow(row);
    const archivedAt = new Date().toISOString();
    await connection.execute(
      "UPDATE calendar_events SET archived_at = ?, updated_at = ? WHERE id = ? AND tenant_id = ?",
      [archivedAt, archivedAt, event.id, event.tenantId],
    );
    await audit(connection, {
      userId,
      projectId: event.projectId,
      tenantId: event.tenantId,
      entityType: "calendar-event",
      entityId: event.id,
      action: "archived",
    });
  });
}

import "server-only";

import { randomBytes, randomUUID } from "node:crypto";

import mysql, {
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";

import { hashPassword } from "@/server/auth/session";
import { ensureRuntimeEnvironment } from "@/server/config/runtime-environment";

import { inventorySeed } from "./inventory-seed";

let pool: Pool | undefined;
let schemaPromise: Promise<void> | undefined;

function requiredEnvironment(name: string): string {
  ensureRuntimeEnvironment();
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required server configuration: ${name}`);
  }
  return value;
}

export function getDatabasePool(): Pool {
  if (pool !== undefined) {
    return pool;
  }

  pool = mysql.createPool({
    host: requiredEnvironment("DB_HOST"),
    port: Number(process.env.DB_PORT ?? "3306"),
    database: requiredEnvironment("DB_NAME"),
    user: requiredEnvironment("DB_USER"),
    password: requiredEnvironment("DB_PASSWORD"),
    connectionLimit: 5,
    enableKeepAlive: true,
    charset: "utf8mb4",
    timezone: "Z",
  });

  return pool;
}

async function createTables(connection: PoolConnection): Promise<void> {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(120) NOT NULL UNIQUE,
      password_salt VARCHAR(128) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at VARCHAR(40) NOT NULL,
      updated_at VARCHAR(40) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(64) PRIMARY KEY,
      tenant_id VARCHAR(64) NOT NULL,
      slug VARCHAR(120) NOT NULL UNIQUE,
      name VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(40) NOT NULL,
      niche VARCHAR(200) NULL,
      city VARCHAR(200) NULL,
      stack_json JSON NOT NULL,
      local_path VARCHAR(500) NOT NULL,
      created_at VARCHAR(40) NOT NULL,
      updated_at VARCHAR(40) NOT NULL,
      archived_at VARCHAR(40) NULL,
      INDEX projects_tenant_idx (tenant_id),
      INDEX projects_archived_idx (archived_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS artifacts (
      id VARCHAR(64) PRIMARY KEY,
      project_id VARCHAR(64) NOT NULL,
      tenant_id VARCHAR(64) NOT NULL,
      type VARCHAR(40) NOT NULL,
      label VARCHAR(200) NOT NULL,
      local_path VARCHAR(500) NULL,
      public_url VARCHAR(1000) NULL,
      link_status VARCHAR(40) NOT NULL,
      is_canonical TINYINT(1) NOT NULL DEFAULT 0,
      notes TEXT NULL,
      created_at VARCHAR(40) NOT NULL,
      updated_at VARCHAR(40) NOT NULL,
      archived_at VARCHAR(40) NULL,
      CONSTRAINT artifacts_project_fk FOREIGN KEY (project_id) REFERENCES projects(id),
      INDEX artifacts_scope_idx (project_id, tenant_id),
      INDEX artifacts_archived_idx (archived_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS leads (
      id VARCHAR(64) PRIMARY KEY,
      project_id VARCHAR(64) NOT NULL,
      tenant_id VARCHAR(64) NOT NULL,
      name VARCHAR(200) NOT NULL,
      company VARCHAR(200) NULL,
      email VARCHAR(254) NULL,
      phone VARCHAR(80) NULL,
      source VARCHAR(200) NOT NULL,
      stage VARCHAR(40) NOT NULL,
      owner VARCHAR(160) NOT NULL,
      estimated_value DECIMAL(14,2) NOT NULL DEFAULT 0,
      probability INT NOT NULL DEFAULT 20,
      next_action VARCHAR(500) NULL,
      next_action_at VARCHAR(40) NULL,
      notes TEXT NULL,
      consent_status VARCHAR(40) NOT NULL,
      allowed_channels_json JSON NOT NULL,
      created_at VARCHAR(40) NOT NULL,
      updated_at VARCHAR(40) NOT NULL,
      archived_at VARCHAR(40) NULL,
      CONSTRAINT leads_project_fk FOREIGN KEY (project_id) REFERENCES projects(id),
      INDEX leads_scope_idx (project_id, tenant_id),
      INDEX leads_stage_idx (stage),
      INDEX leads_archived_idx (archived_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS activities (
      id VARCHAR(64) PRIMARY KEY,
      project_id VARCHAR(64) NOT NULL,
      tenant_id VARCHAR(64) NOT NULL,
      lead_id VARCHAR(64) NOT NULL,
      activity_type VARCHAR(40) NOT NULL,
      title VARCHAR(300) NOT NULL,
      body TEXT NULL,
      created_at VARCHAR(40) NOT NULL,
      CONSTRAINT activities_project_fk FOREIGN KEY (project_id) REFERENCES projects(id),
      CONSTRAINT activities_lead_fk FOREIGN KEY (lead_id) REFERENCES leads(id),
      INDEX activities_lead_idx (lead_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS calendar_events (
      id VARCHAR(64) PRIMARY KEY,
      project_id VARCHAR(64) NOT NULL,
      tenant_id VARCHAR(64) NOT NULL,
      lead_id VARCHAR(64) NULL,
      title VARCHAR(300) NOT NULL,
      event_type VARCHAR(40) NOT NULL,
      starts_at VARCHAR(40) NOT NULL,
      ends_at VARCHAR(40) NOT NULL,
      notes TEXT NULL,
      created_at VARCHAR(40) NOT NULL,
      updated_at VARCHAR(40) NOT NULL,
      archived_at VARCHAR(40) NULL,
      CONSTRAINT events_project_fk FOREIGN KEY (project_id) REFERENCES projects(id),
      CONSTRAINT events_lead_fk FOREIGN KEY (lead_id) REFERENCES leads(id),
      INDEX events_scope_idx (project_id, tenant_id),
      INDEX events_starts_idx (starts_at),
      INDEX events_archived_idx (archived_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS audit_events (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      project_id VARCHAR(64) NULL,
      tenant_id VARCHAR(64) NULL,
      entity_type VARCHAR(60) NOT NULL,
      entity_id VARCHAR(64) NOT NULL,
      action VARCHAR(80) NOT NULL,
      details_json JSON NOT NULL,
      created_at VARCHAR(40) NOT NULL,
      INDEX audit_entity_idx (entity_type, entity_id),
      INDEX audit_scope_idx (project_id, tenant_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  ];

  for (const statement of statements) {
    await connection.execute(statement);
  }
}

async function seedAdmin(connection: PoolConnection): Promise<void> {
  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM users",
  );
  if (Number(rows[0]?.total ?? 0) > 0) {
    return;
  }

  const username = process.env.INITIAL_ADMIN_USERNAME?.trim() || "roger";
  const password = requiredEnvironment("INITIAL_ADMIN_PASSWORD");
  const salt = randomBytes(24).toString("base64url");
  const passwordHash = await hashPassword(password, salt);
  const now = new Date().toISOString();

  await connection.execute<ResultSetHeader>(
    `INSERT INTO users
      (id, username, password_salt, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
    [randomUUID(), username, salt, passwordHash, now, now],
  );
}

async function seedInventory(connection: PoolConnection): Promise<void> {
  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM projects",
  );
  if (Number(rows[0]?.total ?? 0) > 0) {
    return;
  }

  const now = new Date().toISOString();

  for (const project of inventorySeed) {
    await connection.execute<ResultSetHeader>(
      `INSERT INTO projects
        (id, tenant_id, slug, name, description, status, niche, city, stack_json,
         local_path, created_at, updated_at, archived_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        project.id,
        project.tenantId,
        project.slug,
        project.name,
        project.description,
        project.status,
        project.niche,
        project.city,
        JSON.stringify(project.stack),
        project.localPath,
        now,
        now,
      ],
    );

    for (const artifact of project.artifacts) {
      await connection.execute<ResultSetHeader>(
        `INSERT INTO artifacts
          (id, project_id, tenant_id, type, label, local_path, public_url,
           link_status, is_canonical, notes, created_at, updated_at, archived_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        [
          artifact.id,
          project.id,
          project.tenantId,
          artifact.type,
          artifact.label,
          artifact.localPath,
          artifact.publicUrl,
          artifact.linkStatus,
          artifact.isCanonical ? 1 : 0,
          artifact.notes ?? null,
          now,
          now,
        ],
      );
    }
  }
}

async function initializeSchema(): Promise<void> {
  const connection = await getDatabasePool().getConnection();
  try {
    await connection.beginTransaction();
    await createTables(connection);
    await seedAdmin(connection);
    await seedInventory(connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function ensureDatabase(): Promise<void> {
  if (schemaPromise === undefined) {
    schemaPromise = initializeSchema().catch((error: unknown) => {
      schemaPromise = undefined;
      throw error;
    });
  }
  await schemaPromise;
}

export async function withTransaction<T>(
  operation: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  await ensureDatabase();
  const connection = await getDatabasePool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await operation(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getDatabaseCounts(): Promise<Record<string, number>> {
  await ensureDatabase();
  const tables = [
    "projects",
    "artifacts",
    "leads",
    "activities",
    "calendar_events",
    "audit_events",
  ] as const;
  const counts: Record<string, number> = {};

  for (const table of tables) {
    const [rows] = await getDatabasePool().query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM ${table}`,
    );
    counts[table] = Number(rows[0]?.total ?? 0);
  }

  return counts;
}

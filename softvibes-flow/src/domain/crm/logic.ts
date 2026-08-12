import {
  leadStages,
  type CalendarEvent,
  type ConsentStatus,
  type ContactChannel,
  type DashboardMetrics,
  type Lead,
  type LeadInput,
  type LeadStage,
  type ValidatedLeadInput,
} from "./types";

const contactChannels = ["email", "phone", "whatsapp", "instagram"] as const;
const consentStatuses = ["unknown", "opted-in", "not-required", "opted-out"] as const;
const closedStages: ReadonlySet<LeadStage> = new Set(["won", "lost"]);

export function isLeadStage(value: unknown): value is LeadStage {
  return typeof value === "string" && leadStages.includes(value as LeadStage);
}

function isConsentStatus(value: unknown): value is ConsentStatus {
  return (
    typeof value === "string" &&
    consentStatuses.includes(value as ConsentStatus)
  );
}

function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function exceedsLength(value: string | null, maximum: number): boolean {
  return value !== null && value.length > maximum;
}

export function validateLeadInput(input: LeadInput): ValidatedLeadInput {
  const name = normalizeNullableString(input.name);
  const projectId = normalizeNullableString(input.projectId);
  const company = normalizeNullableString(input.company);
  const email = normalizeNullableString(input.email)?.toLowerCase() ?? null;
  const phone = normalizeNullableString(input.phone);
  const source = normalizeNullableString(input.source) ?? "Manual";
  const owner = normalizeNullableString(input.owner) ?? "Roger";
  const probability = normalizeNumber(input.probability, 20);
  const estimatedValue = normalizeNumber(input.estimatedValue, 0);
  const nextAction = normalizeNullableString(input.nextAction);
  const nextActionAt = normalizeNullableString(input.nextActionAt);
  const notes = normalizeNullableString(input.notes);
  const errors: string[] = [];

  if (exceedsLength(projectId, 64)) {
    errors.push("projectId");
  }

  if (name === null || name.length > 200) {
    errors.push("name");
  }

  if (exceedsLength(company, 200)) {
    errors.push("company");
  }

  if (
    email !== null &&
    (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  ) {
    errors.push("email");
  }

  if (exceedsLength(phone, 80)) {
    errors.push("phone");
  }

  if (source.length > 200) {
    errors.push("source");
  }

  if (owner.length > 160) {
    errors.push("owner");
  }

  if (!Number.isInteger(probability) || probability < 0 || probability > 100) {
    errors.push("probability");
  }

  if (estimatedValue < 0 || estimatedValue > 999_999_999_999.99) {
    errors.push("estimatedValue");
  }

  if (exceedsLength(nextAction, 500)) {
    errors.push("nextAction");
  }

  if (
    nextActionAt !== null &&
    Number.isNaN(new Date(nextActionAt).getTime())
  ) {
    errors.push("nextActionAt");
  }

  if (exceedsLength(notes, 65_535)) {
    errors.push("notes");
  }

  if (input.stage !== undefined && !isLeadStage(input.stage)) {
    errors.push("stage");
  }

  if (
    input.consentStatus !== undefined &&
    !isConsentStatus(input.consentStatus)
  ) {
    errors.push("consentStatus");
  }

  const allowedChannels = Array.isArray(input.allowedChannels)
    ? input.allowedChannels.filter(
        (channel): channel is ContactChannel =>
          typeof channel === "string" &&
          contactChannels.includes(channel as ContactChannel),
      )
    : [];

  if (
    input.allowedChannels !== undefined &&
    (!Array.isArray(input.allowedChannels) ||
      input.allowedChannels.some(
        (channel) =>
          typeof channel !== "string" ||
          !contactChannels.includes(channel as ContactChannel),
      ))
  ) {
    errors.push("allowedChannels");
  }

  if (errors.length > 0) {
    throw new Error(`Lead validation failed: ${errors.join(", ")}`);
  }

  return {
    projectId,
    name: name ?? "",
    company,
    email,
    phone,
    source,
    stage: isLeadStage(input.stage) ? input.stage : "new",
    owner,
    estimatedValue,
    probability,
    nextAction,
    nextActionAt:
      nextActionAt === null ? null : new Date(nextActionAt).toISOString(),
    notes,
    consentStatus: isConsentStatus(input.consentStatus)
      ? input.consentStatus
      : "unknown",
    allowedChannels: [...new Set(allowedChannels)],
  };
}

export function calculateDashboardMetrics(
  leads: readonly Lead[],
  events: readonly CalendarEvent[],
  now = new Date(),
): DashboardMetrics {
  const activeLeads = leads.filter(
    (lead) => lead.archivedAt === null && !closedStages.has(lead.stage),
  );
  const upcomingLimit = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    activeLeads: activeLeads.length,
    newLeads: activeLeads.filter((lead) => lead.stage === "new").length,
    overdueFollowUps: activeLeads.filter(
      (lead) =>
        lead.nextActionAt !== null && new Date(lead.nextActionAt).getTime() < now.getTime(),
    ).length,
    upcomingEvents: events.filter((event) => {
      const start = new Date(event.startsAt);
      return (
        event.archivedAt === null &&
        start.getTime() >= now.getTime() &&
        start.getTime() <= upcomingLimit.getTime()
      );
    }).length,
    openPipelineValue: activeLeads.reduce(
      (total, lead) => total + lead.estimatedValue,
      0,
    ),
    wonValue: leads
      .filter((lead) => lead.archivedAt === null && lead.stage === "won")
      .reduce((total, lead) => total + lead.estimatedValue, 0),
  };
}

export function groupEventsByDay(
  events: readonly CalendarEvent[],
  timeZone: string,
): ReadonlyMap<string, readonly CalendarEvent[]> {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const groups = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const parts = formatter.formatToParts(new Date(event.startsAt));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const key = `${values.year}-${values.month}-${values.day}`;
    const current = groups.get(key) ?? [];
    current.push(event);
    groups.set(key, current);
  }

  return groups;
}

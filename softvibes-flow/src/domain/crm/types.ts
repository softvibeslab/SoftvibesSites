export const leadStages = [
  "new",
  "qualifying",
  "qualified",
  "contacted",
  "meeting",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;

export type LeadStage = (typeof leadStages)[number];
export type ProjectStatus =
  | "discovery"
  | "analysis"
  | "landing"
  | "review"
  | "live"
  | "paused";
export type ArtifactType =
  | "research"
  | "analysis"
  | "proposal"
  | "landing"
  | "links"
  | "cms"
  | "preview"
  | "deployment"
  | "redirect"
  | "variant";
export type LinkStatus = "declared" | "verified" | "unavailable" | "protected";
export type ConsentStatus = "unknown" | "opted-in" | "not-required" | "opted-out";
export type ContactChannel = "email" | "phone" | "whatsapp" | "instagram";
export type CalendarEventType =
  | "meeting"
  | "call"
  | "follow-up"
  | "delivery"
  | "review";

export interface Project {
  readonly id: string;
  readonly tenantId: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly status: ProjectStatus;
  readonly niche: string | null;
  readonly city: string | null;
  readonly stack: readonly string[];
  readonly localPath: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archivedAt: string | null;
}

export interface Artifact {
  readonly id: string;
  readonly projectId: string;
  readonly tenantId: string;
  readonly type: ArtifactType;
  readonly label: string;
  readonly localPath: string | null;
  readonly publicUrl: string | null;
  readonly linkStatus: LinkStatus;
  readonly isCanonical: boolean;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archivedAt: string | null;
}

export interface Lead {
  readonly id: string;
  readonly projectId: string;
  readonly tenantId: string;
  readonly name: string;
  readonly company: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly source: string;
  readonly stage: LeadStage;
  readonly owner: string;
  readonly estimatedValue: number;
  readonly probability: number;
  readonly nextAction: string | null;
  readonly nextActionAt: string | null;
  readonly notes: string | null;
  readonly consentStatus: ConsentStatus;
  readonly allowedChannels: readonly ContactChannel[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archivedAt: string | null;
}

export interface Activity {
  readonly id: string;
  readonly projectId: string;
  readonly tenantId: string;
  readonly leadId: string;
  readonly activityType: "note" | "call" | "email" | "meeting" | "stage-change";
  readonly title: string;
  readonly body: string | null;
  readonly createdAt: string;
}

export interface CalendarEvent {
  readonly id: string;
  readonly projectId: string;
  readonly tenantId: string;
  readonly leadId: string | null;
  readonly title: string;
  readonly eventType: CalendarEventType;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archivedAt: string | null;
}

export interface DashboardMetrics {
  readonly activeLeads: number;
  readonly newLeads: number;
  readonly overdueFollowUps: number;
  readonly upcomingEvents: number;
  readonly openPipelineValue: number;
  readonly wonValue: number;
}

export interface BootstrapData {
  readonly user: {
    readonly username: string;
  };
  readonly csrfToken: string;
  readonly projects: readonly Project[];
  readonly artifacts: readonly Artifact[];
  readonly leads: readonly Lead[];
  readonly activities: readonly Activity[];
  readonly events: readonly CalendarEvent[];
}

export interface LeadInput {
  readonly projectId?: unknown;
  readonly name?: unknown;
  readonly company?: unknown;
  readonly email?: unknown;
  readonly phone?: unknown;
  readonly source?: unknown;
  readonly stage?: unknown;
  readonly owner?: unknown;
  readonly estimatedValue?: unknown;
  readonly probability?: unknown;
  readonly nextAction?: unknown;
  readonly nextActionAt?: unknown;
  readonly notes?: unknown;
  readonly consentStatus?: unknown;
  readonly allowedChannels?: unknown;
}

export interface ValidatedLeadInput {
  readonly projectId: string | null;
  readonly name: string;
  readonly company: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly source: string;
  readonly stage: LeadStage;
  readonly owner: string;
  readonly estimatedValue: number;
  readonly probability: number;
  readonly nextAction: string | null;
  readonly nextActionAt: string | null;
  readonly notes: string | null;
  readonly consentStatus: ConsentStatus;
  readonly allowedChannels: readonly ContactChannel[];
}

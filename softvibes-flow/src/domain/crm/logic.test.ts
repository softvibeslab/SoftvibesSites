import { describe, expect, it } from "vitest";

import {
  calculateDashboardMetrics,
  groupEventsByDay,
  isLeadStage,
  validateLeadInput,
} from "./logic";
import type { CalendarEvent, Lead } from "./types";

const now = new Date("2026-07-29T18:00:00.000Z");

const leads: readonly Lead[] = [
  {
    id: "lead-new",
    projectId: "project-a",
    tenantId: "tenant-a",
    name: "Lead New",
    company: null,
    email: "new@example.com",
    phone: null,
    source: "Referral",
    stage: "new",
    owner: "Roger",
    estimatedValue: 12000,
    probability: 20,
    nextAction: "Review brief",
    nextActionAt: "2026-07-29T15:00:00.000Z",
    notes: null,
    consentStatus: "opted-in",
    allowedChannels: ["email"],
    createdAt: "2026-07-29T12:00:00.000Z",
    updatedAt: "2026-07-29T12:00:00.000Z",
    archivedAt: null,
  },
  {
    id: "lead-meeting",
    projectId: "project-a",
    tenantId: "tenant-a",
    name: "Lead Meeting",
    company: "Example",
    email: null,
    phone: null,
    source: "Website",
    stage: "meeting",
    owner: "Roger",
    estimatedValue: 8000,
    probability: 55,
    nextAction: "Run discovery call",
    nextActionAt: "2026-07-30T16:00:00.000Z",
    notes: null,
    consentStatus: "unknown",
    allowedChannels: [],
    createdAt: "2026-07-27T12:00:00.000Z",
    updatedAt: "2026-07-28T12:00:00.000Z",
    archivedAt: null,
  },
  {
    id: "lead-won",
    projectId: "project-a",
    tenantId: "tenant-a",
    name: "Lead Won",
    company: null,
    email: null,
    phone: null,
    source: "Existing client",
    stage: "won",
    owner: "Roger",
    estimatedValue: 5000,
    probability: 100,
    nextAction: null,
    nextActionAt: null,
    notes: null,
    consentStatus: "not-required",
    allowedChannels: [],
    createdAt: "2026-07-01T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
    archivedAt: null,
  },
];

describe("CRM domain logic", () => {
  it("validates lead stages without accepting arbitrary strings", () => {
    expect(isLeadStage("proposal")).toBe(true);
    expect(isLeadStage("anything")).toBe(false);
  });

  it("normalizes a valid lead input and rejects invalid email and probability values", () => {
    expect(
      validateLeadInput({
        name: "  Ana Example  ",
        email: "ANA@EXAMPLE.COM ",
        stage: "qualified",
        probability: 45,
        estimatedValue: 9000,
      }),
    ).toMatchObject({
      name: "Ana Example",
      email: "ana@example.com",
      stage: "qualified",
      probability: 45,
      estimatedValue: 9000,
    });

    expect(() =>
      validateLeadInput({
        name: "Ana",
        email: "not-an-email",
        probability: 101,
      }),
    ).toThrow("Lead validation failed");
  });

  it("rejects values that cannot be persisted safely", () => {
    expect(() =>
      validateLeadInput({
        name: "Ana",
        company: "x".repeat(201),
        phone: "1".repeat(81),
        probability: 20.5,
        nextActionAt: "not-a-date",
        allowedChannels: ["email", "carrier-pigeon"],
      }),
    ).toThrow("company, phone, probability, nextActionAt, allowedChannels");
  });

  it("calculates honest dashboard metrics from active lead data", () => {
    expect(calculateDashboardMetrics(leads, [], now)).toEqual({
      activeLeads: 2,
      newLeads: 1,
      overdueFollowUps: 1,
      upcomingEvents: 0,
      openPipelineValue: 20000,
      wonValue: 5000,
    });
  });

  it("groups events by browser-local calendar day key", () => {
    const events: readonly CalendarEvent[] = [
      {
        id: "event-1",
        projectId: "project-a",
        tenantId: "tenant-a",
        leadId: "lead-meeting",
        title: "Discovery",
        eventType: "meeting",
        startsAt: "2026-07-30T16:00:00.000Z",
        endsAt: "2026-07-30T17:00:00.000Z",
        notes: null,
        createdAt: "2026-07-29T12:00:00.000Z",
        updatedAt: "2026-07-29T12:00:00.000Z",
        archivedAt: null,
      },
    ];

    expect(groupEventsByDay(events, "UTC").get("2026-07-30")).toHaveLength(1);
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { BootstrapData } from "@/domain/crm";

import { CrmApp } from "./crm-app";

const bootstrapData: BootstrapData = {
  user: { username: "roger" },
  csrfToken: "csrf-test",
  projects: [
    {
      id: "project-a",
      tenantId: "tenant-a",
      slug: "project-a",
      name: "Project A",
      description: "Test project",
      status: "live",
      niche: "Services",
      city: "Cancún",
      stack: ["Next.js"],
      localPath: "project-a",
      createdAt: "2026-07-29T12:00:00.000Z",
      updatedAt: "2026-07-29T12:00:00.000Z",
      archivedAt: null,
    },
  ],
  artifacts: [
    {
      id: "artifact-a",
      projectId: "project-a",
      tenantId: "tenant-a",
      type: "landing",
      label: "Landing",
      localPath: "project-a/index.html",
      publicUrl: "https://example.com",
      linkStatus: "declared",
      isCanonical: true,
      notes: null,
      createdAt: "2026-07-29T12:00:00.000Z",
      updatedAt: "2026-07-29T12:00:00.000Z",
      archivedAt: null,
    },
  ],
  leads: [
    {
      id: "lead-a",
      projectId: "project-a",
      tenantId: "tenant-a",
      name: "Ana Lead",
      company: "Example",
      email: "ana@example.com",
      phone: null,
      source: "Website",
      stage: "qualified",
      owner: "Roger",
      estimatedValue: 12000,
      probability: 50,
      nextAction: "Schedule meeting",
      nextActionAt: "2026-07-30T15:00:00.000Z",
      notes: "Interested in a landing.",
      consentStatus: "opted-in",
      allowedChannels: ["email"],
      createdAt: "2026-07-29T12:00:00.000Z",
      updatedAt: "2026-07-29T12:00:00.000Z",
      archivedAt: null,
    },
  ],
  activities: [],
  events: [],
};

describe("CRM application", () => {
  it("shows a protected login before operational data is available", () => {
    render(<CrmApp />);

    expect(
      screen.getByRole("heading", { name: "Acceso a Softvibes Flow" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Usuario")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
  });

  it("renders honest dashboard metrics and project inventory", async () => {
    render(<CrmApp initialData={bootstrapData} />);

    expect(screen.getByText("1 proyecto")).toBeInTheDocument();
    expect(screen.getByText("$12,000")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Proyectos" }));
    expect(screen.getByRole("heading", { name: "Project A" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir Landing" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
  });

  it("opens lead detail and provides an accessible stage change", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, data: bootstrapData.leads[0] }),
      }),
    );
    render(<CrmApp initialData={bootstrapData} />);

    await userEvent.click(screen.getByRole("button", { name: "Leads" }));
    await userEvent.click(screen.getByRole("button", { name: /Ana Lead/ }));

    expect(
      screen.getByRole("heading", { name: "Ana Lead" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Etapa del lead")).toHaveValue("qualified");
    expect(screen.getByText("Interested in a landing.")).toBeInTheDocument();
  });

  it("opens the lead creation form from the primary action", async () => {
    render(<CrmApp initialData={bootstrapData} />);

    await userEvent.click(screen.getByRole("button", { name: "Nuevo lead" }));

    expect(
      screen.getByRole("heading", { name: "Crear lead" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre del lead")).toBeRequired();
    expect(screen.getByLabelText("Proyecto")).toHaveValue("project-a");
  });
});

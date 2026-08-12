import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { workflowFixtures, workflowScopes } from "@/domain/workflows";
import { OperatorWorkspace } from "./operator-workspace";

afterEach(cleanup);

function renderWorkspace() {
  return render(
    <OperatorWorkspace
      scopes={workflowScopes}
      workflows={workflowFixtures}
    />,
  );
}

describe("OperatorWorkspace", () => {
  it("shows preview context, accessible filters, and the first scoped workflow", () => {
    renderWorkspace();

    expect(
      screen.getByRole("heading", { level: 1, name: "Softvibes Flow" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Proyecto: MenuVibes")).toBeInTheDocument();
    expect(
      screen.getByText("Inquilino: MenuVibes — vista previa"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Vista previa · datos no operativos"),
    ).toBeInTheDocument();

    const scopeSelector = screen.getByRole("combobox", {
      name: "Proyecto y alcance",
    });
    expect(within(scopeSelector).getAllByRole("option")).toHaveLength(4);
    expect(
      screen.getByRole("searchbox", { name: "Buscar workflows" }),
    ).toBeInTheDocument();
    const statusFilter = screen.getByRole("combobox", {
      name: "Estado del workflow",
    });
    expect(within(statusFilter).getAllByRole("option")).toHaveLength(5);
    expect(screen.getByRole("status")).toHaveTextContent("3 workflows");
    expect(
      screen.getByRole("heading", {
        name: "Crear y publicar inquilino",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Generar y publicar un video corto en YouTube"),
    ).not.toBeInTheDocument();
  });

  it("updates the detail and selected state when a workflow is selected", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    const workflowControl = screen.getByRole("button", {
      name: /Gestionar secciones y productos del menú/,
    });
    await user.click(workflowControl);

    expect(workflowControl).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("heading", {
        name: "Gestionar secciones y productos del menú",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Administración del catálogo del menú para sus superficies públicas y de punto de venta.",
      ),
    ).toBeInTheDocument();
  });

  it("reconciles selection and resets the detail tab when filters hide the selected workflow", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(
      screen.getByRole("button", {
        name: /Gestionar secciones y productos del menú/,
      }),
    );
    await user.click(screen.getByRole("tab", { name: "Pasos" }));

    await user.type(
      screen.getByRole("searchbox", { name: "Buscar workflows" }),
      "pedidos",
    );

    const ordersWorkflowControl = screen.getByRole("button", {
      name: /Confirmar y operar pedidos/,
    });
    expect(ordersWorkflowControl).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("tab", { name: "Resumen" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.clear(
      screen.getByRole("searchbox", { name: "Buscar workflows" }),
    );

    expect(ordersWorkflowControl).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", {
        name: /Gestionar secciones y productos del menú/,
      }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("heading", { name: "Confirmar y operar pedidos" }),
    ).toBeInTheDocument();
  });

  it("combines query and lifecycle status with AND semantics and resets an empty state", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.type(
      screen.getByRole("searchbox", { name: "Buscar workflows" }),
      "pedidos",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Estado del workflow" }),
      "implemented",
    );

    expect(screen.getByRole("status")).toHaveTextContent("0 workflows");
    expect(
      screen.getByText("No hay workflows que coincidan con estos filtros."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));

    expect(screen.getByRole("status")).toHaveTextContent("3 workflows");
    expect(
      screen.getByRole("button", { name: /Confirmar y operar pedidos/ }),
    ).toBeInTheDocument();
  });

  it("clears filters and selection on scope change without leaking prior-scope records", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.type(
      screen.getByRole("searchbox", { name: "Buscar workflows" }),
      "pedidos",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Estado del workflow" }),
      "partial",
    );
    await user.click(
      screen.getByRole("button", { name: /Confirmar y operar pedidos/ }),
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Proyecto y alcance" }),
      "moneyprinter-v2-preview",
    );

    expect(
      screen.getByRole("searchbox", { name: "Buscar workflows" }),
    ).toHaveValue("");
    expect(
      screen.getByRole("combobox", { name: "Estado del workflow" }),
    ).toHaveValue("all");
    expect(screen.getByText("Proyecto: MoneyPrinterV2")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Generar y publicar un video corto en YouTube",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Confirmar y operar pedidos/ }),
    ).not.toBeInTheDocument();
  });

  it("discloses summary, ordered steps, evidence, and gaps through accessible selected tabs", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    const summaryTab = screen.getByRole("tab", { name: "Resumen" });
    expect(summaryTab).toHaveAttribute("aria-selected", "true");
    const summaryPanel = screen.getByRole("tabpanel", { name: "Resumen" });
    expect(summaryPanel).toHaveTextContent(
      "Incorporación del inquilino y publicación de su menú.",
    );
    expect(summaryPanel).toHaveTextContent(
      "EntradaDatos del inquilino y del menú",
    );
    expect(summaryPanel).toHaveTextContent(
      "SalidaMenú publicado y contexto del panel del inquilino",
    );
    expect(summaryPanel).toHaveTextContent("Ciclo de vidaImplementado");
    expect(summaryPanel).toHaveTextContent("Versión1.0.0 · Borrador");

    const stepsTab = screen.getByRole("tab", { name: "Pasos" });
    await user.click(stepsTab);
    expect(stepsTab).toHaveAttribute("aria-selected", "true");
    const stepsPanel = screen.getByRole("tabpanel", { name: "Pasos" });
    const orderedSteps = within(stepsPanel).getAllByRole("listitem");
    expect(within(stepsPanel).getByRole("list").tagName).toBe("OL");
    expect(orderedSteps).toHaveLength(3);
    expect(orderedSteps[0]).toHaveTextContent("Recibir datos del inquilino");
    expect(orderedSteps[1]).toHaveTextContent("Crear el inquilino");
    expect(orderedSteps[2]).toHaveTextContent("Publicar menú y panel");
    for (const workflowStep of orderedSteps) {
      expect(workflowStep).toHaveTextContent("Responsable: no disponible");
    }
    expect(stepsPanel).toHaveTextContent("Estado: listo");

    await user.click(screen.getByRole("tab", { name: "Evidencia" }));
    expect(
      screen.getByRole("tabpanel", { name: "Evidencia" }),
    ).toHaveTextContent("MenuVibes/whitelabel/dashboard.html");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Brechas" }));
    expect(screen.getByRole("tabpanel", { name: "Brechas" })).toHaveTextContent(
      "La creación no es transaccional.",
    );
  });

  it("keeps every tab linked to a persistent panel and hides only inactive panels", () => {
    renderWorkspace();

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(4);

    for (const tab of tabs) {
      const panelId = tab.getAttribute("aria-controls");
      expect(panelId).not.toBeNull();

      const panel = document.getElementById(panelId as string);
      expect(panel).not.toBeNull();
      expect(panel).toHaveAttribute("role", "tabpanel");
      expect(panel).toHaveAttribute("aria-labelledby", tab.id);

      if (tab.getAttribute("aria-selected") === "true") {
        expect(panel).not.toHaveAttribute("hidden");
        expect(panel).toBeVisible();
      } else {
        expect(panel).toHaveAttribute("hidden");
        expect(panel).not.toBeVisible();
      }
    }
  });

  it("supports keyboard navigation between detail tabs", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    const summaryTab = screen.getByRole("tab", { name: "Resumen" });
    const stepsTab = screen.getByRole("tab", { name: "Pasos" });
    summaryTab.focus();
    await user.keyboard("{ArrowRight}");

    expect(stepsTab).toHaveFocus();
    expect(stepsTab).toHaveAttribute("aria-selected", "true");
  });

  it("shows approval, external-action, runtime, and persistent read-only honesty", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Proyecto y alcance" }),
      "moneyprinter-v2-preview",
    );

    expect(screen.getByText("Acción externa: publicación")).toBeInTheDocument();
    expect(
      screen.getByText("Aprobación humana antes de publicar"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Datos operativos no disponibles en esta vista previa"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Solo lectura: esta vista no realiza contacto, publicaciones, despliegues, escrituras externas, comandos arbitrarios ni gestión de credenciales./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /^(Publicar ahora|Desplegar|Contactar|Ejecutar)$/i,
      }),
    ).not.toBeInTheDocument();
  });
});

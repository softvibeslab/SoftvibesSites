import { describe, expect, expectTypeOf, it } from "vitest";

import { workflowFixtures, workflowScopes } from "./fixtures";
import { getWorkflowById, selectWorkflows } from "./selectors";
import type {
  WorkflowDefinition,
  WorkflowFilters,
  WorkflowScope,
} from "./types";

const menuVibesScope = workflowScopes.find(
  (scope) => scope.id === "menuvibes-preview",
);
const menuVibesPrivateScope = workflowScopes.find(
  (scope) => scope.id === "menuvibes-private-preview",
);

if (!menuVibesScope) {
  throw new Error("Expected the MenuVibes preview scope fixture");
}

if (!menuVibesPrivateScope) {
  throw new Error("Expected the MenuVibes Private preview scope fixture");
}

type SearchableWorkflowField = keyof Pick<
  WorkflowDefinition,
  "name" | "summary" | "domain" | "input" | "output"
>;

function workflowWithSearchValue(
  field: SearchableWorkflowField,
): WorkflowDefinition {
  const baseWorkflow = workflowFixtures[0];

  return {
    ...baseWorkflow,
    id: `search-${field}`,
    name: "Nombre base",
    summary: "Resumen base",
    domain: "Dominio base",
    input: "Entrada base",
    output: "Salida base",
    [field]: "Órbita única",
  };
}

describe("selectWorkflows", () => {
  it("requires an explicit project and tenant scope", () => {
    expectTypeOf(selectWorkflows).parameters.toEqualTypeOf<
      [
        workflows: readonly WorkflowDefinition[],
        scope: WorkflowScope,
        filters?: WorkflowFilters,
      ]
    >();
  });

  it("returns only workflows in the exact project and tenant scope", () => {
    const selected = selectWorkflows(workflowFixtures, menuVibesScope);

    expect(selected).toHaveLength(3);
    expect(
      selected.every(
        (workflow) =>
          workflow.projectId === menuVibesScope.projectId &&
          workflow.tenantId === menuVibesScope.tenantId,
      ),
    ).toBe(true);

    expect(
      selectWorkflows(workflowFixtures, {
        ...menuVibesScope,
        tenantId: "moneyprinter-v2-preview",
      }),
    ).toEqual([]);
  });

  it("keeps prospecting in the separate MenuVibes Private scope", () => {
    expect(
      selectWorkflows(workflowFixtures, menuVibesPrivateScope).map(({ id }) => id),
    ).toEqual(["mv-prospect-to-demo"]);
    expect(
      getWorkflowById(
        workflowFixtures,
        menuVibesScope,
        "mv-prospect-to-demo",
      ),
    ).toBeUndefined();
  });

  it("matches case-insensitive and accent-insensitive queries across searchable fields", () => {
    const searchableFields: readonly SearchableWorkflowField[] = [
      "name",
      "summary",
      "domain",
      "input",
      "output",
    ];

    for (const field of searchableFields) {
      const workflow = workflowWithSearchValue(field);

      expect(
        selectWorkflows([workflow], menuVibesScope, {
          query: "ORBITA UNICA",
        }).map(({ id }) => id),
        `Expected the query to match the ${field} field`,
      ).toEqual([workflow.id]);
    }
  });

  it("combines query and lifecycle status with AND semantics", () => {
    expect(
      selectWorkflows(workflowFixtures, menuVibesScope, {
        query: "operar pedidos",
        lifecycleStatus: "partial",
      }).map(({ id }) => id),
    ).toEqual(["mv-order-operations"]);

    expect(
      selectWorkflows(workflowFixtures, menuVibesScope, {
        query: "operar pedidos",
        lifecycleStatus: "implemented",
      }),
    ).toEqual([]);
  });

  it("does not leak an out-of-scope workflow when the query matches", () => {
    const selected = selectWorkflows(workflowFixtures, menuVibesScope, {
      query: "youtube",
    });

    expect(selected).toEqual([]);
  });

  it("returns an honest empty array when nothing matches", () => {
    expect(
      selectWorkflows(workflowFixtures, menuVibesScope, {
        query: "resultado inexistente",
      }),
    ).toEqual([]);
  });
});

describe("MoneyPrinter fixture compliance", () => {
  it("uses the authoritative project ID and a consistent preview scope", () => {
    const scope = workflowScopes.find(
      ({ projectId }) => projectId === "moneyprinter-v2",
    );

    expect(scope).toMatchObject({
      id: "moneyprinter-v2-preview",
      projectId: "moneyprinter-v2",
      tenantId: "moneyprinter-v2-preview",
    });

    const workflows = workflowFixtures.filter(({ id }) => id.startsWith("mp-"));

    expect(workflows).toHaveLength(3);
    expect(
      workflows.every(
        ({ projectId, tenantId }) =>
          projectId === scope?.projectId && tenantId === scope.tenantId,
      ),
    ).toBe(true);
  });
});

describe("getWorkflowById", () => {
  it("returns a workflow only when its id and scope match", () => {
    expect(
      getWorkflowById(workflowFixtures, menuVibesScope, "mv-order-operations")
        ?.id,
    ).toBe("mv-order-operations");

    expect(
      getWorkflowById(workflowFixtures, menuVibesScope, "mp-youtube-short"),
    ).toBeUndefined();
  });
});

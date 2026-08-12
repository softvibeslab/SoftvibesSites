import { describe, expect, it } from "vitest";

import { workflowFixtures } from "./fixtures";

const authoritativeSources: Readonly<Record<string, readonly string[]>> = {
  "mv-tenant-onboarding": [
    "MenuVibes/whitelabel/dashboard.html",
    "MenuVibes/whitelabel/schema.sql",
  ],
  "mv-catalog-management": [
    "MenuVibes/whitelabel/dashboard.html",
    "MenuVibes/whitelabel/menu.html",
    "MenuVibes/whitelabel/schema.sql",
  ],
  "mv-order-operations": [
    "MenuVibes/whitelabel/mesero.html",
    "MenuVibes/whitelabel/pos.html",
    "MenuVibes/whitelabel/dashboard.html",
    "MenuVibes/whitelabel/schema.sql",
  ],
  "mv-prospect-to-demo": [
    "MenuVibes-private/prospectos/instagram_followers_apify.py",
    "MenuVibes-private/prospectos/vibeprospecting/build-demos-clusterA.py",
    "MenuVibes-private/prospectos/vibeprospecting/TRACKER-embudo.csv",
  ],
  "mp-youtube-short": [
    "MoneyPrinterV2/src/classes/YouTube.py",
    "MoneyPrinterV2/src/main.py",
    "MoneyPrinterV2/src/cron.py",
  ],
  "mp-cross-post": [
    "MoneyPrinterV2/src/classes/PostBridge.py",
    "MoneyPrinterV2/src/post_bridge_integration.py",
    "MoneyPrinterV2/tests/test_post_bridge_client.py",
  ],
  "mp-scheduler": [
    "MoneyPrinterV2/src/main.py",
    "MoneyPrinterV2/src/cron.py",
    "MoneyPrinterV2/scripts/upload_video.sh",
  ],
  "vivemar-editorial-build": [
    "vivemar/src/content.config.ts",
    "vivemar/src/content/propiedades",
    "vivemar/src/content/blog",
    "vivemar/src/pages/propiedades/[slug].astro",
  ],
  "vivemar-contact": ["vivemar/public/contact.php"],
};

const authoritativeProjectPaths: Readonly<Record<string, string>> = {
  menuvibes: "MenuVibes/",
  "menuvibes-private": "MenuVibes-private/",
  "moneyprinter-v2": "MoneyPrinterV2/",
  vivemar: "vivemar/",
};

describe("workflow fixture provenance", () => {
  it("uses non-self-referential repository paths under each authoritative project path", () => {
    for (const workflow of workflowFixtures) {
      const projectPath = authoritativeProjectPaths[workflow.projectId];

      expect(projectPath, `Expected a source path for ${workflow.projectId}`).toBeDefined();
      expect(workflow.evidence.map(({ reference }) => reference)).toEqual(
        authoritativeSources[workflow.id],
      );
      expect(workflow.evidence.length, `Expected evidence for ${workflow.id}`).toBeGreaterThan(0);
      expect(new Set(workflow.evidence.map(({ id }) => id)).size).toBe(
        workflow.evidence.length,
      );

      for (const evidence of workflow.evidence) {
        const sourceId = evidence.reference
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        expect(evidence.kind).toBe("repository-path");
        expect(evidence.reference).not.toBe(workflow.id);
        expect(evidence.reference.startsWith(projectPath ?? "")).toBe(true);
        expect(evidence.id).toBe(`${workflow.id}-source-${sourceId}`);
        expect(evidence.label).toBe(`Archivo fuente: ${evidence.reference}`);
      }
    }
  });
});

describe("external-action approval invariants", () => {
  it("classifies every workflow explicitly and gates each external action", () => {
    const externallyActingWorkflows = workflowFixtures.filter(
      ({ externalAction }) => externalAction !== "none",
    );

    expect(externallyActingWorkflows.map(({ id }) => id)).toEqual([
      "mv-prospect-to-demo",
      "mp-youtube-short",
      "mp-cross-post",
      "mp-scheduler",
    ]);

    for (const workflow of workflowFixtures) {
      expect(["none", "outreach", "publish"]).toContain(workflow.externalAction);

      if (workflow.externalAction === "none") {
        continue;
      }

      const expectedTiming =
        workflow.externalAction === "outreach" ? "before-outreach" : "before-publish";
      const matchingApprovals = workflow.approvals.filter(
        ({ requirement, timing }) =>
          requirement === "human-required" && timing === expectedTiming,
      );
      const approvalSteps = workflow.steps.filter(({ kind }) => kind === "approval");
      const externalOutputSteps = workflow.steps.filter(({ kind }) => kind === "output");
      const sequences = workflow.steps.map(({ sequence }) => sequence);

      expect(matchingApprovals, `Expected one matching approval for ${workflow.id}`).toHaveLength(1);
      expect(approvalSteps, `Expected one approval step for ${workflow.id}`).toHaveLength(1);
      expect(externalOutputSteps, `Expected an external output step for ${workflow.id}`).not.toHaveLength(0);
      expect(sequences.every((sequence) => sequence > 0)).toBe(true);
      expect(new Set(sequences).size).toBe(sequences.length);
      expect(sequences).toEqual([...sequences].sort((left, right) => left - right));

      const approvalSequence = approvalSteps[0]?.sequence ?? Number.POSITIVE_INFINITY;
      const firstExternalOutputSequence = Math.min(
        ...externalOutputSteps.map(({ sequence }) => sequence),
      );

      expect(approvalSequence).toBeLessThan(firstExternalOutputSequence);
    }
  });
});

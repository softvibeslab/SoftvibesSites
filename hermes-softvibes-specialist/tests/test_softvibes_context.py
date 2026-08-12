import importlib.util
import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "skills/operate-softvibes-sites/scripts/softvibes_context.py"
SPEC = importlib.util.spec_from_file_location("softvibes_context", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


class SoftvibesContextTests(unittest.TestCase):
    def test_registry_has_every_classified_root(self):
        data = MODULE.registry()
        ids = {item["id"] for item in data["projects"]}
        self.assertGreaterEqual(len(ids), 40)
        self.assertIn("astro-cms-template", ids)
        self.assertIn("ioushua-barragan", ids)
        self.assertIn("menuvibes", ids)
        self.assertIn("softvibes-flow", ids)
        workflow_families = set(MODULE.workflows()["families"])
        self.assertFalse({item["family"] for item in data["projects"]} - workflow_families)

    def test_inspection_selection_is_valid(self):
        item = MODULE.project_map()["valmadero"]
        value = MODULE.make_selection(item, "inspect", "")
        result = MODULE.validate_selection(value)
        self.assertTrue(result["ok"], result)

    def test_create_requires_identity_source_and_target(self):
        item = MODULE.project_map()["astro-cms-template"]
        value = MODULE.make_selection(item, "create", "")
        result = MODULE.validate_selection(value)
        self.assertFalse(result["ok"])
        joined = " ".join(result["errors"])
        self.assertIn("target_path", joined)
        self.assertIn("brand_name", joined)
        self.assertIn("evidence.sources", joined)

    def test_publish_needs_human_gates(self):
        item = MODULE.project_map()["emir24-fit"]
        value = MODULE.make_selection(item, "publish", "")
        value["identity"]["brand_name"] = "Emir24 Fit"
        value["evidence"]["sources"] = [{"url_or_path": "README.md", "kind": "project"}]
        result = MODULE.validate_selection(value)
        self.assertFalse(result["ok"])
        joined = " ".join(result["errors"])
        self.assertIn("approvals.deploy", joined)
        self.assertIn("HTTPS", joined)

    def test_secret_values_are_rejected(self):
        item = MODULE.project_map()["valmadero"]
        value = MODULE.make_selection(item, "inspect", "")
        value["cms_password"] = "plaintext"
        result = MODULE.validate_selection(value)
        self.assertFalse(result["ok"])
        self.assertIn("valores secretos", " ".join(result["errors"]))

    def test_audit_detects_vivemar_leakage(self):
        with tempfile.TemporaryDirectory() as temp:
            project = Path(temp)
            (project / "README.md").write_text("# Otro cliente\nSitio Vive Mar de Viridiana", encoding="utf-8")
            args = type("Args", (), {"path": str(project), "project": "blooming-skincare"})()
            output = io.StringIO()
            with redirect_stdout(output):
                status = MODULE.command_audit(args)
            report = json.loads(output.getvalue())
            self.assertEqual(status, 1)
            self.assertTrue(report["leakage"], report)
            self.assertIn("README.md", report["leakage"]["vivemar"]["files"])

    def test_schema_and_examples_are_valid_json(self):
        refs = ROOT / "skills/operate-softvibes-sites/references"
        for name in (
            "project-registry.json", "workflow-catalog.json", "variable-schema.json",
            "selection.example.json", "growth-handoff.schema.json", "growth-handoff.example.json",
        ):
            with self.subTest(name=name):
                json.loads((refs / name).read_text(encoding="utf-8"))
        envato_refs = ROOT / "skills/explore-envato-templates/references"
        for name in ("envato-template-review.schema.json", "envato-template-review.example.json"):
            with self.subTest(name=name):
                json.loads((envato_refs / name).read_text(encoding="utf-8"))

    def test_envato_review_validates_and_pending_blocks_gate(self):
        refs = ROOT / "skills/explore-envato-templates/references"
        review = json.loads((refs / "envato-template-review.example.json").read_text(encoding="utf-8"))
        self.assertTrue(MODULE.validate_design_review(review)["ok"])
        review["decision"].update({
            "status": "pending",
            "mode": "visual-reference",
            "selected_candidate_ids": [],
            "mix_plan": [],
        })
        self.assertTrue(MODULE.validate_design_review(review)["ok"])
        gated = MODULE.validate_design_review(review, require_decision=True)
        self.assertFalse(gated["ok"])
        self.assertIn("sigue pending", " ".join(gated["errors"]))

    def test_envato_review_requires_multiple_comparable_candidates(self):
        refs = ROOT / "skills/explore-envato-templates/references"
        review = json.loads((refs / "envato-template-review.example.json").read_text(encoding="utf-8"))
        review["candidates"] = review["candidates"][:2]
        review["shortlist"] = review["shortlist"][:2]
        result = MODULE.validate_design_review(review)
        self.assertFalse(result["ok"])
        self.assertIn("al menos 3 plantillas", " ".join(result["errors"]))

    def test_envato_licensed_source_requires_authorization_and_license_record(self):
        refs = ROOT / "skills/explore-envato-templates/references"
        review = json.loads((refs / "envato-template-review.example.json").read_text(encoding="utf-8"))
        review["decision"]["mode"] = "licensed-source"
        blocked = MODULE.validate_design_review(review, require_decision=True)
        self.assertFalse(blocked["ok"])
        self.assertIn("download_authorized=true", " ".join(blocked["errors"]))
        review["licensing"] = {
            "preview_only": False,
            "download_authorized": True,
            "license_records": [{
                "candidate_id": "ejemplo-clasico",
                "project_name": "Marca de ejemplo",
                "certificate_path": "licenses/ejemplo-clasico.pdf",
            }],
        }
        self.assertTrue(MODULE.validate_design_review(review, require_decision=True)["ok"])

    def test_from_handoff_requires_decided_review_for_create(self):
        refs = ROOT / "skills/operate-softvibes-sites/references"
        handoff_path = refs / "growth-handoff.example.json"
        with tempfile.TemporaryDirectory() as temp:
            args = type("Args", (), {
                "file": str(handoff_path),
                "design_review": None,
                "output": str(Path(temp) / "selection.json"),
                "force": False,
            })()
            output = io.StringIO()
            with redirect_stdout(output):
                status = MODULE.command_from_handoff(args)
            report = json.loads(output.getvalue())
            self.assertEqual(status, 1)
            self.assertIn("requiere --design-review", " ".join(report["errors"]))

    def test_growth_handoff_is_valid_and_imports_without_authority(self):
        refs = ROOT / "skills/operate-softvibes-sites/references"
        handoff = json.loads((refs / "growth-handoff.example.json").read_text(encoding="utf-8"))
        envato_refs = ROOT / "skills/explore-envato-templates/references"
        design_review = json.loads((envato_refs / "envato-template-review.example.json").read_text(encoding="utf-8"))
        design_review["subject"].update({
            "brand_name": handoff["client"]["brand_name"],
            "vertical": handoff["client"]["vertical"],
            "primary_conversion": handoff["request"]["primary_conversion"],
        })
        result = MODULE.validate_growth_handoff(handoff)
        self.assertTrue(result["ok"], result)
        selection = MODULE.selection_from_handoff(handoff, design_review)
        self.assertEqual(selection["selection"]["project_id"], "astro-cms-template")
        self.assertTrue(all(value is False for value in selection["approvals"].values()))
        self.assertEqual(selection["acceptance"]["commands"], [])
        self.assertIn("claim:claim-message", selection["evidence"]["unverified_fields"])
        self.assertEqual(selection["design_reference"]["decision_status"], "selected")
        self.assertTrue(MODULE.validate_selection(selection)["ok"])

    def test_growth_handoff_rejects_unknown_project_and_dangling_source(self):
        refs = ROOT / "skills/operate-softvibes-sites/references"
        handoff = json.loads((refs / "growth-handoff.example.json").read_text(encoding="utf-8"))
        handoff["client"]["project_id"] = "proyecto-inexistente"
        handoff["evidence"]["claims"][0]["source_ids"] = ["source-inexistente"]
        result = MODULE.validate_growth_handoff(handoff)
        self.assertFalse(result["ok"])
        joined = " ".join(result["errors"])
        self.assertIn("project_id desconocido", joined)
        self.assertIn("sources inexistentes", joined)

    def test_growth_handoff_cannot_transport_approvals_or_secrets(self):
        refs = ROOT / "skills/operate-softvibes-sites/references"
        handoff = json.loads((refs / "growth-handoff.example.json").read_text(encoding="utf-8"))
        handoff["approvals"] = {"deploy": True}
        handoff["api_key"] = "plaintext-secret"
        result = MODULE.validate_growth_handoff(handoff)
        self.assertFalse(result["ok"])
        joined = " ".join(result["errors"])
        self.assertIn("no puede transportar approvals", joined)
        self.assertIn("valores secretos", joined)

    def test_growth_handoff_rejects_unsafe_target_path(self):
        refs = ROOT / "skills/operate-softvibes-sites/references"
        handoff = json.loads((refs / "growth-handoff.example.json").read_text(encoding="utf-8"))
        handoff["delivery"]["target_path"] = "../../otro-workspace"
        result = MODULE.validate_growth_handoff(handoff)
        self.assertFalse(result["ok"])
        self.assertIn("relativo al workspace", " ".join(result["errors"]))

    def test_inventory_seed_parser_extracts_project_paths(self):
        with tempfile.TemporaryDirectory() as temp:
            workspace = Path(temp)
            target = workspace / "softvibes-flow/src/server/db"
            target.mkdir(parents=True)
            (target / "inventory-seed.ts").write_text(
                'export const inventorySeed = [\n'
                '  {\n    id: "example",\n    localPath: "example-site",\n    artifacts: [],\n  },\n'
                '];\n',
                encoding="utf-8",
            )
            self.assertEqual(
                MODULE.parse_inventory_seed(workspace),
                [{"id": "example", "local_path": "example-site"}],
            )


if __name__ == "__main__":
    unittest.main()

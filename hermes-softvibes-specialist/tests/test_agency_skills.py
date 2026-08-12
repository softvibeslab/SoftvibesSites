"""Valida las skills adaptadas desde agency-agents.

Comprueba que cada SKILL.md tiene frontmatter válido, que el nombre
coincide con su directorio y que los playbooks fuente citados existen
en la biblioteca agency-agents.
"""
import json
import os
import re
import unittest

PKG_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKILLS_DIR = os.path.join(PKG_ROOT, "skills")
AGENCY_ROOT = os.environ.get(
    "AGENCY_AGENTS_ROOT",
    "/Users/rogergv/Documents/SoftvibesLab/LandingVibes/agency-agents",
)

ADAPTED_SKILLS = [
    "agency-playbooks",
    "auditoria-seo",
    "paid-media-tracking",
    "ofertas-y-outbound",
    "propuestas-comerciales",
    "diseno-landing-ux",
    "qa-evidencia",
    "soporte-clientes",
]

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
SOURCE_RE = re.compile(r"`((?:academic|design|engineering|finance|game-development|gis|marketing|paid-media|product|project-management|sales|security|spatial-computing|specialized|strategy|support|testing)/[\w.-]+\.md)`")


def read_skill(skill):
    path = os.path.join(SKILLS_DIR, skill, "SKILL.md")
    with open(path, encoding="utf-8") as fh:
        return fh.read()


class TestAgencySkills(unittest.TestCase):
    def test_skill_dirs_exist(self):
        for skill in ADAPTED_SKILLS:
            self.assertTrue(
                os.path.isfile(os.path.join(SKILLS_DIR, skill, "SKILL.md")),
                f"Falta SKILL.md en {skill}",
            )

    def test_frontmatter_valid(self):
        for skill in ADAPTED_SKILLS:
            text = read_skill(skill)
            m = FRONTMATTER_RE.match(text)
            self.assertIsNotNone(m, f"{skill}: sin frontmatter")
            fm = m.group(1)
            name = re.search(r"^name:\s*(\S+)", fm, re.MULTILINE)
            self.assertIsNotNone(name, f"{skill}: sin campo name")
            self.assertEqual(name.group(1), skill, f"{skill}: name no coincide con el directorio")
            self.assertIn("description:", fm, f"{skill}: sin description")

    def test_cited_sources_exist(self):
        if not os.path.isdir(AGENCY_ROOT):
            self.skipTest(f"Biblioteca agency-agents no disponible en {AGENCY_ROOT}")
        for skill in ADAPTED_SKILLS:
            if skill == "agency-playbooks":
                continue
            text = read_skill(skill)
            sources = SOURCE_RE.findall(text)
            self.assertTrue(sources, f"{skill}: no cita ningún playbook fuente")
            for src in sources:
                self.assertTrue(
                    os.path.isfile(os.path.join(AGENCY_ROOT, src)),
                    f"{skill}: fuente citada no existe: {src}",
                )

    def test_agency_index_consistent(self):
        index_path = os.path.join(SKILLS_DIR, "agency-playbooks", "references", "agency-index.json")
        self.assertTrue(os.path.isfile(index_path), "Falta agency-index.json")
        index = json.load(open(index_path, encoding="utf-8"))
        self.assertEqual(index["agent_count"], len(index["agents"]))
        self.assertGreater(index["agent_count"], 200)


if __name__ == "__main__":
    unittest.main()

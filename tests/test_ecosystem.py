import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest
import zipfile

SPEC = importlib.util.spec_from_file_location('ecosystem', Path(__file__).resolve().parents[1] / 'scripts/ecosystem.py')
eco = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(eco)


class EcosystemTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.base = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def test_manifest_catalog_and_profiles(self):
        self.assertGreater(len(eco.verify()), 1000)
        web = {e['name'] for e in eco.select('web')}
        self.assertTrue({'landing-inventory-first', 'ui-design', 'a11y-audit', 'softvibes-web-workflow'} <= web)
        self.assertGreater(len(eco.select('all')), len(web))

    def test_install_repeat_move_and_resources(self):
        project = self.base / 'project'
        eco.init(project)
        first = eco.install(project, 'web')
        self.assertEqual(first['created'], first['skills'])
        self.assertEqual(eco.install(project, 'web')['created'], 0)
        self.assertEqual(json.loads((project / 'catalog.json').read_text()), [])
        moved = self.base / 'moved'
        project.rename(moved)
        for e in eco.select('web'):
            link = moved / '.agents/skills' / e['name']
            self.assertTrue(link.is_symlink())
            self.assertTrue((link / 'SKILL.md').is_file())
            self.assertEqual(eco.digest(link / 'SKILL.md'), e['sha256'])
        self.assertTrue((moved / '.agents/skills/ui-design/references').is_dir())

    def test_conflict_is_detected_before_changes(self):
        project = self.base / 'project'
        occupied = project / '.agents/skills/ui-design'
        occupied.mkdir(parents=True)
        (occupied / 'KEEP').write_text('existing work')
        with self.assertRaisesRegex(ValueError, 'No se sobrescriben'):
            eco.install(project, 'web')
        self.assertEqual((occupied / 'KEEP').read_text(), 'existing work')
        self.assertFalse((project / '.agents/.softvibes-ecosystem').exists())
        self.assertEqual(len(list(occupied.parent.iterdir())), 1)

    def test_all_profile_has_resolvable_unique_links(self):
        project = self.base / 'all'
        result = eco.install(project, 'all')
        links = list((project / '.agents/skills').iterdir())
        self.assertEqual(result['skills'], len(links))
        self.assertTrue(all((p / 'SKILL.md').is_file() for p in links))

    def test_reproducible_archive_has_no_git_or_env(self):
        a = self.base / 'a.zip'
        b = self.base / 'b.zip'
        self.assertEqual(eco.pack(a)['sha256'], eco.pack(b)['sha256'])
        with zipfile.ZipFile(a) as archive:
            self.assertIsNone(archive.testzip())
            paths = [Path(n) for n in archive.namelist()]
            self.assertFalse(any('.git' in p.parts or p.name == '.env' for p in paths))
            archive.extractall(self.base / 'unpacked')
        self.assertEqual(len(eco.verify(self.base / 'unpacked/softvibes-ecosistema')), len(eco.verify()))
        with self.assertRaises(ValueError):
            eco.pack(a)

    def test_tamper_and_forbidden_environment_are_rejected(self):
        eco.install(self.base / 'project', 'web')
        snapshot = next((self.base / 'project/.agents/.softvibes-ecosystem').iterdir())
        readme = snapshot / 'README.md'
        original = readme.read_bytes()
        readme.write_text('tampered')
        with self.assertRaisesRegex(ValueError, 'Integridad'):
            eco.verify(snapshot)
        readme.write_bytes(original)
        (snapshot / '.env').write_text('DUMMY=value')
        with self.assertRaises(ValueError):
            eco.verify(snapshot)

    def test_symlink_destination_and_nonempty_init_rejected(self):
        project = self.base / 'project'
        project.mkdir()
        other = self.base / 'other'
        other.mkdir()
        (project / '.agents').symlink_to(other, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'Destino no válido'):
            eco.install(project, 'web')
        with self.assertRaises(ValueError):
            eco.init(project)
        self.assertEqual(list(other.iterdir()), [])

    def test_path_traversal_rejected(self):
        for name in ['../outside', '/absolute', 'a/../../b', 'a\\b']:
            with self.assertRaises(ValueError):
                eco.safe_relative(name)
        with self.assertRaises(ValueError):
            eco.outside_package(eco.ROOT / 'child', eco.ROOT)


if __name__ == '__main__':
    unittest.main()

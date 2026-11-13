import importlib.util
from pathlib import Path
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('preparar_perfil', HERE.parent / 'preparar_perfil.py')
prep = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prep)


class FakeHermes:
    """Simula `hermes profile create` sin tocar ~/.hermes."""

    def __init__(self, root):
        self.root = Path(root)
        self.calls = []

    def __call__(self, binary, arguments, env):
        self.calls.append(arguments)
        if arguments[:2] == ['profile', 'create']:
            profile = self.root / 'profiles' / arguments[2]
            profile.mkdir(parents=True)
            (profile / 'SOUL.md').write_text('plantilla genérica', encoding='utf-8')


class PrepararPerfilTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.env = {'HERMES_HOME': self.tmp.name, 'HERMES_BIN': '/bin/true'}

    def tearDown(self):
        self.tmp.cleanup()

    def test_vista_previa_no_crea_nada(self):
        report = prep.install(self.env, apply=False)
        self.assertFalse(report['apply'])
        self.assertTrue(report['create'])
        self.assertFalse((Path(self.tmp.name) / 'profiles').exists())

    def test_instala_soul_skill_y_cwd(self):
        fake = FakeHermes(self.tmp.name)
        report = prep.install(self.env, apply=True, runner=fake)
        profile = Path(self.tmp.name) / 'profiles' / prep.PROFILE
        self.assertIn('Detailbox Arquitecto', (profile / 'SOUL.md').read_text(encoding='utf-8'))
        self.assertTrue((profile / 'skills' / 'detailbox-arquitectura' / 'SKILL.md').is_file())
        self.assertEqual((profile / 'SOUL.hermes-default.md').read_text(encoding='utf-8'), 'plantilla genérica')
        self.assertIn(['--profile', prep.PROFILE, 'config', 'set', 'terminal.cwd', report['repo']], fake.calls)
        self.assertFalse(report['gateway_started'])

    def test_no_sobrescribe_soul_existente(self):
        profile = Path(self.tmp.name) / 'profiles' / prep.PROFILE
        profile.mkdir(parents=True)
        (profile / 'SOUL.md').write_text('editado a mano', encoding='utf-8')
        fake = FakeHermes(self.tmp.name)
        report = prep.install(self.env, apply=True, runner=fake)
        self.assertEqual((profile / 'SOUL.md').read_text(encoding='utf-8'), 'editado a mano')
        self.assertIn('SOUL.md', report['preserved'])
        self.assertEqual(fake.calls, [])  # perfil existente: ni create ni cwd

    def test_repo_invalido_falla(self):
        with self.assertRaises(RuntimeError):
            prep.install({**self.env, 'DETAILBOX_REPO_PATH': self.tmp.name}, apply=False)


if __name__ == '__main__':
    unittest.main()

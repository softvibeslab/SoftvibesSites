import os
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import app as workshop  # noqa: E402
from werkzeug.security import generate_password_hash  # noqa: E402


class FakeCopilot:
    def __init__(self, configured=True):
        self.configured, self.calls = configured, []

    def status(self):
        return {'configured': self.configured}

    def respond(self, instructions, messages):
        self.calls.append((instructions, messages))
        return 'Respuesta de prueba'


class WorkshopTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.copilot = FakeCopilot()
        self.app = workshop.create_app({'DATA_DIR': self.tmp.name, 'COPILOT_PROVIDER': self.copilot,
                                        'PUBLIC_URL': 'https://workshop.example'})
        with workshop.connect(os.path.join(self.tmp.name, 'workshop.db')) as db:
            db.execute("INSERT INTO usuarios (email, nombre, rol, password, creado) VALUES ('admin@x.mx', 'Admin', 'admin', ?, 'now')",
                       (generate_password_hash('admin-pass-123'),))

    def tearDown(self):
        self.tmp.cleanup()

    def client(self, email=None, password=None):
        client = self.app.test_client()
        client.csrf = None
        if email:
            response = client.post('/api/auth/login', json={'email': email, 'password': password})
            self.assertEqual(response.status_code, 200, response.get_json())
            client.csrf = response.get_json()['csrf']
        return client

    def send(self, client, method, url, **kwargs):
        headers = {'X-CSRF-Token': client.csrf} if client.csrf else {}
        return getattr(client, method)(url, headers=headers, **kwargs)

    def admin(self):
        return self.client('admin@x.mx', 'admin-pass-123')

    def create_workshop(self, admin):
        response = self.send(admin, 'post', '/api/cms/talleres', json={'nombre': 'Workshop PAD CDMX', 'fecha': '2026-12-05'})
        self.assertEqual(response.status_code, 201)
        return response.get_json()['talleres'][0]

    def register(self, code, email='ana@taller.mx'):
        client = self.app.test_client()
        response = client.post('/api/registro', json={'codigo': code, 'nombre': 'Ana', 'negocio': 'Brillo Ana',
                                                      'email': email, 'password': 'clave-segura-1', 'acepta': True})
        client.csrf = (response.get_json() or {}).get('csrf')
        return client, response

    def test_registro_por_qr_crea_alumno_y_sesion(self):
        workshop_row = self.create_workshop(self.admin())
        self.assertTrue(workshop_row['url_registro'].startswith('https://workshop.example/registro/?c='))
        info = self.app.test_client().get(f"/api/registro/{workshop_row['codigo']}")
        self.assertEqual(info.get_json()['taller']['nombre'], 'Workshop PAD CDMX')
        student, response = self.register(workshop_row['codigo'])
        self.assertEqual(response.status_code, 201)
        me = student.get('/api/auth/me').get_json()['user']
        self.assertEqual((me['rol'], me['negocio']), ('alumno', 'Brillo Ana'))
        inicio = student.get('/api/workbook').get_json()['workbook']['inicio']
        self.assertEqual(inicio['fecha_inicio'], '2026-12-05')

    def test_qr_svg_y_codigo_cerrado(self):
        admin = self.admin()
        row = self.create_workshop(admin)
        svg = admin.get(f"/api/cms/talleres/{row['id']}/qr.svg")
        self.assertEqual(svg.mimetype, 'image/svg+xml')
        self.assertIn(b'<svg', svg.data)
        self.send(admin, 'patch', f"/api/cms/talleres/{row['id']}", json={'registro_abierto': False})
        _, response = self.register(row['codigo'])
        self.assertEqual(response.status_code, 404)

    def test_regenerar_codigo_invalida_el_anterior(self):
        admin = self.admin()
        row = self.create_workshop(admin)
        new = self.send(admin, 'post', f"/api/cms/talleres/{row['id']}/codigo").get_json()['talleres'][0]['codigo']
        self.assertNotEqual(new, row['codigo'])
        self.assertEqual(self.register(row['codigo'])[1].status_code, 404)
        self.assertEqual(self.register(new)[1].status_code, 201)

    def test_csrf_y_roles(self):
        row = self.create_workshop(self.admin())
        student, _ = self.register(row['codigo'])
        self.assertEqual(student.put('/api/workbook/diagnostico', json={'datos': {}}).status_code, 403)
        self.assertEqual(student.get('/api/cms/usuarios').status_code, 403)
        self.assertEqual(self.app.test_client().get('/api/workbook').status_code, 401)

    def test_aislamiento_entre_alumnos(self):
        row = self.create_workshop(self.admin())
        ana, _ = self.register(row['codigo'], 'ana@taller.mx')
        beto, _ = self.register(row['codigo'], 'beto@taller.mx')
        self.send(ana, 'put', '/api/workbook/propuesta_valor', json={'datos': {'tipo_cliente': 'flotillas'}})
        self.assertNotIn('propuesta_valor', beto.get('/api/workbook').get_json()['workbook'])
        upload = self.send(ana, 'post', '/api/evidencias', data={'herramienta': 'plan30', 'archivo': (tempfile.SpooledTemporaryFile(), 'x.png')})
        self.assertEqual(upload.status_code, 400)  # archivo vacío/no válido
        png = b'\x89PNG\r\n\x1a\n' + b'0' * 64
        import io
        ok = self.send(ana, 'post', '/api/evidencias', data={'herramienta': 'plan30', 'archivo': (io.BytesIO(png), 'antes.png')},
                       content_type='multipart/form-data')
        self.assertEqual(ok.status_code, 201)
        evidence_id = ok.get_json()['evidencias'][0]['id']
        self.assertEqual(ana.get(f'/api/evidencias/{evidence_id}/archivo').status_code, 200)
        self.assertEqual(beto.get(f'/api/evidencias/{evidence_id}/archivo').status_code, 404)

    def test_progreso_e_historial(self):
        row = self.create_workshop(self.admin())
        ana, _ = self.register(row['codigo'])
        areas = {a['id']: {'calificacion': 3} for a in workshop.DEFAULT_CONTENT['diagnostico_areas']}
        first = self.send(ana, 'put', '/api/workbook/diagnostico', json={'datos': {'areas': areas, 'prioridades': ['a', 'b']}})
        self.assertEqual(first.get_json()['progreso']['herramientas']['diagnostico'], 'en_proceso')
        second = self.send(ana, 'put', '/api/workbook/diagnostico', json={'datos': {'areas': areas, 'prioridades': ['a', 'b', 'c']}})
        summary = second.get_json()['progreso']
        self.assertEqual(summary['herramientas']['diagnostico'], 'completado')
        self.assertGreater(summary['porcentaje'], 0)
        history = ana.get('/api/workbook/diagnostico/historial').get_json()['versiones']
        self.assertEqual(history[0]['datos']['prioridades'], ['a', 'b'])

    def test_margen_de_paquetes(self):
        numbers = workshop.progress.package_numbers({'materiales': '300', 'mano_obra': 400, 'traslados': '', 'otros': '100', 'precio': '1,600'})
        self.assertEqual(numbers, {'costo_total': 800.0, 'utilidad': 800.0, 'margen': 50.0})

    def test_copiloto_recibe_contexto_y_guarda_conversacion(self):
        row = self.create_workshop(self.admin())
        ana, _ = self.register(row['codigo'])
        self.send(ana, 'put', '/api/workbook/paquetes', json={'datos': {'paquetes': [{'nombre': 'Esencial', 'precio': '1000', 'materiales': '250'}]}})
        response = self.send(ana, 'post', '/api/copiloto', json={'acceso': 'paquetes'})
        self.assertEqual(response.status_code, 200)
        instructions, messages = self.copilot.calls[-1]
        self.assertIn('Brillo Ana', instructions)
        self.assertIn('margen 75.0%', instructions)
        self.assertIn('No inventes costos', messages[-1]['content'])
        self.assertEqual(len(ana.get('/api/copiloto').get_json()['mensajes']), 2)

    def test_copiloto_desconectado_ofrece_alternativa(self):
        self.copilot.configured = False
        row = self.create_workshop(self.admin())
        ana, _ = self.register(row['codigo'])
        response = self.send(ana, 'post', '/api/copiloto', json={'mensaje': 'Hola'})
        self.assertEqual(response.status_code, 503)
        self.assertIn('Mi información', response.get_json()['prompt_con_contexto'])

    def test_cms_crea_usuario_con_password_temporal_y_contenido_validado(self):
        admin = self.admin()
        created = self.send(admin, 'post', '/api/cms/usuarios', json={'nombre': 'Luis', 'email': 'luis@x.mx'})
        self.assertEqual(created.status_code, 201)
        login = self.client('luis@x.mx', created.get_json()['password_temporal'])
        self.assertTrue(login.get('/api/auth/me').get_json()['user']['cambiar_password'])
        tools = admin.get('/api/cms/contenido').get_json()['contenido']['herramientas']
        tools['diagnostico']['pasos'] = ['1', '2', '3', '4']
        self.assertEqual(self.send(admin, 'put', '/api/cms/contenido/herramientas', json={'valor': tools}).status_code, 400)
        tools['diagnostico']['pasos'] = ['Califica', 'Anota']
        tools['diagnostico']['etapa'] = 'D'
        saved = self.send(admin, 'put', '/api/cms/contenido/herramientas', json={'valor': tools}).get_json()['valor']
        self.assertEqual(saved['diagnostico']['etapa'], 'P')
        self.assertEqual(login.get('/api/contenido').get_json()['herramientas']['diagnostico']['pasos'], ['Califica', 'Anota'])

    def test_admin_no_puede_desactivarse(self):
        admin = self.admin()
        me = admin.get('/api/auth/me').get_json()['user']
        self.assertEqual(self.send(admin, 'patch', f"/api/cms/usuarios/{me['id']}", json={'activo': False}).status_code, 400)

    def test_desactivar_cierra_sesion(self):
        admin = self.admin()
        row = self.create_workshop(admin)
        ana, _ = self.register(row['codigo'])
        ana_id = ana.get('/api/auth/me').get_json()['user']['id']
        self.send(admin, 'patch', f'/api/cms/usuarios/{ana_id}', json={'activo': False})
        self.assertEqual(ana.get('/api/workbook').status_code, 401)


if __name__ == '__main__':
    unittest.main()

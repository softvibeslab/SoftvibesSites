"""Contenido inicial del Workbook PAD (curso/workbook.pdf + Base PAD §10).

Se copia a la base de datos la primera vez; después se edita desde el CMS.
Las claves de herramientas y de listas son contratos con la app y con progress.py:
puedes cambiar textos, pero no los `id` de áreas, momentos, estados o tareas ya usados.
"""

TOOLS = {
    'diagnostico': {
        'etapa': 'P', 'numero': 1, 'titulo': 'Diagnóstico de mi negocio',
        'objetivo': 'Identificar cómo está tu negocio hoy.',
        'pasos': ['Califica cada área del 1 al 5 (1 = necesito trabajarla, 5 = está bien estructurada).',
                  'Anota qué debes mejorar en cada área.',
                  'Elige tus tres prioridades.'],
        'resultado': 'Diagnóstico inicial y tres prioridades de mejora.',
    },
    'cliente_ideal': {
        'etapa': 'P', 'numero': 2, 'titulo': 'Mi cliente ideal',
        'objetivo': 'Definir a quién quieres venderle.',
        'pasos': ['Describe uno o más segmentos de clientes.',
                  'Califícalos en la matriz para compararlos.',
                  'Marca tu segmento principal y el secundario.'],
        'resultado': 'Mi segmento prioritario y secundario.',
    },
    'paquetes': {
        'etapa': 'P', 'numero': 3, 'titulo': 'Mis paquetes y precios',
        'objetivo': 'Construir tres paquetes comerciales rentables.',
        'pasos': ['Completa cada paquete: a quién va dirigido, qué incluye y qué no.',
                  'Registra materiales, mano de obra, traslados y otros costos.',
                  'Revisa la utilidad y el margen que calcula la herramienta.'],
        'resultado': 'Catálogo de paquetes definido.',
    },
    'propuesta_valor': {
        'etapa': 'P', 'numero': 4, 'titulo': 'Mi propuesta de valor',
        'objetivo': 'Resumir en una frase por qué te eligen.',
        'pasos': ['Completa los cuatro espacios de la frase.',
                  'Lee la frase que se arma.',
                  'Escribe tu versión final con tus palabras.'],
        'resultado': 'Mensaje comercial de mi negocio.',
    },
    'atencion': {
        'etapa': 'A', 'numero': 5, 'titulo': 'Mi manual de atención al cliente',
        'objetivo': 'Atender a cada cliente siempre de la misma forma.',
        'pasos': ['Marca cada paso que tu negocio ya realiza de forma consistente.',
                  'Asigna a un responsable del protocolo.',
                  'Anota los ajustes necesarios.'],
        'resultado': 'Protocolo de atención implementable.',
    },
    'ventas': {
        'etapa': 'A', 'numero': 6, 'titulo': 'Mi sistema de ventas',
        'objetivo': 'No perder ninguna oportunidad comercial.',
        'pasos': ['Registra cada prospecto con su vehículo y servicio.',
                  'Actualiza su estado y la próxima acción.',
                  'Escribe tus guiones de contacto, seguimiento y objeción.'],
        'resultado': 'Control de prospectos y oportunidades comerciales.',
    },
    'marketing': {
        'etapa': 'A', 'numero': 7, 'titulo': 'Mi plan de marketing',
        'objetivo': 'Publicar con intención durante siete días.',
        'pasos': ['Define un tema y una categoría para cada día.',
                  'Elige formato, objetivo y llamado a la acción.',
                  'Marca cada publicación cuando salga.'],
        'resultado': 'Calendario de contenido listo para ejecutar.',
    },
    'plan30': {
        'etapa': 'D', 'numero': 8, 'titulo': 'Mi plan de 30 días',
        'objetivo': 'Implementar lo construido y mejorar cada semana.',
        'pasos': ['Cambia el estado de cada tarea cuando avances.',
                  'Pega el enlace o la foto de tu evidencia.',
                  'Escribe tus observaciones.'],
        'resultado': 'Plan de implementación y mejora continua.',
    },
    'revision': {
        'etapa': 'D', 'numero': 9, 'titulo': 'Revisión semanal e indicadores',
        'objetivo': 'Medir y ajustar al cierre de cada semana.',
        'pasos': ['Responde las preguntas de la semana.',
                  'Registra tus indicadores.',
                  'Decide qué mejorarás la próxima semana.'],
        'resultado': 'Lectura semanal de avance y resultados.',
    },
    'cierre': {
        'etapa': 'D', 'numero': 10, 'titulo': 'Cierre · Mi compromiso',
        'objetivo': 'Fijar tu siguiente meta al terminar los 30 días.',
        'pasos': ['Escribe tu mayor avance y el cambio de más impacto.',
                  'Anota el indicador que mejoró.',
                  'Define tu objetivo a 90 días y la fecha de revisión.'],
        'resultado': 'Compromiso y objetivo a 90 días.',
    },
}

DIAGNOSTICO_AREAS = [
    {'id': 'modelo', 'nombre': 'Modelo de negocio'},
    {'id': 'clientes', 'nombre': 'Cliente y segmento'},
    {'id': 'servicios', 'nombre': 'Servicios y paquetes'},
    {'id': 'precios', 'nombre': 'Costos y precios'},
    {'id': 'marketing', 'nombre': 'Marketing'},
    {'id': 'ventas', 'nombre': 'Ventas'},
    {'id': 'atencion', 'nombre': 'Atención al cliente'},
    {'id': 'operaciones', 'nombre': 'Operaciones'},
]

SEGMENTO_CRITERIOS = [
    {'id': 'rentabilidad', 'nombre': 'Rentabilidad'},
    {'id': 'demanda', 'nombre': 'Demanda en mi zona'},
    {'id': 'alcance', 'nombre': 'Facilidad para llegar a él'},
    {'id': 'capacidad', 'nombre': 'Puedo atenderlo con calidad'},
]

PAQUETES_BASE = ['Paquete Esencial', 'Paquete Integral', 'Paquete Premium']

ATENCION_MOMENTOS = [
    {'id': 'contacto', 'nombre': 'Primer contacto', 'items': [
        {'id': 'contacto-1', 'texto': 'Respondo con amabilidad y claridad.'},
        {'id': 'contacto-2', 'texto': 'Solicito marca, modelo y año del vehículo.'},
        {'id': 'contacto-3', 'texto': 'Pregunto qué resultado busca el cliente.'},
        {'id': 'contacto-4', 'texto': 'Confirmo su ubicación y medio de contacto.'}]},
    {'id': 'diagnostico', 'nombre': 'Diagnóstico del vehículo', 'items': [
        {'id': 'diag-1', 'texto': 'Solicito fotografías o programo inspección.'},
        {'id': 'diag-2', 'texto': 'Identifico condición y necesidad del vehículo.'}]},
    {'id': 'cotizacion', 'nombre': 'Cotización', 'items': [
        {'id': 'cot-1', 'texto': 'Recomiendo el servicio adecuado.'},
        {'id': 'cot-2', 'texto': 'Explico alcance, exclusiones, precio y duración.'}]},
    {'id': 'reserva', 'nombre': 'Reserva y confirmación', 'items': [
        {'id': 'res-1', 'texto': 'Confirmo fecha, hora y condiciones de reserva.'},
        {'id': 'res-2', 'texto': 'Registro datos del cliente y vehículo.'}]},
    {'id': 'recepcion', 'nombre': 'Recepción y ejecución', 'items': [
        {'id': 'rec-1', 'texto': 'Documento el estado del vehículo con fotografías.'},
        {'id': 'rec-2', 'texto': 'Confirmo autorización del servicio.'},
        {'id': 'rec-3', 'texto': 'Sigo el procedimiento técnico definido.'},
        {'id': 'rec-4', 'texto': 'Verifico el trabajo antes de entregar.'},
        {'id': 'rec-5', 'texto': 'Registro cualquier incidencia y la comunico.'}]},
    {'id': 'entrega', 'nombre': 'Entrega del vehículo', 'items': [
        {'id': 'ent-1', 'texto': 'Explico el trabajo realizado y cuidados posteriores.'},
        {'id': 'ent-2', 'texto': 'Entrego recomendaciones por escrito.'}]},
    {'id': 'posventa', 'nombre': 'Seguimiento y posventa', 'items': [
        {'id': 'pos-1', 'texto': 'Confirmo satisfacción.'},
        {'id': 'pos-2', 'texto': 'Realizo seguimiento y solicito reseña cuando corresponde.'}]},
]

EMBUDO_ESTADOS = [
    {'id': 'nuevo', 'nombre': 'Nuevo prospecto'},
    {'id': 'contactado', 'nombre': 'Contactado'},
    {'id': 'diagnostico', 'nombre': 'Diagnóstico realizado'},
    {'id': 'cotizacion', 'nombre': 'Cotización enviada'},
    {'id': 'seguimiento', 'nombre': 'Seguimiento'},
    {'id': 'cita', 'nombre': 'Cita agendada'},
    {'id': 'venta', 'nombre': 'Venta cerrada'},
    {'id': 'entregado', 'nombre': 'Servicio entregado'},
    {'id': 'posventa', 'nombre': 'Posventa'},
]

MARKETING_CATEGORIAS = ['Autoridad', 'Antes y después', 'Educación', 'Confianza', 'Venta']
MARKETING_ESTADOS = ['Pendiente', 'En producción', 'Publicado']

# Semanas: workbook p. 11. Tareas: derivadas de las herramientas del workbook y de la Base PAD §10.
PLAN30 = [
    {'semana': 1, 'titulo': 'Ordenar mi negocio', 'tareas': [
        {'id': 's1-1', 'dia': 1, 'accion': 'Completar el diagnóstico y elegir tres prioridades.'},
        {'id': 's1-2', 'dia': 2, 'accion': 'Definir mi segmento principal y el secundario.'},
        {'id': 's1-3', 'dia': 3, 'accion': 'Calcular costos reales de mis tres paquetes.'},
        {'id': 's1-4', 'dia': 4, 'accion': 'Fijar precios y revisar el margen de cada paquete.'},
        {'id': 's1-5', 'dia': 5, 'accion': 'Escribir la versión final de mi propuesta de valor.'}]},
    {'semana': 2, 'titulo': 'Activar mi marca y marketing', 'tareas': [
        {'id': 's2-1', 'dia': 8, 'accion': 'Actualizar mis perfiles con la propuesta de valor y los paquetes.'},
        {'id': 's2-2', 'dia': 9, 'accion': 'Planear el calendario de contenido de siete días.'},
        {'id': 's2-3', 'dia': 10, 'accion': 'Tomar fotos y videos de un antes y después real.'},
        {'id': 's2-4', 'dia': 11, 'accion': 'Publicar las primeras piezas del calendario.'},
        {'id': 's2-5', 'dia': 12, 'accion': 'Pedir reseñas a clientes recientes.'}]},
    {'semana': 3, 'titulo': 'Mejorar ventas y atención', 'tareas': [
        {'id': 's3-1', 'dia': 15, 'accion': 'Aplicar el manual de atención con cada cliente.'},
        {'id': 's3-2', 'dia': 16, 'accion': 'Registrar a todos los prospectos en el sistema de ventas.'},
        {'id': 's3-3', 'dia': 17, 'accion': 'Usar mi guion de primer contacto y mis preguntas de diagnóstico.'},
        {'id': 's3-4', 'dia': 18, 'accion': 'Dar seguimiento a cada cotización enviada.'},
        {'id': 's3-5', 'dia': 19, 'accion': 'Anotar las objeciones que escuché y cómo respondí.'}]},
    {'semana': 4, 'titulo': 'Medir y optimizar', 'tareas': [
        {'id': 's4-1', 'dia': 22, 'accion': 'Registrar los indicadores de la semana.'},
        {'id': 's4-2', 'dia': 23, 'accion': 'Identificar el contenido y el canal con mejor respuesta.'},
        {'id': 's4-3', 'dia': 24, 'accion': 'Revisar objeciones y ajustar la oferta si hace falta.'},
        {'id': 's4-4', 'dia': 26, 'accion': 'Completar la revisión semanal.'},
        {'id': 's4-5', 'dia': 30, 'accion': 'Escribir mi compromiso y mi objetivo a 90 días.'}]},
]

REVISION_PREGUNTAS = [
    {'id': 'logros', 'texto': '¿Qué logré esta semana?'},
    {'id': 'problema', 'texto': '¿Qué problema encontré?'},
    {'id': 'mejora', 'texto': '¿Qué voy a mejorar la próxima semana?'},
    {'id': 'evidencia', 'texto': '¿Qué evidencia demuestra mi avance?'},
    {'id': 'apoyo', 'texto': '¿Qué apoyo necesito?'},
]

INDICADORES = [
    {'id': 'prospectos', 'nombre': 'Prospectos recibidos', 'tipo': 'numero'},
    {'id': 'cotizaciones', 'nombre': 'Cotizaciones enviadas', 'tipo': 'numero'},
    {'id': 'citas', 'nombre': 'Citas agendadas', 'tipo': 'numero'},
    {'id': 'servicios', 'nombre': 'Servicios vendidos', 'tipo': 'numero'},
    {'id': 'ingresos', 'nombre': 'Ingresos', 'tipo': 'dinero'},
    {'id': 'costos', 'nombre': 'Costos variables', 'tipo': 'dinero'},
    {'id': 'utilidad', 'nombre': 'Utilidad estimada', 'tipo': 'dinero'},
    {'id': 'recurrentes', 'nombre': 'Clientes recurrentes', 'tipo': 'numero'},
]

# Textos literales del workbook, p. 5–6.
COPILOTO_ACCESOS = [
    {'id': 'diagnostico', 'titulo': 'Diagnosticar mi negocio',
     'prompt': 'Actúa como consultor de negocios especializado en detailing automotriz. Analiza mi diagnóstico, identifica los tres cuellos de botella de mayor impacto y prioriza acciones realistas. Separa hechos de hipótesis y pregunta solo por información indispensable que falte.'},
    {'id': 'paquetes', 'titulo': 'Mejorar mis paquetes y precios',
     'prompt': 'Analiza mis paquetes, costos, tiempos y precios. Detecta servicios poco rentables, oportunidades de valor agregado y posibles mejoras de margen. No inventes costos ni recomiendes precios sin explicar los supuestos.'},
    {'id': 'clientes', 'titulo': 'Encontrar oportunidades de clientes',
     'prompt': 'Analiza mi segmento prioritario, zona de servicio y capacidad operativa. Propón segmentos y oportunidades comerciales que pueda validar con acciones concretas.'},
    {'id': 'marketing', 'titulo': 'Mejorar mi marketing y ventas',
     'prompt': 'Revisa mi calendario, mensajes y proceso comercial. Recomienda mejoras para atraer prospectos calificados, responder mejor y dar seguimiento sin presionar al cliente.'},
    {'id': 'avance', 'titulo': 'Evaluar mis avances',
     'prompt': 'Compara mis objetivos con las actividades completadas y los indicadores registrados. Identifica qué funcionó, qué no y mis siguientes tres acciones prioritarias.'},
]

TEXTOS = {
    'bienvenida': 'Bienvenido a tu espacio de implementación. Aquí vas a construir, guardar y mejorar las decisiones de tu negocio de detailing. Cada avance queda registrado.',
    'filosofia': 'PREPARA tu negocio. APUNTA al cliente correcto. DISPARA con estrategia y disciplina.',
    'aviso_ia': 'La IA acompaña tus decisiones, pero no sustituye la validación de costos, la experiencia técnica ni la revisión de los resultados reales.',
    'etapas': {
        'P': {'nombre': 'PREPARA', 'objetivo': 'Ordenar las bases de mi negocio.'},
        'A': {'nombre': 'APUNTA', 'objetivo': 'Organizar cómo atraigo, atiendo y convierto clientes.'},
        'D': {'nombre': 'DISPARA', 'objetivo': 'Implementar lo construido y mejorar durante 30 días.'},
    },
    'aviso_privacidad': 'Tus datos se usan solo para tu acompañamiento en el Workbook PAD de Detailbox Academy. [Pendiente: aviso de privacidad oficial de Detailbox.]',
}

DEFAULT_CONTENT = {
    'textos': TEXTOS,
    'herramientas': TOOLS,
    'diagnostico_areas': DIAGNOSTICO_AREAS,
    'segmento_criterios': SEGMENTO_CRITERIOS,
    'paquetes_base': PAQUETES_BASE,
    'atencion_momentos': ATENCION_MOMENTOS,
    'embudo_estados': EMBUDO_ESTADOS,
    'marketing_categorias': MARKETING_CATEGORIAS,
    'marketing_estados': MARKETING_ESTADOS,
    'plan30': PLAN30,
    'revision_preguntas': REVISION_PREGUNTAS,
    'indicadores': INDICADORES,
    'copiloto_accesos': COPILOTO_ACCESOS,
}

TOOL_KEYS = tuple(TOOLS)

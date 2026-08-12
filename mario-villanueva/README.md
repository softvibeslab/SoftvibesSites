# Mario Villanueva · análisis y concepto de landing

Entregable local para ordenar la presencia digital de Mario Villanueva alrededor de
**Del Ser al Vender** y el **Método BEAT**.

## Qué contiene

- `fuentes/analisis.md`: diagnóstico estratégico, señales verificadas y fuentes.
- `fuentes/screenshots/`: capturas originales obtenidas en Chrome con la sesión iniciada.
- `sitio/analisis/index.html`: versión visual del análisis.
- `sitio/index.html`: concepto de landing de conversión.
- `sitio/assets/`: imagen autorizada por el sitio oficial y capturas saneadas para el análisis.
- `version-estructurada/`: segunda versión multipágina con la arquitectura común de
  los proyectos recientes de Softvibes. Conserva la primera versión intacta.

## Vista local

Desde `sitio/`:

```bash
python3 -m http.server 4173
```

Abrir:

- Landing: `http://localhost:4173/`
- Análisis: `http://localhost:4173/analisis/`

No se publicó ni desplegó este proyecto. Los CTAs externos apuntan únicamente a
propiedades digitales oficiales existentes.

## Segunda versión

Desde `version-estructurada/`:

```bash
python3 -m http.server 4174 -d sitio
```

Abrir `http://localhost:4174/`.

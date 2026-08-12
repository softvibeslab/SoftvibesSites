/* ============================================================================
   Softvibes · Webhook Google Apps Script → Google Sheets
   Recibe los leads del Test del Embudo Fantasma y los escribe en tu hoja.

   Tu hoja:
   https://docs.google.com/spreadsheets/d/1NonIsSn62VlI0ysWiJcNuRaYf6nTLcl-Zngav_zI0Go/edit

   ── CÓMO INSTALARLO (una sola vez, ~5 min) ────────────────────────────────
   1. Abre tu Google Sheet (link de arriba).
   2. Menú:  Extensiones → Apps Script.
   3. Borra todo el código de ejemplo y PEGA este archivo completo.
   4. Guarda (💾).  Nombre del proyecto: "Softvibes Leads".
   5. Menú:  Implementar → Nueva implementación.
        - Tipo (⚙️):        Aplicación web
        - Descripción:      Softvibes Leads webhook
        - Ejecutar como:    Yo (tu correo)
        - Quién tiene acceso: Cualquier persona
        - Clic en "Implementar".
   6. Autoriza los permisos cuando lo pida (es tu propia cuenta).
   7. Copia la "URL de la aplicación web" (termina en /exec).
   8. Pégala en site/app.js →  const SHEETS_WEBHOOK = "https://script.google.com/.../exec";
   9. Listo. Cada lead del Test se guardará como una fila nueva.

   ── SI CAMBIAS ESTE SCRIPT DESPUÉS ────────────────────────────────────────
   Implementar → Gestionar implementaciones → ✏️ Editar → Versión: "Nueva versión"
   → Implementar. (Si creas una implementación nueva, la URL cambia y hay que
   volver a pegarla en app.js.)
   ========================================================================== */

// Si quieres forzar una hoja específica por ID, ponlo aquí. Si lo dejas vacío,
// usa la hoja a la que está vinculado este script (recomendado: instálalo desde tu hoja).
var SHEET_ID = "1NonIsSn62VlI0ysWiJcNuRaYf6nTLcl-Zngav_zI0Go";
var SHEET_NAME = "Leads"; // pestaña donde se guardan; se crea sola si no existe.

var HEADERS = ["Fecha", "Nombre", "WhatsApp", "Nicho", "Puntaje", "Banda", "Fugas", "Origen"];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getSheet_();

    // Encabezados en la primera fila si la hoja está vacía.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    }

    sheet.appendRow([
      data.fecha || new Date().toISOString(),
      data.nombre || "",
      "'" + (data.wa || ""), // apóstrofo → Sheets lo trata como texto y no pierde el "+"
      data.nicho || "",
      data.score,
      data.band || "",
      data.fugas || "",
      data.origen || "Test Embudo Fantasma",
    ]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Abre la URL /exec en el navegador para verificar. Muestra cuántos leads hay guardados.
function doGet() {
  var sheet = getSheet_();
  var leads = Math.max(0, sheet.getLastRow() - 1); // -1 por la fila de encabezados
  return ContentService.createTextOutput(
    "Softvibes webhook activo ✅ · Leads guardados: " + leads
  );
}

function getSheet_() {
  var ss = SHEET_ID
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

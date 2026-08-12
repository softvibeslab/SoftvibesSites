#!/bin/bash
# Copia el body del email al portapapeles COMO HTML y abre Gmail con el asunto listo.
# Uso: ./enviar-email.sh   (pegar con Cmd+V dentro del compose de Gmail)
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
EMAIL="$DIR/email-frank.html"
ASUNTO="Frank, aplicamos nuestra metodología a tu marca y te preparamos algo 🎁"

# HTML al portapapeles con tipo text/html (macOS)
hexdump -ve '1/1 "%.2x"' "$EMAIL" | python3 -c "
import sys, subprocess
hexdata = sys.stdin.read().strip()
script = f'set the clipboard to «data HTML{hexdata}»'
subprocess.run(['osascript', '-e', script], check=True)
"
echo "✅ Body copiado al portapapeles como HTML."

# Gmail compose con asunto prellenado (destinatario se llena a mano — no tenemos email de Frank)
python3 - "$ASUNTO" <<'EOF'
import sys, urllib.parse, subprocess
asunto = urllib.parse.quote(sys.argv[1])
subprocess.run(['open', f'https://mail.google.com/mail/?view=cm&fs=1&su={asunto}'])
EOF
echo "📧 Gmail abierto con el asunto listo. Pega el body con Cmd+V."

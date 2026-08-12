# 🤖 VA EXECUTION PACK - Para tu Asistente Virtual

**Propósito:** Documento que tu VA puede usar para ejecutar TODO en 1 hora  
**Tiempo:** 60 minutos  
**Resultado:** Bios actualizadas + Email automático + Landing page live

---

## 📋 CREDENCIALES NECESARIAS

Tu VA va a necesitar acceso a:

```
[ ] Instagram @_valmadero (username + password)
[ ] Instagram @blestyum_realestate_ (username + password)
[ ] Email: teamworkmobility@gmail.com (password)
[ ] Teléfono para verificar (si Mailchimp lo pide)
```

**Instrucciones:** Crea credenciales temporales para tu VA (puedes cambiarlas después).

---

## ⏱️ TASK 1: UPDATE INSTAGRAM BIOS (5 min)

### Para tu VA:

**Cuenta 1: @_valmadero**

1. Login con credenciales
2. Tap profile (bottom right)
3. Tap "Edit profile"
4. Encuentra campo "Bio"
5. BORRA TODO, PEGA ESTO:

```
Valeria Soto Madero | Real Estate Agent 🏡
Mi vida en el Caribe • Airbnb • Inversión

Te ayudo a encontrar tu propiedad ideal 🌴

wa.link/@bover
```

6. En campo "Website": `wa.link/@bover`
7. Tap "Save"
8. Screenshot para confirmar

**Cuenta 2: @blestyum_realestate_**

1. Login con credenciales
2. Tap profile → Edit profile
3. BORRA bio, PEGA ESTO:

```
Inmobiliaria 🏡 Riviera Maya
Encontramos tu propiedad ideal
Team de expertos • Airbnb • Lifestyle

wa.link/@bover
```

4. Website: `wa.link/@bover`
5. Tap Save
6. Screenshot para confirmar

✅ **Status:** [  ] Completo

---

## ⏱️ TASK 2: MAILCHIMP SETUP (15 min)

### Para tu VA:

1. **Ir a:** https://mailchimp.com
2. **Click:** "Sign Up Free"
3. **Email:** teamworkmobility@gmail.com
4. **Password:** [Pedir al usuario o usar: TemporalVA2026!]
5. **Confirmar email**

**Crear Audience:**
1. Click "Audience" (left)
2. Click "Create Audience"
3. Llena:
   ```
   Audience name: Valeria Real Estate
   Email: teamworkmobility@gmail.com
   Company: Blestyum Real Estate
   Country: Mexico
   ```
4. Click Save

**Crear Email #1:**
1. Click "Campaigns"
2. Click "Create" → "Email"
3. Campaign name: "Welcome"
4. Audience: Valeria Real Estate
5. Click Design
6. Click Code icon (<>)
7. **BORRA TODO Y PEGA:**

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { color: #ff385c; font-size: 24px; font-weight: bold; }
        .content { margin: 20px 0; }
        .cta { background: #ff385c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
        li { margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <p>Hola *|FNAME|*,</p>
        <p>¡Gracias por descargar la guía!</p>
        <p>Léela cuando tengas tiempo (especialmente el checklist de compra).</p>
        <hr>
        <h3>📋 En los próximos 5 días, te enviaré:</h3>
        <ul>
            <li>✅ Análisis del mercado 2026</li>
            <li>✅ Casos de éxito (ROI real)</li>
            <li>✅ Checklist de compra</li>
            <li>✅ Propiedades disponibles</li>
        </ul>
        <hr>
        <p><strong>WhatsApp directo:</strong></p>
        <a href="https://wa.me/5212431035553?text=Hola%20Valeria%2C%20tengo%20una%20pregunta" class="cta">Escribe por WhatsApp</a>
        <hr>
        <p>Un abrazo,<br><strong>Valeria</strong></p>
        <p style="font-size:12px;color:#666;">© 2026 Blestyum Real Estate</p>
    </div>
</body>
</html>
```

8. Click "Save and close"
9. Click "Schedule"
10. Select "Send to list"
11. **IMPORTANTE:** Check "Send when subscribers join" (automático)
12. Click Schedule
13. Screenshot para confirmar

✅ **Status:** [  ] Completo

---

## ⏱️ TASK 3: DEPLOY LANDING PAGE (10 min)

### Para tu VA:

**Opción A: Netlify (Más rápido)**

1. Ve a https://netlify.com
2. Click "Sign up"
3. Email: teamworkmobility@gmail.com
4. Verify email
5. Drag & drop file: `landing/index.html`
6. **Nota:** Si pide domain, puede ser:
   ```
   valeria-realestate
   blestyum-realestate
   valmadero
   ```
7. LISTO - URL pública en segundos
8. Screenshot de URL

**Opción B: Si tiene hosting propio**

1. Via FTP o cPanel, upload:
   ```
   landing/index.html → /public_html/
   ```
2. Visita: tudominio.com
3. Screenshot

✅ **Status:** [  ] Completo

---

## ⏱️ TASK 4: TEST EVERYTHING (10 min)

### Para tu VA:

**Test 1: Instagram Bios**
- [ ] @_valmadero bio actualizada ✓
- [ ] @blestyum bio actualizada ✓
- [ ] Ambas tienen wa.link/@bover ✓
- [ ] Links funcionan (tap y se abre WhatsApp) ✓

**Test 2: Email**
- [ ] Crear email temporal (test@example.com)
- [ ] Subscribirse a "Valeria Real Estate" audience
- [ ] Verificar que recibe email welcome automático
- [ ] Screenshot del email en inbox

**Test 3: Landing Page**
- [ ] URL accesible
- [ ] Mobile responsive (abrir en teléfono)
- [ ] Form funciona (submit test)
- [ ] WhatsApp CTAs abren wa.link/@bover
- [ ] Screenshot

**Test 4: Overall**
- [ ] Bios link a landing page (si está en bio)
- [ ] Landing page CTA a WhatsApp
- [ ] Email CTA a WhatsApp
- [ ] Todo conecta

✅ **Status:** [  ] Completo

---

## 📸 DELIVERABLES ESPERADOS

Tu VA debe enviar:

```
[ ] Screenshot: @_valmadero bio actualizada
[ ] Screenshot: @blestyum bio actualizada
[ ] Screenshot: Mailchimp email programado
[ ] Screenshot: Landing page URL
[ ] Screenshot: Test email en inbox
[ ] Screenshot: Mobile responsive test
[ ] URL del landing page (copiar-pegar)
[ ] Confirmación: "TODO LISTO"
```

---

## 💰 COSTO ESTIMADO

Si hires a un VA:
- Upwork: $5-15/hora
- Tiempo: 1 hora
- Costo total: $5-15

ROI: 1-2 deals en mes 1 = $17.5K-35K revenue

---

## 🚀 PRÓXIMO PASO (Para tu VA)

Después de completar ESTO:

**Tomorrow (Día 2):**
- Crear video reel #1 (script está en EJECUCION_SEMANA1.md)
- Editar en CapCut o Canva (free)
- Guardar MP4

**Wednesday (Día 3):**
- Post reel a @_valmadero (9 AM)
- Monitor comentarios
- Reply a todos dentro 2 horas

**Semana 1-4:**
- Seguir CONTENT_CALENDAR_30DIAS.md
- Post 3x/semana
- Stories 5-7/día

---

## 📞 COMMUNICATION

**Para tu VA:**

Si algo no funciona:
1. Screenshot del error
2. Describe qué pasó
3. Envía link/referencia

**Escalation:**
Si no puede resolver en 15 min → Contacta supervisor

---

## ✅ FINAL CHECKLIST

Antes de decir "DONE":

```
[ ] Ambas bios actualizadas (screenshot)
[ ] Mailchimp email automático (screenshot)
[ ] Landing page live (URL)
[ ] Email test recibido (screenshot)
[ ] Todo testeado (funcionan links)
[ ] Screenshots de todo completado
[ ] Status: "EJECUTADO"
```

---

## 📋 NOTAS IMPORTANTES

**Para tu VA:**

- No cambies copy/messaging (es exacto como está)
- Si algo no cabe, avisa (no edites)
- Tests son importantes (no saltes)
- Screenshots = prueba de que funciona
- Si hay error, foto del error + contexto

---

**Tiempo estimado:** 60 minutos  
**Dificultad:** Easy (solo copiar-pegar + testing)  
**Resultado:** Sistema listo para 30 días de growth

---

## 🔐 SEGURIDAD POST-EJECUCIÓN

**Después que tu VA termine:**

1. Cambia password de Email
2. Cambia password de Instagram (ambas)
3. Revoke Mailchimp access si fue via OAuth
4. Guarda URLs en lugar seguro (1Password, etc)

---

**LISTO PARA PASAR A TU VA?** ✅

Este documento tiene todo lo que necesita para ejecutar en 60 minutos.

(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const item = (window.KLH_INVENTORY || []).find((property) => property.id === params.get("id"));
  const phone = "529842341121";
  let language = params.get("lang") === "en" ? "en" : "es";
  const content = document.getElementById("detail-content");

  const copy = {
    es: {
      inventory: "Ver inventario", contact: "Consultar por WhatsApp", back: "← Volver al inventario", monthly: "MXN / mes",
      reported: "Disponibilidad reportada", available: "Disponible al 5 de agosto de 2026", from: "Disponible desde", details: "Lo que sabemos", category: "Tipo",
      area: "Zona", utilities: "Servicios", electricity: "Electricidad adicional", checked: "Última verificación", source: "Fuente visual", drive: "Carpeta pública de Drive",
      confirm: "Por confirmar con KLH", conditions: "Condiciones de la renta", deposit: "Depósito", minimum: "Estancia mínima", pets: "Mascotas", parking: "Estacionamiento",
      openDrive: "Ver fotografías originales", ask: "Preguntar si sigue disponible", formTitle: "Envía una consulta completa", move: "Fecha de entrada", people: "Personas", months: "Meses", send: "Enviar por WhatsApp",
      disclaimer: "Precio y disponibilidad reportados el 5 de agosto de 2026. Confirma todos los términos directamente con KLH.", notFound: "No encontramos esta propiedad.", goBack: "Regresar al inventario",
      note: "Atención:"
    },
    en: {
      inventory: "View listings", contact: "Ask on WhatsApp", back: "← Back to listings", monthly: "MXN / month",
      reported: "Reported availability", available: "Available as of August 5, 2026", from: "Available from", details: "What we know", category: "Type",
      area: "Area", utilities: "Utilities", electricity: "Electricity not included", checked: "Last checked", source: "Visual source", drive: "Public Drive folder",
      confirm: "Confirm with KLH", conditions: "Rental terms", deposit: "Deposit", minimum: "Minimum stay", pets: "Pets", parking: "Parking",
      openDrive: "View original photos", ask: "Ask if it is still available", formTitle: "Send a complete inquiry", move: "Move-in date", people: "People", months: "Months", send: "Send on WhatsApp",
      disclaimer: "Price and availability reported August 5, 2026. Confirm all terms directly with KLH.", notFound: "We couldn't find this property.", goBack: "Return to listings",
      note: "Please note:"
    }
  };

  function t(key) { return copy[language][key] || key; }
  function money(value) { return new Intl.NumberFormat(language === "es" ? "es-MX" : "en-US").format(value); }
  function displayDate(value) {
    return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
  }
  function wa(message) { return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`; }
  function baseMessage() {
    if (!item) return "Hola, vi el inventario de KLH.";
    return language === "es"
      ? `Hola, vi el inventario de KLH y me interesa ${item.name}, publicado en $${money(item.price)} MXN al mes. ¿Sigue disponible?`
      : `Hi, I found ${item.name} in the KLH inventory, listed at MXN ${money(item.price)} per month. Is it still available?`;
  }

  function render() {
    document.documentElement.lang = language;
    document.querySelectorAll("[data-i18n]").forEach((element) => { element.textContent = t(element.dataset.i18n); });
    document.querySelectorAll(".language-toggle span").forEach((span) => span.classList.toggle("active", span.textContent.toLowerCase() === language));

    if (!item) {
      document.title = `${t("notFound")} | KLH Rentals`;
      content.innerHTML = `<section class="detail-not-found"><h1>${t("notFound")}</h1><a class="button button-navy" href="../?lang=${language}">${t("goBack")}</a></section>`;
      return;
    }

    document.title = `${item.name} | KLH Rentals`;
    document.querySelector('meta[name="description"]').content = `${item.name}: ${item.category[language]}, ${item.zone[language]}, $${money(item.price)} MXN.`;
    const status = item.availability === "date" ? `${t("from")} ${displayDate(item.availableFrom)}` : t("available");
    const note = item.reviewNote ? `<p class="detail-review"><strong>${t("note")}</strong> ${item.reviewNote[language]}</p>` : "";
    const directWa = wa(baseMessage());
    document.getElementById("header-wa").href = directWa;

    content.innerHTML = `
      <a class="back-link" href="../?lang=${language}#inventario">${t("back")}</a>
      <section class="detail-hero">
        <figure class="detail-image"><img src="../${item.image}" alt="${item.name}" width="1200" height="960"></figure>
        <div class="detail-panel">
          <div>
            <p class="detail-kicker">${item.category[language]} · ${item.zone[language]}</p>
            <h1>${item.name}</h1>
            <p class="detail-price"><strong>$${money(item.price)}</strong><span>${t("monthly")}</span></p>
            <span class="detail-status">${status}</span>
            ${note}
          </div>
          <div class="detail-ctas">
            <a class="button button-navy" href="${directWa}" target="_blank" rel="noopener noreferrer">${t("ask")} ↗</a>
            <a class="button secondary" href="${item.drive}" target="_blank" rel="noopener noreferrer">${t("openDrive")} ↗</a>
          </div>
        </div>
      </section>

      <section class="detail-info">
        <div>
          <p class="eyebrow dark">KLH · Playa del Carmen</p>
          <h2>${t("details")}</h2>
          <ul class="facts-list">
            <li><span>${t("category")}</span><strong>${item.category[language]}</strong></li>
            <li><span>${t("area")}</span><strong>${item.zone[language]}</strong></li>
            <li><span>${t("utilities")}</span><strong>${item.utility[language]}</strong></li>
            <li><span>${t("checked")}</span><strong>${displayDate(item.availabilityDate)}</strong></li>
            <li><span>${t("source")}</span><strong>${t("drive")}</strong></li>
            <li><span>${t("reported")}</span><strong>${status}</strong></li>
          </ul>
        </div>
        <div>
          <p class="eyebrow dark">${t("conditions")}</p>
          <h2>${t("formTitle")}</h2>
          <ul class="facts-list" style="margin-bottom:18px">
            <li><span>${t("deposit")}</span><strong>${t("confirm")}</strong></li>
            <li><span>${t("minimum")}</span><strong>${t("confirm")}</strong></li>
            <li><span>${t("pets")}</span><strong>${t("confirm")}</strong></li>
            <li><span>${t("parking")}</span><strong>${t("confirm")}</strong></li>
          </ul>
          <form class="detail-form" id="detail-form">
            <label><span>${t("move")}</span><input type="date" id="detail-date" required></label>
            <label><span>${t("people")}</span><input type="number" id="detail-people" min="1" max="12" value="2" required></label>
            <label><span>${t("months")}</span><input type="number" id="detail-months" min="1" max="36" value="6" required></label>
            <button class="button" type="submit">${t("send")}</button>
          </form>
        </div>
      </section>`;

    const dateInput = document.getElementById("detail-date");
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    dateInput.min = localDate;
    dateInput.value = item.availableFrom && item.availableFrom > localDate ? item.availableFrom : localDate;

    document.getElementById("detail-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const date = dateInput.value;
      const people = document.getElementById("detail-people").value;
      const months = document.getElementById("detail-months").value;
      const message = language === "es"
        ? `Hola, vi ${item.name} en el inventario de KLH. Busco entrar el ${displayDate(date)}, somos ${people} persona(s) y necesito rentar por ${months} meses. ¿Sigue disponible y cuáles son los requisitos?`
        : `Hi, I found ${item.name} in the KLH inventory. I need to move in on ${displayDate(date)}, there are ${people} of us and I need a ${months}-month rental. Is it available and what are the requirements?`;
      window.open(wa(message), "_blank", "noopener,noreferrer");
    });
  }

  document.querySelector(".language-toggle").addEventListener("click", () => {
    language = language === "es" ? "en" : "es";
    render();
  });

  const menu = document.querySelector(".main-nav");
  const menuToggle = document.querySelector(".menu-toggle");
  menuToggle.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  render();
})();

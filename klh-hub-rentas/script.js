(function () {
  "use strict";

  const inventory = Array.isArray(window.KLH_INVENTORY) ? window.KLH_INVENTORY : [];
  const phone = "529842341121";
  const translations = {
    es: {
      skip: "Saltar al inventario", navInventory: "Inventario", navHow: "Cómo funciona", navCta: "Hablar por WhatsApp",
      eyebrow: "Rentas seleccionadas · Playa del Carmen", heroTitle: "Tu próxima renta,<br><em>sin abrir quince carpetas.</em>",
      heroLead: "Compara estudios y departamentos por precio, zona y recámaras. Cuando encuentres uno, WhatsApp se abre con la propiedad exacta ya identificada.",
      explore: "Explorar 15 opciones", help: "Quiero recomendación", heroNote: "Disponibilidad reportada el 5 de agosto de 2026 · Confirma condiciones antes de reservar.",
      quickSearch: "Búsqueda rápida", fromPrice: "Desde $14,000 MXN / mes", studios: "estudios", oneBeds: "de 1 recámara", twoBeds: "de 2 recámaras",
      statListings: "publicaciones vigentes", statRange: "rango mensual", statLanguage: "atención bilingüe", statContext: "WhatsApp con contexto",
      catalogEyebrow: "Inventario estructurado", catalogTitle: "Encuentra primero.<br><em>Pregunta después.</em>",
      catalogIntro: "Precios mensuales en MXN. La electricidad se reporta como adicional en las 15 publicaciones.",
      searchLabel: "Buscar propiedad", searchPlaceholder: "The City, Lunada…", bedroomsLabel: "Recámaras", all: "Todas", studio: "Estudio", oneBed: "1 recámara", twoBed: "2 recámaras",
      zoneLabel: "Zona", allZones: "Todas las zonas", downtown: "Centro", street38: "Calle 38", toConfirm: "Por confirmar",
      priceLabel: "Precio mensual", anyPrice: "Cualquier precio", under20: "Hasta $19,999", over30: "$30,000 o más",
      availabilityLabel: "Disponibilidad", anyAvailability: "Cualquier fecha", availableNow: "Reportada disponible", availableSoon: "Próximamente", clear: "Limpiar",
      results: "opciones encontradas", sortLabel: "Ordenar resultados", sortRecommended: "Orden recomendado", sortLow: "Precio: menor a mayor", sortHigh: "Precio: mayor a menor",
      emptyTitle: "No encontramos una coincidencia exacta.", emptyText: "Prueba quitando un filtro o cuéntanos lo que buscas por WhatsApp.", clearFilters: "Limpiar filtros",
      howEyebrow: "Un proceso más simple", howTitle: "De “¿qué tienes?”<br><em>a “quiero esta”.</em>",
      howIntro: "El hub no reemplaza la atención personal de KLH. La hace más eficiente: el cliente compara por su cuenta y la conversación empieza con una opción concreta.",
      step1Title: "Filtra", step1Text: "Elige presupuesto, zona y número de recámaras.", step2Title: "Compara", step2Text: "Revisa precio, disponibilidad, foto y carpeta original.",
      step3Title: "Pregunta con contexto", step3Text: "Envía la propiedad, fecha de entrada, personas y plazo por WhatsApp.",
      conciergeEyebrow: "¿No sabes cuál elegir?", conciergeTitle: "Cuéntanos tu plan.<br><em>KLH filtra contigo.</em>",
      conciergeText: "Este formulario no almacena datos: prepara un mensaje para enviarlo desde tu propio WhatsApp.", moveIn: "Fecha de entrada", people: "Personas", term: "Plazo en meses", budget: "Presupuesto máximo", sendSearch: "Enviar búsqueda por WhatsApp",
      footerTagline: "Inventario organizado para conversar mejor.", contact: "Contacto", information: "Información", digitalAnalysis: "Análisis digital",
      disclaimer: "Precios y disponibilidad reportados el 5 de agosto de 2026. Electricidad adicional. Depósito, estancia mínima, mascotas, estacionamiento y servicios incluidos deben confirmarse directamente con KLH.",
      reported: "Reportado disponible", fromDate: "Desde", verified: "Verificado", monthly: "MXN / mes", view: "Ver ficha", ask: "Consultar", source: "Fotos en Drive", attention: "Dato por confirmar"
    },
    en: {
      skip: "Skip to listings", navInventory: "Listings", navHow: "How it works", navCta: "Chat on WhatsApp",
      eyebrow: "Selected rentals · Playa del Carmen", heroTitle: "Your next rental,<br><em>without opening fifteen folders.</em>",
      heroLead: "Compare studios and apartments by price, area and bedrooms. When you find one, WhatsApp opens with the exact property already identified.",
      explore: "Explore 15 options", help: "Help me choose", heroNote: "Availability reported August 5, 2026 · Confirm terms before booking.",
      quickSearch: "Quick search", fromPrice: "From MXN 14,000 / month", studios: "studios", oneBeds: "with 1 bedroom", twoBeds: "with 2 bedrooms",
      statListings: "active listings", statRange: "monthly range", statLanguage: "bilingual service", statContext: "contextual WhatsApp",
      catalogEyebrow: "Structured inventory", catalogTitle: "Find it first.<br><em>Ask about it next.</em>",
      catalogIntro: "Monthly prices in MXN. Electricity is reported as an additional charge on all 15 listings.",
      searchLabel: "Search property", searchPlaceholder: "The City, Lunada…", bedroomsLabel: "Bedrooms", all: "All", studio: "Studio", oneBed: "1 bedroom", twoBed: "2 bedrooms",
      zoneLabel: "Area", allZones: "All areas", downtown: "Downtown", street38: "38th Street", toConfirm: "To be confirmed",
      priceLabel: "Monthly price", anyPrice: "Any price", under20: "Up to MXN 19,999", over30: "MXN 30,000 or more",
      availabilityLabel: "Availability", anyAvailability: "Any date", availableNow: "Reported available", availableSoon: "Coming soon", clear: "Clear",
      results: "options found", sortLabel: "Sort results", sortRecommended: "Recommended order", sortLow: "Price: low to high", sortHigh: "Price: high to low",
      emptyTitle: "We couldn't find an exact match.", emptyText: "Remove a filter or tell us what you need on WhatsApp.", clearFilters: "Clear filters",
      howEyebrow: "A simpler process", howTitle: "From “what do you have?”<br><em>to “I want this one.”</em>",
      howIntro: "The hub does not replace KLH's personal service. It makes it more efficient: clients compare on their own and the conversation begins with a specific option.",
      step1Title: "Filter", step1Text: "Choose your budget, area and number of bedrooms.", step2Title: "Compare", step2Text: "Review price, availability, photo and original folder.",
      step3Title: "Ask with context", step3Text: "Send the property, move-in date, number of people and term through WhatsApp.",
      conciergeEyebrow: "Not sure which one to choose?", conciergeTitle: "Tell us your plan.<br><em>KLH filters with you.</em>",
      conciergeText: "This form does not store data: it prepares a message for you to send from your own WhatsApp.", moveIn: "Move-in date", people: "People", term: "Term in months", budget: "Maximum budget", sendSearch: "Send search on WhatsApp",
      footerTagline: "Organized inventory for better conversations.", contact: "Contact", information: "Information", digitalAnalysis: "Digital analysis",
      disclaimer: "Prices and availability reported August 5, 2026. Electricity is additional. Deposit, minimum stay, pets, parking and included services must be confirmed directly with KLH.",
      reported: "Reported available", fromDate: "From", verified: "Checked", monthly: "MXN / month", view: "View details", ask: "Ask about it", source: "Photos on Drive", attention: "Details to confirm"
    }
  };

  const richKeys = new Set(["heroTitle", "catalogTitle", "howTitle", "conciergeTitle"]);
  let language = new URLSearchParams(window.location.search).get("lang") === "en" ? "en" : "es";

  const elements = {
    form: document.getElementById("filters"), search: document.getElementById("search"), bedrooms: document.getElementById("bedrooms"),
    zone: document.getElementById("zone"), price: document.getElementById("price"), availability: document.getElementById("availability"),
    sort: document.getElementById("sort"), grid: document.getElementById("property-grid"), count: document.getElementById("result-count"),
    empty: document.getElementById("empty-state"), emptyReset: document.getElementById("empty-reset"), concierge: document.getElementById("concierge-form")
  };

  function t(key) { return translations[language][key] || key; }
  function money(value) { return new Intl.NumberFormat(language === "es" ? "es-MX" : "en-US").format(value); }
  function displayDate(value) {
    return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
  }
  function whatsapp(message) { return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`; }
  function propertyMessage(item) {
    return language === "es"
      ? `Hola, vi el inventario de KLH y me interesa ${item.name}, publicado en $${money(item.price)} MXN al mes. ¿Sigue disponible?`
      : `Hi, I found ${item.name} in the KLH inventory, listed at MXN ${money(item.price)} per month. Is it still available?`;
  }
  function availabilityLabel(item) {
    if (item.availability === "date") return `${t("fromDate")} ${displayDate(item.availableFrom)}`;
    return t("reported");
  }

  function card(item) {
    const review = item.reviewNote ? `<p class="review-note">${item.reviewNote[language]}</p>` : "";
    return `
      <article class="property-card">
        <a class="property-media" href="propiedad/?id=${encodeURIComponent(item.id)}&lang=${language}" aria-label="${t("view")}: ${item.name}">
          <img src="${item.image}" alt="${item.name}" loading="lazy" width="800" height="640">
          <span class="property-badges"><span class="badge">${item.zone[language]}</span><span class="badge available">${availabilityLabel(item)}</span></span>
        </a>
        <div class="property-body">
          <p class="property-meta"><span>${item.category[language]}</span><span>${t("verified")} 05.08.26</span></p>
          <h3>${item.name}</h3>
          <p class="property-price"><strong>$${money(item.price)}</strong><span>${t("monthly")}</span></p>
          <div class="property-facts"><span>${item.utility[language]}</span><span>${t("source")}</span></div>
          ${review}
          <div class="property-actions">
            <a href="propiedad/?id=${encodeURIComponent(item.id)}&lang=${language}">${t("view")}</a>
            <a class="card-wa" href="${whatsapp(propertyMessage(item))}" target="_blank" rel="noopener noreferrer">${t("ask")} ↗</a>
          </div>
        </div>
      </article>`;
  }

  function filteredInventory() {
    const term = elements.search.value.trim().toLocaleLowerCase(language === "es" ? "es-MX" : "en-US");
    const selectedBedrooms = elements.bedrooms.value;
    const selectedZone = elements.zone.value;
    const selectedPrice = elements.price.value;
    const selectedAvailability = elements.availability.value;
    const matches = inventory.filter((item) => {
      const nameMatch = !term || `${item.name} ${item.category[language]} ${item.zone[language]}`.toLocaleLowerCase().includes(term);
      const bedroomMatch = !selectedBedrooms || item.bedrooms === selectedBedrooms;
      const zoneMatch = !selectedZone || item.zoneKey === selectedZone;
      const availabilityMatch = !selectedAvailability || item.availability === selectedAvailability;
      const priceMatch = !selectedPrice ||
        (selectedPrice === "under20" && item.price < 20000) ||
        (selectedPrice === "20to29" && item.price >= 20000 && item.price < 30000) ||
        (selectedPrice === "30plus" && item.price >= 30000);
      return nameMatch && bedroomMatch && zoneMatch && availabilityMatch && priceMatch;
    });
    if (elements.sort.value === "low") matches.sort((a, b) => a.price - b.price);
    if (elements.sort.value === "high") matches.sort((a, b) => b.price - a.price);
    return matches;
  }

  function render() {
    const matches = filteredInventory();
    elements.grid.innerHTML = matches.map(card).join("");
    elements.count.textContent = String(matches.length);
    elements.empty.hidden = matches.length !== 0;
    elements.grid.hidden = matches.length === 0;
  }

  function applyTranslations() {
    document.documentElement.lang = language;
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      if (!translations[language][key]) return;
      if (richKeys.has(key)) element.innerHTML = translations[language][key];
      else element.textContent = translations[language][key];
    });
    if (elements.search) elements.search.placeholder = t("searchPlaceholder");
    document.querySelectorAll(".language-toggle").forEach((toggle) => {
      toggle.querySelectorAll("span").forEach((span) => span.classList.toggle("active", span.textContent.toLowerCase() === language));
    });
    render();
  }

  function resetFilters() {
    elements.form.reset();
    render();
  }

  elements.form.addEventListener("input", render);
  elements.form.addEventListener("reset", () => window.setTimeout(render));
  elements.sort.addEventListener("change", render);
  elements.emptyReset.addEventListener("click", resetFilters);

  document.querySelectorAll("[data-quick]").forEach((link) => {
    link.addEventListener("click", () => {
      elements.bedrooms.value = link.dataset.quick;
      render();
    });
  });

  document.querySelectorAll(".language-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      language = language === "es" ? "en" : "es";
      applyTranslations();
    });
  });

  const menu = document.querySelector(".main-nav");
  const menuToggle = document.querySelector(".menu-toggle");
  menuToggle.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    menu.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }));

  elements.concierge.addEventListener("submit", (event) => {
    event.preventDefault();
    const moveIn = document.getElementById("move-in").value;
    const people = document.getElementById("people").value;
    const months = document.getElementById("term").value;
    const budget = document.getElementById("budget").value;
    const message = language === "es"
      ? `Hola, vi el inventario de KLH. Busco entrar el ${displayDate(moveIn)}, somos ${people} persona(s), necesito rentar por ${months} meses y mi presupuesto máximo es $${money(Number(budget))} MXN al mes. ¿Qué opciones me recomiendas?`
      : `Hi, I found the KLH inventory. I need to move in on ${displayDate(moveIn)}, there are ${people} of us, I need a ${months}-month rental and my maximum budget is MXN ${money(Number(budget))} per month. Which options would you recommend?`;
    window.open(whatsapp(message), "_blank", "noopener,noreferrer");
  });

  const moveInInput = document.getElementById("move-in");
  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  moveInInput.min = localToday;
  if (!moveInInput.value) moveInInput.value = localToday;

  applyTranslations();
})();

const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector("#site-nav");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

const stations = document.querySelectorAll(".station");
const ticket = document.querySelector("#ticket");

if (stations.length && ticket) {
  const fields = {
    kicker: ticket.querySelector("[data-field='kicker']"),
    name: ticket.querySelector("[data-field='name']"),
    detail: ticket.querySelector("[data-field='detail']"),
    channel: ticket.querySelector("[data-field='channel']"),
    intent: ticket.querySelector("[data-field='intent']"),
    state: ticket.querySelector("[data-field='state']"),
    next: ticket.querySelector("[data-field='next']"),
  };

  const selectStation = (button) => {
    stations.forEach((station) => {
      const on = station === button;
      station.classList.toggle("is-now", on);
      station.setAttribute("aria-pressed", String(on));
    });
    Object.entries(fields).forEach(([key, node]) => {
      if (node) node.textContent = button.dataset[key] || "";
    });
  };

  stations.forEach((button) => {
    button.addEventListener("click", () => selectStation(button));
  });
}

(function () {
  "use strict";
  document.querySelectorAll(".finding button").forEach((button) => {
    button.addEventListener("click", () => {
      const finding = button.closest(".finding");
      const isOpen = finding.classList.toggle("open");
      button.setAttribute("aria-expanded", String(isOpen));
    });
  });

  const menu = document.querySelector(".menu");
  const nav = document.querySelector(".topbar nav");
  menu.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menu.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menu.setAttribute("aria-expanded", "false");
  }));
})();

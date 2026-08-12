// Reveal al hacer scroll
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add("visible"); revealObserver.unobserve(entry.target); }
  });
}, { threshold: 0.14 });
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// Acordeón FAQ
document.querySelectorAll(".faq button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".faq");
    const ans = card.querySelector(".a");
    const open = card.classList.contains("abierto");
    card.classList.toggle("abierto", !open);
    ans.style.maxHeight = open ? "0px" : ans.scrollHeight + "px";
  });
});

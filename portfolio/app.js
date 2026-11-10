const dot = document.createElement("div");
dot.className = "gold-dot";
document.body.appendChild(dot);

document.addEventListener("mousemove", (event) => {
  dot.classList.add("on");
  dot.style.left = `${event.clientX}px`;
  dot.style.top = `${event.clientY}px`;
});

document.querySelectorAll("a, button.card").forEach((el) => {
  el.addEventListener("mouseenter", () => dot.classList.add("big"));
  el.addEventListener("mouseleave", () => dot.classList.remove("big"));
});

document.querySelectorAll(".card[data-toggle]").forEach((card) => {
  card.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;
    card.classList.toggle("open");
  });
});

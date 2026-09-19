(() => {
  const welcome = document.createElement("div");
  welcome.className = "mpk-welcome";
  welcome.setAttribute("aria-label", "MPK sedang dimuat");
  welcome.innerHTML =
    '<div class="mpk-welcome__content"><div class="mpk-welcome__mark">M<span>PK</span></div><div class="mpk-welcome__line"></div></div>';
  document.body.prepend(welcome);

  window.setTimeout(() => {
    welcome.classList.add("is-hidden");
    window.setTimeout(() => welcome.remove(), 500);
  }, 950);
})();

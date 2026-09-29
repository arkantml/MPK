(() => {
  const welcome = document.createElement("div");
  welcome.className = "mpk-welcome";
  welcome.setAttribute("aria-label", "MPK sedang dimuat");
  welcome.innerHTML =
    '<div class="mpk-welcome__content"><img class="mpk-welcome__logo" src="assets/img/logo-mpk.png" alt="Logo MPK"><div class="mpk-welcome__line"></div><p class="mpk-welcome__credit">Created by <span>Arkan Muiz XD</span></p></div>';
  document.body.prepend(welcome);

  window.setTimeout(() => {
    welcome.classList.add("is-hidden");
    window.setTimeout(() => welcome.remove(), 500);
  }, 950);
})();

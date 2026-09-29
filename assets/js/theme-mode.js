(() => {
  const storageKey = "mpk-theme";
  const savedTheme = localStorage.getItem(storageKey);
  const prefersLight = window.matchMedia(
    "(prefers-color-scheme: light)",
  ).matches;
  const root = document.documentElement;

  root.dataset.theme = savedTheme || (prefersLight ? "light" : "dark");

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    if (document.body) document.body.dataset.theme = theme;
  };

  const icons = {
    light:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z"/></svg>',
    dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>',
  };

  const mountToggle = () => {
    if (document.querySelector(".mpk-theme-toggle")) return;

    const adminControls = document.querySelector(
      "#admin-body > div > main > header > div:last-child",
    );
    const headerControls = document.querySelector("header > div");
    const host = adminControls || headerControls || document.body;
    applyTheme(root.dataset.theme);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mpk-theme-toggle";
    button.addEventListener("click", () => {
      const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      localStorage.setItem(storageKey, nextTheme);
      updateToggle(button);
    });

    if (host === document.body)
      button.classList.add("mpk-theme-toggle--floating");
    host.appendChild(button);
    updateToggle(button);
  };

  const updateToggle = (button) => {
    const isDark = root.dataset.theme === "dark";
    button.innerHTML = icons[isDark ? "dark" : "light"];
    button.setAttribute(
      "aria-label",
      `Switch to ${isDark ? "light" : "dark"} mode`,
    );
    button.setAttribute("title", `Switch to ${isDark ? "light" : "dark"} mode`);
    button.setAttribute("aria-pressed", String(!isDark));
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountToggle, { once: true });
  } else {
    mountToggle();
  }
})();

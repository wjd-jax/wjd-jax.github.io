/* Apply the selected palette in <head>, before the first page paint. */
(() => {
  const root = document.documentElement;
  const storageKey = "jax-theme";
  const publicPages = new Set([
    "index.html", "resume.html", "case-comfyui-suite.html",
    "case-tabichain.html", "case-cellula.html"
  ]);
  const isTheme = (value) => value === "light" || value === "dark";
  let theme = "dark";
  const requested = new URLSearchParams(window.location.search).get("theme");
  if (isTheme(requested)) {
    theme = requested;
  } else {
    try {
      const saved = localStorage.getItem(storageKey);
      if (isTheme(saved)) theme = saved;
    } catch (error) {}
  }

  const applyTheme = () => {
    root.dataset.theme = theme;
    document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#f5f7fc" : "#0b1020");
  };
  applyTheme();

  const syncControls = () => {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const label = theme === "light" ? "切换到深色主题" : "切换到亮色主题";
      button.hidden = false;
      button.setAttribute("aria-pressed", String(theme === "light"));
      button.setAttribute("aria-label", label);
      button.title = label;
    });
    // Carry the palette between public pages even when storage is unavailable.
    document.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      const destination = new URL(href, window.location.href);
      if (destination.origin !== window.location.origin || !publicPages.has(destination.pathname.split("/").pop())) return;
      if (destination.pathname.slice(0, destination.pathname.lastIndexOf("/")) !== window.location.pathname.slice(0, window.location.pathname.lastIndexOf("/"))) return;
      destination.searchParams.set("theme", theme);
      link.href = destination.href;
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    syncControls();
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        theme = theme === "light" ? "dark" : "light";
        applyTheme();
        syncControls();
        try { localStorage.setItem(storageKey, theme); } catch (error) {}
        try {
          const url = new URL(window.location.href);
          url.searchParams.set("theme", theme);
          history.replaceState(history.state, "", url);
        } catch (error) {}
      });
    });
  });
})();

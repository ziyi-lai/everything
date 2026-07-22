export const THEME_STORAGE_KEY = "everything-theme";

// Runs before first paint (injected into <head> as a blocking inline script)
// so the page never flashes the wrong theme on load. Kept as a string because
// it has to execute ahead of any React bundle.
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.classList.toggle("light", theme === "light");
  } catch (e) {
    /* private mode / storage disabled — fall through to the dark default */
  }
})();
`;

export function toggleTheme() {
  const isLight = document.documentElement.classList.toggle("light");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, isLight ? "light" : "dark");
  } catch {
    // preference just won't persist; the toggle still works this session
  }
}

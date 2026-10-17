"use client";

import { useSyncExternalStore } from "react";

// The theme lives in <html data-theme>: dark by default, set from localStorage by a script in
// the layout before the first paint. The switch only reads and flips that attribute.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const isDark = () => document.documentElement.dataset.theme !== "light";

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => true);

  function toggle() {
    const theme = dark ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // Private mode or blocked storage: the switch still works for this page.
    }
  }

  return (
    <button className="theme-toggle" role="switch" aria-checked={dark} onClick={toggle}>
      <span className="track">
        <i />
      </span>
      Escuro
    </button>
  );
}

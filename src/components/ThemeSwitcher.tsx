import { useEffect, useState } from "react";

const THEMES = [
  { id: "paper", label: "Paper" },
  { id: "cyber", label: "Cyber" },
  { id: "folio", label: "Folio" },
  { id: "sand", label: "Sand" },
] as const;

/** Astryx supports three modes:
 *   system → no data-theme (:root color-scheme: light dark → follows OS)
 *   light  → html[data-theme="light"]
 *   dark   → html[data-theme="dark"]
 */
type Mode = "system" | "light" | "dark";

const MODES: { id: Mode; label: string }[] = [
  { id: "system", label: "🖥 system" },
  { id: "light", label: "☀ light" },
  { id: "dark", label: "🌙 dark" },
];

/** Apply theme + mode.
 * Theme (paper/cyber/…) goes on <body> — Astryx @scope needs an ancestor that
 * is not the scope-limit element (<html> would self-cancel the donut scope).
 * Mode goes on <html> as Astryx's own `data-theme` attribute; "system" removes
 * it so Astryx's `:root { color-scheme: light dark }` follows the OS. */
function apply(theme: string, mode: Mode) {
  const run = () => {
    document.body.setAttribute("data-astryx-theme", theme);
    if (mode === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", mode);
    }
  };
  if (document.startViewTransition) document.startViewTransition(run);
  else run();
}

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState("paper");
  const [mode, setMode] = useState<Mode>("system");

  // hydrate from localStorage (defaults set by anti-FOUC script)
  useEffect(() => {
    setTheme(localStorage.getItem("sqrlnest-theme") || "paper");
    setMode((localStorage.getItem("sqrlnest-mode") as Mode) || "system");
  }, []);

  function pickTheme(id: string) {
    setTheme(id);
    localStorage.setItem("sqrlnest-theme", id);
    apply(id, mode);
  }

  function pickMode(id: Mode) {
    setMode(id);
    localStorage.setItem("sqrlnest-mode", id);
    apply(theme, id);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        id="theme-label"
        className="font-mono text-xs text-secondary uppercase tracking-wider"
      >
        theme:
      </span>
      <div role="group" aria-labelledby="theme-label" className="flex gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => pickTheme(t.id)}
            aria-pressed={theme === t.id}
            className={
              "font-mono text-xs px-3 py-1.5 rounded-el border cursor-pointer transition-colors " +
              (theme === t.id
                ? "bg-brand text-on-brand border-brand"
                : "bg-transparent text-secondary border-line hover:border-brand")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <span
        id="mode-label"
        className="font-mono text-xs text-secondary uppercase tracking-wider ml-2"
      >
        mode:
      </span>
      <div role="group" aria-labelledby="mode-label" className="flex gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => pickMode(m.id)}
            aria-pressed={mode === m.id}
            className={
              "font-mono text-xs px-3 py-1.5 rounded-el border cursor-pointer transition-colors " +
              (mode === m.id
                ? "bg-brand text-on-brand border-brand"
                : "bg-transparent text-secondary border-line hover:border-brand")
            }
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * sqrlnest shared browser store — the single source of truth for cross-cutting
 * UI state shared between the landing and the embedded Ratatoskr chatbot.
 *
 * Core = @tanstack/store (framework-agnostic signals). We expose the TanStack
 * store itself on `window.__sqrlnest` so any consumer (landing, chatbot) uses
 * the native TanStack API (`.state`, `.setState`, `.subscribe`) and follows the
 * official TanStack docs — no bespoke store docs to maintain.
 *
 * Ownership: the LANDING creates `window.__sqrlnest` early. The chatbot loads
 * later and only consumes it (never recreates it).
 *
 * This file is the interface contract. It is copied, as-is, into the chatbot
 * repo until it graduates into a shared package.
 */
import { Store } from "@tanstack/store";

export type Theme = "paper" | "cyber" | "folio" | "sand";
export type Mode = "system" | "light" | "dark";
export type Lang = "en" | "vi";

export interface TourState {
  step: number;
}

export interface UserInfo {
  id: string;
  // extended later (eligibility, usage…) — server-owned
}

export interface SqrlnestState {
  // client-persisted prefs (localStorage)
  theme: Theme;
  mode: Mode;
  lang: Lang;
  // ephemeral UI (memory only; the chatbot drives these)
  ui: {
    open: boolean;
  };
  // server-owned (mirror; filled later via Cap'n Web)
  user: UserInfo | null;
}

export interface SqrlnestGlobal {
  /** The TanStack store — use `.state`, `.setState`, `.subscribe` directly. */
  store: Store<SqrlnestState>;
  /** Thin UI sugar (optional; equivalent to setState on `ui`). */
  open(): void;
  close(): void;
  toggle(): void;
  /**
   * Switch language. Because language is URL-backed (SEO per-locale), this is a
   * navigation, not a plain state change. The landing injects the real
   * navigator (Astro ClientRouter + i18n) at init; calling setLang navigates
   * softly and the store's `lang` follows the new URL on `astro:after-swap`.
   */
  setLang(lang: Lang): void;
}

/**
 * Injected by the landing at init. Keeps this module free of Astro imports so
 * it can be copied into the chatbot repo unchanged.
 */
export interface SqrlnestInit {
  /** Soft-navigate to a URL (landing passes Astro's `navigate`). */
  navigate?: (href: string) => void;
  /** Map the current pathname to the equivalent URL in `lang`. */
  localizeCurrentPath?: (lang: Lang) => string;
}

declare global {
  interface Window {
    __sqrlnest?: SqrlnestGlobal;
  }
}

const THEME_KEY = "sqrlnest-theme";
const MODE_KEY = "sqrlnest-mode";
const LANG_KEY = "sqrlnest-lang";

const THEMES: readonly Theme[] = ["paper", "cyber", "folio", "sand"];
const MODES: readonly Mode[] = ["system", "light", "dark"];
const LANGS: readonly Lang[] = ["en", "vi"];

function readPref<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  try {
    const v = localStorage.getItem(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

/** Current language from the URL (the source of truth), e.g. "/vi/..." → "vi". */
function langFromUrl(): Lang {
  const seg = location.pathname.split("/").filter(Boolean)[0];
  return (LANGS as readonly string[]).includes(seg) ? (seg as Lang) : "en";
}

/** Apply theme/mode to the DOM exactly like the anti-FOUC inline script does. */
function applyToDom(state: SqrlnestState): void {
  document.body.setAttribute("data-astryx-theme", state.theme);
  if (state.mode === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", state.mode);
  }
}

/**
 * Create `window.__sqrlnest` once, or (if already created) just re-sync `lang`
 * from the current URL. Call it on initial load and on every `astro:after-swap`
 * so the store's language follows soft navigations.
 *
 * `init` is injected by the landing (navigate + localize helpers) so this
 * module stays free of Astro imports and is copy-paste portable to the chatbot.
 */
export function initSqrlnestStore(init: SqrlnestInit = {}): SqrlnestGlobal {
  // Already created (e.g. after a ClientRouter swap): just reconcile lang↔URL.
  if (window.__sqrlnest) {
    const existing = window.__sqrlnest;
    const urlLang = langFromUrl();
    if (existing.store.state.lang !== urlLang) {
      existing.store.setState((s) => ({ ...s, lang: urlLang }));
    }
    return existing;
  }

  const store = new Store<SqrlnestState>({
    theme: readPref(THEME_KEY, THEMES, "paper"),
    mode: readPref(MODE_KEY, MODES, "system"),
    lang: langFromUrl(),
    ui: { open: false },
    user: null,
  });

  // Persist prefs + keep the DOM in sync whenever the store changes.
  let prev = store.state;
  store.subscribe(() => {
    const s = store.state;
    if (s.theme !== prev.theme) {
      try {
        localStorage.setItem(THEME_KEY, s.theme);
      } catch {
        // storage unavailable (private mode) — DOM still updates below
      }
    }
    if (s.mode !== prev.mode) {
      try {
        localStorage.setItem(MODE_KEY, s.mode);
      } catch {
        // ignore
      }
    }

    if (s.lang !== prev.lang) {
      try {
        localStorage.setItem(LANG_KEY, s.lang);
      } catch {
        // ignore
      }
    }
    if (s.theme !== prev.theme || s.mode !== prev.mode) applyToDom(s);
    prev = s;
  });

  // Initial DOM apply (the inline anti-FOUC script already set attributes
  // before paint; this keeps them consistent with the store's resolved state).
  applyToDom(store.state);

  const api: SqrlnestGlobal = {
    store,
    open: () => store.setState((s) => ({ ...s, ui: { ...s.ui, open: true } })),
    close: () =>
      store.setState((s) => ({ ...s, ui: { ...s.ui, open: false } })),
    toggle: () =>
      store.setState((s) => ({ ...s, ui: { ...s.ui, open: !s.ui.open } })),
    setLang: (lang: Lang) => {
      // No-op if already on that language.
      if (store.state.lang === lang) return;
      // Navigate to the localized URL; the store's lang follows on after-swap.
      // If the landing did not inject a navigator (e.g. consumed standalone),
      // fall back to a full-page navigation so behavior stays correct.
      const href = init.localizeCurrentPath?.(lang);
      if (href && init.navigate) {
        init.navigate(href);
      } else if (href) {
        location.assign(href);
      } else {
        // No localize helper: at least reflect the choice in the store.
        store.setState((s) => ({ ...s, lang }));
      }
    },
  };

  window.__sqrlnest = api;
  return api;
}

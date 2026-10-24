// Central i18n config + helpers for SSG localized routing.
// defaultLocale lives at root ("/"); other locales are prefixed ("/vi/...").

export const defaultLocale = "en" as const;
export const locales = ["en", "vi"] as const;

export type Locale = (typeof locales)[number];

/** BCP47 language tag for the <html lang> attribute, per locale. */
export const htmlLang: Record<Locale, string> = {
  en: "en",
  vi: "vi",
};

/** Detect the active locale from a pathname like "/vi/docs". */
export function getLocale(pathname: string): Locale {
  const seg = pathname.split("/").filter(Boolean)[0];
  return (locales as readonly string[]).includes(seg)
    ? (seg as Locale)
    : defaultLocale;
}

/**
 * Strip the locale prefix from a pathname, returning the locale-independent
 * ("logical") path with a leading and trailing slash. Used to pair a page with
 * its equivalent in another locale (e.g. for hreflang alternates).
 *   "/vi/about/" -> "/about/"   "/about/" -> "/about/"   "/vi/" -> "/"   "/" -> "/"
 */
export function stripLocale(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length && (locales as readonly string[]).includes(parts[0]))
    parts.shift();
  return parts.length ? `/${parts.join("/")}/` : "/";
}

/**
 * Localize an internal path for a given locale.
 * - Non-internal links (http, #, mailto, etc.) are returned unchanged.
 * - defaultLocale ("en") maps to the unprefixed root ("/docs/").
 * - Other locales get a prefix ("/vi/docs/").
 * - Emits a trailing slash on the path portion to match `trailingSlash:
 *   "always"` output, so links are canonical and the ClientRouter never hits a
 *   redirect (which would force a full page reload).
 */
export function localizePath(path: string, locale: Locale): string {
  // Leave external links, anchors, and protocol-relative URLs untouched.
  if (!path.startsWith("/") || path.startsWith("//")) return path;

  // Split off a trailing anchor (e.g. "/#platform" -> base "/", hash "#platform").
  const hashIndex = path.indexOf("#");
  let base = hashIndex === -1 ? path : path.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : path.slice(hashIndex);

  // Normalize the base to have exactly one trailing slash.
  if (!base.endsWith("/")) base += "/";

  // Prefix non-default locales, avoiding double-prefix.
  if (
    locale !== defaultLocale &&
    base !== `/${locale}/` &&
    !base.startsWith(`/${locale}/`)
  ) {
    base = base === "/" ? `/${locale}/` : `/${locale}${base}`;
  }

  return base + hash;
}

import { useEffect, useRef, useState } from "react";
import { useBinaryFlicker, useTerminalBoot, type BootLine } from "../hooks";
import { defaultLocale, type Locale } from "../i18n";
import { localizePath } from "../i18n";
import { getStrings } from "../i18n/strings";

// Freeze the Yggdrasil video at 3s — before the eagle spreads its wings
// (which crops the treetop foliage), while the circuit is already lit.
const STOP_AT_SECONDS = 2.9;

const BOOT_LINES: BootLine[] = [
  {
    prefix: "$ loading",
    label: "snippet",
    status: "OK",
    color: "var(--color-data-categorical-cyan)",
  },
  {
    prefix: "$ loading",
    label: "widget",
    status: "OK",
    color: "var(--color-data-categorical-green)",
  },
  {
    prefix: "$ loading",
    label: "gadget",
    status: "OK",
    color: "var(--color-data-categorical-purple)",
  },
  {
    prefix: "$ loading",
    label: "workflow",
    status: "OK",
    color: "var(--color-data-categorical-blue)",
  },
  {
    prefix: "$ waking",
    label: "rata agent 🐿️",
    status: "READY",
    color: "var(--color-brand)",
  },
];

export default function Hero({ locale = defaultLocale }: { locale?: Locale }) {
  const t = getStrings(locale).hero;
  const waitlistCta = getStrings(locale).pricing.pro.cta;
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [agent, revealAgent] = useBinaryFlicker(t.word1);
  const [business, revealBusiness] = useBinaryFlicker(t.word2);
  // Reveal sequentially: word1 scrambles first, then word2 starts once word1
  // has locked in. useBinaryFlicker locks one char every `hold` frames
  // (default 4) at `tick` ms (default 45), so an N-char word finishes in
  // roughly (N * 4 + 4) * 45 ms. Delay word2 by word1's duration.
  const reveal = () => {
    revealAgent();
    window.setTimeout(revealBusiness, (t.word1.length * 4 + 4) * 45);
  };
  const { visible, done, play: boot } = useTerminalBoot(BOOT_LINES, 300);
  const scrambledAfterBoot = useRef(false);

  // Yggdrasil media: poster shown by default; when boot finishes we play the
  // transparent video once, then fade back to the poster.
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoActive, setVideoActive] = useState(false);
  const videoStarted = useRef(false);

  // run the boot sequence once on mount
  useEffect(() => {
    boot();
  }, []);

  // when boot finishes, reveal the headline (once)
  useEffect(() => {
    if (done && !scrambledAfterBoot.current) {
      scrambledAfterBoot.current = true;
      reveal();
    }
  }, [done]);

  // when boot finishes, start the Yggdrasil video once
  useEffect(() => {
    if (!done || videoStarted.current) return;
    videoStarted.current = true;
    // Respect prefers-reduced-motion: skip the one-shot Yggdrasil video (the
    // poster is identical to frame 0, so nothing is lost). Read matchMedia here
    // (inside the effect, after hydration) — NOT during render — otherwise the
    // server/client branch causes a hydration mismatch.
    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (prefersReducedMotion) return; // keep the static poster, no autoplay
    const v = videoRef.current;
    if (!v) return;
    // Set muted via the ref (NOT as a JSX attribute) — React does not reliably
    // reflect `muted` into server-rendered HTML, so a JSX `muted` prop causes a
    // hydration mismatch. Must be true before play() for autoplay to be allowed.
    v.muted = true;
    // Start loading/playing but DO NOT cross-fade yet. With preload="none" the
    // video has no decoded frame at this point, so fading the poster out now
    // would reveal a gap (flash) until the first frame arrives. We flip
    // videoActive only once the video is actually painting — see onPlaying.
    v.currentTime = 0;
    v.play().catch(() => {
      // autoplay blocked (e.g. reduced-motion / power saver) — keep the poster
      setVideoActive(false);
    });
  }, [done]);

  return (
    <section className="hero-grid grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center py-20 sm:py-28">
      {/* text */}
      <div>
        {/* terminal boot log */}
        <div className="font-mono text-[11px] leading-relaxed mb-6 min-h-[120px] max-w-xs">
          {visible.map((line, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-secondary">{line.prefix}</span>
              <span
                className="font-semibold"
                style={{ color: line.color ?? "var(--color-text-primary)" }}
              >
                {line.label}
              </span>
              {line.status && (
                <span className="text-brand ml-auto">[{line.status}]</span>
              )}
            </div>
          ))}
          {!done && (
            <span className="inline-block w-2 h-3.5 bg-brand animate-pulse align-middle" />
          )}
        </div>

        <h1 className="font-bold uppercase leading-[1.15] tracking-tight text-primary mb-5 text-3xl sm:text-5xl">
          {t.lead}{" "}
          <span
            className="relative inline-block text-brand cursor-default align-baseline"
            onMouseEnter={reveal}
          >
            {/* invisible placeholder reserves the word's width in the current
                theme font, so scrambled glyphs never shift layout */}
            <span aria-hidden="true" className="invisible whitespace-nowrap">
              {t.word1}
            </span>
            <span className="absolute inset-0 whitespace-nowrap tabular-nums">
              {agent}
            </span>
          </span>
          <br />
          {t.mid && <>{t.mid} </>}
          <span
            className="relative inline-block text-brand cursor-default align-baseline"
            onMouseEnter={reveal}
          >
            <span aria-hidden="true" className="invisible whitespace-nowrap">
              {t.word2}
            </span>
            <span className="absolute inset-0 whitespace-nowrap tabular-nums">
              {business}
            </span>
          </span>
          {t.tail}
        </h1>

        <p className="text-secondary text-sm leading-[1.9] max-w-lg mb-9">
          {t.paragraph}
        </p>

        {/* CTA / waitlist */}
        <div id="waitlist" style={{ scrollMarginTop: "5rem" }}>
          {joined ? (
            <p className="font-sans text-brand text-sm">{t.joined}</p>
          ) : (
            <form
              className="flex gap-3 flex-wrap items-center"
              onSubmit={(e) => {
                e.preventDefault();
                if (email.trim()) setJoined(true);
              }}
            >
              <button
                type="submit"
                className="font-sans text-[13px] font-medium uppercase tracking-[1.5px] px-6 py-3 rounded-el bg-brand-solid text-on-brand cursor-pointer hover:opacity-90 shadow-[0_2px_8px_var(--color-shadow)] hover:shadow-[0_4px_14px_var(--color-shadow)] transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-outline-color)]"
              >
                {waitlistCta}
              </button>
              {/* Secondary CTA — scrolls to the "how it works" section (Rata
                  agent / primitives) instead of linking to docs (not ready). */}
              <a
                href={localizePath("/#agents", locale)}
                className="font-sans text-[13px] font-medium uppercase tracking-[1.5px] px-6 py-3 rounded-el border border-line text-primary hover:border-brand hover:text-brand no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-outline-color)]"
              >
                {t.ctaHowItWorks}
              </a>
              {/* Docs CTA — hidden until docs are ready (pre-launch).
              <a
                href={localizePath("/docs", locale)}
                className="font-sans text-[13px] font-medium uppercase tracking-[1.5px] px-6 py-3 rounded-el border border-line text-primary hover:border-brand hover:text-brand no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-outline-color)]"
              >
                {t.ctaDocs}
              </a>
              */}
            </form>
          )}
        </div>
      </div>

      {/* Yggdrasil — poster image with a transparent video that plays once
          after the boot sequence finishes, then fades back to the poster. */}
      <div className="flex justify-center">
        <div
          className="relative aspect-square w-full max-w-[480px] max-h-[480px]"
          style={{
            filter:
              "drop-shadow(0 0 20px color-mix(in srgb, var(--color-brand) 20%, transparent)) drop-shadow(0 0 48px color-mix(in srgb, var(--color-brand) 12%, transparent))",
          }}
        >
          {/* soft brand halo behind the tree (boosted in light mode via CSS) */}
          <div className="tree-halo" aria-hidden="true" />
          {/* static poster (frame 0 of the video — seamless hand-off).
              Hidden while the video plays so the transparent video doesn't
              composite on top of it. */}
          <img
            src="/video/tree-poster.webp"
            alt="Yggdrasil — the world tree with Rata and the Norse creatures"
            width="480"
            height="480"
            fetchPriority="high"
            className="absolute inset-0 z-10 h-full w-full object-contain transition-opacity duration-500"
            style={{ opacity: videoActive ? 0 : 1 }}
          />
          {/* transparent video (VP9 webm for Chrome/FF, HEVC mov for Safari).
              preload="none": the video only plays after the ~4s boot sequence,
              so there's no reason to fetch its multi-MB payload up front — doing
              so competed with the LCP poster for bandwidth. */}
          <video
            ref={videoRef}
            playsInline
            preload="none"
            aria-hidden="true"
            onPlaying={() => {
              // First frame is on screen — now it's safe to cross-fade the
              // poster out without exposing a gap (prevents the flash).
              setVideoActive(true);
            }}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.currentTime >= STOP_AT_SECONDS) {
                v.pause();
                v.currentTime = STOP_AT_SECONDS;
              }
            }}
            className="absolute inset-0 z-10 h-full w-full object-contain transition-opacity duration-500"
            style={{ opacity: videoActive ? 1 : 0 }}
          >
            <source src="/video/tree.mov" type='video/mp4; codecs="hvc1"' />
            <source src="/video/tree.webm" type="video/webm" />
          </video>
        </div>
      </div>
    </section>
  );
}

/**
 * ProPlanCard — the interactive Pro plan card.
 *
 * Mirrors the static plan-card markup in Pricing.astro but, because its price
 * reacts to add-on toggles, it runs as a React island. Price = basePrice +
 * step × (enabled add-ons). Each add-on row shows a label, an info Tooltip, and
 * a Switch. Selected add-on ids are tracked in state so they can feed the
 * sign-up form later (currently UI-only).
 *
 * Styling uses the same Tailwind token utilities as the Astro cards
 * (bg-brand / border-line / text-secondary …) so it tracks theme + mode.
 */
import { useState } from "react";
import type { Plan } from "../i18n/strings";
import Switch from "./Switch";
import Tooltip from "./Tooltip";

interface Props {
  plan: Plan;
}

export default function ProPlanCard({ plan }: Props) {
  const addons = plan.addons ?? [];
  const base = plan.basePrice ?? 0;
  const step = plan.step ?? 0;
  const currency = plan.currency ?? "$";
  const per = plan.per ?? "";

  // Set of enabled add-on ids. Order-independent; feeds the form later.
  const [enabled, setEnabled] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setEnabled((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });

  const price = base + step * enabled.size;

  return (
    <article className="pc-card pc-sheen h-full flex flex-col px-5 py-6 rounded-box bg-transparent">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
          {plan.name}
        </h3>
      </div>

      <p className="text-2xl font-bold text-brand mb-1">
        {currency}
        {price}
        {per && (
          <span className="text-sm font-normal text-secondary">{per}</span>
        )}
      </p>
      <p className="text-[13px] text-secondary leading-relaxed mb-5 min-h-[2.5em]">
        {plan.tagline}
      </p>

      <ul className="flex flex-col gap-2 mb-6 flex-1">
        {plan.features.map((f) => (
          <li
            key={f}
            className="text-[13px] text-secondary flex items-start gap-2"
          >
            <span className="text-brand mt-0.5 shrink-0">+</span>
            <span>{f}</span>
          </li>
        ))}
        {/* Price-changing add-ons, inline with the feature list. Switch leads
            the row (in place of the "+" marker), then label + info tooltip. */}
        {addons.map((a) => (
          <li
            key={a.id}
            className="text-[13px] text-secondary flex items-start gap-2"
          >
            <span className="mt-0.5 shrink-0">
              <Switch
                checked={enabled.has(a.id)}
                onChange={() => toggle(a.id)}
                label={a.label}
              />
            </span>
            <span>
              {a.label} <Tooltip text={a.tooltip} label={a.label} />
            </span>
          </li>
        ))}
      </ul>

      <a
        href="#waitlist"
        className="font-mono text-xs text-center px-4 py-2 rounded-el border no-underline transition-colors bg-brand text-on-brand border-brand hover:opacity-90"
      >
        {plan.cta}
      </a>
    </article>
  );
}

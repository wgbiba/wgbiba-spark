import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/responsive-check")({
  head: () => ({
    meta: [
      { title: "Responsive Check — WGBIBA" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Visual checklist to verify breakpoints across navbar, hero, cards, and forms.",
      },
    ],
  }),
  component: ResponsiveCheckPage,
});

const BREAKPOINTS = [
  { label: "Desktop", w: 1280, h: 800, note: "≥ 1025px — full grid (3-up cards, full nav)" },
  { label: "Laptop", w: 1024, h: 768, note: "≤ 1024px — tighter container (20px), 80px sections" },
  { label: "Tablet", w: 960, h: 720, note: "≤ 960px — 3-up → 2-up, dashboard 1-col, 2-up KPI" },
  { label: "Phone", w: 720, h: 900, note: "≤ 720px — burger nav, 1-col grids, 44px tap targets" },
  { label: "Small phone", w: 480, h: 800, note: "≤ 480px — h1 scales down, KPI 1-col, tabs wrap" },
  { label: "iPhone SE", w: 375, h: 667, note: "Smallest common viewport" },
];

const SECTIONS = [
  {
    id: "navbar",
    title: "Navbar",
    checks: [
      "Brand mark visible at all sizes",
      "Nav links collapse to burger ≤ 720px",
      "Burger opens drawer with smooth slide animation",
      "Body scroll locked while drawer is open",
      "Drawer closes on Escape, link click, or resize",
      "Tap targets ≥ 44px on mobile",
    ],
  },
  {
    id: "hero",
    title: "Hero",
    checks: [
      "Headline scales fluidly via clamp()",
      "CTA buttons wrap on narrow screens",
      "Buttons reach 48px min-height on phones",
      "Background image stays sharp on hi-DPI",
    ],
  },
  {
    id: "cards",
    title: "Tasks / Projects / Research cards",
    checks: [
      "3-up grid → 2-up at 960px → 1-up at 720px",
      "Card padding shrinks at 720/480px",
      "Tag chips wrap, no horizontal scroll",
      "Card-link tap targets ≥ 36px on mobile",
    ],
  },
  {
    id: "filters",
    title: "Tag filters",
    checks: [
      "Filter chips wrap to multiple lines",
      "Each chip ≥ 40px tall on phones",
      "Active chip has clear visual state",
    ],
  },
  {
    id: "dashboard",
    title: "Pseudo-admin dashboard",
    checks: [
      "Form / preview side-by-side ≥ 960px, stacked < 960px",
      "Inputs use 16px font (no iOS zoom on focus)",
      "Inputs/textarea fill width, never overflow",
      "Long URLs wrap inside the JSON code block",
      "Generate / Reset buttons stack full-width on phones",
    ],
  },
  {
    id: "footer",
    title: "Footer",
    checks: [
      "3-col → 2-col at 960px → 1-col at 720px",
      "All links keyboard-focusable",
    ],
  },
];

function ResponsiveCheckPage() {
  const [vw, setVw] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 0);
  const [vh, setVh] = useState<number>(typeof window !== "undefined" ? window.innerHeight : 0);

  useEffect(() => {
    const onResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const matchedBp =
    vw === 0
      ? null
      : vw <= 480
        ? "Small phone"
        : vw <= 720
          ? "Phone"
          : vw <= 960
            ? "Tablet"
            : vw <= 1024
              ? "Laptop"
              : "Desktop";

  return (
    <div className="debug">
      <div className="debug__top">
        <Link to="/" search={{ view: "full" }} className="debug__back">
          ← Back to site
        </Link>
        <h1>Responsive checklist</h1>
        <p className="muted">
          Visual verification of key breakpoints (1024 / 960 / 720 / 480) across
          navbar, hero, cards, filters, dashboard, and footer.
        </p>
      </div>

      {/* Live viewport readout */}
      <section className="debug__env" aria-labelledby="rc-vp">
        <h2 id="rc-vp">Live viewport</h2>
        <div className="debug-row">
          <span className="debug-row__label">Width × height</span>
          <span className="debug-row__value">
            <code>
              {vw} × {vh} px
            </code>
          </span>
        </div>
        <div className="debug-row">
          <span className="debug-row__label">Active breakpoint</span>
          <span className="debug-row__value">
            <code>{matchedBp ?? "—"}</code>
          </span>
        </div>
        <div className="debug-row">
          <span className="debug-row__label">Device pixel ratio</span>
          <span className="debug-row__value">
            <code>{typeof window !== "undefined" ? window.devicePixelRatio : "—"}</code>
          </span>
        </div>
      </section>

      {/* Breakpoint reference table */}
      <section className="debug__env" aria-labelledby="rc-bp">
        <h2 id="rc-bp">Breakpoints reference</h2>
        {BREAKPOINTS.map((bp) => {
          const active = bp.label === matchedBp;
          return (
            <div
              key={bp.label}
              className="debug-row"
              style={{
                background: active ? "var(--c-accent-soft)" : undefined,
                borderRadius: 6,
                padding: "8px 10px",
              }}
            >
              <span className="debug-row__label">
                {bp.label} {active ? "← now" : ""}
              </span>
              <span className="debug-row__value">
                <code>
                  {bp.w} × {bp.h}
                </code>{" "}
                — {bp.note}
              </span>
            </div>
          );
        })}
      </section>

      {/* Section-by-section checklist */}
      {SECTIONS.map((s) => (
        <section key={s.id} className="debug-card" style={{ marginBottom: 18 }}>
          <div className="debug-card__head">
            <h2>{s.title}</h2>
            <span className="badge">{s.checks.length} CHECKS</span>
          </div>
          <ul className="debug-checklist" role="list">
            {s.checks.map((c, i) => (
              <li key={i} className="check">
                <span aria-hidden="true">☐</span>
                <span>{c}</span>
                <span className="muted small">manual</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* Quick-jump links to verify each section live */}
      <section className="debug__env" aria-labelledby="rc-jump">
        <h2 id="rc-jump">Open live sections</h2>
        <p className="muted small" style={{ marginBottom: 14 }}>
          Resize the browser to each breakpoint, then jump to a section to verify it.
        </p>
        <div className="debug-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link to="/" search={{ view: "full" }} hash="hero" className="btn btn-outline">
            Hero
          </Link>
          <Link to="/" search={{ view: "full" }} hash="tasks" className="btn btn-outline">
            Tasks
          </Link>
          <Link to="/" search={{ view: "full" }} hash="projects" className="btn btn-outline">
            Projects
          </Link>
          <Link to="/" search={{ view: "full" }} hash="research" className="btn btn-outline">
            Research
          </Link>
          <Link to="/dashboard" className="btn btn-outline">
            Dashboard
          </Link>
          <Link to="/debug" className="btn btn-outline">
            Debug
          </Link>
        </div>
      </section>
    </div>
  );
}

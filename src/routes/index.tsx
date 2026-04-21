import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useDataset, type DatasetState } from "@/lib/data";
import { DataStatusWidget } from "@/components/DataStatusWidget";
import { useI18n, LANGS, type Lang } from "@/lib/i18n";
import heroImage from "@/assets/hero.jpg";

const HERO_IMAGE = heroImage;

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    view: search.view === "landing" ? ("landing" as const) : ("full" as const),
  }),
  head: () => ({
    meta: [
      {
        title:
          "WGBIBA – Business Informatics & Analytics | BTU Cottbus–Senftenberg",
      },
      {
        name: "description",
        content:
          "WGBIBA at Brandenburg University of Technology Cottbus–Senftenberg — research and teaching in business informatics, data analytics, optimization, and software development.",
      },
      { name: "keywords", content: "WGBIBA, BTU Cottbus, business informatics, business analytics, data analytics, optimization, software development, research group" },
      { name: "author", content: "WGBIBA, BTU Cottbus–Senftenberg" },
      { name: "theme-color", content: "#0b2545" },
      { name: "robots", content: "index, follow" },
      // Open Graph
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "WGBIBA" },
      { property: "og:title", content: "WGBIBA – Business Informatics & Analytics" },
      {
        property: "og:description",
        content:
          "Research and teaching group at BTU Cottbus–Senftenberg focused on data analytics, optimization, and software development.",
      },
      { property: "og:image", content: HERO_IMAGE },
      { property: "og:image:alt", content: "WGBIBA — academic research and analytics" },
      { property: "og:locale", content: "en_US" },
      // Twitter
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "WGBIBA – Business Informatics & Analytics" },
      {
        name: "twitter:description",
        content:
          "Research and teaching at BTU Cottbus–Senftenberg in data analytics, optimization, and software development.",
      },
      { name: "twitter:image", content: HERO_IMAGE },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap",
      },
      { rel: "canonical", href: "/" },
    ],
  }),
  component: Index,
});

/* ---------------- Types ---------------- */
type TaskLink = { label: string; url: string };
type Task = {
  title: string;
  description?: string;
  tag?: string;
  date?: string;
  links?: TaskLink[];
};
type Project = {
  title: string;
  description?: string;
  stack?: string[];
  github?: string;
  demo?: string;
};
type Research = {
  title: string;
  abstract?: string;
  type?: string;
  year?: string;
  link?: string;
};

/* ---------------- Reveal-on-scroll hook ---------------- */
function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal:not(.visible)").forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ---------------- Page ---------------- */
function Index() {
  const { view } = Route.useSearch();
  const isLanding = view === "landing";
  const { lang, setLang, t } = useI18n();

  const tasks = useDataset<Task>("/data/tasks.json");
  const projects = useDataset<Project>("/data/projects.json");
  const research = useDataset<Research>("/data/research.json");
  const [activeTag, setActiveTag] = useState<string>("All");
  const [scrolled, setScrolled] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  // Scrolled navbar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while mobile drawer is open + close on Escape / resize
  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("nav-open");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > 720) setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove("nav-open");
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [navOpen]);

  useReveal([
    tasks.status,
    projects.status,
    research.status,
    activeTag,
    isLanding,
  ]);

  const taskItems = tasks.status === "ok" ? tasks.data : [];
  const tags = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(taskItems.map((t) => t.tag).filter(Boolean) as string[]),
      ),
    ],
    [taskItems],
  );
  const filteredTasks = useMemo(
    () =>
      activeTag === "All"
        ? taskItems
        : taskItems.filter((t) => t.tag === activeTag),
    [taskItems, activeTag],
  );

  const closeNav = () => setNavOpen(false);

  return (
    <>
      <a href="#main" className="skip-link">{t.nav.skip}</a>

      {/* NAVBAR */}
      <header className={`navbar${scrolled ? " scrolled" : ""}`} role="banner">
        <div className="container nav-inner">
          <a href="#hero" className="brand" onClick={closeNav} aria-label="WGBIBA — go to top">
            <span className="brand-mark" aria-hidden="true">WG</span>
            <span className="brand-text">BIBA</span>
            <span className="brand-tag" aria-hidden="true">/dept</span>
          </a>
          <nav
            className={`nav-links${navOpen ? " open" : ""}`}
            id="primary-navigation"
            aria-label="Primary"
          >
            <a href="#about" onClick={closeNav}>
              <span className="nav-num" aria-hidden="true">01</span>
              <span>{t.nav.about}</span>
            </a>
            {!isLanding && (
              <>
                <a href="#tasks" onClick={closeNav}>
                  <span className="nav-num" aria-hidden="true">02</span>
                  <span>{t.nav.tasks}</span>
                </a>
                <a href="#projects" onClick={closeNav}>
                  <span className="nav-num" aria-hidden="true">03</span>
                  <span>{t.nav.projects}</span>
                </a>
                <a href="#research" onClick={closeNav}>
                  <span className="nav-num" aria-hidden="true">04</span>
                  <span>{t.nav.research}</span>
                </a>
                <Link to="/dashboard" onClick={closeNav}>
                  <span className="nav-num" aria-hidden="true">05</span>
                  <span>{t.nav.dashboard}</span>
                </Link>
              </>
            )}
            <a href="#contact" onClick={closeNav}>
              <span className="nav-num" aria-hidden="true">{isLanding ? "02" : "06"}</span>
              <span>{t.nav.contact}</span>
            </a>
            <a
              href="https://github.com/wgbiba"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-cta"
              onClick={closeNav}
              aria-label="WGBIBA on GitHub (opens in new tab)"
            >
              <span aria-hidden="true">↗</span>&nbsp;{t.nav.github}
            </a>
            <div className="lang-switch" role="group" aria-label={t.nav.language}>
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className={`lang-switch__btn${lang === l.code ? " active" : ""}`}
                  onClick={() => setLang(l.code as Lang)}
                  aria-pressed={lang === l.code}
                  aria-label={l.label}
                  title={l.label}
                >
                  {l.native}
                </button>
              ))}
            </div>
          </nav>
          <button
            type="button"
            className="nav-toggle"
            aria-label={navOpen ? t.nav.close : t.nav.open}
            aria-expanded={navOpen}
            aria-controls="primary-navigation"
            onClick={() => setNavOpen((o) => !o)}
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </button>
        </div>
      </header>

      <main id="main">
        {/* HERO */}
        <section
          id="hero"
          className="hero"
          aria-labelledby="hero-title"
          role="region"
          style={{ ["--hero-image" as never]: `url(${heroImage})` }}
        >
          <div className="hero-overlay" aria-hidden="true"></div>
          <div className="container hero-content reveal">
            <p className="eyebrow">{t.hero.eyebrow}</p>
            <h1 id="hero-title">{t.hero.title}</h1>
            <p className="lead">{t.hero.lead}</p>
            <div className="hero-cta">
              <a
                href={isLanding ? "#contact" : "#projects"}
                className="btn btn-primary"
              >
                {isLanding ? t.hero.ctaPrimaryLanding : t.hero.ctaPrimaryFull}
              </a>
              <a href="#about" className="btn btn-ghost">{t.hero.ctaSecondary}</a>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="section" aria-labelledby="about-title">
          <div className="container">
            <div className="section-head reveal">
              <span className="kicker">{t.about.kicker}</span>
              <h2 id="about-title">{t.about.title}</h2>
              <p className="muted">{t.about.intro}</p>
            </div>
            <ul className="chip-strip reveal" aria-label={t.about.focus}>
              {t.about.pillars.map((p) => (
                <li key={p.num}>
                  <span className="chip-strip__num" aria-hidden="true">{p.num}</span>
                  <span className="chip-strip__name">{p.name}</span>
                  <span className="chip-strip__meta">{p.meta}</span>
                </li>
              ))}
            </ul>

            <dl className="kpi-row reveal" aria-label="Group at a glance">
              <div>
                <dt>{t.about.kpiDept}</dt>
                <dd>{t.about.kpiDeptValue}</dd>
              </div>
              <div>
                <dt>{t.about.kpiFaculty}</dt>
                <dd>{t.about.kpiFacultyValue}</dd>
              </div>
              <div>
                <dt>{t.about.kpiStack}</dt>
                <dd>Python · R · TypeScript · MILP · ML</dd>
              </div>
              <div>
                <dt>{t.about.kpiOpenSource}</dt>
                <dd>
                  <a
                    href="https://github.com/wgbiba"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    github.com/wgbiba
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {!isLanding && (
          <>
            {/* TASKS */}
            <section id="tasks" className="section section-alt" aria-labelledby="tasks-title">
              <div className="container">
                <div className="section-head reveal">
                  <span className="kicker">{t.tasks.kicker}</span>
                  <h2 id="tasks-title">{t.tasks.title}</h2>
                  <p className="muted">{t.tasks.intro}</p>
                </div>
                {tasks.status === "ok" && tasks.data.length > 0 && (
                  <div
                    className="filters"
                    role="group"
                    aria-label={t.tasks.filterAria}
                  >
                    {tags.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        className={`filter-btn${tag === activeTag ? " active" : ""}`}
                        aria-pressed={tag === activeTag}
                        onClick={() => setActiveTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
                <div className="grid grid-3" aria-live="polite" aria-busy={tasks.status === "loading"}>
                  <DataState
                    state={tasks}
                    empty="No tasks have been published yet."
                    items={filteredTasks}
                    render={(task, i) => <TaskCard key={i} task={task} />}
                    filterEmpty="No tasks match this filter."
                    isFiltered={activeTag !== "All"}
                  />
                </div>
              </div>
            </section>

            {/* PROJECTS */}
            <section id="projects" className="section" aria-labelledby="projects-title">
              <div className="container">
                <div className="section-head reveal">
                  <span className="kicker">{t.projects.kicker}</span>
                  <h2 id="projects-title">{t.projects.title}</h2>
                  <p className="muted">{t.projects.intro}</p>
                </div>
                <div className="grid grid-3" aria-live="polite" aria-busy={projects.status === "loading"}>
                  <DataState
                    state={projects}
                    empty="No projects available yet."
                    items={projects.data}
                    render={(p, i) => <ProjectCard key={i} project={p} />}
                  />
                </div>
              </div>
            </section>

            {/* RESEARCH */}
            <section id="research" className="section section-alt" aria-labelledby="research-title">
              <div className="container">
                <div className="section-head reveal">
                  <span className="kicker">{t.research.kicker}</span>
                  <h2 id="research-title">{t.research.title}</h2>
                  <p className="muted">{t.research.intro}</p>
                </div>
                <div className="grid grid-2" aria-live="polite" aria-busy={research.status === "loading"}>
                  <DataState
                    state={research}
                    empty="No research entries yet."
                    items={research.data}
                    render={(r, i) => <ResearchCard key={i} item={r} />}
                  />
                </div>
              </div>
            </section>


            {/* DASHBOARD CTA — link to dedicated page */}
            <section
              id="dashboard-cta"
              className="section"
              aria-labelledby="dashboard-cta-title"
            >
              <div className="container">
                <div className="section-head reveal">
                  <span className="kicker">{t.dashCta.kicker}</span>
                  <h2 id="dashboard-cta-title">{t.dashCta.title}</h2>
                  <p className="muted">{t.dashCta.intro}</p>
                </div>
                <div className="reveal" style={{ textAlign: "center" }}>
                  <Link to="/dashboard" className="btn btn-primary">
                    {t.dashCta.button}
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}

        {/* CONTACT CTA */}
        <section
          id="contact"
          className="cta"
          aria-labelledby="contact-title"
        >
          <div className="container cta-inner reveal">
            <span className="kicker" style={{ color: "rgba(255,255,255,0.85)" }}>
              {t.contact.kicker}
            </span>
            <h2 id="contact-title">{t.contact.title}</h2>
            <p>{t.contact.intro}</p>
            <div className="cta-actions">
              <a
                className="btn btn-light"
                href="mailto:wgbiba.dept@gmail.com?subject=Inquiry%20to%20WGBIBA"
                aria-label="Send an email to WGBIBA"
              >
                {t.contact.emailBtn}
              </a>
              <a
                className="btn btn-ghost"
                href="https://github.com/wgbiba"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit WGBIBA on GitHub"
              >
                {t.contact.githubBtn}
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer" role="contentinfo">
        <div className="container footer-inner">
          <div>
            <div className="brand brand-light">
              <span className="brand-mark" aria-hidden="true">WG</span>
              <span className="brand-text">BIBA</span>
            </div>
            <p className="muted small">
              Business Informatics &amp; Analytics<br />
              Brandenburg University of Technology Cottbus–Senftenberg
            </p>
          </div>
          <div>
            <h2 style={{ color: "#fff", fontSize: "0.95rem", marginBottom: 12 }}>{t.footer.contact}</h2>
            <p className="small">
              <a href="mailto:wgbiba.dept@gmail.com">wgbiba.dept@gmail.com</a>
            </p>
            <p className="small">
              <a href="https://github.com/wgbiba" target="_blank" rel="noopener noreferrer">
                github.com/wgbiba
              </a>
            </p>
          </div>
          <div>
            <h2 style={{ color: "#fff", fontSize: "0.95rem", marginBottom: 12 }}>{t.footer.address}</h2>
            <address className="small" style={{ fontStyle: "normal" }}>
              Konrad-Wachsmann-Allee<br />
              03046 Cottbus, Germany
            </address>
          </div>
        </div>
        <div className="container foot-bottom">
          <p className="small muted">
            © {new Date().getFullYear()} WGBIBA · BTU Cottbus–Senftenberg. {t.footer.rights}
          </p>
        </div>
      </footer>

      {!isLanding && (
        <DataStatusWidget
          feeds={[
            { label: "/data/tasks.json", state: tasks },
            { label: "/data/projects.json", state: projects },
            { label: "/data/research.json", state: research },
          ]}
        />
      )}
    </>
  );
}

/* ---------------- DataState helper ---------------- */
function DataState<T, U>({
  state,
  items,
  render,
  empty,
  filterEmpty,
  isFiltered,
}: {
  state: DatasetState<T>;
  items: U[];
  render: (item: U, index: number) => React.ReactNode;
  empty: string;
  filterEmpty?: string;
  isFiltered?: boolean;
}) {
  if (state.status === "loading") {
    return (
      <>
        <div className="skeleton-card" aria-hidden="true" />
        <div className="skeleton-card" aria-hidden="true" />
        <div className="skeleton-card" aria-hidden="true" />
        <span className="sr-only">Loading content…</span>
      </>
    );
  }
  if (state.status === "error") {
    return (
      <div className="state error" role="alert">
        <h3>Couldn't load this section</h3>
        <p className="small">
          We tried <code>{state.url}</code> but the request failed.
        </p>
        <pre className="state__detail">{state.error}</pre>
        <div className="state__actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={state.refetch}
          >
            ↻ Retry
          </button>
          <a
            className="btn btn-outline"
            href={state.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open URL
          </a>
        </div>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="state">
        <p className="muted">{isFiltered && filterEmpty ? filterEmpty : empty}</p>
      </div>
    );
  }
  return <>{items.map(render)}</>;
}

/* ---------------- Card components ---------------- */
function TaskCard({ task }: { task: Task }) {
  return (
    <article className="card reveal" aria-label={task.title || "Task"}>
      <div className="meta">
        {task.tag && <span className="tag">{task.tag}</span>}
        {task.date && <span>{task.date}</span>}
      </div>
      <h3>{task.title || "Untitled task"}</h3>
      <p className="muted small">{task.description || ""}</p>
      {task.links && task.links.length > 0 && (
        <div className="card-links">
          {task.links.map((l, i) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${l.label} (opens in new tab)`}
            >
              {l.label} →
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="card reveal" aria-label={project.title || "Project"}>
      <h3>{project.title || "Untitled project"}</h3>
      <p className="muted small">{project.description || ""}</p>
      {project.stack && project.stack.length > 0 && (
        <div className="meta" aria-label="Tech stack">
          {project.stack.map((s, i) => (
            <span key={i} className="tag">{s}</span>
          ))}
        </div>
      )}
      <div className="card-links">
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${project.title} on GitHub (opens in new tab)`}
          >
            GitHub →
          </a>
        )}
        {project.demo && (
          <a
            href={project.demo}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${project.title} demo (opens in new tab)`}
          >
            Demo →
          </a>
        )}
      </div>
    </article>
  );
}

function ResearchCard({ item }: { item: Research }) {
  return (
    <article className="card reveal" aria-label={item.title || "Research item"}>
      <div className="meta">
        {item.type && <span className="tag">{item.type}</span>}
        {item.year && <span>{item.year}</span>}
      </div>
      <h3>{item.title}</h3>
      <p className="muted small">{item.abstract || ""}</p>
      {item.link && (
        <div className="card-links">
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Read more about ${item.title} (opens in new tab)`}
          >
            Read more →
          </a>
        </div>
      )}
    </article>
  );
}


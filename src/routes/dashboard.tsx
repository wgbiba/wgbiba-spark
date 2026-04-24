import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { assetUrl } from "@/lib/data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Content Dashboard – WGBIBA" },
      {
        name: "description",
        content:
          "Pseudo-admin dashboard for WGBIBA: generate JSON snippets for new tasks and projects to paste into the GitHub repo. No data is stored.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Content Dashboard – WGBIBA" },
      {
        property: "og:description",
        content:
          "Generate JSON for new tasks and projects to paste into the GitHub repo.",
      },
    ],
  }),
  component: DashboardPage,
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
const DASHBOARD_PASSWORD = "1234";
const DASHBOARD_AUTH_KEY = "wgbiba.dashboard-auth";

function DashboardGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(DASHBOARD_AUTH_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (unlocked) return <>{children}</>;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === DASHBOARD_PASSWORD) {
      try {
        sessionStorage.setItem(DASHBOARD_AUTH_KEY, "1");
      } catch {
        // ignore
      }
      setUnlocked(true);
      setError(null);
    } else {
      setError("Incorrect password.");
    }
  };

  return (
    <main
      id="main"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <form
        onSubmit={onSubmit}
        className="form"
        aria-label="Dashboard password"
        style={{
          maxWidth: 360,
          width: "100%",
          padding: 24,
          border: "1px solid var(--c-border)",
          borderRadius: 12,
          background: "#fff",
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: "1.2rem" }}>Dashboard locked 🔒</h1>
        <p className="muted small" style={{ marginTop: 0 }}>
          Enter the password to access the Content Dashboard.
        </p>
        <div className="field">
          <label htmlFor="dash-pw">Password</label>
          <input
            id="dash-pw"
            type="password"
            value={pw}
            autoFocus
            onChange={(e) => {
              setPw(e.target.value);
              if (error) setError(null);
            }}
            placeholder="••••"
          />
        </div>
        {error && (
          <p className="kb-chat-error" role="alert" style={{ marginTop: 8 }}>
            {error}
          </p>
        )}
        <div className="form-actions" style={{ marginTop: 12 }}>
          <button type="submit" className="btn btn-primary">
            Unlock
          </button>
          <Link to="/" search={{ view: "full" }} className="btn btn-outline">
            ← Back to home
          </Link>
        </div>
      </form>
    </main>
  );
}

function DashboardPage() {
  return (
    <DashboardGate>
      <DashboardPageInner />
    </DashboardGate>
  );
}

function DashboardPageInner() {
  const [activeTab, setActiveTab] = useState<"task" | "project" | "research">("task");

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      {/* NAVBAR */}
      <header className="navbar scrolled" role="banner">
        <div className="container nav-inner">
          <Link
            to="/"
            search={{ view: "full" }}
            className="brand"
            aria-label="WGBIBA — go to home"
          >
            <span className="brand-mark" aria-hidden="true">WG</span>
            <span className="brand-text">BIBA</span>
            <span className="brand-tag" aria-hidden="true">/admin</span>
          </Link>
          <nav className="nav-links" aria-label="Primary">
            <Link to="/" search={{ view: "full" }}>
              <span className="nav-num" aria-hidden="true">←</span>
              <span>Home</span>
            </Link>
            <Link to="/" search={{ view: "full" }} hash="tasks">
              <span className="nav-num" aria-hidden="true">02</span>
              <span>Tasks</span>
            </Link>
            <Link to="/" search={{ view: "full" }} hash="projects">
              <span className="nav-num" aria-hidden="true">03</span>
              <span>Projects</span>
            </Link>
            <Link to="/dashboard" activeProps={{ className: "active" }}>
              <span className="nav-num" aria-hidden="true">05</span>
              <span>Dashboard</span>
            </Link>
            <a
              href="https://github.com/wgbiba"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-cta"
              aria-label="WGBIBA on GitHub (opens in new tab)"
            >
              <span aria-hidden="true">↗</span>&nbsp;GitHub
            </a>
          </nav>
        </div>
      </header>

      <main id="main">
        <section
          id="dashboard"
          className="section"
          aria-labelledby="dashboard-title"
          style={{ paddingTop: "120px" }}
        >
          <div className="container">
            <div className="section-head">
              <span className="kicker">Pseudo Admin</span>
              <h1 id="dashboard-title">Content Dashboard</h1>
              <p className="muted">
                Generate JSON snippets for new tasks and projects. Nothing is
                stored — copy the output and paste it into the corresponding
                file in the GitHub repo.
              </p>
            </div>

            <div className="dash-instructions">
              <strong>How it works</strong>
              <ol>
                <li>Fill in the form below.</li>
                <li>
                  Click <em>Generate JSON</em> and review the live preview.
                </li>
                <li>
                  Copy the JSON and paste it into{" "}
                  <code>public/data/tasks.json</code> or{" "}
                  <code>public/data/projects.json</code> on GitHub.
                </li>
              </ol>
              <div className="dash-actions">
                <a
                  className="btn btn-outline btn-small"
                  href="https://github.com/wgbiba/wgbiba/edit/main/public/data/tasks.json"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ✎ Edit tasks.json on GitHub
                </a>
                <a
                  className="btn btn-outline btn-small"
                  href="https://github.com/wgbiba/wgbiba/edit/main/public/data/projects.json"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ✎ Edit projects.json on GitHub
                </a>
                <a
                  className="btn btn-outline btn-small"
                  href="https://github.com/wgbiba/wgbiba/edit/main/public/data/research.json"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ✎ Edit research.json on GitHub
                </a>
              </div>
            </div>

            <div
              className="dash-tabs"
              role="tablist"
              aria-label="Dashboard sections"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "task"}
                aria-controls="panel-task"
                id="tab-task"
                className={`tab${activeTab === "task" ? " active" : ""}`}
                onClick={() => setActiveTab("task")}
              >
                Add Task
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "project"}
                aria-controls="panel-project"
                id="tab-project"
                className={`tab${activeTab === "project" ? " active" : ""}`}
                onClick={() => setActiveTab("project")}
              >
                Add Project
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "research"}
                aria-controls="panel-research"
                id="tab-research"
                className={`tab${activeTab === "research" ? " active" : ""}`}
                onClick={() => setActiveTab("research")}
              >
                Add Research
              </button>
            </div>

            {activeTab === "task" && <TaskDashboard />}
            {activeTab === "project" && <ProjectDashboard />}
            {activeTab === "research" &&
              (typeof ResearchDashboard === "function" ? (
                <ResearchDashboard />
              ) : (
                <p className="kb-chat-error">
                  ResearchDashboard component failed to load. Please restart the
                  dev server (see DEV-CHECKLIST.md).
                </p>
              ))}
          </div>
        </section>
      </main>

      <footer className="footer" role="contentinfo">
        <div className="container foot-bottom">
          <p className="small muted">
            © {new Date().getFullYear()} WGBIBA · BTU Cottbus–Senftenberg.
          </p>
        </div>
      </footer>
    </>
  );
}

/* ---------------- Card previews ---------------- */
function TaskCard({ task }: { task: Task }) {
  return (
    <article className="card" aria-label={task.title || "Task"}>
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
    <article className="card" aria-label={project.title || "Project"}>
      <h3>{project.title || "Untitled project"}</h3>
      <p className="muted small">{project.description || ""}</p>
      {project.stack && project.stack.length > 0 && (
        <div className="meta" aria-label="Tech stack">
          {project.stack.map((s, i) => (
            <span key={i} className="tag">
              {s}
            </span>
          ))}
        </div>
      )}
      <div className="card-links">
        {project.github && (
          <a href={project.github} target="_blank" rel="noopener noreferrer">
            GitHub →
          </a>
        )}
        {project.demo && (
          <a href={project.demo} target="_blank" rel="noopener noreferrer">
            Demo →
          </a>
        )}
      </div>
    </article>
  );
}

/* ---------------- Helpers ---------------- */
function parseLinks(text: string): TaskLink[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, url] = line.split("|").map((s) => (s || "").trim());
      return { label: label || "Link", url: url || "#" };
    });
}

function CopyButton({
  getText,
  label,
}: {
  getText: () => string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("Copy failed — please copy manually.");
    }
  };
  return (
    <button
      type="button"
      className="btn btn-small"
      onClick={onClick}
      aria-label={`Copy ${label} to clipboard`}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

/* ---------------- Task Dashboard ---------------- */
function TaskDashboard() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    tag: "",
    date: "",
    links: "",
  });
  const [json, setJson] = useState<string>("// JSON will appear here");
  const jsonRef = useRef<string>("// JSON will appear here");
  jsonRef.current = json;

  const taskObj: Task = useMemo(
    () => ({
      title: form.title,
      description: form.description,
      tag: form.tag,
      date: form.date,
      links: parseLinks(form.links),
    }),
    [form],
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJson(JSON.stringify(taskObj, null, 2));
  };

  const handleReset = () =>
    setForm({ title: "", description: "", tag: "", date: "", links: "" });

  return (
    <div
      className="dash-panel active"
      id="panel-task"
      role="tabpanel"
      aria-labelledby="tab-task"
    >
      <div className="dash-grid">
        <form
          className="form"
          onSubmit={handleSubmit}
          aria-label="New task form"
        >
          <div className="field">
            <label htmlFor="task-title">Title</label>
            <input
              id="task-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Sixth Assignment – ..."
              required
            />
          </div>
          <div className="field">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              placeholder="Short summary of the task..."
            />
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="task-tag">Course / Tag</label>
              <input
                id="task-tag"
                name="tag"
                value={form.tag}
                onChange={handleChange}
                placeholder="Optimization"
              />
            </div>
            <div className="field">
              <label htmlFor="task-date">Date</label>
              <input
                id="task-date"
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="task-links">
              Links (one per line, format: <code>Label | https://url</code>)
            </label>
            <textarea
              id="task-links"
              name="links"
              rows={3}
              value={form.links}
              onChange={handleChange}
              placeholder={
                "Task PDF | https://example.com/task.pdf\nSolution | https://github.com/..."
              }
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Generate JSON
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </form>

        <div className="dash-preview">
          <div>
            <h4>Live Preview</h4>
            <div className="preview-area">
              {taskObj.title ? (
                <TaskCard task={taskObj} />
              ) : (
                <p className="muted small">
                  Fill in the form to preview the task card.
                </p>
              )}
            </div>
          </div>
          <div>
            <div className="json-head">
              <h4>Generated JSON</h4>
              <CopyButton
                getText={() => jsonRef.current}
                label="task JSON"
              />
            </div>
            <pre
              className="code-block"
              aria-label="Generated task JSON"
            >
              <code>{json}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Project Dashboard ---------------- */
function ProjectDashboard() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    stack: "",
    github: "",
    demo: "",
  });
  const [json, setJson] = useState<string>("// JSON will appear here");
  const jsonRef = useRef<string>("// JSON will appear here");
  jsonRef.current = json;

  const projectObj: Project = useMemo(
    () => ({
      title: form.title,
      description: form.description,
      stack: form.stack
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      github: form.github,
      demo: form.demo,
    }),
    [form],
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJson(JSON.stringify(projectObj, null, 2));
  };

  const handleReset = () =>
    setForm({ title: "", description: "", stack: "", github: "", demo: "" });

  return (
    <div
      className="dash-panel active"
      id="panel-project"
      role="tabpanel"
      aria-labelledby="tab-project"
    >
      <div className="dash-grid">
        <form
          className="form"
          onSubmit={handleSubmit}
          aria-label="New project form"
        >
          <div className="field">
            <label htmlFor="proj-title">Title</label>
            <input
              id="proj-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Optimization Toolkit"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="proj-description">Description</label>
            <textarea
              id="proj-description"
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              placeholder="What does the project do?"
            />
          </div>
          <div className="field">
            <label htmlFor="proj-stack">Tech Stack (comma separated)</label>
            <input
              id="proj-stack"
              name="stack"
              value={form.stack}
              onChange={handleChange}
              placeholder="Python, FastAPI, React"
            />
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="proj-github">GitHub Link</label>
              <input
                id="proj-github"
                type="url"
                name="github"
                value={form.github}
                onChange={handleChange}
                placeholder="https://github.com/..."
              />
            </div>
            <div className="field">
              <label htmlFor="proj-demo">Demo Link (optional)</label>
              <input
                id="proj-demo"
                type="url"
                name="demo"
                value={form.demo}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Generate JSON
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </form>

        <div className="dash-preview">
          <div>
            <h4>Live Preview</h4>
            <div className="preview-area">
              {projectObj.title ? (
                <ProjectCard project={projectObj} />
              ) : (
                <p className="muted small">
                  Fill in the form to preview the project card.
                </p>
              )}
            </div>
          </div>
          <div>
            <div className="json-head">
              <h4>Generated JSON</h4>
              <CopyButton
                getText={() => jsonRef.current}
                label="project JSON"
              />
            </div>
            <pre
              className="code-block"
              aria-label="Generated project JSON"
            >
              <code>{json}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Research card ---------------- */
function ResearchCard({ research }: { research: Research }) {
  return (
    <article className="card" aria-label={research.title || "Research"}>
      <div className="meta">
        {research.type && <span className="tag">{research.type}</span>}
        {research.year && <span>{research.year}</span>}
      </div>
      <h3>{research.title || "Untitled research"}</h3>
      <p className="muted small">{research.abstract || ""}</p>
      {research.link && (
        <div className="card-links">
          <a href={research.link} target="_blank" rel="noopener noreferrer">
            View paper →
          </a>
        </div>
      )}
    </article>
  );
}

/* ---------------- Research Dashboard ---------------- */
function ResearchDashboard() {
  const [form, setForm] = useState({
    title: "",
    abstract: "",
    type: "",
    year: "",
    link: "",
  });
  const [json, setJson] = useState<string>("// JSON will appear here");
  const jsonRef = useRef<string>("// JSON will appear here");
  jsonRef.current = json;

  // Dev probe: log the research data source so it's obvious whether the
  // Research tab is wired to the expected /data/research.json file.
  useEffect(() => {
    const url = assetUrl("/data/research.json");
    // eslint-disable-next-line no-console
    console.info("[ResearchDashboard] mounted — data source:", url);
    fetch(url, { cache: "no-store" })
      .then(async (r) => {
        const ct = r.headers.get("content-type") || "";
        let count: number | string = "n/a";
        if (r.ok && ct.includes("json")) {
          try {
            const parsed = (await r.json()) as unknown;
            count = Array.isArray(parsed) ? parsed.length : "not-array";
          } catch {
            count = "parse-error";
          }
        }
        // eslint-disable-next-line no-console
        console.info(
          `[ResearchDashboard] fetch ${url} — status=${r.status} content-type="${ct}" items=${count}`,
        );
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn(`[ResearchDashboard] fetch ${url} failed:`, e);
      });
  }, []);

  const researchObj: Research = useMemo(
    () => ({
      title: form.title,
      abstract: form.abstract,
      type: form.type,
      year: form.year,
      link: form.link,
    }),
    [form],
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJson(JSON.stringify(researchObj, null, 2));
  };

  const handleReset = () =>
    setForm({ title: "", abstract: "", type: "", year: "", link: "" });

  return (
    <div
      className="dash-panel active"
      id="panel-research"
      role="tabpanel"
      aria-labelledby="tab-research"
    >
      <div className="dash-grid">
        <form
          className="form"
          onSubmit={handleSubmit}
          aria-label="New research form"
        >
          <div className="field">
            <label htmlFor="res-title">Title</label>
            <input
              id="res-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Paper title"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="res-abstract">Abstract</label>
            <textarea
              id="res-abstract"
              name="abstract"
              rows={4}
              value={form.abstract}
              onChange={handleChange}
              placeholder="Brief summary of the research question, methodology, and key findings..."
            />
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="res-type">Type</label>
              <input
                id="res-type"
                name="type"
                value={form.type}
                onChange={handleChange}
                placeholder="Journal Paper / Conference / Thesis"
              />
            </div>
            <div className="field">
              <label htmlFor="res-year">Year</label>
              <input
                id="res-year"
                name="year"
                value={form.year}
                onChange={handleChange}
                placeholder="2025"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="res-link">Link</label>
            <input
              id="res-link"
              type="url"
              name="link"
              value={form.link}
              onChange={handleChange}
              placeholder="https://example.com/your-paper"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Generate JSON
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </form>

        <div className="dash-preview">
          <div>
            <h4>Live Preview</h4>
            <div className="preview-area">
              {researchObj.title ? (
                <ResearchCard research={researchObj} />
              ) : (
                <p className="muted small">
                  Fill in the form to preview the research card.
                </p>
              )}
            </div>
          </div>
          <div>
            <div className="json-head">
              <h4>Generated JSON</h4>
              <CopyButton
                getText={() => jsonRef.current}
                label="research JSON"
              />
            </div>
            <pre
              className="code-block"
              aria-label="Generated research JSON"
            >
              <code>{json}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

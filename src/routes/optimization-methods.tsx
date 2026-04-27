import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

/**
 * Long-form article: a complete, beginner-to-advanced guide to optimization
 * methods. Designed to be read top-to-bottom by someone learning the subject
 * for the first time, with inline numeric citations [1], [2]... resolved
 * against a bibliography at the bottom of the page.
 *
 * Sources combine the books bundled with this site (Rao; Iqbal;
 * Parkinson, Balling & Hedengren; Nocedal & Wright; Bonnans et al.) with
 * peer-reviewed surveys retrieved from the open web.
 */

export const Route = createFileRoute("/optimization-methods")({
  head: () => ({
    meta: [
      {
        title:
          "Optimization Methods — A Complete Guide from Foundations to Metaheuristics | WGBIBA",
      },
      {
        name: "description",
        content:
          "An end-to-end article on optimization methods: problem formulation, convexity, linear programming, the simplex and interior-point methods, unconstrained and constrained nonlinear optimization, KKT conditions, integer and combinatorial optimization, and modern metaheuristics. With sources and citations.",
      },
      {
        property: "og:title",
        content: "Optimization Methods — A Complete Guide",
      },
      {
        property: "og:description",
        content:
          "From problem formulation to metaheuristics — a single, sourced reading on optimization methods for engineers and students.",
      },
    ],
  }),
  component: OptimizationMethodsArticle,
});

type Section = { id: string; title: string };

const SECTIONS: Section[] = [
  { id: "intro", title: "1. Introduction — what is optimization?" },
  { id: "anatomy", title: "2. Anatomy of an optimization problem" },
  { id: "taxonomy", title: "3. A taxonomy of optimization problems" },
  { id: "convexity", title: "4. Convexity — the dividing line" },
  { id: "lp", title: "5. Linear programming and the simplex method" },
  { id: "duality", title: "6. Duality and sensitivity" },
  { id: "interior", title: "7. Interior-point methods" },
  { id: "unconstrained", title: "8. Unconstrained nonlinear optimization" },
  { id: "line-trust", title: "9. Line search vs. trust region" },
  { id: "constrained", title: "10. Constrained NLP and the KKT conditions" },
  { id: "ip", title: "11. Integer and combinatorial optimization" },
  { id: "bnb", title: "12. Branch-and-bound and branch-and-cut" },
  { id: "dp", title: "13. Dynamic programming" },
  { id: "heuristics", title: "14. Heuristics, metaheuristics, approximation" },
  { id: "modern", title: "15. Modern landscape — what to use, when" },
  { id: "checklist", title: "16. A practical checklist" },
  { id: "refs", title: "References" },
];

function OptimizationMethodsArticle() {
  const [active, setActive] = useState<string>(SECTIONS[0].id);

  // Highlight the section currently in view in the sidebar TOC.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Scroll to hash on first paint (deep-link to a section).
  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (!hash) return;
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const readingMinutes = useMemo(() => 32, []);

  return (
    <main className="om-shell">
      <header className="om-hero">
        <div className="container">
          <p className="om-eyebrow">
            <Link to="/knowledge" className="kb-link-btn">
              ← Back to Knowledge Base
            </Link>
          </p>
          <h1 className="om-title">
            Optimization Methods — From First Principles to Modern Metaheuristics
          </h1>
          <p className="om-lede">
            A single, sourced reading that walks through what optimization is, the
            mathematical structure shared by every problem in the field, and the
            major families of algorithms used to solve them — linear, nonlinear,
            combinatorial, and heuristic. Written so a motivated newcomer can
            learn the subject end-to-end without jumping between textbooks.
          </p>
          <p className="om-meta">
            Approx. {readingMinutes} min read · Compiled from Rao, Iqbal, Parkinson
            et al., Nocedal &amp; Wright, Bonnans et al., and recent peer-reviewed
            surveys.
          </p>
        </div>
      </header>

      <div className="container om-layout">
        {/* Sidebar TOC */}
        <aside className="om-toc" aria-label="Table of contents">
          <p className="om-toc-label">Contents</p>
          <ol>
            {SECTIONS.map((s) => (
              <li key={s.id} className={active === s.id ? "active" : ""}>
                <a href={`#${s.id}`}>{s.title}</a>
              </li>
            ))}
          </ol>
        </aside>

        {/* Article body */}
        <article className="om-article">
          <section id="intro">
            <h2>1. Introduction — what is optimization?</h2>
            <p>
              Optimization is the discipline of choosing the best element from a
              set of feasible alternatives. Engineers use it to size a beam for
              minimum weight, schedule airline crews at lowest cost, train a
              neural network, route delivery trucks, design a chemical reactor,
              and pick a portfolio of investments. Although these problems look
              different on the surface, they all share the same mathematical
              skeleton: minimize (or maximize) a function of several variables,
              subject to constraints that describe what is physically, legally,
              or contractually allowed <a href="#ref-1">[1]</a>
              <a href="#ref-3">[3]</a>.
            </p>
            <p>
              Three habits separate people who are good at optimization from
              people who only know the algorithms. First, they obsess over
              formulation — most real engineering wins come from rewriting the
              problem, not from a cleverer solver. Second, they diagnose
              structure: is the problem linear? convex? smooth? discrete?
              Structure decides which algorithm will work. Third, they treat the
              optimum as the start of the conversation, not the end — they ask
              how sensitive the answer is to data, what the Lagrange multipliers
              say about which constraints really bind, and whether a slightly
              worse solution is dramatically more robust <a href="#ref-1">[1]</a>
              <a href="#ref-4">[4]</a>.
            </p>
          </section>

          <section id="anatomy">
            <h2>2. Anatomy of an optimization problem</h2>
            <p>Every optimization problem can be written as:</p>
            <pre className="om-math">
{`minimize    f(x)
subject to  g_i(x) ≤ 0,    i = 1, …, m
            h_j(x) = 0,    j = 1, …, p
            x ∈ X`}
            </pre>
            <p>
              The four ingredients are <strong>decision variables</strong> x,
              an <strong>objective function</strong> f, a set of{" "}
              <strong>constraints</strong> (inequalities g and equalities h),
              and a <strong>variable domain</strong> X (continuous, integer,
              binary, mixed). The set of points that satisfy every constraint is
              the <em>feasible region</em>; an{" "}
              <em>optimal solution</em> is a feasible point at which f attains
              its lowest value <a href="#ref-1">[1]</a>
              <a href="#ref-2">[2]</a>.
            </p>
            <p>
              A subtle but important distinction is the difference between a{" "}
              <em>local</em> minimum (best in some neighborhood) and a{" "}
              <em>global</em> minimum (best over the entire feasible region).
              For convex problems they coincide. For non-convex problems they
              do not, and most algorithms can only guarantee a local optimum
              unless the structure is exploited specifically <a href="#ref-4">[4]</a>
              <a href="#ref-5">[5]</a>.
            </p>
          </section>

          <section id="taxonomy">
            <h2>3. A taxonomy of optimization problems</h2>
            <p>
              Classifying a problem before reaching for an algorithm saves an
              enormous amount of time. The most useful axes are:
            </p>
            <ul>
              <li>
                <strong>Linearity of f and constraints.</strong> Linear program
                (LP), quadratic program (QP), nonlinear program (NLP).
              </li>
              <li>
                <strong>Variable type.</strong> Continuous, integer, mixed-integer
                (MIP / MILP), binary 0–1.
              </li>
              <li>
                <strong>Constraints.</strong> Unconstrained, bound-constrained,
                equality-constrained, general inequality-constrained.
              </li>
              <li>
                <strong>Convexity.</strong> Convex (a single &ldquo;bowl&rdquo;,
                local = global) vs. non-convex (multiple basins).
              </li>
              <li>
                <strong>Differentiability.</strong> Smooth (gradient available),
                non-smooth (e.g. L1 penalties), or black-box / derivative-free.
              </li>
              <li>
                <strong>Determinism.</strong> Deterministic vs. stochastic
                (objective or constraints involve random variables).
              </li>
              <li>
                <strong>Number of objectives.</strong> Single-objective vs.
                multi-objective (Pareto fronts).
              </li>
            </ul>
            <p>
              These categories are not mutually exclusive, and most real
              problems sit at the intersection of several — e.g. a stochastic,
              non-convex, mixed-integer NLP is unfortunately common in supply
              chain design <a href="#ref-3">[3]</a>
              <a href="#ref-2">[2]</a>.
            </p>
          </section>

          <section id="convexity">
            <h2>4. Convexity — the dividing line</h2>
            <p>
              A set is <em>convex</em> if the line segment between any two of
              its points is also in the set. A function is convex if its
              epigraph (the region above its graph) is a convex set. The single
              most consequential fact in optimization is this: in a convex
              problem, every local minimum is a global minimum, and efficient
              polynomial-time algorithms exist for very large instances{" "}
              <a href="#ref-4">[4]</a>
              <a href="#ref-1">[1]</a>.
            </p>
            <p>
              The practical implication is that if you can reformulate a
              difficult-looking problem as a convex one — by changing variables,
              relaxing integrality, or replacing a non-convex objective with a
              convex surrogate — you typically gain orders of magnitude in
              tractability. Modern modeling tools such as CVX-style disciplined
              convex programming exist precisely to make this reformulation
              process routine <a href="#ref-4">[4]</a>.
            </p>
          </section>

          <section id="lp">
            <h2>5. Linear programming and the simplex method</h2>
            <p>
              A <strong>linear program</strong> minimizes a linear objective
              c<sup>T</sup>x subject to linear equalities and inequalities,
              with x ≥ 0. The feasible region is a convex polyhedron, and an
              optimum (if one exists) is attained at a vertex of that
              polyhedron. The <strong>simplex method</strong>, invented by
              Dantzig in 1947, exploits this fact: it walks from vertex to
              adjacent vertex along edges of the polyhedron, each step
              improving the objective, until no improving neighbor exists{" "}
              <a href="#ref-1">[1]</a>
              <a href="#ref-3">[3]</a>.
            </p>
            <p>
              Although the worst-case complexity of simplex is exponential, in
              practice it solves industrial LPs with millions of variables in
              seconds. Two essential variants are{" "}
              <strong>revised simplex</strong>, which avoids re-computing the
              tableau by maintaining the basis inverse, and the{" "}
              <strong>two-phase / big-M methods</strong>, which find an initial
              feasible vertex when one is not obvious <a href="#ref-1">[1]</a>.
            </p>
            <p>
              LP also serves as a building block: most integer programming
              algorithms repeatedly solve an LP <em>relaxation</em> in which
              integrality is dropped, and use the resulting bound to prune
              search.
            </p>
          </section>

          <section id="duality">
            <h2>6. Duality and sensitivity</h2>
            <p>
              Every optimization problem has a <em>dual</em>. For an LP the
              dual is itself an LP, and the famous duality theorem says: if
              both the primal and dual are feasible, then both have optimal
              solutions and their objective values are equal. Dual variables
              have a concrete economic meaning — they are{" "}
              <em>shadow prices</em>, telling you how much the optimal
              objective would improve if a constraint right-hand side were
              relaxed by one unit <a href="#ref-1">[1]</a>
              <a href="#ref-3">[3]</a>.
            </p>
            <p>
              Sensitivity (or post-optimal) analysis goes one step further. It
              quantifies how the optimal solution and value change when costs,
              right-hand sides, or constraint coefficients are perturbed. In an
              engineering or business context this is often more valuable than
              the optimum itself, because it identifies which inputs your
              decision really depends on <a href="#ref-3">[3]</a>.
            </p>
          </section>

          <section id="interior">
            <h2>7. Interior-point methods</h2>
            <p>
              In 1984 Karmarkar showed that LPs could be solved in polynomial
              time by traversing the <em>interior</em> of the feasible region
              instead of its boundary. Modern interior-point methods (IPM) use
              a barrier function (typically log-barrier) to keep iterates
              strictly feasible, and apply Newton steps to a sequence of
              perturbed KKT systems whose perturbation parameter is driven to
              zero <a href="#ref-4">[4]</a>
              <a href="#ref-5">[5]</a>.
            </p>
            <p>
              Interior-point methods generalize beyond LP to{" "}
              <strong>quadratic programming</strong>,{" "}
              <strong>second-order cone programming</strong>, and{" "}
              <strong>semidefinite programming</strong>. They typically take
              very few iterations (often 30–60) regardless of problem size,
              which makes them the default for very large convex problems and
              the workhorse inside many constrained-NLP solvers{" "}
              <a href="#ref-4">[4]</a>.
            </p>
          </section>

          <section id="unconstrained">
            <h2>8. Unconstrained nonlinear optimization</h2>
            <p>
              For a smooth objective f(x) with no constraints, almost every
              practical algorithm follows the same template:
            </p>
            <ol>
              <li>Pick a starting point x<sub>0</sub>.</li>
              <li>Compute a <em>search direction</em> p<sub>k</sub>.</li>
              <li>
                Choose a <em>step size</em> α<sub>k</sub> so that
                x<sub>k+1</sub> = x<sub>k</sub> + α<sub>k</sub> p<sub>k</sub>{" "}
                gives sufficient decrease.
              </li>
              <li>Stop when the gradient is small enough.</li>
            </ol>
            <p>The choice of direction defines the algorithm family:</p>
            <ul>
              <li>
                <strong>Steepest descent</strong>: p = −∇f. Simple but slow on
                ill-conditioned problems.
              </li>
              <li>
                <strong>Newton's method</strong>: p solves ∇²f · p = −∇f.
                Quadratically convergent near the optimum but requires the
                Hessian.
              </li>
              <li>
                <strong>Quasi-Newton (BFGS, L-BFGS)</strong>: build a
                low-memory approximation of the Hessian inverse from gradient
                differences. The default for medium and large problems{" "}
                <a href="#ref-4">[4]</a>.
              </li>
              <li>
                <strong>Conjugate gradient</strong>: matrix-free; ideal for
                very large problems where Hessian storage is infeasible{" "}
                <a href="#ref-4">[4]</a>
                <a href="#ref-5">[5]</a>.
              </li>
            </ul>
          </section>

          <section id="line-trust">
            <h2>9. Line search vs. trust region</h2>
            <p>
              Two complementary strategies decide how far to move along p:
            </p>
            <ul>
              <li>
                <strong>Line search</strong>: pick a direction first, then
                find a step length satisfying the Wolfe conditions (sufficient
                decrease + curvature). Conceptually simple and easy to combine
                with any direction-generation rule.
              </li>
              <li>
                <strong>Trust region</strong>: build a quadratic model of f
                around x<sub>k</sub> and minimize it inside a ball of radius
                Δ<sub>k</sub>. Expand the radius if the model agreed with
                reality; shrink it otherwise. Generally more robust on
                non-convex or noisy problems <a href="#ref-4">[4]</a>.
              </li>
            </ul>
          </section>

          <section id="constrained">
            <h2>10. Constrained NLP and the KKT conditions</h2>
            <p>
              For a problem with equality and inequality constraints, the
              first-order necessary optimality conditions are the{" "}
              <strong>Karush–Kuhn–Tucker (KKT)</strong> conditions:
              stationarity of the Lagrangian, primal feasibility, dual
              feasibility (multipliers of inequality constraints are
              non-negative), and complementary slackness (each inequality is
              either active or has a zero multiplier) <a href="#ref-4">[4]</a>
              <a href="#ref-1">[1]</a>.
            </p>
            <p>
              KKT is the unifying theory behind every algorithm for
              constrained optimization. The major algorithm families are:
            </p>
            <ul>
              <li>
                <strong>Penalty / augmented Lagrangian</strong>: replace
                constraints by penalty terms whose weight is increased
                gradually.
              </li>
              <li>
                <strong>Sequential quadratic programming (SQP)</strong>: at
                each iterate, solve a QP that approximates the original NLP;
                excellent for problems with relatively few constraints{" "}
                <a href="#ref-4">[4]</a>.
              </li>
              <li>
                <strong>Interior-point NLP</strong>: extend the barrier idea
                from LP to general nonlinear constraints; the basis of solvers
                like IPOPT and KNITRO <a href="#ref-5">[5]</a>.
              </li>
            </ul>
          </section>

          <section id="ip">
            <h2>11. Integer and combinatorial optimization</h2>
            <p>
              When some variables must take integer values — choosing whether
              to build a facility, assigning workers to shifts, picking a
              route — the problem becomes <strong>combinatorial</strong>. Even
              when the LP relaxation is easy, the integer problem can be{" "}
              NP-hard, meaning we have no known polynomial algorithm and may
              not even hope for one <a href="#ref-1">[1]</a>
              <a href="#ref-2">[2]</a>.
            </p>
            <p>
              Three observations make these problems tractable in practice:
              good <em>relaxations</em> give bounds (LP relaxation, Lagrangian
              relaxation), good <em>cuts</em> tighten those bounds (Gomory,
              cover, clique), and good <em>branching</em> rules quickly
              eliminate large parts of the search tree.
            </p>
          </section>

          <section id="bnb">
            <h2>12. Branch-and-bound and branch-and-cut</h2>
            <p>
              <strong>Branch-and-bound (B&amp;B)</strong> is the backbone
              algorithm for exact integer optimization. Starting from the LP
              relaxation, if the relaxed solution is fractional, we branch on
              a fractional variable (creating two subproblems with x ≤ ⌊v⌋ and
              x ≥ ⌈v⌉) and bound each subproblem by its LP relaxation. A node
              is pruned when (a) it is infeasible, (b) its bound is worse than
              the incumbent integer solution, or (c) its relaxed solution is
              already integer <a href="#ref-1">[1]</a>
              <a href="#ref-3">[3]</a>.
            </p>
            <p>
              <strong>Branch-and-cut</strong> adds dynamically generated
              cutting planes to each node, drastically tightening the
              relaxation and shrinking the tree. Combined with sophisticated
              branching heuristics and presolve, this is what allows modern
              MILP solvers (Gurobi, CPLEX, HiGHS) to routinely handle
              real-world models with hundreds of thousands of integer
              variables <a href="#ref-3">[3]</a>.
            </p>
          </section>

          <section id="dp">
            <h2>13. Dynamic programming</h2>
            <p>
              <strong>Dynamic programming (DP)</strong>, formalized by Bellman
              in the 1950s, solves problems that exhibit{" "}
              <em>optimal substructure</em> (an optimum decomposes into
              optimal sub-decisions) and <em>overlapping subproblems</em>
              (the same sub-decision recurs many times). Examples include
              shortest paths, knapsack, sequence alignment, optimal control,
              and multi-stage decision problems <a href="#ref-1">[1]</a>
              <a href="#ref-2">[2]</a>.
            </p>
            <p>
              DP shines when the state space is small enough to enumerate, but
              suffers from the <em>curse of dimensionality</em> as states
              multiply. Approximate dynamic programming and reinforcement
              learning are modern responses to this curse, replacing the exact
              value function with a learned approximation <a href="#ref-2">[2]</a>.
            </p>
          </section>

          <section id="heuristics">
            <h2>14. Heuristics, metaheuristics, approximation</h2>
            <p>
              When a problem is too large or too non-convex for exact methods,
              we trade optimality for tractability:
            </p>
            <ul>
              <li>
                <strong>Heuristics</strong> are problem-specific rules of
                thumb (e.g. nearest-neighbor for TSP, first-fit for bin
                packing). Fast, but no guarantee on quality.
              </li>
              <li>
                <strong>Metaheuristics</strong> are general frameworks that
                guide a search through a problem-agnostic strategy. Major
                families include simulated annealing, tabu search, genetic
                algorithms, particle swarm optimization, ant colony
                optimization, and differential evolution{" "}
                <a href="#ref-6">[6]</a>
                <a href="#ref-7">[7]</a>.
              </li>
              <li>
                <strong>Approximation algorithms</strong> are heuristics with
                a proven performance ratio (e.g. a 2-approximation always
                returns a solution within twice the optimum) <a href="#ref-2">[2]</a>.
              </li>
            </ul>
            <p>
              Recent surveys catalogue more than a hundred named metaheuristics
              and emphasize that no algorithm dominates across problem classes
              — the No Free Lunch theorem of Wolpert and Macready{" "}
              <a href="#ref-6">[6]</a>
              <a href="#ref-7">[7]</a>
              <a href="#ref-8">[8]</a>. The practical advice is to match the
              algorithm's exploration / exploitation balance to the landscape:
              rugged landscapes need stronger diversification (population-based
              methods, restarts), smooth landscapes need stronger
              intensification (local search, gradient hints).
            </p>
          </section>

          <section id="modern">
            <h2>15. Modern landscape — what to use, when</h2>
            <p>A short, opinionated decision guide:</p>
            <ul>
              <li>
                Linear, continuous → <strong>simplex</strong> or{" "}
                <strong>interior-point LP</strong>.
              </li>
              <li>
                Convex (QP, SOCP, SDP) →{" "}
                <strong>interior-point</strong> in a disciplined-convex
                modeling tool.
              </li>
              <li>
                Smooth nonlinear, unconstrained →{" "}
                <strong>L-BFGS</strong> for large, <strong>BFGS</strong> for
                medium, <strong>trust-region Newton</strong> for hard cases.
              </li>
              <li>
                Smooth nonlinear, constrained → <strong>SQP</strong> for few
                constraints; <strong>interior-point NLP</strong> for many.
              </li>
              <li>
                Mixed-integer linear → <strong>branch-and-cut</strong> in a
                modern MILP solver.
              </li>
              <li>
                Mixed-integer nonlinear, structured →{" "}
                <strong>outer approximation</strong> /{" "}
                <strong>Benders decomposition</strong>.
              </li>
              <li>
                Black-box, expensive evaluations →{" "}
                <strong>Bayesian optimization</strong> /{" "}
                <strong>surrogate models</strong>.
              </li>
              <li>
                Black-box, cheap evaluations, rugged →{" "}
                <strong>genetic algorithms</strong>,{" "}
                <strong>differential evolution</strong>,{" "}
                <strong>CMA-ES</strong> <a href="#ref-6">[6]</a>
                <a href="#ref-7">[7]</a>.
              </li>
            </ul>
          </section>

          <section id="checklist">
            <h2>16. A practical checklist</h2>
            <ol>
              <li>Write the problem in standard form before touching a solver.</li>
              <li>Diagnose structure: linearity, convexity, integrality, smoothness.</li>
              <li>Pick the simplest algorithm that fits the structure.</li>
              <li>Scale variables and constraints — bad scaling kills convergence.</li>
              <li>Provide derivatives if possible; algorithmic differentiation if not.</li>
              <li>Always run sensitivity / shadow-price analysis at the optimum.</li>
              <li>Validate on a small instance you can solve by hand or brute force.</li>
              <li>Re-solve with random restarts if the problem is non-convex.</li>
              <li>For MILP, exploit symmetry breaking and warm-starts.</li>
              <li>Document the model — your future self will thank you.</li>
            </ol>
          </section>

          <section id="refs">
            <h2>References</h2>
            <ol className="om-refs">
              <li id="ref-1">
                Rao, S. S. <em>Engineering Optimization: Theory and Practice</em>,
                4th ed. Wiley, 2009. Comprehensive treatment of classical
                optimization methods used throughout this article.
              </li>
              <li id="ref-2">
                Iqbal, K. <em>Fundamental Engineering Optimization Methods</em>,
                2nd ed. Bookboon. Concise reference for problem formulation,
                LP, NLP, and DP fundamentals.
              </li>
              <li id="ref-3">
                Parkinson, A. R., Balling, R., &amp; Hedengren, J. D.{" "}
                <em>Optimization Methods for Engineering Design: Applications and Theory</em>.
                Brigham Young University. Engineering-oriented coverage of LP,
                sensitivity analysis, and integer programming.
              </li>
              <li id="ref-4">
                Nocedal, J., &amp; Wright, S. J.{" "}
                <em>Numerical Optimization</em>, 2nd ed. Springer Series in
                Operations Research, 2006. The standard reference for
                line-search, trust-region, quasi-Newton, and SQP methods.
              </li>
              <li id="ref-5">
                Bonnans, J. F., Gilbert, J. C., Lemaréchal, C., &amp;
                Sagastizábal, C. A.{" "}
                <em>Numerical Optimization: Theoretical and Practical Aspects</em>,
                2nd ed. Springer, 2006. Detailed treatment of interior-point and
                non-smooth methods.
              </li>
              <li id="ref-6">
                Rajwar, K., Deep, K., &amp; Das, S. &ldquo;An exhaustive review
                of the metaheuristic algorithms for search and optimization:
                taxonomy, applications, and open challenges.&rdquo;{" "}
                <em>Artificial Intelligence Review</em>, vol. 56, pp.
                13187–13257, 2023.{" "}
                <a
                  href="https://link.springer.com/article/10.1007/s10462-023-10470-y"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  doi.org/10.1007/s10462-023-10470-y
                </a>
              </li>
              <li id="ref-7">
                &ldquo;Metaheuristics for Solving Global and Engineering
                Optimization Problems: Review, Applications, Open Issues and
                Challenges.&rdquo;{" "}
                <em>Archives of Computational Methods in Engineering</em>, vol.
                31, pp. 4485–4519, 2024.{" "}
                <a
                  href="https://link.springer.com/article/10.1007/s11831-024-10168-6"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  doi.org/10.1007/s11831-024-10168-6
                </a>
              </li>
              <li id="ref-8">
                &ldquo;A comprehensive study on modern optimization techniques
                for engineering applications.&rdquo;{" "}
                <em>Artificial Intelligence Review</em>, 2024.{" "}
                <a
                  href="https://link.springer.com/article/10.1007/s10462-024-10829-9"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  doi.org/10.1007/s10462-024-10829-9
                </a>
              </li>
            </ol>
          </section>

          <p className="om-back">
            <Link to="/knowledge" className="kb-link-btn">
              ← Back to Knowledge Base
            </Link>
          </p>
        </article>
      </div>
    </main>
  );
}

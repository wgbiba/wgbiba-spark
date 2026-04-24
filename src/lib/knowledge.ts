/**
 * Knowledge Base — Optimization & Combinatorial Optimization
 *
 * Source material:
 *  - Assignment P1 (Optimization fundamentals)
 *  - Assignment P2 (LP / IP / MILP)
 *  - Assignment P3 (Primal–Dual bounds, B&B)
 *  - Assignment P4 (Exact algorithms for combinatorial optimization)
 *  - Assignment P5 (Heuristics, metaheuristics, approximation algorithms)
 *  - Reference (Engineering Optimization: Theory and Practice — gap filler)
 *
 * The data here is the actual answer content from the assignments,
 * supplemented with deeper conceptual explanations from the reference text.
 */

/** Source assignment / book each topic comes from. */
export type Assignment = "P1" | "P2" | "P3" | "P4" | "P5" | "Book2";
export type Difficulty = "intro" | "intermediate" | "advanced";

export type DiagramVariant = {
  /** Short label shown on the toggle, e.g. "Recursive", "Iterative", "Text". */
  label: string;
  /** Mermaid source. Omit for text-only variants. */
  mermaid?: string;
  /** Plain-text alternative explanation — required when mermaid is omitted. */
  text?: string;
};

export type QA = {
  id: string;
  question: string;
  /** HTML answer — math rendered as inline text/code, lists allowed */
  answer: string;
  /** Optional code example */
  code?: { language: string; source: string; title?: string };
  /** Optional mermaid diagram code (single variant — kept for compatibility) */
  diagram?: { title?: string; mermaid: string };
  /** Multiple diagram variants the reader can switch between. Overrides `diagram`. */
  diagrams?: { title?: string; variants: DiagramVariant[] };
  /** Optional LaTeX-style display math (rendered as monospace block) */
  math?: string[];
  /** "deep dive" — extra context from the reference text */
  deepDive?: string;
};

export type Topic = {
  id: string;
  title: string;
  intro: string;
  qa: QA[];
  /** Source assignment(s) the topic comes from. */
  assignments?: Assignment[];
  /** Suggested reader difficulty. */
  difficulty?: Difficulty;
};

export type Category = {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji or single letter
  topics: Topic[];
};

export const KB_CATEGORIES: Category[] = [
  // =====================================================================
  // 1. FOUNDATIONS
  // =====================================================================
  {
    id: "foundations",
    title: "Optimization Foundations",
    description:
      "What an optimization problem is, its components, feasible regions, and the difference between linear, nonlinear, continuous, and discrete optimization.",
    icon: "∑",
    topics: [
      {
        id: "what-is-optimization",
        assignments: ["P1", "Book2"],
        difficulty: "intro",
        title: "What is Optimization?",
        intro:
          "Optimization is the process of choosing decision variables in order to minimize or maximize a real-valued objective function, subject to constraints. It is the mathematical core of decision-making in engineering, economics, logistics, and machine learning.",
        qa: [
          {
            id: "def",
            question: "What is optimization? Give an example.",
            answer:
              "Optimization is the process of choosing decision variables to minimize or maximize a real-valued objective function, subject to given constraints on those variables. A classical example is maximizing profit by choosing production quantities subject to a budget.",
            math: ["max  w₁·x₁ + w₂·x₂", "s.t.  x₁ + x₂ ≤ B,   x₁, x₂ ≥ 0"],
            deepDive:
              "The reference text frames optimization as the search for x* in a design space X that yields the best value of an objective f(x). The 'best' is defined relative to a preference ordering — usually the natural order on ℝ — and the problem is meaningful only once the design space, objective and constraints are precisely specified.",
          },
          {
            id: "components",
            question: "What are the three main components of an optimization problem?",
            answer:
              "Every single-objective optimization problem has: <strong>(1) Decision variables</strong> x ∈ ℝⁿ (or in a discrete set) representing the unknown choices; <strong>(2) An objective function</strong> f(x) measuring performance; <strong>(3) Constraints</strong> gᵢ(x) ≤ 0, hⱼ(x) = 0 (and possibly a set restriction x ∈ S) that describe which decisions are allowed.",
          },
          {
            id: "diff-vars-obj-constr",
            question:
              "What is the difference between decision variables, objective function, and constraints?",
            answer:
              "<ul><li><strong>Decision variables</strong> are the unknown choices the decision maker can control — production levels, flows, or design dimensions.</li><li><strong>Objective function</strong> maps each feasible x to a scalar f(x) measuring cost, profit, time or energy.</li><li><strong>Constraints</strong> are equations or inequalities restricting which variable values are allowed — resource limits, physical laws, or logical requirements.</li></ul>",
          },
          {
            id: "min-vs-max",
            question: "What is the difference between minimization and maximization?",
            answer:
              "To <em>minimize</em> f(x) means to find a feasible x* such that f(x*) ≤ f(x) for all feasible x. To <em>maximize</em> f(x) means to find x* with f(x*) ≥ f(x) for all feasible x. Any maximization can be converted to minimization by minimizing −f(x), and vice versa.",
          },
          {
            id: "math-form",
            question: "Write the general mathematical formulation of an NLP.",
            answer:
              "A general nonlinear program is written as a min over an admissible set, with equality constraints hᵢ(x)=0 and inequality constraints gⱼ(x) ≤ 0. A linear program is the special case where f and all constraints are linear.",
            math: [
              "min   f(x)         x ∈ S ⊆ ℝⁿ",
              "s.t.  hᵢ(x) = 0,    i = 1..m",
              "      gⱼ(x) ≤ 0,    j = 1..p",
            ],
          },
          {
            id: "linear-vs-nonlinear",
            question: "When is an objective function linear vs. nonlinear?",
            answer:
              "An objective is <strong>linear</strong> if it has the form f(x) = cᵀx = Σⱼ cⱼxⱼ — affine in x with no products or powers above first degree. It is <strong>nonlinear</strong> if it contains products xᵢxⱼ, powers xᵢ², exponentials, etc. Linear objectives lead to linear programming; nonlinear ones lead to NLP.",
          },
        ],
      },
      {
        id: "feasibility-optimality",
        assignments: ["P1"],
        difficulty: "intro",
        title: "Feasibility, Optimality & Solution Spaces",
        intro:
          "Before solving anything, we must define which solutions are even allowed (feasible), which are best (optimal), and how the full solution space relates to the feasible region.",
        qa: [
          {
            id: "feasible",
            question: "What is a feasible solution?",
            answer:
              "Any assignment of the decision variables that satisfies <em>all</em> constraints — including sign or integrality restrictions. In LP standard form, any x with Ax ≤ b and x ≥ 0 is feasible.",
          },
          {
            id: "infeasible",
            question: "What is an infeasible solution?",
            answer:
              "An assignment that violates at least one constraint. If <em>no</em> feasible solution exists at all, the whole problem is called infeasible.",
          },
          {
            id: "optimal",
            question: "What makes a solution optimal?",
            answer:
              "A feasible x* is <strong>globally optimal</strong> if its objective value is best among all feasible points. For minimization: f(x*) ≤ f(x) for every feasible x. For maximization the inequality is reversed.",
          },
          {
            id: "feasible-region",
            question: "What is the feasible region?",
            answer:
              "The collection of all decision vectors that satisfy every constraint. In a linear program, the feasible region is a convex polyhedron — the intersection of halfspaces Ax ≤ b and possibly hyperplanes.",
          },
          {
            id: "solution-space",
            question: "What is the solution space (decision space)?",
            answer:
              "The full set of all possible values the decision variables can take <em>before</em> enforcing constraints — typically a subset of ℝⁿ or a discrete set such as {0,1}ⁿ. The feasible region is then a subset of the solution space defined by the constraints.",
          },
          {
            id: "binary-example",
            question:
              "Enumerate the solution space and feasible region for max 5x₁+7x₂+2x₃ s.t. 2x₁+4x₂+x₃ ≤ 4, xᵢ ∈ {0,1}.",
            answer:
              "The solution space is {0,1}³ — 8 points. Checking the constraint 2x₁+4x₂+x₃ ≤ 4 yields the feasible set X<sub>F</sub> = {(0,0,0), (0,0,1), (0,1,0), (1,0,0), (1,0,1)}. Evaluating the objective shows (0,1,0) with value 7 is optimal.",
            code: {
              language: "python",
              title: "Brute-force enumeration",
              source: `from itertools import product

best, best_val = None, -1
for x in product([0,1], repeat=3):
    if 2*x[0] + 4*x[1] + x[2] <= 4:          # feasibility
        val = 5*x[0] + 7*x[1] + 2*x[2]       # objective
        if val > best_val:
            best, best_val = x, val

print(best, best_val)   # (0, 1, 0) 7`,
            },
          },
          {
            id: "continuous-vs-discrete",
            question: "Continuous vs. discrete optimization?",
            answer:
              "<strong>Continuous</strong>: variables take real values in intervals; calculus and convex analysis apply. <strong>Discrete</strong>: variables restricted to integers or binaries (e.g. {0,1}ⁿ), giving combinatorial structure that requires algorithms such as branch-and-bound, cutting planes, or dynamic programming.",
          },
          {
            id: "calc-vs-comb",
            question: "Calculus-based vs. combinatorial optimization?",
            answer:
              "Calculus-based methods assume continuous and differentiable functions and use gradients, Hessians, KKT conditions, Newton, and quasi-Newton steps. Combinatorial optimization deals with discrete structures (graphs, sets, integer vectors) where derivatives don't exist; methods rely on branch-and-bound, dynamic programming, network flows, and heuristics.",
          },
          {
            id: "real-life-comb",
            question: "Examples of real-life combinatorial optimization problems?",
            answer:
              "<ul><li><strong>Traveling Salesman</strong> — shortest tour visiting each city once.</li><li><strong>Vehicle routing</strong> — delivery routes minimizing distance under capacity.</li><li><strong>Crew & shift scheduling</strong> — assign staff to shifts respecting rules.</li><li><strong>Network design</strong> — choose links in a network to satisfy demand at minimum cost.</li><li><strong>Set covering / facility location</strong> — pick facilities or sets to cover demand at minimum cost.</li></ul>",
          },
        ],
      },
      {
        id: "classic-formulations",
        assignments: ["P1", "P2"],
        difficulty: "intermediate",
        title: "Three Classic LP/IP Formulations",
        intro:
          "Three canonical models every engineer should be able to write from memory: the multi-dimensional 0/1 knapsack, the minimum set cover, and the maximum independent set.",
        qa: [
          {
            id: "knapsack",
            question: "Formulate the multi-dimensional 0/1 knapsack problem.",
            answer:
              "Given n items with profit pⱼ, m resource constraints with capacity bᵢ, and consumption aᵢⱼ of item j in dimension i, define xⱼ = 1 if item j is selected, 0 otherwise.",
            math: [
              "max   Σⱼ pⱼ xⱼ",
              "s.t.  Σⱼ aᵢⱼ xⱼ ≤ bᵢ,    i = 1..m",
              "      xⱼ ∈ {0,1}",
            ],
            code: {
              language: "python",
              title: "Knapsack with PuLP",
              source: `import pulp
m = pulp.LpProblem("knapsack", pulp.LpMaximize)
x = [pulp.LpVariable(f"x{j}", cat="Binary") for j in range(n)]
m += pulp.lpSum(p[j]*x[j] for j in range(n))
for i in range(M):
    m += pulp.lpSum(a[i][j]*x[j] for j in range(n)) <= b[i]
m.solve()`,
            },
          },
          {
            id: "set-cover",
            question: "Formulate the minimum set covering problem.",
            answer:
              "Given a universe U = {1..n} and a family of subsets S = {S₁..Sₘ} with cost cⱼ, choose xⱼ = 1 if Sⱼ is selected. Each element must be covered by at least one chosen set.",
            math: [
              "min   Σⱼ cⱼ xⱼ",
              "s.t.  Σ_{j: i ∈ Sⱼ} xⱼ ≥ 1,   ∀ i ∈ U",
              "      xⱼ ∈ {0,1}",
            ],
          },
          {
            id: "independent-set",
            question: "Formulate the maximum independent set problem.",
            answer:
              "Given an undirected graph G=(V,E), an independent set is a subset of vertices with no edge between any two of them. Let xᵢ = 1 if vertex i is selected. The constraints xᵢ + xⱼ ≤ 1 for every edge {i,j} ∈ E ensure no edge has both endpoints chosen.",
            math: ["max  Σ_{i∈V} xᵢ", "s.t. xᵢ + xⱼ ≤ 1,  ∀ {i,j} ∈ E", "     xᵢ ∈ {0,1}"],
          },
        ],
      },
    ],
  },

  // =====================================================================
  // 2. LINEAR PROGRAMMING
  // =====================================================================
  {
    id: "lp",
    title: "Linear Programming",
    description:
      "The mathematical structure that makes LP so powerful: linear objective, linear constraints, convex polyhedral feasible region. Plus modeling exercises.",
    icon: "L",
    topics: [
      {
        id: "lp-basics",
        assignments: ["P2", "Book2"],
        difficulty: "intro",
        title: "Linear Programming Basics",
        intro:
          "An LP minimizes or maximizes a linear function subject to linear equality and inequality constraints. Its convex polyhedral feasible region guarantees that any local optimum is global — which is why simplex and interior-point methods can solve LPs to provable optimality.",
        qa: [
          {
            id: "what-is-lp",
            question: "What is a linear programming (LP) problem?",
            answer:
              "An optimization problem in which a <strong>linear</strong> objective is minimized or maximized subject to a set of <strong>linear</strong> equality and/or inequality constraints. The feasible set is a convex polyhedron in ℝⁿ.",
            deepDive:
              "The reference text shows that linearity buys two crucial properties: (i) the feasible set is convex, so any local optimum is also global, and (ii) the optimum, if it exists, lies at a vertex of the polyhedron — the geometric fact that the simplex method exploits.",
          },
          {
            id: "lp-elements",
            question: "What are decision variables, objective function, and constraints in LP?",
            answer:
              "<ul><li><strong>Decision variables</strong> — unknowns to determine (production quantities, flows). Coordinates of x ∈ ℝⁿ.</li><li><strong>Objective</strong> — linear function cᵀx representing cost, profit, or time.</li><li><strong>Constraints</strong> — linear (in)equalities Ax ≤ b, Ax = b, Ax ≥ b restricting feasible x.</li></ul>",
          },
          {
            id: "why-linear",
            question: "Why must constraints be linear for LP solvers?",
            answer:
              "LP solvers assume linearity so that (i) the feasible region is a convex polyhedron and any local optimum is global, and (ii) the simplex and interior-point methods can exploit the structure to guarantee convergence and global optimality. Without linearity, convexity may be lost and these guarantees fail.",
          },
          {
            id: "auxiliary",
            question: "What is an auxiliary variable, and when do we use it?",
            answer:
              "An additional variable introduced to convert a nonlinear, logical, or composite expression (absolute value, min, max, piecewise) into an equivalent system of linear constraints, so the problem fits inside the LP/MILP framework. Examples: slack variables to convert ≤ into =, or a variable representing min(x₁, x₂).",
          },
          {
            id: "modeling-p1p2p3",
            question: "Model the factory problem with three products P₁, P₂, P₃.",
            answer:
              "Let xⱼ ≥ 0 be units of product Pⱼ produced (continuous, nonnegative). Profit per unit is 40, 30, 50; labor per unit is 2, 1, 3 with availability 150 hours; material per unit is 3, 2, 4 with availability 200 units.",
            math: [
              "max   z = 40 x₁ + 30 x₂ + 50 x₃",
              "s.t.  2 x₁ +   x₂ + 3 x₃ ≤ 150     (labor)",
              "      3 x₁ + 2 x₂ + 4 x₃ ≤ 200     (material)",
              "      x₁, x₂, x₃ ≥ 0",
            ],
            code: {
              language: "python",
              title: "Solve the factory LP with PuLP",
              source: `import pulp
m = pulp.LpProblem("factory", pulp.LpMaximize)
x = [pulp.LpVariable(f"x{j+1}", lowBound=0) for j in range(3)]
m += 40*x[0] + 30*x[1] + 50*x[2]
m += 2*x[0] +    x[1] + 3*x[2] <= 150
m += 3*x[0] + 2*x[1] + 4*x[2] <= 200
m.solve()
print(pulp.value(m.objective))`,
            },
          },
        ],
      },
    ],
  },

  // =====================================================================
  // 3. INTEGER & MIXED-INTEGER PROGRAMMING
  // =====================================================================
  {
    id: "milp",
    title: "Integer & Mixed-Integer Programming",
    description:
      "When some or all variables must be integer or binary. Logical constraints, the Big-M method, and linearisation of min/max and piecewise functions.",
    icon: "ℤ",
    topics: [
      {
        id: "ip-binary",
        assignments: ["P2"],
        difficulty: "intro",
        title: "Integer & Binary Variables",
        intro:
          "Integer programming restricts some variables to integer or binary values. This makes problems combinatorially harder (NP-hard in general) but lets us model yes/no decisions and logical conditions.",
        qa: [
          {
            id: "what-is-ip",
            question: "What is an IP problem and how does it differ from LP?",
            answer:
              "An IP requires some or all decision variables to be integer (e.g. xᵢ ∈ ℤ or xᵢ ∈ {0,1}). The feasible region is discrete, so IPs are NP-hard in general and require combinatorial algorithms — branch-and-bound, cutting planes, branch-and-cut.",
          },
          {
            id: "binary-var",
            question: "What is a binary variable, and when do we use it?",
            answer:
              "A 0/1 variable. Used to model yes/no decisions: open/close a facility, select/not select a project, assign/not assign a job to a machine, and to encode logical conditions.",
          },
          {
            id: "real-int-example",
            question: "Real-world example requiring integer variables?",
            answer:
              "The knapsack problem — selecting indivisible items (projects, products, investments) to maximize value subject to a budget. Each item is either chosen or not. Other examples: crew scheduling, machine assignment, shift planning, network design.",
          },
          {
            id: "logical-as-linear",
            question: "How are logical conditions modelled with linear inequalities on binaries?",
            answer:
              "Because 0/1 binaries encode truth values, logical statements translate directly: <ul><li>If <em>x = 1 ⇒ y = 1</em> ⟶ x ≤ y</li><li>Either x = 1 or y = 1 ⟶ x + y ≥ 1</li><li>At most r of n variables = 1 ⟶ Σ xᵢ ≤ r</li><li>At least r of n variables = 1 ⟶ Σ xᵢ ≥ r</li><li>Conditional bound via big-M: x ≤ M y forces x = 0 when y = 0</li></ul>",
          },
        ],
      },
      {
        id: "logical-exercises",
        assignments: ["P2"],
        difficulty: "intermediate",
        title: "Logical Constraint Exercises",
        intro:
          "A toolbox of standard tricks for translating logical statements into linear constraints on binary variables.",
        qa: [
          {
            id: "if-x1-zero",
            question: "If x₁ = 0, then x₂ = 1.",
            answer:
              "Linear constraint: <code>x₂ ≥ 1 − x₁</code>. If x₁=0 the constraint forces x₂ ≥ 1, hence x₂=1; if x₁=1 the constraint becomes x₂ ≥ 0 — non-restrictive.",
          },
          {
            id: "either-or",
            question: "Either x₁ = 1 or x₂ = 1.",
            answer: "<code>x₁ + x₂ ≥ 1</code>",
          },
          {
            id: "exactly-one",
            question: "Exactly one of x₁ and x₂ equals 1.",
            answer: "<code>x₁ + x₂ = 1</code>",
          },
          {
            id: "both-one",
            question: "Both x₁ and x₂ must be 1.",
            answer: "<code>x₁ = 1, x₂ = 1</code>",
          },
          {
            id: "if-zero-two-must",
            question: "If x₁ = 0 then at least two of x₂ and x₃ must be 1.",
            answer: "<code>x₂ + x₃ ≥ 2(1 − x₁)</code>",
          },
          {
            id: "at-most-r",
            question: "At most r of n variables can be 1.",
            answer: "<code>Σᵢ xᵢ ≤ r</code>",
          },
          {
            id: "at-least-r",
            question: "At least r of n variables must be 1.",
            answer: "<code>Σᵢ xᵢ ≥ r</code>",
          },
          {
            id: "if-zero-r-others",
            question: "If x₁ = 0 then at least r of x₂..xₙ must be 1.",
            answer: "<code>Σᵢ₌₂..ₙ xᵢ ≥ r(1 − x₁)</code>",
          },
          {
            id: "if-one-at-most-r",
            question: "If x₁ = 1 then at most r of x₂..xₙ can be 1.",
            answer:
              "<code>Σᵢ₌₂..ₙ xᵢ ≤ r + (n − 1 − r)(1 − x₁)</code> — here (n−1−r) acts as a problem-specific big-M.",
          },
        ],
      },
      {
        id: "bigm-conditional",
        assignments: ["P2"],
        difficulty: "intermediate",
        title: "Big-M & Conditional Constraints",
        intro:
          "The Big-M method introduces large constants in linear inequalities to activate or deactivate constraints conditionally on a binary variable — the key trick that lets MILP express on/off and setup logic.",
        qa: [
          {
            id: "what-bigm",
            question: "What is the Big-M method?",
            answer:
              "A modeling technique that uses a large constant M in linear inequalities to switch a constraint on or off based on a binary variable y. With sufficiently large M, the inactive side becomes non-binding while the formulation remains linear and MILP-compatible.",
          },
          {
            id: "where-bigm",
            question: "Where and why is Big-M used?",
            answer:
              "To model 'if y=1 then a relation must hold; if y=0 the constraint is relaxed' — conditional capacities, setup-dependent production, piecewise definitions. Choose M just large enough to be non-binding when inactive but small enough to keep LP relaxations tight.",
          },
          {
            id: "bigm-example",
            question: "Simple example of Big-M usage?",
            answer:
              "If a machine produces x only when on (y=1) with capacity U: <code>0 ≤ x ≤ U·y</code>. Here U acts as M: y=0 forces x=0; y=1 lets x range up to U.",
          },
          {
            id: "machine-onoff",
            question:
              "Model: a machine on/off. If on: 20 ≤ x ≤ 100, cost 5/unit, fixed cost 100. If off: x = 0.",
            answer:
              "Binary y ∈ {0,1} for on/off, x ≥ 0 for production. Big-M links them; minimize fixed + variable cost.",
            math: [
              "min   z = 100 y + 5 x",
              "s.t.  x ≤ 100 y      (cap when on, zero when off)",
              "      x ≥  20 y      (minimum lot when on, zero when off)",
              "      y ∈ {0,1},  x ≥ 0",
            ],
          },
        ],
      },
      {
        id: "linearize",
        assignments: ["P2"],
        difficulty: "advanced",
        title: "Linearizing Min/Max & Piecewise",
        intro:
          "MILP solvers require linear objectives and constraints — min, max, and piecewise functions are not directly admissible. Auxiliary variables and big-M let us linearize them.",
        qa: [
          {
            id: "why-linearize",
            question: "Why linearize min and max in MILP?",
            answer:
              "Because the solver only handles linear constraints. Linearizing min, max, and piecewise functions with auxiliaries and additional linear constraints keeps the model in MILP and lets us use branch-and-bound and interior-point methods.",
          },
          {
            id: "min-aux",
            question: "How can an auxiliary variable represent min or max?",
            answer:
              "For z = min(x₁,x₂) introduce z and enforce z ≤ x₁, z ≤ x₂, plus extra constraints (with binaries and big-M) so z equals the smaller. For w = max(x₁,x₂) enforce w ≥ x₁, w ≥ x₂ symmetrically.",
          },
          {
            id: "piecewise",
            question: "How are piecewise-linear cost functions handled in MILP?",
            answer:
              "Divide the domain into segments, introduce auxiliary segment variables, and use binaries (or SOS2 sets) to ensure only the relevant segment is active. The cost is then a linear combination of segment variables.",
          },
          {
            id: "min-projects",
            question: "Linearize z = min(x_A, x_B).",
            answer:
              "If the objective tightens it (e.g. maximizing z), the simple form suffices: <code>z ≤ x_A, z ≤ x_B</code>. For an exact min independent of the objective, use a binary y and big-M: z ≥ x_A − M(1−y), z ≥ x_B − My, plus z ≤ x_A, z ≤ x_B.",
          },
        ],
      },
    ],
  },

  // =====================================================================
  // 4. PRIMAL–DUAL BOUNDS
  // =====================================================================
  {
    id: "duality",
    title: "Primal–Dual Bounds & LP Relaxation",
    description:
      "Bounds, gaps, and the theory of duality — the language exact algorithms use to certify optimality.",
    icon: "↔",
    topics: [
      {
        id: "bounds",
        assignments: ["P3"],
        difficulty: "intro",
        title: "Primal & Dual Bounds",
        intro:
          "A primal bound comes from any feasible solution; a dual bound comes from a relaxation. When they meet, optimality is certified.",
        qa: [
          {
            id: "primal-bound",
            question: "What is a primal bound in a minimization problem?",
            answer:
              "A valid <strong>upper</strong> limit on the optimal value, obtained by evaluating f at any feasible solution. The true minimum is ≤ this bound.",
          },
          {
            id: "dual-bound",
            question: "What is a dual bound?",
            answer:
              "A valid lower limit (for minimization) or upper limit (for maximization) on the optimum, obtained by relaxing the problem (drop integrality, Lagrangian relaxation, etc.).",
          },
          {
            id: "why-dual-optimistic",
            question: "Why is a dual bound always optimistic for minimization?",
            answer:
              "Because the relaxation expands the feasible region or removes penalties, so the relaxed optimum is potentially cheaper than what is achievable under the strict original constraints.",
          },
          {
            id: "opt-gap",
            question: "Define the optimality gap.",
            answer:
              "The absolute or relative difference between the best known primal bound (best feasible found) and the best known dual bound (theoretical limit).",
          },
          {
            id: "certify",
            question: "When can we certify optimality?",
            answer:
              "When the primal bound exactly equals the dual bound — i.e. the optimality gap is zero. This proves no better solution can exist within the feasible space.",
          },
        ],
      },
      {
        id: "lp-relax",
        assignments: ["P3"],
        difficulty: "intermediate",
        title: "LP Relaxation",
        intro:
          "Drop integrality from an IP/MILP and you get an LP whose optimum is a valid bound on the original integer problem.",
        qa: [
          {
            id: "what-lp-relax",
            question: "What is an LP relaxation of an IP/MILP?",
            answer:
              "The linear program obtained by dropping integrality constraints, allowing variables to take fractional continuous values. Its feasible region contains the IP's, so its optimum bounds the IP's optimum.",
          },
          {
            id: "lp-relax-ex",
            question:
              "Solve max 5x₁+4x₂ s.t. 6x₁+4x₂ ≤ 24, x₁,x₂ ∈ ℤ⁺ via LP relaxation.",
            answer:
              "Drop integrality. Vertices of the relaxed feasible region: (0,0)→0, (4,0)→20, (0,6)→24. The LP optimum is at (0,6) with Z<sub>LP</sub>=24. Both coords are integer, so this is also feasible for the IP — primal = dual = 24, gap = 0.",
            diagram: {
              title: "Feasible region of the relaxation",
              mermaid: `graph LR
  A["(0,0) Z=0"] --- B["(4,0) Z=20"]
  A --- C["(0,6) Z=24 ★"]
  B --- C`,
            },
          },
        ],
      },
      {
        id: "duality-thm",
        assignments: ["P3", "Book2"],
        difficulty: "advanced",
        title: "Duality in Linear Programming",
        intro:
          "Every LP (the primal) has an associated dual LP. The two share the same optimal value at strong duality.",
        qa: [
          {
            id: "what-dual",
            question: "What is the dual problem of a linear program?",
            answer:
              "An associated LP in which every primal variable becomes a dual constraint and every primal constraint becomes a dual variable. The dual bounds the primal optimum.",
          },
          {
            id: "weak-duality",
            question: "State the Weak Duality theorem.",
            answer:
              "For any feasible primal x and any feasible dual y: cᵀx ≤ bᵀy (for primal max). Hence any feasible dual provides a valid bound on the primal.",
          },
          {
            id: "strong-duality",
            question: "State the Strong Duality theorem.",
            answer:
              "If either the primal or the dual has a finite optimum, then both do, and Z* = W* — the optimal objective values are equal.",
          },
          {
            id: "comp-slack",
            question: "What is complementary slackness?",
            answer:
              "At optimality, if a constraint in one problem has strictly positive slack, the corresponding variable in the paired problem must be zero — and conversely, if a variable is strictly positive, its paired constraint must be binding.",
          },
          {
            id: "duality-ex",
            question: "Compute the dual of max 3x₁+2x₂ s.t. x₁+x₂ ≤ 4, 2x₁+x₂ ≤ 5, xᵢ ≥ 0.",
            answer:
              "Dual: min W = 4y₁ + 5y₂ s.t. y₁+2y₂ ≥ 3, y₁+y₂ ≥ 2, yᵢ ≥ 0. Primal optimum at (1,3) gives Z*=9; dual optimum at (1,1) gives W*=9 — strong duality verified.",
            math: [
              "Primal:  max  3x₁ + 2x₂",
              "         s.t. x₁ + x₂ ≤ 4    (← y₁)",
              "              2x₁ + x₂ ≤ 5   (← y₂)",
              "              x₁, x₂ ≥ 0",
              "",
              "Dual:    min  4y₁ + 5y₂",
              "         s.t. y₁ + 2y₂ ≥ 3   (← x₁)",
              "              y₁ +  y₂ ≥ 2   (← x₂)",
              "              y₁, y₂ ≥ 0",
            ],
          },
        ],
      },
      {
        id: "bounding-techniques",
        title: "Bounding Techniques",
        intro:
          "LP relaxation is the most common bounding technique, but Lagrangian, surrogate, and combinatorial relaxations all play a role.",
        qa: [
          {
            id: "why-lp-bound",
            question: "Why does LP relaxation provide a valid bound?",
            answer:
              "Dropping integrality enlarges the feasible region. Optimizing over a larger set yields ≥ for max (≤ for min) compared to the integer optimum, so the relaxed optimum is a valid bound.",
          },
          {
            id: "lagrangian",
            question: "What is Lagrangian relaxation, conceptually?",
            answer:
              "Move 'hard' constraints from the constraint set into the objective with multiplier penalties. The relaxed problem is easier and its optimum bounds the original.",
          },
          {
            id: "other-bounds",
            question: "What other general methods provide a dual bound?",
            answer:
              "<strong>Surrogate relaxation</strong> — aggregate multiple constraints into one weighted sum. <strong>Combinatorial relaxations</strong> — exploit structure such as MST bounds for TSP variants.",
          },
          {
            id: "strong-bound",
            question: "What makes a bound 'strong'?",
            answer:
              "A bound is strong when it is close to the true integer optimum, producing a tight optimality gap. Strong bounds let branch-and-bound prune subtrees aggressively.",
          },
          {
            id: "frac-knap",
            question:
              "Greedy fractional knapsack on p=(10,8,6), w=(5,4,3), W=7 — give a dual bound.",
            answer:
              "All ratios pᵢ/wᵢ = 2. Take item 1 fully (weight 5, profit 10). Remaining capacity 2 → take fraction 2/4 = 0.5 of item 2 (profit 4). Total dual bound = 14.",
            code: {
              language: "python",
              title: "Fractional knapsack greedy",
              source: `def fractional_knapsack(p, w, W):
    items = sorted(range(len(p)), key=lambda i: -p[i]/w[i])
    val, cap = 0.0, W
    for i in items:
        if w[i] <= cap:
            val += p[i]; cap -= w[i]
        else:
            val += p[i] * (cap / w[i]); break
    return val

print(fractional_knapsack([10,8,6], [5,4,3], 7))  # 14.0`,
            },
          },
        ],
      },
    ],
  },

  // =====================================================================
  // 5. BRANCH AND BOUND
  // =====================================================================
  {
    id: "bnb",
    title: "Branch & Bound",
    description:
      "The exact algorithm at the heart of every integer programming solver. Divide-and-conquer the feasible region while LP relaxations supply pruning bounds.",
    icon: "▲",
    topics: [
      {
        id: "bnb-concepts",
        title: "Branch & Bound — Concepts",
        intro:
          "Branch & bound is an exact algorithm: it always returns a provably optimal solution. It partitions the feasible region (branching) and prunes subproblems whose relaxation cannot improve the incumbent (bounding).",
        qa: [
          {
            id: "exact-alg",
            question: "What is an exact algorithm? When is it used?",
            answer:
              "An algorithm that <em>guarantees</em> finding the optimum and proving it in finite time. Used when approximate solutions are unacceptable — safety-critical systems, financial modeling, regulated planning.",
          },
          {
            id: "main-idea",
            question: "What is the main idea of branch-and-bound?",
            answer:
              "Divide and conquer: partition the feasible region into subproblems (branching) and use relaxations to compute bounds (bounding). Discard nodes whose bound cannot improve the best known integer solution (fathoming).",
          },
          {
            id: "three-components",
            question: "What are the three main components of B&B?",
            answer:
              "<strong>(1) Branching</strong> — split a node into two subproblems by adding a constraint. <strong>(2) Bounding</strong> — solve the LP relaxation to get a dual bound. <strong>(3) Fathoming (pruning)</strong> — close a node if it is infeasible, has worse bound than the incumbent, or yields an integer solution.",
          },
          {
            id: "fathoming",
            question: "What is fathoming?",
            answer:
              "Permanently closing a node because (i) its LP relaxation is infeasible, (ii) its bound is worse than the current incumbent, or (iii) its LP solution is already integer (so we update the incumbent and close).",
          },
        ],
      },
      {
        id: "bnb-algo",
        assignments: ["P3", "P4"],
        difficulty: "advanced",
        title: "B&B — Flowchart and Pseudocode",
        intro:
          "Every B&B implementation follows the same skeleton: an active node list, repeated solve-bound-branch-prune until the list is empty.",
        qa: [
          {
            id: "flowchart",
            question: "Flowchart of branch-and-bound for maximization.",
            answer:
              "Initialize the incumbent Z* = −∞ and the active list with the root. Loop: pop a node, solve its LP relaxation, then either prune (infeasibility / bound / integrality) or branch on a fractional variable.",
            diagrams: {
              title: "B&B (maximization) flow",
              variants: [
                {
                  label: "Iterative (queue-based)",
                  mermaid: `flowchart TD
  A[Init: Z* = -inf, active = root] --> B{Active list empty?}
  B -- yes --> Z[Return Z*, x*]
  B -- no --> C[Pop node N]
  C --> D[Solve LP relaxation]
  D --> E{Infeasible?}
  E -- yes --> B
  E -- no --> F{LP bound <= Z*?}
  F -- yes --> B
  F -- no --> G{Integer?}
  G -- yes --> H[Update Z*, prune] --> B
  G -- no --> I[Branch on fractional x_i]
  I --> J[Add 2 children to active]
  J --> B`,
                },
                {
                  label: "Recursive (DFS)",
                  mermaid: `flowchart TD
  S["explore(node, Z*)"] --> LP[Solve LP relaxation]
  LP --> INF{Infeasible?}
  INF -- yes --> R1[return Z*]
  INF -- no --> BD{LP bound <= Z*?}
  BD -- yes --> R2[return Z*]
  BD -- no --> IT{Integer?}
  IT -- yes --> UP[Z* = max Z*, z_lp] --> R3[return Z*]
  IT -- no --> PI[pick fractional x_i]
  PI --> L["Z* = explore(N + x_i <= floor v, Z*)"]
  L --> R["Z* = explore(N + x_i >= ceil v, Z*)"]
  R --> R4[return Z*]`,
                },
                {
                  label: "Text",
                  text:
                    "1. Initialize incumbent Z* = -∞ and put the root subproblem on the active list.\n" +
                    "2. While the active list is non-empty, pop a node N.\n" +
                    "3. Solve N's LP relaxation. If infeasible → fathom (skip).\n" +
                    "4. If LP bound ≤ Z* → fathom by bound.\n" +
                    "5. If the LP solution is integer → update Z* if better, then fathom.\n" +
                    "6. Otherwise pick a fractional variable x_i with value v and create two children:\n" +
                    "       N ∧ (x_i ≤ ⌊v⌋)   and   N ∧ (x_i ≥ ⌈v⌉)\n" +
                    "   Push both onto the active list and loop.\n" +
                    "7. When the list is empty, Z* and the matching x* are optimal.",
                },
              ],
            },
            code: {
              language: "python",
              title: "Branch-and-bound — pseudocode",
              source: `def branch_and_bound_max(root):
    best_x, best_z = None, float("-inf")
    active = [root]
    while active:
        node = active.pop()
        x_lp, z_lp, status = solve_lp_relaxation(node)
        if status == "INFEASIBLE":   continue        # fathom
        if z_lp <= best_z:           continue        # prune by bound
        if is_integer(x_lp):
            best_x, best_z = x_lp, z_lp
            continue                                # prune by integrality
        i, v = pick_fractional(x_lp)
        active.append(node.with_constraint(f"x{i} <= {int(v)}"))
        active.append(node.with_constraint(f"x{i} >= {int(v)+1}"))
    return best_x, best_z`,
            },
          },
          {
            id: "bnb-ex",
            question: "Apply B&B to max 3x₁+2x₂ s.t. 2x₁+x₂ ≤ 4, xᵢ ∈ ℤ⁺.",
            answer:
              "Root LP relaxation: vertices (0,0)→0, (2,0)→6, (0,4)→8. LP optimum at (0,4) is already integer, so the IP optimum is (0,4) with Z*=8. The B&B tree consists of just the root, fathomed by integrality.",
          },
          {
            id: "bnb-ex2",
            question: "Apply B&B to max 4x₁+3x₂ s.t. 2x₁+x₂ ≤ 7, x₁+2x₂ ≤ 7, xᵢ ∈ ℤ⁺.",
            answer:
              "Root LP gives (7/3, 7/3) with bound 49/3 ≈ 16.33. Branch on x₁: <em>Node 1</em> (x₁ ≤ 2) bound 15.5; <em>Node 2</em> (x₁ ≥ 3) bound 15. Continue branching Node 1 → Node 1a (bound 14, pruned by bound) and Node 1b (best 13). Best integer found: (3,1) with z*=15.",
          },
        ],
      },
    ],
  },

  // =====================================================================
  // 6. EXACT ALGORITHMS
  // =====================================================================
  {
    id: "exact",
    title: "Exact Algorithms for Combinatorial Optimization",
    description:
      "Brute force, dynamic programming, constraint programming, Benders, Dantzig–Wolfe, branch-and-cut, branch-and-price.",
    icon: "✓",
    topics: [
      {
        id: "brute-force",
        assignments: ["P4"],
        difficulty: "intro",
        title: "Complete Enumeration (Brute Force)",
        intro:
          "Generate and evaluate every feasible solution. Always correct, but exponential in problem size — only practical for tiny instances or as a benchmark.",
        qa: [
          {
            id: "what-bf",
            question: "What is complete enumeration?",
            answer:
              "Systematically generate and evaluate every feasible solution, then select the best. Always correct; rarely tractable.",
          },
          {
            id: "bf-complexity",
            question: "Computational complexity of brute force?",
            answer:
              "For NP-hard combinatorial problems the number of feasible solutions grows exponentially, so brute force needs time exponential in the input — e.g. O(2ⁿ) for a 0/1 problem with n binaries.",
          },
          {
            id: "when-bf",
            question: "When can brute force still be useful?",
            answer:
              "For very small instances; as a ground-truth benchmark to test heuristics; when problem structure severely limits the number of true candidates.",
          },
          {
            id: "knap-bf",
            question:
              "Apply brute force: max 8x₁+6x₂+5x₃ s.t. 4x₁+3x₂+2x₃ ≤ 5, xᵢ ∈ {0,1}.",
            answer:
              "Enumerate all 2³=8 binaries; feasible ones are (0,0,0), (1,0,0), (0,1,0), (0,0,1), (0,1,1). Evaluating the objective: maximum 11 at (0,1,1).",
            code: {
              language: "python",
              title: "Brute-force 0/1 knapsack",
              source: `from itertools import product
p, w, W = [8,6,5], [4,3,2], 5
best = max(
    ((sum(p[i]*x[i] for i in range(3)), x)
     for x in product([0,1], repeat=3)
     if sum(w[i]*x[i] for i in range(3)) <= W),
    key=lambda t: t[0])
print(best)   # (11, (0,1,1))`,
            },
          },
        ],
      },
      {
        id: "dp",
        assignments: ["P4", "Book2"],
        difficulty: "intermediate",
        title: "Dynamic Programming",
        intro:
          "Decompose the problem into overlapping subproblems, solve each once, store results in a table. Requires optimal substructure and overlapping subproblems.",
        qa: [
          {
            id: "dp-idea",
            question: "Main idea behind dynamic programming?",
            answer:
              "Decompose into overlapping subproblems, solve each smaller subproblem once, and store its solution in a table so it can be reused instead of recomputed.",
          },
          {
            id: "overlapping",
            question: "What are overlapping subproblems?",
            answer:
              "Subproblems (states) that recur multiple times in the natural recursion. Memoization or tabulation then yields huge savings versus naive recursion.",
          },
          {
            id: "bellman",
            question: "State Bellman's principle of optimality.",
            answer:
              "An optimal policy has the property that, regardless of the initial state and initial decision, the remaining decisions must constitute an optimal policy with respect to the state resulting from the first decision.",
          },
          {
            id: "dp-suitable",
            question: "Which problems suit DP?",
            answer:
              "Those with both <strong>optimal substructure</strong> and <strong>overlapping subproblems</strong> — shortest paths, knapsack, sequence alignment, scheduling, inventory.",
          },
          {
            id: "dp-components",
            question: "Components of a dynamic program?",
            answer:
              "<strong>States</strong> (variables describing the subproblem), <strong>decisions</strong> (choices at each state), <strong>transitions</strong> (state evolution), <strong>value function</strong> (best objective from a state), <strong>boundary conditions</strong>, and an <strong>evaluation order</strong>.",
          },
          {
            id: "dp-knap",
            question: "DP table for 0/1 knapsack with profits/weights/capacity from P4.",
            answer:
              "Define V(i, c) = best profit using items 1..i with capacity c. Recurrence: V(i, c) = max{ V(i−1, c), V(i−1, c−wᵢ) + pᵢ } if wᵢ ≤ c, else V(i−1, c). Backtrack from (n, W) to recover the chosen items.",
            code: {
              language: "python",
              title: "0/1 knapsack — bottom-up DP",
              source: `def knapsack(p, w, W):
    n = len(p)
    V = [[0]*(W+1) for _ in range(n+1)]
    for i in range(1, n+1):
        for c in range(W+1):
            V[i][c] = V[i-1][c]
            if w[i-1] <= c:
                V[i][c] = max(V[i][c], V[i-1][c-w[i-1]] + p[i-1])
    # backtrack
    x, c = [0]*n, W
    for i in range(n, 0, -1):
        if V[i][c] != V[i-1][c]:
            x[i-1] = 1; c -= w[i-1]
    return V[n][W], x`,
            },
          },
        ],
      },
      {
        id: "csp",
        assignments: ["P4"],
        difficulty: "intermediate",
        title: "Constraint Programming",
        intro:
          "CSPs assign values from finite domains to variables so that all constraints are satisfied. Global constraints and propagation make CP very effective on highly constrained problems.",
        qa: [
          {
            id: "what-csp",
            question: "What is a constraint satisfaction problem?",
            answer:
              "A set of variables, each with a finite domain, and a set of constraints specifying allowed value combinations. Goal: assign each variable a value from its domain so that all constraints hold.",
          },
          {
            id: "global-constraint",
            question: "What is a global constraint?",
            answer:
              "A high-level constraint involving many variables with a dedicated propagation algorithm that exploits its structure better than a decomposition. Examples: <code>AllDifferent</code>, <code>Cumulative</code>, <code>Circuit</code>, <code>GlobalCardinality</code>.",
          },
          {
            id: "backtracking",
            question: "What is backtracking search?",
            answer:
              "A depth-first search that incrementally assigns values to variables; when a partial assignment violates a constraint or empties a domain, it backtracks and tries alternatives.",
          },
          {
            id: "where-cp",
            question: "Where is CP particularly effective?",
            answer:
              "Highly constrained combinatorial problems — scheduling, timetabling, rostering, vehicle routing with side constraints, configuration, puzzles.",
          },
        ],
      },
      {
        id: "decomposition",
        assignments: ["P4", "Book2"],
        difficulty: "advanced",
        title: "Benders, Dantzig–Wolfe & Branch-and-Cut/Price",
        intro:
          "Decomposition methods exploit problem structure: Benders separates complicating variables, Dantzig–Wolfe handles complicating constraints via column generation. Branch-and-cut and branch-and-price embed cuts and column generation into B&B.",
        qa: [
          {
            id: "benders",
            question: "How does Benders decomposition work?",
            answer:
              "Fix the complicating variables x = x̄ and solve the easier subproblem in y. From the subproblem derive optimality cuts (if feasible) or feasibility cuts (if not), and add them to a master problem in (x, θ). Iterate until no new cuts.",
            math: ["Master:  min  cᵀx + θ", "         s.t.  Benders cuts on (x, θ)", "                x ∈ X"],
          },
          {
            id: "dw",
            question: "How does Dantzig–Wolfe column generation work?",
            answer:
              "Reformulate using extreme points/columns of substructures; the master picks combinations of columns, the pricing subproblem generates new improving columns. Add columns until none has negative reduced cost.",
          },
          {
            id: "bc-bp",
            question: "Difference between branch-and-cut and branch-and-price?",
            answer:
              "<strong>Branch-and-cut</strong> adds violated cuts (rows) to tighten LP relaxations inside B&B. <strong>Branch-and-price</strong> uses column generation inside B&B to handle huge column sets — typical in vehicle routing with time windows, crew scheduling, cutting stock.",
          },
          {
            id: "benders-vs-dw",
            question: "Benders vs. Dantzig–Wolfe — when to use which?",
            answer:
              "Benders adds <em>rows</em> (cuts) and is natural when complicating <em>variables</em> live in the master. Dantzig–Wolfe adds <em>columns</em> and is natural when substructures correspond to patterns or routes.",
          },
        ],
      },
    ],
  },

  // =====================================================================
  // 7. HEURISTICS & METAHEURISTICS
  // =====================================================================
  {
    id: "heuristics",
    title: "Heuristics, Metaheuristics & Approximation",
    description:
      "When exact methods don't scale: greedy heuristics, local search, metaheuristics like SA, GA, Tabu, ACO, PSO, VNS, ILS, and approximation algorithms with provable guarantees.",
    icon: "≈",
    topics: [
      {
        id: "approx",
        assignments: ["P5"],
        difficulty: "advanced",
        title: "Approximation Algorithms",
        intro:
          "Polynomial-time algorithms that always return a feasible solution together with a provable bound on how far that solution can be from the optimum.",
        qa: [
          {
            id: "what-approx",
            question: "What is an approximation algorithm?",
            answer:
              "A polynomial-time algorithm for an (often NP-hard) optimization problem that always returns a feasible solution together with a <em>provable</em> bound on how far it can be from the optimum.",
          },
          {
            id: "approx-ratio",
            question: "What is an approximation ratio?",
            answer:
              "<strong>Min</strong>: ratio ρ ≥ 1 if A(I)/OPT(I) ≤ ρ for every instance. <strong>Max</strong>: ratio ρ ≥ 1 if OPT(I)/A(I) ≤ ρ, equivalently A(I) ≥ OPT(I)/ρ. Smaller is better; ρ = 1 means optimality.",
          },
          {
            id: "worst-case",
            question: "What does 'worst-case guarantee' mean?",
            answer:
              "The performance bound holds for <em>every</em> input — never just on average. No matter how unfavorable the instance, the algorithm is no worse than its stated bound.",
          },
          {
            id: "ptas",
            question: "What is a PTAS?",
            answer:
              "A Polynomial-Time Approximation Scheme: a family of algorithms parameterized by ε > 0 such that for any fixed ε the algorithm runs in polynomial time and returns a solution within (1+ε) of optimum (min) or (1−ε) (max).",
          },
          {
            id: "fptas",
            question: "PTAS vs FPTAS?",
            answer:
              "A <strong>PTAS</strong> is polynomial in n for each fixed ε (degree may depend on 1/ε). An <strong>FPTAS</strong> is polynomial in <em>both</em> n and 1/ε — strictly stronger.",
          },
          {
            id: "vc-2approx",
            question: "Standard 2-approximation for Vertex Cover?",
            answer:
              "Repeatedly pick any uncovered edge (u,v), add <em>both</em> endpoints to the cover, delete all incident edges. Guaranteed to be at most 2× the optimal cover, because the matching of picked edges lower-bounds OPT.",
            code: {
              language: "python",
              title: "2-approximation Vertex Cover",
              source: `def vertex_cover_2approx(edges):
    C, E = set(), set(map(frozenset, edges))
    while E:
        u, v = next(iter(next(iter(E))))[:2] if False else tuple(next(iter(E)))
        C.update([u, v])
        E = {e for e in E if u not in e and v not in e}
    return C

print(vertex_cover_2approx([(1,2),(1,3),(2,3),(2,4),(3,5)]))`,
            },
          },
          {
            id: "tsp-double-tree",
            question: "Double-tree algorithm for metric TSP — what's the ratio?",
            answer:
              "Compute an MST T, duplicate every edge, find an Euler tour, shortcut repeated vertices to get a Hamiltonian cycle. Since deleting one edge from any TSP tour yields a spanning tree, w(T) ≤ OPT, so the duplicated multigraph has weight ≤ 2·OPT, and shortcutting (in metric TSP) cannot increase weight. Hence a <strong>2-approximation</strong>.",
          },
          {
            id: "christofides",
            question: "Christofides algorithm for metric TSP — what's the ratio?",
            answer:
              "MST T plus a minimum-weight perfect matching M on the odd-degree vertices of T. The resulting multigraph is Eulerian; shortcut to obtain a Hamiltonian cycle. Bound: w(T) ≤ OPT and w(M) ≤ ½ OPT, giving a <strong>3/2 approximation</strong>.",
          },
        ],
      },
      {
        id: "heuristic-classes",
        assignments: ["P5"],
        difficulty: "intro",
        title: "Constructive & Search-Based Heuristics",
        intro:
          "Heuristics quickly produce good feasible solutions without guarantees. They split into constructive heuristics (build a solution from scratch) and search-based heuristics (improve an initial solution).",
        qa: [
          {
            id: "what-heuristic",
            question: "What is a heuristic algorithm?",
            answer:
              "A problem-solving method designed to quickly produce a good feasible solution, without guaranteeing optimality.",
          },
          {
            id: "construction-order",
            question: "Why does construction order matter for constructive heuristics?",
            answer:
              "Early decisions restrict later choices. E.g., TSP nearest-neighbour produces very different tours depending on the start city.",
          },
          {
            id: "local-search",
            question: "What is local search?",
            answer:
              "Begin with a feasible solution and repeatedly replace it by a better neighbour until no improving neighbour exists.",
          },
          {
            id: "neighborhood",
            question: "What is a neighbourhood structure?",
            answer:
              "A function N(s) that returns the set of solutions reachable from s by a defined move (e.g., swap two cities in a TSP tour, flip one bit in a binary vector).",
          },
          {
            id: "nn-tsp",
            question: "Apply nearest-neighbour heuristic to a TSP instance.",
            answer:
              "Start at a city; at each step move to the closest unvisited city; return to the start. Simple but order-dependent — restart from several seeds to improve quality.",
            code: {
              language: "python",
              title: "Nearest-neighbour TSP",
              source: `def nearest_neighbour(D, start=0):
    n = len(D)
    visited = [start]; cost = 0
    while len(visited) < n:
        last = visited[-1]
        nxt = min((j for j in range(n) if j not in visited),
                  key=lambda j: D[last][j])
        cost += D[last][nxt]; visited.append(nxt)
    cost += D[visited[-1]][start]
    return visited + [start], cost`,
            },
          },
        ],
      },
      {
        id: "metaheuristics",
        assignments: ["P5", "Book2"],
        difficulty: "intermediate",
        title: "Metaheuristics",
        intro:
          "High-level strategies that guide the search to escape local optima — Simulated Annealing, Genetic Algorithms, Tabu Search, Ant Colony, PSO, VNS, ILS, GRASP.",
        qa: [
          {
            id: "what-meta",
            question: "What is a metaheuristic?",
            answer:
              "A high-level strategy that guides the search process to explore solution spaces effectively and escape poor local optima.",
          },
          {
            id: "meta-vs-heur",
            question: "How do metaheuristics differ from simple heuristics?",
            answer:
              "Simple heuristics follow one direct, problem-specific rule. Metaheuristics are broader frameworks that combine <em>diversification</em> (explore) and <em>intensification</em> (exploit) and adapt to many problems.",
          },
          {
            id: "sa",
            question: "How does Simulated Annealing work?",
            answer:
              "Start at a high temperature T accepting many uphill moves; cool gradually so that the probability of accepting worse solutions decreases. Acceptance rule: always accept Δ ≤ 0; otherwise accept with probability exp(−Δ/T). Inspired by metallurgical annealing.",
            code: {
              language: "python",
              title: "Simulated Annealing skeleton",
              source: `import math, random
def simulated_annealing(s0, neighbour, f, T0=1.0, alpha=0.995, n_iter=10_000):
    s = s0; best = s; T = T0
    for _ in range(n_iter):
        s2 = neighbour(s)
        delta = f(s2) - f(s)
        if delta <= 0 or random.random() < math.exp(-delta/T):
            s = s2
            if f(s) < f(best): best = s
        T *= alpha
    return best`,
            },
          },
          {
            id: "ga",
            question: "How does a Genetic Algorithm work?",
            answer:
              "Maintain a population of candidate solutions. Each generation: select parents by fitness, apply crossover to produce offspring, mutate, evaluate, replace. Strong global exploration but needs tuning to avoid premature convergence.",
          },
          {
            id: "tabu",
            question: "How does Tabu Search work?",
            answer:
              "Move to the best admissible neighbour each iteration, even if worse. Recently visited solutions or moves are stored in a <strong>tabu list</strong> to forbid cycling. An aspiration criterion can override the tabu when a move would improve the best known solution.",
          },
          {
            id: "aco",
            question: "Ant Colony Optimization in one paragraph?",
            answer:
              "Ants construct solutions probabilistically, biased by pheromone trails and a heuristic. After each iteration, pheromone evaporates and is reinforced on edges of good solutions — concentrating future search on promising regions.",
          },
          {
            id: "pso",
            question: "Particle Swarm Optimization in one paragraph?",
            answer:
              "Particles move through the search space with a velocity influenced by their personal best and the swarm's global best. Simple and derivative-free; effective in continuous optimization, less natural for discrete problems.",
          },
          {
            id: "vns",
            question: "Variable Neighbourhood Search?",
            answer:
              "Cycle through a sequence of neighbourhoods of increasing size. <em>Shake</em>: pick a random neighbour from N_k. <em>Local search</em>: improve from there. If improving, restart from N₁; else move to N_{k+1}. Strong against local optima with simple machinery.",
          },
        ],
      },
      {
        id: "comparison",
        assignments: ["P5"],
        difficulty: "intro",
        title: "Comparative Analysis",
        intro:
          "When to choose exact, approximation, heuristic, or metaheuristic.",
        qa: [
          {
            id: "compare",
            question: "Compare exact, approximation, heuristic, and metaheuristic methods.",
            answer:
              "<ul><li><strong>Exact</strong> — guaranteed optimum, exponential worst-case time, small/medium instances or critical decisions.</li><li><strong>Approximation</strong> — provable bound (e.g., 2× optimum), polynomial time, good when guarantees matter but exact is too slow.</li><li><strong>Heuristic</strong> — fast, good in practice, no guarantee.</li><li><strong>Metaheuristic</strong> — flexible framework, strong on large/complex instances, no guarantee but excellent practical performance.</li></ul>",
          },
          {
            id: "when-prefer",
            question: "When to prefer each approach?",
            answer:
              "<strong>Exact</strong>: small instances, regulatory/safety domains, when an optimality certificate is required. <strong>Approximation</strong>: when worst-case quality must be bounded. <strong>Heuristic</strong>: real-time decisions, simple problems, prototyping. <strong>Metaheuristic</strong>: large-scale industrial problems where good-enough fast beats optimal-eventually.",
          },
        ],
      },
    ],
  },
];

/** Flat list of all topics across categories — useful for search. */
export function flattenTopics() {
  return KB_CATEGORIES.flatMap((c) =>
    c.topics.map((t) => ({ category: c, topic: t })),
  );
}

/** Flat list of every QA, with its category and topic. */
export function flattenQAs() {
  const out: Array<{ category: Category; topic: Topic; qa: QA; fullId: string }> = [];
  for (const c of KB_CATEGORIES) {
    for (const t of c.topics) {
      for (const qa of t.qa) {
        out.push({ category: c, topic: t, qa, fullId: `${c.id}/${t.id}/${qa.id}` });
      }
    }
  }
  return out;
}

export type SearchFacets = {
  categoryId?: string;
  assignment?: Assignment;
  difficulty?: Difficulty;
};

/** Search across categories, topics, questions, and answers, optionally filtered by facets. */
export function searchKB(query: string, facets: SearchFacets = {}) {
  const q = query.trim().toLowerCase();
  const hits: Array<{
    categoryId: string;
    topicId: string;
    qaId: string;
    question: string;
    snippet: string;
    categoryTitle: string;
    topicTitle: string;
    assignments: Assignment[];
    difficulty: Difficulty | undefined;
  }> = [];
  for (const c of KB_CATEGORIES) {
    if (facets.categoryId && c.id !== facets.categoryId) continue;
    for (const t of c.topics) {
      if (facets.assignment && !(t.assignments || []).includes(facets.assignment)) continue;
      if (facets.difficulty && t.difficulty !== facets.difficulty) continue;
      for (const qa of t.qa) {
        if (q) {
          const haystack = (
            qa.question +
            " " +
            qa.answer +
            " " +
            (qa.deepDive || "") +
            " " +
            t.title +
            " " +
            c.title
          ).toLowerCase();
          if (!haystack.includes(q)) continue;
        }
        hits.push({
          categoryId: c.id,
          topicId: t.id,
          qaId: qa.id,
          question: qa.question,
          snippet: qa.answer.replace(/<[^>]+>/g, "").slice(0, 160),
          categoryTitle: c.title,
          topicTitle: t.title,
          assignments: t.assignments || [],
          difficulty: t.difficulty,
        });
      }
    }
  }
  return hits;
}


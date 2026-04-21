import { useCallback, useEffect, useState } from "react";

export type Lang = "en" | "de" | "zh" | "fa";

export const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "EN" },
  { code: "de", label: "Deutsch", native: "DE" },
  { code: "zh", label: "中文", native: "中文" },
  { code: "fa", label: "فارسی", native: "FA" },
];

export const RTL_LANGS: Lang[] = ["fa"];

export type Dict = {
  nav: {
    about: string;
    tasks: string;
    projects: string;
    research: string;
    dashboard: string;
    contact: string;
    github: string;
    skip: string;
    open: string;
    close: string;
    language: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    ctaPrimaryFull: string;
    ctaPrimaryLanding: string;
    ctaSecondary: string;
  };
  about: {
    kicker: string;
    title: string;
    intro: string;
    focus: string;
    pillars: { num: string; name: string; meta: string }[];
    kpiDept: string;
    kpiDeptValue: string;
    kpiFaculty: string;
    kpiFacultyValue: string;
    kpiStack: string;
    kpiOpenSource: string;
  };
  tasks: { kicker: string; title: string; intro: string; filterAria: string };
  projects: { kicker: string; title: string; intro: string };
  research: { kicker: string; title: string; intro: string };
  dashCta: { kicker: string; title: string; intro: string; button: string };
  contact: {
    kicker: string;
    title: string;
    intro: string;
    emailBtn: string;
    githubBtn: string;
  };
  footer: {
    contact: string;
    address: string;
    rights: string;
  };
};

const en: Dict = {
  nav: {
    about: "About",
    tasks: "Tasks",
    projects: "Projects",
    research: "Research",
    dashboard: "Dashboard",
    contact: "Contact",
    github: "GitHub",
    skip: "Skip to main content",
    open: "Open navigation menu",
    close: "Close navigation menu",
    language: "Language",
  },
  hero: {
    eyebrow: "Brandenburg University of Technology Cottbus–Senftenberg",
    title: "WGBIBA — Business Informatics & Analytics",
    lead: "A research and teaching group exploring data analytics, optimization, and modern software development for the digital enterprise.",
    ctaPrimaryFull: "Explore Work",
    ctaPrimaryLanding: "Get in Touch",
    ctaSecondary: "Learn More",
  },
  about: {
    kicker: "About the Group",
    title:
      "Research & teaching at the intersection of business and informatics",
    intro:
      "WGBIBA at BTU Cottbus–Senftenberg combines rigorous methods from information systems, analytics, and computer science to address real business challenges with measurable impact.",
    focus: "Focus areas",
    pillars: [
      { num: "01", name: "Data Analytics", meta: "stats · ML · BI" },
      { num: "02", name: "Optimization", meta: "LP · MILP · OR" },
      { num: "03", name: "Software Dev", meta: "web · tooling · DSS" },
    ],
    kpiDept: "Department",
    kpiDeptValue: "Business Informatics & Analytics",
    kpiFaculty: "Faculty",
    kpiFacultyValue: "BTU Cottbus–Senftenberg",
    kpiStack: "Stack",
    kpiOpenSource: "Open source",
  },
  tasks: {
    kicker: "Coursework",
    title: "Tasks & Assignments",
    intro:
      "Materials for current courses. Filter by tag to find what you need.",
    filterAria: "Filter tasks by course or tag",
  },
  projects: {
    kicker: "Software",
    title: "Projects & Tools",
    intro: "Open-source software developed by the group and its students.",
  },
  research: {
    kicker: "Publications",
    title: "Research",
    intro: "Selected papers, technical reports, and repositories.",
  },
  dashCta: {
    kicker: "Pseudo Admin",
    title: "Content Dashboard",
    intro:
      "Generate JSON snippets for new tasks and projects on a dedicated page. Nothing is stored — copy the output and paste it into the GitHub repo.",
    button: "Open Dashboard →",
  },
  contact: {
    kicker: "Get in touch",
    title: "Let's collaborate on research and analytics",
    intro:
      "Whether you're a prospective master student, a researcher looking for collaborators, or an industry partner with a real-world challenge — we'd love to hear from you.",
    emailBtn: "✉  Email  wgbiba.dept@gmail.com",
    githubBtn: "⌥  github.com/wgbiba",
  },
  footer: {
    contact: "Contact",
    address: "Address",
    rights: "All rights reserved.",
  },
};

const de: Dict = {
  nav: {
    about: "Über uns",
    tasks: "Aufgaben",
    projects: "Projekte",
    research: "Forschung",
    dashboard: "Dashboard",
    contact: "Kontakt",
    github: "GitHub",
    skip: "Zum Hauptinhalt springen",
    open: "Navigationsmenü öffnen",
    close: "Navigationsmenü schließen",
    language: "Sprache",
  },
  hero: {
    eyebrow: "Brandenburgische Technische Universität Cottbus–Senftenberg",
    title: "WGBIBA — Wirtschaftsinformatik & Analytics",
    lead: "Eine Forschungs- und Lehrgruppe, die Datenanalyse, Optimierung und moderne Softwareentwicklung für das digitale Unternehmen erforscht.",
    ctaPrimaryFull: "Arbeiten ansehen",
    ctaPrimaryLanding: "Kontakt aufnehmen",
    ctaSecondary: "Mehr erfahren",
  },
  about: {
    kicker: "Über die Gruppe",
    title:
      "Forschung & Lehre an der Schnittstelle von Wirtschaft und Informatik",
    intro:
      "WGBIBA an der BTU Cottbus–Senftenberg verbindet rigorose Methoden aus Wirtschaftsinformatik, Analytik und Informatik, um reale Geschäftsprobleme mit messbarer Wirkung zu lösen.",
    focus: "Schwerpunkte",
    pillars: [
      { num: "01", name: "Datenanalyse", meta: "Statistik · ML · BI" },
      { num: "02", name: "Optimierung", meta: "LP · MILP · OR" },
      { num: "03", name: "Softwareentwicklung", meta: "Web · Tools · DSS" },
    ],
    kpiDept: "Fachgebiet",
    kpiDeptValue: "Wirtschaftsinformatik & Analytics",
    kpiFaculty: "Hochschule",
    kpiFacultyValue: "BTU Cottbus–Senftenberg",
    kpiStack: "Stack",
    kpiOpenSource: "Open Source",
  },
  tasks: {
    kicker: "Lehrveranstaltungen",
    title: "Aufgaben & Übungen",
    intro:
      "Materialien für aktuelle Kurse. Nach Tag filtern, um Inhalte schnell zu finden.",
    filterAria: "Aufgaben nach Kurs oder Tag filtern",
  },
  projects: {
    kicker: "Software",
    title: "Projekte & Werkzeuge",
    intro: "Open-Source-Software, entwickelt von der Gruppe und Studierenden.",
  },
  research: {
    kicker: "Publikationen",
    title: "Forschung",
    intro: "Ausgewählte Artikel, technische Berichte und Repositories.",
  },
  dashCta: {
    kicker: "Pseudo-Admin",
    title: "Inhalts-Dashboard",
    intro:
      "JSON-Snippets für neue Aufgaben und Projekte auf einer eigenen Seite generieren. Es wird nichts gespeichert — Ausgabe kopieren und ins GitHub-Repo einfügen.",
    button: "Dashboard öffnen →",
  },
  contact: {
    kicker: "Kontakt",
    title: "Lassen Sie uns gemeinsam forschen und analysieren",
    intro:
      "Ob angehende:r Masterstudent:in, Forschende:r auf der Suche nach Kooperationen oder Industriepartner:in mit einer realen Herausforderung — wir freuen uns auf Ihre Nachricht.",
    emailBtn: "✉  E-Mail  wgbiba.dept@gmail.com",
    githubBtn: "⌥  github.com/wgbiba",
  },
  footer: {
    contact: "Kontakt",
    address: "Adresse",
    rights: "Alle Rechte vorbehalten.",
  },
};

const zh: Dict = {
  nav: {
    about: "关于",
    tasks: "任务",
    projects: "项目",
    research: "研究",
    dashboard: "管理面板",
    contact: "联系",
    github: "GitHub",
    skip: "跳至主要内容",
    open: "打开导航菜单",
    close: "关闭导航菜单",
    language: "语言",
  },
  hero: {
    eyebrow: "勃兰登堡科技大学 科特布斯-森夫滕贝格",
    title: "WGBIBA — 商务信息学与分析",
    lead: "一个研究与教学小组,致力于数据分析、优化以及面向数字化企业的现代软件开发。",
    ctaPrimaryFull: "查看成果",
    ctaPrimaryLanding: "联系我们",
    ctaSecondary: "了解更多",
  },
  about: {
    kicker: "关于本组",
    title: "在商业与信息学交汇处的研究与教学",
    intro:
      "WGBIBA(BTU 科特布斯-森夫滕贝格)结合信息系统、分析和计算机科学的严谨方法,以可衡量的成效解决真实的商业挑战。",
    focus: "研究方向",
    pillars: [
      { num: "01", name: "数据分析", meta: "统计 · 机器学习 · BI" },
      { num: "02", name: "优化", meta: "LP · MILP · 运筹学" },
      { num: "03", name: "软件开发", meta: "Web · 工具 · 决策支持" },
    ],
    kpiDept: "系所",
    kpiDeptValue: "商务信息学与分析",
    kpiFaculty: "院校",
    kpiFacultyValue: "BTU 科特布斯-森夫滕贝格",
    kpiStack: "技术栈",
    kpiOpenSource: "开源",
  },
  tasks: {
    kicker: "课程",
    title: "任务与作业",
    intro: "当前课程的资料。可按标签筛选以快速查找。",
    filterAria: "按课程或标签筛选任务",
  },
  projects: {
    kicker: "软件",
    title: "项目与工具",
    intro: "由本组和学生开发的开源软件。",
  },
  research: {
    kicker: "发表",
    title: "研究",
    intro: "精选论文、技术报告与代码仓库。",
  },
  dashCta: {
    kicker: "演示管理",
    title: "内容管理面板",
    intro:
      "在专用页面上为新任务与项目生成 JSON 片段。不会保存任何数据 —— 复制输出并粘贴到 GitHub 仓库即可。",
    button: "打开面板 →",
  },
  contact: {
    kicker: "联系我们",
    title: "让我们一起开展研究与分析合作",
    intro:
      "无论您是潜在的硕士生、寻找合作者的研究人员,还是带着真实挑战的产业伙伴 —— 我们都期待您的来信。",
    emailBtn: "✉  邮箱  wgbiba.dept@gmail.com",
    githubBtn: "⌥  github.com/wgbiba",
  },
  footer: {
    contact: "联系方式",
    address: "地址",
    rights: "保留所有权利。",
  },
};

const fa: Dict = {
  nav: {
    about: "درباره",
    tasks: "تکالیف",
    projects: "پروژه‌ها",
    research: "پژوهش",
    dashboard: "داشبورد",
    contact: "تماس",
    github: "گیت‌هاب",
    skip: "پرش به محتوای اصلی",
    open: "باز کردن منوی پیمایش",
    close: "بستن منوی پیمایش",
    language: "زبان",
  },
  hero: {
    eyebrow: "دانشگاه فناوری براندنبورگ کوتبوس–زنفتنبرگ",
    title: "WGBIBA — اطلاع‌رسانی کسب‌وکار و تحلیل داده",
    lead: "گروهی پژوهشی و آموزشی که در حوزهٔ تحلیل داده، بهینه‌سازی و توسعهٔ نرم‌افزار مدرن برای سازمان‌های دیجیتال فعالیت می‌کند.",
    ctaPrimaryFull: "مشاهدهٔ کارها",
    ctaPrimaryLanding: "تماس با ما",
    ctaSecondary: "بیشتر بدانید",
  },
  about: {
    kicker: "دربارهٔ گروه",
    title: "پژوهش و آموزش در تقاطع کسب‌وکار و انفورماتیک",
    intro:
      "WGBIBA در BTU کوتبوس–زنفتنبرگ با ترکیب روش‌های دقیق از سیستم‌های اطلاعاتی، تحلیل داده و علوم کامپیوتر، چالش‌های واقعی کسب‌وکار را با اثرگذاری قابل‌اندازه‌گیری حل می‌کند.",
    focus: "حوزه‌های تمرکز",
    pillars: [
      { num: "۰۱", name: "تحلیل داده", meta: "آمار · ML · BI" },
      { num: "۰۲", name: "بهینه‌سازی", meta: "LP · MILP · OR" },
      { num: "۰۳", name: "توسعهٔ نرم‌افزار", meta: "وب · ابزار · DSS" },
    ],
    kpiDept: "گروه",
    kpiDeptValue: "اطلاع‌رسانی کسب‌وکار و تحلیل",
    kpiFaculty: "دانشگاه",
    kpiFacultyValue: "BTU کوتبوس–زنفتنبرگ",
    kpiStack: "فناوری‌ها",
    kpiOpenSource: "متن‌باز",
  },
  tasks: {
    kicker: "درس‌ها",
    title: "تکالیف و تمرین‌ها",
    intro: "منابع درس‌های جاری. برای یافتن سریع‌تر، با برچسب فیلتر کنید.",
    filterAria: "فیلتر تکالیف بر اساس درس یا برچسب",
  },
  projects: {
    kicker: "نرم‌افزار",
    title: "پروژه‌ها و ابزارها",
    intro: "نرم‌افزارهای متن‌باز توسعه‌یافته توسط گروه و دانشجویان آن.",
  },
  research: {
    kicker: "انتشارات",
    title: "پژوهش",
    intro: "مقالات منتخب، گزارش‌های فنی و مخازن کد.",
  },
  dashCta: {
    kicker: "ادمین آزمایشی",
    title: "داشبورد محتوا",
    intro:
      "در یک صفحهٔ اختصاصی برای تکالیف و پروژه‌های جدید قطعه‌های JSON تولید کنید. هیچ داده‌ای ذخیره نمی‌شود — خروجی را کپی و در مخزن گیت‌هاب قرار دهید.",
    button: "باز کردن داشبورد →",
  },
  contact: {
    kicker: "در تماس باشید",
    title: "بیایید در پژوهش و تحلیل همکاری کنیم",
    intro:
      "خواه دانشجوی آیندهٔ کارشناسی ارشد باشید، پژوهشگری در جست‌وجوی همکاری، یا یک شریک صنعتی با چالشی واقعی — مشتاق شنیدن از شما هستیم.",
    emailBtn: "✉  ایمیل  wgbiba.dept@gmail.com",
    githubBtn: "⌥  github.com/wgbiba",
  },
  footer: {
    contact: "تماس",
    address: "نشانی",
    rights: "تمامی حقوق محفوظ است.",
  },
};

const DICTS: Record<Lang, Dict> = { en, de, zh, fa };

const STORAGE_KEY = "wgbiba.lang";

function detectInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && DICTS[stored]) return stored;
  } catch {
    /* ignore */
  }
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("de")) return "de";
  if (nav.startsWith("zh")) return "zh";
  if (nav.startsWith("fa") || nav.startsWith("pe")) return "fa";
  return "en";
}

export function useI18n() {
  const [lang, setLangState] = useState<Lang>("en");

  // Hydrate from storage / browser preference on mount.
  useEffect(() => {
    setLangState(detectInitialLang());
  }, []);

  // Apply <html lang> and dir attributes whenever lang changes.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return { lang, setLang, t: DICTS[lang], isRTL: RTL_LANGS.includes(lang) };
}

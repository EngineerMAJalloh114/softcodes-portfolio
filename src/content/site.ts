/**
 * Single source of truth for all text content on the site.
 * Edit this file to change copy, projects, services or contact details.
 */
import { HIRE_MESSAGE, whatsappUrl, type Cta } from "@/lib/content/whatsapp";

export type ProjectStatus = "Live" | "In development" | "Coming soon" | "Concept";

/** Portfolio filter type (M-11). */
export const PROJECT_TYPES = ["website", "platform", "app", "branding", "other"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export type ProjectLink = { label: string; href: string };

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  status: ProjectStatus;
  featured: boolean;
  kind: string;
  /** Filter type for M-11. */
  type: ProjectType;
  tags: string[];
  problem: string;
  solution: string;
  features: string[];
  stack: string[];
  /** Screenshot slots. `src: null` renders a placeholder. */
  /** Screenshot slots. `src`: a /public path, an https URL, or `media:<id>`; null renders a placeholder. */
  screenshots: { src: string | null; alt: string }[];
  links: ProjectLink[];
  /** Set only in draft preview, for items not yet published. */
  isDraft?: boolean;
};

export const site = {
  // TODO: replace with the final production domain once it is connected in Vercel.
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
  name: "Mohamed Abass Jalloh",
  shortName: "Soft CODES",
  title: "Software Engineer · Founder of Soft CODES",
  description:
    "Mohamed Abass Jalloh — software engineer in Freetown, Sierra Leone, and founder of Soft CODES. I build fast, fully customisable websites and business platforms.",
  locale: "en",
};

export const person = {
  name: "Mohamed Abass Jalloh",
  role: "Software Engineer",
  company: "Soft CODES",
  location: "Freetown, Sierra Leone",
  education:
    "BSc Software Engineering with Multimedia, Limkokwing University of Creative Technology",
  experience: "IT internship at NASSIT",
  // TODO(DEC-30): interim photo — owner will supply a new portrait for the About section.
  photo: "/brand/me.jpg" as string | null,
  photoAlt: "Portrait of Mohamed Abass Jalloh",
};

export const contact = {
  email: "engineermohamedabassjalloh3855@gmail.com",
  whatsappDisplay: "+232 32 829 316",
  // DEC-37: derived from the number; on the live site these come from Settings.
  whatsappUrl: whatsappUrl("+232 32 829 316"),
  whatsappHireUrl: whatsappUrl("+232 32 829 316", HIRE_MESSAGE),
};

export const nav = {
  links: [
    { label: "About", href: "/about" },
    { label: "Services", href: "/#services" },
    { label: "Projects", href: "/projects" },
    { label: "Pricing", href: "/pricing" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
  ],
  hireLabel: "Hire me",
};

export const hero = {
  eyebrow: "Freetown, Sierra Leone",
  name: person.name,
  title: site.title,
  pitch: "I build fast, fully customisable websites and business platforms.",
  primaryCta: { label: "View Projects", kind: "url", href: "/projects" } as Cta,
  secondaryCta: { label: "Hire Me", kind: "whatsapp", href: "" } as Cta, // number from Settings (DEC-37)
};

export const about = {
  eyebrow: "About",
  heading: "Calm software for busy businesses.",
  // TODO: replace this placeholder bio with Mohamed's own words.
  paragraphs: [
    "I'm a software engineer based in Freetown, Sierra Leone, and the founder of Soft CODES. I design and build websites and business platforms that owners can run themselves — no developer needed for everyday changes.",
    "I studied Software Engineering with Multimedia at Limkokwing University of Creative Technology and gained hands-on IT experience during my internship at NASSIT. Today I focus on fast, dependable products for businesses across Sierra Leone and beyond.",
  ],
  facts: [
    { label: "Based in", value: "Freetown, Sierra Leone" },
    { label: "Education", value: "BSc Software Engineering with Multimedia — Limkokwing University" },
    { label: "Experience", value: "IT internship at NASSIT" },
    { label: "Company", value: "Founder of Soft CODES" },
  ],
};

export const services = {
  eyebrow: "Services",
  heading: "What I can build for you.",
  items: [
    {
      title: "Business websites",
      body: "Fast, polished sites that load quickly on any connection and make your business easy to trust.",
    },
    {
      title: "Web apps & platforms",
      body: "Multi-feature platforms that bring bookings, customers and operations into one place.",
    },
    {
      title: "Admin dashboards",
      body: "The owner controls everything — text, images, prices and content — without touching code.",
    },
    {
      title: "Booking & payments",
      body: "Online bookings and checkout with Stripe and Orange Money, built for local and international customers.",
    },
    {
      title: "UI & brand identity",
      body: "Clean interfaces and a consistent visual identity, from logo to the last button.",
    },
  ],
};

export const projectsSection = {
  eyebrow: "Projects",
  heading: "Selected work.",
  intro: "Client sites, platforms and products — from live launches to ideas in progress.",
  allLabel: "All projects",
};

export const projects: Project[] = [
  {
    slug: "tourism-is-life",
    name: "Tourism Is Life",
    tagline: "A client website the owner can fully customise.",
    summary:
      "Client website, fully admin-customisable, with Supabase image storage.",
    status: "Live",
    featured: true,
    kind: "Client website",
    // TODO: confirm problem/solution wording with the client.
    type: "website",
    tags: ["Admin CMS", "Supabase"],
    problem:
      "The client needed a modern online presence they could keep fresh themselves — updating text, galleries and offers without waiting on a developer.",
    solution:
      "A fast website backed by a full admin panel. Every section is editable, and images are uploaded and served from Supabase storage.",
    features: [
      "Fully admin-customisable content",
      "Image uploads with Supabase storage",
      "Responsive, mobile-first layout",
      "Fast page loads and SEO-friendly pages",
    ],
    // TODO: confirm the exact stack used for this project.
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "Vercel"],
    screenshots: [
      // TODO: add screenshots under public/projects/tourism-is-life/ and set src.
      { src: null, alt: "Tourism Is Life home page" },
      { src: null, alt: "Tourism Is Life admin panel" },
    ],
    links: [{ label: "Visit site", href: "https://tourismislife.com" }],
  },
  {
    slug: "mehtez-barrie-platform",
    name: "Mehtez Barrie Platform",
    tagline: "One platform for a multi-service business.",
    summary:
      "Multi-service business platform with booking, payments, an Admin Control Center and roles & permissions.",
    status: "In development",
    featured: true,
    kind: "Business platform",
    // TODO: confirm problem/solution wording with the client.
    type: "platform",
    tags: ["Booking", "Payments", "RBAC"],
    problem:
      "A business offering several services was juggling bookings, payments and staff access across separate tools.",
    solution:
      "A single platform with online booking, payments and an Admin Control Center where the owner manages services, staff roles and permissions.",
    features: [
      "Online booking",
      "Payments",
      "Admin Control Center",
      "Roles & permissions",
    ],
    stack: ["Next.js", "TypeScript", "Neon Postgres", "Tailwind CSS", "Vercel"],
    screenshots: [
      // TODO: add screenshots under public/projects/mehtez-barrie-platform/ and set src.
      { src: null, alt: "Mehtez Barrie Platform booking flow" },
      { src: null, alt: "Mehtez Barrie Admin Control Center" },
    ],
    links: [],
  },
  {
    slug: "bricx-iq",
    name: "BRICX IQ",
    tagline: "Every brick has a brain.",
    summary: "Intelligent construction site management.",
    status: "Coming soon",
    featured: true,
    kind: "Product",
    // TODO: expand the BRICX IQ case study once the product is announced.
    type: "app",
    tags: ["Construction", "SaaS"],
    problem:
      "Construction sites run on paper, phone calls and guesswork — making progress, materials and teams hard to track.",
    solution:
      "An intelligent site management platform that gives every part of a project a clear, live record.",
    features: [
      "Site and project tracking",
      "Materials and inventory overview",
      "Team and task coordination",
      "Progress reporting",
    ],
    // TODO: confirm the BRICX IQ stack.
    stack: ["Next.js", "TypeScript", "PostgreSQL"],
    screenshots: [
      // TODO: add BRICX IQ previews when ready.
      { src: null, alt: "BRICX IQ dashboard preview" },
    ],
    links: [],
  },
  {
    slug: "keen-learner",
    name: "Keen Learner",
    tagline: "Africa-first learning for every stage.",
    summary:
      "Education app for junior high, senior high and university students. Africa-first.",
    status: "Concept",
    featured: false,
    kind: "Education app",
    // TODO: refine the Keen Learner concept write-up.
    type: "app",
    tags: ["Education", "Africa-first"],
    problem:
      "Students across Africa need learning tools built around their own curricula, devices and connectivity.",
    solution:
      "An Africa-first education app that supports students from junior high through university.",
    features: [
      "Content for junior high, senior high and university",
      "Designed for local curricula",
      "Mobile-first and data-light",
    ],
    // TODO: confirm the Keen Learner stack.
    stack: ["React", "TypeScript", "Supabase"],
    screenshots: [
      // TODO: add Keen Learner concept screens.
      { src: null, alt: "Keen Learner concept screen" },
    ],
    links: [],
  },
  {
    slug: "pediatric-neurologist-website",
    name: "Pediatric Neurologist Website",
    tagline: "A calm, clear site for a medical practice.",
    summary: "Medical practice website.",
    status: "In development",
    featured: false,
    kind: "Client website",
    // TODO: confirm problem/solution wording with the client.
    type: "website",
    tags: ["Healthcare"],
    problem:
      "Parents need clear, trustworthy information about the practice and an easy way to get in touch.",
    solution:
      "A calm, accessible website that explains services, introduces the doctor and makes contacting the practice simple.",
    features: [
      "Clear service information",
      "Accessible, readable design",
      "Simple contact and appointment requests",
    ],
    // TODO: confirm the stack used for this project.
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    screenshots: [
      // TODO: add screenshots under public/projects/pediatric-neurologist-website/ and set src.
      { src: null, alt: "Pediatric neurologist website home page" },
    ],
    links: [],
  },
];

export const stack = {
  eyebrow: "Stack",
  heading: "Tools I build with.",
  items: [
    "Next.js",
    "React",
    "TypeScript",
    "Tailwind CSS",
    "Node.js",
    "PostgreSQL (Neon)",
    "Supabase",
    "Git / GitHub",
    "Vercel",
    "Docker",
    "AWS",
  ],
};

export const contactSection = {
  eyebrow: "Contact",
  heading: "Let's build something effortless.",
  body: "Tell me about your business and what you need. I usually reply within a day.",
  emailLabel: "Email",
  whatsappLabel: "WhatsApp",
  form: {
    nameLabel: "Your name",
    emailLabel: "Your email",
    phoneLabel: "Phone or WhatsApp (optional)",
    companyLabel: "Company (optional)",
    projectTypeLabel: "Project type",
    otherProjectLabel: "Something else",
    budgetLabel: "Budget",
    deadlineLabel: "Deadline (optional)",
    deadlinePlaceholder: "e.g. End of March",
    messageLabel: "Project details",
    sourceLabel: "How did you find us?",
    submitLabel: "Send request",
    note: "I reply within one working day. Your details are only used to answer your request.",
    successTitle: "Thanks — your request is in.",
    successBody: "Keep this reference number. I'll reply by email within one working day.",
    // Owner notification email subject prefix (T7b, Resend).
    subjectPrefix: "Project enquiry from",
  },
};

export const softCodes = {
  eyebrow: "The company",
  heading: "Soft CODES",
  lead: "Named after the soft life of a koala: software that feels effortless for the people who use it.",
  // TODO: extend the company story in Mohamed's own words.
  paragraphs: [
    "A koala spends most of its day at rest — not because it is lazy, but because everything around it is arranged to need very little effort. That is the standard Soft CODES holds itself to.",
    "Every website and platform we build is designed so owners can run it themselves and customers can use it without thinking. The hard work happens in the code, so nobody else has to feel it.",
    "Soft CODES is based in Freetown, Sierra Leone, and works with businesses at home and abroad.",
  ],
  principles: [
    { title: "Effortless to use", body: "Clear interfaces that need no manual." },
    { title: "Owner in control", body: "Admin tools that let you change everything yourself." },
    { title: "Fast everywhere", body: "Built to load quickly on any device and connection." },
  ],
  cta: { label: "Start a project", href: "/contact" },
};

export const processSection = {
  // M-14: placeholder until the owner approves the copy (DEC-21); hidden on the site until then.
  visible: false,
  eyebrow: "Process",
  heading: "How we work together.",
  intro: "A clear path from first call to launch — and support after.",
  steps: [
    { title: "Discover", body: "We talk about your business, your customers and what success looks like." },
    { title: "Design", body: "You see the look and the flow before any code is written." },
    { title: "Build", body: "Fast, secure development with regular previews you can click through." },
    { title: "Launch", body: "We go live together, with your admin panel ready to use." },
    { title: "Support", body: "Updates, fixes and improvements whenever you need them." },
  ],
};

/** Pricing copy (A-08). Prices themselves are packages below (DEC-38). */
export const pricing = {
  eyebrow: "Pricing",
  heading: "Clear starting prices.",
  intro: "Every project is different. These \u2018from\u2019 prices are a starting point \u2014 your final quote follows a short call about what you need.",
  currencyLabel: "Show prices in",
  fromLabel: "From",
  requestQuoteLabel: "Request a quote",
  bookCallLabel: "Book a call",
  bookCallNote: "Online booking opens soon \u2014 message us to arrange a call.",
  teaserLinkLabel: "See all prices",
};

export type PricingPackage = {
  slug: string;
  name: string;
  summary: string;
  items: string[];
  priceUsdMinor: number;
  priceSleMinor: number;
  unit: string;
  featured: boolean;
};

/** DEC-38 approved 'from' prices (minor units). Summaries/items: draft copy for owner review (DEC-21). */
export const packages: PricingPackage[] = [
  {
    slug: "landing",
    name: "Landing page",
    summary: "A single, fast page that presents your business and turns visitors into enquiries.",
    items: ["One-page design", "Mobile-first and fast", "WhatsApp and contact buttons", "Basic SEO setup"],
    priceUsdMinor: 150_00,
    priceSleMinor: 3_500_00,
    unit: "",
    featured: false,
  },
  {
    slug: "business-site",
    name: "Business site",
    summary: "A multi-page website that makes an established business easy to trust.",
    items: ["Up to 6 pages", "Services and gallery", "Contact form", "SEO setup"],
    priceUsdMinor: 400_00,
    priceSleMinor: 9_200_00,
    unit: "",
    featured: false,
  },
  {
    slug: "site-admin",
    name: "Site + admin",
    summary: "A business site you update yourself \u2014 text, images and prices, no code needed.",
    items: ["Everything in Business site", "Admin panel", "Image uploads", "Training session"],
    priceUsdMinor: 900_00,
    priceSleMinor: 20_700_00,
    unit: "",
    featured: true,
  },
  {
    slug: "ecommerce-booking",
    name: "E-commerce / booking",
    summary: "Sell products or take bookings online, with an owner dashboard.",
    items: ["Product or service catalogue", "Online booking or cart", "Payments (provider agreed per project)", "Orders and bookings dashboard"],
    priceUsdMinor: 1_200_00,
    priceSleMinor: 27_600_00,
    unit: "",
    featured: false,
  },
  {
    slug: "web-app-platform",
    name: "Web app / platform",
    summary: "Custom platforms with accounts, roles and the workflows your business runs on.",
    items: ["Custom features", "User accounts and roles", "Admin control center", "Integrations"],
    priceUsdMinor: 2_500_00,
    priceSleMinor: 57_500_00,
    unit: "",
    featured: false,
  },
  {
    slug: "ui-brand",
    name: "UI & brand",
    summary: "Logo, colours and interface design for a consistent brand.",
    items: ["Logo and colour palette", "UI design for key screens", "Brand guide"],
    priceUsdMinor: 150_00,
    priceSleMinor: 3_500_00,
    unit: "",
    featured: false,
  },
  {
    slug: "maintenance",
    name: "Maintenance",
    summary: "Updates, backups and small changes every month.",
    items: ["Security updates", "Backups and monitoring", "Small content changes", "Priority support"],
    priceUsdMinor: 25_00,
    priceSleMinor: 575_00,
    unit: "/month",
    featured: false,
  },
];

export const FAQ_CATEGORIES = ["general", "process", "payments", "timelines", "ownership", "support"] as const;
export type FaqCategory = (typeof FAQ_CATEGORIES)[number];
export type Faq = { question: string; answer: string; category: FaqCategory };

/** A-09 FAQ drafts — seeded unpublished; the owner approves the copy before publishing (DEC-21). */
export const faqs: Faq[] = [
  {
    category: "process",
    question: "How does a project start?",
    answer: "With a short call about your business and goals. You then get a written proposal with the scope, timeline and price before any work begins.",
  },
  {
    category: "payments",
    question: "Do I pay everything upfront?",
    answer: "No. A deposit (currently 50%) starts the project, and the balance is due when your site is ready to launch.",
  },
  {
    category: "timelines",
    question: "How long does a website take?",
    answer: "A landing page usually takes 1\u20132 weeks and a business site 2\u20134 weeks. Platforms and web apps are planned in milestones; your proposal includes the timeline.",
  },
  {
    category: "ownership",
    question: "Who owns the website?",
    answer: "You do. Once the final payment is made, the domain, content and design are yours, and you have full admin access.",
  },
  {
    category: "process",
    question: "How many revisions are included?",
    answer: "Each stage includes two rounds of revisions. Bigger changes to the agreed scope are quoted separately before work continues.",
  },
  {
    category: "support",
    question: "Do you handle hosting?",
    answer: "Yes. Sites run on reliable cloud hosting; setup is included, and any running costs are explained in your proposal.",
  },
  {
    category: "support",
    question: "What happens after launch?",
    answer: "You manage your content from the admin panel. A maintenance plan covers updates, backups and small changes each month.",
  },
  {
    category: "payments",
    question: "How can I pay?",
    answer: "Payment methods are confirmed in your proposal. Options for local and international clients, including mobile money, are being set up.",
  },
];

export const footer = {
  tagline: "Software that feels effortless.",
  copyright: `© ${person.name} · Soft CODES`,
  links: [
    { label: "Projects", href: "/projects" },
    { label: "Soft CODES", href: "/soft-codes" },
    { label: "Contact", href: "/contact" },
  ],
};

export const pages = {
  projects: {
    title: "Projects",
    description: "Websites, platforms and products built by Mohamed Abass Jalloh and Soft CODES.",
    heading: "All projects.",
    intro: "Every project, from live client sites to products in the works.",
  },
  contact: {
    title: "Contact",
    description: "Get in touch with Mohamed Abass Jalloh by email or WhatsApp to start your project.",
  },
  softCodes: {
    title: "Soft CODES",
    description:
      "Soft CODES — named after the soft life of a koala: software that feels effortless for the people who use it.",
  },
  caseStudy: {
    back: "All projects",
    problem: "The problem",
    solution: "The solution",
    features: "Key features",
    stack: "Stack",
    screenshots: "Screenshots",
    status: "Status",
    type: "Type",
    links: "Links",
    noLinks: "Links will be shared when the project launches.",
    screenshotPlaceholder: "Screenshot coming soon",
  },
  about: {
    title: "About",
    description: "Mohamed Abass Jalloh \u2014 software engineer in Freetown, Sierra Leone, and founder of Soft CODES.",
    moreLabel: "More about me",
    cvLabel: "Download CV",
  },
  pricing: {
    title: "Pricing",
    description: "\u2018From\u2019 prices for websites, platforms and brand design by Soft CODES \u2014 in US dollars and Leones.",
  },
  faq: {
    title: "FAQ",
    description: "Answers to common questions about working with Soft CODES: process, payments, timelines and ownership.",
    heading: "Questions & answers.",
    intro: "Straight answers about how we work. Can\u2019t find yours? Ask us directly.",
    empty: "Answers are on the way. In the meantime, ask us directly.",
  },
  notFound: {
    title: "Page not found",
    body: "This page wandered off. Let's get you back home.",
    cta: "Back to home",
  },
};

export const featuredProjects = projects.filter((p) => p.featured);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/**
 * Single source of truth for all text content on the site.
 * Edit this file to change copy, projects, services or contact details.
 */

export type ProjectStatus = "Live" | "In development" | "Coming soon" | "Concept";

export type ProjectLink = { label: string; href: string };

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  status: ProjectStatus;
  featured: boolean;
  kind: string;
  problem: string;
  solution: string;
  features: string[];
  stack: string[];
  /** Screenshot slots. `src: null` renders a placeholder. */
  screenshots: { src: string | null; alt: string }[];
  links: ProjectLink[];
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
  // TODO: add a portrait at public/brand/me.jpg and set this to "/brand/me.jpg".
  photo: null as string | null,
  photoAlt: "Portrait of Mohamed Abass Jalloh",
};

export const contact = {
  email: "engineermohamedabassjalloh3855@gmail.com",
  whatsappDisplay: "+232 32 829 316",
  whatsappUrl: "https://wa.me/23232829316",
  whatsappHireUrl:
    "https://wa.me/23232829316?text=" +
    encodeURIComponent("Hi Mohamed, I'd like to talk about a project."),
};

export const nav = {
  links: [
    { label: "About", href: "/#about" },
    { label: "Services", href: "/#services" },
    { label: "Projects", href: "/projects" },
    { label: "Stack", href: "/#stack" },
    { label: "Contact", href: "/contact" },
  ],
  hireLabel: "Hire me",
};

export const hero = {
  eyebrow: "Freetown, Sierra Leone",
  name: person.name,
  title: site.title,
  pitch: "I build fast, fully customisable websites and business platforms.",
  primaryCta: { label: "View Projects", href: "/projects" },
  secondaryCta: { label: "Hire Me", href: contact.whatsappHireUrl },
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
    messageLabel: "Project details",
    submitLabel: "Send email",
    note: "This opens your email app with the message ready to send.",
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

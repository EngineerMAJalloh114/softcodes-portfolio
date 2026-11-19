import { FAQ_CATEGORIES, PROJECT_TYPES } from "@/content/site";

/** Select options shared by the admin forms and validation. Pure module. */
export const PROJECT_STATUSES_LIST = [
  { value: "Live", label: "Live" },
  { value: "In development", label: "In development" },
  { value: "Coming soon", label: "Coming soon" },
  { value: "Concept", label: "Concept" },
] as const;

const TYPE_LABELS: Record<(typeof PROJECT_TYPES)[number], string> = {
  website: "Website",
  platform: "Platform",
  app: "App",
  branding: "Branding",
  other: "Other",
};
export const PROJECT_TYPE_OPTIONS = PROJECT_TYPES.map((value) => ({ value, label: TYPE_LABELS[value] }));

const FAQ_LABELS: Record<(typeof FAQ_CATEGORIES)[number], string> = {
  general: "General",
  process: "Process",
  payments: "Payments",
  timelines: "Timelines",
  ownership: "Ownership",
  support: "Support",
};
export const FAQ_CATEGORY_OPTIONS = FAQ_CATEGORIES.map((value) => ({ value, label: FAQ_LABELS[value] }));
export const faqCategoryLabel = (c: string) => FAQ_LABELS[c as keyof typeof FAQ_LABELS] ?? "General";

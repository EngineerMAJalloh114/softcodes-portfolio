import { PROJECT_TYPES } from "@/content/site";

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

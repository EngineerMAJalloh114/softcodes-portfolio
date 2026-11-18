import { contact, contactSection } from "@/content/site";
import { ChatIcon, MailIcon } from "./Icons";

export function ContactDetails() {
  const items = [
    {
      label: contactSection.emailLabel,
      value: contact.email,
      href: `mailto:${contact.email}`,
      icon: <MailIcon />,
      external: false,
    },
    {
      label: contactSection.whatsappLabel,
      value: contact.whatsappDisplay,
      href: contact.whatsappUrl,
      icon: <ChatIcon />,
      external: true,
    },
  ];
  return (
    <ul className="grid gap-4">
      {items.map((i) => (
        <li key={i.label}>
          <a
            href={i.href}
            {...(i.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="glow flex items-center gap-5 rounded-2xl border border-slate bg-night p-6"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate text-dusk">
              {i.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                {i.label}
              </span>
              <span className="mt-1 block text-sm font-semibold break-all text-mist sm:text-base lg:text-sm">{i.value}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

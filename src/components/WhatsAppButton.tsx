import { ChatIcon } from "./Icons";

/**
 * Floating WhatsApp button (M-06) on every public page. The link comes from the Settings
 * number (DEC-37); the owner can switch it off in Settings. Admin pages use their own layout,
 * so it never shows there. On small screens the footer gets extra bottom padding (SiteChrome)
 * so the end of the page is never hidden behind it.
 */
export function WhatsAppButton({ href, raised }: { href: string; raised: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      data-whatsapp-button
      className={`fixed right-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-btn-bg text-btn-fg shadow-[0_8px_30px_-6px_rgba(0,0,0,0.45)] transition duration-300 hover:scale-105 hover:shadow-[0_0_40px_-8px_var(--glow-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text sm:right-6 ${
        raised ? "bottom-20" : "bottom-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-6"
      }`}
    >
      <ChatIcon className="h-6 w-6" />
    </a>
  );
}

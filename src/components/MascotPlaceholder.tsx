import Image from "next/image";

type MascotPlaceholderProps = {
  /** What will eventually appear here (also the accessible name). */
  label: string;
  /** Short status line, e.g. "Screenshot coming soon". */
  note: string;
  /** Hint for next/image `sizes`. */
  sizes?: string;
  className?: string;
};

/**
 * Empty / "coming soon" state using the Soft CODES koala mascot (DEC-28, DEC-31).
 * Always dark (data-theme="dark") so the label stays readable over the photo in both themes.
 */
export function MascotPlaceholder({
  label,
  note,
  sizes = "(min-width: 768px) 50vw, 100vw",
  className = "",
}: MascotPlaceholderProps) {
  return (
    <div
      data-theme="dark"
      role="img"
      aria-label={`${label} (placeholder: ${note.toLowerCase()})`}
      className={`relative isolate h-full w-full overflow-hidden bg-bg ${className}`}
    >
      <Image
        src="/brand/mascot-koala.jpg"
        alt=""
        fill
        sizes={sizes}
        className="-z-10 object-cover object-[50%_35%] opacity-80"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/50 to-transparent"
      />
      <div className="flex h-full flex-col justify-end gap-1.5 p-5 sm:p-6">
        <span className="text-sm font-semibold text-text">{label}</span>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{note}</span>
      </div>
    </div>
  );
}

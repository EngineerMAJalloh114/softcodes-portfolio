import Image from "next/image";

type ThemeImageProps = {
  /** Brand asset base name, e.g. "softcodes-logo" → -white.svg (dark) / -black.svg (light). */
  name: "softcodes-logo" | "softcodes-icon";
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  /** Classes for the wrapper: include a display class (block / hidden lg:block) and size. */
  className?: string;
};

/**
 * Renders the white asset in dark theme and the black asset in light theme.
 * Both are in the HTML; CSS (.theme-*-only) hides the inactive one, so there is
 * no flash or hydration mismatch.
 */
export function ThemeImage({ name, alt, width, height, priority, className = "" }: ThemeImageProps) {
  return (
    <span className={className}>
      <Image
        src={`/brand/${name}-white.svg`}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        unoptimized
        className="theme-dark-only h-auto w-full"
      />
      <Image
        src={`/brand/${name}-black.svg`}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        unoptimized
        className="theme-light-only h-auto w-full"
      />
    </span>
  );
}

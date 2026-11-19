"use client";

import Image from "next/image";

/** Koala empty state usable inside client components (DEC-31). */
export function EmptyStateClient({ title, body }: { title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <div className="relative h-32 w-52 overflow-hidden rounded-2xl border border-border">
        <Image src="/brand/mascot-koala.jpg" alt="" fill sizes="208px" className="object-cover object-[50%_35%]" />
      </div>
      <div>
        <p className="font-extrabold text-text">{title}</p>
        {body && <p className="mt-1 text-sm text-muted">{body}</p>}
      </div>
    </div>
  );
}

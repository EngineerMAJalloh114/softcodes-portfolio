/* eslint-disable @next/next/no-img-element -- media-library images of unknown size in article bodies */
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { sanitizeDoc, safeHref, type BlockNode, type InlineNode, type Mark, type RichDoc } from "@/lib/blog/richtext";

/**
 * Server-side renderer for blog rich text (DEC-42). The document is sanitised again here
 * (allowlist), then mapped to React elements — no raw HTML is ever injected, so script tags,
 * event-handler attributes and javascript: links cannot reach the page.
 */
export function RichText({ doc }: { doc: RichDoc | unknown }) {
  const clean = sanitizeDoc(doc);
  return <div className="prose-post">{clean.content.map((n, i) => block(n, i))}</div>;
}

function inline(nodes: InlineNode[] | undefined): ReactNode {
  return (nodes ?? []).map((n, i) => (n.type === "hardBreak" ? <br key={i} /> : <Fragment key={i}>{marked(n.text, n.marks)}</Fragment>));
}

function marked(text: string, marks: Mark[] | undefined): ReactNode {
  let out: ReactNode = text;
  for (const m of marks ?? []) {
    if (m.type === "bold") out = <strong>{out}</strong>;
    else if (m.type === "italic") out = <em>{out}</em>;
    else if (m.type === "underline") out = <u>{out}</u>;
    else if (m.type === "strike") out = <s>{out}</s>;
    else if (m.type === "code") out = <code>{out}</code>;
    else if (m.type === "link") {
      const href = safeHref(m.attrs.href);
      if (!href) continue;
      out = href.startsWith("/") || href.startsWith("#") ? (
        <Link href={href}>{out}</Link>
      ) : (
        <a href={href} target={href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer nofollow">
          {out}
        </a>
      );
    }
  }
  return out;
}

function block(n: BlockNode, key: number): ReactNode {
  switch (n.type) {
    case "paragraph":
      return <p key={key}>{inline(n.content)}</p>;
    case "heading": {
      const H = `h${n.attrs.level}` as "h2" | "h3" | "h4";
      return <H key={key}>{inline(n.content)}</H>;
    }
    case "blockquote":
      return <blockquote key={key}>{n.content.map((c, i) => block(c, i))}</blockquote>;
    case "bulletList":
      return (
        <ul key={key}>
          {n.content.map((li, i) => (
            <li key={i}>{li.content.map((c, j) => block(c, j))}</li>
          ))}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={key} start={n.attrs.start}>
          {n.content.map((li, i) => (
            <li key={i}>{li.content.map((c, j) => block(c, j))}</li>
          ))}
        </ol>
      );
    case "codeBlock":
      return (
        <pre key={key} data-language={n.attrs.language ?? undefined}>
          <code>{n.content?.[0]?.text ?? ""}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr key={key} />;
    case "image":
      return n.attrs.src ? (
        <figure key={key}>
          <img src={n.attrs.src} alt={n.attrs.alt} loading="lazy" decoding="async" />
        </figure>
      ) : null;
  }
}

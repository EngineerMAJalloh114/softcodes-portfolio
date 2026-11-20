"use client";

/* eslint-disable @next/next/no-img-element -- media library thumbnails */
import Image from "@tiptap/extension-image";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState } from "react";
import { listPickerImagesAction } from "@/app/admin/media/actions";
import { safeHref } from "@/lib/blog/richtext";

/**
 * Rich text editor for blog posts (DEC-42): headings, bold/italic, lists, links, images from
 * the media library, code blocks and quotes. Emits Tiptap JSON; the server sanitises it on save.
 */

// Images keep their media-library reference (media:<id>) next to the display URL.
const MediaImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ref: { default: null, parseHTML: (el) => el.getAttribute("data-ref"), renderHTML: (a) => (a.ref ? { "data-ref": a.ref } : {}) },
    };
  },
});

type PickerImage = { ref: string; url: string; alt: string; filename: string };

const btn =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-xs font-semibold transition-colors disabled:opacity-40";

export function RichTextEditor({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string;
  value: unknown;
  onChange: (doc: unknown) => void;
  invalid?: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [images, setImages] = useState<PickerImage[] | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState("");
  // Tiptap keeps the onUpdate it was created with; always call the latest onChange.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", isAllowedUri: (url) => !!safeHref(url) },
      }),
      MediaImage.configure({ inline: false, allowBase64: false }),
    ],
    content: (value as object) ?? { type: "doc", content: [{ type: "paragraph" }] },
    editorProps: {
      attributes: {
        id,
        "aria-label": "Article",
        "aria-multiline": "true",
        role: "textbox",
        "data-richtext-editor": "",
        class: "prose-post min-h-[320px] px-5 py-4 focus:outline-none",
      },
    },
    // Tiptap's attrs objects aren't plain objects; React's server-action encoder would send
    // them as opaque references ("$T") and the server would see no href/ref/level. A JSON
    // round-trip turns the document into plain data.
    onUpdate: ({ editor: e }) => onChangeRef.current(JSON.parse(JSON.stringify(e.getJSON()))),
  });

  const NONE = { h2: false, h3: false, bold: false, italic: false, bullet: false, ordered: false, quote: false, code: false, link: false, canUndo: false, canRedo: false };
  const state =
    useEditorState({
      editor,
      selector: ({ editor: e }) =>
        e
          ? {
              h2: e.isActive("heading", { level: 2 }),
              h3: e.isActive("heading", { level: 3 }),
              bold: e.isActive("bold"),
              italic: e.isActive("italic"),
              bullet: e.isActive("bulletList"),
              ordered: e.isActive("orderedList"),
              quote: e.isActive("blockquote"),
              code: e.isActive("codeBlock"),
              link: e.isActive("link"),
              canUndo: e.can().undo(),
              canRedo: e.can().redo(),
            }
          : NONE,
    }) ?? NONE;

  if (!editor) {
    return <div className="mt-2 min-h-[380px] rounded-2xl border border-field bg-bg" aria-busy="true" />;
  }

  const tool = (label: string, active: boolean, run: () => void, opts: { title?: string; disabled?: boolean; testId?: string } = {}) => (
    <button
      type="button"
      title={opts.title ?? label}
      aria-label={opts.title ?? label}
      aria-pressed={active}
      disabled={opts.disabled}
      data-tool={opts.testId}
      onMouseDown={(e) => e.preventDefault()} // keep the selection in the editor
      onClick={run}
      className={`${btn} ${active ? "border-text bg-btn-bg text-btn-fg" : "border-border text-text hover:border-[var(--border-hover)]"}`}
    >
      {label}
    </button>
  );

  async function openPicker() {
    setPickerOpen(true);
    if (!images) setImages(await listPickerImagesAction());
  }

  function applyLink() {
    const v = linkValue.trim();
    if (!v) {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkOpen(false);
      return;
    }
    // Bare domains get https://; any other scheme (javascript:, data:, …) is refused.
    const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(v);
    const href = hasScheme || /^[/#]/.test(v) ? safeHref(v) : safeHref(`https://${v}`);
    if (!href) {
      setLinkError("Use an https:// link, a /page on this site, #section or mailto:.");
      return;
    }
    editor!.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setLinkOpen(false);
  }

  return (
    <div className={`mt-2 rounded-2xl border bg-bg ${invalid ? "border-text" : "border-field"}`}>
      <div role="toolbar" aria-label="Formatting" className="sticky top-16 z-10 flex flex-wrap gap-1.5 rounded-t-2xl border-b border-border bg-bg p-2">
        {tool("H2", state.h2, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), { title: "Heading", testId: "h2" })}
        {tool("H3", state.h3, () => editor.chain().focus().toggleHeading({ level: 3 }).run(), { title: "Subheading", testId: "h3" })}
        {tool("B", state.bold, () => editor.chain().focus().toggleBold().run(), { title: "Bold", testId: "bold" })}
        {tool("I", state.italic, () => editor.chain().focus().toggleItalic().run(), { title: "Italic", testId: "italic" })}
        {tool("• List", state.bullet, () => editor.chain().focus().toggleBulletList().run(), { title: "Bulleted list", testId: "bullet" })}
        {tool("1. List", state.ordered, () => editor.chain().focus().toggleOrderedList().run(), { title: "Numbered list", testId: "ordered" })}
        {tool("“ Quote", state.quote, () => editor.chain().focus().toggleBlockquote().run(), { title: "Quote", testId: "quote" })}
        {tool("</> Code", state.code, () => (state.code ? editor.chain().focus().setParagraph().run() : editor.chain().focus().toggleCodeBlock().run()), { title: "Code block", testId: "code" })}
        {tool("Link", state.link, () => {
          setLinkValue((editor.getAttributes("link").href as string | undefined) ?? "");
          setLinkError("");
          setLinkOpen((o) => !o);
        }, { title: "Link", testId: "link" })}
        {tool("Image", false, openPicker, { title: "Image from the media library", testId: "image" })}
        <span className="mx-1 w-px self-stretch bg-border" aria-hidden="true" />
        {tool("↶", false, () => editor.chain().focus().undo().run(), { title: "Undo", disabled: !state.canUndo })}
        {tool("↷", false, () => editor.chain().focus().redo().run(), { title: "Redo", disabled: !state.canRedo })}
      </div>

      {linkOpen && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <input
            aria-label="Link address"
            data-link-input
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
            }}
            placeholder="https://… or /contact"
            className="h-9 min-w-0 flex-1 rounded-lg border border-field bg-bg px-3 text-sm text-text"
          />
          <button type="button" className={`${btn} border-border text-text`} onClick={applyLink} data-link-apply>
            {linkValue.trim() ? "Apply" : "Remove link"}
          </button>
          {linkError && (
            <span role="alert" className="w-full text-sm font-semibold text-text">
              ⚠ {linkError}
            </span>
          )}
        </div>
      )}

      {pickerOpen && (
        <div className="border-b border-border p-4" role="dialog" aria-label="Insert an image">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-text">Public images in the media library</p>
            <button type="button" className={`${btn} border-border text-text`} onClick={() => setPickerOpen(false)}>
              Close
            </button>
          </div>
          {!images ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : images.length === 0 ? (
            <p className="text-sm text-muted">No public images yet. Upload one in Media first.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((img) => (
                <li key={img.ref}>
                  <button
                    type="button"
                    data-insert-ref={img.ref}
                    onClick={() => {
                      // Image + an empty paragraph after it, cursor in that paragraph: keep writing below.
                      editor
                        .chain()
                        .focus()
                        .insertContent([{ type: "image", attrs: { src: img.url, alt: img.alt, ref: img.ref } }, { type: "paragraph" }])
                        .run();
                      setPickerOpen(false);
                    }}
                    className="block w-full overflow-hidden rounded-xl border border-border text-left hover:border-[var(--border-hover)]"
                  >
                    <img src={img.url} alt={img.alt} className="aspect-[4/3] w-full object-cover" />
                    <span className="block truncate px-2 py-1 text-xs text-muted">{img.filename}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">The image&apos;s alt text comes from the media library; edit it there.</p>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

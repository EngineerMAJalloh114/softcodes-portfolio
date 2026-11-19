"use client";

/* eslint-disable @next/next/no-img-element -- admin previews of library/remote images */
import { useState } from "react";
import { inputClass } from "@/components/auth/fields";
import { listPickerImagesAction } from "@/app/admin/media/actions";
import { emptyObject, emptyValue, formatMajor, parseMoney, type Field } from "@/lib/content/fields";
import { CTA_KINDS } from "@/lib/content/whatsapp";

type Errors = Record<string, string>;
type Obj = Record<string, unknown>;

const labelCls = "block text-sm font-semibold text-text";
const helpCls = "mt-1.5 block text-xs font-normal text-muted";
const smallBtn =
  "inline-flex h-9 items-center rounded-full border border-border px-3 text-xs font-semibold text-text hover:border-[var(--border-hover)] disabled:opacity-40";

function ErrorText({ error }: { error?: string }) {
  return error ? (
    <span role="alert" className="mt-1.5 block text-sm font-semibold text-text">
      ⚠ {error}
    </span>
  ) : null;
}

/** Renders the form for an object described by field specs. */
export function FieldsEditor({
  fields,
  value,
  onChange,
  errors,
  path = "",
  previews,
}: {
  fields: Field[];
  value: Obj;
  onChange: (next: Obj) => void;
  errors: Errors;
  path?: string;
  previews: Record<string, string>;
}) {
  return (
    <div className="space-y-5">
      {fields.map((f) => (
        <FieldEditor
          key={f.name}
          field={f}
          value={value[f.name]}
          onChange={(v) => onChange({ ...value, [f.name]: v })}
          errors={errors}
          path={path ? `${path}.${f.name}` : f.name}
          previews={previews}
        />
      ))}
    </div>
  );
}

function FieldEditor({
  field,
  value,
  onChange,
  errors,
  path,
  previews,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
  errors: Errors;
  path: string;
  previews: Record<string, string>;
}) {
  const id = `f-${path.replace(/\./g, "-")}`;
  const error = errors[path];
  const help = "help" in field && field.help ? <span className={helpCls}>{field.help}</span> : null;

  switch (field.type) {
    case "text":
    case "href":
    case "slug":
      return (
        <label className={labelCls} htmlFor={id}>
          {field.label}
          <input
            id={id}
            name={path}
            className={inputClass}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={!!error}
            maxLength={"max" in field ? field.max : undefined}
          />
          {help}
          <ErrorText error={error} />
        </label>
      );
    case "textarea":
      return (
        <label className={labelCls} htmlFor={id}>
          {field.label}
          <textarea
            id={id}
            name={path}
            rows={Math.min(8, Math.max(3, Math.ceil(String(value ?? "").length / 90)))}
            className={`${inputClass} resize-y`}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={!!error}
            maxLength={field.max}
          />
          {help}
          <ErrorText error={error} />
        </label>
      );
    case "boolean":
      return (
        <label className="flex items-center gap-3 text-sm font-semibold text-text" htmlFor={id}>
          <input id={id} name={path} type="checkbox" className="h-4 w-4" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          {field.label}
          {help}
        </label>
      );
    case "select":
      return (
        <label className={labelCls} htmlFor={id}>
          {field.label}
          <select id={id} name={path} className={inputClass} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {help}
          <ErrorText error={error} />
        </label>
      );
    case "image":
      return <ImageField id={id} field={field} value={(value as string | null) ?? null} onChange={onChange} error={error} previews={previews} path={path} />;
    case "stringList": {
      const list = Array.isArray(value) ? (value as string[]) : [];
      return (
        <fieldset className="rounded-2xl border border-border p-4">
          <legend className="px-2 text-sm font-semibold text-text">{field.label}</legend>
          {help}
          <ul className="mt-2 space-y-2">
            {list.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                {field.multiline ? (
                  <textarea
                    aria-label={`${field.itemLabel} ${i + 1}`}
                    name={`${path}.${i}`}
                    rows={4}
                    className={`${inputClass} mt-0 resize-y`}
                    value={item}
                    maxLength={field.itemMax}
                    onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))}
                  />
                ) : (
                  <input
                    aria-label={`${field.itemLabel} ${i + 1}`}
                    name={`${path}.${i}`}
                    className={`${inputClass} mt-0`}
                    value={item}
                    maxLength={field.itemMax}
                    onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))}
                  />
                )}
                <ListControls i={i} length={list.length} onMove={(to) => onChange(move(list, i, to))} onRemove={() => onChange(list.filter((_, j) => j !== i))} label={field.itemLabel} />
              </li>
            ))}
          </ul>
          <ErrorText error={error} />
          <button type="button" className={`${smallBtn} mt-3`} onClick={() => onChange([...list, ""])}>
            + Add {field.itemLabel.toLowerCase()}
          </button>
        </fieldset>
      );
    }
    case "list": {
      const list = Array.isArray(value) ? (value as Obj[]) : [];
      return (
        <fieldset className="rounded-2xl border border-border p-4">
          <legend className="px-2 text-sm font-semibold text-text">{field.label}</legend>
          {help}
          <ol className="mt-2 space-y-4">
            {list.map((item, i) => (
              <li key={i} className="rounded-xl border border-border/70 bg-bg/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">
                    {field.itemLabel} {i + 1}
                  </span>
                  <ListControls i={i} length={list.length} onMove={(to) => onChange(move(list, i, to))} onRemove={() => onChange(list.filter((_, j) => j !== i))} label={field.itemLabel} />
                </div>
                <FieldsEditor
                  fields={field.fields}
                  value={item}
                  onChange={(next) => onChange(list.map((x, j) => (j === i ? next : x)))}
                  errors={errors}
                  path={`${path}.${i}`}
                  previews={previews}
                />
              </li>
            ))}
          </ol>
          <ErrorText error={error} />
          <button type="button" className={`${smallBtn} mt-3`} onClick={() => onChange([...list, emptyObject(field.fields)])}>
            + Add {field.itemLabel.toLowerCase()}
          </button>
        </fieldset>
      );
    }
    case "cta": {
      const v = (value as { label?: string; kind?: string; href?: string }) ?? {};
      const set = (patch: object) => onChange({ label: v.label ?? "", kind: v.kind ?? "url", href: v.href ?? "", ...patch });
      return (
        <fieldset className="rounded-2xl border border-border p-4">
          <legend className="px-2 text-sm font-semibold text-text">{field.label}</legend>
          {help}
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <label className={labelCls} htmlFor={`${id}-label`}>
              Button text
              <input id={`${id}-label`} name={`${path}.label`} className={inputClass} value={v.label ?? ""} maxLength={60} onChange={(e) => set({ label: e.target.value })} aria-invalid={!!errors[`${path}.label`]} />
              <ErrorText error={errors[`${path}.label`]} />
            </label>
            <label className={labelCls} htmlFor={`${id}-kind`}>
              Link type
              <select id={`${id}-kind`} name={`${path}.kind`} className={inputClass} value={v.kind ?? "url"} onChange={(e) => set({ kind: e.target.value })}>
                {CTA_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
            {v.kind === "whatsapp" ? (
              <p className="text-sm text-muted sm:col-span-2">Opens WhatsApp with the number from Settings — change it there (DEC-37).</p>
            ) : (
              <label className={`${labelCls} sm:col-span-2`} htmlFor={`${id}-href`}>
                {v.kind === "anchor" ? "Section (e.g. #services or /#services)" : "Link (/path or https://…)"}
                <input id={`${id}-href`} name={`${path}.href`} className={inputClass} value={v.href ?? ""} onChange={(e) => set({ href: e.target.value })} aria-invalid={!!errors[`${path}.href`]} />
                <ErrorText error={errors[`${path}.href`]} />
              </label>
            )}
          </div>
          <ErrorText error={error} />
        </fieldset>
      );
    }
    case "money":
      return <MoneyField id={id} label={field.label} currency={field.currency} value={Number(value ?? 0)} onChange={onChange} error={error} path={path} />;
    case "group":
      return (
        <fieldset className="rounded-2xl border border-border p-4">
          <legend className="px-2 text-sm font-semibold text-text">{field.label}</legend>
          {help}
          <div className="mt-2">
            <FieldsEditor
              fields={field.fields}
              value={(value as Obj) ?? (emptyValue(field) as Obj)}
              onChange={onChange}
              errors={errors}
              path={path}
              previews={previews}
            />
          </div>
        </fieldset>
      );
  }
}

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function ListControls({ i, length, onMove, onRemove, label }: { i: number; length: number; onMove: (to: number) => void; onRemove: () => void; label: string }) {
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" className={smallBtn} disabled={i === 0} onClick={() => onMove(i - 1)} aria-label={`Move ${label} ${i + 1} up`}>
        ↑
      </button>
      <button type="button" className={smallBtn} disabled={i === length - 1} onClick={() => onMove(i + 1)} aria-label={`Move ${label} ${i + 1} down`}>
        ↓
      </button>
      <button type="button" className={smallBtn} onClick={onRemove} aria-label={`Remove ${label} ${i + 1}`}>
        Remove
      </button>
    </div>
  );
}

/** Amount typed in major units ("3,500"); stored as integer minor units. */
function MoneyField({ id, label, currency, value, onChange, error, path }: { id: string; label: string; currency: "USD" | "SLE"; value: number; onChange: (v: unknown) => void; error?: string; path: string }) {
  const [text, setText] = useState(() => formatMajor(value));
  const [bad, setBad] = useState(false);
  return (
    <label className={labelCls} htmlFor={id}>
      {label}
      <span className="mt-2 flex items-center gap-2">
        <span className="text-sm font-semibold text-muted">{currency === "USD" ? "$" : "Le"}</span>
        <input
          id={id}
          name={path}
          inputMode="decimal"
          className={`${inputClass} mt-0`}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const minor = parseMoney(e.target.value);
            setBad(minor === null);
            if (minor !== null) onChange(minor);
          }}
          aria-invalid={bad || !!error}
        />
      </span>
      {bad && <ErrorText error={`${label}: enter an amount like 3,500 or 25.50.`} />}
      <ErrorText error={error} />
    </label>
  );
}

type PickerImage = { ref: string; url: string; alt: string; filename: string };

/** Image reference: pick from the media library (stores media:<id>) or type a /path or URL. */
function ImageField({
  id,
  field,
  value,
  onChange,
  error,
  previews,
  path,
}: {
  id: string;
  field: Field;
  value: string | null;
  onChange: (v: unknown) => void;
  error?: string;
  previews: Record<string, string>;
  path: string;
}) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<PickerImage[] | null>(null);
  const [picked, setPicked] = useState<Record<string, string>>({});

  async function openPicker() {
    setOpen(true);
    if (!images) setImages(await listPickerImagesAction());
  }

  const previewUrl = value ? (picked[value] ?? previews[value] ?? (value.startsWith("media:") ? null : value)) : null;

  return (
    <div>
      <label className={labelCls} htmlFor={id}>
        {field.label}
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-bg">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-muted">
              {value ? "media" : "none"}
            </span>
          )}
        </div>
        <input
          id={id}
          name={path}
          className={`${inputClass} mt-0 min-w-0 flex-1`}
          value={value ?? ""}
          placeholder="media:… or /path/to/image.jpg"
          onChange={(e) => onChange(e.target.value || null)}
          aria-invalid={!!error}
        />
        <button type="button" className={smallBtn} onClick={openPicker}>
          Choose from library
        </button>
        {value && (
          <button type="button" className={smallBtn} onClick={() => onChange(null)}>
            Clear
          </button>
        )}
      </div>
      {"help" in field && field.help ? <span className={helpCls}>{field.help}</span> : null}
      <ErrorText error={error} />
      {open && (
        <div className="mt-3 rounded-2xl border border-border bg-bg p-4" role="dialog" aria-label="Choose an image">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-text">Public images in the media library</p>
            <button type="button" className={smallBtn} onClick={() => setOpen(false)}>
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
                    data-ref={img.ref}
                    onClick={() => {
                      setPicked((p) => ({ ...p, [img.ref]: img.url }));
                      onChange(img.ref);
                      setOpen(false);
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
        </div>
      )}
    </div>
  );
}

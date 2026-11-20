"use client";

import { useActionState } from "react";
import { unsubscribeAction, type UnsubscribeState } from "../actions";

export function UnsubscribeForm({ token, body, button, done, invalid }: { token: string; body: string; button: string; done: string; invalid: string }) {
  const [state, action, pending] = useActionState<UnsubscribeState, FormData>(unsubscribeAction, { status: "idle" });
  if (state.status === "done")
    return (
      <p role="status" data-unsubscribed className="mt-6 text-lg text-muted">
        {done}
      </p>
    );
  if (state.status === "invalid") return <p className="mt-6 text-lg text-muted">{invalid}</p>;
  return (
    <form action={action} className="mt-6">
      <p className="text-lg text-muted">{body}</p>
      <input type="hidden" name="token" value={token} />
      <button
        type="submit"
        disabled={pending}
        className="mt-8 inline-flex items-center justify-center rounded-full bg-btn-bg px-6 py-3 text-sm font-semibold text-btn-fg hover:bg-btn-bg/85 disabled:opacity-70"
      >
        {button}
      </button>
    </form>
  );
}

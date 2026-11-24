"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Select, Textarea } from "@/components/ui/input";
import type { ActionState } from "@/lib/utils";

const TYPES = [
  { value: "NOTE", label: "Note" },
  { value: "CALL", label: "Call" },
  { value: "MEETING", label: "Meeting" },
  { value: "EMAIL", label: "Email" },
];

type LinkOption = { value: string; label: string };

/** Quick "log an activity" form. Link selectors appear only when not bound to a record. */
export function ActivityComposer({
  action,
  singular,
  linkOptions,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  singular: string;
  linkOptions?: { contacts: LinkOption[]; deals: LinkOption[]; contactLabel: string; dealLabel: string };
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={formAction} className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex gap-2">
        <Select name="type" className="w-32" defaultValue="NOTE">
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <Input name="subject" placeholder={`${singular} subject`} required />
        <Input name="occurredAt" type="date" className="w-40" />
      </div>
      <FieldError message={state.fieldErrors?.subject} />
      {linkOptions && (
        <div className="flex gap-2">
          <Select name="contactId" defaultValue="">
            <option value="">{linkOptions.contactLabel}: none</option>
            {linkOptions.contacts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select name="dealId" defaultValue="">
            <option value="">{linkOptions.dealLabel}: none</option>
            {linkOptions.deals.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      )}
      <Textarea name="body" placeholder="Details (optional)" className="min-h-16 bg-background" />
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : `Log ${singular.toLowerCase()}`}
      </Button>
    </form>
  );
}

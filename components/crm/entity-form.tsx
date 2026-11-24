"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Label } from "@/components/ui/input";
import type { FormField } from "@/lib/crm/form-fields";
import { cn, type ActionState } from "@/lib/utils";
import { DynamicInput } from "./dynamic-input";

type Props = {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  fields: FormField[];
  submitLabel: string;
  cancelHref?: string;
  /** Index where custom fields start, used to draw a divider. */
  customFrom?: number;
};

/** Generic create/edit form: the field list (labels, types, options) comes from the tenant's config. */
export function EntityForm({ action, fields, submitLabel, cancelHref, customFrom }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};

  const renderField = (f: FormField) => (
    <div key={f.name} className={cn("space-y-1.5", f.wide && "sm:col-span-2")}>
      <Label htmlFor={f.name}>
        {f.label}
        {f.required && <span className="text-destructive"> *</span>}
      </Label>
      <DynamicInput field={f} />
      <FieldError message={errors[f.name]} />
    </div>
  );

  const system = customFrom === undefined ? fields : fields.slice(0, customFrom);
  const custom = customFrom === undefined ? [] : fields.slice(customFrom);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">{system.map(renderField)}</div>
      {custom.length > 0 && (
        <>
          <div className="border-t pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Additional details</div>
          <div className="grid gap-4 sm:grid-cols-2">{custom.map(renderField)}</div>
        </>
      )}
      {state.error && <p className="rounded-md bg-red-50 p-3 text-sm text-destructive">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        {cancelHref && (
          <Button asChild variant="outline">
            <Link href={cancelHref}>Cancel</Link>
          </Button>
        )}
      </div>
    </form>
  );
}

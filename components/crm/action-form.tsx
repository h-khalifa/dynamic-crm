"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn, type ActionState } from "@/lib/utils";

/** Form bound to a server action that shows success / error feedback inline. */
export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  className,
  resetOnSuccess = false,
  inline = false,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
  resetOnSuccess?: boolean;
  inline?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  const errors = Object.values(state.fieldErrors ?? {});

  return (
    <form ref={ref} action={formAction} className={cn(inline ? "flex flex-wrap items-end gap-2" : "space-y-4", className)}>
      {children}
      <div className={cn("flex flex-wrap items-center gap-3", inline && "pb-0")}>
        <Button type="submit" disabled={pending} size={inline ? "default" : "default"}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        {state.ok && state.message && <span className="break-all text-sm text-green-700">{state.message}</span>}
        {(state.error || errors.length > 0) && <span className="text-sm text-destructive">{state.error ?? errors.join(" · ")}</span>}
      </div>
    </form>
  );
}

/** Small button that runs a server action (no form state), with optional confirm and error alert. */
export function ActionButton({
  action,
  confirmText,
  children,
  ...props
}: Omit<ButtonProps, "onClick" | "action"> & { action: () => Promise<ActionState | void>; confirmText?: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      {...props}
      disabled={pending || props.disabled}
      onClick={() => {
        if (confirmText && !confirm(confirmText)) return;
        start(async () => {
          const res = await action();
          if (res && res.error) alert(res.error);
        });
      }}
    >
      {children}
    </Button>
  );
}

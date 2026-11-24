"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function DeleteButton({ action, confirmText, label = "Delete" }: { action: () => Promise<void>; confirmText: string; label?: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      className="text-destructive"
      disabled={pending}
      onClick={() => confirm(confirmText) && start(() => action())}
    >
      <Trash2 /> {pending ? "Deleting…" : label}
    </Button>
  );
}

export function DeleteIconButton({ action, confirmText }: { action: () => Promise<void>; confirmText: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      aria-label="Delete"
      disabled={pending}
      onClick={() => confirm(confirmText) && start(() => action())}
      className="rounded p-1 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100 cursor-pointer"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}

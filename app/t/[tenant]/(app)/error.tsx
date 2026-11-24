"use client";

import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-lg border bg-card p-8 text-center">
      <h2 className="font-semibold">Something went wrong</h2>
      <p className="mt-1 text-sm text-muted-foreground">{error.message || "Please try again."}</p>
      <Button className="mt-4" variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}

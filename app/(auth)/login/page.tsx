"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { rootLoginAction } from "../actions";

export default function RootLoginPage() {
  const [state, action, pending] = useActionState(rootLoginAction, {});

  if (state.workspaces) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Choose a workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {state.workspaces.map((w) => (
            <a key={w.slug} href={w.url} className="flex items-center justify-between rounded-md border p-3 hover:bg-muted">
              <span className="font-medium">{w.name}</span>
              <span className="text-sm text-muted-foreground">{w.slug}</span>
            </a>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Log in</CardTitle>
        <CardDescription>We'll take you to your workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Log in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Create a workspace
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

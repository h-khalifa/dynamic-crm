"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { tenantLoginAction } from "../auth-actions";

export function TenantLoginForm({ tenantName, linkError }: { tenantName: string; linkError: boolean }) {
  const [state, action, pending] = useActionState(tenantLoginAction, {});
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">{tenantName}</CardTitle>
        <CardDescription>Sign in to your workspace</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {linkError && !state.error && (
            <p className="rounded-md bg-amber-50 p-2 text-sm text-amber-800">That sign-in link expired. Please log in.</p>
          )}
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
        </form>
      </CardContent>
    </Card>
  );
}

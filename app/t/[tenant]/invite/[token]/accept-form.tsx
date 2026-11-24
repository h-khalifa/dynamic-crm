"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/input";
import { acceptInviteAction } from "../../auth-actions";

type Props = { token: string; email: string; tenantName: string; hasAccount: boolean };

export function AcceptInviteForm({ token, email, tenantName, hasAccount }: Props) {
  const [state, action, pending] = useActionState(acceptInviteAction, {});
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Join {tenantName}</CardTitle>
        <CardDescription>
          {hasAccount ? `Sign in as ${email} to accept.` : `Create your account for ${email}.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          {!hasAccount && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" name="name" required />
              <FieldError message={state.fieldErrors?.name} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="password">{hasAccount ? "Password" : "Choose a password"}</Label>
            <Input id="password" name="password" type="password" required minLength={hasAccount ? undefined : 8} />
            <FieldError message={state.fieldErrors?.password} />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Joining…" : "Accept invitation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

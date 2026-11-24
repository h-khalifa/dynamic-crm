"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { signupAction } from "../actions";

type Props = {
  planCode: string;
  plans: { code: string; name: string }[];
  templates: { key: string; name: string; tagline: string }[];
  rootDomain: string;
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);

export function SignupForm({ planCode, plans, templates, rootDomain }: Props) {
  const [state, action, pending] = useActionState(signupAction, {});
  const [company, setCompany] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [template, setTemplate] = useState(templates[0].key);
  const [availability, setAvailability] = useState<{ available: boolean; reason?: string } | null>(null);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(company));
  }, [company, slugTouched]);

  useEffect(() => {
    if (slug.length < 3) return setAvailability(null);
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/slug-check?slug=${encodeURIComponent(slug)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then(setAvailability)
        .catch(() => {});
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [slug]);

  const fe = state.fieldErrors ?? {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create your workspace</CardTitle>
        <CardDescription>14-day free trial. No credit card required.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-5">
          <div className="space-y-2">
            <Label>What kind of business are you?</Label>
            <input type="hidden" name="template" value={template} />
            <div className="grid grid-cols-2 gap-2">
              {templates.map((t) => (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => setTemplate(t.key)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors cursor-pointer",
                    template === t.key ? "border-primary bg-accent ring-1 ring-primary" : "hover:bg-muted",
                  )}
                >
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.tagline}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" name="name" required autoComplete="name" />
              <FieldError message={fe.name} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
              <FieldError message={fe.email} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
            <FieldError message={fe.password} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="companyName">Workspace name</Label>
            <Input id="companyName" name="companyName" required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Sunrise Family Clinic" />
            <FieldError message={fe.companyName} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Workspace address</Label>
            <div className="flex items-center rounded-md border focus-within:ring-2 focus-within:ring-ring">
              <input
                id="slug"
                name="slug"
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                className="h-9 min-w-0 flex-1 rounded-l-md bg-transparent px-3 text-sm outline-none"
              />
              <span className="border-l px-3 text-sm text-muted-foreground">.{rootDomain}</span>
            </div>
            {availability && (
              <p className={cn("text-xs", availability.available ? "text-green-700" : "text-destructive")}>
                {availability.available ? "Available" : availability.reason}
              </p>
            )}
            <FieldError message={fe.slug} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan">Plan</Label>
            <Select id="plan" name="plan" defaultValue={planCode}>
              {plans.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          {state.error && <p className="rounded-md bg-red-50 p-3 text-sm text-destructive">{state.error}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? "Creating workspace…" : "Create workspace"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

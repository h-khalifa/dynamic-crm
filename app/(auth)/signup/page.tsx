import { PLAN_CATALOG } from "@/lib/plans";
import { rootDomain } from "@/lib/hosts";
import { TEMPLATES } from "@/lib/templates";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Create your workspace" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  const planCode = PLAN_CATALOG.some((p) => p.code === plan) ? plan! : "trial";
  return (
    <SignupForm
      planCode={planCode}
      plans={PLAN_CATALOG.map((p) => ({ code: p.code, name: p.name }))}
      templates={TEMPLATES.map((t) => ({ key: t.key, name: t.name, tagline: t.tagline }))}
      rootDomain={rootDomain()}
    />
  );
}

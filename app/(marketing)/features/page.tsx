import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_TERMS, ENTITY_KEYS } from "@/lib/entities";
import { TEMPLATES } from "@/lib/templates";

export const metadata = { title: "Features" };

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight">Why “dynamic”?</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Most CRMs force your business into their vocabulary. Dynamic-CRM works the other way round. Every workspace
          defines what its records are called, which fields they carry and how work flows through its pipeline.
        </p>
      </div>

      <h2 className="mt-14 text-2xl font-semibold">Industry templates</h2>
      <p className="mt-2 text-muted-foreground">Start from a template. Everything stays editable afterwards.</p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {TEMPLATES.map((t) => (
          <Card key={t.key}>
            <CardHeader>
              <CardTitle>{t.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{t.tagline}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {ENTITY_KEYS.map((k) => (
                  <Badge key={k} color="primary">
                    {DEFAULT_TERMS[k].singular} → {(t.terms[k] ?? DEFAULT_TERMS[k]).singular}
                  </Badge>
                ))}
              </div>
              <div className="text-sm">
                <span className="font-medium">Pipeline: </span>
                <span className="text-muted-foreground">{t.pipeline.stages.map((s) => s.name).join(" → ")}</span>
              </div>
              {Object.entries(t.fields).map(([k, fields]) => (
                <div key={k} className="text-sm">
                  <span className="font-medium">{(t.terms[k as keyof typeof t.terms] ?? DEFAULT_TERMS[k as keyof typeof DEFAULT_TERMS]).singular} fields: </span>
                  <span className="text-muted-foreground">{fields!.map((f) => f.label).join(", ")}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mt-16 text-2xl font-semibold">Built for teams</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {[
          ["Roles", "Owners, admins and members. Admins shape the workspace, members work in it."],
          ["Own subdomain", "Each organisation lives at its own address, with data isolated per workspace."],
          ["Timeline", "Every call, meeting and note in one chronological view per record."],
        ].map(([t, d]) => (
          <div key={t}>
            <h3 className="font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>

      <div className="mt-16">
        <Button asChild size="lg">
          <Link href="/signup">Start free trial</Link>
        </Button>
      </div>
    </div>
  );
}

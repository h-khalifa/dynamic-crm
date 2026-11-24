import { ArrowRight, Columns3, Layers, ListChecks, Paintbrush, ShieldCheck, Upload } from "lucide-react";
import Link from "next/link";
import { IndustrySwitcher, type DemoIndustry } from "@/components/marketing/industry-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_TERMS, ENTITY_KEYS } from "@/lib/entities";
import { TEMPLATES } from "@/lib/templates";

const SAMPLE_ROWS: Record<string, string[][]> = {
  clinic: [
    ["Sara Haddad", "1988-04-12", "O+", "INS-20931"],
    ["Omar Nasser", "1975-11-02", "A-", "INS-11872"],
    ["Lina Farouk", "1999-07-23", "B+", "INS-30455"],
  ],
  "real-estate": [
    ["Daniel Brooks", "Buy", "$650,000", "Downtown"],
    ["Maya Chen", "Rent", "$2,400", "Riverside"],
    ["Yusuf Kaya", "Sell", "$1,200,000", "Hillcrest"],
  ],
  agency: [
    ["Priya Patel", "Northwind Co.", "priya@northwind.co", "Marketing lead"],
    ["Tom Becker", "Lumen Studio", "tom@lumen.studio", "Founder"],
    ["Ana Ruiz", "Brightside", "ana@brightside.io", "CMO"],
  ],
  generic: [
    ["Alex Morgan", "alex@acme.com", "Acme Inc.", "Head of Ops"],
    ["Jordan Lee", "jordan@globex.com", "Globex", "CTO"],
    ["Sam Rivera", "sam@initech.com", "Initech", "Buyer"],
  ],
};

function buildDemo(): DemoIndustry[] {
  return TEMPLATES.map((t) => {
    const terms = Object.fromEntries(ENTITY_KEYS.map((k) => [k, { ...DEFAULT_TERMS[k], ...t.terms[k] }])) as typeof DEFAULT_TERMS;
    const contactFields = (t.fields.CONTACT ?? []).filter((f) => f.showInList !== false).map((f) => f.label);
    const columns =
      t.key === "agency" || t.key === "generic"
        ? ["Name", "Email", t.systemLabels?.CONTACT?.company ?? "Company", "Job title"]
        : ["Name", ...contactFields].slice(0, 4);
    const rows = SAMPLE_ROWS[t.key].map((r) => (t.key === "agency" ? [r[0], r[2], r[1], r[3]] : r));
    return {
      key: t.key,
      name: t.name,
      nav: ENTITY_KEYS.map((k) => ({ label: terms[k].plural, icon: terms[k].icon })),
      table: { title: terms.CONTACT.plural, columns, rows },
    };
  });
}

const features = [
  { icon: Paintbrush, title: "Your vocabulary", text: "Rename every entity: contacts become patients, deals become appointments. The whole app follows." },
  { icon: Layers, title: "Custom fields", text: "Add dates, dropdowns, currencies and more to any record, with validation built in." },
  { icon: Columns3, title: "Visual pipelines", text: "Drag records across stages you define, from 'Booked' to 'Completed' or 'Lead' to 'Closed'." },
  { icon: ListChecks, title: "Activities & tasks", text: "Log calls, meetings and notes on a timeline. Never miss a follow-up." },
  { icon: Upload, title: "CSV import", text: "Bring your existing spreadsheet in minutes and map columns to your own fields." },
  { icon: ShieldCheck, title: "Isolated workspaces", text: "Every organisation gets its own subdomain and data that is strictly scoped to it." },
];

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-20 text-center">
          <span className="inline-block rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
            One CRM · every industry
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            The CRM that <span className="text-primary">speaks your language</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Dynamic-CRM adapts its names, fields and pipelines to your business. A clinic manages patients and appointments.
            An agency manages clients and projects. Same powerful CRM, zero compromise.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/signup">
                Start your free trial <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
          <div className="mt-14">
            <IndustrySwitcher industries={buildDemo()} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Everything you need, named the way you work</h2>
          <p className="mt-3 text-muted-foreground">Start from an industry template, then make it yours.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <f.icon className="size-6 text-primary" />
                <CardTitle className="mt-2">{f.title}</CardTitle>
                <CardDescription>{f.text}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-20 md:grid-cols-3">
          {[
            ["1", "Pick your industry", "Choose Clinic, Real Estate, Agency or General. We set up terminology, fields and a pipeline."],
            ["2", "Get your workspace", "Your team gets its own space at yourname.dynamiccrm.com. Invite colleagues in seconds."],
            ["3", "Tweak anything", "Rename entities, add fields and reorder stages at any time, with no developer required."],
          ].map(([n, title, text]) => (
            <div key={n}>
              <div className="grid size-10 place-items-center rounded-full bg-primary font-semibold text-primary-foreground">{n}</div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["“We replaced three spreadsheets and a paper diary. The team calls it ‘the patient system’, and that's exactly what it feels like.”", "Dr. R. Saleh, Family Clinic"],
            ["“Property deals, viewings and clients in one board. Setup took an afternoon.”", "M. Okafor, Okafor Realty"],
            ["“Projects instead of ‘deals’ sounds small, but it's why our team actually uses it.”", "J. Lindqvist, Studio North"],
          ].map(([quote, who]) => (
            <Card key={who}>
              <CardContent className="pt-5">
                <p className="text-sm leading-relaxed">{quote}</p>
                <p className="mt-4 text-xs font-medium text-muted-foreground">{who}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">Illustrative testimonials.</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-2xl bg-primary px-8 py-14 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold">Ready to try a CRM that fits?</h2>
          <p className="mt-3 opacity-90">14-day free trial. No credit card required.</p>
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <Link href="/signup">Create your workspace</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

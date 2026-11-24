import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPrice, PLAN_CATALOG } from "@/lib/plans";

export const metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">Simple, per-workspace pricing</h1>
        <p className="mt-4 text-lg text-muted-foreground">Every plan includes industry templates, custom terminology and custom fields.</p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {PLAN_CATALOG.map((p) => {
          const featured = p.code === "starter";
          return (
            <Card key={p.code} className={cn("flex flex-col", featured && "border-primary ring-2 ring-primary")}>
              <CardHeader>
                {featured && <span className="text-xs font-semibold uppercase text-primary">Most popular</span>}
                <CardTitle className="text-xl">{p.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">{formatPrice(p.priceMonthly)}</span>
                  {p.priceMonthly > 0 && <span className="text-muted-foreground"> / month</span>}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="flex-1 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="size-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full" variant={featured ? "default" : "outline"}>
                  <Link href={`/signup?plan=${p.code}`}>{p.priceMonthly === 0 ? "Start free trial" : `Choose ${p.name}`}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Paid plans start with the same 14-day trial. Online payment is coming soon, so no card is needed today.
      </p>
    </div>
  );
}

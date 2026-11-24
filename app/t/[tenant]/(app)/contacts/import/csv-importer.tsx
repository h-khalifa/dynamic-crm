"use client";

import Link from "next/link";
import Papa from "papaparse";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import type { ImportResult } from "../actions";

type Target = { value: string; label: string };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function guess(header: string, targets: Target[]): string {
  const h = norm(header);
  const aliases: Record<string, string[]> = {
    firstName: ["firstname", "first", "givenname", "name"],
    lastName: ["lastname", "last", "surname", "familyname"],
    email: ["email", "emailaddress", "mail"],
    phone: ["phone", "phonenumber", "mobile", "tel", "telephone"],
  };
  for (const t of targets) {
    if (norm(t.label) === h || norm(t.value.replace(/^cf\./, "")) === h) return t.value;
    if (aliases[t.value]?.includes(h)) return t.value;
  }
  return "";
}

export function CsvImporter({ targets, onImport, plural }: { targets: Target[]; onImport: (rows: Record<string, string>[]) => Promise<ImportResult>; plural: string }) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onFile(file: File) {
    setResult(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const h = res.meta.fields ?? [];
        if (!h.length) return setParseError("Couldn't find a header row.");
        setParseError(null);
        setHeaders(h);
        setRows(res.data);
        setMapping(Object.fromEntries(h.map((col) => [col, guess(col, targets)])));
      },
      error: (err) => setParseError(err.message),
    });
  }

  const mapped = () =>
    rows.map((r) => {
      const out: Record<string, string> = {};
      for (const [col, target] of Object.entries(mapping)) if (target && r[col] != null) out[target] = String(r[col]);
      return out;
    });

  const hasFirstName = Object.values(mapping).includes("firstName");

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-5">
          <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} className="text-sm" />
          {parseError && <p className="mt-2 text-sm text-destructive">{parseError}</p>}
        </CardContent>
      </Card>

      {headers.length > 0 && !result?.ok && (
        <Card>
          <CardContent className="space-y-4 pt-5">
            <p className="text-sm text-muted-foreground">{rows.length} rows found. Map each column:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {headers.map((h) => (
                <div key={h} className="flex items-center gap-3">
                  <span className="w-40 truncate text-sm font-medium" title={h}>
                    {h}
                  </span>
                  <Select value={mapping[h] ?? ""} onChange={(e) => setMapping((m) => ({ ...m, [h]: e.target.value }))}>
                    <option value="">Skip</option>
                    {targets.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
            {!hasFirstName && <p className="text-sm text-amber-700">Map a column to “{targets[0].label}”: it's required.</p>}
            {result?.error && <p className="text-sm text-destructive">{result.error}</p>}
            <Button disabled={!hasFirstName || pending} onClick={() => start(async () => setResult(await onImport(mapped())))}>
              {pending ? "Importing…" : `Import ${rows.length} rows`}
            </Button>
          </CardContent>
        </Card>
      )}

      {result?.ok && (
        <Card>
          <CardContent className="space-y-3 pt-5">
            <p className="font-medium">
              Imported {result.imported} {plural.toLowerCase()}.
            </p>
            {result.skipped && result.skipped.length > 0 && (
              <div className="text-sm">
                <p className="text-muted-foreground">Skipped {result.skipped.length} rows:</p>
                <ul className="mt-1 max-h-48 overflow-y-auto text-xs text-muted-foreground">
                  {result.skipped.slice(0, 100).map((s) => (
                    <li key={s.row}>
                      Row {s.row}: {s.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button asChild>
              <Link href="/contacts">View {plural.toLowerCase()}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

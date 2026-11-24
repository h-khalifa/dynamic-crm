import type { FieldType } from "@prisma/client";
import { z } from "zod";

/** The subset of FieldDefinition needed for validation (keeps this module DB-free & testable). */
export type FieldSpec = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: unknown;
};

export type CustomValues = Record<string, string | number | boolean | string[]>;

function optionsOf(f: FieldSpec): string[] {
  return Array.isArray(f.options) ? f.options.map(String) : [];
}

function isEmpty(v: unknown) {
  return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
}

/** Validator for a single non-empty raw value. */
function schemaFor(f: FieldSpec): z.ZodType<CustomValues[string]> {
  const opts = optionsOf(f);
  switch (f.type) {
    case "NUMBER":
    case "CURRENCY":
      return z.coerce.number({ message: "Must be a number" }).refine(Number.isFinite, "Must be a number");
    case "BOOLEAN":
      return z.union([z.boolean(), z.string()]).transform((v) => v === true || v === "true" || v === "on");
    case "DATE":
      return z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
    case "EMAIL":
      return z.string().trim().pipe(z.email({ message: "Invalid email" }));
    case "URL":
      return z
        .string()
        .trim()
        .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
        .pipe(z.url({ message: "Invalid URL" }));
    case "SELECT":
      return z.string().refine((v) => opts.includes(v), "Pick one of the options");
    case "MULTISELECT":
      return z
        .union([z.string(), z.array(z.string())])
        .transform((v) => (Array.isArray(v) ? v : [v]))
        .refine((arr) => arr.every((v) => opts.includes(v)), "Invalid option");
    default:
      return z.string().trim().max(5000, "Too long");
  }
}

/**
 * Validates tenant-defined custom field values. Unknown keys are dropped, empty optional
 * values are omitted, and required fields must be present (BOOLEAN false counts as present).
 */
export function validateCustomFields(raw: Record<string, unknown>, defs: FieldSpec[]) {
  const data: CustomValues = {};
  const errors: Record<string, string> = {};
  for (const f of defs) {
    const value = raw[f.key];
    if (isEmpty(value)) {
      if (f.type === "BOOLEAN") data[f.key] = false;
      else if (f.required) errors[f.key] = `${f.label} is required`;
      continue;
    }
    const parsed = schemaFor(f).safeParse(value);
    if (parsed.success) data[f.key] = parsed.data;
    else errors[f.key] = parsed.error.issues[0]?.message ?? "Invalid value";
  }
  return { data, errors, ok: Object.keys(errors).length === 0 };
}

/** Form inputs for custom fields are named `cf.<key>`. */
export function readCustomFieldsFromForm(form: FormData, defs: FieldSpec[]): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const f of defs) {
    const name = `cf.${f.key}`;
    if (f.type === "MULTISELECT") raw[f.key] = form.getAll(name).map(String);
    else if (f.type === "BOOLEAN") raw[f.key] = form.get(name) === "on";
    else {
      const v = form.get(name);
      raw[f.key] = typeof v === "string" ? v.trim() : undefined;
    }
  }
  return raw;
}

export function formatFieldValue(f: Pick<FieldSpec, "type">, value: unknown): string {
  if (isEmpty(value)) return "";
  switch (f.type) {
    case "BOOLEAN":
      return value ? "Yes" : "No";
    case "CURRENCY":
      return Number(value).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
    case "NUMBER":
      return Number(value).toLocaleString("en-US");
    case "MULTISELECT":
      return Array.isArray(value) ? value.join(", ") : String(value);
    default:
      return String(value);
  }
}

/** camelCase key from a label, used when an admin creates a custom field. */
export function fieldKeyFromLabel(label: string): string {
  const words = label
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const key = words.map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase())).join("");
  return /^[a-z]/.test(key) ? key : `f${key}`;
}

import type { FieldDefinition, FieldType } from "@prisma/client";

/** Serializable description of one form input. Forms are rendered entirely from these. */
export type FormField = {
  name: string;
  label: string;
  type: FieldType | "RELATION";
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string | number | boolean | string[] | null;
  wide?: boolean;
};

export function optionList(options: unknown): { value: string; label: string }[] {
  return (Array.isArray(options) ? options : []).map((o) => ({ value: String(o), label: String(o) }));
}

/** Form inputs for a record's custom fields (named `cf.<key>`). */
export function customFormFields(defs: FieldDefinition[], values: unknown): FormField[] {
  const v = (values && typeof values === "object" ? values : {}) as Record<string, any>;
  return defs.map((d) => ({
    name: `cf.${d.key}`,
    label: d.label,
    type: d.type,
    required: d.required,
    options: optionList(d.options),
    defaultValue: v[d.key] ?? null,
    wide: d.type === "TEXTAREA" || d.type === "MULTISELECT",
  }));
}

/** Prefixes custom-field validation errors so they line up with input names. */
export function prefixErrors(errors: Record<string, string>) {
  return Object.fromEntries(Object.entries(errors).map(([k, v]) => [`cf.${k}`, v]));
}

export const str = (form: FormData, name: string) => {
  const v = form.get(name);
  return typeof v === "string" ? v.trim() : "";
};
export const optStr = (form: FormData, name: string) => str(form, name) || null;

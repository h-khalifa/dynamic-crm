import type { EntityKey, FieldType } from "@prisma/client";
import type { Term } from "../entities";

export type TemplateField = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  showInList?: boolean;
};

export type IndustryTemplate = {
  key: string;
  name: string;
  tagline: string;
  terms: Partial<Record<EntityKey, Term>>;
  /** Relabel built-in columns, e.g. DEAL.value → "Fee". */
  systemLabels?: Partial<Record<EntityKey, Record<string, string>>>;
  fields: Partial<Record<EntityKey, TemplateField[]>>;
  pipeline: { name: string; stages: { name: string; probability: number; color: string }[] };
};

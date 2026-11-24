import type { Prisma } from "@prisma/client";
import { DEFAULT_TERMS, ENTITY_KEYS } from "../entities";
import { agency } from "./agency";
import { clinic } from "./clinic";
import { generic } from "./generic";
import { realEstate } from "./real-estate";
import type { IndustryTemplate } from "./types";

export type { IndustryTemplate } from "./types";

export const TEMPLATES: IndustryTemplate[] = [clinic, realEstate, agency, generic];

export function getTemplate(key: string): IndustryTemplate {
  return TEMPLATES.find((t) => t.key === key) ?? generic;
}

/**
 * Seeds a brand-new tenant's terminology, fields and default pipeline.
 * Runs inside the signup transaction with an explicit tenantId.
 */
export async function applyTemplate(tx: Prisma.TransactionClient, tenantId: string, templateKey: string) {
  const t = getTemplate(templateKey);

  await tx.entityDefinition.createMany({
    data: ENTITY_KEYS.map((entityKey) => ({ tenantId, entityKey, ...DEFAULT_TERMS[entityKey], ...t.terms[entityKey] })),
  });

  const fieldRows: Prisma.FieldDefinitionCreateManyInput[] = [];
  for (const entityKey of ENTITY_KEYS) {
    (t.fields[entityKey] ?? []).forEach((f, i) =>
      fieldRows.push({
        tenantId,
        entityKey,
        key: f.key,
        label: f.label,
        type: f.type,
        options: f.options ?? [],
        required: f.required ?? false,
        showInList: f.showInList ?? true,
        order: i,
      }),
    );
    for (const [key, label] of Object.entries(t.systemLabels?.[entityKey] ?? {})) {
      fieldRows.push({ tenantId, entityKey, key, label, type: "TEXT", isSystem: true });
    }
  }
  if (fieldRows.length) await tx.fieldDefinition.createMany({ data: fieldRows });

  const pipeline = await tx.pipeline.create({ data: { tenantId, name: t.pipeline.name, isDefault: true } });
  await tx.stage.createMany({
    data: t.pipeline.stages.map((s, order) => ({ tenantId, pipelineId: pipeline.id, order, ...s })),
  });
  return pipeline;
}

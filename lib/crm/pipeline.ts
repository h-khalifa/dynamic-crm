import type { TenantDb } from "../tenant-db";

/** The tenant's default pipeline with ordered stages (creates one if missing). */
export async function getDefaultPipeline(db: TenantDb, tenantId: string) {
  const include = { stages: { orderBy: { order: "asc" as const } } };
  const existing =
    (await db.pipeline.findFirst({ where: { isDefault: true }, include })) ?? (await db.pipeline.findFirst({ include }));
  if (existing) return existing;
  const p = await db.pipeline.create({ data: { tenantId, name: "Pipeline", isDefault: true } });
  await db.stage.create({ data: { tenantId, pipelineId: p.id, name: "New", order: 0 } });
  return (await db.pipeline.findFirst({ where: { id: p.id }, include }))!;
}

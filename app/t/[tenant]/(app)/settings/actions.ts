"use server";

import type { EntityKey, FieldType, Role } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BADGE_COLORS } from "@/components/ui/card";
import { str } from "@/lib/crm/form-fields";
import { DEFAULT_TERMS, ENTITY_KEYS, FIELD_TYPES, ICON_NAMES, SYSTEM_FIELDS } from "@/lib/entities";
import { fieldKeyFromLabel } from "@/lib/fields/validate";
import { tenantUrl } from "@/lib/hosts";
import { mailer } from "@/lib/mailer";
import { assertCanAddUser, PlanLimitError } from "@/lib/plans";
import { ForbiddenError, requireMembership } from "@/lib/tenant";
import type { ActionState } from "@/lib/utils";

const done = (message = "Saved"): ActionState => {
  revalidatePath("/", "layout");
  return { ok: true, message };
};

const isEntityKey = (k: string): k is EntityKey => (ENTITY_KEYS as readonly string[]).includes(k);

// ───────────── Workspace ─────────────

export async function updateWorkspace(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { tenant, db } = await requireMembership("ADMIN");
  const name = str(form, "name");
  if (!name || name.length > 100) return { fieldErrors: { name: "1–100 characters" } };
  // Tenant is a platform model; scope the update to the current tenant explicitly.
  await db.tenant.update({ where: { id: tenant.id }, data: { name } });
  return done();
}

// ───────────── Terminology ─────────────

export async function saveTerminology(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { tenant, db } = await requireMembership("ADMIN");
  const fieldErrors: Record<string, string> = {};
  const rows = ENTITY_KEYS.map((entityKey) => {
    const singular = str(form, `${entityKey}.singular`) || DEFAULT_TERMS[entityKey].singular;
    const plural = str(form, `${entityKey}.plural`) || DEFAULT_TERMS[entityKey].plural;
    const iconRaw = str(form, `${entityKey}.icon`);
    const icon = (ICON_NAMES as readonly string[]).includes(iconRaw) ? iconRaw : DEFAULT_TERMS[entityKey].icon;
    if (singular.length > 40) fieldErrors[`${entityKey}.singular`] = "Max 40 characters";
    if (plural.length > 40) fieldErrors[`${entityKey}.plural`] = "Max 40 characters";
    return { entityKey, singular, plural, icon };
  });
  if (Object.keys(fieldErrors).length) return { fieldErrors };
  for (const r of rows) {
    await db.entityDefinition.upsert({
      where: { tenantId_entityKey: { tenantId: tenant.id, entityKey: r.entityKey } },
      update: { singular: r.singular, plural: r.plural, icon: r.icon },
      create: { tenantId: tenant.id, ...r },
    });
  }
  return done("Terminology updated");
}

// ───────────── Fields ─────────────

export async function saveSystemLabels(entityKey: EntityKey, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { tenant, db } = await requireMembership("ADMIN");
  if (!isEntityKey(entityKey)) return { error: "Unknown entity" };
  for (const sf of SYSTEM_FIELDS[entityKey]) {
    const label = str(form, sf.key).slice(0, 60);
    if (!label || label === sf.label) {
      await db.fieldDefinition.deleteMany({ where: { entityKey, key: sf.key, isSystem: true } });
    } else {
      await db.fieldDefinition.upsert({
        where: { tenantId_entityKey_key: { tenantId: tenant.id, entityKey, key: sf.key } },
        update: { label },
        create: { tenantId: tenant.id, entityKey, key: sf.key, label, type: sf.type, isSystem: true },
      });
    }
  }
  return done("Labels updated");
}

function parseOptions(raw: string) {
  return [...new Set(raw.split(/[\n,]/).map((s) => s.trim()).filter(Boolean))].slice(0, 100);
}

export async function createField(entityKey: EntityKey, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { tenant, db } = await requireMembership("ADMIN");
  if (!isEntityKey(entityKey)) return { error: "Unknown entity" };
  const label = str(form, "label");
  const type = str(form, "type") as FieldType;
  if (!label || label.length > 60) return { fieldErrors: { label: "1–60 characters" } };
  if (!FIELD_TYPES.some((t) => t.value === type)) return { fieldErrors: { type: "Pick a type" } };
  const options = parseOptions(str(form, "options"));
  if ((type === "SELECT" || type === "MULTISELECT") && options.length === 0) return { fieldErrors: { options: "Add at least one option" } };

  const existing = await db.fieldDefinition.findMany({ where: { entityKey }, select: { key: true, order: true } });
  const taken = new Set([...existing.map((e) => e.key), ...SYSTEM_FIELDS[entityKey].map((s) => s.key)]);
  const base = fieldKeyFromLabel(label);
  let key = base;
  for (let i = 2; taken.has(key); i++) key = `${base}${i}`;

  await db.fieldDefinition.create({
    data: {
      tenantId: tenant.id,
      entityKey,
      key,
      label,
      type,
      options,
      required: form.get("required") === "on",
      showInList: form.get("showInList") === "on",
      order: Math.max(-1, ...existing.map((e) => e.order)) + 1,
    },
  });
  return done("Field added");
}

export async function updateField(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { db } = await requireMembership("ADMIN");
  const field = await db.fieldDefinition.findFirst({ where: { id, isSystem: false } });
  if (!field) return { error: "Field not found" };
  const label = str(form, "label");
  if (!label || label.length > 60) return { fieldErrors: { label: "1–60 characters" } };
  const options = parseOptions(str(form, "options"));
  if ((field.type === "SELECT" || field.type === "MULTISELECT") && options.length === 0) return { fieldErrors: { options: "Add at least one option" } };
  await db.fieldDefinition.update({
    where: { id: field.id },
    data: { label, options, required: form.get("required") === "on", showInList: form.get("showInList") === "on" },
  });
  return done();
}

export async function moveField(id: string, direction: -1 | 1) {
  const { db } = await requireMembership("ADMIN");
  const field = await db.fieldDefinition.findFirst({ where: { id, isSystem: false } });
  if (!field) return;
  const siblings = await db.fieldDefinition.findMany({ where: { entityKey: field.entityKey, isSystem: false }, orderBy: { order: "asc" } });
  const idx = siblings.findIndex((s) => s.id === id);
  const swap = siblings[idx + direction];
  if (!swap) return;
  const reordered = [...siblings];
  [reordered[idx], reordered[idx + direction]] = [swap, field];
  for (const [order, f] of reordered.entries()) await db.fieldDefinition.update({ where: { id: f.id }, data: { order } });
  revalidatePath("/", "layout");
}

export async function setFieldArchived(id: string, archived: boolean) {
  const { db } = await requireMembership("ADMIN");
  await db.fieldDefinition.updateMany({ where: { id, isSystem: false }, data: { archived } });
  revalidatePath("/", "layout");
}

// ───────────── Pipeline ─────────────

export async function saveStages(pipelineId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { db } = await requireMembership("ADMIN");
  const pipeline = await db.pipeline.findFirst({ where: { id: pipelineId }, include: { stages: true } });
  if (!pipeline) return { error: "Pipeline not found" };
  const name = str(form, "pipelineName");
  if (name) await db.pipeline.update({ where: { id: pipeline.id }, data: { name: name.slice(0, 60) } });
  for (const s of pipeline.stages) {
    const stageName = str(form, `${s.id}.name`);
    if (!stageName) return { fieldErrors: { [`${s.id}.name`]: "Required" } };
    const color = str(form, `${s.id}.color`);
    const probability = Math.min(100, Math.max(0, Number(str(form, `${s.id}.probability`)) || 0));
    await db.stage.update({
      where: { id: s.id },
      data: { name: stageName.slice(0, 40), color: BADGE_COLORS.includes(color) ? color : s.color, probability },
    });
  }
  return done("Pipeline saved");
}

export async function addStage(pipelineId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { db, tenant } = await requireMembership("ADMIN");
  const pipeline = await db.pipeline.findFirst({ where: { id: pipelineId }, include: { stages: true } });
  if (!pipeline) return { error: "Pipeline not found" };
  const name = str(form, "name");
  if (!name) return { fieldErrors: { name: "Required" } };
  await db.stage.create({
    data: { tenantId: tenant.id, pipelineId: pipeline.id, name: name.slice(0, 40), order: pipeline.stages.length, color: "slate" },
  });
  return done("Stage added");
}

export async function deleteStage(id: string): Promise<ActionState> {
  const { db } = await requireMembership("ADMIN");
  const stage = await db.stage.findFirst({ where: { id }, include: { _count: { select: { deals: true } } } });
  if (!stage) return { error: "Stage not found" };
  if (stage._count.deals > 0) return { error: `Move the ${stage._count.deals} record(s) out of “${stage.name}” first.` };
  if ((await db.stage.count({ where: { pipelineId: stage.pipelineId } })) <= 1) return { error: "A pipeline needs at least one stage." };
  await db.stage.deleteMany({ where: { id } });
  return done("Stage deleted");
}

export async function moveStage(id: string, direction: -1 | 1) {
  const { db } = await requireMembership("ADMIN");
  const stage = await db.stage.findFirst({ where: { id } });
  if (!stage) return;
  const stages = await db.stage.findMany({ where: { pipelineId: stage.pipelineId }, orderBy: { order: "asc" } });
  const idx = stages.findIndex((s) => s.id === id);
  if (!stages[idx + direction]) return;
  [stages[idx], stages[idx + direction]] = [stages[idx + direction], stages[idx]];
  for (const [order, s] of stages.entries()) await db.stage.update({ where: { id: s.id }, data: { order } });
  revalidatePath("/", "layout");
}

// ───────────── Members ─────────────

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email({ message: "Enter a valid email" })),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function inviteMember(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { tenant, db, user } = await requireMembership("ADMIN");
  const parsed = inviteSchema.safeParse({ email: form.get("email"), role: form.get("role") });
  if (!parsed.success) return { fieldErrors: { email: parsed.error.issues[0].message } };
  const { email, role } = parsed.data;

  const members = await db.membership.findMany({ include: { user: { select: { email: true } } } });
  if (members.some((m) => m.user.email === email)) return { fieldErrors: { email: "Already a member" } };
  try {
    assertCanAddUser(tenant.plan, (await db.membership.count()) + (await db.invitation.count({ where: { acceptedAt: null, expiresAt: { gt: new Date() } } })));
  } catch (e) {
    if (e instanceof PlanLimitError) return { error: e.message };
    throw e;
  }
  await db.invitation.deleteMany({ where: { email, acceptedAt: null } });
  const token = randomBytes(24).toString("base64url");
  await db.invitation.create({
    data: { tenantId: tenant.id, email, role, token, expiresAt: new Date(Date.now() + 7 * 86400_000) },
  });
  const link = tenantUrl(tenant.slug, `/invite/${token}`);
  await mailer.send({
    to: email,
    subject: `${user.name} invited you to ${tenant.name}`,
    text: `You've been invited to join ${tenant.name} on Dynamic-CRM.\n\nAccept: ${link}\n\nThis link expires in 7 days.`,
  });
  return done(`Invitation sent. Link: ${link}`);
}

export async function revokeInvite(id: string) {
  const { db } = await requireMembership("ADMIN");
  await db.invitation.deleteMany({ where: { id, acceptedAt: null } });
  revalidatePath("/", "layout");
}

export async function changeRole(membershipId: string, role: Role): Promise<ActionState> {
  const { db, membership } = await requireMembership("OWNER");
  if (!["OWNER", "ADMIN", "MEMBER"].includes(role)) return { error: "Invalid role" };
  if (membershipId === membership.id) return { error: "You can't change your own role." };
  const target = await db.membership.findFirst({ where: { id: membershipId } });
  if (!target) return { error: "Member not found" };
  await db.membership.update({ where: { id: target.id }, data: { role } });
  return done("Role updated");
}

export async function removeMember(membershipId: string): Promise<ActionState> {
  const { db, membership } = await requireMembership("ADMIN");
  if (membershipId === membership.id) return { error: "You can't remove yourself." };
  const target = await db.membership.findFirst({ where: { id: membershipId } });
  if (!target) return { error: "Member not found" };
  if (target.role === "OWNER" && membership.role !== "OWNER") throw new ForbiddenError("Only owners can remove an owner.");
  await db.membership.deleteMany({ where: { id: target.id } });
  return done("Member removed");
}

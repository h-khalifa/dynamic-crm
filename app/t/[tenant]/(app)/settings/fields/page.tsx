import type { EntityKey, FieldDefinition } from "@prisma/client";
import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { ActionButton, ActionForm } from "@/components/crm/action-form";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { ENTITY_KEYS, FIELD_TYPES, SYSTEM_FIELDS } from "@/lib/entities";
import { param, type SearchParams } from "@/lib/crm/list-query";
import { requireMembership } from "@/lib/tenant";
import { getAllFieldDefs, getTerms } from "@/lib/terms";
import { cn } from "@/lib/utils";
import { createField, moveField, saveSystemLabels, setFieldArchived, updateField } from "../actions";

const typeLabel = (t: string) => FIELD_TYPES.find((f) => f.value === t)?.label ?? t;
const hasOptions = (t: string) => t === "SELECT" || t === "MULTISELECT";

function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 accent-[var(--primary)]" />
      {label}
    </label>
  );
}

function FieldRow({ field, first, last }: { field: FieldDefinition; first: boolean; last: boolean }) {
  const options = Array.isArray(field.options) ? (field.options as string[]) : [];
  return (
    <li className={cn("py-3", field.archived && "opacity-60")}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{field.label}</span>
          <Badge>{typeLabel(field.type)}</Badge>
          {field.required && <Badge color="amber">required</Badge>}
          {!field.showInList && <Badge color="slate">hidden in list</Badge>}
          {field.archived && <Badge color="red">archived</Badge>}
          <span className="font-mono text-xs text-muted-foreground">{field.key}</span>
        </div>
        <div className="flex items-center gap-1">
            {!field.archived && (
              <>
                <ActionButton variant="ghost" size="icon" disabled={first} action={moveField.bind(null, field.id, -1)} aria-label="Move up">
                  <ArrowUp />
                </ActionButton>
                <ActionButton variant="ghost" size="icon" disabled={last} action={moveField.bind(null, field.id, 1)} aria-label="Move down">
                  <ArrowDown />
                </ActionButton>
              </>
            )}
            <ActionButton
              variant="outline"
              size="sm"
              action={setFieldArchived.bind(null, field.id, !field.archived)}
              confirmText={field.archived ? undefined : `Archive “${field.label}”? It will be hidden but existing data is kept.`}
            >
              {field.archived ? "Restore" : "Archive"}
            </ActionButton>
        </div>
      </div>
      <details>
        <summary className="mt-1 cursor-pointer text-xs text-primary">Edit</summary>
        <div className="mt-3 rounded-md border bg-muted/30 p-3">
          <ActionForm action={updateField.bind(null, field.id)}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Label</Label>
                <Input name="label" defaultValue={field.label} required />
              </div>
              {hasOptions(field.type) && (
                <div className="space-y-1.5">
                  <Label>Options (one per line)</Label>
                  <Textarea name="options" defaultValue={options.join("\n")} />
                </div>
              )}
            </div>
            <div className="flex gap-6">
              <Checkbox name="required" label="Required" defaultChecked={field.required} />
              <Checkbox name="showInList" label="Show in list" defaultChecked={field.showInList} />
            </div>
          </ActionForm>
        </div>
      </details>
    </li>
  );
}

export default async function FieldsSettings({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const { tenant } = await requireMembership("ADMIN");
  const entityParam = param(sp, "entity");
  const entityKey: EntityKey = (ENTITY_KEYS as readonly string[]).includes(entityParam ?? "") ? (entityParam as EntityKey) : "CONTACT";
  const [terms, allDefs] = await Promise.all([getTerms(tenant.id), getAllFieldDefs(tenant.id)]);
  const defs = allDefs.filter((d) => d.entityKey === entityKey);
  const systemOverrides = new Map(defs.filter((d) => d.isSystem).map((d) => [d.key, d.label]));
  const active = defs.filter((d) => !d.isSystem && !d.archived);
  const archived = defs.filter((d) => !d.isSystem && d.archived);
  const term = terms[entityKey];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1">
        {ENTITY_KEYS.map((k) => (
          <Link
            key={k}
            href={`?entity=${k}`}
            className={cn("rounded-full px-3 py-1 text-sm", k === entityKey ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent")}
          >
            {terms[k].plural}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom fields for {term.plural.toLowerCase()}</CardTitle>
          <CardDescription>Add any information you need to track. Archived fields keep their data.</CardDescription>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">No custom fields yet.</p>
          ) : (
            <ul className="divide-y">
              {active.map((f, i) => (
                <FieldRow key={f.id} field={f} first={i === 0} last={i === active.length - 1} />
              ))}
            </ul>
          )}
          {archived.length > 0 && (
            <>
              <div className="mt-6 text-xs font-semibold uppercase text-muted-foreground">Archived</div>
              <ul className="divide-y">
                {archived.map((f) => (
                  <FieldRow key={f.id} field={f} first last />
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add a field</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={createField.bind(null, entityKey)} submitLabel="Add field" resetOnSuccess>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="label">Label</Label>
                <Input id="label" name="label" placeholder="e.g. Date of birth" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <Select id="type" name="type" defaultValue="TEXT">
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="options">Options (for dropdown / multi-select; one per line)</Label>
                <Textarea id="options" name="options" placeholder={"Option A\nOption B"} />
              </div>
            </div>
            <div className="flex gap-6">
              <Checkbox name="required" label="Required" />
              <Checkbox name="showInList" label="Show in list" defaultChecked />
            </div>
          </ActionForm>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Built-in field labels</CardTitle>
          <CardDescription>Rename the standard fields of a {term.singular.toLowerCase()}. Leave blank to reset.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm action={saveSystemLabels.bind(null, entityKey)} submitLabel="Save labels">
            <div className="grid gap-3 sm:grid-cols-2">
              {SYSTEM_FIELDS[entityKey].map((sf) => (
                <div key={sf.key} className="space-y-1.5">
                  <Label htmlFor={`sys-${sf.key}`} className="text-muted-foreground">
                    {sf.label}
                  </Label>
                  <Input id={`sys-${sf.key}`} name={sf.key} defaultValue={systemOverrides.get(sf.key) ?? sf.label} />
                </div>
              ))}
            </div>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}

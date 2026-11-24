import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { ActionButton, ActionForm } from "@/components/crm/action-form";
import { BADGE_COLORS, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { getDefaultPipeline } from "@/lib/crm/pipeline";
import { requireMembership } from "@/lib/tenant";
import { getTerms } from "@/lib/terms";
import { addStage, deleteStage, moveStage, saveStages } from "../actions";

export default async function PipelineSettings() {
  const { tenant, db } = await requireMembership("ADMIN");
  const [terms, pipeline] = await Promise.all([getTerms(tenant.id), getDefaultPipeline(db, tenant.id)]);
  const counts = await db.deal.groupBy({ by: ["stageId"], _count: { _all: true }, where: { stage: { pipelineId: pipeline.id } } });
  const countOf = new Map(counts.map((c) => [c.stageId, c._count._all]));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{terms.DEAL.singular} pipeline</CardTitle>
          <CardDescription>The stages a {terms.DEAL.singular.toLowerCase()} moves through on the board.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {pipeline.stages.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1 rounded-md border px-2 py-1 text-sm">
                <span className="mr-1">{s.name}</span>
                <span className="text-xs text-muted-foreground">({countOf.get(s.id) ?? 0})</span>
                <ActionButton variant="ghost" size="icon" className="size-6" disabled={i === 0} action={moveStage.bind(null, s.id, -1)} aria-label="Move left">
                  <ArrowUp className="-rotate-90" />
                </ActionButton>
                <ActionButton variant="ghost" size="icon" className="size-6" disabled={i === pipeline.stages.length - 1} action={moveStage.bind(null, s.id, 1)} aria-label="Move right">
                  <ArrowDown className="-rotate-90" />
                </ActionButton>
                <ActionButton variant="ghost" size="icon" className="size-6 text-destructive" action={deleteStage.bind(null, s.id)} confirmText={`Delete stage “${s.name}”?`} aria-label="Delete">
                  <Trash2 />
                </ActionButton>
              </div>
            ))}
          </div>
          <ActionForm action={saveStages.bind(null, pipeline.id)} submitLabel="Save pipeline">
            <div className="max-w-sm space-y-1.5">
              <Label htmlFor="pipelineName">Pipeline name</Label>
              <Input id="pipelineName" name="pipelineName" defaultValue={pipeline.name} />
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="pb-2 pr-3 font-medium">Stage</th>
                  <th className="pb-2 pr-3 font-medium">Color</th>
                  <th className="pb-2 font-medium">Win probability %</th>
                </tr>
              </thead>
              <tbody>
                {pipeline.stages.map((s) => (
                  <tr key={s.id}>
                    <td className="py-1.5 pr-3">
                      <Input name={`${s.id}.name`} defaultValue={s.name} required />
                    </td>
                    <td className="py-1.5 pr-3">
                      <Select name={`${s.id}.color`} defaultValue={s.color}>
                        {BADGE_COLORS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="py-1.5">
                      <Input name={`${s.id}.probability`} type="number" min={0} max={100} defaultValue={s.probability} className="w-28" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ActionForm>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Add a stage</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={addStage.bind(null, pipeline.id)} submitLabel="Add stage" resetOnSuccess inline>
            <Input name="name" placeholder="Stage name" className="w-64" required />
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}

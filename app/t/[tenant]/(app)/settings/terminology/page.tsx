import { ActionForm } from "@/components/crm/action-form";
import { EntityIcon } from "@/components/crm/entity-icon";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { DEFAULT_TERMS, ENTITY_KEYS, ICON_NAMES } from "@/lib/entities";
import { requireMembership } from "@/lib/tenant";
import { getTerms } from "@/lib/terms";
import { saveTerminology } from "../actions";

export default async function TerminologySettings() {
  const { tenant } = await requireMembership("ADMIN");
  const terms = await getTerms(tenant.id);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Terminology</CardTitle>
        <CardDescription>
          Rename each record type to match your business. The names update everywhere: navigation, pages, forms and buttons.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ActionForm action={saveTerminology} submitLabel="Save terminology">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="pb-2 pr-3 font-medium">Built-in</th>
                  <th className="pb-2 pr-3 font-medium">Singular</th>
                  <th className="pb-2 pr-3 font-medium">Plural</th>
                  <th className="pb-2 font-medium">Icon</th>
                </tr>
              </thead>
              <tbody>
                {ENTITY_KEYS.map((k) => (
                  <tr key={k}>
                    <td className="py-1.5 pr-3 text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <EntityIcon name={terms[k].icon} /> {DEFAULT_TERMS[k].singular}
                      </span>
                    </td>
                    <td className="py-1.5 pr-3">
                      <Input name={`${k}.singular`} defaultValue={terms[k].singular} maxLength={40} required />
                    </td>
                    <td className="py-1.5 pr-3">
                      <Input name={`${k}.plural`} defaultValue={terms[k].plural} maxLength={40} required />
                    </td>
                    <td className="py-1.5">
                      <Select name={`${k}.icon`} defaultValue={terms[k].icon}>
                        {ICON_NAMES.map((i) => (
                          <option key={i} value={i}>
                            {i}
                          </option>
                        ))}
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ActionForm>
      </CardContent>
    </Card>
  );
}

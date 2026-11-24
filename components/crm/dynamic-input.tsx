import { Input, Select, Textarea } from "@/components/ui/input";
import type { FormField } from "@/lib/crm/form-fields";

/** Renders the right control for any field type (system or tenant-defined). */
export function DynamicInput({ field }: { field: FormField }) {
  const { name, type, required, options = [], defaultValue } = field;
  const dv = defaultValue ?? "";
  switch (type) {
    case "TEXTAREA":
      return <Textarea id={name} name={name} required={required} defaultValue={String(dv)} />;
    case "BOOLEAN":
      return (
        <label className="flex h-9 items-center gap-2 text-sm">
          <input type="checkbox" name={name} defaultChecked={dv === true} className="size-4 accent-[var(--primary)]" />
          Yes
        </label>
      );
    case "SELECT":
    case "RELATION":
      return (
        <Select id={name} name={name} required={required} defaultValue={String(dv)}>
          <option value="">{required ? "Select…" : "None"}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      );
    case "MULTISELECT": {
      const selected = new Set(Array.isArray(dv) ? dv : []);
      return (
        <div className="flex flex-wrap gap-x-4 gap-y-2 py-1">
          {options.map((o) => (
            <label key={o.value} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" name={name} value={o.value} defaultChecked={selected.has(o.value)} className="size-4 accent-[var(--primary)]" />
              {o.label}
            </label>
          ))}
        </div>
      );
    }
    default: {
      const htmlType =
        type === "EMAIL" ? "email" : type === "PHONE" ? "tel" : type === "DATE" ? "date" : type === "NUMBER" || type === "CURRENCY" ? "number" : "text";
      return (
        <Input
          id={name}
          name={name}
          type={htmlType}
          required={required}
          step={type === "CURRENCY" ? "0.01" : type === "NUMBER" ? "any" : undefined}
          defaultValue={String(dv)}
          placeholder={type === "URL" ? "example.com" : undefined}
        />
      );
    }
  }
}

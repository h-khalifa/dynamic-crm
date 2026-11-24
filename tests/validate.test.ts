import { describe, expect, it } from "vitest";
import { fieldKeyFromLabel, formatFieldValue, readCustomFieldsFromForm, validateCustomFields, type FieldSpec } from "@/lib/fields/validate";

const f = (key: string, type: FieldSpec["type"], extra: Partial<FieldSpec> = {}): FieldSpec => ({
  key,
  label: key,
  type,
  required: false,
  options: [],
  ...extra,
});

describe("validateCustomFields", () => {
  const defs = [
    f("dob", "DATE", { required: true }),
    f("blood", "SELECT", { options: ["A+", "O-"] }),
    f("tags", "MULTISELECT", { options: ["vip", "new"] }),
    f("fee", "CURRENCY"),
    f("email", "EMAIL"),
    f("site", "URL"),
    f("consent", "BOOLEAN"),
  ];

  it("accepts and coerces valid input", () => {
    const r = validateCustomFields(
      { dob: "1990-01-02", blood: "O-", tags: ["vip"], fee: "12.5", email: "a@b.co", site: "example.com", consent: true, extra: "x" },
      defs,
    );
    expect(r.ok).toBe(true);
    expect(r.data).toEqual({ dob: "1990-01-02", blood: "O-", tags: ["vip"], fee: 12.5, email: "a@b.co", site: "https://example.com", consent: true });
    expect(r.data).not.toHaveProperty("extra");
  });

  it("reports required and invalid values", () => {
    const r = validateCustomFields({ blood: "B+", tags: ["nope"], fee: "abc", email: "bad" }, defs);
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors).sort()).toEqual(["blood", "dob", "email", "fee", "tags"]);
  });

  it("omits empty optional values and defaults booleans to false", () => {
    const r = validateCustomFields({ dob: "2000-01-01", blood: "", fee: "" }, defs);
    expect(r.ok).toBe(true);
    expect(r.data).toEqual({ dob: "2000-01-01", consent: false });
  });
});

describe("readCustomFieldsFromForm", () => {
  it("reads prefixed inputs by type", () => {
    const fd = new FormData();
    fd.append("cf.tags", "vip");
    fd.append("cf.tags", "new");
    fd.append("cf.consent", "on");
    fd.append("cf.note", "  hi  ");
    const raw = readCustomFieldsFromForm(fd, [f("tags", "MULTISELECT"), f("consent", "BOOLEAN"), f("note", "TEXT"), f("missing", "BOOLEAN")]);
    expect(raw).toEqual({ tags: ["vip", "new"], consent: true, note: "hi", missing: false });
  });
});

describe("helpers", () => {
  it("builds camelCase keys from labels", () => {
    expect(fieldKeyFromLabel("Date of birth")).toBe("dateOfBirth");
    expect(fieldKeyFromLabel("Insurance #")).toBe("insurance");
    expect(fieldKeyFromLabel("2nd phone")).toBe("f2ndPhone");
  });
  it("formats values for display", () => {
    expect(formatFieldValue({ type: "BOOLEAN" }, true)).toBe("Yes");
    expect(formatFieldValue({ type: "MULTISELECT" }, ["a", "b"])).toBe("a, b");
    expect(formatFieldValue({ type: "CURRENCY" }, 1234.5)).toBe("$1,234.50");
    expect(formatFieldValue({ type: "TEXT" }, undefined)).toBe("");
  });
});

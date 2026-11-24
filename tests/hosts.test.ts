import { describe, expect, it } from "vitest";
import { isValidSlug, parseHost } from "@/lib/hosts";

describe("parseHost", () => {
  const root = "localhost:3000";
  it("treats the root and www as the marketing site", () => {
    expect(parseHost("localhost:3000", root)).toEqual({ kind: "root" });
    expect(parseHost("www.localhost:3000", root)).toEqual({ kind: "root" });
  });
  it("extracts a tenant slug from a subdomain", () => {
    expect(parseHost("clinic.localhost:3000", root)).toEqual({ kind: "tenant", slug: "clinic" });
    expect(parseHost("Clinic.LOCALHOST:3000", root)).toEqual({ kind: "tenant", slug: "clinic" });
  });
  it("ignores reserved, nested and foreign hosts", () => {
    expect(parseHost("api.localhost:3000", root)).toEqual({ kind: "root" });
    expect(parseHost("a.b.localhost:3000", root)).toEqual({ kind: "root" });
    expect(parseHost("evil.com", root)).toEqual({ kind: "root" });
    expect(parseHost("clinic.localhost:3001", root)).toEqual({ kind: "root" });
    expect(parseHost(null, root)).toEqual({ kind: "root" });
  });
  it("works with a production domain", () => {
    expect(parseHost("acme.dynamiccrm.com", "dynamiccrm.com")).toEqual({ kind: "tenant", slug: "acme" });
  });
});

describe("isValidSlug", () => {
  it.each(["clinic", "abc", "my-clinic-2"])("accepts %s", (s) => expect(isValidSlug(s)).toBe(true));
  it.each(["ab", "-abc", "abc-", "ABC", "has space", "www", "admin", "a".repeat(33)])("rejects %s", (s) =>
    expect(isValidSlug(s)).toBe(false),
  );
});

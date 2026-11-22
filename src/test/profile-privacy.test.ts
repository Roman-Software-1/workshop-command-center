import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(`${process.cwd()}/drizzle/migrations/0000_create_private_profiles.sql`, "utf8");

describe("private profile access", () => {
  it("limits profile reads to the signed-in owner", () => {
    expect(migration).toMatch(/ALTER TABLE public\.profiles ENABLE ROW LEVEL SECURITY/);
    expect(migration).toMatch(/FOR SELECT TO authenticated USING \(auth\.uid\(\) = id\)/);
    expect(migration).not.toMatch(/GRANT[^;]*TO anon/);
  });
  it("prevents updates from transferring profile ownership", () => {
    expect(migration).toMatch(/FOR UPDATE TO authenticated USING \(auth\.uid\(\) = id\) WITH CHECK \(auth\.uid\(\) = id\)/);
  });
});
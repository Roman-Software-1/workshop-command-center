import { expect, it } from "vitest";
import { isRedirect } from "@tanstack/react-router";
import { openDefaultPanel } from "@/routes/index";

it("opens screen A directly from the main link", () => {
  let result: unknown;
  try { openDefaultPanel(); } catch (error) { result = error; }
  expect(isRedirect(result)).toBe(true);
  if (!isRedirect(result)) throw new Error("Main link must redirect to screen A");
  expect(result.options.to).toBe("/a");
  expect(result.options.replace).toBe(true);
});
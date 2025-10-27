import { describe, it, expect } from "vitest";
import { ApplicationScope } from "./src/scope/application-scope.ts";

describe("Simple Test", () => {
  it("should import ApplicationScope", () => {
    expect(ApplicationScope).toBeDefined();
  });
});

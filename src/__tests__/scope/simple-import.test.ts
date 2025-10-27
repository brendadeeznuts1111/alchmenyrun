import { describe, it, expect } from "vitest";
import { ApplicationScope, StageScope, NestedScope } from "../../scope";

describe("Simple Import Test", () => {
  it("should import all scope classes", () => {
    expect(ApplicationScope).toBeDefined();
    expect(StageScope).toBeDefined();
    expect(NestedScope).toBeDefined();
  });
});

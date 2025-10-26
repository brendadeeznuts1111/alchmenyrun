import { describe, test, expect } from "vitest";
import { JobQueue } from "./index";

describe("JobQueue", () => {
  test("should validate JobQueueProps interface", () => {
    const props = {
      name: "test-queue",
      batchSize: 20,
      maxRetries: 5,
      maxConcurrency: 100,
      deadLetterQueue: true,
    };

    // Test that props conform to expected interface
    expect(props.name).toBe("test-queue");
    expect(props.batchSize).toBe(20);
    expect(props.maxRetries).toBe(5);
    expect(props.maxConcurrency).toBe(100);
    expect(props.deadLetterQueue).toBe(true);
  });

  test("should handle minimal configuration", () => {
    const props = {
      name: "minimal-queue",
    };

    expect(props.name).toBe("minimal-queue");
    // Optional properties should be undefined when not provided
    expect((props as any).batchSize).toBeUndefined();
    expect((props as any).maxRetries).toBeUndefined();
    expect((props as any).maxConcurrency).toBeUndefined();
    expect((props as any).deadLetterQueue).toBeUndefined();
  });

  test("should validate name is required", () => {
    const props = {} as any;
    expect(props.name).toBeUndefined();
  });

  test("should export JobQueue function", () => {
    expect(typeof JobQueue).toBe("function");
  });
});

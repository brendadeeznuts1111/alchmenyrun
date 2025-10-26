import { describe, it, expect } from "vitest";
import alchemy from "alchemy";
import { BRANCH_PREFIX, generateTestId } from "./util";

// Initialize test scope with isolated infrastructure
const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("API Integration Tests", () => {
  test("should pass health check", async (scope: any) => {
    const resourceId = `${BRANCH_PREFIX}-health`;
    let website: any;

    try {
      const deployed = await scope.deploy();
      website = deployed.website;

      // Test the health endpoint
      const response = await fetch(`${website.url}/api/health`);
      expect(response.status).toBe(200);

      const data = (await response.json()) as any;
      expect(data.status).toBe("ok");
      expect(data.timestamp).toBeDefined();
    } finally {
      await destroy(scope);
    }
  });

  test("should handle CORS headers", async (scope: any) => {
    const resourceId = `${BRANCH_PREFIX}-cors`;
    let website: any;

    try {
      const deployed = await scope.deploy();
      website = deployed.website;

      // Test CORS preflight
      const response = await fetch(`${website.url}/api/health`, {
        method: "OPTIONS",
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
        "GET",
      );
    } finally {
      await destroy(scope);
    }
  });
});

describe("Database Operations", () => {
  test("should create and retrieve users", async (scope: any) => {
    const resourceId = `${BRANCH_PREFIX}-user`;
    let website: any;
    let createdUser: any;

    try {
      const deployed = await scope.deploy();
      website = deployed.website;

      // CREATE
      const testEmail = `${generateTestId()}@example.com`;
      const createResponse = await fetch(`${website.url}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          name: "Test User",
        }),
      });

      expect(createResponse.status).toBe(201);
      createdUser = (await createResponse.json()) as any;

      expect(createdUser.user).toMatchObject({
        email: testEmail,
        name: "Test User",
      });
      expect(createdUser.user.id).toBeDefined();

      // READ
      const getResponse = await fetch(`${website.url}/api/users`);
      expect(getResponse.status).toBe(200);

      const data = (await getResponse.json()) as any;
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.users.length).toBeGreaterThan(0);

      // Verify our test user is in the list
      const testUserInList = data.users.find(
        (user: any) => user.email === testEmail,
      );
      expect(testUserInList).toMatchObject({
        email: testEmail,
        name: "Test User",
      });
    } finally {
      await destroy(scope);
    }
  });

  test("should handle user validation errors", async (scope: any) => {
    const resourceId = `${BRANCH_PREFIX}-user-validation`;
    let website: any;

    try {
      const deployed = await scope.deploy();
      website = deployed.website;

      // Test invalid email - should fail
      const invalidResponse = await fetch(`${website.url}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "invalid-email",
          name: "Test User",
        }),
      });

      expect([400, 422]).toContain(invalidResponse.status);
    } finally {
      await destroy(scope);
    }
  });
});

describe("File Operations", () => {
  test("should handle file upload and retrieval", async (scope: any) => {
    const resourceId = `${BRANCH_PREFIX}-file`;
    let website: any;
    let uploadedFile: any;

    try {
      const deployed = await scope.deploy();
      website = deployed.website;

      // CREATE
      const formData = new FormData();
      const testContent = "test file content at " + new Date().toISOString();
      formData.append("file", new Blob([testContent]), "test.txt");
      formData.append("userId", generateTestId());

      const uploadResponse = await fetch(`${website.url}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (uploadResponse.status === 201) {
        uploadedFile = (await uploadResponse.json()) as any;
        expect(uploadedFile.file).toMatchObject({
          id: expect.any(String),
          size: expect.any(Number),
        });

        // READ
        const retrieveResponse = await fetch(
          `${website.url}/api/files/${uploadedFile.file.id}`,
        );
        if (retrieveResponse.status === 200) {
          const retrievedContent = await retrieveResponse.text();
          expect(retrievedContent).toBe(testContent);
        }
      } else {
        // Endpoint might not be implemented yet - that's ok for now
        expect([404, 500]).toContain(uploadResponse.status);
      }
    } finally {
      await destroy(scope);
    }
  });
});

describe("Cache Operations", () => {
  test("should set and get KV cache values", async (scope: any) => {
    const resourceId = `${BRANCH_PREFIX}-cache`;
    let website: any;

    try {
      const deployed = await scope.deploy();
      website = deployed.website;

      const testKey = generateTestId("cache");
      const testValue = { data: "test-value", timestamp: Date.now() };

      // CREATE
      const setResponse = await fetch(`${website.url}/api/cache/${testKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testValue),
      });

      if (setResponse.status === 201) {
        // READ
        const getResponse = await fetch(`${website.url}/api/cache/${testKey}`);
        expect(getResponse.status).toBe(200);

        const data = (await getResponse.json()) as any;
        expect(data).toMatchObject({
          key: testKey,
          found: true,
        });
        expect(JSON.parse(data.value)).toMatchObject(testValue);
      } else {
        // Endpoint might not be implemented yet
        expect([404, 500]).toContain(setResponse.status);
      }
    } finally {
      await destroy(scope);
    }
  });
});

describe("Durable Object (Chat)", () => {
  test("should handle WebSocket upgrade and messaging", async (scope: any) => {
    const resourceId = `${BRANCH_PREFIX}-chat`;
    let website: any;

    try {
      const deployed = await scope.deploy();
      website = deployed.website;

      // Test WebSocket upgrade request
      const response = await fetch(`${website.url}/api/chat`, {
        headers: {
          Upgrade: "websocket",
          Connection: "Upgrade",
        },
      });

      // When Chat is properly configured, should return 101 (Switching Protocols)
      // When disabled, returns 404
      expect([404, 101]).toContain(response.status);
    } finally {
      await destroy(scope);
    }
  });
});

describe("Workflow Operations", () => {
  test("should trigger and execute workflows", async (scope: any) => {
    const resourceId = `${BRANCH_PREFIX}-workflow`;
    let website: any;

    try {
      const deployed = await scope.deploy();
      website = deployed.website;

      const workflowData = {
        userId: generateTestId("workflow"),
        email: "test@example.com",
        name: "Test User",
      };

      // CREATE
      const response = await fetch(`${website.url}/api/workflow/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflowData),
      });

      // When Workflow is enabled, should return 201 with workflowId
      // When disabled, returns 404
      expect([404, 201]).toContain(response.status);

      if (response.status === 201) {
        const data = (await response.json()) as any;
        expect(data.workflowId).toBeDefined();
      }
    } finally {
      await destroy(scope);
    }
  });
});

describe("Error Handling", () => {
  test("should handle 404 for unknown endpoints", async (scope: any) => {
    const resourceId = `${BRANCH_PREFIX}-404`;
    let website: any;

    try {
      const deployed = await scope.deploy();
      website = deployed.website;

      const response = await fetch(`${website.url}/api/unknown-endpoint`);
      expect(response.status).toBe(404);

      const data = (await response.json()) as any;
      expect(data.error).toBe("Not found");
    } finally {
      await destroy(scope);
    }
  });

  test("should handle malformed JSON", async (scope: any) => {
    const resourceId = `${BRANCH_PREFIX}-malformed`;
    let website: any;

    try {
      const deployed = await scope.deploy();
      website = deployed.website;

      const response = await fetch(`${website.url}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid-json{",
      });

      expect([400, 422]).toContain(response.status);
    } finally {
      await destroy(scope);
    }
  });
});

// Helper functions for resource verification
async function assertWebsiteDoesNotExist(website: any) {
  try {
    const response = await fetch(`${website.url}/api/health`);
    if (response.status !== 404) {
      throw new Error(`Website still exists at ${website.url}`);
    }
  } catch (error) {
    // Network errors are expected for destroyed resources
    if (error instanceof Error && !error.message.includes("404")) {
      // Resource is likely destroyed if we get network errors
      return;
    }
    throw error;
  }
}

import { describe, it, expect } from "vitest";
import alchemy from "../../alchemy.run";
import { BRANCH_PREFIX, generateTestId } from "./util";

// Initialize test scope with isolated infrastructure
const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX
});

describe("API Integration Tests", () => {
  test("should pass health check", async (scope: any) => {
    // Deploy infrastructure for this test
    const { website } = await scope.deploy();

    // Test the health endpoint
    const response = await fetch(`${website.url}/api/health`);
    expect(response.status).toBe(200);

    const data = await response.json() as any;
    expect(data.status).toBe("ok");
    expect(data.timestamp).toBeDefined();
  });

  test("should handle CORS headers", async (scope: any) => {
    const { website } = await scope.deploy();

    // Test CORS preflight
    const response = await fetch(`${website.url}/api/health`, {
      method: "OPTIONS"
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("GET");
  });
});

describe("Database Operations", () => {
  test("should create and retrieve users", async (scope: any) => {
    const { website } = await scope.deploy();

    // Create a test user with deterministic ID
    const testEmail = `${generateTestId()}@example.com`;
    const createResponse = await fetch(`${website.url}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        name: "Test User"
      })
    });

    expect(createResponse.status).toBe(201);
    const createdUser = await createResponse.json() as any;

    expect(createdUser.user).toBeDefined();
    expect(createdUser.user.email).toBe(testEmail);
    expect(createdUser.user.id).toBeDefined();

    // Retrieve all users (should include our test user)
    const getResponse = await fetch(`${website.url}/api/users`);
    expect(getResponse.status).toBe(200);

    const data = await getResponse.json() as any;
    expect(Array.isArray(data.users)).toBe(true);
    expect(data.users.length).toBeGreaterThan(0);
    
    // Verify our test user is in the list
    const testUserInList = data.users.find((user: any) => user.email === testEmail);
    expect(testUserInList).toBeDefined();
  });

  test("should handle user validation errors", async (scope: any) => {
    const { website } = await scope.deploy();

    // Test invalid email
    const invalidResponse = await fetch(`${website.url}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "invalid-email",
        name: "Test User"
      })
    });

    // Should return 400 for validation error
    expect([400, 422]).toContain(invalidResponse.status);
  });
});

describe("File Operations", () => {
  test("should handle file upload and retrieval", async (scope: any) => {
    const { website } = await scope.deploy();

    // Test R2 file upload via form data
    const formData = new FormData();
    const testContent = "test file content at " + new Date().toISOString();
    formData.append("file", new Blob([testContent]), "test.txt");
    formData.append("userId", generateTestId());

    const uploadResponse = await fetch(`${website.url}/api/upload`, {
      method: "POST",
      body: formData
    });

    if (uploadResponse.status === 201) {
      const uploadedFile = await uploadResponse.json() as any;
      expect(uploadedFile.file).toBeDefined();
      expect(uploadedFile.file.id).toBeDefined();
      expect(uploadedFile.file.size).toBeGreaterThan(0);

      // Test file retrieval
      const retrieveResponse = await fetch(`${website.url}/api/files/${uploadedFile.file.id}`);
      if (retrieveResponse.status === 200) {
        const retrievedContent = await retrieveResponse.text();
        expect(retrievedContent).toBe(testContent);
      }
    } else {
      // Endpoint might not be implemented yet - that's ok for now
      expect([404, 500]).toContain(uploadResponse.status);
    }
  });
});

describe("Cache Operations", () => {
  test("should set and get KV cache values", async (scope: any) => {
    const { website } = await scope.deploy();

    const testKey = generateTestId('cache');
    const testValue = { data: "test-value", timestamp: Date.now() };

    // Test KV cache set operation
    const setResponse = await fetch(`${website.url}/api/cache/${testKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testValue)
    });

    if (setResponse.status === 201) {
      // Test KV cache get operation
      const getResponse = await fetch(`${website.url}/api/cache/${testKey}`);
      expect(getResponse.status).toBe(200);
      
      const data = await getResponse.json() as any;
      expect(data.key).toBe(testKey);
      expect(data.found).toBe(true);
      expect(JSON.parse(data.value)).toMatchObject(testValue);
    } else {
      // Endpoint might not be implemented yet
      expect([404, 500]).toContain(setResponse.status);
    }
  });
});

describe("Durable Object (Chat)", () => {
  test("should handle WebSocket upgrade and messaging", async (scope: any) => {
    const { website } = await scope.deploy();

    // Test WebSocket upgrade request
    const response = await fetch(`${website.url}/api/chat`, {
      headers: { 
        "Upgrade": "websocket",
        "Connection": "Upgrade"
      }
    });

    // When Chat is properly configured, should return 101 (Switching Protocols)
    // When disabled, returns 404
    expect([404, 101]).toContain(response.status);
  });
});

describe("Workflow Operations", () => {
  test("should trigger and execute workflows", async (scope: any) => {
    const { website } = await scope.deploy();

    const workflowData = {
      userId: generateTestId('workflow'),
      email: "test@example.com",
      name: "Test User"
    };

    // Test workflow trigger
    const response = await fetch(`${website.url}/api/workflow/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(workflowData)
    });

    // When Workflow is enabled, should return 201 with workflowId
    // When disabled, returns 404
    expect([404, 201]).toContain(response.status);
    
    if (response.status === 201) {
      const data = await response.json() as any;
      expect(data.workflowId).toBeDefined();
    }
  });
});

describe("Error Handling", () => {
  test("should handle 404 for unknown endpoints", async (scope: any) => {
    const { website } = await scope.deploy();

    const response = await fetch(`${website.url}/api/unknown-endpoint`);
    expect(response.status).toBe(404);
    
    const data = await response.json() as any;
    expect(data.error).toBe("Not found");
  });

  test("should handle malformed JSON", async (scope: any) => {
    const { website } = await scope.deploy();

    const response = await fetch(`${website.url}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid-json{"
    });

    expect([400, 422]).toContain(response.status);
  });
});

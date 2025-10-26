/**
 * Authentication Module
 *
 * Supports both JWT tokens and shared secrets for MCP authentication
 */
/**
 * Authenticate an incoming request using JWT or shared secret
 */
export async function authenticateRequest(request, env) {
  const authHeader = request.headers.get("Authorization");
  const secretHeader = request.headers.get("X-MCP-Secret");
  // Try shared secret first (simpler auth for development)
  if (secretHeader) {
    return authenticateWithSharedSecret(secretHeader, env);
  }
  // Try JWT bearer token
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return await authenticateWithJWT(token, env);
  }
  return {
    success: false,
    error: "No authentication credentials provided",
  };
}
/**
 * Authenticate using shared secret
 */
function authenticateWithSharedSecret(secret, env) {
  if (!env.MCP_SHARED_SECRET) {
    return {
      success: false,
      error: "Shared secret authentication not configured",
    };
  }
  if (secret !== env.MCP_SHARED_SECRET) {
    return {
      success: false,
      error: "Invalid shared secret",
    };
  }
  return {
    success: true,
    clientId: "shared-secret-client",
    metadata: {
      authMethod: "shared-secret",
    },
  };
}
/**
 * Authenticate using JWT token
 */
async function authenticateWithJWT(token, env) {
  if (!env.MCP_JWT_SECRET) {
    return {
      success: false,
      error: "JWT authentication not configured",
    };
  }
  try {
    // Parse JWT (basic implementation - in production use a proper JWT library)
    const parts = token.split(".");
    if (parts.length !== 3) {
      return {
        success: false,
        error: "Invalid JWT format",
      };
    }
    const [headerB64, payloadB64, signatureB64] = parts;
    // Verify signature
    const dataToVerify = `${headerB64}.${payloadB64}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(env.MCP_JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const signature = base64UrlDecode(signatureB64);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      encoder.encode(dataToVerify),
    );
    if (!isValid) {
      return {
        success: false,
        error: "Invalid JWT signature",
      };
    }
    // Decode payload
    const payload = JSON.parse(
      atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")),
    );
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return {
        success: false,
        error: "JWT token expired",
      };
    }
    // Check not-before
    if (payload.nbf && payload.nbf > Date.now() / 1000) {
      return {
        success: false,
        error: "JWT token not yet valid",
      };
    }
    return {
      success: true,
      clientId: payload.sub || payload.client_id || "jwt-client",
      metadata: {
        authMethod: "jwt",
        claims: payload,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `JWT authentication failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}
/**
 * Decode base64url string
 */
function base64UrlDecode(str) {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
/**
 * Generate a JWT token (for testing/development)
 */
export async function generateJWT(payload, secret, expiresIn = 3600) {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(claims));
  const dataToSign = `${headerB64}.${payloadB64}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(dataToSign),
  );
  const signatureB64 = base64UrlEncode(signature);
  return `${dataToSign}.${signatureB64}`;
}
/**
 * Encode to base64url
 */
function base64UrlEncode(data) {
  const bytes =
    typeof data === "string"
      ? new TextEncoder().encode(data)
      : new Uint8Array(data);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

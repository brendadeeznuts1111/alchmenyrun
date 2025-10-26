/**
 * Authentication Module
 *
 * Supports both JWT tokens and shared secrets for MCP authentication
 * 
 * @see {@link https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html | OWASP JWT Security}
 * @see {@link https://github.com/panva/jose | jose JWT Library}
 * @taxonomy [BUN/CLOUDFLARE/SPORTSBETTING]<TEST-STANDARDS:AGENT>[SECURITY]{#FANTASY402}@v2
 */

import type { Env } from "./index";
import { jwtVerify, SignJWT } from 'jose';
import { timingSafeEqual } from 'crypto';
import { z } from 'zod';

export interface AuthResult {
  success: boolean;
  error?: string;
  clientId?: string;
  metadata?: Record<string, unknown>;
}

// Input validation schemas
const JWTPayloadSchema = z.object({
  sub: z.string().optional(),
  client_id: z.string().optional(),
  iat: z.number().optional(),
  exp: z.number().optional(),
  nbf: z.number().optional(),
  iss: z.string().optional(),
  aud: z.string().optional(),
});

const AuthHeaderSchema = z.object({
  Authorization: z.string().regex(/^Bearer .+$/).optional(),
  'X-MCP-Secret': z.string().optional(),
});

/**
 * Authenticate an incoming request using JWT or shared secret
 */
export async function authenticateRequest(
  request: Request,
  env: Env,
): Promise<AuthResult> {
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
 * Authenticate using shared secret with timing-safe comparison
 * 
 * @see {@link https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#side-channel-attacks | OWASP Timing Attacks}
 */
function authenticateWithSharedSecret(secret: string, env: Env): AuthResult {
  if (!env.MCP_SHARED_SECRET) {
    return {
      success: false,
      error: "Shared secret authentication not configured",
    };
  }

  // Use timing-safe comparison to prevent timing attacks
  const secretBuffer = Buffer.from(secret, 'utf8');
  const expectedBuffer = Buffer.from(env.MCP_SHARED_SECRET, 'utf8');
  
  // Length check first (timing-safe)
  if (secretBuffer.length !== expectedBuffer.length) {
    return {
      success: false,
      error: "Invalid shared secret",
    };
  }

  // Constant-time comparison
  if (!timingSafeEqual(secretBuffer, expectedBuffer)) {
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
 * Authenticate using JWT token with secure jose library
 * 
 * @see {@link https://github.com/panva/jose#jwts-verification | jose JWT Verification}
 */
async function authenticateWithJWT(
  token: string,
  env: Env,
): Promise<AuthResult> {
  if (!env.MCP_JWT_SECRET) {
    return {
      success: false,
      error: "JWT authentication not configured",
    };
  }

  try {
    // Create secret key from environment variable
    const secret = new TextEncoder().encode(env.MCP_JWT_SECRET);
    
    // Verify JWT with strict security settings
    const { payload, protectedHeader } = await jwtVerify(token, secret, {
      algorithms: ['HS256'], // Only allow HMAC-SHA256
      maxTokenAge: '1h', // Maximum token age
      // issuer and audience validation can be added when needed
    });

    // Validate payload structure
    const validatedPayload = JWTPayloadSchema.parse(payload);

    // Extract client ID with fallbacks
    const clientId = validatedPayload.sub || validatedPayload.client_id || "jwt-client";

    return {
      success: true,
      clientId,
      metadata: {
        authMethod: "jwt",
        claims: validatedPayload,
        header: protectedHeader,
      },
    };
  } catch (error) {
    // Log error without sensitive information
    console.error("JWT authentication failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
    });
    
    return {
      success: false,
      error: "Invalid or expired JWT token",
    };
  }
}

/**
 * Decode base64url string
 */
function base64UrlDecode(str: string): Uint8Array {
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
 * Generate a JWT token using secure jose library (for testing/development)
 * 
 * @see {@link https://github.com/panva/jose#jwts-creation | jose JWT Creation}
 */
export async function generateJWT(
  payload: Record<string, unknown>,
  secret: string,
  expiresIn: number = 3600,
  issuer?: string,
  audience?: string,
): Promise<string> {
  try {
    // Validate payload
    const validatedPayload = JWTPayloadSchema.parse(payload);
    
    // Create JWT with security best practices
    const jwt = await new SignJWT(validatedPayload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .setIssuer(issuer || 'alchmenyrun-mcp')
      .setAudience(audience || 'mcp-server')
      .sign(new TextEncoder().encode(secret));
    
    return jwt;
  } catch (error) {
    throw new Error(`JWT generation failed: ${
      error instanceof Error ? error.message : "Unknown error"
    }`);
  }
}

/**
 * Encode to base64url
 */
function base64UrlEncode(data: string | ArrayBuffer): string {
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

#!/usr/bin/env bun
/**
 * Build frontend with infrastructure URLs
 *
 * This script uses PHASE=read to access deployed infrastructure
 * properties without modifying any resources.
 *
 * Usage:
 *   PHASE=read bun ./scripts/build-frontend.ts
 *   PHASE=read STAGE=prod bun ./scripts/build-frontend.ts
 *
 * Requirements:
 *   - Infrastructure must be deployed first
 *   - PHASE must be set to "read"
 */

// Main function
async function main() {
  // Validate phase
  if (process.env.PHASE !== "read") {
    console.error("❌ This script requires PHASE=read");
    console.error("Usage: PHASE=read bun ./scripts/build-frontend.ts");
    process.exit(1);
  }

  console.log("🔍 Reading infrastructure state...\n");

  // Import infrastructure (will read from state, not deploy)
  const { website } = await import("../alchemy.run.ts");

  // Display infrastructure info
  console.log("📊 Infrastructure Properties:");
  console.log(`   API URL: ${website.url}`);
  console.log(`   Stage: ${process.env.STAGE ?? "dev"}`);
  console.log("");

  // Build frontend with infrastructure URLs
  console.log("🏗️  Building frontend...\n");

  const buildEnv = {
    // Pass infrastructure URLs to build
    VITE_API_URL: website.url,
    VITE_STAGE: process.env.STAGE ?? "dev",
    NODE_ENV: "production",
  };

  // Display build environment
  console.log("🔧 Build Environment:");
  Object.entries(buildEnv).forEach(([key, value]) => {
    console.log(`   ${key}=${value}`);
  });
  console.log("");

  // Run build command
  try {
    const proc = Bun.spawn(["bun", "run", "build:css"], {
      env: { ...process.env, ...buildEnv },
      stdout: "inherit",
      stderr: "inherit",
    });

    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      console.error(`❌ Build failed with exit code ${exitCode}`);
      process.exit(exitCode);
    }

    console.log("\n✅ Frontend built successfully!");
    console.log(`   Output: ./src/frontend/index.css`);
    console.log(`   API URL: ${website.url}`);
  } catch (error) {
    console.error("❌ Build error:", error);
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

// Export to make this a module
export {};

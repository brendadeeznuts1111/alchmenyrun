/**
 * D1 OAuth Profile Override Utility
 *
 * This utility handles the D1 database creation issue where OAuth profiles
 * from 'wrangler login' cannot create D1 databases. D1 requires API token
 * authentication even when using OAuth profiles for other operations.
 */

import alchemy from "alchemy";

/**
 * Gets API token for D1 operations with comprehensive error handling
 * D1 database creation requires API token auth - OAuth tokens from 'wrangler login' don't support this
 *
 * @returns {Secret} Alchemy secret containing the API token
 * @throws {Error} Detailed error with solutions if token is missing
 */
export function getD1ApiToken() {
  // For D1 operations, we always need an API token even when using OAuth profile
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (!token) {
    throw new Error(`
🚨 D1 DATABASE CREATION REQUIRES API TOKEN

D1 database creation cannot use OAuth authentication from 'wrangler login'.
You must provide a Cloudflare API token with D1 permissions:

Solution 1: Set environment variable
export CLOUDFLARE_API_TOKEN="your_api_token_here"

Solution 2: Create .env file
echo "CLOUDFLARE_API_TOKEN=your_api_token_here" >> .env

Solution 3: Add to shell profile
echo 'export CLOUDFLARE_API_TOKEN="your_api_token_here"' >> ~/.bashrc
source ~/.bashrc

Required API token permissions:
- Zone:Zone:Read (for domain verification)
- Account:Cloudflare D1:Edit (for D1 operations)
- Account:Account Settings:Read (for account info)

Get your token at: https://dash.cloudflare.com/profile/api-tokens

Token creation steps:
1. Visit https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Custom token" template
4. Add required permissions listed above
5. Set "Account resources" to your account
6. Copy and set the token as environment variable
    `);
  }

  return alchemy.secret(token);
}

/**
 * Checks if D1 operations are properly configured
 * @returns {boolean} True if D1 operations will work
 */
export function isD1Configured(): boolean {
  return !!process.env.CLOUDFLARE_API_TOKEN;
}

/**
 * Gets D1 configuration status with helpful messages
 * @returns {object} Configuration status and recommendations
 */
export function getD1ConfigurationStatus() {
  const hasToken = !!process.env.CLOUDFLARE_API_TOKEN;
  const hasProfile = !!process.env.ALCHEMY_PROFILE;

  return {
    isConfigured: hasToken,
    usingOAuth: hasProfile && !hasToken,
    recommendations: [
      !hasToken && "Set CLOUDFLARE_API_TOKEN environment variable",
      hasProfile &&
        !hasToken &&
        "OAuth profile detected - API token still required for D1",
      hasToken && "✅ D1 operations properly configured",
    ].filter(Boolean),
    requiredPermissions: [
      "Zone:Zone:Read",
      "Account:Cloudflare D1:Edit",
      "Account:Account Settings:Read",
    ],
  };
}

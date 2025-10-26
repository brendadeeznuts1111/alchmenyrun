/**
 * Bun-native runtime utilities for Alchemy infrastructure
 * Provides Shell, Test, Build, and Package capabilities using Bun's native APIs
 * 
 * @see {@link https://bun.sh/docs | Bun Documentation}
 * @see {@link https://alchemy.run/docs | Alchemy Framework Documentation}
 */

import { $ } from "bun";

/**
 * Execute shell commands using Bun's native shell
 * 
 * @see {@link https://bun.sh/docs/runtime/shell | Bun Shell Documentation}
 */
export const BunShell = (name: string, cmd: string) => ({
  name,
  async run() {
    const proc = $`${cmd}`.cwd(process.cwd());
    return new Response(await proc.text(), { status: 200 });
  },
});

/**
 * Run Bun tests with optional glob pattern
 * 
 * @see {@link https://bun.sh/docs/cli/test | Bun Test Documentation}
 */
export const BunTest = (glob = "**/*.test.ts") => ({
  name: "bun-test",
  async run() {
    try {
      await $`bun test ${glob}`;
      return new Response("Tests passed", { status: 200 });
    } catch (error) {
      return new Response(`Tests failed: ${error}`, { status: 500 });
    }
  },
});

/**
 * Build TypeScript/JavaScript using Bun's native bundler
 * 
 * @see {@link https://bun.sh/docs/bundler | Bun Bundler Documentation}
 */
export const BunBuild = (entry: string, out: string) => ({
  name: "bun-build",
  async run() {
    try {
      await Bun.build({
        entrypoints: [entry],
        outdir: out,
        minify: true,
        sourcemap: "external",
      });
      return new Response(`Built ${entry} → ${out}`, { status: 200 });
    } catch (error) {
      return new Response(`Build failed: ${error}`, { status: 500 });
    }
  },
});

/**
 * Package management using Bun
 * 
 * @see {@link https://bun.sh/docs/cli/install | Bun Package Manager Documentation}
 */
export const BunPackage = (
  command: "install" | "update" | "add" | "remove",
  pkg?: string,
) => ({
  name: "bun-package",
  async run() {
    try {
      const cmd = pkg ? `bun ${command} ${pkg}` : `bun ${command}`;
      await $`${cmd}`;
      return new Response(`Package ${command} completed`, { status: 200 });
    } catch (error) {
      return new Response(`Package ${command} failed: ${error}`, {
        status: 500,
      });
    }
  },
});

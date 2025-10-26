/**
 * Bun-native runtime utilities for Alchemy infrastructure
 * Provides Shell, Test, Build, and Package capabilities using Bun's native APIs
 */

import { $ } from "bun";

/**
 * Execute shell commands using Bun's native shell
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
 */
export const BunPackage = (command: "install" | "update" | "add" | "remove", pkg?: string) => ({
  name: "bun-package",
  async run() {
    try {
      const cmd = pkg ? `bun ${command} ${pkg}` : `bun ${command}`;
      await $`${cmd}`;
      return new Response(`Package ${command} completed`, { status: 200 });
    } catch (error) {
      return new Response(`Package ${command} failed: ${error}`, { status: 500 });
    }
  },
});

import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { join, dirname } from "path";

// Type definition for R2Bucket (from Cloudflare Workers)
interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
  put(key: string, value: string | ArrayBuffer | ArrayBufferView | Blob, options?: R2PutOptions): Promise<R2Object>;
  delete(key: string): Promise<void>;
}

interface R2Object {
  key: string;
  size: number;
  uploaded: Date;
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
  json(): Promise<any>;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

interface R2PutOptions {
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
}

interface R2HTTPMetadata {
  contentType?: string;
  contentLanguage?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  cacheControl?: string;
  cacheExpiry?: Date;
}

/**
 * Distributed lock interface for different storage backends
 */
export interface DistributedLock {
  /**
   * Acquire a lock for a scope
   * @param scopePath Full scope path (e.g., "my-app/prod/backend")
   * @param timeout Timeout in milliseconds
   * @returns Promise<boolean> True if lock acquired, false if timed out
   */
  acquire(scopePath: string, timeout?: number): Promise<boolean>;

  /**
   * Release a lock for a scope
   * @param scopePath Full scope path
   */
  release(scopePath: string): Promise<void>;

  /**
   * Check if a scope is currently locked
   * @param scopePath Full scope path
   */
  isLocked(scopePath: string): Promise<boolean>;

  /**
   * Force release a lock (for emergency cleanup)
   * @param scopePath Full scope path
   */
  forceRelease(scopePath: string): Promise<void>;
}

/**
 * Lock metadata stored with the lock
 */
interface LockMetadata {
  /** Process ID that acquired the lock */
  pid: string;
  /** Timestamp when lock was acquired */
  acquiredAt: number;
  /** Hostname where lock was acquired */
  hostname: string;
  /** Optional lock owner identifier */
  owner?: string;
}

/**
 * File-based distributed locking implementation
 * Uses atomic file operations for cross-process safety
 */
export class FileDistributedLock implements DistributedLock {
  private readonly lockFiles = new Map<string, string>();
  private readonly baseDir: string;
  private readonly hostname: string;

  constructor(baseDir: string = ".alchemy") {
    this.baseDir = baseDir;
    this.hostname = process.env.HOSTNAME || process.env.COMPUTERNAME || 'unknown';
  }

  async acquire(scopePath: string, timeout: number = 30000): Promise<boolean> {
    const lockFile = this.getLockFilePath(scopePath);
    const startTime = Date.now();
    const lockId = `${process.pid}:${Date.now()}:${this.hostname}`;

    // Ensure lock directory exists
    const lockDir = dirname(lockFile);
    if (!existsSync(lockDir)) {
      mkdirSync(lockDir, { recursive: true });
    }

    while (Date.now() - startTime < timeout) {
      try {
        // Try to create lock file exclusively
        const metadata: LockMetadata = {
          pid: process.pid.toString(),
          acquiredAt: Date.now(),
          hostname: this.hostname,
        };

        writeFileSync(lockFile, JSON.stringify(metadata), { flag: 'wx' });
        this.lockFiles.set(scopePath, lockFile);
        return true;
      } catch (error: any) {
        if (error.code === 'EEXIST') {
          // Lock file exists, check if it's stale
          if (await this.isLockStale(scopePath)) {
            try {
              // Try to acquire the stale lock
              await this.forceRelease(scopePath);
              continue; // Retry acquisition
            } catch {
              // Could not release stale lock, wait and retry
              await new Promise(resolve => setTimeout(resolve, 100));
              continue;
            }
          }

          // Lock is still valid, wait and retry
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
        throw error;
      }
    }

    return false; // Timeout
  }

  async release(scopePath: string): Promise<void> {
    const lockFile = this.lockFiles.get(scopePath);
    if (lockFile && existsSync(lockFile)) {
      try {
        // Verify we own the lock before releasing
        const metadata = this.readLockMetadata(lockFile);
        if (metadata && metadata.pid === process.pid.toString()) {
          unlinkSync(lockFile);
        }
      } catch (error) {
        console.warn(`Failed to release lock for ${scopePath}:`, error);
      }
    }
    this.lockFiles.delete(scopePath);
  }

  async isLocked(scopePath: string): Promise<boolean> {
    const lockFile = this.getLockFilePath(scopePath);
    return existsSync(lockFile) && !(await this.isLockStale(scopePath));
  }

  async forceRelease(scopePath: string): Promise<void> {
    const lockFile = this.getLockFilePath(scopePath);
    if (existsSync(lockFile)) {
      try {
        unlinkSync(lockFile);
      } catch (error) {
        console.warn(`Failed to force release lock for ${scopePath}:`, error);
      }
    }
  }

  private async isLockStale(scopePath: string): Promise<boolean> {
    const lockFile = this.getLockFilePath(scopePath);
    try {
      const metadata = this.readLockMetadata(lockFile);
      if (!metadata) return true;

      // Consider lock stale if it's older than 5 minutes
      const staleThreshold = 5 * 60 * 1000; // 5 minutes
      return Date.now() - metadata.acquiredAt > staleThreshold;
    } catch {
      return true; // If we can't read the metadata, consider it stale
    }
  }

  private readLockMetadata(lockFile: string): LockMetadata | null {
    try {
      const data = readFileSync(lockFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  private getLockFilePath(scopePath: string): string {
    return join(this.baseDir, scopePath, ".lock");
  }
}

/**
 * Cloud-based distributed lock using R2/S3
 * Provides cross-environment locking for team collaboration
 */
export class CloudDistributedLock implements DistributedLock {
  private readonly bucket: R2Bucket;
  private readonly basePrefix: string;
  private readonly hostname: string;
  private readonly lockFiles = new Map<string, string>();

  constructor(bucket: R2Bucket, basePrefix: string = "locks") {
    this.bucket = bucket;
    this.basePrefix = basePrefix;
    this.hostname = process.env.HOSTNAME || process.env.COMPUTERNAME || 'unknown';
  }

  async acquire(scopePath: string, timeout: number = 30000): Promise<boolean> {
    const lockKey = this.getLockKey(scopePath);
    const startTime = Date.now();
    const lockId = `${process.pid}:${Date.now()}:${this.hostname}`;

    const metadata: LockMetadata = {
      pid: process.pid.toString(),
      acquiredAt: Date.now(),
      hostname: this.hostname,
      owner: lockId,
    };

    while (Date.now() - startTime < timeout) {
      try {
        // Try to create lock object exclusively
        const lockData = JSON.stringify(metadata);
        const existing = await this.bucket.get(lockKey);

        if (existing) {
          // Check if lock is stale
          if (await this.isCloudLockStale(lockKey)) {
            // Delete stale lock and retry
            await this.bucket.delete(lockKey);
            continue;
          }

          // Lock exists and is valid, wait and retry
          await new Promise(resolve => setTimeout(resolve, 1000)); // Cloud operations are slower
          continue;
        }

        // Try to create the lock
        await this.bucket.put(lockKey, lockData, {
          httpMetadata: {
            contentType: 'application/json',
          },
        });

        this.lockFiles.set(scopePath, lockKey);
        return true;

      } catch (error: any) {
        if (error.message?.includes('precondition')) {
          // Lock was created by another process, wait and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        throw error;
      }
    }

    return false; // Timeout
  }

  async release(scopePath: string): Promise<void> {
    const lockKey = this.lockFiles.get(scopePath);
    if (lockKey) {
      try {
        // Verify we own the lock before releasing
        const existing = await this.bucket.get(lockKey);
        if (existing) {
          const metadata = await existing.json() as LockMetadata;
          if (metadata.pid === process.pid.toString()) {
            await this.bucket.delete(lockKey);
          }
        }
      } catch (error) {
        console.warn(`Failed to release cloud lock for ${scopePath}:`, error);
      }
    }
    this.lockFiles.delete(scopePath);
  }

  async isLocked(scopePath: string): Promise<boolean> {
    const lockKey = this.getLockKey(scopePath);
    try {
      const existing = await this.bucket.get(lockKey);
      return existing !== null && !(await this.isCloudLockStale(lockKey));
    } catch {
      return false;
    }
  }

  async forceRelease(scopePath: string): Promise<void> {
    const lockKey = this.getLockKey(scopePath);
    try {
      await this.bucket.delete(lockKey);
    } catch (error) {
      console.warn(`Failed to force release cloud lock for ${scopePath}:`, error);
    }
  }

  private async isCloudLockStale(lockKey: string): Promise<boolean> {
    try {
      const existing = await this.bucket.get(lockKey);
      if (!existing) return true;

      const metadata = await existing.json() as LockMetadata;

      // Consider lock stale if it's older than 10 minutes (cloud operations are slower)
      const staleThreshold = 10 * 60 * 1000; // 10 minutes
      return Date.now() - metadata.acquiredAt > staleThreshold;
    } catch {
      return true;
    }
  }

  private getLockKey(scopePath: string): string {
    return `${this.basePrefix}/${scopePath}.lock`;
  }
}

/**
 * Composite distributed lock that tries multiple backends
 * Falls back from cloud to file-based locking
 */
export class CompositeDistributedLock implements DistributedLock {
  private readonly primary: DistributedLock;
  private readonly fallback: DistributedLock;

  constructor(primary: DistributedLock, fallback: DistributedLock) {
    this.primary = primary;
    this.fallback = fallback;
  }

  async acquire(scopePath: string, timeout: number = 30000): Promise<boolean> {
    // Try primary lock first
    try {
      const acquired = await this.primary.acquire(scopePath, timeout * 0.7); // Use 70% of timeout for primary
      if (acquired) return true;
    } catch (error) {
      console.warn('Primary lock failed, falling back to secondary:', error);
    }

    // Fall back to secondary lock
    return this.fallback.acquire(scopePath, timeout * 0.3); // Use remaining 30% for fallback
  }

  async release(scopePath: string): Promise<void> {
    try {
      await this.primary.release(scopePath);
    } catch {
      // Ignore primary release errors
    }

    try {
      await this.fallback.release(scopePath);
    } catch (error) {
      console.warn(`Failed to release fallback lock for ${scopePath}:`, error);
    }
  }

  async isLocked(scopePath: string): Promise<boolean> {
    try {
      return await this.primary.isLocked(scopePath);
    } catch {
      return this.fallback.isLocked(scopePath);
    }
  }

  async forceRelease(scopePath: string): Promise<void> {
    try {
      await this.primary.forceRelease(scopePath);
    } catch {
      // Ignore primary force release errors
    }

    try {
      await this.fallback.forceRelease(scopePath);
    } catch (error) {
      console.warn(`Failed to force release fallback lock for ${scopePath}:`, error);
    }
  }
}

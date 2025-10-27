// types.ts - TypeScript types for advanced Bun testing
export interface TgkCommandResult {
  success: boolean;
  output: string;
  error?: string;
  messageId?: string;
  executionTime?: number;
}

export interface RfcData {
  id: string;
  title: string;
  status: "draft" | "ready" | "reviewing" | "approved" | "merged";
  author: string;
  createdAt?: Date;
  updatedAt?: Date;
  reviewers?: string[];
  approvers?: string[];
  description?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  priority?: "low" | "medium" | "high" | "critical";
}

export interface ApprovalData {
  reviewerId: string;
  status: "approved" | "rejected" | "pending";
  timestamp: Date;
  comments?: string;
  weight?: number;
  conditions?: string[];
}

export interface NotificationData {
  type: "approval" | "sla_warning" | "reminder" | "completion" | "escalation";
  recipient: string;
  message: string;
  metadata?: {
    rfcId?: string;
    priority?: "low" | "medium" | "high" | "critical";
    [key: string]: any;
  };
  timestamp?: Date;
  channel?: "telegram" | "email" | "webhook";
}

export interface WorkflowState {
  currentStatus: string;
  pendingApprovals: string[];
  completedApprovals: string[];
  slaStatus: "on_track" | "at_risk" | "breached";
  timeRemaining: string;
  nextAction: string;
  blockers?: string[];
  history?: WorkflowEvent[];
}

export interface WorkflowEvent {
  timestamp: Date;
  actor: string;
  action: string;
  details?: Record<string, any>;
}

export interface MockFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  mockClear(): void;
  mockReset(): void;
  mockImplementation(fn: T): void;
  mockReturnValue(value: ReturnType<T>): void;
  mockResolvedValue(value: Awaited<ReturnType<T>>): void;
  mockRejectedValue(value: any): void;
  calls: Parameters<T>[];
  results: Array<{ type: "return" | "throw"; value: any }>;
}

export interface LoadTestConfig {
  load: "light" | "medium" | "heavy" | "extreme";
  concurrentRequests: number;
  expectedTimeMs: number;
  rampUpTime?: number;
  sustainTime?: number;
}

export interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  totalTime: number;
  requestCount: number;
  successCount: number;
  failureCount: number;
  averageTime: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface TestScenario {
  name: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  tags: string[];
  expectedDuration?: number;
}

export interface CriticalPathTest {
  criticalPath: string;
  priority: "high" | "critical";
  dependencies?: string[];
  slaMs?: number;
}

export interface FeatureFlag {
  feature: string;
  enabled: boolean;
  reason?: string;
  rolloutPercentage?: number;
}

// Type guards
export function isRfcData(value: any): value is RfcData {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    ["draft", "ready", "reviewing", "approved", "merged"].includes(value.status)
  );
}

export function isApprovalData(value: any): value is ApprovalData {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.reviewerId === "string" &&
    ["approved", "rejected", "pending"].includes(value.status) &&
    value.timestamp instanceof Date
  );
}

export function isNotificationData(value: any): value is NotificationData {
  return (
    typeof value === "object" &&
    value !== null &&
    ["approval", "sla_warning", "reminder", "completion", "escalation"].includes(value.type) &&
    typeof value.recipient === "string" &&
    typeof value.message === "string"
  );
}

// Utility types for testing
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : never;

export type ExtractPromiseType<T> = T extends Promise<infer U> ? U : T;

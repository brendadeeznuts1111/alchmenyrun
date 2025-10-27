// Core RPC client for making service calls
export interface RpcCallOptions {
  service: string;
  method: string;
  params?: Record<string, any>;
}

export interface RpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function makeRpcCall<T = any>(
  serviceOrMethod: string,
  optionsOrParams?: string | Record<string, any>
): Promise<T> {
  // Handle both makeRpcCall('service.method', params) and makeRpcCall('service', 'method', params) patterns
  let service: string;
  let method: string;
  let params: Record<string, any> = {};

  if (optionsOrParams && typeof optionsOrParams === 'string') {
    // makeRpcCall('service', 'method', params) pattern
    const parts = serviceOrMethod.split('.');
    service = parts[0] || '';
    method = parts[1] || '';
    params = optionsOrParams as any;
  } else {
    // makeRpcCall('service.method', params) pattern
    const parts = serviceOrMethod.split('.');
    service = parts[0] || '';
    method = parts[1] || '';
    params = (optionsOrParams as Record<string, any>) || {};
  }

  // For now, return mock responses. In production, this would make actual RPC calls
  switch (`${service}.${method}`) {
    case 'telegram.sendMessage':
      return {
        messageId: `msg_${Date.now()}`,
        chatId: params.chatId,
        status: 'sent'
      } as T;

    case 'release.addApproval':
      return {
        success: true,
        releaseId: params.releaseId,
        role: params.role,
        timestamp: params.timestamp
      } as T;

    case 'release.getStatus':
      return {
        id: params.releaseId,
        status: 'pending',
        type: 'minor',
        createdAt: new Date().toISOString(),
        approvals: [
          { role: 'tech-lead', count: 1, required: 1, status: 'approved' },
          { role: 'security', count: 0, required: 1, status: 'pending' }
        ],
        blockers: []
      } as T;

    case 'release.deploy':
      return {
        success: true,
        releaseId: params.releaseId,
        deploymentId: `deploy_${Date.now()}`,
        status: 'started'
      } as T;

    case 'release.hold':
      return {
        success: true,
        releaseId: params.releaseId,
        status: 'held',
        reason: params.reason
      } as T;

    case 'release.reject':
      return {
        success: true,
        releaseId: params.releaseId,
        status: 'rejected',
        reason: params.reason
      } as T;

    default:
      throw new Error(`Unknown RPC method: ${service}.${method}`);
  }
}

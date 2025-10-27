// Core policy evaluation using OPA
export interface PolicyInput {
  action: string;
  release?: {
    type: string;
    riskLevel: string;
    components: string[];
    urgency?: string;
  };
  approvals?: Array<{
    role: string;
    timestamp: string;
  }>;
  timestamp: string;
}

export interface PolicyResult {
  allowed: boolean;
  reason: string;
  requiredApprovals?: Array<{ role: string; count: number }>;
  currentApprovals?: Array<{ role: string; count: number }>;
}

export async function evaluatePolicy(
  policyPath: string,
  input: PolicyInput
): Promise<PolicyResult> {
  // For now, implement basic policy logic inline
  // In production, this would call OPA engine
  
  const { action, release, approvals = [] } = input;
  
  if (action !== 'deploy') {
    return {
      allowed: true,
      reason: 'Action is allowed',
      requiredApprovals: [],
      currentApprovals: []
    };
  }

  if (!release) {
    return {
      allowed: false,
      reason: 'Release information required for deployment',
      requiredApprovals: [],
      currentApprovals: []
    };
  }

  // Define approval requirements based on release type
  const requirements = {
    patch: { 'tech-lead': 1 },
    minor: { 'tech-lead': 1, 'security': 1 },
    major: { 'tech-lead': 2, 'security': 1, 'product': 1 }
  };

  const required = requirements[release.type as keyof typeof requirements] || {};
  const approvalCounts = approvals.reduce((acc, approval) => {
    acc[approval.role] = (acc[approval.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Check if all required approvals are met
  const requiredApprovals = Object.entries(required).map(([role, count]) => ({
    role,
    count
  }));

  const currentApprovals = Object.entries(approvalCounts).map(([role, count]) => ({
    role,
    count
  }));

  // Basic approval check
  let allowed = true;
  let reason = 'All required approvals received';

  for (const [role, requiredCount] of Object.entries(required)) {
    const currentCount = approvalCounts[role] || 0;
    if (currentCount < (requiredCount as number)) {
      allowed = false;
      reason = `Insufficient approvals for ${role}: ${currentCount}/${requiredCount}`;
      break;
    }
  }

  // Additional risk-based checks
  if (release.riskLevel === 'high' && approvals.length < 3) {
    allowed = false;
    reason = 'High-risk releases require at least 3 approvals';
  }

  if (release.type === 'major' && release.urgency === 'critical' && approvals.length < 2) {
    allowed = false;
    reason = 'Critical major releases require at least 2 approvals';
  }

  return {
    allowed,
    reason,
    requiredApprovals: requiredApprovals as Array<{ role: string; count: number }>,
    currentApprovals
  };
}

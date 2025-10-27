import { describe, test, expect } from "bun:test";
import { generateReleasePlan, assessRisk, ReleaseConfig } from "../release-plan";

describe.concurrent("Release Planning Core", () => {
  test.concurrent("generates appropriate steps for patch release", async () => {
    const plan = await generateReleasePlan({
      type: 'patch',
      components: ['core'],
      urgency: 'normal'
    });
    
    expect(plan.type).toBe('patch');
    expect(plan.steps).toContain('Run comprehensive test suite');
    expect(plan.steps).toContain('Deploy to production');
    expect(plan.estimatedDuration).toBe('30m');
    expect(plan.riskLevel).toBe('low');
  });

  test.concurrent("generates appropriate steps for minor release", async () => {
    const plan = await generateReleasePlan({
      type: 'minor',
      components: ['core', 'ui'],
      urgency: 'normal'
    });
    
    expect(plan.type).toBe('minor');
    expect(plan.steps).toContain('Run comprehensive test suite');
    expect(plan.steps).toContain('Run integration tests');
    expect(plan.steps).toContain('Gradual rollout to 100% traffic');
    expect(plan.estimatedDuration).toBe('2h');
  });

  test.concurrent("generates appropriate steps for major release", async () => {
    const plan = await generateReleasePlan({
      type: 'major',
      components: ['core', 'ui', 'workers'],
      urgency: 'normal'
    });
    
    expect(plan.type).toBe('major');
    expect(plan.steps).toContain('Run comprehensive test suite');
    expect(plan.steps).toContain('Run extended integration tests');
    expect(plan.steps).toContain('Perform canary deployment');
    expect(plan.steps).toContain('Deploy Cloudflare Workers');
    expect(plan.estimatedDuration).toBe('4h');
  });

  test.concurrent("includes component-specific steps", async () => {
    const plan = await generateReleasePlan({
      type: 'patch',
      components: ['core', 'database', 'workers'],
      urgency: 'normal'
    });
    
    expect(plan.steps).toContain('Deploy Cloudflare Workers');
    expect(plan.steps).toContain('Run database migrations');
  });

  test.concurrent("assesses risk correctly for low risk scenarios", async () => {
    const risk = assessRisk({
      type: 'patch',
      components: ['ui'],
      urgency: 'normal'
    });
    
    expect(risk).toBe('low');
  });

  test.concurrent("assesses risk correctly for medium risk scenarios", async () => {
    const risk = assessRisk({
      type: 'minor',
      components: ['core'],
      urgency: 'high'
    });
    
    expect(risk).toBe('medium');
  });

  test.concurrent("assesses risk correctly for high risk scenarios", async () => {
    const risk = assessRisk({
      type: 'major',
      components: ['core', 'database'],
      urgency: 'critical'
    });
    
    expect(risk).toBe('high');
  });

  test.concurrent("generates unique release IDs", async () => {
    const config: ReleaseConfig = {
      type: 'patch',
      components: ['core'],
      urgency: 'normal'
    };
    
    const plan1 = await generateReleasePlan(config);
    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));
    const plan2 = await generateReleasePlan(config);
    
    expect(plan1.id).not.toBe(plan2.id);
    expect(plan1.id).toMatch(/^release-\d+$/);
    expect(plan2.id).toMatch(/^release-\d+$/);
  });

  test.concurrent("includes required plan properties", async () => {
    const plan = await generateReleasePlan({
      type: 'minor',
      components: ['core', 'ui'],
      urgency: 'high'
    });
    
    expect(plan).toHaveProperty('id');
    expect(plan).toHaveProperty('type');
    expect(plan).toHaveProperty('components');
    expect(plan).toHaveProperty('steps');
    expect(plan).toHaveProperty('estimatedDuration');
    expect(plan).toHaveProperty('riskLevel');
    expect(plan).toHaveProperty('rollbackPlan');
    expect(plan).toHaveProperty('createdAt');
    expect(plan).toHaveProperty('status');
    
    expect(plan.status).toBe('planned');
    expect(plan.rollbackPlan).toBe('git revert HEAD && wrangler deploy --env production');
    expect(new Date(plan.createdAt)).toBeInstanceOf(Date);
  });

  test.concurrent("handles urgency-based duration adjustments", async () => {
    const normalPlan = await generateReleasePlan({
      type: 'minor',
      components: ['core'],
      urgency: 'normal'
    });
    
    const criticalPlan = await generateReleasePlan({
      type: 'minor',
      components: ['core'],
      urgency: 'critical'
    });
    
    // Critical releases should have same base duration but different risk assessment
    expect(normalPlan.estimatedDuration).toBe('2h');
    expect(criticalPlan.estimatedDuration).toBe('2h');
    
    // Risk level comparison for strings
    const riskLevels = { low: 1, medium: 2, high: 3 };
    expect(riskLevels[criticalPlan.riskLevel]).toBeGreaterThan(riskLevels[normalPlan.riskLevel]);
  });
});

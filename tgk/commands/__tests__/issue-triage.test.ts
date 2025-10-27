import { describe, test, expect } from '@jest/globals';
import { performTriageAnalysis } from '../commands/issue-triage';

describe('Issue Triage MVP', () => {
  test('identifies state-pinning issues', async () => {
    const issue = {
      title: 'Telegram pin race condition',
      body: 'Two concurrent reviews cause pinning issues',
      user: { login: 'testuser' },
      repository: { full_name: 'alchemist-council/tgk' },
      labels: []
    };

    const result = await performTriageAnalysis(issue);

    expect(result.labels).toContain('topic/state-pinning');
    expect(result.labels).toContain('internal');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  test('handles low confidence scenarios', async () => {
    const issue = {
      title: 'Something',
      body: 'Not sure what this is about',
      user: { login: 'testuser' },
      labels: []
    };

    const result = await performTriageAnalysis(issue);

    expect(result.confidence).toBeLessThan(0.8);
    expect(result.labels).toContain('type/question');
  });

  test('detects customer context', async () => {
    const issue = {
      title: 'Customer issue',
      body: 'Customer is reporting a problem with our service',
      user: { login: 'customer-user' },
      repository: { full_name: 'customer/repo' },
      labels: []
    };

    const result = await performTriageAnalysis(issue);

    expect(result.labels).toContain('customer');
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  test('identifies telegram integration issues', async () => {
    const issue = {
      title: 'Telegram webhook failing',
      body: 'Messages are not being sent to Telegram channels',
      user: { login: 'dev-user' },
      labels: []
    };

    const result = await performTriageAnalysis(issue);

    expect(result.labels).toContain('topic/telegram-integration');
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  test('classifies bug reports', async () => {
    const issue = {
      title: 'Application crashes on startup',
      body: 'The app is broken and shows error messages',
      user: { login: 'user' },
      labels: []
    };

    const result = await performTriageAnalysis(issue);

    expect(result.labels).toContain('type/bug');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  test('assesses impact levels', async () => {
    const issue = {
      title: 'Critical production outage',
      body: 'The entire service is down and customers cannot access anything. This is urgent and breaking.',
      user: { login: 'user' },
      labels: []
    };

    const result = await performTriageAnalysis(issue);

    expect(result.labels).toContain('impact/critical');
    expect(result.confidence).toBeGreaterThan(0.7);
  });
});

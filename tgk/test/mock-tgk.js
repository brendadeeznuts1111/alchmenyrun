#!/usr/bin/env node

/**
 * Mock tgk commands for testing infrastructure
 * Simulates tgk CLI behavior for comprehensive testing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class MockTGK {
  constructor() {
    this.testData = {
      streams: new Map(),
      rfcs: new Map(),
      pins: new Map(),
      notifications: new Map(),
      auditLog: [],
      metrics: new Map()
    };
    this.metrics = this.testData.metrics;
    this.initializeMetrics();
  }

  initializeMetrics() {
    this.metrics.set('tgk_review_assignment_total', 0);
    this.metrics.set('tgk_sla_breaches_total', 0);
    this.metrics.set('tgk_storage_cleanup_total', 0);
    this.metrics.set('tgk_storage_bytes_gauge', 1024);
    this.metrics.set('alc_do_invocations_total', 0);
  }

  // Mock command implementations
  async streamCreate(name, options = {}) {
    const stream = {
      id: name,
      type: options.type || 'general',
      owner: options.owner || '@test',
      created_at: new Date().toISOString(),
      topic_id: Math.floor(Math.random() * 100000)
    };
    this.testData.streams.set(name, stream);
    this.logAudit('stream_create', options.owner || '@test', { stream_name: name });
    return stream;
  }

  async rfcNew(options = {}) {
    const rfcId = `rfc-${Date.now()}`;
    const rfc = {
      id: rfcId,
      title: options.title || 'Test RFC',
      template: options.template || 'general',
      stream: options.stream || 'default',
      status: 'READY_FOR_REVIEW',
      approvals_needed: 5,
      approvals_received: 0,
      approvers: [],
      created_at: new Date().toISOString(),
      sla_hours: options.slaHours || 72
    };
    this.testData.rfcs.set(rfcId, rfc);
    this.logAudit('rfc_new', options.user || '@test', { rfc_id: rfcId });
    
    // Post initial status card
    await this.pinPost(rfc.stream, rfc);
    return rfc;
  }

  async rfcApprove(rfcId, user) {
    const rfc = this.testData.rfcs.get(rfcId);
    if (!rfc) {
      throw new Error(`RFC ${rfcId} not found`);
    }
    
    if (rfc.approvers.includes(user)) {
      throw new Error(`RFC ${rfcId} already approved by ${user}`);
    }
    
    rfc.approvers.push(user);
    rfc.approvals_received = rfc.approvers.length;
    
    if (rfc.approvals_received >= rfc.approvals_needed) {
      rfc.status = 'APPROVED';
    }
    
    this.logAudit('rfc_approve', user, { rfc_id: rfcId, approvals: rfc.approvals_received });
    this.incrementMetric('tgk_review_assignment_total');
    
    // Update pinned card
    await this.pinUpdate(rfc.stream, rfc);
    return rfc;
  }

  async rfcSubmit(rfcId) {
    const rfc = this.testData.rfcs.get(rfcId);
    if (!rfc) {
      throw new Error(`RFC ${rfcId} not found`);
    }
    
    if (rfc.status !== 'APPROVED') {
      throw new Error(`RFC ${rfcId} must be approved before submission`);
    }
    
    rfc.status = 'MERGED';
    rfc.merged_at = new Date().toISOString();
    
    this.logAudit('rfc_submit', '@system', { rfc_id: rfcId });
    
    // Update pinned card
    await this.pinUpdate(rfc.stream, rfc);
    return rfc;
  }

  async pinPost(streamName, rfc) {
    const messageId = `msg-${Date.now()}`;
    const pin = {
      id: messageId,
      stream: streamName,
      rfc_id: rfc.id,
      content: this.renderTemplate(rfc),
      pinned: true,
      created_at: new Date().toISOString()
    };
    
    // Unpin existing messages for this stream
    const existingPins = Array.from(this.testData.pins.values())
      .filter(p => p.stream === streamName && p.pinned);
    existingPins.forEach(p => p.pinned = false);
    
    this.testData.pins.set(messageId, pin);
    this.incrementMetric('alc_do_invocations_total');
    return pin;
  }

  async pinUpdate(streamName, rfc) {
    const existingPin = Array.from(this.testData.pins.values())
      .find(p => p.stream === streamName && p.pinned);
    
    if (existingPin) {
      existingPin.content = this.renderTemplate(rfc);
      existingPin.updated_at = new Date().toISOString();
      this.incrementMetric('alc_do_invocations_total');
    }
    
    return existingPin;
  }

  renderTemplate(rfc) {
    const approvalsNeeded = rfc.approvals_needed - rfc.approvals_received;
    return `🤖 **RFC: ${rfc.id} - ${rfc.title}**
━━━━━━━━━━━━━━━━━━━━
✨ **Status:** ${rfc.status}
👥 **Approvals Needed:** ${approvalsNeeded} / ${rfc.approvals_needed}
**Summary:** Test RFC summary for ${rfc.title}
━━━━━━━━━━━━━━━━━━━━
🗓️ **Submitted:** ${rfc.created_at.split('T')[0]}
⏱️ **SLA Remaining:** ${rfc.sla_hours} hours
🔗 **Full Spec:** [View RFC on GitHub](https://github.com/brendadeeznuts1111/alchmenyrun/blob/main/rfcs/${rfc.id}.md)
🚀 **PR:** [View PR #123](https://github.com/brendadeeznuts1111/alchmenyrun/pull/123)

${rfc.status === 'APPROVED' ? '🎉 **This RFC is APPROVED and ready for merge!**' : '📋 **Council Review Required** - Please review and approve'}`;
  }

  async notificationNudge(rfcId) {
    const notification = {
      id: `notif-${Date.now()}`,
      type: 'nudge',
      rfc_id: rfcId,
      message: `SLA breach nudge for ${rfcId}`,
      sent_at: new Date().toISOString()
    };
    
    this.testData.notifications.set(notification.id, notification);
    this.incrementMetric('tgk_sla_breaches_total');
    return notification;
  }

  async cleanup(scope, status, olderThan) {
    let cleanedCount = 0;
    
    if (scope === 'rfc') {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThan);
      
      for (const [rfcId, rfc] of this.testData.rfcs.entries()) {
        if (rfc.status === status && new Date(rfc.created_at) < cutoffDate) {
          this.testData.rfcs.delete(rfcId);
          cleanedCount++;
        }
      }
    }
    
    this.incrementMetric('tgk_storage_cleanup_total', cleanedCount);
    this.updateMetric('tgk_storage_bytes_gauge', -cleanedCount * 100);
    return cleanedCount;
  }

  logAudit(action, user, details = {}) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action_type: action,
      user_id: user,
      details: details,
      chat_id: details.stream || 'general'
    };
    this.testData.auditLog.push(auditEntry);
  }

  incrementMetric(name, value = 1) {
    const current = this.metrics.get(name) || 0;
    this.metrics.set(name, current + value);
  }

  updateMetric(name, value) {
    const current = this.metrics.get(name) || 0;
    this.metrics.set(name, Math.max(0, current + value));
  }

  // Query methods for testing
  getAuditLog(filter = {}) {
    let log = this.testData.auditLog;
    
    if (filter.action) {
      log = log.filter(entry => entry.action_type === filter.action);
    }
    
    if (filter.recent) {
      log = log.slice(-10);
    }
    
    return log.map(entry => 
      `${entry.timestamp} ${entry.action_type} ${entry.user_id} ${JSON.stringify(entry.details)}`
    ).join('\n');
  }

  getMetrics(name) {
    return this.metrics.get(name) || 0;
  }

  getPinList(streamName, options = {}) {
    let pins = Array.from(this.testData.pins.values())
      .filter(p => p.stream === streamName);
    
    if (options.pinnedOnly) {
      pins = pins.filter(p => p.pinned);
    }
    
    return pins.map(pin => pin.content).join('\n');
  }

  getNotificationList(type, options = {}) {
    let notifications = Array.from(this.testData.notifications.values());
    
    if (type) {
      notifications = notifications.filter(n => n.type === type);
    }
    
    if (options.recent) {
      notifications = notifications.slice(-3);
    }
    
    return notifications.map(n => `${n.sent_at} ${n.type} ${n.rfc_id}: ${n.message}`).join('\n');
  }
}

// Export for use in test suite
module.exports = MockTGK;

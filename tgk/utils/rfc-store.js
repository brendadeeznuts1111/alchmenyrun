/**
 * RFC Store - Persistent storage for RFC approvals and metadata
 * Uses D12 (or local storage for development)
 */

class RFCStore {
  constructor() {
    this.storage = process.env.NODE_ENV === 'production' ? 
      new D12Store() : new LocalStore();
  }

  async getRfc(rfcId) {
    return await this.storage.get(`rfc:${rfcId}`);
  }

  async addApproval(rfcId, reviewer) {
    const rfc = await this.getRfc(rfcId);
    if (!rfc) {
      throw new Error(`RFC ${rfcId} not found`);
    }
    
    // Check if already approved by this reviewer
    if (rfc.approvals && rfc.approvals.includes(reviewer)) {
      throw new Error(`RFC ${rfcId} already approved by ${reviewer}`);
    }
    
    rfc.approvals = rfc.approvals || [];
    rfc.approvals.push(reviewer);
    rfc.approvals_received = rfc.approvals.length;
    rfc.last_approval_at = new Date().toISOString();
    
    await this.storage.set(`rfc:${rfcId}`, rfc);
    return rfc;
  }

  async updateStatus(rfcId, status) {
    const rfc = await this.getRfc(rfcId);
    if (!rfc) {
      throw new Error(`RFC ${rfcId} not found`);
    }
    
    rfc.current_status = status;
    rfc.status_updated_at = new Date().toISOString();
    
    await this.storage.set(`rfc:${rfcId}`, rfc);
    return rfc;
  }

  async updateTelegramMessageId(rfcId, messageId) {
    const rfc = await this.getRfc(rfcId);
    if (!rfc) {
      throw new Error(`RFC ${rfcId} not found`);
    }
    
    rfc.telegram_message_id = messageId;
    rfc.telegram_updated_at = new Date().toISOString();
    
    await this.storage.set(`rfc:${rfcId}`, rfc);
    return rfc;
  }

  async createRfc(rfcData) {
    const rfc = {
      id: rfcData.id,
      title: rfcData.title,
      executive_summary: rfcData.executive_summary,
      current_status: 'READY_FOR_REVIEW',
      approvals_needed: rfcData.approvals_needed || 5,
      approvals_received: 0,
      approvals: [],
      submit_date: new Date().toISOString(),
      sla_remaining_hours: rfcData.sla_remaining_hours || 72,
      pr_number: rfcData.pr_number,
      telegram_message_id: rfcData.telegram_message_id || null,
      topic_id: rfcData.topic_id || '25782',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await this.storage.set(`rfc:${rfcData.id}`, rfc);
    return rfc;
  }

  async listRfcs(status = null) {
    const allKeys = await this.storage.listKeys('rfc:');
    const rfcs = [];
    
    for (const key of allKeys) {
      const rfc = await this.storage.get(key);
      if (rfc && (!status || rfc.current_status === status)) {
        rfcs.push(rfc);
      }
    }
    
    return rfcs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  async extendSla(rfcId, additionalHours) {
    const rfc = await this.getRfc(rfcId);
    if (!rfc) {
      throw new Error(`RFC ${rfcId} not found`);
    }
    
    rfc.sla_remaining_hours += additionalHours;
    rfc.sla_extended_at = new Date().toISOString();
    rfc.sla_extension_count = (rfc.sla_extension_count || 0) + 1;
    
    await this.storage.set(`rfc:${rfcId}`, rfc);
    return rfc;
  }
}

class LocalStore {
  constructor() {
    this.data = {};
  }

  async get(key) {
    return this.data[key];
  }

  async set(key, value) {
    this.data[key] = value;
  }

  async listKeys(prefix) {
    return Object.keys(this.data).filter(key => key.startsWith(prefix));
  }
}

class D12Store {
  constructor() {
    // D12 integration would go here
    this.d12 = require('d12-client');
  }

  async get(key) {
    return await this.d12.get(key);
  }

  async set(key, value) {
    return await this.d12.set(key, value);
  }

  async listKeys(prefix) {
    return await this.d12.listKeys(prefix);
  }
}

module.exports = { RFCStore };

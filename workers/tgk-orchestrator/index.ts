import { Ai } from '@cloudflare/ai';

export interface Env {
  AI: any;
  OPA: string;
  D12: string;
  D12_TOKEN: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_COUNCIL_ID: string;
}

interface PolicyRequest {
  input: any;
  policy: string;
}

interface CustomerNotification {
  customer_id: string;
  subject: string;
  content: string;
  channels: string[];
  priority: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case '/api/v1/policy/check':
        return handlePolicyCheck(request, env);
      case '/api/v1/customer/notify':
        return handleCustomerNotify(request, env);
      case '/api/v1/ai/label':
        return handleAILabel(request, env);
      default:
        return new Response('Not Found', { status: 404 });
    }
  }
};

async function handlePolicyCheck(request: Request, env: Env): Promise<Response> {
  try {
    const policyRequest: PolicyRequest = await request.json();

    // Call OPA policy evaluation
    const opaResponse = await fetch(`${env.OPA}/v1/data${policyRequest.policy}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: policyRequest.input })
    });

    if (!opaResponse.ok) {
      throw new Error(`OPA evaluation failed: ${opaResponse.statusText}`);
    }

    const policyResult = await opaResponse.json();
    return new Response(JSON.stringify(policyResult), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Policy check failed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleCustomerNotify(request: Request, env: Env): Promise<Response> {
  try {
    const notification: CustomerNotification = await request.json();

    // Send via D12 customer notification API
    const d12Response = await fetch(`${env.D12}/api/v1/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.D12_TOKEN}`
      },
      body: JSON.stringify(notification)
    });

    if (!d12Response.ok) {
      throw new Error(`D12 notification failed: ${d12Response.statusText}`);
    }

    const result = await d12Response.json();

    // Log metrics
    console.log(`alc.orchestrator.action={customer}, customer_id=${notification.customer_id}, template=${notification.priority}`);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Customer notification failed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleAILabel(request: Request, env: Env): Promise<Response> {
  try {
    const { title, body, changedFiles } = await request.json();

    const ai = new Ai(env.AI);

    // AI-powered labeling prompt
    const prompt = `Analyze this GitHub issue and suggest appropriate labels from our taxonomy.

Issue Title: ${title}
Issue Body: ${body}
Changed Files: ${changedFiles?.join(', ') || 'N/A'}

Taxonomy:
- Group: customer, internal
- Topic: state-pinning, observability, governance, performance, security, ux
- Impact: low, medium, high, critical

Return JSON with: {group, topic, impact, confidence_score_0_to_1, reasoning}`;

    const aiResponse = await ai.run('@cf/meta/llama-3-8b-instruct', {
      prompt,
      max_tokens: 200
    });

    let labels;
    try {
      labels = JSON.parse(aiResponse.response);
    } catch {
      // Fallback to keyword-based labeling
      labels = {
        group: body.toLowerCase().includes('customer') ? 'customer' : 'internal',
        topic: 'governance',
        impact: 'low',
        confidence_score_0_to_1: 0.5,
        reasoning: 'Fallback keyword-based labeling'
      };
    }

    // Log metrics
    console.log(`alc.orchestrator.action={issue}, group=${labels.group}, topic=${labels.topic}, impact=${labels.impact}`);

    return new Response(JSON.stringify({
      group: labels.group,
      topic: labels.topic,
      impact: labels.impact,
      confidence: labels.confidence_score_0_to_1,
      labels: [`group/${labels.group}`, `topic/${labels.topic}`, `impact/${labels.impact}`]
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI labeling failed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle Telegram webhook for interactive buttons
export async function handleTelegramWebhook(request: Request, env: Env): Promise<Response> {
  try {
    const update = await request.json();

    if (update.callback_query) {
      const callbackData = update.callback_query.data;
      const messageId = update.callback_query.message.message_id;

      // Handle callback actions
      if (callbackData.startsWith('/tgk release approve')) {
        const releaseId = callbackData.split(' ')[3];
        // Process approval (this would call the CLI command)
        console.log(`Processing release approval: ${releaseId}`);

        // Respond to Telegram
        await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: update.callback_query.id,
            text: 'Release approval initiated...'
          })
        });
      }
    }

    return new Response('OK');

  } catch (error) {
    console.error('Telegram webhook failed:', error);
    return new Response('Error', { status: 500 });
  }
}

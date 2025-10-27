import { DurableObject } from "cloudflare:workers";

export class GithubAgent {
  constructor(private ctx: DurableObjectState) {}

  async fetch(req: Request): Promise<Response> {
    const body: any = await req.json();
    const oldId = (await this.ctx.storage.get<number>("pinnedMsgId")) || 0;
    const tgToken = req.headers.get("X-Telegram-Bot-Token") as string;
    const topic = req.headers.get("X-Telegram-Topic") as string;

    // 1. unpin old
    if (oldId) await tg("unpinChatMessage", { message_id: oldId }, tgToken, topic);

    // 2. send new card
    const send = await tg("sendMessage", {
      text: fmtCard(body),
      parse_mode: "MarkdownV2",
    }, tgToken, topic);

    // 3. pin new
    await tg("pinChatMessage", { message_id: send.result.message_id }, tgToken, topic);

    // 4. save state
    await this.ctx.storage.put("pinnedMsgId", send.result.message_id);
    return new Response("ok");
  }
}

// helpers
async function tg(method: string, p: any, token: string, topic: string) {
  return fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...p, chat_id: env.COUNCIL_ID, message_thread_id: topic }),
  }).then(r => r.json<any>());
}
const fmtCard = (b: any) => `*${b.action}* \\#${b.number} – ${b.repo}`;

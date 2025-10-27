export class GithubAgent {
  ctx;
  constructor(ctx) {
    this.ctx = ctx;
  }
  async fetch(req) {
    const body = await req.json();
    const oldId = (await this.ctx.storage.get("pinnedMsgId")) || 0;
    const tgToken = req.headers.get("X-Telegram-Bot-Token");
    const topic = req.headers.get("X-Telegram-Topic");
    const councilId = req.headers.get("X-Telegram-Council-Id");
    // 1. unpin old
    if (oldId)
      await tg(
        "unpinChatMessage",
        { message_id: oldId },
        tgToken,
        topic,
        councilId,
      );
    // 2. send new card
    const send = await tg(
      "sendMessage",
      {
        text: fmtCard(body),
        parse_mode: "MarkdownV2",
      },
      tgToken,
      topic,
      councilId,
    );
    // 3. pin new
    await tg(
      "pinChatMessage",
      { message_id: send.result.message_id },
      tgToken,
      topic,
      councilId,
    );
    // 4. save state
    await this.ctx.storage.put("pinnedMsgId", send.result.message_id);
    return new Response("ok");
  }
}
// helpers
async function tg(method, p, token, topic, councilId) {
  return fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...p,
      chat_id: councilId,
      message_thread_id: topic,
    }),
  }).then((r) => r.json());
}
const fmtCard = (b) => `*${b.action}* \\#${b.number} – ${b.repo}`;

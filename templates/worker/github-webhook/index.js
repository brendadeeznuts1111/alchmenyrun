import { Router } from "itty-router";
const router = Router();

const TG_TOKEN = ENV.TELEGRAM_BOT_TOKEN;
const COUNCIL_ID = ENV.COUNCIL_ID;
const STREAM_TOPIC_ID = ENV.STREAM_TOPIC_ID;
const STREAM_EMOJI = ENV.STREAM_EMOJI;
const STREAM_SHORT = ENV.STREAM_SHORT;

router.post("/github", async (req) => {
  const gh = await req.json();
  const action = gh.action || gh.headers?.["X-GitHub-Event"] || "unknown";

  let text = "",
    buttons = [];
  switch (action) {
    case "opened":
      text = `${STREAM_EMOJI} **PR #${gh.pull_request?.number} opened**\n${gh.pull_request?.title || "Unknown PR"}`;
      buttons = [{ text: "👁 View", url: gh.pull_request?.html_url || "" }];
      break;
    case "closed":
      const isMerged = gh.pull_request?.merged === true;
      text = `${STREAM_EMOJI} **PR #${gh.pull_request?.number} ${
        isMerged ? "merged" : "closed"
      }**\n${gh.pull_request?.title || "Unknown PR"}`;
      break;
    case "review_requested":
      text = `${STREAM_EMOJI} **Review requested**\n${gh.pull_request?.title || "Unknown PR"}\n👤 ${gh.requested_reviewer?.login || "Unknown reviewer"}`;
      buttons = [{ text: "✅ Review", url: gh.pull_request?.html_url || "" }];
      break;
    case "review_submitted":
      const reviewState = gh.review?.state || "unknown";
      const emoji =
        reviewState === "approved"
          ? "✅"
          : reviewState === "changes_requested"
            ? "❌"
            : "💬";
      text = `${STREAM_EMOJI} **Review ${reviewState}**\n${gh.pull_request?.title || "Unknown PR"}\n${emoji} ${gh.review?.user?.login || "Unknown reviewer"}`;
      break;
    default:
      text = `${STREAM_EMOJI} **GitHub event: ${action}**\n${gh.repository?.full_name || "Unknown repo"}`;
      break;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: COUNCIL_ID,
          message_thread_id: STREAM_TOPIC_ID,
          text,
          parse_mode: "Markdown",
          reply_markup:
            buttons.length > 0 ? { inline_keyboard: [buttons] } : undefined,
        }),
      },
    );

    if (!response.ok) {
      console.error(
        `Telegram API error: ${response.status} ${response.statusText}`,
      );
    }

    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
    return new Response("error", { status: 500 });
  }
});

addEventListener("fetch", (event) =>
  event.respondWith(router.handle(event.request)),
);

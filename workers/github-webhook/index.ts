export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const stream = url.pathname.split("/")[2] || "forum-polish"; // default
    const id = env.GITHUB_DO.idFromName(`gh_agent_${stream}`);
    return env.GITHUB_DO.get(id).fetch(req.clone(), {
      headers: {
        "X-Telegram-Bot-Token": env.TG_TOKEN,
        "X-Telegram-Topic": stream === "mobile-app" ? env.TOPIC_MOBILE : env.TOPIC_FORUM,
      },
    });
  },
};

export { GithubAgent } from "../../src/do/github-agent";

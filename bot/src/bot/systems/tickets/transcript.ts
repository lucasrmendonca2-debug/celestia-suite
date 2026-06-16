import { AttachmentBuilder, ChannelType, TextChannel } from "discord.js";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function buildTranscript(channel: TextChannel): Promise<AttachmentBuilder> {
  if (channel.type !== ChannelType.GuildText) {
    throw new Error("Canal inválido para transcript.");
  }
  const collected: { author: string; avatar: string; ts: string; content: string; attachments: string[] }[] = [];
  let lastId: string | undefined;
  // Coleta até ~1000 mensagens
  for (let i = 0; i < 10; i++) {
    const batch = await channel.messages.fetch({ limit: 100, before: lastId }).catch(() => null);
    if (!batch || batch.size === 0) break;
    for (const m of batch.values()) {
      collected.push({
        author: m.author.tag,
        avatar: m.author.displayAvatarURL({ size: 64 }),
        ts: new Date(m.createdTimestamp).toLocaleString("pt-BR"),
        content: m.content,
        attachments: [...m.attachments.values()].map((a) => a.url),
      });
    }
    lastId = batch.last()?.id;
    if (batch.size < 100) break;
  }
  collected.reverse();

  const rows = collected
    .map(
      (m) => `<div class="msg"><img src="${esc(m.avatar)}" class="av"/>
<div><div class="head"><b>${esc(m.author)}</b> <span class="ts">${esc(m.ts)}</span></div>
<div class="body">${esc(m.content) || "<i>(sem texto)</i>"}</div>
${m.attachments.map((u) => `<div class="att"><a href="${esc(u)}">${esc(u)}</a></div>`).join("")}</div></div>`,
    )
    .join("\n");

  const html = `<!doctype html><html><head><meta charset="utf-8"/>
<title>Transcript ${esc(channel.name)}</title>
<style>
body{background:#0f172a;color:#e2e8f0;font-family:system-ui,sans-serif;max-width:900px;margin:24px auto;padding:0 16px}
h1{color:#a78bfa}
.msg{display:flex;gap:12px;padding:10px;border-bottom:1px solid #1e293b}
.av{width:40px;height:40px;border-radius:50%}
.head{font-size:14px;color:#cbd5e1}
.ts{color:#64748b;font-size:12px;margin-left:8px}
.body{white-space:pre-wrap;margin-top:4px}
.att{margin-top:4px;font-size:12px}
a{color:#7dd3fc}
</style></head><body>
<h1>🎫 #${esc(channel.name)}</h1>
<p>${collected.length} mensagens • gerado em ${new Date().toLocaleString("pt-BR")}</p>
${rows}
</body></html>`;

  const buf = Buffer.from(html, "utf-8");
  return new AttachmentBuilder(buf, { name: `transcript-${channel.name}.html` });
}

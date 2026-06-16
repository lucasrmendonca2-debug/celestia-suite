import { EmbedBuilder, type Message, type PartialMessage } from "discord.js";
import { postLog } from "./logger.service.js";

type LoggableMessage = Message<true> | PartialMessage;

function cleanContent(content?: string | null) {
  const text = content?.trim();
  if (!text) return "_Sem conteúdo textual._";
  return text.length > 900 ? `${text.slice(0, 897)}...` : text;
}

export async function logMessageDelete(message: LoggableMessage): Promise<void> {
  if (!message.guild) return;
  const embed = new EmbedBuilder()
    .setTitle("🗑️ Mensagem deletada")
    .setDescription([
      `**Autor:** ${message.author ? `<@${message.author.id}> (\`${message.author.tag}\`)` : "—"}`,
      `**Canal:** <#${message.channelId}>`,
      "",
      cleanContent(message.content),
    ].join("\n"));

  await postLog({
    guild: message.guild,
    category: "message",
    event: "messageDelete",
    toggleKey: "message_delete",
    target: { id: message.author?.id, tag: message.author?.tag },
    channelId: message.channelId,
    metadata: { messageId: message.id, content: message.content ?? null },
    embed,
  });
}

export async function logMessageEdit(oldMsg: LoggableMessage, newMsg: LoggableMessage): Promise<void> {
  if (!newMsg.guild) return;
  const embed = new EmbedBuilder()
    .setTitle("✏️ Mensagem editada")
    .setDescription([
      `**Autor:** ${newMsg.author ? `<@${newMsg.author.id}> (\`${newMsg.author.tag}\`)` : "—"}`,
      `**Canal:** <#${newMsg.channelId}>`,
      "",
      `**Antes:** ${cleanContent(oldMsg.content)}`,
      `**Depois:** ${cleanContent(newMsg.content)}`,
    ].join("\n"));

  await postLog({
    guild: newMsg.guild,
    category: "message",
    event: "messageUpdate",
    toggleKey: "message_edit",
    target: { id: newMsg.author?.id, tag: newMsg.author?.tag },
    channelId: newMsg.channelId,
    before: { content: oldMsg.content ?? null },
    after: { content: newMsg.content ?? null },
    metadata: { messageId: newMsg.id },
    embed,
  });
}

export const logMessage = logMessageDelete;
export default { logMessage, logMessageDelete, logMessageEdit };

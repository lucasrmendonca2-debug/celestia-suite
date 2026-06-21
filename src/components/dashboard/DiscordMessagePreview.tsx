/**
 * Pré-visualização estilo Discord (avatar do bot, nome, badge, timestamp,
 * conteúdo + embed opcional com barra colorida lateral).
 */
import { Bot } from "lucide-react";

interface Props {
  guildId?: string;
  content?: string;
  embed?: boolean;
  embedColor?: string;
  botName?: string;
  botAvatarUrl?: string | null;
  className?: string;
}

function nowLabel() {
  const d = new Date();
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `Hoje às ${hh}:${mm}`;
}

export function DiscordMessagePreview({
  content,
  embed,
  embedColor,
  botName = "Zenox",
  botAvatarUrl = null,
  className = "",
}: Props) {
  const name = botName;
  const avatar = botAvatarUrl;

  return (
    <div
      className={`rounded-xl border border-border bg-[#313338] p-4 text-[#dbdee1] ${className}`}
    >
      <div className="flex gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="size-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/90">
            <Bot className="size-5 text-white" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-white">{name}</span>
            <span className="inline-flex items-center gap-1 rounded-sm bg-indigo-500 px-1.5 py-[1px] text-[10px] font-bold uppercase leading-none text-white">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                <path d="M7.4 11.17L4.22 8l-1.05 1.05L7.4 13.3l8.4-8.42-1.06-1.05z" />
              </svg>
              APP
            </span>
            <span className="text-xs text-[#949ba4]">{nowLabel()}</span>
          </div>

          {embed ? (
            <div className="mt-1 flex max-w-[440px] overflow-hidden rounded-md bg-[#2b2d31]">
              <div
                className="w-1 shrink-0"
                style={{ background: embedColor || "#5865F2" }}
              />
              <div className="whitespace-pre-wrap break-words p-3 text-sm leading-relaxed">
                {content || (
                  <span className="italic text-[#949ba4]">Sem conteúdo</span>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed">
              {content || (
                <span className="italic text-[#949ba4]">Sem conteúdo</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

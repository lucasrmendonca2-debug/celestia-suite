import { createFileRoute, redirect } from "@tanstack/react-router";

// Mapa de URLs antigas (inglês) → novas (português)
const SEGMENT_MAP: Record<string, string> = {
  "": "",
  moderation: "moderacao",
  autorole: "cargo-automatico",
  welcome: "boas-vindas",
  leveling: "niveis",
  economy: "economia",
  community: "comunidade",
  seasons: "temporadas",
  achievements: "conquistas",
  "reaction-roles": "cargos-reacao",
  commands: "comandos-bot",
};

export const Route = createFileRoute("/_authenticated/dashboard/$guildId/$")({
  beforeLoad: ({ params }) => {
    const splat = (params as { _splat?: string })._splat ?? "";
    const [first = "", ...rest] = splat.split("/").filter(Boolean);
    const mapped = SEGMENT_MAP[first] ?? first;
    const tail = [mapped, ...rest].filter(Boolean).join("/");
    const target = tail ? `/g/${params.guildId}/${tail}` : `/g/${params.guildId}`;
    throw redirect({ to: target });
  },
});

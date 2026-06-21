import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Sparkles, MessageSquareHeart, Palette, Hash, Eye, Plus } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  getGuildConfig,
  updateWelcomeConfig,
  type WelcomeConfig,
} from "@/lib/guild/guild.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { ChannelSelect } from "@/components/dashboard/selectors/ChannelSelect";
import { SaveBar } from "@/components/dashboard/SaveBar";
import {
  AuroraSection,
  AuroraSwitchRow,
  AuroraField,
} from "@/components/dashboard/aurora-ui";
import { Mascot } from "@/components/Mascot";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { resolveGuildIdFromSlug } from "@/lib/guild/slug";

export const Route = createFileRoute("/_authenticated/dashboard/$slug/boas-vindas")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    const guildId = resolveGuildIdFromSlug(params.slug, guilds);
    if (!guildId) throw notFound();
    const guild = guilds.find((g) => g.id === guildId);
    if (!guild) throw notFound();
    const config = await context.queryClient.ensureQueryData({
      queryKey: ["guild-config", guildId],
      queryFn: () => getGuildConfig({ data: { guildId: guildId } }),
    });
    return { guildId, user, guild, config };
  },
  component: WelcomePage,
  notFoundComponent: () => (
    <div className="flex min-h-dvh items-center justify-center bg-background text-center">
      <p className="text-muted-foreground">Servidor não encontrado.</p>
    </div>
  ),
});

const VARIABLES = [
  { token: "{user}", label: "Menção", example: "@VocêMesmo" },
  { token: "{server}", label: "Nome do servidor", example: "" },
  { token: "{count}", label: "Nº de membros", example: "1.337" },
] as const;

function renderPreview(message: string, guildName: string) {
  return message
    .replaceAll("{user}", "@VocêMesmo")
    .replaceAll("{server}", guildName)
    .replaceAll("{count}", "1.337");
}

function WelcomePage() {
  const { user, guild, config } = Route.useLoaderData();
  const updateFn = useServerFn(updateWelcomeConfig);

  const [form, setForm] = useState<WelcomeConfig>(config);
  const [baseline, setBaseline] = useState<WelcomeConfig>(config);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(baseline),
    [form, baseline],
  );

  const insertVariable = (token: string) => {
    const el = textareaRef.current;
    const current = form.welcome_message ?? "";
    if (!el) {
      setForm({ ...form, welcome_message: current + token });
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = current.slice(0, start) + token + current.slice(end);
    setForm({ ...form, welcome_message: next });
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const mutation = useMutation({
    mutationFn: (next: WelcomeConfig) =>
      updateFn({
        data: {
          guildId: guild.id,
          welcome_enabled: next.welcome_enabled,
          welcome_channel_id: next.welcome_channel_id,
          welcome_message: next.welcome_message,
          welcome_embed_enabled: next.welcome_embed_enabled,
          welcome_embed_color: next.welcome_embed_color,
        },
      }),
    onSuccess: (saved) => {
      setForm(saved);
      setBaseline(saved);
      toast.success("Configurações salvas. O bot já está usando! ✨");
    },
    onError: (err) => toast.error((err as Error).message ?? "Falha ao salvar."),
  });

  return (
    <ModuleLayout
      guildId={guild.id}
      user={user}
      icon={Sparkles}
      title="Boas-vindas"
      description="Receba novos membros com estilo. Mensagens automáticas, embed colorido e variáveis dinâmicas."
    >
      {/* Hero banner com mascote */}
      <div className="aurora-panel relative mb-6 flex items-center gap-4 overflow-hidden p-5">
        <div className="aurora-float">
          <Mascot variant="celebrate" size={84} glow />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold tracking-tight">
            Cause uma boa primeira impressão 💜
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada novo membro recebe uma mensagem personalizada. Use variáveis para
            deixar tudo único.
          </p>
        </div>
        <div
          className="hidden sm:flex items-center gap-2 rounded-full border border-[color:color-mix(in_oklab,var(--aurora-mint)_50%,var(--border))] bg-[color:color-mix(in_oklab,var(--aurora-mint)_15%,var(--card))] px-3 py-1.5 text-xs font-medium"
        >
          <span className="aurora-glow-dot size-2 rounded-full" />
          {form.welcome_enabled ? "Ativo agora" : "Desligado"}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (dirty) mutation.mutate(form);
        }}
        className="space-y-5"
      >
        <AuroraSection
          title="Status do módulo"
          icon={Sparkles}
          tone="lavender"
        >
          <AuroraSwitchRow
            label="Ativar boas-vindas"
            hint="Quando desligado, o bot ignora novos membros."
            checked={form.welcome_enabled}
            onChange={(v) => setForm({ ...form, welcome_enabled: v })}
          />
        </AuroraSection>

        <AuroraSection title="Canal" icon={Hash} tone="cyan">
          <AuroraField
            label="Canal de boas-vindas"
            hint="Lista carregada direto do Discord via bot."
          >
            <ChannelSelect
              guildId={guild.id}
              value={form.welcome_channel_id}
              onChange={(id) => setForm({ ...form, welcome_channel_id: id })}
            />
          </AuroraField>
        </AuroraSection>

        <AuroraSection title="Mensagem" icon={MessageSquareHeart} tone="pink">
          <AuroraField
            label="Texto enviado"
            htmlFor="msg"
            hint="Variáveis disponíveis: {user}, {server}, {count}"
          >
            <Textarea
              id="msg"
              rows={4}
              value={form.welcome_message}
              onChange={(e) =>
                setForm({ ...form, welcome_message: e.target.value })
              }
              className="font-mono text-sm"
            />
          </AuroraField>

          {/* Live preview */}
          <div
            className="rounded-xl border border-[color:color-mix(in_oklab,var(--aurora-pink)_30%,var(--border))] bg-[color:color-mix(in_oklab,var(--aurora-pink)_6%,var(--card))] p-4"
          >
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Eye className="size-3" /> Pré-visualização
            </div>
            {form.welcome_embed_enabled ? (
              <div className="flex gap-3">
                <div
                  className="w-1 shrink-0 rounded-full"
                  style={{ background: form.welcome_embed_color }}
                />
                <div className="text-sm leading-relaxed">
                  {renderPreview(form.welcome_message, guild.name)}
                </div>
              </div>
            ) : (
              <div className="text-sm leading-relaxed">
                {renderPreview(form.welcome_message, guild.name)}
              </div>
            )}
          </div>
        </AuroraSection>

        <AuroraSection title="Estilo do embed" icon={Palette} tone="peach">
          <AuroraSwitchRow
            label="Enviar como embed"
            hint="Mensagem com barra colorida lateral em vez de texto puro."
            checked={form.welcome_embed_enabled}
            onChange={(v) => setForm({ ...form, welcome_embed_enabled: v })}
          />

          <AuroraField label="Cor do embed" htmlFor="color">
            <div className="flex items-center gap-3">
              <input
                id="color"
                type="color"
                value={form.welcome_embed_color}
                onChange={(e) =>
                  setForm({ ...form, welcome_embed_color: e.target.value })
                }
                className="size-11 cursor-pointer rounded-xl border border-border bg-background"
              />
              <Input
                value={form.welcome_embed_color}
                onChange={(e) =>
                  setForm({ ...form, welcome_embed_color: e.target.value })
                }
                className="max-w-[160px] font-mono"
              />
              <div
                className="hidden h-11 flex-1 rounded-xl sm:block"
                style={{
                  background: `linear-gradient(135deg, ${form.welcome_embed_color}, color-mix(in oklab, ${form.welcome_embed_color} 50%, white))`,
                }}
              />
            </div>
          </AuroraField>
        </AuroraSection>

        <p className="px-1 text-xs text-muted-foreground">
          Última atualização:{" "}
          {new Date(form.updated_at).toLocaleString("pt-BR")} · O bot lê estas
          configurações em tempo real, sem reiniciar.
        </p>
      </form>

      <SaveBar
        dirty={dirty}
        isPending={mutation.isPending}
        isSuccess={mutation.isSuccess}
        errorMessage={mutation.isError ? (mutation.error as Error).message : null}
        onSave={() => mutation.mutate(form)}
        onReset={() => setForm(baseline)}
      />
    </ModuleLayout>
  );
}

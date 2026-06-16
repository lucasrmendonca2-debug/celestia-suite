import { useRef, useState } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ticket, Save, AlertCircle, Send, Pencil, Trash2, Inbox, Activity, Power, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  getTicketConfig,
  getTicketStats,
  sendTicketPanel,
  updateTicketConfig,
  deleteTicketPanel,
} from "@/lib/guild/tickets.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CategoriesTab } from "@/components/dashboard/tickets/CategoriesTab";
import { LevelsTab } from "@/components/dashboard/tickets/LevelsTab";
import { PermissionsTab } from "@/components/dashboard/tickets/PermissionsTab";
import { ActiveTicketsCard } from "@/components/dashboard/tickets/ActiveTicketsCard";
import { WebhookCard } from "@/components/dashboard/tickets/WebhookCard";
import { GuildEmojiPicker } from "@/components/dashboard/tickets/GuildEmojiPicker";

export const Route = createFileRoute("/_authenticated/dashboard/$guildId/tickets")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    if (!guilds.find((g) => g.id === params.guildId)) throw notFound();
    const [config, stats] = await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["ticket-config", params.guildId],
        queryFn: () => getTicketConfig({ data: { guildId: params.guildId } }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["ticket-stats", params.guildId],
        queryFn: () => getTicketStats({ data: { guildId: params.guildId } }),
      }),
    ]);
    return { user, config, stats };
  },
  errorComponent: ({ error }) => (
    <div className="p-8">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="size-4" /> {error.message}
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-muted-foreground">Servidor não encontrado.</div>
  ),
  component: TicketsPage,
});

const TABS = [
  { value: "general", label: "Geral" },
  { value: "panel", label: "Painel" },
  { value: "categories", label: "Categorias" },
  { value: "permissions", label: "Permissões" },
  { value: "levels", label: "Níveis" },
  { value: "messages", label: "Mensagens" },
  { value: "logs", label: "Logs" },
  { value: "history", label: "Histórico" },
  { value: "ratings", label: "Avaliações" },
  { value: "appearance", label: "Aparência" },
] as const;

function TicketsPage() {
  const { user, config, stats } = Route.useLoaderData();
  const { guildId } = Route.useParams();

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={Ticket}
      title="Sistema de Tickets"
      description="Painel único, dinâmico e configurável. O bot lê tudo daqui em tempo real."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Tickets abertos agora"
          value={stats.open}
          icon={Inbox}
          accent="from-violet-500/20 to-fuchsia-500/10 text-violet-300"
        />
        <StatCard
          label="Total já criados"
          value={stats.total}
          icon={Activity}
          accent="from-sky-500/20 to-cyan-500/10 text-sky-300"
        />
        <StatCard
          label="Status do sistema"
          value={config.enabled ? "Ativo" : "Desativado"}
          icon={Power}
          accent={
            config.enabled
              ? "from-emerald-500/25 to-emerald-500/5 text-emerald-300"
              : "from-rose-500/20 to-rose-500/5 text-rose-300"
          }
          badge={config.enabled ? "online" : "offline"}
        />
      </div>

      <SetupChecklist config={config} />

      <Tabs defaultValue="general" className="mt-6">
        <div className="-mx-1 overflow-x-auto pb-1">
          <TabsList className="inline-flex h-auto flex-nowrap justify-start gap-1 bg-card/40 p-1">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="general" className="mt-6">
          <GeneralTab guildId={guildId} initial={config} />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoriesTab guildId={guildId} />
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <PermissionsTab guildId={guildId} />
        </TabsContent>

        <TabsContent value="levels" className="mt-6">
          <LevelsTab guildId={guildId} />
        </TabsContent>

        {TABS.filter(
          (t) => !["general", "categories", "permissions", "levels"].includes(t.value),
        ).map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-6">
            <SoonCard title={t.label} />
          </TabsContent>
        ))}
      </Tabs>
    </ModuleLayout>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  badge,
}: {
  label: string;
  value: number | string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: string;
  badge?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card/50 p-4 backdrop-blur">
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70 ${accent ?? "from-transparent to-transparent"}`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          {badge && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              <span className="size-1.5 rounded-full bg-current" /> {badge}
            </span>
          )}
        </div>
        {Icon && (
          <div className="rounded-lg border border-border bg-background/40 p-2">
            <Icon className="size-4" />
          </div>
        )}
      </div>
    </div>
  );
}

function SetupChecklist({
  config,
}: {
  config: { enabled: boolean; panel_channel_id: string | null; category_id: string | null; default_support_role_id: string | null; log_channel_id: string | null; panel_message_id: string | null };
}) {
  const steps = [
    { ok: config.enabled, label: "Sistema ativado" },
    { ok: !!config.panel_channel_id, label: "Canal do painel definido" },
    { ok: !!config.category_id, label: "Categoria do Discord definida" },
    { ok: !!config.default_support_role_id, label: "Cargo de suporte definido" },
    { ok: !!config.log_channel_id, label: "Canal de logs definido" },
    { ok: !!config.panel_message_id, label: "Painel publicado" },
  ];
  const done = steps.filter((s) => s.ok).length;
  const pct = Math.round((done / steps.length) * 100);
  return (
    <div className="mt-3 rounded-xl border border-border bg-card/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Checklist de configuração</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {done}/{steps.length} concluídos
        </span>
      </div>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-background/60">
        <div
          className="h-full bg-gradient-to-r from-primary to-fuchsia-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="grid gap-1 sm:grid-cols-2">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-xs">
            {s.ok ? (
              <CheckCircle2 className="size-3.5 text-emerald-400" />
            ) : (
              <Circle className="size-3.5 text-muted-foreground" />
            )}
            <span className={s.ok ? "text-foreground" : "text-muted-foreground"}>
              {s.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SoonCard({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/30 p-10 text-center">
      <p className="text-sm font-medium">{title} chega na próxima fase ✨</p>
      <p className="mt-2 text-xs text-muted-foreground">
        A Fase 1 entrega Geral, painel único e abrir/fechar. Próximas fases adicionam categorias, permissões dinâmicas, transcript, histórico e avaliações.
      </p>
    </div>
  );
}

/* ---------------- General tab ---------------- */

function GeneralTab({
  guildId,
  initial,
}: {
  guildId: string;
  initial: Awaited<ReturnType<typeof getTicketConfig>>;
}) {
  const update = useServerFn(updateTicketConfig);
  const qc = useQueryClient();
  const [form, setForm] = useState(initial);

  const mutation = useMutation({
    mutationFn: () =>
      update({
        data: {
          guildId,
          enabled: form.enabled,
          panel_channel_id: emptyToNull(form.panel_channel_id),
          category_id: emptyToNull(form.category_id),
          default_support_role_id: emptyToNull(form.default_support_role_id),
          log_channel_id: emptyToNull(form.log_channel_id),
          max_open_tickets_per_user: Number(form.max_open_tickets_per_user) || 1,
          panel_title: form.panel_title,
          panel_description: form.panel_description,
          panel_button_label: form.panel_button_label,
          panel_button_emoji: form.panel_button_emoji,
          panel_image_url: emptyToNull(form.panel_image_url),
          panel_thumbnail_url: emptyToNull(form.panel_thumbnail_url),
          panel_use_guild_banner: form.panel_use_guild_banner ?? false,
          ticket_welcome_message: form.ticket_welcome_message,
          close_message: form.close_message,
          transcript_enabled: form.transcript_enabled,
          rating_enabled: form.rating_enabled,
          allow_user_close_ticket: form.allow_user_close_ticket,
        },
      }),
    onSuccess: () => {
      toast.success("Prontinho! As configurações de tickets foram atualizadas.");
      qc.invalidateQueries({ queryKey: ["ticket-config", guildId] });
      qc.invalidateQueries({ queryKey: ["ticket-stats", guildId] });
    },
    onError: (e) =>
      toast.error("Ops, não consegui salvar.", {
        description: (e as Error).message,
      }),
  });

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <SectionCard
        title="Ativação"
        description="Liga ou desliga todo o sistema de tickets neste servidor."
      >
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/40 p-4">
          <div>
            <Label className="text-sm font-medium">Sistema ativo</Label>
            <p className="text-xs text-muted-foreground">
              Quando desligado, o painel não cria tickets e os comandos são bloqueados.
            </p>
          </div>
          <Switch
            checked={form.enabled}
            onCheckedChange={(v) => setForm({ ...form, enabled: v })}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Canais e cargo"
        description="Cole os IDs do Discord (Configurações → Avançado → Modo Desenvolvedor → clique-direito → Copiar ID)."
      >
        <Field
          label="Canal do painel"
          hint="Onde o painel único será publicado quando você rodar /ticket painel."
          value={form.panel_channel_id ?? ""}
          onChange={(v) => setForm({ ...form, panel_channel_id: v })}
          placeholder="ex: 1234567890123456789"
        />
        <Field
          label="Categoria do Discord para tickets"
          hint="Categoria onde os canais de ticket serão criados."
          value={form.category_id ?? ""}
          onChange={(v) => setForm({ ...form, category_id: v })}
          placeholder="ID da categoria"
        />
        <Field
          label="Cargo de suporte padrão"
          hint="Esse cargo vê e responde todos os tickets."
          value={form.default_support_role_id ?? ""}
          onChange={(v) => setForm({ ...form, default_support_role_id: v })}
          placeholder="ID do cargo"
        />
        <Field
          label="Canal de logs"
          hint="Onde vai receber abertura, fechamento e outras ações."
          value={form.log_channel_id ?? ""}
          onChange={(v) => setForm({ ...form, log_channel_id: v })}
          placeholder="ID do canal"
        />
      </SectionCard>

      <SectionCard title="Limites e comportamento">
        <div>
          <Label className="text-sm">Tickets abertos por usuário (limite)</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={form.max_open_tickets_per_user}
            onChange={(e) =>
              setForm({
                ...form,
                max_open_tickets_per_user: Number(e.target.value) || 1,
              })
            }
            className="mt-1 max-w-[120px]"
          />
        </div>
        <SwitchRow
          title="Usuário pode fechar o próprio ticket"
          desc="Se desligado, só staff/admins fecham."
          checked={form.allow_user_close_ticket}
          onChange={(v) => setForm({ ...form, allow_user_close_ticket: v })}
        />
        <SwitchRow
          title="Gerar transcript ao fechar"
          desc="Próxima fase: anexa o transcript no canal de logs."
          checked={form.transcript_enabled}
          onChange={(v) => setForm({ ...form, transcript_enabled: v })}
        />
        <SwitchRow
          title="Pedir avaliação de atendimento"
          desc="Próxima fase: o usuário avalia o atendimento de 1 a 5 estrelas."
          checked={form.rating_enabled}
          onChange={(v) => setForm({ ...form, rating_enabled: v })}
        />
      </SectionCard>

      <SectionCard
        title="Painel e mensagens"
        description="Variáveis: {user} = quem abriu, {staff} = quem fechou, {server} = nome do servidor."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm">Título do painel</Label>
            <Input
              value={form.panel_title}
              onChange={(e) => setForm({ ...form, panel_title: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Texto do botão</Label>
            <div className="mt-1 flex gap-2">
              <Input
                value={form.panel_button_emoji}
                onChange={(e) => setForm({ ...form, panel_button_emoji: e.target.value })}
                className="w-24"
                placeholder="🎫"
              />
              <GuildEmojiPicker
                guildId={guildId}
                asMention
                onPick={(v) => setForm({ ...form, panel_button_emoji: v })}
              />
              <Input
                value={form.panel_button_label}
                onChange={(e) => setForm({ ...form, panel_button_label: e.target.value })}
                placeholder="Abrir ticket"
              />
            </div>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Descrição do painel</Label>
            <PresetMenu
              presets={PANEL_DESC_PRESETS}
              onPick={(v) => setForm({ ...form, panel_description: v })}
            />
          </div>
          <Textarea
            value={form.panel_description}
            onChange={(e) => setForm({ ...form, panel_description: e.target.value })}
            rows={3}
            className="mt-1"
            placeholder={PANEL_DESC_PRESETS[0].text}
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Mensagem de boas-vindas dentro do ticket</Label>
            <PresetMenu
              presets={WELCOME_PRESETS}
              onPick={(v) => setForm({ ...form, ticket_welcome_message: v })}
            />
          </div>
          <Textarea
            value={form.ticket_welcome_message}
            onChange={(e) => setForm({ ...form, ticket_welcome_message: e.target.value })}
            rows={3}
            className="mt-1"
            placeholder={WELCOME_PRESETS[0].text}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Use <code>{"{user}"}</code> pra mencionar quem abriu e <code>{"{staff}"}</code> pro cargo de suporte.
          </p>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Mensagem ao fechar o ticket</Label>
            <PresetMenu
              presets={CLOSE_PRESETS}
              onPick={(v) => setForm({ ...form, close_message: v })}
            />
          </div>
          <Textarea
            value={form.close_message}
            onChange={(e) => setForm({ ...form, close_message: e.target.value })}
            rows={2}
            className="mt-1"
            placeholder={CLOSE_PRESETS[0].text}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-sm">Imagem grande (URL)</Label>
            <Input
              value={form.panel_image_url ?? ""}
              onChange={(e) => setForm({ ...form, panel_image_url: e.target.value })}
              placeholder="https://…/banner.png"
              className="mt-1 text-xs"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Aparece embaixo do embed. Deixe vazio pra não usar.
            </p>
          </div>
          <div>
            <Label className="text-sm">Thumbnail (URL)</Label>
            <Input
              value={form.panel_thumbnail_url ?? ""}
              onChange={(e) =>
                setForm({ ...form, panel_thumbnail_url: e.target.value })
              }
              placeholder="https://…/icon.png"
              className="mt-1 text-xs"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Imagem pequena no canto superior direito do embed.
            </p>
          </div>
        </div>
        <SwitchRow
          title="Usar banner do servidor automaticamente"
          desc="Se a URL acima estiver vazia, o painel usa o banner (ou ícone) do servidor."
          checked={form.panel_use_guild_banner ?? false}
          onChange={(v) => setForm({ ...form, panel_use_guild_banner: v })}
        />
      </SectionCard>

      <ActiveTicketsCard guildId={guildId} />
      <WebhookCard guildId={guildId} cfg={form} />

      <div className="sticky bottom-4 z-10 rounded-xl border border-border bg-card/80 p-3 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            💡 Salve antes de <strong>enviar</strong> ou <strong>editar</strong> o painel.
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <DeletePanelButton guildId={guildId} disabled={mutation.isPending} hasPanel={!!form.panel_message_id} />
            <SendPanelButton guildId={guildId} disabled={mutation.isPending} mode="edit" hasPanel={!!form.panel_message_id} />
            <SendPanelButton guildId={guildId} disabled={mutation.isPending} mode="send" />
            <Button
              type="submit"
              size="lg"
              disabled={mutation.isPending}
              className="gap-2 shadow-lg"
            >
              <Save className="size-4" />
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </div>

    </form>
  );
}

function SendPanelButton({
  guildId,
  disabled,
  mode,
  hasPanel,
}: {
  guildId: string;
  disabled?: boolean;
  mode: "send" | "edit";
  hasPanel?: boolean;
}) {
  const send = useServerFn(sendTicketPanel);
  const mutation = useMutation({
    mutationFn: () => send({ data: { guildId, mode } }),
    onSuccess: () =>
      toast.success(mode === "edit" ? "Painel atualizado!" : "Painel publicado!"),
    onError: (e) =>
      toast.error(
        mode === "edit" ? "Não consegui editar." : "Não consegui enviar.",
        { description: (e as Error).message },
      ),
  });
  if (mode === "edit" && !hasPanel) return null;
  return (
    <Button
      type="button"
      size="lg"
      variant="secondary"
      disabled={disabled || mutation.isPending}
      onClick={() => mutation.mutate()}
      className="gap-2"
    >
      {mode === "edit" ? <Pencil className="size-4" /> : <Send className="size-4" />}
      {mutation.isPending
        ? mode === "edit"
          ? "Editando…"
          : "Enviando…"
        : mode === "edit"
          ? "Editar painel"
          : "Enviar painel"}
    </Button>
  );
}

function DeletePanelButton({
  guildId,
  disabled,
  hasPanel,
}: {
  guildId: string;
  disabled?: boolean;
  hasPanel: boolean;
}) {
  const del = useServerFn(deleteTicketPanel);
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => del({ data: { guildId } }),
    onSuccess: () => {
      toast.success("Painel apagado.");
      qc.invalidateQueries({ queryKey: ["ticket-config", guildId] });
    },
    onError: (e) =>
      toast.error("Não consegui apagar.", { description: (e as Error).message }),
  });
  if (!hasPanel) return null;
  return (
    <Button
      type="button"
      size="lg"
      variant="ghost"
      disabled={disabled || mutation.isPending}
      onClick={() => {
        if (confirm("Apagar a mensagem do painel publicado?")) mutation.mutate();
      }}
      className="gap-2 text-destructive hover:text-destructive"
    >
      <Trash2 className="size-4" />
      {mutation.isPending ? "Apagando…" : "Apagar painel"}
    </Button>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 font-mono text-xs"
      />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SwitchRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/40 p-4">
      <div>
        <Label className="text-sm font-medium">{title}</Label>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function emptyToNull(v: string | null | undefined) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

type Preset = { label: string; text: string };

const PANEL_DESC_PRESETS: Preset[] = [
  {
    label: "Padrão amigável",
    text: "Precisa de ajuda? Selecione no menu abaixo o tipo de atendimento e nossa equipe te responde aqui em instantes.",
  },
  {
    label: "Formal",
    text: "Bem-vindo(a) à nossa Central de Atendimento. Selecione abaixo a categoria que melhor descreve sua solicitação e aguarde — um membro da equipe irá atendê-lo(a) em breve.",
  },
  {
    label: "Comunidade / gaming",
    text: "Algo travou, bugou ou você só quer dar um alô? 🎮 Escolhe no menu o tipo de ticket e a staff já chega pra resolver contigo!",
  },
  {
    label: "Suporte rápido",
    text: "🎫 Abra um ticket pelo menu abaixo. Tente já incluir prints e detalhes — assim a gente resolve mais rápido.",
  },
];

const WELCOME_PRESETS: Preset[] = [
  {
    label: "Padrão amigável",
    text: "Olá {user}! 👋 Obrigado por abrir um ticket.\n\nDescreva com calma o que aconteceu, mande prints se ajudar, e a equipe {staff} responde em instantes. ⏳",
  },
  {
    label: "Formal",
    text: "Olá {user}. Seu ticket foi registrado com sucesso.\n\nPor favor, descreva detalhadamente sua solicitação. A equipe {staff} responderá assim que possível.",
  },
  {
    label: "Comunidade / gaming",
    text: "Eaí {user}! 🎮 Bem-vindo(a) ao seu ticket.\n\nConta o que tá rolando, manda print se precisar, e a staff {staff} vai te ajudar rapidinho. 💜",
  },
  {
    label: "Denúncia",
    text: "Olá {user}. 🚨 Descreva o ocorrido, marque o usuário envolvido e envie prints/links como prova.\n\nTudo é confidencial e a equipe {staff} vai analisar com cuidado.",
  },
];

const CLOSE_PRESETS: Preset[] = [
  {
    label: "Padrão",
    text: "Este ticket foi fechado por {staff}. Avalie nosso atendimento ou peça reabertura caso ainda precise de ajuda. 💜",
  },
  {
    label: "Formal",
    text: "Ticket encerrado por {staff}. Caso a sua dúvida não tenha sido totalmente resolvida, solicite a reabertura.",
  },
  {
    label: "Curto",
    text: "Ticket fechado por {staff}. Valeu! ✅",
  },
];

function PresetMenu({
  presets,
  onPick,
}: {
  presets: Preset[];
  onPick: (text: string) => void;
}) {
  return (
    <select
      value=""
      onChange={(e) => {
        const p = presets.find((p) => p.label === e.target.value);
        if (p) onPick(p.text);
        e.currentTarget.value = "";
      }}
      className="h-7 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground hover:text-foreground"
      title="Usar um modelo"
    >
      <option value="">Usar modelo…</option>
      {presets.map((p) => (
        <option key={p.label} value={p.label}>
          {p.label}
        </option>
      ))}
    </select>
  );
}


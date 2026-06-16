import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Sparkles } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  getGuildConfig,
  updateWelcomeConfig,
  type WelcomeConfig,
} from "@/lib/guild/guild.functions";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { ChannelSelect } from "@/components/dashboard/selectors/ChannelSelect";
import { SaveBar } from "@/components/dashboard/SaveBar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";


export const Route = createFileRoute("/_authenticated/dashboard/$guildId/welcome")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    const guild = guilds.find((g) => g.id === params.guildId);
    if (!guild) throw notFound();
    const config = await context.queryClient.ensureQueryData({
      queryKey: ["guild-config", params.guildId],
      queryFn: () => getGuildConfig({ data: { guildId: params.guildId } }),
    });
    return { user, guild, config };
  },
  component: WelcomePage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background text-center">
      <p className="text-muted-foreground">Servidor não encontrado.</p>
    </div>
  ),
});

function WelcomePage() {
  const { user, guild, config } = Route.useLoaderData();
  const updateFn = useServerFn(updateWelcomeConfig);

  const [form, setForm] = useState<WelcomeConfig>(config);
  const [baseline, setBaseline] = useState<WelcomeConfig>(config);
  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(baseline),
    [form, baseline],
  );

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
      toast.success("Configurações salvas. O bot já está usando.");
    },
    onError: (err) => toast.error((err as Error).message ?? "Falha ao salvar."),
  });

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar guildId={guild.id} />
      <div className="flex-1">
        <DashboardTopbar user={user} title={guild.name} subtitle="Módulo: Boas-vindas" guildId={guild.id} />

        <main className="mx-auto max-w-3xl px-6 py-8">
          <Link
            to="/dashboard/$guildId"
            params={{ guildId: guild.id }}
            className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Voltar pra visão geral
          </Link>

          <header className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Boas-vindas</h1>
              <p className="text-xs text-muted-foreground">
                Mensagem enviada quando alguém entra no servidor.
              </p>
            </div>
          </header>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (dirty) mutation.mutate(form);
            }}
            className="space-y-6 rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label className="text-sm font-medium">Ativar módulo</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Quando desligado, o bot ignora novos membros.
                </p>
              </div>
              <Switch
                checked={form.welcome_enabled}
                onCheckedChange={(v) => setForm({ ...form, welcome_enabled: v })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="channel" className="text-sm font-medium">
                Canal de boas-vindas
              </Label>
              <ChannelSelect
                guildId={guild.id}
                value={form.welcome_channel_id}
                onChange={(id) => setForm({ ...form, welcome_channel_id: id })}
              />
              <p className="text-xs text-muted-foreground">
                Lista carregada direto do Discord via bot.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="msg" className="text-sm font-medium">
                Mensagem
              </Label>
              <Textarea
                id="msg"
                rows={4}
                value={form.welcome_message}
                onChange={(e) => setForm({ ...form, welcome_message: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Variáveis: <code className="rounded bg-muted px-1">{"{user}"}</code>{" "}
                <code className="rounded bg-muted px-1">{"{server}"}</code>{" "}
                <code className="rounded bg-muted px-1">{"{count}"}</code>
              </p>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <Label className="text-sm font-medium">Enviar como embed</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Mensagem com barra colorida lateral em vez de texto puro.
                </p>
              </div>
              <Switch
                checked={form.welcome_embed_enabled}
                onCheckedChange={(v) => setForm({ ...form, welcome_embed_enabled: v })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="color" className="text-sm font-medium">
                Cor do embed
              </Label>
              <div className="flex items-center gap-3">
                <input
                  id="color"
                  type="color"
                  value={form.welcome_embed_color}
                  onChange={(e) =>
                    setForm({ ...form, welcome_embed_color: e.target.value })
                  }
                  className="size-10 cursor-pointer rounded-md border border-border bg-background"
                />
                <Input
                  value={form.welcome_embed_color}
                  onChange={(e) =>
                    setForm({ ...form, welcome_embed_color: e.target.value })
                  }
                  className="max-w-[140px] font-mono"
                />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <span className="text-xs text-muted-foreground">
                Última atualização:{" "}
                {new Date(form.updated_at).toLocaleString("pt-BR")}
              </span>
            </div>
          </form>

          <p className="mt-4 text-xs text-muted-foreground">
            O bot lê essas configurações do banco em tempo real. Sem reiniciar.
          </p>
        </main>

        <SaveBar
          dirty={dirty}
          isPending={mutation.isPending}
          isSuccess={mutation.isSuccess}
          errorMessage={mutation.isError ? (mutation.error as Error).message : null}
          onSave={() => mutation.mutate(form)}
          onReset={() => setForm(baseline)}
        />
      </div>
    </div>
  );
}

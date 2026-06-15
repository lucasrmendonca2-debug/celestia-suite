import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Coins, Plus, Save, Trash2 } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  getEconomyConfig,
  listShopItems,
  removeShopItem,
  updateEconomyConfig,
  upsertShopItem,
} from "@/lib/guild/modules.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/dashboard/$guildId/economy")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    if (!guilds.find((g) => g.id === params.guildId)) throw notFound();
    const config = await context.queryClient.ensureQueryData({
      queryKey: ["economy", params.guildId],
      queryFn: () => getEconomyConfig({ data: { guildId: params.guildId } }),
    });
    await context.queryClient.ensureQueryData({
      queryKey: ["shop", params.guildId],
      queryFn: () => listShopItems({ data: { guildId: params.guildId } }),
    });
    return { user, config };
  },
  component: EconomyPage,
});

function EconomyPage() {
  const { user, config } = Route.useLoaderData();
  const { guildId } = Route.useParams();
  const qc = useQueryClient();
  const updateFn = useServerFn(updateEconomyConfig);
  const upsertItem = useServerFn(upsertShopItem);
  const removeItem = useServerFn(removeShopItem);

  const [form, setForm] = useState<any>(config);
  const [item, setItem] = useState({
    name: "",
    description: "",
    price: 100,
    role_id: "",
  });

  const { data: shop } = useSuspenseQuery({
    queryKey: ["shop", guildId],
    queryFn: () => listShopItems({ data: { guildId } }),
  });

  const save = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          guildId,
          enabled: form.enabled,
          currency_name: form.currency_name,
          currency_emoji: form.currency_emoji,
          daily_amount: Number(form.daily_amount),
          work_min: Number(form.work_min),
          work_max: Number(form.work_max),
          work_cooldown_seconds: Number(form.work_cooldown_seconds),
        },
      }),
    onSuccess: (saved) => {
      setForm(saved);
      qc.setQueryData(["economy", guildId], saved);
      toast.success("Salvo.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const addItem = useMutation({
    mutationFn: () =>
      upsertItem({
        data: {
          guildId,
          name: item.name,
          description: item.description || null,
          price: Number(item.price),
          type: "role",
          role_id: item.role_id || null,
          enabled: true,
        },
      }),
    onSuccess: () => {
      setItem({ name: "", description: "", price: 100, role_id: "" });
      qc.invalidateQueries({ queryKey: ["shop", guildId] });
      toast.success("Item adicionado à loja.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => removeItem({ data: { guildId, id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shop", guildId] }),
  });

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={Coins}
      title="Economia"
      description="Moeda própria do servidor, daily, work e loja de cargos."
      actions={
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          <Save className="mr-1.5 size-4" />
          {save.isPending ? "Salvando…" : "Salvar"}
        </Button>
      }
    >
      <Tabs defaultValue="config">
        <TabsList>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="shop">Loja ({shop.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="mt-4 space-y-4">
          <Card>
            <div className="flex items-center justify-between gap-4">
              <Label>Ativar economia</Label>
              <Switch
                checked={form.enabled}
                onCheckedChange={(v) => setForm({ ...form, enabled: v })}
              />
            </div>
          </Card>
          <Card>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome da moeda">
                <Input
                  value={form.currency_name}
                  onChange={(e) => setForm({ ...form, currency_name: e.target.value })}
                />
              </Field>
              <Field label="Emoji da moeda">
                <Input
                  value={form.currency_emoji}
                  onChange={(e) => setForm({ ...form, currency_emoji: e.target.value })}
                />
              </Field>
            </div>
          </Card>
          <Card>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Valor do /daily">
                <Input
                  type="number"
                  value={form.daily_amount}
                  onChange={(e) => setForm({ ...form, daily_amount: e.target.value })}
                />
              </Field>
              <Field label="Cooldown /work (s)">
                <Input
                  type="number"
                  value={form.work_cooldown_seconds}
                  onChange={(e) =>
                    setForm({ ...form, work_cooldown_seconds: e.target.value })
                  }
                />
              </Field>
              <Field label="/work mínimo">
                <Input
                  type="number"
                  value={form.work_min}
                  onChange={(e) => setForm({ ...form, work_min: e.target.value })}
                />
              </Field>
              <Field label="/work máximo">
                <Input
                  type="number"
                  value={form.work_max}
                  onChange={(e) => setForm({ ...form, work_max: e.target.value })}
                />
              </Field>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="shop" className="mt-4 space-y-4">
          <Card>
            <h3 className="mb-3 text-sm font-semibold">Novo item</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome">
                <Input
                  value={item.name}
                  onChange={(e) => setItem({ ...item, name: e.target.value })}
                />
              </Field>
              <Field label="Preço">
                <Input
                  type="number"
                  value={item.price}
                  onChange={(e) => setItem({ ...item, price: Number(e.target.value) })}
                />
              </Field>
              <Field label="ID do cargo entregue">
                <Input
                  value={item.role_id}
                  onChange={(e) => setItem({ ...item, role_id: e.target.value.trim() })}
                />
              </Field>
              <Field label="Descrição">
                <Textarea
                  rows={2}
                  value={item.description}
                  onChange={(e) => setItem({ ...item, description: e.target.value })}
                />
              </Field>
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                onClick={() => addItem.mutate()}
                disabled={!item.name || !item.role_id || addItem.isPending}
              >
                <Plus className="mr-1.5 size-4" /> Adicionar
              </Button>
            </div>
          </Card>

          <div className="rounded-2xl border border-border bg-card">
            {shop.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Loja vazia.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {(shop as any[]).map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-4 px-5 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{s.name}</p>
                      {s.description && (
                        <p className="truncate text-xs text-muted-foreground">
                          {s.description}
                        </p>
                      )}
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        cargo: {s.role_id ?? "—"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      {form.currency_emoji} {s.price.toLocaleString("pt-BR")}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteItem.mutate(s.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </ModuleLayout>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-5">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

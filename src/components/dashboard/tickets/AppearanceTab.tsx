import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Palette, Save } from "lucide-react";
import {
  getTicketConfig,
  updateTicketAppearance,
} from "@/lib/guild/tickets.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Cfg = Awaited<ReturnType<typeof getTicketConfig>>;

const PRESETS: { label: string; hex: string }[] = [
  { label: "Roxo Zenox", hex: "#7c3aed" },
  { label: "Azul Discord", hex: "#5865f2" },
  { label: "Verde sucesso", hex: "#22c55e" },
  { label: "Vermelho prioridade", hex: "#ef4444" },
  { label: "Rosa", hex: "#ec4899" },
  { label: "Âmbar", hex: "#f59e0b" },
  { label: "Ciano", hex: "#06b6d4" },
  { label: "Cinza neutro", hex: "#475569" },
];

export function AppearanceTab({ guildId, cfg }: { guildId: string; cfg: Cfg }) {
  const update = useServerFn(updateTicketAppearance);
  const qc = useQueryClient();
  const [hex, setHex] = useState(`#${(cfg.panel_color ?? 0x7c3aed).toString(16).padStart(6, "0")}`);

  const mutation = useMutation({
    mutationFn: () => {
      const clean = hex.replace("#", "").trim();
      if (!/^[0-9a-fA-F]{6}$/.test(clean)) throw new Error("Hex inválido (ex: #7c3aed).");
      return update({
        data: { guildId, panel_color: parseInt(clean, 16) },
      });
    },
    onSuccess: () => {
      toast.success("Aparência salva! Reenvie o painel para aplicar.");
      qc.invalidateQueries({ queryKey: ["ticket-config", guildId] });
    },
    onError: (e) => toast.error("Não consegui salvar.", { description: (e as Error).message }),
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card/40 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Cor do painel</h3>
        </div>

        <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr]">
          <div
            className="aspect-[4/3] rounded-xl border border-border shadow-inner"
            style={{ background: `linear-gradient(135deg, ${hex}, ${hex}aa)` }}
          />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-md border border-border bg-background"
              />
              <Input
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                placeholder="#7c3aed"
                className="font-mono text-xs"
                maxLength={7}
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Presets</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => setHex(p.hex)}
                    title={p.label}
                    className={`size-7 rounded-full border-2 transition ${
                      hex.toLowerCase() === p.hex.toLowerCase()
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: p.hex }}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="gap-2"
            >
              <Save className="size-4" />
              {mutation.isPending ? "Salvando…" : "Salvar cor"}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card/40 p-5">
        <h3 className="mb-3 text-sm font-semibold">Pré-visualização do embed</h3>
        <div
          className="rounded-lg border-l-4 bg-[#2b2d31] p-4 text-sm"
          style={{ borderColor: hex }}
        >
          <p className="font-semibold text-white">{cfg.panel_title}</p>
          <p className="mt-1 whitespace-pre-wrap text-zinc-300">{cfg.panel_description}</p>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          A cor aparece como faixa lateral do embed publicado no Discord.
        </p>
      </div>
    </div>
  );
}

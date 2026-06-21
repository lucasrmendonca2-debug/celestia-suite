import { useEffect, useState } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Gift, Flame, Sparkles, TrendingUp, Lock, Loader2 } from "lucide-react";
import {
  getDailyStatus,
  claimDaily,
  type DailyStatusDTO,
  type DailyClaimDTO,
} from "@/lib/daily.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/daily")({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Resgatar diária — Zenox" },
      { name: "description", content: "Resgate sua recompensa diária do Zenox no site." },
      { property: "og:title", content: "Resgatar diária — Zenox" },
      {
        property: "og:description",
        content: "Receba moedas, mantenha o streak e ganhe bônus VIP/Premium.",
      },
    ],
  }),
  component: DailyPage,
});

type AnyStatus = DailyStatusDTO | { error: string; data?: any };

function isStatus(s: AnyStatus | null): s is DailyStatusDTO {
  return !!s && (s as any).ok === true;
}

function Countdown({ to }: { to: string }) {
  const [ms, setMs] = useState(() => new Date(to).getTime() - Date.now());
  useEffect(() => {
    const i = setInterval(() => setMs(new Date(to).getTime() - Date.now()), 1000);
    return () => clearInterval(i);
  }, [to]);
  if (ms <= 0) return <span>0s</span>;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return (
    <span className="font-mono tabular-nums">
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

function StreakDots({ current, projected }: { current: number; projected: number }) {
  const days = Array.from({ length: 7 }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/5 bg-black/30 p-4">
      {days.map((d) => {
        const isPast = d <= current;
        const isNext = d === projected && d > current;
        return (
          <div key={d} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition",
                isPast && "border-amber-400/60 bg-amber-400/20 text-amber-300",
                isNext && "border-amber-400 bg-amber-400 text-black shadow-lg shadow-amber-400/30 animate-pulse",
                !isPast && !isNext && "border-white/10 bg-white/5 text-muted-foreground",
              )}
            >
              {isPast ? "🔥" : d}
            </div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">D{d}</span>
          </div>
        );
      })}
    </div>
  );
}

function DailyPage() {
  const { token } = useSearch({ from: "/daily" }) as { token?: string };
  const fetchStatus = useServerFn(getDailyStatus);
  const fetchClaim = useServerFn(claimDaily);
  const [status, setStatus] = useState<AnyStatus | null>(null);
  const [claimed, setClaimed] = useState<DailyClaimDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchStatus({ data: { token } })
      .then((r) => {
        if (!cancelled) setStatus(r as AnyStatus);
      })
      .catch((e) =>
        {
          if (!cancelled) {
            setStatus({
              error: "site_request_failed",
              data: { message: e instanceof Error ? e.message : "Falha ao validar o link" },
            });
          }
        },
      )
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onClaim() {
    if (!token) return;
    setClaiming(true);
    const r = await fetchClaim({ data: { token } });
    setClaiming(false);
    if ((r as any).ok) {
      setClaimed(r as DailyClaimDTO);
    } else {
      // re-pull status to show countdown if already claimed elsewhere
      try {
        const s = await fetchStatus({ data: { token } });
        setStatus(s as AnyStatus);
      } catch (e) {
        setStatus({
          error: "site_request_failed",
          data: { message: e instanceof Error ? e.message : "Falha ao validar o link" },
        });
      }
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-[#0b0118] via-[#1a0530] to-[#0b0118]">
      {/* Aurora bg */}
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-amber-500/30 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-purple-500/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-pink-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 py-10">
        <Link to="/" className="absolute left-4 top-4 text-sm text-muted-foreground hover:text-foreground">
          ← Voltar
        </Link>

        <div className="w-full rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
              <Gift className="h-8 w-8 text-black" />
            </div>
            <h1 className="font-display text-3xl font-black text-white">Recompensa Diária</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Resgate seus Zen Coins e mantenha seu streak
            </p>
          </div>

          {/* Body states */}
          {!token && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
              <Lock className="mx-auto mb-2 h-8 w-8 text-red-400" />
              <p className="text-sm text-red-200">
                Link inválido. Use o comando <code className="rounded bg-black/40 px-1.5 py-0.5">/daily</code> no Discord para gerar um novo.
              </p>
            </div>
          )}

          {token && loading && (
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Validando seu link…</p>
            </div>
          )}

          {token && !loading && status && (status as any).error === "not_logged_in" && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6 text-center">
              <p className="mb-4 text-sm text-amber-100">
                Você precisa entrar com Discord para resgatar.
              </p>
              <a
                href={`/login?next=/daily?token=${encodeURIComponent(token)}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90"
              >
                Entrar com Discord
              </a>
            </div>
          )}

          {token && !loading && status && (status as any).error && (status as any).error !== "not_logged_in" && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-sm text-red-200">
              <p className="font-semibold">Não foi possível validar o link.</p>
              <p className="mt-1 opacity-80">Motivo: {(status as any).error}</p>
              <p className="mt-3 text-xs opacity-70">Gere um novo com <code>/daily</code> no Discord.</p>
            </div>
          )}

          {claimed && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 to-green-500/10 p-6 text-center">
                <Sparkles className="mx-auto mb-2 h-10 w-10 text-emerald-300" />
                <p className="text-xs uppercase tracking-widest text-emerald-300/80">Resgatado!</p>
                <p className="mt-2 font-display text-4xl font-black text-white">
                  +{claimed.amount.toLocaleString("pt-BR")} {claimed.currency.emoji}
                </p>
                <p className="mt-1 text-sm text-emerald-200">
                  Carteira: {claimed.wallet.toLocaleString("pt-BR")} {claimed.currency.name}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <Flame className="mx-auto mb-1 h-4 w-4 text-orange-400" />
                  <p className="text-muted-foreground">Streak</p>
                  <p className="font-bold text-white">{claimed.streak} dias</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <TrendingUp className="mx-auto mb-1 h-4 w-4 text-emerald-400" />
                  <p className="text-muted-foreground">Bônus</p>
                  <p className="font-bold text-white">+{claimed.streakBonus}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <Sparkles className="mx-auto mb-1 h-4 w-4 text-amber-400" />
                  <p className="text-muted-foreground">Multi</p>
                  <p className="font-bold text-white">
                    {(claimed.vipMultiplier * claimed.premiumMultiplier).toFixed(1)}x
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/30 p-4 text-center text-sm text-muted-foreground">
                Próximo resgate em <Countdown to={claimed.nextClaimAt} />
              </div>
            </div>
          )}

          {!claimed && isStatus(status) && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-6 text-center">
                <p className="text-xs uppercase tracking-widest text-amber-300/80">
                  Você vai receber
                </p>
                <p className="mt-2 font-display text-5xl font-black text-white">
                  {status.amount.toLocaleString("pt-BR")} {status.currency.emoji}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Base {status.base} + bônus streak {status.streakBonus}
                  {status.vipMultiplier > 1 && ` · 💎 VIP ${status.vipMultiplier}x`}
                  {status.premiumMultiplier > 1 && ` · ✨ Premium ${status.premiumMultiplier}x`}
                </p>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                  Streak da semana
                </p>
                <StreakDots current={status.streak} projected={status.projectedStreak} />
              </div>

              {status.canClaim ? (
                <Button
                  size="lg"
                  onClick={onClaim}
                  disabled={claiming}
                  className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:from-amber-300 hover:to-orange-400 disabled:opacity-50"
                >
                  {claiming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resgatando…
                    </>
                  ) : (
                    <>
                      <Gift className="mr-2 h-4 w-4" /> Resgatar agora
                    </>
                  )}
                </Button>
              ) : (
                <div className="rounded-2xl border border-white/5 bg-black/30 p-4 text-center text-sm">
                  <Lock className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                  <p className="text-muted-foreground">Você já resgatou hoje.</p>
                  {status.nextClaimAt && (
                    <p className="mt-1 text-foreground">
                      Próximo em <Countdown to={status.nextClaimAt} />
                    </p>
                  )}
                </div>
              )}

              <p className="text-center text-xs text-muted-foreground/60">
                Carteira atual: {status.wallet.toLocaleString("pt-BR")} {status.currency.name}
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/50">
          Powered by Zenox · O link expira em 10 minutos
        </p>
      </div>
    </div>
  );
}

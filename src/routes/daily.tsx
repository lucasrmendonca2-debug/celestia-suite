import { useEffect, useState } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Gift, Flame, Sparkles, TrendingUp, Lock, Loader2, ArrowLeft } from "lucide-react";
import {
  getDailyStatus,
  claimDaily,
  type DailyStatusDTO,
  type DailyClaimDTO,
} from "@/lib/daily.functions";
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

function requestTimeoutError() {
  return {
    error: "site_request_timeout",
    data: { message: "A validação demorou demais. Abra um novo link pelo Discord." },
  } satisfies AnyStatus;
}

function errorMessage(status: AnyStatus) {
  const error = (status as any).error;
  if (error === "fetch_failed") return "Não consegui conectar na API do bot.";
  if (error === "bot_timeout") return "A API do bot demorou demais para responder.";
  if (error === "bot_not_configured") return "A URL da API do bot não está configurada.";
  if (error === "bot_secret_missing") return "O segredo da API do bot não está configurado.";
  if (error === "token_user_mismatch") return "Este link de daily pertence a outra conta Discord. Faça login com a conta que executou /daily.";
  if (error === "invalid_token" || error === "invalid token" || error === "missing_token") return "Token inválido ou já utilizado. Execute /daily novamente no Discord.";
  if (error === "expired") return "Este link expirou. Execute /daily novamente no Discord.";
  if (error === "already_claimed") return "Você já resgatou sua diária. Volte amanhã!";
  return (status as any).data?.message || "Gere um novo link com /daily no Discord.";
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
    <span className="font-mono tabular-nums font-bold">
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

function StreakDots({ current, projected }: { current: number; projected: number }) {
  const days = Array.from({ length: 7 }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border-2 border-[#1B0E3B] bg-[#FFF3D1] p-3 shadow-[0_4px_0_0_#1B0E3B]">
      {days.map((d) => {
        const isPast = d <= current;
        const isNext = d === projected && d > current;
        return (
          <div key={d} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1B0E3B] text-sm font-extrabold font-['Plus_Jakarta_Sans'] transition",
                isPast && "bg-[#FBBF24] text-[#1B0E3B] shadow-[0_3px_0_0_#1B0E3B]",
                isNext && "bg-[#EC4899] text-white shadow-[0_3px_0_0_#1B0E3B] animate-pulse",
                !isPast && !isNext && "bg-white text-[#5B4B7A]",
              )}
            >
              {isPast ? "🔥" : d}
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5B4B7A]">D{d}</span>
          </div>
        );
      })}
    </div>
  );
}

function BgBlobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-20 top-10 size-72 rounded-full bg-[#FBBF24]/40 blur-3xl" />
      <div className="absolute -right-16 top-1/3 size-80 rounded-full bg-[#EC4899]/30 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 size-72 rounded-full bg-[#7C3AED]/25 blur-3xl" />
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
    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        setStatus(requestTimeoutError());
        setLoading(false);
      }
    }, 9000);
    setLoading(true);
    fetchStatus({ data: { token } })
      .then((r) => {
        if (!cancelled) setStatus(r as AnyStatus);
      })
      .catch((e) => {
        if (!cancelled) {
          setStatus({
            error: "site_request_failed",
            data: { message: e instanceof Error ? e.message : "Falha ao validar o link" },
          });
        }
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
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
    <div className="relative min-h-dvh overflow-hidden bg-[#FBF7FF] font-['Inter'] text-[#1B0E3B] selection:bg-[#7C3AED] selection:text-white">
      <BgBlobs />

      <div className="relative mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 py-10">
        <Link
          to="/"
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border-2 border-[#1B0E3B] bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-widest text-[#1B0E3B] shadow-[0_3px_0_0_#1B0E3B] transition-transform hover:-translate-y-0.5"
        >
          <ArrowLeft className="size-3.5" /> Voltar
        </Link>

        {/* Card */}
        <div className="relative w-full">
          <div className="absolute inset-0 -z-10 translate-x-2 translate-y-2 rounded-[2rem] bg-[#1B0E3B]" />
          <div className="relative rounded-[2rem] border-2 border-[#1B0E3B] bg-white p-7 shadow-[0_8px_0_0_#1B0E3B] sm:p-10">
            {/* Header */}
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-3 flex size-16 items-center justify-center rounded-2xl border-2 border-[#1B0E3B] bg-[#FBBF24] shadow-[0_4px_0_0_#1B0E3B]">
                <Gift className="size-8 text-[#1B0E3B]" />
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#1B0E3B] bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#1B0E3B] shadow-[0_2px_0_0_#1B0E3B]">
                <Sparkles className="size-3" /> Daily Reward
              </span>
              <h1 className="mt-3 font-['Plus_Jakarta_Sans'] text-4xl font-extrabold leading-tight tracking-tight">
                Sua{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">recompensa</span>
                  <span aria-hidden className="absolute -bottom-1 left-0 -z-0 h-2.5 w-full -rotate-1 rounded-full bg-[#FBBF24]" />
                </span>{" "}
                chegou.
              </h1>
              <p className="mt-2 text-sm text-[#5B4B7A]">
                Pegue seus Zen Coins e segura esse streak 🔥
              </p>
            </div>

            {/* Body states */}
            {!token && (
              <div className="rounded-2xl border-2 border-[#1B0E3B] bg-[#FFE0E5] p-6 text-center shadow-[0_4px_0_0_#1B0E3B]">
                <Lock className="mx-auto mb-2 size-7 text-[#BE123C]" />
                <p className="text-sm font-semibold text-[#1B0E3B]">
                  Link inválido. Use{" "}
                  <code className="rounded-md border border-[#1B0E3B] bg-white px-1.5 py-0.5 font-mono text-xs">
                    /daily
                  </code>{" "}
                  no Discord pra gerar outro.
                </p>
              </div>
            )}

            {token && loading && (
              <div className="flex flex-col items-center gap-3 py-12 text-[#5B4B7A]">
                <Loader2 className="size-8 animate-spin text-[#7C3AED]" />
                <p className="text-sm font-semibold">Validando seu link…</p>
              </div>
            )}

            {token && !loading && status && (status as any).error === "not_logged_in" && (
              <div className="rounded-2xl border-2 border-[#1B0E3B] bg-[#FFF3D1] p-6 text-center shadow-[0_4px_0_0_#1B0E3B]">
                <p className="mb-4 text-sm font-semibold text-[#1B0E3B]">
                  Precisa entrar com Discord pra resgatar.
                </p>
                <a
                  href={`/api/auth/discord/login?next=${encodeURIComponent(`/daily?token=${token}`)}`}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[#1B0E3B] bg-[#7C3AED] px-5 py-2.5 text-sm font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_0_#1B0E3B] transition-transform hover:-translate-y-0.5"
                >
                  Entrar com Discord
                </a>
              </div>
            )}

            {token && !loading && status && (status as any).error && (status as any).error !== "not_logged_in" && (
              <div className="rounded-2xl border-2 border-[#1B0E3B] bg-[#FFE0E5] p-6 text-center shadow-[0_4px_0_0_#1B0E3B]">
                <p className="font-['Plus_Jakarta_Sans'] text-base font-extrabold text-[#BE123C]">
                  Não foi possível validar o link.
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#5B4B7A]">
                  Motivo: {(status as any).error}
                </p>
                <p className="mt-3 text-sm text-[#1B0E3B]">{errorMessage(status)}</p>
              </div>
            )}

            {claimed && (
              <div className="space-y-5">
                <div className="relative overflow-hidden rounded-2xl border-2 border-[#1B0E3B] bg-[#D6FBEC] p-6 text-center shadow-[0_5px_0_0_#1B0E3B]">
                  <Confetti />
                  <Sparkles className="coin-pop mx-auto mb-2 size-10 text-[#047857]" />
                  <p className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#047857]">
                    Resgatado!
                  </p>
                  <p className="mt-1 flex items-baseline justify-center gap-2 font-['Plus_Jakarta_Sans'] text-5xl font-extrabold text-[#1B0E3B]">
                    <span>+</span>
                    <RollingNumber target={claimed.amount} />
                    <span className="text-4xl">{claimed.currency.emoji}</span>
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#047857]">
                    Carteira: {claimed.wallet.toLocaleString("pt-BR")} {claimed.currency.name}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <MiniStat icon={Flame} label="Streak" value={`${claimed.streak}d`} tone="coral" />
                  <MiniStat icon={TrendingUp} label="Bônus" value={`+${claimed.streakBonus}`} tone="mint" />
                  <MiniStat
                    icon={Sparkles}
                    label="Multi"
                    value={`${(claimed.vipMultiplier * claimed.premiumMultiplier).toFixed(1)}x`}
                    tone="sun"
                  />
                </div>
                <div className="rounded-2xl border-2 border-[#1B0E3B] bg-white p-4 text-center text-sm font-semibold shadow-[0_3px_0_0_#1B0E3B]">
                  Próximo resgate em <Countdown to={claimed.nextClaimAt} />
                </div>
              </div>
            )}

            {!claimed && isStatus(status) && (
              <div className="space-y-5">
                <div className="rounded-2xl border-2 border-[#1B0E3B] bg-[#FFF3D1] p-6 text-center shadow-[0_5px_0_0_#1B0E3B]">
                  <p className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#B45309]">
                    Você vai receber
                  </p>
                  <p className="mt-1 font-['Plus_Jakarta_Sans'] text-6xl font-extrabold text-[#1B0E3B]">
                    {status.amount.toLocaleString("pt-BR")} {status.currency.emoji}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-[#5B4B7A]">
                    Base {status.base} + streak {status.streakBonus}
                    {status.vipMultiplier > 1 && ` · 💎 VIP ${status.vipMultiplier}x`}
                    {status.premiumMultiplier > 1 && ` · ✨ Premium ${status.premiumMultiplier}x`}
                  </p>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-[#5B4B7A]">
                    <Flame className="size-3.5 text-[#FB7185]" />
                    Streak da semana
                  </p>
                  <StreakDots current={status.streak} projected={status.projectedStreak} />
                </div>

                {status.canClaim ? (
                  <button
                    type="button"
                    onClick={onClaim}
                    disabled={claiming}
                    className="group relative w-full overflow-hidden rounded-full border-2 border-[#1B0E3B] bg-[#EC4899] px-6 py-4 text-base font-extrabold uppercase tracking-wider text-white shadow-[0_6px_0_0_#1B0E3B] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {claiming ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 className="size-4 animate-spin" /> Resgatando…
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Gift className="size-5" /> Resgatar agora
                      </span>
                    )}
                  </button>
                ) : (
                  <div className="rounded-2xl border-2 border-[#1B0E3B] bg-white p-5 text-center shadow-[0_3px_0_0_#1B0E3B]">
                    <Lock className="mx-auto mb-2 size-5 text-[#5B4B7A]" />
                    <p className="text-sm font-semibold text-[#5B4B7A]">Você já resgatou hoje.</p>
                    {status.nextClaimAt && (
                      <p className="mt-1 text-sm text-[#1B0E3B]">
                        Próximo em <Countdown to={status.nextClaimAt} />
                      </p>
                    )}
                  </div>
                )}

                <p className="text-center text-xs font-semibold text-[#5B4B7A]">
                  Carteira atual: {status.wallet.toLocaleString("pt-BR")} {status.currency.name}
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs font-semibold text-[#5B4B7A]/70">
          Powered by Zenox · O link expira em 10 minutos
        </p>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  tone: "coral" | "mint" | "sun";
}) {
  const bg = tone === "coral" ? "bg-[#FFE0E5]" : tone === "mint" ? "bg-[#D6FBEC]" : "bg-[#FFF3D1]";
  const text =
    tone === "coral" ? "text-[#BE123C]" : tone === "mint" ? "text-[#047857]" : "text-[#B45309]";
  return (
    <div className={`rounded-2xl border-2 border-[#1B0E3B] ${bg} p-3 shadow-[0_3px_0_0_#1B0E3B]`}>
      <Icon className={`mx-auto mb-1 size-4 ${text}`} />
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#5B4B7A]">{label}</p>
      <p className="font-['Plus_Jakarta_Sans'] text-base font-extrabold text-[#1B0E3B]">{value}</p>
    </div>
  );
}

function RollingNumber({ target, duration = 1400 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      // Slot-style: random jitter near end, settles exactly on target
      if (t < 0.85) {
        const jitter = Math.floor(Math.random() * Math.max(target, 100));
        setValue(Math.floor(eased * target * 0.95) + (jitter % 7));
      } else {
        setValue(Math.floor(eased * target));
      }
      if (t < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return (
    <span className="font-mono tabular-nums">{value.toLocaleString("pt-BR")}</span>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 18 });
  const colors = ["#FBBF24", "#EC4899", "#10D9A0", "#7C3AED", "#38BDF8", "#FB7185"];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => {
        const left = (i / pieces.length) * 100;
        const cx = (Math.random() - 0.5) * 80;
        const delay = Math.random() * 0.4;
        const rot = Math.random() * 360;
        const color = colors[i % colors.length];
        return (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${left}%`,
              top: "-10px",
              background: color,
              transform: `rotate(${rot}deg)`,
              animationDelay: `${delay}s`,
              ["--cx" as any]: `${cx}px`,
            }}
          />
        );
      })}
    </div>
  );
}

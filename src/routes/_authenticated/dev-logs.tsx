import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Bug,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  listAppErrors,
  resolveAppError,
  clearResolvedAppErrors,
  wipeOldAppErrors,
  checkAdminAccess,
  type AppErrorRow,
} from "@/lib/dev-logs/dev-logs.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dev-logs")({
  loader: async () => {
    const access = await checkAdminAccess();
    if (!access.isAdmin) throw redirect({ to: "/servidores" });
    return access;
  },
  component: DevLogsPage,
});

const LEVEL_TONE: Record<AppErrorRow["level"], string> = {
  error: "bg-red-500/15 text-red-600 border-red-500/40",
  warn: "bg-amber-500/15 text-amber-600 border-amber-500/40",
  info: "bg-sky-500/15 text-sky-600 border-sky-500/40",
};
const SOURCE_TONE: Record<AppErrorRow["source"], string> = {
  client: "bg-violet-500/15 text-violet-700 border-violet-500/40",
  server: "bg-emerald-500/15 text-emerald-700 border-emerald-500/40",
  serverfn: "bg-cyan-500/15 text-cyan-700 border-cyan-500/40",
  boundary: "bg-pink-500/15 text-pink-700 border-pink-500/40",
};

function DevLogsPage() {
  const qc = useQueryClient();
  const [level, setLevel] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [resolved, setResolved] = useState<string>("open");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const args = {
    data: {
      level: level === "all" ? undefined : (level as AppErrorRow["level"]),
      source: source === "all" ? undefined : (source as AppErrorRow["source"]),
      resolved: resolved === "all" ? undefined : resolved === "resolved",
      search: search.trim() || undefined,
      limit: 200,
    },
  };

  const q = useQuery({
    queryKey: ["dev-logs", args.data],
    queryFn: () => listAppErrors(args),
    refetchInterval: 5_000,
  });

  const resolveFn = useServerFn(resolveAppError);
  const clearFn = useServerFn(clearResolvedAppErrors);
  const wipeFn = useServerFn(wipeOldAppErrors);

  const toggleResolve = useMutation({
    mutationFn: (vars: { id: string; resolved: boolean }) =>
      resolveFn({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dev-logs"] }),
    onError: (e) => toast.error((e as Error).message),
  });

  const clearResolved = useMutation({
    mutationFn: () => clearFn(),
    onSuccess: () => {
      toast.success("Resolvidos limpos.");
      qc.invalidateQueries({ queryKey: ["dev-logs"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const wipeOld = useMutation({
    mutationFn: () => wipeFn({ data: { days: 7 } }),
    onSuccess: () => {
      toast.success("Logs com mais de 7 dias removidos.");
      qc.invalidateQueries({ queryKey: ["dev-logs"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const rows = q.data ?? [];
  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  return (
    <div className="paint-doodles min-h-dvh">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border-2 border-[#1B0E3B] bg-white p-5 shadow-[6px_6px_0_#1B0E3B]">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl border-2 border-[#1B0E3B] bg-[#FBBF24] shadow-[3px_3px_0_#1B0E3B]">
              <Bug className="size-6 text-[#1B0E3B]" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-black text-[#1B0E3B]">
                Dev Logs — painel interno
              </h1>
              <p className="text-sm text-[#1B0E3B]/70">
                Todo erro do cliente, do servidor e de boundaries cai aqui em tempo real.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => q.refetch()}
              className="border-2 border-[#1B0E3B] bg-white shadow-[2px_2px_0_#1B0E3B]"
            >
              <RefreshCw className="mr-1.5 size-4" /> Atualizar
            </Button>
            <Button
              variant="outline"
              onClick={() => clearResolved.mutate()}
              disabled={clearResolved.isPending}
              className="border-2 border-[#1B0E3B] bg-white shadow-[2px_2px_0_#1B0E3B]"
            >
              <Trash2 className="mr-1.5 size-4" /> Limpar resolvidos
            </Button>
            <Button
              variant="outline"
              onClick={() => wipeOld.mutate()}
              disabled={wipeOld.isPending}
              className="border-2 border-[#1B0E3B] bg-white shadow-[2px_2px_0_#1B0E3B]"
            >
              <Trash2 className="mr-1.5 size-4" /> Apagar &gt; 7d
            </Button>
          </div>
        </header>

        <div className="mb-4 grid gap-2 rounded-2xl border-2 border-[#1B0E3B] bg-white p-3 shadow-[4px_4px_0_#1B0E3B] md:grid-cols-4">
          <Input
            placeholder="Buscar na mensagem…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-2 border-[#1B0E3B]"
          />
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="border-2 border-[#1B0E3B]">
              <SelectValue placeholder="Nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              <SelectItem value="error">error</SelectItem>
              <SelectItem value="warn">warn</SelectItem>
              <SelectItem value="info">info</SelectItem>
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="border-2 border-[#1B0E3B]">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as origens</SelectItem>
              <SelectItem value="client">client</SelectItem>
              <SelectItem value="server">server</SelectItem>
              <SelectItem value="serverfn">serverfn</SelectItem>
              <SelectItem value="boundary">boundary</SelectItem>
            </SelectContent>
          </Select>
          <Select value={resolved} onValueChange={setResolved}>
            <SelectTrigger className="border-2 border-[#1B0E3B]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Abertos</SelectItem>
              <SelectItem value="resolved">Resolvidos</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {q.isLoading ? (
          <p className="rounded-2xl border-2 border-dashed border-[#1B0E3B] bg-white p-8 text-center text-[#1B0E3B]/60">
            Carregando…
          </p>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#1B0E3B] bg-white p-10 text-center">
            <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
            <p className="mt-2 font-display text-lg font-bold text-[#1B0E3B]">
              Nada por aqui ✨
            </p>
            <p className="text-sm text-[#1B0E3B]/60">
              Nenhum erro batendo nos filtros atuais.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => {
              const isOpen = expanded.has(r.id);
              const Icon =
                r.level === "error" ? Bug : r.level === "warn" ? AlertTriangle : Info;
              return (
                <li
                  key={r.id}
                  className="rounded-2xl border-2 border-[#1B0E3B] bg-white shadow-[3px_3px_0_#1B0E3B]"
                >
                  <button
                    onClick={() => toggle(r.id)}
                    className="flex w-full items-start gap-3 p-3 text-left"
                  >
                    {isOpen ? (
                      <ChevronDown className="mt-1 size-4 shrink-0 text-[#1B0E3B]" />
                    ) : (
                      <ChevronRight className="mt-1 size-4 shrink-0 text-[#1B0E3B]" />
                    )}
                    <Icon className="mt-0.5 size-4 shrink-0 text-[#1B0E3B]" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <Badge className={`border ${LEVEL_TONE[r.level]}`}>
                          {r.level}
                        </Badge>
                        <Badge className={`border ${SOURCE_TONE[r.source]}`}>
                          {r.source}
                        </Badge>
                        {r.count > 1 && (
                          <Badge className="border border-[#1B0E3B] bg-[#FBBF24] text-[#1B0E3B]">
                            ×{r.count}
                          </Badge>
                        )}
                        {r.resolved && (
                          <Badge className="border border-emerald-500/40 bg-emerald-500/15 text-emerald-700">
                            resolvido
                          </Badge>
                        )}
                        {r.route && (
                          <span className="rounded bg-[#1B0E3B]/5 px-1.5 py-0.5 font-mono text-[10px] text-[#1B0E3B]/70">
                            {r.route}
                          </span>
                        )}
                      </div>
                      <p className="break-words font-mono text-sm text-[#1B0E3B]">
                        {r.message}
                      </p>
                      <p className="mt-1 text-[11px] text-[#1B0E3B]/50">
                        {new Date(r.last_seen_at).toLocaleString("pt-BR")}
                        {r.user_tag ? ` · ${r.user_tag}` : ""}
                        {r.guild_id ? ` · guild ${r.guild_id}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleResolve.mutate({ id: r.id, resolved: !r.resolved });
                      }}
                      className="shrink-0 rounded-lg border-2 border-[#1B0E3B] bg-white p-1.5 hover:bg-[#FBF7FF]"
                      title={r.resolved ? "Reabrir" : "Marcar como resolvido"}
                    >
                      {r.resolved ? (
                        <Circle className="size-4 text-[#1B0E3B]" />
                      ) : (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      )}
                    </button>
                  </button>
                  {isOpen && (
                    <div className="space-y-2 border-t-2 border-[#1B0E3B]/20 bg-[#FBF7FF] p-3">
                      {r.stack && (
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#1B0E3B]/60">
                            Stack
                          </p>
                          <pre className="max-h-80 overflow-auto rounded-lg border border-[#1B0E3B]/20 bg-white p-2 font-mono text-[11px] text-[#1B0E3B]">
                            {r.stack}
                          </pre>
                        </div>
                      )}
                      {r.metadata != null && (
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#1B0E3B]/60">
                            Metadata
                          </p>
                          <pre className="overflow-auto rounded-lg border border-[#1B0E3B]/20 bg-white p-2 font-mono text-[11px] text-[#1B0E3B]">
                            {JSON.stringify(r.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                      {r.user_agent && (
                        <p className="break-all text-[10px] text-[#1B0E3B]/50">
                          UA: {r.user_agent}
                        </p>
                      )}
                      {r.fingerprint && (
                        <p className="break-all text-[10px] text-[#1B0E3B]/40">
                          fp: {r.fingerprint}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

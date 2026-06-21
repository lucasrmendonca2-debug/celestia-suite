import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export interface ActivityPoint {
  day: string;
  modCases: number;
  tickets: number;
  warnings: number;
}

const DAY_LABEL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function fmtDay(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return DAY_LABEL[d.getUTCDay()];
}

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const series = useMemo(
    () => data.map((p) => ({ ...p, label: fmtDay(p.day) })),
    [data],
  );

  const hasData = series.some(
    (p) => p.modCases > 0 || p.tickets > 0 || p.warnings > 0,
  );

  return (
    <div className="h-64 w-full">
      {!hasData && (
        <div className="flex h-full items-center justify-center">
          <p className="text-xs text-muted-foreground">
            Sem atividade nos últimos 7 dias. Quando o bot agir, aparece aqui.
          </p>
        </div>
      )}
      {hasData && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="grad-mod" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--aurora-pink)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="var(--aurora-pink)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-tic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--aurora-cyan)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="var(--aurora-cyan)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-wrn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--aurora-peach)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="var(--aurora-peach)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="color-mix(in oklab, var(--foreground) 12%, transparent)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke="color-mix(in oklab, var(--foreground) 55%, transparent)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="color-mix(in oklab, var(--foreground) 55%, transparent)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={32}
            />
            <Tooltip
              contentStyle={{
                background: "color-mix(in oklab, var(--background) 90%, transparent)",
                border: "1px solid color-mix(in oklab, var(--aurora-lavender) 35%, transparent)",
                borderRadius: 12,
                fontSize: 12,
                backdropFilter: "blur(8px)",
              }}
              labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
              formatter={(v: number, name) => {
                const map: Record<string, string> = {
                  modCases: "Casos de moderação",
                  tickets: "Tickets",
                  warnings: "Avisos",
                };
                return [v, map[String(name)] ?? String(name)];
              }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
              formatter={(v) => {
                const map: Record<string, string> = {
                  modCases: "Mod",
                  tickets: "Tickets",
                  warnings: "Avisos",
                };
                return map[String(v)] ?? String(v);
              }}
            />
            <Area
              type="monotone"
              dataKey="modCases"
              stroke="var(--aurora-pink)"
              strokeWidth={2}
              fill="url(#grad-mod)"
            />
            <Area
              type="monotone"
              dataKey="tickets"
              stroke="var(--aurora-cyan)"
              strokeWidth={2}
              fill="url(#grad-tic)"
            />
            <Area
              type="monotone"
              dataKey="warnings"
              stroke="var(--aurora-peach)"
              strokeWidth={2}
              fill="url(#grad-wrn)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

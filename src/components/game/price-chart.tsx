"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { TrendingUp, ExternalLink } from "lucide-react";
import { getGamePriceHistory, getGameLatestPrices } from "@/lib/api";
import type { GamePriceResponse, PriceHistoryResponse } from "@/types";

interface PriceChartProps {
  gameId: string;
}

interface ChartPoint {
  date: string;
  [source: string]: string | number;
}

function formatCurrency(value: number, currency: string) {
  if (currency === "BRL") return `R$ ${value.toFixed(2).replace(".", ",")}`;
  return `${currency} ${value.toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

const SOURCE_COLORS: Record<string, string> = {
  Ludopedia: "#8b5cf6",
};

function getSourceColor(name: string) {
  return SOURCE_COLORS[name] ?? "#60a5fa";
}

export function PriceChart({ gameId }: PriceChartProps) {
  const [history, setHistory] = useState<PriceHistoryResponse | null>(null);
  const [latest, setLatest] = useState<GamePriceResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [h, l] = await Promise.all([
          getGamePriceHistory(gameId),
          getGameLatestPrices(gameId),
        ]);
        if (!cancelled) {
          setHistory(h);
          setLatest(l);
        }
      } catch {
        // No prices available — silently ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [gameId]);

  if (loading) return null;
  if (!history || history.prices.length === 0) return null;

  // Build chart data: group by date, one series per source
  const sources = [...new Set(history.prices.map((p) => p.source_name))];

  const byDate = new Map<string, ChartPoint>();
  for (const p of history.prices) {
    const dateKey = p.scraped_at.slice(0, 10);
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, { date: dateKey });
    }
    byDate.get(dateKey)![p.source_name] = p.price;
  }
  const chartData = [...byDate.values()].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 px-1">
        Histórico de preços
      </p>

      {/* Latest prices */}
      {latest.length > 0 && (
        <div className="flex gap-2 mb-3">
          {latest.map((p) => (
            <Card
              key={p.id}
              className="flex-1 flex flex-col items-center gap-1 p-3"
            >
              <p className="text-[10px] text-muted uppercase tracking-wide">
                {p.source_name}
              </p>
              <p className="text-lg font-bold text-foreground">
                {formatCurrency(p.price, p.currency)}
              </p>
              {p.url && (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-primary-400 hover:underline"
                >
                  Ver loja <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <Card className="p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="h-3.5 w-3.5 text-muted" />
            <p className="text-[10px] text-muted uppercase tracking-wide">
              Evolução
            </p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 10, fill: "#888" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#888" }}
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={(v: number) => `R$${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a2e",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                labelFormatter={(label) => formatDate(String(label))}
                formatter={(value) => [
                  `R$ ${Number(value).toFixed(2).replace(".", ",")}`,
                ]}
              />
              {sources.map((s) => (
                <Line
                  key={s}
                  type="monotone"
                  dataKey={s}
                  stroke={getSourceColor(s)}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { HistogramData } from "../types";

interface ForensicChartProps {
  data: HistogramData[];
}

export function ForensicChart({ data }: ForensicChartProps) {
  // If no data, render an empty state message
  if (!data || data.length === 0) {
    return (
      <div id="chart-empty-state" className="flex items-center justify-center h-48 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-xs text-gray-500">
        Nenhum dado estatístico disponível de momento.
      </div>
    );
  }

  // Format tick labels for errorLevel (representing the intensity)
  const formatXAxis = (tickItem: number) => {
    return `${tickItem}`;
  };

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const level = payload[0].payload.errorLevel;
      return (
        <div className="bg-slate-950/95 border border-slate-800 text-slate-300 p-2 text-xs rounded-xl shadow-lg backdrop-blur">
          <span className="font-semibold block text-indigo-400 mb-1">Nível de Diferença: {level}</span>
          <span>Quant. Pixels: <strong className="text-white">{value.toLocaleString()}</strong></span>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="forensic-chart-wrapper" className="w-full h-48 bg-slate-950/20 border border-slate-900/60 rounded-xl p-3">
      <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Espectro de Distribuição de Erro de Recompressão (Histograma ELA)</h4>
      <div className="w-full h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.1)" vertical={false} />
            <XAxis
              dataKey="errorLevel"
              stroke="#64748b"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatXAxis}
            />
            <YAxis
              stroke="#64748b"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              width={24}
              tickFormatter={(val) => val > 1000 ? `${(val / 1000).toFixed(0)}k` : val}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#colorCount)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between items-center text-[9px] text-gray-500 mt-1 font-mono">
        <span>← Homogêneo (Inalterado)</span>
        <span>Suspeito (Adulterado) →</span>
      </div>
    </div>
  );
}

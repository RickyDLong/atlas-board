'use client';

import { useMemo } from 'react';
import type { CfdSnapshot, Column } from '@/types/database';

interface CumulativeFlowDiagramProps {
  snapshots: CfdSnapshot[];
  columns: Column[];
}

export function CumulativeFlowDiagram({ snapshots, columns }: CumulativeFlowDiagramProps) {
  const sortedCols = useMemo(
    () => [...columns].sort((a, b) => a.position - b.position),
    [columns]
  );

  type ChartRow = { date: string } & Record<string, number>;

  const chartData = useMemo(() => {
    if (snapshots.length === 0) return [] as ChartRow[];

    return snapshots.map(snap => {
      const row: ChartRow = { date: snap.snapshot_date } as ChartRow;
      for (const col of sortedCols) {
        row[col.id] = snap.column_counts[col.id] || 0;
      }
      return row;
    });
  }, [snapshots, sortedCols]);

  // Calculate max total for Y-axis scaling
  const maxTotal = useMemo(() => {
    if (chartData.length === 0) return 1;
    return Math.max(
      ...chartData.map(d =>
        sortedCols.reduce((sum, col) => sum + ((d[col.id] as number) || 0), 0)
      ),
      1
    );
  }, [chartData, sortedCols]);

  if (snapshots.length === 0) {
    return (
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-4">
          Cumulative Flow
        </h3>
        <div className="text-[11px] text-[#3a3a4a] text-center py-8">
          Flow data accumulates daily. Check back tomorrow for your first chart.
        </div>
      </div>
    );
  }

  const chartHeight = 200;
  const chartWidth = 600;
  const padding = { top: 10, right: 10, bottom: 30, left: 40 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Build stacked area paths
  const xStep = chartData.length > 1 ? plotWidth / (chartData.length - 1) : plotWidth;

  // Reverse columns so bottom of stack = first column (backlog)
  const stackedCols = [...sortedCols].reverse();

  const areas = stackedCols.map((col, colIdx) => {
    // For each data point, compute cumulative Y
    const topPoints: string[] = [];
    const bottomPoints: string[] = [];

    chartData.forEach((d, i) => {
      const x = padding.left + (chartData.length > 1 ? i * xStep : plotWidth / 2);

      // Sum of columns below this one (in the reversed order)
      let below = 0;
      for (let j = colIdx + 1; j < stackedCols.length; j++) {
        below += (d[stackedCols[j].id] as number) || 0;
      }
      const value = (d[col.id] as number) || 0;
      const top = below + value;

      const yTop = padding.top + plotHeight - (top / maxTotal) * plotHeight;
      const yBottom = padding.top + plotHeight - (below / maxTotal) * plotHeight;

      topPoints.push(`${x},${yTop}`);
      bottomPoints.unshift(`${x},${yBottom}`);
    });

    const path = `M${topPoints.join(' L')} L${bottomPoints.join(' L')} Z`;
    return { col, path };
  });

  // Y-axis labels
  const yTicks = [0, Math.round(maxTotal / 2), maxTotal];

  // X-axis labels (show a few dates)
  const xLabelCount = Math.min(chartData.length, 6);
  const xLabelStep = Math.max(1, Math.floor((chartData.length - 1) / (xLabelCount - 1)));

  return (
    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-4">
        Cumulative Flow
      </h3>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {yTicks.map(tick => {
          const y = padding.top + plotHeight - (tick / maxTotal) * plotHeight;
          return (
            <g key={tick}>
              <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#1e1e2e" strokeWidth="0.5" />
              <text x={padding.left - 4} y={y + 3} fill="#555568" fontSize="8" textAnchor="end" fontFamily="monospace">
                {tick}
              </text>
            </g>
          );
        })}

        {/* Stacked areas */}
        {areas.map(({ col, path }) => (
          <path key={col.id} d={path} fill={col.color} fillOpacity="0.6" stroke={col.color} strokeWidth="1" strokeOpacity="0.8" />
        ))}

        {/* X-axis date labels */}
        {chartData.map((d, i) => {
          if (i % xLabelStep !== 0 && i !== chartData.length - 1) return null;
          const x = padding.left + (chartData.length > 1 ? i * xStep : plotWidth / 2);
          const label = (d.date as string).slice(5); // MM-DD
          return (
            <text key={i} x={x} y={chartHeight - 4} fill="#555568" fontSize="7" textAnchor="middle" fontFamily="monospace">
              {label}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {sortedCols.map(col => (
          <div key={col.id} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: col.color, opacity: 0.7 }} />
            <span className="text-[10px] text-[#8888a0]">{col.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import React, { useMemo, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useGetRankSeriesQuery } from '@/lib/features/championship/championshipSlice';

interface RankModalProps {
  open: boolean;
  onClose: () => void;
  leagueId: string;
  teamId: string;
  teamName: string;
}

export default function RankModal({ open, onClose, leagueId, teamId, teamName }: RankModalProps) {
  const { data } = useGetRankSeriesQuery({ id: leagueId, teamId }, { skip: !open || !leagueId || !teamId });

  const series = (data?.series || []).filter(p => p.rank != null) as { round: number; rank: number }[];
  const maxRound = series.reduce((m, p) => Math.max(m, p.round), 0);
  const maxRank = series.reduce((m, p) => Math.max(m, p.rank), 1);

  const width = 640;
  const height = 320;
  const padding = 32;

  const points = series.map((p) => ({
    x: padding + ((p.round - 1) / Math.max(1, maxRound - 1)) * (width - padding * 2),
    y: padding + ((p.rank - 1) / Math.max(1, maxRank - 1)) * (height - padding * 2),
  }));

  const path = points.map((pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `L ${pt.x},${pt.y}`)).join(' ');
  const areaPath = points.length
    ? `${path} L ${padding + (width - padding * 2)} ${height - padding} L ${padding} ${height - padding} Z`
    : '';

  // Hover-follow tooltip
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    // find nearest point by x
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dx = Math.abs(points[i].x - x);
      if (dx < best) { best = dx; nearest = i; }
    }
    setHoverIdx(nearest);
    setHoverPos({ x: points[nearest].x, y: points[nearest].y });
  };
  const handleLeave = () => { setHoverIdx(null); setHoverPos(null); };

  return (!open ? null : (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl bg-[#0a1d3f] border border-white/10 shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="text-white font-semibold">Helyezés alakulása • {teamName}</div>
          <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
        </div>
        <div className="p-4">
          {series.length === 0 ? (
            <div className="text-white/70">Nincs elérhető adat.</div>
          ) : (
            <Tooltip.Provider delayDuration={100}>
            <div className="relative">
            <svg width={width} height={height} className="w-full h-[320px]" onMouseMove={handleMove} onMouseLeave={handleLeave} role="img" aria-label="Helyezés grafikon">
              <defs>
                <linearGradient id="rankFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ff5c1a" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#ff5c1a" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              {/* axes */}
              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ffffff22" />
              <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ffffff22" />
              {/* ticks */}
              {Array.from({ length: maxRound }).map((_, i) => {
                const x = padding + (i / Math.max(1, maxRound - 1)) * (width - padding * 2);
                return (
                  <g key={`tx-${i}`}>
                    <line x1={x} x2={x} y1={height - padding} y2={height - padding + 6} stroke="#ffffff44" />
                    <text x={x} y={height - padding + 16} textAnchor="middle" fontSize="10" fill="#cdd6f4" style={{ userSelect: 'none' }}>{i + 1}</text>
                  </g>
                );
              })}
              {Array.from({ length: maxRank }).map((_, i) => {
                const y = padding + (i / Math.max(1, maxRank - 1)) * (height - padding * 2);
                return (
                  <g key={`ty-${i}`}>
                    <line x1={padding - 6} x2={padding} y1={y} y2={y} stroke="#ffffff44" />
                    <text x={padding - 10} y={y + 3} textAnchor="end" fontSize="10" fill="#cdd6f4" style={{ userSelect: 'none' }}>{i + 1}</text>
                  </g>
                );
              })}
              {/* area */}
              <path d={areaPath} fill="url(#rankFill)" />
              {/* line */}
              <path d={path} fill="none" stroke="#ff7c3a" strokeWidth={2.5} />
              {/* points */}
              {points.map((pt, idx) => (
                <g key={idx}>
                  <circle cx={pt.x} cy={pt.y} r={4} fill="#ffffff" />
                </g>
              ))}
            </svg>
            {hoverIdx != null && hoverPos && (
              <div className="pointer-events-none absolute" style={{ left: Math.max(0, Math.min(width - 140, hoverPos.x + 8)), top: Math.max(0, hoverPos.y - 28) }}>
                <div className="rounded bg-black/80 text-white text-xs px-2 py-1 shadow whitespace-nowrap">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#ff7c3a] mr-2 align-middle" />
                  {`Forduló ${series[hoverIdx].round}`} • {`Helyezés ${series[hoverIdx].rank}`}
                </div>
              </div>
            )}
            </div>
            </Tooltip.Provider>
          )}
          <div className="mt-2 flex items-center justify-between text-xs text-white/70">
            <span>Forduló</span>
            <span>Helyezés</span>
          </div>
        </div>
      </div>
    </div>
  ));
}



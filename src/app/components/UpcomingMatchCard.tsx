"use client";

import { useState } from "react";
import { Bebas_Neue } from "next/font/google";
import { FiChevronDown, FiChevronUp, FiShare2, FiClock, FiMapPin, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

interface UpcomingMatchCardProps {
  matchTitle: string;
  id?: string;
  date: string;
  table: string;
  round?: number;
  matchId?: string;
  isDelayed?: boolean;
  // Original data (before delay)
  originalDate?: string;
  originalTable?: string;
  originalRound?: number;
  // Delayed data
  delayedDate?: string;
  delayedTime?: string;
  delayedRound?: number;
  delayedTable?: number;
  teamA?: { name: string; logo?: string };
  teamB?: { name: string; logo?: string };
  onEnterResult?: () => void;
  onShare?: () => void;
  onDelayRequest?: () => void;
}

export default function UpcomingMatchCard({
  matchTitle,
  id,
  date,
  table,
  round,
  matchId,
  isDelayed,
  originalDate,
  originalTable,
  originalRound,
  delayedDate,
  delayedTime,
  delayedRound,
  delayedTable,
  teamA,
  teamB,
  onEnterResult,
  onShare,
  onDelayRequest,
}: UpcomingMatchCardProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div
      className={`${isDelayed ? "bg-red-900/60" : "bg-black/40"} border-2 border-[#ff5c1a] rounded-2xl shadow-lg shadow-[#ff5c1a33] mb-4 transition-all duration-300 ${open ? "pb-4" : "pb-0"} ${isDelayed ? "relative" : ""}`}
    >
      {/* Delayed badge */}
      {isDelayed && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-gray-800/90 text-white px-4 py-2 rounded-lg text-sm font-bold transform -rotate-12">
            HALASZTVA
          </div>
        </div>
      )}
      {/* Collapsed row */}
      <button
        className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3 sm:py-4 gap-2 focus:outline-none text-left"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
      >
        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
          {teamA?.logo && (
            <Image
              src={teamA.logo}
              alt={teamA.name}
              width={32}
              height={32}
              className="rounded-full border border-white/10"
            />
          )}
          <div className="min-w-0">
            <div className={`${bebasNeue.className} text-base sm:text-lg text-white font-bold truncate`}>{matchTitle}</div>
            <div className="text-[#ff5c1a] text-[11px] sm:text-xs mt-1 flex items-center gap-2">
              <FiClock className="inline-block" />
              {date}
            </div>
          </div>
          {teamB?.logo && (
            <Image
              src={teamB.logo}
              alt={teamB.name}
              width={32}
              height={32}
              className="rounded-full border border-white/10"
            />
          )}
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="text-[11px] sm:text-xs text-white bg-[#ff5c1a]/80 px-2 sm:px-3 py-1 rounded-lg font-bold">Asztal: {table}</span>
          <span className="text-[#ff5c1a] text-xl sm:text-2xl">
            {open ? <FiChevronUp /> : <FiChevronDown />}
          </span>
        </div>
      </button>
      {/* Expanded content */}
      <div
        className={`block transition-all duration-300 ${open ? "block max-h-auto opacity-100" : "hidden max-h-0 opacity-0"}`}
      >
        <div className="px-6 pt-2 pb-1 flex flex-col gap-2">
          <div className="flex items-center gap-4 text-sm text-[#e0e6f7]">
            <div className="flex items-center gap-1">
              <FiClock className="inline-block text-[#ff5c1a]" /> {date}
            </div>
            <div className="flex items-center gap-1">
              <FiMapPin className="inline-block text-[#ff5c1a]" /> Asztal: {table}
            </div>
            {round && (
              <div className="flex items-center gap-1">
                <span className="text-[#ff5c1a]">Forduló:</span> {round}
              </div>
            )}
          </div>
          {/* Original match information (before delay) */}
          {isDelayed && (originalDate || originalTable || originalRound) && (
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3 mt-2">
              <div className="text-sm text-gray-300 mb-2 font-bold">Halasztás előtti adatok:</div>
              <div className="flex flex-col gap-1 text-sm text-gray-200">
                {originalDate && (
                  <div className="flex items-center gap-1">
                    <FiClock className="inline-block text-gray-400" />
                    Eredeti időpont: {originalDate}
                  </div>
                )}
                {originalTable && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Eredeti asztal:</span> {originalTable}
                  </div>
                )}
                {originalRound && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Eredeti forduló:</span> {originalRound}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 pt-2 flex gap-3 flex-col md:flex-row">
          <button
            className="flex-1 flex items-center justify-center gap-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white font-bold py-2 rounded-xl shadow-md transition"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEnterResult?.();
            }}
          >
            <FiCheckCircle /> Eredmény beírása
          </button>
         {/* <button
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl shadow-md transition"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShare?.();
            }}
          >
            <FiShare2 /> Megosztás
          </button>*/}
          <button
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl shadow-md transition"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (matchId) {
                router.push(`/application/tracking/${matchId}`);
              } else {
                onDelayRequest?.();
              }
            }}
          >
            <Circle /> Trackelés
          </button>
        </div>
      </div>
    </div>
  );
} 
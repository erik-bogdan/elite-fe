"use client";

import { useState } from "react";
import { Bebas_Neue } from "next/font/google";
import { FiChevronDown, FiChevronUp, FiShare2, FiClock, FiMapPin, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { Circle } from "lucide-react";
import { useRouter } from "next/navigation";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

interface UpcomingMatchCardProps {
  matchTitle: string;
  date: string;
  table: string;
  matchId?: string;
  onEnterResult?: () => void;
  onShare?: () => void;
  onDelayRequest?: () => void;
}

export default function UpcomingMatchCard({
  matchTitle,
  date,
  table,
  matchId,
  onEnterResult,
  onShare,
  onDelayRequest,
}: UpcomingMatchCardProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div
      className={`bg-black/40 border-2 border-[#ff5c1a] rounded-2xl shadow-lg shadow-[#ff5c1a33] mb-4 transition-all duration-300 ${open ? "pb-4" : "pb-0"}`}
    >
      {/* Collapsed row */}
      <button
        className="w-full flex items-center justify-between px-6 py-4 focus:outline-none text-left"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
      >
        <div>
          <div className={`${bebasNeue.className} text-lg text-white font-bold`}>{matchTitle}</div>
          <div className="text-[#ff5c1a] text-xs mt-1 flex items-center gap-2">
            <FiClock className="inline-block" />
            {date}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white bg-[#ff5c1a]/80 px-3 py-1 rounded-lg font-bold">Table {table}</span>
          <span className="ml-2 text-[#ff5c1a] text-2xl">
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
              <FiMapPin className="inline-block text-[#ff5c1a]" /> Table {table}
            </div>
          </div>
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
            <FiCheckCircle /> Enter Result
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl shadow-md transition"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShare?.();
            }}
          >
            <FiShare2 /> Share
          </button>
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
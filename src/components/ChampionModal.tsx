"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Bebas_Neue } from "next/font/google";
import { useEffect } from "react";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

const abs = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = (process.env.NEXT_PUBLIC_BACKEND_HOST as string) || (process.env.NEXT_PUBLIC_BACKEND_URL as string) || "http://localhost:3000";
  return `${base}${path}`;
};

interface ChampionData {
  season: string;
  champion: string;
  logo: string;
  championshipImage?: string;
  members: string[];
  seasonSummary: string;
  results: {
    wins: number;
    losses: number;
    cupRatio: string;
  };
}

interface ChampionModalProps {
  champion: ChampionData | null;
  isOpen: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  currentIndex: number;
  totalChampions: number;
}

export default function ChampionModal({ champion, isOpen, onClose, onPrevious, onNext, currentIndex, totalChampions }: ChampionModalProps) {
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          onPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          onNext();
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onPrevious, onNext, onClose]);

  if (!isOpen || !champion) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-[#ff5c1a]/30 rounded-2xl max-w-4xl w-full max-h-[70vh] overflow-y-auto shadow-[0_0_50px_rgba(255,92,26,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-black border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#FFDB11]/30">
                <Image 
                  src={abs(champion.logo)} 
                  alt={champion.champion} 
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className={`${bebasNeue.className} text-[#FFDB11] text-3xl md:text-4xl font-bold`}>
                  {champion.champion}
                </h2>
                <p className={`${bebasNeue.className} text-white/80 text-lg md:text-xl`}>
                  {champion.season} BAJNOKAI
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-[#FFDB11] text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>

                {/* Navigation Arrows */}
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20">
                  <button
                    onClick={onPrevious}
                    className="w-12 h-12 bg-black/80 hover:bg-black border border-white/20 hover:border-[#FFDB11]/50 rounded-full flex items-center justify-center transition-all duration-300 group"
                  >
                    <svg className="w-6 h-6 text-white group-hover:text-[#FFDB11] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>

                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
                  <button
                    onClick={onNext}
                    className="w-12 h-12 bg-black/80 hover:bg-black border border-white/20 hover:border-[#FFDB11]/50 rounded-full flex items-center justify-center transition-all duration-300 group"
                  >
                    <svg className="w-6 h-6 text-white group-hover:text-[#FFDB11] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Champion Counter */}
                <div className="absolute top-4 right-4 z-20">
                  <div className="bg-black/80 border border-white/20 rounded-full px-3 py-1">
                    <span className="text-white text-sm font-medium">
                      {currentIndex + 1} / {totalChampions}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col lg:flex-row">
          {/* Left side - Team info */}
          <div className="flex-1 p-6 lg:p-8">
            <div className="space-y-6">
              {/* Season Summary */}
              <div>
                <h3 className={`${bebasNeue.className} text-[#FFDB11] text-xl md:text-2xl mb-3`}>
                  SZEZON ÖSSZEFOGLALÓ
                </h3>
                <p className="text-white text-base md:text-lg leading-relaxed">
                  {champion.seasonSummary}
                </p>
              </div>

              {/* Team Members */}
              <div>
                <h3 className={`${bebasNeue.className} text-[#FFDB11] text-xl md:text-2xl mb-3`}>
                  CSAPATTAGOK
                </h3>
                <div className="space-y-2">
                  {champion.members.map((member: string, index: number) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-[#ff5c1a] rounded-full"></div>
                      <span className="text-white text-base md:text-lg font-medium">
                        {member}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Season Results */}
              <div>
                <h3 className={`${bebasNeue.className} text-[#FFDB11] text-xl md:text-2xl mb-3`}>
                  SZEZON EREDMÉNYEI
                </h3>
                {/*<div className="grid grid-cols-3 gap-4">
                  <div className="bg-black/40 border border-white/10 rounded-lg p-4 text-center">
                    <div className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl`}>
                      {champion.results.wins}
                    </div>
                    <div className="text-white text-sm md:text-base">Győzelem</div>
                  </div>
                  <div className="bg-black/40 border border-white/10 rounded-lg p-4 text-center">
                    <div className={`${bebasNeue.className} text-[#ff5c1a] text-2xl md:text-3xl`}>
                      {champion.results.losses}
                    </div>
                    <div className="text-white text-sm md:text-base">Vereség</div>
                  </div>
                  <div className="bg-black/40 border border-white/10 rounded-lg p-4 text-center">
                    <div className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl`}>
                      {champion.results.cupRatio}
                    </div>
                    <div className="text-white text-sm md:text-base">Pohárarány</div>
                  </div>
                </div> */}
                <div className="text-white text-sm md:text-base">
                  Feltöltés alatt...                </div>
              </div>
            </div>
          </div>

          {/* Right side - Championship image */}
          <div className="flex-1 p-6 lg:p-8 flex items-center justify-center bg-gradient-to-br from-gray-800/50 to-black/50">
            <div className="relative w-full max-w-md">
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#FFDB11]/30 shadow-[0_0_30px_rgba(255,219,17,0.2)]">
                <Image 
                  src={champion.championshipImage ? abs(champion.championshipImage) : "/elitelogo.png"} 
                  alt="Championship Trophy" 
                  width={400} 
                  height={400}
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <div className={`${bebasNeue.className} text-[#FFDB11] font-bold text-lg md:text-xl`}>
                    {champion.season}
                  </div>
                  <div className="text-white text-sm md:text-base">
                    BAJNOKA
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

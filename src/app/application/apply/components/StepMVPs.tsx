"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

type MVPRow = { name: string; day: number; final: number };

// Team logo mapping (history logos). Where unknown, we keep a suggested filename string.
const teamLogoMap: Record<string, string> = {
  "AMÍG BEEROM": "/uploads/history/amig-beerom.png",
  "MONEYBALL": "/uploads/history/moneyball.png",
  "GIANTS": "/uploads/history/giants.png",
  "GIANTS-KPS": "/uploads/history/giants-kps.png",
  "KPS": "/uploads/history/kps.png",
  "KPS-B1": "/uploads/history/kps-b1.png",
  "KPS-STEELCITY": "/uploads/history/steel-city.png",
  "B1": "/uploads/history/b1.png",
  "BLACK LABEL": "/uploads/history/black-label.png",
  "BROMANCE": "/uploads/history/bromance.png",
  "D-FAKTOR": "/uploads/history/d-faktor.png",
  "ALBERTIRSAI BPC": "/uploads/history/albertirsaibpc.png",
  "TE IS FIAM, SHARK!?": "/uploads/history/te-is-fiam-shark.png",
  "LEVERGYBLANT": "/uploads/history/leveregyblant.png",
  "LEVEREGYBLANT": "/uploads/history/leveregyblant.png",
  "HACCATÖLTELÉKEK": "/uploads/history/haccatoltelekek.png",
  "KAKIMAKI": "/uploads/history/kakimaki.png",
  "CRAFTCREW": "/uploads/history/craftcrew.png",
  "KPS-FAKTOR": "/uploads/history/kps-faktor.png",
  "SH-KPS": "/uploads/history/sh-kps.png",
  "GERI": "/uploads/history/geri.png",
};

const abs = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = (process.env.NEXT_PUBLIC_BACKEND_HOST as string) || (process.env.NEXT_PUBLIC_BACKEND_URL as string) || "http://localhost:3000";
  if (path.startsWith("/")) return `${base}${path}`;
  return path; // raw filename fallback displayed as text
};

// Map players to their historic teams (order kept for display)
const playerTeams: Record<string, string[]> = {
  "BOGDÁN ERIK": ["AMÍG BEEROM"],
  "JUHÁSZ ÁRPÁD": ["KPS", "GIANTS-KPS", "B1", "KPS-FAKTOR", "SH-KPS"],
  "BENKOVICS MÁRK": ["MONEYBALL"],
  "BOGDÁN KRISZTIÁN": ["AMÍG BEEROM"],
  "BUNDSCHUH BALÁZS": ["B1", "KPS-B1"],
  "TÓTH GERGELY": ["MONEYBALL"],
  "TAKÁTS IMRE": ["GIANTS", "GIANTS-KPS"],
  "PRINCZ TAMÁS": ["ALBERTIRSAI BPC"],
  "KÁLPY MÁTYÁS": ["D-FAKTOR"],
  "BENKOVICS MÁTÉ": ["MONEYBALL"],
  "CSÁKI VIKTOR": ["BLACK LABEL"],
  "HÁTZ MILÁN": ["D-FAKTOR"],
  "TÓTH ÁDÁM": ["GIANTS", "MONEYBALL"],
  "SERES ARTÚR": ["BROMANCE"],
  "ANTAL NORBERT": ["KPS-STEELCITY"],
  "BODNÁR TAMÁS": ["KAKIMAKI"],
  "FODOR BENCE": ["HACCATÖLTELÉKEK"],
  "HEGEDŰS RÓBERT": ["TE IS FIAM, SHARK!?"],
  "JÁNDI FERENC": ["KPS-B1"],
  "JUHÁSZ DOMONKOS": ["LEVEREGYBLANT"],
  "KŐRÖSSI BALÁZS": ["CRAFTCREW"],
  "LUKÁCS ISTVÁN": ["GERI"],
  "SCHENK ARTÚR": ["HACCATÖLTELÉKEK"],
};

// Minta adat – töltsd a pontos értékekkel a képen szereplő rovátkák szerint
const rows: MVPRow[] = [
  { name: "BOGDÁN ERIK", day: 13, final: 6 },
  { name: "JUHÁSZ ÁRPÁD", day: 7, final: 1 },
  { name: "BENKOVICS MÁRK", day: 5, final: 1 },
  { name: "BOGDÁN KRISZTIÁN", day: 6, final: 0 },
  { name: "BUNDSCHUH BALÁZS", day: 6, final: 0 },
  { name: "TÓTH GERGELY", day: 3, final: 1 },
  { name: "TAKÁTS IMRE", day: 4, final: 0 },
  { name: "PRINCZ TAMÁS", day: 3, final: 0 },
  { name: "KÁLPY MÁTYÁS", day: 1, final: 1 },
  { name: "BENKOVICS MÁTÉ", day: 2, final: 0 },
  { name: "CSÁKI VIKTOR", day: 2, final: 0 },
  { name: "HÁTZ MILÁN", day: 2, final: 0 },
  { name: "TÓTH ÁDÁM", day: 2, final: 0 },
  { name: "SERES ARTÚR", day: 0, final: 1 },
  { name: "ANTAL NORBERT", day: 1, final: 0 },
  { name: "BODNÁR TAMÁS", day: 1, final: 0 },
  { name: "FODOR BENCE", day: 1, final: 0 },
  { name: "HEGEDŰS RÓBERT", day: 1, final: 0 },
  { name: "JÁNDI FERENC", day: 1, final: 0 },
  { name: "JUHÁSZ DOMONKOS", day: 1, final: 0 },
  { name: "KŐRÖSSI BALÁZS", day: 1, final: 0 },
  { name: "LUKÁCS ISTVÁN", day: 1, final: 0 },
  { name: "SCHENK ARTÚR", day: 1, final: 0 },

];

// Helper function to calculate proper rankings based on total MVP count
function calculateMVPRankings(rows: MVPRow[]): number[] {
  const rankings: number[] = [];
  let currentRank = 1;
  
  for (let i = 0; i < rows.length; i++) {
    if (i === 0) {
      rankings.push(1);
    } else {
      // Compare current total MVP count with previous total
      const currentTotal = rows[i].day + rows[i].final;
      const prevTotal = rows[i-1].day + rows[i-1].final;
      
      if (currentTotal === prevTotal) {
        // Same total, same rank
        rankings.push(rankings[i-1]);
      } else {
        // Different total, new rank (skip positions as needed)
        currentRank = i + 1;
        rankings.push(currentRank);
      }
    }
  }
  
  return rankings;
}

function Tally({ count, color = "#fff" }: { count: number; color?: string }) {
  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ backgroundColor: color }} className="inline-block h-5 w-[4px] rounded-sm" />
      ))}
    </div>
  );
}

export default function StepMVPs({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const rankings = calculateMVPRankings(rows);
  
  return (
    <div className="w-full max-w-6xl mx-auto">
      <motion.h3
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${bebasNeue.className} text-center text-[#FFDB11] text-4xl md:text-6xl mb-6`}
      >
        AZ ELITE TÖRTÉNELEM
      </motion.h3>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-white/10 bg-black/40"
      >
        <div className="grid grid-cols-12 bg-[#FFDB11]/80 text-black font-bold">
          <div className="px-4 py-4 col-span-5 text-base md:text-xl">Név</div>
          <div className="px-4 py-4 col-span-4 text-base md:text-xl text-center">Játéknap MVP</div>
          <div className="px-4 py-4 col-span-3 text-base md:text-xl text-center">Döntő MVP</div>
        </div>
        <div className="divide-y divide-white/10 max-h-[520px] overflow-y-auto">
          {rows.map((r, idx) => (
            <div key={r.name} className="grid grid-cols-12 gap-3 items-center px-3 md:px-4 py-3 hover:bg-[#FFDB11]/10 transition-colors">
              <div className={`${bebasNeue.className} col-span-5 text-white text-lg md:text-2xl flex items-center gap-2 flex-wrap`}>
                <span className="text-[#FFDB11]">{rankings[idx]}.</span> {r.name}
                <span className="flex items-center gap-1 ml-2">
                  {(playerTeams[r.name] || []).map((teamKey, i) => {
                    const path = teamLogoMap[teamKey];
                    const url = abs(path);
                    const isImage = !!path && path.startsWith("/");
                    return (
                      <span key={teamKey + i} className="inline-flex items-center">
                        {isImage ? (
                          <span className="relative h-6 w-6 overflow-hidden">
                            <Image src={url} alt={teamKey} fill sizes="24px" className="object-contain" />
                          </span>
                        ) : (
                          <span className="text-white/70 text-xs whitespace-nowrap">{path || teamKey}</span>
                        )}
                      </span>
                    );
                  })}
                </span>
              </div>
              <div className="col-span-4 flex justify-center">
                <Tally count={r.day} color="#ffffff" />
              </div>
              <div className="col-span-3 flex justify-center">
                <Tally count={r.final} color="#FFDB11" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="flex justify-between mt-6">
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-7 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold" onClick={onBack}>Vissza</motion.button>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-7 py-3 rounded-xl bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white font-bold" onClick={onNext}>Következő</motion.button>
      </div>
    </div>
  );
}



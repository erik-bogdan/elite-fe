"use client";

import { motion } from "framer-motion";
import { Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });
function formatHuDate(date?: string) {
  if (!date) return '—';
  try {
    const d = new Date(date);
    const months = ['JANUÁR', 'FEBRUÁR', 'MÁRCIUS', 'ÁPRILIS', 'MÁJUS', 'JÚNIUS', 'JÚLIUS', 'AUGUSZTUS', 'SZEPTEMBER', 'OKTÓBER', 'NOVEMBER', 'DECEMBER'];
    const m = months[d.getMonth()] || '';
    const day = String(d.getDate()).padStart(2, '0');
    return `${m} ${day}.`;
  } catch { return '—'; }
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 180, damping: 22 }}
    className={`${bebasNeue.className} text-center text-2xl md:text-4xl leading-tight`}
  >
    <span className="text-white">{label}</span>
    <span className="text-[#FFDB11]"> {value}</span>
  </motion.div>
);

export default function StepSchedule({ onBack, onNext, gameDays }: { onBack: () => void; onNext: () => void; gameDays?: Array<{ name?: string; date?: string; gameday?: boolean }> }) {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/30 border border-[#ff5c1a]/50 rounded-2xl p-6 md:p-10"
      >
        <motion.h3
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${bebasNeue.className} text-center text-[#FFDB11] text-4xl md:text-6xl mb-8`}
        >
          AZ ALAPSZAKASZ
        </motion.h3>

        <div className="space-y-3 md:space-y-4">
          {(gameDays || []).length > 0 ? (
            (gameDays || []).map((gd, idx) => (
              <Row key={idx} label={`${gd.gameday ? `GAMEDAY ${idx + 1}.:` : `${gd.name || 'ESEMÉNY'}:`}`} value={formatHuDate(gd.date)} />
            ))
          ) : (
            <>
              <Row label="GAMEDAY 1.:" value="DÁTUM NINCS MEGADVA" />
            </>
          )}
        </div>

        <div className={`${bebasNeue.className} text-center text-white/80 text-base md:text-xl mt-8`}>
          A DÁTUMOK MÉG MÓDOSULHATNAK, EZEK TERVEZETT (PÉNTEKI) JÁTÉKNAPOK.
        </div>

      </motion.div>

      <div className="flex justify-between mt-10">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-7 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold" onClick={onBack}>Vissza</motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-7 py-3 rounded-xl bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white font-bold" onClick={onNext}>Következő</motion.button>
        </div>
    </div>
  );
}



"use client";

import { motion } from "framer-motion";
import { Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });
function formatDateTime(dt?: string) {
  if (!dt) return '';
  try {
    const d = new Date(dt);
    const months = ['JANUÁR', 'FEBRUÁR', 'MÁRCIUS', 'ÁPRILIS', 'MÁJUS', 'JÚNIUS', 'JÚLIUS', 'AUGUSZTUS', 'SZEPTEMBER', 'OKTÓBER', 'NOVEMBER', 'DECEMBER'];
    const m = months[d.getMonth()] || '';
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${m} ${day}. ${hh}:${mm}`;
  } catch { return ''; }
}

const Line = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 180, damping: 22 }}
    className={`${bebasNeue.className} text-center leading-tight uppercase text-white text-xl md:text-3xl ${className}`}
  >
    {children}
  </motion.div>
);

export default function StepRegistration({ onBack, onNext, registrationClose, regfee, regfeeDueDate }: { onBack: () => void; onNext: () => void; registrationClose?: string; regfee?: string; regfeeDueDate?: string }) {
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
          A NEVEZÉS
        </motion.h3>

        <div className="">
          <Line>
            NEVEZÉS ZÁRÁSA: <span className="text-[#FFDB11]">{formatDateTime(registrationClose) || '—'}</span>
          </Line>

          <Line className="mt-4">
            A NEVEZÉSI DÍJ: <span className="text-[#FFDB11]">{regfee || '—'}</span>
          </Line>
          <Line>
            A NEVEZÉSI DÍJ BEFIZETÉSÉNEK HATÁRIDEJE: <span className="text-[#FFDB11]">{formatDateTime(regfeeDueDate) || '—'}</span>
          </Line>
          <Line>KORÁBBI ESEMÉNYEINKEN SZEMÉLYESEN, VAGY ÁTUTALÁSSAL TUDTOK NEVEZNI.</Line>
          <Line>
            UTALÁS: (ILLÉS ROLAND): <span className="text-[#FFDB11]">11600006-000000000-29816914</span> SZÁMLASZÁMRA.
          </Line>
          <Line>EBBEN AZ ESETBEN KÉRJÜK, HOGY A KÖZLEMÉNYBEN ÍRJÁTOK MEG A CSAPAT NEVÉT.</Line>
        </div>
      </motion.div>

      <div className="flex justify-between mt-10">
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-7 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold" onClick={onBack}>Vissza</motion.button>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-7 py-3 rounded-xl bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white font-bold" onClick={onNext}>Következő</motion.button>
      </div>
    </div>
  );
}



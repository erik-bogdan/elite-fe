"use client";

import { motion } from "framer-motion";
import { Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

const Line = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 180, damping: 22 }}
    className={`${bebasNeue.className} text-center leading-tight uppercase text-white text-2xl md:text-4xl`}
  >
    {children}
  </motion.div>
);

export default function StepPrizes({ onBack, onNext, championshipName, firstPrizeText, firstPrizeValue, secondPrizeText, secondPrizeValue }: { onBack: () => void; onNext: () => void; championshipName?: string; firstPrizeText?: string; firstPrizeValue?: string; secondPrizeText?: string; secondPrizeValue?: string }) {
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
          A NYEREMÉNYEK
        </motion.h3>

        <div className="space-y-8 md:space-y-10">
          <Line>
            {firstPrizeText || `A ${championshipName || 'Bajnokság'} nyertese tárgynyereményeken túl pénznyereményben részesül.`} <br />
            {firstPrizeValue ? (<span className="text-[#FFDB11]">({firstPrizeValue})</span>) : null}
          </Line>
          <Line>
            {secondPrizeText || 'A második helyezett csapat pénznyereményben részesül.'} {secondPrizeValue ? (<span className="text-[#FFDB11]">({secondPrizeValue})</span>) : null}
          </Line>
          <Line>
            MINDEN FORDULÓBAN DÍJAZZUK AZ ADOTT JÁTÉKNAP LEGJOBB JÁTÉKOSÁT, AKIT AZ <br />
            ADOTT NAPON A LEGJOBB MÉRLEGEL ZÁRÓ CSAPATBÓL VÁLASZTUNK.
          </Line>
        </div>

      
      </motion.div>
      <div className="flex justify-between mt-10">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-7 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold" onClick={onBack}>Vissza</motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-7 py-3 rounded-xl bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white font-bold" onClick={onNext}>Következő</motion.button>
        </div>
    </div>
  );
}



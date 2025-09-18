"use client";

import { motion } from "framer-motion";
import { Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

const line = (children: React.ReactNode) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 180, damping: 22 }}
    className={`${bebasNeue.className} text-center leading-tight uppercase`}
  >
    {children}
  </motion.div>
);

export default function StepSeason({ onBack, onNext, gameDayCount, hasPlayoff, elimination }: { onBack: () => void; onNext: () => void; gameDayCount?: number; hasPlayoff?: boolean; elimination?: number }) {
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
          A SZEZONRÓL
        </motion.h3>

        <div className="space-y-8 md:space-y-10">
          {line(
            <>
              <span className="text-[#FFDB11] text-2xl md:text-4xl">AZ ALAPSZAKASZT {typeof gameDayCount === 'number' ? gameDayCount : '—'} JÁTÉKNAPON JÁTSZUK</span>
              <span className="block text-white text-2xl md:text-4xl mt-2">AHOL A CSAPATOK</span>
              <span className="block text-white text-2xl md:text-4xl">ODA-VISSZAVÁGÓS, KÖRMECCSES RENDSZERBEN JÁTSZANAK.</span>
            </>
          )}

          {hasPlayoff ? (
            <>
              {line(
                <>
                  <span className="text-white text-2xl md:text-4xl">AZ ALAPSZAKASZ VÉGÉN</span>
                  <span className="block text-[#FFDB11] text-2xl md:text-4xl mt-2">A TABELLA TOP NYOLC CSAPATA JUT A RÁJÁTSZÁSBA, AHOL</span>
                  <span className="block text-[#FFDB11] text-2xl md:text-4xl">NÉGY NYERTIG TARTÓ PÁRHARCBAN KÜZDENEK</span>
                  <span className="block text-white text-2xl md:text-4xl">TOVÁBB A BAJNOKI CÍMÉRT.</span>
                </>
              )}
              {line(
                <>
                  <span className="text-white text-2xl md:text-4xl">AZ ALAPSZAKASZ VÉGÉN AZ UTOLSÓ CSAPAT BÚCSÚZIK,</span>
                  <span className="block text-[#FFDB11] text-2xl md:text-4xl mt-2">MÍG AZ UTOLSÓ ELŐTTI OSZTÁLYOZÓT JÁTSZIK</span>
                  <span className="block text-[#FFDB11] text-2xl md:text-4xl">AZ ELITE 2 MÁSODIK HELYEZETTJÉVEL.</span>
                </>
              )}
            </>
          ) : (
            line(
              <>
                <span className="text-white text-2xl md:text-4xl">AZ ALAPSZAKASZ VÉGÉN</span>
                <span className="block text-[#FFDB11] text-2xl md:text-4xl mt-2">AZ UTOLSÓ JÁTÉKNAPON ALSÓ ÉS FELSŐ HÁZRA OSZLIK A MEZŐNY,</span>
                <span className="block text-white text-2xl md:text-4xl">AHOL MINDENKI JÁTSZIK EGY ODA-VISSZA VÁGÓT.</span>
              </>
            )
          )}

        </div>
      </motion.div>

      <div className="flex justify-between mt-10">
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-7 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold" onClick={onBack}>Vissza</motion.button>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-7 py-3 rounded-xl bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white font-bold" onClick={onNext}>Következő</motion.button>
      </div>
    </div>
  );
}



"use client";

import { motion } from "framer-motion";
// state-controlled navigation via callbacks
import { Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

export default function Step2({ onNext, onBack, teamName, championshipName, subName }: { onNext: () => void; onBack: () => void; teamName?: string; championshipName?: string; subName?: string | null }) {
  return (
    <div className="w-full max-w-4xl mx-auto mt-0">
     
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-black/30 border border-[#ff5c1a]/50 rounded-2xl p-6 md:p-10"
      >
        <div className={`${bebasNeue.className} text-center leading-tight uppercase`}>
          <div className="text-[#FFDB11] text-3xl md:text-5xl mb-4">Üdv az Elite-ben{teamName ? ` ${teamName}` : ''}!</div>
          <div className="text-white text-2xl md:text-4xl mb-6">Készen álltok egy felejthetetlen sörpingpong szezonra?</div>

          <div className="text-[#FFDB11] text-xl md:text-3xl mb-6">A(z) {championshipName ? `${championshipName}${subName ? ' ' + subName : ''}` : 'ELITE'} szezonjában <br /> hazánk legjobb csapatai versengenek a bajnoki címért. </div>
          <div className="text-white text-xl md:text-3xl">A bajnokságban rutinos csapatok, és fiatal tehetségek</div>
          <div className="text-white text-xl md:text-3xl mb-6">próbálják eldönteni, hogy ki céloz a legpontosabban.</div>

          <div className="text-white text-xl md:text-3xl">Reméljük, hogy a korábbi évekhez hasonlóan</div>
          <div className="text-[#FFDB11] text-xl md:text-3xl">remek hangulatú péntek estéket töltünk majd együtt.</div>
          <div className="text-white text-xl md:text-3xl">Alig várjuk, hogy elkezdjük!</div>
        </div>

        <div className="flex justify-between mt-6">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold"
            onClick={onBack}
          >
            Vissza
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 rounded-xl bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white font-bold"
            onClick={onNext}
          >
            Következő
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}



"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

type TeamLogo = { name: string; logo?: string };
type Row = {
  season: string;
  first: TeamLogo;
  second: TeamLogo;
  third: [TeamLogo, TeamLogo];
};

const data: Row[] = [
  { season: "2014-2015", first: { name: "D-FAKTOR", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/d-faktor.png" }, second: { name: "MONEYBALL", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/moneyball.png" }, third: [{ name: "B1", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/b1.png" }, { name: "GIANTS", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/giants.png" }] },
  { season: "2015-2016", first: { name: "MONEYBALL", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/moneyball.png" }, second: { name: "ÚGYISKIFÚJNÁM", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/ugyis-kifujnam.png" }, third: [{ name: "GIANTS", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/giants.png" }, { name: "KPS", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/kps.png" }] },
  { season: "2016-2017", first: { name: "MONEYBALL", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/moneyball.png" }, second: { name: "BLACK LABEL", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/black-label.png" }, third: [{ name: "B1", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/b1.png" }, { name: "GIANTS", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/giants.png" }] },
  { season: "2017-2018", first: { name: "GIANTS-KPS", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/giants-kps.png" }, second: { name: "BROMANCE", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/bromance.png" }, third: [{ name: "B1", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/b1.png" }, { name: "MONEYBALL", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/moneyball.png" }] },
  { season: "2018-2019", first: { name: "AMÍG BEEROM", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/amig-beerom.png" }, second: { name: "B1", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/b1.png" }, third: [{ name: "LEVEREGYBLANT", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/leveregyblant.png" }, { name: "VILLÁMLOVAGOK", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/villamlovagok.png" }] },
  { season: "2019-2020", first: { name: "AMÍG BEEROM", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/amig-beerom.png" }, second: { name: "B1", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/b1.png" }, third: [{ name: "GIANTS", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/giants.png" }, { name: "LEVEREGYBLANT", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/leveregyblant.png" }] },
  { season: "2020-2021", first: { name: "BROMANCE", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/bromance.png" }, second: { name: "GIANTS", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/giants.png" }, third: [{ name: "AMÍG BEEROM", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/amig-beerom.png" }, { name: "HACCATÖLTELÉKEK", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/haccatoltelekek.png" }] },
  { season: "2021-2022", first: { name: "AMÍG BEEROM", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/amig-beerom.png" }, second: { name: "GIANTS", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/giants.png" }, third: [{ name: "LEVEREGYBLANT", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/leveregyblant.png" }, { name: "STEEL CITY", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/steel-city.png" }] },
  { season: "2022-2023", first: { name: "AMÍG BEEROM", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/amig-beerom.png" }, second: { name: "KPS-B1", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/kps-b1.png" }, third: [{ name: "ALBERTIRSAI BPC", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/albertirsaibpc.png" }, { name: "DUNNO", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/dunno.png" }] },
  { season: "2023-2024", first: { name: "AMÍG BEEROM", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/amig-beerom.png" }, second: { name: "TE IS FIAM, SHARK!?", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/te-is-fiam-shark.png" }, third: [{ name: "ALBERTIRSAI BPC", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/albertirsaibpc.png" }, { name: "DUNNO", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/dunno.png" }] },
  { season: "2024-2025", first: { name: "AMÍG BEEROM", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/amig-beerom.png" }, second: { name: "KAKIMAKI", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/kakimaki.png" }, third: [{ name: "LEVEREGYLANT", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/leveregyblant.png" }, { name: "CSICSKARÓLI", logo: process.env.NEXT_PUBLIC_BACKEND_HOST + "/uploads/history/csicskaroli.png" }] },
];

function TeamCell({ team }: { team: TeamLogo }) {
  const seed = encodeURIComponent(team.name.replace(/\s+/g, "-"));
  const src = team.logo && team.logo.trim().length > 0 ? team.logo : `https://picsum.photos/seed/${seed}/64`;
  return (
    <div className={`${bebasNeue.className} flex items-center gap-2`}>
      <div className="relative h-7 w-7 overflow-hidden border-white/20 flex-shrink-0">
        <Image src={src} alt={team.name}  sizes="" width={28} height={28} className="object-contain" />
      </div>
      <span className="text-white text-lg md:text-2xl leading-tight">{team.name}</span>
    </div>
  );
}

function ThirdCell({ a, b }: { a: TeamLogo; b: TeamLogo }) {
  const seedA = encodeURIComponent(a.name.replace(/\s+/g, "-"));
  const seedB = encodeURIComponent(b.name.replace(/\s+/g, "-"));
  const srcA = a.logo && a.logo.trim().length > 0 ? a.logo : `https://picsum.photos/seed/${seedA}/64`;
  const srcB = b.logo && b.logo.trim().length > 0 ? b.logo : `https://picsum.photos/seed/${seedB}/64`;
  return (
    <div className={`${bebasNeue.className} flex items-center gap-2`}>
      <div className="relative h-7 w-7 overflow-hidden border-white/20 flex-shrink-0">
        <Image src={srcA} alt={a.name}  sizes="" width={28} height={28} className="w-7 h-auto object-contain" />
      </div>
      <div className="relative h-7 w-7 overflow-hidden border-white/20 flex-shrink-0">
        <Image src={srcB} alt={b.name}  sizes="" width={28} height={28} className="w-7 h-auto object-contain" />
      </div>
      <span className="text-white text-lg md:text-2xl leading-tight">{a.name} / {b.name}</span>
    </div>
  );
}

export default function StepHistory({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="w-full max-w-6xl mx-auto mt-6">
      <motion.h3
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 20 }}
        className={`${bebasNeue.className} text-center text-[#FFDB11] text-4xl md:text-6xl mb-8`}
      >
        AZ ELITE TÖRTÉNELEM
      </motion.h3>

      {/* Horizontal scroll wrapper for small screens */}
      <div className="w-full overflow-x-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-w-[720px] overflow-hidden rounded-2xl border border-white/10 bg-black/40"
      >
        <div className="grid grid-cols-4 bg-[#FFDB11]/80 text-white font-bold">
          <div className="px-4 py-4 text-base md:text-xl text-[#000]">Szezon</div>
          <div className="px-4 py-4 text-base md:text-xl text-[#000]">1.</div>
          <div className="px-4 py-4 text-base md:text-xl text-[#000]">2.</div>
          <div className="px-4 py-4 text-base md:text-xl text-[#000]">3.</div>
        </div>
        <div className="divide-y divide-white/10 max-h-[560px] overflow-y-auto">
          {data.map((row, idx) => (
            <div key={row.season + idx} className="grid grid-cols-4 items-center px-4 py-4 hover:bg-[#FFDB11]/20 transition-all duration-300">
              <div className={`${bebasNeue.className} text-white text-lg md:text-2xl`}>{row.season}</div>
              <TeamCell team={row.first} />
              <TeamCell team={row.second} />
              <ThirdCell a={row.third[0]} b={row.third[1]} />
            </div>
          ))}
        </div>
      </motion.div>
      </div>

      <div className="flex justify-between mt-6">
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-7 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold" onClick={onBack}>Vissza</motion.button>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-7 py-3 rounded-xl bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white font-bold" onClick={onNext}>Következő</motion.button>
      </div>
    </div>
  );
}



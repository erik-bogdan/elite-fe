"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

type TopRow = { team: string; value: string | number; season: string };

// Map team names to their real logo files used in history
const teamLogoMap: Record<string, string> = {
  "MONEYBALL": "/uploads/history/moneyball.png",
  "KPS": "/uploads/history/kps.png",
  "AMÍG BEEROM": "/uploads/history/amig-beerom.png",
  "ALBERTIRSAI BPC": "/uploads/history/albertirsaibpc.png",
  "GIANTS": "/uploads/history/giants.png",
  "B1": "/uploads/history/b1.png",
  "GIANTS-KPS": "/uploads/history/giants-kps.png",
  "BROMANCE": "/uploads/history/bromance.png",
  "D-FAKTOR": "/uploads/history/d-faktor.png",
  "STEEL CITY": "/uploads/history/steel-city.png",
  "KPS-STEELCITY": "/uploads/history/steel-city.png",
  "KPS-B1": "/uploads/history/kps-b1.png",
  "TE IS FIAM, SHARK!?": "/uploads/history/te-is-fiam-shark.png",
  "LEVEREGYBLANT": "/uploads/history/leveregyblant.png",
  "VILLÁMLOVAGOK": "/uploads/history/villamlovagok.png",
  "DUNNO": "/uploads/history/dunno.png",
  "CSICSKARÓLI": "/uploads/history/csicskaroli.png",
  "KAKIMAKI": "/uploads/history/kakimaki.png",
};

const abs = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = (process.env.NEXT_PUBLIC_BACKEND_HOST as string) || (process.env.NEXT_PUBLIC_BACKEND_URL as string) || "http://localhost:3000";
  return `${base}${path}`;
};

const longestStreak: TopRow[] = [
  { team: "MONEYBALL", value: 17, season: "2016-2017" },
  { team: "KPS", value: 15, season: "2015-2016" },
  { team: "AMÍG BEEROM", value: 15, season: "2023-2024" },
  { team: "ALBERTIRSAI BPC", value: 14, season: "2023-2024" },
  { team: "AMÍG BEEROM", value: 14, season: "2024-2025" },
  { team: "GIANTS-KPS", value: 12, season: "2017-2018" },
  { team: "B1", value: 12, season: "2019-2020" },
  { team: "AMÍG BEEROM", value: 12, season: "2021-2022" },
  { team: "GIANTS-KPS", value: 11, season: "2017-2018" },
  { team: "AMÍG BEEROM", value: 11, season: "2024-2025" },
  /*{ team: "MONEYBALL", value: 10, season: "2017-2018" },
  { team: "AMÍG BEEROM", value: 10, season: "2018-2019" },
  { team: "AMÍG BEEROM", value: 10, season: "2020-2021" },
  { team: "SH-KPS", value: 10, season: "2021-2022" },
  { team: "ALBERTIRSAI BPC", value: 10, season: "2022-2023" },*/
];

const bestCupRatio: TopRow[] = [
  { team: "AMÍG BEEROM", value: 87, season: "2023-2024" },
  { team: "MONEYBALL", value: 82, season: "2016-2017" },
  { team: "MONEYBALL", value: 81, season: "2014-2015" },
  { team: "AMÍG BEEROM", value: 79, season: "2024-2025" },
  { team: "AMÍG BEEROM", value: 70, season: "2020-2021" },
  { team: "GIANTS-KPS", value: 69, season: "2017-2018" },
  { team: "KPS-STEELCITY", value: 69, season: "2023-2024" },
  { team: "KPS", value: 68, season: "2015-2016" },
  { team: "D-FAKTOR", value: 67, season: "2014-2015" },
  { team: "ALBERTIRSAI BPC", value: 64, season: "2023-2024" },
  /*{ team: "B1", value: 63, season: "2019-2020" },*/
];

const bestWinRate: TopRow[] = [
  { team: "AMÍG BEEROM", value: "93%", season: "2023-2024" },
  { team: "AMÍG BEEROM", value: "93%", season: "2024-2025" },
  { team: "MONEYBALL", value: "90%", season: "2016-2017" },
  { team: "GIANTS-KPS", value: "87%", season: "2017-2018" },
  { team: "ALBERTIRSAI BPC", value: "87%", season: "2023-2024" },
  { team: "AMÍG BEEROM", value: "83%", season: "2021-2022" },
  { team: "MONEYBALL", value: "80%", season: "2017-2018" },
  { team: "B1", value: "80%", season: "2019-2020" },
  { team: "KPS-STEELCITY", value: "80%", season: "2023-2024" },
  { team: "KPS", value: "77%", season: "2015-2016" },
  { team: "GIANTS", value: "77%", season: "2015-2016" },
  { team: "BROMANCE", value: "77%", season: "2017-2018" },
  { team: "AMÍG BEEROM", value: "77%", season: "2020-2021" },
  { team: "AMÍG BEEROM", value: "77%", season: "2022-2023" },
  { team: "ALBERTIRSAI BPC", value: "77%", season: "2022-2023" },
];

// Helper function to calculate proper rankings
function calculateRankings(rows: TopRow[]): number[] {
  const rankings: number[] = [];
  let currentRank = 1;
  
  for (let i = 0; i < rows.length; i++) {
    if (i === 0) {
      rankings.push(1);
    } else {
      // Compare current value with previous value
      const currentValue = typeof rows[i].value === 'string' ? parseFloat(rows[i].value.toString().replace('%', '')) : rows[i].value;
      const prevValue = typeof rows[i-1].value === 'string' ? parseFloat(rows[i-1].value.toString().replace('%', '')) : rows[i-1].value;
      
      if (currentValue === prevValue) {
        // Same value, same rank
        rankings.push(rankings[i-1]);
      } else {
        // Different value, new rank (skip positions as needed)
        currentRank = i + 1;
        rankings.push(currentRank);
      }
    }
  }
  
  return rankings;
}

function Row({ idx, row, rank }: { idx: number; row: TopRow; rank: number }) {
  const seed = encodeURIComponent(row.team.replace(/\s+/g, "-"));
  return (
    <div className="grid grid-cols-12 items-center py-2 px-2 md:px-3  hover:bg-[#FFDB11]/10 transition-colors min-w-0">
      <div className={`${bebasNeue.className} col-span-1 text-[#FFDB11] text-lg md:text-xl`}>{rank}.</div>
      <div className="col-span-6 flex items-center gap-2 min-w-0">
        <div className="relative h-[30px] w-[30px] overflow-hidden flex-shrink-0">
          <Image src={abs(teamLogoMap[row.team] || teamLogoMap[row.team.toUpperCase()] || `https://picsum.photos/seed/${seed}/64`)} alt={row.team} fill sizes="28px" className="object-contain" />
        </div>
        <div className={`${bebasNeue.className} text-white text-lg md:text-2xl truncate`}>{row.team}</div>
      </div>
      <div className={`${bebasNeue.className} col-span-2 text-white text-lg md:text-2xl text-right pr-2 md:pr-1`}>{row.value}</div>
      <div className={`${bebasNeue.className} col-span-3 text-white/80 text-sm md:text-base text-right pl-2 md:pl-2 truncate`}>{row.season}</div>
    </div>
  );
}

function Card({ title, rows }: { title: string; rows: TopRow[] }) {
  const rankings = calculateRankings(rows);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
      className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden"
    >
      <div className={`${bebasNeue.className} bg-[#FFDB11]/80 text-black text-center py-3 text-2xl md:text-3xl`}>{title}</div>
      <div className="divide-y divide-white/10 max-h-[420px] md:max-h-[520px] overflow-y-auto overflow-x-hidden pr-1 md:pr-2">
        {rows.map((r, i) => (
          <Row key={r.team + i} idx={i} row={r} rank={rankings[i]} />
        ))}
      </div>
    </motion.div>
  );
}

export default function StepTop10({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="w-full max-w-8xl mx-auto">
      <motion.h3
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${bebasNeue.className} text-center text-[#FFDB11] text-4xl md:text-6xl mb-6`}
      >
        ELITE TOP 10
      </motion.h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card title="LEGHOSSZABB GYŐZELMI SZÉRIA" rows={longestStreak} />
        <Card title="LEGJOBB POHÁRARÁNY" rows={bestCupRatio} />
        <Card title="LEGJOBB GYŐZELMI ARÁNY" rows={bestWinRate} />
      </div>

      <div className="flex justify-between mt-6">
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-7 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold" onClick={onBack}>Vissza</motion.button>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-7 py-3 rounded-xl bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white font-bold" onClick={onNext}>Következő</motion.button>
      </div>
    </div>
  );
}



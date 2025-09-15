"use client";

import { Bebas_Neue } from "next/font/google";
import SectionTitle from "./components/SectionTitle";
import Table from "./components/Table";
import HeaderSection from "./sections/HeaderSection";
import { motion, useViewportScroll, useTransform, AnimatePresence } from 'framer-motion';
import Image from "next/image";
import { useEffect, useRef, useState } from 'react';
import ChampionModal from '../components/ChampionModal';
import { useGetChampionshipsQuery, useGetLeagueTeamsQuery } from '../lib/features/championship/championshipSlice';
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

// Champions data for timeline
const championsData = [
  { 
    season: "2014-2015", 
    champion: "D-FAKTOR", 
    logo: "/uploads/history/d-faktor.png",
    championshipImage: "/uploads/history-main/1.png",
    members: ["KÁPLY MÁTYÁS", "HÁTZ MILÁN"],
    seasonSummary: "Az ELITE Beerpong első bajnoka! A D-FAKTOR csapat történelmet írt, amikor megnyerte a legelső szezont.",
    results: { wins: 8, losses: 2, cupRatio: "+67" }
  },
  { 
    season: "2015-2016", 
    champion: "MONEYBALL", 
    logo: "/uploads/history/moneyball.png",
    championshipImage: "/uploads/history-main/2.png",
    members: ["BENKOVICS MÁRK", "TÓTH GERGELY", "BENKOVICS MÁTÉ"],
    seasonSummary: "A MONEYBALL csapat domináns teljesítménnyel nyerte meg a második szezont, megalapozva a későbbi sikerüket.",
    results: { wins: 9, losses: 1, cupRatio: "+22" }
  },
  { 
    season: "2016-2017", 
    champion: "MONEYBALL", 
    logo: "/uploads/history/moneyball.png",
    championshipImage: "/uploads/history-main/3.png",
    members: ["BENKOVICS MÁRK", "TÓTH GERGELY", "BENKOVICS MÁTÉ"],
    seasonSummary: "A MONEYBALL csapat megvédte bajnoki címét, 17-es győzelmi szériával azóta megdönthetetlen rekordot felállítva.",
    results: { wins: 27, losses: 3, cupRatio: "+82" }
  },
  { 
    season: "2017-2018", 
    champion: "GIANTS-KPS", 
    logo: "/uploads/history/giants-kps.png",
    championshipImage: "/uploads/history-main/4.png",
    members: ["JUHÁSZ ÁRPÁD", "TAKÁTS IMRE", "SÜMEGI TEKLA"],
    seasonSummary: "A GIANTS-KPS egyesítette a két hatalmas csapat erejét, és megszerezte az első bajnoki címüket.",
    results: { wins: 8, losses: 2, cupRatio: "+18" }
  },
  { 
    season: "2018-2019", 
    champion: "AMÍG BEEROM", 
    logo: "/uploads/history/amig-beerom.png",
    championshipImage: "/uploads/history-main/5.png",
    members: ["ILLÉS ROLAND", "BOGDÁN ERIK", "BOGDÁN KRISZTIÁN"],
    seasonSummary: "Az AMÍG BEEROM csapat első bajnoki címe! A testvérpáros domináns teljesítménnyel nyerte meg a szezont.",
    results: { wins: 9, losses: 1, cupRatio: "+25" }
  },
  { 
    season: "2019-2020", 
    champion: "AMÍG BEEROM", 
    logo: "/uploads/history/amig-beerom.png",
    members: ["ILLÉS ROLAND", "BOGDÁN ERIK", "BOGDÁN KRISZTIÁN"],
    championshipImage: "/uploads/history-main/6.png",
    seasonSummary: "Az AMÍG BEEROM megvédte bajnoki címét, bizonyítva, hogy a legjobb csapat a ligában.",
    results: { wins: 8, losses: 2, cupRatio: "+20" }
  },
  { 
    season: "2020-2021", 
    champion: "BROMANCE", 
    logo: "/uploads/history/bromance.png",
    championshipImage: "/uploads/history-main/7.png",
    members: ["SERES ARTÚR", "SERES SAMU", "ANDÓ FÜLÖP"],
    seasonSummary: "A BROMANCE csapat meglepetés győzelmet aratott, az először döntős GIANTS csapata ellen.",
    results: { wins: 7, losses: 3, cupRatio: "+12" }
  },
  { 
    season: "2021-2022", 
    champion: "AMÍG BEEROM", 
    logo: "/uploads/history/amig-beerom.png",
    championshipImage: "/uploads/history-main/8.png",
    members: ["ILLÉS ROLAND", "BOGDÁN ERIK", "BOGDÁN KRISZTIÁN"],
    seasonSummary: "Az AMÍG BEEROM visszatért, és újra bajnok lett, bizonyítva kitartásukat és képességüket.",
    results: { wins: 9, losses: 1, cupRatio: "+24" }
  },
  { 
    season: "2022-2023", 
    champion: "AMÍG BEEROM", 
    logo: "/uploads/history/amig-beerom.png",
    championshipImage: "/uploads/history-main/9.png",
    members: ["ILLÉS ROLAND", "BOGDÁN ERIK", "BOGDÁN KRISZTIÁN"],
    seasonSummary: "Az AMÍG BEEROM negyedik bajnoki címe, megalapozva a a hosszú bajnoki győzelmi sorozatukat.",
    results: { wins: 8, losses: 2, cupRatio: "+19" }
  },
  { 
    season: "2023-2024", 
    champion: "AMÍG BEEROM", 
    logo: "/uploads/history/amig-beerom.png",
    championshipImage: "/uploads/history-main/10.png",
    members: ["ILLÉS ROLAND", "BOGDÁN ERIK", "BOGDÁN KRISZTIÁN"],
    seasonSummary: "Az AMÍG BEEROM immáron ötödik bajnoki címe a sorban! A 93%-os győzelmi aránnyal rekordot állítottak fel.",
    results: { wins: 10, losses: 0, cupRatio: "+35" }
  },
  { 
    season: "2024-2025", 
    champion: "AMÍG BEEROM", 
    logo: "/uploads/history/amig-beerom.png",
    championshipImage: "/uploads/history-main/11.png",
    members: ["ILLÉS ROLAND", "BOGDÁN ERIK", "BOGDÁN KRISZTIÁN"],
    seasonSummary: "Az AMÍG BEEROM hatodik bajnoki címe sorban! Meg tudták ismételni az előző szezonban elért 93%-os győzelmi arányt.",
    results: { wins: 9, losses: 1, cupRatio: "+31" }
  },
];

const abs = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = (process.env.NEXT_PUBLIC_BACKEND_HOST as string) || (process.env.NEXT_PUBLIC_BACKEND_URL as string) || "http://localhost:3000";
  return `${base}${path}`;
};


function CurrentTeams() {
  const { data: championships, isLoading: championshipsLoading } = useGetChampionshipsQuery();
  const [leagueTeams, setLeagueTeams] = useState<Record<string, any[]>>({});

  // Fetch teams for each league
  useEffect(() => {
    if (championships && championships.length > 0) {
      const fetchLeagueTeams = async () => {
        const teamsData: Record<string, any[]> = {};
        
        for (const championship of championships) {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/championship/teams/${championship.id}`);
            if (response.ok) {
              const teams = await response.json();
              teamsData[championship.id] = teams;
            }
          } catch (error) {
            console.error(`Error fetching teams for league ${championship.id}:`, error);
          }
        }
        
        setLeagueTeams(teamsData);
      };

      fetchLeagueTeams();
    }
  }, [championships]);

  if (championshipsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-white text-lg">Betöltés...</div>
      </div>
    );
  }

  if (!championships || championships.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-white text-lg">Nincsenek aktív bajnokságok</div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {championships.map((championship, championshipIndex) => {
        const teams = leagueTeams[championship.id] || [];
        
        return (
          <motion.div
            key={championship.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: championshipIndex * 0.2 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* League Header */}
            <div className="text-center">
              <h3 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-6xl mb-2`}>
                {championship.name}
              </h3>
              {(championship as any).subName && (
                <p className="text-white/80 text-lg md:text-xl">
                  {(championship as any).subName}
                </p>
              )}
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 md:gap-8">
              {teams.map((team, teamIndex) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: teamIndex * 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  {/* Team Logo */}
                  <div className="relative w-20 h-20 md:w-24 md:h-24 mb-3 overflow-hidden   transition-all duration-300 group-hover:scale-110">
                    <Image 
                      src={team.logo ? abs(team.logo) : "/elitelogo.png"} 
                      alt={team.name} 
                      fill
                      className="object-contain group-hover:brightness-110 transition-all duration-300"
                      sizes="96px"
                    />
                  </div>
                  
                  {/* Team Name */}
                  <div className="text-center">
                    <h4 className={`${bebasNeue.className} text-white text-sm md:text-base font-bold leading-tight group-hover:text-[#FFDB11] transition-colors duration-300`}>
                      {team.name}
                    </h4>
                  </div>
                </motion.div>
              ))}
            </div>

            {teams.length === 0 && (
              <div className="text-center py-8">
                <p className="text-white/60">Nincsenek csapatok ebben a bajnokságban</p>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function ImageCarousel() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = ['/home.png', '/home2.png', '/home3.png', '/home4.png'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative w-full aspect-[870/1209]">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentImageIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <Image 
            src={images[currentImageIndex]} 
            alt="Beerpong Player" 
            fill
            className="object-cover"
            priority={currentImageIndex === 0}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ChampionsTimeline() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(true);
  const [selectedChampion, setSelectedChampion] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [currentChampionIndex, setCurrentChampionIndex] = useState(0);

  useEffect(() => {
    if (!scrollRef.current) return;

    const scrollContainer = scrollRef.current;
    let scrollDirection = 1; // 1 for right, -1 for left
    let scrollSpeed = 1; // pixels per frame
    let animationId: number;

    const scroll = () => {
      if (!isScrolling || isDragging) {
        animationId = requestAnimationFrame(scroll);
        return;
      }

      const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
      const currentScroll = scrollContainer.scrollLeft;

      // Only scroll if there's actually content to scroll
      if (maxScroll > 0) {
        // Change direction at the ends with some buffer
        if (currentScroll >= maxScroll - 5) {
          scrollDirection = -1;
        } else if (currentScroll <= 5) {
          scrollDirection = 1;
        }

        scrollContainer.scrollLeft += scrollDirection * scrollSpeed;
      }
      
      animationId = requestAnimationFrame(scroll);
    };

    // Start scrolling after a short delay
    const startTimeout = setTimeout(() => {
      animationId = requestAnimationFrame(scroll);
    }, 1000);

    // Pause on hover
    const handleMouseEnter = () => setIsScrolling(false);
    const handleMouseLeave = () => setIsScrolling(true);

    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(startTimeout);
      cancelAnimationFrame(animationId);
      scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isScrolling, isDragging]);

  const handleChampionClick = (champion: any, index: number) => {
    setSelectedChampion(champion);
    setCurrentChampionIndex(index);
    setIsModalOpen(true);
  };

  const handlePreviousChampion = () => {
    const prevIndex = currentChampionIndex > 0 ? currentChampionIndex - 1 : championsData.length - 1;
    setCurrentChampionIndex(prevIndex);
    setSelectedChampion(championsData[prevIndex]);
  };

  const handleNextChampion = () => {
    const nextIndex = currentChampionIndex < championsData.length - 1 ? currentChampionIndex + 1 : 0;
    setCurrentChampionIndex(nextIndex);
    setSelectedChampion(championsData[nextIndex]);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedChampion(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setIsScrolling(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => setIsScrolling(true), 2000);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative">
      <ChampionModal 
        champion={selectedChampion} 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        onPrevious={handlePreviousChampion}
        onNext={handleNextChampion}
        currentIndex={currentChampionIndex}
        totalChampions={championsData.length}
      />
      <style jsx>{`
        .timeline-scroll::-webkit-scrollbar {
          display: none;
        }
        .timeline-scroll {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        .timeline-scroll * {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        .timeline-scroll img {
          pointer-events: none;
          -webkit-user-drag: none;
          -khtml-user-drag: none;
          -moz-user-drag: none;
          -o-user-drag: none;
          user-drag: none;
        }
      `}</style>
      
      
      {/* Timeline line */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#ff5c1a] via-[#FFDB11] to-[#ff5c1a] transform -translate-y-1/2"></div>
      
      <div 
        ref={scrollRef}
        className="timeline-scroll relative flex items-center overflow-x-auto overflow-y-hidden pb-8 cursor-grab active:cursor-grabbing"
        style={{ 
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {championsData.map((champion, index) => {
          const isEven = index % 2 === 0;
          const isLast = index === championsData.length - 1;
          
          return (
            <motion.div
              key={champion.season}
              initial={{ opacity: 0, y: isEven ? -50 : 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center relative min-w-[120px] md:min-w-[150px] flex-shrink-0 mx-4 md:mx-8"
            >
              {/* Champion section (above or below line) */}
              <div className={`flex flex-col items-center ${isEven ? 'mb-[130px]' : 'mb-[130px]'}`}>
                {/* Team logo */}
                <div 
                  className="relative w-16 h-16 md:w-20 md:h-20 mb-3 overflow-hidden cursor-pointer hover:scale-110 transition-transform duration-200"
                  onClick={() => handleChampionClick(champion, index)}
                >
                  <Image 
                    src={abs(champion.logo)} 
                    alt={champion.champion} 
                    fill
                    className="object-contain"
                    sizes="80px"
                  />
                </div>
                
                {/* Team name */}
                <div className={`${bebasNeue.className} text-center`}>
                  <div className="text-[#FFDB11] text-sm md:text-lg font-bold leading-tight max-w-[120px] md:max-w-[150px]">
                    {champion.champion}
                  </div>
                </div>
              </div>

              {/* Timeline dot - positioned on the line */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[-10px] w-4 h-4 bg-[#FFDB11] rounded-full border-2 border-black shadow-lg z-10"></div>

              {/* Season section (always below line) */}
              <div className="flex flex-col items-center">
                <div className={`${bebasNeue.className} text-white text-sm md:text-base font-bold  mt-[-70px]`}>
                  {champion.season}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const { scrollY } = useViewportScroll();
  // 0–300px scroll: left flex 1 → 2, jobb flex 1 → 0, opacitás 1 → 0
  const leftFlex = useTransform(scrollY, [0, 300], [1, 2]);
  const rightFlex = useTransform(scrollY, [0, 300], [1, 0]);
  const rightOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  return (
    <div>
      <div><HeaderSection /></div>
      <div className="h-[1500px] bg-black">

        <div className="container mx-auto px-4">
          <div className="w-full min-h-screen flex flex-col lg:flex-row items-center justify-center py-12 lg:py-20">
            {/* Left side - Introduction text */}
            <div className="flex-1 lg:pr-12 mb-12 lg:mb-0">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-2xl"
              >
                <SectionTitle title="ELITE Beerpong" subtitle="Európa és Magyarország legelső profi beerpong bajnoksága" />
                
                <div className="mt-8 space-y-6">
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-white text-lg md:text-xl leading-relaxed"
                  >
                    Tizenkét évvel ezelőtt néhány magyar egyetemista fejében fogant meg az ötlet, hogy a beerpongnak nemcsak a kollégiumi bulik asztalán van helye. Úgy érezték, hogy ez a játék jóval több annál, mint laza szórakozás: szabályokra, szervezettségre és versenyszellemre építve akár valódi sporttá is válhat.
                  </motion.p>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-white text-lg md:text-xl leading-relaxed"
                  >
                    Elhatározták, hogy itthon új szintre emelik a beerpongot. Először baráti versenyeket szerveztek, majd hamar kialakult egy lelkes közösség, amely már nemcsak a jó hangulatért, hanem a győzelemért és a bajnoki címért is poharat ragadott. Így indult el az a folyamat, amelynek csúcsa mára az <span className="text-[#FFDB11] font-bold">ELITE Beerpong</span>, a hazai sörpingpong legmagasabb szintű bajnoksága lett.
                  </motion.p>
                </div>
              </motion.div>
            </div>

            {/* Right side - Image Carousel */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative w-full max-w-lg lg:max-w-xl"
              >
                <div className="relative rounded-2xl overflow-hidden border-2 ">
                  <ImageCarousel />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#FFDB11] rounded-full opacity-60"></div>
                <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-[#ff5c1a] rounded-full opacity-40"></div>
                <div className="absolute top-1/2 -left-8 w-6 h-6 bg-white/20 rounded-full"></div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Champions Timeline Section */}
        <div className="w-full py-20 bg-gradient-to-b from-black to-gray-900">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <SectionTitle title="A BAJNOKOK KRONOLÓGIÁJA" subtitle="11 szezon alatt 11 különböző csapat bizonyította, hogy az ELITE Beerpong a legmagasabb szintű versenyzés otthona" />
            </motion.div>

            <ChampionsTimeline />
          </div>
        </div>

        {/* Current Teams Section */}
        <div className="w-full py-20 bg-black">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <SectionTitle title="A JELENLEGI CSAPATOK" subtitle="A 2024-2025-ös szezonban részt vevő csapatok, akik a bajnoki címért küzdenek" />
            </motion.div>

            <CurrentTeams />
          </div>
        </div>

        {/* Upcoming Matches Section */}
        <div className="w-full py-20 bg-gradient-to-b from-gray-900 to-black">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <SectionTitle title="KÖVETKEZŐ MÉRKŐZÉSEK" subtitle="A legfrissebb mérkőzések és eredmények" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center py-16"
            >
              <div className="max-w-2xl mx-auto">
                <div className="relative w-32 h-32 mx-auto mb-8 opacity-50">
                  <Image 
                    src="/elitelogo.png" 
                    alt="ELITE Logo" 
                    fill
                    className="object-contain"
                  />
                </div>
                <h3 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-4xl mb-4`}>
                  HAMAROSAN...
                </h3>
                <p className="text-white/80 text-lg md:text-xl leading-relaxed">
                  A mérkőzések és eredmények megjelenítése hamarosan elérhető lesz. 
                  <br />
                  <span className="text-[#FFDB11]">Kövess minket, hogy ne maradj le semmiről!</span>
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* League Tables Section */}
        <div className="w-full py-20 bg-black">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <SectionTitle title="TABELLA" subtitle="Az ELITE 1 és ELITE 2 bajnokságok aktuális állása" />
            </motion.div>

            <div className="relative">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Elite 1 Table */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-6 lg:p-8"
                >
                  <div className="text-center mb-8">
                    <h3 className={`${bebasNeue.className} text-[#FFDB11] text-2xl md:text-3xl mb-2`}>
                      ELITE 1
                    </h3>
                    <p className="text-white/60 text-sm md:text-base">
                    </p>
                  </div>

                  <div className="text-center py-12">
                    <div className="relative w-24 h-24 mx-auto mb-6 opacity-40">
                      <Image 
                        src="/elitelogo.png" 
                        alt="ELITE Logo" 
                        fill
                        className="object-contain"
                      />
                    </div>
                    <h4 className={`${bebasNeue.className} text-[#FFDB11] text-xl md:text-2xl mb-3`}>
                      HAMAROSAN...
                    </h4>
                    <p className="text-white/70 text-sm md:text-base">
                      A tabella adatok hamarosan elérhetőek lesznek
                    </p>
                  </div>
                </motion.div>

                {/* Elite 2 Table */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-6 lg:p-8"
                >
                  <div className="text-center mb-8">
                    <h3 className={`${bebasNeue.className} text-[#ff5c1a] text-2xl md:text-3xl mb-2`}>
                      ELITE 2
                    </h3>
                    <p className="text-white/60 text-sm md:text-base">
                    </p>
                  </div>

                  <div className="text-center py-12">
                    <div className="relative w-24 h-24 mx-auto mb-6 opacity-40">
                      <Image 
                        src="/elitelogo.png" 
                        alt="ELITE Logo" 
                        fill
                        className="object-contain"
                      />
                    </div>
                    <h4 className={`${bebasNeue.className} text-[#ff5c1a] text-xl md:text-2xl mb-3`}>
                      HAMAROSAN...
                    </h4>
                    <p className="text-white/70 text-sm md:text-base">
                      A tabella adatok hamarosan elérhetőek lesznek
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Vertical Divider */}
              <div className="hidden lg:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-3/4 bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full bg-gradient-to-b from-black via-gray-900 to-black border-t border-white/10 relative">
          {/* Top Separator */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FFDB11]/50 to-transparent"></div>
          <div className="container mx-auto px-4 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {/* Logo and Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="lg:col-span-2"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative w-16 h-16">
                    <Image 
                      src="/elitelogo.png" 
                      alt="ELITE Beerpong" 
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h3 className={`${bebasNeue.className} text-[#FFFFFF] text-2xl md:text-3xl`}>
                      ELITE Beerpong
                    </h3>
                    <p className="text-white/60 text-sm">
                      Európa és Magyarország legelső profi beerpong bajnoksága
                    </p>
                  </div>
                </div>
                <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-md">
                  Tizenkét évvel ezelőtt néhány magyar egyetemista fejében fogant meg az ötlet, 
                  hogy a beerpongnak nemcsak a kollégiumi bulik asztalán van helye.
                </p>
              </motion.div>

              {/* Quick Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <h4 className={`${bebasNeue.className} text-[#FFDB11] text-lg md:text-xl mb-4`}>
                  Gyors linkek
                </h4>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-white/70 hover:text-[#FFDB11] transition-colors text-sm md:text-base">
                      Szabályok
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-white/70 hover:text-[#FFDB11] transition-colors text-sm md:text-base">
                      Lebonyolítás
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-white/70 hover:text-[#FFDB11] transition-colors text-sm md:text-base">
                      Meccsek
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-white/70 hover:text-[#FFDB11] transition-colors text-sm md:text-base">
                      Bajnokságok
                    </a>
                  </li>
                  <li>
                    <a href="/auth/login" className="text-white/70 hover:text-[#FFDB11] transition-colors text-sm md:text-base">
                      Bejelentkezés
                    </a>
                  </li>
                </ul>
              </motion.div>

              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <h4 className={`${bebasNeue.className} text-[#FFDB11] text-lg md:text-xl mb-4`}>
                  Kapcsolat
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#ff5c1a] rounded-full"></div>
                    <span className="text-white/70 text-sm md:text-base">
                      sorpingpong@gmail.com
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#ff5c1a] rounded-full"></div>
                    <span className="text-white/70 text-sm md:text-base">
                      facebook.com/elitebeerpong
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#ff5c1a] rounded-full"></div>
                    <span className="text-white/70 text-sm md:text-base">
                      facebook.com/Sorpingpong
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#ff5c1a] rounded-full"></div>
                    <span className="text-white/70 text-sm md:text-base">
                    sorpingpong.hu
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Bottom Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="mt-12 pt-8 border-t border-white/10"
            >
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                  <p className="text-white/60 text-sm">
                    © 2025 ELITE Beerpong. Minden jog fenntartva.
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <a href="#" className="text-white/60 hover:text-[#FFDB11] transition-colors text-sm">
                    Adatvédelmi irányelvek
                  </a>
                  <a href="#" className="text-white/60 hover:text-[#FFDB11] transition-colors text-sm">
                    Felhasználási feltételek
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </footer>
        {/*<div className="w-full flex flex-col md:flex-row h-screen">
          <motion.div className="flex-[1] bg-black p-[50px] justify-center" >
          <SectionTitle title="league standings" subtitle="The section of the first and second division championship tables." />
            <div className="mt-[50px]">
              <Table records={{
                header: [
                  {column: 'pos', value: 'Position'},
                  {column: 'name', value: 'Name'},
                  {column: 'win', value: 'W'},
                  {column: 'loose', value: 'L'},
                  {column: 'cups', value: 'Cups'},
                  {column: 'points', value: 'Points'},
                ],
                rows: [
                  [
                    { column: "pos", value: "1" },
                    { column: "name", value: "Amíg BEERom" },
                    { column: "win", value: "28" },
                    { column: "loose", value: "2" },
                    { column: "cups", value: "+79" },
                    { column: "points", value: "81" }
                  ]
                ]
              }} />
            </div>
          </motion.div>
          <motion.div className="relative flex-[1] bg-[#ea303d]" >
            bbbbb
          </motion.div>
        </div>*/}
      </div>
    </div>
  );
}

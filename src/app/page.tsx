"use client";

import { Bebas_Neue } from "next/font/google";
import SectionTitle from "./components/SectionTitle";
import Table from "./components/Table";
import HeaderSection from "./sections/HeaderSection";
import { motion, useViewportScroll, useTransform, AnimatePresence } from 'framer-motion';
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChampionModal from '../components/ChampionModal';
import { useGetChampionshipsQuery, useGetLeagueTeamsQuery, useGetStandingsQuery, useGetMatchesForLeagueQuery, useGetPlayoffGroupsQuery, useGetPlayoffMatchesQuery, useGetKnockoutBracketQuery } from '../lib/features/championship/championshipSlice';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import * as Tooltip from '@radix-ui/react-tooltip';
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
  const base = (process.env.NEXT_PUBLIC_BACKEND_HOST as string) || (process.env.NEXT_PUBLIC_BACKEND_URL as string) || "http://localhost:3555";
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/api/championship/teams/${championship.id}`);
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
              <h3 className={`${bebasNeue.className} text-[#FFDB11] text-xl sm:text-2xl md:text-4xl lg:text-6xl mb-2`}>
                {championship.name}
              </h3>
              {(championship as any).subName && (
                <p className="text-white/80 text-sm sm:text-base md:text-lg lg:text-xl">
                  {(championship as any).subName}
                </p>
              )}
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 md:gap-8">
              {teams.map((team, teamIndex) => (
                <Link key={team.id} href={`/csapat/${team.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: teamIndex * 0.1 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    {/* Team Logo */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mb-2 sm:mb-3 overflow-hidden transition-all duration-300 group-hover:scale-110">
                      <Image 
                        src={team.logo ? abs(team.logo) : "/elitelogo.png"} 
                        alt={team.name} 
                        fill
                        className="object-contain group-hover:brightness-110 transition-all duration-300"
                        sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
                      />
                    </div>
                    
                    {/* Team Name */}
                    <div className="text-center">
                      <h4 className={`${bebasNeue.className} text-white text-xs sm:text-sm md:text-base font-bold leading-tight group-hover:text-[#FFDB11] transition-colors duration-300`}>
                        {team.name}
                      </h4>
                    </div>
                  </motion.div>
                </Link>
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

function ChampionshipTables() {
  const { data: championships, isLoading: championshipsLoading } = useGetChampionshipsQuery();
  const [elite1Championship, setElite1Championship] = useState<any>(null);
  const [elite2Championship, setElite2Championship] = useState<any>(null);
  const [elite1Tab, setElite1Tab] = useState<'regular' | 'playoff'>('regular');
  const [elite2Tab, setElite2Tab] = useState<'regular' | 'playoff'>('regular');
  const [elite1PlayoffRoundTab, setElite1PlayoffRoundTab] = useState<'quarter' | 'semi' | 'final'>('quarter');
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555';
  const abs = (p?: string | null) => (p ? (p.startsWith('http') ? p : `${backendBase}${p}`) : '');
  const [elite1AllMatchesIncludingPlayoff, setElite1AllMatchesIncludingPlayoff] = useState<any[]>([]);

  // Find ELITE1 and ELITE2 championships
  useEffect(() => {
    if (championships && championships.length > 0) {
      const elite1 = championships.find(c => c.name === 'ELITE' || c.name.includes('ELITE') && !c.name.includes('ELITE 2'));
      const elite2 = championships.find(c => c.name === 'ELITE 2' || c.name.includes('ELITE 2'));
      
      setElite1Championship(elite1);
      setElite2Championship(elite2);
    }
  }, [championships]);

  // Get standings for each championship
  const { data: elite1Standings, isLoading: elite1Loading } = useGetStandingsQuery(elite1Championship?.id || '', { skip: !elite1Championship?.id });
  const { data: elite2Standings, isLoading: elite2Loading } = useGetStandingsQuery(elite2Championship?.id || '', { skip: !elite2Championship?.id });
  
  // Get playoff groups and knockout bracket
  const elite1HasGroupedPlayoff = Boolean(elite1Championship?.properties?.hasPlayoff && elite1Championship?.properties?.playoffType === 'groupped');
  const elite1HasKnockoutPlayoff = Boolean(elite1Championship?.properties?.hasPlayoff && elite1Championship?.properties?.playoffType === 'knockout');
  const elite2HasPlayoff = Boolean(elite2Championship?.properties?.hasPlayoff && elite2Championship?.properties?.playoffType === 'groupped');
  const { data: elite1PlayoffGroups } = useGetPlayoffGroupsQuery(elite1Championship?.id || '', { skip: !elite1Championship?.id || !elite1HasGroupedPlayoff });
  const { data: elite2PlayoffGroups } = useGetPlayoffGroupsQuery(elite2Championship?.id || '', { skip: !elite2Championship?.id || !elite2HasPlayoff });
  const { data: elite1KnockoutBracket } = useGetKnockoutBracketQuery(elite1Championship?.id || '', { skip: !elite1Championship?.id || !elite1HasKnockoutPlayoff });
  const { data: elite1Matches } = useGetMatchesForLeagueQuery(elite1Championship?.id || '', { skip: !elite1Championship?.id });
  
  // Check if all regular season matches are completed for knockout playoff
  const elite1AllRegularMatchesCompleted = useMemo(() => {
    if (!elite1Matches || !Array.isArray(elite1Matches)) return false;
    const regularMatches = elite1Matches.filter((row: any) => !row.match?.isPlayoffMatch);
    if (regularMatches.length === 0) return false;
    return regularMatches.every((row: any) => row.match?.matchStatus === 'completed');
  }, [elite1Matches]);
  
  const elite1ShowGroupedPlayoff = elite1HasGroupedPlayoff && Boolean(elite1PlayoffGroups?.enabled && elite1PlayoffGroups?.ready);
  const elite1ShowKnockoutPlayoff = elite1HasKnockoutPlayoff && elite1AllRegularMatchesCompleted;
  const elite1ShowPlayoff = elite1ShowGroupedPlayoff || elite1ShowKnockoutPlayoff;
  const elite2ShowPlayoff = elite2HasPlayoff && Boolean(elite2PlayoffGroups?.enabled && elite2PlayoffGroups?.ready);
  
  // Fetch all matches including playoff for Elite1
  useEffect(() => {
    if (!elite1Championship?.id) {
      setElite1AllMatchesIncludingPlayoff([]);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const params = new URLSearchParams();
        params.set('leagueId', elite1Championship.id);
        params.set('playoff', 'all');
        params.set('page', '1');
        params.set('pageSize', '1000');
        const url = `${backendBase}/api/matches?${params.toString()}`;
        const resp = await fetch(url, { credentials: 'include' });
        if (resp.ok && mounted) {
          const data = await resp.json();
          setElite1AllMatchesIncludingPlayoff(data.items || []);
        } else if (mounted) {
          setElite1AllMatchesIncludingPlayoff([]);
        }
      } catch (error) {
        console.error('Failed to fetch all matches:', error);
        if (mounted) setElite1AllMatchesIncludingPlayoff([]);
      }
    })();
    return () => { mounted = false };
  }, [elite1Championship?.id, backendBase]);
  
  // Prepare knockout bracket data for Elite1
  const elite1KnockoutBracketData = useMemo(() => {
    if (!elite1HasKnockoutPlayoff || !elite1Standings?.standings || !elite1Matches) return null;
    
    const allMatches = Array.isArray(elite1Matches) ? elite1Matches : [];
    const playoffMatches = allMatches.filter((row: any) => row.match?.isPlayoffMatch);
    
    const teams = elite1Standings.standings.map((s: any, idx: number) => ({
      seed: idx + 1,
      teamId: s.teamId,
      name: s.name,
      logo: abs(s.logo),
    }));

    return { teams, playoffMatches };
  }, [elite1HasKnockoutPlayoff, elite1Standings, elite1Matches, abs]);
  
  // Create matchup structure with matches for bracket display
  const elite1KnockoutMatchupsWithMatches = useMemo(() => {
    if (!elite1KnockoutBracket || !elite1AllMatchesIncludingPlayoff || elite1AllMatchesIncludingPlayoff.length === 0) return [];
    
    const playoffMatches = elite1AllMatchesIncludingPlayoff
      .filter((row: any) => row?.match?.isPlayoffMatch === true)
      .map((row: any) => ({
        id: row.match?.id,
        homeTeamId: row.match?.homeTeamId,
        awayTeamId: row.match?.awayTeamId,
        homeScore: row.match?.homeTeamScore,
        awayScore: row.match?.awayTeamScore,
        round: row.match?.matchRound,
      }));
    
    const matchupMap = new Map<string, any[]>();
    
    playoffMatches.forEach((m: any) => {
      const teamIds = [m.homeTeamId, m.awayTeamId].sort().join('-');
      if (!matchupMap.has(teamIds)) {
        matchupMap.set(teamIds, []);
      }
      matchupMap.get(teamIds)!.push(m);
    });
    
    let currentMatchups: any[] = [];
    if (elite1PlayoffRoundTab === 'quarter') {
      currentMatchups = elite1KnockoutBracket?.quarterfinals || [];
    } else if (elite1PlayoffRoundTab === 'semi') {
      currentMatchups = elite1KnockoutBracket?.semifinals || [];
    } else if (elite1PlayoffRoundTab === 'final') {
      currentMatchups = elite1KnockoutBracket?.finals || [];
    }
    
    return currentMatchups.map((matchup: any) => {
      const teamIds = [matchup.homeTeamId, matchup.awayTeamId].sort().join('-');
      const matches = matchupMap.get(teamIds) || [];
      
      const sortedMatches = matches.sort((a: any, b: any) => {
        const aRound = a.round || 0;
        const bRound = b.round || 0;
        if (aRound !== bRound) return aRound - bRound;
        return 0;
      });
      
      return {
        ...matchup,
        matches: sortedMatches.map((m: any) => ({
          id: m.id,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          round: m.round,
        })),
      };
    });
  }, [elite1KnockoutBracket, elite1AllMatchesIncludingPlayoff, elite1PlayoffRoundTab]);
  
  // Auto-switch to playoff tab when available
  const elite1PlayoffDefaulted = useRef(false);
  useEffect(() => {
    if (elite1ShowPlayoff && !elite1PlayoffDefaulted.current) {
      setElite1Tab('playoff');
      elite1PlayoffDefaulted.current = true;
    } else if (!elite1ShowPlayoff && elite1Tab === 'playoff') {
      setElite1Tab('regular');
      elite1PlayoffDefaulted.current = false;
    }
  }, [elite1ShowPlayoff, elite1Tab]);
  
  useEffect(() => {
    if (elite2ShowPlayoff && elite2Tab === 'regular') {
      setElite2Tab('playoff');
    }
  }, [elite2ShowPlayoff]);

  if (championshipsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-white text-lg">Betöltés...</div>
      </div>
    );
  }

  // Helper function to render knockout bracket
  const renderKnockoutBracket = (bracketData: any, knockoutBracket: any, matchupsWithMatches: any[], color: string) => {
    if (!bracketData || !knockoutBracket) {
      return (
        <div className="text-center py-8 md:py-12">
          <div className="text-white/70 text-xs sm:text-sm md:text-base">
            A playoff bracket betöltése...
          </div>
        </div>
      );
    }

    let matchups: any[] = [];
    let leftSeeds: number[] = [];
    let rightSeeds: number[] = [];
    
    if (elite1PlayoffRoundTab === 'quarter') {
      matchups = knockoutBracket?.quarterfinals || [];
      leftSeeds = [1, 8, 5, 4].filter(seed => seed <= (bracketData?.teams.length || 0));
      rightSeeds = [3, 6, 7, 2].filter(seed => seed <= (bracketData?.teams.length || 0));
    } else if (elite1PlayoffRoundTab === 'semi') {
      matchups = knockoutBracket?.semifinals || [];
    } else if (elite1PlayoffRoundTab === 'final') {
      matchups = knockoutBracket?.finals || [];
    }

    const renderBracketColumn = (isLeft: boolean) => {
      const seeds = isLeft ? leftSeeds : rightSeeds;
      const splitPoint = elite1PlayoffRoundTab === 'quarter'
        ? Math.min(2, matchups.length)
        : Math.ceil(matchups.length / 2);
      const leftMatchups = matchups.slice(0, splitPoint);
      const rightMatchups = matchups.slice(splitPoint);
      const columnMatchups = isLeft ? leftMatchups : rightMatchups;
      if (columnMatchups.length === 0) {
        return (
          <div className="space-y-6">
            <div className="text-center text-white/60 text-sm py-8 border border-white/10 rounded-xl">
              Nincs párosítás
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          {columnMatchups.map((matchup: any, matchupIdx: number) => {
            const matchupWithMatches = matchupsWithMatches.find((m: any) => {
              const teamIds = [matchup.homeTeamId, matchup.awayTeamId].sort();
              const mTeamIds = [m.homeTeamId, m.awayTeamId].sort();
              return teamIds[0] === mTeamIds[0] && teamIds[1] === mTeamIds[1];
            });
            
            const homeTeam = bracketData.teams.find((t: any) => t.teamId === matchup.homeTeamId);
            const awayTeam = bracketData.teams.find((t: any) => t.teamId === matchup.awayTeamId);
            
            let pairTeam0IsHome = true;
            if (matchupWithMatches && homeTeam && awayTeam) {
              pairTeam0IsHome = matchupWithMatches.homeTeamId === homeTeam.teamId;
            }
            
            let team0Wins = 0;
            let team1Wins = 0;
            if (matchupWithMatches && matchupWithMatches.matches) {
              matchupWithMatches.matches.forEach((match: any, matchIdx: number) => {
                if (match.homeScore !== null && match.awayScore !== null) {
                  const matchNumber = matchIdx + 1;
                  const isOddMatch = matchNumber % 2 === 1;
                  const isTeam0HomeThisMatch = isOddMatch ? pairTeam0IsHome : !pairTeam0IsHome;
                  
                  if (match.homeScore > match.awayScore) {
                    if (isTeam0HomeThisMatch) team0Wins++;
                    else team1Wins++;
                  } else if (match.awayScore > match.homeScore) {
                    if (isTeam0HomeThisMatch) team1Wins++;
                    else team0Wins++;
                  }
                }
              });
            } else if (matchupWithMatches) {
              team0Wins = pairTeam0IsHome ? matchupWithMatches.homeWins : matchupWithMatches.awayWins;
              team1Wins = pairTeam0IsHome ? matchupWithMatches.awayWins : matchupWithMatches.homeWins;
            }
            
            const isAfterFirstMatchup = elite1PlayoffRoundTab === 'quarter' && matchupIdx === 0;
            
            return (
              <div key={matchupIdx} className={`relative ${isAfterFirstMatchup ? 'mb-20' : ''}`}>
                {[homeTeam, awayTeam].map((team: any, itemIndex: number) => {
                  if (!team) return null;
                  const wins = itemIndex === 0 ? team0Wins : team1Wins;
                  const isWinner = matchup.winnerId === team.teamId;
                  const seed = bracketData.teams.findIndex((t: any) => t.teamId === team.teamId) + 1;
                  
                  return (
                    <div key={itemIndex} className={`relative ${itemIndex === 0 ? 'mb-3' : ''}`}>
                      <div className={`bg-gradient-to-r ${isLeft ? 'from-[#ff5c1a]/20 via-[#ff5c1a]/10 to-transparent' : 'from-transparent via-[#ff5c1a]/10 to-[#ff5c1a]/20'} rounded-xl border-2 ${isWinner ? 'border-green-500' : 'border-[#ff5c1a]/60'} p-4 min-h-[110px] md:min-h-[90px] flex flex-col justify-center hover:border-[#ff5c1a] hover:shadow-lg hover:shadow-[#ff5c1a]/30 transition-all`}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {seed && (
                              <span className={`${bebasNeue.className} text-[#ff5c1a] font-bold text-xl flex-shrink-0`}>
                                {seed}.
                              </span>
                            )}
                            <span className={`${bebasNeue.className} text-white font-semibold text-lg md:text-xl truncate tracking-wide ${isWinner ? 'text-green-400' : ''}`}>
                              {team.name.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {matchupWithMatches && matchupWithMatches.matches && matchupWithMatches.matches.length > 0 && (
                              <span className={`${bebasNeue.className} text-3xl md:text-4xl font-bold ${wins > (itemIndex === 0 ? team1Wins : team0Wins) ? 'text-[#ff5c1a]' : 'text-white/60'}`}>
                                {wins}
                              </span>
                            )}
                            <Image 
                              src={team.logo || '/elitelogo.png'} 
                              alt={team.name} 
                              width={48} 
                              height={48} 
                              className="object-contain w-12 h-12 md:w-14 md:h-14"
                            />
                          </div>
                        </div>
                      </div>
                      {itemIndex === 0 && (
                        <>
                          {matchupWithMatches && matchupWithMatches.matches && matchupWithMatches.matches.length > 0 && (
                            <div className="pt-3">
                              <div className="flex items-center justify-center gap-2 text-sm text-white/80">
                                <span className="text-white/60">
                                  {matchupWithMatches.matches.slice(0, 7).map((match: any, matchIdx: number) => {
                                    const homeScore = match.homeScore ?? 0;
                                    const awayScore = match.awayScore ?? 0;
                                    
                                    const matchNumber = matchIdx + 1;
                                    const isOddMatch = matchNumber % 2 === 1;
                                    const isTeam0HomeThisMatch = isOddMatch ? pairTeam0IsHome : !pairTeam0IsHome;
                                    
                                    let displayScore0, displayScore1;
                                    if (isTeam0HomeThisMatch) {
                                      displayScore0 = homeScore;
                                      displayScore1 = awayScore;
                                    } else {
                                      displayScore0 = awayScore;
                                      displayScore1 = homeScore;
                                    }
                                    
                                    return (
                                      <span key={matchIdx}>
                                        {displayScore0}-{displayScore1}
                                        {matchIdx < Math.min(matchupWithMatches.matches.length, 7) - 1 ? ', ' : ''}
                                      </span>
                                    );
                                  })}
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div className="py-4">
        <div className="text-center mb-4">
          <h2 className={`${bebasNeue.className} text-2xl md:text-3xl text-white mb-2 tracking-wider`}>
            PLAYOFF
          </h2>
          <div className="flex items-center justify-center gap-2 mb-4">
            <button
              onClick={() => setElite1PlayoffRoundTab('quarter')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                elite1PlayoffRoundTab === 'quarter' 
                  ? 'bg-[#ff5c1a] text-white' 
                  : 'bg-black/40 text-white/60 hover:text-white/80 border border-[#ff5c1a]/30'
              }`}
            >
              Negyeddöntő
            </button>
            <button
              onClick={() => setElite1PlayoffRoundTab('semi')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                elite1PlayoffRoundTab === 'semi' 
                  ? 'bg-[#ff5c1a] text-white' 
                  : 'bg-black/40 text-white/60 hover:text-white/80 border border-[#ff5c1a]/30'
              }`}
            >
              Elődöntő
            </button>
            <button
              onClick={() => setElite1PlayoffRoundTab('final')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                elite1PlayoffRoundTab === 'final' 
                  ? 'bg-[#ff5c1a] text-white' 
                  : 'bg-black/40 text-white/60 hover:text-white/80 border border-[#ff5c1a]/30'
              }`}
            >
              Döntő
            </button>
          </div>
        </div>
        <div className={`grid ${elite1PlayoffRoundTab === 'final' ? 'grid-cols-1 max-w-4xl' : 'grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 lg:gap-24'} w-full max-w-6xl mx-auto`}>
          <div className={`${elite1PlayoffRoundTab === 'final' ? 'mx-auto min-w-[450px]' : ''}`}>
            {renderBracketColumn(true)}
          </div>
          {elite1PlayoffRoundTab !== 'final' && renderBracketColumn(false)}
        </div>
      </div>
    );
  };

  // Helper function to render playoff tables
  const renderPlayoffTables = (playoffGroups: any, color: string) => {
    if (!playoffGroups || (!playoffGroups.upper && !playoffGroups.lower)) {
      return (
        <div className="text-center py-8 md:py-12">
          <div className="text-white/70 text-xs sm:text-sm md:text-base">
            Még nem elérhető a playoff tabella.
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {playoffGroups.upper && playoffGroups.upper.standings && playoffGroups.upper.standings.length > 0 && (
          <div>
            <h4 className={`${bebasNeue.className} text-[${color}] text-lg sm:text-xl mb-4`}>
              Felső ház
            </h4>
            <ChampionshipTable 
              standings={playoffGroups.upper.standings}
              loading={false}
              title="Felső ház"
              color={color}
            />
          </div>
        )}
        {playoffGroups.lower && playoffGroups.lower.standings && playoffGroups.lower.standings.length > 0 && (
          <div>
            <h4 className={`${bebasNeue.className} text-[${color}] text-lg sm:text-xl mb-4`}>
              Alsó ház
            </h4>
            <ChampionshipTable 
              standings={playoffGroups.lower.standings.map((s: any, idx: number) => ({
                ...s,
                rank: (playoffGroups.upper?.standings?.length || 0) + idx + 1
              }))}
              loading={false}
              title="Alsó ház"
              color={color}
            />
          </div>
        )}
      </div>
    );
  };

  // Custom table component for championship standings with logos
  const ChampionshipTable = ({ standings, loading, title, color, subName }: { 
    standings: any[], 
    loading: boolean, 
    title: string, 
    color: string, 
    subName?: string 
  }) => {
    if (loading) {
      return (
        <div className="text-center py-8 md:py-12">
          <div className="text-white/70">Betöltés...</div>
        </div>
      );
    }

    if (!standings || standings.length === 0) {
      return (
        <div className="text-center py-8 md:py-12">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 opacity-40">
            <Image 
              src="/elitelogo.png" 
              alt="ELITE Logo" 
              fill
              className="object-contain"
            />
          </div>
          <h4 className={`${bebasNeue.className} text-[${color}] text-lg sm:text-xl md:text-2xl mb-2 md:mb-3`}>
            HAMAROSAN...
          </h4>
          <p className="text-white/70 text-xs sm:text-sm md:text-base">
            A tabella adatok hamarosan elérhetőek lesznek
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full rounded-2xl bg-black/40 shadow-xl border-2 border-[#ff5c1a] text-xs overflow-hidden">
          <thead>
            <tr className="bg-[#ff5c1a] text-white font-bold">
              <th className={`${bebasNeue.className} px-3 py-3 text-left font-bold whitespace-nowrap rounded-tl-2xl`}>
                #
              </th>
              <th className={`${bebasNeue.className} px-3 py-3 text-left font-bold whitespace-nowrap`}>
                Csapat
              </th>
              <th className={`${bebasNeue.className} px-3 py-3 text-center font-bold whitespace-nowrap`}>
                M
              </th>
              <th className={`${bebasNeue.className} px-3 py-3 text-center font-bold whitespace-nowrap`}>
                GY
              </th>
              <th className={`${bebasNeue.className} px-3 py-3 text-center font-bold whitespace-nowrap`}>
                V
              </th>
              <th className={`${bebasNeue.className} px-3 py-3 text-center font-bold whitespace-nowrap`}>
                Különbség
              </th>
                      <th className={`${bebasNeue.className} px-3 py-3 text-center font-bold whitespace-nowrap`}>
                        Pont
                      </th>
                      <th className={`${bebasNeue.className} px-3 py-3 text-center font-bold whitespace-nowrap rounded-tr-2xl`}>
                        Forma
                      </th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team: any, index: number) => (
              <tr
                key={team.teamId || index}
                className={`${index % 2 === 0 ? 'bg-white/10 text-white' : 'bg-white/5 text-white'} transition hover:shadow-[0_0_16px_0_#ff5c1a99] hover:z-10 h-12`}
              >
                <td className="px-3 py-3 font-bold text-[#ff5c1a] whitespace-nowrap">
                  {team.rank || index + 1}
                </td>
                <td className="px-3 py-3">
                  <Link href={`/csapat/${team.teamId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="relative w-8 h-8 flex-shrink-0">
                      <Image 
                        src={team.logo ? abs(team.logo) : "/elitelogo.png"} 
                        alt={team.name} 
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="font-medium truncate">{team.name}</span>
                  </Link>
                </td>
                <td className="px-3 py-3 text-center">
                  {team.games || 0}
                </td>
                <td className="px-3 py-3 text-center">
                  {team.winsTotal || 0}
                </td>
                <td className="px-3 py-3 text-center">
                  {team.lossesTotal || 0}
                </td>
                <td className="px-3 py-3 text-center">
                  {team.cupDiff || 0}
                </td>
                <td className="px-3 py-3 text-center font-bold">
                  {team.points || 0}
                </td>
                        <td className="px-3 py-3 text-center">
                          <Tooltip.Provider delayDuration={100}>
                            <div className="flex justify-center gap-1">
                              {team.form?.slice(-5).map((result: string, idx: number) => {
                                // Get match details for tooltip and overtime detection
                                const matchIndex = team.recentMatches ? team.recentMatches.length - 5 + idx : -1;
                                const matchDetails = team.recentMatches && matchIndex >= 0 && matchIndex < team.recentMatches.length ? team.recentMatches[matchIndex] : null;
                                
                                // Check if it's overtime based on score
                                let isOvertime = false;
                                if (matchDetails && matchDetails.score) {
                                  const [homeScore, awayScore] = matchDetails.score.split('-').map(Number);
                                  const maxScore = Math.max(homeScore, awayScore);
                                  const minScore = Math.min(homeScore, awayScore);
                                  isOvertime = maxScore > 10 && minScore >= 10;
                                }
                                
                                const getFormText = (result: string) => {
                                  if (result === 'W') return isOvertime ? 'GYH' : 'GY';
                                  if (result === 'L') return isOvertime ? 'VH' : 'V';
                                  return result;
                                };
                                
                                const tooltipText = matchDetails 
                                  ? `${matchDetails.opponent} ${matchDetails.score} (${matchDetails.date})`
                                  : result === 'W' ? 'Győzelem' : result === 'L' ? 'Vereség' : result === 'D' ? 'Döntetlen' : 'Ismeretlen';
                                
                                const color = result === 'W' 
                                  ? (isOvertime ? 'bg-green-600/60' : 'bg-green-600') 
                                  : result === 'L' 
                                    ? (isOvertime ? 'bg-red-600/60' : 'bg-red-600') 
                                    : 'bg-gray-600';
                                
                                return (
                                  <Tooltip.Root key={idx}>
                                    <Tooltip.Trigger asChild>
                                      <button type="button" className={`inline-flex items-center justify-center rounded ${color} text-[8px] leading-none w-5 h-5 sm:w-6 sm:h-6 text-white`}>
                                        {getFormText(result)}
                                      </button>
                                    </Tooltip.Trigger>
                                    <Tooltip.Content side="top" sideOffset={6} className="rounded bg-black/80 text-white text-xs px-2 py-1 shadow whitespace-pre-line">
                                      {tooltipText}
                                      <Tooltip.Arrow className="fill-black/80" />
                                    </Tooltip.Content>
                                  </Tooltip.Root>
                                );
                              })}
                            </div>
                          </Tooltip.Provider>
                        </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
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
          <div className="text-center mb-6 md:mb-8">
            <h3 className={`${bebasNeue.className} text-[#FFDB11] text-xl sm:text-2xl md:text-3xl mb-2`}>
              ELITE 1
            </h3>
            <p className="text-white/60 text-xs sm:text-sm md:text-base">
              {elite1Championship?.subName || ''}
            </p>
          </div>

          {/* Tab Switcher */}
          {(elite1ShowPlayoff || elite1ShowKnockoutPlayoff) && (
            <div className="flex items-center justify-center mb-6">
              <div className="flex space-x-2 bg-black/40 rounded-lg p-1 border border-[#FFDB11]/30">
                <button
                  onClick={() => setElite1Tab('regular')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    elite1Tab === 'regular' ? 'bg-[#FFDB11] text-black' : 'bg-transparent text-white/70 hover:bg-black/60'
                  }`}
                >
                  Alapszakasz
                </button>
                <button
                  onClick={() => setElite1Tab('playoff')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    elite1Tab === 'playoff' ? 'bg-[#FFDB11] text-black' : 'bg-transparent text-white/70 hover:bg-black/60'
                  }`}
                >
                  Playoff
                </button>
              </div>
            </div>
          )}

          {elite1Tab === 'regular' ? (
            <ChampionshipTable 
              standings={elite1Standings?.standings || []}
              loading={elite1Loading}
              title="ELITE 1"
              color="#FFDB11"
              subName={elite1Championship?.subName}
            />
          ) : elite1ShowKnockoutPlayoff ? (
            renderKnockoutBracket(elite1KnockoutBracketData, elite1KnockoutBracket, elite1KnockoutMatchupsWithMatches, '#FFDB11')
          ) : (
            renderPlayoffTables(elite1PlayoffGroups, '#FFDB11')
          )}
          
          {/* Detailed Table Button */}
          {elite1Championship && (
            <div className="mt-6 text-center">
              <a
                href={`/tabella/${elite1Championship.id}`}
                className="inline-block bg-[#FFDB11] hover:bg-[#FFDB11]/80 text-black font-bold py-3 px-6 rounded-lg transition-colors duration-300"
              >
                Részletes tabella
              </a>
            </div>
          )}
        </motion.div>

        {/* Elite 2 Table */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-6 lg:p-8"
        >
          <div className="text-center mb-6 md:mb-8">
            <h3 className={`${bebasNeue.className} text-[#ff5c1a] text-xl sm:text-2xl md:text-3xl mb-2`}>
              ELITE 2
            </h3>
            <p className="text-white/60 text-xs sm:text-sm md:text-base">
              {elite2Championship?.subName || ''}
            </p>
          </div>

          {/* Tab Switcher */}
          {elite2ShowPlayoff && (
            <div className="flex items-center justify-center mb-6">
              <div className="flex space-x-2 bg-black/40 rounded-lg p-1 border border-[#ff5c1a]/30">
                <button
                  onClick={() => setElite2Tab('regular')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    elite2Tab === 'regular' ? 'bg-[#ff5c1a] text-white' : 'bg-transparent text-white/70 hover:bg-black/60'
                  }`}
                >
                  Alapszakasz
                </button>
                <button
                  onClick={() => setElite2Tab('playoff')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    elite2Tab === 'playoff' ? 'bg-[#ff5c1a] text-white' : 'bg-transparent text-white/70 hover:bg-black/60'
                  }`}
                >
                  Playoff
                </button>
              </div>
            </div>
          )}

          {elite2Tab === 'regular' ? (
            <ChampionshipTable 
              standings={elite2Standings?.standings || []}
              loading={elite2Loading}
              title="ELITE 2"
              color="#ff5c1a"
              subName={elite2Championship?.subName}
            />
          ) : (
            renderPlayoffTables(elite2PlayoffGroups, '#ff5c1a')
          )}
          
          {/* Detailed Table Button */}
          {elite2Championship && (
            <div className="mt-6 text-center">
              <a
                href={`/tabella/${elite2Championship.id}`}
                className="inline-block bg-[#ff5c1a] hover:bg-[#ff5c1a]/80 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300"
              >
                Részletes tabella
              </a>
            </div>
          )}
        </motion.div>
      </div>

      {/* Vertical Divider */}
      <div className="hidden lg:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-3/4 bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>
    </div>
  );
}

function UpcomingMatches() {
  const { data: championships, isLoading: championshipsLoading } = useGetChampionshipsQuery();
  const [elite1Championship, setElite1Championship] = useState<any>(null);
  const [elite2Championship, setElite2Championship] = useState<any>(null);

  // Find ELITE1 and ELITE2 championships
  useEffect(() => {
    if (championships && championships.length > 0) {
      const elite1 = championships.find(c => c.name === 'ELITE' || c.name.includes('ELITE') && !c.name.includes('ELITE 2'));
      const elite2 = championships.find(c => c.name === 'ELITE 2' || c.name.includes('ELITE 2'));
      
      setElite1Championship(elite1);
      setElite2Championship(elite2);
    }
  }, [championships]);

  const { data: elite1Matches } = useGetMatchesForLeagueQuery(elite1Championship?.id || '', { skip: !elite1Championship?.id });
  const { data: elite2Matches } = useGetMatchesForLeagueQuery(elite2Championship?.id || '', { skip: !elite2Championship?.id });
  
  // Get playoff matches
  const elite1HasPlayoff = Boolean(elite1Championship?.properties?.hasPlayoff && elite1Championship?.properties?.playoffType === 'groupped');
  const elite2HasPlayoff = Boolean(elite2Championship?.properties?.hasPlayoff && elite2Championship?.properties?.playoffType === 'groupped');
  const { data: elite1PlayoffMatches } = useGetPlayoffMatchesQuery(elite1Championship?.id || '', { skip: !elite1Championship?.id || !elite1HasPlayoff });
  const { data: elite2PlayoffMatches } = useGetPlayoffMatchesQuery(elite2Championship?.id || '', { skip: !elite2Championship?.id || !elite2HasPlayoff });
  
  // Normalize playoff matches to match regular match format
  const normalizePlayoffMatches = (playoffMatches: any) => {
    if (!playoffMatches) return [];
    const upper = Array.isArray(playoffMatches.upper) ? playoffMatches.upper : [];
    const lower = Array.isArray(playoffMatches.lower) ? playoffMatches.lower : [];
    return [...upper, ...lower].map((m: any) => ({
      match: {
        id: m.id,
        homeTeamId: m.home?.id,
        awayTeamId: m.away?.id,
        homeTeamScore: m.home?.score ?? 0,
        awayTeamScore: m.away?.score ?? 0,
        matchAt: m.matchAt,
        matchDate: m.matchAt,
        matchStatus: m.status,
        matchType: 'playoff',
        isPlayoffMatch: true,
        matchRound: m.round,
        gameDay: m.gameDay,
        matchTable: m.table,
      },
      homeTeam: { id: m.home?.id, name: m.home?.name, logo: m.home?.logo },
      awayTeam: { id: m.away?.id, name: m.away?.name, logo: m.away?.logo },
    }));
  };
  
  const elite1AllMatches = useMemo(() => {
    const regular = Array.isArray(elite1Matches) ? elite1Matches : [];
    const playoff = normalizePlayoffMatches(elite1PlayoffMatches);
    return [...regular, ...playoff];
  }, [elite1Matches, elite1PlayoffMatches]);
  
  const elite2AllMatches = useMemo(() => {
    const regular = Array.isArray(elite2Matches) ? elite2Matches : [];
    const playoff = normalizePlayoffMatches(elite2PlayoffMatches);
    return [...regular, ...playoff];
  }, [elite2Matches, elite2PlayoffMatches]);

  const getUpcomingMatches = (matches: any[]) => {
    if (!matches) return [];
    
    const now = new Date();
    return matches
      .filter((match: any) => {
        const matchDate = new Date(match.match.matchAt || match.match.matchDate);
        return matchDate > now && match.match.matchStatus === 'scheduled';
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.match.matchAt || a.match.matchDate);
        const dateB = new Date(b.match.matchAt || b.match.matchDate);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5);
  };

  const getPreviousMatches = (matches: any[]) => {
    if (!matches) return [];
    
    const now = new Date();
    return matches
      .filter((match: any) => {
        const matchDate = new Date(match.match.matchAt || match.match.matchDate);
        return matchDate <= now && match.match.matchStatus === 'completed';
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.match.matchAt || a.match.matchDate);
        const dateB = new Date(b.match.matchAt || b.match.matchDate);
        return dateB.getTime() - dateA.getTime(); // Reverse order for recent first
      })
      .slice(0, 5);
  };

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Budapest'
    });
  };

  const MatchCard = ({ match, showScore = false }: { match: any, showScore?: boolean }) => {
    const router = useRouter();
    
    const handleTeamClick = (e: React.MouseEvent, teamId: string) => {
      e.preventDefault();
      e.stopPropagation();
      router.push(`/csapat/${teamId}`);
    };
    
    const isTracked = match.match.trackingActive === 2 || (match.match.trackingData && Object.keys(match.match.trackingData).length > 0);
    const isCompleted = match.match.matchStatus === 'completed';
    
    return (
      <Link href={`/merkozes/${match.match.id}`} className="relative bg-black/40 rounded-xl p-3 border border-white/10 hover:border-white/20 transition-colors block">
        {/* Tracking badge for completed matches with tracking */}
        {isCompleted && isTracked && (
          <div className="absolute -top-3 right-4 z-10">
            <div className="px-2 py-1 rounded text-xs font-semibold whitespace-nowrap bg-green-600/90 text-white flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              TRACKELT
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <div onClick={(e) => handleTeamClick(e, match.homeTeam?.id || '')} className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity cursor-pointer w-full sm:w-auto">
            <div className="flex-shrink-0 w-8 h-8 sm:w-6 sm:h-6 relative">
              {match.homeTeam?.logo ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}${match.homeTeam.logo}`}
                  alt={match.homeTeam.name}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="w-8 h-8 sm:w-6 sm:h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white">?</span>
                </div>
              )}
            </div>
            <span className="text-white text-sm font-medium truncate">{match.homeTeam?.name || 'Ismeretlen'}</span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 flex-shrink-0">
            {showScore && match.match.homeTeamScore !== null && (
              <span className="text-[#ff5c1a] text-base sm:text-lg font-bold bg-[#ff5c1a]/10 px-2 sm:px-3 py-1 rounded">{match.match.homeTeamScore}</span>
            )}
            <span className="text-white/50 text-xs">VS</span>
            {showScore && match.match.awayTeamScore !== null && (
              <span className="text-[#ff5c1a] text-base sm:text-lg font-bold bg-[#ff5c1a]/10 px-2 sm:px-3 py-1 rounded">{match.match.awayTeamScore}</span>
            )}
          </div>
          
          <div onClick={(e) => handleTeamClick(e, match.awayTeam?.id || '')} className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 justify-end sm:justify-end hover:opacity-80 transition-opacity cursor-pointer w-full sm:w-auto">
            <span className="text-white text-sm font-medium truncate">{match.awayTeam?.name || 'Ismeretlen'}</span>
            <div className="flex-shrink-0 w-8 h-8 sm:w-6 sm:h-6 relative">
              {match.awayTeam?.logo ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}${match.awayTeam.logo}`}
                  alt={match.awayTeam.name}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="w-8 h-8 sm:w-6 sm:h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white">?</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="text-center mt-2">
          <div className="text-white/60 text-xs">
            {formatMatchDate(match.match.matchAt || match.match.matchDate)}
          </div>
          <div className="text-white/40 text-xs">
            Játéknap {match.match.gameDay || '?'}
          </div>
        </div>
      </Link>
    );
  };

  const UpcomingMatchesTable = ({ matches, title, color, championshipId }: { 
    matches: any[], 
    title: string, 
    color: string,
    championshipId: string
  }) => {
    const upcomingMatches = getUpcomingMatches(matches);
    const previousMatches = getPreviousMatches(matches);

    return (
      <div className="mb-8">
        <h3 className={`${bebasNeue.className} text-2xl md:text-3xl mb-6 text-white`}>
          {title}
        </h3>
        
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Előző mérkőzések */}
            <div className="lg:pr-4">
              <h4 className={`${bebasNeue.className} text-lg mb-4 text-white/80`}>
                Előző 5 mérkőzés
              </h4>
              <div className="space-y-3">
                {previousMatches.length > 0 ? (
                  previousMatches.map((match: any) => (
                    <MatchCard key={match.match.id} match={match} showScore={true} />
                  ))
                ) : (
                  <div className="bg-black/40 rounded-xl p-4 border border-white/10 text-center">
                    <p className="text-white/70 text-sm">Nincs befejezett mérkőzés</p>
                  </div>
                )}
              </div>
            </div>

            {/* Következő mérkőzések */}
            <div className="lg:pl-4">
              <h4 className={`${bebasNeue.className} text-lg mb-4 text-white/80`}>
                Következő 5 mérkőzés
              </h4>
              <div className="space-y-3">
                {upcomingMatches.length > 0 ? (
                  upcomingMatches.map((match: any) => (
                    <MatchCard key={match.match.id} match={match} showScore={false} />
                  ))
                ) : (
                  <div className="bg-black/40 rounded-xl p-4 border border-white/10 text-center">
                    <p className="text-white/70 text-sm">Nincs ütemezett mérkőzés</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Választó vonal - csak desktop-on */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent transform -translate-x-1/2"></div>
        </div>
        
        {/* További mérkőzések gomb */}
        <div className="mt-6 text-center">
          <a
            href={`/merkozesek/${championshipId}`}
            className="inline-flex items-center gap-2 bg-[#ff5c1a] hover:bg-[#ff5c1a]/80 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            További mérkőzések
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    );
  };

  if (championshipsLoading) {
    return (
      <div className="mb-8">
        <h3 className={`${bebasNeue.className} text-2xl md:text-3xl mb-4 text-white`}>
          Következő mérkőzések
        </h3>
        <div className="bg-black/40 rounded-2xl p-6 border-2 border-white/10">
          <div className="animate-pulse">
            <div className="h-4 bg-white/20 rounded mb-2"></div>
            <div className="h-4 bg-white/20 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {elite1Championship && (
        <UpcomingMatchesTable 
          matches={elite1AllMatches}
          title="ELITE"
          color="#ff5c1a"
          championshipId={elite1Championship.id}
        />
      )}
      {elite2Championship && (
        <UpcomingMatchesTable 
          matches={elite2AllMatches}
          title="ELITE 2"
          color="#ff5c1a"
          championshipId={elite2Championship.id}
        />
      )}
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
  const [selectedChampion, setSelectedChampion] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPosition, setScrollLeftPosition] = useState(0);
  const [currentChampionIndex, setCurrentChampionIndex] = useState(0);

  // Navigation functions
  const scrollLeft = () => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8; // Scroll 80% of visible width
      scrollRef.current.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8; // Scroll 80% of visible width
      scrollRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftPosition(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeftPosition - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeftPosition(scrollRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Slower on mobile
    scrollRef.current.scrollLeft = scrollLeftPosition - walk;
  };

  const handleTouchEnd = () => {
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
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#ff5c1a] via-[#FFDB11] to-[#ff5c1a] transform -translate-y-1/2 mt-[-42px]"></div>
      
      <div 
        ref={scrollRef}
        className="timeline-scroll relative flex items-center overflow-x-auto overflow-y-hidden pb-8 cursor-grab active:cursor-grabbing"
        style={{ 
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
              className="flex flex-col items-center relative min-w-[100px] sm:min-w-[120px] md:min-w-[150px] flex-shrink-0 mx-2 sm:mx-4 md:mx-8"
            >
              {/* Champion section (above or below line) */}
              <div className={`flex flex-col items-center ${isEven ? 'mb-[100px] sm:mb-[130px]' : 'mb-[100px] sm:mb-[130px]'}`}>
                {/* Team logo */}
                <div 
                  className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mb-2 sm:mb-3 overflow-hidden cursor-pointer hover:scale-110 transition-transform duration-200"
                  onClick={() => handleChampionClick(champion, index)}
                >
                  <Image 
                    src={abs(champion.logo)} 
                    alt={champion.champion} 
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 48px, (max-width: 768px) 64px, 80px"
                  />
                </div>
                
                {/* Team name */}
                <div className={`${bebasNeue.className} text-center`}>
                  <div className="text-[#FFDB11] text-xs sm:text-sm md:text-lg font-bold leading-tight max-w-[100px] sm:max-w-[120px] md:max-w-[150px]">
                    {champion.champion}
                  </div>
                </div>
              </div>

              {/* Timeline dot - positioned on the line */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[-10px] w-3 h-3 sm:w-4 sm:h-4 bg-[#FFDB11] rounded-full border-2 border-black shadow-lg z-10"></div>

              {/* Season section (always below line) */}
              <div className="flex flex-col items-center">
                <div className={`${bebasNeue.className} text-white text-xs sm:text-sm md:text-base font-bold mt-[-60px] sm:mt-[-70px]`}>
                  {champion.season}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation arrows */}
      <div className="flex justify-center items-center gap-8 mt-8">
        <button
          onClick={scrollLeft}
          className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-[#FFDB11] hover:bg-[#FFDB11]/80 text-black rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
          aria-label="Previous champions"
        >
          <FiChevronLeft size={24} />
        </button>
        
        <div className="text-center">
          <p className={`${bebasNeue.className} text-white text-sm sm:text-base`}>
            Lapozz a bajnokok között
          </p>
        </div>
        
        <button
          onClick={scrollRight}
          className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-[#FFDB11] hover:bg-[#FFDB11]/80 text-black rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
          aria-label="Next champions"
        >
          <FiChevronRight size={24} />
        </button>
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
                
                <div className="mt-6 md:mt-8 space-y-4 md:space-y-6">
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-white text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed"
                  >
                    Tizenkét évvel ezelőtt néhány magyar egyetemista fejében fogant meg az ötlet, hogy a beerpongnak nemcsak a kollégiumi bulik asztalán van helye. Úgy érezték, hogy ez a játék jóval több annál, mint laza szórakozás: szabályokra, szervezettségre és versenyszellemre építve akár valódi sporttá is válhat.
                  </motion.p>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-white text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed"
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
        <div className="w-full py-20 bg-black">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <SectionTitle title="KÖVETKEZŐ MÉRKŐZÉSEK" subtitle="Az ELITE 1 és ELITE 2 bajnokságok következő 5 mérkőzése" />
            </motion.div>

            <UpcomingMatches />
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

            <ChampionshipTables />
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
                    <h3 className={`${bebasNeue.className} text-[#FFFFFF] text-xl sm:text-2xl md:text-3xl`}>
                      ELITE Beerpong
                    </h3>
                    <p className="text-white/60 text-xs sm:text-sm">
                      Európa és Magyarország legelső profi beerpong bajnoksága
                    </p>
                  </div>
                </div>
                <p className="text-white/70 text-xs sm:text-sm md:text-base leading-relaxed max-w-md">
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
                <h4 className={`${bebasNeue.className} text-[#FFDB11] text-base sm:text-lg md:text-xl mb-3 md:mb-4`}>
                  Gyors linkek
                </h4>
                <ul className="space-y-2 md:space-y-3">
                  <li>
                    <a href="#" className="text-white/70 hover:text-[#FFDB11] transition-colors text-xs sm:text-sm md:text-base">
                      Szabályok
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-white/70 hover:text-[#FFDB11] transition-colors text-xs sm:text-sm md:text-base">
                      Lebonyolítás
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-white/70 hover:text-[#FFDB11] transition-colors text-xs sm:text-sm md:text-base">
                      Meccsek
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-white/70 hover:text-[#FFDB11] transition-colors text-xs sm:text-sm md:text-base">
                      Bajnokságok
                    </a>
                  </li>
                  <li>
                    <a href="/auth/login" className="text-white/70 hover:text-[#FFDB11] transition-colors text-xs sm:text-sm md:text-base">
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
                <h4 className={`${bebasNeue.className} text-[#FFDB11] text-base sm:text-lg md:text-xl mb-3 md:mb-4`}>
                  Kapcsolat
                </h4>
                <div className="space-y-2 md:space-y-3">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#ff5c1a] rounded-full flex-shrink-0"></div>
                    <span className="text-white/70 text-xs sm:text-sm md:text-base">
                      sorpingpong@gmail.com
                    </span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#ff5c1a] rounded-full flex-shrink-0"></div>
                    <span className="text-white/70 text-xs sm:text-sm md:text-base">
                      facebook.com/elitebeerpong
                    </span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#ff5c1a] rounded-full flex-shrink-0"></div>
                    <span className="text-white/70 text-xs sm:text-sm md:text-base">
                      facebook.com/Sorpingpong
                    </span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#ff5c1a] rounded-full flex-shrink-0"></div>
                    <span className="text-white/70 text-xs sm:text-sm md:text-base">
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
              <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
                <div className="text-center md:text-left">
                  <p className="text-white/60 text-xs sm:text-sm">
                    © 2025 ELITE Beerpong. Minden jog fenntartva.
                  </p>
                </div>
                <div className="flex items-center gap-4 md:gap-6">
                  <a href="#" className="text-white/60 hover:text-[#FFDB11] transition-colors text-xs sm:text-sm">
                    Adatvédelmi irányelvek
                  </a>
                  <a href="#" className="text-white/60 hover:text-[#FFDB11] transition-colors text-xs sm:text-sm">
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

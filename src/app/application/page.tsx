"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from 'framer-motion';
import Table from "../components/Table";
import { Bebas_Neue } from "next/font/google";
import UpcomingMatchCard from "../components/UpcomingMatchCard";
import EnterResultModal from "../components/EnterResultModal";
import { authClient } from "../lib/auth-client";
import { useGetMyLeagueQuery } from "@/lib/features/apiSlice";
import { useGetChampionshipByIdQuery, useGetMatchesForLeagueQuery, useGetStandingsQuery, useGetMatchMetaQuery, useUpdateMatchResultMutation } from "@/lib/features/championship/championshipSlice";
import { useGetActiveInviteQuery } from "@/lib/features/apiSlice";
import { useRouter } from "next/navigation";

const bebasNeue = Bebas_Neue({
    weight: "400",
    subsets: ["latin"],
});

// helper to parse date from backend fields
const parseMatchDate = (row: any): Date | null => {
  const at = row?.match?.matchAt || row?.match?.matchDate || null;
  if (!at) return null;
  try { return new Date(at); } catch { return null; }
};

export default function DashboardPage() {
  const router = useRouter();
  const [checkingInvite, setCheckingInvite] = useState(true);
  // user → my league/team
  const { data: myLeague } = useGetMyLeagueQuery();
  const leagueId = myLeague?.leagueId;
  const myTeamId = myLeague?.teamId;
  const { data: championship } = useGetChampionshipByIdQuery(leagueId!, { skip: !leagueId });
  const { data: leagueMatches } = useGetMatchesForLeagueQuery(leagueId!, { skip: !leagueId });
  const { data: standings } = useGetStandingsQuery(leagueId!, { skip: !leagueId || !championship?.isStarted });
  const { data: activeInvite, isLoading: isLoadingActiveInvite } = useGetActiveInviteQuery();

  // my standings row
  const myRow = useMemo(() => {
    const list = standings?.standings || [];
    return list.find((s: any) => s.teamId === myTeamId) || null;
  }, [standings, myTeamId]);

  // build mini standings rows for table
  const miniTable = useMemo(() => {
    const list = standings?.standings || [];
    return list.map((s: any, idx: number) => ([
      { column: 'pos', value: String(s.rank) },
      { column: 'name', value: String(s.name || '') },
      { column: 'win', value: String(s.winsTotal ?? 0) },
      { column: 'loose', value: String(s.lossesTotal ?? 0) },
      { column: 'cups', value: String(s.cupDiff ?? 0) },
      { column: 'points', value: String(s.points ?? 0) },
    ]));
  }, [standings]);

  // my matches
  const mySortedMatches = useMemo(() => {
    const all = Array.isArray(leagueMatches) ? leagueMatches : [];
    const mine = all.filter((row: any) => row?.match && (row.match.homeTeamId === myTeamId || row.match.awayTeamId === myTeamId) && row.match.matchStatus !== 'completed');
    return mine
      .map((row: any) => ({
        row,
        when: parseMatchDate(row),
        title: `${row.homeTeam?.name || row.match.homeTeamId} vs ${row.awayTeam?.name || row.match.awayTeamId}`,
        table: row.match.matchTable,
      }))
      .sort((a: any, b: any) => (a.when?.getTime?.() || 0) - (b.when?.getTime?.() || 0));
  }, [leagueMatches, myTeamId]);

  const now = new Date().getTime();
  const upcoming = mySortedMatches.filter(m => (m.when?.getTime?.() || 0) >= now);
  const nextMatch = upcoming[0] || null;
  const nextMatchTitle = nextMatch?.title || 'Nincs következő mérkőzés';
  const nextMatchTime = nextMatch?.when ? nextMatch.when.toLocaleString('hu-HU', { timeZone: 'UTC' }) : '';
  const nextMatchTable = nextMatch?.row?.match?.matchTable ? String(nextMatch.row.match.matchTable) : '';

  const upcomingFive = upcoming.slice(0, 5).map((m) => ({
    matchTitle: m.title,
    date: m.when ? m.when.toLocaleString('hu-HU', {  }) : '',
    table: String(m.table || ''),
    matchId: m.row.match?.id || m.row.id,
    teamA: { 
      name: m.row.homeTeam?.name || '', 
      logo: m.row.homeTeam?.logo ? (m.row.homeTeam.logo.startsWith('http') ? m.row.homeTeam.logo : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}${m.row.homeTeam.logo}`) : '/elitelogo.png'
    },
    teamB: { 
      name: m.row.awayTeam?.name || '', 
      logo: m.row.awayTeam?.logo ? (m.row.awayTeam.logo.startsWith('http') ? m.row.awayTeam.logo : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}${m.row.awayTeam.logo}`) : '/elitelogo.png'
    },
  }));
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTeams, setModalTeams] = useState<{ teamA: any; teamB: any } | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [nickname, setNickname] = useState<string>("");
  
  // Match meta for modal
  const modalMatchId = selectedMatch ? String(selectedMatch.id || selectedMatch.match?.id || '') : '';
  const { data: matchMeta, refetch: refetchMeta } = useGetMatchMetaQuery(modalMatchId, { skip: !modalMatchId });
  const [updateMatchResult] = useUpdateMatchResultMutation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await authClient.getSession();
        if (mounted) setNickname((data?.user?.nickname || data?.user?.name || "").trim());
      } catch {}
      if (!isLoadingActiveInvite) {
        const accepted = (activeInvite as any)?.accepted === true;
        if (activeInvite?.hasInvite && activeInvite?.leagueTeamId && !accepted) {
          router.replace(`/application/apply/${encodeURIComponent(activeInvite.leagueTeamId)}`);
          return;
        }
        if (mounted) setCheckingInvite(false);
      }
    })();
    return () => { mounted = false };
  }, [activeInvite, isLoadingActiveInvite, router]);

  const handleEnterResult = (match: any) => {
    setSelectedMatch(match);
    setModalOpen(true);
  };

  if (checkingInvite) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-[#ff5c1a] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {nickname && (
        <div className={`${bebasNeue.className} text-white text-2xl md:text-4xl`}>Üdvözlünk {nickname}!</div>
      )}
      {/* Top Statboxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Next Match */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/30 rounded-2xl p-4 md:p-6 border-2 border-[#ff5c1a] shadow-lg shadow-[#ff5c1a33]"
        >
          <div className="flex items-center justify-between gap-2 md:gap-0">
            <div>
              <p className="text-[#e0e6f7] text-sm md:text-base">Következő meccs</p>
              <h3 className={`${bebasNeue.className} text-lg md:text-2xl mt-1 tracking-wider text-white`}>{nextMatchTitle}</h3>
            </div>
            <div className="h-10 w-10 md:h-14 md:w-14 rounded-full bg-gradient-to-br from-[#ff5c1a] to-[#002b6b] flex items-center justify-center shadow-lg shadow-[#ff5c1a]/40">
              <span className="font-bold text-base md:text-lg text-white">BM</span>
            </div>
          </div>
          <p className="text-[#ff5c1a] mt-2 md:mt-4 text-base md:text-lg">{nextMatchTime || '—'}</p>
        </motion.div>
        {/* League Position */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/30 rounded-2xl p-4 md:p-6 border-2 border-[#ff5c1a] shadow-lg shadow-[#ff5c1a33]"
        >
          <div className="flex items-center justify-between gap-2 md:gap-0">
            <div>
              <p className="text-[#e0e6f7] text-sm md:text-base">Liga pozíció</p>
              <h3 className={`${bebasNeue.className} text-lg md:text-2xl mt-1 tracking-wider text-white`}>{myRow ? `#${myRow.rank}` : '—'} Helyezés</h3>
            </div>
            <div className="h-10 w-10 md:h-14 md:w-14 rounded-full bg-gradient-to-br from-[#ff5c1a] to-[#002b6b] flex items-center justify-center shadow-lg shadow-[#ff5c1a]/40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-7 md:w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
          <p className="text-[#ff5c1a] mt-2 md:mt-4 text-base md:text-lg">{myRow ? `${myRow.points} pont • ${myRow.cupDiff}` : '—'} Pohár</p>
        </motion.div>
        {/* Win Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/30 rounded-2xl p-4 md:p-6 border-2 border-[#ff5c1a] shadow-lg shadow-[#ff5c1a33]"
        >
          <div className="flex items-center justify-between gap-2 md:gap-0">
            <div>
              <p className="text-[#e0e6f7] text-sm md:text-base">Győzelmi arány</p>
              <h3 className={`${bebasNeue.className} text-lg md:text-2xl mt-1 tracking-wider text-white`}>
                {myRow ? `${myRow.games ? Math.round((myRow.winsTotal / myRow.games) * 100) : 0}%` : '—'}
              </h3>
            </div>
            <div className="h-10 w-10 md:h-14 md:w-14 rounded-full bg-gradient-to-br from-[#ff5c1a] to-[#002b6b] flex items-center justify-center shadow-lg shadow-[#ff5c1a]/40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-7 md:w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-[#ff5c1a] mt-2 md:mt-4 text-base md:text-lg">{myRow ? `${myRow.winsTotal}W - ${myRow.lossesTotal}L` : '—'}</p>
        </motion.div>
      </div>

      {/* Enter Result Modal */}
      {modalOpen && matchMeta && (
        <EnterResultModal
          open={true}
          onClose={() => setModalOpen(false)}
          teamA={{ name: matchMeta.homeTeam.name, players: (matchMeta.homeTeam.players || []) }}
          teamB={{ name: matchMeta.awayTeam.name, players: (matchMeta.awayTeam.players || []) }}
          initialCupsA={matchMeta.score?.home}
          initialCupsB={matchMeta.score?.away}
          initialSelectedA={[matchMeta.selected?.homeFirstPlayerId, matchMeta.selected?.homeSecondPlayerId].filter(Boolean)}
          initialSelectedB={[matchMeta.selected?.awayFirstPlayerId, matchMeta.selected?.awaySecondPlayerId].filter(Boolean)}
          initialMvpA={matchMeta.mvp?.home}
          initialMvpB={matchMeta.mvp?.away}
          onSubmit={async (payload) => {
            try {
              await updateMatchResult({
                id: modalMatchId,
                body: {
                  homeTeamScore: payload.cupsA,
                  awayTeamScore: payload.cupsB,
                  homeTeamBestPlayerId: payload.mvpAId || undefined,
                  awayTeamBestPlayerId: payload.mvpBId || undefined,
                  homeFirstPlayerId: payload.selectedAIds?.[0],
                  homeSecondPlayerId: payload.selectedAIds?.[1],
                  awayFirstPlayerId: payload.selectedBIds?.[0],
                  awaySecondPlayerId: payload.selectedBIds?.[1],
                }
              }).unwrap();
              setModalOpen(false);
            } catch (e) {
              console.error(e);
            }
          }}
        />
      )}

      {/* Main 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Left column: Upcoming Matches + Recent Activity */}
        <div className="space-y-4 md:space-y-8 lg:col-span-2">
          {/* Upcoming Matches */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 rounded-2xl p-4 md:p-6 border-2 border-[#ff5c1a] shadow-xl shadow-[#ff5c1a33]"
          >
            <h3 className={`${bebasNeue.className} text-lg md:text-2xl mb-4 md:mb-6 tracking-wider text-white`}>Közelgő meccsek</h3>
            <div className="space-y-3 md:space-y-4">
              {upcomingFive.length > 0 ? upcomingFive.map((match, idx) => (
                <UpcomingMatchCard
                  key={idx}
                  matchTitle={match.matchTitle}
                  date={new Date(match.date).toLocaleDateString('hu-HU', { timeZone: 'UTC' }) + ' ' + new Date(match.date).toLocaleTimeString('hu-HU', { timeZone: 'UTC' })}
                  table={match.table}
                  matchId={match.matchId}
                  teamA={match.teamA}
                  teamB={match.teamB}
                  onEnterResult={() => handleEnterResult(upcoming[idx].row)}
                  onShare={() => {}}
                  onDelayRequest={() => {}}
                />
              )) : (
                <div className="text-white/70">Nincs közelgő meccs</div>
              )}
            </div>
          </motion.div>
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 rounded-2xl p-4 md:p-6 border-2 border-[#ff5c1a] shadow-xl shadow-[#ff5c1a33]"
          >
            <h3 className={`${bebasNeue.className} text-lg md:text-2xl mb-4 md:mb-6 tracking-wider text-white`}>Friss aktivitások</h3>
            <div className="space-y-3 md:space-y-4">
              <div>Nincs aktivitás</div>
              {/*<div className="flex flex-col sm:flex-row items-start sm:space-x-4 space-y-2 sm:space-y-0 p-3 md:p-4 bg-black/40 rounded-xl border border-[#ff5c1a] shadow shadow-[#ff5c1a33]">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-[#ff5c1a] to-[#002b6b] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#ff5c1a]/40">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-base md:text-lg text-white">New Match Scheduled</p>
                  <p className="text-[#e0e6f7] text-sm md:text-base">Your team has been scheduled to play against Beer Masters tomorrow at 20:00.</p>
                  <p className="text-[#ff5c1a] mt-1 text-xs md:text-base">2 hours ago</p>
                </div>
              </div>*/}
            </div>
          </motion.div>
        </div>
        {/* Right column: League Standings */}
        <div className="lg:col-span-1 mt-4 lg:mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 rounded-2xl p-4 md:p-6 border-2 border-[#ff5c1a] shadow-xl shadow-[#ff5c1a33] h-[350px] md:h-[600px] overflow-y-auto"
          >
            <h3 className={`${bebasNeue.className} text-lg md:text-2xl mb-4 md:mb-6 tracking-wider text-white`}>Liga Tabella</h3>
            {miniTable.length > 0 ? (
            <Table records={{
              header: [
                {column: 'pos', value: 'Pos.'},
                {column: 'name', value: 'Name'},
                {column: 'win', value: 'W'},
                {column: 'loose', value: 'L'},
                {column: 'cups', value: 'Cups'},
                {column: 'points', value: 'Points'},
              ],
              rows: miniTable,
            }} />
            ) : (
              <div className="text-white/70">Még nem indult el a szezon</div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
} 
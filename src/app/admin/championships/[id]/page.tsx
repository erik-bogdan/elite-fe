"use client";

import React, { useState, useEffect } from "react";
import { Bebas_Neue } from "next/font/google";
import { FiTable, FiDownload, FiChevronUp, FiChevronDown, FiEdit2, FiCalendar, FiMoreVertical, FiArrowUp, FiArrowDown, FiMinus } from "react-icons/fi";
import EnterResultModal from "@/app/components/EnterResultModal";
import { useGetTeamPlayersBySeasonQuery } from "@/lib/features/apiSlice";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { toast } from 'sonner';
import { useGetAvailableTeamsForLeagueQuery, useGetChampionshipByIdQuery, useGetLeagueTeamsQuery, useAddTeamToLeagueMutation, useRemoveTeamFromLeagueMutation, useSendInviteForLeagueTeamMutation, useGetMatchesForLeagueQuery, useGetStandingsQuery, useGetMatchMetaQuery, useUpdateMatchResultMutation, useGetStandingsByDayQuery, useGetGameDayMvpsQuery, useGetStandingsUptoGameDayQuery, useGetStandingsUptoRoundQuery } from "@/lib/features/championship/championshipSlice";
import RankModal from "./RankModal";
import * as Tooltip from '@radix-ui/react-tooltip';
import TeamAssignModal from "./TeamAssignModal";
import StartModal from "./StartModal";
import ScriptModal from "./ScriptModal";
import ActionMenu from "../../teams/ActionMenu";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

interface Match {
  id: number;
  homeTeam: { name: string; logo: string };
  awayTeam: { name: string; logo: string };
  time: string;
  tableNumber: number;
  round: number;
}

interface MatchDay {
  id: number;
  date: string;
  matches: Match[];
  mvp: {
    name: string;
    team: string;
    image: string;
  };
}

// Mock data
const mockMatchDays: MatchDay[] = [
  {
    id: 1,
    date: "2024-03-15",
    matches: [
      {
        id: 1,
        homeTeam: { name: "Team Alpha", logo: "/team1.png" },
        awayTeam: { name: "Team Beta", logo: "/team2.png" },
        time: "18:00",
        tableNumber: 1,
        round: 1,
      },
      {
        id: 2,
        homeTeam: { name: "Team Gamma", logo: "/team3.png" },
        awayTeam: { name: "Team Delta", logo: "/team4.png" },
        time: "19:00",
        tableNumber: 2,
        round: 1,
      },
    ],
    mvp: {
      name: "John Doe",
      team: "Team Alpha",
      image: "/player1.png",
    },
  },
  {
    id: 2,
    date: "2024-03-22",
    matches: [
      {
        id: 3,
        homeTeam: { name: "Team Beta", logo: "/team2.png" },
        awayTeam: { name: "Team Gamma", logo: "/team3.png" },
        time: "18:00",
        tableNumber: 1,
        round: 2,
      },
      {
        id: 4,
        homeTeam: { name: "Team Delta", logo: "/team4.png" },
        awayTeam: { name: "Team Alpha", logo: "/team1.png" },
        time: "19:00",
        tableNumber: 2,
        round: 2,
      },
    ],
    mvp: {
      name: "Jane Smith",
      team: "Team Gamma",
      image: "/player2.png",
    },
  },
];

export default function ChampionshipView() {
  const params = useParams();
  const router = useRouter();
  const championshipId = typeof params.id === 'string' ? params.id : null;
  const { data: championship, isLoading, error } = useGetChampionshipByIdQuery(championshipId!, {
    skip: !championshipId,
  });
  const { data: attachedTeams, refetch } = useGetLeagueTeamsQuery(championshipId!, { skip: !championshipId });
  const { data: availableTeams } = useGetAvailableTeamsForLeagueQuery(championshipId!, { skip: !championshipId });
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [uptoGameDay, setUptoGameDay] = useState<number | 'all'>('all');
  const [uptoRound, setUptoRound] = useState<number | 'all'>('all');
  const { data: standingsData, refetch: refetchStandings } = useGetStandingsQuery(championshipId!, { skip: !championshipId || !championship?.isStarted || selectedDay !== 'all' || uptoGameDay !== 'all' });
  const { data: standingsByDay } = useGetStandingsByDayQuery({ id: championshipId!, date: selectedDay }, { skip: !championshipId || !championship?.isStarted || selectedDay === 'all' });
  const { data: standingsUpto } = useGetStandingsUptoGameDayQuery({ id: championshipId!, gameDay: Number(uptoGameDay) }, { skip: !championshipId || !championship?.isStarted || uptoGameDay === 'all' || uptoRound !== 'all' });
  const { data: standingsPrev } = useGetStandingsUptoGameDayQuery({ id: championshipId!, gameDay: Number(uptoGameDay) - 1 }, { skip: !championshipId || !championship?.isStarted || uptoGameDay === 'all' || Number(uptoGameDay) <= 1 });
  const { data: standingsUptoRound } = useGetStandingsUptoRoundQuery({ id: championshipId!, round: Number(uptoRound) }, { skip: !championshipId || !championship?.isStarted || uptoRound === 'all' });
  const { data: standingsPrevRound } = useGetStandingsUptoRoundQuery({ id: championshipId!, round: Number(uptoRound) - 1 }, { skip: !championshipId || !championship?.isStarted || uptoRound === 'all' || Number(uptoRound) <= 1 });
  const { data: mvpsData } = useGetGameDayMvpsQuery(championshipId!, { skip: !championshipId || !championship?.isStarted });
  const [addTeam] = useAddTeamToLeagueMutation();
  const [removeTeam] = useRemoveTeamFromLeagueMutation();
  const [sendInvite] = useSendInviteForLeagueTeamMutation();
  const { data: leagueMatches, refetch: refetchMatches } = useGetMatchesForLeagueQuery(championshipId!, { skip: !championshipId });
  const [expandedMatchDays, setExpandedMatchDays] = useState<number[]>([]);
  const [expandedMatches, setExpandedMatches] = useState<string[]>([]);
  const [expandedRounds, setExpandedRounds] = useState<string[]>([]);
  const [isTeamModalOpen, setTeamModalOpen] = useState(false);
  const [isStartModalOpen, setStartModalOpen] = useState(false);
  const [isScriptModalOpen, setScriptModalOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);
  const [resultModal, setResultModal] = useState<{ open: boolean; match?: any }>(() => ({ open: false }));
  const [rankModal, setRankModal] = useState<{ open: boolean; teamId?: string; teamName?: string }>({ open: false });
  const modalHomeTeamId = resultModal.open ? (resultModal.match?.homeTeam?.id || resultModal.match?.homeTeamId) : null;
  const modalAwayTeamId = resultModal.open ? (resultModal.match?.awayTeam?.id || resultModal.match?.awayTeamId) : null;
  const modalSeasonId = championship?.seasonId ? String(championship.seasonId as any) : '';
  const modalMatchId = resultModal.open ? String(resultModal.match?.id || resultModal.match?.match?.id || '') : '';
  const { data: matchMeta, refetch: refetchMeta } = useGetMatchMetaQuery(modalMatchId, { skip: !modalMatchId });
  const [updateMatchResult] = useUpdateMatchResultMutation();

  useEffect(() => {
    if (!championshipId) {
      router.push('/admin/championships');
    }
  }, [championshipId, router]);

  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  const abs = (p?: string | null) => p ? (p.startsWith('http') ? p : `${backendBase}${p}`) : '';

  const toggleMatchDay = (matchDayId: number) => {
    setExpandedMatchDays(prev =>
      prev.includes(matchDayId)
        ? prev.filter(id => id !== matchDayId)
        : [...prev, matchDayId]
    );
  };

  const toggleMatch = (matchId: string) => {
    setExpandedMatches(prev =>
      prev.includes(matchId)
        ? prev.filter(id => id !== matchId)
        : [...prev, matchId]
    );
  };

  if (!championshipId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#ff5c1a]"></div>
      </div>
    );
  }

  if (error || !championship) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Hiba történt az adatok betöltésekor!</div>
      </div>
    );
  }


  // Fetch real matches and group by match day (date)
  const matchDays = (Array.isArray(leagueMatches) ? leagueMatches : [])
    .map((row: any) => {
      const dateAt = row?.match?.matchDate || row?.match?.matchAt || null;
      const timeAt = row?.match?.matchTime || row?.match?.matchAt || null;
      if (!dateAt) return null;
      return {
        id: row.match.id,
        date: dateAt,
        time: timeAt,
        table: row.match.matchTable,
        round: row.match.matchRound,
        home: row.homeTeam?.name || row.match.homeTeamId,
        homeLogo: abs(row.homeTeam?.logo) || '/elitelogo.png',
        away: row.awayTeam?.name || row.match.awayTeamId,
        awayLogo: abs(row.awayTeam?.logo) || '/elitelogo.png',
        homeScore: row.match.homeTeamScore,
        awayScore: row.match.awayTeamScore,
      };
    })
    .filter(Boolean)
    .reduce((acc: Record<string, any[]>, m: any) => {
      const key = new Date(m.date).toISOString().slice(0,10);
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    }, {} as Record<string, any[]>);
  const matchDayList = Object.entries(matchDays)
    .map(([date, items], idx) => ({
      id: idx + 1,
      date,
      round: (items[0] as any)?.round ?? (idx + 1),
      matches: items
        .sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime() || (a.table - b.table))
        .map((m: any) => ({
          id: m.id,
          time: new Date(m.time).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
          tableNumber: m.table,
          round: m.round,
          homeTeam: { name: m.home, logo: m.homeLogo },
          awayTeam: { name: m.away, logo: m.awayLogo },
          homeScore: m.homeScore,
          awayScore: m.awayScore,
        }))
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Group matches by round for collapsible sections
  const roundGroups = (Array.isArray(leagueMatches) ? leagueMatches : [])
    .map((row: any) => ({
      id: row.match.id,
      round: Number(row.match.matchRound || 0) || 0,
      time: row.match.matchTime || row.match.matchAt,
      table: row.match.matchTable,
      date: row.match.matchDate || row.match.matchAt,
      home: row.homeTeam?.name || row.match.homeTeamId,
      homeLogo: abs(row.homeTeam?.logo) || '/elitelogo.png',
      away: row.awayTeam?.name || row.match.awayTeamId,
      awayLogo: abs(row.awayTeam?.logo) || '/elitelogo.png',
      homeScore: row.match.homeTeamScore,
      awayScore: row.match.awayTeamScore,
    }))
    .reduce((acc: Record<number, any[]>, m: any) => {
      const r = m.round || 0;
      if (!acc[r]) acc[r] = [];
      acc[r].push(m);
      return acc;
    }, {} as Record<number, any[]>);
  const roundList = Object.entries(roundGroups)
    .map(([round, items]) => ({
      round: Number(round),
      matches: (items as any[])
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime() || (a.table - b.table))
        .map((m: any) => ({
          id: m.id,
          time: new Date(m.time).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
          tableNumber: m.table,
          date: new Date(m.date).toLocaleDateString(),
          homeTeam: { name: m.home, logo: m.homeLogo },
          awayTeam: { name: m.away, logo: m.awayLogo },
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          isOT: Math.max(Number(m.homeScore||0), Number(m.awayScore||0)) > 10 && Math.min(Number(m.homeScore||0), Number(m.awayScore||0)) >= 10,
        }))
    }))
    .sort((a, b) => a.round - b.round);

  const toggleRound = (key: string) => {
    setExpandedRounds((prev) => prev.includes(key) ? prev.filter(r => r !== key) : [...prev, key]);
  };

  return (
    <div className="min-h-screen p-8">
      {/* Championship Header */}
      <div className="flex items-center gap-6 mb-8">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#ff5c1a]">
          <Image
            src={abs(championship.logo) || "/elitelogo.png"}
            alt={championship.name}
            width={96}
            height={96}
            className="object-cover w-full h-full"
          />
        </div>
        <div>
          <h1 className={`${bebasNeue.className} text-4xl text-white`}>{championship.name}</h1>
          <div className="flex items-center gap-2">
            <span className="inline-block px-3 py-1 rounded-full bg-[#ff5c1a] text-white font-bold">
              {championship.isStarted ? (championship.phase === 'knockout' ? 'Knockout' : 'Regular') : 'Not started'}
            </span>
            {championship.isStarted && (
              <span className="inline-block px-3 py-1 rounded-full bg-black/40 text-white">
                {championship.phase === 'knockout' ? `Kör: ${championship.knockoutRound ?? 0}` : `Kör: ${championship.regularRound ?? 0}`}
          </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        {!championship.isStarted && (
          <button onClick={() => setStartModalOpen(true)} className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#ff5c1a] text-white hover:bg-[#ff7c3a] transition-colors">
            <FiTable className="w-5 h-5" /> Bajnokság indítása
        </button>
        )}
        <button className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#ff5c1a] text-white hover:bg-[#ff7c3a] transition-colors">
          <FiDownload className="w-5 h-5" /> Export Championship
        </button>
        <button 
          onClick={() => setScriptModalOpen(true)} 
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#ff5c1a] text-white hover:bg-[#ff7c3a] transition-colors"
        >
          <FiTable className="w-5 h-5" /> Script Generálás
        </button>
      </div>

      {/* Game Day MVP boxes under header buttons */}
      {championship?.isStarted && (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {(mvpsData?.mvps || []).map((x: any, idx: number) => (
              <div key={`${x.gameDay ?? x.date ?? idx}`} className="relative overflow-hidden rounded-2xl p-5 border-2 border-[#ff5c1a] bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,92,26,0.18),transparent_40%),radial-gradient(120%_120%_at_100%_0%,rgba(0,119,255,0.14),transparent_45%),linear-gradient(120deg,#0a1d3f_0%,#06244e_100%)] shadow-[0_0_25px_0_rgba(255,92,26,0.35)] flex items-center justify-between">
                <div className="relative z-[1] min-w-0">
                  <div className="text-white/70 text-xs mb-1">Gameday {x.gameDay ?? ''} • {x.date ? new Date(x.date).toLocaleDateString() : ''}</div>
                  {x.mvp ? (
                    <>
                      <div className={`${bebasNeue.className} text-2xl md:text-3xl text-white tracking-wide`}>{x.mvp.name}</div>
                      <div className="text-[#ffb38f] font-medium">{x.mvp.teamName}</div>
                    </>
                  ) : (
                    <div className="text-white/60">Még nincs MVP (Függőben lévő meccs).</div>
                  )}
                </div>
                <div className="relative z-[1] w-14 h-14 rounded-full bg-[radial-gradient(circle_at_30%_30%,#ff7c3a,transparent_60%),radial-gradient(circle_at_70%_70%,#2f80ed,transparent_60%)] border-2 border-white/10 flex items-center justify-center shadow-[0_0_18px_rgba(255,92,26,0.35)]">
                  <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6 text-white/90' viewBox='0 0 24 24' fill='currentColor'><path d='M12 2l2.39 4.84 5.34.78-3.86 3.76.91 5.32L12 14.77 7.22 16.7l.91-5.32L4.27 7.62l5.34-.78L12 2z'/></svg>
                </div>
                <div className="absolute inset-0 pointer-events-none opacity-40" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teams/Standings table */}
      <div className="bg-[#001a3a]/60 rounded-xl p-6 border border-[#ff5c1a]/30 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${bebasNeue.className} text-2xl text-white`}>{championship.isStarted ? 'Tabella' : 'Csapatok'}</h3>
          {!championship.isStarted && (
          <button onClick={() => setTeamModalOpen(true)} className="px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded">Kezelés</button>
          )}
        </div>
        {championship.isStarted && (
          <div className="flex items-center justify-end mb-3 gap-2">
            <label className="text-white/70">Játéknap:</label>
            <select value={selectedDay} onChange={(e) => { setSelectedDay(e.target.value); setUptoGameDay('all'); }} className="bg-black/40 text-white border border-white/20 rounded px-2 py-1">
              <option value="all">Összes</option>
              {Array.from(new Set((leagueMatches || []).map((rm: any) => (rm.match.matchDate || rm.match.matchAt) && new Date(rm.match.matchDate || rm.match.matchAt).toISOString().slice(0,10)))).filter(Boolean).sort().map((d: string, idx: number) => (
                <option key={`day-${d}`} value={d}>Gameday {idx + 1}</option>
              ))}
            </select>
            <label className="text-white/70 ml-4">Játéknapig:</label>
            <select value={uptoGameDay} onChange={(e) => { setUptoGameDay(e.target.value === 'all' ? 'all' : Number(e.target.value)); setSelectedDay('all'); }} className="bg-black/40 text-white border border-white/20 rounded px-2 py-1">
              <option value="all">Összes</option>
              {Array.from(new Set((leagueMatches || []).map((rm: any) => rm.match.gameDay))).filter((x: any) => !!x).sort((a: any,b: any)=>a-b).map((g: number) => (
                <option key={`gd-${g}`} value={g}>Gameday {g}</option>
              ))}
            </select>
            <label className="text-white/70 ml-4">Fordulóig:</label>
            <select value={uptoRound} onChange={(e) => { setUptoRound(e.target.value === 'all' ? 'all' : Number(e.target.value)); setSelectedDay('all'); setUptoGameDay('all'); }} className="bg-black/40 text-white border border-white/20 rounded px-2 py-1">
              <option value="all">Összes</option>
              {Array.from(new Set((leagueMatches || []).map((rm: any) => rm.match.matchRound))).filter((x: any) => !!x).sort((a: any,b: any)=>a-b).map((r: number) => (
                <option key={`rd-${r}`} value={r}>Forduló {r}</option>
              ))}
            </select>
      </div>
        )}
      <TeamAssignModal leagueId={championshipId!} isOpen={isTeamModalOpen} onClose={() => setTeamModalOpen(false)} onChanged={() => refetch()} />
        {!championship.isStarted ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#ff5c1a]/30">
              <thead>
                <tr className="text-left text-white">
                  <th className="py-3 pr-4">Logo</th>
                  <th className="py-3 pr-4">Név</th>
                  <th className="py-3 pr-4">Státusz</th>
                  <th className="py-3 pr-4">Játékosok</th>
                  <th className="py-3 pr-4">Meghívó</th>
                  <th className="py-3 pr-4">Örökös csapat</th>
                  <th className="py-3 pr-4 text-right">Műveletek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ff5c1a]/20">
                {(attachedTeams || []).map((t: any) => {
                const status: string | undefined = t._status;
                const color = status === 'approved' ? 'text-green-400' : status === 'declined' ? 'text-red-400' : 'text-yellow-400';
                const label = status === 'approved' ? 'Elfogadva' : status === 'declined' ? 'Elutasítva' : 'Függőben';
                const logo = abs(t.logo) || '/elitelogo.png';
                const invite = t._inviteSent ? `Kiküldve: ${new Date(t._inviteSentDate || t.updatedAt || Date.now()).toLocaleString()}` : 'Nincs kiküldve';
                return (
                  <tr key={`row-${t.id}`} className="text-white">
                    <td className="py-2 pr-4">
                      <Image src={logo} alt={t.name} width={36} height={36} className="rounded-full border border-white/10" />
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/teams/${t.id}/view`)}
                        className="underline-offset-2 hover:underline"
                        title="Csapat megnyitása"
                      >
                        {t.name}
                      </button>
                    </td>
                    <td className={`py-2 pr-4 ${color}`}>{label}</td>
                    <td className="py-2 pr-4">{t._playersCount ?? 0}</td>
                    <td className="py-2 pr-4">{invite}</td>
                    <td className="py-2 pr-4">{t._status === 'declined' ? (t._heirTeamName || '-') : '-'}</td>
                    <td className="py-2 pr-4">
                      <div className="flex justify-end">
                        <button
                          onClick={(e) => {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            if (activeRow === t.id) {
                              setActiveRow(null);
                              setMenuAnchor(null);
                            } else {
                              setActiveRow(t.id as string);
                              setMenuAnchor(rect);
                            }
                          }}
                          className="p-2 hover:bg-[#ff5c1a]/10 rounded-lg transition-colors"
                          aria-label="Műveletek"
                        >
                          <FiMoreVertical className="w-5 h-5 text-[#ff5c1a]" />
                        </button>
                        {activeRow === t.id && menuAnchor && (
                          <ActionMenu
                            anchorRect={menuAnchor}
                            onView={() => { setActiveRow(null); setMenuAnchor(null); router.push(`/admin/teams/${t.id}/view`); }}
                            onInvite={async () => {
                              try {
                                await sendInvite({ leagueTeamId: t._leagueTeamId }).unwrap();
                                toast.success('Meghívó kiküldve');
                                await refetch();
                              } catch (e: any) {
                                const msg = e?.data?.message || e?.error || e?.message || 'Nem sikerült a meghívó küldése';
                                toast.error(String(msg));
                              } finally {
                                setActiveRow(null); setMenuAnchor(null);
                              }
                            }}
                            inviteLabel={t._inviteSent ? 'Meghívó újraküldése' : 'Meghívó kiküldése'}
                            onRemove={async () => { try { await removeTeam({ leagueId: championshipId!, teamId: t.id }).unwrap(); await refetch(); } finally { setActiveRow(null); setMenuAnchor(null); } }}
                            onClose={() => { setActiveRow(null); setMenuAnchor(null); }}
                          />
                        )}
              </div>
                    </td>
                  </tr>
                );
                })}
                {(!attachedTeams || attachedTeams.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-4 text-white/70">Nincs hozzárendelt csapat</td>
                  </tr>
                )}
              </tbody>
            </table>
              </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#ff5c1a]/30">
              <thead>
                <tr className="text-left text-white">
                  <th className="py-3 pr-4">#</th>
                  <th className="py-3 pr-4">Csapat</th>
                  <th className="py-3 pr-4">Meccs</th>
                  <th className="py-3 pr-4">GY</th>
                  <th className="py-3 pr-4">V</th>
                  <th className="py-3 pr-4">Győzelem</th>
                  <th className="py-3 pr-4">Győzelem (h)</th>
                  <th className="py-3 pr-4">Vereség (h)</th>
                  <th className="py-3 pr-4">Vereség</th>
                  <th className="py-3 pr-4">PK</th>
                  <th className="py-3 pr-4">Pont</th>
                  <th className="py-3 pr-4">Forma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ff5c1a]/20">
                {(() => {
                  let source = selectedDay === 'all' ? standingsData?.standings : standingsByDay?.standings;
                  if (uptoGameDay !== 'all') source = standingsUpto?.standings;
                  if (uptoRound !== 'all') source = standingsUptoRound?.standings;
                  const rows = (source && source.length > 0)
                    ? source
                    : (attachedTeams || []).map((t: any, idx: number) => ({
                        rank: idx + 1,
                        teamId: t.id,
                        name: t.name,
                        logo: abs(t.logo),
                        games: 0,
                        winsTotal: 0,
                        lossesTotal: 0,
                        winsRegular: 0,
                        winsOT: 0,
                        lossesOT: 0,
                        lossesRegular: 0,
                        cupDiff: 0,
                        points: 0,
                      }));
                  // compute movement if uptoGameDay is selected
                  const prevMap = new Map<string, number>();
                  if (uptoRound !== 'all') {
                    if (standingsPrevRound?.standings?.length) standingsPrevRound.standings.forEach((p: any) => prevMap.set(p.teamId, p.rank));
                  } else if (standingsPrev?.standings?.length) {
                    standingsPrev.standings.forEach((p: any) => prevMap.set(p.teamId, p.rank));
                  }
                  return rows.map((s: any) => {
                    const prevRank = prevMap.get(s.teamId);
                    let moveIcon: React.ReactNode = null;
                    let delta: number | null = null;
                    if (prevRank && s.rank) {
                      delta = prevRank - s.rank; // +: improved (went up)
                      if (delta > 0) moveIcon = <FiArrowUp className="text-green-400" />;
                      else if (delta < 0) moveIcon = <FiArrowDown className="text-red-400" />;
                      else moveIcon = <FiMinus className="text-white/50" />;
                    }
                    // compute last 5 form from leagueMatches, respecting filters (day/uptoDay/uptoRound)
                    const allMatches = (leagueMatches || []) as any[];
                    const baseTeamMatches = allMatches
                      .filter((row: any) => row.match.matchStatus === 'completed' && (row.match.homeTeamId === s.teamId || row.match.awayTeamId === s.teamId));
                    const formatKey = (d: any) => d ? new Date(d).toISOString().slice(0,10) : '';
                    let teamMatches = baseTeamMatches;
                    if (uptoRound !== 'all') {
                      teamMatches = teamMatches.filter((row: any) => Number(row.match.matchRound || 0) <= Number(uptoRound));
                    } else if (uptoGameDay !== 'all') {
                      teamMatches = teamMatches.filter((row: any) => Number(row.match.gameDay || 0) <= Number(uptoGameDay));
                    } else if (selectedDay !== 'all') {
                      teamMatches = teamMatches.filter((row: any) => formatKey(row.match.matchDate || row.match.matchAt) === selectedDay);
                    }
                    teamMatches = teamMatches.sort((a: any, b: any) => new Date(a.match.matchDate || a.match.matchAt || a.match.createdAt).getTime() - new Date(b.match.matchDate || b.match.matchAt || b.match.createdAt).getTime());
                    const last5 = teamMatches.slice(-5).map((m: any) => {
                      const isHome = m.match.homeTeamId === s.teamId;
                      const oppName = isHome ? (m.awayTeam?.name || m.match.awayTeamId) : (m.homeTeam?.name || m.match.homeTeamId);
                      const hs = Number(m.match.homeTeamScore || 0);
                      const as = Number(m.match.awayTeamScore || 0);
                      const win = isHome ? hs > as : as > hs;
                      const maxS = Math.max(hs, as);
                      const minS = Math.min(hs, as);
                      const ot = maxS > 10 && minS >= 10;
                      const code = win ? (ot ? 'GYH' : 'GY') : (ot ? 'VH' : 'V');
                      const color = win ? (ot ? 'bg-green-600/60' : 'bg-green-600') : (ot ? 'bg-red-600/60' : 'bg-red-600');
                      const border = '';
                      const dateStr = (m.match.matchDate || m.match.matchAt) ? new Date(m.match.matchDate || m.match.matchAt).toLocaleDateString() : '';
                      const score = `${hs} : ${as}`;
                      const title = `${score} (${isHome ? s.name : oppName} - ${isHome ? oppName : s.name})\n${dateStr}`;
                      return { code, color, border, title };
                    });
                    return (
                    <tr key={s.teamId} className="text-white">
                      <td className="py-2 pr-4">{s.rank}</td>
                      <td className="py-2 pr-4 flex items-center gap-2">
                        <Image src={abs(s.logo) || '/elitelogo.png'} alt={s.name} width={24} height={24} className="rounded-full border border-white/10" />
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/teams/${s.teamId}/view`)}
                          className="underline-offset-2 hover:underline cursor-pointer"
                          title="Csapat megnyitása"
                        >
                          {s.name}
                        </button>
                        {(uptoGameDay !== 'all' || uptoRound !== 'all') && moveIcon && (
                          <span className="ml-2 inline-flex items-center gap-1">
                            {moveIcon}
                            <span className={delta && delta > 0 ? 'text-green-400' : delta && delta < 0 ? 'text-red-400' : 'text-white/50'}>
                              {delta ? (delta > 0 ? `+${delta}` : `${delta}`) : '0'}
                            </span>
                          </span>
                        )}
                      </td>
                    <td className="py-2 pr-4">{s.games ?? 0}</td>
                    <td className="py-2 pr-4">{s.winsTotal ?? 0}</td>
                    <td className="py-2 pr-4">{s.lossesTotal ?? 0}</td>
                    <td className="py-2 pr-4">{s.winsRegular ?? 0}</td>
                    <td className="py-2 pr-4">{s.winsOT ?? 0}</td>
                    <td className="py-2 pr-4">{s.lossesOT ?? 0}</td>
                    <td className="py-2 pr-4">{s.lossesRegular ?? 0}</td>
                    <td className="py-2 pr-4">{s.cupDiff ?? 0}</td>
                    <td className="py-2 pr-4">{s.points ?? 0}</td>
                      <td className="py-2 pr-4">
                        <Tooltip.Provider delayDuration={100}>
                          <div className="flex items-center gap-1">
                            {last5.length === 0 ? (
                              <span className="text-white/50">-</span>
                            ) : last5.map((it, i) => (
                              <Tooltip.Root key={i}>
                                <Tooltip.Trigger asChild>
                                  <button
                                    type="button"
                                    className={`inline-flex items-center justify-center rounded ${it.color} ${it.border} text-[9px] leading-none w-6 h-6 text-white`}
                                  >
                                    {it.code}
                                  </button>
                                </Tooltip.Trigger>
                                <Tooltip.Content side="top" sideOffset={6} className="rounded bg-black/80 text-white text-xs px-2 py-1 shadow">
                                  {it.title}
                                  <Tooltip.Arrow className="fill-black/80" />
                                </Tooltip.Content>
                              </Tooltip.Root>
                            ))}
                          </div>
                        </Tooltip.Provider>
                      </td>
                    </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
            </div>
        )}
      </div>

      <StartModal id={championshipId!} isOpen={isStartModalOpen} onClose={() => setStartModalOpen(false)} teamNames={(attachedTeams || []).map((t: any) => t.name)} />
      
      <ScriptModal 
        isOpen={isScriptModalOpen} 
        onClose={() => setScriptModalOpen(false)} 
        leagueMatches={leagueMatches || []}
        championship={championship}
      />


      {resultModal.open && championship && matchMeta && (
        <EnterResultModal
          open={true}
          onClose={() => setResultModal({ open: false })}
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
              // frissítsük a listát, meta-t és a tabellát
              await Promise.all([refetchMatches(), refetchMeta(), refetchStandings()]);
              setResultModal({ open: false });
            } catch (e) {
              console.error(e);
            }
          }}
        />
      )}

      {rankModal.open && rankModal.teamId && (
        <RankModal
          open={rankModal.open}
          onClose={() => setRankModal({ open: false })}
          leagueId={championshipId!}
          teamId={rankModal.teamId}
          teamName={rankModal.teamName || ''}
        />
      )}

  {/* Match Days with nested Rounds */}
      <div className="space-y-6">
        {matchDayList?.map((matchDay) => (
          <motion.div
            key={matchDay.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl overflow-hidden border border-[#ff5c1a]/40"
          >
            <button
              onClick={() => toggleMatchDay(matchDay.id)}
              className="w-full flex items-center justify-between p-6 hover:bg-[#001a3a]/60 transition-colors"
            >
              <h2 className={`${bebasNeue.className} text-2xl text-white`}>
                 Gameday {matchDay.id} - {new Date(matchDay.date).toLocaleDateString()}
              </h2>
              {expandedMatchDays.includes(matchDay.id) ? (
                <FiChevronUp className="w-6 h-6 text-[#ff5c1a]" />
              ) : (
                <FiChevronDown className="w-6 h-6 text-[#ff5c1a]" />
              )}
            </button>

            <AnimatePresence>
              {expandedMatchDays.includes(matchDay.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 space-y-6"
                >
                  {(() => {
                    // Group existing matches assigned to this day by round
                    const groups = (matchDay.matches || []).reduce((acc: Record<number, any[]>, m: any) => {
                      const r = Number(m.round || 0);
                      if (!acc[r]) acc[r] = [];
                      acc[r].push(m);
                      return acc;
                    }, {} as Record<number, any[]>);
                    const rounds = Object.entries(groups).sort((a, b) => Number(a[0]) - Number(b[0]));
                    return rounds.map(([rStr, items]) => {
                      const r = Number(rStr);
                      const key = `${matchDay.id}:${r}`;
                      const sorted = (items as any[]).sort((a, b) => new Date(a.time as any).getTime() - new Date(b.time as any).getTime() || ((a.tableNumber as any) - (b.tableNumber as any)));
                      return (
                        <div key={key} className="bg-black/20 rounded-lg">
                          <button onClick={() => toggleRound(key)} className="w-full flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <span className="text-white">{r}. Forduló</span>
                            {expandedRounds.includes(key) ? <FiChevronUp className="w-5 h-5 text-[#ff5c1a]" /> : <FiChevronDown className="w-5 h-5 text-[#ff5c1a]" />}
                          </button>
                          <AnimatePresence>
                            {expandedRounds.includes(key) && (
                              <div className="p-4 space-y-4">
                                {sorted.map((match: any) => {
                                  const isOT = Math.max(Number(match.homeScore||0), Number(match.awayScore||0)) > 10 && Math.min(Number(match.homeScore||0), Number(match.awayScore||0)) >= 10;
                                  const keyId = String(match.id);
                                  return (
                                    <motion.div key={keyId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-black/30 rounded-lg p-4">
                                      <button onClick={() => toggleMatch(keyId)} className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                                            <Image src={match.homeTeam.logo || "/elitelogo.png"} alt={match.homeTeam.name} width={32} height={32} className="rounded-full" />
                            <span className="text-white">{match.homeTeam.name}</span>
                          </div>
                                          <span className="text-white">-</span>
                          <div className="flex items-center gap-2">
                                            <Image src={match.awayTeam.logo || "/elitelogo.png"} alt={match.awayTeam.name} width={32} height={32} className="rounded-full" />
                            <span className="text-white">{match.awayTeam.name}</span>
                          </div>
                                          <span className="text-[#ff5c1a]">{typeof match.homeScore === 'number' && typeof match.awayScore === 'number' ? `(${match.homeScore} - ${match.awayScore}${isOT ? ' OT' : ''})` : ''}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[#e0e6f7]">{match.time}</span>
                                          <span className="text-[#e0e6f7]">Asztal: {match.tableNumber}</span>
                                          {expandedMatches.includes(keyId) ? (<FiChevronUp className="w-5 h-5 text-[#ff5c1a]" />) : (<FiChevronDown className="w-5 h-5 text-[#ff5c1a]" />)}
                        </div>
                      </button>

                      <AnimatePresence>
                                        {expandedMatches.includes(keyId) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 flex gap-4"
                          >
                                            <button
                                              onClick={() => setResultModal({ open: true, match })}
                                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff5c1a] text-white hover:bg-[#ff7c3a] transition-colors"
                                            >
                                              <FiEdit2 className="w-4 h-4" /> Eredmény módosítása
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff5c1a] text-white hover:bg-[#ff7c3a] transition-colors">
                                              <FiCalendar className="w-4 h-4" /> Meccs halasztása
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                                  )
                                })}
                              </div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    });
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 
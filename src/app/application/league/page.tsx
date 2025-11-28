"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Bebas_Neue } from 'next/font/google';
import { useGetMyLeagueQuery } from '@/lib/features/apiSlice';
import { useGetChampionshipByIdQuery, useGetMatchesForLeagueQuery, useGetStandingsQuery, useGetStandingsByDayQuery, useGetStandingsUptoGameDayQuery, useGetStandingsUptoRoundQuery, useGetStandingsByGameDayQuery, useGetGameDayMvpsQuery, useGetPlayoffGroupsQuery, useGetPlayoffMatchesQuery, useGetKnockoutBracketQuery } from '@/lib/features/championship/championshipSlice';
import { FiChevronDown, FiChevronUp, FiArrowUp, FiArrowDown, FiMinus } from 'react-icons/fi';
import * as Tooltip from '@radix-ui/react-tooltip';
import RankModal from '@/app/admin/championships/[id]/RankModal';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });

export default function LeaguePage() {
  const { data: my, isLoading: loadingMy } = useGetMyLeagueQuery();
  const leagueId = my?.leagueId;
  const { data: championship, isLoading } = useGetChampionshipByIdQuery(leagueId!, { skip: !leagueId });
  const { data: leagueMatches } = useGetMatchesForLeagueQuery(leagueId!, { skip: !leagueId });
  const playoffProperties = (championship as any)?.properties;
  const hasGroupedPlayoff = Boolean(playoffProperties?.hasPlayoff && playoffProperties?.playoffType === 'groupped');
  const hasKnockoutPlayoff = Boolean(playoffProperties?.hasPlayoff && playoffProperties?.playoffType === 'knockout');
  const { data: knockoutBracket } = useGetKnockoutBracketQuery(leagueId!, { skip: !leagueId || !hasKnockoutPlayoff });
  const { data: playoffGroups } = useGetPlayoffGroupsQuery(leagueId!, { skip: !leagueId || !hasGroupedPlayoff });
  const { data: playoffMatches } = useGetPlayoffMatchesQuery(leagueId!, { skip: !leagueId || !hasGroupedPlayoff });
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555';
  const abs = (p?: string | null) => (p ? (p.startsWith('http') ? p : `${backendBase}${p}`) : '');
  const knockoutBestOf = Number(playoffProperties?.knockoutBestOf) || 7;
  const knockoutWinsNeeded = Math.ceil(knockoutBestOf / 2);
  const [allMatchesIncludingPlayoff, setAllMatchesIncludingPlayoff] = useState<any[]>([]);
  useEffect(() => {
    if (!leagueId) {
      setAllMatchesIncludingPlayoff([]);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const params = new URLSearchParams();
        params.set('leagueId', leagueId);
        params.set('playoff', 'all');
        params.set('page', '1');
        params.set('pageSize', '1000');
        const url = `${backendBase}/api/matches?${params.toString()}`;
        const resp = await fetch(url, { credentials: 'include' });
        if (resp.ok && mounted) {
          const data = await resp.json();
          setAllMatchesIncludingPlayoff(data.items || []);
        } else if (mounted) {
          setAllMatchesIncludingPlayoff([]);
        }
      } catch (error) {
        console.error('Failed to fetch all matches:', error);
        if (mounted) setAllMatchesIncludingPlayoff([]);
      }
    })();
    return () => { mounted = false };
  }, [leagueId, backendBase]);

  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [uptoGameDay, setUptoGameDay] = useState<number | 'all'>('all');
  const [uptoRound, setUptoRound] = useState<number | 'all'>('all');

  const { data: standingsData } = useGetStandingsQuery(leagueId!, { skip: !leagueId || !championship?.isStarted || selectedDay !== 'all' || uptoGameDay !== 'all' || uptoRound !== 'all' });
  const { data: standingsByDay } = useGetStandingsByGameDayQuery({ id: leagueId!, gameDay: Number(selectedDay) }, { skip: !leagueId || !championship?.isStarted || selectedDay === 'all' });
  const { data: standingsUpto } = useGetStandingsUptoGameDayQuery({ id: leagueId!, gameDay: Number(uptoGameDay) }, { skip: !leagueId || !championship?.isStarted || uptoGameDay === 'all' || uptoRound !== 'all' });
  const { data: standingsPrev } = useGetStandingsUptoGameDayQuery({ id: leagueId!, gameDay: Number(uptoGameDay) - 1 }, { skip: !leagueId || !championship?.isStarted || uptoGameDay === 'all' || Number(uptoGameDay) <= 1 });
  const { data: standingsUptoRound } = useGetStandingsUptoRoundQuery({ id: leagueId!, round: Number(uptoRound) }, { skip: !leagueId || !championship?.isStarted || uptoRound === 'all' });
  const { data: standingsPrevRound } = useGetStandingsUptoRoundQuery({ id: leagueId!, round: Number(uptoRound) - 1 }, { skip: !leagueId || !championship?.isStarted || uptoRound === 'all' || Number(uptoRound) <= 1 });
  const { data: mvpsData } = useGetGameDayMvpsQuery(leagueId!, { skip: !leagueId || !championship?.isStarted });
  const [rankModal, setRankModal] = useState<{ open: boolean; teamId?: string; teamName?: string }>({ open: false });
  const [standingsTab, setStandingsTab] = useState<'regular' | 'playoff'>('regular');
  const playoffUpperTable = useMemo(() => {
    if (!playoffGroups?.upper?.standings) return [];
    return playoffGroups.upper.standings.map((s: any, idx: number) => ({
      ...s,
      displayRank: idx + 1,
      logo: abs(s.logo),
    }));
  }, [playoffGroups, abs]);
  const playoffLowerTable = useMemo(() => {
    if (!playoffGroups?.lower?.standings) return [];
    const offset = playoffGroups.upper?.standings?.length || 0;
    return playoffGroups.lower.standings.map((s: any, idx: number) => ({
      ...s,
      displayRank: offset + idx + 1,
      logo: abs(s.logo),
    }));
  }, [playoffGroups, abs]);

  // Knockout playoff bracket data
  const knockoutBracketData = useMemo(() => {
    if (!hasKnockoutPlayoff || !standingsData?.standings || !leagueMatches) return null;
    
    // Get playoff matches
    const allMatches = Array.isArray(leagueMatches) ? leagueMatches : [];
    const playoffMatches = allMatches.filter((row: any) => row.match?.isPlayoffMatch);
    
    // Get teams with seeds from standings
    const teams = standingsData.standings.map((s: any, idx: number) => ({
      seed: idx + 1,
      teamId: s.teamId,
      name: s.name,
      logo: abs(s.logo),
    }));

    // Organize matches by round
    const matchesByRound: Record<number, any[]> = {};
    playoffMatches.forEach((row: any) => {
      const round = row.match?.matchRound || 1;
      if (!matchesByRound[round]) matchesByRound[round] = [];
      matchesByRound[round].push({
        id: row.match?.id,
        round,
        homeTeamId: row.match?.homeTeamId,
        awayTeamId: row.match?.awayTeamId,
        homeTeam: row.homeTeam,
        awayTeam: row.awayTeam,
        homeScore: row.match?.homeTeamScore,
        awayScore: row.match?.awayTeamScore,
        status: row.match?.matchStatus,
        matchAt: row.match?.matchAt,
      });
    });

    return { teams, matchesByRound };
  }, [hasKnockoutPlayoff, standingsData, leagueMatches, abs]);
  const playoffDefaulted = useRef(false);
  
  // Check if all regular season matches are completed
  const allRegularMatchesCompleted = useMemo(() => {
    if (!leagueMatches || !Array.isArray(leagueMatches)) return false;
    const regularMatches = leagueMatches.filter((row: any) => !row.match?.isPlayoffMatch);
    if (regularMatches.length === 0) return false;
    return regularMatches.every((row: any) => row.match?.matchStatus === 'completed');
  }, [leagueMatches]);

  const showGroupedPlayoffTab = hasGroupedPlayoff && Boolean(playoffGroups?.enabled && playoffGroups?.ready);
  const showKnockoutPlayoffTab = hasKnockoutPlayoff && allRegularMatchesCompleted;
  const showPlayoffTab = showGroupedPlayoffTab || showKnockoutPlayoffTab;
  
  useEffect(() => {
    if (!showPlayoffTab && standingsTab === 'playoff') {
      setStandingsTab('regular');
    } else if (showPlayoffTab && !playoffDefaulted.current) {
      setStandingsTab('playoff');
      playoffDefaulted.current = true;
    }
  }, [showPlayoffTab, standingsTab]);
  const [expandedMatchDays, setExpandedMatchDays] = useState<number[]>([]);
  const [expandedMatches, setExpandedMatches] = useState<string[]>([]);
  const [expandedRounds, setExpandedRounds] = useState<string[]>([]);
  const [playoffRoundTab, setPlayoffRoundTab] = useState<'quarter' | 'semi' | 'final'>('quarter');

  // Build match days list grouped by date (UTC) and then rounds (read-only)
  const allMatchesMapped = useMemo(() => {
    const regularMatchesList = Array.isArray(leagueMatches) ? leagueMatches : [];
    const playoffMatchesList = Array.isArray(allMatchesIncludingPlayoff)
      ? allMatchesIncludingPlayoff.filter((row: any) => row?.match?.isPlayoffMatch === true)
      : [];

    const matchIds = new Set<string>();
    const allMatches: any[] = [];

    regularMatchesList.forEach((row: any) => {
      const matchId = row?.match?.id;
      if (matchId && !matchIds.has(String(matchId))) {
        matchIds.add(String(matchId));
        allMatches.push(row);
      }
    });

    playoffMatchesList.forEach((row: any) => {
      const matchId = row?.match?.id;
      if (matchId && !matchIds.has(String(matchId))) {
        matchIds.add(String(matchId));
        allMatches.push(row);
      }
    });

    return allMatches
      .map((row: any) => {
        const match = row.match;
        const isDelayed = match.isDelayed || false;
        const isPlayoffMatch = match.isPlayoffMatch || false;

        const originalDateSrc = match.matchAt || match.matchDate || null;
        const originalTimeSrc = match.matchTime || match.matchAt || null;
        const originalTableSrc = match.matchTable;
        const originalRoundSrc = match.matchRound;
        const originalGameDaySrc = match.gameDay;
        const delayedGameDaySrc = match.delayedGameDay;

        if (!originalDateSrc) return null;
        const originalDateIso = new Date(originalDateSrc).toISOString();
        const originalTimeIso = originalTimeSrc ? new Date(originalTimeSrc).toISOString() : null;
        const effectiveGameDay = (typeof delayedGameDaySrc === 'number' && !Number.isNaN(delayedGameDaySrc))
          ? delayedGameDaySrc
          : (typeof originalGameDaySrc === 'number' && !Number.isNaN(originalGameDaySrc))
            ? originalGameDaySrc
            : (originalGameDaySrc ? Number(originalGameDaySrc) : null);
        const effectiveDateIso = (isDelayed && match.delayedDate) ? new Date(match.delayedDate).toISOString() : originalDateIso;
        const effectiveTimeIso = (isDelayed && match.delayedTime) ? new Date(match.delayedTime).toISOString() : originalTimeIso;
        const effectiveTable = (isDelayed && match.delayedTable) ? match.delayedTable : originalTableSrc;
        const effectiveRound = (isDelayed && match.delayedRound) ? match.delayedRound : originalRoundSrc;

        return {
          id: match.id,
          date: effectiveDateIso,
          time: effectiveTimeIso,
          table: effectiveTable,
          round: effectiveRound,
          gameDay: effectiveGameDay,
          isDelayed,
          isPlayoffMatch,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          originalDateRaw: match.matchAt || match.matchDate,
          originalTime: match.matchTime || match.matchAt,
          originalTable: match.matchTable,
          originalRound: match.matchRound,
          delayedDate: match.delayedDate,
          delayedTime: match.delayedTime,
          delayedTable: match.delayedTable,
          delayedRound: match.delayedRound,
          delayedGameDay: delayedGameDaySrc,
          home: row.homeTeam?.name || match.homeTeamId,
          homeLogo: abs(row.homeTeam?.logo) || '/elitelogo.png',
          away: row.awayTeam?.name || match.awayTeamId,
          awayLogo: abs(row.awayTeam?.logo) || '/elitelogo.png',
          homeScore: match.homeTeamScore,
          awayScore: match.awayTeamScore,
        };
      })
      .filter(Boolean);
  }, [leagueMatches, allMatchesIncludingPlayoff, abs]);

  const matchDays = (Array.isArray(leagueMatches) ? leagueMatches : [])
    .map((row: any) => {
      const match = row.match;
      const isDelayed = match.isDelayed || false;
      
      // Use original data for grouping and display
      const originalDateSrc = match.matchAt || match.matchDate || null;
      const originalTimeSrc = match.matchTime || match.matchAt || null;
      const originalTableSrc = match.matchTable;
      const originalRoundSrc = match.matchRound;
      const originalGameDaySrc = match.gameDay;
      const delayedGameDaySrc = match.delayedGameDay;
      
      if (!originalDateSrc) return null;
      const originalDateIso = new Date(originalDateSrc).toISOString();
      const originalTimeIso = originalTimeSrc ? new Date(originalTimeSrc).toISOString() : null;
      // Effective schedule if delayed
      const effectiveGameDay = (typeof delayedGameDaySrc === 'number' && !Number.isNaN(delayedGameDaySrc)) ? delayedGameDaySrc : (typeof originalGameDaySrc === 'number' ? originalGameDaySrc : (originalGameDaySrc ? Number(originalGameDaySrc) : null));
      const effectiveDateIso = (isDelayed && match.delayedDate) ? new Date(match.delayedDate).toISOString() : originalDateIso;
      const effectiveTimeIso = (isDelayed && match.delayedTime) ? new Date(match.delayedTime).toISOString() : originalTimeIso;
      const effectiveTable = (isDelayed && match.delayedTable) ? match.delayedTable : originalTableSrc;
      const effectiveRound = (isDelayed && match.delayedRound) ? match.delayedRound : originalRoundSrc;
      
      return {
        id: match.id,
        date: effectiveDateIso, // Effective date for grouping/ordering
        time: effectiveTimeIso,
        table: effectiveTable,
        round: effectiveRound,
        gameDay: effectiveGameDay,
        isDelayed,
        originalDateRaw: match.matchAt || match.matchDate,
        originalTime: match.matchTime || match.matchAt,
        originalTable: match.matchTable,
        originalRound: match.matchRound,
        delayedDate: match.delayedDate,
        delayedTime: match.delayedTime,
        delayedTable: match.delayedTable,
        delayedRound: match.delayedRound,
        delayedGameDay: delayedGameDaySrc,
        home: row.homeTeam?.name || match.homeTeamId,
        homeLogo: abs(row.homeTeam?.logo) || '/elitelogo.png',
        away: row.awayTeam?.name || match.awayTeamId,
        awayLogo: abs(row.awayTeam?.logo) || '/elitelogo.png',
        homeScore: match.homeTeamScore,
        awayScore: match.awayTeamScore,
      };
    })
    .filter(Boolean)
    .reduce((acc: Record<string, any[]>, m: any) => {
      // Group strictly by effective gameday if available; otherwise by effective date
      const dateKey = new Date(m.date).toISOString().slice(0,10);
      const key = (typeof m.gameDay === 'number' && !Number.isNaN(m.gameDay)) ? `gd:${m.gameDay}` : `d:${dateKey}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      
      return acc;
    }, {} as Record<string, any[]>);
  const matchDayList = Object.entries(matchDays)
    .map(([groupKey, items], idx) => {
      // derive gameday (if grouped by gd:), otherwise infer date label from earliest date
      const isGd = groupKey.startsWith('gd:');
      const gameDayNum = isGd ? Number(groupKey.slice(3)) : undefined;
      const earliest = items
        .map((x: any) => new Date(x.date).getTime())
        .reduce((min: number, t: number) => Math.min(min, t), Number.POSITIVE_INFINITY);
      const dateIso = new Date(earliest).toISOString();
      return {
        id: (typeof gameDayNum === 'number' && !Number.isNaN(gameDayNum)) ? gameDayNum : (idx + 1),
        date: dateIso,
        round: (items[0] as any)?.round ?? (idx + 1),
        matches: items
        .map((m: any) => ({
          id: m.id,
          // raw timestamp for reliable sorting
          sortTime: m.time ? new Date(m.time).getTime() : 0,
          // formatted time for display
          time: m.time ? new Date(m.time).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '',
          tableNumber: m.table,
          round: m.round,
          isDelayed: m.isDelayed,
          originalDate: m.originalDate,
          originalTime: m.originalTime,
          originalTable: m.originalTable,
          originalRound: m.originalRound,
          delayedDate: m.delayedDate,
          delayedTime: m.delayedTime,
          delayedTable: m.delayedTable,
          delayedRound: m.delayedRound,
            delayedGameDay: m.delayedGameDay,
          homeTeam: { name: m.home, logo: m.homeLogo },
          awayTeam: { name: m.away, logo: m.awayLogo },
          homeScore: m.homeScore,
          awayScore: m.awayScore,
        }))
        .sort((a: any, b: any) => (a.sortTime - b.sortTime) || (a.tableNumber - b.tableNumber))
      };
    })
    .sort((a, b) => {
      // Primary: sort by numeric gameday id if both are numeric and not fallback-generated
      const isNumA = typeof a.id === 'number';
      const isNumB = typeof b.id === 'number';
      if (isNumA && isNumB) return (a.id as number) - (b.id as number);
      // Fallback: sort by date
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  const toggleMatchDay = (matchDayId: number) => {
    setExpandedMatchDays(prev => prev.includes(matchDayId) ? prev.filter(id => id !== matchDayId) : [...prev, matchDayId]);
  };
  const toggleRound = (key: string) => {
    setExpandedRounds(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };
  const toggleMatch = (matchId: string) => {
    setExpandedMatches(prev => prev.includes(matchId) ? prev.filter(id => id !== matchId) : [...prev, matchId]);
  };

  const teamInfoById = useMemo(() => {
    if (!standingsData?.standings) return new Map<string, { teamId: string; name: string; logo: string; seed: number }>();
    const map = new Map<string, { teamId: string; name: string; logo: string; seed: number }>();
    standingsData.standings.forEach((row: any, idx: number) => {
      map.set(String(row.teamId), {
        teamId: String(row.teamId),
        name: row.name,
        logo: abs(row.logo) || '/elitelogo.png',
        seed: idx + 1,
      });
    });
    return map;
  }, [standingsData, abs]);

  const teamInfoBySeed = useMemo(() => {
    const map = new Map<number, { teamId: string; name: string; logo: string; seed: number }>();
    teamInfoById.forEach((info) => {
      if (info?.seed) {
        map.set(info.seed, info);
      }
    });
    return map;
  }, [teamInfoById]);

  const knockoutAdvancers = useMemo(() => {
    if (!hasKnockoutPlayoff || !teamInfoById.size || !Array.isArray(allMatchesMapped) || allMatchesMapped.length === 0) {
      return {
        semi: { left: [null, null], right: [null, null] } as { left: Array<{ teamId: string; name: string; logo: string; seed: number } | null>; right: Array<{ teamId: string; name: string; logo: string; seed: number } | null>; },
        final: [null, null] as Array<{ teamId: string; name: string; logo: string; seed: number } | null>,
      };
    }

    const getSeriesWinner = (teamAId: string, teamBId: string, gameDay: number) => {
      if (!teamAId || !teamBId) return null;
      const seriesMatches = allMatchesMapped.filter((m: any) => {
        if (!m.isPlayoffMatch) return false;
        if (m.gameDay !== gameDay) return false;
        return (
          (m.homeTeamId === teamAId && m.awayTeamId === teamBId) ||
          (m.homeTeamId === teamBId && m.awayTeamId === teamAId)
        );
      });

      if (seriesMatches.length === 0) return null;

      let teamAWins = 0;
      let teamBWins = 0;

      seriesMatches.forEach((match: any) => {
        if (match.homeScore == null || match.awayScore == null) return;
        if (match.homeTeamId === teamAId && match.awayTeamId === teamBId) {
          if (match.homeScore > match.awayScore) teamAWins++;
          else if (match.awayScore > match.homeScore) teamBWins++;
        } else if (match.homeTeamId === teamBId && match.awayTeamId === teamAId) {
          if (match.homeScore > match.awayScore) teamBWins++;
          else if (match.awayScore > match.homeScore) teamAWins++;
        }
      });

      if (teamAWins >= knockoutWinsNeeded) return teamAId;
      if (teamBWins >= knockoutWinsNeeded) return teamBId;
      return null;
    };

    const semiSlots = {
      left: [null, null],
      right: [null, null],
    } as { left: Array<{ teamId: string; name: string; logo: string; seed: number } | null>; right: Array<{ teamId: string; name: string; logo: string; seed: number } | null>; };

    const quarterSeedPairs = [
      { seeds: [1, 8], slot: 'left' as const, index: 0 },
      { seeds: [5, 4], slot: 'left' as const, index: 1 },
      { seeds: [3, 6], slot: 'right' as const, index: 0 },
      { seeds: [7, 2], slot: 'right' as const, index: 1 },
    ];

    quarterSeedPairs.forEach(({ seeds, slot, index }) => {
      const teamA = teamInfoBySeed.get(seeds[0]);
      const teamB = teamInfoBySeed.get(seeds[1]);
      if (!teamA || !teamB) return;
      const winnerId = getSeriesWinner(teamA.teamId, teamB.teamId, 1);
      if (winnerId) {
        const winnerInfo = teamInfoById.get(winnerId);
        semiSlots[slot][index] = winnerInfo || null;
      }
    });

    const finalSlots: Array<{ teamId: string; name: string; logo: string; seed: number } | null> = [null, null];

    const semifinalSeries = [
      { teams: semiSlots.left, index: 0 },
      { teams: semiSlots.right, index: 1 },
    ];

    semifinalSeries.forEach(({ teams, index }) => {
      const teamA = teams[0];
      const teamB = teams[1];
      if (!teamA || !teamB) return;
      const winnerId = getSeriesWinner(teamA.teamId, teamB.teamId, 2);
      if (winnerId) {
        finalSlots[index] = teamInfoById.get(winnerId) || null;
      }
    });

    return { semi: semiSlots, final: finalSlots };
  }, [allMatchesMapped, hasKnockoutPlayoff, knockoutWinsNeeded, teamInfoById, teamInfoBySeed]);

  // Create matchup structure with matches for bracket display (similar to admin page)
  const knockoutMatchupsWithMatches = useMemo(() => {
    if (!knockoutBracket || !allMatchesMapped || allMatchesMapped.length === 0) return [];
    
    const playoffMatches = allMatchesMapped.filter((m: any) => m.isPlayoffMatch);
    const matchupMap = new Map<string, any[]>();
    
    // Group matches by matchup (team pair)
    playoffMatches.forEach((m: any) => {
      const teamIds = [m.homeTeamId, m.awayTeamId].sort().join('-');
      if (!matchupMap.has(teamIds)) {
        matchupMap.set(teamIds, []);
      }
      matchupMap.get(teamIds)!.push(m);
    });
    
    // Get current round matchups
    let currentMatchups: any[] = [];
    if (playoffRoundTab === 'quarter') {
      currentMatchups = knockoutBracket?.quarterfinals || [];
    } else if (playoffRoundTab === 'semi') {
      currentMatchups = knockoutBracket?.semifinals || [];
    } else if (playoffRoundTab === 'final') {
      currentMatchups = knockoutBracket?.finals || [];
    }
    
    return currentMatchups.map((matchup: any) => {
      const teamIds = [matchup.homeTeamId, matchup.awayTeamId].sort().join('-');
      const matches = matchupMap.get(teamIds) || [];
      
      // Sort matches by round or date
      const sortedMatches = matches.sort((a: any, b: any) => {
        const aRound = a.round || 0;
        const bRound = b.round || 0;
        if (aRound !== bRound) return aRound - bRound;
        return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
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
  }, [knockoutBracket, allMatchesMapped, playoffRoundTab]);

  if (loadingMy) return <div className="p-6 text-white">Betöltés...</div>;
  if (!leagueId) return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className={`${bebasNeue.className} text-4xl md:text-6xl text-white mb-4 tracking-wider`}>
            TABELLA
          </h1>
          <div className="flex items-center justify-center space-x-4 text-[#ff5c1a]">
            <span className="text-sm">•</span>
            <span className="text-sm">Nincs aktív bajnokság</span>
            <span className="text-sm">•</span>
            <span className="text-sm">Szezon</span>
          </div>
        </div>
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl text-white font-semibold mb-2">Nincs elérhető bajnokság</h2>
          <p className="text-gray-400">Nem található bajnokság az aktív szezonban.</p>
        </div>
      </div>
    </div>
  );
  if (isLoading || !championship) return <div className="p-6 text-white">Betöltés...</div>;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden border-4 border-[#ff5c1a] flex-shrink-0">
          <Image src={abs(championship.logo) || '/elitelogo.png'} alt={championship.name} width={96} height={96} className="object-cover w-full h-full" />
        </div>
        <div className="text-center sm:text-left">
          <h1 className={`${bebasNeue.className} text-2xl sm:text-3xl lg:text-4xl text-white`}>{championship.name}</h1>
          <span className="inline-block px-3 py-1 rounded-full bg-[#ff5c1a] text-white font-bold text-sm sm:text-base">
            {championship.isStarted ? (championship.phase === 'knockout' ? 'Knockout' : 'Alapszkasz') : 'Nem kezdőtött el'}
          </span>
        </div>
      </div>

      {/* MVP boxes */}
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standings (read-only with filters, forms, rank modal) */}
      <div className="bg-[#001a3a]/60 rounded-xl p-6 border border-[#ff5c1a]/30 mb-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <h3 className={`${bebasNeue.className} text-2xl text-white`}>Tabella</h3>
          {showPlayoffTab && (
            <div className="flex items-center gap-2 bg-black/30 border border-[#ff5c1a]/40 rounded-full p-1">
              <button
                onClick={() => setStandingsTab('regular')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${standingsTab === 'regular' ? 'bg-[#ff5c1a] text-white' : 'text-white/60 hover:text-white/80'}`}
              >
                Alapszakasz
              </button>
              <button
                onClick={() => setStandingsTab('playoff')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${standingsTab === 'playoff' ? 'bg-[#ff5c1a] text-white' : 'text-white/60 hover:text-white/80'}`}
              >
                Playoff
              </button>
            </div>
          )}
        </div>
        {championship.isStarted && standingsTab === 'regular' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end mb-3 gap-3 sm:gap-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <label className="text-white/70 text-sm">Játéknap:</label>
              <select value={selectedDay} onChange={(e) => { setSelectedDay(e.target.value === 'all' ? 'all' : Number(e.target.value)); setUptoGameDay('all'); setUptoRound('all'); }} className="bg-black/40 text-white border border-white/20 rounded px-2 py-1 text-sm w-full sm:w-auto">
                <option value="all">Összes</option>
                {Array.from(new Set((leagueMatches || []).map((rm: any) => rm.match.delayedGameDay || rm.match.gameDay))).filter((x: any) => !!x).sort((a: any,b: any)=>a-b).map((g: number) => (
                  <option key={`gd-${g}`} value={g}>Gameday {g}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <label className="text-white/70 text-sm">Játéknapig:</label>
              <select value={uptoGameDay} onChange={(e) => { setUptoGameDay(e.target.value === 'all' ? 'all' : Number(e.target.value)); setSelectedDay('all'); setUptoRound('all'); }} className="bg-black/40 text-white border border-white/20 rounded px-2 py-1 text-sm w-full sm:w-auto">
                <option value="all">Összes</option>
                {Array.from(new Set((leagueMatches || []).map((rm: any) => rm.match.delayedGameDay || rm.match.gameDay))).filter((x: any) => !!x).sort((a: any,b: any)=>a-b).map((g: number) => (
                  <option key={`gd-${g}`} value={g}>Gameday {g}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <label className="text-white/70 text-sm">Fordulóig:</label>
              <select value={uptoRound} onChange={(e) => { setUptoRound(e.target.value === 'all' ? 'all' : Number(e.target.value)); setSelectedDay('all'); setUptoGameDay('all'); }} className="bg-black/40 text-white border border-white/20 rounded px-2 py-1 text-sm w-full sm:w-auto">
                <option value="all">Összes</option>
                {Array.from(new Set((leagueMatches || []).map((rm: any) => rm.match.matchRound))).filter((x: any) => !!x).sort((a: any,b: any)=>a-b).map((r: number) => (
                  <option key={`rd-${r}`} value={r}>Forduló {r}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        {standingsTab === 'regular' || !showPlayoffTab ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#ff5c1a]/30">
              <thead>
                <tr className="text-left text-white">
                  <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm">#</th>
                  <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm">Csapat</th>
                  <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden sm:table-cell">Meccs</th>
                  <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm">GY</th>
                  <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm">V</th>
                  <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">Győzelem</th>
                  <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">Győzelem (h)</th>
                  <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">Vereség (h)</th>
                  <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">Vereség</th>
                  <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden md:table-cell">PK</th>
                  <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm">Pont</th>
                  <th className="py-3 pr-2 sm:pr-4 text-xs sm:text-sm hidden sm:table-cell">Forma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ff5c1a]/20">
                {(() => {
                  let source = standingsData?.standings;
                  if (selectedDay !== 'all') source = standingsByDay?.standings;
                  if (uptoGameDay !== 'all') source = standingsUpto?.standings;
                  if (uptoRound !== 'all') source = standingsUptoRound?.standings;
                  const rows = (source && source.length > 0) ? source : [];
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
                      delta = prevRank - s.rank;
                      if (delta > 0) moveIcon = <FiArrowUp className="text-green-400" />;
                      else if (delta < 0) moveIcon = <FiArrowDown className="text-red-400" />;
                      else moveIcon = <FiMinus className="text-white/50" />;
                    }
                    const all = (leagueMatches || []) as any[];
                    let tMatches = all.filter((row: any) => row.match.matchStatus === 'completed' && (row.match.homeTeamId === s.teamId || row.match.awayTeamId === s.teamId));
                    if (uptoRound !== 'all') tMatches = tMatches.filter((row: any) => Number(row.match.matchRound || 0) <= Number(uptoRound));
                    else if (uptoGameDay !== 'all') tMatches = tMatches.filter((row: any) => Number((row.match.delayedGameDay || row.match.gameDay) || 0) <= Number(uptoGameDay));
                    else if (selectedDay !== 'all') tMatches = tMatches.filter((row: any) => Number((row.match.delayedGameDay || row.match.gameDay) || 0) === Number(selectedDay));
                    tMatches = tMatches.sort((a: any, b: any) => new Date(a.match.matchAt || a.match.matchDate || a.match.createdAt).getTime() - new Date(b.match.matchAt || b.match.matchDate || b.match.createdAt).getTime());
                    const last5 = tMatches.slice(-5).map((m: any) => {
                      const isHome = m.match.homeTeamId === s.teamId;
                      const hs = Number(m.match.homeTeamScore || 0);
                      const as = Number(m.match.awayTeamScore || 0);
                      const win = isHome ? hs > as : as > hs;
                      const maxS = Math.max(hs, as);
                      const minS = Math.min(hs, as);
                      const ot = maxS > 10 && minS >= 10;
                      const code = win ? (ot ? 'GYH' : 'GY') : (ot ? 'VH' : 'V');
                      const color = win ? (ot ? 'bg-green-600/60' : 'bg-green-600') : (ot ? 'bg-red-600/60' : 'bg-red-600');
                      const dateStr = (m.match.matchAt || m.match.matchDate) ? new Date(m.match.matchAt || m.match.matchDate).toLocaleDateString('hu-HU', { timeZone: 'UTC' }) : '';
                      const score = `${hs} : ${as}`;
                      const oppName = isHome ? (m.awayTeam?.name || m.match.awayTeamId) : (m.homeTeam?.name || m.match.homeTeamId);
                      const title = `${score} (${isHome ? s.name : oppName} - ${isHome ? oppName : s.name})\n${dateStr}`;
                      return { code, color, title };
                    });
                    return (
                      <tr key={s.teamId} className="text-white">
                        <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm">{s.rank}</td>
                        <td className="py-2 pr-2 sm:pr-4 flex items-center gap-2 min-w-0">
                          <Image src={abs(s.logo) || '/elitelogo.png'} alt={s.name} width={20} height={20} className="rounded-full border border-white/10 flex-shrink-0" />
                          <button type="button" onClick={() => setRankModal({ open: true, teamId: s.teamId, teamName: s.name })} className="underline-offset-2 hover:underline cursor-pointer text-xs sm:text-sm truncate">{s.name}</button>
                          {(uptoGameDay !== 'all' || uptoRound !== 'all') && moveIcon && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs">{moveIcon}<span className="text-white/70">{delta ? (delta > 0 ? `+${delta}` : `${delta}`) : '0'}</span></span>
                          )}
                        </td>
                        <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden sm:table-cell">{s.games ?? 0}</td>
                        <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm">{s.winsTotal ?? 0}</td>
                        <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm">{s.lossesTotal ?? 0}</td>
                        <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">{s.winsRegular ?? 0}</td>
                        <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">{s.winsOT ?? 0}</td>
                        <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">{s.lossesOT ?? 0}</td>
                        <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden lg:table-cell">{s.lossesRegular ?? 0}</td>
                        <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden md:table-cell">{s.cupDiff ?? 0}</td>
                        <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm font-bold">{s.points ?? 0}</td>
                        <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm hidden sm:table-cell">
                          <Tooltip.Provider delayDuration={100}>
                            <div className="flex items-center gap-1">
                              {last5.length === 0 ? (
                                <span className="text-white/50">-</span>
                              ) : last5.map((it, i) => (
                                <Tooltip.Root key={i}>
                                  <Tooltip.Trigger asChild>
                                    <button type="button" className={`inline-flex items-center justify-center rounded ${it.color} text-[8px] leading-none w-5 h-5 sm:w-6 sm:h-6 text-white`}>
                                      {it.code}
                                    </button>
                                  </Tooltip.Trigger>
                                  <Tooltip.Content side="top" sideOffset={6} className="rounded bg-black/80 text-white text-xs px-2 py-1 shadow whitespace-pre-line">
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
        ) : showPlayoffTab ? (
          hasKnockoutPlayoff ? (
            // Knockout bracket display
            <div className="py-8">
              <div className="text-center mb-6">
                <h2 className={`${bebasNeue.className} text-4xl md:text-5xl text-white mb-2 tracking-wider`}>
                  PLAYOFF
                </h2>
                <div className={`${bebasNeue.className} text-white text-lg md:text-xl mb-6`}>
                  {championship.name.toUpperCase()}
                </div>
                
                {/* Round subtabs */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  <button
                    onClick={() => setPlayoffRoundTab('quarter')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      playoffRoundTab === 'quarter' 
                        ? 'bg-[#ff5c1a] text-white' 
                        : 'bg-black/40 text-white/60 hover:text-white/80 border border-[#ff5c1a]/30'
                    }`}
                  >
                    Negyeddöntő
                  </button>
                  <button
                    onClick={() => setPlayoffRoundTab('semi')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      playoffRoundTab === 'semi' 
                        ? 'bg-[#ff5c1a] text-white' 
                        : 'bg-black/40 text-white/60 hover:text-white/80 border border-[#ff5c1a]/30'
                    }`}
                  >
                    Elődöntő
                  </button>
                  <button
                    onClick={() => setPlayoffRoundTab('final')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      playoffRoundTab === 'final' 
                        ? 'bg-[#ff5c1a] text-white' 
                        : 'bg-black/40 text-white/60 hover:text-white/80 border border-[#ff5c1a]/30'
                    }`}
                  >
                    Döntő
                  </button>
                </div>
              </div>
              {knockoutBracketData ? (
                <div className="flex flex-col items-center gap-8">
                  {/* Bracket structure - two columns with better spacing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 lg:gap-24 w-full max-w-6xl">
                    {/* Left column */}
                    <div className="space-y-6">
                      {(() => {
                        let leftSeeds: number[] = [];
                        let teamsToShow: number = 0;
                        
                        // Use knockoutBracket API data if available
                        let matchups: Array<{
                          homeTeamId: string;
                          homeTeamName: string;
                          awayTeamId: string;
                          awayTeamName: string;
                          homeWins: number;
                          awayWins: number;
                          winnerId?: string;
                          isComplete: boolean;
                        }> = [];
                        
                        if (playoffRoundTab === 'quarter') {
                          matchups = knockoutBracket?.quarterfinals || [];
                          leftSeeds = [1, 8, 5, 4].filter(seed => seed <= (knockoutBracketData?.teams.length || 0));
                          teamsToShow = leftSeeds.length;
                        } else if (playoffRoundTab === 'semi') {
                          matchups = knockoutBracket?.semifinals || [];
                          teamsToShow = 2;
                        } else if (playoffRoundTab === 'final') {
                          matchups = knockoutBracket?.finals || [];
                          teamsToShow = 1;
                        }
                        
                        // Group teams into pairs for matchups
                        type TeamItem = {
                          index: number;
                          team: { seed: number; teamId: string; name: string; logo: string } | null;
                          seed: number | null;
                          matchup?: typeof matchups[0];
                        };
                        const pairs: Array<Array<TeamItem>> = [];
                        
                        if (matchups.length > 0 && knockoutBracket) {
                          // Use API data with winners - for left column, only show first 2 matchups if quarterfinals
                          const endIdx = playoffRoundTab === 'quarter' ? 2 : matchups.length;
                          for (let i = 0; i < endIdx; i++) {
                            const matchup = matchups[i];
                            const homeTeam = knockoutBracketData?.teams.find(t => t.teamId === matchup.homeTeamId);
                            const awayTeam = knockoutBracketData?.teams.find(t => t.teamId === matchup.awayTeamId);
                            pairs.push([
                              {
                                index: i * 2,
                                team: homeTeam || null,
                                seed: homeTeam?.seed || null,
                                matchup,
                              },
                              {
                                index: i * 2 + 1,
                                team: awayTeam || null,
                                seed: awayTeam?.seed || null,
                                matchup,
                              },
                            ]);
                          }
                        } else {
                          // Fallback to original logic
                          for (let i = 0; i < teamsToShow; i += 2) {
                            const pair = [];
                            for (let j = 0; j < 2 && i + j < teamsToShow; j++) {
                              let team: typeof knockoutBracketData.teams[0] | null = null;
                              let seed: number | null = null;
                              
                              if (playoffRoundTab === 'quarter' && knockoutBracketData) {
                                seed = leftSeeds[i + j];
                                team = knockoutBracketData.teams.find(t => t.seed === seed) || null;
                              } else if (playoffRoundTab === 'semi') {
                                const advancers = knockoutAdvancers?.semi?.left || [];
                                team = advancers[i + j] || null;
                                seed = team?.seed ?? null;
                              } else if (playoffRoundTab === 'final') {
                                const finalTeams = knockoutAdvancers?.final || [];
                                if (i === 0 && j === 0) {
                                  team = finalTeams[0] || null;
                                  seed = team?.seed ?? null;
                                } else {
                                  team = null;
                                  seed = null;
                                }
                              }
                              
                              pair.push({ index: i + j, team, seed });
                            }
                            pairs.push(pair);
                          }
                        }
                        
                        return pairs.map((pair, pairIndex) => {
                          const isLastPair = pairIndex === pairs.length - 1;
                          const isAfterFirstMatchup = playoffRoundTab === 'quarter' && pairIndex === 0;
                          
                          // Find matching matchup with matches
                          const matchupWithMatches = pair.length === 2 && pair[0].team && pair[1].team
                            ? knockoutMatchupsWithMatches.find((m: any) => {
                                const teamIds = [pair[0].team!.teamId, pair[1].team!.teamId].sort();
                                const matchupTeamIds = [m.homeTeamId, m.awayTeamId].sort();
                                return teamIds[0] === matchupTeamIds[0] && teamIds[1] === matchupTeamIds[1];
                              })
                            : null;
                          
                          // Determine which team in pair corresponds to home/away in matchup
                          let pairTeam0IsHome = true;
                          if (matchupWithMatches && pair[0].team && pair[1].team) {
                            pairTeam0IsHome = matchupWithMatches.homeTeamId === pair[0].team.teamId;
                          }
                          
                          // Calculate wins for each team
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
                            // Fallback to API wins if matches not available
                            team0Wins = pairTeam0IsHome ? matchupWithMatches.homeWins : matchupWithMatches.awayWins;
                            team1Wins = pairTeam0IsHome ? matchupWithMatches.awayWins : matchupWithMatches.homeWins;
                          }
                          
                          return (
                            <div key={pairIndex} className={`relative ${isAfterFirstMatchup ? 'mb-20' : ''}`}>
                              {pair.map((item, itemIndex) => {
                                const isEmpty = !item.team;
                                const matchup = matchupWithMatches || item.matchup;
                                const isWinner = matchup?.winnerId === item.team?.teamId;
                                const wins = itemIndex === 0 ? team0Wins : team1Wins;
                                
                                return (
                                  <div key={item.index} className={`relative ${itemIndex === 0 ? 'mb-3' : ''}`}>
                                    <div className={`bg-gradient-to-r from-[#ff5c1a]/20 via-[#ff5c1a]/10 to-transparent rounded-xl border-2 ${isWinner ? 'border-green-500' : 'border-[#ff5c1a]/60'} p-4 min-h-[110px] md:min-h-[90px] flex flex-col justify-center ${isEmpty ? 'opacity-50' : 'hover:border-[#ff5c1a] hover:shadow-lg hover:shadow-[#ff5c1a]/30'} transition-all`}>
                                      <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          {item.seed && (
                                            <span className={`${bebasNeue.className} text-[#ff5c1a] font-bold text-xl flex-shrink-0`}>
                                              {item.seed}.
                                            </span>
                                          )}
                                          <span className={`${bebasNeue.className} text-white font-semibold text-lg md:text-xl truncate tracking-wide ${isEmpty ? 'text-white/40' : ''}`}>
                                            {item.team ? item.team.name.toUpperCase() : '-'}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                          {/* Main result score - to the left of logo */}
                                          {matchupWithMatches && matchupWithMatches.matches && matchupWithMatches.matches.length > 0 && (
                                            <span className={`${bebasNeue.className} text-3xl md:text-4xl font-bold ${wins > (itemIndex === 0 ? team1Wins : team0Wins) ? 'text-[#ff5c1a]' : 'text-white/60'}`}>
                                              {wins}
                                            </span>
                                          )}
                                          {item.team && (
                                            <Image 
                                              src={item.team.logo || '/elitelogo.png'} 
                                              alt={item.team.name} 
                                              width={48} 
                                              height={48} 
                                              className="object-contain w-12 h-12 md:w-14 md:h-14"
                                            />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {itemIndex === 0 && pair.length === 2 && (
                                      <>
                                        {/* Match results display */}
                                        {matchupWithMatches && matchupWithMatches.matches && matchupWithMatches.matches.length > 0 && (
                                          <div className="pt-3">
                                            <div className="flex items-center justify-center gap-2 text-sm text-white/80">
                                              <span className="text-white/60">
                                                {matchupWithMatches.matches.slice(0, 7).map((match: any, matchIdx: number) => {
                                                  const isCompleted = match.homeScore !== null && match.awayScore !== null;
                                                  const homeScore = match.homeScore ?? 0;
                                                  const awayScore = match.awayScore ?? 0;
                                                  
                                                  // Determine which team is home for this specific match
                                                  const matchNumber = matchIdx + 1;
                                                  const isOddMatch = matchNumber % 2 === 1;
                                                  const isTeam0HomeThisMatch = isOddMatch ? pairTeam0IsHome : !pairTeam0IsHome;
                                                  
                                                  // Display score always in pair[0] - pair[1] order
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
                        });
                      })()}
                    </div>
                    {/* Right column */}
                    <div className="space-y-6">
                      {(() => {
                        // Use knockoutBracket API data if available
                        let matchups: Array<{
                          homeTeamId: string;
                          homeTeamName: string;
                          awayTeamId: string;
                          awayTeamName: string;
                          homeWins: number;
                          awayWins: number;
                          winnerId?: string;
                          isComplete: boolean;
                        }> = [];
                        let rightSeeds: number[] = [];
                        let teamsToShow: number = 0;
                        
                        if (playoffRoundTab === 'quarter') {
                          matchups = knockoutBracket?.quarterfinals || [];
                          rightSeeds = [3, 6, 7, 2].filter(seed => seed <= (knockoutBracketData?.teams.length || 0));
                          teamsToShow = rightSeeds.length;
                        } else if (playoffRoundTab === 'semi') {
                          matchups = knockoutBracket?.semifinals || [];
                          teamsToShow = 2;
                        } else if (playoffRoundTab === 'final') {
                          matchups = knockoutBracket?.finals || [];
                          teamsToShow = 1;
                        }
                        
                        // Group teams into pairs for matchups
                        type TeamItem = {
                          index: number;
                          team: { seed: number; teamId: string; name: string; logo: string } | null;
                          seed: number | null;
                          matchup?: typeof matchups[0];
                        };
                        const pairs: Array<Array<TeamItem>> = [];
                        
                        if (matchups.length > 0 && knockoutBracket) {
                          // Use API data with winners - for right column, skip first matchup if quarterfinals
                          const startIdx = playoffRoundTab === 'quarter' ? 2 : 0;
                          for (let i = startIdx; i < matchups.length; i++) {
                            const matchup = matchups[i];
                            const homeTeam = knockoutBracketData?.teams.find(t => t.teamId === matchup.homeTeamId);
                            const awayTeam = knockoutBracketData?.teams.find(t => t.teamId === matchup.awayTeamId);
                            pairs.push([
                              {
                                index: (i - startIdx) * 2,
                                team: homeTeam || null,
                                seed: homeTeam?.seed || null,
                                matchup,
                              },
                              {
                                index: (i - startIdx) * 2 + 1,
                                team: awayTeam || null,
                                seed: awayTeam?.seed || null,
                                matchup,
                              },
                            ]);
                          }
                        } else {
                          // Fallback to original logic
                          for (let i = 0; i < teamsToShow; i += 2) {
                            const pair = [];
                            for (let j = 0; j < 2 && i + j < teamsToShow; j++) {
                              let team: typeof knockoutBracketData.teams[0] | null = null;
                              let seed: number | null = null;
                              
                              if (playoffRoundTab === 'quarter' && knockoutBracketData) {
                                seed = rightSeeds[i + j];
                                team = knockoutBracketData.teams.find(t => t.seed === seed) || null;
                              } else if (playoffRoundTab === 'semi') {
                                const advancers = knockoutAdvancers?.semi?.right || [];
                                team = advancers[i + j] || null;
                                seed = team?.seed ?? null;
                              } else if (playoffRoundTab === 'final') {
                                const finalTeams = knockoutAdvancers?.final || [];
                                if (i === 0 && j === 0) {
                                  team = finalTeams[1] || null;
                                  seed = team?.seed ?? null;
                                } else {
                                  team = null;
                                  seed = null;
                                }
                              }
                              
                              pair.push({ index: i + j, team, seed });
                            }
                            pairs.push(pair);
                          }
                        }
                        
                        return pairs.map((pair, pairIndex) => {
                          const isAfterFirstMatchup = playoffRoundTab === 'quarter' && pairIndex === 0;
                          
                          // Find matching matchup with matches
                          const matchupWithMatches = pair.length === 2 && pair[0].team && pair[1].team
                            ? knockoutMatchupsWithMatches.find((m: any) => {
                                const teamIds = [pair[0].team!.teamId, pair[1].team!.teamId].sort();
                                const matchupTeamIds = [m.homeTeamId, m.awayTeamId].sort();
                                return teamIds[0] === matchupTeamIds[0] && teamIds[1] === matchupTeamIds[1];
                              })
                            : null;
                          
                          // Determine which team in pair corresponds to home/away in matchup
                          let pairTeam0IsHome = true;
                          if (matchupWithMatches && pair[0].team && pair[1].team) {
                            pairTeam0IsHome = matchupWithMatches.homeTeamId === pair[0].team.teamId;
                          }
                          
                          // Calculate wins for each team
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
                            // Fallback to API wins if matches not available
                            team0Wins = pairTeam0IsHome ? matchupWithMatches.homeWins : matchupWithMatches.awayWins;
                            team1Wins = pairTeam0IsHome ? matchupWithMatches.awayWins : matchupWithMatches.homeWins;
                          }
                          
                          return (
                            <div key={pairIndex} className={`relative ${isAfterFirstMatchup ? 'mb-20' : ''}`}>
                              {pair.map((item, itemIndex) => {
                                const isEmpty = !item.team;
                                const matchup = matchupWithMatches || item.matchup;
                                const isWinner = matchup?.winnerId === item.team?.teamId;
                                const wins = itemIndex === 0 ? team0Wins : team1Wins;
                                
                                return (
                                  <div key={item.index} className={`relative ${itemIndex === 0 ? 'mb-3' : ''}`}>
                                    <div className={`bg-gradient-to-r from-transparent via-[#ff5c1a]/10 to-[#ff5c1a]/20 rounded-xl border-2 ${isWinner ? 'border-green-500' : 'border-[#ff5c1a]/60'} p-4 min-h-[110px] md:min-h-[90px] flex flex-col justify-center ${isEmpty ? 'opacity-50' : 'hover:border-[#ff5c1a] hover:shadow-lg hover:shadow-[#ff5c1a]/30'} transition-all`}>
                                      <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          {item.seed && (
                                            <span className={`${bebasNeue.className} text-[#ff5c1a] font-bold text-xl flex-shrink-0`}>
                                              {item.seed}.
                                            </span>
                                          )}
                                          <span className={`${bebasNeue.className} text-white font-semibold text-lg md:text-xl truncate tracking-wide ${isEmpty ? 'text-white/40' : ''} ${isWinner ? 'text-green-400' : ''}`}>
                                            {item.team ? item.team.name.toUpperCase() : '-'}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                          {/* Main result score - to the left of logo */}
                                          {matchupWithMatches && matchupWithMatches.matches && matchupWithMatches.matches.length > 0 && (
                                            <span className={`${bebasNeue.className} text-3xl md:text-4xl font-bold ${wins > (itemIndex === 0 ? team1Wins : team0Wins) ? 'text-[#ff5c1a]' : 'text-white/60'}`}>
                                              {wins}
                                            </span>
                                          )}
                                          {item.team && (
                                            <Image 
                                              src={item.team.logo || '/elitelogo.png'} 
                                              alt={item.team.name} 
                                              width={48} 
                                              height={48} 
                                              className="object-contain w-12 h-12 md:w-14 md:h-14"
                                            />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {itemIndex === 0 && pair.length === 2 && (
                                      <>
                                        {/* Match results display */}
                                        {matchupWithMatches && matchupWithMatches.matches && matchupWithMatches.matches.length > 0 && (
                                          <div className="pt-3">
                                            <div className="flex items-center justify-center gap-2 text-sm text-white/80">
                                              <span className="text-white/60">
                                                {matchupWithMatches.matches.slice(0, 7).map((match: any, matchIdx: number) => {
                                                  const isCompleted = match.homeScore !== null && match.awayScore !== null;
                                                  const homeScore = match.homeScore ?? 0;
                                                  const awayScore = match.awayScore ?? 0;
                                                  
                                                  // Determine which team is home for this specific match
                                                  const matchNumber = matchIdx + 1;
                                                  const isOddMatch = matchNumber % 2 === 1;
                                                  const isTeam0HomeThisMatch = isOddMatch ? pairTeam0IsHome : !pairTeam0IsHome;
                                                  
                                                  // Display score always in pair[0] - pair[1] order
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
                        });
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-white/60">A playoff bracket betöltése...</div>
                </div>
              )}
            </div>
          ) : (
            // Grouped playoff tables
            <div className="space-y-6">
              <div>
                <h4 className="text-white font-semibold mb-2">Felső ház</h4>
                {playoffUpperTable.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#ff5c1a]/30">
                    <thead>
                      <tr className="text-left text-white">
                        <th className="py-2 pr-4 text-sm">#</th>
                        <th className="py-2 pr-4 text-sm">Csapat</th>
                        <th className="py-2 pr-4 text-sm">GY</th>
                        <th className="py-2 pr-4 text-sm">V</th>
                        <th className="py-2 pr-4 text-sm hidden md:table-cell">PK</th>
                        <th className="py-2 pr-4 text-sm">Pont</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ff5c1a]/20">
                      {playoffUpperTable.map((s: any) => (
                        <tr key={s.teamId} className="text-white">
                          <td className="py-2 pr-4">{s.displayRank}</td>
                          <td className="py-2 pr-4 flex items-center gap-2">
                            <Image src={abs(s.logo) || '/elitelogo.png'} alt={s.name} width={20} height={20} className="rounded-full border border-white/10" />
                            <span>{s.name}</span>
                          </td>
                          <td className="py-2 pr-4">{s.winsTotal ?? 0}</td>
                          <td className="py-2 pr-4">{s.lossesTotal ?? 0}</td>
                          <td className="py-2 pr-4 hidden md:table-cell">{s.cupDiff ?? 0}</td>
                          <td className="py-2 pr-4 font-bold">{s.points ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-white/60 text-sm">Nincs playoff adat.</div>
              )}
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Alsó ház</h4>
              {playoffLowerTable.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#ff5c1a]/30">
                    <thead>
                      <tr className="text-left text-white">
                        <th className="py-2 pr-4 text-sm">#</th>
                        <th className="py-2 pr-4 text-sm">Csapat</th>
                        <th className="py-2 pr-4 text-sm">GY</th>
                        <th className="py-2 pr-4 text-sm">V</th>
                        <th className="py-2 pr-4 text-sm hidden md:table-cell">PK</th>
                        <th className="py-2 pr-4 text-sm">Pont</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ff5c1a]/20">
                      {playoffLowerTable.map((s: any) => (
                        <tr key={s.teamId} className="text-white">
                          <td className="py-2 pr-4">{s.displayRank}</td>
                          <td className="py-2 pr-4 flex items-center gap-2">
                            <Image src={abs(s.logo) || '/elitelogo.png'} alt={s.name} width={20} height={20} className="rounded-full border border-white/10" />
                            <span>{s.name}</span>
                          </td>
                          <td className="py-2 pr-4">{s.winsTotal ?? 0}</td>
                          <td className="py-2 pr-4">{s.lossesTotal ?? 0}</td>
                          <td className="py-2 pr-4 hidden md:table-cell">{s.cupDiff ?? 0}</td>
                          <td className="py-2 pr-4 font-bold">{s.points ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-white/60 text-sm">Nincs playoff adat.</div>
              )}
            </div>
          </div>
          )
        ) : null}
      </div>

      {rankModal.open && rankModal.teamId && (
        <RankModal
          open={rankModal.open}
          onClose={() => setRankModal({ open: false })}
          leagueId={leagueId!}
          teamId={rankModal.teamId}
          teamName={rankModal.teamName || ''}
        />
      )}

      {/* Matches */}
      {standingsTab === 'playoff' && showGroupedPlayoffTab ? (
        <div className="space-y-6">
          {['upper', 'lower'].map((house) => {
            const label = house === 'upper' ? 'Felső ház meccsei' : 'Alsó ház meccsei';
            const matches = (playoffMatches as any)?.[house] || [];
            return (
              <div key={house} className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl border border-[#ff5c1a]/30 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className={`${bebasNeue.className} text-xl text-white`}>{label}</h4>
                  <span className="text-white/70 text-sm">{matches.length ? `${matches.length} meccs` : 'Nincs meccs'}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matches.map((match: any) => {
                    const date = match.matchAt ? new Date(match.matchAt) : null;
                    return (
                      <div key={match.id} className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,#09204c,#010a1c)] p-4 shadow-[0_10px_25px_rgba(0,0,0,0.35)] space-y-3">
                        <div className="flex items-center justify-between text-white/70 text-xs">
                          <span>Időkör {match.gameDay ?? '-'}</span>
                          <span>Asztal {match.table ?? '-'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Image src={abs(match.home?.logo) || '/elitelogo.png'} alt={match.home?.name || ''} width={32} height={32} className="rounded-full border border-white/10" />
                            <span className="text-white font-semibold truncate">{match.home?.name || '-'}</span>
                          </div>
                          <div className={`${bebasNeue.className} text-2xl text-white`}>
                            {match.status === 'completed' ? (
                              <>
                                <span>{match.home?.score ?? 0}</span>
                                <span className="text-white/60 mx-1">-</span>
                                <span>{match.away?.score ?? 0}</span>
                              </>
                            ) : (
                              <span className="text-white/60 text-base">vs</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 min-w-0 justify-end">
                            <span className="text-white font-semibold truncate text-right">{match.away?.name || '-'}</span>
                            <Image src={abs(match.away?.logo) || '/elitelogo.png'} alt={match.away?.name || ''} width={32} height={32} className="rounded-full border border-white/10" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-white/70">
                          <div>
                            <div>{date ? date.toLocaleDateString('hu-HU') : '-'}</div>
                            <div>{date ? date.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                          </div>
                          <span className={`px-3 py-1 rounded-full border text-[10px] tracking-wide ${match.status === 'completed' ? 'border-green-300 text-green-200' : 'border-orange-200 text-orange-200'}`}>
                            {match.status === 'completed' ? 'LEJÁTSZVA' : 'ÜTEMEZVE'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {matches.length === 0 && (
                    <div className="text-white/60 text-sm">Nincs playoff meccs.</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {matchDayList.map((matchDay) => (
            <div key={matchDay.id} className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl overflow-hidden border border-[#ff5c1a]/40">
              <button onClick={() => toggleMatchDay(matchDay.id)} className="w-full flex items-center justify-between p-6 hover:bg-[#001a3a]/60 transition-colors">
                <h2 className={`${bebasNeue.className} text-2xl text-white`}>Gameday {matchDay.id} - {new Date(matchDay.date).toLocaleDateString('hu-HU', { timeZone: 'UTC' })}</h2>
                {expandedMatchDays.includes(matchDay.id) ? <FiChevronUp className="w-6 h-6 text-[#ff5c1a]" /> : <FiChevronDown className="w-6 h-6 text-[#ff5c1a]" />}
              </button>
              {expandedMatchDays.includes(matchDay.id) && (
                <div className="p-6 space-y-6">
                  {(() => {
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
                      const sorted = (items as any[]).sort((a, b) => (a.sortTime - b.sortTime) || ((a.tableNumber as any) - (b.tableNumber as any)));
                      return (
                        <div key={key} className="bg-black/20 rounded-lg">
                          <button onClick={() => toggleRound(key)} className="w-full flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <span className="text-white">{r}. Forduló</span>
                            {expandedRounds.includes(key) ? <FiChevronUp className="w-5 h-5 text-[#ff5c1a]" /> : <FiChevronDown className="w-5 h-5 text-[#ff5c1a]" />}
                          </button>
                          {expandedRounds.includes(key) && (
                            <div className="p-4 space-y-4">
                              {sorted.map((match: any) => {
                                const isOT = Math.max(Number(match.homeScore||0), Number(match.awayScore||0)) > 10 && Math.min(Number(match.homeScore||0), Number(match.awayScore||0)) >= 10;
                                const keyId = String(match.id);
                                return (
                                  <div key={keyId} className={`${match.isDelayed ? (match.round === match.originalRound ? "bg-red-900/20" : "bg-yellow-900/20 border-1 border-yellow-400") : "bg-black/30"} rounded-lg p-4 relative`}>
                                    {match.isDelayed && (
                                      <div className="bg-gray-800/90 text-white px-2 py-1 rounded text-xs font-bold">
                                        {match.round === match.originalRound ? 'HALASZTVA' : 'HALASZTOTT MECCS LEJÁTSZÁSA'}
                                      </div>
                                    )}
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
                                        <span className="text-[#e0e6f7]">
                                          {match.isDelayed && match.delayedTime ? 
                                            new Date(match.delayedTime).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : 
                                            match.time
                                          }
                                        </span>
                                        <span className="text-[#e0e6f7]">
                                          Asztal: {match.isDelayed && match.delayedTable ? match.delayedTable : match.tableNumber}
                                        </span>
                                        {expandedMatches.includes(keyId) ? <FiChevronUp className="w-5 h-5 text-[#ff5c1a]" /> : <FiChevronDown className="w-5 h-5 text-[#ff5c1a]" />}
                                      </div>
                                    </button>

                                    {expandedMatches.includes(keyId) && (
                                      <div className="mt-4 flex flex-col gap-4">
                                        {/* Delayed Match Details */}
                                        {match.isDelayed && (match.delayedDate || match.delayedTime || match.delayedTable || match.delayedRound) && match.round === match.originalRound && (
                                          <div className="mb-4">
                                            <h4 className="text-white font-semibold mb-2">HALASZTVA ERRE:</h4>
                                            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
                                              <div className="grid grid-cols-2 gap-4 text-sm">
                                                {match.delayedDate && (
                                                  <div>
                                                    <span className="text-gray-400">Új dátum:</span>
                                                    <span className="text-white ml-2">{new Date(match.delayedDate).toLocaleDateString('hu-HU', { timeZone: 'UTC' })}</span>
                                                  </div>
                                                )}
                                                {match.delayedTime && (
                                                  <div>
                                                    <span className="text-gray-400">Új időpont:</span>
                                                    <span className="text-white ml-2">{new Date(match.delayedTime).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}</span>
                                                  </div>
                                                )}
                                                {match.delayedTable && (
                                                  <div>
                                                    <span className="text-gray-400">Új asztal:</span>
                                                    <span className="text-white ml-2">{match.delayedTable}</span>
                                                  </div>
                                                )}
                                                {match.delayedRound && (
                                                  <div>
                                                    <span className="text-gray-400">Új forduló:</span>
                                                    <span className="text-white ml-2">{match.delayedRound}.</span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



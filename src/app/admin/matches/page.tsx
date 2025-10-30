"use client";

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Bebas_Neue } from 'next/font/google';
import { motion } from 'framer-motion';
import { FiList, FiClock, FiCheckCircle, FiEdit2 } from 'react-icons/fi';
import Select from 'react-select';
import { useGetSeasonsQuery } from '@/lib/features/season/seasonSlice';
import { useGetChampionshipsQuery } from '@/lib/features/championship/championshipSlice';
import AdminEditMatchModal from './AdminEditMatchModal';
import { Switch } from '@/components/ui/switch';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });

export default function AdminMatchesPage() {
  const { data: seasons } = useGetSeasonsQuery();
  const { data: championships } = useGetChampionshipsQuery();

  // Load filters from localStorage on component mount
  const [seasonId, setSeasonId] = useState<string | ''>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-matches-seasonId') || '';
    }
    return '';
  });
  const [leagueId, setLeagueId] = useState<string | ''>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-matches-leagueId') || '';
    }
    return '';
  });
  const [round, setRound] = useState<number | ''>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin-matches-round');
      return stored ? Number(stored) : '';
    }
    return '';
  });
  const [showDelayedOnly, setShowDelayedOnly] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-matches-delayed') === 'true';
    }
    return false;
  });
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const [data, setData] = useState<{ items: any[]; total: number; page: number; pageSize: number; counts?: { total: number; pending: number; completed: number } } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Save filters to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-matches-seasonId', seasonId);
    }
  }, [seasonId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-matches-leagueId', leagueId);
    }
  }, [leagueId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (round !== '') {
        localStorage.setItem('admin-matches-round', String(round));
      } else {
        localStorage.removeItem('admin-matches-round');
      }
    }
  }, [round]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-matches-delayed', String(showDelayedOnly));
    }
  }, [showDelayedOnly]);

  // Clear all filters function
  const clearFilters = () => {
    setSeasonId('');
    setLeagueId('');
    setRound('');
    setShowDelayedOnly(false);
    setPage(1);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin-matches-seasonId');
      localStorage.removeItem('admin-matches-leagueId');
      localStorage.removeItem('admin-matches-round');
      localStorage.removeItem('admin-matches-delayed');
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (seasonId) params.set('seasonId', String(seasonId));
        if (leagueId) params.set('leagueId', String(leagueId));
        if (typeof round === 'number') params.set('round', String(round));
        if (showDelayedOnly) params.set('delayedOnly', 'true');
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/api/matches?${params.toString()}`;
        const resp = await fetch(url, { credentials: 'include' });
        if (resp.ok) {
          const d = await resp.json();
          if (mounted) setData(d);
        } else {
          if (mounted) setData({ items: [], total: 0, page, pageSize });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [seasonId, leagueId, round, page, pageSize, showDelayedOnly]);

  // fetch available rounds when league changes
  const [rounds, setRounds] = useState<number[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!leagueId) { setRounds([]); return; }
      try {
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/api/matches/league/${leagueId}/rounds`;
        const resp = await fetch(url, { credentials: 'include' });
        if (resp.ok) {
          const d = await resp.json();
          const list = Array.isArray(d?.rounds) ? d.rounds : [];
          if (mounted) setRounds(list);
        } else {
          if (mounted) setRounds([]);
        }
      } catch {
        if (mounted) setRounds([]);
      }
    })();
    return () => { mounted = false };
  }, [leagueId]);

  const leaguesForSeason = useMemo(() => {
    if (!seasons || !championships) return [] as any[];
    return (championships as any[]).filter((c) => String(c.seasonId) === String(seasonId));
  }, [seasons, championships, seasonId]);

  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / pageSize));
  const items = data?.items || [];
  const summary = useMemo(() => {
    const apiCounts = data?.counts;
    if (apiCounts) return apiCounts;
    const total = items.length;
    const completed = items.filter((r: any) => String(r.match?.matchStatus) === 'completed').length;
    const pending = items.filter((r: any) => {
      const s = String(r.match?.matchStatus);
      return s === 'scheduled' || s === 'in_progress';
    }).length;
    return { total, pending, completed };
  }, [items, data]);

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      borderColor: 'rgba(255, 92, 26, 0.5)',
      boxShadow: 'none',
      '&:hover': { borderColor: 'rgba(255, 92, 26, 0.8)' },
      minWidth: 220,
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: '#001a3a',
      border: '1px solid rgba(255, 92, 26, 0.5)',
      zIndex: 40,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? 'rgba(255, 92, 26, 0.2)' : 'transparent',
      color: 'white',
      '&:hover': { backgroundColor: 'rgba(255, 92, 26, 0.2)' },
    }),
    singleValue: (base: any) => ({ ...base, color: 'white' }),
    input: (base: any) => ({ ...base, color: 'white' }),
    placeholder: (base: any) => ({ ...base, color: 'rgba(255,255,255,0.7)' }),
  } as const;

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMeta, setModalMeta] = useState<any | null>(null);
  const openEdit = async (matchId: string, row: any) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/api/matches/${matchId}/meta`;
      const resp = await fetch(url, { credentials: 'include' });
      if (resp.ok) {
        const meta = await resp.json();
        setModalMeta({ meta, row });
        setModalOpen(true);
      }
    } catch {}
  };
  const handleSaveAdmin = async (payload: { matchAt?: string; matchRound?: number; gameDay?: number; matchTable?: number; matchStatus?: string; isDelayed?: boolean; delayedRound?: number; delayedGameDay?: number; delayedDate?: string; delayedTime?: string; delayedTable?: number; result?: { cupsA: number; cupsB: number; mvpAId?: string; mvpBId?: string; selectedAIds?: string[]; selectedBIds?: string[] } }) => {
    if (!modalMeta?.meta?.matchId) return;
    const id = modalMeta.meta.matchId;
    try {
      // First update admin fields
      const urlAdmin = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/api/matches/${id}/admin`;
      const respA = await fetch(urlAdmin, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchAt: payload.matchAt, matchRound: payload.matchRound, gameDay: payload.gameDay, matchTable: payload.matchTable, matchStatus: payload.matchStatus, isDelayed: payload.isDelayed, delayedRound: payload.delayedRound, delayedGameDay: payload.delayedGameDay, delayedDate: payload.delayedDate, delayedTime: payload.delayedTime, delayedTable: payload.delayedTable })});
      // Then, if result provided, update result
      if (payload.result) {
        const urlRes = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/api/matches/${id}/result`;
        await fetch(urlRes, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          homeTeamScore: payload.result.cupsA,
          awayTeamScore: payload.result.cupsB,
          homeTeamBestPlayerId: payload.result.mvpAId || undefined,
          awayTeamBestPlayerId: payload.result.mvpBId || undefined,
          homeFirstPlayerId: payload.result.selectedAIds?.[0],
          homeSecondPlayerId: payload.result.selectedAIds?.[1],
          awayFirstPlayerId: payload.result.selectedBIds?.[0],
          awaySecondPlayerId: payload.result.selectedBIds?.[1],
        })});
      }
      if (respA.ok) {
        setModalOpen(false);
        setModalMeta(null);
        // refresh list
        const params = new URLSearchParams();
        if (seasonId) params.set('seasonId', String(seasonId));
        if (leagueId) params.set('leagueId', String(leagueId));
        if (typeof round === 'number') params.set('round', String(round));
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        const url2 = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/api/matches?${params.toString()}`;
        const resp2 = await fetch(url2, { credentials: 'include' });
        if (resp2.ok) setData(await resp2.json());
      }
    } catch {}
  };

  return (
    <div className="min-h-screen p-8">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl p-6 border border-[#ff5c1a]/40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#ff5c1a]/20 flex items-center justify-center">
              <FiList className="w-6 h-6 text-[#ff5c1a]" />
            </div>
            <div>
              <p className="text-[#e0e6f7]">Összes Meccs</p>
              <p className={`${bebasNeue.className} text-3xl text-white`}>{summary.total}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl p-6 border border-[#ff5c1a]/40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#ff5c1a]/20 flex items-center justify-center">
              <FiClock className="w-6 h-6 text-[#ff5c1a]" />
            </div>
            <div>
              <p className="text-[#e0e6f7]">Függőben</p>
              <p className={`${bebasNeue.className} text-3xl text-white`}>{summary.pending}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl p-6 border border-[#ff5c1a]/40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#ff5c1a]/20 flex items-center justify-center">
              <FiCheckCircle className="w-6 h-6 text-[#ff5c1a]" />
            </div>
            <div>
              <p className="text-[#e0e6f7]">Lejátszott</p>
              <p className={`${bebasNeue.className} text-3xl text-white`}>{summary.completed}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Matches Table styled like Championships */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl overflow-hidden border border-[#ff5c1a]/40">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-6 border-b border-[#ff5c1a]/20">
          <h2 className={`${bebasNeue.className} text-2xl text-white`}>Összes Meccs</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[220px]">
              <Select
                options={[{ value: '', label: 'Összes Szezon' }, ...(seasons || []).map(s => ({ value: String(s.id), label: s.name }))]}
                value={(() => {
                  if (!seasonId) return { value: '', label: 'Összes Szezon' };
                  const s = (seasons || []).find(ss => String(ss.id) === String(seasonId));
                  return { value: String(seasonId), label: s?.name || String(seasonId) } as any;
                })()}
                onChange={(opt: any) => { setSeasonId(opt?.value || ''); setLeagueId(''); setRound(''); setPage(1); }}
                styles={selectStyles as any}
              />
            </div>
            <div className="min-w-[220px]">
              <Select
                isDisabled={!seasonId}
                options={[{ value: '', label: 'Összes Bajnokság' }, ...leaguesForSeason.map((l: any) => ({ value: String(l.id), label: l.name }))]}
                value={(() => {
                  if (!leagueId) return { value: '', label: 'Összes Bajnokság' };
                  const l = leaguesForSeason.find((ll: any) => String(ll.id) === String(leagueId));
                  return { value: String(leagueId), label: l?.name || String(leagueId) } as any;
                })()}
                onChange={(opt: any) => { setLeagueId(opt?.value || ''); setRound(''); setPage(1); }}
                styles={selectStyles as any}
              />
            </div>
            <div className="min-w-[160px]">
              <Select
                isDisabled={!leagueId}
                options={[{ value: '', label: 'Összes Forduló' }, ...rounds.map((r) => ({ value: String(r), label: `Forduló ${r}` }))]}
                value={(() => {
                  if (!round) return { value: '', label: 'Összes Forduló' } as any;
                  return { value: String(round), label: `Forduló ${round}` } as any;
                })()}
                onChange={(opt: any) => { const v = opt?.value; setRound(v ? Number(v) : ''); setPage(1); }}
                styles={selectStyles as any}
              />
            </div>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="px-3 py-2 bg-black/40 border border-[#ff5c1a]/30 rounded text-white">
              {[10, 20, 50].map(n => (<option key={n} value={n}>{n}/oldal</option>))}
            </select>
            <div className="flex items-center gap-2 px-3 py-2 bg-black/40 border border-[#ff5c1a]/30 rounded">
              <Switch 
                id="showDelayedOnly" 
                checked={showDelayedOnly} 
                onCheckedChange={setShowDelayedOnly}
              />
              <label htmlFor="showDelayedOnly" className="text-white text-sm whitespace-nowrap">Csak halasztott</label>
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Szűrők törlése
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
          <thead>
            <tr className="bg-black/30">
              <th className="px-6 py-4 text-left text-[#e0e6f7]">#</th>
              <th className="px-6 py-4 text-left text-[#e0e6f7]">Hazai</th>
              <th className="px-6 py-4 text-left text-[#e0e6f7]">Vendég</th>
              <th className="px-6 py-4 text-left text-[#e0e6f7]">Dátum</th>
              <th className="px-6 py-4 text-left text-[#e0e6f7]">Idő</th>
              <th className="px-6 py-4 text-left text-[#e0e6f7]">Forduló</th>
              <th className="px-6 py-4 text-left text-[#e0e6f7]">Játéknap</th>
              <th className="px-6 py-4 text-left text-[#e0e6f7]">Asztal</th>
              <th className="px-6 py-4 text-left text-[#e0e6f7]">Státusz</th>
              <th className="px-6 py-4 text-left text-[#e0e6f7]">Eredmény</th>
              <th className="px-6 py-4 text-left text-[#e0e6f7]">Trackelt?</th>
              <th className="px-6 py-4 text-left text-[#e0e6f7]">Hazai MVP</th>
              <th className="px-6 py-4 text-left text-[#e0e6f7]">Vendég MVP</th>
              <th className="px-6 py-4 text-left text-[#e0e6f7]">Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={13} className="px-6 py-6 text-white">Betöltés...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={13} className="px-6 py-6 text-white">Nincs találat</td></tr>
            ) : (
              items.map((row: any, idx: number) => {
                const match = row.match;
                const home = row.homeTeam;
                const away = row.awayTeam;
                const homeMvp = row.homeTeamBestPlayer;
                const awayMvp = row.awayTeamBestPlayer;
                const score = `${match.homeTeamScore ?? 0} - ${match.awayTeamScore ?? 0}`;
                const tracked = match.trackingActive > 0 || (row.trackingData && (row.trackingData?.gameHistory?.length || 0) > 0);
                const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555';
                const homeLogo = home?.logo ? (home.logo.startsWith('http') ? home.logo : `${backendBase}${home.logo}`) : '/elitelogo.png';
                const awayLogo = away?.logo ? (away.logo.startsWith('http') ? away.logo : `${backendBase}${away.logo}`) : '/elitelogo.png';
                const rowIndex = (page - 1) * pageSize + idx + 1;
                const completed = String(match.matchStatus) === 'completed';
                return (
                  <tr 
                    key={match.id} 
                    className={`border-t border-[#ff5c1a]/20 hover:bg-black/20 cursor-pointer ${completed ? 'bg-green-900/20' : ''}`}
                    onClick={() => openEdit(match.id, row)}
                  >
                    <td className="px-6 py-4 text-white">{rowIndex}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Image src={homeLogo} alt={home?.name || 'Hazai'} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                        <span className="text-white">{home?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Image src={awayLogo} alt={away?.name || 'Vendég'} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                        <span className="text-white">{away?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">
                      {match.matchAt ? new Date(match.matchAt).toLocaleDateString('hu-HU', { timeZone: 'UTC' }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {match.matchAt ? new Date(match.matchAt).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-white">{match.matchRound ?? '-'}</td>
                    <td className="px-6 py-4 text-white">
                      {match.delayedGameDay ? (
                        <span className="text-orange-400" title={`Halasztott eredeti játéknap: ${match.delayedGameDay}`}>
                          <span style={{ textDecoration: 'line-through' }}>{match.gameDay}</span> → {match.delayedGameDay}
                        </span>
                      ) : (
                        match.gameDay ?? '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-white">{match.matchTable ?? '-'}</td>
                    <td className="px-6 py-4 text-white">{(() => {
                      const statusMap: Record<string, string> = {
                        'scheduled': 'Ütemezett',
                        'in_progress': 'Folyamatban',
                        'completed': 'Befejezett',
                        'cancelled': 'Lemondott'
                      };
                      return statusMap[match.matchStatus] || match.matchStatus;
                    })()}</td>
                    <td className="px-6 py-4 text-white">{score}</td>
                    <td className="px-6 py-4 text-white">{tracked ? 'Igen' : 'Nem'}</td>
                    <td className="px-6 py-4 text-white">{homeMvp?.nickname || homeMvp?.firstName || '-'}</td>
                    <td className="px-6 py-4 text-white">{awayMvp?.nickname || awayMvp?.firstName || '-'}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => openEdit(match.id, row)} className="p-2 text-[#ff5c1a] hover:text-[#ff7c3a] transition-colors">
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-[#ff5c1a]/20">
          <div className="text-white">Összesen: {data?.total || 0}</div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-2 bg-black/40 text-white rounded disabled:opacity-50">Előző</button>
            <span className="text-white">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-2 bg-black/40 text-white rounded disabled:opacity-50">Következő</button>
          </div>
        </div>
      </motion.div>

      {/* Edit Result Modal */}
      {modalOpen && modalMeta?.meta && (
        <AdminEditMatchModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setModalMeta(null); }}
          meta={modalMeta.meta}
          onSave={handleSaveAdmin}
        />
      )}
    </div>
  );
}



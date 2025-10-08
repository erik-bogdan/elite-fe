"use client";

import { useMemo, useState, useEffect } from 'react';
import { Bebas_Neue } from 'next/font/google';
import { FiX } from 'react-icons/fi';
import { Switch } from '@/components/ui/switch';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });

interface PlayerOpt { id: string; label: string }

export default function AdminEditMatchModal({
  open,
  onClose,
  meta,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  meta: any;
  onSave: (payload: { matchAt?: string; matchRound?: number; matchTable?: number; matchStatus?: string; isDelayed?: boolean; delayedRound?: number; delayedDate?: string; delayedTime?: string; delayedTable?: number; result?: { cupsA: number; cupsB: number; mvpAId?: string; mvpBId?: string; selectedAIds?: string[]; selectedBIds?: string[] } }) => void;
}) {
  const [matchAt, setMatchAt] = useState<string>(meta?.schedule?.matchAt ? new Date(meta.schedule.matchAt).toISOString().slice(0,16) : '');
  const [matchRound, setMatchRound] = useState<number | ''>(meta?.schedule?.matchRound ?? '');
  const [matchTable, setMatchTable] = useState<number | ''>(meta?.schedule?.matchTable ?? '');
  const [matchStatus, setMatchStatus] = useState<string>(meta?.schedule?.matchStatus || 'scheduled');
  
  // Delay fields
  const [isDelayed, setIsDelayed] = useState<boolean>(meta?.schedule?.isDelayed || false);
  const [delayedRound, setDelayedRound] = useState<number | ''>(meta?.schedule?.delayedRound ?? '');
  const [delayedDate, setDelayedDate] = useState<string>(() => {
    if (meta?.schedule?.delayedDate) {
      const date = new Date(meta.schedule.delayedDate);
      return date.toISOString().slice(0, 10); // YYYY-MM-DD format for date input
    }
    return '';
  });
  const [delayedTime, setDelayedTime] = useState<string>(() => {
    if (meta?.schedule?.delayedTime) {
      const time = new Date(meta.schedule.delayedTime);
      return time.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).slice(0, 5); // HH:MM format for time input in UTC
    }
    return '';
  });
  const [delayedTable, setDelayedTable] = useState<number | ''>(meta?.schedule?.delayedTable ?? '');

  const [cupsA, setCupsA] = useState<number>(meta?.score?.home ?? 0);
  const [cupsB, setCupsB] = useState<number>(meta?.score?.away ?? 0);
  const [selectedA1, setSelectedA1] = useState<string>(meta?.selected?.homeFirstPlayerId || '');
  const [selectedA2, setSelectedA2] = useState<string>(meta?.selected?.homeSecondPlayerId || '');
  const [selectedB1, setSelectedB1] = useState<string>(meta?.selected?.awayFirstPlayerId || '');
  const [selectedB2, setSelectedB2] = useState<string>(meta?.selected?.awaySecondPlayerId || '');
  const [mvpA, setMvpA] = useState<string>(meta?.mvp?.home || '');
  const [mvpB, setMvpB] = useState<string>(meta?.mvp?.away || '');
  const [isVisible, setIsVisible] = useState(false);

  const playersA: PlayerOpt[] = (meta?.homeTeam?.players || []) as PlayerOpt[];
  const playersB: PlayerOpt[] = (meta?.awayTeam?.players || []) as PlayerOpt[];

  useEffect(() => {
    if (open) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [open]);

  // Validations & helpers
  const selectedA = useMemo(() => [selectedA1, selectedA2].filter(Boolean), [selectedA1, selectedA2]);
  const selectedB = useMemo(() => [selectedB1, selectedB2].filter(Boolean), [selectedB1, selectedB2]);

  const isValidScore = (a: number, b: number) => {
    if (a === 10 && b === 10) return false;
    if (a > 10 && b < 10) return false;
    if (b > 10 && a < 10) return false;
    if (a > 10 && (a - 10) % 3 !== 0) return false;
    if (b > 10 && (b - 10) % 3 !== 0) return false;
    if (a > 10 && b > 10 && Math.abs(a - b) > 3) return false;
    return true;
  };
  const winner = useMemo(() => {
    if (!isValidScore(cupsA, cupsB)) return '';
    if (cupsA >= 10 && cupsA > cupsB) return meta?.homeTeam?.name || 'Hazai';
    if (cupsB >= 10 && cupsB > cupsA) return meta?.awayTeam?.name || 'Vendég';
    return '';
  }, [cupsA, cupsB, meta]);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div 
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div 
        className={`relative z-10 w-full max-w-5xl mx-auto rounded-2xl bg-black/80 border-2 border-[#ff5c1a] shadow-2xl shadow-[#ff5c1a44] p-4 md:p-8 flex flex-col gap-6 max-h-[95vh] overflow-y-auto transition-all duration-300 transform ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
      >
        <button className="absolute top-2 right-2 md:top-4 md:right-4 text-white hover:text-[#ff5c1a] text-2xl" onClick={onClose}><FiX /></button>

        <h2 className={`${bebasNeue.className} text-2xl text-white`}>Meccs szerkesztése (Admin)</h2>

        {/* Scheduling */}
        <div className="bg-black/30 border border-[#ff5c1a]/30 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-[#e0e6f7] mb-1">Dátum és idő</label>
            <input type="datetime-local" value={matchAt} onChange={(e) => setMatchAt(e.target.value)} className="w-full bg-black/40 border border-[#ff5c1a]/40 rounded text-white px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-[#e0e6f7] mb-1">Forduló</label>
            <input type="number" min={1} value={matchRound as any} onChange={(e) => setMatchRound(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-black/40 border border-[#ff5c1a]/40 rounded text-white px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-[#e0e6f7] mb-1">Asztal</label>
            <input type="number" min={1} value={matchTable as any} onChange={(e) => setMatchTable(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-black/40 border border-[#ff5c1a]/40 rounded text-white px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-[#e0e6f7] mb-1">Státusz</label>
            <select value={matchStatus} onChange={(e) => setMatchStatus(e.target.value)} className="w-full bg-black/40 border border-[#ff5c1a]/40 rounded text-white px-3 py-2">
              <option value="scheduled">Ütemezett</option>
              <option value="in_progress">Folyamatban</option>
              <option value="completed">Befejezett</option>
              <option value="cancelled">Lemondott</option>
            </select>
          </div>
        </div>

        {/* Delay toggle and fields */}
        <div className="bg-black/30 border border-[#ff5c1a]/30 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <Switch 
              id="isDelayed" 
              checked={isDelayed} 
              onCheckedChange={setIsDelayed}
            />
            <label htmlFor="isDelayed" className="text-white font-medium">Meccs halasztva</label>
          </div>
          
          {isDelayed && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-[#e0e6f7] mb-1">Halasztott új forduló</label>
                <input type="number" min={1} value={delayedRound as any} onChange={(e) => setDelayedRound(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-black/40 border border-[#ff5c1a]/40 rounded text-white px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-[#e0e6f7] mb-1">Halasztott új dátum</label>
                <input type="date" value={delayedDate} onChange={(e) => setDelayedDate(e.target.value)} className="w-full bg-black/40 border border-[#ff5c1a]/40 rounded text-white px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-[#e0e6f7] mb-1">Halasztott új idő</label>
                <input type="time" value={delayedTime} onChange={(e) => setDelayedTime(e.target.value)} className="w-full bg-black/40 border border-[#ff5c1a]/40 rounded text-white px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-[#e0e6f7] mb-1">Halasztott új asztal</label>
                <input type="number" min={1} value={delayedTable as any} onChange={(e) => setDelayedTable(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-black/40 border border-[#ff5c1a]/40 rounded text-white px-3 py-2" />
              </div>
            </div>
          )}
        </div>

        {/* Players & result */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-start">
          {/* Home team card */}
          <div className="bg-black/30 border border-[#ff5c1a]/30 rounded-xl p-4">
            <div className={`${bebasNeue.className} text-xl text-white mb-3`}>{meta?.homeTeam?.name || 'Hazai'}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#e0e6f7] mb-1">Játékos 1</label>
                <select value={selectedA1} onChange={(e) => { const v = e.target.value; setSelectedA1(v); if (v === selectedA2) setSelectedA2(''); if (!mvpA || (mvpA !== v && mvpA !== selectedA2)) setMvpA(v); }} className="w-full bg-black/40 border border-[#ff5c1a]/40 rounded text-white px-3 py-2">
                  <option value="">Válassz...</option>
                  {playersA.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#e0e6f7] mb-1">Játékos 2</label>
                <select value={selectedA2} onChange={(e) => { const v = e.target.value; setSelectedA2(v); if (v === selectedA1) setSelectedA1(''); if (!mvpA || (mvpA !== v && mvpA !== selectedA1)) setMvpA(v || selectedA1); }} className="w-full bg-black/40 border border-[#ff5c1a]/40 rounded text-white px-3 py-2">
                  <option value="">Válassz...</option>
                  {playersA.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs text-[#e0e6f7] mb-1">MVP</label>
                <select value={mvpA} onChange={(e) => setMvpA(e.target.value)} className="w-full bg-black/40 border border-[#ff5c1a]/40 rounded text-white px-3 py-2">
                  {[selectedA1, selectedA2].filter(Boolean).map(id => {
                    const pl = playersA.find(pp => pp.id === id);
                    return <option key={id} value={id as string}>{pl?.label || id}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#e0e6f7] mb-1">Pohár</label>
                <input type="number" min={0} max={25} value={cupsA} onChange={(e) => setCupsA(Number(e.target.value))} className="w-full bg-black/40 border border-[#ff5c1a]/40 rounded text-white px-3 py-2" />
              </div>
            </div>
          </div>

          {/* Middle result badge */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className={`${bebasNeue.className} text-3xl text-[#ff5c1a]`}>VS</div>
            {winner ? <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-sm">Győztes: {winner}</div> : <div className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-sm">Eredmény szerkesztése</div>}
            {!isValidScore(cupsA, cupsB) && <div className="text-red-400 text-xs">Ellenőrizd a szabályos eredményt</div>}
          </div>

          {/* Away team card */}
          <div className="bg-black/30 border border-[#ff5c1a]/30 rounded-xl p-4">
            <div className={`${bebasNeue.className} text-xl text-white mb-3`}>{meta?.awayTeam?.name || 'Vendég'}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#e0e6f7] mb-1">Játékos 1</label>
                <select value={selectedB1} onChange={(e) => { const v = e.target.value; setSelectedB1(v); if (v === selectedB2) setSelectedB2(''); if (!mvpB || (mvpB !== v && mvpB !== selectedB2)) setMvpB(v); }} className="w-full bg-black/40 border border-[#ff5c1a]/40 rounded text-white px-3 py-2">
                  <option value="">Válassz...</option>
                  {playersB.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#e0e6f7] mb-1">Játékos 2</label>
                <select value={selectedB2} onChange={(e) => { const v = e.target.value; setSelectedB2(v); if (v === selectedB1) setSelectedB1(''); if (!mvpB || (mvpB !== v && mvpB !== selectedB1)) setMvpB(v || selectedB1); }} className="w-full bg-black/40 border border-[#ff5c1a]/40 rounded text-white px-3 py-2">
                  <option value="">Válassz...</option>
                  {playersB.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs text-[#e0e6f7] mb-1">MVP</label>
                <select value={mvpB} onChange={(e) => setMvpB(e.target.value)} className="w-full bg-black/40 border border-[#ff5c1a]/40 rounded text-white px-3 py-2">
                  {[selectedB1, selectedB2].filter(Boolean).map(id => {
                    const pl = playersB.find(pp => pp.id === id);
                    return <option key={id} value={id as string}>{pl?.label || id}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#e0e6f7] mb-1">Pohár</label>
                <input type="number" min={0} max={25} value={cupsB} onChange={(e) => setCupsB(Number(e.target.value))} className="w-full bg-black/40 border border-[#ff5c1a]/40 rounded text-white px-3 py-2" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-3">
          <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded" onClick={onClose}>Mégse</button>
          <div className="flex gap-3">
            <button 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded" 
              onClick={() => {
                // Convert datetime-local to ISO string for backend
                // datetime-local gives us local time, so we need to preserve it
                const matchAtISO = matchAt ? (() => {
                  const localDate = new Date(matchAt);
                  // Create a new date with the same local time but in UTC
                  const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
                  return utcDate.toISOString();
                })() : undefined;
                const delayedDateISO = delayedDate ? (() => {
                  const localDate = new Date(delayedDate + 'T00:00:00');
                  // Create a new date with the same local time but in UTC
                  const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
                  return utcDate.toISOString();
                })() : undefined;
                // For delayedTime, combine with delayedDate to create full datetime
                const delayedTimeISO = delayedTime ? (() => {
                  if (delayedDate) {
                    // Combine delayedDate with delayedTime to create full datetime
                    const localDateTime = new Date(delayedDate + 'T' + delayedTime + ':00');
                    const utcDateTime = new Date(localDateTime.getTime() - localDateTime.getTimezoneOffset() * 60000);
                    return utcDateTime.toISOString();
                  } else {
                    // If no delayedDate, use current date
                    const today = new Date().toISOString().split('T')[0];
                    const localDateTime = new Date(today + 'T' + delayedTime + ':00');
                    const utcDateTime = new Date(localDateTime.getTime() - localDateTime.getTimezoneOffset() * 60000);
                    return utcDateTime.toISOString();
                  }
                })() : undefined;
                
                onSave({
                  matchAt: matchAtISO,
                  matchRound: matchRound === '' ? undefined : Number(matchRound),
                  matchTable: matchTable === '' ? undefined : Number(matchTable),
                  matchStatus: matchStatus || undefined,
                  isDelayed: isDelayed,
                  delayedRound: delayedRound === '' ? undefined : Number(delayedRound),
                  delayedDate: delayedDateISO,
                  delayedTime: delayedTimeISO,
                  delayedTable: delayedTable === '' ? undefined : Number(delayedTable),
                });
              }}
            >
              Csak ütemezés mentése
            </button>
            <button 
              className="px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded" 
              onClick={() => {
                // Convert datetime-local to ISO string for backend
                // datetime-local gives us local time, so we need to preserve it
                const matchAtISO = matchAt ? (() => {
                  const localDate = new Date(matchAt);
                  // Create a new date with the same local time but in UTC
                  const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
                  return utcDate.toISOString();
                })() : undefined;
                const delayedDateISO = delayedDate ? (() => {
                  const localDate = new Date(delayedDate + 'T00:00:00');
                  // Create a new date with the same local time but in UTC
                  const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
                  return utcDate.toISOString();
                })() : undefined;
                // For delayedTime, combine with delayedDate to create full datetime
                const delayedTimeISO = delayedTime ? (() => {
                  if (delayedDate) {
                    // Combine delayedDate with delayedTime to create full datetime
                    const localDateTime = new Date(delayedDate + 'T' + delayedTime + ':00');
                    const utcDateTime = new Date(localDateTime.getTime() - localDateTime.getTimezoneOffset() * 60000);
                    return utcDateTime.toISOString();
                  } else {
                    // If no delayedDate, use current date
                    const today = new Date().toISOString().split('T')[0];
                    const localDateTime = new Date(today + 'T' + delayedTime + ':00');
                    const utcDateTime = new Date(localDateTime.getTime() - localDateTime.getTimezoneOffset() * 60000);
                    return utcDateTime.toISOString();
                  }
                })() : undefined;
                
                onSave({
                  matchAt: matchAtISO,
                  matchRound: matchRound === '' ? undefined : Number(matchRound),
                  matchTable: matchTable === '' ? undefined : Number(matchTable),
                  matchStatus: matchStatus || undefined,
                  isDelayed: isDelayed,
                  delayedRound: delayedRound === '' ? undefined : Number(delayedRound),
                  delayedDate: delayedDateISO,
                  delayedTime: delayedTimeISO,
                  delayedTable: delayedTable === '' ? undefined : Number(delayedTable),
                  result: {
                    cupsA,
                    cupsB,
                    mvpAId: mvpA || undefined,
                    mvpBId: mvpB || undefined,
                    selectedAIds: [selectedA1, selectedA2].filter(Boolean),
                    selectedBIds: [selectedB1, selectedB2].filter(Boolean),
                  }
                });
              }}
            >
              Minden mentése
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



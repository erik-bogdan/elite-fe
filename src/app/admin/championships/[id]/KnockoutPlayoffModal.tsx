"use client";

import { useMemo, useState } from "react";
import { Bebas_Neue } from "next/font/google";
import { FiX } from "react-icons/fi";
import { toast } from "sonner";
import {
  useGenerateKnockoutPlayoffMatchesMutation,
  useSaveKnockoutPlayoffMatchesMutation,
} from "@/lib/features/championship/championshipSlice";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

interface KnockoutPlayoffModalProps {
  leagueId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function KnockoutPlayoffModal({
  leagueId,
  isOpen,
  onClose,
  onSuccess,
}: KnockoutPlayoffModalProps) {
  const [bestOf, setBestOf] = useState(7);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('20:00');
  const [totalTables, setTotalTables] = useState(4);
  const [matchups, setMatchups] = useState<Array<{
    homeTeamId: string;
    homeTeamName: string;
    awayTeamId: string;
    awayTeamName: string;
  }>>([]);
  const [matchDates, setMatchDates] = useState<Record<string, { date: string; time: string; table: number }>>({});

  const [generateMatches, { data: generateData, isLoading: isGenerating }] =
    useGenerateKnockoutPlayoffMatchesMutation();
  const [saveMatches, { isLoading: isSaving }] =
    useSaveKnockoutPlayoffMatchesMutation();

  const winsNeeded = useMemo(() => Math.ceil(bestOf / 2), [bestOf]);

  const roundName = useMemo(() => {
    const round = generateData?.knockoutRound || 0;
    if (round === 1) return 'Negyeddöntő';
    if (round === 2) return 'Elődöntő';
    if (round === 3) return 'Döntő';
    return 'Ismeretlen';
  }, [generateData]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    try {
      if (!startDate || !startTime) {
        toast.error('Kezdő dátum és idő megadása kötelező');
        return;
      }
      
      const result = await generateMatches({ id: leagueId }).unwrap();
      setMatchups(result.matchups);
      
      // Auto-generate dates/times based on round
      const knockoutRound = result.knockoutRound;
      const initialDates: Record<string, { date: string; time: string; table: number }> = {};
      
      if (knockoutRound === 1) {
        // Quarterfinals: parallel matches, 30 min intervals, multiple tables
        const matchInterval = 30; // minutes
        const startDateTime = new Date(`${startDate}T${startTime}:00`);
        
        result.matchups.forEach((matchup, matchupIdx) => {
          for (let matchNum = 1; matchNum <= bestOf; matchNum++) {
            const key = `${matchupIdx}-${matchNum}`;
            // Calculate time: matches run in parallel, so same time for all matchups
            // But different matches in a series are spaced by 30 minutes
            const matchDateTime = new Date(startDateTime);
            matchDateTime.setMinutes(matchDateTime.getMinutes() + (matchNum - 1) * matchInterval);
            
            // Assign table: distribute matchups across tables
            const table = (matchupIdx % totalTables) + 1;
            
            initialDates[key] = {
              date: matchDateTime.toISOString().split('T')[0],
              time: matchDateTime.toTimeString().slice(0, 5),
              table,
            };
          }
        });
      } else if (knockoutRound === 2) {
        // Semifinals: sequential matches, 20 min intervals, 1 table
        const matchInterval = 20; // minutes
        const startDateTime = new Date(`${startDate}T${startTime}:00`);
        
        result.matchups.forEach((matchup, matchupIdx) => {
          for (let matchNum = 1; matchNum <= bestOf; matchNum++) {
            const key = `${matchupIdx}-${matchNum}`;
            // Sequential: each matchup's matches come after the previous matchup's matches
            const matchDateTime = new Date(startDateTime);
            const totalPreviousMatches = matchupIdx * bestOf;
            matchDateTime.setMinutes(matchDateTime.getMinutes() + totalPreviousMatches * matchInterval + (matchNum - 1) * matchInterval);
            
            initialDates[key] = {
              date: matchDateTime.toISOString().split('T')[0],
              time: matchDateTime.toTimeString().slice(0, 5),
              table: 1,
            };
          }
        });
      } else {
        // Finals: same as semifinals
        const matchInterval = 20;
        const startDateTime = new Date(`${startDate}T${startTime}:00`);
        
        result.matchups.forEach((matchup, matchupIdx) => {
          for (let matchNum = 1; matchNum <= bestOf; matchNum++) {
            const key = `${matchupIdx}-${matchNum}`;
            const matchDateTime = new Date(startDateTime);
            matchDateTime.setMinutes(matchDateTime.getMinutes() + (matchNum - 1) * matchInterval);
            
            initialDates[key] = {
              date: matchDateTime.toISOString().split('T')[0],
              time: matchDateTime.toTimeString().slice(0, 5),
              table: 1,
            };
          }
        });
      }
      
      setMatchDates(initialDates);
    } catch (error: any) {
      const msg = error?.data?.message || error?.message || "Generálási hiba";
      toast.error(msg);
    }
  };

  const handleDateChange = (matchupIdx: number, matchNum: number, field: 'date' | 'time' | 'table', value: string | number) => {
    const key = `${matchupIdx}-${matchNum}`;
    setMatchDates(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const handleSave = async () => {
    try {
      // Validate all dates and times are set
      const matches: Array<{
        homeTeamId: string;
        awayTeamId: string;
        matchNumber: number;
        knockoutRound: number;
        date: string;
        time: string;
        table: number;
      }> = [];

      const knockoutRound = generateData?.knockoutRound || 1;

      matchups.forEach((matchup, matchupIdx) => {
        for (let matchNum = 1; matchNum <= bestOf; matchNum++) {
          const key = `${matchupIdx}-${matchNum}`;
          const dateTime = matchDates[key];
          if (!dateTime?.date || !dateTime?.time || !dateTime?.table) {
            toast.error(`Meccs ${matchNum} (${matchup.homeTeamName} vs ${matchup.awayTeamName}): dátum, idő és asztal megadása kötelező`);
            return;
          }
          // Alternáló home/away: páratlan meccseknél eredeti sorrend, páros meccseknél fordított
          const isOddMatch = matchNum % 2 === 1;
          const homeTeamId = isOddMatch ? matchup.homeTeamId : matchup.awayTeamId;
          const awayTeamId = isOddMatch ? matchup.awayTeamId : matchup.homeTeamId;
          matches.push({
            homeTeamId,
            awayTeamId,
            matchNumber: matchNum,
            knockoutRound,
            date: dateTime.date,
            time: dateTime.time,
            table: dateTime.table,
          });
        }
      });

      if (matches.length === 0) {
        toast.error('Nincs meccs a mentéshez');
        return;
      }

      await saveMatches({
        id: leagueId,
        bestOf,
        matches,
      }).unwrap();
      toast.success("Knockout playoff meccsek elmentve");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      const msg = error?.data?.message || error?.message || "Mentési hiba";
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#001a3a] rounded-2xl border-2 border-[#ff5c1a] w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className={`${bebasNeue.className} text-2xl text-white`}>
            Knockout Playoff Meccs Generálás
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
            aria-label="Bezárás"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-white/80 text-sm mb-1">
                Best of (BO)
              </label>
              <select
                value={bestOf}
                onChange={(e) => setBestOf(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
                disabled={matchups.length > 0}
              >
                <option value={3}>BO 3 (2 győzelem)</option>
                <option value={5}>BO 5 (3 győzelem)</option>
                <option value={7}>BO 7 (4 győzelem)</option>
                <option value={9}>BO 9 (5 győzelem)</option>
              </select>
              <div className="text-white/60 text-xs mt-1">
                {winsNeeded} győzelem szükséges
              </div>
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-1">
                Kezdő dátum
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
                disabled={matchups.length > 0}
                required
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-1">
                Kezdő idő (HH:MM)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
                disabled={matchups.length > 0}
                required
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-1">
                Asztalok száma
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={totalTables}
                onChange={(e) => setTotalTables(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
                disabled={matchups.length > 0 || (generateData?.knockoutRound === 2 || generateData?.knockoutRound === 3)}
                required
              />
              <div className="text-white/60 text-xs mt-1">
                {(generateData?.knockoutRound === 2 || generateData?.knockoutRound === 3) ? 'Elődöntő/Döntő: 1 asztal' : 'Negyeddöntő: párhuzamos'}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || matchups.length > 0 || !startDate || !startTime}
              className="px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? "Generálás..." : "Párharcok generálása"}
            </button>
          </div>

          {/* Matchups and Matches */}
          {matchups.length > 0 && (
            <div className="space-y-6">
              <div className="text-white font-semibold">
                {roundName} - {matchups.length} párharc
              </div>
              {matchups.map((matchup, matchupIdx) => (
                <div key={`${matchup.homeTeamId}-${matchup.awayTeamId}`} className="border border-white/10 rounded-xl p-4 bg-black/20">
                  <div className="mb-4">
                    <h3 className={`${bebasNeue.className} text-xl text-white mb-2`}>
                      Párharc {matchupIdx + 1}: {matchup.homeTeamName} vs {matchup.awayTeamName}
                    </h3>
                    <div className="text-white/60 text-sm">
                      BO {bestOf} - {winsNeeded} győzelem szükséges
                    </div>
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: bestOf }, (_, i) => i + 1).map((matchNum) => {
                      const key = `${matchupIdx}-${matchNum}`;
                      const dateTime = matchDates[key] || { date: '', time: '', table: 1 };
                      const isOptional = matchNum >= winsNeeded + 1; // 4. meccs és utána opcionálisak (ha BO 7, akkor 4+1=5. meccstől)
                      // Alternáló home/away: páratlan meccseknél eredeti sorrend, páros meccseknél fordított
                      const isOddMatch = matchNum % 2 === 1;
                      const homeTeamName = isOddMatch ? matchup.homeTeamName : matchup.awayTeamName;
                      const awayTeamName = isOddMatch ? matchup.awayTeamName : matchup.homeTeamName;
                      return (
                        <div key={matchNum} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center bg-black/30 p-3 rounded">
                          <div className="text-white/80 font-semibold flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              Meccs {matchNum}
                              {isOptional && (
                                <span className="text-[#ff5c1a] text-sm" title="Csak akkor szükséges, ha nem 4-0 az eredmény">
                                  *
                                </span>
                              )}
                            </div>
                            <div className="text-white/60 text-xs">
                              {homeTeamName} (H) vs {awayTeamName} (A)
                            </div>
                          </div>
                          <div>
                            <label className="block text-white/70 text-xs mb-1">Dátum</label>
                            <input
                              type="date"
                              value={dateTime.date}
                              onChange={(e) => handleDateChange(matchupIdx, matchNum, 'date', e.target.value)}
                              className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-white text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-white/70 text-xs mb-1">Kezdés (HH:MM)</label>
                            <input
                              type="time"
                              value={dateTime.time}
                              onChange={(e) => handleDateChange(matchupIdx, matchNum, 'time', e.target.value)}
                              className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-white text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-white/70 text-xs mb-1">Asztal</label>
                            <input
                              type="number"
                              min={1}
                              max={totalTables}
                              value={dateTime.table || 1}
                              onChange={(e) => handleDateChange(matchupIdx, matchNum, 'table', Number(e.target.value))}
                              className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-white text-sm"
                              required
                              disabled={generateData?.knockoutRound === 2 || generateData?.knockoutRound === 3}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 flex items-center justify-between">
          <span className="text-white/60 text-sm">
            {matchups.length > 0
              ? `${matchups.length} párharc × ${bestOf} meccs = ${matchups.length * bestOf} meccs kerül legenerálásra`
              : "Válassz BO értéket és generáld a párharcokat"}
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded"
            >
              Mégse
            </button>
            <button
              onClick={handleSave}
              disabled={!matchups.length || isSaving}
              className="px-5 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Mentés..." : "Meccsek mentése"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


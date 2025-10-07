"use client";

import React, { useState, useMemo } from 'react';
import { Bebas_Neue } from "next/font/google";
import { FiX, FiDownload, FiCopy } from 'react-icons/fi';
import { toast } from 'sonner';

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

interface ScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  leagueMatches: any[];
  championship: any;
}

export default function ScriptModal({ isOpen, onClose, leagueMatches, championship }: ScriptModalProps) {
  const [selectedGameDays, setSelectedGameDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState('20:00');
  const [matchDuration, setMatchDuration] = useState(20); // minutes
  const [tables, setTables] = useState(4);

  // Get available game days from matches
  const availableGameDays = useMemo(() => {
    const gameDays = new Set<number>();
    (leagueMatches || []).forEach((row: any) => {
      if (row.match?.gameDay) {
        gameDays.add(row.match.gameDay);
      }
    });
    return Array.from(gameDays).sort((a, b) => a - b);
  }, [leagueMatches]);

  // Generate script text
  const scriptText = useMemo(() => {
    if (selectedGameDays.length === 0) return '';

    const matches = (leagueMatches || []).filter((row: any) => 
      selectedGameDays.includes(row.match?.gameDay) && 
      row.match?.matchStatus !== 'completed'
    );

    if (matches.length === 0) return 'Nincs meccs a kiválasztott játéknapokon.';

    // Group matches by round
    const matchesByRound = matches.reduce((acc: Record<number, any[]>, row: any) => {
      const round = row.match?.matchRound || 0;
      if (!acc[round]) acc[round] = [];
      acc[round].push(row);
      return acc;
    }, {});

    let script = `${championship?.name || 'ELITE'} ${selectedGameDays[0]}-${selectedGameDays[selectedGameDays.length - 1]}. forduló\n\n`;

    // Sort rounds and generate script for each
    Object.keys(matchesByRound)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach(round => {
        const roundMatches = matchesByRound[round];
        script += `${round}. forduló\n`;

        // Group matches by time slots
        const timeSlots = new Map<string, any[]>();
        
        roundMatches.forEach((row: any) => {
          const matchTime = row.match?.matchTime || row.match?.matchAt;
          const timeKey = matchTime ? new Date(matchTime).toLocaleTimeString('hu-HU', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'UTC'
          }) : startTime;
          
          if (!timeSlots.has(timeKey)) {
            timeSlots.set(timeKey, []);
          }
          timeSlots.get(timeKey)!.push(row);
        });

        // Sort time slots and generate script
        Array.from(timeSlots.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .forEach(([time, matches]) => {
            matches
              .sort((a, b) => (a.match?.matchTable || 0) - (b.match?.matchTable || 0))
              .forEach((row: any, index: number) => {
                const table = row.match?.matchTable || (index + 1);
                const homeTeam = row.homeTeam?.name || row.match?.homeTeamId || 'Home';
                const awayTeam = row.awayTeam?.name || row.match?.awayTeamId || 'Away';
                script += `${table} ${time} ${homeTeam} - ${awayTeam}\n`;
              });
          });

        script += '\n';
      });

    return script.trim();
  }, [selectedGameDays, leagueMatches, championship, startTime]);

  const handleGameDayToggle = (gameDay: number) => {
    setSelectedGameDays(prev => 
      prev.includes(gameDay) 
        ? prev.filter(day => day !== gameDay)
        : [...prev, gameDay].sort((a, b) => a - b)
    );
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(scriptText);
      toast.success('Script másolva a vágólapra!');
    } catch (error) {
      toast.error('Nem sikerült a másolás');
    }
  };

  const handleDownloadScript = () => {
    const blob = new Blob([scriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${championship?.name || 'ELITE'}_script_${selectedGameDays.join('-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Script letöltve!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#001a3a] rounded-2xl border-2 border-[#ff5c1a] shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#ff5c1a]/30">
          <h2 className={`${bebasNeue.className} text-2xl text-white`}>Meccspárosító Script Generálás</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiX className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Game Day Selection */}
          <div>
            <h3 className="text-white text-lg mb-3">Játéknapok kiválasztása</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {availableGameDays.map(gameDay => (
                <button
                  key={gameDay}
                  onClick={() => handleGameDayToggle(gameDay)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    selectedGameDays.includes(gameDay)
                      ? 'bg-[#ff5c1a] border-[#ff5c1a] text-white'
                      : 'bg-black/40 border-white/20 text-white hover:border-[#ff5c1a]/50'
                  }`}
                >
                  Játéknap {gameDay}
                </button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-white/80 text-sm mb-2">Kezdés (HH:MM)</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-2">Meccs hossza (perc)</label>
              <input
                type="number"
                min={10}
                value={matchDuration}
                onChange={(e) => setMatchDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-2">Asztalok száma</label>
              <input
                type="number"
                min={1}
                value={tables}
                onChange={(e) => setTables(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
              />
            </div>
          </div>

          {/* Generated Script */}
          <div>
            <h3 className="text-white text-lg mb-3">Generált Script</h3>
            <div className="bg-black/40 rounded-lg p-4 border border-white/10">
              <pre className="text-white text-sm whitespace-pre-wrap font-mono">
                {scriptText || 'Válassz játéknapokat a script generálásához...'}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[#ff5c1a]/30">
          <div className="text-white/70 text-sm">
            {selectedGameDays.length > 0 && `${selectedGameDays.length} játéknap kiválasztva`}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCopyScript}
              disabled={!scriptText}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiCopy className="w-4 h-4" />
              Másolás
            </button>
            <button
              onClick={handleDownloadScript}
              disabled={!scriptText}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiDownload className="w-4 h-4" />
              Letöltés
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

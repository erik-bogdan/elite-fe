"use client";

import { useState } from "react";
import { Bebas_Neue } from "next/font/google";
import { FiX } from "react-icons/fi";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

interface Team {
  name: string;
  players: { id: string; label: string }[];
}

interface EnterResultModalProps {
  open: boolean;
  onClose: () => void;
  teamA: Team;
  teamB: Team;
  onSubmit: (result: {
    cupsA: number;
    cupsB: number;
    mvpAId: string;
    mvpBId: string;
    selectedAIds: string[];
    selectedBIds: string[];
  }) => void;
  initialCupsA?: number;
  initialCupsB?: number;
  initialSelectedA?: string[]; // player IDs
  initialSelectedB?: string[]; // player IDs
  initialMvpA?: string; // player ID
  initialMvpB?: string; // player ID
}

export default function EnterResultModal({ open, onClose, teamA, teamB, onSubmit, initialCupsA, initialCupsB, initialSelectedA, initialSelectedB, initialMvpA, initialMvpB }: EnterResultModalProps) {
  const [cupsA, setCupsA] = useState(initialCupsA ?? 0);
  const [cupsB, setCupsB] = useState(initialCupsB ?? 0);
  const [selectedA, setSelectedA] = useState<string[]>(initialSelectedA && initialSelectedA.length ? initialSelectedA : teamA.players.slice(0, 2).map(p => p.id));
  const [selectedB, setSelectedB] = useState<string[]>(initialSelectedB && initialSelectedB.length ? initialSelectedB : teamB.players.slice(0, 2).map(p => p.id));
  const [mvpA, setMvpA] = useState(initialMvpA ?? (teamA.players[0]?.id || ""));
  const [mvpB, setMvpB] = useState(initialMvpB ?? (teamB.players[0]?.id || ""));

  // Update MVP if selection changes
  const updateMvpA = (sel: string[]) => {
    setSelectedA(sel);
    if (!sel.includes(mvpA)) setMvpA(sel[0] || "");
  };
  const updateMvpB = (sel: string[]) => {
    setSelectedB(sel);
    if (!sel.includes(mvpB)) setMvpB(sel[0] || "");
  };

  // Validation functions
  const isValidScore = (scoreA: number, scoreB: number): boolean => {
    // 10-10 is not allowed
    if (scoreA === 10 && scoreB === 10) return false;
    
    // Only the winner in overtime must have a 3-multiple score (13, 16, 19, etc.)
    // The loser can have any score within 3 points
    
    // In overtime, the winner must have a 3-multiple score (13, 16, 19, 22...)
    // and the loser must be 3 less or within 3 points, but not equal
    if (scoreA > 10 && scoreB > 10) {
      // Both teams in overtime - winner must be higher and have 3-multiple
      const higher = Math.max(scoreA, scoreB);
      const lower = Math.min(scoreA, scoreB);
      if ((higher - 10) % 3 !== 0) return false; // Winner must be 3-multiple
      if (higher === lower) return false; // Can't be equal
      if (higher - lower > 3) return false; // Max 3 point difference
    }
    
    // If one team has 10 and the other has more than 13, it's invalid
    if (scoreA === 10 && scoreB > 13) return false;
    if (scoreB === 10 && scoreA > 13) return false;
    
    // In overtime, both teams must have at least 10 points
    if (scoreA > 10 && scoreB < 10) return false;
    if (scoreB > 10 && scoreA < 10) return false;
    
    return true;
  };

  const getWinner = (scoreA: number, scoreB: number): string | null => {
    if (!isValidScore(scoreA, scoreB)) return null;
    if (scoreA === 10 && scoreB < 10) return teamA.name;
    if (scoreB === 10 && scoreA < 10) return teamB.name;
    if (scoreA > 10 && scoreB < scoreA) return teamA.name;
    if (scoreB > 10 && scoreA < scoreB) return teamB.name;
    if (scoreA > 10 && scoreB > 10) {
      // Both teams have 10+, higher score wins
      return scoreA > scoreB ? teamA.name : teamB.name;
    }
    return null;
  };

  const winner = getWinner(cupsA, cupsB);
  const isValid = isValidScore(cupsA, cupsB);

  // Check if save is allowed
  const canSave = selectedA.length === 2 && 
                 selectedB.length === 2 && 
                 isValid &&
                 (cupsA === 10 || cupsB === 10 || cupsA > 10 || cupsB > 10);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl mx-auto rounded-2xl bg-black/80 border-2 border-[#ff5c1a] shadow-2xl shadow-[#ff5c1a44] p-4 md:p-8 flex flex-col animate-fade-in my-4">
        {/* Close button */}
        <button className="absolute top-2 right-2 md:top-4 md:right-4 text-white hover:text-[#ff5c1a] text-2xl" onClick={onClose}>
          <FiX />
        </button>
        {/* Teams and VS */}
        <div className="flex flex-row items-start justify-between gap-2 md:gap-8 mb-4 md:mb-8">
          {/* Team A */}
          <div className="flex-1 flex flex-col items-center gap-2 md:gap-4 min-w-0">
            <div className={`${bebasNeue.className} text-lg md:text-2xl text-white font-bold mb-2 md:mb-4 text-center`}>{teamA.name}</div>
            <div className="grid grid-cols-1 gap-2 md:gap-4 w-full">
               {teamA.players.map((p) => {
                const selected = selectedA.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`w-full px-3 md:px-6 py-2 md:py-4 rounded-xl text-sm md:text-lg font-semibold border-2 transition-all duration-150 shadow-md
                      ${selected 
                        ? "bg-[#ff5c1a] border-[#ff5c1a] text-white scale-[1.02] shadow-lg shadow-[#ff5c1a]/50" 
                        : "bg-white/10 border-white/20 text-white hover:bg-[#ff5c1a]/30 hover:border-[#ff5c1a]"
                      }
                      ${selectedA.length === 2 && !selected ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                    onClick={() => {
                      if (selected) updateMvpA(selectedA.filter(x => x !== p.id));
                      else if (selectedA.length < 2) updateMvpA([...selectedA, p.id]);
                    }}
                    disabled={!selected && selectedA.length === 2}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 md:mt-4 flex flex-col sm:flex-row items-center gap-2 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm text-[#ff5c1a] font-bold mb-1 md:mb-2">Pohár</label>
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={cupsA}
                  onChange={e => setCupsA(Number(e.target.value))}
                  className={`w-16 md:w-24 text-center bg-black/60 border-2 ${cupsA === 10 || cupsA > 10 ? 'border-[#ff5c1a]' : 'border-white/20'} text-white rounded-lg py-2 md:py-3 text-base md:text-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#ff5c1a]`}
                  placeholder="Pohár"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm text-[#ff5c1a] font-bold mb-1 md:mb-2">MVP</label>
                <select
                  value={mvpA}
                  onChange={e => setMvpA(e.target.value)}
                  className="bg-black/60 border-2 border-[#ff5c1a] text-white rounded-lg px-2 md:px-4 py-1 md:py-2 text-sm md:text-lg focus:outline-none focus:ring-2 focus:ring-[#ff5c1a]"
                >
                  {selectedA.map((id) => {
                    const pl = teamA.players.find(pp => pp.id === id);
                    return <option key={id} value={id}>{pl?.label || id}</option>;
                  })}
                </select>
              </div>
            </div>
          </div>
          {/* VS */}
          <div className="flex flex-col items-center justify-center mx-1 md:mx-4">
            <div className={`${bebasNeue.className} text-2xl md:text-4xl text-[#ff5c1a] font-bold mb-2`}>VS</div>
            {/* Winner indicator */}
            {winner && (
              <div className="text-center">
                <div className="text-green-400 text-sm md:text-base font-bold mb-1">🏆 GYŐZTES</div>
                <div className="text-white text-xs md:text-sm">{winner}</div>
              </div>
            )}
            {/* Validation error */}
            {!isValid && (cupsA > 0 || cupsB > 0) && (
              <div className="text-center mt-2">
                <div className="text-red-400 text-xs md:text-sm font-bold">❌ ÉRVÉNYTELEN EREDMÉNY</div>
                                 <div className="text-red-300 text-xs">
                   {cupsA === 10 && cupsB === 10 ? "10-10 nem lehetséges!" : 
                    cupsA > 10 && (cupsA - 10) % 3 !== 0 ? `${teamA.name} hosszabbításban csak 13, 16, 19... lehet!` :
                    cupsB > 10 && (cupsB - 10) % 3 !== 0 ? `${teamB.name} hosszabbításban csak 13, 16, 19... lehet!` :
                    "Érvénytelen eredmény!"}
                 </div>
              </div>
            )}
          </div>
          {/* Team B */}
          <div className="flex-1 flex flex-col items-center gap-2 md:gap-4 min-w-0">
            <div className={`${bebasNeue.className} text-lg md:text-2xl text-white font-bold mb-2 md:mb-4 text-center`}>{teamB.name}</div>
            <div className="grid grid-cols-1 gap-2 md:gap-4 w-full">
               {teamB.players.map((p) => {
                const selected = selectedB.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`w-full px-3 md:px-6 py-2 md:py-4 rounded-xl text-sm md:text-lg font-semibold border-2 transition-all duration-150 shadow-md
                      ${selected 
                        ? "bg-[#ff5c1a] border-[#ff5c1a] text-white scale-[1.02] shadow-lg shadow-[#ff5c1a]/50" 
                        : "bg-white/10 border-white/20 text-white hover:bg-[#ff5c1a]/30 hover:border-[#ff5c1a]"
                      }
                      ${selectedB.length === 2 && !selected ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                    onClick={() => {
                      if (selected) updateMvpB(selectedB.filter(x => x !== p.id));
                      else if (selectedB.length < 2) updateMvpB([...selectedB, p.id]);
                    }}
                    disabled={!selected && selectedB.length === 2}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 md:mt-4 flex flex-col sm:flex-row items-center gap-2 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm text-[#ff5c1a] font-bold mb-1 md:mb-2">Pohár</label>
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={cupsB}
                  onChange={e => setCupsB(Number(e.target.value))}
                  className={`w-16 md:w-24 text-center bg-black/60 border-2 ${cupsB === 10 || cupsB > 10 ? 'border-[#ff5c1a]' : 'border-white/20'} text-white rounded-lg py-2 md:py-3 text-base md:text-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#ff5c1a]`}
                  placeholder="Pohár"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm text-[#ff5c1a] font-bold mb-1 md:mb-2">MVP</label>
                <select
                  value={mvpB}
                  onChange={e => setMvpB(e.target.value)}
                  className="bg-black/60 border-2 border-[#ff5c1a] text-white rounded-lg px-2 md:px-4 py-1 md:py-2 text-sm md:text-lg focus:outline-none focus:ring-2 focus:ring-[#ff5c1a]"
                >
                  {selectedB.map((id) => {
                    const pl = teamB.players.find(pp => pp.id === id);
                    return <option key={id} value={id}>{pl?.label || id}</option>;
                  })}
                </select>
              </div>
            </div>
          </div>
        </div>
        {/* Winner/Validation info above buttons */}
        <div className="text-center mt-4 md:mt-6">
          {winner && (
            <div className="text-green-400 text-lg md:text-xl font-bold mb-2">
              🏆 {winner} nyert!
            </div>
          )}
          {!isValid && (cupsA > 0 || cupsB > 0) && (
            <div className="text-red-400 text-base md:text-lg font-bold mb-2">
              ❌ Érvénytelen eredmény!
            </div>
          )}
        </div>
        {/* Save/Cancel buttons */}
        <div className="flex gap-2 md:gap-4 justify-center mt-4 md:mt-8">
          <button
            className={`${canSave ? 'bg-[#ff5c1a] hover:bg-[#ff7c3a]' : 'bg-gray-500 cursor-not-allowed'} text-white font-bold px-6 md:px-12 py-2 md:py-3 rounded-xl shadow-md transition text-base md:text-xl`}
            onClick={() => onSubmit({ cupsA, cupsB, mvpAId: mvpA, mvpBId: mvpB, selectedAIds: selectedA, selectedBIds: selectedB })}
            disabled={!canSave}
          >
            Mentés
          </button>
          <button
            className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 md:px-12 py-2 md:py-3 rounded-xl shadow-md transition text-base md:text-xl"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 
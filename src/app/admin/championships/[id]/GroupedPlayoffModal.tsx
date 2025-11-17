"use client";

import { useMemo, useState } from "react";
import { Bebas_Neue } from "next/font/google";
import { FiX } from "react-icons/fi";
import { toast } from "sonner";
import {
  PlayoffGroupsResponse,
  usePreviewPlayoffGroupsScheduleMutation,
  useSavePlayoffGroupsScheduleMutation,
} from "@/lib/features/championship/championshipSlice";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

interface GroupedPlayoffModalProps {
  leagueId: string;
  isOpen: boolean;
  onClose: () => void;
  playoffGroups?: PlayoffGroupsResponse;
}

export default function GroupedPlayoffModal({
  leagueId,
  isOpen,
  onClose,
  playoffGroups,
}: GroupedPlayoffModalProps) {
  const upperTeams = playoffGroups?.upper?.teamIds?.length || 0;
  const lowerTeams = playoffGroups?.lower?.teamIds?.length || 0;
  const upperRounds = upperTeams > 1 ? (upperTeams - 1) * 2 : 0;
  const lowerRounds = lowerTeams > 1 ? (lowerTeams - 1) * 2 : 0;
  const totalDays = upperRounds + lowerRounds;

  const [startTime, setStartTime] = useState("20:00");
  const [matchDuration, setMatchDuration] = useState(20);
  const [tables, setTables] = useState(2);
  const [gameDayDate, setGameDayDate] = useState<string>("");

  const [previewSchedule, { data, isLoading: isPreviewing }] =
    usePreviewPlayoffGroupsScheduleMutation();
  const [saveSchedule, { isLoading: isSaving }] =
    useSavePlayoffGroupsScheduleMutation();

  const houseLists = useMemo(() => {
    return [
      {
        label: "Felső ház",
        teams: playoffGroups?.upper?.standings || [],
      },
      {
        label: "Alsó ház",
        teams: playoffGroups?.lower?.standings || [],
      },
    ];
  }, [playoffGroups]);

  if (!isOpen) return null;

  const handlePreview = async () => {
    try {
      await previewSchedule({
        id: leagueId,
        startTime,
        matchDuration,
        tables,
        gameDayDate,
      }).unwrap();
    } catch (error: any) {
      const msg = error?.data?.message || error?.message || "Generálási hiba";
      toast.error(msg);
    }
  };

  const handleSave = async () => {
    try {
      await saveSchedule({
        id: leagueId,
        schedule: data?.schedule || [],
      }).unwrap();
      toast.success("Playoff menetrend elmentve");
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
            Playoff házak sorsolása
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {houseLists.map(({ label, teams }) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <h3 className="text-white font-semibold mb-3">{label}</h3>
                <div className="flex flex-wrap gap-2">
                  {teams.map((team: any) => (
                    <span
                      key={team.teamId}
                      className="px-3 py-1 rounded-full bg-[#ff5c1a]/20 text-[#ffb38f] text-sm"
                    >
                      {team.name}
                    </span>
                  ))}
                  {teams.length === 0 && (
                    <span className="text-white/60 text-sm">
                      Nincs elérhető csapat
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-white/80 text-sm mb-1">
                Kezdés (HH:MM)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-1">
                Meccs hossza (perc)
              </label>
              <input
                type="number"
                min={10}
                value={matchDuration}
                onChange={(e) => setMatchDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-1">
                Asztalok száma
              </label>
              <input
                type="number"
                min={1}
                value={tables}
                onChange={(e) => setTables(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handlePreview}
                disabled={totalDays === 0 || isPreviewing}
                className="w-full px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPreviewing ? "Generálás..." : "Generálás"}
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">
              Játéknap dátuma
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-white/70 text-sm mb-1">
                  Dátum
                </label>
                <input
                  type="date"
                  value={gameDayDate}
                  onChange={(e) => setGameDayDate(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
                />
              </div>
              <div className="md:col-span-2 text-white/60 text-sm flex items-center">
                Ez a dátum lesz kiírva minden időkörre (1 játéknap).
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Előnézet</h4>
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="bg-black/30 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Ház</th>
                    <th className="px-3 py-2 text-left">Időkör</th>
                    <th className="px-3 py-2 text-left">Idő</th>
                    <th className="px-3 py-2 text-left">Asztal</th>
                    <th className="px-3 py-2 text-left">Hazai</th>
                    <th className="px-3 py-2 text-left">Vendég</th>
                    <th className="px-3 py-2 text-left">Dátum</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.schedule || []).map((match: any, idx: number) => (
                    <tr key={match.id || idx} className="text-white/80">
                      <td className="px-3 py-2">{idx + 1}</td>
                      <td className="px-3 py-2">{match.houseLabel}</td>
                      <td className="px-3 py-2">{match.day}</td>
                      <td className="px-3 py-2">{match.startTime}</td>
                      <td className="px-3 py-2">{match.table}</td>
                      <td className="px-3 py-2">{match.homeName}</td>
                      <td className="px-3 py-2">{match.awayName}</td>
                      <td className="px-3 py-2">
                        {match.date ? match.date : gameDayDate || "—"}
                      </td>
                    </tr>
                  ))}
                  {(!data?.schedule || data.schedule.length === 0) && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-6 text-center text-white/60"
                      >
                        Nincs még generált menetrend
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex items-center justify-between">
          <span className="text-white/60 text-sm">
            {totalDays > 0
              ? `${totalDays} időkör kerül legenerálásra (felső és alsó ház felváltva)`
              : "Nincs elegendő csapat a rájátszás menetrendhez"}
          </span>
          <button
            onClick={handleSave}
            disabled={!data?.schedule?.length || isSaving}
            className="px-5 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Mentés..." : "Menetrend mentése"}
          </button>
        </div>
      </div>
    </div>
  );
}


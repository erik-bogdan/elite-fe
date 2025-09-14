"use client";

import { useState } from "react";
import AnimatedModal from "../../teams/components/AnimatedModal";
import { Bebas_Neue } from "next/font/google";
import {
  useAddTeamToLeagueMutation,
  useGetAvailableTeamsForLeagueQuery,
  useGetLeagueTeamsQuery,
  useRemoveTeamFromLeagueMutation,
} from "@/lib/features/championship/championshipSlice";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

interface TeamAssignModalProps {
  leagueId: string;
  isOpen: boolean;
  onClose: () => void;
  onChanged?: () => void;
}

export default function TeamAssignModal({ leagueId, isOpen, onClose, onChanged }: TeamAssignModalProps) {
  const { data: attachedTeams, refetch: refetchAttached } = useGetLeagueTeamsQuery(leagueId, { skip: !leagueId || !isOpen });
  const { data: availableTeams, refetch: refetchAvailable } = useGetAvailableTeamsForLeagueQuery(leagueId, { skip: !leagueId || !isOpen });
  const [addTeam] = useAddTeamToLeagueMutation();
  const [removeTeam] = useRemoveTeamFromLeagueMutation();
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  const handleAdd = async () => {
    for (const id of selectedTeamIds) {
      await addTeam({ leagueId, teamId: id }).unwrap();
    }
    setSelectedTeamIds([]);
    await Promise.all([refetchAttached(), refetchAvailable()]);
    onChanged?.();
  };

  const handleRemove = async (teamId: string) => {
    await removeTeam({ leagueId, teamId }).unwrap();
    await Promise.all([refetchAttached(), refetchAvailable()]);
    onChanged?.();
  };

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title={<span className={bebasNeue.className}>Csapatok kezelése</span>}
      size="lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black/30 rounded-lg p-4 border border-[#ff5c1a]/30">
          <h4 className={`${bebasNeue.className} text-xl text-white mb-3`}>Hozzárendelt csapatok</h4>
          <div className="space-y-2 max-h-80 overflow-auto pr-1">
            {(attachedTeams || []).map((t: any) => {
              const status = t._status as string | undefined;
              const color = status === 'approved' ? 'text-green-400' : status === 'declined' ? 'text-red-400' : 'text-yellow-400';
              const label = status === 'approved' ? 'Elfogadva' : status === 'declined' ? 'Elutasítva' : 'Függőben';
              return (
                <div key={t.id} className="flex items-center justify-between bg-black/40 rounded px-3 py-2">
                  <span className="text-white">
                    {t.name} {status ? <span className={`${color} text-sm`}>(
                      {label}
                    )</span> : null}
                  </span>
                  <button onClick={() => handleRemove(t.id)} className="text-red-400 hover:text-red-500">Eltávolítás</button>
                </div>
              );
            })}
            {(!attachedTeams || attachedTeams.length === 0) && (
              <div className="text-white/70">Nincs hozzárendelés</div>
            )}
          </div>
        </div>
        <div className="bg-black/30 rounded-lg p-4 border border-[#ff5c1a]/30">
          <h4 className={`${bebasNeue.className} text-xl text-white mb-3`}>Elérhető csapatok</h4>
          <div className="space-y-3">
            <select
              multiple
              value={selectedTeamIds}
              onChange={(e) => {
                const options = Array.from(e.currentTarget.selectedOptions).map(o => o.value);
                setSelectedTeamIds(options);
              }}
              className="w-full min-h-40 bg-black/60 border-2 border-[#ff5c1a] text-white rounded-lg px-3 py-2"
            >
              {(availableTeams || []).map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <div className="flex justify-end">
              <button
                onClick={handleAdd}
                disabled={selectedTeamIds.length === 0}
                className="px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded disabled:opacity-50"
              >
                Hozzáadás
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnimatedModal>
  );
}



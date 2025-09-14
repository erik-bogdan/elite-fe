"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Bebas_Neue } from "next/font/google";
import { FiPlus, FiCalendar, FiUsers, FiAward, FiCheckCircle, FiChevronRight, FiEdit2, FiTrash2 } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useGetChampionshipsQuery, useCreateChampionshipMutation, useUpdateChampionshipMutation } from "@/lib/features/championship/championshipSlice";
import { useGetSeasonsQuery } from "@/lib/features/season/seasonSlice";
import { toast } from "sonner";
import Select from "react-select";
import { ChampionshipProperties, ChampionshipGameDay } from "@/lib/features/championship/championshipSlice";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

const selectStyles = {
  control: (base: any) => ({
    ...base,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderColor: "rgba(255, 92, 26, 0.5)",
    "&:hover": {
      borderColor: "rgba(255, 92, 26, 0.8)",
    },
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: "#001a3a",
    border: "1px solid rgba(255, 92, 26, 0.5)",
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? "rgba(255, 92, 26, 0.2)" : "transparent",
    color: "white",
    "&:hover": {
      backgroundColor: "rgba(255, 92, 26, 0.2)",
    },
  }),
  singleValue: (base: any) => ({
    ...base,
    color: "white",
  }),
};

const typeOptions = [
  { value: "league", label: "Liga" },
  { value: "tournament", label: "Torna" },
];

export default function ChampionshipsPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data: championships } = useGetChampionshipsQuery();
  const { data: seasons, isLoading: isSeasonsLoading } = useGetSeasonsQuery();
  const [createChampionship] = useCreateChampionshipMutation();
  const [updateChampionship] = useUpdateChampionshipMutation();
  const [selectedSeason, setSelectedSeason] = useState<{ value: string; label: string } | null>(null);
  const [nameInput, setNameInput] = useState<string>("");
  const [properties, setProperties] = useState<ChampionshipProperties>({
    type: 'league',
    rounds: 2,
    hasPlayoff: true,
    teams: 16,
    gameDays: [],
    elimination: 4,
    registrationClose: '',
    regfee: '',
    regfeeDueDate: '',
    nyeremeny_text: '',
    nyeremeny_value: '',
    masodik_nyeremeny_text: '',
    masodik_nyeremeny_value: '',
  });

  const { allChampionships, isLoading, error } = useSelector((state: RootState) => state.championship);

  const handleChampionshipClick = (championshipId: string) => {
    router.push(`/admin/championships/${championshipId}`);
  };

  const handleSubmitModal = async () => {
    if (!selectedSeason) {
      toast.error('Válassz szezont!');
      return;
    }

    try {
      const safeSlug = nameInput.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (isEditMode && editingId) {
        await updateChampionship({ id: editingId, nameInput, seasonId: String(selectedSeason.value), properties, slug: safeSlug } as any).unwrap();
        toast.success('Bajnokság frissítve.');
      } else {
        await createChampionship({ name: nameInput, seasonId: String(selectedSeason.value), properties, slug: safeSlug } as any).unwrap();
        toast.success('Bajnokság sikeresen létrehozva!');
      }
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingId(null);
    } catch (error) {
      toast.error('Hiba történt a mentéskor!');
    }
  };

  const filtered = selectedSeason
    ? allChampionships.filter(c => String((c as any).seasonId) === selectedSeason.value)
    : allChampionships;
  const activeChampionships = filtered.filter(c => c.progress < 100);
  const completedChampionships = filtered.filter(c => c.progress === 100);

  if (isLoading || isSeasonsLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="min-h-screen p-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl p-6 border border-[#ff5c1a]/40"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#ff5c1a]/20 flex items-center justify-center">
              <FiAward className="w-6 h-6 text-[#ff5c1a]" />
            </div>
            <div>
              <p className="text-[#e0e6f7]">Összes Bajnokság</p>
              <p className={`${bebasNeue.className} text-3xl text-white`}>{allChampionships.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl p-6 border border-[#ff5c1a]/40"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#ff5c1a]/20 flex items-center justify-center">
              <FiAward className="w-6 h-6 text-[#ff5c1a]" />
            </div>
            <div>
              <p className="text-[#e0e6f7]">Aktív Bajnokságok</p>
              <p className={`${bebasNeue.className} text-3xl text-white`}>{activeChampionships.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl p-6 border border-[#ff5c1a]/40"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#ff5c1a]/20 flex items-center justify-center">
              <FiCheckCircle className="w-6 h-6 text-[#ff5c1a]" />
            </div>
            <div>
              <p className="text-[#e0e6f7]">Befejezett Bajnokságok</p>
              <p className={`${bebasNeue.className} text-3xl text-white`}>{completedChampionships.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Active Championships */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
      >
        {activeChampionships.map((championship) => (
          <div
            key={championship.id}
            className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-2xl shadow-2xl border border-[#ff5c1a]/40 p-6 cursor-pointer hover:border-[#ff5c1a] transition-colors"
            onClick={() => handleChampionshipClick(championship.id)}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#ff5c1a]">
                <Image
                  src={championship.logo || "/elitelogo.png"}
                  alt={championship.name}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              </div>
              <div>
                <h3 className={`${bebasNeue.className} text-2xl text-white`}>{championship.name}</h3>
                <p className="text-[#ff5c1a] font-bold">{championship.phase}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white">Státusz</span>
                  <span className="text-[#ff5c1a]">
                    {championship.completedMatches}/{championship.totalMatches} meccs
                  </span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-2">
                  <div
                    className="bg-[#ff5c1a] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${championship.progress}%` }}
                  />
                </div>
              </div>

              {championship.teams && (
                <div className="grid grid-cols-2 gap-4">
                  {championship.teams.map((team, index) => (
                    <div
                      key={index}
                      className="bg-black/30 rounded-xl p-4 border border-[#ff5c1a]/20"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          <Image
                            src={team.logo || "/elitelogo.png"}
                            alt={team.name}
                            width={32}
                            height={32}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <span className="text-white font-semibold">{team.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#e0e6f7]">Meccsek</span>
                        <span className="text-white">{team.matches}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#e0e6f7]">Wins</span>
                        <span className="text-[#ff5c1a] font-bold">{team.wins}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Championships Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl overflow-hidden border border-[#ff5c1a]/40"
      >
        <div className="flex justify-between items-center p-6 border-b border-[#ff5c1a]/20">
          <h2 className={`${bebasNeue.className} text-2xl text-white`}>Összes Bajnokság</h2>
          <div className="flex items-center gap-3">
            <label className="text-[#e0e6f7]">Szezon:</label>
            <Select
              options={[{ value: 'all', label: 'Összes' }, ...(seasons || []).map(season => ({ value: String(season.id), label: season.name }))]}
              value={selectedSeason || { value: 'all', label: 'Összes' }}
              onChange={(option: any) => setSelectedSeason(option?.value === 'all' ? null : option)}
              styles={selectStyles}
              className="min-w-[220px]"
            />
          </div>
          <button
            onClick={() => { setIsEditMode(false); setEditingId(null); setNameInput(''); setSelectedSeason(null); setProperties({
              type: 'league', rounds: 2, hasPlayoff: true, teams: 16, gameDays: [], elimination: 4, registrationClose: '', regfee: '', regfeeDueDate: '', nyeremeny_text: '', nyeremeny_value: '', masodik_nyeremeny_text: '', masodik_nyeremeny_value: ''
            }); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded-lg transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            Új Bajnokság
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-black/30">
                <th className="px-6 py-4 text-left text-[#e0e6f7]">Bajnokság</th>
                <th className="px-6 py-4 text-left text-[#e0e6f7]">Meccsek</th>
                <th className="px-6 py-4 text-left text-[#e0e6f7]">Szezon</th>
                <th className="px-6 py-4 text-left text-[#e0e6f7]">Győztes</th>
                <th className="px-6 py-4 text-left text-[#e0e6f7]">Státusz</th>
                <th className="px-6 py-4 text-left text-[#e0e6f7]">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {allChampionships.map((championship) => (
                <tr
                  key={championship.id}
                  className="border-t border-[#ff5c1a]/20 hover:bg-black/20 cursor-pointer"
                  onClick={() => handleChampionshipClick(championship.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <Image
                          src={championship.logo || "/elitelogo.png"}
                          alt={championship.name}
                          width={80}
                          height={80}
                          className="w-10"
                        />
                      </div>
                      <span className="text-white">{championship.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white">
                    {championship.completedMatches}/{championship.totalMatches}
                  </td>
                  <td className="px-6 py-4 text-white">{(seasons || []).find(s => String(s.id) === String((championship as any).seasonId))?.name || '-'}</td>
                  <td className="px-6 py-4 text-white">{championship.winner || "-"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        championship.progress === 100
                          ? "bg-green-500/20 text-green-400"
                          : "bg-[#ff5c1a]/20 text-[#ff5c1a]"
                      }`}
                    >
                      {championship.progress === 100 ? "Completed" : "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const seasonId = String((championship as any).seasonId || '');
                          setIsEditMode(true);
                          setEditingId(championship.id);
                          setNameInput(championship.name);
                          setSelectedSeason(seasonId ? { value: seasonId, label: (seasons || []).find(s => String(s.id) === seasonId)?.name || '' } : null);
                          // Prefill properties from item (fallback defaults)
                          const p = (championship as any).properties || {};
                          setProperties({
                            type: (p.type || 'league'),
                            rounds: Number(p.rounds || 2),
                            hasPlayoff: !!p.hasPlayoff,
                            teams: Number(p.teams || 16),
                            gameDays: Array.isArray(p.gameDays) ? p.gameDays : [],
                            elimination: typeof p.elimination === 'number' ? p.elimination : 4,
                            registrationClose: p.registrationClose || '',
                            regfee: p.regfee || '',
                            regfeeDueDate: p.regfeeDueDate || '',
                            nyeremeny_text: p.nyeremeny_text || '',
                            nyeremeny_value: p.nyeremeny_value || '',
                            masodik_nyeremeny_text: p.masodik_nyeremeny_text || '',
                            masodik_nyeremeny_value: p.masodik_nyeremeny_value || '',
                          });
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-[#ff5c1a] hover:text-[#ff7c3a] transition-colors"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement delete
                        }}
                        className="p-2 text-red-500 hover:text-red-600 transition-colors"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                      <FiChevronRight className="w-5 h-5 text-[#ff5c1a]" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Create Championship Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#001a3a] rounded-2xl p-8 w-full max-w-3xl max-h-[85vh] overflow-y-auto border-2 border-[#ff5c1a]">
            <h2 className={`${bebasNeue.className} text-2xl text-white mb-6`}>Új Bajnokság</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmitModal(); }}>
              <div className="space-y-4">
                <div>
                  <Label className="text-white mb-2">Szezon</Label>
                  <Select
                    options={seasons?.map(season => ({
                      value: String(season.id),
                      label: season.name
                    }))}
                    value={selectedSeason}
                    onChange={(option) => setSelectedSeason(option as any)}
                    styles={selectStyles}
                    placeholder="Válassz szezont..."
                    isSearchable
                  />
                </div>
                <div>
                  <Label className="text-white mb-2">Név</Label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-4 py-2 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white placeholder:text-white/50 focus:border-[#ff5c1a] focus:ring-[#ff5c1a]/20"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2">Típus</Label>
                  <Select
                    options={typeOptions}
                    value={typeOptions.find(option => option.value === properties.type)}
                    onChange={(option) => setProperties(prev => ({ ...prev, type: option?.value as 'league' | 'tournament' }))}
                    styles={selectStyles}
                  />
                </div>
                <div>
                  <Label className="text-white mb-2">Körök száma</Label>
                  <input
                    type="number"
                    min="1"
                    value={properties.rounds}
                    onChange={(e) => setProperties(prev => ({ ...prev, rounds: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white focus:border-[#ff5c1a] focus:ring-[#ff5c1a]/20"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2">Csapatok száma</Label>
                  <input
                    type="number"
                    min="2"
                    value={properties.teams}
                    onChange={(e) => setProperties(prev => ({ ...prev, teams: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white focus:border-[#ff5c1a] focus:ring-[#ff5c1a]/20"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2">Kiesők száma</Label>
                  <input
                    type="number"
                    min="0"
                    value={properties.elimination ?? 0}
                    onChange={(e) => setProperties(prev => ({ ...prev, elimination: Math.max(0, parseInt(e.target.value || '0')) }))}
                    className="w-full px-4 py-2 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white focus:border-[#ff5c1a] focus:ring-[#ff5c1a]/20"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2">Nevezés zárása</Label>
                  <input
                    type="datetime-local"
                    value={properties.registrationClose || ''}
                    onChange={(e) => setProperties(prev => ({ ...prev, registrationClose: e.target.value }))}
                    className="w-full px-4 py-2 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white focus:border-[#ff5c1a] focus:ring-[#ff5c1a]/20"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2">Nevezési díj</Label>
                  <input
                    type="text"
                    placeholder="pl. 29.000 Ft/játékos, 87.000 Ft/csapat"
                    value={properties.regfee || ''}
                    onChange={(e) => setProperties(prev => ({ ...prev, regfee: e.target.value }))}
                    className="w-full px-4 py-2 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white focus:border-[#ff5c1a] focus:ring-[#ff5c1a]/20"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2">Nevezési díj határidő</Label>
                  <input
                    type="datetime-local"
                    value={properties.regfeeDueDate || ''}
                    onChange={(e) => setProperties(prev => ({ ...prev, regfeeDueDate: e.target.value }))}
                    className="w-full px-4 py-2 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white focus:border-[#ff5c1a] focus:ring-[#ff5c1a]/20"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2">Első díj szöveg</Label>
                  <input
                    type="text"
                    placeholder="pl. A nyertes pénznyereményben részesül"
                    value={properties.nyeremeny_text || ''}
                    onChange={(e) => setProperties(prev => ({ ...prev, nyeremeny_text: e.target.value }))}
                    className="w-full px-4 py-2 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white focus:border-[#ff5c1a] focus:ring-[#ff5c1a]/20"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2">Első díj érték</Label>
                  <input
                    type="text"
                    placeholder="pl. 210.000 Ft"
                    value={properties.nyeremeny_value || ''}
                    onChange={(e) => setProperties(prev => ({ ...prev, nyeremeny_value: e.target.value }))}
                    className="w-full px-4 py-2 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white focus:border-[#ff5c1a] focus:ring-[#ff5c1a]/20"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2">Második díj szöveg</Label>
                  <input
                    type="text"
                    placeholder="pl. A második helyezett pénznyereményben részesül"
                    value={properties.masodik_nyeremeny_text || ''}
                    onChange={(e) => setProperties(prev => ({ ...prev, masodik_nyeremeny_text: e.target.value }))}
                    className="w-full px-4 py-2 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white focus:border-[#ff5c1a] focus:ring-[#ff5c1a]/20"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2">Második díj érték</Label>
                  <input
                    type="text"
                    placeholder="pl. 40.000 Ft"
                    value={properties.masodik_nyeremeny_value || ''}
                    onChange={(e) => setProperties(prev => ({ ...prev, masodik_nyeremeny_value: e.target.value }))}
                    className="w-full px-4 py-2 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white focus:border-[#ff5c1a] focus:ring-[#ff5c1a]/20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="hasPlayoff"
                    checked={properties.hasPlayoff}
                    onCheckedChange={(checked) => setProperties(prev => ({ ...prev, hasPlayoff: checked as boolean }))}
                    className="border-[#ff5c1a]/50 data-[state=checked]:bg-[#ff5c1a] data-[state=checked]:border-[#ff5c1a]"
                  />
                  <label htmlFor="hasPlayoff" className="text-white">Playoff rendszer</label>
                </div>

                {/* GameDays editor */}
                <div>
                  <Label className="text-white mb-2">Játéknapok</Label>
                  <div className="space-y-3">
                    {(properties.gameDays || []).map((gd, idx) => (
                      <div key={gd.id} className="bg-black/30 border border-[#ff5c1a]/30 rounded-lg p-3 md:grid md:grid-cols-[1fr_180px_auto_auto] md:items-center md:gap-3 flex flex-col gap-2">
                        <input
                          type="text"
                          value={gd.name}
                          onChange={(e) => setProperties(prev => ({
                            ...prev,
                            gameDays: (prev.gameDays || []).map((g, i) => i === idx ? { ...g, name: e.target.value } : g)
                          }))}
                          placeholder="Megnevezés"
                          className="w-full px-3 py-2 bg-black/40 border-2 border-[#ff5c1a]/30 rounded-lg text-white"
                        />
                        <input
                          type="date"
                          value={gd.date}
                          onChange={(e) => setProperties(prev => ({
                            ...prev,
                            gameDays: (prev.gameDays || []).map((g, i) => i === idx ? { ...g, date: e.target.value } : g)
                          }))}
                          className="w-full md:w-auto px-3 py-2 bg-black/40 border-2 border-[#ff5c1a]/30 rounded-lg text-white"
                        />
                        <label className="flex items-center gap-2 text-white/90 text-sm">
                          <Checkbox
                            id={`gd-${idx}`}
                            checked={gd.gameday}
                            onCheckedChange={(checked) => setProperties(prev => ({
                              ...prev,
                              gameDays: (prev.gameDays || []).map((g, i) => i === idx ? { ...g, gameday: !!checked } : g)
                            }))}
                            className="border-[#ff5c1a]/50 data-[state=checked]:bg-[#ff5c1a] data-[state=checked]:border-[#ff5c1a]"
                          />
                          Gameday
                        </label>
                        <button type="button" onClick={() => setProperties(prev => ({
                          ...prev,
                          gameDays: (prev.gameDays || []).filter((_, i) => i !== idx)
                        }))} className="px-2 py-1 text-red-400 hover:text-red-500 whitespace-nowrap">Törlés</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-white/60 text-sm">Add meg a megnevezést és a dátumot; jelöld be a fő játéknapokat.</div>
                    <button
                      type="button"
                      onClick={() => setProperties(prev => ({
                        ...prev,
                        gameDays: [...(prev.gameDays || []), { id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : String(Date.now()), name: '', date: '', gameday: true } as ChampionshipGameDay]
                      }))}
                      className="px-3 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded-lg"
                    >
                      Játéknap hozzáadása
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-white hover:text-[#ff5c1a] transition-colors"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded-lg transition-colors"
                >
                  {isEditMode ? 'Módosítás' : 'Létrehozás'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
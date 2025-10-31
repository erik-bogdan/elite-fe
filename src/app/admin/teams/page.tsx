"use client";

import { useMemo, useState } from "react";
import { Bebas_Neue } from "next/font/google";
import { FiUsers, FiUserPlus, FiChevronRight } from "react-icons/fi";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import AddTeamModal from "./components/AddTeamModal";
import { useGetTeamsQuery } from "@/lib/features/apiSlice";
import { useModal } from "@/hooks/modalHook";
import { toBackendUrl } from "@/lib/utils";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

// Data comes from API

export default function TeamsPage() {
  const router = useRouter();
  const { isOpen: isAddTeamModalOpen, open: openAddTeamModal, close: closeAddTeamModal } = useModal();
  const { data: teams, isLoading } = useGetTeamsQuery();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleTeamClick = (teamId: string) => {
    router.push(`/admin/teams/${teamId}/view`);
  };

  const paginatedTeams = useMemo(() => {
    const items = teams || [];
    return items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [teams, currentPage]);

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
              <FiUsers className="w-6 h-6 text-[#ff5c1a]" />
            </div>
            <div>
              <p className="text-[#e0e6f7]">Total Teams</p>
               <p className={`${bebasNeue.className} text-3xl text-white`}>{teams?.length ?? 0}</p>
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
              <FiUsers className="w-6 h-6 text-[#ff5c1a]" />
            </div>
            <div>
              <p className="text-[#e0e6f7]">Active Teams</p>
              <p className={`${bebasNeue.className} text-3xl text-white`}>
                 {teams?.length ?? 0}
              </p>
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
              <FiUsers className="w-6 h-6 text-[#ff5c1a]" />
            </div>
            <div>
              <p className="text-[#e0e6f7]">Összes Játékos</p>
              <p className={`${bebasNeue.className} text-3xl text-white`}>
                 {/* Aggregate unknown without extra calls */}
                 {0}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Teams Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-xl overflow-hidden border border-[#ff5c1a]/40"
      >
        <div className="flex justify-between items-center p-6 border-b border-[#ff5c1a]/20">
          <h2 className={`${bebasNeue.className} text-2xl text-white`}>Összes Csapat</h2>
          <button
            onClick={openAddTeamModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded-lg transition-colors"
          >
            <FiUserPlus className="w-5 h-5" />
            Új Csapat
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-black/30">
                <th className="px-6 py-4 text-left text-[#e0e6f7]">Csapat</th>
                <th className="px-6 py-4 text-left text-[#e0e6f7]">Játékosok</th>
                <th className="px-6 py-4 text-left text-[#e0e6f7]">Meccsek</th>
                <th className="px-6 py-4 text-left text-[#e0e6f7]">Rekord</th>
                <th className="px-6 py-4 text-left text-[#e0e6f7]">Státusz</th>
                <th className="px-6 py-4 text-left text-[#e0e6f7]">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTeams.map((team) => (
                <tr
                  key={team.id}
                  className="border-t border-[#ff5c1a]/20 hover:bg-black/20 cursor-pointer"
                  onClick={() => handleTeamClick(team.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <Image
                          src={toBackendUrl(team.logo) || "/elitelogo.png"}
                          alt={team.name}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <span className="text-white">{team.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white">-</td>
                  <td className="px-6 py-4 text-white">-</td>
                  <td className="px-6 py-4 text-white">-</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        true
                          ? "bg-[#ff5c1a]/20 text-[#ff5c1a]"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      Aktív
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FiChevronRight className="w-5 h-5 text-[#ff5c1a]" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-[#ff5c1a]/20">
          <div className="text-[#e0e6f7]">
            Megjelenítve {Math.min((currentPage - 1) * pageSize + 1, (teams?.length ?? 0))} - {" "}
            {Math.min(currentPage * pageSize, (teams?.length ?? 0))} of {(teams?.length ?? 0)} csapatok
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-black/30 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/40 transition-colors"
            >
              Előző
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil((teams?.length ?? 0) / pageSize)))}
              disabled={currentPage === Math.ceil((teams?.length ?? 0) / pageSize)}
              className="px-4 py-2 rounded-lg bg-black/30 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/40 transition-colors"
            >
              Következő
            </button>
          </div>
        </div>
      </motion.div>

      <AddTeamModal isOpen={isAddTeamModalOpen} onClose={closeAddTeamModal} />
    </div>
  );
} 
"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Bebas_Neue } from "next/font/google";
import { FiArrowLeft, FiEdit2, FiAward } from "react-icons/fi";
import Link from "next/link";
import { useState } from "react";
import EditPlayerModal from "../components/EditPlayerModal";
import { useGetPlayerByIdQuery, useUploadPlayerImageMutation } from "@/lib/features/apiSlice";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

interface SeasonHistory {
  season: string;
  team: string;
  league: string;
  position: string;
  gamesPlayed: number;
  gamesWon: number;
}

type ApiPlayer = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  nickname: string;
  image?: string | null;
  seasons?: Array<{ seasonId: string; seasonName: string; teamId: string; teamName: string; captain?: boolean }>;
};

export default function PlayerDetailsPage() {
  const params = useParams();
  const playerId = String(params.id);
  const { data: player } = useGetPlayerByIdQuery(playerId, { skip: !playerId });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [uploadImage, { isLoading: uploading }] = useUploadPlayerImageMutation();

  const onCloseEdit = () => setIsEditModalOpen(false);

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className={`${bebasNeue.className} text-4xl text-[#ff5c1a] mb-4`}>Játékos nem található</h1>
        <Link href="/admin/players" className="text-white hover:text-[#ff5c1a] transition-colors">
          Vissza a játékosokhoz
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/admin/players"
          className="flex items-center gap-2 text-white hover:text-[#ff5c1a] transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
          Back to Players
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-2xl shadow-2xl border border-[#ff5c1a]/40 p-8 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Player Image */}
          <div className="flex flex-col items-center">
            <div className="relative w-48 h-48 rounded-full border-4 border-[#ff5c1a] overflow-hidden">
              <Image
                src={player.image || `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/uploads/player-images/default.png`}
                alt={`${player.firstName ?? ''} ${player.lastName ?? ''}`.trim() || 'Player'}
                width={192}
                height={192}
                className="object-cover w-full h-full"
              />
            </div>
            <label className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-black/40 border border-white/20 rounded text-white cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    await uploadImage({ id: playerId, file }).unwrap();
                    window.location.reload();
                  } catch (err) {
                    console.error(err);
                    alert('Kép feltöltése nem sikerült');
                  }
                }}
              />
              {uploading ? 'Feltöltés...' : 'Kép feltöltése'}
            </label>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded-lg transition-colors"
            >
              <FiEdit2 className="w-5 h-5" />
              Edit Profile
            </button>
          </div>

          {/* Player Info */}
          <div className="space-y-6">
            <div>
              <h1 className={`${bebasNeue.className} text-4xl text-white mb-2`}>
                {player.lastName ?? ''} {player.firstName ?? ''}
              </h1>
              <p className="text-2xl text-[#ff5c1a] font-bold">{player.nickname}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[#e0e6f7] text-sm">Email</p>
                <p className="text-white font-semibold">{player.email ?? '-'}</p>
              </div>
              <div>
                <p className="text-[#e0e6f7] text-sm">Pólóméret</p>
                <p className="text-white font-semibold">{(player as any).shirtSize ?? '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Season History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-[#001a3a]/80 to-[#002b6b]/90 rounded-2xl shadow-2xl border border-[#ff5c1a]/40 p-8"
      >
        <div className="flex items-center gap-2 mb-6">
          <FiAward className="w-6 h-6 text-[#ff5c1a]" />
          <h2 className={`${bebasNeue.className} text-2xl text-white`}>Szezonok</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#ff5c1a]/40">
                <th className="text-left py-4 px-4 text-[#ff5c1a] font-bold">Season</th>
                <th className="text-left py-4 px-4 text-[#ff5c1a] font-bold">Team</th>
                <th className="text-left py-4 px-4 text-[#ff5c1a] font-bold">Csapatkapitány</th>
                <th className="text-center py-4 px-4 text-[#ff5c1a] font-bold">Position</th>
                <th className="text-center py-4 px-4 text-[#ff5c1a] font-bold">Games</th>
                <th className="text-center py-4 px-4 text-[#ff5c1a] font-bold">Wins</th>
                <th className="text-center py-4 px-4 text-[#ff5c1a] font-bold">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ff5c1a]/20">
              {(player?.seasons || []).map((season: any, index: number) => (
                <tr key={index} className="hover:bg-[#ff5c1a]/10 transition-colors">
                  <td className="py-4 px-4 text-white font-semibold">{season.seasonName}</td>
                  <td className="py-4 px-4 text-white">{season.teamName}</td>
                  <td className="py-4 px-4 text-white">{season.captain ? 'Igen' : 'Nem'}</td>
                  <td className="py-4 px-4 text-center text-white">-</td>
                  <td className="py-4 px-4 text-center text-white">-</td>
                  <td className="py-4 px-4 text-center">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditPlayerModal
          isOpen={isEditModalOpen}
          onClose={onCloseEdit}
          player={{
            id: player.id,
            firstName: player.firstName,
            lastName: player.lastName,
            nickname: player.nickname,
            email: player.email,
            shirtSize: (player as any).shirtSize,
          }}
        />
      )}
    </div>
  );
} 
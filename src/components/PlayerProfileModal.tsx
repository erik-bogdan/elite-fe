"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Bebas_Neue } from 'next/font/google';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });

interface PlayerProfileModalProps {
  playerId: string | null;
  playerName?: string;
  playerImage?: string;
  onClose: () => void;
}

export default function PlayerProfileModal({ playerId, playerName, playerImage, onClose }: PlayerProfileModalProps) {
  const [stats, setStats] = useState<any>(null);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<any>(null);

  useEffect(() => {
    if (!playerId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        // Load player data
        const playerResp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/api/players/${playerId}`);
        if (playerResp.ok && mounted) {
          const playerData = await playerResp.json();
          setPlayer(playerData);
        }

        // Load stats
        const statsResp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/api/players/${playerId}/stats`);
        if (statsResp.ok && mounted) {
          const statsData = await statsResp.json();
          setStats(statsData);
        }

        // Load seasons
        const seasonsResp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}/api/players/${playerId}/seasons`);
        if (seasonsResp.ok && mounted) {
          const seasonsData = await seasonsResp.json();
          setSeasons(seasonsData?.seasons || []);
        }
      } catch (error) {
        console.error('Error loading player data:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => { mounted = false };
  }, [playerId]);

  if (!playerId) return null;

  const displayName = playerName || player?.nickname || `${player?.firstName || ''} ${player?.lastName || ''}`.trim() || 'Játékos';
  const avatar = playerImage || stats?.playerImage || player?.image || '/uploads/player-images/default.png';
  const fullImageUrl = avatar.startsWith('http') ? avatar : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}${avatar}`;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b1221] rounded-2xl border-2 border-[#ff5c1a] max-w-4xl w-full my-auto max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-[#0b1221] border-b border-[#ff5c1a]/30 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <h3 className={`${bebasNeue.className} text-white text-xl sm:text-2xl`}>Játékos Profil</h3>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white text-2xl sm:text-3xl leading-none flex-shrink-0 ml-2"
          >
            ×
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-10 w-10 rounded-full border-4 border-[#ff5c1a] border-t-transparent animate-spin" />
            </div>
          ) : (
            <>
              {/* Player Header */}
              <div className="bg-[#0b1221]/90 rounded-2xl border border-[#ff5c1a]/30 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                  <div className="h-20 w-20 sm:h-28 sm:w-28 rounded-full overflow-hidden border-4 border-[#ff5c1a]/70 shadow-lg shadow-[#ff5c1a]/20 flex-shrink-0">
                    <Image 
                      src={fullImageUrl} 
                      alt={displayName} 
                      width={112} 
                      height={112} 
                      className="object-cover h-full w-full" 
                    />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className={`${bebasNeue.className} text-2xl sm:text-3xl text-white`}>
                      {displayName}
                    </div>
                    {player?.nickname && (
                      <div className="text-[#ff5c1a] text-sm mt-1">{player.nickname}</div>
                    )}
                    {player?.email && (
                      <div className="text-white/80 text-sm mt-2 break-all">{player.email}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-black/30 rounded-xl p-4 border border-[#ff5c1a]/30">
                <h2 className="text-white font-semibold mb-4">Statisztikák (idei szezon)</h2>
                {!stats ? (
                  <div className="text-white/60 text-sm">Nincs statisztikai adat</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-black/40 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-400">Összes dobás</div>
                      <div className="text-white text-lg sm:text-xl font-bold">{stats.totalThrows || 0}</div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-400">Találatok</div>
                      <div className="text-green-400 text-lg sm:text-xl font-bold">{stats.hits || 0}</div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-400">Találati %</div>
                      <div className="text-white text-lg sm:text-xl font-bold">{stats.hitPercentage || 0}%</div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-400">MVP jelölések</div>
                      <div className="text-[#ff5c1a] text-lg sm:text-xl font-bold">{stats.nominatedCount || 0}</div>
                    </div>
                    {stats.gamedayMvp && stats.gamedayMvp.total > 0 && (
                      <div className="bg-black/40 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-400">Gameday MVP</div>
                        <div className="text-[#FFDB11] text-lg sm:text-xl font-bold">{stats.gamedayMvp.total || 0}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          ({stats.gamedayMvp.normal || 0} normál, {stats.gamedayMvp.finale || 0} finálé)
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Seasons Table */}
              <div className="bg-[#0b1221]/90 rounded-2xl border border-[#ff5c1a]/30">
                <div className="px-4 sm:px-6 py-4 border-b border-[#ff5c1a]/20 flex items-center gap-2">
                  <span className="text-[#ff5c1a]">🏆</span>
                  <span className="text-white font-semibold">SZEZONOK</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm text-white/90 min-w-[600px]">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="px-3 sm:px-6 py-3 text-left">Szezon</th>
                        <th className="px-3 sm:px-6 py-3 text-left">Csapat</th>
                        <th className="px-3 sm:px-6 py-3 text-left">Helyezés</th>
                        <th className="px-3 sm:px-6 py-3 text-left">Meccsek</th>
                        <th className="px-3 sm:px-6 py-3 text-left">Győzelmek</th>
                        <th className="px-3 sm:px-6 py-3 text-left">Győzelmi arány</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seasons.length === 0 ? (
                        <tr className="border-t border-white/10">
                          <td className="px-3 sm:px-6 py-3" colSpan={7}>Nincs szezon adat</td>
                        </tr>
                      ) : seasons.map((s, idx) => (
                        <tr key={idx} className="border-t border-white/10">
                          <td className="px-3 sm:px-6 py-3 font-medium">{s.seasonName}</td>
                          <td className="px-3 sm:px-6 py-3">{s.team}</td>
                          <td className="px-3 sm:px-6 py-3">{s.position || '-'}</td>
                          <td className="px-3 sm:px-6 py-3">{s.games}</td>
                          <td className="px-3 sm:px-6 py-3">{s.wins}</td>
                          <td className="px-3 sm:px-6 py-3">{Math.round((s.winRate || 0) * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Per-season player stats */}
              <div className="bg-[#0b1221]/90 rounded-2xl border border-[#ff5c1a]/30">
                <div className="px-4 sm:px-6 py-4 border-b border-[#ff5c1a]/20 flex items-center gap-2">
                  <span className="text-[#ff5c1a]">📊</span>
                  <span className="text-white font-semibold text-sm sm:text-base">SZEZON DOBÁS STATISZTIKÁK</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm text-white/90 min-w-[400px]">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="px-3 sm:px-6 py-3 text-left">Szezon</th>
                        <th className="px-3 sm:px-6 py-3 text-left">Dobások</th>
                        <th className="px-3 sm:px-6 py-3 text-left">Találatok</th>
                        <th className="px-3 sm:px-6 py-3 text-left">Találati %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seasons.length === 0 ? (
                        <tr className="border-t border-white/10">
                          <td className="px-3 sm:px-6 py-3" colSpan={4}>Nincs adat</td>
                        </tr>
                      ) : seasons.map((s, idx) => (
                        <tr key={idx} className="border-t border-white/10">
                          <td className="px-3 sm:px-6 py-3 font-medium">{s.seasonName}</td>
                          <td className="px-3 sm:px-6 py-3">{s.playerThrows || 0}</td>
                          <td className="px-3 sm:px-6 py-3 text-green-400">{s.playerHits || 0}</td>
                          <td className="px-3 sm:px-6 py-3">{Math.round(((s.playerHitRate || 0) * 100))}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


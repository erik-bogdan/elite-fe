"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Bebas_Neue } from 'next/font/google';
import { authClient } from '@/app/lib/auth-client';
import { useGetMyLeagueQuery } from '@/lib/features/apiSlice';
import { toast } from 'sonner';

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });

export default function ProfilePage() {
  const [stats, setStats] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [avatar, setAvatar] = useState<string>("");
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const { data: my } = useGetMyLeagueQuery();
  const [showEdit, setShowEdit] = useState(false);
  const [seasons, setSeasons] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await authClient.getSession();
        if (mounted) {
          setUser(data?.user || null);
          setAvatar(data?.user?.image || '');
        }
      } catch {}
      
      // Load stats and player image
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_HOST || 'http://localhost:3555'}/api/user/profile/stats`, { credentials: 'include' });
        if (resp.ok && mounted) {
          const playerData = await resp.json();
          setStats(playerData);
          // Update avatar if we have player image
          if (playerData.playerImage) {
            setAvatar(playerData.playerImage);
          }
        }
      } catch {}
      
      // Load seasons
      try {
        const resp2 = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_HOST || 'http://localhost:3555'}/api/user/profile/seasons`, { credentials: 'include' });
        if (resp2.ok && mounted) {
          const d = await resp2.json();
          setSeasons(d?.seasons || []);
        }
      } catch {}
    })();
    return () => { mounted = false };
  }, []);

  // in-modal handlers are defined inline in modal

  const displayName = (user?.nickname || user?.name || '').trim();

  return (
    <>
    <div className="min-h-screen py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header card (admin player look) - Responsive */}
        <div className="bg-[#0b1221]/90 rounded-2xl border border-[#ff5c1a]/30 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="h-20 w-20 sm:h-28 sm:w-28 rounded-full overflow-hidden border-4 border-[#ff5c1a]/70 shadow-lg shadow-[#ff5c1a]/20 flex-shrink-0">
              <Image src={avatar || '/elitelogo.png'} alt="avatar" width={112} height={112} className="object-cover h-full w-full" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className={`${bebasNeue.className} text-2xl sm:text-3xl text-white`}>{displayName || 'Névtelen Játékos'}</div>
              <div className="text-[#ff5c1a] text-sm">{user?.nickname || ''}</div>
              <div className="text-white/80 text-sm mt-2 break-all">{user?.email || ''}</div>
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <button onClick={() => setShowEdit(true)} className="px-4 py-2 rounded bg-[#ff5c1a] hover:bg-[#e54d1a] text-white font-semibold text-sm w-full sm:w-auto">Profil szerkesztése</button>
            </div>
          </div>
        </div>

        {/* Statistics block (moved above seasons) - Responsive */}
        <div className="bg-black/30 rounded-xl p-4 border border-[#ff5c1a]/30 mb-6">
            <h2 className="text-white font-semibold mb-4">Statisztikák (idei szezon)</h2>
            {!stats ? (
              <div className="text-white/60 text-sm">Betöltés...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-black/40 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400">Összes dobás</div>
                  <div className="text-white text-lg sm:text-xl font-bold">{stats.totalThrows}</div>
                </div>
                <div className="bg-black/40 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400">Találatok</div>
                  <div className="text-green-400 text-lg sm:text-xl font-bold">{stats.hits}</div>
                </div>
                <div className="bg-black/40 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400">Találati %</div>
                  <div className="text-white text-lg sm:text-xl font-bold">{stats.hitPercentage}%</div>
                </div>
                <div className="bg-black/40 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400">MVP jelölések</div>
                  <div className="text-[#ff5c1a] text-lg sm:text-xl font-bold">{stats.nominatedCount}</div>
                </div>
              </div>
            )}
          </div>

        {/* Seasons block (admin style) - Responsive */}
        <div className="bg-[#0b1221]/90 rounded-2xl border border-[#ff5c1a]/30">
          <div className="px-4 sm:px-6 py-4 border-b border-[#ff5c1a]/20 flex items-center gap-2">
            <span className="text-[#ff5c1a]">🏆</span>
            <span className="text-white font-semibold">SZEZONOK</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-white/90 min-w-[600px]">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-3 sm:px-6 py-3 text-left">Season</th>
                  <th className="px-3 sm:px-6 py-3 text-left">Team</th>
                  <th className="px-3 sm:px-6 py-3 text-left hidden sm:table-cell">Csapatkapitány</th>
                  <th className="px-3 sm:px-6 py-3 text-left">Position</th>
                  <th className="px-3 sm:px-6 py-3 text-left">Games</th>
                  <th className="px-3 sm:px-6 py-3 text-left">Wins</th>
                  <th className="px-3 sm:px-6 py-3 text-left">Win Rate</th>
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
                    <td className="px-3 sm:px-6 py-3 hidden sm:table-cell">{s.isCaptain ? 'Igen' : 'Nem'}</td>
                    <td className="px-3 sm:px-6 py-3">{s.position || '-'}</td>
                    <td className="px-3 sm:px-6 py-3">{s.games}</td>
                    <td className="px-3 sm:px-6 py-3">{s.wins}</td>
                    <td className="px-3 sm:px-6 py-3">{(Math.round((s.winRate||0)*100))}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-season player aggregated stats - Responsive */}
        <div className="bg-[#0b1221]/90 rounded-2xl border border-[#ff5c1a]/30 mt-6">
          <div className="px-4 sm:px-6 py-4 border-b border-[#ff5c1a]/20 flex items-center gap-2">
            <span className="text-[#ff5c1a]">📊</span>
            <span className="text-white font-semibold text-sm sm:text-base">SZEZON DOBÁS STATISZTIKÁK</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-white/90 min-w-[400px]">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-3 sm:px-6 py-3 text-left">Season</th>
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
                    <td className="px-3 sm:px-6 py-3">{Math.round(((s.playerHitRate||0)*100))}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

      {showEdit && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1221] rounded-2xl border-2 border-[#ff5c1a] max-w-xl w-full p-4 sm:p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-white font-semibold text-base sm:text-lg">Profil szerkesztése</h3>
              <button onClick={() => setShowEdit(false)} className="text-white/80 hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-6">
              {/* Password Change Section */}
              <div className="space-y-4">
                <h4 className="text-white font-medium text-sm">Jelszó módosítása</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-white/80 text-xs mb-1 block">Jelenlegi jelszó</label>
                    <input 
                      type="password" 
                      value={pwd.currentPassword} 
                      onChange={e => setPwd(p => ({ ...p, currentPassword: e.target.value }))} 
                      className="w-full bg-black/50 border border-[#ff5c1a]/30 rounded-lg px-4 py-3 text-white text-sm focus:border-[#ff5c1a] focus:outline-none transition-colors" 
                      placeholder="Írd be a jelenlegi jelszavad"
                    />
                  </div>
                  <div>
                    <label className="text-white/80 text-xs mb-1 block">Új jelszó</label>
                    <input 
                      type="password" 
                      value={pwd.newPassword} 
                      onChange={e => setPwd(p => ({ ...p, newPassword: e.target.value }))} 
                      className="w-full bg-black/50 border border-[#ff5c1a]/30 rounded-lg px-4 py-3 text-white text-sm focus:border-[#ff5c1a] focus:outline-none transition-colors" 
                      placeholder="Írd be az új jelszavad"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons - Responsive */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button 
                  onClick={() => setShowEdit(false)} 
                  className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium transition-colors w-full sm:w-auto"
                >
                  Mégse
                </button>
                <button 
                  onClick={async () => {
                    const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_HOST || 'http://localhost:3555'}/api/user/profile/password`, {
                      method: 'PUT', 
                      headers: { 'Content-Type': 'application/json' }, 
                      credentials: 'include', 
                      body: JSON.stringify(pwd)
                    });
                    if (resp.ok) { 
                      toast.success('Jelszó módosítva'); 
                      setPwd({ currentPassword: '', newPassword: '' }); 
                      setShowEdit(false); 
                    } else toast.error('Jelszó módosítás sikertelen');
                  }} 
                  className="px-6 py-2 rounded-lg bg-[#ff5c1a] hover:bg-[#e54d1a] text-white font-medium transition-colors w-full sm:w-auto"
                >
                  Mentés
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



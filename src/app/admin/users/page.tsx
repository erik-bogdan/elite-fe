"use client";

import { useEffect, useMemo, useState } from "react";
import { Bebas_Neue } from "next/font/google";
import { motion } from "framer-motion";
import { FiPlus, FiSearch, FiUsers, FiUserPlus, FiEdit2, FiLink, FiLink2, FiKey, FiMoreVertical } from "react-icons/fi";
import Link from "next/link";
import { useSearchPlayersQuery } from "@/lib/features/apiSlice";
import {
  useAdminGetUsersQuery,
  useAdminCreateUserMutation,
  useAdminUpdateUserMutation,
  useAdminLinkPlayerMutation,
  useAdminUnlinkPlayerMutation,
  useAdminSetPasswordMutation,
  useAdminSendSetPasswordLinkMutation,
} from "@/lib/features/apiSlice";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const { data, refetch } = useAdminGetUsersQuery({ page, limit: 50, q });
  const users = data?.users || [];
  const pagination = data?.pagination;

  const [createUser, { isLoading: creating }] = useAdminCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useAdminUpdateUserMutation();
  const [linkPlayer, { isLoading: linking }] = useAdminLinkPlayerMutation();
  const [unlinkPlayer, { isLoading: unlinking }] = useAdminUnlinkPlayerMutation();
  const [setPassword, { isLoading: settingPwd }] = useAdminSetPasswordMutation();
  const [sendSetPwd, { isLoading: sendingLink }] = useAdminSendSetPasswordLinkMutation();

  const [createForm, setCreateForm] = useState({ email: "", password: "", name: "", nickname: "", role: "user" });
  const [editForm, setEditForm] = useState({ name: "", nickname: "", role: "user" });
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ newPassword: "" });
  const [linkOpen, setLinkOpen] = useState(false);
  const [playerQuery, setPlayerQuery] = useState("");
  const { data: playerOptions } = useSearchPlayersQuery(playerQuery.trim().length >= 2 ? { q: playerQuery, onlyUnlinked: true } as any : (undefined as any), { skip: playerQuery.trim().length < 2 });
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");

  const [menuState, setMenuState] = useState<{ open: boolean; user: any | null; x: number; y: number }>({ open: false, user: null, x: 0, y: 0 });
  const openMenuFor = (u: any, ev: React.MouseEvent<HTMLButtonElement>) => {
    const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 224;
    const menuHeight = 160;
    const margin = 8;
    let top = rect.bottom + margin;
    let left = rect.right - menuWidth;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
    if (top + menuHeight > vh) top = rect.top - menuHeight - margin;
    if (left + menuWidth > vw) left = vw - menuWidth - margin;
    if (left < margin) left = margin;
    setMenuState({ open: true, user: u, x: left, y: top });
  };

  useEffect(() => { refetch(); }, [page, q, refetch]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`${bebasNeue.className} text-white text-3xl md:text-4xl`}>Felhasználók</h1>
          <p className="text-white/70 mt-2">Felhasználók kezelése, szerepkörök, játékoshoz kapcsolás</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="px-6 py-3 rounded-lg bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white font-semibold transition-colors flex items-center gap-2">
          <FiUserPlus className="w-5 h-5" /> Új felhasználó
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Keresés email alapján" className="w-full pl-10 pr-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white outline-none focus:border-[#ff5c1a]" />
        </div>
      </div>

      <div className="bg-black/30 border border-[#ff5c1a]/30 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#ff5c1a]/20 border-b border-[#ff5c1a]/30">
                <th className="px-6 py-4 text-left text-white font-semibold">Email</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Név</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Becenév</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Szerepkör</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Játékos</th>
                <th className="px-6 py-4 text-right text-white font-semibold">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white/90">{u.email}</td>
                  <td className="px-6 py-4 text-white/90">{u.name || '-'}</td>
                  <td className="px-6 py-4 text-white/90">{u.nickname || '-'}</td>
                  <td className="px-6 py-4 text-white/90">{u.role || 'user'}</td>
                  <td className="px-6 py-4 text-white/90">
                    {u.playerId ? (
                      <Link href={`/admin/players/${u.playerId}`} className="underline hover:text-white">
                        {`${u.playerFirstName || ''} ${u.playerLastName || ''}`.trim() || (u.playerNickname || '-')}
                      </Link>
                    ) : (
                      <span className="text-white/50">Nincs csatolt játékos</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={(e) => openMenuFor(u, e)} className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white inline-flex items-center">
                      <FiMoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/50 text-lg">Nincsenek felhasználók</div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsCreateOpen(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-md rounded-2xl bg-[#001b45] border border-[#ff5c1a]/40 p-6 shadow-2xl">
            <h3 className={`${bebasNeue.className} text-2xl text-white mb-4`}>Új felhasználó</h3>
            <div className="space-y-3">
              <input value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="Email" className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white outline-none" />
              <input value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Jelszó" className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white outline-none" />
              <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Név" className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white outline-none" />
              <input value={createForm.nickname} onChange={(e) => setCreateForm({ ...createForm, nickname: e.target.value })} placeholder="Becenév" className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white outline-none" />
              <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white outline-none">
                <option value="user" className="text-black">user</option>
                <option value="admin" className="text-black">admin</option>
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setIsCreateOpen(false)} className="px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white">Mégse</button>
              <button onClick={async () => { await createUser(createForm).unwrap(); setIsCreateOpen(false); refetch(); }} className="px-4 py-2 rounded-lg bg-[#ff5c1a] text-white">Létrehozás</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Floating actions menu (outside table, fixed) */}
      {menuState.open && menuState.user && (
        <div className="fixed inset-0 z-50" onClick={() => setMenuState({ open: false, user: null, x: 0, y: 0 })}>
          <div className="absolute inset-0" />
          <div
            className="fixed w-56 bg-[#001b45] border border-white/10 rounded-lg shadow-2xl"
            style={{ top: menuState.y, left: menuState.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => { const u = menuState.user; setEditingUser(u); setEditForm({ name: u.name || '', nickname: u.nickname || '', role: u.role || 'user' }); setIsEditOpen(true); setMenuState({ open: false, user: null, x: 0, y: 0 }); }} className="w-full text-left px-4 py-2 hover:bg-white/10 text-white flex items-center gap-2"><FiEdit2 /> Szerkesztés</button>
            <button onClick={() => { const u = menuState.user; setEditingUser(u); setPwdOpen(true); setPwdForm({ newPassword: '' }); setMenuState({ open: false, user: null, x: 0, y: 0 }); }} className="w-full text-left px-4 py-2 hover:bg-white/10 text-white flex items-center gap-2"><FiKey /> Jelszó módosítás</button>
            {menuState.user.playerId ? (
              <button onClick={async () => { const u = menuState.user; await unlinkPlayer({ userId: u.id, playerId: u.playerId }).unwrap(); setMenuState({ open: false, user: null, x: 0, y: 0 }); refetch(); }} className="w-full text-left px-4 py-2 hover:bg-white/10 text-white flex items-center gap-2"><FiLink2 /> Játékos leválasztása</button>
            ) : (
              <button onClick={() => { const u = menuState.user; setEditingUser(u); setLinkOpen(true); setPlayerQuery(''); setSelectedPlayerId(''); setMenuState({ open: false, user: null, x: 0, y: 0 }); }} className="w-full text-left px-4 py-2 hover:bg-white/10 text-white flex items-center gap-2"><FiLink /> Játékos csatolása</button>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsEditOpen(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-md rounded-2xl bg-[#001b45] border border-[#ff5c1a]/40 p-6 shadow-2xl">
            <h3 className={`${bebasNeue.className} text-2xl text-white mb-4`}>Felhasználó szerkesztése</h3>
            <div className="space-y-3">
              <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Név" className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white outline-none" />
              <input value={editForm.nickname} onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })} placeholder="Becenév" className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white outline-none" />
              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white outline-none">
                <option value="user" className="text-black">user</option>
                <option value="admin" className="text-black">admin</option>
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setIsEditOpen(false)} className="px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white">Mégse</button>
              <button onClick={async () => { await updateUser({ id: editingUser.id, ...editForm }).unwrap(); setIsEditOpen(false); refetch(); }} className="px-4 py-2 rounded-lg bg-[#ff5c1a] text-white">Mentés</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Password Modal */}
      {pwdOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPwdOpen(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-md rounded-2xl bg-[#001b45] border border-[#ff5c1a]/40 p-6 shadow-2xl">
            <h3 className={`${bebasNeue.className} text-2xl text-white mb-4`}>Jelszó módosítása</h3>
            <div className="space-y-3">
              <input value={pwdForm.newPassword} onChange={(e) => setPwdForm({ newPassword: e.target.value })} placeholder="Új jelszó" className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white outline-none" />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setPwdOpen(false)} className="px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white">Mégse</button>
              <button onClick={async () => { const res: any = await setPassword({ userId: editingUser.id, newPassword: pwdForm.newPassword }).unwrap().catch(() => null); if (!res || res.error) { await sendSetPwd({ userId: editingUser.id }).unwrap(); } setPwdOpen(false); }} className="px-4 py-2 rounded-lg bg-[#ff5c1a] text-white">Mentés</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Link Player Modal */}
      {linkOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setLinkOpen(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-lg rounded-2xl bg-[#001b45] border border-[#ff5c1a]/40 p-6 shadow-2xl">
            <h3 className={`${bebasNeue.className} text-2xl text-white mb-4`}>Játékos csatolása</h3>
            <div className="space-y-3">
              <input value={playerQuery} onChange={(e) => setPlayerQuery(e.target.value)} placeholder="Kezdj el gépelni (min. 2 karakter)" className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white outline-none" />
              {playerQuery.trim().length >= 2 && (
                <div className="max-h-64 overflow-auto rounded-lg border border-white/10 divide-y divide-white/10">
                  {(playerOptions || []).filter((p: any) => !p.userId).map((p: any) => (
                    <button key={p.id} onClick={() => setSelectedPlayerId(p.id)} className={`w-full text-left px-3 py-2 hover:bg-white/10 text-white ${selectedPlayerId === p.id ? 'bg-white/10' : ''}`}>
                      {(p.firstName || '')} {(p.lastName || '')} {p.nickname ? `(${p.nickname})` : ''} {p.email ? `- ${p.email}` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setLinkOpen(false)} className="px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white">Mégse</button>
              <button disabled={!selectedPlayerId} onClick={async () => { await linkPlayer({ userId: editingUser.id, playerId: selectedPlayerId }).unwrap(); setLinkOpen(false); refetch(); }} className="px-4 py-2 rounded-lg bg-[#ff5c1a] text-white disabled:opacity-50">Csatolás</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}



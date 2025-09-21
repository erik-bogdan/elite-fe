"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bebas_Neue } from "next/font/google";
import { Switch } from "@/components/ui/switch";
import { FiUploadCloud, FiEdit2, FiSave } from "react-icons/fi";
import { toast } from "sonner";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

type PlayerRow = {
    id: string;
    fullName: string;
    nickname: string;
    email: string;
    shirtSize?: string;
};

import { useGetTeamPlayersBySeasonQuery, useSearchPlayersQuery, useConfirmApplyMutation, useRenameApplyMutation, useLazyCheckPlayerEmailQuery, useGetTeamByIdQuery, useUploadTeamLogoMutation } from "@/lib/features/apiSlice";
import { useSession } from "@/hooks/useAuth";

export default function StepEnrollment({ onBack, defaultTeamName, teamId, seasonId, leagueTeamId, onFinalized, championshipName }: { onBack: () => void; defaultTeamName?: string; teamId?: string; seasonId?: string; leagueTeamId?: string; onFinalized?: () => void; championshipName?: string }) {
    const [players, setPlayers] = useState<PlayerRow[]>([]);
    const [lockedCaptainId, setLockedCaptainId] = useState<string | null>(null);
    const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
    const [editingEmailValue, setEditingEmailValue] = useState<string>("");

    const [teamName, setTeamName] = useState<string>(defaultTeamName || "Csapat neve");
    const [isEditingName, setIsEditingName] = useState<boolean>(false);
    const [logoSrc, setLogoSrc] = useState<string>("/elitelogo.png");
    const userChangedLogoRef = useRef<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const selectedLogoFileRef = useRef<File | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [nickname, setNickname] = useState("");
    const [email, setEmail] = useState("");
    const [search, setSearch] = useState("");
    const { data: existingPlayers } = useSearchPlayersQuery({ q: search, teamId, seasonId }, { skip: !search || search.length < 2 });
    const [captainId, setCaptainId] = useState<string | null>(null);

    const handleRemove = (id: string) => {
        setPlayers((prev) => prev.filter((p) => p.id !== id));
        if (captainId === id) setCaptainId(null);
    };

    const handleAdd = () => {
        if (players.length >= 3) return;
        const trimmedFirst = firstName.trim();
        const trimmedLast = lastName.trim();
        const trimmedNick = nickname.trim();
        const trimmedEmail = email.trim();
        if (!trimmedFirst || !trimmedLast || !trimmedNick || !trimmedEmail) return;
        const newPlayer: PlayerRow = {
            id: `client-${Date.now()}`,
            fullName: `${trimmedFirst} ${trimmedLast}`,
            nickname: trimmedNick,
            email: trimmedEmail,
            shirtSize: 'L',
        };
        setPlayers((prev) => [...prev, newPlayer]);
        setIsModalOpen(false);
        setFirstName("");
        setLastName("");
        setNickname("");
        setEmail("");
    };

    const handlePickExisting = (p: any) => {
        if (players.length >= 3) return;
        const label = `${p.lastName ?? ''} ${p.firstName ?? ''}`.trim();
        const newPlayer: PlayerRow = {
            id: String(p.id),
            fullName: label,
            nickname: p.nickname ?? '',
            email: p.email ?? '',
            shirtSize: p.shirtSize || 'L',
        };
        setPlayers(prev => {
            if (prev.find(x => x.id === newPlayer.id)) return prev; // no duplicates
            return [...prev, newPlayer];
        });
        setIsModalOpen(false);
        setSearch("");
    };

    // Load current roster from backend for team+season
    const { data: roster } = useGetTeamPlayersBySeasonQuery({ teamId: teamId || '', seasonId: seasonId || '' }, { skip: !teamId || !seasonId });
    const initializedRef = useRef(false);
    if (!initializedRef.current && roster && roster.length >= 0) {
        initializedRef.current = true;
        setPlayers(roster.map((p: any) => ({
            id: String(p.id),
            fullName: `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || p.nickname,
            nickname: p.nickname,
            email: p.email ?? '',
            shirtSize: p.shirtSize || 'L',
        })));
        const captain = roster.find((p: any) => p.captain);
        const capId = captain ? String(captain.id) : null;
        setCaptainId(capId);
        setLockedCaptainId(capId);
    }

    const handleLogoClick = () => {
        fileInputRef.current?.click();
    };

    const handleLogoChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setLogoSrc(url);
        userChangedLogoRef.current = true;
        selectedLogoFileRef.current = file;
    };

    // Load team logo as default if available
    const { data: team } = useGetTeamByIdQuery(teamId || "", { skip: !teamId });
    useEffect(() => {
        if (!userChangedLogoRef.current && team && team.logo) {
            const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
            const absolute = team.logo.startsWith('http') ? team.logo : `${backend}${team.logo}`;
            setLogoSrc(absolute);
        }
    }, [team]);

    const [confirmApply, { isLoading: isConfirming }] = useConfirmApplyMutation();
    const [renameApply, { isLoading: isRenaming }] = useRenameApplyMutation();
    const [uploadLogo] = useUploadTeamLogoMutation();
    const [triggerCheckEmail] = useLazyCheckPlayerEmailQuery();
    const { data: session } = useSession();

    const handleFinalize = async () => {
        if (players.length < 2 || !leagueTeamId) return;
        // Block if any player without email
        const missing = players.filter(p => !String(p.email || '').trim());
        if (missing.length > 0) {
            toast.error("Minden játékoshoz szükséges e-mail cím megadása.");
            return;
        }
        const bodyPlayers = players.map(p => ({ id: /^[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}$/.test(p.id) ? p.id : undefined, clientId: p.id.startsWith('client-') ? p.id : undefined, fullName: p.fullName, firstName: p.fullName.split(' ')[0], lastName: p.fullName.split(' ').slice(1).join(' '), nickname: p.nickname, email: p.email, shirtSize: p.shirtSize }));
        const isRenamed = teamName.trim() !== (defaultTeamName || '').trim();
        const selected = captainId ? players.find(p => p.id === captainId) : undefined;
        const captainUuid = /^[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}$/.test(captainId || '') ? captainId : undefined;
        const captainClientId: string | undefined = captainUuid ? undefined : (selected && selected.id.startsWith('client-') ? selected.id : undefined);
        const payloadCaptainId: string | undefined = captainUuid ?? undefined;
        const payloadCaptainClientId: string | undefined = captainClientId ?? undefined;
        const ltId: string = leagueTeamId as string;
        try {
            if (isRenamed) {
                const res = await renameApply({ leagueTeamId: ltId, newTeamName: teamName.trim(), players: bodyPlayers, captainId: payloadCaptainId, captainClientId: payloadCaptainClientId }).unwrap();
                // If user picked a new logo, upload it to the NEW team
                if (selectedLogoFileRef.current && res?.newTeamId) {
                    try { await uploadLogo({ id: String(res.newTeamId), file: selectedLogoFileRef.current }).unwrap(); } catch {}
                }
            } else {
                const res = await confirmApply({ leagueTeamId: ltId, players: bodyPlayers, captainId: payloadCaptainId, captainClientId: payloadCaptainClientId }).unwrap();
                // If only logo change, upload to CURRENT team
                if (selectedLogoFileRef.current && teamId) {
                    try { await uploadLogo({ id: String(teamId), file: selectedLogoFileRef.current }).unwrap(); } catch {}
                }
            }
            onFinalized?.();
        } catch (e) {
            const anyErr: any = e;
            const msg = anyErr?.data?.message || anyErr?.error || anyErr?.message || "Ismeretlen hiba történt";
            toast.error(`Hiba a nevezés küldésekor: ${msg}`);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto mt-6">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-black/30 border border-[#ff5c1a]/50 rounded-2xl p-6 md:p-10"
            >
                    <div className="flex items-center gap-4 md:gap-6 mb-6">
                    <div className="relative group w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border border-white/10 bg-black/40 cursor-pointer" onClick={handleLogoClick}>
                        <Image src={logoSrc} alt="Csapat logó" fill sizes="80px" className="object-contain p-2" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <FiUploadCloud className="w-7 h-7 text-white" />
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </div>
                    <div className="flex flex-col">
                        {!isEditingName ? (
                            <div className="flex items-center gap-2">
                                <div className={`${bebasNeue.className} text-white text-2xl md:text-4xl`}>{teamName}</div>
                                <button
                                    type="button"
                                    onClick={() => setIsEditingName(true)}
                                    className="p-2 rounded-md hover:bg-white/10 text-white/90"
                                    aria-label="Csapatnév szerkesztése"
                                    title="Szerkesztés"
                                >
                                    <FiEdit2 className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <input
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    className={`${bebasNeue.className} text-white text-xl md:text-3xl px-3 py-2 rounded-lg bg-black/40 border border-white/10 outline-none focus:border-[#ff5c1a]`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsEditingName(false)}
                                    className="p-2 rounded-md bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white"
                                    aria-label="Mentés"
                                    title="Mentés"
                                >
                                    <FiSave className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                        <div className="text-white/80">{championshipName || "ELITE BEERPONG 1. · 2025/2026"} <span className="text-[#FFDB11]">ŐSZ</span></div>
                    </div>
                    <div className="ml-auto">
                        <motion.button
                            whileHover={{ scale: players.length >= 3 ? 1 : 1.04 }}
                            whileTap={{ scale: players.length >= 3 ? 1 : 0.98 }}
                            onClick={() => players.length < 3 && setIsModalOpen(true)}
                            className="px-4 py-2 rounded-lg bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white font-semibold shadow-lg shadow-[#ff5c1a]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={players.length >= 3}
                        >
                            Játékos hozzáadása
                        </motion.button>
                    </div>
                </div>

                <div className="mb-3 text-white/70 text-sm md:text-base">Logócseréhez kattints a mostani logóra!</div>

                {/* Mobile-friendly player list: horizontal scroll + stacked cards on very small screens */}
                <div className="rounded-xl border border-white/10 bg-black/40 overflow-x-auto">
                    <div className="hidden">
                        <div className="px-4 py-3 text-sm md:text-base text-[#000]">Teljes név</div>
                        <div className="px-4 py-3 text-sm md:text-base text-[#000]">Becenév</div>
                        <div className="px-4 py-3 text-sm md:text-base text-[#000]">Email</div>
                        <div className="px-4 py-3 text-sm md:text-base text-[#000]">Pólóméret</div>
                        <div className="px-4 py-3 text-sm md:text-base text-[#000]">Csapatkapitány</div>
                        <div className="px-4 py-3 text-sm md:text-base text-[#000] text-right">Művelet</div>
                    </div>
                    <div className="divide-y divide-white/10 relative min-w-[820px] md:min-w-0" >
                        <AnimatePresence initial={false}>
                            {players.map((p) => (
                                <motion.div
                                    key={p.id}
                                    layout
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 6 }}
                                    transition={{ duration: 0.18 }}
                                    className="hidden"
                                >
                                    <div className="text-white text-sm md:text-base">{p.fullName}</div>
                                    <div className="text-white text-sm md:text-base">{p.nickname}</div>
                                    <div className="text-white text-sm md:text-base flex items-center gap-2 min-w-0">
                                        {editingEmailId === p.id ? (
                                            <div className="flex items-center gap-2 w-full min-w-0">
                                                <input
                                                    type="email"
                                                    value={editingEmailValue}
                                                    onChange={(e) => setEditingEmailValue(e.target.value)}
                                                    className="flex-1 px-3 py-1 rounded-md bg-black/40 border border-white/10 text-white outline-none focus:border-[#ff5c1a] min-w-0"
                                                    placeholder="email@pelda.hu"
                                                />
                                                <button
                                                    type="button"
                                                    className="px-3 py-1 rounded-md bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white"
                                                    onClick={async () => {
                                                        const val = editingEmailValue.trim();
                                                        if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { toast.error('Érvénytelen e-mail cím'); return; }
                                                        try {
                                                            const me = session?.user?.email as string | undefined;
                                                            if (me && val.toLowerCase() === me.toLowerCase()) {
                                                                // Allow captain's own email (already exists by definition)
                                                            } else {
                                                                const res = await triggerCheckEmail(val).unwrap();
                                                                if (res.existsInPlayers || res.existsInUsers) {
                                                                    toast.error('Ez az e-mail cím már használatban van');
                                                                    return;
                                                                }
                                                            }
                                                        } catch {}
                                                        setPlayers(prev => prev.map(x => x.id === p.id ? { ...x, email: val } : x));
                                                        setEditingEmailId(null);
                                                        setEditingEmailValue("");
                                                    }}
                                                >
                                                    Mentés
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span>{p.email || <span className="text-white/50">Nincs megadva</span>}</span>
                                                {!p.email && p.id !== lockedCaptainId && (
                                                    <button
                                                        type="button"
                                                        className="p-1 rounded-md hover:bg-white/10 text-white/90"
                                                        onClick={() => { setEditingEmailId(p.id); setEditingEmailValue(p.email || ""); }}
                                                        aria-label="Email szerkesztése"
                                                        title="Email szerkesztése"
                                                    >
                                                        <FiEdit2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <div>
                                        <select
                                            value={p.shirtSize || ''}
                                            onChange={(e) => setPlayers(prev => prev.map(x => x.id === p.id ? { ...x, shirtSize: e.target.value } : x))}
                                            className="w-full px-3 py-2 rounded-md bg-black/40 border border-white/10 text-white"
                                        >
                                            <option value="" className="text-black">–</option>
                                            <option value="S" className="text-black">S</option>
                                            <option value="M" className="text-black">M</option>
                                            <option value="L" className="text-black">L</option>
                                            <option value="XL" className="text-black">XL</option>
                                            <option value="XXL" className="text-black">XXL</option>
                                            <option value="XXXL" className="text-black">XXXL</option>
                                            <option value="XXXXL" className="text-black">XXXXL</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2 flex justify-center">
                                        <Switch
                                            checked={captainId === p.id}
                                            onCheckedChange={(val) => setCaptainId(val ? p.id : (captainId === p.id ? null : captainId))}
                                            aria-label="Csapatkapitány kijelölése"
                                        />
                                        <span className="text-white/80 text-sm">{captainId === p.id ? "" : ""}</span>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(p.id)}
                                            className="p-2 rounded-md hover:bg-white/10 text-red-400 hover:text-red-300 transition-colors"
                                            aria-label="Törlés"
                                            title="Törlés"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                <path d="M9 3a1 1 0 0 0-1 1v1H5.5a1 1 0 1 0 0 2H6v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7h.5a1 1 0 1 0 0-2H16V4a1 1 0 0 0-1-1H9zm2 2h2v1h-2V5zM8 7h10v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V7z" />
                                                <path d="M10 9a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0v-7a1 1 0 0 1 1-1zm5 0a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0v-7a1 1 0 0 1 1-1z" />
                                            </svg>
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {players.length === 0 && (
                            <div className="px-4 py-4 text-white/70">Nincs megjeleníthető játékos.</div>
                        )}
                    </div>
                    {/* Stacked cards for xs screens */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3">
                        {players.map((p) => (
                            <div key={p.id} className="rounded-lg border border-white/10 bg-black/30 p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-white font-semibold">{p.fullName}</div>
                                    <button type="button" onClick={() => handleRemove(p.id)} className="p-2 rounded-md hover:bg-white/10 text-red-400 hover:text-red-300 transition-colors" aria-label="Törlés" title="Törlés">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M9 3a1 1 0 0 0-1 1v1H5.5a1 1 0 1 0 0 2H6v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7h.5a1 1 0 1 0 0-2H16V4a1 1 0 0 0-1-1H9zm2 2h2v1h-2V5zM8 7h10v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V7z"/><path d="M10 9a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0v-7a1 1 0 0 1 1-1zm5 0a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0v-7a1 1 0 0 1 1-1z"/></svg>
                                    </button>
                                </div>
                                <div className="text-white/80">Becenév: <span className="text-white">{p.nickname || '—'}</span></div>
                                <div className="text-white/80 flex items-center gap-2">
                                    <span>Email:</span>
                                    {editingEmailId === p.id ? (
                                        <>
                                            <input type="email" value={editingEmailValue} onChange={(e) => setEditingEmailValue(e.target.value)} className="flex-1 px-3 py-1 rounded-md bg-black/40 border border-white/10 text-white outline-none focus:border-[#ff5c1a]" placeholder="email@pelda.hu" />
                                            <button type="button" className="px-3 py-1 rounded-md bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white" onClick={async () => { const val = editingEmailValue.trim(); if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { toast.error('Érvénytelen e-mail cím'); return; } try { const me = session?.user?.email as string | undefined; if (me && val.toLowerCase() === me.toLowerCase()) {} else { const res = await triggerCheckEmail(val).unwrap(); if (res.existsInPlayers || res.existsInUsers) { toast.error('Ez az e-mail cím már használatban van'); return; } } } catch {} setPlayers(prev => prev.map(x => x.id === p.id ? { ...x, email: val } : x)); setEditingEmailId(null); setEditingEmailValue(''); }}>Mentés</button>
                                        </>
                                    ) : (
                                        <>
                                            <span>{p.email || <span className="text-white/50">Nincs megadva</span>}</span>
                                            {!p.email && p.id !== lockedCaptainId && (
                                                <button type="button" className="p-1 rounded-md hover:bg-white/10 text-white/90" onClick={() => { setEditingEmailId(p.id); setEditingEmailValue(p.email || ''); }} aria-label="Email szerkesztése" title="Email szerkesztése"><FiEdit2 className="w-4 h-4" /></button>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <select value={p.shirtSize || ''} onChange={(e) => setPlayers(prev => prev.map(x => x.id === p.id ? { ...x, shirtSize: e.target.value } : x))} className="px-3 py-2 rounded-md bg-black/40 border border-white/10 text-white">
                                        <option value="" className="text-black">–</option>
                                        <option value="S" className="text-black">S</option>
                                        <option value="M" className="text-black">M</option>
                                        <option value="L" className="text-black">L</option>
                                        <option value="XL" className="text-black">XL</option>
                                        <option value="XXL" className="text-black">XXL</option>
                                        <option value="XXXL" className="text-black">XXXL</option>
                                        <option value="XXXXL" className="text-black">XXXXL</option>
                                    </select>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white/80 text-sm">Kapitány</span>
                                        <Switch checked={captainId === p.id} onCheckedChange={(val) => setCaptainId(val ? p.id : (captainId === p.id ? null : captainId))} aria-label="Csapatkapitány kijelölése" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-6 py-2 rounded-lg bg-black/40 border border-white/10 text-white hover:bg-black/50 transition-colors"
                    >
                        Vissza
                    </button>
                    <div className="flex items-center gap-3">
                        {players.length < 2 && (
                            <span className="text-white/70 text-sm">Minimum 2 játékos szükséges</span>
                        )}
                        {players.some(p => !String(p.email || '').trim()) && (
                            <span className="text-red-400 text-sm">Hiányzó e-mail cím(ek) a listában</span>
                        )}
                        <button
                            type="button"
                            disabled={players.length < 2 || isConfirming || isRenaming || players.some(p => !String(p.email || '').trim())}
                            className="px-6 py-2 rounded-lg bg-[#ff5c1a] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#ff7c3a] text-white transition-colors"
                            onClick={handleFinalize}
                        >
                            {isConfirming || isRenaming ? 'Küldés…' : 'Véglegesítés'}
                        </button>
                    </div>
                </div>
            </motion.div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setIsModalOpen(false)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                        className="relative z-10 w-full max-w-md rounded-2xl bg-[#001b45] border border-[#ff5c1a]/40 p-6 shadow-2xl"
                    >
                        <h3 className={`${bebasNeue.className} text-2xl text-white mb-4`}>Új játékos</h3>
                        {/* ELITE játékos keresése */}
                        <div className="mb-4">
                            <label className="block text-white/80 text-sm mb-1">ELITE játékos keresése</label>
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kezdj el gépelni..." className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white outline-none focus:border-[#ff5c1a]" />
                            {search.length >= 2 && (existingPlayers || []).length > 0 && (
                                <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-white/10 bg-black/60 divide-y divide-white/10">
                                    {(existingPlayers || []).filter((p: any) => !players.some(x => x.id === String(p.id))).map((p: any) => (
                                        <button key={p.id} onClick={() => handlePickExisting(p)} className="w-full text-left px-3 py-2 hover:bg-white/10 text-white">
                                            {(p.lastName || '')} {(p.firstName || '')} {p.nickname ? `(${p.nickname})` : ''} {p.email ? `- ${p.email}` : ''}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="text-white/80 text-sm  text-center my-6">vagy, ha nem találod, hozzáadhatsz új játékost</div>
                        {(search && (existingPlayers || []).length > 0) ? null : (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-white/80 text-sm mb-1">Keresztnév</label>
                                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white outline-none focus:border-[#ff5c1a]" />
                            </div>
                            <div>
                                <label className="block text-white/80 text-sm mb-1">Vezetéknév</label>
                                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white outline-none focus:border-[#ff5c1a]" />
                            </div>
                            <div>
                                <label className="block text-white/80 text-sm mb-1">Becenév</label>
                                <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white outline-none focus:border-[#ff5c1a]" />
                            </div>
                            <div>
                                <label className="block text-white/80 text-sm mb-1">Email</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white outline-none focus:border-[#ff5c1a]" />
                            </div>
                        </div>
                        )}
                        <div className="mt-5 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white hover:bg-black/50 transition-colors">Mégse</button>
                            <button disabled={players.length >= 3} onClick={handleAdd} className="px-4 py-2 rounded-lg bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white transition-colors disabled:opacity-50">Hozzáadás</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}



"use client";
import { Geist, Geist_Mono, Bebas_Neue } from "next/font/google";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeclineApplyMutation, useGetActiveInviteQuery } from "@/lib/features/apiSlice";
import Step2 from "./components/Step2";
import StepHistory from "./components/StepHistory";
import StepTop10 from "./components/StepTop10";
import StepMVPs from "./components/StepMVPs";
import StepSeason from "./components/StepSeason";
import { useGetChampionshipByIdQuery } from "@/lib/features/championship/championshipSlice";
import StepSchedule from "./components/StepSchedule";
import StepPrizes from "./components/StepPrizes";
import StepRegistration from "./components/StepRegistration";
import StepEnrollment from "./components/StepEnrollment";

const bebasNeue = Bebas_Neue({
    weight: "400",
    subsets: ["latin"],
});

export default function Page({ defaultTeamName, defaultIds, leagueTeamId, initialStatus }: { defaultTeamName?: string; defaultIds?: { teamId: string; seasonId: string }, leagueTeamId?: string; initialStatus?: string }) {
    const router = useRouter();
    const [teamName, setTeamName] = useState("");
    const [champ, setChamp] = useState<{ name?: string; subName?: string | null } | null>(null);
    const [players, setPlayers] = useState(["", "", ""]);
    const [submitted, setSubmitted] = useState(false);

    const handlePlayerChange = (index: number, value: string) => {
        setPlayers((prev) => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would send the data to your backend
        setSubmitted(true);
    };


    const [step, setStep] = useState<number>(0);
    const [finalized, setFinalized] = useState<boolean>(initialStatus === 'approved');
    const [declineOpen, setDeclineOpen] = useState<boolean>(false);
    const [declining, setDeclining] = useState<boolean>(false);
    const [declineError, setDeclineError] = useState<string>("");
    const [declineApply] = useDeclineApplyMutation();

    const { data: activeInvite, isLoading: isLoadingActiveInvite } = useGetActiveInviteQuery();
    const champId = activeInvite?.championship?.id as string | undefined;
    const { data: activeChamp } = useGetChampionshipByIdQuery(champId!, { skip: !champId });
    useEffect(() => {
        if (activeInvite?.championship) {
            setChamp({ name: activeInvite.championship.name, subName: activeInvite.championship.subName ?? null });
        }
    }, [activeInvite]);

    useEffect(() => {
        if (!isLoadingActiveInvite && activeInvite) {
            if ((activeInvite as any).accepted) {
                router.replace('/application');
                return;
            }
            if (!activeInvite.hasInvite || !activeInvite.leagueTeamId) {
                router.replace('/application');
            }
        }
    }, [activeInvite, isLoadingActiveInvite, router]);

    return (
        <div className={step === 0 ? "min-h-screen w-full flex flex-col items-center justify-center px-4 py-16" : "min-h-screen w-full flex flex-col items-center px-4 pb-24 pt-6 sm:pt-10 lg:pt-16 xl:pt-24 2xl:pt-28"}>
            {/* Floating hero animates to the top from step >= 1 and returns on last step */}
            <motion.div
              initial={false}
              animate={step === 0 || step === 9 ? { y: 0, scale: 1 } : { y: -30, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 170, damping: 22 }}
              className="w-full flex justify-center overflow-hidden"
            >
              {step === 9 && (
                <div className="absolute -mt-6 sm:-mt-8 md:-mt-10 lg:-mt-14 xl:-mt-16 2xl:-mt-20 flex flex-col items-center">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${bebasNeue.className} text-[#FFDB11] text-3xl md:text-5xl mb-3`}
                  >
                    VÁRUNK TÉGED!
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className={`${bebasNeue.className} text-white text-base sm:text-2xl md:text-3xl text-center px-4`}
                  >
                    REMÉLJÜK AZ IDEI ÉVBEN IS EGYÜTT JÁTSZUNK, VÁRJUK A NEVEZÉSED!
                  </motion.div>
                </div>
              )}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.05 } }
                }}
                className={`${bebasNeue.className} flex flex-col items-center justify-center leading-none ${step === 9 ? 'mt-24 md:mt-32 lg:mt-40 xl:mt-48' : ''}`}
              >
                <motion.div
                  variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 180, damping: 22 } } }}
                  className="text-[28px] sm:text-[44px] md:text-[64px]"
                >
                  ELITE BEERPONG
                </motion.div>

                <motion.div
                  variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 180, damping: 22, delay: 0.05 } } }}
                  className="flex text-[40px] sm:text-[64px] md:text-[90px]"
                >
                  <motion.div
                    variants={{ hidden: { y: 12, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 180, damping: 20 } } }}
                    className="mt-1"
                  >
                    <div className="text-[22px] sm:text-[36px] md:text-[54px]">XII.</div>
                    <div className="text-[10px] sm:text-[14px] md:text-[20px] ">SZEZON</div>
                  </motion.div>
                  <motion.div
                    variants={{ hidden: { y: 12, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 180, damping: 20, delay: 0.05 } } }}
                  >
                    2025 <span className="text-[#FFDB11]">ŐSZ</span>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
            <div className={step >= 1 ? 'w-full max-w-6xl px-2 sm:px-4 pb-16' : 'w-full justify-center items-center flex pb-12'}>
            {step === 0 && (
              <motion.button
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 180, damping: 20, delay: 0.25 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                className="mt-10 px-8 py-3 rounded-xl bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white font-bold shadow-lg shadow-[#ff5c1a]/30 transition-colors"
                onClick={() => setStep(1)}
              >
                Következő oldal
              </motion.button>
            )}

            {step === 1 && (
              <Step2 onBack={() => setStep(0)} onNext={() => setStep(2)} teamName={defaultTeamName} championshipName={champ?.name} subName={champ?.subName ?? null} />
            )}
            {step === 2 && (
              <StepHistory onBack={() => setStep(1)} onNext={() => setStep(3)} />
            )}
            {step === 3 && (
              <StepTop10 onBack={() => setStep(2)} onNext={() => setStep(4)} />
            )}
            {step === 4 && (
              <StepMVPs onBack={() => setStep(3)} onNext={() => setStep(5)} />
            )}
            {step === 5 && (
              <StepSeason
                onBack={() => setStep(4)}
                onNext={() => setStep(6)}
                gameDayCount={(activeChamp?.properties?.gameDays || []).filter((g: any) => g?.gameday).length}
                hasPlayoff={activeChamp?.properties?.hasPlayoff}
                elimination={activeChamp?.properties?.elimination}
              />
            )}
            {step === 6 && (
              <StepSchedule onBack={() => setStep(5)} onNext={() => setStep(7)} gameDays={activeChamp?.properties?.gameDays as any} />
            )}
            {step === 7 && (
              <StepPrizes
                onBack={() => setStep(6)}
                onNext={() => setStep(8)}
                championshipName={champ?.name}
                firstPrizeText={activeChamp?.properties?.nyeremeny_text as any}
                firstPrizeValue={activeChamp?.properties?.nyeremeny_value as any}
                secondPrizeText={activeChamp?.properties?.masodik_nyeremeny_text as any}
                secondPrizeValue={activeChamp?.properties?.masodik_nyeremeny_value as any}
              />
            )}
            {step === 8 && (
              <StepRegistration onBack={() => setStep(7)} onNext={() => setStep(9)}
                registrationClose={activeChamp?.properties?.registrationClose as any}
                regfee={activeChamp?.properties?.regfee as any}
                regfeeDueDate={activeChamp?.properties?.regfeeDueDate as any}
              />
            )}
            {step === 10 && !finalized && (
              <StepEnrollment onBack={() => setStep(9)} defaultTeamName={defaultTeamName} teamId={defaultIds?.teamId} seasonId={defaultIds?.seasonId} leagueTeamId={leagueTeamId} onFinalized={() => { setFinalized(true); setStep(11); }} championshipName={activeChamp?.name} />
            )}
            {step === 11 && (
              <div className="w-full max-w-4xl mx-auto mt-6">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-black/30 border border-[#ff5c1a]/50 rounded-2xl p-6 md:p-10 text-center">
                  <div className={`${bebasNeue.className} text-white text-2xl md:text-4xl mb-4`}>Köszönjük a nevezést!</div>
                  <div className={`${bebasNeue.className} text-white/80 text-xl`}>Hamarosan találkozunk – a részletekről értesítünk.</div>
                  <button
                    className="mt-6 px-8 py-3 rounded-xl bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white font-bold shadow-lg shadow-[#ff5c1a]/30 transition-colors"
                    onClick={() => { if (typeof window !== 'undefined') window.location.href = '/application'; }}
                  >
                    Tovább a dashboardra
                  </button>
                </motion.div>
              </div>
            )}
            </div>

            {step === 9 && (
              <div className="mt-10 mb-8 pb-16 flex gap-4 flex-col md:flex-row">
                
                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-10 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/30 transition-colors"
                  onClick={() => setDeclineOpen(true)}
                >
                  Nevezés elutasítása
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-10 py-4 rounded-xl bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white font-bold shadow-lg shadow-[#ff5c1a]/30 transition-colors"
                  onClick={() => setStep(10)}
                >
                  Nevezés
                </motion.button>
              </div>
            )}
            {declineOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/60" onClick={() => !declining && setDeclineOpen(false)} />
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative z-10 w-full max-w-md rounded-2xl bg-[#001b45] border border-[#ff5c1a]/40 p-6 shadow-2xl">
                  <div className={`${bebasNeue.className} text-2xl text-white mb-2`}>Biztosan elutasítod a nevezést?</div>
                  <div className="text-white/80 mb-4">Ezt a műveletet nem tudod visszavonni.</div>
                  {declineError && <div className="text-red-400 text-sm mb-3">{declineError}</div>}
                  <div className="flex justify-end gap-3">
                    <button disabled={declining} onClick={() => setDeclineOpen(false)} className="px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white hover:bg-black/50 transition-colors">Mégse</button>
                    <button
                      disabled={declining}
                      onClick={async () => {
                        if (!leagueTeamId) { setDeclineError('Hiányzó leagueTeamId'); return; }
                        setDeclining(true);
                        setDeclineError("");
                        try {
                          await declineApply({ leagueTeamId: leagueTeamId! }).unwrap();
                          setDeclineOpen(false);
                          // Hard redirect to dashboard and refresh once to avoid stale invite cache
                          if (typeof window !== 'undefined') {
                            window.location.replace('/application?refresh=1');
                          } else {
                            router.replace('/application');
                          }
                        } catch (e: any) {
                          setDeclineError(e?.data?.message || e?.error || 'Ismeretlen hiba');
                        } finally {
                          setDeclining(false);
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {declining ? 'Elutasítás…' : 'Elutasítás megerősítése'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
        </div>
    );
}

"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchActiveLiveMatchGroup } from "@/lib/features/liveMatchSlice";
import { getOrCreateAnonymousUserId } from "@/lib/utils/cookie-utils";
import Image from "next/image";
import { Bebas_Neue } from "next/font/google";
import { toast } from "sonner";
import TopNav from "../components/TopNav";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

const abs = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${backendBase}${path}`;
};

export default function SzavazasPage() {
  const dispatch = useAppDispatch();
  // Use shallow equality check to prevent unnecessary re-renders
  const { group, loading, nextMatch, pollForNextMatch } = useAppSelector(
    (state) => state.liveMatch,
    (left, right) => {
      // Custom equality check - only re-render if important data changed
      if (left.loading !== right.loading) return false;
      if (left.group?.id !== right.group?.id) return false;
      
      // Check if nextMatch changed
      if (left.nextMatch?.match.id !== right.nextMatch?.match.id) return false;
      
      // Check if poll vote counts changed
      const leftPoll = left.pollForNextMatch;
      const rightPoll = right.pollForNextMatch;
      if (!leftPoll && !rightPoll) return true;
      if (!leftPoll || !rightPoll) return false;
      if (leftPoll.id !== rightPoll.id) return false;
      
      // Compare vote counts
      if (leftPoll.options.length !== rightPoll.options.length) return false;
      for (let i = 0; i < leftPoll.options.length; i++) {
        if (leftPoll.options[i].voteCount !== rightPoll.options[i].voteCount) {
          return false;
        }
      }
      
      return true; // Equal - don't re-render
    }
  );
  const [anonymousUserId, setAnonymousUserId] = useState<string>("");
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [pollData, setPollData] = useState<any>(null);

  // Get anonymous user ID from cookie
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userId = getOrCreateAnonymousUserId();
      setAnonymousUserId(userId);
    }
  }, []);

  // Fetch active group on mount and poll every 5 seconds
  // Redux slice now prevents unnecessary state updates, so no scroll locking needed
  const isInitialMount = useRef(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Initial fetch
    if (isInitialMount.current) {
      dispatch(fetchActiveLiveMatchGroup());
      isInitialMount.current = false;
    }
    
    // Poll every 5 seconds - Redux slice prevents state updates if data hasn't changed
    pollingIntervalRef.current = setInterval(() => {
      dispatch(fetchActiveLiveMatchGroup());
    }, 5000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [dispatch]);

  // Set poll data from nextMatch - optimized to prevent scroll jumps
  const prevPollIdRef = useRef<string | null>(null);
  const prevVoteCountsRef = useRef<string>('');
  const isCheckingVoteRef = useRef(false);
  
  // Extract vote counts string for dependency array
  const pollVoteCountsString = pollForNextMatch?.options?.map?.((opt: any) => opt.voteCount || 0).join(',') || '';
  
  useEffect(() => {
    if (!pollForNextMatch) {
      if (pollData !== null) {
        setPollData(null);
      }
      if (selectedOptionId !== null) {
        setSelectedOptionId(null);
      }
      prevPollIdRef.current = null;
      prevVoteCountsRef.current = '';
      return;
    }

    const pollId = pollForNextMatch.id;
    const currentVoteCounts = pollVoteCountsString;
    
    // Only update if poll ID changed or vote counts actually changed
    // Redux slice prevents unnecessary state updates, so this should rarely trigger
    if (prevPollIdRef.current !== pollId || currentVoteCounts !== prevVoteCountsRef.current) {
      setPollData(pollForNextMatch);
      prevPollIdRef.current = pollId;
      prevVoteCountsRef.current = currentVoteCounts;
    }

    // Check if user already voted by fetching their vote (only when poll ID changes)
    if (prevPollIdRef.current !== pollId && !isCheckingVoteRef.current) {
      isCheckingVoteRef.current = true;
      const checkUserVote = async () => {
        if (!pollForNextMatch.id || !anonymousUserId) {
          isCheckingVoteRef.current = false;
          return;
        }

        try {
          const response = await fetch(
            `${backendBase}/api/live-matches/polls/${pollForNextMatch.id}/my-vote?anonymousUserId=${anonymousUserId}`,
            { credentials: "include" }
          );
          
          if (response.ok) {
            const vote = await response.json();
            if (vote?.optionId) {
              setSelectedOptionId(vote.optionId);
            }
          }
        } catch (error) {
          console.error("Error checking user vote:", error);
        } finally {
          isCheckingVoteRef.current = false;
        }
      };

      checkUserVote();
    }
  }, [pollForNextMatch, pollVoteCountsString, anonymousUserId, pollData, selectedOptionId]);

  // Calculate poll percentages - memoized to prevent unnecessary recalculations
  // Extract vote counts string for dependency array
  const pollDataVoteCountsString = pollData?.options?.map((opt: any) => opt.voteCount || 0).join(',') || '';
  
  const pollPercentages = useMemo(() => {
    if (!pollData || !pollData.options || pollData.options.length === 0) {
      return null;
    }

    const totalVotes = pollData.options.reduce(
      (sum: number, opt: any) => sum + (opt.voteCount || 0),
      0
    );

    if (totalVotes === 0) {
      return pollData.options.map((opt: any) => ({
        ...opt,
        percentage: 0,
      }));
    }

    return pollData.options.map((opt: any) => ({
      ...opt,
      percentage: Math.round((opt.voteCount / totalVotes) * 100),
    }));
  }, [pollData, pollDataVoteCountsString]);

  // Handle vote - prevent scroll jump on vote submission
  const handleVote = async (optionId: string) => {
    if (!pollForNextMatch?.id || !anonymousUserId || isVoting) return;

    // Save scroll position before voting
    const savedScroll = typeof window !== 'undefined' ? window.scrollY : 0;
    
    setIsVoting(true);
    try {
      const response = await fetch(
        `${backendBase}/api/live-matches/polls/${pollForNextMatch.id}/vote`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            optionId,
            anonymousUserId,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setSelectedOptionId(optionId);
        
        // Refresh active group to get updated poll with vote counts
        // Use a small delay to allow UI to update first
        setTimeout(() => {
          dispatch(fetchActiveLiveMatchGroup());
          
          // Restore scroll position after state update
          if (savedScroll > 0 && typeof window !== 'undefined') {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                if (Math.abs(window.scrollY - savedScroll) > 5) {
                  window.scrollTo({
                    top: savedScroll,
                    behavior: 'instant' as ScrollBehavior
                  });
                }
              });
            });
          }
        }, 50);
        
        toast.success(result.updated ? "Szavazatod módosítva!" : "Szavazatod rögzítve!");
      } else {
        const error = await response.json();
        toast.error(error.message || "Nem sikerült leadni a szavazatot");
      }
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Hiba történt a szavazás során");
    } finally {
      setIsVoting(false);
    }
  };

  // Format match time
  const formatMatchTime = (date: Date) => {
    return date.toLocaleTimeString("hu-HU", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    });
  };

  const formatMatchDate = (date: Date) => {
    return date.toLocaleDateString("hu-HU", { timeZone: "UTC" });
  };

  // Helper to get effective match date/time (prioritize delayed if available)
  const getEffectiveMatchAt = (match: any): Date => {
    if (match.isDelayed && match.delayedDate && match.delayedTime) {
      // Combine delayed date and time
      const delayedDate = new Date(match.delayedDate);
      const delayedTime = new Date(match.delayedTime);
      const combined = new Date(delayedDate);
      combined.setUTCHours(delayedTime.getUTCHours(), delayedTime.getUTCMinutes(), 0, 0);
      return combined;
    }
    return new Date(match.matchAt);
  };

  // Check if match is still open for voting (not completed)
  const isMatchOpenForVoting = useMemo(() => {
    if (!nextMatch) return false;
    return (
      nextMatch.match.matchStatus !== "completed" &&
      nextMatch.match.matchStatus !== "cancelled"
    );
  }, [nextMatch]);

  return (
    <div className="min-h-screen bg-black">
      {/* Fixed TopNav */}
      <TopNav />
      
      {/* Hero Section with Title Overlay - Full Width */}
      <div className="relative mb-8 sm:mb-12 md:mb-16 pt-16 sm:pt-20">
        <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[500px] overflow-hidden">
          <Image 
            src="/title.jpg" 
            alt="Beerpong Arena" 
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="text-center">
              <h1 className={`${bebasNeue.className} text-[#FFDB11] text-3xl sm:text-4xl md:text-6xl lg:text-7xl mb-2 sm:mb-4`}>
                SZAVAZÁS
              </h1>
              <p className="text-white text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl max-w-2xl mx-auto">
                Szavazz a következő meccsre!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 md:px-6 pb-8 sm:pb-12">
        {/* Content */}
        <div className="max-w-4xl mx-auto">

          {loading ? (
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-6 sm:p-8 text-center">
              <p className="text-white/80 text-base sm:text-lg md:text-xl">Betöltés...</p>
            </div>
          ) : !nextMatch || !isMatchOpenForVoting ? (
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-6 sm:p-8 text-center">
              <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4`}>
                Nincs aktív szavazás
              </h2>
              <p className="text-white/80 text-sm sm:text-base md:text-lg">
                Jelenleg nincs elérhető meccs, amire szavazhatnál.
              </p>
            </div>
          ) : !pollForNextMatch ? (
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-6 sm:p-8 text-center">
              <h2 className={`${bebasNeue.className} text-[#FFDB11] text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4`}>
                Nincs szavazás
              </h2>
              <p className="text-white/80 text-sm sm:text-base md:text-lg">
                Erre a meccsre még nem hozták létre a szavazást.
              </p>
            </div>
          ) : (
            <>
              {/* Match Details - Mobile Optimized */}
              <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-4 md:p-6 lg:p-8 mb-6" style={{ contain: 'layout style paint' }}>
                {/* Mobile: Stack vertically, Desktop: Horizontal */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
                  {/* Home Team */}
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 w-full md:w-auto">
                    {nextMatch.homeTeam.logo && abs(nextMatch.homeTeam.logo) ? (
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-[#FFDB11]/30 bg-white/10 flex-shrink-0">
                        <Image
                          src={abs(nextMatch.homeTeam.logo)!}
                          alt={nextMatch.homeTeam.name || "Home team"}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-black/60 border-2 border-[#FFDB11]/30 flex items-center justify-center flex-shrink-0">
                        <span className={`${bebasNeue.className} text-white text-lg sm:text-xl md:text-2xl lg:text-3xl`}>
                          {(nextMatch.homeTeam.name || "").substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className={`${bebasNeue.className} text-white text-lg sm:text-xl md:text-2xl lg:text-3xl truncate`}>
                        {nextMatch.homeTeam.name}
                      </h3>
                    </div>
                  </div>

                  {/* VS Separator */}
                  <div className="flex flex-row md:flex-col items-center gap-2 md:gap-0 mx-auto md:mx-2 lg:mx-4 flex-shrink-0">
                    <span className={`${bebasNeue.className} text-[#FFDB11] text-xl sm:text-2xl md:text-3xl lg:text-4xl`}>VS</span>
                    <div className="text-white text-xs sm:text-sm md:text-sm mt-0 md:mt-2 text-center flex flex-row md:flex-col items-center gap-1 md:gap-0">
                      <div className="text-xs">{formatMatchDate(getEffectiveMatchAt(nextMatch.match))}</div>
                      <div className={`${bebasNeue.className} text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl mt-0 md:mt-1`}>
                        {formatMatchTime(getEffectiveMatchAt(nextMatch.match))}
                      </div>
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 w-full md:w-auto justify-end md:justify-end">
                    <div className="text-right min-w-0 flex-1 md:flex-none">
                      <h3 className={`${bebasNeue.className} text-white text-lg sm:text-xl md:text-2xl lg:text-3xl truncate`}>
                        {nextMatch.awayTeam.name}
                      </h3>
                    </div>
                    {nextMatch.awayTeam.logo && abs(nextMatch.awayTeam.logo) ? (
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-[#FFDB11]/30 bg-white/10 flex-shrink-0">
                        <Image
                          src={abs(nextMatch.awayTeam.logo)!}
                          alt={nextMatch.awayTeam.name || "Away team"}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-black/60 border-2 border-[#FFDB11]/30 flex items-center justify-center flex-shrink-0">
                        <span className={`${bebasNeue.className} text-white text-lg sm:text-xl md:text-2xl lg:text-3xl`}>
                          {(nextMatch.awayTeam.name || "").substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Poll Section - Mobile Optimized */}
              {pollData && (
                <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8" style={{ contain: 'layout style paint' }}>
                  <h2
                    className={`${bebasNeue.className} text-[#FFDB11] text-xl sm:text-2xl md:text-3xl mb-4 sm:mb-6 text-center break-words`}
                  >
                    {pollData.question}
                  </h2>

                  <div className="space-y-3 sm:space-y-4">
                    {pollPercentages?.map((option: any) => {
                      const isSelected = selectedOptionId === option.id;
                      const isDisabled = isVoting;

                      return (
                        <button
                          key={option.id}
                          onClick={() => !isDisabled && handleVote(option.id)}
                          disabled={isDisabled}
                          className={`w-full p-3 sm:p-4 md:p-5 rounded-xl border-2 transition-all duration-300 text-left ${
                            isSelected
                              ? "border-[#FFDB11] bg-[#FFDB11]/10"
                              : "border-white/20 bg-black/20 hover:border-[#FFDB11]/50 active:bg-[#FFDB11]/5"
                          } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer touch-manipulation"}`}
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
                            <span
                              className={`text-base sm:text-lg md:text-xl font-semibold break-words ${
                                isSelected ? "text-[#FFDB11]" : "text-white"
                              }`}
                            >
                              {option.text}
                            </span>
                            <span className={`${bebasNeue.className} text-white font-bold text-xl sm:text-2xl md:text-3xl flex-shrink-0`}>
                              {option.percentage}%
                            </span>
                          </div>
                          {/* Progress Bar - smooth update without layout shift */}
                          <div className="w-full bg-black/60 rounded-full h-3 sm:h-4 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-1000 ease-out ${
                                isSelected ? "bg-[#FFDB11]" : "bg-[#FFDB11]/70"
                              }`}
                              style={{ 
                                width: `${option.percentage}%`,
                                willChange: 'width',
                                contain: 'layout style paint'
                              }}
                            ></div>
                          </div>
                          {isSelected && (
                            <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-[#FFDB11] font-semibold">
                              ✓ Te ezt választottad
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedOptionId && (
                    <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/10">
                      <p className="text-white/80 text-xs sm:text-sm text-center px-2">
                        Szavazatod leadva! Bármikor módosíthatod, amíg a meccs nem zárul le.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


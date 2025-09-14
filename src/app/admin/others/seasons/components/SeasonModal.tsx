"use client";

import { Bebas_Neue } from "next/font/google";
import { SeasonForm } from "./SeasonForm";
import { Season, useUpdateSeasonMutation } from "@/lib/features/season/seasonSlice";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

interface SeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; startDate: string; endDate: string }) => void;
  season: Season | null;
}

export default function SeasonModal({ isOpen, onClose, onSubmit, season }: SeasonModalProps) {
  const [updateSeason] = useUpdateSeasonMutation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#001a3a] rounded-2xl p-8 w-full max-w-md border-2 border-[#ff5c1a]">
        <h2 className={`${bebasNeue.className} text-2xl text-white mb-6`}>{season ? 'Szezon szerkesztése' : 'Új Szezon'}</h2>
        <SeasonForm
          onSubmit={async (data) => {
            if (season) {
              await updateSeason({ id: season.id, ...data }).unwrap();
              onClose();
            } else {
              onSubmit(data);
            }
          }}
          onCancel={onClose}
          initial={season ? { name: season.name, startDate: season.startDate || undefined, endDate: season.endDate || undefined } : undefined}
        />
      </div>
    </div>
  );
} 
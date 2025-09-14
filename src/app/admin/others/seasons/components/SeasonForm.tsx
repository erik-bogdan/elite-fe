"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

const formSchema = z.object({
  name: z.string().min(1, "A név megadása kötelező"),
  startDate: z.string().min(1, "A kezdés dátuma kötelező"),
  endDate: z.string().min(1, "A befejezés dátuma kötelező"),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: "A kezdés dátuma nem lehet későbbi, mint a befejezés dátuma",
  path: ["endDate"],
});

type FormData = z.infer<typeof formSchema>;

interface SeasonFormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  initial?: Partial<FormData>;
}

export function SeasonForm({ onSubmit, onCancel, initial }: SeasonFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initial as any,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-white mb-2">Név</label>
        <input
          type="text"
          {...register("name")}
          className="w-full px-4 py-2 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white placeholder:text-white/50 focus:border-[#ff5c1a] focus:ring-[#ff5c1a]/20"
        />
        {errors.name && (
          <p className="text-sm text-red-400 mt-1">{errors.name.message}</p>
        )}
      </div>
      <div>
        <label className="block text-white mb-2">Kezdés dátuma</label>
        <input
          type="date"
          {...register("startDate")}
          defaultValue={initial?.startDate ? String(initial.startDate).slice(0,10) : undefined}
          className="w-full px-4 py-2 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white focus:border-[#ff5c1a] focus:ring-[#ff5c1a]/20"
        />
        {errors.startDate && (
          <p className="text-sm text-red-400 mt-1">{errors.startDate.message}</p>
        )}
      </div>
      <div>
        <label className="block text-white mb-2">Befejezés dátuma</label>
        <input
          type="date"
          {...register("endDate")}
          defaultValue={initial?.endDate ? String(initial.endDate).slice(0,10) : undefined}
          className="w-full px-4 py-2 bg-black/40 border-2 border-[#ff5c1a]/50 rounded-lg text-white focus:border-[#ff5c1a] focus:ring-[#ff5c1a]/20"
        />
        {errors.endDate && (
          <p className="text-sm text-red-400 mt-1">{errors.endDate.message}</p>
        )}
      </div>
      <div className="flex justify-end gap-4 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-white hover:text-[#ff5c1a] transition-colors"
        >
          Mégse
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded-lg transition-colors"
        >
          Létrehozás
        </button>
      </div>
    </form>
  );
} 
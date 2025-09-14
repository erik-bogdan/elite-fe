"use client";
import { useState } from "react";
import { Bebas_Neue } from "next/font/google";
import { usePreviewScheduleMutation, useSaveScheduleMutation } from "@/lib/features/championship/championshipSlice";
import { toast } from "sonner";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

export default function StartModal({ id, isOpen, onClose, teamNames }: { id: string; isOpen: boolean; onClose: () => void; teamNames: string[] }) {
  const [days, setDays] = useState<number>(4);
  const [perDay, setPerDay] = useState<number[]>([4, 5, 4, 5]);
  const [perDayText, setPerDayText] = useState<string>("4, 5, 4, 5");
  const [startTime, setStartTime] = useState<string>("20:00");
  const [duration, setDuration] = useState<number>(40);
  const [tables, setTables] = useState<number>(6);
  const [dayDates, setDayDates] = useState<string[]>(["", "", "", ""]);
  const [previewSchedule, { data, isLoading }] = usePreviewScheduleMutation();
  const [saveSchedule, { isLoading: isSaving }] = useSaveScheduleMutation();

  const regen = async () => {
    try {
      await previewSchedule({ id, teams: teamNames, matchesPerDay: perDay, startTime, matchDuration: duration, tables, dayDates }).unwrap();
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || 'Hiba történt a generálás során';
      toast.error(msg);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#001a3a] rounded-2xl p-6 w-full max-w-5xl border-2 border-[#ff5c1a]">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${bebasNeue.className} text-2xl text-white`}>Bajnokság indítása</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white">Bezár</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-white/80 text-sm mb-1">Játéknapok száma</label>
            <input required type="number" min={1} value={days} onChange={(e) => {
              const n = parseInt(e.target.value || '1'); setDays(n); setPerDay(prev => Array.from({ length: n }, (_, i) => prev[i] ?? 4));
              setPerDayText(Array.from({ length: n }, (_, i) => (i < perDay.length ? perDay[i] : 4)).join(", "));
            }} className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white" />
          </div>
          <div className="md:col-span-3">
            <label className="block text-white/80 text-sm mb-1">Matches per day (vesszővel)</label>
            <input required value={perDayText} onChange={(e) => {
              const text = e.target.value;
              setPerDayText(text);
              const arr = text.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
              setPerDay(arr);
            }} className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white" />
          </div>
          <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            {Array.from({ length: days }).map((_, i) => (
              <div key={i}>
                <label className="block text-white/80 text-sm mb-1">Játéknap {i + 1} dátuma</label>
                <input required type="date" value={dayDates[i] || ""} onChange={(e) => setDayDates(prev => { const next = [...prev]; next[i] = e.target.value; return next; })} className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-1">Kezdés (HH:MM)</label>
            <input required type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white" />
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-1">Meccs hossza</label>
            <div className="flex items-center gap-2">
              <input required type="number" min={10} value={duration} onChange={(e) => setDuration(parseInt(e.target.value || '0'))} className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white" />
              <span className="text-white/70">perc</span>
            </div>
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-1">Asztalok</label>
            <input required type="number" min={1} value={tables} onChange={(e) => setTables(parseInt(e.target.value || '1'))} className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white" />
          </div>
          <div className="flex items-end">
            <button onClick={regen} className="px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded">Generálás</button>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className={`${bebasNeue.className} text-xl text-white`}>Preview</h4>
            <button onClick={regen} disabled={isLoading} className="px-3 py-1 rounded bg-black/30 border border-[#ff5c1a]/40 text-white hover:bg-black/40">Újragenerálás</button>
          </div>
          <div className="relative max-h-[50vh] overflow-auto border border-white/10 rounded">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="sticky top-0 z-10 bg-[#001a3a]">
                <tr className="text-left text-white">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Idő</th>
                  <th className="py-2 px-3">Hazai</th>
                  <th className="py-2 px-3">Vendég</th>
                  <th className="py-2 px-3">Asztal</th>
                  <th className="py-2 px-3">Kör</th>
                  <th className="py-2 px-3">Nap</th>
                  <th className="py-2 px-3">Dátum</th>
                </tr>
              </thead>
              <tbody>
                {(data?.schedule || []).map((m: any, idx: number) => (
                  <tr key={idx} className="text-white/90 border-t border-white/10">
                    <td className="py-2 px-3">{m.globalOrder+1}</td>
                    <td className="py-2 px-3">{m.startTime}</td>
                    <td className="py-2 px-3">{m.home}</td>
                    <td className="py-2 px-3">{m.away}</td>
                    <td className="py-2 px-3">{m.table}</td>
                    <td className="py-2 px-3">{(typeof m.round === 'number') ? m.round : (typeof m.slot === 'number' ? (m.slot + 1) : '-')}</td>
                    <td className="py-2 px-3">{m.day}</td>
                    <td className="py-2 px-3">{m.date || '-'}</td>
                  </tr>
                ))}
                {(!data?.schedule || data.schedule.length === 0) && (
                  <tr><td colSpan={8} className="text-white/70 py-3 px-3">Nincs még generált menetrend</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <button
              disabled={!data?.schedule?.length || isSaving}
              onClick={async () => {
                try {
                  await saveSchedule({ id, schedule: data?.schedule || [], dayDates }).unwrap();
                  toast.success("Menetrend elmentve, bajnokság elindítva");
                  onClose();
                } catch (e: any) {
                  toast.error(e?.data?.message || e?.message || "Hiba történt a mentés során");
                }
              }}
              className="px-4 py-2 bg-[#ff5c1a] hover:bg-[#ff7c3a] text-white rounded disabled:opacity-50"
            >
              {isSaving ? 'Mentés...' : 'Mentés'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



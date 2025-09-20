"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SetPasswordPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const fromInvite = sp.get('invite') || sp.get('result') === 'success';
  const leagueTeamId = sp.get('lt') || '';
  const inviteToken = sp.get('token') || '';
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!fromInvite) {
      router.replace('/');
    }
  }, [fromInvite, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('A jelszó legalább 8 karakter legyen');
      return;
    }
    try {
      setSubmitting(true);
      const backend = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}`;
      
      // Set password
      const res = await fetch(`${backend}/api/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword: password })
      });
      
      if (!res.ok) {
        toast.error('Nem sikerült a jelszó beállítása');
        return;
      }
      
      // If we have an invite token, accept the player invite
      if (inviteToken) {
        const inviteRes = await fetch(`${backend}/api/players/link-invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token: inviteToken })
        });
        
        if (!inviteRes.ok) {
          toast.error('Nem sikerült a meghívó elfogadása');
          return;
        }
        
        toast.success('Jelszó beállítva és meghívó elfogadva!');
        router.replace('/auth/login');
      } else {
        toast.success('Jelszó beállítva');
        if (leagueTeamId) {
          router.replace(`/application/apply/${encodeURIComponent(leagueTeamId)}`);
        } else {
          router.replace('/application');
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0a1222] via-[#0a1222] to-[#020816]">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
        </div>
        <form onSubmit={onSubmit} className="backdrop-blur bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl">
          <h1 className="text-white text-xl sm:text-2xl font-semibold mb-2">Állíts be jelszót</h1>
          <p className="text-white/70 text-sm sm:text-base mb-4">A meghívó elfogadása után első alkalommal kérjük állíts be jelszót a belépéshez, mellyel a következő alkalommal már be tudsz jelentkezni.</p>
          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Új jelszó (min. 8 karakter)"
              className="w-full bg-black/40 border border-white/15 focus:border-[#ff5c1a] transition-colors text-white rounded-lg px-4 py-3 focus:outline-none"
            />
            <button disabled={submitting} className="w-full bg-[#ff5c1a] hover:bg-[#ff7c3a] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg px-4 py-3 font-semibold">
              {submitting ? 'Mentés...' : 'Jelszó mentése'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



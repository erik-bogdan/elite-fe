"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export const dynamic = 'force-dynamic';

interface InviteData {
  token: string;
  email: string;
  nickname: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  teamName?: string;
  expiresAt: string;
}

export default function AcceptInvitePage() {
  const sp = useSearchParams();
  const router = useRouter();
  // Support both new format (token) and old format (ba + invite)
  const token = sp.get('token') || sp.get('invite');
  const ba = sp.get('ba');
  
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        router.replace("/");
        return;
      }

      // If we have 'ba' parameter but no 'token', this is admin flow - redirect to set-password
      // But only if we really don't have any player invite token
      if (ba && !token && !sp.get('invite')) {
        router.replace(`/auth/set-password?invite=1`);
        return;
      }
      
      // If we have a token (either from new format or old format with 'ba'), validate it
      // We ignore the 'ba' parameter completely for player invites

      try {
        const backend = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}`;
        const response = await fetch(`${backend}/api/players/validate-invite/${encodeURIComponent(token)}`);
        
        if (!response.ok) {
          const error = await response.json();
          toast.error(error.message || 'Érvénytelen meghívó');
          router.replace("/");
          return;
        }

        const data = await response.json();
        setInviteData(data.data);
        // Set name in format: lastName firstName (vezetéknév keresztnév)
        const fullName = data.data.lastName && data.data.firstName 
          ? `${data.data.lastName} ${data.data.firstName}`
          : data.data.fullName;
        setName(fullName);
      } catch (error) {
        toast.error('Hiba történt a meghívó ellenőrzése során');
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token, ba, router, sp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteData || !password || !name) {
      toast.error('Minden mező kitöltése kötelező');
      return;
    }

    if (password.length < 8) {
      toast.error('A jelszó legalább 8 karakter legyen');
      return;
    }

    try {
      setSubmitting(true);
      const backend = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3555'}`;
      
      // Use the new flow for both old and new invites - no Better Auth magic link
      const response = await fetch(`${backend}/api/players/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: inviteData.token,
          password,
          email: inviteData.email,
          name: name.trim(), // This is already in the correct format: lastName firstName
          nickname: name.trim() // Send the full name as nickname too
        })
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || 'Hiba történt a regisztráció során');
        return;
      }

      toast.success('Sikeres regisztráció! Most bejelentkezhetsz.');
      router.replace('/auth/login');
    } catch (error) {
      toast.error('Hiba történt a regisztráció során');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0a1222] via-[#0a1222] to-[#020816]">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Meghívó ellenőrzése...</p>
        </div>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0a1222] via-[#0a1222] to-[#020816]">
        <div className="text-white text-center">
          <p>Érvénytelen meghívó</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0a1222] via-[#0a1222] to-[#020816]">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-white text-2xl sm:text-3xl font-bold mb-2">Meghívás elfogadása</h1>
          <p className="text-white/70 text-sm sm:text-base text-center">
            {inviteData.teamName ? (
              <>Csatlakozz a(z) <strong>{inviteData.teamName}</strong> csapathoz</>
            ) : (
              <>Csatlakozz az ELITE Beerpong rendszeréhez</>
            )}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="backdrop-blur bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">Email cím</label>
              <input
                type="email"
                value={inviteData.email}
                disabled
                className="w-full bg-black/40 border border-white/15 text-white/60 rounded-lg px-4 py-3 cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">Teljes név</label>
              <input
                type="text"
                value={name}
                disabled
                className="w-full bg-black/40 border border-white/15 text-white/60 rounded-lg px-4 py-3 cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">Jelszó</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Jelszó (min. 8 karakter)"
                className="w-full bg-black/40 border border-white/15 focus:border-[#ff5c1a] transition-colors text-white rounded-lg px-4 py-3 focus:outline-none"
                required
                minLength={8}
              />
            </div>
            
            <button 
              type="submit"
              disabled={submitting} 
              className="w-full bg-[#ff5c1a] hover:bg-[#ff7c3a] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg px-4 py-3 font-semibold transition-colors"
            >
              {submitting ? 'Regisztráció...' : 'Meghívás elfogadása'}
            </button>
          </div>
          
          <p className="text-white/60 text-xs mt-4 text-center">
            A meghívó lejárata: {new Date(inviteData.expiresAt).toLocaleDateString('hu-HU')}
          </p>
        </form>
      </div>
    </div>
  );
}



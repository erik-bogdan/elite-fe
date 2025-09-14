"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function LinkPlayerPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const invite = sp.get('invite');
  const result = sp.get('result');
  const reason = sp.get('reason');
  const [status, setStatus] = useState<'pending'|'success'|'error'>('pending');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const run = async () => {
      // Handle backend redirects with explicit error reasons
      if (result === 'error') {
        setStatus('error');
        const map: Record<string, string> = {
          'missing-token': 'Hiányzó token a meghívó linkből.',
          'invalid-token': 'Érvénytelen meghívó token.',
          'expired': 'A meghívó token lejárt.',
          'unauthorized': 'Nincs aktív munkamenet. Kérjük, nyisd meg újra a meghívó linket.',
        };
        const msg = map[String(reason || '')] || 'Ismeretlen hiba történt a meghívó feldolgozásakor.';
        setErrorMsg(msg);
        return;
      }

      if (!invite) { setStatus('error'); setErrorMsg('Hiányzó token a meghívó feldolgozásához.'); return; }
      try {
        // At this point Better Auth already verified token and created session (callback from magic link)
        // Only need to call backend to mark invitation accepted and link player by token
        const backend = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}`;
        const res = await fetch(`${backend}/api/players/link-invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: invite }),
          credentials: 'include'
        });
        if (res.ok) {
          setStatus('success');
          toast.success('Sikeres meghívó elfogadás. Kérjük állíts be jelszót!');
          setTimeout(() => router.replace('/auth/set-password?invite=1'), 800);
        } else {
          let msg = 'Ismeretlen hiba történt a meghívó feldolgozásakor.';
          try {
            const data = await res.json();
            if (data?.message) msg = data.message;
          } catch {}
          setErrorMsg(`${msg} (HTTP ${res.status})`);
          setStatus('error');
          console.error('Invite link-invite error', res.status, msg);
          toast.error(msg);
        }
      } catch (e) {
        console.error('Invite processing exception', e);
        setErrorMsg('Hálózati hiba történt a meghívó feldolgozásakor.');
        setStatus('error');
      }
    };
    run();
  }, [invite, result, reason, router]);

  if (status === 'pending') return <div className="p-8 text-white">Meghívó feldolgozása...</div>;
  if (status === 'success') return <div className="p-8 text-white">Sikeres összekapcsolás. Visszairányítunk...</div>;
  return (
    <div className="p-8 text-white space-y-2">
      <div>Hiba történt a meghívó feldolgozása közben.</div>
      {errorMsg && (
        <div className="text-sm text-red-300">{errorMsg}</div>
      )}
      {(reason || invite) && (
        <div className="text-xs text-white/60 mt-2">
          Debug: reason={String(reason || '-')}, token={(invite || '').slice(0,6)}...
        </div>
      )}
    </div>
  );
}



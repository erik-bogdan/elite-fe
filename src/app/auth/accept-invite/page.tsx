"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function AcceptInvitePage() {
  const sp = useSearchParams();
  const router = useRouter();
  // ba: Better Auth verify token, invite: player_invitation token (if present)
  const ba = sp.get('ba') || sp.get('token');
  const invite = sp.get('invite');

  useEffect(() => {
    const doRedirect = async () => {
      if (!ba) {
        router.replace("/");
        return;
      }
      const backend = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}`;
      // Always drive the verification through backend verify URL to set session cookie on backend domain
      // If we have a distinct player invite token, pass that to the callback; otherwise reuse the BA token
      const playerToken = invite || ba;
      const verify = `${backend}/api/auth/magic-link/verify?token=${encodeURIComponent(ba)}&callbackURL=${encodeURIComponent(`${backend}/api/players/link-invite?token=${encodeURIComponent(playerToken)}`)}`;
      window.location.href = verify;
    };
    doRedirect();
  }, [ba, invite, router]);

  return <div className="p-8 text-white">Meghívó ellenőrzése...</div>;
}



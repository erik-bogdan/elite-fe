"use client";

import TopNav from "./components/TopNav";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ClientShellContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const sp = useSearchParams();
  useEffect(() => {
    const lt = sp.get('lt');
    const fromInvite = sp.get('invite');
    
    // Don't redirect if we're on the accept-invite page (it handles its own invite logic)
    const isAcceptInvitePage = typeof window !== 'undefined' && window.location.pathname === '/auth/accept-invite';
    
    if ((lt || fromInvite) && !isAcceptInvitePage) {
      const target = lt ? `/application/apply/${encodeURIComponent(lt)}` : '/auth/set-password?invite=1';
      router.replace(target);
    }
  }, [router, sp]);
  return (
    <>
      <TopNav />
      {children}
    </>
  );
}

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientShellContent>{children}</ClientShellContent>
    </Suspense>
  );
}



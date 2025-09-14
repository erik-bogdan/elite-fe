import { authClient } from "@/app/lib/auth-client";

export function useSession() {
  const { useSession: fetchSession } = authClient;
  const { data, error, isPending, refetch } = fetchSession();
  return { data, error, isPending, refetch };
}

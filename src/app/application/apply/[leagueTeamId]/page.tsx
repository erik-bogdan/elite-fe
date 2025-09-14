"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useGetApplyMetaQuery } from "@/lib/features/apiSlice";
import ApplyComponent from "../ApplyComponent";

export default function ApplyGuardedPage() {
  const params = useParams();
  const router = useRouter();
  const leagueTeamId = String(params?.leagueTeamId || "");
  const { data, error, isLoading } = useGetApplyMetaQuery(leagueTeamId, { skip: !leagueTeamId });
  const [teamName, setTeamName] = useState<string>("");

  useEffect(() => {
    if (!isLoading) {
      if (!data || (error as any)?.status === 403 || (error as any)?.status === 401) {
        router.replace("/auth/login");
      }
    }
  }, [data, error, isLoading, router]);

  useEffect(() => {
    if (data?.teamName) setTeamName(data.teamName);
  }, [data]);

  if (isLoading) return null;
  if (!data) return null;

  return <ApplyComponent defaultTeamName={teamName} defaultIds={{ teamId: data.teamId, seasonId: data.seasonId }} leagueTeamId={leagueTeamId} initialStatus={data.status} />;
}



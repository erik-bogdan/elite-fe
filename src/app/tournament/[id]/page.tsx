import { TournamentPage } from '@/components/tournament/TournamentPage';

interface TournamentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Tournament({ params }: TournamentPageProps) {
  const { id } = await params;
  return <TournamentPage tournamentId={id} />;
} 
'use client';

import { motion } from 'framer-motion';
import { TournamentCover } from './TournamentCover';
import { TournamentDetails } from './TournamentDetails';
import { TeamList } from './TeamList';
import { TournamentDescription } from './TournamentDescription';

interface TournamentPageProps {
  tournamentId: string;
}

// Mock tournament data - in real app this would come from API
const mockTournament = {
  id: '1',
  title: 'Nyári Bajnokság 2024',
  date: '2024.07.15',
  location: 'Budapest, Szabadság tér',
  description: 'A legnagyobb nyári sörpong esemény Magyarországon!',
  longDescription: `
# Nyári Bajnokság 2024

Üdvözöljük a legnagyobb nyári sörpong eseményen! Ez a bajnokság nem csak egy verseny, hanem egy igazi közösségi esemény, ahol a sörpong szerelmesei összegyűlnek.

## Lebonyolítás

A bajnokság **Swiss rendszerben** zajlik, ami biztosítja, hogy minden csapat megfelelő számú mérkőzést játsszon. A csoportkörök után a legjobb 8 csapat jut tovább a kieséses szakaszba.

## Szabályok

- Minden csapat 2 játékosból áll
- A mérkőzések 10 dobásig tartanak
- A győztes csapat 2 pontot kap, a vesztes 0 pontot
- Döntetlen esetén mindkét csapat 1 pontot kap

## Nyeremények

🏆 **1. helyezett:** 50,000 Ft + trófea
🥈 **2. helyezett:** 30,000 Ft + érem
🥉 **3. helyezett:** 20,000 Ft + érem

## Időpontok

- **Regisztráció:** 09:00 - 10:00
- **Csoportkörök:** 10:30 - 16:00
- **Kieséses szakasz:** 16:30 - 20:00
- **Díjátadó:** 20:30

Ne hagyd ki ezt a fantasztikus eseményt!
  `,
  entryFee: 5000,
  maxTeams: 32,
  currentTeams: 24,
  format: 'Swiss + Kieséses',
  registrationDeadline: '2024.07.10',
  isRegistrationOpen: true,
  image: '/bg.png',
  category: 'Bajnokság',
  teams: [
    {
      id: '1',
      name: 'Pong Masters',
      players: ['Kovács Péter', 'Nagy Anna'],
      registrationDate: '2024.06.20'
    },
    {
      id: '2',
      name: 'Beer Legends',
      players: ['Szabó Gábor', 'Kiss Eszter'],
      registrationDate: '2024.06.21'
    },
    {
      id: '3',
      name: 'Cup Crushers',
      players: ['Tóth Balázs', 'Varga Márta'],
      registrationDate: '2024.06.22'
    },
    {
      id: '4',
      name: 'Elite Throwers',
      players: ['Molnár Dávid', 'Fekete Katalin'],
      registrationDate: '2024.06.23'
    },
    {
      id: '5',
      name: 'Pong Pros',
      players: ['Balogh Tamás', 'Kovács Éva'],
      registrationDate: '2024.06.24'
    },
    {
      id: '6',
      name: 'Beer Champions',
      players: ['Nagy István', 'Szabó Zsuzsa'],
      registrationDate: '2024.06.25'
    }
  ]
};

export function TournamentPage({ tournamentId }: TournamentPageProps) {
  // In real app, fetch tournament data based on tournamentId
  const tournament = mockTournament;

  return (
    <div className="min-h-screen bg-black">
      {/* Cover Section */}
      <TournamentCover tournament={tournament} />
      
      {/* Details Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <TournamentDetails tournament={tournament} />
          </motion.div>
        </div>
      </section>

      {/* Teams Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <TeamList teams={tournament.teams} />
          </motion.div>
        </div>
      </section>

      {/* Description Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <TournamentDescription description={tournament.longDescription} />
          </motion.div>
        </div>
      </section>
    </div>
  );
} 
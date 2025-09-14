'use client';

import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Trophy, 
  Award, 
  Target, 
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Tournament {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  entryFee: number;
  maxTeams: number;
  currentTeams: number;
  format: string;
  registrationDeadline: string;
  isRegistrationOpen: boolean;
  image: string;
  category: string;
}

interface TournamentDetailsProps {
  tournament: Tournament;
}

export function TournamentDetails({ tournament }: TournamentDetailsProps) {
  const progressPercentage = (tournament.currentTeams / tournament.maxTeams) * 100;

  return (
    <div className="space-y-12">
      {/* Section Title */}
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Részletes Információk
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Minden fontos információ a bajnokságról egy helyen
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Left Column - Key Information */}
        <div className="space-y-8">
          {/* Registration Status */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center gap-3 mb-4">
              {tournament.isRegistrationOpen ? (
                <CheckCircle className="w-6 h-6 text-green-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-400" />
              )}
              <h3 className="text-xl font-bold text-white">
                Nevezési Státusz
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Státusz:</span>
                <span className={`font-semibold ${tournament.isRegistrationOpen ? 'text-green-400' : 'text-red-400'}`}>
                  {tournament.isRegistrationOpen ? 'Nyitott' : 'Lezárva'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Határidő:</span>
                <span className="text-white font-semibold">{tournament.registrationDeadline}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Nevezési díj:</span>
                <span className="text-white font-semibold">{tournament.entryFee.toLocaleString()} Ft</span>
              </div>
            </div>
          </motion.div>

          {/* Team Progress */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-bold text-white">Csapatok</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Nevezett csapatok:</span>
                <span className="text-white font-semibold">{tournament.currentTeams}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Maximum csapatok:</span>
                <span className="text-white font-semibold">{tournament.maxTeams}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Kitöltöttség</span>
                  <span className="text-white">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tournament Format */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Lebonyolítás</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Formátum:</span>
                <span className="text-white font-semibold">{tournament.format}</span>
              </div>
              
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <h4 className="text-purple-400 font-semibold mb-2">Swiss rendszer</h4>
                <p className="text-gray-300 text-sm">
                  Minden csapat megfelelő számú mérkőzést játszik, a legjobbak jutnak tovább a kieséses szakaszba.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Additional Details */}
        <div className="space-y-8">
          {/* Prizes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-bold text-white">Nyeremények</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <div className="text-yellow-400 font-semibold">1. helyezett</div>
                    <div className="text-gray-300 text-sm">Győztes</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">50,000 Ft</div>
                  <div className="text-gray-300 text-sm">+ Trófea</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-500/10 border border-gray-500/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥈</span>
                  <div>
                    <div className="text-gray-400 font-semibold">2. helyezett</div>
                    <div className="text-gray-300 text-sm">Ezüstérmes</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">30,000 Ft</div>
                  <div className="text-gray-300 text-sm">+ Érem</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥉</span>
                  <div>
                    <div className="text-orange-400 font-semibold">3. helyezett</div>
                    <div className="text-gray-300 text-sm">Bronzérmes</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">20,000 Ft</div>
                  <div className="text-gray-300 text-sm">+ Érem</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Important Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-bold text-white">Fontos Információk</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white font-semibold">Minden csapat 2 játékosból áll</div>
                  <div className="text-gray-300 text-sm">Két fős csapatok kötelezőek</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white font-semibold">10 dobásos mérkőzések</div>
                  <div className="text-gray-300 text-sm">Standard sörpong szabályok</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white font-semibold">Saját felszerelés opcionális</div>
                  <div className="text-gray-300 text-sm">Minden szükséges eszköz biztosított</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white font-semibold">Ingyenes sör biztosított</div>
                  <div className="text-gray-300 text-sm">A verseny alatt fogyasztható</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Schedule */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-pink-400" />
              <h3 className="text-xl font-bold text-white">Időpontok</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Regisztráció:</span>
                <span className="text-white font-semibold">09:00 - 10:00</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Csoportkörök:</span>
                <span className="text-white font-semibold">10:30 - 16:00</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Kieséses szakasz:</span>
                <span className="text-white font-semibold">16:30 - 20:00</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Díjátadó:</span>
                <span className="text-white font-semibold">20:30</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { motion } from 'framer-motion';
import { Users, Calendar, Trophy, Star, Crown } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  // Each player can be a plain name string or an object with captain flag
  players: (string | { name: string; captain?: boolean })[];
  registrationDate: string;
}

interface TeamListProps {
  teams: Team[];
}

export function TeamList({ teams }: TeamListProps) {
  return (
    <div className="space-y-12">
      {/* Section Title */}
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Nevezett Csapatok
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          {teams.length} csapat már nevezett a bajnokságra
        </p>
      </div>

      {/* Teams Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team, index) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="group"
          >
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 h-full">
              {/* Team Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                      {team.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-300">#{index + 1}</span>
                    </div>
                  </div>
                </div>
                
                {/* Registration Date */}
                <div className="text-right">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">{team.registrationDate}</span>
                  </div>
                </div>
              </div>

              {/* Players */}
              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  Játékosok
                </h4>
                <div className="space-y-2">
                  {team.players.map((player, playerIndex) => {
                    const playerName = typeof player === 'string' ? player : player.name;
                    const isCaptain = typeof player === 'string' ? false : !!player.captain;
                    const initials = playerName.split(' ').filter(Boolean).map(n => n[0]).join('');
                    return (
                      <div
                        key={playerIndex}
                        className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {initials}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-white font-medium">{playerName}</span>
                          {isCaptain && (
                            <span className="ml-auto inline-flex items-center gap-1 text-xs text-yellow-300">
                              <Crown className="w-4 h-4 text-yellow-400" /> Kapitány
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Team Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {team.players.length}
                  </div>
                  <div className="text-xs text-gray-400">Játékos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-400">
                    {Math.floor(Math.random() * 10) + 1}
                  </div>
                  <div className="text-xs text-gray-400">Ranglista</div>
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {teams.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Még nincsenek nevezett csapatok
          </h3>
          <p className="text-gray-300 max-w-md mx-auto">
            Légy az első, aki nevez a bajnokságra! A nevezés egyszerű és gyors.
          </p>
        </motion.div>
      )}

      {/* Stats Summary */}
      {teams.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-2xl p-8 border border-purple-500/20"
        >
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {teams.length}
              </div>
              <div className="text-gray-300">Nevezett csapat</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-pink-400 mb-2">
                {teams.length * 2}
              </div>
              <div className="text-gray-300">Összes játékos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                {Math.round((teams.length / 32) * 100)}%
              </div>
              <div className="text-gray-300">Kitöltöttség</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
} 
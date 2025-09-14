'use client';

import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Clock, Trophy } from 'lucide-react';

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

interface TournamentCoverProps {
  tournament: Tournament;
}

export function TournamentCover({ tournament }: TournamentCoverProps) {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800">
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 right-20 w-40 h-40 bg-pink-500/20 rounded-full blur-xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          {/* Category Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6"
          >
            {tournament.category}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
          >
            {tournament.title}
          </motion.h1>
          
          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            {tournament.description}
          </motion.p>
        </motion.div>

        {/* Tournament Info Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto"
        >
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Calendar className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-white font-semibold">Dátum</div>
              <div className="text-white/70 text-sm">{tournament.date}</div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <MapPin className="w-8 h-8 text-pink-400 mx-auto mb-2" />
              <div className="text-white font-semibold">Helyszín</div>
              <div className="text-white/70 text-sm">{tournament.location}</div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Users className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-white font-semibold">Csapatok</div>
              <div className="text-white/70 text-sm">{tournament.currentTeams}/{tournament.maxTeams}</div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Trophy className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-white font-semibold">Nevezési díj</div>
              <div className="text-white/70 text-sm">{tournament.entryFee.toLocaleString()} Ft</div>
            </div>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          {tournament.isRegistrationOpen ? (
            <motion.button
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(139, 92, 246, 0.3)"
              }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-2xl"
            >
              Nevezés Most
            </motion.button>
          ) : (
            <motion.button
              className="bg-gray-600 text-white px-8 py-4 rounded-full font-bold text-lg cursor-not-allowed"
              disabled
            >
              Nevezés Lezárva
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
          >
            <Clock className="w-5 h-5" />
            Határidő: {tournament.registrationDeadline}
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
} 
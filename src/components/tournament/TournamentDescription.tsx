'use client';

import { motion } from 'framer-motion';
import { FileText, Calendar, MapPin, Users, Trophy } from 'lucide-react';

interface TournamentDescriptionProps {
  description: string;
}

export function TournamentDescription({ description }: TournamentDescriptionProps) {
  // Simple markdown-like parser for the description
  const parseMarkdown = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('# ')) {
          return (
            <motion.h1
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-3xl md:text-4xl font-bold text-white mb-6 mt-8 first:mt-0"
            >
              {line.substring(2)}
            </motion.h1>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <motion.h2
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-2xl md:text-3xl font-bold text-white mb-4 mt-8 first:mt-0"
            >
              {line.substring(3)}
            </motion.h2>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <motion.h3
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-xl md:text-2xl font-bold text-purple-400 mb-3 mt-6"
            >
              {line.substring(4)}
            </motion.h3>
          );
        }

        // Bold text
        if (line.includes('**')) {
          const parts = line.split('**');
          return (
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-gray-300 leading-relaxed mb-4"
            >
              {parts.map((part, partIndex) => 
                partIndex % 2 === 1 ? (
                  <strong key={partIndex} className="text-white font-semibold">
                    {part}
                  </strong>
                ) : (
                  part
                )
              )}
            </motion.p>
          );
        }

        // List items
        if (line.startsWith('- ')) {
          return (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-gray-300 leading-relaxed mb-2 flex items-start gap-3"
            >
              <span className="text-purple-400 mt-2 flex-shrink-0">•</span>
              <span>{line.substring(2)}</span>
            </motion.li>
          );
        }

        // Empty lines
        if (line.trim() === '') {
          return <div key={index} className="h-4" />;
        }

        // Regular paragraphs
        return (
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="text-gray-300 leading-relaxed mb-4"
          >
            {line}
          </motion.p>
        );
      });
  };

  return (
    <div className="space-y-12">
      {/* Section Title */}
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Részletes Leírás
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Minden fontos információ a bajnokságról részletesen
        </p>
      </div>

      {/* Description Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 border border-gray-700"
      >
        {/* Content Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Bajnokság Információk</h3>
            <p className="text-gray-400">Részletes leírás és szabályok</p>
          </div>
        </div>

        {/* Parsed Content */}
        <div className="prose prose-invert max-w-none">
          {parseMarkdown(description)}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 p-6 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-2xl border border-purple-500/20"
        >
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Készen állsz a kihívásra?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Ne hagyd ki ezt a fantasztikus eseményt! Csatlakozz a legjobb sörpong játékosokhoz és mutasd meg, ki a legjobb!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
              >
                Nevezés Most
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
              >
                Megosztás
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
} 
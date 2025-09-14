'use client';

import { motion } from 'framer-motion';
import { LucideIcon, Users, Trophy, BarChart3 } from 'lucide-react';
import { clsx } from 'clsx';

interface FeatureCardProps {
  icon: 'Users' | 'Trophy' | 'BarChart3';
  title: string;
  description: string;
  gradient: string;
}

const iconMap = {
  Users,
  Trophy,
  BarChart3,
};

export function FeatureCard({ icon, title, description, gradient }: FeatureCardProps) {
  const IconComponent = iconMap[icon];

  return (
    <motion.div
      whileHover={{ y: -10 }}
      className="group relative"
    >
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 h-full border border-gray-700 hover:border-purple-500 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 overflow-hidden">
        {/* Background Gradient Overlay */}
        <div className={clsx(
          "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br",
          gradient
        )} />
        
        {/* Icon */}
        <div className="relative z-10 mb-6">
          <div className={clsx(
            "w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br",
            gradient
          )}>
            <IconComponent className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-400 transition-colors">
            {title}
          </h3>
          <p className="text-gray-300 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Border Glow Effect */}
        <div className={clsx(
          "absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br",
          gradient,
          "blur-xl scale-110"
        )} />
      </div>
    </motion.div>
  );
} 
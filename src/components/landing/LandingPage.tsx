'use client';

import { motion } from 'framer-motion';
import { Hero } from './Hero';
import { EventSlider } from './EventSlider';
import { FeatureCard } from './FeatureCard';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <Hero />
      
      {/* Events Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Következő Események
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Csatlakozz a legnagyobb sörpong versenyekhez és mutasd meg, ki a legjobb!
            </p>
          </motion.div>
          <EventSlider />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Miért Bpong.hu?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Modern platform, professzionális szervezés, és egy közösség, ahol a sörpong új szintre emelkedik
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <FeatureCard
                icon="Users"
                title="Csapatregisztráció"
                description="Regisztráld csapatodat percek alatt és indulj el a versenyeken"
                gradient="from-blue-500 to-purple-600"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <FeatureCard
                icon="Trophy"
                title="Versenyek"
                description="Rendszeres versenyek, bajnokságok és speciális események"
                gradient="from-purple-500 to-pink-600"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <FeatureCard
                icon="BarChart3"
                title="Ranglisták"
                description="Kövesd teljesítményedet és versenyezz a legjobbakkal"
                gradient="from-pink-500 to-red-600"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 md:p-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Készen állsz a kihívásra?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Csatlakozz a Bpong.hu közösséghez és légy részese a sörpong forradalomnak!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors"
            >
              Nevezz Most
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 
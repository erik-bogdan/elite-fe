'use client';

import { motion } from 'framer-motion';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  participants: number;
  maxParticipants: number;
  image: string;
  category: string;
}

const events: Event[] = [
  {
    id: 1,
    title: "Nyári Bajnokság 2024",
    date: "2024.07.15",
    location: "Budapest, Szabadság tér",
    participants: 24,
    maxParticipants: 32,
    image: "/bg.png",
    category: "Bajnokság"
  },
  {
    id: 2,
    title: "Egyetemi Kupácska",
    date: "2024.06.28",
    location: "Debrecen, Egyetem tér",
    participants: 16,
    maxParticipants: 16,
    image: "/bg.png",
    category: "Kupa"
  },
  {
    id: 3,
    title: "Baráti Torna",
    date: "2024.07.05",
    location: "Szeged, Dóm tér",
    participants: 8,
    maxParticipants: 16,
    image: "/bg.png",
    category: "Torna"
  },
  {
    id: 4,
    title: "Profi Ligácska",
    date: "2024.07.22",
    location: "Miskolc, Városház tér",
    participants: 12,
    maxParticipants: 20,
    image: "/bg.png",
    category: "Liga"
  },
  {
    id: 5,
    title: "Hősök Tere Kupácska",
    date: "2024.08.10",
    location: "Budapest, Hősök tere",
    participants: 20,
    maxParticipants: 24,
    image: "/bg.png",
    category: "Kupa"
  },
  {
    id: 6,
    title: "Szeptemberi Bajnokság",
    date: "2024.09.15",
    location: "Győr, Széchenyi tér",
    participants: 18,
    maxParticipants: 28,
    image: "/bg.png",
    category: "Bajnokság"
  }
];

export function EventSlider() {
  return (
    <div className="relative">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={24}
        slidesPerView={1}
        navigation={{
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        }}
        pagination={{
          clickable: true,
          el: '.swiper-pagination',
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        breakpoints={{
          640: {
            slidesPerView: 2,
          },
          1024: {
            slidesPerView: 3,
          },
        }}
        className="event-swiper"
      >
        {events.map((event, index) => (
          <SwiperSlide key={event.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative h-full"
            >
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 h-full border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
                {/* Event Image */}
                <div className="relative mb-6">
                  <div className="w-full h-48 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <div className="text-white text-4xl font-bold">🏓</div>
                  </div>
                  <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {event.category}
                  </div>
                </div>

                {/* Event Info */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                    {event.title}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-4 h-4" />
                      <span>{event.date}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-300">
                      <Users className="w-4 h-4" />
                      <span>{event.participants}/{event.maxParticipants} résztvevő</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(event.participants / event.maxParticipants) * 100}%` }}
                    />
                  </div>

                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                  >
                    Jelentkezés
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <div className="swiper-button-prev !text-white !bg-white/10 !backdrop-blur-sm !w-12 !h-12 !rounded-full after:!text-lg after:!font-bold hover:!bg-white/20 transition-colors" />
      <div className="swiper-button-next !text-white !bg-white/10 !backdrop-blur-sm !w-12 !h-12 !rounded-full after:!text-lg after:!font-bold hover:!bg-white/20 transition-colors" />
      
      {/* Custom Pagination */}
      <div className="swiper-pagination !bottom-0 !mt-8" />

      <style jsx global>{`
        .event-swiper .swiper-button-next:after,
        .event-swiper .swiper-button-prev:after {
          font-size: 18px;
          font-weight: bold;
        }
        
        .event-swiper .swiper-pagination-bullet {
          background: #6b7280;
          opacity: 0.5;
        }
        
        .event-swiper .swiper-pagination-bullet-active {
          background: linear-gradient(to right, #8b5cf6, #ec4899);
          opacity: 1;
        }
        
        .event-swiper .swiper-button-disabled {
          opacity: 0.3;
        }
      `}</style>
    </div>
  );
} 
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, CloudSun, CloudRain, Cloud, Thermometer, CloudLightning } from 'lucide-react';

const MOCK_WEATHER = {
  current: { temp: 22, condition: 'Ensoleillé', icon: Sun, color: 'text-amber-500' },
  forecast: [
    { day: 'Lun', temp: 20, icon: CloudSun, color: 'text-blue-400' },
    { day: 'Mar', temp: 22, icon: Sun, color: 'text-amber-500' },
    { day: 'Mer', temp: 18, icon: CloudRain, color: 'text-slate-400' },
    { day: 'Jeu', temp: 21, icon: Sun, color: 'text-amber-500' },
    { day: 'Ven', temp: 23, icon: Sun, color: 'text-amber-500' },
    { day: 'Sam', temp: 24, icon: Sun, color: 'text-amber-500' },
    { day: 'Dim', temp: 22, icon: CloudSun, color: 'text-blue-400' },
  ]
};

export const WeatherWidget = () => {
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);
  const { current, forecast } = MOCK_WEATHER;
  const CurrentIcon = current.icon;

  return (
    <div className="relative">
      <button 
        onMouseEnter={() => setIsWeatherOpen(true)}
        onMouseLeave={() => setIsWeatherOpen(false)}
        className="flex items-center gap-3 px-3 py-1.5 bg-white border border-[#E2E2EA] rounded-xl hover:border-primary transition-all group shadow-sm"
      >
        <div className={`p-1 rounded-lg bg-[#F9F9FC] shadow-sm ${current.color}`}>
          <CurrentIcon className="w-4 h-4" />
        </div>
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[11px] font-bold text-[#2C2A4A]">{current.temp}°C</span>
          <span className="text-[9px] text-[#2C2A4A]/70 font-medium uppercase tracking-wider">{current.condition}</span>
        </div>
      </button>

      <AnimatePresence>
        {isWeatherOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-72 bg-white rounded-[20px] shadow-2xl border border-[#E2E2EA] overflow-hidden z-[100] p-4"
          >
            <h4 className="text-[9px] font-bold text-[#2C2A4A]/50 uppercase tracking-[2px] mb-3 px-1">Prévisions Flowtym</h4>
            <div className="grid grid-cols-7 gap-1">
              {forecast.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5 p-1 rounded-lg hover:bg-[#F9F9FC] transition-colors">
                    <span className="text-[9px] font-bold text-[#2C2A4A]/40">{f.day}</span>
                    <Icon className={`w-3.5 h-3.5 ${f.color}`} />
                    <span className="text-[9px] font-bold text-[#2C2A4A]">{f.temp}°</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Activity, AppTab, Coordinates } from './types';
import { INITIAL_ITINERARY, SHIP_ONBOARD_TIME } from './constants';
import Timeline from './components/Timeline';
import Budget from './components/Budget';
import Guide from './components/Guide';
import MapComponent from './components/Map';
import { CalendarClock, Map as MapIcon, Wallet, BookOpen, Anchor, Headphones, X, Play, Square } from 'lucide-react';

const STORAGE_KEY = 'florence_guide_v1_storage';

const App: React.FC = () => {
  const [itinerary, setItinerary] = useState<Activity[]>(INITIAL_ITINERARY);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.TIMELINE);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [mapFocus, setMapFocus] = useState<Coordinates | null>(null);
  const [countdown, setCountdown] = useState<string>('00h 00m 00s');
  
  const [audioGuideActivity, setAudioGuideActivity] = useState<Activity | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Remove initial loader
    const loader = document.getElementById('initial-loader');
    if (loader) {
      setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
      }, 500);
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = INITIAL_ITINERARY.map(initItem => {
          const savedItem = parsed.find((p: Activity) => p.id === initItem.id);
          return savedItem ? { ...initItem, completed: savedItem.completed } : initItem;
        });
        setItinerary(merged);
      }
    } catch (e) {
      console.warn("Storage fallido", e);
    }
  }, []);

  const handleToggleComplete = (id: string) => {
    const newItinerary = itinerary.map(act => 
      act.id === id ? { ...act, completed: !act.completed } : act
    );
    setItinerary(newItinerary);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItinerary));
  };

  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("GPS no disponible", err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const [hours, minutes] = SHIP_ONBOARD_TIME.split(':').map(Number);
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);
      const diff = target.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown("¡A BORDO!");
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLocate = (coords: Coordinates) => {
    setMapFocus(coords);
    setActiveTab(AppTab.MAP);
  };

  const handlePlayAudio = () => {
    if (!audioGuideActivity?.audioGuideText) return;
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(audioGuideActivity.audioGuideText);
      utterance.lang = 'es-ES';
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-stone-50 text-stone-900 font-sans overflow-hidden">
      <header className="bg-rose-900 text-white p-4 shadow-xl z-20 flex justify-between items-center shrink-0 border-b border-rose-800">
        <div className="flex items-center">
          <Anchor className="mr-3 text-amber-400" size={24} />
          <div>
            <h1 className="font-black text-[10px] uppercase tracking-[0.2em] text-rose-200">Escala Florencia</h1>
            <p className="text-[12px] font-bold text-white/95 leading-tight">15 Abril 2026</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-black uppercase text-amber-400 tracking-widest mb-0.5">Cuenta atrás</span>
          <div className="text-lg font-black font-mono text-white leading-none tracking-tighter">{countdown}</div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {activeTab === AppTab.TIMELINE && (
          <div className="h-full overflow-y-auto no-scrollbar">
             <Timeline 
               itinerary={itinerary} 
               onToggleComplete={handleToggleComplete}
               onLocate={handleLocate}
               userLocation={userLocation}
               onOpenAudioGuide={(act) => setAudioGuideActivity(act)}
             />
          </div>
        )}
        
        {activeTab === AppTab.MAP && (
          <MapComponent 
            activities={itinerary} 
            userLocation={userLocation}
            focusedLocation={mapFocus}
          />
        )}

        {activeTab === AppTab.BUDGET && <Budget itinerary={itinerary} />}
        {activeTab === AppTab.GUIDE && <Guide userLocation={userLocation} />}

        {audioGuideActivity && (
          <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-rose-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-rose-100 p-3 rounded-2xl border border-rose-200">
                    <Headphones size={24} className="text-rose-700" />
                  </div>
                  <button onClick={() => { window.speechSynthesis.cancel(); setIsPlaying(false); setAudioGuideActivity(null); }} className="text-stone-300 hover:text-stone-600 transition-colors">
                    <X size={28} />
                  </button>
                </div>
                
                <h3 className="text-xs font-black text-rose-400 uppercase tracking-[0.2em] mb-2">Audioguía</h3>
                <h4 className="text-xl font-black text-stone-800 mb-6 leading-tight">{audioGuideActivity.title}</h4>
                
                <div className="max-h-[300px] overflow-y-auto pr-2 custom-h-scrollbar mb-8">
                  <p className="text-stone-600 leading-relaxed font-medium italic">
                    {audioGuideActivity.audioGuideText}
                  </p>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={handlePlayAudio}
                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-3xl font-black uppercase tracking-widest text-sm transition-all shadow-lg active:scale-95 ${
                      isPlaying ? 'bg-amber-600 text-white shadow-amber-200' : 'bg-rose-900 text-white shadow-rose-200'
                    }`}
                  >
                    {isPlaying ? <Square size={18} fill="white" /> : <Play size={18} fill="white" />}
                    {isPlaying ? 'Detener' : 'Escuchar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="bg-white/95 backdrop-blur-md border-t border-stone-100 z-30 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-20 px-2 pb-safe">
          {[
            { id: AppTab.TIMELINE, icon: CalendarClock, label: 'Itinerario' },
            { id: AppTab.MAP, icon: MapIcon, label: 'Mapa' },
            { id: AppTab.BUDGET, icon: Wallet, label: 'Gastos' },
            { id: AppTab.GUIDE, icon: BookOpen, label: 'Guía' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center w-full justify-center transition-all ${activeTab === tab.id ? 'text-rose-800' : 'text-stone-400'}`}>
              <div className={`p-2 rounded-xl mb-1 ${activeTab === tab.id ? 'bg-rose-50 shadow-sm' : ''}`}>
                <tab.icon size={22} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default App;

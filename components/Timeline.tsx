
import React, { useState, useEffect } from 'react';
import { Activity } from '../types';
import { CheckCircle2, Circle, MapPin, AlertTriangle, Clock, ArrowRight, ExternalLink, Navigation, AlertCircle, Headphones, Ticket } from 'lucide-react';
import { calculateDuration, calculateTimeProgress, formatMinutes } from '../services/utils';

interface TimelineProps {
  itinerary: Activity[];
  onToggleComplete: (id: string) => void;
  onLocate: (coords: { lat: number, lng: number }, endCoords?: { lat: number, lng: number }) => void;
  userLocation: { lat: number, lng: number } | null;
  onOpenAudioGuide: (act: Activity) => void;
}

const Timeline: React.FC<TimelineProps> = ({ itinerary, onToggleComplete, onLocate, userLocation, onOpenAudioGuide }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const calculateGap = (endStrPrev: string, startStrNext: string) => {
    const [endH, endM] = endStrPrev.split(':').map(Number);
    const [startH, startM] = startStrNext.split(':').map(Number);
    const diffMins = (startH * 60 + startM) - (endH * 60 + endM);
    return diffMins > 0 ? diffMins : 0;
  };

  const getStatusColor = (act: Activity) => {
    if (act.completed) return 'border-emerald-500 bg-emerald-50 bg-opacity-30';
    if (act.notes === 'CRITICAL') return 'border-amber-500 bg-amber-50';
    return 'border-rose-100 bg-white';
  };

  return (
    <div className="pb-24 px-4 pt-4 max-w-lg mx-auto">
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl font-bold text-rose-900 uppercase tracking-tight">Ruta Florencia</h2>
        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-md border border-rose-100">Sync Online</span>
      </div>
      
      <div className="relative border-l-2 border-stone-200 ml-3 space-y-8">
        {itinerary.map((act, idx) => {
          const prevAct = idx > 0 ? itinerary[idx - 1] : null;
          const gap = prevAct ? calculateGap(prevAct.endTime, act.startTime) : 0;
          const isCritical = act.notes === 'CRITICAL';
          const duration = calculateDuration(act.startTime, act.endTime);
          
          const actProgress = calculateTimeProgress(act.startTime, act.endTime);
          const gapProgress = prevAct ? calculateTimeProgress(prevAct.endTime, act.startTime) : 0;
          
          return (
            <React.Fragment key={act.id}>
              {gap > 0 && prevAct && (
                <div className="relative ml-0 my-8">
                    <div className="absolute left-[-2px] top-[-20px] bottom-[-20px] border-l-2 border-dashed border-stone-300"></div>
                    <div className="ml-6 flex items-center">
                        <div className="bg-stone-50/80 backdrop-blur-sm px-4 py-3 rounded-2xl border border-stone-200 flex flex-col shadow-sm w-full max-w-[240px]">
                            <div className="flex items-center mb-2">
                                <div className="bg-stone-200 p-1.5 rounded-full mr-3 border border-stone-300">
                                    <Clock size={12} className="text-stone-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Traslado</span>
                                    <span className="text-[10px] font-bold text-stone-600 uppercase">
                                        {formatMinutes(gap)} — {gap > 30 ? 'Paseo Libre' : 'Caminata'}
                                    </span>
                                </div>
                            </div>
                            <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-stone-400 transition-all duration-1000" 
                                    style={{ width: `${gapProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
              )}

              <div className="mb-8 ml-6 relative">
                <div 
                    className={`absolute -left-[31px] top-0 rounded-full bg-white border-2 cursor-pointer transition-all z-10 ${
                    act.completed ? 'border-emerald-500 text-emerald-500 shadow-sm' : 'border-rose-700 text-rose-700 shadow-sm'
                    }`}
                    onClick={() => onToggleComplete(act.id)}
                >
                    {act.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </div>

                <div className={`rounded-2xl border shadow-sm transition-all overflow-hidden ${getStatusColor(act)} ${act.completed ? 'opacity-70' : 'shadow-md'}`}>
                    <div className="w-full h-1.5 bg-stone-100 overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-1000 ${actProgress === 100 ? 'bg-stone-300' : 'bg-rose-800'}`} 
                            style={{ width: `${actProgress}%` }}
                        ></div>
                    </div>

                    <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 tracking-tighter uppercase">
                                {act.startTime} - {act.endTime}
                                </span>
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                                {duration}
                                </span>
                            </div>
                            <h3 className="font-bold text-lg text-stone-800 leading-tight">{act.title}</h3>
                        </div>
                        {isCritical && <AlertTriangle className="text-amber-500 animate-pulse" size={20} />}
                        </div>

                        <div className="mb-3 text-sm text-stone-600 flex items-center flex-wrap gap-1">
                            <MapPin size={14} className="mr-0.5 text-rose-700"/> 
                            <span className="font-medium">{act.locationName}</span>
                            {act.endLocationName && (
                                <>
                                    <ArrowRight size={12} className="mx-1 text-stone-400" />
                                    <span className="font-medium">{act.endLocationName}</span>
                                </>
                            )}
                        </div>

                        <p className="text-sm text-stone-600 mb-4 leading-relaxed whitespace-pre-line">{act.description}</p>
                        
                        {act.contingencyNote && (
                            <div className="bg-amber-50 p-2 rounded-lg text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-3 flex items-center border border-amber-100">
                                <AlertCircle size={12} className="mr-2" />
                                {act.contingencyNote}
                            </div>
                        )}

                        <div className="bg-stone-50 p-3 rounded-xl text-sm text-stone-700 italic border-l-4 border-rose-500 mb-4">
                        "{act.keyDetails}"
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-4 border-t border-stone-50">
                            <button 
                                onClick={() => onLocate(act.coords, act.endCoords)}
                                className="flex items-center text-[10px] font-bold text-stone-600 bg-stone-100 px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-200 shadow-sm transition-colors"
                            >
                                <Navigation size={12} className="mr-1.5" />
                                UBICACIÓN
                            </button>

                            {act.audioGuideText && (
                                <button onClick={() => onOpenAudioGuide(act)} className="flex items-center text-[10px] font-bold text-rose-700 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100 shadow-sm active:bg-rose-100">
                                    <Headphones size={12} className="mr-1.5" /> AUDIOGUÍA
                                </button>
                            )}
                            
                            {act.bookingUrl && (
                                <a href={act.bookingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 hover:bg-emerald-100 shadow-sm transition-colors">
                                    <Ticket size={12} className="mr-1.5" /> TICKETS
                                </a>
                            )}

                            {act.googleMapsUrl && (
                                <a href={act.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-[10px] font-bold text-stone-600 bg-white px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 shadow-sm transition-colors">
                                    <ExternalLink size={12} className="mr-1.5" /> GOOGLE MAPS
                                </a>
                            )}
                            
                            <div className="ml-auto">
                                <button
                                onClick={() => onToggleComplete(act.id)}
                                className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                                    act.completed 
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                    : 'bg-rose-900 text-white shadow-md active:scale-95'
                                }`}
                                >
                                {act.completed ? 'Hecho' : 'Completar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AI_TOOLS } from '../constants';
import { MediaItem } from '../types';
import { 
  Sparkles, 
  Maximize, 
  Palette, 
  Eraser, 
  Loader2, 
  MapPin, 
  Camera, 
  Video, 
  FileText, 
  Info,
  Type,
  UserMinus,
  Music,
  CheckCircle2,
  AlertCircle,
  Play
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AIEditorViewProps {
  media: MediaItem[];
}

export function AIEditorView({ media }: AIEditorViewProps) {
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(media[0] || null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [bgRemoved, setBgRemoved] = useState(false);

  const handleProcess = () => {
    setIsProcessing(true);
    setIsDone(false);
    
    // Reset specific tool states
    if (activeTool === 'remove_bg') setBgRemoved(false);
    if (activeTool === 'subtitles') setShowSubtitles(false);

    setTimeout(() => {
      setIsProcessing(false);
      setIsDone(true);
      
      // Apply tool specific visual results
      if (activeTool === 'remove_bg') setBgRemoved(true);
      if (activeTool === 'subtitles') setShowSubtitles(true);
    }, 2500);
  };

  const icons: Record<string, any> = {
    'Maximize': Maximize,
    'Palette': Palette,
    'Eraser': Eraser,
    'Type': Type,
    'UserMinus': UserMinus,
    'Music': Music
  };

  const mockSubtitles = [
    { time: '00:01', text: 'Bem-vindos à nossa jornada nas Ilhas Lofton.' },
    { time: '00:04', text: 'Hoje vamos explorar os picos cobertos de neve.' },
    { time: '00:08', text: 'A luz do sol reflete no mar calmo e profundo.' },
  ];

  return (
    <div className="flex h-full bg-slate-50">
      {/* Center: Major Preview */}
      <div className="flex-1 flex flex-col p-8 overflow-hidden bg-slate-50">
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
               <Sparkles className="w-5 h-5" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-slate-800 tracking-tight">Estúdio de Inteligência Artificial</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Potencializado por Lumina Core Engine</p>
             </div>
           </div>
           <div className="flex gap-2">
             <Button variant="outline" size="sm" className="bg-white shadow-sm h-9 text-xs font-semibold border-slate-200 text-slate-800">Ver Original</Button>
             <Button variant="outline" size="sm" className="bg-white shadow-sm h-9 text-xs font-semibold border-slate-200 text-indigo-600">Feedback IA</Button>
           </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-5xl bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-200 p-6 flex flex-col items-center justify-center overflow-hidden">
             {selectedImage ? (
                <div className="relative h-full w-full flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden shadow-inner group">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={selectedImage.url + bgRemoved}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: bgRemoved ? 1.1 : 1 }}
                        exit={{ opacity: 0 }}
                        className="relative h-full w-full flex items-center justify-center"
                      >
                        <img 
                          src={selectedImage.url} 
                          className={cn(
                            "max-h-full max-w-full object-contain transition-all duration-1000",
                            isProcessing && "scale-105 blur-md opacity-40",
                            isDone && activeTool === 'colorizer' && "sepia-0 grayscale-0 contrast-125 saturate-150",
                            isDone && activeTool === 'upscale' && "brightness-105 contrast-110",
                            bgRemoved && "drop-shadow-[0_20px_50px_rgba(79,70,229,0.3)] filter brightness-110"
                          )}
                          style={{
                            clipPath: bgRemoved ? 'circle(45% at 50% 50%)' : 'none',
                          }}
                          referrerPolicy="no-referrer"
                        />
                        
                        {bgRemoved && (
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
                        )}

                        {showSubtitles && (
                          <div className="absolute bottom-16 left-10 right-10 flex flex-col items-center gap-4 pointer-events-none">
                            <motion.div 
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-2xl"
                            >
                               <p className="text-white text-lg font-bold tracking-tight text-center">
                                 "Bem-vindos à nossa jornada nas <span className="text-indigo-400">Ilhas Lofton</span>."
                               </p>
                            </motion.div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                    
                    {isProcessing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-xl z-20">
                        <div className="flex flex-col items-center gap-4">
                           <div className="relative">
                            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-indigo-400 animate-pulse" />
                           </div>
                           <div className="text-center space-y-1">
                             <span className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.3em]">
                               {activeTool === 'subtitles' ? 'Transcrevendo Áudio...' : 
                                activeTool === 'remove_bg' ? 'Recortando Objeto...' : 
                                activeTool === 'beat_sync' ? 'Analisando BPM...' : 
                                'Redimensionando com IA...'}
                             </span>
                             <p className="text-[9px] text-slate-400 font-bold uppercase">Rede Neural Gemini Pro Vision v1.2</p>
                           </div>
                        </div>
                      </div>
                    )}

                    {!isProcessing && isDone && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-30"
                      >
                         <div className="bg-white/90 backdrop-blur-xl px-4 py-2 rounded-full border border-white shadow-2xl flex items-center gap-3">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
                            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">Processamento concluído com sucesso</span>
                         </div>
                         <div className="flex gap-2 text-slate-800">
                           <Button variant="outline" className="bg-white/80 hover:bg-white rounded-full h-10 border-slate-200">Reverter</Button>
                           <Button className="bg-indigo-600 hover:bg-slate-900 transition-all shadow-xl shadow-indigo-500/30 rounded-full h-10 px-6 font-bold uppercase text-[10px] tracking-widest text-white">Salvar Mídia</Button>
                         </div>
                      </motion.div>
                    )}

                    {activeTool === 'beat_sync' && isDone && (
                      <div className="absolute top-10 left-10 flex gap-1 items-end h-12">
                        {[0.4, 0.7, 1, 0.8, 0.4, 0.9, 0.5, 0.2].map((h, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: `${h * 100}%` }}
                            transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1, repeatType: 'reverse' }}
                            className="w-1.5 bg-indigo-500 rounded-full"
                          />
                        ))}
                        <span className="ml-3 text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">128 BPM Sync</span>
                      </div>
                    )}
                </div>
             ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto transform rotate-12">
                    <Sparkles className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-400 font-semibold tracking-tight">Selecione um arquivo de mídia para começar</p>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Right: Inspection Panel */}
      <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-2xl relative z-10">
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <div className="w-full aspect-video bg-slate-100 rounded-2xl border border-slate-200 mb-4 flex items-center justify-center overflow-hidden shadow-inner relative group">
                {selectedImage ? (
                  <>
                    <img src={selectedImage.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <p className="text-white text-[10px] font-bold uppercase tracking-widest">{selectedImage.name}</p>
                    </div>
                  </>
                ) : (
                  <span className="text-slate-400 text-xs italic">Aguardando Seleção</span>
                )}
              </div>
            </div>

            <div className="pt-2 space-y-6">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1 border-l-2 border-indigo-500 ml-1">Kit de Ferramentas IA</h4>
              
              <div className="grid grid-cols-2 gap-3">
                {AI_TOOLS.map(tool => {
                  const Icon = icons[tool.icon] || Sparkles;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        setActiveTool(tool.id);
                        setIsDone(false);
                        setShowSubtitles(false);
                        setBgRemoved(false);
                      }}
                      className={cn(
                        "flex flex-col items-start justify-between gap-3 p-4 border rounded-3xl transition-all group relative overflow-hidden h-32",
                        activeTool === tool.id 
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-500/30" 
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-sm text-slate-800"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                        activeTool === tool.id ? "bg-white/20" : "bg-slate-100 group-hover:bg-indigo-50"
                      )}>
                        <Icon className={cn("w-5 h-5", activeTool === tool.id ? "text-white" : "text-indigo-500")} />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase leading-none block">{tool.name}</span>
                        <p className={cn("text-[8px] leading-tight font-medium line-clamp-2", activeTool === tool.id ? "text-indigo-100" : "text-slate-400")}>
                          {tool.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {activeTool === 'subtitles' && isDone && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h5 className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Transcrição Gerada</h5>
                  <div className="space-y-2">
                    {mockSubtitles.map((sub, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-[8px] font-mono text-indigo-500 mt-0.5">{sub.time}</span>
                        <p className="text-[9px] leading-snug text-slate-600 font-medium italic text-slate-800">{sub.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === 'beat_sync' && (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <Music className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="text-[10px] font-bold text-indigo-900 uppercase">Trilha Sonora Ativa</span>
                    </div>
                    <select className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-700 outline-none">
                      <option>Upbeat Cinematic (Recommended)</option>
                      <option>Deep House Summer</option>
                      <option>Acoustic Gentle</option>
                    </select>
                  </div>
                </div>
              )}
              
              <Button 
                className="w-full py-8 bg-slate-900 hover:bg-indigo-600 text-white rounded-3xl text-xs font-bold uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 disabled:opacity-50"
                disabled={!activeTool || isProcessing}
                onClick={handleProcess}
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                {isProcessing ? 'Processando Core...' : 'Aplicar Mágica IA'}
              </Button>
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-slate-100 bg-white">
           <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase mb-2">
             <span>Lumina Pro v2.4</span>
             <span className="text-indigo-500 font-black">Acesso Ilimitado</span>
           </div>
           <Progress value={isProcessing ? 45 : 100} className="h-1 bg-slate-100" />
        </div>
      </aside>
    </div>
  );
}

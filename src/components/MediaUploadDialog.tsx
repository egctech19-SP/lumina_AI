/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMedia } from '../MediaContext';
import { MediaItem } from '../types';
import { analyzeImage } from '../services/geminiService';
import { Upload, File, X, Loader2, CheckCircle2, Plus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MediaUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MediaUploadDialog({ open, onOpenChange }: MediaUploadDialogProps) {
  const { addMedia } = useMedia();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'video/*': ['.mp4', '.webm']
    }
  });

  const handleUpload = async () => {
    setUploading(true);
    setProgress(0);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Simulate reading and AI analysis
      const reader = new FileReader();
      const fileContent = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      const base64Data = fileContent.split(',')[1];
      
      // Call Gemini for initial tagging if image
      let aiData = null;
      if (file.type.startsWith('image/')) {
        aiData = await analyzeImage(base64Data, file.type);
      }

      const mediaItem: MediaItem = {
        id: Math.random().toString(36).substring(7),
        name: file.name,
        url: fileContent,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        mimeType: file.type,
        size: file.size,
        createdAt: Date.now(),
        tags: aiData?.tags || ['uploaded'],
        aiQualityScore: aiData?.qualityScore || 0.8,
        isBlurry: aiData?.isBlurry || false,
        source: 'local'
      };

      addMedia(mediaItem);
      setProgress(((i + 1) / files.length) * 100);
    }

    setUploading(false);
    setFiles([]);
    onOpenChange(false);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <Tabs defaultValue="local" className="w-full">
          <div className="px-6 pt-6 bg-slate-50 border-b border-slate-100">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Adicionar Mídia</DialogTitle>
              <DialogDescription className="text-slate-500 font-medium tracking-tight">
                Seus arquivos serão analisados pela IA para organização automática.
              </DialogDescription>
            </DialogHeader>
            <TabsList className="bg-slate-200/50 p-1 rounded-xl mb-4">
              <TabsTrigger value="local" className="rounded-lg text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Local</TabsTrigger>
              <TabsTrigger value="cloud" className="rounded-lg text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Nuvem</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="local" className="mt-0 space-y-6">
              <div 
                {...getRootProps()} 
                className={`
                  border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer bg-slate-50/50
                  ${isDragActive ? 'border-indigo-500 bg-indigo-50/50 scale-[0.98]' : 'border-slate-200 hover:border-indigo-400 hover:bg-white shadow-inner'}
                `}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-slate-100 transform -rotate-6 transition-transform hover:rotate-0">
                  <Upload className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-800">Clique ou arraste arquivos aqui</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Imagens até 20MB, Vídeos até 100MB</p>
                </div>
              </div>

              {files.length > 0 && (
                <div className="max-h-48 overflow-auto space-y-2 py-2 pr-2 custom-scrollbar">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl text-xs group shadow-sm">
                      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                        <File className="w-4 h-4 text-indigo-500" />
                      </div>
                      <span className="flex-1 truncate font-semibold text-slate-700">{file.name}</span>
                      <span className="text-slate-400 font-bold">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                      <button onClick={() => removeFile(i)} className="p-1 px-2 text-slate-400 hover:text-rose-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cloud" className="mt-0 space-y-6 min-h-[300px] flex flex-col justify-center">
              <div className="grid grid-cols-2 gap-4">
                 {[
                   { id: 'onedrive', name: 'OneDrive', icon: '☁️' },
                   { id: 'gdrive', name: 'Drive', icon: '📁' },
                   { id: 'gphotos', name: 'Fotos', icon: '📸' }
                 ].map(cloud => (
                   <button key={cloud.id} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group">
                     <span className="text-3xl group-hover:scale-125 transition-transform">{cloud.icon}</span>
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">{cloud.name}</span>
                   </button>
                 ))}
                 <button className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-50 border border-slate-200 border-dashed rounded-[2rem] text-slate-400 hover:text-indigo-600 hover:border-indigo-400 transition-all">
                    <Plus className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Nova Fonte</span>
                 </button>
              </div>
              <p className="text-[10px] text-center text-slate-400 font-medium px-8 italic">
                Escolha um serviço para importar arquivos de álbuns ou pastas remotas indexadas.
              </p>
            </TabsContent>

            {uploading && (
              <div className="space-y-3 py-4 bg-white rounded-2xl border border-indigo-100 p-4 shadow-lg shadow-indigo-500/5">
                <div className="flex justify-between text-[10px] font-bold text-indigo-900 uppercase tracking-widest">
                  <span>Otimizando com Lumina IA...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1 bg-indigo-50" />
              </div>
            )}

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={uploading} className="rounded-xl font-bold uppercase tracking-widest text-[10px] text-slate-400">
                Cancelar
              </Button>
              <Button 
                size="sm" 
                disabled={files.length === 0 || uploading} 
                onClick={handleUpload}
                className="px-8 py-6 rounded-2xl bg-indigo-600 hover:bg-slate-900 shadow-xl shadow-indigo-500/20 font-bold uppercase tracking-widest text-[10px]"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                {uploading ? 'Processando...' : 'Importar Arquivos'}
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

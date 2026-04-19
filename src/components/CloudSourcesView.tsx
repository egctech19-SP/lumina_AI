/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Cloud, CheckCircle2, RefreshCw, Plus, ShieldCheck,
  ExternalLink, FolderOpen, Lock, Loader2, Trash2,
  User, Search, FileText, Image, Film, AlertCircle
} from 'lucide-react';
import { CloudSource } from '../types';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { supabase } from '../lib/supabase';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGoogleLogin } from '@react-oauth/google';
import { loginRequest, MICROSOFT_CLIENT_ID, GOOGLE_SCOPES } from '@/lib/authConfig';

// Safe MSAL hook — only used when MsalProvider is present
function useSafeMsal() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useMsal } = require('@azure/msal-react');
    return useMsal();
  } catch {
    return { instance: null, accounts: [] };
  }
}


// ─── Types ─────────────────────────────────────────────────────────────────
interface DriveFolder {
  id: string;
  name: string;
  size?: string;
  count?: number;
  mimeType?: string;
}

interface DriveUserInfo {
  name: string;
  email: string;
}

// ─── Provider Config ────────────────────────────────────────────────────────
const AVAILABLE_PROVIDERS = [
  {
    id: 'gdrive',
    name: 'Google Drive',
    icon: '📁',
    color: 'bg-emerald-600',
    hoverColor: 'hover:bg-emerald-700',
    description: 'Acesse documentos e pastas compartilhadas',
    realAuth: true,
  },
  {
    id: 'onedrive',
    name: 'Microsoft OneDrive',
    icon: '☁️',
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    description: 'Sincronize arquivos do Windows e Office 365',
    realAuth: !!MICROSOFT_CLIENT_ID,
  },
  {
    id: 'gphotos',
    name: 'Google Fotos',
    icon: '📸',
    color: 'bg-rose-500',
    hoverColor: 'hover:bg-rose-600',
    description: 'Importe sua biblioteca completa de memórias',
    realAuth: false,
  }
];

// ─── Helper: File icon ─────────────────────────────────────────────────────
const FileIcon = ({ mimeType }: { mimeType?: string }) => {
  if (mimeType?.startsWith('image/')) return <Image className="w-4 h-4 text-rose-400" />;
  if (mimeType?.startsWith('video/')) return <Film className="w-4 h-4 text-violet-400" />;
  if (mimeType === 'application/vnd.google-apps.folder') return <FolderOpen className="w-4 h-4 text-amber-400" />;
  return <FileText className="w-4 h-4 text-slate-400" />;
};

// ─── Main Component ─────────────────────────────────────────────────────────
export function CloudSourcesView() {
  const { instance: msalInstance } = useSafeMsal();

  const [sources, setSources] = useState<CloudSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncingSource, setSyncingSource] = useState<string | null>(null);

  // Folder picker state
  const [showFolderStep, setShowFolderStep] = useState(false);
  const [activeProvider, setActiveProvider] = useState<any>(null);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [driveUser, setDriveUser] = useState<DriveUserInfo | null>(null);
  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [folderSearch, setFolderSearch] = useState('');
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load from Supabase ───────────────────────────────────────────────────
  useEffect(() => {
    async function fetchSources() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('cloud_sources')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        const mapped: CloudSource[] = (data || []).map(item => ({
          id: item.id,
          provider: item.provider,
          name: item.name,
          email: item.email,
          status: item.status,
          lastSync: new Date(item.last_sync).getTime(),
          usage: { used: Number(item.usage_used), total: Number(item.usage_total) }
        }));
        setSources(mapped);
      } catch (e) {
        console.error("Failed to fetch cloud sources", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSources();
  }, []);

  // ── Google Drive: list folders ───────────────────────────────────────────
  const fetchGoogleFolders = useCallback(async (token: string) => {
    setLoadingFolders(true);
    try {
      const res = await fetch(
        "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false&fields=files(id,name,mimeType)&pageSize=50",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setDriveFolders(data.files || []);
    } catch (e: any) {
      setError(`Erro ao listar pastas: ${e.message}`);
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  // ── Google Drive: get user info ──────────────────────────────────────────
  const fetchGoogleUser = useCallback(async (token: string) => {
    const res = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    return { name: data.name, email: data.email } as DriveUserInfo;
  }, []);

  // ── Google Login Hook ────────────────────────────────────────────────────
  const googleLogin = useGoogleLogin({
    scope: GOOGLE_SCOPES,
    onSuccess: async (tokenResponse) => {
      try {
        setConnecting('gdrive');
        const token = tokenResponse.access_token;
        setDriveToken(token);
        const [user] = await Promise.all([
          fetchGoogleUser(token),
          fetchGoogleFolders(token),
        ]);
        setDriveUser(user);
        setActiveProvider(AVAILABLE_PROVIDERS.find(p => p.id === 'gdrive'));
        setShowFolderStep(true);
        setConnecting(null);
      } catch (e: any) {
        setError(e.message);
        setConnecting(null);
      }
    },
    onError: (err) => {
      setError(`Login Google falhou: ${JSON.stringify(err)}`);
      setConnecting(null);
    },
  });

  // ── Microsoft OneDrive Login ─────────────────────────────────────────────
  const handleOneDriveLogin = async () => {
    if (!MICROSOFT_CLIENT_ID) {
      setError('Microsoft Client ID não configurado. Adicione VITE_MICROSOFT_CLIENT_ID no .env');
      return;
    }
    setConnecting('onedrive');
    try {
      const loginResponse = await msalInstance.loginPopup(loginRequest);
      const account = loginResponse.account;
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      // Fetch OneDrive root folders
      const res = await fetch(
        'https://graph.microsoft.com/v1.0/me/drive/root/children?$filter=folder ne null&$select=id,name,folder&$top=50',
        { headers: { Authorization: `Bearer ${tokenResponse.accessToken}` } }
      );
      const data = await res.json();

      setDriveToken(tokenResponse.accessToken);
      setDriveUser({ name: account.name || 'Usuário OneDrive', email: account.username });
      setDriveFolders((data.value || []).map((f: any) => ({ id: f.id, name: f.name })));
      setActiveProvider(AVAILABLE_PROVIDERS.find(p => p.id === 'onedrive'));
      setShowFolderStep(true);
      setConnecting(null);
    } catch (e: any) {
      setError(`OneDrive login falhou: ${e.message}`);
      setConnecting(null);
    }
  };

  // ── Handle Connect Button ─────────────────────────────────────────────────
  const handleStartConnect = (providerId: string) => {
    setError(null);
    setSelectedFolders([]);
    setDriveFolders([]);
    if (providerId === 'gdrive') {
      setConnecting('gdrive');
      googleLogin();
    } else if (providerId === 'onedrive') {
      handleOneDriveLogin();
    }
  };

  // ── Finish Connection → Save source to Supabase + token to session ──────
  const handleFinishConnection = async () => {
    if (!activeProvider || !driveUser || !driveToken) return;
    setConnecting(activeProvider.id);
    try {
      // Save the cloud source connection record
      const { data, error } = await supabase
        .from('cloud_sources')
        .insert([{
          provider: activeProvider.id,
          name: `${driveUser.name.split(' ')[0]}'s ${activeProvider.name}`,
          email: driveUser.email,
          status: 'connected',
          usage_used: 0,
          usage_total: 15 * 1024 * 1024 * 1024,
        }])
        .select()
        .single();

      if (error) throw error;

      // Save token + selected folders to sessionStorage for live access during this session
      // Images stay in Google Drive — we only store the reference
      sessionStorage.setItem('gdrive_token', driveToken);
      sessionStorage.setItem('gdrive_folders', JSON.stringify(selectedFolders));

      setSources(prev => [{
        id: data.id,
        provider: data.provider,
        name: data.name,
        email: data.email,
        status: 'connected',
        lastSync: Date.now(),
        usage: { used: 0, total: 15 * 1024 * 1024 * 1024 }
      }, ...prev]);

      setShowFolderStep(false);
      setActiveProvider(null);
      setDriveToken(null);
      setDriveUser(null);
    } catch (e: any) {
      setError(`Erro ao salvar conexão: ${e.message}`);
    } finally {
      setConnecting(null);
    }
  };


  // ── Sync ─────────────────────────────────────────────────────────────────
  const handleSync = async (id: string) => {
    setSyncingSource(id);
    try {
      await supabase.from('cloud_sources').update({ last_sync: new Date().toISOString() }).eq('id', id);
      setSources(prev => prev.map(s => s.id === id ? { ...s, lastSync: Date.now() } : s));
    } finally {
      setTimeout(() => setSyncingSource(null), 1500);
    }
  };

  // ── Disconnect ────────────────────────────────────────────────────────────
  const handleDisconnect = async (id: string) => {
    if (!confirm('Deseja realmente desconectar esta fonte?')) return;
    await supabase.from('cloud_sources').delete().eq('id', id);
    setSources(prev => prev.filter(s => s.id !== id));
  };

  const toggleFolder = (id: string) => {
    setSelectedFolders(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const filteredFolders = driveFolders.filter(f =>
    f.name.toLowerCase().includes(folderSearch.toLowerCase())
  );

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="p-10 max-w-6xl mx-auto space-y-16">

      {/* Header */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase border border-indigo-100 italic">Conexão Híbrida</span>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Fontes de Nuvem</h1>
        <p className="text-slate-500 font-medium">Gerencie integrações com serviços externos para consolidar sua biblioteca.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-700 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
          <button className="ml-auto text-rose-400 hover:text-rose-600 font-bold" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Connected Sources */}
          <section className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" /> Fontes Conectadas
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {isLoading ? (
                <div className="flex items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-3" /> Carregando...
                </div>
              ) : sources.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                  <Cloud className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                  <p className="text-slate-400 font-medium">Nenhuma fonte conectada. Adicione uma abaixo.</p>
                </div>
              ) : (
                sources.map(source => {
                  const providerInfo = AVAILABLE_PROVIDERS.find(p => p.id === source.provider);
                  return (
                    <Card key={source.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all rounded-3xl">
                      <div className="flex items-center p-6 gap-6">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-100">
                          {providerInfo?.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-900">{source.name}</h3>
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none font-bold text-[9px] uppercase tracking-tighter">
                              Conectado
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400 font-medium truncate">{source.email}</p>
                          <div className="mt-4 flex items-center gap-6">
                            <div className="flex-1">
                              <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1.5 uppercase">
                                <span>Espaço em uso</span>
                                <span className="text-slate-900">{(source.usage!.used / (1024 ** 3)).toFixed(1)}GB / {(source.usage!.total / (1024 ** 3)).toFixed(1)}GB</span>
                              </div>
                              <Progress value={(source.usage!.used / source.usage!.total) * 100} className="h-1 bg-slate-100" />
                            </div>
                            <div className="text-right whitespace-nowrap">
                              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Última Sincronia</p>
                              <p className="text-[10px] font-bold text-slate-800">
                                {new Date(source.lastSync!).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm"
                            className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border-slate-200"
                            onClick={() => handleSync(source.id)} disabled={syncingSource === source.id}
                          >
                            <RefreshCw className={cn("w-3 h-3 mr-2", syncingSource === source.id && "animate-spin")} />
                            {syncingSource === source.id ? 'Sincronizando...' : 'Sincronizar'}
                          </Button>
                          <button onClick={() => handleDisconnect(source.id)}
                            className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Desconectar
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </section>

          {/* Available Providers */}
          <section className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800">Conectar Nova Fonte</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AVAILABLE_PROVIDERS.filter(p => !sources.find(s => s.provider === p.id)).map(provider => (
                <Card key={provider.id} className="border-slate-200 bg-white rounded-3xl shadow-sm hover:border-indigo-300 transition-colors group p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                      {provider.icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900">{provider.name}</h4>
                        {provider.realAuth ? (
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[8px] font-bold uppercase">Real</Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[8px] font-bold uppercase">Em breve</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-tight">{provider.description}</p>
                    </div>
                  </div>
                  <Button
                    className={cn("w-full mt-6 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest py-6 shadow-xl transition-all", provider.color, provider.hoverColor)}
                    onClick={() => handleStartConnect(provider.id)}
                    disabled={!!connecting || !provider.realAuth}
                  >
                    {connecting === provider.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {connecting === provider.id ? 'Conectando...' : provider.realAuth ? 'Conectar com OAuth' : 'Em breve'}
                  </Button>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <Card className="bg-slate-900 text-white rounded-[2.5rem] border-none shadow-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <div className="relative z-10 space-y-6">
              <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40">
                <Cloud className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black tracking-tight leading-tight">Integração OAuth2 Real</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                O Lumina AI usa autenticação oficial OAuth 2.0. Seus arquivos originais nunca são modificados — apenas indexamos metadados para busca inteligente.
              </p>
              <div className="pt-4 space-y-3">
                {[
                  { icon: CheckCircle2, text: 'Login Oficial Microsoft / Google' },
                  { icon: CheckCircle2, text: 'Token seguro, sem senha armazenada' },
                  { icon: ShieldCheck, text: 'Criptografia TLS 1.3 end-to-end' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-slate-300">
                    <item.icon className="w-4 h-4 text-indigo-400" /> {item.text}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Folder Picker Dialog ───────────────────────────────────────────── */}
      <Dialog open={showFolderStep} onOpenChange={setShowFolderStep}>
        <DialogContent className="sm:max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {driveUser ? `Olá, ${driveUser.name.split(' ')[0]}!` : 'Selecionando Pastas...'}
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                {driveUser?.email} · {activeProvider?.name}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center text-2xl border border-slate-100">
              {activeProvider?.icon}
            </div>
          </div>

          <div className="p-8">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type="text"
                placeholder="Filtrar pastas..."
                value={folderSearch}
                onChange={e => setFolderSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
              />
            </div>

            <ScrollArea className="h-72 pr-4">
              {loadingFolders ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-3" /> Carregando pastas...
                </div>
              ) : filteredFolders.length === 0 ? (
                <div className="text-center text-slate-400 font-medium py-8">
                  Nenhuma pasta encontrada.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredFolders.map(folder => (
                    <div key={folder.id} onClick={() => toggleFolder(folder.id)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                        selectedFolders.includes(folder.id)
                          ? "bg-indigo-50 border-indigo-200"
                          : "bg-white border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        selectedFolders.includes(folder.id) ? "bg-indigo-500 text-white" : "bg-slate-50 text-slate-400"
                      )}>
                        <FolderOpen className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{folder.name}</p>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        selectedFolders.includes(folder.id) ? "bg-indigo-500 border-indigo-500" : "border-slate-200"
                      )}>
                        {selectedFolders.includes(folder.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter className="p-8 bg-slate-50 flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1 text-xs text-slate-400 font-medium">
              {selectedFolders.length === 0
                ? 'Selecione ao menos uma pasta, ou clique em "Indexar Tudo".'
                : `${selectedFolders.length} pasta(s) selecionada(s).`}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="rounded-xl font-bold uppercase text-[10px]" onClick={() => setShowFolderStep(false)}>
                Cancelar
              </Button>
              <Button
                variant="default"
                className="rounded-2xl bg-slate-900 hover:bg-indigo-600 px-8 py-6 text-[10px] font-black uppercase tracking-widest shadow-xl"
                disabled={!!connecting}
                onClick={handleFinishConnection}
              >
                {connecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                {connecting ? 'Salvando...' : 'Indexar Tudo'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MediaItem } from '../types';

// Fix Leaflet marker icon issues in React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface MapViewProps {
  media: MediaItem[];
}

export function MapView({ media }: MapViewProps) {
  const geoMedia = media.filter(m => m.location?.lat && m.location?.lng);

  return (
    <div className="w-full h-full min-h-[500px] relative bg-slate-50 p-6">
      <div className="w-full h-full rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl relative">
        <MapContainer 
          center={[40, -40]} 
          zoom={3} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; CartoDB'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {geoMedia.map(item => (
            <Marker 
              key={item.id} 
              position={[item.location!.lat, item.location!.lng]}
            >
              <Popup className="media-popup">
                <div className="w-48 bg-white overflow-hidden">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img 
                      src={item.url} 
                      alt={item.name} 
                      className="w-full h-full object-cover transition-transform hover:scale-110 duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest truncate">{item.name}</p>
                    <p className="text-[9px] text-slate-500 font-medium truncate flex items-center gap-1">
                       <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                       {item.location?.address}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* Modern Map Stats Overlay */}
        <div className="absolute top-6 right-6 z-[1000] space-y-3">
          <div className="bg-white/90 backdrop-blur-xl p-5 rounded-3xl border border-white shadow-2xl flex flex-col gap-3 w-56">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Inteligência de Mapa</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-black text-slate-900 leading-none">{geoMedia.length}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Arquivos Geotagueados</p>
                </div>
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                   <div className="w-5 h-5 text-indigo-600">📍</div>
                </div>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                 <div className="bg-indigo-500 h-full rounded-full" style={{ width: '65%' }} />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl shadow-xl flex items-center justify-between group cursor-pointer hover:bg-slate-800 transition-colors">
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Alternar Satélite</span>
            <div className="w-8 h-4 bg-slate-700 rounded-full relative">
              <div className="absolute left-1 top-1 w-2 h-2 bg-indigo-400 rounded-full group-hover:left-5 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

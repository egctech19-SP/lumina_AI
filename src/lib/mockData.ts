/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MediaItem } from '../types';

export const MOCK_MEDIA: MediaItem[] = [
  {
    id: '1',
    name: 'Praia de Copacabana.jpg',
    url: 'https://picsum.photos/seed/beach/800/600',
    type: 'image',
    mimeType: 'image/jpeg',
    size: 2400000,
    createdAt: new Date('2023-07-15').getTime(),
    location: { lat: -22.9519, lng: -43.2105, address: 'Rio de Janeiro, Brasil' },
    tags: ['praia', 'verão', 'mar', 'riodejaneiro'],
    aiQualityScore: 0.95,
    rating: 5,
    source: 'local',
    faces: [{ id: 'f1', label: 'Ana' }]
  },
  {
    id: '2',
    name: 'Trilha no Fuji.jpg',
    url: 'https://picsum.photos/seed/mountain/800/1200',
    type: 'image',
    mimeType: 'image/jpeg',
    size: 3100000,
    createdAt: new Date('2023-08-20').getTime(),
    location: { lat: 35.3606, lng: 138.7274, address: 'Monte Fuji, Japão' },
    tags: ['trilha', 'montanha', 'neve', 'aventura'],
    aiQualityScore: 0.88,
    rating: 4,
    source: 'local'
  },
  {
    id: '3',
    name: 'Foto Borrada.jpg',
    url: 'https://picsum.photos/seed/blur/800/600?blur=10',
    type: 'image',
    mimeType: 'image/jpeg',
    size: 1500000,
    createdAt: new Date('2023-09-01').getTime(),
    isBlurry: true,
    aiQualityScore: 0.3,
    rating: 1,
    source: 'local'
  },
  {
    id: '4',
    name: 'Nova York à Noite.jpg',
    url: 'https://picsum.photos/seed/city/1200/800',
    type: 'image',
    mimeType: 'image/jpeg',
    size: 4200000,
    createdAt: new Date('2023-11-12').getTime(),
    location: { lat: 40.7128, lng: -74.0060, address: 'Nova York, EUA' },
    tags: ['cidade', 'noite', 'luzes', 'viagem'],
    aiQualityScore: 0.92,
    rating: 5,
    source: 'onedrive',
    faces: [{ id: 'f2', label: 'Ana' }, { id: 'f3', label: 'Carlos' }]
  },
  {
    id: '5',
    name: 'Nosso Casamento.jpg',
    url: 'https://picsum.photos/seed/wedding/1200/800',
    type: 'image',
    mimeType: 'image/jpeg',
    size: 5500000,
    createdAt: new Date('2022-05-20').getTime(),
    location: { lat: -23.5505, lng: -46.6333, address: 'São Paulo, Brasil' },
    tags: ['casamento', 'festa', 'amor', 'família'],
    aiQualityScore: 0.98,
    rating: 5,
    source: 'local',
    faces: [{ id: 'f2', label: 'Ana' }, { id: 'f4', label: 'Beatriz' }]
  },
  {
    id: '6',
    name: 'Rex no Parque.jpg',
    url: 'https://picsum.photos/seed/dog/800/800',
    type: 'image',
    mimeType: 'image/jpeg',
    size: 2800000,
    createdAt: new Date('2024-01-10').getTime(),
    location: { lat: -23.5855, lng: -46.6579, address: 'Ibirapuera, São Paulo' },
    tags: ['cachorro', 'animal', 'pet', 'parque', 'rex'],
    aiQualityScore: 0.85,
    rating: 4,
    source: 'gdrive'
  }
];

export const MOCK_CLEANUP_GROUPS = [
  {
    id: 'g1',
    type: 'duplicate',
    items: [
      { ...MOCK_MEDIA[0], id: '1-dup', name: 'Summer Beach Copy.jpg' },
      MOCK_MEDIA[0]
    ]
  },
  {
    id: 'g2',
    type: 'blurry',
    items: [MOCK_MEDIA[2]]
  }
];

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DashboardLayout } from './components/DashboardLayout';
import { GalleryView } from './components/GalleryView';
import { MapView } from './components/MapView';
import { CleanupView } from './components/CleanupView';
import { AIEditorView } from './components/AIEditorView';
import { MediaUploadDialog } from './components/MediaUploadDialog';
import { CloudSourcesView } from './components/CloudSourcesView';
import { MOCK_CLEANUP_GROUPS } from './lib/mockData';
import { ViewType, CleanupGroup, MediaItem } from './types';
import { TooltipProvider } from '@/components/ui/tooltip';
import { MediaProvider, useMedia } from './MediaContext';
import { PeopleView } from './components/PeopleView';

function AppContent() {
  const [activeView, setActiveView] = useState<ViewType>('gallery');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { filteredMedia } = useMedia();

  const renderContent = () => {
    const media = filteredMedia as MediaItem[];
    switch (activeView) {
      case 'gallery':
        return <GalleryView media={media} />;
      case 'map':
        return <MapView media={media} />;
      case 'cleanup':
        return <CleanupView groups={MOCK_CLEANUP_GROUPS as CleanupGroup[]} />;
      case 'editor':
        return <AIEditorView media={media} />;
      case 'cloud':
        return <CloudSourcesView />;
      case 'people':
        return <PeopleView media={media} />;
      default:
        return <GalleryView media={media} />;
    }
  };

  return (
    <>
      <DashboardLayout activeView={activeView} onViewChange={setActiveView} onAddClick={() => setIsUploadOpen(true)}>
        {renderContent()}
      </DashboardLayout>
      <MediaUploadDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} />
    </>
  );
}

export default function App() {
  return (
    <TooltipProvider>
      <MediaProvider>
        <AppContent />
      </MediaProvider>
    </TooltipProvider>
  );
}



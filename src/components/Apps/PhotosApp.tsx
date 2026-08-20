import React, { useState, useEffect } from 'react';
import styles from './PhotosApp.module.css';

interface Photo {
  id: string;
  name: string;
  date: string;
  gradient: string;
}

const SAMPLE_PHOTOS: Photo[] = Array.from({ length: 16 }).map((_, i) => {
  const hues = [0, 30, 60, 120, 200, 240, 280, 320];
  const hue1 = hues[i % hues.length];
  const hue2 = (hue1 + 40) % 360;
  return {
    id: `photo-${i}`,
    name: ['Sunset.jpg', 'Mountains.png', 'Beach.jpg', 'Cityscape.png', 'Forest.jpg', 'River.png', 'Skyline.jpg', 'Desert.png'][i % 8],
    date: `2024-0${(i % 9) + 1}-1${i % 9}`,
    gradient: `linear-gradient(135deg, hsl(${hue1}, 80%, 60%), hsl(${hue2}, 80%, 40%))`
  };
});

const FOLDERS = ['All Photos', 'Desktop', 'Pictures', 'Downloads'];

export const PhotosApp: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState('All Photos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const filteredPhotos = SAMPLE_PHOTOS.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex !== null) {
        if (e.key === 'Escape') setSelectedPhotoIndex(null);
        if (e.key === 'ArrowRight') setSelectedPhotoIndex((selectedPhotoIndex + 1) % filteredPhotos.length);
        if (e.key === 'ArrowLeft') setSelectedPhotoIndex((selectedPhotoIndex - 1 + filteredPhotos.length) % filteredPhotos.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, filteredPhotos.length]);

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarTitle}>Library</div>
        <div className={styles.folderList}>
          {FOLDERS.map(folder => (
            <div
              key={folder}
              className={`${styles.folderItem} ${activeFolder === folder ? styles.active : ''}`}
              onClick={() => setActiveFolder(folder)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              {folder}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--fg-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Search photos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.toolbarActions}>
            <button 
              className={styles.iconBtn} 
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
            >
              {viewMode === 'grid' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className={`${styles.gallery} ${viewMode === 'list' ? styles.listView : ''}`}>
          {filteredPhotos.map((photo, idx) => (
            <div
              key={photo.id}
              className={styles.photoItem}
              onClick={() => setSelectedPhotoIndex(idx)}
            >
              <div className={styles.thumbnail} style={{ background: photo.gradient }} />
              <div className={styles.overlay}>
                <div className={styles.photoName}>{photo.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedPhotoIndex !== null && (
        <div className={styles.lightbox} onClick={(e) => {
          if (e.target === e.currentTarget) setSelectedPhotoIndex(null);
        }}>
          <div className={styles.lightboxHeader}>
            <button className={styles.closeBtn} onClick={() => setSelectedPhotoIndex(null)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div className={styles.lightboxContent}>
            <button 
              className={`${styles.navBtn} ${styles.navPrev}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhotoIndex((selectedPhotoIndex - 1 + filteredPhotos.length) % filteredPhotos.length);
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            
            <div 
              className={styles.fullImage} 
              style={{ background: filteredPhotos[selectedPhotoIndex].gradient }} 
            />

            <button 
              className={`${styles.navBtn} ${styles.navNext}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhotoIndex((selectedPhotoIndex + 1) % filteredPhotos.length);
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <div className={styles.lightboxFooter}>
            <div className={styles.lightboxTitle}>{filteredPhotos[selectedPhotoIndex].name}</div>
            <div className={styles.lightboxDate}>{filteredPhotos[selectedPhotoIndex].date}</div>
          </div>
        </div>
      )}
    </div>
  );
};

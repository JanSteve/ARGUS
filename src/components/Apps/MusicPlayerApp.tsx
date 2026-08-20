import React, { useState, useEffect, useRef } from 'react';
import styles from './MusicPlayerApp.module.css';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
}

const PLAYLIST: Track[] = [
  { id: '1', title: 'Neon Nights', artist: 'Synthwave City', duration: 215 },
  { id: '2', title: 'Cosmic Drift', artist: 'Lunar Echoes', duration: 180 },
  { id: '3', title: 'Digital Horizon', artist: 'Future Grid', duration: 245 },
  { id: '4', title: 'Starlight Avenue', artist: 'Midnight Grooves', duration: 198 },
  { id: '5', title: 'Echoes of Tomorrow', artist: 'Quantum Beats', duration: 270 },
  { id: '6', title: 'Cybernetic Love', artist: 'Data Romance', duration: 210 },
];

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const MusicPlayerApp: React.FC = () => {
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // in seconds
  
  const activeTrack = PLAYLIST[activeTrackIndex];
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= activeTrack.duration) {
            handleNext();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeTrackIndex, activeTrack.duration]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setActiveTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
    setProgress(0);
  };

  const handlePrev = () => {
    setActiveTrackIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
    setProgress(0);
  };

  const handleTrackClick = (index: number) => {
    setActiveTrackIndex(index);
    setProgress(0);
    setIsPlaying(true);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    setProgress(percentage * activeTrack.duration);
  };

  const progressPercent = (progress / activeTrack.duration) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <div className={styles.albumSection}>
          <div className={styles.albumArt}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <div className={styles.songInfo}>
            <div className={styles.songTitle}>{activeTrack.title}</div>
            <div className={styles.artistName}>{activeTrack.artist}</div>
          </div>
        </div>

        <div className={styles.controlsSection}>
          <div className={styles.progressContainer}>
            <span className={styles.time}>{formatTime(progress)}</span>
            <div className={styles.progressBar} ref={progressRef} onClick={handleSeek}>
              <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
            </div>
            <span className={styles.time}>{formatTime(activeTrack.duration)}</span>
          </div>

          <div className={styles.buttons}>
            <button className={styles.controlBtn} title="Shuffle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 3 21 3 21 8"></polyline>
                <line x1="4" y1="20" x2="21" y2="3"></line>
                <polyline points="21 16 21 21 16 21"></polyline>
                <line x1="15" y1="15" x2="21" y2="21"></line>
                <line x1="4" y1="4" x2="9" y2="9"></line>
              </svg>
            </button>
            <button className={styles.controlBtn} onClick={handlePrev} title="Previous">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="19 20 9 12 19 4 19 20"></polygon>
                <line x1="5" y1="19" x2="5" y2="5"></line>
              </svg>
            </button>
            <button className={`${styles.controlBtn} ${styles.playBtn}`} onClick={handlePlayPause}>
              {isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              )}
            </button>
            <button className={styles.controlBtn} onClick={handleNext} title="Next">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 4 15 12 5 20 5 4"></polygon>
                <line x1="19" y1="5" x2="19" y2="19"></line>
              </svg>
            </button>
            <button className={styles.controlBtn} title="Repeat">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9"></polyline>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <polyline points="7 23 3 19 7 15"></polyline>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
              </svg>
            </button>
          </div>

          <div className={styles.volumeContainer}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--fg-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
            <div className={styles.volumeBar}>
              <div className={styles.volumeFill} />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.playlist}>
        <div className={styles.playlistHeader}>Up Next</div>
        <div className={styles.trackList}>
          {PLAYLIST.map((track, idx) => (
            <div
              key={track.id}
              className={`${styles.trackItem} ${activeTrackIndex === idx ? styles.active : ''}`}
              onClick={() => handleTrackClick(idx)}
            >
              <div className={styles.trackNum}>{idx + 1}</div>
              <div className={styles.trackInfo}>
                <div className={styles.trackTitle}>{track.title}</div>
                <div className={styles.trackArtist}>{track.artist}</div>
              </div>
              <div className={styles.trackDuration}>{formatTime(track.duration)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

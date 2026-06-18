import {
  CheckCircle2,
  ListMusic,
  Maximize2,
  Mic2,
  MonitorSpeaker,
  PlayCircle,
  Repeat2,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react';
import styles from './PlayerBar.module.css';

const defaultSong = {
  id: 'song-001',
  title: 'Midnight City',
  artist: 'M83',
  albumCover:
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=90',
  duration: '4:03',
};

export function PlayerBar({ song = defaultSong }) {
  return (
    <footer className={styles.playerBar} aria-label="Music player">
      <div className={styles.track}>
        <img className={styles.albumCover} src={song.albumCover} alt={`${song.title} album cover`} />
        <div className={styles.songInfo}>
          <h2>{song.title}</h2>
          <p>{song.artist}</p>
        </div>
        <button className={styles.savedButton} type="button" aria-label={`${song.title} is saved`}>
          <CheckCircle2 size={19} fill="#1db954" strokeWidth={2.2} />
        </button>
      </div>

      <div className={styles.playerCenter}>
        <div className={styles.controls} aria-label="Playback controls">
          <button className={styles.controlButton} type="button" aria-label="Shuffle">
            <Shuffle size={18} />
          </button>
          <button className={styles.controlButton} type="button" aria-label="Previous">
            <SkipBack size={22} fill="currentColor" />
          </button>
          <button className={styles.playButton} type="button" aria-label="Play">
            <PlayCircle size={38} fill="currentColor" strokeWidth={1.8} />
          </button>
          <button className={styles.controlButton} type="button" aria-label="Next">
            <SkipForward size={22} fill="currentColor" />
          </button>
          <button className={styles.controlButton} type="button" aria-label="Repeat">
            <Repeat2 size={18} />
          </button>
        </div>

        <div className={styles.progressSection}>
          <span>0:00</span>
          <input type="range" min="0" max="100" defaultValue="34" aria-label="Song progress" />
          <span>{song.duration}</span>
        </div>
      </div>

      <div className={styles.extras}>
        <button className={styles.controlButton} type="button" aria-label="Lyrics">
          <Mic2 size={18} />
        </button>
        <button className={styles.controlButton} type="button" aria-label="Queue">
          <ListMusic size={18} />
        </button>
        <button className={styles.controlButton} type="button" aria-label="Connect to device">
          <MonitorSpeaker size={18} />
        </button>
        <button className={styles.controlButton} type="button" aria-label="Volume">
          <Volume2 size={18} />
        </button>
        <input className={styles.volumeSlider} type="range" min="0" max="100" defaultValue="72" aria-label="Volume" />
        <button className={styles.controlButton} type="button" aria-label="Full screen">
          <Maximize2 size={17} />
        </button>
      </div>
    </footer>
  );
}

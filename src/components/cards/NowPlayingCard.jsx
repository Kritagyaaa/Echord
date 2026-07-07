import { Heart } from 'lucide-react';
import { usePlayer } from '../../context/playercontext';
import styles from './NowPlayingCard.module.css';

export function NowPlayingCard({ song }) {
  const { currentSong, toggleLike, isPlaying } = usePlayer();
  const isLiked = currentSong?.is_liked;

  return (
    <section className={styles.nowPlaying} aria-label={`${song.title} by ${song.artist}`}>
      <div className={styles.artStage}>
        <div className={styles.vinyl} data-spinning={isPlaying ? 'true' : 'false'}>
          <img
            className={styles.vinylLabel}
            src={song.albumCover}
            alt={`${song.title} album cover`}
          />
          <div className={styles.vinylHole} />
        </div>

        <div className={styles.tonearm} data-active={isPlaying ? 'true' : 'false'}>
          <div className={styles.tonearmPivot} />
          <div className={styles.tonearmRod} />
          <div className={styles.tonearmHead} />
        </div>
      </div>

      <div className={styles.songInfo}>
        <div className={styles.marquee}>
          <div className={styles.marqueeTrack}>
            <span className={styles.title}>{song.title}</span>
            <span className={styles.artist}>{song.artist}</span>
          </div>
        </div>

      </div>
    </section>
  );
}
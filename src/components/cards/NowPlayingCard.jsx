import { Heart } from 'lucide-react';
import styles from './NowPlayingCard.module.css';

export function NowPlayingCard({ song }) {
  return (
    <section className={styles.nowPlaying} aria-label={`${song.title} by ${song.artist}`}>
      <img className={styles.albumCover} src={song.albumCover} alt={`${song.title} album cover`} />
      <div className={styles.songInfo}>
        <div className={styles.textBlock}>
          <h2 className={styles.title}>{song.title}</h2>
          <p className={styles.artist}>{song.artist}</p>
        </div>
        <button className={styles.likeButton} type="button" aria-label={`Save ${song.title} to your library`}>
          <Heart size={21} strokeWidth={2.1} />
        </button>
      </div>
    </section>
  );
}

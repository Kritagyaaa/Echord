import styles from "./PlaylistView.module.css";
import { Play } from "lucide-react";
import placeholder from "../../assets/music-placeholder.jpg";

export function PlaylistView({ playlist }) {
  if (!playlist) {
    return (
      <div className={styles.empty}>
        Select a playlist
      </div>
      
    );
  }


 const songs = playlist.songs || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img
          src={playlist.image || placeholder}
          alt={playlist.title}
          className={styles.cover}
        />

        <div className={styles.info}>
          <p className={styles.type}>Public Playlist</p>
          <h1>{playlist.title}</h1>
          <p className={styles.subtitle}>{playlist.subtitle}</p>
        </div>
      </div>

      <div className={styles.actions}>
  <button className={styles.playButton}>▶</button>
</div>

<div className={styles.songList}>
  <div className={styles.songHeader}>
    <span>#</span>
    <span>Title</span>
    <span>Artist</span>
    <span>Duration</span>
  </div>

  {songs.map((song) => (
    <div key={song.id} className={styles.songRow}>
      <span>{song.id}</span>
      <span>{song.title}</span>
      <span>{song.artist}</span>
      <span>{song.duration}</span>
    </div>
  ))}
</div>

</div>
);
}
import { useEffect, useState } from 'react';
import { Music } from 'lucide-react';
import styles from './SongsList.module.css';

export function SongsList() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/songs');
        if (!response.ok) {
          throw new Error('Failed to fetch songs');
        }
        const data = await response.json();
        setSongs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  if (loading) {
    return <div className={styles.container}>Loading songs...</div>;
  }

  if (error) {
    return <div className={styles.container}>Error: {error}</div>;
  }

  if (songs.length === 0) {
    return <div className={styles.container}>No songs found. Start the API server.</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Available Songs</h2>
      <div className={styles.songsList}>
        {songs.map((song) => (
          <div key={song.id} className={styles.songCard}>
            <img src={song.cover_url} alt={song.title} className={styles.coverImage} />
            <div className={styles.songInfo}>
              <h3 className={styles.songTitle}>{song.title}</h3>
              <p className={styles.songArtist}>{song.artist_name}</p>
              <p className={styles.songAlbum}>{song.album_name}</p>
              <div className={styles.songMeta}>
                <span className={styles.duration}>{song.duration}</span>
                <span className={styles.genre}>{song.genre}</span>
              </div>
            </div>
            <button className={styles.playButton} type="button" aria-label={`Play ${song.title}`}>
              <Music size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

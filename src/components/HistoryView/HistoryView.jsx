import { useEffect, useState } from "react";
import { Play, Volume2, Clock, Heart, ArrowLeft, Trash2 } from "lucide-react";
import { getListeningHistory, toggleLikeSong } from "../../services/api";
import { usePlayer } from "../../context/PlayerContext";
import styles from "./HistoryView.module.css";
import placeholder from "../../assets/music-placeholder.jpg";

export function HistoryView({ onBackToMain }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentSong, isPlaying, playSong, toggleLike } = usePlayer();

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getListeningHistory();
      setHistory(data);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    const handleSync = (e) => {
      const { songId, isLiked } = e.detail;
      setHistory((prev) =>
        prev.map((item) => {
          if (item.id === songId) {
            return {
              ...item,
              is_liked: isLiked,
              like_count: isLiked ? (item.like_count || 0) + 1 : Math.max(0, (item.like_count || 0) - 1)
            };
          }
          return item;
        })
      );
    };
    window.addEventListener('song-liked-sync', handleSync);
    return () => window.removeEventListener('song-liked-sync', handleSync);
  }, []);

  const formatTimePlayed = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) {
      if (date.getDate() === now.getDate()) {
        return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
    }

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleLike = async (e, songId) => {
    e.stopPropagation();
    try {
      await toggleLike(songId);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading your listening history...</p>
      </div>
    );
  }

  const isCurrentPlaying = (songId) => {
    return currentSong && currentSong.id === songId && isPlaying;
  };

  const isCurrentSong = (songId) => {
    return currentSong && currentSong.id === songId;
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerGradient}></div>
      
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBackToMain} aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
        <div className={styles.headerContent}>
          <p className={styles.upperTitle}>RECENTS</p>
          <h1 className={styles.title}>Listening History</h1>
          <p className={styles.subtitle}>
            Your recently played tracks • {history.length} song{history.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className={styles.content}>
        {history.length === 0 ? (
          <div className={styles.emptyState}>
            <Clock size={64} className={styles.emptyIcon} />
            <h2>No listening history yet</h2>
            <p>Songs you stream will show up here. Start listening to music now!</p>
            <button className={styles.startListeningBtn} onClick={onBackToMain}>
              Discover Songs
            </button>
          </div>
        ) : (
          <div className={styles.songTable}>
            <div className={styles.tableHeader}>
              <span className={styles.colNumber}>#</span>
              <span className={styles.colTitle}>Title</span>
              <span className={styles.colAlbum}>Album</span>
              <span className={styles.colTime}>Time Played</span>
              <span className={styles.colDuration}>
                <Clock size={16} />
              </span>
            </div>

            <div className={styles.tableBody}>
              {history.map((song, index) => (
                <div
                  key={song.history_id || `${song.id}-${index}`}
                  className={`${styles.songRow} ${isCurrentSong(song.id) ? styles.activeRow : ""}`}
                  onClick={() => playSong(song, history)}
                >
                  <span className={styles.colNumber}>
                    {isCurrentPlaying(song.id) ? (
                      <Volume2 className={styles.playingIcon} size={16} />
                    ) : (
                      index + 1
                    )}
                  </span>
                  
                  <span className={styles.colTitle}>
                    <div className={styles.songInfoBlock}>
                      <div className={styles.coverWrapper}>
                        <img src={song.cover_url || placeholder} alt={song.title} />
                        <div className={styles.coverPlayOverlay}>
                          <Play size={16} fill="#E19FC7" />
                        </div>
                      </div>
                      <div className={styles.titleArtist}>
                        <span className={`${styles.songTitle} ${isCurrentSong(song.id) ? styles.greenText : ""}`}>
                          {song.title}
                        </span>
                        <span className={styles.songArtist}>{song.artist}</span>
                      </div>
                    </div>
                  </span>

                  <span className={styles.colAlbum}>{song.album || "—"}</span>

                  <span className={styles.colTime}>{formatTimePlayed(song.played_at)}</span>

                  <span className={styles.colDuration}>
                    <button
                      className={`${styles.likeBtn} ${song.is_liked ? styles.liked : ""}`}
                      onClick={(e) => handleLike(e, song.id)}
                      aria-label="Like song"
                    >
                      <Heart size={16} fill={song.is_liked ? "#870339" : "none"} color={song.is_liked ? "#870339" : "#E19FC7"} />
                    </button>
                    <span className={styles.durationText}>{formatDuration(song.duration)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

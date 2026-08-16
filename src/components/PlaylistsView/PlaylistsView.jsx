import { Heart, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlaylists } from "../../context/playlistcontext";
import { PlaylistCover } from "../PlaylistCover/PlaylistCover";
import { CreatePlaylistModel } from "../CreatePlaylistModel/CreatePlaylistModel";
import placeholder from "../../assets/music-placeholder.jpg";
import styles from "./PlaylistsView.module.css";

export function PlaylistsView() {
  const { playlists, selectPlaylist } = usePlaylists();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handlePlaylistClick = async (playlist) => {
    await selectPlaylist(playlist);
    navigate("/");
  };

  return (
    <div className={styles.playlistsContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>All Playlists</h1>
        <button
          className={styles.createBtn}
          onClick={() => setShowCreateModal(true)}
          aria-label="Create Playlist"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>New Playlist</span>
        </button>
      </div>
      
      <div className={styles.playlistsGrid}>
        {/* Liked Songs Card */}
        <div 
          className={styles.playlistCard}
          onClick={() => handlePlaylistClick({ id: "liked-songs", name: "Liked Songs" })}
        >
          <div className={styles.likedSongsCover}>
            <Heart size={36} fill="#870339" color="#E19FC7" />
          </div>
          <div className={styles.cardInfo}>
            <h3 className={styles.cardTitle}>Liked Songs</h3>
            <p className={styles.cardSubtitle}>Auto-generated playlist</p>
          </div>
        </div>

        {/* User Playlists */}
        {playlists.map((playlist) => (
          <div 
            key={playlist.id}
            className={styles.playlistCard}
            onClick={() => handlePlaylistClick(playlist)}
          >
            <div className={styles.coverWrapper}>
              <PlaylistCover
                playlist={playlist}
                className={styles.playlistCover}
                fallbackPlaceholder={placeholder}
              />
            </div>
            <div className={styles.cardInfo}>
              <h3 className={styles.cardTitle}>{playlist.name}</h3>
              <p className={styles.cardSubtitle}>{playlist.song_count} songs</p>
            </div>
          </div>
        ))}
      </div>

      <CreatePlaylistModel
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { Maximize2, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './SidebarHeader.module.css';
import { usePlayer } from '../../context/playercontext';
import { usePlaylists } from '../../context/playlistcontext';
import { addSongToPlaylist, removeSongFromPlaylist } from '../../services/api';

export function SidebarHeader({ playlistName }) {
  const { currentSong, toggleExpand, toggleLike, addToQueue } = usePlayer();
  const { playlists, selectedPlaylist, loadPlaylists, refreshSelectedPlaylist } = usePlaylists();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showDropdown]);

  const handleAddSongToPl = async (playlistId) => {
    if (!currentSong) return;
    try {
      await addSongToPlaylist(playlistId, currentSong.id);
      alert(`Added "${currentSong.title}" to playlist successfully!`);
      await loadPlaylists();
      await refreshSelectedPlaylist();
      setShowDropdown(false);
    } catch (err) {
      alert(err.message || "Failed to add song.");
    }
  };

  const handleRemoveFromPl = async () => {
    if (!currentSong || !selectedPlaylist) return;
    try {
      await removeSongFromPlaylist(selectedPlaylist.id, currentSong.id);
      alert(`Removed "${currentSong.title}" from "${selectedPlaylist.name}".`);
      await loadPlaylists();
      await refreshSelectedPlaylist();
      setShowDropdown(false);
    } catch (err) {
      alert(err.message || "Failed to remove song.");
    }
  };

  const isSongInCurrentPl = selectedPlaylist &&
    selectedPlaylist.id !== "liked-songs" &&
    selectedPlaylist.songs?.some(s => s.id === currentSong?.id);

  return (
    <header className={styles.header}>
      <h1 className={styles.playlistName}>{playlistName}</h1>
      <div className={styles.actions} aria-label="Now playing actions" ref={dropdownRef}>
        <div className={styles.actionsWrapper}>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="More options"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <MoreHorizontal size={21} strokeWidth={2.1} />
          </button>

          {showDropdown && currentSong && (
            <div className={styles.dropdown}>
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  toggleLike();
                  setShowDropdown(false);
                }}
              >
                {currentSong.is_liked ? "Remove from Liked Songs" : "Add to Liked Songs"}
              </button>

              <button
                className={styles.dropdownItem}
                onClick={() => {
                  addToQueue(currentSong);
                  setShowDropdown(false);
                }}
              >
                Add to Queue
              </button>

              <div className={styles.dropdownDivider} />

              <div className={styles.dropdownItem} style={{ cursor: "default" }}>
                <span>Add to Playlist</span>
                <ChevronLeft size={16} />

                {playlists.length > 0 && (
                  <div className={styles.submenu}>
                    {playlists.map(pl => (
                      <button
                        key={pl.id}
                        className={styles.dropdownItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddSongToPl(pl.id);
                        }}
                      >
                        {pl.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isSongInCurrentPl && (
                <>
                  <div className={styles.dropdownDivider} />
                  <button
                    className={styles.dropdownItem}
                    onClick={handleRemoveFromPl}
                    style={{ color: "#e91429" }}
                  >
                    Remove from this playlist
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <button
          className={styles.iconButton}
          type="button"
          aria-label="Expand now playing view"
          onClick={toggleExpand}
        >
          <Maximize2 size={18} strokeWidth={2.2} />
        </button>
      </div>
    </header>
  );
}

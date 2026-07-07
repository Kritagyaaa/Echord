import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePlayer } from "../../context/playercontext.jsx";
import { Minimize2, Heart, Plus, ListMusic } from "lucide-react";
import styles from "./ExpandedPlayer.module.css";
import placeholder from "../../assets/music-placeholder.jpg";
import { RecommendationCard } from "../cards/recommendationCard.jsx";
import { usePlaylists } from "../../context/playlistcontext";
import { CreatePlaylistModel } from "../CreatePlaylistModel/CreatePlaylistModel";
import { addSongToPlaylist } from "../../services/api";

export function ExpandedPlayer() {
  const { currentSong, toggleExpand, toggleLike } = usePlayer();
  const { playlists, loadPlaylists, refreshSelectedPlaylist } = usePlaylists();
  const navigate = useNavigate();
  const location = useLocation();
  const isQueueActive = location.pathname === "/queue";

  const [showAddToPlaylistDropdown, setShowAddToPlaylistDropdown] = useState(false);
  const [showCreateModel, setShowCreateModel] = useState(false);
  const addToPlaylistDropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        addToPlaylistDropdownRef.current &&
        !addToPlaylistDropdownRef.current.contains(e.target)
      ) {
        setShowAddToPlaylistDropdown(false);
      }
    };
    if (showAddToPlaylistDropdown) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showAddToPlaylistDropdown]);

  const handleAddSongToPl = async (playlistId) => {
    if (!currentSong) return;
    try {
      await addSongToPlaylist(playlistId, currentSong.id);
      alert("Song added to playlist successfully!");
      setShowAddToPlaylistDropdown(false);
      await loadPlaylists(); // update count in library sidebar
      await refreshSelectedPlaylist(); // update counts in playlist details
    } catch (err) {
      alert(err.message || "Failed to add song.");
    }
  };

  if (!currentSong) return null;

  // Setup related mock music videos using existing seeded artists
  const RELATED_VIDEOS = [
    {
      id: "vid-1",
      title: `${currentSong.title} (Official Music Video)`,
      thumbnail: currentSong.cover_url || placeholder,
      duration: "4:12",
      views: "1.2M views"
    },
    {
      id: "vid-2",
      title: `${currentSong.artist} - Live Performance`,
      thumbnail: currentSong.artist_image || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=300&q=80",
      duration: "5:45",
      views: "450K views"
    },
    {
      id: "vid-3",
      title: `${currentSong.title} (Behind The Scenes)`,
      thumbnail: currentSong.cover_url || placeholder,
      duration: "3:30",
      views: "220K views"
    },
    {
      id: "vid-4",
      title: `${currentSong.artist} - Top Hits Compilation`,
      thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80",
      duration: "12:15",
      views: "3.4M views"
    }
  ];

  return (
    <div className={styles.container}>
      {/* Top Header Actions */}
      <div className={styles.topActionsBar}>
        <div className={styles.playingFrom}>
          <span className={styles.playingFromLabel}>PLAYING FROM PLAYLIST</span>
          <span className={styles.playingFromTitle}>{currentSong.album || "Library"}</span>
        </div>
        <div className={styles.actionButtons}>
          <div className={styles.dropdownWrapper} ref={addToPlaylistDropdownRef}>
            <button
              className={styles.actionBtn}
              onClick={() => setShowAddToPlaylistDropdown(!showAddToPlaylistDropdown)}
              title="Add to playlist"
              aria-label="Add to playlist"
            >
              <Plus size={19} />
            </button>

            {showAddToPlaylistDropdown && (
              <div className={styles.playlistDropdown}>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    setShowCreateModel(true);
                    setShowAddToPlaylistDropdown(false);
                  }}
                >
                  <Plus size={14} /> Create Playlist
                </button>

                {playlists.length > 0 && (
                  <>
                    <div className={styles.dropdownDivider} />
                    <div className={styles.dropdownHeader}>Add to Playlist</div>
                    {playlists.map(pl => (
                      <button
                        key={pl.id}
                        className={styles.dropdownItem}
                        onClick={() => handleAddSongToPl(pl.id)}
                      >
                        {pl.name}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <button
            className={styles.actionBtn}
            onClick={() => {
              navigate(isQueueActive ? "/" : "/queue");
              toggleExpand();
            }}
            title="Queue"
            aria-label="Queue"
            style={isQueueActive ? { color: "#870339" } : {}}
          >
            <ListMusic size={19} />
          </button>

          <button
            className={styles.minimizeBtn}
            onClick={toggleExpand}
            aria-label="Collapse full screen view"
          >
            <Minimize2 size={19} />
          </button>
        </div>
      </div>

      {/* Main Focus Area (Centered Album Art & Title) */}
      <div className={styles.focusContent}>
        <div className={styles.artWrapper}>
          <img
            className={styles.largeCoverArt}
            src={currentSong.cover_url || placeholder}
            alt={currentSong.title}
          />
          {/* Subtle colored glow behind the image for rich modern aesthetics */}
          <div
            className={styles.glowBg}
            style={{ backgroundImage: `url(${currentSong.cover_url || placeholder})` }}
          />
        </div>

        <div className={styles.metaSection}>
          <div className={styles.songMetadata}>
            <h1 className={styles.songTitle}>{currentSong.title}</h1>
            <p className={styles.songArtist}>{currentSong.artist}</p>
          </div>
          <button
            className={`${styles.likeBtn} ${currentSong.is_liked ? styles.liked : ""}`}
            onClick={toggleLike}
            aria-label="Like song"
          >
            <Heart
              size={28}
              fill={currentSong.is_liked ? "#870339" : "none"}
              color={currentSong.is_liked ? "#870339" : "#b3b3b3"}
            />
          </button>
        </div>
      </div>

      {/* Recommended Content Row */}
      <div className={styles.relatedSection}>
        <RecommendationCard />
      </div>

      <CreatePlaylistModel
        isOpen={showCreateModel}
        onClose={() => setShowCreateModel(false)}
      />
    </div>
  );
}

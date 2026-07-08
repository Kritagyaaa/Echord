import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Heart, ListPlus } from 'lucide-react';
import styles from './MainPage.module.css';
import placeholder from "../../assets/music-placeholder.jpg";
import { PlaylistCover } from "../PlaylistCover/PlaylistCover";
import { getSongs, getListeningHistory, toggleLikeSong } from "../../services/api";
import { usePlayer } from "../../context/playercontext";
import { usePlaylists } from "../../context/playlistcontext";
import { useNavigate } from "react-router-dom";
import ShaderBackground from "../shaderBackground/ShaderBackground";

export function MainPage({
  searchQuery = "",
  searchResults = [],
}) {
  const [showRecentLeftArrow, setShowRecentLeftArrow] = useState(false);
  const [showMixesLeftArrow, setShowMixesLeftArrow] = useState(false);
  const [showFeaturedLeftArrow, setShowFeaturedLeftArrow] = useState(false);
  const [showLatestLeftArrow, setShowLatestLeftArrow] = useState(false);
  const recentRef = useRef(null);
  const mixesRef = useRef(null);
  const featuredRef = useRef(null);
  const latestRef = useRef(null);
  const navigate = useNavigate();
  const [songs, setSongs] = useState([]);
  const [historySongs, setHistorySongs] = useState([]);
  const [localSearchResults, setLocalSearchResults] = useState([]);

  const { playlists, selectPlaylist } = usePlaylists();
  const { playSong, initializeQueue, currentSong, isPlaying, addToUserQueue } = usePlayer();

  const displayedSongs = songs;
  const trendingSongs = songs.filter(s => !s.uploaded_by || s.creator_email === 'admin@echord.com');
  const latestSongs = songs.filter(s => s.uploaded_by && s.creator_email !== 'admin@echord.com');

  // Keep search results in local state so we can toggle likes immediately
  useEffect(() => {
    setLocalSearchResults(searchResults);
  }, [searchResults]);

  useEffect(() => {
    let isMounted = true;

    async function loadSongs() {
      try {
        const data = await getSongs();
        if (!isMounted) return;
        setSongs(data);
        initializeQueue(data);
      } catch (err) {
        console.error(err);
      }
    }

    async function loadHistory() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          if (isMounted) {
            setHistorySongs([]);
          }
          return;
        }
        const history = await getListeningHistory();
        if (!isMounted) return;
        setHistorySongs(history);
      } catch (err) {
        console.error("Error loading listening history:", err);
      }
    }

    const refreshData = () => {
      loadSongs();
      loadHistory();
    };

    refreshData();

    const handleSongUpdate = () => {
      refreshData();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    };

    window.addEventListener('songs-updated', handleSongUpdate);
    window.addEventListener('focus', handleSongUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const songsInterval = window.setInterval(() => {
      refreshData();
    }, 15000);

    return () => {
      isMounted = false;
      window.removeEventListener('songs-updated', handleSongUpdate);
      window.removeEventListener('focus', handleSongUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(songsInterval);
    };
  }, [initializeQueue]);

  const handleLikeToggle = async (e, songId) => {
    e.stopPropagation();
    try {
      const res = await toggleLikeSong(songId);
      // Update local search results
      setLocalSearchResults(prev => prev.map(s => {
        if (s.id === songId) {
          return {
            ...s,
            is_liked: res.liked ? 1 : 0,
            like_count: res.liked ? (s.like_count || 0) + 1 : Math.max(0, (s.like_count || 0) - 1)
          };
        }
        return s;
      }));

      // Update main songs list
      setSongs(prev => prev.map(s => {
        if (s.id === songId) {
          return {
            ...s,
            is_liked: res.liked ? 1 : 0,
            like_count: res.liked ? (s.like_count || 0) + 1 : Math.max(0, (s.like_count || 0) - 1)
          };
        }
        return s;
      }));

      // Update history list
      setHistorySongs(prev => prev.map(s => {
        if (s.id === songId) {
          return {
            ...s,
            is_liked: res.liked ? 1 : 0,
            like_count: res.liked ? (s.like_count || 0) + 1 : Math.max(0, (s.like_count || 0) - 1)
          };
        }
        return s;
      }));
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to toggle like.");
    }
  };

  const scrollRight = (ref) => {
    if (ref.current) {
      ref.current.scrollLeft += 400;
    }
  };

  const scrollLeft = (ref) => {
    if (ref.current) {
      ref.current.scrollLeft -= 400;
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const MusicCard = ({ song, playlist }) => (
    <div
      className={styles.musicCard}
      onClick={() => {
        playSong(song, playlist || displayedSongs);
      }}
    >
      <img
        src={song.cover_url || placeholder}
        alt={song.title}
        onError={(e) => { e.target.onerror = null; e.target.src = placeholder; }}
      />
      <h3>{song.title}</h3>
      <p>{song.artist}</p>
    </div>
  );

  // Render Full Page Search Results
  if (searchQuery.trim() !== "") {
    const topResult = localSearchResults[0];
    const otherSongs = localSearchResults.slice(0, 5);

    return (
      <div className={styles.mainContent}>

        <div className={styles.pageContent}>
          <h2>Search Results for "{searchQuery}"</h2>

          {localSearchResults.length === 0 ? (
            <div className={styles.noResults}>
              <h3>No results found</h3>
              <p>Please make sure your words are spelled correctly or try fewer or different keywords.</p>
            </div>
          ) : (
            <div className={styles.searchLayout}>
              {topResult && (
                <div className={styles.topResultContainer}>
                  <h3>Top Result</h3>
                  <div
                    className={styles.topResultCard}
                    onClick={() => playSong(topResult, localSearchResults)}
                  >
                    <img
                      src={topResult.cover_url || placeholder}
                      alt={topResult.title}
                      className={styles.topResultImage}
                    />
                    <h2 className={styles.topResultName}>{topResult.title}</h2>
                    <div className={styles.topResultMeta}>
                      <span className={styles.topResultBadge}>Song</span>
                      <span className={styles.topResultArtist}>{topResult.artist}</span>
                    </div>
                    <div className={styles.playOverlay}>
                      <Play fill="black" color="black" size={24} />
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.songsResultContainer}>
                <h3>Songs</h3>
                <div className={styles.searchSongList}>
                  {otherSongs.map((song) => (
                    <div
                      key={song.id}
                      className={styles.searchSongRow}
                      onClick={() => playSong(song, localSearchResults)}
                    >
                      <img
                        src={song.cover_url || placeholder}
                        alt=""
                        className={styles.searchSongCover}
                      />
                      <div className={styles.searchSongInfo}>
                        <p className={styles.searchSongTitle}>{song.title}</p>
                        <p className={styles.searchSongArtist}>{song.artist}</p>
                      </div>
                      <div className={styles.searchSongControls}>
                        <button
                          className={`${styles.searchLikeButton} ${song.is_liked ? styles.liked : ''}`}
                          onClick={(e) => handleLikeToggle(e, song.id)}
                        >
                          <Heart
                            size={18}
                            fill={song.is_liked ? "#1db954" : "none"}
                            color={song.is_liked ? "#1db954" : "#b3b3b3"}
                          />
                        </button>
                        <button
                          className={styles.searchLikeButton}
                          title="Add to queue"
                          onClick={(e) => { e.stopPropagation(); addToUserQueue(song); }}
                        >
                          <ListPlus size={18} color="#b3b3b3" />
                        </button>
                        <span className={styles.searchSongDuration}>
                          {formatDuration(song.duration)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    );
  }

  // Normal Home Page View
  return (
    <div className={styles.mainContent}>
      <div className={styles.categoryButtons}>
        <button onClick={() => navigate("/playlists")}>All</button>
        <button onClick={() => navigate("/browse")}>Music</button>
        <button onClick={() => navigate("/albums")}>Album</button>
      </div>

      <div className={styles.quickPicks}>
        <div
          className={styles.pickCard}
          onClick={() => selectPlaylist({ id: "liked-songs", name: "Liked Songs" })}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 4,
              background: "linear-gradient(135deg,#E19FC7,#E19FC7,#c4efd9)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#E19FC7",
            }}
          >
            <Heart size={24} fill="#870339" />
          </div>
          <span>Liked Songs</span>
        </div>

        {playlists.slice(0, 5).map(playlist => (
          <div
            key={playlist.id}
            className={styles.pickCard}
            onClick={() => selectPlaylist(playlist)}
          >
            <PlaylistCover
              playlist={playlist}
              className={styles.playlistCollage}
              fallbackPlaceholder={placeholder}
            />
            <span>{playlist.name}</span>
          </div>
        ))}
      </div>

      <div className={styles.sectionHeader}>
        <h2>Trending</h2>

      </div>
      <div className={styles.cardsRow}>
        {trendingSongs.slice(0, 3).map(song => (
          <MusicCard
            key={song.id}
            song={song}
            playlist={trendingSongs}
          />
        ))}
      </div>
      <div className={styles.sectionHeader}>
        <h2>Latest song</h2>
      </div>
      <div className={styles.cardsContainer}>
        <div className={styles.cardsRow} ref={latestRef}>
          {latestSongs.map(song => (
            <MusicCard
              key={song.id}
              song={song}
              playlist={latestSongs}
            />
          ))}
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <h2>Recents</h2>
        <span style={{ cursor: "pointer" }} onClick={() => navigate('/history')}>Show all</span>
      </div>
      <div className={styles.cardsContainer}>
        {showRecentLeftArrow && (
          <button className={styles.echordArrowLeft} onClick={() => { scrollLeft(recentRef); setShowRecentLeftArrow(false); }}>
            <ChevronLeft size={20} />
          </button>
        )}
        <button className={styles.echordArrow} onClick={() => { scrollRight(recentRef); setShowRecentLeftArrow(true); }}>
          <ChevronRight size={20} />
        </button>
        <div className={styles.cardsRow} ref={recentRef}>
          {(historySongs.length > 0 ? historySongs.slice(0, 7) : displayedSongs.slice(0, 7)).map(song => (
            <MusicCard
              key={song.history_id || song.id}
              song={song}
              playlist={historySongs.length > 0 ? historySongs : displayedSongs}
            />
          ))}
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <h2>Your top mixes</h2>
        <span style={{ cursor: "pointer" }} onClick={() => selectPlaylist({ id: "mixes", name: "Your top mixes" })}>Show all</span>
      </div>
      <div className={styles.cardsContainer}>
        {showMixesLeftArrow && (
          <button className={`${styles.echordArrowLeft} ${styles.mixesArrowLeft}`} onClick={() => { scrollLeft(mixesRef); setShowMixesLeftArrow(false); }}>
            <ChevronLeft size={20} />
          </button>
        )}
        <button className={`${styles.echordArrow} ${styles.mixesArrow}`} onClick={() => { scrollRight(mixesRef); setShowMixesLeftArrow(true); }}>
          <ChevronRight size={20} />
        </button>
        <div className={styles.cardsRow} ref={mixesRef}>
          {displayedSongs.slice(2, 9).map(song => (
            <MusicCard
              key={song.id}
              song={song}
            />
          ))}
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <h2>Featured now</h2>
        <span style={{ cursor: "pointer" }} onClick={() => selectPlaylist({ id: "featured", name: "Featured now" })}>Show all</span>
      </div>
      <div className={styles.cardsContainer}>
        {showFeaturedLeftArrow && (
          <button className={`${styles.echordArrowLeft} ${styles.featuredArrowLeft}`} onClick={() => { scrollLeft(featuredRef); setShowFeaturedLeftArrow(false); }}>
            <ChevronLeft size={20} />
          </button>
        )}
        <button className={`${styles.echordArrow} ${styles.featuredArrow}`} onClick={() => { scrollRight(featuredRef); setShowFeaturedLeftArrow(true); }}>
          <ChevronRight size={20} />
        </button>
        <div className={styles.cardsRow} ref={featuredRef}>
          {songs.slice(1, 7).map(song => (
            <MusicCard
              key={song.id}
              song={song}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

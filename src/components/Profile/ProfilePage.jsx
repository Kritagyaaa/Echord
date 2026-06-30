import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, MoreHorizontal, Play, Check } from 'lucide-react';
import styles from './ProfilePage.module.css';
import { getArtists, getListeningHistory } from '../../services/api';
import { usePlayer } from '../../context/PlayerContext';
import { usePlaylists } from '../../context/playlistcontext';

const FALLBACK_AVATAR = "https://i.pinimg.com/736x/6c/41/cb/6c41cb3ae4d97eeb68ee2279fe0e0c6f.jpg";

const MOCK_ARTISTS = [
  { id: 'mock-a1', name: 'Pritam', cover_url: 'https://i.scdn.co/image/ab6761610000e5ebcb690b22decddb548fe030e4', bio: 'Artist' },
  { id: 'mock-a2', name: 'Arijit Singh', cover_url: 'https://i.scdn.co/image/ab6761610000e5eb197e3e2999e2b10d73f7cfd0', bio: 'Artist' },
  { id: 'mock-a3', name: 'Vishal Mishra', cover_url: 'https://i.scdn.co/image/ab6761610000e5ebdbfa6f54c8612140be816827', bio: 'Artist' },
  { id: 'mock-a4', name: 'Atif Aslam', cover_url: 'https://i.scdn.co/image/ab6761610000e5eb803efaf311e5824c08c8430b', bio: 'Artist' },
  { id: 'mock-a5', name: 'Sachin-Jigar', cover_url: 'https://i.scdn.co/image/ab6761610000e5ebd7435f3cc83ffbf88bf332c9', bio: 'Artist' },
];

const MOCK_TRACKS = [
  { id: 'mock-t1', title: 'Sadka', artist: 'Vishal-Shekhar, Suraj Jagan, Mahalakshmi Iyer', album: 'I Hate Luv Storys (Original Motion Picture Soundtrack)', duration: 343, cover_url: 'https://i.scdn.co/image/ab67616d0000b27376c66cf1ec5337b56a1b02cc' },
  { id: 'mock-t2', title: 'Laagi Na Choote', artist: 'Sachin-Jigar, Arijit Singh, Shreya Ghoshal', album: 'A Gentleman', duration: 209, cover_url: 'https://i.scdn.co/image/ab67616d0000b273922c06283db856eb0d5885a4' },
  { id: 'mock-t3', title: 'Zaalima', artist: 'Arijit Singh, Harshdeep Kaur', album: 'The Arijit Singh Collection', duration: 299, cover_url: 'https://i.scdn.co/image/ab67616d0000b273b4d4cf525381f215ab7a740f' },
  { id: 'mock-t4', title: 'Kahin To', artist: 'Rashid Ali, Vasundhara Das', album: 'Jaane Tu... Ya Jaane Na', duration: 303, cover_url: 'https://i.scdn.co/image/ab67616d0000b2737e90f230da37f2d5f8489dfb' }
];

export function ProfilePage({ user, onBackToMain }) {
  const navigate = useNavigate();
  const { playSong } = usePlayer();
  const { playlists, selectPlaylist } = usePlaylists();

  const [dbArtists, setDbArtists] = useState([]);
  const [dbHistory, setDbHistory] = useState([]);
  const [isSticky, setIsSticky] = useState(false);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Load Database Artists and History
  useEffect(() => {
    async function loadData() {
      try {
        const artistsData = await getArtists();
        if (Array.isArray(artistsData)) {
          setDbArtists(artistsData);
        }
      } catch (err) {
        console.error("Failed to load artists from database:", err);
      }

      try {
        const historyData = await getListeningHistory();
        if (Array.isArray(historyData)) {
          setDbHistory(historyData);
        }
      } catch (err) {
        console.error("Failed to load listening history from database:", err);
      }
    }
    loadData();
  }, []);

  // Monitor scrolling to toggle sticky header
  useEffect(() => {
    const handleScroll = (e) => {
      const target = e.target;
      // .mainPlaceholder is the scroll container
      if (target.classList && target.classList.contains('App_mainPlaceholder__3rWqJ') || target.tagName === 'MAIN') {
        if (target.scrollTop > 120) {
          setIsSticky(true);
        } else {
          setIsSticky(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowToast(true);
    setShowOptionsDropdown(false);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Determine arrays to render (DB or fallback mock data)
  const artistsToRender = dbArtists.length > 0 ? dbArtists : MOCK_ARTISTS;
  const tracksToRender = dbHistory.length > 0 ? dbHistory.slice(0, 5) : MOCK_TRACKS;
  const playlistCount = playlists ? playlists.length : 0;

  return (
    <div className={styles.profileContainer}>
      {/* Toast Notification */}
      {showToast && (
        <div className={styles.toast}>
          Link copied to clipboard
        </div>
      )}

      {/* Sticky Header */}
      <div className={`${styles.stickyHeader} ${isSticky ? styles.stickyVisible : ''}`}>
        <span className={styles.stickyUsername}>{user?.name || "Profile"}</span>
      </div>

      {/* Profile Info Banner */}
      <div className={styles.banner}>
        <div className={styles.avatarContainer}>
          <img
            src={user?.profile_picture || FALLBACK_AVATAR}
            alt="Profile Avatar"
            className={styles.avatar}
          />
        </div>
        <div className={styles.bannerInfo}>
          <span className={styles.badge}>Profile</span>
          <h1 className={styles.username}>{user?.name || "Username"}</h1>
          <div className={styles.metaData}>
            <span>{playlistCount} Public Playlist{playlistCount !== 1 ? 's' : ''}</span>
            <span className={styles.bullet}>•</span>
            <span>1 Follower</span>
            <span className={styles.bullet}>•</span>
            <span>23 Following</span>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <button
          className={styles.iconButton}
          onClick={() => navigate('/account')}
          title="Account Settings"
        >
          <Settings size={22} />
        </button>

        <div className={styles.dropdownWrapper}>
          <button
            className={styles.iconButton}
            onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
            title="More Options"
          >
            <MoreHorizontal size={22} />
          </button>
          
          {showOptionsDropdown && (
            <div className={styles.optionsDropdown}>
              <button onClick={handleCopyLink}>
                Copy Profile Link
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Page Grid Body */}
      <div className={styles.profileBody}>
        
        {/* Section: Top Artists */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Top artists this month</h2>
              <span className={styles.subtext}>Only visible to you</span>
            </div>
            <button className={styles.showAllBtn}>Show all</button>
          </div>
          <div className={styles.cardsRow}>
            {artistsToRender.map((artist) => (
              <div key={artist.id} className={styles.artistCard}>
                <div className={styles.artistImageWrapper}>
                  <img
                    src={artist.cover_url || artist.profile_image || FALLBACK_AVATAR}
                    alt={artist.name}
                    className={styles.artistImage}
                  />
                  <div className={styles.playOverlay}>
                    <Play fill="black" color="black" size={20} />
                  </div>
                </div>
                <h3>{artist.name}</h3>
                <p>Artist</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Top Tracks */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Top tracks this month</h2>
              <span className={styles.subtext}>Only visible to you</span>
            </div>
            <button className={styles.showAllBtn}>Show all</button>
          </div>
          <div className={styles.tracksList}>
            {tracksToRender.map((track, index) => (
              <div
                key={track.id || track.history_id}
                className={styles.trackRow}
                onClick={() => playSong(track, tracksToRender)}
              >
                <span className={styles.trackIndex}>{index + 1}</span>
                <img
                  src={track.cover_url || FALLBACK_AVATAR}
                  alt={track.title}
                  className={styles.trackCover}
                />
                <div className={styles.trackDetails}>
                  <p className={styles.trackTitle}>{track.title}</p>
                  <p className={styles.trackSubtitle}>
                    <span className={styles.videoBadge}>Music video</span>
                    {track.artist}
                  </p>
                </div>
                <span className={styles.trackAlbum}>{track.album || "Single"}</span>
                <span className={styles.checkIcon}>
                  <Check size={16} color="#1db954" strokeWidth={3} />
                </span>
                <span className={styles.trackDuration}>
                  {formatDuration(track.duration)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Public Playlists */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Public Playlists</h2>
          </div>
          <div className={styles.cardsRow}>
            {playlists && playlists.length > 0 ? (
              playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className={styles.playlistCard}
                  onClick={() => selectPlaylist && selectPlaylist(playlist)}
                >
                  <img
                    src={playlist.cover_url || FALLBACK_AVATAR}
                    alt={playlist.name}
                    className={styles.playlistCover}
                  />
                  <h3>{playlist.name}</h3>
                  <p>{playlist.song_count || 0} songs</p>
                </div>
              ))
            ) : (
              <>
                <div className={styles.playlistCard}>
                  <div className={styles.fallbackPlaylistsCover}>
                    <span style={{ fontSize: '32px' }}>☘️</span>
                  </div>
                  <h3>☘️</h3>
                  <p>2 Followers</p>
                </div>
                <div className={styles.playlistCard}>
                  <div className={styles.fallbackPlaylistsCover} style={{ background: 'linear-gradient(135deg, #7b4397, #dc2430)' }}>
                    <span style={{ fontSize: '28px', fontWeight: 'bold' }}>S</span>
                  </div>
                  <h3>Sukoon</h3>
                  <p>2 Followers</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Section: Followers */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Followers</h2>
          </div>
          <div className={styles.cardsRow}>
            <div className={styles.followerCard}>
              <div className={styles.greyCirclePlaceholder}></div>
              {/* Image and Name are removed/empty per specifications */}
            </div>
          </div>
        </section>

        {/* Section: Following */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Following</h2>
            <button className={styles.showAllBtn}>Show all</button>
          </div>
          <div className={styles.cardsRow}>
            {artistsToRender.slice(0, 3).map((artist) => (
              <div key={`following-${artist.id}`} className={styles.artistCard}>
                <div className={styles.artistImageWrapper}>
                  <img
                    src={artist.cover_url || artist.profile_image || FALLBACK_AVATAR}
                    alt={artist.name}
                    className={styles.artistImage}
                  />
                </div>
                <h3>{artist.name}</h3>
                <p>Artist</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

export default ProfilePage;

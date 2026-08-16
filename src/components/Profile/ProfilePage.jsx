import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, MoreHorizontal, Play, Check, User } from 'lucide-react';
import styles from './ProfilePage.module.css';
import { getArtists, getListeningHistory, getSongs } from '../../services/api';
import { usePlayer } from '../../context/playercontext';
import { usePlaylists } from '../../context/playlistcontext';
import { PlaylistCover } from '../PlaylistCover/PlaylistCover';

const FALLBACK_AVATAR = "https://i.pinimg.com/736x/6c/41/cb/6c41cb3ae4d97eeb68ee2279fe0e0c6f.jpg";

export function ProfilePage({ user, onProfileUpdate, onBackToMain }) {
  const navigate = useNavigate();
  const { playSong } = usePlayer();
  const { playlists, selectPlaylist } = usePlaylists();

  const [dbArtists, setDbArtists] = useState([]);
  const [dbHistory, setDbHistory] = useState([]);
  const [dbSongs, setDbSongs] = useState([]);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Profile Details Edit States
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalName, setModalName] = useState(user?.name || '');
  const [modalPicture, setModalPicture] = useState(user?.profile_picture && !user.profile_picture.includes('googleusercontent.com') ? user.profile_picture : '');
  const [profileImgError, setProfileImgError] = useState(false);
  const [modalImgError, setModalImgError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const modalFileRef = useRef(null);

  useEffect(() => {
    setProfileImgError(false);
  }, [user?.profile_picture]);

  useEffect(() => {
    setModalImgError(false);
  }, [modalPicture]);

  const handleModalFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setModalError('Image file is too large (max 2MB).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setModalPicture(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModalSave = async () => {
    if (!modalName.trim()) {
      setModalError('Name cannot be empty.');
      return;
    }
    setModalError('');
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
      const res = await fetch(`${API_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: modalName,
          email: user?.email,
          phone_number: user?.phone_number,
          profile_picture: modalPicture
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Profile details update failed.');

      onProfileUpdate?.(data.user);
      setShowEditModal(false);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Load Database Artists, History and Real Songs
  useEffect(() => {
    async function loadData() {
      try {
        const historyData = await getListeningHistory();
        if (Array.isArray(historyData)) {
          setDbHistory(historyData);
        }
      } catch (err) {
        console.error("Failed to load listening history from database:", err);
      }

      try {
        const songsData = await getSongs();
        if (Array.isArray(songsData)) {
          setDbSongs(songsData);
        }
      } catch (err) {
        console.error("Failed to load songs from database:", err);
      }

      try {
        const artistsData = await getArtists();
        if (Array.isArray(artistsData)) {
          setDbArtists(artistsData);
        }
      } catch (err) {
        console.error("Failed to load artists from database:", err);
      }
    }
    loadData();
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

  // Render actual user listening history if available; otherwise real database songs
  const tracksToRender = dbHistory.length > 0 ? dbHistory.slice(0, 5) : dbSongs.slice(0, 5);
  const artistsToRender = dbArtists.length > 0
    ? dbArtists
    : (dbSongs.length > 0
        ? Array.from(new Set(dbSongs.map(s => s.artist))).filter(Boolean).slice(0, 5).map((name, idx) => ({
            id: `art-${idx}`,
            name,
            cover_url: dbSongs.find(s => s.artist === name)?.cover_url || FALLBACK_AVATAR
          }))
        : []);
  const playlistCount = playlists ? playlists.length : 0;

  return (
    <div className={styles.profileContainer}>
      {/* Toast Notification */}
      {showToast && (
        <div className={styles.toast}>
          Link copied to clipboard
        </div>
      )}



      {/* Profile Info Banner */}
      <div className={styles.banner}>
        <div className={styles.avatarContainer}>
          <div
            className={`${styles.avatar} ${styles.clickableAvatar}`}
            onClick={() => {
              setModalName(user?.name || '');
              setModalPicture(user?.profile_picture && !user.profile_picture.includes('googleusercontent.com') ? user.profile_picture : '');
              setModalError('');
              setShowEditModal(true);
            }}
            title="Edit profile"
          >
            {user?.profile_picture && !user.profile_picture.includes('googleusercontent.com') && !profileImgError ? (
              <img 
                src={user.profile_picture} 
                alt="Profile Avatar" 
                className={styles.avatarImg} 
                onError={() => setProfileImgError(true)}
              />
            ) : (
              <User size={120} strokeWidth={1.2} />
            )}
            <div className={styles.avatarHoverOverlay}>
              <span>Edit profile</span>
            </div>
          </div>
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
                    onError={(e) => { e.target.src = FALLBACK_AVATAR; }}
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
            {tracksToRender.length > 0 ? (
              tracksToRender.map((track, index) => (
                <div
                  key={track.id || track.history_id || index}
                  className={styles.trackRow}
                  onClick={() => playSong(track, tracksToRender)}
                >
                  <span className={styles.trackIndex}>{index + 1}</span>
                  <img
                    src={track.cover_url || FALLBACK_AVATAR}
                    alt={track.title}
                    className={styles.trackCover}
                    onError={(e) => { e.target.src = FALLBACK_AVATAR; }}
                  />
                  <div className={styles.trackDetails}>
                    <p className={styles.trackTitle}>{track.title}</p>
                    <p className={styles.trackSubtitle}>
                      {track.artist || "Unknown Artist"}
                    </p>
                  </div>
                  <span className={styles.trackAlbum}>{track.album || "Single"}</span>
                  <span className={styles.checkIcon}>
                    <Check size={16} color="#E19FC7" strokeWidth={3} />
                  </span>
                  <span className={styles.trackDuration}>
                    {formatDuration(track.duration)}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ color: '#b3b3b3', padding: '16px 0', fontSize: '14px' }}>
                No top tracks yet. Start listening to music!
              </p>
            )}
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
                  <PlaylistCover
                    playlist={playlist}
                    className={styles.playlistCover}
                    fallbackPlaceholder={FALLBACK_AVATAR}
                  />
                  <h3>{playlist.name}</h3>
                  <p>{playlist.song_count || 0} songs</p>
                </div>
              ))
            ) : (
              <p style={{ color: '#b3b3b3', padding: '16px 0', fontSize: '14px' }}>
                No public playlists created yet.
              </p>
            )}
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
                    onError={(e) => { e.target.src = FALLBACK_AVATAR; }}
                  />
                </div>
                <h3>{artist.name}</h3>
                <p>Artist</p>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Profile Details Modal */}
      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Profile details</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setShowEditModal(false)}
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            {modalError && <div className={styles.modalError}>{modalError}</div>}

            <div className={styles.modalBody}>
              {/* Left Side: Avatar Click-to-upload */}
              <div
                className={styles.modalAvatarContainer}
                onClick={() => modalFileRef.current?.click()}
                title="Choose photo"
              >
                <div className={styles.modalAvatarCircle}>
                  {modalPicture && !modalImgError ? (
                    <img 
                      src={modalPicture} 
                      alt="Profile Preview" 
                      className={styles.modalAvatarImg} 
                      onError={() => setModalImgError(true)}
                    />
                  ) : (
                    <User size={80} strokeWidth={1} />
                  )}
                  <div className={styles.modalAvatarHover}>
                    <span>Choose photo</span>
                  </div>
                </div>
                <input
                  type="file"
                  ref={modalFileRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleModalFileChange}
                />
              </div>

              {/* Right Side: Name Input & Save Button */}
              <div className={styles.modalForm}>
                <div className={styles.inputGroup}>
                  <label htmlFor="modal-name-input" className={styles.visuallyHidden}>Name</label>
                  <input
                    id="modal-name-input"
                    type="text"
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    placeholder="Add a display name"
                    required
                  />
                </div>
                <button
                  className={styles.modalSaveBtn}
                  onClick={handleModalSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            <p className={styles.modalDisclaimer}>
              By proceeding, you agree to give Echord access to the image you choose to upload. Please make sure you have the right to upload the image.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;

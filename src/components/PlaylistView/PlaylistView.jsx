import { useState, useEffect, useRef } from "react";
import styles from "./PlaylistView.module.css";
import placeholder from "../../assets/music-placeholder.jpg";
import { Play, Shuffle, Heart, Search, Check, Plus, Pencil, Trash2, ListPlus } from "lucide-react";
import { usePlayer } from "../../context/PlayerContext";
import { usePlaylists } from "../../context/playlistcontext";
import { searchSongs, addSongToPlaylist, toggleLikeSong, removeSongFromPlaylist, deletePlaylist } from "../../services/api";
import { EditPlaylistModel } from "../EditPlaylistModel/EditPlaylistModel";

export function PlaylistView({ playlist }) {

    const { playSong, isShuffle, toggleShuffle, addToUserQueue } = usePlayer();
    const { refreshSelectedPlaylist, loadPlaylists, selectPlaylist } = usePlaylists();

    const [addSearchQuery, setAddSearchQuery] = useState("");
    const [addSearchResults, setAddSearchResults] = useState([]);
    const [showEditModel, setShowEditModel] = useState(false);
    
    const searchSectionRef = useRef(null);

    if (!playlist) {
        return (
            <div className={styles.empty}>
                Select a playlist
            </div>
        );
    }

    const isSystemPlaylist = ["liked-songs", "trending", "mixes", "featured"].includes(playlist.id);

    const songs = playlist.songs || [];

    const formatDuration = (seconds) => {
        if (!seconds) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const formatTotalDuration = (seconds) => {
        if (!seconds) return "0 min";
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours} hr ${minutes} min`;
        }
        return `${minutes} min`;
    };

    // Load search results when user types in bottom search box
    useEffect(() => {
        if (addSearchQuery.trim() === "") {
            setAddSearchResults([]);
            return;
        }

        const timeout = setTimeout(async () => {
            try {
                const results = await searchSongs(addSearchQuery);
                setAddSearchResults(results);
            } catch (err) {
                console.error(err);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [addSearchQuery]);

    const handleLikeToggle = async (e, songId) => {
        e.stopPropagation();
        try {
            await toggleLikeSong(songId);
            await refreshSelectedPlaylist();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddSong = async (songId) => {
        try {
            await addSongToPlaylist(playlist.id, songId);
            // Refresh this playlist view and sidebar lists
            await refreshSelectedPlaylist();
            await loadPlaylists();
        } catch (err) {
            alert(err.message || "Failed to add song.");
        }
    };

    const handleRemoveSong = async (e, songId) => {
        e.stopPropagation();
        try {
            await removeSongFromPlaylist(playlist.id, songId);
            await refreshSelectedPlaylist();
            await loadPlaylists();
        } catch (err) {
            alert(err.message || "Failed to remove song.");
        }
    };

    const handleDeletePlaylist = async () => {
        if (window.confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
            try {
                await deletePlaylist(playlist.id);
                await loadPlaylists();
                await selectPlaylist(null);
            } catch (err) {
                alert(err.message || "Failed to delete playlist.");
            }
        }
    };

    const focusSearchInput = () => {
        if (searchSectionRef.current) {
            searchSectionRef.current.scrollIntoView({ behavior: 'smooth' });
            const input = searchSectionRef.current.querySelector('input');
            if (input) input.focus();
        }
    };

    return (

        <div className={styles.container}>

            <div className={styles.header}>

                {playlist.id === "liked-songs" ? (
                    <div className={styles.likedSongsCover}>
                        <Heart size={80} fill="white" />
                    </div>
                ) : playlist.id === "trending" ? (
                    <div className={styles.likedSongsCover} style={{ background: "linear-gradient(135deg,#ff5722,#ff9800)" }}>
                        <Play size={80} fill="white" />
                    </div>
                ) : playlist.id === "mixes" ? (
                    <div className={styles.likedSongsCover} style={{ background: "linear-gradient(135deg,#00bcd4,#009688)" }}>
                        <Shuffle size={80} fill="white" />
                    </div>
                ) : playlist.id === "featured" ? (
                    <div className={styles.likedSongsCover} style={{ background: "linear-gradient(135deg,#e91e63,#9c27b0)" }}>
                        <Heart size={80} fill="white" />
                    </div>
                ) : (
                    <div 
                        className={styles.editableCoverContainer}
                        onClick={() => setShowEditModel(true)}
                        title="Change Cover Image"
                    >
                        <img
                            src={playlist.cover_url || placeholder}
                            alt={playlist.name}
                            onError={(e) => {
                                e.target.src = placeholder;
                            }}
                        />
                        <div className={styles.coverOverlay}>
                            <Pencil size={36} />
                            <span>Choose Image</span>
                        </div>
                    </div>
                )}

                <div className={styles.info}>

                    <p className={styles.type}>
                        Playlist
                    </p>

                    <h1 
                        className={!isSystemPlaylist ? styles.editableTitle : ""}
                        onClick={() => !isSystemPlaylist && setShowEditModel(true)}
                        title={!isSystemPlaylist ? "Rename Playlist" : ""}
                    >
                        {playlist.name}
                    </h1>

                    <p className={styles.subtitle}>
                        {playlist.description || "No description"}
                    </p>

                    <p className={styles.metaInfo}>
                        {playlist.song_count} songs • <span>{formatTotalDuration(playlist.total_duration || 0)}</span>
                    </p>

                </div>

            </div>

            <div className={styles.actions}>

                <button
                    className={styles.playButton}
                    onClick={() => {
                        if (songs.length > 0) {
                            playSong(songs[0], songs);
                        }
                    }}
                    title="Play"
                >
                    <Play
                        fill="black"
                        color="black"
                        size={22}
                    />
                </button>

                <button
                    className={`${styles.shuffleButton} ${isShuffle ? styles.shuffleActive : ""}`}
                    onClick={toggleShuffle}
                    title="Shuffle"
                >
                    <Shuffle size={26} />
                </button>

                {!isSystemPlaylist && (
                    <>
                        <button
                            className={styles.editButton}
                            onClick={() => setShowEditModel(true)}
                            title="Edit Details"
                        >
                            <Pencil size={24} />
                        </button>

                        <button
                            className={styles.editButton}
                            onClick={handleDeletePlaylist}
                            title="Delete Playlist"
                            style={{ color: "#b3b3b3" }}
                        >
                            <Trash2 size={24} />
                        </button>
                        
                        <button
                            className={styles.addSongsActionButton}
                            onClick={focusSearchInput}
                            title="Add Songs"
                        >
                            <Plus size={18} style={{ marginRight: 6 }} /> Add Songs
                        </button>
                    </>
                )}

            </div>

            <div className={styles.songList}>

                <div className={styles.songHeader}>
                    <span>#</span>
                    <span>Title</span>
                    <span>Artist</span>
                    <span></span>
                    <span>Duration</span>
                    <span></span>
                </div>

                {songs.map((song, index) => (

                    <div
                        key={song.id}
                        className={styles.songRow}
                        onClick={() => playSong(song, songs)}
                    >

                        <span className={styles.songIndex}>
                            {index + 1}
                        </span>

                        <span className={styles.songTitleCol}>
                            <img
                                src={song.cover_url || placeholder}
                                alt=""
                                onError={(e) => {
                                    e.target.src = placeholder;
                                }}
                            />
                            <span className={styles.songTitle}>{song.title}</span>
                        </span>

                        <span className={styles.songArtist}>
                            {song.artist}
                        </span>

                        <span>
                            <button
                                className={`${styles.likeButton} ${song.is_liked ? styles.liked : ""}`}
                                onClick={(e) => handleLikeToggle(e, song.id)}
                            >
                                <Heart
                                    size={16}
                                    fill={song.is_liked ? "#1db954" : "none"}
                                    color={song.is_liked ? "#1db954" : "#b3b3b3"}
                                />
                            </button>
                        </span>

                        <span className={styles.songDuration}>
                            {formatDuration(song.duration)}
                        </span>

                        <span className={styles.songRemoveCol}>
                            <button
                                className={styles.removeSongButton}
                                onClick={(e) => { e.stopPropagation(); addToUserQueue(song); }}
                                title="Add to queue"
                                style={{ color: "#b3b3b3", marginRight: 4 }}
                            >
                                <ListPlus size={16} />
                            </button>
                            {!isSystemPlaylist && (
                                <button
                                    className={styles.removeSongButton}
                                    onClick={(e) => handleRemoveSong(e, song.id)}
                                    title="Remove from playlist"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </span>

                    </div>

                ))}

            </div>

            {/* Bottom Add Songs Search Section (Only for custom playlists) */}
            {!isSystemPlaylist && (
                <div className={styles.addSongsSection} ref={searchSectionRef}>
                    <h2>Let's add something to your playlist</h2>
                    <p>Search for songs by title, artist, or album</p>
                    
                    <div className={styles.addSearchBox}>
                        <Search size={18} color="#b3b3b3" />
                        <input
                            type="text"
                            placeholder="Search for songs..."
                            value={addSearchQuery}
                            onChange={(e) => setAddSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className={styles.addResultsList}>
                        {addSearchResults.map((song) => (
                            <div key={song.id} className={styles.addSongRow}>
                                <div className={styles.addSongDetails}>
                                    <img 
                                        src={song.cover_url || placeholder} 
                                        alt="" 
                                        className={styles.addSongCover}
                                        onError={(e) => {
                                            e.target.src = placeholder;
                                        }}
                                    />
                                    <div className={styles.addSongInfo}>
                                        <p className={styles.addSongTitle}>{song.title}</p>
                                        <p className={styles.addSongArtist}>{song.artist}</p>
                                    </div>
                                </div>
                                {(() => {
                                    const isAdded = songs.some(s => s.id === song.id);
                                    return (
                                        <button
                                            className={`${styles.addButton} ${isAdded ? styles.addedButton : ""}`}
                                            onClick={() => !isAdded && handleAddSong(song.id)}
                                            style={{
                                                border: isAdded ? "none" : "1px solid #878787",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                width: 32,
                                                height: 32,
                                                borderRadius: "50%",
                                                padding: 0
                                            }}
                                            title={isAdded ? "Added to playlist" : "Add to playlist"}
                                        >
                                            {isAdded ? (
                                                <Check size={18} color="#1db954" strokeWidth={3} />
                                            ) : (
                                                <Plus size={18} />
                                            )}
                                        </button>
                                    );
                                })()}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <EditPlaylistModel 
                isOpen={showEditModel}
                onClose={() => setShowEditModel(false)}
                playlist={playlist}
            />
        </div>

    );

}
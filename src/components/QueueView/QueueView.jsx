import { useState, useRef } from "react";
import {
    GripVertical,
    Heart,
    ListMusic,
    Music2,
    Plus,
    Search,
    Trash2,
    Volume2,
} from "lucide-react";
import styles from "./QueueView.module.css";
import { usePlayer } from "../../context/PlayerContext";
import { getSongs, toggleLikeSong } from "../../services/api";
import placeholder from "../../assets/music-placeholder.jpg";

function formatDuration(seconds) {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export function QueueView() {
    const {
        currentSong,
        queue,
        userQueue,
        addToUserQueue,
        removeFromUserQueue,
        reorderUserQueue,
        clearUserQueue,
        playSong,
        toggleLike,
    } = usePlayer();

    // Drag state
    const dragIndexRef = useRef(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [draggingIndex, setDraggingIndex] = useState(null);

    // Search
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [allSongs, setAllSongs] = useState(null);

    // ---- Drag Handlers ----
    const handleDragStart = (e, index) => {
        dragIndexRef.current = index;
        setDraggingIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverIndex(index);
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        const fromIndex = dragIndexRef.current;
        if (fromIndex === null || fromIndex === dropIndex) return;
        reorderUserQueue(fromIndex, dropIndex);
        dragIndexRef.current = null;
        setDraggingIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        dragIndexRef.current = null;
        setDraggingIndex(null);
        setDragOverIndex(null);
    };

    // ---- Like Toggle in userQueue ----
    const handleLike = async (e, song, index) => {
        e.stopPropagation();
        try {
            await toggleLike(song.id);
        } catch (err) {
            console.error(err);
        }
    };

    // ---- Search for songs to add ----
    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        try {
            if (!allSongs) {
                const songs = await getSongs();
                setAllSongs(songs);
                const filtered = songs.filter(
                    (s) =>
                        s.title.toLowerCase().includes(query.toLowerCase()) ||
                        (s.artist && s.artist.toLowerCase().includes(query.toLowerCase()))
                );
                setSearchResults(filtered.slice(0, 10));
            } else {
                const filtered = allSongs.filter(
                    (s) =>
                        s.title.toLowerCase().includes(query.toLowerCase()) ||
                        (s.artist && s.artist.toLowerCase().includes(query.toLowerCase()))
                );
                setSearchResults(filtered.slice(0, 10));
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Context queue: songs coming up in the active playlist (after current)
    const contextUpcoming = (() => {
        if (!currentSong || !queue.length) return [];
        const idx = queue.findIndex((s) => s.id === currentSong.id);
        if (idx === -1) return queue.slice(0, 8);
        return queue.slice(idx + 1, idx + 9);
    })();

    return (
        <div className={styles.container}>
            <div className={styles.headerGradient} />

            <div className={styles.header}>
                <ListMusic size={28} color="#E19FC7" />
                <h1>Queue</h1>
                {userQueue.length > 0 && (
                    <button className={styles.clearBtn} onClick={clearUserQueue}>
                        Clear queue
                    </button>
                )}
            </div>

            <div className={styles.content}>

                {/* NOW PLAYING */}
                <p className={styles.sectionLabel}>Now playing</p>
                {currentSong ? (
                    <div className={styles.nowPlayingCard}>
                        <img
                            src={currentSong.cover_url || placeholder}
                            alt=""
                            onError={(e) => { e.target.src = placeholder; }}
                        />
                        <div className={styles.nowPlayingInfo}>
                            <strong>{currentSong.title}</strong>
                            <span>{currentSong.artist}</span>
                        </div>
                        <div className={styles.playingBadge}>
                            <Volume2 size={11} /> Playing
                        </div>
                    </div>
                ) : (
                    <div className={styles.emptyNow}>Nothing playing right now</div>
                )}

                {/* NEXT IN QUEUE (user-curated) */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <p className={styles.sectionLabel} style={{ margin: 0 }}>Next in queue</p>
                        {userQueue.length > 0 && (
                            <span className={styles.queueCount}>{userQueue.length} songs</span>
                        )}
                    </div>

                    {userQueue.length === 0 ? (
                        <div className={styles.emptyQueue}>
                            <p>Your queue is empty</p>
                            <span>Search below or use the queue button on any song to add tracks</span>
                        </div>
                    ) : (
                        userQueue.map((song, index) => (
                            <div
                                key={`uq-${song.id}-${index}`}
                                className={`${styles.songRow} ${draggingIndex === index ? styles.dragging : ""} ${dragOverIndex === index ? styles.dragOver : ""}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                                onClick={() => playSong(song)}
                            >
                                <span className={styles.dragHandle} onMouseDown={(e) => e.stopPropagation()}>
                                    <GripVertical size={16} />
                                </span>
                                <span className={styles.songIndex}>{index + 1}</span>
                                <img
                                    className={styles.songImg}
                                    src={song.cover_url || placeholder}
                                    alt=""
                                    onError={(e) => { e.target.src = placeholder; }}
                                />
                                <div className={styles.songInfo}>
                                    <span className={styles.songTitle}>{song.title}</span>
                                    <span className={styles.songArtist}>{song.artist}</span>
                                </div>
                                <span className={styles.songDuration}>{formatDuration(song.duration)}</span>
                                <div className={styles.rowControls}>
                                    <button
                                        className={`${styles.iconBtn} ${song.is_liked ? styles.liked : ""}`}
                                        onClick={(e) => handleLike(e, song, index)}
                                        title="Like"
                                    >
                                        <Heart
                                            size={15}
                                            fill={song.is_liked ? "#870339" : "none"}
                                            color={song.is_liked ? "#870339" : "currentColor"}
                                        />
                                    </button>
                                    <button
                                        className={`${styles.iconBtn} ${styles.removeBtn}`}
                                        onClick={(e) => { e.stopPropagation(); removeFromUserQueue(index); }}
                                        title="Remove from queue"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* NEXT FROM CONTEXT */}
                {contextUpcoming.length > 0 && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <p className={styles.sectionLabel} style={{ margin: 0 }}>Next from playlist</p>
                            <span className={styles.queueCount}>{contextUpcoming.length} upcoming</span>
                        </div>
                        {contextUpcoming.map((song, idx) => (
                            <div
                                key={`ctx-${song.id}-${idx}`}
                                className={styles.contextRow}
                                onClick={() => playSong(song, queue)}
                            >
                                <span className={styles.contextSongIndex}>{idx + 1}</span>
                                <img
                                    className={styles.contextRowImg}
                                    src={song.cover_url || placeholder}
                                    alt=""
                                    onError={(e) => { e.target.src = placeholder; }}
                                />
                                <div className={styles.songInfo}>
                                    <span className={styles.songTitle}>{song.title}</span>
                                    <span className={styles.songArtist}>{song.artist}</span>
                                </div>
                                <span className={styles.songDuration}>{formatDuration(song.duration)}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* SEARCH TO ADD */}
                <div className={styles.addSection}>
                    <h3>Add songs to queue</h3>
                    <div className={styles.searchBar}>
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search for songs..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                    {searchResults.length > 0 && (
                        <div className={styles.searchResults}>
                            {searchResults.map((song) => (
                                <div key={song.id} className={styles.searchResult}>
                                    <img
                                        src={song.cover_url || placeholder}
                                        alt=""
                                        onError={(e) => { e.target.src = placeholder; }}
                                    />
                                    <div className={styles.songInfo}>
                                        <span className={styles.songTitle}>{song.title}</span>
                                        <span className={styles.songArtist}>{song.artist}</span>
                                    </div>
                                    <button
                                        className={styles.addToQueueBtn}
                                        onClick={() => {
                                            addToUserQueue(song);
                                            setSearchQuery("");
                                            setSearchResults([]);
                                        }}
                                        title="Add to queue"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

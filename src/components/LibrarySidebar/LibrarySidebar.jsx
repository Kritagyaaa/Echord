import { useState } from "react";
import { ListFilter, Plus, Search, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

import styles from "./LibrarySidebar.module.css";
import placeholder from "../../assets/music-placeholder.jpg";
import { PlaylistCover } from "../PlaylistCover/PlaylistCover";

import { usePlaylists } from "../../context/playlistcontext";
import { CreatePlaylistModel } from "../CreatePlaylistModel/CreatePlaylistModel";

const filters = ["Playlists", "Artists", "Albums", "Podcasts"];

export function LibrarySidebar({
    onPlaylistSelect,
    selectedPlaylist,
    collapsed,
}) {

    const navigate = useNavigate();

    const [showCreateModel, setShowCreateModel] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchRef = useRef(null);
    const [activeFilter, setActiveFilter] = useState(filters[0]);

    const {
        playlists,
    } = usePlaylists();

    return (

        <aside
            className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}
            aria-label="Your library"
        >

            <div className={styles.sidebarHeader}>

                <div className={styles.libraryTitle}>

                    <h2>Your Library</h2>

                    <span className={styles.tooltip}>
                        Collapse Your Library
                    </span>

                </div>

                <button
    className={styles.createButton}
    type="button"
    onClick={() => setShowCreateModel(true)}
>
    <Plus size={17} strokeWidth={2.5} />
    <span>Create</span>
</button>

            </div>

            <div
                className={styles.filterButtons}
                aria-label="Library filters"
            >

                {filters.map((filter) => (

                    <button
                        key={filter}
                        type="button"
                        className={activeFilter === filter ? styles.filterActive : ""}
                        onClick={() => {
                            setActiveFilter(filter);
                            setSearchQuery("");
                            if (filter === "Artists") {
                                navigate('/browse');
                            }
                        }}
                    >

                        {filter}

                    </button>

                ))}

            </div>

            <div className={styles.sidebarControls}>

                <button
                    className={styles.controlButton}
                    type="button"
                    onClick={() => {
                        setShowSearch(prev => !prev);
                        setTimeout(() => {
                            if (searchRef.current) searchRef.current.focus();
                        }, 0);
                    }}
                >

                    <Search
                        size={18}
                        strokeWidth={2.2}
                    />

                </button>

                {showSearch && (
                    <div className={styles.searchContainer}>
                        <input
                            ref={searchRef}
                            className={styles.searchInput}
                            placeholder="Search playlists..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                    setShowSearch(false);
                                    setSearchQuery("");
                                }
                            }}
                        />
                    </div>
                )}

                <button
                    className={styles.recentsButton}
                    type="button"
                    onClick={() => navigate("/history")}
                >

                    Recents

                    <ListFilter
                        size={18}
                        strokeWidth={2.1}
                    />

                </button>

            </div>

            <div className={styles.libraryList}>

                {activeFilter === "Playlists" ? (

                    <>
                        {/* Liked Songs */}

                        <button
                            className={`${styles.libraryItem} ${
                                selectedPlaylist?.id === "liked-songs"
                                    ? styles.activePlaylist
                                    : ""
                            }`}
                            type="button"
                            onClick={() => onPlaylistSelect({ id: "liked-songs", name: "Liked Songs" })}
                        >

                             <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 6,
                                    background:
                                        "linear-gradient(135deg,#E19FC7,#c4efd9)",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    color: "#870339",
                                }}
                            >

                                <Heart
                                    size={20}
                                    fill="#870339"
                                    color="#870339"
                                />

                            </div>

                            <span className={styles.itemInfo}>

                                <span className={styles.itemTitle}>
                                    Liked Songs
                                </span>

                                <span className={styles.itemSubtitle}>
                                    Playlist
                                </span>

                            </span>

                        </button>

                        {/* User Playlists */}

                        {playlists
                            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((playlist) => (

                            <button
                                key={playlist.id}
                                className={`${styles.libraryItem} ${
                                    selectedPlaylist?.id === playlist.id
                                        ? styles.activePlaylist
                                        : ""
                                }`}
                                type="button"
                                onClick={() => onPlaylistSelect(playlist)}
                            >

                                <PlaylistCover
                                    playlist={playlist}
                                    className={styles.playlistCollage}
                                    fallbackPlaceholder={placeholder}
                                />

                                <span className={styles.itemInfo}>

                                    <span className={styles.itemTitle}>
                                        {playlist.name}
                                    </span>

                                    <span className={styles.itemSubtitle}>
                                        Playlist • {playlist.song_count} songs
                                    </span>

                                </span>

                            </button>

                        ))}
                    </>

                ) : (
                    <div className={styles.unimplementedMessage}>
                        Search for {activeFilter} is not implemented yet.
                    </div>
                )}

            </div>
            <CreatePlaylistModel
                 isOpen={showCreateModel}
                 onClose={() => setShowCreateModel(false)}
             />
        </aside>

    );

}
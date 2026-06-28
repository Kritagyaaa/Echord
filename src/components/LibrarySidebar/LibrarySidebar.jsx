import { useState } from "react";
import { ListFilter, Plus, Search, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

import styles from "./LibrarySidebar.module.css";
import placeholder from "../../assets/music-placeholder.jpg";

import { usePlaylists } from "../../context/playlistcontext";
import { CreatePlaylistModel } from "../CreatePlaylistModel/CreatePlaylistModel";

const filters = ["Playlists", "Artists", "Albums", "Podcasts"];

export function LibrarySidebar({
    onPlaylistSelect,
    selectedPlaylist,
}) {

    const navigate = useNavigate();

    const [showCreateModel, setShowCreateModel] = useState(false);

    const {
        playlists,
    } = usePlaylists();

    return (

        <aside
            className={styles.sidebar}
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
                    >

                        {filter}

                    </button>

                ))}

            </div>

            <div className={styles.sidebarControls}>

                <button
                    className={styles.controlButton}
                    type="button"
                >

                    <Search
                        size={18}
                        strokeWidth={2.2}
                    />

                </button>

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

                {/* Liked Songs */}

                <button
                    className={styles.libraryItem}
                    type="button"
                >

                    <div
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 6,
                            background:
                                "linear-gradient(135deg,#450af5,#8e8ee5,#c4efd9)",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            color: "white",
                        }}
                    >

                        <Heart
                            size={20}
                            fill="white"
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

                {playlists.map((playlist) => (

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

                        <img
                            src={
                                playlist.cover_url ||
                                placeholder
                            }
                            alt=""
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

            </div>
            <CreatePlaylistModel
                 isOpen={showCreateModel}
                 onClose={() => setShowCreateModel(false)}
             />
        </aside>

    );

}
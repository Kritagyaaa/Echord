import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Play, Heart, Clock } from "lucide-react";
import styles from "./BrowseView.module.css";
import { getGenres, getArtists, getSongs, toggleLikeSong } from "../../services/api";
import { usePlayer } from "../../context/playercontext";
import { usePlaylists } from "../../context/playlistcontext";
import placeholder from "../../assets/music-placeholder.jpg";

export function BrowseView() {
    const { playSong } = usePlayer();
    const { refreshSelectedPlaylist } = usePlaylists();

    const [genres, setGenres] = useState([]);
    const [artists, setArtists] = useState([]);
    const [allSongs, setAllSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDetail, setSelectedDetail] = useState(null);

    const [searchParams, setSearchParams] = useSearchParams();
    const typeParam = searchParams.get("type");
    const idParam = searchParams.get("id");

    useEffect(() => {
        if (loading) return;

        if (typeParam && idParam) {
            if (typeParam === "genre") {
                const found = genres.find(g => String(g.id) === String(idParam));
                if (found) {
                    setSelectedDetail({ type: "genre", item: found });
                    return;
                }
            } else if (typeParam === "artist") {
                const found = artists.find(a => String(a.id) === String(idParam));
                if (found) {
                    setSelectedDetail({ type: "artist", item: found });
                    return;
                }
            }
        }
        setSelectedDetail(null);
    }, [typeParam, idParam, genres, artists, loading]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [genresData, artistsData, songsResponse] = await Promise.all([
                getGenres(),
                getArtists(),
                getSongs()
            ]);
            setGenres(genresData || []);
            setArtists(artistsData || []);

            // Extract songs array from songsResponse
            const songsArray = songsResponse || [];
            setAllSongs(songsArray);
        } catch (err) {
            console.error("Failed to load browse data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleLikeToggle = async (e, songId) => {
        e.stopPropagation();
        try {
            await toggleLikeSong(songId);
            // Refresh local song likes state
            await loadData();
            // Refresh sidebar/active views if they need it
            await refreshSelectedPlaylist();
        } catch (err) {
            console.error(err);
        }
    };

    const getGenreGradient = (id) => {
        const gradients = [
            "linear-gradient(135deg, #e8115b, #bc1854)",
            "linear-gradient(135deg, #148a08, #0f5f06)",
            "linear-gradient(135deg, #0d73ec, #0a4f9e)",
            "linear-gradient(135deg, #e91429, #a80a18)",
            "linear-gradient(135deg, #d84000, #9f3000)",
            "linear-gradient(135deg, #8c11e1, #e1118c)",
            "linear-gradient(135deg, #e8115b, #509bf5)",
        ];
        return gradients[id % gradients.length];
    };

    const formatDuration = (secs) => {
        if (!secs) return "0:00";
        const minutes = Math.floor(secs / 60);
        const seconds = Math.floor(secs % 60);
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    if (loading) {
        return (
            <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#b3b3b3' }}>Loading browse options...</p>
            </div>
        );
    }

    // Filter songs to display based on selection
    let songsToDisplay = [];
    if (selectedDetail) {
        if (selectedDetail.type === "genre") {
            songsToDisplay = allSongs.filter(
                s => s.genre === selectedDetail.item.name || s.genre_id === selectedDetail.item.id
            );
        } else if (selectedDetail.type === "artist") {
            songsToDisplay = allSongs.filter(
                s => s.artist === selectedDetail.item.name || s.artist_id === selectedDetail.item.id
            );
        }
    }

    return (
        <div className={styles.container}>
            {!selectedDetail ? (
                // --- BROWSE LIST VIEW ---
                <>
                    <section className={styles.section}>
                        <h2>Genres</h2>
                        <div className={styles.genreGrid}>
                            {genres.map(genre => (
                                <div
                                    key={genre.id}
                                    className={styles.genreCard}
                                    style={{ background: getGenreGradient(genre.id) }}
                                    onClick={() => setSearchParams({ type: "genre", id: genre.id })}
                                >
                                    <h3>{genre.name}</h3>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h2>Creators & Artists</h2>
                        <div className={styles.creatorGrid}>
                            {artists.map(artist => (
                                <div
                                    key={artist.id}
                                    className={styles.creatorCard}
                                    onClick={() => setSearchParams({ type: "artist", id: artist.id })}
                                >
                                    <img
                                        src={artist.cover_url || placeholder}
                                        alt={artist.name}
                                        className={styles.creatorImage}
                                        onError={(e) => {
                                            e.target.src = placeholder;
                                        }}
                                    />
                                    <h3>{artist.name}</h3>
                                </div>
                            ))}
                        </div>
                    </section>
                </>
            ) : (
                // --- DETAIL VIEW ---
                <>
                    <button
                        className={styles.backButton}
                        onClick={() => setSearchParams({})}
                    >
                        <ArrowLeft size={16} /> Back to Browse
                    </button>

                    <div className={styles.header}>
                        {selectedDetail.type === "genre" ? (
                            <div
                                className={styles.genreCover}
                                style={{ background: getGenreGradient(selectedDetail.item.id) }}
                            >
                                {selectedDetail.item.name[0]}
                            </div>
                        ) : (
                            <img
                                src={selectedDetail.item.cover_url || placeholder}
                                alt={selectedDetail.item.name}
                                className={styles.cover}
                                onError={(e) => {
                                    e.target.src = placeholder;
                                }}
                            />
                        )}

                        <div className={styles.info}>
                            <p className={styles.type}>
                                {selectedDetail.type === "genre" ? "Genre" : "Creator"}
                            </p>

                            <h1>{selectedDetail.item.name}</h1>

                            <p className={styles.bio}>
                                {selectedDetail.type === "genre"
                                    ? `All songs in the ${selectedDetail.item.name} genre`
                                    : selectedDetail.item.bio || `${selectedDetail.item.name} is a music creator on Spotify Clone.`}
                            </p>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        {songsToDisplay.length > 0 && (
                            <button
                                className={styles.playButton}
                                onClick={() => playSong(songsToDisplay[0], songsToDisplay)}
                                title="Play all songs"
                            >
                                <Play fill="black" color="black" size={22} />
                            </button>
                        )}
                    </div>

                    <div className={styles.songList}>
                        <div className={styles.songHeader}>
                            <span>#</span>
                            <span>Title</span>
                            <span>Artist</span>
                            <span></span>
                            <span><Clock size={16} /></span>
                        </div>

                        {songsToDisplay.length > 0 ? (
                            songsToDisplay.map((song, index) => (
                                <div
                                    key={song.id}
                                    className={styles.songRow}
                                    onClick={() => playSong(song, songsToDisplay)}
                                >
                                    <span className={styles.songIndex}>
                                        {index + 1}
                                    </span>

                                    <div className={styles.songTitleCol}>
                                        <img
                                            src={song.cover_url || placeholder}
                                            alt=""
                                            onError={(e) => {
                                                e.target.src = placeholder;
                                            }}
                                        />
                                        <span className={styles.songTitle}>{song.title}</span>
                                    </div>

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
                                                fill={song.is_liked ? "#870339" : "none"}
                                                color={song.is_liked ? "#870339" : "#b3b3b3"}
                                            />
                                        </button>
                                    </span>

                                    <span className={styles.songDuration}>
                                        {formatDuration(song.duration)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className={styles.noSongs}>
                                No songs available in this category yet.
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

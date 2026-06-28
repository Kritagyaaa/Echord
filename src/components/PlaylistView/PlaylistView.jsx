import styles from "./PlaylistView.module.css";
import placeholder from "../../assets/music-placeholder.jpg";
import { Play } from "lucide-react";
import { usePlayer } from "../../context/PlayerContext";

export function PlaylistView({ playlist }) {

    const { playSong } = usePlayer();

    if (!playlist) {
        return (
            <div className={styles.empty}>
                Select a playlist
            </div>
        );
    }

    const songs = playlist.songs || [];

    const formatDuration = (seconds) => {

        if (!seconds) return "0:00";

        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;

        return `${mins}:${secs.toString().padStart(2, "0")}`;

    };

    const totalMinutes = Math.floor(
        (playlist.total_duration || 0) / 60
    );

    return (

        <div className={styles.container}>

            <div className={styles.header}>

                <img
                    src={
                        playlist.cover_url ||
                        placeholder
                    }
                    alt={playlist.name}
                    className={styles.cover}
                />

                <div className={styles.info}>

                    <p className={styles.type}>
                        Playlist
                    </p>

                    <h1>
                        {playlist.name}
                    </h1>

                    <p className={styles.subtitle}>
                        {playlist.description || "No description"}
                    </p>

                    <p className={styles.subtitle}>
                        {playlist.song_count} songs • {totalMinutes} min
                    </p>

                </div>

            </div>

            <div className={styles.actions}>

                <button
                    className={styles.playButton}
                    onClick={() => {

                        if (songs.length > 0) {

                            playSong(
                                songs[0],
                                songs
                            );

                        }

                    }}
                >
                    <Play
                        fill="black"
                        color="black"
                    />
                </button>

            </div>

            <div className={styles.songList}>

                <div className={styles.songHeader}>

                    <span>#</span>

                    <span>Title</span>

                    <span>Artist</span>

                    <span>Duration</span>

                </div>

                {songs.map((song, index) => (

                    <div
                        key={song.id}
                        className={styles.songRow}
                        onClick={() =>
                            playSong(
                                song,
                                songs
                            )
                        }
                    >

                        <span>
                            {index + 1}
                        </span>

                        <span>

                            <img
                                src={
                                    song.cover_url ||
                                    placeholder
                                }
                                alt=""
                                style={{
                                    width: 40,
                                    height: 40,
                                    objectFit: "cover",
                                    borderRadius: 4,
                                    marginRight: 10,
                                    verticalAlign: "middle",
                                }}
                            />

                            {song.title}

                        </span>

                        <span>
                            {song.artist}
                        </span>

                        <span>
                            {formatDuration(song.duration)}
                        </span>

                    </div>

                ))}

            </div>

        </div>

    );

}
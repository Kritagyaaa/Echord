import { useState, useEffect } from "react";
import { X, Search, Plus } from "lucide-react";
import styles from "./CreatePlaylistModel.module.css";

import {
    createPlaylist,
    searchSongs,
    addSongToPlaylist,
} from "../../services/api";

import { usePlaylists } from "../../context/playlistcontext";

export function CreatePlaylistModel({
    isOpen,
    onClose,
}) {

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const [search, setSearch] = useState("");
    const [results, setResults] = useState([]);
    const [selectedSongs, setSelectedSongs] = useState([]);

    const { loadPlaylists } = usePlaylists();

    useEffect(() => {

        if (!isOpen) return;

        if (search.trim() === "") {

            setResults([]);
            return;

        }

        const timeout = setTimeout(async () => {

            try {

                const songs = await searchSongs(search);

                setResults(songs);

            } catch (err) {

                console.error(err);

            }

        }, 300);

        return () => clearTimeout(timeout);

    }, [search, isOpen]);

    const addSong = (song) => {

        if (
            selectedSongs.some(
                s => s.id === song.id
            )
        ) return;

        setSelectedSongs(prev => [
            ...prev,
            song,
        ]);

    };

    const handleCreate = async () => {

        if (!name.trim()) {

            alert("Playlist name is required");
            return;

        }

        try {

            // Create playlist
            const playlist = await createPlaylist({

                name,
                description,

            });

            // Add all selected songs
            for (const song of selectedSongs) {

                await addSongToPlaylist(

                    playlist.id,

                    song.id

                );

            }

            await loadPlaylists();

            // Reset form
            setName("");
            setDescription("");
            setSearch("");
            setResults([]);
            setSelectedSongs([]);

            onClose();

        } catch (err) {

            alert(err.message);

        }

    };

    if (!isOpen) return null;

    return (

        <div className={styles.overlay}>

            <div className={styles.model}>

                <div className={styles.header}>

                    <h2>Create Playlist</h2>

                    <button onClick={onClose}>
                        <X size={20} />
                    </button>

                </div>

                <input
                    placeholder="Playlist Name"
                    value={name}
                    onChange={(e) =>
                        setName(e.target.value)
                    }
                />

                <textarea
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) =>
                        setDescription(e.target.value)
                    }
                />

                <div className={styles.searchSection}>

                    <div className={styles.searchBox}>

                        <Search size={18} />

                        <input
                            placeholder="Search Songs..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                    </div>

                    <div className={styles.searchResults}>

                        {results.map(song => (

                            <div
                                key={song.id}
                                className={styles.songResult}
                            >

                                <div>

                                    <strong>{song.title}</strong>

                                    <br />

                                    <small>{song.artist}</small>

                                </div>

                                <button
                                    onClick={() =>
                                        addSong(song)
                                    }
                                >
                                    <Plus size={18} />
                                </button>

                            </div>

                        ))}

                    </div>

                </div>

                <div className={styles.buttons}>

                    <button
                        className={styles.cancel}
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className={styles.create}
                        onClick={handleCreate}
                    >
                        Create
                    </button>

                </div>

            </div>

        </div>

    );

}
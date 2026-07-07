import { useState, useEffect } from "react";
import { X, Search, Plus, Check } from "lucide-react";
import styles from "./CreatePlaylistModel.module.css";

import {
    createPlaylist,
    searchSongs,
    addSongsToPlaylistBulk,
} from "../../services/api";

import { usePlaylists } from "../../context/playlistcontext";
import placeholder from "../../assets/music-placeholder.jpg";

export function CreatePlaylistModel({
    isOpen,
    onClose,
}) {

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [coverUrl, setCoverUrl] = useState("");

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

    const removeSong = (songId) => {
        setSelectedSongs(prev => prev.filter(s => s.id !== songId));
    };

    const handleCreate = async () => {

        if (!name.trim()) {

            alert("Playlist name is required");
            return;

        }

        try {

            // Create playlist with coverUrl
            const playlist = await createPlaylist({

                name,
                description,
                cover_url: coverUrl.trim() ? coverUrl.trim() : null,

            });

            // Add all selected songs in a single bulk request
            if (selectedSongs.length > 0) {
                const songIds = selectedSongs.map(s => s.id);
                await addSongsToPlaylistBulk(playlist.id, songIds);
            }

            await loadPlaylists();

            // Reset form
            setName("");
            setDescription("");
            setCoverUrl("");
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

                <div className={styles.detailsRow}>
                    <div className={styles.coverContainer}>
                        <img 
                            src={coverUrl.trim() ? coverUrl.trim() : placeholder} 
                            alt="Playlist Cover Preview"
                            onError={(e) => {
                                e.target.src = placeholder;
                            }}
                        />
                    </div>

                    <div className={styles.inputsContainer}>
                        <input
                            placeholder="Playlist Name"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                        />

                        <label className={styles.fileInputLabel}>
                            {coverUrl ? "Change Cover Image" : "Choose Cover Image"}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setCoverUrl(reader.result);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        </label>

                        <textarea
                            placeholder="Description (optional)"
                            value={description}
                            onChange={(e) =>
                                setDescription(e.target.value)
                            }
                        />
                    </div>
                </div>

                {selectedSongs.length > 0 && (
                    <div className={styles.selectedSongsContainer}>
                        <h3>Songs to Add ({selectedSongs.length})</h3>
                        <div className={styles.selectedSongsList}>
                            {selectedSongs.map(song => (
                                <div key={song.id} className={styles.selectedSongTag}>
                                    <span>{song.title}</span>
                                    <button onClick={() => removeSong(song.id)}>
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className={styles.searchSection}>

                    <h3>Add songs to start your playlist</h3>

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

                                {(() => {
                                    const isAdded = selectedSongs.some(s => s.id === song.id);
                                    return (
                                        <button
                                            onClick={() =>
                                                isAdded ? removeSong(song.id) : addSong(song)
                                            }
                                            style={{
                                                background: isAdded ? "none" : "#870339",
                                                color: isAdded ? "#E19FC7" : "white"
                                            }}
                                            title={isAdded ? "Added" : "Add"}
                                        >
                                            {isAdded ? (
                                                <Check size={18} strokeWidth={3} />
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
const API_URL = import.meta.env.VITE_API_URL;

export async function getSongs() {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/songs`, { headers });

    if (!response.ok) {
        throw new Error("Failed to fetch songs");
    }

    const data = await response.json();

    return data.songs;
}

export async function searchSongs(query, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        ...(options.headers || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_URL}/songs/search?q=${encodeURIComponent(query)}`,
        {
            ...options,
            headers
        }
    );

    if (!response.ok) {
        throw new Error("Search failed");
    }

    const data = await response.json();

    return Array.isArray(data.songs) ? data.songs : [];
}

export async function getSongStream(songId) {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_URL}/songs/${songId}/stream`,
        { headers }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch stream");
    }

    const data = await response.json();

    return data.streamUrl;
}

export async function getListeningHistory() {
    const token = localStorage.getItem('token');
    if (!token) return [];

    const response = await fetch(`${API_URL}/songs/history`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error("Failed to fetch listening history");
    }

    const data = await response.json();
    return data.songs;
}

export async function getContentRecommendations(songId, recentSongs = []) {

    const response = await fetch(
    `${API_URL}/recommend/content/${songId}`,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            recentSongs,
        }),
    }
);

    if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
    }

    const data = await response.json();

    return data.recommendations;
}

export async function toggleLikeSong(songId) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Unauthorized: Please log in first.");

    const response = await fetch(`${API_URL}/songs/${songId}/like`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to toggle like");
    }

    return await response.json();
}
export async function getLikedSongs() {
    const token = localStorage.getItem('token');
    if (!token) return [];

    const response = await fetch(`${API_URL}/songs/liked`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Failed to fetch liked songs");
    }

    const data = await response.json();
    return data.songs;
}
export async function getPlaylists() {

    const token = localStorage.getItem("token");

    if (!token) return [];

    const response = await fetch(
        `${API_URL}/playlists`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch playlists");
    }

    const data = await response.json();

    return data.playlists;
}
export async function createPlaylist(playlistData) {

    const token = localStorage.getItem("token");

    if (!token) {
        throw new Error("Please login first.");
    }

    const response = await fetch(`${API_URL}/playlists`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(playlistData),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to create playlist.");
    }

    return data.playlist;
}
export async function addSongToPlaylist(
    playlistId,
    songId
) {

    const token = localStorage.getItem("token");

    if (!token) {
        throw new Error("Please login first.");
    }

    const response = await fetch(
        `${API_URL}/playlists/${playlistId}/songs`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                songId,
            }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Failed to add song to playlist."
        );
    }

    return data;
}
export async function getPlaylist(playlistId) {

    const token = localStorage.getItem("token");

    if (!token) {
        throw new Error("Please login first.");
    }

    const response = await fetch(
        `${API_URL}/playlists/${playlistId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Failed to load playlist."
        );
    }

    return data.playlist;
}
export async function updatePlaylist(playlistId, playlistData) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Please login first.");

    const response = await fetch(`${API_URL}/playlists/${playlistId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(playlistData),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to update playlist.");
    }
    return data;
}
export async function deletePlaylist(playlistId) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Please login first.");

    const response = await fetch(`${API_URL}/playlists/${playlistId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to delete playlist.");
    }
    return data;
}
export async function removeSongFromPlaylist(playlistId, songId) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Please login first.");

    const response = await fetch(`${API_URL}/playlists/${playlistId}/songs/${songId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to remove song from playlist.");
    }
    return data;
}
export async function getGenres() {
    const response = await fetch(`${API_URL}/genres`);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch genres.");
    }
    return data.genres;
}

export async function getArtists() {
    const response = await fetch(`${API_URL}/artists`);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch creators.");
    }
    return data.artists;
}
// const API = "http://localhost:5000/api";

// export async function getSongStream(id) {
//     const res = await fetch(`${API}/songs/${id}/stream`);

//     if (!res.ok) {
//         throw new Error("Failed to fetch stream");
//     }

//     return res.json();
// }
const API_URL = "http://localhost:5000/api";

export async function getSongs() {
    const response = await fetch(`${API_URL}/songs`);

    if (!response.ok) {
        throw new Error("Failed to fetch songs");
    }

    const data = await response.json();

    return data.songs;
}

export async function getSongStream(songId) {
    const response = await fetch(
        `${API_URL}/songs/${songId}/stream`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch stream");
    }

    const data = await response.json();

    return data.streamUrl;
}
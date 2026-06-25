const API = "http://localhost:5000/api";

export async function getSongStream(id) {
    const res = await fetch(`${API}/songs/${id}/stream`);

    if (!res.ok) {
        throw new Error("Failed to fetch stream");
    }

    return res.json();
}
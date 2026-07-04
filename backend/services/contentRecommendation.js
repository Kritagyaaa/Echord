const pool = require("../db");

async function getContentRecommendations(songId, recentSongs = []) {

    // Get current song
    const [currentSong] = await pool.query(`
        SELECT
            id,
            title,
            artist_id,
            genre_id,
            play_count
        FROM songs
        WHERE id = ?
    `,[songId]);

    if(currentSong.length === 0){
        return [];
    }

    const song = currentSong[0];

    // Get all other songs
   const excludedSongs = [...new Set(recentSongs)];

   const placeholders = excludedSongs
    .map(() => "?")
    .join(",");

   const [songs] = await pool.query(
    `
    SELECT
        s.id,
        s.title,
        s.artist_id,
        s.genre_id,
        s.play_count,
        s.cover_url,
        a.name AS artist
    FROM songs s
    LEFT JOIN artists a
        ON s.artist_id = a.id
    WHERE s.id NOT IN (${placeholders})
    `,
    excludedSongs
);

    // Calculate similarity score
const recommendations = songs.map((candidate) => {

    let score = 0;

    // Same artist
    if (candidate.artist_id === song.artist_id) {
        score += 5;
    }

    // Same genre
    if (candidate.genre_id === song.genre_id) {
        score += 3;
    }

    // Popular songs bonus
    if (candidate.play_count > 100) {
        score += 2;
    }

    return {
        ...candidate,
        score
    };

});

// Sort by score (highest first)
recommendations.sort((a, b) => b.score - a.score);

// Return top 10
return recommendations.slice(0, 5);
}

module.exports = {
    getContentRecommendations,
};
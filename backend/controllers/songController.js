const pool = require("../db");
const b2Service = require("../services/b2Service");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || 'meowsick-secret-key-123';

/* ==========================
   GET ALL SONGS
========================== */

async function getAllSongs(req, res) {
    try {
        let userId = null;
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id;
            } catch (e) {
                // Ignore token errors and treat as guest
            }
        }

        const [songs] = await pool.query(`
            SELECT
                s.id,
                s.title,
                a.name AS artist,
                a.bio AS artist_bio,
                a.cover_url AS artist_image,
                al.title AS album,
                g.name AS genre,
                s.duration,
                s.b2_key,
                s.cover_url,
                s.play_count,
                s.like_count AS like_count,
                s.created_at,
                IF(? IS NOT NULL, EXISTS(SELECT 1 FROM likes WHERE song_id = s.id AND user_id = ?), 0) AS is_liked
            FROM songs s
            LEFT JOIN artists a
                ON s.artist_id = a.id
            LEFT JOIN albums al
                ON s.album_id = al.id
            LEFT JOIN genres g
                ON s.genre_id = g.id
            ORDER BY s.id DESC
        `, [userId, userId]);

        res.status(200).json({
            success: true,
            count: songs.length,
            songs,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });

    }
}

/* ==========================
   SEARCH SONGS
========================== */

async function searchSongs(req, res) {

    console.log("========== SEARCH REQUEST ==========");
    console.log("Query:", req.query.q);

    try {

        const query = req.query.q;

        if (!query || query.trim() === "") {
            return res.json({
                success: true,
                songs: [],
            });
        }

        const keyword = `%${query}%`;

        console.log("Running SQL...");

        const [songs] = await pool.query(
            `
            SELECT
                s.id,
                s.title,
                a.name AS artist,
                a.bio AS artist_bio,
                a.cover_url AS artist_image,
                al.title AS album,
                g.name AS genre,
                s.duration,
                s.b2_key,
                s.cover_url,
                s.play_count,
                s.created_at
            FROM songs s

            LEFT JOIN artists a
                ON s.artist_id = a.id

            LEFT JOIN albums al
                ON s.album_id = al.id

            LEFT JOIN genres g
                ON s.genre_id = g.id

            WHERE
                s.title LIKE ?
                OR a.name LIKE ?
                OR al.title LIKE ?

            ORDER BY s.title ASC
            `,
            [
                keyword,
                keyword,
                keyword,
            ]
        );

        console.log("Search Success!");
        console.log("Songs Found:", songs.length);

        res.json({
            success: true,
            count: songs.length,
            songs,
        });

    } catch (error) {

        console.log("========== SEARCH ERROR ==========");
        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message,
            errorCode: error.code,
            sqlMessage: error.sqlMessage,
        });

    }
}

/* ==========================
   STREAM SONG
========================== */

async function streamSong(req, res) {

    try {

        const { id } = req.params;

        // Increment play_count
        await pool.query(
            "UPDATE songs SET play_count = play_count + 1 WHERE id = ?",
            [id]
        );

        const [songs] = await pool.query(
            `
            SELECT
                id,
                title,
                b2_key
            FROM songs
            WHERE id = ?
            `,
            [id]
        );

        if (songs.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Song not found",
            });
        }

        const streamUrl =
            await b2Service.getSignedStreamUrl(
                songs[0].b2_key
            );

        res.json({
            success: true,
            songId: songs[0].id,
            title: songs[0].title,
            streamUrl,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to stream song",
        });

    }
}

async function toggleLikeSong(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if like exists
        const [likes] = await pool.query(
            "SELECT * FROM likes WHERE user_id = ? AND song_id = ?",
            [userId, id]
        );

        if (likes.length > 0) {
            // Unlike
            await pool.query(
                "DELETE FROM likes WHERE user_id = ? AND song_id = ?",
                [userId, id]
            );
            // Decrement like_count in songs table
            await pool.query(
                "UPDATE songs SET like_count = CASE WHEN like_count > 0 THEN like_count - 1 ELSE 0 END WHERE id = ?",
                [id]
            );
            return res.status(200).json({ success: true, liked: false });
        } else {
            // Like
            await pool.query(
                "INSERT INTO likes (user_id, song_id) VALUES (?, ?)",
                [userId, id]
            );
            // Increment like_count in songs table
            await pool.query(
                "UPDATE songs SET like_count = like_count + 1 WHERE id = ?",
                [id]
            );
            return res.status(200).json({ success: true, liked: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

module.exports = {
    getAllSongs,
    searchSongs,
    streamSong,
    toggleLikeSong,
};
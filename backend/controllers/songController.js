const pool = require("../db");
const b2Service = require("../services/b2Service");
const jwt = require("jsonwebtoken");
const path = require("path");
const JWT_SECRET = process.env.JWT_SECRET || 'meowsick-secret-key-123';

const CONTENT_EXTENSIONS = {
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'audio/wav': '.wav',
    'audio/x-wav': '.wav',
    'audio/wave': '.wav',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
};

function getFileExtension(filename, mimeType) {
    if (filename) {
        const ext = path.extname(filename);
        if (ext) return ext;
    }
    if (mimeType && CONTENT_EXTENSIONS[mimeType]) {
        return CONTENT_EXTENSIONS[mimeType];
    }
    return '';
}

async function ensureCreatorRecord(user) {
    if (user.role !== 'creator') return null;

    const [rows] = await pool.query('SELECT * FROM creators WHERE email = ?', [user.email]);
    if (rows.length > 0) {
        return rows[0];
    }

    const [result] = await pool.query(
        'INSERT INTO creators (name, email, profile_image) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
        [user.name, user.email, user.profile_picture || null]
    );

    const creatorId = result.insertId;
    const [creatorRows] = await pool.query('SELECT * FROM creators WHERE id = ?', [creatorId]);
    return creatorRows[0];
}

async function findOrCreateArtist(name, creator) {
    const [rows] = await pool.query('SELECT id FROM artists WHERE name = ?', [name]);
    if (rows.length > 0) {
        return rows[0].id;
    }
    const [result] = await pool.query(
        'INSERT INTO artists (name, bio, cover_url) VALUES (?, ?, ?)',
        [name, creator?.name || '', creator?.profile_image || null]
    );
    return result.insertId;
}

async function findOrCreateGenre(name) {
    if (!name) return null;
    const [rows] = await pool.query('SELECT id FROM genres WHERE name = ?', [name]);
    if (rows.length > 0) {
        return rows[0].id;
    }
    const [result] = await pool.query('INSERT INTO genres (name) VALUES (?)', [name]);
    return result.insertId;
}

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

        const formattedSongs = songs.map(s => ({
            ...s,
            cover_url: b2Service.formatCoverUrl(s.cover_url, req)
        }));

        res.status(200).json({
            success: true,
            count: formattedSongs.length,
            songs: formattedSongs,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });

    }
}

async function getCreatorSongs(req, res) {
    try {
        const creator = await ensureCreatorRecord(req.user);
        if (!creator) {
            return res.status(403).json({ success: false, message: 'Creator access required.' });
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
                s.created_at
            FROM songs s
            LEFT JOIN artists a
                ON s.artist_id = a.id
            LEFT JOIN albums al
                ON s.album_id = al.id
            LEFT JOIN genres g
                ON s.genre_id = g.id
            WHERE s.uploaded_by = ?
            ORDER BY s.created_at DESC
        `, [creator.id]);

        const formattedSongs = songs.map(s => ({
            ...s,
            cover_url: b2Service.formatCoverUrl(s.cover_url, req)
        }));

        res.status(200).json({ success: true, count: formattedSongs.length, songs: formattedSongs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

async function uploadCreatorSong(req, res) {
    try {
        const creator = await ensureCreatorRecord(req.user);
        if (!creator) {
            return res.status(403).json({ success: false, message: 'Creator access required.' });
        }

        const {
            title,
            genre,
            audioFileName,
            audioFileType,
            audioBase64,
            coverFileName,
            coverFileType,
            coverBase64,
        } = req.body;

        if (!title || !audioBase64 || !audioFileName) {
            return res.status(400).json({ success: false, message: 'Title and audio file are required.' });
        }

        const artistName = creator.name;
        const artistId = await findOrCreateArtist(artistName, creator);
        const genreId = await findOrCreateGenre(genre || 'Unknown');

        const audioExtension = getFileExtension(audioFileName, audioFileType) || '.mp3';
        const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const audioKey = `songs/${Date.now()}_${safeTitle}${audioExtension}`;
        const audioBuffer = Buffer.from(audioBase64, 'base64');

        await b2Service.uploadFile(audioKey, audioBuffer, audioFileType || 'audio/mpeg');

        let coverUrl = null;
        if (coverBase64 && coverFileName) {
            const coverExtension = getFileExtension(coverFileName, coverFileType) || '.jpg';
            const coverKey = `covers/${Date.now()}_${safeTitle}${coverExtension}`;
            const coverBuffer = Buffer.from(coverBase64, 'base64');
            await b2Service.uploadFile(coverKey, coverBuffer, coverFileType || 'image/jpeg');
            coverUrl = coverKey;
        }

        const [result] = await pool.query(
            `INSERT INTO songs (title, artist_id, genre_id, duration, b2_key, cover_url, uploaded_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, artistId, genreId, 0, audioKey, coverUrl, creator.id]
        );

        const [rows] = await pool.query(
            `SELECT
                s.id,
                s.title,
                a.name AS artist,
                al.title AS album,
                g.name AS genre,
                s.duration,
                s.b2_key,
                s.cover_url,
                s.play_count,
                s.like_count AS like_count,
                s.created_at
            FROM songs s
            LEFT JOIN artists a
                ON s.artist_id = a.id
            LEFT JOIN albums al
                ON s.album_id = al.id
            LEFT JOIN genres g
                ON s.genre_id = g.id
            WHERE s.id = ?`,
            [result.insertId]
        );

        const formattedSong = {
            ...rows[0],
            cover_url: b2Service.formatCoverUrl(rows[0].cover_url, req)
        };

        res.status(201).json({ success: true, song: formattedSong });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Unable to upload song.' });
    }
}

async function deleteCreatorSong(req, res) {
    try {
        const creator = await ensureCreatorRecord(req.user);
        if (!creator) {
            return res.status(403).json({ success: false, message: 'Creator access required.' });
        }

        const songId = Number(req.params.id);
        if (!songId) {
            return res.status(400).json({ success: false, message: 'Invalid song id.' });
        }

        const [rows] = await pool.query('SELECT id, b2_key, cover_url FROM songs WHERE id = ? AND uploaded_by = ?', [songId, creator.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Song not found or not owned by creator.' });
        }

        const song = rows[0];

        // 1. Delete audio file from B2
        if (song.b2_key) {
            try {
                await b2Service.deleteFile(song.b2_key);
                console.log(`Deleted audio file ${song.b2_key} from B2`);
            } catch (b2Error) {
                console.error(`Failed to delete audio file ${song.b2_key} from B2:`, b2Error.message);
            }
        }

        // 2. Delete cover image from B2 if it exists
        if (song.cover_url && song.cover_url.includes('/covers/')) {
            try {
                const coverKey = 'covers/' + song.cover_url.split('/covers/')[1];
                const decodedKey = decodeURIComponent(coverKey);
                await b2Service.deleteFile(decodedKey);
                console.log(`Deleted cover image ${decodedKey} from B2`);
            } catch (b2Error) {
                console.error(`Failed to delete cover image from B2:`, b2Error.message);
            }
        }

        // 3. Delete from database
        await pool.query('DELETE FROM songs WHERE id = ? AND uploaded_by = ?', [songId, creator.id]);

        res.status(200).json({ success: true, message: 'Song deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Unable to delete song.' });
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

        const keyword = `%${query}%`;
        const exactMatch = query;
        const startsWith = `${query}%`;

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

            WHERE
                s.title LIKE ?
                OR a.name LIKE ?
                OR al.title LIKE ?

            ORDER BY
                CASE WHEN s.title = ? THEN 0 ELSE 1 END,
                CASE WHEN s.title LIKE ? THEN 0 ELSE 1 END,
                CASE WHEN a.name LIKE ? THEN 0 ELSE 1 END,
                CASE WHEN s.title LIKE ? THEN 0 ELSE 1 END,
                s.title ASC
            `,
            [
                userId,
                userId,
                keyword,
                keyword,
                keyword,
                exactMatch,
                startsWith,
                startsWith,
                keyword,
            ]
        );

        console.log("Search Success!");
        console.log("Songs Found:", songs.length);

        const formattedSongs = songs.map(s => ({
            ...s,
            cover_url: b2Service.formatCoverUrl(s.cover_url, req)
        }));

        res.json({
            success: true,
            count: formattedSongs.length,
            songs: formattedSongs,
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

        // Try to decode optional token to record history
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

        if (userId) {
            // Insert into history table
            await pool.query(
                "INSERT INTO history (user_id, song_id) VALUES (?, ?)",
                [userId, id]
            );
        }

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

        // Return a server-hosted proxy URL so clients can access audio without
        // relying on B2 CORS or short-lived signed URLs.
        const encodedKey = songs[0].b2_key.split('/').map(encodeURIComponent).join('/');
        const baseUrl = (req.protocol || 'http') + '://' + (req.get('host') || (process.env.SERVER_HOSTPORT || 'localhost:5000'));
        const streamUrl = `${baseUrl}/files/${encodedKey}`;

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

async function getListeningHistory(req, res) {
    try {
        const userId = req.user.id;
        const [history] = await pool.query(`
            SELECT
                h.id AS history_id,
                h.played_at,
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
                EXISTS(SELECT 1 FROM likes WHERE song_id = s.id AND user_id = ?) AS is_liked
            FROM (
                SELECT max(id) AS max_id
                FROM history
                WHERE user_id = ?
                GROUP BY song_id
            ) latest_history
            JOIN history h
                ON h.id = latest_history.max_id
            JOIN songs s
                ON h.song_id = s.id
            LEFT JOIN artists a
                ON s.artist_id = a.id
            LEFT JOIN albums al
                ON s.album_id = al.id
            LEFT JOIN genres g
                ON s.genre_id = g.id
            ORDER BY h.played_at DESC
            LIMIT 50
        `, [userId, userId]);

        const formattedHistory = history.map(s => ({
            ...s,
            cover_url: b2Service.formatCoverUrl(s.cover_url, req)
        }));

        res.status(200).json({
            success: true,
            count: formattedHistory.length,
            songs: formattedHistory,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}

async function getLikedSongs(req, res) {
    try {
        const userId = req.user.id;
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
                1 AS is_liked
            FROM likes l
            JOIN songs s ON l.song_id = s.id
            LEFT JOIN artists a ON s.artist_id = a.id
            LEFT JOIN albums al ON s.album_id = al.id
            LEFT JOIN genres g ON s.genre_id = g.id
            WHERE l.user_id = ?
            ORDER BY l.liked_at DESC
        `, [userId]);

        const formattedSongs = songs.map(s => ({
            ...s,
            cover_url: b2Service.formatCoverUrl(s.cover_url, req)
        }));

        res.status(200).json({
            success: true,
            count: formattedSongs.length,
            songs: formattedSongs,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}

module.exports = {
    getAllSongs,
    getCreatorSongs,
    uploadCreatorSong,
    deleteCreatorSong,
    searchSongs,
    streamSong,
    toggleLikeSong,
    getListeningHistory,
    getLikedSongs,
};
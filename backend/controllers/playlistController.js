const db = require("../db");
const fs = require("fs");
const path = require("path");
const storageService = require("../services/storageService");

async function saveBase64Image(base64String, req) {
    if (!base64String) return null;
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) {
        return base64String;
    }
    const type = matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    const extension = type.split("/")[1] || "png";
    const filename = `playlist-${Date.now()}-${Math.floor(Math.random() * 10000)}.${extension}`;
    const key = `covers/${filename}`;

    try {
        await storageService.uploadFile(key, buffer, type);
        return storageService.getProxyUrl(key, req);
    } catch (err) {
        console.error("Failed to upload playlist image to B2, falling back to local file:", err);
        const uploadsDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        fs.writeFileSync(path.join(uploadsDir, filename), buffer);
        const protocol = req.protocol || "http";
        const host = req.get("host") || "localhost:5000";
        return `${protocol}://${host}/uploads/${filename}`;
    }
}

// ==========================================
// CREATE PLAYLIST
// ==========================================

exports.createPlaylist = async (req, res) => {

    try {

        let {
            name,
            description,
            cover_url,
        } = req.body;

        const userId = req.user.id;

        if (cover_url && cover_url.startsWith("data:image/")) {
            cover_url = await saveBase64Image(cover_url, req);
        }

        if (!name || name.trim() === "") {

            return res.status(400).json({
                success: false,
                message: "Playlist name is required",
            });

        }

        const [result] = await db.execute(

            `
            INSERT INTO playlists
            (
                user_id,
                name,
                description,
                cover_url
            )
            VALUES (?, ?, ?, ?)
            `,

            [
                userId,
                name,
                description || null,
                cover_url || null,
            ]

        );

        res.status(201).json({

            success: true,

            message: "Playlist created successfully.",

            playlist: {

                id: result.insertId,
                user_id: userId,
                name,
                description,
                cover_url,

            }

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: "Failed to create playlist.",

        });

    }

};

// ==========================================
// ADD SONG TO PLAYLIST
// ==========================================

exports.addSongToPlaylist = async (req, res) => {

    try {

        const { playlistId } = req.params;
        const { songId } = req.body;

        const userId = req.user.id;

        // Verify playlist belongs to user
        const [playlist] = await db.execute(
            `
            SELECT id
            FROM playlists
            WHERE id = ?
            AND user_id = ?
            `,
            [playlistId, userId]
        );

        if (playlist.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Playlist not found."
            });

        }

        // Check duplicate
        const [exists] = await db.execute(
            `
            SELECT id
            FROM playlist_songs
            WHERE playlist_id = ?
            AND song_id = ?
            `,
            [playlistId, songId]
        );

        if (exists.length > 0) {

            return res.status(400).json({
                success: false,
                message: "Song already exists in playlist."
            });

        }

        await db.execute(
            `
            INSERT INTO playlist_songs
            (
                playlist_id,
                song_id
            )
            VALUES (?, ?)
            `,
            [
                playlistId,
                songId
            ]
        );

        res.json({
            success: true,
            message: "Song added successfully."
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Failed to add song."
        });

    }

};

// ==========================================
// GET USER PLAYLISTS
// ==========================================

exports.getUserPlaylists = async (req, res) => {

    try {

        const userId = req.user.id;

        const [rows] = await db.execute(

            `
            SELECT
                p.id,
                p.name,
                p.cover_url,
                p.created_at,
                COUNT(ps.song_id) AS song_count,
                GROUP_CONCAT(s.cover_url ORDER BY ps.id ASC SEPARATOR '|||') AS song_covers
            FROM playlists p

            LEFT JOIN playlist_songs ps
                ON p.id = ps.playlist_id

            LEFT JOIN songs s
                ON ps.song_id = s.id

            WHERE p.user_id = ?

            GROUP BY p.id

            ORDER BY p.created_at DESC
            `,

            [userId]

        );

        const playlists = rows.map(row => {
            const song_covers = row.song_covers ? row.song_covers.split('|||') : [];
            const formattedCovers = song_covers.filter(Boolean).map(c => storageService.formatCoverUrl(c, req));
            return {
                id: row.id,
                name: row.name,
                cover_url: row.cover_url,
                created_at: row.created_at,
                song_count: row.song_count,
                song_covers: formattedCovers
            };
        });

        res.json({
            success: true,
            playlists,
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Failed to fetch playlists",
        });

    }

};
// ==========================================
// GET SINGLE PLAYLIST
// ==========================================

exports.getPlaylistById = async (req, res) => {

    try {

        const userId = req.user.id;
        const playlistId = req.params.id;

        // Playlist info
        const [playlistRows] = await db.execute(

            `
            SELECT
                id,
                name,
                description,
                cover_url,
                created_at
            FROM playlists
            WHERE id = ?
            AND user_id = ?
            `,

            [
                playlistId,
                userId,
            ]

        );

        if (playlistRows.length === 0) {

            return res.status(404).json({

                success: false,
                message: "Playlist not found."

            });

        }

        // Songs
        const [songs] = await db.execute(

            `
            SELECT

                songs.id,
                songs.title,
                songs.duration,
                songs.cover_url,

                artists.name AS artist,

                playlist_songs.position,

                IF(? IS NOT NULL, EXISTS(SELECT 1 FROM likes WHERE song_id = songs.id AND user_id = ?), 0) AS is_liked

            FROM playlist_songs

            JOIN songs
            ON playlist_songs.song_id = songs.id

            JOIN artists
            ON songs.artist_id = artists.id

            WHERE playlist_songs.playlist_id = ?

            ORDER BY playlist_songs.position
            `,

            [
                userId,
                userId,
                playlistId
            ]

        );

        const totalDuration = songs.reduce(

            (sum, song) => sum + (song.duration || 0),

            0

        );

        const formattedSongs = songs.map(s => ({
            ...s,
            cover_url: storageService.formatCoverUrl(s.cover_url, req)
        }));

        res.json({

            success: true,

            playlist: {

                ...playlistRows[0],

                songs: formattedSongs,

                song_count: formattedSongs.length,

                total_duration: totalDuration,

            }

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            message: "Failed to load playlist."

        });

    }

};

exports.updatePlaylist = async (req, res) => {
    try {
        const playlistId = req.params.id;
        let { name, description, cover_url } = req.body;
        const userId = req.user.id;

        if (cover_url && cover_url.startsWith("data:image/")) {
            cover_url = await saveBase64Image(cover_url, req);
        }

        // Verify ownership
        const [playlist] = await db.execute(
            "SELECT id FROM playlists WHERE id = ? AND user_id = ?",
            [playlistId, userId]
        );

        if (playlist.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Playlist not found or access denied."
            });
        }

        if (!name || name.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Playlist name is required."
            });
        }

        await db.execute(
            `UPDATE playlists 
             SET name = ?, description = ?, cover_url = ? 
             WHERE id = ?`,
            [
                name, 
                description && description.trim() !== "" ? description : null, 
                cover_url && cover_url.trim() !== "" ? cover_url : null, 
                playlistId
            ]
        );

        res.json({
            success: true,
            message: "Playlist updated successfully."
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to update playlist."
        });
    }
};

exports.deletePlaylist = async (req, res) => {
    try {
        const playlistId = req.params.id;
        const userId = req.user.id;

        // Verify ownership
        const [playlist] = await db.execute(
            "SELECT id FROM playlists WHERE id = ? AND user_id = ?",
            [playlistId, userId]
        );

        if (playlist.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Playlist not found or access denied."
            });
        }

        await db.execute(
            "DELETE FROM playlists WHERE id = ?",
            [playlistId]
        );

        res.json({
            success: true,
            message: "Playlist deleted successfully."
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to delete playlist."
        });
    }
};

exports.removeSongFromPlaylist = async (req, res) => {
    try {
        const { playlistId, songId } = req.params;
        const userId = req.user.id;

        // Verify ownership
        const [playlist] = await db.execute(
            "SELECT id FROM playlists WHERE id = ? AND user_id = ?",
            [playlistId, userId]
        );

        if (playlist.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Playlist not found or access denied."
            });
        }

        await db.execute(
            "DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?",
            [playlistId, songId]
        );

        res.json({
            success: true,
            message: "Song removed from playlist successfully."
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to remove song from playlist."
        });
    }
};

exports.addSongsToPlaylistBulk = async (req, res) => {
    try {
        const { playlistId } = req.params;
        const { songIds } = req.body;
        const userId = req.user.id;

        if (!Array.isArray(songIds) || songIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Song IDs must be a non-empty array."
            });
        }

        // Verify ownership
        const [playlist] = await db.execute(
            "SELECT id FROM playlists WHERE id = ? AND user_id = ?",
            [playlistId, userId]
        );

        if (playlist.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Playlist not found or access denied."
            });
        }

        // Perform bulk insert, skipping duplicates
        const values = [];
        const placeholders = songIds.map(songId => {
            values.push(playlistId, songId);
            return "(?, ?)";
        }).join(", ");

        const query = `
            INSERT IGNORE INTO playlist_songs (playlist_id, song_id)
            VALUES ${placeholders}
        `;

        await db.execute(query, values);

        res.json({
            success: true,
            message: `${songIds.length} songs processed successfully.`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to add songs to playlist in bulk."
        });
    }
};
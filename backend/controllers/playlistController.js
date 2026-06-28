const db = require("../db");

// ==========================================
// CREATE PLAYLIST
// ==========================================

exports.createPlaylist = async (req, res) => {

    try {

        const {
            name,
            description,
            cover_url,
        } = req.body;

        const userId = req.user.id;

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
                COUNT(ps.song_id) AS song_count
            FROM playlists p

            LEFT JOIN playlist_songs ps
                ON p.id = ps.playlist_id

            WHERE p.user_id = ?

            GROUP BY p.id

            ORDER BY p.created_at DESC
            `,

            [userId]

        );

        res.json({
            success: true,
            playlists: rows,
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

                playlist_songs.position

            FROM playlist_songs

            JOIN songs
            ON playlist_songs.song_id = songs.id

            JOIN artists
            ON songs.artist_id = artists.id

            WHERE playlist_songs.playlist_id = ?

            ORDER BY playlist_songs.position
            `,

            [
                playlistId
            ]

        );

        const totalDuration = songs.reduce(

            (sum, song) => sum + (song.duration || 0),

            0

        );

        res.json({

            success: true,

            playlist: {

                ...playlistRows[0],

                songs,

                song_count: songs.length,

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
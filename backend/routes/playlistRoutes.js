const express = require("express");
const router = express.Router();

const { authenticateRequest } = require("../authMiddleware");

const {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addSongToPlaylist,
} = require("../controllers/playlistController");

const expressAuth = async (req, res, next) => {
    try {
        await authenticateRequest(req);
        next();
    } catch (error) {
        res.status(error.statusCode || 401).json({
            error: error.message,
        });
    }
};

// ==============================
// GET USER PLAYLISTS
// ==============================

router.get(
    "/",
    expressAuth,
    getUserPlaylists
);

// ==============================
// GET SINGLE PLAYLIST
// ==============================

router.get(
    "/:id",
    expressAuth,
    getPlaylistById
);

// ==============================
// CREATE PLAYLIST
// ==============================

router.post(
    "/",
    expressAuth,
    createPlaylist
);

// ==============================
// ADD SONG TO PLAYLIST
// ==============================

router.post(
    "/:playlistId/songs",
    expressAuth,
    addSongToPlaylist
);

module.exports = router;